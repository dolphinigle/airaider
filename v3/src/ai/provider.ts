// The AI layer boundary — STORY_ENGINE/PROMPTS. The engine sets numbers/constraints;
// the AI fills fiction. The AI NEVER emits a number (sole exemption: the per-edge
// importance score 0–1, §14). Names are handed IN, never invented (§4b).
// 3-producer discipline (GAME_STATE §2): creative outputs are persisted by the caller;
// picker outputs (the selector) are discarded after use.

import type { z } from 'zod';
import type { SagaTemplate } from './prompts/saga/render.js';

export interface AskSlotOut {
  attribute: string;             // primary tested attribute (engine validates)
  extraAttribute?: string | null; // optional 2nd (multi-stat)
  favored: string[];             // favored skill/tag words (engine canonicalizes)
  clashing: string[];
  requirementTag?: string | null; // must-have <tag> (rare; AI-authored, engine-guarded)
  mustBeFocal?: boolean;          // personal sagas: this slot is THEIR story — pin the focal merc
}

// ---- ① the one-off quest writer (sagas are the v4 storyteller's: ⑥ below) ------------------------

export interface QuestWriteInput {
  kind: 'one-off';
  archetype?: string;
  location: string;              // "Western Forests — old-growth elven woods; Thornhollow at their heart"
  level: number;
  rarity?: string;
  slotCount: number;
  rewardEnvelope: string;        // "a captive and coin" — the engine's kind list, no numbers
  /** HOW this job gets done this time — one word, combined with KEYWORDS by the writer */
  method?: string;
  /** a concrete obstacle the card can SHOW: who stands in the way and what they do about it */
  obstacle?: string;
  /** nobody brought this in — the company goes looking of its own accord */
  selfDirected?: boolean;
  /** a scouting run (lead-hunt): the light card is written as going where people talk to hear of work */
  scouting?: boolean;
  /** a hire (the recruiting post's faucet): the light card presents someone worth paying */
  hiring?: boolean;
  /** what KIND OF TURN this story takes — orthogonal to the archetype and the keywords */
  shape?: string;
  keywords?: string[];           // §5 sampler (1 BOND + 1 TIE + 1-2 WILDCARDS)
  opening?: { spark: string };   // arrival SPARK, time folded in ("a friar, a plea — at dusk"): a standalone time field taught cards to open "At dusk, ...".
                                 // The landmark gate is enforced by OMISSION: a card that may not name the
                                 // landmark simply never sees it in `location` (a shown token gets used).
  intake?: string;               // engine-rolled FACT of how word reached the company (quarryTags
                                 // pattern — the POV-lock otherwise makes "a messenger arrives" the model's
                                 // only epistemic device; ~92% of cards opened on one)
  gravity?: string;              // engine-rolled weight of the matter ("a small, everyday job" … "a grave affair")
  rewardItems?: string[];        // the pre-rolled prize objects — fiction naming the prize must use these
  placeNameSuggestions?: string[]; // engine-rolled fresh place names (variety fuel)
  framedCharacter?: { name: string; tags: string; pronoun?: string; dossier?: string; lastSeen?: string; partial?: boolean } | null;  // the person to frame (pronoun explicit; lastSeen = a returning person's story so far; partial = identity only — the writer SHAPES them via quarryTags, §4 pattern-B)
  avoid?: string[];              // recent card titles+jobs — do not re-deal the same premise
}

export interface QuestWriteOut {
  title: string;
  situation: string;             // POV-locked card prose
  job: string;                   // the job stated plainly
  ask: AskSlotOut[];             // one per slot (engine already fixed the count)
  quarryTags?: string[];         // §4 pattern-B: ≤3 vocab words shaping a partial framedCharacter (AI = type; engine = tier)
}

// ---- ③ batched resolution ------------------------------------------------------------------

