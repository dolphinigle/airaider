// what the board looks like once the starter packet is gone
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { leadBand } from '../src/engine/quests.js';
const g = new Game(new MockProvider(4242), 4242);
g.build('map-room');
const seen = new Set<string>(); const ids = new Set<string>();
for (let c = 0; c < 26; c++) {
  for (const l of [...g.visibleLeads()]) if (g.state.quests.filter(q => q.state === 'open').length < 3) await g.pursue(l.id);
  g.autoAssignAll(); await g.endCycle();
  if (c === 12) { if (g.freeCells().length === 0) g.excavate(); g.build('dungeon') }
  for (const l of g.state.leads) { seen.add(l.archetype); ids.add(l.id) }
}
console.log('THE BOARD, cycle', g.state.cycle);
for (const l of g.visibleLeads()) {
  const b = leadBand(l);
  console.log(`  ${l.id.padEnd(9)} ${l.rarity.padEnd(8)} L${l.level} ${l.archetype.padEnd(20)} ${(b.band ? b.stars + ' ' + b.label : '').padEnd(24)} ${l.chainInfo.kind === 'starts-new' ? '✦STORY' : ''}`);
}
console.log(`\nleads created in 26 cycles: ${ids.size} · distinct archetypes among them: ${seen.size}`);
console.log([...seen].sort().join(' · '));
