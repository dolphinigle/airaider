// PROMPT LAB — rapid-fire genesis + beat-1 pairs, no cycles, no resolves (~$0.02/pair).
// Drives pursue() on starts-new leads only, harvests the genesis bible + the beat-1 card,
// and dumps a judge-ready batch. Usage: npx tsx scripts/promptlab.ts [pairs] [seedBase] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const pairs = Number(process.argv[2] ?? 6);
const seedBase = Number(process.argv[3] ?? 61001);
const OUT = process.argv[4] ?? `/home/irvan/.claude/jobs/cf9a4600/tmp/promptlab-${seedBase}.md`;

async function main() {
  let out = '';
  let cost = 0;
  for (let i = 0; i < pairs; i++) {
    // fresh Game per pair → fresh slate/seeds; different seed → different worlds
    const g = new Game(makeOpenAiProvider(), seedBase + i * 7);
    g.build('map-room');   // chain leads gate on the map room
    // surface leads until a starts-new chain lead appears (advance empty cycles cheaply is
    // not possible without AI calls, so just scan the initial board across a few cycles)
    let lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
    for (let c = 0; c < 4 && !lead; c++) {
      await g.endCycle();                       // no assignments → resolves nothing
      lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
    }
    if (!lead) { out += `\n## pair ${i + 1}: no chain lead surfaced (seed ${seedBase + i * 7})\n`; continue; }
    const r = await g.pursue(lead.id);
    const chain = g.state.chains[g.state.chains.length - 1];
    const q = g.state.quests.find(x => x.id === r.questId);
    if (!chain || !q) { out += `\n## pair ${i + 1}: pursue failed\n`; continue; }
    const b = chain.bible;
    out += `\n---\n## pair ${i + 1} (seed ${seedBase + i * 7})\n`;
    out += `KERNEL: ${b.kernel}\nGOAL: ${b.goal}\nARC:\n${b.arc.map((s, j) => `  ${j + 1}. ${s}`).join('\n')}\n`;
    out += `CAST: ${b.cast.map(m => `${m.name} (${m.role} — wants ${m.want})`).join(' · ')}\n`;
    out += `TWIST: ${b.twist ?? '—'}\n`;
    out += `\nBEAT-1 CARD AS THE PLAYER READS IT:\n> **${q.title}**\n> ${q.situation}\n> [job line: ${q.job}]\n`;
    cost += g.ai.usage().costUsd;
  }
  fs.writeFileSync(OUT, `# Prompt lab batch (${pairs} pairs, seeds ${seedBase}+)\n${out}\n\n_total AI cost: $${cost.toFixed(3)}_\n`);
  console.log(`done → ${OUT} ($${cost.toFixed(3)})`);
}
main().catch(e => { console.error(e); process.exit(1) });
