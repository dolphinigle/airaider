// M8.1: faction reputation tiers and their mechanical effects.
//
// Reputation is an integer per faction (M5.5). Tiers map the raw integer
// onto a label and a small, predictable in-engine effect:
//
//   ally     (≥ +5)  → +1 ally-coin bonus per scenario whose factionContext
//                      includes that faction (the faction sends scouts,
//                      tip-offs, a friendly contact)
//   friendly (≥ +3)  → narrative-only label (no coin effect; surfaces in
//                      `npm run roster show` and the LLM request)
//   neutral  ( −2..+2)
//   hostile  (≤ −3)  → narrative-only label (no coin penalty for now)
//   enemy    (≤ −5)  → narrative-only label; future hook for daily-events
//                      table to roll punitive events

export type ReputationTier = 'ally' | 'friendly' | 'neutral' | 'hostile' | 'enemy';

export const REPUTATION_THRESHOLDS = {
  ally: 5,
  friendly: 3,
  hostile: -3,
  enemy: -5,
} as const;

export function reputationTier(standing: number): ReputationTier {
  if (standing >= REPUTATION_THRESHOLDS.ally) return 'ally';
  if (standing >= REPUTATION_THRESHOLDS.friendly) return 'friendly';
  if (standing <= REPUTATION_THRESHOLDS.enemy) return 'enemy';
  if (standing <= REPUTATION_THRESHOLDS.hostile) return 'hostile';
  return 'neutral';
}

/**
 * Per-scenario coin bonus from faction reputation: +1 for each distinct
 * factionContext entry whose current standing is at ally tier. Returns 0
 * when no factions or no allies among them. The bonus is uncapped here;
 * the main coin clamp in resolver still enforces budget/MAX_COINS.
 */
export function allyCoinBonus(
  factionContext: Array<{ factionId: string }> | undefined,
  reputationOf: ((factionId: string) => number) | undefined,
): number {
  if (!factionContext || factionContext.length === 0 || !reputationOf) return 0;
  let bonus = 0;
  for (const f of factionContext) {
    if (reputationTier(reputationOf(f.factionId)) === 'ally') bonus += 1;
  }
  return bonus;
}
