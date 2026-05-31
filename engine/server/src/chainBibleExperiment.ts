// CHAIN BIBLE EXPERIMENT (per-user direction 2026-05-31)
//
// Replaces the "write a 1100-word short story up-front" architecture with:
//   1) bible — a compact story bible (NOT prose; what a showrunner hands a
//      writers' room). Encodes: controlling idea, cast (want/need/ghost/lie/
//      secret per character), surface vs hidden situation, trajectory toward
//      an engine-declared reward, setup/payoff ledger, dramatic-irony cue.
//   2) generateNextBeat — called ONE BEAT AT A TIME with the bible + prior
//      beats + their play outcomes. Returns either the next beat OR a
//      climax-signal. AI decides when to climax (within min/hardcap bounds).
//      No hardcoded beat count.
//   3) generateEpilogue — bookend, given bible + all beats with outcomes.
//
// gpt-5-mini writes the bible; cheap model (gpt-4o-mini default) writes
// beats + epilogue. Keep the bible compact so it fits cleanly in every
// downstream prompt.

import OpenAI from 'openai';
import { z } from 'zod';

let cachedClient: OpenAI | null = null;
function getClient(apiKey: string): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function isGpt5Family(model: string): boolean {
  return model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');
}

interface ChatOpts {
  model: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chatParams(opts: ChatOpts): any {
  const base: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
  };
  if (opts.jsonMode) base.response_format = { type: 'json_object' };
  if (isGpt5Family(opts.model)) {
    base.max_completion_tokens = opts.maxTokens * 10;
  } else {
    base.temperature = opts.temperature;
    base.max_tokens = opts.maxTokens;
  }
  return base;
}

export function bibleModel(): string {
  return process.env.AIRAIDER_BIBLE_MODEL ?? 'gpt-5-mini';
}
export function beatModel(): string {
  return process.env.AIRAIDER_BEAT_MODEL ?? 'gpt-4o-mini';
}

// ============================ TYPES =================================

export type CastRole = 'protagonist' | 'antagonist' | 'complication' | 'ally';

export interface CastMember {
  name: string;
  role: CastRole;
  surface: string;        // what a stranger sees — 1-2 sentences
  want: string;           // external — short phrase
  need: string;           // internal — short phrase
  ghost: string;          // formative wound — short phrase
  lie: string;            // false belief — short phrase
  secret: string;         // hidden from others (drives dramatic irony) — short phrase
}

export interface SetupPayoff {
  plant: string;          // what to plant early
  payoff: string;         // what it earns later
}

export interface ChainBible {
  title: string;
  region: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  rewardSpec: string;     // engine-declared: "rare recruit: battle-scarred steward", "unique item: a Tevin signet ring", etc.
  controllingIdea: string;
  cast: CastMember[];
  surfaceSituation: string;
  hiddenSituation: string;
  trajectory: string;
  setupPayoffs: SetupPayoff[];
  dramaticIrony: string;
}

const CastMemberSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  surface: z.string().min(8),
  want: z.string().min(4),
  need: z.string().min(4),
  ghost: z.string().min(4),
  lie: z.string().min(4),
  secret: z.string().min(4),
});

const ChainBibleSchema = z.object({
  title: z.string().min(2).max(80),
  controllingIdea: z.string().min(10).max(220),
  cast: z.array(CastMemberSchema).min(2).max(5),
  surfaceSituation: z.string().min(20),
  hiddenSituation: z.string().min(20),
  trajectory: z.string().min(20),
  setupPayoffs: z.array(z.object({
    plant: z.string().min(6),
    payoff: z.string().min(6),
  })).min(2).max(5),
  dramaticIrony: z.string().min(10),
});

export type PlayOutcome = 'clean-win' | 'narrow-win' | 'partial-loss' | 'failure';

export interface GeneratedBeat {
  beatTitle: string;          // 4-9 words
  publicHook: string;         // 1 sentence the player sees on lead board
  beatBrief: string;          // 2-4 sentences: what happens in this beat
  craftNote: string;          // what plants/pays/reveals (editor visibility)
  isClimax: boolean;
  reasoning: string;          // why this beat now (or why climax)
}

