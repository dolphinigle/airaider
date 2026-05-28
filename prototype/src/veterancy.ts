// M6.1 — veterancy progression.
//
// Each scenario participation grants xp; thresholds promote a merc up the
// veterancy ladder. Promotion is one-shot per crossing; tier is the only
// derived state that mutates the merc's effective tag pool (the new tier
// becomes a temp tag in `Roster.tagOverrides`, but for the prototype we
// surface tier purely as a roster-side field so we don't have to migrate
// the LLM prompt assembly machinery yet).

import type { Roster, RosterMercState } from './roster.js';
import type { OutcomeBand } from './types.js';

export type VeterancyTier = 'rookie' | 'veteran' | 'grizzled';

export const XP_PER_BAND: Record<OutcomeBand, number> = {
  favorable: 2,
  'catastrophic-favorable': 3,
  unfavorable: 1,
  catastrophic: 1, // a brutal lesson is still a lesson
};

export const TIER_THRESHOLDS: Record<Exclude<VeterancyTier, 'rookie'>, number> = {
  veteran: 10,
  grizzled: 25,
};

export function tierFor(xp: number): VeterancyTier {
  if (xp >= TIER_THRESHOLDS.grizzled) return 'grizzled';
  if (xp >= TIER_THRESHOLDS.veteran) return 'veteran';
  return 'rookie';
}

export interface Promotion {
  mercId: string;
  fromTier: VeterancyTier;
  toTier: VeterancyTier;
  xpAfter: number;
}

/**
 * Grants xp to each merc id according to the band and returns any tier
 * crossings. Mutates the roster's per-merc state in place. Mercs absent
 * from the roster (e.g. just-died this scenario) are silently skipped.
 */
export function applyVeterancyXp(
  roster: Roster,
  mercIds: readonly string[],
  band: OutcomeBand,
): Promotion[] {
  const gain = XP_PER_BAND[band];
  const promotions: Promotion[] = [];
  for (const id of mercIds) {
    const state: RosterMercState | undefined = roster.states.get(id);
    if (!state) continue;
    const before = tierFor(state.xp);
    state.xp += gain;
    const after = tierFor(state.xp);
    if (after !== before) {
      state.tier = after;
      promotions.push({ mercId: id, fromTier: before, toTier: after, xpAfter: state.xp });
    } else {
      state.tier = after; // keep in sync even if unchanged
    }
  }
  return promotions;
}
