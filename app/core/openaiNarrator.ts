// OpenAINarrator — the real AI layer (gpt-5-mini). Prompts are the validated ones
// from docs/PROMPTS.md, adapted to the locked vocab via promptVocabBlock(). Every
// response is zod-validated and tag-canonicalized; a bad call throws (caller falls back).

import OpenAI from 'openai';
import { z } from 'zod';
import { canonicalTag, canonicalTags, promptVocabBlock } from './tags.js';
import { ATTRIBUTES, type Attribute } from './types.js';
import type {
  Narrator, NarratorOptions, CardAskInput, CardAskOut, OutcomeInput, OutcomeOut,
  FleshInput, FleshOut, GenesisInput, GenesisOut, ChainBeatInput, ChainBeatOut,
  ConceptTagsInput, ConceptTagsOut, AskOut, AICallRecord,
} from './ai.js';

const VOCAB = promptVocabBlock();
const ATTRS = ATTRIBUTES.join('|');

// ---- prompt-facing tag rules (shared blocks) --------------------------------
const VOCAB_BLOCK =
  `TAG VOCABULARY — choose ONLY from these exact words (return the bare word, no prefix); NEVER invent or alter:\n${VOCAB}\n` +
  `MUTEX — at most ONE from: gender, race, background; and within a personality pair (brave/cowardly…) or physical pair (muscular/frail…) never pick both.`;

// ---- zod schemas (permissive strings; tags canonicalized after) -------------
const zAsk = z.object({
  attribute: z.string(),
  favoredTags: z.array(z.string()).default([]),
  slots: z.array(z.string()).default([]),
});
const zCardAsk = z.object({ situation: z.string(), job: z.string(), ask: zAsk });
const zOutcome = z.object({
  beforeRoll: z.string(), afterRoll: z.string(),
  captive: z.object({ name: z.string(), who: z.string() }).nullable().optional(),
  punishment: z.string().nullable().optional(),
  learned: z.string().nullable().optional(),
  loot: z.string().nullable().optional(),
});
const zFlesh = z.object({ name: z.string(), who: z.string(), backstory: z.string(), quirks: z.array(z.string()).default([]) });
const zPerson = z.object({
  name: z.string(), who: z.string().default(''),
  history: z.array(z.string()).default([]),
  wants: z.string().default(''), want: z.string().optional(), feels: z.string().default(''),
  conceals: z.union([z.string(), z.boolean(), z.null()]).optional(),
  roleInStory: z.string().optional(), role: z.string().optional(),
});
const zGenesis = z.object({
  title: z.string(),
  leadBlurb: z.string(),
  goal: z.string().default(''),
  twistReveal: z.string().optional(),
  arc: z.array(z.string()).default([]),
  // accept either flat persons or {person, roleInStory} nesting
  cast: z.array(z.union([zPerson, z.object({ person: zPerson, roleInStory: z.string().optional() })])).default([]),
  situation: z.string(),
  tensions: z.array(z.string()).default([]),
  directions: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).default([]),
  openDirections: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).optional(),
});
const zChainBeat = z.object({ situation: z.string(), job: z.string(), ask: zAsk, proposedReward: z.string(), newLayerRevealed: z.string(), closesChain: z.union([z.boolean(), z.string(), z.null()]).optional(),
  immediateReward: z.union([z.boolean(), z.string(), z.null()]).optional(),
  choices: z.array(z.object({ label: z.string(), attribute: z.string().default('physical'), favored: z.array(z.string()).default([]) })).optional() });
const zConcept = z.object({ name: z.string(), who: z.string(), tags: z.array(z.string()).default([]) });

function normAttr(a: string): Attribute {
  const x = a.trim().toLowerCase() as Attribute;
  return (ATTRIBUTES as readonly string[]).includes(x) ? x : 'physical';
}
function normAsk(a: { attribute: string; favoredTags?: string[]; slots?: string[] }): AskOut {
  return {
    attribute: normAttr(a.attribute),
    favoredTags: canonicalTags(a.favoredTags ?? []),
    slots: (a.slots ?? []).map((s) => {
      const id = canonicalTag(s);
      return id ? { kind: 'must-have' as const, tag: id } : { kind: 'open' as const };
    }),
  };
}

