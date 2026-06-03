// Reward generation — value → split → cards (the bundle, fixed at quest birth).
// Bridges economy (numbers) to cards (objects). Character cards come back UNFLESHED
// (name 'Unknown'); the AI names them at delivery. Shortfall tops up as gold so the
// bundle nets ~V (a single card can't hold arbitrary value — ECONOMY).

import type { Rng } from './rng.js';
import type { Archetype, RewardBundle, RewardKind, Card } from './types.js';
import { splitValue, generateCharacter, BALANCE } from './economy.js';
import { characterFromGen, goldCard, liabilityCard, type MkId } from './cards.js';

export interface RewardSpec {
  V: number; archetype: Archetype; isChain: boolean; level: number;
  requiredTags?: string[];   // AI-chosen concept tags for a focal/known character
}

const KIND_ROLE: Partial<Record<RewardKind, 'merc' | 'captive'>> = { recruit: 'merc', captive: 'captive' };

export function generateReward(r: Rng, mkId: MkId, cycle: number, spec: RewardSpec): RewardBundle {
  const parts = splitValue(r, spec.V, spec.archetype, spec.isChain);
  const cards: Card[] = [];
  let primaryKind: RewardKind = 'gold';

  for (const part of parts) {
    if (part.value <= 0) continue;
    if (part.kind === 'gold' || part.kind === 'lead' || part.kind === 'item' || part.kind === 'tag-stamp') {
      // prototype: non-character kinds pay out as gold (leads/items/stamps are future work)
      cards.push(goldCard(mkId, part.value, cycle));
      if (part.kind !== 'gold') primaryKind = primaryKind === 'gold' ? part.kind : primaryKind;
    } else {
      const role = KIND_ROLE[part.kind] ?? 'captive';
      const gen = generateCharacter(r, { targetValue: part.value, level: spec.level, required: spec.requiredTags });
      cards.push(characterFromGen(mkId, gen, role, cycle));
      primaryKind = part.kind;
      // top up the shortfall (tag-capacity) with gold so the bundle nets ~V
      const shortfall = part.value - gen.value;
      if (shortfall > BALANCE.vBase(1) * 0.25) cards.push(goldCard(mkId, Math.round(shortfall), cycle));
      // jackpot-with-catch: a negative card
      if (gen.jackpotNegative) cards.push(liabilityCard(mkId, gen.jackpotNegative.kind, gen.jackpotNegative.value, cycle));
    }
  }
  if (!cards.length) cards.push(goldCard(mkId, spec.V, cycle));

  return { targetValue: spec.V, cards, kindHint: primaryKind };
}

/** Net value of a bundle (for display / partial halving). */
export function bundleValue(b: RewardBundle): number {
  return b.cards.reduce((s, c) => s + c.value, 0);
}

/** A one-line player-facing "envelope" describing the reward kind without spoiling specifics. */
export function rewardEnvelope(b: RewardBundle): string {
  const hasChar = b.cards.some((c) => c.class === 'character');
  const gold = b.cards.filter((c) => c.class === 'gold').reduce((s, c) => s + c.value, 0);
  const liab = b.cards.some((c) => c.class === 'liability');
  const parts: string[] = [];
  if (hasChar) parts.push(b.kindHint === 'captive' ? 'a captive' : 'a recruit');
  if (gold > 0) parts.push(`~${gold} gold`);
  if (liab) parts.push('a complication');
  return parts.join(' + ') || 'coin';
}
