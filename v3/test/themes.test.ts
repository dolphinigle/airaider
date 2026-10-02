// The saga theme dealer (docs/STORYTELLER.md §D.2): one pure function, no repeat within 50 deals,
// tones and scales dealt evenly although the library is uneven.
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { THEMES, THEME_NO_REPEAT, dealSeed, themeId } from '../src/engine/themes.js';

function run(seed: number, n: number): ReturnType<typeof dealSeed>[] {
  const rng = new Rng(seed);
  const ids: string[] = [];
  const out: ReturnType<typeof dealSeed>[] = [];
  for (let i = 0; i < n; i++) { const d = dealSeed(rng, ids); ids.push(d.id); out.push(d) }
  return out;
}

describe('theme library', () => {
  it('has ≥ 1,000 themes, each with a unique stable id and 4–12 words', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(THEMES.map(t => t.id)).size).toBe(THEMES.length);
    for (const t of THEMES) {
      expect(t.id).toBe(themeId(t.theme));
      const w = t.theme.split(/\s+/).length;
      expect(w).toBeGreaterThanOrEqual(4);
      expect(w).toBeLessThanOrEqual(12);
    }
  });
});

describe('dealSeed', () => {
  it('returns id, theme, tone and scale of a library theme', () => {
    const d = dealSeed(new Rng(1), []);
    expect(Object.keys(d).sort()).toEqual(['id', 'scale', 'theme', 'tone']);
    expect(THEMES.find(t => t.id === d.id)?.theme).toBe(d.theme);
  });

  it('is pure: same rng state and history → same deal; the history is not touched', () => {
    const recent = run(7, 20).map(d => d.id);
    const copy = [...recent];
    expect(dealSeed(new Rng(99), recent)).toEqual(dealSeed(new Rng(99), recent));
    expect(recent).toEqual(copy);
  });

  it(`never repeats a theme within the last ${THEME_NO_REPEAT} deals`, () => {
    const ids = run(11, 1500).map(d => d.id);
    for (let i = 0; i < ids.length; i++) expect(ids.slice(Math.max(0, i - THEME_NO_REPEAT), i)).not.toContain(ids[i]);
  });

  it('balances tone and scale, and rarely repeats the last tone', () => {
    const deals = run(23, 4000);
    const share = (k: 'tone' | 'scale', v: string) => deals.filter(d => d[k] === v).length / deals.length;
    for (const tone of new Set(THEMES.map(t => t.tone))) expect(share('tone', tone)).toBeGreaterThan(0.11), expect(share('tone', tone)).toBeLessThan(0.18);
    for (const scale of new Set(THEMES.map(t => t.scale))) expect(share('scale', scale)).toBeGreaterThan(0.16), expect(share('scale', scale)).toBeLessThan(0.24);
    const sameTone = deals.slice(1).filter((d, i) => d.tone === deals[i]!.tone).length / (deals.length - 1);
    expect(sameTone).toBeLessThan(0.08);
  });
});
