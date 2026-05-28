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
  /** Base path used to resolve scenarioPath when it is relative. */
  basePath: string;
}): Promise<ScenarioResolution[]> {
  const { roster, currentDay, mercs, llm, fatigueOf, basePath } = args;
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
    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf });
    out.push(resolution);
  }
  roster.pendingErrands = remaining;
  return out;
}
