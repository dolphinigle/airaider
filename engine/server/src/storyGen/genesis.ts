// storyGen — character-first bible generation, built from scratch.
//
// HOW STORIES ARE ACTUALLY BORN (King/Gaiman/Egri + craft research):
//   GENESIS   collide a "what if" SEED with persistent-pool characters → a kernel.
//   WHY-LADDER ask "why?" to bedrock → believable history; secrets EMERGE from
//             history + feeling (shame/fear/guilt), never a forced field.
//   ASSEMBLE  state the believable hidden TRUTH (cast + situation + tensions +
//             loose directions). No reveal-cadence machinery — that's the
//             quest-writer's job downstream.
//
// Run: cd engine/server && AIRAIDER_BIBLE_MODEL=gpt-5-mini AIRAIDER_BIBLE_EFFORT=low \
//        npx tsx src/storyGen/genesis.ts [seedId] [--anchor <charId>]

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { writeFileSync, copyFileSync } from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { CharacterPool, type PoolCharacter } from '../chainBible/characterPool.js';
import { SEEDS, pickSeed, seedById, type Seed } from './seeds.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const MODEL = process.env.AIRAIDER_BIBLE_MODEL ?? 'gpt-5-mini';
const EFFORT = (process.env.AIRAIDER_BIBLE_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';
const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-storygen-pool.json';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const GenesisSchema = z.object({
  kernel: z.string().min(20),                 // 2-3 sentences: how the seed lands on THESE people, the fresh situation
  coreCharacterIds: z.array(z.string()).min(1).max(3),
  newRoleNeeded: z.string().optional(),       // if a person must be coined to complete the collision, what role
});
type Genesis = z.infer<typeof GenesisSchema>;

const PersonSchema = z.object({
  name: z.string().min(2),
  who: z.string().min(10),                    // what anyone would observe of them
  history: z.array(z.string().min(8)).min(1), // the why-ladder, one link per bullet, ending at bedrock
  wants: z.string().min(6),                   // plain present motive
  feels: z.string().min(6),                   // how they regard their own history (pride/shame/grief/fear)
  conceals: z.union([z.string(), z.boolean(), z.null(), z.record(z.any())]).optional(), // string ONLY if a feeling makes hiding natural; model may send false/null for "nothing" or an object {what,why} at low effort
});

const BibleSchema = z.object({
  title: z.string().min(2).max(80),
  leadBlurb: z.string().min(20),              // player-facing; mundane-contract tone; reveals NOTHING hidden
  cast: z.array(z.object({
    person: PersonSchema,
    roleInStory: z.string().optional(),
  })).min(2).max(6),
  situation: z.string().min(30),              // the believable present truth, told straight
  tensions: z.array(z.union([z.string().min(15), z.record(z.any())])).min(1),
  openDirections: z.array(z.string().min(10)).min(2).max(4),
});
type Bible = z.infer<typeof BibleSchema>;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const GENESIS_SYSTEM = `You ignite stories. A good story idea is two unrelated sparks colliding to make something new (Stephen King: "two previously unrelated ideas come together and make something new under the sun").

You are given:
- a SEED: a "what if" spark.
- a SLATE of real people who already exist in this world (persistent characters), each with a name and what they are known for.

Your only job: find the COLLISION. Pick the 1-3 people from the slate on whom this seed lands hardest — where it would make the most believable, most charged "something new" — and state the kernel.

RULES:
- Choose people whose known life makes the seed BELIEVABLE on them, not random. The best collision is one a reader would believe could really happen to THIS person.
- The kernel is 2-3 plain sentences: who is caught in this, and the fresh situation the collision creates. Do NOT resolve it. Do NOT plot beats. Just ignite.
- If the collision genuinely needs one person who is not on the slate (e.g. an antagonist, a returning relative), say so in newRoleNeeded; otherwise omit it. Prefer using slate people.
- Clinical voice. No flourish. State what is, not how it feels.

Output JSON: { kernel, coreCharacterIds (exact ids from the slate), newRoleNeeded? }.`;

