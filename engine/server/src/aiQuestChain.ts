// PROTO-GAME v16: AI calls for quest chains.
//
// Three calls per chain lifecycle:
//   1) genesis     — author hidden skeleton + anchors + per-step beats
//   2) step blurb  — author the next step's lead blurb against skeleton+digest
//   3) epilogue    — bookend the arc with prior outcomes folded in
//
// All calls are zod-validated; on failure the engine falls back to template
// strings so a single bad response never crashes the loop. See
// /docs/QUEST_CHAINS.md for the design rules.

import OpenAI from 'openai';
import { z } from 'zod';
import { pushLLMLog } from './llmLog.js';
import { VOCAB_BLOCK } from './promptVocab.js';
import {
  type QuestChain,
  type ChainAnchors,
  ChainAnchorsSchema,
  plannedStepCount,
} from '../../../prototype/src/questChain.js';
import { REGIONS, type LeadRarity } from '../../../prototype/src/leads.js';

// Two-stage genesis (per-user direction 2026-05-31): the AI first writes
// a fully-readable short story (real narrative prose with scenes and
// dialogue), THEN a second cheap extraction call pulls out the engine
// metadata (title, hook, anchors, step beats) from that story.
// Why: prompting for a "P1 setup / P2 escalation" outline produces plot
// summaries, not stories. Asking for a story produces a story; the engine
// then derives quests from it. The story document is stored as the
// chain's "skeleton" and seeds every downstream step + epilogue prompt.

const GENESIS_STORY_SYSTEM = `You are a short-fiction writer for a grimdark mercenary-fort game. You write a complete, fully-readable short story (650–1100 words) about a single character whose ordeal will become a 3–5 quest arc that mercenaries can hire on to.

Your job is NOT to outline a plot. Your job is to WRITE A STORY a reader could enjoy on its own — scenes, sensory grounding, dialogue, real character interiority, a beginning that pulls them in, a middle that turns, an ending that lands. The reader should care about the protagonist by the time they finish. Treat this like a Dorothy Dunnett or Joe Abercrombie cold-open vignette: low-medieval, mortal, terse-but-not-stingy, mud-and-blood without melodrama.

CRAFT REQUIREMENTS:
- Dialogue. At least 3 short exchanges of real spoken English (in quotes), each by a NAMED speaker. Voices should be distinguishable (a steward speaks differently from a smuggler; a cleric differently from either).
- Scenes, not summary. Show the protagonist DOING things in PLACES, with sensory anchors (a door that swells in the rain; the way the courier's hands shake before he runs). Avoid "Then she went and did X" stitching narration.
- Time. Span 1 to 4 days, not weeks. Every scene should happen on a knowable day or hour.
- A real moral fork in the second half — a choice the protagonist agonises over, where both options cost. Do not resolve it abstractly; let them choose, in scene, with specific costs.
- An ending that lands a single concrete image or line that the reader will remember. Not a moral, not a recap.
- Grounded fantasy. No magic systems, no prophecy, no mythic creatures unless the chain rarity is "legendary" (and even then: at most one numinous element, off-stage). The world is grim and ordinary; what makes it dramatic is the people.
- Period voice. Names feel pan-european (Germanic/Celtic/Slavic). Vocabulary stays low-medieval. No "glorious", "destined", "ancient evil", "shadows of", "fate hangs in the balance", "weight of the past", "ghosts of the past", "tightening their grip".
- Setting palette must FIT the supplied region and not default to fog/mud/marsh/ruined-chapel/tavern. The world also contains: cathedral cloisters, salt-flats, ironworks, mountain passes, grain barges, monastic gardens, river-fords, ducal salons, smugglers' coves, frozen lakes, burned orchards, abbey libraries, tannery yards, plague-pits, mason-camps, vineyards, copper mines.

CHARACTER REQUIREMENTS:
- One protagonist with a first name + last name (or first name + a single defining epithet only if truly distinctive).
- A named antagonist (an individual leader OR a named faction with a named leader).
- 2–4 named places the story returns to.
- The protagonist must have at least ONE specific habit, physical detail, or memory the reader can hold ("she counts door locks before she sleeps"; "his left thumb is missing the nail from a winter at Greyford"). This is NOT optional. Generic emotional shorthand ("burdened by the past") is a failure.
- If the seed names a specific mercenary (anchorMerc) or an inciting incident (seedLeadBlurb), the story MUST integrate them: the protagonist either IS the anchor mercenary or is in their orbit; the inciting incident is on the page in scene, not paraphrased.

STORY SHAPE:
- An opening scene that drops the reader into a moment of trouble or unease. Do NOT open with weather/light/atmosphere ("As the fog crept in across the marshes…"). Open with a person doing or saying something specific.
- 3 to 6 numbered scenes is fine, but DO NOT label them "P1 / SETUP / Act I / Chapter 1" etc. Just write the story.
- A turn at roughly the midpoint where the situation reveals it is worse or different than the protagonist thought.
- A second-half choice the protagonist makes in scene with named, specific stakes for both branches.
- A final scene that is concrete and short. Then stop.

Write nothing else — no commentary, no headings, no "STORY:" prefix. Just the story text.

${VOCAB_BLOCK}`;

