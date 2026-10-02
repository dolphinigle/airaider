// SAGA LAB — the mechanical measures (docs/STORYTELLER.md §1.1 M12–M17, §5.0 paste rate, §D.3
// repetition). Code only, no judges:
//
//   npx tsx scripts/sagalab/mech.ts --run NAME        → runs/NAME/mech.json + mech.md
//
// Per saga (score.ts bootstraps over these):
//   M12 code  unmet-name leaks (a cast name first seen on a CARD, not the client or the company's own
//             soldier) · soldier names on cards · answer-word leaks (the hidden twist's own words on a
//             card or report before the finale report)
//   M14       cards opening on a trigram another card also opens on · cards ending on "?"
//   M15       caps held (raw model output vs the prompt's own word caps) · hard failures (a card that
//             could not be written, a report that is the fallback) · soft errors (a call that failed
//             and was retried)
//   M16       cost per saga and per beat (the saga's own calls: genesis, select, writeQuest, resolve)
//   M17       latency: pursue→card as the driver timed it; genesis, card, report call times
//   paste     share of card words inside a 4-word span of the call's own input JSON
// Across the run (§D.3): card-1 trigram overlap between sagas · title-word reuse · job-type sequence
// spread · opening-sentence stamps.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CallLogLine } from '../../src/ai/calllog.js';
import type { TextRec, SagaMeta } from './extract.js';
import type { DriveSummary } from './drive.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');

/** the caps each arm's prompts set — the baseline's are today's (openai.ts): saga card ≤ 80 words;
 *  saga report before/after by gravity 22/45 · 40/90 · 60/140 (a finale takes the grave budget) */
export const CAPS = {
  base: {
    card: () => 80,
    report: (gravity: string | undefined, finale: boolean): [number, number] =>
      finale || gravity?.startsWith('a grave') ? [60, 140] : gravity?.startsWith('a serious') ? [40, 90] : [22, 45],
  },
};
const SAGA_PURPOSES = new Set(['genesis', 'select', 'writeQuest', 'resolve', 'review']);
const STOP = new Set('the a an of to in that and who for with on at by from their its his her they them into over under is are was were be been has have had this these those your you it as or but not no so if then than when what which where while there here out up all one two'.split(' '));

const words = (s: string) => (s.toLowerCase().match(/[a-z][a-z'’-]*/g) ?? []);
const wc = (s: string | undefined) => (s ?? '').split(/\s+/).filter(Boolean).length;
const grams = (w: string[], n: number) => { const out: string[] = []; for (let i = 0; i + n <= w.length; i++) out.push(w.slice(i, i + n).join(' ')); return out };
const jaccard = (a: Set<string>, b: Set<string>) => { let i = 0; a.forEach(x => { if (b.has(x)) i++ }); const u = a.size + b.size - i; return u ? i / u : 0 };
const pct = (x: number | null) => x === null ? '—' : `${(100 * x).toFixed(0)}%`;
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2 };
const quantile = (xs: number[], q: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]! };
const entropy = (counts: number[]) => { const n = counts.reduce((a, b) => a + b, 0); return n ? -counts.reduce((h, c) => c ? h + (c / n) * Math.log2(c / n) : h, 0) : 0 };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** the §2.4.1 job types, read off a card's errand line (first match wins; `paperwork` flags a
 *  document-shaped job — J2 is the authority, this is the cheap proxy) */
const JOB_TYPES: [string, RegExp][] = [
  ['free', /\b(free|rescue|break (?:\w+ )?out|release|spring)\b/i],
  ['escort', /\b(escort|guide|see (?:\w+ ){0,3}(?:safely|through|home)|bring (?:\w+ ){0,4}(?:safely|home|back to)|deliver|carry)\b/i],
  ['guard', /\b(guard|hold|defend|protect|keep watch|stand watch|watch over)\b/i],
  ['hunt', /\b(hunt|slay|trap|kill the (?:beast|creature|thing)|track the (?:beast|creature|thing))\b/i],
  ['catch', /\b(catch|chase|run down|capture|seize|arrest|take (?:\w+ ){0,3}alive|drag)\b/i],
  ['sneak', /\b(sneak|steal|slip|unseen|lift|smuggle|pinch|filch|quietly)\b/i],
  ['fight', /\b(fight|drive (?:off|out|back)|attack|storm|raid|clear|break|beat|ambush|kill|burn)\b/i],
  ['talk', /\b(persuade|convince|win (?:\w+ )?over|talk|negotiate|parley|bargain|plead|speak|meet|ask|question|confront)\b/i],
  ['find', /\b(find|search|locate|track|trace|learn|discover|uncover|investigate|look into|follow|scout|recover|retrieve|get back)\b/i],
];
const PAPERWORK = /\b(document|letter|deed|ledger|charter|seal|writ|record|proof|papers?|contract|will|signature|map|list|testimony|witness)\b/i;
export function jobType(errand: string, finale: boolean): string {
  if (finale) return 'showdown';
  return JOB_TYPES.find(([, rx]) => rx.test(errand))?.[0] ?? 'other';
}

