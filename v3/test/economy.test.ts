import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { vBase, chainPayoff, splitOneOff, generateCard, chainFocalTarget } from '../src/engine/economy.js';
import { tagsValue, validateTags, maxTier, CONCEPT } from '../src/engine/tags.js';
import { cardType } from '../src/engine/cards.js';

describe('economy', () => {
  it('vBase anchors: 30 at L1, ×1.35 per level', () => {
    expect(vBase(1)).toBe(30);
    expect(vBase(10) / vBase(9)).toBeCloseTo(1.35, 9);
  });

  it('one-off split sums to V (leads priced in, §21.2)', () => {
    const rng = new Rng(1);
    for (let i = 0; i < 200; i++) {
      const V = rng.range(50, 2000);
      const parts = splitOneOff(rng, V, rng.pick(['raid', 'capture', 'rescue', 'hunt', 'contract'] as const));
      const sum = parts.reduce((s, p) => s + p.value, 0);
      expect(Math.abs(sum - V)).toBeLessThanOrEqual(2); // rounding only
    }
  });

  it('chain focal target = 55–85% of payoff', () => {
    const rng = new Rng(2);
    const payoff = chainPayoff(4, 5, 'rare');
    for (let i = 0; i < 50; i++) {
      const t = chainFocalTarget(rng, payoff);
      expect(t).toBeGreaterThanOrEqual(0.55 * payoff - 1);
      expect(t).toBeLessThanOrEqual(0.85 * payoff + 1);
    }
  });

  it('generateCard: valid tags, marked value, ceiling respected', () => {
    const rng = new Rng(3);
    for (const [target, level] of [[80, 2], [400, 6], [3000, 12]] as const) {
      for (let i = 0; i < 40; i++) {
        const c = generateCard(rng, { domain: 'character', targetV: target, contentLevel: level, role: 'captive' });
        expect(validateTags(c.tags)).toEqual([]);
        expect(c.value).toBe(target);            // MARKED
        expect(cardType(c)).toBe('character');
        for (const t of c.tags) {
          if (t.tier) expect(t.tier).toBeLessThanOrEqual(maxTier(level));
        }
        expect(c.character!.level).toBe(level);
      }
    }
  });

  it('generateCard: substance tracks the mark on average (jackpot gap allowed per-card)', () => {
    const rng = new Rng(4);
    for (const [target, level] of [[150, 4], [800, 8]] as const) {
      let sum = 0; const n = 300;
      for (let i = 0; i < n; i++) {
        sum += Math.max(0, tagsValue(generateCard(rng, { domain: 'character', targetV: target, contentLevel: level }).tags));
      }
      const mean = sum / n;
      expect(mean).toBeGreaterThan(target * 0.5);
      expect(mean).toBeLessThan(target * 1.8);
    }
  });

  it('generateCard: relics carry a form + style', () => {
    const rng = new Rng(5);
    const r = generateCard(rng, { domain: 'relic', targetV: 200, contentLevel: 5 });
    expect(cardType(r)).toBe('relic');
    expect(r.tags.some(t => CONCEPT[t.concept]?.group === 'form')).toBe(true);
    expect(r.tags.some(t => CONCEPT[t.concept]?.group === 'style')).toBe(true);
  });

  it('generateCard honors required tags (the §4 handoff, guarded)', () => {
    const rng = new Rng(6);
    const c = generateCard(rng, {
      domain: 'character', targetV: 300, contentLevel: 5,
      required: [{ concept: 'soldier', tier: 6 }, { concept: 'nosuchtag' }],
    });
    expect(c.tags.some(t => t.concept === 'soldier')).toBe(true);
    expect(c.tags.some(t => t.concept === 'nosuchtag')).toBe(false);
    expect(validateTags(c.tags)).toEqual([]);
  });
});