const BUILD_SYSTEM = `You build the believable hidden TRUTH of a story — the reference a writers' room works from. This is NOT prose and NOT a mystery. It is what is actually true, told straight. Mystery is added later by someone else who chooses what to reveal; your job is only to make the truth BELIEVABLE.

You are given the KERNEL (the collision) and the CORE PEOPLE it caught.

HOW TO BUILD EACH PERSON — ASK "WHY?" TO BEDROCK:
- Start from a present fact about them and ask "why?" again and again until you reach something irreducible — a love, a loss, a vow, a debt, a shame. Each "why" answer is ONE history bullet, in order. (Example: "she avoids the harbour → why? a man drowned there → why was that her doing? she untied the wrong line → why does she hide it? she let them blame a boy instead.")
- SECRETS ARE NOT A FIELD. A person conceals something ONLY when a FEELING makes hiding natural: shame, fear of being labeled, guilt, fear of loss. If their history + feeling produces concealment, put it in "conceals". If not, OMIT conceals. MOST people conceal NOTHING — that is correct and believable. Do not give everyone a secret.
- Ladder DEEP only for the core people the collision turns on. People at the edges stay shallow (a single history bullet is fine).

BELIEVABILITY RUBRIC (your output must pass it):
- Causality: every present fact traces to a prior cause in history.
- Ordinary motives: people act from plain human wants, not plot necessity.
- No coincidence-stacking: the situation is reachable without "and conveniently…".
- Few secret-bearers: 1-2 people conceal anything; the rest are exactly what they seem.
- Nobody behaves stupidly just to keep the situation alive.

COMMIT TO THE TRUTH (critical):
- This bible IS the settled, complete truth. It is what really happened, fully decided. NOTHING here is an open question.
- If a thing happened — a killing, a theft, a betrayal, a disappearance — you MUST state plainly WHO did it and WHY, in the situation and the relevant person's history. Decide it now.
- BANNED in the hidden layer: "unknown", "remains hidden", "it is unclear", "someone", "a mysterious figure", "the identity of X hangs on", "the truth of Y is never revealed". Those are the PLAYER's to discover later — but you, the author, already know, so write it down.
- Mystery is manufactured downstream when quests are written from this bible. Your job is the opposite: leave no mystery in the truth itself. If you find yourself withholding a fact, stop and commit to it.

OUTPUT (clinical truth fields; only leadBlurb may carry light flavor):
- title: short, concrete, names a real thing/person/place in the story. No "The Weight of X" patterns.
- leadBlurb: 1-2 sentences the PLAYER sees on a job board before meeting anyone. It must sound like a MUNDANE CONTRACT and reveal NONE of the hidden truth. Use physical anchors (a body, an unpaid debt, a missing barge), not the cast's secret names.
- cast: each { person { name, who, history[] (the why-ladder), wants, feels, conceals? }, roleInStory }. Reuse the core people; add the coined person only if the kernel named newRoleNeeded.
- situation: 2-4 sentences — the believable present truth, told straight (this is the hidden ground truth, not the player blurb).
- tensions: who clashes with whom, over what, and the plain reason. One bullet each.
- openDirections: 2-4 loose ways this could go from here. NOT prescriptive beats — just plausible directions the story could take.

BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny. Name concrete things instead.

Output JSON only.`;

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------
function setupPool(): CharacterPool {
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  return pool;
}

function slateBlock(chars: PoolCharacter[]): string {
  return chars.map((c) => `- id="${c.id}" name="${c.name}" (${c.role}) — known for: ${c.surface} [tags: ${c.tags.join(', ')}]`).join('\n');
}

async function callJson<T>(client: OpenAI, system: string, user: string, schema: z.ZodType<T>): Promise<T> {
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 4000,
    reasoning_effort: EFFORT,
  } as never);
  const content = (res as { choices: { message: { content: string } }[] }).choices[0].message.content;
  return schema.parse(JSON.parse(content));
}

function concealsLine(c: unknown): string | null {
  if (typeof c === 'string') return c.trim() || null;
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>;
    const what = o.what ?? o.secret ?? o.it ?? o.thing;
    const why = o.why ?? o.reason ?? o.because;
    if (what && why) return `${what} — ${why}`;
    const joined = Object.values(o).filter((v) => typeof v === 'string').join(' — ');
    return joined || null;
  }
  return null;
}

