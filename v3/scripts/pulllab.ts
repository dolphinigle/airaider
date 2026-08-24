// PULL LAB (2026-08-24) — capability probe: can gpt-5-mini write a MOTIVATING routine card?
// Fixed inputs = the real q9 "Left Washing at Peatmoss" facts. Same model + same reasoning_effort
// as shipped (gpt-5-mini / low) so a win here is a PROMPTING win, not a compute win.
// Usage: npx tsx scripts/pulllab.ts <variantId> [n]
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { VARIANTS } from './pullprompts.js';

function loadKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const p of ['/home/irvan/airaider/.env', `${process.env.HOME}/.airaider/openai.env`]) {
    try {
      const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*"?([^"\n]+)"?/);
      if (m) return m[1]!.trim();
    } catch { /* next */ }
  }
  throw new Error('no key');
}

// the engine payload for q9, as the shipped writeQuest sends it
export const USER_INPUT = {
  archetype: 'contract',
  location: 'Peatmoss — sodden peat country under the forests: cut banks, black water, and the loggers\' winter huts where the cutting crews live out the season.',
  rarity: 'common',
  level: 1,
  slotCount: 1,
  // the REAL engine envelope for a gold-only job: one word. (game.ts:907 — kinds mapped to
  // world words, joined by ' + '. q9 was rewardSpecs:[{gold,27}] ⇒ exactly this.)
  rewardEnvelope: 'coin',
  KEYWORDS: 'washing, absence, peat, lizard, cold',
  gravity: 'small',
  placeNameSuggestions: ['Peatmoss', 'the winter huts', 'Rimebarrow'],
  opening: { spark: 'laundry · unclaimed · days · quiet' },
  intake: 'the foreman of the cutting crew at Peatmoss sent word to the fort',
};

// second fixture — a DIFFERENT situation, to tell prompt-borne templates apart from
// artifacts of sampling one input repeatedly.
export const USER_INPUT_B = {
  archetype: 'rescue',
  location: 'Rimebarrow — high chalk downs above the tree line: sheep tracks, wind-scoured barrows, and a drovers\' road running down to the salt market.',
  rarity: 'common', level: 1, slotCount: 1,
  rewardEnvelope: 'coin',
  KEYWORDS: 'debt, dog, salt, night',
  gravity: 'small',
  placeNameSuggestions: ['Rimebarrow', 'Coldpen'],
  opening: { spark: 'gate · open · morning · none' },
  intake: 'a drover stopped at the fort gate on his way down to market',
};

const variantId = process.argv[2] ?? 'P1';
const n = Number(process.argv[3] ?? 3);
const v = VARIANTS[variantId];
if (!v) throw new Error(`unknown variant ${variantId} (have: ${Object.keys(VARIANTS).join(', ')})`);

const client = new OpenAI({ apiKey: loadKey() });
const user = JSON.stringify(process.argv[4] === 'B' ? USER_INPUT_B : USER_INPUT);

const outs: string[] = [];
for (let i = 0; i < n; i++) {
  const res = await client.chat.completions.create({
    model: process.env.AIRAIDER_WRITER_MODEL || 'gpt-5-mini',
    messages: [{ role: 'system', content: v }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    reasoning_effort: (process.env.EFFORT as 'low') || 'low',
  } as never) as { choices: { message: { content: string } }[]; usage?: { completion_tokens?: number } };
  const raw = res.choices[0]!.message.content ?? '{}';
  let o: { title?: string; situation?: string; job?: string };
  try { o = JSON.parse(raw) } catch { console.log('PARSE FAIL:', raw.slice(0, 400)); continue }
  const words = (o.situation ?? '').split(/\s+/).filter(Boolean).length;
  const block = `\n──────── ${variantId} #${i + 1} ──── ${words}w\n═══ ${o.title} ═══\n${o.situation}\n\nJOB: ${o.job}`;
  console.log(block);
  outs.push(block);
}
fs.writeFileSync(`/tmp/claude-1000/-home-irvan-airaider/c11ed003-98fa-486f-a74e-668ad107c135/scratchpad/lab/${variantId}${process.argv[4] === 'B' ? '-B' : ''}.txt`, outs.join('\n'));
