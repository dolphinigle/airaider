// SAGA LAB — the scorer (docs/STORYTELLER.md §1.1). Aggregates every seat of one ARM (one run or
// several, e.g. set A + set B of the baseline) into the §1.1 table, with bootstrap 95% CIs over sagas:
//
//   npx tsx scripts/sagalab/score.ts --runs A_RUN[,B_RUN] [--label base] [--out RUN]
//
// Reads, per run: sagas/*/meta.json · mech.json (run mech.ts first) · judge/j1_*/<saga>.json ·
// judge/j2_*/<saga>.json · judge/j3_*/vs_*/<saga>.json · judge/j4_*/*.json. A seat that has not run
// shows as —. Writes REPORT.md (and score.json) into the first run's folder (or --out).
//
// A CI is the 2.5–97.5 percentile of 2,000 resamples of the SAGAS (seeded, so a re-run prints the
// same numbers). Ratio metrics resample numerator and denominator together.
//
// Calibration (Phase 0 findings, docs/STORYTELLER.md §5.0):
//   M1 is STRICT: a card part J2 grades "unclear" (the card left it unclear) is NOT followed; the old
//      lenient reading stays as M1-lax. M1-said adds "the reader's paraphrase says 'unclear' nowhere":
//      the rule the frozen baseline (legacy boolean J2 files) was scored with, so the cross-version row.
//   Taste scores (M2, M3, M3b, M4) come from the PRIMARY seat, j1_opus; gpt-5 rows sit alongside.
//      Never compare them across runs read by a different mix of seats.
//   J3 (M10) scores only ORDER-BALANCED pairs: each pair read in both orders, a pick counts only when
//      it holds in both. A single-order read is shown, never scored.
// A run folder holds its sagas under sagas/ (drive runs) or directly (probe runs).

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SagaMech } from './mech.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');
const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined };

type J = Record<string, unknown>;
const readJson = <T = J>(p: string): T | null => { try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T } catch { return null } };
const dirs = (p: string) => fs.existsSync(p) ? fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory()) : [];
const files = (p: string) => fs.existsSync(p) ? fs.readdirSync(p).filter(f => f.endsWith('.json')) : [];
/** where a run keeps its saga folders: sagas/ for drive runs, the run folder itself for probe runs */
const sagaRoot = (runDir: string) => fs.existsSync(path.join(runDir, 'sagas')) ? path.join(runDir, 'sagas') : runDir;
/** the primary J1 seat for taste scores (Phase-0 calibration), and the seats reported alongside it */
const PRIMARY_J1 = 'j1_opus';
const ALONGSIDE_J1 = ['j1_gpt5'];

interface J1 { seat: string; texts: { text: string; kind: string; paraphrase?: string; ease?: number; want_to_send?: number; want_next?: number; reread?: string; send?: boolean }[]; end?: J }
/** a J2 grade of one paraphrase part: true · "unclear" (the card left it unclear) · false. Legacy
 *  files hold booleans only, graded leniently */
type Grade = boolean | 'unclear';
type PartGrades = { who_wants_what?: Grade; what_to_do?: Grade; who_in_way?: Grade };
interface J2 {
  seat: string;
  cards?: { text: string; paraphrase_right?: Record<string, PartGrades>; paperwork?: boolean; job_type?: string; unmet_names?: string[]; spoiler?: string; engine_speak?: string[]; part_word_labels?: string[] }[];
  reports?: { text: string; j1_right?: Record<string, { outcome?: boolean; change?: boolean }>; spoiler?: string; engine_speak?: string[]; part_word_labels?: string[] }[];
  retell?: Record<string, { ask?: boolean; answer?: boolean; ending?: boolean }>;
  question_category?: string; answer_category?: string; question_answered?: boolean; answer_guessable_from_card1?: boolean;
  continuity_errors?: unknown[];
}

/** one saga's raw material, every seat that ran on it */
interface Saga { run: string; id: string; j1: J1[]; j2: J2[]; mech: SagaMech | null }

