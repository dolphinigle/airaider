// PROTO-GAME: room catalog + placed-room runtime types.
//
// Per SIM_BIBLE §2 (Fort 2D cross-section) and §11 (Room-gated progression),
// the fort is a small grid of cells; each cell can hold one room. Rooms
// gate systems (lead board, recruit pool, captive cap, hire cap) and pair
// with adjacency-mates for satisfying combos.
//
// Prototype slice: ground tier only (a single 1D row of cells), 1-cell
// rooms, no construction risk (per findings.md retcon).

import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const RoomCategory = z.enum([
  'quarters',
  'income',
  'work',
  'utility',
  'dungeon',
  'fortification',
]);
export type RoomCategoryT = z.infer<typeof RoomCategory>;

export const RoomDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: RoomCategory,
  cost: z.number().int().min(0),
  description: z.string().default(''),
  /** Capacity for the gate this room provides (e.g. captive cap, bunk cap). */
  capacity: z.number().int().min(0).optional(),
  /** Gold per day at end-of-day payout. */
  incomePerDay: z.number().int().min(0).optional(),
  /** Behavior gates this room opens (e.g. 'lead-board', 'recruit-pool'). */
  gates: z.array(z.string()).default([]),
  /** Room ids that, if placed in an adjacent cell, grant a small bonus. */
  adjacencyMates: z.array(z.string()).default([]),
  /** Flat prestige contribution added once the room is placed. */
  prestigeBonus: z.number().int().min(0).optional(),
  /** If true, the room is part of the Day-1 starter fort layout. */
  starter: z.boolean().default(false),
});
export type RoomDef = z.infer<typeof RoomDefSchema>;

export const RoomCatalogSchema = z.object({
  rooms: z.array(RoomDefSchema),
});

export function loadRoomCatalog(path: string): RoomDef[] {
  const raw = readFileSync(path, 'utf-8');
  const parsed = RoomCatalogSchema.parse(JSON.parse(raw));
  return parsed.rooms;
}

/** Day-1 starter layout: 3 ground cells, starter rooms placed (per SIM_BIBLE §2). */
export const STARTER_CELL_COUNT = 3;

/** Excavation cost progression: 15g * (1 + 0.6 * cellsAlreadyOpened-3). */
export function nextExcavationCost(currentCellCount: number): number {
  const beyondStarter = Math.max(0, currentCellCount - STARTER_CELL_COUNT);
  return Math.round(15 * Math.pow(1.6, beyondStarter));
}

/** Cells adjacent to a given index (1D row: neighbors are i-1 and i+1). */
export function adjacentIndices(cellIdx: number, totalCells: number): number[] {
  const out: number[] = [];
  if (cellIdx > 0) out.push(cellIdx - 1);
  if (cellIdx + 1 < totalCells) out.push(cellIdx + 1);
  return out;
}
