import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { resolveScenario, type Assignment } from '../src/resolver.js';
import { rngFromString } from '../src/rng.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import { newRoster } from '../src/roster.js';
import { loadDay, resolveDay } from '../src/day.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('M5.5 reputation surfacing', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const llm = new MockScenarioLLM();

  const loadScen = () => loadScenario(join(ROOT, 'fixtures', 'raid-13-guild-shipment.json'));
  const asnFor = (s: ReturnType<typeof loadScen>): Assignment[] =>
    s.assignments!.map((a) => ({ slotId: a.slotId, merc: mercs.get(a.mercId)! }));

  it('parses factionContext from the fixture', () => {
    const scen = loadScen();
    expect(scen.factionContext).toHaveLength(2);
    expect(scen.factionContext![0]!.factionId).toBe('lowmark-guild');
  });

  it('favorable band awards the per-faction deltas', async () => {
    const scen = loadScen();
    const r = await resolveScenario({
      scenario: scen, assignments: asnFor(scen), llm,
      rng: rngFromString('morning'), // produces favorable
    });
    expect(r.band).toBe('favorable');
    const lowmark = r.reputationDeltas.find((d) => d.factionId === 'lowmark-guild');
    const black = r.reputationDeltas.find((d) => d.factionId === 'black-hill-gang');
    expect(lowmark?.delta).toBe(1);
    expect(black?.delta).toBe(-1);
  });

  it('unfavorable band yields no nonzero deltas (filtered out)', async () => {
    const scen = loadScen();
    const r = await resolveScenario({
      scenario: scen, assignments: asnFor(scen), llm,
      rng: rngFromString('raid-13-guild-shipment'), // unfavorable
    });
    expect(r.band).toBe('unfavorable');
    expect(r.reputationDeltas).toHaveLength(0);
  });

  it('day-loop applies reputationDeltas to the roster', async () => {
    const roster = newRoster([...mercs.values()]);
    // Build a one-scenario day pointing at raid-13 with the favorable seed.
    // Override seed by writing a temp day fixture pattern: just call resolveDay
    // with a synthetic day and let scenario.seed (raid-13-guild-shipment) drive
    // — that produces 'unfavorable'. Instead, call resolveScenario directly +
    // mutate roster ourselves: that's the responsibility of resolveDay, so we
    // test by feeding a favorable rng via rngFor.
    const dayFixture = {
      id: 'day-rep',
      name: 'Rep test',
      scenarios: ['raid-13-guild-shipment.json'],
      seed: 'day-rep',
    };
    const r = await resolveDay({
      day: dayFixture, dayPath: join(ROOT, 'fixtures', 'day-rep-synthetic.json'),
      mercs, llm, roster,
      rngFor: () => rngFromString('morning'),
    });
    expect(r.scenarios[0]!.band).toBe('favorable');
    expect(roster.reputation['lowmark-guild']).toBe(1);
    expect(roster.reputation['black-hill-gang']).toBe(-1);
  });

  it('LLM request receives the factionContext with current standing', async () => {
    const scen = loadScen();
    let captured: any;
    const spyLlm = {
      name: 'spy',
      async narrate(req: any) {
        captured = req;
        return { contributions: req.party.map((p: any) => ({ mercId: p.merc.id, line: 'x' })), outcomeNarrative: 'x' };
      },
    } as any;
    await resolveScenario({
      scenario: scen, assignments: asnFor(scen), llm: spyLlm,
      rng: rngFromString('morning'),
      reputationOf: (id: string) => (id === 'lowmark-guild' ? 3 : 0),
    });
    expect(captured.factionContext).toBeDefined();
    const lowmark = captured.factionContext.find((f: any) => f.factionId === 'lowmark-guild');
    expect(lowmark.currentStanding).toBe(3);
  });
});
