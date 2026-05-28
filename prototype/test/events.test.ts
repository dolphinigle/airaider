import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadEventCatalog, eligibleEvents, rollEvent, rollEventForDay,
} from '../src/events.js';
import { rngFromString } from '../src/rng.js';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster } from '../src/roster.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import { DAYS_PER_SEASON } from '../src/season.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('M7.4 daily events', () => {
  const catalog = loadEventCatalog(join(ROOT, 'data', 'events.json'));

  it('loads catalog with at least one event per season', () => {
    expect(catalog.length).toBeGreaterThan(0);
    for (const s of ['thaw', 'high', 'wane', 'frost']) {
      expect(catalog.some((e) => !e.seasons || e.seasons.includes(s as any))).toBe(true);
    }
  });

  it('eligibleEvents filters by season', () => {
    const thaw = eligibleEvents(catalog, { dayCount: 1, season: 'thaw', fortUpgrades: [] });
    const frost = eligibleEvents(catalog, { dayCount: 1, season: 'frost', fortUpgrades: [] });
    expect(thaw.some((e) => e.id === 'thaw-market-day')).toBe(true);
    expect(thaw.some((e) => e.id === 'frost-supplies-thin')).toBe(false);
    expect(frost.some((e) => e.id === 'frost-supplies-thin')).toBe(true);
  });

  it('eligibleEvents respects requiresMissingUpgrades', () => {
    const without = eligibleEvents(catalog, { dayCount: 1, season: 'frost', fortUpgrades: [] });
    const withLarder = eligibleEvents(catalog, { dayCount: 1, season: 'frost', fortUpgrades: ['winter-larder'] });
    expect(without.some((e) => e.id === 'frost-supplies-thin')).toBe(true);
    expect(withLarder.some((e) => e.id === 'frost-supplies-thin')).toBe(false);
    expect(withLarder.some((e) => e.id === 'frost-larder-holds')).toBe(true);
  });

  it('eligibleEvents respects requiresUpgrades', () => {
    const without = eligibleEvents(catalog, { dayCount: 1, season: 'high', fortUpgrades: [] });
    const withSmithy = eligibleEvents(catalog, { dayCount: 1, season: 'high', fortUpgrades: ['smithy'] });
    expect(without.some((e) => e.id === 'smithy-extra-orders')).toBe(false);
    expect(withSmithy.some((e) => e.id === 'smithy-extra-orders')).toBe(true);
  });

  it('rollEvent returns null when nothing is eligible', () => {
    expect(rollEvent([], { dayCount: 1, season: 'thaw', fortUpgrades: [] }, rngFromString('x'))).toBeNull();
  });

  it('rollEventForDay is deterministic across runs', () => {
    const ctx = { dayCount: 7, season: 'frost' as const, fortUpgrades: ['winter-larder'] };
    const a = rollEventForDay(catalog, ctx);
    const b = rollEventForDay(catalog, ctx);
    expect(a?.id).toBe(b?.id);
  });

  it('day loop applies a frost event without larder (-1g, +1 fatigue)', async () => {
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const roster = newRoster([mercs.get('marek')!, mercs.get('veska')!]);
    roster.dayCount = DAYS_PER_SEASON * 3; // currentDay = +1 → frost
    roster.gold = 5;
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    // Patch the day to only run scenarios whose mercs we have
    const r = await resolveDay({
      day: { ...day, scenarios: [] as string[] } as any,
      dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(), roster,
    });
    expect(r.seasonClock?.season).toBe('frost');
    expect(r.dailyEvent).not.toBeNull();
    if (!r.dailyEvent) return;
    // Either frost-supplies-thin (no larder) or frost-larder-holds (has larder).
    expect(['frost-supplies-thin', 'frost-larder-holds']).toContain(r.dailyEvent.id);
    if (r.dailyEvent.id === 'frost-supplies-thin') {
      // M9.1: dayCount=90 → currentDay=91 which is %7==0, so wages
      // (marek + veska = 2g) are also deducted on top of the event's −1g.
      expect(roster.gold).toBe(5 - 1 - 2);
    }
  });

  it('roster-less day loop produces dailyEvent null', async () => {
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(),
    });
    expect(r.dailyEvent).toBeNull();
  });

  it('chapel-gated event surfaces in frost when chapel is owned', () => {
    const eligible = eligibleEvents(catalog, {
      dayCount: 1, season: 'frost', fortUpgrades: ['chapel'],
    });
    expect(eligible.some((e) => e.id === 'frost-chapel-vigil')).toBe(true);
    const withoutChapel = eligibleEvents(catalog, {
      dayCount: 1, season: 'frost', fortUpgrades: [],
    });
    expect(withoutChapel.some((e) => e.id === 'frost-chapel-vigil')).toBe(false);
  });

  it('every season has at least two eligible bare-fort events', () => {
    for (const s of ['thaw', 'high', 'wane', 'frost'] as const) {
      const pool = eligibleEvents(catalog, { dayCount: 1, season: s, fortUpgrades: [] });
      expect(pool.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('M8.2 enemy-tier punitive events', () => {
  const catalog = [
    {
      id: 'punitive', label: 'p', narration: 'n', weight: 1,
      requiresEnemyFaction: true,
      effect: { goldDelta: -2, fatigueDelta: 0, reputationDeltas: [] },
    },
    {
      id: 'generic', label: 'g', narration: 'n', weight: 1,
      effect: { goldDelta: 0, fatigueDelta: 0, reputationDeltas: [] },
    },
  ];

  it('filters out punitive events when no enemy faction present', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [] };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id)).toEqual(['generic']);
  });

  it('includes punitive events when an enemy faction is present', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [], enemyFactions: ['black-hill-gang'] };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id).sort()).toEqual(['generic', 'punitive']);
  });

  it('treats an empty enemyFactions iterable the same as none', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [], enemyFactions: [] };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id)).toEqual(['generic']);
  });
});

describe('M11.3 captive notoriety event gate', () => {
  const catalog = [
    {
      id: 'sympathizer', label: 's', narration: 'n', weight: 1,
      requiresCaptiveNotorietyMin: 4,
      effect: { goldDelta: -3, fatigueDelta: 0, reputationDeltas: [] },
    },
    {
      id: 'rescue', label: 'r', narration: 'n', weight: 1,
      requiresCaptiveNotorietyMin: 5,
      effect: { goldDelta: 0, fatigueDelta: 1, reputationDeltas: [] },
    },
    {
      id: 'generic', label: 'g', narration: 'n', weight: 1,
      effect: { goldDelta: 0, fatigueDelta: 0, reputationDeltas: [] },
    },
  ];

  it('filters out captive-gated events when no captives present', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [] };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id)).toEqual(['generic']);
  });

  it('admits sympathizer at notoriety 4 but not rescue', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [], maxCaptiveNotoriety: 4 };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id).sort()).toEqual(['generic', 'sympathizer']);
  });

  it('admits both at notoriety 5+', () => {
    const ctx = { dayCount: 1, season: undefined, fortUpgrades: [], maxCaptiveNotoriety: 6 };
    const pool = eligibleEvents(catalog as any, ctx);
    expect(pool.map((e) => e.id).sort()).toEqual(['generic', 'rescue', 'sympathizer']);
  });

  it('seed catalog contains the two captive events', () => {
    const path = new URL('../data/events.json', import.meta.url).pathname;
    const seedCatalog = loadEventCatalog(path);
    const ids = seedCatalog.map((e) => e.id);
    expect(ids).toContain('captive-sympathizer-bribe');
    expect(ids).toContain('captive-rescue-probe');
  });
});
