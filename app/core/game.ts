// Game orchestration — the one command API both front-ends (CLI + GUI) drive.
// UI-agnostic: every player action is a method here; nothing in core knows about
// terminals or React. The cycle: Fort Phase (pursue/assign/build, no rolls) →
// endDay → Resolution Phase (all quests roll + narrate at once) → restock → next cycle.

import type { GameState, Lead, Quest, CharacterCard, Room } from './types.js';
import { rngFrom } from './rng.js';
import { initGame, addCard, uid, allMercs, availableMercs, captives, logLine } from './state.js';
import { makeNarrator, type Narrator, type NarratorOptions } from './ai.js';
import { stockLeadBoard, queueMainChain } from './leads.js';
import {
  pursueLead, assign as assignSlot, unassign as unassignSlot, resolveQuest,
  questOdds, questCoins, isFilled, partyOf, slotEligible, type QuestResult,
} from './quest.js';
import {
  ROOM_TYPES, buildableRoomTypes, excavate, excavateCost, digFloor, digFloorCost,
  globalPrestige, comfortFor, levelCap, captiveCapacity, leadTier, canRecruit,
} from './fort.js';
import { BALANCE } from './economy.js';

export interface GameEngineOptions extends NarratorOptions { seed?: string }

export class GameEngine {
  readonly state: GameState;
  readonly ai: Narrator;
  constructor(state: GameState, ai: Narrator) { this.state = state; this.ai = ai; }

  static async create(opts: GameEngineOptions = {}): Promise<GameEngine> {
    const state = initGame(opts.seed);
    const ai = await makeNarrator(opts);
    const eng = new GameEngine(state, ai);
    stockLeadBoard(state, rngFrom(`${state.seed}:board:${state.cycle}`));
    return eng;
  }

  // ---- read-side -------------------------------------------------------------
  get cycle() { return this.state.cycle; }
  get gold() { return this.state.gold; }
  get phase() { return this.state.phase; }
  leads(): Lead[] { return this.state.leads; }
  activeQuests(): Quest[] { return Object.values(this.state.quests); }
  mercs(): CharacterCard[] { return allMercs(this.state); }
  freeMercs(): CharacterCard[] { return availableMercs(this.state); }
  captives(): CharacterCard[] { return captives(this.state); }
  rooms(): Room[] { return Object.values(this.state.rooms); }
  globalPrestige(): number { return globalPrestige(this.state); }
  comfort(mercId: string): number { return comfortFor(this.state, mercId); }
  levelCap(mercId: string): number { return levelCap(this.state, mercId); }
  captiveCapacity(): number { return captiveCapacity(this.state); }
  leadTier(): number { return leadTier(this.state); }
  liabilities() { return Object.values(this.state.cards).filter((c) => c.class === 'liability'); }

  questView(q: Quest) {
    return {
      quest: q, coins: questCoins(this.state, q), odds: questOdds(this.state, q),
      filled: isFilled(q), party: partyOf(this.state, q),
    };
  }
  eligibleMercs(q: Quest, slotIndex: number): CharacterCard[] {
    return this.freeMercs().filter((m) => slotEligible(q, slotIndex, m));
  }

