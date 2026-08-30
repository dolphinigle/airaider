// A/B for the personal-saga seed. Is the saga ABOUT the soldier whose past it is, or a generic
// premise with them attached? PERSONAL_SEED=0 gives the old behaviour.
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { guardEdges } from '../src/engine/lore.js';

const SEED = Number(process.argv[2] ?? 268);
const N = Number(process.argv[3] ?? 4);
const out: string[] = [];
for (let k = 0; k < N; k++) {
  const g = new Game(makeOpenAiProvider(), SEED + k * 31);
  g.build('map-room'); g.build('lead-room');
  const merc = g.roster()[0]!, other = g.roster()[1]!;
  g.ensureLoreNode(merc); g.ensureLoreNode(other);
  // a past the game itself would have recorded
  const pasts = [
    [`${other.name} once tended ${merc.name}'s wound in the woods and kept him from dying`, 'saved-by'],
    [`${merc.name} left ${other.name} behind at a crossing and has never said why`, 'betrayed-by'],
    [`${merc.name} still owes a debt to the house that raised him`, 'owes'],
    [`${merc.name} was named for a man the village hanged`, 'scarred-by'],
  ] as const;
  const [blurb, type] = pasts[k % pasts.length]!;
  guardEdges(g.state.lore, [{ from: merc.id, to: other.id, type, blurb, importance: 0.9 }], 1, () => `ep${k}`);
  (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
  const pl = g.state.leads.find(l => l.source === 'personal');
  if (!pl) { console.log('no personal lead'); continue }
  const r = await g.pursue(pl.id);
  if (!r.ok) { console.log('fail:', r.msg); continue }
  const c = g.state.chains.at(-1)!;
  const q = g.state.quests.find(x => x.id === r.questId);
  out.push([`THE SOLDIER: ${merc.name}`, `THEIR PAST: ${blurb}`, ``,
    `TITLE: ${c.bible.title}`, `KERNEL: ${c.bible.kernel}`, `GOAL: ${c.bible.goal}`,
    `CAST: ${c.bible.cast.map(m => `${m.name} (${m.role})`).join(' · ')}`,
    `CARD: ${q?.situation ?? ''}`].join('\n'));
  console.log(`${k + 1}. ${c.bible.kernel}`);
}
fs.writeFileSync(process.env.OUT!, out.map((o, i) => `## ${i + 1}\n\n${o}`).join('\n\n---\n\n'));
console.log(`\n$${g_cost()}`); function g_cost() { return '' }