const GeneratedBeatSchema = z.object({
  beatTitle: z.string().min(4).max(80),
  publicHook: z.string().min(20).max(320),
  beatBrief: z.string().min(40),
  craftNote: z.string().min(8),
  isClimax: z.boolean(),
  reasoning: z.string().min(8),
});

export interface BeatWithOutcome extends GeneratedBeat {
  outcome: PlayOutcome;
  outcomeNarration: string;   // 1-2 sentences: what actually happened in play
}

// ============================ BIBLE PROMPT ===========================

const BIBLE_SYSTEM = `You are the showrunner of a grimdark mercenary-fort game. You are writing a STORY BIBLE for one quest chain — the kind of compact reference document a TV writers' room works from. The bible is consumed by another writer (an AI) who will generate quest beats from it one at a time. Your job is to make that downstream writing possible AND inevitable.

BIBLE PRINCIPLES (read carefully):
- A bible is NOT prose. NO scenes, NO dialogue, NO sensory writing. Information-dense third-person summary.
- A bible is NOT a plot summary either. It is the underlying CHARACTERS + SITUATION + TRAJECTORY that produce a plot.
- A bible COMMITS. It does not list branching "if player fails X" alternatives. It says what is true and what is going to happen.
- A bible is REUSABLE. Every line answers a question a beat-writer might ask. Lines that don't earn their place are cut.
- A bible has TASTE. Grounded low-medieval fantasy: mud, salt, ink, iron, oath, debt. No glory, no prophecy, no fate-hangs-in-balance, no ancient evil. The drama is people, not magic.

CRAFT ELEMENTS (every bible must encode all of these in compact form):
1. CONTROLLING IDEA — one sentence stating what the chain ARGUES (not what happens). Examples that work: "Kindness becomes a chain when it goes unspoken." "A lie that protects a town becomes the thing that takes the town." "A man who waited too long to choose finds the choice made for him." Bad examples: "Mercenaries hunt smugglers in the fens." (That's a plot, not an argument.)

2. CAST (2-5 people, each compact):
   - name: first + last (or first + distinctive epithet).
   - role: protagonist / antagonist / complication / ally.
   - surface: 1-2 sentences a stranger meeting them in scene would form.
   - want (external): short phrase. The visible goal.
   - need (internal): short phrase. The thing they must learn / shed / accept. Usually OPPOSES the want.
   - ghost: short phrase naming the SPECIFIC past event that wounded them. Not "a hard life." "Lost his brother on the wall at Greyford."
   - lie: short phrase. The false belief their ghost produced. The thing the arc will shift. ("If I love them, I will fail them." "Loyalty is the only currency I cannot lose.")
   - secret: short phrase. What they hide from everyone in the chain. This is what powers dramatic irony — the player learns it gradually.
   The antagonist must MIRROR the protagonist's need, not just oppose their want. Their wants overlap or their wounds rhyme.

3. SURFACE SITUATION — 2-3 sentences. What the mercenaries are told the situation is when they're hired.

4. HIDDEN SITUATION — 3-5 sentences. What's actually going on under the cover. This is what beats will gradually expose.

5. TRAJECTORY — 3-5 sentences. The direction the story is heading + the SHAPE of the climax. The climax MUST land the reward the engine specified. Be concrete about what changes at the climax (what fact comes out, what character flips, what world-state shifts).

6. SETUP/PAYOFF LEDGER — 2-5 pairs. Each pair: a thing to PLANT in an early beat that PAYS OFF in a later beat. Foreshadowing is what makes a payoff land. Be specific (a named object, a named habit, a named place). The beat-writer will pick from this list when authoring beats. Bad: "plant: a sense of dread; payoff: it turns out bad." Good: "plant: the abbey's bell tolls one short in the second hour every night because the third-bell rope was cut years ago; payoff: the missing toll is how the protagonist knows the messenger reached the abbey when she expected him to ring a warning."

7. DRAMATIC IRONY — 1-2 sentences. Name what the PLAYER knows that the central NPCs don't, OR what the central NPCs know that the player doesn't — and at roughly what beat each side learns. This is the engine for "oh shit" moments.

RARITY GUIDANCE:
- common: 2-3 cast members, stakes are local (a village, a single household). Bible ~250 words.
- uncommon: 3 cast members, town-scale stakes. Bible ~350 words.
- rare: 3-4 cast members, abbey/noble/cursed-relic stakes. Bible ~450 words.
- legendary: 4-5 cast members, mythic stakes (a duchy, an oath that binds a year). At most ONE numinous element, and it stays mostly off-stage. Bible ~600 words.

REWARD-LANDING DISCIPLINE:
The engine declares what the climax must deliver (a rare recruit, a unique item, regional prestige, a captive released, etc.). The bible is plotted BACKWARD from that. The trajectory section must make clear how the climax causes the reward to land naturally — the character displaced into joining the fort, the relic surrendered, the title pressed into the company's hand. The reward is not a gold drop; it is a story consequence.

Output JSON only, matching the schema given. No prose outside the JSON.`;

