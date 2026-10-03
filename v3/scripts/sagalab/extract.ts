// SAGA LAB — the extractor (docs/STORYTELLER.md §5.0). Turns each drive into one transcript folder
// per saga, ONE FILE PER TEXT in reading order, for readers who open them one at a time:
//
//   npx tsx scripts/sagalab/extract.ts --run NAME
//
// runs/NAME/sagas/<fixture>/
//   card_1.md, report_1.md, card_2.md, report_2.md, …   one per attempt: the card as `quest <id>`
//                                                      printed it, the report as `reckoning` printed it
//   chain.md       the chain view (`chain <id>`) — today's chronicle
//   order.txt      the files in reading order (what a progressive reader opens, in turn)
//   texts.json     the same texts, parsed (card prose, errand, before, after, outcome) for mech.ts
//   plan.json      today's hidden bible + the chain's engine fields + the fixture's pins
//   calls.jsonl    every AI call the drive made
//   meta.json      fixture, path, attempts, outcomes, completeness problems
//
// What is cut from the print, and why: on a card, the per-place mechanics (slot tests, candidates,
// odds, the abandon line) and the title's bookkeeping parenthetical; on a report, the 「card」 echo
// (it is the previous file, verbatim) and the coin-arithmetic line. Everything else is verbatim.
// The report lines come from the engine's own reckoning record (`lab state`) and are CHECKED
// against the printed `reckoning`, so a text that was not printed can never reach a judge.
//
// Completeness: every attempt has a card and a report with a ⚄ line and prose around it; the saga
// closed; a finale card carries its plans; the forced outcomes follow the fixture's path; no
// report is the resolver's fallback. Exit 1 when any saga fails it.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { labOutcome, type LabFixture } from '../../src/engine/lab.js';
import { renderTags } from '../../src/engine/tags.js';
import type { TranscriptEntry, DriveSummary } from './drive.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');

export interface TextRec {
  file: string; kind: 'card' | 'report'; k: number; questId: string; isFinale: boolean;
  title: string;
  beat?: number | 'finale';                                         // the saga step (card's SAGA line)
  prose?: string; errand?: string; approaches?: string[];          // card
  before?: string; after?: string; outcome?: string; diceLine?: string;   // report
  truth?: string;                                                   // probe finale report: the answer in one plain sentence (R3: for the chronicle, not printed)
  log?: string;                                                     // probe card (R4): the engine's quest log printed above the prose
  ledger?: string;                                                  // probe report (R7): the engine's ledger lines printed under the prose
}
export interface SagaMeta {
  fixture: LabFixture; run: string; chainId: string | null; chainState: string | null;
  attempts: { k: number; questId: string; isFinale: boolean; outcome: string | null }[];
  order: string[]; complete: boolean; problems: string[];
}

const FALLBACK_AFTERS = [
  'The job came home clean; what was promised was taken.',
  'A messy half-win — they brought back part of what they went for.',
  'It comes apart, and they walk home with nothing.',
];

