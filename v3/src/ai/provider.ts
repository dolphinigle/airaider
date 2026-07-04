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
  requirementTag?: string | null; // must-have <tag> (rare)
}

// ---- ① one-off quest dress / chain-beat quest-writer -----------------------------------

export interface QuestWriteInput {
  kind: 'one-off' | 'beat' | 'finale';
  archetype: string;
  region: string; regionSeed: string;
  level: number; rarity: string;
  slotCount: number;
  rewardEnvelope: string;        // "a captive and coin" — the engine's kind list, no numbers
  keywords: string[];            // §5 sampler: 1 BOND + 1 TIE + 2 WILDCARDS
  placeNameSuggestions?: string[]; // engine-rolled fresh place names (variety fuel)
  rosterNames?: string[];        // the player's own soldiers — NEVER card NPCs
  lastBeatOutcome?: string;      // beats: what the previous beat's resolution changed
  // chain context (beat/finale)
  bible?: unknown;               // the Bible object (hidden truth)
  storyState?: unknown;          // chain story-so-far
  beatIndex?: number; expectedBeats?: number;
  focalName?: string;
  framedCharacter?: { name: string; tags: string } | null;  // one-offs: the rolled captive to frame
}

export interface QuestWriteOut {
  title: string;
  situation: string;             // POV-locked card prose
  job: string;                   // the job stated plainly
  ask: AskSlotOut[];             // one per slot (engine already fixed the count)
  proposedRewardKind?: string;   // AI proposes, engine validates & grants (F6)
  closesChain?: boolean;         // beat: AI judges climax (engine's gate still rules)
  approaches?: { label: string; rewardKind: string; attribute: string; favored: string[] }[]; // finale mutex groups
}

// ---- ② genesis (bible + write-back folded in — ONE call) ---------------------------------

export interface GenesisInput {
  seed: string;                  // the Polti-anchored what-if spark
  keywords: string[];
  region: string; regionSeed: string;
  rarity: string; stakes: 'low' | 'mid' | 'high';
  focal: { name: string; tags: string; dossier: string; isExistingMerc: boolean };
  kind: string;                  // likely fate (recruit/captive/gold-hoard)
  twist: boolean;                // engine-rolled 30%
  slate: { id: string; name: string; blurb: string; relationPhrase: string; dossier?: string }[];
  assignedNames: string[];       // pre-rolled names for any NEW cast the AI coins (§4b)
}

export interface GenesisOut {
  title: string;
  kernel: string;
  cast: { name: string; who: string; want: string; role: string; loreId?: string }[];
  situation: string;
  goal: string;
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
  rarity: string;                // drives the word budget
  outcome: 'success' | 'partial' | 'failure';
  party: { id: string; name: string; tags: string; dossier: string }[];
  deliveredSummary: string;      // engine-computed delivery, named for the AI to narrate
  deliveredCharacters: { id: string; name: string; tags: string }[]; // to flesh (who/backstory)
  chainContext?: { bible: unknown; storyState: unknown; isFinale: boolean; fate?: string };
}

export interface ResolveQuestOut {
  questId: string;
  before: string;                // blind lead-in (must not leak the outcome)
  after: string;                 // sighted consequence
  injuries: { characterId: string; band: 'none' | 'low' | 'med' | 'high' }[];
  fleshed: { characterId: string; who: string; backstory: string; quirks: string[] }[];
  edges: { from: string; to: string; type: string; blurb: string; importance: number }[];
  storyUpdate?: { currentSituation: string; newlyRevealed: string[]; openThreads: string[] };
}

// ---- ③b flesh (batched; who/backstory/quirks for characters that lack them) -------------------

export interface FleshInput {
  characterId: string;
  name: string;              // engine-rolled — use as-is (§4b)
  tags: string;              // rendered tag line
  role: string;              // merc / captive / hireling
  context: string;           // how they came to the fort ("founding member", "rescued from X")
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

export interface AiProvider {
  readonly name: string;
  writeQuest(input: QuestWriteInput): Promise<QuestWriteOut>;
  genesis(input: GenesisInput): Promise<GenesisOut>;
  resolve(inputs: ResolveQuestInput[]): Promise<ResolveQuestOut[]>;  // ONE batched call (parallel inside)
  flesh(inputs: FleshInput[]): Promise<FleshOut[]>;                  // ONE batched call
  themeRoll(input: ThemeRollInput): Promise<ThemeRollOut>;
  select(input: SelectorInput): Promise<string[]>;
  usage(): AiUsage;
}
