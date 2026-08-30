// Render the FULL one-off prompt for a given archetype+method, for the context-free verifier gate.
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { Lead } from '../src/engine/quests.js';
const arch = process.argv[2] ?? 'lead-hunt';
const g = new Game(new MockProvider(7), 7);
g.build('map-room');
let cap: any = null;
const orig: any = (g as any).ai;
(g as any).ai = new Proxy(orig, { get(t: any, p: any) {
  if (p === 'writeQuest') return async (...a: any[]) => { cap = a[0]; return t[p](...a) };
  return t[p];
}});
const lead: Lead = { id: 'x', rarity: process.argv[3] === 'heavy' ? 'rare' : 'common',
  level: 2, region: 'forests', archetype: arch as never,
  chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward' };
g.state.leads.push(lead);
await g.pursue('x');
console.log(JSON.stringify({ archetype: cap.archetype, method: cap.method, keywords: cap.keywords, gravity: cap.gravity }, null, 1));
