import { describe, it, expect } from 'vitest';
import { loadTags } from '../src/tags.js';
import { rollCaptiveTags } from '../src/captiveTags.js';

const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);

const isDemographic = (mutex?: string) => mutex === 'gender' || mutex === 'race';
const traitRarities = (tags: { rarity: string; mutexGroup?: string }[]) =>
  tags.filter((t) => !isDemographic(t.mutexGroup)).map((t) => t.rarity);

describe('rollCaptiveTags', () => {
  it('always includes exactly 1 gender + 1 race tag', () => {
    for (const rarity of ['common', 'uncommon', 'rare', 'legendary']) {
      const tags = rollCaptiveTags(tagPool, rarity, `dem-${rarity}`);
      expect(tags.filter((t) => t.mutexGroup === 'gender')).toHaveLength(1);
      expect(tags.filter((t) => t.mutexGroup === 'race')).toHaveLength(1);
    }
  });

  it('common lead → 2 common trait tags + demographics', () => {
    const tags = rollCaptiveTags(tagPool, 'common', 'seed-1');
    expect(tags).toHaveLength(4); // 1 gender + 1 race + 2 common traits
    expect(traitRarities(tags).sort()).toEqual(['common', 'common']);
  });

  it('uncommon lead → 1 common + 1 uncommon trait + demographics', () => {
    const tags = rollCaptiveTags(tagPool, 'uncommon', 'seed-2');
    expect(tags).toHaveLength(4);
    expect(traitRarities(tags).sort()).toEqual(['common', 'uncommon']);
  });

  it('rare lead → 3 trait tags including a rare + demographics', () => {
    const tags = rollCaptiveTags(tagPool, 'rare', 'seed-3');
    expect(tags).toHaveLength(5);
    expect(traitRarities(tags)).toContain('rare');
  });

  it('legendary lead → 3 trait tags including a legendary + demographics', () => {
    const tags = rollCaptiveTags(tagPool, 'legendary', 'seed-4');
    expect(tags).toHaveLength(5);
    expect(traitRarities(tags)).toContain('legendary');
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
