// POV reading harness — real-AI quest generation, prints each writeQuest's
// engine opening seed next to the situation prose it produced, plus one full prompt.
// Usage: npx tsx scripts/povread.ts [cycles] [seed] [maxUsd]

import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins } from '../src/engine/roll.js';

const cycles = Number(process.argv[2] ?? 8);
const seed = Number(process.argv[3] ?? 4242);
const maxUsd = Number(process.argv[4] ?? 1);

const g = new Game(makeOpenAiProvider(), seed);
const ORDER = ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall', 'infirmary'];

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > maxUsd) { console.log(`[cost cap hit at cycle ${c}]`); break }
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ORDER) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || st.reason) continue;
    g.build(b);
    break;
  }
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  const liveChains = g.state.chains.filter(x => x.state === 'active' || x.state === 'finale-pending').length;
  for (const lead of [...g.visibleLeads()]) {
    if (lead.chainInfo.kind === 'starts-new' && liveChains >= 2) continue;
    await g.pursue(lead.id);
  }
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
      const free = fit();
      if (!free.length) break;
      const best = free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!;
      g.assign(q.id, i, best.id);
    }
  }
  await g.endCycle();
}

// ---- read the writeQuest calls ----
const recs = g.ai.callLog().filter(r => r.purpose === 'writeQuest');
let shownSystem = false;
for (const r of recs) {
  let opening = '?', kind = '?', situation = '(no output)', title = '?';
  try {
    const u = JSON.parse(r.userPrompt);
    opening = `${u.opening?.spark} · landmarkShown:${/Thornhollow/.test(u.location ?? '')}`;
    kind = u.beat !== undefined && u.beat !== null ? `beat ${u.beat}` : 'one-off';
  } catch { /* truncated */ }
  try {
    const o = JSON.parse(r.output ?? '{}');
    situation = o.situation ?? situation;
    title = o.title ?? title;
  } catch { /* truncated */ }
  console.log(`\n■ [${kind}] ${title}\n  SEED: ${opening}\n  ${situation}`);
  if (!shownSystem) { console.log(`\n---- FULL SYSTEM PROMPT (as the model sees it) ----\n${r.systemPreview}\n----`); shownSystem = true }
}
const u = g.ai.usage();
console.log(`\nAI: ${u.calls} calls · ~$${u.costUsd.toFixed(2)}`);
