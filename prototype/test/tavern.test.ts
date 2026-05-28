import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster, loadRoster, saveRoster } from '../src/roster.js';
import {
  refreshHirePool,
  hireFromPool,
  HirePoolEntry,
  HIRE_POOL_TARGET_SIZE,
  HIRE_REFRESH_INTERVAL_DAYS,
  HIRE_BASE_PRICE,
  HireError,
} from '../src/tavern.js';
import { mulberry32 } from '../src/rng.js';

const ROOT = join(__dirname, '..');
const tags = loadTags(join(ROOT, 'data', 'tags.json'));
const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

describe('M10.1 tavern hire pool', () => {
  it('exports sensible constants', () => {
    expect(HIRE_POOL_TARGET_SIZE).toBe(3);
    expect(HIRE_REFRESH_INTERVAL_DAYS).toBe(7);
    expect(HIRE_BASE_PRICE).toBe(5);
  });

  it('newRoster starts with empty hirePool', () => {
    const r = newRoster([mercs.get('marek')!]);
    expect(r.hirePool).toEqual([]);
  });

  it('refreshHirePool fills to target size with priced entries', () => {
    const r = newRoster([mercs.get('marek')!]);
    const rng = mulberry32(42);
    const added = refreshHirePool(r, rng, tags, 7);
    expect(added.length).toBe(HIRE_POOL_TARGET_SIZE);
    expect(r.hirePool.length).toBe(HIRE_POOL_TARGET_SIZE);
    for (const e of r.hirePool) {
      expect(e.price).toBeGreaterThanOrEqual(HIRE_BASE_PRICE);
      expect(e.price).toBeLessThanOrEqual(HIRE_BASE_PRICE + 2);
      expect(e.postedDay).toBe(7);
      expect(e.merc.id).toMatch(/^tavern-7-|^gen-/);
    }
  });

  it('refreshHirePool is a no-op when pool already at target', () => {
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(1), tags, 7);
    const before = r.hirePool.length;
    const added = refreshHirePool(r, mulberry32(2), tags, 14);
    expect(added).toEqual([]);
    expect(r.hirePool.length).toBe(before);
  });

  it('refreshHirePool tops up partial pools rather than replacing', () => {
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(1), tags, 7);
    const keepId = r.hirePool[0]!.merc.id;
    r.hirePool.splice(1, r.hirePool.length - 1); // leave only one
    refreshHirePool(r, mulberry32(99), tags, 14);
    expect(r.hirePool.length).toBe(HIRE_POOL_TARGET_SIZE);
    expect(r.hirePool[0]!.merc.id).toBe(keepId);
  });

  it('hireFromPool moves merc into roster and deducts gold', () => {
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 20;
    refreshHirePool(r, mulberry32(7), tags, 7);
    const entry = r.hirePool[0]!;
    const before = r.mercs.length;
    const hired = hireFromPool(r, 0);
    expect(hired.id).toBe(entry.merc.id);
    expect(r.mercs.length).toBe(before + 1);
    expect(r.mercs.some((m) => m.id === hired.id)).toBe(true);
    expect(r.states.has(hired.id)).toBe(true);
    expect(r.gold).toBe(20 - entry.price);
    expect(r.hirePool.length).toBe(HIRE_POOL_TARGET_SIZE - 1);
  });

  it('hireFromPool allows debt (gold may go negative)', () => {
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 1;
    refreshHirePool(r, mulberry32(3), tags, 7);
    hireFromPool(r, 0);
    expect(r.gold).toBeLessThan(0);
  });

  it('hireFromPool throws HireError on bad index', () => {
    const r = newRoster([mercs.get('marek')!]);
    expect(() => hireFromPool(r, 0)).toThrow(HireError);
    expect(() => hireFromPool(r, -1)).toThrow(HireError);
  });

  it('roster save/load round-trips hirePool', () => {
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(11), tags, 7);
    const tmp = join(tmpdir(), `tavern-roster-${Date.now()}.json`);
    try {
      saveRoster(tmp, r, mercs);
      const onDisk = JSON.parse(readFileSync(tmp, 'utf8'));
      expect(onDisk.schemaVersion).toBe(11);
      expect(onDisk.hirePool.length).toBe(HIRE_POOL_TARGET_SIZE);
      const reloaded = loadRoster(tmp, mercs, tags);
      expect(reloaded.hirePool.length).toBe(HIRE_POOL_TARGET_SIZE);
      for (let i = 0; i < HIRE_POOL_TARGET_SIZE; i++) {
        expect(reloaded.hirePool[i]!.merc.id).toBe(r.hirePool[i]!.merc.id);
        expect(reloaded.hirePool[i]!.price).toBe(r.hirePool[i]!.price);
        expect(reloaded.hirePool[i]!.postedDay).toBe(r.hirePool[i]!.postedDay);
        expect(reloaded.hirePool[i]!.merc.tags.length).toBe(r.hirePool[i]!.merc.tags.length);
      }
    } finally {
      try { unlinkSync(tmp); } catch {}
    }
  });

  it('older roster JSON (v9) without hirePool defaults to []', () => {
    const file = {
      schemaVersion: 9,
      dayCount: 0,
      gold: 0,
      reputation: {},
      rosterMercIds: ['marek'],
      generatedMercs: [],
      mercStates: [],
      captives: [],
      deceased: [],
      activeQuests: [],
      completedQuests: [],
      pendingErrands: [],
      fort: { level: 1, upgrades: [] },
      fortLog: [],
      consecutiveDebtDays: 0,
    };
    const tmp = join(tmpdir(), `tavern-roster-old-${Date.now()}.json`);
    try {
      writeFileSync(tmp, JSON.stringify(file, null, 2) + '\n', 'utf8');
      const r = loadRoster(tmp, mercs, tags);
      expect(r.hirePool).toEqual([]);
    } finally {
      try { unlinkSync(tmp); } catch {}
    }
  });
});

