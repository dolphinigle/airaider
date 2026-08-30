// The variety measure the N10 work needs: K cards of the SAME archetype, so a judge can say how
// many genuinely different JOBS they are. Prose quality alone cannot see this — six competent
// cards that are the same job six times score fine and read as one card.
// Usage: OUT=<file> ARCH=lead-hunt npx tsx scripts/_variety.ts [count] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import type { Lead } from '../src/engine/quests.js';

const ARCH = process.env.ARCH ?? 'lead-hunt';
const N = Number(process.argv[2] ?? 6);
const SEED = Number(process.argv[3] ?? 4242);
const g = new Game(makeOpenAiProvider(), SEED);
g.build('map-room'); g.build('dungeon');
const out: string[] = [];
for (let i = 0; i < N; i++) {
  const lead: Lead = { id: `v-${i}`, rarity: 'common', level: 2, region: 'forests',
    archetype: ARCH as never, chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward' };
  g.state.leads.push(lead);
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) { console.log('!!', r.msg); continue }
  const q = g.state.quests.find(x => x.id === r.questId)!;
  out.push(`CARD: ${q.situation}\nJOB : ${q.job}`);
  console.log(`${i + 1}. ${q.situation}`);
}
fs.writeFileSync(process.env.OUT ?? `/home/irvan/.claude/jobs/80974e3b/tmp/var-${ARCH}.md`,
  `# ${N} cards, all the SAME job type\n\n` + out.map((c, i) => `## ${i + 1}\n${c}`).join('\n\n'));
console.log(`\n$${g.ai.usage().costUsd.toFixed(2)}`);
