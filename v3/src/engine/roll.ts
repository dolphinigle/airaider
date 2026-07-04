// THE ROLL — GENERATION_FLOW §10, LOCKED (verified L3–L50). Engine owns every number.
// coins = ATTRIBUTE + MATCHING-TAG (0.5U, tier-blind flat, §16-F2) + ATTRIBUTE-TAG
//         (body ≈ bulk + background tiny rank-scaled) − clash (0.5U mirror) − injury (0.2U/tier)
// threshold = E × U(questLevel) / 2 · multi-stat ×(n+1)/2 · POOLED Σcoins vs Σbars ·
// partial ≥ 0.6× · value full/half/zero.

import { type Card, attrOf } from './cards.js';
import { CONCEPT, BACKGROUND_ATTRS, type Attribute, type TagInstance } from './tags.js';
import { hasFavored, hasClash } from './overlap.js';
import type { Rng } from './rng.js';

// §10 locked numbers
export const BASE_PER_STAT = 3;      // base ≈ 3/stat (fixed-sum random, total ~15)
export const G0 = 2;                 // growth budget ~10/lvl, standard 2/stat
export const TAG_FRAC = 0.5;         // matching-tag & attribute-tag = 0.5·U each
export const BODY_FRAC = 0.4;        // body = the bulk of the attribute-tag 0.5U
export const BG_FRAC = 0.1;          // background = tiny, rank-scaled
export const INJURY_FRAC = 0.2;      // §11: flat penalty = tiers × 0.2·U
export const PARTIAL_FRAC = 0.6;

export type DifficultyName = 'trivial' | 'standard' | 'hard' | 'brutal' | 'extreme';
export const DIFFICULTY_ORDER: readonly DifficultyName[] = ['trivial', 'standard', 'hard', 'brutal', 'extreme'];
export const DIFFICULTY_E: Record<DifficultyName, number> =
  { trivial: 0.25, standard: 0.5, hard: 1.0, brutal: 1.5, extreme: 2.0 };

/** U(L) = a great build's coins = base + 2·g0·(L−1) */
export function U(level: number): number {
  return BASE_PER_STAT + 2 * G0 * (level - 1);
}

export interface SlotTest {
  attributes: Attribute[];     // 1..n tested attributes (multi-stat pools ONE unit)
  favored: string[];           // favored skill concepts (matching-tag)
  clashing: string[];          // clashing concepts
  difficulty: DifficultyName;  // engine-rolled
  level: number;               // the quest's content level (threshold side)
}

/** the slot's bar in heads: E × U(L)/2, multi-stat ×(n+1)/2 */
export function slotThreshold(t: SlotTest): number {
  const n = t.attributes.length;
  return DIFFICULTY_E[t.difficulty] * U(t.level) / 2 * ((n + 1) / 2);
}

/** attribute-tag contribution for ONE tested attribute (body + background, in U-units) */
function attrTagFrac(tags: TagInstance[], attr: Attribute): number {
  let f = 0;
  for (const t of tags) {
    const c = CONCEPT[t.concept];
    if (c?.statAttr === attr) f += c.negative ? -BODY_FRAC : BODY_FRAC;
    const bgAttrs = BACKGROUND_ATTRS[t.concept];
    if (bgAttrs?.includes(attr)) f += BG_FRAC * ((t.tier ?? 1) / (c?.depth ?? 20));
  }
  return f;
}

/** a unit's coin count against a slot (floored at 0) */
export function coins(unit: Card, t: SlotTest): number {
  const ch = unit.character;
  if (!ch) return 0;
  const u = U(ch.level);
  let c = 0;
  for (const a of t.attributes) c += attrOf(unit, a) + attrTagFrac(unit.tags, a) * u;
  if (hasFavored(unit.tags, t.favored)) c += TAG_FRAC * u;      // flat, no stacking, tier-blind
  if (hasClash(unit.tags, t.favored, t.clashing)) c -= TAG_FRAC * u;
  c -= ch.injuryTiers * INJURY_FRAC * u;
  return Math.max(0, Math.round(c));
}

export type Outcome = 'success' | 'partial' | 'failure';

export interface QuestRollResult {
  totalCoins: number;
  totalBar: number;
  heads: number;
  outcome: Outcome;
}

/** POOLED party resolution: flip Σcoins vs Σthresholds (§10/QUESTS §2) */
export function resolvePooled(rng: Rng, filled: { unit: Card; test: SlotTest }[]): QuestRollResult {
  const totalCoins = filled.reduce((s, f) => s + coins(f.unit, f.test), 0);
  const totalBar = filled.reduce((s, f) => s + slotThreshold(f.test), 0);
  const heads = rng.flipCoins(totalCoins);
  const outcome: Outcome =
    heads >= totalBar ? 'success' : heads >= PARTIAL_FRAC * totalBar ? 'partial' : 'failure';
  return { totalCoins, totalBar, heads, outcome };
}

// ---- odds (always shown raw before commit; the Oracle adds the % — QUESTS §3) ---------

/** P(heads ≥ bar) and P(heads ≥ 0.6·bar) for n fair coins (exact DP; n is small enough) */
export function odds(totalCoins: number, totalBar: number): { success: number; partialOrBetter: number } {
  const n = totalCoins;
  if (n <= 0) return { success: totalBar <= 0 ? 1 : 0, partialOrBetter: PARTIAL_FRAC * totalBar <= 0 ? 1 : 0 };
  // binomial tail via iterative pmf (n ≤ ~1000 in practice)
  const pmf = new Array<number>(n + 1);
  // C(n,k)·0.5^n computed in log space to stay stable
  let logC = -n * Math.LN2; // log( C(n,0) · 0.5^n )
  pmf[0] = Math.exp(logC);
  for (let k = 1; k <= n; k++) {
    logC += Math.log((n - k + 1) / k);
    pmf[k] = Math.exp(logC);
  }
  const tail = (bar: number) => {
    if (bar <= 0) return 1;
    const kMin = Math.ceil(bar - 1e-9);
    let s = 0;
    for (let k = kMin; k <= n; k++) s += pmf[k]!;
    return Math.min(1, s);
  };
  return { success: tail(totalBar), partialOrBetter: tail(PARTIAL_FRAC * totalBar) };
}
