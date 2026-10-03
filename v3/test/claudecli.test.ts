// The Claude playtest transport (src/ai/claudecli.ts): reply parsing, child-env hygiene, tier mapping,
// error classification, AI selection. No real CLI call here.
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { extractJson, claudeChildEnv, claudeOptsFor, classifyCliError, stdinSafe, findEnvelope, runClaude } from '../src/ai/claudecli.js';
import { aiKindFrom } from '../src/ai/select.js';

describe('extractJson — the reply as the CLI hands it back', () => {
  it('takes a bare object', () => {
    expect(extractJson('{"title":"A","n":1}')).toEqual({ title: 'A', n: 1 });
  });
  it('ignores code fences', () => {
    expect(extractJson('```json\n{"title": "Fenced"}\n```')).toEqual({ title: 'Fenced' });
  });
  it('ignores prose around the object, braces inside strings included', () => {
    expect(extractJson('Here is the card:\n{"situation": "a {curly} note", "job": "go"}\nHope that helps!'))
      .toEqual({ situation: 'a {curly} note', job: 'go' });
  });
  it('two objects → the LAST one that parses (a reply that corrects itself)', () => {
    const r = '{"title": "First try"}\n\nWait, the title must be shorter:\n\n```json\n{"title": "Second"}\n```';
    expect(extractJson(r)).toEqual({ title: 'Second' });
  });
  it('a malformed last object falls back to the earlier one that parses', () => {
    expect(extractJson('{"title": "Good"}\nWait — {"title": "Bad",}')).toEqual({ title: 'Good' });
  });
  it('tolerates raw control characters inside strings', () => {
    expect(extractJson('{"situation": "line one\nline two\tend"}')).toEqual({ situation: 'line one\nline two\tend' });
  });
  it('nested objects stay whole', () => {
    expect(extractJson('ok {"a": {"b": [1, {"c": "}"}]}}')).toEqual({ a: { b: [1, { c: '}' }] } });
  });
  it('nothing parseable → null (a trailing comma is a failed call → the retry path)', () => {
    expect(extractJson('{"title": "A",}')).toBeNull();
    expect(extractJson('I cannot help with that.')).toBeNull();
    expect(extractJson('[1, 2, 3]')).toBeNull();
  });
});

describe('claudeChildEnv — nothing of a parent Claude session leaks into the child', () => {
  const parent = {
    PATH: '/usr/bin', HOME: '/home/x',
    CLAUDECODE: '1', CLAUDE_EFFORT: 'xhigh', CLAUDE_CODE_SESSION_ID: 's1', CLAUDE_CODE_CHILD_SESSION: '1', CLAUDE_PID: '9',
    CLAUDE_CONFIG_DIR: '/home/x/.claude-alt', CLAUDE_CODE_OAUTH_TOKEN: 'tok',
    ANTHROPIC_API_KEY: 'sk-ant', MAX_THINKING_TOKENS: '32000',
    ANTHROPIC_AUTH_TOKEN: 'bearer', ANTHROPIC_BASE_URL: 'https://elsewhere', ANTHROPIC_DEFAULT_SONNET_MODEL: 'x', ANTHROPIC_MODEL: 'y',
  };
  it('drops every CLAUDE* var except where the login lives', () => {
    const env = claudeChildEnv(parent);
    for (const k of ['CLAUDECODE', 'CLAUDE_EFFORT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_PID'])
      expect(env[k], k).toBeUndefined();
    expect(env.CLAUDE_CONFIG_DIR).toBe('/home/x/.claude-alt');
    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBe('tok');
    expect(env.PATH).toBe('/usr/bin');
    expect(env.HOME).toBe('/home/x');
  });
  it('disables auto-memory, drops an API key (the subscription pays) and an inherited thinking budget', () => {
    const env = claudeChildEnv(parent);
    expect(env.CLAUDE_CODE_DISABLE_AUTO_MEMORY).toBe('1');
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.MAX_THINKING_TOKENS).toBeUndefined();
  });
  it('drops EVERY ANTHROPIC_* var — each one reroutes or rebills the call', () => {
    const env = claudeChildEnv(parent);
    expect(Object.keys(env).filter(k => k.startsWith('ANTHROPIC_'))).toEqual([]);
  });
  it('sets the thinking budget it is given (0 = none)', () => {
    expect(claudeChildEnv(parent, 0).MAX_THINKING_TOKENS).toBe('0');
    expect(claudeChildEnv(parent, 1024).MAX_THINKING_TOKENS).toBe('1024');
  });
  it('never mutates the parent env', () => {
    claudeChildEnv(parent);
    expect(parent.CLAUDE_EFFORT).toBe('xhigh');
  });
});

