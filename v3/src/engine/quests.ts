// Leads & quests — QUESTS.md. A lead is the engine's cheap SPEC; a quest is the AI's
// realization on pursue. Engine sets numbers/constraints; AI fills fiction; never the reverse.

import type { Rng } from './rng.js';
import { REGION } from './regions.js';
import {
  vBase, RARITY_MULT, splitOneOff, generateCard, type Rarity, type Archetype, type RewardSpec,
} from './economy.js';
import { rollName, rollRelicName } from './names.js';
import { mintStackable, HELD, type Card } from './cards.js';
import { tierOf, CONCEPT, T } from './tags.js';
import type { Attribute, Rank } from './tags.js';
import { type SlotTest, type DifficultyName, type Outcome } from './roll.js';

// ---- leads (QUESTS §1) -----------------------------------------------------------------

export type ChainInfo = { kind: 'none' } | { kind: 'starts-new' } | { kind: 'continues'; chainId: string; hook: string };

export interface Lead {
  id: string;
  rarity: Rarity;
  level: number;
  region: string;
  archetype: Archetype;
  chainInfo: ChainInfo;
  expiresAtCycle: number | null;   // null = standing (repeatable lead-hunts)
  source: 'starter' | 'hunt' | 'reward' | 'continuation' | 'personal' | 'interrogation' | 'collector' | 'sequel' | 'recruiting';
  title?: string;                  // cached chain title for continuation leads (zero AI cost)
  focalId?: string;                // sequel leads (§21-4a): the SLIPPED focal — the road back is to THEM
  liabilityId?: string;            // collector leads: beating the quest settles THIS liability
  personalMercId?: string;         // personal-chain leads: the merc whose main chain this starts
  echoNote?: string;               // echo rescues: the peril exactly as the story left this person
  /** ECONOMY §7.1: value banked ONTO this lead, added to the budget of the quest it opens.
   *  A lead's own worth is zero — access is free; this is the premium riding on it. Absent on
   *  saves written before the design, which reads as 0. */
  bonus?: number;
}

export const LEAD_TTL = 6; // cycles before an unpursued lead lapses 🛠

const ONE_OFF_ARCHETYPES: Archetype[] = ['raid', 'capture', 'rescue', 'escort', 'investigate', 'hunt', 'contract'];

export interface LeadRollCtx {
  cycle: number;
  unlockedRegions: string[];
  ghTier: number;
  rosterLevels: number[];          // active mercs' levels (level banding)
  hasDungeon: boolean;             // capture needs somewhere to put them
  /** 🛠 2026-07-10 premise-variety: archetypes dealt recently are skipped (bag-style rotation —
   *  uniform picks dealt fetch-object 14/24; readers named premise monotony the #1 drag) */
  recentArchetypes?: Archetype[];
}

/** rarity ceiling rises with the fort (GH tier as the prestige quantizer) */
function rollRarity(rng: Rng, ghTier: number): Rarity {
  const w: [Rarity, number][] = [['common', 0.78]];
  if (ghTier >= 2) w.push(['uncommon', 0.18]);
  if (ghTier >= 3) w.push(['rare', 0.05]);
  return rng.weighted(w);
}

function rollLevel(rng: Rng, ctx: LeadRollCtx, region: string): number {
  const band = REGION[region]!.levelBand;
  const levels = ctx.rosterLevels.length ? ctx.rosterLevels : [1];
  const median = [...levels].sort((a, b) => a - b)[Math.floor(levels.length / 2)]!;
  let l = median + rng.range(-1, 1);
  if (rng.chance(0.15)) l += rng.range(2, 3); // occasional stretch
  return Math.max(band[0], Math.min(band[1], l));
}