export interface BibleInput {
  region: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  rewardSpec: string;
  themeKeywords?: readonly string[];
  seedLeadBlurb?: string;
  anchorMerc?: { name: string; backstory?: string; tagLabels?: readonly string[] };
}

export async function generateChainBible(input: BibleInput): Promise<ChainBible> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY required');
  const userParts: string[] = [
    `Write a chain bible for this engine spec.`,
    `Region: ${input.region}.`,
    `Rarity: ${input.rarity}.`,
    `Engine-declared reward (the climax must deliver this naturally): ${input.rewardSpec}.`,
  ];
  if (input.themeKeywords && input.themeKeywords.length > 0) {
    userParts.push(`Theme keywords (use as flavor cues, not as a checklist): ${input.themeKeywords.join(', ')}.`);
  }
  if (input.seedLeadBlurb) {
    userParts.push(`Inciting hint (must be reflected in surfaceSituation): "${input.seedLeadBlurb}".`);
  }
  if (input.anchorMerc) {
    userParts.push(``);
    userParts.push(`UNIT CHAIN: The PROTAGONIST is this specific mercenary already on the player's roster:`);
    userParts.push(`  Name: ${input.anchorMerc.name}`);
    if (input.anchorMerc.tagLabels) userParts.push(`  Tags: ${input.anchorMerc.tagLabels.join(', ')}`);
    if (input.anchorMerc.backstory) userParts.push(`  Backstory: ${input.anchorMerc.backstory}`);
    userParts.push(`Their want/need/ghost/lie/secret MUST come out of this backstory + tags. Do not rename them.`);
  }
  userParts.push(``);
  userParts.push(`Schema:`);
  userParts.push(`{`);
  userParts.push(`  "title": "4-10 words, contains at least one concrete proper noun from the bible",`);
  userParts.push(`  "controllingIdea": "one sentence stating what the chain argues",`);
  userParts.push(`  "cast": [ { "name":"...", "role":"protagonist|antagonist|complication|ally", "surface":"...", "want":"...", "need":"...", "ghost":"...", "lie":"...", "secret":"..." }, ... ],`);
  userParts.push(`  "surfaceSituation": "2-3 sentences",`);
  userParts.push(`  "hiddenSituation": "3-5 sentences",`);
  userParts.push(`  "trajectory": "3-5 sentences ending with how the climax delivers the reward",`);
  userParts.push(`  "setupPayoffs": [ { "plant":"specific thing to plant early", "payoff":"specific thing it earns later" }, ... ],`);
  userParts.push(`  "dramaticIrony": "1-2 sentences naming who knows what when"`);
  userParts.push(`}`);
  userParts.push(``);
  userParts.push(`Output the JSON only.`);

  const usr = userParts.join('\n');
  const m = bibleModel();
  const resp = await getClient(apiKey).chat.completions.create(chatParams({
    model: m,
    temperature: 0.9,
    maxTokens: 1400,
    jsonMode: true,
    messages: [
      { role: 'system', content: BIBLE_SYSTEM },
      { role: 'user', content: usr },
    ],
  }));
  const content = resp.choices[0]?.message?.content ?? '{}';
  const raw = JSON.parse(content);
  const parsed = ChainBibleSchema.parse(raw);
  return {
    title: parsed.title,
    region: input.region,
    rarity: input.rarity,
    rewardSpec: input.rewardSpec,
    controllingIdea: parsed.controllingIdea,
    cast: parsed.cast,
    surfaceSituation: parsed.surfaceSituation,
    hiddenSituation: parsed.hiddenSituation,
    trajectory: parsed.trajectory,
    setupPayoffs: parsed.setupPayoffs,
    dramaticIrony: parsed.dramaticIrony,
  };
}