export class OpenAINarrator implements Narrator {
  readonly kind = 'openai' as const;
  private client: OpenAI;
  // model TIER SPLIT (docs/AI_PROVIDER.md §4.1): narrative (player reads prose) gets the
  // stronger model; mechanical (engine consumes tags/IDs) gets the cheap/fast one.
  private narrativeModel: string;
  private mechanicalModel: string;
  private log: (s: string) => void;
  private onCall?: (rec: AICallRecord) => void;
  private effortOverride?: 'minimal' | 'low' | 'medium';
  readonly narrativeEffort: 'minimal' | 'low' | 'medium';
  private callCount = 0;

  constructor(opts: NarratorOptions) {
    this.client = new OpenAI({ apiKey: opts.apiKey ?? (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined), dangerouslyAllowBrowser: opts.browser });
    const env = typeof process !== 'undefined' ? process.env : ({} as Record<string, string>);
    const single = opts.model ?? env.AIRAIDER_LLM_MODEL;            // single-knob override (wins over both tiers)
    this.narrativeModel = single ?? env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-5-mini';
    this.mechanicalModel = single ?? env.AIRAIDER_LLM_MECHANICAL_MODEL ?? 'gpt-5-nano';
    this.log = opts.log ?? (() => {});
    this.onCall = opts.onCall;
    this.effortOverride = opts.effort ?? (env.AI_EFFORT as 'minimal' | 'low' | 'medium' | undefined);
    this.narrativeEffort = opts.narrativeEffort ?? (env.AI_NARRATIVE_EFFORT as 'minimal' | 'low' | 'medium' | undefined) ?? 'low';
  }

  private async json<T>(kind: string, system: string, user: string, schema: z.ZodType<T>, model: string, effort: 'minimal' | 'low' | 'medium' = 'low', maxTokens = 2000): Promise<T> {
    // Try the requested effort; if the model truncates to empty (reasoning ate the budget) or
    // returns invalid JSON, RETRY at minimal effort with a bigger budget (guaranteed output).
    // A single flaky call must never crash the game.
    const attempts: Array<{ eff: 'minimal' | 'low' | 'medium'; tok: number }> = [
      { eff: this.effortOverride ?? effort, tok: maxTokens },
      { eff: 'minimal', tok: Math.round(maxTokens * 1.6) },
    ];
    let lastErr = '';
    for (let a = 0; a < attempts.length; a++) {
      const { eff, tok } = attempts[a];
      const t0 = Date.now();
      const res = await this.client.chat.completions.create({
        model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' }, max_completion_tokens: tok,
        ...( { reasoning_effort: eff } as Record<string, unknown> ),
      } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
      const ms = Date.now() - t0;
      const usage = res.usage;
      const raw = res.choices[0]?.message?.content ?? '';
      this.log(`  ai[${kind}·${model}·${eff}${a ? ' RETRY' : ''}] ${(ms / 1000).toFixed(1)}s in=${usage?.prompt_tokens} out=${usage?.completion_tokens}`);
      this.onCall?.({
        n: ++this.callCount, kind, model, effort: eff, ms, system, user, response: raw,
        promptTokens: usage?.prompt_tokens, completionTokens: usage?.completion_tokens,
        cachedTokens: (usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })?.prompt_tokens_details?.cached_tokens ?? 0,
      });
      try { return schema.parse(JSON.parse(raw)); }
      catch (e) { lastErr = raw ? String(e).slice(0, 120) : 'empty response'; }
    }
    throw new Error(`AI ${kind} failed after retry: ${lastErr}`);
  }

