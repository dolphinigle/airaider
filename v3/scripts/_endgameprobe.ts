// TRUE-ENDGAME probe: GH T15 fort, ALL regions unlocked (incl. Outskirts via the four spine
// keys), L28 veterans — real-AI cycles so coast/highlands/underdeep/outskirts content gets
// generated and read at least once. Usage: npx tsx scripts/_endgameprobe.ts [seed] [cycles]

import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { mintStackable } from '../src/engine/cards.js';
import { coins } from '../src/engine/roll.js';

const seed = Number(process.argv[2] ?? 71501);
const cycles = Number(process.argv[3] ?? 14);
const LOG = process.argv[4] ?? `/tmp/claude-1000/-home-irvan-airaider/0da9b8cc-d79e-4c0c-b143-a0d9fac32444/scratchpad/endgameprobe-${seed}.log`;

const g = new Game(makeOpenAiProvider(), seed);
const out: string[] = [];
const say = (s: string) => out.push(s);

g.state.cards.push(mintStackable('gold', 10_000_000));
g.state.fort.ghTier = 15;
for (let i = 0; i < 24; i++) g.excavate();
for (const b of ['map-room', 'lead-room', 'tavern', 'dungeon', 'library',
  'scouting-forests', 'scouting-city', 'scouting-coast', 'scouting-highlands', 'scouting-underdeep',
  'endgame-forests', 'endgame-city', 'endgame-coast', 'endgame-highlands']) {
  const r = g.build(b);
  say(`build ${b}: ${r.ok ? 'ok' : r.msg}`);
}
for (const m of g.roster()) {
  m.character!.level = 28;
  m.character!.attrs = { str: 24, dex: 24, int: 24, cha: 24, con: 24 };
}
say(`unlockedRegions: ${g.state.unlockedRegions.join(', ')}`);

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > 1.4) { say('[cost cap]'); break }
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  const liveChains = g.state.chains.filter(x => x.state === 'active' || x.state === 'finale-pending').length;
  // BREADTH: far regions first (the starter packet is all forests and drowned round 1),
  // and skip the day-0 packet + founder personal leads entirely
  const leads = [...g.visibleLeads()]
    .filter(l => l.source !== 'starter' && l.source !== 'personal')
    .filter(l => l.chainInfo.kind !== 'starts-new' || liveChains < 2)
    .sort((a, b) => {
      const pri: Record<string, number> = { underdeep: 0, outskirts: 0, highlands: 1, coast: 1, city: 2, forests: 3 };
      return (pri[a.region] ?? 2) - (pri[b.region] ?? 2);
    });
  for (const lead of leads) {
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
const regionsSeen = new Set(g.state.quests.map(q => q.region));
say(`\n════ regions unlocked: ${g.state.unlockedRegions.join(',')} · AI ${g.ai.usage().calls} calls ~$${g.ai.usage().costUsd.toFixed(2)} ════`);
fs.writeFileSync(LOG, out.join('\n'));
console.log(`done → ${LOG} (${out.length} lines)`);
