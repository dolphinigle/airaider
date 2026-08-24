// STEP 2 harness — hit rate, not peak. Runs a prompt variant over REAL engine payloads
// (scripts/prosebench/pull-fixtures.json, captured by pullfixtures.ts), stratified across
// archetypes, one sample each. Lint output is LOG-ONLY telemetry (single-shot ruling) — it
// speeds the READING, it does not decide the pass.
// Usage: npx tsx scripts/pullbatch.ts <variantId> [n] [outfile]
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { VARIANTS } from './pullprompts.js';
import type { QuestWriteInput } from '../src/ai/provider.js';

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

const variantId = process.argv[2] ?? 'P10';
const n = Number(process.argv[3] ?? 14);
const OUT = process.argv[4] ?? `/home/irvan/airaider/v3/scripts/prosebench/batch-${variantId}.md`;
const system = VARIANTS[variantId];
if (!system) throw new Error(`unknown variant ${variantId}`);

const all: QuestWriteInput[] = JSON.parse(
  fs.readFileSync('/home/irvan/airaider/v3/scripts/prosebench/pull-fixtures.json', 'utf8'));
// framedCharacter payloads need a quarryTags output this lab does not yet produce — KNOWN GAP,
// they are a later sub-step, not silently dropped from the denominator.
const pool = all.filter(i => !i.framedCharacter);

// stratify: round-robin across archetypes so one kind cannot dominate the rate
const byArch = new Map<string, QuestWriteInput[]>();
for (const i of pool) {
  const k = i.archetype ?? '—';
  if (!byArch.has(k)) byArch.set(k, []);
  byArch.get(k)!.push(i);
}
const picks: QuestWriteInput[] = [];
for (let r = 0; picks.length < n; r++) {
  let added = false;
  for (const [, list] of [...byArch].sort()) {
    if (list[r] && picks.length < n) { picks.push(list[r]!); added = true }
  }
  if (!added) break;
}

// PAY_ARRAY=1 — lab test of the §0 input-shaping fix: the engine joins pre-shaped pay glosses
// with ' + ' (game.ts:907), yielding a string that LOOKS like prose but cannot be pasted whole.
// Sending the kinds as an ARRAY makes the shorthand visibly not-prose.
// PAY_ARRAY=2 — the REAL input fix: the relic glosses are authored PROSE the engine pre-shaped
// "to read whole if pasted", which directly contradicts any rule telling the writer not to paste.
// Send bare non-prose tokens instead and make the writer render the pay itself.
const TOKEN: Record<string, string> = {
  'coin': 'coin',
  'a person who may join the company': 'a recruit',
  'the pick of what the job turns up': 'salvage-rights',
  'first claim on what the road yields': 'salvage-rights',
  'whatever worth the work shakes loose': 'salvage-rights',
  'a person taken': 'a captive',
};
const payOf = (i: QuestWriteInput) => {
  const parts = i.rewardEnvelope.split(' + ');
  if (process.env.PAY_ARRAY === '2') return parts.map(p => TOKEN[p] ?? p);
  if (process.env.PAY_ARRAY === '1') return parts;
  return i.rewardEnvelope;
};

// ODD_ACTOR=1 — lab test of an ENGINE-DEALT rotation. The odd act landed on the CLIENT 14/14;
// a cheap model cannot vary across independent calls, and this project already measured that
// variety belongs to input shaping, not to a prompt directive telling it to vary.
// TOKENS, not prose — the first attempt used readable phrases and the model pasted them straight
// in as sentence subjects ("The person who is gone dragged..."). Identical failure to the pay
// envelope: ANY prose-shaped field gets pasted. The prompt maps these tokens to people itself.
// LETTERS — 'client' leaked into prose as a literal word. A bare letter cannot be pasted as English.
const ACTORS = ['A', 'B', 'C'];
let actorN = 0;

