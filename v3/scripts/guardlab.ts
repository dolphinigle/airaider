// GUARD LAB — measures the genesis quality-guard's value: fire rate, latency cost, and
// judge-ready rejected-vs-shipped draft pairs. Wraps the provider to capture EVERY genesis
// draft through the real pursue() path (guards included).
// Usage: npx tsx scripts/guardlab.ts [runs] [seedBase] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import type { AiProvider, GenesisInput, GenesisOut } from '../src/ai/provider.js';

const runs = Number(process.argv[2] ?? 12);
const seedBase = Number(process.argv[3] ?? 81001);
const OUT = process.argv[4] ?? `/home/irvan/.claude/jobs/6634ff25/tmp/guardlab-${seedBase}.md`;

function bibleText(b: GenesisOut): string {
  return [
    `TITLE: ${b.title}`, `KERNEL: ${b.kernel}`, `GOAL: ${b.goal}`,
    `ARC:\n${b.arc.map((s, j) => `  ${j + 1}. ${s}`).join('\n')}`,
    `CAST: ${b.cast.map(m => `${m.name} (${m.role} — wants ${m.want})`).join(' · ')}`,
    `SITUATION: ${b.situation}`,
  ].join('\n');
}

async function one(i: number) {
  const seed = seedBase + i * 7;
  const ai = makeOpenAiProvider();
  const drafts: { input: GenesisInput; out: GenesisOut; ms: number }[] = [];
  const wrapped: AiProvider = {
    ...ai,
    genesis: async (inp) => {
      const t0 = Date.now();
      const o = await ai.genesis(inp);
      drafts.push({ input: inp, out: o, ms: Date.now() - t0 });
      return o;
    },
  };
  const g = new Game(wrapped, seed);
  g.build('map-room');
  let lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
  for (let c = 0; c < 4 && !lead; c++) {
    await g.endCycle();
    lead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
  }
  if (!lead) return { seed, skip: true as const };
  await g.pursue(lead.id);
  const rejections = g.state.log.filter(l => l.text.includes('saga draft rejected')).map(l => l.text);
  const shippedFlawed = g.state.log.some(l => l.text.includes('still flawed'));
  return { seed, skip: false as const, drafts, rejections, shippedFlawed, cost: g.ai.usage().costUsd };
}

async function main() {
  const results = await Promise.all(Array.from({ length: runs }, (_, i) => one(i).catch(e => ({ seed: seedBase + i * 7, skip: true as const, err: String(e).slice(0, 200) }))));
  let out = `# Guard lab (${runs} runs, seeds ${seedBase}+)\n`;
  let fired = 0, cost = 0, totalMs = 0, guardMs = 0, flawedShips = 0;
  for (const r of results) {
    if (r.skip) { out += `\n## seed ${r.seed}: SKIPPED ${'err' in r ? r.err : '(no chain lead)'}\n`; continue; }
    cost += r.cost;
    const ms = r.drafts.reduce((a, d) => a + d.ms, 0);
    totalMs += ms;
    out += `\n---\n## seed ${r.seed} — ${r.drafts.length} genesis call(s), ${(ms / 1000).toFixed(0)}s total${r.shippedFlawed ? ' · SHIPPED FLAWED' : ''}\n`;
    if (r.shippedFlawed) flawedShips++;
    if (r.drafts.length > 1) {
      fired++;
      guardMs += ms - r.drafts[0]!.ms;
      out += `\nGUARD FIRED: ${r.rejections.map(x => `\n- ${x}`).join('')}\n`;
      out += `\n### Draft A (rejected, ${(r.drafts[0]!.ms / 1000).toFixed(0)}s)\n${bibleText(r.drafts[0]!.out)}\n`;
      out += `\n### Draft B (shipped, ${(r.drafts[1]!.ms / 1000).toFixed(0)}s)\n${bibleText(r.drafts[1]!.out)}\n`;
    } else {
      out += `\n### Shipped first try (${(r.drafts[0]!.ms / 1000).toFixed(0)}s)\n${bibleText(r.drafts[0]!.out)}\n`;
    }
  }
  const ok = results.filter(r => !r.skip).length;
  out += `\n\n---\n# STATS\n- runs completed: ${ok}/${runs}\n- guard fired: ${fired}/${ok} (${ok ? Math.round(100 * fired / ok) : 0}%)\n`;
  out += `- shipped-flawed (guard fired twice, gave up): ${flawedShips}/${ok}\n`;
  out += `- mean pursue genesis time: ${(totalMs / Math.max(ok, 1) / 1000).toFixed(0)}s · guard latency added (mean over ALL runs): ${(guardMs / Math.max(ok, 1) / 1000).toFixed(0)}s\n`;
  out += `- total AI cost: $${cost.toFixed(3)}\n`;
  fs.writeFileSync(OUT, out);
  console.log(`done → ${OUT} (fired ${fired}/${ok}, $${cost.toFixed(3)})`);
}
main().catch(e => { console.error(e); process.exit(1) });
