// A rich scratch save for UI audits: a real-AI playtest save (pt64) plus gold, the captive rooms,
// a captive on the rack, and one resolved cycle so the reckoning has content. Mock AI only.
// Usage: npx tsx scripts/_mkfixture.ts [out=saves/_fixture.json]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
const out = process.argv[2] ?? 'saves/_fixture.json';
const g = Game.load(new MockProvider(7), fs.readFileSync('saves/pt64.json', 'utf8'));
g.addGold(4000);
for (let i = 0; i < 6; i++) g.excavate();
for (const t of ['holding-cell', 'torture-chamber', 'infirmary', 'kitchen', 'mess-hall', 'storage', 'dungeon-cell', 'gallery'])
  console.log(t, g.build(t).msg);
// prisoners: five minted captives — three accepted into the cells, two left waiting in holding
const G = g as any;
for (let i = 0; i < 5; i++) {
  const c = G.freshCharacter('captive', 4 + i, 50 + 10 * i, 'forests');
  G.addCard(c);
  c.location = { kind: 'held', state: 'staged' };
  g.state.holding.push({ cardId: c.id, expiresAtCycle: g.state.cycle + 4 });
  if (i < 3) console.log('accept', g.acceptCaptive(c.id).msg);
}
const rack = g.state.fort.rooms.find(r => r.type === 'torture-chamber')!;
while (rack.slots.length < 2 && g.upgrade(rack.id).ok) {}
const raw = g.captives()[0];
if (raw) console.log('rack:', g.slot(rack.id, 0, raw.id).msg);
// one prisoner already tamed, so a tamed captive can be set in a prestige room
const tame = g.captives().find(c => c.location.kind !== 'room');
if (tame) { (tame.tags as any[]).push({ concept: 'obedient' }); }
await g.endCycle();
for (const l of [...g.visibleLeads()].slice(0, 2)) await g.pursue(l.id);
fs.writeFileSync(out, g.save());
console.log('wrote', out, 'cycle', g.state.cycle, 'gold', g.gold(), 'captives', g.captives().length, 'quests', g.state.quests.filter(q => q.state === 'open').length, 'rooms', g.state.fort.rooms.length);
