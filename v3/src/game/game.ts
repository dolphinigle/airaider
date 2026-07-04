// The Game facade — GAME_STATE.md. One state object, one action surface, consumed
// identically by the CLI and the web GUI. Cycle: Fort phase (actions) → endCycle()
// (resolution in quest-id order → lore write-backs AFTER all resolutions → healing/
// decay/staging → lead grants/expiry).

import { Rng, type RngState } from '../engine/rng.js';
import {
  type Card, type Location, HELD, cardType, stackKind, isLiability, freshId, seedIdCounter,
  idCounter, mintStackable, sameStack,
} from '../engine/cards.js';
import { T, renderTags, parseAiTag, CONCEPT, CONCEPTS, GROUPS, validateTags, type Attribute, hasTag } from '../engine/tags.js';
import {
  newFort, ROOM_TYPE, ROOM_TYPES, buildCost, upgradeCost, renovateCost, ghUpgradeCost,
  excavateCost, maxSlotsAtTier, GH_THRESHOLDS, roomComfort, globalPrestige, capFromComfort,
  canSlot, defaultWants, breakDuration, marketSellRate, ransomRate, oraclePrecision,
  BUNK_ROSTER_SLOTS, BUNK_CAP_FLOOR, ENDGAME_BAND_LIFT,
  type FortState, type Room,
} from '../engine/fort.js';
import { infirmaryHealRate, healTick, rollInjuryTiers, payHealCost, REST_HEAL_PER_CYCLE, type InjuryBand } from '../engine/injury.js';
import { REGION, REGIONS } from '../engine/regions.js';
import {
  vBase, RARITY_MULT, splitOneOff, hireCost, RANSOM_RATE, SELL_RATE, type Rarity,
} from '../engine/economy.js';
import {
  rollFreshLead, starterPacket, huntLead, slotCount, rollDifficulty, oneOffValue,
  materializeReward, computeDelivery, defaultAsk, liabilityTriggers, LEAD_TTL,
  type Lead, type Quest, type QuestSlot,
} from '../engine/quests.js';
import {
  newChainEconomy, bankBeat, finaleReady, beatSideLoot, finaleFate, crystallize,
  type Chain, type Bible, type FinaleFate,
} from '../engine/chains.js';
import {
  newGraph, recall, renderDossier, decayPass, guardEdges, chronicleOf,
  type LoreGraph, type LoreNode,
} from '../engine/lore.js';
import { rollName, rollPlaceName } from '../engine/names.js';
import { questXp, grantXp, rollBase, rollGrowthLean, growToLevel } from '../engine/growth.js';
import { coins, slotThreshold, resolvePooled, odds, U, DIFFICULTY_ORDER, type SlotTest, type Outcome } from '../engine/roll.js';
import { sampleKeywords, sampleSeed } from '../ai/keywords.js';
import type { AiProvider, ResolveQuestInput, AskSlotOut } from '../ai/provider.js';

export interface LogEntry { cycle: number; kind: string; text: string; questId?: string }

// staging & lead lifetimes (🛠 one named constant per mechanism — no twin-path drift)
export const STAGE_TTL_HOLDING = 4;
export const STAGE_TTL_TAVERN = 5;
export const STAGE_TTL_FINALE = 6;
export const CONTINUATION_TTL_BONUS = 6;   // continuation leads outlive fresh ones a bit
export const QUEST_TTL = 10;               // pursued quests lapse after this many cycles (IMPL #1)
export const INTERROGATE_BASE = 30;        // 🛠 priced per-captive action
export const INTERROGATE_FRAC = 0.1;

export interface Staged { cardId: string; expiresAtCycle: number }

interface Resolution {
  quest: Quest;
  outcome: Outcome;
  delivery: ReturnType<typeof computeDelivery>;
  party: Card[];
  fate?: FinaleFate;   // finales: decided BEFORE narration (P11)
}
export interface Breaking { cardId: string; roomId: string; doneAtCycle: number }

export interface GameState {
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
  pendingEchoes: { focalId: string; atCycle: number }[];
  log: LogEntry[];
}

export class Game {
  state: GameState;
  rng: Rng;
  ai: AiProvider;

