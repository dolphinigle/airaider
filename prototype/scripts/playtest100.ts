// PROTO-GAME: Headless 100-day playtest. Drives the same engine that cliGame
// drives — refreshLeadBoard → pursue → deploy → resolveDay — but with a
// simple greedy strategy so we can stress-test the core loop without I/O.
//
// Usage:  npm exec tsx scripts/playtest100.ts [DAYS]
//         DAYS defaults to 100. Prints per-day summary + final report.

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
import type { Merc } from '../src/types.js';

const PROTO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = join(PROTO_ROOT, 'data');
const TMP = join(tmpdir(), `airaider-playtest-${process.pid}`);
mkdirSync(TMP, { recursive: true });

function pickLead(roster: Roster): Lead | null {
  const affordable = roster.leadBoard.filter((l) => roster.gold >= l.pursueCost);
  if (affordable.length === 0) return null;
  // Greedy: highest reward, tie-break by lowest pursue cost.
  return [...affordable].sort((a, b) => {
    if (a.rewardGold !== b.rewardGold) return b.rewardGold - a.rewardGold;
    return a.pursueCost - b.pursueCost;
  })[0]!;
}

function autoAssign(
  roster: Roster,
  scenario: any,
): Array<{ slotId: string; mercId: string }> | null {
  const deployed = new Set<string>();
  const assignments: Array<{ slotId: string; mercId: string }> = [];
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
      // prefer low fatigue
      const af = roster.states.get(a.id)?.fatigue ?? 0;
      const bf = roster.states.get(b.id)?.fatigue ?? 0;
      return af - bf;
    });
    const pick = ranked[0]!;
    assignments.push({ slotId: slot.id, mercId: pick.id });
    deployed.add(pick.id);
  }
  return assignments;
}

interface DayReport {
  day: number;
  action: 'pursue' | 'rest' | 'skip-no-affordable' | 'skip-not-enough-mercs';
  lead?: { rarity: string; archetype: string; region: string; cost: number; reward: number; dc: number };
  band?: string;
  payout?: number;
  goldAfter: number;
  mercsAlive: number;
  casualties: number;
  fatigueWarn: string[];
}

async function runDay(
  roster: Roster,
  llm: MockScenarioLLM,
): Promise<DayReport> {
  const dayCount = roster.dayCount;

  // refresh board
  const refreshed = refreshLeadBoard({ board: roster.leadBoard, dayCount });
  roster.leadBoard = [...refreshed.kept, ...refreshed.added];

  const lead = pickLead(roster);
  if (!lead) {
    // rest day
    for (const s of roster.states.values()) if (s.fatigue > 0) s.fatigue = Math.max(0, s.fatigue - 1);
    roster.dayCount += 1;
    return {
      day: dayCount, action: 'skip-no-affordable',
      goldAfter: roster.gold, mercsAlive: roster.mercs.length, casualties: 0, fatigueWarn: [],
    };
  }

  const pursued = pursueLead(lead, dayCount);
  if (!pursued.ok) {
    roster.leadBoard = roster.leadBoard.filter((l) => l.id !== lead.id);
    roster.dayCount += 1;
    return {
      day: dayCount, action: 'rest',
      goldAfter: roster.gold, mercsAlive: roster.mercs.length, casualties: 0, fatigueWarn: [],
    };
  }
  const scenario = pursued.scenario;
  const assignments = autoAssign(roster, scenario);
  if (!assignments) {
    roster.dayCount += 1;
    return {
      day: dayCount, action: 'skip-not-enough-mercs',
      goldAfter: roster.gold, mercsAlive: roster.mercs.length, casualties: 0, fatigueWarn: [],
    };
  }

  roster.gold -= pursued.goldSpent;
  roster.leadBoard = roster.leadBoard.filter((l) => l.id !== lead.id);

  // materialize scenario + day fixture
  const scenarioPath = join(TMP, `${scenario.id}.json`);
  writeFileSync(scenarioPath, JSON.stringify(scenario));
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
    assignmentsOverride: () => assignments,
  });

  const band = res.scenarios[0]!.band;
  let payout = 0;
  if (band === 'catastrophic-favorable') payout = Math.floor(lead.rewardGold * 1.5);
  else if (band === 'favorable') payout = lead.rewardGold;
  else if (band === 'unfavorable') payout = Math.floor(lead.rewardGold * 0.4);
  roster.gold += payout;

  // end-of-day wrapping (mirror cliGame.runPlayerDay)
  roster.dayCount += 1;
  for (const [mercId, fatigue] of Object.entries(res.finalFatigue)) {
    const s = roster.states.get(mercId);
    if (s) s.fatigue = fatigue;
  }
  const bondsBefore = bondedPairsOf(roster);
  const allCasualties = res.scenarios.flatMap((s) => s.casualties);
  const killed = applyCasualties(roster, allCasualties);
  if (killed.length > 0) applyBondGrief(roster, killed, bondsBefore);
  pruneStaleGriefHints(roster, roster.dayCount);

  const fatigueWarn: string[] = [];
  for (const s of roster.states.values()) {
    if (s.fatigue >= 3) fatigueWarn.push(`${s.id}:${s.fatigue}`);
  }

  return {
    day: dayCount, action: 'pursue',
    lead: { rarity: lead.rarity, archetype: lead.archetype, region: lead.region, cost: lead.pursueCost, reward: lead.rewardGold, dc: lead.dc },
    band, payout, goldAfter: roster.gold,
    mercsAlive: roster.mercs.length,
    casualties: killed.length,
    fatigueWarn,
  };
}

