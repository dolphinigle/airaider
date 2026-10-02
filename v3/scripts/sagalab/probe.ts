// SAGA LAB — the Phase-1 prompt probe (docs/STORYTELLER.md §5.2). Plays the v4 storyteller's calls on
// REAL engine inputs, with NO game wiring: a MockProvider world per fixture (v4lab.ts buildWorld), a
// dealt theme seed (src/engine/themes.ts), then the real writer — gpt-5-mini (or Claude, --writer), plan at medium, card and
// report at low — for plan → card 1 → report → card → … → the finale card with its plans → the finale
// report, on scripted outcomes (the §5.0 path rules; the ⚄ line agrees).
//
//   npx tsx scripts/sagalab/probe.ts [--arm L|S|H|all] [--cast full|lean|all] [--names labels|named|all]
//        [--fixtures F1,F2|all] [--draws 3 | --draw 1,3] [--mock] [--render] [--avoid] [--direction TEXT]
//        [--run probe2] [--concurrency 4] [--force] [--writer openai|sonnet|haiku] [--cli-pool 6]
//
//   --writer   who writes (default openai = gpt-5-mini). sonnet / haiku: each call runs the headless
//              Claude CLI (subscription auth; modelcmp/replay.py's flags), system prompt from a file, the
//              payload on stdin, no tools / settings / MCP / auto-memory, cwd an empty dir under
//              runs/<run>/_claude/. Reasoning: sonnet --effort medium (plan) / low (card, report); haiku
//              ignores --effort, so MAX_THINKING_TOKENS 4000 / 1024. Up to 2 retries on a failed or
//              non-JSON reply; at most --cli-pool CLI processes at once. Arm folders get a _<writer>
//              suffix, e.g. runs/probe3/L_lean_sonnet/F6_3/.
//
//   --cast     R1 (C5): `full` = Phase 1's casting and stake; `lean` = the one who asks (no trade) + the
//              person the ending decides (+ the personal soldier / a returning face), no stake
//   --mock     the template floor (§4.4): the mock writer in place of the model, no key needed
//   --render   clear runs/<run>/rendered/, then dump every prompt variant this pass rendered, each with
//              the real payload it was sent (for the context-free verifier); INDEX.md lists any of
//              the variants the verifier needs that this pass did not reach
//   --avoid    deal each plan the title and question of the arm's previous five sagas (runs that arm in order)
//   --slots F1_4,F3_5   run exactly these fixture_draw sagas (in place of --fixtures × --draws)
//   --as NAME  write the arm to runs/<run>/NAME/ (one arm only), e.g. a clean floor folder
//   --series   plan + card 1 only (the §D.3 repetition series), into runs/<run>/series_<arm>/; each
//              series draw gets its own cast and places (the main draws keep the fixture's)
//
// Writes each saga in the folder format the judges read (extract.ts), one folder per saga:
//   runs/<run>/<arm>/<fixture>_<draw>/   e.g. runs/probe2/L_lean/F6_3/ (mock runs: runs/<run>/mock-<arm>/…)
//     card_k.md · report_k.md · chain.md (with So far) · order.txt · texts.json · plan.json ·
//     calls.jsonl · meta.json
// and runs/<run>/<arm>/INDEX.md. Judge an arm with e.g. `judge_gpt.ts j1 --run probe2/L_lean`.
//
// Draws: 1–2 play clean (a personal fixture: the personal path), draw 3 a failure and a re-pose
// (bumpy; lastchance when N = 2). Fixture, draw and path fix the soldiers, dice and wounds, so every
// arm plays the same game; only the writing differs. The theme dealt to a fixture's draw is the same
// in every arm, and the same as probe1's (the dealer sequence is unchanged), so probe2 pairs with probe1
// slot for slot. Card 1 is always the separate `first` card call (R1, C3).

import OpenAI from 'openai';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import { loadKey } from '../../src/ai/openai.js';
import { render, wordCount, type TemplateName } from '../../src/ai/prompts/render.js';
import { Rng } from '../../src/engine/rng.js';
import { dealSeed, type DealtSeed } from '../../src/engine/themes.js';
import { sampleGravity } from '../../src/ai/keywords.js';
import { renderTags } from '../../src/engine/tags.js';
import type { LabFixture } from '../../src/engine/lab.js';
import type { CallLogLine } from '../../src/ai/calllog.js';
import type { TextRec } from './extract.js';
import {
  type Arm, type Structure, type NamesArm, type CastArm, type ProbeFixture, type World, type Draw, type PlanCtx,
  type SagaPlan, type Knowing, type Hurt, type SagaState, armKey, newKnowing, newState, bank, buildWorld, leanWorld, makeDraw, planPayload, validatePlan, planLint, mockPlan,
  mockCard, mockReport, firstCardPayload, laterCardPayload, reportPayload, noteDelivered, onThisMatter, outcomeFor,
  pickParty, rollDice, rollHurt, fateSentence, choiceTarget, buttonLine, helped, hashStr, zCardOut, zReportOut, zPlanOut,
} from './v4lab.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');
process.chdir(V3);   // loadKey looks beside the package

