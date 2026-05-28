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

export interface ScenarioResolution {
  scenarioId: string;
  title: string;
  target: string;
  archetype: string;
  partySize: number;
  slotContributions: SlotContribution[];
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
  const summed = slotContributions.reduce((s, c) => s + c.coinsContributed, 0);
  const partyBonus = Math.max(0, assignments.length - scenario.partySize.min);
  const coinsActual = Math.max(
    1,
    Math.min(MAX_COINS, Math.min(summed, scenario.coinBudget + partyBonus)),
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
  };
  const narration = await llm.narrate(req);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    target: scenario.target,
    archetype: scenario.archetype,
    partySize: assignments.length,
    slotContributions,
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
