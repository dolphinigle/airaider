import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster, loadRoster, saveRoster } from '../src/roster.js';
import { applyVeterancyXp, tierFor, XP_PER_BAND, TIER_THRESHOLDS } from '../src/veterancy.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'fixtures', '.tmp-veterancy-roster.json');

describe('M6.1 veterancy progression', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

  it('tierFor matches the published thresholds', () => {
    expect(tierFor(0)).toBe('rookie');
    expect(tierFor(TIER_THRESHOLDS.veteran - 1)).toBe('rookie');
    expect(tierFor(TIER_THRESHOLDS.veteran)).toBe('veteran');
    expect(tierFor(TIER_THRESHOLDS.grizzled - 1)).toBe('veteran');
    expect(tierFor(TIER_THRESHOLDS.grizzled)).toBe('grizzled');
  });

  it('grants xp per band and returns no promotion when threshold not crossed', () => {
    const roster = newRoster([...mercs.values()]);
    const r = applyVeterancyXp(roster, ['marek'], 'favorable');
    expect(r).toEqual([]);
    expect(roster.states.get('marek')!.xp).toBe(XP_PER_BAND.favorable);
    expect(roster.states.get('marek')!.tier).toBe('rookie');
  });

  it('emits exactly one promotion when crossing the veteran threshold', () => {
    const roster = newRoster([...mercs.values()]);
    // Push marek to 8 xp first (just under veteran=10), then one favorable run.
    roster.states.get('marek')!.xp = 8;
    const r1 = applyVeterancyXp(roster, ['marek'], 'favorable'); // +2 -> 10
    expect(r1).toHaveLength(1);
    expect(r1[0]).toMatchObject({ mercId: 'marek', fromTier: 'rookie', toTier: 'veteran', xpAfter: 10 });
    // A follow-up favorable run must NOT re-emit a promotion.
    const r2 = applyVeterancyXp(roster, ['marek'], 'favorable'); // +2 -> 12
    expect(r2).toEqual([]);
    expect(roster.states.get('marek')!.tier).toBe('veteran');
  });

  it('catastrophic still grants 1 xp ("brutal lesson")', () => {
    const roster = newRoster([...mercs.values()]);
    applyVeterancyXp(roster, ['marek'], 'catastrophic');
    expect(roster.states.get('marek')!.xp).toBe(1);
  });

  it('silently skips mercs missing from the roster (e.g. just-died)', () => {
    const roster = newRoster([...mercs.values()]);
    roster.states.delete('marek');
    const r = applyVeterancyXp(roster, ['marek', 'imogen'], 'favorable');
    expect(r).toEqual([]);
    expect(roster.states.get('imogen')!.xp).toBe(2);
  });

  it('roster loader migrates v4 JSON (no xp/tier) to v5 defaults', () => {
    const v4Roster = {
      schemaVersion: 4,
      dayCount: 1,
      gold: 0,
      reputation: {},
      rosterMercIds: ['marek'],
      generatedMercs: [],
      mercStates: [{ id: 'marek', fatigue: 1, hpDamage: 0, veterancyGain: 0 }],
      captives: [],
      deceased: [],
      activeQuests: [],
      completedQuests: [],
      pendingErrands: [],
    };
    writeFileSync(TMP, JSON.stringify(v4Roster), 'utf8');
    try {
      const loaded = loadRoster(TMP, mercs, tags);
      const state = loaded.states.get('marek')!;
      expect(state.xp).toBe(0);
      expect(state.tier).toBe('rookie');
      // Save round-trips as v5.
      saveRoster(TMP, loaded, mercs);
      const onDisk = JSON.parse(readFileSync(TMP, 'utf8'));
      expect(onDisk.schemaVersion).toBe(8);
      expect(onDisk.mercStates[0].tier).toBe('rookie');
    } finally {
      if (existsSync(TMP)) rmSync(TMP);
    }
  });

  it('day loop surfaces promotions on the DayResolution', async () => {
    const roster = newRoster([...mercs.values()]);
    // Pre-seed marek + roselle + veska just under threshold so day-01 promotes.
    roster.states.get('marek')!.xp = 8;
    roster.states.get('roselle')!.xp = 9;
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(), roster,
    });
    const ids = r.promotions.map((p) => p.mercId).sort();
    expect(ids).toContain('marek');
    expect(ids).toContain('roselle');
    expect(roster.states.get('marek')!.tier).toBe('veteran');
  });

  it('roster-less day loop emits empty promotions array', async () => {
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(),
    });
    expect(r.promotions).toEqual([]);
  });
});
