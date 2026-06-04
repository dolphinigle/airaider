// Lead board (docs/QUESTS.md §1) — cheap mechanical stubs, no AI. The fort dials
// the board: scout tier raises rarity ceiling + unlocks archetypes; level bands
// around the roster. Continuation leads for live chains carry cached title/hook.

import type { GameState, Lead, Rarity, Archetype, ChainInfo, CharacterCard } from './types.js';
import { randInt, pick, weightedPick, type Rng } from './rng.js';
import { allMercs } from './state.js';
import { canCapture, leadTier, globalPrestige } from './fort.js';

export const BOARD_CAPACITY = 5;
export const LEAD_TTL = 2; // cycles before a fresh lead expires

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary'];

function rarityCeilingIndex(state: GameState): number {
  const tier = leadTier(state);                 // scout 1 → uncommon, 2 → rare
  const gp = globalPrestige(state);
  let idx = Math.min(RARITIES.length - 1, tier);
  if (gp >= 60) idx = Math.min(RARITIES.length - 1, idx + 1);
  return idx;
}
function rollRarity(r: Rng, ceilingIdx: number): Rarity {
  // weighted toward common; rare is scarce
  const weights = [60, 26, 11, 3].slice(0, ceilingIdx + 1);
  let x = r() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x <= 0) return RARITIES[i]; }
  return 'common';
}

function rosterLevel(state: GameState): number {
  const mercs = allMercs(state);
  if (!mercs.length) return 1;
  return Math.round(mercs.reduce((s, m) => s + m.level, 0) / mercs.length);
}

function availableArchetypes(state: GameState): Archetype[] {
  const base: Archetype[] = ['raid', 'rescue', 'escort', 'investigate', 'hunt', 'contract', 'scout'];
  if (canCapture(state)) base.push('capture');
  return base;
}

let counter = 0;
export function rollFreshLead(state: GameState, r: Rng): Lead {
  const location = pick(r, state.unlockedLocations);
  const rarity = rollRarity(r, rarityCeilingIndex(state));
  const baseLvl = rosterLevel(state);
  const stretch = r() < 0.18 ? randInt(r, 1, 2) : 0;
  const level = Math.max(1, baseLvl + randInt(r, -1, 1) + stretch);
  const archetype = weightedPick(r, availableArchetypes(state), (a) => (a === 'contract' || a === 'raid' ? 2 : 1));
  // chain-info: common → one-off; uncommon+ may start a chain
  let chain: ChainInfo = { kind: 'none' };
  if (rarity !== 'common' && r() < (rarity === 'rare' || rarity === 'legendary' ? 0.7 : 0.4)) chain = { kind: 'starts-new' };
  return {
    id: `lead_${state.cycle}_${counter++}`,
    rarity, level, location, archetype, chain,
    expiresCycle: state.cycle + LEAD_TTL,
  };
}

/** Queue a merc to receive a personal-chain lead (a saga about THEM) next restock. */
export function queueMainChain(state: GameState, mercId: string): void {
  if (!state.pendingMainChains.includes(mercId)) state.pendingMainChains.push(mercId);
}

/** Top the board to capacity: personal-chain leads + continuation leads + fresh. */
export function stockLeadBoard(state: GameState, r: Rng): void {
  // drop expired
  state.leads = state.leads.filter((l) => l.expiresCycle >= state.cycle);

  // personal-chain leads for queued joiners (a saga about a merc you've kept)
  const stillQueued: string[] = [];
  for (const mercId of state.pendingMainChains) {
    const merc = state.cards[mercId] as CharacterCard | undefined;
    if (!merc || merc.role !== 'merc') continue;                       // gone/dead → drop
    if (Object.values(state.chains).some((c) => c.personal && c.focalCardIds.includes(mercId) && c.state !== 'done')) continue; // already running
    const already = state.leads.some((l) => l.chain.kind === 'personal' && l.chain.mercId === mercId);
    if (already) { stillQueued.push(mercId); continue; }
    state.leads.push({
      id: `lead_personal_${mercId}_${state.cycle}`,
      rarity: 'uncommon', level: merc.level, location: pick(r, state.unlockedLocations),
      archetype: 'investigate', chain: { kind: 'personal', mercId },
      title: `${merc.name}'s past`, hook: `Something out of ${merc.name}'s history comes looking.`,
      expiresCycle: state.cycle + LEAD_TTL + 3,
    });
    stillQueued.push(mercId); // keep until pursued (so it re-stocks if it expires)
  }
  state.pendingMainChains = stillQueued;

  // continuation leads — one per live chain that wants to continue
  for (const chain of Object.values(state.chains)) {
    if (chain.state === 'done') continue;
    const exists = state.leads.some((l) => l.chain.kind === 'continues' && l.chain.chainId === chain.id);
    if (exists) continue;
    state.leads.push({
      id: `lead_chain_${chain.id}_${state.cycle}`,
      rarity: chain.rarity, level: chain.level, location: chain.title ? state.unlockedLocations[0] : pick(r, state.unlockedLocations),
      archetype: 'investigate',
      chain: { kind: 'continues', chainId: chain.id },
      title: chain.title, hook: chain.hook,
      expiresCycle: state.cycle + LEAD_TTL + 2, // chains linger longer
    });
  }

  while (state.leads.length < BOARD_CAPACITY) state.leads.push(rollFreshLead(state, r));
}

// slot count derived from archetype (engine owns N, before AI)
const ARCH_SLOTS: Record<Archetype, number> = {
  contract: 1, investigate: 1, scout: 1, escort: 2, capture: 2, rescue: 2, hunt: 2, raid: 3,
};
export function slotCountFor(lead: Lead, r: Rng): number {
  const n = ARCH_SLOTS[lead.archetype] ?? 2;
  return n + (r() < 0.15 ? 1 : 0);
}
