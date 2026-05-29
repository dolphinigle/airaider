import { describe, it, expect } from 'vitest';
import {
  computePrestige,
  prestigeTier,
  tiltRarityWeights,
  prestigeTierLabel,
  type PrestigeTier,
} from '../src/prestige.js';

describe('computePrestige', () => {
  it('returns 0 for a fresh fort', () => {
    expect(computePrestige({ displayedCount: 0, legendaryLeadsCompleted: 0, fortLevel: 1 })).toBe(0);
  });
  it('weights legendary kills 2x', () => {
    expect(computePrestige({ displayedCount: 1, legendaryLeadsCompleted: 1, fortLevel: 1 })).toBe(3);
  });
  it('counts fort level above 1', () => {
    expect(computePrestige({ displayedCount: 0, legendaryLeadsCompleted: 0, fortLevel: 3 })).toBe(2);
  });
});

describe('prestigeTier', () => {
  it('classifies tiers across the score band', () => {
    expect(prestigeTier(0)).toBe('unknown');
    expect(prestigeTier(2)).toBe('whispered');
    expect(prestigeTier(4)).toBe('feared');
    expect(prestigeTier(7)).toBe('storied');
    expect(prestigeTier(12)).toBe('legendary');
  });
});

describe('tiltRarityWeights', () => {
  const base = { common: 60, uncommon: 28, rare: 10, legendary: 2 };
  it('returns base for unknown tier', () => {
    expect(tiltRarityWeights(base, 'unknown')).toEqual(base);
  });
  it('reduces common and bumps higher tiers as prestige climbs', () => {
    const tiers: PrestigeTier[] = ['unknown', 'whispered', 'feared', 'storied', 'legendary'];
    let lastCommon = base.common + 1;
    let lastLegendary = -1;
    for (const t of tiers) {
      const w = tiltRarityWeights(base, t);
      expect(w.common).toBeLessThanOrEqual(lastCommon);
      expect(w.legendary).toBeGreaterThanOrEqual(lastLegendary);
      lastCommon = w.common;
      lastLegendary = w.legendary;
    }
  });
  it('does not mutate the input weights', () => {
    const snapshot = { ...base };
    tiltRarityWeights(base, 'legendary');
    expect(base).toEqual(snapshot);
  });
});

describe('prestigeTierLabel', () => {
  it('returns human-readable labels', () => {
    expect(prestigeTierLabel('unknown')).toBe('unknown');
    expect(prestigeTierLabel('legendary')).toBe('LEGENDARY');
  });
});
