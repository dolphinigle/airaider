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
  // tuned 2026-06-11 from text-UI playtests: at 3+0.5L a matched decent-fit merc sat at S19%/F50%
  // (1-slot) and S17% (2-slot) — fail-spam, debt piles, dead starter sagas. Target: decent fit ≈
  // S50/P30/F20, good fit (favored match) safe, poor fit still punished.
  thresholdPerMerc: (level: number) => 2.5 + level * 0.4,
  // generation: tag-count scales with budget (a legendary hero has more traits).
  // +2 for the identity (gender/race) slots that carry ~no value.
  maxTagsPerCard: 16,
  tagCapFor: (targetValue: number, ceiling: number) =>
    Math.min(16, Math.max(5, 2 + Math.ceil(targetValue / (ceiling * 0.45)))),
  // UNIT_GENERATION.md §1: each tag is rolled INDEPENDENTLY (no count caps — PoE's slot limit is wrong
  // for us). Rarity is emergent from the weights, not clipped.
  // appearance probability that a given tag shows up at all (low — most tags don't), by group:
  tagAppear: (group: string): number => ({ personality: 0.17, physical: 0.13, skill: 0.055, background: 0.13, notoriety: 0.05 } as Record<string, number>)[group] ?? 0.07,
  // tier spawn weights [unused, T1…T5] — low tiers common, top tiers ("very X") rare:
  tierWeight: [0, 2, 6, 16, 30, 46] as number[],
  // the most value a single believable character can hold in tags (empirically matched to what
  // the grounded caps actually allow); value beyond this flows to the bundle as gold/treasure
  maxCharValue: (level: number) => 45 + level * 11,
  jackpotChance: 0.08,
  // ---- chain reward bank (REWARD_BANK.md) ----
  // allowed MIDDLE-beat failures before a saga is forced to a desperate finale (harder = fewer).
  failBudget: { common: 2, uncommon: 2, rare: 1, legendary: 1 } as Record<Rarity, number>,
  // at the finale, if the realized bank covers at least this fraction of the focal's value we still
  // deliver the focal (saddled with a debt for the gap); below it the focal slips away → gold instead.
  focalKeepFraction: 0.4,
  // even on an AI-flagged IMMEDIATE beat, the engine still BANKS this share toward the finale, so the
  // saga always builds a payoff (the focal stays affordable). The rest is paid out now. (REWARD_BANK.md)
  minDeferShare: 0.4,
  // resolution word budget [beforeMin, beforeMax, afterMin, afterMax] — scales with STAKES on two axes:
  // position (one-off < chain beat < FINALE) × rarity. A legendary finale earns ~3-4× a common one-off.
  // Calibrated by reading real outputs (_exp_reslength.ts): one-off ~50w reads tight; finale common ~110w
  // weighty; finale legendary ~160-180w sustains; beyond that it bloats.
  resWords: {
    oneoff: { common: [22, 34, 42, 62], uncommon: [24, 37, 46, 68], rare: [27, 40, 52, 76], legendary: [30, 44, 58, 84] },
    beat:   { common: [30, 45, 55, 80], uncommon: [33, 48, 62, 90], rare: [36, 52, 70, 100], legendary: [40, 56, 78, 110] },
    finale: { common: [45, 62, 90, 122], uncommon: [50, 68, 105, 138], rare: [55, 74, 120, 155], legendary: [62, 82, 140, 180] },
  } as Record<'oneoff' | 'beat' | 'finale', Record<Rarity, [number, number, number, number]>>,
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
  // physical = force/brawn/toughness (toughness + battle-nerve folded in here now that willpower→perception)
  'phys:muscular': 'physical', 'skill:weapon': 'physical', 'bg:soldier': 'physical',
  'phys:tough': 'physical', 'pers:brave': 'physical',
  'skill:stealth': 'agility', 'bg:criminal': 'agility',
  'phys:clever': 'intelligence', 'skill:lore': 'intelligence', 'bg:scholar': 'intelligence',
  'skill:magic-fire': 'intelligence', 'skill:magic-earth': 'intelligence',
  'skill:magic-water': 'intelligence', 'skill:magic-air': 'intelligence', 'skill:magic-dark': 'intelligence',
  'phys:beautiful': 'charisma', 'bg:noble': 'charisma', 'skill:song': 'charisma', 'bg:merchant': 'charisma',
  'pers:kind': 'charisma', 'pers:gregarious': 'charisma',
  // perception = awareness/intuition: tracking, sensing danger, reading people
  'bg:hunter': 'perception', 'bg:priest': 'perception', 'pers:calm': 'perception', 'pers:aloof': 'perception',
  'skill:heal': 'intelligence',
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
  exclude?: string[];       // canonical tag ids to AVOID (e.g. recent focals' theme skills → saga variety)
  role?: 'merc' | 'captive' | 'npc';
  maxSkills?: number;       // override the global skill cap (focals use 2 — fewer, more believable skills)
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
  const ceiling = BALANCE.tagCeiling(spec.level);   // PoE ilvl: caps the per-tag value this source can roll
  const tags: TagInstance[] = [];
  const usedMutex = new Set<string>();
  const place = (def: TagDef, tier: number) => {
    if (def.mutex) { if (usedMutex.has(def.mutex)) return false; usedMutex.add(def.mutex); }
    if (tags.some((t) => t.id === def.id)) return false;
    tags.push({ id: def.id, tier });
    return true;
  };

  // 1. AI-required tags first (mid tier) — they count against the budget
  for (const id of spec.required ?? []) { const def = tagDef(id); if (def) place(def, 3); }
  // 2. identity floor (mandatory): a gender + a race
  ensureIdentity(r, tags, usedMutex);
  // 3. SPEND THE VALUE BUDGET (ECONOMY §4): loop until the remaining budget R is ~spent — pick a tag
  //    drop-weight-weighted, tier weighted LOW (standouts stay rare) but capped by the level ceiling AND
  //    by what R affords. The unit's worth now TRACKS the target instead of being a flat emergent roll
  //    (a rare saga's prize is genuinely worth more); any unspendable remainder pads as gold upstream.
  const avoid = new Set(spec.exclude ?? []);
  const skillCap = spec.maxSkills ?? 3;             // believability: even a rich budget caps skills
  // believability caps per group (a person isn't five personalities); budget spends WITHIN these
  const GROUP_CAP: Record<string, number> = { personality: 2, physical: 2, skill: skillCap, background: 1, notoriety: 1 };
  const groupCount = (g: string) => tags.filter((t) => tagDef(t.id)?.group === g).length;
  for (let guard = 0; guard < 40; guard++) {
    const R = spec.targetValue - cardTagsValue(tags);
    if (R <= 0) break;
    const slack = R * 0.25 + 2;                     // mild overshoot allowed so small budgets still spend
    // CONCENTRATE value: each pick should spend a real share of what's left (~R/4), so a rich budget buys
    // few STANDOUT tags instead of a sprawl of cheap ones; as R shrinks, cheap tags become eligible again.
    const minSpend = Math.min(Math.max(2, R / 4), ceiling * 0.8);
    const pref: Array<{ def: TagDef; tiers: number[] }> = [];
    const any: Array<{ def: TagDef; tiers: number[] }> = [];
    for (const def of allTags()) {
      if (def.group === 'gender' || def.group === 'race' || avoid.has(def.id)) continue;
      if (def.mutex && usedMutex.has(def.mutex)) continue;
      if (tags.some((t) => t.id === def.id)) continue;
      if (groupCount(def.group) >= (GROUP_CAP[def.group] ?? 2)) continue;
      const affordable = (def.tiered ? [1, 2, 3, 4, 5] : [3]).filter((t) => {
        const v = tagValue(def, t); return v <= ceiling && v <= R + slack;
      });
      if (!affordable.length) continue;
      const meaty = affordable.filter((t) => tagValue(def, t) >= minSpend);
      if (meaty.length) pref.push({ def, tiers: meaty });
      any.push({ def, tiers: affordable });
    }
    const cands = pref.length ? pref : any;
    if (!cands.length) break;
    const c = weightedPick(r, cands, (x) => BALANCE.tagAppear(x.def.group));
    // among the eligible tiers, stay weighted LOW (the cheapest tier that still spends ≥ minSpend is the
    // most common pick; a top tier stays the rare standout)
    const tier = c.def.tiered ? weightedPick(r, c.tiers, (t) => BALANCE.tierWeight[t] ?? 1) : 3;
    place(c.def, tier);
  }
  // 4. jackpot-with-catch (ECONOMY §4 step 4, previously dead code): a small lottery OVERSHOOTS the
  //    budget with one extra standout tag and saddles a negative sized to the overshoot — net ~target.
  let jackpotNegative: GeneratedCharacter['jackpotNegative'];
  if (r() < BALANCE.jackpotChance) {
    const lux = allTags().filter((d) => d.tiered && !avoid.has(d.id)
      && !(d.mutex && usedMutex.has(d.mutex)) && !tags.some((t) => t.id === d.id)
      && !(d.group === 'skill' && tags.filter((t) => t.id.startsWith('skill:')).length >= skillCap)
      && [1, 2].some((t) => tagValue(d, t) <= ceiling));
    if (lux.length) {
      const def = lux[randInt(r, 0, lux.length - 1)];
      const tier = tagValue(def, 1) <= ceiling ? 1 : 2;
      place(def, tier);
      const over = cardTagsValue(tags) - spec.targetValue;
      if (over > 4) {
        const kinds = ['evidence', 'mess', 'debt'] as const;
        jackpotNegative = { kind: kinds[randInt(r, 0, 2)], value: Math.round(over) };
      }
    }
  }

  const level = spec.level;
  const base = rollBaseAttrs(r, tags);
  const talents = rollTalents(r);
  const attrs = attrsAtLevel(base, talents, level);
  const value = cardTagsValue(tags);
  return { tags, attrs, base, talents, level, value, jackpotNegative };
}

/** Roll a tag's tier: low tiers ("ordinary") common, top tiers ("very X") rare; gated by the ceiling. */
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
  // a gold-primary archetype is all gold (a non-gold unit share would just be discarded below,
  // silently leaking value — the bundle must net ~V)
  const unitShare = cfg.primary === 'gold' ? 0 : lo + r() * (hi - lo);
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
