// SAGA LAB — the gpt-5 judge seats (docs/STORYTELLER.md §5.0, §D.3). The rubric files in judge/ are
// the system prompt, verbatim; the Opus seats get the very same files.
//
//   npx tsx scripts/sagalab/judge_gpt.ts j1 --run NAME [--sagas A01,A02]      J1 cold player, PROGRESSIVE:
//                                                                            one text per API turn, the
//                                                                            conversation carried turn to turn
//   npx tsx scripts/sagalab/judge_gpt.ts j3 --run NAME --vs OTHER [--sagas …]  J3 pair reader, same fixture
//                                                                            in both runs, EVERY pair read
//                                                                            in both orders (score.ts counts
//                                                                            a pick only when it holds in both)
//   npx tsx scripts/sagalab/judge_gpt.ts j4 --runs A_RUN,B_RUN [--size 10]    J4 series reader: the sagas of
//                                                                            the runs in order, in series of 10
// Common: [--model gpt-5] [--effort medium] [--concurrency 4] [--force] [--dry]
//   --dry prints the first prompt exactly as it would be sent and calls nothing.
//
// Writes (JSON, one file per unit):
//   j1 → runs/NAME/judge/j1_gpt5/<saga>.json   {seat, model, saga, texts:[…per text…], end:{…}, usage}
//   j3 → runs/NAME/judge/j3_gpt5/vs_OTHER/<saga>.json   {seat, saga, reads:[{x, y, firstShown, answer, keep, follow}
//        ×2 orders], keep, follow (the run picked in BOTH orders, else null), usage}
// A run folder holds its sagas under sagas/ (drive runs) or directly (probe runs, e.g. --run probe1/S_labels_pitch).
//   j4 → runs/<first run>/judge/j4_gpt5/<series>.json   {seat, series, sagas:[{label, run, saga}], answer, usage}

import OpenAI from 'openai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKey } from '../../src/ai/openai.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');
process.chdir(V3);   // loadKey looks beside the package

const argv = process.argv.slice(2);
const seatArg = argv[0];
const opt = (name: string): string | undefined => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined };
const flag = (name: string) => argv.includes(`--${name}`);
const MODEL = opt('model') ?? 'gpt-5';
const EFFORT = (opt('effort') ?? 'medium') as 'low' | 'medium' | 'high';
const SEAT = MODEL.replace(/[^a-z0-9]/gi, '').replace(/^gpt/, 'gpt');   // gpt-5 → gpt5
const DRY = flag('dry');
const FORCE = flag('force');

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };
interface Usage { calls: number; inputTokens: number; cachedTokens: number; outputTokens: number; costUsd: number; ms: number }
const newUsage = (): Usage => ({ calls: 0, inputTokens: 0, cachedTokens: 0, outputTokens: 0, costUsd: 0, ms: 0 });
const total = newUsage();

// gpt-5 list pricing per 1M tokens (cached input at 10%); other models: same shape, override if needed
const PRICE = { in: Number(process.env.JUDGE_PRICE_IN ?? 1.25), out: Number(process.env.JUDGE_PRICE_OUT ?? 10) };

let client: OpenAI | null = null;
async function chat(messages: Msg[], u: Usage): Promise<{ json: Record<string, unknown>; raw: string }> {
  client ??= new OpenAI({ apiKey: loadKey() });
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const t0 = Date.now();
    try {
      const res = await client.chat.completions.create({
        model: MODEL, messages, response_format: { type: 'json_object' },
        ...(/^gpt-5|^o\d/.test(MODEL) ? { reasoning_effort: EFFORT } : {}),
      } as never) as OpenAI.Chat.Completions.ChatCompletion;
      const inTok = res.usage?.prompt_tokens ?? 0, outTok = res.usage?.completion_tokens ?? 0;
      const cached = (res.usage as { prompt_tokens_details?: { cached_tokens?: number } } | undefined)?.prompt_tokens_details?.cached_tokens ?? 0;
      const cost = ((inTok - cached) * PRICE.in + cached * PRICE.in * 0.1 + outTok * PRICE.out) / 1e6;
      for (const x of [u, total]) { x.calls++; x.inputTokens += inTok; x.cachedTokens += cached; x.outputTokens += outTok; x.costUsd += cost; x.ms += Date.now() - t0 }
      const raw = res.choices[0]?.message?.content ?? '';
      return { json: JSON.parse(raw) as Record<string, unknown>, raw };
    } catch (e) { lastErr = e }
  }
  throw lastErr;
}

