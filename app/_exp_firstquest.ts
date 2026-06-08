// DIAGNOSE the opening-quest framing: pursue the initial board leads (one-offs + chain openers) and
// print the situation the player FIRST reads — checking for (a) "already deployed in the field" framing
// when they're still at the fort choosing, and (b) flowery/opaque diction.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[2] || 'fq1' });

let n = 0;
for (const lead of [...eng.leads()]) {
  if (eng.freeMercs().length === 0) break;
  if (n++ >= 6) break;
  const kind = lead.chain.kind === 'starts-new' ? 'CHAIN opener' : lead.chain.kind === 'none' ? 'ONE-OFF' : lead.chain.kind;
  const q: any = await eng.pursue(lead.id);
  if (!q || 'error' in q) continue;
  console.log(`\n### ${kind}  (${q.archetype}, ${q.rarity}, ${q.location})`);
  console.log(`   SITUATION: ${strip(q.situation)}`);
  console.log(`   OFFERED: ${strip(q.offeredReward||'—')}`);
  console.log(`   JOB: ${strip(q.job)}`);
}
console.log('\n(done)');
