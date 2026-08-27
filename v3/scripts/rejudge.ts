// Re-score saved matchscore samples with one judge, so BEFORE and AFTER differ only by build.
// Usage: npx tsx scripts/rejudge.ts LABEL [LABEL...]
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import OpenAI from 'openai';
const SC = '/tmp/claude-1000/-home-irvan-airaider/0731b68a-6719-42b3-a751-abe4a16c872b/scratchpad';
function loadKey(): string {
  for (const p of [path.resolve(process.cwd(), '../.env'), path.resolve(process.cwd(), '.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/); if (m) return m[1]!.trim().replace(/^["']|["']$/g, '') } catch { }
  }
  return process.env.OPENAI_API_KEY!;
}
const client = new OpenAI({ apiKey: loadKey() });

// v1 of this judge scored whether the person would be GOOD AT the job ("untrained peasant — not a
// raid/rescue type") when the person is the one being rescued. Says so now, twice.
const JUDGE = `A mercenary company took a job. The job was ABOUT a person — someone to be found,
freed, seized or brought in. You are shown the job as posted, and the person it turned out to be.

THE PERSON IS THE SUBJECT OF THE JOB, NOT A HIRE. Never judge whether they could do the job or
fight; they are the one the job was about. Judge only whether they are plausibly the person that
posting was describing.

5 — you could have guessed their trade and nature from the posting
4 — clearly the person described; at least one thing about them comes from the posting
3 — nothing contradicts, but nothing about them comes from the posting either; they could be anyone
2 — jars; the posting implied a different sort of person
1 — reads as somebody else entirely

Race and sex are assigned elsewhere and are NEVER evidence, for or against.
Respond as JSON: {"score": <1-5>, "why": "<up to eight words>"}`;

for (const label of process.argv.slice(2)) {
  const data = JSON.parse(fs.readFileSync(`${SC}/matchscore-${label}.json`, 'utf8')) as
    { samples: { title: string; situation: string; job: string; tags: string }[] };
  const scores: number[] = [];
  console.log(`\n═══ ${label} ═══`);
  for (const s of data.samples) {
    const user = `JOB AS POSTED: ${s.title}\n"${s.situation}"\nTask: ${s.job}\n\nWHO IT TURNED OUT TO BE: ${s.tags}`;
    let sc = 0, why = '';
    for (let a = 0; a < 2 && !sc; a++) {
      try {
        const res = await client.chat.completions.create({
          model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: JUDGE }, { role: 'user', content: user }],
        } as never) as { choices: { message: { content: string } }[] };
        const j = JSON.parse(res.choices[0]!.message.content || '{}');
        sc = Number(j.score) || 0; why = String(j.why ?? '');
      } catch (e) { why = (e as Error).message.slice(0, 30) }
    }
    scores.push(sc);
    console.log(`  ${sc || '?'}  ${s.title.padEnd(31).slice(0, 31)} │ ${s.tags.slice(0, 54).padEnd(54)} ${why.slice(0, 40)}`);
  }
  const g = scores.filter(x => x > 0);
  const mean = g.reduce((a, b) => a + b, 0) / (g.length || 1);
  const sd = Math.sqrt(g.reduce((a, b) => a + (b - mean) ** 2, 0) / (g.length || 1));
  console.log(`  ${label}: MEAN ${mean.toFixed(2)} ± ${(sd / Math.sqrt(g.length || 1)).toFixed(2)} (n=${g.length})  ${[1, 2, 3, 4, 5].map(v => `${v}:${g.filter(x => x === v).length}`).join(' ')}`);
}
