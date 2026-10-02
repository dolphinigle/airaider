// docs/STORYTELLER.md §2.8.7: every variant of every storyteller template renders cleanly and stays
// within its word budget (skeleton included, every conditional line on that the variant allows).
// A rule cannot land without cutting another.
import { describe, it, expect } from 'vitest';
import { render, wordCount, WORD_BUDGET } from '../src/ai/prompts/render.js';

const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => acc.concat(acc.map(a => [...a, x])), [[]]);

/** the structure arms (§D.1): S deals episodes, H deals the shape but free job types, L deals neither */
const STRUCTURE: Record<string, string[]> = { S: ['shape', 'episodes'], H: ['shape', 'types'], L: ['types'] };

const variants: Record<'plan' | 'card' | 'report', { flags: string[]; vars: Record<string, number> }[]> = {
  plan: Object.values(STRUCTURE).flatMap(arm => [[], ['pitch']].flatMap(card1 =>
    subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: [...arm, ...card1, ...extra], vars: {} })))),
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', ...(pos !== 'later' ? ['personal'] : []), ...(pos === 'finale' ? ['lastchance'] : [])])
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 80 : 70 } }))),
  report: subsets(['decides', 'result', 'option', 'hurt', 'cost', 'brought', 'answer', 'direction']).flatMap(s =>
    [['moved'], ['failure', 'stopped']].map(end => ({ flags: ['saga', ...s, ...end], vars: { B: 60, A: 140 } }))),
};

describe('storyteller prompt budget', () => {
  for (const [name, vs] of Object.entries(variants) as [keyof typeof variants, typeof variants.plan][]) {
    it(`${name}: every variant renders and stays ≤ ${WORD_BUDGET[name]} words`, () => {
      let max = 0, worst = '';
      for (const v of vs) {
        const n = wordCount(render(name, v.flags, v.vars));   // throws on an unrendered tag
        if (n > max) { max = n; worst = v.flags.join(',') }
      }
      expect(max, `${name} worst variant: ${worst}`).toBeLessThanOrEqual(WORD_BUDGET[name]);
    });
  }

  it('drops a conditional line and a conditional span when its flag is off', () => {
    const on = render('card', ['later', 'memory'], { MAX: 70 });
    const off = render('card', ['later'], { MAX: 70 });
    expect(on).toContain('memory:');
    expect(off).not.toContain('memory');
    expect(off).not.toContain('premise');
    expect(render('plan', ['shape', 'episodes'])).not.toContain('"pitch"');
  });
});
