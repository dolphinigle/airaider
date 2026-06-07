// Does the RESOLUTION AI scale learned/loot to the outcome? Same proposal, three outcomes.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip=(s:string)=>s.replace(/\x1b\[[0-9;]*m/g,'');
const eng = await GameEngine.create({ provider:'openai', apiKey:key, seed:'scale' });
const base = {
  situation: 'At dusk the company presses Hareth, a nervous tally-clerk, in the back of the salt-store; he keeps glancing at a locked chest.',
  job: 'Press Hareth until he gives up who has been moving salt off the books.',
  party: [{ name: 'Marek of Saltreach', tags: ['Soldier','Brave','Scarred'] }],
  risky: true, midSaga: true,
  proposedReveal: "Hareth names the harbour-reeve, Doln, as the one taking the salt.",
  proposedLoot: "Hareth's slipped tally-stub",
};
for (const outcome of ['success','partial','failure'] as const){
  const o:any = await eng.ai.outcome({ ...base, outcome });
  console.log(`\n===== OUTCOME = ${outcome.toUpperCase()} =====`);
  console.log(`afterRoll: ${strip(o.afterRoll||'')}`);
  console.log(`learned:   ${o.learned===null?'(null)':JSON.stringify(o.learned)}`);
  console.log(`loot:      ${o.loot===null?'(null)':JSON.stringify(o.loot)}`);
}
