// PROTO-GAME v16: Quest Chains.
//
// See /docs/QUEST_CHAINS.md for the design. In short: chains are multi-step
// arcs threaded by a hidden 3-4 paragraph SKELETON that the AI authors ONCE
// at genesis. Each subsequent step blurb is generated against the skeleton
// + structured anchors, so the AI doesn't drift across the arc.
//
// This file owns ONLY the types, zod schemas, and pure helpers (rarity
// planning, step-count, mention validation). All AI calls live in
// engine/server/src/aiQuestChain.ts; all state transitions live in
// engine/server/src/dispatch.ts.

import { z } from 'zod';
import type { LeadRarity } from './leads.js';

export const CHAIN_STATUS = ['active', 'completed', 'failed', 'abandoned'] as const;
export type ChainStatus = (typeof CHAIN_STATUS)[number];

export const CHAIN_KIND = ['world', 'unit'] as const;
export type ChainKind = (typeof CHAIN_KIND)[number];

export const STEP_STATUS = [
  'pending',
  'active',
  'resolved-favorable',
  'resolved-unfavorable',
  'resolved-catastrophic',
  'resolved-catastrophic-favorable',
] as const;
export type StepStatus = (typeof STEP_STATUS)[number];

export const ResolutionBandSchema = z.enum([
  'favorable', 'unfavorable', 'catastrophic', 'catastrophic-favorable',
]);
export type ResolutionBand = z.infer<typeof ResolutionBandSchema>;

export const ChainAnchorsSchema = z.object({
  centralNpc: z.string().min(1),
  antagonistFaction: z.string().min(1),
  recurringPlaces: z.array(z.string()).default([]),
  /** Engine validates blurbs mention ≥1 of these (advisory; logs only). */
  mustMentionByStep: z.array(z.array(z.string())).default([]),
});
export type ChainAnchors = z.infer<typeof ChainAnchorsSchema>;

export const RARITY_VALS = ['common', 'uncommon', 'rare', 'legendary'] as const;
export const ChainRaritySchema = z.enum(RARITY_VALS);

export const ChainStepSchema = z.object({
  stepIdx: z.number().int().min(0),
  plannedRarity: ChainRaritySchema,
  originalPlannedRarity: ChainRaritySchema,
  leadId: z.string().optional(),
  status: z.enum(STEP_STATUS).default('pending'),
  summary: z.string().optional(),
  resolvedDay: z.number().int().min(0).optional(),
  band: ResolutionBandSchema.optional(),
  partyMercIds: z.array(z.string()).default([]).optional(),
});
export type ChainStep = z.infer<typeof ChainStepSchema>;

export const QuestChainSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(CHAIN_KIND),
  chainRarity: ChainRaritySchema,
  region: z.string().min(1),
  // hidden
  skeleton: z.string().min(1),
  anchors: ChainAnchorsSchema,
  stepBeats: z.array(z.string()).min(3).max(5),
  // player-facing
  title: z.string().min(1),
  hook: z.string().min(1),
  // engine
  unitId: z.string().optional(),
  seedLeadId: z.string().optional(),
  priorChainId: z.string().optional(),
  themeTagIds: z.array(z.string()).default([]),
  steps: z.array(ChainStepSchema).min(3).max(5),
  currentStepIdx: z.number().int().min(0),
  status: z.enum(CHAIN_STATUS),
  startedDay: z.number().int().min(0),
  endedDay: z.number().int().min(0).optional(),
  epilogue: z.string().optional(),
});
export type QuestChain = z.infer<typeof QuestChainSchema>;

// ---------- pure helpers (no IO, no AI) ----------

/** Steps per chain rarity. Engine-owned; AI must produce stepBeats of this length. */
export function plannedStepCount(rarity: LeadRarity): 3 | 4 | 5 {
  switch (rarity) {
    case 'legendary': return 5;
    case 'rare': return 4;
    default: return 3; // common, uncommon
  }
}

/** Rising rarity curve across the chain. Climax is at chain rarity; earlier
 *  steps step down one tier per step from the climax (clamped at common). */
