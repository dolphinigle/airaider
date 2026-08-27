// Capture REAL beat-1 saga prompts as lab fixtures: the full rendered (system, user) pair the
// game sends, plus the un-staged bible behind it, plus what the model actually wrote.
// One fixture per saga. Usage: npx tsx scripts/capturebeat1.ts [seed] [howMany]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const seed = Number(process.argv[2] ?? 5100);
const want = Number(process.argv[3] ?? 4);
const OUT = `${import.meta.dirname}/prosebench/fixtures`;
fs.mkdirSync(OUT, { recursive: true });

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room');
let got = 0;
for (let c = 0; c < 10 && got < want; c++) {
  for (const lead of [...g.visibleLeads()]) {
    if (got >= want) break;
    if (!lead.chainInfo?.kind || lead.chainInfo.kind === 'none') continue;  // sagas only
    const before = g.ai.callLog().length;
    const r = await g.pursue(lead.id);
    if (!r.ok || !r.questId) continue;
    const q = g.state.quests.find(x => x.id === r.questId)!;
    if (q.beatIndex !== 1) continue;
    const rec = g.ai.callLog().slice(before).filter(x => x.purpose === 'writeQuest').pop();
    if (!rec?.systemPreview) continue;
    const chain = g.state.chains.find(ch => ch.id === q.chainId);
    const id = `${seed}-${++got}`;
    fs.writeFileSync(`${OUT}/n${id}.system.txt`, rec.systemPreview);
    fs.writeFileSync(`${OUT}/n${id}.user.json`, rec.userPrompt ?? '');
    fs.writeFileSync(`${OUT}/n${id}.meta.json`, JSON.stringify({
      seed, chainId: q.chainId, title: chain?.bible.title, bible: chain?.bible,
      shipped: { title: q.title, situation: q.situation, job: q.job },
    }, null, 1));
    console.log(`n${id}  ${chain?.bible.title}\n   ${q.situation}\n`);
  }
  await g.endCycle();
}
console.log(`captured ${got} · ~$${g.ai.usage().costUsd.toFixed(2)}`);
