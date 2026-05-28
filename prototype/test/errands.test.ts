import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { newRoster } from '../src/roster.js';
import { dispatchErrand, mercsInTransit, resolveDueErrands } from '../src/errands.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('M5.4 errands (long-clock)', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const llm = new MockScenarioLLM();

  it('errand scenario fixture parses with daysToResolve > 0', () => {
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-12-errand-courier.json'));
    expect(scen.daysToResolve).toBe(4);
  });

  it('dispatchErrand adds an entry with the correct returnsOnDay', () => {
    const roster = newRoster([...mercs.values()]);
    roster.dayCount = 2;
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-12-errand-courier.json'));
    const e = dispatchErrand({
      roster, scenario: scen, scenarioPath: 'raid-12-errand-courier.json',
      partyMercIds: ['dren', 'imogen'],
    });
    expect(e.dispatchedOnDay).toBe(2);
    expect(e.returnsOnDay).toBe(6); // 2 + 4
    expect(e.partyMercIds).toEqual(['dren', 'imogen']);
    expect(roster.pendingErrands).toHaveLength(1);
  });

  it('dispatchErrand throws if scenario is not an errand', () => {
    const roster = newRoster([...mercs.values()]);
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));
    expect(() => dispatchErrand({
      roster, scenario: scen, scenarioPath: 'raid-01.json', partyMercIds: ['marek'],
    })).toThrow(/not an errand/);
  });

  it('mercsInTransit lists every dispatched merc', () => {
    const roster = newRoster([...mercs.values()]);
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-12-errand-courier.json'));
    dispatchErrand({
      roster, scenario: scen, scenarioPath: 'raid-12-errand-courier.json',
      partyMercIds: ['dren', 'imogen'],
    });
    const transit = mercsInTransit(roster);
    expect(transit.has('dren')).toBe(true);
    expect(transit.has('imogen')).toBe(true);
    expect(transit.has('marek')).toBe(false);
  });

  it('resolveDueErrands fires when currentDay >= returnsOnDay and removes from pending', async () => {
    const roster = newRoster([...mercs.values()]);
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-12-errand-courier.json'));
    dispatchErrand({
      roster, scenario: scen, scenarioPath: 'raid-12-errand-courier.json',
      partyMercIds: ['dren', 'imogen'],
    });
    // not due on day 2
    const early = await resolveDueErrands({
      roster, currentDay: 2, mercs, llm,
      basePath: join(ROOT, 'fixtures', 'placeholder.json'),
    });
    expect(early).toHaveLength(0);
    expect(roster.pendingErrands).toHaveLength(1);

    // due on day 4 (dispatchedOnDay=0 + 4 = returnsOnDay)
    const fired = await resolveDueErrands({
      roster, currentDay: 4, mercs, llm,
      basePath: join(ROOT, 'fixtures', 'placeholder.json'),
    });
    expect(fired).toHaveLength(1);
    expect(fired[0]!.scenarioId).toBe('raid-12-errand-courier');
    expect(roster.pendingErrands).toHaveLength(0);
  });

  it('day-loop dispatches the errand on day 1 and resolves it on day 4', async () => {
    const roster = newRoster([...mercs.values()]);
    // Day 1 fixture has an errand + a normal scenario.
    const day1 = loadDay(join(ROOT, 'fixtures', 'day-errand-1.json'));
    const r1 = await resolveDay({
      day: day1, dayPath: join(ROOT, 'fixtures', 'day-errand-1.json'),
      mercs, llm, roster,
    });
    expect(r1.errandsDispatched).toHaveLength(1);
    expect(r1.errandsResolved).toHaveLength(0);
    expect(r1.scenarios.map((s) => s.scenarioId)).toEqual(['raid-01']);
    roster.dayCount = 1;

    // Days 2 & 3 should not resolve the errand.
    for (const d of [2, 3]) {
      const day = loadDay(join(ROOT, 'fixtures', `day-errand-${d}.json`));
      const r = await resolveDay({
        day, dayPath: join(ROOT, 'fixtures', `day-errand-${d}.json`),
        mercs, llm, roster,
      });
      expect(r.errandsResolved).toHaveLength(0);
      roster.dayCount = d;
    }

    // Day 4 should resolve the errand return.
    const day4 = loadDay(join(ROOT, 'fixtures', 'day-errand-4.json'));
    const r4 = await resolveDay({
      day: day4, dayPath: join(ROOT, 'fixtures', 'day-errand-4.json'),
      mercs, llm, roster,
    });
    expect(r4.errandsResolved).toHaveLength(1);
    expect(r4.errandsResolved[0]!.scenarioId).toBe('raid-12-errand-courier');
    expect(roster.pendingErrands).toHaveLength(0);
  });
});
