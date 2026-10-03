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

const variants: Record<SagaTemplate, { flags: string[]; vars: Record<string, number> }[]> = {
  plan: [['notrade'], []].flatMap(cast => subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: ['types', ...cast, ...extra], vars: {} }))),
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', ...(pos === 'first' ? ['personal', 'returning'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['latest', 'retry', 'will'] : []), ...(pos !== 'finale' ? ['why'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && !(pos === 'finale' && s.includes('retry')) && s.includes('lastchance') === s.includes('lose') && !(s.includes('personal') && s.includes('returning')))
    .filter(s => !(s.includes('will') && (s.includes('retry') || s.includes('lose'))))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  outline: [{ flags: [], vars: {} }],
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part'])
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part'))
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost')))
    .filter(s => !(s.some(f => ['clue', 'brought'].includes(f)) && s.some(f => ['answer', 'option', 'edge'].includes(f))))
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
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort()).toEqual(['card.txt', 'outline.txt', 'plan.txt', 'report.txt']);
    // (byte identity with the lab at the tag is held by test/sagagolden.test.ts, which renders every recorded variant)
  });
});
