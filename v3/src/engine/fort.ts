// The Fort — FORT.md + §18/§19/§20. Two room species (pure gate vs comfort room);
// comfort = ONE per-room number → ONE typed benefit; global prestige = Σ theme comfort;
// the Great Hall tier ladder is the master clock.

import type { Rng } from './rng.js';
import type { Card } from './cards.js';
import { hasTag } from './tags.js';
import { fillScore, acceptsCard, type TagQuery, type Accepts, ACCEPTS } from './overlap.js';
import { REGIONS } from './regions.js';

// ---- room type catalog (§19 PROTO classification) --------------------------------------

export type RoomSpecies = 'gate' | 'comfort' | 'capacity' | 'landmark';
export type BenefitKind =
  | 'prestige'          // theme rooms (exclusively) — the master-clock fuel
  | 'cap'               // bedroom → owner's level cap
  | 'heal' | 'prices' | 'ransom' | 'break' | 'leads' | 'odds' | 'payheal' // functional 🛠 benefitCurves
  | 'none';
export type RoomArchetype = 'minor' | 'std' | 'grand';

export interface RoomType {
  id: string;
  name: string;
  species: RoomSpecies;
  benefit: BenefitKind;
  archetype?: RoomArchetype;        // comfort rooms only
  ghTier: number;               // Great Hall tier needed to build
  unlocks?: string;             // what capability a gate opens (menu key)
  region?: string;              // region rooms (scouting lodge / recruiting post / endgame)
  roomKind?: 'scouting' | 'recruiting' | 'endgame';  // region-room role (no id-prefix matching)
  multiBuild?: boolean;         // buildable more than once (bedrooms, cells)
  cellSlots?: number;           // capacity rooms: captives per cell room
  themeHints?: string[];        // default wanted-tag hints per concrete type (pre-style)
  mates?: string[];             // adjacency mate-pairs (×1.2)
  smallPrestige?: boolean;      // Hospital exception (§18)
}

const RT = (id: string, name: string, t: Partial<RoomType> & Pick<RoomType, 'species' | 'benefit' | 'ghTier'>): RoomType =>
  ({ id, name, ...t });

