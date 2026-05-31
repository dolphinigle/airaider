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

// ---------------- schema ----------------

export const SagaPhaseHintSchema = z.object({
  intent: z.string().min(40),
  deliveryHint: z.string().min(40),
});

export const SagaSkeletonSchema = z.object({
  workingTitle: z.string().min(2).max(60),
  controllingIdea: z.string().min(40),
  antagonistPlan: z.string().min(40),
  finalImageTarget: z.string().min(40),
  body: z.array(z.string().min(120)).min(3).max(4),
  phases: z.array(SagaPhaseHintSchema).min(2).max(5),
  pinnedCastIds: z.array(z.string().min(2)).min(2).max(6).refine(
    (ids) => new Set(ids).size === ids.length,
    { message: 'pinnedCastIds must be unique' },
  ),
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

const SAGA_SYSTEM = `You are the writer-room foreman for a grimdark mercenary-fort game. You author a SAGA SKELETON — the hidden master plot for a long arc that will be delivered to the player over 2-5 separate quest chains across many in-world days.

The player NEVER sees your output. Your job is to give every chain's writers' room downstream a FIXED DESTINATION so plants in chain 1 can pay off in chain 3.

OUTPUT REQUIREMENTS:
- "body" is 3-4 paragraphs. Each paragraph covers a 1-3 chain span and ENDS WITH A CONCRETE PHYSICAL IMAGE, not an abstract concept.
- "antagonistPlan" must describe what the antagonist DOES if the heroes do nothing. State it as a verb-driven sequence, not a vibe.
- "finalImageTarget" must be a single sentence describing the LAST SHOT the player should see in the final chain's climax beat. A specific image — a man bound at a jetty, a banner cut down, a coin pressed into a dead hand.
- "phases" length MUST equal the engine's targetPhaseCount. Each phase has a one-sentence intent (what it delivers) and a one-sentence deliveryHint (how a chain should embody it).
- "pinnedCastIds" REQUIRED: an array of AT LEAST 2 and AT MOST 6 DISTINCT character IDs copied VERBATIM from the pool block below (look for id="char_xxx"). NO DUPLICATES. These are characters who will appear in MULTIPLE chains of this saga. For a unit saga, the anchor merc's id MUST be one of them (but list it only ONCE — add other distinct pool characters as well). Do NOT leave this array empty. Do NOT invent IDs.
- "controllingIdea" is the moral spine — what this saga is ABOUT in one sentence. No abstract concepts like "fate" or "destiny"; ground it in a concrete tension.
- "workingTitle" is internal-only (the player sees chain titles, not the saga title). 2-8 words, concrete, no "Weight of X" pattern.

DO NOT:
- Write any beats, chain bibles, or lead-board blurbs. The skeleton is upstream of all that.
- Invent character IDs not in the pool. Use existing IDs only; chain genesis may introduce new characters as needed.
- Use abstract destination words: "fate", "destiny", "darkness descends", "the weight of X", "shadows", "burden", "ancient evil".

BANNED TOKENS: weight, weighed, shadow, burden, ghosts, fate, destined, destiny, ancient evil, darkness descends.

CRITICAL FORMATTING: body is an array of 3-4 strings. phases is an array. pinnedCastIds is an array of strings. Output JSON only.`;

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

  // 1+2. zod already gates body length / phase count, but explicit phase-count match:
  if (skel.phases.length !== req.targetPhaseCount) {
    errors.push(`phase count: got ${skel.phases.length}, want ${req.targetPhaseCount}`);
  }

  // 3. cast existence
  const knownIds = new Set<string>([...req.pool.cachedPrefix(req.region).map((c) => c.id), ...sample.map((c) => c.id)]);
  if (anchor) knownIds.add(anchor.id);
  for (const id of skel.pinnedCastIds) {
    if (!knownIds.has(id)) errors.push(`pinned cast id "${id}" not in pool`);
  }

  // 4. unit saga: anchor must be in pinned
  if (req.kind === 'unit' && anchor && !skel.pinnedCastIds.includes(anchor.id)) {
    errors.push(`unit saga: anchor "${anchor.id}" missing from pinnedCastIds`);
  }

  // 5. banned tokens scan
  const banned = ['weight', 'weighed', 'shadow', 'burden', 'ghosts', 'fate', 'destined', 'destiny', 'ancient evil', 'darkness descends'];
  const text = [skel.controllingIdea, skel.antagonistPlan, skel.finalImageTarget, ...skel.body, ...skel.phases.flatMap((p) => [p.intent, p.deliveryHint])].join(' ').toLowerCase();
  for (const tok of banned) {
    if (text.includes(tok)) warnings.push(`banned token "${tok}" appears`);
  }

  // 6. body paragraph concrete-image heuristic: last 80 chars of each paragraph should
  //    contain at least one noun-like physical word (not perfect, but flags drift).
  const physicalCue = /(jetty|gate|table|coin|blade|knife|sword|letter|chest|barge|ledger|cup|wound|stone|iron|wood|rope|chain|bone|cloak|banner|seal|page|bell|fire|smoke|hand|throat|eye|window|door|wall|harbour|river|road|cell|dungeon|forge|cellar|loft|shrine|altar|grave|knot|nail|hook|bolt|patch|brick|paper|ink|wax|tide|mud|dust|tooth|finger|boot|map|key|lock|chain|tomb|page)/i;
  skel.body.forEach((para, i) => {
    const tail = para.slice(-100);
    if (!physicalCue.test(tail)) warnings.push(`body paragraph ${i + 1} tail may lack a concrete physical image: "${tail.trim()}"`);
  });

  return { pass: errors.length === 0, errors, warnings };
}
