// Probe: does the new CHARACTER-CARD who-line register land (FEH calibration, 2026-07-11)?
// Boots a fresh game (3 starters + a rescue), runs the flesh pass, prints who/backstory/quirks.
// Usage: npx tsx scripts/_whoprobe.ts [seed]

import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const seed = Number(process.argv[2] ?? 41501);
const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room');
await g.endCycle();   // flesh pass covers the starters

for (const c of g.state.cards.filter(x => x.character?.who)) {
  console.log(`■ ${c.name} [${c.character!.role}]`);
  console.log(`  WHO: ${c.character!.who}`);
  console.log(`  BACKSTORY: ${c.character!.backstory ?? '—'}`);
  console.log(`  QUIRKS: ${(c.character!.quirks ?? []).join(' · ')}\n`);
}
console.log(`AI ~$${g.ai.usage().costUsd.toFixed(2)}`);
