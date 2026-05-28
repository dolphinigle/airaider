import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { computeSlotContributions, resolveScenario, type Assignment } from '../src/resolver.js';
import { rngFromString } from '../src/rng.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TAGS_PATH = join(ROOT, 'data', 'tags.json');
const MERCS_PATH = join(ROOT, 'data', 'mercs.json');

describe('computeSlotContributions', () => {
  it('marek on the lock slot: base + physical≥4 + muscular tag = 3 coins', () => {
    const tags = loadTags(TAGS_PATH);
    const mercs = loadMercs(MERCS_PATH, tags);
    const fixture = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));
    const marek = mercs.get('marek')!;
    const contrib = computeSlotContributions(fixture, [{ slotId: 'lock', merc: marek }]);
    expect(contrib[0]!.coinsContributed).toBe(3);
    expect(contrib[0]!.attrUsed).toBe('physical');
    expect(contrib[0]!.attrScore).toBe(5);
    expect(contrib[0]!.tagsMatched).toEqual(['phys:muscular']);
  });

  it('roselle on the sentry slot: base + agility≥4 + quick tag = 3 coins', () => {
    const tags = loadTags(TAGS_PATH);
    const mercs = loadMercs(MERCS_PATH, tags);
    const fixture = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));
    const roselle = mercs.get('roselle')!;
    const contrib = computeSlotContributions(fixture, [{ slotId: 'sentry', merc: roselle }]);
    expect(contrib[0]!.coinsContributed).toBe(3);
    expect(contrib[0]!.tagsMatched).toEqual(['phys:quick']);
  });

  it('imogen on the lock slot: physical=2 (no bonus), no muscular tag = 1 coin', () => {
    const tags = loadTags(TAGS_PATH);
    const mercs = loadMercs(MERCS_PATH, tags);
    const fixture = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));
    const imogen = mercs.get('imogen')!;
    const contrib = computeSlotContributions(fixture, [{ slotId: 'lock', merc: imogen }]);
    expect(contrib[0]!.coinsContributed).toBe(1);
  });
});

describe('resolveScenario (with MockScenarioLLM)', () => {
  it('raid-01 with marek+roselle is deterministic and capped at coinBudget=3', async () => {
    const tags = loadTags(TAGS_PATH);
    const mercs = loadMercs(MERCS_PATH, tags);
    const fixture = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));
    const assignments: Assignment[] = fixture.assignments!.map((a) => ({
      slotId: a.slotId,
      merc: mercs.get(a.mercId)!,
    }));
    const r1 = await resolveScenario({
      scenario: fixture,
      assignments,
      llm: new MockScenarioLLM(),
      rng: rngFromString(fixture.seed!),
    });
    const r2 = await resolveScenario({
      scenario: fixture,
      assignments,
      llm: new MockScenarioLLM(),
      rng: rngFromString(fixture.seed!),
    });
    expect(r1).toEqual(r2);

    // Summed contributions: 3 + 3 = 6; budget=3, partyBonus=0 → coinsActual=3
    expect(r1.coinsActual).toBe(3);
    expect(r1.rollFaces).toHaveLength(3);
    expect(r1.contributions).toHaveLength(2);
    expect(r1.llmName).toBe('mock');
  });

  it('mutex violation throws on load', () => {
    // tag pool with two tags in same mutex group, merc carrying both
    const tags = new Map<string, import('../src/types.js').Tag>([
      ['a', { id: 'a', category: 'c', rarity: 'common', tier: 5, mutexGroup: 'g', label: 'A' }],
      ['b', { id: 'b', category: 'c', rarity: 'common', tier: 5, mutexGroup: 'g', label: 'B' }],
    ]);
    // Build merc inline to test enforceMutex via loadMercs
    const tmpPath = join(ROOT, 'test', '_mutex-fixture.json');
    writeFileSync(tmpPath, JSON.stringify([{
      id: 'x', name: 'X', attrs: {physical:3,agility:3,intelligence:3,charisma:3,willpower:3},
      tagIds: ['a','b']
    }]));
    try {
      expect(() => loadMercs(tmpPath, tags)).toThrow(/mutex group/);
    } finally {
      try { unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  });
});
