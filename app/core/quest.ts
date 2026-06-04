// Quest + chain pipeline (docs/QUESTS.md). The spine: pursue a lead → engine sets
// N/V and rolls the reward → AI writes card+ask (or chain beat) → assign → resolve
// (roll → outcome) → deliver (full / half+liability / none+punishment). Chains build
// a story around a focal character generated at genesis; the finale roll decides its fate.
//
// Engine owns every number; the Narrator only writes fiction. Kept in one module
// because one-off, chain-beat, and finale share buildQuest/assign/resolve/deliver.

import type {
  GameState, Lead, Quest, QuestSlot, Chain, CharacterCard, Outcome, RewardBundle, ApproachGroup,
} from './types.js';
import type { Rng } from './rng.js';
import { rngFrom, randInt } from './rng.js';
import type { Narrator } from './ai.js';
import { tagLabels } from './ai.js';
import {
  BALANCE, thresholdFor, resolveRoll, estimateOdds, attrsAtLevel,
  generateCharacter, type RollTest,
} from './economy.js';
import { generateReward, rewardEnvelope } from './reward.js';
import { characterFromGen, liabilityCard, type MkId } from './cards.js';
import { tagDef } from './tags.js';
import { uid, addCard, logLine, allMercs, captives } from './state.js';
import { slotCountFor, queueMainChain } from './leads.js';
import { captiveCapacity, levelCap } from './fort.js';

const mk = (state: GameState): MkId => (p: string) => uid(state, p);

// ---- value ------------------------------------------------------------------
function questValue(level: number, rarity: Quest['rarity'], n: number): number {
  return Math.round(BALANCE.vBase(level) * BALANCE.rarityMult[rarity] * n);
}
function isRisky(lead: Lead): boolean {
  return lead.rarity === 'rare' || lead.rarity === 'legendary' || lead.archetype === 'raid' || lead.archetype === 'capture';
}

// ---- building a quest from an AI ask ----------------------------------------
interface AskShape {
  attribute: RollTest['attribute'];
  favoredTags: string[];
  slots: Array<{ kind: 'open' } | { kind: 'must-have'; tag: string }>;
}
/** Opposites of favored personality/physical tags bite the roll. */
function clashingFor(favored: string[]): string[] {
  const out: string[] = [];
  for (const id of favored) { const opp = tagDef(id)?.opposite; if (opp) out.push(opp); }
  return out;
}
function buildSlots(ask: AskShape, n: number, ownedTags: Set<string>): QuestSlot[] {
  const clashing = clashingFor(ask.favoredTags);
  const slots: QuestSlot[] = [];
  let mustHaves = 0;
  for (let i = 0; i < n; i++) {
    const req = ask.slots[i] ?? { kind: 'open' as const };
    // keep a must-have only if (a) some merc can satisfy it AND (b) we haven't already used one
    // (≥2 hard requirements routinely make a quest unfillable — the AI over-requires). The fit
    // bonus still rewards bringing the right merc to an "open" slot.
    const keep = req.kind === 'must-have' && ownedTags.has(req.tag) && mustHaves < 1;
    if (keep) mustHaves++;
    slots.push({
      index: i,
      requirement: keep ? { kind: 'must-have', tag: (req as { tag: string }).tag } : { kind: 'open' },
      tested: { attribute: ask.attribute, favored: ask.favoredTags, clashing },
    });
  }
  return slots;
}
function ownedMercTags(state: GameState): Set<string> {
  const s = new Set<string>();
  for (const m of allMercs(state)) for (const t of m.tags) s.add(t.id);
  return s;
}

// ---- pursue (dispatch) ------------------------------------------------------
export async function pursueLead(state: GameState, ai: Narrator, lead: Lead): Promise<Quest> {
  const r = rngFrom(`${state.seed}:pursue:${lead.id}`);
  state.leads = state.leads.filter((l) => l.id !== lead.id);
  if (lead.chain.kind === 'starts-new') return genesisChainAndBeat(state, ai, r, lead);
  if (lead.chain.kind === 'continues') return continueChain(state, ai, r, lead, lead.chain.chainId);
  if (lead.chain.kind === 'personal') return genesisPersonalChain(state, ai, r, lead, lead.chain.mercId);
  return pursueOneOff(state, ai, r, lead);
}