const rubric = (name: string) => fs.readFileSync(path.join(LAB, 'judge', `${name}.md`), 'utf8');
/** where a run keeps its saga folders: sagas/ for drive runs, the run folder itself for probe runs */
const sagaRoot = (runDir: string) => fs.existsSync(path.join(runDir, 'sagas')) ? path.join(runDir, 'sagas') : runDir;
const readingOrder = (sd: string) => fs.readFileSync(path.join(sd, 'order.txt'), 'utf8').split('\n').map(s => s.trim()).filter(f => /^(card|report)_\d+\.md$/.test(f));
const sagasOf = (runDir: string) => fs.readdirSync(sagaRoot(runDir)).filter(f => fs.existsSync(path.join(sagaRoot(runDir), f, 'order.txt'))).sort();
const pick = (all: string[]) => { const s = opt('sagas')?.split(','); return s ? all.filter(x => s.includes(x)) : all };
const textBlock = (sd: string, f: string) => `${f}\n\n${fs.readFileSync(path.join(sd, f), 'utf8').trim()}`;

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const q = [...items];
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => { for (let x = q.shift(); x !== undefined; x = q.shift()) await fn(x) }));
}

/** J1 — progressive: the rubric as system, then one text per user turn, answered before the next */
async function j1(run: string) {
  const runDir = path.join(LAB, 'runs', run);
  const outDir = path.join(runDir, 'judge', `j1_${SEAT}`);
  fs.mkdirSync(outDir, { recursive: true });
  await pool(pick(sagasOf(runDir)), Number(opt('concurrency') ?? 4), async saga => {
    const out = path.join(outDir, `${saga}.json`);
    if (fs.existsSync(out) && !FORCE) { console.log(`[j1 ${saga}] exists — skipped (--force to redo)`); return }
    const sd = path.join(sagaRoot(runDir), saga);
    const files = readingOrder(sd);
    const messages: Msg[] = [{ role: 'system', content: rubric('j1_player') }];
    if (DRY) { console.log(`--- system ---\n${messages[0]!.content}\n--- user (turn 1 of ${files.length + 1}) ---\n${textBlock(sd, files[0]!)}`); process.exit(0) }
    const u = newUsage();
    const texts: Record<string, unknown>[] = [];
    for (const f of files) {
      messages.push({ role: 'user', content: textBlock(sd, f) });
      const r = await chat(messages, u);
      messages.push({ role: 'assistant', content: r.raw });
      texts.push({ ...r.json, text: f, kind: f.startsWith('card') ? 'card' : 'report' });
    }
    messages.push({ role: 'user', content: 'END' });
    const end = await chat(messages, u);
    fs.writeFileSync(out, JSON.stringify({ seat: `j1_${SEAT}`, model: MODEL, effort: EFFORT, saga, texts, end: { ...end.json, kind: 'end' }, usage: u }, null, 2));
    console.log(`[j1 ${saga}] ${files.length} texts · $${u.costUsd.toFixed(3)} · ${(u.ms / 1000).toFixed(0)}s`);
  });
}

/** J3 — the same fixture from two runs, blind, read in BOTH orders (Phase-0 calibration: position bias
 *  ran in opposite directions per family, so a single order measures the seat, not the story) */
async function j3(run: string, vs: string) {
  const aDir = path.join(LAB, 'runs', run), bDir = path.join(LAB, 'runs', vs);
  const both = pick(sagasOf(aDir).filter(s => sagasOf(bDir).includes(s)));
  const outDir = path.join(aDir, 'judge', `j3_${SEAT}`, `vs_${vs.replace(/\//g, '_')}`);
  fs.mkdirSync(outDir, { recursive: true });
  const whole = (sd: string) => readingOrder(sd).map(f => `--- ${f} ---\n${fs.readFileSync(path.join(sd, f), 'utf8').trim()}`).join('\n\n');
  const dirOf = (r: string, s: string) => path.join(sagaRoot(path.join(LAB, 'runs', r)), s);
  await pool(both, Number(opt('concurrency') ?? 4), async s => {
    const out = path.join(outDir, `${s}.json`);
    if (fs.existsSync(out) && !FORCE) { console.log(`[j3 ${s}] exists — skipped`); return }
    const u = newUsage();
    const reads: Record<string, unknown>[] = [];
    for (const [xRun, yRun] of [[run, vs], [vs, run]] as const) {
      const user = `SAGA X\n\n${whole(dirOf(xRun, s))}\n\n\nSAGA Y\n\n${whole(dirOf(yRun, s))}`;
      const messages: Msg[] = [{ role: 'system', content: rubric('j3_pair') }, { role: 'user', content: user }];
      if (DRY) { console.log(`--- system ---\n${messages[0]!.content}\n--- user ---\n${user}`); process.exit(0) }
      const r = await chat(messages, u);   // a fresh conversation per order: neither read sees the other
      const runOf = (xy: unknown) => xy === 'X' ? xRun : xy === 'Y' ? yRun : null;
      reads.push({ x: xRun, y: yRun, firstShown: xRun, answer: r.json, keep: runOf(r.json.rather_keep_playing), follow: runOf(r.json.follow_more_easily) });
    }
    const held = (k: 'keep' | 'follow') => reads.every(r => r[k] && r[k] === reads[0]![k]) ? reads[0]![k] : null;
    fs.writeFileSync(out, JSON.stringify({ seat: `j3_${SEAT}`, model: MODEL, saga: s, self: run, other: vs, reads, keep: held('keep'), follow: held('follow'), usage: u }, null, 2));
    console.log(`[j3 ${s}] keep ${held('keep') ?? 'flips with order'} · follow ${held('follow') ?? 'flips with order'} · $${u.costUsd.toFixed(3)}`);
  });
}

