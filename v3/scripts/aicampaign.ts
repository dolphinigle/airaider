// Real-AI dogfood: play a story chain to its finale + one-offs alongside.
// Prints all prose — this is the fun-check artifact. ~25-35 AI calls.
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins } from '../src/engine/roll.js';
import * as fs from 'node:fs';

const g = new Game(makeOpenAiProvider(), Number(process.argv[2] ?? 99));
const out: string[] = [];
const say = (s: string) => { console.log(s); out.push(s) };

g.build('map-room');
g.build('lead-room');

async function playCycle() {
  // fill any open quest with best-coins mercs
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) {
      let bestG = q.approaches[0]!.id, bestC = -1;
      for (const a of q.approaches) {
        const slot = q.slots.find(s => s.groupId === a.id);
        if (!slot) continue;
        const free = g.roster().filter(m => m.location.kind === 'held');
        const c = Math.max(0, ...free.map(m => coins(m, slot.test)));
        if (c > bestC) { bestC = c; bestG = a.id }
      }
      g.chooseApproach(q.id, bestG);
      say(`   [approach chosen: ${q.approaches.find(a => a.id === bestG)!.label}]`);
    }
    for (let i = 0; i < q.slots.length; i++) {
      const s = q.slots[i]!;
      if (s.filledBy || (q.approaches && s.groupId !== q.chosenApproach)) continue;
      const free = g.roster().filter(m => m.location.kind === 'held');
      if (!free.length) break;
      const best = free.sort((a, b) => coins(b, s.test) - coins(a, s.test))[0]!;
      g.assign(q.id, i, best.id);
    }
    const o = g.questOdds(q.id);
    say(`   [odds: ${o.coins} coins vs bar ${o.bar.toFixed(1)}]`);
  }
  const report = await g.endCycle();
  for (const line of report) say(`   ${line}`);
}

say('════ REAL-AI CAMPAIGN ════');
// 1) start the story
const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
await g.pursue(story.id);
const chain = g.state.chains[0]!;
say(`\n[BIBLE — hidden] ${chain.bible.title}`);
say(`kernel: ${chain.bible.kernel}`);
say(`goal: ${chain.bible.goal}`);
say(`twist: ${chain.bible.twist ?? '(none)'}`);
say(`cast: ${chain.bible.cast.map(c => `${c.name} (${c.role})`).join(' · ')}`);

// 2) play cycles until the chain ends (pursue its continuation each time), max 14
for (let i = 0; i < 14; i++) {
  const beat = g.state.quests.find(q => q.chainId === chain.id && q.state === 'open');
  if (!beat) {
    const cont = g.visibleLeads().find(l => l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === chain.id);
    if (cont) { await g.pursue(cont.id) } else if (chain.state === 'done' || chain.state === 'slipped') break;
  }
  const q = g.state.quests.find(x => x.chainId === chain.id && x.state === 'open');
  if (q) {
    say(`\n──── BEAT ${q.beatIndex}${q.isFinale ? ' (FINALE)' : ''}: ${q.title} ────`);
    say(q.situation);
    say(`JOB: ${q.job}`);
  }
  // also run one side quest if a merc is free
  const side = g.visibleLeads().find(l => l.chainInfo.kind === 'none' && l.expiresAtCycle !== null);
  if (side && g.roster().filter(m => m.location.kind === 'held').length > (q?.slots.length ?? 0)) {
    await g.pursue(side.id);
  }
  await playCycle();
  say(`   [chain: ${chain.state} · bank ${chain.bank.toFixed(0)}/${chain.payoff.toFixed(0)} · effort ${chain.cyclesSpent}/${(chain.expectedBeats * 1.5).toFixed(1)} · failures ${chain.failures}/${chain.failureBudget}]`);
}

say(`\n════ CHAIN ENDED: ${chain.state} ════`);
const focal = g.card(chain.focalId);
say(`focal ${focal?.name}: location ${JSON.stringify(focal?.location)}`);
say(`\nDOSSIERS AFTER THE SAGA:`);
for (const m of g.roster()) say(g.dossier(m.id) + '\n');
if (focal) say(g.dossier(focal.id));
const u = g.ai.usage();
say(`\nAI usage: ${u.calls} calls · ${u.inputTokens} in / ${u.outputTokens} out · ~$${u.costUsd.toFixed(3)}`);
fs.writeFileSync((process.argv[3] ?? '/home/irvan/.claude/jobs/0731b68a/tmp/aicampaign.log'), out.join('\n'));
