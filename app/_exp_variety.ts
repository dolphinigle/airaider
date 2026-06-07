// Single-game variety probe: pursue many genesis chains in ONE game so recentTitles/recentFocalSkills
// (the avoid + tag-exclusion levers) actually accumulate. Prints each focal's THEME tags + premise so
// I can read whether the archetype/genre varies across a real playthrough (not independent seeds).
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const PREFIX = process.argv[2]||'var', CYCLES = Number(process.argv[3]||7);
const strip=(s:string)=>s.replace(/\x1b\[[0-9;]*m/g,'');
const eng = await GameEngine.create({ provider:'openai', apiKey:key, seed:PREFIX });
const seen = new Set<string>();
for(let c=0;c<CYCLES*3;c++){
  const lead = eng.leads().find(x=>x.chain.kind==='starts-new');
  if(lead){
    const q:any = await eng.pursue(lead.id);
    if(q && !('error'in q) && q.chainId && !seen.has(q.chainId)){
      seen.add(q.chainId);
      const ch = eng.state.chains[q.chainId];
      const focal = eng.state.cards[ch.focalCardIds[0]] as any;
      const theme = (focal?.tags||[]).map((t:any)=>t.id).filter((id:string)=>/^(skill|phys|noto|race):/.test(id)).join(' ');
      const prem = (/SITUATION \(hidden truth\):\s*([^\n]+)/.exec(ch.bible)||[])[1]||'';
      const castNames = (ch.bible.match(/^- ([^(]+)\(/gm)||[]).map(s=>s.replace(/^- /,'').replace(/\($/,'').trim());
      console.log(`\n[${seen.size}] "${strip(ch.title)}"`);
      console.log(`   kernel: ${ch.seedKernel||'(none)'}`);
      console.log(`   focal-theme-tags: ${theme}`);
      console.log(`   premise: ${strip(prem).slice(0,260)}`);
      console.log(`   cast: ${castNames.join(' | ')}`);
      ch.state = 'done'; // abandon immediately so the board frees up for fresh starts-new leads (still counts for avoid/exclude)
    }
  }
  // assign+resolve so chains advance toward done and the board restocks with fresh starts-new
  for(const aq of eng.activeQuests()){ for(let i=0;i<aq.slots.length;i++){const e=eng.eligibleMercs(aq,i);if(e.length)eng.assign(aq.id,i,e[0].id);} aq.threshold=1; if(aq.groups)aq.groups.forEach((g:any)=>g.threshold=1);}
  await eng.endDay();
  if(seen.size>=CYCLES) break;
}
console.log(`\n=== ${seen.size} distinct sagas generated in one game ===`);