  async cardAsk(i: CardAskInput): Promise<CardAskOut> {
    const system =
      `You write ONE mercenary-fort job card for a grimdark, low-medieval world, plus its assignment ask.\n` +
      `Output JSON only:\n` +
      `{ "situation": "<=40 words: who brings the job to the company's gate and the concrete problem. POV: only what arrives at the gate",\n` +
      `  "job": "one line: the concrete action the company commits to",\n` +
      `  "ask": { "attribute": "one of ${ATTRS} (what this job mainly tests)",\n` +
      `    "favoredTags": ["0-3 tag words from the vocabulary, bare (no prefix)"],\n` +
      `    "slots": ["one per party slot, each EITHER \\"open\\" OR a single tag word the job plainly needs"] } }\n` +
      `${VOCAB_BLOCK}\n` +
      `ATTRIBUTE — pick the one the job's CORE test needs, and VARY across jobs: physical=force/brawn/melee, agility=speed/stealth/precision, intelligence=lore/investigation/cunning, charisma=persuasion/deceit/people, willpower=nerve/endurance under dread. Most jobs are NOT willpower — reserve it for holding-the-line-against-fear jobs. A raid→physical, a stealth/hunt→agility, an investigation→intelligence, a parley/escort-by-trust→charisma.\n` +
      `RULES: terse, plain, concrete. State the job so the player knows exactly what taking it commits them to. NEVER write numbers. slots length must equal the SLOT COUNT given. Prefer "open" slots. JSON only.`;
    const user = `Archetype: ${i.archetype}\nLocation: ${i.location}\nSlot count: ${i.slotCount}\nThe job results in ${i.rewardSeed}.\nWrite the card + ask. JSON only.`;
    const out = await this.json('cardAsk', system, user, zCardAsk, this.mechanicalModel, 'minimal', 1200);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    return { situation: out.situation, job: out.job, ask };
  }

  async outcome(i: OutcomeInput): Promise<OutcomeOut> {
    const system =
      `You narrate the result of a mercenary job the company ALREADY ACCEPTED, then name any captive taken.\n` +
      `Given the JOB CARD, the PARTY sent (each merc + tags), the OUTCOME, and any DELIVERED captive's tags.\n` +
      `Output JSON only:\n` +
      `{ "beforeRoll": "35-55 words: the BUILDUP to the roll. Set the scene and let the CHALLENGE materialise (the threat rises to meet them, the obstacle resists), and the merc(s) COMMIT. END ON THE BRINK — the held breath the instant before fate decides (blade raised, question asked, weight thrown). Do NOT hint or state the result; stop right before it. This is the moment the player is gambling on.",\n` +
      `  "afterRoll": "55-90 words: the CONSEQUENCE flowing from the verdict (the dice have decided — OUTCOME). Pay it off with weight; EACH named merc gets their own distinct beat, true to their tags. Show what is won or lost. SUCCESS = clean; PARTIAL = it works but a cost lands (shown); FAILURE = the attempt fails and a consequence bites.",\n` +
      `  "captive": { "name": "string", "who": "one line, fits the captive tags" } or null,\n` +
      `  "punishment": "<=12 words: only if OUTCOME=FAILURE and the job was RISKY — the consequence that lands; else null",\n` +
      `  "learned": "<=18 words: the ONE concrete truth the company comes away KNOWING this beat — a NAME, a face, a deed (never 'a hidden actor'). YOU decide it from the SUGGESTED truth + the OUTCOME: success = the suggested truth (or a sharper version); partial = only PART of it, hedged or learned at a cost; failure = \\"\\" (nothing concrete, or only a misleading scrap). Whatever you set here MUST also be shown being discovered in afterRoll.",\n` +
      `  "loot": "<=10 words: the side-loot actually carried off this beat (flavour only — the game sets value). success = the suggested loot; partial = a lesser haul; failure = \\"\\"" }\n` +
      `OUTCOME MEANINGS: SUCCESS = clean, captive taken (if any), the truth and loot won. PARTIAL = won but at a COST you must SHOW (a wound / complication / only PART of the truth / lesser haul). FAILURE = captive NOT taken (captive=null), little or nothing learned; a consequence lands. The DICE have already decided the outcome — your job is to narrate it AND decide, scaled to it, what was learned and gained.\n` +
      `RULES: continue FROM the card (same people/place). Read each merc's tags and act them. Do NOT describe capturing/binding a prisoner unless DELIVERED CAPTIVE TAGS are given (if 'none', no captive is taken). Terse, concrete, low-medieval. NEVER write numbers. JSON only.`;
    const party = i.party.map((p) => ` ${p.name} [${p.tags.join(', ')}]`).join('\n');
    const user =
      `JOB CARD:\n situation: ${i.situation}\n job: ${i.job}\nPARTY SENT:\n${party}\n` +
      `DELIVERED CAPTIVE TAGS: ${i.captiveTags ? '[' + i.captiveTags.join(', ') + ']' : 'none'}\n` +
      (i.approach ? `CHOSEN APPROACH: ${i.approach} — the afterRoll MUST read as this approach.\n` : '') +
      (i.midSaga ? `MID-SAGA BEAT: this is one beat of an ongoing story, NOT its end. Do NOT kill, capture, bind, defeat-for-good, or otherwise permanently remove ANY named person — the cast must survive and stay free for later beats. A FAILURE here is a SETBACK (they slip away, the trail goes cold, a wound, a worsening), never a death or capture. Take NO captive (captive=null).\n` : '') +
      (i.proposedReveal ? `SUGGESTED TRUTH (the beat set this up to surface — YOU decide how much actually lands given the OUTCOME): "${i.proposedReveal}"\n` : '') +
      (i.proposedLoot ? `SUGGESTED LOOT (what the beat could drop — scale to the OUTCOME): "${i.proposedLoot}"\n` : '') +
      `RISKY: ${i.risky ? 'yes' : 'no'}\nOUTCOME: ${i.outcome.toUpperCase()}\nNarrate, continuing from the card; decide what was learned and gained. JSON only.`;
    const out = await this.json('outcome', system, user, zOutcome, this.narrativeModel, this.narrativeEffort, 1600);
    return { beforeRoll: out.beforeRoll, afterRoll: out.afterRoll, captive: out.captive ?? null, punishment: out.punishment ?? null, learned: out.learned ?? null, loot: out.loot ?? null };
  }

