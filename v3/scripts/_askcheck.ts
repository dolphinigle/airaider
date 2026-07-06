import { Game } from '/home/irvan/airaider/v3/src/game/game.js';
import { makeOpenAiProvider } from '/home/irvan/airaider/v3/src/ai/openai.js';
const g = new Game(makeOpenAiProvider(), 313131);
const ORDER = ['map-room', 'lead-room'];
for (let c = 0; c < 3; c++) {
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ORDER) { const st = g.buildableTypes().find(x => x.type === b); if (st && !st.reason) { g.build(b); break } }
  for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
  for (const q of g.state.quests) {
    console.log(`■ ${q.title}`);
    q.slots.forEach((s, i) => console.log(`  slot ${i}: attrs=${s.test.attributes} favored=[${s.test.favored}] clashing=[${s.test.clashing}]`));
  }
  g.state.quests = [];
  await g.endCycle();
}
console.log('cost', g.ai.usage().costUsd.toFixed(2));