export const ROOM_TYPES: RoomType[] = [
  // core gates
  RT('map-room', 'Map room', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'quests' }),
  RT('lead-room', 'Lead room', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'leads' }),
  RT('mess-hall', 'Mess hall', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'roster' }),
  RT('storage', 'Storage', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'items' }),
  // 🛠 2026-07-10: Tavern T2→T1 — the T2 prestige gate was ~99% of why no 30-cycle campaign ever
  // hired (12/12 sim seeds): the doc's Tavern-at-T2 sat on a 2000-cycle pacing model (FORT §
  // unlock table is flagged impl-calibration). With T1: Tavern ~c12, roster 4 by c20, stalls 0.
  RT('tavern', 'Tavern', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'recruits' }),
  RT('dungeon', 'Dungeon', { species: 'gate', benefit: 'none', ghTier: 2, unlocks: 'captives' }),
  RT('holding-cell', 'Holding cell', { species: 'gate', benefit: 'none', ghTier: 2, unlocks: 'staging' }),
  RT('library', 'Library', { species: 'gate', benefit: 'none', ghTier: 3, unlocks: 'lore' }),
  RT('chronicle', 'Chronicle room', { species: 'gate', benefit: 'none', ghTier: 4, unlocks: 'chronicle' }),
  // capacity
  RT('dungeon-cell', 'Dungeon cell', { species: 'capacity', benefit: 'none', ghTier: 2, cellSlots: 3, multiBuild: true }),
  // housing
  RT('bedroom', 'Bedroom', { species: 'comfort', benefit: 'cap', archetype: 'std', ghTier: 1, themeHints: [], multiBuild: true }),
  RT('bunkroom', 'Bunkroom', { species: 'gate', benefit: 'none', ghTier: 1, unlocks: 'bunks' }),
  // functional comfort
  RT('infirmary', 'Infirmary', { species: 'comfort', benefit: 'heal', archetype: 'minor', ghTier: 1, themeHints: ['heal', 'furniture', 'clothes'] }),
  RT('hospital', 'Hospital', { species: 'comfort', benefit: 'payheal', archetype: 'std', ghTier: 5, smallPrestige: true, themeHints: ['heal', 'clever'] }),
  RT('market', 'Market', { species: 'comfort', benefit: 'prices', archetype: 'minor', ghTier: 3, themeHints: ['merchant', 'social'] }),
  RT('ransom-office', 'Ransom office', { species: 'comfort', benefit: 'ransom', archetype: 'minor', ghTier: 3, themeHints: ['merchant', 'intimidation'] }),
  RT('torture-chamber', 'Torture chamber', { species: 'comfort', benefit: 'break', archetype: 'minor', ghTier: 2, themeHints: ['intimidation', 'roguery'] }),
  RT('interrogation', 'Interrogation room', { species: 'comfort', benefit: 'leads', archetype: 'minor', ghTier: 4, themeHints: ['intimidation', 'social'] }),
  RT('oracle', 'Oracle', { species: 'comfort', benefit: 'odds', archetype: 'minor', ghTier: 4, themeHints: ['mystic', 'lore'] }),
  // the Great Hall (tier spine — handled specially, no slots)
  RT('great-hall', 'Great Hall', { species: 'landmark', benefit: 'none', ghTier: 1 }),
  // region rooms (scouting lodge opens the region; recruiting post opens recruit quests)
  ...REGIONS.filter(r => r.id !== 'outskirts').flatMap(r => [
    RT(`scouting-${r.id}`, `Scouting lodge (${r.name})`, { species: 'gate', benefit: 'none', ghTier: r.ghTier, region: r.id, unlocks: 'region', roomKind: 'scouting' }),
    RT(`recruiting-${r.id}`, `Recruiting post (${r.name})`, { species: 'gate', benefit: 'none', ghTier: r.ghTier, region: r.id, unlocks: 'recruit-quests', roomKind: 'recruiting' }),
    RT(`endgame-${r.id}`, `Endgame: ${r.name} key`, { species: 'landmark', benefit: 'none', ghTier: 13, region: r.id, roomKind: 'endgame' }),
  ]),
  // theme rooms (prestige family — §19 tier-1 set + a few tier-2 for later acts)
  RT('dining-hall', 'Dining hall', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 1, themeHints: ['food', 'gregarious', 'furniture', 'decoration'], mates: ['kitchen'] }),
  RT('kitchen', 'Kitchen', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 1, themeHints: ['food', 'furniture', 'curio'], mates: ['dining-hall'] }),
  RT('garden', 'Garden', { species: 'comfort', benefit: 'prestige', archetype: 'minor', ghTier: 1, themeHints: ['nature', 'decoration', 'curio'] }),
  RT('smithy', 'Smithy', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 3, themeHints: ['craft', 'melee-weapon', 'armor'], mates: ['hall-of-arms'] }),
  RT('gallery', 'Gallery', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 2, themeHints: ['decoration', 'r-beautiful', 'performance'] }),
  RT('trophy-room', 'Trophy room', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 2, themeHints: ['curio', 'famous', 'melee-weapon', 'intimidation'] }),
  RT('hall-of-arms', 'Hall of arms', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 3, themeHints: ['melee-weapon', 'armor'], mates: ['smithy'] }),
  RT('shrine', 'Shrine', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 3, themeHints: ['priest', 'decoration', 'document', 'ancient'] }),
  RT('music-hall', 'Music hall', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 4, themeHints: ['performance', 'entertainer', 'curio', 'r-beautiful'] }),
  RT('menagerie', 'Menagerie', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 4, themeHints: ['nature', 'curio', 'exotic'] }),
  RT('treasure-vault', 'Treasure vault', { species: 'comfort', benefit: 'prestige', archetype: 'grand', ghTier: 5, themeHints: ['curio', 'accessory', 'famous'] }),
  RT('curiosity-cabinet', 'Curiosity cabinet', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 5, themeHints: ['curio', 'document'] }),
  RT('crypt', 'Crypt', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 5, themeHints: ['ancient', 'priest'] }),
  RT('gambling-den', 'Gambling den', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 6, themeHints: ['roguery', 'greedy'] }),
  RT('bathhouse', 'Bathhouse', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 6, themeHints: ['beautiful', 'decoration', 'clothes'] }),
  RT('brewery', 'Brewery', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 6, themeHints: ['food', 'craft'], mates: ['feast-hall'] }),
  RT('stables', 'Stables', { species: 'comfort', benefit: 'prestige', archetype: 'std', ghTier: 6, themeHints: ['nature', 'hunter', 'ranged-weapon'] }),
  RT('feast-hall', 'Feast hall', { species: 'comfort', benefit: 'prestige', archetype: 'grand', ghTier: 6, themeHints: ['food', 'gregarious', 'famous'], mates: ['brewery'] }),
];

