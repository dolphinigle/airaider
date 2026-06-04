// The value economy + the roll (docs/ECONOMY.md, CARDS.md §The roll).
// Engine owns every number here; the AI never sets value. Numbers live in BALANCE
// (fun before balance — tuned by simulation in _selftest.ts), structure is locked.

import { allTags, tagDef, type Rarity, type TagDef } from './tags.js';
import { randInt, weightedPick, flipCoins, type Rng } from './rng.js';
import {
  ATTRIBUTES, type Attribute, type Attributes, type Talents,
  type TagInstance, type CharacterCard, type Archetype, type RewardKind,
} from './types.js';

// ---- the one place numbers live ---------------------------------------------
export const BALANCE = {
  rarityBase: { common: 1, uncommon: 3, rare: 8, legendary: 20 } as Record<Rarity, number>,
  rarityMult: { common: 1, uncommon: 1.6, rare: 2.6, legendary: 4 } as Record<Rarity, number>,
  flatTagMult: 2,            // flat tags priced at rarityBase × this
  // V_base(level): value per merc per cycle — the anchor. Rises with level.
  vBase: (level: number) => Math.round(30 * Math.pow(1.35, level - 1)),
  // per-tag value ceiling a quest of `level` can roll (PoE ilvl gate)
  tagCeiling: (level: number) => 8 + level * 8,
  // attributes
  attrBaseRange: [2, 5] as [number, number],
  talentRange: [0.4, 1.8] as [number, number],
  attrPerLevel: (base: number, talent: number, level: number) => base + Math.round(talent * (level - 1)),
  // the roll
  favoredBonus: (tier: number) => 4 - Math.floor((tier - 1) / 2),   // T1→4 T3→3 T5→3.. tuned below
  clashPenalty: (tier: number) => 3 - Math.floor((tier - 1) / 2),
  injuryPenalty: (tier: number) => 2 + (5 - tier),
  // heads needed per slot: tracks a level-matched merc's expected heads (~(6+L)/2),
  // set a touch below so modest fit clears and an unfit party still reaches partial.
  thresholdPerMerc: (level: number) => 3 + level * 0.5,
  // generation: tag-count scales with budget (a legendary hero has more traits).
  // +2 for the identity (gender/race) slots that carry ~no value.
  maxTagsPerCard: 16,
  tagCapFor: (targetValue: number, ceiling: number) =>
    Math.min(16, Math.max(5, 2 + Math.ceil(targetValue / (ceiling * 0.45)))),
  maxSkills: 3,   // a believable character has a few skills, not all of them
  maxMagic: 1,    // …and at most one school of magic
  // the most value a single believable character can hold in tags (empirically matched to what
  // the grounded caps actually allow); value beyond this flows to the bundle as gold/treasure
  maxCharValue: (level: number) => 45 + level * 11,
  jackpotChance: 0.08,
};

// ---- tag pricing ------------------------------------------------------------
export function tagValue(def: TagDef, tier: number): number {
  const base = BALANCE.rarityBase[def.rarity];
  return def.tiered ? base * (6 - tier) : base * BALANCE.flatTagMult;
}
export function tagInstanceValue(t: TagInstance): number {
  const d = tagDef(t.id);
  return d ? tagValue(d, t.tier) : 0;
}
export function cardTagsValue(tags: TagInstance[]): number {
  return tags.reduce((s, t) => s + tagInstanceValue(t), 0);
}

// ---- attribute bias from tags (flavor; keeps strong-looking mercs strong) ---
const ATTR_BIAS: Record<string, Attribute> = {
  'phys:muscular': 'physical', 'skill:weapon': 'physical', 'bg:soldier': 'physical',
  'skill:stealth': 'agility', 'bg:hunter': 'agility', 'bg:criminal': 'agility',
  'phys:clever': 'intelligence', 'skill:lore': 'intelligence', 'bg:scholar': 'intelligence',
  'skill:magic-fire': 'intelligence', 'skill:magic-earth': 'intelligence',
  'skill:magic-water': 'intelligence', 'skill:magic-air': 'intelligence', 'skill:magic-dark': 'intelligence',
  'phys:beautiful': 'charisma', 'bg:noble': 'charisma', 'skill:song': 'charisma', 'bg:merchant': 'charisma',
  'phys:tough': 'willpower', 'bg:priest': 'willpower', 'pers:brave': 'willpower',
};

