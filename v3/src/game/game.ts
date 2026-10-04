// The Game facade — GAME_STATE.md. One state object, one action surface, consumed
// identically by the CLI and the web GUI. Cycle: Fort phase (actions) → endCycle()
// (resolution in quest-id order → lore write-backs AFTER all resolutions → healing/
// decay/staging → lead grants/expiry).

import { Rng, type RngState } from '../engine/rng.js';
import {
  type Card, type Location, HELD, cardType, stackKind, isLiability, freshId, seedIdCounter,
  idCounter, mintStackable, sameStack,
} from '../engine/cards.js';
import { T, renderTags, parseAiTag, CONCEPT, CONCEPTS, GROUPS, validateTags, type Attribute, hasTag, bandWindow, type TagInstance } from '../engine/tags.js';
import {
  newFort, ROOM_TYPE, ROOM_TYPES, buildCost, upgradeCost, renovateCost, ghUpgradeCost,
  excavateCost, maxSlotsAtTier, nextSlotTier, GH_THRESHOLDS, roomComfort, globalPrestige, capFromComfort,
  canSlot, slotAccepts, defaultWants, breakDuration, marketSellRate, ransomRate, oraclePrecision,
  BUNK_ROSTER_SLOTS, BUNK_CAP_FLOOR, ENDGAME_BAND_LIFT,
  type FortState, type Room,
} from '../engine/fort.js';
import { infirmaryHealRate, healTick, rollInjuryTiers, payHealCost, REST_HEAL_PER_CYCLE, type InjuryBand } from '../engine/injury.js';
import { REGION, REGIONS } from '../engine/regions.js';
import { ARCHETYPE_NAMES, methodsOf, isSelfDirected, defOf } from '../engine/archetypes.js';
import {
  vBase, RARITY_MULT, splitOneOff, hireCost, RANSOM_RATE, SELL_RATE, KEEP_THRESHOLD, cashValue, coinBand,
  type Rarity, type Archetype, type RewardSpec,
} from '../engine/economy.js';
import {
  rollFreshLead, starterPacket, starterDripLead, STARTER_DRIP_COUNT, huntLead, recruitLead, slotCount, rollDifficulty, oneOffValue,
  materializeReward, computeDelivery, defaultAsk, liabilityTriggers, LEAD_TTL, STARTER_TTL,
  leadBand,
  type Lead, type Quest, type QuestSlot, type ApproachGroup,
} from '../engine/quests.js';
import {
  newChainEconomy, bankBeat, finaleReady, beatSideLoot, finaleFate, crystallize,
  type Chain, type FinaleFate,
} from '../engine/chains.js';
import {
  newGraph, renderDossier, decayPass, guardEdges, modelEdges, chronicleOf, addEdge, touchEdge, edgeCount, effectiveSalience, madeInPlay,
  type LoreGraph, type LoreNode, type RelEdge,
} from '../engine/lore.js';
import { rollName, rollPlaceName } from '../engine/names.js';
import { hasClash, queryMatches, fillScore, acceptsCard } from '../engine/overlap.js';
import { questXp, grantXp, rollBase, rollGrowthLean, growToLevel } from '../engine/growth.js';
import { coins, PARTIAL_FRAC, slotThreshold, resolvePooled, odds, U, DIFFICULTY_ORDER, explainCoins, oddsBand, slotStrength, coinsWhy, INJURY_FRAC, BAND_TEXT, type SlotTest, type Outcome, type QuestRollResult, type Band, type Strength, type CoinsWhy } from '../engine/roll.js';
import { sampleKeywords, sampleKeywordsLight, sampleOpening, sampleGravity, sampleObstacle, sampleShape } from '../ai/keywords.js';
import type { AiProvider, ResolveQuestInput, ResolveQuestOut, AskSlotOut, CampaignDirection, DirectionRead } from '../ai/provider.js';
import { prefPick, chainPayoff, type TraitPrefs } from '../engine/economy.js';
import { labFixtureProblems, nextLabOutcome, forceRoll, type LabFixture } from '../engine/lab.js';
import {
  hashStr, castableClients, pickClientFace, recentFaces, helped, HURT_BAND, WAY_ENDING, OPPONENT_EDGES, DEALT_TRADES,
  type FaceCandidate, type Face, type SagaPos, type CastEntry,
} from '../engine/saga.js';
import { raceOf, sexOf } from '../engine/plainwords.js';
import { knowingOf, mockReport } from '../ai/storyteller.js';
import * as flow from './sagaflow.js';

export interface LogEntry { cycle: number; kind: string; text: string; questId?: string }

// ---- TEMPO G1: background work (the queue) ------------------------------------------------------
// A pursuit is a JOB. In-memory only — never in GameState, never saved (N3: work does not survive
// closing the game; the lead comes back). The UIs render the "being worked" state off jobs().
export type JobState = 'queued' | 'running' | 'done' | 'failed';
/** `seq` = settle order (1, 2, …) once done or failed — a surface announces every job with a seq
 *  above the last it announced (Game.arrivals); `questTitle` = the card that landed */
export interface Job { id: string; leadId: string; title: string; state: JobState; questId?: string; questTitle?: string; error?: string; seq?: number }
interface JobRec {
  job: Job;
  lead: Lead;
  settled: Promise<void>;          // resolves when the job leaves queued/running — never rejects
  settle: () => void;
  result?: { ok: boolean; msg: string; questId?: string };
  thrown?: unknown;                // what pursue() must re-throw to behave exactly as it did
}

// staging & lead lifetimes (🛠 one named constant per mechanism — no twin-path drift)
export const STAGE_TTL_HOLDING = 4;
export const STAGE_TTL_TAVERN = 5;
export const STAGE_TTL_FINALE = 6;
export const CONTINUATION_TTL_BONUS = 6;   // continuation leads outlive fresh ones a bit
export const QUEST_TTL = 10;               // pursued quests lapse after this many cycles (IMPL #1)
export const STALL_LIMIT = 3;              // a part-filled quest that fails to march this many ENDs running is set aside
export const LAPSE_URGENT = 2;             // a quest's countdown turns urgent (red) at this many cycles left
export const INTERROGATE_BASE = 30;        // 🛠 priced per-captive action
export const INTERROGATE_FRAC = 0.1;

export interface Staged { cardId: string; expiresAtCycle: number; prepaid?: boolean }

interface Resolution {
  quest: Quest;
  outcome: Outcome;
  delivery: ReturnType<typeof computeDelivery>;
  party: Card[];
  fate?: FinaleFate;   // finales: decided BEFORE narration (P11)
  rolled: QuestRollResult;   // the dice, shown in the reveal (loss must be OWNED — DESIGN §5)
  /** a saga quest: where its card sat, and the report facts the flow decided in the roll loop (hurt, decides, fate) */
  saga?: { pos: SagaPos; inn: flow.ReportIn };
}
/** a saga quest's report as its writer (or the floor) returned it */
type SagaReport = { before: string; after: string; summary: string };
/** startCycle = when they went on (older saves: absent) — the rack's progress is doneAt−start, never
 *  the room's CURRENT duration, which moves whenever the rack's contents do */
export interface Breaking { cardId: string; roomId: string; doneAtCycle: number; startCycle?: number }

// ---- view contracts both UIs read (the engine's verdicts, never re-derived client-side) ---------

/** the ONE thing that would clear a refusal: an engine action (a button) or a place to go.
 *  `block` on an action fix = why that action itself can't run yet (null = it can, right now). */
export type Fix =
  | { action: 'upgrade'; roomId: string; cost: number; label: string; block: string | null }
  | { action: 'build'; type: string; cost: number; label: string; block: string | null }
  | { action: 'excavate'; cost: number; label: string; block: string | null }
  // tier = the Great Hall tier this fix is about (the one that actually delivers what it promises)
  | { action: 'gh'; cost: number; label: string; block: string | null; tier: number }
  | { screen: 'fort' | 'build' | 'leads' | 'map'; id?: string; label: string };
/** a refusal said BEFORE the click, with what would fix it */
export interface Block { reason: string; fix: Fix | null }

/** one soldier's best free place on one quest (Game.placementsFor) */
export interface Placement {
  questId: string; title: string; idx: number; attr: string; coins: number; bar: number;
  strength: Strength;
  here: boolean;         // they already stand in this place
  from: { questId: string; title: string } | null;   // the OTHER quest they stand on now (sending leaves it)
}
/** one soldier against one quest place (Game.slotFits) */
export interface SlotFit {
  id: string; name: string; coins: number; explain: string;
  strength: Strength; why: CoinsWhy;
  blocked: string | null;                                        // canTake's refusal
  gated: boolean;        // refused ONLY by the finale's approach gate (otherwise legal: an approach card may name them)
  from: { questId: string; idx: number; title: string } | null;  // where they stand now
}
export interface QuestOdds {
  coins: number; bar: number; success: number | null; partial: number | null; precision: 0 | 1 | 2;
  band: Band | null;     // the pooled verdict, once every active place is filled
  partialAt: number;     // heads a partial needs (PARTIAL_FRAC × bar)
  filled: number; of: number;
}
export type RewardKindTag = 'gold' | 'captive' | 'recruit' | 'relic' | 'lead';

export type RoomKind = 'rack' | 'prestige' | 'function';
/** where a relic or captive could go (Game.roomPlacementsFor) — ONE row per comfort room, the
 *  best move into it, previewed by actually making the full move and reverting it */
export interface RoomPlacement {
  roomId: string | null;       // null = a room you don't have yet (its fix builds it)
  roomName: string; roomType: string; kind: RoomKind;
  idx: number | null;          // the place it would take (null when refused)
  swapWith: string | null; swapWithName: string | null;
  ok: boolean;
  reason: string | null;       // why not, in the player's words
  fix: Fix | null;
  here: boolean;               // it already sits in this room
  breaksAtCycle: number | null;                  // racks: tamed at this cycle
  prestigeBefore: number; prestigeAfter: number; // GLOBAL prestige, the whole move modelled
  comfortBefore: number; comfortAfter: number;   // the target room
  gain: number;                                  // prestigeAfter − prestigeBefore
  effectAfter: string | null;                    // the room's effect label after the move
  matched: string[];                             // the card's tags this room wants
  label: string;               // one line for a chip: 'tamed by cycle 29' · '+2.7 prestige' · 'swap for X · +0.4 prestige' ·
                               // 'heals ×1.2 · −2.7 prestige' · the reason
  badge: string;               // the SHORT signed version for a card badge: 'tamed by c29' · '−2.1 prestige' · 'heals ×1.2'
  tone: 'good' | 'bad' | 'neutral';   // the badge's colour: what the move does to the fort (a prestige loss is bad)
}
export type CaptiveState = 'raw' | 'breaking' | 'tamed' | 'onShow';

/** R5: what END would throw away (Game.endWarnings) — the seal's confirm and the CLI's `end!`.
 *  Quests (cold / short / no ending), a saga's continuation lead or a lead worth money going cold,
 *  a captive handed off from holding, a hireable guest leaving the tavern. */
export interface EndWarning {
  key: string;                  // unique per warning (quest id, lead id, card id)
  questId: string | null;       // the quest, for quest warnings
  title: string;
  why: 'lapses' | 'short' | 'needs-approach' | 'lead-lapses' | 'handoff' | 'leaves';
  filled: number; of: number;   // a quest's active places (0/0 otherwise)
  lapsesNow: boolean;           // something goes for good at this END
  text: string;                 // the one line both UIs print: 'goes cold this END — nobody placed'
  target: NextStep['target'];   // where to go to deal with it
}
/** one concrete thing to do next (Game.nextSteps). `act` = one click does it: a POST /api/action
 *  {type, args} for the web, the typed command `cli` for the text UI; `block` = why it can't run yet */
export interface NextStep {
  kind: 'build' | 'approach' | 'man' | 'pursue' | 'holding' | 'hire' | 'gh' | 'setin' | 'rack' | 'addplace' | 'end';
  text: string;
  detail: string | null;
  target: { screen: 'map' | 'leads' | 'quest' | 'fort' | 'room' | 'build' | 'holding' | 'tavern'; questId?: string; roomId?: string; type?: string; cardId?: string };
  urgent: boolean;
  /** `then` = what still has to follow the one click (a dig that makes room for a build) */
  act: { type: string; args: (string | number)[]; label: string; cli: string; block: string | null; then?: string | null } | null;
}
/** one marching quest, as the reckoning rolled it — the verdict a page can colour (SUCCESS / PARTIAL /
 *  FAILURE) without parsing glyphs. `from`/`to` = its block's line range in the reckoning's `lines`. */
export interface ReckonMeta {
  questId: string; title: string; outcome: Outcome;
  heads: number; coins: number; bar: number; partialAt: number;
  party: string[]; partyIds: string[];
  isFinale: boolean; chainId: string | null;
  from: number; to: number;
}
/** the cycle, totalled from a before/after snapshot (the tally strip and the CLI TALLY line) */
export interface CycleSummary {
  cycle: number;
  goldBefore: number; goldAfter: number;
  prestigeBefore: number; prestigeAfter: number;
  outcomes: { success: number; partial: number; failure: number };
  levelUps: { id: string; name: string; level: number }[];
  wounds: { id: string; name: string; tiers: number }[];
  newLeads: number; newLeadIds: string[];
  captivesTaken: { id: string; name: string }[];   // into holding (accept or ransom them)
  recruits: { id: string; name: string }[];        // waiting at the tavern
  relicsGained: { id: string; name: string }[];
  tamed: { id: string; name: string }[];           // came off the rack, ready to be set in a room
  lapsed: string[];                                // quests lost (a faucet's is not a loss — not listed)
  stalled: string[];                               // part-filled quests that did not march
  leadsCold: string[];                             // leads that went cold
  handedOff?: { id: string; name: string; gold: number }[];   // captives whose holding ran out (older archives: absent)
  debts?: { id: string; name: string; amount: number; text?: string }[];     // debts taken on this cycle (older archives: absent; text: Game.debtText)
  setbacks?: { chainId: string; title: string; failures: number; budget: number }[];   // saga beats that failed
}
export interface ReckoningRecord { cycle: number; lines: string[]; meta: ReckonMeta[]; summary: CycleSummary | null }

export interface GameState {
  /** the player's campaign direction (Settings) — writer guidance + trait preferences */
  direction?: CampaignDirection;
  seed: number;
  rngState: RngState;
  idCounter: number;
  cycle: number;
  cards: Card[];
  fort: FortState;
  leads: Lead[];
  quests: Quest[];
  chains: Chain[];
  lore: LoreGraph;
  unlockedRegions: string[];
  tavern: Staged[];            // hireable people (full stats, timer)
  holding: Staged[];           // captive candidates
  breaking: Breaking[];
  liabilityBirth: Record<string, number>;
  /** failure-debt echoes: a named person left in peril RESURFACES (the story bends, never dead-ends) */
  pendingEchoes: { focalId: string; atCycle: number; lastSeen?: string }[];
  /** tier-up lines minted by ghUpgrade, surfaced in the NEXT endCycle report (judges read
   *  campaign reports and never saw a tier event — the log line alone was invisible) */
  pendingTierLines?: string[];
  /** early-game smoothing 2026-07-18: how many starterDripLead grants have fired (old saves
   *  default to done — no retro-drip mid-campaign) */
  starterDripped?: number;
  /** the last dozen reckonings, kept so a player can re-read what happened after they have
   *  moved on. The GUI's `⚄ last reckoning` was one cycle deep and lived in server memory, so it
   *  vanished on restart and could never look further back than the cycle just resolved. */
  reckonings?: { cycle: number; lines: string[]; meta?: ReckonMeta[]; summary?: CycleSummary }[];
  /** the cycle a lead was last put back by abandoning its quest — the re-roll is once a cycle */
  lastRerollCycle?: number;
  /** the STORY rng (docs/STORYTELLER.md §2.4): every saga story draw (seed, tone, cast, places) runs on it, so the main
   *  rng — mechanics — never moves on one. Absent in older saves: seeded from the game seed on load */
  storyRngState?: RngState;
  /** the theme ids dealt so far, newest last (the no-repeat window, themes.ts THEME_NO_REPEAT) */
  recentThemeIds?: string[];
  log: LogEntry[];
}
export const RECKONINGS_KEPT = 12;

const CAST_THETA = Number(process.env.CAST_THETA ?? 4);

/** a quirk is a habit PHRASE ("counts the doors twice") that the dossier joins with '; ' — a writer that
 *  hands back sentences ("Counts the doors.") read "doors.; Coughs…" in every dossier after. One shape
 *  at ingestion, whichever writer or flesh path produced it */
export function normQuirks(quirks: string[]): string[] {
  return quirks.map(q => q.trim().replace(/[\s.;,]+$/, '').replace(/^[A-Z](?=[a-z])/, ch => ch.toLowerCase())).filter(Boolean);
}

/** the work an earned lead turns out to be, in the words someone at a bench would use — dealt to
 *  the report so it can say what was heard. Glosses were tried first and got pasted whole ("left
 *  with the lead: a working through"): a dealt string lands where it is dealt (L19). */
const LEAD_WORD: Partial<Record<string, string>> = {
  raid: 'a holdout worth raiding', capture: 'someone wanted taken alive', rescue: 'someone held who needs freeing',
  escort: 'a journey that wants guarding', investigate: 'something that wants looking into', hunt: 'a hunt',
  contract: 'plain paid work', guard: 'guard work', recover: 'something taken that wants getting back',
  explore: 'unwalked ground to scout', trade: 'a deal that wants brokering', assassinate: 'a killing',
  occult: 'something uncanny that wants putting down', ritual: 'a rite that wants guarding', negotiate: 'terms that want settling',
  fight: 'a fight for money', research: 'something old that wants reading', heist: 'a quiet theft',
  adventure: 'a bad place worth plundering', 'bounty-hunt': 'a bounty', gather: 'a gathering job', hire: 'someone worth hiring',
};

export class Game {
  state: GameState;
  rng: Rng;
  /** story draws only (seed, tone, cast, places — engine/saga.ts); persisted beside the main rng */
  storyRng: Rng;
  ai: AiProvider;

  constructor(ai: AiProvider, seed = 42, loaded?: GameState) {
    this.ai = ai;
    if (loaded) {
      this.state = loaded;
      this.state.pendingEchoes ??= [];   // saves from before the echo mechanic
      this.rng = new Rng(loaded.rngState);
      this.storyRng = new Rng(loaded.storyRngState ?? hashStr(`story:${loaded.seed}`));
      seedIdCounter(loaded.idCounter);
    } else {
      this.rng = new Rng(seed);
      this.storyRng = new Rng(hashStr(`story:${seed}`));
      this.state = {
        seed, rngState: this.rng.state(), idCounter: 1, cycle: 0,
        cards: [], fort: newFort(), leads: [], quests: [], chains: [],
        lore: newGraph(), unlockedRegions: [], tavern: [], holding: [],
        breaking: [], liabilityBirth: {}, pendingEchoes: [], log: [],
      };
      this.bootstrap();
    }
  }

  // ---- persistence (GAME_STATE §2: reload re-runs NO AI) --------------------------------

  save(): string {
    this.state.rngState = this.rng.state();
    this.state.storyRngState = this.storyRng.state();
    this.state.idCounter = idCounter();
    return JSON.stringify(this.state);
  }
  static load(ai: AiProvider, json: string): Game {
    const st = JSON.parse(json) as GameState;
    Game.migrate(st);
    const g = new Game(ai, st.seed, st);
    ai.setDirection?.(st.direction ?? null);
    return g;
  }

  /** the road back to a focal who slipped out of reach (§21-4a): a standing sequel lead that starts a new saga about them */
  private sequelLead(chain: Chain, focal: Card, rarity: Rarity = chain.rarity === 'common' ? 'uncommon' : 'rare'): Lead {
    return {
      id: freshId('lead-'), rarity, level: chain.level, region: chain.region, archetype: 'investigate',
      chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
      source: 'sequel', title: `${focal.name} resurfaces, someday`, focalId: focal.id,
    };
  }

  /** Save migrations. A standing faucet lead is minted ONCE, when its building goes up, and then
   *  lives forever — so a change to what that faucet deals never reaches a game already in
   *  progress. The Recruiting post dealt `rescue` before `hire` existed, which left live saves
   *  posting "free someone held" from the building whose whole purpose is paid hands. */
  private static migrate(st: GameState): void {
    for (const l of st.leads ?? []) {
      if (l.source === 'recruiting' && l.archetype === 'rescue') l.archetype = 'hire';
      // starter leads were stamped cycle + 40; they now last STARTER_TTL (designer 2026-09-30)
      if (l.source === 'starter' && l.expiresAtCycle !== null && l.expiresAtCycle > st.cycle + STARTER_TTL) l.expiresAtCycle = st.cycle + STARTER_TTL;
    }
    // A quest's reward can BE a card that already exists — an echo rescue delivers the very person
    // left behind. In memory that is one object; JSON makes it two with one id, so after a load the
    // resolution fleshed and staged the quest's copy while the tavern read the stale one: Keesa's
    // job-born history ("pinned under bark bindings until Felawen cut her free") was lost and then
    // overwritten by a generic flesh pass (playtest 2026-09-25). Re-link to the one true card.
    // lint telemetry is the developer's, not the player's log (kind 'dev'); older saves logged it
    // under 'chain'
    for (const l of st.log ?? []) {
      if (l.kind === 'chain' && /^(saga card lint|saga draft |card body echoed)/.test(l.text)) l.kind = 'dev';
    }
    // a save taken while a saga was being planned or its card 1 written (the server autosaves mid-pursuit) holds a chain
    // that never began: no quest will ever come of it, and its lead is still on the board — pursuing it again starts afresh
    for (const c of (st.chains ?? []).filter(c => c.saga && !Game.sagaBegun(c, st))) Game.unbegin(st, c);
    const byId = new Map((st.cards ?? []).map(c => [c.id, c]));
    for (const q of st.quests ?? []) {
      q.rewardCards = (q.rewardCards ?? []).map(c => byId.get(c.id) ?? c);
      // a trait is never favored AND clashing on one test (generation filters it since 2026-09-25;
      // saves written before that still carry finale plans like 'helps: social · hurts: social')
      for (const s of q.slots ?? []) s.test.clashing = (s.test.clashing ?? []).filter(c => !s.test.favored.includes(c));
    }
  }

  /** a saga has begun once its card 1 is written (the pursuit's quest is pushed right after); one with no plan, or a plan
   *  but no card 1 and no quest, is a pursuit still in flight — or, in a save, one that died with the process */
  private static sagaBegun(c: Chain, st: GameState): boolean {
    return !!c.saga?.plan && (!!c.saga.card1 || (st.quests ?? []).some(q => q.chainId === c.id));
  }
  /** take back a saga that never began: the chain goes, the focal's chain list forgets it, and a focal held in limbo for
   *  it returns to the lore (where a sequel or a promoted face came from). Its dealt names are free again (the live-saga
   *  cast fence reads the chains). A personal saga's soldier stays on the roster */
  private static unbegin(st: GameState, chain: Chain): void {
    st.chains = st.chains.filter(c => c !== chain);
    const focal = (st.cards ?? []).find(c => c.id === chain.focalId);
    if (!focal) return;
    focal.chainIds = focal.chainIds.filter(id => id !== chain.id);
    if (focal.location.kind === 'held' && focal.location.state === 'limbo' && !focal.chainIds.length) focal.location = HELD('lore');
  }

  // ---- the player's campaign direction (Settings) ---------------------------------------------

  /** the trait vocabulary a direction may name — character tags the engine actually rolls */
  static directionVocab(): Record<string, string[]> {
    const groups = ['race', 'gender', 'body', 'personality', 'background', 'skill', 'standing'];
    return Object.fromEntries(groups.map(g => [g, CONCEPTS.filter(c => c.group === g).map(c => c.id)]));
  }
  direction(): CampaignDirection | null { return this.state.direction ?? null }
  /** who a roll is for: strangers the company meets ('npc') or people who join it ('recruit') */
  private prefsFor(role: 'npc' | 'recruit'): TraitPrefs | undefined { return this.state.direction?.[role] }

  /** SET THE DIRECTION from the player's free text (Settings; CLI 'direction'). One cheap AI read
   *  turns it into writer guidance + trait preferences; the engine keeps only ids it knows. Empty
   *  text clears it. Applies to what is written and rolled from now on. */
  async setDirection(text: string): Promise<{ ok: boolean; msg: string }> {
    const t = text.trim().slice(0, 500);
    if (!t) {
      this.state.direction = undefined; this.ai.setDirection?.(null);
      return { ok: true, msg: 'Direction cleared — the storyteller is back to its defaults.' };
    }
    const vocab = Game.directionVocab();
    let read: DirectionRead;
    try { read = this.ai.interpretDirection ? await this.ai.interpretDirection(t, vocab) : readDirectionPlain(t, vocab) }
    catch (e) { return { ok: false, msg: `could not read that direction (${(e as Error).message?.slice(0, 80)}) — try again` } }
    const known = new Set(Object.values(vocab).flat());
    const ids = (xs: string[]) => [...new Set(xs.map(x => x.toLowerCase().trim()).filter(x => known.has(x)))].slice(0, 12);
    const prefs = (p: TraitPrefs) => { const avoid = ids(p.avoid); return { prefer: ids(p.prefer).filter(x => !avoid.includes(x)), avoid } };
    const d: CampaignDirection = { text: t, guidance: read.guidance?.trim() || t, npc: prefs(read.npc), recruit: prefs(read.recruit), avoid: (read.avoid ?? []).slice(0, 8) };
    this.state.direction = d; this.ai.setDirection?.(d);
    return { ok: true, msg: `Direction set — ${directionSummary(d)}` };
  }

  // ---- bootstrap (day 0) ------------------------------------------------------------------

  private bootstrap() {
    // starting gold + starter mercs (🛠 2026-07-19: 3→2, designer-ruled with the drip board.
    // Re-measured 12 sim seeds ×20 cycles: 1 founder stalls (dead cycles in 9/12, roster stuck
    // at 1 by c20 in 10/12); 2 is near-clean (one extra dead cycle in 2/12); 3 was zero-dead
    // but the designer wants the leaner start. No doc specifies the count)
    this.addCard(mintStackable('gold', 300));
    for (let i = 0; i < 2; i++) {
      const merc = this.freshCharacter('merc', 2, 60, 'forests');
      merc.location = HELD('roster');
      this.addCard(merc);
      this.ensureLoreNode(merc);
      // founders' "past stirs" leads now arrive via personalChainDrip, STAGGERED (early-game
      // smoothing 2026-07-18: all three at day 0 fed the 10-lead paralysis board) — the
      // 2026-07-11 guarantee that every founder's story eventually begins lives in the drip
    }
    this.log('start', 'The fort stands: your bedroom, a bunkroom, and the Great Hall. Build a Map room to find work.');
  }

  private freshCharacter(role: 'merc' | 'captive' | 'npc', level: number, targetV: number, region: string): Card {
    const races = Object.entries(REGION[region]!.poolWeights) as [string, number][];
    const prefs = this.prefsFor(role === 'merc' ? 'recruit' : 'npc');
    const race = prefPick(this.rng, races.map(r => r[0]), prefs, m => races.find(r => r[0] === m)![1]);
    const card: Card = {
      id: freshId('c'), name: '', value: Math.round(targetV),
      tags: [{ concept: 'character' }, T(race)],
      location: HELD('limbo'), chainIds: [],
      character: {
        role, level, xp: 0, attrs: rollBase(this.rng), growthLean: rollGrowthLean(this.rng),
        focus: { kind: 'none' }, injuryTiers: 0,
      },
    };
    const body = growToLevel(this.rng, level);   // ONE growth implementation (no drift)
    card.character!.attrs = body.attrs;
    card.character!.growthLean = body.growthLean;
    // flavor tags drawn from the vocabulary itself, not a parallel hand list
    const skillWords = CONCEPTS.filter(c => c.group === 'skill' && !c.id.startsWith('magic-')).map(c => c.id);
    const persWords = CONCEPTS.filter(c => c.group === 'personality').map(c => c.id);
    const genders = CONCEPTS.filter(c => c.group === 'gender').map(c => c.id);
    card.tags.push(T(prefPick(this.rng, skillWords, prefs), this.rng.range(1, 3)));
    card.tags.push(T(prefPick(this.rng, persWords, prefs)));
    const gender = prefPick(this.rng, genders, prefs);
    card.tags.push(T(gender));
    card.name = rollName(this.rng, race, gender);   // gender first — name never contradicts it
    return card;
  }

  // ---- helpers -------------------------------------------------------------------------------

  card(id: string): Card | undefined { return this.state.cards.find(c => c.id === id) }
  /** `keepName` — this card's name is DELIBERATE (a face the world already knows, coming back).
   *  Without it the twin-name guard below rerolls them: a returning person's name is in the
   *  lorebook by definition, which is exactly what the guard treats as a collision. Two guards
   *  had this bug; both now take the same exemption. */
  private addCard(c: Card, keepName = false) {
    if (cardType(c) === 'stackable') {
      const mate = this.state.cards.find(x => sameStack(x, c) && x.location.kind === 'held');
      if (mate) { mate.qty = (mate.qty ?? 0) + (c.qty ?? 0); return }
    }
    // §4b corollary: two characters must never share a name — NOR near-twin names
    // (a colliding "Fenlin" merged NPC and soldier; twin focals "Pellthil"/"Pellnith" read as one saga twice)
    if (c.character && !keepName) {
      const race = c.tags.find(t => ['human', 'elf', 'wolfman', 'lizardman'].includes(t.concept))?.concept ?? 'human';
      for (let i = 0; i < 12 && this.nameTooSimilar(c.name); i++)
        c.name = rollName(this.rng, race);
    }
    this.state.cards.push(c);
    if (isLiability(c)) this.state.liabilityBirth[c.id] = this.state.cycle;
  }
  log(kind: string, text: string, questId?: string) {
    this.state.log.push({ cycle: this.state.cycle, kind, text, questId });
  }

  gold(): number {
    return this.state.cards.filter(c => stackKind(c) === 'gold').reduce((s, c) => s + (c.qty ?? 0), 0);
  }
  spendGold(n: number): boolean {
    if (this.gold() < n) return false;
    let left = n;
    for (const c of this.state.cards) {
      if (stackKind(c) !== 'gold' || left <= 0) continue;
      const take = Math.min(left, c.qty ?? 0);
      c.qty = (c.qty ?? 0) - take; left -= take;
    }
    this.state.cards = this.state.cards.filter(c => !(stackKind(c) === 'gold' && (c.qty ?? 0) <= 0));
    return true;
  }
  addGold(n: number) { if (n > 0) this.addCard(mintStackable('gold', Math.round(n))) }

  prestige(): number { return globalPrestige(this.state.fort, id => this.card(id)) }

  room(id: string): Room | undefined { return this.state.fort.rooms.find(r => r.id === id) }
  hasRoom(type: string): boolean { return this.state.fort.rooms.some(r => r.type === type) }

  // Gate rooms open menus (GENERATION_FLOW §12.1 / DESIGN capability list). "open" also honors
  // content the game already put in front of the player (starter leads, a staged finale focal)
  // so a locked menu can never hide owned cards.
  /** `locks` = the gate room ACTUALLY holds something back. False for a gate the engine never
   *  enforces (a relic drops, sits and sells with no Storage; holding works with no Holding cell; the
   *  roster is always open) — a UI must never say "build X first" for one of those. */
  menuGates(): { key: string; open: boolean; need: string; locks: boolean }[] {
    const g = (key: string, roomId: string, orContent = false, locks = true) =>
      ({ key, open: this.hasRoom(roomId) || orContent, need: ROOM_TYPE[roomId]!.name, locks });
    return [
      g('quests', 'map-room'),
      // pre-Map-room the honest hint is the Map room (it brings the starter packet)
      g('leads', this.hasRoom('map-room') ? 'lead-room' : 'map-room', this.visibleLeads().length > 0),
      g('recruits', 'tavern', this.state.tavern.length > 0),
      // ⚠ doc-gap: captives land in holding and are ransomed, sold or accepted with no Holding cell
      g('staging', 'holding-cell', this.state.holding.length > 0, false),
      g('captives', 'dungeon', this.captives().length > 0),
      // ⚠ doc-gap: FORT §5 gives Storage the stores, but relics are kept and sold without one
      g('items', 'storage', this.state.cards.some(c => cardType(c) === 'relic' && c.location.kind === 'held'), false),
      g('lore', 'library'),
      // FORT §5 / LORE §5: the Chronicle room exposes the archive (was a dead building)
      g('chronicle', 'chronicle'),
      // ⚠ doc-gap: §12.1 gives Mess hall → merc list, but FOCUS is a base function (§12.1 CUT
      // note) and lives in the roster menu — always open pending a designer ruling.
      g('roster', 'mess-hall', true, false),
    ];
  }

