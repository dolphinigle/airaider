// Character build & growth — §10. base = fixed-sum random vector (total ~15, flat L1
// floor); growth = fixed-sum budget (10/level) distributed by a natural lean reshaped
// by the player's FOCUS. Past growth is BANKED — re-focus only reshapes future levels.

import type { Rng } from './rng.js';
import type { AttrVector, Focus, CharacterData } from './cards.js';
import { ATTRIBUTES, type Attribute } from './tags.js';
import { BASE_PER_STAT, G0 } from './roll.js';

export const BASE_TOTAL = BASE_PER_STAT * 5;  // 15
export const GROWTH_BUDGET = 5;               // shares sum to 5 (avg 1.0/stat); ×g0 = 10 attr-points/level

// §10 focus shares: single → one GREAT (2.0) · dual → two GOOD (1.5) · none → natural lean
const SINGLE_SHARE = 2.0;
const DUAL_SHARE = 1.5;

export function toVector(vals: number[]): AttrVector {
  return { str: vals[0]!, dex: vals[1]!, int: vals[2]!, cha: vals[3]!, con: vals[4]! };
}

export function rollBase(rng: Rng): AttrVector {
  // fixed-sum with a floor of 1 per stat so no stat is born at ~0
  const spread = rng.fixedSumVector(5, BASE_TOTAL - 5).map(x => x + 1);
  return toVector(spread);
}

export function rollGrowthLean(rng: Rng): AttrVector {
  const lean = rng.fixedSumVector(5, GROWTH_BUDGET).map(x => Math.max(0.3, x));
  const sum = lean.reduce((a, b) => a + b, 0);
  return toVector(lean.map(x => (x / sum) * GROWTH_BUDGET));
}

/**
 * Effective growth shares = natural lean reshaped by focus (🛠 reshape algorithm):
 * focused stats pinned at their share; the rest renormalized proportionally to the lean.
 */
export function effectiveShares(lean: AttrVector, focus: Focus): AttrVector {
  const pinned = new Map<Attribute, number>();
  if (focus.kind === 'single') pinned.set(focus.attr, SINGLE_SHARE);
  if (focus.kind === 'dual') { pinned.set(focus.a, DUAL_SHARE); pinned.set(focus.b, DUAL_SHARE) }
  if (pinned.size === 0) return { ...lean };
  const rest = ATTRIBUTES.filter(a => !pinned.has(a));
  const restBudget = GROWTH_BUDGET - [...pinned.values()].reduce((a, b) => a + b, 0);
  const leanSum = rest.reduce((s, a) => s + lean[a], 0);
  const out = {} as AttrVector;
  for (const a of ATTRIBUTES) {
    out[a] = pinned.get(a) ?? (leanSum > 0 ? (lean[a] / leanSum) * restBudget : restBudget / rest.length);
  }
  return out;
}

/** apply one level of growth (BANKED into attrs — history sticks) */
export function applyLevelUp(ch: CharacterData): void {
  const shares = effectiveShares(ch.growthLean, ch.focus);
  for (const a of ATTRIBUTES) ch.attrs[a] += shares[a] * G0;
  ch.level += 1;
}

/** build a fresh character body at a level (attrs grown level-by-level under no focus) */
export function growToLevel(rng: Rng, level: number): { attrs: AttrVector; growthLean: AttrVector } {
  const attrs = rollBase(rng);
  const growthLean = rollGrowthLean(rng);
  for (let l = 1; l < level; l++) {
    for (const a of ATTRIBUTES) attrs[a] += growthLean[a] * G0;
  }
  return { attrs, growthLean };
}

// ---- XP (🟡 curve tuned at impl; target ~a few quests per level early) ------------------

export function xpNeeded(level: number): number {
  return Math.round(8 + 3 * level);
}

/** XP from a resolved quest: full at matched level, less when over-leveled */
export function questXp(unitLevel: number, questLevel: number, outcome: 'success' | 'partial' | 'failure'): number {
  const scale = outcome === 'success' ? 1 : outcome === 'partial' ? 0.6 : 0.3;
  const levelFit = Math.min(1.5, Math.max(0.25, questLevel / Math.max(1, unitLevel)));
  return Math.round(6 * scale * levelFit);
}

/** grant XP and level up toward the cap; returns levels gained */
export function grantXp(ch: CharacterData, xp: number, cap: number): number {
  ch.xp += xp;
  let gained = 0;
  while (ch.level < cap && ch.xp >= xpNeeded(ch.level)) {
    ch.xp -= xpNeeded(ch.level);
    applyLevelUp(ch);
    gained++;
  }
  if (ch.level >= cap) ch.xp = Math.min(ch.xp, xpNeeded(ch.level)); // cap-binding: xp pools but can't spill
  return gained;
}
