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

/** the WHY behind a coin count — every UI's answer to "why N coins?" */
export interface CoinsBreakdown {
  attr: number;        // Σ tested attribute values
  match: number;       // +0.5U if ≥1 favored owned (tier-blind)
  bodyBg: number;      // attribute-tags (body ± / background rank-scaled)
  clash: number;       // −0.5U if ≥1 clashing (negative or 0)
  injury: number;      // −0.2U × tiers (negative or 0)
  total: number;       // floored at 0, rounded — the coin count
  /** the unit's concepts that earned the match bonus (favored concept or group owned) */
  matchedFavored: string[];
  /** the unit's concepts that triggered the clash (a clashing concept, or a favored one's opposite) */
  matchedClashing: string[];
  /** body tags that pushed a tested attribute up / down (statAttr tags) */
  bodyPlus: string[];
  bodyMinus: string[];
}

export function coinsBreakdown(unit: Card, t: SlotTest): CoinsBreakdown {
  const ch = unit.character;
  if (!ch) return { attr: 0, match: 0, bodyBg: 0, clash: 0, injury: 0, total: 0, matchedFavored: [], matchedClashing: [], bodyPlus: [], bodyMinus: [] };
  const u = U(ch.level);
  let attr = 0, bodyBg = 0;
  for (const a of t.attributes) {
    attr += attrOf(unit, a);
    bodyBg += attrTagFrac(unit.tags, a) * u;
  }
  const match = hasFavored(unit.tags, t.favored) ? TAG_FRAC * u : 0;
  const clash = hasClash(unit.tags, t.favored, t.clashing) ? -TAG_FRAC * u : 0;
  const injury = -ch.injuryTiers * INJURY_FRAC * u;
  const total = Math.max(0, Math.round(attr + bodyBg + match + clash + injury));
  // the NAMES behind the terms — the same predicates as hasFavored/hasClash, so a "why" can never
  // name a tag the dice did not count
  const matchedFavored = unit.tags.filter(tg => t.favored.some(f => tg.concept === f || CONCEPT[tg.concept]?.group === f)).map(tg => tg.concept);
  const opposites = t.favored.map(f => CONCEPT[f]?.opposite).filter(Boolean) as string[];
  const matchedClashing = unit.tags.filter(tg => t.clashing.includes(tg.concept) || opposites.includes(tg.concept)).map(tg => tg.concept);
  const bodyPlus: string[] = [], bodyMinus: string[] = [];
  for (const tg of unit.tags) {
    const c = CONCEPT[tg.concept];
    if (!c?.statAttr || !t.attributes.includes(c.statAttr)) continue;
    (c.negative ? bodyMinus : bodyPlus).push(tg.concept);
  }
  return { attr, match, bodyBg, clash, injury, total, matchedFavored, matchedClashing, bodyPlus, bodyMinus };
}

/** the coin reasons as the UIs print them: `+roguery`, `−playful`, and the wound's cost in coins
 *  (positive; 0 when unhurt). One source, so the hand, the quest page and the CLI agree. */
export interface CoinsWhy { plus: string[]; minus: string[]; wound: number }
export function coinsWhy(unit: Card, t: SlotTest): CoinsWhy {
  const b = coinsBreakdown(unit, t);
  return {
    plus: [...new Set([...b.matchedFavored, ...b.bodyPlus])],
    minus: [...new Set([...b.matchedClashing, ...b.bodyMinus])],
    wound: Math.round(-b.injury * 10) / 10,
  };
}

/** compact human string: "DEX 4 +match 3.5 −injury 1.4 = 8" */
export function explainCoins(unit: Card, t: SlotTest): string {
  const b = coinsBreakdown(unit, t);
  const parts = [`${t.attributes.map(a => a.toUpperCase()).join('+')} ${b.attr.toFixed(1)}`];
  if (b.match) parts.push(`+match ${b.match.toFixed(1)}`);
  if (b.bodyBg) parts.push(`${b.bodyBg > 0 ? '+' : ''}body/bg ${b.bodyBg.toFixed(1)}`);
  if (b.clash) parts.push(`clash ${b.clash.toFixed(1)}`);
  if (b.injury) parts.push(`injury ${b.injury.toFixed(1)}`);
  return `${parts.join(' ')} = ${b.total}`;
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

// ---- verdict words (R2, designer-ruled 2026-09-30) -------------------------------------------
// The POOLED quest gets a 5-word band from the exact binomial; a single place gets only a
// strength colour, because a per-slot band would contradict the pooled roll (a slot can be a
// "long shot" on its own while the party it sits in is "likely"). The engine owns both words.

export type Band = 'likely' | 'even' | 'partial' | 'long' | 'hopeless';
/** the band as the text UI and engine messages say it (web/band.ts mirrors these words) */
export const BAND_TEXT: Record<Band, string> = {
  likely: 'likely', even: 'coin-flip', partial: 'a partial at best', long: 'long shot', hopeless: 'hopeless',
};
/** 🛠 band cut points on the pooled odds */
export const BAND_LIKELY = 0.65;     // P(success) ≥ → likely
export const BAND_EVEN = 0.35;       // P(success) ≥ → coin-flip
export const BAND_PARTIAL = 0.5;     // P(partial or better) ≥ → a partial at best
export const BAND_LONG = 0.05;       // P(partial or better) ≥ → long shot; below → hopeless

export function oddsBand(totalCoins: number, totalBar: number): Band {
  const o = odds(totalCoins, totalBar);
  if (o.success >= BAND_LIKELY) return 'likely';
  if (o.success >= BAND_EVEN) return 'even';
  if (o.partialOrBetter >= BAND_PARTIAL) return 'partial';
  if (o.partialOrBetter >= BAND_LONG) return 'long';
  return 'hopeless';
}

export type Strength = 'strong' | 'fair' | 'weak';
/** 🛠 strength cut points: expected heads (coins/2) against this place's own bar. Scale-free, so
 *  three "strong" places always pool into a party whose expected heads clear the pooled bar. */
export const STRENGTH_STRONG = 1.1;
export const STRENGTH_FAIR = 0.8;

export function slotStrength(coinCount: number, bar: number): Strength {
  if (bar <= 0) return 'strong';
  const r = coinCount / 2 / bar;
  return r >= STRENGTH_STRONG ? 'strong' : r >= STRENGTH_FAIR ? 'fair' : 'weak';
}