export function rollFreshLead(rng: Rng, ctx: LeadRollCtx, idGen: () => string,
  source: Lead['source'] = 'reward'): Lead {
  // the NEWEST region draws double weight (2026-07-11): with uniform picks the forests never
  // receded below half of play even three regions in
  const newest = ctx.unlockedRegions[ctx.unlockedRegions.length - 1];
  const region = rng.weighted(ctx.unlockedRegions.map(r => [r, r === newest && ctx.unlockedRegions.length > 1 ? 2 : 1] as [string, number]));
  const rarity = rollRarity(rng, ctx.ghTier);
  const pool = ONE_OFF_ARCHETYPES.filter(a => a !== 'capture' || ctx.hasDungeon);
  const fresh = pool.filter(a => !ctx.recentArchetypes?.includes(a));
  const archetype = rng.pick(fresh.length ? fresh : pool);
  const startChance = rarity === 'rare' ? 0.7 : rarity === 'uncommon' ? 0.3 : 0.08;
  return {
    id: idGen(), rarity, level: rollLevel(rng, ctx, region), region, archetype,
    chainInfo: rng.chance(startChance) ? { kind: 'starts-new' } : { kind: 'none' },
    expiresAtCycle: ctx.cycle + LEAD_TTL, source,
  };
}

/** day-0 bootstrap (FORT §7): the Map room grants a visible starter packet */
export function starterPacket(rng: Rng, cycle: number, idGen: () => string): Lead[] {
  const mk = (archetype: Archetype, rarity: Rarity, level: number): Lead => ({
    id: idGen(), rarity, level, region: 'forests', archetype,
    chainInfo: { kind: 'none' }, expiresAtCycle: cycle + LEAD_TTL * 2, source: 'starter',
  });
  // 🛠 2026-07-18 early-game smoothing (designer: day-0 board of 10 leads = decision paralysis):
  // the packet opens at THREE (two plain jobs + the story hook); the rest of the old packet
  // arrives via starterDripLead, one per cycle — same total, staged choices, still bridges to
  // the first Scouting lodge
  const leads = [
    mk('contract', 'common', 1), mk('rescue', 'common', 2),
  ];
  // one early story hook
  leads.push({ ...mk('investigate', 'uncommon', 2), chainInfo: { kind: 'starts-new' } });
  // a generous learning window: the day-0 packet lingers (leads thereafter are strictly earned)
  for (const l of leads) l.expiresAtCycle = cycle + 40;
  return leads;
}

/** the rest of the old day-0 packet, dripped one per cycle after the Map room stands */
export function starterDripLead(i: number, cycle: number, idGen: () => string): Lead {
  const seq: [Archetype, Rarity, number][] = [
    ['raid', 'common', 1], ['hunt', 'common', 1], ['investigate', 'common', 2], ['raid', 'common', 2],
  ];
  const [archetype, rarity, level] = seq[i % seq.length]!;
  return {
    id: idGen(), rarity, level, region: 'forests', archetype,
    chainInfo: { kind: 'none' }, expiresAtCycle: cycle + 40, source: 'starter',
  };
}
export const STARTER_DRIP_COUNT = 4;

/** a region's standing lead-hunt (renewable faucet — the Scouting lodge's repeatable) */
export function huntLead(region: string, level: number, idGen: () => string): Lead {
  return {
    id: idGen(), rarity: 'common', level, region, archetype: 'lead-hunt',
    chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'hunt',
  };
}

/** the Recruiting post's standing faucet (§19): a repeatable get-a-recruit quest for its region */
export function recruitLead(region: string, level: number, idGen: () => string): Lead {
  return {
    id: idGen(), rarity: 'common', level, region, archetype: 'rescue',
    chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'recruiting',
  };
}

// ---- quests (QUESTS §2–§5) ------------------------------------------------------------

export interface QuestSlot {
  requirement: { kind: 'open' } | { kind: 'must-be'; cardId: string }
    | { kind: 'must-have'; concept: string; minRank?: Rank };   // §9b band floor (#218)
  test: SlotTest;
  groupId?: string;                // finale mutex approach-groups
  filledBy: string | null;
}


export interface ApproachGroup { id: string; label: string; rewardKind: 'recruit' | 'captive' | 'gold' }

