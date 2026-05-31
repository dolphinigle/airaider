// Model benchmark for chain-bible generation.
//
// Generates the SAME 2 chain bibles across N candidate models, then has
// gpt-5 (the strong judge) score each bible 0-10 on 6 criteria.
//
// User asked: "benchmark and put in issue ... there are other options
// like gpt 4.1 right? do test which ones are ok / work well for quest
// chains."
//
// Usage:
//   cd engine/server
//   npx tsx src/modelBenchmark.ts <label>

import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { z } from 'zod';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) {
  console.error('Need OPENAI_API_KEY');
  process.exit(1);
}

const label = process.argv[2] ?? 'bench1';
const outDir = resolve('/home/irvan/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/experiments');
mkdirSync(outDir, { recursive: true });

// ---------- pricing table (per 1M tokens) ----------
const PRICES: Record<string, { in: number; out: number; cached: number }> = {
  'gpt-5':         { in: 1.25, out: 10.00, cached: 0.125 },
  'gpt-5-mini':    { in: 0.25, out: 2.00,  cached: 0.025 },
  'gpt-5-nano':    { in: 0.05, out: 0.40,  cached: 0.005 },
  'gpt-4.1':       { in: 2.00, out: 8.00,  cached: 0.50 },
  'gpt-4.1-mini':  { in: 0.40, out: 1.60,  cached: 0.10 },
  'gpt-4.1-nano':  { in: 0.10, out: 0.40,  cached: 0.025 },
  'gpt-4o':        { in: 5.00, out: 20.00, cached: 2.50 },
  'gpt-4o-mini':   { in: 0.60, out: 2.40,  cached: 0.30 },
};

function costUsd(model: string, promptTok: number, cachedTok: number, completionTok: number): number {
  const p = PRICES[model];
  if (!p) return -1;
  const uncachedPrompt = promptTok - cachedTok;
  return (uncachedPrompt * p.in + cachedTok * p.cached + completionTok * p.out) / 1_000_000;
}

// ---------- compact pool (same per chain spec, for fair comparison) ----------
const POOL = `
FORT ROSTER (cached prefix):
- char_marek "Marek Voss" (mercenary, sergeant, mire-born, veteran). Surface: greying sergeant late forties, walks with an old hip stiffness. Want: keep company alive through one more winter. Need: stop measuring his worth by who he failed to bring home. Ghost: commanded the rear-guard at the Coldfen rout; brought back seven of forty. Lie: a captain who survives his men deserves what he gets. Secret: he keeps a list of the thirty-three names folded inside his coat.
- char_roselle "Roselle Vance" (mercenary, lettered, light-footed, haunted). Surface: thin woman thirties, ink-stained fingers, hood up indoors. Want: remain unrecognised. Need: accept her past is not an accusation. Ghost: fled the abbey at Penholt the night the abbot was hanged. Lie: if she stays still someone will come for her. Secret: enamelled icon + folded page from the abbot's last letter.
- char_tibalt "Tibalt Renn" (mercenary, young, eager, crossbow). Surface: wiry youth twenty-two, polishes his crossbow during conversations. Want: be taken seriously by Marek. Need: stop measuring himself against his brother. Ghost: older brother took the merc contract that should have been his and never came back. Lie: surviving is a debt to be paid in service. Secret: unsent letters in his jacket.

REGION NPC SAMPLE for this chain:
- char_iselle "Iselle Brun" (npc, smuggler). Wants Greyford to remain a quiet transfer point. Ghost: family ruined when a former protector turned crown witness. Lie: trust is just a slow form of betrayal. Secret: false freight-license sewn into a barge's keelboard.
- char_drust "Drust Halren" (captive). Held three weeks in Mireford dungeon. Wants passage out of the region. Ghost: his crew was caught because someone else's witness used his name. Lie: he can outlast any patience by trading scraps. Secret: a sewn list of barge contacts in his belt lining.
- char_halvern "Halvern Coate" (npc, magistrate). Wants Mireford's salt stores secured before winter. Ghost: lost his predecessor to a corruption inquiry. Lie: a quiet bargain costs less than a public scandal. Secret: a salt-invoice with a Tevin watermark in his drawer.
- char_steward_brann "Brann Olwyn" (npc, steward of Vael's End). Wants to protect Lady Cessa's last weeks. Ghost: signed off on a contract he later wished he hadn't. Lie: honour can be kept in private. Secret: a private household ledger hidden in a binding.
- char_holm "Captain Mar Holm" (npc, crown adjutant). Returning to Vael's End within the month. Wants a clean inventory of the keep. Ghost: was passed over for a posting because of someone he covered for. Lie: paperwork resolves what swords cannot. Secret: a sealed writ authorising temporary seizure on ambiguous grounds.
`.trim();

