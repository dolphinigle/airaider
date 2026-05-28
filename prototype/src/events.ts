// M7.4: daily events table.
//
// Before today's scenarios resolve, the day loop rolls ONE event from the
// catalog. Events are filtered by predicates (season, has-upgrade,
// missing-upgrade) and then weighted-sampled with a deterministic RNG seeded
// from the roster's dayCount. Each event has a flat effect on the roster
// (goldDelta, fatigueDelta applied to every party-able merc, optional
// reputation deltas) and a short narration line that appears in the day
// transcript under a DAILY EVENT block.
//
// Catalog lives at data/events.json. An empty/no-match catalog is fine — the
// day loop simply emits no event that day.

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Rng } from './rng.js';
import { rngFromString } from './rng.js';
import type { Season } from './season.js';

const SeasonEnum = z.enum(['thaw', 'high', 'wane', 'frost']);

const EventEffectSchema = z.object({
  goldDelta: z.number().int().default(0),
  fatigueDelta: z.number().int().default(0),
  reputationDeltas: z.array(z.object({
    factionId: z.string().min(1),
    delta: z.number().int(),
  })).default([]),
});

const EventSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  narration: z.string().min(1),
  /** Sample weight; >=1. */
  weight: z.number().int().min(1).default(1),
  /** If set, only fires in one of these seasons. */
  seasons: z.array(SeasonEnum).optional(),
  /** If set, only fires when ALL of these upgrade ids are present. */
  requiresUpgrades: z.array(z.string()).optional(),
  /** If set, only fires when NONE of these upgrade ids are present. */
  requiresMissingUpgrades: z.array(z.string()).optional(),
  effect: EventEffectSchema.default({ goldDelta: 0, fatigueDelta: 0, reputationDeltas: [] }),
});

const CatalogSchema = z.object({
  events: z.array(EventSchema),
});

export type DailyEvent = z.infer<typeof EventSchema>;
export type EventEffect = z.infer<typeof EventEffectSchema>;

export function loadEventCatalog(path: string): DailyEvent[] {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const parsed = CatalogSchema.parse(raw);
  return parsed.events;
}

export interface EventRollContext {
  dayCount: number;
  season: Season | undefined;
  fortUpgrades: Iterable<string>;
}

export function eligibleEvents(catalog: DailyEvent[], ctx: EventRollContext): DailyEvent[] {
  const upgrades = new Set(ctx.fortUpgrades);
  return catalog.filter((e) => {
    if (e.seasons && (!ctx.season || !e.seasons.includes(ctx.season))) return false;
    if (e.requiresUpgrades && !e.requiresUpgrades.every((u) => upgrades.has(u))) return false;
    if (e.requiresMissingUpgrades && e.requiresMissingUpgrades.some((u) => upgrades.has(u))) return false;
    return true;
  });
}

/**
 * Roll one event from the eligible pool using a weighted draw on `rng`.
 * Returns `null` when no event is eligible.
 */
export function rollEvent(
  catalog: DailyEvent[],
  ctx: EventRollContext,
  rng: Rng,
): DailyEvent | null {
  const pool = eligibleEvents(catalog, ctx);
  if (pool.length === 0) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let pick = Math.floor(rng() * total);
  for (const e of pool) {
    pick -= e.weight;
    if (pick < 0) return e;
  }
  return pool[pool.length - 1] ?? null;
}

/** Convenience: roll using a roster-derived deterministic seed. */
export function rollEventForDay(
  catalog: DailyEvent[],
  ctx: EventRollContext,
  rosterSeedSalt = 'event',
): DailyEvent | null {
  const rng = rngFromString(`${rosterSeedSalt}-${ctx.dayCount}`);
  return rollEvent(catalog, ctx, rng);
}
