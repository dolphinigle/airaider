// Fast spread test for the hand-crafted PREMISES + PLACES: draw a random premise+place (like the
// engine now does), generate a focal, call genesis, print premise→situation so I can read whether
// the premise is adapted concretely AND whether the player-facing situation reads cleanly.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { generateCharacter } from './core/economy.js';
import { tagLabels } from './core/ai.js';
import { rngFrom } from './core/rng.js';
import { PREMISES, pickPlace } from './core/seeds.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip=(s:string)=>s.replace(/\x1b\[[0-9;]*m/g,'');
const N = Number(process.argv[2]||8);
const eng = await GameEngine.create({ provider:'openai', apiKey:key, seed:'seeds' });
const pool = Object.values(eng.state.cards).filter((c:any)=>c.role==='merc').map((c:any)=>({name:c.name,who:c.who,tags:tagLabels(c.tags).slice(0,5)}));
const out = await Promise.all(Array.from({length:N},(_,i)=>i).map(async (i)=>{
  const r = rngFrom(`seeds-${i}`);
  const premise = PREMISES[Math.floor(r()*PREMISES.length)];
  const place = pickPlace(r);
  const gen = generateCharacter(r, { targetValue: 90, level: 2 });
  const g:any = await eng.ai.genesis({ focalTags:[tagLabels(gen.tags)], region:'the Ashmoor hills', rarity:'uncommon', seed:premise, place, poolCast:pool });
  return { premise, place, title:g.title, blurb:strip(g.leadBlurb||''), situation:strip(g.situation||''), cast:(g.cast||[]).map((c:any)=>c.name) };
}));
for(const o of out){
  console.log(`\n### "${o.title}"`);
  console.log(`  PREMISE: ${o.premise}`);
  console.log(`  PLACE:   ${o.place}`);
  console.log(`  blurb(player sees): ${o.blurb}`);
  console.log(`  situation(hidden): ${o.situation.slice(0,260)}`);
  console.log(`  cast: ${o.cast.join(' | ')}`);
}
