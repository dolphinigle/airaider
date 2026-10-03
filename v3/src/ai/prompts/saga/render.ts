// The saga storyteller's prompt templates as the GAME ships them (docs/STORYTELLER.md §2.8): one .txt per call beside
// this file, copied verbatim from the saga lab at tag `storyteller-build-src` (R5: plan · outline · card · report). The
// lab keeps its own copies in src/ai/prompts/*.txt, which it goes on editing; these are the measured ones.
//   [[x]] at the start of a line   the line is kept only when x is on
//   [[x]]…[[/x]] inside a line     the span is kept only when x is on
//   [[!x]]                         the same, when x is off
//   {{VAR}}                        replaced by vars.VAR
// A rule about absent data never reaches the model: the caller turns a flag on only when the payload carries the field
// it explains.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/** pick, premise: a kit seed arm's small steps before the plan (North Star 7–8; engine/seedkit.ts) */
export type SagaTemplate = 'plan' | 'card' | 'report' | 'outline' | 'pick' | 'premise';
/** §2.8.7: a rule cannot land without cutting another — every variant, all its lines on, skeleton included (R5's budgets;
 *  the seed lab's two small calls at most 80) */
export const SAGA_WORD_BUDGET: Record<SagaTemplate, number> = { plan: 620, card: 160, report: 310, outline: 115, pick: 80, premise: 80 };

const DIR = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map<SagaTemplate, string>();
export function sagaTemplate(name: SagaTemplate): string {
  let t = cache.get(name);
  if (t === undefined) { t = fs.readFileSync(path.join(DIR, `${name}.txt`), 'utf8'); cache.set(name, t) }
  return t;
}

/** R5's renderer, verbatim */
export function renderTemplate(tpl: string, on: Iterable<string>, vars: Record<string, string | number> = {}): string {
  const set = new Set(on);
  const has = (k: string) => k.startsWith('!') ? !set.has(k.slice(1)) : set.has(k);
  const out: string[] = [];
  for (const line of tpl.split('\n')) {
    let l = line;
    for (let prev = ''; prev !== l;) { prev = l; l = l.replace(/\[\[(!?[a-z]+)\]\](.*?)\[\[\/\1\]\]/, (_m, k: string, body: string) => has(k) ? body : '') }
    const m = l.match(/^\[\[(!?[a-z]+)\]\]/);
    if (m) { if (!has(m[1]!)) continue; l = l.slice(m[0].length) }
    if (line.trim() && !l.trim()) continue;   // a line made only of spans that are off
    for (const [k, v] of Object.entries(vars)) l = l.replaceAll(`{{${k}}}`, String(v));
    out.push(l.trimEnd());   // a line whose last span is off keeps no dangling space
  }
  const s = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const left = s.match(/\[\[[^\]]*\]\]|\{\{[^}]*\}\}/);
  if (left) throw new Error(`template left a tag unrendered: ${left[0]}`);
  return s;
}

export const renderSaga = (name: SagaTemplate, on: Iterable<string>, vars?: Record<string, string | number>) => renderTemplate(sagaTemplate(name), on, vars);
export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
