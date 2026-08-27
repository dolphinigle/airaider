// START-SCUM WITHOUT RESTARTING. The two founders are rolled by the seeded engine before any AI
// call, so a seed's starting roster can be shown instantly and for free — no server bounce, no
// tokens. Browse, pick the one you want, then boot the game pinned to that seed.
// Usage: npx tsx scripts/seedroll.ts [count] [firstSeed]
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { renderTags } from '../src/engine/tags.js';

const count = Number(process.argv[2] ?? 20);
const first = process.argv[3] ? Number(process.argv[3]) : Date.now() % 2 ** 31;

console.log(`\n  seed        the two who are already at the fort`);
console.log(`  ${'─'.repeat(96)}`);
for (let i = 0; i < count; i++) {
  const seed = (first + i * 7919) % 2 ** 31;          // spread, so neighbours aren't near-twins
  const g = new Game(new MockProvider(seed), seed);
  const rows = g.roster().map(m => {
    const a = m.character!.attrs;
    const stats = `S${a.str.toFixed(0)} D${a.dex.toFixed(0)} I${a.int.toFixed(0)} C${a.cha.toFixed(0)} N${a.con.toFixed(0)}`;
    return `${m.name.padEnd(24)} ${stats}  ${renderTags(m.tags).replace(/character; /, '')}`;
  });
  console.log(`  ${String(seed).padEnd(11)} ${rows[0]}`);
  for (const r of rows.slice(1)) console.log(`  ${' '.repeat(11)} ${r}`);
  console.log('');
}
console.log(`  Pick one, then start that exact game:`);
console.log(`    cd v3 && AIRAIDER_SEED=<seed> AIRAIDER_FRESH=1 npm run gui:ai\n`);