/** a per-saga [numerator, denominator] (den 0 = no data on this saga) */
type Frac = (s: Saga) => [number, number];

function mulberry32(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

function estimate(sagas: Saga[], f: Frac, B = 2000): { value: number | null; lo: number | null; hi: number | null; n: number; den: number } {
  const parts = sagas.map(f).filter(([, d]) => d > 0);
  const den = parts.reduce((s, [, d]) => s + d, 0);
  if (!parts.length || !den) return { value: null, lo: null, hi: null, n: 0, den: 0 };
  const value = parts.reduce((s, [x]) => s + x, 0) / den;
  const rnd = mulberry32(20261001);
  const stats: number[] = [];
  for (let b = 0; b < B; b++) {
    let x = 0, d = 0;
    for (let i = 0; i < parts.length; i++) { const p = parts[Math.floor(rnd() * parts.length)]!; x += p[0]; d += p[1] }
    if (d) stats.push(x / d);
  }
  stats.sort((a, b) => a - b);
  return { value, lo: stats[Math.floor(0.025 * stats.length)] ?? null, hi: stats[Math.floor(0.975 * stats.length)] ?? null, n: parts.length, den };
}

const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
const cardsOf = (j: J1) => j.texts.filter(t => t.kind === 'card');
const reportsOf = (j: J1) => j.texts.filter(t => t.kind === 'report');
const avgOver = (vals: (number | undefined)[]): [number, number] => { const v = vals.filter((x): x is number => typeof x === 'number'); return [v.reduce((a, b) => a + b, 0), v.length] };

/** one J3 read, in run names. The API seat writes both orders of a pair in one file (`reads`); a legacy
 *  file holds one read; a file seat writes X/Y picks and the two folders it was given (a run name
 *  or a path under runs/), one file per order. */
interface J3Read { saga: string; firstShown: string | null; keep: string | null; follow: string | null }
function j3Reads(r: J, self: string, other: string, file: string): J3Read[] {
  const saga = String(r.saga ?? file.split('.')[0]);
  if (Array.isArray(r.reads)) return (r.reads as J[]).flatMap(x => j3Reads({ ...x, saga }, self, other, file));
  const a = (r.answer ?? r) as J;
  const names = [self, other].sort((p, q) => q.length - p.length);
  const runOf = (folder: unknown): string | null => {
    const f = String(folder ?? '');
    if (!f) return null;
    return names.find(c => f === c || f.includes(`runs/${c}/`) || f.startsWith(`${c}/`) || f.endsWith(`/${c}`))
      ?? f.match(/runs\/([^/]+)/)?.[1] ?? f.split('/')[0] ?? f;
  };
  const x = runOf(r.x), y = runOf(r.y);
  const pick = (v: unknown) => v === 'X' ? x : v === 'Y' ? y : null;
  const known = (v: unknown) => typeof v === 'string' && names.includes(v) ? v : null;
  return [{
    saga, firstShown: known(r.firstShown) ?? x,
    keep: known(r.keep) ?? pick(a.rather_keep_playing), follow: known(r.follow) ?? pick(a.follow_more_easily),
  }];
}
interface J3Set { dir: string; self: string; other: string; reads: J3Read[] }

function load(runs: string[]): { sagas: Saga[]; j3: J3Set[]; j4: J[]; mech: J[] } {
  const sagas: Saga[] = [];
  const j3: J3Set[] = [];
  const j4: J[] = [];
  const mech: J[] = [];
  for (const run of runs) {
    const rd = path.join(LAB, 'runs', run);
    const m = readJson<{ perSaga: SagaMech[]; aggregate: J }>(path.join(rd, 'mech.json'));
    if (m) mech.push(m.aggregate);
    const judge = path.join(rd, 'judge');
    const seats = dirs(judge);
    const root = sagaRoot(rd);
    for (const id of dirs(root).filter(d => fs.existsSync(path.join(root, d, 'meta.json'))).sort()) {
      // the seat is the folder the file sits in, whatever the file calls itself
      const seatFiles = <T extends { seat: string }>(pre: string) => seats.filter(s => s.startsWith(pre))
        .map(s => { const x = readJson<T>(path.join(judge, s, `${id}.json`)); return x ? { ...x, seat: s } : null }).filter((x): x is T => !!x);
      sagas.push({
        run, id,
        j1: seatFiles<J1>('j1_'),
        j2: seatFiles<J2>('j2_'),
        mech: m?.perSaga.find(p => p.id === id) ?? null,
      });
    }
    for (const s of seats.filter(s => s.startsWith('j3_'))) for (const vs of dirs(path.join(judge, s)))
    {
      // the other run's name: as the file records it (a nested probe run cannot be a folder name), else the folder's
      const got = files(path.join(judge, s, vs)).map(f => ({ f, x: readJson(path.join(judge, s, vs, f)) })).filter((e): e is { f: string; x: J } => !!e.x);
      const other = String(got.find(e => e.x.other)?.x.other ?? vs.replace(/^vs_/, ''));
      j3.push({ dir: `${run}/${s}/${vs}`, self: run, other, reads: got.flatMap(e => j3Reads(e.x, run, other, e.f)) });
    }
    for (const s of seats.filter(s => s.startsWith('j4_'))) for (const f of files(path.join(judge, s))) { const x = readJson(path.join(judge, s, f)); if (x) j4.push(x) }
  }
  return { sagas, j3, j4, mech };
}

/** M1 per saga: cards × graded seats.
 *   parts — all three parts graded `true` (the §5.0 strict rule: J2 grades a part the card leaves
 *           unclear as "unclear", never `true`). On a legacy boolean-only J2 file this is the lenient
 *           reading, so it is never compared across rubric versions.
 *   said  — `parts`, and the seat's paraphrase says "unclear" nowhere: the rule the frozen baseline's
 *           M1-strict (59.6%) was computed with, so the one row comparable across rubric versions.
 *           Stricter than `parts` on the new rubric (it also fails "why: unclear" outside the 3 parts).
 *   lax   — every part `true` or "unclear" (watch only).
 *  The mode is chosen per ROW, never guessed per file: an all-`true` grade looks the same in both rubrics. */
function m1(s: Saga, mode: 'parts' | 'said' | 'lax'): [number, number] {
  let x = 0, d = 0;
  for (const j2 of s.j2) for (const c of j2.cards ?? []) for (const [seat, g] of Object.entries(c.paraphrase_right ?? {})) {
    const parts = [g.who_wants_what, g.what_to_do, g.who_in_way];
    d++;
    if (mode === 'lax') { if (parts.every(p => p === true || p === 'unclear')) x++; continue }
    const said = s.j1.find(j => j.seat === seat)?.texts.find(t => t.text === c.text)?.paraphrase ?? '';
    if (parts.every(p => p === true) && !(mode === 'said' && /\bunclear\b/i.test(said))) x++;
  }
  return [x, d];
}
/** the same, on card 1 only (§5.2: card 1 three ways) */
const m1Card1 = (s: Saga, mode: 'parts' | 'said'): [number, number] =>
  m1({ ...s, j2: s.j2.map(j => ({ ...j, cards: (j.cards ?? []).filter(c => c.text === 'card_1.md') })) }, mode);

/** the taste scores of ONE J1 seat (the primary seat's rows carry the §1.1 ids) */
function tasteMetrics(seat: string, sfx: string): Metric[] {
  const of = (s: Saga) => s.j1.filter(j => j.seat === seat);
  const who = sfx ? `${seat} alongside` : `${seat}, primary`;
  return [
    { id: `M2${sfx}`, name: `Follow, felt (J1 ease 0–10, cards; ${who})`, fmt: 'num', target: sfx ? '—' : 'G3 ≥ base+1.0, above floor · G2 ≥ base', f: s => avgOver(of(s).flatMap(j => cardsOf(j).map(t => t.ease))) },
    { id: `M3${sfx}`, name: `Want the next part (J1 0–10, reports; ${who})`, fmt: 'num', target: sfx ? '—' : 'G3 ≥ base+1.0, above floor · G2 ≥ base', f: s => avgOver(of(s).flatMap(j => reportsOf(j).map(t => t.want_next))) },
    { id: `M3b${sfx}`, name: `Want to send (J1 0–10, cards; ${who})`, fmt: 'num', target: '—', f: s => avgOver(of(s).flatMap(j => cardsOf(j).map(t => t.want_to_send))) },
    { id: `M4${sfx}`, name: `Send on card 1 (J1 yes; ${who})`, fmt: 'pct', target: sfx ? '—' : '≥ base, above floor', f: s => {
      const v = of(s).map(j => cardsOf(j)[0]?.send).filter((x): x is boolean => typeof x === 'boolean');
      return [v.filter(Boolean).length, v.length];
    } },
  ];
}

/** the §1.1 metrics that live on sagas — each a Frac, so every one gets the same bootstrap */
interface Metric { id: string; name: string; f: Frac; fmt: 'pct' | 'num' | 'usd' | 'sec'; target: string; note?: string }
const METRICS: Metric[] = [
  { id: 'M1', name: 'Follow, objective, STRICT (J2 parts 3/3 `true`; "unclear" = not followed; new rubric only)', fmt: 'pct', target: 'G3 ≥ 90% & ≥ min(base+15pp, 97%) · G2 ≥ 85%', f: s => m1(s, 'parts') },
  { id: 'M1c1', name: 'M1 on card 1 only', fmt: 'pct', target: '—', f: s => m1Card1(s, 'parts') },
  { id: 'M1-said', name: 'M1, and the reader wrote "unclear" nowhere (the frozen base\'s M1-strict rule: compare to base 59.6%)', fmt: 'pct', target: 'not below base (G1)', f: s => m1(s, 'said') },
  { id: 'M1-said c1', name: 'M1-said on card 1 only (base 25%)', fmt: 'pct', target: '—', f: s => m1Card1(s, 'said') },
  { id: 'M1-lax', name: 'Follow, objective, lenient ("unclear" on a part the card never says = right)', fmt: 'pct', target: '(watch only)', f: s => m1(s, 'lax') },
  ...tasteMetrics(PRIMARY_J1, ''),
  ...ALONGSIDE_J1.flatMap(seat => tasteMetrics(seat, `·${seat.replace(/^j1_/, '')}`)),
  { id: 'M5', name: 'Reread (texts where BOTH J1 seats quote one)', fmt: 'pct', target: 'G3 ≤ 10% · G2 ≤ 15%', note: 'needs 2 J1 seats; with one seat, see M5′', f: s => {
    if (s.j1.length < 2) return [0, 0];
    const [a, b] = s.j1;
    let x = 0, d = 0;
    for (const t of a!.texts) { const u = b!.texts.find(v => v.text === t.text); if (!u) continue; d++; if (nonEmpty(t.reread) && nonEmpty(u.reread)) x++ }
    return [x, d];
  } },
  { id: "M5′", name: 'Reread (any one seat quotes one, per seat-text)', fmt: 'pct', target: '(single-seat view)', f: s => {
    const all = s.j1.flatMap(j => j.texts);
    return [all.filter(t => nonEmpty(t.reread)).length, all.length];
  } },
  { id: 'M6a', name: 'Report clarity: J1 right on outcome (J2)', fmt: 'pct', target: '≥ 95%', f: s => {
    const g = s.j2.flatMap(j => (j.reports ?? []).flatMap(r => Object.values(r.j1_right ?? {})));
    return [g.filter(x => x.outcome).length, g.length];
  } },
  { id: 'M6b', name: 'Report clarity: J1 right on change (J2)', fmt: 'pct', target: '≥ 85%', f: s => {
    const g = s.j2.flatMap(j => (j.reports ?? []).flatMap(r => Object.values(r.j1_right ?? {})));
    return [g.filter(x => x.change).length, g.length];
  } },
  { id: 'M7', name: 'Retell: facts of 3 (J2)', fmt: 'num', target: 'G3 ≥ 2.5 · G2 ≥ 2.0', f: s => {
    const g = s.j2.flatMap(j => Object.values(j.retell ?? {}));
    return [g.reduce((a, x) => a + Number(!!x.ask) + Number(!!x.answer) + Number(!!x.ending), 0), g.length];
  } },
  { id: 'M8', name: 'Question answered (J2)', fmt: 'pct', target: '100%', f: s => { const v = s.j2.map(j => j.question_answered).filter(x => typeof x === 'boolean'); return [v.filter(Boolean).length, v.length] } },
  { id: 'M9', name: 'Answer NOT guessable from card 1 (J2)', fmt: 'pct', target: '≥ 60%', f: s => { const v = s.j2.map(j => j.answer_guessable_from_card1).filter(x => typeof x === 'boolean'); return [v.filter(x => !x).length, v.length] } },
  { id: 'M11', name: 'Continuity errors per saga (J2)', fmt: 'num', target: 'G3 ≤ 0.3 · G2 ≤ 0.5', f: s => s.j2.length ? [s.j2.reduce((a, j) => a + (j.continuity_errors?.length ?? 0), 0), s.j2.length] : [0, 0] },
  { id: 'M12a', name: 'Spoilers per saga (J2)', fmt: 'num', target: '0', f: s => s.j2.length ? [s.j2.reduce((a, j) => a + [...(j.cards ?? []), ...(j.reports ?? [])].filter(t => nonEmpty(t.spoiler)).length, 0), s.j2.length] : [0, 0] },
  { id: 'M12b', name: 'Unmet-name leaks per saga (J2)', fmt: 'num', target: '0', f: s => s.j2.length ? [s.j2.reduce((a, j) => a + (j.cards ?? []).reduce((b, c) => b + (c.unmet_names?.length ?? 0), 0), 0), s.j2.length] : [0, 0] },
  { id: 'M12c', name: 'Unmet-name leaks per saga (code)', fmt: 'num', target: '0', f: s => s.mech ? [s.mech.unmetNameLeaks.length, 1] : [0, 0] },
  { id: 'M12d', name: 'Soldier names on cards per saga (code)', fmt: 'num', target: '0', f: s => s.mech ? [s.mech.soldierNamesOnCards.length, 1] : [0, 0] },
  { id: 'M13', name: 'Paperwork jobs (J2)', fmt: 'pct', target: '≤ 1 in 8', f: s => {
    const c = s.j2.flatMap(j => (j.cards ?? []).filter(x => x.job_type !== 'showdown'));
    return [c.filter(x => x.paperwork || x.job_type === 'paperwork').length, c.length];
  } },
  { id: 'ES', name: 'Engine-speak quotes per saga (J2)', fmt: 'num', target: '—', f: s => s.j2.length ? [s.j2.reduce((a, j) => a + [...(j.cards ?? []), ...(j.reports ?? [])].reduce((b, t) => b + (t.engine_speak?.length ?? 0), 0), 0), s.j2.length] : [0, 0] },
  { id: 'PW', name: 'Part-word labels per saga (J2)', fmt: 'num', target: '—', f: s => s.j2.length ? [s.j2.reduce((a, j) => a + [...(j.cards ?? []), ...(j.reports ?? [])].reduce((b, t) => b + (t.part_word_labels?.length ?? 0), 0), 0), s.j2.length] : [0, 0] },
  { id: 'M14b', name: 'Cards ending on "?" (code)', fmt: 'pct', target: '≤ 25%', f: s => s.mech ? [s.mech.questionEndings, s.mech.cards] : [0, 0] },
  { id: 'M15a', name: 'Caps held, raw output (code)', fmt: 'pct', target: '≥ 95%', f: s => s.mech ? [s.mech.capsHeld, s.mech.capsChecked] : [0, 0] },
  { id: 'M15b', name: 'Hard failures per attempt (code)', fmt: 'pct', target: '≤ 2%', f: s => s.mech ? [s.mech.hardFailures, s.mech.attempts] : [0, 0] },
  { id: 'M16a', name: 'Cost per saga (saga calls)', fmt: 'usd', target: '≤ $0.035, never above base', f: s => s.mech ? [s.mech.costSaga, 1] : [0, 0] },
  { id: 'M16b', name: 'Cost per beat', fmt: 'usd', target: '≤ $0.005', f: s => s.mech ? [s.mech.costSaga, s.mech.attempts] : [0, 0] },
  { id: 'M17a', name: 'Latency pursue→card 1, the saga written (mean)', fmt: 'sec', target: 'G5 p50 ≤ 15 s · G2 ≤ base', note: 'p50 in the mechanical block', f: s => s.mech ? [(s.mech.pursueFirstMs ?? []).reduce((a, b) => a + b, 0), (s.mech.pursueFirstMs ?? []).length] : [0, 0] },
  { id: 'M17a′', name: 'Latency pursue→a later card (mean)', fmt: 'sec', target: 'G2 ≤ base', f: s => s.mech ? [(s.mech.pursueLaterMs ?? []).reduce((a, b) => a + b, 0), (s.mech.pursueLaterMs ?? []).length] : [0, 0] },
  { id: 'M17b', name: 'Latency card call (mean)', fmt: 'sec', target: 'G5 p50 ≤ 5 s', f: s => s.mech ? [s.mech.cardMs.reduce((a, b) => a + b, 0), s.mech.cardMs.length] : [0, 0] },
  { id: 'M17c', name: 'Latency report call (mean)', fmt: 'sec', target: 'G5 p50 ≤ 6 s', f: s => s.mech ? [s.mech.reportMs.reduce((a, b) => a + b, 0), s.mech.reportMs.length] : [0, 0] },
  { id: 'PR', name: 'Paste rate, beat-1 card (code)', fmt: 'pct', target: '(prior 52%)', f: s => s.mech?.pasteBeat1 != null ? [s.mech.pasteBeat1, 1] : [0, 0] },
];

function fmt(x: number | null, f: 'pct' | 'num' | 'usd' | 'sec'): string {
  if (x === null || Number.isNaN(x)) return '—';
  return f === 'pct' ? `${(100 * x).toFixed(1)}%` : f === 'usd' ? `$${x.toFixed(4)}` : f === 'sec' ? `${(x / 1000).toFixed(1)}s` : x.toFixed(2);
}

function entropyOf(labels: string[]): { distinct: number; bits: number; top: string } {
  const c = new Map<string, number>(); labels.forEach(l => c.set(l, (c.get(l) ?? 0) + 1));
  const n = labels.length;
  const bits = n ? -[...c.values()].reduce((h, k) => h + (k / n) * Math.log2(k / n), 0) : 0;
  const top = [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
  return { distinct: c.size, bits, top };
}

function main() {
  const runs = (opt('runs') ?? opt('run') ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!runs.length) { console.log('usage: npx tsx scripts/sagalab/score.ts --runs A_RUN[,B_RUN] [--label base] [--out RUN]'); process.exit(2) }
  const label = opt('label') ?? runs.join('+');
  const { sagas, j3, j4, mech } = load(runs);
  const seatsSeen = [...new Set(sagas.flatMap(s => [...s.j1.map(j => j.seat), ...s.j2.map(j => j.seat)]))].sort();
  const rows = METRICS.map(m => ({ m, e: estimate(sagas, m.f) }));
  const out: string[] = [
    `# Saga lab — ${label}`, '',
    `Runs: ${runs.join(', ')} · ${sagas.length} sagas · seats: ${seatsSeen.join(', ') || 'none yet'} · J3 sets: ${j3.length} · J4 series: ${j4.length}`,
    `CIs: bootstrap 95% over sagas (2,000 resamples, seeded). n = sagas with data.`,
    `Taste scores (M2, M3, M3b, M4) are the ${PRIMARY_J1} seat's; ${ALONGSIDE_J1.join(', ')} rows sit alongside. Compare them only with runs read by the same seats. M1 is strict ("unclear" = not followed).`, '',
    '## §1.1 table', '',
    '| # | metric | value | 95% CI | n | target |', '|---|---|---|---|---|---|',
    ...rows.map(({ m, e }) => `| ${m.id} | ${m.name}${m.note ? ` (${m.note})` : ''} | ${fmt(e.value, m.fmt)} | ${e.lo === null ? '—' : `${fmt(e.lo, m.fmt)} – ${fmt(e.hi, m.fmt)}`} | ${e.n} | ${m.target} |`),
  ];

  // M10 — pair preference per J3 set, ORDER-BALANCED: a pair counts only when it was read in both
  // orders, and a pick only when it holds in both; single-order reads are shown, never scored
  out.push('', '## M10 — pair preference (J3, order-balanced)', '');
  if (!j3.length) out.push('— (no J3 run yet: `judge_gpt.ts j3 --run X --vs Y` reads every pair in both orders, plus the Opus seat)');
  else {
    out.push('| set | pairs read in both orders / all | kept = this run, both orders | followed = this run, both orders | keep / follow held across orders | kept = shown first (all reads) | followed = shown first (all reads) |', '|---|---|---|---|---|---|---|');
    for (const s of j3) {
      const bySaga = new Map<string, J3Read[]>();
      for (const r of s.reads) bySaga.set(r.saga, [...(bySaga.get(r.saga) ?? []), r]);
      const pairs = [...bySaga.values()];
      const balanced = pairs.filter(rs => rs.some(r => r.firstShown === s.self) && rs.some(r => r.firstShown === s.other));
      const held = (rs: J3Read[], k: 'keep' | 'follow') => rs.every(r => r[k] && r[k] === rs[0]![k]) ? rs[0]![k] : null;
      const nb = balanced.length;
      const share = (n: number, d: number) => d ? `${(100 * n / d).toFixed(0)}% (${n}/${d})` : '—';
      const reads = s.reads.length;
      out.push(`| ${s.dir} | ${nb} / ${pairs.length} | ${share(balanced.filter(rs => held(rs, 'keep') === s.self).length, nb)} | ${share(balanced.filter(rs => held(rs, 'follow') === s.self).length, nb)} | ${share(balanced.filter(rs => held(rs, 'keep')).length, nb)} / ${share(balanced.filter(rs => held(rs, 'follow')).length, nb)} | ${share(s.reads.filter(r => r.keep && r.keep === r.firstShown).length, reads)} | ${share(s.reads.filter(r => r.follow && r.follow === r.firstShown).length, reads)} |`);
    }
    out.push('', 'M10 = "kept = this run, both orders" over pairs read in both orders; a pick that flips with the order is position, not preference. Phase-0 calibration: base B vs regenerated B′ should sit near 50%.');
  }

  // M19 — J4 series repetition
  out.push('', '## M19 — repetition (J4 series reader)', '');
  if (!j4.length) out.push('— (no J4 run yet: `judge_gpt.ts j4 --runs A,B`, plus the Opus seat)');
  else {
    const scores = j4.map(x => Number((x.answer as J)?.repetitive ?? x.repetitive)).filter(Number.isFinite);
    const meanRep = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    out.push(`Mean repetitive score: **${meanRep.toFixed(2)} / 10** over ${scores.length} series-seat read(s): ${j4.map(x => `${x.seat} ${String(x.series ?? '').split('_of_')[0]} → ${(x.answer as J)?.repetitive ?? x.repetitive}`).join(' · ')}`);
    for (const x of j4) {
      const a = (x.answer ?? x) as J;
      out.push('', `**${x.seat} · ${x.series}** — worst repeat: ${a.worst_repeat ?? '—'}`, `same story: ${JSON.stringify(a.same_story ?? [])}`, `repeats: ${Object.entries((a.repeats ?? {}) as Record<string, string>).filter(([, v]) => v).map(([k, v]) => `*${k}*: ${v}`).join(' · ') || '—'}`);
    }
  }

  // §D.3 spread — J2's categories across sagas, and the mechanical repetition block
  out.push('', '## §D.3 — spread and mechanical repetition', '');
  const qc = entropyOf(sagas.flatMap(s => s.j2.map(j => j.question_category ?? '')).filter(Boolean));
  const ac = entropyOf(sagas.flatMap(s => s.j2.map(j => j.answer_category ?? '')).filter(Boolean));
  const jt = entropyOf(sagas.flatMap(s => s.j2.flatMap(j => (j.cards ?? []).map(c => c.job_type ?? '')).filter(t => t && t !== 'showdown')));
  out.push(`- question categories (J2): ${qc.distinct} distinct, ${qc.bits.toFixed(2)} bits — ${qc.top || '—'}`);
  out.push(`- answer categories (J2): ${ac.distinct} distinct, ${ac.bits.toFixed(2)} bits — ${ac.top || '—'}`);
  out.push(`- job types (J2): ${jt.distinct} distinct, ${jt.bits.toFixed(2)} bits — ${jt.top || '—'}`);
  for (const [i, m] of mech.entries()) {
    const n = (k: string) => (m[k] as number | null | undefined);
    const p = (k: string) => n(k) == null ? '—' : `${(100 * n(k)!).toFixed(0)}%`;
    out.push(`- mech (${runs[i]}): card-1 trigram Jaccard mean ${n('D3_card1TrigramJaccard_mean')?.toFixed(3) ?? '—'} (max ${n('D3_card1TrigramJaccard_max')?.toFixed(3) ?? '—'}) · titles sharing a word ${p('D3_titleWordReuseShare')} ${(m.D3_titleWordsReused as string[] | undefined)?.slice(0, 6).join(' ') ?? ''} · distinct job sequences ${p('D3_jobSeqDistinctShare')} · job-type entropy ${n('D3_jobTypeEntropyBits')?.toFixed(2) ?? '—'} bits · top opening stamp ${m.D3_topOpeningStamp ?? '—'} · M14 shared openers ${p('M14_sharedOpenerShare')} · M17 pursue→card p50 ${n('M17_pursueToCard_p50') == null ? '—' : `${(n('M17_pursueToCard_p50')! / 1000).toFixed(1)}s`} · card/report call p50 ${n('M17_card_p50') == null ? '—' : `${(n('M17_card_p50')! / 1000).toFixed(1)}s`}/${n('M17_report_p50') == null ? '—' : `${(n('M17_report_p50')! / 1000).toFixed(1)}s`}`);
  }
  if (!mech.length) out.push('- mech: — (run `mech.ts --run NAME` first)');
  out.push('', `Seats per saga: ${sagas.map(s => `${s.id} j1×${s.j1.length} j2×${s.j2.length}`).join(' · ')}`, '');

  const dest = path.join(LAB, 'runs', opt('out') ?? runs[0]!);
  fs.writeFileSync(path.join(dest, 'REPORT.md'), out.join('\n'));
  fs.writeFileSync(path.join(dest, 'score.json'), JSON.stringify({ label, runs, seats: seatsSeen, primaryJ1: PRIMARY_J1, metrics: rows.map(({ m, e }) => ({ id: m.id, name: m.name, ...e })), j3: j3.map(s => ({ dir: s.dir, reads: s.reads.length })), j4: j4.length }, null, 2));
  console.log(out.join('\n'));
  console.log(`\n→ ${path.relative(V3, path.join(dest, 'REPORT.md'))}`);
}

main();