export const ROOM_TYPE: Record<string, RoomType> = Object.fromEntries(ROOM_TYPES.map(r => [r.id, r]));

// ---- Great Hall thresholds & pacing constants (§20.2) ------------------------------------

/** prestige needed to raise the GH TO tier t. 🛠 recalibrated 2026-07-11 (designer ruling:
 *  §20.2's ~130-190 cycles/tier was "way too grindy" for the prototype) — TWO-PHASE curve:
 *  phase 1 (T2-T10) ≈ one tier per 10-12 cycles (T4/City ≈ c34-40, T10 ≈ c95-110);
 *  phase 2 knee AT T10 — T11-T15 each take several times a phase-1 tier (endgame grind
 *  by design). Fitted to the measured mock-sim prestige curve (scripts/_tiersim.ts),
 *  each phase-1 step ≤ ~85% of the P the previous tier's slot depth can produce. */
export const GH_THRESHOLDS: Record<number, number> = {
  2: 2, 3: 7, 4: 16, 5: 30, 6: 42, 7: 54, 8: 68, 9: 82, 10: 96,
  11: 200, 12: 320, 13: 460, 14: 620, 15: 800,
};

/** slot-depth gate: max slots (= max upgrades) per room by GH tier (§20.1) */
export function maxSlotsAtTier(ghTier: number): number {
  if (ghTier <= 2) return 1;
  if (ghTier <= 5) return 2;
  if (ghTier <= 8) return 3;
  if (ghTier <= 11) return 4;
  if (ghTier <= 13) return 5;
  return 6;
}

// costs (§20.1/FORT §6): build 120·1.32^(T−1) at the room's unlock tier
export function buildCost(type: RoomType): number {
  const base = 120 * Math.pow(1.32, type.ghTier - 1);
  const mult = type.archetype === 'grand' ? 1.75 : type.archetype === 'minor' ? 0.8 : 1;
  return Math.round(base * mult);
}
export function upgradeCost(type: RoomType, currentSlots: number): number {
  return Math.round(buildCost(type) * 0.7 * Math.pow(1.25, currentSlots));
}
export function renovateCost(type: RoomType): number { return Math.round(buildCost(type) * 0.25) }
export function ghUpgradeCost(toTier: number): number {
  // 🛠 2026-07-11 two-phase (matches the threshold knee): phase-1 tiers stay affordable — the
  // old 1.32 tail (T8-10 = 1.3-2.3k) stalled half the calibration seeds 10-27 cycles on GOLD
  // while prestige stood ready; phase-2 tiers are the endgame's long-haul money sink (sims
  // banked 14-36k unused — gold finally has somewhere to go).
  if (toTier <= 10) return Math.round(120 * Math.pow(1.18, toTier - 1) * 1.6);
  const t10 = 120 * Math.pow(1.18, 9) * 1.6;
  return Math.round(t10 * Math.pow(2.2, toTier - 10));
}
export function endgameCost(): number { return Math.round(ghUpgradeCost(14) * 2) }
/** expansion is PURE GOLD and stays a minor sink (FORT §1) — the ~60-room fort the
 *  §20 sim assumes must remain affordable (🛠 was 1.25^n: 50k at 40 cells — a wall) */
