// REVIEW LAB — measures the cold-reader gate's value: fire rate, latency cost, and judge-ready
// pre/post-rewrite pairs, for BOTH gates (beat card + saga resolution), through the real path.
// Usage: npx tsx scripts/reviewlab.ts [runs] [seedBase] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import type { AiProvider, QuestWriteInput, QuestWriteOut, ResolveQuestInput, ResolveQuestOut, ReviewInput, ReviewOut } from '../src/ai/provider.js';

const runs = Number(process.argv[2] ?? 12);
const seedBase = Number(process.argv[3] ?? 83001);
const OUT = process.argv[4] ?? `/home/irvan/.claude/jobs/6634ff25/tmp/reviewlab-${seedBase}.md`;

const isReviewNote = (n: string) => /^(UNPARSEABLE|UNGROUNDED|LEDGER)/i.test(n);
const cardText = (o: QuestWriteOut) => `**${o.title}**\n${o.situation}\n[job: ${o.job}]`;
const repText = (o: ResolveQuestOut) => `${o.before}\n[the dice fall]\n${o.after}`;

async function one(i: number) {
  const seed = seedBase + i * 7;
  const ai = makeOpenAiProvider();
  const wq: { fixNotes?: string[]; out: QuestWriteOut }[] = [];
  const reviews: { out: ReviewOut; ms: number }[] = [];
  const resolves: { fixNotes?: string[]; outs: ResolveQuestOut[] }[] = [];
  const wrapped: AiProvider = {
    ...ai,
    writeQuest: async (inp: QuestWriteInput) => {
      const o = await ai.writeQuest(inp);
      wq.push({ fixNotes: inp.fixNotes, out: o });
      return o;
    },
    resolve: async (inps: ResolveQuestInput[]) => {
      const o = await ai.resolve(inps);
      resolves.push({ fixNotes: inps[0]?.fixNotes, outs: o });
      return o;
    },
    review: async (inp: ReviewInput) => {
      const t0 = Date.now();
      const o = await ai.review(inp);
      reviews.push({ out: o, ms: Date.now() - t0 });
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
  const r = await g.pursue(lead.id);
  const q = g.state.quests.find(x => x.id === r.questId);
  // fill slots with whoever fits so the cycle resolves the saga beat (exercises the report gate)
  let resolved = false;
  if (q) {
    const roster = g.roster();
    const used = new Set<string>();
    let allFilled = true;
    for (let s = 0; s < q.slots.length; s++) {
      const m = roster.find(x => !used.has(x.id) && g.assign(q.id, s, x.id).ok);
      if (m) used.add(m.id); else { allFilled = false; break; }
    }
    if (allFilled) { await g.endCycle(); resolved = true; }
  }
  return { seed, skip: false as const, wq, reviews, resolves, resolved, cost: g.ai.usage().costUsd };
}

async function main() {
  const results = await Promise.all(Array.from({ length: runs }, (_, i) =>
    one(i).catch(e => ({ seed: seedBase + i * 7, skip: true as const, err: String(e).slice(0, 200) }))));
  let out = `# Review lab (${runs} runs, seeds ${seedBase}+)\n`;
  let cost = 0, reviewCalls = 0, reviewMs = 0;
  let cardFires = 0, cardReviewOnly = 0, repFires = 0, cardsSeen = 0, repsSeen = 0;
  for (const r of results) {
    if (r.skip) { out += `\n## seed ${r.seed}: SKIPPED ${'err' in r ? r.err : '(no chain lead)'}\n`; continue; }
    cost += r.cost;
    for (const rv of r.reviews) { reviewCalls++; reviewMs += rv.ms; }
    out += `\n---\n## seed ${r.seed} (resolved: ${r.resolved})\n`;
    // CARD gate: wq[0] is the original draft; later wq entries with fixNotes are rewrites
    cardsSeen++;
    const draft0 = r.wq[0];
    const rewrites = r.wq.filter(x => x.fixNotes?.length);
    if (draft0 && rewrites.length) {
      cardFires++;
      const notes = rewrites.flatMap(x => x.fixNotes ?? []);
      const revNotes = notes.filter(isReviewNote);
      if (revNotes.length && revNotes.length === notes.length) cardReviewOnly++;
      out += `\nCARD REWRITTEN (${rewrites.length} pass(es)); notes:\n${notes.map(n => `- ${n}`).join('\n')}\n`;
      out += `\n### Card draft A (pre-rewrite)\n${cardText(draft0.out)}\n`;
      out += `\n### Card draft B (shipped)\n${cardText(rewrites[rewrites.length - 1]!.out)}\n`;
    } else if (draft0) {
      out += `\nCARD passed clean.\n${cardText(draft0.out)}\n`;
    }
    // RESOLUTION gate: first resolve = batch; a later resolve WITH fixNotes = the review redo
    if (r.resolved && r.resolves.length) {
      repsSeen++;
      const first = r.resolves[0]!.outs[0];
      const redo = r.resolves.find((x, ix) => ix > 0 && x.fixNotes?.length);
      if (first && redo?.outs[0]) {
        repFires++;
        out += `\nREPORT REWRITTEN; notes:\n${(redo.fixNotes ?? []).map(n => `- ${n}`).join('\n')}\n`;
        out += `\n### Report draft A (pre-rewrite)\n${repText(first)}\n`;
        out += `\n### Report draft B (shipped)\n${repText(redo.outs[0])}\n`;
      } else if (first) {
        out += `\nREPORT passed clean.\n`;
      }
    }
  }
  out += `\n\n---\n# STATS\n- runs: ${results.filter(x => !x.skip).length}/${runs} · cards seen ${cardsSeen} · reports seen ${repsSeen}\n`;
  out += `- card gate fired: ${cardFires}/${cardsSeen} (review-only trigger: ${cardReviewOnly})\n`;
  out += `- report gate fired: ${repFires}/${repsSeen}\n`;
  out += `- review calls: ${reviewCalls} · mean latency ${(reviewMs / Math.max(reviewCalls, 1) / 1000).toFixed(1)}s each\n`;
  out += `- total AI cost: $${cost.toFixed(3)}\n`;
  fs.writeFileSync(OUT, out);
  console.log(`done → ${OUT} (card ${cardFires}/${cardsSeen}, report ${repFires}/${repsSeen}, $${cost.toFixed(3)})`);
}
main().catch(e => { console.error(e); process.exit(1) });
