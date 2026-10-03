// The storyteller's prompt templates (docs/STORYTELLER.md §2.8): one .txt per call beside this file.
//   [[x]] at the start of a line   the line is kept only when x is on
//   [[x]]…[[/x]] inside a line     the span is kept only when x is on
//   [[!x]]                         the same, when x is off
//   [[x|y]]                        kept when any of x, y is on ([[!x|y]]: when none is)
//   {{VAR}}                        replaced by vars.VAR
// A rule about absent data never reaches the model: the caller turns a flag on only when the
// payload carries the field it explains.
//
// Phase 1: the saga lab's probe renders these; nothing in the game does yet (Phase 2b).

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/** (R6, F1) no `outline`: R4's road-ahead call (R5: each later job's hope, written blind to the story) is gone; every job's
 *  hope is the plan's own why, which the engine prints or keeps off the screen */
export type TemplateName = 'plan' | 'card' | 'report';
/** §2.8.7: a rule cannot land without cutting another — every variant, all its lines on, skeleton included */
// plan 660 → 620 at R1 (2026-10-02): card 1 left the plan call, so its pitch section went with it
// card 215 → 180 at R4 (2026-10-03): the quest log took helping, mystery and have off the card
// card 180 → 170, outline 140 → 130 at R4 verify: `fate` and card 1's "who needs you" left the card; the outline writes
// only the "so" clause and no end line
// card 170 → 160, outline 130 → 115 at R5: card 1 deals no loss and no trouble `will`, the card no `premise` flag set;
// the outline only shortens each why, and the want is no longer dealt
// R6: the outline call dropped; budgets unchanged (the plan's options went to the engine, card 1's `will` came back by a cut)
// R6 verify: budgets unchanged (plan 600, card 157, report 310: the hope line's "within reach, not done" fills report's last 3)
// R6 verify 2: budgets unchanged (plan 620: the why-question dropped "never who …" for the people rule; report 310: `away` and
// the finale secret's speaker paid for by cuts in clue, have and the time-order line)
// R7 (readability): budgets unchanged (plan 617: one naming rule for people and places paid by "by label if in cast", the
// intro and "plain"; card 156: `problem` for `unknown`, `stakes` for the last-chance `lose`; report 310: the clue and cost
// printed below the report, the reveal back to R5's with its reason said plainly, known never new at the finale too)
// R7 verify: budgets unchanged (plan 620: no traits, "by job {{MID}}", the why's form and owner, memory told and where a job's
// place; report 310: one line for all printed below it (🩸, Took, Learned, Cost) with cost and brought shown as moments, "but
// the price", the hope said plainly, a won finale's plan carried out, paid by "No hint of the outcome"; card 156: a personal
// finale's stakes settle the soldier's old wrong, in a span the worst variant never carries)
// R7 verify 2: budgets unchanged (plan 620: the label "race then trade", the race in the cast override, "people by trade", the
// question among what is shown before play and "is listed by job {{MID}}, the person in ending at job 1", paid by "places may
// repeat"; card: no stakes, the engine's log line says them; report 310: the clue "show the find or words that tell it")
export const WORD_BUDGET: Record<TemplateName, number> = { plan: 620, card: 160, report: 310 };

const DIR = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map<TemplateName, string>();
export function template(name: TemplateName): string {
  let t = cache.get(name);
  if (t === undefined) { t = fs.readFileSync(path.join(DIR, `${name}.txt`), 'utf8'); cache.set(name, t) }
  return t;
}

export function renderTemplate(tpl: string, on: Iterable<string>, vars: Record<string, string | number> = {}): string {
  const set = new Set(on);
  const any = (k: string) => k.split('|').some(x => set.has(x));
  const has = (k: string) => k.startsWith('!') ? !any(k.slice(1)) : any(k);
  const out: string[] = [];
  for (const line of tpl.split('\n')) {
    let l = line;
    for (let prev = ''; prev !== l;) { prev = l; l = l.replace(/\[\[(!?[a-z|]+)\]\](.*?)\[\[\/\1\]\]/, (_m, k: string, body: string) => has(k) ? body : '') }
    const m = l.match(/^\[\[(!?[a-z|]+)\]\]/);
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

export const render = (name: TemplateName, on: Iterable<string>, vars?: Record<string, string | number>) => renderTemplate(template(name), on, vars);
export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