function tensionLine(t: string | Record<string, unknown>): string {
  if (typeof t === 'string') return t;
  const parties = t.parties ?? t.between ?? t.who ?? t.sides;
  const over = t.over ?? t.about ?? t.reason ?? t.conflict ?? t.detail;
  if (parties && over) return `${parties} — over ${over}`;
  return Object.values(t).filter((v) => typeof v === 'string').join(' — ');
}

function render(seed: Seed, genesis: Genesis, bible: Bible): string {
  const L: string[] = [];
  L.push(`# BIBLE — "${bible.title}"`);
  L.push(`seed: [${seed.id}] ${seed.spark}`);
  L.push(`      (${seed.situation} · ${seed.emotionalCore} · ${seed.stakes})`);
  L.push(``);
  L.push(`## GENESIS (collision)`);
  L.push(genesis.kernel);
  if (genesis.newRoleNeeded) L.push(`(coined role: ${genesis.newRoleNeeded})`);
  L.push(``);
  L.push(`## LEAD BLURB (player sees this, nothing more)`);
  L.push(`"${bible.leadBlurb}"`);
  L.push(``);
  L.push(`## SITUATION (hidden truth)`);
  L.push(bible.situation);
  L.push(``);
  L.push(`## CAST`);
  for (const c of bible.cast) {
    const p = c.person;
    L.push(`### ${p.name}${c.roleInStory ? ` — ${c.roleInStory}` : ''}`);
    L.push(`who: ${p.who}`);
    L.push(`history (why-ladder):`);
    p.history.forEach((h, i) => L.push(`  ${i + 1}. ${h}`));
    L.push(`wants: ${p.wants}`);
    L.push(`feels: ${p.feels}`);
    const concealsStr = concealsLine(p.conceals);
    if (concealsStr) L.push(`conceals: ${concealsStr}`);
    L.push(``);
  }
  L.push(`## TENSIONS`);
  bible.tensions.forEach((t) => L.push(`- ${tensionLine(t as string | Record<string, unknown>)}`));
  L.push(``);
  L.push(`## OPEN DIRECTIONS`);
  bible.openDirections.forEach((d) => L.push(`- ${d}`));
  return L.join('\n');
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });

  const seedArg = process.argv[2];
  const anchorIdx = process.argv.indexOf('--anchor');
  const anchorId = anchorIdx >= 0 ? process.argv[anchorIdx + 1] : undefined;
  const seed = seedArg && !seedArg.startsWith('--') ? (seedById(seedArg) ?? pickSeed()) : pickSeed();

  const pool = setupPool();
  const slate = pool.all().filter((c) => c.role !== 'landmark');

  // STEP A — GENESIS
  const genesisUser = [
    `SEED: ${seed.spark}`,
    anchorId ? `REQUIRED: the collision must include character id="${anchorId}".` : ``,
    ``,
    `SLATE (people who exist in this world):`,
    slateBlock(slate),
    ``,
    `Find the collision. Output JSON only.`,
  ].filter(Boolean).join('\n');
  const genesis = await callJson(client, GENESIS_SYSTEM, genesisUser, GenesisSchema);

  const coreChars = genesis.coreCharacterIds.map((id) => pool.get(id)).filter(Boolean) as PoolCharacter[];

  // STEP B+C — WHY-LADDER + ASSEMBLE
  const buildUser = [
    `KERNEL (the collision to make believable):`, genesis.kernel,
    genesis.newRoleNeeded ? `\nThe kernel needs a coined person for this role: ${genesis.newRoleNeeded}` : ``,
    ``,
    `CORE PEOPLE (build their believable history by why-laddering):`,
    coreChars.map((c) => `- name="${c.name}" — known for: ${c.surface} [tags: ${c.tags.join(', ')}]`).join('\n'),
    ``,
    `Build the believable hidden truth. Output JSON only.`,
  ].filter(Boolean).join('\n');
  const bible = await callJson(client, BUILD_SYSTEM, buildUser, BibleSchema);

  const text = render(seed, genesis, bible);
  console.log(text);
  const out = `/tmp/airaider-storygen-${seed.id}.md`;
  writeFileSync(out, text);
  writeFileSync(`/tmp/airaider-storygen-${seed.id}.json`, JSON.stringify({ seed, genesis, bible }, null, 2));
  console.log(`\n---\nsaved: ${out}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
