// The saga storyteller's templates as the game ships them (src/ai/prompts/saga/, R5 — STORYTELLER §2.8.7): every variant
// the built arm can send renders cleanly and stays within its word budget, skeleton included. A rule cannot land without
// cutting another. (Ported from the lab's promptbudget test at tag storyteller-build-src, narrowed to the built arm:
// structure L deals job types, never a shape or episodes; the lean cast deals no stake and may leave the asker tradeless.)
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSaga, wordCount, SAGA_WORD_BUDGET, type SagaTemplate } from '../src/ai/prompts/saga/render.js';

const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => acc.concat(acc.map(a => [...a, x])), [[]]);

const variants: Record<SagaTemplate, { flags: string[]; vars: Record<string, string | number> }[]> = {
  // the seed arms (North Star 7; engine/seedkit.ts): none (themes), a kit's keywords, a premise; with a kit cast, `support`
  // the lab's pipe arms (engine/saga.ts PipeArm) ride on kit+pick: grafts (C2, and D1, D2, E1–E3, F1–F3 on it) · sides; fixes
  // (D2), trail (E2), line (F1) and link (F3) on grafts, line and link together (FX)
  // round T (TA–TD, TP, PP) on grafts, one change each: voice, lore, page, past (past only reaches a personal plan); and the
  // standalone clean arm (the verifier's shared fixes, in no round-T arm)
  plan: [[], ['keywords', 'support'], ['premise', 'support'], ...['grafts', 'sides'].map(pipe => ['keywords', 'support', pipe]), ...['fixes', 'trail', 'line', 'link'].map(pipe => ['keywords', 'support', 'grafts', pipe]), ['keywords', 'support', 'grafts', 'line', 'link'],
    ...[['clean'], ['voice'], ['lore'], ['page'], ['past']].map(arm => ['keywords', 'support', 'grafts', ...arm])].flatMap(seed => [['notrade'], []].flatMap(cast => subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: ['types', ...cast, ...extra, ...seed], vars: {} })))),
  // (pipe arm sides: a plan with sides deals no parts, so `side` never meets `part`; pipe arm fixes, D2, on any card: `lose`
  // on every finale, beside `will` but at a last chance)
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', 'side', ...(pos === 'first' ? ['personal', 'returning'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['latest', 'retry', 'will'] : []), ...(pos !== 'finale' ? ['why'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && !(pos === 'finale' && s.includes('retry')) && (!s.includes('lastchance') || s.includes('lose')) && !(s.includes('personal') && s.includes('returning')))
    .filter(s => !(s.includes('will') && (s.includes('retry') || s.includes('lastchance'))) && !(s.includes('side') && s.includes('part')))
    // pipe arm line (F1): the trouble is one sentence — never beside fixes' phrase or a `will` part
    .flatMap(extra => [extra, [...extra, 'fixes'], ...(extra.includes('will') ? [] : [[...extra, 'line']])])
    // round T, on grafts alone (never with fixes or line): card 1's quoted line (voice: of the want, or a personal past), its
    // lore, a personal past in two sentences; a later card's first meeting (weight; never a retry)
    // (round T rides on kit+pick: a hired kit card names nobody by part, and a returning face is never on a personal saga, so
    // `part` and `returning` never meet there)
    // (clean: the standalone arm of the verifier's shared fixes, in no round-T arm)
    .flatMap(extra => extra.includes('fixes') || extra.includes('line') || extra.includes('side') || (extra.includes('part') && extra.includes('returning')) ? [extra] : pos === 'first'
      ? [extra, [...extra, 'clean'], [...extra, 'says'], [...extra, 'lore'], ...(extra.includes('personal') ? [[...extra, 'past']] : [])]
      : pos === 'later' && !extra.includes('retry') ? [extra, [...extra, 'clean'], [...extra, 'meet']] : [extra, [...extra, 'clean']])
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  outline: [{ flags: [], vars: {} }],
  // pipe arm late (E1): the finale written after play
  showdown: [{ flags: [], vars: {} }],
  // count: the pick is told how many keywords the plan gets (kit+pick+cast with its people; pipe arm one without)
  pick: [[], ['situations'], ['personal'], ['people', 'count'], ['people', 'count', 'personal'], ['count'], ['count', 'personal']].map(flags => ({ flags, vars: (flags.includes('count') ? { KEEP: 'two keywords' } : {}) as Record<string, string> })),
  premise: [[], ['personal']].map(flags => ({ flags, vars: {} })),
  // hope: pipe arm grafts, a won middle job's (with clue/brought, never the finale's answer/option/edge); narrow (E3, D2) only
  // with it; side: pipe arm sides; fixes: pipe arm fixes (D2, on grafts: never with sides), on every report
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'hope', 'narrow', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part', 'side'])
    .filter(s => !s.includes('narrow') || s.includes('hope'))
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part' || f === 'side'))
    .filter(s => !(s.includes('side') && s.includes('part')) && !(s.includes('side') && s.includes('hope')))
    .filter(s => !s.includes('hope') || (s.some(f => ['clue', 'brought'].includes(f)) && s.includes('decides')))
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost')))
    .filter(s => !(s.some(f => ['clue', 'brought', 'hope'].includes(f)) && s.some(f => ['answer', 'option', 'edge'].includes(f))))
    .filter(s => !s.includes('known') || s.includes('have'))
    .filter(s => s.includes('answer') ? !s.includes('have') || s.includes('edge') : !s.includes('edge'))
    .flatMap(s => s.includes('side') ? [s] : [s, [...s, 'fixes']])
    // round T, on grafts alone (never with fixes or side): weight's `meet`; voice's witness (a won clue) and teller (the finale);
    // lore's payoff and past's change (the finale), each alone
    // the standalone clean arm (labels everywhere, `away` for the named but absent; the hope never restated, the cost in the
    // deciding moment, known facts laid out or said, no wound or price in the summary) — never with narrow
    .flatMap(s => s.includes('fixes') || s.includes('side') || s.includes('narrow') ? [s] : [s, ...[['clean'], ...(s.includes('people') ? [['clean', 'away']] : []), ...(s.includes('intro') ? [['meet']] : []), ...(s.includes('clue') ? [['witness']] : []),
      ...(s.includes('answer') ? [['teller'], ['lore'], ['change']] : [])].map(arm => [...s, ...arm])]).flatMap(s =>
    [['moved'], ...(s.some(f => ['decides', 'result', 'clue', 'brought'].includes(f)) ? [] : [['failure', 'stopped']])].map(end => ({ flags: ['saga', ...s, ...end], vars: { B: 60, A: 140 } }))),
};

