// PROTO-GUI v0.1: command dispatch. Pure function over (state, command).
// All gameplay state transitions flow through here so the AI can curl
// any command and diff the resulting state.

import { z } from 'zod';
import type { Roster } from '../../../prototype/src/roster.js';
import type { RoomDef } from '../../../prototype/src/rooms.js';
import {
  buildRoom as buildRoomLayout,
  excavateCell as excavateCellLayout,
  dungeonCellsWithSpace,
  captiveCellEffects,
} from '../../../prototype/src/fortLayout.js';
import {
  effectOf,
  type CaptiveAction,
} from '../../../prototype/src/captive.js';
import { applyCaptiveEffect as applyCaptiveEffectRoster } from '../../../prototype/src/roster.js';
import { FORMER_CAPTIVE_TAG_ID } from '../../../prototype/src/captive.js';
import { refreshLeadBoard, BASE_RARITY_WEIGHTS } from '../../../prototype/src/leads.js';
import { computePrestige, prestigeTier, tiltRarityWeights } from '../../../prototype/src/prestige.js';
import { refreshHirePool, hireFromPool } from '../../../prototype/src/tavern.js';
import { rngFromString } from '../../../prototype/src/rng.js';

export const CommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('advance-day') }),
  z.object({ kind: z.literal('build-room'), roomId: z.string(), cellIdx: z.number().int().min(0) }),
  z.object({ kind: z.literal('excavate') }),
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
]);
export type Command = z.infer<typeof CommandSchema>;

export interface DispatchResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export function dispatch(
  roster: Roster,
  cmd: Command,
  catalogs: { roomCatalog: Map<string, RoomDef>; tagPool: Map<string, any> },
): DispatchResult {
  const { roomCatalog, tagPool } = catalogs;
  switch (cmd.kind) {
    case 'refresh-leads': {
      const prestige = computePrestige({
        displayedCount: roster.displayedCount,
        legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
        fortLevel: roster.fort.level,
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
    case 'advance-day': {
      // For v0.1 the GUI day-advance is a stub: we just bump the day
      // counter and refresh the lead board. Full resolveDay is a P2
      // milestone — it has heavy LLM hookups and we want the GUI
      // bring-up to verify the wiring first.
      roster.dayCount += 1;
      const prestige = computePrestige({
        displayedCount: roster.displayedCount,
        legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
        fortLevel: roster.fort.level,
      });
      const weights = tiltRarityWeights({ ...BASE_RARITY_WEIGHTS }, prestigeTier(prestige));
      const placedRoomIds = new Set(roster.fort.placedRooms.map((p) => p.roomId));
      const hasScouting = placedRoomIds.has('scouting-post');
      let leadAddedNote = '';
      if (hasScouting) {
        const refresh = refreshLeadBoard({
          board: roster.leadBoard,
          dayCount: roster.dayCount,
          rarityWeights: weights,
        });
        roster.leadBoard = [...refresh.kept, ...refresh.added];
        leadAddedNote = `, leads:${roster.leadBoard.length}`;
      }
      // Tavern bench refresh — gated on tavern being built so the bench
      // doesn't fill up before the player builds one (mirrors CLI rules).
      let hireNote = '';
      if (placedRoomIds.has('tavern')) {
        const rng = rngFromString(`gui-tavern-day${roster.dayCount}`);
        const added = refreshHirePool(roster, rng, tagPool, roster.dayCount);
        if (added.length > 0) hireNote = `, bench+${added.length}`;
      }
      return { ok: true, message: `advanced to day ${roster.dayCount}${leadAddedNote}${hireNote}` };
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
      const res = excavateCellLayout(roster.fort, roster.gold, roster.dayCount);
      if (!res.ok) return { ok: false, error: JSON.stringify(res.error) };
      const newIdx = res.fort.cells[res.fort.cells.length - 1]!.idx;
      roster.fort = res.fort;
      roster.gold = res.gold;
      return { ok: true, message: `excavated cell ${newIdx} (cost ${res.cost}g)` };
    }
    case 'place-captive': {
      const cap = roster.captives.find((c) => c.id === cmd.captiveId);
      if (!cap) return { ok: false, error: `unknown captive ${cmd.captiveId}` };
      if (cmd.cellIdx === null) {
        cap.cellIdx = undefined;
        return { ok: true, message: `unassigned ${cap.id} (to overflow corner)` };
      }
      const free = dungeonCellsWithSpace(
        roster.fort,
        roomCatalog,
        roster.captives.filter((c) => c.id !== cmd.captiveId),
      );
      if (!free.includes(cmd.cellIdx)) {
        return { ok: false, error: `cell ${cmd.cellIdx} is not a free dungeon cell` };
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
  }
}
