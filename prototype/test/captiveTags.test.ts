import { describe, it, expect } from 'vitest';
import { loadTags } from '../src/tags.js';
import { rollCaptiveTags } from '../src/captiveTags.js';

const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);

describe('rollCaptiveTags', () => {
  it('common lead → 2 common tags', () => {
    const tags = rollCaptiveTags(tagPool, 'common', 'seed-1');
    expect(tags).toHaveLength(2);
    expect(tags.every((t) => t.rarity === 'common')).toBe(true);
  });

  it('uncommon lead → 1 common + 1 uncommon', () => {
    const tags = rollCaptiveTags(tagPool, 'uncommon', 'seed-2');
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.rarity).sort()).toEqual(['common', 'uncommon']);
  });

  it('rare lead → 3 tags including a rare', () => {
    const tags = rollCaptiveTags(tagPool, 'rare', 'seed-3');
    expect(tags).toHaveLength(3);
    expect(tags.some((t) => t.rarity === 'rare')).toBe(true);
  });

  it('legendary lead → 3 tags including a legendary', () => {
    const tags = rollCaptiveTags(tagPool, 'legendary', 'seed-4');
    expect(tags).toHaveLength(3);
    expect(tags.some((t) => t.rarity === 'legendary')).toBe(true);
  });

  it('respects mutex groups (no duplicate gender)', () => {
    for (let i = 0; i < 50; i++) {
      const tags = rollCaptiveTags(tagPool, 'rare', `mutex-seed-${i}`);
      const mutexCounts = new Map<string, number>();
      for (const t of tags) {
        if (t.mutexGroup) mutexCounts.set(t.mutexGroup, (mutexCounts.get(t.mutexGroup) ?? 0) + 1);
      }
      for (const count of mutexCounts.values()) expect(count).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = rollCaptiveTags(tagPool, 'rare', 'identical-seed');
    const b = rollCaptiveTags(tagPool, 'rare', 'identical-seed');
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
  });
});
