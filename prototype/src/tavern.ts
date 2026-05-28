// M10.1: persistent hire pool ("tavern"). The roster carries a small bench
// of generated recruits the player can hire for a fixed price. The pool is
// refilled on a weekly cadence; hires are deducted from gold (debt allowed)
// and dropped from the pool.

import type { Merc, Tag } from './types.js';
import type { Roster } from './roster.js';
import type { Rng } from './rng.js';
import { generateMerc } from './generator.js';

export interface HirePoolEntry {
  /** Generated merc as it appears in the bench (full Merc record). */
  merc: Merc;
  /** Flat hire price in gold. */
  price: number;
  /** Day this entry was posted (roster.dayCount snapshot at refresh time). */
  postedDay: number;
  /** M10.4: optional starting tier for veteran/grizzled wandering arrivals. */
  startingTier?: 'rookie' | 'veteran' | 'grizzled';
  /** M10.4: optional starting xp paired with startingTier. */
  startingXp?: number;
}

/** Target bench size after every refresh. */
export const HIRE_POOL_TARGET_SIZE = 3;
/** Refresh cadence (in days). Refresh fires when `currentDay % interval === 0`. */
export const HIRE_REFRESH_INTERVAL_DAYS = 7;
/** Base hire price. */
export const HIRE_BASE_PRICE = 5;
/** M10.3: bench entries older than this drop off at the next refresh. */
export const HIRE_LISTING_TTL_DAYS = 14;
/** M10.4: probability per refreshed entry of being a wandering veteran. */
export const WANDERING_VETERAN_CHANCE = 0.2;
/** M10.4: price multiplier applied to a wandering-veteran bench entry. */
export const WANDERING_VETERAN_PRICE_MULT = 2;
/** M10.4: starting xp for a wandering veteran (above the veteran threshold 10). */
export const WANDERING_VETERAN_START_XP = 12;

/**
 * Top up the roster's hire pool to HIRE_POOL_TARGET_SIZE. Returns the new
 * entries that were added (may be empty if already full). Uses the provided
 * RNG to derive each new merc + price jitter. Each new entry's `postedDay`
 * is set to `currentDay`.
 *
 * M10.3: before topping up, drops entries whose `postedDay` is older than
 * `HIRE_LISTING_TTL_DAYS` ago — they wander off to drink elsewhere. The
 * dropped entries are returned via a separate function (see
 * `dropStaleListings`) so callers / tests can observe them.
 */
export function refreshHirePool(
  roster: Roster,
  rng: Rng,
  tagPool: Map<string, Tag>,
  currentDay: number,
): HirePoolEntry[] {
  dropStaleListings(roster, currentDay);
  const added: HirePoolEntry[] = [];
  const existing = new Set<string>(roster.hirePool.map((e) => e.merc.id));
  for (const m of roster.mercs) existing.add(m.id);
  while (roster.hirePool.length < HIRE_POOL_TARGET_SIZE) {
    let merc = generateMerc(rng, tagPool, {}, `tavern-${currentDay}-${roster.hirePool.length + 1}`);
    let guard = 0;
    while (existing.has(merc.id) && guard < 16) {
      merc = generateMerc(rng, tagPool);
      guard += 1;
    }
    existing.add(merc.id);
    // Price = base + 0..2g jitter so the bench isn't a single-cost menu.
    let price = HIRE_BASE_PRICE + Math.floor(rng() * 3);
    // M10.4: ~20% of bench refresh entries are wandering veterans —
    // experienced mercs passing through town at a premium price.
    const isVeteran = rng() < WANDERING_VETERAN_CHANCE;
    const entry: HirePoolEntry = isVeteran
      ? {
          merc,
          price: price * WANDERING_VETERAN_PRICE_MULT,
          postedDay: currentDay,
          startingTier: 'veteran',
          startingXp: WANDERING_VETERAN_START_XP,
        }
      : { merc, price, postedDay: currentDay };
    roster.hirePool.push(entry);
    added.push(entry);
  }
  return added;
}

/**
 * M10.3: remove hire-pool entries older than HIRE_LISTING_TTL_DAYS.
 * Returns the dropped entries (so callers can surface them in transcripts
 * or fort log). Mutates `roster.hirePool` in place.
 */
export function dropStaleListings(
  roster: Roster,
  currentDay: number,
): HirePoolEntry[] {
  const dropped: HirePoolEntry[] = [];
  roster.hirePool = roster.hirePool.filter((e) => {
    if (currentDay - e.postedDay > HIRE_LISTING_TTL_DAYS) {
      dropped.push(e);
      return false;
    }
    return true;
  });
  return dropped;
}

export class HireError extends Error {
  constructor(message: string, public readonly code: 'index' | 'duplicate') {
    super(message);
    this.name = 'HireError';
  }
}

/**
 * Hire the bench entry at `index`, mutating the roster: gold drops by
 * `entry.price` (debt allowed, mirroring payday semantics), the merc is
 * pushed into `roster.mercs` with a fresh `RosterMercState`, and the entry
 * is removed from `roster.hirePool`. Returns the hired merc.
 */
export function hireFromPool(roster: Roster, index: number): Merc {
  if (index < 0 || index >= roster.hirePool.length) {
    throw new HireError(`hire index ${index} out of range`, 'index');
  }
  const entry = roster.hirePool[index]!;
  if (roster.mercs.some((m) => m.id === entry.merc.id)) {
    throw new HireError(`merc ${entry.merc.id} already in roster`, 'duplicate');
  }
  roster.gold -= entry.price;
  roster.mercs.push(entry.merc);
  roster.states.set(entry.merc.id, {
    id: entry.merc.id,
    fatigue: 0,
    hpDamage: 0,
    veterancyGain: 0,
    xp: entry.startingXp ?? 0,
    tier: entry.startingTier ?? 'rookie',
    coDeployments: {},
  });
  roster.hirePool.splice(index, 1);
  return entry.merc;
}
