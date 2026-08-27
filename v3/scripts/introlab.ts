// INTRO LAB — can a cheap model hold the known-new contract on a saga's first card?
//
// The defect (PLAYTEST_NOTES N2): beat-1 cards open on proper nouns the player has never met.
// Linguistically that is a presupposition failure — a proper noun is a DEFINITE reference, and a
// first mention should be INDEFINITE ("a female craftsman who calls herself an inventor"), which
// is exactly what the designer's own Sultan's Game sample does before naming Mahir in the result.
//
// 2x2: the RULE (wording) x WITHHOLDING THE NAMES (input shaping), over real captured prompts.
// Usage: npx tsx scripts/introlab.ts [samplesPerCell]
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import OpenAI from 'openai';

const SC = '/tmp/claude-1000/-home-irvan-airaider/0731b68a-6719-42b3-a751-abe4a16c872b/scratchpad';
const N = Number(process.argv[2] ?? 2);
function loadKey(): string {
  for (const p of [path.resolve(process.cwd(), '../.env'), path.resolve(process.cwd(), '.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/); if (m) return m[1]!.trim().replace(/^["']|["']$/g, '') } catch { }
  }
  return process.env.OPENAI_API_KEY!;
}
const client = new OpenAI({ apiKey: loadKey() });

/** the rule, written as one line in the prompt's own register */
const RULE = '\n5. NOBODY THE PLAYER HAS MET YET IS NAMED. A name is a word for someone already known; on this card every person and place arrives by WHAT THEY ARE — "a wandering healer who will not stay in town", "a border reeve too old to walk his road" — and the reader learns their name later, when the company reaches them. Never a proper noun for a stranger.';

/** turn a cast member's `who` into how the card must refer to them */
function designate(who: string, role = 'someone'): string {
  const fallback = { client: 'the client', quarry: 'the one they want', obstacle: 'someone in the way' }[role] ?? 'a stranger';
  const first = (who || '').split(/[.;]/)[0]!.trim();
  if (first.length < 4) return fallback;
  // keep the article the `who` already has, and do NOT lowercase — "A Millbrook merchant" is a
  // proper noun inside a common phrase, and flattening it produced "a millbrook merchant"
  const cut = first.split(/\s+(?:who|that|which)\s+/i)[0]!.trim();
  return /^(a|an|the)\s/i.test(cut) ? cut : `a ${cut}`;
}

/** strip every cast name from the payload, replacing it with its designation */
function withhold(userJson: string): string {
  const u = JSON.parse(userJson);
  const cast = u.bible?.cast ?? [];
  let s = userJson;
  for (const m of cast) {
    if (!m.name) continue;
    const d = designate(m.who, m.role);
    for (const form of [...new Set([m.name, m.name.split(/\s+/)[0]])]) {
      s = s.split(form).join(d);
    }
  }
  const u2 = JSON.parse(s);
  for (const m of (u2.bible?.cast ?? [])) { m.callThem = designate(m.who, m.role); delete m.name }
  return JSON.stringify(u2);
}

const JUDGE = `You are handed a job posting from a mercenary company's board. You know nothing else —
no prior cards, no story so far. Answer strictly from the posting.

Answer four questions with true/false, judging whether a first-time reader can ANSWER them:
  hirer   — can you say who is hiring the company, well enough to picture them?
  matter  — can you say what the job is actually about?
  why     — can you say why it matters to anyone?
  steel   — can you say why it needs armed strangers rather than a servant?

Then count: strangers = how many proper nouns (people or places) appear that the posting never
explains. A name with an explanation attached does not count.

Respond as JSON: {"hirer":bool,"matter":bool,"why":bool,"steel":bool,"strangers":int,"note":"<8 words>"}`;

type Cell = { label: string; rule: boolean; hide: boolean; why?: boolean };
const CELLS: Cell[] = [
  { label: 'V0 baseline        ', rule: false, hide: false },
  { label: 'V1 rule only       ', rule: true, hide: false },
  { label: 'V3 rule + withhold ', rule: true, hide: true },
  { label: 'V4 rule + the WHY  ', rule: true, hide: false, why: true },
];

const seeds = ['', '-7712', '-3391'];
const results: Record<string, { score: number[]; strangers: number[]; cards: string[] }> = {};
for (const c of CELLS) results[c.label] = { score: [], strangers: [], cards: [] };

for (const sfx of seeds) {
  const system0 = fs.readFileSync(`${SC}/beat1-system${sfx}.txt`, 'utf8');
  const user0 = fs.readFileSync(`${SC}/beat1-user${sfx}.json`, 'utf8');
  for (const c of CELLS) {
    const why = '\n6. THE CARD MUST ANSWER, for a reader who knows nothing: who is hiring, what the job is, WHY IT MATTERS TO THE ONE HIRING, and why it takes armed strangers rather than a servant. The why is a thing at stake for a person on this card — never a rumour about what someone is worth. Spend the words the pay sentence and the rumour would have taken; the pay is one short clause and the rumour is cut.';
    const system = c.rule ? system0.replace(/\nRespond as the JSON object specified above[^\n]*/, RULE + (c.why ? why : '') + '\nRespond as the JSON object specified above — nothing else.') : system0;
    const user = c.hide ? withhold(user0) : user0;
    for (let i = 0; i < N; i++) {
      let card = '';
      try {
        const r = await client.chat.completions.create({
          model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        } as never) as { choices: { message: { content: string } }[] };
        card = String(JSON.parse(r.choices[0]!.message.content || '{}').situation ?? '');
      } catch (e) { card = `[gen failed: ${(e as Error).message.slice(0, 40)}]` }
      if (!card || card.startsWith('[')) continue;
      let j: Record<string, unknown> = {};
      try {
        const r = await client.chat.completions.create({
          model: 'gpt-5-mini', reasoning_effort: 'low', response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: JUDGE }, { role: 'user', content: card }],
        } as never) as { choices: { message: { content: string } }[] };
        j = JSON.parse(r.choices[0]!.message.content || '{}');
      } catch { /* skip */ }
      const score = ['hirer', 'matter', 'why', 'steel'].filter(k => j[k] === true).length;
      results[c.label]!.score.push(score);
      results[c.label]!.strangers.push(Number(j.strangers ?? 0));
      results[c.label]!.cards.push(card);
    }
  }
}

console.log(`\n${'='.repeat(78)}\nCAN A COLD READER ANSWER THE FOUR QUESTIONS?  (n=${N * seeds.length} per cell)\n${'='.repeat(78)}`);
console.log('  cell                  answered/4     unexplained proper nouns');
for (const c of CELLS) {
  const r = results[c.label]!;
  const m = (v: number[]) => (v.reduce((a, b) => a + b, 0) / (v.length || 1));
  console.log(`  ${c.label}   ${m(r.score).toFixed(2)}            ${m(r.strangers).toFixed(2)}      (n=${r.score.length})`);
}
for (const c of CELLS) {
  console.log(`\n── ${c.label.trim()} ──`);
  for (const card of results[c.label]!.cards.slice(0, 3)) console.log(`   ${card}\n`);
}
fs.writeFileSync(`${SC}/introlab.json`, JSON.stringify(results, null, 1));
