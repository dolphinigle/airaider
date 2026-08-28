// Economy — ECONOMY.md + GENERATION_FLOW §1–§3. Value is gold-denominated and signed;
// a card's value is MARKED at generation (= the target spent), tags are the substance.

import type { Rng } from './rng.js';
import {
  CONCEPTS, CONCEPT, GROUPS, tagValue, tagsValue, maxTier, RACE_BODY_BIAS, rankOf,
  type TagInstance, type Domain, type Rank,
} from './tags.js';
import { freshId, HELD, mintStackable, type Card, type CharRole } from './cards.js';
import { growToLevel } from './growth.js';
import { profileOf, type Archetype } from './archetypes.js';

// ---- the master chart -------------------------------------------------------------

/** V_base(L) ≈ 30 × 1.35^(L−1): level → value-per-merc-per-cycle (ECONOMY §2) */
export function vBase(level: number): number {
  return 30 * Math.pow(1.35, level - 1);
}

/** ECONOMY §2 (built 2026-07-11, was deferred #219): CONTENT value grows 1.35/level (marks, tags,
 *  banks — the internal ruler), but player INCOME grows ~1.20/level (🛠 2026-07-11: the doc's 1.09 assumed the 2,000-cycle ladder — under the compressed prototype ladder it STARVED a 115-cycle fort to 234g; 1.35 exploded it to 54k. 1.20 matches the re-paced cost curves). This deflator converts
 *  content-value to CASH wherever gold actually reaches the treasury. Without it, regions raised
 *  lead levels and a PARTIAL common paid +25,395g (L~30 vBase ≈ 180k). */
export function incomeScale(level: number): number {
  return Math.pow(1.20 / 1.35, Math.max(0, level - 1));
}

/** the same income curve expressed from a CONTENT value directly (cards don't carry levels):
 *  cash = 30·1.09^(L-1) where L is the level implied by value = 30·1.35^(L-1) */
const CASH_K = Math.log(1.20) / Math.log(1.35);
export function cashValue(contentValue: number): number {
  if (contentValue <= 0) return 0;
  return Math.round(Math.pow(30, 1 - CASH_K) * Math.pow(contentValue, CASH_K));
}

export type Rarity = 'common' | 'uncommon' | 'rare';
export const RARITY_MULT: Record<Rarity, number> = { common: 1, uncommon: 1.8, rare: 3.5 }; // 🛠

// §1: E[payoff] at chain genesis
export const SLOTS_PER_BEAT = 1.5;    // flat S̄ (§1 — deliberately not distribution-exact)
export const OUTCOME_DISCOUNT = 0.8;

export function chainPayoff(expectedBeats: number, level: number, rarity: Rarity): number {
  return expectedBeats * SLOTS_PER_BEAT * vBase(level) * RARITY_MULT[rarity] * OUTCOME_DISCOUNT;
}

// ---- generateCard (ECONOMY §4) ------------------------------------------------------

export interface GenOptions {
  domain: Domain;                 // character or relic
  targetV: number;                // the mark
  contentLevel: number;           // tier ceiling = 2L+2 (ilvl)
  required?: TagInstance[];       // AI-required tags (placed first, §4 handoff)
  race?: string;                  // pool bias (region poolWeights)
  gender?: string;                // preset identity (§4 pattern-B: identity rolled before the AI writes)
  role?: CharRole;                // characters only
  level?: number;                 // characters only (defaults to contentLevel)
  jackpotChance?: number;         // small jackpot-with-catch lottery
  excludeConcepts?: string[];     // focal variety (BIBLE): recent focals' tags — never re-roll
  maxSkills?: number;             // focal cap (BIBLE): skills capped so archetypes vary
}

/**
 * Roll a tier for a concept, budget-driven (§3 "wealth parameter" in spirit):
 * aim to spend a random fraction of the remaining budget, pick the highest tier
 * that fits, with jitter. Bottom-heavy at small budgets; the ceiling gates the top.
 */
