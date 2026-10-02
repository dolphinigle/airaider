// The storyteller's prompt templates (docs/STORYTELLER.md §2.8): one .txt per call beside this file.
//   [[x]] at the start of a line   the line is kept only when x is on
//   [[x]]…[[/x]] inside a line     the span is kept only when x is on
//   [[!x]]                         the same, when x is off
//   {{VAR}}                        replaced by vars.VAR
// A rule about absent data never reaches the model: the caller turns a flag on only when the
// payload carries the field it explains.
//
// Phase 1: the saga lab's probe renders these; nothing in the game does yet (Phase 2b).

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TemplateName = 'plan' | 'card' | 'report';
/** §2.8.7: a rule cannot land without cutting another — every variant, all its lines on, skeleton included */
export const WORD_BUDGET: Record<TemplateName, number> = { plan: 660, card: 215, report: 310 };

const DIR = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map<TemplateName, string>();
export function template(name: TemplateName): string {
  let t = cache.get(name);
  if (t === undefined) { t = fs.readFileSync(path.join(DIR, `${name}.txt`), 'utf8'); cache.set(name, t) }
  return t;
}

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
    out.push(l);
  }
  const s = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const left = s.match(/\[\[[^\]]*\]\]|\{\{[^}]*\}\}/);
  if (left) throw new Error(`template left a tag unrendered: ${left[0]}`);
  return s;
}

export const render = (name: TemplateName, on: Iterable<string>, vars?: Record<string, string | number>) => renderTemplate(template(name), on, vars);
export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
