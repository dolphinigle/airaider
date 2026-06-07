import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const N = Number(process.argv[2]||2), PREFIX = process.argv[3]||'deep';
const strip=(s:string)=>s.replace(/\x1b\[[0-9;]*m/g,'');
for (let k=0;k<N;k++){
  const eng = await GameEngine.create({ provider:'openai', apiKey:key, seed:`${PREFIX}-${k}` });
  let chainId='';
  console.log(`\n\n========================= ${PREFIX}-${k} =========================`);
  for(let c=0;c<20 && (!chainId || eng.state.chains[chainId].state!=='done');c++){
    let q:any=null;
    if(!chainId){ const l=eng.leads().find(x=>x.chain.kind==='starts-new'); if(l){q=await eng.pursue(l.id); if(!('error'in q)){chainId=q.chainId;
      console.log(`\n### "${eng.state.chains[chainId].title}"\n--- BIBLE ---\n${strip(eng.state.chains[chainId].bible)}\n--- HOOK ---\n${strip(eng.state.chains[chainId].hook||'')}\n`); }} }
    else { const cont=eng.leads().find(x=>x.chain.kind==='continues'&&x.chain.chainId===chainId); if(cont){q=await eng.pursue(cont.id); if('error'in q)q=null;} }
    let assigned=false;
    if(q&&!('error'in q)){
      console.log(`\n${q.finale?'═══ FINALE':'─── BEAT '+q.beat} ${'─'.repeat(20)}`);
      console.log(`SITUATION: ${strip(q.situation||'')}`);
      console.log(`JOB:       ${strip(q.job||'')}`);
      if(q.groups && !q.finale) console.log(`CHOICES:   ${q.groups.map((g:any)=>`${g.label} [${q.slots[g.slotIndices[0]]?.tested?.attribute}]`).join('  |  ')}`);
      console.log(`STAKES:    ${strip(q.stakes||'')}`);
    }
    for(const aq of eng.activeQuests()){ for(let i=0;i<aq.slots.length;i++){const e=eng.eligibleMercs(aq,i);if(e.length){eng.assign(aq.id,i,e[0].id);assigned=true;}} aq.threshold=1; if(aq.groups)aq.groups.forEach((g:any)=>g.threshold=1);}
    const res=await eng.endDay();
    if(assigned) for(const rr of res){ if(rr.beforeText){ console.log(`  BUILDUP: ${strip(rr.beforeText)}`); console.log(`  ROLL:    ${rr.outcome.toUpperCase()} (${rr.heads}/${rr.threshold} heads)`); console.log(`  AFTER:   ${strip(rr.afterText||'')}`);} }
  }
  if(chainId){ const ch:any=eng.state.chains[chainId]; console.log(`\n-- LEARNED (recorded, scaled to outcome):`); for(const l of ch.log) console.log(`   ${strip(l).replace(/^Beat \d+: the company set to /,'')}`); }
}