  async flesh(i: FleshInput): Promise<FleshOut> {
    const system =
      `You give a freshly-acquired character a name and a face. Their TAGS and ATTRIBUTES are FIXED (already rolled) — you do NOT add, drop, or change tags; you write prose that FITS them.\n` +
      `Output JSON only:\n` +
      `{ "name": "low-medieval given+by-name (Germanic/Celtic/Slavic register)",\n` +
      `  "who": "one line — their public 'known for'",\n` +
      `  "backstory": "<=45 words — where they came from + one concrete detail or wound, consistent with every tag",\n` +
      `  "quirks": ["1-2 short concrete habits"] }\n` +
      `RULES: every word consistent with the given tags (a cowardly one is never 'fearless'; a priest is not a thief). High attributes read as natural giftedness, not loot. Terse, concrete, grimdark. NEVER write numbers. JSON only.`;
    const attrs = ATTRIBUTES.map((a) => `${a} ${i.attrs[a]}`).join(', ');
    const user = `TAGS: ${i.tags.join(', ')}\nATTRIBUTES: ${attrs}\nACQUIRED AS: ${i.context}.\nJSON only.`;
    // flesh is NARRATIVE-tier (deviates from the guide's nano flavorCaptive): the backstory +
    // quirks are read in the dossier and are attachment-critical, so they get the stronger model.
    const out = await this.json('flesh', system, user, zFlesh, this.narrativeModel, this.narrativeEffort, 1400);
    return { ...out, quirks: (out.quirks ?? []).slice(0, 2) };
  }

