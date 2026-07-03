// §10 pass-table verification — the locked design checks, computed exactly via odds().
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { U, coins, slotThreshold, odds, type SlotTest } from '../src/engine/roll.js';
import { T, tagValue } from '../src/engine/tags.js';
import { HELD, type Card } from '../src/engine/cards.js';

// build a unit with an exact build-share in the tested attr (§10: weak .7 / decent 1.1 / good 1.5 / great 2.0)
function unit(level: number, share: number, tags: string[] = [], tiers: Record<string, number> = {}): Card {
  const attr = 3 + share * 2 * (level - 1);
  return {
    id: 'u', name: 'test', value: 0, location: HELD('roster'), chainIds: [],
    tags: [{ concept: 'character' }, ...tags.map(t => T(t, tiers[t]))],
    character: {
      role: 'merc', level, xp: 0,
      attrs: { str: attr, dex: 3, int: 3, cha: 3, con: 3 },
      growthLean: { str: 1, dex: 1, int: 1, cha: 1, con: 1 },
      focus: { kind: 'none' }, injuryTiers: 0,
    },
  };
}

const test = (level: number, difficulty: SlotTest['difficulty'], favored: string[] = []): SlotTest =>
  ({ attributes: ['str'], favored, clashing: [], difficulty, level });

function pSuccess(u: Card, t: SlotTest): number {
  return odds(coins(u, t), slotThreshold(t)).success;
}

describe('§10 pass-table (locked design checks)', () => {
  for (const L of [3, 10, 20, 40]) {
    it(`L${L}: great, no-tag @ hard ≈ coin`, () => {
      const p = pSuccess(unit(L, 2.0), test(L, 'hard'));
      expect(p).toBeGreaterThan(0.40); expect(p).toBeLessThan(0.60);
    });
    it(`L${L}: good, no-tag @ standard = sure`, () => {
      const p = pSuccess(unit(L, 1.5), test(L, 'standard'));
      expect(p).toBeGreaterThan(L <= 3 ? 0.85 : 0.95);
    });
    it(`L${L}: decent, no-tag @ standard clears`, () => {
      const p = pSuccess(unit(L, 1.1), test(L, 'standard'));
      expect(p).toBeGreaterThan(0.70);
    });
    it(`L${L}: great, no-tag @ brutal fails`, () => {
      const p = pSuccess(unit(L, 2.0), test(L, 'brutal'));
      expect(p).toBeLessThan(L <= 3 ? 0.10 : 0.02);
    });
    it(`L${L}: great + matching tag @ brutal ≈ coin`, () => {
      const p = pSuccess(unit(L, 2.0, ['melee'], { melee: 5 }), test(L, 'brutal', ['melee']));
      expect(p).toBeGreaterThan(0.33); expect(p).toBeLessThan(0.58);
    });
    it(`L${L}: great + both tags @ extreme ≈ coin`, () => {
      // matching (favored melee) + attribute-tag (muscular body 0.4U + soldier bg at full depth 0.1U)
      const u = unit(L, 2.0, ['melee', 'muscular', 'soldier'], { melee: 5, muscular: 8, soldier: 20 });
      const p = pSuccess(u, test(L, 'extreme', ['melee']));
      expect(p).toBeGreaterThan(0.40); expect(p).toBeLessThan(0.68);
    });
  }

  it('matching tag is tier-blind and does not stack (§16-F2)', () => {
    const L = 10;
    const low = coins(unit(L, 1.5, ['melee'], { melee: 1 }), test(L, 'hard', ['melee']));
    const high = coins(unit(L, 1.5, ['melee'], { melee: 19 }), test(L, 'hard', ['melee']));
    const two = coins(unit(L, 1.5, ['melee', 'roguery'], { melee: 5, roguery: 5 }), test(L, 'hard', ['melee', 'roguery']));
    expect(low).toBe(high);
    expect(two).toBe(high); // owning 2 favored ≠ more than 1
  });

  it('clash mirrors the matching bonus', () => {
    const L = 10;
    const clean = coins(unit(L, 1.5), test(L, 'hard'));
    const clashed = coins(unit(L, 1.5, ['hotheaded']), { ...test(L, 'hard'), clashing: ['hotheaded'] });
    expect(Math.abs(clean - clashed - 0.5 * U(L))).toBeLessThanOrEqual(1);
  });

  it('opposite of a favored concept clashes (§9b)', () => {
    const L = 10;
    const t: SlotTest = { attributes: ['str'], favored: ['cool'], clashing: [], difficulty: 'hard', level: L };
    const withOpp = coins(unit(L, 1.5, ['hotheaded']), t);
    const clean = coins(unit(L, 1.5), t);
    expect(Math.abs(clean - withOpp - 0.5 * U(L))).toBeLessThanOrEqual(1);
  });

  it('injury: flat 0.2U per tier, floored at 0', () => {
    const L = 10;
    const u = unit(L, 2.0);
    const before = coins(u, test(L, 'hard'));
    u.character!.injuryTiers = 3;
    expect(before - coins(u, test(L, 'hard'))).toBe(Math.round(0.6 * U(L)));
    u.character!.injuryTiers = 99;
    expect(coins(u, test(L, 'hard'))).toBe(0);
  });

  it('multi-stat: bar ×(n+1)/2; hybrid fits, lopsided underperforms', () => {
    const L = 10;
    const multi: SlotTest = { attributes: ['str', 'dex'], favored: [], clashing: [], difficulty: 'hard', level: L };
    expect(slotThreshold(multi)).toBeCloseTo(1.0 * U(L) / 2 * 1.5, 5);
    // hybrid: two good stats (1.5 each — dual focus) beats a single great + dump
    const hybrid = unit(L, 0);
    hybrid.character!.attrs = { str: 3 + 3 * (L - 1), dex: 3 + 3 * (L - 1), int: 3, cha: 3, con: 3 };
    const lopsided = unit(L, 2.0); // great str, dex dump (3)
    expect(pSuccess(hybrid, multi)).toBeGreaterThan(pSuccess(lopsided, multi));
  });
});

