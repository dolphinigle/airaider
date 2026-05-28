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
import { SEASONS, DAYS_PER_SEASON, seasonFor } from '../src/season.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('M6.3 season clock', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

  it('seasonFor cycles through SEASONS every DAYS_PER_SEASON days', () => {
    expect(seasonFor(0).season).toBe('thaw');
    expect(seasonFor(DAYS_PER_SEASON - 1).season).toBe('thaw');
    expect(seasonFor(DAYS_PER_SEASON).season).toBe('high');
    expect(seasonFor(2 * DAYS_PER_SEASON).season).toBe('wane');
    expect(seasonFor(3 * DAYS_PER_SEASON).season).toBe('frost');
    expect(seasonFor(4 * DAYS_PER_SEASON).season).toBe('thaw'); // wraps
    expect(seasonFor(0).dayOfSeason).toBe(1);
    expect(seasonFor(29).dayOfSeason).toBe(30);
  });

  it('SEASONS has exactly four entries', () => {
    expect(SEASONS).toHaveLength(4);
  });

  it('seasonModifier adds a flat coin delta when season matches', async () => {
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-14-frostwatch.json'));
    const a: Assignment[] = scen.assignments!.map((x) => ({ slotId: x.slotId, merc: mercs.get(x.mercId)! }));
    const baseline = await resolveScenario({
      scenario: scen, assignments: a, llm: new MockScenarioLLM(),
      rng: rngFromString(scen.seed!),
    });
    const inFrost = await resolveScenario({
      scenario: scen, assignments: a, llm: new MockScenarioLLM(),
      rng: rngFromString(scen.seed!), season: 'frost',
    });
    expect(inFrost.coinsActual).toBeLessThan(baseline.coinsActual);
  });

  it('roster-less day loop leaves seasonClock null', async () => {
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(),
    });
    expect(r.seasonClock).toBeNull();
  });

  it('day loop reports the current season clock when a roster is present', async () => {
    const roster = newRoster([...mercs.values()]);
    roster.dayCount = DAYS_PER_SEASON * 3 + 5; // 5th day of frost
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(), roster,
    });
    expect(r.seasonClock?.season).toBe('frost');
    expect(r.seasonClock?.dayOfSeason).toBe(6);
  });

  it('LLM request carries the season when set', async () => {
    const scen = loadScenario(join(ROOT, 'fixtures', 'raid-14-frostwatch.json'));
    const a: Assignment[] = scen.assignments!.map((x) => ({ slotId: x.slotId, merc: mercs.get(x.mercId)! }));
    let captured: any;
    const spy = { name: 'spy', async narrate(req: any) { captured = req; return {
      contributions: req.party.map((p: any) => ({ mercId: p.merc.id, line: 'x' })),
      outcomeNarrative: 'x',
    }; } } as any;
    await resolveScenario({ scenario: scen, assignments: a, llm: spy, rng: rngFromString('s'), season: 'high' });
    expect(captured.season).toBe('high');
  });
});