export interface ResolveQuestInput {
  questId: string;
  title: string; situation: string; job: string;
  rarity: string;
  gravity?: string;              // drives the word budget (2026-08-26): everyday jobs get a
                                 // SHORT report, grave affairs keep the room a prior A/B showed
                                 // they need (long 5.8 vs short 5.2)
  outcome: 'success' | 'partial' | 'failure';
  party: { id: string; name: string; tags: string; dossier?: string }[];  // dossier only when it adds lines beyond the blurb
  sceneFacet?: string;           // engine-rolled facet the before-text opens on (§2 seed —
                                 // 'crouched' terrain openers owned 22 of ~30 reports)
  deliveredSummary: string;      // engine-computed delivery, named for the AI to narrate
  partialCost?: string;          // engine-rolled: what a PARTIAL costs (a wound only sometimes — QUESTS §105)
  earnedLead?: string;           // the work an earned lead turns out to be (pre-minted), so the report can name it
  deliveredCharacters: { id: string; name: string; tags: string }[]; // to flesh (who/backstory)
  fixNotes?: string[];               // cold-reader gate: defects found in the rejected previous report
  sceneMode?: 'physical' | 'wits' | 'social';   // beat variant: how this job turns (engine-dealt)
}

export interface ResolveQuestOut {
  questId: string;
  before: string;                // blind lead-in (must not leak the outcome)
  turn?: string;                 // beat variant: ONE present-tense clause, the decisive act
  turnActor?: string;            // beat variant: given name of the party member who does it
  speech?: { who: string; says: string }[];  // beat variant: 0-2 spoken lines
  after: string;                 // sighted consequence
  injuries: { characterId: string; band: 'none' | 'low' | 'med' | 'high'; cause?: string | null }[];
  fleshed: { characterId: string; who: string; backstory: string; quirks: string[] }[];
  edges: { from: string; to: string; type: string; blurb: string; importance: number }[];
}

// ---- ③b flesh (batched; who/backstory/quirks for characters that lack them) -------------------

export interface FleshInput {
  characterId: string;
  name: string;              // engine-rolled — use as-is (§4b)
  tags: string;              // rendered tag line
  role: string;              // merc / captive / hireling
  context: string;           // how they came to the fort ("founding member", "won at the finale of <saga>")
  /** set when this person came out of a QUEST — the fallback flesh path otherwise knows only a
   *  four-string `context` and can do nothing but invent an origin. Mirrors `saga` below, which
   *  was added for exactly this reason on the genesis-focal path (2026-08-27) */
  quest?: {
    title: string;
    situation: string;       // the card the player read when they took the job
    job: string;             // the errand as the board stated it
  };
  saga?: {                   // set when this person is a saga's focal: backstory must FIT this story
    title: string;
    kernel: string;          // what the saga turned on: its answer once the finale is played, else its question
    situation: string;       // where the story stands now (its last chronicle line)
    want: string | null;     // what the plan says they want
  };
  avoidQuirks?: string[];    // habits living characters already own — same tic on 4 people reads
                             // as a copy-paste world
}
export interface FleshOut {
  characterId: string;
  who: string;               // one line they'd be known by
  backstory: string;         // 2 sentences
  quirks: string[];          // 1-2 concrete physical habits
}

// ---- ④ theme roll (ONCE per renovation) ------------------------------------------------------

export interface ThemeRollInput {
  roomType: string; roomName: string;
  style: string | null;
  hintWords: string[];           // the type's default hints
  vocabulary: string[];          // legal want-words (engine-enforced)
}
export interface ThemeRollOut { wants: string[]; flavorLine: string }

// ---- ⑤ selector (nano; output DISCARDED after use) -------------------------------------------

export interface SelectorInput {
  purpose: string;
  candidates: { id: string; name: string; blurb: string; relationPhrase: string }[];
  max: number;
}

// ---- the provider ----------------------------------------------------------------------------

export interface AiUsage {
  calls: number; inputTokens: number; outputTokens: number;
  costUsd: number;               // what the session was BILLED (0 on the claude playtest transport — the subscription pays)
  listCostUsd?: number;          // claude transport only: what it would have cost at API list price (information)
}

