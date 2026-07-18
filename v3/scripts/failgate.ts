// FAILGATE LAB — force saga-beat FAILURES (worst merc per slot) and read the NEXT beat
// card: does the LAST-STEP-FAILED gate hold (failed yield never carried/asserted)?
// Usage: npx tsx scripts/failgate.ts [worlds] [seedBase] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins } from '../src/engine/roll.js';

const worlds = Number(process.argv[2] ?? 3);
const seedBase = Number(process.argv[3] ?? 95001);
const OUT = process.argv[4] ?? `/home/irvan/.claude/jobs/d051f1b8/tmp/failgate-${seedBase}.md`;

async function main() {
  let out = '';
  let cost = 0;
  for (let w = 0; w < worlds; w++) {
    const g = new Game(makeOpenAiProvider(), seedBase + w * 17);
    g.build('map-room'); g.build('lead-room');
    let lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
    for (let c = 0; c < 4 && !lead; c++) {
      await g.endCycle();
      lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
    }
    if (!lead) { out += `\n## world ${w + 1}: no saga lead\n`; continue; }
    const r = await g.pursue(lead.id);
    if (!r.ok) { out += `\n## world ${w + 1}: pursue failed (${r.msg})\n`; continue; }
    out += `\n# world ${w + 1} (seed ${seedBase + w * 17})\n`;
    for (let beat = 0; beat < 4; beat++) {
      let quest = g.state.quests.find(x => x.state === 'open' && x.chainId);
      if (!quest) {
        const cont = g.visibleLeads().find(l => l.chainInfo.kind === 'continues');
        if (cont) await g.pursue(cont.id);
        quest = g.state.quests.find(x => x.state === 'open' && x.chainId);
      }
      if (!quest) { out += `\n(no next beat offered — chain ended)\n`; break; }
      out += `\n## beat card (cycle ${g.state.cycle}): ${quest.title}\n> ${quest.situation}\n> JOB: ${quest.job}\n`;
      for (let i = 0; i < quest.slots.length; i++) {
        if (quest.slots[i]!.filledBy) continue;
        const held = g.roster().filter(m => m.location.kind === 'held');
        const free = held.filter(m => (m.character?.injuryTiers ?? 0) === 0);
        const pool = free.length ? free : held;
        if (!pool.length) break;
        const worst = pool.sort((a, b) => coins(a, quest.slots[i]!.test) - coins(b, quest.slots[i]!.test))[0]!;
        g.assign(quest.id, i, worst.id);
      }
      const lines = await g.endCycle();
      out += lines.map(l => `  ${l}`).join('\n') + '\n';
    }
    cost += g.ai.usage().costUsd;
  }
  out += `\n\n_total AI cost: $${cost.toFixed(3)}_\n`;
  fs.writeFileSync(OUT, out);
  console.log(`wrote ${OUT}`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
