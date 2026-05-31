// Latency benchmark: how long does a bible-sized JSON call take per model?
// Runs 3 trials × N models on the same prompt; reports min/median/max wall-clock.
//
// Usage: npx tsx src/latencyBenchmark.ts

import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) { console.error('Need OPENAI_API_KEY'); process.exit(1); }

const MODELS = [
  { name: 'gpt-5-mini', extra: {} as Record<string, unknown> },
  { name: 'gpt-5-nano', extra: {} },
  { name: 'gpt-5-mini', label: 'gpt-5-mini-low', extra: { reasoning_effort: 'low' } },
  { name: 'gpt-5-nano', label: 'gpt-5-nano-low', extra: { reasoning_effort: 'low' } },
  { name: 'gpt-4.1', extra: {} },
  { name: 'gpt-4.1-mini', extra: {} },
];
const TRIALS = 3;

const SYSTEM = `You are a writers'-room author for a grimdark mercenary-fort game. Output a chain bible as JSON.

Schema:
{
  "title": "<2-8 word concrete title>",
  "controllingIdea": "<one sentence moral claim>",
  "leadBoardBlurb": "<1-2 sentences shown to the player BEFORE they meet the cast — concrete physical lead, no proper nouns of unknown people>",
  "cast": [
    {"name": "<period name>", "role": "<protagonist|antagonist|complication|ally>", "want": "<one line>", "need": "<one line>", "ghost": "<past wound>", "lie": "<self-deception>", "secret": "<concealed thing>"}
  ],
  "surfaceSituation": "<2-3 sentences>",
  "hiddenSituation": "<3-5 sentences>",
  "trajectory": "<3-5 sentences ending with reward delivery>",
  "setupPayoffs": [{"plant": "<specific>", "payoff": "<specific>"}]
}

Cast: 3 members. setupPayoffs: 3 entries.
BANNED TOKENS: weight, weighed, shadow, burden, ghosts, fate, destined, destiny.
Output JSON only.`;

const USER = `Region: Mireford (grimdark, river-and-marsh borderland).
Rarity: rare.
Reward: a captive ends in the fort dungeon.
Inciting hint: a bargeman with a missing finger turns up at Mireford's gate at dawn asking after a wreck three nights ago he claims he was forced to crew.

Author the bible now.`;

async function trial(client: OpenAI, model: string, extra: Record<string, unknown>): Promise<{ ms: number; tokensOut: number; ok: boolean; errMsg?: string }> {
  const t0 = Date.now();
  try {
    const resp = (await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: USER },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 8000,
      stream: false,
      ...extra,
    } as Parameters<typeof client.chat.completions.create>[0])) as unknown as {
      usage?: { completion_tokens?: number };
      choices: Array<{ message?: { content?: string } }>;
    };
    const ms = Date.now() - t0;
    const tokensOut = resp.usage?.completion_tokens ?? 0;
    const content = resp.choices[0]?.message?.content ?? '';
    try { JSON.parse(content); } catch { return { ms, tokensOut, ok: false, errMsg: 'non-JSON' }; }
    return { ms, tokensOut, ok: true };
  } catch (e) {
    return { ms: Date.now() - t0, tokensOut: 0, ok: false, errMsg: (e as Error).message.slice(0, 80) };
  }
}

async function main(): Promise<void> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  console.log(`Latency benchmark — ${MODELS.length} models × ${TRIALS} trials each\n`);
  const rows: Array<{ label: string; samples: number[]; tokens: number[]; failures: string[] }> = [];
  for (const m of MODELS) {
    const label = m.label ?? m.name;
    console.log(`[${label}]`);
    const samples: number[] = [];
    const tokens: number[] = [];
    const failures: string[] = [];
    for (let i = 0; i < TRIALS; i++) {
      const r = await trial(client, m.name, m.extra);
      const sec = (r.ms / 1000).toFixed(1);
      if (r.ok) {
        console.log(`  trial ${i + 1}: ${sec}s  out=${r.tokensOut} tok`);
        samples.push(r.ms);
        tokens.push(r.tokensOut);
      } else {
        console.log(`  trial ${i + 1}: ${sec}s FAILED — ${r.errMsg}`);
        failures.push(r.errMsg ?? 'unknown');
      }
    }
    rows.push({ label, samples, tokens, failures });
  }

  console.log(`\n==== SUMMARY (wall-clock seconds) ====`);
  console.log('model'.padEnd(22) + 'min    median  max     avg-tok-out  fails');
  for (const r of rows) {
    if (r.samples.length === 0) {
      console.log(r.label.padEnd(22) + '-- all failed --  ' + r.failures.join(' | '));
      continue;
    }
    const sorted = [...r.samples].sort((a, b) => a - b);
    const min = (sorted[0] / 1000).toFixed(1);
    const med = (sorted[Math.floor(sorted.length / 2)] / 1000).toFixed(1);
    const max = (sorted[sorted.length - 1] / 1000).toFixed(1);
    const avgTok = Math.round(r.tokens.reduce((a, b) => a + b, 0) / r.tokens.length);
    console.log(r.label.padEnd(22) + `${min}s`.padEnd(7) + `${med}s`.padEnd(8) + `${max}s`.padEnd(8) + `${avgTok}`.padEnd(13) + `${r.failures.length}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
