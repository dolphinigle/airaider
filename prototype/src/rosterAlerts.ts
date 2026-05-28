// M15.1: roster status alerts (debt, payday countdown, refresh countdown).
// M12.2: optional watch-tower preview of tomorrow's daily event.
// Extracted from cliRoster.ts so the helper is importable from tests
// without triggering the CLI's top-level main().

import type { Roster } from './roster.js';
import { WAGE_INTERVAL_DAYS } from './day.js';
import { HIRE_REFRESH_INTERVAL_DAYS, HIRE_POOL_TARGET_SIZE } from './tavern.js';
import { loadEventCatalog, rollEventForDay, type DailyEvent } from './events.js';
import { seasonFor } from './season.js';
import { reputationTier } from './reputation.js';

const ALERT_HORIZON_DAYS = 2;

/** M12.2: fort upgrade id that unlocks the daily-event preview. */
export const WATCH_TOWER_UPGRADE_ID = 'watch-tower';

export function statusAlerts(r: Roster): string[] {
  const out: string[] = [];
  if (r.consecutiveDebtDays > 0) {
    out.push(`! IN DEBT for ${r.consecutiveDebtDays} day${r.consecutiveDebtDays === 1 ? '' : 's'} (mercs miserable; no rest, no new bonds — desertion at day 3)`);
  }
  const nextDay = r.dayCount + 1;
  const daysToPayday = daysUntil(nextDay, WAGE_INTERVAL_DAYS);
  if (daysToPayday <= ALERT_HORIZON_DAYS) {
    const totalWages = r.mercs.reduce((a, m) => a + m.wage, 0);
    out.push(`> Payday in ${daysToPayday} day${daysToPayday === 1 ? '' : 's'} (~${totalWages}g)`);
  }
  const daysToRefresh = daysUntil(nextDay, HIRE_REFRESH_INTERVAL_DAYS);
  if (daysToRefresh <= ALERT_HORIZON_DAYS && r.hirePool.length < HIRE_POOL_TARGET_SIZE) {
    out.push(`> Tavern refresh in ${daysToRefresh} day${daysToRefresh === 1 ? '' : 's'}`);
  }
  return out;
}

/**
 * M12.2: if the fort has the watch-tower upgrade, deterministically roll
 * what tomorrow's daily event WOULD be (under the same rules the day loop
 * will use) and return a short preview line. Returns null when:
 *  - the fort lacks watch-tower
 *  - or the roll produces no event (`null` from rollEventForDay)
 * Pure function — no roster mutation. Used by cliRoster show.
 */
export function watchTowerForecast(
  r: Roster,
  catalogPath: string,
): { label: string; line: string } | null {
  if (!r.fort.upgrades.includes(WATCH_TOWER_UPGRADE_ID)) return null;
  const nextDay = r.dayCount + 1;
  const seasonClock = seasonFor(r.dayCount); // same as resolveDay
  const season = seasonClock.season;
  const enemyFactions: string[] = [];
  for (const [factionId, standing] of Object.entries(r.reputation)) {
    if (reputationTier(standing) === 'enemy') enemyFactions.push(factionId);
  }
  const catalog = loadEventCatalog(catalogPath);
  const ev: DailyEvent | null = rollEventForDay(catalog, {
    dayCount: nextDay,
    season,
    fortUpgrades: r.fort.upgrades,
    enemyFactions,
  });
  if (!ev) return null;
  const eff = ev.effect;
  const parts: string[] = [];
  if (eff.goldDelta !== 0) parts.push(`${eff.goldDelta > 0 ? '+' : ''}${eff.goldDelta}g`);
  if (eff.fatigueDelta !== 0) parts.push(`fatigue ${eff.fatigueDelta > 0 ? '+' : ''}${eff.fatigueDelta}`);
  for (const d of eff.reputationDeltas) parts.push(`${d.factionId} ${d.delta > 0 ? '+' : ''}${d.delta}`);
  const tail = parts.length > 0 ? `  (${parts.join(', ')})` : '';
  return {
    label: ev.label,
    line: `▲ Watch-tower forecast (day ${nextDay}): ${ev.label}${tail}`,
  };
}

function daysUntil(currentDay: number, interval: number): number {
  const mod = currentDay % interval;
  return mod === 0 ? 0 : interval - mod;
}