  // ---- Fort Phase actions ----------------------------------------------------
  async pursue(leadId: string): Promise<Quest | { error: string }> {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) return { error: 'lead not found' };
    if (this.freeMercs().length === 0) return { error: 'no free mercs to send' };
    return pursueLead(this.state, this.ai, lead);
  }
  assign(questId: string, slotIndex: number, mercId: string): boolean {
    const q = this.state.quests[questId];
    return q ? assignSlot(this.state, q, slotIndex, mercId) : false;
  }
  unassign(questId: string, slotIndex: number): void {
    const q = this.state.quests[questId];
    if (q) unassignSlot(this.state, q, slotIndex);
  }

  buildRoom(cellIdx: number, typeKey: string): { error: string } | { ok: true } {
    const type = ROOM_TYPES[typeKey];
    if (!type) return { error: 'unknown room type' };
    if (!buildableRoomTypes(this.state).includes(type)) return { error: `${type.name} not unlocked yet` };
    const cell = this.state.cells.find((c) => c.idx === cellIdx);
    if (!cell || cell.roomId) return { error: 'cell unavailable' };
    if (this.state.gold < type.cost) return { error: 'not enough gold' };
    this.state.gold -= type.cost;
    const room: Room = { id: uid(this.state, 'room'), cellIdx, type: typeKey, displayCardIds: [] };
    this.state.rooms[room.id] = room; cell.roomId = room.id;
    logLine(this.state, `Built a ${type.name}.`);
    return { ok: true };
  }
  excavate(floor: number, dir: 1 | -1): { error: string } | { ok: true } {
    const cost = excavateCost(this.state, floor);
    if (this.state.gold < cost) return { error: 'not enough gold' };
    this.state.gold -= cost; excavate(this.state, floor, dir);
    logLine(this.state, `Excavated a new cell (−${cost}g).`);
    return { ok: true };
  }
  digFloor(dir: 1 | -1): { error: string } | { ok: true } {
    const cost = digFloorCost(this.state);
    if (this.state.gold < cost) return { error: 'not enough gold' };
    this.state.gold -= cost; digFloor(this.state, dir);
    logLine(this.state, `Dug a new floor (−${cost}g).`);
    return { ok: true };
  }
  setBedroomOwner(roomId: string, mercId: string): boolean {
    const room = this.state.rooms[roomId];
    if (!room || ROOM_TYPES[room.type]?.pool !== 'comfort') return false;
    room.ownerMercId = mercId; return true;
  }
  placeDisplay(roomId: string, cardId: string): boolean {
    const room = this.state.rooms[roomId];
    const card = this.state.cards[cardId];
    if (!room || !card) return false;
    const cap = ROOM_TYPES[room.type];
    if (room.displayCardIds.length >= cap.occupantSlots + cap.itemSlots) return false;
    // remove from any other room
    for (const rm of Object.values(this.state.rooms)) rm.displayCardIds = rm.displayCardIds.filter((id) => id !== cardId);
    room.displayCardIds.push(cardId);
    card.location = `room:${roomId}`;
    return true;
  }

  clearLiability(cardId: string): { error: string } | { ok: true } {
    const c = this.state.cards[cardId];
    if (!c || c.class !== 'liability') return { error: 'not a liability' };
    const cost = Math.abs(c.value);
    if (this.state.gold < cost) return { error: 'not enough gold' };
    this.state.gold -= cost; delete this.state.cards[cardId];
    logLine(this.state, `Cleared ${c.name} (−${cost}g).`);
    return { ok: true };
  }
  healInjury(mercId: string): { error: string } | { ok: true } {
    const m = this.state.cards[mercId] as CharacterCard | undefined;
    if (!m || m.class !== 'character' || !m.injuries.length) return { error: 'no injury' };
    const cost = Math.round(BALANCE.vBase(m.level) * 0.4);
    if (this.state.gold < cost) return { error: 'not enough gold' };
    this.state.gold -= cost; m.injuries.shift();
    logLine(this.state, `${m.name} is tended back to health (−${cost}g).`);
    return { ok: true };
  }
  ransomCaptive(cardId: string): { error: string } | { ok: true; gold: number } {
    const c = this.state.cards[cardId] as CharacterCard | undefined;
    if (!c || c.role !== 'captive') return { error: 'not a captive' };
    const gold = Math.round(c.value * 0.6);
    this.state.gold += gold; delete this.state.cards[cardId];
    logLine(this.state, `Ransomed ${c.name} for ${gold}g.`);
    return { ok: true, gold };
  }
  recruitCaptive(cardId: string): { error: string } | { ok: true } {
    if (!canRecruit(this.state)) return { error: 'need a Tavern to recruit' };
    const c = this.state.cards[cardId] as CharacterCard | undefined;
    if (!c || c.role !== 'captive') return { error: 'not a captive' };
    c.role = 'merc'; c.location = 'roster';
    queueMainChain(this.state, c.id);   // a recruited captive gets their own main chain
    logLine(this.state, `${c.name} takes the company's coin and joins.`);
    return { ok: true };
  }

  // ---- Resolution Phase ------------------------------------------------------
  /** End the day: roll + narrate every assigned quest, deliver, then advance the cycle. */
  async endDay(): Promise<QuestResult[]> {
    this.state.phase = 'resolution';
    // resolve all filled quests CONCURRENTLY (each has its own seed + reward; the human
    // shouldn't wait on N sequential AI calls). Order the reveal deterministically after.
    const filled = Object.values(this.state.quests).filter(isFilled);
    const settled = await Promise.all(filled.map((q) => resolveQuest(this.state, this.ai, q)));
    const results = settled.sort((a, b) => a.questId.localeCompare(b.questId));
    // return any mercs on unfilled quests, drop those quests (lead consumed)
    for (const quest of Object.values(this.state.quests)) {
      for (const s of quest.slots) if (s.filledBy && this.state.cards[s.filledBy]) this.state.cards[s.filledBy].location = 'roster';
      delete this.state.quests[quest.id];
    }
    this.state.cycle += 1;
    this.state.phase = 'fort';
    stockLeadBoard(this.state, rngFrom(`${this.state.seed}:board:${this.state.cycle}`));
    return results;
  }
}

export { addCard }; // re-export for front-ends that need low-level access
