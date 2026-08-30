// Does a personal saga end up ABOUT the soldier? Real AI: give a merc a real past, spawn their
// personal chain, and read what the writers'-room made of it.
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { guardEdges } from '../src/engine/lore.js';
const g = new Game(makeOpenAiProvider(), Number(process.argv[2] ?? 268));
g.build('map-room'); g.build('lead-room');
const merc = g.roster()[0]!;

// a past worth a saga, as the game itself would have recorded it
const other = g.roster()[1]!;
guardEdges(g.state.lore, [{ from: merc.id, to: other.id, type: 'saved-by',
  blurb: `${other.name} once tended ${merc.name}'s hunting wound in the woods and kept him from dying`,
  importance: 0.9 }], 1, () => 'e-past');
console.log(`focal: ${merc.name} · seed the engine will deal:`);
console.log('  "' + (g as unknown as { personalSeed(c: unknown): string }).personalSeed(merc) + '"\n');
const lead = (g as unknown as { spawnPersonalChainLead(m: unknown): void });
lead.spawnPersonalChainLead(merc);
const pl = g.state.leads.find(l => l.source === 'personal')!;
const r = await g.pursue(pl.id);
if (!r.ok) { console.log('pursue failed:', r.msg); process.exit(1) }
const c = g.state.chains.at(-1)!;
console.log('TITLE :', c.bible.title);
console.log('KERNEL:', c.bible.kernel);
console.log('GOAL  :', c.bible.goal);
console.log('CAST  :', c.bible.cast.map(m => `${m.name} (${m.role})`).join(' · '));
console.log('ARC 1 :', c.bible.arc[0]);
const q = g.state.quests.find(x => x.id === r.questId);
console.log('\nCARD  :', q?.situation);
console.log(`\n$${g.ai.usage().costUsd.toFixed(2)}`);
