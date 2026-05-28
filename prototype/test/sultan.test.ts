import { describe, it, expect } from 'vitest';
import { mulberry32, rngFromString } from '../src/rng.js';
import { flipCoins, classifyBand, resolveCoins, MAX_COINS, MIN_COINS } from '../src/sultan.js';

describe('rng', () => {
  it('mulberry32 is deterministic for same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('rngFromString gives different streams for different strings', () => {
    const a = rngFromString('foo');
    const b = rngFromString('bar');
    let differ = false;
    for (let i = 0; i < 10; i++) if (a() !== b()) differ = true;
    expect(differ).toBe(true);
  });
});

describe('flipCoins', () => {
  it('returns N coins with heads+tails = N', () => {
    const rng = mulberry32(1);
    for (let n = 1; n <= MAX_COINS; n++) {
      const r = flipCoins(n, rng);
      expect(r.faces).toHaveLength(n);
      expect(r.heads + r.tails).toBe(n);
    }
  });

  it('clamps n below MIN_COINS up to MIN_COINS', () => {
    const r = flipCoins(0, mulberry32(1));
    expect(r.faces).toHaveLength(MIN_COINS);
  });

  it('clamps n above MAX_COINS down to MAX_COINS', () => {
    const r = flipCoins(99, mulberry32(1));
    expect(r.faces).toHaveLength(MAX_COINS);
  });

  it('is deterministic for same seed', () => {
    const r1 = flipCoins(5, mulberry32(7));
    const r2 = flipCoins(5, mulberry32(7));
    expect(r1.faces).toEqual(r2.faces);
  });
});

describe('classifyBand', () => {
  it('all heads N≥3 → catastrophic-favorable', () => {
    const result = classifyBand({ faces: ['heads','heads','heads'], heads: 3, tails: 0 });
    expect(result.band).toBe('catastrophic-favorable');
  });

  it('all tails N≥3 → catastrophic', () => {
    const result = classifyBand({ faces: ['tails','tails','tails'], heads: 0, tails: 3 });
    expect(result.band).toBe('catastrophic');
  });

  it('all heads N=2 is NOT crit (only favorable)', () => {
    const result = classifyBand({ faces: ['heads','heads'], heads: 2, tails: 0 });
    expect(result.band).toBe('favorable');
  });

  it('heads ratio ≥ 0.66 → favorable', () => {
    const result = classifyBand({ faces: ['heads','heads','tails'], heads: 2, tails: 1 });
    expect(result.band).toBe('favorable');
  });

  it('heads ratio < 0.34 → unfavorable', () => {
    const result = classifyBand({ faces: ['heads','tails','tails','tails'], heads: 1, tails: 3 });
    expect(result.band).toBe('unfavorable');
  });

  it('split heads ratio → unfavorable (pessimistic default)', () => {
    const result = classifyBand({ faces: ['heads','heads','tails','tails'], heads: 2, tails: 2 });
    expect(result.band).toBe('unfavorable');
  });

  it('single coin heads → favorable', () => {
    const result = classifyBand({ faces: ['heads'], heads: 1, tails: 0 });
    expect(result.band).toBe('favorable');
  });

  it('single coin tails → unfavorable', () => {
    const result = classifyBand({ faces: ['tails'], heads: 0, tails: 1 });
    expect(result.band).toBe('unfavorable');
  });
});

describe('resolveCoins', () => {
  it('combines flip + classify deterministically', () => {
    const a = resolveCoins(5, mulberry32(99));
    const b = resolveCoins(5, mulberry32(99));
    expect(a).toEqual(b);
  });
});