export function plannedRarityCurve(chainRarity: LeadRarity): LeadRarity[] {
  const count = plannedStepCount(chainRarity);
  const idxOf: Record<LeadRarity, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
  const climaxIdx = idxOf[chainRarity];
  const tier = (i: number): LeadRarity => {
    // distance from climax: last step = climax, prior = climax-1, etc.
    const distance = count - 1 - i;
    const t = Math.max(0, climaxIdx - distance);
    return (['common', 'uncommon', 'rare', 'legendary'] as const)[t]!;
  };
  return Array.from({ length: count }, (_, i) => tier(i));
}

/** One tier down. Floors at common. */
export function downshiftRarity(r: LeadRarity): LeadRarity {
  const order: LeadRarity[] = ['common', 'uncommon', 'rare', 'legendary'];
  const i = order.indexOf(r);
  return order[Math.max(0, i - 1)]!;
}

/** Map a resolver band → step status. */
export function bandToStepStatus(band: ResolutionBand): StepStatus {
  switch (band) {
    case 'favorable': return 'resolved-favorable';
    case 'unfavorable': return 'resolved-unfavorable';
    case 'catastrophic': return 'resolved-catastrophic';
    case 'catastrophic-favorable': return 'resolved-catastrophic-favorable';
  }
}

/** Whether a step status counts as a "good enough" resolution (chain proceeds). */
export function isStepSuccessful(status: StepStatus): boolean {
  return status === 'resolved-favorable' || status === 'resolved-catastrophic-favorable';
}

/** Whether a step status is a hard fail (catastrophic bands). */
export function isStepCatastrophic(status: StepStatus): boolean {
  return status === 'resolved-catastrophic' || status === 'resolved-catastrophic-favorable';
}

/** Validate a step blurb mentions at least ONE anchor (case-insensitive
 *  substring). Returns matched anchor or null. Tries full string and any
 *  significant word (length ≥ 4, not a common article). */
export function blurbMentionsAnchor(
  blurb: string,
  anchors: ChainAnchors,
  stepIdx: number,
): string | null {
  const hay = blurb.toLowerCase();
  const candidates: string[] = [
    anchors.centralNpc,
    anchors.antagonistFaction,
    ...anchors.recurringPlaces,
    ...(anchors.mustMentionByStep[stepIdx] ?? []),
  ];
  const STOPWORDS = new Set(['the', 'and', 'of', 'in', 'at', 'a', 'an', 'to', 'for']);
  for (const c of candidates) {
    if (!c) continue;
    if (hay.includes(c.toLowerCase())) return c;
    const words = c.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z']/g, ''));
    for (const w of words) {
      if (w.length < 4) continue;
      if (STOPWORDS.has(w)) continue;
      if (hay.includes(w)) return c;
    }
  }
  return null;
}

/** Build a compact prompt-friendly digest of the chain so far. Used by
 *  step-blurb prompt to keep token cost bounded (skeleton goes in epilogue
 *  prompt only). */
export function chainDigest(chain: QuestChain): string {
  const beatsSoFar = chain.stepBeats
    .slice(0, chain.currentStepIdx + 1)
    .map((b, i) => `  step ${i} beat: ${b}`)
    .join('\n');
  const priorSummaries = chain.steps
    .slice(0, chain.currentStepIdx)
    .filter((s) => s.summary)
    .map((s) => `  step ${s.stepIdx} outcome (${s.band ?? '?'}): ${s.summary}`)
    .join('\n');
  return [
    `title: ${chain.title}`,
    `central NPC: ${chain.anchors.centralNpc}`,
    `antagonist: ${chain.anchors.antagonistFaction}`,
    `places: ${chain.anchors.recurringPlaces.join(', ')}`,
    `region: ${chain.region}`,
    `beats so far:\n${beatsSoFar}`,
    priorSummaries ? `prior step outcomes:\n${priorSummaries}` : 'no prior outcomes (this is step 0)',
  ].join('\n');
}
