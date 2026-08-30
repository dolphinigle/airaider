import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { buildCost, upgradeCost, ROOM_TYPE, GH_THRESHOLDS } from '../src/engine/fort.js';
import { generateCard } from '../src/engine/economy.js';
import { Rng } from '../src/engine/rng.js';
const g = new Game(new MockProvider(268), 268);
const gold = () => g.state.cards.filter(c => c.kind === 'gold').reduce((n, c) => n + (c.qty ?? 0), 0);
const show = (t: string) => console.log(`  ${t.padEnd(38)} prestige ${g.prestige().toFixed(2)}   gold ${gold()}`);
console.log(`GH2 needs ${GH_THRESHOLDS[2]} prestige · kitchen ${buildCost(ROOM_TYPE['kitchen']!)}g, first slot ${upgradeCost(ROOM_TYPE['kitchen']!, 0)}g\n`);
show('start');
console.log(' ', g.build('kitchen').msg);           show('kitchen built (0 slots)');
const room = g.state.fort.rooms.find(r => r.type === 'kitchen')!;
console.log(' ', g.upgrade(room.id).msg);            show('kitchen upgraded → 1 slot');
// a plain relic, as a quest would hand you
const rng = new Rng(5);
for (const [label, want] of [['a NON-matching relic', 'x'], ['a food/furniture relic', 'food']] as const) {
  const c = generateCard(rng, { domain: 'relic', targetV: 40, contentLevel: 2 });
  if (want === 'food') c.tags.push({ concept: 'food', rank: 2 } as never);
  (g as any).addCard(c);
  const r = g.slot(room.id, 0, c.id);
  console.log(' ', r.msg);
  show(`kitchen + ${label}`);
  if (g.prestige() >= 2) break;
  g.unslot(room.id, 0);
}
console.log('\n ', g.ghUpgrade().msg);