describe('tag values (§8 curve)', () => {
  it('t20 apex ≈ 1.19M; skill growth weights diverge', () => {
    expect(tagValue(T('melee', 20))).toBeGreaterThan(1_000_000);
    expect(tagValue(T('melee', 20))).toBeLessThan(1_400_000);
    expect(tagValue(T('food', 20))).toBeLessThan(20_000);   // ~13k ceiling
    expect(tagValue(T('melee', 1))).toBe(6);                 // every skill t1 ≈ 6
    expect(tagValue(T('food', 1))).toBe(6);
  });
  it('identity tags are worth 0; negatives are negative and shallow', () => {
    expect(tagValue(T('human'))).toBe(0);
    expect(tagValue(T('cool'))).toBe(0);            // W1: personality all value 0
    expect(tagValue(T('tall', 5))).toBe(0);          // value-0-but-tiered
    expect(tagValue(T('scrawny', 4))).toBeLessThan(0);
    expect(tagValue(T('scrawny', 4))).toBeGreaterThan(-50); // shallow: complications, not financing
  });
});

describe('rng', () => {
  it('deterministic + state round-trip', () => {
    const a = new Rng(42);
    const seq1 = [a.next(), a.next(), a.next()];
    const saved = a.state();
    const cont1 = [a.next(), a.next()];
    const b = new Rng(saved);
    const cont2 = [b.next(), b.next()];
    expect(cont1).toEqual(cont2);
    expect(seq1).toEqual([new Rng(42).next(), NaN, NaN].slice(0, 1).concat(seq1.slice(1))); // first value matches a fresh seed
  });
  it('fixedSumVector sums to total', () => {
    const v = new Rng(7).fixedSumVector(5, 15);
    expect(v.reduce((x, y) => x + y, 0)).toBeCloseTo(15, 9);
  });
});