  constructor(ai: AiProvider, seed = 42, loaded?: GameState) {
    this.ai = ai;
    if (loaded) {
      this.state = loaded;
      this.state.pendingEchoes ??= [];   // saves from before the echo mechanic
      this.rng = new Rng(loaded.rngState);
      seedIdCounter(loaded.idCounter);
    } else {
      this.rng = new Rng(seed);
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
    this.state.idCounter = idCounter();
    return JSON.stringify(this.state);
  }
  static load(ai: AiProvider, json: string): Game {
    const st = JSON.parse(json) as GameState;
    return new Game(ai, st.seed, st);
  }

  // ---- bootstrap (day 0) ------------------------------------------------------------------

  private bootstrap() {
    // starting gold + two starter mercs
    this.addCard(mintStackable('gold', 300));
    for (let i = 0; i < 2; i++) {
      const merc = this.freshCharacter('merc', 2, 60, 'forests');
      merc.location = HELD('roster');
      this.addCard(merc);
      this.ensureLoreNode(merc);
    }
    this.log('start', 'The fort stands: your bedroom, a bunkroom, and the Great Hall. Build a Map room to find work.');
  }

  private freshCharacter(role: 'merc' | 'captive' | 'npc', level: number, targetV: number, region: string): Card {
    const races = Object.entries(REGION[region]!.poolWeights) as [string, number][];
    const race = this.rng.weighted(races);
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
    card.tags.push(T(this.rng.pick(skillWords), this.rng.range(1, 3)));
    card.tags.push(T(this.rng.pick(persWords)));
    card.tags.push(T(this.rng.pick(genders)));
    card.name = rollName(this.rng, race);
    return card;
  }

  // ---- helpers -------------------------------------------------------------------------------

  card(id: string): Card | undefined { return this.state.cards.find(c => c.id === id) }
  private addCard(c: Card) {
    if (cardType(c) === 'stackable') {
      const mate = this.state.cards.find(x => sameStack(x, c) && x.location.kind === 'held');
      if (mate) { mate.qty = (mate.qty ?? 0) + (c.qty ?? 0); return }
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
  dossier(id: string): string {
    const card = this.card(id);
    return renderDossier(this.state.lore, id, this.state.cycle,
      card?.character ? { who: card.character.who, quirks: card.character.quirks } : undefined);
  }
  chronicle(id: string) { return chronicleOf(this.state.lore, id) }

  // ---- fort actions ---------------------------------------------------------------------------

  buildableTypes(): { type: string; cost: number; reason?: string }[] {
    const t = this.state.fort.ghTier;
    return ROOM_TYPES.filter(rt => rt.id !== 'great-hall').map(rt => {
      const cost = buildCost(rt);
      let reason: string | undefined;
      if (rt.ghTier > t) reason = `needs Great Hall T${rt.ghTier}`;
      else if (rt.region && rt.roomKind === 'scouting') {
        const region = REGION[rt.region]!;
        if (region.prev && !this.state.unlockedRegions.includes(region.prev)) reason = `open ${region.prev} first`;
      } else if (rt.region && rt.roomKind !== 'scouting' && !this.state.unlockedRegions.includes(rt.region)) {
        reason = `open ${rt.region} first`;
      }
      if (!reason && !rt.multiBuild && this.hasRoom(rt.id)) reason = 'already built';
      if (!reason && cost > this.gold()) reason = `costs ${cost}g`;
      return { type: rt.id, cost, reason };
    });
  }

  freeCells(): { floor: number; col: number }[] {
    return this.state.fort.cells.filter(cell =>
      !this.state.fort.rooms.some(r => r.cell.floor === cell.floor && r.cell.col === cell.col));
  }

  build(typeId: string, ownerId?: string): { ok: boolean; msg: string } {
    const rt = ROOM_TYPE[typeId];
    if (!rt) return { ok: false, msg: 'no such room type' };
    const check = this.buildableTypes().find(b => b.type === typeId);
    if (check?.reason) return { ok: false, msg: check.reason };
    if (rt.benefit === 'cap') {
      const owner = ownerId ?? 'you';
      if (this.state.fort.rooms.some(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === owner))
        return { ok: false, msg: 'they already have a bedroom — deepen it instead' };
      if (owner !== 'you' && this.card(owner)?.character?.role !== 'merc')
        return { ok: false, msg: 'bedrooms belong to mercs (or you)' };
    }
    const cell = this.freeCells()[0];
    if (!cell) return { ok: false, msg: 'no free cells — excavate first' };
    if (!this.spendGold(buildCost(rt))) return { ok: false, msg: 'not enough gold' };
    const room: Room = {
      id: freshId('room-'), type: typeId, cell,
      slots: [], wants: defaultWants(rt, null), style: null,
      ownerId: rt.benefit === 'cap' ? (ownerId ?? 'you') : undefined,
    };
    this.state.fort.rooms.push(room);
    this.onBuilt(rt, room);
    return { ok: true, msg: `${rt.name} built (${room.id})` };
  }

  private onBuilt(rt: (typeof ROOM_TYPES)[number], room: Room) {
    this.log('build', `Built: ${rt.name}`);
    if (rt.unlocks === 'quests') {
      // day-0 bootstrap: the Map room grants a visible starter lead packet
      this.state.leads.push(...starterPacket(this.rng, this.state.cycle, () => freshId('lead-')));
      this.log('leads', 'The map table fills: first leads are in.');
    }
    if (rt.roomKind === 'scouting' && rt.region) {
      if (!this.state.unlockedRegions.includes(rt.region)) this.state.unlockedRegions.push(rt.region);
      const band = REGION[rt.region]!.levelBand;
      this.state.leads.push(huntLead(rt.region, band[0], () => freshId('lead-')));
      this.log('region', `${REGION[rt.region]!.name} is open. Its lead-hunt is on the board.`);
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

  upgrade(roomId: string): { ok: boolean; msg: string } {
    const room = this.room(roomId);
    if (!room) return { ok: false, msg: 'no such room' };
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' && rt.species !== 'capacity') return { ok: false, msg: 'not upgradable (pure gate)' };
    if (rt.species === 'capacity') return { ok: false, msg: 'cells are not upgraded — build more' };
    const max = maxSlotsAtTier(this.state.fort.ghTier);
    if (room.slots.length >= max) return { ok: false, msg: `slot depth gated: max ${max} at GH T${this.state.fort.ghTier}` };
    const cost = upgradeCost(rt, room.slots.length);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    room.slots.push(null);
    return { ok: true, msg: `${rt.name} upgraded: ${room.slots.length} slot(s)` };
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
    const wants = out.wants.map(w => parseAiTag(w)?.concept).filter((c): c is string => !!c && !!CONCEPT[c]);
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
    const need = GH_THRESHOLDS[to];
    if (!need) return { ok: false, msg: 'the Great Hall is at its final tier' };
    const p = this.prestige();
    if (p < need) return { ok: false, msg: `needs prestige ${need} (have ${p.toFixed(0)})` };
    const cost = ghUpgradeCost(to);
    if (!this.spendGold(cost)) return { ok: false, msg: `costs ${cost}g` };
    this.state.fort.ghTier = to;
    this.log('gh', `The Great Hall rises to Tier ${to}. New works are unlocked.`);
    return { ok: true, msg: `Great Hall → T${to}` };
  }

  slot(roomId: string, slotIdx: number, cardId: string): { ok: boolean; msg: string } {
    const room = this.room(roomId);
    const card = this.card(cardId);
    if (!room || !card) return { ok: false, msg: 'not found' };
    if (slotIdx < 0 || slotIdx >= room.slots.length) return { ok: false, msg: 'no such slot' };
    if (room.slots[slotIdx]) return { ok: false, msg: 'slot occupied' };
    if (card.location.kind === 'quest') return { ok: false, msg: 'on a quest' };
    if (card.location.kind === 'held' && card.location.state !== 'roster' && card.location.state !== 'inventory')
      return { ok: false, msg: 'not yours yet (staged/limbo cards must be accepted first)' };
    const rt = ROOM_TYPE[room.type]!;
    if (rt.benefit === 'break') {
      // torture chamber racks take RAW captives (the breaking pipe, §21.4)
      if (card.character?.role !== 'captive') return { ok: false, msg: 'racks take captives' };
      if (hasTag(card.tags, 'obedient')) return { ok: false, msg: 'already broken' };
      this.unslotCard(card);
      room.slots[slotIdx] = card.id;
      card.location = { kind: 'room', roomId, slot: slotIdx };
      const done = this.state.cycle + breakDuration(this.comfort(room));
      this.state.breaking.push({ cardId: card.id, roomId, doneAtCycle: done });
      return { ok: true, msg: `${card.name} on the rack — breaks c${done}` };
    }
    if (!canSlot(room, card)) return { ok: false, msg: 'slot refuses it (mercs never staff rooms; captives must be obedient)' };
    this.unslotCard(card);
    room.slots[slotIdx] = card.id;
    card.location = { kind: 'room', roomId, slot: slotIdx };
    return { ok: true, msg: `${card.name} → ${rt.name} #${slotIdx}` };
  }

  unslot(roomId: string, slotIdx: number): { ok: boolean; msg: string } {
    const room = this.room(roomId);
    if (!room || !room.slots[slotIdx]) return { ok: false, msg: 'nothing there' };
    const card = this.card(room.slots[slotIdx]!);
    room.slots[slotIdx] = null;
    if (card) {
      card.location = HELD(cardType(card) === 'relic' ? 'inventory' : 'roster');
      this.state.breaking = this.state.breaking.filter(b => b.cardId !== card.id);
    }
    return { ok: true, msg: 'freed' };
  }

  private unslotCard(card: Card) {
    if (card.location.kind === 'room') {
      const r = this.room(card.location.roomId);
      if (r) r.slots[card.location.slot] = null;
    }
  }

  setFocus(mercId: string, focus: Card['character'] extends undefined ? never : NonNullable<Card['character']>['focus']): { ok: boolean; msg: string } {
    const c = this.card(mercId);
    if (!c?.character) return { ok: false, msg: 'no such merc' };
    c.character.focus = focus;
    return { ok: true, msg: `${c.name}'s training focus set` };
  }

  // ---- staging (GAME_STATE §6) -------------------------------------------------------------------

  hire(cardId: string): { ok: boolean; msg: string } {
    if (!this.hasRoom('tavern')) return { ok: false, msg: 'build a Tavern' };
    const staged = this.state.tavern.find(s => s.cardId === cardId);
    const card = this.card(cardId);
    if (!staged || !card) return { ok: false, msg: 'not at the tavern' };
    if (this.roster().length >= this.rosterCapacity()) return { ok: false, msg: 'no roster room (bedrooms grant +1 each)' };
    const cost = hireCost(card.value);
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
    const staged = this.state.holding.find(s => s.cardId === cardId);
    const card = this.card(cardId);
    if (!staged || !card) return { ok: false, msg: 'not in holding' };
    if (!this.hasRoom('dungeon')) return { ok: false, msg: 'build a Dungeon' };
    if (this.captives().length >= this.captiveCapacity()) return { ok: false, msg: 'cells are full — build more' };
    card.location = HELD('roster');
    this.state.holding = this.state.holding.filter(s => s.cardId !== cardId);
    this.ensureLoreNode(card);
    return { ok: true, msg: `${card.name} moved to the cells` };
  }

  /** ownership boundary — dispositions apply only to cards that are actually YOURS
   *  (staged candidates must be accepted; limbo focals aren't yours until delivered) */
  private isOwned(card: Card): boolean {
    if (card.location.kind === 'room') return true;
    if (card.location.kind === 'quest') return true;
    return card.location.kind === 'held' &&
      (card.location.state === 'roster' || card.location.state === 'inventory');
  }

  ransom(captiveId: string): { ok: boolean; msg: string } {
    const card = this.card(captiveId);
    if (card?.character?.role !== 'captive') return { ok: false, msg: 'not a captive' };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours to ransom (accept them first)' };
    const office = this.state.fort.rooms.find(r => r.type === 'ransom-office');
    const rate = office ? ransomRate(this.comfort(office)) : RANSOM_RATE;
    const pay = Math.round(card.value * rate);
    this.unslotCard(card);
    card.location = HELD('lore');   // gone from play, alive in the world
    this.state.holding = this.state.holding.filter(s => s.cardId !== captiveId);
    this.state.breaking = this.state.breaking.filter(b => b.cardId !== captiveId);
    this.addGold(pay);
    this.log('ransom', `${card.name} ransomed for ${pay}g.`);
    return { ok: true, msg: `+${pay}g` };
  }

  sell(relicId: string): { ok: boolean; msg: string } {
    const card = this.card(relicId);
    if (!card || cardType(card) !== 'relic') return { ok: false, msg: 'not a relic' };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours to sell' };
    const market = this.state.fort.rooms.find(r => r.type === 'market');
    const rate = market ? marketSellRate(this.comfort(market)) : SELL_RATE;
    const pay = Math.round(card.value * rate);
    this.unslotCard(card);
    this.state.cards = this.state.cards.filter(c => c.id !== relicId);
    this.addGold(pay);
    return { ok: true, msg: `${card.name} sold: +${pay}g` };
  }

  payOffLiability(id: string): { ok: boolean; msg: string } {
    const card = this.card(id);
    if (!card || !isLiability(card)) return { ok: false, msg: 'not a liability' };
    const cost = Math.abs(card.value) * (card.qty ?? 1);
    if (!this.spendGold(Math.round(cost))) return { ok: false, msg: `costs ${Math.round(cost)}g to settle` };
    this.state.cards = this.state.cards.filter(c => c.id !== id);
    delete this.state.liabilityBirth[id];
    this.log('liability', `Settled: ${card.name} (${Math.round(cost)}g).`);
    return { ok: true, msg: 'settled' };
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
    const lead = rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), 'interrogation');
    // the room's comfort IS its benefit (FORT §5: leads only) — good comfort loosens tongues:
    // a chance to upgrade the lead's rarity one step
    if (this.rng.chance(Math.min(0.6, this.comfort(room) / 40))) {
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
      unlockedRegions: this.state.unlockedRegions.length ? this.state.unlockedRegions : ['forests'],
      ghTier: this.state.fort.ghTier,
      rosterLevels: this.roster().map(m => m.character!.level),
      hasDungeon: this.hasRoom('dungeon'),
    };
  }

  visibleLeads(): Lead[] {
    if (!this.hasRoom('map-room')) return [];
    // the day-0 packet is visible pre-Lead-room; the full board needs the Lead room
    if (!this.hasRoom('lead-room')) return this.state.leads.filter(l => l.source === 'starter');
    return this.state.leads;
  }

  async pursue(leadId: string): Promise<{ ok: boolean; msg: string; questId?: string }> {
    const lead = this.visibleLeads().find(l => l.id === leadId);
    if (!lead) return { ok: false, msg: 'no such lead' };
    if (lead.expiresAtCycle === null && this.state.quests.some(q => q.leadId === lead.id && q.state === 'open'))
      return { ok: false, msg: 'that hunt is already underway' };
    if (lead.chainInfo.kind === 'continues') {
      const chain = this.state.chains.find(c => c.id === (lead.chainInfo as { chainId: string }).chainId);
      if (!chain || (chain.state !== 'active' && chain.state !== 'finale-pending')) {
        this.state.leads = this.state.leads.filter(l => l.id !== leadId);
        return { ok: false, msg: 'that story has already ended — the lead is stale' };
      }
      if (this.state.quests.some(q => q.chainId === chain.id && q.state === 'open'))
        return { ok: false, msg: 'that story already has an open quest' };
    }
    if (lead.expiresAtCycle === null) {
      // standing hunts track the roster: re-level into the region band at pursue time
      const band = REGION[lead.region]!.levelBand;
      const levels = this.roster().map(m => m.character!.level);
      const median = levels.length ? [...levels].sort((a, b) => a - b)[Math.floor(levels.length / 2)]! : band[0];
      lead.level = Math.max(band[0], Math.min(band[1], median));
    }
    let quest: Quest;
    if (lead.chainInfo.kind === 'continues') {
      const chain = this.state.chains.find(c => c.id === (lead.chainInfo as { chainId: string }).chainId);
      if (!chain) return { ok: false, msg: 'the chain is gone' };
      quest = await this.generateChainBeat(chain, lead);
    } else if (lead.chainInfo.kind === 'starts-new') {
      quest = await this.generateGenesis(lead);
    } else {
      quest = await this.generateOneOff(lead);
    }
    this.state.quests.push(quest);
    // consume the lead — only repeatable HUNTS stay standing after pursue
    if (lead.expiresAtCycle !== null || lead.archetype !== 'lead-hunt') {
      this.state.leads = this.state.leads.filter(l => l.id !== leadId);
    }
    return { ok: true, msg: `Quest generated: ${quest.title}`, questId: quest.id };
  }

  private buildSlots(n: number, level: number, rarity: Rarity, archetype: Lead['archetype'], ask: AskSlotOut[],
    maxDifficulty?: 'standard' | 'hard'): QuestSlot[] {
    const CAP_ORDER = DIFFICULTY_ORDER;
    const slots: QuestSlot[] = [];
    for (let i = 0; i < n; i++) {
      const a = ask[i];
      let test: SlotTest;
      let difficulty = rollDifficulty(this.rng, rarity);
      if (maxDifficulty && CAP_ORDER.indexOf(difficulty) > CAP_ORDER.indexOf(maxDifficulty))
        difficulty = maxDifficulty;
      if (a) {
        const attrs = [a.attribute, a.extraAttribute].filter((x): x is string => !!x)
          .map(x => x.toLowerCase()).filter(x => ['str', 'dex', 'int', 'cha', 'con'].includes(x)) as Attribute[];
        const favored = a.favored.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c);
        const clashing = a.clashing.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c);
        test = { attributes: attrs.length ? attrs : ['str'], favored, clashing, difficulty, level };
      } else {
        const d = defaultAsk(this.rng, archetype);
        test = { attributes: d.attrs, favored: d.favored, clashing: d.clashing, difficulty, level };
      }
      slots.push({ requirement: { kind: 'open' }, test, filledBy: null });
    }
    return slots;
  }

  private async generateOneOff(lead: Lead): Promise<Quest> {
    const n = slotCount(this.rng, lead.archetype, lead.rarity);
    const V = oneOffValue(this.rng, lead.level, lead.rarity, n);
    const specs = splitOneOff(this.rng, V, lead.archetype);
    let rewardCards: Card[];
    const returning = lead.focalId ? this.card(lead.focalId) : undefined;
    if (returning?.character) {
      // an echo rescue: the reward IS the person who was left behind (same card, same memories)
      returning.location = HELD('limbo');
      rewardCards = [returning];
    } else {
      rewardCards = specs.flatMap(s => s.kind !== 'gold' && s.kind !== 'lead'
        ? materializeReward(this.rng, s, lead.level, lead.region) : []);
    }
    const framed = rewardCards.find(c => c.character);
    const out = await this.ai.writeQuest({
      kind: 'one-off', archetype: lead.archetype, region: REGION[lead.region]!.name,
      regionSeed: REGION[lead.region]!.seed, level: lead.level, rarity: lead.rarity,
      slotCount: n, rewardEnvelope: specs.map(s => s.kind).join(' + '),
      keywords: sampleKeywords(this.rng),
      placeNameSuggestions: [rollPlaceName(this.rng), rollPlaceName(this.rng)],
      rosterNames: this.roster().map(m => m.name),
      framedCharacter: framed ? { name: framed.name, tags: renderTags(framed.tags) } : null,
    });
    return {
      id: freshId('q'), leadId: lead.id, title: out.title, situation: out.situation, job: out.job,
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
      region: this.state.unlockedRegions[0] ?? 'forests', archetype: 'investigate',
      chainInfo: { kind: 'starts-new' }, expiresAtCycle: this.state.cycle + LEAD_TTL * 3,
      source: 'personal', title: `${merc.name}'s past stirs`,
    };
    lead.personalMercId = merc.id;
    this.state.leads.push(lead);
  }

  private async generateGenesis(lead: Lead): Promise<Quest> {
    const personalMercId = lead.personalMercId;
    const returning = lead.focalId ? this.card(lead.focalId) : undefined;
    // a sequel whose focal has since become YOUR merc = a personal chain about them
    // (never yank a roster merc into limbo)
    const returningIsMerc = returning?.character?.role === 'merc';
    const isPersonal = (!!personalMercId && !!this.card(personalMercId)) || returningIsMerc;
    const eco = newChainEconomy(this.rng, lead.level, lead.rarity);
    // the focal character FIRST (§2): personal → the merc; sequel → the SLIPPED focal
    // returns from the lore graph (§21-4a); else generated at the payoff value
    let focal: Card;
    if (returningIsMerc) focal = returning!;
    else if (isPersonal) focal = this.card(personalMercId!)!;
    else if (returning) {
      focal = returning;
      focal.location = HELD('limbo');   // back within reach, not yet owned
    } else {
      const spec = { kind: 'captive' as const, value: eco.focalTarget };
      focal = materializeReward(this.rng, spec, lead.level, lead.region)[0]!;
      focal.location = HELD('limbo');
      this.addCard(focal);
    }
    this.ensureLoreNode(focal);
    // lore retrieval: recall around the focal + wildcards from the known cast
    const wildcardPool = Object.values(this.state.lore.nodes).filter(n => n.active && n.id !== focal.id).map(n => n.id);
    const wildcards = this.rng.shuffle([...wildcardPool]).slice(0, 3);
    const candidates = recall(this.state.lore, focal.id, this.state.cycle, wildcards);
    const picked = candidates.length > 8
      ? await this.ai.select({ purpose: 'who needs full dossiers for this saga', candidates: candidates.map(c => ({ id: c.node.id, name: c.node.name, blurb: c.node.blurb, relationPhrase: c.relationPhrase })), max: 4 })
      : candidates.map(c => c.node.id);
    const slate = candidates.map(c => ({
      id: c.node.id, name: c.node.name, blurb: c.node.blurb, relationPhrase: c.relationPhrase,
      dossier: picked.includes(c.node.id) ? this.dossier(c.node.id) : undefined,
    }));
    const races = Object.entries(REGION[lead.region]!.poolWeights) as [string, number][];
    const assignedNames = Array.from({ length: 4 }, () => rollName(this.rng, this.rng.weighted(races)));
    const g = await this.ai.genesis({
      seed: sampleSeed(this.rng), keywords: sampleKeywords(this.rng),
      region: REGION[lead.region]!.name, regionSeed: REGION[lead.region]!.seed,
      rarity: lead.rarity, stakes: lead.rarity === 'rare' ? 'high' : lead.rarity === 'uncommon' ? 'mid' : 'low',
      focal: { name: focal.name, tags: renderTags(focal.tags), dossier: this.dossier(focal.id), isExistingMerc: isPersonal },
      kind: isPersonal ? 'development' : eco.kind, twist: eco.twist,
      slate, assignedNames,
    });
    // persist write-back (guarded); new places become lore nodes
    for (const p of g.newPlaces.slice(0, 3)) {
      const id = freshId('place-');
      this.state.lore.nodes[id] = { id, kind: 'place', name: p.name || rollPlaceName(this.rng), blurb: p.blurb.slice(0, 120), identity: p.blurb.slice(0, 120), active: true, createdCycle: this.state.cycle };
    }
    guardEdges(this.state.lore, g.newEdges, this.state.cycle, () => freshId('e'));
    // §4b NAME GUARD: the AI never invents character names. Known-cast entries keep their
    // lore-node names; NEW cast entries must use engine-rolled names (assignedNames, in order).
    {
      const legal = new Set<string>([focal.name, ...slate.map(x => x.name), ...assignedNames]);
      let next = 0;
      for (const member of g.cast) {
        if (member.loreId && this.state.lore.nodes[member.loreId]) {
          member.name = this.state.lore.nodes[member.loreId]!.name;   // canon wins
        } else if (!legal.has(member.name)) {
          const replacement = assignedNames[next++] ?? rollName(this.rng, this.rng.weighted(races));
          member.name = replacement;
        }
      }
    }
    const chain: Chain = {
      id: freshId('chain-'), kind: eco.kind, isPersonal, focalId: focal.id,
      level: lead.level, rarity: lead.rarity, region: lead.region,
      expectedBeats: eco.beats, payoff: eco.payoff, bank: 0, cyclesSpent: 0,
      failureBudget: eco.failureBudget, failures: 0, beatIndex: 0,
      bible: {
        title: g.title, kernel: g.kernel, cast: g.cast, situation: g.situation, goal: g.goal,
        arc: g.arc, twist: g.twistReveal, tensions: g.tensions, openDirections: g.openDirections,
      },
      story: { currentSituation: g.situation, knownToPlayer: [], openThreads: [...g.openDirections], actorStates: {} },
      state: 'active', createdCycle: this.state.cycle,
    };
    focal.chainIds.push(chain.id);
    this.state.chains.push(chain);
    this.log('chain', `A story begins: ${g.title}`);
    return this.generateChainBeat(chain, lead);
  }

  private async generateChainBeat(chain: Chain, lead: Lead): Promise<Quest> {
    const isFinale = finaleReady(chain);
    // finales are ALWAYS one slot per approach (3 mutex plans); the AI is told the true shape
    const n = isFinale ? 3 : slotCount(this.rng, 'investigate', chain.rarity);
    const sideLootV = isFinale ? 0 : beatSideLoot(this.rng, chain);
    const focal = this.card(chain.focalId);
    const out = await this.ai.writeQuest({
      kind: isFinale ? 'finale' : 'beat', archetype: lead.archetype,
      region: REGION[chain.region]!.name, regionSeed: REGION[chain.region]!.seed,
      level: chain.level, rarity: chain.rarity, slotCount: n,
      rewardEnvelope: isFinale ? `the focal: ${chain.kind}` : 'side loot',
      keywords: [], placeNameSuggestions: [rollPlaceName(this.rng)],
      rosterNames: this.roster().map(m => m.name),
      lastBeatOutcome: chain.story.lastBeatOutcome,
      bible: chain.bible, storyState: chain.story,
      beatIndex: chain.beatIndex + 1, expectedBeats: chain.expectedBeats,
      focalName: focal?.name,
    });
    const specs = isFinale ? [] : [{ kind: 'gold' as const, value: sideLootV }];
    // beat pacing (QUESTS §8-B): beat 1 is the low-stakes CARE moment — cap its
    // difficulty at standard; beat 2 still escalating — cap at hard; then free
    const beatNo = chain.beatIndex + 1;
    const cap = isFinale ? undefined : beatNo <= 1 ? 'standard' as const : beatNo === 2 ? 'hard' as const : undefined;
    const quest: Quest = {
      id: freshId('q'), leadId: lead.id, title: out.title, situation: out.situation, job: out.job,
      level: chain.level, rarity: chain.rarity, region: chain.region, archetype: lead.archetype,
      chainId: chain.id, beatIndex: chain.beatIndex + 1, isFinale,
      slots: this.buildSlots(n, chain.level, chain.rarity, 'investigate', out.ask, cap),
      rewardSpecs: specs, rewardCards: [], sideLootV,
      state: 'open', createdCycle: this.state.cycle,
    };
    if (isFinale) {
      // mutex approach-groups (QUESTS §9). If the AI omitted them, synthesize the
      // canonical trio — a finale must NEVER be an unbranched multi-slot wall.
      const raw = out.approaches?.length ? out.approaches : [
        { label: 'Win them over', rewardKind: 'recruit', attribute: 'cha', favored: ['social'] },
        { label: 'Subdue them', rewardKind: 'captive', attribute: 'str', favored: ['melee', 'intimidation'] },
        { label: 'Cash out', rewardKind: 'gold', attribute: 'int', favored: ['roguery'] },
      ];
      quest.approaches = raw.map((a, i) => ({
        id: `g${i}`, label: a.label,
        rewardKind: (['recruit', 'captive', 'gold'].includes(a.rewardKind) ? a.rewardKind : 'gold') as 'recruit' | 'captive' | 'gold',
      }));
      // exactly ONE slot per approach — each group is its own manning plan
      const template = quest.slots[0]!;
      quest.slots = raw.map((a, i) => {
        const attr = a.attribute.toLowerCase();
        const attributes = (['str', 'dex', 'int', 'cha', 'con'].includes(attr) ? [attr] : template.test.attributes) as Attribute[];
        const favored = a.favored.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c);
        return {
          requirement: { kind: 'open' as const },
          test: { ...template.test, attributes, favored },
          groupId: `g${i}`, filledBy: null,
        };
      });
      chain.state = 'finale-pending';
    }
    return quest;
  }

