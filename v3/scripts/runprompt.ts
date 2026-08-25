// STANDALONE PROMPT RUNNER — for independent prompt-writer agents.
// Each agent writes its own system prompt to a plain .txt file and tests it here, without touching
// any shared file. Usage:
//   npx tsx scripts/runprompt.ts --prompt myprompt.txt --n 24 --out myout.md [--seed 1]
// Prints a lint summary and writes the cards to --out.
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { lintCard } from './cardlint.js';
import { MOTIVES2 } from './motives2.js';
import { SHAPES } from './shapes.js';
import { STRUCTURES } from './structures.js';
import { OPENINGS } from './openings.js';
import type { QuestWriteInput } from '../src/ai/provider.js';

const arg = (n: string, d?: string) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1]! : d; };
const promptPath = arg('prompt')!, n = Number(arg('n', '24')), out = arg('out', '/tmp/out.md')!, seed = Number(arg('seed', '1'));
// --structure deals a CARD-STRUCTURE token per call (structures.ts). OPT-IN: without the flag the
// payload is byte-identical to before, so earlier runs stay comparable.
const useStructure = process.argv.includes('--structure');
const useOpening = process.argv.includes('--opening');
if (!promptPath) { console.error('need --prompt <file>'); process.exit(1) }
const system = fs.readFileSync(promptPath, 'utf8');

function loadKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const p of ['/home/irvan/airaider/.env', `${process.env.HOME}/.airaider/openai.env`])
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*"?([^"\n]+)"?/); if (m) return m[1]!.trim() } catch {}
  throw new Error('no key');
}
const all: QuestWriteInput[] = JSON.parse(fs.readFileSync('/home/irvan/airaider/v3/scripts/prosebench/pull-fixtures.json', 'utf8'));
const pool = all.filter(i => !i.framedCharacter);
const byArch = new Map<string, QuestWriteInput[]>();
for (const i of pool) { const k = i.archetype ?? '-'; if (!byArch.has(k)) byArch.set(k, []); byArch.get(k)!.push(i) }
const picks: QuestWriteInput[] = [];
for (let r = 0; picks.length < n; r++) { let added = false;
  for (const [, l] of [...byArch].sort()) if (l[r] && picks.length < n) { picks.push(l[r]!); added = true }
  if (!added) break }

const TOKEN: Record<string, string> = { 'coin': 'coin', 'a person who may join the company': 'a recruit',
  'the pick of what the job turns up': 'salvage-rights', 'first claim on what the road yields': 'salvage-rights',
  'whatever worth the work shakes loose': 'salvage-rights', 'a person taken': 'a captive' };

/** The engine payload as the writer receives it, plus the seeded fields. */
const userOf = (i: QuestWriteInput, k: number) => {
  const m = MOTIVES2[((k + seed) * 17) % MOTIVES2.length]!;
  return JSON.stringify({
    archetype: i.archetype, location: i.location, gravity: i.gravity,
    rewardEnvelope: String(i.rewardEnvelope ?? '').split(' + ').map(p => TOKEN[p] ?? p),
    KEYWORDS: i.keywords?.join(', '), placeNameSuggestions: i.placeNameSuggestions,
    opening: i.opening, intake: i.intake, slotCount: i.slotCount,
    shape: SHAPES[((k + seed) * 13) % SHAPES.length],
    ask: m.want, seen: m.tell,
    ...(useOpening ? { openWith: OPENINGS[((k + seed) * 7) % OPENINGS.length] } : {}),
    ...(useStructure ? { structure: STRUCTURES[((k + seed) * 11) % STRUCTURES.length] } : {}),
  });
};

const client = new OpenAI({ apiKey: loadKey() });
const res = await Promise.all(picks.map(async (i, k) => {
  const r = await client.chat.completions.create({ model: 'gpt-5-mini',
    messages: [{ role: 'system', content: system }, { role: 'user', content: userOf(i, k) }],
    response_format: { type: 'json_object' }, reasoning_effort: 'low' } as never) as { choices: { message: { content: string } }[] };
  try { return { i, k, o: JSON.parse(r.choices[0]!.message.content ?? '{}') } } catch { return { i, k, o: null } }
}));

const md: string[] = [`# ${promptPath} — n=${picks.length}${useStructure ? ' — STRUCTURE dealt' : ''}\n`]; const tal: Record<string, number> = {}; let clean = 0;
for (const { i, k, o } of res.sort((a, b) => a.k - b.k)) {
  if (!o) { md.push('## PARSE FAIL\n'); continue }
  const s = String(o.situation ?? '');
  const f = lintCard(s, i);
  if (!f.length) clean++;
  for (const x of new Set(f.map(y => y.code))) tal[x] = (tal[x] ?? 0) + 1;
  md.push(`## ${k + 1} · ${i.archetype} · ${i.gravity} · ${s.split(/\s+/).length}w`);
  if (useStructure) md.push(`\`structure:\` ${STRUCTURES[((k + seed) * 11) % STRUCTURES.length]}`);
  md.push(`**${o.title}**\n\n${s}\n\n\`JOB:\` ${o.job}\n`);
  md.push(f.length ? `\`lint:\` ${f.map(x => x.code + (x.detail ? ':' + x.detail : '')).join(' · ')}\n` : '`lint:` clean\n');
}
fs.writeFileSync(out, md.join('\n'));
const ws = res.filter(r => r.o).map(r => String(r.o.situation ?? '').split(/\s+/).length).sort((a, b) => a - b);
console.log(`lint-clean ${clean}/${picks.length} (${(clean / picks.length * 100).toFixed(0)}%)  median ${ws[Math.floor(ws.length / 2)]}w`);
console.log(`flags: ${Object.entries(tal).sort((a,b)=>b[1]-a[1]).map(([k2, v]) => k2 + ':' + v).join(' · ') || 'none'}`);
console.log(`cards written to ${out}`);
