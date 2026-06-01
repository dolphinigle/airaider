// chainPlay — the engine that runs a storyGen quest chain over the fort's
// mercenary roster. Engine owns the NUMBERS (outcome tier, gold, pacing); the
// AI generators in chainGen own all the FLAVOR (bible, quest cards, prose).
//
// A chain is offered, the player assigns roster mercs, the engine judges fit +
// rolls an outcome tier, the resolver writes the aftermath, and the chain state
// advances until the arc closes. State persists to a sidecar JSON next to the
// roster save so the existing roster schema is untouched (prototype doctrine:
// no schema churn for throwaway features).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import OpenAI from 'openai';
import type { Merc } from '../types.js';
import { pickSeed, seedById, type Seed, type Stakes } from './seeds.js';
import {
  buildBible, writeQuest, resolveQuest, assessFit, mergeChainState,
  newChainState, drivingHookOf, pacingFor, truthy,
  type Genesis, type Bible, type Quest, type ChainState, type Outcome,
  type SlateCharacter,
} from './chainGen.js';

// ---------------------------------------------------------------------------
// Serializable chain state (persisted to the sidecar)
// ---------------------------------------------------------------------------
export interface ChainLogEntry {
  step: number;
  questTitle: string;
  card: string;
  party: string;
  outcome: Outcome;
  fit: number;
  prose: string;
  gold: number;
}

export type ChainStatus = 'awaiting-offer' | 'awaiting-assign' | 'done' | 'failed';

export interface ActiveChain {
  id: string;
  seedId: string;
  spark: string;
  title: string;
  leadBlurb: string;
  stakes: Stakes;
  genesis: Genesis;
  bible: Bible;
  state: ChainState;
  drivingHook: string;
  /** quests RESOLVED so far. */
  step: number;
  target: number;
  max: number;
  status: ChainStatus;
  openQuest: Quest | null;
  log: ChainLogEntry[];
  startedOnDay: number;
  /** Roster names at bible-build time — the engine's truth for who is NOT a new
   *  face. Used to decide recruitability of cast members. */
  slateNames: string[];
}

export interface ResolveResult {
  outcome: Outcome;
  fit: number;
  fitNote: string;
  prose: string;
  gold: number;
  closed: boolean;
  /** On a winning finale, a new face from the story who offers to join. */
  recruit: { name: string; background: string } | null;
}

// ---------------------------------------------------------------------------
// Roster -> slate mapping (the cast the bible draws from is the living crew)
// ---------------------------------------------------------------------------
export function mercToSlate(m: Merc): SlateCharacter {
  const tags = m.tags.map((t) => t.label);
  const surface = (m.backstory && m.backstory.trim())
    ? m.backstory.trim()
    : `A fort mercenary known for ${tags.slice(0, 3).join(', ') || 'plain, dependable soldiering'}.`;
  return { id: m.id, name: m.name, role: 'mercenary', tags, surface };
}

export function rosterSlate(mercs: Merc[]): SlateCharacter[] {
  return mercs.map(mercToSlate);
}

/** Party shape the fit-judge + resolver want. */
export function partyOf(mercs: Merc[]): { name: string; tags: string[]; background: string }[] {
  return mercs.map((m) => ({
    name: m.name,
    tags: m.tags.map((t) => t.label),
    background: (m.backstory && m.backstory.trim()) || `tier-${m.veterancy} mercenary`,
  }));
}

// ---------------------------------------------------------------------------
// Engine-owned numbers
// ---------------------------------------------------------------------------
const DEAD = /\b(dead|killed|murdered|slain|deceased|corpse|the late|posthum)\b/i;

/** A cast member is unrecruitable-by-death only when their identity line (`who`)
 *  marks THEM as a corpse (e.g. "the murdered merchant"). We deliberately do NOT
 *  scan `history` — the why-ladder routinely mentions OTHER people's deaths and
 *  would wrongly filter out living characters. */
function isDeceased(p: Bible['cast'][number]['person']): boolean {
  return DEAD.test(p.who);
}

/** A new face the story surfaced (NOT a pre-existing roster merc, NOT dead) who
 *  can join when the chain ends on a win. "New" is decided by slate membership —
 *  the engine's truth — not the AI's unreliable `coined` flag. Returns null when
 *  the story surfaced no recruitable new person. */
export function recruitCandidate(
  bible: Bible,
  slateNames: ReadonlySet<string>,
): { name: string; background: string } | null {
  const norm = (s: string) => s.trim().toLowerCase();
  const onSlate = new Set([...slateNames].map(norm));
  const newFaces = bible.cast.filter((c) => !onSlate.has(norm(c.person.name)) && !isDeceased(c.person));
  const pick = newFaces.find((c) => c.coined === true) ?? newFaces[0];
  if (!pick) return null;
  const p = pick.person;
  const bedrock = p.history[p.history.length - 1];
  const background = bedrock ? `${p.who} ${bedrock}` : p.who;
  return { name: p.name, background };
}