function rollTier(rng: Rng, conceptId: string, ceiling: number, budget: number): number {
  const c = CONCEPT[conceptId]!;
  const hi = Math.min(c.depth, ceiling);
  if (hi <= 1) return 1;
  // zero-value tiered flavor (tall/short, sturdy/heavy…): tier = AI intensity only —
  // roll it BOTTOM-WEIGHTED, never budget-driven ("legendary" must stay rare language)
  if (c.zeroValue) {
    const w: [number, number][] = [];
    for (let t = 1; t <= hi; t++) w.push([t, Math.pow(0.45, t - 1)]);
    return rng.weighted(w);
  }
  const desired = Math.max(6, budget * rng.float(0.2, 0.85));
  let tier = 1;
  for (let t = 1; t <= hi; t++) {
    if (Math.abs(tagValue({ concept: conceptId, tier: t })) <= desired) tier = t; else break;
  }
  // jitter: occasional ±1 (the up-jitter is part of the jackpot tail)
  if (rng.chance(0.25)) tier = Math.max(1, Math.min(hi, tier + (rng.chance(0.5) ? 1 : -1)));
  return tier;
}

function conceptPool(domain: Domain): { identity: string[][]; rollable: { id: string; odds: number }[] } {
  const identity: string[][] = [];
  const rollable: { id: string; odds: number }[] = [];
  const groups = new Map<string, string[]>();
  for (const c of CONCEPTS) {
    const g = GROUPS[c.group]!;
    const dom = c.domainOverride ?? g.domain;
    if (dom !== domain && dom !== 'both') continue;
    if (c.group === 'type' || c.group === 'kind' || c.group === 'status') continue;
    if (g.pickPolicy === 'exactly-1') {
      (groups.get(c.group) ?? groups.set(c.group, []).get(c.group)!).push(c.id);
    } else {
      rollable.push({ id: c.id, odds: c.appearOdds ?? defaultOdds(c.group) });
    }
  }
  for (const list of groups.values()) identity.push(list);
  return { identity, rollable };
}

function defaultOdds(group: string): number {
  switch (group) {
    case 'personality': return 0.30;  // a few personality words per character
    case 'body': return 0.12;
    case 'skill': return 0.10;
    case 'background': return 0.85;   // nearly everyone has a vocation
    case 'rtrait': return 0.20;
    case 'standing': return 0.02;
    default: return 0.10;
  }
}

/**
 * generateCard — pure engine (§4): place required tags, then LOOP rolling tags
 * (drop-weight, mutex-safe, tier weighted low ≤ ceiling) until the target is ~spent.
 * The card's value is MARKED = targetV regardless of the substance (§2.5).
 */
/** THE WEALTH ROLL — GENERATION_FLOW §3: "a wealth parameter … shapes the distribution so
 *  E[value] ≈ target; right tail from rare top tiers", and ECONOMY §4's "jackpot/DUD lottery".
 *
 *  The point of unit generation is that it is RANDOM with the target as its EXPECTATION, not that
 *  every card converges on the target. A first pass at fixing the old shortfall spent the budget
 *  down deterministically and produced p10 0.99 / p90 1.08 — the mean was right and the lottery
 *  was gone: no duds, and never the "substance ≫ mark" that ECONOMY §1 calls the jackpot gap.
 *
 *  So the TARGET itself is rolled: mostly near 1, a dud tail below, a rare heavy tail above. The
 *  card is still MARKED at the plain target (§1), so a lucky roll really is worth more than its
 *  mark says — which is the whole thrill, and what the ★ marker reads. Mean is held at ≈1.00 by
 *  construction: the three branches' weights and spans are chosen so they cancel. */
function rollWealth(rng: Rng): number {
  const r = rng.next();
  if (r < 0.10) return 0.55 + rng.float(0, 0.30);        // dud      0.55-0.85   (mean 0.70)
  if (r < 0.94) return 0.85 + rng.float(0, 0.24);        // ordinary 0.85-1.09   (mean 0.97)
  return 1.13 + rng.float(0, 1.20);                       // jackpot  1.13-2.33   (mean 1.73)
}