interface Plan { fixture: { id: string; personal: boolean; spark: string }; chain: { bible: { title: string; kernel: string; twist: string | null; cast: { name: string; role: string }[] } } | null; focal: { name: string } | null }

export interface SagaMech {
  id: string; attempts: number; complete: boolean;
  cards: number; reports: number;
  unmetNameLeaks: string[]; soldierNamesOnCards: string[]; answerWordLeaks: string[];
  cardOpeners: string[]; questionEndings: number;
  capsHeld: number; capsChecked: number; capBreaks: string[];
  hardFailures: number; softErrors: number;
  costSaga: number; costAll: number; costPerBeat: number;
  pursueMs: number[]; pursueFirstMs: number[]; pursueLaterMs: number[]; genesisMs: number[]; cardMs: number[]; reportMs: number[];
  pasteBeat1: number | null; pasteAll: number | null;
  card1: string; title: string; jobSeq: string[]; paperworkJobs: number; jobs: number;
  cardWords: number[]; beforeWords: number[]; afterWords: number[];
  /** (R3) probe sagas only: prompt-gloss runs printed in card and report prose, per text (`card_3: this job decides`) */
  glossEchoes?: string[];
}

function readJsonl<T>(p: string): T[] {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as T);
}
const tryJson = (s: string | undefined): Record<string, unknown> | null => { try { return s ? JSON.parse(s) as Record<string, unknown> : null } catch { return null } };

/** the share of `out`'s words that sit inside a 4-word span of `input` (L19: dealt text gets pasted) */
export function pasteRate(out: string, input: string): number | null {
  const ow = words(out);
  if (ow.length < 4) return null;
  const inGrams = new Set(grams(words(input), 4));
  const covered = new Array(ow.length).fill(false);
  for (let i = 0; i + 4 <= ow.length; i++) if (inGrams.has(ow.slice(i, i + 4).join(' '))) for (let j = i; j < i + 4; j++) covered[j] = true;
  return covered.filter(Boolean).length / ow.length;
}

/** (R3, W3) gloss echo, log-only: the prompt's own wording printed as story — a 3-word run of the SYSTEM prompt
 *  (with at least one content word) that the output carries and the payload does not ("this job decides", "you
 *  try this"). A data gloss says what to cover; when its words come back as a sentence, the gloss was read as
 *  text to copy. Returns each echoed run once, merged where runs overlap */
export function glossEchoes(system: string, user: string, output: string): string[] {
  const sys = words(system.replace(/Reply with JSON only:[\s\S]*$/, ''));
  const content = (g: string[]) => g.some(w => w.length >= 3 && !STOP.has(w));
  const sysGrams = new Set<string>();
  for (let i = 0; i + 3 <= sys.length; i++) { const g = sys.slice(i, i + 3); if (content(g)) sysGrams.add(g.join(' ')) }
  const inGrams = new Set(grams(words(user), 3));
  const ow = words(output);
  const hit = ow.map(() => false);
  for (let i = 0; i + 3 <= ow.length; i++) { const g = ow.slice(i, i + 3).join(' '); if (sysGrams.has(g) && !inGrams.has(g)) hit[i] = hit[i + 1] = hit[i + 2] = true }
  const out: string[] = [];
  for (let i = 0; i < ow.length; i++) if (hit[i]) { let j = i; while (j < ow.length && hit[j]) j++; out.push(ow.slice(i, j).join(' ')); i = j }
  return [...new Set(out)];
}

