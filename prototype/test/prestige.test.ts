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
  it('adds roomPrestige contribution from placed rooms', () => {
    // displayedCount=1 + 2*0 + (1-1) + roomPrestige=4 → 5
    expect(computePrestige({
      displayedCount: 1, legendaryLeadsCompleted: 0, fortLevel: 1, roomPrestige: 4,
    })).toBe(5);
  });
  it('treats missing roomPrestige as 0 (back-compat)', () => {
    expect(computePrestige({ displayedCount: 2, legendaryLeadsCompleted: 0, fortLevel: 1 })).toBe(2);
  });
  it('adds captivePrestige contribution from themed captives', () => {
    expect(computePrestige({
      displayedCount: 0, legendaryLeadsCompleted: 0, fortLevel: 1, captivePrestige: 3,
    })).toBe(3);
  });
  it('treats missing captivePrestige as 0 (back-compat)', () => {
    expect(computePrestige({ displayedCount: 1, legendaryLeadsCompleted: 0, fortLevel: 1 })).toBe(1);
  });
});

describe('captiveRoomPrestige (themed room scoring)', () => {
  const catalog = new Map([
    ['throne-room', { id: 'throne-room', wantedTags: ['trait:lost-heir', 'pers:charming'] } as any],
    ['storeroom', { id: 'storeroom', wantedTags: [] } as any],
    ['tavern', { id: 'tavern', wantedTags: ['bg:peasant', 'pers:charming'] } as any],
  ]);
  const fort = {
    placedRooms: [
      { roomId: 'throne-room', cellIdx: 0, builtOnDay: 1 },
      { roomId: 'storeroom', cellIdx: 1, builtOnDay: 1 },
      { roomId: 'tavern', cellIdx: 2, builtOnDay: 1 },
    ],
  } as any;

  it('returns 0 for unassigned captives', async () => {
    const { captiveRoomPrestige } = await import('../src/fortLayout.js');
    expect(captiveRoomPrestige(fort, catalog, [{ cellIdx: undefined, tags: [{ id: 'trait:lost-heir' }] }])).toBe(0);
  });
  it('returns 0 for captives in rooms without wantedTags (storeroom)', async () => {
    const { captiveRoomPrestige } = await import('../src/fortLayout.js');
    expect(captiveRoomPrestige(fort, catalog, [{ cellIdx: 1, tags: [{ id: 'trait:lost-heir' }] }])).toBe(0);
  });
  it('gives +1 base for any captive in a themed room with no tag match', async () => {
    const { captiveRoomPrestige } = await import('../src/fortLayout.js');
    expect(captiveRoomPrestige(fort, catalog, [{ cellIdx: 0, tags: [{ id: 'bg:soldier' }] }])).toBe(1);
  });
  it('gives +1 base + 1 per matching tag', async () => {
    const { captiveRoomPrestige } = await import('../src/fortLayout.js');
    // Lost Heir + Charming dropped in Throne Room → base 1 + 2 matches = 3
    expect(captiveRoomPrestige(fort, catalog, [
      { cellIdx: 0, tags: [{ id: 'trait:lost-heir' }, { id: 'pers:charming' }] },
    ])).toBe(3);
  });
  it('sums across multiple captives', async () => {
    const { captiveRoomPrestige } = await import('../src/fortLayout.js');
    expect(captiveRoomPrestige(fort, catalog, [
      { cellIdx: 0, tags: [{ id: 'trait:lost-heir' }] }, // 1+1=2
      { cellIdx: 2, tags: [{ id: 'bg:peasant' }] },       // 1+1=2
      { cellIdx: 1, tags: [{ id: 'trait:lost-heir' }] }, // 0
    ])).toBe(4);
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