const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined };
const flag = (name: string) => argv.includes(`--${name}`);
const MOCK = flag('mock'), RENDER = flag('render'), AVOID = flag('avoid'), FORCE = flag('force'), SERIES = flag('series');
const SLOTS = opt('slots')?.split(',').map(s => s.trim()).filter(Boolean);
const RUN = opt('run') ?? 'probe2';
const DIRECTION = opt('direction');
const MODEL = 'gpt-5-mini';
type Writer = 'openai' | 'sonnet' | 'haiku';
const WRITER = (opt('writer') ?? 'openai') as Writer;
if (!['openai', 'sonnet', 'haiku'].includes(WRITER)) { console.error(`--writer: ${WRITER} is not one of openai/sonnet/haiku`); process.exit(2) }
const CLAUDE = !MOCK && WRITER !== 'openai';
const CLI_POOL = Math.max(1, Number(opt('cli-pool') ?? 6));
const listOf = <T extends string>(name: string, all: readonly T[], dflt: T): T[] => {
  const v = opt(name);
  if (!v) return [dflt];
  if (v === 'all') return [...all];
  const xs = v.split(',').map(s => s.trim()) as T[];
  for (const x of xs) if (!all.includes(x)) { console.error(`--${name}: ${x} is not one of ${all.join('/')}`); process.exit(2) }
  return xs;
};
if (opt('card1')) { console.error('--card1 is gone: card 1 is always the `first` card call (R1, C3)'); process.exit(2) }
const ARMS: Arm[] = listOf<Structure>('arm', ['S', 'L', 'H'], 'L').flatMap(structure =>
  listOf<CastArm>('cast', ['full', 'lean'], 'full').flatMap(cast =>
    listOf<NamesArm>('names', ['labels', 'named'], 'labels').map(names => ({ structure, names, cast }))));
const DRAWS: number[] = opt('draw') ? opt('draw')!.split(',').map(Number) : Array.from({ length: Number(opt('draws') ?? 3) }, (_, i) => i + 1);
const CONCURRENCY = AVOID ? 1 : Number(opt('concurrency') ?? (MOCK ? 8 : CLAUDE ? CLI_POOL : 4));

// ─── fixtures, worlds, seeds ────────────────────────────────────────────────────────────────────

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8')) as T;
const ALL_FX: ProbeFixture[] = fs.readdirSync(path.join(LAB, 'fixtures/P')).filter(f => /^F\d+\.json$/.test(f))
  .sort((a, b) => Number(a.slice(1, -5)) - Number(b.slice(1, -5))).map(f => readJson<ProbeFixture>(path.join(LAB, 'fixtures/P', f)));
const baseOf = (id: string): LabFixture => readJson<LabFixture>(path.join(LAB, 'fixtures', id[0]!, `${id}.json`));
const wantFx = opt('fixtures') && opt('fixtures') !== 'all' ? opt('fixtures')!.split(',') : ALL_FX.map(f => f.id);
// every world, in a fixed order, whatever is selected: card ids come from a process-wide counter
const WORLDS = new Map(ALL_FX.map(fx => [fx.id, buildWorld(fx, baseOf(fx.base))]));
// the sagas this pass plays, the same for every arm
const PLAY: { fx: ProbeFixture; d: number }[] = SLOTS
  ? SLOTS.map(sl => { const [f, d] = sl.split('_'); const fx = ALL_FX.find(x => x.id === f); if (!fx || !(Number(d) >= 1)) { console.error(`bad slot in --slots: ${sl}`); process.exit(2) } return { fx, d: Number(d) } })
  : DRAWS.flatMap(d => ALL_FX.filter(f => wantFx.includes(f.id)).map(fx => ({ fx, d })));
// the repetition series: each draw meets its own people and places (a frozen cast per fixture made J4
// read triplets with the same patron, foe and town). Built after WORLDS, in slot order, so the main
// worlds' card ids never move
const SERIES_WORLDS = new Map<string, World>();
if (SERIES) for (const { fx, d } of [...PLAY].sort((a, b) => `${a.fx.id}_${a.d}`.localeCompare(`${b.fx.id}_${b.d}`, undefined, { numeric: true })))
  if (!SERIES_WORLDS.has(`${fx.id}_${d}`)) SERIES_WORLDS.set(`${fx.id}_${d}`, buildWorld(fx, baseOf(fx.base), d));
// the seeds: one dealer sequence over draw × fixture, the same in every arm and every subset
const SEEDS = new Map<string, DealtSeed>();
{
  const rng = new Rng(hashStr('probe1-seeds'));   // probe1's dealer sequence: probe2 pairs with it slot for slot
  const recent: string[] = [];
  for (let d = 1; d <= Math.max(...DRAWS, 3, ...(SLOTS ?? []).map(s => Number(s.split('_')[1]))); d++) for (const fx of ALL_FX) {
    if (fx.seed || fx.personal) continue;
    const s = dealSeed(rng, recent);
    recent.push(s.id);
    SEEDS.set(`${fx.id}_${d}`, s);
  }
}

// ─── the writer: the model, or the mock floor; every call logged whole ─────────────────────────

interface CallRec extends Omit<CallLogLine, 'provider'> {
  provider: CallLogLine['provider'] | 'claude'; template: TemplateName; flags: string[]; saga: string;
  /** the Claude CLI: thinking tokens (inside outputTokens), and the whole reply when `output` is only its JSON */
  thinkingTokens?: number; raw?: string;
}
const RENDERED = new Map<string, CallRec>();
let client: OpenAI | null = null;
const PRICE = { in: 0.25, cached: 0.025, out: 2 };   // gpt-5-mini per 1M tokens

// ─── the Claude writer: the headless CLI, one process per call (modelcmp/replay.py's run()) ─────

interface CliResult { text: string; json: unknown; ms: number; inTok: number; outTok: number; cached: number; think?: number; cost: number; model?: string; error?: string }
let cliDirs: { cwd: string; sp: string; nomcp: string } | null = null;
let spN = 0, cliActive = 0;
const cliWait: (() => void)[] = [];

/** the CLI's scratch: an EMPTY cwd (nothing to discover), the system-prompt files and the no-MCP config beside it */
function cliSetup() {
  if (cliDirs) return cliDirs;
  const base = path.join(LAB, 'runs', RUN, '_claude');
  const cwd = path.join(base, 'cwd'), sp = path.join(base, 'sp'), nomcp = path.join(base, 'nomcp.json');
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(sp, { recursive: true });
  if (fs.readdirSync(cwd).length) { console.error(`${cwd} must be empty`); process.exit(2) }
  fs.writeFileSync(nomcp, '{"mcpServers":{}}');
  return cliDirs = { cwd, sp, nomcp };
}

