// Verify off-rails handling: force a mid-arc beat to FAIL and check the NEXT beat RE-ATTEMPTS the same
// arc step (arcProgress holds), not skips to the next step.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const FAIL_BEAT = Number(process.argv[2] || 2);
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[3] || 'fail' });
let chainId = '';
for (let c = 0; c < 16 && (!chainId || (eng.state.chains as any)[chainId]?.state !== 'done'); c++) {
  let q: any = null;
  if (!chainId) { const l = eng.leads().find((x) => x.chain.kind === 'starts-new'); if (l) { q = await eng.pursue(l.id); if (!('error' in q)) { chainId = q.chainId; const ch: any = eng.state.chains[chainId]; console.log(`### "${strip(ch.title)}"  arc(${(ch.arc || []).length} steps):`); (ch.arc || []).forEach((s: string, i: number) => console.log(`   step ${i + 1}: ${strip(s)}`)); console.log(''); } } }
  else { const cont = eng.leads().find((x) => x.chain.kind === 'continues' && x.chain.chainId === chainId); if (cont) { q = await eng.pursue(cont.id); if ('error' in q) q = null; } }
  if (!q || ('error' in q)) { await eng.endDay(); continue; }
  const ch: any = eng.state.chains[chainId];
  const stepAttempted = (ch.arcProgress ?? 0) + 1; // 1-indexed step this beat is attempting
  const beatN = ch.beatsResolved + 1;
  for (const aq of eng.activeQuests()) { for (let i = 0; i < aq.slots.length; i++) { const e = eng.eligibleMercs(aq, i); if (e.length) eng.assign(aq.id, i, e[0].id); } }
  const force = beatN === FAIL_BEAT ? 99 : 1; // force fail the chosen beat, else force success
  for (const aq of eng.activeQuests()) { aq.threshold = force; if (aq.groups) aq.groups.forEach((g: any) => g.threshold = force); }
  const res = await eng.endDay();
  const out = res[0]?.outcome ?? '?';
  console.log(`beat ${beatN} → attempted STEP ${stepAttempted}${q.finale ? ' (FINALE)' : ''}: "${strip(q.job).slice(0, 70)}"  ⇒ ${out.toUpperCase()}  [arcProgress now ${ch.arcProgress}]`);
}
console.log(`\n(failed beat ${FAIL_BEAT}; watch whether the step it attempted is re-attempted by the next beat)`);