async function pursueOneOff(state: GameState, ai: Narrator, r: Rng, lead: Lead): Promise<Quest> {
  const n = slotCountFor(lead, r);
  const V = questValue(lead.level, lead.rarity, n);
  const reward = generateReward(r, mk(state), state.cycle, { V, archetype: lead.archetype, isChain: false, level: lead.level });
  const seed = rewardEnvelope(reward);
  const card = await ai.cardAsk({ archetype: lead.archetype, location: lead.location, slotCount: n, rewardSeed: seed });
  const quest: Quest = {
    id: uid(state, 'quest'), leadId: lead.id, rarity: lead.rarity, level: lead.level, location: lead.location,
    archetype: lead.archetype, title: card.job.slice(0, 48), situation: card.situation, job: card.job,
    stakes: '', slots: buildSlots(card.ask, n, ownedMercTags(state)), threshold: thresholdFor(n, lead.level),
    reward, risky: isRisky(lead),
  };
  state.quests[quest.id] = quest;
  logLine(state, `Pursued: ${quest.job}`);
  return quest;
}

// ---- chains -----------------------------------------------------------------
async function genesisChainAndBeat(state: GameState, ai: Narrator, r: Rng, lead: Lead): Promise<Quest> {
  const n = slotCountFor(lead, r);
  const B = randInt(r, 2, 4);                       // expected beats
  const V = questValue(lead.level, lead.rarity, B * n);
  // engine rolls the FOCAL character first (role-agnostic), at the saga payoff value.
  // role 'npc' (not merc) while pending: not on the roster, not sendable — the finale decides their fate.
  const gen = generateCharacter(r, { targetValue: V, level: lead.level });
  const focal = characterFromGen(mk(state), gen, 'npc', state.cycle);
  focal.location = 'limbo';
  addCard(state, focal);
  const g = await ai.genesis({ focalTags: [tagLabels(focal.tags)], region: lead.location });
  const chain: Chain = {
    id: uid(state, 'chain'), title: g.title, hook: g.hook, bible: g.bible, direction: g.direction,
    focalCardIds: [focal.id], rarity: lead.rarity, level: lead.level, expectedBeats: B, beatsResolved: 0,
    mercCyclesSpent: 0, climaxTarget: B * n, state: 'live', log: [],
  };
  focal.chainIds.push(chain.id);
  state.chains[chain.id] = chain;
  logLine(state, `A new saga begins: "${chain.title}" — ${chain.hook}`);
  return makeBeatQuest(state, ai, r, lead, chain, 'Write beat 1 (the deniable opener).');
}

// A newly-joined merc's MAIN chain — a saga ABOUT them (focal = the existing merc).
// The finale develops THEM (renown / a scar / death), not a new acquisition.
async function genesisPersonalChain(state: GameState, ai: Narrator, r: Rng, lead: Lead, mercId: string): Promise<Quest> {
  state.pendingMainChains = state.pendingMainChains.filter((id) => id !== mercId);
  const merc = state.cards[mercId] as CharacterCard | undefined;
  if (!merc || merc.role !== 'merc') return pursueOneOff(state, ai, r, lead);
  const B = randInt(r, 2, 3);
  const g = await ai.genesis({ focalTags: [tagLabels(merc.tags)], region: lead.location, personal: true, name: merc.name });
  const chain: Chain = {
    id: uid(state, 'chain'), title: g.title, hook: g.hook, bible: g.bible, direction: g.direction,
    focalCardIds: [merc.id], rarity: lead.rarity, level: merc.level, expectedBeats: B, beatsResolved: 0,
    // personal beats run ~1 merc each (the anchor); gate on B*2 effort so the saga gets a few
    // beats to breathe before the finale rather than beat-1 → finale in one step.
    mercCyclesSpent: 0, climaxTarget: B * 2, state: 'live', log: [], personal: true,
  };
  merc.chainIds.push(chain.id);
  state.chains[chain.id] = chain;
  logLine(state, `${merc.name}'s own saga begins: "${chain.title}" — ${chain.hook}`);
  return makeBeatQuest(state, ai, r, lead, chain, 'Write beat 1 of this merc\'s personal story (the deniable opener).', false, merc.id);
}

async function continueChain(state: GameState, ai: Narrator, r: Rng, lead: Lead, chainId: string): Promise<Quest> {
  const chain = state.chains[chainId];
  if (!chain) return pursueOneOff(state, ai, r, lead);
  const atClimax = chain.mercCyclesSpent >= chain.climaxTarget;
  const constraint = atClimax
    ? 'This is the FINALE — write the climactic confrontation that resolves the saga.'
    : `Write beat ${chain.beatsResolved + 1}, continuing from what the company already knows.`;
  const anchor = chain.personal ? chain.focalCardIds[0] : undefined;
  return makeBeatQuest(state, ai, r, lead, chain, constraint, atClimax, anchor);
}

