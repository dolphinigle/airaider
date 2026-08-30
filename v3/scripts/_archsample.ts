// Real-AI one-off cards across a SPREAD of archetypes, each printed beside its gloss so the
// PAIRING can be audited: does the card the AI wrote actually do what the archetype promised?
// Leads are injected (chainInfo none) — the board grants ~8 leads in 26 cycles, far too few to
// cover a hundred-row pool.
// Usage: OUT=<file> npx tsx scripts/_archsample.ts [seed] [n] [offset]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ARCHETYPE_NAMES, glossOf, profileOf, type Archetype } from '../src/engine/archetypes.js';
import { Rng } from '../src/engine/rng.js';
import type { Lead } from '../src/engine/quests.js';

const seed = Number(process.argv[2] ?? 6001);
const want = Number(process.argv[3] ?? 18);
const off = Number(process.argv[4] ?? 0);
const rng = new Rng(seed);
const pool = [...ARCHETYPE_NAMES];   // ALL of them, faucets included
const picks = pool.slice(off, off + want);

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('dungeon');
const out: string[] = [];
for (const [i, arch] of picks.entries()) {
  const lead: Lead = {
    id: `inj-${i}`, rarity: rng.pick(['common', 'common', 'uncommon']), level: 1 + (i % 4),
    region: 'forests', archetype: arch, chainInfo: { kind: 'none' },
    expiresAtCycle: null, source: 'reward',
  };
  g.state.leads.push(lead);
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) { console.log(`!! ${arch}: ${r.msg}`); continue }
  const q = g.state.quests.find(x => x.id === r.questId)!;
  out.push(`### ${arch}  [${profileOf(arch)}]\nGLOSS: ${glossOf(arch)}\nTITLE: ${q.title}\nCARD:  ${q.situation}\nJOB:   ${q.job}\n`);
  console.log(out[out.length - 1]);
}
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/archsample.md', out.join('\n'));
console.log(`\n${out.length} cards · ~$${g.ai.usage().costUsd.toFixed(2)}`);
