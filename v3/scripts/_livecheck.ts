// PROOF that the reckoning arrives progressively, against the REAL provider.
// Drives a game to a cycle with 2+ marching quests, then polls game.reckoningView() every
// 250ms during endCycle and prints each moment the line count grows.
// Usage: npx tsx scripts/_livecheck.ts [seed] [maxUsd]
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const seed = Number(process.argv[2] ?? 2468);
const maxUsd = Number(process.argv[3] ?? 0.6);
const g = new Game(makeOpenAiProvider(), seed);
const view = () => (g as unknown as { reckoningView(): { writing: boolean; lines: string[] } | null }).reckoningView();

for (let c = 0; c < 8; c++) {
  if (g.ai.usage().costUsd > maxUsd) { console.log('[cost cap]'); break }
  g.ghUpgrade();
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall']) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || st.reason) continue;
    g.build(b); break;
  }
  for (const l of g.visibleLeads().slice(0, 3)) await g.pursue(l.id);
  for (const q of g.state.quests.filter(q => q.state === 'open'))
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i]!.filledBy) continue;
      const m = g.roster().find(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
      if (m) g.assign(q.id, i, m.id);
    }
  const marching = g.state.quests.filter(q => q.state === 'open'
    && (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy)).length;

  const t0 = Date.now();
  let last = -1, lastWriting: boolean | null = null;
  const poll = setInterval(() => {
    const v = view();
    if (!v) return;
    if (v.lines.length !== last || v.writing !== lastWriting) {
      const t = ((Date.now() - t0) / 1000).toFixed(1).padStart(5);
      const newLines = v.lines.slice(Math.max(last, 0));
      console.log(`  t+${t}s  ${String(v.lines.length).padStart(3)} lines  writing=${v.writing}` +
        (last >= 0 && newLines.length ? `   ← ${newLines[0]!.slice(0, 62)}` : ''));
      last = v.lines.length; lastWriting = v.writing;
    }
  }, 250);
  console.log(`\n=== cycle ${g.state.cycle} → resolving (${marching} quest(s) marching) ===`);
  await g.endCycle();
  clearInterval(poll);
  console.log(`  DONE at t+${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (marching >= 2) { console.log('\n(two-quest cycle observed — that is the case that proves arrival order)'); break }
}
console.log(`\ncost $${g.ai.usage().costUsd.toFixed(3)} · ${g.ai.usage().calls} calls`);
