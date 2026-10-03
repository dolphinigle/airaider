// The payload lint (STORYTELLER §2.8.8): a mock campaign — 3 seeds, 2 sagas each — and every value the ENGINE composes
// into a saga call (parts, types, endings, how a soldier is described, wounds, costs, the fate line, labels it writes
// itself). None may carry an instruction word, ALL-CAPS, parentheses, digits or engine jargon, or be empty; and every
// top-level key a payload carries has a line in that call's system prompt explaining it. Whole-word matching; ids and the
// `n` ordinal are exempt; "keep" is off the list (the beast part is "keeps the beast").
import { describe, it, expect } from 'vitest';
import { seedIdCounter } from '../src/engine/cards.js';
import { renderSaga } from '../src/ai/prompts/saga/render.js';
import type { SagaCall } from '../src/ai/provider.js';
import { newGame, sagaChain, playSaga } from './sagaharness.js';

const INSTRUCTION = /\b(never|must|do not|don't|should|write|say|pose)\b/i;
const CAPS = /\b[A-Z]{2,}\b/;
const JARGON = /\b(beat|arc|step|slot|focal|quarry|client|obstacle|bible|chain)\b/i;
const problems = (v: string): string[] => [
  ...(INSTRUCTION.test(v) ? ['an instruction word'] : []), ...(CAPS.test(v) ? ['ALL-CAPS'] : []), ...(/[()]/.test(v) ? ['parentheses'] : []),
  ...(/\d/.test(v) ? ['a digit'] : []), ...(JARGON.test(v) ? ['jargon'] : []), ...(!v.trim() ? ['empty'] : []),
];
type Rec = Record<string, unknown>;
/** the engine-composed values of one call, by where they sit */
function engineValues(c: SagaCall): [string, string][] {
  const p = c.payload, out: [string, string][] = [];
  const add = (where: string, v: unknown) => { if (typeof v === 'string') out.push([where, v]) };
  if (c.template === 'plan') {
    add('jobs', p.jobs);
    for (const t of p.types as Rec[]) { add('types.do', t.do); add('types.kind', t.kind) }
    for (const x of p.cast as Rec[]) for (const k of ['sex', 'race', 'part', 'trade', 'traits'] as const) if (x[k] !== undefined) add(`cast.${k}`, x[k]);
    const e = p.ending as Rec;
    add('ending.likely', e.likely);
    for (const w of e.ways as (string | Rec)[]) { if (typeof w === 'string') add('ending.ways', w); else { add('ending.way', w.way); add('ending.means', w.means) } }
    add('tone', p.tone); add('land', p.land);
  }
  const people = [...((p.names ?? []) as Rec[]), ...((p.people ?? []) as Rec[])];
  for (const x of people) { add('sex', x.sex); if (x.part !== undefined) add('part', x.part); if (/soldiers$/.test(String(x.label ?? ''))) add('label', x.label) }
  if (c.template === 'report') {
    for (const s of p.soldiers as Rec[]) add('soldiers.is', s.is);
    if (p.outcome !== undefined) add('outcome', p.outcome);
    for (const h of (p.hurt ?? []) as Rec[]) add('hurt.how', h.how);
    if (p.cost) for (const k of ['what', 'how', 'whose'] as const) if ((p.cost as Rec)[k] !== undefined) add(`cost.${k}`, (p.cost as Rec)[k]);
    if (c.flags.includes('answer') && p.result !== undefined) add('result', p.result);
  }
  return out;
}

describe('payload lint — a mock campaign, 3 seeds × 2 sagas', () => {
  for (const seed of [3, 8, 13]) it(`seed ${seed}`, async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(seed);
    for (const [i, personal] of [false, true].entries()) {
      const { chain, focal } = sagaChain(g, { N: 3 + i + (seed % 2), personal });
      await playSaga(g, chain, personal ? 'personal' : seed === 8 ? 'lastchance' : 'bumpy', focal);
    }
    expect(ai.calls.length).toBeGreaterThan(10);
    const bad: string[] = [];
    let checked = 0;
    for (const c of ai.calls) {
      for (const [where, v] of engineValues(c)) { checked++; for (const why of problems(v)) bad.push(`${c.template} ${where}: ${why} in "${v}"`) }
      // every key the payload carries is explained by a line of the prompt it rides with
      const system = renderSaga(c.template, c.flags, c.vars);
      for (const key of Object.keys(c.payload)) if (!new RegExp(`\\b${key}\\b`).test(system)) bad.push(`${c.template}: key "${key}" has no line in the prompt`);
    }
    expect(bad).toEqual([]);
    expect(checked).toBeGreaterThan(100);
  });
});
