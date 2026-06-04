// Pure text formatting for the CLI (no I/O). Shared by interactive + auto modes.
import type { GameEngine } from '../core/game.js';
import type { Quest, Lead, CharacterCard } from '../core/types.js';
import type { QuestResult } from '../core/quest.js';
import { tagLabel, tagName } from '../core/tags.js';
import { ROOM_TYPES } from '../core/fort.js';

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const b = (s: string) => `\x1b[1m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yel = (s: string) => `\x1b[33m${s}\x1b[0m`;
const grn = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const mag = (s: string) => `\x1b[35m${s}\x1b[0m`;
export const C = { dim, b, cyan, yel, grn, red, mag };

export function mercLine(m: CharacterCard): string {
  const tags = m.tags.filter((t) => !t.id.startsWith('gender:') && !t.id.startsWith('race:')).slice(0, 4).map((t) => tagLabel(t.id, t.tier)).join(', ');
  const hurt = m.injuries.length ? red(' ✚wounded') : '';
  return `${b(m.name)} ${dim('L' + m.level)} ${dim('[' + tags + ']')}${hurt}`;
}

export function status(eng: GameEngine): string {
  const lines: string[] = [];
  lines.push(b(`══ Cycle ${eng.cycle} ══  `) + yel(`${eng.gold}g`) + dim(`  · prestige ${eng.globalPrestige()} · leadTier ${eng.leadTier()} · dungeon ${eng.captiveCapacity()}`));
  lines.push(cyan('Roster:'));
  for (const m of eng.mercs()) lines.push('  ' + mercLine(m) + (eng.freeMercs().includes(m) ? '' : dim(' (out)')));
  const caps = eng.captives();
  if (caps.length) { lines.push(cyan('Captives:')); for (const c of caps) lines.push('  ' + mercLine(c)); }
  const liab = eng.liabilities();
  if (liab.length) lines.push(red('Liabilities: ') + liab.map((l) => `${l.name} (${l.value}g) [${l.id}]`).join(', '));
  return lines.join('\n');
}

export function leadsList(eng: GameEngine): string {
  const lines = [cyan('Leads:')];
  eng.leads().forEach((l: Lead, i) => {
    const chain = l.chain.kind === 'continues' ? mag(` ↪ "${l.title}"`) : l.chain.kind === 'starts-new' ? mag(' ✦ new saga') : l.chain.kind === 'personal' ? mag(` ★ ${l.title}`) : '';
    lines.push(`  ${b(String(i))}. ${l.rarity} L${l.level} ${yel(l.archetype)} — ${l.location}${chain} ${dim('exp c' + l.expiresCycle)}`);
  });
  return lines.join('\n');
}

export function questCard(eng: GameEngine, q: Quest): string {
  const v = eng.questView(q);
  const lines: string[] = [];
  const tag = q.chainId ? mag(q.finale ? '[FINALE] ' : `[beat ${q.beat}] `) : '';
  lines.push(b(`${tag}${q.title}`) + dim(`  (${q.rarity} L${q.level}, ${q.archetype})  [${q.id}]`));
  lines.push('  ' + q.situation);
  lines.push('  ' + yel('Job: ') + q.job);
  if (q.stakes) lines.push('  ' + dim('whisper: ' + q.stakes));
  q.slots.forEach((s) => {
    const req = s.requirement.kind === 'must-have' ? ` must:${tagName(s.requirement.tag)}`
      : s.requirement.kind === 'must-be' ? ` must be ${eng.state.cards[s.requirement.cardId]?.name ?? 'them'}` : '';
    const fav = s.tested.favored.map((t) => tagName(t)).join('/');
    const who = s.filledBy ? grn(eng.state.cards[s.filledBy]?.name ?? s.filledBy) : dim('empty');
    lines.push(`    slot ${s.index} ${dim('tests ' + s.tested.attribute + (fav ? ' +[' + fav + ']' : '') + req)} → ${who}`);
  });
  const o = v.odds;
  lines.push('  ' + dim(`coins ${v.coins} vs threshold ${q.threshold} → `) + grn(`S ${(o.success * 100) | 0}%`) + ' ' + yel(`P ${(o.partial * 100) | 0}%`) + ' ' + red(`F ${(o.failure * 100) | 0}%`));
  return lines.join('\n');
}

export function resultBlock(r: QuestResult): string {
  const color = r.outcome === 'success' ? grn : r.outcome === 'partial' ? yel : red;
  const lines: string[] = [];
  lines.push(dim('  ' + r.beforeText));
  lines.push('  ' + color(`▶ ${r.outcome.toUpperCase()}`) + dim(` (${r.heads}/${r.threshold} heads of ${r.coins})`));
  lines.push('  ' + r.afterText);
  if (r.delivered.length) lines.push('  ' + cyan('→ ') + r.delivered.join(', '));
  if (r.chainDone) lines.push('  ' + mag('✦ the saga concludes.'));
  return lines.join('\n');
}

// A proper 2D vertical cross-section (docs/FORT.md §1): floors stacked (top first),
// columns aligned by col index (negative = left), gaps shown as blanks.
export function fortView(eng: GameEngine): string {
  const cells = eng.state.cells;
  const floors = [...new Set(cells.map((c) => c.floor))].sort((a, b) => b - a);
  const minCol = Math.min(...cells.map((c) => c.col));
  const maxCol = Math.max(...cells.map((c) => c.col));
  const W = 13; // cell width
  const cell = (s: string) => s.padEnd(W).slice(0, W);
  const lines = [cyan('Fort (cross-section):')];
  for (const floor of floors) {
    const tag = floor === 0 ? C.dim('  0 ') : floor > 0 ? C.dim(`+${floor} `) : C.dim(`${floor} `);
    const cellsRow: string[] = [];
    for (let col = minCol; col <= maxCol; col++) {
      const c = cells.find((x) => x.floor === floor && x.col === col);
      if (!c) { cellsRow.push(' '.repeat(W)); continue; }
      const room = c.roomId ? eng.state.rooms[c.roomId] : null;
      const label = room ? ROOM_TYPES[room.type]?.name ?? room.type : '·empty';
      cellsRow.push(room ? cell(`[${label}]`) : C.dim(cell(`[#${c.idx} ${label}]`)));
    }
    lines.push('  ' + tag + cellsRow.join(''));
    if (floor === 0) lines.push('  ' + C.dim('    ' + '‾'.repeat((maxCol - minCol + 1) * W)));
  }
  return lines.join('\n');
}
