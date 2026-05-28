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
}

export interface DayResolution {
  dayId: string;
  dayName: string;
  scenarios: ScenarioResolution[];
  /** Final fatigue per merc after the whole day. */
  finalFatigue: Record<string, number>;
}

/**
 * Runs the day's scenarios sequentially with a shared roster.
 * Fatigue accumulates per merc (+1 per scenario participated in).
 * computeSlotContributions applies a penalty when fatigue ≥ FATIGUE_THRESHOLD.
 */
export async function resolveDay(input: DayResolutionInput): Promise<DayResolution> {
  const { day, dayPath, mercs, llm, rngFor, initialFatigue } = input;
  const fatigue = new Map<string, number>(initialFatigue ?? []);
  const fatigueOf = (mercId: string): number => fatigue.get(mercId) ?? 0;

  const fixturesDir = dirname(resolve(dayPath));
  const scenarioResolutions: ScenarioResolution[] = [];

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

    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf });
    scenarioResolutions.push(resolution);

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
  };
}
