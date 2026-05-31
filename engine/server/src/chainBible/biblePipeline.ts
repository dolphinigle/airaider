// Bible pipeline: pool → bible → beats → epilogue → pool updates.
//
// Models locked per issue #6:
//   bible    → gpt-5-mini  (~$0.008)
//   beat     → gpt-5-nano   (~$0.001 each)
//   epilogue → gpt-5-mini   (~$0.003)

import OpenAI from 'openai';
import { z } from 'zod';
import type { CharacterPool, PoolCharacter } from './characterPool.js';

const BIBLE_MODEL = process.env.AIRAIDER_BIBLE_MODEL ?? 'gpt-5-mini';
const BIBLE_EFFORT = (process.env.AIRAIDER_BIBLE_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';
const BEAT_MODEL = process.env.AIRAIDER_BEAT_MODEL ?? 'gpt-5-nano';
const BEAT_EFFORT = (process.env.AIRAIDER_BEAT_EFFORT ?? 'minimal') as 'minimal' | 'low' | 'medium' | 'high';
const EPILOGUE_MODEL = process.env.AIRAIDER_EPILOGUE_MODEL ?? 'gpt-5-mini';
const EPILOGUE_EFFORT = (process.env.AIRAIDER_EPILOGUE_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';

// ---------------- schemas ----------------

const CastExisting = z.object({
  kind: z.literal('existing'),
  characterId: z.string().min(4),
  roleInChain: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  arcStateAfterChain: z.string().min(8),
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
  arcStateAfterChain: z.string().min(8),
});
const CastEntry = z.discriminatedUnion('kind', [CastExisting, CastNew]);

export const BibleSchema = z.object({
  title: z.string().min(2).max(80),
  shape: z.enum(['tight', 'classic', 'ensemble', 'twist-heavy']),
  leadBoardBlurb: z.string().min(20),
  firstBeatOnramp: z.string().min(20),
  cast: z.array(CastEntry).min(2).max(10),
  surfaceSituation: z.string().min(20),
  hiddenSituation: z.string().min(20),
  // Fictional-truth tier — the bible is WHY the situation exists, not WHAT the player does.
  // Quest mechanics (player decisions, merc observations) emerge later when a separate AI
  // writes the next quest GIVEN the bible + prior-quest summaries.
  backstoryThreads: z.array(z.string().min(20)).min(3).max(7),  // PICK ONE central WHY and go deep — answer the why-chain for the central situation/character (e.g., "why is the smuggler dead → he deserted Tevin → because his unit was ordered to kill the village he grew up in → he ran with the only thing he could trade, the chit"). Each bullet is ONE link in the chain.
  conflictingInterests: z.array(z.string().min(20)).min(2).max(5), // who wants what from whom, why they clash. (e.g., "Jorun wants the chit destroyed to bury his daughter's passage debt; the Tevin paymaster wants the chit back as leverage; Drust wants Jorun gone so the ring promotes him."). Each bullet names the two parties + the object/stake of contention.
  looseThreads: z.array(z.string().min(15)).min(1).max(4),    // open hooks that future chains/quests can pull on — things the bible plants but doesn't resolve. (e.g., "the daughter still doesn't know what her father paid for her passage", "the Tevin paymaster has not yet learned the courier is dead").
  trajectory: z.string().min(20),                             // SCAFFOLD — 3-5 sentences sketching how the chain's beats might unfold given fictional truth, ENDS with how the climax delivers the engine reward. NOT prescriptive about player decisions — the quest-writer will choose.
  setupPayoffs: z.array(z.object({ plant: z.string(), payoff: z.string() })).min(1).max(10),
  vignettes: z.array(z.string()).min(1).max(6),
  texture: z.array(z.string()).min(2).max(8),
  antagonistHumanity: z.string().min(15),
  dramaticIrony: z.string().optional(),
});
export type Bible = z.infer<typeof BibleSchema>;

export const BeatSchema = z.object({
  hook: z.string().min(20),
  body: z.string().min(60),
  isClimax: z.boolean(),
});
export type Beat = z.infer<typeof BeatSchema>;

export const EpilogueSchema = z.object({
  title: z.string().min(2).max(80),
  prose: z.string().min(100),
});
export type Epilogue = z.infer<typeof EpilogueSchema>;

// ---------------- reward spec ----------------

export type RewardSpec =
  | { kind: 'promote_to_merc' }
  | { kind: 'unique_trait_on_anchor'; anchorId: string; traitName: string }
  | { kind: 'captive_to_dungeon' }
  | { kind: 'regional_prestige'; amount: number }
  | { kind: 'gold'; amount: number };

export function describeReward(r: RewardSpec): string {
  switch (r.kind) {
    case 'promote_to_merc': return 'rare recruit — one NPC from the cast joins the fort as a mercenary';
    case 'unique_trait_on_anchor': return `unique trait on ${r.anchorId}: "${r.traitName}" — name a concrete narrative thing the climax earns`;
    case 'captive_to_dungeon': return 'captive — an antagonist NPC ends the chain in the fort dungeon';
    case 'regional_prestige': return `regional prestige: +${r.amount} in the chain's region (engine number; climax narrates the civic win)`;
    case 'gold': return `gold: ${r.amount}g (engine number; climax narrates the haul)`;
  }
}

// ---------------- prompt building ----------------

function poolBlock(chars: PoolCharacter[], label: string): string {
  if (chars.length === 0) return `${label}: (none)`;
  const lines = [`${label} (${chars.length}):`];
  for (const c of chars) {
    lines.push(`  - id="${c.id}" name="${c.name}" role=${c.role} tags=[${c.tags.join(',')}]`);
    lines.push(`    surface: ${c.surface}`);
    lines.push(`    want: ${c.want}`);
    lines.push(`    need: ${c.need}`);
    lines.push(`    ghost: ${c.ghost}`);
    lines.push(`    lie: ${c.lie}`);
    lines.push(`    secret: ${c.secret}`);
    lines.push(`    arcState: ${c.arcState}`);
  }
  return lines.join('\n');
}

const BIBLE_SYSTEM = `You are the showrunner of a grimdark mercenary-fort game. You author chain bibles — compact reference documents a writers' room works from. A bible is NOT prose; it is the underlying CHARACTERS + SITUATION + TRAJECTORY a downstream writer will turn into quests one at a time.

This world keeps a CHARACTER POOL. Characters persist across chains: their want/need/ghost/lie/secret stay the same, their arcState updates with what happens. Your job is to BUILD A CAST primarily by reusing pool characters whose existing wounds and lies fit the role you need them to play. Coin a new character ONLY when no pool character can plausibly fill a role.

CRAFT REQUIREMENTS (compact, in JSON):
- title: a short evocative chain title (2-8 words). No "The Weight of X" / "The Shadow of Y" patterns. Name a specific concrete thing/person/place from the chain.
- shape: PICK ONE based on what the situation needs:
    "tight"        — 2-3 cast, 1-3 plants, 1-3 vignettes, may omit dramaticIrony. Personal feuds, ambushes.
    "classic"      — 4-6 cast, 3-6 plants, 3-5 vignettes, has dramaticIrony. Balanced quest.
    "ensemble"     — 7-10 cast, 6-10 plants, 4-6 vignettes, has dramaticIrony, fuller hiddenSituation. Political/multi-faction, ALIVE WORLD.
    "twist-heavy"  — 3-5 cast, 6-10 plants, 2-4 vignettes, dramaticIrony is centerpiece (2-3 sentences naming when each side learns).
  Engine guidance: common tends tight, rare tends classic, legendary tends ensemble/twist. Situation overrides rarity.
  CAST DENSITY IS PLAYER ENGAGEMENT. Cinderella as a chain bible would be ENSEMBLE (Cinderella, stepmother, Anastasia, Drizella, fairy godmother, prince, king, Jaq, Gus, Lucifer = 10). Not 4 because "it's the simplest story possible". A world with only 4 characters feels empty. Bias UP, not down.
- controllingIdea: DELETED FIELD. Do NOT output this. The bible focuses on characters + situation + trajectory; do not write a moralizing thesis statement.
- leadBoardBlurb: 1-2 sentences shown to the player on the LEAD BOARD when this chain first appears, BEFORE they have ever met the cast. CRITICAL: the player at this point is sitting in their fort and knows NOTHING about the situation. Do NOT use cast member proper nouns the player has not encountered. Use concrete physical anchors: a body, a sealed letter, a runaway, a missing barge, a payment overdue, a banner outside the gate. Also CRITICAL: the blurb sounds like a NORMAL CONTRACT — do NOT spoil the deeper story. The hook should look mundane ("vanquish a bandit camp threatening the road"); the deeper truth (bandit leader is Marek's brother, deserted Tevin years ago and built the camp on stolen coin) is in backstoryThreads, NOT in the blurb.
- firstBeatOnramp: 1-2 sentences of stage-direction for the writer of beat 1 — "this is how the party arrives at the situation from cold". Anchors the first beat in the leadBoardBlurb (don't drop the player mid-scene with named characters they've never met). Example: "the party rides out to the bandit camp described in the contract; they don't yet know the leader is anyone they recognize."

- backstoryThreads: 3-7 TERSE bullets. THIS IS THE HEART OF THE BIBLE. Pick the ONE central WHY of this chain's situation/character and go DEEP — answer the why-chain ONE LINK AT A TIME until you reach something irreducible (a vow, a love, a loss, a debt). Each bullet is ONE link. Breadth-first ("everyone has a secret") is BAD; depth-first ("here is exactly why THIS situation exists") is GOOD. The bible exists so no asspulling happens — if a later quest reveals X about a character, X must already be in backstoryThreads or be a natural consequence of it.

  EXAMPLE (drowned smuggler — go DEEP on the smuggler's WHY):
    - "the drowned man, Veck Tarrin, was a Tevin deserter — he ran from his unit six years ago"
    - "his unit had been ordered to burn the village of Pellgrove (his birthplace); he refused, killed his lieutenant, and fled with the company paymaster's signet chit"
    - "Tevin never officially admitted Pellgrove happened; the chit is one of three documents that could prove the order existed"
    - "Veck used the chit to buy passage and falsified papers; for years he ran small smuggling jobs for Iselle's Greyford ring to stay below visibility"
    - "two months ago a Tevin officer recognized him at a Greyford dock and bought information from a dockhand named Pell"
    - "the night he died, Veck was meeting a contact named 'Halmar' — actually the Tevin officer — under the pretext of selling the chit back"
    - "Veck went to that meeting because his sister, who he hadn't seen since Pellgrove, had sent word she was alive and wanted the chit destroyed to bury the past"

  NOTICE: each bullet is ONE link in the why-chain. By the end, the reader knows WHY the body is at Greyford, WHY the chit matters, WHY Veck went to a meeting he should have known was a trap. NO breadth ("the harbour-master is corrupt" — that's a separate thread; put it in conflictingInterests). NO mood-painting.

- conflictingInterests: 2-5 TERSE bullets. Each bullet names TWO PARTIES + the OBJECT/STAKE they clash over + WHY. This is the conflict-engine of the chain — pre-loaded fuel for whoever writes the next quest. Format: "<party A> wants <stake>, <party B> wants <stake>, because <why>".

  EXAMPLE (drowned smuggler):
    - "Tevin officer 'Halmar' wants the chit destroyed quietly to bury Pellgrove; Iselle's ring wants it kept to threaten Tevin if Tevin ever pressures the Greyford route"
    - "Veck's sister Mirel wants the chit destroyed (she's built a quiet life under a new name in Vael's End and Pellgrove's surfacing would expose her); Iselle wants Mirel found so Mirel can be turned into another asset"
    - "harbour-master Jorun wants Veck's body and effects quietly dumped (his name is in Veck's smuggling ledger); Drust wants the body examined publicly (he hated Veck and wants Iselle to demote him into Veck's vacated route)"

- looseThreads: 1-4 TERSE bullets. Open hooks the bible plants but does NOT resolve this chain — material future chains/quests can pull on. Format: "<unresolved thing> — <why it matters later>".

  EXAMPLE (drowned smuggler):
    - "Mirel in Vael's End — alive, hidden, doesn't yet know her brother is dead"
    - "the other two Pellgrove documents — held by a Tevin colonel who would also like them destroyed"
    - "dockhand Pell who sold Veck out — paid 12 silver and a Tevin promise of pardon for his own desertion, which the officer has no intention of honouring"

- cast: 2-10 with roleInChain (protagonist | antagonist | complication | ally). Cast SIZE matches shape. For each, EITHER:
    { "kind": "existing", "characterId": "<exact id from pool>", "roleInChain": "...", "arcStateAfterChain": "<one-line update>" }
    OR
    { "kind": "new", "character": { "name", "tags", "surface", "want", "need", "ghost", "lie", "secret" }, "roleInChain": "...", "arcStateAfterChain": "..." }
- surfaceSituation: STRING. 2-3 sentences. What strangers in the world are told (this is broader than the leadBoardBlurb — it's regional gossip, not the player's narrow lead).
- hiddenSituation: STRING. 3-5 sentences. The compressed summary of the truth — distillate of backstoryThreads + conflictingInterests, so a quest-writer can grok the situation without re-reading every thread. WRITERS'-ROOM ONLY: do NOT reveal in beat 1.
- trajectory: STRING. 3-5 sentences. SCAFFOLD only — a rough sketch of how the chain MIGHT unfold given the fictional truth, ending with how the engine reward fires. NOT prescriptive — the quest-writer will choose the actual beats given the bible + prior-quest summaries. DO NOT prescribe player decisions or merc observations here — those emerge in the quest layer.

  EXAMPLE TRAJECTORY (drowned smuggler):
    "Investigation surfaces Veck's deserter past and the chit's significance. Halmar's pursuit and Iselle's counter-pressure both bear on the fort. Climax delivers captive_to_dungeon when whichever of Halmar or Jorun the fort exposes is brought back alive; the chit either burns or surfaces depending on the path."
- setupPayoffs: 1-10 plant/payoff pairs (specific named objects/habits/places). Count matches shape.
- vignettes: 1-6 TERSE bullets describing small character/world moments that DO NOT advance plot — they BUILD WORLD. Examples from Cinderella: "mice tailor a dress at night; Jaq sews crooked but earnest", "Lucifer stalks Gus across the kitchen", "King throws a tantrum about wanting grandchildren", "stepsisters squabble over what dress to wear, knocking down a vase". The downstream beat-writer can insert any vignette anywhere to texture a beat — they don't have to use them, but having them makes the world ALIVE. Each bullet ~5-15 words. NOT prose.
- texture: 2-8 TERSE bullets naming specific physical objects/places/sensory anchors in this chain's world. Examples from Cinderella: "pumpkin in the kitchen garden", "midnight bell of the palace tower", "torn pink dress with mother's ribbon", "glass slipper", "royal invitation parchment with the king's seal". Each bullet ~3-10 words. These ground the beat-writer's imagery.
- antagonistHumanity: ONE TERSE sentence on what makes the chain's antagonist a PERSON, not a plot device. Mechanism, not adjective stacking. Cinderella stepmother: "Envious of Cinderella's late mother's grace and class — masks her own poverty-anxiety by performing propriety". Distinct from cast charmHook (which any character has); this one specifically humanizes the antagonist.
- dramaticIrony: STRING (optional). 1-2 sentences naming what player knows / characters don't, when each side learns. OMIT for tight shape with no real irony.

REUSE DISCIPLINE (READ TWICE):
- Pool characters are shown with full story. Read them. A character whose existing lie already mirrors the bible's needed antagonist role is a much richer choice than coining a stranger.
- For each role, ask first: does any pool character fit naturally? If yes, use them.
- If you reuse, the arcStateAfterChain MUST reflect how THIS chain changes them (or doesn't — a chain can leave them entrenched in their lie, which is fine, just say so).
- If you coin new, the new character's want/need/ghost/lie/secret must be as specific as the pool ones.
- Anchor / required characters MUST appear in the cast.

NAMING (when coining new):
- Do NOT use a first name or last name that overlaps with any pool character.
- Period-appropriate Germanic/Celtic/Slavic names.

ARCSTATE DISCIPLINE:
- arcStateAfterChain is one line, max ~150 chars. Be specific: "ousted from Vael's End, now drifting in Greyford with a Mareth seal he never returned" is good. "Lives on, changed" is bad.

BANNED TOKENS (any inflection): weight, weighed, weighing, weighs, shadow, shadows, burden, burdened, ghosts, fate, destined, destiny, glorious, ancient evil, darkness descends, grip tightens, tightens its grip, stranglehold. When you want to convey heaviness, name a specific physical thing.

ANTI-FIXATION: if the engine lists "recently-used motifs/devices" (ledgers, sealed cloaks, hidden lists, smuggling, etc.), DO NOT make those the chain's central device. Pick a different concrete object/situation. Recurring locations are fine; recurring central devices are not.

VOICE — TWO TIERS, DON'T MIX THEM:

The bible has TWO kinds of fields:

  PLAYER-FACING (allow narrative voice):
    - leadBoardBlurb — the player reads this verbatim on the lead board.
    - title — appears in UI.

  WRITERS'-ROOM SCAFFOLD (CLINICAL, no literary voice):
    - surfaceSituation, hiddenSituation, trajectory
    - backstoryThreads, conflictingInterests, looseThreads — bullet form, terse, FICTIONAL TRUTH not mood
    - firstBeatOnramp
    - setupPayoffs (plant/payoff pairs)
    - cast.arcStateAfterChain
    - dramaticIrony

CLINICAL means: state the WHAT, not the FEELING. No metaphors-of-meaning. No mood painting. No "the X lands where the Y once did." No "tension hangs over the hall." Just the events, the character mechanics, the cause-and-effect. The downstream beat-writer adds the literary voice when expanding a beat into prose. You are writing the SCAFFOLD they work from.

LITERARY (BAD — voice belongs in beats):
  trajectory: "The fort's silence grows louder than its actions; what was once a quiet doubt becomes a clamour for justice that Marek can no longer ignore, and in the climax the seal he buried surfaces in a public hand."

CLINICAL (GOOD — scaffold):
  trajectory: "Beats 1-2 establish the body and the seal. Beat 3 reveals Jorun was paid to ignore it. Beat 4 (climax): the buried seal surfaces publicly when Roselle hands it to the magistrate; Jorun is arrested."

LITERARY (BAD):
  hiddenSituation: "Beneath the polite veneer of Greyford, a careful conspiracy moves like a slow river — Iselle's couriers slip Tevin coin past honest eyes."

CLINICAL (GOOD):
  hiddenSituation: "Iselle runs a Tevin courier route through Greyford. Jorun is paid to misfile manifests. Drust is one of her runners; the dead bargeman was about to confess."

LITERARY (BAD):
  setupPayoff.plant: "the rust-brown crow that perches on the chapel gate, watching like a witness"
  payoff: "the crow is still there when the verdict is read"

CLINICAL (GOOD):
  plant: "rust-brown crow at chapel gate"
  payoff: "still there when verdict is read"

CharmHook-style character mechanics are fine in cast fields — those describe MECHANISM ("believes praise cheapens survival, withholds it"), not paint mood.

CRITICAL FORMATTING: surfaceSituation, hiddenSituation, trajectory, dramaticIrony are STRINGS, not arrays. cast.arcStateAfterChain is a STRING.

Output JSON only.`;

export interface BibleRequest {
  pool: CharacterPool;
  region: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  rewardSpec: RewardSpec;
  seedLeadBlurb?: string;
  requiredAnchorId?: string;
  isUnitChain?: boolean;
  recentMotifs?: readonly string[];
  readerFlavor?: string;
  themeKeywords?: readonly string[];
}

function sampleSizeForRarity(r: BibleRequest['rarity']): number {
  switch (r) { case 'common': return 4; case 'uncommon': return 5; case 'rare': return 6; case 'legendary': return 8; }
}

function buildUserPrompt(req: BibleRequest): { user: string; sample: PoolCharacter[]; required?: PoolCharacter } {
  const prefix = req.pool.cachedPrefix(req.region);
  const required = req.requiredAnchorId ? req.pool.get(req.requiredAnchorId) : undefined;
  const excludeFromSample = new Set<string>(required ? [required.id] : []);
  const sample = req.pool.regionSample(req.region, sampleSizeForRarity(req.rarity), excludeFromSample);

  const parts: string[] = [
    `CHARACTER POOL — for cast reuse`,
    ``,
    poolBlock(prefix, 'FORT ROSTER + LANDMARKS (cached prefix)'),
    ``,
    poolBlock(sample, `REGION NPC SAMPLE for this chain`),
  ];
  if (required) {
    parts.push(``);
    const label = req.isUnitChain
      ? 'REQUIRED IN CAST — this is a UNIT CHAIN: the anchor MUST be protagonist, and the hiddenSituation/trajectory MUST be driven by their want/need/ghost/lie. The chain exists to advance THEIR arc.'
      : 'REQUIRED IN CAST — engine has anchored this character (you MUST include them)';
    parts.push(poolBlock([required], label));
  }
  parts.push(``, `CHAIN SPEC`, `Region: ${req.region}`, `Rarity: ${req.rarity}`,
    `Engine-declared reward (climax must deliver this naturally): ${describeReward(req.rewardSpec)}`);
  if (req.themeKeywords?.length) parts.push(`Theme keywords: ${req.themeKeywords.join(', ')}`);
  if (req.seedLeadBlurb) parts.push(`Inciting hint (must reflect in surfaceSituation): ${req.seedLeadBlurb}`);
  if (req.readerFlavor) {
    parts.push(``, `READER PREFERENCE (the player has stated this preference; weave it into the bible while keeping the grimdark setting intact):`, req.readerFlavor);
  }
  if (req.recentMotifs?.length) {
    parts.push(``, `RECENTLY-USED CENTRAL DEVICES (do NOT reuse as this chain's central device): ${req.recentMotifs.join(' | ')}`);
  }
  parts.push(``, `Author the bible now. Output JSON only.`);
  return { user: parts.join('\n'), sample, required };
}

export interface CallUsage {
  model: string;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  costUsd: number;
}

const PRICES: Record<string, { in: number; out: number; cached: number }> = {
  'gpt-5': { in: 1.25, out: 10.00, cached: 0.125 },
  'gpt-5-mini': { in: 0.25, out: 2.00, cached: 0.025 },
  'gpt-5-nano': { in: 0.05, out: 0.40, cached: 0.005 },
};

function makeUsage(model: string, promptTok: number, cachedTok: number, completionTok: number): CallUsage {
  const p = PRICES[model] ?? { in: 0, out: 0, cached: 0 };
  const uncached = promptTok - cachedTok;
  const cost = (uncached * p.in + cachedTok * p.cached + completionTok * p.out) / 1_000_000;
  return { model, promptTokens: promptTok, cachedTokens: cachedTok, completionTokens: completionTok, costUsd: cost };
}

async function callJson<T>(client: OpenAI, model: string, system: string, user: string, schema: z.ZodType<T>, maxOut: number, effort?: 'minimal' | 'low' | 'medium' | 'high'): Promise<{ data: T; usage: CallUsage; raw: string }> {
  const params: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: maxOut,
    stream: false,
  };
  if (effort) params.reasoning_effort = effort;
  const resp = (await client.chat.completions.create(params as unknown as Parameters<typeof client.chat.completions.create>[0])) as unknown as {
    choices: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  };
  const content = resp.choices[0]?.message?.content ?? '{}';
  const promptTok = resp.usage?.prompt_tokens ?? 0;
  const completionTok = resp.usage?.completion_tokens ?? 0;
  const cachedTok = resp.usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const usage = makeUsage(model, promptTok, cachedTok, completionTok);
  let raw: unknown;
  try { raw = JSON.parse(content); }
  catch (e) { throw new Error(`${model} returned non-JSON: ${(e as Error).message}\nfirst 300: ${content.slice(0, 300)}`); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${model} schema failure: ${JSON.stringify(parsed.error.errors.slice(0, 3))}\ntop keys: ${typeof raw === 'object' && raw ? Object.keys(raw).join(', ') : 'n/a'}`);
  }
  return { data: parsed.data, usage, raw: content };
}

export async function generateBible(client: OpenAI, req: BibleRequest): Promise<{ bible: Bible; usage: CallUsage; sample: PoolCharacter[]; required?: PoolCharacter }> {
  const { user, sample, required } = buildUserPrompt(req);
  const { data: bible, usage } = await callJson(client, BIBLE_MODEL, BIBLE_SYSTEM, user, BibleSchema, 14000, BIBLE_EFFORT);
  return { bible, usage, sample, required };
}

// ---------------- beat ----------------

const BEAT_SYSTEM = `You are a writers'-room hand writing one quest beat at a time for a grimdark mercenary-fort game. You have the chain's BIBLE (cast, situation, trajectory) and the PRIOR BEATS with their outcomes. Write the NEXT beat.

A beat is a single quest with a HOOK (1-2 sentences the player sees on the deploy screen BEFORE they commit) and a BODY (3-6 sentences narrating the deployment's outcome conditional on a successful outcome — assume players succeed; the engine swaps in failure prose elsewhere). Beats progress the chain along its trajectory.

CRITICAL — PLAYER ONBOARDING:
- The player sits in their fort and discovers chains via the LEAD BOARD. They have NO prior knowledge of any cast character whose role is "npc" or "new" until that character is INTRODUCED in a beat the player has played.
- Beat 1's HOOK must read EXACTLY like the bible.leadBoardBlurb (or be a tight rephrasing of it) — concrete physical lead, no proper nouns the player has never met.
- Beat 1's BODY must follow the bible.firstBeatOnramp — the party arrives at the situation cold, and EARNS each named character by encountering them on-stage. Introduce one or two cast members in beat 1, no more.
- Subsequent beats may name cast members the player met in earlier beats. Do not skip ahead in the trajectory.
- The bible's hiddenSituation and trajectory are WRITERS'-ROOM information. Reveal them beat by beat. Beat 1 reveals only what the player would see arriving cold. The hidden situation lands in the climax, not the hook.

If you judge the chain has reached its climax (the bible's trajectory ending lands in this beat), set isClimax=true. A climax is an EVENT (someone does something irreversible), not an announcement. Once isClimax=true, the engine writes the epilogue and ends the chain.

BANNED TOKENS: weight, weighed, shadow, burden, ghosts, fate, destined, destiny, ancient evil, darkness descends, grip tightens, stranglehold.

DO NOT reuse 3-word phrases from prior beats. Coin fresh language.

Output JSON: { hook: string, body: string, isClimax: boolean }.`;

export interface PriorBeat {
  hook: string;
  body: string;
  outcome: 'clean-win' | 'narrow-win' | 'partial-loss' | 'failure';
  narration: string;
}

export async function generateBeat(client: OpenAI, bible: Bible, priorBeats: PriorBeat[], rarity: BibleRequest['rarity'], forceClimax: boolean): Promise<{ beat: Beat; usage: CallUsage }> {
  const bounds = { common: [2, 3], uncommon: [2, 4], rare: [3, 5], legendary: [3, 6] }[rarity];
  const beatNumber = priorBeats.length + 1;
  const userParts: string[] = [
    `BIBLE:`,
    JSON.stringify(bible, null, 2),
    ``,
    `PRIOR BEATS (${priorBeats.length}):`,
  ];
  for (const [i, b] of priorBeats.entries()) {
    userParts.push(`Beat ${i + 1} [${b.outcome}]: ${b.hook}\n  body: ${b.body}\n  played out: ${b.narration}`);
  }
  userParts.push(``, `Write beat ${beatNumber}. Chain bounds: ${bounds[0]}-${bounds[1]} beats.`);
  if (forceClimax) userParts.push(`The engine has decided THIS beat must be the climax (chain has reached upper bound). Set isClimax=true and end the chain here.`);
  else if (beatNumber < bounds[0]) userParts.push(`Chain is below minimum (${bounds[0]}); isClimax MUST be false this beat.`);
  userParts.push(``, `Output JSON only.`);
  return callJson(client, BEAT_MODEL, BEAT_SYSTEM, userParts.join('\n'), BeatSchema, 4000, BEAT_EFFORT)
    .then(r => ({ beat: r.data, usage: r.usage }));
}

// ---------------- epilogue ----------------

const EPILOGUE_SYSTEM = `You are the showrunner writing the epilogue for a completed quest chain. You have the chain's BIBLE (its trajectory and reward) and the BEATS as they actually played out (with outcomes). Write a short epilogue (180-360 words) that:

- Names the outcome of each cast member (alive/dead/captured/recruited/ruined/restored).
- Shows the reward arriving at the fort gate a week later (kit on back, banner under arm, ransom paid) — NOT delivered on-stage during the climax.
- Cites specific events from the played-out beats (the bolt notch, the burnt page, the broken seal).
- Echoes the bible's controllingIdea ONCE, in concrete language (do not state it directly as a moral).
- Leaves ONE loose thread that could seed a sequel (the unaccounted-for character, the missing object, the unanswered letter).

BANNED TOKENS: weight, weighed, shadow, burden, ghosts, fate, destined, destiny, ancient evil, darkness descends, grip tightens, stranglehold. Name a specific physical thing instead.

Voice: terse, present-tense, mud-and-iron. Concrete nouns over abstractions. No internal monologue. No "in the end" / "at last" / "finally" / "thus".

Output JSON: { title: string (4-8 words, concrete proper noun), prose: string (180-360 words). }`;

export async function generateEpilogue(client: OpenAI, bible: Bible, beats: PriorBeat[]): Promise<{ epilogue: Epilogue; usage: CallUsage }> {
  const userParts = [
    `BIBLE:`,
    JSON.stringify(bible, null, 2),
    ``,
    `BEATS AS PLAYED:`,
  ];
  for (const [i, b] of beats.entries()) {
    userParts.push(`Beat ${i + 1} [${b.outcome}]: ${b.hook}\n  body: ${b.body}\n  outcome narration: ${b.narration}`);
  }
  userParts.push(``, `Write the epilogue now. Output JSON only.`);
  return callJson(client, EPILOGUE_MODEL, EPILOGUE_SYSTEM, userParts.join('\n'), EpilogueSchema, 3000, EPILOGUE_EFFORT)
    .then(r => ({ epilogue: r.data, usage: r.usage }));
}

// ---------------- pool updates ----------------

export interface ChainResolution {
  chainId: string;
  day: number;
  region: string;
  bible: Bible;
  reward: RewardSpec;
  /** AI's chosen recipient for promote_to_merc / captive_to_dungeon (must be a cast.characterId or new char index). Engine validates. */
  rewardRecipientId?: string;
}

export interface PoolUpdateReport {
  addedIds: string[];
  updatedIds: string[];
  roleChanges: Array<{ id: string; from: string; to: string }>;
}

/** Apply the bible's cast.arcStateAfterChain updates, add new characters,
 * and fulfill the reward (promote/capture). Returns a report of changes. */
export function applyPoolUpdates(pool: CharacterPool, res: ChainResolution): PoolUpdateReport {
  const added: string[] = [];
  const updated: string[] = [];
  const roleChanges: PoolUpdateReport['roleChanges'] = [];
  let newIndex = 0;
  for (const entry of res.bible.cast) {
    if (entry.kind === 'existing') {
      if (!pool.get(entry.characterId)) {
        console.warn(`[pool] AI referenced unknown id "${entry.characterId}" — skipping update`);
        continue;
      }
      pool.updateArcState(entry.characterId, entry.arcStateAfterChain, res.day, res.chainId);
      updated.push(entry.characterId);
    } else {
      const newId = `char_${res.chainId}_${newIndex++}`;
      const nc = entry.character;
      pool.add({
        id: newId,
        name: nc.name,
        region: res.region,
        role: 'npc',
        tags: nc.tags,
        surface: nc.surface,
        want: nc.want,
        need: nc.need,
        ghost: nc.ghost,
        lie: nc.lie,
        secret: nc.secret,
        arcState: entry.arcStateAfterChain,
        introducedDay: res.day,
        lastSeenDay: res.day,
        appearedInChainIds: [res.chainId],
      });
      added.push(newId);
    }
  }
  // Fulfill reward by role-change on AI-picked recipient
  if (res.rewardRecipientId) {
    const c = pool.get(res.rewardRecipientId);
    if (!c) {
      console.warn(`[pool] reward recipient "${res.rewardRecipientId}" not in pool`);
    } else {
      const oldRole = c.role;
      if (res.reward.kind === 'promote_to_merc') pool.promoteToMercenary(c.id);
      else if (res.reward.kind === 'captive_to_dungeon') pool.setRole(c.id, 'captive');
      if (c.role !== oldRole) roleChanges.push({ id: c.id, from: oldRole, to: c.role });
    }
  }
  return { addedIds: added, updatedIds: updated, roleChanges };
}
