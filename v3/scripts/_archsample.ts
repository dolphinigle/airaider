// Sample real-AI one-off cards across a SPREAD of archetypes, recording the gloss beside the card
// so the pairing can be audited. Usage: npx tsx scripts/_archsample.ts [seed] [n]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ARCHETYPE_NAMES, glossOf, profileOf, type Archetype } from '../src/engine/archetypes.js';
import { Rng } from '../src/engine/rng.js';

const seed = Number(process.argv[2] ?? 6001);
const want = Number(process.argv[3] ?? 18);
const rng = new Rng(seed);
const pool = ARCHETYPE_NAMES.filter(a => a !== 'lead-hunt');
const picks: Archetype[] = [];
while (picks.length < want) { const a = rng.pick(pool); if (!picks.includes(a)) picks.push(a) }

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('dungeon');
const out: string[] = [];
for (const arch of picks) {
  if (g.ai.usage().costUsd > 1.4) break;
  const lead = g.visibleLeads()[0];
  if (!lead) { await g.endCycle(); continue }
  lead.archetype = arch;                       // force coverage across the pool
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) { await g.endCycle(); continue }
  const q = g.state.quests.find(x => x.id === r.questId)!;
  out.push(`### ${arch}  [${profileOf(arch)}]\nGLOSS: ${glossOf(arch)}\nTITLE: ${q.title}\nCARD:  ${q.situation}\nJOB:   ${q.job}\n`);
  console.log(out[out.length - 1]);
  if (g.visibleLeads().length === 0) await g.endCycle();
}
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/archsample.md', out.join('\n'));
console.log(`\n${out.length} cards · ~$${g.ai.usage().costUsd.toFixed(2)}`);