// ============================ BEAT PROMPT ============================

const BEAT_SYSTEM = `You are a quest writer working from a chain bible handed down by the showrunner. You write ONE BEAT AT A TIME — the next quest the player will encounter in this chain.

YOUR JOB EACH CALL:
- Decide whether the chain is ready for its climax or whether another regular beat comes first.
- If a regular beat: produce a beat that advances the trajectory by a noticeable step, draws from the setup/payoff ledger when natural, respects the dramatic-irony schedule, and gives the player a concrete situation to bite on.
- If a climax: produce the beat that LANDS the engine-declared reward as a natural consequence — NOT a scene where the reward agrees to itself. The character does not say "I'll join you." The relic is not handed over on a velvet pillow. Show the moment the world tips, and let the reward arrive as the AFTERMATH (one step removed in the epilogue if needed).

WHEN TO CLIMAX (the AI's call, within engine bounds):
- isClimax=false if: the bible's hidden situation hasn't been exposed enough yet; key setups in the ledger haven't been planted; the cast hasn't been brought into direct collision; the reward would not feel earned.
- isClimax=true if: the player has seen enough to understand the stakes; the central NPC has been forced toward their lie; the antagonist mirror has been made visible; landing the reward NOW would feel earned and surprising.
- Hard rules from the engine (in the input): a minBeats floor (do not climax earlier than this) and a hardCap ceiling. THE HARDCAP IS A SAFETY RAIL, NOT A TARGET. Most chains should climax BEFORE the hardCap. If you can plausibly climax at minBeats, do.
- ANTI-REPETITION (THE STRONGEST CRITIQUE OF PRIOR RUNS — READ TWICE):
  Generating a new beat that puts the same protagonist in the same place with the same antagonist over the same object is NOT progress. It is padding. If you find yourself about to write that beat, the chain is ALREADY at its climax. Set isClimax=true on THIS call instead of adding the padding beat.
  Concretely: if the prior beat's beatBrief already had the protagonist standing in [place] with [the object] in their hand and [antagonist] across from them, then THIS call's beat must either (a) be the climax that resolves that standoff, or (b) leave that location for a structurally different scene (a different cast member's POV elsewhere; an earlier-planted setup paying off elsewhere; a complication arriving from outside). Do NOT generate beat N+1 as "same situation, now louder."
  SPECIFIC FAILURE MODE TO AVOID: do NOT write three beats in a row where the protagonist is "about to swear/pledge/sign/declare." If they are about to commit the act and the next beat would also be about-to-commit-the-act, the next beat IS the climax. Climax = the act.

CLIMAX DISCIPLINE (CRITICAL — read three times):
- The climax beat depicts the EVENT that resolves the central tension. NOT the verbal announcement of the resolution. NOT "about to". NOT "ready to". NOT "prepares to". NOT "steels herself to". The verbs are perfective: it happens.
- BAD climax: "Luyren raises his blade, ready to pledge his oath to Halvar."  (about-to)
- BAD climax: "Corin steps forward, ready to confront his past."  (about-to)
- BAD climax: "Aedric publicly renounces his oath and pledges allegiance to Mara's company."  (announcement)
- GOOD climax: "Luyren takes the half-banner from his pauldron and ties it to Halvar's saddle-pommel while Daina's men are still arguing with the gate-watch. By the time the watch's bell sounds the third hour, Luyren and the company are on the salt-road."  (event, with consequence)
- GOOD climax: "Corin lays the ledger on the magistrate's table and walks out of the chamber by the side door. The shouting starts behind him. He does not turn back."  (event)
- The reward arrives in the EPILOGUE as the aftermath of the climax, not in the climax beat itself.

PUBLIC-HOOK DISCIPLINE — THIS IS THE HARDEST PART, READ TWICE:
The publicHook is what the player sees on the lead board. It is a *situation*, not a *summary of what the player will do*.

BAD HOOK PATTERNS (NEVER WRITE THESE):
  ✗ "Alys must discover the truth about the ledger."
  ✗ "Roselle confronts Corbin in the town square."
  ✗ "Haldis decides whether to cede the banner to Torren."
  ✗ "Investigate the courier's arrival" / "Uncover X" / "Confront Y" / "Track down Z"
  ✗ Anything that names the player's task as a directive.
  ✗ Anything that ends with "...could it reveal X?" (cheap rhetorical questions).

GOOD HOOK PATTERN — describe a thing that has happened or is happening, in concrete sensory detail, naming people/places/objects from the bible. Let the *contract* be implied. Examples:
  ✓ "A drowned smuggler washed up at Greyford with the Vellis family seal stitched into his cloak. Marek recognised the cipher."
  ✓ "Corbin Muir has put a writ on Sister Ana's tavern; the seal is the magistrate's, but the hand is not."
  ✓ "Edda Banner-Sworn took the duel and lost the use of her right hand. Saltgate has not decided yet whether she also lost the banner."

Hooks must:
- Be one sentence OR two short sentences. Max ~280 chars total.
- Name at least ONE specific person, place, or object from the bible.
- Open in media res — something has happened, something is happening, somebody just did something.
- Imply tension without telegraphing the resolution. Do NOT spoil ledger setups that haven't paid off yet.
- NEVER use these tokens in any inflection: "weight", "weighed", "weighing", "weighs", "shadow", "shadows", "long shadows", "burden", "burdened", "ghosts", "fate", "destined", "destiny", "glorious", "ancient evil", "darkness descends", "grip tightens", "tightens its grip", "nefarious schemes", "pulls the strings", "puppets of", "stranglehold". When you want to convey heaviness or unease, NAME the specific physical thing (a chain-mail coat, a wax seal, a sealed letter, an awning casting a stripe across the threshold) — never reach for the abstract word.

EXAMPLE of the voice and form we want (read carefully — match this register):

  A week after the muster, Brann walked through the eastern gate at first bell with his kit on his back and the dog at his heel. Captain Wren met him in the yard and pointed at the loft above the smithy. He nodded once and climbed.

  The town was quieter for it. Cessa Ardren's name was gone from the rolls; her keep belonged to a magistrate who lived in another county. Father Wend had taken a posting at a salt-flat parish where no one had heard of him. Holm's adjutants had withdrawn under terms — they had been promised the keep, and they had got the keep, and they had not been promised anything else.

  Drust, the barge-master, had slipped upriver with a list of names. The list was real. Nobody at the fort spoke about it yet.

That epilogue is 145 words. It contains zero banned tokens. It names four specific play outcomes (Cessa removed, Wend's parish, Holm's terms, Drust's escape). The reward (Brann the recruit) arrives at the gate one step removed from the climax. The final image is concrete (the unspoken list). Match this register and discipline.

BEAT-BRIEF DISCIPLINE:
- 2-4 sentences for the engine — what happens in this beat regardless of how the play resolves. Concrete: name people, places, objects. The play will color how it ends; the brief names the situation, not the outcome.
- DO NOT introduce new named characters who are not in the bible cast. If you need a bit-player (a town crier, a courier, a guard), give them a function not a proper name.

CRAFT-NOTE + REASONING:
- craftNote: one short line — what this beat PLANTS, what it PAYS OFF, and/or what dramatic-irony shift it does. Reference plant/payoff entries from the ledger when used. If freestanding, say "freestanding beat".
- reasoning: one short line explaining why this beat now (or why climax now).

INPUT YOU RECEIVE:
- bible: the full chain bible (canon, do not contradict).
- priorBeats: each prior beat with title, brief, craftNote, AND its outcome (clean-win / narrow-win / partial-loss / failure) + a 1-2 sentence "outcomeNarration" of what actually happened in play. Let these outcomes color the next beat: a partial loss might require recovery; a clean win might let you skip forward.
- minBeats, hardCap: bounds described above.

Output JSON only, matching the schema:
{
  "beatTitle": "4-9 words",
  "publicHook": "1 sentence, player-facing",
  "beatBrief": "2-4 sentences, engine-facing",
  "craftNote": "what this plants/pays/reveals",
  "isClimax": false,
  "reasoning": "why this beat now"
}`;

