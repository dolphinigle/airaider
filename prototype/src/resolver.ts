import type { Merc, OutcomeBand } from './types.js';
import type { Rng } from './rng.js';
import { resolveCoins, MAX_COINS } from './sultan.js';
import type { ScenarioLLM, ScenarioLLMRequest } from './llm/interface.js';
import type { FixtureScenario } from './scenarios.js';
import { fortEffectsFor, flatCoinBonus, slotCoinBonus, negativeSeasonClamped, palisadeBlocksCasualty } from './fortEffects.js';

export interface Assignment {
  slotId: string;
  merc: Merc;
}

export interface ResolutionInput {
  scenario: FixtureScenario;
  assignments: Assignment[];
  llm: ScenarioLLM;
  rng: Rng;
  /** M2: fatigue lookup for the day loop. */
  fatigueOf?: (mercId: string) => number;
  /** M5.3: id of the chosen approach (must match scenario.approaches[].id). */
  approachId?: string;
  /** M5.5: current reputation per faction id (read-only). */
  reputationOf?: (factionId: string) => number;
  /** M6.2: set of bonded pair keys (use `bonds.pairKey`). */
  bondedPairs?: Set<string>;
  /** M6.3: current season; if set with a scenario.seasonModifier, applies a flat coin delta. */
  season?: import('./season.js').Season;
  /** M7.1: ids of fort upgrades active on this run. */
  fortUpgrades?: Iterable<string>;
  /**
   * M7.8: veterancy tier lookup for the day loop. Veteran adds +1 coin to
   * their own slot, grizzled adds +2. Rookie (or absent) leaves it alone.
   */
  tierOf?: (mercId: string) => import('./veterancy.js').VeterancyTier | undefined;
}

export interface SlotContribution {
  slotId: string;
  mercId: string;
  attrUsed: string | null;
  attrScore: number;
  tagsMatched: string[];
  coinsContributed: number;
  /** M2: merc's fatigue at scenario start (0 if no fatigue source). */
  fatigue: number;
  /** M2: coins shaved off due to fatigue ≥ FATIGUE_THRESHOLD. */
  fatiguePenalty: number;
  /** M7.8: bonus coins added because the merc is veteran/grizzled (0 for rookie). */
  tierBonus: number;
  /** M7.8: tier looked up via tierOf (null if no lookup was provided). */
  tier: import('./veterancy.js').VeterancyTier | null;
  /**
   * M7.9: coins added back to this slot because the merc is bonded with at
   * least one other party member, which reduces the fatigue penalty by 1
   * (floor 0). Always 0 when fatiguePenalty was already 0.
   */
  bondFatigueRelief: number;
}

export interface PartySynergy {
  pairs: Array<{ mercA: string; mercB: string; sharedTagId: string }>;
  bonusCoins: number;
}