  /** a room's EFFECTIVE wants — a bedroom's bind to its owner's tags (CARDS §2:
   *  the owner slot binds the room's target; a fitting relic matches the OWNER) */
  effectiveWants(room: Room): Room['wants'] {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.benefit === 'cap' && room.ownerId) {
      const wants: Room['wants'] = [{ match: 'furniture' }, { match: 'decoration' }];
      const owner = room.ownerId === 'you' ? null : this.card(room.ownerId);
      if (owner) {
        for (const t of owner.tags) {
          if (['type', 'gender', 'kind', 'status'].includes(CONCEPT[t.concept]?.group ?? '')) continue;
          wants.push({ match: t.concept });
        }
      }
      return wants;
    }
    return room.wants;
  }

  comfort(room: Room): number {
    const rt = ROOM_TYPE[room.type]!;
    const lift = rt.benefit === 'cap' && this.endgameLiftActive() ? ENDGAME_BAND_LIFT : 0;
    const bound: Room = { ...room, wants: this.effectiveWants(room) };
    return roomComfort(this.state.fort, bound, id => this.card(id), lift);
  }
  private endgameLiftActive(): boolean { return this.state.fort.endgameKeys.length > 0 }

  /** cycles until a character heals fully at the CURRENT rate (rest or infirmary) */
  healEta(c: Card): { cycles: number; rate: number; viaInfirmary: boolean } {
    const infirmary = this.state.fort.rooms.find(r => r.type === 'infirmary');
    const rate = infirmary ? infirmaryHealRate(this.comfort(infirmary)) : REST_HEAL_PER_CYCLE;
    const tiers = c.character?.injuryTiers ?? 0;
    return { cycles: Math.ceil(tiers / rate), rate, viaInfirmary: !!infirmary };
  }

  /** a merc's level cap = their own bedroom's comfort, floored at the bunk floor
   *  (an empty bedroom never caps BELOW bedroom-less housing) */
  capOf(mercId: string): number {
    const bed = this.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === mercId);
    if (!bed) return BUNK_CAP_FLOOR;
    return Math.max(BUNK_CAP_FLOOR, capFromComfort(this.comfort(bed)));
  }

  roster(): Card[] {
    return this.state.cards.filter(c =>
      c.character?.role === 'merc' && (c.location.kind === 'held' || c.location.kind === 'quest'));
  }
  rosterCapacity(): number {
    const beds = this.state.fort.rooms.filter(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId && r.ownerId !== 'you').length;
    return BUNK_ROSTER_SLOTS + beds;
  }
  captives(): Card[] {
    // OWNED captives only — staged holding candidates are not yours until accepted
    return this.state.cards.filter(c => c.character?.role === 'captive' &&
      ((c.location.kind === 'held' && c.location.state === 'roster') || c.location.kind === 'room'));
  }
  captiveCapacity(): number {
    return this.state.fort.rooms.reduce((s, r) => {
      const rt = ROOM_TYPE[r.type]!;
      return s + (rt.species === 'capacity' ? (rt.cellSlots ?? 0) : 0);
    }, 0);
  }
  relics(): Card[] {
    return this.state.cards.filter(c => cardType(c) === 'relic' && c.location.kind !== 'quest');
  }

  // ---- lore --------------------------------------------------------------------------------

  ensureLoreNode(c: Card): LoreNode {
    const existing = this.state.lore.nodes[c.id];
    if (existing) return existing;
    const node: LoreNode = {
      id: c.id, kind: cardType(c) === 'relic' ? 'relic' : 'character',
      name: c.name, blurb: c.character?.who ?? renderTags(c.tags).slice(0, 90),
      identity: renderTags(c.tags),
      active: true, createdCycle: this.state.cycle,
    };
    this.state.lore.nodes[c.id] = node;
    return node;
  }
  /** a person's dossier. `player`: the UIs' view (a memory of their own reads without a relation to themself) */
  dossier(id: string, opts?: { habits?: boolean; player?: boolean }): string {
    const card = this.card(id);
    return renderDossier(this.state.lore, id, this.state.cycle,
      { ...(card?.character ? { who: card.character.who, quirks: opts?.habits === false ? undefined : card.character.quirks } : {}), ...(opts?.player ? { player: true } : {}) });
  }
  chronicle(id: string) { return chronicleOf(this.state.lore, id) }
  /** A saga as the COMPANY knows it — the one view both UIs render (the CLI's `chains`/`chain`, the GUI's saga strip and
   *  chronicle). The plan is hidden truth: the view is the saga flow's chronicle (sagaflow.chronicle) — the quest log as
   *  it stands, card 1, So far, the answer once the finale is played, and the people the player has seen, by name only
   *  once their name was read — plus the economy fields. A saga still being planned, or whose card 1 is still being
   *  written, is not shown (its lead's job is). */
  chainViews() {
    return this.state.chains.filter(c => c.saga?.plan && c.saga.card1).map(c => {
      const ch = flow.chronicle(c)!;
      const rec = c.saga!;
      const done = c.state === 'done' || c.state === 'slipped';
      return {
        id: c.id, title: ch.title, state: c.state, kind: c.kind, personal: c.isPersonal,
        // the likely ending in the player's words, while the saga is live; how it ended, once it is over
        likely: ch.likely, ending: ch.ending ?? null, endLine: flow.endLine(ch),
        // "part n of N": the job on offer (or next); the finale's is N — the saga's one measure of how far along it is
        part: done ? rec.world.N : flow.posOf(rec).job, of: rec.world.N,
        bank: coinBand(c.bank),
        failures: c.failures, failureBudget: c.failureBudget,
        rows: ch.rows, card1: ch.card1, lines: ch.lines, soFar: ch.soFar,
        answer: ch.answer, people: ch.people,
        // the saga strip's link back into play: its step on the map, or the lead that continues it
        ...this.chainNext(c),
      };
    });
  }
  /** where a saga stands in play — its open quest, the lead that continues it, and one word for
   *  what the player does next ('choose the ending' · 'on the map' · 'being written' · 'a lead to
   *  pursue' · 'waiting for word' · 'finished' · 'slipped away') */
  private chainNext(c: Chain): { questId: string | null; leadId: string | null; next: string; live: boolean } {
    const live = c.state === 'active' || c.state === 'finale-pending';
    const q = this.state.quests.find(x => x.state === 'open' && x.chainId === c.id);
    const lead = this.state.leads.find(l => l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === c.id);
    const writing = !!lead && this.jobRecs.some(r => r.job.leadId === lead.id && (r.job.state === 'queued' || r.job.state === 'running'));
    const next = c.state === 'done' ? 'finished' : c.state === 'slipped' ? 'slipped away'
      : q ? (q.approaches && !q.chosenApproach ? 'choose the ending' : 'on the map')
      : writing ? 'being written' : lead ? 'a lead to pursue' : 'waiting for word';
    return { questId: q?.id ?? null, leadId: lead?.id ?? null, next, live };
  }

  // ---- fort actions ---------------------------------------------------------------------------

  /** every room type and whether it can be built now. `blocker` names the KIND of refusal (the
   *  build list sorts on it: null → cell → gold → tier/region); `firstPlaceCost` = what a comfort
   *  room's first place costs (they are built with none). */
  buildableTypes(): { type: string; cost: number; reason?: string; blocker: 'gold' | 'cell' | 'tier' | 'region' | 'built' | null; ghTier: number; firstPlaceCost: number | null; owners?: { id: string; name: string }[] }[] {
    const t = this.state.fort.ghTier;
    // a region room waits on that region's Scouting lodge (it is what writes the region into
    // unlockedRegions) — say the ROOM, never "open X first" while X already shows on the map
    const lodgeFirst = (id: string) => `build the ${ROOM_TYPE[`scouting-${id}`]?.name ?? `Scouting lodge (${REGION[id]?.name ?? id})`} first`;
    return ROOM_TYPES.filter(rt => rt.id !== 'great-hall').map(rt => {
      const cost = buildCost(rt);
      let reason: string | undefined;
      let blocker: 'gold' | 'cell' | 'tier' | 'region' | 'built' | null = null;
      if (rt.ghTier > t) { reason = `needs Great Hall T${rt.ghTier}`; blocker = 'tier' }
      else if (rt.region && rt.roomKind === 'scouting') {
        const region = REGION[rt.region]!;
        if (region.prev && !this.state.unlockedRegions.includes(region.prev)) { reason = lodgeFirst(region.prev); blocker = 'region' }
      } else if (rt.region && rt.roomKind !== 'scouting' && !this.state.unlockedRegions.includes(rt.region)) {
        reason = lodgeFirst(rt.region); blocker = 'region';
      }
      if (!reason && !rt.multiBuild && this.hasRoom(rt.id)) { reason = 'already built'; blocker = 'built' }
      const owners = rt.benefit === 'cap' ? this.bedOwners() : undefined;
      if (!reason && owners && !owners.length) { reason = 'everyone has a bedroom'; blocker = 'built' }
      if (!reason && cost > this.gold()) { reason = `costs ${cost}g (short ${cost - this.gold()}g)`; blocker = 'gold' }
      // the list said "✓ buildable" for every room while the fort had no free cell, and the
      // build then failed — say so where the player is choosing (playtest 2026-09-25)
      if (!reason && !this.freeCells().length) { reason = `no free cell — excavate first (${excavateCost(this.state.fort.cells.length)}g)`; blocker = 'cell' }
      return { type: rt.id, cost, reason, blocker, ghTier: rt.ghTier, firstPlaceCost: rt.species === 'comfort' ? upgradeCost(rt, 0) : null, ...(owners ? { owners } : {}) };
    });
  }

  /** who a bedroom can be built for right now — the SAME rule build() enforces (a merc of yours,
   *  or you, without one already). Soldiers first: theirs raise a level cap and the roster. */
  bedOwners(): { id: string; name: string }[] {
    const has = (id: string) => this.state.fort.rooms.some(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === id);
    return [...this.roster().map(m => ({ id: m.id, name: m.name })), { id: 'you', name: 'you' }].filter(o => !has(o.id));
  }

  freeCells(): { floor: number; col: number }[] {
    return this.state.fort.cells.filter(cell =>
      !this.state.fort.rooms.some(r => r.cell.floor === cell.floor && r.cell.col === cell.col));
  }

  /** build a room — into the free cell the player picked (`cell`), else the first free one */
  build(typeId: string, ownerId?: string, cell?: { floor: number; col: number }): { ok: boolean; msg: string; id?: string } {
    const rt = ROOM_TYPE[typeId];
    if (!rt) return { ok: false, msg: 'no such room type' };
    const check = this.buildableTypes().find(b => b.type === typeId);
    if (check?.reason) return { ok: false, msg: check.reason };
    // no owner named: the first one the engine offers (bedOwners — the list both UIs show)
    if (rt.benefit === 'cap') ownerId ??= this.bedOwners()[0]?.id ?? 'you';
    if (rt.benefit === 'cap') {
      const owner = ownerId ?? 'you';
      if (this.state.fort.rooms.some(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === owner))
        return { ok: false, msg: 'they already have a bedroom — deepen it instead' };
      if (owner !== 'you' && this.card(owner)?.character?.role !== 'merc')
        return { ok: false, msg: 'bedrooms belong to mercs (or you)' };
    }
    const free = this.freeCells();
    const target = cell ? free.find(c => c.floor === cell.floor && c.col === cell.col) : free[0];
    if (cell && !target) return { ok: false, msg: this.state.fort.cells.some(c => c.floor === cell.floor && c.col === cell.col)
      ? 'that cell is already built on' : 'no such cell — excavate first' };
    if (!target) return { ok: false, msg: 'no free cells — excavate first' };
    if (!this.spendGold(buildCost(rt))) return { ok: false, msg: 'not enough gold' };
    const room: Room = {
      id: freshId('room-'), type: typeId, cell: target,
      slots: [], wants: defaultWants(rt, null), style: null,
      ownerId: rt.benefit === 'cap' ? (ownerId ?? 'you') : undefined,
    };
    this.state.fort.rooms.push(room);
    this.onBuilt(rt, room);
    const place = rt.species === 'comfort' ? ` — no places yet: add one for ${upgradeCost(rt, 0)}g` : '';
    return { ok: true, msg: `${rt.name} built${place}`, id: room.id };
  }

  private onBuilt(rt: (typeof ROOM_TYPES)[number], room: Room) {
    this.log('build', `Built: ${rt.name}`);
    if (rt.unlocks === 'quests') {
      // day-0 bootstrap: the Map room grants a visible starter lead packet
      const packet = starterPacket(this.rng, this.state.cycle, () => freshId('lead-'));
      for (const l of packet) this.noteLeadArchetype(l.archetype);   // the packet is FIXED, but the drip that follows must not echo it
      this.state.leads.push(...packet);
      this.log('leads', 'The map table fills: first leads are in.');
    }
    if (rt.roomKind === 'scouting' && rt.region) {
      if (!this.state.unlockedRegions.includes(rt.region)) this.state.unlockedRegions.push(rt.region);
      const band = REGION[rt.region]!.levelBand;
      this.state.leads.push(huntLead(rt.region, band[0], () => freshId('lead-')));
      this.log('region', `${REGION[rt.region]!.name} is open. Its lead-hunt is on the board.`);
    }
    if (rt.roomKind === 'recruiting' && rt.region) {
      // §19: the Recruiting post is a quest FAUCET, not just a gate — its standing
      // recruit quest goes on the board (parallel to the scouting lodge's lead-hunt)
      const band = REGION[rt.region]!.levelBand;
      this.state.leads.push(recruitLead(rt.region, band[0], () => freshId('lead-')));
      this.log('region', `${REGION[rt.region]!.name} recruiting post opens: word goes out for swords.`);
    }
    if (rt.roomKind === 'endgame' && rt.region) {
      this.state.fort.endgameKeys.push(rt.region);
      // §13 Outskirts keys: ALL 4 SPINE endgame buildings (Underdeep is NOT a key)
      const spine = ['forests', 'city', 'coast', 'highlands'];
      if (spine.every(k => this.state.fort.endgameKeys.includes(k)) &&
        !this.state.unlockedRegions.includes('outskirts')) {
        this.state.unlockedRegions.push('outskirts');
        this.log('region', 'The border-stones fall behind you: THE OUTSKIRTS are open.');
      }
    }
  }

  upgrade(roomId: string): { ok: boolean; msg: string; id?: string } {
    const room = this.room(roomId);
    if (!room) return { ok: false, msg: 'no such room' };
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' && rt.species !== 'capacity') return { ok: false, msg: 'not upgradable (pure gate)' };
    if (rt.species === 'capacity') return { ok: false, msg: 'cells are not upgraded — build more' };
    if (!this.roomHasEffect(room)) return { ok: false, msg: this.noEffectReason(room) };
    const max = maxSlotsAtTier(this.state.fort.ghTier);
    if (room.slots.length >= max) return { ok: false, msg: this.maxPlacesReason(room) };
    const cost = upgradeCost(rt, room.slots.length);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g (short ${cost - this.gold()}g)` };
    room.slots.push(null);
    const n = room.slots.length;
    return { ok: true, msg: `${rt.name} gains a ${rt.benefit === 'break' ? 'rack' : 'place'} (${n} now, ${cost}g)`, id: room.id };
  }

  async renovate(roomId: string, style: string): Promise<{ ok: boolean; msg: string }> {
    const room = this.room(roomId);
    if (!room) return { ok: false, msg: 'no such room' };
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort') return { ok: false, msg: 'only comfort rooms take a style' };
    if (rt.benefit === 'cap') return { ok: false, msg: 'a bedroom takes after its owner, not a style' };
    const cost = renovateCost(rt);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    // AI rolls type+style → wants ONCE; engine scores deterministically forever (§18)
    const vocab = CONCEPTS.filter(c => !['type', 'kind', 'status'].includes(c.group)).map(c => c.id);
    const out = await this.ai.themeRoll({
      roomType: room.type, roomName: rt.name, style,
      hintWords: rt.themeHints ?? [], vocabulary: vocab,
    });
    const wants = out.wants.map(w => {
      const c = parseAiTag(w)?.concept;
      // r-twin guard: the model sometimes strips the relic prefix ('r-beautiful' → 'beautiful',
      // which parses as the BODY trait); when this room's hints favor the relic twin, restore it
      if (c && CONCEPT[`r-${c}`] && (rt.themeHints ?? []).includes(`r-${c}`)) return `r-${c}`;
      return c;
    }).filter((c): c is string => !!c && !!CONCEPT[c]);
    room.wants = (wants.length ? wants : rt.themeHints ?? []).map(w => ({ match: w }));
    room.style = style;
    this.log('renovate', out.flavorLine);
    return { ok: true, msg: `${rt.name} restyled (${style}): wants ${room.wants.map(w => w.match).join(', ')}` };
  }

  excavate(): { ok: boolean; msg: string } {
    const n = this.state.fort.cells.length;
    const cost = excavateCost(n);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    const maxFloor = Math.max(...this.state.fort.cells.map(c => c.floor));
    const floorCells = this.state.fort.cells.filter(c => c.floor === maxFloor);
    if (floorCells.length < 5) this.state.fort.cells.push({ floor: maxFloor, col: floorCells.length });
    else this.state.fort.cells.push({ floor: maxFloor + 1, col: 0 });
    return { ok: true, msg: `Excavated a new cell (${cost}g)` };
  }

  ghUpgrade(): { ok: boolean; msg: string } {
    const to = this.state.fort.ghTier + 1;
    const block = this.ghBlock();
    if (block) return { ok: false, msg: block.reason };
    const cost = ghUpgradeCost(to);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    this.state.fort.ghTier = to;
    // visible tier-up announcement: name what THIS tier just put within reach — the raw
    // log line never reached the endCycle report, so campaigns read as if tiers never moved
    const unlocked = ROOM_TYPES.filter(rt => rt.ghTier === to && rt.id !== 'great-hall').map(rt => rt.name);
    const line = `🏛 The Great Hall rises to Tier ${to}` +
      (unlocked.length ? ` — newly within reach: ${unlocked.join(', ')}.` : '.');
    (this.state.pendingTierLines ??= []).push(line);
    this.log('gh', line);
    return { ok: true, msg: `Great Hall → T${to}${unlocked.length ? ` — newly within reach: ${unlocked.join(', ')}` : ''}` };
  }

  // ---- setting cards in rooms (FORT §2/§18) — ONE path: setInRoom -------------------------------

  /** the old primitive, kept for callers: exactly setInRoom with a place named */
  slot(roomId: string, slotIdx: number, cardId: string): { ok: boolean; msg: string; warn?: boolean } {
    return this.setInRoom(roomId, cardId, slotIdx);
  }

  /** what a room's places are for — null for a room whose places would do nothing (gates, cells,
   *  landmarks, and a bedroom with no soldier to level: YOUR bedroom, whose comfort v3 reads nowhere) */
  roomKind(room: Room): RoomKind | null {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' || !this.roomHasEffect(room)) return null;
    return rt.benefit === 'break' ? 'rack' : rt.benefit === 'prestige' ? 'prestige' : 'function';
  }
  /** does filling this comfort room change anything the game reads? A bedroom's comfort is its
   *  owner's level cap (capOf) — and only a merc HAS a cap.
   *  ⚠ doc-gap (FORT §3 / GENERATION_FLOW §B: "your bedroom … gates YOUR level cap"): v3 has no
   *  levelling player, so the owner=you bedroom has no effect — flagged for a designer ruling. */
  private roomHasEffect(room: Room): boolean {
    const rt = ROOM_TYPE[room.type]!;
    return !(rt.benefit === 'cap' && (!room.ownerId || room.ownerId === 'you'));
  }
  private noEffectReason(room: Room): string {
    return ROOM_TYPE[room.type]!.benefit === 'cap' ? 'your own bedroom has no effect yet — only a soldier’s bedroom raises a cap' : 'no effect';
  }
  /** at the tier's slot depth: which tier gives MORE places (nextSlotTier), in the player's words */
  private maxPlacesReason(room: Room): string {
    const t = this.state.fort.ghTier, max = maxSlotsAtTier(t), nt = nextSlotTier(t);
    const noun = ROOM_TYPE[room.type]!.benefit === 'break' ? 'racks' : 'places';
    return `max ${max} ${noun} at GH T${t}${nt ? ` — more at GH T${nt}${nt > t + 1 ? ` (T${t + 1} adds none)` : ''}` : ' — the deepest a room goes'}`;
  }

  /** where a captive stands: raw in the cells, breaking on a rack, tamed, or on show in a room */
  captiveState(cardId: string): { state: CaptiveState; doneAt: number | null; breakTotal: number | null; whereId: string | null; whereName: string | null } | null {
    const c = this.card(cardId);
    if (c?.character?.role !== 'captive') return null;
    const b = this.state.breaking.find(x => x.cardId === cardId);
    const room = c.location.kind === 'room' ? this.room(c.location.roomId) : undefined;
    const whereName = room ? ROOM_TYPE[room.type]!.name : null;
    if (b) return { state: 'breaking', doneAt: b.doneAtCycle, breakTotal: this.breakTotal(b), whereId: room?.id ?? b.roomId, whereName };
    if (room) return { state: 'onShow', doneAt: null, breakTotal: null, whereId: room.id, whereName };
    return { state: hasTag(c.tags, 'obedient') ? 'tamed' : 'raw', doneAt: null, breakTotal: null, whereId: null, whereName: null };
  }
  /** how many cycles THIS captive's breaking takes — fixed when they went on (an older save's
   *  record has no start: the rack's duration now is the best guess) */
  private breakTotal(b: Breaking): number {
    if (b.startCycle !== undefined) return Math.max(1, b.doneAtCycle - b.startCycle);
    const r = this.room(b.roomId);
    return Math.max(1, b.doneAtCycle - this.state.cycle, r ? breakDuration(this.comfort(r)) : 1);
  }

  /** the room a card sits in, by name (relics and captives on show) */
  whereName(cardId: string): string | null {
    const c = this.card(cardId);
    if (c?.location.kind !== 'room') return null;
    const r = this.room(c.location.roomId);
    return r ? ROOM_TYPE[r.type]!.name : null;
  }

  /** what taking this card off its rack throws away — the two-step confirm's text (R1), or null
   *  when it is not on a rack */
  rackLoss(cardId: string): string | null {
    const b = this.state.breaking.find(x => x.cardId === cardId);
    return b ? `breaking lost (was due c${b.doneAtCycle})` : null;
  }

  /** a room's effect, one plain label from the engine curves — the tile subline, the panel head,
   *  the CLI `room` line */
  roomEffect(room: Room, comfort?: number): string {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species === 'capacity') return `holds ${rt.cellSlots ?? 0} · ${this.captives().length}/${this.captiveCapacity()} held`;
    if (rt.species !== 'comfort') return '';
    if (!this.roomHasEffect(room)) return 'no effect yet';
    // the label is the SAME curve the effect reads, at the room's comfort (0 when it has no
    // places): an Oracle with no places already gives coarse odds, a Market already sells at 50%
    const c = comfort ?? this.comfort(room);
    const none = !room.slots.length;
    const eff = ((): string => {
      switch (rt.benefit) {
        case 'prestige': return c > 0 ? `+${c.toFixed(1)} prestige` : '';
        case 'cap': return `level cap ${Math.max(BUNK_CAP_FLOOR, capFromComfort(c))}`;
        case 'heal': return `heals ×${(infirmaryHealRate(c) / REST_HEAL_PER_CYCLE).toFixed(1)}`;
        case 'prices': return `relics sell at ${Math.round(marketSellRate(c) * 100)}%`;
        case 'ransom': return `ransoms at ${Math.round(ransomRate(c) * 100)}%`;
        case 'break': return none ? '' : `breaks in ${breakDuration(c)} cycles`;
        case 'leads': return `${Math.round(this.interrogateLift(c) * 100)}% chance of a richer lead`;
        case 'odds': return oraclePrecision(c) === 2 ? 'exact odds' : 'coarse odds (exact at comfort 15)';
        case 'payheal': return `pay-heal · +${(0.25 * c).toFixed(1)} prestige`;
        default: return c > 0 ? `comfort ${c.toFixed(1)}` : '';
      }
    })();
    if (none) return eff ? `${eff} · no places yet` : 'no places yet';
    return eff || (rt.benefit === 'prestige' ? 'empty — no prestige yet' : '');
  }
  /** interrogation room: the chance a lead comes back one rarity richer */
  private interrogateLift(comfort: number): number { return Math.min(0.6, comfort / 40) }

  /** what "Add a place" costs here, as a fix — or, at the tier's depth, raising the Great Hall */
  addPlaceFix(room: Room): Fix | null {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' || !this.roomHasEffect(room)) return null;
    const t = this.state.fort.ghTier;
    if (room.slots.length >= maxSlotsAtTier(t)) {
      // at the tier's depth the fix is the tier that ADDS places — only the next raise is a
      // one-click fix, and only when that raise is the one that deepens the room
      const nt = nextSlotTier(t);
      if (nt === null) return null;
      if (nt === t + 1) return this.ghFix();
      const noun = rt.benefit === 'break' ? 'racks' : 'places';
      let cost = 0;
      for (let x = t + 1; x <= nt; x++) cost += ghUpgradeCost(x);
      return { action: 'gh', tier: nt, cost, label: `More ${noun} at GH T${nt} · ${cost}g`, block: `GH T${t + 1} adds no ${noun} — they come at T${nt}` };
    }
    const cost = upgradeCost(rt, room.slots.length);
    const gold = this.gold();
    return { action: 'upgrade', roomId: room.id, cost, label: `${rt.benefit === 'break' ? 'Add a rack' : 'Add a place'} · ${cost}g`, block: gold < cost ? `short ${cost - gold}g` : null };
  }
  /** why "Add a place" can't run now ('short 26g' | 'max 2 places at GH T2 — more at GH T4'), null when it can */
  upgradeBlock(room: Room): string | null {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort') return 'not upgradable';
    if (!this.roomHasEffect(room)) return this.noEffectReason(room);
    if (room.slots.length >= maxSlotsAtTier(this.state.fort.ghTier)) return this.maxPlacesReason(room);
    const cost = upgradeCost(rt, room.slots.length);
    return this.gold() < cost ? `short ${cost - this.gold()}g` : null;
  }
  /** "Build a X" as a fix, carrying buildableTypes' own refusal */
  buildFix(type: string): Fix | null {
    const rt = ROOM_TYPE[type];
    if (!rt) return null;
    const b = this.buildableTypes().find(x => x.type === type);
    return { action: 'build', type, cost: buildCost(rt), label: `Build a ${rt.name} · ${buildCost(rt)}g`, block: b?.reason ?? null };
  }
  /** "Raise the Great Hall" as a fix (null at the final tier) */
  private ghFix(): Fix | null {
    const to = this.state.fort.ghTier + 1;
    if (GH_THRESHOLDS[to] === undefined) return null;
    const cost = ghUpgradeCost(to);
    return { action: 'gh', tier: to, cost, label: `Raise the Great Hall to T${to} · ${cost}g`, block: this.ghBlock()?.reason ?? null };
  }

  /** the card's own refusal for a room, before any question of free places (null = it could go) */
  private roomRefusal(room: Room, card: Card): string | null {
    const rt = ROOM_TYPE[room.type]!;
    const kind = this.roomKind(room);
    if (!kind) return rt.species === 'capacity' ? 'cells hold captives by themselves — accepted captives already count here'
      : rt.species === 'comfort' ? this.noEffectReason(room) : `the ${rt.name} has no places`;
    if (card.character && card.character.role !== 'captive') return 'soldiers never staff rooms';
    if (kind === 'rack') {
      if (card.character?.role !== 'captive') return 'captives only';
      if (hasTag(card.tags, 'obedient')) return 'raw captives only — already tamed';
      const b = this.state.breaking.find(x => x.cardId === card.id);
      if (b) return `already on the rack — tamed by cycle ${b.doneAtCycle}`;
      return null;
    }
    if (card.character?.role === 'captive' && !hasTag(card.tags, 'obedient')) return 'tamed captives only — break them on a rack first';
    if (!acceptsCard(slotAccepts(room), card.tags)) return `the ${rt.name} doesn't take this kind`;
    return null;
  }

  /** what `read` says after `move` runs on the slots of `rooms` — the move is made for real on
   *  those slot arrays and reverted, so a preview can never drift from what the engine reads.
   *  Only the rooms a move can touch are snapshotted (a late fort previews thousands of moves). */
  private previewSlots<T>(rooms: Room[], move: () => void, read: () => T): T {
    const snap = rooms.map(r => [...r.slots]);
    try { move(); return read() } finally { rooms.forEach((r, i) => { r.slots = snap[i]! }) }
  }
  /** what one room adds to global prestige — globalPrestige is exactly the sum of these, and a
   *  room's comfort reads only its own places (+ its neighbours' TYPES), so a move changes prestige
   *  by the change in the rooms it touches */
  private prestigeOf(room: Room, comfort?: number): number {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.benefit !== 'prestige' && !rt.smallPrestige) return 0;
    const c = comfort ?? this.comfort(room);
    return rt.benefit === 'prestige' ? c : 0.25 * c;
  }

  /** the slot-level half of a move: card into room[idx]; an occupant goes to the card's old room
   *  place when it may legally sit there (a true swap), else back to the hand. Returns where the
   *  displaced card went (null = no occupant). Used by BOTH the preview and setInRoom. */
  private moveSlots(card: Card, room: Room, idx: number): { displaced: string | null; to: { roomId: string; slot: number } | null } {
    const src = card.location.kind === 'room' ? { room: this.room(card.location.roomId), slot: card.location.slot } : null;
    const occupant = room.slots[idx] ?? null;
    if (src?.room) src.room.slots[src.slot] = null;
    room.slots[idx] = card.id;
    if (!occupant) return { displaced: null, to: null };
    const oc = this.card(occupant);
    if (oc && src?.room && this.roomKind(src.room) !== 'rack' && src.room.slots[src.slot] === null && canSlot(src.room, oc)) {
      src.room.slots[src.slot] = occupant;
      return { displaced: occupant, to: { roomId: src.room.id, slot: src.slot } };
    }
    return { displaced: occupant, to: null };
  }

  /** plan the best move of `card` into `room` (or into place `slotIdx`) — the ONE planner behind
   *  roomPlacementsFor (every row), roomSlotPlans (every place) and setInRoom (every move), so a
   *  row that says ok is a move the engine makes, and its prestigeAfter is what prestige() reads
   *  after it. `pBefore` = prestige() now (a caller planning many moves passes it once). */
  private planRoomMove(room: Room, card: Card, slotIdx?: number, pBefore = this.prestige()): RoomPlacement {
    const rt = ROOM_TYPE[room.type]!;
    const kind = this.roomKind(room) ?? 'function';
    const wants = this.effectiveWants(room);
    const matched = [...new Set(card.tags.filter(t => wants.some(w => queryMatches([t], w))).map(t => t.concept))];
    const cBefore = this.comfort(room);
    const base: RoomPlacement = {
      roomId: room.id, roomName: rt.name, roomType: room.type, kind, idx: null, swapWith: null, swapWithName: null,
      ok: false, reason: null, fix: null, here: card.location.kind === 'room' && card.location.roomId === room.id,
      breaksAtCycle: null, prestigeBefore: pBefore, prestigeAfter: pBefore, comfortBefore: cBefore, comfortAfter: cBefore,
      gain: 0, effectAfter: null, matched, label: '', badge: '', tone: 'neutral',
    };
    const refuse = (reason: string, fix: Fix | null = null): RoomPlacement => ({ ...base, reason, fix, label: reason, badge: reason.split(' — ')[0]! });
    const why = this.roomRefusal(room, card);
    if (why) return refuse(why);
    if (!room.slots.length) return refuse(kind === 'rack' ? 'no racks yet — add one' : 'no places yet — add one', this.addPlaceFix(room));
    const src = card.location.kind === 'room' ? this.room(card.location.roomId) : undefined;
    const touched = src && src !== room ? [room, src] : [room];
    const others = touched.slice(1);
    const touchedBefore = this.prestigeOf(room, cBefore) + others.reduce((n, r) => n + this.prestigeOf(r), 0);
    const evalAt = (idx: number): RoomPlacement => {
      const occupant = room.slots[idx] ?? null;
      // the room's comfort read ONCE per preview, and every figure (its prestige, its effect) from it
      const [touchedAfter, cAfter, effectAfter] = this.previewSlots(touched, () => { this.moveSlots(card, room, idx) },
        () => { const c = this.comfort(room); return [this.prestigeOf(room, c) + others.reduce((n, r) => n + this.prestigeOf(r), 0), c, this.roomEffect(room, c)] as const });
      const pAfter = pBefore + (touchedAfter - touchedBefore);
      const occ = occupant ? this.card(occupant) : undefined;
      const breaksAtCycle = kind === 'rack' ? this.state.cycle + breakDuration(cAfter) : null;
      const gain = pAfter - pBefore;
      const signed = `${gain >= 0 ? '+' : '−'}${Math.abs(gain).toFixed(1)} prestige`;
      const moved = Math.abs(gain) > 0.05;
      // every kind says what the move does to prestige when it moves it — a function room's
      // "heals ×1.2" hid a −2.7 prestige move (the relic left a prestige room on the way)
      const effectLine = kind === 'rack' ? `tamed by cycle ${breaksAtCycle}`
        : kind === 'prestige' ? signed
        : moved ? `${effectAfter} · ${signed}` : effectAfter ?? '';
      const badge = kind === 'rack' ? `tamed by c${breaksAtCycle}` : kind === 'prestige' ? signed : moved ? signed : effectAfter ?? '';
      const tone: RoomPlacement['tone'] = kind === 'rack' ? 'good'
        : gain < -0.05 ? 'bad' : gain > 0.05 ? 'good'
        : kind === 'function' && cAfter - cBefore > 1e-9 ? 'good' : 'neutral';
      return {
        ...base, ok: true, idx, swapWith: occupant, swapWithName: occ?.name ?? null,
        breaksAtCycle, prestigeAfter: pAfter, comfortAfter: cAfter, gain, effectAfter,
        label: occ ? `swap for ${occ.name} · ${effectLine}` : effectLine, badge, tone,
      };
    };
    if (slotIdx !== undefined) {
      if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= room.slots.length) return refuse('no such place');
      if (room.slots[slotIdx] === card.id) return refuse('already there');
      const occ = room.slots[slotIdx];
      if (occ && kind === 'rack') return refuse(`that rack holds ${this.card(occ)?.name ?? 'someone'} — racks never swap (take them off first)`);
      return evalAt(slotIdx);
    }
    if (base.here && kind !== 'rack') return refuse('already here');
    const free = room.slots.findIndex(x => x === null);
    if (free >= 0) return evalAt(free);
    if (kind === 'rack') return refuse(`rack full ${room.slots.length}/${room.slots.length}`, this.addPlaceFix(room));
    // full: swap only when it GAINS (prestige rooms: prestige; function rooms: the room's comfort)
    let best: RoomPlacement | null = null;
    for (let i = 0; i < room.slots.length; i++) {
      const r = evalAt(i);
      const score = kind === 'prestige' ? r.gain : r.comfortAfter - cBefore;
      const bestScore = best ? (kind === 'prestige' ? best.gain : best.comfortAfter - cBefore) : -Infinity;
      if (score > bestScore) best = r;
    }
    const bestScore = best ? (kind === 'prestige' ? best.gain : best.comfortAfter - cBefore) : 0;
    // a drop on ONE place still swaps (roomSlotPlans says what that costs) — the room as a whole
    // just has no swap that gains
    if (!best || bestScore <= 1e-9) return refuse('full — no swap gains here (a place can still be swapped by hand)', this.addPlaceFix(room));
    return best;
  }

  /** every place of a room for one card — what dropping it on THAT place does (an occupied place
   *  swaps, and says what the swap costs). The fort drop overlay and the CLI `fit <card> <room>`. */
  roomSlotPlans(roomId: string, cardId: string): RoomPlacement[] {
    const room = this.room(roomId), card = this.card(cardId);
    if (!room || !card || !this.roomKind(room)) return [];
    const p = this.prestige();
    return room.slots.map((_, i) => this.planRoomMove(room, card, i, p));
  }

  /** the rooms of your fort a card to set could go, one row each, ok rows first then by gain.
   *  Racks are left out for a card already breaking. When nothing you own can take it, one row for
   *  a room you could BUILD that would (roomId null, fix = build). Cards that never sit in rooms
   *  (soldiers, stores) get []. Rooms whose places do nothing (roomKind null) are not rows. */
  roomPlacementsFor(cardId: string): RoomPlacement[] {
    const card = this.card(cardId);
    if (!card || card.location.kind === 'quest' || !this.isOwned(card)) return [];
    const isCaptive = card.character?.role === 'captive';
    if (!isCaptive && cardType(card) !== 'relic') return [];
    const breaking = this.state.breaking.some(b => b.cardId === cardId);
    const pNow = this.prestige();
    const rows = this.state.fort.rooms
      .filter(r => this.roomKind(r) && !(breaking && this.roomKind(r) === 'rack'))
      .map(r => this.planRoomMove(r, card, undefined, pNow));
    rows.sort((a, b) => Number(b.ok) - Number(a.ok) || b.gain - a.gain || (b.comfortAfter - b.comfortBefore) - (a.comfortAfter - a.comfortBefore));
    if (!rows.some(r => r.ok) && !breaking) {
      const raw = isCaptive && !hasTag(card.tags, 'obedient');
      const own = (pred: (rt: (typeof ROOM_TYPES)[number]) => boolean) => this.state.fort.rooms.some(r => pred(ROOM_TYPE[r.type]!));
      let type: string | null = null;
      if (raw && !own(rt => rt.benefit === 'break')) type = 'torture-chamber';
      else if (!raw && !own(rt => rt.benefit === 'prestige')) type = this.bestPrestigeBuild(card);
      if (type) {
        const rt = ROOM_TYPE[type]!;
        rows.push({
          roomId: null, roomName: rt.name, roomType: type, kind: rt.benefit === 'break' ? 'rack' : 'prestige', idx: null,
          swapWith: null, swapWithName: null, ok: false, reason: `no ${rt.name} yet`, fix: this.buildFix(type), here: false,
          breaksAtCycle: null, prestigeBefore: pNow, prestigeAfter: pNow, comfortBefore: 0, comfortAfter: 0, gain: 0,
          effectAfter: null, matched: [], label: `no ${rt.name} yet`, badge: `no ${rt.name} yet`, tone: 'neutral',
        });
      }
    }
    return rows;
  }
  /** the prestige room you could build now (or once you dig / save up) that would want this card
   *  most — or, with no card, the cheapest one */
  private bestPrestigeBuild(card?: Card): string | null {
    const cands = this.buildableTypes()
      .filter(b => ROOM_TYPE[b.type]!.benefit === 'prestige' && (!b.blocker || b.blocker === 'gold' || b.blocker === 'cell'))
      .map(b => ({ type: b.type, cost: b.cost, fit: card ? fillScore(card.tags, defaultWants(ROOM_TYPE[b.type]!, null)) : 0 }))
      .sort((x, y) => y.fit - x.fit || x.cost - y.cost);
    return cands[0]?.type ?? null;
  }

  /** THE PLACE TO MAKE for a card nothing will take — its rack for a raw captive, else a prestige
   *  room before a function room; a place you can afford before one you can't, then the cheapest.
   *  The ONE choice behind the next-steps scroll, the prisoner hub and the CLI Dungeon view. */
  placeFixFor(cardId: string, rows = this.roomPlacementsFor(cardId)): { roomId: string | null; roomName: string; fix: Fix } | null {
    if (rows.some(r => r.ok)) return null;
    const rank = (k: RoomKind) => k === 'rack' || k === 'prestige' ? 0 : 1;
    const act = (r: RoomPlacement) => r.fix && 'action' in r.fix ? r.fix : null;
    // a place you can buy (a place, a room) before a Great Hall raise; one you can afford first
    const best = rows.filter(r => !!act(r))
      .sort((a, b) => rank(a.kind) - rank(b.kind) || Number(act(a)!.action === 'gh') - Number(act(b)!.action === 'gh')
        || Number(!!act(a)!.block) - Number(!!act(b)!.block) || act(a)!.cost - act(b)!.cost)[0];
    return best ? { roomId: best.roomId, roomName: best.roomName, fix: best.fix! } : null;
  }

  /** every card you could set in this room, ranked — the room panel's candidates and the CLI's
   *  `room <id>` list (the same rows roomPlacementsFor gives each card, for this one room) */
  roomCandidates(roomId: string): (RoomPlacement & { cardId: string; name: string })[] {
    const room = this.room(roomId);
    if (!room || !this.roomKind(room)) return [];
    const p = this.prestige();
    return this.state.cards
      .filter(c => (c.character?.role === 'captive' || cardType(c) === 'relic') && c.location.kind !== 'quest' && this.isOwned(c))
      .filter(c => !(c.location.kind === 'room' && c.location.roomId === roomId))
      .map(c => ({ ...this.planRoomMove(room, c, undefined, p), cardId: c.id, name: c.name }))
      .filter(r => r.reason !== 'soldiers never staff rooms')
      .sort((a, b) => Number(b.ok) - Number(a.ok) || b.gain - a.gain || (b.comfortAfter - b.comfortBefore) - (a.comfortAfter - a.comfortBefore));
  }

  /** SET A CARD IN A ROOM — the one path for the fort drop, the sheet's "Set them in", the armed
   *  hand, `slot` and the CLI `setin`. Without a place: the first free one, else (prestige and
   *  function rooms) a swap with the occupant whose replacement gains the most, only if it gains.
   *  With a place: exactly that one, swapping its occupant (the occupant takes the card's old
   *  place when it legally can, else goes back to the hand). Racks NEVER swap. */
  setInRoom(roomId: string, cardId: string, slotIdx?: number): { ok: boolean; msg: string; warn?: boolean } {
    const room = this.room(roomId);
    const card = this.card(cardId);
    if (!room) return { ok: false, msg: 'no such room' };
    if (!card) return { ok: false, msg: 'no such card' };
    if (card.location.kind === 'quest') return { ok: false, msg: `${card.name} is on a quest` };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours yet (staged cards must be accepted first)' };
    const plan = this.planRoomMove(room, card, slotIdx !== undefined && Number.isFinite(slotIdx) ? slotIdx : undefined);
    if (!plan.ok || plan.idx === null) return { ok: false, msg: plan.fix && 'label' in plan.fix ? `${plan.reason} (${plan.fix.label})` : plan.reason ?? 'refused' };
    const rt = ROOM_TYPE[room.type]!;
    const effBefore = this.roomEffect(room);
    const srcName = this.whereName(card.id);
    const moved = this.moveSlots(card, room, plan.idx);
    card.location = { kind: 'room', roomId, slot: plan.idx };
    let swapLine = '';
    if (moved.displaced) {
      const oc = this.card(moved.displaced)!;
      if (moved.to) {
        oc.location = { kind: 'room', roomId: moved.to.roomId, slot: moved.to.slot };
        swapLine = ` (in place of ${oc.name}, who moves to the ${srcName ?? 'old room'})`;
      } else {
        oc.location = HELD(cardType(oc) === 'relic' ? 'inventory' : 'roster');
        swapLine = ` (in place of ${oc.name}, back ${cardType(oc) === 'relic' ? 'in your stores' : 'to the cells'})`;
      }
    }
    if (plan.kind === 'rack') {
      // one breaking entry per captive, ever (a second one doubled the "is broken" line and the tag)
      this.state.breaking = this.state.breaking.filter(b => b.cardId !== card.id);
      const done = this.state.cycle + breakDuration(this.comfort(room));
      this.state.breaking.push({ cardId: card.id, roomId, doneAtCycle: done, startCycle: this.state.cycle });
      const n = done - this.state.cycle;
      return { ok: true, msg: `${card.name} on the rack in the ${rt.name} — tamed at c${done} (${n} cycle${n === 1 ? '' : 's'})` };
    }
    const pAfter = this.prestige();
    const change = plan.kind === 'prestige' || Math.abs(pAfter - plan.prestigeBefore) > 0.05
      ? `prestige ${plan.prestigeBefore.toFixed(1)} → ${pAfter.toFixed(1)}`
      : `${effBefore || 'nothing'} → ${this.roomEffect(room)}`;
    const warn = pAfter < plan.prestigeBefore - 1e-9;
    return { ok: true, msg: `${card.name} set in the ${rt.name}${swapLine} — ${change}`, ...(warn ? { warn } : {}) };
  }

  /** what emptying one place would cost: prestige lost, and the room's effect after */
  slotShare(roomId: string, slotIdx: number): { prestige: number; effectAfter: string } | null {
    const room = this.room(roomId);
    if (!room || !room.slots[slotIdx]) return null;
    const before = this.prestigeOf(room);
    const [after, eff] = this.previewSlots([room], () => { room.slots[slotIdx] = null }, () => [this.prestigeOf(room), this.roomEffect(room)] as const);
    return { prestige: Math.max(0, before - after), effectAfter: eff };
  }

  /** take a card out of a room place, back to the hand — saying honestly what it cost. Off a rack
   *  it wipes the breaking (R1: both UIs confirm first, with rackLoss()). */
  unslot(roomId: string, slotIdx: number): { ok: boolean; msg: string; warn?: boolean } {
    const room = this.room(roomId);
    if (!room || !room.slots[slotIdx]) return { ok: false, msg: 'nothing there' };
    const card = this.card(room.slots[slotIdx]!);
    const rt = ROOM_TYPE[room.type]!;
    const pBefore = this.prestige(), effBefore = this.roomEffect(room);
    const loss = card ? this.rackLoss(card.id) : null;
    room.slots[slotIdx] = null;
    if (!card) return { ok: true, msg: 'freed' };
    card.location = HELD(cardType(card) === 'relic' ? 'inventory' : 'roster');
    this.state.breaking = this.state.breaking.filter(b => b.cardId !== card.id);
    if (loss) return { ok: true, msg: `${card.name} off the rack — ${loss}`, warn: true };
    const pAfter = this.prestige();
    const change = Math.abs(pAfter - pBefore) > 0.05 || this.roomKind(room) === 'prestige'
      ? `prestige ${pBefore.toFixed(1)} → ${pAfter.toFixed(1)}` : `${effBefore} → ${this.roomEffect(room)}`;
    return { ok: true, msg: `${card.name} out of the ${rt.name} — ${change}` };
  }

  /** what cashing out (ransom / sell) a card that sits in a room throws away — the prestige it was
   *  earning, or the room's effect — said BEFORE the click (both UIs confirm on it) and in the
   *  result. null when it is not in a room, or its going changes nothing. A card on a RACK says
   *  rackLoss() instead. */
  cashOutLoss(cardId: string): string | null {
    const card = this.card(cardId);
    if (card?.location.kind !== 'room' || this.state.breaking.some(b => b.cardId === cardId)) return null;
    const room = this.room(card.location.roomId);
    if (!room || room.slots[card.location.slot] !== cardId) return null;
    const slot = card.location.slot;
    const pBefore = this.prestige(), before = this.prestigeOf(room), effBefore = this.roomEffect(room);
    const [after, effAfter] = this.previewSlots([room], () => { room.slots[slot] = null }, () => [this.prestigeOf(room), this.roomEffect(room)] as const);
    const pAfter = pBefore + (after - before);
    if (Math.abs(pAfter - pBefore) > 0.05) return `prestige ${pBefore.toFixed(1)} → ${pAfter.toFixed(1)}`;
    if (effBefore !== effAfter) return `the ${ROOM_TYPE[room.type]!.name}: ${effBefore || 'nothing'} → ${effAfter || 'nothing'}`;
    return null;
  }

  private unslotCard(card: Card) {
    if (card.location.kind === 'room') {
      const r = this.room(card.location.roomId);
      if (r) r.slots[card.location.slot] = null;
    }
  }

  /** the rooms that give prestige, biggest first (the prestige bar's breakdown) */
  prestigeSources(): { roomId: string; name: string; prestige: number; effect: string }[] {
    return this.state.fort.rooms.map(r => {
      const rt = ROOM_TYPE[r.type]!;
      const p = rt.benefit === 'prestige' ? this.comfort(r) : rt.smallPrestige ? 0.25 * this.comfort(r) : 0;
      return { roomId: r.id, name: rt.name, prestige: p, effect: this.roomEffect(r) };
    }).filter(x => x.prestige > 0 || ROOM_TYPE[this.room(x.roomId)!.type]!.benefit === 'prestige')
      .sort((a, b) => b.prestige - a.prestige);
  }

  setFocus(mercId: string, focus: Card['character'] extends undefined ? never : NonNullable<Card['character']>['focus']): { ok: boolean; msg: string } {
    const c = this.card(mercId);
    if (!c?.character) return { ok: false, msg: 'no such merc' };
    c.character.focus = focus;
    return { ok: true, msg: `${c.name}'s training focus set` };
  }

  // ---- staging (GAME_STATE §6) -------------------------------------------------------------------

  hire(cardId: string): { ok: boolean; msg: string } {
    const block = this.hireBlock(cardId);
    if (block) return { ok: false, msg: block.reason };
    const card = this.card(cardId)!;
    const cost = this.hireQuote(cardId)!;   // a won finale focal is already paid for
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    card.character!.role = 'merc';
    card.location = HELD('roster');
    this.state.tavern = this.state.tavern.filter(s => s.cardId !== cardId);
    this.ensureLoreNode(card);
    this.spawnPersonalChainLead(card);
    this.log('hire', `${card.name} joins the company.`);
    return { ok: true, msg: `${card.name} hired (${cost}g)` };
  }

  acceptCaptive(cardId: string): { ok: boolean; msg: string } {
    const block = this.acceptBlock(cardId);
    if (block) return { ok: false, msg: block.reason };
    const card = this.card(cardId)!;
    card.location = HELD('roster');
    this.state.holding = this.state.holding.filter(s => s.cardId !== cardId);
    this.ensureLoreNode(card);
    // STORY_ENGINE §5 trigger 2 (built 2026-07-10): a captive joining SOMETIMES stirs a story
    // (🛠 rate) — their past does not stay outside the walls
    if (this.rng.chance(0.3)) this.spawnPersonalChainLead(card);
    return { ok: true, msg: `${card.name} moved to the cells (${this.captives().length}/${this.captiveCapacity()})` };
  }

  /** ownership boundary — dispositions apply only to cards that are actually YOURS
   *  (staged candidates must be accepted; limbo focals aren't yours until delivered) */
  private isOwned(card: Card): boolean {
    if (card.location.kind === 'room') return true;
    if (card.location.kind === 'quest') return true;
    return card.location.kind === 'held' &&
      (card.location.state === 'roster' || card.location.state === 'inventory');
  }

  // ---- quotes & blocks: a button shows its true number and its refusal BEFORE the click --------
  // ONE formula each, shared with the action that pays it (the board once showed value×rate while
  // the engine paid cashValue(value)×rate — 42g shown, 30g paid).

  /** what ransoming this captive pays now (owned or in holding), or null */
  ransomQuote(id: string): number | null {
    const card = this.card(id);
    if (card?.character?.role !== 'captive') return null;
    if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === id)) return null;
    const office = this.state.fort.rooms.find(r => r.type === 'ransom-office');
    const rate = office ? ransomRate(this.comfort(office)) : RANSOM_RATE;
    return Math.round(cashValue(card.value) * rate);
  }
  /** what selling this captive or relic pays now, or null */
  sellQuote(id: string): number | null {
    const card = this.card(id);
    if (!card) return null;
    if (card.character?.role === 'captive') {
      if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === id)) return null;
      return Math.round(cashValue(card.value) * SELL_RATE);
    }
    if (cardType(card) !== 'relic' || !this.isOwned(card) || card.location.kind === 'quest') return null;
    const market = this.state.fort.rooms.find(r => r.type === 'market');
    const rate = market ? marketSellRate(this.comfort(market)) : SELL_RATE;
    return Math.round(cashValue(card.value) * rate);
  }
  /** what a holding candidate fetches if their clock runs out (the quick price), or null */
  lapseQuote(id: string): number | null {
    const card = this.card(id);
    if (!card || !this.state.holding.some(s => s.cardId === id)) return null;
    return Math.round(cashValue(card.value) * SELL_RATE);
  }
  /** a holding captive's clock in the player's words — the END that runs `cycle` up to the
   *  expiry hands them off, so the last cycle you can decide in is expires−1 ('handed off at this
   *  END' | 'handed off in 2 cycles'). Every surface prints THIS, never its own date maths. */
  holdingDeadline(cardId: string): string | null {
    const h = this.state.holding.find(s => s.cardId === cardId);
    if (!h) return null;
    const left = h.expiresAtCycle - this.state.cycle;
    return left <= 1 ? 'handed off at this END' : `handed off in ${left} cycles`;
  }
  /** a tavern guest's clock, the same way ('leaves at this END' | 'leaves in 3 cycles' | null for a
   *  prepaid prize, who waits) */
  tavernDeadline(cardId: string): string | null {
    const t = this.state.tavern.find(s => s.cardId === cardId);
    if (!t || t.prepaid) return null;
    const left = t.expiresAtCycle - this.state.cycle;
    return left <= 1 ? 'leaves at this END' : `leaves in ${left} cycles`;
  }
  /** what hiring this tavern guest costs (0 for a prepaid finale prize), or null */
  hireQuote(id: string): number | null {
    const staged = this.state.tavern.find(s => s.cardId === id);
    const card = this.card(id);
    if (!staged || !card) return null;
    return staged.prepaid ? 0 : hireCost(card.value);
  }

  /** why "To the cells" can't run, with the fix — null when it can */
  acceptBlock(cardId: string): Block | null {
    if (!this.state.holding.some(s => s.cardId === cardId) || !this.card(cardId)) return { reason: 'not in holding', fix: null };
    if (!this.hasRoom('dungeon')) return { reason: 'no Dungeon — build one', fix: this.buildFix('dungeon') };
    const n = this.captives().length, cap = this.captiveCapacity();
    if (n >= cap) return { reason: cap ? `cells full ${n}/${cap}` : 'no cells yet', fix: this.buildFix('dungeon-cell') };
    return null;
  }
  /** why "Hire" can't run, with the fix — null when it can */
  hireBlock(cardId: string): Block | null {
    if (!this.hasRoom('tavern')) return { reason: 'no Tavern — build one', fix: this.buildFix('tavern') };
    const cost = this.hireQuote(cardId);
    if (cost === null) return { reason: 'not at the tavern', fix: null };
    const n = this.roster().length, cap = this.rosterCapacity();
    if (n >= cap) return { reason: `roster full ${n}/${cap} — a soldier's own bedroom adds one`, fix: { screen: 'build', id: 'bedroom', label: 'Build a bedroom for a soldier' } };
    if (this.gold() < cost) return { reason: `costs ${cost}g (short ${cost - this.gold()}g)`, fix: null };
    return null;
  }
  /** why the Great Hall can't be raised now, with the fix — null when it can */
  ghBlock(): Block | null {
    const to = this.state.fort.ghTier + 1;
    const need = GH_THRESHOLDS[to];
    if (need === undefined) return { reason: 'the Great Hall is at its final tier', fix: null };  // (!need read a 0 threshold as "final")
    const p = this.prestige();
    if (p < need) {
      // no prestige room yet: the fix is BUILDING one (the scroll never named one and the goal sat
      // at 0.0 for five cycles of following it)
      const owned = this.state.fort.rooms.some(r => ROOM_TYPE[r.type]!.benefit === 'prestige');
      const type = owned ? null : this.bestPrestigeBuild();
      return { reason: `needs prestige ${need} (have ${p.toFixed(1)})`,
        fix: type ? this.buildFix(type) : { screen: 'fort', label: 'Set relics and tamed captives in prestige rooms' } };
    }
    const cost = ghUpgradeCost(to);
    if (this.gold() < cost) return { reason: `costs ${cost}g (short ${cost - this.gold()}g)`, fix: null };
    return null;
  }
  /** the Great Hall goal, whole: the next tier, what it needs, what it opens */
  ghInfo(): { tier: number; next: number | null; need: number | null; have: number; cost: number | null; gold: number; ready: boolean; block: string | null; unlocks: { type: string; name: string }[] } {
    const tier = this.state.fort.ghTier;
    const next = GH_THRESHOLDS[tier + 1] === undefined ? null : tier + 1;
    const block = this.ghBlock();
    return {
      tier, next, need: next ? GH_THRESHOLDS[next]! : null, have: this.prestige(),
      cost: next ? ghUpgradeCost(next) : null, gold: this.gold(), ready: !block, block: block?.reason ?? null,
      unlocks: next ? ROOM_TYPES.filter(rt => rt.ghTier === next && rt.id !== 'great-hall' && rt.roomKind !== 'endgame').map(rt => ({ type: rt.id, name: rt.name })) : [],
    };
  }

  /** a wound's cost on every roll, in coins (the injury term of the roll, at their level) */
  woundPenalty(mercId: string): number {
    const ch = this.card(mercId)?.character;
    if (!ch || ch.injuryTiers <= 0) return 0;
    return Math.round(ch.injuryTiers * INJURY_FRAC * U(ch.level) * 10) / 10;
  }

  ransom(captiveId: string): { ok: boolean; msg: string; warn?: boolean } {
    const card = this.card(captiveId);
    if (card?.character?.role !== 'captive') return { ok: false, msg: 'not a captive' };
    // owned captives AND holding candidates — "ransom now" is half the holding decision (§6)
    if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === captiveId))
      return { ok: false, msg: 'not yours to ransom (accept them first)' };
    const pay = this.ransomQuote(captiveId)!;
    const loss = this.rackLoss(captiveId) ?? this.cashOutLoss(captiveId);
    this.unslotCard(card);
    card.location = HELD('lore');   // gone from play, alive in the world
    this.state.holding = this.state.holding.filter(s => s.cardId !== captiveId);
    this.state.breaking = this.state.breaking.filter(b => b.cardId !== captiveId);
    this.addGold(pay);
    this.log('ransom', `${card.name} ransomed for ${pay}g.`);
    return { ok: true, msg: `${card.name} ransomed: +${pay}g${loss ? ` · ${loss}` : ''}`, ...(loss ? { warn: true } : {}) };
  }

  sell(id: string): { ok: boolean; msg: string; warn?: boolean } {
    const card = this.card(id);
    if (!card) return { ok: false, msg: 'no such card' };
    // captive disposition (DESIGN/GAME_STATE §6): sell = the slaver's price, below ransom's —
    // no office needed, no questions asked; the person leaves play but lives on in lore
    if (card.character?.role === 'captive') {
      if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === id))
        return { ok: false, msg: 'not yours to sell (accept them first)' };
      const pay = this.sellQuote(id)!;
      const loss = this.rackLoss(id) ?? this.cashOutLoss(id);
      this.unslotCard(card);
      card.location = HELD('lore');
      this.state.holding = this.state.holding.filter(s => s.cardId !== id);
      this.state.breaking = this.state.breaking.filter(b => b.cardId !== id);
      this.addGold(pay);
      this.log('sell', `${card.name} sold for ${pay}g.`);
      return { ok: true, msg: `${card.name} sold: +${pay}g${loss ? ` · ${loss}` : ''}`, ...(loss ? { warn: true } : {}) };
    }
    if (cardType(card) !== 'relic') return { ok: false, msg: 'not a relic or captive' };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours to sell' };
    const pay = this.sellQuote(id)!;
    const loss = this.cashOutLoss(id);
    this.unslotCard(card);
    this.state.cards = this.state.cards.filter(c => c.id !== id);
    this.addGold(pay);
    return { ok: true, msg: `${card.name} sold: +${pay}g${loss ? ` · ${loss}` : ''}`, ...(loss ? { warn: true } : {}) };
  }

  /** what settling this debt costs (the one formula payOffLiability pays), or null */
  settleQuote(id: string): number | null {
    const card = this.card(id);
    if (!card || !isLiability(card)) return null;
    return Math.round(Math.abs(card.value) * (card.qty ?? 1));
  }
  payOffLiability(id: string): { ok: boolean; msg: string } {
    const card = this.card(id);
    if (!card || !isLiability(card)) return { ok: false, msg: 'not a liability' };
    const cost = this.settleQuote(id)!;
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g to settle` };
    this.state.cards = this.state.cards.filter(c => c.id !== id);
    delete this.state.liabilityBirth[id];
    this.log('liability', `Settled: ${card.name} (${cost}g).`);
    return { ok: true, msg: `${card.name} settled (${cost}g)` };
  }

  interrogate(captiveId: string): { ok: boolean; msg: string } {
    const room = this.state.fort.rooms.find(r => r.type === 'interrogation');
    if (!room) return { ok: false, msg: 'build an Interrogation room' };
    const card = this.card(captiveId);
    if (card?.character?.role !== 'captive') return { ok: false, msg: 'not a captive' };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours to question (accept them first)' };
    if (hasTag(card.tags, 'interrogated')) return { ok: false, msg: 'already interrogated' };
    // priced per-captive action (🛠 INTERROGATE_COST — ledgered)
    const cost = Math.round(INTERROGATE_BASE + card.value * INTERROGATE_FRAC);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    card.tags.push({ concept: 'interrogated' });
    const lead = this.freshLead('interrogation');
    // the room's comfort IS its benefit (FORT §5: leads only) — good comfort loosens tongues:
    // a chance to upgrade the lead's rarity one step
    if (this.rng.chance(this.interrogateLift(this.comfort(room)))) {
      if (lead.rarity === 'common') lead.rarity = 'uncommon';
      else if (lead.rarity === 'uncommon') lead.rarity = 'rare';
    }
    this.state.leads.push(lead);
    this.log('interrogate', `${card.name} talks: a ${lead.rarity} ${lead.archetype} lead in ${REGION[lead.region]!.name}.`);
    return { ok: true, msg: 'they talked' };
  }

  payHeal(mercId: string): { ok: boolean; msg: string } {
    if (!this.hasRoom('hospital')) return { ok: false, msg: 'build the Hospital' };
    const c = this.card(mercId);
    if (!c?.character || c.character.injuryTiers <= 0) return { ok: false, msg: 'not injured' };
    if (!this.isOwned(c)) return { ok: false, msg: 'not one of yours' };
    const cost = payHealCost(c.character.injuryTiers, vBase(c.character.level));
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    c.character.injuryTiers = 0;
    return { ok: true, msg: `${c.name} healed (${cost}g)` };
  }

  // ---- leads & pursue ------------------------------------------------------------------------------

  private leadCtx() {
    return {
      cycle: this.state.cycle,
      unlockedRegions: this.activeRegions(),
      ghTier: this.state.fort.ghTier,
      rosterLevels: this.roster().map(m => m.character!.level),
      hasDungeon: this.hasRoom('dungeon'),
      recentArchetypes: this.recentLeadArchetypes,
    };
  }

  /** 🛠 2026-07-10 premise-variety: recently dealt archetypes rotate out of the next roll */
  private recentLeadArchetypes: Archetype[] = [];
  /** EVERY path that mints a lead records here, or the window silently stops covering it — the
   *  starter drip read the window for twenty cycles without ever writing to it, so the early
   *  game (the one stretch where every card is a first impression) was the only place archetypes
   *  could repeat freely. The size DERIVES from the pool: a hardcoded 20, written for a ~100-row
   *  pool, became larger than the whole board when the pool went back to 22, at which point the
   *  filter matches nothing and either pins one archetype or falls through entirely. */
  private noteLeadArchetype(a: Archetype): void {
    this.recentLeadArchetypes.push(a);
    const window = Math.max(3, Math.floor(ARCHETYPE_NAMES.length / 3));
    while (this.recentLeadArchetypes.length > window) this.recentLeadArchetypes.shift();
  }
  private freshLead(source: Lead['source'], bonus = 0): Lead {
    const l = rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), source);
    if (bonus > 0) l.bonus = Math.round(bonus);
    this.noteLeadArchetype(l.archetype);
    return l;
  }

  visibleLeads(): Lead[] {
    if (!this.hasRoom('map-room')) return [];
    // the day-0 packet is visible pre-Lead-room, as are STANDING faucets (posted at their own
    // buildings) and EARNED reward leads — a "+ lead" the player was paid must never be
    // invisible (a reader saw one expire unseen behind the Lead-room gate)
    // the recruiting faucet PAUSES while the tavern queue is already deep (🛠 2026-07-11:
    // ~50 rescuees walked out unhired in one long campaign — dead "may join" promises)
    const paused = (l: Lead) => l.source === 'recruiting' && this.state.tavern.length >= 3;
    // A saga the player already took is not news from the board — its next step must never hide
    // behind the Lead room. It did: the day-0 packet deals a ✦STORY lead pre-Lead-room, beat 1
    // resolved, and beat 2's continuation sat invisible, so the saga silently stalled for the ~14
    // cycles the median opening takes to build one (playtest 2026-09-25).
    if (!this.hasRoom('lead-room'))
      return this.state.leads.filter(l => !paused(l) && (l.source === 'starter' || l.source === 'reward'
        || l.source === 'continuation' || l.expiresAtCycle === null));
    return this.state.leads.filter(l => !paused(l));
  }

  /** leads the player has EARNED but cannot read until a Lead room stands — the gate is the design
   *  (FORT §5), silence about it was not: a lead-hunt printed "🧭 The sweep pays: 2 new lead(s)"
   *  twice and the player saw nothing, and a new hire's personal saga sat unseen (playtest 2026-09-25) */
  leadsAwaitingLeadRoom(): number {
    if (!this.hasRoom('map-room') || this.hasRoom('lead-room')) return 0;
    const shown = new Set(this.visibleLeads().map(l => l.id));
    return this.state.leads.filter(l => !shown.has(l.id) && !(l.source === 'recruiting' && this.state.tavern.length >= 3)).length;
  }

  /** UNCHANGED to every caller (TEMPO I11): the work-to-completion path `npm test`, the §20 sim
   *  baselines, realplay/autoplay and the CLI's batch mode all drive. It becomes a job like any
   *  other pursuit, but starts IMMEDIATELY — cap or no cap — so a scripted caller can never
   *  deadlock behind queued player work. */
  async pursue(leadId: string): Promise<{ ok: boolean; msg: string; questId?: string }> {
    const res = this.reservePursue(leadId);
    if (!res.lead) return { ok: false, msg: res.msg };
    const rec = this.addJob(res.lead);
    await this.startJob(rec);
    if (rec.thrown) throw rec.thrown;   // exactly what the old straight-line pursue did
    return rec.result ?? { ok: false, msg: rec.job.error ?? 'the writing failed' };
  }

  // ---- the pursuit queue (TEMPO G1) ----------------------------------------------------------
  // Split in two: a SYNCHRONOUS half that guards and reserves at the click (P2/I6), and an async
  // half that spends nothing until a quest exists (P3). Between them sits the queue.

  /** 🛠 P8/R5 (designer, 2026-08-26): the cap is a TECHNICAL setting — the player's own AI bill is
   *  the throttle — so it is raisable at runtime and NEVER rations queueing. */
  maxInFlight = Math.max(1, Number(process.env.AIRAIDER_MAX_INFLIGHT ?? 5) || 5);
  private jobRecs: JobRec[] = [];
  private jobSeq = 0;
  private inFlight = 0;
  /** leadIds a live job holds: not pursuable twice, and doEndCycle may not expire them (I6) */
  /** earned leads minted before this cycle's narration, by quest id */
  private preMintedLeads = new Map<string, Lead[]>();
  private reserved = new Set<string>();

  /** queued + running + recently finished, oldest first */
  jobs(): Job[] { return this.jobRecs.map(r => ({ ...r.job })) }
  private settleSeq = 0;
  /** the last settle number handed out (0 before any job settles) — a surface starts from here */
  arrivalSeq(): number { return this.settleSeq }
  /** ARRIVALS: every job that settled after `afterSeq`, in settle order — the ONE rule both UIs
   *  announce by (a job that finishes between two looks is still announced, once) */
  arrivals(afterSeq: number): Job[] {
    return this.jobs().filter(j => (j.seq ?? 0) > afterSeq).sort((a, b) => a.seq! - b.seq!);
  }

  /** leads held by live work — the auditor cross-checks this against jobs() (I12) */
  reservedLeads(): string[] { return [...this.reserved] }

  /** returns IMMEDIATELY (P1): the guards and the reservation are synchronous, the writing is not */
  enqueuePursue(leadId: string): { ok: boolean; msg: string; jobId?: string } {
    const res = this.reservePursue(leadId);
    if (!res.lead) return { ok: false, msg: res.msg };
    const rec = this.addJob(res.lead);
    this.pump();
    return { ok: true, msg: `the map table takes it up: ${rec.job.title}`, jobId: rec.job.id };
  }

  /** P5: queued work can be dropped. A running job cannot — its call is already out. */
  cancelJob(id: string): { ok: boolean; msg: string } {
    const rec = this.jobRecs.find(r => r.job.id === id);
    if (!rec) return { ok: false, msg: 'no such job' };
    if (rec.job.state === 'running') return { ok: false, msg: 'already being written' };
    if (rec.job.state !== 'queued') return { ok: false, msg: 'already finished' };
    this.jobRecs = this.jobRecs.filter(r => r !== rec);
    this.reserved.delete(rec.job.leadId);
    rec.settle();
    return { ok: true, msg: `dropped: ${rec.job.title}` };
  }

  /** resolves when nothing is queued or running (jobs never reject — a failure is a job STATE) */
  async drain(): Promise<void> {
    for (;;) {
      const live = this.jobRecs.filter(r => r.job.state === 'queued' || r.job.state === 'running');
      if (!live.length) return;
      await Promise.all(live.map(r => r.settled));
    }
  }

  /** the whole SYNCHRONOUS half of a pursuit: every guard, plus the reservation itself. It runs at
   *  the CLICK — today's duplicate guards read state written only AFTER the call, so they were
   *  blind for the whole 10–60s it took (I6). */
  /** every refusal a pursuit can meet, WITHOUT side effects — pursueBlock() and reservePursue()
   *  share it, so the board's disabled Pursue button and the click can never disagree */
  private pursueGuard(leadId: string): { msg: string; stale?: boolean } | null {
    const lead = this.visibleLeads().find(l => l.id === leadId);
    if (!lead) return { msg: 'no such lead' };
    if (this.reserved.has(lead.id)) return { msg: 'the map table is already working that lead' };
    if (lead.expiresAtCycle === null && this.state.quests.some(q => q.leadId === lead.id && q.state === 'open'))
      return { msg: 'that hunt is already underway' };
    if (lead.chainInfo.kind === 'continues') {
      const chain = this.state.chains.find(c => c.id === (lead.chainInfo as { chainId: string }).chainId);
      if (!chain || (chain.state !== 'active' && chain.state !== 'finale-pending'))
        return { msg: 'that story has already ended — the lead is stale', stale: true };
      if (this.state.quests.some(q => q.chainId === chain.id && q.state === 'open'))
        return { msg: 'that story already has an open quest' };
      // a beat still being WRITTEN is not yet an open quest — same guard, extended to work in
      // flight: two concurrent beats of one saga would race its record and its card cache
      if (this.state.leads.some(l => l.id !== lead.id && this.reserved.has(l.id)
        && l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === chain.id))
        return { msg: 'that story already has a step being written' };
    }
    return null;
  }

  /** why "Pursue" can't run for this lead, null when it can (with a fix pointing at the quest
   *  already on the board, when that is the reason) */
  pursueBlock(leadId: string): Block | null {
    const g = this.pursueGuard(leadId);
    if (!g) return null;
    const on = this.leadOnBoard(leadId);
    return { reason: g.msg, fix: on ? { screen: 'map', id: on, label: 'Open the quest on the map' } : null };
  }

  /** the open quest this lead's quest already is (standing posts and saga continuations), or null */
  private leadOnBoard(leadId: string): string | null {
    const lead = this.state.leads.find(l => l.id === leadId);
    if (!lead) return null;
    const direct = this.state.quests.find(q => q.state === 'open' && q.leadId === leadId);
    if (direct) return direct.id;
    if (lead.chainInfo.kind === 'continues') {
      const cid = (lead.chainInfo as { chainId: string }).chainId;
      return this.state.quests.find(q => q.state === 'open' && q.chainId === cid)?.id ?? null;
    }
    return null;
  }

  /** the regions in play — never empty (a fresh fort's home is the forests) */
  activeRegions(): string[] {
    return this.state.unlockedRegions.length ? [...this.state.unlockedRegions] : ['forests'];
  }

  /** THE LEADS BOARD in play order: saga continuations, then new stories, then what goes cold
   *  soonest, then standing posts — each with its block (null = pursuable), the quest it is
   *  already on the map as, and the map table's work on it */
  leadBoard(): { lead: Lead; blocked: string | null; onBoard: string | null; working: 'queued' | 'running' | null }[] {
    const working = new Map(this.jobRecs.filter(r => r.job.state === 'queued' || r.job.state === 'running').map(r => [r.job.leadId, r.job.state as 'queued' | 'running']));
    const rank = (l: Lead) => l.chainInfo.kind === 'continues' ? 0 : l.chainInfo.kind === 'starts-new' ? 1 : l.expiresAtCycle !== null ? 2 : 3;
    return this.visibleLeads()
      .map(l => ({ lead: l, blocked: this.pursueGuard(l.id)?.msg ?? null, onBoard: this.leadOnBoard(l.id), working: working.get(l.id) ?? null }))
      .sort((a, b) => rank(a.lead) - rank(b.lead) || (a.lead.expiresAtCycle ?? Infinity) - (b.lead.expiresAtCycle ?? Infinity));
  }

  /** R3: queue every pursuable lead (the map table's in-flight cap still paces the writing) */
  pursueAll(): { ok: boolean; msg: string; jobIds: string[] } {
    const jobIds: string[] = [];
    for (const row of this.leadBoard()) {
      if (row.blocked) continue;
      const r = this.enqueuePursue(row.lead.id);
      if (r.ok && r.jobId) jobIds.push(r.jobId);
    }
    return jobIds.length
      ? { ok: true, msg: `the map table takes up ${jobIds.length} lead${jobIds.length === 1 ? '' : 's'} (${Math.min(jobIds.length, this.maxInFlight)} at once)`, jobIds }
      : { ok: false, msg: 'nothing to pursue — every lead is underway or on the board', jobIds };
  }

  private reservePursue(leadId: string): { msg: string; lead?: Lead } {
    const g = this.pursueGuard(leadId);
    if (g) {
      if (g.stale) this.state.leads = this.state.leads.filter(l => l.id !== leadId);
      return { msg: g.msg };
    }
    const lead = this.visibleLeads().find(l => l.id === leadId)!;
    if (lead.expiresAtCycle === null) {
      // standing hunts track the roster: re-level into the region band at pursue time — still
      // ONCE, still before the call. The click is when the company takes the hunt on.
      const band = REGION[lead.region]!.levelBand;
      const levels = this.roster().map(m => m.character!.level);
      const median = levels.length ? [...levels].sort((a, b) => a - b)[Math.floor(levels.length / 2)]! : band[0];
      lead.level = Math.max(band[0], Math.min(band[1], median));
    }
    this.reserved.add(lead.id);
    return { msg: 'reserved', lead };
  }

  /** the async half. Spends NOTHING until the quest exists (P3): a throw anywhere above leaves the
   *  lead on the board, so pursuing it again IS the retry (P4). */
  private async runPursue(lead: Lead): Promise<{ ok: boolean; msg: string; questId?: string }> {
    let quest: Quest;
    if (lead.chainInfo.kind === 'continues') {
      const chain = this.state.chains.find(c => c.id === (lead.chainInfo as { chainId: string }).chainId);
      if (!chain?.saga?.plan) return { ok: false, msg: 'the chain is gone' };
      quest = await this.sagaStep(chain, lead);
    } else if (lead.chainInfo.kind === 'starts-new') {
      quest = await this.startSaga(lead);
    } else {
      quest = await this.generateOneOff(lead);
    }
    // keep the lead whole on the quest so abandoning can put it back (a re-roll, not a dead end).
    // Only for ONE-OFFS: a saga beat's lead belongs to the chain, not to the player's choice.
    if (!quest.chainId) quest.fromLead = { ...lead };
    this.state.quests.push(quest);
    // consume the lead — only repeatable faucets (lead-hunts, recruiting posts) stay standing
    if (lead.expiresAtCycle !== null || (lead.archetype !== 'lead-hunt' && lead.source !== 'recruiting')) {
      this.state.leads = this.state.leads.filter(l => l.id !== lead.id);
    }
    return { ok: true, msg: `Quest generated: ${quest.title}`, questId: quest.id };
  }

  private addJob(lead: Lead): JobRec {
    let settle!: () => void;
    const settled = new Promise<void>(r => { settle = r });
    // job ids are their OWN counter — the game's idCounter is saved state and jobs are not
    const rec: JobRec = {
      job: { id: `job-${++this.jobSeq}`, leadId: lead.id, title: lead.title ?? `${lead.archetype} — ${REGION[lead.region]?.name ?? lead.region}`, state: 'queued' },
      lead, settled, settle,
    };
    this.jobRecs.push(rec);
    return rec;
  }

  private pump(): void {
    while (this.inFlight < this.maxInFlight) {
      const next = this.jobRecs.find(r => r.job.state === 'queued');
      if (!next) return;
      void this.startJob(next);
    }
  }

  /** starting a job runs its whole SYNCHRONOUS prefix right here — JS is single-threaded, so every
   *  anti-repetition window that prefix reads and writes is closed before the next job begins (I3) */
  private startJob(rec: JobRec): Promise<void> {
    rec.job.state = 'running';
    this.inFlight++;
    return this.runJob(rec);
  }

  private async runJob(rec: JobRec): Promise<void> {
    try {
      rec.result = await this.runPursue(rec.lead);
      rec.job.state = rec.result.ok ? 'done' : 'failed';
      if (rec.result.ok) rec.job.questId = rec.result.questId; else rec.job.error = rec.result.msg;
    } catch (e) {
      // P4: the failure is the job's, not the game's — nothing escapes into enqueuePursue's caller
      rec.job.state = 'failed';
      rec.job.error = ((e as Error)?.message ?? '').slice(0, 160) || 'the writing failed';
      rec.thrown = e;
    } finally {
      rec.job.seq = ++this.settleSeq;
      if (rec.job.questId) rec.job.questTitle = this.state.quests.find(q => q.id === rec.job.questId)?.title;
      this.reserved.delete(rec.job.leadId);
      this.inFlight--;
      rec.settle();
      this.pruneJobs();
      this.pump();
    }
  }

  /** finished jobs are recent history, not an archive — the UIs read them once and move on */
  private pruneJobs(): void {
    const done = this.jobRecs.filter(r => r.job.state === 'done' || r.job.state === 'failed');
    if (done.length <= 12) return;
    const drop = new Set(done.slice(0, done.length - 12));
    this.jobRecs = this.jobRecs.filter(r => !drop.has(r));
  }

  private buildSlots(n: number, level: number, rarity: Rarity, archetype: Lead['archetype'], ask: AskSlotOut[],
    maxDifficulty?: 'standard' | 'hard', focalCardId?: string): QuestSlot[] {
    const CAP_ORDER = DIFFICULTY_ORDER;
    const slots: QuestSlot[] = [];
    let reqPlaced = false;   // QUESTS §3: requirements are RARE — at most one pinned slot per quest
    for (let i = 0; i < n; i++) {
      const a = ask[i];
      let test: SlotTest;
      let difficulty = rollDifficulty(this.rng, rarity, this.state.fort.ghTier);
      if (maxDifficulty && CAP_ORDER.indexOf(difficulty) > CAP_ORDER.indexOf(maxDifficulty))
        difficulty = maxDifficulty;
      let requirement: QuestSlot['requirement'] = { kind: 'open' };
      if (a) {
        const attrs = [a.attribute, a.extraAttribute].filter((x): x is string => !!x)
          .map(x => x.toLowerCase()).filter(x => ['str', 'dex', 'int', 'cha', 'con'].includes(x)) as Attribute[];
        // family fence (§10 + 2026-07-06 ruling): favored/clashing may name skills, personality,
        // or the four flavor looks — never stat body tags (double-dips the attr feed), backgrounds,
        // or group names (hasFavored would match a whole group)
        const FAVOR_OK = (c: string) =>
          CONCEPT[c]?.group === 'skill' || CONCEPT[c]?.group === 'personality' || ['tall', 'short', 'endowed', 'flat'].includes(c);
        let favored = a.favored.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c && FAVOR_OK(c));
        let clashing = a.clashing.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c && FAVOR_OK(c));
        // fillability guard (#79 class): a slot whose clash hits EVERY roster merc (directly or
        // via the opposite-of-favored mirror) zeroes the whole company — a first-board card sat
        // at 0% for both starters. Soften: drop the authored clash; if the favored-opposite
        // mirror alone still zeroes everyone, drop the favored words doing it.
        if (this.roster().length && this.roster().every(m => hasClash(m.tags, favored, clashing))) {
          clashing = [];
          if (this.roster().every(m => hasClash(m.tags, favored, clashing)))
            favored = favored.filter(f => !this.roster().every(m => hasClash(m.tags, [f], [])));
        }
        test = { attributes: attrs.length ? attrs : ['str'], favored, clashing, difficulty, level };
        // AI-authored slot requirement (QUESTS §3: open / must-be / must-have), engine-guarded
        if (!reqPlaced && a.mustBeFocal && focalCardId) {
          requirement = { kind: 'must-be', cardId: focalCardId };
          reqPlaced = true;
        } else if (!reqPlaced && a.requirementTag) {
          const p = parseAiTag(a.requirementTag);
          if (p) {
            // §9b band floor: an AI rank on the required word becomes minRank (#218 built)
            const minRank = p.rank && (CONCEPT[p.concept]?.depth ?? 1) > 1 ? p.rank : undefined;
            // fillability guard: a must-have NOBODY on the roster satisfies is a dead card
            // that blocks the board until TTL — soften floor first, then downgrade to favored
            if (minRank && this.roster().some(m => queryMatches(m.tags, { match: p.concept, minRank }))) {
              requirement = { kind: 'must-have', concept: p.concept, minRank }; reqPlaced = true;
            } else if (this.roster().some(m => hasTag(m.tags, p.concept))) {
              requirement = { kind: 'must-have', concept: p.concept }; reqPlaced = true;
            } else if (!test.favored.includes(p.concept)) test.favored.push(p.concept);
          }
        }
      } else {
        const d = defaultAsk(this.rng, archetype);
        test = { attributes: d.attrs, favored: d.favored, clashing: d.clashing, difficulty, level };
      }
      // a trait is never favored AND clashing on one test — the dice line read "+match 7.5 clash
      // -7.5" and the soldier was rewarded and punished for the same thing (playtest 2026-09-25)
      test.clashing = test.clashing.filter(c => !test.favored.includes(c));
      slots.push({ requirement, test, filledBy: null });
    }
    return slots;
  }

  /** beat variant: deterministically (no RNG) classify how a job turns — from the tested
   *  attributes/favored of the chosen approach's slots (or all ask slots when unbranched) */
  private sceneModeFor(q: Quest): 'physical' | 'wits' | 'social' {
    const slots = q.chosenApproach ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    const words = new Set<string>();
    for (const s of slots) { for (const a of s.test.attributes) words.add(a); for (const f of s.test.favored) words.add(f); }
    if (words.has('social') || words.has('performance') || words.has('leadership')) return 'social';
    if (q.archetype === 'investigate' || words.has('lore')) return 'wits';
    return 'physical';
  }

  private async generateOneOff(lead: Lead): Promise<Quest> {
    // fillability guard (same class as #79): never deal a card with more slots than the
    // player HAS soldiers — a 3-slot quest against a 2-merc roster can never march
    const n = Math.max(1, Math.min(slotCount(this.rng, lead.archetype, lead.rarity), this.roster().length));
    // ECONOMY §7.1: whatever the lead carried is added to this quest's budget — and to nothing
    // else. Same level, same slots, same bar: a rich lead is a richer haul, never a harder fight.
    const V = oneOffValue(this.rng, lead.level, lead.rarity, n) + (lead.bonus ?? 0);
    const specs = splitOneOff(this.rng, V, lead.archetype, lead.level);
    let rewardCards: Card[];
    const returning = lead.focalId ? this.card(lead.focalId) : undefined;
    // §4 pattern-B (reorder accepted): a NEW person-reward is a COLLABORATION — the engine
    // pre-rolls only IDENTITY (race/gender/name) here; the writer describes who they are via
    // quarryTags (≤3 vocab words, rank = band proposal); the engine then builds the unit to
    // match and completes the remainder of the budget. V/mark was computed above, untouched.
    const personSpec = specs.find(s => s.kind === 'captive' || s.kind === 'recruit');
    let pendingIdentity: { race: string; gender: 'male' | 'female'; name: string } | undefined;
    if (returning?.character) {
      // an echo rescue: the reward IS the person who was left behind (same card, same memories)
      this.unslotCard(returning);   // a room slot must never keep pointing at a card that left it
      returning.location = HELD('limbo');
      rewardCards = [returning];
    } else {
      rewardCards = specs.flatMap(s => s.kind !== 'gold' && s.kind !== 'lead' && s !== personSpec
        ? materializeReward(this.rng, s, lead.level, lead.region) : []);
      if (personSpec) {
        const races = Object.entries(REGION[lead.region]!.poolWeights) as [string, number][];
        const prefs = this.prefsFor(personSpec.kind === 'recruit' ? 'recruit' : 'npc');
        const race = prefPick(this.rng, races.map(r => r[0]), prefs, m => races.find(r => r[0] === m)![1]);
        const gender = prefPick(this.rng, ['male', 'female'], prefs) as 'male' | 'female';
        let name = rollName(this.rng, race, gender);
        for (let i = 0; i < 12 && this.nameTooSimilar(name); i++) name = rollName(this.rng, race, gender);
        pendingIdentity = { race, gender, name };
      }
    }
    const framed = returning?.character ? returning : undefined;
    // reward people aren't in state.cards yet, so the similarity guard can't see them —
    // register every reward-person name against future rolls (Marny/Magny, Olaiel/Olarion)
    for (const nm of [...rewardCards.filter(c => c.character).map(c => c.name), ...(pendingIdentity ? [pendingIdentity.name] : [])]) {
      this.recentNpcNames.push(nm);
      while (this.recentNpcNames.length > 60) this.recentNpcNames.shift();
    }
    // 🛠 2026-07-10 intake channel: the lead's PROVENANCE (which the engine always knew and threw
    // away) becomes a dealt fact — interrogations/hunts/rewards/debts stop reading as messengers
    // variants per source — one fixed string per channel became its own stamp
    const specialPools: Partial<Record<Lead['source'], string[]>> = {
      interrogation: ['a captive in the company\'s cells gave it up', 'it was traded out of the cells for small comforts',
        'it came out of the cells, a little at a time', 'someone below decided talking beat waiting',
        'the cells yielded it after long silence'],
      hunt: ['the company\'s own searching turned it up', 'it was found while looking for something else',
        'it surfaced along the way of other work', 'the company dug until this came loose',
        'it was lying under a question no one had asked yet'],
      reward: ['word of it came home with the last job', 'it grew out of business already done',
        'the last job left this behind', 'finishing one matter uncovered this one',
        'it was owed to the company before anyone named it'],
      collector: ['a debt long owed to the company has come due', 'an old obligation has surfaced',
        'someone remembered what they owe the company', 'a favor given long ago wants collecting',
        'old business has found its way back to the gate'],
    };
    const special: Partial<Record<Lead['source'], string>> = Object.fromEntries(
      Object.entries(specialPools).map(([k, v]) => [k, this.rng.pick(v!)]));
    // the fort stands in the HOME region — "seen from the walls" is impossible for a far-region
    // matter ("from the fort walls you watched a Brass Quarter lender's back room")
    const homeRegion = this.activeRegions()[0]!;
    const sparkOpts = {
      channel: lead.source === 'hunt' || lead.source === 'reward' ? 'patrol' as const
        : lead.source === 'collector' ? 'notice' as const
        : lead.region !== homeRegion ? this.rng.pick(['bringer', 'talk', 'notice', 'patrol'] as const)
        : undefined,
    };
    let opening = sampleOpening(this.rng, sparkOpts);
    // spark recency: one reroll if the same figure was dealt lately ("a poacher turned
    // informer" carried three cards in one campaign)
    if (this.recentSparks.includes(opening.sparkCore)) opening = sampleOpening(this.rng, sparkOpts);
    this.recentSparks.push(opening.sparkCore);
    while (this.recentSparks.length > 8) this.recentSparks.shift();
    const intake = special[lead.source] ?? opening.intake;
    // non-bringer/sign channels get NO spark: their pools were all arrival-of-word images —
    // the same fact as intake, and a seed that fought the matter-first opening shape
    const dealSpark = opening.channel === 'bringer' || opening.channel === 'sign';
    // landmark cooldown: once dealt, the landmark rests several cycles (Thornhollow ×8/run)
    const lmOk = opening.landmarkAllowed && this.state.cycle - (this.lastLandmarkDeal[lead.region] ?? -99) > 6;
    if (lmOk) this.lastLandmarkDeal[lead.region] = this.state.cycle;
    // a scouting run is routine by nature — the heavy register is voiced by "whoever brought it
    // to the fort", and nobody brings a scouting run in, so 2/8 heavy lead-hunts came out as voiced
    // mysteries ("the wagon hangs a foot off the ground… the miller will pay"). The roll is still
    // drawn so the RNG stream is unchanged.
    const rolledGravity = sampleGravity(this.rng, lead.rarity, 'one-off');
    // …and so is any SELF-DIRECTED work (explore, research, gather): the heavy card is a bearer
    // bringing a grievance to the fort, and nobody brings these in — rare explore cards read as
    // explore 0/6 in the voiced register, every one a rescue or a recovery (2026-09-25)
    const routine = (lead.archetype === 'lead-hunt' && process.env.SCOUT !== '0') || (lead.archetype === 'hire' && process.env.HIRE2 !== '0')
      || (isSelfDirected(lead.archetype) && process.env.SELFLIGHT !== '0');
    const gravity = routine ? 'a small, everyday job' : rolledGravity;
    // THE INPUT DIET (designer, 2026-08-27: "one off shouldnt even have names etc… best is one
    // sentence"). A one-sentence card cannot absorb four keyword atoms + a spark + an intake fact
    // + two place-name suggestions — a model handed eight things to use will use them, and the
    // ceiling loses to the material. So a SMALL job is dealt almost nothing: two atoms, no spark,
    // no intake, no place names, no landmark. Cutting the inputs is what shortens the card; the
    // prompt only says how to spend what it got. Serious/grave one-offs keep the full deal.
    const light = gravity.startsWith('a small');
    const out = this.stripJobEcho(await this.ai.writeQuest({
      kind: 'one-off', archetype: lead.archetype,
      location: this.locationLine(lead.region, light ? false : lmOk, !light),
      level: lead.level, rarity: lead.rarity,
      // engine kind names are NOT writer-safe: 'lead' read as the METAL (12 lead-bar fetches in
      // one campaign, "a parcel of lead" pay in another) — translate kinds to plain words.
      // 2026-07-12: lead components are OMITTED from the envelope outright — every gloss ever
      // tried ('further work', 'opens the next hire') became a card stamp ("the writer will tell
      // a name that opens your next hire" ~40% of cards); gold always rides alongside a lead,
      // and the engine's own grant line announces the lead when it lands
      // world words only — 'a prize object' was echoed verbatim onto cards (data echoes)
      slotCount: n, rewardEnvelope: specs.filter(s => s.kind !== 'lead').map(s => (
        // pre-shaped to read whole if pasted — and ROTATED: a single gloss string went sticky
        // ("the pick of what the job turns up" verbatim on 4/18 cards, lab 87001)
        { relic: this.rng.pick(['the pick of what the job turns up', 'first claim on what the road yields', 'whatever worth the work shakes loose']),
          recruit: 'a person who may join the company', captive: 'a person taken', gold: 'coin' } as Record<string, string>
      )[s.kind] ?? s.kind).join(' + '),
      keywords: light ? sampleKeywordsLight(this.rng) : sampleKeywords(this.rng),
      // HOW this job gets done THIS time. The gloss says what kind of work it is; the method is
      // what makes two cards of that kind different, and it combines with the keywords' concrete
      // noun rather than naming a scenario itself (see archetypes.ts).
      // ⚠ OFF by default — the cold-reader gate rejected this design before it shipped. Two
      // independent zero-context readers found the method has NO LEGAL LANDING SITE: the prompt
      // says "bend the job toward it" while the job line says "never a person, place or object the
      // situation did not already show", and the situation is twelve words of ONE SEEN THING. So
      // the method can reach neither field and vanishes. METHOD=1 to experiment.
      // OBSTACLE=1 (N10 redesign): a fact that can be SEEN, so it can land in the situation —
      // unlike `method`, which had no legal landing site
      shape: process.env.SHAPE === '1' ? sampleShape(this.rng) : undefined,
      obstacle: process.env.OBSTACLE === '1' ? sampleObstacle(this.rng) : undefined,
      selfDirected: process.env.OWNBIZ === '1' && isSelfDirected(lead.archetype) || undefined,
      scouting: lead.archetype === 'lead-hunt' || undefined,
      hiring: lead.archetype === 'hire' || undefined,
      method: process.env.METHOD === '1'
        ? (m => m?.length ? this.rng.pick(m) : undefined)(methodsOf(lead.archetype)) : undefined,
      opening: !light && dealSpark && lead.source !== 'interrogation' ? { spark: opening.spark } : undefined,
      intake: light ? undefined : intake,
      gravity,
      // NOPLACE=1 (lab): deal no invented toponym at all — blind judges named piled-up place
      // names as the heavy card's drag, and DIALOGUE_AB failure class 2 is 'place-name scatter'
      placeNameSuggestions: light || process.env.NOPLACE === '1' ? undefined
        : [this.freshPlaceName(lead.region), this.freshPlaceName(lead.region)],
      // ANONYMITY BY OMISSION (2026-07-06; widened 2026-07-16 designer ruling): one-off folk
      // stay nameless by trade with NO gravity exception — any dealt name gravitates the card
      // ("Briis" made routine work read important). The quarry keeps theirs via
      // framedCharacter; anyone who materializes is engine-named at flesh time (§4b).
      // rewardItems deliberately NOT dealt to the card writer (lab batches C-I: every framing
      // of "the company keeps X" on a card bred a possession contradiction — payer paying FOR
      // the kept thing, deliver-and-keep, prophetic loot. Omission is the class kill: cards
      // never name prizes; the RESOLVER names them at discovery via deliveredSummary.)
      // roster deliberately NOT dealt to one-offs (2026-07-16): its only rule was "never use
      // these" — pure copy-bait for a cheap model. Saga cards still get it (focalIsMerc).
      // A NAME ONLY WHEN THE PLAYER ALREADY KNOWS IT. Anonymity-by-omission (2026-07-06) kept
      // one-off FOLK nameless but let the quarry keep theirs, and that one name was enough to
      // gravitate a routine card. On a small job the quarry is now a station too — except on an
      // echo, where the whole point is that this is someone you lost. The report still names
      // whoever is delivered, at the moment the party reaches them, which is when it means
      // something.
      framedCharacter: framed ? {
        name: light && !lead.echoNote ? '' : framed.name, tags: renderTags(framed.tags),
        // pronoun EXPLICIT — an echo-rescued "Claet" once flipped sex and peril on return
        pronoun: framed.tags.some(t => t.concept === 'female') ? 'she' : framed.tags.some(t => t.concept === 'male') ? 'he' : 'they',
        // a RETURNING person brings their memories AND where the story left them
        dossier: light && !lead.echoNote ? undefined : (d => d.includes('\n') ? d : undefined)(this.dossier(framed.id)),
        lastSeen: lead.echoNote
          ?? (lead.source === 'reward' && lead.focalId
            ? [...this.state.log].reverse().find(l => l.text.includes(framed.name) && l.kind === 'resolve')?.text
            : undefined),
      } : pendingIdentity ? {
        name: light ? '' : pendingIdentity.name,
        tags: `${pendingIdentity.race}; ${pendingIdentity.gender}`,
        pronoun: pendingIdentity.gender === 'female' ? 'she' : 'he',
        partial: true,   // the writer SHAPES this person via quarryTags
      } : null,
      avoid: this.recentCardTitles.slice(-10),
    }));
    // ⚠ TEMPO I3/I4 — the ONE anti-repetition window that concurrency actually exposes: `avoid`
    // was read from this list BEFORE the call (above) and the title only exists AFTER it, so two
    // one-offs written at once are each blind to the other's title. Unhoistable by construction;
    // maxInFlight bounds the blindness to that many cards. Do not "fix" it with a lock.
    this.recentCardTitles.push(`${out.title} — ${out.job}`);
    if (this.recentCardTitles.length > 12) this.recentCardTitles.shift();
    // §4 pattern-B phase 2: canonicalize the writer's quarryTags (type from the AI, TIER from
    // the engine — a rank is only a BAND proposal, rolled weighted-low inside its window),
    // then build the person to match; the budget completion prices everything back to mark
    if (personSpec && pendingIdentity) {
      const required: TagInstance[] = [];
      for (const w of (out.quarryTags ?? []).slice(0, 3)) {
        const p = parseAiTag(w);
        const c = p && CONCEPT[p.concept];
        if (!p || !c || !['skill', 'personality', 'body', 'background'].includes(c.group)) continue;
        let tier: number | undefined;
        if (c.depth > 1 && p.rank) {
          const [lo, hi] = bandWindow(p.concept, p.rank);
          tier = Math.min(this.rng.range(lo, hi), this.rng.range(lo, hi));   // weighted-low in band
          while (this.rng.chance(0.07) && tier < c.depth) tier++;   // §8: ~7%/step spillover above
        }
        required.push({ concept: p.concept, tier });
      }
      personSpec.required = required.length ? required : undefined;
      const [person] = materializeReward(this.rng, personSpec, lead.level, lead.region,
        { gender: pendingIdentity.gender, presetName: pendingIdentity.name, race: pendingIdentity.race, prefs: this.prefsFor(personSpec.kind === 'recruit' ? 'recruit' : 'npc') });
      if (person) rewardCards.push(person);
    }
    return {
      id: freshId('q'), leadId: lead.id, title: out.title, situation: out.situation, job: out.job, gravity,
      level: lead.level, rarity: lead.rarity, region: lead.region, archetype: lead.archetype,
      slots: this.buildSlots(n, lead.level, lead.rarity, lead.archetype, out.ask),
      rewardSpecs: specs, rewardCards, state: 'open', createdCycle: this.state.cycle,
      liabilityId: lead.liabilityId,
    };
  }

  // ---- chains -----------------------------------------------------------------------------------------

  private spawnPersonalChainLead(merc: Card) {
    const lead: Lead = {
      id: freshId('lead-'), rarity: 'uncommon', level: Math.max(1, merc.character!.level),
      region: this.activeRegions()[0]!, archetype: 'investigate',
      chainInfo: { kind: 'starts-new' }, expiresAtCycle: this.state.cycle + LEAD_TTL * 2,
      source: 'personal', title: `${merc.name}'s past stirs`,
    };
    lead.personalMercId = merc.id;
    this.state.leads.push(lead);
  }

  // ---- SAGA LAB (docs/STORYTELLER.md §5.0) — dev tooling, reached only through the CLI's hidden
  // `lab` commands and the AIRAIDER_FORCE_OUTCOMES flag. Nothing here runs in play.

  /** post a fixture's pinned ✦STORY lead. The fort is made able to run the saga to any ending —
   *  the board, a Lead room, a Tavern and cells for the finale's person, four soldiers — without
   *  a single AI call, so everything up to the saga's deal stays identical across arms. */
  labSaga(fx: LabFixture): { ok: boolean; msg: string; leadId?: string } {
    const bad = labFixtureProblems(fx);
    if (bad.length) return { ok: false, msg: `bad fixture: ${bad.join('; ')}` };
    const level = fx.level ?? 2;
    const region = fx.region ?? this.activeRegions()[0]!;
    const rarity = fx.rarity ?? (fx.N <= 2 ? 'common' : fx.N <= 4 ? 'uncommon' : 'rare');
    this.labFort(level);
    const lead: Lead = {
      id: freshId('lead-'), rarity, level, region, archetype: 'investigate',
      chainInfo: { kind: 'starts-new' },
      // never null: a standing lead is re-levelled to the roster at pursue, which would move the pin
      expiresAtCycle: this.state.cycle + 999, source: fx.personal ? 'personal' : 'starter',
      title: `lab ${fx.id}`, lab: fx,
    };
    if (fx.personal) {
      const merc = this.labFocal(fx, level, region, 'merc');
      merc.location = HELD('roster');
      this.addCard(merc, true);
      this.ensureLoreNode(merc);
      lead.personalMercId = merc.id;
    }
    this.state.leads.push(lead);
    return { ok: true, msg: `lab saga ${fx.id} (${fx.path}, N${fx.N}, ${fx.personal ? 'personal' : fx.kind}) posted: ${lead.id}`, leadId: lead.id };
  }

  /** the lab's standing fort: rooms placed directly (no build side effects, no gold), and the
   *  roster topped up to four from the game's own rolls */
  private labFort(level: number): void {
    for (const type of ['map-room', 'lead-room', 'tavern', 'dungeon', 'dungeon-cell']) {
      if (this.hasRoom(type)) continue;
      if (!this.freeCells().length) this.state.fort.cells.push({ floor: Math.max(...this.state.fort.cells.map(c => c.floor)) + 1, col: 0 });
      const rt = ROOM_TYPE[type]!;
      this.state.fort.rooms.push({ id: freshId('room-'), type, cell: this.freeCells()[0]!, slots: [], wants: defaultWants(rt, null), style: null });
    }
    while (this.roster().length < 4) {
      const merc = this.freshCharacter('merc', level, 60, 'forests');
      merc.location = HELD('roster');
      this.addCard(merc);
      this.ensureLoreNode(merc);
    }
  }

  /** the fixture's person, rolled on a private Rng from the fixture's own seed */
  private labFocal(fx: LabFixture, level: number, region: string, as: 'captive' | 'merc'): Card {
    const f = fx.focal;
    const card = materializeReward(new Rng(f.seed >>> 0), {
      kind: as === 'merc' ? 'recruit' : 'captive', value: f.value ?? 120,
      required: f.tags?.map(concept => ({ concept })),
    }, level, region, { presetName: f.name, race: f.race, gender: f.sex, maxSkills: 2 })[0]!;
    if (as === 'merc' && card.character) {
      card.character.role = 'merc';
      card.character.level = level;
      if (f.who) card.character.who = f.who;
      if (f.backstory) card.character.backstory = f.backstory;
    }
    return card;
  }

  /** the pins win over the economy roll (which still ran, so every later draw is the same) */
  private applyLabPins(eco: ReturnType<typeof newChainEconomy>, pin: LabFixture, lead: Lead): void {
    const payoff = chainPayoff(pin.N, lead.level, lead.rarity) + (lead.bonus ?? 0);
    eco.focalTarget = Math.round(eco.focalTarget * payoff / Math.max(1, eco.payoff));
    eco.payoff = payoff;
    eco.beats = pin.N;
    eco.failureBudget = Math.max(2, Math.ceil(pin.N / 2));
    eco.kind = pin.kind;
    eco.twist = pin.twist;
  }

  /** AIRAIDER_FORCE_OUTCOMES — the ONE place a lab run bends the dice. A lab saga's quest gets its
   *  fixture path's outcome (engine/lab.ts) and the heads to match, so the ⚄ line agrees. Unset —
   *  every game that is not a lab run — it returns the roll untouched: no rng, no state. */
  private forceOutcome(q: Quest, rolled: QuestRollResult): QuestRollResult {
    if (!process.env.AIRAIDER_FORCE_OUTCOMES) return rolled;
    const lab = q.chainId ? this.state.chains.find(c => c.id === q.chainId)?.lab : undefined;
    if (!lab) return rolled;
    const job = q.beatIndex ?? 1;
    const outcome = nextLabOutcome(lab, !!q.isFinale, job);
    lab.log.push({ job, finale: !!q.isFinale, outcome });
    return forceRoll(rolled, outcome);
  }

  /** one JSON line for the lab driver: where every saga, quest, lead and job stands, and the last
   *  reckoning's lines per quest — the very lines `reckoning` prints, so a transcript is cut per
   *  report without guessing where a block ends (the extractor checks them against the print) */
  labState() {
    const rk = this.reckoningAt();
    return {
      lab: 1, cycle: this.state.cycle, roster: this.roster().length,
      chains: this.state.chains.map(c => ({
        id: c.id, title: this.sagaTitle(c), state: c.state, beat: c.beatIndex, expectedBeats: c.expectedBeats,
        failures: c.failures, failureBudget: c.failureBudget, lab: c.lab ?? null,
      })),
      quests: this.state.quests.filter(q => q.state === 'open').map(q => ({
        id: q.id, title: q.title, chainId: q.chainId ?? null, beatIndex: q.beatIndex ?? null, isFinale: !!q.isFinale,
        approaches: q.approaches?.map(a => ({ id: a.id, label: a.label, rewardKind: a.rewardKind })) ?? null,
        chosen: q.chosenApproach ?? null, ready: this.isCommitted(q),
      })),
      leads: this.state.leads.map(l => ({
        id: l.id, kind: l.chainInfo.kind, chainId: l.chainInfo.kind === 'continues' ? l.chainInfo.chainId : null,
        lab: l.lab?.id ?? null, title: l.title ?? null,
      })),
      jobs: this.jobs().map(j => ({ id: j.id, leadId: j.leadId, state: j.state, questId: j.questId ?? null, error: j.error ?? null })),
      reckoning: rk ? { cycle: rk.cycle, meta: rk.meta.map(m => ({
        questId: m.questId, title: m.title, chainId: m.chainId, outcome: m.outcome, isFinale: m.isFinale,
        heads: m.heads, coins: m.coins, bar: m.bar, lines: rk.lines.slice(m.from, m.to),
      })) } : null,
    };
  }

  // ---- sagas: the v4 storyteller (docs/STORYTELLER.md; src/game/sagaflow.ts) -----------------------------
  // The engine keeps every number it always had — the economy roll, the focal, slot counts, difficulty and its caps,
  // the fillability guard, side loot and relics, the bank, the failure budget, the stall guard, the finale's fates and
  // settleFinale. The flow owns what the story says, plus the few mechanics the build plan's §3 defaults hand it: asks
  // by job type (D1), the finale's ways (D2), injuries by rollHurt under today's guard (D3), who decides a job (D5).

  /** the saga flow's view of the game */
  private sagaHost(): flow.SagaHost {
    const live = this.liveSagaCast();
    return {
      rng: this.rng, storyRng: this.storyRng, ai: this.ai, state: this.state,
      card: id => this.card(id), roster: () => this.roster(),
      direction: () => flow.directionText(this.state.direction),
      log: (kind, text) => this.log(kind, text),
      // the roster, the lore, the recent NPC window, near-misses — and every live saga's cast
      takenName: n => live.names.has(n) || this.nameTooSimilar(n),
      takenTrade: t => live.trades.has(t),
      noteNpcName: n => { this.recentNpcNames.push(n); while (this.recentNpcNames.length > 60) this.recentNpcNames.shift() },
      npcPrefs: () => this.prefsFor('npc'),
      placeOk: p => this.placeRested(p),
      hasRoom: t => this.hasRoom(t), rosterCapacity: () => this.rosterCapacity(),
      captiveCount: () => this.captives().length, captiveCapacity: () => this.captiveCapacity(),
    };
  }
  /** a saga's title wherever the game prints one */
  private sagaTitle(c: Chain): string { return c.saga?.plan?.title ?? 'a saga' }
  /** the people of every saga still in play, by id, by name and by trade — the live-saga cast fence. A trade is the
   *  dealt one or, for one dealt none, any dealt trade its plan label carries ("a lizardfolk horse dealer") */
  private liveSagaCast(): { ids: Set<string>; names: Set<string>; trades: Set<string> } {
    const live = this.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending');
    const cast = live.flatMap(c => c.saga?.world.cast ?? []);
    const labels = live.flatMap(c => c.saga?.plan?.cast.map(p => p.label.toLowerCase()) ?? []);
    const trades = new Set([...cast.flatMap(p => p.trade ? [p.trade] : []), ...DEALT_TRADES.filter(t => labels.some(l => new RegExp(`\\b${t}\\b`).test(l)))]);
    return { ids: new Set(cast.map(p => p.id)), names: new Set(cast.map(p => p.name)), trades };
  }
  /** "in the Western Forests" — where a returning face is, as far as the company knows */
  private regionIn(region: string): string {
    const n = REGION[region]?.name ?? region;
    return `in ${n.startsWith('The ') ? n.replace(/^The/, 'the') : `the ${n}`}`;
  }
  /** a person's strongest memory WITH the company (D9): an engine-written line about them and the company, an edge a
   *  saga left, or one to a soldier — every one a line the player read */
  private companyEdge(id: string): RelEdge | undefined {
    const cyc = this.state.cycle;
    return this.state.lore.edges
      .filter(e => e.active && !!e.blurb.trim() && (e.from === id || e.to === id)
        && (madeInPlay(e) || this.card(e.from === id ? e.to : e.from)?.character?.role === 'merc'))
      .sort((a, b) => Number(b.core) - Number(a.core) || effectiveSalience(b, cyc) - effectiveSalience(a, cyc))[0];
  }
  /** a returning focal's memory and where they are (D9), or nothing when the player holds no memory of them */
  private faceMemory(id: string, region: string): { memory: string; where: string } | undefined {
    const e = this.companyEdge(id);
    return e ? { memory: e.blurb, where: this.regionIn(region) } : undefined;
  }
  /** every lore face as a saga seat would see it: where it stands (the slate's old fences) and its strongest company
   *  edge. A face with no recorded sex is left out — the cast never guesses one */
  private faceCandidates(region: string, liveIds: Set<string>): FaceCandidate[] {
    const out: FaceCandidate[] = [];
    for (const nd of Object.values(this.state.lore.nodes)) {
      if (!nd.active || nd.kind !== 'character') continue;
      const card = this.card(nd.id);
      const sex = nd.sex ?? (card ? sexOf(card) : undefined);
      if (!sex) continue;
      const role = card?.character?.role;
      const where = card?.location.kind === 'held' ? card.location.state : card ? card.location.kind : undefined;
      const top = this.companyEdge(nd.id);
      out.push({
        id: nd.id, name: nd.name, sex, race: nd.race ?? (card ? raceOf(card) : 'human'),
        memory: top?.blurb ?? '', where: this.regionIn(region), edgeType: top?.type ?? '', edges: edgeCount(this.state.lore, nd.id, this.state.cycle),
        ...(role === 'merc' ? { companySoldier: true } : {}),
        ...(role === 'captive' && where !== 'lore' ? { companyCaptive: true } : {}),
        ...(where === 'roster' || where === 'staged' || where === 'inventory' || where === 'room' || where === 'quest' ? { atTheFort: true } : {}),
        ...(where === 'lore' ? { outOfReach: true } : {}),
        ...(liveIds.has(nd.id) || where === 'limbo' ? { staged: true } : {}),
      });
    }
    return out;
  }
  /** D9: the client seat reuses a fenced lore face with a client-type edge at P(new) = θ/(θ+N), at most one returning
   *  face a saga, two sagas' cooldown — else the deal coins a stranger */
  private returningClient(focalId: string, region: string, liveIds: Set<string>): Face | undefined {
    const eligible = castableClients(this.faceCandidates(region, liveIds).filter(c => c.id !== focalId), recentFaces(this.state.chains));
    return pickClientFace(this.storyRng, eligible, CAST_THETA);
  }
  /** a personal saga's seed (D12) and, when it came from an edge to a castable lore person, that person (D10): known,
   *  their memory the edge's line; a rival-type edge seats them in the way instead of a coined opponent */
  private personalSeedOf(merc: Card, region: string, liveIds: Set<string>): { seed: string; person?: Face & { rival: boolean } } {
    const seed = this.personalSeed(merc);
    const e = this.personalEdges(merc)[0];
    if (!e || e.blurb !== seed || e.from === e.to) return { seed };
    const other = e.from === merc.id ? e.to : e.from;
    const c = this.faceCandidates(region, liveIds).find(x => x.id === other);
    if (!c || c.companySoldier || c.companyCaptive || c.atTheFort || c.outOfReach || c.staged || recentFaces(this.state.chains).includes(c.id)) return { seed };
    return { seed, person: { id: c.id, name: c.name, sex: c.sex, race: c.race, memory: e.blurb, where: c.where, rival: OPPONENT_EDGES.has(e.type) } };
  }

  /** A saga lead pursued. The focal FIRST (§2): personal → the soldier; a sequel → the one who slipped away; a lab
   *  fixture's person; else, sometimes, a face the world already knows (lore promotion), or a new one at the payoff
   *  value. Then the deal — synchronous, in the pursuit's prefix, so two pursuits at once never share a theme, a name or
   *  a returning face (TEMPO I3) — then the plan, and card 1 beside the road ahead. */
  private async startSaga(lead: Lead): Promise<Quest> {
    const personalMercId = lead.personalMercId;
    const returning = lead.focalId ? this.card(lead.focalId) : undefined;
    // a sequel whose focal has since become YOUR merc = a personal chain about them
    // (never yank a roster merc into limbo)
    const returningIsMerc = returning?.character?.role === 'merc';
    const isPersonal = (!!personalMercId && !!this.card(personalMercId)) || returningIsMerc;
    const eco = newChainEconomy(this.rng, lead.level, lead.rarity, lead.bonus ?? 0);
    // SAGA LAB (docs/STORYTELLER.md §5.0): a lab lead's pins win over what the roll dealt
    const pin = lead.lab;
    if (pin) this.applyLabPins(eco, pin, lead);
    const live = this.liveSagaCast();
    let focal: Card;
    /** the focal is a face the player already knows (D9): a sequel's, or a lore face promoted to a card */
    let known = false;
    if (returningIsMerc) focal = returning!;
    else if (isPersonal) focal = this.card(personalMercId!)!;
    else if (returning) {
      focal = returning;
      this.unslotCard(focal);           // never leave a room slot pointing at them
      focal.location = HELD('limbo');   // back within reach, not yet owned
      known = true;
    } else if (pin) {
      // the fixture's person, built from its own seed — the same face in every run and every arm
      focal = this.labFocal(pin, lead.level, lead.region, 'captive');
      focal.location = HELD('limbo');
      this.addCard(focal, true);
    } else {
      const spec = { kind: 'captive' as const, value: eco.focalTarget };
      // focal variety (BIBLE lock): recent focals' skill/body/standing tags are excluded so
      // the archetype varies, and focal skills cap at 2
      const recentFocalTags = this.state.chains.slice(-4).flatMap(ch => {
        const f = this.card(ch.focalId);
        return f ? f.tags.filter(t => ['skill', 'body', 'standing'].includes(CONCEPT[t.concept]?.group ?? ''))
          .map(t => t.concept) : [];
      });
      // §21-3 known-cast cadence + LORE §1 lazy promotion (built 2026-07-10): some sagas return
      // to a FACE THE WORLD ALREADY KNOWS — a lore-only coined person gets a full Card rolled
      // here, and their lore node (memories, ties) is remapped onto it so their story follows.
      // Never someone already in a live saga's cast (the live-saga fence)
      const loreCast = Object.values(this.state.lore.nodes).filter(nd =>
        nd.active && nd.kind === 'character' && !this.card(nd.id) && !this.state.cards.some(c => c.name === nd.name) && !live.ids.has(nd.id));
      // RECURRING_CAST §3 🔒 — two rules, replacing a >=3 gate, a per-tier cap and a flat 35%:
      //   1. the chance of coining a NEW face falls as the cast grows: P(new) = θ/(θ+N)
      //   2. reuse is weighted by EDGE COUNT — the matters that person is already part of
      // They interlock. Weighting alone is uniform while everyone has one edge; a falling coin
      // rate alone just rotates strangers evenly. Rule 1 forces a reuse, the reuse adds an edge,
      // rule 2 then favours that person — which is how a recurring cast forms instead of a census.
      const N = loreCast.length;
      let promoted = false;
      if (N > 0 && !this.rng.chance(CAST_THETA / (CAST_THETA + N))) {
        promoted = true;
        const nd = this.rng.weighted(loreCast.map(n =>
          [n, edgeCount(this.state.lore, n.id, this.state.cycle)] as [typeof n, number]));
        const text = `${nd.blurb} ${nd.identity}`;
        // the sex and race the name was rolled with win; the blurb's pronouns are only a fallback
        // for nodes written before they were recorded
        const race = nd.race ?? (/\belv|elf\b/i.test(text) ? 'elf' : /wolfman/i.test(text) ? 'wolfman'
          : /lizardman/i.test(text) ? 'lizardman' : /\bhuman\b/i.test(text) ? 'human' : undefined);
        const gender = nd.sex ?? (/\b(she|her|hers|woman|widow|daughter|sister|bride)\b/i.test(text) ? 'female'
          : /\b(he|him|his|man|widower|son|brother)\b/i.test(text) ? 'male' : undefined);
        focal = materializeReward(this.rng, spec, lead.level, lead.region,
          { excludeConcepts: recentFocalTags, maxSkills: 2, presetName: nd.name, race, gender, prefs: this.prefsFor('npc') })[0]!;
        // remap the node onto the card id — edges and memories follow the person
        delete this.state.lore.nodes[nd.id];
        this.state.lore.nodes[focal.id] = { ...nd, id: focal.id, identity: renderTags(focal.tags) };
        for (const e of this.state.lore.edges) {
          if (e.from === nd.id) e.from = focal.id;
          if (e.to === nd.id) e.to = focal.id;
        }
        known = true;
      } else {
        focal = materializeReward(this.rng, spec, lead.level, lead.region,
          { excludeConcepts: recentFocalTags, maxSkills: 2, prefs: this.prefsFor('npc') })[0]!;
      }
      // focal names skipped the similarity guard — two unrelated "Hessossk Scale-of-Bronze"s
      // anchored back-to-back sagas. But a PROMOTED focal is a face the world already knows, so
      // their name is IN the lorebook by definition and the guard read that as a collision and
      // rerolled them into a stranger — silently undoing every reuse (measured: the branch fired
      // 17 times in 30 and produced 0 returning faces). The guard is for coincidence, not for a
      // deliberate return.
      for (let i = 0; !promoted && i < 12 && (this.nameTooSimilar(focal.name) || live.names.has(focal.name)); i++) {
        focal.name = rollName(this.rng, focal.tags.find(t => ['elf', 'human', 'wolfman', 'lizardman'].includes(t.concept))?.concept ?? 'human',
          focal.tags.some(t => t.concept === 'female') ? 'female' : 'male');
      }
      focal.location = HELD('limbo');
      this.addCard(focal, promoted);
    }
    this.ensureLoreNode(focal);
    const chain: Chain = {
      id: freshId('chain-'), kind: eco.kind, isPersonal, focalId: focal.id,
      level: lead.level, rarity: lead.rarity, region: lead.region,
      expectedBeats: eco.beats, payoff: eco.payoff, bank: 0, cyclesSpent: 0,
      failureBudget: eco.failureBudget, failures: 0, beatIndex: 0,
      state: 'active', createdCycle: this.state.cycle,
      ...(pin ? { lab: { fixture: pin.id, path: pin.path, N: pin.N, log: [] } } : {}),
    };
    // THE DEAL (the who, the seed, the places), synchronous
    const host = this.sagaHost();
    const pins: flow.DealPins = {};
    if (isPersonal) {
      const s = this.personalSeedOf(focal, chain.region, live.ids);
      pins.personalSeed = s.seed;
      if (s.person) pins.seedPerson = s.person;
    } else {
      if (known) { const m = this.faceMemory(focal.id, chain.region); if (m) pins.focalMemory = m }
      if (!pins.focalMemory) pins.returningClient = this.returningClient(focal.id, chain.region, live.ids);
    }
    const rec = flow.deal(host, chain, lead, focal, pins);
    for (const p of rec.world.places) this.notePlace(p);
    focal.chainIds.push(chain.id);
    this.state.chains.push(chain);
    try {
      const plan = await flow.plan(host, chain);
      this.log('chain', `A story begins: ${plan.title}`);
      return await this.sagaStep(chain, lead);
    } catch (e) {
      // the pursuit failed and its lead stays on the board (TEMPO P4): the saga it was writing never began
      Game.unbegin(this.state, chain);
      throw e;
    }
  }

  /** the saga's next card (one already on offer comes back verbatim, D15) and the quest built around it */
  private async sagaStep(chain: Chain, lead: Lead): Promise<Quest> {
    // the game's own gate decides when the finale comes (finaleReady): reached early — the setbacks spent, or the stall
    // guard's merc-cycles — it is the last chance (D14), and the jobs never reached drop off the road
    const rec = chain.saga!;
    if (!rec.lastchance && finaleReady(chain) && !flow.posOf(rec).finale) rec.lastchance = true;
    const out = await flow.card(this.sagaHost(), chain);
    return this.sagaQuest(chain, lead, out);
  }

  /** a saga card's quest: today's slot count, side loot, relic chance, difficulty caps and gravity, the asks from the
   *  job's type (D1); the finale one place per way, each its own plan, the gold road leaning easy (D2) */
  private sagaQuest(chain: Chain, lead: Lead, out: flow.SagaCardOut): Quest {
    const rec = chain.saga!, plan = rec.plan!, pos = out.pos;
    const focal = this.card(chain.focalId);
    let slots: QuestSlot[];
    let approaches: ApproachGroup[] | undefined;
    const specs: RewardSpec[] = [];
    let rewardCards: Card[] = [];
    let sideLootV = 0;
    if (pos.finale) {
      const ways = flow.approaches(rec);
      // finales are ALWAYS one slot per approach (mutex plans, QUESTS §9) and every place is open — as today
      slots = this.buildSlots(ways.length, chain.level, chain.rarity, 'investigate', flow.asks('showdown', ways.length, chain.isPersonal, false, ways.map(w => w.way)))
        .map((s, i) => ({
          ...s, requirement: { kind: 'open' as const }, groupId: ways[i]!.id,
          // QUESTS §9: each PLAN carries its own difficulty — the cash-out road leans easy
          test: { ...s.test, difficulty: ways[i]!.rewardKind === 'gold' && this.rng.chance(0.7) ? 'standard' as const : rollDifficulty(this.rng, chain.rarity, this.state.fort.ghTier) },
        }));
      approaches = ways.map(w => ({ id: w.id, label: w.label, rewardKind: w.rewardKind, way: w.way }));
      chain.state = 'finale-pending';
    } else {
      // beats obey the fillability guard: never more slots than the roster has soldiers
      const n = Math.max(1, Math.min(slotCount(this.rng, 'investigate', chain.rarity), this.roster().length));
      sideLootV = beatSideLoot(this.rng, chain);
      // QUESTS §6: middle-beat side-loot = gold OR a relic among it
      specs.push({ kind: 'gold', value: sideLootV });
      if (sideLootV > 40 && this.rng.chance(0.35)) {
        specs[0] = { kind: 'gold', value: Math.round(sideLootV * 0.4) };
        const relicSpec: RewardSpec = { kind: 'relic', value: Math.round(sideLootV * 0.6) };
        specs.push(relicSpec);
        rewardCards = materializeReward(this.rng, relicSpec, chain.level, chain.region);
      }
      const e = plan.episodes[pos.job - 1]!;
      // beat pacing (QUESTS §8-B): beat 1 is the low-stakes CARE moment — cap its difficulty at standard; beat 2 still
      // escalating — cap at hard; then free
      const cap = pos.job <= 1 ? 'standard' as const : pos.job === 2 ? 'hard' as const : undefined;
      // a personal saga pins its soldier to slot 0 only on a job the plan itself put them in (D1 — the pre-v4 rule: the
      // step stages their own matter in person); the repair that adds them to every job's people is for the prose only
      slots = this.buildSlots(n, chain.level, chain.rarity, 'investigate', flow.asks(e.type, n, chain.isPersonal, flow.pinsSoldier(rec, pos.job)), cap,
        chain.isPersonal && focal?.character?.role === 'merc' ? focal.id : undefined);
    }
    return {
      id: freshId('q'), leadId: lead.id, title: out.title, situation: out.prose, job: out.job,
      gravity: sampleGravity(this.rng, chain.rarity, 'saga'),
      level: chain.level, rarity: chain.rarity, region: chain.region, archetype: lead.archetype,
      chainId: chain.id, beatIndex: pos.job, isFinale: pos.finale,
      saga: {
        rows: out.rows, logFirst: out.logFirst, matter: out.matter, pos,
        part: pos.finale ? null : pos.job, of: rec.world.N, again: !pos.finale && pos.attempt > 1, lastchance: pos.finale && rec.lastchance,
        setbacks: chain.failures, budget: chain.failureBudget,
      },
      ...(approaches ? { approaches } : {}),
      slots, rewardSpecs: specs, rewardCards, sideLootV,
      state: 'open', createdCycle: this.state.cycle,
    };
  }

  chooseApproach(questId: string, groupId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q?.approaches) return { ok: false, msg: 'not a branched quest' };
    if (!q.approaches.some(a => a.id === groupId)) return { ok: false, msg: 'no such approach' };
    q.chosenApproach = groupId;
    const sentBack: string[] = [];
    for (const s of q.slots) if (s.groupId !== groupId && s.filledBy) {
      sentBack.push(this.card(s.filledBy)?.name ?? '?');
      this.doUnassign(q, s);
    }
    const label = q.approaches.find(a => a.id === groupId)!.label;
    return { ok: true, msg: `Approach: ${label}${sentBack.length ? ` — ${sentBack.join(', ')} sent back to the hand` : ''}` };
  }
  /** what switching this finale to another approach throws away — the soldiers placed on the
   *  current one go back to the hand. Said BEFORE the click (both UIs confirm on it); null = free. */
  approachSwitchLoss(questId: string, groupId: string): string | null {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q?.approaches || !q.chosenApproach || q.chosenApproach === groupId) return null;
    const back = q.slots.filter(s => s.groupId !== groupId && s.filledBy).map(s => this.card(s.filledBy!)?.name ?? '?');
    return back.length ? `switching plans sends ${back.join(', ')} back to the hand` : null;
  }
  /** the soldier an approach card names for one of its places: whoever holds it, else the
   *  strongest who could take it once the approach is chosen (slotFits, legal but for the gate) —
   *  `from` set when they stand on another quest (sending moves them). The CLI and the quest page
   *  both print THIS. */
  approachBest(questId: string, slotIdx: number): { id: string; name: string; coins: number; strength: Strength; from: { questId: string; title: string } | null; holder: boolean } | null {
    const q = this.state.quests.find(x => x.id === questId);
    const s = q?.slots[slotIdx];
    if (!q || !s) return null;
    if (s.filledBy) {
      const m = this.card(s.filledBy)!;
      const c = coins(m, s.test);
      return { id: m.id, name: m.name, coins: c, strength: slotStrength(c, slotThreshold(s.test)), from: null, holder: true };
    }
    const f = this.slotFits(questId, slotIdx).filter(x => !x.blocked || x.gated).sort((a, b) => b.coins - a.coins)[0];
    return f ? { id: f.id, name: f.name, coins: f.coins, strength: f.strength, from: f.from && f.from.questId !== questId ? { questId: f.from.questId, title: f.from.title } : null, holder: false } : null;
  }
  /** everyone off this quest, back to the hand — ONE action (the quest page's Clear, the CLI's
   *  `clear`), so a double click can never race a loop of unassigns into a false error */
  clearQuest(questId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q) return { ok: false, msg: 'no such open quest' };
    const names = q.slots.filter(s => s.filledBy).map(s => this.card(s.filledBy!)?.name ?? '?');
    for (const s of q.slots) if (s.filledBy) this.doUnassign(q, s);
    return { ok: true, msg: names.length ? `${names.join(', ')} back in the hand` : 'nobody was placed' };
  }

  // ---- assignment -----------------------------------------------------------------------------------

  /** THE ONE LEGALITY PREDICATE for putting a soldier in a quest place — null when legal, else the
   *  reason in the player's words. Every placement path (assign, sendTo, autoAssign, placementsFor,
   *  the views' fits) asks THIS, so no two surfaces can disagree about who may go where.
   *  It deliberately does NOT refuse a soldier committed elsewhere (sending MOVES them) nor a place
   *  someone else holds (sendTo SWAPS them) — assign() is the strict primitive that does. */
  canTake(questId: string, slotIdx: number, mercId: string, opts: { ignoreApproach?: boolean } = {}): string | null {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q || q.state !== 'open') return 'no such quest';
    const m = this.card(mercId);
    if (!m?.character || m.character.role !== 'merc') return 'only soldiers go on quests';
    if (m.location.kind !== 'quest' && !(m.location.kind === 'held' && m.location.state === 'roster')) return 'not on your roster';
    const slot = q.slots[slotIdx];
    if (!slot) return 'no such place';
    if (slot.requirement.kind === 'must-be' && slot.requirement.cardId !== mercId)
      return `this place names ${this.card(slot.requirement.cardId)?.name ?? 'someone else'}`;
    if (slot.requirement.kind === 'must-have' && !queryMatches(m.tags, { match: slot.requirement.concept, minRank: slot.requirement.minRank }))
      return `needs ${slot.requirement.concept}${slot.requirement.minRank ? ` (${slot.requirement.minRank}+)` : ''}`;
    // the approach gates come LAST, so on an unchosen finale 'pick an approach first' means
    // "otherwise legal" — the approach cards can name their best fit before the choice
    if (opts.ignoreApproach) return null;
    if (q.approaches && !q.chosenApproach) return 'pick an approach first';
    if (q.approaches && slot.groupId !== q.chosenApproach) return 'that place belongs to another approach';
    return null;
  }

  /** the place in the player's words: "the STR place" */
  private placeName(q: Quest, idx: number): string {
    return `the ${q.slots[idx]!.test.attributes.map(a => a.toUpperCase()).join('+')} place`;
  }

  /** what a placement just did, in one line: who, where, their strength there, and the party's
   *  verdict once manned. `warn` when that verdict (or, short-handed, this place) is poor. */
  private placedMsg(q: Quest, idx: number, merc: Card, lead = ''): { ok: true; msg: string; warn?: boolean } {
    const s = q.slots[idx]!;
    const c = coins(merc, s.test);
    const strength = slotStrength(c, slotThreshold(s.test));
    const o = this.questOdds(q.id);
    const left = o.of - o.filled;
    const tail = o.band ? ` · the party: ${BAND_TEXT[o.band]}` : ` · ${left} place${left === 1 ? '' : 's'} still open`;
    const warn = o.band ? (o.band === 'long' || o.band === 'hopeless') : strength === 'weak';
    return { ok: true, msg: `${lead}${merc.name} takes ${this.placeName(q, idx)} on ${q.title} — ${c} coins (${strength})${tail}`, ...(warn ? { warn } : {}) };
  }

  /** the STRICT primitive: an empty place, a free soldier. (sendTo is the forgiving path.) */
  assign(questId: string, slotIdx: number, mercId: string): { ok: boolean; msg: string; warn?: boolean } {
    const why = this.canTake(questId, slotIdx, mercId);
    if (why) return { ok: false, msg: why };
    const q = this.state.quests.find(x => x.id === questId)!;
    const merc = this.card(mercId)!;
    const slot = q.slots[slotIdx]!;
    if (slot.filledBy === mercId) return { ok: false, msg: `${merc.name} is already there` };
    if (slot.filledBy) return { ok: false, msg: `${this.card(slot.filledBy)?.name ?? 'someone'} holds that place` };
    if (merc.location.kind === 'quest') return { ok: false, msg: `${merc.name} is already committed` };
    slot.filledBy = mercId;
    merc.location = { kind: 'quest', questId, slot: slotIdx };
    return this.placedMsg(q, slotIdx, merc);
  }

  unassign(questId: string, slotIdx: number): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId);
    const slot = q?.slots[slotIdx];
    if (!q || !slot?.filledBy) return { ok: false, msg: 'nothing to unassign' };
    const name = this.card(slot.filledBy)?.name ?? 'they';
    this.doUnassign(q, slot);
    return { ok: true, msg: `${name} back in the hand` };
  }
  private doUnassign(q: Quest, slot: QuestSlot) {
    const merc = slot.filledBy ? this.card(slot.filledBy) : null;
    if (merc) merc.location = HELD('roster');
    slot.filledBy = null;
  }

  /** ON THIS MATTER — the people this saga card calls by name, as "name — label", for the quest screen's held cards
   *  and the CLI's line (onThisMatter, computed when the card was dealt — a person the card withholds is never here) */
  questCast(questId: string): { id: string; name: string; label: string }[] {
    const q = this.state.quests.find(x => x.id === questId);
    return (q?.saga?.matter ?? []).map(m => ({ ...m }));
  }

  /** MAN A QUEST, greedily. Score every (slot, soldier) pair, take the best pair whose halves
   *  are both still free, repeat. It only ever FILLS EMPTY SLOTS — a hand-picked soldier is
   *  never displaced, because silently undoing the player's own choice is worse than doing
   *  nothing (Clear, then Auto, to reshuffle).
   *
   *  Every placement goes through assign(), so must-be, must-have, approach gating and the
   *  one-quest-per-soldier rule stay in exactly one place.
   *
   *  Both UIs call THIS. A second copy in the web would end the CLI's standing as a playtest
   *  surface (docs/DOGFOODING.md), which is the only surface this project can actually play. */
  autoAssign(questId: string): { ok: boolean; msg: string; placed: number; warn?: boolean } {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q || q.state !== 'open') return { ok: false, msg: 'no such quest', placed: 0 };
    // recruit vs captive vs cash-out is a STORY choice. Auto must not make it silently.
    if (q.approaches && !q.chosenApproach)
      return { ok: false, msg: 'pick an approach first — that choice is yours', placed: 0 };
    const plan = this.autoPlan(q);
    if (!plan.empty) return { ok: true, msg: 'already manned', placed: 0 };
    if (!plan.pairs.length) return { ok: false, msg: 'nobody free fits this', placed: 0 };
    // a quest that cannot be FULLY manned does not march — parking soldiers in it half-manned
    // wastes them (autoAssignAll undoes exactly that; one Auto used to leave them there, green)
    if (plan.short > 0)
      return { ok: false, msg: `can't fully man it — ${plan.short} of ${plan.empty} empty place${plan.empty === 1 ? '' : 's'} ${plan.short === 1 ? 'has' : 'have'} nobody free who fits (nobody placed)`, placed: 0 };
    let placed = 0;
    for (const p of plan.pairs) if (this.assign(questId, p.idx, p.id).ok) placed++;
    const band = this.questOdds(questId).band;
    return {
      ok: placed > 0,
      msg: `${placed} placed — the party: ${band ? BAND_TEXT[band] : '?'}`,
      placed,
      ...(band === 'long' || band === 'hopeless' ? { warn: true } : {}),
    };
  }
  /** the greedy fill autoAssign would make — (slot, free soldier) pairs by fit, best first, a tie
   *  going to the CHEAPER soldier — without making it. `short` = empty places nobody free fits.
   *  The ONE test of "can the idle soldiers man this" (autoAssign, the next-steps scroll). */
  private autoPlan(q: Quest): { empty: number; short: number; pairs: { idx: number; id: string }[] } {
    const active = this.activeSlots(q);
    const empty = active.filter(s => !s.filledBy);
    const free = this.roster().filter(m => m.location.kind === 'held');
    const pairs: { idx: number; id: string; score: number; worth: number }[] = [];
    for (const s of empty) {
      const idx = q.slots.indexOf(s);
      for (const m of free) {
        if (this.canTake(q.id, idx, m.id)) continue;
        // a wound is a PENALTY, not a bar: the engine lets the hurt march, and whether to spend
        // them is the player's call — auto merely prefers not to
        pairs.push({ idx, id: m.id, score: coins(m, s.test) - 2 * (m.character?.injuryTiers ?? 0), worth: m.value });
      }
    }
    pairs.sort((a, b) => b.score - a.score || a.worth - b.worth);
    const tookSlot = new Set<number>(), tookMerc = new Set<string>(), out: { idx: number; id: string }[] = [];
    for (const p of pairs) {
      if (tookSlot.has(p.idx) || tookMerc.has(p.id)) continue;
      tookSlot.add(p.idx); tookMerc.add(p.id); out.push({ idx: p.idx, id: p.id });
    }
    return { empty: empty.length, short: empty.length - out.length, pairs: out };
  }
  /** can the soldiers standing idle fill every empty place of this quest right now? */
  canFullyMan(questId: string): boolean {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q || (q.approaches && !q.chosenApproach)) return false;
    const plan = this.autoPlan(q);
    return plan.empty > 0 && plan.short === 0;
  }

  /** THE BEST PLACE FOR ONE SOLDIER on every open quest — what dragging a card over the map shows,
   *  what the card sheet's "send to" lists, and where sendTo() puts them. A soldier already
   *  committed is scored as if free (sending moves them). Only FREE places (or their own) count —
   *  sendTo without a place never displaces anyone — and only places canTake() allows. */
  placementsFor(cardId: string): Placement[] {
    const m = this.card(cardId);
    if (!m?.character || m.character.role !== 'merc') return [];
    const out: Placement[] = [];
    const loc = m.location;
    const onQ = loc.kind === 'quest' ? this.state.quests.find(x => x.id === loc.questId) : undefined;
    for (const q of this.state.quests) {
      if (q.state !== 'open' || (q.approaches && !q.chosenApproach)) continue;
      let best: Placement | null = null;
      const from = onQ && onQ.id !== q.id ? { questId: onQ.id, title: onQ.title } : null;
      q.slots.forEach((s, idx) => {
        if (s.filledBy && s.filledBy !== cardId) return;
        if (this.canTake(q.id, idx, cardId)) return;
        const c = coins(m, s.test);
        const bar = slotThreshold(s.test);
        if (!best || c > best.coins) best = { questId: q.id, title: q.title, idx, attr: s.test.attributes.join('+').toUpperCase(), coins: c, bar, strength: slotStrength(c, bar), here: s.filledBy === cardId, from };
      });
      if (best) out.push(best);
    }
    return out;
  }

  /** EVERY roster soldier against one quest place, for the quest page / hand / CLI candidates:
   *  legal first, then by coins. `from` = where they stand now (sending moves them); `blocked` =
   *  canTake's refusal. The soldier already in this place is left out. */
  slotFits(questId: string, slotIdx: number): SlotFit[] {
    const q = this.state.quests.find(x => x.id === questId);
    const s = q?.slots[slotIdx];
    if (!q || !s) return [];
    const bar = slotThreshold(s.test);
    return this.roster().filter(m => m.id !== s.filledBy).map(m => {
      const c = coins(m, s.test);
      const loc = m.location;
      const fromQ = loc.kind === 'quest' ? this.state.quests.find(x => x.id === loc.questId) : undefined;
      const blocked = this.canTake(questId, slotIdx, m.id);
      return {
        id: m.id, name: m.name, coins: c, explain: explainCoins(m, s.test),
        strength: slotStrength(c, bar), why: coinsWhy(m, s.test),
        blocked,
        gated: !!blocked && !this.canTake(questId, slotIdx, m.id, { ignoreApproach: true }),
        from: loc.kind === 'quest' ? { questId: loc.questId, idx: loc.slot, title: fromQ?.title ?? loc.questId } : null,
      };
    }).sort((a, b) => (a.blocked ? 1 : 0) - (b.blocked ? 1 : 0) || (a.from ? 1 : 0) - (b.from ? 1 : 0) || b.coins - a.coins);
  }

  /** Send one soldier to a quest. Without a place: their best FREE place there. With one: exactly
   *  that place — moving them off wherever they stand, and SWAPPING if someone holds it (the
   *  displaced soldier takes the mover's old place when they legally can, else goes back to the
   *  hand). One class with the room slots: an occupied target swaps. */
  sendTo(questId: string, cardId: string, slotIdx?: number): { ok: boolean; msg: string; warn?: boolean } {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q) return { ok: false, msg: 'no such quest' };
    if (q.approaches && !q.chosenApproach) return { ok: false, msg: 'pick an approach first' };
    const m = this.card(cardId);
    if (!m?.character || m.character.role !== 'merc') return { ok: false, msg: 'only soldiers go on quests' };
    let idx = slotIdx;
    if (idx === undefined || !Number.isFinite(idx)) {
      const p = this.placementsFor(cardId).find(x => x.questId === questId);
      if (!p) {
        const why = q.slots.map((_, i) => this.canTake(questId, i, cardId)).find(Boolean);
        return { ok: false, msg: `no free place on ${q.title} for ${m.name}${why ? ` (${why})` : ''}` };
      }
      idx = p.idx;
    }
    const why = this.canTake(questId, idx, cardId);
    if (why) return { ok: false, msg: why };
    const slot = q.slots[idx]!;
    if (slot.filledBy === cardId) return { ok: true, msg: `${m.name} is already there` };
    const from = m.location.kind === 'quest' ? { questId: m.location.questId, idx: m.location.slot } : null;
    const fq = from ? this.state.quests.find(x => x.id === from.questId) : undefined;
    const fqWasReady = !!fq && fq.id !== q.id && this.isCommitted(fq);
    let lead = '';
    if (from) this.unassign(from.questId, from.idx);
    if (slot.filledBy) {
      const other = this.card(slot.filledBy)!;
      this.doUnassign(q, slot);
      // the displaced soldier takes the mover's old place when they can — a true swap
      if (from && fq && !this.canTake(from.questId, from.idx, other.id) && this.assign(from.questId, from.idx, other.id).ok) {
        lead = `${other.name} swaps to ${this.placeName(fq, from.idx)}${fq.id === q.id ? '' : ` on ${fq.title}`}; `;
      } else lead = `${other.name} back in the hand; `;
    }
    slot.filledBy = cardId;
    m.location = { kind: 'quest', questId, slot: idx };
    const res = this.placedMsg(q, idx, m, lead);
    // a move OFF another quest can break the party it left — say so, in the result both UIs print
    if (fq && fq.id !== q.id && !fq.slots[from!.idx]!.filledBy) {
      const a = this.activeSlots(fq), n = a.filter(s => s.filledBy).length;
      const tail = ` — leaves ${fq.title}${n ? ` (now ${n} of ${a.length}${fqWasReady ? ", won't march" : ''})` : ' (now unmanned)'}`;
      return { ...res, msg: res.msg + tail, ...(fqWasReady ? { warn: true } : {}) };
    }
    return res;
  }

  /** Man every open quest. One soldier can only be on one quest, so ORDER decides who gets the
   *  good people: quests that NAME someone or demand a tag have the fewest ways to be manned and
   *  go first; then the ones closest to lapsing. */
  autoAssignAll(): { ok: boolean; msg: string; placed: number; warn?: boolean } {
    const rank = (q: Quest) => {
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      return active.some(s => s.requirement.kind === 'must-be') ? 0
        : active.some(s => s.requirement.kind === 'must-have') ? 1 : 2;
    };
    const open = this.state.quests.filter(q => q.state === 'open' && !(q.approaches && !q.chosenApproach))
      .sort((a, b) => rank(a) - rank(b) || a.createdCycle - b.createdCycle);
    let placed = 0, kept = 0;
    const short: string[] = [];
    for (const q of open) {
      const active = () => q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      const before = active().map(s => s.filledBy);
      const got = this.autoAssign(q.id).placed;
      // a quest that cannot be FULLY manned does not march, so soldiers left in it are wasted —
      // "3 soldiers named across 3 quests" left one idle in a half-manned raid while another quest
      // went unmanned (playtest 2026-09-25). Undo this pass's placements on a quest left short.
      if (active().some(s => !s.filledBy)) {
        if (got) active().forEach((s, i) => { if (s.filledBy && s.filledBy !== before[i]) this.unassign(q.id, q.slots.indexOf(s)) });
        const need = active().filter(s => !s.filledBy).length;
        short.push(`${q.title} needs ${need} more`);
        continue;
      }
      if (got) { placed += got; kept++ }
    }
    const n = (x: number, one: string, many = one + 's') => `${x} ${x === 1 ? one : many}`;
    const ready = open.length - short.length;
    const shortTail = short.length ? ` · short: ${short.slice(0, 3).join('; ')}${short.length > 3 ? ` (+${short.length - 3})` : ''}` : '';
    // a manned party that marches into a poor verdict is worth a second look before END
    const poor = open.map(q => ({ q, b: this.questOdds(q.id).band })).filter(x => x.b === 'long' || x.b === 'hopeless');
    const poorTail = poor.length ? ` · poor odds: ${poor.slice(0, 3).map(x => `${x.q.title} (${BAND_TEXT[x.b!]})`).join('; ')}` : '';
    return {
      ok: placed > 0,
      msg: placed
        ? `${n(placed, 'soldier')} placed on ${n(kept, 'quest')} · ${n(ready, 'quest')} ready${shortTail}${poorTail}`
        : `nobody free fits anything${shortTail}${poorTail}`,
      placed,
      ...(poor.length ? { warn: true } : {}),
    };
  }

  /** WHAT THIS PAYS, in the player's words — the ENVELOPE (QUESTS §68: kind and shape, and the
   *  engine's own numbers, which the game states plainly everywhere else). One implementation, so
   *  the board, the quest page and the text UI can never disagree about what a job is worth.
   *
   *  A saga BEAT names both halves: the side loot it pays now, and what the whole matter comes to
   *  — that second number is the reason to take the next beat, and a beat that only advertises its
   *  loot undersells itself badly. A FINALE pays the person at the centre, named only once the
   *  player has met them (the same gate the card writer uses). */
  questReward(questId: string): string {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q) return '';
    const chain = q.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    const NAME: Record<string, string> = {
      captive: 'a captive', recruit: 'a recruit', relic: 'a relic', lead: 'a lead',
    };
    const gold = q.rewardSpecs.filter(r => r.kind === 'gold').reduce((n, r) => n + r.value, 0);
    const parts = q.rewardSpecs.filter(r => r.kind !== 'gold').map(r => NAME[r.kind] ?? r.kind);
    // ECONOMY §7.2: the player reads a BAND, never the engine's number — an offer is a rumour,
    // not an invoice. (Designer, 2026-08-28: "dont show exact numbers for quest rewards".)
    if (gold >= 1) parts.push(coinBand(gold));
    if (q.isFinale) {
      const focal = chain ? this.card(chain.focalId) : undefined;
      // a personal finale settles the soldier's OWN matter — they are already the company's, so
      // "REWARD: Keesa" read as an offer to recruit someone standing in the yard (playtest 2026-09-25)
      if (chain?.isPersonal && focal) parts.unshift(`${focal.name}'s matter, settled`);
      else {
        // named only once the player has read the name (the saga's Knowing — the gate every card obeys)
        const fe = chain?.saga?.plan?.cast.find(p => p.focal);
        const named = !!focal && !!fe && knowingOf(chain!.saga!).named.has(fe.id);
        parts.unshift(this.finaleBrings(q, chain, named ? focal!.name : 'the one at the heart of it'));
      }
    }
    const now = parts.join(' + ') || 'side loot';
    // A mid-saga beat NEVER advertises the ending's payout. That number is the deferred reward and
    // the player is not meant to hold it (REWARD_BANK §5 sanctions only `bank` — "spoils so far" —
    // and PROMPT_RULES forbids surfacing banked-payoff text). What a beat honestly promises is that
    // the saga is still owed something.
    return chain && !q.isFinale ? `${now} · and the saga still owes` : now;
  }

  /** what a (non-personal) finale brings the company: the person at its centre — until a plan is chosen that lets them go.
   *  Read the way settleFinale reads it (sagaflow.fateFacts): the gold plan pays out what was set aside and they go free;
   *  a keep plan on a bank too thin to keep them (the void) pays salvage coin and they slip away */
  private finaleBrings(q: Quest, chain: Chain | undefined, who: string): string {
    const a = q.approaches?.find(x => x.id === q.chosenApproach);
    if (!a?.way || !chain?.saga?.plan) return who;
    const f = flow.fateFacts(this.sagaHost(), chain, a.way, 'success');
    if (f.focalIsMerc) return who;
    const coin = coinBand(chain.bank);
    if (a.rewardKind === 'gold') return `what was set aside, in coin${coin ? ` (${coin})` : ''}`;
    if (f.void) return `salvage coin${coin ? ` (${coin})` : ''} — too little was set aside to keep ${who}`;
    return who;
  }

  /** what choosing this finale plan does, as the short fate fact both UIs print after the plan's label ("joins the
   *  company", "held in your cells", "coin; goes free", personal "their matter settled" — STORYTELLER §2.6). The plan's
   *  way decides it; the reward warning reads the kind (approachRewardWarn) */
  approachOutcome(questId: string, approachId: string): string {
    const q = this.state.quests.find(x => x.id === questId);
    const a = q?.approaches?.find(x => x.id === approachId);
    if (!q || !a?.way) return '';
    const chain = q.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    const fe = chain?.saga?.plan?.cast.find(p => p.focal);
    return a.way === 'gold' && fe && helped(fe) ? 'coin; goes their way' : WAY_ENDING[a.way];
  }

  /** raw odds — ALWAYS visible (QUESTS §3); the Oracle adds computed %. `band` is the engine's
   *  plain-words verdict on the POOLED roll, shown at every Oracle precision once every active
   *  place is filled (null before); `partialAt` = the heads a partial needs. */
  questOdds(questId: string): QuestOdds {
    const q = this.state.quests.find(x => x.id === questId)!;
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    let totalCoins = 0, totalBar = 0, filled = 0;
    for (const s of active) {
      totalBar += slotThreshold(s.test);
      if (s.filledBy) { totalCoins += coins(this.card(s.filledBy)!, s.test); filled++ }
    }
    const oracle = this.state.fort.rooms.find(r => r.type === 'oracle');
    const precision = oraclePrecision(oracle ? this.comfort(oracle) : null);
    const o = precision > 0 ? odds(totalCoins, totalBar) : null;
    const manned = active.length > 0 && filled === active.length;
    return {
      coins: totalCoins, bar: totalBar, success: o?.success ?? null, partial: o?.partialOrBetter ?? null, precision,
      band: manned ? oddsBand(totalCoins, totalBar) : null, partialAt: PARTIAL_FRAC * totalBar,
      filled, of: active.length,
    };
  }

  /** what a quest brings, as kinds (known at birth) — the marker/board icons. A finale lists
   *  its approaches' outcomes (the chosen one only, once chosen). */
  questRewardKinds(questId: string): RewardKindTag[] {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q) return [];
    const kinds = new Set<RewardKindTag>();
    for (const r of q.rewardSpecs) if (r.kind !== 'gold' || r.value >= 1) kinds.add(r.kind);
    const chain = q.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    if (q.isFinale && q.approaches && !chain?.isPersonal) {
      for (const a of q.approaches) if (!q.chosenApproach || a.id === q.chosenApproach) kinds.add(a.rewardKind);
    }
    const ORDER: RewardKindTag[] = ['captive', 'recruit', 'relic', 'lead', 'gold'];
    return ORDER.filter(k => kinds.has(k));
  }

  /** a warning about what the quest brings versus what the fort can hold ("brings a captive ·
   *  cells full"), or null */
  questRewardWarn(questId: string): string | null {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q) return null;
    // an unchosen finale's endings are POSSIBLE kinds, not what it brings: each ending's own warning
    // sits on its approach card (approachRewardWarn), never on the quest as a certainty
    const kinds = q.isFinale && q.approaches && !q.chosenApproach
      ? [...new Set(q.rewardSpecs.filter(r => r.kind !== 'gold' || r.value >= 1).map(r => r.kind))]
      : this.questRewardKinds(questId);
    const chain = q.isFinale && q.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    return this.rewardWarnFor(kinds, chain);
  }
  /** one finale approach's warning ('brings a captive · no Dungeon — they can only be ransomed or sold'), or null */
  approachRewardWarn(questId: string, approachId: string): string | null {
    const q = this.state.quests.find(x => x.id === questId);
    const a = q?.approaches?.find(x => x.id === approachId);
    const chain = q?.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    // a personal finale settles the soldier's own matter whichever plan wins — it brings no one to keep
    if (!a || chain?.isPersonal) return null;
    return this.rewardWarnFor([a.rewardKind], chain);
  }
  /** what the fort cannot hold of what these rewards bring — the one rule behind both warnings, saying what then
   *  happens. A finale's person (`finale`: its chain) is settled by settleFinale; a one-off's by applyResolution */
  private rewardWarnFor(kinds: RewardKindTag[], finale?: Chain): string | null {
    // a focal who already stands with the company is never re-disposed of (settleFinale): nobody arrives
    if (finale && this.card(finale.focalId)?.character?.role === 'merc') return null;
    if (kinds.includes('captive')) {
      // a captive waits in holding either way (settleFinale and applyResolution alike): without a Dungeon, or with every
      // cell taken, holding is all there is — ransom or sell them there, or they are handed off when its clock runs out
      if (!this.hasRoom('dungeon')) return 'brings a captive · no Dungeon — they can only be ransomed or sold from holding';
      if (this.captives().length >= this.captiveCapacity()) return `brings a captive · cells full ${this.captives().length}/${this.captiveCapacity()} — they wait in holding`;
    }
    if (kinds.includes('recruit')) {
      if (finale) {
        // a finale's recruit joins the roster when there is room, else waits at the tavern, already paid for — Tavern or
        // not (settleFinale counts the room without the focal, who may still be waiting in limbo)
        const n = this.roster().filter(m => m.id !== finale.focalId).length, cap = this.rosterCapacity();
        if (n >= cap) return `brings a recruit · roster full ${n}/${cap} — they wait at the tavern, already paid for${this.hasRoom('tavern') ? '' : ', until a Tavern is built to take them on'}`;
        return null;
      }
      // a rescued recruit with no Tavern pays what they can and MOVES ON (applyResolution) — the
      // roster count is beside the point until there is somewhere for them to wait
      if (!this.hasRoom('tavern')) return 'brings a recruit · no Tavern — they will thank you and move on';
      if (this.roster().length >= this.rosterCapacity()) return `brings a recruit · roster full ${this.roster().length}/${this.rosterCapacity()}`;
    }
    return null;
  }

  /** what abandoning this quest costs, said BEFORE the click (both UIs' two-step confirm) */
  abandonConsequence(questId: string): string {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q) return 'no such open quest';
    const party = q.slots.filter(s => s.filledBy).length;
    const back = party ? ` ${party === 1 ? 'The soldier goes' : party === 2 ? 'Both soldiers go' : `All ${party} soldiers go`} back to the hand.` : '';
    if (q.chainId) {
      const out = this.abandonChainOutcome(q);
      return out === 'continues' ? `A saga step: the card is gone, the thread dangles — a continuation lead returns to the board.${back}`
        : out === 'slips' ? `A saga step: this step has now been left untaken three times — the saga slips out of reach${this.state.chains.find(c => c.id === q.chainId)?.state === 'finale-pending' ? ', finale and all' : ''}.${back}`
        : `A saga step whose story is already over — nothing comes back.${back}`;
    }
    if (!q.fromLead) return `The card is gone for good.${back}`;
    if (this.state.leads.some(l => l.id === q.fromLead!.id)) return `The card is gone; its post is still standing.${back}`;
    if (!this.canReroll()) return `The lead does NOT come back — a lead can only be taken up again once a cycle.${back}`;
    return `Set aside: the lead goes back on the board, to be written again (once a cycle).${back}`;
  }

  // ---- TURN GUIDANCE (R4/R5): what END would throw away, and what to do next ---------------------------

  /** the active places of a quest (a finale's chosen approach only) */
  private activeSlots(q: Quest) { return q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots }

  /** R5: everything END would lose or leave behind, one list for the seal and the CLI's `end!`:
   *  a finale with no approach; a quest that goes cold at this END (its TTL, or the stall rule —
   *  both read questLapsesAt); a part-filled quest that will not march; a part-filled STANDING-POST
   *  quest (its placement walks back when the post's quest goes; an empty one is no loss, the post
   *  writes another); a saga's continuation lead, or a lead worth money, going cold; a captive handed
   *  off from holding; a hireable guest leaving the tavern. The predicates are doEndCycle's own. */
  endWarnings(): EndWarning[] {
    const next = this.state.cycle + 1;
    const out: EndWarning[] = [];
    const quest = (q: Quest) => ({ screen: 'quest' as const, questId: q.id });
    for (const q of this.state.quests.filter(x => x.state === 'open').sort((a, b) => this.questLapsesAt(a) - this.questLapsesAt(b))) {
      if (this.isCommitted(q)) continue;
      const active = this.activeSlots(q);
      const filled = active.filter(s => s.filledBy).length, of = active.length;
      const faucet = this.questIsFaucet(q);
      const goes = this.questLapsesAt(q) <= next;
      const lapsesNow = goes && (!faucet || filled > 0);
      const base = { key: q.id, questId: q.id, title: q.title, filled, of, lapsesNow, target: quest(q) };
      if (q.approaches && !q.chosenApproach) {
        out.push({ ...base, why: 'needs-approach', text: `needs its ending chosen${lapsesNow ? ' — and goes cold this END' : ''}` });
      } else if (lapsesNow) {
        out.push({ ...base, why: 'lapses', text: faucet
          ? `goes cold this END — ${filled} of ${of} placed walk back; the post will put up another`
          : `goes cold this END — ${filled ? `${filled} of ${of} placed` : 'nobody placed'}${this.questStallAt(q) !== null ? ` (it has failed to march ${q.stalls ?? 0} time${(q.stalls ?? 0) === 1 ? '' : 's'})` : ''}` });
      } else if (filled > 0) {
        out.push({ ...base, why: 'short', text: `won't march — ${filled} of ${of} placed` });
      }
    }
    for (const l of this.leadsGoingCold()) {
      const chain = l.chainInfo.kind === 'continues' ? this.state.chains.find(c => c.id === (l.chainInfo as { chainId: string }).chainId) : undefined;
      const b = leadBand(l);
      out.push({ key: l.id, questId: null, title: chain ? this.sagaTitle(chain) : l.title ?? `${l.archetype} in ${REGION[l.region]?.name ?? l.region}`,
        why: 'lead-lapses', filled: 0, of: 0, lapsesNow: true, target: { screen: 'leads' },
        text: chain ? `the saga slips this END unless its lead is pursued (${l.id})` : `a lead worth ${b.label} goes cold this END (${l.id})` });
    }
    for (const h of this.state.holding.filter(x => x.expiresAtCycle <= next)) {
      const c = this.card(h.cardId);
      if (!c) continue;
      out.push({ key: c.id, questId: null, title: c.name, why: 'handoff', filled: 0, of: 0, lapsesNow: true, target: { screen: 'holding', cardId: c.id },
        text: `handed off at this END at the quick price ~${this.lapseQuote(c.id) ?? 0}g — ransom ~${this.ransomQuote(c.id) ?? 0}g, or keep them` });
    }
    for (const t of this.state.tavern.filter(x => !x.prepaid && x.expiresAtCycle <= next && !this.hireBlock(x.cardId))) {
      const c = this.card(t.cardId);
      if (!c) continue;
      out.push({ key: c.id, questId: null, title: c.name, why: 'leaves', filled: 0, of: 0, lapsesNow: true, target: { screen: 'tavern', cardId: c.id },
        text: `leaves the tavern at this END — hire for ${this.hireQuote(c.id) ?? 0}g` });
    }
    return out;
  }
  /** leads the player could pursue that go cold at this END AND are a real loss: a saga's
   *  continuation (the saga slips) or a lead carrying money (leadBand ≥ 2 — the reckoning names
   *  those as lost; an unbanded lead lapses quietly, as it always has) */
  private leadsGoingCold(): Lead[] {
    const next = this.state.cycle + 1;
    return this.leadBoard().filter(r => !r.blocked && r.lead.expiresAtCycle !== null && r.lead.expiresAtCycle <= next
      && (r.lead.chainInfo.kind === 'continues' || leadBand(r.lead).band >= 2)).map(r => r.lead);
  }
  /** true when no party would march at this END */
  nobodyMarches(): boolean { return this.marching() === 0 }
  /** how many parties march at this END */
  marching(): number { return this.state.quests.filter(q => q.state === 'open' && this.isCommitted(q)).length }

  /** R4: the next concrete things to do, most pressing first (max 6), each with where it happens
   *  and, when one engine action does it, that action. Ends on "end the cycle" when END is safe.
   *  `placements` = a cache of roomPlacementsFor by card id (the server computes them once a view). */
  nextSteps(placements?: Map<string, RoomPlacement[]>): NextStep[] {
    const st = this.state;
    const steps: NextStep[] = [];
    const cyc = (n: number) => `${n} cycle${n === 1 ? '' : 's'}`;
    const open = st.quests.filter(q => q.state === 'open');
    // 1) no Map room: nothing reaches the board
    if (!this.hasRoom('map-room')) {
      const cost = buildCost(ROOM_TYPE['map-room']!);
      steps.push({ kind: 'build', text: 'Build a Map room', detail: 'quests go up on its table', urgent: true,
        target: { screen: 'build', type: 'map-room' },
        act: { type: 'build', args: ['map-room'], label: `Build · ${cost}g`, cli: 'build map-room', block: this.buildableTypes().find(b => b.type === 'map-room')?.reason ?? null } });
    }
    // 2) a finale waits on its ending
    for (const q of open.filter(x => x.approaches && !x.chosenApproach)) {
      steps.push({ kind: 'approach', text: `Choose how "${q.title}" ends`, detail: `${q.approaches!.length} ways to end it`, urgent: true,
        target: { screen: 'quest', questId: q.id }, act: null });
    }
    // 3) quests nobody is marching on, while soldiers stand idle — only those the idle soldiers
    //    can FULLY man get an Auto button (a half-manned party does not march; the button was a
    //    dead click every cycle when none could be)
    const idle = this.roster().filter(m => m.location.kind === 'held').length;
    const unmanned = open.filter(q => !(q.approaches && !q.chosenApproach) && !this.isCommitted(q));
    const fillable = idle ? unmanned.filter(q => this.canFullyMan(q.id)) : [];
    const goesCold = (q: Quest) => (!this.questIsFaucet(q) || this.activeSlots(q).some(s => s.filledBy)) && this.questLapsesAt(q) <= st.cycle + 1;
    if (fillable.length) {
      const cold = fillable.filter(goesCold).length;
      const idleTxt = `${idle} soldier${idle === 1 ? '' : 's'} idle${cold ? ` · ${cold} go${cold === 1 ? 'es' : ''} cold this END` : ''}`;
      if (fillable.length === 1) {
        const q = fillable[0]!, a = this.activeSlots(q);
        steps.push({ kind: 'man', text: `Man "${q.title}"`, detail: `${a.filter(s => s.filledBy).length} of ${a.length} placed · ${idleTxt}`, urgent: cold > 0,
          target: { screen: 'quest', questId: q.id }, act: { type: 'auto', args: [q.id], label: 'Auto-fill', cli: `auto ${q.id}`, block: null } });
      } else {
        steps.push({ kind: 'man', text: `${fillable.length} quests unmanned`, detail: idleTxt, urgent: cold > 0,
          target: { screen: 'map' }, act: { type: 'autoall', args: [], label: 'Auto-fill every quest', cli: 'auto all', block: null } });
      }
    } else if (idle && unmanned.length) {
      // soldiers idle, quests open, and no quest they can fill: say so (no button — nothing to click)
      steps.push({ kind: 'man', text: `${unmanned.length} quest${unmanned.length === 1 ? '' : 's'} the idle can't fully man`,
        detail: `${idle} soldier${idle === 1 ? '' : 's'} idle — each quest needs more hands or a better fit`, urgent: false,
        target: { screen: 'map' }, act: null });
    }
    // 4) leads the map table could be writing
    const pursuable = this.leadBoard().filter(r => !r.blocked);
    if (pursuable.length) {
      const cold = pursuable.filter(r => r.lead.expiresAtCycle !== null && r.lead.expiresAtCycle <= st.cycle + 1).length;
      // urgent only for a REAL loss (the END guard's own predicate: a saga's lead, a lead with money in it)
      const loss = this.leadsGoingCold().length > 0;
      const one = pursuable[0]!.lead;
      const title = one.title ?? `${one.archetype} in ${REGION[one.region]?.name ?? one.region}`;
      steps.push(pursuable.length === 1
        ? { kind: 'pursue', text: `Pursue a lead — ${title}`, detail: cold ? 'goes cold this END' : null, urgent: loss,
            target: { screen: 'leads' }, act: { type: 'pursue', args: [one.id], label: 'Pursue', cli: `pursue ${one.id}`, block: null } }
        : { kind: 'pursue', text: `Pursue ${pursuable.length} leads`, detail: cold ? `${cold} go${cold === 1 ? 'es' : ''} cold this END` : null, urgent: loss,
            target: { screen: 'leads' }, act: { type: 'pursueall', args: [], label: `Pursue all (${pursuable.length})`, cli: 'pursue all', block: null } });
    }
    // 5) a captive in holding about to be handed off at the quick price
    const hold = [...st.holding].sort((a, b) => a.expiresAtCycle - b.expiresAtCycle).find(h => h.expiresAtCycle - st.cycle <= 2);
    const hc = hold ? this.card(hold.cardId) : undefined;
    if (hold && hc) {
      const left = hold.expiresAtCycle - st.cycle;
      const block = this.acceptBlock(hc.id);
      // keeping them is the step; when the cells can't take them, the step is what makes room
      steps.push({ kind: 'holding', text: `${hc.name} in holding — ${this.holdingDeadline(hc.id)}`,
        detail: `ransom ~${this.ransomQuote(hc.id) ?? 0}g, or keep them${block ? ` — ${block.reason}` : ''}`, urgent: left <= 1,
        target: { screen: 'holding', cardId: hc.id },
        act: block ? this.fixAct(block.fix) : { type: 'accept', args: [hc.id], label: 'To the cells', cli: `accept ${hc.id}`, block: null } });
    }
    // 6) someone at the tavern you can hire now
    const guest = [...st.tavern].filter(t => !this.hireBlock(t.cardId))
      .sort((a, b) => Number(!!b.prepaid) - Number(!!a.prepaid) || a.expiresAtCycle - b.expiresAtCycle)[0];
    const gc = guest ? this.card(guest.cardId) : undefined;
    if (guest && gc) {
      const cost = this.hireQuote(gc.id) ?? 0;
      steps.push({ kind: 'hire', text: `Hire ${gc.name}${cost ? ` · ${cost}g` : ' — already paid for'}`,
        detail: guest.prepaid ? null : this.tavernDeadline(gc.id),
        urgent: !guest.prepaid && guest.expiresAtCycle <= st.cycle + 1,
        target: { screen: 'tavern', cardId: gc.id }, act: { type: 'hire', args: [gc.id], label: cost ? `Hire · ${cost}g` : 'Hire', cli: `hire ${gc.id}`, block: null } });
    }
    // 7) the Great Hall can go up
    const gh = this.ghInfo();
    if (gh.ready) {
      const hall = st.fort.rooms.find(r => r.type === 'great-hall');
      steps.push({ kind: 'gh', text: `Raise the Great Hall — ready · ${gh.cost}g`,
        detail: gh.unlocks.length ? `opens ${gh.unlocks.slice(0, 3).map(u => u.name).join(', ')}${gh.unlocks.length > 3 ? '…' : ''}` : null, urgent: false,
        target: hall ? { screen: 'room', roomId: hall.id } : { screen: 'fort' },
        act: { type: 'gh', args: [], label: `Raise · ${gh.cost}g`, cli: 'gh', block: null } });
    }
    // 8) a stored card with somewhere to go: a raw captive to rack, a tamed one or a relic to show —
    //    or, when nothing takes it, the one purchase that makes a place for it
    const stored = [...this.captives(), ...this.relics().filter(r => this.isOwned(r))]
      .filter(c => c.location.kind !== 'room' && !st.breaking.some(b => b.cardId === c.id));
    let rack: NextStep | null = null, show: (NextStep & { gain: number; tamed: boolean }) | null = null, place: NextStep | null = null;
    for (const c of stored) {
      const rows = placements?.get(c.id) ?? this.roomPlacementsFor(c.id);
      const best = rows.find(p => p.ok && p.roomId);
      const cs = this.captiveState(c.id);
      if (best) {
        const act = { type: 'setin', args: [best.roomId!, c.id], label: 'Set in', cli: `setin ${c.id} ${best.roomId}`, block: null };
        const target = { screen: 'room' as const, roomId: best.roomId!, cardId: c.id };
        if (best.kind === 'rack') {
          rack ??= { kind: 'rack', text: `Rack ${c.name} — ${best.label}`, detail: `the ${best.roomName}`, urgent: false, target, act: { ...act, label: 'To the rack' } };
        } else if (cs?.state === 'tamed' || best.gain > 1e-9 || best.comfortAfter - best.comfortBefore > 1e-9) {
          const tamed = cs?.state === 'tamed';
          const cand = { kind: 'setin' as const, text: tamed ? `Tamed ${c.name} — set them in a room` : `Set ${c.name} in the ${best.roomName}`,
            detail: `${best.roomName}: ${best.label}`, urgent: false, target, act, gain: best.gain, tamed };
          if (!show || (tamed && !show.tamed) || (tamed === show.tamed && cand.gain > show.gain)) show = cand;
        }
      } else if (!place) {
        // the place that serves what the card is FOR (placeFixFor — the prisoner hub and the CLI's
        // Dungeon view make the same choice): a place to add, or a room to BUILD
        const pf = this.placeFixFor(c.id, rows);
        if (pf && 'action' in pf.fix && pf.fix.action !== 'gh') {
          const f = pf.fix;
          place = { kind: f.action === 'build' ? 'build' : 'addplace',
            text: f.action === 'build' ? `Build a ${pf.roomName}` : f.action === 'upgrade' ? `Add a place to the ${pf.roomName}` : f.label.split(' · ')[0]!,
            detail: `${c.name} has nowhere to go`, urgent: false,
            target: f.action === 'upgrade' ? { screen: 'room', roomId: f.roomId, cardId: c.id } : f.action === 'build' ? { screen: 'build', type: f.type } : { screen: 'fort' },
            act: this.fixAct(f) };
        }
      }
    }
    if (show) { const { gain: _g, tamed: _t, ...s } = show; steps.push(s) }
    if (rack) steps.push(rack);
    if (place) steps.push(place);
    // 9) GROW: the Great Hall waits on prestige and no room earns any — name the room that would
    //    (following the scroll alone never moved the goal off 0.0)
    if (!gh.ready && gh.next !== null && gh.have < (gh.need ?? 0) && !place
      && !st.fort.rooms.some(r => ROOM_TYPE[r.type]!.benefit === 'prestige')) {
      const type = this.bestPrestigeBuild();
      const f = type ? this.buildFix(type) : null;
      if (type && f) steps.push({ kind: 'build', text: `Build a ${ROOM_TYPE[type]!.name} — prestige raises the Great Hall`,
        detail: `the Great Hall's next tier needs ${gh.need} prestige; relics and tamed captives on show there earn it`, urgent: false,
        target: { screen: 'build', type }, act: this.fixAct(f) });
    }
    // urgent first, the rest in the order above; END closes the list when it is safe
    const ordered = [...steps.filter(s => s.urgent), ...steps.filter(s => !s.urgent)].slice(0, 5);
    if (!ordered.length || (!ordered.some(s => s.urgent) && !this.endWarnings().length)) {
      const n = this.marching();
      ordered.push({ kind: 'end', text: ordered.length ? (n ? `Or end the cycle — ${n} part${n === 1 ? 'y marches' : 'ies march'}` : 'Or end the cycle')
        : n ? `All set — ${n} part${n === 1 ? 'y marches' : 'ies march'}` : 'All set — end the cycle',
        detail: null, urgent: false, target: { screen: 'map' }, act: null });
    }
    return ordered;
  }

  /** a Fix that is an engine action, as a next step's one-click act (a place-to-go fix has none) */
  private fixAct(f: Fix | null): NextStep['act'] {
    if (!f || !('action' in f)) return null;
    // a build that first needs a free cell: the one click is the dig (never a dead, disabled Build)
    if (f.action === 'build' && f.block && this.buildableTypes().find(b => b.type === f.type)?.blocker === 'cell') {
      const cost = excavateCost(this.state.fort.cells.length);
      // the label is what THIS click does (short, so it never crowds the step's own words);
      // what must follow rides in `then`
      return { type: 'excavate', args: [], label: `Dig a cell · ${cost}g`, cli: 'excavate',
        block: this.gold() < cost ? `short ${cost - this.gold()}g` : null, then: `${f.label.split(' · ')[0]} ('build ${f.type}')` };
    }
    const args = f.action === 'upgrade' ? [f.roomId] : f.action === 'build' ? [f.type] : [];
    return { type: f.action, args, label: f.label, cli: [f.action, ...args].join(' '), block: f.block };
  }

  /** a liability taken on this cycle, said plainly: it is a card the company holds, never taken out of its gold on its own
   *  — "⚠ 5g debt" beside 752g read as a sum the company somehow could not pay. A finale's shortfall is a debt; a partial's
   *  leavings are evidence or a mess; each is settled by hand ('settle', the card's button), or collectors come */
  static debtText(d: { name: string; amount: number }): string {
    const what = d.name === 'evidence' ? 'evidence left behind' : d.name === 'mess' ? 'a mess left behind' : 'a debt';
    return `⚠ ${what}, ${d.amount}g to settle — not paid from your gold until you settle it`;
  }

  /** the cycle's spoils in one line — the CLI TALLY and the web's after-PROCEED toast say the same */
  static tallyLine(s: CycleSummary): string {
    const names = (xs: { name: string }[], one: string, many: string) => xs.length > 2 ? `${xs.length} ${many}` : xs.map(x => x.name).join(', ') + (one ? ` ${one}` : '');
    const dg = s.goldAfter - s.goldBefore, dp = s.prestigeAfter - s.prestigeBefore;
    const parts = [
      dg ? `${dg > 0 ? '+' : '−'}${Math.abs(dg)}g` : '',
      Math.abs(dp) >= 0.05 ? `${dp > 0 ? '+' : '−'}${Math.abs(dp).toFixed(1)} prestige` : '',
      ...s.levelUps.map(l => `⭐ ${l.name} L${l.level}`),
      s.wounds.length ? `🩸 ${names(s.wounds, 'wounded', 'wounded')}` : '',
      s.captivesTaken.length ? `⛓ ${names(s.captivesTaken, 'taken', 'captives taken')}` : '',
      s.recruits.length ? `🍺 ${names(s.recruits, 'at the tavern', 'at the tavern')}` : '',
      s.relicsGained.length ? `🗝 ${names(s.relicsGained, '', 'relics')}` : '',
      s.tamed.length ? `🔗 ${names(s.tamed, 'tamed', 'tamed')}` : '',
      s.newLeads ? `+${s.newLeads} lead${s.newLeads === 1 ? '' : 's'}` : '',
      s.lapsed.length ? `${s.lapsed.length} went cold` : '',
      s.leadsCold.length ? `${s.leadsCold.length} lead${s.leadsCold.length === 1 ? '' : 's'} lost` : '',
      s.stalled.length ? `${s.stalled.length} did not march` : '',
      (s.handedOff ?? []).length ? `⛓ ${names(s.handedOff!, 'handed off', 'handed off')}` : '',
      ...(s.debts ?? []).map(d => d.text ?? Game.debtText(d)),
      ...(s.setbacks ?? []).map(b => `✗ setback ${b.failures}/${b.budget} — ${b.title}`),
    ].filter(Boolean);
    return parts.join(' · ') || 'nothing changed hands';
  }

  // ---- END CYCLE (the reckoning) -----------------------------------------------------------------------

  private cycleInFlight = false;
  // TEMPO P11/P15: the reckoning as it is being written — an ordered list of blocks (head, one
  // per marching quest, tail) so a landed report can be READ while the slow ones are still out
  private reckoning: { writing: boolean; blocks: string[][]; meta: (Omit<ReckonMeta, 'from' | 'to'> & { block: number })[]; landed: Set<string> } | null = null;
  /** what the cycle's own events add to the tally (wounds, tamings, losses) — set only while a
   *  reckoning runs; everything else in the summary is a before/after diff */
  private cycleAcc: { wounds: CycleSummary['wounds']; tamed: CycleSummary['tamed']; lapsed: string[]; stalled: string[]; leadsCold: string[];
    handedOff: NonNullable<CycleSummary['handedOff']>; setbacks: NonNullable<CycleSummary['setbacks']> } | null = null;
  /** the finished reckoning's shape, kept after the cycle ends — a surface that prints as it goes
   *  (a terminal) needs to know what the blocks it never caught actually turned into */
  private lastBlocks: string[][] = [];

  /** non-null from the first instant of a reckoning until it ends; `writing` false once every
   *  line is in (the 12-16s flesh tail must not hold the player on the screen).
   *  `blocks` is the SHAPE — head, one per marching quest in id order, tail — which a surface that
   *  cannot rewrite what it already printed (a terminal) needs in order to tell what actually
   *  landed. A page that re-renders can keep using `lines`. */
  /** the last completed reckoning, block by block (empty before the first one) */
  lastReckoningBlocks(): string[][] { return this.lastBlocks.map(b => [...b]) }

  reckoningView(): { writing: boolean; lines: string[]; blocks: string[][]; meta: ReckonMeta[] } | null {
    if (!this.reckoning) return null;
    const blocks = this.reckoning.blocks.map(b => [...b]);
    // only quests whose report has LANDED — the verdict must not beat its own story to the page
    const landed = this.reckoning.landed;
    return { writing: this.reckoning.writing, lines: blocks.flat(), blocks,
      meta: Game.placeMeta(this.reckoning.meta.filter(m => landed.has(m.questId)), blocks) };
  }
  /** a meta row's line range = where its block sits in the flattened lines */
  private static placeMeta(meta: (Omit<ReckonMeta, 'from' | 'to'> & { block: number })[], blocks: string[][]): ReckonMeta[] {
    const starts: number[] = [];
    let at = 0;
    for (const b of blocks) { starts.push(at); at += b.length }
    return meta.map(({ block, ...m }) => ({ ...m, from: starts[block] ?? 0, to: (starts[block] ?? 0) + (blocks[block]?.length ?? 0) }));
  }

  async endCycle(): Promise<string[]> {
    // TEMPO P9 (designer ruling 2026-08-26): END WAITS for work in flight — before the guard,
    // before the cycle number moves, so a card being written still lands on the board it was
    // pursued from and no reserved lead meets the expiry passes below
    await this.drain();
    // re-entrancy guard: a double END (GUI double-click) must never interleave — and must not
    // clear the reckoning it exists to protect (TEMPO I10)
    if (this.cycleInFlight) return ['(the cycle is already resolving)'];
    this.cycleInFlight = true;
    try {
      return await this.doEndCycle();
    } finally {
      this.cycleInFlight = false;
      this.reckoning = null;
      this.cycleAcc = null;
    }
  }

  private async doEndCycle(): Promise<string[]> {
    const st = this.state;
    // the TALLY's before-snapshot, taken at the press of END (nothing below reads it back)
    const before = {
      gold: this.gold(), prestige: this.prestige(),
      levels: new Map(this.roster().map(m => [m.id, m.character!.level])),
      leads: new Set(this.visibleLeads().map(l => l.id)),
      holding: new Set(st.holding.map(h => h.cardId)), tavern: new Set(st.tavern.map(t => t.cardId)),
      relics: new Set(this.relics().filter(r => this.isOwned(r)).map(r => r.id)),
      // debts by id → amount: a new debt can MERGE into a held stack, so the tally diffs amounts
      debts: new Map(st.cards.filter(isLiability).map(c => [c.id, Math.abs(c.value) * (c.qty ?? 1)])),
    };
    this.cycleAcc = { wounds: [], tamed: [], lapsed: [], stalled: [], leadsCold: [], handedOff: [], setbacks: [] };
    st.cycle += 1;
    // the report is a list of BLOCKS read as it grows (see `reckoning`); `report` points at
    // whichever block the current push sites belong to — the head now, the tail after step 3
    const blocks: string[][] = [];
    let report: string[] = [];
    blocks.push(report);
    this.reckoning = { writing: true, blocks, meta: [], landed: new Set() };
    // tier-ups from this cycle's fort phase lead the report (the moment must be SEEN)
    if (st.pendingTierLines?.length) { report.push(...st.pendingTierLines); st.pendingTierLines = [] }

    // (the FLESH pass runs at step 7, AFTER resolution/staging — people minted THIS
    // reckoning — finale focals, fresh tavern faces — must be fleshed before the player sees them)

    // 1) resolve committed quests in quest-id order (all party slots filled = committed).
    // DELIVERY IS COMPUTED HERE, BEFORE THE AI NARRATES — including the finale's fate
    // (QUESTS §8 solidity rule b; the narrator must name what is actually delivered).
    const ready = st.quests.filter(q => q.state === 'open' && this.isCommitted(q)).sort((a, b) => a.id.localeCompare(b.id));
    // a partially-staffed quest silently NOT marching was invisible — say it plainly, but a
    // quest stalled 3 cycles running is SET ASIDE (the same ⏸ line printed ten cycles straight
    // while a saga froze; a lapsed chain beat respawns its lead — the story waits)
    for (const q of st.quests.filter(x => x.state === 'open' && !this.isCommitted(x))) {
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      const filled = active.filter(s => s.filledBy).length;
      if (filled === 0) { q.stalls = 0; continue }
      // a quest this END's expiry pass takes anyway is reported ONCE, as gone cold — not also as
      // "did not march" (the tally counted one lost quest twice)
      if (st.cycle - q.createdCycle >= this.questTtl(q)) continue;
      q.stalls = (q.stalls ?? 0) + 1;
      if (q.stalls >= STALL_LIMIT && !q.isFinale) {
        this.abandonQuest(q, report);   // its own lapse line suffices — a second read as spam
      } else {
        report.push(`⏸ ${q.title} did not march — every slot must be filled (${filled} of ${active.length}).`);
        this.cycleAcc?.stalled.push(q.title);
      }
    }
    st.quests = st.quests.filter(q => q.state === 'open');
    if (ready.length === 0) report.push('A quiet cycle — no one marched.');
    const resolutions: Resolution[] = [];
    const questBlocks = new Map<string, string[]>();
    const sagaHost = this.sagaHost();
    for (const q of ready) {
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      const party = active.map(s => this.card(s.filledBy!)!);
      const rolled = this.forceOutcome(q, resolvePooled(this.rng, active.map(s => ({ unit: this.card(s.filledBy!)!, test: s.test }))));
      const delivery = computeDelivery(this.rng, q, rolled.outcome);
      let fate: FinaleFate | undefined;
      const chain = q.chainId ? st.chains.find(c => c.id === q.chainId) : undefined;
      if (q.isFinale && chain) fate = finaleFate(this.rng, chain, rolled.outcome);
      // a saga quest's report facts are decided HERE, synchronously, in id order: who decides (D5), the hurt (D3, on the
      // main rng), the finale's Outcome sentence (D18). Only the writing runs later, beside every other report
      const saga = q.saga && chain?.saga?.plan ? {
        pos: q.saga.pos,
        inn: flow.reportIn(sagaHost, chain, q.saga.pos, q.situation, {
          outcome: rolled.outcome, party, tests: active.map(s => s.test), gravity: q.gravity ?? 'a small, everyday job',
          way: q.approaches?.find(a => a.id === q.chosenApproach)?.way, fate,
        }),
      } : undefined;
      resolutions.push({ quest: q, outcome: rolled.outcome, delivery, party, fate, rolled, ...(saga ? { saga } : {}) });
      // This quest's slot on the screen, held open in id order until its own call lands. The
      // first two lines are EXACTLY what applyResolution re-pushes, so the card the player is
      // re-reading does not move when the report replaces the placeholder — and the card is the
      // only real content there is to fill the wait on a one-quest cycle (TEMPO P12 / R2).
      // The glyph is ✎ and not ⏳ because ⏳ already means "this quest lapsed" (abandonQuest).
      const block = [`— ${q.title} (${q.id})`,
        ...(q.situation ? [`「${q.situation}」`] : []),
        `✎ ${party.map(p => p.name).join(', ')} ${party.length === 1 ? 'marches' : 'march'} out — the report is being written…`];
      questBlocks.set(q.id, block); blocks.push(block);
      this.reckoning.meta.push({ questId: q.id, title: q.title, outcome: rolled.outcome, heads: rolled.heads, coins: rolled.totalCoins,
        bar: rolled.totalBar, partialAt: PARTIAL_FRAC * rolled.totalBar, party: party.map(p => p.name), partyIds: party.map(p => p.id),
        isFinale: !!q.isFinale, chainId: q.chainId ?? null, block: blocks.length - 1 });
    }
    // everything pushed from here on is fort news and lands AFTER the stories. NOTE the head
    // block (tier-ups, ⏸ stalls, lapses, 'a quiet cycle') still prints BEFORE them — TEMPO P18's
    // reordering is deliberately not done here; those lines are instant, so at the top they are
    // the first thing on an otherwise empty screen rather than a wall between the player and a
    // story still being written.
    report = [];

    // earned leads are minted BEFORE narration, so the report can say what work it heard of and the
    // lead the player then finds IS that work (a scouting report used to end on "found the trace"
    // while a random job type landed on the board)
    const preLeads = this.preMintedLeads = new Map<string, Lead[]>();
    for (const r of resolutions) if (r.delivery.leadGrants.length)
      preLeads.set(r.quest.id, r.delivery.leadGrants.map(b => this.freshLead('reward', b)));
    // 2) ONE batched AI call for the one-offs; each saga report is its own call (the v4 storyteller), all in parallel
    const aiInputs: ResolveQuestInput[] = resolutions.filter(r => !r.saga).map(r => ({
      questId: r.quest.id, title: r.quest.title, situation: r.quest.situation, job: r.quest.job, gravity: r.quest.gravity,
      rarity: r.quest.rarity, outcome: r.outcome,
      // habits reach the narrator only ~40% of the time — a habit not shown cannot become a
      // signature stamp (the scar-tic appeared in 9 of 15 resolutions when always sent)
      party: r.party.map(p => ({ id: p.id, name: p.name, tags: renderTags(p.tags), dossier: (d => d.includes('\n') ? d : undefined)(this.dossier(p.id, { habits: this.rng.chance(0.25) })) })),
      // §2 engine seed: which facet the before-text opens on (terrain-tableau owned the slot)
      // 'a thing out of place' taught the exact "[odd object] where no X should be" frame the
      // whole overhaul existed to kill (7 of 19 resolutions in one campaign) — facet swapped
      sceneFacet: this.rng.pick(['the ground and what stands on it', 'the weather and the light',
        'what can be heard', 'the people in view', 'the enemy\'s posture or handiwork', 'what the party carries or readies']),
      deliveredSummary: this.describeDelivery(r),
      // what a one-off PARTIAL costs, rolled by the engine (🛠 a wound 1 time in 3): QUESTS §105 —
      // injury comes typically on failure, "occasionally a minor one on a costly partial"
      partialCost: r.outcome === 'partial'
        // ONE WORD, never a sentence: a dealt phrase is pasted whole ("…raise alarm. goodwill —
        // someone there now holds it against the company.") — L19
        ? (this.rng.chance(0.33) ? 'wound' : this.rng.pick(['gear', 'time', 'goodwill', 'finish']))
        : undefined,
      // glosses mix verb and noun phrases, so the frame is a colon, never "wants hands to …"; the
      // contract gloss is writer-facing ("the work IS the premise") and is said plainly instead
      earnedLead: (ls => ls?.length ? ls.map(l => LEAD_WORD[l.archetype] ?? 'paid work').join('; ') : undefined)(preLeads.get(r.quest.id)),
      // beat variant (engine-dealt, no RNG): how this job turns — physical / wits / social
      sceneMode: this.sceneModeFor(r.quest),
      deliveredCharacters: r.delivery.cards.filter(c => c.character).map(c => ({ id: c.id, name: c.name, tags: renderTags(c.tags) })),
    }));
    // 3) apply engine effects + AI outputs; lore write-backs AFTER all (collected first)
    const pendingEdges: { from: string; to: string; type: string; blurb: string; importance: number; sourceQuestId?: string }[] = [];
    const byQuest = new Map(resolutions.map(r => [r.quest.id, r]));
    const applied = new Set<string>();
    // a throw inside applyResolution used to escape doEndCycle and surface as `engine error:` —
    // the providers now swallow callback throws so one bad quest cannot kill the batch, so the
    // error is CARRIED and re-thrown after the await. Silently losing a quest (and stranding its
    // party in a deleted quest's slot) is the one outcome this must never have.
    let arriveError: unknown;
    /** one quest's report lands: a one-off's resolver output, or a saga's report */
    const land = (questId: string, out?: ResolveQuestOut, rep?: SagaReport) => {
      const r = byQuest.get(questId), block = questBlocks.get(questId);
      if (!r || !block || applied.has(questId)) return;
      applied.add(questId);   // set BEFORE, so a half-applied quest is never applied twice
      block.length = 0;   // applyResolution re-pushes the title line itself
      try {
        this.applyResolution(r, out, block, pendingEdges, rep);
        this.reckoning?.landed.add(questId);
      } catch (e) {
        arriveError ??= e;
        block.push(`— ${r.quest.title} (${r.quest.id})`, '⚠ this report could not be applied.');
      }
    };
    const arrive = (out: ResolveQuestOut) => land(out.questId, out);
    // engine effects therefore land in ARRIVAL order, not id order (TEMPO I1: replay
    // determinism explicitly not required); the TELLING order stays id order — that is the blocks.
    // The one-offs' batch and every saga report run together and settle into the same reckoning
    const oneOffs = aiInputs.length ? this.ai.resolve(aiInputs, arrive) : Promise.resolve([] as ResolveQuestOut[]);
    const sagas = Promise.all(resolutions.filter(r => r.saga).map(async r => land(r.quest.id, undefined, await flow.writeSagaReport(sagaHost, r.saga!.inn.call))));
    const [o1, o2] = await Promise.allSettled([oneOffs, sagas]);
    const aiOuts = o1.status === 'fulfilled' ? o1.value : [];
    // defensive: a quest the callback never reached still resolves (undefined out = engine truth; a saga's the floor)
    for (const r of resolutions) {
      if (applied.has(r.quest.id)) continue;
      if (o1.status === 'rejected' && !r.saga) continue;   // the batch threw: re-thrown below, as before
      applied.add(r.quest.id);
      const block = questBlocks.get(r.quest.id)!;
      block.length = 0;
      this.applyResolution(r, aiOuts.find(o => o.questId === r.quest.id), block, pendingEdges,
        r.saga ? mockReport(r.saga.inn.call.payload, r.saga.inn.call.flags) : undefined);
      this.reckoning?.landed.add(r.quest.id);
    }
    if (o1.status === 'rejected') throw o1.reason;
    if (o2.status === 'rejected') throw o2.reason;
    if (arriveError) throw arriveError;   // loud, as it was before the callback existed
    // COLD-READER GATE on saga reports REMOVED (reviewlab 84001 + blind judge, 2026-07-17):
    // the redo made reports WORSE in 6/7 fired cases (pre-redo mean 7.29 vs shipped 6.14) at
    // ~5.5s review + ~15s redo on 58-67% of saga resolutions — the strongest nag-degradation
    // measurement of the three gates. Report-defect classes (ledger breaks, ambiguous
    // antecedents) get fixed at the resolve prompt instead.

    blocks.push(report);   // the tail: fort news, after every story
    guardEdges(st.lore, pendingEdges, st.cycle, () => freshId('e'));

    // 4) housekeeping: healing, decay, staging timers, breaking
    this.personalChainDrip();
    this.starterDripPass();
    this.healingPass();
    decayPass(st.lore, st.cycle);
    this.breakingPass(report);
    // staged people who time out LEAVE — to the lore graph, never orphaned in 'staged'.
    // A PREPAID guest (a won finale prize waiting on roster room) never walks: the mark was
    // paid — they wait ("Brugrim drank up and left" turned a won saga into a debt and nothing)
    for (const s of st.tavern.filter(s => s.expiresAtCycle <= st.cycle && !s.prepaid)) {
      const c = this.card(s.cardId);
      if (c) { this.ensureLoreNode(c); c.location = HELD('lore'); report.push(`${c.name} drank up and left the tavern.`) }
    }
    st.tavern = st.tavern.filter(s => s.expiresAtCycle > st.cycle || s.prepaid);
    // 🛠 2026-07-10: a timed-out captive is never a pure loss — the company hands them off at
    // the slaver's quick price (an ACTIVE ransom before the clock still pays better; a Dungeon
    // keeps them). Zero-payoff evaporation made won finales feel hollow.
    for (const s of st.holding.filter(s => s.expiresAtCycle <= st.cycle)) {
      const c = this.card(s.cardId);
      if (c) {
        const pay = this.lapseQuote(c.id) ?? Math.round(cashValue(c.value) * SELL_RATE);
        this.ensureLoreNode(c); c.location = HELD('lore');
        this.addGold(pay);
        guardEdges(st.lore, [{ from: c.id, to: c.id, type: 'party-to', blurb: 'handed off by the company when their holding lapsed — no longer at the fort', importance: 0.7 }], st.cycle, () => freshId('e'));
        this.log('sell', `${c.name} handed off at the quick price (holding lapsed).`);
        report.push(`⛓ Time ran out on ${c.name} — handed off at the quick price. 💰 +${pay}g (a ransom before the clock pays better).`);
        this.cycleAcc?.handedOff.push({ id: c.id, name: c.name, gold: pay });
      }
    }
    st.holding = st.holding.filter(s => s.expiresAtCycle > st.cycle);

    // 4b) STAND-DOWN (built 2026-07-10): a quest that cannot POSSIBLY march — its empty slots
    // outnumber every free fit soldier — releases its parked party. Three soldiers split 1+2
    // across a 2-slot and a 3-slot quest once froze the fort for six straight cycles.
    for (const q of st.quests.filter(q => q.state === 'open')) {
      const active = q.slots.filter(s => !q.approaches || s.groupId === q.chosenApproach);
      const empty = active.filter(s => !s.filledBy).length;
      const parked = active.filter(s => s.filledBy).length;
      if (!parked || !empty) continue;
      const freeFit = this.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4).length;
      if (freeFit < empty) {
        for (const s of active) {
          if (!s.filledBy) continue;
          const m = this.card(s.filledBy);
          if (m) m.location = HELD('roster');
          s.filledBy = null;
        }
        report.push(`⏸ ${q.title}: the plan needs more hands than the company can field — the party stands down.`);
      }
    }

    // 5) pursued-quest expiry (impl ruling on QUESTS §10 🟡: TTL 10; a lapsed chain
    // beat respawns its continuation lead — the story waits, the quest doesn't)
    for (const q of st.quests.filter(q => q.state === 'open' && st.cycle - q.createdCycle >= this.questTtl(q))) {
      this.abandonQuest(q, report);
    }
    st.quests = st.quests.filter(q => q.state === 'open');

    // 5b) peril echoes come due: the person left behind resurfaces as a rescue lead
    for (const echo of [...st.pendingEchoes]) {
      if (st.cycle < echo.atCycle) continue;
      st.pendingEchoes = st.pendingEchoes.filter(e => e !== echo);
      const person = this.card(echo.focalId);
      if (!person?.character) continue;
      // "left behind out there" must still BE out there. The company can have acquired them since
      // — taken them captive, hired them, even slotted them in a room — and a rescue lead for
      // someone standing in your own fort then drags them back out of it (audit, 2026-08-27:
      // "card c460 slotted at room-289#0 but location says limbo").
      if (person.location.kind === 'room'
        || (person.location.kind === 'held' && person.location.state !== 'lore')) continue;
      const lead = this.freshLead('reward');
      lead.archetype = 'rescue';
      lead.chainInfo = { kind: 'none' };
      lead.focalId = person.id;
      lead.title = `Word of ${person.name} reaches the gate`;
      lead.echoNote = echo.lastSeen;
      st.leads.push(lead);
      report.push(`🕮 Word of ${person.name} — left behind, still out there. A rescue is possible.`);
    }

    // 6) lead expiry + liability triggers; standing hunts track the roster on the BOARD
    // too (a stale "L1" display misleads every consumer, human or bot)
    for (const l of st.leads) {
      if (l.expiresAtCycle === null && (l.archetype === 'lead-hunt' || l.source === 'recruiting')) {
        const band = REGION[l.region]!.levelBand;
        const levels = this.roster().map(m => m.character!.level);
        const median = levels.length ? [...levels].sort((a, b) => a - b)[Math.floor(levels.length / 2)]! : band[0];
        l.level = Math.max(band[0], Math.min(band[1], median));
      }
    }
    // a LAPSED continuation lead ends its story cleanly (built 2026-07-10 — chains used to zombify
    // 'active' forever with the focal stranded invisibly in limbo): the player let it lapse
    // (STORY_ENGINE §8), so the focal slips to the lore graph and a road back exists (§21-4a)
    for (const l of st.leads.filter(l => l.expiresAtCycle !== null && l.expiresAtCycle <= st.cycle && l.chainInfo.kind === 'continues'
      && !this.reserved.has(l.id))) {   // a lead a job holds cannot lapse under the work (I6)
      const chain = st.chains.find(c => c.id === (l.chainInfo as { chainId: string }).chainId);
      if (!chain || (chain.state !== 'active' && chain.state !== 'finale-pending')) continue;
      chain.state = 'slipped'; chain.bank = 0;
      this.persistMetCast(chain);
      const focal = this.card(chain.focalId);
      if (focal && !chain.isPersonal && focal.location.kind === 'held' && focal.location.state === 'limbo') {
        focal.location = HELD('lore');
        this.ensureLoreNode(focal);
        st.leads.push(this.sequelLead(chain, focal));
      }
      report.push(`🕮 The company let "${this.sagaTitle(chain)}" lapse — ${focal?.name ?? 'its center'} passes out of reach, for now.`);
    }
    // a RESERVED lead survives its own expiry: the quest it is being turned into must have a lead
    // to consume when it lands (I6). endCycle drains first, so this only fires on a path that
    // reaches doEndCycle with work still out.
    // ECONOMY §7.3: a banded lead going cold is a real loss — name it, so the sting is legible
    // rather than silent. An unbanded lead lapses quietly, as it always has.
    for (const l of st.leads.filter(l => l.expiresAtCycle !== null && l.expiresAtCycle <= st.cycle && !this.reserved.has(l.id))) {
      if (before.leads.has(l.id)) this.cycleAcc?.leadsCold.push(l.title ?? `${l.archetype} in ${REGION[l.region]!.name}`);
      const b = leadBand(l);
      if (b.band >= 2) report.push(`🧭 A lead worth ${b.label} went cold — ${l.title ?? `${l.archetype} in ${REGION[l.region]!.name}`}.`);
    }
    st.leads = st.leads.filter(l => l.expiresAtCycle === null || l.expiresAtCycle > st.cycle || this.reserved.has(l.id));
    for (const c of st.cards.filter(isLiability)) {
      const age = st.cycle - (st.liabilityBirth[c.id] ?? st.cycle);
      // one live collector per liability at a time
      if (st.leads.some(l => l.liabilityId === c.id) ||
        st.quests.some(q => q.state === 'open' && q.liabilityId === c.id)) continue;
      if (liabilityTriggers(this.rng, age)) {
        const lead = this.freshLead('collector');
        lead.chainInfo = { kind: 'none' };   // a collection job is a one-off — it must be able to SETTLE
        lead.title = `The ${c.name} surfaces — deal with it`;
        lead.liabilityId = c.id;
        st.leads.push(lead);
        st.liabilityBirth[c.id] = st.cycle; // reset the fuse
        report.push(`⚠ Your unresolved ${c.name} draws attention — a hostile lead appears (beat it to bury the matter).`);
      }
    }

    // archive the reckoning — its lines, verdicts and TALLY — the moment every line is in, BEFORE
    // the flesh tail: the player is released from the page right here, and PROCEED must find the
    // spoils already totalled (flesh writes who/backstory only; nothing in the summary moves)
    const lines = blocks.flat();
    const meta = Game.placeMeta(this.reckoning?.meta ?? [], blocks);
    const acc = this.cycleAcc!;
    const summary: CycleSummary = {
      cycle: st.cycle,
      goldBefore: before.gold, goldAfter: this.gold(),
      prestigeBefore: before.prestige, prestigeAfter: this.prestige(),
      outcomes: { success: meta.filter(m => m.outcome === 'success').length, partial: meta.filter(m => m.outcome === 'partial').length, failure: meta.filter(m => m.outcome === 'failure').length },
      levelUps: this.roster().filter(m => before.levels.has(m.id) && m.character!.level > before.levels.get(m.id)!)
        .map(m => ({ id: m.id, name: m.name, level: m.character!.level })),
      wounds: acc.wounds,
      newLeadIds: this.visibleLeads().filter(l => !before.leads.has(l.id)).map(l => l.id),
      newLeads: 0,
      captivesTaken: st.holding.filter(h => !before.holding.has(h.cardId)).map(h => ({ id: h.cardId, name: this.card(h.cardId)?.name ?? '?' })),
      recruits: st.tavern.filter(t => !before.tavern.has(t.cardId)).map(t => ({ id: t.cardId, name: this.card(t.cardId)?.name ?? '?' })),
      relicsGained: this.relics().filter(r => this.isOwned(r) && !before.relics.has(r.id)).map(r => ({ id: r.id, name: r.name })),
      tamed: acc.tamed, lapsed: acc.lapsed, stalled: acc.stalled, leadsCold: acc.leadsCold,
      handedOff: acc.handedOff, setbacks: acc.setbacks,
      debts: st.cards.filter(isLiability).map(c => ({ id: c.id, name: c.name, amount: Math.abs(c.value) * (c.qty ?? 1) - (before.debts.get(c.id) ?? 0) }))
        .filter(d => d.amount > 0).map(d => ({ ...d, text: Game.debtText(d) })),
    };
    summary.newLeads = summary.newLeadIds.length;
    if (lines.length) {
      (st.reckonings ??= []).push({ cycle: st.cycle, lines, meta, summary });
      while (st.reckonings.length > RECKONINGS_KEPT) st.reckonings.shift();
    }

    // 7) FLESH pass — every merc and staged person deserves a who/backstory/quirks
    // (attachment starts here; persisted per producer-2, so this runs at most once each).
    // Every report line is in by now, so the player is released BEFORE this 12-16s tail.
    if (this.reckoning) this.reckoning.writing = false;
    await this.fleshPass();

    // keep the save lean: the log is a UI convenience, not the archive (lore is)
    if (st.log.length > 600) st.log = st.log.slice(-400);

    this.state.rngState = this.rng.state();
    this.state.storyRngState = this.storyRng.state();
    this.state.idCounter = idCounter();
    this.lastBlocks = blocks.map(b => [...b]);
    return lines;
  }

  /** every kept reckoning, oldest first (an archive from before the tally reads meta [] / summary null) */
  reckonings(): ReckoningRecord[] {
    return (this.state.reckonings ?? []).map(r => ({ cycle: r.cycle, lines: r.lines, meta: r.meta ?? [], summary: r.summary ?? null }));
  }
  /** one reckoning by cycle number, or the most recent when no cycle is given */
  reckoningAt(cycle?: number): ReckoningRecord | undefined {
    const all = this.reckonings();
    return cycle === undefined ? all[all.length - 1] : all.find(r => r.cycle === cycle);
  }

  /** Is a re-roll available this cycle? (Abandoning always works; only PUTTING THE LEAD BACK is
   *  rationed, so a player is never stuck with a card they will not read.) */
  canReroll(): boolean { return this.state.lastRerollCycle !== this.state.cycle }

  /** How long a quest may sit unmarched. A quest written from a STANDING lead (the Scouting
   *  lodge's lead-hunt, the Recruiting post's hire) lasts ONE cycle, because its lead is never
   *  consumed: there is nothing to save by holding it and nothing lost by letting it go — pursue
   *  the post again and it writes you another. Ordinary quests keep the full TTL, where holding one
   *  while you build up to it is legitimate play and the lead is genuinely spent. */
  private questTtl(q: Quest): number {
    return q.fromLead?.expiresAtCycle === null ? 1 : QUEST_TTL;
  }

  /** the cycle this quest goes cold — ONE surface of truth, so a board cannot advertise a life the
   *  expiry pass will not honour (a faucet quest was showing c10 while lapsing after one cycle) */
  questLapsesAt(q: Quest): number {
    const ttl = q.createdCycle + this.questTtl(q);
    return this.questStallAt(q) ?? ttl;
  }
  /** the cycle a PART-FILLED quest is set aside at by the stall rule (STALL_LIMIT failed marches
   *  running, doEndCycle) when that comes before its TTL — null when it does not apply. Recomputed
   *  from the placement NOW: nobody placed resets the count at END. */
  questStallAt(q: Quest): number | null {
    if (q.isFinale || q.state !== 'open' || this.isCommitted(q)) return null;
    if (!this.activeSlots(q).some(s => s.filledBy)) return null;
    const at = this.state.cycle + Math.max(1, STALL_LIMIT - (q.stalls ?? 0));
    return at < q.createdCycle + this.questTtl(q) ? at : null;
  }
  /** its countdown is urgent (red on every surface): a real loss LAPSE_URGENT cycles or less away */
  questUrgent(q: Quest): boolean {
    return !this.questIsFaucet(q) && this.questLapsesAt(q) - this.state.cycle <= LAPSE_URGENT;
  }
  /** a faucet quest is not lost when it goes — the post that wrote it is still standing */
  questIsFaucet(q: Quest): boolean { return q.fromLead?.expiresAtCycle === null }

  abandon(questId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q) return { ok: false, msg: 'no such open quest' };
    // A card the player will not read is a dead slot on the board. Abandoning returns the LEAD so
    // it can be written again — the same job, a different card. Rationed to once a cycle so it is
    // a second look, not a slot machine: rerolling costs the cycle's one chance at any other card.
    const lead = q.fromLead;
    const reroll = !!lead && !q.chainId && this.canReroll()
      && !this.state.leads.some(l => l.id === lead.id);
    const chainOut = this.abandonChainOutcome(q);
    const said: string[] = [];
    this.abandonQuest(q, said);
    this.state.quests = this.state.quests.filter(x => x !== q);
    if (!reroll) {
      // the reply says what abandonQuest actually DID to the saga (a continuation lead, or a slip)
      const why = q.chainId ? (chainOut === 'continues' ? ' — the thread dangles: a continuation lead is back on the board'
          : chainOut === 'slips' ? ` — ${said.find(l => l.startsWith('🕮'))?.replace(/^🕮 /, '') ?? 'the saga slips out of reach'}`
          : ' — its story was already over')
        : !lead ? ''
        : !this.canReroll() ? ' — the lead is spent; a lead can only be taken up again once a cycle'
        : '';
      return { ok: true, msg: `${q.title} abandoned${why}` };
    }
    this.state.leads.push(lead!);
    this.state.lastRerollCycle = this.state.cycle;
    this.log('leads', `The company set aside "${q.title}" — the ${lead!.archetype} is back on the map table.`);
    return { ok: true, msg: `${q.title} set aside — the lead is back on the map table, to be taken up again` };
  }

  /** what setting a saga step aside does to its saga — the SAME branch abandonQuest takes, so the
   *  confirm can never promise what the engine will not give */
  private abandonChainOutcome(q: Quest): 'continues' | 'slips' | 'none' {
    const chain = q.chainId ? this.state.chains.find(c => c.id === q.chainId) : undefined;
    if (!chain || (chain.state !== 'active' && chain.state !== 'finale-pending')) return 'none';
    return (chain.reOffers ?? 0) + 1 >= 3 ? 'slips' : 'continues';
  }
  private abandonQuest(q: Quest, report: string[]) {
    for (const s of q.slots) this.doUnassign(q, s);
    // forfeit the pre-generated rewards: objects vanish, PEOPLE pass to the lore graph
    // (loss = TIME — a person is never deleted; §21)
    for (const c of q.rewardCards) {
      if (c.character) {
        this.ensureLoreNode(c);
        c.location = HELD('lore');
      }
    }
    const objectIds = new Set(q.rewardCards.filter(c => !c.character).map(c => c.id));
    this.state.cards = this.state.cards.filter(c => !objectIds.has(c.id));
    q.state = 'resolved';
    if (q.chainId) {
      const chain = this.state.chains.find(c => c.id === q.chainId);
      if (chain && (chain.state === 'active' || chain.state === 'finale-pending')) {
        // RE-OFFER CAP (2026-07-11): one beat card was re-offered 28 TIMES over 90 cycles.
        // Three lapses of the same beat = the company isn't taking this job — the story slips
        // gracefully (a road back exists) instead of nagging forever.
        chain.reOffers = (chain.reOffers ?? 0) + 1;
        if (chain.reOffers >= 3) {
          chain.state = 'slipped'; chain.bank = 0;
          this.persistMetCast(chain);
          const focal = this.card(chain.focalId);
          if (focal && !chain.isPersonal && focal.location.kind === 'held' && (focal.location as { state?: string }).state === 'limbo') {
            focal.location = HELD('lore');
            this.ensureLoreNode(focal);
            this.state.leads.push(this.sequelLead(chain, focal));
          }
          report.push(`🕮 "${this.sagaTitle(chain)}" was left untaken three times — the matter passes out of reach, for now.`);
        } else {
          // the card on offer comes back verbatim when its lead is pursued again (D15)
          this.state.leads.push({
            id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
            archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: chain.saga?.latest ?? '' },
            expiresAtCycle: this.state.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
            title: `${this.sagaTitle(chain)} — the thread dangles`,
          });
        }
      }
    }
    // a faucet quest lapsing is NOT a loss — the post that wrote it is still standing, and saying
    // so is the difference between "you missed it" and "ask again"
    // the tally counts a LOSS; a faucet's quest is not one (the post puts up another)
    if (q.fromLead?.expiresAtCycle !== null) this.cycleAcc?.lapsed.push(q.title);
    report.push(q.fromLead?.expiresAtCycle === null
      ? `⏳ ${q.title} went cold — the ${q.fromLead.source === 'recruiting' ? 'recruiting post' : 'map table'} will put up another.`
      : `⏳ ${q.title} lapsed — the moment passed.`);
    this.log('expire', `${q.title} lapsed unpursued`);
  }

  /** every active place filled — the party marches at END (the view's `ready`; a finale with no
   *  approach chosen has no active places, so it is never ready) */
  isReady(questId: string): boolean {
    const q = this.state.quests.find(x => x.id === questId);
    return !!q && q.state === 'open' && this.isCommitted(q);
  }
  private isCommitted(q: Quest): boolean {
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    return active.length > 0 && active.every(s => s.filledBy);   // ALL party slots filled (no partial sends)
  }

  /** a one-off's delivery, named for its narrator (a saga's report is dealt its own facts by the flow) */
  private describeDelivery(r: Resolution): string {
    if (r.outcome === 'failure') return 'they return with empty hands (say what was lost, in-fiction)';
    // the person's REAL fate is engine-decided — deal it, or prose promises "they may stay"
    // while the engine line says "moves on" (both shipped on one card)
    // Coin is never dealt to the narrator: the 💰 line already reports it, and a dealt '38 gold' is a
    // stamp the model pastes into the scene as a purse or a pouch (L19). MEASURED 2026-09-25, 14
    // routine reports x 2 blind judges: staged pay 6/14 -> 0/14, prose 3.89 -> 4.21. NOCOIN=0 restores.
    const noCoin = process.env.NOCOIN !== '0';
    // LAB (LIGHTNORELIC=1): a routine report is not dealt the relic either — the 🗝 line reports it,
    // and judges in two rounds named loot "welded in" (an iron vase in a raven's beak) as a top defect
    const noRelic = process.env.LIGHTNORELIC === '1' && !!r.quest.gravity?.startsWith('a small') && !r.quest.chainId;
    const bits = r.delivery.cards.filter(c => !(noCoin && !c.character && c.qty) && !(noRelic && !c.character && !c.qty)).map(c => {
      if (!c.character) return c.qty ? `${c.qty} gold` : `the ${c.name}`;
      if (c.character.role === 'captive') return `${c.name} taken captive`;
      return !this.hasRoom('tavern')
        ? `${c.name} rescued — they will thank the company and MOVE ON (the fort has no place to keep them); never show them staying`
        : this.roster().length >= this.rosterCapacity()
          ? `${c.name} rescued — they will wait at the fort's tavern, though the roster is FULL: no joining unless room opens; never promise them a place`
          : `${c.name} rescued — they will wait at the fort's tavern, open to joining if hired`;
    });
    if (r.delivery.liability) bits.push(`a ${r.delivery.liability.name} left behind`);
    return bits.join(', ') || (noCoin ? 'nothing beyond the job itself' : 'a token result');
  }

  private applyResolution(
    r: Resolution,
    out: { before: string; turn?: string; turnActor?: string; speech?: { who: string; says: string }[]; after: string; injuries: { characterId: string; band: InjuryBand; cause?: string | null }[]; fleshed: { characterId: string; who: string; backstory: string; quirks: string[] }[]; edges: { from: string; to: string; type: string; blurb: string; importance: number }[] } | undefined,
    report: string[],
    pendingEdges: { from: string; to: string; type: string; blurb: string; importance: number; sourceQuestId?: string }[],
    /** a saga quest's report (the v4 storyteller): its prose; the hurt was decided in the roll loop (r.saga) */
    sagaRep?: SagaReport,
  ) {
    const st = this.state;
    const q = r.quest;
    // the WHY under the dice must be the soldiers AS THEY ROLLED. It was computed at render time,
    // after this job's own wounds and level-ups had landed: a soldier who rolled 5 coins showed
    // "CHA 4.9 injury -4.4 = 0", blaming the failure on a wound the failure itself caused.
    const coinTerms = r.rolled.totalCoins > 0
      ? (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).filter(s => s.filledBy).map(s => {
          const u = this.card(s.filledBy!);
          return u ? `${u.name} — ${explainCoins(u, s.test)}` : '';
        }).filter(Boolean)
      : [];
    q.state = 'resolved';
    // the reveal reads: title → before → after → consequences (injuries/staging/etc.)
    const after: string[] = [];
    const say = (line: string) => after.push(line);
    // free the party + XP
    for (const p of r.party) {
      p.location = HELD('roster');
      const xp = questXp(p.character!.level, q.level, r.outcome);
      if (grantXp(p.character!, xp, this.capOf(p.id)) > 0)
        say(`⭐ ${p.name} reaches level ${p.character!.level}.`);
    }
    // §14 engine-cheap edges: co-deployed pairs are linked served-with at ZERO tokens —
    // an existing link refreshes instead (the graph must not depend on the AI remembering)
    for (let i = 0; i < r.party.length; i++) for (let j = i + 1; j < r.party.length; j++) {
      const [a, b] = [r.party[i]!, r.party[j]!];
      this.ensureLoreNode(a); this.ensureLoreNode(b);
      const existing = this.state.lore.edges.find(e => e.active && e.type === 'served-with'
        && ((e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id)));
      if (existing) touchEdge(existing, this.state.cycle);
      else addEdge(this.state.lore, {
        id: freshId('e'), from: a.id, to: b.id, type: 'served-with',
        salience: 0.3, core: false, active: true, lastCycle: this.state.cycle,
        blurb: `marched together — ${q.title}`,
      });
    }
    // a saga's injuries were rolled by the engine before the report was written (D3: rollHurt under today's guard — a
    // success never wounds, a partial at most lightly), and the report was dealt them: band → tiers on the main rng
    if (r.saga) for (const h of r.saga.inn.hurt) {
      const merc = r.party.find(p => p.name === h.name);
      if (!merc?.character) continue;
      const band = HURT_BAND[h.how];
      const tiers = rollInjuryTiers(this.rng, band);
      merc.character.injuryTiers += tiers;
      this.cycleAcc?.wounds.push({ id: merc.id, name: merc.name, tiers });
      say(`🩸 ${merc.name} is wounded (${band}, ${tiers} tier${tiers === 1 ? '' : 's'}).`);
    }
    // injuries: AI-judged band → engine tiers (decoupled channel). ENGINE GUARD (§11/F5):
    // success → none; partial → at most a minor one; failure → any band.
    // A wound must CITE the moment in the model's own after-text that shows it — an uncited
    // wound is invented (a med-4 "hedge wound" once came from fleeing a closed door)
    for (const inj of out?.injuries ?? []) {
      let band = inj.band;
      if (r.outcome === 'success') band = 'none';
      else if (r.outcome === 'partial' && (band === 'med' || band === 'high')) band = 'low';
      if (band === 'none') continue;
      const merc0 = this.card(inj.characterId);
      // the cause must appear in the after-text AND (in a multi-member party) name the harmed
      // person — "the shaft caved" once passed the substring check while narrating no wound.
      // SOLO parties skip the name check: the harmed one is unambiguous, and requiring the name
      // was silently dropping real 🩸 while the prose kept the wound (5×/run mismatch)
      // A wound listed WITHOUT a cause still counts when the report plainly shows it on that
      // soldier: "Ervalir's upper arm bled from the wire" came with {band: med} and no cause, and
      // was dropped (playtest 2026-09-25).
      // …and when a cause IS given but paraphrased past recognition ("struck by a riverman's oar"
      // vs "caught him across the face with an oar… blood on his cheek"), the same test decides
      const cited = !!merc0 && ((!!inj.cause
          && causeShown(inj.cause, out?.after ?? '')
          && (r.party.length === 1 || inj.cause.toLowerCase().includes(merc0.name.split(' ')[0]!.toLowerCase())))
        || woundShownOn(merc0.name, out?.after ?? '', r.party.length === 1));
      if (!cited) continue;
      const merc = this.card(inj.characterId);
      if (!merc?.character || !r.party.includes(merc)) continue;
      const tiers = rollInjuryTiers(this.rng, band);
      merc.character.injuryTiers += tiers;
      this.cycleAcc?.wounds.push({ id: merc.id, name: merc.name, tiers });
      say(`🩸 ${merc.name} is wounded (${band}, ${tiers} tier${tiers === 1 ? '' : 's'}).`);
    }
    // delivery
    for (const c of r.delivery.cards) {
      if (c.character) {
        // remember the job that handed them over. The resolver writes their story right here and
        // normally that is the end of it — but when it doesn't (a fallback resolution, a model
        // that skipped the field), the flesh pass is the only thing left and it knows nothing.
        c.character.origin = { title: r.quest.title, situation: r.quest.situation ?? '', job: r.quest.job ?? '' };
        const fleshed = out?.fleshed.find(f => f.characterId === c.id);
        if (fleshed) { c.character.who = fleshed.who; c.character.backstory = fleshed.backstory; c.character.quirks = normQuirks(fleshed.quirks) }
        this.ensureLoreNode(c);
        if (c.character.role === 'captive') {
          st.holding.push({ cardId: c.id, expiresAtCycle: st.cycle + STAGE_TTL_HOLDING });
          c.location = HELD('staged');
          say(`⛓ ${c.name} is in holding (accept within ${STAGE_TTL_HOLDING} cycles).`);
          if (!st.cards.includes(c)) st.cards.push(c);
        } else if (this.hasRoom('tavern')) {
          st.tavern.push({ cardId: c.id, expiresAtCycle: st.cycle + STAGE_TTL_TAVERN });
          c.location = HELD('staged');
          say(`🍺 ${c.name} waits at the tavern (hire within ${STAGE_TTL_TAVERN} cycles).`);
          if (!st.cards.includes(c)) st.cards.push(c);
        } else {
          // no Tavern yet — the grateful rescued pay what they can and move on (🛠 salvage)
          const pay = Math.round(cashValue(c.value) * 0.4);
          this.addGold(pay);
          this.ensureLoreNode(c);
          c.location = HELD('lore');
          if (!st.cards.includes(c)) st.cards.push(c);
          say(`🙏 ${c.name} thanks you and moves on: +${pay}g (build a Tavern to keep such people).`);
        }
      } else if (stackKind(c) === 'gold') {
        this.addGold(c.qty ?? 0);
        say(`💰 ${q.title}: +${c.qty ?? 0}g.`);
      } else {
        c.location = HELD('inventory');
        if (!st.cards.includes(c)) st.cards.push(c);
        say(`🗝 ${c.name} joins the company's holdings.`);
      }
    }
    if (r.delivery.liability) this.addCard(r.delivery.liability);
    // forfeited people are not deleted and not forgotten: they pass to the lore graph,
    // and a named one left in peril RESURFACES within a few cycles (failure bends the story)
    for (const lost of r.delivery.forfeited) {
      if (lost.character) {
        this.ensureLoreNode(lost);
        lost.location = HELD('lore');
        if (!st.cards.includes(lost)) st.cards.push(lost);
        st.pendingEchoes.push({
          focalId: lost.id, atCycle: st.cycle + this.rng.range(4, 8),
          // capture the PERIL as the story left it — a returning Sylvlion once swapped
          // "hobbled at the mill wheel" for a fresh forest chase
          lastSeen: `${q.title}: ${q.situation.slice(0, 220)}`,
        });
        say(`🕮 ${lost.name} is left behind out there — word of them will come again.`);
      } else {
        st.cards = st.cards.filter(c => c.id !== lost.id);   // lost objects just vanish
      }
    }
    const minted = this.preMintedLeads.get(q.id);
    for (const [k, bonus] of r.delivery.leadGrants.entries()) {
      // the value the split reserved rides ON the lead now, instead of being discarded (§7.1);
      // minted before narration so the report and the board agree on what the work is
      const nl = minted?.[k] ?? this.freshLead('reward', bonus);
      st.leads.push(nl);
      const b = leadBand(nl);
      say(nl.title
        ? `🧭 A lead earned — ${nl.title}${b.band ? `, and ${b.label} in it` : ''}. See the Leads tab.`
        : `🧭 A lead earned${b.band ? `, with ${b.label} in it` : ''} — see the Leads tab.`);
    }
    // collector quest won → the liability is buried
    if (q.liabilityId && r.outcome !== 'failure') {
      const li = this.card(q.liabilityId);
      if (li) {
        st.cards = st.cards.filter(c => c.id !== q.liabilityId);
        delete st.liabilityBirth[q.liabilityId];
        say(`🕯 The matter of the ${li.name} is buried for good.`);
      }
    }
    if (q.archetype === 'lead-hunt' && r.outcome !== 'failure') {
      const extra = r.outcome === 'success' ? 2 : 1;
      for (let i = 0; i < extra; i++) st.leads.push(this.freshLead('hunt'));
      say(this.hasRoom('lead-room')
        ? `🧭 The sweep pays: ${extra} new lead(s).`
        : `🧭 The sweep turns up ${extra} more lead(s) — they wait on a Lead room to be read.`);
    }
    // lore edges from the AI (validated later in one pass)
    pendingEdges.push(...modelEdges(out?.edges).map(e => ({ ...e, sourceQuestId: q.id })));
    // narrate in the fiction's own order — setup, THEN the dice, THEN the outcome
    // (QUESTS §7: before-roll blind → after-roll sighted; the DICE are always shown, DESIGN §5).
    // A saga card echoes its prose only — never its quest log (D17: the placeholder and this block start alike)
    report.push(`— ${q.title} (${q.id})`);
    if (q.situation) report.push(`「${q.situation}」`);
    const bubbles = process.env.SPEECH_ANCHORS === '1' && out?.speech?.length ? out.speech : null;
    if (sagaRep) report.push(sagaRep.before);
    else if (out) report.push(...(bubbles ? this.renderWithBubbles(out.before, bubbles) : [out.before]));
    report.push(r.rolled.totalCoins === 0
      ? `⚄ [${r.outcome.toUpperCase()}] · the party had no usable dice for this work (needed ${r.rolled.totalBar.toFixed(1)})`
      // the partial mark on the line itself — "11 heads vs bar 17.3" read as a miss, yet it was a
      // partial (≥60% of the bar), and nothing on screen said where that line sits
      : `⚄ [${r.outcome.toUpperCase()}] · rolled ${r.rolled.heads} heads of ${r.rolled.totalCoins} coins vs bar ${r.rolled.totalBar.toFixed(1)} (partial from ${(PARTIAL_FRAC * r.rolled.totalBar).toFixed(1)})`);
    // the WHY under the dice (designer 2026-07-24): each sent merc's coins traced to the card's
    // ask — attribute value, favored/clash, injury — via the engine's own explainCoins
    if (coinTerms.length) report.push(`   ${coinTerms.join('  ·  ')}`);
    // beat variant: the engine assembles the strip's turn caption + speech around its dice line
    if (sagaRep) report.push(sagaRep.after);
    else {
      if (out?.turn) report.push(`▸ ${out.turnActor ?? '—'} — ${out.turn}`);
      if (!bubbles) for (const s of out?.speech ?? []) report.push(`  ${s.who}: "${s.says}"`);
      if (out) report.push(...(bubbles ? this.renderWithBubbles(out.after, bubbles) : [out.after]));
    }
    report.push(...after);
    this.log('resolve', `${q.title}: ${r.outcome}`, q.id);
    // the saga moves on (its 📖 line, then the next lead or the finale's settlement)
    if (q.chainId && r.saga && sagaRep) this.advanceChain(q, r, sagaRep, report);
    st.quests = st.quests.filter(x => x.state !== 'resolved');
  }

  /** NPC names the writers were recently dealt — card NPCs never become cards, so without this
   *  window the generator dealt Betda/Betra/Beteth within a few cycles */
  private recentNpcNames: string[] = [];
  /** recent card titles — one-offs need an avoid list too (two 'Lantern in the Old Growth'
   *  stake-rescues shipped in one campaign) */
  private recentCardTitles: string[] = [];

  /** a fresh character name must not equal, share a 4-letter given-name stem OR TAIL with, or sit
   *  within edit-distance 2 of a living one (Ulfka/Ulfnak, Harmuzzle/Magmuzzle — and Pellmund/
   *  Nedmund read as kin by their shared tail) */
  private nameTooSimilar(name: string): boolean {
    const given = (n: string) => n.split(' ')[0]!.toLowerCase();
    const g = given(name);
    const close = (a: string, b: string): boolean => {
      if (Math.abs(a.length - b.length) > 2) return false;
      // tiny bounded edit-distance (≤2) — names are short
      const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      return dp[a.length]![b.length]! <= 2;
    };
    const epithet = (n: string) => n.split(' ').slice(1).join(' ').toLowerCase();
    const e = epithet(name);
    const hit = (other: string) => {
      const xg = given(other);
      // same given stem OR tail, near-identical given, or a REUSED distinctive epithet
      return other === name || xg.slice(0, 4) === g.slice(0, 4) || close(xg, g)
        || (g.length >= 6 && xg.length >= 6 && xg.slice(-4) === g.slice(-4))
        || (!!e && epithet(other) === e);
    };
    // 3-char-prefix CROWDING: Naemar/Naeryn/Naeiel/Naeeth all active at once read as one blurred
    // family — a third name on an already-doubled prefix is rejected
    const pre3 = g.slice(0, 3);
    const crowd = this.state.cards.filter(x => x.character && given(x.name).slice(0, 3) === pre3).length;
    if (crowd >= 2) return true;
    // lore-only people count too — a coined saga warlord "Grakjaw" was re-rolled as a
    // one-off rescue victim, one name wearing two opposite characters
    return this.state.cards.some(x => x.character && hit(x.name))
      || this.recentNpcNames.some(hit)
      || Object.values(this.state.lore.nodes).some(nd => nd.active && nd.kind === 'character' && hit(nd.name));
  }


  /** NEAR-VERBATIM job-echo strip (§0 lever 1, no extra AI call): drop a situation sentence that essentially IS the
   *  job line. Bidirectional ≥0.85 only; never touches a card with fewer than 2 sentences. */
  private stripJobEcho<T extends { situation: string; job: string }>(out: T): T {
    const words = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
      .filter(w => w.length > 3).map(w => w.replace(/s$/, ''));
    const jw = new Set(words(out.job));
    if (jw.size < 4) return out;
    const sents = out.situation.split(/(?<=[.!?])\s+/);
    if (sents.length < 2) return out;
    const kept = sents.filter(sent => {
      const sw = words(sent);
      if (sw.length < 4) return true;
      const hit = new Set(sw.filter(w => jw.has(w))).size;
      return !(hit >= jw.size * 0.85 && hit >= new Set(sw).size * 0.85);
    });
    if (kept.length === sents.length || kept.length === 0) return out;
    this.log('dev', 'card body echoed the job line near-verbatim — sentence dropped');
    return { ...out, situation: kept.join(' ') };
  }

  /** the edges a soldier's own saga could start from, strongest first — never one to a fellow soldier: a seed may only
   *  name people the saga can cast, and you cannot ride out to find someone standing in your own yard (2026-08-31). Never
   *  a memory the company's play made (`madeInPlay`): the saga is told as their past, and a company saga's deed seeded
   *  as one was retold as an old wrong, against that saga's own answer — its person seated as "knows the past" */
  private personalEdges(merc: Card): RelEdge[] {
    const inTheCompany = (id: string) => this.card(id)?.character?.role === 'merc';
    return this.state.lore.edges
      .filter(e => e.active && !!e.blurb && (e.from === merc.id || e.to === merc.id) && !madeInPlay(e))
      .filter(e => !inTheCompany(e.from === merc.id ? e.to : e.from))
      .sort((a, b) => (Number(b.core) - Number(a.core)) || (b.salience - a.salience));
  }
  /** the spark for a soldier's OWN saga (D12): the strongest thing the world remembers of them from before the company
   *  (`personalEdges`), else the past they were fleshed with. Never a generic theme — that is what turned a personal saga
   *  into somebody else's ransom job */
  private personalSeed(merc: Card): string {
    const top = this.personalEdges(merc)[0];
    if (top?.blurb) return top.blurb;
    // A soldier the company WON (rescued, hired, turned) has a backstory written at the moment it
    // found them — "they found Tun-Zeeus pressed to the mill shutter…" — which is the company's own
    // history, not their past. Seeded from it, a personal saga set out to learn "who led him away"
    // (the company did) (playtest 2026-09-25). Their past is who they were: use that.
    const who = merc.character?.who;
    if (merc.character?.origin && who) return `${merc.name}'s life before the company — ${who}`;
    const back = merc.character?.backstory;
    if (back) {
      const first = back.split(/(?<=[.!?])\s+/)[0] ?? back;
      return first.length > 20 ? first : back.slice(0, 160);
    }
    return `something ${merc.name} left unfinished before the company`;
  }

  /** sentence-safe clamp for lore blurbs — a blurb cut mid-phrase ("speaks with a charter's")
   *  reaches later prompts as a dangling fragment the writer must stay consistent with */
  private clampBlurb(t: string, max = 120): string {
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const d = cut.lastIndexOf('. ');
    return d > max / 2 ? cut.slice(0, d + 1) : cut.replace(/\s+\S*$/, '');
  }

  /** landmark rest window per region (🛠 2026-07-10) */
  private lastLandmarkDeal: Record<string, number> = {};
  /** recently dealt opening-spark cores (recency reroll) */
  private recentSparks: string[] = [];

  /** the location line a one-off's writer sees — the landmark gate works by OMISSION (a shown token gets used) */
  private locationLine(region: string, landmarkAllowed: boolean, anchorOk = true): string {
    const r = REGION[region]!;
    // a rotating named anchor gives the region proper nouns besides its one landmark
    const anchor = anchorOk && r.anchors && this.rng.chance(0.5) ? ` Known ground: ${this.rng.pick(r.anchors)}.` : '';
    return `${r.name} — ${landmarkAllowed ? r.seed : (r.seedPlain ?? r.seed)}${anchor}`;
  }

  /** recent toponym stems — the combinatorial pool dealt Hawbrook/Hawhollow/Hawgate and three
   *  Mill- villages in one run; same-stem places blur into one another for the reader. One window for
   *  the one-offs' suggestions and the sagas' dealt places (D11) */
  private recentPlaceStems: string[] = [];
  /** a place name still resting: its stem not dealt lately, and its LAST word not twice — prefix stems alone let
   *  "Mossway Hollow / Coalward Hollow / Linden Hollow / Marepen Hollow" template a whole campaign (45025) */
  private placeRested(p: string): boolean {
    const tail = p.split(/\s+/).pop()!.toLowerCase();
    return !this.recentPlaceStems.includes(p.slice(0, 4).toLowerCase()) && this.recentPlaceStems.filter(t => t === `tail:${tail}`).length < 2;
  }
  private notePlace(p: string): void {
    this.recentPlaceStems.push(p.slice(0, 4).toLowerCase(), `tail:${p.split(/\s+/).pop()!.toLowerCase()}`);
    while (this.recentPlaceStems.length > 48) this.recentPlaceStems.shift();
  }
  /** a "fresh place" suggestion must never re-deal the region's own landmark (seed/ban-collision class) */
  private freshPlaceName(region: string): string {
    const banned = REGION[region]?.landmark;
    let p = rollPlaceName(this.rng);
    for (let i = 0; i < 12 && (p === banned || !this.placeRested(p)); i++) p = rollPlaceName(this.rng);
    this.notePlace(p);
    return p;
  }

  /** a saga quest's report landed. The bank moves as it always has (bankBeat — a failed job is re-posed, the setbacks
   *  and the stall guard bring the last chance); then the flow takes the report (Knowing, what is banked, the SagaLine,
   *  the next card's opening) and the 📖 line says where the saga stands. A finale goes to settleFinale unchanged */
  private advanceChain(q: Quest, r: Resolution, rep: SagaReport, report: string[]) {
    const st = this.state;
    const chain = st.chains.find(c => c.id === q.chainId);
    if (!chain?.saga?.plan || !r.saga) return;
    const host = this.sagaHost();
    const a = { outcome: r.outcome, party: r.party, hurt: r.saga.inn.hurt, fate: r.saga.inn.fate };
    // whose deed decided it rides on the chronicle line (the memory edge at the saga's close reads it, §2.6)
    const decided = () => { const l = chain.saga!.lines[chain.saga!.lines.length - 1]; if (l && r.outcome !== 'failure') l.decides = r.saga!.inn.decides };
    if (q.isFinale) {
      const after = flow.afterReport(host, chain, r.saga.pos, a, rep);
      decided();
      report.push(after.book);
      return this.settleFinale(q, chain, r, report, r.fate);
    }
    // side-loot deducts what was actually DELIVERED — a partial pays out half the loot,
    // so the bank is docked half (it was docked the full budget for half the goods)
    bankBeat(chain, r.party.length, r.outcome, (q.sideLootV ?? 0) * (r.outcome === 'partial' ? 0.5 : 1));
    const after = flow.afterReport(host, chain, r.saga.pos, a, rep);
    decided();
    const rec = chain.saga, plan = rec.plan!;
    const next = flow.posOf(rec);
    // continuation lead (the next card's title, zero AI); its hook is what the next card opens on
    st.leads.push({
      id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
      archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: rec.latest },
      expiresAtCycle: st.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
      title: `${plan.title} — ${next.finale ? plan.showdown.title : plan.episodes[next.job - 1]!.title}`,
    });
    // a failed job spends one of the saga's setbacks — the tally says so at the moment it happens
    if (r.outcome === 'failure') this.cycleAcc?.setbacks.push({ chainId: chain.id, title: plan.title, failures: chain.failures, budget: chain.failureBudget });
    report.push(after.book);
  }

  /** SPEECH_ANCHORS display split: prose paragraph → alternating narration blocks and
   *  [Speaker] "line" bubbles, cut at the sentences carrying the model's own listed quotes.
   *  Deterministic; any quote that doesn't anchor verbatim leaves its sentence untouched. */
  private renderWithBubbles(text: string, speech: { who: string; says: string }[]): string[] {
    if (!speech.length) return [text];
    const sentences = text.split(/(?<=[.!?]["”]?)\s+(?=["“A-Z])/u);
    const out: string[] = [];
    let narr: string[] = [];
    const flush = () => { if (narr.length) { out.push(narr.join(' ')); narr = []; } };
    const pending = [...speech];
    for (const s of sentences) {
      const hit = pending.findIndex(sp => s.includes(sp.says.replace(/[.!?,]+$/, '')));
      if (hit === -1) { narr.push(s); continue; }
      const sp = pending.splice(hit, 1)[0]!;
      const core = sp.says.replace(/[.!?,]+$/, '');
      const at = s.indexOf(core);
      // pre-quote part of the carrier sentence stays narration (minus a dangling open-quote)
      const pre = s.slice(0, at).replace(/["“'\s]+$/, '').trim();
      if (pre) narr.push(pre.endsWith(',') || /[.!?]$/.test(pre) ? pre : pre + ' —');
      flush();
      const said = sp.says.replace(/^["“]|["”]$/g, '').replace(/,$/, '.');
      out.push(`      [${sp.who}]  “${said}”`);
      // post-quote residue: drop pure attribution tails ("he said."), keep working clauses —
      // rendered as a continuation dash, never re-capitalized into a fake sentence
      const tail = s.slice(at + core.length).replace(/^["”'\s,]*/, '')
        .replace(/^(?:(?:he|she|they|[A-Z][\p{L}-]+(?: [A-Z][\p{L}-]+)?) )?(?:said|answered|snapped|barked|spat|whispered|called|asked)[,.]?\s*/u, '')
        .replace(/^and\s+/, '').trim();
      if (tail.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean).length > 2) narr.push(`— ${tail}`);
    }
    flush();
    return out;
  }

  /** LORE §1 story-NPC write-back, at saga CLOSE (STORYTELLER §2.6): at most two met people who are not the focal
   *  (the one who asked > the one in the way > anyone else) are kept by the world. A coined person becomes a lore node
   *  (blurb = their label; sex and race as the deal rolled them); a returning face already is one. Each gets a memory
   *  edge to the focal by seat (client party-to, opponent rival-of; their last line in the chronicle; 0.5) and one to
   *  the soldier whose deed decided a job they were in (client saved-by, opponent rival-of; that line; 0.5) — so a face
   *  that returns can remember who dragged them out. Every blurb is a line the player read */
  private persistMetCast(chain: Chain) {
    const rec = chain.saga, plan = rec?.plan;
    if (!rec || !plan) return;
    const met = new Set(rec.knowing.met);
    const N = rec.world.N;
    const SEAT: Record<string, number> = { client: 0, opponent: 1, other: 2 };
    const inLine = (l: { n: number }, id: string) => (l.n >= N ? plan.showdown : plan.episodes[l.n - 1])?.people.includes(id) ?? false;
    const kept: string[] = [];
    // cap BEFORE the collision filter: the top-2 places are fixed by seat, never back-filled
    const picked = plan.cast
      .filter(p => !p.focal && p.seat !== 'soldier' && met.has(p.id) && !this.card(p.id))
      .sort((a, b) => (SEAT[a.seat] ?? 3) - (SEAT[b.seat] ?? 3))
      .slice(0, 2);
    for (const p of picked) {
      let id = p.id;
      if (!(p.memory && this.state.lore.nodes[p.id])) {
        // a coined person: a remembered name is never re-dealt to someone else
        if (this.state.cards.some(c => c.name === p.name) || Object.values(this.state.lore.nodes).some(nd => nd.name === p.name)) continue;
        id = freshId('lore-');
        const blurb = p.label.replace(/^./, ch => ch.toUpperCase());
        this.state.lore.nodes[id] = { id, kind: 'character', name: p.name, blurb, identity: blurb, sex: p.sex, race: p.race, active: true, createdCycle: this.state.cycle };
      }
      const theirs = rec.lines.filter(l => inLine(l, p.id));
      const last = theirs[theirs.length - 1] ?? rec.lines[rec.lines.length - 1];
      const edges: { from: string; to: string; type: string; blurb: string; importance: number }[] = [];
      // a saga that closed before any report has no line to remember them by: the memory is their part in the matter,
      // under the title the player read (the pre-v4 edge) — never a remembered person with no memory at all
      const part = p.seat === 'opponent' ? 'stood against the company' : p.seat === 'client' ? 'asked the company for help' : 'was caught up';
      edges.push({ from: id, to: chain.focalId, type: p.seat === 'opponent' ? 'rival-of' : 'party-to', blurb: last?.text ?? `${part} in the matter of "${plan.title}"`, importance: 0.5 });
      const deed = [...theirs].reverse().find(l => l.decides && l.outcome !== 'failure');
      const soldier = deed ? this.roster().find(m => m.name === deed.decides) ?? this.state.cards.find(c => c.character && c.name === deed.decides) : undefined;
      if (deed && soldier) {
        this.ensureLoreNode(soldier);
        edges.push({ from: id, to: soldier.id, type: p.seat === 'opponent' ? 'rival-of' : 'saved-by', blurb: deed.text, importance: 0.5 });
      }
      const fc = this.card(chain.focalId);
      if (fc) this.ensureLoreNode(fc);
      guardEdges(this.state.lore, edges, this.state.cycle, () => freshId('e'), chain.id);
      kept.push(p.name);
    }
    if (kept.length) this.log('chain', `The world remembers ${kept.join(' and ')}.`);
  }

  private settleFinale(q: Quest, chain: Chain, r: { outcome: Outcome; party: Card[] }, report: string[], precomputed?: FinaleFate) {
    this.persistMetCast(chain);
    const st = this.state;
    const focal = this.card(chain.focalId);
    // the fate was decided BEFORE the AI narrated (P11); recompute only as a fallback
    const fate = precomputed ?? finaleFate(this.rng, chain, r.outcome);
    const approach = q.approaches?.find(a => a.id === q.chosenApproach);
    // a focal who JOINED the company mid-saga (hired from the tavern, delivered earlier) makes
    // this a personal-style close — never re-dispose of your own soldier ("Marric recruited
    // twice"; "Zaxesh slips away" while on the roster)
    const focalIsOwnMerc = focal?.character?.role === 'merc';
    if (fate.fate === 'slipped') {
      // §21-4a: bank forfeit; focal slips away FOR NOW — alive in the lore graph, sequel lead back
      chain.state = 'slipped'; chain.bank = 0;
      if (focalIsOwnMerc) {
        report.push(`💨 The matter around ${focal!.name} slips out of reach — for now. What was set aside is lost. ${focal!.name} stays with the company.`);
        return;
      }
      if (focal && !chain.isPersonal) focal.location = HELD('lore');
      const sequel: Lead = {
        id: freshId('lead-'), rarity: fate.sequelRarity, level: chain.level, region: chain.region,
        archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
        source: 'sequel', title: focal ? `${focal.name} resurfaces, someday` : 'They resurface, someday',
        focalId: focal?.id,   // §21-4a: the road back leads to the SAME person
      };
      st.leads.push(sequel);
      // the WORLD must remember the slip — a later saga once staged a slipped focal "held in
      // your cells" because her lore node never recorded that she got away
      if (focal) guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `at large — slipped the company when "${this.sagaTitle(chain)}" ended; in no one's custody`, importance: 0.8 }], st.cycle, () => freshId('e'));
      report.push(`💨 ${focal?.name ?? 'The prize'} slips away — for now, and what was set aside is lost. A road back exists (${fate.sequelRarity} sequel lead).`);
      return;
    }
    chain.state = 'done';
    const kind = approach?.rewardKind ?? (chain.kind === 'gold-hoard' ? 'gold' : chain.kind === 'recruit' ? 'recruit' : 'captive');
    if (chain.isPersonal || focalIsOwnMerc) {
      // personal finale: bank crystallizes as gold + pinned CORE memory (no new character)
      const surplus = cashValue(chain.bank);
      this.addGold(surplus);
      guardEdges(st.lore, [{ from: chain.focalId, to: chain.focalId, type: 'scarred-by', blurb: `came through ${this.sagaTitle(chain)}`, importance: 0.9 }], st.cycle, () => freshId('e'));
      report.push(`🏅 ${focal?.name}'s story closes: +${surplus}g and a mark that stays.`);
      return;
    }
    if (!focal) return;
    // REWARD_BANK §3 void-to-gold (built 2026-07-10 — was a silent miss): a season banked below
    // KEEP·mark can't hold its prize — the focal slips for salvage gold instead of arriving
    // shackled to a crushing debt. A road back exists (§21-4a).
    if (kind !== 'gold' && chain.bank < focal.value * KEEP_THRESHOLD) {
      const pay = cashValue(chain.bank);
      this.addGold(pay);
      focal.location = HELD('lore');
      st.leads.push({
        id: freshId('lead-'), rarity: chain.rarity === 'common' ? 'uncommon' : 'rare',
        level: chain.level, region: chain.region, archetype: 'investigate',
        chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
        source: 'sequel', title: `${focal.name} resurfaces, someday`, focalId: focal.id,
      });
      report.push(`💨 The work earned too little to keep ${focal.name} — the affair pays 💰 +${pay}g and they pass out of reach, for now. A road back exists.`);
      guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `the saga ${this.sagaTitle(chain)} ended with ${focal.name} out of reach`, importance: 0.85 }], st.cycle, () => freshId('e'));
      return;
    }
    if (kind === 'gold') {
      // REWARD_BANK §3: cash-out pays round(bank) — same TOTAL as recruiting (the old
      // focal.value+surplus formula paid max(mark, bank) and dominated on thin banks).
      // partial = the LESSER version of the kind (QUESTS §9) — a discounted cash-out
      const full = Math.round(chain.bank);
      const pay = fate.fate === 'saddled' ? Math.round(full * 0.7) : full;
      this.addGold(pay);
      focal.location = HELD('lore');
      report.push(`💰 The whole affair pays out: +${pay}g${fate.fate === 'saddled' ? ' (a hard bargain — the full price slipped away)' : ''}. ${focal.name} passes out of your hands.`);
    } else if (kind === 'recruit') {
      // §2 value-invariance: the bank already paid the mark — a recruit finale JOINS CLEAN
      // (staging them at the tavern re-charged 1.2×mark on top; that double-charge is gone)
      const surplus = cashValue(crystallize(chain, focal.value));
      this.addGold(surplus);
      const shortDebt = Math.max(0, Math.round(focal.value - chain.bank));
      if (shortDebt > 0) this.addCard(mintStackable('debt', shortDebt));
      // room is counted BEFORE the focal becomes a merc: roster() counts every held merc, so a
      // focal still waiting in limbo counted ITSELF and a 4/5 roster read as full
      const room = this.roster().filter(m => m.id !== focal.id).length < this.rosterCapacity();
      if (room) {
        focal.character!.role = 'merc';
        focal.location = HELD('roster');
        this.spawnPersonalChainLead(focal);
        report.push(`🎬 Finale: ${focal.name} joins the company${shortDebt > 0 ? ` — the work earned less than they are worth, so a ${shortDebt}g debt comes with them` : ''}.${surplus > 0 ? ` 💰 +${surplus}g left over.` : ''}`);
      } else {
        focal.character!.role = 'npc';
        st.tavern.push({ cardId: focal.id, expiresAtCycle: st.cycle + STAGE_TTL_FINALE, prepaid: true });
        focal.location = HELD('staged');
        report.push(`🎬 Finale: ${focal.name} is yours — no roster room, so they wait at the tavern (already paid for)${shortDebt > 0 ? `; the work earned less than they are worth, so a ${shortDebt}g debt comes with them` : ''}.${surplus > 0 ? ` 💰 +${surplus}g left over.` : ''}`);
      }
    } else {
      focal.character!.role = 'captive';
      st.holding.push({ cardId: focal.id, expiresAtCycle: st.cycle + STAGE_TTL_FINALE });
      focal.location = HELD('staged');
      const surplus = cashValue(crystallize(chain, focal.value));
      this.addGold(surplus);
      // ONE debt rule: the shortfall between the bank and the focal's mark (QUESTS §5)
      const shortDebt = Math.max(0, Math.round(focal.value - chain.bank));
      if (shortDebt > 0) this.addCard(mintStackable('debt', shortDebt));
      report.push(`🎬 Finale: ${focal.name} is yours — captive${shortDebt > 0 ? `, but the work earned less than they are worth, so a ${shortDebt}g debt comes with them` : ''}.${surplus > 0 ? ` 💰 +${surplus}g left over.` : ''}`);
    }
    // the ARRANGEMENT joins the memory — dossiers once missed that a focal ended as a paid
    // informer because only the outcome word was recorded
    // (a later saga's writer reads it as a memory: the deed as the story tells it, the gold way's money left on its button)
    const way = approach && (approach.way && chain.saga?.plan ? flow.toldLabel(chain.saga, { way: approach.way, label: approach.label }) : approach.label);
    guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `the saga ${this.sagaTitle(chain)} ended ${fate.fate}${way ? ` — the company's way: ${way}` : ''}`, importance: 0.85 }], st.cycle, () => freshId('e'));
  }

  /** give who/backstory/quirks to any owned/staged character that lacks them (ONE batched call) */
  private async fleshPass(): Promise<void> {
    const st = this.state;
    const needs: Card[] = [];
    for (const c of st.cards) {
      if (!c.character || c.character.who) continue;
      const staged = st.tavern.some(x => x.cardId === c.id) || st.holding.some(x => x.cardId === c.id);
      const owned = this.isOwned(c) || c.location.kind === 'quest';
      if (!owned && !staged) continue;
      needs.push(c);
      if (needs.length >= 8) break;   // batch cap per cycle (5 backlogged 30-hire campaigns into tag-dump WHOs)
    }
    if (!needs.length) return;
    try {
      const outs = await this.ai.flesh(needs.map(c => {
        // the locked rule (DESIGN): deep history is written at delivery and must FIT the saga that
        // produced this person — the focal IS who that story was about
        const origin = st.chains.find(ch => ch.focalId === c.id && !ch.isPersonal);
        const plan = origin?.saga?.plan;
        return {
          characterId: c.id, name: c.name, tags: renderTags(c.tags),
          role: c.character!.role,
          quest: c.character!.origin,
          context: origin
            ? (origin.state === 'slipped'
              ? `the person the saga "${this.sagaTitle(origin)}" is about — they slipped through the company's fingers once already`
              : `the person the saga "${this.sagaTitle(origin)}" was about — the company spent a season on that story to reach them`)
            : c.character!.role === 'merc'
              ? (st.cycle <= 2 ? 'a founding member of the company' : 'a sword the company took on')
              : c.character!.role === 'captive' ? 'a captive taken on a quest' : 'someone the road washed up at the gate',
          // the saga they were at the heart of: its answer is who they turned out to be (the question, while the finale
          // that brings it out is still unplayed), its last line where it ended
          saga: plan ? {
            title: plan.title,
            kernel: origin!.saga!.lines.some(l => l.n >= origin!.saga!.world.N) ? plan.answer : plan.question,
            situation: origin!.saga!.lines[origin!.saga!.lines.length - 1]?.text ?? origin!.saga!.card1,
            // only the one the company acts for has a want (validatePlan leaves everyone else's ''): none is null, never ''
            want: plan.cast.find(e => e.id === c.id)?.want || null,
          } : undefined,
          // cross-batch quirk dedup — "tilts head when listening" landed on 4 people
          avoidQuirks: st.cards.flatMap(x => x.character?.quirks ?? []).slice(-20),
        };
      }));
      for (const o of outs) {
        const card = this.card(o.characterId);
        if (!card?.character) continue;
        card.character.who = o.who || card.character.who;
        card.character.backstory = o.backstory || card.character.backstory;
        if (o.quirks.length) card.character.quirks = normQuirks(o.quirks).slice(0, 2);
        const node = this.state.lore.nodes[card.id];
        if (node && o.who) node.blurb = this.clampBlurb(o.who);
      }
    } catch { /* flesh is flavor — never block the cycle on it */ }
  }

  /** founding mercs get their personal main chain too (hires get one at hire) */
  /** early-game smoothing: the rest of the old day-0 packet arrives one lead per cycle */
  private starterDripPass(): void {
    const st = this.state;
    if (!this.hasRoom('map-room')) return;
    st.starterDripped ??= (st.cycle > 1 ? STARTER_DRIP_COUNT : 0);   // old saves: no retro-drip
    if (st.starterDripped >= STARTER_DRIP_COUNT) return;
    const drip = starterDripLead(this.rng, st.starterDripped, st.cycle, () => freshId('lead-'), this.recentLeadArchetypes);
    this.noteLeadArchetype(drip.archetype);
    st.leads.push(drip);
    st.starterDripped += 1;
    this.log('leads', 'New word reaches the map table.');
  }

  private personalChainDrip(): void {
    const st = this.state;
    // cycle gate 10→3 (2026-07-18): founders now START here — first personal saga lands
    // ~cycle 5 in expectation (0.25/cycle), the rest staggered behind the one-pending gate
    if (!this.hasRoom('lead-room') || st.cycle < 3) return;
    // founders' sagas STRICTLY wait for roster slack — with 2 mercs a personal chain
    // monopolizes the whole company and starves the economy (dogfood-proven trap)
    if (this.roster().length < 3) return;
    const pendingPersonal = st.leads.some(l => l.source === 'personal');
    if (pendingPersonal) return;
    const unstoried = this.roster().find(m =>
      !st.chains.some(c => c.isPersonal && c.focalId === m.id) &&
      !st.leads.some(l => l.personalMercId === m.id));
    if (!unstoried) return;
    if (!this.rng.chance(0.25)) return;   // staggered, not a flood
    this.spawnPersonalChainLead(unstoried);
    this.log('leads', `${unstoried.name}'s past stirs — a personal thread appears.`);
  }

  private healingPass() {
    const infirmary = this.state.fort.rooms.find(r => r.type === 'infirmary');
    const rate = infirmary ? infirmaryHealRate(this.comfort(infirmary)) : REST_HEAL_PER_CYCLE;
    for (const c of this.state.cards) {
      if (!c.character || c.character.injuryTiers <= 0) continue;
      if (c.location.kind === 'quest') continue;    // deployed units don't heal
      healTick(c.character as never, rate);
    }
  }

  private breakingPass(report: string[]) {
    const st = this.state;
    for (const b of [...st.breaking]) {
      if (st.cycle < b.doneAtCycle) continue;
      const card = this.card(b.cardId);
      st.breaking = st.breaking.filter(x => x !== b);
      if (!card) continue;
      card.tags.push({ concept: 'obedient' });
      // off the rack, back to the cells — ready to be stationed
      this.unslotCard(card);
      card.location = HELD('roster');
      report.push(`🔗 ${card.name} is broken — tamed, ready to be set in a room.`);
      this.cycleAcc?.tamed.push({ id: card.id, name: card.name });
    }
  }
}