// chain beats are small encounters (1-2), not the genesis lead's archetype size; finales a touch bigger
function beatSlotCount(chain: Chain, r: Rng, isFinale: boolean): number {
  const rare = chain.rarity === 'rare' || chain.rarity === 'legendary';
  if (isFinale) return 2 + (rare ? 1 : 0);
  return 1 + (r() < 0.4 ? 1 : 0);
}
async function makeBeatQuest(state: GameState, ai: Narrator, r: Rng, lead: Lead, chain: Chain, constraint: string, isFinale = false, anchorMercId?: string): Promise<Quest> {
  const n = beatSlotCount(chain, r, isFinale);
  const beat = await ai.chainBeat({
    bible: chain.bible, chainState: chain.log.length ? chain.log.join(' ') : 'The saga is just beginning.',
    region: lead.location, slotCount: n, beatConstraint: constraint,
  });
  // intermediate beats pay a thin gold trickle; a (non-personal) finale pays the FOCAL character.
  // a PERSONAL finale develops the existing merc instead (handled at delivery) → no new unit.
  let reward: RewardBundle;
  if (isFinale && !chain.personal) {
    const focal = state.cards[chain.focalCardIds[0]] as CharacterCard | undefined;
    reward = { targetValue: focal?.value ?? questValue(chain.level, chain.rarity, 1), cards: focal ? [focal] : [], kindHint: 'recruit' };
  } else if (isFinale) {
    reward = { targetValue: 0, cards: [], kindHint: 'tag-stamp' };
  } else {
    const side = Math.round(BALANCE.vBase(chain.level) * 0.6);
    reward = generateReward(r, mk(state), state.cycle, { V: side, archetype: 'contract', isChain: false, level: chain.level });
  }
  // A non-personal finale offers MUTEX APPROACH-GROUPS (docs/QUESTS.md §9): the focal's
  // value/tags are fixed; the branch the player fills decides the KIND (welcome / cage / sell).
  let slots: QuestSlot[];
  let groups: ApproachGroup[] | undefined;
  if (isFinale && !chain.personal) {
    slots = []; groups = [];
    const fav = beat.ask.favoredTags;
    const clash = clashingFor(fav);
    const addGroup = (id: string, label: string, kind: 'recruit' | 'captive' | 'gold', attribute: Quest['slots'][number]['tested']['attribute'], thrMult: number) => {
      const index = slots.length;
      slots.push({ index, requirement: { kind: 'open' }, tested: { attribute, favored: fav, clashing: clash }, groupId: id });
      groups!.push({ id, label, rewardKind: kind, threshold: Math.max(2, Math.round(thresholdFor(1, chain.level) * thrMult)), slotIndices: [index] });
    };
    addGroup('winover', 'Win them over', 'recruit', 'charisma', 1.1);
    addGroup('subdue', 'Subdue them', 'captive', 'physical', 1.1);
    addGroup('ransom', 'Ransom / sell', 'gold', 'agility', 0.75);
  } else {
    slots = buildSlots(beat.ask, n, ownedMercTags(state));
    // a personal-chain beat pins its anchor: slot 0 must be the merc the saga is about,
    // and every OTHER slot is forced open (else a second must:<tag> only the anchor satisfies → unfillable).
    if (anchorMercId && slots[0]) {
      slots[0].requirement = { kind: 'must-be', cardId: anchorMercId };
      for (let i = 1; i < slots.length; i++) slots[i].requirement = { kind: 'open' };
    }
  }
  const quest: Quest = {
    id: uid(state, 'quest'), leadId: lead.id, rarity: chain.rarity, level: chain.level, location: lead.location,
    archetype: 'investigate', chainId: chain.id, beat: chain.beatsResolved + 1, finale: isFinale,
    title: chain.title, situation: beat.situation, job: beat.job, stakes: beat.newLayerRevealed,
    slots, groups, threshold: thresholdFor(n, chain.level),
    reward, risky: isFinale || chain.rarity === 'rare' || chain.rarity === 'legendary',
  };
  state.quests[quest.id] = quest;
  logLine(state, `${isFinale ? 'FINALE' : `Beat ${quest.beat}`} of "${chain.title}": ${quest.job}`);
  return quest;
}

