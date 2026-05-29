// M6.4: fort-level upgrade catalog + apply logic.
//
// The fort lives on the roster as { level, upgrades[] }. Upgrades are bought
// with gold from the captive cycle (or any other source) via `npm run fort`.
// Each upgrade has a flat cost, an optional level requirement, and a tag-like
// description. Once purchased, an upgrade id is appended to roster.fort.upgrades
// and (if the catalog entry sets `levelsUp: true`) the fort level ticks up.

import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const FortUpgradeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().int().min(1),
  /** Optional minimum fort level required before this upgrade unlocks. */
  requiresLevel: z.number().int().min(1).optional(),
  /** If true, completing this upgrade increments fort.level by 1. */
  levelsUp: z.boolean().optional(),
});

export type FortUpgrade = z.infer<typeof FortUpgradeSchema>;

const FortCatalogSchema = z.object({
  upgrades: z.array(FortUpgradeSchema),
});

export interface FortCell {
  idx: number;
  openedOnDay: number;
}

export interface PlacedRoom {
  roomId: string;
  cellIdx: number;
  builtOnDay: number;
}

export interface FortState {
  level: number;
  upgrades: string[];
  /** PROTO-GAME v13: opened ground-tier cells. */
  cells: FortCell[];
  /** PROTO-GAME v13: rooms placed in cells. */
  placedRooms: PlacedRoom[];
}

export function newFortState(): FortState {
  return { level: 1, upgrades: [], cells: [], placedRooms: [] };
}

export function loadFortCatalog(path: string): Map<string, FortUpgrade> {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const parsed = FortCatalogSchema.parse(raw);
  const out = new Map<string, FortUpgrade>();
  for (const u of parsed.upgrades) {
    if (out.has(u.id)) throw new Error(`fort: duplicate upgrade id ${u.id}`);
    out.set(u.id, u);
  }
  return out;
}

export interface PurchaseInput {
  fort: FortState;
  gold: number;
  upgrade: FortUpgrade;
}

export interface PurchaseResult {
  fort: FortState;
  gold: number;
  upgrade: FortUpgrade;
  leveledUp: boolean;
}

export type PurchaseError =
  | { kind: 'already-owned' }
  | { kind: 'insufficient-gold'; need: number; have: number }
  | { kind: 'level-locked'; require: number; have: number };

/**
 * Apply a purchase. Returns either the new state or a structured error.
 * Pure: does not mutate the input fort/gold.
 */
export function purchaseUpgrade(input: PurchaseInput): { ok: true; result: PurchaseResult } | { ok: false; error: PurchaseError } {
  const { fort, gold, upgrade } = input;
  if (fort.upgrades.includes(upgrade.id)) return { ok: false, error: { kind: 'already-owned' } };
  if (upgrade.requiresLevel != null && fort.level < upgrade.requiresLevel) {
    return { ok: false, error: { kind: 'level-locked', require: upgrade.requiresLevel, have: fort.level } };
  }
  if (gold < upgrade.cost) return { ok: false, error: { kind: 'insufficient-gold', need: upgrade.cost, have: gold } };
  const nextUpgrades = [...fort.upgrades, upgrade.id];
  const leveledUp = !!upgrade.levelsUp;
  const nextFort: FortState = {
    level: leveledUp ? fort.level + 1 : fort.level,
    upgrades: nextUpgrades,
    cells: fort.cells,
    placedRooms: fort.placedRooms,
  };
  return {
    ok: true,
    result: { fort: nextFort, gold: gold - upgrade.cost, upgrade, leveledUp },
  };
}

/**
 * M7.5: enumerate upgrades that the fort can legally purchase right now
 * (not already owned, level requirement met, gold suffices). Sorted by
 * ascending cost so the cheapest hint can be surfaced first.
 */
export function affordableUpgrades(
  catalog: Map<string, FortUpgrade>,
  fort: FortState,
  gold: number,
): FortUpgrade[] {
  const out: FortUpgrade[] = [];
  for (const u of catalog.values()) {
    if (fort.upgrades.includes(u.id)) continue;
    if (u.requiresLevel != null && fort.level < u.requiresLevel) continue;
    if (gold < u.cost) continue;
    out.push(u);
  }
  out.sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id));
  return out;
}
