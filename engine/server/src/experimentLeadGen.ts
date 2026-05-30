// Experiment: compare two orderings for AI lead-board generation.
//
// Ordering A — numbers-first: game rolls rarity/archetype/region/dc/reward,
// AI fills hook + flavorDescription only.
// Ordering B — flavor-first: AI invents 5 lead concepts (archetype/region/
// hook), game post-assigns rarity/dc/reward based on archetype + AI-suggested
// rarity hint.
//
// Run with:
//   cd engine/server && OPENAI_API_KEY=$(grep OPENAI_API_KEY ~/.airaider/openai.env | cut -d= -f2) npx tsx src/experimentLeadGen.ts
//
// Usage: just eyeball the side-by-side output. The winner is whichever
// produces more interesting / on-vibe / varied lead hooks.

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import OpenAI from 'openai';
import { VOCAB_BLOCK } from './promptVocab.js';
import { ARCHETYPES, REGIONS, LEAD_RARITIES, type LeadArchetype, type LeadRarity } from '../../../prototype/src/leads.js';
import { rngFromString } from '../../../prototype/src/rng.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Need OPENAI_API_KEY (in .env or ~/.airaider/openai.env)');
  process.exit(1);
}

const MODEL = process.env.AIRAIDER_EXPERIMENT_MODEL ?? 'gpt-4o-mini';
const COUNT = 5;
const client = new OpenAI({ apiKey });

function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// ----- Ordering A: numbers-first, AI fills hook+flavor -----

interface OrderingAFrame {
  leadId: string;
  rarity: LeadRarity;
  archetype: LeadArchetype;
  region: string;
  dc: number;
  rewardGold: number;
}

function rollLeadFramesA(rng: () => number, n: number): OrderingAFrame[] {
  const weights: Record<LeadRarity, number> = { common: 60, uncommon: 28, rare: 10, legendary: 2 };
  const totalW = LEAD_RARITIES.reduce((s, k) => s + weights[k], 0);
  const out: OrderingAFrame[] = [];
  for (let i = 0; i < n; i++) {
    let r = rng() * totalW;
    let rarity: LeadRarity = 'common';
    for (const x of LEAD_RARITIES) { r -= weights[x]; if (r < 0) { rarity = x; break; } }
    const archetype = pickFrom(rng, ARCHETYPES);
    const region = pickFrom(rng, REGIONS);
    const dc = 1 + Math.floor(rng() * 5);
    const mult: Record<LeadRarity, number> = { common: 4, uncommon: 6, rare: 9, legendary: 14 };
    const rewardGold = dc * mult[rarity];
    out.push({ leadId: `L${i}`, rarity, archetype, region, dc, rewardGold });
  }
  return out;
}

const SYSTEM_A = `You are the lead-board writer for a grimdark mercenary-fort game.
Tone: terse, mortal, mud-and-blood, low-medieval, no glory, no high-fantasy.
The ENGINE has decided each lead's rarity/archetype/region/DC/reward. You write the HOOK only.
A hook is ONE specific sentence the lead-board displays. It must:
- Name the specific thing on offer (a person, an object, a sum, a corpse, an heirloom, a vow). NEVER use "the prize/the goods/the target".
- Reference the region by name at least implicitly.
- Match archetype (raid=violent loot, recovery=fetch something, contract=protect/escort, heist=stealth, captive=take someone alive).
- Match rarity (common=mundane village stakes, legendary=mythic/cursed/historical).
- DO NOT use the words "common/uncommon/rare/legendary/mythic" in the hook itself — those are mechanical labels, not narrative words.
- DO NOT use words like "epic/heroic/glorious/destined" — this is grimdark.
- Include one sensory or concrete proper noun beyond the region.

EXAMPLES (study the *style* — invent fresh content, never reuse these names or objects):
- legendary/captive @ <some-region> → "Take Aldric the Hollow alive — the prophet-touched heretic last seen preaching in the drowned chapel."
- common/heist @ <some-region> → "Lift the tithe-box from the chapel before second bell — six silver shields, the priest counts every coin."
- rare/recovery @ <some-region> → "Recover the bone-locked St. Hadric reliquary from the wreck — the abbess pays in old Imperial marks."
- uncommon/contract @ <some-region> → "Escort the salt-trader Helga Vass through the moor by night; her last guard was found face-down in the heather."
- common/raid @ <some-region> → "Burn the deserters' camp in the frost — eight men, mostly drunk, with a stolen mule and a chest of moldy bread."
IMPORTANT: Names like Aldric, St. Hadric, Helga Vass are EXAMPLES ONLY. Invent your own names and objects for each hook.

${VOCAB_BLOCK}`;