// ---- assignment -------------------------------------------------------------
export function slotEligible(quest: Quest, slotIndex: number, merc: CharacterCard): boolean {
  const slot = quest.slots[slotIndex];
  if (!slot) return false;
  if (merc.location.startsWith('quest:') && merc.location !== `quest:${quest.id}`) return false;
  const req = slot.requirement;
  if (req.kind === 'must-be') return merc.id === req.cardId;
  if (req.kind === 'must-have') return merc.tags.some((t) => t.id === req.tag);
  return true;
}
export function assign(state: GameState, quest: Quest, slotIndex: number, mercId: string): boolean {
  const merc = state.cards[mercId] as CharacterCard | undefined;
  if (!merc || !slotEligible(quest, slotIndex, merc)) return false;
  // clear any prior slot this merc held on this quest
  for (const s of quest.slots) if (s.filledBy === mercId) s.filledBy = undefined;
  // mutex approach-groups: choosing a slot in one group frees every slot in the OTHER groups
  if (quest.groups) {
    const myGroup = quest.slots[slotIndex].groupId;
    for (const s of quest.slots) if (s.groupId !== myGroup && s.filledBy) { if (state.cards[s.filledBy]) state.cards[s.filledBy].location = 'roster'; s.filledBy = undefined; }
  }
  quest.slots[slotIndex].filledBy = mercId;
  merc.location = `quest:${quest.id}`;
  return true;
}

/** The approach-group the player has committed to (the one with a filled slot), if any. */
export function chosenGroup(quest: Quest): ApproachGroup | undefined {
  if (!quest.groups) return undefined;
  return quest.groups.find((g) => g.slotIndices.some((i) => quest.slots[i]?.filledBy));
}
function effectiveThreshold(quest: Quest): number {
  return chosenGroup(quest)?.threshold ?? quest.threshold;
}
export function unassign(state: GameState, quest: Quest, slotIndex: number): void {
  const id = quest.slots[slotIndex].filledBy;
  if (id && state.cards[id]) state.cards[id].location = 'roster';
  quest.slots[slotIndex].filledBy = undefined;
}
export function partyOf(state: GameState, quest: Quest): CharacterCard[] {
  return quest.slots.map((s) => s.filledBy && state.cards[s.filledBy]).filter(Boolean) as CharacterCard[];
}
export function questCoins(state: GameState, quest: Quest): number {
  const party = quest.slots.map((s) => (s.filledBy ? state.cards[s.filledBy] as CharacterCard : null));
  let total = 0;
  party.forEach((c, i) => { if (c) total += coinsForSlot(c, quest.slots[i]); });
  return total;
}
function coinsForSlot(c: CharacterCard, slot: QuestSlot): number {
  let coins = c.attrs[slot.tested.attribute];
  for (const f of slot.tested.favored) { const t = c.tags.find((x) => x.id === f); if (t) coins += BALANCE.favoredBonus(t.tier); }
  for (const inj of c.injuries) coins -= BALANCE.injuryPenalty(inj.tier);
  return Math.max(0, Math.round(coins));
}
export function questOdds(state: GameState, quest: Quest) {
  return estimateOdds(questCoins(state, quest), effectiveThreshold(quest));
}
export function isFilled(quest: Quest): boolean {
  // a grouped finale is "filled" once one approach-group's slots are all filled
  if (quest.groups) { const g = chosenGroup(quest); return !!g && g.slotIndices.every((i) => quest.slots[i]?.filledBy); }
  return quest.slots.every((s) => s.filledBy);
}

// ---- resolution -------------------------------------------------------------
export interface QuestResult {
  questId: string; outcome: Outcome; coins: number; heads: number; threshold: number;
  beforeText: string; afterText: string; delivered: string[]; chainDone?: boolean;
}