// ---- talents & attributes ---------------------------------------------------
export function rollTalents(r: Rng): Talents {
  const [lo, hi] = BALANCE.talentRange;
  const t = {} as Talents;
  for (const a of ATTRIBUTES) t[a] = +(lo + r() * (hi - lo)).toFixed(2);
  // guarantee one standout
  const star = ATTRIBUTES[randInt(r, 0, ATTRIBUTES.length - 1)];
  t[star] = +(Math.max(t[star], 1.4 + r() * (hi - 1.4))).toFixed(2);
  return t;
}
export function rollBaseAttrs(r: Rng, tags: TagInstance[]): Attributes {
  const [lo, hi] = BALANCE.attrBaseRange;
  const a = {} as Attributes;
  for (const at of ATTRIBUTES) a[at] = randInt(r, lo, hi);
  for (const t of tags) { const bias = ATTR_BIAS[t.id]; if (bias) a[bias] += 1; }
  return a;
}
/** Effective attributes at a character's current level. */
export function attrsAtLevel(base: Attributes, talents: Talents, level: number): Attributes {
  const out = {} as Attributes;
  for (const at of ATTRIBUTES) out[at] = BALANCE.attrPerLevel(base[at], talents[at], level);
  return out;
}

// ---- generateCard: spend a value budget on tags -----------------------------
export interface GenSpec {
  targetValue: number;
  level: number;            // source quest level → ceiling + character level
  required?: string[];      // canonical tag ids that must be included
  role?: 'merc' | 'captive' | 'npc';
}

export interface GeneratedCharacter {
  tags: TagInstance[];
  attrs: Attributes;
  base: Attributes;
  talents: Talents;
  level: number;
  value: number;
  jackpotNegative?: { kind: 'evidence' | 'mess' | 'debt'; value: number };
}

export function generateCharacter(r: Rng, spec: GenSpec): GeneratedCharacter {
  const ceiling = BALANCE.tagCeiling(spec.level);
  // a single character holds at most maxCharValue in tags; the caller tops up the rest as gold
  const effTarget = Math.min(spec.targetValue, BALANCE.maxCharValue(spec.level));
  const cap = BALANCE.tagCapFor(effTarget, ceiling);
  const tags: TagInstance[] = [];
  const usedMutex = new Set<string>();
  let remaining = effTarget;

  const place = (def: TagDef, tier: number) => {
    if (def.mutex) { if (usedMutex.has(def.mutex)) return false; usedMutex.add(def.mutex); }
    if (tags.some((t) => t.id === def.id)) return false;
    tags.push({ id: def.id, tier });
    remaining -= tagValue(def, tier);
    return true;
  };

  // 1. AI-required tags first (mid tier)
  for (const id of spec.required ?? []) {
    const def = tagDef(id);
    if (def) place(def, def.tiered ? affordableTier(def, remaining, ceiling, r) : 3);
  }
  // always give a gender + race if not present (identity floor, cheap)
  ensureIdentity(r, tags, usedMutex);

  // 2. spend the rest — aim each tag near remaining/slotsLeft so the budget lands
  const pool = allTags().filter((d) => d.group !== 'gender' && d.group !== 'race');
  let guard = 0;
  const cheapest = (d: TagDef) => (d.tiered ? tagValue(d, 5) : tagValue(d, 3));
  while (remaining > 1 && tags.length < cap && guard++ < 200) {
    const slotsLeft = cap - tags.length;
    const aim = Math.min(remaining / slotsLeft, ceiling);
    const skillCount = tags.filter((t) => tagDef(t.id)?.group === 'skill').length;
    const magicCount = tags.filter((t) => t.id.startsWith('skill:magic')).length;
    const candidates = pool.filter((d) => (!d.mutex || !usedMutex.has(d.mutex))
      && !tags.some((t) => t.id === d.id) && cheapest(d) <= remaining
      && !(d.group === 'skill' && skillCount >= BALANCE.maxSkills)   // grounded: cap skills
      && !(d.id.startsWith('skill:magic') && magicCount >= BALANCE.maxMagic));
    if (!candidates.length) break;
    // restrict to tags that can actually reach near the aim (avoids cheap-tag dilution),
    // then pick among them weighted by proximity to the aim
    const reach = candidates.filter((d) => bestValueNear(d, aim, ceiling, remaining) >= aim * 0.7);
    const useable = reach.length ? reach : candidates;
    const def = weightedPick(r, useable, (d) => {
      const v = bestValueNear(d, aim, ceiling, remaining);
      return 1 / (1 + Math.abs(v - aim));
    });
    const tier = def.tiered ? tierNear(def, aim, ceiling, remaining) : 3;
    if (!place(def, tier)) continue;
  }

  const level = spec.level;
  const base = rollBaseAttrs(r, tags);
  const talents = rollTalents(r);
  const attrs = attrsAtLevel(base, talents, level);
  let value = cardTagsValue(tags);

  // 3. jackpot-with-catch lottery
  let jackpotNegative: GeneratedCharacter['jackpotNegative'];
  if (r() < BALANCE.jackpotChance) {
    const sc = tags.filter((t) => tagDef(t.id)?.group === 'skill').length;
    const mc = tags.filter((t) => t.id.startsWith('skill:magic')).length;
    const bonus = pool.filter((d) => (!d.mutex || !usedMutex.has(d.mutex)) && !tags.some((t) => t.id === d.id) && d.tiered
      && !(d.group === 'skill' && sc >= BALANCE.maxSkills) && !(d.id.startsWith('skill:magic') && mc >= BALANCE.maxMagic));
    if (bonus.length) {
      const def = weightedPick(r, bonus, (d) => BALANCE.rarityBase[d.rarity]); // bias RARE for the jackpot
      const tier = Math.max(1, affordableTier(def, ceiling, ceiling, r) - randInt(r, 0, 1));
      place(def, tier);
      const newValue = cardTagsValue(tags);
      const overshoot = newValue - spec.targetValue;
      if (overshoot > 0) jackpotNegative = { kind: pick3(r), value: -overshoot };
      value = newValue;
    }
  }

  return { tags, attrs, base, talents, level, value, jackpotNegative };
}