  async genesis(i: GenesisInput): Promise<GenesisOut> {
    const depth: Record<string, string> = {
      common: 'cast 2 people (the core person + one other who matters).',
      uncommon: 'cast 2-3 people, each with a clear role in the quest.',
      rare: 'cast 3-4 people, each with a distinct stake in the quest.',
      legendary: 'cast 4-5 people, each with a distinct stake; richer web of allies and obstacles.',
    };
    const eb = i.expectedBeats ?? 4;
    const twistBlock = i.twist
      ? `TWIST QUEST (engine-chosen): the job is a MISDIRECTION. "goal" = the APPARENT job the player commits to; "twistReveal" = how the truth subverts it (the client lies / the quarry is the victim / the prize is a trap / the one you rescue is the threat) — it must be FAIR (findable) and CHANGE what the right thing to do is. It lands in a MIDDLE arc step, NEVER beat 1. "situation" = the real truth.`
      : `STRAIGHT QUEST (engine-chosen): NO misdirection — the job is honestly what it appears; the interest comes from the obstacles and the people. Set "twistReveal" to "".`;
    const system =
      `You design a QUEST for a MERCENARY COMPANY — and the believable truth behind it. The player RUNS the company: this lands on their job board, or someone brings it to their fort. Your job is to make a quest they have a clear REASON to take and a STAKE in — then build the believable people and truth that make it real. NOT prose; the settled facts a writers' room works from, told straight.\n` +
      `You are given the CORE PERSON the quest centers on (their tags / known life), a few THEME words, a SETTING, a TONE, and the region.\n\n` +
      `BUILD A QUEST THE COMPANY WOULD TAKE:\n` +
      `- THE HOOK — how the company gets the job and WHY they'd take it. Someone hires them for coin, pleads for help, posts a bounty, OR the core person comes to the fort and asks them directly. The mercenary reason must be PLAIN: pay, a person to save/escort/find, a captive or recruit worth taking, a threat to remove. The player must read the hook and think "yes, that's a job for us."\n` +
      `- THE GOAL — one clear thing the company is trying to ACHIEVE across the saga (save / escort / find / protect / hunt / recover / expose / deliver someone or something). Every beat is a step toward it; the player always knows what they're working toward.\n` +
      `- DRAMA SERVES THE QUEST. The cast's wants are OBSTACLES, allies, costs, and turns ALONG the goal — not a static web of strangers the player merely watches. The player is a PARTICIPANT working toward the goal, never a spectator.\n\n` +
      `${twistBlock}\n` +
      `PLAN THE ARC — output "arc": a ROUGH ordered guide of ~${eb} beat-steps (a skeleton, NOT a rigid script). STEP 1 = the OPENER (the company TAKES the job / meets the person) — do NOT finish the goal here. MIDDLE steps = escalating obstacles and turns. LAST step = the FINALE where the goal is finally achieved/resolved. CRITICAL: the company must NOT complete the goal before the last step — a 'recover the locket' job does not recover it in step 1. Each step is a short phrase.\n` +
      `PEOPLE — keep them LEAN: each is ONE vivid line (who they are + the one thing that matters here), a "want", and a "role" in the quest (client / companion / quarry / obstacle / ally / prize). NO backstory ladders — deep history is written later, only for whoever the company actually keeps.\n` +
      `BELIEVABILITY: every present fact traces to a prior cause in history; ordinary human motives, not plot necessity; no coincidence-stacking; nobody acts dumb to keep the situation alive.\n` +
      `COMMIT TO THE TRUTH: this bible IS the settled, complete truth. If a killing/theft/betrayal/disappearance happened, state plainly WHO did it and WHY. BANNED in the hidden layer: "unknown", "remains hidden", "it is unclear", "a mysterious figure", "the truth of X is never revealed" — you the author already know, so write it down.\n` +
      `THE CORE PERSON + THEMES make the quest specific. Their tags — craft, magic, profession, temperament — must be CENTRAL to what the quest is about (a water-singer's job turns on water and song; a going-blind carver's on the carving). The THEMES are a spark to FUSE, not a checklist (weave them in; you need not name them). Match the TONE you're given — not every saga is grim. Keep it ONE clear situation, small enough to care about.\n\n` +
      `Output JSON only:\n` +
      `{ "title": "short, concrete, names a real thing/person/place — NOT a poetic two-noun phrase like 'Oar and Scar', NOT 'The Weight of X'",\n` +
      `  "leadBlurb": "1-2 sentences the PLAYER reads on the job board — a CLEAR job they'd take: who/what it concerns, what the company is wanted FOR, and the draw (pay / a person / a prize). Plain and inviting, not cryptic. Hide the deep secret, but never hide what the JOB is.",\n` +
      `  "goal": "one line: the APPARENT thing taking this quest commits the company to ACHIEVE (e.g. 'escort Alen to the abbey alive', 'find and bring back the miller's daughter'). The throughline.",\n` +
      `  "twistReveal": "${i.twist ? 'how the truth SUBVERTS the apparent goal — the player must NOT see this; it surfaces across beats and lands at a middle step' : 'leave EMPTY \\"\\" — this is a straight quest'}",\n` +
      `  "arc": ["~${eb} short step phrases — step 1 = take the job/meet (goal NOT done), last = goal achieved at the finale"],\n` +
      `  "cast": [ { "name": "...", "who": "one vivid line — who they are + the one thing that matters here", "want": "plain want now", "role": "client / companion / quarry / obstacle / ally / prize" } ],\n` +
      `  "situation": "2-4 sentences — the believable truth behind the job, told straight (for a twist quest this is the REAL situation the player will uncover)",\n` +
      `  "tensions": ["what stands in the way and what's at stake: <A> wants <X>; <B> wants <Y>; because <reason> — obstacles ALONG the goal, not a standalone argument"],\n` +
      `  "directions": [ { "kind": "active", "hook": "the next concrete step toward the goal the company can take" }, { "kind": "ambient", "hook": "something pressing on the goal that unfolds with or without them" } ] }\n` +
      `The FIRST cast entry MUST be the core person. ${depth[i.rarity ?? 'uncommon']} Include AT LEAST ONE 'active' and ONE 'ambient' direction.\n` +
      `RECURRING CAST — if EXISTING WORLD CHARACTERS are listed below, you MAY cast AT MOST ONE (rarely two) as a SECONDARY person (NEVER the core person), referencing them by their exact name + known surface; the history you write about them is new canon consistent with what's known. A returning face makes the world feel lived-in — but only where one genuinely fits the story; do NOT crowd the bible with familiar faces, and MANY sagas should use NONE and introduce fresh strangers. Coin fresh names for everyone else.\n` +
      `BANNED PURPLE WORDS: weight, shadow, burden, fate, destiny. Clinical voice (state what IS). JSON only.`;
    const core = i.personal
      ? `CORE PERSON: the existing mercenary ${i.name ?? ''} — known as "${i.who ?? ''}"; ${i.backstory ?? ''}. Tags: [${i.focalTags[0]?.join(', ')}]. Build THEIR own buried past as NEW canon consistent with the above. Keep their name.`
      : `CORE PERSON tags: [${i.focalTags[0]?.join(', ')}]. Invent and NAME them; the story centers on them.`;
    const avoid = i.avoid?.length
      ? `\nMake this DISTINCT from recent sagas: ${i.avoid.map((a) => `"${a}"`).join('; ')}.`
      : '';
    const seed = i.seed ? `\nTHEMES (fuse these into the core person's life — a spark, not a checklist; you need not name them): ${i.seed}` : '';
    const place = i.place ? `\nSETTING (stage the saga here): ${i.place}` : '';
    const tone = i.tone ? `\nTONE (the register for this quest): ${i.tone}` : '';
    const pool = i.poolCast?.length
      ? `\nEXISTING WORLD CHARACTERS (you MAY cast one or two as SECONDARY people — never the core person):\n${i.poolCast.map((p) => `  - ${p.name} — ${p.who} [${p.tags.join(', ')}]`).join('\n')}`
      : '';
    const user = `${core}\nREGION: ${i.region}${place}${tone}${seed}${pool}${avoid}\nBuild the quest bible. JSON only.`;
    const out = await this.json('genesis', system, user, zGenesis, this.narrativeModel, this.narrativeEffort, 4000);
    // flatten {person,roleInStory} → BiblePerson; coerce conceals
    const cast = (out.cast ?? []).map((c) => {
      const p = ('person' in c ? { ...c.person, role: c.roleInStory ?? c.person.role } : c) as Record<string, unknown>;
      return {
        name: String(p.name ?? 'Unknown'), who: String(p.who ?? ''),
        history: Array.isArray(p.history) ? p.history.map(String) : [],
        wants: String(p.want ?? p.wants ?? ''), feels: String(p.feels ?? ''),
        conceals: typeof p.conceals === 'string' && p.conceals ? p.conceals : undefined,
        role: p.role ? String(p.role) : undefined,
      };
    });
    const dirsRaw = (out.directions?.length ? out.directions : out.openDirections) ?? [];
    const directions = dirsRaw.map((d) => typeof d === 'string'
      ? { kind: 'active' as const, hook: d }
      : { kind: (d.kind === 'ambient' ? 'ambient' : 'active') as 'ambient' | 'active', hook: d.hook });
    const twistReveal = i.twist && out.twistReveal && out.twistReveal.toLowerCase() !== 'none' ? out.twistReveal : undefined;
    return { title: out.title, leadBlurb: out.leadBlurb, goal: out.goal ?? '', arc: out.arc ?? [], twistReveal, cast, situation: out.situation, tensions: out.tensions ?? [], directions };
  }

  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    const system =
      `You are the quest-writer for a grimdark mercenary-fort game. The player RUNS a mercenary company and is working a JOB. A hidden BIBLE holds the settled truth + the QUEST GOAL (what the company is trying to achieve). The player NEVER sees the bible. Write the NEXT step of this job — a concrete task the company is OFFERED that visibly moves them toward the goal — revealing the buried truth only a LITTLE at a time, through what the company can see and do. The player must always understand what they're doing and why it serves the job; never make them a spectator to a scene with no task in it for them.\n` +
      `Given: the BIBLE (hidden truth + named cast), the CHAIN STATE (what's happened / what the player already knows), and the beat instruction.\n` +
      `Output JSON only:\n` +
      `{ "situation": "<=55 words the PLAYER reads — what the company ENCOUNTERS on this beat (someone/something arriving, OR what they find in the field — per the BEAT INSTRUCTION's opening). POV-LOCKED: only what the company can see/hear or already learned. READABILITY MATTERS: write 2-4 CLEAN, plain sentences a player reads once and understands — NOT telegraphic fragment-stacking ('Grey morning. Mud. A man.') and NOT comma-splice run-ons. Weave the time of day into a real sentence, don't stack it as a fragment. ORIENT THE PLAYER, ONCE: the FIRST time a person appears, weave a 2-4 word who-they-are into the sentence as natural apposition ('his neighbour Lysa', 'a bailiff named Toft') — NOT in parentheses. But a name in the ALREADY-MET list below has been introduced in an earlier beat: use their BARE name with NO tag (re-explaining who they are every beat reads badly). Concrete sensory detail, but clarity first.",\n` +
      `  "job": "one plain line — exactly what taking this job commits the company to DO (escort / recover / guard / confront / investigate a specific thing)",\n` +
      `  "ask": { "attribute": "${ATTRS}", "favoredTags": ["0-3 bare tag words"], "slots": ["one per slot: open OR a tag word"] },\n` +
      `  "proposedReward": "<=12 words — the tangible LOOT this beat plausibly drops (a purse, a strongbox's coin, a salvaged tool); the GAME sets its value. NOT the saga's payoff — that is decided at the finale.",\n` +
      `  "immediateReward": true/false — TRUE only if THIS beat physically hands the company spoils RIGHT NOW (they raid/loot/seize/crack open something with coin or goods inside); FALSE for meet/scout/travel/talk/escort/negotiate beats that only make progress. Most beats are FALSE. (The engine still banks a share toward the finale regardless.)\n` +
      `  "newLayerRevealed": "<=18 words — the ONE CONCRETE fact the player learns on success: a NAME, a face, a specific deed (never 'a hidden actor' / 'a second figure' — name them or show the concrete symptom)",\n` +
      `  "closesChain": true/false — does THIS beat resolve the whole arc? Set true ONLY if the BEAT INSTRUCTION permits closing AND the story has genuinely reached its climax; otherwise false,\n` +
      `  "choices": OPTIONAL 2-3 distinct APPROACHES the player picks between to do THIS beat — include ONLY when the beat genuinely affords different methods (slip past a guard vs fight through vs talk your way in; rescue by stealth vs by force). Each: { "label": "<=6 words, the approach", "attribute": one of [${ATTRS}] it tests, "favored": [0-2 bare tag words that help] }. The approaches must test DIFFERENT attributes. Omit entirely for a single-approach beat. }\n` +
      `${VOCAB_BLOCK}\n` +
      `FOLLOW THE BEAT INSTRUCTION below — it tells you this beat's job in the arc and whether you may close it.\n` +
      `CRAFT (this is character drama, not a logistics audit):\n` +
      `- PUT THE CAST ON-STAGE. The chain is about the bible's PEOPLE. Bring a NAMED cast member into this beat in the flesh; never run the whole story through a faceless clerk/contract while the real characters stay off-screen.\n` +
      `- SERVE THIS BIBLE'S OWN STORY. The beats exist to bring THIS bible's specific hook (its curse / feud / vow / heresy / secret) to life — NOT to run a generic crime procedural (investigate-a-ledger → shelter-a-witness → force-a-confession → public-trial) that would fit any saga. Whatever makes THIS story unique must be live and pressing in the scene.\n` +
      `- VARY THE BEAT. Each beat does something DIFFERENT: meet/warm-to → get closer → a danger → wants collide → a turn or betrayal → reveal. CHAIN STATE lists what already happened — do NOT reopen on the same scene, object, place, or cast-member entrance you used before. Change WHO is on stage (don't open two beats running on the same person unless this beat truly centers on them), WHERE it happens, and the ACTION. NEVER make two beats both about fetching/recovering/securing the SAME object — a saga is not five attempts to grab one item.\n` +
      `- VARY THE ARRIVAL — this is critical. NOT every beat is "a person staggers to the gate at dusk". The thing that reaches the company can be: a rumor, summons, letter or writ delivered; a creditor, rival or official; a frightened child; a named cast member in person; OR the company already deployed on the prior thread encountering something in the field. Rotate the time of day. If a previous beat opened with someone arriving at the gate, open THIS one differently.\n` +
      `- CONCRETE SYMPTOMS, NOT CAUSES. Show the symptom (a wound, a scorched door, a fled witness), never the hidden cause's name. The hidden CAUSE stays buried; reveal one small concrete layer.\n` +
      `- CONTINUITY. Follow believably from CHAIN STATE — react to what the company just did and what's now in motion. Don't reset to a fresh unrelated job.\n` +
      `ATTRIBUTE — pick the one this beat's core test needs and VARY it (physical=force, agility=speed/stealth, intelligence=lore/cunning, charisma=people, willpower=nerve). Most beats are NOT willpower.\n` +
      `The ASK fits the MUNDANE SURFACE, not the hidden truth. Prefer "open" slots. State the job plainly; keep the WHY hidden. Vivid but concrete; NEVER write numbers. JSON only.`;
    const met = i.introduced?.length ? `\nALREADY MET (use bare names, do NOT re-tag who they are): ${i.introduced.join(', ')}` : '';
    const user = `HIDDEN BIBLE:\n${i.bible}\n\nCHAIN STATE (what already happened — react to it, don't repeat it): ${i.chainState}${met}\nREGION: ${i.region}\nSLOT COUNT: ${i.slotCount}\nBEAT INSTRUCTION: ${i.beatConstraint}\nJSON only.`;
    const out = await this.json('chainBeat', system, user, zChainBeat, this.narrativeModel, this.narrativeEffort, 1800);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    const ATTR_OK = ['physical', 'agility', 'intelligence', 'charisma', 'willpower'];
    const choices = (out.choices ?? []).filter((c) => c.label).map((c) => ({
      label: String(c.label ?? '').slice(0, 40),
      attribute: ATTR_OK.includes(String(c.attribute)) ? String(c.attribute) : 'physical',
      favored: canonicalTags(c.favored ?? []),
    })).slice(0, 3);
    return { ...out, ask, closesChain: out.closesChain === true || out.closesChain === 'true', immediateReward: out.immediateReward === true || out.immediateReward === 'true', choices: choices.length >= 2 ? choices : undefined };
  }

  async conceptTags(i: ConceptTagsInput): Promise<ConceptTagsOut> {
    const system =
      `You invent a character for a grimdark mercenary-fort world and choose their concept tags. Tags are a FIXED vocabulary — choose ONLY from it; never invent, shorten, or alter.\n` +
      `Output JSON only: { "name": "low-medieval name", "who": "one line", "tags": ["chosen bare words"] }\n` +
      `${VOCAB_BLOCK}\n` +
      `RULES: background is the character's PROFESSION/ORIGIN, not their current state (being captured is a role, not a tag). Always set a gender. Choose the few tags that DEFINE the concept (a brutal reaver = cruel/scarred, never kind); the engine adds the rest. JSON only.`;
    const out = await this.json('conceptTags', system, `CONCEPT: ${i.concept}\nJSON only.`, zConcept, this.mechanicalModel, 'minimal', 900);
    return { name: out.name, who: out.who, tags: canonicalTags(out.tags ?? []) };
  }
}
