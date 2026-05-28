// M15.1: status alert lines surfaced by `npm run roster show`.

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster } from '../src/roster.js';
import { statusAlerts } from '../src/rosterAlerts.js';

const ROOT = join(__dirname, '..');

describe('M15.1 roster status alerts', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

  it('reports no alerts on a fresh roster on day 0 (next day = 1, not near payday)', () => {
    const r = newRoster([mercs.get('marek')!]);
    // dayCount=0 → nextDay=1, daysToPayday=6 → no alert
    expect(statusAlerts(r)).toEqual([]);
  });

  it('flags debt streak as an alert', () => {
    const r = newRoster([mercs.get('marek')!]);
    r.consecutiveDebtDays = 2;
    const alerts = statusAlerts(r);
    expect(alerts.some((a) => a.includes('IN DEBT'))).toBe(true);
  });

  it('flags upcoming payday within 2 days', () => {
    const r = newRoster([mercs.get('marek')!]);
    r.dayCount = 5; // nextDay=6, daysToPayday=1
    const alerts = statusAlerts(r);
    expect(alerts.some((a) => a.includes('Payday in 1 day'))).toBe(true);
  });

  it('flags tavern refresh only when the bench is below target', () => {
    const r = newRoster([mercs.get('marek')!]);
    r.dayCount = 5; // daysToRefresh=1
    const alerts = statusAlerts(r);
    expect(alerts.some((a) => a.includes('Tavern refresh'))).toBe(true);
    // Fill the bench
    r.hirePool = [
      { merc: mercs.get('marek')!, price: 5, postedDay: 1 },
      { merc: mercs.get('imogen')!, price: 5, postedDay: 1 },
      { merc: mercs.get('roselle')!, price: 5, postedDay: 1 },
    ];
    const alerts2 = statusAlerts(r);
    expect(alerts2.some((a) => a.includes('Tavern refresh'))).toBe(false);
  });
});