/** a card as the player reads it: `quest <id>`'s print minus the per-place mechanics */
export function cardText(out: string): { md: string; title: string; prose: string; errand: string; approaches: string[]; beat?: number | 'finale' } | null {
  const lines = out.split('\n');
  const head = lines.findIndex(l => l.startsWith('═══ '));
  if (head < 0) return null;
  const title = lines[head]!.replace(/^═══ (.*?) ═══.*$/, '$1');
  const keep: string[] = [`═══ ${title} ═══`];
  const MARK = /^(ON THIS MATTER|ERRAND:|REWARD:|SAGA:|APPROACHES)/;
  const prose: string[] = [];
  let i = head + 1;
  for (; i < lines.length && !MARK.test(lines[i]!); i++) {
    if (/^\s+slot \d+:|^ODDS:|^\(abandon:/.test(lines[i]!)) break;
    prose.push(lines[i]!);
  }
  keep.push(...prose);
  let errand = '';
  const approaches: string[] = [];
  for (; i < lines.length; i++) {
    const l = lines[i]!;
    if (/^\s+slot \d+:|^ODDS:|^\(abandon:/.test(l)) break;
    if (/^\s{6}tests /.test(l)) continue;   // an approach's place mechanics
    if (l.startsWith('ERRAND:')) errand = l.slice(7).trim();
    if (/^[▶ ] \[g\d+\]/.test(l)) approaches.push(l.slice(2));
    keep.push(l);
  }
  const sagaLine = keep.find(l => l.startsWith('SAGA:')) ?? '';
  const beat = /· the finale ·/.test(sagaLine) ? 'finale' as const : Number(sagaLine.match(/· beat (\d+) of/)?.[1]) || undefined;
  return { md: keep.join('\n') + '\n', title, prose: prose.join('\n').trim(), errand, approaches, beat };
}

/** a report block (engine lines) → its file text and parts */
export function reportText(block: string[], banner: string): { md: string; before: string; after: string; diceLine: string } {
  const body = block.filter(l => !/^「[\s\S]*」$/.test(l));   // the card echo: the file before this one
  const dice = body.findIndex(l => l.startsWith('⚄ '));
  const head = body[0]?.startsWith('— ') ? 1 : 0;
  const before = dice > head ? body.slice(head, dice).join('\n').trim() : '';
  let after = '';
  const shown: string[] = [];
  body.forEach((l, i) => {
    if (i > dice && dice >= 0 && /^ {3}\S.* = \d+/.test(l)) return;   // coin arithmetic
    shown.push(l);
  });
  if (dice >= 0) {
    for (const l of body.slice(dice + 1)) {
      if (/^ {2,}\S/.test(l) || l.startsWith('▸ ')) continue;   // coin terms, turn caption, speech
      after = l.trim();
      break;
    }
  }
  return { md: [banner, ...shown].join('\n') + '\n', before, after, diceLine: dice >= 0 ? body[dice]! : '' };
}

function readJsonl<T>(p: string): T[] {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as T);
}

export function extractSaga(runDir: string, fxId: string): SagaMeta {
  const d = path.join(runDir, 'drive', fxId);
  const sum = JSON.parse(fs.readFileSync(path.join(d, 'drive.json'), 'utf8')) as DriveSummary;
  const fx = sum.fixture;
  const tr = readJsonl<TranscriptEntry>(path.join(d, 'transcript.jsonl'));
  const out = path.join(runDir, 'sagas', fx.id);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const problems: string[] = [...sum.problems];
  const texts: TextRec[] = [];
  const order: string[] = [];
  const attempts: SagaMeta['attempts'] = [];
  const chainId = sum.chainId;

  // walk the transcript: each first `quest` view is a card; each `reckoning` the report of the
  // quest that marched, cut by the reckoning lines the NEXT `lab state` carries
  let k = 0;
  const cardOf = new Map<string, number>();
  for (let i = 0; i < tr.length; i++) {
    const e = tr[i]!;
    if (e.tag === 'card' && e.questId && !cardOf.has(e.questId)) {
      const c = cardText(e.out);
      if (!c) { problems.push(`card ${e.questId}: no card in the print`); continue }
      k++;
      cardOf.set(e.questId, k);
      const file = `card_${k}.md`;
      fs.writeFileSync(path.join(out, file), c.md);
      order.push(file);
      const isFinale = c.beat === 'finale' || c.approaches.length > 0;
      texts.push({ file, kind: 'card', k, questId: e.questId, isFinale, title: c.title, beat: c.beat, prose: c.prose, errand: c.errand, approaches: c.approaches });
      attempts.push({ k, questId: e.questId, isFinale, outcome: null });
      if (c.prose.split(/\s+/).filter(Boolean).length < 5) problems.push(`${file}: the card has no prose`);
      if (isFinale && c.approaches.length < 2) problems.push(`${file}: a finale with fewer than two plans`);
    }
    if (e.tag === 'reckoning') {
      const st = tr.slice(i + 1).find(x => x.tag === 'state');
      const line = st?.out.split('\n').find(l => l.startsWith('{"lab":1'));
      const rk = line ? (JSON.parse(line) as { reckoning: { cycle: number; meta: { questId: string; title: string; chainId: string | null; outcome: string; isFinale: boolean; lines: string[] }[] } | null }).reckoning : null;
      const printedCycle = Number(e.out.match(/THE RECKONING · CYCLE (\d+)/)?.[1] ?? NaN);
      if (!rk || rk.cycle !== printedCycle) { problems.push(`reckoning c${printedCycle}: no matching engine record`); continue }
      for (const m of rk.meta.filter(x => x.chainId === chainId)) {
        const ck = cardOf.get(m.questId);
        if (!ck) { problems.push(`report for ${m.questId} with no card before it`); continue }
        const banner = e.out.split('\n').find(l => l.startsWith('━━ ') && l.includes(m.title)) ?? `━━ ${m.outcome.toUpperCase()} ━━ ${m.title}`;
        // fidelity: every line a judge will read was printed by the CLI
        const missing = m.lines.filter(l => l && !e.out.includes(l));
        if (missing.length) problems.push(`report ${m.questId}: ${missing.length} line(s) not in the printed reckoning`);
        const r = reportText(m.lines, banner);
        const file = `report_${ck}.md`;
        fs.writeFileSync(path.join(out, file), r.md);
        order.push(file);
        texts.push({ file, kind: 'report', k: ck, questId: m.questId, isFinale: m.isFinale, title: m.title, before: r.before, after: r.after, outcome: m.outcome, diceLine: r.diceLine });
        const a = attempts.find(x => x.questId === m.questId);
        if (a) a.outcome = m.outcome;
        if (!r.diceLine) problems.push(`${file}: no ⚄ line`);
        if (!r.before || !r.after) problems.push(`${file}: missing ${!r.before ? 'before' : 'after'} prose`);
        if (FALLBACK_AFTERS.includes(r.after)) problems.push(`${file}: the resolver's fallback text (a hard failure)`);
      }
    }
  }
  const chainOut = tr.find(x => x.tag === 'chain')?.out ?? '';
  const chainsOut = tr.find(x => x.tag === 'chains')?.out ?? '';
  const chainRow = chainsOut.split('\n').find(l => chainId && l.startsWith(chainId)) ?? '';
  if (chainOut.startsWith('═══')) {
    fs.writeFileSync(path.join(out, 'chain.md'), chainOut + (chainRow ? `\n\n${chainRow}` : '') + '\n');
    order.push('chain.md');
  } else problems.push('no chain view');

  // today's plan: the hidden bible, the chain's engine fields, the focal as the engine rolled them
  const savePath = path.join(d, 'save.json');
  if (fs.existsSync(savePath)) {
    const save = JSON.parse(fs.readFileSync(savePath, 'utf8')) as { chains: { id: string; focalId: string; lab?: { log: { job: number; finale: boolean; outcome: string }[] } }[]; cards: { id: string; name: string; tags: never }[] };
    const chain = save.chains.find(c => c.id === chainId);
    const focal = chain ? save.cards.find(c => c.id === chain.focalId) : undefined;
    fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify({
      fixture: fx, chain: chain ?? null,
      focal: focal ? { id: focal.id, name: focal.name, tags: renderTags(focal.tags) } : null,
    }, null, 2));
    // the forced outcomes: what the lab log holds, what the reports say, and what the path's rule wants
    const log = chain?.lab?.log ?? [];
    const reported = attempts.filter(a => a.outcome).map(a => a.outcome);
    if (log.length !== reported.length || log.some((x, i) => x.outcome !== reported[i]))
      problems.push(`outcomes: the lab log (${log.map(x => x.outcome[0]).join('')}) and the reports (${reported.map(x => x![0]).join('')}) disagree`);
    let attempt = 0;
    const tries = new Map<number, number>();
    for (const x of log) {
      const want = x.finale ? labOutcome(fx.path, { isFinale: true, job: x.job, tryOnJob: 1, attempt: 0 })
        : labOutcome(fx.path, { isFinale: false, job: x.job, tryOnJob: (tries.get(x.job) ?? 0) + 1, attempt: ++attempt });
      if (!x.finale) tries.set(x.job, (tries.get(x.job) ?? 0) + 1);
      if (want !== x.outcome) problems.push(`outcome ${x.outcome} at job ${x.job} breaks the ${fx.path} rule (${want})`);
    }
  } else problems.push('no save — no plan.json');
  const calls = path.join(d, 'calls.jsonl');
  if (fs.existsSync(calls)) fs.copyFileSync(calls, path.join(out, 'calls.jsonl'));
  else problems.push('no calls.jsonl');

  const cards = texts.filter(t => t.kind === 'card').length, reports = texts.filter(t => t.kind === 'report').length;
  if (!sum.closed) problems.push('the saga did not close');
  if (cards !== reports) problems.push(`${cards} cards but ${reports} reports`);
  if (!texts.some(t => t.kind === 'card' && t.isFinale)) problems.push('no finale card');

  const meta: SagaMeta = { fixture: fx, run: sum.run, chainId, chainState: sum.chainState, attempts, order, complete: problems.length === 0, problems };
  fs.writeFileSync(path.join(out, 'order.txt'), order.join('\n') + '\n');
  fs.writeFileSync(path.join(out, 'texts.json'), JSON.stringify(texts, null, 2));
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2));
  return meta;
}