  chooseApproach(questId: string, groupId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId);
    if (!q?.approaches) return { ok: false, msg: 'not a branched quest' };
    if (!q.approaches.some(a => a.id === groupId)) return { ok: false, msg: 'no such approach' };
    q.chosenApproach = groupId;
    for (const s of q.slots) if (s.groupId !== groupId && s.filledBy) this.doUnassign(q, s);
    return { ok: true, msg: `Approach: ${q.approaches.find(a => a.id === groupId)!.label}` };
  }

  // ---- assignment -----------------------------------------------------------------------------------

  assign(questId: string, slotIdx: number, mercId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId);
    const merc = this.card(mercId);
    if (!q || q.state !== 'open') return { ok: false, msg: 'no such quest' };
    if (!merc?.character || merc.character.role !== 'merc') return { ok: false, msg: 'only mercs quest' };
    const slot = q.slots[slotIdx];
    if (!slot) return { ok: false, msg: 'no such slot' };
    if (q.approaches && slot.groupId !== q.chosenApproach) return { ok: false, msg: 'pick that approach first' };
    if (slot.filledBy) return { ok: false, msg: 'slot filled' };
    if (merc.location.kind === 'quest') return { ok: false, msg: `${merc.name} is already committed` };
    if (slot.requirement.kind === 'must-be' && slot.requirement.cardId !== mercId) return { ok: false, msg: 'this slot names someone else' };
    if (slot.requirement.kind === 'must-have' && !hasTag(merc.tags, slot.requirement.concept)) return { ok: false, msg: `needs ${slot.requirement.concept}` };
    slot.filledBy = mercId;
    merc.location = { kind: 'quest', questId, slot: slotIdx };
    return { ok: true, msg: `${merc.name} → slot ${slotIdx}` };
  }

  unassign(questId: string, slotIdx: number): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId);
    const slot = q?.slots[slotIdx];
    if (!q || !slot?.filledBy) return { ok: false, msg: 'nothing to unassign' };
    this.doUnassign(q, slot);
    return { ok: true, msg: 'freed' };
  }
  private doUnassign(q: Quest, slot: QuestSlot) {
    const merc = slot.filledBy ? this.card(slot.filledBy) : null;
    if (merc) merc.location = HELD('roster');
    slot.filledBy = null;
  }

  /** raw odds — ALWAYS visible (QUESTS §3); the Oracle adds computed % */
  questOdds(questId: string): { coins: number; bar: number; success: number | null; partial: number | null; precision: 0 | 1 | 2 } {
    const q = this.state.quests.find(x => x.id === questId)!;
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    let totalCoins = 0, totalBar = 0;
    for (const s of active) {
      totalBar += slotThreshold(s.test);
      if (s.filledBy) totalCoins += coins(this.card(s.filledBy)!, s.test);
    }
    const oracle = this.state.fort.rooms.find(r => r.type === 'oracle');
    const precision = oraclePrecision(oracle ? this.comfort(oracle) : null);
    const o = precision > 0 ? odds(totalCoins, totalBar) : null;
    return { coins: totalCoins, bar: totalBar, success: o?.success ?? null, partial: o?.partialOrBetter ?? null, precision };
  }

  // ---- END CYCLE (the reckoning) -----------------------------------------------------------------------

  private cycleInFlight = false;

  async endCycle(): Promise<string[]> {
    // re-entrancy guard: a double END (GUI double-click) must never interleave
    if (this.cycleInFlight) return ['(the cycle is already resolving)'];
    this.cycleInFlight = true;
    try {
      return await this.doEndCycle();
    } finally {
      this.cycleInFlight = false;
    }
  }

  private async doEndCycle(): Promise<string[]> {
    const st = this.state;
    st.cycle += 1;
    const report: string[] = [];

    // 0) FLESH pass — every merc and staged person deserves a who/backstory/quirks
    // (attachment starts here; persisted per producer-2, so this runs at most once each)
    await this.fleshPass();

    // 1) resolve committed quests in quest-id order (all party slots filled = committed).
    // DELIVERY IS COMPUTED HERE, BEFORE THE AI NARRATES — including the finale's fate
    // (QUESTS §8 solidity rule b; the narrator must name what is actually delivered).
    const ready = st.quests.filter(q => q.state === 'open' && this.isCommitted(q)).sort((a, b) => a.id.localeCompare(b.id));
    const resolutions: Resolution[] = [];
    for (const q of ready) {
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      const party = active.map(s => this.card(s.filledBy!)!);
      const rolled = resolvePooled(this.rng, active.map(s => ({ unit: this.card(s.filledBy!)!, test: s.test })));
      const delivery = computeDelivery(this.rng, q, rolled.outcome);
      let fate: FinaleFate | undefined;
      if (q.isFinale && q.chainId) {
        const chain = st.chains.find(c => c.id === q.chainId);
        if (chain) fate = finaleFate(this.rng, chain, rolled.outcome);
      }
      resolutions.push({ quest: q, outcome: rolled.outcome, delivery, party, fate });
    }

    // 2) ONE batched AI call for all resolutions
    const aiInputs: ResolveQuestInput[] = resolutions.map(r => ({
      questId: r.quest.id, title: r.quest.title, situation: r.quest.situation, job: r.quest.job,
      rarity: r.quest.rarity, outcome: r.outcome,
      party: r.party.map(p => ({ id: p.id, name: p.name, tags: renderTags(p.tags), dossier: this.dossier(p.id) })),
      deliveredSummary: this.describeDelivery(r),
      deliveredCharacters: r.delivery.cards.filter(c => c.character).map(c => ({ id: c.id, name: c.name, tags: renderTags(c.tags) })),
      chainContext: r.quest.chainId ? {
        bible: this.state.chains.find(c => c.id === r.quest.chainId)?.bible,
        storyState: this.state.chains.find(c => c.id === r.quest.chainId)?.story,
        isFinale: !!r.quest.isFinale,
        fate: r.fate?.fate,
      } : undefined,
    }));
    const aiOuts = aiInputs.length ? await this.ai.resolve(aiInputs) : [];

    // 3) apply engine effects + AI outputs; lore write-backs AFTER all (collected first)
    const pendingEdges: { from: string; to: string; type: string; blurb: string; importance: number }[] = [];
    for (const r of resolutions) {
      const out = aiOuts.find(o => o.questId === r.quest.id);
      this.applyResolution(r, out, report, pendingEdges);
    }
    guardEdges(st.lore, pendingEdges, st.cycle, () => freshId('e'));

    // 4) housekeeping: healing, decay, staging timers, breaking
    this.personalChainDrip();
    this.healingPass();
    decayPass(st.lore, st.cycle);
    this.breakingPass(report);
    // staged people who time out LEAVE — to the lore graph, never orphaned in 'staged'
    for (const s of st.tavern.filter(s => s.expiresAtCycle <= st.cycle)) {
      const c = this.card(s.cardId);
      if (c) { this.ensureLoreNode(c); c.location = HELD('lore'); report.push(`${c.name} drank up and left the tavern.`) }
    }
    st.tavern = st.tavern.filter(s => s.expiresAtCycle > st.cycle);
    for (const s of st.holding.filter(s => s.expiresAtCycle <= st.cycle)) {
      const c = this.card(s.cardId);
      if (c) { this.ensureLoreNode(c); c.location = HELD('lore'); report.push(`${c?.name ?? 'a captive candidate'} slipped away from holding.`) }
    }
    st.holding = st.holding.filter(s => s.expiresAtCycle > st.cycle);

    // 5) pursued-quest expiry (impl ruling on QUESTS §10 🟡: TTL 10; a lapsed chain
    // beat respawns its continuation lead — the story waits, the quest doesn't)
    for (const q of st.quests.filter(q => q.state === 'open' && st.cycle - q.createdCycle >= QUEST_TTL)) {
      this.abandonQuest(q, report);
    }
    st.quests = st.quests.filter(q => q.state === 'open');

    // 5b) peril echoes come due: the person left behind resurfaces as a rescue lead
    for (const echo of [...st.pendingEchoes]) {
      if (st.cycle < echo.atCycle) continue;
      st.pendingEchoes = st.pendingEchoes.filter(e => e !== echo);
      const person = this.card(echo.focalId);
      if (!person?.character) continue;
      const lead = rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), 'reward');
      lead.archetype = 'rescue';
      lead.chainInfo = { kind: 'none' };
      lead.focalId = person.id;
      lead.title = `Word of ${person.name} reaches the gate`;
      st.leads.push(lead);
      report.push(`🕮 Word of ${person.name} — left behind, still out there. A rescue is possible.`);
    }

    // 6) lead expiry + liability triggers; standing hunts track the roster on the BOARD
    // too (a stale "L1" display misleads every consumer, human or bot)
    for (const l of st.leads) {
      if (l.expiresAtCycle === null && l.archetype === 'lead-hunt') {
        const band = REGION[l.region]!.levelBand;
        const levels = this.roster().map(m => m.character!.level);
        const median = levels.length ? [...levels].sort((a, b) => a - b)[Math.floor(levels.length / 2)]! : band[0];
        l.level = Math.max(band[0], Math.min(band[1], median));
      }
    }
    st.leads = st.leads.filter(l => l.expiresAtCycle === null || l.expiresAtCycle > st.cycle);
    for (const c of st.cards.filter(isLiability)) {
      const age = st.cycle - (st.liabilityBirth[c.id] ?? st.cycle);
      // one live collector per liability at a time
      if (st.leads.some(l => l.liabilityId === c.id) ||
        st.quests.some(q => q.state === 'open' && q.liabilityId === c.id)) continue;
      if (liabilityTriggers(this.rng, age)) {
        const lead = rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), 'collector');
        lead.chainInfo = { kind: 'none' };   // a collection job is a one-off — it must be able to SETTLE
        lead.title = `The ${c.name} surfaces — deal with it`;
        lead.liabilityId = c.id;
        st.leads.push(lead);
        st.liabilityBirth[c.id] = st.cycle; // reset the fuse
        report.push(`⚠ Your unresolved ${c.name} draws attention — a hostile lead appears (beat it to bury the matter).`);
      }
    }

    // keep the save lean: the log is a UI convenience, not the archive (lore is)
    if (st.log.length > 600) st.log = st.log.slice(-400);

    this.state.rngState = this.rng.state();
    this.state.idCounter = idCounter();
    return report;
  }

  abandon(questId: string): { ok: boolean; msg: string } {
    const q = this.state.quests.find(x => x.id === questId && x.state === 'open');
    if (!q) return { ok: false, msg: 'no such open quest' };
    this.abandonQuest(q, []);
    this.state.quests = this.state.quests.filter(x => x !== q);
    return { ok: true, msg: `${q.title} abandoned` };
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
        this.state.leads.push({
          id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
          archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: chain.story.currentSituation },
          expiresAtCycle: this.state.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
          title: `${chain.bible.title} — the thread dangles`,
        });
      }
    }
    report.push(`⏳ ${q.title} lapsed — the moment passed.`);
    this.log('expire', `${q.title} lapsed unpursued`);
  }

  private isCommitted(q: Quest): boolean {
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    return active.length > 0 && active.every(s => s.filledBy);   // ALL party slots filled (no partial sends)
  }

  private describeDelivery(r: Resolution): string {
    if (r.quest.isFinale && r.fate && r.quest.chainId) {
      const chain = this.state.chains.find(c => c.id === r.quest.chainId);
      const focal = chain ? this.card(chain.focalId) : undefined;
      const approach = r.quest.approaches?.find(a => a.id === r.quest.chosenApproach);
      const kind = approach?.rewardKind ?? 'gold';
      if (r.fate.fate === 'slipped') return `${focal?.name ?? 'the prize'} slips away — the season's bank is forfeit (a road back will exist)`;
      if (r.fate.fate === 'saddled') return `${focal?.name ?? 'the prize'} delivered as ${kind}, but lesser — the bargain came saddled`;
      return `${focal?.name ?? 'the prize'} delivered clean as ${kind}, with the season's surplus`;
    }
    if (r.outcome === 'failure') return 'they return with empty hands (say what was lost, in-fiction)';
    const bits = r.delivery.cards.map(c => c.character
      ? `${c.name}${c.character.role === 'captive' ? ' taken captive' : ' (may be persuaded to stay)'}`
      : c.qty ? `${c.qty} gold` : `the ${c.name}`);
    if (r.delivery.liability) bits.push(`a ${r.delivery.liability.name} left behind`);
    return bits.join(', ') || 'a token result';
  }

  private applyResolution(
    r: Resolution,
    out: { before: string; after: string; injuries: { characterId: string; band: InjuryBand }[]; fleshed: { characterId: string; who: string; backstory: string; quirks: string[] }[]; edges: { from: string; to: string; type: string; blurb: string; importance: number }[]; storyUpdate?: { currentSituation: string; newlyRevealed: string[]; openThreads: string[] } } | undefined,
    report: string[],
    pendingEdges: { from: string; to: string; type: string; blurb: string; importance: number }[],
  ) {
    const st = this.state;
    const q = r.quest;
    q.state = 'resolved';
    // the reveal reads: title → before → after → consequences (injuries/staging/etc.)
    const after: string[] = [];
    const say = (line: string) => after.push(line);
    // free the party + XP
    for (const p of r.party) {
      p.location = HELD('roster');
      const xp = questXp(p.character!.level, q.level, r.outcome);
      grantXp(p.character!, xp, this.capOf(p.id));
    }
    // injuries: AI-judged band → engine tiers (decoupled channel). ENGINE GUARD (§11/F5):
    // success → none; partial → at most a minor one; failure → any band
    for (const inj of out?.injuries ?? []) {
      let band = inj.band;
      if (r.outcome === 'success') band = 'none';
      else if (r.outcome === 'partial' && (band === 'med' || band === 'high')) band = 'low';
      if (band === 'none') continue;
      const merc = this.card(inj.characterId);
      if (!merc?.character || !r.party.includes(merc)) continue;
      const tiers = rollInjuryTiers(this.rng, band);
      merc.character.injuryTiers += tiers;
      say(`🩸 ${merc.name} is wounded (${band}, ${tiers} tiers).`);
    }
    // delivery
    for (const c of r.delivery.cards) {
      if (c.character) {
        const fleshed = out?.fleshed.find(f => f.characterId === c.id);
        if (fleshed) { c.character.who = fleshed.who; c.character.backstory = fleshed.backstory; c.character.quirks = fleshed.quirks }
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
          const pay = Math.round(c.value * 0.4);
          this.addGold(pay);
          this.ensureLoreNode(c);
          c.location = HELD('lore');
          if (!st.cards.includes(c)) st.cards.push(c);
          say(`🙏 ${c.name} thanks you and moves on: +${pay}g (build a Tavern to keep such people).`);
        }
      } else if (stackKind(c) === 'gold') {
        this.addGold(c.qty ?? 0);
      } else {
        c.location = HELD('inventory');
        if (!st.cards.includes(c)) st.cards.push(c);
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
        st.pendingEchoes.push({ focalId: lost.id, atCycle: st.cycle + this.rng.range(4, 8) });
        say(`🕮 ${lost.name} is left behind out there — word of them will come again.`);
      } else {
        st.cards = st.cards.filter(c => c.id !== lost.id);   // lost objects just vanish
      }
    }
    for (let i = 0; i < r.delivery.leadGrants; i++) {
      st.leads.push(rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), 'reward'));
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
      for (let i = 0; i < extra; i++) st.leads.push(rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), 'hunt'));
      say(`🧭 The sweep pays: ${extra} new lead(s).`);
    }
    // lore edges from the AI (validated later in one pass)
    pendingEdges.push(...(out?.edges ?? []));
    // narrate, then the consequences
    report.push(`— ${q.title} [${r.outcome.toUpperCase()}]`);
    if (out) { report.push(out.before); report.push(out.after) }
    report.push(...after);
    this.log('resolve', `${q.title}: ${r.outcome}`, q.id);
    // chain advancement
    if (q.chainId) this.advanceChain(q, r, out?.storyUpdate, report, r.fate);
    st.quests = st.quests.filter(x => x.state !== 'resolved');
  }

  private advanceChain(q: Quest, r: { outcome: Outcome; party: Card[] }, storyUpdate: { currentSituation: string; newlyRevealed: string[]; openThreads: string[] } | undefined, report: string[], fate?: FinaleFate) {
    const st = this.state;
    const chain = st.chains.find(c => c.id === q.chainId);
    if (!chain) return;
    if (storyUpdate) {
      chain.story.currentSituation = storyUpdate.currentSituation;
      chain.story.knownToPlayer.push(...storyUpdate.newlyRevealed);
      chain.story.openThreads = storyUpdate.openThreads.slice(0, 5);
    }
    chain.story.lastBeatOutcome =
      `beat ${q.beatIndex ?? chain.beatIndex} ended in ${r.outcome.toUpperCase()}: ${storyUpdate?.currentSituation ?? chain.story.currentSituation}`;
    if (q.isFinale) return this.settleFinale(q, chain, r, report, fate);
    bankBeat(chain, r.party.length, r.outcome, q.sideLootV ?? 0);
    const focal = this.card(chain.focalId);
    // continuation lead (cached title, zero AI)
    st.leads.push({
      id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
      archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: chain.story.currentSituation },
      expiresAtCycle: st.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
      title: `${chain.bible.title} — ${finaleReady(chain) ? 'the reckoning nears' : 'the story continues'}`,
    });
    report.push(`📖 ${chain.bible.title}: bank ${chain.bank.toFixed(0)}g of a ~${chain.payoff.toFixed(0)}g season${finaleReady(chain) ? ' — FINALE next' : ''}. ${focal?.name ?? ''} remains at the center.`);
  }

  private settleFinale(q: Quest, chain: Chain, r: { outcome: Outcome; party: Card[] }, report: string[], precomputed?: FinaleFate) {
    const st = this.state;
    const focal = this.card(chain.focalId);
    // the fate was decided BEFORE the AI narrated (P11); recompute only as a fallback
    const fate = precomputed ?? finaleFate(this.rng, chain, r.outcome);
    const approach = q.approaches?.find(a => a.id === q.chosenApproach);
    if (fate.fate === 'slipped') {
      // §21-4a: bank forfeit; focal slips away FOR NOW — alive in the lore graph, sequel lead back
      chain.state = 'slipped'; chain.bank = 0;
      if (focal && !chain.isPersonal) focal.location = HELD('lore');
      const sequel: Lead = {
        id: freshId('lead-'), rarity: fate.sequelRarity, level: chain.level, region: chain.region,
        archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
        source: 'sequel', title: `${focal?.name ?? 'They'} resurface, someday`,
        focalId: focal?.id,   // §21-4a: the road back leads to the SAME person
      };
      st.leads.push(sequel);
      report.push(`💨 ${focal?.name ?? 'The prize'} slips away — for now. The season's bank is forfeit. A road back exists (${fate.sequelRarity} sequel lead).`);
      return;
    }
    chain.state = 'done';
    const kind = approach?.rewardKind ?? (chain.kind === 'gold-hoard' ? 'gold' : chain.kind === 'recruit' ? 'recruit' : 'captive');
    if (chain.isPersonal) {
      // personal finale: bank crystallizes as gold + pinned CORE memory (no new character)
      const surplus = Math.round(chain.bank);
      this.addGold(surplus);
      guardEdges(st.lore, [{ from: chain.focalId, to: chain.focalId, type: 'scarred-by', blurb: `came through ${chain.bible.title}`, importance: 0.9 }], st.cycle, () => freshId('e'));
      report.push(`🏅 ${focal?.name}'s story closes: +${surplus}g and a mark that stays.`);
      return;
    }
    if (!focal) return;
    if (kind === 'gold') {
      // partial = the LESSER version of the kind (QUESTS §9) — a discounted cash-out
      const full = Math.round(focal.value + crystallize(chain, focal.value));
      const pay = fate.fate === 'saddled' ? Math.round(full * 0.7) : full;
      this.addGold(pay);
      focal.location = HELD('lore');
      report.push(`💰 The season crystallizes as coin: +${pay}g${fate.fate === 'saddled' ? ' (a hard bargain — the full price slipped away)' : ''}. ${focal.name} passes out of your hands.`);
    } else {
      focal.character!.role = kind === 'recruit' ? 'npc' : 'captive';
      if (kind === 'recruit') { st.tavern.push({ cardId: focal.id, expiresAtCycle: st.cycle + STAGE_TTL_FINALE }); focal.location = HELD('staged') }
      else { st.holding.push({ cardId: focal.id, expiresAtCycle: st.cycle + STAGE_TTL_FINALE }); focal.location = HELD('staged') }
      const surplus = crystallize(chain, focal.value);
      this.addGold(surplus);
      // a bank SHORT of the focal's value delivers them WITH A DEBT (QUESTS §5);
      // the AI-slips-for-salvage variant only when catastrophically thin
      // ONE debt rule: the shortfall between the bank and the focal's mark (QUESTS §5)
      const shortDebt = Math.max(0, Math.round(focal.value - chain.bank));
      if (shortDebt > 0) this.addCard(mintStackable('debt', shortDebt));
      report.push(`🎬 Finale: ${focal.name} is yours — ${kind}${shortDebt > 0 ? `, but the season ran short: a ${shortDebt}g debt comes with them` : ''}. Surplus: ${surplus}g.`);
    }
    guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `the saga ${chain.bible.title} ended ${fate.fate}`, importance: 0.85 }], st.cycle, () => freshId('e'));
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
      if (needs.length >= 5) break;   // batch cap per cycle
    }
    if (!needs.length) return;
    try {
      const outs = await this.ai.flesh(needs.map(c => ({
        characterId: c.id, name: c.name, tags: renderTags(c.tags),
        role: c.character!.role,
        context: c.character!.role === 'merc'
          ? (st.cycle <= 2 ? 'a founding member of the company' : 'a sword the company took on')
          : c.character!.role === 'captive' ? 'a captive taken on a quest' : 'someone the road washed up at the gate',
      })));
      for (const o of outs) {
        const card = this.card(o.characterId);
        if (!card?.character) continue;
        card.character.who = o.who || card.character.who;
        card.character.backstory = o.backstory || card.character.backstory;
        if (o.quirks.length) card.character.quirks = o.quirks.slice(0, 2);
        const node = this.state.lore.nodes[card.id];
        if (node && o.who) node.blurb = o.who.slice(0, 120);
      }
    } catch { /* flesh is flavor — never block the cycle on it */ }
  }

  /** founding mercs get their personal main chain too (hires get one at hire) */
  private personalChainDrip(): void {
    const st = this.state;
    if (!this.hasRoom('lead-room') || st.cycle < 10) return;
    // founders' sagas wait for a little slack (3rd merc or c25) — the opening belongs
    // to the bootstrap; the stories land when someone can be spared to live them
    if (this.roster().length < 3 && st.cycle < 25) return;
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
      report.push(`🔗 ${card.name} is broken — obedient, stationable.`);
    }
  }
}

export { renderTags, ROOM_TYPE, REGION, REGIONS, GH_THRESHOLDS, U };
