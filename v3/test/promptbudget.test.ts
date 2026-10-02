// docs/STORYTELLER.md §2.8.7: every variant of every storyteller template renders cleanly and stays
// within its word budget (skeleton included, every conditional line on that the variant allows).
// A rule cannot land without cutting another.
import { describe, it, expect } from 'vitest';
import { render, wordCount, WORD_BUDGET } from '../src/ai/prompts/render.js';

const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => acc.concat(acc.map(a => [...a, x])), [[]]);

/** the structure arms (§D.1): S deals episodes, H deals the shape but free job types, L deals neither */
const STRUCTURE: Record<string, string[]> = { S: ['shape', 'episodes'], H: ['shape', 'types'], L: ['types'] };

const variants: Record<'plan' | 'card' | 'report', { flags: string[]; vars: Record<string, number> }[]> = {
  // the cast arms (R1, C5): full deals a stake; lean deals none and may leave the one who asks without a trade
  plan: Object.values(STRUCTURE).flatMap(arm => [['stake'], ['notrade'], []].flatMap(cast =>
    subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: [...arm, ...cast, ...extra], vars: {} })))),
  // loses: card 1's premise carries the loss (a want that already says it gets none)
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', ...(pos === 'first' ? ['loses'] : []), ...(pos !== 'later' ? ['personal'] : []), ...(pos === 'finale' ? ['lastchance'] : [])])
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  // hurtprice: a partial whose price is the wound, so it comes with hurt and never with cost;
  // personal: the soldier whose past the story is went, and the summary may name them
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'answer', 'direction'])
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost'))).flatMap(s =>
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
    // card 1 is its own call (R1, C3): the plan has no pitch; every job carries a why (C1)
    expect(render('plan', ['types', 'stake'])).not.toContain('pitch');
    expect(render('plan', ['types', 'stake'])).toContain('"why"');
    expect(render('plan', ['types'])).not.toContain('stake:');
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).toContain('"truth"');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('truth');
    // a personal plan asks the soldier for want and past in an object of its own, never past on every cast entry
    expect(render('plan', ['types', 'personal'])).toContain('"soldier": {"want"');
    expect(render('plan', ['types'])).not.toContain('"past"');
    // a rule about absent data never reaches the model (R1 verify 2): no loss line without a loss
    expect(render('card', ['first', 'loses'], { MAX: 70 })).toContain('their loss');
    expect(render('card', ['first'], { MAX: 70 })).not.toContain('loss');
    expect(render('report', ['saga', 'moved', 'personal'], { B: 60, A: 140 })).toContain('whose past this story is');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('past');
  });
});
