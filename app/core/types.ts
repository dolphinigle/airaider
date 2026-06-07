// The domain model (docs/CARDS.md, GAME_STATE.md, QUESTS.md, FORT.md).
// Everything owned is a Card; `class` distinguishes types; only `character`
// touches the dice. Slottables (quests, rooms) hold cards; cards never hold cards.

import type { Rarity } from './tags.js';
export type { Rarity };

// ---- tags as carried on a card ----------------------------------------------
export interface TagInstance {
  id: string;   // canonical tag id, e.g. "skill:weapon"
  tier: number; // 1 (strongest/rarest) .. 5 (weakest/common); flat tags use 3
}

// ---- attributes / talents (characters only) ---------------------------------
export const ATTRIBUTES = ['physical', 'agility', 'intelligence', 'charisma', 'perception'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Attributes = Record<Attribute, number>;
export type Talents = Record<Attribute, number>; // growth rate per level (e.g. 0.5..2.0)

export type CardClass = 'character' | 'equipment' | 'furniture' | 'consumable' | 'gold' | 'liability';
export type CharacterRole = 'merc' | 'captive' | 'npc' | 'dead';

// ---- the Card (discriminated by `class`) ------------------------------------
export interface BaseCard {
  id: string;
  class: CardClass;
  name: string;
  tags: TagInstance[];
  value: number;         // gold-denominated, signed
  location: string;      // cell idx / 'roster' / 'quest:<id>' / 'limbo'
  createdCycle: number;
}

export interface CharacterCard extends BaseCard {
  class: 'character';
  role: CharacterRole;
  attrs: Attributes;     // effective attrs at current level
  base: Attributes;      // un-levelled base attrs (re-leveling source)
  talents: Talents;
  level: number;
  xp: number;
  who?: string;          // AI one-liner
  backstory?: string;    // AI paragraph
  quirks: string[];      // AI-generated
  chainIds: string[];    // chains this character appears in (living dossier)
  injuries: TagInstance[]; // temporary negative tags (clash in the roll)
}

export interface ItemCard extends BaseCard {
  class: 'equipment' | 'furniture' | 'consumable';
  ilvl: number;
  qty: number;           // stack count (consumables)
}

export interface GoldCard extends BaseCard {
  class: 'gold';
  qty: number;
}

export interface LiabilityCard extends BaseCard {
  class: 'liability';
  kind: 'evidence' | 'mess' | 'debt';
}

export type Card = CharacterCard | ItemCard | GoldCard | LiabilityCard;

export const isCharacter = (c: Card): c is CharacterCard => c.class === 'character';

// ---- leads & quests ---------------------------------------------------------
export type ChainInfo =
  | { kind: 'none' }
  | { kind: 'starts-new' }
  | { kind: 'continues'; chainId: string }
  | { kind: 'personal'; mercId: string };   // a newly-joined merc's main chain (about THEM)

export type Archetype = 'raid' | 'capture' | 'rescue' | 'escort' | 'investigate' | 'hunt' | 'contract' | 'scout';

export interface Lead {
  id: string;
  rarity: Rarity;
  level: number;
  location: string;
  archetype: Archetype;
  chain: ChainInfo;
  title?: string;        // cached chain title/hook (continuation leads only)
  hook?: string;
  expiresCycle: number;
  sequelOf?: string;     // chain id this lead is a sequel to (finale aftermath)
}

export type Outcome = 'success' | 'partial' | 'failure';

export interface QuestSlot {
  index: number;
  requirement: { kind: 'open' } | { kind: 'must-be'; cardId: string } | { kind: 'must-have'; tag: string };
  tested: { attribute: Attribute; favored: string[]; clashing: string[] };
  filledBy?: string;     // card id
  groupId?: string;      // approach-group (finale branches)
}

export interface ApproachGroup {
  id: string;
  label: string;
  rewardKind: RewardKind;
  threshold: number;
  slotIndices: number[];
}

export type RewardKind = 'gold' | 'captive' | 'recruit' | 'item' | 'lead' | 'tag-stamp';

// a generated reward bundle, fixed at quest birth
export interface RewardBundle {
  targetValue: number;
  cards: Card[];         // positive + negative cards (pre-generated, role-agnostic)
  kindHint: RewardKind;
}

export interface Quest {
  id: string;
  leadId: string;
  rarity: Rarity;
  level: number;
  location: string;
  archetype: Archetype;
  chainId?: string;
  beat?: number;
  finale?: boolean;
  // AI-authored card (STORY_ENGINE shape)
  title: string;
  situation: string;
  job: string;
  stakes: string;        // the beat's PROPOSED reveal (a suggestion; resolution decides what's actually learned)
  proposedLoot?: string; // the beat's PROPOSED side-loot flavour (resolution decides the actual haul)
  immediate?: boolean;   // chain beat: the AI flagged tangible loot NOW (engine pays a share now, banks the rest)
  // the ask
  slots: QuestSlot[];
  threshold: number;     // single-group quests; finale uses groups
  groups?: ApproachGroup[];
  // economy
  reward: RewardBundle;
  risky: boolean;        // failure can carry a punishment
  // resolution (filled at end-day)
  outcome?: Outcome;
  beforeText?: string;
  afterText?: string;
}

// ---- chains -----------------------------------------------------------------
export interface Chain {
  id: string;
  title: string;
  hook: string;
  bible: string;             // settled truth (AI)
  direction: string;         // vague climax direction
  focalCardIds: string[];    // 1-2 generated focal characters
  rarity: Rarity;
  level: number;
  expectedBeats: number;
  beatsResolved: number;
  mercCyclesSpent: number;   // climax gate counter
  climaxTarget: number;
  state: 'live' | 'finale-ready' | 'done';
  log: string[];             // beat summaries fed back to the AI
  personal?: boolean;        // a main chain ABOUT an existing merc (focal = that merc)
  seedKernel?: string;       // the random dramatic kernel this saga was built around (for variety + debug)
  introducedNames?: string[];// cast names the PLAYER has already met — so beats orient a name only ONCE
  arc?: string[];            // the genesis's ROUGH arc guide — each beat realizes the matching step
  arcProgress?: number;      // DEPRECATED (success-gating removed); kept for scratch-harness typecheck
  lastFailed?: boolean;      // the previous beat failed → the next beat opens from the fallout (consequence)
  // ---- reward bank (REWARD_BANK.md) ----
  choiceSteps?: number[];    // bible-proposed arc steps (1-based, may incl. the finale) that branch
  choiceBudget?: number;     // engine-rolled cap: at most this many of choiceSteps are honored
  // (finale ENDING options are generated by the quest-writer at finale time — chainBeat, kinded)
  bank?: number;             // accrued merc-day value across beats; crystallized into the focal+gold at the finale
  failBudget?: number;       // allowed MIDDLE-beat failures (rarity-scaled; harder = fewer)
  failsSpent?: number;       // middle-beat failures so far
  lastChance?: boolean;      // failBudget exceeded → the next beat is forced to a desperate finale
}

// ---- fort (FORT.md) ---------------------------------------------------------
export interface FortCell {
  idx: number;
  floor: number;   // 0 = entrance, + up, - down
  col: number;     // 0 = start, + right, - left
  roomId?: string;
}

export interface Room {
  id: string;
  cellIdx: number;
  type: string;            // RoomType key
  displayCardIds: string[];
  ownerMercId?: string;    // bedrooms
}

// ---- player-facing state ----------------------------------------------------
export interface GameState {
  seed: string;
  cycle: number;
  phase: 'fort' | 'resolution';
  gold: number;
  cards: Record<string, Card>;     // the one collection
  cells: FortCell[];
  rooms: Record<string, Room>;
  leads: Lead[];
  quests: Record<string, Quest>;   // active (pursued) quests this cycle
  chains: Record<string, Chain>;
  unlockedLocations: string[];
  globalPrestige: number;
  pendingMainChains: string[];   // merc ids queued to get a personal-chain lead next restock
  nextId: number;
  log: string[];
}
