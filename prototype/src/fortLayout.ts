// PROTO-GAME: render + mutate fort layout (cells + placed rooms).

import { adjacentIndices, nextExcavationCost, type RoomDef } from './rooms.js';
import type { FortState } from './fort.js';

/** Truncate text to fit inside an N-wide cell, padded with spaces. */
function fit(s: string, w: number): string {
  if (s.length === w) return s;
  if (s.length > w) return s.slice(0, w);
  return s + ' '.repeat(w - s.length);
}

const CELL_W = 12;

/**
 * Render the fort as a 2D cross-section.
 *
 * Example (3 cells, all occupied):
 *   ┌────────────┬────────────┬────────────┐
 *   │ Bedroom    │ Bunkroom   │ Storeroom  │
 *   │ quarters   │ quarters   │ dungeon    │
 *   └────────────┴────────────┴────────────┘
 *      cell 0       cell 1       cell 2
 *
 * Adjacency bonuses are listed below the grid.
 */
export function renderFortLayout(
  fort: FortState,
  catalog: Map<string, RoomDef>,
): string[] {
  const lines: string[] = [];
  const cells = [...fort.cells].sort((a, b) => a.idx - b.idx);
  if (cells.length === 0) {
    lines.push('  (fort has no cells — should not happen on a starter save)');
    return lines;
  }
  const placedByCell = new Map<number, RoomDef>();
  for (const p of fort.placedRooms) {
    const def = catalog.get(p.roomId);
    if (def) placedByCell.set(p.cellIdx, def);
  }
  const horiz = '─'.repeat(CELL_W);
  const top = '┌' + cells.map(() => horiz).join('┬') + '┐';
  const bot = '└' + cells.map(() => horiz).join('┴') + '┘';
  const nameRow = '│' + cells.map((c) => {
    const r = placedByCell.get(c.idx);
    return ' ' + fit(r ? r.name : '(empty)', CELL_W - 1);
  }).join('│') + '│';
  const catRow = '│' + cells.map((c) => {
    const r = placedByCell.get(c.idx);
    return ' ' + fit(r ? r.category : '—', CELL_W - 1);
  }).join('│') + '│';
  const idxRow = '  ' + cells.map((c) => fit(`cell ${c.idx}`, CELL_W + 1)).join('');
  lines.push('  ' + top);
  lines.push('  ' + nameRow);
  lines.push('  ' + catRow);
  lines.push('  ' + bot);
  lines.push(idxRow);

  // Adjacency bonuses
  const bonuses = adjacencyBonuses(fort, catalog);
  if (bonuses.length > 0) {
    lines.push('');
    lines.push('  Adjacency bonuses active:');
    for (const b of bonuses) lines.push(`    ⤬ ${b}`);
    // PROTO-GAME v13.1: surface the mechanical effect, not just the pair.
    const effIds = adjacencyEffectIds(fort, catalog);
    for (const id of effIds) {
      if (id === 'adj-bed-bunk') lines.push('        → +1 fatigue recovery for idle mercs (any season)');
      else if (id === 'adj-smithy-workshop') lines.push('        → +1 coin on every scenario the fort runs');
    }
  } else if (fort.placedRooms.length >= 2) {
    lines.push('');
    lines.push('  (no adjacency bonuses — try pairing rooms with their adjacency-mates)');
  }
  return lines;
}

/** Return list of "Bedroom ↔ Bunkroom" strings for each active adjacency pair. */
export function adjacencyBonuses(
  fort: FortState,
  catalog: Map<string, RoomDef>,
): string[] {
  const cells = fort.cells.map((c) => c.idx);
  const totalSpan = (Math.max(...cells, 0)) + 1;
  const placedByCell = new Map<number, string>();
  for (const p of fort.placedRooms) placedByCell.set(p.cellIdx, p.roomId);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of fort.placedRooms) {
    const def = catalog.get(p.roomId);
    if (!def) continue;
    for (const neighbor of adjacentIndices(p.cellIdx, totalSpan)) {
      const otherId = placedByCell.get(neighbor);
      if (!otherId) continue;
      const otherDef = catalog.get(otherId);
      if (!otherDef) continue;
      if (!def.adjacencyMates.includes(otherId) && !otherDef.adjacencyMates.includes(p.roomId)) continue;
      const key = [p.roomId, otherId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(`${def.name} ↔ ${otherDef.name}`);
    }
  }
  return out;
}