const GENESIS_EXTRACT_SYSTEM = `You are an editor extracting structured metadata from a short story you have just been handed. The metadata will drive a video-game quest chain that mercenaries can hire on to. Your output is consumed by code; format MUST be exactly correct JSON.

Read the story carefully, then return:
- title: 4–10 words. Must contain a concrete proper noun from the story (a name, place, or object). Avoid cliché patterns like "The Weight of X", "Whispers of X", "Shadows over X".
- hook: ONE sentence (max 240 chars) that names the protagonist AND the inciting thing in concrete terms. This is the public lead-board blurb — the thing a player decides to pursue. Do NOT spoil the second half.
- centralNpc: the protagonist's name as it appears in the story (first name + last name preferred).
- antagonistFaction: the named antagonist faction OR a named individual antagonist.
- recurringPlaces: 2–4 named places that recur in the story (the most concrete ones — taverns, halls, bridges, gates, scriptoriums by name).
- stepBeats: an array of EXACTLY \${stepCount} entries, each ONE sentence describing what happens in that step of a player playthrough that walks the player through the major events of the story. The first beat is the inciting incident; the last is the climax. Beats must be in the order of the story. Each beat names at least one specific thing from the story (a person, place, or object).
- mustMentionByStep: an array of \${stepCount} arrays of strings — anchor names (NPCs, places, objects) the lead blurb for that step MUST mention to keep continuity. Step 0 may be empty; later steps should each list 1–2 anchors that ground the scene.

Return JSON only.`;

const GenesisOutSchema = z.object({
  title: z.string().min(1).max(80),
  hook: z.string().min(1).max(280),
  skeleton: z.string().min(80),
  anchors: ChainAnchorsSchema,
  stepBeats: z.array(z.string().min(8)).min(3).max(5),
});

let cachedClient: OpenAI | null = null;
function getClient(apiKey: string): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function isGpt5Family(model: string): boolean {
  return model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');
}

function chatParams(opts: {
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: { type: 'json_object' };
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const base: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
  };
  if (opts.responseFormat) base.response_format = opts.responseFormat;
  if (isGpt5Family(opts.model)) {
    // gpt-5 reasoning models consume budget for hidden reasoning tokens too —
    // give it a generous multiplier so the actual output isn't truncated to ''.
    base.max_completion_tokens = opts.maxTokens * 10;
  } else {
    base.temperature = opts.temperature;
    base.max_tokens = opts.maxTokens;
  }
  return base;
}

function model(envKey: string): string {
  return process.env[envKey] ?? process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini';
}

