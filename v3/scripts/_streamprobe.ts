// Does streaming actually give a progressive reveal on a REASONING model?
// gpt-5-mini @ reasoning_effort low spends part of its wall-clock on hidden reasoning tokens
// that are NOT streamed. This measures: time-to-first-content-token vs total, and the shape
// of content arrival. Decisive for whether "stream the tokens" can fill the reckoning screen.
import OpenAI from 'openai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function loadKey(): string {
  for (const p of [path.resolve(process.cwd(), '../.env'), path.resolve(process.cwd(), '.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/); if (m) return m[1]!.trim().replace(/^["']|["']$/g, '') } catch { }
  }
  return process.env.OPENAI_API_KEY!;
}
const client = new OpenAI({ apiKey: loadKey() });

const SYSTEM = `You write the after-action report of a dark-fantasy mercenary company. Period diction, no numbers, one fact per sentence. Respond as JSON matching: {before: string, after: string}. before = the party arriving at the job, 40 words. after = how the job turned and what they carried away, 120 words.`;
const USER = JSON.stringify({
  title: 'The Ferryman\'s Count', job: 'recover two horses taken from the string at the crossing',
  outcome: 'partial', party: [{ name: 'Marsh', tags: 'human, male, soldier, stubborn' }, { name: 'Ilse', tags: 'elf, female, scout, quiet' }],
  deliveredSummary: 'one horse, and the ferryman\'s boy taken as a captive',
});

async function once(label: string) {
  const t0 = Date.now();
  const stream = await client.chat.completions.create({
    model: 'gpt-5-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }],
    response_format: { type: 'json_object' }, reasoning_effort: 'low', stream: true,
  } as never) as never as AsyncIterable<{ choices: { delta?: { content?: string } }[] }>;
  const marks: number[] = [];
  let chars = 0;
  for await (const ev of stream) {
    const d = ev.choices?.[0]?.delta?.content;
    if (d) { marks.push(Date.now() - t0); chars += d.length }
  }
  const total = Date.now() - t0;
  const first = marks[0] ?? total;
  // biggest silence between consecutive content chunks
  let gap = first;
  for (let i = 1; i < marks.length; i++) gap = Math.max(gap, marks[i]! - marks[i - 1]!);
  console.log(`${label}: total ${(total / 1000).toFixed(1)}s · first content token at ${(first / 1000).toFixed(1)}s (${(100 * first / total).toFixed(0)}% of the wait) · ${chars} chars in ${marks.length} chunks · longest silence ${(gap / 1000).toFixed(1)}s`);
}

for (let i = 0; i < Number(process.argv[2] ?? 3); i++) await once(`run ${i + 1}`);
