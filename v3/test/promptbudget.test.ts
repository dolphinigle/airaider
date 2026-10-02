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
  // re-posed). R3: held things reach cards by name only (no `edge` on a card); `latest` on every later card but a
  // retry (which has `retry` instead) and a finale after a win; a personal saga's card 1 alone says so. R3 verify 2:
  // `intro` / `part` only when some entry in names carries one
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', ...(pos === 'first' ? ['loses', 'personal'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['mystery', 'have', 'latest'] : []), ...(pos === 'later' ? ['retry'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && (!s.includes('lastchance') || s.includes('lose')))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  // hurtprice: a partial whose price is the wound, so it comes with hurt and never with cost;
  // personal: the soldier whose past the story is went, and the summary may name them.
  // R2: a won middle job deals `clue` (its learn) and `brought` (its gain), never with the finale's `answer` /
  // `option` / `edge`; `known` (what earlier wins found) comes with `have` (one win banks both), middle or
  // finale; at the finale `have` always carries its `edge`, and `edge` is the finale's alone;
  // a failed job has no `decides`, `result`, `clue` or `brought`. R3 verify 2: `intro` / `part` only with `people`
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part'])
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part'))
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
    expect(render('card', ['first', 'loses'], { MAX: 70 })).toContain('loses:');
    expect(render('card', ['first'], { MAX: 70 })).not.toContain('lose');
    expect(render('report', ['saga', 'moved', 'personal'], { B: 60, A: 140 })).toContain('whose past this story is');
    // R2: the plan writes gain and learn per job and an edge per gain; the finale card names whose fate it
    // decides and never carries the ways; a re-posed job says so; learned clues and holdings reach later texts
    const plan = render('plan', ['types']);
    for (const k of ['"gain"', '"learn"', '"edge"']) expect(plan).toContain(k);
    const fin = render('card', ['finale'], { MAX: 90 });
    // R3: no `fate` field either (spoken as a stock "X's fate rests here"): the buttons say whose end it is
    expect(fin).not.toMatch(/fate|option|ways/);
    expect(render('card', ['later', 'retry'], { MAX: 70 })).toContain('retry:');
    expect(render('card', ['later'], { MAX: 70 })).not.toMatch(/retry|mystery|have:|latest/);
    expect(render('card', ['later', 'latest'], { MAX: 70 })).toMatch(/latest: what happened last[\s\S]*in this order: latest, job/);
    expect(render('card', ['later', 'mystery', 'have'], { MAX: 70 })).toMatch(/mystery:[\s\S]*have:/);
    expect(render('card', ['later', 'have'], { MAX: 70 })).not.toContain('helps:');
    // R3 (W4): a held thing reaches the card by name, in one clause at most and only where useful; its `helps` is
    // the finale report's alone
    expect(render('card', ['finale', 'have'], { MAX: 90 })).toMatch(/have: things won earlier; one clause at most, only where useful/);
    expect(render('card', ['finale', 'have'], { MAX: 90 })).not.toContain('helps:');
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:[\s\S]*brought:|brought:[\s\S]*clue:/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/clue|known|brought|have:/);
    // R2 verify: what is known and held has a stated role (never new; the held thing used in after at the finale,
    // else only where it helps the job: "only if the card does" was always true, as every card carries have); the
    // truth ties to what is known only when something is
    expect(render('report', ['saga', 'moved', 'known', 'have'], { B: 60, A: 140 })).toMatch(/known:.*never shown as new[\s\S]*have:.*only where it helps this job/);
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).toContain('show each used in after');
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toMatch(/known|learn/);
    expect(render('report', ['saga', 'moved', 'answer', 'known', 'have', 'edge'], { B: 60, A: 140 })).toMatch(/- after:.*built from known/);
    // R3 (W5): the secret comes out inside after, in time order; truth is one plain sentence for the chronicle. The
    // report speaks in the third person (the card above it says "you"); the card never guesses past what is known
    const fr = render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 });
    expect(fr).toMatch(/- after:.*The secret comes out within it, in time order/);
    expect(fr).toMatch(/- truth: the secret in one plain sentence/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).toContain('third person');
    expect(render('card', ['later', 'mystery'], { MAX: 70 })).toContain('never guess past them');
    // R3 (W3): glosses say what to cover; no state words a card or report would print ("not met yet", "you try this
    // same job again", "whose fate this job decides", "what you hold"), and no "any name" on an entry with none
    for (const t of [render('card', ['later', 'retry', 'have', 'mystery'], { MAX: 70 }), render('card', ['finale', 'have', 'latest'], { MAX: 90 }), render('report', ['saga', 'moved', 'people', 'have'], { B: 60, A: 140 })])
      expect(t).not.toMatch(/not met|try this same job again|fate this job|what you hold|any name/);
    // R3 (W1, W2, W6): why is the link to the want; a learn is a plain fact that never names what the question asks
    // for (a who-question's who, a what-question's what) and leaves the showdown the last piece; the showdown still
    // fits once the answer recasts the person in ending
    expect(plan).toMatch(/why: what the job's thing or person is and what having it lets/);
    expect(plan).toMatch(/learn: a plain fact the win brings out, clear on its own, that narrows the answer, never naming what the question asks for/);
    expect(plan).toMatch(/fit every way in ending, even after failed jobs or an answer that changes how the person in ending looks/);
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:.*nothing past it/);
    // R3 (W4): the finale's loss only when it adds to the want, and always at a last chance (which it announces)
    expect(render('card', ['finale', 'lose'], { MAX: 90 })).toContain('lose: who loses what');
    expect(render('card', ['finale', 'lose', 'lastchance'], { MAX: 90 })).toContain('if this last chance fails');
    expect(render('card', ['finale'], { MAX: 90 })).not.toContain('lose');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('past');
    // R3 verify: `helping` frames the story only where the player needs it (card 1's premise, the finale); a middle
    // card's why names whom it helps. The order line names data keys, never a sentence a card could print ("the
    // question, and what you know"); no gloss in the card's voice ("their loss if nobody acts")
    expect(render('card', ['later', 'latest', 'mystery'], { MAX: 70 })).not.toContain('helping');
    expect(render('card', ['finale', 'mystery'], { MAX: 90 })).toMatch(/helping:[\s\S]*in this order: helping, mystery, job, why, trouble\./);
    expect(render('card', ['later', 'retry', 'mystery', 'have'], { MAX: 70 })).toMatch(/in this order: retry, mystery, job, why, have, trouble\./);
    for (const t of [render('card', ['first', 'loses'], { MAX: 70 }), render('card', ['later', 'latest', 'mystery'], { MAX: 70 }), render('card', ['finale', 'mystery', 'lose'], { MAX: 90 })])
      expect(t).not.toMatch(/nobody acts|what you know|who wants what/);
    // the summary says what was done and its result, never the clue (it travels as clue, known and learned); the
    // report's people are those present; the deciding soldier and the plan in deeds, never choice words
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/- summary:.*the result, not the clue/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/what is different|clue/);
    expect(render('report', ['saga', 'moved', 'people'], { B: 60, A: 140 })).toContain('people: who else is there');
    const fo = render('report', ['saga', 'moved', 'decides', 'option', 'answer'], { B: 60, A: 140 });
    expect(fo).toMatch(/decides: whose deed wins it[\s\S]*plan: what the soldiers do, shown in after/);
    expect(fo).not.toMatch(/settles it|chosen|choice/);
    // a plan's labels carry neither a name nor the focal's traits (what they are like is not what a stranger sees)
    expect(plan).toMatch(/a label: two or three plain words a stranger sees, ending in their trade, no name or traits/);
    // R3 verify 2: every dealt key has a stated use (traits: what the person is like; the label never carries them)
    expect(plan).toContain('traits: what they are like');
    // the card's "you" is the company (the data says "the company"); each fact once (a retry that holds the job, a
    // want restated by why and lose); names are who the card may mention, not who is there; a gloss for intro and
    // part only when an entry carries one; the question already put to the player stays open, never re-posed whole
    const c = render('card', ['later', 'retry', 'mystery', 'have'], { MAX: 70 });
    expect(c).toContain('Speak to the company as "you"');
    expect(c).toMatch(/Say each fact once, in your own words, in this order: retry,/);
    expect(c).toContain('retry: what stopped the last try at this same job');
    expect(c).toContain('mystery: the question still open');
    expect(c).toContain('names: people the card may mention: name, else label.');
    expect(c).not.toMatch(/people here|any part|intro:|part:/);
    expect(render('card', ['first', 'personal'], { MAX: 70 })).not.toContain('nobody hires');   // printed as "Nobody hires you this time."
    expect(render('card', ['later', 'latest', 'intro', 'part'], { MAX: 70 })).toMatch(/intro: new to the player[\s\S]*part: their side, shown, not stated/);
    // the report: no rule the data itself breaks (people named in result, clue or known are not in people); a part
    // shown, never pasted as a description; result in the writer's own words (it is dealt in the present); the plan
    // carried out in after
    const r = render('report', ['saga', 'moved', 'people', 'decides', 'result', 'option', 'answer'], { B: 60, A: 140 });
    expect(r).toContain('Invent no names.');
    expect(r).not.toMatch(/Name only|exactly|intro:|part:/);
    expect(r).toMatch(/result: what came of it[\s\S]*- after:.*The deciding moment, then what result says came of it, in your own words/);
    expect(render('report', ['saga', 'moved', 'people', 'intro', 'part'], { B: 60, A: 140 })).toMatch(/people: who else is there, by name\. intro: new to the player; bring them in by label and name\. part: their side, shown, not stated\./);
  });
});
