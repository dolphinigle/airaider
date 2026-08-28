// ONE saga genesis, complete: the full system prompt, the full user payload, the raw model
// response, and the bible the engine built from it. Usage: npx tsx scripts/_genesisdump.ts [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import type { Lead } from '../src/engine/quests.js';

const seed = Number(process.argv[2] ?? 5150);
const out = process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/genesis.md';
const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room');
// force a saga: a rare lead that STARTS a new chain
const lead: Lead = {
  id: 'gen-1', rarity: 'rare', level: 3, region: 'forests', archetype: 'investigate',
  chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward',
};
g.state.leads.push(lead);
const r = await g.pursue('gen-1');
const gen = g.ai.callLog().find(c => c.purpose === 'genesis');
if (!gen) { console.log('no genesis call:', r.msg); process.exit(1) }

const chain = g.state.chains[g.state.chains.length - 1];
const q = g.state.quests.find(x => x.id === r.questId);
const md = [
  `# One saga genesis, in full`,
  `seed ${seed} · ${gen.model} · ${gen.inputTokens} in / ${gen.outputTokens} out · $${gen.costUsd.toFixed(4)} · ${(gen.durationMs / 1000).toFixed(1)}s`,
  ``, `## 1 · SYSTEM PROMPT (verbatim, as sent)`, '```', gen.systemPreview, '```',
  ``, `## 2 · USER PAYLOAD (verbatim, as sent)`, '```json', gen.userPrompt, '```',
  ``, `## 3 · RAW MODEL RESPONSE`, '```json',
  (() => { try { return JSON.stringify(JSON.parse(gen.output ?? ''), null, 1) } catch { return gen.output ?? '(none)' } })(), '```',
  ``, `## 4 · THE BIBLE THE ENGINE KEPT`, '```json', JSON.stringify(chain?.bible, null, 1), '```',
  ``, `## 5 · BEAT 1, AS THE PLAYER READS IT`,
  q ? `**${q.title}**\n\n${q.situation}\n\n_THE ERRAND_ ${q.job}\n\n_THE PAY_ ${g.questReward(q.id)}` : '(no card)',
].join('\n');
fs.writeFileSync(out, md);
console.log(md);