/** at most CLI_POOL processes at once; a freed slot passes straight to the next waiter */
async function cliSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (cliActive < CLI_POOL) cliActive++;
  else await new Promise<void>(r => cliWait.push(r));
  try { return await fn() } finally { const next = cliWait.shift(); if (next) next(); else cliActive-- }
}

/** JSON.parse, or the same with raw control characters inside strings escaped (Python's strict=False) */
function parseLenient(s: string): unknown {
  try { return JSON.parse(s) } catch { /* lenient below */ }
  let o = '', inStr = false, esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      else if (ch.charCodeAt(0) < 0x20) { o += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t' : `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`; continue }
    } else if (ch === '"') inStr = true;
    o += ch;
  }
  try { return JSON.parse(o) } catch { return undefined }
}

/** the reply's JSON object, tolerantly: whatever wraps it (code fences, prose) is ignored, and when the
 *  reply holds several objects (a reply that corrects itself) the LAST one that parses is its final word;
 *  first `{` to last `}` is the fallback */
function extractJson(text: string): unknown {
  const spans: string[] = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue }
    if (ch === '"') { if (depth > 0) inStr = true }
    else if (ch === '{') { if (depth++ === 0) start = i }
    else if (ch === '}' && depth > 0 && --depth === 0) spans.push(text.slice(start, i + 1));
  }
  const i = text.indexOf('{'), j = text.lastIndexOf('}');
  for (const s of [...spans.reverse(), ...(i >= 0 && j > i ? [text.slice(i, j + 1)] : [])]) {
    const v = parseLenient(s);
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  }
  return null;
}

function runCli(system: string, user: string, effort: 'low' | 'medium'): Promise<CliResult> {
  return cliSlot(() => new Promise<CliResult>(resolve => {
    const d = cliSetup();
    const spFile = path.join(d.sp, `${process.pid}_${++spN}.txt`);
    fs.writeFileSync(spFile, system);
    const args = ['-p', '--model', WRITER, '--system-prompt-file', spFile, '--tools', '', '--setting-sources', '',
      '--strict-mcp-config', '--mcp-config', d.nomcp, '--exclude-dynamic-system-prompt-sections', '--output-format', 'json', '--effort', effort];
    // a clean env: nothing inherited from a parent Claude session (its effort, session ids), no auto-memory
    // (it rides in by the repo, not the cwd); haiku ignores --effort, so its thinking is capped instead
    const env: NodeJS.ProcessEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^CLAUDE/.test(k) || k === 'CLAUDE_CONFIG_DIR'));
    delete env.MAX_THINKING_TOKENS;
    env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '1';
    if (WRITER === 'haiku') env.MAX_THINKING_TOKENS = effort === 'medium' ? '4000' : '1024';
    const t0 = Date.now();
    let out = '', err = '', settled = false;
    const done = (r: Omit<CliResult, 'ms'>) => { if (settled) return; settled = true; clearTimeout(timer); fs.rmSync(spFile, { force: true }); resolve({ ...r, ms: Date.now() - t0 }) };
    const fail = (error: string) => done({ text: out, json: null, inTok: 0, outTok: 0, cached: 0, cost: 0, error: error.slice(0, 300) });
    const p = spawn('claude', args, { cwd: d.cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { p.kill('SIGKILL'); fail('timeout after 400s') }, 400_000);
    p.stdout.on('data', b => { out += b });
    p.stderr.on('data', b => { err += b });
    p.on('error', e => fail(e.message));
    p.on('close', code => {
      let r: {
        result?: string; is_error?: boolean; total_cost_usd?: number;
        modelUsage?: Record<string, { inputTokens?: number; outputTokens?: number; cacheReadInputTokens?: number; cacheCreationInputTokens?: number; thinkingTokens?: number; costUSD?: number; canonicalModel?: string }>;
      };
      try { r = JSON.parse(out) } catch { return fail(`exit ${code}, no JSON from the CLI: ${(err || out).trim()}`) }
      const mus = Object.values(r.modelUsage ?? {});
      const sum = (f: (m: typeof mus[number]) => number | undefined) => mus.reduce((s, m) => s + (f(m) ?? 0), 0);
      const main = [...mus].sort((a, b) => (b.costUSD ?? 0) - (a.costUSD ?? 0))[0];
      const text = r.result ?? '';
      done({
        text, json: r.is_error ? null : extractJson(text),
        inTok: sum(m => (m.inputTokens ?? 0) + (m.cacheReadInputTokens ?? 0) + (m.cacheCreationInputTokens ?? 0)),
        outTok: sum(m => m.outputTokens), cached: sum(m => m.cacheReadInputTokens), think: sum(m => m.thinkingTokens),
        cost: r.total_cost_usd ?? sum(m => m.costUSD), model: main?.canonicalModel,
        error: r.is_error ? `CLI error: ${text.trim()}`.slice(0, 300) : undefined,
      });
    });
    p.stdin.on('error', () => { /* the process died early: 'close' reports it */ });
    p.stdin.end(user);
  }));
}

