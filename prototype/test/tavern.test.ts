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
      expect(onDisk.schemaVersion).toBe(10);
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