export interface Quest {
  id: string;
  leadId: string;
  title: string;
  situation: string;               // AI prose (card)
  job: string;
  level: number;
  rarity: Rarity;
  gravity?: string;                // the card's weight — also drives the report's word budget
  region: string;
  archetype: Archetype;
  chainId?: string;
  beatIndex?: number;              // chains: which beat this is
  isFinale?: boolean;
  approaches?: ApproachGroup[];    // finale only; player picks ONE group
  chosenApproach?: string;
  slots: QuestSlot[];
  rewardSpecs: RewardSpec[];       // generated at BIRTH (one-offs; chains use the bank)
  rewardCards: Card[];             // pre-generated unit/relic cards (in limbo)
  sideLootV?: number;              // chain beats: small engine-set side-loot budget
  liabilityId?: string;            // collector quests: winning settles this liability
  stalls?: number;                 // consecutive cycles part-staffed but unmarched (3 → set aside)
  state: 'open' | 'resolved';
  createdCycle: number;
}

/** slot count N from the archetype (engine, BEFORE reward gen — §8 one-off flow) */
const SLOT_RANGE: Record<Archetype, [number, number]> = {
  raid: [2, 3], capture: [2, 3], rescue: [1, 2], escort: [1, 2],
  investigate: [1, 2], hunt: [1, 2], contract: [1, 1], 'lead-hunt': [1, 1],
};

export function slotCount(rng: Rng, archetype: Archetype, rarity: Rarity): number {
  const [lo, hi] = SLOT_RANGE[archetype];
  let n = rng.range(lo, hi);
  if (rarity === 'rare') n = Math.min(4, n + 1);
  return n;
}

/** ECONOMY §7.2: what a lead's quest is EXPECTED to want, in soldiers — the midpoint of the
 *  archetype's own range, +1 for rare, capped at 4. Mirrors slotCount() exactly; the ±20% value
 *  roll and the roster clamp are not modelled because both wash out. */
export function expectedSlots(archetype: Archetype, rarity: Rarity): number {
  const [lo, hi] = SLOT_RANGE[archetype];
  const mid = (lo + hi) / 2;
  return rarity === 'rare' ? Math.min(4, mid + 1) : mid;
}

/** difficulty roll 🛠 (E-roll weights — impl knob, sim-calibrated later) */
export function rollDifficulty(rng: Rng, rarity: Rarity, ghTier = 1): DifficultyName {
  // 🛠 2026-07-11: a mature fort's veterans strolled commons at 95%+ success — the difficulty
  // MIX now stiffens with the Great Hall (≈ +3%/tier drained from the easy end into the hard)
  const shift = Math.min(0.30, Math.max(0, (ghTier - 2) * 0.03));
  const w: [DifficultyName, number][] = rarity === 'common'
    ? [['trivial', Math.max(0.03, 0.15 - shift)], ['standard', Math.max(0.20, 0.55 - shift)], ['hard', 0.30 + shift], ['brutal', shift]]
    : rarity === 'uncommon'
      ? [['standard', Math.max(0.10, 0.40 - shift)], ['hard', 0.45], ['brutal', 0.15 + shift]]
      : [['standard', Math.max(0.05, 0.15 - shift)], ['hard', 0.45 - shift / 2], ['brutal', 0.30 + shift], ['extreme', 0.10 + shift / 2]];
  return rng.weighted(w);
}

/** one-off reward value: V = V_base(level) × rarity × N × random split (§8 step 3) */
export function oneOffValue(rng: Rng, level: number, rarity: Rarity, n: number): number {
  return Math.round(vBase(level) * RARITY_MULT[rarity] * n * rng.float(0.8, 1.2));
}

/** ECONOMY §7.2 — what the player reads on a lead's face. The engine holds the exact number;
 *  the player gets a BAND, which is §8's architecture with the audience swapped.
 *
 *  Banded as a RATIO against the quest this lead will make, never an absolute: 200 gold is a
 *  windfall at level 1 and pocket change at level 8, and no single threshold describes both.
 *  Derived at call time, never stored, so retuning re-bands every lead already on the board.
 *  🛠 thresholds are a knob — set from 11,251 simulated grants (≈52/29/13/6 across the bands). */