const WIN_OUTCOMES = new Set<Outcome>(['clean_win', 'narrow_win']);
const GOLD_BASE: Record<Stakes, number> = { uncommon: 8, rare: 16, legendary: 32 };
const GOLD_MULT: Record<Outcome, number> = { clean_win: 1.5, narrow_win: 1.0, partial_loss: 0.4, failure: 0 };

export function goldFor(stakes: Stakes, outcome: Outcome): number {
  return Math.round(GOLD_BASE[stakes] * GOLD_MULT[outcome]);
}

/** fit (0-6, AI-judged) + a small luck roll -> the engine's outcome tier. */
export function tierFromFit(partyFit: number, partyCount: number, rng: () => number = Math.random): Outcome {
  if (partyCount === 0) return 'failure';
  const luck = Math.floor(rng() * 3); // 0..2
  const score = partyFit + luck;
  if (score >= 7) return 'clean_win';
  if (score >= 5) return 'narrow_win';
  if (score >= 3) return 'partial_loss';
  return 'failure';
}

// ---------------------------------------------------------------------------
// Chain lifecycle (client in, mutated chain out)
// ---------------------------------------------------------------------------
export async function startChain(
  client: OpenAI,
  mercs: Merc[],
  opts: { dayCount: number; seedId?: string; stakes?: Stakes; excludeSeedIds?: ReadonlySet<string> },
): Promise<ActiveChain> {
  const seed: Seed = opts.seedId
    ? (seedById(opts.seedId) ?? pickSeed({ stakes: opts.stakes, excludeIds: opts.excludeSeedIds }))
    : pickSeed({ stakes: opts.stakes, excludeIds: opts.excludeSeedIds });

  const { genesis, bible } = await buildBible(client, { seed, slate: rosterSlate(mercs) });
  const pacing = pacingFor(seed.stakes);
  return {
    id: `chain_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    seedId: seed.id,
    spark: seed.spark,
    title: bible.title,
    leadBlurb: bible.leadBlurb,
    stakes: seed.stakes,
    genesis,
    bible,
    state: newChainState(bible),
    drivingHook: drivingHookOf(bible),
    step: 0,
    target: pacing.target,
    max: pacing.max,
    status: 'awaiting-offer',
    openQuest: null,
    log: [],
    startedOnDay: opts.dayCount,
    slateNames: mercs.map((m) => m.name),
  };
}

export async function offerNextQuest(client: OpenAI, chain: ActiveChain): Promise<Quest> {
  const quest = await writeQuest(client, {
    bible: chain.bible,
    state: chain.state,
    drivingHook: chain.drivingHook,
    step: chain.step + 1,
    pacing: { target: chain.target, max: chain.max },
  });
  chain.openQuest = quest;
  chain.status = 'awaiting-assign';
  return quest;
}

export async function resolveOpen(
  client: OpenAI,
  chain: ActiveChain,
  party: Merc[],
): Promise<ResolveResult> {
  const quest = chain.openQuest;
  if (!quest) throw new Error('resolveOpen: no open quest on this chain');

  const fit = party.length
    ? await assessFit(client, { quest, party: partyOf(party) })
    : { partyFit: 0, note: 'no one was assigned' };
  const outcome = tierFromFit(fit.partyFit, party.length);

  const nextStep = chain.step + 1;
  const isFinal = truthy(quest.closesChain) || nextStep >= chain.max;
  const assignedDesc = party.length ? party.map((m) => m.name).join(', ') : '(no one)';

  const resolution = await resolveQuest(client, {
    bible: chain.bible,
    state: chain.state,
    quest,
    outcome,
    assignedDesc,
    isFinal,
  });
  mergeChainState(chain.state, resolution);

  const gold = goldFor(chain.stakes, outcome);
  chain.step = nextStep;
  chain.log.push({
    step: nextStep,
    questTitle: quest.questTitle,
    card: quest.card,
    party: assignedDesc,
    outcome,
    fit: fit.partyFit,
    prose: resolution.resolutionProse + (resolution.closingNote ? `\n\n${resolution.closingNote}` : ''),
    gold,
  });
  chain.openQuest = null;
  chain.status = isFinal ? (outcome === 'failure' ? 'failed' : 'done') : 'awaiting-offer';

  return {
    outcome,
    fit: fit.partyFit,
    fitNote: fit.note,
    prose: resolution.resolutionProse,
    gold,
    closed: isFinal,
    recruit: isFinal && WIN_OUTCOMES.has(outcome)
      ? recruitCandidate(chain.bible, new Set(chain.slateNames ?? []))
      : null,
  };
}

// ---------------------------------------------------------------------------
// Persistence (sidecar JSON next to the roster save)
// ---------------------------------------------------------------------------
export function chainsPathFor(savePath: string): string {
  return savePath.replace(/\.json$/, '') + '.chains.json';
}

export function loadChains(savePath: string): ActiveChain[] {
  const path = chainsPathFor(savePath);
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ActiveChain[];
  } catch {
    return [];
  }
}

export function saveChains(savePath: string, chains: ActiveChain[]): void {
  writeFileSync(chainsPathFor(savePath), JSON.stringify(chains, null, 2));
}