export function excavateCost(nCells: number): number {
  return Math.round(45 * Math.pow(1.09, Math.max(0, nCells - 9)));
}

// ---- comfort (§20 formula) -----------------------------------------------------------------

export const COMFORT_K = 20;
const BANDS: Record<RoomArchetype, [number, number]> = { minor: [1, 30], std: [2, 60], grand: [4, 120] };
/** bedroom band: max ≈45 (→ cap ~43), endgame lift +10 (§20) */
const BEDROOM_BAND: [number, number] = [1, 45];
export const ENDGAME_BAND_LIFT = 10;

export interface Room {
  id: string;
  type: string;
  cell: { floor: number; col: number };
  slots: (string | null)[];      // card ids; length = upgrades bought (starts at ZERO — §18)
  wants: TagQuery[];             // theme wants (AI-rolled once per renovation; comfort rooms)
  style: string | null;          // player-applied style
  ownerId?: string;              // bedroom: the bound owner merc (or 'you')
}

export interface FortState {
  rooms: Room[];
  cells: { floor: number; col: number }[];   // excavated, possibly empty
  ghTier: number;
  endgameKeys: string[];                     // regions whose endgame building is built
}

export function roomBand(room: Room): [number, number] {
  const t = ROOM_TYPE[room.type]!;
  if (t.benefit === 'cap') return BEDROOM_BAND;
  return BANDS[t.archetype ?? 'std'];
}

function adjacencyMult(fort: FortState, room: Room): number {
  const t = ROOM_TYPE[room.type]!;
  if (!t.mates?.length) return 1;
  const near = fort.rooms.filter(r =>
    Math.abs(r.cell.floor - room.cell.floor) + Math.abs(r.cell.col - room.cell.col) === 1);
  return near.some(r => t.mates!.includes(r.type)) ? 1.2 : 1;
}

/**
 * comfort = min + (max−min)(1−e^(−raw/k)), raw = adjMult × Σ fillScore(card, wants).
 * A bedroom's wants BIND to the owner's tags (the owner slot is not scored — CARDS §2).
 * Live-computed, never stored.
 */
export function roomComfort(fort: FortState, room: Room, cardById: (id: string) => Card | undefined,
  endgameLift = 0): number {
  const t = ROOM_TYPE[room.type]!;
  if (t.species !== 'comfort') return 0;
  let raw = 0;
  for (const cid of room.slots) {
    if (!cid) continue;
    const card = cardById(cid);
    if (!card) continue;
    raw += fillScore(card.tags, room.wants);
  }
  raw *= adjacencyMult(fort, room);
  let [min, max] = roomBand(room);
  if (t.benefit === 'cap' && endgameLift > 0) max += endgameLift;
  if (room.slots.every(s => s === null)) return 0;   // an unstaffed room gives nothing
  return min + (max - min) * (1 - Math.exp(-Math.max(0, raw) / COMFORT_K));
}

/** GLOBAL PRESTIGE = Σ theme-room comfort (+ small Hospital share) — GAME_STATE §3 */
export function globalPrestige(fort: FortState, cardById: (id: string) => Card | undefined): number {
  let p = 0;
  for (const room of fort.rooms) {
    const t = ROOM_TYPE[room.type]!;
    if (t.benefit === 'prestige') p += roomComfort(fort, room, cardById);
    else if (t.smallPrestige) p += 0.25 * roomComfort(fort, room, cardById);
  }
  return p;
}

