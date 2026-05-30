// Experiment: compare two strategies for AI unit generation.
//
// Context: when a lead resolves as recruit-reward OR capture-outcome, the
// game needs to generate a new unit (mercenary or captive). Engine owns
// numeric stats + rarity; AI owns name + personality tags + backstory.
//
// Strategy 1 — seed-then-expand: game seeds 2 archetype-appropriate tags
//   based on the lead's archetype/blurb, AI adds 3 more from vocab plus
//   name + backstory.
// Strategy 2 — free-then-constrain: AI picks all 5 tags freely from vocab
//   given the lead context, then game post-validates that the archetype
//   constraint is met (would re-roll if not).
//
// Run with:
//   cd engine/server && OPENAI_API_KEY=... AIRAIDER_EXPERIMENT_MODEL=gpt-4o-mini npx tsx src/experimentUnitGen.ts

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import OpenAI from 'openai';
import { VOCAB_BLOCK, VALID_TAG_IDS, TAGS_BY_MUTEX } from './promptVocab.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { console.error('Need OPENAI_API_KEY'); process.exit(1); }
const MODEL = process.env.AIRAIDER_EXPERIMENT_MODEL ?? 'gpt-4o-mini';
const client = new OpenAI({ apiKey });

interface LeadCtx {
  archetype: string;
  region: string;
  rarity: string;
  blurb: string;
  /** game-decided: how many total tags this unit should have. */
  tagCount: number;
  /** Strategy 1 only: tags the game pre-seeds based on archetype context. */
  seedTags?: string[];
  /** Strategy 2 only: a tag the AI MUST include (archetype constraint). */
  requiredTag?: string;
}

// Hand-curated test cases — diverse archetypes + rarities.
const CASES: LeadCtx[] = [
  { archetype: 'raid',     region: 'Greythorn', rarity: 'uncommon',  blurb: 'ambush a band of green-cloaked knights on the old toll road', tagCount: 5,
    seedTags: ['bg:soldier', 'phys:muscular'], requiredTag: 'bg:soldier' },
  { archetype: 'heist',    region: 'Ironvale',  rarity: 'common',    blurb: 'a quick lift from the magistrate\'s study before second bell', tagCount: 5,
    seedTags: ['phys:quick', 'pers:greedy'], requiredTag: 'phys:quick' },
  { archetype: 'captive',  region: 'Eastfen',   rarity: 'legendary', blurb: 'take alive the prophet who set the marsh-folk burning their lords', tagCount: 6,
    seedTags: ['bg:priest', 'trait:prophet-touched'], requiredTag: 'bg:priest' },
  { archetype: 'recovery', region: 'Saltmire',  rarity: 'rare',      blurb: 'recover the bone-locked reliquary lost when the abbey burned', tagCount: 5,
    seedTags: ['bg:scholar', 'pers:cynical'], requiredTag: 'bg:scholar' },
  { archetype: 'contract', region: 'Blackmoor', rarity: 'uncommon',  blurb: 'escort the salt-trader Helga Vass through the moor by night', tagCount: 5,
    seedTags: ['bg:hunter', 'trait:night-eyed'], requiredTag: 'trait:night-eyed' },
];

// ------------ Strategy 1: seed-then-expand ------------

const STRAT1_SYSTEM = `You generate flavor for a grimdark mercenary/captive in a low-medieval fort game.
Voice: terse, mortal, mud-and-blood. Pan-european (Germanic/Celtic/Slavic feel). No grand destiny, no high-fantasy.

You are given:
- A LEAD context (archetype, region, rarity, blurb)
- A list of SEED TAGS the engine has already pinned to this unit
- A target tag count

Your job:
- Add ADDITIONAL tag IDs from the vocab below until total tag count is reached. Each added tag must be VALID and chosen for thematic fit with seed tags + lead context.
- Respect mutex groups: tags sharing [mutex:X] are mutually exclusive; never add a tag whose mutex group already has a seed tag.
- Invent a name (1 first name + optional epithet/clan, e.g. "Marek of the Fen") that matches cultural register.
- Write a 1-2 sentence backstory anchored on the lead context + tags. No grand destiny. Mention how a couple of tags shaped them concretely (e.g. "the bog still on him; flinches at lanterns").

Output JSON: { "addedTags": ["...", "..."], "name": "...", "backstory": "..." } where addedTags is the IDs you added (do NOT echo seed tags).

${VOCAB_BLOCK}`;

interface Strat1Out { addedTags: string[]; name: string; backstory: string }

