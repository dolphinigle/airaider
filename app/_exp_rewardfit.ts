// REWARD-FIT scenario read (real AI). Generate a couple of quest chains and dump EVERY beat
// (situation + job + which arc step) so we can read them one by one and judge: for THIS beat, does an
// immediate reward make sense, or should it defer toward the finale — and what KIND? No forcing; play
// each beat to success so the whole arc (incl. finale) is generated.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import type { Chain } from './core/types.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const wrap = (s: string, n = 300) => strip(s).slice(0, n);
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[2] || 'rf1' });

const TARGET_DONE = Number(process.argv[3] || 2);
let done = 0;
const seen = new Set<string>();
for (let c = 0; c < 30 && done < TARGET_DONE; c++) {
  // pursue: new sagas first, then continuations
  const leads = [...eng.leads()].sort((a, b) => (a.chain.kind === 'continues' ? 1 : 0) - (b.chain.kind === 'continues' ? 1 : 0));
  for (const l of leads) {
    if (eng.freeMercs().length === 0) break;
    if (l.chain.kind !== 'starts-new' && l.chain.kind !== 'continues') continue;
    const q: any = await eng.pursue(l.id);
    if ('error' in q) continue;
    const ch = eng.state.chains[q.chainId] as Chain;
    if (q.chainId && !seen.has(q.chainId)) {
      seen.add(q.chainId);
      const focal: any = eng.state.cards[ch.focalCardIds[0]];
      console.log(`\n\n========================================\n### "${strip(ch.title)}"  [${ch.rarity}, arc ${(ch.arc||[]).length} steps]`);
      console.log(`HOOK: ${strip(ch.hook)}`);
      console.log(`FOCAL (the finale payoff): ${focal.name} — value ${focal.value}, ${strip(focal.who||'')}`);
      (ch.arc||[]).forEach((s, i) => console.log(`   arc ${i + 1}: ${strip(s)}`));
      console.log(`   BIBLE choiceSteps: [${(ch.choiceSteps||[]).join(', ')}]   finaleChoices: ${(ch.finaleChoices||[]).map((c:any)=>`${strip(c.label)}[${c.kind}]`).join(' · ') || '— (fallback trio)'}`);
    }
    const attr = q.groups ? q.groups.map((g:any)=>g.tested?.attribute||q.slots[g.slotIndices[0]]?.tested?.attribute).join('/') : q.slots[0]?.tested?.attribute;
    console.log(`\n  -- beat ${q.beat}${q.finale ? ' (FINALE)' : ''} of "${strip(ch.title)}"  [reward: ${q.finale ? 'FINALE→focal+bank' : q.immediate ? 'IMMEDIATE (loot now + bank floor)' : 'DEFERRED (banks)'}] [tests: ${attr}] --`);
    console.log(`     SITUATION: ${wrap(q.situation)}`);
    console.log(`     JOB: ${strip(q.job)}`);
    console.log(`     proposedLoot: ${strip(q.proposedLoot || '—')}`);
    if (q.groups) console.log(`     approaches: ${q.groups.map((g: any) => `${strip(g.label)}[${g.rewardKind}·${q.slots[g.slotIndices[0]]?.tested?.attribute}]`).join(' · ')}`);
  }
  // assign best-available and succeed everything (low threshold) so the arc completes
  for (const q of eng.activeQuests()) {
    if (q.groups) { const g = q.groups[0]; for (const i of g.slotIndices) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); } q.groups.forEach((x: any) => x.threshold = 1); }
    else for (let i = 0; i < q.slots.length; i++) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); }
    q.threshold = 1;
  }
  const res = await eng.endDay();
  for (const r of res) if (r.chainDone) done++;
}
console.log(`\n\n(${done} chains completed)`);
