// Dump ONE fully rendered prompt (complete system + user) per AI call type, for the
// context-free verifier gate (playtest skill). Drives a short real-AI game.
// Usage: npx tsx scripts/promptdump.ts [seed] [outdir]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins } from '../src/engine/roll.js';

const seed = Number(process.argv[2] ?? 424242);
const outdir = process.argv[3] ?? '/home/irvan/.claude/jobs/2eaaf8c2/tmp/prompts';

const g = new Game(makeOpenAiProvider(), seed);
const ORDER = ['map-room', 'lead-room', 'scouting-forests'];

for (let c = 0; c < 10; c++) {
  if (g.ai.usage().costUsd > 0.6) break;
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ORDER) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (st && !st.reason) { g.build(b); break }
  }
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
      const free = fit();
      if (!free.length) break;
      g.assign(q.id, i, free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!.id);
    }
  }
  await g.endCycle();
  // stop as soon as we have every call type on record
  const seen = new Set(g.ai.callLog().map(r => r.purpose));
  if (['writeQuest', 'genesis', 'resolve', 'flesh'].every(p => seen.has(p))) break;
}

fs.mkdirSync(outdir, { recursive: true });
const recs = g.ai.callLog();
// one-off vs beat writeQuest are different renders — keep the first of each
const picks = new Map<string, (typeof recs)[number]>();
for (const r of recs) {
  let key = r.purpose;
  if (r.purpose === 'writeQuest') {
    try { key = JSON.parse(r.userPrompt).beat !== undefined && JSON.parse(r.userPrompt).beat !== null ? 'writeQuest-beat' : 'writeQuest-oneoff' }
    catch { key = 'writeQuest-oneoff' }
  }
  if (!picks.has(key)) picks.set(key, r);
}
for (const [key, r] of picks) {
  const p = path.join(outdir, `${key}.txt`);
  fs.writeFileSync(p, `==== SYSTEM ====\n${r.systemPreview}\n\n==== USER ====\n${r.userPrompt}\n`);
  console.log(`${key} → ${p}`);
}
console.log(`AI: ~$${g.ai.usage().costUsd.toFixed(2)}`);
