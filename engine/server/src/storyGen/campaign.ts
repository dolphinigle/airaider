// storyGen/campaign — the Chain Campaign prototype engine (state + rules).
//
// THROWAWAY PROTOTYPE (see docs/PROTOTYPE_DOCTRINE.md). One job: let a player
// feel whether AI quest-chains over a PERSISTENT, RECURRING cast are fun.
//
// "Engine owns numbers, AI owns flavor": this file decides outcome TIERS (from
// merc-fit + luck), gold, pacing, and reward KIND. chainGen.ts (AI) writes all
// prose, cards, and who the cast are.
//
// The character pool is persisted by CharacterPool to a sibling file; this
// module holds the campaign save (day, gold, running chains).

import OpenAI from 'openai';
import { CharacterPool, type PoolCharacter } from '../chainBible/characterPool.js';
import { pickSeed, type Seed, type Stakes } from './seeds.js';
import {
  buildBible, writeQuest, resolveQuest, assessFit, mergeChainState, newChainState,
  drivingHookOf, pacingFor, truthy,
  type Bible, type Quest, type Resolution, type ChainState, type Outcome,
} from './chainGen.js';

// ---------------------------------------------------------------------------
// Save types
// ---------------------------------------------------------------------------
export interface StepLog {
  step: number;
  questTitle: string;
  card: string;
  outcome: Outcome;
  assignedNames: string[];
  resolutionProse: string;
  newlyRevealed: string[];
  closingNote?: string;
}

export interface RewardLog {
  gold: number;
  kind: 'gold' | 'promote_to_merc' | 'unique_trait';
  detail: string;
}

export interface ChainRun {
  id: string;
  seedId: string;
  stakes: Stakes;
  title: string;
  leadBlurb: string;
  bible: Bible;
  drivingHook: string;
  state: ChainState;
  pacing: { target: number; max: number };
  stepIdx: number;            // quests resolved so far
  openQuest: Quest | null;    // current card awaiting assign + resolve
  assignedMercIds: string[];
  status: 'active' | 'closed';
  castNames: string[];        // names in the bible cast (for arc write-back)
  reward: RewardLog | null;
  steps: StepLog[];
}

export interface CampaignState {
  version: 1;
  day: number;
  gold: number;
  usedSeedIds: string[];
  chains: ChainRun[];
}

export function newCampaign(): CampaignState {
  return { version: 1, day: 1, gold: 100, usedSeedIds: [], chains: [] };
}

// ---------------------------------------------------------------------------
// Engine numbers
// ---------------------------------------------------------------------------
const STAKES_FACTOR: Record<Stakes, number> = { uncommon: 1, rare: 1.6, legendary: 2.5 };
const STEP_GOLD: Record<Outcome, number> = { clean_win: 30, narrow_win: 20, partial_loss: 8, failure: 0 };

function rngInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

/** Engine-owned outcome tier from an AI party-fit judgement (0-6) plus luck.
 *  partyFit is the qualitative match; the roll keeps results from feeling fixed. */
export function tierFromFit(partyFit: number, assignedCount: number): { outcome: Outcome; roll: number } {
  if (assignedCount === 0) return { outcome: 'failure', roll: 0 };
  const roll = rngInt(2);
  const score = partyFit + roll;          // 0..8
  const outcome: Outcome =
    score >= 7 ? 'clean_win'
    : score >= 5 ? 'narrow_win'
    : score >= 3 ? 'partial_loss'
    : 'failure';
  return { outcome, roll };
}

// ---------------------------------------------------------------------------
// Pool helpers
// ---------------------------------------------------------------------------
export function mercsInPool(pool: CharacterPool): PoolCharacter[] {
  return pool.all().filter((c) => c.role === 'mercenary');
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
}

/** Mint a roster mercenary from a bible cast person (used by promote_to_merc). */
function mintMercFromCast(person: { name: string; who: string; wants: string; feels: string; history: string[]; conceals?: unknown }, region: string, day: number): PoolCharacter {
  return {
    id: `char_${slug(person.name)}_${day}`,
    name: person.name,
    region,
    role: 'mercenary',
    tags: [],
    surface: person.who,
    want: person.wants,
    need: person.feels,
    ghost: person.history[0] ?? '',
    lie: '',
    secret: typeof person.conceals === 'string' ? person.conceals : '',
    arcState: 'newly sworn to the company',
    introducedDay: day,
    lastSeenDay: day,
    appearedInChainIds: [],
  };
}

// ---------------------------------------------------------------------------
// Engine actions
// ---------------------------------------------------------------------------
let chainCounter = 0;
function nextChainId(day: number): string {
  chainCounter++;
  return `chain_d${day}_${chainCounter}`;
}

/** The world offers a new chain: pick a seed, author its bible, write quest #1. */
export async function offerChain(client: OpenAI, pool: CharacterPool, camp: CampaignState, seedOverride?: Seed): Promise<ChainRun> {
  const used = new Set(camp.usedSeedIds);
  const seed = seedOverride ?? pickSeed({ excludeIds: used });
  const { bible } = await buildBible(client, { seed, slate: pool.all() });

  const pacing = pacingFor(seed.stakes);
  const state = newChainState(bible);
  const drivingHook = drivingHookOf(bible);
  const quest = await writeQuest(client, { bible, state, drivingHook, step: 1, pacing });

  camp.usedSeedIds.push(seed.id);
  return {
    id: nextChainId(camp.day),
    seedId: seed.id,
    stakes: seed.stakes,
    title: bible.title,
    leadBlurb: bible.leadBlurb,
    bible,
    drivingHook,
    state,
    pacing,
    stepIdx: 0,
    openQuest: quest,
    assignedMercIds: [],
    status: 'active',
    castNames: bible.cast.map((c) => c.person.name),
    reward: null,
    steps: [],
  };
}

