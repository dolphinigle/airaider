// N fresh sagas (one per seed) — for counting what every bible leans on.
// Usage: OUT=<json> npx tsx scripts/_genesisbatch.ts [n] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
const N = Number(process.argv[2] ?? 8), SEED = Number(process.argv[3] ?? 7070);
const ai = makeOpenAiProvider();
const out: unknown[] = [];
await Promise.all(Array.from({ length: N }, async (_, k) => {
  const g = new Game(ai, SEED + k * 11);
  g.build('map-room'); g.build('lead-room');
  g.state.leads.push({ id: 'gb', rarity: 'uncommon', level: 3, region: 'forests', archetype: 'investigate',
    chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward' });
  const r = await g.pursue('gb');
  const c = g.state.chains.at(-1);
  if (r.ok && c) out.push({ title: c.bible.title, kernel: c.bible.kernel, bible: c.bible });
}));
fs.writeFileSync(process.env.OUT!, JSON.stringify(out));
console.log(out.length, `$${ai.usage().costUsd.toFixed(2)}`);
