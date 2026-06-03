// The fort — 2D cross-section grid, room catalog, expansion, prestige formula
// (docs/FORT.md). Prestige is live-computed (never stored), feeds two pools:
// global (Σ theme rooms → room-type unlocks + lead rarity) and comfort (a bedroom
// → its owner merc's level cap). Cells/builds are pure gold; room-TYPES gate on global.

import type { GameState, FortCell, Room, CharacterCard } from './types.js';
import { overlap } from './economy.js';
import { tagDef } from './tags.js';

export const STARTER_CELL_COUNT = 3;

export interface RoomType {
  key: string;
  name: string;
  bucket: 'functional' | 'theme' | 'housing';
  pool: 'global' | 'comfort' | 'none';
  cost: number;                 // gold to build
  unlockPrestige: number;       // global prestige required before it's buildable
  themeFavored?: string[];      // theme target (favored tag ids)
  themeClashing?: string[];
  band: [number, number, number]; // [min, expected, max]
  gate?: { kind: 'leadTier' | 'recruit' | 'captiveCap' | 'capture'; value: number };
  occupantSlots: number;
  itemSlots: number;
  mates?: string[];
}

// ---- the catalog (small, extensible) ----------------------------------------
export const ROOM_TYPES: Record<string, RoomType> = {
  bunkroom: { key: 'bunkroom', name: 'Bunkroom', bucket: 'housing', pool: 'none', cost: 0, unlockPrestige: 0, band: [0, 0, 0], occupantSlots: 6, itemSlots: 0 },
  bedroom: { key: 'bedroom', name: 'Merc Bedroom', bucket: 'housing', pool: 'comfort', cost: 120, unlockPrestige: 0, band: [3, 18, 40], occupantSlots: 0, itemSlots: 3 },
  scout: { key: 'scout', name: 'Scout Post', bucket: 'functional', pool: 'global', cost: 100, unlockPrestige: 0, band: [1, 6, 14], gate: { kind: 'leadTier', value: 1 }, occupantSlots: 1, itemSlots: 1 },
  scout2: { key: 'scout2', name: 'Watchtower', bucket: 'functional', pool: 'global', cost: 320, unlockPrestige: 30, band: [2, 8, 18], gate: { kind: 'leadTier', value: 2 }, occupantSlots: 1, itemSlots: 1 },
  tavern: { key: 'tavern', name: 'Tavern', bucket: 'functional', pool: 'global', cost: 150, unlockPrestige: 0, band: [2, 10, 22], gate: { kind: 'recruit', value: 1 }, occupantSlots: 2, itemSlots: 2, mates: ['kitchen'] },
  dungeon: { key: 'dungeon', name: 'Dungeon', bucket: 'functional', pool: 'none', cost: 140, unlockPrestige: 0, band: [0, 0, 0], gate: { kind: 'captiveCap', value: 4 }, occupantSlots: 4, itemSlots: 0 },
  kitchen: { key: 'kitchen', name: 'Kitchen', bucket: 'theme', pool: 'global', cost: 130, unlockPrestige: 10, themeFavored: ['skill:food', 'bg:hunter'], band: [3, 16, 36], occupantSlots: 2, itemSlots: 2, mates: ['tavern'] },
  chapel: { key: 'chapel', name: 'Chapel', bucket: 'theme', pool: 'global', cost: 160, unlockPrestige: 18, themeFavored: ['bg:priest', 'pers:kind', 'pers:calm'], themeClashing: ['pers:cruel'], band: [3, 16, 36], occupantSlots: 2, itemSlots: 2 },
  library: { key: 'library', name: 'Library', bucket: 'theme', pool: 'global', cost: 180, unlockPrestige: 26, themeFavored: ['skill:lore', 'bg:scholar', 'phys:clever'], band: [3, 18, 40], occupantSlots: 2, itemSlots: 2 },
};

const SAT_K = 14; // saturation constant for prestige(rawScore)

// ---- cells & expansion ------------------------------------------------------
export function starterCells(): FortCell[] {
  const cells: FortCell[] = [];
  for (let i = 0; i < STARTER_CELL_COUNT; i++) cells.push({ idx: i, floor: 0, col: i });
  return cells;
}
export function excavateCost(state: GameState, floor: number): number {
  const onFloor = state.cells.filter((c) => c.floor === floor).length;
  return 60 + Math.max(0, onFloor - STARTER_CELL_COUNT) * 50;
}
export function digFloorCost(state: GameState): number {
  const floors = new Set(state.cells.map((c) => c.floor)).size;
  return 120 + (floors - 1) * 90;
}
/** Add a cell to the right (or left) end of a floor. */
export function excavate(state: GameState, floor: number, dir: 1 | -1): FortCell {
  const cols = state.cells.filter((c) => c.floor === floor).map((c) => c.col);
  const col = dir > 0 ? Math.max(...cols) + 1 : Math.min(...cols) - 1;
  const cell: FortCell = { idx: state.cells.length, floor, col };
  state.cells.push(cell);
  return cell;
}
export function digFloor(state: GameState, dir: 1 | -1): FortCell[] {
  const floors = state.cells.map((c) => c.floor);
  const floor = dir > 0 ? Math.max(...floors) + 1 : Math.min(...floors) - 1;
  const made: FortCell[] = [];
  for (let i = 0; i < STARTER_CELL_COUNT; i++) {
    const cell: FortCell = { idx: state.cells.length, floor, col: i };
    state.cells.push(cell); made.push(cell);
  }
  return made;
}

