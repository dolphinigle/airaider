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
  sagaRole: z.string().min(1),    // what they DO across the saga
  charmHook: z.string().min(1),   // what makes them endearing / alive / memorable
});

export const SagaPhaseSchema = z.object({
  plotPoints: z.array(z.string().min(1)).min(1).max(7),
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

The player NEVER sees your output. You are writing for the chain-writers' rooms downstream.

THE GOLD STANDARD — your output should feel like THIS (Cinderella, retold as a saga skeleton):

  hook: "An abused orphan, secretly destined for royalty — reader pays off when the family eats crow."

  pinnedCast:
    - characterId: "char_cinderella"   sagaRole: "Endures the family. Earns the prince by being herself when noticed."
                                       charmHook: "Too kind to wish her tormentors ill — which is why her victory tastes sweeter."
    - characterId: "char_stepmother"   sagaRole: "Polices Cinderella's chances out of envy. Engineers the family's invite to the ball."
                                       charmHook: "Performs propriety in public, petty venom in private — comically self-defeating."
    - characterId: "char_fairy"        sagaRole: "Intervenes once, with rules. Sets the midnight clock that drives Act 2."
                                       charmHook: "Loves bending rules, but enforces midnight strictly — chaotic-good auntie energy."
    - characterId: "char_prince"       sagaRole: "Falls for Cinderella in one dance. Searches the kingdom by shoe."
                                       charmHook: "Genuinely smitten after one dance — no pickup-artist suaveness, just stunned."

  phase 1 plotPoints:
    1. Party invitation arrives. Family forbids Cinderella.
    2. She prays; fairy answers; blesses her with deadline.
    3. Cinderella attends, prince smitten by ONE dance.
    4. Midnight; she flees, leaves slipper.

  phase 2 plotPoints:
    1. Prince sweeps the kingdom with the slipper.
    2. Stepmother schemes to fit her own daughters; both fail.
    3. Cinderella tries it on; perfect fit, family humiliated.
    4. Cinderella forgives them anyway — wedding eclipses their disgrace.

NOTICE WHAT MAKES IT WORK:
- The HOOK is one specific image-of-payoff: "the family eats crow." Not a theme. Not a vibe. An OUTCOME a reader is rooting toward.
- Each charmHook is a CONTRADICTION or HIGHLY SPECIFIC BEHAVIOR ("loves bending rules but enforces midnight strictly"). Adjective lists ("stoic, dutiful, conflicted") are WORTHLESS — delete them.
- Plot points are TERSE BUT MULTI-EVENT. "She prays; fairy answers; blesses her with deadline" packs THREE story-beats into 8 words. Each clause earns its place.
- Antagonist (stepmother) feels like a PERSON, not a plot generator. She does specific human things ("engineers the family's invite") and has a comic flaw.

THE METRIC IS MEANING DENSITY, NOT WORD COUNT.

You may write long bullets IF every clause delivers a NEW story-beat, character revelation, or contradiction. You may NOT write long bullets that pad with mood, adjectives, or scene-setting.

BAD (verbose, low density):
  "A barge captain washes up dead on the Greyford jetty with a sealed Tevin chit nailed to his palm, drawing the fort's attention to a Tevin transfer route."
  → 28 words, ONE event: "body found with clue". Delete everything that doesn't add a new beat.

GOOD (terse OR dense):
  "Dead captain on the jetty; Tevin chit nailed to his palm." (10 words, same content)
  OR
  "Dead captain on the jetty; chit names a Tevin route; harbour-master pretends he doesn't recognize the seal." (17 words, THREE beats: body, evidence-points-where, antagonist-tells-on-himself)

BAD (verbose charmHook):
  "Stiff, blunt and quietly pained by old failures; he measures his worth in whether his people live through winter and speaks most honestly in curt orders."
  → adjective stacking. Says "stoic dutiful commander".

GOOD (dense charmHook):
  "Believes a commander who needs thanks has already failed — accidentally hurts the people he protects by never letting them repay him."
  → contradiction (good leadership / bad relationships), specific behavior, comic-tragic.

RULES:
- Every clause must earn its place. If you can delete it without losing a beat, character revelation, or contradiction, DELETE IT.
- charmHook is a SINGLE CONTRADICTION or HIGHLY SPECIFIC BEHAVIOR. No adjective stacking. No "stoic but caring" generics.
- The HOOK names ONE image-of-payoff the reader will be rooting toward.
- Plot points END EACH PHASE with the event that justifies the engine's fixed reward for that phase.
- Plot points are bullet-level outline, NOT prose. They are read by the chain-writers' room as a checklist, not consumed as story.
- For a unit saga, the anchor merc MUST be in pinnedCast and the hook MUST be their personal payoff.
- All characterIds MUST exist in the pool block. NO INVENTED IDs.
- Phase count MUST equal the engine's targetPhaseCount.

DO NOT:
- Write a "controllingIdea" or moralizing theme. The reader does not want a moral; they want CHARACTERS they're rooting for.
- Write the saga as prose. Plot points are bullet outline.
- Write antagonist plans as a separate field. Their plan IS the plot points; their humanity IS their charmHook.

BANNED TOKENS (in any field): weight, weighed, shadow, burden, ghosts, ancient evil, darkness descends.

CRITICAL FORMATTING: phases is an array. plotPoints is an array of strings. pinnedCast is an array of objects with EXACTLY these field names: "characterId" (NOT "id"), "sagaRole", "charmHook". pinnedCast contains AT MOST 6 entries (3-5 is the sweet spot — only include characters who matter across phases). Output JSON only.`;

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
    parts.push(``, poolBlock([anchor], `REQUIRED ANCHOR — this is a UNIT SAGA. This merc MUST be in pinnedCast and the hook MUST be their personal payoff (driven by their want/need/ghost/lie). The saga IS their personal arc.`));
  }
  parts.push(``, `SAGA SPEC`,
    `Region: ${req.region}`,
    `Kind: ${req.kind}`,
    `Rarity: ${req.rarity}`,
    `Target phase count: ${req.targetPhaseCount} (you MUST output exactly this many phases)`,
    `Per-phase reward (engine-fixed, climaxes deliver these in order):`);
  req.perPhaseRewardHints.forEach((h, i) => parts.push(`  phase ${i + 1}: ${describeRewardHint(h)}`));
  if (req.incitingEventBlurb) {
    parts.push(``, `INCITING EVENT (must drive phase 1's plot points): ${req.incitingEventBlurb}`);
  }
  if (req.priorSagaEpilogue) {
    parts.push(``, `PRIOR SAGA EPILOGUE — this saga is a follow-up. Its hook must evolve from this past (pick up a loose thread, an unresolved character, a debt unpaid):`, req.priorSagaEpilogue);
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

  const banned = ['weight', 'weighed', 'shadow', 'burden', 'ghosts', 'ancient evil', 'darkness descends'];
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