// ---- ⑥ the v4 saga storyteller (docs/STORYTELLER.md; Phase 2 Step 3) ---------------------------

/** ONE template-keyed call for every saga text (plan · outline · card · report). The engine builds the payload and the
 *  template flags (src/ai/storyteller.ts); the provider renders the template, sends the payload verbatim as the user
 *  message and returns the schema-parsed JSON. The player's direction rides in the payload (§2.8.5), never in the
 *  system prompt, so a saga system prompt is byte-stable per flag set */
export interface SagaCall {
  template: SagaTemplate; flags: string[]; vars: Record<string, number>;
  payload: Record<string, unknown>;
  /** which model tier: the plan call is the hardest (PLAN), everything the player reads is the WRITER's */
  tier: 'plan' | 'writer'; effort: 'low' | 'medium';
  schema: z.ZodTypeAny;
  /** the floor's reply: the mock answers with it; the caller falls back to it. Never sent */
  floor: () => unknown;
}

/** one record per AI call — the GUI's ai-log tab and the debugging trail */
export interface AiCallRecord {
  n: number;                 // call ordinal
  purpose: string;           // writeQuest / resolve / flesh / themeRoll / select / plan / outline / card / report
  template?: string;         // a saga call: its template (plan / outline / card / report)
  flags?: string[];          // a saga call: the template flags it rendered with
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
  listCostUsd?: number;      // claude transport: the API list price of a call the subscription paid for (costUsd 0)
  ok: boolean;
  error?: string;
  systemPreview: string;     // first part of the system prompt
  userPrompt: string;        // the full user message (the variable data)
  output?: string;           // the raw model response (recorded even when schema validation fails)
}

/** THE PLAYER'S CAMPAIGN DIRECTION (Settings; designer 2026-09-30: "a free text that they can tell the
 *  AI for the story theme etc … 'Dark fantasy' or 'Generate males for npcs'"). The free text is read ONCE
 *  (interpretDirection) into writer guidance + engine knobs: the guidance is appended to the writer
 *  prompts; npcSex / recruitSex steer the ENGINE's identity rolls (the engine owns who exists). */
export interface TraitPrefs { prefer: string[]; avoid: string[] }   // tag concept ids (engine vocabulary)
export interface CampaignDirection {
  text: string;                                   // what the player typed
  guidance: string;                               // 1-2 plain sentences for the writer (tone, setting, content)
  npc: TraitPrefs;                                // strangers: clients, cast, captives
  recruit: TraitPrefs;                            // people who join the company
  avoid: string[];                                // story content the player does not want
}
export type DirectionRead = Omit<CampaignDirection, 'text'>;

export interface AiProvider {
  readonly name: string;
  /** how many calls this provider actually runs at once, when it caps them below the game's own
   *  limits (the claude transport's CLI pool — card writes and the reckoning share it); absent = no cap */
  readonly concurrency?: number;
  /** read the player's free-text direction into guidance + knobs (one cheap call) */
  interpretDirection?(text: string, vocab: Record<string, string[]>): Promise<DirectionRead>;
  /** the direction every writer call follows from now on (null = none) */
  setDirection?(d: CampaignDirection | null): void;
  writeQuest(input: QuestWriteInput): Promise<QuestWriteOut>;
  /** ONE batched call (parallel inside). `onEach` fires as each quest's call settles — the
   *  reckoning is read WHILE it is written, so a finished report never waits on a slow one */
  resolve(inputs: ResolveQuestInput[], onEach?: (out: ResolveQuestOut) => void): Promise<ResolveQuestOut[]>;
  flesh(inputs: FleshInput[]): Promise<FleshOut[]>;                  // ONE batched call
  themeRoll(input: ThemeRollInput): Promise<ThemeRollOut>;
  select(input: SelectorInput): Promise<string[]>;
  /** the v4 saga storyteller's one call: schema-parsed JSON; throws on a transport failure (after the one retry) */
  sagaCall(c: SagaCall): Promise<unknown>;
  usage(): AiUsage;
  callLog(): AiCallRecord[];
}
