// ONE-OFF LAB — rapid-fire one-off cards + their resolutions (~$0.03/world, seconds).
// Fresh world per seed; pursues only NON-chain leads, assigns soldiers, resolves one cycle.
// Usage: npx tsx scripts/oneofflab.ts [worlds] [seedBase] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const worlds = Number(process.argv[2] ?? 4);
const seedBase = Number(process.argv[3] ?? 71001);
const OUT = process.argv[4] ?? `/home/irvan/.claude/jobs/cf9a4600/tmp/oneofflab-${seedBase}.md`;

async function main() {
  let out = '';
  let cost = 0;
  for (let w = 0; w < worlds; w++) {
    const g = new Game(makeOpenAiProvider(), seedBase + w * 13);
    g.build('map-room');   // visibleLeads gates on it
    for (let c = 0; c < 3 && !g.visibleLeads().some(l => l.chainInfo.kind === 'none'); c++) await g.endCycle();
    // pursue up to 3 one-off leads, fill slots, end the cycle → cards + resolutions
    let taken = 0;
    for (const lead of [...g.visibleLeads()]) {
      if (lead.chainInfo.kind !== 'none' || taken >= 3) continue;
      const r = await g.pursue(lead.id);
      if (!r.ok || !r.questId) continue;
      taken++;
      const q = g.state.quests.find(x => x.id === r.questId)!;
      for (let i = 0; i < q.slots.length; i++) {
        const free = g.roster().filter(m => m.location.kind === 'held' && !q.slots.some(s => s.filledBy === m.id));
        if (free[0] && !q.slots[i]!.filledBy) g.assign(q.id, i, free[0].id);
      }
      out += `\n---\n## world ${w + 1} card ${taken} (seed ${seedBase + w * 13})\n> **${q.title}**\n> ${q.situation}\n> [job: ${q.job}]\n`;
    }
    const rep = await g.endCycle();
    // harvest resolution text lines (before/dice/after render inside the report array)
    const repText = rep.join('\n');
    out += `\nRESOLUTIONS (world ${w + 1}):\n${repText.split('\n').filter(l => !l.startsWith('🏰') && !l.startsWith('🧭')).join('\n')}\n`;
    cost += g.ai.usage().costUsd;
  }
  fs.writeFileSync(OUT, `# One-off lab (${worlds} worlds, seeds ${seedBase}+)\n${out}\n\n_total AI cost: $${cost.toFixed(3)}_\n`);
  console.log(`done → ${OUT} ($${cost.toFixed(3)})`);
}
main().catch(e => { console.error(e); process.exit(1) });