/** Strongest tier whose value is affordable under the ceiling (for the jackpot). */
function affordableTier(def: TagDef, remaining: number, ceiling: number, _r: Rng): number {
  let best = 5;
  for (let tier = 5; tier >= 1; tier--) {
    const v = tagValue(def, tier);
    if (v <= remaining && v <= ceiling) best = tier; else break;
  }
  return best;
}
/** Tier whose value is closest to `aim`, not exceeding remaining or the ceiling. */
function tierNear(def: TagDef, aim: number, ceiling: number, remaining: number): number {
  let best = 5, bestDiff = Infinity;
  for (let tier = 5; tier >= 1; tier--) {
    const v = tagValue(def, tier);
    if (v > remaining || v > ceiling) continue;
    const diff = Math.abs(v - aim);
    if (diff <= bestDiff) { bestDiff = diff; best = tier; }
  }
  return best;
}
function bestValueNear(def: TagDef, aim: number, ceiling: number, remaining: number): number {
  return def.tiered ? tagValue(def, tierNear(def, aim, ceiling, remaining)) : tagValue(def, 3);
}
function ensureIdentity(r: Rng, tags: TagInstance[], usedMutex: Set<string>) {
  for (const group of ['gender', 'race']) {
    if (![...usedMutex].some((m) => m.startsWith(group))) {
      const opts = allTags().filter((d) => d.group === group);
      const def = opts[randInt(r, 0, opts.length - 1)];
      tags.push({ id: def.id, tier: 3 });
      if (def.mutex) usedMutex.add(def.mutex);
    }
  }
}
const pick3 = (r: Rng) => (['evidence', 'mess', 'debt'] as const)[randInt(r, 0, 2)];

// ---- splitValue: a target value → a bundle of kinds -------------------------
export interface SplitPart { kind: RewardKind; value: number }

const ARCHETYPE_SPLIT: Record<Archetype, { primary: RewardKind; unitShareRange: [number, number] }> = {
  capture: { primary: 'captive', unitShareRange: [0.7, 0.9] },
  rescue: { primary: 'recruit', unitShareRange: [0.7, 0.9] },
  raid: { primary: 'gold', unitShareRange: [0.0, 0.3] },
  escort: { primary: 'gold', unitShareRange: [0.0, 0.2] },
  investigate: { primary: 'lead', unitShareRange: [0.3, 0.6] },
  hunt: { primary: 'captive', unitShareRange: [0.5, 0.8] },
  contract: { primary: 'gold', unitShareRange: [0.0, 0.1] },
  scout: { primary: 'lead', unitShareRange: [0.4, 0.7] },
};