describe('claudeOptsFor — the plan tier follows the writer unless set', () => {
  it('plan = writer by default; AIRAIDER_CLAUDE_PLAN overrides it', () => {
    const was = { p: process.env.AIRAIDER_CLAUDE_PLAN, w: process.env.AIRAIDER_CLAUDE_WRITER };
    delete process.env.AIRAIDER_CLAUDE_PLAN; delete process.env.AIRAIDER_CLAUDE_WRITER;
    expect(claudeOptsFor('plan', 'medium')).toEqual({ model: 'sonnet', effort: 'medium' });
    process.env.AIRAIDER_CLAUDE_PLAN = 'opus';
    expect(claudeOptsFor('plan', 'medium')).toEqual({ model: 'opus', effort: 'medium' });
    expect(claudeOptsFor('writer', 'low')).toEqual({ model: 'sonnet', effort: 'low' });
    if (was.p === undefined) delete process.env.AIRAIDER_CLAUDE_PLAN; else process.env.AIRAIDER_CLAUDE_PLAN = was.p;
    if (was.w === undefined) delete process.env.AIRAIDER_CLAUDE_WRITER; else process.env.AIRAIDER_CLAUDE_WRITER = was.w;
  });
});

describe('claudeOptsFor — the two tiers on the subscription', () => {
  const saved = { w: process.env.AIRAIDER_CLAUDE_WRITER, n: process.env.AIRAIDER_CLAUDE_NANO };
  afterEach(() => {
    if (saved.w === undefined) delete process.env.AIRAIDER_CLAUDE_WRITER; else process.env.AIRAIDER_CLAUDE_WRITER = saved.w;
    if (saved.n === undefined) delete process.env.AIRAIDER_CLAUDE_NANO; else process.env.AIRAIDER_CLAUDE_NANO = saved.n;
  });
  it('writer → sonnet at the tier effort (minimal/low → low, medium → medium)', () => {
    delete process.env.AIRAIDER_CLAUDE_WRITER;
    expect(claudeOptsFor('writer', 'low')).toEqual({ model: 'sonnet', effort: 'low' });
    expect(claudeOptsFor('writer', 'minimal')).toEqual({ model: 'sonnet', effort: 'low' });
    expect(claudeOptsFor('writer', 'medium')).toEqual({ model: 'sonnet', effort: 'medium' });
  });
  it('nano → haiku with thinking off (Haiku ignores --effort)', () => {
    delete process.env.AIRAIDER_CLAUDE_NANO;
    expect(claudeOptsFor('nano', 'minimal')).toEqual({ model: 'haiku', thinkingTokens: 0 });
  });
  it('env overrides; a haiku writer is bounded by a thinking budget', () => {
    process.env.AIRAIDER_CLAUDE_WRITER = 'haiku';
    process.env.AIRAIDER_CLAUDE_NANO = 'sonnet';
    expect(claudeOptsFor('writer', 'medium')).toEqual({ model: 'haiku', thinkingTokens: 4000 });
    expect(claudeOptsFor('writer', 'low')).toEqual({ model: 'haiku', thinkingTokens: 1024 });
    expect(claudeOptsFor('nano', 'minimal')).toEqual({ model: 'sonnet', effort: 'low' });
  });
});

describe('classifyCliError — one readable line', () => {
  it('names a usage limit', () => {
    expect(classifyCliError('Claude AI usage limit reached|1759400000').kind).toBe('limit');
    expect(classifyCliError("You've hit your limit · resets 3pm").kind).toBe('limit');
  });
  it('names a logged-out CLI, its own reason first (a job error is cut short)', () => {
    expect(classifyCliError('Invalid API key · Please run /login').kind).toBe('auth');
    const c = classifyCliError('Not logged in · Please run /login');
    expect(c.kind).toBe('auth');
    expect(c.line.slice(0, 70)).toContain('Not logged in');
  });
  it('anything else is a plain CLI error', () => {
    expect(classifyCliError('something broke').kind).toBe('cli');
  });
});

