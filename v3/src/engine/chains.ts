// Chains — QUESTS §6/§8, ECONOMY §5a, §21-4a. A chain is built around ONE focal
// character (generated FIRST, at the saga's payoff value); beats bank merc-cycles;
// the finale crystallizes the bank; failure = TIME (bank forfeit, focal slips away FOR NOW).

import type { Rng } from './rng.js';
import {
  chainPayoff, chainFocalTarget, rollChainKind, vBase, RARITY_MULT,
  type Rarity, type ChainKind,
} from './economy.js';
import type { Outcome } from './roll.js';

export interface BibleCastEntry { name: string; who: string; want: string; role: string; loreId?: string }

export interface Bible {
  title: string;
  kernel: string;              // the one-line collision of seed × slate
  cast: BibleCastEntry[];      // LEAN (BIBLE.md): one line + want + role
  situation: string;
  goal: string;
  arc: string[];               // ROUGH step guide, never prescriptive beat prose
  twist: string | null;        // engine-rolled 30%
  tensions: string[];
  openDirections: string[];
}

export interface ChainStoryState {
  currentSituation: string;
  knownToPlayer: string[];
  openThreads: string[];
  actorStates: Record<string, string>;
}

export interface Chain {
  id: string;
  kind: ChainKind;             // generation-time suggestion; finale disposition is free (§2)
  isPersonal: boolean;         // main chain: focal = the joining merc
  focalId: string;             // the focal card (limbo until delivered; personal: the merc)
  level: number;
  rarity: Rarity;
  region: string;
  expectedBeats: number;
  payoff: number;              // E[payoff] (§1)
  bank: number;                // accrued merc-day value (ECONOMY §5a)
  cyclesSpent: number;         // merc-cycles SPENT (climax gate — effort, not value)
  failureBudget: number;       // failures allowed before a forced last-chance finale
  failures: number;
  beatIndex: number;           // beats resolved so far
  bible: Bible;
  story: ChainStoryState;
  state: 'active' | 'finale-pending' | 'done' | 'slipped';
  createdCycle: number;
}

export const TWIST_CHANCE = 0.30;

export function rollChainShape(rng: Rng, rarity: Rarity): { beats: number; failureBudget: number } {
  const beats = rarity === 'rare' ? rng.range(4, 6) : rarity === 'uncommon' ? rng.range(3, 4) : rng.range(2, 3);
  // a single stumble must never force the finale (fun-check); harder sagas still allow fewer
  return { beats, failureBudget: Math.max(2, Math.ceil(beats / 2)) };
}

export function newChainEconomy(rng: Rng, level: number, rarity: Rarity): {
  beats: number; failureBudget: number; payoff: number; focalTarget: number; kind: ChainKind; twist: boolean;
} {
  const { beats, failureBudget } = rollChainShape(rng, rarity);
  const payoff = chainPayoff(beats, level, rarity);
  return {
    beats, failureBudget, payoff,
    focalTarget: chainFocalTarget(rng, payoff),
    kind: rollChainKind(rng),
    twist: rng.chance(TWIST_CHANCE),
  };
}

/** per-beat bank accrual: party × V_base(level) × rarity × outcomeScale, side-loot deducted (§5a) */
export function bankBeat(chain: Chain, partySize: number, outcome: Outcome, sideLootV: number): number {
  const scale = outcome === 'success' ? 1 : outcome === 'partial' ? 0.5 : 0;
  const earned = partySize * vBase(chain.level) * RARITY_MULT[chain.rarity] * scale - (scale > 0 ? sideLootV : 0);
  chain.bank += Math.max(0, earned);
  chain.cyclesSpent += partySize;      // effort counts even on failure (the gate can't stall)
  chain.beatIndex += 1;
  if (outcome === 'failure') chain.failures += 1;
  return earned;
}

/** the climax gate is on merc-cycles SPENT (§8 solidity rule c); failures force a last chance */
export function finaleReady(chain: Chain): boolean {
  const target = chain.expectedBeats * 1.5; // S̄ per beat
  return chain.cyclesSpent >= target || chain.failures >= chain.failureBudget;
}

/** small engine-set side-loot budget per middle beat (gold/stackables/relics, never units — §4) */
export function beatSideLoot(rng: Rng, chain: Chain): number {
  return Math.round(vBase(chain.level) * RARITY_MULT[chain.rarity] * rng.float(0.2, 0.5));
}

export type FinaleFate =
  | { fate: 'clean' }                                       // success: focal in the chosen kind
  | { fate: 'saddled'; debt: number }                       // partial: lesser/saddled version
  | { fate: 'slipped'; sequelRarity: Rarity };              // failure: §21-4a — bank forfeit, road back exists

/** finale resolution → the focal's fate (never death, never permanent — §21-4a) */
export function finaleFate(rng: Rng, chain: Chain, outcome: Outcome): FinaleFate {
  if (outcome === 'success') return { fate: 'clean' };
  if (outcome === 'partial') {
    // bank short of the focal's value → keep with debt sized to the shortfall
    const shortfall = Math.max(0, Math.round(chain.payoff * 0.25));
    return { fate: 'saddled', debt: shortfall };
  }
  return { fate: 'slipped', sequelRarity: chain.rarity === 'common' ? 'uncommon' : 'rare' };
}

/** finale surplus gold = bank − focal mark (crystallization; ≥0) */
export function crystallize(chain: Chain, focalMark: number): number {
  return Math.max(0, Math.round(chain.bank - focalMark));
}
