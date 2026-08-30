// The AI layer boundary — STORY_ENGINE/PROMPTS. The engine sets numbers/constraints;
// the AI fills fiction. The AI NEVER emits a number (sole exemption: the per-edge
// importance score 0–1, §14). Names are handed IN, never invented (§4b).
// 3-producer discipline (GAME_STATE §2): creative outputs are persisted by the caller;
// picker outputs (the selector) are discarded after use.

export interface AskSlotOut {
  attribute: string;             // primary tested attribute (engine validates)
  extraAttribute?: string | null; // optional 2nd (multi-stat)
  favored: string[];             // favored skill/tag words (engine canonicalizes)
  clashing: string[];
  requirementTag?: string | null; // must-have <tag> (rare; AI-authored, engine-guarded)
  mustBeFocal?: boolean;          // personal sagas: this slot is THEIR story — pin the focal merc
}

// ---- ① one-off quest dress / chain-beat quest-writer -----------------------------------

export interface QuestWriteInput {
  kind: 'one-off' | 'beat' | 'finale';
  archetype?: string;            // one-offs only — beats serve the bible's story instead
  location: string;              // "Western Forests — old-growth elven woods; Thornhollow at their heart"
  level: number;
  rarity?: string;               // one-offs only — on a saga beat its sole stated job was
                                 // "permission to run long", and the budget is fixed now
  slotCount: number;
  rewardEnvelope: string;        // "a captive and coin" — the engine's kind list, no numbers
  stake?: string;                // beat 1 only (R1 sell-the-stake): what the WHOLE matter is rumored to be worth to the company — paste-clean, rumor-toned, no numbers
  // ── beat 1's own dealt facts (prosebench/ROUND2_3 — the questions cards lose) ──
  stakeIfLost?: string;          // what the client says BREAKS if the saga fails: beat 1's WHY
  arrival?: string;              // two atoms: how this reached the fort, and the client's manner
  /** HOW this job gets done this time — one word, combined with KEYWORDS by the writer */
  method?: string;
  knownObstacle?: string;        // what the client openly knows stands against them — never a name
  tell?: string;                 // one physical habit the client has while talking: the CARE MOMENT
  noClient?: boolean;            // this saga has no outside client — nobody hired the company
  keywords?: string[];           // one-offs: §5 sampler (1 BOND + 1 TIE + 1-2 WILDCARDS)
  opening?: { spark: string };   // one-offs only — arrival SPARK, time folded in ("a friar, a plea — at dusk"): a standalone time field taught cards to open "At dusk, ...".
                                 // Beats get NO spark: a random spark fought the saga (a cart from nowhere).
                                 // The landmark gate is enforced by OMISSION: a card that may not name the
                                 // landmark simply never sees it in `location` (a shown token gets used).
  intake?: string;               // one-offs: engine-rolled FACT of how word reached the company (quarryTags
                                 // pattern — the POV-lock otherwise makes "a messenger arrives" the model's
                                 // only epistemic device; ~92% of cards opened on one)
  gravity?: string;              // one-offs: engine-rolled weight of the matter ("a small, everyday job" … "a grave affair")
  rewardItems?: string[];        // one-offs: the pre-rolled prize objects — fiction naming the prize must use these
  placeNameSuggestions?: string[]; // engine-rolled fresh place names (variety fuel)
  rosterNames?: string[];        // the player's own soldiers — NEVER card NPCs
  rosterPronouns?: Record<string, string>;  // name → she/he/they (separate map: inline "(she)" got copied into prose)
  lastBeatOutcome?: string;      // beats: what the previous beat's resolution changed
  lastStepFailed?: boolean;      // beats: previous step FAILED — its planned yield was never won
  // chain context (beat/finale)
  bible?: unknown;               // the Bible object (hidden truth)
  storyState?: unknown;          // chain story-so-far
  // two-part lore prompting (LORE.md): the selector already picked who gets full dossiers;
  // the writer receives the world's relevant memory around this saga
  relevantLore?: { id: string; name: string; blurb: string; relationPhrase?: string; companySoldier?: boolean; companyCaptive?: boolean; atTheFort?: boolean; outOfReach?: boolean; dossier?: string }[];
  focalDossier?: string;         // what the world currently remembers of the focal (evolves each cycle)
  fixNotes?: string[];           // cold-reader gate: defects found in the rejected previous draft
  beatIndex?: number; expectedBeats?: number;
  arcStep?: string;              // the ONE arc step this card covers, dealt verbatim (models
                                 // fumbled indexing arc[beat-1] themselves — beat 1 cards scoped
                                 // to the whole GOAL and later beats had to retcon)
  focalName?: string;
  focalIsMerc?: boolean;         // personal saga: the focal is one of the player's own soldiers
  framedCharacter?: { name: string; tags: string; pronoun?: string; dossier?: string; lastSeen?: string; partial?: boolean } | null;  // one-offs: the person to frame (pronoun explicit; lastSeen = a returning person's story so far; partial = identity only — the writer SHAPES them via quarryTags, §4 pattern-B)
  avoid?: string[];              // one-offs: recent card titles+jobs — do not re-deal the same premise
}