function main() {
  const i = process.argv.indexOf('--run');
  const run = i >= 0 ? process.argv[i + 1] : undefined;
  if (!run) { console.log('usage: npx tsx scripts/sagalab/extract.ts --run NAME'); process.exit(2) }
  const runDir = path.join(LAB, 'runs', run);
  const ids = fs.readdirSync(path.join(runDir, 'drive')).filter(f => fs.existsSync(path.join(runDir, 'drive', f, 'drive.json'))).sort();
  const metas = ids.map(id => extractSaga(runDir, id));
  const rows = metas.map(m => `| ${m.fixture.id} | ${m.fixture.path} | N${m.fixture.N} | ${m.fixture.personal ? 'personal' : m.fixture.kind} | ${m.chainState ?? '—'} | ${m.attempts.map(a => (a.outcome ?? '?')[0]!.toUpperCase()).join('')} | ${m.order.length} | ${m.complete ? '✓' : `✗ ${m.problems.join('; ')}`} |`);
  fs.writeFileSync(path.join(runDir, 'sagas', 'INDEX.md'), [
    `# ${run} — sagas`, '', '| saga | path | N | kind | end | outcomes | files | complete |', '|---|---|---|---|---|---|---|---|', ...rows, '',
  ].join('\n'));
  const bad = metas.filter(m => !m.complete);
  for (const m of metas) console.log(`${m.fixture.id}: ${m.complete ? 'complete' : 'INCOMPLETE'} — ${m.attempts.length} attempts (${m.attempts.map(a => (a.outcome ?? '?')[0]!.toUpperCase()).join('')}), ${m.order.length} files${m.problems.length ? `\n  ${m.problems.join('\n  ')}` : ''}`);
  console.log(`\n${metas.length - bad.length}/${metas.length} complete → ${path.relative(V3, path.join(runDir, 'sagas'))}`);
  process.exit(bad.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