/** Resolve the chain's open quest with the currently-assigned mercs.
 *  Returns the resolution + a gold delta; mutates chain + pool. */
export async function resolveOpenQuest(
  client: OpenAI, pool: CharacterPool, camp: CampaignState, chain: ChainRun,
): Promise<{ outcome: Outcome; fit: number; fitNote: string; resolution: Resolution; goldDelta: number; closed: boolean; reward: RewardLog | null }> {
  if (!chain.openQuest) throw new Error('no open quest to resolve');
  const quest = chain.openQuest;
  const mercs = chain.assignedMercIds.map((id) => pool.get(id)).filter(Boolean) as PoolCharacter[];

  const step = chain.stepIdx + 1;
  const mustEndNow = step >= chain.pacing.max;
  const canEndNow = step >= chain.pacing.target;

  let fit = 0;
  let fitNote = 'no one was sent';
  if (mercs.length) {
    const judgement = await assessFit(client, {
      quest,
      party: mercs.map((m) => ({ name: m.name, tags: m.tags, background: `${m.surface} ${m.ghost}`.trim() })),
    });
    fit = judgement.partyFit;
    fitNote = judgement.note;
  }
  const { outcome } = tierFromFit(fit, mercs.length);
  const isFinal = mustEndNow || (truthy(quest.closesChain) && canEndNow);
  const assignedDesc = mercs.length
    ? mercs.map((m) => `${m.name} [${m.tags.join(', ')}]`).join('; ')
    : '(no units assigned — the company sent no one)';

  const resolution = await resolveQuest(client, { bible: chain.bible, state: chain.state, quest, outcome, assignedDesc, isFinal });
  mergeChainState(chain.state, resolution);

  chain.steps.push({
    step,
    questTitle: quest.questTitle,
    card: quest.card,
    outcome,
    assignedNames: mercs.map((m) => m.name),
    resolutionProse: resolution.resolutionProse,
    newlyRevealed: resolution.newlyRevealed ?? [],
    closingNote: resolution.closingNote,
  });
  chain.stepIdx = step;
  chain.assignedMercIds = [];

  let goldDelta = Math.round(STEP_GOLD[outcome] * STAKES_FACTOR[chain.stakes]);

  // Mark assigned mercs as recently seen (recurrence bookkeeping).
  for (const m of mercs) pool.updateArcState(m.id, m.arcState, camp.day, chain.id);

  if (isFinal) {
    chain.status = 'closed';
    chain.openQuest = null;
    const reward = applyClosingReward(pool, camp, chain, outcome, mercs);
    goldDelta += reward.gold;
    chain.reward = reward;
    writeBackArcStates(pool, camp, chain);
    return { outcome, fit, fitNote, resolution, goldDelta, closed: true, reward };
  }

  // Otherwise author the next quest from the advanced state.
  const next = await writeQuest(client, {
    bible: chain.bible, state: chain.state, drivingHook: chain.drivingHook, step: step + 1, pacing: chain.pacing,
  });
  chain.openQuest = next;
  return { outcome, fit, fitNote, resolution, goldDelta, closed: false, reward: null };
}

/** Engine picks the reward KIND on chain close; AI already authored the cast. */
function applyClosingReward(pool: CharacterPool, camp: CampaignState, chain: ChainRun, finale: Outcome, mercs: PoolCharacter[]): RewardLog {
  const closingGold = Math.round((finale === 'clean_win' ? 120 : finale === 'narrow_win' ? 70 : finale === 'partial_loss' ? 25 : 10) * STAKES_FACTOR[chain.stakes]);
  const win = finale === 'clean_win' || finale === 'narrow_win';

  // Headline reward on a winning finale: fold a chain NPC into the roster.
  if (win) {
    const region = pool.all()[0]?.region ?? 'Mireford';
    const existingMercNames = new Set(mercsInPool(pool).map((m) => m.name));
    const candidate = chain.bible.cast.find((c) => (c.coined || !existingMercNames.has(c.person.name)) && !existingMercNames.has(c.person.name));
    if (candidate) {
      const inPool = pool.all().find((c) => c.name === candidate.person.name);
      if (inPool) {
        pool.setRole(inPool.id, 'mercenary');
      } else {
        pool.add(mintMercFromCast(candidate.person, region, camp.day));
      }
      return { gold: closingGold, kind: 'promote_to_merc', detail: `${candidate.person.name} joins the company.` };
    }
  }

  // Otherwise, a winning party member is marked by the chain (growth tag).
  if (win && mercs.length) {
    const m = mercs[0];
    const tag = `${slug(chain.title)}-veteran`;
    if (!m.tags.includes(tag)) {
      m.tags.push(tag);
      pool.save();
      return { gold: closingGold, kind: 'unique_trait', detail: `${m.name} earns the mark "${tag}".` };
    }
  }

  return { gold: closingGold, kind: 'gold', detail: `The company is paid out for closing "${chain.title}".` };
}

/** Light recurrence write-back: cast members already in the pool are touched so
 *  they re-surface (most-recent-seen) in later chains' sampling. */
function writeBackArcStates(pool: CharacterPool, camp: CampaignState, chain: ChainRun): void {
  for (const c of chain.bible.cast) {
    const inPool = pool.all().find((p) => p.name === c.person.name && p.role !== 'dead');
    if (!inPool) continue;
    const status = chain.state.actorStates[c.person.name];
    pool.updateArcState(inPool.id, status ?? inPool.arcState, camp.day, chain.id);
  }
}
