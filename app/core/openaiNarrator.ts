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
});
const zFlesh = z.object({ name: z.string(), who: z.string(), backstory: z.string(), quirks: z.array(z.string()).default([]) });
const zPerson = z.object({
  name: z.string(), who: z.string().default(''),
  history: z.array(z.string()).default([]),
  wants: z.string().default(''), feels: z.string().default(''),
  conceals: z.union([z.string(), z.boolean(), z.null()]).optional(),
  roleInStory: z.string().optional(), role: z.string().optional(),
});
const zGenesis = z.object({
  title: z.string(),
  leadBlurb: z.string(),
  // accept either flat persons or {person, roleInStory} nesting
  cast: z.array(z.union([zPerson, z.object({ person: zPerson, roleInStory: z.string().optional() })])).default([]),
  situation: z.string(),
  tensions: z.array(z.string()).default([]),
  directions: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).default([]),
  openDirections: z.array(z.union([z.object({ kind: z.string().optional(), hook: z.string() }), z.string()])).optional(),
});
const zChainBeat = z.object({ situation: z.string(), job: z.string(), ask: zAsk, proposedReward: z.string(), newLayerRevealed: z.string(), closesChain: z.union([z.boolean(), z.string(), z.null()]).optional() });
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
      `{ "beforeRoll": "<=35 words: this party arrives at this job and sets to it; do NOT hint the result",\n` +
      `  "afterRoll": "<=60 words: what happened, per the OUTCOME. EACH named merc gets their own beat, true to their tags",\n` +
      `  "captive": { "name": "string", "who": "one line, fits the captive tags" } or null,\n` +
      `  "punishment": "<=12 words: only if OUTCOME=FAILURE and the job was RISKY — the consequence that lands; else null" }\n` +
      `OUTCOME MEANINGS: SUCCESS = clean, captive taken. PARTIAL = taken but at a COST you must SHOW (a wound / complication / lesser haul). FAILURE = captive NOT taken (captive=null); a consequence lands.\n` +
      `RULES: continue FROM the card (same people/place). Read each merc's tags and act them. Do NOT describe capturing/binding a prisoner unless DELIVERED CAPTIVE TAGS are given (if 'none', no captive is taken). Terse, concrete, low-medieval. NEVER write numbers. JSON only.`;
    const party = i.party.map((p) => ` ${p.name} [${p.tags.join(', ')}]`).join('\n');
    const user =
      `JOB CARD:\n situation: ${i.situation}\n job: ${i.job}\nPARTY SENT:\n${party}\n` +
      `DELIVERED CAPTIVE TAGS: ${i.captiveTags ? '[' + i.captiveTags.join(', ') + ']' : 'none'}\n` +
      (i.approach ? `CHOSEN APPROACH: ${i.approach} — the afterRoll MUST read as this approach.\n` : '') +
      (i.midSaga ? `MID-SAGA BEAT: this is one beat of an ongoing story, NOT its end. Do NOT kill, capture, bind, defeat-for-good, or otherwise permanently remove ANY named person — the cast must survive and stay free for later beats. A FAILURE here is a SETBACK (they slip away, the trail goes cold, a wound, a worsening), never a death or capture. Take NO captive (captive=null).\n` : '') +
      `RISKY: ${i.risky ? 'yes' : 'no'}\nOUTCOME: ${i.outcome.toUpperCase()}\nNarrate, continuing from the card. JSON only.`;
    const out = await this.json('outcome', system, user, zOutcome, this.narrativeModel, this.narrativeEffort, 1600);
    return { beforeRoll: out.beforeRoll, afterRoll: out.afterRoll, captive: out.captive ?? null, punishment: out.punishment ?? null };
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
      common: 'cast 2 people; the core person gets a ~3-4 link why-ladder; the other is a single-bullet edge.',
      uncommon: 'cast 2-3 people; 1-2 deep (~4-6 link why-ladder), the rest single-bullet edges.',
      rare: 'cast 3-5 people; 2-3 deep (~6-8 link why-ladders), each with a distinct stake.',
      legendary: 'cast 4-6 people; 3-4 deep (~7-9 link why-ladders tracing to formative/childhood bedrock).',
    };
    const system =
      `You build the believable hidden TRUTH of a story — the reference a writers' room works from. NOT prose, NOT a mystery: what is ACTUALLY true, told straight. Mystery is added later by someone else who chooses what to reveal; your job is only to make the truth BELIEVABLE.\n` +
      `You are given the CORE PERSON the story centers on (their tags / known life) and the region.\n\n` +
      `BUILD EACH PERSON BY ASKING "WHY?" TO BEDROCK: start from a present fact and ask "why?" again and again to something irreducible — a love, loss, vow, debt, shame. Each answer is ONE history bullet, in order (e.g. "she avoids the harbour → a man drowned there → she untied the wrong line → she let them blame a boy"). \n` +
      `SECRETS ARE NOT A FIELD: a person conceals something ONLY when a FEELING makes hiding natural (shame, guilt, fear). If history+feeling yields concealment, set "conceals"; else omit it. MOST people conceal NOTHING.\n` +
      `Ladder DEEP only for the core person (and 1 other the story turns on); edge cast stay shallow.\n` +
      `BELIEVABILITY: every present fact traces to a prior cause in history; ordinary human motives, not plot necessity; no coincidence-stacking; nobody acts dumb to keep the situation alive.\n` +
      `COMMIT TO THE TRUTH: this bible IS the settled, complete truth. If a killing/theft/betrayal/disappearance happened, state plainly WHO did it and WHY. BANNED in the hidden layer: "unknown", "remains hidden", "it is unclear", "a mysterious figure", "the truth of X is never revealed" — you the author already know, so write it down.\n` +
      `DERIVE EVERYTHING from the core person's tags: what would a person like THIS hide, want, be hunted for? Do NOT reach for a generic plot.\n` +
      `PREMISE VARIETY — this matters. This model overuses two stock plots: (a) a person with a MONSTROUS SECRET (a curse / shapeshifting) who KILLED someone and STAGED it as an animal attack, with a protector covering the tracks; (b) COMMERCIAL-LEDGER fraud — a barge/shipment, a creditor, a corrupt magistrate, a public reckoning. If the tags pull you toward EITHER, stop and find a different premise. The buried truth can be ANY human story: a doomed or forbidden love, a blood-feud or vendetta, an inheritance or debt, a political maneuver, a heresy or crisis of faith, a haunting, a war crime in someone's past, a guild or family rivalry, a fraud, a kidnapping, an addiction, a buried kinship — choose what THESE tags most specifically suggest, and don't repeat the genre of the recent sagas listed below.\n` +
      `NOT EVERY SAGA NEEDS A DEATH. Many of the strongest stories have no corpse at all and no killing the focal is blamed for — a theft, a deception, a rescue, a debt repaid in flesh, a love, a rivalry, a secret birth, an impersonation, a sabotage to PREVENT harm. Reach for a death ONLY if the tags genuinely demand it; default AWAY from "someone died and the focal is implicated".\n` +
      `VARY THE MILIEU. The world is a salt-fen borderland, but it is NOT only docks, barges, cargo, creditors, magistrates and the Watchhouse. OVERUSED INCITING INCIDENTS — do NOT default to any of these: a sunk/lost/missing barge or cargo; a burned, lost, or falsified LEDGER; a magistrate's INQUIRY into negligence or property; a creditor seizing goods; an eviction over papers. The same fens hold peat-cutters and eel-fishers, reed-weavers and bog-iron smelters, a fen-shrine or hedge-chapel, drowned ruins, a smugglers' run, a dry-ground manor or garrison, pilgrims, a leper-house, herders and trappers — and human troubles that have NOTHING to do with trade: a marriage, a birth, a feud, a faith, a debt of honor, a haunting, a healing, a betrayal between kin. Place THIS saga in a specific milieu that fits the cast, and don't reuse the milieu of the recent sagas listed below.\n\n` +
      `Output JSON only:\n` +
      `{ "title": "short, concrete, names a real thing/person/place — NOT a poetic two-noun phrase like 'Oar and Scar', NOT 'The Weight of X'",\n` +
      `  "leadBlurb": "1-2 sentences the PLAYER sees on the job board before meeting anyone — reads like a MUNDANE CONTRACT, reveals NONE of the hidden truth (a body, an unpaid debt, a missing barge — never the cast's secret names)",\n` +
      `  "cast": [ { "name": "...", "who": "one line: what the world already knows of them", "history": ["the why-ladder, ordered cause→cause→bedrock"], "wants": "plain human want", "feels": "the feeling about their history", "conceals": "OPTIONAL: only if a feeling makes hiding natural", "role": "their role in the story" } ],\n` +
      `  "situation": "2-4 sentences — the believable present truth, told straight (the hidden ground truth, NOT the blurb)",\n` +
      `  "tensions": ["<Name A> wants <concrete X>; <Name B> wants <concrete Y>; because <plain reason they can't both have it>"],\n` +
      `  "directions": [ { "kind": "active", "hook": "a contract/plea the company is invited into — a selectable quest seed framed toward the fort" }, { "kind": "ambient", "hook": "something that unfolds with or without the company" } ] }\n` +
      `The FIRST cast entry MUST be the core person. ${depth[i.rarity ?? 'uncommon']} Include AT LEAST ONE 'active' and ONE 'ambient' direction.\n` +
      `STORY SEED — if a PREMISE is given below, build THIS saga around it: it is the ENGINE of the story, more than the person's tags. ADAPT its specifics to the rolled core person (their tags, profession, kind of life) so it feels inevitable for THEM, not stapled on — change roles, gender, trade, and surface so the premise and the person become one thing. The central drama need NOT be a secret the focal is hiding — let the premise put the drama where it belongs (a relationship, a choice, an outside force, another character). If a SETTING is given, stage the saga THERE.\n` +
      `RECURRING CAST — if EXISTING WORLD CHARACTERS are listed below, you MAY cast AT MOST ONE (rarely two) as a SECONDARY person (NEVER the core person), referencing them by their exact name + known surface; the history you write about them is new canon consistent with what's known. A returning face makes the world feel lived-in — but only where one genuinely fits the story; do NOT crowd the bible with familiar faces, and MANY sagas should use NONE and introduce fresh strangers. Coin fresh names for everyone else.\n` +
      `BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny. Clinical voice (state what IS). JSON only.`;
    const core = i.personal
      ? `CORE PERSON: the existing mercenary ${i.name ?? ''} — known as "${i.who ?? ''}"; ${i.backstory ?? ''}. Tags: [${i.focalTags[0]?.join(', ')}]. Build THEIR own buried past as NEW canon consistent with the above. Keep their name.`
      : `CORE PERSON tags: [${i.focalTags[0]?.join(', ')}]. Invent and NAME them; the story centers on them.`;
    const avoid = i.avoid?.length
      ? `\nMake this DISTINCT from recent sagas: ${i.avoid.map((a) => `"${a}"`).join('; ')} — a different secret, crime, and fantasy.`
      : '';
    const seed = i.seed ? `\nPREMISE (build the saga around this; adapt its specifics to the core person): "${i.seed}"` : '';
    const place = i.place ? `\nSETTING (stage the saga here): ${i.place}` : '';
    const pool = i.poolCast?.length
      ? `\nEXISTING WORLD CHARACTERS (you MAY cast one or two as SECONDARY people — never the core person):\n${i.poolCast.map((p) => `  - ${p.name} — ${p.who} [${p.tags.join(', ')}]`).join('\n')}`
      : '';
    const user = `${core}\nREGION: ${i.region}${place}${seed}${pool}${avoid}\nBuild the bible. JSON only.`;
    const out = await this.json('genesis', system, user, zGenesis, this.narrativeModel, this.narrativeEffort, 4000);
    // flatten {person,roleInStory} → BiblePerson; coerce conceals
    const cast = (out.cast ?? []).map((c) => {
      const p = ('person' in c ? { ...c.person, role: c.roleInStory ?? c.person.role } : c) as Record<string, unknown>;
      return {
        name: String(p.name ?? 'Unknown'), who: String(p.who ?? ''),
        history: Array.isArray(p.history) ? p.history.map(String) : [],
        wants: String(p.wants ?? ''), feels: String(p.feels ?? ''),
        conceals: typeof p.conceals === 'string' && p.conceals ? p.conceals : undefined,
        role: p.role ? String(p.role) : undefined,
      };
    });
    const dirsRaw = (out.directions?.length ? out.directions : out.openDirections) ?? [];
    const directions = dirsRaw.map((d) => typeof d === 'string'
      ? { kind: 'active' as const, hook: d }
      : { kind: (d.kind === 'ambient' ? 'ambient' : 'active') as 'ambient' | 'active', hook: d.hook });
    return { title: out.title, leadBlurb: out.leadBlurb, cast, situation: out.situation, tensions: out.tensions ?? [], directions };
  }

  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    const system =
      `You are the quest-writer for a grimdark mercenary-fort game. A hidden BIBLE holds the complete settled truth of a story — its CAST are real people with wants that collide. The player NEVER sees the bible. Write the NEXT quest the company is offered, revealing the buried truth only a LITTLE at a time, through what the company can see and do.\n` +
      `Given: the BIBLE (hidden truth + named cast), the CHAIN STATE (what's happened / what the player already knows), and the beat instruction.\n` +
      `Output JSON only:\n` +
      `{ "situation": "<=55 words the PLAYER reads — what the company ENCOUNTERS on this beat (someone/something arriving, OR what they find in the field — per the BEAT INSTRUCTION's opening). POV-LOCKED: only what the company can see/hear or already learned. READABILITY MATTERS: write 2-4 CLEAN, plain sentences a player reads once and understands — NOT telegraphic fragment-stacking ('Grey morning. Mud. A man.') and NOT comma-splice run-ons. Weave the time of day into a real sentence, don't stack it as a fragment. ORIENT THE PLAYER: the FIRST time you name anyone the player hasn't met, attach a 2-4 word tag of who they are to them ('his neighbour Lysa', 'a bailiff named Toft') — never a bare name the player cannot place. Concrete sensory detail, but clarity first.",\n` +
      `  "job": "one plain line — exactly what taking this job commits the company to DO (escort / recover / guard / confront / investigate a specific thing)",\n` +
      `  "ask": { "attribute": "${ATTRS}", "favoredTags": ["0-3 bare tag words"], "slots": ["one per slot: open OR a tag word"] },\n` +
      `  "proposedReward": "<=12 words — the loot this beat plausibly yields; the GAME sets its value",\n` +
      `  "newLayerRevealed": "<=18 words — the ONE CONCRETE fact the player learns on success: a NAME, a face, a specific deed (never 'a hidden actor' / 'a second figure' — name them or show the concrete symptom)",\n` +
      `  "closesChain": true/false — does THIS beat resolve the whole arc? Set true ONLY if the BEAT INSTRUCTION permits closing AND the story has genuinely reached its climax; otherwise false }\n` +
      `${VOCAB_BLOCK}\n` +
      `FOLLOW THE BEAT INSTRUCTION below — it tells you this beat's job in the arc and whether you may close it.\n` +
      `CRAFT (this is character drama, not a logistics audit):\n` +
      `- PUT THE CAST ON-STAGE. The chain is about the bible's PEOPLE. Bring a NAMED cast member into this beat in the flesh; never run the whole story through a faceless clerk/contract while the real characters stay off-screen.\n` +
      `- SERVE THIS BIBLE'S OWN STORY. The beats exist to bring THIS bible's specific hook (its curse / feud / vow / heresy / secret) to life — NOT to run a generic crime procedural (investigate-a-ledger → shelter-a-witness → force-a-confession → public-trial) that would fit any saga. Whatever makes THIS story unique must be live and pressing in the scene.\n` +
      `- VARY THE BEAT. Each beat does something DIFFERENT: meet/warm-to → get closer → a danger → wants collide → a turn or betrayal → reveal. CHAIN STATE lists what already happened — do NOT reopen on the same scene, object, place, or cast-member entrance you used before. Change WHO is on stage (don't open two beats running on the same person unless this beat truly centers on them), WHERE it happens, and the ACTION. NEVER make two beats both about fetching/recovering/securing the SAME object — a saga is not five attempts to grab one item.\n` +
      `- VARY THE ARRIVAL — this is critical. NOT every beat is "a person staggers to the gate at dusk". The thing that reaches the company can be: a rumor, summons, letter or writ delivered; a creditor, rival or official; a frightened child; a named cast member in person; OR the company already deployed on the prior thread encountering something in the field. Rotate the time of day. If a previous beat opened with someone arriving at the gate, open THIS one differently. BANNED CLICHÉ: never open on (or end on) a wrapped bundle / sodden parcel / shrouded corpse left at the gate.\n` +
      `- CONCRETE SYMPTOMS, NOT CAUSES. Show the symptom (a wound, a scorched door, a fled witness), never the hidden cause's name. The hidden CAUSE stays buried; reveal one small concrete layer.\n` +
      `- CONTINUITY. Follow believably from CHAIN STATE — react to what the company just did and what's now in motion. Don't reset to a fresh unrelated job.\n` +
      `ATTRIBUTE — pick the one this beat's core test needs and VARY it (physical=force, agility=speed/stealth, intelligence=lore/cunning, charisma=people, willpower=nerve). Most beats are NOT willpower.\n` +
      `The ASK fits the MUNDANE SURFACE, not the hidden truth. Prefer "open" slots. State the job plainly; keep the WHY hidden. Vivid but concrete; NEVER write numbers. JSON only.`;
    const user = `HIDDEN BIBLE:\n${i.bible}\n\nCHAIN STATE (what already happened — react to it, don't repeat it): ${i.chainState}\nREGION: ${i.region}\nSLOT COUNT: ${i.slotCount}\nBEAT INSTRUCTION: ${i.beatConstraint}\nJSON only.`;
    const out = await this.json('chainBeat', system, user, zChainBeat, this.narrativeModel, this.narrativeEffort, 1800);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    return { ...out, ask, closesChain: out.closesChain === true || out.closesChain === 'true' };
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