async function runStrategy1(c: LeadCtx): Promise<{ tags: string[]; name: string; backstory: string; usage: any; ms: number }> {
  const need = c.tagCount - (c.seedTags?.length ?? 0);
  const userPrompt = `LEAD: ${c.archetype}/${c.rarity} @ ${c.region}\nBLURB: "${c.blurb}"\nSEED TAGS (already pinned): ${(c.seedTags ?? []).join(', ')}\nADD ${need} more tag ids to reach total ${c.tagCount}.\nReturn JSON: { "addedTags": [...], "name": "...", "backstory": "..." }`;
  const t0 = Date.now();
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.9, max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: STRAT1_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });
  const ms = Date.now() - t0;
  const out = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as Strat1Out;
  return {
    tags: [...(c.seedTags ?? []), ...(out.addedTags ?? [])],
    name: out.name, backstory: out.backstory,
    usage: resp.usage, ms,
  };
}

// ------------ Strategy 2: free-then-constrain ------------

const STRAT2_SYSTEM = `You generate flavor for a grimdark mercenary/captive in a low-medieval fort game.
Voice: terse, mortal, mud-and-blood. Pan-european (Germanic/Celtic/Slavic feel). No grand destiny, no high-fantasy.

You are given:
- A LEAD context (archetype, region, rarity, blurb)
- A REQUIRED tag id that MUST be present
- A target tag count

Your job:
- Pick the full set of tag IDs from the vocab below (including the required one) until total tag count is reached. Each tag must be VALID and chosen for thematic fit with lead + required tag.
- Respect mutex groups: tags sharing [mutex:X] are mutually exclusive; never include two from the same mutex group.
- Invent a name (1 first name + optional epithet/clan) that matches cultural register.
- Write a 1-2 sentence backstory anchored on the lead context + tags. No grand destiny.

Output JSON: { "tags": ["...", "..."], "name": "...", "backstory": "..." }

${VOCAB_BLOCK}`;

interface Strat2Out { tags: string[]; name: string; backstory: string }

async function runStrategy2(c: LeadCtx): Promise<{ tags: string[]; name: string; backstory: string; usage: any; ms: number }> {
  const userPrompt = `LEAD: ${c.archetype}/${c.rarity} @ ${c.region}\nBLURB: "${c.blurb}"\nREQUIRED TAG (must include): ${c.requiredTag}\nTOTAL TAGS: ${c.tagCount}\nReturn JSON: { "tags": [...], "name": "...", "backstory": "..." }`;
  const t0 = Date.now();
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.9, max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: STRAT2_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });
  const ms = Date.now() - t0;
  const out = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as Strat2Out;
  return { tags: out.tags ?? [], name: out.name, backstory: out.backstory, usage: resp.usage, ms };
}

// ------------ Validation helpers ------------

function validate(tags: string[], requiredTag?: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const seenMutex = new Map<string, string>();
  for (const t of tags) {
    if (!VALID_TAG_IDS.has(t)) issues.push(`invalid:${t}`);
    for (const [mutex, ids] of Object.entries(TAGS_BY_MUTEX)) {
      if (ids.includes(t)) {
        const prev = seenMutex.get(mutex);
        if (prev) issues.push(`mutex-clash:${mutex}=${prev}+${t}`);
        else seenMutex.set(mutex, t);
      }
    }
  }
  if (requiredTag && !tags.includes(requiredTag)) issues.push(`missing-required:${requiredTag}`);
  return { ok: issues.length === 0, issues };
}

function printResult(label: string, c: LeadCtx, r: { tags: string[]; name: string; backstory: string; usage: any; ms: number }, requiredTag?: string): void {
  const v = validate(r.tags, requiredTag);
  console.log(`  [${label}] ${r.name}  (${r.ms}ms, in:${r.usage.prompt_tokens} cached:${r.usage.prompt_tokens_details?.cached_tokens ?? 0} out:${r.usage.completion_tokens})`);
  console.log(`    tags: ${r.tags.join(', ')}`);
  if (!v.ok) console.log(`    ⚠ issues: ${v.issues.join(' | ')}`);
  console.log(`    "${r.backstory}"`);
}

(async () => {
  console.log(`Model: ${MODEL}\n`);
  for (const c of CASES) {
    console.log(`═══ LEAD: ${c.archetype}/${c.rarity} @ ${c.region}`);
    console.log(`    blurb: "${c.blurb}"`);
    console.log(`    seed: [${(c.seedTags ?? []).join(',')}] | required: ${c.requiredTag} | count: ${c.tagCount}`);
    try {
      const r1 = await runStrategy1(c);
      printResult('STRAT 1 seed-expand', c, r1);
    } catch (e) { console.log(`  [STRAT 1] FAILED: ${(e as Error).message.slice(0, 200)}`); }
    try {
      const r2 = await runStrategy2(c);
      printResult('STRAT 2 free-constrain', c, r2, c.requiredTag);
    } catch (e) { console.log(`  [STRAT 2] FAILED: ${(e as Error).message.slice(0, 200)}`); }
    console.log();
  }
})().catch((e) => { console.error(e); process.exit(1); });
