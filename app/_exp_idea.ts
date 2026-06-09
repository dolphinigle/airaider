import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import type { AICallRecord, Chain } from './core/ai.js';
const key = readFileSync(new URL('../.env', import.meta.url),'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip=(s:string)=>(s||'').replace(/\x1b\[[0-9;]*m/g,'');
const calls:AICallRecord[]=[];
const eng=await GameEngine.create({provider:'openai',apiKey:key,seed:process.argv[2]||'idea1',onCall:r=>calls.push(r)});
let made=0;
for(let c=0;c<8&&made<2;c++){const l=eng.leads().find(x=>x.chain.kind==='starts-new');
  if(l){const q:any=await eng.pursue(l.id); if(!('error'in q)){made++; const ch=eng.state.chains[q.chainId] as Chain;
    console.log(`\n========== "${strip(ch.title)}"  | coreReward: ${ch.coreReward}`);
    (ch.arc||[]).forEach((s:string,i:number)=>console.log(`  arc ${i+1}: ${strip(s)}`));
    console.log(`  BEAT 1 situation: ${strip(q.situation)}`);
  }} else await eng.endDay();
}
const g=calls.find(c=>c.kind==='genesis');
if(g){console.log('\n\n===== GENESIS USER PROMPT (the ideas we feed) =====\n'+g.user.split('\n').slice(0,14).join('\n'));}