const userOf = (i: QuestWriteInput) => JSON.stringify({
  archetype: i.archetype, location: i.location, rarity: i.rarity, level: i.level,
  slotCount: i.slotCount, ...(process.env.PAY_ARRAY === '3' ? {} : { rewardEnvelope: payOf(i) }),
  KEYWORDS: i.keywords?.join(', ') || undefined, gravity: i.gravity,
  placeNameSuggestions: i.placeNameSuggestions, opening: i.opening, intake: i.intake,
  ...(process.env.ODD_ACTOR === '1' ? { oddActor: ACTORS[actorN++ % ACTORS.length] } : {}),
});

/** log-only lint — objective smells, counted; the PASS is still a human read */
function lint(s: string, i: QuestWriteInput): string[] {
  const f: string[] = [];
  const w = s.split(/\s+/).filter(Boolean).length;
  if (w > 95) f.push(`long:${w}w`);
  const sents = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sents.length > 6) f.push(`sents:${sents.length}`);
  if (/\b(I|my|we|our)\b/.test(s)) f.push('first-person');
  if (!/\b(he|she|they|him|her|them|his|their)\b/i.test(s)) f.push('no-pronouns');
  if (/\b(no one|nobody|none) (can|could|will|would) (say|tell|account|explain)/i.test(s)) f.push('cannot-say-tag');
  for (const piece of i.rewardEnvelope.split(' + ')) {
    if (piece.length > 6 && s.toLowerCase().includes(piece.toLowerCase())) f.push('envelope-echo');
  }
  if (i.intake && s.toLowerCase().includes(i.intake.toLowerCase().slice(0, 18))) f.push('intake-echo');
  if (/^(word|news|a messenger|a rider|a runner|at (dawn|dusk|first light|nightfall))/i.test(s.trim())) f.push('weak-open');
  if (/\b(is|are|was|were) (suspected|thought|believed|rumou?red) to\b/i.test(s)) f.push('hedge');
  if (/\b(wants?|needs?) it (fixed|put right|set right|ended|dealt with)\b/i.test(s)) f.push('wants-it-fixed');
  if (/\bledger|registry|record-book\b/i.test(s)) f.push('account-book');
  return f;
}

const client = new OpenAI({ apiKey: loadKey() });
const md: string[] = [`# batch ${variantId} — n=${picks.length}, real engine payloads\n`];
const lintTally: Record<string, number> = {};

const results = await Promise.all(picks.map(async (i, idx) => {
  const res = await client.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'system', content: system }, { role: 'user', content: userOf(i) }],
    response_format: { type: 'json_object' },
    reasoning_effort: 'low',
  } as never) as { choices: { message: { content: string } }[] };
  let o: { title?: string; situation?: string; job?: string };
  try { o = JSON.parse(res.choices[0]!.message.content ?? '{}') } catch { return { idx, i, bad: true } }
  return { idx, i, o };
}));

for (const r of results.sort((a, b) => a.idx - b.idx)) {
  if (!('o' in r) || !r.o) { md.push(`## ${r.idx + 1} — PARSE FAIL\n`); continue }
  const { i, o } = r;
  const flags = lint(o.situation ?? '', i);
  for (const f of flags) lintTally[f.split(':')[0]!] = (lintTally[f.split(':')[0]!] ?? 0) + 1;
  const w = (o.situation ?? '').split(/\s+/).filter(Boolean).length;
  md.push(`## ${r.idx + 1} · ${i.archetype} · ${i.gravity} · slots ${i.slotCount} · pay "${i.rewardEnvelope}" · ${w}w`);
  md.push(`*place:* ${i.location}`);
  md.push(`*intake:* ${i.intake ?? '—'}${i.opening ? ` · *spark:* ${i.opening.spark}` : ''}`);
  md.push(`*keywords:* ${i.keywords?.join(', ') ?? '—'}`);
  md.push(`\n**${o.title}**\n\n${o.situation}\n\n\`JOB:\` ${o.job}`);
  md.push(flags.length ? `\n\`lint:\` ${flags.join(' · ')}\n` : '\n`lint:` clean\n');
}
md.push(`\n## lint tally (log-only)\n${Object.entries(lintTally).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`).join(' · ') || 'none'}`);
fs.writeFileSync(OUT, md.join('\n'));
console.log(md.join('\n'));
