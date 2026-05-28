import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { loadFortCatalog, purchaseUpgrade, newFortState } from '../src/fort.js';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster, loadRoster, saveRoster } from '../src/roster.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('M6.4 fort upgrades', () => {
  const catalog = loadFortCatalog(join(ROOT, 'data', 'fort-upgrades.json'));

  it('loads catalog with expected upgrades', () => {
    expect(catalog.get('reinforced-palisade')?.cost).toBe(5);
    expect(catalog.get('watch-tower')?.requiresLevel).toBe(3);
  });

  it('newFortState starts at level 1 with no upgrades', () => {
    const f = newFortState();
    expect(f.level).toBe(1);
    expect(f.upgrades).toEqual([]);
  });

  it('purchaseUpgrade deducts gold and may level up the fort', () => {
    const u = catalog.get('reinforced-palisade')!;
    const res = purchaseUpgrade({ fort: newFortState(), gold: 10, upgrade: u });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.gold).toBe(5);
    expect(res.result.fort.level).toBe(2);
    expect(res.result.fort.upgrades).toEqual(['reinforced-palisade']);
    expect(res.result.leveledUp).toBe(true);
  });

  it('non-levelling upgrade leaves level unchanged', () => {
    const u = catalog.get('winter-larder')!;
    const res = purchaseUpgrade({ fort: newFortState(), gold: 10, upgrade: u });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.fort.level).toBe(1);
    expect(res.result.leveledUp).toBe(false);
  });

  it('rejects insufficient gold without mutating fort', () => {
    const fort = newFortState();
    const u = catalog.get('reinforced-palisade')!;
    const res = purchaseUpgrade({ fort, gold: 2, upgrade: u });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe('insufficient-gold');
    expect(fort.upgrades).toEqual([]);
  });

  it('rejects duplicate purchase', () => {
    const u = catalog.get('winter-larder')!;
    const res = purchaseUpgrade({ fort: { level: 1, upgrades: ['winter-larder'] }, gold: 99, upgrade: u });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe('already-owned');
  });

  it('rejects upgrades that require a higher level', () => {
    const u = catalog.get('smithy')!; // requiresLevel: 2
    const res = purchaseUpgrade({ fort: newFortState(), gold: 99, upgrade: u });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe('level-locked');
  });

  it('roster persists fort state through save/load round-trip', () => {
    const tagPool = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercPool = loadMercs(join(ROOT, 'data', 'mercs.json'), tagPool);
    const dir = mkdtempSync(join(tmpdir(), 'fort-rt-'));
    const path = join(dir, 'r.json');
    const roster = newRoster([...mercPool.values()].slice(0, 2));
    roster.gold = 20;
    roster.fort = { level: 2, upgrades: ['reinforced-palisade', 'winter-larder'] };
    saveRoster(path, roster, mercPool);
    const reloaded = loadRoster(path, mercPool, tagPool);
    expect(reloaded.schemaVersion).toBe(7);
    expect(reloaded.fort.level).toBe(2);
    expect(reloaded.fort.upgrades).toEqual(['reinforced-palisade', 'winter-larder']);
  });

  it('loads a legacy v6 roster (no fort field) with default fort state', () => {
    const tagPool = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercPool = loadMercs(join(ROOT, 'data', 'mercs.json'), tagPool);
    const dir = mkdtempSync(join(tmpdir(), 'fort-v6-'));
    const path = join(dir, 'r.json');
    writeFileSync(path, JSON.stringify({
      schemaVersion: 6, dayCount: 0, gold: 0, reputation: {},
      rosterMercIds: [], generatedMercs: [], mercStates: [], captives: [],
      deceased: [], activeQuests: [], completedQuests: [], pendingErrands: [],
    }));
    const r = loadRoster(path, mercPool, tagPool);
    expect(r.fort).toEqual({ level: 1, upgrades: [] });
  });
});
