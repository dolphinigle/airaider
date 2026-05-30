// PROTO-GUI v0.5: command dispatch. Async — End Day fires LLM calls.
// All gameplay state transitions flow through here so the AI can curl
// any command and diff the resulting state.

import { z } from 'zod';
import type { Roster } from '../../../prototype/src/roster.js';
import type { RoomDef } from '../../../prototype/src/rooms.js';
import {
  buildRoom as buildRoomLayout,
  excavateCell as excavateCellLayout,
  openFloor as openFloorLayout,
  dungeonCellsWithSpace,
  captiveHostableCells,
  captiveCellEffects,
} from '../../../prototype/src/fortLayout.js';
import {
  effectOf,
  type CaptiveAction,
} from '../../../prototype/src/captive.js';
import { applyCaptiveEffect as applyCaptiveEffectRoster } from '../../../prototype/src/roster.js';
import { FORMER_CAPTIVE_TAG_ID } from '../../../prototype/src/captive.js';
import { refreshLeadBoard, BASE_RARITY_WEIGHTS, pursueLead as pursueLeadEngine } from '../../../prototype/src/leads.js';
import { computePrestige, prestigeTier, tiltRarityWeights } from '../../../prototype/src/prestige.js';
import { refreshHirePool, hireFromPool } from '../../../prototype/src/tavern.js';
import { rngFromString } from '../../../prototype/src/rng.js';
import { appendFortLog } from '../../../prototype/src/roster.js';
import { resolveScenario, type Assignment } from '../../../prototype/src/resolver.js';
import { templateFor } from '../../../prototype/src/scenarioTemplates.js';
import { rollCaptiveTags } from '../../../prototype/src/captiveTags.js';
import { totalCapacity, totalRoomPrestige, captiveRoomPrestige } from '../../../prototype/src/fortLayout.js';
import {
  getQuestStore,
  QUEST_EXPIRY_DAYS,
  quoteLead,
  type ResolutionRecord,
} from './quests.js';
import { getScenarioLLM } from './llm.js';
import { flavorCaptive } from './leanLlm.js';

export const CommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('end-day') }),
  z.object({ kind: z.literal('build-room'), roomId: z.string(), cellIdx: z.number().int().min(0) }),
  z.object({ kind: z.literal('excavate'), floor: z.number().int().default(0), side: z.enum(['left', 'right']).default('right') }),
  z.object({ kind: z.literal('open-floor'), direction: z.enum(['up', 'down']) }),
  z.object({
    kind: z.literal('place-captive'),
    captiveId: z.string(),
    cellIdx: z.number().int().min(0).nullable(),
  }),
  z.object({
    kind: z.literal('captive-action'),
    captiveId: z.string(),
    action: z.enum(['ransom', 'sell', 'display', 'recruit', 'execute']),
  }),
  z.object({ kind: z.literal('refresh-leads') }),
  z.object({ kind: z.literal('hire-merc'), mercId: z.string() }),
  z.object({ kind: z.literal('pursue-lead'), leadId: z.string() }),
  z.object({
    kind: z.literal('assign-slot'),
    questId: z.string(),
    slotId: z.string(),
    mercId: z.string().nullable(),
  }),
  z.object({ kind: z.literal('abandon-quest'), questId: z.string() }),
  z.object({ kind: z.literal('clear-resolutions') }),
]);
export type Command = z.infer<typeof CommandSchema>;

export interface DispatchResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function rarityRewardMult(rarity: string): number {
  switch (rarity) {
    case 'legendary': return 1.0;
    case 'rare': return 0.85;
    case 'uncommon': return 0.6;
    default: return 0.35;
  }
}