export function splitValue(r: Rng, V: number, archetype: Archetype, isChain: boolean): SplitPart[] {
  if (isChain) return [{ kind: 'recruit', value: V }]; // concentrate on focal character
  const cfg = ARCHETYPE_SPLIT[archetype];
  const [lo, hi] = cfg.unitShareRange;
  const unitShare = lo + r() * (hi - lo);
  const parts: SplitPart[] = [];
  const unitValue = Math.round(V * unitShare);
  const goldValue = V - unitValue;
  if (unitValue > 0 && cfg.primary !== 'gold') {
    // value-scaled count: a big haul splits into two units
    if (unitValue > BALANCE.vBase(1) * 6 && r() < 0.5) {
      parts.push({ kind: cfg.primary, value: Math.round(unitValue * 0.6) });
      parts.push({ kind: cfg.primary, value: unitValue - Math.round(unitValue * 0.6) });
    } else parts.push({ kind: cfg.primary, value: unitValue });
  }
  if (goldValue > 0) parts.push({ kind: 'gold', value: goldValue });
  if (!parts.length) parts.push({ kind: 'gold', value: V });
  return parts;
}

// ---- overlap: the one fit function (signed) ---------------------------------
/** Score how a card's tags fit a desired set: +favored, −clashing (opposites). */
export function overlap(have: TagInstance[], favored: string[], clashing: string[] = []): number {
  let score = 0;
  const haveIds = new Map(have.map((t) => [t.id, t.tier]));
  for (const f of favored) {
    const tier = haveIds.get(f);
    if (tier !== undefined) score += BALANCE.favoredBonus(tier);
    // also reward owning the opposite-of-a-clash? no — keep simple
  }
  for (const c of clashing) {
    const tier = haveIds.get(c);
    if (tier !== undefined) score -= BALANCE.clashPenalty(tier);
  }
  return score;
}

// ---- the roll ---------------------------------------------------------------
export interface RollTest { attribute: Attribute; favored: string[]; clashing: string[] }

/** Coins a single character contributes to a test. */
export function coinsFor(c: CharacterCard, test: RollTest): number {
  let coins = c.attrs[test.attribute];
  coins += overlap(c.tags, test.favored, test.clashing);
  for (const inj of c.injuries) coins -= BALANCE.injuryPenalty(inj.tier);
  return Math.max(0, Math.round(coins));
}

export function partyCoins(party: CharacterCard[], tests: RollTest[]): number {
  // each filled slot tests against its own test; sum contributions
  let total = 0;
  party.forEach((c, i) => { total += coinsFor(c, tests[i] ?? tests[0]); });
  return total;
}

export function thresholdFor(slotCount: number, level: number): number {
  return Math.round(slotCount * BALANCE.thresholdPerMerc(level));
}

export interface RollResult { coins: number; heads: number; threshold: number; outcome: import('./types.js').Outcome }

export function resolveRoll(r: Rng, coins: number, threshold: number): RollResult {
  const heads = flipCoins(r, coins);
  let outcome: import('./types.js').Outcome;
  if (heads >= threshold) outcome = 'success';
  else if (heads >= Math.ceil(threshold * 0.6)) outcome = 'partial';
  else outcome = 'failure';
  return { coins, heads, threshold, outcome };
}

/** Visible odds before commit (Monte-Carlo so partial/clash effects show). */
export function estimateOdds(coins: number, threshold: number): { success: number; partial: number; failure: number } {
  // exact-ish via normal approx of Binomial(coins, 0.5)
  const mean = coins / 2, sd = Math.sqrt(coins) / 2 || 0.0001;
  const p = (k: number) => 1 - normCdf((k - 0.5 - mean) / sd); // P(heads >= k)
  const pSucc = clamp01(p(threshold));
  const pPartialUp = clamp01(p(Math.ceil(threshold * 0.6)));
  return { success: pSucc, partial: clamp01(pPartialUp - pSucc), failure: clamp01(1 - pPartialUp) };
}
function normCdf(z: number) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
