// Dump the FINALE renders (writeQuest-finale + finale resolve) — the climax surface that
// ordinary promptdump runs never reach. Forces a chain to its finale like the §35 test does.
// Usage: npx tsx scripts/finaledump.ts [seed] [outdir]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { freshId } from '../src/engine/cards.js';

const seed = Number(process.argv[2] ?? 909090);
const outdir = process.argv[3] ?? '/tmp/finaleprompts';

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('lead-room');
const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
await g.pursue(story.id);                       // genesis + beat 1 (real AI)
const chain = g.state.chains[0]!;
chain.cyclesSpent = 999;                        // force the climax gate
chain.bank = Math.round(g.card(chain.focalId)!.value * 0.9);
for (const q of [...g.state.quests]) g.abandon(q.id);
g.state.leads.push({
  id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
  archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: 'x' },
  expiresAtCycle: g.state.cycle + 5, source: 'continuation',
});
await g.pursue(g.state.leads[g.state.leads.length - 1]!.id);   // finale writeQuest (real AI)
const finale = g.state.quests.find(q => q.isFinale);
if (!finale) { console.error('no finale generated'); process.exit(1) }
g.chooseApproach(finale.id, finale.approaches![0]!.id);
const slotIdx = finale.slots.findIndex(s => s.groupId === finale.approaches![0]!.id);
const merc = g.roster()[0]!;
merc.character!.attrs = { str: 500, dex: 500, int: 500, cha: 500, con: 500 };
g.assign(finale.id, slotIdx, merc.id);
await g.endCycle();                              // finale resolve (real AI)

fs.mkdirSync(outdir, { recursive: true });
const recs = g.ai.callLog();
const isFinaleWrite = (r: (typeof recs)[number]) => {
  try { const u = JSON.parse(r.userPrompt); return u.beat !== undefined && r.systemPreview.includes('THIS IS THE FINALE') } catch { return false }
};
const finaleWrite = recs.filter(r => r.purpose === 'writeQuest').find(isFinaleWrite);
const finaleResolve = [...recs].reverse().find(r => r.purpose === 'resolve');
for (const [key, r] of [['writeQuest-finale', finaleWrite], ['resolve-finale', finaleResolve]] as const) {
  if (!r) { console.error(`missing ${key}`); continue }
  const p = path.join(outdir, `${key}.txt`);
  fs.writeFileSync(p, `==== SYSTEM ====\n${r.systemPreview}\n\n==== USER ====\n${r.userPrompt}\n`);
  console.log(`${key} → ${p}`);
}
console.log(`AI: ~$${g.ai.usage().costUsd.toFixed(2)}`);