/**
 * PROTO-GAME v13.1: adjacency-driven pseudo-upgrade ids. Returns ids that
 * downstream FortEffects code can treat the same as bought upgrades.
 *
 * Currently:
 *   - bedroom ↔ bunkroom  → 'adj-bed-bunk'  (+1 fatigue recovery for idle mercs)
 *   - smithy ↔ workshop   → 'adj-smithy-workshop' (+1 flat coin/scenario)
 */
export function adjacencyEffectIds(
  fort: FortState,
  catalog: Map<string, RoomDef>,
): Set<string> {
  const out = new Set<string>();
  const placedByCell = new Map<number, string>();
  for (const p of fort.placedRooms) placedByCell.set(p.cellIdx, p.roomId);
  const cells = fort.cells.map((c) => c.idx);
  const totalSpan = (Math.max(...cells, 0)) + 1;
  const pairActive = (a: string, b: string): boolean => {
    for (const p of fort.placedRooms) {
      if (p.roomId !== a) continue;
      for (const n of adjacentIndices(p.cellIdx, totalSpan)) {
        if (placedByCell.get(n) === b) return true;
      }
    }
    return false;
  };
  if (pairActive('drust-bedroom', 'bunkroom') || pairActive('bunkroom', 'drust-bedroom')) {
    out.add('adj-bed-bunk');
  }
  if (pairActive('smithy', 'workshop') || pairActive('workshop', 'smithy')) {
    out.add('adj-smithy-workshop');
  }
  // Ignore the catalog parameter for now; future expansion may read def.adjacencyEffectIds.
  void catalog;
  return out;
}

/**
 * PROTO-GAME v13.1: pseudo-upgrade ids contributed by PLACED ROOMS that
 * mirror their legacy fort-upgrade counterparts. A built smithy room should
 * trigger the same +1 coin as the legacy `smithy` upgrade.
 */
export function roomUpgradeIds(
  fort: FortState,
): Set<string> {
  const out = new Set<string>();
  const ROOM_TO_UPGRADE: Record<string, string> = {
    smithy: 'smithy',
    chapel: 'chapel',
    granary: 'granary',
    'watch-tower': 'watch-tower',
  };
  for (const p of fort.placedRooms) {
    const mapped = ROOM_TO_UPGRADE[p.roomId];
    if (mapped) out.add(mapped);
  }
  return out;
}

/**
 * PROTO-GAME v13.1: union of legacy upgrades + room-derived upgrades +
 * adjacency-derived pseudo-upgrades. Pass this to fortEffectsFor.
 */
export function effectiveUpgradeIds(
  fort: FortState,
  catalog: Map<string, RoomDef>,
  legacyUpgrades: string[] | undefined,
): string[] {
  const out = new Set<string>(legacyUpgrades ?? []);
  for (const id of roomUpgradeIds(fort)) out.add(id);
  for (const id of adjacencyEffectIds(fort, catalog)) out.add(id);
  return [...out];
}

export type BuildError =
  | { kind: 'unknown-room' }
  | { kind: 'unknown-cell' }
  | { kind: 'cell-occupied'; existing: string }
  | { kind: 'insufficient-gold'; need: number; have: number }
  | { kind: 'duplicate-room'; roomId: string };

/**
 * Place a room in a cell. Pure: returns a result + new fort/gold values.
 * Some rooms are duplicate-friendly (income/quarters/dungeon); others should
 * be unique (utility like scouting-post, watch-tower, chapel).
 */
const UNIQUE_ROOM_IDS = new Set([
  'scouting-post', 'tavern', 'chapel', 'watch-tower', 'granary',
]);

export function buildRoom(
  fort: FortState,
  gold: number,
  room: RoomDef,
  cellIdx: number,
  dayCount: number,
): { ok: true; fort: FortState; gold: number } | { ok: false; error: BuildError } {
  if (!fort.cells.some((c) => c.idx === cellIdx)) {
    return { ok: false, error: { kind: 'unknown-cell' } };
  }
  const existing = fort.placedRooms.find((p) => p.cellIdx === cellIdx);
  if (existing) return { ok: false, error: { kind: 'cell-occupied', existing: existing.roomId } };
  if (UNIQUE_ROOM_IDS.has(room.id) && fort.placedRooms.some((p) => p.roomId === room.id)) {
    return { ok: false, error: { kind: 'duplicate-room', roomId: room.id } };
  }
  if (gold < room.cost) return { ok: false, error: { kind: 'insufficient-gold', need: room.cost, have: gold } };
  const next: FortState = {
    ...fort,
    placedRooms: [...fort.placedRooms, { roomId: room.id, cellIdx, builtOnDay: dayCount }],
  };
  return { ok: true, fort: next, gold: gold - room.cost };
}

