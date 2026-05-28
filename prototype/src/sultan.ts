import type { CoinRoll, BandResult, CoinFace } from './types.js';
import type { Rng } from './rng.js';

export const MAX_COINS = 7;
export const MIN_COINS = 1;

export function flipCoins(n: number, rng: Rng): CoinRoll {
  const N = Math.max(MIN_COINS, Math.min(MAX_COINS, n));
  const faces: CoinFace[] = [];
  for (let i = 0; i < N; i++) {
    faces.push(rng() < 0.5 ? 'tails' : 'heads');
  }
  let heads = 0;
  for (const f of faces) if (f === 'heads') heads++;
  return { faces, heads, tails: N - heads };
}

/**
 * 4 hidden bands by ratio of heads. Bands are HIDDEN pre-flip per CANONICAL §2.1.
 *
 * Prototype mapping (placeholder — CANONICAL §7 #13 is OPEN):
 *  - All-heads with N≥3 → catastrophic-favorable (god-combo crit)
 *  - All-tails with N≥3 → catastrophic (disaster crit)
 *  - heads/N ≥ 0.66 → favorable
 *  - heads/N < 0.34 → unfavorable
 *  - middle band (~50/50) → unfavorable (pessimistic default — "not enough")
 *
 * This pessimistic middle makes the player feel STAKES; favorable requires real merc fit.
 */
export function classifyBand(roll: CoinRoll): BandResult {
  const { heads, tails, faces } = roll;
  const n = faces.length;
  if (n >= 3 && heads === n) {
    return { band: 'catastrophic-favorable', reason: `all ${n} heads (god-combo crit)` };
  }
  if (n >= 3 && tails === n) {
    return { band: 'catastrophic', reason: `all ${n} tails (catastrophe crit)` };
  }
  const ratio = heads / n;
  if (ratio >= 0.66) {
    return { band: 'favorable', reason: `${heads}/${n} heads (favorable)` };
  }
  if (ratio < 0.34) {
    return { band: 'unfavorable', reason: `${heads}/${n} heads (unfavorable)` };
  }
  return { band: 'unfavorable', reason: `${heads}/${n} heads (split — pessimistic default)` };
}

export function resolveCoins(n: number, rng: Rng): { roll: CoinRoll; band: BandResult } {
  const roll = flipCoins(n, rng);
  return { roll, band: classifyBand(roll) };
}