export async function dispatch(
  roster: Roster,
  cmd: Command,
  catalogs: { roomCatalog: Map<string, RoomDef>; tagPool: Map<string, any> },
): Promise<DispatchResult> {
  const { roomCatalog, tagPool } = catalogs;
  switch (cmd.kind) {
    case 'refresh-leads': {
      const prestige = computePrestige({
        displayedCount: roster.displayedCount,
        legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
        fortLevel: roster.fort.level,
        roomPrestige: totalRoomPrestige(roster.fort, roomCatalog),
        captivePrestige: captiveRoomPrestige(roster.fort, roomCatalog, roster.captives),
      });
      const weights = tiltRarityWeights({ ...BASE_RARITY_WEIGHTS }, prestigeTier(prestige));
      const refresh = refreshLeadBoard({
        board: roster.leadBoard,
        dayCount: roster.dayCount,
        rarityWeights: weights,
      });
      roster.leadBoard = [...refresh.kept, ...refresh.added];
      return { ok: true, message: `kept ${refresh.kept.length}, added ${refresh.added.length}, expired ${refresh.expired.length}` };
    }

    case 'end-day': {
      // Step 1: resolve every fully-assigned pursued quest via the LLM.
      const store = getQuestStore();
      const resolutions: ResolutionRecord[] = [];
      const llm = getScenarioLLM();
      const remainingQuests: typeof store.pursued = [];
      for (const quest of store.pursued) {
        const slotIds = quest.scenario.slots.map((s) => s.id);
        const fullyAssigned = slotIds.every((sid) => quest.assignments[sid]);
        if (!fullyAssigned) {
          remainingQuests.push(quest);
          continue;
        }
        const assignments: Assignment[] = [];
        let missingMerc = false;
        for (const sid of slotIds) {
          const mid = quest.assignments[sid]!;
          const merc = roster.mercs.find((m) => m.id === mid);
          if (!merc) { missingMerc = true; break; }
          assignments.push({ slotId: sid, merc });
        }
        if (missingMerc) {
          // Merc died/left — drop assignments, keep quest for re-assign.
          quest.assignments = {};
          remainingQuests.push(quest);
          continue;
        }
        try {
          const fatigueOf = (mercId: string) => roster.states.get(mercId)?.fatigue ?? 0;
          const tierOf = (mercId: string) => roster.states.get(mercId)?.tier;
          const rng = rngFromString(`gui-quest-${quest.questId}-day${roster.dayCount}`);
          const startedAt = Date.now();
          console.log(
            `[llm] → resolving "${quest.scenario.title}" (${quest.lead.archetype}, DC${quest.lead.dc}, ${quest.lead.rarity}) ` +
            `with ${assignments.map((a) => a.merc.name).join(', ')}`,
          );
          const res = await resolveScenario({
            scenario: quest.scenario,
            assignments,
            llm,
            rng,
            fatigueOf,
            tierOf,
            leadHook: {
              blurb: quest.lead.blurb,
              archetype: quest.lead.archetype,
              region: quest.lead.region,
              rarity: quest.lead.rarity,
            },
          });
          const ms = Date.now() - startedAt;
          console.log(
            `[llm] ← "${quest.scenario.title}" → ${res.band} (${res.heads}/${res.coinsActual} heads, ` +
            `band: ${res.bandReason ?? '—'}) in ${ms}ms`,
          );
          console.log(`[llm]   narrative: ${res.outcomeNarrative.slice(0, 200)}${res.outcomeNarrative.length > 200 ? '…' : ''}`);
          for (const c of res.contributions) {
            const mercName = roster.mercs.find((m) => m.id === c.mercId)?.name ?? c.mercId;
            console.log(`[llm]   · ${mercName}: ${c.line.slice(0, 140)}${c.line.length > 140 ? '…' : ''}`);
          }
          if (res.casualties.length > 0) {
            for (const c of res.casualties) {
              const mercName = roster.mercs.find((m) => m.id === c.mercId)?.name ?? c.mercId;
              console.log(`[llm]   ✗ ${mercName} took ${c.damage} HP — ${c.reason}`);
            }
          }
          // Compute gold reward by band.
          let outcomeKind: ResolutionRecord['outcomeKind'] = 'failure';
          let goldMult = 0;
          switch (res.band) {
            case 'catastrophic-favorable': outcomeKind = 'success'; goldMult = 1.25; break;
            case 'favorable': outcomeKind = 'success'; goldMult = 1.0; break;
            case 'unfavorable': outcomeKind = 'partial'; goldMult = 0.4; break;
            case 'catastrophic': outcomeKind = 'failure'; goldMult = 0; break;
          }
          const goldAwarded = Math.round(quest.lead.rewardGold * goldMult);
          roster.gold += goldAwarded;
          if (quest.lead.rarity === 'legendary' && outcomeKind === 'success') {
            roster.legendaryLeadsCompleted += 1;
          }
          // Fatigue +1 per participating merc.
          for (const a of assignments) {
            const st = roster.states.get(a.merc.id);
            if (st) st.fatigue += 1;
          }
          // Casualty HP damage.
          for (const c of res.casualties) {
            const st = roster.states.get(c.mercId);
            if (st) st.hpDamage += c.damage;
          }
          const contribLines = res.contributions.map((c) => ({
            mercId: c.mercId,
            mercName: roster.mercs.find((m) => m.id === c.mercId)?.name ?? c.mercId,
            line: c.line,
          }));
          const casualtyDetail = res.casualties.map((c) => ({
            mercId: c.mercId,
            mercName: roster.mercs.find((m) => m.id === c.mercId)?.name ?? c.mercId,
            damage: c.damage,
            reason: c.reason,
          }));
          resolutions.push({
            questId: quest.questId,
            scenarioTitle: quest.scenario.title,
            region: quest.lead.region,
            archetype: quest.lead.archetype,
            rarity: quest.lead.rarity,
            rewardGold: quest.lead.rewardGold,
            band: res.band,
            bandReason: res.bandReason,
            outcomeNarrative: res.outcomeNarrative,
            contributions: contribLines,
            rollFaces: res.rollFaces,
            heads: res.heads,
            tails: res.tails,
            coinsActual: res.coinsActual,
            goldAwarded,
            casualties: casualtyDetail,
            outcomeKind,
          });
          appendFortLog(roster, {
            day: roster.dayCount,
            kind: 'note',
            message: `[${quest.lead.rarity}] ${quest.scenario.title}: ${res.band} (+${goldAwarded}g)`,
          });

          // Captive-archetype leads, on favorable+ bands, drop a captive
          // into the dungeon (mirrors prototype/cliGame.ts behaviour).
          if (
            quest.lead.archetype === 'captive' &&
            (res.band === 'favorable' || res.band === 'catastrophic-favorable')
          ) {
            const cap = totalCapacity(roster.fort, roomCatalog, 'dungeon');
            if (roster.captives.length >= cap) {
              appendFortLog(roster, {
                day: roster.dayCount,
                kind: 'note',
                message: `captive from "${quest.scenario.title}" slipped free — no dungeon cell available (${roster.captives.length}/${cap})`,
              });
            } else {
              const freeCells = dungeonCellsWithSpace(roster.fort, roomCatalog, roster.captives);
              const captiveId = `captive-${quest.lead.id}`;
              const notoriety = Math.max(1, quest.lead.dc);
              const rolledTags = rollCaptiveTags(tagPool, quest.lead.rarity, quest.lead.id);

              // Stage E: ask AI to flavor the captive consistent with the lead.
              // Best-effort — falls back to lead-archetype heuristics if no key
              // or if the call fails.
              let flavorName = `Captive of ${quest.lead.region}`;
              let flavorArchetype = quest.lead.archetype === 'captive' ? 'deserter' : quest.lead.archetype;
              let flavorBackstory = quest.lead.blurb;
              const apiKey = process.env.OPENAI_API_KEY;
              if (apiKey) {
                try {
                  const flavor = await flavorCaptive(apiKey, process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4.1-nano', {
                    leadBlurb: quest.lead.blurb,
                    leadArchetype: quest.lead.archetype,
                    leadRegion: quest.lead.region,
                    leadRarity: quest.lead.rarity,
                    notoriety,
                    tagLabels: rolledTags.map((t) => t.label),
                  });
                  flavorName = flavor.name;
                  flavorArchetype = flavor.archetype;
                  flavorBackstory = flavor.backstory;
                } catch (err: any) {
                  console.warn(`[captive-flavor] fell back to heuristic: ${err?.message ?? String(err)}`);
                }
              }
              roster.captives.push({
                id: captiveId,
                name: flavorName,
                archetype: flavorArchetype,
                backstory: flavorBackstory,
                notoriety,
                tags: rolledTags,
                cellIdx: freeCells[0],
              });
              appendFortLog(roster, {
                day: roster.dayCount,
                kind: 'note',
                message: `CAPTIVE TAKEN: ${flavorName} (${flavorArchetype}, notoriety ${notoriety}, ${roster.captives.length}/${cap} cells)`,
              });
              console.log(
                `[captive] taken from "${quest.scenario.title}": ${flavorName} (${flavorArchetype}), notoriety ${notoriety}, tags [${rolledTags.map((t) => t.label).join(', ')}]`,
              );
            }
          }
        } catch (err: any) {
          // Resolution failure (e.g. LLM error) — keep quest, surface error.
          appendFortLog(roster, {
            day: roster.dayCount,
            kind: 'note',
            message: `LLM error resolving ${quest.scenario.title}: ${err?.message ?? String(err)}`,
          });
          remainingQuests.push(quest);
        }
      }

      // Step 2: advance the day counter & expire stale quests.
      roster.dayCount += 1;
      store.pursued = remainingQuests.filter((q) => q.expiresOnDay >= roster.dayCount);
      const expiredCount = remainingQuests.length - store.pursued.length;
      for (const q of remainingQuests) {
        if (q.expiresOnDay < roster.dayCount) {
          appendFortLog(roster, {
            day: roster.dayCount,
            kind: 'note',
            message: `quest "${q.scenario.title}" expired (moment passed)`,
          });
        }
      }
      store.lastResolutions = resolutions;

      // Step 3: refresh lead board & tavern bench (gated as before).
      const placedRoomIds = new Set(roster.fort.placedRooms.map((p) => p.roomId));
      if (placedRoomIds.has('scouting-post')) {
        const prestige = computePrestige({
          displayedCount: roster.displayedCount,
          legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
          fortLevel: roster.fort.level,
          roomPrestige: totalRoomPrestige(roster.fort, roomCatalog),
        captivePrestige: captiveRoomPrestige(roster.fort, roomCatalog, roster.captives),
        });
        const weights = tiltRarityWeights({ ...BASE_RARITY_WEIGHTS }, prestigeTier(prestige));
        const refresh = refreshLeadBoard({
          board: roster.leadBoard,
          dayCount: roster.dayCount,
          rarityWeights: weights,
        });
        roster.leadBoard = [...refresh.kept, ...refresh.added];
      }
      if (placedRoomIds.has('tavern')) {
        const rng = rngFromString(`gui-tavern-day${roster.dayCount}`);
        refreshHirePool(roster, rng, tagPool, roster.dayCount);
      }
      // Idle fatigue recovery: each day, every merc not in a quest recovers 1 fatigue.
      const assignedMercIds = new Set<string>();
      for (const q of store.pursued) {
        for (const mid of Object.values(q.assignments)) if (mid) assignedMercIds.add(mid);
      }
      for (const m of roster.mercs) {
        if (assignedMercIds.has(m.id)) continue;
        const st = roster.states.get(m.id);
        if (st && st.fatigue > 0) st.fatigue -= 1;
      }

      return {
        ok: true,
        message: `day ${roster.dayCount}: resolved ${resolutions.length}, expired ${expiredCount}, pending ${store.pursued.length}`,
      };
    }

    case 'build-room': {
      const def = roomCatalog.get(cmd.roomId);
      if (!def) return { ok: false, error: `unknown room ${cmd.roomId}` };
      const res = buildRoomLayout(roster.fort, roster.gold, def, cmd.cellIdx, roster.dayCount);
      if (!res.ok) return { ok: false, error: JSON.stringify(res.error) };
      roster.fort = res.fort;
      roster.gold = res.gold;
      return { ok: true, message: `built ${cmd.roomId} in cell ${cmd.cellIdx}` };
    }
    case 'excavate': {
      const res = excavateCellLayout(roster.fort, roster.gold, roster.dayCount, { floor: cmd.floor, side: cmd.side });
      if (!res.ok) return { ok: false, error: JSON.stringify(res.error) };
      const newIdx = res.fort.cells[res.fort.cells.length - 1]!.idx;
      roster.fort = res.fort;
      roster.gold = res.gold;
      return { ok: true, message: `excavated cell ${newIdx} on floor ${cmd.floor} (${cmd.side}, cost ${res.cost}g)` };
    }
    case 'open-floor': {
      const res = openFloorLayout(roster.fort, roster.gold, roster.dayCount, cmd.direction);
      if (!res.ok) return { ok: false, error: JSON.stringify(res.error) };
      roster.fort = res.fort;
      roster.gold = res.gold;
      appendFortLog(roster, {
        day: roster.dayCount,
        kind: 'upgrade',
        message: `opened floor ${res.newFloor} (${cmd.direction}, cost ${res.cost}g, 3 fresh cells)`,
      });
      return { ok: true, message: `opened floor ${res.newFloor} (${res.cost}g)` };
    }
    case 'place-captive': {
      const cap = roster.captives.find((c) => c.id === cmd.captiveId);
      if (!cap) return { ok: false, error: `unknown captive ${cmd.captiveId}` };
      if (cmd.cellIdx === null) {
        cap.cellIdx = undefined;
        return { ok: true, message: `unassigned ${cap.id} (to overflow corner)` };
      }
      const hostable = captiveHostableCells(roster.fort, roomCatalog, roster.captives, cmd.captiveId);
      if (!hostable.includes(cmd.cellIdx)) {
        return { ok: false, error: `cell ${cmd.cellIdx} cannot host a captive (full, quarters, or empty)` };
      }
      cap.cellIdx = cmd.cellIdx;
      return { ok: true, message: `placed ${cap.id} in cell ${cmd.cellIdx}` };
    }
    case 'captive-action': {
      const cap = roster.captives.find((c) => c.id === cmd.captiveId);
      if (!cap) return { ok: false, error: `unknown captive ${cmd.captiveId}` };
      const eff = captiveCellEffects(roster.fort, roomCatalog, cap.cellIdx);
      const formerTag = tagPool.get(FORMER_CAPTIVE_TAG_ID);
      const captiveEffect = effectOf(cap, cmd.action as CaptiveAction, {
        fortLevel: roster.fort.level,
        chapelAdjacent: eff.chapelAdjacent,
        smithyAdjacent: eff.smithyAdjacent,
        ...(formerTag ? { formerCaptiveTag: formerTag } : {}),
      });
      if (captiveEffect.blocked) {
        return { ok: false, error: captiveEffect.blocked.reason };
      }
      applyCaptiveEffectRoster(roster, cap, captiveEffect);
      return { ok: true, message: `${cmd.action}: gold ${captiveEffect.goldDelta >= 0 ? '+' : ''}${captiveEffect.goldDelta}g` };
    }
    case 'hire-merc': {
      const idx = roster.hirePool.findIndex((e) => e.merc.id === cmd.mercId);
      if (idx < 0) return { ok: false, error: `merc ${cmd.mercId} not on tavern bench` };
      const entry = roster.hirePool[idx]!;
      if (roster.gold < entry.price) {
        return { ok: false, error: `not enough gold (need ${entry.price}g, have ${roster.gold}g)` };
      }
      try {
        const merc = hireFromPool(roster, idx);
        return { ok: true, message: `hired ${merc.name} for ${entry.price}g` };
      } catch (err: any) {
        return { ok: false, error: err?.message ?? String(err) };
      }
    }

    case 'pursue-lead': {
      const leadIdx = roster.leadBoard.findIndex((l) => l.id === cmd.leadId);
      if (leadIdx < 0) return { ok: false, error: `lead ${cmd.leadId} not on the board` };
      const lead = roster.leadBoard[leadIdx]!;
      if (roster.gold < lead.pursueCost) {
        return { ok: false, error: `not enough gold (need ${lead.pursueCost}g, have ${roster.gold}g)` };
      }
      const pursued = pursueLeadEngine(lead, roster.dayCount);
      if (!pursued.ok) return { ok: false, error: pursued.error };
      const scenario = templateFor(lead);
      roster.gold -= lead.pursueCost;
      roster.leadBoard.splice(leadIdx, 1);
      const store = getQuestStore();
      const questId = `quest-${lead.id}`;
      store.pursued.push({
        questId,
        scenario,
        lead: quoteLead(lead),
        assignments: Object.fromEntries(scenario.slots.map((s) => [s.id, null])),
        pursuedOnDay: roster.dayCount,
        expiresOnDay: roster.dayCount + QUEST_EXPIRY_DAYS,
      });
      appendFortLog(roster, {
        day: roster.dayCount,
        kind: 'note',
        message: `pursued [${lead.rarity}] ${scenario.title} (assign mercs before End Day)`,
      });
      return { ok: true, message: `pursuing ${scenario.title} — assign ${scenario.slots.length} slot(s)` };
    }

    case 'assign-slot': {
      const store = getQuestStore();
      const q = store.pursued.find((x) => x.questId === cmd.questId);
      if (!q) return { ok: false, error: `quest ${cmd.questId} not pursued` };
      if (!q.scenario.slots.find((s) => s.id === cmd.slotId)) {
        return { ok: false, error: `slot ${cmd.slotId} not on quest ${cmd.questId}` };
      }
      if (cmd.mercId !== null) {
        if (!roster.mercs.find((m) => m.id === cmd.mercId)) {
          return { ok: false, error: `merc ${cmd.mercId} not in roster` };
        }
        // Unassign this merc from any OTHER slot (any quest).
        for (const otherQ of store.pursued) {
          for (const sid of Object.keys(otherQ.assignments)) {
            if (otherQ.assignments[sid] === cmd.mercId) otherQ.assignments[sid] = null;
          }
        }
      }
      q.assignments[cmd.slotId] = cmd.mercId;
      return { ok: true, message: cmd.mercId ? `assigned ${cmd.mercId} → ${q.questId}/${cmd.slotId}` : `cleared ${q.questId}/${cmd.slotId}` };
    }

    case 'abandon-quest': {
      const store = getQuestStore();
      const idx = store.pursued.findIndex((q) => q.questId === cmd.questId);
      if (idx < 0) return { ok: false, error: `quest ${cmd.questId} not found` };
      const [removed] = store.pursued.splice(idx, 1);
      appendFortLog(roster, {
        day: roster.dayCount,
        kind: 'note',
        message: `abandoned quest "${removed!.scenario.title}"`,
      });
      return { ok: true, message: `abandoned ${removed!.questId}` };
    }

    case 'clear-resolutions': {
      const store = getQuestStore();
      store.lastResolutions = [];
      return { ok: true, message: 'cleared' };
    }
  }
}
// Silences "unused" warning on this helper kept for future use.
void rarityRewardMult;

