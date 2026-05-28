import type { Merc, OutcomeBand } from './types.js';
import type { Rng } from './rng.js';
import { resolveCoins, MAX_COINS } from './sultan.js';
import type { ScenarioLLM, ScenarioLLMRequest } from './llm/interface.js';
import type { FixtureScenario } from './scenarios.js';

export interface Assignment {
  slotId: string;
  merc: Merc;
}

export interface ResolutionInput {
  scenario: FixtureScenario;
  assignments: Assignment[];
  llm: ScenarioLLM;
  rng: Rng;
}

export interface SlotContribution {
  slotId: string;
  mercId: string;
  attrUsed: string | null;
  attrScore: number;
  tagsMatched: string[];
  coinsContributed: number;
}

export interface PartySynergy {
  pairs: Array<{ mercA: string; mercB: string; sharedTagId: string }>;
  bonusCoins: number;
}

export interface ScenarioResolution {
  scenarioId: string;
  title: string;
  target: string;
  archetype: string;
  partySize: number;
  slotContributions: SlotContribution[];
  synergy: PartySynergy;
  baseCoinBudget: number;
  coinsActual: number;
  rollFaces: string[];
  heads: number;
  tails: number;
  band: OutcomeBand;
  bandReason: string;
  contributions: Array<{ mercId: string; line: string }>;
  outcomeNarrative: string;
  llmName: string;
}

/**
 * M1 party-pair synergy:
 *   For every pair of party mercs that shares a `pers:*` or `temp:*` tag,
 *   add +1 coin to the pool. Total synergy bonus capped at SYNERGY_CAP.
 *   `gender:*` and `bg:*` tags are deliberately excluded — those create
 *   natural cohorts (all soldiers, all women) that shouldn't compound.
 *
 * 🟡 OPEN (logged): which tag categories count, tier-weighted bonus,
 *   inter-tag synergies (e.g. brave + cautious creating "balanced pair").
 */
export const SYNERGY_CAP = 3;
const SYNERGY_PREFIXES = ['pers:', 'temp:'] as const;

export function computePartySynergy(assignments: Assignment[]): PartySynergy {
  const pairs: PartySynergy['pairs'] = [];
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a = assignments[i]!.merc;
      const b = assignments[j]!.merc;
      const aTagIds = new Set(a.tags.map((t) => t.id));
      for (const tag of b.tags) {
        if (!SYNERGY_PREFIXES.some((p) => tag.id.startsWith(p))) continue;
        if (aTagIds.has(tag.id)) {
          pairs.push({ mercA: a.id, mercB: b.id, sharedTagId: tag.id });
        }
      }
    }
  }
  const bonusCoins = Math.min(SYNERGY_CAP, pairs.length);
  return { pairs, bonusCoins };
}

/**
 * Coins per slot (M0 model):
 *   1 base coin per assigned slot
 * + 1 if merc's preferredAttr score ≥ 4 (Above Average)
 * + 1 per matching preferredTag id (synergy)
 *
 * Total coins are then capped at scenario.coinBudget plus a small
 * party-size bonus (party_size − partySize.min), and engine-capped at MAX_COINS.
 *
 * 🟡 OPEN (logged): exact coin-budget formula, attr-threshold tuning,
 * whether T1/T2 tag rolls grant extra coins beyond +1.
 */
export function computeSlotContributions(
  scenario: FixtureScenario,
  assignments: Assignment[],
): SlotContribution[] {
  return assignments.map(({ slotId, merc }) => {
    const slot = scenario.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Unknown slot ${slotId} for merc ${merc.id}`);
    let coins = 1;
    let attrScore = 0;
    let attrUsed: string | null = null;
    if (slot.preferredAttr) {
      attrUsed = slot.preferredAttr;
      attrScore = merc.attrs[slot.preferredAttr];
      if (attrScore >= 4) coins += 1;
    }
    const tagsMatched: string[] = [];
    if (slot.preferredTags && slot.preferredTags.length > 0) {
      for (const tagId of slot.preferredTags) {
        if (merc.tags.some((t) => t.id === tagId)) {
          tagsMatched.push(tagId);
          coins += 1;
        }
      }
    }
    return { slotId, mercId: merc.id, attrUsed, attrScore, tagsMatched, coinsContributed: coins };
  });
}

export async function resolveScenario(input: ResolutionInput): Promise<ScenarioResolution> {
  const { scenario, assignments, llm, rng } = input;
  if (
    assignments.length < scenario.partySize.min ||
    assignments.length > scenario.partySize.max
  ) {
    throw new Error(
      `Party size ${assignments.length} not in [${scenario.partySize.min}, ${scenario.partySize.max}]`,
    );
  }
  const slotContributions = computeSlotContributions(scenario, assignments);
  const synergy = computePartySynergy(assignments);
  const summed =
    slotContributions.reduce((s, c) => s + c.coinsContributed, 0) + synergy.bonusCoins;
  const partyBonus = Math.max(0, assignments.length - scenario.partySize.min);
  const coinsActual = Math.max(
    1,
    Math.min(MAX_COINS, Math.min(summed, scenario.coinBudget + partyBonus + synergy.bonusCoins)),
  );
  const { roll, band } = resolveCoins(coinsActual, rng);

  const req: ScenarioLLMRequest = {
    scenarioTitle: scenario.title,
    scenarioTarget: scenario.target,
    archetype: scenario.archetype,
    party: assignments.map((a) => ({ merc: a.merc, assignedSlotId: a.slotId })),
    slots: scenario.slots,
    band: band.band,
    bandReason: band.reason,
    synergy,
  };
  const narration = await llm.narrate(req);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    target: scenario.target,
    archetype: scenario.archetype,
    partySize: assignments.length,
    slotContributions,
    synergy,
    baseCoinBudget: scenario.coinBudget,
    coinsActual,
    rollFaces: roll.faces,
    heads: roll.heads,
    tails: roll.tails,
    band: band.band,
    bandReason: band.reason,
    contributions: narration.contributions,
    outcomeNarrative: narration.outcomeNarrative,
    llmName: llm.name,
  };
}
