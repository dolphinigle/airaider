// DOES THE PERSON A JOB DELIVERS BELONG TO THAT JOB?
// Generates one-offs that hand over a recruit/captive, then has a zero-context judge score, 1-5,
// how plausibly the delivered person comes out of the job as written. Blind: the judge is told
// nothing about builds, and the samples carry no label.
// Usage: npx tsx scripts/matchscore.ts [samples] [seed] [label] [maxUsd]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { renderTags } from '../src/engine/tags.js';
import type { Lead } from '../src/engine/quests.js';

const want = Number(process.argv[2] ?? 10);
const seed = Number(process.argv[3] ?? 909);
const label = process.argv[4] ?? 'run';
const maxUsd = Number(process.argv[5] ?? 2);
const SC = '/tmp/claude-1000/-home-irvan-airaider/0731b68a-6719-42b3-a751-abe4a16c872b/scratchpad';

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('lead-room');
g.maxInFlight = 3;

// rescue/capture bias the reward split toward a person, so the sample fills without burning
// dozens of calls on gold-only jobs
let n = 0;
const mkLead = (archetype: 'rescue' | 'capture'): Lead => ({
  id: `lead-x${++n}`, rarity: 'common', level: 2, region: 'forests', archetype,
  chainInfo: { kind: 'none' }, expiresAtCycle: 99, source: 'starter',
});

type Sample = { title: string; situation: string; job: string; person: string; tags: string };
const samples: Sample[] = [];
const seen = new Set<string>();
while (samples.length < want && g.ai.usage().costUsd < maxUsd) {
  for (let i = 0; i < 3; i++) g.state.leads.push(mkLead(i % 2 ? 'capture' : 'rescue'));
  for (const l of g.visibleLeads()) g.enqueuePursue(l.id);
  await g.drain();
  for (const q of g.state.quests.filter(q => q.state === 'open' && !seen.has(q.id))) {
    seen.add(q.id);
    const p = q.rewardCards.find(c => c.character);
    if (!p) continue;
    samples.push({ title: q.title, situation: q.situation ?? '', job: q.job ?? '',
      person: p.name, tags: renderTags(p.tags).replace('character; ', '') });
  }
  g.state.quests = g.state.quests.filter(q => q.state !== 'open');   // clear the board, keep going
}
console.log(`[${label}] ${samples.length} samples · $${g.ai.usage().costUsd.toFixed(3)} to generate`);

// ── the judge. A PURPOSE-BUILT call, not a piggyback: the first version reused the provider's
// `review` method, whose own system prompt is a cold-reader defect-finder, so it dutifully
// returned defect strings and 8 of 10 scores could not be parsed. A judge needs its own prompt.
import OpenAI from 'openai';
import * as os from 'node:os';
import * as path from 'node:path';
function loadKey(): string {
  for (const p of [path.resolve(process.cwd(), '../.env'), path.resolve(process.cwd(), '.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/); if (m) return m[1]!.trim().replace(/^["']|["']$/g, '') } catch { }
  }
  return process.env.OPENAI_API_KEY!;
}
const client = new OpenAI({ apiKey: loadKey() });
const JUDGE = `You judge whether a person fits the job they came out of.

You are shown a job posting from a mercenary company's board, and the person that job ended up
handing over. Score how plausibly THIS PERSON is the person THIS JOB is about.

5 — their trade and character are what the job implies; you could have guessed them from the posting
4 — clearly compatible; at least one thing about them comes from the job
3 — not contradictory, but nothing about them comes from the job either; they could be anyone
2 — jars; the job implies a different sort of person
1 — reads as somebody else entirely

Judge ONLY the fit between the job and the person. Do not judge the writing, the tags' format, or
whether the job is interesting. Race and sex are set elsewhere and are never evidence either way.
Respond as JSON: {"score": <1-5>, "why": "<up to eight words>"}`;

const scores: number[] = [];
for (const s of samples) {
  const user = `JOB: ${s.title}\n"${s.situation}"\nTask: ${s.job}\n\nPERSON DELIVERED: ${s.tags}`;
  let sc = 0, why = '';
  for (let attempt = 0; attempt < 2 && !sc; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: JUDGE }, { role: 'user', content: user }],
      } as never) as { choices: { message: { content: string } }[] };
      const j = JSON.parse(res.choices[0]!.message.content || '{}');
      sc = Number(j.score) || 0; why = String(j.why ?? '');
    } catch (e) { why = (e as Error).message.slice(0, 40) }
  }
  scores.push(sc);
  console.log(`  ${sc || '?'}  ${s.title.padEnd(32).slice(0, 32)} │ ${s.tags.slice(0, 58).padEnd(58)} ${why.slice(0, 44)}`);
}
const good = scores.filter(x => x > 0);
const mean = good.reduce((a, b) => a + b, 0) / (good.length || 1);
console.log(`\n[${label}] MEAN ${mean.toFixed(2)} over ${good.length}  ·  distribution ${[1, 2, 3, 4, 5].map(v => `${v}:${good.filter(x => x === v).length}`).join(' ')}`);
fs.writeFileSync(`${SC}/matchscore-${label}.json`, JSON.stringify({ label, seed, mean, scores: good, samples }, null, 1));