export const LEAD_BANDS = [0.4, 1.0, 2.5];   // 🛠
export const LEAD_BAND_WORDS = ['a few coins more', 'a purse', 'a chest', 'a fortune'];
export function leadBand(lead: Lead): { band: 0 | 1 | 2 | 3 | 4; label: string; stars: string } {
  const bonus = lead.bonus ?? 0;
  if (bonus <= 0) return { band: 0, label: '', stars: '' };
  const baseV = vBase(lead.level) * RARITY_MULT[lead.rarity] * expectedSlots(lead.archetype, lead.rarity);
  const r = bonus / Math.max(1, baseV);
  const i = r <= LEAD_BANDS[0]! ? 0 : r <= LEAD_BANDS[1]! ? 1 : r <= LEAD_BANDS[2]! ? 2 : 3;
  const band = (i + 1) as 1 | 2 | 3 | 4;
  return { band, label: LEAD_BAND_WORDS[i]!, stars: '★'.repeat(band) + '☆'.repeat(4 - band) };
}

/** materialize a reward spec into actual cards (engine — names engine-rolled, §4b) */
export function materializeReward(rng: Rng, spec: RewardSpec, contentLevel: number, region: string,
  genExtras?: { excludeConcepts?: string[]; maxSkills?: number; gender?: string; presetName?: string; race?: string }): Card[] {
  switch (spec.kind) {
    case 'gold': {
      const g = mintStackable('gold', Math.max(1, Math.round(spec.value)));
      return [g];
    }
    case 'captive': case 'recruit': {
      const races = Object.entries(REGION[region]!.poolWeights) as [string, number][];   // pool bias (region), not a hand list
      const card = generateCard(rng, {
        domain: 'character', targetV: spec.value, contentLevel,
        required: spec.required, race: genExtras?.race ?? rng.weighted(races),
        gender: genExtras?.gender,
        role: spec.kind === 'captive' ? 'captive' : 'npc',
        level: Math.max(1, contentLevel - (spec.kind === 'recruit' ? 1 : 0)),
        jackpotChance: 0.08,   // 🛠 ECONOMY §4 jackpot-with-catch lottery
        excludeConcepts: genExtras?.excludeConcepts, maxSkills: genExtras?.maxSkills,
      });
      const race = card.tags.find(t => CONCEPT[t.concept]?.group === 'race')?.concept ?? 'human';
      // gender is rolled BEFORE the name so the name can never contradict the tag
      let gender = card.tags.find(t => CONCEPT[t.concept]?.group === 'gender')?.concept;
      if (!gender) { gender = genExtras?.gender ?? rng.pick(['male', 'female']); card.tags.push(T(gender)) }
      card.name = genExtras?.presetName ?? rollName(rng, race, gender);
      return [card];
    }
    case 'relic': {
      const card = generateCard(rng, { domain: 'relic', targetV: spec.value, contentLevel, required: spec.required, jackpotChance: 0.08 });   // 🛠 §4 jackpot-with-catch
      const form = card.tags.find(t => CONCEPT[t.concept]?.group === 'form');
      card.name = rollRelicName(rng, form?.concept ?? 'curio');
      return [card];
    }
    case 'lead':
      return []; // the lead grant is minted by the caller (needs lead ctx)
  }
}

// ---- delivery (ECONOMY §5) ---------------------------------------------------------------

export interface Delivery {
  cards: Card[];               // what actually lands
  goldDelta: number;           // convenience: gold among cards
  liability: Card | null;      // partial: the attached negative stackable
  leadGrants: number[];        // ECONOMY §7.1: the BONUS each granted lead carries (was a bare count — the value was computed and thrown away)
  forfeited: Card[];           // what was lost (failure)
}