export async function resolveQuest(state: GameState, ai: Narrator, quest: Quest): Promise<QuestResult> {
  const r = rngFrom(`${state.seed}:resolve:${quest.id}:${state.cycle}`);
  const party = partyOf(state, quest);
  const coins = questCoins(state, quest);
  const threshold = effectiveThreshold(quest);
  const roll = resolveRoll(r, coins, threshold);
  const outcome = roll.outcome;

  // tags of the captive/recruit the bundle would deliver (for AI naming), if any & not failure
  const charCard = quest.reward.cards.find((c) => c.class === 'character') as CharacterCard | undefined;
  const captiveTags = charCard && outcome !== 'failure' ? tagLabels(charCard.tags) : undefined;

  // tell the narrator which finale approach was chosen so the prose matches the delivered kind
  const g = chosenGroup(quest);
  const approach = g
    ? g.rewardKind === 'recruit' ? 'win them over — persuade them to join the company'
      : g.rewardKind === 'captive' ? 'subdue them — overpower and take them captive'
      : 'ransom/sell — overpower them, then hand them off for coin'
    : undefined;

  const narr = await ai.outcome({
    situation: quest.situation, job: quest.job,
    party: party.map((m) => ({ name: m.name, tags: tagLabels(m.tags).slice(0, 4) })),
    outcome, captiveTags, risky: quest.risky, approach,
  });
  quest.outcome = outcome; quest.beforeText = narr.beforeRoll; quest.afterText = narr.afterRoll;

  const delivered = deliverReward(state, r, quest, outcome, narr.captive ?? null, narr.punishment ?? null, party);

  // free mercs + grant xp + level
  for (const m of party) {
    m.location = 'roster';
    grantXp(state, m, quest.level, outcome);
  }

  // chain bookkeeping
  let chainDone = false;
  if (quest.chainId) chainDone = recordBeat(state, quest, outcome, party.length);

  delete state.quests[quest.id];
  logLine(state, `${outcome.toUpperCase()} — ${quest.job}`);
  return { questId: quest.id, outcome, coins, heads: roll.heads, threshold, beforeText: narr.beforeRoll, afterText: narr.afterRoll, delivered, chainDone };
}

function grantXp(state: GameState, m: CharacterCard, level: number, outcome: Outcome): void {
  const gain = level * (outcome === 'success' ? 3 : outcome === 'partial' ? 1 : 0);
  if (!gain) return;
  m.xp += gain;
  const need = (lvl: number) => 6 + lvl * 4;
  const cap = levelCap(state, m.id);
  while (m.xp >= need(m.level) && m.level < cap) {
    m.xp -= need(m.level); m.level += 1;
    m.attrs = attrsAtLevel(m.base, m.talents, m.level);
  }
}

// ---- delivery ---------------------------------------------------------------
function deliverReward(state: GameState, r: Rng, quest: Quest, outcome: Outcome, aiCaptive: { name: string; who: string } | null, punishment: string | null, party: CharacterCard[]): string[] {
  const out: string[] = [];
  const bundle = quest.reward;
  if (outcome === 'failure') {
    if (quest.risky && punishment) {
      const victim = party[randInt(r, 0, Math.max(0, party.length - 1))];
      if (victim && r() < 0.6) { victim.injuries.push({ id: 'injury:wound', tier: randInt(r, 2, 4) }); out.push(`${victim.name} is wounded (${punishment})`); }
      else { const d = liabilityCard(mk(state), 'debt', Math.round(BALANCE.vBase(quest.level) * 0.5), state.cycle); d.location = 'roster'; addCard(state, d); out.push(`a debt: ${punishment}`); }
    } else out.push('nothing gained');
    // on a finale failure the focal character is lost; intermediate beats keep it safe
    if (quest.finale) handleFinaleFate(state, quest, 'failure', out, aiCaptive);
    return out;
  }

  if (quest.finale) { handleFinaleFate(state, quest, outcome, out, aiCaptive); return out; }

  const scale = outcome === 'partial' ? 0.5 : 1;
  let positive = 0;
  for (const card of bundle.cards) {
    if (card.class === 'gold') { const g = Math.round(card.value * scale); state.gold += g; positive += g; out.push(`${g} gold`); }
    // a person can't be halved: on a partial you keep the WHOLE unit (full value) — the
    // value is balanced back to V/2 by the saddling liability below.
    else if (card.class === 'character') { deliverCharacter(state, card, outcome, aiCaptive, out); positive += card.value; }
    else if (card.class === 'liability') { card.location = 'roster'; addCard(state, card); out.push(card.name); }
  }
  // partial balancing: bring delivered net to ~V/2 with a liability (saddle) or skip if already near
  if (outcome === 'partial') {
    const desired = bundle.targetValue * 0.5;
    const gap = positive - desired;
    if (gap > BALANCE.vBase(1) * 0.5) { const l = liabilityCard(mk(state), pickLiab(r), Math.round(gap), state.cycle); l.location = 'roster'; addCard(state, l); out.push(`(saddled with ${l.name.toLowerCase()})`); }
  }
  return out;
}

