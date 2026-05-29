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
  // M11.8: warn when any held captive has a high escape risk
  // (notoriety >= 3 ⇒ ≥30% chance per day in M11.7).
  for (const c of r.captives) {
    if (c.notoriety >= 3) {
      const pct = Math.min(100, c.notoriety * 10);
      out.push(`! Captive ${c.name} (notoriety ${c.notoriety}) escape risk ~${pct}%/day — process them soon`);
    }
  }
  // M9.10: surface in-window grief stamps so the player knows which mercs
  // are still mourning a fallen bond-partner (the LLM gets the same hint
  // via recentlyLostBondPartner). Stamp is pruned automatically after
  // BOND_GRIEF_HINT_WINDOW_DAYS (=7) in cliDay's end-of-day step, so
  // anything still present here is by definition fresh.
  for (const m of r.mercs) {
    const st = r.states.get(m.id);
    if (!st || !st.recentGriefPartner || st.recentGriefDay === undefined) continue;
    const daysLeft = (st.recentGriefDay + 7) - r.dayCount;
    if (daysLeft > 0) {
      out.push(`⤬ ${m.name} still grieving ${st.recentGriefPartner} (${daysLeft}d left in window)`);
    }
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
  const maxCaptiveNotoriety = r.captives.reduce((m, c) => Math.max(m, c.notoriety), 0);
  const ev: DailyEvent | null = rollEventForDay(catalog, {
    dayCount: nextDay,
    season,
    fortUpgrades: r.fort.upgrades,
    enemyFactions,
    maxCaptiveNotoriety,
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

