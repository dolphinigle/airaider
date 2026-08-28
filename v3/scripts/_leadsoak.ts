// Soak the lead-bonus paths that a short run never reaches: leads EARNED with a band, banded
// leads going COLD, a banded lead opening a SAGA, and whether bonuses drift over a long game.
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { leadBand, expectedSlots } from '../src/engine/quests.js';
import { vBase, RARITY_MULT } from '../src/engine/economy.js';
const ratios: number[] = [];

const seen = { earned: 0, cold: 0, saga: 0, pursued: 0 };
const bands = [0, 0, 0, 0, 0];      // pursued
const granted = [0, 0, 0, 0, 0];    // every lead the game handed out
const lines: string[] = [];
for (const seed of [3, 17, 55, 108, 900]) {
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room');
  let built = false;
  for (let c = 0; c < 45; c++) {
    for (const l of [...g.visibleLeads()]) {
      if (g.state.quests.filter(q => q.state === 'open').length >= 3) break;
      const b = leadBand(l);
      if (b.band) { seen.pursued++; bands[b.band]!++; if (l.chainInfo.kind === 'starts-new') seen.saga++ }
      await g.pursue(l.id);
    }
    g.autoAssignAll();
    await g.endCycle();
    // the reckoning REPORT is where these land (say() pushes into the cycle's blocks), not state.log
    for (const t of g.lastReckoningBlocks().flat()) {
      if (/A lead earned/.test(t)) { seen.earned++; if (lines.length < 4) lines.push(`  earned: ${t}`) }
      if (/went cold/.test(t)) { seen.cold++; if (lines.length < 14) lines.push(`  cold:   ${t}`) }
    }
    for (const l of g.state.leads) {
      const k = l as { _b?: boolean };
      if (k._b) continue; k._b = true; granted[leadBand(l).band]!++;
      if ((l.bonus ?? 0) > 0) ratios.push(l.bonus! / (vBase(l.level) * RARITY_MULT[l.rarity] * expectedSlots(l.archetype, l.rarity)));
    }
    if (!built) { if (g.freeCells().length === 0) g.excavate(); g.build('lead-room'); built = g.build('scouting-forests').ok }
  }
  // nothing should ever carry a negative or absurd bonus
  for (const l of g.state.leads) {
    if ((l.bonus ?? 0) < 0) lines.push(`  !! NEGATIVE bonus on ${l.id}: ${l.bonus}`);
    if ((l.bonus ?? 0) > 100000) lines.push(`  !! ABSURD bonus on ${l.id}: ${l.bonus}`);
  }
}
console.log(`earned messages ${seen.earned} · cold messages ${seen.cold} · banded leads pursued ${seen.pursued} (${seen.saga} of them sagas)`);
console.log(`bands pursued: 1★ ${bands[1]} · 2★ ${bands[2]} · 3★ ${bands[3]} · 4★ ${bands[4]}`);
const gt = granted.reduce((a, b) => a + b, 0), gb = granted.slice(1).reduce((a, b) => a + b, 0);
console.log(`EVERY lead the game handed out (${gt}): unbanded ${granted[0]} · 1★ ${granted[1]} · 2★ ${granted[2]} · 3★ ${granted[3]} · 4★ ${granted[4]}`);
console.log(`  of the ${gb} banded: ${[1,2,3,4].map(i => `${i}★ ${Math.round(100*granted[i]!/gb)}%`).join(' · ')}`);
ratios.sort((a, b) => a - b);
const q = (p: number) => ratios[Math.floor(ratios.length * p)]!.toFixed(2);
console.log(`\nratios IN PLAY  p25 ${q(.25)} · p50 ${q(.5)} · p75 ${q(.75)} · p90 ${q(.9)} · max ${ratios[ratios.length-1]!.toFixed(2)}`);
console.log('spread under candidate thresholds:');
for (const t of [[0.4,1.0,2.5],[0.3,0.7,1.3],[0.25,0.55,1.0],[0.2,0.45,0.85]]) {
  const c=[0,0,0,0]; for (const r of ratios) c[r<=t[0]!?0:r<=t[1]!?1:r<=t[2]!?2:3]!++;
  console.log(`  ≤${t[0]} ≤${t[1]} ≤${t[2]}   ${c.map((x,i)=>`${i+1}★ ${String(Math.round(100*x/ratios.length)).padStart(2)}%`).join(' · ')}`);
}
for (const l of lines) console.log(l);
