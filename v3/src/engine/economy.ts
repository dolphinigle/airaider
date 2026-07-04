// Economy — ECONOMY.md + GENERATION_FLOW §1–§3. Value is gold-denominated and signed;
// a card's value is MARKED at generation (= the target spent), tags are the substance.

import type { Rng } from './rng.js';
import {
  CONCEPTS, CONCEPT, GROUPS, tagValue, tagsValue, maxTier, RACE_BODY_BIAS,
  type TagInstance, type Domain,
} from './tags.js';
import { freshId, HELD, mintStackable, type Card, type CharRole } from './cards.js';
import { growToLevel } from './growth.js';

// ---- the master chart -------------------------------------------------------------

/** V_base(L) ≈ 30 × 1.35^(L−1): level → value-per-merc-per-cycle (ECONOMY §2) */
export function vBase(level: number): number {
  return 30 * Math.pow(1.35, level - 1);
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
  role?: CharRole;                // characters only
  level?: number;                 // characters only (defaults to contentLevel)
  jackpotChance?: number;         // small jackpot-with-catch lottery
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
    else if (group === 'race') pick = rng.weighted(members.map(m => [m, m === 'human' ? 3 : 1] as const));
    else if (group === 'style') pick = rng.weighted(members.map(m => [m, m === 'human-style' ? 3 : 1] as const));
    else pick = rng.pick(members);
    const c = CONCEPT[pick]!;
    place({ concept: pick, tier: c.depth > 1 ? rollTier(rng, pick, ceiling, opts.targetV) : undefined });
  }

  // spend the remainder (budget-driven; flavor flats ride along via their odds)
  let spent = Math.max(0, tagsValue(tags));
  const raceBias = RACE_BODY_BIAS[tags.find(t => CONCEPT[t.concept]?.group === 'race')?.concept ?? 'human'] ?? {};
  for (let iter = 0; iter < 24 && tags.length < 12; iter++) {
    const remaining = opts.targetV - spent;
    if (remaining < 12) break;
    const cand = pool.rollable.filter(r => {
      const c = CONCEPT[r.id]!;
      if (owned.has(r.id)) return false;
      if (c.opposite && owned.has(c.opposite)) return false;
      if (blockedGroups.has(c.group)) return false;
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

export type Archetype = 'raid' | 'capture' | 'rescue' | 'escort' | 'investigate' | 'hunt' | 'contract' | 'lead-hunt';
export type RewardKind = 'gold' | 'captive' | 'recruit' | 'relic' | 'lead';

export interface RewardSpec {
  kind: RewardKind;
  value: number;           // for units: the generation target; gold: amount
  required?: TagInstance[];
}

/** one-off split: archetype sets the primary kind + a randomized unit:gold ratio */
export function splitOneOff(rng: Rng, V: number, archetype: Archetype): RewardSpec[] {
  const out: RewardSpec[] = [];
  const unitShare = (lo: number, hi: number) => rng.float(lo, hi);
  switch (archetype) {
    case 'capture': {
      const s = unitShare(0.7, 0.9);
      out.push({ kind: 'captive', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'rescue': {
      const s = unitShare(0.6, 0.85);
      out.push({ kind: 'recruit', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'hunt': case 'investigate': {
      const s = unitShare(0.3, 0.6);
      out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      break;
    }
    case 'lead-hunt': {
      out.push({ kind: 'lead', value: V * 0.7 }, { kind: 'gold', value: V * 0.3 });
      break;
    }
    default: // raid / contract / escort → gold-primary with a relic chance
      if (rng.chance(0.35)) {
        const s = unitShare(0.25, 0.5);
        out.push({ kind: 'relic', value: V * s }, { kind: 'gold', value: V * (1 - s) });
      } else out.push({ kind: 'gold', value: V });
  }
  // lottery: a bonus lead (priced — §21.2: lead grants are a budget component;
  // 🛠 rate must carry the pre-lodge early game)
  if (rng.chance(0.22)) {
    const leadCost = V * 0.15;
    const goldPart = out.find(r => r.kind === 'gold');
    if (goldPart && goldPart.value > leadCost) {
      goldPart.value -= leadCost;
      out.push({ kind: 'lead', value: leadCost });
    }
  }
  return out.map(r => ({ ...r, value: Math.round(r.value) }));
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
export function hireCost(mark: number): number { return Math.round(mark * 1.2) }

/** per-cycle passive trickle is ZERO — income is quest gold (ECONOMY §6). */

export { mintStackable };
