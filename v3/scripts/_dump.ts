import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { Lead } from '../src/engine/quests.js';
const g = new Game(new MockProvider(3), 3);
g.build('map-room');
const orig = (g as any).ai;
let cap: any = null;
(g as any).ai = new Proxy(orig, { get(t, p) {
  if (p === 'writeQuest') return async (...a: any[]) => { cap = a[0]; return (t as any)[p](...a) };
  return (t as any)[p];
}});
const lead: Lead = { id: 'x', rarity: 'rare', level: 4, region: 'forests', archetype: 'hunt',
  chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward' };
g.state.leads.push(lead);
await g.pursue('x');
console.log(JSON.stringify(cap, null, 1));