describe('M10.3 stale listing aging', () => {
  it('exports HIRE_LISTING_TTL_DAYS = 14', async () => {
    const { HIRE_LISTING_TTL_DAYS } = await import('../src/tavern.js');
    expect(HIRE_LISTING_TTL_DAYS).toBe(14);
  });

  it('dropStaleListings removes entries older than TTL', async () => {
    const { dropStaleListings } = await import('../src/tavern.js');
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(1), tags, 7);
    expect(r.hirePool.length).toBe(3);
    // currentDay 22 is 15 days after postedDay 7 → all stale
    const dropped = dropStaleListings(r, 22);
    expect(dropped.length).toBe(3);
    expect(r.hirePool.length).toBe(0);
  });

  it('dropStaleListings keeps entries within TTL', async () => {
    const { dropStaleListings } = await import('../src/tavern.js');
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(1), tags, 7);
    const dropped = dropStaleListings(r, 21); // exactly 14 days old — keep
    expect(dropped).toEqual([]);
    expect(r.hirePool.length).toBe(3);
  });

  it('refreshHirePool ages off + tops up in one pass', async () => {
    const r = newRoster([mercs.get('marek')!]);
    refreshHirePool(r, mulberry32(1), tags, 7);
    const oldIds = r.hirePool.map((e) => e.merc.id);
    refreshHirePool(r, mulberry32(99), tags, 22); // 15 days later → wipe + refill
    expect(r.hirePool.length).toBe(3);
    for (const e of r.hirePool) {
      expect(e.postedDay).toBe(22);
      expect(oldIds).not.toContain(e.merc.id);
    }
  });
});

describe('M10.4 wandering veteran bench entries', () => {
  it('seeds at least one veteran across many refreshes (RNG-stress)', async () => {
    const { newRoster } = await import('../src/roster.js');
    let vetSeen = false;
    for (let seed = 1; seed <= 50 && !vetSeen; seed++) {
      const r = newRoster([mercs.get('marek')!]);
      const added = refreshHirePool(r, mulberry32(seed), tags, 7);
      if (added.some((e) => e.startingTier === 'veteran')) vetSeen = true;
    }
    expect(vetSeen).toBe(true);
  });

  it('veteran entries carry startingXp and 2x price', async () => {
    const { newRoster } = await import('../src/roster.js');
    for (let seed = 1; seed <= 50; seed++) {
      const r = newRoster([mercs.get('marek')!]);
      const added = refreshHirePool(r, mulberry32(seed), tags, 7);
      const vet = added.find((e) => e.startingTier === 'veteran');
      if (vet) {
        expect(vet.startingXp).toBe(12);
        // 2x of base+jitter (5..7) → 10..14
        expect(vet.price).toBeGreaterThanOrEqual(10);
        expect(vet.price).toBeLessThanOrEqual(14);
        return;
      }
    }
    throw new Error('no veteran across 50 seeds');
  });

  it('hireFromPool transfers startingTier + startingXp into roster state', async () => {
    const { newRoster, saveRoster, loadRoster } = await import('../src/roster.js');
    const { hireFromPool } = await import('../src/tavern.js');
    const r = newRoster([mercs.get('marek')!]);
    r.gold = 50;
    // Construct veteran entry deterministically
    refreshHirePool(r, mulberry32(1), tags, 7);
    let vetIdx = -1;
    for (let seed = 1; seed <= 200 && vetIdx < 0; seed++) {
      const r2 = newRoster([mercs.get('marek')!]);
      r2.gold = 50;
      const added = refreshHirePool(r2, mulberry32(seed), tags, 7);
      const i = added.findIndex((e) => e.startingTier === 'veteran');
      if (i >= 0) {
        const merc = hireFromPool(r2, i);
        const st = r2.states.get(merc.id)!;
        expect(st.tier).toBe('veteran');
        expect(st.xp).toBe(12);
        vetIdx = i;
      }
    }
    expect(vetIdx).toBeGreaterThanOrEqual(0);
  });

  it('roster save/load preserves startingTier and startingXp', async () => {
    const { newRoster, saveRoster, loadRoster } = await import('../src/roster.js');
    const { writeFileSync } = await import('node:fs');
    const r = newRoster([mercs.get('marek')!]);
    r.hirePool.push({
      merc: { id: 'tav-test-1', name: 'Test Vet', attrs: { physical: 3, agility: 3, intelligence: 3, charisma: 3, willpower: 3 }, tags: [], veterancy: 0, wage: 1, hp: 3 } as any,
      price: 12,
      postedDay: 7,
      startingTier: 'veteran',
      startingXp: 12,
    });
    const tmp = `/tmp/tavern-m10.4-${Date.now()}.json`;
    saveRoster(tmp, r, mercs);
    const loaded = loadRoster(tmp, mercs, tags);
    expect(loaded.hirePool[0]!.startingTier).toBe('veteran');
    expect(loaded.hirePool[0]!.startingXp).toBe(12);
  });
});