/** J4 — ten sagas of one arm in a row: card 1, the finale card, the chronicle */
async function j4(runs: string[]) {
  const size = Number(opt('size') ?? 10);
  const all = runs.flatMap(run => pick(sagasOf(path.join(LAB, 'runs', run))).map(saga => ({ run, saga })));
  const series: { run: string; saga: string }[][] = [];
  for (let i = 0; i + size <= all.length; i += size) series.push(all.slice(i, i + size));
  if (!series.length) { console.log(`need at least ${size} sagas (have ${all.length})`); process.exit(2) }
  if (all.length % size) console.log(`note: ${all.length % size} saga(s) past the last full series of ${size} are left out`);
  const outDir = path.join(LAB, 'runs', runs[0]!, 'judge', `j4_${SEAT}`);
  fs.mkdirSync(outDir, { recursive: true });
  await pool(series.map((s, i) => ({ s, name: `series_${i + 1}_of_${runs.join('+').replace(/\//g, '_')}` })), Number(opt('concurrency') ?? 2), async ({ s, name }) => {
    const out = path.join(outDir, `${name}.json`);
    if (fs.existsSync(out) && !FORCE) { console.log(`[j4 ${name}] exists — skipped`); return }
    const user = s.map(({ run, saga }, i) => {
      const sd = path.join(sagaRoot(path.join(LAB, 'runs', run)), saga);
      const cards = readingOrder(sd).filter(f => f.startsWith('card_'));
      const read = (f: string) => fs.existsSync(path.join(sd, f)) ? fs.readFileSync(path.join(sd, f), 'utf8').trim() : '(missing)';
      return `S${i + 1}\n\n--- card 1 ---\n${read(cards[0]!)}\n\n--- the finale card ---\n${read(cards[cards.length - 1]!)}\n\n--- the chronicle ---\n${read('chain.md')}`;
    }).join('\n\n\n');
    const messages: Msg[] = [{ role: 'system', content: rubric('j4_series') }, { role: 'user', content: user }];
    if (DRY) { console.log(`--- system ---\n${messages[0]!.content}\n--- user ---\n${user}`); process.exit(0) }
    const u = newUsage();
    const r = await chat(messages, u);
    fs.writeFileSync(out, JSON.stringify({ seat: `j4_${SEAT}`, model: MODEL, series: name, sagas: s.map((x, i) => ({ label: `S${i + 1}`, ...x })), answer: r.json, usage: u }, null, 2));
    console.log(`[j4 ${name}] repetitive ${r.json.repetitive} · $${u.costUsd.toFixed(3)}`);
  });
}

async function main() {
  const run = opt('run');
  if (seatArg === 'j1' && run) await j1(run);
  else if (seatArg === 'j3' && run && opt('vs')) await j3(run, opt('vs')!);
  else if (seatArg === 'j4' && (opt('runs') || run)) await j4((opt('runs') ?? run!).split(',').map(s => s.trim()).filter(Boolean));
  else {
    console.log('usage: judge_gpt.ts j1 --run NAME | j3 --run NAME --vs OTHER | j4 --runs A,B  [--sagas …] [--model gpt-5] [--effort medium] [--concurrency N] [--force] [--dry]');
    process.exit(2);
  }
  console.log(`total: ${total.calls} calls · ${total.inputTokens} in (${total.cachedTokens} cached) · ${total.outputTokens} out · $${total.costUsd.toFixed(3)}`);
}

main().catch(e => { console.error(e); process.exit(1) });
