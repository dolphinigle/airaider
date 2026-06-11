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
  ConceptTagsInput, ConceptTagsOut, AskOut, AICallRecord, OfferKind, OfferedReward,
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
const zOffer = z.object({ kind: z.string().default('gold'), label: z.string().default('') });
const zCardAsk = z.object({ situation: z.string(), job: z.string(), offeredReward: zOffer.default({ kind: 'gold', label: '' }), ask: zAsk });
const zOutcome = z.object({
  beforeRoll: z.string(), afterRoll: z.string(),
  captive: z.object({ name: z.string(), who: z.string() }).nullable().optional(),
  malus: z.object({ kind: z.string().default('none'), label: z.string().default('') }).optional(),
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
  choiceSteps: z.array(z.union([z.number(), z.string()])).default([]),
  // accept either flat persons or {person, roleInStory} nesting
  cast: z.array(z.union([zPerson, z.object({ person: zPerson, roleInStory: z.string().optional() })])).default([]),
  situation: z.string(),
  tensions: z.array(z.string()).default([]),
  directions: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).default([]),
  openDirections: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).optional(),
});
const zChainBeat = z.object({ situation: z.string(), job: z.string(), offeredReward: zOffer.optional(), ask: zAsk, proposedReward: z.string(), newLayerRevealed: z.string(), closesChain: z.union([z.boolean(), z.string(), z.null()]).optional(),
  immediateReward: z.union([z.boolean(), z.string(), z.null()]).optional(),
  choices: z.array(z.object({ label: z.string(), attribute: z.string().default('physical'), favored: z.array(z.string()).default([]), kind: z.string().optional() })).optional() });
const zConcept = z.object({ name: z.string(), who: z.string(), tags: z.array(z.string()).default([]) });