async function runOrderingA(): Promise<void> {
  const rng = rngFromString('experiment-leadgen-A-v1');
  const frames = rollLeadFramesA(rng, COUNT);
  const userPrompt = `Write a hook for each of these ${COUNT} leads. Return JSON: {"hooks":[{"leadId":"L0","hook":"..."},...]}.\n\n` +
    frames.map((f) => `- ${f.leadId}: rarity=${f.rarity} archetype=${f.archetype} region="${f.region}" dc=${f.dc} reward=${f.rewardGold}g`).join('\n');

  const t0 = Date.now();
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.9, max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_A },
      { role: 'user', content: userPrompt },
    ],
  });
  const elapsed = Date.now() - t0;
  const content = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { hooks: { leadId: string; hook: string }[] };
  const byId = new Map(parsed.hooks.map((h) => [h.leadId, h.hook]));

  console.log(`===== ORDERING A: numbers-first (${MODEL}) =====`);
  for (const f of frames) {
    console.log(`[${f.leadId}] ${f.rarity}/${f.archetype} @ ${f.region}  DC ${f.dc} → ${f.rewardGold}g`);
    console.log(`    "${byId.get(f.leadId) ?? '<missing>'}"`);
  }
  console.log(`  → ${elapsed}ms | tokens in:${resp.usage?.prompt_tokens} cached:${resp.usage?.prompt_tokens_details?.cached_tokens ?? 0} out:${resp.usage?.completion_tokens}`);
}

// ----- Ordering B: flavor-first, AI invents leads -----

const SYSTEM_B = `You are the lead-board writer for a grimdark mercenary-fort game.
Tone: terse, mortal, mud-and-blood, low-medieval, no glory, no high-fantasy.
Invent ${COUNT} distinct lead concepts. For each, decide:
- archetype: one of raid/recovery/contract/heist/captive
- region: pick from the REGIONS list
- rarityHint: one of common/uncommon/rare/legendary (common ≈ mundane stakes, legendary ≈ mythic/cursed)
- hook: one specific sentence (see hook rules below)

Hook rules:
- Name the specific thing on offer (person, object, sum, corpse, heirloom, vow). NEVER use "the prize/the goods/the target".
- Reference the region by name.
- Match archetype.
- Include one sensory or concrete proper noun beyond the region.

${VOCAB_BLOCK}`;

async function runOrderingB(): Promise<void> {
  const userPrompt = `Generate ${COUNT} distinct, varied leads. Return JSON:\n{"leads":[{"leadId":"L0","archetype":"...","region":"...","rarityHint":"...","hook":"..."},...]}`;

  const t0 = Date.now();
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.9, max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_B },
      { role: 'user', content: userPrompt },
    ],
  });
  const elapsed = Date.now() - t0;
  const content = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { leads: { leadId: string; archetype: string; region: string; rarityHint: string; hook: string }[] };

  // Game post-processing: assign dc + rewardGold from rarityHint
  const rng = rngFromString('experiment-leadgen-B-v1');
  const mult: Record<string, number> = { common: 4, uncommon: 6, rare: 9, legendary: 14 };

  console.log(`\n===== ORDERING B: AI invents leads (${MODEL}) =====`);
  for (const l of parsed.leads) {
    const valid = (ARCHETYPES as readonly string[]).includes(l.archetype) ? '' : ' ⚠invalid-archetype';
    const validR = (REGIONS as readonly string[]).includes(l.region) ? '' : ' ⚠invalid-region';
    const validRar = (LEAD_RARITIES as readonly string[]).includes(l.rarityHint) ? '' : ' ⚠invalid-rarity';
    const dc = 1 + Math.floor(rng() * 5);
    const rewardGold = dc * (mult[l.rarityHint] ?? 4);
    console.log(`[${l.leadId}] ${l.rarityHint}${validRar}/${l.archetype}${valid} @ ${l.region}${validR}  DC ${dc} → ${rewardGold}g`);
    console.log(`    "${l.hook}"`);
  }
  console.log(`  → ${elapsed}ms | tokens in:${resp.usage?.prompt_tokens} cached:${resp.usage?.prompt_tokens_details?.cached_tokens ?? 0} out:${resp.usage?.completion_tokens}`);
}

(async () => {
  await runOrderingA();
  await runOrderingB();
  // Second run of A to verify caching
  console.log(`\n===== ORDERING A run #2 (cache check, ${MODEL}) =====`);
  await runOrderingA();
})().catch((e) => { console.error(e); process.exit(1); });
