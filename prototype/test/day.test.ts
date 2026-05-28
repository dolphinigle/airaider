import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('day loop (M2)', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  async function run() {
    return resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
  }

  it('accumulates fatigue across scenarios', async () => {
    const r = await run();
    // day-01: raid-01 (marek+roselle) → raid-03 (marek+veska) → raid-04 (veska+marek)
    expect(r.finalFatigue).toEqual({ marek: 3, roselle: 1, veska: 2 });
  });

  it('applies fatigue penalty when merc starts a scenario at fatigue ≥ 2', async () => {
    const r = await run();
    // Scenario 3 is raid-04: marek is at fatigue 2 going in (used in s1, s2).
    const s3 = r.scenarios[2]!;
    const marekContrib = s3.slotContributions.find((c) => c.mercId === 'marek')!;
    expect(marekContrib.fatigue).toBe(2);
    expect(marekContrib.fatiguePenalty).toBe(1);
    // raid-04 oversee slot: 1 base + 1 (W=4≥4) + 1 (temp:brave) = 3, minus 1 = 2.
    expect(marekContrib.coinsContributed).toBe(2);
  });

  it('no fatigue penalty for fresh mercs in earlier scenarios', async () => {
    const r = await run();
    const s1 = r.scenarios[0]!;
    for (const c of s1.slotContributions) {
      expect(c.fatigue).toBe(0);
      expect(c.fatiguePenalty).toBe(0);
    }
  });

  it('is deterministic across runs', async () => {
    const a = await run();
    const b = await run();
    expect(a).toEqual(b);
  });

  it('matches the committed day-mock golden if present', async () => {
    const goldenPath = join(ROOT, 'fixtures', 'day-01.day-mock.json');
    if (!existsSync(goldenPath)) {
      // Allow test to no-op if golden not generated yet (e.g. fresh checkout).
      return;
    }
    const actual = await run();
    const expected = JSON.parse(readFileSync(goldenPath, 'utf8'));
    expect(actual).toEqual(expected);
  });

  it('M7.10 fatigueRecovery is empty in roster-less mode', async () => {
    const r = await run();
    expect(r.fatigueRecovery).toEqual([]);
  });
});

describe('M7.10 end-of-day fatigue recovery', () => {
  it('non-deployed merc with fatigue > 0 recovers 1 (floor 0)', async () => {
    const { newRoster } = await import('../src/roster.js');
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const r = newRoster([...mercs.values()]);
    // Imogen is NOT deployed in day-01 (raid-01, raid-03, raid-04 use
    // marek/roselle/veska). Give her fatigue=2, expect 1 after the day.
    r.states.get('imogen')!.fatigue = 2;
    // Dren also not in day-01; fatigue=0 stays 0 (no entry).
    const initialFatigue = new Map<string, number>([...r.states.entries()].map(([id, s]) => [id, s.fatigue]));
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    const imogenRec = out.fatigueRecovery.find((x) => x.mercId === 'imogen');
    expect(imogenRec).toEqual({ mercId: 'imogen', before: 2, after: 1 });
    const drenRec = out.fatigueRecovery.find((x) => x.mercId === 'dren');
    expect(drenRec).toBeUndefined();
    // And the saved finalFatigue reflects the recovery.
    expect(out.finalFatigue['imogen']).toBe(1);
  });

  it('deployed mercs do NOT recover (they only accumulated fatigue today)', async () => {
    const { newRoster } = await import('../src/roster.js');
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const r = newRoster([...mercs.values()]);
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    // marek is in every scenario today — must NOT appear in recovery.
    expect(out.fatigueRecovery.some((x) => x.mercId === 'marek')).toBe(false);
    // marek finishes at fatigue 3 (3 scenarios), no recovery applied.
    expect(out.finalFatigue['marek']).toBe(3);
  });
});