function normAttr(a: string): Attribute {
  const x = a.trim().toLowerCase() as Attribute;
  return (ATTRIBUTES as readonly string[]).includes(x) ? x : 'physical';
}
const OFFER_KINDS = ['gold', 'captive', 'recruit', 'item', 'unknown', 'none'];
const OFFER_FALLBACK: Record<string, string> = { gold: 'good coin', captive: 'a captive to ransom', recruit: 'a recruit who joins you', item: 'salvage worth selling', unknown: 'unknown — who knows what waits', none: "nothing — they're begging" };
function normOffer(o: { kind?: string; label?: string } | undefined): OfferedReward {
  const kind = (OFFER_KINDS.includes(String(o?.kind)) ? String(o?.kind) : 'gold') as OfferKind;
  const label = (String(o?.label ?? '').trim().slice(0, 60)) || OFFER_FALLBACK[kind];
  return { kind, label };
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
      { eff: 'minimal', tok: Math.round(maxTokens * 1.6) },
    ];
    let lastErr = '';
    for (let a = 0; a < attempts.length; a++) {
      // backoff before retries: transient 429/5xx under load otherwise degrades the quest to a
      // bland mock-fallback card (seen in parallel playtest campaigns)
      if (a > 0) await new Promise((res) => setTimeout(res, 1500 * a));
      const { eff, tok } = attempts[a];
      const t0 = Date.now();
      try {
        // the API call must be INSIDE the try: a transient 429/5xx used to throw straight past the
        // retry loop to the mock fallback (seen as bland instruction-leak cards in parallel campaigns)
        const res = await this.client.chat.completions.create({
          model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          response_format: { type: 'json_object' }, max_completion_tokens: tok,
          ...( { reasoning_effort: eff } as Record<string, unknown> ),
        } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
        const ms = Date.now() - t0;
        const usage = res.usage;
        const raw = res.choices[0]?.message?.content ?? '';
        const cached = (usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })?.prompt_tokens_details?.cached_tokens ?? 0;
        this.log(`  ai[${kind}·${model}·${eff}${a ? ' RETRY' : ''}] ${(ms / 1000).toFixed(1)}s in=${usage?.prompt_tokens} (cached ${cached}) out=${usage?.completion_tokens}`);
        this.onCall?.({
          n: ++this.callCount, kind, model, effort: eff, ms, system, user, response: raw,
          promptTokens: usage?.prompt_tokens, completionTokens: usage?.completion_tokens,
          cachedTokens: cached,
        });
        return schema.parse(JSON.parse(raw));
      } catch (e) { lastErr = String(e).slice(0, 140); this.log(`  ai[${kind}] attempt ${a + 1} failed: ${lastErr}`); }
    }
    throw new Error(`AI ${kind} failed after retry: ${lastErr}`);
  }

  async cardAsk(i: CardAskInput): Promise<CardAskOut> {
    const system =
      `You write ONE mercenary job as it ARRIVES at the player. The player is the BOSS of a mercenary company, at their fort; they read this and decide whether to take it and which mercs to send. They are NOT in the field — NEVER narrate the company already doing the job (that happens later, once they're sent).\n` +
      `Output JSON only:\n` +
      `{ "situation": "the PLAYER-FACING intro (2-3 plain sentences). Build the scene from the ARRIVAL and THEME sparks below, WOVEN into real sentences — never quote or echo an instruction. Whoever brings it speaks ONE line of DIALOGUE stating the WORK plainly. A line about the pay may surface naturally in their words, but the exact reward goes in 'offeredReward' below. NO numbers ('good coin', not '40 gold'). The job MUST match the JOB TYPE below and be SPECIFIC to this place/people; invent it FRESH.",\n` +
      `  "offeredReward": { "kind": "the engine has ALREADY rolled the reward — its kind is given below as REWARD. Set kind to that SAME value, EXCEPT use 'unknown' if this is a genuine mystery job (a sealed shrine/unexplored ruin where the player shouldn't know the spoils yet).", "label": "PLAYER-FACING <=8 words naming the reward in the BRINGER'S OWN TERMS — what this particular client, in this trade and place, would actually offer (a fisher pays differently than a magistrate). NEVER a number." },\n` +
      `  "job": "one terse line for your own records (NOT shown to the player): the concrete task",\n` +
      `  "ask": { "attribute": "one of ${ATTRS} (what this job mainly tests)",\n` +
      `    "favoredTags": ["0-3 tag words from the vocabulary, bare (no prefix)"],\n` +
      `    "slots": ["one entry per mercenary the company can send (the count is given below), each EITHER \\"open\\" OR a single tag word the job plainly needs"] } }\n` +
      `JOB TYPE meanings: escort = guard someone/something on a journey; raid = hit a camp/holdout for spoils; hunt = track and bring back a person or beast; rescue = free captives; capture = take a named person alive; scout = find or map something; investigate = uncover a hidden thing; contract = a paid delivery or task.\n` +
      `${VOCAB_BLOCK}\n` +
      `ATTRIBUTE — pick the one the job's CORE test needs, matched to the JOB TYPE: raid→physical, a stealth/scout/hunt→agility or perception, an investigation→intelligence, a parley/escort-by-trust→charisma, an ambush-or-be-ambushed→perception.\n` +
      `WRITING: plain, concrete, readable-once words; ONE line of spoken DIALOGUE brings it alive (someone SAYS something). NO time of day as scene dressing on the arrival (no "at dusk a runner…" — the fort runs in days, not hours; a deadline INSIDE the job's fiction, like a tide window, is fine). NO flowery diction ("blisters the reedsea"), NO invented/obscure coinages — name things plainly. NEVER write numbers/coin amounts. NEVER mention these instructions or any field name (offeredReward, etc.) in the prose — the player only sees "situation". Give exactly one "slots" entry per mercenary. Prefer "open" slots. JSON only.`;
    const themeLine = i.theme ? `THEME SPARKS (fuse these into a SPECIFIC job — a spark to riff on, NOT a checklist; you need not name them): ${i.theme}\n` : '';
    const arrivalLine = i.arrival ? `ARRIVAL SPARK (a keyword or two for HOW it reaches you — weave it in naturally, do NOT quote): ${i.arrival}\n` : '';
    const rewardLine = i.rewardKind ? `REWARD the engine already rolled (write its label; set offeredReward.kind to this unless a mystery job): ${i.rewardKind}\n` : '';
    const quarryLine = i.quarryHint ? `THE PERSON the reward delivers (already rolled — if you name or describe the target/quarry, they MUST fit this): ${i.quarryHint}\n` : '';
    const user = `JOB TYPE: ${i.archetype}\n${rewardLine}${quarryLine}${themeLine}Location: ${i.location}\n${arrivalLine}Mercenaries the company can send: ${i.slotCount}\nJSON only.`;
    // one-offs are PLAYER-FACING prose → narrative tier (nano templated, leaked field names, garbled words)
    const out = await this.json('cardAsk', system, user, zCardAsk, this.narrativeModel, this.narrativeEffort, 1200);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    return { situation: out.situation, job: out.job, offeredReward: normOffer(out.offeredReward), ask };
  }

  async outcome(i: OutcomeInput): Promise<OutcomeOut> {
    // system prompt is BYTE-STABLE (STORY_ENGINE §10.2: cacheable prefix) — word budgets, the finale
    // note, and all per-call data live in the user message.
    const system =
      `You narrate the result of a mercenary job the company ALREADY ACCEPTED, then name any captive taken.\n` +
      `Given the JOB CARD, the PARTY sent (each merc + tags), the OUTCOME, any DELIVERED captive's tags, and WORD BUDGETS for each half.\n` +
      `Output JSON only:\n` +
      `{ "beforeRoll": "the BUILDUP to the roll, within its WORD BUDGET (a HARD ceiling — never exceed it). Set the scene and let the CHALLENGE materialise (the threat rises to meet them, the obstacle resists), and the merc(s) COMMIT. END ON THE BRINK — the held breath the instant before fate decides (blade raised, question asked, hand on the latch). Do NOT hint or state the result; stop right before it. This is the moment the player is gambling on.",\n` +
      `  "afterRoll": "the CONSEQUENCE that follows now the OUTCOME is set, within its WORD BUDGET (a HARD ceiling — never exceed it; nearer the lower number is fine). OPEN INSIDE THE ACTION — do NOT begin with 'The dice…' or by announcing the verdict/roll/luck (no 'the dice fall', 'fate decides', 'fortune favors'); start on what a merc DOES or what HAPPENS. EACH named merc gets their own distinct beat, true to their tags. Show what is won or lost. SUCCESS = clean; PARTIAL = it works but a cost lands (shown); FAILURE = the attempt fails and a consequence bites. If the user message marks this THE CLIMAX of a long saga, give it the weight of an ENDING — the payoff of everything built, the fate of its central person sealed; earn the length, do not pad.",\n` +
      `  "captive": { "name": "string", "who": "one line, fits the captive tags" } or null,\n` +
      `  "malus": { "kind": "the lasting COST the company takes — one of: none (a clean run, or a clean failure with no extra sting) | debt (you now OWE someone coin) | injury (a merc is hurt) | liability (evidence/a mess that follows you). SUCCESS and PARTIAL are almost always 'none'. On FAILURE, mostly 'none' or — for a risky job gone wrong — 'debt'. (Use injury/liability sparingly.)", "label": "<=10 words player-facing, naming WHO is owed / WHO is hurt (use the scene's own names). NEVER a number. '' when none." },\n` +
      `  "learned": "<=18 words: the ONE concrete truth the company comes away KNOWING this beat — a NAME, a face, a deed (never 'a hidden actor'). YOU decide it from the SUGGESTED truth + the OUTCOME: success = the suggested truth (or a sharper version); partial = only PART of it, hedged or learned at a cost; failure = \\"\\" (nothing concrete, or only a misleading scrap). Whatever you set here MUST also be shown being discovered in afterRoll.",\n` +
      `  "loot": "<=10 words: the side-loot actually carried off this beat — THINGS only (coin, papers, goods), never a person (people are not loot; captives are handled separately). flavour only — the game sets value. success = the suggested loot; partial = a lesser haul; failure = \\"\\"" }\n` +
      `OUTCOME MEANINGS: SUCCESS = clean, captive taken (if any), the truth and loot won. PARTIAL = won but at a COST you must SHOW (a wound / complication / only PART of the truth / lesser haul). FAILURE = captive NOT taken (captive=null), little or nothing learned; a consequence lands. The DICE have already decided the outcome — your job is to narrate it AND decide, scaled to it, what was learned and gained.\n` +
      `RULES: continue FROM the card (same people/place). Do NOT describe capturing/binding a prisoner unless DELIVERED CAPTIVE TAGS are given (if 'none', no captive is taken). NEVER write numbers.\n` +
      `WRITING — this is fiction the player reads (grimdark, low-medieval; match the job's register):\n` +
      `- SHOW, DON'T LABEL. NEVER filter through a faculty or adverb-label ("his scholar's eye found", "she said angrily", "with a soldier's instinct") — show the ACT, or give the LINE itself (if someone is furious, write the words: "How dare you.").\n` +
      `- USE DIALOGUE. Where a named merc or character is present, let them SPEAK — a spoken line carries character and fact better than description. Weave dialogue through tight action; don't narrate a feeling, voice it.\n` +
      `- BE CLEAR ABOUT THE RESULT. The reader must finish knowing EXACTLY what the company achieved or failed to achieve, and what they now hold or know — never vague or mood-only.\n` +
      `- Each named merc acts true to their tags. Concrete and sensory but plain; no purple abstractions (weight / shadow / fate). JSON only.`;
    const party = i.party.map((p) => ` ${p.name} [${p.tags.join(', ')}]`).join('\n');
    const user =
      (i.bible ? `HIDDEN BIBLE (context to GROUND the prose — the player never sees it; narrate ONLY who is actually present in this scene, do NOT bring in cast who aren't here):\n${i.bible}\n\n` : '') +
      (i.storySoFar ? `STORY SO FAR (what already happened — for continuity): ${i.storySoFar}\n\n` : '') +
      `JOB CARD:\n situation: ${i.situation}\n job: ${i.job}\nPARTY SENT:\n${party}\n` +
      `DELIVERED CAPTIVE TAGS: ${i.captiveTags ? '[' + i.captiveTags.join(', ') + ']' : 'none'}\n` +
      (i.approach ? `CHOSEN APPROACH: ${i.approach} — the afterRoll MUST read as this approach.\n` : '') +
      (i.midSaga ? `MID-SAGA BEAT: this is one beat of an ongoing story, NOT its end. Do NOT kill, capture, bind, defeat-for-good, or otherwise permanently remove ANY named person — the cast must survive and stay free for later beats. A FAILURE here is a SETBACK (they slip away, the trail goes cold, a wound, a worsening), never a death or capture. Take NO captive (captive=null).\n` : '') +
      (i.proposedReveal ? `SUGGESTED TRUTH (the beat set this up to surface — YOU decide how much actually lands given the OUTCOME): "${i.proposedReveal}"\n` : '') +
      (i.proposedLoot ? `SUGGESTED LOOT (what the beat could drop — scale to the OUTCOME): "${i.proposedLoot}"\n` : '') +
      `WORD BUDGETS (the upper number is a HARD ceiling — NEVER exceed it): beforeRoll ${i.beforeWords ?? '35-55'} words; afterRoll ${i.afterWords ?? '55-90'} words.\n` +
      (i.finale ? `THE CLIMAX: this resolves a long saga — write the ending it earned.\n` : '') +
      `RISKY: ${i.risky ? 'yes' : 'no — a failure here carries NO lasting cost (malus=none); do not write a demanded debt/penalty into the prose'}\nOUTCOME: ${i.outcome.toUpperCase()}\nJSON only.`;
    const out = await this.json('outcome', system, user, zOutcome, this.narrativeModel, this.narrativeEffort, 1600);
    const mk = ['none', 'debt', 'injury', 'liability'].includes(String(out.malus?.kind)) ? String(out.malus?.kind) as 'none' | 'debt' | 'injury' | 'liability' : 'none';
    return { beforeRoll: out.beforeRoll, afterRoll: out.afterRoll, captive: out.captive ?? null, malus: { kind: mk, label: String(out.malus?.label ?? '').slice(0, 60) }, learned: out.learned ?? null, loot: out.loot ?? null };
  }

  async flesh(i: FleshInput): Promise<FleshOut> {
    const system =
      `You give a freshly-acquired character a name and a face. Their TAGS and ATTRIBUTES are FIXED (already rolled) — you do NOT add, drop, or change tags; you write prose that FITS them.\n` +
      `Output JSON only:\n` +
      `{ "name": "low-medieval given+by-name (Germanic/Celtic/Slavic register)",\n` +
      `  "who": "one line — what they're KNOWN FOR where they live, written as a person ('mends nets and settles dock disputes before knives do'), NEVER a recital of the tags ('female lizardman priest, clever, cheerful' is WRONG)",\n` +
      `  "backstory": "<=45 words — where they came from + one concrete detail or wound, consistent with every tag",\n` +
      `  "quirks": ["1-2 short concrete habits"] }\n` +
      `RULES: every word consistent with the given tags (a cowardly one is never 'fearless'; a priest is not a thief). High attributes read as natural giftedness, not loot. Terse, concrete, grimdark. NEVER write numbers. JSON only.`;
    const attrs = ATTRIBUTES.map((a) => `${a} ${i.attrs[a]}`).join(', ');
    const names = i.nameSeeds?.length ? `\nNAME SEEDS (draw the name from these or riff on their sound): ${i.nameSeeds.join(', ')}` : '';
    const avoidN = i.avoidNames?.length ? `\nAVOID NAMES (already in this world — do NOT reuse): ${i.avoidNames.join(', ')}` : '';
    const user = `TAGS: ${i.tags.join(', ')}\nATTRIBUTES: ${attrs}\nACQUIRED AS: ${i.context}.${names}${avoidN}\nJSON only.`;
    // flesh is NARRATIVE-tier (deviates from the guide's nano flavorCaptive): the backstory +
    // quirks are read in the dossier and are attachment-critical, so they get the stronger model.
    const out = await this.json('flesh', system, user, zFlesh, this.narrativeModel, this.narrativeEffort, 1400);
    return { ...out, quirks: (out.quirks ?? []).slice(0, 2) };
  }

  async genesis(i: GenesisInput): Promise<GenesisOut> {
    const eb = i.expectedBeats ?? 4;
    // system prompt is BYTE-STABLE (STORY_ENGINE §10.2: cacheable prefix) — step count, twist flag,
    // cast size, choice cap, and returning-faces cap all arrive in the user message.
    const system =
      `You design a QUEST CHAIN — a SEQUENCE of linked jobs a mercenary company takes one at a time — and the believable truth behind it. The player RUNS the company and picks jobs off a JOB BOARD at their fort; the jobs of THIS chain appear there one after another. Your bible is what makes that sequence COHERENT: one story told across several jobs. NOT prose; the settled facts a writers' room works from, told straight.\n` +
      `You are given the CORE PERSON the chain centers on (their tags / known life), a few THEME words, a SETTING, a TONE, the region, and the engine's settings for this chain (step count, twist or straight, cast size, choice cap, returning-faces cap).\n\n` +
      `BUILD A QUEST CHAIN THE COMPANY WOULD TAKE:\n` +
      `- THE HOOK — how the company gets drawn in and WHY a PROFIT-DRIVEN mercenary boss would take the FIRST job. The company's GAIN must be PLAIN: pay/a bounty, a captive worth ransoming, a recruit worth bringing in, salvage, a threat to their trade removed. Someone hires them, posts a bounty, or the core person comes to the fort and offers terms. A bare emotional plea ('save my child') is NOT enough on its own — attach what the company gets.\n` +
      `- THE DRIVE — what pulls the company in and gives the chain its throughline. It may be a CONCRETE objective (rescue Alen, recover the locket) OR an OPEN-ENDED pursuit (explore the drowned temple, find out what's killing the herds) where the end is DISCOVERED through play — the company need not know the final outcome up front. Don't force a fixed end-goal where the fun is the unknown.\n` +
      `- EACH JOB HAS ITS OWN CLEAR GOAL; the CHAIN coheres. THIS is the hard requirement: every individual job in the sequence must give the player a concrete, plain task for THAT job (what to do, why, the payoff) — even when the overall end is open. Each follows from the last so the chain reads as one escalating story — not a single quest, not a vague mood piece, not unrelated errands.\n` +
      `- DRAMA SERVES THE QUEST. The cast's wants are OBSTACLES, allies, costs, and turns ALONG the goal — not a static web of strangers the player merely watches. The player is a PARTICIPANT, never a spectator.\n\n` +
      `TWIST OR STRAIGHT — the user message says which (engine-chosen):\n` +
      `- TWIST: the job is a MISDIRECTION. "goal" = the APPARENT job the player commits to; "twistReveal" = how the truth subverts it — it must be FAIR (findable) and CHANGE what the right thing to do is. It lands in a MIDDLE arc step, NEVER the first. "situation" = the real truth.\n` +
      `- STRAIGHT: NO misdirection — the job is honestly what it appears; the interest comes from the obstacles and the people. Set "twistReveal" to "".\n` +
      `PLAN THE ARC — output "arc": a ROUGH ordered guide of the step count given (a skeleton, NOT a rigid script). EACH STEP — the first included — is ONE COMPLETE, QUEST-WORTHY MISSION the player sends mercs on: a self-contained job that can succeed or fail and comes away with a result, never a fragment or a vague phase. Merely meeting, accepting, being briefed, or 'getting directions' is NOT a mission — that is how a job ARRIVES (it belongs in the scene AROUND a mission, never as a step of its own). A mission is the company's real attempt out in the world, its outcome in doubt — spanning setting out, the deed, and the result, the way 'rob the bank' spans the approach, the break-in, and the getaway. So step 1 is already a real job (go after the thing, search the place, confront someone), with the client's offer folded into its scene. Middle steps escalate the obstacle; the last step is the finale that brings it to a head. Do NOT resolve the chain before the last step. Each step is a short phrase.\n` +
      `PEOPLE — keep them LEAN: each is ONE vivid line (who they are + the one thing that matters here), a "want", and a "role" in the quest (client / companion / quarry / obstacle / ally / prize). NO backstory ladders — deep history is written later, only for whoever the company actually keeps. Cast size: as given in the user message; every person has a distinct stake.\n` +
      `NAMES — draw your characters' names from the NAME SEEDS below (or riff on their SOUND for fresh ones). NO NEW character may take a name from AVOID NAMES — those belong to people who already exist (existing world characters you cast keep their exact names; never coin a NEW person who shares a first name with any of them).\n` +
      `CHOICES — "choiceSteps": which arc steps give the company a real branching choice. The engine allows AT MOST the cap given in the user message. Suggest step numbers (1-based, from YOUR arc); you MAY include the LAST step (the finale) if its ending should branch; NEVER the first job; [] if none genuinely fits (a straight, linear chain is fine). (The actual choice options — mid-job approaches, or the finale's endings — are written later by the quest-writer with full context, not here.)\n` +
      `BELIEVABILITY: every present fact traces to a prior cause in history; ordinary human motives, not plot necessity; no coincidence-stacking; nobody acts dumb to keep the situation alive.\n` +
      `COMMIT TO THE TRUTH: this bible IS the settled, complete truth. If a killing/theft/betrayal/disappearance happened, state plainly WHO did it and WHY. BANNED in the hidden layer: "unknown", "remains hidden", "it is unclear", "a mysterious figure", "the truth of X is never revealed" — you the author already know, so write it down.\n` +
      `THE CORE PERSON + THEMES make the quest specific. Their tags — craft, magic, profession, temperament — must be CENTRAL to what the quest is about (a water-singer's job turns on water and song; a going-blind carver's on the carving). The THEMES are a spark to FUSE, not a checklist (weave them in; you need not name them). Match the TONE you're given — not every saga is grim. Keep it ONE clear situation, small enough to care about.\n\n` +
      `Output JSON only:\n` +
      `{ "title": "short, concrete, names a real thing/person/place — NOT a poetic two-noun phrase like 'Oar and Scar', NOT 'The Weight of X'",\n` +
      `  "leadBlurb": "1-2 sentences the PLAYER reads on the job board — a CLEAR job a mercenary would take: who/what it concerns, what the company is wanted FOR, and — explicitly — the COMPANY'S GAIN (coin / a captive to ransom / a recruit worth keeping / salvage). Plain and inviting, not cryptic; never a payoff-free plea. Hide the deep secret, not the job or the gain.",\n` +
      `  "goal": "one line: the DRIVE / throughline — concrete OR open-ended (e.g. 'escort Alen to the abbey alive', 'find out what is drowning the herds', 'explore the sunken temple and bring back what is worth taking').",\n` +
      `  "twistReveal": "TWIST chains: how the truth SUBVERTS the apparent goal (the player must NOT see this; it surfaces across beats and lands at a middle step). STRAIGHT chains: empty \\"\\".",\n` +
      `  "arc": ["short step phrases, one per step — each a complete mission (see PLAN THE ARC), last = goal achieved at the finale"],\n` +
      `  "choiceSteps": [step numbers from your arc that branch, within the cap — MAY include the last (finale); never step 1; [] if none],\n` +
      `  "cast": [ { "name": "...", "who": "one vivid line — who they are + the one thing that matters here", "want": "plain want now", "role": "client / companion / quarry / obstacle / ally / prize" } ],\n` +
      `  "situation": "2-4 sentences — the believable truth behind the job, told straight (for a twist quest this is the REAL situation the player will uncover)",\n` +
      `  "tensions": ["what stands in the way and what's at stake: <A> wants <X>; <B> wants <Y>; because <reason> — obstacles ALONG the goal, not a standalone argument"],\n` +
      `  "directions": [ { "kind": "active", "hook": "the next concrete step toward the goal the company can take" }, { "kind": "ambient", "hook": "something pressing on the goal that unfolds with or without them" } ] }\n` +
      `The FIRST cast entry MUST be the core person. Include AT LEAST ONE 'active' and ONE 'ambient' direction.\n` +
      `RECURRING CAST — the user message says how many returning faces this saga may use (possibly none). Cast AT MOST that many of the EXISTING WORLD CHARACTERS listed there as SECONDARY people (NEVER the core person), by their exact name + known surface; the history you write is new canon consistent with what's known. One marked as a COMPANY MERCENARY works FOR the player — they may appear as a companion or witness, never as the client, the payer, or the quarry (the company does not pay itself). Only where one genuinely fits — never crowd the bible. Coin fresh names for everyone else.\n` +
      `BANNED PURPLE WORDS: weight, shadow, burden, fate, destiny. Clinical voice (state what IS). JSON only.`;
    const rewardIdea = i.coreKind
      ? `\nReward (just an IDEA of where the saga LANDS, NOT its premise — build a real story; do NOT reduce the whole chain to 'capture/recruit them' or title it that bluntly): by the end this person becomes the company's ${i.rarity ?? 'uncommon'} ${i.coreKind} (${i.coreKind === 'captive' ? 'taken and held or ransomed' : 'won over to join the company'}).`
      : '';
    const core = i.personal
      ? `CORE PERSON: the existing mercenary ${i.name ?? ''} — known as "${i.who ?? ''}"; ${i.backstory ?? ''}. Tags: [${i.focalTags[0]?.join(', ')}]. Build THEIR own buried past as NEW canon consistent with the above. Keep their name. They SERVE the company: they may bring the matter to the boss, but they are never the client or payer (the company does not pay itself) — the company's gain comes from the world (a bounty, salvage, an interested party's coin, a threat removed).`
      : `Focal unit: ${i.name ?? '(name them)'} (${i.focalTags[0]?.join(', ')}). The saga centers on this person — keep the given name, though you MAY tweak it slightly (add a surname or by-name).${rewardIdea}`;
    const avoid = i.avoid?.length
      ? `\nMake this DISTINCT from recent sagas: ${i.avoid.map((a) => `"${a}"`).join('; ')}.`
      : '';
    const seed = i.seed ? `\nTHEMES (fuse these into the core person's life — a spark, not a checklist; you need not name them): ${i.seed}` : '';
    const place = i.place ? `\nSETTING (stage the saga here): ${i.place}` : '';
    const tone = i.tone ? `\nTONE (the register for this quest): ${i.tone}` : '';
    const pool = (i.poolCast?.length && (i.poolCastMax ?? 1) > 0)
      ? `\nEXISTING WORLD CHARACTERS (cast AT MOST ${i.poolCastMax ?? 1} as SECONDARY people — never the core person):\n${i.poolCast.map((p) => `  - ${p.name} — ${p.who} [${p.tags.join(', ')}]`).join('\n')}`
      : '';
    const names = i.nameSeeds?.length ? `\nNAME SEEDS (draw fresh names from these or riff on their sound): ${i.nameSeeds.join(', ')}` : '';
    const avoidNames = i.avoidNames?.length ? `\nAVOID NAMES (used in recent sagas — do NOT reuse): ${i.avoidNames.join(', ')}` : '';
    const castSize: Record<string, string> = { common: '2', uncommon: '2-3', rare: '3-4', legendary: '4-5' };
    const settings = `\nENGINE SETTINGS FOR THIS CHAIN: arc steps ~${eb} · ${i.twist ? 'TWIST' : 'STRAIGHT'} · cast ${castSize[i.rarity ?? 'uncommon']} people · choice cap ${i.maxChoices ?? 1} · returning faces allowed: ${i.poolCastMax ?? 0}`;
    const user = `${core}\nREGION: ${i.region}${place}${tone}${seed}${settings}${names}${avoidNames}${pool}${avoid}\nJSON only.`;
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
    const choiceSteps = (out.choiceSteps ?? []).map((n) => Math.round(Number(n))).filter((n) => Number.isFinite(n) && n >= 1);
    return { title: out.title, leadBlurb: out.leadBlurb, goal: out.goal ?? '', arc: out.arc ?? [], twistReveal, choiceSteps, cast, situation: out.situation, tensions: out.tensions ?? [], directions };
  }

  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    const system =
      `You are the quest-writer for a grimdark mercenary-fort game. The player is the BOSS of a mercenary company at their fort: each turn, jobs and word reach their desk and they decide which mercs to send. A hidden BIBLE holds the settled truth + the GOAL the company is working toward across this run of linked jobs. The player NEVER sees the bible. Write the NEXT job as it REACHES THE BOSS — a concrete step they can send mercs on that visibly moves toward the goal — revealing the buried truth only a LITTLE at a time. The boss is NOT in the field; you write what comes to them, not them already doing it.\n` +
      `Given: the BIBLE (hidden truth + named cast), the STORY SO FAR (what's happened / what the player already knows), and the JOB INSTRUCTION (what this job is and whether you may end the story).\n` +
      `Output JSON only:\n` +
      `{ "situation": "the player's ONLY text for this job (2-4 plain sentences). The player is the BOSS at their fort deciding whether to send mercs on this step — so write WHAT REACHES THEM THIS TURN: the petitioner/job arriving (the opener), OR one of your own mercs / a runner bringing word of the next step, OR a development pressing in. Use a line of DIALOGUE where someone speaks. What the company would DO must be PLAIN from the scene and the speaker's ask — but convey it NATURALLY; do NOT tack on a meta 'If you send men, they will…' clause. Keep the company's GAIN in view — these are mercenaries working for profit (coin, salvage, the recruit/captive this saga is chasing); the opener especially makes plain what's in it for them, never a payoff-free plea. Do NOT narrate the company already out in the field doing it (that happens AFTER you send them). READABILITY: clean plain sentences read once and understood — NOT fragment-stacks ('Mud. A man. A knife.'), NOT run-ons, NO flowery diction ('blisters the reedsea'), NO invented/obscure coinages — name things plainly. ORIENT a person ONCE on first appearance (natural apposition, not parens); a name in the ALREADY-MET list uses their BARE name.",\n` +
      `  "job": "one terse line for your own records (NOT shown to the player): the concrete task this step (escort / recover / confront / investigate a specific thing)",\n` +
      `  "offeredReward": { "kind": "one of: gold | captive | recruit | item | unknown | none — what THIS job actually pays. The kind MUST name the HEADLINE of your label: a purse/coin/pay = gold; a thing = item; 'unknown' ONLY when the spoils genuinely can't be known yet. captive/recruit ONLY when THIS job itself delivers that person (typically the saga's close — a middle step that merely chases them pays gold/item).", "label": "PLAYER-FACING <=8 words naming it plainly, in the SPEAKER'S OWN TERMS (what this client/scene actually puts on the table). NEVER a number." },\n` +
      `  "ask": { "attribute": "${ATTRS}", "favoredTags": ["0-3 bare tag words"], "slots": ["one entry per mercenary the company can send (the count is given below): open OR a single tag word this job plainly needs"] },\n` +
      `  "proposedReward": "<=12 words — the tangible LOOT this job plausibly drops (a purse, a strongbox's coin, a salvaged tool); the GAME sets its value. NOT the run's payoff — that is decided at the end.",\n` +
      `  "immediateReward": true/false — TRUE only if THIS job physically hands the company spoils RIGHT NOW (they raid/loot/seize/crack open something with coin or goods inside); FALSE for meet/scout/travel/talk/escort/negotiate jobs that only make progress. Most jobs are FALSE. (The engine still banks a share toward the payoff regardless.)\n` +
      `  "newLayerRevealed": "<=18 words — the ONE CONCRETE fact the player learns on success: a NAME, a face, a specific deed (never 'a hidden actor' / 'a second figure' — name them or show the concrete symptom)",\n` +
      `  "choices": OPTIONAL — include ONLY when the JOB INSTRUCTION asks for them. Two cases: (a) a MID-job choice = 2-3 distinct APPROACHES (slip past vs fight through vs talk your way in), each { "label": "<=6 words", "attribute": one of [${ATTRS}] it tests, "favored": [0-2 bare tag words] }, testing DIFFERENT attributes; (b) a FINALE ending choice = 2-3 story-logical ways to RESOLVE the core person/prize given how this finale actually unfolded, each ALSO with a "kind": recruit (they join you) / captive (you hold them) / gold (hand off / sell / turn in for coin). Omit entirely otherwise. }\n` +
      `${VOCAB_BLOCK}\n` +
      `FOLLOW THE JOB INSTRUCTION below — it tells you this job's place in the story (opener, middle step, or the finale).\n` +
      `CRAFT (this is character drama, not a logistics audit):\n` +
      `- PUT THE CAST ON-STAGE. The story is about the bible's PEOPLE. Bring a NAMED cast member into the scene — coming to the fort, pressing the matter, or carried in your mercs' report — never run the whole story through a faceless clerk/contract while the real characters stay off-screen.\n` +
      `- SERVE THIS BIBLE'S OWN STORY. The jobs exist to bring THIS bible's specific hook (its curse / feud / vow / heresy / secret) to life — NOT a generic crime procedural (investigate-a-ledger → shelter-a-witness → force-a-confession → public-trial) that would fit any saga. Whatever makes THIS story unique must be live and pressing in the scene.\n` +
      `- A DIFFERENT SCENE EACH TIME. The STORY SO FAR lists what already happened — do NOT reopen on the same scene, object, place, or arrival you used before; change WHO is on stage, WHERE it happens, and the ACTION. The JOB INSTRUCTION gives you an opening to use (the engine varies it for you) — just don't reuse the previous one. NEVER make two jobs both about fetching the SAME object.\n` +
      `- CONCRETE SYMPTOMS, NOT CAUSES. Show the symptom (a wound, a scorched door, a fled witness), never the hidden cause's name. Reveal one small concrete layer.\n` +
      `- CONTINUITY. Follow believably from the STORY SO FAR — react to what the company just did. Don't reset to a fresh unrelated job.\n` +
      `ATTRIBUTE — pick the one this job's core test needs and VARY it across the chain (physical=force/toughness, agility=speed/stealth, intelligence=lore/cunning, charisma=people, perception=awareness/intuition: spot an ambush, read a lie, track, sense danger).\n` +
      `The ASK fits the MUNDANE SURFACE, not the hidden truth. Prefer "open" slots. State the job plainly; keep the WHY hidden. Vivid but concrete; NEVER write numbers. JSON only.`;
    const met = i.introduced?.length ? `\nALREADY MET (use bare names, do NOT re-tag who they are): ${i.introduced.join(', ')}` : '';
    const user = `HIDDEN BIBLE:\n${i.bible}\n\nSTORY SO FAR (what already happened — react to it, don't repeat it): ${i.chainState}${met}\nREGION: ${i.region}\nMERCENARIES THE COMPANY CAN SEND: ${i.slotCount}\nJOB INSTRUCTION: ${i.beatConstraint}\nJSON only.`;
    const out = await this.json('chainBeat', system, user, zChainBeat, this.narrativeModel, this.narrativeEffort, 1800);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    const ATTR_OK = ['physical', 'agility', 'intelligence', 'charisma', 'perception'];
    const KIND_OK = ['recruit', 'captive', 'gold'];
    const choices = (out.choices ?? []).filter((c) => c.label).map((c) => ({
      label: String(c.label ?? '').slice(0, 64),
      attribute: ATTR_OK.includes(String(c.attribute)) ? String(c.attribute) : 'physical',
      favored: canonicalTags(c.favored ?? []),
      ...(c.kind && KIND_OK.includes(String(c.kind)) ? { kind: String(c.kind) as 'recruit' | 'captive' | 'gold' } : {}),
    })).slice(0, 3);
    return { ...out, ask, offeredReward: normOffer(out.offeredReward), closesChain: out.closesChain === true || out.closesChain === 'true', immediateReward: out.immediateReward === true || out.immediateReward === 'true', choices: choices.length >= 2 ? choices : undefined };
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