export interface QuestWriteOut {
  title: string;
  situation: string;             // POV-locked card prose
  job: string;                   // the job stated plainly
  ask: AskSlotOut[];             // one per slot (engine already fixed the count)
  quarryTags?: string[];         // §4 pattern-B: ≤3 vocab words shaping a partial framedCharacter (AI = type; engine = tier)
  approaches?: { label: string; rewardKind: string; attribute: string; favored: string[] }[]; // finale mutex groups
}

// ---- ② genesis (bible + write-back folded in — ONE call) ---------------------------------

export interface GenesisInput {
  seed: string;                  // the Polti-anchored what-if spark
  keywords: string[];
  location: string;              // the land's name + anchor facts, one field
  rarity: string; stakes: 'low' | 'mid' | 'high';
  tone: string;                  // engine-picked, weighted toward lighter (BIBLE tone knob)
  avoid?: string[];              // recent saga titles+kernels — steer away from repeats; omitted when none
  focal: { id: string; name: string; tags: string; dossier?: string; isExistingMerc: boolean };  // dossier only when it adds lines beyond the blurb
  kind: string;                  // likely fate (recruit/captive/gold-hoard)
  twist: boolean;                // engine-rolled 30%
  expectedBeats: number;         // the arc must have exactly this many steps (chain shape is engine-rolled)
  slate?: { id: string; name: string; blurb: string; relationPhrase: string; companySoldier?: boolean; companyCaptive?: boolean; atTheFort?: boolean; outOfReach?: boolean; dossier?: string }[];  // omitted when empty
  assignedNames: string[];       // pre-rolled names for any NEW cast the AI coins (§4b)
}

export interface GenesisOut {
  title: string;
  kernel: string;
  cast: { name: string; trade?: string; who: string; want: string; role: string; loreId?: string }[];
  situation: string;
  goal: string;
  stakeIfLost?: string;
  arc: string[];
  twistReveal: string | null;
  tensions: string[];
  openDirections: string[];
  // write-back (persisted, guarded)
  relevantIds: string[];
  newPlaces: { name: string; blurb: string }[];
  newEdges: { from: string; to: string; type: string; blurb: string; importance: number }[];
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
  deliveredCharacters: { id: string; name: string; tags: string }[]; // to flesh (who/backstory)
  chainContext?: {
    bible: unknown; storyState: unknown; isFinale: boolean;
    arcStep?: string;                // the ONE arc step this job covers — the report may not
                                     // complete later steps (resolutions overreached even when
                                     // the card was scoped)
    stepsNotYet?: string[];          // the plan's LATER steps, dealt as a concrete ban list —
                                     // their work/prizes/targets may not land in this report
                                     // (the abstract rule alone kept failing at low effort)
    focalName?: string;              // the saga's central person, named explicitly
    fate?: string;                   // finale: what becomes of them — a plain SENTENCE, never a token
    approach?: string;               // finale: the plan the player CHOSE (a contract)
    rejectedApproaches?: string[];   // finale: the plans NOT taken (their actions may not appear)
  };
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
  storyUpdate?: { currentSituation: string; newlyRevealed: string[]; openThreads: string[]; sagaSettled?: boolean };
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
  saga?: {                   // set when this person is a chain's focal: backstory must FIT this story
    title: string;
    kernel: string;          // the one-line collision the saga is built on
    situation: string;       // where the story stands now
    want: string | null;     // what the bible says they want
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

export interface AiUsage { calls: number; inputTokens: number; outputTokens: number; costUsd: number }

/** one record per AI call — the GUI's ai-log tab and the debugging trail */
export interface AiCallRecord {
  n: number;                 // call ordinal
  purpose: string;           // writeQuest / genesis / resolve / flesh / themeRoll / select
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
  ok: boolean;
  error?: string;
  systemPreview: string;     // first part of the system prompt
  userPrompt: string;        // the full user message (the variable data)
  output?: string;           // the raw model response (recorded even when schema validation fails)
}

export interface AiProvider {
  readonly name: string;
  writeQuest(input: QuestWriteInput): Promise<QuestWriteOut>;
  genesis(input: GenesisInput): Promise<GenesisOut>;
  /** ONE batched call (parallel inside). `onEach` fires as each quest's call settles — the
   *  reckoning is read WHILE it is written, so a finished report never waits on a slow one */
  resolve(inputs: ResolveQuestInput[], onEach?: (out: ResolveQuestOut) => void): Promise<ResolveQuestOut[]>;
  flesh(inputs: FleshInput[]): Promise<FleshOut[]>;                  // ONE batched call
  themeRoll(input: ThemeRollInput): Promise<ThemeRollOut>;
  select(input: SelectorInput): Promise<string[]>;
  /** cold-reader gate: a zero-context read of one player-facing text — the defects it returns
   *  feed ONE guided rewrite (the judge-loop plateau traced to ~1-2 unparseable/ungrounded
   *  sentences per chain, each capping a chain's readability) */
  review(input: ReviewInput): Promise<ReviewOut>;
  usage(): AiUsage;
  callLog(): AiCallRecord[];
}

export interface ReviewInput {
  text: string;                          // the player-facing text to cold-read
  whereabouts?: Record<string, string>;  // authoritative object/person locations (contradiction check)
  known?: string[];                      // names/facts the player has already met
}
export interface ReviewOut { ok: boolean; defects: string[] }