export function generateCard(rng: Rng, opts: GenOptions): Card {
  const ceiling = maxTier(opts.contentLevel);
  const tags: TagInstance[] = [{ concept: opts.domain }];
  const owned = new Set<string>(tags.map(t => t.concept));
  const blockedGroups = new Set<string>();

  const place = (t: TagInstance) => {
    tags.push(t); owned.add(t.concept);
    const c = CONCEPT[t.concept];
    if (c) {
      const g = GROUPS[c.group]!;
      if (g.pickPolicy !== 'free') blockedGroups.add(c.group);
    }
  };

  // required tags first (AI-proposed, engine-guarded)
  for (const r of opts.required ?? []) {
    const c = CONCEPT[r.concept];
    if (!c) continue;
    if (owned.has(r.concept) || (c.opposite && owned.has(c.opposite))) continue;
    if (blockedGroups.has(c.group) && GROUPS[c.group]!.pickPolicy !== 'free') continue;
    place({ concept: r.concept, tier: r.tier ? Math.min(r.tier, c.depth, ceiling) : undefined });
  }

  const pool = conceptPool(opts.domain);

  // identity groups (exactly-1) roll first — race honors the pool bias
  for (const members of pool.identity) {
    const group = CONCEPT[members[0]!]!.group;
    if (blockedGroups.has(group)) continue;
    let pick: string;
    if (group === 'race' && opts.race && members.includes(opts.race)) pick = opts.race;
    else if (group === 'gender' && opts.gender && members.includes(opts.gender)) pick = opts.gender;
    else if (group === 'race') pick = rng.weighted(members.map(m => [m, m === 'human' ? 3 : 1] as const));
    else if (group === 'style') pick = rng.weighted(members.map(m => [m, m === 'human-style' ? 3 : 1] as const));
    else pick = rng.pick(members);
    const c = CONCEPT[pick]!;
    place({ concept: pick, tier: c.depth > 1 ? rollTier(rng, pick, ceiling, opts.targetV) : undefined });
  }

  // ECONOMY §4 step 4 — jackpot-with-catch: seed a FLAW first; the budget loop then overshoots
  // the positives to compensate, so the bundle still nets targetV (stronger lines, one catch)
  if (opts.jackpotChance && rng.chance(opts.jackpotChance)) {
    const negs = pool.rollable.filter(r => {
      const c2 = CONCEPT[r.id]!;
      return c2.negative && !owned.has(r.id) && !(c2.opposite && owned.has(c2.opposite)) && !blockedGroups.has(c2.group);
    });
    if (negs.length) {
      const id = rng.pick(negs.map(n => n.id));
      const c2 = CONCEPT[id]!;
      place({ concept: id, tier: c2.depth > 1 ? rng.range(1, Math.min(c2.depth, ceiling)) : undefined });
    }
  }

  // spend the remainder against the ROLLED budget — the mark below stays the plain target, so
  // substance may land under it (a dud) or well over it (the jackpot gap, ECONOMY §1)
  const budget = opts.targetV * rollWealth(rng);
  let spent = Math.max(0, tagsValue(tags));
  const raceBias = RACE_BODY_BIAS[tags.find(t => CONCEPT[t.concept]?.group === 'race')?.concept ?? 'human'] ?? {};
  for (let iter = 0; iter < 24 && tags.length < 12; iter++) {
    const remaining = budget - spent;
    // NOT lowered to the cheapest tag's price (6): letting the fill loop keep buying TAGS to use
    // up the budget pushed the median card to the 12-tag cap, which is exactly the "tag-count
    // sprawl" §3b goal 5 forbids. The remainder is spent on TIERS instead, below.
    if (remaining < 12) break;
    const excluded = new Set(opts.excludeConcepts ?? []);
    const skillCount = tags.filter(t => CONCEPT[t.concept]?.group === 'skill').length;
    const cand = pool.rollable.filter(r => {
      const c = CONCEPT[r.id]!;
      if (owned.has(r.id)) return false;
      if (c.opposite && owned.has(c.opposite)) return false;
      if (blockedGroups.has(c.group)) return false;
      if (excluded.has(r.id)) return false;
      if (opts.maxSkills !== undefined && c.group === 'skill' && skillCount >= opts.maxSkills) return false;
      return true;
    });
    if (cand.length === 0) break;
    const weights = cand.map(r => {
      let w = r.odds * (raceBias[r.id] ?? 1);
      if ((CONCEPT[r.id]!.depth ?? 1) > 1) w *= 4;   // earning lines carry the budget
      return [r.id, w] as const;
    });
    const id = rng.weighted(weights);
    const c = CONCEPT[id]!;
    // TINY-odds lines (enchantments, standing) stay RARE per W9/W16 — an acceptance
    // roll on top of the relative weighting (usually 0-1 per card, never five)
    if ((c.appearOdds ?? 1) < 0.05 && !rng.chance((c.appearOdds ?? 1) * 10)) continue;
    place({ concept: id, tier: c.depth > 1 ? rollTier(rng, id, ceiling, Math.max(0, remaining)) : undefined });
    spent = Math.max(0, tagsValue(tags));
  }

  // TOP-UP BY QUALITY — ECONOMY §4 step 2 ("LOOP until R ~spent") and §3b goal 5 ("Value through
  // QUALITY (tier/intensity), not tag-count sprawl"). The fill loop above buys bottom-weighted
  // tiers and stops as soon as it cannot afford another TAG, which measured a ONE-DIRECTIONAL
  // shortfall against §3's "E[value] ≈ target": 0.62× target at L1, rising to 0.94 by L20 — worst
  // exactly where the player is poorest. So spend what is left by raising tiers already on the
  // card rather than adding more tags. The pick is uniform among the affordable upgrades so the
  // distribution's shape (bottom-weighted, right tail from rollTier) is left alone.
  for (let guard = 0; guard < 40; guard++) {
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const up = tags
      .map(t => ({ t, c: CONCEPT[t.concept] }))
      .filter((x): x is { t: TagInstance; c: NonNullable<typeof x.c> } => {
        const { t, c } = x;
        if (!c || !t.tier || c.negative || c.zeroValue || GROUPS[c.group]?.identity) return false;
        return t.tier < Math.min(c.depth, ceiling);
      })
      .map(x => ({ ...x, cost: tagValue({ concept: x.t.concept, tier: x.t.tier! + 1 }) - tagValue(x.t) }))
      // "~spent" (§4 step 2) means NEAREST, not always-under: at a small target the last step
      // costs more than is left, and stopping short is what left L1 units at 0.87 of their mark.
      // Take an overstep only when it lands CLOSER to the target than stopping does — which also
      // gives the small overshoots §3b goal 8 calls the jackpot side of the same lottery.
      .filter(x => x.cost > 0 && (x.cost <= remaining || Math.abs(remaining - x.cost) < remaining));
    if (!up.length) break;
    const pick = rng.pick(up);
    pick.t.tier = pick.t.tier! + 1;
    spent = Math.max(0, tagsValue(tags));
  }

  const card: Card = {
    id: freshId(opts.domain === 'character' ? 'c' : 'r'),
    name: '',
    tags,
    value: Math.round(opts.targetV),   // MARKED
    location: HELD(opts.domain === 'character' ? 'limbo' : 'inventory'),
    chainIds: [],
  };

  if (opts.domain === 'character') {
    const level = opts.level ?? opts.contentLevel;
    const body = growToLevel(rng, level);
    card.character = {
      role: opts.role ?? 'npc', level, xp: 0,
      attrs: body.attrs, growthLean: body.growthLean,
      focus: { kind: 'none' }, injuryTiers: 0,
    };
  }
  return card;
}

