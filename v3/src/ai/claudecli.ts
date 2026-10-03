// THE CLAUDE PLAYTEST TRANSPORT — one writer call through the headless `claude -p` CLI, on the
// designer's Claude subscription (designer 2026-10-02: playtests should be free; production stays on
// GPT, which is far cheaper per call — optimise for gpt-5 at the Steam stretch). Only the TRANSPORT
// changes: openai.ts hands this the same system + user text it would send to OpenAI.
// Selected with AIRAIDER_AI=claude (server) / --claude (CLI). The lab's runner this grew out of:
// scripts/sagalab/probe.ts (--writer sonnet|haiku).

import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export const claudeBin = () => process.env.AIRAIDER_CLAUDE_BIN || 'claude';
/** how many CLI calls run at once — past it they queue (card writes AND the reckoning's reports share it) */
export const claudePool = () => Math.max(1, Number(process.env.AIRAIDER_CLAUDE_POOL ?? 4) || 4);
const TIMEOUT_MS = () => Math.max(10_000, Number(process.env.AIRAIDER_CLAUDE_TIMEOUT_MS ?? 240_000) || 240_000);

export interface ClaudeCallOpts {
  model: string;                    // a CLI alias (sonnet / haiku / opus) or a full model id
  effort?: 'low' | 'medium';        // --effort (models that honour it)
  thinkingTokens?: number;          // MAX_THINKING_TOKENS instead (Haiku 4.5 ignores --effort)
}
export interface ClaudeCallResult {
  text: string;                     // the reply as written (fences, prose and all)
  json: Record<string, unknown> | null;  // its JSON object, tolerantly extracted (null = none parsed)
  model: string;                    // the canonical model id that answered
  inputTokens: number;              // all input, cache reads and writes included
  outputTokens: number;
  cachedTokens: number;
  listCostUsd: number;              // what the call would cost at API list price — the subscription is not billed per call
  durationMs: number;
}

/** a failed CLI call; `kind` lets the caller tell a usage limit or a logged-out CLI from a bad reply */
export class ClaudeCliError extends Error {
  constructor(public kind: 'limit' | 'auth' | 'timeout' | 'spawn' | 'cli', message: string) { super(message) }
}

/** the child's environment: the parent's, minus EVERY Claude/Anthropic setting it carries — a parent
 *  Claude session leaks its own (its effort overrode --effort; its session ids), and any ANTHROPIC_* var
 *  reroutes the call (an API key or auth token bills the API instead of the subscription, a base URL
 *  sends it elsewhere, a default-model var silently remaps the sonnet/haiku aliases). Only where the
 *  subscription login lives survives. Auto-memory off (else the user's memory rides in whenever cwd is
 *  inside a repo); thinking budget only as given */
export function claudeChildEnv(parent: NodeJS.ProcessEnv, thinkingTokens?: number): NodeJS.ProcessEnv {
  const keep = new Set(['CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_OAUTH_TOKEN']);   // where the login lives / a token login
  const env: NodeJS.ProcessEnv = Object.fromEntries(Object.entries(parent).filter(([k]) => !/^(CLAUDE|ANTHROPIC_)/.test(k) || keep.has(k)));
  delete env.MAX_THINKING_TOKENS;
  env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '1';
  if (thinkingTokens !== undefined) env.MAX_THINKING_TOKENS = String(thinkingTokens);
  return env;
}

