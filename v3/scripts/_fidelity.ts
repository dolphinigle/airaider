// Archetype fidelity survey: N cards per board archetype, so a blind reader can say whether each
// card reads as the kind of work it is. L32 predicts the mystery-shaped situation form warps the
// SERVICE archetypes (guard, escort, trade, negotiate, …) into investigations.
// Usage: OUT=<md> KEY=<json> npx tsx scripts/_fidelity.ts [perArch] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { boardPool, ARCHETYPES } from '../src/engine/archetypes.js';
const N = Number(process.argv[2] ?? 4), SEED = Number(process.argv[3] ?? 9090);
const ai = makeOpenAiProvider();
const pool = boardPool({ hasDungeon: true });
const rows: { arch: string; card: string; job: string }[] = [];
await Promise.all(Array.from({ length: N }, async (_, k) => {
  const g = new Game(ai, SEED + k * 7);
  g.build('map-room'); g.build('dungeon');
  for (const a of pool) g.state.leads.push({ id: `f-${a}`, rarity: 'common', level: 2, region: 'forests',
    archetype: a, chainInfo: { kind: 'none' }, expiresAtCycle: 40, source: 'reward' });
  await Promise.all(pool.map(async a => {
    const r = await g.pursue(`f-${a}`);
    const q = r.questId ? g.state.quests.find(x => x.id === r.questId) : undefined;
    if (q) rows.push({ arch: a, card: q.situation ?? '', job: q.job ?? '' });
  }));
}));
const shuffled = rows.map(r => ({ r, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.r);
fs.writeFileSync(process.env.KEY!, JSON.stringify(shuffled.map((r, i) => ({ id: `F${String(i + 1).padStart(3, '0')}`, arch: r.arch }))));
fs.writeFileSync(process.env.OUT!, shuffled.map((r, i) => `## F${String(i + 1).padStart(3, '0')}\nCARD: ${r.card}\nERRAND: ${r.job}`).join('\n\n'));
const glossLines = pool.map(a => `- ${a}: ${(ARCHETYPES as Record<string, { gloss: string }>)[a]!.gloss}`).join('\n');
fs.writeFileSync(process.env.OUT!.replace(/\.md$/, '-types.md'), glossLines);
console.log(rows.length, 'cards', `$${ai.usage().costUsd.toFixed(2)}`);
