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

describe('M9.2 debt-driven desertion', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  async function runDebtDay(roster: any) {
    return resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster });
  }

  it('exports DEBT_DESERTION_THRESHOLD_DAYS = 3', async () => {
    const { DEBT_DESERTION_THRESHOLD_DAYS } = await import('../src/day.js');
    expect(DEBT_DESERTION_THRESHOLD_DAYS).toBe(3);
  });

  it('increments consecutiveDebtDays when day ends in debt', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = -5;
    r.dayCount = 0;
    expect(r.consecutiveDebtDays).toBe(0);
    const out = await runDebtDay(r);
    expect(out.wagesTotalPaid).toBe(0);
    expect(r.consecutiveDebtDays).toBe(1);
    expect(out.desertions).toEqual([]);
  });

  it('resets consecutiveDebtDays when gold goes non-negative', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 5;
    r.consecutiveDebtDays = 2;
    r.dayCount = 0;
    await runDebtDay(r);
    expect(r.consecutiveDebtDays).toBe(0);
  });

  it('triggers desertion after threshold debt days and resets counter', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('veska')!]);
    r.gold = -1;
    r.consecutiveDebtDays = 2;
    r.dayCount = 0;
    const before = r.mercs.length;
    const out = await runDebtDay(r);
    expect(out.desertions.length).toBe(1);
    expect(r.mercs.length).toBe(before - 1);
    expect(r.consecutiveDebtDays).toBe(0);
    const leaverId = out.desertions[0]!.mercId;
    expect(r.mercs.find((m) => m.id === leaverId)).toBeUndefined();
    expect(r.states.has(leaverId)).toBe(false);
  });

  it('picks the lowest-tier merc (rookies leave first)', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('veska')!]);
    r.states.get('marek')!.tier = 'veteran';
    r.states.get('marek')!.xp = 10;
    r.gold = -1;
    r.consecutiveDebtDays = 2;
    r.dayCount = 0;
    const out = await runDebtDay(r);
    expect(out.desertions[0]!.mercId).toBe('veska');
  });

  it('roster-less day loop produces no desertions', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.desertions).toEqual([]);
  });
});

describe('M9.3 debt suspends fatigue recovery', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('skips recovery when roster enters day with consecutiveDebtDays > 0', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('imogen')!]); // imogen is idle in day-01
    r.states.get('imogen')!.fatigue = 2;
    r.consecutiveDebtDays = 1;
    r.gold = -2; // keep negative so post-day counter stays high; no payday
    r.dayCount = 0;
    const initialFatigue = new Map([['imogen', 2]]);
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    expect(out.fatigueRecovery).toEqual([]);
    expect(out.fatigueRecoverySuspended).toBe(true);
    expect(out.finalFatigue['imogen']).toBe(2);
  });

  it('recovers fatigue normally when not in debt', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('imogen')!]);
    r.states.get('imogen')!.fatigue = 2;
    r.consecutiveDebtDays = 0;
    r.gold = 5;
    r.dayCount = 0;
    const initialFatigue = new Map([['imogen', 2]]);
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM(), roster: r, initialFatigue });
    expect(out.fatigueRecoverySuspended).toBe(false);
    expect(out.fatigueRecovery.length).toBe(1);
    expect(out.fatigueRecovery[0]!.mercId).toBe('imogen');
    expect(out.fatigueRecovery[0]!.before).toBeGreaterThan(out.fatigueRecovery[0]!.after);
  });

  it('roster-less mode reports fatigueRecoverySuspended=false', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.fatigueRecoverySuspended).toBe(false);
  });
});

describe('M10.2 weekly tavern auto-refresh', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('refreshes the bench on days divisible by 7', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    r.dayCount = 6; // currentDay = 7
    expect(r.hirePool).toEqual([]);
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.tavernRefresh.length).toBeGreaterThan(0);
    expect(r.hirePool.length).toBeGreaterThan(0);
  });

  it('does not refresh on non-weekly days', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    r.dayCount = 0; // currentDay = 1
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.tavernRefresh).toEqual([]);
    expect(r.hirePool).toEqual([]);
  });

  it('is deterministic across runs of the same saved day', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r1 = newRoster([mercs.get('marek')!]);
    const r2 = newRoster([mercs.get('marek')!]);
    r1.gold = r2.gold = 20;
    r1.dayCount = r2.dayCount = 6;
    const o1 = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r1 });
    const o2 = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r2 });
    expect(o1.tavernRefresh.map((e) => e.merc.id)).toEqual(o2.tavernRefresh.map((e) => e.merc.id));
    expect(o1.tavernRefresh.map((e) => e.price)).toEqual(o2.tavernRefresh.map((e) => e.price));
  });

  it('roster-less day loop produces no refresh', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.tavernRefresh).toEqual([]);
  });
});

describe('M10.3 stale tavern listings drop off in day loop', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('exposes tavernExpired:[] on a no-refresh day', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.tavernExpired).toEqual([]);
  });

  it('drops stale entries during weekly refresh', async () => {
    const { newRoster } = await import('../src/roster.js');
    const { refreshHirePool } = await import('../src/tavern.js');
    const { mulberry32 } = await import('../src/rng.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    // Seed bench from day 7 with stale entries
    refreshHirePool(r, mulberry32(1), tags, 7);
    expect(r.hirePool.length).toBe(3);
    r.dayCount = 27; // next currentDay = 28 → 21 days after postedDay 7, > TTL 14
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.tavernExpired.length).toBe(3);
    expect(out.tavernRefresh.length).toBe(3);
    expect(r.hirePool.length).toBe(3);
    for (const e of r.hirePool) expect(e.postedDay).toBe(28);
  });
});