// ---------- bible schema (matches poolPromptTest) ----------
const CastExisting = z.object({
  kind: z.literal('existing'),
  characterId: z.string().min(4),
  roleInChain: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  arcStateAfterChain: z.string().min(8).max(220),
});
const CastNew = z.object({
  kind: z.literal('new'),
  character: z.object({
    name: z.string(),
    tags: z.array(z.string()),
    surface: z.string(),
    want: z.string(),
    need: z.string(),
    ghost: z.string(),
    lie: z.string(),
    secret: z.string(),
  }),
  roleInChain: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  arcStateAfterChain: z.string().min(8).max(220),
});
const CastEntry = z.discriminatedUnion('kind', [CastExisting, CastNew]);

const Bible = z.object({
  title: z.string().min(2).max(80),
  shape: z.enum(['tight', 'classic', 'ensemble', 'twist-heavy']),
  controllingIdea: z.string().min(10).max(220),
  cast: z.array(CastEntry).min(2).max(6),
  surfaceSituation: z.string().min(20),
  hiddenSituation: z.string().min(20),
  trajectory: z.string().min(20),
  setupPayoffs: z.array(z.object({ plant: z.string(), payoff: z.string() })).min(1).max(6),
  dramaticIrony: z.string().optional(),
});

const SYSTEM = `You author chain bibles for a grimdark mercenary-fort game. A bible is a compact reference doc (NOT prose) describing the cast, the situation, and the trajectory of a multi-quest chain.

CRAFT REQUIREMENTS:
- title: 2-8 words, concrete proper noun. No "Weight of X" / "Shadow of Y" patterns.
- shape: tight | classic | ensemble | twist-heavy (match cast size to shape)
- controllingIdea: one sentence stating what the chain ARGUES (a moral claim)
- cast: 2-6 with roleInChain (protagonist/antagonist/complication/ally). For each entry use:
    { "kind": "existing", "characterId": "<exact id from POOL>", "roleInChain": "...", "arcStateAfterChain": "..." }
    OR
    { "kind": "new", "character": { name, tags, surface, want, need, ghost, lie, secret }, "roleInChain": "...", "arcStateAfterChain": "..." }
- surfaceSituation: 2-3 sentences (what strangers are told)
- hiddenSituation: 3-5 sentences (what's really going on)
- trajectory: 3-5 sentences ending in how climax delivers the reward
- setupPayoffs: 1-6 plant/payoff pairs (specific named objects)
- dramaticIrony: optional, 1-2 sentences

REUSE: prefer characters from the POOL whose existing want/need/ghost/lie already fits the role. Coin new only when needed.

BANNED TOKENS (any inflection): weight, weighed, shadow, burden, ghosts, fate, destined, destiny, ancient evil, darkness descends, grip tightens, stranglehold.

OUTPUT: JSON only. surface/hidden/trajectory/dramaticIrony are STRINGS, not arrays.`;

const USER_CHAIN_A = `${POOL}

CHAIN SPEC
Region: Mireford
Rarity: rare
Engine-declared reward (climax must deliver this naturally): captive — an antagonist NPC ends the chain in the fort dungeon, available for ransom/recruit later
Theme keywords: marsh-rite, old-faith, silence
Inciting hint: Three village children have gone missing from the marsh hamlet of Slowwater in successive new moons. The hamlet refuses outside help and has closed its causeway with felled birch.

Author the bible now. Output JSON only.`;

