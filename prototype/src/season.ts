// M6.3 — season / weather clock.
//
// The prototype world rotates through four seasons of 30 in-game days each.
// Season is purely derived from roster.dayCount so we don't need a schema
// bump (existing roster JSONs work unchanged). Scenarios may carry a
// `seasonModifier` whose flat coin delta is applied to the resolution's
// coin pool, mirroring how synergy bonuses already feed in.

export const SEASONS = ['thaw', 'high', 'wane', 'frost'] as const;
export type Season = typeof SEASONS[number];

export const DAYS_PER_SEASON = 30;

export interface SeasonClock {
  season: Season;
  /** 1-based day within the current season (1..DAYS_PER_SEASON). */
  dayOfSeason: number;
  /** 0-based season index since day 0 (wraps every 4). */
  seasonIndex: number;
}

/**
 * Map a roster dayCount (the count of completed days) to the season the NEXT
 * day will play under. dayCount=0 → first day of `thaw`; dayCount=29 → last
 * day of `thaw`; dayCount=30 → first day of `high`; and so on.
 */
export function seasonFor(dayCount: number): SeasonClock {
  const idx = Math.floor(dayCount / DAYS_PER_SEASON) % SEASONS.length;
  const dayOfSeason = (dayCount % DAYS_PER_SEASON) + 1;
  return { season: SEASONS[idx]!, dayOfSeason, seasonIndex: idx };
}
