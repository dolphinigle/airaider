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
//   - smithy (M7.13)       : also reduces catastrophic casualty hpDamage
//                            by 1 (floor 0), on top of its flat coin bonus
//   - winter-larder (M7.13): in frost season, idle mercs recover 2 fatigue
//                            instead of 1 at end-of-day

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

/**
 * M7.13: smithy reduces casualty hp damage by 1 (floor 0). Better armour
 * means lighter wounds even on a catastrophic raid. Returns the amount of
 * hp damage the smithy absorbs (currently always 1 when present).
 */
export function smithyCasualtyReduction(effects: FortEffects | undefined): number {
  return effects?.upgradeIds.has('smithy') ? 1 : 0;
}

/**
 * M7.13: in frost season the winter-larder lets idle mercs recover an
 * extra fatigue point (2 total instead of 1). Returns the per-merc
 * recovery amount for the given season.
 */
export function fatigueRecoveryAmount(
  effects: FortEffects | undefined,
  season: Season | undefined,
): number {
  const winterLarder = !!effects?.upgradeIds.has('winter-larder');
  if (winterLarder && season === 'frost') return 2;
  return 1;
}

/**
 * M12.1: the granary discounts each merc's payday wage by 1g (floor 0)
 * when present. Returns the per-merc reduction applied at payday.
 */
export function granaryWageReduction(effects: FortEffects | undefined): number {
  return effects?.upgradeIds.has('granary') ? 1 : 0;
}
