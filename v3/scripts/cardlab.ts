// CARD LAB — measure beat-1 cards against docs/CARD_GOLD_STANDARD.md.
//
// Two instruments, on purpose:
//   MECHANICAL (deterministic, zero noise) — the checks that replicate. Naked names, opener,
//     length, coined names, boilerplate survival.
//   JUDGED (noisy) — the four-question cold-reader test. Never trusted from one run.
//
// Usage: npx tsx scripts/cardlab.ts <variant> [samplesPerFixture]
//   variant: v1 (shipped) | v2 (enriched inputs + revised prompt)
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import OpenAI from 'openai';

const FX = `${import.meta.dirname}/prosebench/fixtures`;
const variant = process.argv[2] ?? 'v1';
const N = Number(process.argv[3] ?? 3);
function loadKey(): string {
  for (const p of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/); if (m) return m[1]!.trim().replace(/^["']|["']$/g, '') } catch { }
  }
  return process.env.OPENAI_API_KEY!;
}
const ai = new OpenAI({ apiKey: loadKey() });

// ───────────────────────── MECHANICAL METRICS ─────────────────────────
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 1);
const words = (s: string) => s.trim().split(/\s+/).length;

/** A name is "naked" when its FIRST appearance is not preceded, in its own sentence, by an
 *  indefinite designation ("a steward…", "an elf…"). That is the known-new contract, checked. */
