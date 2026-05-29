// PROTO-GAME: Tag-dopamine focused playtest.
// Runs N days greedily, then REPORTS on the questions:
//   (1) does the loop offer exciting (uncommon/rare/legendary) tagged units?
//   (2) are quest choices engaging — variety of archetypes/rarities, hard tradeoffs?
//   (3) do captives carry tags worth wanting?
//   (4) does deploy ever find perfect tag matches (the dopamine moment)?

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import {
  newRoster, applyCasualties, type Roster,
} from '../src/roster.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import { refreshLeadBoard, pursueLead, type Lead } from '../src/leads.js';
import { bondedPairsOf, applyBondGrief, pruneStaleGriefHints } from '../src/bonds.js';
import { templateFor } from '../src/scenarioTemplates.js';
import { rollCaptiveTags } from '../src/captiveTags.js';
import type { Tag, TagRarity, Merc } from '../src/types.js';
import type { Captive } from '../src/captive.js';

const PROTO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = join(PROTO_ROOT, 'data');
const TMP = join(tmpdir(), `airaider-tagplay-${process.pid}`);
mkdirSync(TMP, { recursive: true });

const RARITY_RANK: Record<TagRarity, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
const fmtTags = (ts: Tag[]) =>
  ts.map((t) => `${t.rarity[0]}:${t.label}`).join(' ');
const maxRarity = (ts: Tag[]): TagRarity =>
  ts.reduce<TagRarity>((acc, t) => (RARITY_RANK[t.rarity] > RARITY_RANK[acc] ? t.rarity : acc), 'common');

interface Highlight {
  day: number;
  kind: 'tavern-post' | 'captive-captured' | 'lead-rare' | 'lead-legendary' | 'perfect-tag-match';
  detail: string;
}

function pickLead(roster: Roster): Lead | null {
  const affordable = roster.leadBoard.filter((l) => roster.gold >= l.pursueCost);
  if (affordable.length === 0) return null;
  // Greedy: prefer high rarity, then high reward
  return [...affordable].sort((a, b) => {
    const ra = RARITY_RANK[a.rarity as TagRarity] ?? 0;
    const rb = RARITY_RANK[b.rarity as TagRarity] ?? 0;
    if (ra !== rb) return rb - ra;
    return b.rewardGold - a.rewardGold;
  })[0]!;
}

