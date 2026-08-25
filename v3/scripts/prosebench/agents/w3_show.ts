import * as fs from 'node:fs';
import { MOTIVES2 } from '../../motives2.js';
import { SHAPES } from '../../shapes.js';
const all: any[] = JSON.parse(fs.readFileSync('/home/irvan/airaider/v3/scripts/prosebench/pull-fixtures.json','utf8'));
const pool = all.filter(i => !i.framedCharacter);
const byArch = new Map<string, any[]>();
for (const i of pool) { const k = i.archetype ?? '-'; if (!byArch.has(k)) byArch.set(k, []); byArch.get(k)!.push(i) }
const picks: any[] = [];
for (let r = 0; picks.length < 24; r++) { let added = false;
  for (const [, l] of [...byArch].sort()) if (l[r] && picks.length < 24) { picks.push(l[r]!); added = true }
  if (!added) break }
const TOKEN: Record<string,string> = { 'coin':'coin','a person who may join the company':'a recruit','the pick of what the job turns up':'salvage-rights','first claim on what the road yields':'salvage-rights','whatever worth the work shakes loose':'salvage-rights','a person taken':'a captive' };
const seed = Number(process.argv[2] ?? 1);
picks.slice(0, Number(process.argv[3] ?? 4)).forEach((i, k) => {
  const m = MOTIVES2[((k + seed) * 17) % MOTIVES2.length]!;
  console.log(JSON.stringify({ archetype:i.archetype, location:i.location, gravity:i.gravity,
    rewardEnvelope:String(i.rewardEnvelope ?? '').split(' + ').map(p=>TOKEN[p]??p),
    KEYWORDS:i.keywords?.join(', '), placeNameSuggestions:i.placeNameSuggestions,
    opening:i.opening, intake:i.intake, slotCount:i.slotCount,
    shape:SHAPES[((k+seed)*13)%SHAPES.length], ask:m.want, seen:m.tell }, null, 1));
  console.log('----');
});
