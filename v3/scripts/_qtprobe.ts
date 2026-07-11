// Probe: which vocabulary FAMILIES do real-AI quarryTags actually draw from?
// Drives person-reward one-offs, reads the writer's RAW quarryTags from the call log,
// classifies each word via CONCEPT. Usage: npx tsx scripts/_qtprobe.ts [seed] [target]

import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { parseAiTag, CONCEPT } from '../src/engine/tags.js';

const seed = Number(process.argv[2] ?? 51001);
const target = Number(process.argv[3] ?? 10);
const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('lead-room');

let seen = 0;
const fam: Record<string, number> = {};
const raw: string[] = [];
for (let c = 0; c < 14 && seen < target; c++) {
  for (const lead of [...g.visibleLeads()]) {
    if (seen >= target) break;
    if (lead.chainInfo?.kind && lead.chainInfo.kind !== 'none') continue;
    if (!['rescue', 'capture'].includes(lead.archetype)) continue;   // person rewards → partial
    await g.pursue(lead.id);
  }
  for (const q of [...g.state.quests]) g.abandon(q.id);
  await g.endCycle();
  for (const r of g.ai.callLog().filter(x => x.purpose === 'writeQuest' && x.ok)) {
    try {
      const out = JSON.parse(r.output ?? '{}');
      if (!Array.isArray(out.quarryTags) || raw.includes(JSON.stringify(out.quarryTags))) continue;
      raw.push(JSON.stringify(out.quarryTags));
      seen++;
      for (const w of out.quarryTags) {
        const p = parseAiTag(String(w));
        const famName = p ? (CONCEPT[p.concept]?.group ?? '??') : 'UNPARSED';
        fam[famName] = (fam[famName] ?? 0) + 1;
        console.log(`  ${String(w).padEnd(28)} → ${p?.concept ?? '✗'} [${famName}]`);
      }
    } catch { /* skip */ }
  }
}
console.log(`\ncards with quarryTags: ${seen}`);
console.log('family tally:', fam);
console.log(`AI ~$${g.ai.usage().costUsd.toFixed(2)}`);