/** a merc's level cap from their own bedroom (GAME_STATE §4); bedroom-less → low floor */
export const BUNK_CAP_FLOOR = 6;
export function capFromComfort(comfort: number): number {
  return Math.floor(3 + 0.9 * comfort);
}

// ---- slot legality --------------------------------------------------------------------------

/** what a slot accepts by room species (§18: room slots are GENERIC) */
export function slotAccepts(room: Room): Accepts {
  const t = ROOM_TYPE[room.type]!;
  if (t.species === 'capacity') return ACCEPTS.captive;      // cells: captives only (raw ok)
  return ACCEPTS.relicOrObedient;                            // items OR obedient captives
}

export function canSlot(room: Room, card: Card): boolean {
  const t = ROOM_TYPE[room.type]!;
  if (t.species === 'capacity') {
    return card.character?.role === 'captive';
  }
  // mercs NEVER staff rooms (§18)
  if (card.character && card.character.role !== 'captive') return false;
  if (card.character && card.character.role === 'captive' && !hasTag(card.tags, 'obedient')) return false;
  return acceptsCard(slotAccepts(room), card.tags);
}

// ---- functional benefitCurves 🛠 -------------------------------------------------------------

/** torture chamber: break duration in cycles, ~5 → 2 with comfort (§21.4) */
export function breakDuration(comfort: number): number {
  return Math.max(2, Math.round(5 - 3 * (1 - Math.exp(-comfort / 15))));
}
/** market: sell rate 0.5 → 0.7; buy discount */
export function marketSellRate(comfort: number): number {
  return 0.5 + 0.2 * (1 - Math.exp(-comfort / 15));
}
/** ransom office: 0.6 → 0.8 × mark */
export function ransomRate(comfort: number): number {
  return 0.6 + 0.2 * (1 - Math.exp(-comfort / 15));
}
/** oracle: odds display precision — 0 none, 1 coarse bands, 2 exact % */
export function oraclePrecision(comfort: number | null): 0 | 1 | 2 {
  if (comfort === null) return 0;
  return comfort >= 15 ? 2 : 1;
}

// ---- theme rolling (mock-side default; the AI provider overrides — §18) ------------------------

/** deterministic default wants from a room's concrete type + style hints */
export function defaultWants(type: RoomType, style: string | null): TagQuery[] {
  const wants: TagQuery[] = (type.themeHints ?? []).map(h => ({ match: h }));
  if (style) wants.push({ match: styleConcept(style) });
  return wants;
}
function styleConcept(style: string): string {
  const map: Record<string, string> = {
    elven: 'elven-style', wolfkin: 'wolfkin-style', lizardkin: 'lizardkin-style',
    ancient: 'ancient', exotic: 'exotic', human: 'human-style',
  };
  return map[style] ?? style;
}

// ---- fort bootstrap (FORT §7 day-0) ------------------------------------------------------------

export function newFort(): FortState {
  const cells: { floor: number; col: number }[] = [];
  for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) cells.push({ floor: f, col: c });
  return {
    rooms: [
      // your bedroom pre-built day 0 (§19); Bunkroom starter housing; Great Hall T1
      { id: 'room-gh', type: 'great-hall', cell: { floor: 0, col: 1 }, slots: [], wants: [], style: null },
      { id: 'room-mybed', type: 'bedroom', cell: { floor: 0, col: 0 }, slots: [], wants: [], style: null, ownerId: 'you' },
      { id: 'room-bunk', type: 'bunkroom', cell: { floor: 0, col: 2 }, slots: [], wants: [], style: null },
    ],
    cells,
    ghTier: 1,
    endgameKeys: [],
  };
}

export const BUNK_ROSTER_SLOTS = 5;  // 🛠 starter roster base; merc bedrooms +1 each
                                     // (4→5 2026-07-10: with 3 starters, cap 4 left ONE hire —
                                     // 5 of 6 tavern guests walked in a confirm campaign)