function nakedNames(card: string, names: string[]): string[] {
  const out: string[] = [];
  for (const n of names) {
    const first = n.split(/\s+/)[0]!;
    const i = card.search(new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
    if (i < 0) continue;
    const sentStart = Math.max(0, card.lastIndexOf('.', i - 1) + 1);
    if (!/\b(a|an)\s+[a-z]/.test(card.slice(sentStart, i))) out.push(n);
  }
  return out;
}
/** Proper nouns on the card that the payload never dealt — the writer coined them. */
function coined(card: string, payload: string): string[] {
  const STOP = new Set(['The', 'A', 'An', 'He', 'She', 'They', 'It', 'His', 'Her', 'Their', 'You', 'Your', 'Word', 'Coin', 'No', 'One', 'Nobody', 'Some', 'Whether', 'By', 'When', 'If', 'But', 'And', 'That', 'This', 'What', 'Who', 'Now', 'Then', 'There', 'Here', 'Pay', 'Bring', 'Ask', 'Find', 'Take', 'Search', 'Go', 'Travel', 'Ride', 'Word']);
  return [...new Set((card.match(/(?<=[a-z,;:]\s)[A-Z][a-z]{2,}/g) ?? []))]
    .filter(w => !STOP.has(w) && !payload.includes(w));
}
const opensOnPerson = (card: string) => /^(A|An|The)\s+[a-z-]+(\s+[a-z-]+){0,4}\s+(who\s+\S+\s+)?[a-z]+(s|ed)\b/.test(card.trim())
  || /^[A-Z][a-z]+(\s+of\s+[A-Z][a-z]+)?\s+[a-z]+(s|ed)\b/.test(card.trim());

const JUDGE = `You are handed a job posting from a mercenary company's board. You know nothing else —
no prior cards, no story so far. Answer strictly from the posting.

Four questions, each true only if a first-time reader can actually ANSWER it:
  hirer   — can you say who is hiring the company, well enough to picture them?
  matter  — can you say what the job is actually about?
  why     — can you say why it matters TO SOMEONE IN THE STORY? (a rumour about what the job might
            be worth to the company is NOT a why; it must be a person's own stake)
  steel   — can you say why it needs armed strangers rather than a servant or a runner?

For EACH question you answer true, you must quote the exact words from the posting that answer it —
copied character-for-character from the posting, not paraphrased. If you cannot quote it, it is false.

Respond as JSON: {"hirer":{"y":bool,"q":"<quote>"},"matter":{"y":bool,"q":"<quote>"},
"why":{"y":bool,"q":"<quote>"},"steel":{"y":bool,"q":"<quote>"}}`;

/** A judge's "true" only counts if the words it cites are ACTUALLY in the card. This turns the
 *  soft half of the instrument into a checkable one — an ungrounded yes is scored as a no. */
const grounded = (card: string, v: unknown): boolean => {
  const o = v as { y?: boolean; q?: string } | undefined;
  if (o?.y !== true) return false;
  const q = (o.q ?? '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  if (q.length < 2) return false;
  const c = card.toLowerCase();
  return q.filter(w => c.includes(w)).length / q.length >= 0.7;
};

type Row = { fx: string; card: string; q: Record<string, boolean>; naked: string[]; coined: string[]; opens: boolean; w: number; s: number };
const rows: Row[] = [];
const fixtures = variant === 'v2'
  ? [['v2-system.txt', 'v2-user-A.json'], ['v2-system.txt', 'v2-user-7712.json'], ['v2-system.txt', 'v2-user-3391.json']]
  : [['beat1-system.txt', 'beat1-user.json'], ['beat1-system-7712.txt', 'beat1-user-7712.json'], ['beat1-system-3391.txt', 'beat1-user-3391.json']];

for (const [sysF, usrF] of fixtures) {
  const system = fs.readFileSync(`${FX}/${sysF}`, 'utf8');
  const user = fs.readFileSync(`${FX}/${usrF}`, 'utf8');
  const names: string[] = (JSON.parse(user).bible?.cast ?? []).map((m: { name?: string }) => m.name).filter(Boolean);
  for (let i = 0; i < N; i++) {
    let card = '';
    try {
      const r = await ai.chat.completions.create({ model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] } as never) as { choices: { message: { content: string } }[] };
      card = String(JSON.parse(r.choices[0]!.message.content || '{}').situation ?? '');
    } catch (e) { console.error('gen', (e as Error).message.slice(0, 60)) }
    if (!card) continue;
    let q: Record<string, boolean> = {};
    try {
      const r = await ai.chat.completions.create({ model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: JUDGE }, { role: 'user', content: card }] } as never) as { choices: { message: { content: string } }[] };
      const raw = JSON.parse(r.choices[0]!.message.content || '{}');
      for (const k of ['hirer', 'matter', 'why', 'steel']) q[k] = grounded(card, raw[k]);
    } catch { /* skip */ }
    rows.push({ fx: usrF, card, q, naked: nakedNames(card, names), coined: coined(card, user), opens: opensOnPerson(card), w: words(card), s: sentences(card).length });
  }
}

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / (v.length || 1);
const pct = (v: boolean[]) => `${Math.round(100 * v.filter(Boolean).length / (v.length || 1))}%`;
console.log(`\n${'='.repeat(72)}\n  ${variant.toUpperCase()}  ·  n=${rows.length}\n${'='.repeat(72)}`);
console.log('  MECHANICAL (deterministic)');
console.log(`    opens on a person acting     ${pct(rows.map(r => r.opens))}`);
console.log(`    naked names per card         ${mean(rows.map(r => r.naked.length)).toFixed(2)}   (cards with none: ${pct(rows.map(r => r.naked.length === 0))})`);
console.log(`    coined proper nouns per card ${mean(rows.map(r => r.coined.length)).toFixed(2)}`);
console.log(`    words / sentences            ${mean(rows.map(r => r.w)).toFixed(0)} / ${mean(rows.map(r => r.s)).toFixed(1)}`);
console.log('  JUDGED (noisy — never trust one run)');
for (const k of ['hirer', 'matter', 'why', 'steel']) console.log(`    ${k.padEnd(28)} ${pct(rows.map(r => r.q[k] === true))}`);
console.log(`    ${'ALL FOUR'.padEnd(28)} ${pct(rows.map(r => ['hirer', 'matter', 'why', 'steel'].every(k => r.q[k] === true)))}`);
console.log(`    ${'mean answered /4'.padEnd(28)} ${mean(rows.map(r => ['hirer', 'matter', 'why', 'steel'].filter(k => r.q[k] === true).length)).toFixed(2)}`);
for (const r of rows) console.log(`\n── ${r.fx} ${r.naked.length ? `[naked: ${r.naked.join(', ')}]` : ''}${r.coined.length ? ` [coined: ${r.coined.join(', ')}]` : ''}\n   ${r.card}`);
fs.writeFileSync(`${FX}/../lab-${variant}.json`, JSON.stringify(rows, null, 1));