function deliverCharacter(state: GameState, card: CharacterCard, outcome: Outcome, aiCaptive: { name: string; who: string } | null, out: string[]): void {
  if (aiCaptive) { card.name = aiCaptive.name; card.who = aiCaptive.who; }
  // partial-wound a recruited character
  if (outcome === 'partial') card.injuries.push({ id: 'injury:wound', tier: 4 });
  // capture capacity gates captives
  if (card.role === 'captive') {
    const held = Object.values(state.cards).filter((c) => c.class === 'character' && (c as CharacterCard).role === 'captive').length;
    card.location = held < captiveCapacity(state) ? 'dungeon' : 'roster';
  } else card.location = 'roster';
  addCard(state, card);
  out.push(`${card.role === 'captive' ? 'captive' : 'recruit'}: ${card.name}${outcome === 'partial' ? ' (wounded)' : ''}`);
}

function handleFinaleFate(state: GameState, quest: Quest, outcome: Outcome, out: string[], aiCaptive: { name: string; who: string } | null): void {
  const chain = quest.chainId ? state.chains[quest.chainId] : undefined;
  const focal = chain && state.cards[chain.focalCardIds[0]] as CharacterCard | undefined;
  if (!focal) return;
  if (chain?.personal) { handlePersonalFinale(focal, outcome, out); return; }
  if (aiCaptive) { focal.name = aiCaptive.name; focal.who = aiCaptive.who; }
  // the chosen approach-group decides the KIND; the roll decides whether you get it clean
  const kind = chosenGroup(quest)?.rewardKind ?? 'recruit';
  if (kind === 'gold') {
    const g = Math.round(focal.value * (outcome === 'success' ? 1 : outcome === 'partial' ? 0.5 : 0));
    focal.role = 'dead'; focal.location = 'limbo'; // sold/handed off — leaves your story
    if (g > 0) { state.gold += g; out.push(`${focal.name} sold off for ${g} gold`); } else out.push(`the deal collapses — ${focal.name} slips away with nothing gained`);
    return;
  }
  if (outcome === 'failure') { focal.role = 'dead'; focal.location = 'limbo'; out.push(`${focal.name} is lost — the saga ends in grief`); return; }
  const wounded = outcome === 'partial';
  if (wounded) focal.injuries.push({ id: 'injury:wound', tier: 3 });
  if (kind === 'captive') {
    const held = captives(state).length;
    focal.role = 'captive'; focal.location = held < captiveCapacity(state) ? 'dungeon' : 'roster';
    out.push(`${focal.name} is taken captive${wounded ? ', wounded' : ''}`);
  } else { // recruit
    focal.role = 'merc'; focal.location = 'roster'; queueMainChain(state, focal.id);
    out.push(`${focal.name} joins the company${wounded ? ', but wounded' : ''}`);
  }
}

// A personal finale develops the EXISTING merc, gated by the roll (docs/QUESTS.md §6).
function handlePersonalFinale(merc: CharacterCard, outcome: Outcome, out: string[]): void {
  if (outcome === 'success') {
    // renown — a stamped tag + a surge of veterancy
    if (!merc.tags.some((t) => t.id.startsWith('noto:'))) merc.tags.push({ id: 'noto:famous', tier: 2 });
    merc.xp += 30;
    out.push(`${merc.name} settles their past and earns renown (famous)`);
  } else if (outcome === 'partial') {
    if (!merc.tags.some((t) => t.id === 'phys:scarred')) merc.tags.push({ id: 'phys:scarred', tier: 3 });
    merc.xp += 10;
    out.push(`${merc.name} closes the chapter, but it leaves a scar`);
  } else {
    // the gamble of a personal saga: it can claim them
    merc.role = 'dead'; merc.location = 'limbo';
    out.push(`${merc.name}'s past catches them at last — they are lost`);
  }
}

const pickLiab = (r: Rng) => (['evidence', 'mess', 'debt'] as const)[randInt(r, 0, 2)];

// ---- chain post-beat bookkeeping -------------------------------------------
function recordBeat(state: GameState, quest: Quest, outcome: Outcome, partySize: number): boolean {
  const chain = quest.chainId ? state.chains[quest.chainId] : undefined;
  if (!chain) return false;
  chain.mercCyclesSpent += partySize;        // climax gate = effort, not value
  chain.beatsResolved += 1;
  chain.log.push(`Beat ${chain.beatsResolved} (${outcome}): ${quest.stakes || quest.job}`);
  if (quest.finale) { chain.state = 'done'; return true; }
  if (chain.mercCyclesSpent >= chain.climaxTarget) chain.state = 'finale-ready';
  return false;
}
