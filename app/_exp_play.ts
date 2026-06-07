// Dogfood playthrough: auto-play the game NORMALLY with real AI, dumping every AI call's FULL
// system+user+response to /tmp/play so I can read each prompt in full and smell-test it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { allMercs } from './core/state.js';
import { BALANCE } from './core/economy.js';
import type { Quest, CharacterCard } from './core/types.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
mkdirSync('/tmp/play', { recursive: true });
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
let n = 0;
const onCall = (r: any) => {
  writeFileSync(`/tmp/play/${String(++n).padStart(3, '0')}-${r.kind}.txt`,
    `=== ${r.kind} #${r.n}  model=${r.model} effort=${r.effort} ${r.ms}ms in=${r.promptTokens} out=${r.completionTokens} ===\n\n` +
    `----- SYSTEM -----\n${r.system}\n\n----- USER -----\n${r.user}\n\n----- RESPONSE -----\n${r.response}\n`);
};
const CYCLES = Number(process.argv[2] || 14);
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[3] || 'dogfood', onCall });
const slotFit = (m: CharacterCard, q: Quest, i: number) => {
  const t = q.slots[i].tested; let s = m.attrs[t.attribute];
  for (const f of t.favored) { const tag = m.tags.find((x) => x.id === f); if (tag) s += BALANCE.favoredBonus(tag.tier); }
  return s - m.injuries.length * 2;
};
const log: string[] = [];
for (let c = 0; c < CYCLES; c++) {
  log.push(`\n========== CYCLE ${c} ==========`);
  // pursue everything fillable, chains first (so sagas progress)
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  for (const lead of leads) {
    if (eng.freeMercs().length === 0) break;
    const q = await eng.pursue(lead.id);
    if (q && !('error' in q)) log.push(`pursued: ${strip(q.title)} — ${strip(q.job).slice(0, 70)}`);
  }
  // assign best-fit (grouped → pick best branch+merc; else fill each slot best-fit) — play to WIN
  for (const q of eng.activeQuests()) {
    if (q.groups) {
      let best: { slot: number; merc: string; fit: number } | null = null;
      for (const g of q.groups) { const i = g.slotIndices[0]; for (const m of eng.eligibleMercs(q, i)) { const fit = slotFit(m, q, i); if (!best || fit > best.fit) best = { slot: i, merc: m.id, fit }; } }
      if (best) eng.assign(q.id, best.slot, best.merc);
      continue;
    }
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i].filledBy) continue;
      const e = [...eng.eligibleMercs(q, i)].sort((a, b) => slotFit(b, q, i) - slotFit(a, q, i));
      if (e.length) eng.assign(q.id, i, e[0].id);
    }
  }
  // play NORMALLY: spend gold to build bedrooms (→ level caps → stronger mercs → win more → grow)
  for (const m of allMercs(eng.state)) {
    if (eng.rooms().some((r) => (r as any).ownerMercId === m.id)) continue;
    let cell = eng.state.cells.find((c) => !c.roomId);
    if (!cell && eng.gold > 220) { eng.excavate(0, 1); cell = eng.state.cells.find((c) => !c.roomId); }
    if (cell && eng.gold >= 120) { const b = eng.buildRoom(cell.idx, 'bedroom'); if ('ok' in b) { const room = eng.rooms().find((rm) => rm.cellIdx === cell!.idx); if (room) (eng as any).setBedroomOwner(room.id, m.id); } }
  }
  const results = await eng.endDay();
  for (const r of results) log.push(`  ${r.outcome.toUpperCase()} (${r.heads}/${r.threshold}) — ${strip(r.afterText).slice(0, 90)}`);
  log.push(`  roster: ${allMercs(eng.state).length} mercs · gold ${eng.state.gold ?? '?'} · prestige ${(eng.state as any).prestige ?? '?'}`);
}
writeFileSync('/tmp/play/_playlog.txt', log.join('\n'));
console.log(`\nDONE: ${n} AI calls dumped to /tmp/play/. ${CYCLES} cycles played.`);
console.log(log.join('\n').slice(-1500));
