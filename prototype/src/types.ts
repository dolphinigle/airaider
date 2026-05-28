// Core domain types — see docs/CANONICAL_DESIGN.md §2 for design rationale.

export type Attribute = 'physical' | 'agility' | 'intelligence' | 'charisma' | 'willpower';

export const ATTRIBUTES: readonly Attribute[] = [
  'physical', 'agility', 'intelligence', 'charisma', 'willpower',
] as const;

/** CANONICAL §2.4: mundane 1-7 scale. Rarity vocabulary RESERVED FOR TAGS ONLY. */
export type AttributeScore = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ATTRIBUTE_LABELS: Record<AttributeScore, string> = {
  1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Above Average',
  5: 'Strong', 6: 'Exceptional', 7: 'Peerless',
};

export type AttributeBlock = Record<Attribute, AttributeScore>;

// --- Tag system (CANONICAL §2.5/§2.6) ---

export type TagRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
/** T5 weakest (most common) → T1 strongest (rarest roll quality). */
export type TagTier = 5 | 4 | 3 | 2 | 1;

export interface Tag {
  id: string;
  category: string;
  rarity: TagRarity;
  tier: TagTier;
  /** If set, a merc can carry only one tag per mutex group. CANONICAL §2.8. */
  mutexGroup?: string;
  /** Documentary attribute bias; engine doesn't apply in M0 — values are pre-baked into merc rolls. */
  attrBias?: Partial<Record<Attribute, number>>;
  label: string;
}

// --- Merc ---

export interface Merc {
  id: string;
  name: string;
  attrs: AttributeBlock;
  tags: Tag[];
  /** Veterancy (DD-style); CANONICAL §2.2. 0-5 in M0. */
  veterancy: number;
  /** CANONICAL §2.7: flat wage rule. */
  wage: number;
  /** Simple 0-3 HP for prototype. Permadeath math is OPEN (CANONICAL §7 #2/#6). */
  hp: number;
}

// --- Scenario ---

export type ScenarioArchetype = 'contract' | 'recruit' | 'captive' | 'build' | 'tavern';

export interface ScenarioSlot {
  id: string;
  description: string;
  preferredAttr?: Attribute;
  /** Tag IDs that synergize; each match adds +1 coin in M0. */
  preferredTags?: string[];
}

export interface Scenario {
  id: string;
  archetype: ScenarioArchetype;
  title: string;
  /** AI-authored narrative goal, NOT a numeric threshold. CANONICAL §2.1. */
  target: string;
  slots: ScenarioSlot[];
  partySize: { min: number; max: number };
  /** Sultan-coin budget cap before party-size bonus. */
  coinBudget: number;
}

// --- Sultan-coin resolution (CANONICAL §2.1) ---

export type CoinFace = 'heads' | 'tails';

export interface CoinRoll {
  faces: CoinFace[];
  heads: number;
  tails: number;
}

export type OutcomeBand =
  | 'catastrophic'
  | 'unfavorable'
  | 'favorable'
  | 'catastrophic-favorable';

export interface BandResult {
  band: OutcomeBand;
  reason: string;
}