const USER_CHAIN_B = `${POOL}

CHAIN SPEC
Region: Mireford
Rarity: legendary
Engine-declared reward (climax must deliver this naturally): rare item — a named artifact tied to one of the involved factions, +1 prestige in Mireford while owned
Theme keywords: relic, crown, reckoning
Inciting hint: A crown adjutant arrives unannounced at Mireford gate carrying a sealed writ; he refuses to name his business until Marek meets him in private.

Author the bible now. Output JSON only.`;

interface GenResult {
  model: string;
  chain: 'A' | 'B';
  ok: boolean;
  bible?: z.infer<typeof Bible>;
  rawContent: string;
  promptTok: number;
  cachedTok: number;
  completionTok: number;
  costUsd: number;
  errorMsg?: string;
}

async function generate(client: OpenAI, model: string, chain: 'A' | 'B'): Promise<GenResult> {
  const user = chain === 'A' ? USER_CHAIN_A : USER_CHAIN_B;
  let resp;
  try {
    resp = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 14000,
      stream: false,
    });
  } catch (e) {
    return {
      model, chain, ok: false, rawContent: '',
      promptTok: 0, cachedTok: 0, completionTok: 0, costUsd: 0,
      errorMsg: `api error: ${(e as Error).message}`,
    };
  }
  const content = resp.choices[0]?.message?.content ?? '{}';
  const promptTok = resp.usage?.prompt_tokens ?? 0;
  const completionTok = resp.usage?.completion_tokens ?? 0;
  const cachedTok = (resp.usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })
    ?.prompt_tokens_details?.cached_tokens ?? 0;
  const cost = costUsd(model, promptTok, cachedTok, completionTok);
  let raw: unknown;
  try { raw = JSON.parse(content); }
  catch (e) {
    return {
      model, chain, ok: false, rawContent: content,
      promptTok, cachedTok, completionTok, costUsd: cost,
      errorMsg: `json parse: ${(e as Error).message}`,
    };
  }
  const parsed = Bible.safeParse(raw);
  if (!parsed.success) {
    return {
      model, chain, ok: false, rawContent: content,
      promptTok, cachedTok, completionTok, costUsd: cost,
      errorMsg: `schema: ${JSON.stringify(parsed.error.errors.slice(0, 3))}`,
    };
  }
  return {
    model, chain, ok: true, bible: parsed.data, rawContent: content,
    promptTok, cachedTok, completionTok, costUsd: cost,
  };
}

// ---------- judge ----------
const JUDGE_MODEL = 'gpt-5';
const JUDGE_SYSTEM = `You are a story-craft judge scoring chain bibles for a grimdark mercenary-fort game. Score the bible on 6 criteria, each 0-10 (decimals OK). Be tough — 7 is good, 8 is rare, 9+ is exceptional.

CRITERIA:
- specificity: are details concrete and named (a barber's notch on a bolt, the Ardren cipher) vs generic ("ancient evil")? 0=all generic, 10=every plant has a specific physical object.
- castFit: do the chosen cast members' existing wants/needs/ghosts/lies fit the roles they're playing? Reused chars with naturally-aligning ghosts score higher than coined strangers, and re-used chars in roles that contradict their established arc score LOWER.
- controllingIdea: does the controllingIdea actually argue a moral claim (not just describe a plot), and does the trajectory's climax pay off that claim?
- climaxLanding: does the climax deliver the engine-declared reward in a way that grows out of the chain's events naturally, not as a tacked-on gift?
- plantPayoff: are the plants and payoffs SPECIFIC, named, and pay off in the climax (or close to it)?
- prosecraft: voice, freshness, absence of fantasy clichés (weight/shadow/burden/grip/etc), variety of sentence rhythm in the prose fields. 10 = zero clichés, fresh imagery.

Output JSON: { specificity: number, castFit: number, controllingIdea: number, climaxLanding: number, plantPayoff: number, prosecraft: number, summary: string }
summary: one sentence naming the single biggest strength and the single biggest weakness.`;