/** M5.1: a wound inflicted on a party merc during a scenario. */
export interface Casualty {
  mercId: string;
  /** HP damage dealt to the merc in this scenario. */
  damage: number;
  /** Why the wound landed (tied to the band). */
  reason: string;
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
  /** M5.1: wounds inflicted during this scenario (empty if none). */
  casualties: Casualty[];
  /** M5.3: which approach was chosen (if the scenario offers any). */
  approachId?: string;
  approachLabel?: string;
  /** M5.5: reputation deltas owed to the roster from this resolution. */
  reputationDeltas: Array<{ factionId: string; delta: number }>;
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

/** M2 fatigue: at-start fatigue ≥ FATIGUE_THRESHOLD applies −1 to that merc's slot. */
export const FATIGUE_THRESHOLD = 2;
export const FATIGUE_PENALTY = 1;

export interface SlotContribOptions {
  /** If provided, returns the merc's current fatigue at scenario start. */
  fatigueOf?: (mercId: string) => number;
  /** M7.8: optional tier lookup for the slot occupant. */
  tierOf?: (mercId: string) => import('./veterancy.js').VeterancyTier | undefined;
  /**
   * M7.9: known bonded-pair keys (use `bonds.pairKey`). When a slot occupant
   * is bonded with any other merc in the same party, their fatigue penalty
   * is reduced by 1 (floor 0). Surfaces as `SlotContribution.bondFatigueRelief`.
   */
  bondedPairs?: Set<string>;
}

/** M7.8: per-tier flat coin bonus added on top of the slot's base contribution. */
export const TIER_COIN_BONUS: Record<import('./veterancy.js').VeterancyTier, number> = {
  rookie: 0,
  veteran: 1,
  grizzled: 2,
};

export function computePartySynergy(
  assignments: Assignment[],
  bondedPairs?: Set<string>,
): PartySynergy {
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
      if (bondedPairs) {
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        if (bondedPairs.has(key)) {
          pairs.push({ mercA: a.id, mercB: b.id, sharedTagId: 'bond:trusts' });
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
  opts: SlotContribOptions = {},
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
    let fatigue = 0;
    let fatiguePenalty = 0;
    let bondFatigueRelief = 0;
    if (opts.fatigueOf) {
      fatigue = opts.fatigueOf(merc.id);
      if (fatigue >= FATIGUE_THRESHOLD) {
        fatiguePenalty = FATIGUE_PENALTY;
        // M7.9: if any other merc in this party is bonded with us, soften
        // the penalty by 1 (floor 0). Bond relief never raises the slot
        // above its pre-fatigue value.
        if (opts.bondedPairs && fatiguePenalty > 0) {
          const bonded = assignments.some(({ merc: other }) => {
            if (other.id === merc.id) return false;
            const key = merc.id < other.id ? `${merc.id}|${other.id}` : `${other.id}|${merc.id}`;
            return opts.bondedPairs!.has(key);
          });
          if (bonded) {
            bondFatigueRelief = 1;
            fatiguePenalty = Math.max(0, fatiguePenalty - 1);
          }
        }
        coins = Math.max(1, coins - fatiguePenalty);
      }
    }
    let tier: import('./veterancy.js').VeterancyTier | null = null;
    let tierBonus = 0;
    if (opts.tierOf) {
      const t = opts.tierOf(merc.id);
      if (t) {
        tier = t;
        tierBonus = TIER_COIN_BONUS[t];
        coins += tierBonus;
      }
    }
    return {
      slotId, mercId: merc.id, attrUsed, attrScore, tagsMatched,
      coinsContributed: coins, fatigue, fatiguePenalty, tierBonus, tier,
      bondFatigueRelief,
    };
  });
}

export async function resolveScenario(input: ResolutionInput): Promise<ScenarioResolution> {
  const { scenario, assignments, llm, rng, fatigueOf, approachId, reputationOf } = input;
  if (
    assignments.length < scenario.partySize.min ||
    assignments.length > scenario.partySize.max
  ) {
    throw new Error(
      `Party size ${assignments.length} not in [${scenario.partySize.min}, ${scenario.partySize.max}]`,
    );
  }

  // M5.3: resolve approach (if any). Pick explicit > default > undefined.
  let approach: import('./scenarios.js').ScenarioApproach | undefined;
  if (scenario.approaches && scenario.approaches.length > 0) {
    const pickId = approachId ?? scenario.defaultApproachId ?? scenario.approaches[0]!.id;
    approach = scenario.approaches.find((a) => a.id === pickId);
    if (!approach) {
      throw new Error(
        `Unknown approach id ${pickId} for scenario ${scenario.id}; valid: ${scenario.approaches.map((a) => a.id).join(', ')}`,
      );
    }
  }

  const slotContributions = computeSlotContributions(scenario, assignments, { fatigueOf, tierOf: input.tierOf, bondedPairs: input.bondedPairs });

  // M5.3: apply per-slot approach modifiers.
  if (approach?.slotModifiers) {
    for (const sc of slotContributions) {
      const mod = approach.slotModifiers[sc.slotId];
      if (!mod) continue;
      if (typeof mod.coinDelta === 'number') {
        sc.coinsContributed = Math.max(1, sc.coinsContributed + mod.coinDelta);
      }
      if (mod.requireTag) {
        const assn = assignments.find((a) => a.slotId === sc.slotId);
        const carries = !!assn?.merc.tags.some((t) => t.id === mod.requireTag);
        if (!carries) sc.coinsContributed = Math.max(1, sc.coinsContributed - 1);
      }
    }
  }

  const synergy = computePartySynergy(assignments, input.bondedPairs);
  const fortEffects = fortEffectsFor(input.fortUpgrades);
  const rawSeasonDelta =
    input.season && scenario.seasonModifier
      ? (scenario.seasonModifier[input.season] ?? 0)
      : 0;
  const seasonDelta = rawSeasonDelta < 0 && negativeSeasonClamped(fortEffects, input.season)
    ? 0
    : rawSeasonDelta;
  const fortFlat = flatCoinBonus(fortEffects);
  const fortSlot = slotCoinBonus(fortEffects, scenario.slots.map((s) => s.id));
  const fortBonus = fortFlat + fortSlot;
  const summed =
    slotContributions.reduce((s, c) => s + c.coinsContributed, 0) + synergy.bonusCoins + seasonDelta + fortBonus;
  const partyBonus = Math.max(0, assignments.length - scenario.partySize.min);
  const coinsActual = Math.max(
    1,
    Math.min(MAX_COINS, Math.min(summed, scenario.coinBudget + partyBonus + synergy.bonusCoins + Math.max(0, seasonDelta) + fortBonus)),
  );
  const { roll, band } = resolveCoins(coinsActual, rng);

  // M5.1: on catastrophic band, the most-fatigued party member takes 1 HP.
  // Deterministic tiebreak: highest fatigueAtStart, then lowest mercId.
  const casualties: Casualty[] = [];
  if (band.band === 'catastrophic') {
    const candidates = assignments
      .map((a) => ({
        mercId: a.merc.id,
        fatigue: fatigueOf ? fatigueOf(a.merc.id) : 0,
      }))
      .sort((x, y) => {
        if (y.fatigue !== x.fatigue) return y.fatigue - x.fatigue;
        return x.mercId.localeCompare(y.mercId);
      });
    if (candidates.length > 0) {
      const damage = palisadeBlocksCasualty(fortEffects) ? 0 : 1;
      if (damage > 0) {
        casualties.push({
          mercId: candidates[0]!.mercId,
          damage,
          reason: 'catastrophic-band wound',
        });
      }
    }
  }

  const req: ScenarioLLMRequest = {
    scenarioTitle: scenario.title,
    scenarioTarget: scenario.target,
    archetype: scenario.archetype,
    party: assignments.map((a) => ({
      merc: a.merc,
      assignedSlotId: a.slotId,
      fatigueAtStart: fatigueOf ? fatigueOf(a.merc.id) : 0,
    })),
    slots: scenario.slots,
    band: band.band,
    bandReason: band.reason,
    synergy,
    approach: approach ? {
      id: approach.id, label: approach.label, summary: approach.summary, narrativeHint: approach.narrativeHint,
    } : undefined,
    factionContext: scenario.factionContext?.map((f) => ({
      factionId: f.factionId,
      summary: f.summary,
      currentStanding: reputationOf ? reputationOf(f.factionId) : 0,
    })),
    season: input.season,
  };
  const narration = await llm.narrate(req);

  // M5.5: compute reputation deltas for this band.
  const reputationDeltas: Array<{ factionId: string; delta: number }> = [];
  if (scenario.factionContext) {
    for (const f of scenario.factionContext) {
      let delta = 0;
      switch (band.band) {
        case 'favorable': delta = f.deltaOnFavorable ?? 0; break;
        case 'catastrophic-favorable': delta = f.deltaOnCatastrophicFavorable ?? f.deltaOnFavorable ?? 0; break;
        case 'unfavorable': delta = f.deltaOnUnfavorable ?? 0; break;
        case 'catastrophic': delta = f.deltaOnCatastrophic ?? f.deltaOnUnfavorable ?? 0; break;
      }
      if (delta !== 0) reputationDeltas.push({ factionId: f.factionId, delta });
    }
  }

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
    casualties,
    approachId: approach?.id,
    approachLabel: approach?.label,
    reputationDeltas,
  };
}