describe('aiKindFrom — the same picker for the server and the CLI', () => {
  it('mock by default, AIRAIDER_AI otherwise, CLI flags win', () => {
    expect(aiKindFrom(undefined).kind).toBe('mock');
    expect(aiKindFrom('openai').kind).toBe('openai');
    expect(aiKindFrom('claude').kind).toBe('claude');
    expect(aiKindFrom('mock', { claude: true }).kind).toBe('claude');
    expect(aiKindFrom('claude', { ai: true }).kind).toBe('openai');
  });
  it("'sonnet' is the designer's name for the Claude transport (env and --sonnet)", () => {
    expect(aiKindFrom('sonnet').kind).toBe('claude');
    expect(aiKindFrom('Sonnet').kind).toBe('claude');
    expect(aiKindFrom(undefined, { sonnet: true }).kind).toBe('claude');
  });
  it('an unknown value falls back to the mock, said out loud', () => {
    const r = aiKindFrom('claud');
    expect(r.kind).toBe('mock');
    expect(r.warning).toMatch(/not one of/);
  });
});

describe('stdin and stdout of the CLI', () => {
  it("a message opening with '/' is sent as text, not a slash command — nothing else changes", () => {
    expect(stdinSafe('/cost grim and dark please')).toBe(' /cost grim and dark please');
    expect(stdinSafe('{"seed":"x"}')).toBe('{"seed":"x"}');
    expect(stdinSafe('grim / dark')).toBe('grim / dark');
  });
  it('finds the result envelope past a stray stdout line', () => {
    const env = '{"type":"result","is_error":false,"result":"{\\"ok\\":true}"}';
    expect(findEnvelope(`Warning: a newer version is available\n${env}\n`)?.result).toBe('{"ok":true}');
    expect(findEnvelope(env)?.type).toBe('result');
    expect(findEnvelope('Error: not logged in')).toBeNull();
  });
});

describe('runClaude against a fake CLI (no real call)', () => {
  // a stand-in binary: echoes the stdin it got, after a stray stdout line, with the envelope split
  // in two writes INSIDE an em dash
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'airaider-fakeclaude-'));
  const bin = path.join(dir, 'claude');
  fs.writeFileSync(bin, `#!/usr/bin/env node
let input = '';
process.stdin.on('data', d => { input += d });
process.stdin.on('end', () => {
  const env = JSON.stringify({ type: 'result', is_error: false, total_cost_usd: 0.001,
    result: JSON.stringify({ card: 'A wolfman \u2014 caged.', stdin: input }),
    modelUsage: { 'claude-sonnet-5-5': { inputTokens: 10, outputTokens: 5 } } });
  const b = Buffer.from('Warning: a newer version is available\\n' + env + '\\n');
  const cut = b.indexOf(Buffer.from('\u2014')) + 1;
  process.stdout.write(b.subarray(0, cut));
  setTimeout(() => process.stdout.write(b.subarray(cut)), 60);
});
`, { mode: 0o755 });
  const saved = { bin: process.env.AIRAIDER_CLAUDE_BIN, cwd: process.env.AIRAIDER_CLAUDE_CWD };
  afterEach(() => {
    if (saved.bin === undefined) delete process.env.AIRAIDER_CLAUDE_BIN; else process.env.AIRAIDER_CLAUDE_BIN = saved.bin;
    if (saved.cwd === undefined) delete process.env.AIRAIDER_CLAUDE_CWD; else process.env.AIRAIDER_CLAUDE_CWD = saved.cwd;
  });
  it('a split multi-byte character, a stray line and a slash-led message all come through intact', async () => {
    process.env.AIRAIDER_CLAUDE_BIN = bin;
    process.env.AIRAIDER_CLAUDE_CWD = path.join(dir, 'cwd');
    const r = await runClaude('system', '/cost grim', { model: 'sonnet', effort: 'low' });
    expect(r.json?.card).toBe('A wolfman \u2014 caged.');
    expect(r.json?.stdin).toBe(' /cost grim');
    expect(r.model).toBe('claude-sonnet-5-5');
    expect(r.listCostUsd).toBe(0.001);
  });
});