export interface NextBeatInput {
  bible: ChainBible;
  priorBeats: readonly BeatWithOutcome[];
  minBeats: number;
  hardCap: number;
}

export async function generateNextBeat(input: NextBeatInput): Promise<GeneratedBeat> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY required');
  const forceClimax = input.priorBeats.length + 1 >= input.hardCap;
  const earliestClimax = input.priorBeats.length + 1 >= input.minBeats;

  const userParts: string[] = [
    `BIBLE:`,
    JSON.stringify({
      title: input.bible.title,
      region: input.bible.region,
      rarity: input.bible.rarity,
      rewardSpec: input.bible.rewardSpec,
      controllingIdea: input.bible.controllingIdea,
      cast: input.bible.cast,
      surfaceSituation: input.bible.surfaceSituation,
      hiddenSituation: input.bible.hiddenSituation,
      trajectory: input.bible.trajectory,
      setupPayoffs: input.bible.setupPayoffs,
      dramaticIrony: input.bible.dramaticIrony,
    }, null, 2),
    ``,
    `PRIOR BEATS (in order): ${input.priorBeats.length === 0 ? '(none yet — this is beat 1)' : ''}`,
  ];
  input.priorBeats.forEach((b, i) => {
    userParts.push(`  Beat ${i + 1}: "${b.beatTitle}"`);
    userParts.push(`    Brief: ${b.beatBrief}`);
    userParts.push(`    Craft: ${b.craftNote}`);
    userParts.push(`    Outcome: ${b.outcome} — ${b.outcomeNarration}`);
  });
  userParts.push(``);
  userParts.push(`BOUNDS:`);
  userParts.push(`  Beats so far: ${input.priorBeats.length}.`);
  userParts.push(`  minBeats (must not climax earlier than this total): ${input.minBeats}.`);
  userParts.push(`  hardCap (the next beat IS the climax if priorBeats.length+1 >= this): ${input.hardCap}.`);
  if (forceClimax) {
    userParts.push(`  *** ENGINE OVERRIDE: hardCap reached. isClimax MUST be true. ***`);
  } else if (!earliestClimax) {
    userParts.push(`  *** ENGINE OVERRIDE: minBeats not yet reached. isClimax MUST be false. ***`);
  }
  userParts.push(``);
  userParts.push(`Author the next beat. Output JSON only.`);

  const usr = userParts.join('\n');
  const m = beatModel();
  const resp = await getClient(apiKey).chat.completions.create(chatParams({
    model: m,
    temperature: 0.85,
    maxTokens: 700,
    jsonMode: true,
    messages: [
      { role: 'system', content: BEAT_SYSTEM },
      { role: 'user', content: usr },
    ],
  }));
  const content = resp.choices[0]?.message?.content ?? '{}';
  const raw = JSON.parse(content);
  // Enforce engine overrides
  if (forceClimax) raw.isClimax = true;
  if (!earliestClimax) raw.isClimax = false;
  return GeneratedBeatSchema.parse(raw);
}

