// PROTO-GAME: Lead Board — the core gameplay scarcity loop.
//
// Per SIM_BIBLE §10: a Lead is an abstract opportunity (rarity, region, DC,
// reward budget, expiry). Player must PURSUE it (pay gold) to materialize
// into a concrete Scenario that can be played that day.
//
// Minimal prototype scope:
//   - 4 rarities (common/uncommon/rare/legendary) with expiry 5/4/3/2 days
//   - Pursue cost = 1g / 2g / 4g / 8g (scales with rarity)
//   - Reward = dc * rarity-mult (4/6/9/14)
//   - DC 1..5 maps to coinBudget 3..7 in the materialized scenario
//   - 4 archetypes (raid/heist/recovery/contract) chosen randomly
//   - Daily refresh to TARGET_LEAD_COUNT, replacing expired ones
//   - Materializes via scenarioTemplates → FixtureScenario in memory

import { z } from 'zod';
import type { FixtureScenario } from './scenarios.js';
import { templateFor } from './scenarioTemplates.js';
import { rngFromString } from './rng.js';

function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
function randIntInc(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export const LEAD_RARITIES = ['common', 'uncommon', 'rare', 'legendary'] as const;
export type LeadRarity = (typeof LEAD_RARITIES)[number];

export const EXPIRY_BY_RARITY: Record<LeadRarity, number> = {
  common: 5, uncommon: 4, rare: 3, legendary: 2,
};
export const PURSUE_COST_BY_RARITY: Record<LeadRarity, number> = {
  common: 1, uncommon: 2, rare: 4, legendary: 8,
};
const REWARD_MULT_BY_RARITY: Record<LeadRarity, number> = {
  common: 4, uncommon: 6, rare: 9, legendary: 14,
};
// Daily rarity roll weights (totals 100). Tilted heavily to common.
const RARITY_WEIGHTS: Record<LeadRarity, number> = {
  common: 60, uncommon: 28, rare: 10, legendary: 2,
};

const REGIONS = ['Crow\'s Ford', 'Pinewood', 'Greythorn', 'Eastfen', 'Saltmire', 'Blackmoor', 'Ironvale'];
const ARCHETYPES = ['raid', 'recovery', 'contract', 'heist', 'captive'] as const;
export type LeadArchetype = (typeof ARCHETYPES)[number];

export const TARGET_LEAD_COUNT = 5;

export const LeadSchema = z.object({
  id: z.string(),
  rarity: z.enum(LEAD_RARITIES),
  archetype: z.enum(ARCHETYPES),
  region: z.string(),
  /** 1..5 — higher = harder, more coins required, bigger reward. */
  dc: z.number().int().min(1).max(5),
  rewardGold: z.number().int().min(1),
  pursueCost: z.number().int().min(0),
  postedDay: z.number().int().min(0),
  /** Inclusive — on dayCount > expiryDay the lead is removed. */
  expiryDay: z.number().int().min(0),
  /** One-line flavour shown to the player on the lead board. */
  blurb: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

function rollRarity(rng: () => number, weights?: Record<LeadRarity, number>): LeadRarity {
  const w = weights ?? RARITY_WEIGHTS;
  const total = LEAD_RARITIES.reduce((s, k) => s + w[k], 0);
  const r = rng() * total;
  let acc = 0;
  for (const rarity of LEAD_RARITIES) {
    acc += w[rarity];
    if (r < acc) return rarity;
  }
  return 'common';
}

/** Exported view of the base rarity weights — used by prestige tilting. */
export const BASE_RARITY_WEIGHTS: Readonly<Record<LeadRarity, number>> = RARITY_WEIGHTS;

const BLURBS: Record<LeadArchetype, string[]> = {
  raid: [
    'caravan whispers say a slaver column passes through at dusk',
    'a brigand longhouse stands undefended while its captain feasts',
    'a tax-cart limps home with thin escort',
  ],
  recovery: [
    'a merchant\'s widow offers gold for her son\'s body',
    'an heirloom blade rests in the hands of a thrice-killed lord',
    'the abbey wants its reliquary back from the wolves that took it',
  ],
  contract: [
    'a magistrate quietly seeks unsworn hands for a delicate job',
    'a guild factor needs a problem made to vanish before audit',
    'a militia captain will pay above-market to thin the bandit camp',
  ],
  heist: [
    'a tower vault was sealed in haste before the snow',
    'an upriver toll-house keeps coin in a single iron chest',
    'a chapel\'s silver was never quite consecrated',
  ],
  captive: [
    'a deserter is hiding in the marsh fen — alive he is worth more than dead',
    'a guildsman\'s favourite courier was taken with a price on his head',
    'a witness is needed alive at the holdfast trial in three nights',
  ],
};

/** Generate a single lead deterministically given a seed. */
export function generateLead(opts: {
  seed: string;
  postedDay: number;
  /** PROTO-GAME v14: optional rarity weight override (e.g. prestige tilt). */
  rarityWeights?: Record<LeadRarity, number>;
}): Lead {
  const rng = rngFromString(opts.seed);
  const rarity = rollRarity(rng, opts.rarityWeights);
  const archetype = pickFrom(rng, ARCHETYPES as readonly LeadArchetype[]);
  const region = pickFrom(rng, REGIONS);
  // DC scales with rarity: common 1-2, uncommon 2-3, rare 3-4, legendary 4-5.
  const dcBase = { common: 1, uncommon: 2, rare: 3, legendary: 4 }[rarity];
  const dc = dcBase + randIntInc(rng, 0, 1);
  const rewardGold = dc * REWARD_MULT_BY_RARITY[rarity];
  const blurb = pickFrom(rng, BLURBS[archetype]);
  return {
    id: `lead-${opts.postedDay}-${Math.floor(rng() * 1e9).toString(36)}`,
    rarity, archetype, region, dc, rewardGold,
    pursueCost: PURSUE_COST_BY_RARITY[rarity],
    postedDay: opts.postedDay,
    expiryDay: opts.postedDay + EXPIRY_BY_RARITY[rarity],
    blurb,
  };
}

/**
 * Prune expired leads and top the board up to TARGET_LEAD_COUNT new ones.
 * Idempotent within a day: the seed mixes dayCount + slot index so calling
 * twice in the same day produces the same fill.
 */
export function refreshLeadBoard(opts: {
  board: Lead[];
  dayCount: number;
  target?: number;
  /** PROTO-GAME v14: prestige-tilted rarity weights for new spawns. */
  rarityWeights?: Record<LeadRarity, number>;
}): { kept: Lead[]; added: Lead[]; expired: Lead[] } {
  const target = opts.target ?? TARGET_LEAD_COUNT;
  const kept: Lead[] = [];
  const expired: Lead[] = [];
  for (const lead of opts.board) {
    if (lead.expiryDay < opts.dayCount) expired.push(lead);
    else kept.push(lead);
  }
  const added: Lead[] = [];
  let i = 0;
  while (kept.length + added.length < target) {
    added.push(generateLead({
      seed: `lead-board-d${opts.dayCount}-slot${kept.length + i}`,
      postedDay: opts.dayCount,
      ...(opts.rarityWeights ? { rarityWeights: opts.rarityWeights } : {}),
    }));
    i += 1;
  }
  return { kept, added, expired };
}

export interface PursueResult {
  ok: true;
  lead: Lead;
  scenario: FixtureScenario;
  goldSpent: number;
}
export interface PursueError {
  ok: false;
  error: string;
}

/**
 * Materialize a lead into a FixtureScenario the day loop can run.
 * Caller is responsible for removing the lead from the board and
 * deducting roster.gold; this function only computes the result.
 */
export function pursueLead(lead: Lead, dayCount: number): PursueResult | PursueError {
  if (lead.expiryDay < dayCount) {
    return { ok: false, error: `lead ${lead.id} expired on day ${lead.expiryDay}` };
  }
  const scenario = templateFor(lead);
  return { ok: true, lead, scenario, goldSpent: lead.pursueCost };
}
