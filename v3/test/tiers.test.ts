// The model tiers (Phase 2 Step 3): a fake Claude CLI records what each call ran on. The saga plan rides the PLAN tier at
// medium effort, outline/card/report the WRITER tier at low, themeRoll and select the mechanical tier; the player's
// direction never reaches a saga system prompt (it rides in the payload); the mock's saga call draws nothing from the
// game's rng. No real CLI call.
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { z } from 'zod';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { MockProvider } from '../src/ai/mock.js';
import { readCallLog } from '../src/ai/calllog.js';
import { zPlanOut, zCardOut, zReportOut, zOutlineOut } from '../src/ai/storyteller.js';
import type { SagaCall } from '../src/ai/provider.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'airaider-tiers-'));
const argLog = path.join(dir, 'args.jsonl');
const bin = path.join(dir, 'claude');
// a stand-in CLI: logs its model, effort and system prompt; answers one object every schema here accepts
fs.writeFileSync(bin, `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
const at = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined };
let input = '';
process.stdin.on('data', d => { input += d });
process.stdin.on('end', () => {
  fs.appendFileSync(${JSON.stringify(argLog)}, JSON.stringify({ model: at('--model'), effort: at('--effort') ?? null, thinking: process.env.MAX_THINKING_TOKENS ?? null, system: fs.readFileSync(at('--system-prompt-file'), 'utf8'), user: input }) + '\\n');
  const reply = { card: 'A card.', before: 'Before.', after: 'After.', summary: 'Done.', lines: ['hopes it helps'], wants: ['cozy'], flavorLine: 'A line.', ids: [], title: 'T' };
  process.stdout.write(JSON.stringify({ type: 'result', is_error: false, total_cost_usd: 0, result: JSON.stringify(reply), modelUsage: { [at('--model')]: { inputTokens: 1, outputTokens: 1 } } }) + '\\n');
});
`, { mode: 0o755 });

const ENV = ['AIRAIDER_CLAUDE_BIN', 'AIRAIDER_CLAUDE_CWD', 'AIRAIDER_CLAUDE_PLAN', 'AIRAIDER_CLAUDE_WRITER', 'AIRAIDER_CLAUDE_NANO', 'AIRAIDER_CALL_LOG'] as const;
const saved = Object.fromEntries(ENV.map(k => [k, process.env[k]]));
afterEach(() => { for (const k of ENV) if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k] });
const call = (template: SagaCall['template'], tier: SagaCall['tier'], effort: SagaCall['effort'], schema: z.ZodTypeAny, payload: Record<string, unknown> = { job: 'Go.' }, flags: string[] = []): SagaCall =>
  ({ template, tier, effort, schema, payload, flags, vars: template === 'card' ? { MAX: 70 } : template === 'report' ? { B: 30, A: 45 } : {}, floor: () => ({}) });

describe('tiers on the Claude transport (a fake CLI)', () => {
  it('plan → the plan tier at medium; outline, card, report → the writer at low; themeRoll, select → the mechanical tier', async () => {
    fs.rmSync(argLog, { force: true });
    Object.assign(process.env, { AIRAIDER_CLAUDE_BIN: bin, AIRAIDER_CLAUDE_CWD: path.join(dir, 'cwd'), AIRAIDER_CLAUDE_PLAN: 'opus', AIRAIDER_CLAUDE_WRITER: 'sonnet', AIRAIDER_CLAUDE_NANO: 'haiku', AIRAIDER_CALL_LOG: path.join(dir, 'calls.jsonl') });
    const ai = makeOpenAiProvider({ transport: 'claude' });
    ai.setDirection?.({ text: 'grim', guidance: 'UNIQUE-GUIDANCE-MARK', npc: { prefer: [], avoid: [] }, recruit: { prefer: [], avoid: [] }, avoid: ['UNIQUE-AVOID-MARK'] });
    await ai.sagaCall(call('plan', 'plan', 'medium', zPlanOut, { seed: 'a bell', direction: 'Grim. Keep out: gore.' }, ['types', 'direction']));
    await ai.sagaCall(call('outline', 'writer', 'low', zOutlineOut, { asker: 'Mira, a miller', wants: 'to get the bell back', jobs: ['Go.'] }));
    await ai.sagaCall(call('card', 'writer', 'low', zCardOut, { job: 'Go.', direction: 'Grim.' }, ['later', 'latest', 'direction']));
    await ai.sagaCall(call('report', 'writer', 'low', zReportOut, { card: 'c', job: 'Go.' }, ['saga', 'moved']));
    await ai.themeRoll({ roomType: 'hall', roomName: 'Hall', style: null, hintWords: ['cozy'], vocabulary: ['cozy', 'grand'] });
    await ai.select({ purpose: 'p', candidates: [], max: 1 });
    const got = fs.readFileSync(argLog, 'utf8').trim().split('\n').map(l => JSON.parse(l) as { model: string; effort: string | null; thinking: string | null; system: string; user: string });
    expect(got.map(x => x.model)).toEqual(['opus', 'sonnet', 'sonnet', 'sonnet', 'haiku', 'haiku']);
    expect(got.slice(0, 4).map(x => x.effort)).toEqual(['medium', 'low', 'low', 'low']);
    expect(got.slice(4).map(x => x.thinking)).toEqual(['0', '0']);
    // the direction rides in the saga payload, never in a saga system prompt (byte-stable per flag set)
    for (const x of got.slice(0, 4)) { expect(x.system).not.toContain('UNIQUE-GUIDANCE-MARK'); expect(x.system).not.toContain('CAMPAIGN DIRECTION') }
    expect(got[0]!.user).toContain('Keep out: gore.');
    // ...while the old directed calls still get it
    expect(got[4]!.system).toContain('UNIQUE-GUIDANCE-MARK');
    // the call log labels each saga call by its template and flags
    const log = readCallLog(path.join(dir, 'calls.jsonl'));
    expect(log.slice(0, 4).map(l => [l.purpose, l.template, l.flags])).toEqual([
      ['plan', 'plan', ['direction', 'types']], ['outline', 'outline', []], ['card', 'card', ['direction', 'later', 'latest']], ['report', 'report', ['moved', 'saga']],
    ]);
    expect(log[4]!.template).toBeUndefined();
  });
});

describe('the mock\'s saga call', () => {
  it('answers with the floor, schema-parsed, and draws nothing from the game rng', async () => {
    const m = new MockProvider(9);
    const rngOf = () => (m as unknown as { rng: { state(): unknown } }).rng.state();
    const before = rngOf();
    const out = await m.sagaCall({ ...call('card', 'writer', 'low', zCardOut), floor: () => ({ card: 'The floor wrote this.' }) });
    expect(out).toEqual({ card: 'The floor wrote this.' });
    expect(rngOf()).toEqual(before);
    await expect(m.sagaCall({ ...call('card', 'writer', 'low', zCardOut), floor: () => ({ nope: 1 }) })).rejects.toThrow();
  });
});