/** Narrative-tier default (genesis + epilogue) — story-quality experiments
 *  in EXPERIMENT_LOG.md showed gpt-5-mini's skeletons read as
 *  shoot-from-this outlines (concrete moral forks, named NPCs, named
 *  consequences) where 4.1-mini's read as fan-fiction-of-the-world.
 *  At ~$0.017/chain it's the right default. Override via env if needed:
 *    AIRAIDER_LLM_NARRATIVE_MODEL=gpt-4.1   (peak craft, ~$0.036/chain)
 *    AIRAIDER_LLM_NARRATIVE_MODEL=gpt-4.1-mini (frugal, ~$0.007/chain)
 *    AIRAIDER_LLM_NARRATIVE_MODEL=gpt-4o-mini  (cheapest, lower craft) */
function narrativeModelDefault(): string {
  return process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? process.env.AIRAIDER_LLM_MODEL ?? 'gpt-5-mini';
}

function genesisModel(): string {
  return process.env.AIRAIDER_LLM_GENESIS_MODEL ?? narrativeModelDefault();
}

function epilogueModel(): string {
  return process.env.AIRAIDER_LLM_EPILOGUE_MODEL ?? narrativeModelDefault();
}

function stepBlurbModel(): string {
  return process.env.AIRAIDER_LLM_STEPBLURB_MODEL ?? model('AIRAIDER_LLM_MODEL');
}

export interface GenesisInput {
  seedReason: string;          // "rare lead resolved", "rare-tag applicant accepted", etc.
  seedLeadBlurb?: string;      // optional inciting-incident text
  region: string;
  chainRarity: LeadRarity;
  themeTagLabels: readonly string[]; // human-readable labels for prompt clarity
  /** Anchor merc context for unit chains. */
  anchorMerc?: { name: string; backstory?: string; tagLabels: readonly string[] };
  /** For follow-up chains. */
  priorEpilogue?: string;
  /** For follow-up chains: the centralNpc + antagonist + places that the
   *  sequel SHOULD inherit verbatim. Prevents the AI from bolting prior
   *  antagonist names onto the protagonist by accident. */
  inheritFromPrior?: { centralNpc?: string; antagonistFaction?: string; places?: readonly string[] };
  /** Names already in use across other active chains — AI must NOT reuse them. */
  avoidNames?: { centralNpcs: readonly string[]; antagonists: readonly string[]; places: readonly string[] };
}

export interface GenesisOutput {
  title: string;
  hook: string;
  skeleton: string;
  anchors: ChainAnchors;
  stepBeats: string[];
}

/** Author a hidden full short story + extracted per-step beats.
 *  Two-stage: (1) write a real readable story, (2) extract structure
 *  from it. The story text becomes the chain's "skeleton" and seeds
 *  every downstream prompt (step blurbs + epilogue). Throws on parse
 *  failure (caller falls back to a template chain so the game keeps
 *  running). */