/** JSON.parse, or the same with raw control characters inside strings escaped (Python's strict=False) */
export function parseLenient(s: string): unknown {
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

/** every top-level JSON object in a text that parses, LAST first — whatever wraps them (code fences,
 *  prose, a stray log line) is ignored; first `{` to last `}` is the fallback */
function jsonObjects(text: string): Record<string, unknown>[] {
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
  const objs: Record<string, unknown>[] = [];
  for (const s of [...spans.reverse(), ...(i >= 0 && j > i ? [text.slice(i, j + 1)] : [])]) {
    const v = parseLenient(s);
    if (v && typeof v === 'object' && !Array.isArray(v)) objs.push(v as Record<string, unknown>);
  }
  return objs;
}

/** the reply's JSON object, tolerantly: when the reply holds several (one that corrects itself:
 *  "Wait, …") the LAST one that parses is its final word. null when nothing parses — a malformed
 *  object (a trailing comma) is a failed call, and the caller's retry takes it */
export function extractJson(text: string): Record<string, unknown> | null {
  return jsonObjects(text)[0] ?? null;
}

/** the CLI's result envelope out of its stdout — the last line that is one (cheap, the normal case),
 *  else any top-level object of type 'result'; a stray line (an update notice) must not fail a call */
export function findEnvelope(stdout: string): Record<string, unknown> | null {
  const isEnv = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && (v as { type?: unknown }).type === 'result';
  for (const line of stdout.split('\n').reverse()) {
    if (!line.trim().startsWith('{')) continue;
    try { const v = JSON.parse(line); if (isEnv(v)) return v } catch { /* not this line */ }
  }
  return jsonObjects(stdout).find(isEnv) ?? null;
}

/** what the CLI reads as TYPED input: a message opening with '/' runs as a slash command or skill and
 *  never reaches the model as written ('/cost …' answered with the account's usage, no model call;
 *  '/simplify …' swapped in a skill's prompt). Leading whitespace sends it as text — the one byte the
 *  transport adds to a prompt. Every game message but the player's own direction text opens with '{' */
export function stdinSafe(user: string): string {
  return user.startsWith('/') ? ` ${user}` : user;
}

/** what a failed CLI said, as one readable line — a usage limit and a logged-out CLI each get their own */
export function classifyCliError(text: string): { kind: 'limit' | 'auth' | 'cli'; line: string } {
  const t = text.replace(/\s+/g, ' ').trim().slice(0, 200);
  if (/usage limit|rate.?limit|limit reached|hit your limit|out of (extra )?usage|too many requests|\b429\b/i.test(t))
    return { kind: 'limit', line: `the Claude subscription hit a usage/rate limit — ${t}` };
  // the CLI's own reason FIRST — the game cuts a job error short, and a long binary path must not push it out
  if (/log ?in|logged out|not logged|authenticat|unauthori[sz]ed|invalid api key|oauth|credential|\b401\b|\b403\b/i.test(t))
    return { kind: 'auth', line: `the claude CLI is not logged in (${t}) — run \`${claudeBin()}\` once and /login` };
  return { kind: 'cli', line: `claude CLI error: ${t}` };
}

// one readable log line per kind per minute — a limit hit by a batch of parallel calls says so once. Every
// transport failure says so (a timeout costs 240 s twice before the template fallback ships, and a silent
// outage would read as nothing but template prose); a reply with no JSON is the writer's miss, not the
// transport's, and stays on the caller's retry path
const lastShout = new Map<string, number>();
function shout(kind: string, line: string) {
  const now = Date.now();
  if (now - (lastShout.get(kind) ?? 0) < 60_000) return;
  lastShout.set(kind, now);
  console.error(`[claude] ${line}`);
}

/** fail fast at startup: the binary must exist and run */
export function assertClaudeCli(): string {
  const bin = claudeBin();
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 20_000, env: claudeChildEnv(process.env) });
  if (r.error || r.status !== 0)
    throw new Error(`The claude transport (AIRAIDER_AI=claude / --claude) needs the Claude Code CLI ("${bin}" ${r.error ? `failed: ${r.error.message}` : `exited ${r.status}`}). `
      + 'Install it (npm i -g @anthropic-ai/claude-code), log in once with `claude` → /login, or point AIRAIDER_CLAUDE_BIN at it.');
  return (r.stdout || '').trim();
}

// ── scratch: an EMPTY cwd outside the repo (no CLAUDE.md to discover) + a temp dir for system prompts ──
let dirs: { cwd: string; sp: string } | null = null;
let spN = 0;
function scratch() {
  if (dirs) return dirs;
  const cwd = process.env.AIRAIDER_CLAUDE_CWD || path.join(os.homedir(), '.airaider', 'claude-cwd');
  fs.mkdirSync(cwd, { recursive: true });
  const sp = fs.mkdtempSync(path.join(os.tmpdir(), 'airaider-claude-'));
  process.once('exit', () => { try { fs.rmSync(sp, { recursive: true, force: true }) } catch { /* best effort */ } });
  return dirs = { cwd, sp };
}

// ── the pool: the game fires calls in parallel; past POOL they queue instead of forking dozens of CLIs ──
let active = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active < claudePool()) active++;
  else await new Promise<void>(r => waiting.push(r));
  try { return await fn() } finally { const next = waiting.shift(); if (next) next(); else active-- }
}

type CliReply = {
  result?: string; is_error?: boolean; subtype?: string; total_cost_usd?: number; api_error_status?: number | string | null;
  modelUsage?: Record<string, { inputTokens?: number; outputTokens?: number; cacheReadInputTokens?: number; cacheCreationInputTokens?: number; costUSD?: number; canonicalModel?: string }>;
};

/** one call: system prompt from a temp file (always deleted), the user message on stdin, JSON out.
 *  Throws ClaudeCliError on any failure the caller should retry or fall back from; a reply with no
 *  parseable JSON object resolves with json = null (the caller decides) */