// ============================ EPILOGUE ===============================

const EPILOGUE_SYSTEM = `You are the showrunner writing the closing image of a quest chain. You receive the bible and every beat with its play outcome. Write the epilogue.

FORMAT:
- 2-3 short paragraphs of PROSE. Not verse. Not rhyming. Not poetry. Plain mud-and-iron prose.
- Total 120-220 words. Shorter is better than longer.

DISCIPLINE:
- ECHO the controlling idea — the first paragraph should thematically reflect the chain's earliest situation; the last should land the changed world-state. "Echo" means thematic resonance, NOT rhyme or meter. Do NOT write the epilogue as verse.
- NAME ACTUAL PLAY CONSEQUENCES BY NAME. Cite at least 2 specific named outcomes from the beats. If a mercenary died in the beat outcomes, name them. If an object was lost (a ledger, an icon, a seal), name that object. If a named NPC slipped away, name them. The epilogue must read materially DIFFERENT if the outcome trace were different.
- Land the engine-declared reward as a CONCRETE ARRIVAL one step removed from the climax. The character does NOT say "I'll join you" or "I pledge allegiance" on-stage. Instead show them showing up at the fort gate a week later with their kit, or the relic appearing on the steward's table with no note, or the title arriving by writ from a magistrate who would rather not have written it. Earned reluctance > announced acceptance. THIS IS NOT OPTIONAL.
- NAMED-CHARACTER DISCIPLINE: Use names that appear EITHER in bible.cast OR in the outcome narrations of the beats. Do NOT invent new named NPCs. If an outcome narration introduces a name (e.g. "...before he wounded Iselle in the shoulder"), respect their established role/profession from that narration — do not invent a contradictory one.
- Leave exactly one deliberate loose thread — a person who slipped, a debt unsettled, a rumor that follows the company. Do not announce it as a sequel hook; just leave it in the world.
- Voice: low-medieval, mud-and-iron, terse, CONCRETE. When you would reach for "the weight of X" or "the shadow of Y" or "the burden of Z" — STOP, and name a specific physical thing instead. "Weight" → name the heavy object: a wax seal, a chain-mail coat, a pail of brackish water, a writ stamped twice. "Shadow" → name the actual thing casting it: an awning, a stone arch, a man with his back to a window. "Burden" → name what they are carrying: a ledger, a kit, a child's boot. These specific objects are ALWAYS better than the abstract noun.
- HARD WORD BAN. None of these may appear in your output, in any inflection, for any reason: "weight", "weighed", "weighing", "weighs", "shadow", "shadows", "burden", "burdened", "ghosts", "long shadows", "fate", "destined", "destiny", "glorious", "ancient evil", "darkness descends", "grip tightens", "tightens its grip", "stands chastened", "tapestry", "weave a tale", "salt-streaked", "salt-blistered", "stranglehold". Treat this as a compile rule: if the output contains any of these tokens, the output is broken.
- One concrete final image or short line of prose. Then stop.

Output the epilogue prose only — no JSON, no headings, no commentary, no verse.`;

