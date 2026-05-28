import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';

import type { Merc } from './types.js';
import type { ScenarioLLM } from './llm/interface.js';
import type { Rng } from './rng.js';
import { rngFromString } from './rng.js';
import { loadScenario, type FixtureScenario } from './scenarios.js';
import {
  resolveScenario,
  type Assignment,
  type ScenarioResolution,
} from './resolver.js';
import type { Roster, RosterPendingErrand, FortLogEntry } from './roster.js';
import { appendFortLog } from './roster.js';
import { dispatchErrand, resolveDueErrands } from './errands.js';
import { applyVeterancyXp, type Promotion } from './veterancy.js';
import { recordCoDeployment, bondedPairsOf, type BondFormation } from './bonds.js';
import { seasonFor, type SeasonClock } from './season.js';
import { loadEventCatalog, rollEventForDay, type DailyEvent } from './events.js';
import { reputationTier } from './reputation.js';

/** M9.1: wages are paid every Nth day (CANONICAL §2.7 flat-wage rule). */
export const WAGE_INTERVAL_DAYS = 7;
/** M9.2: a merc deserts after this many consecutive days of fort debt (gold < 0). */
export const DEBT_DESERTION_THRESHOLD_DAYS = 3;
import { fortEffectsFor, chapelHealsWounds, fatigueRecoveryAmount } from './fortEffects.js';
import { affordableUpgrades, loadFortCatalog, type FortUpgrade } from './fort.js';

const DaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Paths to scenario fixtures, resolved relative to the day fixture file. */
  scenarios: z.array(z.string().min(1)).min(1),
  /** Optional day-level seed; defaults to id. Currently informational only. */
  seed: z.string().optional(),
});

export type Day = z.infer<typeof DaySchema>;

export function loadDay(path: string): Day {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return DaySchema.parse(raw);
}

export interface DayResolutionInput {
  day: Day;
  /** Absolute path of the day fixture file; used to resolve scenario paths. */
  dayPath: string;
  mercs: Map<string, Merc>;
  llm: ScenarioLLM;
  /**
   * Optional RNG factory per scenario; defaults to `rngFromString(scenario.seed)`.
   * Pass a custom one to test reproducibility.
   */
  rngFor?: (scenario: FixtureScenario, index: number) => Rng;
  /** Optional starting fatigue per merc (carries over from previous days). */
  initialFatigue?: Map<string, number>;
  /** M5.4: roster carries pending errands; if provided, errands are dispatched/resolved. */
  roster?: Roster;
}

export interface DayResolution {
  dayId: string;
  dayName: string;
  scenarios: ScenarioResolution[];
  /** Final fatigue per merc after the whole day. */
  finalFatigue: Record<string, number>;
  /** M5.4: errands dispatched today (informational; not yet resolved). */
  errandsDispatched: RosterPendingErrand[];
  /** M5.4: errands that returned and were resolved today. */
  errandsResolved: ScenarioResolution[];
  /** M6.1: veterancy tier crossings during the day (roster-mode only). */
  promotions: Promotion[];
  /** M6.2: pairs that crossed the bond threshold today (roster-mode only). */
  bondsFormed: BondFormation[];
  /** M6.3: season clock at the time of this day (roster-mode only; null otherwise). */
  seasonClock: SeasonClock | null;
  /** M7.4: daily event rolled at the start of the day (null if none / roster-less). */
  dailyEvent: DailyEvent | null;
  /**
   * M7.5: fort upgrades affordable as of end-of-day (roster-mode only).
   * Empty if none. The dayTranscript surfaces these as a FORT HINT block.
   */
  fortHints: Pick<FortUpgrade, 'id' | 'name' | 'cost' | 'description'>[];
  /**
   * M7.10: fatigue recovery applied at end-of-day. Each entry is one merc
   * who was idle (not deployed, not on errand) and shed 1 fatigue. Empty
   * in roster-less mode.
   */
  fatigueRecovery: Array<{ mercId: string; before: number; after: number }>;
  /**
   * M7.12: end-of-day wound healing from the chapel. Empty unless the fort
   * has the chapel upgrade AND idle mercs had hpDamage > 0.
   */
  woundHealing: Array<{ mercId: string; before: number; after: number }>;
  /**
   * M9.1: weekly payday. Non-empty only on days where `(dayCount+1)`
   * is a multiple of WAGE_INTERVAL_DAYS (7) AND the roster has mercs.
   * Each entry records one merc's wage; `wagesTotalPaid` is the sum
   * deducted from `roster.gold` (gold may go negative — debt is allowed
   * for now; future milestones will add desertion / morale loss).
   */
  wagesPaid: Array<{ mercId: string; wage: number }>;
  wagesTotalPaid: number;
  /**
   * M9.2: mercs who deserted at end-of-day because the fort has been in
   * debt for at least `DEBT_DESERTION_THRESHOLD_DAYS` consecutive days.
   * At most one merc deserts per day; the counter resets to 0 afterwards
   * so the next desertion needs another full debt streak. Empty when the
   * fort is solvent or has no mercs.
   */
  desertions: Array<{ mercId: string; reason: string }>;
  /**
   * M7.6: fort log entries appended during THIS day (currently only the
   * daily-event entry; upgrade purchases happen via the fort CLI, not the day
   * loop). Empty in roster-less mode.
   */
  newFortLogEntries: FortLogEntry[];
}

