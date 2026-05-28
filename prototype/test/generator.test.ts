import { describe, it, expect } from 'vitest';
import { loadTags } from '../src/tags.js';
import { generateMerc, generateRecruitPool } from '../src/generator.js';
import { mulberry32 } from '../src/rng.js';
import { fileURLToPath } from 'node:url';

const TAGS_PATH = fileURLToPath(new URL('../data/tags.json', import.meta.url));

describe('recruit generator', () => {
  const tags = loadTags(TAGS_PATH);

  it('is deterministic given the same seed', () => {
    const a = generateRecruitPool(mulberry32(42), tags, 5);
    const b = generateRecruitPool(mulberry32(42), tags, 5);
    expect(a).toEqual(b);
  });

  it('produces valid mercs: one gender, one background, one temperament', () => {
    const pool = generateRecruitPool(mulberry32(7), tags, 30);
    for (const m of pool) {
      const groups = new Map<string, number>();
      for (const t of m.tags) {
        if (!t.mutexGroup) continue;
        groups.set(t.mutexGroup, (groups.get(t.mutexGroup) ?? 0) + 1);
      }
      for (const [, n] of groups) expect(n).toBe(1);
      expect(groups.get('gender')).toBe(1);
      expect(groups.get('background')).toBe(1);
      expect(groups.get('temperament')).toBe(1);
    }
  });

  it('clamps every attribute to 1..7', () => {
    const pool = generateRecruitPool(mulberry32(99), tags, 50);
    for (const m of pool) {
      for (const v of Object.values(m.attrs)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(7);
      }
    }
  });

  it('respects rarity weighting: legendary tags stay rare (<10% over 200 rolls)', () => {
    const pool = generateRecruitPool(mulberry32(123), tags, 200);
    const legendaryCount = pool.reduce(
      (n, m) => n + m.tags.filter((t) => t.rarity === 'legendary').length,
      0,
    );
    expect(legendaryCount).toBeLessThan(60); // ~3% of (200 * 3-5 tags) expected; cap generous
  });

  it('fresh recruits have veterancy 0, wage 1, hp 3', () => {
    const m = generateMerc(mulberry32(1), tags, {});
    expect(m.veterancy).toBe(0);
    expect(m.wage).toBe(1);
    expect(m.hp).toBe(3);
  });

  it('uses gendered name pools', () => {
    const female = ['Aida', 'Brenna', 'Cessa', 'Drava', 'Ennel', 'Falka', 'Gretha', 'Hessa',
      'Ileth', 'Jovi', 'Kelle', 'Lirra', 'Mavra', 'Nessa', 'Ondra', 'Petra',
      'Quira', 'Rynna', 'Saela', 'Thessa', 'Vanya', 'Yelka'];
    const male = ['Borrek', 'Calden', 'Davrin', 'Eldun', 'Fyrn', 'Garreth', 'Hask', 'Joran',
      'Korm', 'Larik', 'Mortha', 'Nevin', 'Orsen', 'Pell', 'Quenn', 'Rastan',
      'Solm', 'Tarek', 'Ulfar', 'Vellan', 'Wren', 'Yorrick'];
    const pool = generateRecruitPool(mulberry32(2026), tags, 40);
    for (const m of pool) {
      const isFemale = m.tags.some((t) => t.id === 'gender:female');
      const isMale = m.tags.some((t) => t.id === 'gender:male');
      if (isFemale) expect(female).toContain(m.name);
      else if (isMale) expect(male).toContain(m.name);
    }
  });
});
