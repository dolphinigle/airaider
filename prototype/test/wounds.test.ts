import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { resolveScenario, type Assignment } from '../src/resolver.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import { newRoster, applyCasualties } from '../src/roster.js';

const TAGS_PATH = fileURLToPath(new URL('../data/tags.json', import.meta.url));
const MERCS_PATH = fileURLToPath(new URL('../data/mercs.json', import.meta.url));
const RAID01 = fileURLToPath(new URL('../fixtures/raid-01.json', import.meta.url));

describe('M5.1 wounds + permadeath', () => {
  const tags = loadTags(TAGS_PATH);
  const mercs = loadMercs(MERCS_PATH, tags);
  const scenario = loadScenario(RAID01);
  const llm = new MockScenarioLLM();

  function assignmentsForRaid01(): Assignment[] {
    return scenario.assignments!.map((a) => ({ slotId: a.slotId, merc: mercs.get(a.mercId)! }));
  }

  it('records no casualty when band is not catastrophic', async () => {
    // Deterministic RNG via scenario seed for raid-01 gives a non-catastrophic band.
    const res = await resolveScenario({
      scenario,
      assignments: assignmentsForRaid01(),
      llm,
      rng: (() => { let s = 0.5; return () => { s = (s * 9301 + 49297) % 233280 / 233280; return s; }; })(),
    });
    expect(Array.isArray(res.casualties)).toBe(true);
    if (res.band !== 'catastrophic') expect(res.casualties.length).toBe(0);
  });

  it('inflicts 1 HP to most-fatigued merc on a catastrophic band', async () => {
    const allTailsRng = () => 0.0001; // rng()<0.5 ⇒ tails ⇒ all-tails ⇒ catastrophic
    const res = await resolveScenario({
      scenario,
      assignments: assignmentsForRaid01(),
      llm,
      rng: allTailsRng,
      fatigueOf: (id) => (id === 'roselle' ? 5 : 0),
    });
    expect(res.band).toBe('catastrophic');
    expect(res.casualties.length).toBe(1);
    expect(res.casualties[0]!.mercId).toBe('roselle');
    expect(res.casualties[0]!.damage).toBe(1);
  });

  it('breaks tie deterministically by lowest mercId when fatigue equal', async () => {
    const allTailsRng = () => 0.0001;
    const res = await resolveScenario({
      scenario,
      assignments: assignmentsForRaid01(),
      llm,
      rng: allTailsRng,
      // both 0 fatigue ⇒ tiebreak by id ascending: 'marek' < 'roselle'
    });
    expect(res.band).toBe('catastrophic');
    expect(res.casualties[0]!.mercId).toBe('marek');
  });

  it('applyCasualties accumulates hpDamage and triggers permadeath at >= hp', () => {
    const r = newRoster([...mercs.values()]);
    const marek = r.mercs.find((m) => m.id === 'marek')!;
    // Marek has hp=3; inflict 3 wounds across calls
    expect(applyCasualties(r, [{ mercId: 'marek', damage: 1, reason: 'wound' }])).toEqual([]);
    expect(r.states.get('marek')!.hpDamage).toBe(1);
    expect(applyCasualties(r, [{ mercId: 'marek', damage: 1, reason: 'wound' }])).toEqual([]);
    expect(applyCasualties(r, [{ mercId: 'marek', damage: 1, reason: 'final' }])).toEqual(['marek']);
    expect(r.mercs.find((m) => m.id === 'marek')).toBeUndefined();
    expect(r.deceased.find((d) => d.id === 'marek')?.reason).toBe('final');
    expect(r.deceased.find((d) => d.id === 'marek')?.name).toBe(marek.name);
    expect(r.states.get('marek')).toBeUndefined();
  });

  it('skips casualties for mercs not in the roster', () => {
    const r = newRoster([...mercs.values()]);
    const killed = applyCasualties(r, [{ mercId: 'ghost', damage: 1, reason: 'x' }]);
    expect(killed).toEqual([]);
    expect(r.deceased.length).toBe(0);
  });
});