/**
 * Runs the day's scenarios sequentially with a shared roster.
 * Fatigue accumulates per merc (+1 per scenario participated in).
 * computeSlotContributions applies a penalty when fatigue ≥ FATIGUE_THRESHOLD.
 */
export async function resolveDay(input: DayResolutionInput): Promise<DayResolution> {
  const { day, dayPath, mercs, llm, rngFor, initialFatigue, roster } = input;
  const fatigue = new Map<string, number>(initialFatigue ?? []);
  const fatigueOf = (mercId: string): number => fatigue.get(mercId) ?? 0;
  const tierOf = roster
    ? (mercId: string) => roster.states.get(mercId)?.tier
    : undefined;

  const fixturesDir = dirname(resolve(dayPath));
  const scenarioResolutions: ScenarioResolution[] = [];
  const errandsDispatched: RosterPendingErrand[] = [];
  const errandsResolved: ScenarioResolution[] = [];
  const promotions: Promotion[] = [];
  const bondsFormed: BondFormation[] = [];
  const newFortLogEntries: FortLogEntry[] = [];
  const bondedPairs = roster ? bondedPairsOf(roster) : undefined;
  const seasonClock: SeasonClock | null = roster ? seasonFor(roster.dayCount) : null;
  const season = seasonClock?.season;
  const fortUpgrades = roster ? roster.fort.upgrades : undefined;

  // M7.4: roll the day's event (if any) before scenarios begin, and apply
  // its flat effects to the roster. Roster-less callers get no event.
  let dailyEvent: DailyEvent | null = null;
  if (roster) {
    const catalog = loadEventCatalog(new URL('../data/events.json', import.meta.url).pathname);
    // M8.2: enemy-tier factions on this roster unlock punitive events.
    const enemyFactions: string[] = [];
    for (const [factionId, standing] of Object.entries(roster.reputation)) {
      if (reputationTier(standing) === 'enemy') enemyFactions.push(factionId);
    }
    dailyEvent = rollEventForDay(catalog, {
      dayCount: roster.dayCount + 1,
      season,
      fortUpgrades: fortUpgrades ?? [],
      enemyFactions,
    });
    if (dailyEvent) {
      const eff = dailyEvent.effect;
      roster.gold += eff.goldDelta;
      if (eff.fatigueDelta !== 0) {
        for (const m of roster.mercs) {
          fatigue.set(m.id, Math.max(0, (fatigue.get(m.id) ?? 0) + eff.fatigueDelta));
        }
      }
      for (const d of eff.reputationDeltas) {
        roster.reputation[d.factionId] = (roster.reputation[d.factionId] ?? 0) + d.delta;
      }
      const parts: string[] = [`${dailyEvent.label}`];
      if (eff.goldDelta !== 0) parts.push(`${eff.goldDelta > 0 ? '+' : ''}${eff.goldDelta}g`);
      if (eff.fatigueDelta !== 0) parts.push(`fatigue ${eff.fatigueDelta > 0 ? '+' : ''}${eff.fatigueDelta}`);
      for (const d of eff.reputationDeltas) parts.push(`${d.factionId} ${d.delta > 0 ? '+' : ''}${d.delta}`);
      const entry: FortLogEntry = {
        day: roster.dayCount + 1,
        kind: 'event',
        message: parts.join('  '),
      };
      appendFortLog(roster, entry);
      newFortLogEntries.push(entry);
    }
  }
  const reputationOf = roster
    ? (factionId: string): number => roster.reputation[factionId] ?? 0
    : undefined;
  const applyDeltas = (r: ScenarioResolution): void => {
    if (!roster) return;
    for (const d of r.reputationDeltas) {
      roster.reputation[d.factionId] = (roster.reputation[d.factionId] ?? 0) + d.delta;
    }
  };

  // M5.4: resolve any errands due TODAY before processing today's scenarios.
  // Use roster.dayCount + 1 as "current day" since the loop hasn't bumped it yet.
  if (roster) {
    const currentDay = roster.dayCount + 1;
    const dueResolutions = await resolveDueErrands({
      roster, currentDay, mercs, llm, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf, basePath: dayPath,
    });
    for (const r of dueResolutions) {
      errandsResolved.push(r);
      scenarioResolutions.push(r);
      applyDeltas(r);
      if (roster) {
        promotions.push(...applyVeterancyXp(roster, r.slotContributions.map((sc) => sc.mercId), r.band));
        bondsFormed.push(...recordCoDeployment(roster, r.slotContributions.map((sc) => sc.mercId)));
      }
      // Errands cost 1 fatigue per participating merc on return day.
      for (const a of r.slotContributions) {
        fatigue.set(a.mercId, (fatigue.get(a.mercId) ?? 0) + 1);
      }
    }
  }

  for (let i = 0; i < day.scenarios.length; i++) {
    const scenarioRelOrAbs = day.scenarios[i]!;
    const scenarioAbs = scenarioRelOrAbs.startsWith('/')
      ? scenarioRelOrAbs
      : join(fixturesDir, scenarioRelOrAbs);
    const scenario = loadScenario(scenarioAbs);
    if (!scenario.assignments || scenario.assignments.length === 0) {
      throw new Error(
        `Day ${day.id}: scenario ${scenario.id} has no assignments; the day loop requires them.`,
      );
    }

    // M5.4: if this is an errand and we have a roster, dispatch instead of resolve.
    if (roster && scenario.daysToResolve && scenario.daysToResolve > 0) {
      const partyMercIds = scenario.assignments.map((a) => a.mercId);
      const errand = dispatchErrand({
        roster, scenario, scenarioPath: scenarioRelOrAbs, partyMercIds,
      });
      errandsDispatched.push(errand);
      // Day-of departure costs 1 fatigue per merc (travel).
      for (const id of partyMercIds) fatigue.set(id, (fatigue.get(id) ?? 0) + 1);
      continue;
    }

    const assignments: Assignment[] = scenario.assignments.map((a) => {
      const merc = mercs.get(a.mercId);
      if (!merc) {
        throw new Error(`Day ${day.id}: unknown merc ${a.mercId} in scenario ${scenario.id}`);
      }
      return { slotId: a.slotId, merc };
    });
    const rng = rngFor
      ? rngFor(scenario, i)
      : rngFromString(scenario.seed ?? scenario.id);

    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf });
    scenarioResolutions.push(resolution);
    applyDeltas(resolution);
    if (roster) {
      promotions.push(...applyVeterancyXp(roster, assignments.map((a) => a.merc.id), resolution.band));
      bondsFormed.push(...recordCoDeployment(roster, assignments.map((a) => a.merc.id)));
    }

    for (const a of assignments) {
      fatigue.set(a.merc.id, (fatigue.get(a.merc.id) ?? 0) + 1);
    }
  }

  // M7.10: end-of-day fatigue recovery. Mercs who neither deployed today
  // (no slot contribution in any scenarioResolution) nor are currently on an
  // errand (busy travelling) recover 1 fatigue, floored at 0. Recovery is
  // computed against the post-deployment fatigue map but BEFORE finalFatigue
  // is exported, so the saved roster reflects the recovered values.
  const fatigueRecovery: Array<{ mercId: string; before: number; after: number }> = [];
  if (roster) {
    const deployed = new Set<string>();
    for (const sr of scenarioResolutions) {
      for (const sc of sr.slotContributions) deployed.add(sc.mercId);
    }
    const onErrand = new Set<string>();
    for (const e of roster.pendingErrands) for (const id of e.partyMercIds) onErrand.add(id);
    // M7.13: winter-larder doubles fatigue recovery during frost.
    const recoverAmount = fatigueRecoveryAmount(
      fortEffectsFor(roster.fort.upgrades),
      season,
    );
    for (const m of roster.mercs) {
      if (deployed.has(m.id) || onErrand.has(m.id)) continue;
      const before = fatigue.get(m.id) ?? 0;
      if (before <= 0) continue;
      const after = Math.max(0, before - recoverAmount);
      fatigue.set(m.id, after);
      fatigueRecovery.push({ mercId: m.id, before, after });
    }
  }

  const finalFatigue: Record<string, number> = {};
  for (const [k, v] of fatigue) finalFatigue[k] = v;

  // M7.12: chapel wound healing. Mirrors fatigue recovery — idle mercs with
  // hpDamage > 0 heal 1 hp damage if the fort has the chapel upgrade. The
  // healed value is mutated directly onto the roster state (single source
  // of truth for hp damage; cliDay does NOT round-trip hpDamage the way it
  // does fatigue, because hp damage already lives on roster.states).
  const woundHealing: Array<{ mercId: string; before: number; after: number }> = [];
  if (roster && chapelHealsWounds(fortEffectsFor(roster.fort.upgrades))) {
    const deployed = new Set<string>();
    for (const sr of scenarioResolutions) {
      for (const sc of sr.slotContributions) deployed.add(sc.mercId);
    }
    const onErrand = new Set<string>();
    for (const e of roster.pendingErrands) for (const id of e.partyMercIds) onErrand.add(id);
    for (const m of roster.mercs) {
      if (deployed.has(m.id) || onErrand.has(m.id)) continue;
      const state = roster.states.get(m.id);
      if (!state || state.hpDamage <= 0) continue;
      const before = state.hpDamage;
      state.hpDamage = before - 1;
      woundHealing.push({ mercId: m.id, before, after: state.hpDamage });
    }
  }


  // M9.1: weekly payday. Every WAGE_INTERVAL_DAYS the fort pays out the
  // sum of wages for the current roster. Flat-wage rule (CANONICAL §2.7)
  // means every merc costs the same regardless of stats/tags. Debt is
  // tolerated for now — gold may go negative.
  const wagesPaid: Array<{ mercId: string; wage: number }> = [];
  let wagesTotalPaid = 0;
  if (roster) {
    const currentDay = roster.dayCount + 1;
    if (currentDay % WAGE_INTERVAL_DAYS === 0 && roster.mercs.length > 0) {
      for (const m of roster.mercs) {
        wagesPaid.push({ mercId: m.id, wage: m.wage });
        wagesTotalPaid += m.wage;
      }
      roster.gold -= wagesTotalPaid;
    }
  }

  // M9.2: end-of-day debt tracking + desertion. Increment the streak when
  // the fort closes the day with negative gold; reset to 0 on solvent days.
  // When the streak reaches DEBT_DESERTION_THRESHOLD_DAYS, the lowest-tier
  // / least-invested merc walks out and the counter resets.
  const desertions: Array<{ mercId: string; reason: string }> = [];
  if (roster) {
    if (roster.gold < 0) {
      roster.consecutiveDebtDays += 1;
    } else {
      roster.consecutiveDebtDays = 0;
    }
    if (roster.consecutiveDebtDays >= DEBT_DESERTION_THRESHOLD_DAYS && roster.mercs.length > 0) {
      const tierRank: Record<string, number> = { rookie: 0, veteran: 1, grizzled: 2 };
      const candidates = roster.mercs.map((m) => {
        const st = roster.states.get(m.id);
        return {
          merc: m,
          tier: tierRank[st?.tier ?? 'rookie'] ?? 0,
          xp: st?.xp ?? 0,
        };
      });
      candidates.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (a.xp !== b.xp) return a.xp - b.xp;
        return a.merc.id.localeCompare(b.merc.id);
      });
      const leaving = candidates[0]!.merc;
      desertions.push({
        mercId: leaving.id,
        reason: `unpaid for ${roster.consecutiveDebtDays} days`,
      });
      roster.mercs = roster.mercs.filter((m) => m.id !== leaving.id);
      roster.states.delete(leaving.id);
      roster.consecutiveDebtDays = 0;
    }
  }

  // M7.5: compute affordable fort upgrades as of end-of-day so the
  // transcript can nudge the player with a FORT HINT block.
  let fortHints: Pick<FortUpgrade, 'id' | 'name' | 'cost' | 'description'>[] = [];
  if (roster) {
    const fortCatalog = loadFortCatalog(
      new URL('../data/fort-upgrades.json', import.meta.url).pathname,
    );
    fortHints = affordableUpgrades(fortCatalog, roster.fort, roster.gold).map((u) => ({
      id: u.id, name: u.name, cost: u.cost, description: u.description,
    }));
  }

  return {
    dayId: day.id,
    dayName: day.name,
    scenarios: scenarioResolutions,
    finalFatigue,
    errandsDispatched,
    errandsResolved,
    promotions,
    bondsFormed,
    seasonClock,
    dailyEvent,
    fortHints,
    newFortLogEntries,
    fatigueRecovery,
    woundHealing,
    wagesPaid,
    wagesTotalPaid,
    desertions,
  };
}