/** compute delivery BEFORE the AI narrates (§8 solidity rule b) */
export function computeDelivery(rng: Rng, quest: Quest, outcome: Outcome): Delivery {
  const specs = quest.rewardSpecs;
  const V = specs.reduce((s, r) => s + r.value, 0);
  const leadGrants = specs.filter(s => s.kind === 'lead').map(s => Math.round(s.value));
  if (outcome === 'success') {
    return { cards: [...quest.rewardCards, ...goldCards(specs)], goldDelta: goldOf(specs), liability: null, leadGrants, forfeited: [] };
  }
  if (outcome === 'failure') {
    return { cards: [], goldDelta: 0, liability: null, leadGrants: [], forfeited: quest.rewardCards };
  }
  // partial = half: keep the unit + a liability sized to net V/2, else V/2 gold (KEEP≈0.4)
  const unit = quest.rewardCards.find(c => c.character) ?? quest.rewardCards[0] ?? null;
  if (unit && unit.value >= 0.4 * V) {
    const liabilitySize = Math.max(0, Math.round(unit.value - V / 2));
    const liability = liabilitySize > 0
      ? mintStackable(rng.chance(0.5) ? 'evidence' : 'mess', liabilitySize)
      : null;
    return { cards: [unit], goldDelta: 0, liability, leadGrants: [], forfeited: quest.rewardCards.filter(c => c !== unit) };
  }
  const half = mintStackable('gold', Math.max(1, Math.round(V / 2)));
  return { cards: [half], goldDelta: half.qty!, liability: null, leadGrants: [], forfeited: quest.rewardCards };
}

function goldOf(specs: RewardSpec[]): number {
  return specs.filter(s => s.kind === 'gold').reduce((s, r) => s + Math.round(r.value), 0);
}
function goldCards(specs: RewardSpec[]): Card[] {
  const g = goldOf(specs);
  return g > 0 ? [mintStackable('gold', g)] : [];
}

// ---- liability collectors (§10 impl note) ---------------------------------------------------

export const LIABILITY_GRACE = 8;   // cycles before a liability may bite
export const LIABILITY_TRIGGER_P = 0.12;

/** an unresolved liability eventually spawns its hostile collection lead */
export function liabilityTriggers(rng: Rng, ageCycles: number): boolean {
  return ageCycles > LIABILITY_GRACE && rng.chance(LIABILITY_TRIGGER_P);
}

// ---- ask defaults (mock-side; the AI provider authors the real ask) --------------------------

const ARCHETYPE_TESTS: Record<Archetype, { attrs: Attribute[]; favored: string[]; clashing: string[] }[]> = {
  raid: [{ attrs: ['str'], favored: ['melee', 'intimidation'], clashing: [] }, { attrs: ['dex'], favored: ['ranged', 'roguery'], clashing: [] }],
  capture: [{ attrs: ['str'], favored: ['melee', 'intimidation'], clashing: ['hotheaded'] }, { attrs: ['dex'], favored: ['roguery', 'nature'], clashing: [] }],
  rescue: [{ attrs: ['dex'], favored: ['roguery', 'nature'], clashing: [] }, { attrs: ['cha'], favored: ['social', 'heal'], clashing: [] }],
  escort: [{ attrs: ['con'], favored: ['melee', 'nature'], clashing: [] }, { attrs: ['cha'], favored: ['social', 'leadership'], clashing: [] }],
  investigate: [{ attrs: ['int'], favored: ['lore', 'roguery'], clashing: ['hotheaded'] }, { attrs: ['cha'], favored: ['social'], clashing: [] }],
  hunt: [{ attrs: ['dex'], favored: ['nature', 'ranged'], clashing: [] }, { attrs: ['con'], favored: ['nature', 'melee'], clashing: [] }],
  contract: [{ attrs: ['cha'], favored: ['social', 'performance'], clashing: [] }, { attrs: ['int'], favored: ['lore', 'craft'], clashing: [] }],
  'lead-hunt': [{ attrs: ['dex'], favored: ['nature', 'roguery'], clashing: [] }, { attrs: ['cha'], favored: ['social'], clashing: [] }],
};

export function defaultAsk(rng: Rng, archetype: Archetype): { attrs: Attribute[]; favored: string[]; clashing: string[] } {
  const options = ARCHETYPE_TESTS[archetype];
  const pick = rng.pick(options);
  // occasional multi-stat test (§10: pooled per-unit, bar ×(n+1)/2)
  if (rng.chance(0.15)) {
    const other = rng.pick((['str', 'dex', 'int', 'cha', 'con'] as Attribute[]).filter(a => !pick.attrs.includes(a)));
    return { ...pick, attrs: [...pick.attrs, other] };
  }
  return pick;
}

export { tierOf, HELD };
