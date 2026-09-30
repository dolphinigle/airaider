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

interface J1 { seat: string; texts: { text: string; kind: string; ease?: number; want_to_send?: number; want_next?: number; reread?: string; send?: boolean }[]; end?: J }
interface J2 {
  seat: string;
  cards?: { text: string; paraphrase_right?: Record<string, { who_wants_what?: boolean; what_to_do?: boolean; who_in_way?: boolean }>; paperwork?: boolean; job_type?: string; unmet_names?: string[]; spoiler?: string; engine_speak?: string[]; part_word_labels?: string[] }[];
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

/** a J3 row in one shape: the API seat writes keep/follow/firstShown as run names; a file seat
 *  writes X/Y picks and the two folders it was given (a run name or a path under runs/) */
function normalizeJ3(r: J): J {
  if (r.keep && r.follow && r.firstShown) return r;
  const a = (r.answer ?? r) as J;
  const runOf = (folder: unknown) => { const f = String(folder ?? ''); return f.match(/runs\/([^/]+)/)?.[1] ?? f.split('/')[0] ?? f };
  const x = runOf(r.x), y = runOf(r.y);
  const pick = (v: unknown) => v === 'X' ? x : v === 'Y' ? y : null;
  return { ...r, keep: r.keep ?? pick(a.rather_keep_playing), follow: r.follow ?? pick(a.follow_more_easily), firstShown: r.firstShown ?? x };
}

function load(runs: string[]): { sagas: Saga[]; j3: { dir: string; rows: J[] }[]; j4: J[]; mech: J[] } {
  const sagas: Saga[] = [];
  const j3: { dir: string; rows: J[] }[] = [];
  const j4: J[] = [];
  const mech: J[] = [];
  for (const run of runs) {
    const rd = path.join(LAB, 'runs', run);
    const m = readJson<{ perSaga: SagaMech[]; aggregate: J }>(path.join(rd, 'mech.json'));
    if (m) mech.push(m.aggregate);
    const judge = path.join(rd, 'judge');
    const seats = dirs(judge);
    for (const id of dirs(path.join(rd, 'sagas')).filter(d => fs.existsSync(path.join(rd, 'sagas', d, 'meta.json'))).sort()) {
      sagas.push({
        run, id,
        j1: seats.filter(s => s.startsWith('j1_')).map(s => readJson<J1>(path.join(judge, s, `${id}.json`))).filter((x): x is J1 => !!x),
        j2: seats.filter(s => s.startsWith('j2_')).map(s => readJson<J2>(path.join(judge, s, `${id}.json`))).filter((x): x is J2 => !!x),
        mech: m?.perSaga.find(p => p.id === id) ?? null,
      });
    }
    for (const s of seats.filter(s => s.startsWith('j3_'))) for (const vs of dirs(path.join(judge, s)))
      j3.push({ dir: `${run}/${s}/${vs}`, rows: files(path.join(judge, s, vs)).map(f => readJson(path.join(judge, s, vs, f))!).filter(Boolean).map(normalizeJ3) });
    for (const s of seats.filter(s => s.startsWith('j4_'))) for (const f of files(path.join(judge, s))) { const x = readJson(path.join(judge, s, f)); if (x) j4.push(x) }
  }
  return { sagas, j3, j4, mech };
}

/** the §1.1 metrics that live on sagas — each a Frac, so every one gets the same bootstrap */
const METRICS: { id: string; name: string; f: Frac; fmt: 'pct' | 'num' | 'usd' | 'sec'; target: string; note?: string }[] = [
  { id: 'M1', name: 'Follow, objective (J2: paraphrase 3/3)', fmt: 'pct', target: 'G3 ≥ 90% & ≥ min(base+15pp, 97%) · G2 ≥ 85%', f: s => {
    let x = 0, d = 0;
    for (const j2 of s.j2) for (const c of j2.cards ?? []) for (const g of Object.values(c.paraphrase_right ?? {})) {
      d++; if (g.who_wants_what && g.what_to_do && g.who_in_way) x++;
    }
    return [x, d];
  } },
  { id: 'M2', name: 'Follow, felt (J1 ease 0–10, cards)', fmt: 'num', target: 'G3 ≥ base+1.0, above floor · G2 ≥ base', f: s => { const a = s.j1.flatMap(j => cardsOf(j).map(t => t.ease)); return avgOver(a) } },
  { id: 'M3', name: 'Want the next part (J1 0–10, reports)', fmt: 'num', target: 'G3 ≥ base+1.0, above floor · G2 ≥ base', f: s => avgOver(s.j1.flatMap(j => reportsOf(j).map(t => t.want_next))) },
  { id: 'M3b', name: 'Want to send (J1 0–10, cards)', fmt: 'num', target: '—', f: s => avgOver(s.j1.flatMap(j => cardsOf(j).map(t => t.want_to_send))) },
  { id: 'M4', name: 'Send on card 1 (J1 yes)', fmt: 'pct', target: '≥ base, above floor', f: s => {
    const v = s.j1.map(j => cardsOf(j)[0]?.send).filter((x): x is boolean => typeof x === 'boolean');
    return [v.filter(Boolean).length, v.length];
  } },
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
    `CIs: bootstrap 95% over sagas (2,000 resamples, seeded). n = sagas with data.`, '',
    '## §1.1 table', '',
    '| # | metric | value | 95% CI | n | target |', '|---|---|---|---|---|---|',
    ...rows.map(({ m, e }) => `| ${m.id} | ${m.name}${m.note ? ` (${m.note})` : ''} | ${fmt(e.value, m.fmt)} | ${e.lo === null ? '—' : `${fmt(e.lo, m.fmt)} – ${fmt(e.hi, m.fmt)}`} | ${e.n} | ${m.target} |`),
  ];

  // M10 — pair preference per J3 set: share of pairs the set's own run was kept, and position bias
  out.push('', '## M10 — pair preference (J3)', '');
  if (!j3.length) out.push('— (no J3 run yet: `judge_gpt.ts j3 --run X --vs Y`, plus the Opus seat)');
  else {
    out.push('| set | pairs | kept = this run | followed = this run | kept = shown first | followed = shown first |', '|---|---|---|---|---|---|');
    for (const s of j3) {
      const self = s.dir.split('/')[0]!;
      const n = s.rows.length || 1;
      const share = (f: (r: J) => boolean) => `${(100 * s.rows.filter(f).length / n).toFixed(0)}%`;
      out.push(`| ${s.dir} | ${s.rows.length} | ${share(r => r.keep === self)} | ${share(r => r.follow === self)} | ${share(r => r.keep === r.firstShown)} | ${share(r => r.follow === r.firstShown)} |`);
    }
    out.push('', 'Phase-0 calibration: base B vs regenerated B′ — both should sit near 50%; the distance from 50% is the noise floor M10 must clear, and "shown first" is the position bias.');
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
  fs.writeFileSync(path.join(dest, 'score.json'), JSON.stringify({ label, runs, metrics: rows.map(({ m, e }) => ({ id: m.id, name: m.name, ...e })), j3: j3.map(s => ({ dir: s.dir, n: s.rows.length })), j4: j4.length }, null, 2));
  console.log(out.join('\n'));
  console.log(`\n→ ${path.relative(V3, path.join(dest, 'REPORT.md'))}`);
}

main();