async function write<S extends z.ZodTypeAny>(a: {
  saga: string; calls: CallRec[]; purpose: TemplateName; flags: string[]; vars?: Record<string, number>;
  payload: Record<string, unknown>; effort: 'low' | 'medium'; schema: S; mock: () => unknown;
  /** the rendered-variant class this call belongs to (--render), when its flags alone do not tell it */
  variant?: string;
}): Promise<{ out: z.output<S> | null; ms: number }> {
  const system = render(a.purpose, a.flags, a.vars);
  const user = JSON.stringify(a.payload);
  const t0 = Date.now();
  const base = { provider: (MOCK ? 'mock' : CLAUDE ? 'claude' : 'openai') as CallRec['provider'], purpose: a.purpose, model: MOCK ? 'mock' : CLAUDE ? WRITER as string : MODEL, effort: MOCK ? undefined : a.effort, system, user, template: a.purpose, flags: [...a.flags].sort(), saga: a.saga };
  const log = (rec: Omit<CallRec, keyof typeof base | 'n' | 't'> & { model?: string }) => {
    const line: CallRec = { t: new Date().toISOString(), n: a.calls.length + 1, ...base, ...rec };
    a.calls.push(line);
    const key = `${a.variant ?? a.purpose}__${line.flags.join('+') || 'plain'}`;
    if (!RENDERED.has(key)) RENDERED.set(key, line);
  };
  if (MOCK) {
    const out = a.mock();
    log({ durationMs: Date.now() - t0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, ok: true, output: JSON.stringify(out) });
    return { out: a.schema.parse(out), ms: 0 };
  }
  if (CLAUDE) {
    for (let attempt = 0; attempt < 3; attempt++) {   // up to 2 retries on a failed, non-JSON or off-schema reply
      const r = await runCli(system, user, a.effort);
      const parsed = r.json === null ? null : a.schema.safeParse(r.json);
      // `output` stays JSON.parse-able (mech.ts reads it): the reply itself when it is bare JSON, else its
      // JSON, with the whole reply (fences, prose) kept as `raw`
      const bare = (() => { try { JSON.parse(r.text); return true } catch { return false } })();
      const wrapped = r.json !== null && !bare;
      log({
        model: r.model ?? WRITER, durationMs: r.ms, inputTokens: r.inTok, outputTokens: r.outTok, cachedTokens: r.cached, thinkingTokens: r.think, costUsd: r.cost,
        ok: !!parsed?.success, error: r.error ?? (!parsed ? 'no JSON in the reply' : parsed.success ? undefined : parsed.error.message.slice(0, 300)),
        output: wrapped ? JSON.stringify(r.json) : r.text, ...(wrapped ? { raw: r.text } : {}),
      });
      if (parsed?.success) return { out: parsed.data, ms: Date.now() - t0 };
    }
    return { out: null, ms: Date.now() - t0 };
  }
  client ??= new OpenAI({ apiKey: loadKey() });
  for (let attempt = 0; attempt < 2; attempt++) {   // callR: one retry on a failed or unparseable call
    const t1 = Date.now();
    let raw: string | undefined;
    try {
      const res = await client.chat.completions.create({
        model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' }, reasoning_effort: a.effort,
      } as never) as OpenAI.Chat.Completions.ChatCompletion;
      const inTok = res.usage?.prompt_tokens ?? 0, outTok = res.usage?.completion_tokens ?? 0;
      const cached = (res.usage as { prompt_tokens_details?: { cached_tokens?: number } } | undefined)?.prompt_tokens_details?.cached_tokens ?? 0;
      raw = res.choices[0]?.message?.content ?? '';
      const cost = ((inTok - cached) * PRICE.in + cached * PRICE.cached + outTok * PRICE.out) / 1e6;
      const parsed = a.schema.safeParse(JSON.parse(raw));
      log({ durationMs: Date.now() - t1, inputTokens: inTok, outputTokens: outTok, cachedTokens: cached, costUsd: cost, ok: parsed.success, error: parsed.success ? undefined : parsed.error.message.slice(0, 300), output: raw });
      if (parsed.success) return { out: parsed.data, ms: Date.now() - t0 };
    } catch (e) {
      log({ durationMs: Date.now() - t1, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, ok: false, error: (e as Error).message?.slice(0, 300), output: raw });
    }
  }
  return { out: null, ms: Date.now() - t0 };
}

// ─── one saga ───────────────────────────────────────────────────────────────────────────────────

interface Job { w: World; arm: Arm; draw: Draw; dir: string; id: string; avoid?: { title: string; question: string }[] }
interface Row { id: string; path: string; N: number; outcomes: string; files: number; complete: boolean; problems: string[]; defects: string[]; redraws: number; fallback: boolean; lint: string[]; cost: number; planMs: number; card1Ms: number; title: string; question: string; seed?: string; tone?: string; card1?: string }
const words = (s: string | undefined) => (s ?? '').split(/\s+/).filter(Boolean).length;
const HOW_BAND: Record<Hurt['how'], string> = { lightly: 'light', badly: 'serious', gravely: 'grave' };
const LIKELY: Record<string, string> = { recruit: 'they may join the company', captive: 'they may end in your cells', gold: 'their treasure may pay out', talk: "a soldier's past to settle" };

