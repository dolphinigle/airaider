// M7.1: fort upgrade mechanical effects.
//
// Upgrades persist on the roster but were purely cosmetic in M6.4. Here we
// project them into a small `FortEffects` aggregator that the resolver
// consults at scenario time.
//
// Effect catalog (intentionally small and testable):
//   - winter-larder        : clamps any negative seasonModifier to 0
//                            (the fort's stores keep the cold from biting)
//   - reinforced-palisade  : zeros out catastrophic-band casualty damage
//                            (the wall absorbs the worst of it)
//   - smithy               : +1 flat coin on every scenario the fort runs
//                            (better kit, sharper blades)
//   - watch-tower          : +1 coin per scenario slot whose id contains
//                            'sentry', 'scout', or 'watch' (sightlines)
//   - chapel               : M7.12 — heals 1 hpDamage at end-of-day for
//                            every idle (non-deployed, non-on-errand) merc
//                            with hpDamage > 0

import type { Season } from './season.js';

export interface FortEffects {
  /** Set of fort upgrade ids active on this run. */
  upgradeIds: Set<string>;
}

export function fortEffectsFor(upgradeIds: Iterable<string> | undefined): FortEffects {
  return { upgradeIds: new Set(upgradeIds ?? []) };
}

/** True if winter-larder cancels negative seasonModifiers. */
export function negativeSeasonClamped(effects: FortEffects | undefined, _season: Season | undefined): boolean {
  return !!effects?.upgradeIds.has('winter-larder');
}

/** Returns the fort's flat coin bonus regardless of slots (currently smithy). */
export function flatCoinBonus(effects: FortEffects | undefined): number {
  if (!effects) return 0;
  return effects.upgradeIds.has('smithy') ? 1 : 0;
}

/** Returns the watch-tower per-slot bonus given a slot id list. */
export function slotCoinBonus(effects: FortEffects | undefined, slotIds: string[]): number {
  if (!effects?.upgradeIds.has('watch-tower')) return 0;
  let bonus = 0;
  for (const id of slotIds) {
    const lc = id.toLowerCase();
    if (lc.includes('sentry') || lc.includes('scout') || lc.includes('watch')) bonus += 1;
  }
  return bonus;
}

/** True if reinforced-palisade reduces catastrophic damage to zero. */
export function palisadeBlocksCasualty(effects: FortEffects | undefined): boolean {
  return !!effects?.upgradeIds.has('reinforced-palisade');
}

/**
 * M7.12: True if the wayside chapel grants end-of-day wound healing for
 * idle (non-deployed, non-on-errand) mercs. One hp damage is healed per
 * qualifying merc per day.
 */
export function chapelHealsWounds(effects: FortEffects | undefined): boolean {
  return !!effects?.upgradeIds.has('chapel');
}
