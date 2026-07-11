// LATE-GAME probe: no real campaign has ever reached GH T4+ — fast-forward a fort there and
// run REAL-AI cycles with the City unlocked, so region-2 quests/genesis/prose get read at least
// once before a human hits them. Usage: npx tsx scripts/_lateprobe.ts [seed] [cycles]

import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { mintStackable } from '../src/engine/cards.js';
import { coins } from '../src/engine/roll.js';

const seed = Number(process.argv[2] ?? 61501);
const cycles = Number(process.argv[3] ?? 12);
const LOG = process.argv[4] ?? `/tmp/claude-1000/-home-irvan-airaider/0da9b8cc-d79e-4c0c-b143-a0d9fac32444/scratchpad/lateprobe-${seed}.log`;

const g = new Game(makeOpenAiProvider(), seed);
const out: string[] = [];
const say = (s: string) => out.push(s);

// fast-forward: rich fort at GH T5 with both regions scouted; mercs leveled to city band
g.state.cards.push(mintStackable('gold', 50_000));
g.state.fort.ghTier = 5;
for (let i = 0; i < 8; i++) g.excavate();
for (const b of ['map-room', 'lead-room', 'tavern', 'scouting-forests', 'scouting-city', 'recruiting-city', 'library']) {
  const r = g.build(b);
  say(`build ${b}: ${r.ok ? 'ok' : r.msg}`);
}
for (const m of g.roster()) {
  m.character!.level = 8;
  m.character!.attrs = { str: 9, dex: 9, int: 9, cha: 9, con: 9 };
}
say(`unlockedRegions: ${g.state.unlockedRegions.join(', ')}`);

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > 1.2) { say('[cost cap]'); break }
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  const liveChains = g.state.chains.filter(x => x.state === 'active' || x.state === 'finale-pending').length;
  for (const lead of [...g.visibleLeads()].filter(l => l.chainInfo.kind !== 'starts-new' || liveChains < 2)) {
    const open = g.state.quests.filter(q => q.state === 'open')
      .reduce((s, q) => s + q.slots.filter(x => !x.filledBy).length, 0);
    if (open >= fit().length) break;
    const r = await g.pursue(lead.id);
    if (r.ok && r.questId) {
      const q = g.state.quests.find(x => x.id === r.questId)!;
      say(`\nc${g.state.cycle} ▶ [${q.rarity} · ${q.region}${q.chainId ? (q.isFinale ? ' · FINALE' : ` · beat ${q.beatIndex}`) : ` · ${q.archetype}`} · L${q.level}] ${q.title}`);
      say(`  ${q.situation}`);
    }
  }
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    const active = q.slots.filter(s => !q.approaches || s.groupId === q.chosenApproach);
    if (active.filter(s => !s.filledBy).length > fit().length) continue;
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
      const free = fit();
      if (!free.length) break;
      g.assign(q.id, i, free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!.id);
    }
  }
  for (const line of await g.endCycle()) say(`  ${line}`);
}
say(`\n════ regions: ${g.state.unlockedRegions.join(',')} · gold ${g.gold()} · AI ${g.ai.usage().calls} calls ~$${g.ai.usage().costUsd.toFixed(2)} ════`);
fs.writeFileSync(LOG, out.join('\n'));
console.log(`done → ${LOG} (${out.length} lines)`);
