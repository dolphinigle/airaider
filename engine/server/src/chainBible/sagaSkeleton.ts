// Saga skeleton genesis — Phase S-A prototype (see docs/SAGAS.md §3.1, §10).
//
// A saga is the meta-tier above a single chain. This file ONLY generates the
// hidden master skeleton (3-4 paragraphs, phase plan, pinned cast). It does
// NOT generate chains or beats — that's S-B.
//
// Used by sagaSkeletonRunner.ts for cross-check playtests (§12).

import OpenAI from 'openai';
import { z } from 'zod';
import type { CharacterPool, PoolCharacter } from './characterPool.js';

const SAGA_MODEL = process.env.AIRAIDER_SAGA_MODEL ?? 'gpt-5-mini';
const SAGA_EFFORT = (process.env.AIRAIDER_SAGA_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';

// ---------------- schema (v2 — Cinderella shape) ----------------
//
// Design pivot 2026-05-30: dropped controllingIdea (moralizing), antagonistPlan,
// finalImageTarget, body[] (too much prose detail at scaffold tier). The saga
// skeleton is now a SCAFFOLD: hook + endearing cast + per-phase key plot points.
// Prose lives in the per-chain Bible and per-beat writers.

export const PinnedCastEntrySchema = z.object({
  characterId: z.string().min(2),
  sagaRole: z.string().min(20),   // what they DO across the saga (1 sentence)
  charmHook: z.string().min(20),  // what makes them endearing / alive / memorable (gacha-style)
});

export const SagaPhaseSchema = z.object({
  plotPoints: z.array(z.string().min(15)).min(1).max(5),  // terse key events for THIS chain
});

export const SagaSkeletonSchema = z.object({
  workingTitle: z.string().min(2).max(60).optional(),
  hook: z.string().min(40),  // 1-2 sentence dramatic payoff promise (what makes the reader want this saga)
  pinnedCast: z.array(PinnedCastEntrySchema).min(2).max(6).refine(
    (cs) => new Set(cs.map((c) => c.characterId)).size === cs.length,
    { message: 'pinnedCast characterIds must be unique' },
  ),
  phases: z.array(SagaPhaseSchema).min(2).max(5),
});
export type SagaSkeleton = z.infer<typeof SagaSkeletonSchema>;

// ---------------- request ----------------

export type SagaRewardHint = 'gold' | 'regional_prestige' | 'captive_to_dungeon' | 'promote_to_merc' | 'unique_trait_on_anchor';

export interface SagaGenesisRequest {
  pool: CharacterPool;
  region: string;
  kind: 'regional' | 'unit';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  // Anchor merc for unit sagas.
  anchorMercId?: string;
  // Engine-picked phase count (common=2, uncommon=3, rare=4, legendary=5).
  targetPhaseCount: 2 | 3 | 4 | 5;
  // One reward hint per phase, length must equal targetPhaseCount.
  perPhaseRewardHints: SagaRewardHint[];
  // Optional inciting event.
  incitingEventBlurb?: string;
  // Optional prior saga epilogue when this is a saga-tier follow-up.
  priorSagaEpilogue?: string;
}

// ---------------- prompt ----------------

const SAGA_SYSTEM = `You are a story-room foreman for a grimdark mercenary-fort game. You author a SAGA SKELETON — the hidden scaffold for a long arc that will be delivered to the player over 2-5 separate quest chains across many in-world days.

The player NEVER sees your output. Your job is to give every chain's writers' room downstream:
1. A clear DRAMATIC PAYOFF the saga is reaching for (the "hook")
2. A handful of MEMORABLE, ENDEARING characters the player will see across multiple chains
3. The KEY PLOT POINTS each chain must hit — terse, like an outline, NOT prose

THE FOCUS IS CHARACTERS, NOT THEMES.

Characters must feel ALIVE. Like the cast of a beloved long-running show — or gacha-game characters players collect emotional attachment to. EVERY pinned cast member (yes, antagonists too) needs a charmHook: the specific thing that makes them feel like a person, not a role. Examples:
- A stepmother who performs propriety in public, petty venom in private — comically self-defeating.
- A fairy godmother who loves bending rules but enforces midnight strictly — chaotic-good auntie energy.
- A captive smuggler who keeps trying to bargain with knock-knock jokes because deep down he's terrified.
- A harbour-master who lies to the fort but tells his pet rat the truth.

DO NOT:
- Write a "controllingIdea" or any moralizing theme statement. The reader does not want a moral; they want CHARACTERS.
- Write the saga as prose. Plot points are BULLET-LEVEL outline ("she leaves the shoe at midnight"), NOT scene-level detail ("she descends the marble stair as the bell tolls, leaving the glass slipper on the third step where moonlight catches it").
- Write the antagonist's "plan" as a separate field. Their plan is implicit in the plot points; their humanity is in their charmHook.
- Write phase intents or delivery hints. The plot points ARE the phase content.

The HOOK should name the dramatic payoff that will land at the saga's climax. Examples:
- "An abused orphan, secretly destined for royalty — reader pays off when the family eats crow."
- "A grizzled merc finally faces the brother he abandoned to die — pays off when he chooses the fort over his guilt."
- "A respected harbour-master is quietly a child-trafficker — reader pays off when his web unspools in public."

The PLOT POINTS per phase are 1-5 terse key events. Each plot point is ONE sentence. They drive the chain forward. Like a TV show's beat-sheet, not its shooting script.

CAST RULES:
- pinnedCast: 2-6 characters from the POOL who appear across MULTIPLE phases of this saga.
- Each entry: characterId (verbatim from pool, look for id="char_xxx"), sagaRole (what they DO across the saga, one sentence), charmHook (what makes them endearing/alive, one sentence).
- For a unit saga, the anchor merc MUST be in pinnedCast.
- All characterIds MUST exist in the pool block. NO INVENTED IDs.

PHASE COUNT MUST EQUAL the engine's targetPhaseCount. Each phase's plot points END WITH AN EVENT THAT JUSTIFIES THE ENGINE-FIXED REWARD for that phase (e.g., if the engine says "this phase ends with an antagonist in the dungeon", the last plot point must contain the capture).

BANNED TOKENS (in any field): weight, weighed, shadow, burden, ghosts, fate, destined, destiny, ancient evil, darkness descends.

CRITICAL FORMATTING: phases is an array. plotPoints is an array of strings. pinnedCast is an array of objects. Output JSON only.`;

function poolBlock(chars: PoolCharacter[], label: string): string {
  if (chars.length === 0) return `${label}: (none)`;
  const lines = [`${label} (${chars.length}):`];
  for (const c of chars) {
    lines.push(`  - id="${c.id}" name="${c.name}" role=${c.role} tags=[${c.tags.join(',')}]`);
    lines.push(`    surface: ${c.surface}`);
    lines.push(`    want: ${c.want}`);
    lines.push(`    need: ${c.need}`);
    lines.push(`    arcState: ${c.arcState}`);
  }
  return lines.join('\n');
}

function describeRewardHint(h: SagaRewardHint): string {
  switch (h) {
    case 'gold': return 'gold (engine-balanced economy reward)';
    case 'regional_prestige': return 'regional prestige (the fort gains standing in the region)';
    case 'captive_to_dungeon': return 'an antagonist NPC ends the chain in the fort dungeon';
    case 'promote_to_merc': return 'an NPC joins the fort as a mercenary';
    case 'unique_trait_on_anchor': return 'the anchor mercenary earns a unique named trait';
  }
}

function sampleSizeForRarity(r: SagaGenesisRequest['rarity']): number {
  switch (r) { case 'common': return 6; case 'uncommon': return 8; case 'rare': return 10; case 'legendary': return 12; }
}

function buildUser(req: SagaGenesisRequest): { user: string; sample: PoolCharacter[]; anchor?: PoolCharacter } {
  const prefix = req.pool.cachedPrefix(req.region);
  const anchor = req.anchorMercId ? req.pool.get(req.anchorMercId) : undefined;
  if (req.kind === 'unit' && !anchor) throw new Error(`unit saga requires a valid anchorMercId; got ${req.anchorMercId}`);
  const excludeFromSample = new Set<string>(anchor ? [anchor.id] : []);
  const sample = req.pool.regionSample(req.region, sampleSizeForRarity(req.rarity), excludeFromSample);

  if (req.perPhaseRewardHints.length !== req.targetPhaseCount) {
    throw new Error(`perPhaseRewardHints length ${req.perPhaseRewardHints.length} must equal targetPhaseCount ${req.targetPhaseCount}`);
  }

  const parts: string[] = [
    `CHARACTER POOL — use these IDs for pinnedCastIds`,
    ``,
    poolBlock(prefix, 'FORT ROSTER + LANDMARKS (cached prefix)'),
    ``,
    poolBlock(sample, `REGION NPC SAMPLE`),
  ];
  if (anchor) {
    parts.push(``, poolBlock([anchor], `REQUIRED ANCHOR — this is a UNIT SAGA. This merc MUST be in pinnedCastIds and the controllingIdea MUST be driven by their want/need/ghost/lie. The saga IS their personal arc.`));
  }
  parts.push(``, `SAGA SPEC`,
    `Region: ${req.region}`,
    `Kind: ${req.kind}`,
    `Rarity: ${req.rarity}`,
    `Target phase count: ${req.targetPhaseCount} (you MUST output exactly this many phases)`,
    `Per-phase reward (engine-fixed, climaxes deliver these in order):`);
  req.perPhaseRewardHints.forEach((h, i) => parts.push(`  phase ${i + 1}: ${describeRewardHint(h)}`));
  if (req.incitingEventBlurb) {
    parts.push(``, `INCITING EVENT (must reflect in body paragraph 1): ${req.incitingEventBlurb}`);
  }
  if (req.priorSagaEpilogue) {
    parts.push(``, `PRIOR SAGA EPILOGUE — this saga is a follow-up. Its controllingIdea must evolve from this past:`, req.priorSagaEpilogue);
  }
  parts.push(``, `Author the saga skeleton now. Output JSON only.`);
  return { user: parts.join('\n'), sample, anchor };
}

// ---------------- pricing (mirrors biblePipeline.ts) ----------------

const PRICES: Record<string, { in: number; out: number; cached: number }> = {
  'gpt-5-mini': { in: 0.25, out: 2.0, cached: 0.025 },
  'gpt-5-nano': { in: 0.05, out: 0.4, cached: 0.005 },
  'gpt-4.1': { in: 2.0, out: 8.0, cached: 0.5 },
};

export interface CallUsage {
  model: string;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  costUsd: number;
}

function makeUsage(model: string, promptTok: number, cachedTok: number, completionTok: number): CallUsage {
  const p = PRICES[model] ?? { in: 0, out: 0, cached: 0 };
  const uncached = promptTok - cachedTok;
  const cost = (uncached * p.in + cachedTok * p.cached + completionTok * p.out) / 1_000_000;
  return { model, promptTokens: promptTok, cachedTokens: cachedTok, completionTokens: completionTok, costUsd: cost };
}

async function callJson<T>(client: OpenAI, model: string, system: string, user: string, schema: z.ZodType<T>, maxOut: number, effort?: 'minimal' | 'low' | 'medium' | 'high'): Promise<{ data: T; usage: CallUsage; raw: string }> {
  const params: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: maxOut,
    stream: false,
  };
  if (effort) params.reasoning_effort = effort;
  const resp = (await client.chat.completions.create(params as unknown as Parameters<typeof client.chat.completions.create>[0])) as unknown as {
    choices: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  };
  const content = resp.choices[0]?.message?.content ?? '{}';
  const promptTok = resp.usage?.prompt_tokens ?? 0;
  const completionTok = resp.usage?.completion_tokens ?? 0;
  const cachedTok = resp.usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const usage = makeUsage(model, promptTok, cachedTok, completionTok);
  let raw: unknown;
  try { raw = JSON.parse(content); }
  catch (e) { throw new Error(`${model} returned non-JSON: ${(e as Error).message}\nfirst 300: ${content.slice(0, 300)}`); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[debug] raw response keys: ${typeof raw === 'object' && raw ? Object.keys(raw).join(', ') : 'n/a'}`);
    console.error(`[debug] raw response (first 1500 chars):\n${content.slice(0, 1500)}`);
    throw new Error(`${model} schema failure: ${JSON.stringify(parsed.error.errors.slice(0, 5))}`);
  }
  return { data: parsed.data, usage, raw: content };
}

// ---------------- public entry ----------------

export async function generateSagaSkeleton(client: OpenAI, req: SagaGenesisRequest): Promise<{
  skeleton: SagaSkeleton;
  usage: CallUsage;
  sample: PoolCharacter[];
  anchor?: PoolCharacter;
}> {
  const { user, sample, anchor } = buildUser(req);
  const { data: skeleton, usage } = await callJson(client, SAGA_MODEL, SAGA_SYSTEM, user, SagaSkeletonSchema, 8000, SAGA_EFFORT);
  return { skeleton, usage, sample, anchor };
}

// ---------------- cross-check validations (docs/SAGAS.md §9) ----------------

export interface SkeletonValidation {
  pass: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSkeleton(skel: SagaSkeleton, req: SagaGenesisRequest, sample: PoolCharacter[], anchor?: PoolCharacter): SkeletonValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (skel.phases.length !== req.targetPhaseCount) {
    errors.push(`phase count: got ${skel.phases.length}, want ${req.targetPhaseCount}`);
  }

  const knownIds = new Set<string>([...req.pool.cachedPrefix(req.region).map((c) => c.id), ...sample.map((c) => c.id)]);
  if (anchor) knownIds.add(anchor.id);
  const pinnedIds = skel.pinnedCast.map((c) => c.characterId);
  for (const id of pinnedIds) {
    if (!knownIds.has(id)) errors.push(`pinned cast id "${id}" not in pool`);
  }

  if (req.kind === 'unit' && anchor && !pinnedIds.includes(anchor.id)) {
    errors.push(`unit saga: anchor "${anchor.id}" missing from pinnedCast`);
  }

  const banned = ['weight', 'weighed', 'shadow', 'burden', 'ghosts', 'fate', 'destined', 'destiny', 'ancient evil', 'darkness descends'];
  const text = [
    skel.hook,
    ...skel.pinnedCast.flatMap((c) => [c.sagaRole, c.charmHook]),
    ...skel.phases.flatMap((p) => p.plotPoints),
  ].join(' ').toLowerCase();
  for (const tok of banned) {
    if (text.includes(tok)) warnings.push(`banned token "${tok}" appears`);
  }

  // Quality warnings (not blocking): charmHook should sound like a person, not a role label.
  for (const c of skel.pinnedCast) {
    if (c.charmHook.length < 40) warnings.push(`charmHook for ${c.characterId} feels thin (<40 chars): "${c.charmHook}"`);
  }

  return { pass: errors.length === 0, errors, warnings };
}
