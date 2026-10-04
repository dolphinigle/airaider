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
  // the lab's pipe arms (engine/saga.ts PipeArm) ride on kit+pick: core · grafts · sides
  plan: [[], ['keywords', 'support'], ['premise', 'support'], ...['core', 'grafts', 'sides'].map(pipe => ['keywords', 'support', pipe])].flatMap(seed => [['notrade'], []].flatMap(cast => subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: ['types', ...cast, ...extra, ...seed], vars: {} })))),
  // (pipe arm sides: a plan with sides deals no parts, so `side` never meets `part`)
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', 'side', ...(pos === 'first' ? ['personal', 'returning'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['latest', 'retry', 'will'] : []), ...(pos !== 'finale' ? ['why'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && !(pos === 'finale' && s.includes('retry')) && s.includes('lastchance') === s.includes('lose') && !(s.includes('personal') && s.includes('returning')))
    .filter(s => !(s.includes('will') && (s.includes('retry') || s.includes('lose'))) && !(s.includes('side') && s.includes('part')))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  outline: [{ flags: [], vars: {} }],
  // count: the pick is told how many keywords the plan gets (kit+pick+cast with its people; pipe arm one without)
  pick: [[], ['situations'], ['personal'], ['people', 'count'], ['people', 'count', 'personal'], ['count'], ['count', 'personal']].map(flags => ({ flags, vars: (flags.includes('count') ? { KEEP: 'two keywords' } : {}) as Record<string, string> })),
  premise: [[], ['personal']].map(flags => ({ flags, vars: {} })),
  core: [[], ['personal']].map(flags => ({ flags, vars: {} })),
  // hope: pipe arm grafts, a won middle job's (with clue/brought, never the finale's answer/option/edge); side: pipe arm sides
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'hope', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part', 'side'])
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part' || f === 'side'))
    .filter(s => !(s.includes('side') && s.includes('part')) && !(s.includes('side') && s.includes('hope')))
    .filter(s => !s.includes('hope') || (s.some(f => ['clue', 'brought'].includes(f)) && s.includes('decides')))
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost')))
    .filter(s => !(s.some(f => ['clue', 'brought', 'hope'].includes(f)) && s.some(f => ['answer', 'option', 'edge'].includes(f))))
    .filter(s => !s.includes('known') || s.includes('have'))
    .filter(s => s.includes('answer') ? !s.includes('have') || s.includes('edge') : !s.includes('edge')).flatMap(s =>
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
  it('the templates are the measured ones, and never the lab\'s working copies', () => {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/ai/prompts/saga');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort()).toEqual(['card.txt', 'core.txt', 'outline.txt', 'pick.txt', 'plan.txt', 'premise.txt', 'report.txt']);
    // (byte identity with the lab at the tag is held by test/sagagolden.test.ts, which renders every recorded variant)
  });
});
