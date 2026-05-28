import type { DayResolution } from './day.js';
import { renderTranscript } from './transcript.js';

const DBAR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

export function renderDayTranscript(day: DayResolution): string {
  const lines: string[] = [];
  lines.push(DBAR);
  lines.push(` DAY: ${day.dayName}  [${day.dayId}]`);
  lines.push(` ${day.scenarios.length} scenarios (incl. ${day.errandsResolved.length} returning errand(s)), ${day.errandsDispatched.length} errand(s) dispatched`);
  lines.push(DBAR);
  lines.push('');
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
  lines.push(DBAR);
  return lines.join('\n');
}
