// M15.1: roster status alerts (debt, payday countdown, refresh countdown).
// Extracted from cliRoster.ts so the helper is importable from tests
// without triggering the CLI's top-level main().

import type { Roster } from './roster.js';
import { WAGE_INTERVAL_DAYS } from './day.js';
import { HIRE_REFRESH_INTERVAL_DAYS, HIRE_POOL_TARGET_SIZE } from './tavern.js';

const ALERT_HORIZON_DAYS = 2;

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

function daysUntil(currentDay: number, interval: number): number {
  const mod = currentDay % interval;
  return mod === 0 ? 0 : interval - mod;
}
