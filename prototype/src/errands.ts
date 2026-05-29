import { dirname, join, resolve as pathResolve } from 'node:path';
import type { Roster, RosterPendingErrand } from './roster.js';
import { loadScenario, type FixtureScenario } from './scenarios.js';
import { resolveScenario, type Assignment, type ScenarioResolution } from './resolver.js';
import { rngFromString } from './rng.js';
import type { ScenarioLLM } from './llm/interface.js';
import type { Merc } from './types.js';

/**
 * Dispatch an errand scenario: instead of resolving it now, push it onto
 * `roster.pendingErrands` to be resolved later. Returns the new pending entry.
 *
 * `scenarioPath` must be relative to the day file's fixtures dir (or absolute)
 * so the day loop can re-load the scenario when the errand returns.
 */
export function dispatchErrand(args: {
  roster: Roster;
  scenario: FixtureScenario;
  scenarioPath: string;
  partyMercIds: string[];
}): RosterPendingErrand {
  const { roster, scenario, scenarioPath, partyMercIds } = args;
  if (!scenario.daysToResolve || scenario.daysToResolve <= 0) {
    throw new Error(`Scenario ${scenario.id} is not an errand (daysToResolve not set).`);
  }
  const errand: RosterPendingErrand = {
    errandId: `${scenario.id}@d${roster.dayCount}`,
    scenarioId: scenario.id,
    scenarioPath,
    partyMercIds: [...partyMercIds],
    dispatchedOnDay: roster.dayCount,
    returnsOnDay: roster.dayCount + scenario.daysToResolve,
    seedSource: scenario.seed ?? scenario.id,
  };
  roster.pendingErrands.push(errand);
  return errand;
}

/** Mercs currently locked into a pending errand (cannot be assigned today). */
export function mercsInTransit(roster: Roster): Set<string> {
  const ids = new Set<string>();
  for (const e of roster.pendingErrands) for (const id of e.partyMercIds) ids.add(id);
  return ids;
}

/**
 * Resolve any pending errands whose return-day is <= currentDay.
 * Returns the resolutions in dispatch order; removes them from the roster.
 */
export async function resolveDueErrands(args: {
  roster: Roster;
  currentDay: number;
  mercs: Map<string, Merc>;
  llm: ScenarioLLM;
  fatigueOf?: (mercId: string) => number;
  reputationOf?: (factionId: string) => number;
  /** M6.2 bonds + M6.3 season passthrough. */
  bondedPairs?: Set<string>;
  fortUpgrades?: Iterable<string>;
  season?: import('./season.js').Season;
  /** M7.8: tier lookup passthrough. */
  tierOf?: (mercId: string) => import('./veterancy.js').VeterancyTier | undefined;
  /** Base path used to resolve scenarioPath when it is relative. */
  basePath: string;
}): Promise<ScenarioResolution[]> {
  const { roster, currentDay, mercs, llm, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf, basePath } = args;
  const due = roster.pendingErrands.filter((e) => e.returnsOnDay <= currentDay);
  const remaining = roster.pendingErrands.filter((e) => e.returnsOnDay > currentDay);
  const out: ScenarioResolution[] = [];
  for (const e of due) {
    const abs = e.scenarioPath.startsWith('/')
      ? e.scenarioPath
      : pathResolve(dirname(basePath), e.scenarioPath);
    const scenario = loadScenario(abs);
    const assignments: Assignment[] = [];
    const baseAssign = scenario.assignments ?? [];
    // Prefer assignments[] from the fixture if it matches partyMercIds, else
    // round-robin partyMercIds across slots.
    if (baseAssign.length > 0 && baseAssign.every((a) => e.partyMercIds.includes(a.mercId))) {
      for (const a of baseAssign) {
        const merc = mercs.get(a.mercId);
        if (!merc) throw new Error(`Errand ${e.errandId}: unknown merc ${a.mercId}`);
        assignments.push({ slotId: a.slotId, merc });
      }
    } else {
      for (let i = 0; i < scenario.slots.length; i++) {
        const slot = scenario.slots[i]!;
        const mercId = e.partyMercIds[i % e.partyMercIds.length]!;
        const merc = mercs.get(mercId);
        if (!merc) throw new Error(`Errand ${e.errandId}: unknown merc ${mercId}`);
        assignments.push({ slotId: slot.id, merc });
      }
    }
    const rng = rngFromString(e.seedSource);
    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf });
    out.push(resolution);
  }
  roster.pendingErrands = remaining;
  return out;
}

/** M14.1: result of abandoning an in-flight errand. */
export interface ErrandAbandonResult {
  errandId: string;
  scenarioPath: string;
  partyMercIds: string[];
  fatigueGain: number;
  daysSkippedAhead: number;
}

/** M14.1: per-merc fatigue penalty applied when an errand is abandoned. */
export const ERRAND_ABANDON_FATIGUE_PENALTY = 1;

/**
 * M14.1: drop an in-flight errand by id. The party stops the work and walks
 * back empty-handed; each merc takes a small fatigue hit. Returns the
 * abandon record or `undefined` if no pending errand with that id exists.
 *
 * Unlike `resolveDueErrands`, no scenario is rolled and no reward/penalty
 * is computed — this is the player's pre-emptive recall.
 */
export function abandonErrand(
  roster: Roster,
  errandId: string,
  fatiguePenalty: number = ERRAND_ABANDON_FATIGUE_PENALTY,
): ErrandAbandonResult | undefined {
  const idx = roster.pendingErrands.findIndex((e) => e.errandId === errandId);
  if (idx < 0) return undefined;
  const e = roster.pendingErrands[idx]!;
  for (const id of e.partyMercIds) {
    const st = roster.states.get(id);
    if (st) st.fatigue = Math.max(0, st.fatigue + fatiguePenalty);
  }
  roster.pendingErrands.splice(idx, 1);
  return {
    errandId: e.errandId,
    scenarioPath: e.scenarioPath,
    partyMercIds: [...e.partyMercIds],
    fatigueGain: fatiguePenalty,
    daysSkippedAhead: Math.max(0, e.returnsOnDay - roster.dayCount),
  };
}