async function main(): Promise<void> {
  const days = parseInt(process.argv[2] ?? '100', 10);

  const tagPool = loadTags(join(DATA_DIR, 'tags.json'));
  const mercPool = loadMercs(join(DATA_DIR, 'mercs.json'), tagPool);
  const llm = new MockScenarioLLM();

  const roster = newRoster([...mercPool.values()]);
  roster.gold = 10;

  console.log(`=== PLAYTEST: ${days} days, greedy-highest-reward strategy ===`);
  console.log(`Starting: ${roster.mercs.length} mercs, ${roster.gold}g\n`);

  const reports: DayReport[] = [];
  const errors: Array<{ day: number; msg: string }> = [];

  for (let i = 0; i < days; i++) {
    try {
      const rep = await runDay(roster, llm);
      reports.push(rep);
      const tag = rep.lead ? ` [${rep.lead.rarity}/${rep.lead.archetype}/${rep.lead.region}] DC${rep.lead.dc} cost ${rep.lead.cost}g reward ${rep.lead.reward}g → ${rep.band} +${rep.payout ?? 0}g` : '';
      const cas = rep.casualties > 0 ? `  💀${rep.casualties}` : '';
      const warn = rep.fatigueWarn.length > 0 ? `  ⚠fatigue:${rep.fatigueWarn.join(',')}` : '';
      console.log(`Day ${String(rep.day).padStart(3)}  ${rep.action}${tag}  gold:${rep.goldAfter}g mercs:${rep.mercsAlive}${cas}${warn}`);
      if (roster.mercs.length === 0) {
        console.log(`\n⚠ All mercs dead at day ${rep.day}. Run ends.`);
        break;
      }
    } catch (err) {
      const msg = (err as Error).stack ?? (err as Error).message;
      console.error(`!! ERROR on day ${roster.dayCount}: ${msg}`);
      errors.push({ day: roster.dayCount, msg });
      if (errors.length > 5) {
        console.error('Too many errors, aborting.');
        break;
      }
      // try to soldier on
      roster.dayCount += 1;
    }
  }

  // ============ FINAL REPORT ============
  console.log(`\n=== FINAL REPORT ===`);
  console.log(`Days completed: ${reports.length}`);
  console.log(`Final gold: ${roster.gold}g`);
  console.log(`Mercs alive: ${roster.mercs.length}  /  deceased: ${roster.deceased.length}`);
  console.log(`Captives held: ${roster.captives.length}`);
  console.log(`Active errands: ${roster.pendingErrands.length}`);
  console.log(`Active quests: ${roster.activeQuests.length}`);
  console.log(`Fort: L${roster.fort.level} [${roster.fort.upgrades.join(',') || '—'}]`);
  console.log(`Errors: ${errors.length}`);

  const byAction = new Map<string, number>();
  for (const r of reports) byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1);
  console.log(`\nActions: ${[...byAction.entries()].map(([k, v]) => `${k}:${v}`).join('  ')}`);

  const byBand = new Map<string, number>();
  for (const r of reports) if (r.band) byBand.set(r.band, (byBand.get(r.band) ?? 0) + 1);
  console.log(`Bands:   ${[...byBand.entries()].map(([k, v]) => `${k}:${v}`).join('  ')}`);

  const byRarity = new Map<string, number>();
  for (const r of reports) if (r.lead) byRarity.set(r.lead.rarity, (byRarity.get(r.lead.rarity) ?? 0) + 1);
  console.log(`Rarity:  ${[...byRarity.entries()].map(([k, v]) => `${k}:${v}`).join('  ')}`);

  const totalEarned = reports.reduce((s, r) => s + (r.payout ?? 0), 0);
  const totalSpent = reports.reduce((s, r) => s + (r.lead?.cost ?? 0), 0);
  console.log(`Gold flow: earned ${totalEarned}g, pursue-cost ${totalSpent}g, net ${totalEarned - totalSpent}g (plus events/wages)`);

  const totalCasualties = reports.reduce((s, r) => s + r.casualties, 0);
  console.log(`Casualties: ${totalCasualties}`);

  if (errors.length > 0) {
    console.log(`\n!! ERRORS ENCOUNTERED:`);
    for (const e of errors) console.log(`  day ${e.day}: ${e.msg.split('\n')[0]}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(2);
});
