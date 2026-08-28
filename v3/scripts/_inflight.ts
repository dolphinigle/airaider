// Does raising maxInFlight actually shorten the wait? Queue N one-offs, drain, wall-clock it.
// Usage: npx tsx scripts/_inflight.ts <cap> [n]
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import type { Lead } from '../src/engine/quests.js';
import { ARCHETYPE_NAMES } from '../src/engine/archetypes.js';

const cap = Number(process.argv[2] ?? 5);
const n = Number(process.argv[3] ?? 5);
const g = new Game(makeOpenAiProvider(), 5150);
g.build('map-room'); g.build('dungeon');
g.maxInFlight = cap;
const pool = ARCHETYPE_NAMES.filter(a => a !== 'lead-hunt');
for (let i = 0; i < n; i++) {
  const lead: Lead = { id: `p-${i}`, rarity: 'common', level: 2, region: 'forests',
    archetype: pool[i * 7 % pool.length]!, chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward' };
  g.state.leads.push(lead);
  g.enqueuePursue(lead.id);
}
const t0 = Date.now();
await g.drain();
const secs = (Date.now() - t0) / 1000;
const done = g.state.quests.length;
console.log(`cap ${cap} · ${n} cards · ${secs.toFixed(1)}s · ${done} written · $${g.ai.usage().costUsd.toFixed(3)}`);