describe('M7.12 chapel wound healing', () => {
  it('idle merc with hpDamage > 0 heals 1 when chapel built', async () => {
    const { newRoster } = await import('../src/roster.js');
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const r = newRoster([...mercs.values()]);
    r.fort.upgrades.push('chapel');
    r.states.get('imogen')!.hpDamage = 2; // imogen is idle in day-01
    r.states.get('dren')!.hpDamage = 0;   // dren idle but no wound
    const initialFatigue = new Map<string, number>([...r.states.entries()].map(([id, s]) => [id, s.fatigue]));
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    const imo = out.woundHealing.find((x) => x.mercId === 'imogen');
    expect(imo).toEqual({ mercId: 'imogen', before: 2, after: 1 });
    expect(out.woundHealing.some((x) => x.mercId === 'dren')).toBe(false);
    expect(r.states.get('imogen')!.hpDamage).toBe(1);
  });

  it('does NOT heal without chapel', async () => {
    const { newRoster } = await import('../src/roster.js');
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const r = newRoster([...mercs.values()]);
    r.states.get('imogen')!.hpDamage = 2;
    const initialFatigue = new Map<string, number>([...r.states.entries()].map(([id, s]) => [id, s.fatigue]));
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    expect(out.woundHealing).toEqual([]);
    expect(r.states.get('imogen')!.hpDamage).toBe(2);
  });

  it('does NOT heal deployed mercs even with chapel', async () => {
    const { newRoster } = await import('../src/roster.js');
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const r = newRoster([...mercs.values()]);
    r.fort.upgrades.push('chapel');
    r.states.get('marek')!.hpDamage = 2; // marek IS deployed in day-01
    const initialFatigue = new Map<string, number>([...r.states.entries()].map(([id, s]) => [id, s.fatigue]));
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    expect(out.woundHealing.some((x) => x.mercId === 'marek')).toBe(false);
    expect(r.states.get('marek')!.hpDamage).toBe(2);
  });

  it('returns empty woundHealing in roster-less mode', async () => {
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const dayPath = join(ROOT, 'fixtures', 'day-01.json');
    const day = loadDay(dayPath);
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.woundHealing).toEqual([]);
  });
});

describe('M9.1 weekly payday', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('deducts sum of wages on a day divisible by 7', async () => {
    const { newRoster } = await import('../src/roster.js');
    const { WAGE_INTERVAL_DAYS } = await import('../src/day.js');
    expect(WAGE_INTERVAL_DAYS).toBe(7);
    const r = newRoster([mercs.get('marek')!, mercs.get('veska')!, mercs.get('dren')!]);
    r.gold = 10;
    r.dayCount = 6; // currentDay = 7
    const goldBefore = r.gold;
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.wagesPaid.length).toBe(3);
    expect(out.wagesTotalPaid).toBe(3);
    // Daily event may also adjust gold; assert wage portion specifically.
    const eventGold = out.dailyEvent?.effect.goldDelta ?? 0;
    expect(r.gold).toBe(goldBefore + eventGold - out.wagesTotalPaid);
  });

  it('does not deduct wages on non-payday', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 5;
    r.dayCount = 0; // currentDay = 1
    const goldBefore = r.gold;
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.wagesPaid).toEqual([]);
    expect(out.wagesTotalPaid).toBe(0);
    const eventGold = out.dailyEvent?.effect.goldDelta ?? 0;
    expect(r.gold).toBe(goldBefore + eventGold);
  });

  it('roster-less day loop produces no wages', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.wagesPaid).toEqual([]);
    expect(out.wagesTotalPaid).toBe(0);
  });

  it('allows gold to go negative (debt) on payday', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('veska')!]);
    r.gold = 1;
    r.dayCount = 13; // currentDay = 14
    const goldBefore = r.gold;
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.wagesTotalPaid).toBe(2);
    const eventGold = out.dailyEvent?.effect.goldDelta ?? 0;
    expect(r.gold).toBe(goldBefore + eventGold - 2);
    expect(r.gold).toBeLessThanOrEqual(0);
  });
});