async function runSaga(job: Job): Promise<Row> {
  const { w, arm, draw } = job;
  const N = w.fx.N;
  const calls: CallRec[] = [];
  const problems: string[] = [];
  const capBreaks: string[] = [];
  const k: Knowing = newKnowing(w.cast);
  // (R2) the saga's record: the learns and gains of won middle jobs (a lost job banks nothing)
  const banked: SagaState = newState();
  const ctx: PlanCtx = { w, arm, draw, avoid: job.avoid, direction: DIRECTION };

  // ── the plan: one call, repairs, one plain re-draw on a hard defect, else the mock (§2.7)
  const { payload: planIn, flags: planFlags } = planPayload(ctx);
  let plan: SagaPlan | null = null, repairs: string[] = [], rawPlan: unknown = null, redraws = 0, fallback = false, planMs = 0;
  const defects: string[] = [];
  for (let attempt = 0; attempt < 2 && !plan; attempt++) {
    const r = await write({ saga: job.id, calls, purpose: 'plan', flags: planFlags, payload: planIn, effort: 'medium', schema: zPlanOut, mock: () => mockPlan(ctx), variant: `plan__${arm.cast}` });
    planMs += r.ms;
    rawPlan = r.out;
    const v = r.out ? validatePlan(r.out, ctx) : { plan: null, repairs: [], defects: ['the call failed'] };
    if (v.plan && !v.defects.length) { plan = v.plan; repairs = v.repairs }
    else { defects.push(...v.defects.map(d => `draw ${attempt + 1}: ${d}`)); if (attempt === 0) redraws++ }
  }
  if (!plan) { fallback = true; const v = validatePlan(mockPlan(ctx), ctx); plan = v.plan!; repairs = v.repairs; problems.push('plan-fallback: the mock plan stood in') }
  const lint = planLint(plan, w, draw.seed.text);
  const focal = plan.cast.find(p => p.focal)!;

  // ── play it
  const dir = job.dir;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const texts: TextRec[] = [], order: string[] = [];
  const lines: { n: number; attempt: number; outcome: string; party: string[]; text: string; hurt: Hurt[] }[] = [];
  const attempts: { k: number; questId: string; isFinale: boolean; outcome: string | null }[] = [];
  const budget = Math.max(2, Math.ceil(N / 2));
  const rng = new Rng(hashStr(`play:${w.fx.id}:${draw.n}:${draw.path}`));   // same in every arm
  const tries = new Map<number, number>();
  let jobN = 1, failures = 0, attempt = 0, kk = 0, lastchance = false, latest = '', card1Ms = 0, card1 = '';
  for (; ;) {
    const finale = jobN > N - 1 || lastchance;
    const e = finale ? plan.showdown : plan.episodes[jobN - 1]!;
    kk++;
    const questId = `${job.id}.q${kk}`;
    // the card: card 1 is always its own call (R1, C3), every later card carries its job's why (C1); a
    // re-posed job is marked (R2, S5), and later cards get what was learned and what is held (S1, S2)
    const tryOnJob = finale ? 1 : (tries.get(jobN) ?? 0) + 1;
    const cc = kk === 1 ? firstCardPayload(plan, w, arm, k, DIRECTION)
      : laterCardPayload(plan, e, latest, arm, k, { finale, lastchance, retry: tryOnJob > 1, state: { learned: [...banked.learned], held: [...banked.held] }, direction: DIRECTION });
    const cr = await write({ saga: job.id, calls, purpose: 'card', flags: cc.flags, vars: cc.vars, payload: cc.payload, effort: 'low', schema: zCardOut, mock: () => mockCard(cc.payload, cc.flags) });
    if (kk === 1) card1Ms = planMs + cr.ms;
    let card = cr.out?.card?.trim() ?? '';
    if (!card) { card = mockCard(cc.payload, cc.flags).card; problems.push(`card_${kk}: the writer failed, the template stood in`) }
    if (words(card) > cc.vars.MAX!) capBreaks.push(`card_${kk} ${words(card)}/${cc.vars.MAX}`);
    if (kk === 1) card1 = card;
    noteDelivered(card, plan, k, false);
    const setbackLine = !finale && tryOnJob > 1 ? ` · a setback — ${failures} of ${budget} before it slips away` : '';
    const matter = onThisMatter(plan, card);
    const cardMd = [
      `═══ ${e.title} · ${plan.title} ═══`, card,
      ...(matter.length ? [`ON THIS MATTER: ${matter.join(' · ')}`] : []),
      finale ? 'REWARD: the rest of the saga\'s pay, and what the ending brings' : "REWARD: a few days' pay",
      finale ? `SAGA: ${plan.title} · the finale${lastchance ? ' · the last chance' : ''} · setbacks ${failures} of ${budget}`
        : `SAGA: ${plan.title} · part ${jobN} of ${N}${setbackLine || ` · setbacks ${failures} of ${budget}`}`,
      ...(finale ? ['PLANS (pick one) — chosen: g0', ...plan.options.map((o, i) => buttonLine(o, i, i === 0, helped(focal)))] : []),
    ].join('\n') + '\n';
    const cardFile = `card_${kk}.md`;
    fs.writeFileSync(path.join(dir, cardFile), cardMd);
    order.push(cardFile);
    texts.push({ file: cardFile, kind: 'card', k: kk, questId, isFinale: finale, title: e.title, beat: finale ? 'finale' : jobN, prose: card, errand: '', approaches: finale ? plan.options.map((o, i) => buttonLine(o, i, i === 0, helped(focal)).slice(2)) : [] });
    if (SERIES) break;   // the repetition series: plan + card 1 only

    // the outcome, forced by the path; the soldiers, dice and wounds from the play rng
    if (!finale) { tries.set(jobN, tryOnJob); attempt++ }
    const outcome = outcomeFor(draw.path, { isFinale: finale, job: jobN, tryOnJob, attempt });
    const party = pickParty(rng, w, finale);
    const dice = rollDice(rng, party, outcome);
    const { hurt, cost } = rollHurt(rng, outcome, party, dice.lowest);
    const gravity = sampleGravity(rng, w.base.rarity ?? 'common', 'saga');
    const option = finale ? plan.options[0]! : undefined;   // the likely way: the options come likely first
    const fate = option ? fateSentence(option.way, outcome, focal, choiceTarget(plan)) : undefined;
    attempts.push({ k: kk, questId, isFinale: finale, outcome });

    // the report
    const rp = reportPayload({ plan, e, card, party, decides: dice.decides, outcome, finale, hurt, cost, option, fate, arm, k, gravity, direction: DIRECTION, state: { learned: [...banked.learned], held: [...banked.held] } });
    const r = await write({ saga: job.id, calls, purpose: 'report', flags: rp.flags, vars: rp.vars, payload: rp.payload, effort: 'low', schema: zReportOut, mock: () => mockReport(rp.payload, rp.flags), variant: `report__${finale ? 'finale-' : ''}${outcome}` });
    let rep: { before: string; after: string; summary: string; truth?: string } | null = r.out ? { before: r.out.before.trim(), after: r.out.after.trim(), summary: (r.out.summary ?? '').trim(), truth: r.out.truth?.trim() || undefined } : null;
    if (!rep) { rep = mockReport(rp.payload, rp.flags); problems.push(`report_${kk}: the writer failed, the template stood in`) }
    if (!rep.summary) { rep.summary = mockReport(rp.payload, rp.flags).summary; problems.push(`report_${kk}: no summary, the template's stood in`) }
    // the finale's answer is its own line (R1, C4); a reply without it gets the plan's answer, as dealt
    if (finale && !rep.truth) { rep.truth = mockReport(rp.payload, rp.flags).truth; problems.push(`report_${kk}: no truth, the plan's answer stood in`) }
    if (!finale) delete rep.truth;
    if (words(rep.before) > rp.vars.B!) capBreaks.push(`report_${kk} before ${words(rep.before)}/${rp.vars.B}`);
    if (words(rep.after) > rp.vars.A!) capBreaks.push(`report_${kk} after ${words(rep.after)}/${rp.vars.A}`);
    if (words(rep.summary) > 25) capBreaks.push(`report_${kk} summary ${words(rep.summary)}/25`);
    noteDelivered(`${rep.before} ${rep.after} ${rep.summary}`, plan, k, true);
    bank(banked, e, outcome);
    lines.push({ n: finale ? N : jobN, attempt: kk, outcome, party: party.map(p => p.name), text: rep.summary, hurt });
    if (!finale && outcome === 'failure') { failures++; if (failures >= budget) lastchance = true }
    const status = finale ? (outcome === 'failure' ? 'it slips away, for now' : 'it is settled')
      : outcome === 'failure' ? `a setback — ${failures} of ${budget}${lastchance ? '; the setbacks are spent, so the last chance comes next' : ''}`
      : jobN + 1 > N - 1 ? 'it now comes to a head' : 'the story moves on';
    const repMd = [
      `━━ ${outcome.toUpperCase()} ━━ ${e.title}${finale ? ' ♛' : ''}`, rep.before, dice.line, rep.after,
      ...(rep.truth ? [rep.truth] : []),
      ...hurt.map(h => `🩸 ${h.name} is wounded (${HOW_BAND[h.how]}).`),
      `📖 ${plan.title}: ${status}. ${rep.summary}`,
    ].join('\n') + '\n';
    const repFile = `report_${kk}.md`;
    fs.writeFileSync(path.join(dir, repFile), repMd);
    order.push(repFile);
    texts.push({ file: repFile, kind: 'report', k: kk, questId, isFinale: finale, title: e.title, before: rep.before, after: rep.after, ...(rep.truth ? { truth: rep.truth } : {}), outcome, diceLine: dice.line });
    latest = rep.summary;
    if (finale) break;
    if (outcome !== 'failure') jobN++;
    if (kk > 20) { problems.push('runaway saga (> 20 attempts)'); break }
  }

  // the chronicle (§4.3 chainDetail): title, state, card 1 (the plan writes no pitch), the likely-end line, So far, People
  const lastOutcome = attempts[attempts.length - 1]?.outcome;
  const state = SERIES ? 'planned' : lastOutcome === 'failure' ? 'slipped' : 'done';
  const mark: Record<string, string> = { success: '✓', partial: '~', failure: '✗' };
  const chain = [
    `═══ ${plan.title} ═══ (${state})`, card1,
    `likely end: ${LIKELY[w.fx.personal ? 'talk' : w.fx.kind]} · setbacks ${failures} of ${budget}`,
    'So far:', ...lines.map(l => `  ${l.n} ${mark[l.outcome]} ${l.party.join(', ')} — ${l.text}${l.hurt.length ? ` · ${l.hurt.map(h => `${h.name} hurt (${HOW_BAND[h.how]})`).join(', ')}` : ''}`),
    'People:', ...plan.cast.filter(p => k.seen.has(p.id)).map(p => k.named.has(p.id) ? `  ${p.name} — ${p.label.replace(/^an? /, '')}` : `  ${p.label}`),
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(dir, 'chain.md'), chain);
  order.push('chain.md');

  // completeness (extract.ts's contract): every attempt has a card and a report with a ⚄ line and
  // prose; the saga closed on a finale with plans; the outcomes follow the path
  const cards = texts.filter(t => t.kind === 'card'), reports = texts.filter(t => t.kind === 'report');
  if (SERIES) { if (cards.length !== 1) problems.push(`${cards.length} cards, the series wants card 1 only`) }
  else {
    if (cards.length !== reports.length) problems.push(`${cards.length} cards but ${reports.length} reports`);
    if (!cards.some(c => c.isFinale && (c.approaches?.length ?? 0) >= 2)) problems.push('no finale card with plans');
  }
  for (const t of reports) if (!t.before || !t.after || !t.diceLine) problems.push(`${t.file}: missing prose or ⚄ line`);
  for (const t of cards) if (words(t.prose) < 5) problems.push(`${t.file}: the card has no prose`);
  const cost = calls.reduce((s, c) => s + c.costUsd, 0);
  fs.writeFileSync(path.join(dir, 'order.txt'), order.join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'texts.json'), JSON.stringify(texts, null, 2));
  fs.writeFileSync(path.join(dir, 'calls.jsonl'), calls.map(c => JSON.stringify(c)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({
    probe: { fixture: w.fx, base: w.base.id, arm, armKey: armKey(arm), draw: draw.n, path: draw.path, seed: draw.seed, tone: draw.tone, mock: MOCK, writer: MOCK ? 'mock' : WRITER },
    engine: {
      cast: w.cast, stake: w.stake, places: w.places, land: w.land, region: w.region,
      focal: { id: w.focal.id, name: w.focal.name, tags: renderTags(w.focal.tags) },
      roster: w.roster.map(c => ({ id: c.id, name: c.name, tags: renderTags(c.tags) })),
    },
    planInput: planIn, plan, rawPlan,
    validation: { repairs, defects, redraws, fallback },
    lint, capBreaks, lines, banked, met: [...k.met], named: [...k.named], seen: [...k.seen],
    cost, latency: { planMs, card1Ms, calls: calls.map(c => ({ purpose: c.purpose, ms: c.durationMs })) },
  }, null, 2));
  const meta = {
    fixture: { id: job.id, set: 'P', seed: w.base.seed, path: draw.path, N, kind: w.fx.kind, personal: w.fx.personal, probe: w.fx.id, draw: draw.n },
    run: `${RUN}/${path.basename(path.dirname(dir))}`, chainId: null, chainState: state,
    attempts, order, complete: problems.length === 0, problems,
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  return {
    id: job.id, path: draw.path, N, outcomes: attempts.map(a => (a.outcome ?? '?')[0]!.toUpperCase()).join(''),
    files: order.length, complete: problems.length === 0, problems, defects, redraws, fallback, lint, cost, planMs, card1Ms, title: plan.title, question: plan.question, seed: draw.seed.text, tone: draw.tone, card1,
  };
}

// ─── the run ────────────────────────────────────────────────────────────────────────────────────

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const q = [...items];
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => { for (let x = q.shift(); x !== undefined; x = q.shift()) await fn(x) }));
}