export function excavateCell(
  fort: FortState,
  gold: number,
  dayCount: number,
): { ok: true; fort: FortState; gold: number; cost: number } | { ok: false; error: { kind: 'insufficient-gold'; need: number; have: number } } {
  const cost = nextExcavationCost(fort.cells.length);
  if (gold < cost) return { ok: false, error: { kind: 'insufficient-gold', need: cost, have: gold } };
  const nextIdx = fort.cells.length === 0 ? 0 : Math.max(...fort.cells.map((c) => c.idx)) + 1;
  const next: FortState = {
    ...fort,
    cells: [...fort.cells, { idx: nextIdx, openedOnDay: dayCount }],
  };
  return { ok: true, fort: next, gold: gold - cost, cost };
}

/** Active gates as a set of strings, e.g. {'lead-board','recruit-pool','captive-cap',...}. */
export function activeGates(fort: FortState, catalog: Map<string, RoomDef>): Set<string> {
  const set = new Set<string>();
  for (const p of fort.placedRooms) {
    const def = catalog.get(p.roomId);
    if (!def) continue;
    for (const g of def.gates) set.add(g);
  }
  return set;
}

/** Total capacity for rooms in the given category (sums room.capacity). */
export function totalCapacity(
  fort: FortState,
  catalog: Map<string, RoomDef>,
  category: string,
): number {
  let n = 0;
  for (const p of fort.placedRooms) {
    const def = catalog.get(p.roomId);
    if (!def) continue;
    if (def.category === category && def.capacity != null) n += def.capacity;
  }
  return n;
}

/**
 * PROTO-GAME v14: list dungeon cells with remaining capacity for captives.
 * Returns an array of cellIdx values, ordered by cell idx ascending, that
 * have a dungeon-category room AND fewer captives than the room's capacity.
 *
 * `captives` is the list of currently-held captives (each with optional cellIdx).
 */
export function dungeonCellsWithSpace(
  fort: FortState,
  catalog: Map<string, RoomDef>,
  captives: Array<{ cellIdx?: number }>,
): number[] {
  const out: number[] = [];
  const heldByCell = new Map<number, number>();
  for (const c of captives) {
    if (c.cellIdx === undefined) continue;
    heldByCell.set(c.cellIdx, (heldByCell.get(c.cellIdx) ?? 0) + 1);
  }
  for (const p of fort.placedRooms) {
    const def = catalog.get(p.roomId);
    if (!def || def.category !== 'dungeon' || def.capacity == null) continue;
    const used = heldByCell.get(p.cellIdx) ?? 0;
    if (used < def.capacity) out.push(p.cellIdx);
  }
  return out.sort((a, b) => a - b);
}

/**
 * PROTO-GAME v14: classify a captive's holding situation by looking at the
 * room in its cell and what's adjacent. Drives recruit bonuses, interrogate
 * unlock, etc.
 */
export function captiveCellEffects(
  fort: FortState,
  catalog: Map<string, RoomDef>,
  cellIdx: number | undefined,
): { roomName: string | null; adjacentRoomIds: string[]; chapelAdjacent: boolean; smithyAdjacent: boolean } {
  if (cellIdx === undefined) {
    return { roomName: null, adjacentRoomIds: [], chapelAdjacent: false, smithyAdjacent: false };
  }
  const placedByCell = new Map<number, string>();
  for (const p of fort.placedRooms) placedByCell.set(p.cellIdx, p.roomId);
  const cells = fort.cells.map((c) => c.idx);
  const totalSpan = (Math.max(...cells, 0)) + 1;
  const roomId = placedByCell.get(cellIdx);
  const def = roomId ? catalog.get(roomId) : undefined;
  const roomName = def?.name ?? null;
  const adjacentRoomIds: string[] = [];
  for (const n of adjacentIndices(cellIdx, totalSpan)) {
    const rid = placedByCell.get(n);
    if (rid) adjacentRoomIds.push(rid);
  }
  return {
    roomName,
    adjacentRoomIds,
    chapelAdjacent: adjacentRoomIds.includes('chapel'),
    smithyAdjacent: adjacentRoomIds.includes('smithy'),
  };
}
