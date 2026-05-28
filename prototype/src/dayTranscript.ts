import type { DayResolution } from './day.js';
import { renderTranscript } from './transcript.js';

const DBAR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

export function renderDayTranscript(day: DayResolution): string {
  const lines: string[] = [];
  lines.push(DBAR);
  lines.push(` DAY: ${day.dayName}  [${day.dayId}]`);
  lines.push(` ${day.scenarios.length} scenarios planned`);
  lines.push(DBAR);
  lines.push('');
  for (let i = 0; i < day.scenarios.length; i++) {
    lines.push(`>>> Scenario ${i + 1}/${day.scenarios.length}`);
    lines.push('');
    lines.push(renderTranscript(day.scenarios[i]!));
    lines.push('');
  }
  lines.push(DBAR);
  lines.push(' DAY END — fatigue:');
  const entries = Object.entries(day.finalFatigue).sort(([a], [b]) => a.localeCompare(b));
  for (const [mercId, fat] of entries) {
    const marker = fat >= 2 ? '⚠' : ' ';
    lines.push(`   ${marker} ${mercId}: ${fat}`);
  }
  lines.push(DBAR);
  return lines.join('\n');
}
