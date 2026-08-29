// Find a starting roster matching what the designer wants to playtest with.
// Founders are engine-rolled and deterministic from the seed — no AI needed.
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { renderTags } from '../src/engine/tags.js';
const has = (c: any, ...w: string[]) => w.every(x => c.tags.some((t: any) => t.concept === x));
const hits: string[] = [];
for (let seed = 1; seed <= 60000 && hits.length < 8; seed++) {
  const g = new Game(new MockProvider(seed), seed);
  const r = g.roster();
  if (r.length < 2) continue;
  const wolf = r.find(c => has(c, 'wolfman', 'male'));
  const human = r.find(c => has(c, 'human', 'male') && c.id !== wolf?.id);
  if (!wolf || !human) continue;
  const burly = has(wolf, 'muscular') ? 'muscular' : 'tough';
  hits.push(`seed ${String(seed).padStart(5)}  ${wolf.name} — ${renderTags(wolf.tags)}\n              ${human.name} — ${renderTags(human.tags)}`);
}
console.log(hits.join('\n\n') || 'none found');