describe('M9.4 low-morale suspends new bond formation', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('lowMorale=false and bonds advance when not in debt', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('roselle')!, mercs.get('veska')!]);
    r.gold = 20;
    expect(r.consecutiveDebtDays).toBe(0);
    const scenarioDay = { ...day } as any;
    const out = await resolveDay({ day: scenarioDay, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.lowMorale).toBe(false);
    let total = 0;
    for (const s of r.states.values()) total += Object.values(s.coDeployments).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });

  it('lowMorale=true and bond counters do NOT advance when in debt', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('roselle')!, mercs.get('veska')!]);
    r.gold = 20;
    r.consecutiveDebtDays = 1;
    const scenarioDay = { ...day } as any;
    const out = await resolveDay({ day: scenarioDay, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.lowMorale).toBe(true);
    expect(out.bondsFormed).toEqual([]);
    let total = 0;
    for (const s of r.states.values()) total += Object.values(s.coDeployments).reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it('roster-less day loop reports lowMorale=false', async () => {
    const out = await resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
    expect(out.lowMorale).toBe(false);
  });
});

describe('M9.5 fort log entries for payday and desertion', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('appends a Payday note to fortLog on weekly payday', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    r.dayCount = 6; // currentDay = 7
    await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    const payEntries = r.fortLog.filter((e) => e.message.startsWith('Payday'));
    expect(payEntries.length).toBe(1);
    expect(payEntries[0]!.day).toBe(7);
    expect(payEntries[0]!.kind).toBe('note');
  });

  it('appends a Desertion note to fortLog when a merc walks out', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('imogen')!]);
    r.gold = -5;
    r.consecutiveDebtDays = 2; // one more debt day triggers desertion
    await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    const desEntries = r.fortLog.filter((e) => e.message.startsWith('Desertion'));
    expect(desEntries.length).toBe(1);
    expect(desEntries[0]!.kind).toBe('note');
    expect(r.mercs.length).toBe(1); // one merc gone
  });
});

describe('M12.1 granary discounts payday wages', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('payday with granary reduces each merc wage by 1g (floor 0)', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!, mercs.get('imogen')!]);
    r.gold = 20;
    r.dayCount = 6;
    r.fort.upgrades.push('granary');
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    // Each merc wage is 1g (standard), so granary drops to 0; total 0g
    // (or 1g per merc if base is 2g; either way: reduced by 1)
    const expectedTotal = [mercs.get('marek')!, mercs.get('imogen')!].reduce((a, m) => a + Math.max(0, m.wage - 1), 0);
    expect(out.wagesTotalPaid).toBe(expectedTotal);
    const payNote = r.fortLog.find((e) => e.message.startsWith('Payday'));
    expect(payNote?.message).toContain('granary');
  });

  it('payday without granary pays full wage', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    r.dayCount = 6;
    const out = await resolveDay({ day: { ...day, scenarios: [] as string[] } as any, dayPath, mercs, llm: new MockScenarioLLM(), roster: r });
    expect(out.wagesTotalPaid).toBe(mercs.get('marek')!.wage);
    const payNote = r.fortLog.find((e) => e.message.startsWith('Payday'));
    expect(payNote?.message).not.toContain('granary');
  });
});

describe('M13.1 enemy-faction quest auto-stir in day loop', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  it('stirs lowmark-bounty when lowmark-guild is at enemy tier', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.reputation['lowmark-guild'] = -10; // enemy tier threshold
    const out = await resolveDay({
      day: { ...day, scenarios: [] as string[] } as any,
      dayPath, mercs, llm: new MockScenarioLLM(), roster: r,
    });
    expect(out.questsStirred.map((q) => q.questId)).toContain('lowmark-bounty');
    expect(r.activeQuests.some((q) => q.questId === 'lowmark-bounty')).toBe(true);
    const note = r.fortLog.find((e) => e.message.includes('lowmark-bounty') || e.message.includes('Lowmark Bounty'));
    expect(note).toBeDefined();
  });

  it('does not stir again on subsequent days', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.reputation['lowmark-guild'] = -10;
    await resolveDay({
      day: { ...day, scenarios: [] as string[] } as any,
      dayPath, mercs, llm: new MockScenarioLLM(), roster: r,
    });
    r.dayCount += 1;
    const out2 = await resolveDay({
      day: { ...day, scenarios: [] as string[] } as any,
      dayPath, mercs, llm: new MockScenarioLLM(), roster: r,
    });
    expect(out2.questsStirred.length).toBe(0);
  });

  it('does not stir when no faction is at enemy tier', async () => {
    const { newRoster } = await import('../src/roster.js');
    const r = newRoster([mercs.get('marek')!]);
    r.reputation['lowmark-guild'] = -3; // hostile, not enemy
    const out = await resolveDay({
      day: { ...day, scenarios: [] as string[] } as any,
      dayPath, mercs, llm: new MockScenarioLLM(), roster: r,
    });
    expect(out.questsStirred.length).toBe(0);
  });
});