async function main() {
  const runDir = path.join(LAB, 'runs', RUN);
  if (!PLAY.length) { console.error(`no fixtures match ${wantFx.join(',')}`); process.exit(2) }
  if (RENDER) fs.rmSync(path.join(runDir, 'rendered'), { recursive: true, force: true });
  let total = 0;
  for (const arm of ARMS) {
    const armName = SERIES ? `series_${armKey(arm)}` : armKey(arm);
    if (opt('as') && ARMS.length > 1) { console.error('--as takes one arm'); process.exit(2) }
    const armDir = path.join(runDir, opt('as') ?? `${MOCK ? 'mock-' : ''}${armName}${CLAUDE ? `_${WRITER}` : ''}`);
    const jobs: Job[] = [];
    for (const { fx, d } of PLAY) {
      const id = `${fx.id}_${d}`;
      const world = SERIES ? SERIES_WORLDS.get(id)! : WORLDS.get(fx.id)!;
      const w = arm.cast === 'lean' ? leanWorld(world) : world;
      const dir = path.join(armDir, id);
      if (!FORCE && fs.existsSync(path.join(dir, 'meta.json'))) { console.log(`[${armKey(arm)} ${id}] exists — skipped (--force to redo)`); continue }
      jobs.push({ w, arm, draw: makeDraw(w, d, SEEDS.get(id) ?? null), dir, id });
    }
    const rows: Row[] = [];
    const recent: { title: string; question: string }[] = [];
    await pool(jobs, CONCURRENCY, async j => {
      if (AVOID) j.avoid = recent.slice(-5);
      try {
        const row = await runSaga(j);
        rows.push(row);
        recent.push({ title: row.title, question: row.question });
        total += row.cost;
        console.log(`[${armKey(arm)} ${j.id}] ${row.outcomes} · ${row.files} files · ${row.complete ? 'complete' : `INCOMPLETE: ${row.problems.join('; ')}`}${row.defects.length ? ` · plan defects: ${row.defects.join('; ')}` : ''} · $${row.cost.toFixed(4)} · card 1 after ${(row.card1Ms / 1000).toFixed(1)}s`);
      } catch (e) {
        console.error(`[${armKey(arm)} ${j.id}] FAILED: ${(e as Error).stack}`);
        rows.push({ id: j.id, path: j.draw.path, N: j.w.fx.N, outcomes: '', files: 0, complete: false, problems: [(e as Error).message], defects: [], redraws: 0, fallback: false, lint: [], cost: 0, planMs: 0, card1Ms: 0, title: '', question: '' });
      }
    });
    if (!rows.length) continue;
    rows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    fs.mkdirSync(armDir, { recursive: true });
    fs.writeFileSync(path.join(armDir, 'INDEX.md'), [
      `# ${RUN} · ${MOCK ? 'mock floor · ' : ''}${CLAUDE ? `writer ${WRITER} (Claude CLI) · ` : ''}${SERIES ? 'repetition series (plan + card 1) · ' : ''}arm ${armKey(arm)} (structure ${arm.structure}, cast ${arm.cast}, names ${arm.names}, card 1 first)`, '',
      '| saga | title | path | N | outcomes | files | complete | plan defects (re-draws) | fallback | lint | $ | card 1 after |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|',
      ...rows.map(r => `| ${r.id} | ${r.title} | ${r.path} | ${r.N} | ${r.outcomes} | ${r.files} | ${r.complete ? '✓' : `✗ ${r.problems.join('; ')}`} | ${r.defects.length ? `${r.defects.join('; ')} (${r.redraws})` : '—'} | ${r.fallback ? '✗' : '—'} | ${r.lint.join('; ') || '—'} | ${r.cost.toFixed(4)} | ${(r.card1Ms / 1000).toFixed(1)}s |`),
      '',
    ].join('\n'));
    // the series in one file, in play order, for the J4 series reader
    if (SERIES) fs.writeFileSync(path.join(armDir, 'SERIES.md'), [
      `# ${RUN} · repetition series · arm ${armKey(arm)} — card 1 of each saga`, '',
      ...rows.flatMap(r => [`## ${r.id} · ${r.title}`, `seed: ${r.seed ?? '?'} · tone: ${r.tone ?? '?'}`, `question: ${r.question}`, '', r.card1 ?? '', '']),
    ].join('\n'));
  }
  if (RENDER) {
    const rd = path.join(runDir, 'rendered');
    fs.mkdirSync(rd, { recursive: true });
    for (const [key, c] of RENDERED) {
      fs.writeFileSync(path.join(rd, `${key}.txt`), `=== SYSTEM (${c.purpose} · ${c.flags.join(', ') || 'no flags'} · ${wordCount(c.system)} words · from ${c.saga} · ${c.provider === 'mock' ? 'mock writer' : c.model}) ===\n${c.system}\n\n=== USER ===\n${c.user}\n`);
    }
    // the variants the verifier needs (§5.2 verify 1); the folder was cleared, so only this pass counts
    const has = (f: (key: string, c: CallRec) => boolean) => [...RENDERED].some(([key, c]) => f(key, c));
    const cardWith = (flag: string) => (_k: string, c: CallRec) => c.purpose === 'card' && c.flags.includes(flag);
    const NEED: [string, (key: string, c: CallRec) => boolean][] = [
      ['plan, full cast', k => k.startsWith('plan__full__')], ['plan, lean cast', k => k.startsWith('plan__lean__')],
      ['card 1 (first)', cardWith('first')], ['a later card', cardWith('later')], ['the finale card', cardWith('finale')],
      ['a last-chance finale card', cardWith('lastchance')], ['a personal card', cardWith('personal')], ['a card with a memory', cardWith('memory')],
      // R2: a retry card, a later card with learned clues, the finale with gains held (and their edges) and with none
      ['a retry card (S5)', cardWith('retry')], ['a later card with learned clues (S1)', (_k, c) => c.purpose === 'card' && c.flags.includes('later') && c.flags.includes('mystery')],
      ['a finale card with gains held (S2)', (_k, c) => c.purpose === 'card' && c.flags.includes('finale') && c.flags.includes('edge')],
      ['a finale card with no gains held (S2)', (_k, c) => c.purpose === 'card' && c.flags.includes('finale') && !c.flags.includes('have')],
      ['a won middle report with clue + gain (S1, S2)', (_k, c) => c.purpose === 'report' && c.flags.includes('clue') && c.flags.includes('brought')],
      ['a middle report with known clues and holdings (S1, S2)', (_k, c) => c.purpose === 'report' && c.flags.includes('known') && !c.flags.includes('answer')],
      ['a finale report with known clues (S1)', (_k, c) => c.purpose === 'report' && c.flags.includes('answer') && c.flags.includes('known')],
      ['a finale report with gains held (S2)', (_k, c) => c.purpose === 'report' && c.flags.includes('answer') && c.flags.includes('edge')],
      ['a finale report with no gains held (S2)', (_k, c) => c.purpose === 'report' && c.flags.includes('answer') && !c.flags.includes('have')],
      ['a success report', k => k.startsWith('report__success__')], ['a partial report', k => k.startsWith('report__partial__')],
      ['a failure report', k => k.startsWith('report__failure__')], ['a finale report', k => k.startsWith('report__finale-')],
      ['the answer (truth) report', (_k, c) => c.purpose === 'report' && c.flags.includes('answer')],
      ['a personal report', (_k, c) => c.purpose === 'report' && c.flags.includes('personal')],
    ];
    const missing = NEED.filter(([, f]) => !has(f)).map(([name]) => name);
    const rows = fs.readdirSync(rd).filter(f => f.endsWith('.txt')).sort().map(f => {
      const head = fs.readFileSync(path.join(rd, f), 'utf8').split('\n')[0]!.match(/^=== SYSTEM \((\w+) · (.*) · (\d+) words · from (.*)\) ===$/);
      const [saga, writer] = (head?.[4] ?? '?').split(' · ');
      return `| ${f} | ${head?.[1] ?? '?'} | ${head?.[2] ?? '?'} | ${head?.[3] ?? '?'} | ${saga} | ${writer ?? '?'} |`;
    });
    fs.writeFileSync(path.join(rd, 'INDEX.md'), [`# ${RUN} — every prompt variant rendered, each with the real payload it was sent`, '',
      'Each file: the system prompt as the model reads it, then the user message exactly as sent (JSON).',
      'File names: `plan__<cast arm>__<flags>` · `card__<flags>` · `report__<outcome, finale- for the finale>__<flags>`.', '',
      'Flags (each turns on the template lines, spans or skeleton fields it names; a flag is on only when the payload carries what it explains):',
      '- plan: `shape` shape dealt · `episodes` job list dealt (arm S) · `types` job types to pick from (arms H, L) · `stake` a stake dealt (full cast) · `notrade` someone in cast has no trade (lean cast) · `personal` the story is a soldier\'s own past · `memory` a returning face · `direction` the player\'s wish · `avoid` recent stories.',
      '- card: `first` / `later` / `finale` which card · `loses` card 1\'s premise carries the loss · `personal` a soldier\'s own past (card 1, finale) · `memory` a returning face met here · `lastchance` the failure budget is spent · `retry` a re-posed job (what stopped the last try) · `mystery` the question with what was learned so far · `have` what the company holds from won jobs · `edge` (finale) how each held gain helps · `direction`.',
      '- report: `saga` the reply has a summary · `moved` its summary says what changed · `failure` + `stopped` a failed job, its summary says what stopped it · `people` someone besides the soldiers acts in the job · `personal` the soldier whose past the story is went (the summary may name them) · `decides` `result` `option` `hurt` `cost` `direction` one data line each · `brought` a won job\'s gain · `clue` what a won job brings to light · `known` what earlier won jobs found (middle or finale) · `have` what the company holds (`edge`: at the finale, how each helps) · `hurtprice` a partial whose price is the wound (no cost dealt) · `answer` the finale\'s question and its secret (the plan\'s answer), returned as its own `truth` (the moment it comes out).',
      '',
      missing.length ? `**Not reached this pass:** ${missing.join(' · ')}.` : 'Every variant class the verifier needs is here: plan full and lean; card first, later, finale, last chance, personal, memory, retry, learned clues, finale with and without gains; report success, partial, failure, finale (with and without gains, with known clues), answer, personal, won middle with clue + gain, middle with known clues.', '',
      'The writer column says whose earlier outputs fed the payload: a real run (the plan, cards and summaries the model wrote) or the mock floor (template text).', '',
      '| file | call | flags | words | from saga | writer |', '|---|---|---|---|---|---|', ...rows, ''].join('\n'));
    console.log(`rendered ${RENDERED.size} prompt variants → ${path.relative(V3, rd)}${missing.length ? ` · NOT reached: ${missing.join(', ')}` : ' · every variant class reached'}`);
  }
  console.log(`total: $${total.toFixed(4)} → ${path.relative(V3, runDir)}`);
}

main().catch(e => { console.error(e); process.exit(1) });
