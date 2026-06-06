// REAL-AI read: does a FAILED middle beat make the next beat open from the FALLOUT (consequence, not
// retry), and does a budget-blown LAST-CHANCE finale read as desperate? One uncommon saga, budget→1,
// fail beats 2 & 3 → last-chance forces beat 4 finale. Prints the player-facing prose to judge it.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import type { Chain } from './core/types.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'conseq3' });

const FAIL = new Set([2, 3]);   // fail these beats; budget→1 so beat 3's failure blows it → last-chance
let chainId = '', beatN = 0;
for (let c = 0; c < 14; c++) {
  let pursued = false;
  if (!chainId) {
    const l = eng.leads().find((x) => x.chain.kind === 'starts-new');
    if (l) { const q: any = await eng.pursue(l.id); if (!('error' in q)) { chainId = q.chainId; pursued = true;
      const ch = eng.state.chains[chainId] as Chain; ch.failBudget = 1;
      console.log(`\n### "${strip(ch.title)}"  (${ch.rarity}, arc ${(ch.arc||[]).length} steps, failBudget ${ch.failBudget})`);
      console.log(`GOAL: ${strip((ch as any).hook)}`);
      (ch.arc||[]).forEach((s, i) => console.log(`   arc ${i+1}: ${strip(s)}`));
    } }
  } else {
    const cont = eng.leads().find((x) => x.chain.kind === 'continues' && x.chain.chainId === chainId);
    if (cont) { const q: any = await eng.pursue(cont.id); if (!('error' in q)) pursued = true; }
  }
  if (!pursued) { await eng.endDay(); if (eng.state.chains[chainId]?.state === 'done') break; continue; }
  beatN++;
  const aq0 = eng.activeQuests()[0];
  const ch = eng.state.chains[chainId] as Chain;
  const lc = (ch.failsSpent ?? 0) > (ch.failBudget ?? 9);
  console.log(`\n— BEAT ${beatN}${aq0?.finale ? ' (FINALE)' : ''}${lc ? ' [LAST CHANCE]' : ''} —`);
  console.log(`  SITUATION: ${strip(aq0?.situation).slice(0, 320)}`);
  console.log(`  JOB: ${strip(aq0?.job)}`);
  const force = FAIL.has(beatN) ? 99 : 1;
  for (const aq of eng.activeQuests()) {
    if (aq.groups) { const g = aq.groups[0]; for (const i of g.slotIndices) { const e = eng.eligibleMercs(aq, i); if (e.length) eng.assign(aq.id, i, e[0].id); } aq.groups.forEach((x:any)=>x.threshold=force); }
    else for (let i = 0; i < aq.slots.length; i++) { const e = eng.eligibleMercs(aq, i); if (e.length) eng.assign(aq.id, i, e[0].id); }
    aq.threshold = force;
  }
  const res = await eng.endDay();
  const r0 = res[0];
  console.log(`  ⇒ ${r0?.outcome?.toUpperCase()}  | AFTER: ${strip(r0?.afterText).slice(0, 280)}`);
  console.log(`  ⇒ delivered: ${r0?.delivered?.map(strip).join(', ') || '—'}  | bank=${ch.bank} failsSpent=${ch.failsSpent}`);
  if (eng.state.chains[chainId]?.state === 'done') break;
}
