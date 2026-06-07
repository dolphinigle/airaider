import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const N = Number(process.argv[2]||8), PREFIX = process.argv[3]||'exp';
const strip=(s:string)=>s.replace(/\x1b\[[0-9;]*m/g,'');
for (let k=0;k<N;k++){
  const eng = await GameEngine.create({ provider:'openai', apiKey:key, seed:`${PREFIX}-${k}` });
  let chainId='', cast:string[]=[], beats:{n:number,fin:boolean,on:string[],job:string,dropped?:boolean}[]=[];
  for(let c=0;c<20 && (!chainId || eng.state.chains[chainId].state!=='done');c++){
    let q:any=null;
    if(!chainId){ const l=eng.leads().find(x=>x.chain.kind==='starts-new'); if(l){q=await eng.pursue(l.id); if(!('error'in q)){chainId=q.chainId;
      const cs=(eng.state.chains[chainId].bible.split('CAST:')[1]||'').split('TENSIONS:')[0];
      cast=(cs.match(/^- ([^(]+)\(/gm)||[]).map(s=>s.replace(/^- /,'').replace(/\($/,'').trim()); }} }
    else { const cont=eng.leads().find(x=>x.chain.kind==='continues'&&x.chain.chainId===chainId); if(cont){q=await eng.pursue(cont.id); if('error'in q)q=null;} }
    if(q&&!('error'in q)){ const on=cast.filter(nm=>nm.length>2&&q.situation.includes(nm.split(' ')[0])); beats.push({n:q.beat,fin:!!q.finale,on,job:strip(q.job).slice(0,72)}); }
    let assigned=false;
    for(const aq of eng.activeQuests()){ for(let i=0;i<aq.slots.length;i++){const e=eng.eligibleMercs(aq,i);if(e.length){eng.assign(aq.id,i,e[0].id);assigned=true;}} aq.threshold=1; if(aq.groups)aq.groups.forEach((g:any)=>g.threshold=1);}
    if(!assigned&&q&&!('error'in q)) beats[beats.length-1].dropped=true; // pursued but no merc → endDay drops it (not a real story beat)
    await eng.endDay();
  }
  if(chainId){ const ch=eng.state.chains[chainId]; const mock=ch.title.startsWith('The Ledger of');
    const real=beats.filter(b=>!b.dropped);
    console.log(`\n### ${PREFIX}-${k} "${ch.title}" resolved=${ch.beatsResolved} pursued=${beats.length}${mock?' [MOCK]':''}`);
    for(const b of beats) console.log(`  ${b.dropped?'~~':''}${b.fin?'FIN':'b'+b.n} [${b.on.join('+')||'-'}] ${b.job}`);
    console.log(`  -- canonical log (${ch.log.length}): ` + ch.log.map((l:string)=>strip(l).replace(/^Beat \d+: the company set to /,'').slice(0,40)).join(' | ')); }
}
