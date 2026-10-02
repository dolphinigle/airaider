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
  // loses: card 1's premise carries the loss (a want that already says it gets none). R2: after card 1, `mystery`
  // (what was learned) and `have` (what the company holds); `retry` re-poses a later job (a finale is never
  // re-posed); `edge` (how each held gain helps) is the finale's, and only with `have`
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', ...(pos === 'first' ? ['loses'] : []), ...(pos !== 'later' ? ['personal'] : []), ...(pos === 'finale' ? ['lastchance', 'edge'] : []),
    ...(pos !== 'first' ? ['mystery', 'have'] : []), ...(pos === 'later' ? ['retry'] : [])])
    .filter(s => !s.includes('edge') || s.includes('have'))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  // hurtprice: a partial whose price is the wound, so it comes with hurt and never with cost;
  // personal: the soldier whose past the story is went, and the summary may name them.
  // R2: a won middle job deals `clue` (its learn) and `brought` (its gain), never with the finale's `answer` /
  // `option` / `edge`; `known` (what earlier wins found) comes with `have` (one win banks both), middle or
  // finale; at the finale `have` always carries its `edge`, and `edge` is the finale's alone;
  // a failed job has no `decides`, `result`, `clue` or `brought`
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'known', 'have', 'edge', 'answer', 'direction'])
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost')))
    .filter(s => !(s.some(f => ['clue', 'brought'].includes(f)) && s.some(f => ['answer', 'option', 'edge'].includes(f))))
    .filter(s => !s.includes('known') || s.includes('have'))
    .filter(s => s.includes('answer') ? !s.includes('have') || s.includes('edge') : !s.includes('edge')).flatMap(s =>
    [['moved'], ...(s.some(f => ['decides', 'result', 'clue', 'brought'].includes(f)) ? [] : [['failure', 'stopped']])].map(end => ({ flags: ['saga', ...s, ...end], vars: { B: 60, A: 140 } }))),
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
    // R2: the plan writes gain and learn per job and an edge per gain; the finale card names whose fate it
    // decides and never carries the ways; a re-posed job says so; learned clues and holdings reach later texts
    const plan = render('plan', ['types']);
    for (const k of ['"gain"', '"learn"', '"edge"']) expect(plan).toContain(k);
    const fin = render('card', ['finale'], { MAX: 90 });
    expect(fin).toContain('fate:');
    expect(fin).not.toMatch(/option|ways/);
    expect(render('card', ['later', 'retry'], { MAX: 70 })).toContain('retry:');
    expect(render('card', ['later'], { MAX: 70 })).not.toMatch(/retry|mystery|have:/);
    expect(render('card', ['later', 'mystery', 'have'], { MAX: 70 })).toMatch(/mystery:[\s\S]*have:/);
    expect(render('card', ['later', 'have'], { MAX: 70 })).not.toContain('helps');
    expect(render('card', ['finale', 'have', 'edge'], { MAX: 90 })).toContain('helps');
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:[\s\S]*brought:|brought:[\s\S]*clue:/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/clue|known|brought|have:/);
    // R2 verify: what is known and held has a stated role (never new; the held thing used in after at the finale,
    // else only where it helps the job: "only if the card does" was always true, as every card carries have); the
    // truth ties to what is known only when something is
    expect(render('report', ['saga', 'moved', 'known', 'have'], { B: 60, A: 140 })).toMatch(/known:.*never shown as new[\s\S]*have:.*only where it helps this job/);
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).toContain('show each used in after');
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toMatch(/known|learn/);
    expect(render('report', ['saga', 'moved', 'answer', 'known', 'have', 'edge'], { B: 60, A: 140 })).toMatch(/truth:.*built from known/);
    // R2 verify 2: the secret stays out of after (its own rule on after, not a clause on truth); the report speaks
    // in the third person (the card above it says "you"); the card never guesses the answer
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).toMatch(/- after:.*Save the secret for truth/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).toContain('third person');
    expect(render('card', ['later', 'mystery'], { MAX: 70 })).toContain('never guess the answer');
    expect(render('card', ['finale'], { MAX: 90 })).toContain('lose: who loses what');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('past');
  });
});