export function sagaMech(runDir: string, id: string): SagaMech {
  const sd = path.join(runDir, 'sagas', id);
  const texts = JSON.parse(fs.readFileSync(path.join(sd, 'texts.json'), 'utf8')) as TextRec[];
  const meta = JSON.parse(fs.readFileSync(path.join(sd, 'meta.json'), 'utf8')) as SagaMeta;
  const plan = fs.existsSync(path.join(sd, 'plan.json')) ? JSON.parse(fs.readFileSync(path.join(sd, 'plan.json'), 'utf8')) as Plan : null;
  const calls = readJsonl<CallLogLine>(path.join(sd, 'calls.jsonl'));
  const drive = JSON.parse(fs.readFileSync(path.join(runDir, 'drive', id, 'drive.json'), 'utf8')) as DriveSummary;
  const savePath = path.join(runDir, 'drive', id, 'save.json');
  const save = fs.existsSync(savePath) ? JSON.parse(fs.readFileSync(savePath, 'utf8')) as { cards: { name: string; character?: { role: string } }[] } : null;
  const cards = texts.filter(t => t.kind === 'card'), reports = texts.filter(t => t.kind === 'report');
  const bible = plan?.chain?.bible;
  const personalName = plan?.fixture.personal ? plan.focal?.name : undefined;

  // M12 (code): a cast name whose first sighting is a CARD — reports are where strangers are met
  const nameRx = (n: string) => new RegExp(`\\b${esc(n.split(/\s+/)[0]!)}\\b`);
  const unmet: string[] = [];
  for (const c of bible?.cast ?? []) {
    if (c.role === 'client' || c.name === personalName) continue;
    const rx = nameRx(c.name);
    for (const t of texts) {
      const body = t.kind === 'card' ? `${t.prose} ${t.errand}` : `${t.before} ${t.after}`;
      if (!rx.test(body)) continue;
      if (t.kind === 'card') unmet.push(c.name);
      break;
    }
  }
  const soldiers = (save?.cards ?? []).filter(c => c.character?.role === 'merc' && c.name !== personalName).map(c => c.name);
  const soldierHits = [...new Set(soldiers.filter(n => cards.some(c => nameRx(n).test(`${c.prose} ${c.errand}`))))];
  // answer words: the twist's own distinctive words, reaching a text before the finale report
  const common = new Set([...words(plan?.fixture.spark ?? ''), ...words(bible?.kernel ?? ''), ...(bible?.cast ?? []).flatMap(c => words(c.name))]);
  const twistWords = [...new Set(words(bible?.twist ?? '').filter(w => w.length >= 5 && !STOP.has(w) && !common.has(w)))];
  const preFinale = texts.filter(t => !(t.kind === 'report' && t.isFinale)).map(t => words(`${t.prose ?? ''} ${t.errand ?? ''} ${t.before ?? ''} ${t.after ?? ''}`)).flat();
  const preSet = new Set(preFinale);
  const leaked = twistWords.filter(w => preSet.has(w));
  const answerWordLeaks = leaked.length >= 2 ? leaked : [];

  // M14: openers and "?" endings
  const cardOpeners = cards.map(c => words(c.prose ?? '').slice(0, 3).join(' '));
  const questionEndings = cards.filter(c => /\?["”’']?\s*$/.test(c.prose ?? '')).length;

  // M15: caps on the RAW model output, per the prompt that asked for it
  let held = 0, checked = 0;
  const capBreaks: string[] = [];
  for (const c of calls.filter(x => x.ok && x.purpose === 'writeQuest')) {
    const o = tryJson(c.output); if (!o) continue;
    checked++;
    const n = wc(String(o.situation ?? ''));
    if (n <= CAPS.base.card()) held++; else capBreaks.push(`card ${n}/${CAPS.base.card()}`);
  }
  for (const c of calls.filter(x => x.ok && x.purpose === 'resolve')) {
    const o = tryJson(c.output), u = tryJson(c.user); if (!o || !u) continue;
    const finale = !!(u.chainContext as { isFinale?: boolean } | undefined)?.isFinale;
    const [cb, ca] = CAPS.base.report(u.gravity as string | undefined, finale);
    const b = wc(String(o.before ?? '')), a = wc(String(o.after ?? ''));
    checked += 2;
    if (b <= cb) held++; else capBreaks.push(`before ${b}/${cb}`);
    if (a <= ca) held++; else capBreaks.push(`after ${a}/${ca}`);
  }
  const softErrors = calls.filter(x => !x.ok).length;
  const hardFailures = drive.pursues.filter(p => !p.ok).length + meta.problems.filter(p => /fallback text/.test(p)).length;

  // M16 / M17
  const sagaCalls = calls.filter(x => SAGA_PURPOSES.has(x.purpose));
  const costSaga = sagaCalls.reduce((s, x) => s + x.costUsd, 0);
  const costAll = calls.reduce((s, x) => s + x.costUsd, 0);
  const ms = (p: string) => calls.filter(x => x.ok && x.purpose === p).map(x => x.durationMs);

  // paste rate: card words inside 4-word spans of the writer's own input
  const pastes = calls.filter(x => x.ok && x.purpose === 'writeQuest').map(x => {
    const o = tryJson(x.output), u = tryJson(x.user);
    return { beat: u?.beat, rate: o ? pasteRate(String(o.situation ?? ''), x.user) : null };
  }).filter(p => p.rate !== null) as { beat: unknown; rate: number }[];
  const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  // jobs: one per saga step (a re-posed card repeats its step)
  const steps = new Map<string, TextRec>();
  for (const c of cards) { const key = String(c.beat ?? c.k); if (!steps.has(key)) steps.set(key, c) }
  const jobSeq = [...steps.values()].map(c => jobType(c.errand ?? '', c.isFinale));
  const paperworkJobs = [...steps.values()].filter(c => !c.isFinale && PAPERWORK.test(c.errand ?? '')).length;

  return {
    id, attempts: meta.attempts.length, complete: meta.complete, cards: cards.length, reports: reports.length,
    unmetNameLeaks: unmet, soldierNamesOnCards: soldierHits, answerWordLeaks,
    cardOpeners, questionEndings, capsHeld: held, capsChecked: checked, capBreaks,
    hardFailures, softErrors,
    costSaga, costAll, costPerBeat: meta.attempts.length ? costSaga / meta.attempts.length : 0,
    pursueMs: drive.pursues.filter(p => p.ok).map(p => p.ms),
    // the first pursuit writes the saga (genesis + card 1); the rest are continuation cards
    pursueFirstMs: drive.pursues.filter(p => p.ok).slice(0, 1).map(p => p.ms),
    pursueLaterMs: drive.pursues.filter(p => p.ok).slice(1).map(p => p.ms), genesisMs: ms('genesis'), cardMs: ms('writeQuest'), reportMs: ms('resolve'),
    pasteBeat1: mean(pastes.filter(p => p.beat === 1).map(p => p.rate)), pasteAll: mean(pastes.map(p => p.rate)),
    card1: cards[0]?.prose ?? '', title: bible?.title ?? cards[0]?.title ?? '', jobSeq, paperworkJobs, jobs: jobSeq.filter(j => j !== 'showdown').length,
    cardWords: cards.map(c => wc(c.prose)), beforeWords: reports.map(r => wc(r.before)), afterWords: reports.map(r => wc(r.after)),
  };
}

/** a probe saga's plan.json (probe.ts): the engine side, the validated plan, and what the probe logged */
interface ProbePlanFile {
  // card1: Phase 1 runs only (R1 dropped the pitch arm: card 1 is always the `first` call); cast: R1 runs (full | lean)
  probe: { arm: { structure: string; names: string; card1?: string; cast?: string }; seed: { text: string } };
  engine: { cast: { id: string; name: string; trade?: string }[]; roster: { name: string }[]; places: string[] };
  plan: { title: string; answer: string; question: string; cast: { name: string; label?: string; known: boolean }[];
    episodes: { type?: string; job: string }[] } | null;
  validation: { defects: string[]; redraws: number; fallback: boolean };
  latency: { planMs: number; card1Ms: number };
}
type ProbeCall = CallLogLine & { template?: string; flags?: string[] };

/** the same measures on a PROBE saga (probe.ts, §5.2): v4 calls are plan · card · report, and each call's
 *  own system prompt states its caps, so caps are read from the prompt that asked */
export function sagaMechProbe(runDir: string, id: string): SagaMech {
  const sd = path.join(runDir, id);
  const texts = JSON.parse(fs.readFileSync(path.join(sd, 'texts.json'), 'utf8')) as TextRec[];
  const meta = JSON.parse(fs.readFileSync(path.join(sd, 'meta.json'), 'utf8')) as SagaMeta;
  const pf = JSON.parse(fs.readFileSync(path.join(sd, 'plan.json'), 'utf8')) as ProbePlanFile;
  const calls = readJsonl<ProbeCall>(path.join(sd, 'calls.jsonl'));
  const cards = texts.filter(t => t.kind === 'card'), reports = texts.filter(t => t.kind === 'report');
  const plan = pf.plan;
  const nameRx = (n: string) => new RegExp(`\\b${esc(n.split(/\s+/)[0]!)}\\b`);

  // M12 (code): the labels arm lets a name out only once a report met the person; the named arm names
  // everyone from card 1 by design, so nothing there is a leak
  const unmet: string[] = [];
  if (pf.probe.arm.names === 'labels') for (const c of (plan?.cast ?? []).filter(c => !c.known)) {
    const rx = nameRx(c.name);
    const first = texts.find(t => rx.test(t.kind === 'card' ? t.prose ?? '' : `${t.before} ${t.after}`));
    if (first?.kind === 'card') unmet.push(c.name);
  }
  const castNames = new Set(pf.engine.cast.map(c => c.name));
  const soldiers = pf.engine.roster.map(r => r.name).filter(n => !castNames.has(n));
  const soldierHits = [...new Set(soldiers.filter(n => cards.some(c => nameRx(n).test(c.prose ?? ''))))];
  // answer words (§2.7 lint): the answer's content words minus those in the seed, labels, places and names
  const common = new Set([...words(pf.probe.seed.text), ...pf.engine.places.flatMap(words),
    ...pf.engine.cast.flatMap(c => [...words(c.name), ...words(c.trade ?? '')]), ...(plan?.cast ?? []).flatMap(c => words(c.label ?? ''))]);
  const twistWords = [...new Set(words(plan?.answer ?? '').filter(w => w.length >= 5 && !STOP.has(w) && !common.has(w)))];
  const preSet = new Set(texts.filter(t => !(t.kind === 'report' && t.isFinale)).flatMap(t => words(`${t.prose ?? ''} ${t.before ?? ''} ${t.after ?? ''}`)));
  const leaked = twistWords.filter(w => preSet.has(w));

  const cardOpeners = cards.map(c => words(c.prose ?? '').slice(0, 3).join(' '));
  const questionEndings = cards.filter(c => /\?["”’']?\s*$/.test(c.prose ?? '')).length;

  // M15: every cap the asking prompt set — card, pitch, before, after, summary
  let held = 0, checked = 0;
  const capBreaks: string[] = [];
  const cap = (sys: string, rx: RegExp) => { const m = sys.match(rx); return m ? Number(m[1]) : null };
  const check = (label: string, text: unknown, max: number | null) => {
    if (max === null || typeof text !== 'string') return;
    checked++; const n = wc(text);
    if (n <= max) held++; else capBreaks.push(`${label} ${n}/${max}`);
  };
  for (const c of calls.filter(x => x.ok)) {
    const o = tryJson(c.output); if (!o) continue;
    if (c.purpose === 'card') check('card', o.card, cap(c.system, /"card": "at most (\d+) words"/));
    else if (c.purpose === 'plan') check('pitch', o.pitch, cap(c.system, /"pitch": "at most (\d+) words"/));
    else if (c.purpose === 'report') {
      check('before', o.before, cap(c.system, /before: at most (\d+) words/));
      check('after', o.after, cap(c.system, /after: at most (\d+) words/));
      check('summary', o.summary, cap(c.system, /summary: one sentence(?:,| of) at most (\d+) words/));
    }
  }
  // (R3, W3) gloss echo over every card and report the writer returned (prose fields only)
  const echoes: string[] = [];
  let nCard = 0, nRep = 0;
  for (const c of calls.filter(x => x.ok && (x.purpose === 'card' || x.purpose === 'report'))) {
    const o = tryJson(c.output); if (!o) continue;
    const label = c.purpose === 'card' ? `card_${++nCard}` : `report_${++nRep}`;
    const prose = c.purpose === 'card' ? String(o.card ?? '') : [o.before, o.after].filter(x => typeof x === 'string').join(' ');
    for (const g of glossEchoes(c.system, c.user, prose)) echoes.push(`${label}: ${g}`);
  }
  const softErrors = calls.filter(x => !x.ok).length;
  const hardFailures = Number(!!pf.validation.fallback) + meta.problems.filter(p => /fallback/.test(p)).length;

  const costSaga = calls.reduce((s, x) => s + x.costUsd, 0);
  const ms = (p: string, f?: (c: ProbeCall) => boolean) => calls.filter(x => x.ok && x.purpose === p && (!f || f(x))).map(x => x.durationMs);
  const laterCards = ms('card', c => !(c.flags ?? []).includes('first'));

  // paste: each card against the input of the call that wrote it (card 1 on the pitch arm = the plan call)
  const outs = calls.filter(x => x.ok && (x.purpose === 'card' || (x.purpose === 'plan' && pf.probe.arm.card1 === 'pitch')));
  const pastes = outs.map(x => { const o = tryJson(x.output); const t = String((x.purpose === 'plan' ? o?.pitch : o?.card) ?? ''); return { first: x.purpose === 'plan' || (x.flags ?? []).includes('first'), rate: pasteRate(t, x.user) } })
    .filter(p => p.rate !== null) as { first: boolean; rate: number }[];
  const lastFirst = pastes.filter(p => p.first).at(-1);
  const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  const eps = plan?.episodes ?? [];
  const jobSeq = cards.length > 1 || meta.attempts.length ? [...eps.map(e => e.type ?? jobType(e.job, false)), 'showdown'] : eps.map(e => e.type ?? jobType(e.job, false));
  const paperworkJobs = eps.filter(e => PAPERWORK.test(e.job)).length;
  const first = pf.latency.card1Ms;
  return {
    id, attempts: meta.attempts.length, complete: meta.complete, cards: cards.length, reports: reports.length,
    unmetNameLeaks: unmet, soldierNamesOnCards: soldierHits, answerWordLeaks: leaked.length >= 2 ? leaked : [],
    cardOpeners, questionEndings, capsHeld: held, capsChecked: checked, capBreaks,
    hardFailures, softErrors,
    costSaga, costAll: costSaga, costPerBeat: meta.attempts.length ? costSaga / meta.attempts.length : 0,
    pursueMs: [first, ...laterCards], pursueFirstMs: [first], pursueLaterMs: laterCards,
    genesisMs: ms('plan'), cardMs: ms('card'), reportMs: ms('report'),
    pasteBeat1: lastFirst?.rate ?? null, pasteAll: mean(pastes.map(p => p.rate)),
    card1: cards[0]?.prose ?? '', title: plan?.title ?? cards[0]?.title ?? '', jobSeq, paperworkJobs, jobs: eps.length,
    cardWords: cards.map(c => wc(c.prose)), beforeWords: reports.map(r => wc(r.before)), afterWords: reports.map(r => wc(r.after)),
    glossEchoes: echoes,
  };
}

export function runMech(runDir: string) {
  // a drive run keeps its sagas under sagas/; a probe run (probe.ts) keeps them in the run folder itself
  const probe = !fs.existsSync(path.join(runDir, 'sagas'));
  const root = probe ? runDir : path.join(runDir, 'sagas');
  const ids = fs.readdirSync(root).filter(f => fs.existsSync(path.join(root, f, 'texts.json'))).sort();
  const per = ids.map(id => probe ? sagaMechProbe(runDir, id) : sagaMech(runDir, id));
  const allOpeners = per.flatMap(p => p.cardOpeners.filter(Boolean));
  const openerCount = new Map<string, number>();
  for (const o of allOpeners) openerCount.set(o, (openerCount.get(o) ?? 0) + 1);
  const sharedOpeners = allOpeners.filter(o => openerCount.get(o)! > 1).length;
  const nCards = per.reduce((s, p) => s + p.cards, 0);

  // §D.3 — card-1 trigram overlap between sagas
  const tri = per.map(p => new Set(grams(words(p.card1), 3)));
  const pairs: number[] = [];
  for (let i = 0; i < tri.length; i++) for (let j = i + 1; j < tri.length; j++) pairs.push(jaccard(tri[i]!, tri[j]!));
  // title-word reuse
  const titleWords = per.map(p => new Set(words(p.title).filter(w => w.length >= 4 && !STOP.has(w))));
  const wordSagas = new Map<string, number>();
  titleWords.forEach(ws => ws.forEach(w => wordSagas.set(w, (wordSagas.get(w) ?? 0) + 1)));
  const reusedTitles = titleWords.filter(ws => [...ws].some(w => wordSagas.get(w)! > 1)).length;
  // job-type sequences
  const seqs = per.map(p => p.jobSeq.join('>'));
  const seqCount = new Map<string, number>(); seqs.forEach(s => seqCount.set(s, (seqCount.get(s) ?? 0) + 1));
  const typeCount = new Map<string, number>(); per.flatMap(p => p.jobSeq.filter(j => j !== 'showdown')).forEach(t => typeCount.set(t, (typeCount.get(t) ?? 0) + 1));
  // opening-sentence stamps: the first two words of every card-1 opening sentence
  const stamp = (s: string) => words(s.split(/(?<=[.!?])\s/)[0] ?? '').slice(0, 2).join(' ');
  const stamps = new Map<string, number>(); per.map(p => stamp(p.card1)).filter(Boolean).forEach(s => stamps.set(s, (stamps.get(s) ?? 0) + 1));
  const topStamp = [...stamps.entries()].sort((a, b) => b[1] - a[1])[0];

  const flat = (f: (p: SagaMech) => number[]) => per.flatMap(f);
  const agg = {
    sagas: per.length, complete: per.filter(p => p.complete).length, cards: nCards, reports: per.reduce((s, p) => s + p.reports, 0),
    M12_unmetNameLeaks: per.reduce((s, p) => s + p.unmetNameLeaks.length, 0),
    M12_soldierNamesOnCards: per.reduce((s, p) => s + p.soldierNamesOnCards.length, 0),
    M12_answerWordLeakSagas: per.filter(p => p.answerWordLeaks.length).length,
    M14_sharedOpenerShare: nCards ? sharedOpeners / nCards : null,
    M14_questionEndingShare: nCards ? per.reduce((s, p) => s + p.questionEndings, 0) / nCards : null,
    M15_capsHeld: (c => c ? per.reduce((s, p) => s + p.capsHeld, 0) / c : null)(per.reduce((s, p) => s + p.capsChecked, 0)),
    M15_hardFailureRate: (a => a ? per.reduce((s, p) => s + p.hardFailures, 0) / a : null)(per.reduce((s, p) => s + p.attempts, 0)),
    M15_softErrors: per.reduce((s, p) => s + p.softErrors, 0),
    M16_costPerSagaMean: per.length ? per.reduce((s, p) => s + p.costSaga, 0) / per.length : null,
    M16_costPerBeatMean: (a => a ? per.reduce((s, p) => s + p.costSaga, 0) / a : null)(per.reduce((s, p) => s + p.attempts, 0)),
    M16_costAllCalls: per.reduce((s, p) => s + p.costAll, 0),
    M17_pursueToCard_p50: median(flat(p => p.pursueMs)), M17_pursueToCard_p90: quantile(flat(p => p.pursueMs), 0.9),
    M17_pursueToCard1_p50: median(flat(p => p.pursueFirstMs)), M17_pursueToLaterCard_p50: median(flat(p => p.pursueLaterMs)),
    M17_genesis_p50: median(flat(p => p.genesisMs)), M17_card_p50: median(flat(p => p.cardMs)), M17_report_p50: median(flat(p => p.reportMs)),
    paste_beat1: (xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)(per.map(p => p.pasteBeat1).filter((x): x is number => x !== null)),
    paste_all: (xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)(per.map(p => p.pasteAll).filter((x): x is number => x !== null)),
    words_card_median: median(flat(p => p.cardWords)), words_before_median: median(flat(p => p.beforeWords)), words_after_median: median(flat(p => p.afterWords)),
    D3_card1TrigramJaccard_mean: pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : null,
    D3_card1TrigramJaccard_max: pairs.length ? Math.max(...pairs) : null,
    D3_titleWordReuseShare: per.length ? reusedTitles / per.length : null,
    D3_titleWordsReused: [...wordSagas.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w}×${n}`),
    D3_jobSeqDistinctShare: per.length ? seqCount.size / per.length : null,
    D3_jobTypeEntropyBits: entropy([...typeCount.values()]),
    D3_jobTypes: Object.fromEntries([...typeCount.entries()].sort((a, b) => b[1] - a[1])),
    D3_jobSeqs: Object.fromEntries([...seqCount.entries()].sort((a, b) => b[1] - a[1])),
    D3_topOpeningStamp: topStamp ? `${topStamp[0]} ×${topStamp[1]}` : null,
    D3_topOpeningStampShare: topStamp && per.length ? topStamp[1] / per.length : null,
    M13_paperworkProxy: (j => j ? per.reduce((s, p) => s + p.paperworkJobs, 0) / j : null)(per.reduce((s, p) => s + p.jobs, 0)),
    GE_glossEchoes: per.reduce((s, p) => s + (p.glossEchoes?.length ?? 0), 0),
    GE_textsWithEcho: per.reduce((s, p) => s + new Set((p.glossEchoes ?? []).map(x => x.split(':')[0])).size, 0),
    GE_top: (() => { const n = new Map<string, number>(); per.flatMap(p => p.glossEchoes ?? []).map(x => x.replace(/^[^:]*: /, '')).forEach(g => n.set(g, (n.get(g) ?? 0) + 1)); return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([g, c]) => `${g}×${c}`) })(),
  };
  return { run: path.basename(runDir), perSaga: per, aggregate: agg };
}

function main() {
  const i = process.argv.indexOf('--run');
  const run = i >= 0 ? process.argv[i + 1] : undefined;
  if (!run) { console.log('usage: npx tsx scripts/sagalab/mech.ts --run NAME'); process.exit(2) }
  const runDir = path.join(LAB, 'runs', run);
  const m = runMech(runDir);
  fs.writeFileSync(path.join(runDir, 'mech.json'), JSON.stringify(m, null, 2));
  const a = m.aggregate;
  const usd = (x: number | null) => x === null ? '—' : `$${x.toFixed(4)}`;
  const sec = (x: number | null) => x === null ? '—' : `${(x / 1000).toFixed(1)}s`;
  const md = [
    `# ${run} — mechanical measures`, '',
    `${a.sagas} sagas (${a.complete} complete), ${a.cards} cards, ${a.reports} reports.`, '',
    '| measure | value |', '|---|---|',
    `| M12 unmet-name leaks (code) | ${a.M12_unmetNameLeaks} |`,
    `| M12 soldier names on cards | ${a.M12_soldierNamesOnCards} |`,
    `| M12 sagas leaking ≥2 twist words before the finale | ${a.M12_answerWordLeakSagas} |`,
    `| M14 cards sharing an opening trigram | ${pct(a.M14_sharedOpenerShare)} |`,
    `| M14 cards ending on "?" | ${pct(a.M14_questionEndingShare)} |`,
    `| M15 caps held (raw output) | ${pct(a.M15_capsHeld)} |`,
    `| M15 hard failures per attempt | ${pct(a.M15_hardFailureRate)} |`,
    `| M15 soft errors (failed calls, retried) | ${a.M15_softErrors} |`,
    `| M16 cost per saga (saga calls) | ${usd(a.M16_costPerSagaMean)} |`,
    `| M16 cost per beat | ${usd(a.M16_costPerBeatMean)} |`,
    `| M17 pursue→card p50 / p90 (all) | ${sec(a.M17_pursueToCard_p50)} / ${sec(a.M17_pursueToCard_p90)} |`,
    `| M17 pursue→card 1 (the saga's writing) · → a later card, p50 | ${sec(a.M17_pursueToCard1_p50)} · ${sec(a.M17_pursueToLaterCard_p50)} |`,
    `| M17 genesis · card · report call p50 | ${sec(a.M17_genesis_p50)} · ${sec(a.M17_card_p50)} · ${sec(a.M17_report_p50)} |`,
    `| paste rate beat 1 / all cards | ${pct(a.paste_beat1)} / ${pct(a.paste_all)} |`,
    `| words: card · before · after (median, shown) | ${a.words_card_median ?? '—'} · ${a.words_before_median ?? '—'} · ${a.words_after_median ?? '—'} |`,
    `| §D.3 card-1 trigram Jaccard mean / max | ${a.D3_card1TrigramJaccard_mean?.toFixed(3) ?? '—'} / ${a.D3_card1TrigramJaccard_max?.toFixed(3) ?? '—'} |`,
    `| §D.3 titles sharing a word | ${pct(a.D3_titleWordReuseShare)} ${a.D3_titleWordsReused.slice(0, 8).join(' ')} |`,
    `| §D.3 distinct job sequences | ${pct(a.D3_jobSeqDistinctShare)} · type entropy ${a.D3_jobTypeEntropyBits.toFixed(2)} bits |`,
    `| §D.3 job types | ${Object.entries(a.D3_jobTypes).map(([k, v]) => `${k} ${v}`).join(' · ')} |`,
    `| §D.3 top card-1 opening stamp | ${a.D3_topOpeningStamp ?? '—'} (${pct(a.D3_topOpeningStampShare)}) |`,
    `| M13 paperwork (errand keyword proxy; J2 decides) | ${pct(a.M13_paperworkProxy)} |`,
    `| GE gloss echo (prompt 3-word runs in prose, not in the payload; log-only) | ${a.GE_glossEchoes} runs in ${a.GE_textsWithEcho} texts · ${a.GE_top.join(' · ')} |`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(runDir, 'mech.md'), md);
  console.log(md);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
