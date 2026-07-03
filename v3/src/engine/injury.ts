// Injury — §11 (scope: §16-F5 AI-judged on ANY outcome, decoupled; §19 NO death in
// prototype). ONE generic injury in TIERS; flat coin penalty (0.2U/tier) lives in roll.ts.

import type { Rng } from './rng.js';
import type { CharacterData } from './cards.js';

export type InjuryBand = 'none' | 'low' | 'med' | 'high';

const BAND_TIERS: Record<Exclude<InjuryBand, 'none'>, [number, number]> =
  { low: [1, 2], med: [3, 5], high: [6, 9] };

/** engine maps the AI's severity band → tiers (rolls within the band) */
export function rollInjuryTiers(rng: Rng, band: InjuryBand): number {
  if (band === 'none') return 0;
  const [lo, hi] = BAND_TIERS[band];
  return rng.range(lo, hi);
}

/** stacking = new injuries ADD tiers to one running total (no death in prototype —
 *  a maxed unit is just long-term out) */
export function applyInjury(ch: CharacterData, tiers: number): void {
  ch.injuryTiers += tiers;
}

// Healing: rest = 1 tier / 2 cycles · infirmary comfort speeds it up (benefitCurve 🛠) ·
// Hospital (once built) unlocks pay-gold instant heal.
// We track healing with fractional progress folded into tiers via a per-cycle pass.

export interface HealContext {
  /** tiers healed per cycle for a resting unit (0.5 base; infirmary raises it) */
  tiersPerCycle: number;
}

export const REST_HEAL_PER_CYCLE = 0.5;

/** infirmary comfort → heal speed (🛠 benefitCurve): 0 comfort = base 0.5, saturates ~2/cycle */
export function infirmaryHealRate(comfort: number): number {
  return REST_HEAL_PER_CYCLE + 1.5 * (1 - Math.exp(-comfort / 25));
}

/** one cycle of healing; carries fractional progress in `healProgress` side-state */
export function healTick(ch: CharacterData & { healProgress?: number }, rate: number): void {
  if (ch.injuryTiers <= 0) { ch.healProgress = 0; return }
  const prog = (ch.healProgress ?? 0) + rate;
  const whole = Math.floor(prog);
  ch.injuryTiers = Math.max(0, ch.injuryTiers - whole);
  ch.healProgress = ch.injuryTiers > 0 ? prog - whole : 0;
}

/** Hospital pay-gold instant heal price ≈ tiers × V_base(level) (§11 monetary value) */
export function payHealCost(tiers: number, vBaseAtLevel: number): number {
  return Math.round(tiers * vBaseAtLevel);
}