export function runClaude(system: string, user: string, o: ClaudeCallOpts): Promise<ClaudeCallResult> {
  return slot(() => new Promise<ClaudeCallResult>((resolve, reject) => {
    const d = scratch();
    const spFile = path.join(d.sp, `${process.pid}_${++spN}.txt`);
    fs.writeFileSync(spFile, system);
    const args = ['-p', '--model', o.model, '--system-prompt-file', spFile, '--tools', '', '--setting-sources', '',
      '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--exclude-dynamic-system-prompt-sections',
      '--no-session-persistence', '--output-format', 'json', ...(o.effort ? ['--effort', o.effort] : [])];
    const t0 = Date.now();
    let out = '', err = '', settled = false;
    const finish = (f: () => void) => { if (settled) return; settled = true; clearTimeout(timer); fs.rmSync(spFile, { force: true }); f() };
    const fail = (kind: ClaudeCliError['kind'], line: string) => {
      shout(kind, line);
      finish(() => reject(new ClaudeCliError(kind, line.slice(0, 300))));
    };
    const p = spawn(claudeBin(), args, { cwd: d.cwd, env: claudeChildEnv(process.env, o.thinkingTokens), stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { p.kill('SIGKILL'); fail('timeout', `claude CLI timed out after ${Math.round(TIMEOUT_MS() / 1000)}s (killed)`) }, TIMEOUT_MS());
    // decoded as a STREAM — a character split across two chunks (an em dash) must not turn into U+FFFD
    p.stdout.setEncoding('utf8');
    p.stderr.setEncoding('utf8');
    p.stdout.on('data', (b: string) => { out += b });
    p.stderr.on('data', (b: string) => { err += b });
    p.on('error', e => fail('spawn', `could not run ${claudeBin()}: ${e.message}`));
    p.on('close', code => {
      const r = findEnvelope(out) as CliReply | null;
      // no envelope: stdout holds no model reply, so whatever the CLI printed is its own error
      if (!r) { const c = classifyCliError(err || out || `exit ${code}`); return fail(c.kind, `${c.line} (exit ${code})`) }
      const text = r.result ?? '';
      if (r.is_error || Number(r.api_error_status) === 429) {
        const c = classifyCliError(`${text || r.subtype || 'error'}${r.api_error_status ? ` (${r.api_error_status})` : ''}`);
        return fail(c.kind, c.line);
      }
      const json = extractJson(text);
      // a limit or logout notice can come back as an ordinary reply — short plain text, no JSON
      if (!json && text.length < 400) { const c = classifyCliError(text); if (c.kind !== 'cli') return fail(c.kind, c.line) }
      const mus = Object.entries(r.modelUsage ?? {});
      const sum = (f: (m: NonNullable<CliReply['modelUsage']>[string]) => number | undefined) => mus.reduce((s, [, m]) => s + (f(m) ?? 0), 0);
      const main = [...mus].sort((a, b) => (b[1].outputTokens ?? 0) - (a[1].outputTokens ?? 0))[0];
      finish(() => resolve({
        text, json,
        model: main ? main[1].canonicalModel ?? main[0] : o.model,
        inputTokens: sum(m => (m.inputTokens ?? 0) + (m.cacheReadInputTokens ?? 0) + (m.cacheCreationInputTokens ?? 0)),
        outputTokens: sum(m => m.outputTokens), cachedTokens: sum(m => m.cacheReadInputTokens),
        listCostUsd: r.total_cost_usd ?? sum(m => m.costUSD),
        durationMs: Date.now() - t0,
      }));
    });
    p.stdin.on('error', () => { /* the process died early: 'close' reports it */ });
    p.stdin.end(stdinSafe(user));
  }));
}

/** the game's two tiers on the subscription: WRITER (prose) → Sonnet at the tier's effort; NANO (the
 *  mechanical picker/theme tier) → Haiku with thinking off. Haiku 4.5 ignores --effort, so a Haiku
 *  model is bounded by a thinking budget instead (unbounded it spent 15k tokens / 150 s on one plan) */
export function claudeOptsFor(tier: 'plan' | 'writer' | 'nano', effort: 'minimal' | 'low' | 'medium'): ClaudeCallOpts {
  const writer = process.env.AIRAIDER_CLAUDE_WRITER || 'sonnet';
  const model = tier === 'nano' ? process.env.AIRAIDER_CLAUDE_NANO || 'haiku' : tier === 'plan' ? process.env.AIRAIDER_CLAUDE_PLAN || writer : writer;
  if (/haiku/i.test(model)) return { model, thinkingTokens: tier === 'nano' ? 0 : effort === 'medium' ? 4000 : 1024 };
  return { model, effort: effort === 'medium' ? 'medium' : 'low' };
}
