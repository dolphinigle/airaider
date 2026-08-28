// RECURRING_CAST §6 — does the cast actually form? Mock AI, long campaigns.
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
const RUNS = 8, CYCLES = 120;
let nodes = 0, edgeless = 0, sagas = 0, reuses = 0, closed = 0, pool = 0; const states: string[] = [];
const appear: number[] = [];
for (let s = 0; s < RUNS; s++) {
  const g = new Game(new MockProvider(s), s);
  g.build('map-room'); g.build('lead-room'); g.build('dungeon');
  for (let c = 0; c < CYCLES; c++) {
    for (const l of g.visibleLeads()) await g.pursue(l.id);
    g.autoAssignAll(); await g.endCycle();
  }
  const chars = Object.values(g.state.lore.nodes).filter(n => n.kind === 'character');
  const loreOnly = chars.filter(n => !g.card(n.id) && !g.state.cards.some(c => c.name === n.name));
  closed += g.state.chains.filter((c: any) => c.state === 'done' || c.state === 'closed' || c.state === 'finale-done').length;
  states.push(...g.state.chains.map((c: any) => c.state));
  pool += loreOnly.length;
  nodes += chars.length;
  edgeless += chars.filter(n => !g.state.lore.edges.some(e => e.from === n.id || e.to === n.id)).length;
  sagas += g.state.chains.length;
  reuses += (g as unknown as { knownCastSagas: number }).knownCastSagas;
  // how often each face is touched by an edge = how many matters they are in
  for (const n of chars) appear.push(g.state.lore.edges.filter(e => e.from === n.id || e.to === n.id).length);
}
const two = appear.filter(x => x >= 2).length, three = appear.filter(x => x >= 3).length;
console.log(`${RUNS} campaigns x ${CYCLES} cycles · θ=${process.env.CAST_THETA ?? 4}`);
console.log(`  sagas per campaign:        ${(sagas/RUNS).toFixed(1)}`);
console.log(`  known faces reused:        ${(reuses/RUNS).toFixed(1)} per campaign`);
console.log(`  character nodes:           ${(nodes/RUNS).toFixed(1)} per campaign`);
console.log(`  EDGELESS nodes:            ${(edgeless/RUNS).toFixed(1)}  (goal: 0)`);
console.log(`  faces in 2+ matters:       ${(two/RUNS).toFixed(1)}`);
console.log(`  faces in 3+ matters:       ${(three/RUNS).toFixed(1)}`);
console.log(`  LORE-ONLY faces (the reuse pool): ${(pool/RUNS).toFixed(1)} per campaign`);
console.log('  chain states seen:', JSON.stringify(states.reduce((a: any,x)=>((a[x]=(a[x]||0)+1),a),{})));
