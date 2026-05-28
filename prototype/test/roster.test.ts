import { describe, it, expect, beforeEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import {
  newRoster, saveRoster, loadRoster, applyCaptiveEffect,
} from '../src/roster.js';
import { effectOf, type Captive } from '../src/captive.js';

const TAGS_PATH = fileURLToPath(new URL('../data/tags.json', import.meta.url));
const MERCS_PATH = fileURLToPath(new URL('../data/mercs.json', import.meta.url));

describe('roster persistence', () => {
  const tags = loadTags(TAGS_PATH);
  const basePool = loadMercs(MERCS_PATH, tags);

  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'airaider-roster-'));
  });

  it('round-trips an empty/fresh roster', () => {
    const r = newRoster([...basePool.values()]);
    r.dayCount = 3;
    r.gold = 42;
    r.reputation = { feared: 1 };
    const p = join(tmp, 'r.json');
    saveRoster(p, r, basePool);
    expect(existsSync(p)).toBe(true);
    const reloaded = loadRoster(p, basePool, tags);
    expect(reloaded.dayCount).toBe(3);
    expect(reloaded.gold).toBe(42);
    expect(reloaded.reputation.feared).toBe(1);
    expect(reloaded.mercs.length).toBe(basePool.size);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('persists per-merc fatigue across save/load', () => {
    const r = newRoster([...basePool.values()]);
    const marek = r.states.get('marek')!;
    marek.fatigue = 4;
    const p = join(tmp, 'r.json');
    saveRoster(p, r, basePool);
    const reloaded = loadRoster(p, basePool, tags);
    expect(reloaded.states.get('marek')?.fatigue).toBe(4);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('persists recruited captives as generated mercs', () => {
    const r = newRoster([...basePool.values()]);
    const captive: Captive = {
      id: 'cap1', name: 'Kael', archetype: 'deserter',
      backstory: 'caught', notoriety: 2,
      tags: [tags.get('gender:male')!, tags.get('bg:soldier')!],
    };
    r.captives.push(captive);
    const effect = effectOf(captive, 'recruit');
    applyCaptiveEffect(r, captive, effect);
    expect(r.hirePool.some((h) => h.merc.id === 'recruit-cap1')).toBe(true);
    expect(r.mercs.some((m) => m.id === 'recruit-cap1')).toBe(false);
    expect(r.captives.length).toBe(0);
    const benched = r.hirePool.find((h) => h.merc.id === 'recruit-cap1')!;
    expect(benched.price).toBeGreaterThan(0);
    expect(benched.price).toBeLessThan(5); // discounted vs HIRE_BASE_PRICE
    const p = join(tmp, 'r.json');
    saveRoster(p, r, basePool);
    const reloaded = loadRoster(p, basePool, tags);
    expect(reloaded.hirePool.some((h) => h.merc.id === 'recruit-cap1' && h.merc.name === 'Kael')).toBe(true);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('applyCaptiveEffect with ransom updates gold + reputation + removes captive', () => {
    const r = newRoster([...basePool.values()]);
    const captive: Captive = {
      id: 'cap2', name: 'Vorm', archetype: 'bandit', backstory: '', notoriety: 3, tags: [],
    };
    r.captives.push(captive);
    applyCaptiveEffect(r, captive, effectOf(captive, 'ransom'));
    expect(r.gold).toBe(25);
    expect(r.reputation.mercenary).toBe(1);
    expect(r.captives.length).toBe(0);
  });

  it('rejects unknown base merc id on load', async () => {
    const p = join(tmp, 'r.json');
    const broken = {
      schemaVersion: 1,
      dayCount: 0, gold: 0, reputation: {},
      rosterMercIds: ['no-such-merc'],
      generatedMercs: [], mercStates: [], captives: [],
    };
    const { writeFileSync } = await import('node:fs');
    writeFileSync(p, JSON.stringify(broken));
    expect(() => loadRoster(p, basePool, tags)).toThrow(/unknown base merc/);
    rmSync(tmp, { recursive: true, force: true });
  });
});
