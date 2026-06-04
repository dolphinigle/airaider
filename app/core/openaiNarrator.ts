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
const zGenesis = z.object({ title: z.string(), hook: z.string(), bible: z.string(), direction: z.string(), climax: z.string() });
const zChainBeat = z.object({ situation: z.string(), job: z.string(), ask: zAsk, proposedReward: z.string(), newLayerRevealed: z.string() });
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
  private model: string;
  private log: (s: string) => void;
  private onCall?: (rec: AICallRecord) => void;
  private callCount = 0;

  constructor(opts: NarratorOptions) {
    this.client = new OpenAI({ apiKey: opts.apiKey ?? (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined), dangerouslyAllowBrowser: opts.browser });
    this.model = opts.model ?? 'gpt-5-mini';
    this.log = opts.log ?? (() => {});
    this.onCall = opts.onCall;
  }

  private async json<T>(kind: string, system: string, user: string, schema: z.ZodType<T>, effort: 'minimal' | 'low' = 'low', maxTokens = 2000): Promise<T> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      max_completion_tokens: maxTokens,
      // reasoning_effort is a gpt-5 param the SDK types may not surface yet
      ...( { reasoning_effort: effort } as Record<string, unknown> ),
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
    const usage = res.usage;
    const cached = (usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })?.prompt_tokens_details?.cached_tokens ?? 0;
    const raw = res.choices[0]?.message?.content ?? '';
    this.log(`  ai[${kind}] in=${usage?.prompt_tokens} (cached ${cached}) out=${usage?.completion_tokens}`);
    this.onCall?.({
      n: ++this.callCount, kind, model: this.model, system, user, response: raw,
      promptTokens: usage?.prompt_tokens, completionTokens: usage?.completion_tokens, cachedTokens: cached,
    });
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`); }
    return schema.parse(parsed);
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
      `RULES: terse, plain, concrete. State the job so the player knows exactly what taking it commits them to. NEVER write numbers. slots length must equal the SLOT COUNT given. Prefer "open" slots. JSON only.`;
    const user = `Archetype: ${i.archetype}\nLocation: ${i.location}\nSlot count: ${i.slotCount}\nThe job results in ${i.rewardSeed}.\nWrite the card + ask. JSON only.`;
    const out = await this.json('cardAsk', system, user, zCardAsk, 'low', 1200);
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
      `RULES: continue FROM the card (same people/place). Read each merc's tags and act them. Terse, concrete, low-medieval. NEVER write numbers. JSON only.`;
    const party = i.party.map((p) => ` ${p.name} [${p.tags.join(', ')}]`).join('\n');
    const user =
      `JOB CARD:\n situation: ${i.situation}\n job: ${i.job}\nPARTY SENT:\n${party}\n` +
      `DELIVERED CAPTIVE TAGS: ${i.captiveTags ? '[' + i.captiveTags.join(', ') + ']' : 'none'}\n` +
      `RISKY: ${i.risky ? 'yes' : 'no'}\nOUTCOME: ${i.outcome.toUpperCase()}\nNarrate, continuing from the card. JSON only.`;
    const out = await this.json('outcome', system, user, zOutcome, 'low', 1600);
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
    const out = await this.json('flesh', system, user, zFlesh, 'low', 1400);
    return { ...out, quirks: (out.quirks ?? []).slice(0, 2) };
  }

  async genesis(i: GenesisInput): Promise<GenesisOut> {
    const system =
      `You author the HIDDEN BIBLE (settled truth the player never sees) for a multi-quest story in a grimdark mercenary-fort game, built AROUND the given focal character(s).\n` +
      `Output JSON only:\n` +
      `{ "title": "<=6 words, evocative",\n` +
      `  "hook": "<=20 words — the board-facing teaser (player-safe, no spoilers)",\n` +
      `  "bible": "<=90 words — the settled truth: who the focal figure really is, the why-ladder, the buried cause. Clinical voice (state what IS). Invent supporting cast freely",\n` +
      `  "direction": "<=18 words — the vague climax the arc builds toward",\n` +
      `  "climax": "<=18 words — the intended final confrontation" }\n` +
      `RULES: the focal character's TAGS are the story seed — honor them. Mystery lives in the CAUSE, never the task. Terse, concrete. NEVER write numbers. JSON only.`;
    const focals = i.focalTags.map((t, n) => `Focal ${n + 1}: [${t.join(', ')}]`).join('\n');
    const user = `${focals}\nSPARK: ${i.spark}\nREGION: ${i.region}\nAuthor the bible. JSON only.`;
    return this.json('genesis', system, user, zGenesis, 'low', 2200);
  }

  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    const system =
      `You write the NEXT quest card in a HIDDEN story for a grimdark mercenary-fort game.\n` +
      `Given the hidden BIBLE (player NEVER sees it) and the CHAIN STATE (what the player already knows). This beat surfaces AT MOST ONE new layer of the truth.\n` +
      `Output JSON only:\n` +
      `{ "situation": "<=45 words — what arrives at the gate; POV-LOCKED to what the company can see/hear; reference what they already learned",\n` +
      `  "job": "one line — the concrete action this beat commits to",\n` +
      `  "ask": { "attribute": "${ATTRS}", "favoredTags": ["0-3 bare tag words"], "slots": ["one per slot: open OR a tag word"] },\n` +
      `  "proposedReward": "<=12 words — the loot this beat plausibly yields; the GAME sets its value",\n` +
      `  "newLayerRevealed": "<=15 words — the ONE new fact the player learns on success (writers-room note)" }\n` +
      `${VOCAB_BLOCK}\n` +
      `KEY RULE: the ASK and proposedReward must fit the MUNDANE SURFACE the player perceives, NOT the hidden truth. Prefer "open" slots. Only newLayerRevealed may touch the buried truth.\n` +
      `RULES: state the JOB plainly; keep the WHY hidden. Terse, concrete. NEVER write numbers. JSON only.`;
    const user = `HIDDEN BIBLE: ${i.bible}\nCHAIN STATE: ${i.chainState}\nREGION: ${i.region}\nSLOT COUNT: ${i.slotCount}\n${i.beatConstraint}. JSON only.`;
    const out = await this.json('chainBeat', system, user, zChainBeat, 'low', 1600);
    const ask = normAsk(out.ask);
    while (ask.slots.length < i.slotCount) ask.slots.push({ kind: 'open' });
    ask.slots.length = i.slotCount;
    return { ...out, ask };
  }

  async conceptTags(i: ConceptTagsInput): Promise<ConceptTagsOut> {
    const system =
      `You invent a character for a grimdark mercenary-fort world and choose their concept tags. Tags are a FIXED vocabulary — choose ONLY from it; never invent, shorten, or alter.\n` +
      `Output JSON only: { "name": "low-medieval name", "who": "one line", "tags": ["chosen bare words"] }\n` +
      `${VOCAB_BLOCK}\n` +
      `RULES: background is the character's PROFESSION/ORIGIN, not their current state (being captured is a role, not a tag). Always set a gender. Choose the few tags that DEFINE the concept (a brutal reaver = cruel/scarred, never kind); the engine adds the rest. JSON only.`;
    const out = await this.json('conceptTags', system, `CONCEPT: ${i.concept}\nJSON only.`, zConcept, 'minimal', 900);
    return { name: out.name, who: out.who, tags: canonicalTags(out.tags ?? []) };
  }
}
