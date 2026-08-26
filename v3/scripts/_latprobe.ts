// Latency probe (async-phase groundwork): plays a few cycles with the REAL provider and
// reports per-purpose wall-clock, plus the wall-clock of each BLOCKING player action.
// Usage: npx tsx scripts/_latprobe.ts [cycles] [seed] [maxUsd]
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const cycles = Number(process.argv[2] ?? 5);
const seed = Number(process.argv[3] ?? 4242);
const maxUsd = Number(process.argv[4] ?? 0.5);
const g = new Game(makeOpenAiProvider(), seed);

const blocking: { action: string; ms: number; calls: number }[] = [];
const timed = async <T>(action: string, fn: () => Promise<T>) => {
  const c0 = g.ai.usage().calls, t0 = Date.now();
  const r = await fn();
  blocking.push({ action, ms: Date.now() - t0, calls: g.ai.usage().calls - c0 });
  return r;
};

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > maxUsd) { console.log(`[cost cap at cycle ${c}]`); break }
  g.ghUpgrade();
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall']) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || st.reason) continue;
    g.build(b); break;
  }
  // pursue up to 2 leads per cycle
  for (const l of g.visibleLeads().slice(0, 2)) {
    const r = await timed(`pursue(${l.archetype}/${l.chainInfo.kind})`, () => g.pursue(l.id));
    if (!r.ok) blocking.pop();
  }
  // staff whatever we can
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i]!.filledBy) continue;
      const m = g.roster().find(m => m.location.kind === 'held');
      if (m) g.assign(q.id, i, m.id);
    }
  }
  await timed('endCycle', () => g.endCycle());
}

const log = g.ai.callLog();
const byPurpose: Record<string, number[]> = {};
for (const r of log) (byPurpose[r.purpose] ??= []).push(r.durationMs);
const stat = (v: number[]) => { const s = [...v].sort((a, b) => a - b);
  return `n=${s.length} median=${(s[s.length >> 1]! / 1000).toFixed(1)}s min=${(s[0]! / 1000).toFixed(1)}s max=${(s[s.length - 1]! / 1000).toFixed(1)}s` };
console.log('\n=== per AI call ===');
for (const [p, v] of Object.entries(byPurpose)) console.log(`${p.padEnd(12)} ${stat(v)}`);
console.log('\n=== per BLOCKING player action (what the GUI freezes for) ===');
for (const b of blocking) console.log(`${b.action.padEnd(34)} ${(b.ms / 1000).toFixed(1)}s  (${b.calls} calls)`);
const byAct: Record<string, number[]> = {};
for (const b of blocking) (byAct[b.action.split('(')[0]!] ??= []).push(b.ms);
console.log('');
for (const [a, v] of Object.entries(byAct)) console.log(`${a.padEnd(12)} ${stat(v)}`);
console.log(`\ncost $${g.ai.usage().costUsd.toFixed(3)} · ${g.ai.usage().calls} calls`);
