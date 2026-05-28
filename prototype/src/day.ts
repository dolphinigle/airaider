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
import type { Roster, RosterPendingErrand } from './roster.js';
import { dispatchErrand, resolveDueErrands } from './errands.js';
import { applyVeterancyXp, type Promotion } from './veterancy.js';
import { recordCoDeployment, bondedPairsOf, type BondFormation } from './bonds.js';

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

  const fixturesDir = dirname(resolve(dayPath));
  const scenarioResolutions: ScenarioResolution[] = [];
  const errandsDispatched: RosterPendingErrand[] = [];
  const errandsResolved: ScenarioResolution[] = [];
  const promotions: Promotion[] = [];
  const bondsFormed: BondFormation[] = [];
  const bondedPairs = roster ? bondedPairsOf(roster) : undefined;
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
      roster, currentDay, mercs, llm, fatigueOf, reputationOf, basePath: dayPath,
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

    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf, reputationOf, bondedPairs });
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

  const finalFatigue: Record<string, number> = {};
  for (const [k, v] of fatigue) finalFatigue[k] = v;

  return {
    dayId: day.id,
    dayName: day.name,
    scenarios: scenarioResolutions,
    finalFatigue,
    errandsDispatched,
    errandsResolved,
    promotions,
    bondsFormed,
  };
}