const JudgeOut = z.object({
  specificity: z.number(),
  castFit: z.number(),
  controllingIdea: z.number(),
  climaxLanding: z.number(),
  plantPayoff: z.number(),
  prosecraft: z.number(),
  summary: z.string(),
});

interface JudgeResult {
  scores: z.infer<typeof JudgeOut>;
  overall: number;
  costUsd: number;
}

async function judge(client: OpenAI, gen: GenResult): Promise<JudgeResult | null> {
  if (!gen.ok || !gen.bible) return null;
  const reward = gen.chain === 'A'
    ? 'captive (antagonist NPC ends in fort dungeon)'
    : 'rare item (named artifact, +1 prestige in Mireford while owned)';
  const userMsg = `Reward for this chain: ${reward}

BIBLE:
${JSON.stringify(gen.bible, null, 2)}

Score now. Output JSON only.`;
  const resp = await client.chat.completions.create({
    model: JUDGE_MODEL,
    messages: [
      { role: 'system', content: JUDGE_SYSTEM },
      { role: 'user', content: userMsg },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 3000,
    stream: false,
  });
  const content = resp.choices[0]?.message?.content ?? '{}';
  const raw = JSON.parse(content);
  const parsed = JudgeOut.safeParse(raw);
  if (!parsed.success) {
    console.error(`  judge failed schema: ${JSON.stringify(parsed.error.errors.slice(0, 2))}`);
    return null;
  }
  const promptTok = resp.usage?.prompt_tokens ?? 0;
  const completionTok = resp.usage?.completion_tokens ?? 0;
  const cost = costUsd(JUDGE_MODEL, promptTok, 0, completionTok);
  const overall = (parsed.data.specificity + parsed.data.castFit + parsed.data.controllingIdea
    + parsed.data.climaxLanding + parsed.data.plantPayoff + parsed.data.prosecraft) / 6;
  return { scores: parsed.data, overall, costUsd: cost };
}

// ---------- main ----------
const MODELS = ['gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o-mini'];
const CHAINS: Array<'A' | 'B'> = ['A', 'B'];

interface Row {
  model: string;
  chain: 'A' | 'B';
  gen: GenResult;
  judge?: JudgeResult;
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const client = new OpenAI({ apiKey });
  console.log(`==== modelBenchmark ${label} ====`);
  const rows: Row[] = [];
  for (const model of MODELS) {
    for (const chain of CHAINS) {
      console.log(`\n--- ${model} / chain ${chain} ---`);
      const gen = await generate(client, model, chain);
      if (gen.ok) {
        console.log(`  ok title="${gen.bible!.title}" shape=${gen.bible!.shape}  tokens in=${gen.promptTok}(cached=${gen.cachedTok}) out=${gen.completionTok}  cost=$${gen.costUsd.toFixed(4)}`);
        const jr = await judge(client, gen);
        if (jr) {
          console.log(`  scored overall=${jr.overall.toFixed(2)}  (spec=${jr.scores.specificity} cast=${jr.scores.castFit} ci=${jr.scores.controllingIdea} climax=${jr.scores.climaxLanding} p/p=${jr.scores.plantPayoff} prose=${jr.scores.prosecraft})`);
          console.log(`  summary: ${jr.scores.summary}`);
          rows.push({ model, chain, gen, judge: jr });
        } else {
          rows.push({ model, chain, gen });
        }
      } else {
        console.log(`  FAILED: ${gen.errorMsg}  cost=$${gen.costUsd.toFixed(4)}`);
        rows.push({ model, chain, gen });
      }
    }
  }

  // Summary table
  console.log('\n\n==== SUMMARY ====');
  console.log('model'.padEnd(15) + 'chain  overall  spec  cast  ci    climax p/p   prose  cost     status');
  for (const r of rows) {
    const status = r.gen.ok ? 'ok' : `FAIL(${r.gen.errorMsg?.slice(0, 30)})`;
    const s = r.judge?.scores;
    const row =
      r.model.padEnd(15) +
      r.chain + '      ' +
      (r.judge?.overall.toFixed(2) ?? '----').padEnd(7) +
      (s?.specificity.toFixed(1) ?? '--').padEnd(6) +
      (s?.castFit.toFixed(1) ?? '--').padEnd(6) +
      (s?.controllingIdea.toFixed(1) ?? '--').padEnd(6) +
      (s?.climaxLanding.toFixed(1) ?? '--').padEnd(7) +
      (s?.plantPayoff.toFixed(1) ?? '--').padEnd(6) +
      (s?.prosecraft.toFixed(1) ?? '--').padEnd(7) +
      ('$' + r.gen.costUsd.toFixed(4)).padEnd(9) +
      status;
    console.log(row);
  }
  // Per-model averages
  console.log('\n==== PER-MODEL AVERAGE ====');
  for (const m of MODELS) {
    const mRows = rows.filter(r => r.model === m && r.judge);
    if (mRows.length === 0) {
      console.log(`${m.padEnd(15)} -- (all failed or no judge)`);
      continue;
    }
    const avg = mRows.reduce((s, r) => s + (r.judge?.overall ?? 0), 0) / mRows.length;
    const totalCost = rows.filter(r => r.model === m).reduce((s, r) => s + r.gen.costUsd, 0);
    console.log(`${m.padEnd(15)} avg=${avg.toFixed(2)}  totalGenCost=$${totalCost.toFixed(4)}`);
  }

  // Dump full output
  const outPath = `${outDir}/model-benchmark-${label}.txt`;
  const lines: string[] = [`==== modelBenchmark ${label} ====`, ''];
  for (const r of rows) {
    lines.push('==========================================================');
    lines.push(`# ${r.model} / chain ${r.chain}`);
    lines.push(`  status: ${r.gen.ok ? 'ok' : 'FAIL'}`);
    if (r.gen.errorMsg) lines.push(`  error: ${r.gen.errorMsg}`);
    lines.push(`  tokens: in=${r.gen.promptTok} cached=${r.gen.cachedTok} out=${r.gen.completionTok}  cost=$${r.gen.costUsd.toFixed(4)}`);
    if (r.judge) {
      lines.push(`  judge overall=${r.judge.overall.toFixed(2)}`);
      lines.push(`    specificity=${r.judge.scores.specificity}  castFit=${r.judge.scores.castFit}  controllingIdea=${r.judge.scores.controllingIdea}`);
      lines.push(`    climaxLanding=${r.judge.scores.climaxLanding}  plantPayoff=${r.judge.scores.plantPayoff}  prosecraft=${r.judge.scores.prosecraft}`);
      lines.push(`    summary: ${r.judge.scores.summary}`);
    }
    if (r.gen.bible) {
      lines.push(`  title: ${r.gen.bible.title}`);
      lines.push(`  shape: ${r.gen.bible.shape}`);
      lines.push(`  controllingIdea: ${r.gen.bible.controllingIdea}`);
      lines.push(`  cast (${r.gen.bible.cast.length}):`);
      for (const c of r.gen.bible.cast) {
        if (c.kind === 'existing') lines.push(`    [REUSE] ${c.characterId} as ${c.roleInChain} → ${c.arcStateAfterChain}`);
        else lines.push(`    [NEW] ${c.character.name} as ${c.roleInChain} → ${c.arcStateAfterChain}`);
      }
      lines.push(`  surface: ${r.gen.bible.surfaceSituation}`);
      lines.push(`  hidden:  ${r.gen.bible.hiddenSituation}`);
      lines.push(`  traj:    ${r.gen.bible.trajectory}`);
      if (r.gen.bible.dramaticIrony) lines.push(`  irony:   ${r.gen.bible.dramaticIrony}`);
      lines.push(`  plants:`);
      for (const p of r.gen.bible.setupPayoffs) lines.push(`    PLANT  ${p.plant}\n    PAYOFF ${p.payoff}`);
    } else if (r.gen.rawContent) {
      lines.push(`  raw (first 500): ${r.gen.rawContent.slice(0, 500)}`);
    }
    lines.push('');
  }
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nwrote: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