export { renderTags, ROOM_TYPE, REGION, REGIONS, GH_THRESHOLDS, U };

/** Is this wound actually SHOWN in the after-text? The check was a verbatim 25-character prefix,
 *  and cheap models paraphrase their own sentence when they cite it: "cut across the thigh BY a
 *  sentry's short spear" against prose reading "cut HER across the thigh WITH a short spear" was
 *  dropped, so the report said she bled and the engine said she was fine (both saga wounds in a
 *  2026-09-25 playtest). Word overlap keeps the guard's purpose — an uncited wound is invented —
 *  without demanding the model quote itself exactly. */
/** no cited phrase: is a wound shown on THIS soldier anyway? Solo — any wound sentence (the harmed
 *  one is unambiguous); a party — a wound sentence that names them. */
const WOUND = /\b(bled|bleed|blood|cut|gash|slash|wound|stab|bruis|broke|burn|struck|nick|torn|scor|lame|limp|pierc|bit |split|punch|fist|knocked|cracked|sprain|twisted|swoll|welt|gouge|grazed|scraped|singed|scald|clawed|fang|bitten|hurt|injur)/i;
export function woundShownOn(name: string, after: string, solo: boolean): boolean {
  const first = name.split(' ')[0]!.toLowerCase();
  return after.split(/(?<=[.!?])\s+/).some(sn => WOUND.test(sn) && (solo || sn.toLowerCase().includes(first)));
}

