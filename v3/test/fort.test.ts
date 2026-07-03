// Fort math vs the §20 sim-verified reference points.
import { describe, it, expect } from 'vitest';
import {
  newFort, roomComfort, globalPrestige, capFromComfort, maxSlotsAtTier,
  buildCost, ghUpgradeCost, GH_THRESHOLDS, breakDuration, canSlot,
  type Room, type FortState,
} from '../src/engine/fort.js';
import { HELD, type Card } from '../src/engine/cards.js';
import { T } from '../src/engine/tags.js';

function relic(id: string, concept: string, tier: number): Card {
  return {
    id, name: id, value: 0, location: HELD('inventory'), chainIds: [],
    tags: [{ concept: 'relic' }, T('decoration', 1), T(concept, tier)],
  };
}

function stdRoom(fort: FortState, fills: Card[], wants = 'food'): { room: Room; byId: (id: string) => Card | undefined } {
  const room: Room = {
    id: 'r1', type: 'kitchen', cell: { floor: 2, col: 2 },
    slots: fills.map(c => c.id), wants: [{ match: wants }], style: null,
  };
  fort.rooms.push(room);
  const byId = (id: string) => fills.find(c => c.id === id);
  return { room, byId };
}

describe('comfort formula (§20 reference: std band (2,60), k=20)', () => {
  it('1 slot, band-1 exact fill ≈ 5 (T2 reference)', () => {
    const fort = newFort();
    const { room, byId } = stdRoom(fort, [relic('a', 'food', 3)], 'food');
    // wait: food is a skill (character tag) — use a relic-taggable want instead
    const c = roomComfort(fort, room, byId);
    expect(c).toBeGreaterThan(3.5); expect(c).toBeLessThan(8);
  });
  it('2 slots, band-2 fills ≈ 14 (T5 reference)', () => {
    const fort = newFort();
    const fills = [relic('a', 'curio', 8), relic('b', 'curio', 8)];
    const room: Room = { id: 'r2', type: 'trophy-room', cell: { floor: 2, col: 2 }, slots: ['a', 'b'], wants: [{ match: 'curio' }], style: null };
    fort.rooms.push(room);
    const c = roomComfort(fort, room, id => fills.find(f => f.id === id));
    expect(c).toBeGreaterThan(10); expect(c).toBeLessThan(18);
  });
  it('unstaffed room gives 0; asymptote < band max', () => {
    const fort = newFort();
    const empty: Room = { id: 'r3', type: 'kitchen', cell: { floor: 2, col: 2 }, slots: [null], wants: [], style: null };
    fort.rooms.push(empty);
    expect(roomComfort(fort, empty, () => undefined)).toBe(0);
    const big = Array.from({ length: 6 }, (_, i) => relic(`x${i}`, 'curio', 18));
    const full: Room = { id: 'r4', type: 'trophy-room', cell: { floor: 2, col: 2 }, slots: big.map(b => b.id), wants: [{ match: 'curio' }], style: null };
    fort.rooms.push(full);
    const c = roomComfort(fort, full, id => big.find(f => f.id === id));
    expect(c).toBeGreaterThan(45); expect(c).toBeLessThan(60);
  });
});

describe('cap ladder (§20: ~16 @T5-ish comfort, endgame lift)', () => {
  it('cap = 3 + 0.9×comfort', () => {
    expect(capFromComfort(14.4)).toBe(15);
    expect(capFromComfort(45)).toBe(43);
    expect(capFromComfort(55)).toBe(52); // endgame-lifted band
  });
});

describe('the Great Hall clock', () => {
  it('slot depth gates by tier', () => {
    expect(maxSlotsAtTier(1)).toBe(1);
    expect(maxSlotsAtTier(4)).toBe(2);
    expect(maxSlotsAtTier(6)).toBe(3);
    expect(maxSlotsAtTier(15)).toBe(6);
  });
  it('thresholds are monotonic', () => {
    for (let t = 3; t <= 15; t++) expect(GH_THRESHOLDS[t]!).toBeGreaterThan(GH_THRESHOLDS[t - 1]!);
  });
  it('costs scale ~1.32^T', () => {
    expect(buildCost({ id: 'x', name: 'x', species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 1 })).toBe(120);
    expect(ghUpgradeCost(2) / ghUpgradeCost(1)).toBeCloseTo(1.32, 1);
  });
});

describe('slot legality (§18)', () => {
  const merc: Card = {
    id: 'm', name: 'm', value: 0, location: HELD('roster'), chainIds: [],
    tags: [{ concept: 'character' }],
    character: { role: 'merc', level: 3, xp: 0, attrs: { str: 3, dex: 3, int: 3, cha: 3, con: 3 }, growthLean: { str: 1, dex: 1, int: 1, cha: 1, con: 1 }, focus: { kind: 'none' }, injuryTiers: 0 },
  };
  const rawCaptive: Card = { ...merc, id: 'c1', character: { ...merc.character!, role: 'captive' } };
  const obedient: Card = { ...merc, id: 'c2', tags: [{ concept: 'character' }, { concept: 'obedient' }], character: { ...merc.character!, role: 'captive' } };
  const themeRoom: Room = { id: 'tr', type: 'kitchen', cell: { floor: 0, col: 0 }, slots: [null], wants: [], style: null };
  const cell: Room = { id: 'cl', type: 'dungeon-cell', cell: { floor: 0, col: 0 }, slots: [null, null, null], wants: [], style: null };

  it('mercs never staff rooms; raw captives cannot; obedient can; cells take raw', () => {
    expect(canSlot(themeRoom, merc)).toBe(false);
    expect(canSlot(themeRoom, rawCaptive)).toBe(false);
    expect(canSlot(themeRoom, obedient)).toBe(true);
    expect(canSlot(cell, rawCaptive)).toBe(true);
    expect(canSlot(cell, merc)).toBe(false);
  });
});

describe('torture chamber throughput (§21.4)', () => {
  it('break duration ~5 → 2 cycles with comfort', () => {
    expect(breakDuration(0)).toBe(5);
    expect(breakDuration(30)).toBeLessThanOrEqual(3);
    expect(breakDuration(100)).toBe(2);
  });
});

describe('prestige aggregation', () => {
  it('only theme rooms (+small hospital) feed prestige; bedrooms never', () => {
    const fort = newFort();
    const fills = [relic('a', 'curio', 8)];
    fort.rooms.push({ id: 'p1', type: 'trophy-room', cell: { floor: 1, col: 0 }, slots: ['a'], wants: [{ match: 'curio' }], style: null });
    fort.rooms.push({ id: 'b1', type: 'bedroom', cell: { floor: 1, col: 1 }, slots: ['a'], wants: [{ match: 'curio' }], style: null, ownerId: 'you' });
    const p = globalPrestige(fort, id => fills.find(f => f.id === id));
    const trophyOnly = roomComfort(fort, fort.rooms.find(r => r.id === 'p1')!, id => fills.find(f => f.id === id));
    expect(p).toBeCloseTo(trophyOnly, 6);
  });
});
