// STEP 2 harness — hit rate, not peak. Runs a prompt variant over REAL engine payloads
// (scripts/prosebench/pull-fixtures.json, captured by pullfixtures.ts), stratified across
// archetypes, one sample each. Lint output is LOG-ONLY telemetry (single-shot ruling) — it
// speeds the READING, it does not decide the pass.
// Usage: npx tsx scripts/pullbatch.ts <variantId> [n] [outfile]
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { VARIANTS } from './pullprompts.js';
import type { QuestWriteInput } from '../src/ai/provider.js';
import { lintCard } from './cardlint.js';
import { MOTIVES } from './motives.js';
import { MOTIVES2 } from './motives2.js';

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
// MOTIVE=1 — deal one CLIENT MOTIVE per card from a 120-entry pool (scripts/motives.ts). Seeded and
// deterministic here so a run is reproducible; the engine would use its own RNG. The reference
// individuates a job by the client's motive rather than by the craft — see prosebench/TRANSFER.md.
let motiveN = 0;
// VOICE=1 — deal a voice marker on a minority of cards, at the reference's measured rates on the
// 376 job-like rites: rhetorical question 13%, em-dash aside 21%, explicit narrator aside 6%.
// Per PROMPT_RULES §10 a cheap model reads a bare permission as a prohibition, so 'sometimes' must
// be dealt by the engine rather than left to the writer's judgement.
// (Ellipsis is 37% in the reference but the full-corpus read established it as a Chinese
// translation artefact, not craft — deliberately NOT dealt.)
// 'speech' added at the reference's measured rate for job-like rites: quoted speech 5%.
// NOTE both blind judges asked for speech on EVERY card; the corpus says 5%, so their advice is
// followed at the real frequency rather than as stated.
const VOICE = ['question','aside','dash','speech','','','','','','','','','','','',''] as const;
let voiceN = 0;
let actorN = 0;

const userOf = (i: QuestWriteInput) => JSON.stringify({
  archetype: i.archetype, location: i.location, rarity: i.rarity, level: i.level,
  slotCount: i.slotCount, ...(process.env.PAY_ARRAY === '3' ? {} : { rewardEnvelope: payOf(i) }),
  KEYWORDS: i.keywords?.join(', ') || undefined, gravity: i.gravity,
  placeNameSuggestions: i.placeNameSuggestions, opening: i.opening, intake: i.intake,
  ...(process.env.ODD_ACTOR === '1' && process.env.MOTIVE !== '3' ? { oddActor: ACTORS[actorN++ % ACTORS.length] } : {}),
  ...(process.env.MOTIVE === '1' ? { clientMotive: MOTIVES[(motiveN++ * 37) % MOTIVES.length] } : {}),
  ...(process.env.VOICE === '1' && VOICE[voiceN++ % VOICE.length] ? { voice: VOICE[(voiceN-1) % VOICE.length] } : {}),
  ...((process.env.MOTIVE === '2' || process.env.MOTIVE === '3') ? { ask: MOTIVES2[(motiveN++ * 17) % MOTIVES2.length].want, seen: MOTIVES2[((motiveN-1) * 17) % MOTIVES2.length].tell } : {}),
});

/** the calibrated quality reviewer (scripts/cardlint.ts) — log-only telemetry, but it is validated
 *  so that 100% of the designer's endorsed gold standard passes and 84% of the 1,426 official rite
 *  intros pass, while catching the jargon classes the designer flagged. */
const lint = (situation: string, i: QuestWriteInput) =>
  lintCard(situation, i).map(f => f.code + (f.detail ? `:${f.detail}` : ''));

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