export async function generateChainGenesis(input: GenesisInput): Promise<GenesisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no OPENAI_API_KEY — chain genesis requires AI');
  const stepCount = plannedStepCount(input.chainRarity);

  // ---- stage 1: write the short story ----
  const storyUserParts: string[] = [
    `Write a complete short story (650–1100 words) for a quest arc.`,
    `Region: ${input.region}.`,
    `Climax tier (rarity feel): ${input.chainRarity} — ${input.chainRarity === 'legendary' ? 'mythic stakes (a duchy, an oath that binds a year, a relic with a real history)' : input.chainRarity === 'rare' ? 'noble / abbey / cursed-relic stakes' : input.chainRarity === 'uncommon' ? 'town and trade stakes' : 'village stakes'}.`,
    `The arc will be split into ${stepCount} quest beats by an editor; write the story so a 4-beat arc emerges naturally.`,
  ];
  if (input.themeTagLabels.length > 0) {
    storyUserParts.push(`Theme keywords: ${input.themeTagLabels.join(', ')}.`);
  }
  if (input.anchorMerc) {
    storyUserParts.push(`PROTAGONIST IS A SPECIFIC MERCENARY:`);
    storyUserParts.push(`  Name: ${input.anchorMerc.name}`);
    storyUserParts.push(`  Tags: ${input.anchorMerc.tagLabels.join(', ')}`);
    if (input.anchorMerc.backstory) storyUserParts.push(`  Backstory: ${input.anchorMerc.backstory}`);
    storyUserParts.push(`Use this person — name, tags, backstory — as the protagonist. The story must turn on something specific to them.`);
  }
  if (input.seedLeadBlurb) {
    storyUserParts.push(`The story's opening situation is set up by this prior incident the player already pursued: "${input.seedLeadBlurb}". Have the consequences of that incident be the story's inciting moment, dramatised in scene.`);
  }
  if (input.priorEpilogue) {
    storyUserParts.push(`This is a SEQUEL. The previous arc ended with: "${input.priorEpilogue}". The story should pick up from those consequences — name people/places/wounds inherited from that ending.`);
  }
  if (input.inheritFromPrior) {
    const ip = input.inheritFromPrior;
    const parts: string[] = [];
    if (ip.centralNpc) parts.push(`Protagonist MUST be EXACTLY "${ip.centralNpc}" — use this name verbatim.`);
    if (ip.antagonistFaction) parts.push(`Antagonist faction SHOULD inherit "${ip.antagonistFaction}" unless the prior arc destroyed them — in that case the story coins a new faction filling the vacuum.`);
    if (ip.places && ip.places.length) parts.push(`Places: 1-2 of these may recur — ${ip.places.join(', ')} — but the story should also use 1-2 fresh named locations.`);
    if (parts.length) storyUserParts.push(`SEQUEL INHERITANCE:\n- ${parts.join('\n- ')}`);
  }
  if (input.avoidNames) {
    const av = input.avoidNames;
    const parts: string[] = [];
    if (av.centralNpcs.length) parts.push(`protagonists already in use: ${av.centralNpcs.join(', ')}`);
    if (av.antagonists.length) parts.push(`antagonist factions in use: ${av.antagonists.join(', ')}`);
    if (av.places.length) parts.push(`places heavily used: ${av.places.join(', ')}`);
    if (parts.length) {
      storyUserParts.push(
        `DIVERSITY: other active stories in the world use — ${parts.join('; ')}. ` +
        `Do NOT reuse any of these names for the protagonist, antagonist, or recurring places.`,
      );
    }
  }
  storyUserParts.push(``, `Write the story now. Output the story text only — no headings, no commentary.`);

  const storyUsr = storyUserParts.join('\n');
  const m = genesisModel();
  const startedAtStory = Date.now();
  const storyResp = await getClient(apiKey).chat.completions.create(
    chatParams({
      model: m,
      temperature: 0.95,
      maxTokens: 2000,
      messages: [
        { role: 'system', content: GENESIS_STORY_SYSTEM },
        { role: 'user', content: storyUsr },
      ],
    }),
  );
  const storyText = (storyResp.choices[0]?.message?.content ?? '').trim();
  pushLLMLog({
    ts: Date.now(),
    kind: 'chain-genesis-story',
    model: m,
    systemPrompt: GENESIS_STORY_SYSTEM,
    userPrompt: storyUsr,
    response: storyText,
    label: `genesis-story ${input.chainRarity} ${input.region}`,
    elapsedMs: Date.now() - startedAtStory,
    promptTokens: storyResp.usage?.prompt_tokens,
    completionTokens: storyResp.usage?.completion_tokens,
    cachedPromptTokens: storyResp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  if (storyText.length < 200) {
    throw new Error(`genesis-story output too short (${storyText.length} chars) — likely truncation`);
  }

  // ---- stage 2: extract metadata from the story ----
  const extractSys = GENESIS_EXTRACT_SYSTEM.replace(/\$\{stepCount\}/g, String(stepCount));
  const extractUsr = [
    `STORY:`,
    storyText,
    ``,
    `Required step count: ${stepCount}. stepBeats and mustMentionByStep MUST each have exactly ${stepCount} entries.`,
    `Region context: ${input.region}.`,
    ``,
    `Return JSON ONLY of shape:`,
    `{`,
    `  "title": "...",`,
    `  "hook": "...",`,
    `  "anchors": { "centralNpc":"...", "antagonistFaction":"...", "recurringPlaces":["..."], "mustMentionByStep": ${JSON.stringify(Array.from({ length: stepCount }, () => []))} },`,
    `  "stepBeats": [${Array.from({ length: stepCount }, (_, i) => `"step ${i} beat"`).join(',')}]`,
    `}`,
  ].join('\n');

  const startedAtExtract = Date.now();
  const extractResp = await getClient(apiKey).chat.completions.create(
    chatParams({
      // Use the cheaper step-blurb model for extraction — it's mechanical.
      model: stepBlurbModel(),
      temperature: 0.3,
      maxTokens: 800,
      responseFormat: { type: 'json_object' },
      messages: [
        { role: 'system', content: extractSys },
        { role: 'user', content: extractUsr },
      ],
    }),
  );
  const extractContent = extractResp.choices[0]?.message?.content ?? '{}';
  pushLLMLog({
    ts: Date.now(),
    kind: 'chain-genesis-extract',
    model: stepBlurbModel(),
    systemPrompt: extractSys,
    userPrompt: extractUsr,
    response: extractContent,
    label: `genesis-extract ${input.chainRarity} ${input.region}`,
    elapsedMs: Date.now() - startedAtExtract,
    promptTokens: extractResp.usage?.prompt_tokens,
    completionTokens: extractResp.usage?.completion_tokens,
    cachedPromptTokens: extractResp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  const raw = JSON.parse(extractContent);
  // Be lenient about stepBeats length: clip or pad if AI miscounts.
  if (Array.isArray(raw.stepBeats)) {
    if (raw.stepBeats.length > stepCount) raw.stepBeats = raw.stepBeats.slice(0, stepCount);
    while (raw.stepBeats.length < stepCount) {
      raw.stepBeats.push(`step ${raw.stepBeats.length} unfolds the saga`);
    }
  }
  if (raw.anchors && Array.isArray(raw.anchors.mustMentionByStep)) {
    if (raw.anchors.mustMentionByStep.length !== stepCount) {
      raw.anchors.mustMentionByStep = Array.from({ length: stepCount }, () => []);
    }
  }
  // The "skeleton" field carries the full story now — this is what
  // every downstream prompt uses for context.
  raw.skeleton = storyText;
  const parsed = GenesisOutSchema.parse(raw);
  warnIfClicheLeak(`genesis "${parsed.title}"`, [parsed.hook, ...parsed.stepBeats]);
  return parsed;
}

const BANNED_PHRASES: readonly string[] = [
  'nefarious schemes', 'pulls the strings', 'puppets of', 'tightening their grip',
  'shadows of', 'fate hangs in the balance', 'hangs in the balance', 'darkness descends',
  'ancient evil', 'twisted ambition', 'weight of the past', 'ghosts of the past',
  'coin and blood', 'the spoils', 'promises coin',
  'finds himself bloodied and outnumbered',
];

/** Surface banned-phrase leaks as warn-logs so playtest sessions can spot
 *  prompt-discipline regressions without crashing. Does NOT retry. */
function warnIfClicheLeak(label: string, texts: readonly string[]): void {
  for (const t of texts) {
    if (!t) continue;
    const lower = t.toLowerCase();
    for (const ban of BANNED_PHRASES) {
      if (lower.includes(ban)) {
        console.warn(`[chain-cliche] ${label} leaked "${ban}"`);
        break;
      }
    }
  }
}

// ---------- step blurb ----------

const STEP_BLURB_SYSTEM = `You are the lead-board writer for a grimdark mercenary-fort game. You write ONE-sentence lead hooks for steps inside an already-authored quest-chain skeleton.

A hook must:
- Reference the chain's centralNpc, antagonistFaction, OR one of the recurringPlaces — by name. This is REQUIRED. Drift is a bug.
- Hit the beat supplied for this step.
- DRAW FROM THE FULL HIDDEN STORY supplied in the digest — pick ONE specific moment from that story for this step. Do NOT invent events that aren't in the story. The story is the source of truth; your job is to surface the right beat from it as a player-facing one-line hook.
- Match the chain's region.
- Match the engine-supplied rarity feel (common = village stakes; uncommon = town/trade; rare = noble/abbey/cursed; legendary = mythic).
- Be ONE specific sentence (or one sentence + ONE short dialogue/overheard fragment). No generic placeholders (no "the prize/the target/the goods/the spoils").
- Avoid the rarity-words themselves ("common/uncommon/rare/legendary/mythic/epic/heroic/glorious/destined").

CRAFT RULES (these are the difference between cheap and good):
1. OPENING — Do NOT open with sense/atmosphere verbs ("In the dim light of", "As shadows deepen", "Beneath the pallid moon", "Under heavy rain", "Amidst the fog"). Open with an ACTION, a NAME, or a line of SPEECH.
   BAD: "In the smoke of the burning shrine, Roselle discovers a sealed letter."
   GOOD: "Roselle pries the seal off a courier's pouch in the burning shrine and finds her own name inside."
   GOOD: "\"Don't open that here,\" the courier whispers — but Roselle already has the seal in her teeth."
2. VERBS — Vary. The protagonist should ACT (pick, lie, hide, bribe, dig, burn, refuse, swear, cut, follow, name) — not merely sense (overhear, discover, learn, find, glimpse, sense). At most ONE sense-verb per arc.
3. DIALOGUE — Where it fits, include ONE short line of speech or overheard fragment in quotes. Not every step needs it, but at least 2 of 4 steps should have a quoted line.
4. RHYTHM — Vary sentence length across the arc. Some steps short and blunt (under 12 words). Some longer and articulated. Never four identical compound present-tense sentences in a row.
5. SPECIFIC INTERIORITY — If you give the protagonist a thought, make it CONCRETE: "Roselle remembers Gunther's debt to the silversmith" beats "Roselle is burdened by guilt".

NAMING DISCIPLINE:
- Use the centralNpc's NAME, not their full epithet, in most steps. The epithet is for the saga header — repeated mid-arc it reads robotic.
  BAD: "Marek the Brawny raises his mug … Marek the Brawny discovers … Marek the Brawny must decide"
  GOOD: "Marek raises his mug … He discovers … Marek must decide"
- Each step should introduce ONE concrete new detail beyond the anchors — a named contact, a stolen object, a wound, a debt, a witness. Static repetition of "Marek + Tavern + Crawlers" across all four steps is the failure mode.

BANNED PHRASES (fantasy-novel cliché — do not use):
"nefarious schemes", "pulls the strings", "puppets of", "tightening their grip",
"shadows of", "fate hangs in the balance", "darkness descends", "ancient evil",
"the prize/target/spoils", "coin and blood", "promises coin",
"twisted ambition", "weight of the past", "ghosts of the past",
"finds himself bloodied and outnumbered" (be specific about WHAT bloodied him).

ANTI-REPETITION:
You will be shown prior step hooks for reference. Coin FRESH phrasing — do not reuse a phrase of 3+ words from any prior hook. If the prior hook said "tightening their grip", you must find a different way to convey escalation (one of: "have moved on the gate-house", "burned the Vellis stables", "named Marek to the magistrate").

CONTINUITY:
IF prior step outcomes are supplied, REFERENCE the most recent one SPECIFICALLY: if it was unfavorable, name what was lost; if catastrophic, name the antagonist's new advantage (they have your faces, their reinforcements arrived, the witness was burned); if favorable, give the company momentum (the trail is fresh, the contact owes you). DO NOT write generic "the situation has worsened" — name a concrete person, place, or wound from the prior summary.

${VOCAB_BLOCK}`;

const StepBlurbOutSchema = z.object({
  hook: z.string().min(8).max(420),
});

export interface StepBlurbInput {
  chain: QuestChain;
  /** Digest text computed by chainDigest() in pure code. */
  digest: string;
  stepIdx: number;
  beat: string;
  plannedRarity: LeadRarity;
  originalPlannedRarity: LeadRarity;
  archetype: string;
  /** Suggested DC + reward so AI can size the hook. */
  dc: number;
  rewardGold: number;
}

export async function generateChainStepBlurb(input: StepBlurbInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no OPENAI_API_KEY');
  const m = stepBlurbModel();

  const downshifted = input.plannedRarity !== input.originalPlannedRarity;
  const userParts: string[] = [
    `CHAIN DIGEST:`,
    input.digest,
    ``,
    `STEP TO WRITE: ${input.stepIdx} of ${input.chain.steps.length - 1} (zero-indexed)`,
    `Beat for this step: ${input.beat}`,
    `Engine-set rarity: ${input.plannedRarity}, archetype: ${input.archetype}, DC: ${input.dc}, reward: ${input.rewardGold}g.`,
  ];
  if (downshifted) {
    userParts.push(`NOTE: original plan was ${input.originalPlannedRarity}, but the engine downshifted to ${input.plannedRarity} because of prior catastrophic outcomes — write a SMALLER, COMPROMISED version of the beat.`);
  }
  userParts.push(
    ``,
    `Return JSON ONLY: {"hook":"one-sentence lead hook that mentions a named anchor"}.`,
  );

  const usr = userParts.join('\n');
  const startedAt = Date.now();
  const resp = await getClient(apiKey).chat.completions.create(
    chatParams({
      model: m,
      temperature: 0.85,
      maxTokens: 350,
      responseFormat: { type: 'json_object' },
      messages: [
        { role: 'system', content: STEP_BLURB_SYSTEM },
        { role: 'user', content: usr },
      ],
    }),
  );
  const content = resp.choices[0]?.message?.content ?? '{}';
  pushLLMLog({
    ts: Date.now(),
    kind: 'chain-step',
    model: m,
    systemPrompt: STEP_BLURB_SYSTEM,
    userPrompt: usr,
    response: content,
    label: `chain ${input.chain.id} step ${input.stepIdx}`,
    elapsedMs: Date.now() - startedAt,
    promptTokens: resp.usage?.prompt_tokens,
    completionTokens: resp.usage?.completion_tokens,
    cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  const parsed = StepBlurbOutSchema.parse(JSON.parse(content));
  warnIfClicheLeak(`step ${input.stepIdx} of "${input.chain.title}"`, [parsed.hook]);
  return parsed.hook.trim();
}

// ---------- epilogue ----------

const EPILOGUE_SYSTEM = `You are the saga-keeper. The arc has ended. You will be given the FULL AUTHORED SHORT STORY that this arc dramatises, plus the per-step outcomes from how it actually played. Write a 2-4 sentence EPILOGUE that bookends the story AND folds in how the play went.

Voice: terse, mortal, mud-and-blood. Low-medieval. No glory. No high-fantasy.

REQUIREMENTS:
- Name the centralNpc and the antagonistFaction (or their leader). No anonymous "the enemy".
- Honour the final band: favorable = the company won at a real cost; catastrophic = the company broke; unfavorable = the prize cost more than it gave; catastrophic-favorable = a Pyrrhic victory, name what was traded for the win.
- Pull at least ONE concrete event from the per-step outcomes you receive — a named place, a named ally, a wound, a betrayal, an object. Generic recap reads cheap.
- If a mercenary died during the arc, name them and the manner.
- Leave ONE small thread loose at the end — a missing person, a stolen item that wasn't recovered, a witness who escaped, a faction that survives in remnants. This seeds future chains naturally. Do NOT explicitly tease a "sequel"; just let the world keep breathing.

BANNED PHRASES (fantasy-novel cliché — do not use):
"nefarious schemes", "pulls the strings", "puppets of", "tightening their grip",
"shadows of", "fate hangs in the balance", "hangs in the balance",
"darkness descends", "ancient evil", "twisted ambition", "weight of the past",
"ghosts of the past", "coin and blood", "the spoils", "promises coin",
"a new dawn awaits", "the cycle continues", "for now".

NAMING DISCIPLINE:
- Use first names after first reference (e.g. "Roselle", not "Roselle the Light-Footed").
- The antagonist's leader, if named in the skeleton, should appear by name.

CRAFT (same rules as step blurbs):
- DO NOT open with atmospheric weather/light frames. Open with a name, an action, or a line of speech.
- Vary sentence length — at least one short blunt sentence among the 2-4.
- Include ONE concrete line of dialogue or final-spoken thing if it fits the scene; e.g. a survivor's last words, the leader's parting curse, an order given.
- Avoid generic interiority. Specific regrets (named debts, named graves) beat generic "burdened/haunted/heavy-hearted".`;

const EpilogueOutSchema = z.object({
  epilogue: z.string().min(20).max(800),
});

export interface EpilogueInput {
  chain: QuestChain;
  finalBand: string;
  partyAcrossAllSteps: readonly string[];
  anchorDied?: boolean;
  anchorName?: string;
}

export async function generateChainEpilogue(input: EpilogueInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no OPENAI_API_KEY');
  const m = epilogueModel();

  const userParts: string[] = [
    `Hidden skeleton (you wrote this at genesis — bookend it):`,
    input.chain.skeleton,
    ``,
    `Title: ${input.chain.title}`,
    `Status: ${input.chain.status}`,
    `Final band: ${input.finalBand}`,
    `Per-step outcomes:`,
    ...input.chain.steps.map((s) => `  step ${s.stepIdx} (${s.band ?? '?'}): ${s.summary ?? '(no summary)'}`),
    `Mercenaries who participated: ${input.partyAcrossAllSteps.join(', ') || 'none recorded'}`,
  ];
  if (input.anchorDied && input.anchorName) {
    userParts.push(`The anchor mercenary ${input.anchorName} DIED during the arc — write that into the epilogue.`);
  }
  userParts.push(``, `Return JSON ONLY: {"epilogue":"2-3 sentences"}.`);

  const usr = userParts.join('\n');
  const startedAt = Date.now();
  const resp = await getClient(apiKey).chat.completions.create(
    chatParams({
      model: m,
      temperature: 0.8,
      maxTokens: 600,
      responseFormat: { type: 'json_object' },
      messages: [
        { role: 'system', content: EPILOGUE_SYSTEM },
        { role: 'user', content: usr },
      ],
    }),
  );
  const content = resp.choices[0]?.message?.content ?? '{}';
  pushLLMLog({
    ts: Date.now(),
    kind: 'chain-epilogue',
    model: m,
    systemPrompt: EPILOGUE_SYSTEM,
    userPrompt: usr,
    response: content,
    label: `epilogue ${input.chain.id}`,
    elapsedMs: Date.now() - startedAt,
    promptTokens: resp.usage?.prompt_tokens,
    completionTokens: resp.usage?.completion_tokens,
    cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  const parsed = EpilogueOutSchema.parse(JSON.parse(content));
  warnIfClicheLeak(`epilogue "${input.chain.title}"`, [parsed.epilogue]);
  return parsed.epilogue.trim();
}

// ---------- step summary (folded into existing narrate) ----------
// The narrate() call in resolver.ts is the right home for chainStepSummary,
// but rather than thread a new field through every call site, dispatch.ts
// computes a summary from the existing outcomeNarrative by extracting the
// first sentence. This is a prototype-grade compromise: cheap, no extra
// AI call, and good enough for next-step context.

export function summarizeStep(outcomeNarrative: string, band: string): string {
  const firstSentence = outcomeNarrative.split(/(?<=[.!?])\s+/)[0]?.trim() ?? outcomeNarrative.slice(0, 140);
  return `[${band}] ${firstSentence}`;
}

/** Engine validation: the AI authored region must be in REGIONS. If not,
 *  silently fall back to the supplied region. */
export function coerceRegion(supplied: string): string {
  if ((REGIONS as readonly string[]).includes(supplied)) return supplied;
  return REGIONS[0]!;
}
