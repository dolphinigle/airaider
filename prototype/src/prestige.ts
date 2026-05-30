// PROTO-GAME v14: fort prestige meter.
//
// Prestige captures "how feared/famous is this fort?" and feeds back into
// the spine: a high-prestige fort attracts richer leads (rare/legendary tilt)
// and better recruits. The rising number itself is dopamine — the player can
// see the heads-on-pikes pay off in lead-board quality.
//
// Formula (intentionally simple and legible):
//   prestige = displayedCount
//            + 2 * legendaryLeadsCompleted
//            + (fortLevel - 1)
//            + sum(room.prestigeBonus for room in placedRooms)
//
// Tiers map to lead-rarity weight adjustments. Each tier shifts a few
// percentage points away from common toward rare/legendary, so the player
// can FEEL the board getting better.

export type PrestigeTier = 'unknown' | 'whispered' | 'feared' | 'storied' | 'legendary';

export interface PrestigeInputs {
  displayedCount: number;
  legendaryLeadsCompleted: number;
  fortLevel: number;
  /** Sum of prestigeBonus across all placed rooms. Default 0 for back-compat. */
  roomPrestige?: number;
}

export function computePrestige(i: PrestigeInputs): number {
  return Math.max(
    0,
    i.displayedCount
      + 2 * i.legendaryLeadsCompleted
      + Math.max(0, i.fortLevel - 1)
      + (i.roomPrestige ?? 0),
  );
}

export function prestigeTier(score: number): PrestigeTier {
  if (score >= 12) return 'legendary';
  if (score >= 7) return 'storied';
  if (score >= 4) return 'feared';
  if (score >= 2) return 'whispered';
  return 'unknown';
}

export interface RarityWeights {
  common: number;
  uncommon: number;
  rare: number;
  legendary: number;
}

/**
 * Tilt the base rarity weights based on prestige tier. Higher tier = more
 * weight on rare/legendary at the expense of common. Always returns a
 * fresh object so callers don't mutate shared catalogs.
 */
export function tiltRarityWeights(base: RarityWeights, tier: PrestigeTier): RarityWeights {
  const w: RarityWeights = { ...base };
  switch (tier) {
    case 'unknown':
      return w;
    case 'whispered':
      // -2 common, +1 uncommon, +1 rare
      w.common = Math.max(0, w.common - 2);
      w.uncommon += 1;
      w.rare += 1;
      return w;
    case 'feared':
      // -5 common, +2 uncommon, +2 rare, +1 legendary
      w.common = Math.max(0, w.common - 5);
      w.uncommon += 2;
      w.rare += 2;
      w.legendary += 1;
      return w;
    case 'storied':
      // -10 common, +3 uncommon, +4 rare, +3 legendary
      w.common = Math.max(0, w.common - 10);
      w.uncommon += 3;
      w.rare += 4;
      w.legendary += 3;
      return w;
    case 'legendary':
      // -15 common, +3 uncommon, +6 rare, +6 legendary
      w.common = Math.max(0, w.common - 15);
      w.uncommon += 3;
      w.rare += 6;
      w.legendary += 6;
      return w;
  }
}

export function prestigeTierLabel(tier: PrestigeTier): string {
  switch (tier) {
    case 'unknown': return 'unknown';
    case 'whispered': return 'whispered';
    case 'feared': return 'feared';
    case 'storied': return 'storied';
    case 'legendary': return 'LEGENDARY';
  }
}