// ---- the split (ECONOMY §3) ----------------------------------------------------------

export type { Archetype } from './archetypes.js';   // the pool is a data table now (archetypes.ts)
export type RewardKind = 'gold' | 'captive' | 'recruit' | 'relic' | 'lead';

export interface RewardSpec {
  kind: RewardKind;
  value: number;           // for units: the generation target; gold: amount
  required?: TagInstance[];
}

/** one-off split: archetype sets the primary kind + a randomized unit:gold ratio.
 *  `level` deflates the GOLD portions to the mandated income curve (units keep full value). */
export function splitOneOff(rng: Rng, V: number, archetype: Archetype, level = 1): RewardSpec[] {
  const out: RewardSpec[] = [];
  const unitShare = (lo: number, hi: number) => rng.float(lo, hi);
  // ARCHETYPES is ~100 rows over these EIGHT shapes (archetypes.ts). Nothing switches on the
  // name — the name is the premise the writer sees, the profile is the money.
  switch (profileOf(archetype)) {
    case 'captive': {
      const s = unitShare(0.7, 0.9);
      out.push({ kind: 'captive', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'recruit': {
      const s = unitShare(0.6, 0.85);
      out.push({ kind: 'recruit', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'relic': {
      // the object IS the job — relic-primary, and thicker than the old 30–60% so it buys more
      // than a single tag (📏 §3.1: a level-2 hunt paid `relic 39` against a t4 tag costing 41)
      const s = unitShare(0.55, 0.85);
      out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'find': {
      // you went looking and found something — object AND coin, neither dominant
      if (rng.chance(0.7)) {
        const s = unitShare(0.35, 0.6);
        out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      } else out.push({ kind: 'lead', value: V * 0.3 }, { kind: 'gold', value: V * 0.7 });
      break;
    }
    case 'lead': {
      out.push({ kind: 'lead', value: V * 0.7 }, { kind: 'gold', value: V * 0.3 });
      break;
    }
    case 'spoils': {
      // what you carry off a place you took: coin, and often something off the floor
      if (rng.chance(0.5)) {
        const s = unitShare(0.25, 0.5);
        out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      } else out.push({ kind: 'gold', value: V });
      break;
    }
    case 'bloody': {
      // the pay is only coin, and the job is the kind that costs you. It pays BETTER than agreed
      // work of the same weight — that premium is the whole point of the shape.
      out.push({ kind: 'gold', value: V });
      break;
    }
    default: {   // 'coin' — agreed work, agreed price
      if (rng.chance(0.2)) {
        const s = unitShare(0.2, 0.4);
        out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      } else out.push({ kind: 'gold', value: V });
    }
  }
  // lottery: a bonus lead (priced — §21.2, and §7.1 now spends that price). A bundle that ALREADY
  // grants a lead gets its lead thickened instead of a second one bolted on (📏 §3.1 bug: lead-hunt
  // handed out two separate leads 22% of the time).
  if (rng.chance(0.22)) {
    const leadCost = V * 0.15;
    const goldPart = out.find(r => r.kind === 'gold');
    if (goldPart && goldPart.value > leadCost) {
      goldPart.value -= leadCost;
      const existing = out.find(r => r.kind === 'lead');
      if (existing) existing.value += leadCost;
      else out.push({ kind: 'lead', value: leadCost });
    }
  }
  return out.map(r => ({ ...r, value: Math.round(r.kind === 'gold' ? r.value * incomeScale(level) : r.value) }));
}

/** chain split (§2): core kind from the extendable table; unit share 55–85% of E[payoff] */
export type ChainKind = 'recruit' | 'captive' | 'gold-hoard';
export function rollChainKind(rng: Rng): ChainKind {
  return rng.weighted([['recruit', 4], ['captive', 3], ['gold-hoard', 2]] as const);
}
export function chainFocalTarget(rng: Rng, payoff: number): number {
  return Math.round(rng.float(0.55, 0.85) * payoff);
}

// ---- outcomes & delivery (ECONOMY §5) --------------------------------------------------

export const KEEP_THRESHOLD = 0.4; // partial: keep the unit if its mark ≥ KEEP × bundle V, else V/2 gold

// ---- prices 🛠 --------------------------------------------------------------------------

export const RANSOM_RATE = 0.6;      // §2: ransom = 0.6 × mark
export const SELL_RATE = 0.5;        // relics/dead drops
/** hire cost ≥ the grow-investment (ECONOMY §6 lean) */
// hires are paid in CASH — priced on the income curve, or high-level recruits become unpayable
export function hireCost(mark: number): number { return Math.round(cashValue(mark) * 1.2) }

// ---- WHAT A UNIT IS ACTUALLY WORTH (2026-08-27, designer: "a marker for unit rarity … so players
// can at a glance see how rare they would be") ------------------------------------------------
//
// A card's `value` is the MARK — the budget SPENT generating it (§1) — so it is the same for a
// jackpot and a dud and can never show rarity. What varies is the SUBSTANCE: the tags actually
// rolled. Measured over 36k generated units, substance/mark runs 0.62 at L1 up to 0.94 by L20,
// with the top ~2% overshooting the mark — that overshoot is the jackpot the docs promise
// ("jackpot = substance ≫ mark, that gap is the thrill", GENERATION_FLOW §8).
//
// So the marker is two honest readings, and NOT a ratio: the ratio's baseline slides with level,
// so a fixed threshold on it would only ever report "higher level = rarer".
//   worth — what their tags are really worth in coin, directly comparable to the price asked
//   rank  — the game's own band word for their best tag, which is what makes them useful in a slot

/** coin worth of what a card actually IS, from its tags (not from the budget spent on it) */
export function unitWorth(card: { tags: TagInstance[] }): number {
  return cashValue(Math.max(0, tagsValue(card.tags)));
}

/** the strongest thing they can DO — the best positively-valued tag, as the game's own rank word.
 *  Sign matters: a first pass ranked by raw tier and proudly starred a "legendary ugly". */
export function unitPeak(card: { tags: TagInstance[] }): { concept: string; tier: number; rank: Rank } | null {
  let best: { concept: string; tier: number; rank: Rank } | null = null;
  for (const t of card.tags) {
    if (!t.tier || t.tier < 1 || tagValue(t) <= 0) continue;
    const c = CONCEPT[t.concept];
    if (!c || c.zeroValue) continue;          // tall/short carry intensity, not power
    if (!best || t.tier > best.tier) best = { concept: t.concept, tier: t.tier, rank: rankOf(t.concept, t.tier) };
  }
  return best;
}

/** 0-4 stars: how this person compares to a TYPICAL person of their level.
 *
 *  Two earlier bases were wrong and the measurements said so:
 *   - by RANK: rank is absolute, so by L20 86% of everyone was "high" and the mark said nothing;
 *   - vs their OWN mark: only honest for units generateCard priced to a budget. Founders and
 *     tavern walk-ins are built by freshCharacter, which never prices tags to their mark, so both
 *     opening soldiers read "·" — the marker was wrong about them, not the other way round.
 *
 *  So the reference is the level itself: worth ÷ the coin-equivalent of vBase(level). Level-stable
 *  at EVERY level (median 0.96-0.97, p97 ≈1.37 across L2-L30, 64k units) and defined for anyone
 *  with a level. Calibrated against the CHARACTER's level, which is what this function reads — a
 *  first pass calibrated against the CONTENT level they were generated at, one higher, and vBase
 *  moves 1.35× per level, so 25% of units came out ★★★★ where 5% was intended.
 *  Thresholds are the measured percentiles, so the scale means something:
 *    ★★★★  ~6%  a chase unit — substance well over its mark, the §1 jackpot gap
 *    ★★★  ~22%
 *    ★★   ~26%  what you expect to see
 *    ★    ~36%
 *    ·    ~10%  the dud end of the same lottery (ECONOMY §4)   */
export function unitStars(card: { tags: TagInstance[]; value: number; character?: { level: number } | null }): number {
  // a card with no level (a relic) still has a mark, and vBase inverts cleanly
  const level = card.character?.level ?? Math.max(1, 1 + Math.log(Math.max(1, card.value) / 30) / Math.log(1.35));
  const r = unitWorth(card) / Math.max(1, cashValue(vBase(level)));
  return r >= 1.20 ? 4 : r >= 1.05 ? 3 : r >= 0.94 ? 2 : r >= 0.82 ? 1 : 0;
}


/** per-cycle passive trickle is ZERO — income is quest gold (ECONOMY §6). */

export { mintStackable };

/** ── what a reward looks like FROM THE BOARD ────────────────────────────────────────────────
 *  ECONOMY §7.2's architecture, applied to the quest itself: "fine TIERS engine-side, coarse
 *  BANDS for the reader" — an offer is a rumour, not an invoice. The engine keeps the number;
 *  the card says roughly what it is worth.
 *
 *  These are ABSOLUTE, unlike the lead band, and deliberately so: a lead's bonus is a ratio
 *  because it rides on a quest whose level you do not know yet, whereas a player reading the
 *  board is choosing BETWEEN quests of different levels and wants to know which pays more.
 *
 *  🛠 The register is a soldier's pay because that is the reader's own yardstick, and it avoids
 *  colliding with the lead band's purse/chest/fortune (§7.2 took the same care). Thresholds are
 *  an impl knob: they sit near V_base(1), V_base(4), V_base(8) and one stride beyond. */
const COIN_BANDS: [number, string][] = [
  [25, 'a few days\' pay'],
  [60, 'a week\'s pay'],
  [150, 'a month\'s pay'],
  [400, 'a season\'s pay'],
];
export function coinBand(gold: number): string {
  if (gold < 1) return '';
  return COIN_BANDS.find(([cap]) => gold <= cap)?.[1] ?? 'more than a season\'s pay';
}
