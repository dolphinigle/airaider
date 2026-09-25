// RECURRING_CAST §5 A/B, parallel: N independent worlds, each already holding six known faces, each
// opening ONE saga — only returning-face sagas are kept, and only beat 1's card is read.
// Usage: OUT=<md> KEY=<json> ARM=<label> npx tsx scripts/_knownface2.ts [worlds] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { guardEdges } from '../src/engine/lore.js';
const N = Number(process.argv[2] ?? 16), SEED = Number(process.argv[3] ?? 881);
const ai = makeOpenAiProvider();
const FACES: [string, string, string][] = [
  ['Maldea', 'A widow who holds the burned grange on the ridge.', 'hired the company to buy back the men who fired her farm'],
  ['Asbjorn of the Pass', 'A hard-faced trader who moves prisoners on the forest roads.', 'sold a prisoner out from under the company and kept the fee'],
  ['Hanala', 'A scrawny elven servant who knows the smaller paths.', 'guided the company through the winter huts and asked for a place'],
  ['Norion Dawnsinger', 'A woodland steward who manages the border cutting rights.', 'paid the company late, and blamed the grove for it'],
  ['Bausanne', 'An elf peasant with a quick hand and a temper.', 'was taken by the company and let go at the ford'],
  ['Kymme Ashworth', 'A sickly chapel priest with a clever tongue.', 'was sold to cover a market debt before the company found him'],
];
const rows: { face: string; record: string; card: string; job: string }[] = [];
await Promise.all(Array.from({ length: N }, async (_, k) => {
  const g = new Game(ai, SEED + k * 17);
  g.build('map-room'); g.build('lead-room');
  FACES.forEach(([name, blurb], i) => { g.state.lore.nodes[`lore-k${i}`] = { id: `lore-k${i}`, kind: 'character', name, blurb, identity: blurb, active: true, createdCycle: 0 } });
  const TYPES = ['party-to', 'rival-of', 'owes', 'betrayed-by', 'saved-by'] as const;
  // every face gets its OWN memory with the company (an edge to a founder), so the record is real
  const founder = g.roster()[0]!; g.ensureLoreNode(founder);
  FACES.forEach(([, , memory], i) => guardEdges(g.state.lore, [{ from: `lore-k${i}`, to: founder.id, type: TYPES[i % TYPES.length]!, blurb: memory, importance: 0.7 }], 1, () => `ek${k}-${i}`));
  g.state.leads.push({ id: 'kf', rarity: 'uncommon', level: 3, region: 'forests', archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward' });
  const r = await g.pursue('kf');
  const chain = g.state.chains.at(-1); const focal = chain ? g.card(chain.focalId) : undefined;
  if (!r.questId || !focal || !FACES.some(f => f[0] === focal.name)) return;
  const q = g.state.quests.find(x => x.id === r.questId)!;
  rows.push({ face: focal.name, record: FACES.find(f => f[0] === focal.name)![2], card: q.situation ?? '', job: q.job ?? '' });
}));
fs.writeFileSync(process.env.OUT!, JSON.stringify(rows));
console.log(rows.length, 'returning-face cards', `$${ai.usage().costUsd.toFixed(2)}`);