// ---- prestige ---------------------------------------------------------------
function adjacencyMult(state: GameState, room: Room): number {
  const cell = state.cells.find((c) => c.idx === room.cellIdx);
  if (!cell) return 1;
  const type = ROOM_TYPES[room.type];
  if (!type?.mates?.length) return 1;
  let mult = 1;
  for (const other of Object.values(state.rooms)) {
    if (other.id === room.id) continue;
    const oc = state.cells.find((c) => c.idx === other.cellIdx);
    if (!oc) continue;
    const adj = (oc.floor === cell.floor && Math.abs(oc.col - cell.col) === 1) || (oc.col === cell.col && Math.abs(oc.floor - cell.floor) === 1);
    if (adj && type.mates.includes(other.type)) mult += 0.25;
  }
  return Math.min(1.5, mult);
}

function targetFor(state: GameState, room: Room): { favored: string[]; clashing: string[] } {
  const type = ROOM_TYPES[room.type];
  if (type.pool === 'comfort' && room.ownerMercId) {
    const owner = state.cards[room.ownerMercId] as CharacterCard | undefined;
    return { favored: owner ? owner.tags.map((t) => t.id) : [], clashing: [] };
  }
  return { favored: type.themeFavored ?? [], clashing: type.themeClashing ?? [] };
}

export function roomPrestige(state: GameState, room: Room): number {
  const type = ROOM_TYPES[room.type];
  const [min, max] = [type.band[0], type.band[2]];
  if (max <= min) return min;
  const { favored, clashing } = targetFor(state, room);
  let raw = 0;
  for (const id of room.displayCardIds) {
    const card = state.cards[id];
    if (card) raw += overlap(card.tags, favored, clashing);
  }
  raw *= adjacencyMult(state, room);
  const p = min + (max - min) * (1 - Math.exp(-Math.max(0, raw) / SAT_K));
  return Math.round(Math.max(min, p));
}

export function globalPrestige(state: GameState): number {
  let sum = 0;
  for (const room of Object.values(state.rooms)) {
    if (ROOM_TYPES[room.type]?.pool === 'global') sum += roomPrestige(state, room);
  }
  return sum;
}
export function comfortFor(state: GameState, mercId: string): number {
  const bedroom = Object.values(state.rooms).find((r) => r.ownerMercId === mercId && ROOM_TYPES[r.type]?.pool === 'comfort');
  return bedroom ? roomPrestige(state, bedroom) : 0;
}
/** Merc level cap from their bedroom comfort (capCurve). Bunkroom mercs get a low floor. */
export function levelCap(state: GameState, mercId: string): number {
  const comfort = comfortFor(state, mercId);
  return 3 + Math.round(comfort * 0.9); // expected comfort 18 → cap ~19; tuned in play
}

// ---- gates (capability from built functional rooms) -------------------------
export function gateValue(state: GameState, kind: 'leadTier' | 'recruit' | 'captiveCap' | 'capture'): number {
  let best = 0;
  for (const room of Object.values(state.rooms)) {
    const g = ROOM_TYPES[room.type]?.gate;
    if (g && g.kind === kind) best = Math.max(best, g.value);
  }
  return best;
}
export function captiveCapacity(state: GameState): number { return gateValue(state, 'captiveCap'); }
export function leadTier(state: GameState): number { return Math.max(1, gateValue(state, 'leadTier')); }
export function canCapture(state: GameState): boolean { return captiveCapacity(state) > 0; }
export function canRecruit(state: GameState): boolean { return gateValue(state, 'recruit') > 0; }

/** Room types buildable now (unlocked by global prestige, not yet over-built). */
export function buildableRoomTypes(state: GameState): RoomType[] {
  const gp = globalPrestige(state);
  return Object.values(ROOM_TYPES).filter((t) => t.bucket !== 'housing' || t.key === 'bedroom')
    .filter((t) => gp >= t.unlockPrestige);
}

export function emptyCells(state: GameState): FortCell[] {
  return state.cells.filter((c) => !c.roomId);
}
/** Bare-suffix-ish theme label for display. */
export function themeWords(type: RoomType): string {
  return (type.themeFavored ?? []).map((id) => tagDef(id)?.word ?? id).join('/');
}