export interface EpilogueInput {
  bible: ChainBible;
  beats: readonly BeatWithOutcome[];
  climax: BeatWithOutcome;
}

export async function generateChainEpilogueFromBible(input: EpilogueInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY required');
  const usr = [
    `BIBLE:`,
    JSON.stringify({
      title: input.bible.title,
      controllingIdea: input.bible.controllingIdea,
      rewardSpec: input.bible.rewardSpec,
      cast: input.bible.cast,
      surfaceSituation: input.bible.surfaceSituation,
      hiddenSituation: input.bible.hiddenSituation,
      trajectory: input.bible.trajectory,
      setupPayoffs: input.bible.setupPayoffs,
    }, null, 2),
    ``,
    `BEATS WITH OUTCOMES (in order):`,
    ...input.beats.map((b, i) =>
      `  Beat ${i + 1}: "${b.beatTitle}"\n    Brief: ${b.beatBrief}\n    Outcome: ${b.outcome} — ${b.outcomeNarration}`,
    ),
    `  CLIMAX: "${input.climax.beatTitle}"`,
    `    Brief: ${input.climax.beatBrief}`,
    `    Outcome: ${input.climax.outcome} — ${input.climax.outcomeNarration}`,
    ``,
    `Write the epilogue now.`,
  ].join('\n');
  const m = beatModel();
  const resp = await getClient(apiKey).chat.completions.create(chatParams({
    model: m,
    temperature: 0.85,
    maxTokens: 700,
    messages: [
      { role: 'system', content: EPILOGUE_SYSTEM },
      { role: 'user', content: usr },
    ],
  }));
  return (resp.choices[0]?.message?.content ?? '').trim();
}