describe('saga prompt budget (the shipped R5 templates)', () => {
  for (const [name, vs] of Object.entries(variants) as [SagaTemplate, typeof variants.plan][]) {
    it(`${name}: every variant renders and stays ≤ ${SAGA_WORD_BUDGET[name]} words`, () => {
      let max = 0, worst = '';
      for (const v of vs) {
        const n = wordCount(renderSaga(name, v.flags, v.vars));   // throws on an unrendered tag
        if (n > max) { max = n; worst = v.flags.join(',') }
      }
      expect(max, `${name} worst variant: ${worst}`).toBeLessThanOrEqual(SAGA_WORD_BUDGET[name]);
    });
  }
  it('a seed arm\'s lines reach the plan only with their data', () => {
    const plain = renderSaga('plan', ['types', 'notrade']);
    expect(plain).not.toMatch(/keywords|starts|the others/);
    expect(renderSaga('plan', ['types', 'notrade', 'keywords', 'support'])).toContain('- keywords: use each where it matters.');
    expect(renderSaga('plan', ['types', 'notrade', 'keywords', 'support'])).toContain('Use the asker and the person in ending, others only as needed');
    expect(renderSaga('plan', ['types', 'personal', 'keywords', 'support'])).toContain('Use those with a part, others only as needed');
    expect(renderSaga('plan', ['types', 'notrade', 'premise', 'support'])).toContain('- seed: how the story starts');
    expect(renderSaga('plan', ['types', 'notrade', 'premise', 'support'])).not.toContain('the idea under the story');
    expect(renderSaga('pick', [])).not.toMatch(/situations|past/);
    expect(renderSaga('pick', ['situations'])).toContain('"situation": "one of situations"');
    expect(renderSaga('pick', ['personal'])).toContain('- past:');
    expect(renderSaga('pick', [])).not.toMatch(/keywords, people|best fitting|"person"/);
    expect(renderSaga('pick', ['people', 'count'], { KEEP: 'two keywords' })).toContain('"person": "one of people, or none"');
    expect(renderSaga('pick', ['people', 'count'], { KEEP: 'two keywords' })).toContain('Choose the two keywords best fitting the situation, tone and cast, together in one clear story, and from people');
    expect(renderSaga('pick', ['count'], { KEEP: 'one keyword' })).toContain('Choose the one keyword best fitting the situation, tone and cast, together in one clear story. Copy each exactly.');
    expect(renderSaga('pick', ['count'], { KEEP: 'one keyword' })).not.toMatch(/keywords, people|person|one to three/);
  });
  it('a rule about absent data never reaches the model', () => {
    expect(renderSaga('card', ['later', 'memory'], { MAX: 70 })).toContain('memory:');
    expect(renderSaga('card', ['later'], { MAX: 70 })).not.toContain('memory');
    expect(renderSaga('card', ['first'], { MAX: 70 })).not.toContain('lose');
    expect(renderSaga('plan', ['types'])).not.toContain('stake:');
    expect(renderSaga('plan', ['types'])).not.toContain('"past"');
    expect(renderSaga('plan', ['types', 'personal'])).toContain('"soldier": {"want"');
    expect(renderSaga('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toContain('truth');
    expect(renderSaga('report', ['saga', 'moved', 'personal'], { B: 60, A: 140 })).toContain('whose past this story is');
  });
  it('pipe arm fixes (D2): its lines reach the model only in its variants', () => {
    const hope = ['saga', 'decides', 'result', 'clue', 'hope', 'moved'], fin = ['saga', 'decides', 'result', 'option', 'answer', 'moved'];
    expect(renderSaga('report', hope, { B: 30, A: 60 })).toContain('- hope: the card\'s hope, limited by result and clue; show shortfalls.');
    expect(renderSaga('report', hope, { B: 30, A: 60 })).toContain('show it found, seen or said, plainly, and nothing past it.');
    const fixedHope = renderSaga('report', [...hope, 'fixes'], { B: 30, A: 60 });
    expect(fixedHope).toContain('- hope: unless result, brought or clue meets it, show it still hoped for.');
    expect(fixedHope).toContain('show it found, seen or said, adding nothing to it.');
    // every fact in the writer's own words: said once, for every field, never per field
    expect(fixedHope).toContain('Past tense, third person, your own plain words, short complete sentences');
    expect(fixedHope.match(/\bown\b/g)).toHaveLength(1);
    expect(fixedHope).not.toMatch(/shortfalls|plainly|nothing past it/);
    expect(renderSaga('report', fin, { B: 60, A: 140 })).toContain('The secret comes out within it, in time order:');
    const fixedFin = renderSaga('report', [...fin, 'known', 'have', 'edge', 'fixes'], { B: 60, A: 140 });
    expect(fixedFin).toContain('nothing else changes. Someone says, shows or finds the secret, pointing to a fact from known. End on');
    expect(fixedFin).toContain('- plan: what the soldiers do, shown in after.');
    expect(fixedFin.match(/\bown\b/g)).toHaveLength(1);
    expect(fixedFin).not.toMatch(/time order|built from/);
    // a finale's stake: "this last chance" only at a last chance (the build's one case, byte for byte)
    expect(renderSaga('card', ['finale', 'latest', 'lastchance', 'lose'], { MAX: 90 })).toContain('lose: who loses what for good if this last chance fails.');
    expect(renderSaga('card', ['finale', 'latest', 'will', 'lose'], { MAX: 90 })).toContain('what they will do. lose: who loses what for good if this fails.');
    // with fixes the trouble is one phrase (no parts to gloss), and the stake's gloss has no "for good" to echo
    expect(renderSaga('card', ['finale', 'latest', 'will', 'lose', 'fixes'], { MAX: 90 })).toContain('- job: the task, and where. trouble: who stands in the way. lose: who loses what if this fails.');
    expect(renderSaga('card', ['later', 'latest', 'why', 'will', 'fixes'], { MAX: 70 })).not.toMatch(/carry|what they will do/);
    // the plan: each edge beats the showdown's trouble, the loss is what that trouble takes, the trouble says `with`
    const plan = renderSaga('plan', ['types', 'keywords', 'support', 'grafts', 'fixes']), plain = renderSaga('plan', ['types', 'keywords', 'support', 'grafts']);
    expect(plan).toContain('edge: for each job\'s gain, in order, how it helps beat the trouble here.');
    expect(plan).toContain('loses for good if the trouble here does what they will.');
    expect(plan.match(/"with": "≤6 words"/g)).toHaveLength(2);
    expect(plan).not.toContain('"carry"');
    expect(plain).toContain('edge: how each job\'s gain, in order, helps here.');
    expect(plain.match(/"carry": "≤6 words"/g)).toHaveLength(2);
  });
  it('the templates are the measured ones, and never the lab\'s working copies', () => {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/ai/prompts/saga');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort()).toEqual(['card.txt', 'outline.txt', 'pick.txt', 'plan.txt', 'premise.txt', 'report.txt', 'showdown.txt']);
    // (byte identity with the lab at the tag is held by test/sagagolden.test.ts, which renders every recorded variant)
  });
});
