import type { DayResolution } from './day.js';
import { renderTranscript } from './transcript.js';

const DBAR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

export function renderDayTranscript(day: DayResolution): string {
  const lines: string[] = [];
  lines.push(DBAR);
  lines.push(` DAY: ${day.dayName}  [${day.dayId}]`);
  lines.push(` ${day.scenarios.length} scenarios (incl. ${day.errandsResolved.length} returning errand(s)), ${day.errandsDispatched.length} errand(s) dispatched`);
  if (day.seasonClock) {
    lines.push(` Season: ${day.seasonClock.season}  (day ${day.seasonClock.dayOfSeason}/30)`);
  }
  lines.push(DBAR);
  lines.push('');
  if (day.dailyEvent) {
    const e = day.dailyEvent;
    const eff = e.effect;
    const bits: string[] = [];
    if (eff.goldDelta !== 0) bits.push(`${eff.goldDelta > 0 ? '+' : ''}${eff.goldDelta}g`);
    if (eff.fatigueDelta !== 0) bits.push(`${eff.fatigueDelta > 0 ? '+' : ''}${eff.fatigueDelta} fatigue/merc`);
    for (const d of eff.reputationDeltas) bits.push(`${d.factionId} ${d.delta > 0 ? '+' : ''}${d.delta}`);
    lines.push(`>>> DAILY EVENT: ${e.label}${bits.length ? `  (${bits.join(', ')})` : ''}`);
    lines.push(`     ${e.narration}`);
    lines.push('');
  }
  if (day.errandsResolved.length > 0) {
    lines.push(`>>> Errands that returned today:`);
    for (const r of day.errandsResolved) lines.push(`     • ${r.scenarioId} — ${r.title}`);
    lines.push('');
  }
  for (let i = 0; i < day.scenarios.length; i++) {
    const sc = day.scenarios[i]!;
    const isErrand = day.errandsResolved.includes(sc);
    lines.push(`>>> Scenario ${i + 1}/${day.scenarios.length}${isErrand ? '  [errand return]' : ''}`);
    lines.push('');
    lines.push(renderTranscript(sc));
    const cas = sc.casualties;
    if (cas && cas.length > 0) {
      lines.push('');
      lines.push('  CASUALTIES:');
      for (const c of cas) lines.push(`    ☠ ${c.mercId} takes ${c.damage} (${c.reason})`);
    }
    lines.push('');
  }
  if (day.errandsDispatched.length > 0) {
    lines.push('>>> Errands dispatched today (resolve later):');
    for (const e of day.errandsDispatched) {
      lines.push(`     • ${e.scenarioId} → returns on day ${e.returnsOnDay} (party: ${e.partyMercIds.join(', ')})`);
    }
    lines.push('');
  }
  lines.push(DBAR);
  lines.push(' DAY END — fatigue:');
  const entries = Object.entries(day.finalFatigue).sort(([a], [b]) => a.localeCompare(b));
  for (const [mercId, fat] of entries) {
    const marker = fat >= 2 ? '⚠' : ' ';
    lines.push(`   ${marker} ${mercId}: ${fat}`);
  }
  if (day.promotions.length > 0) {
    lines.push('');
    lines.push(' PROMOTIONS:');
    for (const p of day.promotions) {
      lines.push(`   ★ ${p.mercId}: ${p.fromTier} → ${p.toTier}  (xp ${p.xpAfter})`);
    }
  }
  if (day.bondsFormed.length > 0) {
    lines.push('');
    lines.push(' BONDS FORMED:');
    for (const b of day.bondsFormed) {
      lines.push(`   ⚭ ${b.mercA} ↔ ${b.mercB}  (day ${b.onDay})`);
    }
  }
  if (day.fortHints.length > 0) {
    lines.push('');
    lines.push(' FORT HINT: affordable upgrade(s) — run `npm run fort -- <roster> upgrade <id>`');
    for (const h of day.fortHints) {
      lines.push(`   ⌂ ${h.id} (${h.cost}g) — ${h.name}`);
    }
  }
  if (day.newFortLogEntries.length > 0) {
    lines.push('');
    lines.push(' FORT LOG (today):');
    for (const e of day.newFortLogEntries) {
      lines.push(`   ▸ day ${e.day}  [${e.kind}]  ${e.message}`);
    }
  }
  lines.push(DBAR);
  return lines.join('\n');
}
