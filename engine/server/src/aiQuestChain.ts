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

const GENESIS_SYSTEM = `You are the saga-keeper for a grimdark mercenary-fort game. You author hidden 3-4 paragraph story SKELETONS that downstream prompts will draw on to keep multi-step arcs coherent.

Voice: terse, mortal, mud-and-blood, low-medieval, no glory, no high-fantasy. Names feel pan-european (Germanic/Celtic/Slavic). Avoid the words "common/uncommon/rare/legendary/mythic/epic/heroic/glorious/destined".

STRUCTURE OF A SKELETON (3-4 paragraphs total):
  P1 — SETUP: a small, grounded hook in the region.
  P2 — ESCALATION: the thing turns out to matter; a second party / faction reveals itself.
  P3 — PIVOT: the central choice, complication, or sacrifice.
  P4 — CLIMAX: a high-stakes resolution that allows both a crit-success ending and a tragic-failure ending to read as authored.

You MUST also name:
  - centralNpc: the single name+epithet who anchors the arc (e.g. "Aldric the Hollow", "Mara Loth of the Ash Coven")
  - antagonistFaction: a faction or notable individual antagonist (e.g. "the Crow's Ford magistracy", "the Iron Witnesses")
  - recurringPlaces: 2-4 named places (a tavern, a chapel, a ruin) the arc returns to

Then split the arc into per-step BEATS — one one-sentence beat per step, in order. The step count is supplied; obey it exactly.

${VOCAB_BLOCK}`;

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

function model(envKey: string): string {
  return process.env[envKey] ?? process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini';
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
}

export interface GenesisOutput {
  title: string;
  hook: string;
  skeleton: string;
  anchors: ChainAnchors;
  stepBeats: string[];
}

/** Author a hidden skeleton + per-step beats. Throws on parse failure
 *  (caller falls back to a template chain so the game keeps running). */
export async function generateChainGenesis(input: GenesisInput): Promise<GenesisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no OPENAI_API_KEY — chain genesis requires AI');
  const stepCount = plannedStepCount(input.chainRarity);

  const userParts: string[] = [
    `Author a new quest-chain skeleton (HIDDEN from the player).`,
    `Region: ${input.region}.`,
    `Chain rarity (climax tier): ${input.chainRarity}.`,
    `Required step count: ${stepCount}. stepBeats array MUST have exactly ${stepCount} entries.`,
    `Seed reason: ${input.seedReason}.`,
  ];
  if (input.themeTagLabels.length > 0) {
    userParts.push(`Theme tags to honour: ${input.themeTagLabels.join(', ')}.`);
  }
  if (input.anchorMerc) {
    userParts.push(`UNIT CHAIN — this arc belongs to one mercenary:`);
    userParts.push(`  Anchor: ${input.anchorMerc.name}`);
    userParts.push(`  Tags: ${input.anchorMerc.tagLabels.join(', ')}`);
    if (input.anchorMerc.backstory) userParts.push(`  Backstory: ${input.anchorMerc.backstory}`);
    userParts.push(`The arc must turn on THIS mercenary's identity — their tags, past, name. They appear in every step.`);
  }
  if (input.seedLeadBlurb) {
    userParts.push(`INCITING INCIDENT (the player already pursued and resolved this): "${input.seedLeadBlurb}". The skeleton picks up AFTER this — step 0 is the first NEW lead, not a repeat.`);
  }
  if (input.priorEpilogue) {
    userParts.push(`This is a SEQUEL. The prior chain ended with: "${input.priorEpilogue}". Build on those consequences.`);
  }
  userParts.push(
    '',
    'Return JSON ONLY of shape:',
    '{',
    '  "title": "2-5 word saga title",',
    '  "hook": "1 sentence shown to player (no spoilers)",',
    '  "skeleton": "3-4 paragraph hidden outline, ~300-500 words",',
    '  "anchors": {',
    '    "centralNpc": "Name Epithet",',
    '    "antagonistFaction": "name",',
    '    "recurringPlaces": ["place1","place2","place3"],',
    `    "mustMentionByStep": ${JSON.stringify(Array.from({ length: stepCount }, () => []))}`,
    '  },',
    `  "stepBeats": [${Array.from({ length: stepCount }, (_, i) => `"step ${i} beat"`).join(',')}]`,
    '}',
  );

  const sys = GENESIS_SYSTEM;
  const usr = userParts.join('\n');
  const m = model('AIRAIDER_LLM_NARRATIVE_MODEL');
  const startedAt = Date.now();
  const resp = await getClient(apiKey).chat.completions.create({
    model: m,
    temperature: 0.85,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: usr },
    ],
  });
  const content = resp.choices[0]?.message?.content ?? '{}';
  pushLLMLog({
    ts: Date.now(),
    kind: 'chain-genesis',
    model: m,
    systemPrompt: sys,
    userPrompt: usr,
    response: content,
    label: `genesis ${input.chainRarity} ${input.region}`,
    elapsedMs: Date.now() - startedAt,
    promptTokens: resp.usage?.prompt_tokens,
    completionTokens: resp.usage?.completion_tokens,
    cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  const raw = JSON.parse(content);
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
  const parsed = GenesisOutSchema.parse(raw);
  return parsed;
}

// ---------- step blurb ----------

const STEP_BLURB_SYSTEM = `You are the lead-board writer for a grimdark mercenary-fort game. You write ONE-sentence lead hooks for steps inside an already-authored quest-chain skeleton.

A hook must:
- Reference the chain's centralNpc, antagonistFaction, OR one of the recurringPlaces — by name. This is REQUIRED. Drift is a bug.
- Hit the beat supplied for this step.
- Match the chain's region.
- Match the engine-supplied rarity feel (common = village stakes; uncommon = town/trade; rare = noble/abbey/cursed; legendary = mythic).
- Be ONE specific sentence. No generic placeholders (no "the prize/the target/the goods/the spoils").
- Avoid the rarity-words themselves ("common/uncommon/rare/legendary/mythic/epic/heroic/glorious/destined").

If prior step outcomes are supplied, REFERENCE them: an unfavorable past means the situation has worsened; a catastrophic past means the antagonist now knows the company's face; a favorable past gives the company momentum.

${VOCAB_BLOCK}`;

const StepBlurbOutSchema = z.object({
  hook: z.string().min(8).max(280),
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
  const m = model('AIRAIDER_LLM_MODEL');

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
  const resp = await getClient(apiKey).chat.completions.create({
    model: m,
    temperature: 0.85,
    max_tokens: 250,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: STEP_BLURB_SYSTEM },
      { role: 'user', content: usr },
    ],
  });
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
  return parsed.hook.trim();
}

// ---------- epilogue ----------

const EPILOGUE_SYSTEM = `You are the saga-keeper. The arc has ended. Write a 2-3 sentence EPILOGUE that bookends the skeleton and folds in how the actual play went. Voice: terse, mortal, mud-and-blood. Name the centralNpc and antagonist. Honour the band of the final step (favorable = the company won; catastrophic = the company broke; unfavorable = the cost was higher than the prize). If the anchor mercenary died, name them and the manner.`;

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
  const m = model('AIRAIDER_LLM_NARRATIVE_MODEL');

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
  const resp = await getClient(apiKey).chat.completions.create({
    model: m,
    temperature: 0.8,
    max_tokens: 350,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EPILOGUE_SYSTEM },
      { role: 'user', content: usr },
    ],
  });
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