export function causeShown(cause: string, after: string): boolean {
  const words = (t: string) => t.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const STOP = new Set(['with', 'from', 'into', 'onto', 'their', 'there', 'that', 'this', 'while', 'when', 'were', 'they', 'them', 'have', 'been', 'over', 'under']);
  const want = words(cause).filter(w => !STOP.has(w));
  if (!want.length) return false;
  const have = new Set(words(after).map(w => w.slice(0, 5)));
  const hit = want.filter(w => have.has(w.slice(0, 5))).length;
  return hit >= Math.min(2, want.length) && hit / want.length >= 0.6;
}

/** the plain words for what a direction does (the Settings echo + the CLI) */
export function directionSummary(d: CampaignDirection): string {
  const side = (label: string, p: TraitPrefs) => [p.prefer.length ? `${label} lean ${p.prefer.join(', ')}` : '', p.avoid.length ? `${label} never ${p.avoid.join(', ')}` : ''].filter(Boolean);
  return [d.guidance, ...side('strangers', d.npc), ...side('recruits', d.recruit), d.avoid.length ? `keep out: ${d.avoid.join(', ')}` : ''].filter(Boolean).join(' · ');
}

/** no AI to read it (the mock): trait words named in the text, 'no X' / 'without X' as avoid, both roles */
function readDirectionPlain(text: string, vocab: Record<string, string[]>): DirectionRead {
  const low = ` ${text.toLowerCase()} `;
  const alias: Record<string, string> = { men: 'male', males: 'male', man: 'male', women: 'female', females: 'female', woman: 'female', elves: 'elf', lizardfolk: 'lizardman', wolfkin: 'wolfman', humans: 'human' };
  const prefer: string[] = [], avoid: string[] = [];
  const words = [...Object.values(vocab).flat().map(id => [id, id] as const), ...Object.entries(alias)];
  for (const [w, id] of words) {
    const m = low.match(new RegExp(`(no |not |without |never )?\\b${w.replace(/[-]/g, '[- ]')}s?\\b`));
    if (m) (m[1] ? avoid : prefer).push(id);
  }
  const p = { prefer: [...new Set(prefer)], avoid: [...new Set(avoid)] };
  return { guidance: text, npc: p, recruit: { prefer: [...p.prefer], avoid: [...p.avoid] }, avoid: [] };
}