function autoAssign(
  roster: Roster,
  scenario: any,
): { assignments: Array<{ slotId: string; mercId: string }>; perfectMatches: number } | null {
  const deployed = new Set<string>();
  const assignments: Array<{ slotId: string; mercId: string }> = [];
  let perfectMatches = 0;
  for (const slot of scenario.slots) {
    const eligible = roster.mercs.filter((m) => !deployed.has(m.id));
    if (eligible.length === 0) return null;
    const pAttr = slot.preferredAttr;
    const ranked = [...eligible].sort((a, b) => {
      if (pAttr) {
        const av = a.attrs[pAttr]; const bv = b.attrs[pAttr];
        if (av !== bv) return bv - av;
      }
      const aTagHit = a.tags.some((t) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
      const bTagHit = b.tags.some((t) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
      if (aTagHit !== bTagHit) return bTagHit - aTagHit;
      const af = roster.states.get(a.id)?.fatigue ?? 0;
      const bf = roster.states.get(b.id)?.fatigue ?? 0;
      return af - bf;
    });
    const pick = ranked[0]!;
    assignments.push({ slotId: slot.id, mercId: pick.id });
    if (pick.tags.some((t) => slot.preferredTags?.includes(t.id))) perfectMatches += 1;
    deployed.add(pick.id);
  }
  return { assignments, perfectMatches };
}

async function main(): Promise<void> {
  const days = parseInt(process.argv[2] ?? '60', 10);
  const tagPool = loadTags(join(DATA_DIR, 'tags.json'));
  const mercPool = loadMercs(join(DATA_DIR, 'mercs.json'), tagPool);
  const llm = new MockScenarioLLM();
  const roster = newRoster([...mercPool.values()]);
  roster.gold = 10;

  console.log(`=== TAG-DOPAMINE PLAYTEST: ${days} days ===\n`);
  console.log(`Starting roster:`);
  for (const m of roster.mercs) console.log(`  ${m.name.padEnd(12)} ${fmtTags(m.tags)}`);
  console.log('');

  const highlights: Highlight[] = [];
  const seenBenchIds = new Set<string>();
  const seenCaptiveIds = new Set<string>();
  let totalSlots = 0;
  let totalPerfectMatches = 0;
  const leadRarityCount: Record<string, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  const leadArchetypeCount: Record<string, number> = {};
  const captiveTagRarity: Record<TagRarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  const benchTagRarity: Record<TagRarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  let leadsPursued = 0; let leadsOffered = 0;

  for (let i = 0; i < days; i++) {
    const dayCount = roster.dayCount;
    const refreshed = refreshLeadBoard({ board: roster.leadBoard, dayCount });
    roster.leadBoard = [...refreshed.kept, ...refreshed.added];

    // tally lead variety (every refresh)
    for (const l of refreshed.added) {
      leadsOffered += 1;
      leadRarityCount[l.rarity] = (leadRarityCount[l.rarity] ?? 0) + 1;
      leadArchetypeCount[l.archetype] = (leadArchetypeCount[l.archetype] ?? 0) + 1;
      if (l.rarity === 'rare') highlights.push({ day: dayCount, kind: 'lead-rare', detail: `[${l.archetype}] ${l.region} DC${l.dc} reward ${l.rewardGold}g` });
      if (l.rarity === 'legendary') highlights.push({ day: dayCount, kind: 'lead-legendary', detail: `[${l.archetype}] ${l.region} DC${l.dc} reward ${l.rewardGold}g` });
    }

    const lead = pickLead(roster);
    if (!lead) {
      for (const s of roster.states.values()) if (s.fatigue > 0) s.fatigue = Math.max(0, s.fatigue - 1);
      roster.dayCount += 1;
      // still inspect tavern even on rest
    } else {
      const pursued = pursueLead(lead, dayCount);
      if (pursued.ok) {
        leadsPursued += 1;
        const assignRes = autoAssign(roster, pursued.scenario);
        if (assignRes) {
          totalSlots += pursued.scenario.slots.length;
          totalPerfectMatches += assignRes.perfectMatches;
          if (assignRes.perfectMatches === pursued.scenario.slots.length) {
            highlights.push({ day: dayCount, kind: 'perfect-tag-match', detail: `${lead.archetype}/${lead.region}: ALL ${pursued.scenario.slots.length} slots tag-matched` });
          }
          roster.gold -= pursued.goldSpent;
          roster.leadBoard = roster.leadBoard.filter((l) => l.id !== lead.id);
          const scenarioPath = join(TMP, `${pursued.scenario.id}.json`);
          writeFileSync(scenarioPath, JSON.stringify(pursued.scenario));
          const dayPath = join(TMP, `day-${dayCount}-${lead.id}.json`);
          writeFileSync(dayPath, JSON.stringify({
            id: `day-${dayCount}-${lead.id}`,
            name: `${lead.archetype} at ${lead.region}`,
            scenarios: [scenarioPath],
            seed: `pt-${dayCount}-${lead.id}`,
          }));
          const day = loadDay(dayPath);
          const mercsForDay = new Map(roster.mercs.map((m) => [m.id, m]));
          const initialFatigue = new Map([...roster.states.values()].map((s) => [s.id, s.fatigue]));
          const res = await resolveDay({
            day, dayPath, mercs: mercsForDay, llm, initialFatigue, roster,
            assignmentsOverride: () => assignRes.assignments,
          });
          const band = res.scenarios[0]!.band;
          let payout = 0;
          if (band === 'catastrophic-favorable') payout = Math.floor(lead.rewardGold * 1.5);
          else if (band === 'favorable') payout = lead.rewardGold;
          else if (band === 'unfavorable') payout = Math.floor(lead.rewardGold * 0.4);
          roster.gold += payout;
          roster.dayCount += 1;
          for (const [mercId, fatigue] of Object.entries(res.finalFatigue)) {
            const s = roster.states.get(mercId);
            if (s) s.fatigue = fatigue;
          }
          const bondsBefore = bondedPairsOf(roster);
          const allCas = res.scenarios.flatMap((s) => s.casualties);
          const killed = applyCasualties(roster, allCas);
          if (killed.length > 0) applyBondGrief(roster, killed, bondsBefore);
          pruneStaleGriefHints(roster, roster.dayCount);

          // captive grant for 'captive' archetype favorable+ (mirror cliGame)
          if (lead.archetype === 'captive' && (band === 'favorable' || band === 'catastrophic-favorable')) {
            const cap: Captive = {
              id: `cap-${dayCount}-${lead.id}`,
              name: `Captive of ${lead.region}`,
              archetype: 'deserter',
              notoriety: lead.dc as 1 | 2 | 3 | 4 | 5,
              tags: rollCaptiveTags(tagPool, lead.rarity, lead.id),
            };
            roster.captives.push(cap);
          }
        } else {
          roster.dayCount += 1;
        }
      } else {
        roster.dayCount += 1;
      }
    }

    // Inspect tavern bench for newcomers (engine auto-refreshes via day resolver)
    for (const e of roster.hirePool) {
      if (!seenBenchIds.has(e.merc.id)) {
        seenBenchIds.add(e.merc.id);
        const mr = maxRarity(e.merc.tags);
        benchTagRarity[mr] = (benchTagRarity[mr] ?? 0) + 1;
        if (mr === 'rare' || mr === 'legendary' || mr === 'uncommon') {
          highlights.push({
            day: roster.dayCount,
            kind: 'tavern-post',
            detail: `${e.merc.name} (${e.price}g, wage ${e.merc.wage}g) — ${fmtTags(e.merc.tags)}`,
          });
        }
      }
    }
    // Inspect captives for newcomers
    for (const c of roster.captives) {
      if (!seenCaptiveIds.has(c.id)) {
        seenCaptiveIds.add(c.id);
        const mr = c.tags.length > 0 ? maxRarity(c.tags) : 'common';
        captiveTagRarity[mr] = (captiveTagRarity[mr] ?? 0) + 1;
        if (mr === 'rare' || mr === 'legendary' || mr === 'uncommon' || c.tags.length === 0) {
          highlights.push({
            day: roster.dayCount,
            kind: 'captive-captured',
            detail: `${c.name} (noto ${c.notoriety}) — ${c.tags.length === 0 ? '⚠NO TAGS (boring)' : fmtTags(c.tags)}`,
          });
        }
      }
    }

    if (roster.mercs.length === 0) {
      console.log(`\n⚠ All mercs dead at day ${roster.dayCount}.`);
      break;
    }
  }

  // ============ REPORT ============
  console.log(`\n=== REPORT — ${roster.dayCount} days ===\n`);
  console.log(`Final state:  ${roster.mercs.length} mercs alive, ${roster.deceased.length} dead, ${roster.captives.length} captives held, ${roster.gold}g, fort L${roster.fort.level}\n`);

  console.log(`QUESTION 1 — does loop offer exciting tagged units to capture/hire?`);
  console.log(`  Tavern bench across run: ${seenBenchIds.size} unique posts`);
  console.log(`    by max-rarity: ${(['common','uncommon','rare','legendary'] as TagRarity[]).map(r=>`${r}:${benchTagRarity[r]??0}`).join('  ')}`);
  console.log(`  Captives captured: ${seenCaptiveIds.size} unique`);
  console.log(`    by max-rarity: ${(['common','uncommon','rare','legendary'] as TagRarity[]).map(r=>`${r}:${captiveTagRarity[r]??0}`).join('  ')}`);
  console.log('');

  console.log(`QUESTION 2 — are quest choices engaging?`);
  console.log(`  Leads offered: ${leadsOffered}`);
  console.log(`    by rarity:   ${Object.entries(leadRarityCount).map(([k,v])=>`${k}:${v}`).join('  ')}`);
  console.log(`    by archetype: ${Object.entries(leadArchetypeCount).map(([k,v])=>`${k}:${v}`).join('  ')}`);
  console.log(`  Leads pursued: ${leadsPursued} (${((leadsPursued/leadsOffered)*100).toFixed(0)}% of offered)`);
  console.log(`  Tag-match dopamine: ${totalPerfectMatches}/${totalSlots} slots (${totalSlots>0?((totalPerfectMatches/totalSlots)*100).toFixed(0):0}%) got a tag match`);
  console.log('');

  console.log(`HIGHLIGHTS (chronological):`);
  for (const h of highlights.slice(0, 40)) {
    console.log(`  d${String(h.day).padStart(3)}  [${h.kind.padEnd(20)}]  ${h.detail}`);
  }
  if (highlights.length > 40) console.log(`  ... and ${highlights.length - 40} more`);
  console.log('');

  console.log(`FINAL ROSTER:`);
  for (const m of roster.mercs) console.log(`  ${m.name.padEnd(12)} L${m.veterancy}  hp:${m.hp}  ${fmtTags(m.tags)}`);
  if (roster.captives.length > 0) {
    console.log(`\nFINAL CAPTIVES:`);
    for (const c of roster.captives) console.log(`  ${c.name.padEnd(20)} noto:${c.notoriety}  ${fmtTags(c.tags)}`);
  }
  if (roster.hirePool.length > 0) {
    console.log(`\nFINAL BENCH:`);
    for (const e of roster.hirePool) console.log(`  ${e.merc.name.padEnd(12)} ${e.price}g  wage:${e.merc.wage}g  ${fmtTags(e.merc.tags)}`);
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(2); });
