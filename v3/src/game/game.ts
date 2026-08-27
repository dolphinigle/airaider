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
  excavateCost, maxSlotsAtTier, GH_THRESHOLDS, roomComfort, globalPrestige, capFromComfort,
  canSlot, defaultWants, breakDuration, marketSellRate, ransomRate, oraclePrecision,
  BUNK_ROSTER_SLOTS, BUNK_CAP_FLOOR, ENDGAME_BAND_LIFT,
  type FortState, type Room,
} from '../engine/fort.js';
import { infirmaryHealRate, healTick, rollInjuryTiers, payHealCost, REST_HEAL_PER_CYCLE, type InjuryBand } from '../engine/injury.js';
import { REGION, REGIONS } from '../engine/regions.js';
import {
  vBase, RARITY_MULT, splitOneOff, hireCost, RANSOM_RATE, SELL_RATE, KEEP_THRESHOLD, cashValue,
  type Rarity, type Archetype, type RewardSpec,
} from '../engine/economy.js';
import {
  rollFreshLead, starterPacket, starterDripLead, STARTER_DRIP_COUNT, huntLead, recruitLead, slotCount, rollDifficulty, oneOffValue,
  materializeReward, computeDelivery, defaultAsk, liabilityTriggers, LEAD_TTL,
  type Lead, type Quest, type QuestSlot,
} from '../engine/quests.js';
import {
  newChainEconomy, bankBeat, finaleReady, beatSideLoot, finaleFate, crystallize,
  type Chain, type Bible, type FinaleFate,
} from '../engine/chains.js';
import {
  newGraph, recall, renderDossier, decayPass, guardEdges, chronicleOf, addEdge, touchEdge,
  type LoreGraph, type LoreNode,
} from '../engine/lore.js';
import { rollName, rollPlaceName } from '../engine/names.js';
import { hasClash, queryMatches } from '../engine/overlap.js';
import { questXp, grantXp, rollBase, rollGrowthLean, growToLevel } from '../engine/growth.js';
import { coins, slotThreshold, resolvePooled, odds, U, DIFFICULTY_ORDER, explainCoins, type SlotTest, type Outcome, type QuestRollResult } from '../engine/roll.js';
import { sampleKeywords, sampleKeywordsLight, sampleSeed, sampleOpening, sampleGravity, pickTone, sampleArrival, sampleTell } from '../ai/keywords.js';
import type { AiProvider, ResolveQuestInput, ResolveQuestOut, AskSlotOut, QuestWriteOut } from '../ai/provider.js';

export interface LogEntry { cycle: number; kind: string; text: string; questId?: string }

// ---- TEMPO G1: background work (the queue) ------------------------------------------------------
// A pursuit is a JOB. In-memory only — never in GameState, never saved (N3: work does not survive
// closing the game; the lead comes back). The UIs render the "being worked" state off jobs().
export type JobState = 'queued' | 'running' | 'done' | 'failed';
export interface Job { id: string; leadId: string; title: string; state: JobState; questId?: string; error?: string }
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
  pendingEchoes: { focalId: string; atCycle: number; lastSeen?: string }[];
  /** tier-up lines minted by ghUpgrade, surfaced in the NEXT endCycle report (judges read
   *  campaign reports and never saw a tier event — the log line alone was invisible) */
  pendingTierLines?: string[];
  /** early-game smoothing 2026-07-18: how many starterDripLead grants have fired (old saves
   *  default to done — no retro-drip mid-campaign) */
  starterDripped?: number;
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
    const gender = this.rng.pick(genders);
    card.tags.push(T(gender));
    card.name = rollName(this.rng, race, gender);   // gender first — name never contradicts it
    return card;
  }

  // ---- helpers -------------------------------------------------------------------------------

  card(id: string): Card | undefined { return this.state.cards.find(c => c.id === id) }
  private addCard(c: Card) {
    if (cardType(c) === 'stackable') {
      const mate = this.state.cards.find(x => sameStack(x, c) && x.location.kind === 'held');
      if (mate) { mate.qty = (mate.qty ?? 0) + (c.qty ?? 0); return }
    }
    // §4b corollary: two characters must never share a name — NOR near-twin names
    // (a colliding "Fenlin" merged NPC and soldier; twin focals "Pellthil"/"Pellnith" read as one saga twice)
    if (c.character) {
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
  menuGates(): { key: string; open: boolean; need: string }[] {
    const g = (key: string, roomId: string, orContent = false) =>
      ({ key, open: this.hasRoom(roomId) || orContent, need: ROOM_TYPE[roomId]!.name });
    return [
      g('quests', 'map-room'),
      // pre-Map-room the honest hint is the Map room (it brings the starter packet)
      g('leads', this.hasRoom('map-room') ? 'lead-room' : 'map-room', this.visibleLeads().length > 0),
      g('recruits', 'tavern', this.state.tavern.length > 0),
      g('staging', 'holding-cell', this.state.holding.length > 0),
      g('captives', 'dungeon', this.captives().length > 0),
      g('items', 'storage', this.state.cards.some(c => cardType(c) === 'relic' && c.location.kind === 'held')),
      g('lore', 'library'),
      // FORT §5 / LORE §5: the Chronicle room exposes the archive (was a dead building)
      g('chronicle', 'chronicle'),
      // ⚠ doc-gap: §12.1 gives Mess hall → merc list, but FOCUS is a base function (§12.1 CUT
      // note) and lives in the roster menu — always open pending a designer ruling.
      g('roster', 'mess-hall', true),
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
  dossier(id: string, opts?: { habits?: boolean }): string {
    const card = this.card(id);
    return renderDossier(this.state.lore, id, this.state.cycle,
      card?.character ? { who: card.character.who, quirks: opts?.habits === false ? undefined : card.character.quirks } : undefined);
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
    const need = GH_THRESHOLDS[to];
    if (need === undefined) return { ok: false, msg: 'the Great Hall is at its final tier' };  // (!need read a 0 threshold as "final")
    const p = this.prestige();
    if (p < need) return { ok: false, msg: `needs prestige ${need} (have ${p.toFixed(0)})` };
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
    const cost = staged.prepaid ? 0 : hireCost(card.value);   // a won finale focal is already paid for
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
    // STORY_ENGINE §5 trigger 2 (built 2026-07-10): a captive joining SOMETIMES stirs a story
    // (🛠 rate) — their past does not stay outside the walls
    if (this.rng.chance(0.3)) this.spawnPersonalChainLead(card);
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
    // owned captives AND holding candidates — "ransom now" is half the holding decision (§6)
    if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === captiveId))
      return { ok: false, msg: 'not yours to ransom (accept them first)' };
    const office = this.state.fort.rooms.find(r => r.type === 'ransom-office');
    const rate = office ? ransomRate(this.comfort(office)) : RANSOM_RATE;
    const pay = Math.round(cashValue(card.value) * rate);
    this.unslotCard(card);
    card.location = HELD('lore');   // gone from play, alive in the world
    this.state.holding = this.state.holding.filter(s => s.cardId !== captiveId);
    this.state.breaking = this.state.breaking.filter(b => b.cardId !== captiveId);
    this.addGold(pay);
    this.noteCustodyChange(card.id, `${card.name} was ransomed away — no longer in the company's hands`);
    this.log('ransom', `${card.name} ransomed for ${pay}g.`);
    return { ok: true, msg: `+${pay}g` };
  }

  sell(id: string): { ok: boolean; msg: string } {
    const card = this.card(id);
    if (!card) return { ok: false, msg: 'no such card' };
    // captive disposition (DESIGN/GAME_STATE §6): sell = the slaver's price, below ransom's —
    // no office needed, no questions asked; the person leaves play but lives on in lore
    if (card.character?.role === 'captive') {
      if (!this.isOwned(card) && !this.state.holding.some(s => s.cardId === id))
        return { ok: false, msg: 'not yours to sell (accept them first)' };
      const pay = Math.round(cashValue(card.value) * SELL_RATE);
      this.unslotCard(card);
      card.location = HELD('lore');
      this.state.holding = this.state.holding.filter(s => s.cardId !== id);
      this.state.breaking = this.state.breaking.filter(b => b.cardId !== id);
      this.addGold(pay);
      this.noteCustodyChange(card.id, `${card.name} was sold on — no longer in the company's hands`);
      this.log('sell', `${card.name} sold for ${pay}g.`);
      return { ok: true, msg: `+${pay}g` };
    }
    if (cardType(card) !== 'relic') return { ok: false, msg: 'not a relic or captive' };
    if (!this.isOwned(card)) return { ok: false, msg: 'not yours to sell' };
    const market = this.state.fort.rooms.find(r => r.type === 'market');
    const rate = market ? marketSellRate(this.comfort(market)) : SELL_RATE;
    const pay = Math.round(cashValue(card.value) * rate);
    this.unslotCard(card);
    this.state.cards = this.state.cards.filter(c => c.id !== id);
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
    const lead = this.freshLead('interrogation');
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
      recentArchetypes: this.recentLeadArchetypes,
    };
  }

  /** 🛠 2026-07-10 premise-variety: recently dealt archetypes rotate out of the next roll */
  private recentLeadArchetypes: Archetype[] = [];
  private freshLead(source: Lead['source']): Lead {
    const l = rollFreshLead(this.rng, this.leadCtx(), () => freshId('lead-'), source);
    this.recentLeadArchetypes.push(l.archetype);
    while (this.recentLeadArchetypes.length > 3) this.recentLeadArchetypes.shift();
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
    if (!this.hasRoom('lead-room'))
      return this.state.leads.filter(l => !paused(l) && (l.source === 'starter' || l.source === 'reward' || l.expiresAtCycle === null));
    return this.state.leads.filter(l => !paused(l));
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
  maxInFlight = Math.max(1, Number(process.env.AIRAIDER_MAX_INFLIGHT ?? 2) || 2);
  private jobRecs: JobRec[] = [];
  private jobSeq = 0;
  private inFlight = 0;
  /** leadIds a live job holds: not pursuable twice, and doEndCycle may not expire them (I6) */
  private reserved = new Set<string>();

  /** queued + running + recently finished, oldest first */
  jobs(): Job[] { return this.jobRecs.map(r => ({ ...r.job })) }

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
  private reservePursue(leadId: string): { msg: string; lead?: Lead } {
    const lead = this.visibleLeads().find(l => l.id === leadId);
    if (!lead) return { msg: 'no such lead' };
    if (this.reserved.has(lead.id)) return { msg: 'the map table is already working that lead' };
    if (lead.expiresAtCycle === null && this.state.quests.some(q => q.leadId === lead.id && q.state === 'open'))
      return { msg: 'that hunt is already underway' };
    if (lead.chainInfo.kind === 'continues') {
      const chain = this.state.chains.find(c => c.id === (lead.chainInfo as { chainId: string }).chainId);
      if (!chain || (chain.state !== 'active' && chain.state !== 'finale-pending')) {
        this.state.leads = this.state.leads.filter(l => l.id !== leadId);
        return { msg: 'that story has already ended — the lead is stale' };
      }
      if (this.state.quests.some(q => q.chainId === chain.id && q.state === 'open'))
        return { msg: 'that story already has an open quest' };
      // a beat still being WRITTEN is not yet an open quest — same guard, extended to work in
      // flight: two concurrent beats of one saga would race its bible and its beat cache
      if (this.state.leads.some(l => l.id !== lead.id && this.reserved.has(l.id)
        && l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === chain.id))
        return { msg: 'that story already has a step being written' };
    }
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
      if (!chain) return { ok: false, msg: 'the chain is gone' };
      quest = await this.generateChainBeat(chain, lead);
    } else if (lead.chainInfo.kind === 'starts-new') {
      quest = await this.generateGenesis(lead);
    } else {
      quest = await this.generateOneOff(lead);
    }
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
    const V = oneOffValue(this.rng, lead.level, lead.rarity, n);
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
        const race = this.rng.weighted(races);
        const gender = this.rng.pick(['male', 'female'] as const);
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
    const homeRegion = this.state.unlockedRegions[0] ?? 'forests';
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
    const gravity = sampleGravity(this.rng, lead.rarity, 'one-off');
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
      opening: !light && dealSpark && lead.source !== 'interrogation' ? { spark: opening.spark } : undefined,
      intake: light ? undefined : intake,
      gravity,
      placeNameSuggestions: light ? undefined : [this.freshPlaceName(lead.region), this.freshPlaceName(lead.region)],
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
    // maxInFlight (2) bounds the blindness to that many cards. Do not "fix" it with a lock.
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
        { gender: pendingIdentity.gender, presetName: pendingIdentity.name, race: pendingIdentity.race });
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
      this.unslotCard(focal);           // never leave a room slot pointing at them
      focal.location = HELD('limbo');   // back within reach, not yet owned
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
      // here, and their lore node (memories, ties) is remapped onto it so their story follows
      const loreCast = Object.values(this.state.lore.nodes).filter(nd =>
        nd.active && nd.kind === 'character' && !this.card(nd.id) && !this.state.cards.some(c => c.name === nd.name));
      if (loreCast.length >= 3 && this.knownCastSagas < this.state.fort.ghTier * 2 && this.rng.chance(0.35)) {
        const nd = this.rng.pick(loreCast);
        const text = `${nd.blurb} ${nd.identity}`;
        const race = /\belv|elf\b/i.test(text) ? 'elf' : /wolfman/i.test(text) ? 'wolfman'
          : /lizardman/i.test(text) ? 'lizardman' : /\bhuman\b/i.test(text) ? 'human' : undefined;
        const gender = /\b(she|her|hers|woman|widow|daughter|sister|bride)\b/i.test(text) ? 'female'
          : /\b(he|him|his|man|widower|son|brother)\b/i.test(text) ? 'male' : undefined;
        focal = materializeReward(this.rng, spec, lead.level, lead.region,
          { excludeConcepts: recentFocalTags, maxSkills: 2, presetName: nd.name, race, gender })[0]!;
        // remap the node onto the card id — edges and memories follow the person
        delete this.state.lore.nodes[nd.id];
        this.state.lore.nodes[focal.id] = { ...nd, id: focal.id, identity: renderTags(focal.tags) };
        for (const e of this.state.lore.edges) {
          if (e.from === nd.id) e.from = focal.id;
          if (e.to === nd.id) e.to = focal.id;
        }
        this.knownCastSagas++;
      } else {
        focal = materializeReward(this.rng, spec, lead.level, lead.region,
          { excludeConcepts: recentFocalTags, maxSkills: 2 })[0]!;
      }
      // focal names skipped the similarity guard — two unrelated "Hessossk Scale-of-Bronze"s
      // anchored back-to-back sagas
      for (let i = 0; i < 12 && this.nameTooSimilar(focal.name); i++) {
        focal.name = rollName(this.rng, focal.tags.find(t => ['elf', 'human', 'wolfman', 'lizardman'].includes(t.concept))?.concept ?? 'human',
          focal.tags.some(t => t.concept === 'female') ? 'female' : 'male');
      }
      focal.location = HELD('limbo');
      this.addCard(focal);
    }
    this.ensureLoreNode(focal);
    // soldiers are NEVER-USE data at genesis (their only rule is "context, never cast" — the
    // 32012 Koralla class shipped a merc as another saga's claimant anyway): don't deal them.
    // A 10+ roster otherwise floods the 14-entry slate. The focal stays (personal sagas).
    const slate = (await this.buildLoreSlate(focal.id, 'who needs full dossiers for this saga'))
      .filter(e => !e.companySoldier || e.id === focal.id);
    const races = Object.entries(REGION[lead.region]!.poolWeights) as [string, number][];
    // pre-rolled names for NEW cast — must not collide with any living character (§4b corollary).
    // Rolled WITH a sex and dealt annotated (a gender-opaque list once forced "Ithion" onto the
    // story's veiled lady because order was mandatory)
    const takenNames = new Set(this.state.cards.filter(x => x.character).map(x => x.name));
    const assigned: { name: string; gender: string }[] = [];
    for (let i = 0; assigned.length < 4 && i < 60; i++) {
      const gender = this.rng.pick(['male', 'female']);
      const n = rollName(this.rng, this.rng.weighted(races), gender);
      if (!takenNames.has(n) && !assigned.some(a => a.name === n) && !this.nameTooSimilar(n)) assigned.push({ name: n, gender });
    }
    const assignedNames = assigned.map(a => a.name);
    // coined cast never become cards — remember these names or their epithets get re-dealt
    // ("Ashveil" once stamped three unrelated clients across chains)
    // ⚠ TEMPO I3/I4: this block sits after an await (the slate), so it is the one NPC-name site
    // concurrency can reach. The roll-and-push is contiguous — no await between the
    // nameTooSimilar reads above and this push — so two genesis calls cannot deal the same name;
    // what stays exposed is the cast the MODEL returns while another genesis is still out.
    // Unhoistable (the names must be rolled against the slate); maxInFlight bounds it.
    this.recentNpcNames.push(...assignedNames);
    while (this.recentNpcNames.length > 60) this.recentNpcNames.shift();
    // the MODEL sees a LEAN fingerprint — showing full arc+tensions in avoid (round 5) made
    // avoid an ATTRACTOR per §8 (42022: seven token-to-oak-judgment sagas in one campaign);
    // the rich text feeds only the engine-side clash lint below
    const avoid = this.state.chains.slice(-5).map(c =>
      `${c.bible.title} — ${c.bible.kernel} (people: ${c.bible.cast.map(x => x.name).join(', ')})${c.state === 'done' || c.state === 'slipped' ? ` [SETTLED: ${c.story.currentSituation}]` : ''}`);
    const avoidRich = this.state.chains.slice(-5).map(c =>
      `${c.bible.title} — ${c.bible.kernel} (people: ${c.bible.cast.map(x => x.name).join(', ')}) ${c.bible.arc.join(' ')} ${c.bible.tensions.join(' ')}`);
    const genesisInput = {
      // labels are for the CARD writer, which is told what they mean; genesis is not, and its goal
      // sentence gets pasted into every briefing of the saga — so it receives the bare atoms.
      seed: sampleSeed(this.rng), keywords: sampleKeywords(this.rng).map(k => k.replace(/^[a-z-]+: /, '')),
      // most sagas must live AWAY from the landmark — omission beats the ignored "set it elsewhere"
      // nudge (both sagas of a read centered Thornhollow when genesis could always see it)
      location: this.locationLine(lead.region, this.rng.chance(0.15)),
      rarity: lead.rarity,
      stakes: (lead.rarity === 'rare' ? 'high' : lead.rarity === 'uncommon' ? 'mid' : 'low') as 'low' | 'mid' | 'high',
      tone: pickTone(this.rng),
      // empty avoid/slate omitted outright — a "[]" field with no rule referencing it is
      // parse-load for a cold model (context-free audit 2026-07-17)
      avoid: avoid.length ? avoid : undefined,
      // dossier only when it adds lines beyond the blurb — a byte-identical duplicate of tags
      // taught the writer nothing and broke "dossier outranks blurb" (context-free audit)
      focal: { id: focal.id, name: focal.name, tags: renderTags(focal.tags), dossier: (d => d.includes('\n') ? d : undefined)(this.dossier(focal.id)), isExistingMerc: isPersonal },
      kind: isPersonal ? 'development' : eco.kind, twist: eco.twist,
      expectedBeats: eco.beats,
      slate: slate.length ? slate : undefined,
      assignedNames: assigned.map(a => `${a.name} (${a.gender === 'female' ? 'a woman\'s name' : 'a man\'s name'})`),
    };
    let g = await this.ai.genesis(genesisInput);
    // names dealt by the dup-recast below — the NAME GUARD must honor them (34014/35015: the
    // guard clobbered a recast client with assignedNames[0], a name the model had already
    // spent on another cast member → one bible carried "Serrin" as client AND obstacle while
    // the bible TEXT kept the recast name; three sagas shipped with cast/text name splits)
    const recastNames: string[] = [];
    const recastMember = (d: { name: string; loreId?: string }, extraTaken: Iterable<string> = []) => {
      const taken = new Set([focal.name, ...slate.map(x => x.name), ...assignedNames, ...g.cast.map(x => x.name), ...extraTaken]);
      let fresh = rollName(this.rng, this.rng.weighted(races));
      for (let i = 0; i < 8 && taken.has(fresh); i++) fresh = rollName(this.rng, this.rng.weighted(races));
      const escRe2 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const forms = [...new Set([d.name, d.name.split(/\s+/)[0]!])];
      const ren = (s: string) => forms.reduce((t, f) => t.replace(new RegExp(`\\b${escRe2(f)}\\b`, 'g'), fresh), s);
      d.name = fresh;
      recastNames.push(fresh);
      delete d.loreId;
      g.title = ren(g.title); g.kernel = ren(g.kernel); g.situation = ren(g.situation); g.goal = ren(g.goal);
      g.arc = g.arc.map(ren); g.tensions = g.tensions.map(ren); g.openDirections = g.openDirections.map(ren);
      for (const m of g.cast) { m.who = ren(m.who); m.want = ren(m.want); }
    };
    // KERNEL-NOVELTY GUARD (mechanical — the `avoid` rule alone was ignored: two
    // reliquary-in-a-cellar sagas shipped in one campaign). 2026-07-12: the single unchecked
    // retry let a rejected premise ship anyway (twin custody-clause-at-a-ford sagas), and the
    // same-role guard trusted MODEL-reported loreId — a slate name copied without its id slipped
    // the fence (one coined foreman obstacled THREE concurrent sagas). Now: engine resolves
    // loreIds by name first, every draft is re-validated, and a stubborn duplicate cast member
    // is mechanically recast with a fresh name.
    {
      const stop = new Set('the,a,an,of,to,in,that,and,who,for,with,on,at,by,from,their,its,his,her,they,them,into,over,under'.split(','));
      const words = (s: string) => new Set((s.toLowerCase().match(/[a-z]+/g) ?? []).filter(w => w.length > 3 && !stop.has(w)));
      const loreByName = new Map(Object.values(this.state.lore.nodes)
        .filter(n => n.kind === 'character' && n.active).map(n => [n.name, n.id]));
      // canonical person key: lore id when the world knows them, else the bare name — BOTH the
      // live casts and the draft resolve the same way (a coined cast member has no loreId in her
      // OWN bible, so an id-only check let one heir client two sagas born a cycle apart)
      const personKey = (x: { name: string; loreId?: string }) => x.loreId ?? loreByName.get(x.name) ?? x.name;
      // live chains AND the last few closed ones — one rescue NPC once cliented 5 of 6
      // sequential sagas (the live-only window let her straight back in each time).
      // 2026-07-12: a LIVE chain's cast is fenced in EVERY role (one gaoler anchored all three
      // concurrent sagas by rotating roles); recent-closed chains fence same-role client/obstacle
      // only, so recurring faces stay possible over TIME, never in parallel.
      const liveAny = new Set(this.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending')
        .flatMap(c => c.bible.cast.map(personKey)));
      const recentRole = new Set(this.state.chains.slice(-3)
        .flatMap(c => c.bible.cast.filter(x => x.role === 'client' || x.role === 'obstacle').map(x => `${x.role}:${personKey(x)}`)));
      // keyed off the ROSTER, not the slate — soldiers are filtered out of the slate now, but
      // the model can still coin a matching name; the guard must keep seeing them
      const soldierKeys = new Set(this.roster().flatMap(m => [m.id, m.name]));
      const issues = (d: typeof g): { why: string; hard?: boolean; dup?: (typeof g.cast)[number] } | null => {
        for (const m of d.cast) if (!m.loreId && loreByName.has(m.name)) m.loreId = loreByName.get(m.name);
        // cast + coined places join the fingerprint — five deliver-to-a-ceremony sagas with the
        // same client shipped in one run while title+kernel alone stayed just under the bar
        const kw = words(`${d.title} ${d.kernel} ${d.arc.join(' ')} ${d.tensions.join(' ')} ${d.cast.map(c => `${c.name} ${c.role}`).join(' ')} ${d.newPlaces.map(p => p.name).join(' ')}`);
        const hits = (a: string) => { const aw = words(a); let hit = 0; kw.forEach(w => { if (aw.has(w)) hit++ }); return hit };
        // a LIVE chain's premise clashes at a LOWER bar — the player holds both stories at
        // once (37017: two concurrent foundling-escorted-to-a-rite sagas passed the ≥3 gate);
        // the LAST TWO chains regardless of state too (39019: back-to-back dies-forgery sagas)
        const liveFp = [...this.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending'), ...this.state.chains.slice(-2)]
          .map(c => `${c.bible.title} — ${c.bible.kernel} ${c.bible.arc.join(' ')} ${c.bible.tensions.join(' ')}`);
        const clash = avoidRich.find(a => hits(a) >= 3) ?? liveFp.find(a => hits(a) >= 2);
        // dispute-shape monoculture: campaigns converge on ONE settling device (42022: seven
        // oath/judgment-at-a-tree sagas). When the draft AND 2+ recent chains settle by
        // ceremony, the draft must settle its matter another way
        const CEREMONY = /\b(oath|judgment|judgement|pledge|rite|moot|ceremon|vow|sworn|swear)\w*/i;
        const draftCeremony = CEREMONY.test(`${d.kernel} ${d.arc.join(' ')} ${d.goal}`);
        const ceremonyMono = draftCeremony && avoidRich.filter(a => CEREMONY.test(a)).length >= 2;
        // custody-of-the-departed guard (mechanical — the outOfReach flag alone was ignored:
        // a SOLD entertainer re-appeared "in your cells" three cycles later)
        const goneNames = slate.filter(s => s.outOfReach).map(s => s.name);
        const custodyGhost = goneNames.find(n => d.situation.includes(n) && /\b(cells?|custody|held at the fort|in your keeping)\b/i.test(d.situation));
        // same-CLIENT guard (mechanical — the prompt rule alone left one lore client running
        // three sagas at once); obstacles too — concurrent sagas once shared ONE coined villain
        const clientDup = d.cast.find(x => x.name !== focal.name &&
          (liveAny.has(personKey(x)) || ((x.role === 'client' || x.role === 'obstacle') && recentRole.has(`${x.role}:${personKey(x)}`))));
        // the saga is ABOUT the focal — a bible without them strands the care beat, the role
        // forcing, and the finale steering (29010: a vault saga shipped with its focal absent)
        const focalMissing = !d.cast.some(x => x.loreId === focal.id || x.name === focal.name);
        // soldiers are CONTEXT, never cast (sole exception: the focal) — the prompt fence alone
        // let a merc ship as another saga's salvage claimant (32012: Koralla)
        const soldierCast = d.cast.find(x => x.loreId !== focal.id && x.name !== focal.name &&
          ((x.loreId && soldierKeys.has(x.loreId)) || soldierKeys.has(x.name)));
        // capitalization marks a proper noun only MID-sentence — a capitalized word opening a
        // step OR any later sentence is just English (guardlab 81001: sentence-start imperatives
        // "Beat", "Force", "Defeat" fired the conjured lint on 3/12 clean arcs — every false
        // fire burned ~74s and the seed)
        const properTokens = (s: string) => new Set(
          s.split(/(?<=[.!?])\s+/).flatMap(f => f.replace(/^\S+\s*/, '').match(/\b[A-Z][a-z]{2,}\b/g) ?? []));
        // parked arc: a place token staged in 3+ steps means the beats replay one scene
        // (34014: three defend-the-hearing-at-the-oak beats; the ARC SHAPE rule alone failed).
        const castTok = new Set(d.cast.flatMap(x => x.name.split(/\s+/)));
        const tokSteps = new Map<string, number>();
        for (const step of d.arc) for (const tok of properTokens(step))
          if (!castTok.has(tok)) tokSteps.set(tok, (tokSteps.get(tok) ?? 0) + 1);
        const parked = [...tokSteps.entries()].find(([, n]) => n >= 3)?.[0];
        // BIBLE.md: step 1 = take the job, goal NOT done here — "arc kills the beat-1-completes-
        // goal rewind" is a VALIDATED property that regressed (37017 predator, 38018 granary,
        // 41021 singer all delivered/settled at beat 1 and un-happened later)
        const step1Delivers = /\b(deliver|hand (over|him|her|it|the)|bring .{0,40} (back )?to\b|present .{0,30} to\b|return .{0,30} to\b)/i.test(d.arc[0] ?? '');
        // a step that merely confirms what is already known is a null job (41021: "establish
        // that the singer's binding feather is missing" — told to the player two cards earlier)
        const nullStep = d.arc.find(s => /\b(confirm|verify|establish that|learn whether)\b/i.test(s));
        // arc CONSERVATION (lab batch I: 6/8 arcs conjured places/tools mid-chain): a step's
        // ERRAND half may only touch what the goal, the cast, or an EARLIER step introduced —
        // the yield half is where new things legitimately enter (they are the discoveries)
        let conjured: string | undefined;
        for (let i = 1; i < d.arc.length && !conjured; i++) {
          const errand = d.arc[i]!.split('→')[0]!;
          const prior = `${d.goal} ${d.arc.slice(0, i).join(' ')}`;
          for (const tok of properTokens(errand)) {
            if (!castTok.has(tok) && !prior.includes(tok)) { conjured = `"${tok}" (step ${i + 1})`; break; }
          }
        }
        // settle-as-contracted (saga batch N: 3/8 arcs end off-contract — the hired thing lands
        // at a fresh meeting-place, not where the hire pointed). Where the hire delivers HOME —
        // to the fort/your keeping or to the client themselves — the last step must NOT invent an
        // external delivery-place: the fort is ground the company already holds (37017 quay for
        // "the fort's cells"). Detected only for home-delivery goals; external-destination hires
        // (a named tent/crossing the client sends the party to) are legitimate and left alone.
        const lastStep = d.arc[d.arc.length - 1] ?? '';
        const goalHome = /\b(fort|the cells|our (keeping|hall|cells))\b/i.test(d.goal)
          || /\b(to|into) (me|my (keeping|custody)|the client|us)\b/i.test(d.goal);
        // a FRESH place (not the goal, cast, or any earlier step — same conservation test as
        // conjured) that the last step delivers to, when the hire is a home-delivery: the model
        // invents a meeting-scene instead of coming back to the fort it already holds
        const priorToLast = `${d.goal} ${d.arc.slice(0, -1).join(' ')}`;
        const offContractPlace = goalHome && !/\bthe fort\b/i.test(lastStep)
          ? [...properTokens(lastStep)].find(t => !castTok.has(t) && !priorToLast.includes(t))
          : undefined;
        // a declared OBSTACLE that never appears in any arc step is dead cast — the chain has no
        // antagonist and reads as a pure fetch (batch R: Rolon, Celarion; batch Q: Oxel — all
        // absent). Checks NAME presence, not behaviour (a helpful "obstacle" is too fuzzy to lint).
        const obstacleEntry = d.cast.find(x => x.role === 'obstacle');
        const obstacleAbsent = obstacleEntry && !d.arc.some(s =>
          new RegExp(`\\b${obstacleEntry.name.split(/\s+/)[0]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(s));
        // dup RIDES ALONG whatever why is reported: an early clash-return once masked a live-chain
        // dup from the post-retry mechanical recast (29010: Nurisea obstacled two live sagas).
        // HARD defects (checked first so a soft return can't mask them) are the ones the engine
        // cannot ship: a bible without its focal, a custody contradiction, a premise the player
        // is already playing. Everything else is soft — log-only, see the verdict below.
        if (focalMissing) return { hard: true, why: `your rejected draft's cast is missing ${focal.name} — the saga is ABOUT them; they must be a cast entry`, dup: clientDup };
        if (custodyGhost) return { hard: true, why: `your rejected draft placed ${custodyGhost} in the company's custody — they passed out of the company's reach and are FREE in the world; rebuild the saga around where they actually stand`, dup: clientDup };
        if (clash) return { hard: true, why: `your rejected draft "${d.title} — ${d.kernel}" repeats "${clash}" — invent a saga with a different prize, a different wrongdoer, and different ground`, dup: clientDup };
        if (soldierCast) return { why: `your rejected draft cast ${soldierCast.name} — one of the company's own soldiers — as ${soldierCast.role}; soldiers are context, never cast members: a DIFFERENT person (or no one) takes that part`, dup: soldierCast };
        if (parked) return { why: `your rejected draft's arc parks at ${parked} — three or more steps stage the same ground; each step must move to NEW ground or a new claimant, and only the last may return to bring the matter to a head`, dup: clientDup };
        if (step1Delivers) return { why: `your rejected draft's FIRST arc step already performs a delivery or handover — the goal is NOT done at step 1: step 1 is taking the job plus a first leg of field work, and every delivery belongs to a later step`, dup: clientDup };
        if (nullStep) return { why: `your rejected draft's arc contains a step that merely confirms or verifies something ("${nullStep}") — a null job; every step must CHANGE the situation: gain ground, gain leverage, or raise the stakes`, dup: clientDup };
        // 91001 read: 5 mid-arc cards asserted artifacts no record established — every one
        // traceable to a step naming its OWN yield-object inside the errand half ("force a
        // bone map" before any map is known). stripYields can't fix an errand-half leak.
        const yieldInErrand = d.arc.map(s => {
          const halves = s.split(/→ yields:/i);
          if (halves.length < 2) return null;
          const toks = (t: string) => t.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 4);
          const err = new Set(toks(halves[0]!));
          const hits = [...new Set(toks(halves[1]!))].filter(w => err.has(w));
          return hits.length >= 2 ? hits.slice(0, 3).join(', ') : null;
        }).find(Boolean);
        if (yieldInErrand) return { why: `your rejected draft's arc names a step's own yield ("${yieldInErrand}") inside its errand half — the errand says only what the party DOES and where; the thing found lives after "→ yields:" alone`, dup: clientDup };
        if (ceremonyMono) return { why: `your rejected draft settles its matter with an oath, judgment, or ceremony — as the player's recent sagas already did; settle THIS matter by an entirely different means (a chase, a trade, a siege, an escape, a betrayal exposed, a debt collected — anything but a gathering that swears or judges)`, dup: clientDup };
        if (offContractPlace) return { why: `your rejected draft's LAST step delivers the hired thing to "${offContractPlace}" — but the hire brings it HOME (to the fort or to the client in hand); the closing step settles AT THE FORT the company already holds, never at a fresh meeting-place invented for the ending`, dup: clientDup };
        if (obstacleAbsent) return { why: `your rejected draft names ${obstacleEntry!.name} as the obstacle, yet they appear in NO arc step — the one who stands in the company's way must actively BLOCK a step (guard the prize, refuse, fight, or flee) in the step where the company meets them; write them into that step or give the part to no one`, dup: clientDup };
        if (conjured) return { why: `your rejected draft's arc touches ${conjured} that no earlier step yielded and neither the goal nor the cast introduced — every place, person, and tool a step USES must come from the hire, the goal, or an earlier step's yield (new things enter only as a step's own "→ yields:")`, dup: clientDup };
        if (clientDup) return { why: `your rejected draft used ${clientDup.name} as ${clientDup.role} — they are already bound up in a running saga; this one needs a different person in that part entirely`, dup: clientDup };
        return null;
      };
      // GUARD VERDICT (guardlab 81001/82001 + blind judge, 2026-07-17): re-rolling on
      // story-SHAPE defects is a net NEGATIVE — fire rate 58-67%, +50s mean latency, and
      // blind-judged re-rolled bibles LOST to the drafts they replaced 5/7 (mean 5.3 vs 6.0):
      // the avoid-note nag degrades the second draft ("never nag a cheap model"). Shape lints
      // are LOG-ONLY telemetry now. One re-roll survives for HARD defects the engine cannot
      // ship (focal missing breaks the care beat and finale steering; custody ghost contradicts
      // world state; premise clash duplicates a saga the player is playing — and burning the
      // seed IS the mechanical fix for a clash). Duplicate cast stays free: mechanical recast.
      let issue = issues(g);
      if (issue?.hard) {
        this.log('chain', `saga draft rejected (one re-roll): ${issue.why.slice(0, 120)}…`);
        g = await this.ai.genesis({ ...genesisInput, seed: sampleSeed(this.rng), avoid: [...avoid, issue.why] });
        issue = issues(g);
      }
      if (issue) this.log('chain', `saga draft lint (${issue.hard ? 'HARD, shipping anyway' : 'log-only'}): ${issue.why.slice(0, 120)}…`);
      // recast a stubborn duplicate client/obstacle as a FRESH person — a new villain beats
      // the same face fronting a fourth concurrent saga. The rename must be COMPLETE: reach
      // the bible's free text (33013: a recast client lived on in situation/arc and the beat
      // writer resurrected him) and never collide with a name already in play
      // (33013: the rolled name duplicated the same bible's client — two cast both "Rels")
      if (issue?.dup) recastMember(issue.dup);
    }
    // persist write-back (guarded); new places become lore nodes
    for (const p of g.newPlaces.slice(0, 3)) {
      const id = freshId('place-');
      // sentence-safe clamp — a blurb ending mid-phrase ("hidden in a ring of") invites later
      // writers to invent the completion; prefer a whole-sentence cut, else word-safe
      const b = p.blurb.length > 120
        ? (c => { const d = c.lastIndexOf('. '); return d > 60 ? c.slice(0, d + 1) : c.replace(/\s+\S*$/, '') })(p.blurb.slice(0, 120))
        : p.blurb;
      this.state.lore.nodes[id] = { id, kind: 'place', name: p.name || rollPlaceName(this.rng), blurb: b, identity: b, active: true, createdCycle: this.state.cycle };
    }
    guardEdges(this.state.lore, g.newEdges, this.state.cycle, () => freshId('e'));
    // §4b NAME GUARD: the AI never invents character names. Known-cast entries keep their
    // lore-node names; NEW cast entries must use engine-rolled names (assignedNames, in order).
    {
      const legal = new Set<string>([focal.name, ...slate.map(x => x.name), ...assignedNames, ...recastNames]);
      let next = 0;
      const ROLES = ['client', 'companion', 'quarry', 'obstacle', 'ally', 'prize'];
      for (const member of g.cast) {
        member.name = member.name.replace(/\s*\([^)]*\)\s*$/, '');   // strip echoed "(a man's name)" notes
        // role fence: genesis once leaked its input KIND ("captive") into cast.role, and the
        // beat writer branches the care beat on role — clamp out-of-enum values
        if (!ROLES.includes(member.role)) member.role = member.name === focal.name ? 'quarry' : 'ally';
        if (member.loreId === focal.id) {
          // the focal's id pins the focal's NAME (a bible once dressed the focal's entry in a
          // slate neighbor's name over the focal's own id — the wrong name was "legal", so it
          // slipped the fence and broke role forcing + introducedNames downstream)
          member.name = focal.name;
        } else if (member.loreId && this.state.lore.nodes[member.loreId]) {
          member.name = this.state.lore.nodes[member.loreId]!.name;   // canon wins
        } else if (!legal.has(member.name)) {
          // never deal a name another cast member already bears (the Serrin² collision)
          const used = (n: string | undefined) => !!n && g.cast.some(m2 => m2 !== member && m2.name === n);
          let replacement = assignedNames[next++];
          while (used(replacement)) replacement = assignedNames[next++];
          for (let i = 0; (!replacement || used(replacement)) && i < 8; i++) replacement = rollName(this.rng, this.rng.weighted(races));
          member.name = replacement ?? member.name;
        }
      }
    }
    // FINAL SWEEP (38018: Nurov obstacled TWO live sagas despite the liveAny fence — whatever
    // path admits them, no cast member may share a live chain's cast in ANY role, ever)
    {
      const liveChains = this.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending');
      const liveKeys = new Set(liveChains.flatMap(c => c.bible.cast.flatMap(m => [m.loreId ?? '', m.name].filter(Boolean))));
      for (const m of g.cast) {
        if (m.name === focal.name || m.loreId === focal.id) continue;
        if (liveKeys.has(m.name) || (m.loreId && liveKeys.has(m.loreId))) recastMember(m, liveKeys);
      }
      // a live chain's cast may not haunt this bible's TEXT either (40020: one bible's TWIST
      // read "Algar's hound" — a ferryman from a concurrent saga who wasn't even in this cast)
      const escRe3 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ownNames = new Set(g.cast.flatMap(m => m.name.split(/\s+/)));
      for (const c of liveChains) for (const other of c.bible.cast) {
        for (const n of new Set([other.name.trim(), other.name.trim().split(/\s+/)[0]!])) {
          if (n.length < 3 || ownNames.has(n)) continue;
          const rx = new RegExp(`\\b${escRe3(n)}('s)?\\b`, 'g');
          const rep = (_: string, p?: string) => p ? "another party's" : 'another party';
          g.situation = g.situation.replace(rx, rep); g.goal = g.goal.replace(rx, rep);
          g.arc = g.arc.map(s => s.replace(rx, rep)); g.tensions = g.tensions.map(s => s.replace(rx, rep));
          g.openDirections = g.openDirections.map(s => s.replace(rx, rep));
          if (typeof g.twistReveal === 'string') g.twistReveal = g.twistReveal.replace(rx, rep);
        }
      }
    }
    // ENGINE BELTS on the bible (R28: prompt rules alone kept leaking):
    // (a) the banned prop must not ride bible fields into every downstream card — scrub it;
    // (b) a thing-prize saga's focal labeled "prize" reads as a person-deliverable under a
    //     goods envelope AND flips the care-beat bucket — remap to quarry.
    const scrub = (s: string) => s.replace(/\b(ledger|manifest|registry|record-book)s?\b/gi, 'charter');
    g.kernel = scrub(g.kernel); g.situation = scrub(g.situation); g.goal = scrub(g.goal);
    g.arc = g.arc.map(scrub); g.tensions = g.tensions.map(scrub); g.openDirections = g.openDirections.map(scrub);
    for (const m of g.cast) { m.who = scrub(m.who); m.want = scrub(m.want) }
    if (eco.kind === 'gold-hoard' || isPersonal) {
      const f = g.cast.find(m => m.name === focal.name);
      if (f?.role === 'prize') f.role = 'quarry';
    }
    // CAST-SLOT INTEGRITY (2026-07-11 — judges found recycled slate names bound into the
    // quarry/prize slot of sagas that starred someone else, in 4+ bibles per campaign):
    // the FOCAL owns the central role; any other holder is demoted to a supporting one.
    {
      const centralRole = eco.kind === 'recruit' ? 'prize' : 'quarry';
      const focalEntry = g.cast.find(m => m.name === focal.name);
      if (focalEntry && !isPersonal && !['client'].includes(focalEntry.role)) focalEntry.role = centralRole;
      // development sagas are about the company's OWN (#357/#360 evidence: a focal merc labeled
      // 'quarry' steers the finale to close around the wrong person, as if hunting one's own)
      if (focalEntry && isPersonal && ['quarry', 'prize', 'obstacle'].includes(focalEntry.role)) focalEntry.role = 'companion';
      for (const m of g.cast) {
        if (m !== focalEntry && (m.role === 'quarry' || m.role === 'prize')) m.role = 'obstacle';
      }
    }
    // LORE §1 / STORY_ENGINE §3: coined cast PERSIST as lore-only people — the world populates
    // itself with recurring faces (they surface in later recalls/slates and can be acquired);
    // without this only focals ever entered the graph
    for (const member of g.cast) {
      if (member.loreId && this.state.lore.nodes[member.loreId]) continue;      // already known
      if (member.name === focal.name) continue;                                  // focal has a card+node
      const id = freshId('lore-');
      const b = this.clampBlurb(member.who);
      this.state.lore.nodes[id] = { id, kind: 'character', name: member.name, blurb: b, identity: b, active: true, createdCycle: this.state.cycle };
      member.loreId = id;
    }
    const chain: Chain = {
      id: freshId('chain-'), kind: eco.kind, isPersonal, focalId: focal.id,
      level: lead.level, rarity: lead.rarity, region: lead.region,
      expectedBeats: eco.beats, payoff: eco.payoff, bank: 0, cyclesSpent: 0,
      failureBudget: eco.failureBudget, failures: 0, beatIndex: 0,
      bible: {
        title: g.title, kernel: g.kernel, cast: g.cast, situation: g.situation, goal: g.goal,
        arc: g.arc, twist: g.twistReveal, tensions: g.tensions, openDirections: g.openDirections,
        stakeIfLost: g.stakeIfLost,
        // rolled ONCE at hiring and kept, so a re-offered beat 1 tells the same arrival twice
        arrival: sampleArrival(this.rng),
      },
      // player-facing story state starts from the APPARENT goal — the bible's situation and
      // directions are the hidden truth and must never seed a surface the UIs display. The
      // taking-up framing keeps beat-1 writers from posing the whole errand (R22: a bare goal
      // as currentSituation read as "things already stand at the goal")
      // "has just taken this up" contradicted beat 1's own definition (the taking-up IS beat 1)
      // no goal text here — the goal rides in its own bible field, and printing it twice made
      // the exact sentence a paste-magnet for the beat-1 writer (verifier, 33013 render)
      story: { currentSituation: 'The matter has just come before the company; nothing has been done yet.', knownToPlayer: [], openThreads: [], actorStates: {}, introducedNames: [] },
      state: 'active', createdCycle: this.state.cycle,
    };
    focal.chainIds.push(chain.id);
    this.state.chains.push(chain);
    this.log('chain', `A story begins: ${g.title}`);
    return this.generateChainBeat(chain, lead);
  }

  private async generateChainBeat(chain: Chain, lead: Lead): Promise<Quest> {
    const isFinale = finaleReady(chain);
    // finales are ALWAYS one slot per approach (3 mutex plans); the AI is told the true shape.
    // Beats obey the fillability guard: never more slots than the roster has soldiers.
    const n = isFinale ? 3 : Math.max(1, Math.min(slotCount(this.rng, 'investigate', chain.rarity), this.roster().length));
    const sideLootV = isFinale ? 0 : beatSideLoot(this.rng, chain);
    const focal = this.card(chain.focalId);
    // two-part lore prompting (LORE.md): selector picks who gets full dossiers, THEN the writer
    // receives the relevant lore — beats carry world memory, not just the frozen bible
    // another LIVE chain's cast is invisible to this chain's writer — Nurov entered a second
    // saga through the lore feed and led war bands there while under the first saga's escort
    const otherLiveCast = new Set(this.state.chains
      .filter(c2 => c2.id !== chain.id && (c2.state === 'active' || c2.state === 'finale-pending'))
      .flatMap(c2 => c2.bible.cast.flatMap(m => [m.loreId ?? '', m.name].filter(Boolean))));
    const relevantLore = (await this.buildLoreSlate(chain.focalId, 'who needs full dossiers for this saga step'))
      .filter(e => !otherLiveCast.has(e.id) && !otherLiveCast.has(e.name))
      // same never-use fence as genesis: soldiers reach a beat card only when the BIBLE binds
      // them (focal / cast entry); the rest of the roster is copy-bait, not context
      .filter(e => !e.companySoldier || e.id === chain.focalId
        || chain.bible.cast.some(m => m.loreId === e.id || m.name === e.name))
      // a cast member's lore entry that adds NO flag is a byte-duplicate of bible.cast
      // (context-free audit: same person described twice in one payload) — drop it. The FOCAL
      // is exempt: their lore identity carries the tags/sex the writer has no other source
      // for (bible cast entries hold who/want only — dropping it left a named focal sexless)
      .filter(e => e.id === chain.focalId || e.companySoldier || e.companyCaptive || e.atTheFort || e.outOfReach
        || !chain.bible.cast.some(m => m.loreId === e.id || m.name === e.name));
    // 🛠 2026-07-10 (reverses the earlier arrive-FRESH ruling): a lapsed unmarched beat is
    // re-offered VERBATIM from cache — a re-rendered "fresh telling" drifted settled facts
    // (a mute girl became talkative between two renders of the same step)
    const cached = this.cachedBeatOut.get(chain.id);
    const isRepose = !isFinale && chain.lastGeneratedBeat === chain.beatIndex + 1;
    // reveal cadence enforced mechanically (§2 — prompts alone failed at 4-person casts):
    // a cast member neither met yet, named by THIS step, focal, nor the client is flagged
    // offstage — the writer may not name them, so later beats introduce them on their own turn
    const dealtStep = isFinale ? chain.bible.arc[chain.bible.arc.length - 1]!
      : chain.bible.arc[Math.min(chain.beatIndex, chain.bible.arc.length - 1)]!;
    // the CARD writer never sees a step's "→ yields:" answer — handing it the yield made
    // cards name the find before the party looked (lab batch C, 4/6); the RESOLVER keeps
    // the full step because it must deliver that yield
    const stripYields = (s?: string) => (s ?? '').replace(/\s*→ yields:.*$/i, '');
    // BEAT 1's step opens "Take the job / Accept the hire and <errand>" — that lead clause is
    // engine framing (the card is the board POSTING, read BEFORE the company accepts). Handed to
    // the writer it gets narrated as done ("You accepted the hire and rode out", batch P 4/6);
    // strip it so only the field errand remains and the writer renders a job TO DO, not one begun.
    const isBeat1 = chain.beatIndex === 0 && !isFinale;
    const stripTakeJob = (s: string) => s
      .replace(/^\s*(?:at [^.,]+,\s*)?(?:take|accept)\b[^.]*?\b(?:hire|job)\b[^.]*?(?:\.\s+|,\s+|\s+and\s+)/i, '')
      .replace(/^(\w)/, (_m, c: string) => c.toUpperCase());
    // genesis writes beat-1 steps with "<the place/person> the hire named / the client named /
    // she named" — engine framing to withhold the name at hiring. The writer echoes it as a seam
    // ("The hire sent you to…", batch Q) — strip the qualifier so only the plain noun remains.
    const stripHireFraming = (s: string) => s
      .replace(/,?\s+(?:the (?:hire|client)|s?he|they)\s+named\b/gi, '')
      // "using only what X knows" is genesis literalising the internal "hire-knowledge only"
      // rule; the writer echoed it as prose ("asks you to use only what he knows", batch S)
      .replace(/,?\s+using only (?:what [^,.]+? knows|[^,.]+?'s (?:information|knowledge|word|lead))/gi, '');
    const cardStep = isBeat1 ? stripHireFraming(stripTakeJob(stripYields(dealtStep))) : stripYields(dealtStep);
    // BEAT 1's card knows only what the HIRE knows: its met-gate uses the goal alone —
    // genesis packs discovery names into step 1's errand text, and trusting stepText there
    // dumped the cast roster onto beat-1 cards (lab batch M: 6/8 leaked via this door)
    const stagedRaw = this.stageBible(chain, chain.beatIndex === 0 && !isFinale ? '' : dealtStep, chain.beatIndex === 0 && !isFinale);
    // mid-saga CARD writers lose bible.situation entirely (lab batch E: every leak class —
    // twists, yields, later beats — drew from that well; the omission pattern is the proven
    // fix). The kernel keeps the premise; goal/cast/record carry everything a briefing knows.
    // Finale writers and resolvers keep the full truth.
    // beat writers get a MINIMAL, card-safe feed (lab batches E-G: every leak drew from a
    // bible field that holds whole-story knowledge — situation, kernel, later arc steps,
    // tensions, openDirections; each was closed by OMISSION, the session's one reliably
    // winning move). The client's open telling is composed from card-safe fields only:
    // the goal (already player-known by design) and the client's own want.
    const stagedBible = {
      ...stagedRaw,
      ...(isFinale
        ? { arc: (stagedRaw.arc as string[]).map(stripYields) }
        : {
          // beats carry the LEAN bible only (context-free audit 2026-07-17: one payload held
          // the same sentence ×4). kernel/tensions/openDirections: dead fields. arc: arcStep
          // deals the step. situation: duplicated goal byte-for-byte since the round-1
          // hand-the-telling-clean fix — the goal alone IS the client's telling for a beat.
          // twist: whole-story knowledge, never a beat's to see.
          kernel: undefined,
          tensions: undefined,
          openDirections: undefined,
          arc: undefined,
          situation: undefined,
          twist: undefined,
        }),
    };
    const wqInput = ({
      // beats serve the BIBLE's story, not a rolled job type (a random archetype fought the saga);
      // the landmark gate is for one-off variety — a saga anchored at the landmark must name it
      kind: (isFinale ? 'finale' : 'beat') as 'finale' | 'beat',
      // beats see the landmark ONLY when this saga's bible actually uses it (else it re-tempts drift)
      location: this.locationLine(chain.region, !!REGION[chain.region]?.landmark && JSON.stringify(chain.bible).includes(REGION[chain.region]!.landmark!), false),
      // rarity's only stated job on a saga card was "permission to run long", and the length
      // budget is now fixed — nine blind writer-reports called it dead and ignored it
      level: chain.level, slotCount: n,
      // the person's NAME, never engine words — "custody of the focal" once printed on a card
      // world-worded AND rotated — any fixed string stamps (models echo DATA fields:
      // 'side loot' ×4, then its replacement ×5; rotation breaks the stamp)
      rewardEnvelope: isFinale
        ? `${this.card(chain.focalId)?.name ?? 'the central person'} — likely ${chain.isPersonal ? 'the matter settled, the soldier stays' : chain.kind === 'gold-hoard' ? 'their treasure' : chain.kind}`
        // FULL in-voice sentences, not gists: the writer is told to reword these, but cheap
        // models paste the DATA verbatim (batch O: "pay as agreed…" ended a card lowercase) — so
        // a paste must itself read as a clean card sentence (§8 input-shaping over nagging)
        // CLAUSE-shaped, because the writer is now told to ride the pay on a sentence doing
        // other work — the old pool was whole sentences, and a dealt string gets pasted WHOLE
        // ("A warden watches the chest and will resist anyone who opens it, and the pay is fixed,
        // and what else the job shakes loose the company keeps." — live, 2026-08-27)
        : this.rng.pick([
            'the pay is the agreed coin, and what the road turns up',
            'the pay is honest coin, and any small spoils besides',
            'the fee is as agreed, and the company keeps what it hauls back',
            'the coin comes at the finish, with the pick of what the job turns up',
            'the pay is plain coin, and the road\'s yield goes to the company',
            'the fee is fixed, and what else shakes loose the company keeps',
            'the coin comes when it is done, and anything carried home is the company\'s',
            'the fee is as agreed, and any spoils ride home with it',
          ]),
      // R1 sell-the-stake (designer ruling 2026-07-18, STAKE=1 lab flag): beat 1 tells the boss
      // what the WHOLE matter is rumored to be worth — engine-known kind + payoff band, dealt as
      // a paste-clean rumor sentence (sticky-string law); rumor-toned so a later slip breaks no promise
      // SHIPPED default (batch I blind A/B: stake 5.5 vs control 4.25; boss_pull yes 5-0):
      // STAKE=0 restores stake-less beat-1 cards
      ...(process.env.STAKE !== '0' && chain.beatIndex === 0 && !isFinale && !chain.bible.stakeIfLost
        ? { stake: this.stakeGloss(chain, focal?.character?.role === 'merc' ? focal.name : undefined) }
        : {}),
      // beats get NO opening spark (🛠 2026-07-10): a random spark fought the saga — the card
      // opens from the story state, and beat 1 from how the bible says the matter arrived.
      // BEAT 1 gets no place suggestion either: its ground is already named by arcStep or by
      // relevantLore, the bible's geography outranks the suggestion anyway, and the one-place
      // budget is spent — 3/3 blind writers dropped it unused and asked why it was dealt.
      ...(isBeat1 ? {} : { placeNameSuggestions: [this.freshPlaceName(chain.region)] }),
      // ─── BEAT 1's OWN FACTS (prosebench/ROUND2_3: the three questions cards lose) ───
      ...(isBeat1 ? {
        // WHY. Nine writer-reports lost this question; the one handed a written stake answered it
        // and said so: "the one question cards usually lose is the one the input handed me pre-written."
        stakeIfLost: chain.bible.stakeIfLost || undefined,
        // HOW IT REACHED THE FORT — invented by 6/6 writers before it was dealt
        arrival: chain.bible.arrival,
        // WHY IT TAKES ARMED STRANGERS — what the client openly knows stands against them. The
        // reveal cadence keeps the obstacle's NAME and identity off the card; what they will DO
        // about this matter is the client's own knowledge and belongs on the first card.
        knownObstacle: (o => {
          if (!o?.want) return undefined;
          const want = this.scrubUnmet(chain, o.want);
          if (/another party/.test(want)) return undefined;   // the scrub fired — say nothing
          return `${o.trade || 'a stranger'} · ${want.replace(/^to\s+/, '')}`;
        })(chain.bible.cast.find(m => m.role === 'obstacle') ?? chain.bible.cast.find(m => m.role === 'quarry')),
        // the CARE MOMENT, dealt rather than derived from a tag word
        ...(chain.bible.cast.some(m => m.role === 'client') ? { tell: sampleTell(this.rng) } : { noClient: true }),
      } : {}),
      // roster dealt ONLY when the focal is the company's own (the one case a saga card may
      // name a soldier) — otherwise it's never-use data, pure copy-bait (context-free audit)
      ...(focal?.character?.role === 'merc'
        ? { rosterNames: this.rosterForWriters().names, rosterPronouns: this.rosterForWriters().pronouns }
        : {}),
      lastBeatOutcome: chain.lastGeneratedBeat === chain.beatIndex + 1
        ? `${chain.story.lastBeatOutcome ?? ''} This same step was posed before and went untaken — pose it AFRESH in a new telling, but the SAME places and people: the world did not move while the company sat.`.trim()
        : chain.story.lastBeatOutcome,
      // paired A/B 88001: on failure-heavy seeds BOTH arms bridged failed beats by asserting
      // the failed step's planned yield (badge/summons-stone/remains materialized). The engine
      // KNOWS the outcome — deal the flag so the system can raise a prominent conditional gate
      lastStepFailed: /ended in FAILURE/.test(chain.story.lastBeatOutcome ?? ''),
      // beat 1: the canned "matter just came before the company, nothing done" status is echo-bait
      // (batch O pasted it verbatim into 3/6 cards) and adds nothing the BEAT 1 branch doesn't say —
      // blank it so the writer opens from the client's telling, not a stock scaffolding line
      bible: stagedBible,
      // beat 1 has no record yet — an all-empty storyState scaffold is pure parse-load
      storyState: chain.beatIndex === 0 && !isFinale ? undefined : chain.story,
      relevantLore,
      // beat 1's lore is trimmed to the ground this step actually stands on: a second entry is
      // always a later step's ground, and `relationPhrase` reads the same on every entry, so it
      // discriminates nothing — 3/3 blind writers could not tell what it wanted of them
      ...(isBeat1 ? { relevantLore: relevantLore.slice(0, 1).map(({ relationPhrase: _rp, ...e }) => e) } : {}),
      focalDossier: (d => d.includes('\n') ? d : undefined)(this.dossier(chain.focalId)),
      // expectedBeats deliberately NOT sent to the card writer: the system never explains it,
      // and the total arc length is whole-story knowledge a beat card must not lean on
      beatIndex: chain.beatIndex + 1,
      // the ONE step this card covers, dealt verbatim — writers fumbled indexing arc[beat-1]
      // and scoped beat 1 to the whole goal
      arcStep: cardStep,
      // focalName only when the staged bible still carries the name — an unmet focal whose
      // identity is the saga's discovery must not re-enter through this side door
      // focalName only when the staged bible still carries the name AND the focal is the
      // company's own soldier — otherwise the goal already names them and the field is inert
      // ("focalName changed nothing about my writing" — 3/3 blind writers)
      focalName: focal?.character?.role === 'merc' && `${JSON.stringify(stagedBible)} ${cardStep}`.includes(focal.name.split(' ')[0]!) ? focal.name : undefined,
      // runtime truth, not genesis-time: a focal HIRED mid-saga is the company's own now
      focalIsMerc: focal?.character?.role === 'merc',
    });
    const out = this.stripJobEcho(isRepose && cached && cached.beat === chain.beatIndex + 1 ? cached.out : await this.ai.writeQuest(wqInput));
    // COLD-READER GATE REMOVED (reviewlab 83001/84001 + blind judge, 2026-07-17): the review
    // roundtrip cost ~5.5s per card and its fixNotes rewrites made cards WORSE (pre-rewrite won
    // 6/9, mean 7.44 vs 7.11) — same nag-degradation as the genesis guard. The dup-restatement
    // lint also over-fired (situation and job line naturally share words: 10/12 cards). Lint is
    // LOG-ONLY telemetry now; fix defect classes at the prompt, never by re-generation.
    for (const flaw of this.lintCard(out)) this.log('chain', `saga card lint (log-only): ${flaw}`);
    if (!isFinale) this.cachedBeatOut.set(chain.id, { beat: chain.beatIndex + 1, out });
    // QUESTS §6: middle-beat side-loot = gold OR a relic among it (was always bare gold)
    const specs: RewardSpec[] = isFinale ? [] : [{ kind: 'gold' as const, value: sideLootV }];
    let beatRewardCards: Card[] = [];
    if (!isFinale && sideLootV > 40 && this.rng.chance(0.35)) {
      specs[0] = { kind: 'gold', value: Math.round(sideLootV * 0.4) };
      const relicSpec: RewardSpec = { kind: 'relic', value: Math.round(sideLootV * 0.6) };
      specs.push(relicSpec);
      beatRewardCards = materializeReward(this.rng, relicSpec, chain.level, chain.region);
    }
    // beat pacing (QUESTS §8-B): beat 1 is the low-stakes CARE moment — cap its
    // difficulty at standard; beat 2 still escalating — cap at hard; then free
    const beatNo = chain.beatIndex + 1;
    const cap = isFinale ? undefined : beatNo <= 1 ? 'standard' as const : beatNo === 2 ? 'hard' as const : undefined;
    chain.lastGeneratedBeat = chain.beatIndex + 1;
    const quest: Quest = {
      id: freshId('q'), leadId: lead.id, title: out.title, situation: out.situation, job: out.job,
      gravity: sampleGravity(this.rng, chain.rarity, 'saga'),
      level: chain.level, rarity: chain.rarity, region: chain.region, archetype: lead.archetype,
      chainId: chain.id, beatIndex: chain.beatIndex + 1, isFinale,
      slots: this.buildSlots(n, chain.level, chain.rarity, 'investigate', out.ask, cap,
        chain.isPersonal && focal?.character?.role === 'merc' ? focal.id : undefined),
      rewardSpecs: specs, rewardCards: beatRewardCards, sideLootV,
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
        // a label promising RELEASE on a keep-kind plan lies to the player ("Yield Ysard" ended
        // "Ysard is yours — captive") — the verb wins over the declared kind
        rewardKind: (/\b(free|release|yield|hand (?:him|her|them) over|let .{0,12} go|slip .{0,16} free)\b/i.test(a.label)
          ? 'gold'
          : (['recruit', 'captive', 'gold'].includes(a.rewardKind) ? a.rewardKind : 'gold')) as 'recruit' | 'captive' | 'gold',
      }));
      // exactly ONE slot per approach — each group is its own manning plan
      const template = quest.slots[0]!;
      quest.slots = raw.map((a, i) => {
        const attr = a.attribute.toLowerCase();
        const attributes = (['str', 'dex', 'int', 'cha', 'con'].includes(attr) ? [attr] : template.test.attributes) as Attribute[];
        const favored = a.favored.map(f => parseAiTag(f)?.concept).filter((c): c is string => !!c);
        // QUESTS §9: each PLAN carries its own difficulty — the cash-out road leans easy
        // (one cloned roll made every branch identical; an easy gold exit could never occur)
        const difficulty = quest.approaches![i]!.rewardKind === 'gold' && this.rng.chance(0.7)
          ? 'standard' as const : rollDifficulty(this.rng, chain.rarity, this.state.fort.ghTier);
        return {
          requirement: { kind: 'open' as const },
          test: { ...template.test, attributes, favored, difficulty },
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
    if (slot.requirement.kind === 'must-have' && !queryMatches(merc.tags, { match: slot.requirement.concept, minRank: slot.requirement.minRank }))
      return { ok: false, msg: `needs ${slot.requirement.concept}${slot.requirement.minRank ? ` (${slot.requirement.minRank}+)` : ''}` };
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
  // TEMPO P11/P15: the reckoning as it is being written — an ordered list of blocks (head, one
  // per marching quest, tail) so a landed report can be READ while the slow ones are still out
  private reckoning: { writing: boolean; blocks: string[][] } | null = null;
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

  reckoningView(): { writing: boolean; lines: string[]; blocks: string[][] } | null {
    if (!this.reckoning) return null;
    const blocks = this.reckoning.blocks.map(b => [...b]);
    return { writing: this.reckoning.writing, lines: blocks.flat(), blocks };
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
    }
  }

  private async doEndCycle(): Promise<string[]> {
    const st = this.state;
    st.cycle += 1;
    // the report is a list of BLOCKS read as it grows (see `reckoning`); `report` points at
    // whichever block the current push sites belong to — the head now, the tail after step 3
    const blocks: string[][] = [];
    let report: string[] = [];
    blocks.push(report);
    this.reckoning = { writing: true, blocks };
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
      q.stalls = (q.stalls ?? 0) + 1;
      if (q.stalls >= 3 && !q.isFinale) {
        this.abandonQuest(q, report);   // its own lapse line suffices — a second read as spam
      } else {
        report.push(`⏸ ${q.title} did not march — every slot must be filled (${filled} of ${active.length}).`);
      }
    }
    st.quests = st.quests.filter(q => q.state === 'open');
    if (ready.length === 0) report.push('A quiet cycle — no one marched.');
    const resolutions: Resolution[] = [];
    const questBlocks = new Map<string, string[]>();
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
      resolutions.push({ quest: q, outcome: rolled.outcome, delivery, party, fate, rolled });
      // This quest's slot on the screen, held open in id order until its own call lands. The
      // first two lines are EXACTLY what applyResolution re-pushes, so the card the player is
      // re-reading does not move when the report replaces the placeholder — and the card is the
      // only real content there is to fill the wait on a one-quest cycle (TEMPO P12 / R2).
      // The glyph is ✎ and not ⏳ because ⏳ already means "this quest lapsed" (abandonQuest).
      const block = [`— ${q.title} (${q.id})`,
        ...(q.situation ? [`「${q.situation}」`] : []),
        `✎ ${party.map(p => p.name).join(', ')} march out — the report is being written…`];
      questBlocks.set(q.id, block); blocks.push(block);
    }
    // everything pushed from here on is fort news and lands AFTER the stories. NOTE the head
    // block (tier-ups, ⏸ stalls, lapses, 'a quiet cycle') still prints BEFORE them — TEMPO P18's
    // reordering is deliberately not done here; those lines are instant, so at the top they are
    // the first thing on an otherwise empty screen rather than a wall between the player and a
    // story still being written.
    report = [];

    // 2) ONE batched AI call for all resolutions
    const aiInputs: ResolveQuestInput[] = resolutions.map(r => ({
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
      // beat variant (engine-dealt, no RNG): how this job turns — physical / wits / social
      sceneMode: this.sceneModeFor(r.quest),
      // a finale's delivered PERSON is the focal — give them an id here so the narrator can
      // flesh them from the saga's own fiction and tie edges to them (they had no entry before)
      deliveredCharacters: [
        ...r.delivery.cards.filter(c => c.character).map(c => ({ id: c.id, name: c.name, tags: renderTags(c.tags) })),
        ...(r.quest.isFinale && r.fate && r.fate.fate !== 'slipped'
          ? (f => f ? [{ id: f.id, name: f.name, tags: renderTags(f.tags) }] : [])(
              this.card(this.state.chains.find(c => c.id === r.quest.chainId)?.focalId ?? ''))
          : []),
      ],
      chainContext: r.quest.chainId ? {
        // the resolver gets the STAGED bible too — unmet cast cannot debut in a report
        // the resolver's met-text includes the FULL dealt step (yields intact) so it may
        // NAME what this step's yield reveals — the card posed the question, the report answers
        bible: (c => c ? this.stageBible(c, `${r.quest.situation} ${r.quest.job} ${(r.quest.beatIndex ? c.bible.arc[Math.min(r.quest.beatIndex - 1, c.bible.arc.length - 1)] : '') ?? ''}`, r.quest.beatIndex === 1 && !r.quest.isFinale) : undefined)(this.state.chains.find(c => c.id === r.quest.chainId)),
        storyState: this.state.chains.find(c => c.id === r.quest.chainId)?.story,
        isFinale: !!r.quest.isFinale,
        // the ONE step this job covers — resolutions overreached even when the card was scoped
        arcStep: (c => c && r.quest.beatIndex
          ? c.bible.arc[Math.min(r.quest.beatIndex - 1, c.bible.arc.length - 1)] : undefined
        )(this.state.chains.find(c => c.id === r.quest.chainId)),
        // later steps dealt as a CONCRETE ban list — the abstract "no later step's work"
        // rule kept failing (37017: beat 1 killed the saga's predator; 38018: beat 2 spoke
        // the finale's pledge and opened the granary)
        stepsNotYet: (c => c && r.quest.beatIndex && !r.quest.isFinale
          ? c.bible.arc.slice(r.quest.beatIndex) : undefined
        )(this.state.chains.find(c => c.id === r.quest.chainId)),
        focalName: (c => c ? this.card(c.focalId)?.name : undefined)(this.state.chains.find(c => c.id === r.quest.chainId)),
        // the fate reaches the narrator as a plain SENTENCE (the raw token "clean" read as an
        // adjective and collided with 'success = done clean'; the climax must not be a guess)
        fate: r.fate ? this.fateSentence(r) : undefined,
        approach: r.quest.approaches?.find(a => a.id === r.quest.chosenApproach)?.label,
        rejectedApproaches: r.quest.approaches?.filter(a => a.id !== r.quest.chosenApproach).map(a => a.label),
      } : undefined,
    }));
    // 3) apply engine effects + AI outputs; lore write-backs AFTER all (collected first)
    const pendingEdges: { from: string; to: string; type: string; blurb: string; importance: number }[] = [];
    const byQuest = new Map(resolutions.map(r => [r.quest.id, r]));
    const applied = new Set<string>();
    // a throw inside applyResolution used to escape doEndCycle and surface as `engine error:` —
    // the providers now swallow callback throws so one bad quest cannot kill the batch, so the
    // error is CARRIED and re-thrown after the await. Silently losing a quest (and stranding its
    // party in a deleted quest's slot) is the one outcome this must never have.
    let arriveError: unknown;
    const arrive = (out: ResolveQuestOut) => {
      const r = byQuest.get(out.questId), block = questBlocks.get(out.questId);
      if (!r || !block || applied.has(out.questId)) return;
      applied.add(out.questId);   // set BEFORE, so a half-applied quest is never applied twice
      block.length = 0;   // applyResolution re-pushes the title line itself
      try {
        this.applyResolution(r, out, block, pendingEdges);
      } catch (e) {
        arriveError ??= e;
        block.push(`— ${r.quest.title} (${r.quest.id})`, '⚠ this report could not be applied.');
      }
    };
    // engine effects therefore land in ARRIVAL order, not id order (TEMPO I1: replay
    // determinism explicitly not required); the TELLING order stays id order — that is the blocks
    const aiOuts = aiInputs.length ? await this.ai.resolve(aiInputs, arrive) : [];
    // defensive: a quest the callback never reached still resolves (undefined out = engine truth)
    for (const r of resolutions) {
      if (applied.has(r.quest.id)) continue;
      applied.add(r.quest.id);
      const block = questBlocks.get(r.quest.id)!;
      block.length = 0;
      this.applyResolution(r, aiOuts.find(o => o.questId === r.quest.id), block, pendingEdges);
    }
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
      if (c) { this.ensureLoreNode(c); c.location = HELD('lore'); this.noteCustodyChange(c.id, `${c.name} moved on — no longer at the fort`); report.push(`${c.name} drank up and left the tavern.`) }
    }
    st.tavern = st.tavern.filter(s => s.expiresAtCycle > st.cycle || s.prepaid);
    // 🛠 2026-07-10: a timed-out captive is never a pure loss — the company hands them off at
    // the slaver's quick price (an ACTIVE ransom before the clock still pays better; a Dungeon
    // keeps them). Zero-payoff evaporation made won finales feel hollow.
    for (const s of st.holding.filter(s => s.expiresAtCycle <= st.cycle)) {
      const c = this.card(s.cardId);
      if (c) {
        const pay = Math.round(cashValue(c.value) * SELL_RATE);
        this.ensureLoreNode(c); c.location = HELD('lore');
        this.addGold(pay);
        guardEdges(st.lore, [{ from: c.id, to: c.id, type: 'party-to', blurb: 'handed off by the company when their holding lapsed — no longer at the fort', importance: 0.7 }], st.cycle, () => freshId('e'));
        this.noteCustodyChange(c.id, `${c.name} was handed off — no longer in the company's hands`);
        this.log('sell', `${c.name} handed off at the quick price (holding lapsed).`);
        report.push(`⛓ Time ran out on ${c.name} — handed off at the quick price. 💰 +${pay}g (a ransom before the clock pays better).`);
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
        st.leads.push({
          id: freshId('lead-'), rarity: chain.rarity === 'common' ? 'uncommon' : 'rare',
          level: chain.level, region: chain.region, archetype: 'investigate',
          chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
          source: 'sequel', title: `${focal.name} resurfaces, someday`, focalId: focal.id,
        });
      }
      report.push(`🕮 The company let "${chain.bible.title}" lapse — ${focal?.name ?? 'its center'} passes out of reach, for now.`);
    }
    // a RESERVED lead survives its own expiry: the quest it is being turned into must have a lead
    // to consume when it lands (I6). endCycle drains first, so this only fires on a path that
    // reaches doEndCycle with work still out.
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

    // 7) FLESH pass — every merc and staged person deserves a who/backstory/quirks
    // (attachment starts here; persisted per producer-2, so this runs at most once each).
    // Every report line is in by now, so the player is released BEFORE this 12-16s tail.
    if (this.reckoning) this.reckoning.writing = false;
    await this.fleshPass();

    // keep the save lean: the log is a UI convenience, not the archive (lore is)
    if (st.log.length > 600) st.log = st.log.slice(-400);

    this.state.rngState = this.rng.state();
    this.state.idCounter = idCounter();
    this.lastBlocks = blocks.map(b => [...b]);
    return blocks.flat();
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
            this.state.leads.push({
              id: freshId('lead-'), rarity: chain.rarity === 'common' ? 'uncommon' : 'rare',
              level: chain.level, region: chain.region, archetype: 'investigate',
              chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
              source: 'sequel', title: `${focal.name} resurfaces, someday`, focalId: focal.id,
            });
          }
          report.push(`🕮 "${chain.bible.title}" was left untaken three times — the matter passes out of reach, for now.`);
        } else {
          this.state.leads.push({
            id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
            archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: chain.story.currentSituation },
            expiresAtCycle: this.state.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
            title: `${chain.bible.title} — the thread dangles`,
          });
        }
      }
    }
    report.push(`⏳ ${q.title} lapsed — the moment passed.`);
    this.log('expire', `${q.title} lapsed unpursued`);
  }

  private isCommitted(q: Quest): boolean {
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    return active.length > 0 && active.every(s => s.filledBy);   // ALL party slots filled (no partial sends)
  }

  /** custody changes must reach the STORY STATE of every saga the person anchors — a finale
   *  card once staged "your captive Heleis" three cycles after she was ransomed away */
  private noteCustodyChange(cardId: string, fact: string) {
    for (const ch of this.state.chains.filter(c =>
      (c.state === 'active' || c.state === 'finale-pending') && c.focalId === cardId)) {
      ch.story.knownToPlayer.push(`SETTLED: ${fact}`);
    }
  }

  /** the finale fate, told as a plain SENTENCE the narrator can land on — the raw token
   *  ("clean") read as an adjective and collided with 'success = done clean' */
  private fateSentence(r: Resolution): string {
    const chain = this.state.chains.find(c => c.id === r.quest.chainId);
    const focal = chain ? this.card(chain.focalId) : undefined;
    const name = focal?.name ?? 'the central person';
    // a focal ALREADY on the roster never "slips away" — that sentence once ran on the
    // company's own scout while he stood in the yard
    if (focal?.character?.role === 'merc') {
      return r.fate!.fate === 'slipped'
        ? `the matter around ${name} slips out of reach — nothing comes of it this time; ${name} stays with the company`
        : `the matter closes around ${name}, who already stands with the company`;
    }
    const kind = r.quest.approaches?.find(a => a.id === r.quest.chosenApproach)?.rewardKind ?? 'gold';
    if (r.fate!.fate === 'slipped') return `${name} gets away — the company comes away with nothing this time (a road back will exist)`;
    // the VOID overlay must reach the narrator too — "He will ride with the company" shipped one
    // line above "the season ran too thin to keep him"
    if (chain && focal && kind !== 'gold' && chain.bank < focal.value * KEEP_THRESHOLD) {
      return `the season ran too thin to keep ${name} — they pass out of the company's reach, for now, and the company takes what coin the affair yielded`;
    }
    const ending = kind === 'recruit' ? `${name} ends this saga siding with the company and will ride with it from here`
      : kind === 'captive' ? `${name} ends this saga held, in the company's hands`
      : `${name} passes out of the company's reach, and the company is paid for the whole affair`;
    return r.fate!.fate === 'saddled' ? `${ending} — but at a visibly worse bargain than hoped` : ending;
  }

  private describeDelivery(r: Resolution): string {
    if (r.quest.isFinale && r.fate && r.quest.chainId) {
      // ONE source of truth with chainContext.fate — two phrasings of the ending diverged
      return this.fateSentence(r);
    }
    if (r.outcome === 'failure') return 'they return with empty hands (say what was lost, in-fiction)';
    // the person's REAL fate is engine-decided — deal it, or prose promises "they may stay"
    // while the engine line says "moves on" (both shipped on one card)
    const bits = r.delivery.cards.map(c => {
      if (!c.character) return c.qty ? `${c.qty} gold` : `the ${c.name}`;
      if (c.character.role === 'captive') return `${c.name} taken captive`;
      return !this.hasRoom('tavern')
        ? `${c.name} rescued — they will thank the company and MOVE ON (the fort has no place to keep them); never show them staying`
        : this.roster().length >= this.rosterCapacity()
          ? `${c.name} rescued — they will wait at the fort's tavern, though the roster is FULL: no joining unless room opens; never promise them a place`
          : `${c.name} rescued — they will wait at the fort's tavern, open to joining if hired`;
    });
    if (r.delivery.liability) bits.push(`a ${r.delivery.liability.name} left behind`);
    return bits.join(', ') || 'a token result';
  }

  private applyResolution(
    r: Resolution,
    out: { before: string; turn?: string; turnActor?: string; speech?: { who: string; says: string }[]; after: string; injuries: { characterId: string; band: InjuryBand; cause?: string | null }[]; fleshed: { characterId: string; who: string; backstory: string; quirks: string[] }[]; edges: { from: string; to: string; type: string; blurb: string; importance: number }[]; storyUpdate?: { currentSituation: string; newlyRevealed: string[]; openThreads: string[]; sagaSettled?: boolean } } | undefined,
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
      const cited = !!inj.cause && !!merc0
        && (out?.after ?? '').toLowerCase().includes(inj.cause.toLowerCase().slice(0, 25))
        && (r.party.length === 1 || inj.cause.toLowerCase().includes(merc0.name.split(' ')[0]!.toLowerCase()));
      if (!cited) continue;
      const merc = this.card(inj.characterId);
      if (!merc?.character || !r.party.includes(merc)) continue;
      const tiers = rollInjuryTiers(this.rng, band);
      merc.character.injuryTiers += tiers;
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
    for (let i = 0; i < r.delivery.leadGrants; i++) {
      const nl = this.freshLead('reward');
      st.leads.push(nl);
      say(`🧭 A lead earned: ${nl.title ?? 'word worth chasing'} — see the Leads tab.`);
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
      say(`🧭 The sweep pays: ${extra} new lead(s).`);
    }
    // lore edges from the AI (validated later in one pass)
    pendingEdges.push(...(out?.edges ?? []));
    // narrate in the fiction's own order — setup, THEN the dice, THEN the outcome
    // (QUESTS §7: before-roll blind → after-roll sighted; the DICE are always shown, DESIGN §5)
    report.push(`— ${q.title} (${q.id})`);
    if (q.situation) report.push(`「${q.situation}」`);
    const bubbles = process.env.SPEECH_ANCHORS === '1' && out?.speech?.length ? out.speech : null;
    if (out) report.push(...(bubbles ? this.renderWithBubbles(out.before, bubbles) : [out.before]));
    report.push(r.rolled.totalCoins === 0
      ? `⚄ [${r.outcome.toUpperCase()}] · the party had no usable dice for this work (needed ${r.rolled.totalBar.toFixed(1)})`
      : `⚄ [${r.outcome.toUpperCase()}] · rolled ${r.rolled.heads} heads of ${r.rolled.totalCoins} coins vs bar ${r.rolled.totalBar.toFixed(1)}`);
    // the WHY under the dice (designer 2026-07-24): each sent merc's coins traced to the card's
    // ask — attribute value, favored/clash, injury — via the engine's own explainCoins
    if (r.rolled.totalCoins > 0) {
      const activeSlots = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      const terms = activeSlots.filter(s => s.filledBy).map(s => {
        const u = this.card(s.filledBy!);
        return u ? `${u.name} — ${explainCoins(u, s.test)}` : '';
      }).filter(Boolean);
      if (terms.length) report.push(`   ${terms.join('  ·  ')}`);
    }
    // beat variant: the engine assembles the strip's turn caption + speech around its dice line
    if (out?.turn) report.push(`▸ ${out.turnActor ?? '—'} — ${out.turn}`);
    if (!bubbles) for (const s of out?.speech ?? []) report.push(`  ${s.who}: "${s.says}"`);
    if (out) report.push(...(bubbles ? this.renderWithBubbles(out.after, bubbles) : [out.after]));
    report.push(...after);
    this.log('resolve', `${q.title}: ${r.outcome}`, q.id);
    // chain advancement
    if (q.chainId) {
      const chain = st.chains.find(c => c.id === q.chainId);
      if (chain) this.noteIntroduced(chain, [q.situation, q.job, out?.before ?? '', out?.turn ?? '', (out?.speech ?? []).map(s => s.says).join(' '), out?.after ?? ''].join('\n'));
      this.advanceChain(q, r, out?.storyUpdate, report, r.fate, out?.after);
    }
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


  /** roster as the writers see it — names + a SEPARATE pronoun map ("Uneneth (she)" inline got
   *  copied verbatim into prose; a map is metadata the model won't quote) */
  /** deterministic saga-card lint (§0 lever 1) — each hit becomes a fixNote for the rewrite pass */
  /** NEAR-VERBATIM job-echo strip (§0 lever 1, no extra AI call): drop a situation sentence
   *  that essentially IS the job line. Bidirectional ≥0.85 only — the 0.7 one-way lint
   *  over-fired (situation and job naturally share words); dropping a whole sentence is the
   *  proven safe mechanical move. Never touches a card with fewer than 2 sentences. */
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
    this.log('chain', 'card body echoed the job line near-verbatim — sentence dropped');
    return { ...out, situation: kept.join(' ') };
  }

  private lintCard(out: { situation: string; job: string }): string[] {
    const d: string[] = [];
    // suffix-normalized so "grove's"/"knows" match "grove"/"know"
    const words = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
      .filter(w => w.length > 3).map(w => w.replace(/s$/, ''));
    const jw = new Set(words(out.job));
    const sents = out.situation.split(/(?<=[.!?])\s+/);
    // single sentences AND adjacent pairs: batch Y evaded the per-sentence check by splitting
    // the restatement across two neighboring sentences
    const windows = [...sents, ...sents.slice(1).map((s, i) => `${sents[i]} ${s}`)];
    const dup = jw.size >= 4 && windows.some(win => {
      const overlap = new Set(words(win).filter(w => jw.has(w)));
      return overlap.size >= jw.size * 0.7;
    });
    if (dup) d.push('the situation restates the job line nearly word-for-word — the body tells the MATTER; the job line alone carries the errand');
    if (/\b(your task is|this step is|the hire)\b/i.test(`${out.situation} ${out.job}`))
      d.push('scaffold voice on the card ("your task is", "this step is", "the hire") — say the errand as the outcome wanted, in world words');
    return d;
  }

  private rosterForWriters(): { names: string[]; pronouns: Record<string, string> } {
    const pronouns: Record<string, string> = {};
    const names = this.roster().map(m => {
      pronouns[m.name] = m.tags.find(t => t.concept === 'female') ? 'she' : m.tags.find(t => t.concept === 'male') ? 'he' : 'they';
      return m.name;
    });
    return { names, pronouns };
  }

  /** LORE.md recall → selector → labeled slate: what the world remembers around a focal.
   *  Shared by genesis AND every beat/finale (§4 tiering: dossiers for the picked few, blurbs for the rest). */
  private async buildLoreSlate(focalId: string, purpose: string) {
    const wildcardPool = Object.values(this.state.lore.nodes).filter(n => n.active && n.id !== focalId).map(n => n.id);
    const wildcards = this.rng.shuffle([...wildcardPool]).slice(0, 3);
    const candidates = recall(this.state.lore, focalId, this.state.cycle, wildcards);
    const picked = candidates.length > 8
      ? await this.ai.select({ purpose, candidates: candidates.map(c => ({ id: c.node.id, name: c.node.name, blurb: c.node.blurb, relationPhrase: c.relationPhrase })), max: 4 })
      : candidates.map(c => c.node.id);
    return candidates.map(c => {
      const card = this.card(c.node.id);
      const role = card?.character?.role;
      // a soldier/captive's company relation OVERRIDES a "thematic wildcard" phrase — the two contradicted
      const relationPhrase = role === 'merc' ? "one of the company's own soldiers"
        : role === 'captive' ? "held in the company's cells" : c.relationPhrase;
      // anyone physically AT the fort (tavern guest, staged) must not be cast as an off-site
      // faction leader — a tavern guest was once written leading a hamlet while she waited
      const atTheFort = !!card && card.location.kind === 'held' &&
        ['roster', 'staged', 'inventory'].includes((card.location as { state?: string }).state ?? '');
      // the MIRROR fence: someone who passed out of play ("Ulfgash slipped past…") was re-cast
      // "in your cells" 19 cycles later — flag them gone
      const outOfReach = !!card && card.location.kind === 'held' &&
        (card.location as { state?: string }).state === 'lore';
      // a dossier that is just "name — tags" adds nothing over the blurb — send only fuller ones
      const d = picked.includes(c.node.id) ? this.dossier(c.node.id) : '';
      return {
        id: c.node.id, name: c.node.name, blurb: c.node.blurb, relationPhrase,
        companySoldier: role === 'merc' || undefined,
        companyCaptive: role === 'captive' && !outOfReach || undefined,
        atTheFort: atTheFort || undefined,
        outOfReach: outOfReach || undefined,
        dossier: d.includes('\n') ? d : undefined,
      };
    });
  }

  /** the location line the writer sees — the landmark gate works by OMISSION (a shown token gets used) */
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
  /** last generated beat card per chain — lapsed unmarched beats re-offer VERBATIM (🛠) */
  private cachedBeatOut = new Map<string, { beat: number; out: QuestWriteOut }>();
  /** known-cast sagas served so far (§21-3 cadence: ~2 per GH tier, pool-gated) */
  private knownCastSagas = 0;

  private locationLine(region: string, landmarkAllowed: boolean, anchorOk = true): string {
    const r = REGION[region]!;
    // a rotating named anchor gives the region proper nouns besides its one landmark —
    // NOT dealt to saga beats (their geography comes from the bible; a random anchor fought it)
    const anchor = anchorOk && r.anchors && this.rng.chance(0.5) ? ` Known ground: ${this.rng.pick(r.anchors)}.` : '';
    return `${r.name} — ${landmarkAllowed ? r.seed : (r.seedPlain ?? r.seed)}${anchor}`;
  }

  /** a "fresh place" suggestion must never re-deal the region's own landmark (seed/ban-collision class) */
  /** recent toponym stems — the combinatorial pool dealt Hawbrook/Hawhollow/Hawgate and three
   *  Mill- villages in one run; same-stem places blur into one another for the reader */
  private recentPlaceStems: string[] = [];

  /** reveal-cadence staging (shared by the beat writer AND the resolver — 37017: "Watkyn"
   *  debuted in a resolution): cast the player hasn't met is passed WITHOUT their name, and
   *  the name is scrubbed from every bible string, so an unmet person CANNOT be named. */
  /** Replace every UNMET cast member's name with "another party" — the same gate stageBible
   *  uses, exposed so beat 1 can deal an offstage pressure's WANT without dealing their identity. */
  private scrubUnmet(chain: Chain, text: string, stepText = ''): string {
    const met = (name: string) => {
      const words = name.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2);
      const seen = [stepText, chain.bible.goal, ...(chain.story.introducedNames ?? [])].join(' ').toLowerCase();
      return words.some(w => seen.includes(w));
    };
    const escRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return chain.bible.cast.filter(m => !(m.role === 'client' || met(m.name))).reduce((t, m) => {
      for (const n of new Set([m.name.trim(), m.name.trim().split(/\s+/)[0]!]))
        t = t.replace(new RegExp(`\\b${escRe(n)}('s)?\\b`, 'g'), (_, pos) => pos ? "another party's" : 'another party');
      return t;
    }, text);
  }

  private stageBible(chain: Chain, stepText: string, withholdTwist = false) {
    const met = (name: string) => {
      const words = name.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2);
      // the focal is NOT unconditionally met (lab batch H: when discovering the focal's
      // identity IS the mystery, the old exemption pre-named them on beat 1) — they count
      // as met only where the goal, the step text, or the record names them
      const seen = [stepText, chain.bible.goal, ...(chain.story.introducedNames ?? [])].join(' ').toLowerCase();
      return words.some(w => seen.includes(w));
    };
    const offstageCast = chain.bible.cast.filter(m => !(m.role === 'client' || met(m.name)));
    // beat 1 never sees the twist (40020: a beat-1 card printed the chain's twist verbatim,
    // pre-spoiling the finale — withholding beats instructing)
    if (offstageCast.length === 0) return withholdTwist ? { ...chain.bible, twist: null } : chain.bible;
    const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scrub = (s: string) => offstageCast.reduce((t, m) => {
      for (const n of new Set([m.name.trim(), m.name.trim().split(/\s+/)[0]!]))
        t = t.replace(new RegExp(`\\b${escRe(n)}('s)?\\b`, 'g'), (_, p) => p ? "another party's" : 'another party');
      return t;
    }, s);
    return {
      ...chain.bible,
      kernel: scrub(chain.bible.kernel),
      situation: scrub(chain.bible.situation),
      goal: scrub(chain.bible.goal),
      arc: chain.bible.arc.map(scrub),
      tensions: chain.bible.tensions.map(scrub),
      openDirections: chain.bible.openDirections.map(scrub),
      twist: withholdTwist ? null : typeof chain.bible.twist === 'string' ? scrub(chain.bible.twist) : chain.bible.twist,
      // offstage cast pass ROLE ONLY — who/want carry the future person's identity and desire,
      // which the writer voices through an invented witness to spoil them (batch R: Telare
      // "remembers a wandering lizardman smith", the step-2 prize). Omission is the fix.
      // Retained entries get SCRUBBED who/want too — an offstage focal's name once leaked
      // through the client's want ("to receive Udara…") while her own entry was nameless.
      // TRADE survives the scrub where who/want cannot: it is one common noun, carries no
      // identity, and is the only thing that makes "shows nameless by trade" performable. Three
      // blind writers, given {role, offstage: true}, each had to invent the entire danger.
      cast: chain.bible.cast.map((m): unknown => offstageCast.includes(m)
        ? { role: m.role, offstage: true, ...(m.trade ? { trade: m.trade } : {}) }
        : { ...m, loreId: undefined, who: scrub(m.who), want: scrub(m.want) }),
    };
  }

  private freshPlaceName(region: string): string {
    const banned = REGION[region]?.landmark;
    const stem = (s: string) => s.slice(0, 4).toLowerCase();
    // anti-repeat covers the LAST word too — prefix stems alone let "Mossway Hollow /
    // Coalward Hollow / Linden Hollow / Marepen Hollow" template a whole campaign (45025)
    const tail = (s: string) => s.split(/\s+/).pop()!.toLowerCase();
    let p = rollPlaceName(this.rng);
    for (let i = 0; i < 12 && (p === banned || this.recentPlaceStems.includes(stem(p)) || this.recentPlaceStems.filter(t => t === `tail:${tail(p)}`).length >= 2); i++)
      p = rollPlaceName(this.rng);
    this.recentPlaceStems.push(stem(p), `tail:${tail(p)}`);
    while (this.recentPlaceStems.length > 48) this.recentPlaceStems.shift();
    return p;
  }

  /** orient-once (STORY_GEN_STATE): a bible-cast name that has appeared in player-facing text is "met" —
   *  the next beat's writer uses their bare name instead of re-orienting them */
  private noteIntroduced(chain: Chain, text: string) {
    const seen = (chain.story.introducedNames ??= []);
    for (const c of chain.bible.cast) {
      const given = c.name.split(' ')[0]!;
      if (given.length > 2 && !seen.includes(c.name) && text.includes(given)) seen.push(c.name);
    }
  }

  private advanceChain(q: Quest, r: { outcome: Outcome; party: Card[] }, storyUpdate: { currentSituation: string; newlyRevealed: string[]; openThreads: string[]; actorUpdates?: Record<string, string> | null; sagaSettled?: boolean } | undefined, report: string[], fate?: FinaleFate, afterText?: string) {
    const st = this.state;
    const chain = st.chains.find(c => c.id === q.chainId);
    if (!chain) return;
    // the settled record: what the player actually read — judges caught the beat writer
    // un-settling objects (a recovered polehead re-buried two beats later) when it only saw
    // abstract ledgers; concrete prior text is what the model actually honors
    if (afterText) {
      (chain.story.history ??= []).push(`beat ${q.beatIndex ?? chain.beatIndex} (${r.outcome}): ${afterText}`);
      while (chain.story.history!.length > 8) chain.story.history!.shift();
    }
    if (storyUpdate) {
      chain.story.currentSituation = storyUpdate.currentSituation;
      // dedupe near-identical facts (the same fact stored 3× invited the AI to re-stage the event)
      const stem = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, '').split(' ').slice(0, 8).join(' ');
      for (const f of storyUpdate.newlyRevealed) {
        if (!chain.story.knownToPlayer.some(k => stem(k) === stem(f))) chain.story.knownToPlayer.push(f);
      }
      chain.story.openThreads = storyUpdate.openThreads.slice(0, 5);
      // QUESTS §11 WHEREABOUTS ledger — single-location truth per person/object; the next
      // writer and resolver treat it as authoritative (42022: a recovered mould was re-found
      // in the antagonist's dagger because prose history alone didn't pin locations)
      for (const [k, v] of Object.entries(storyUpdate.actorUpdates ?? {})) {
        if (typeof v === 'string' && v.trim()) chain.story.actorStates[k] = v.trim().slice(0, 160);
      }
      const keys = Object.keys(chain.story.actorStates);
      for (const k of keys.slice(0, Math.max(0, keys.length - 14))) delete chain.story.actorStates[k];
      // AI judges the matter settled → engine gates: the NEXT step becomes the finale (no filler beats)
      if (storyUpdate.sagaSettled && !q.isFinale) chain.settled = true;
    }
    chain.story.lastBeatOutcome =
      `beat ${q.beatIndex ?? chain.beatIndex} ended in ${r.outcome.toUpperCase()}: ${storyUpdate?.currentSituation ?? chain.story.currentSituation}`;
    // a failed beat re-poses the SAME step (see bankBeat) — the cached card and the repose
    // marker describe a world before the failure; both must go so the next card is written
    // FRESH from the failure's aftermath
    if (r.outcome === 'failure') { this.cachedBeatOut.delete(chain.id); chain.lastGeneratedBeat = 0; }
    if (q.isFinale) return this.settleFinale(q, chain, r, report, fate);
    const bankBefore = chain.bank;
    // side-loot deducts what was actually DELIVERED — a partial pays out half the loot,
    // so the bank is docked half (it was docked the full budget for half the goods)
    bankBeat(chain, r.party.length, r.outcome, (q.sideLootV ?? 0) * (r.outcome === 'partial' ? 0.5 : 1));
    const delta = Math.round(chain.bank - bankBefore);
    const focal = this.card(chain.focalId);
    // continuation lead (cached title, zero AI)
    st.leads.push({
      id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
      archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: chain.story.currentSituation },
      expiresAtCycle: st.cycle + LEAD_TTL + CONTINUATION_TTL_BONUS, source: 'continuation',
      title: `${chain.bible.title} — ${finaleReady(chain) ? 'the reckoning nears' : 'the story continues'}`,
    });
    // company-ledger diction — "bank/beat/season/remains at the center" read as engine
    // jargon at the story's emotional beats (41021 judge, class 5)
    // the focal is named ONLY once the cards have introduced them (46026: "Ungrien stays at
    // the heart of it" told the player a total stranger anchored their chain)
    const focalMet = !!focal && (chain.story.introducedNames ?? []).includes(focal.name);
    report.push(`📖 ${chain.bible.title}: ${chain.bank.toFixed(0)}g earned toward this matter's ~${chain.payoff.toFixed(0)}g worth (${delta >= 0 ? '+' : ''}${delta}g today)${finaleReady(chain) ? ' — it now comes to a head' : ''}.${focalMet ? ` ${focal!.name} stays at the heart of it.` : ''}`);
  }

  /** LORE §1 story-NPC write-back (built 2026-07-18): when a saga closes, coined cast the
   *  player actually MET persist as lore-only nodes — the world remembers faces. Cap 2/saga
   *  (client > obstacle > ally) guards the slate. The memory edge anchors them to the FOCAL —
   *  recall is edge-driven, an unanchored node is unreachable — at salience 0.5, never core,
   *  so standard decay forgets them in ~45 cycles unless a later saga re-touches them.
   *  Persisted at CLOSE, not genesis-time (§3.3 literal): live-chain cast are slate-excluded
   *  anyway, and close-time avoids offstage spoilers + abandoned-saga clutter. Recurrence
   *  rides existing channels: slate reuse + §21-3 known-cast promotion (starved until now). */
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

  /** R1 sell-the-stake: the whole matter's worth as ONE rumor sentence — kind × payoff band,
   *  sex-neutral, paste-clean (the writer may paste it verbatim and the card still reads) */
  private stakeGloss(chain: Chain, focalMercName?: string): string {
    const rich = chain.payoff >= 300;
    // personal sagas: the stake is the company's own soldier — NAMED (batch I: anonymous gloss =
    // pasted boilerplate) and POOLED (batch J: a single string stamped by its 3rd appearance;
    // name said twice read clunky → name ONCE). Chain-id-keyed pick: rotation without touching
    // the seeded RNG stream.
    if (chain.isPersonal) {
      if (!focalMercName) return 'Seeing this matter through would leave one of the company\'s own steadier for good.';
      const pool = [
        `This matter is ${focalMercName}'s own; settling it would steady the soldier for good.`,
        `${focalMercName} has more than wages riding on this one.`,
        `Old business of ${focalMercName}'s lives in this matter — ending it would end more than a contract.`,
        `The company would get more than coin out of this: it would get ${focalMercName} back whole.`,
      ];
      return pool[(parseInt(chain.id.replace(/\D/g, '') || '0', 10)) % pool.length]!;
    }
    const table: Record<string, [string, string]> = {
      recruit: [
        'Word runs that the one at the heart of this would be worth a place on any roster.',
        'Word runs that the one at the heart of this is worth more than a season of common hires.',
      ],
      captive: [
        'They say the one at the heart of this would fetch a proper ransom in the right hands.',
        'They say the one at the heart of this would fetch a ransom worth a season of contracts.',
      ],
      'gold-hoard': [
        'The matter smells of a payout worth a string of small jobs.',
        'The matter smells of a payout worth a season of small jobs.',
      ],
    };
    return (table[chain.kind] ?? table['gold-hoard']!)[rich ? 1 : 0]!;
  }

  private persistMetCast(chain: Chain) {
    const met = new Set(chain.story.introducedNames ?? []);
    const focalName = this.card(chain.focalId)?.name;
    const prio: Record<string, number> = { client: 0, obstacle: 1, ally: 2 };
    // cap BEFORE the collision filter: the top-2 slots are fixed by role, never back-filled
    // on a re-entry (a collided name means the world already holds that memory)
    const picked = chain.bible.cast
      .filter(m => !m.loreId && m.name && met.has(m.name) && m.name !== focalName)
      .sort((a, b) => (prio[a.role] ?? 3) - (prio[b.role] ?? 3))
      .slice(0, 2)
      .filter(m => !this.state.cards.some(c => c.name === m.name)
        // name checked against ALL nodes incl. inactive — a remembered name is never re-dealt
        && !Object.values(this.state.lore.nodes).some(nd => nd.name === m.name));
    for (const m of picked) {
      const id = freshId('lore-');
      // sentence-safe clamp (newPlaces pattern): a blurb cut mid-phrase invites invented completions
      const b = m.who.length > 120
        ? (c => { const d = c.lastIndexOf('. '); return d > 60 ? c.slice(0, d + 1) : c.replace(/\s+\S*$/, '') })(m.who.slice(0, 120))
        : m.who;
      this.state.lore.nodes[id] = { id, kind: 'character', name: m.name, blurb: b, identity: b, active: true, createdCycle: this.state.cycle };
      guardEdges(this.state.lore, [{
        from: id, to: chain.focalId,
        type: m.role === 'obstacle' ? 'rival-of' : 'party-to',
        blurb: `${m.role === 'obstacle' ? 'stood against the company' : m.role === 'client' ? 'hired the company' : 'stood with the company'} in the matter of "${chain.bible.title}"`,
        importance: 0.5,
      }], this.state.cycle, () => freshId('e'), chain.id);
    }
    if (picked.length) this.log('chain', `The world remembers ${picked.map(m => m.name).join(' and ')}.`);
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
        report.push(`💨 The matter around ${focal!.name} slips out of reach — for now. The season's bank is forfeit. ${focal!.name} stays with the company.`);
        return;
      }
      if (focal && !chain.isPersonal) focal.location = HELD('lore');
      const sequel: Lead = {
        id: freshId('lead-'), rarity: fate.sequelRarity, level: chain.level, region: chain.region,
        archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null,
        source: 'sequel', title: `${focal?.name ?? 'They'} resurface, someday`,
        focalId: focal?.id,   // §21-4a: the road back leads to the SAME person
      };
      st.leads.push(sequel);
      // the WORLD must remember the slip — a later saga once staged a slipped focal "held in
      // your cells" because her lore node never recorded that she got away
      if (focal) guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `at large — slipped the company when "${chain.bible.title}" ended; in no one's custody`, importance: 0.8 }], st.cycle, () => freshId('e'));
      report.push(`💨 ${focal?.name ?? 'The prize'} slips away — for now. The season's bank is forfeit. A road back exists (${fate.sequelRarity} sequel lead).`);
      return;
    }
    chain.state = 'done';
    const kind = approach?.rewardKind ?? (chain.kind === 'gold-hoard' ? 'gold' : chain.kind === 'recruit' ? 'recruit' : 'captive');
    if (chain.isPersonal || focalIsOwnMerc) {
      // personal finale: bank crystallizes as gold + pinned CORE memory (no new character)
      const surplus = cashValue(chain.bank);
      this.addGold(surplus);
      guardEdges(st.lore, [{ from: chain.focalId, to: chain.focalId, type: 'scarred-by', blurb: `came through ${chain.bible.title}`, importance: 0.9 }], st.cycle, () => freshId('e'));
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
      report.push(`💨 The season ran too thin to keep ${focal.name} — the affair yields 💰 +${pay}g and they pass out of reach, for now. A road back exists.`);
      guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `the saga ${chain.bible.title} ended with ${focal.name} out of reach`, importance: 0.85 }], st.cycle, () => freshId('e'));
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
      report.push(`💰 The season crystallizes as coin: +${pay}g${fate.fate === 'saddled' ? ' (a hard bargain — the full price slipped away)' : ''}. ${focal.name} passes out of your hands.`);
    } else if (kind === 'recruit') {
      // §2 value-invariance: the bank already paid the mark — a recruit finale JOINS CLEAN
      // (staging them at the tavern re-charged 1.2×mark on top; that double-charge is gone)
      const surplus = cashValue(crystallize(chain, focal.value));
      this.addGold(surplus);
      const shortDebt = Math.max(0, Math.round(focal.value - chain.bank));
      if (shortDebt > 0) this.addCard(mintStackable('debt', shortDebt));
      focal.character!.role = 'merc';
      if (this.roster().length < this.rosterCapacity()) {
        focal.location = HELD('roster');
        this.spawnPersonalChainLead(focal);
        report.push(`🎬 Finale: ${focal.name} joins the company — clean${shortDebt > 0 ? `, though the season ran short: a ${shortDebt}g debt comes with them` : ''}. Surplus: ${surplus}g (the bank beyond their mark).`);
      } else {
        focal.character!.role = 'npc';
        st.tavern.push({ cardId: focal.id, expiresAtCycle: st.cycle + STAGE_TTL_FINALE, prepaid: true });
        focal.location = HELD('staged');
        report.push(`🎬 Finale: ${focal.name} is yours — no roster room, so they wait at the tavern (already paid for)${shortDebt > 0 ? `; a ${shortDebt}g season-shortfall debt comes with them` : ''}. Surplus: ${surplus}g (the bank beyond their mark).`);
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
      report.push(`🎬 Finale: ${focal.name} is yours — captive${shortDebt > 0 ? `, but the season ran short: a ${shortDebt}g debt comes with them` : ''}. Surplus: ${surplus}g (the bank beyond their mark).`);
    }
    // the ARRANGEMENT joins the memory — dossiers once missed that a focal ended as a paid
    // informer because only the outcome word was recorded
    guardEdges(st.lore, [{ from: focal.id, to: focal.id, type: 'party-to', blurb: `the saga ${chain.bible.title} ended ${fate.fate}${approach ? ` — the company's way: ${approach.label}` : ''}`, importance: 0.85 }], st.cycle, () => freshId('e'));
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
        // the locked rule (BIBLE/DESIGN): deep history is written at delivery and must FIT the
        // genesis saga that produced this person — the focal IS who that story was about
        const genesis = st.chains.find(ch => ch.focalId === c.id && !ch.isPersonal);
        return {
          characterId: c.id, name: c.name, tags: renderTags(c.tags),
          role: c.character!.role,
          quest: c.character!.origin,
          context: genesis
            ? (genesis.state === 'slipped'
              ? `the person the saga "${genesis.bible.title}" is about — they slipped through the company's fingers once already`
              : `the person the saga "${genesis.bible.title}" was about — the company spent a season on that story to reach them`)
            : c.character!.role === 'merc'
              ? (st.cycle <= 2 ? 'a founding member of the company' : 'a sword the company took on')
              : c.character!.role === 'captive' ? 'a captive taken on a quest' : 'someone the road washed up at the gate',
          saga: genesis ? {
            title: genesis.bible.title,
            kernel: genesis.bible.kernel,
            situation: genesis.story.currentSituation,
            want: genesis.bible.cast.find(e => e.name === c.name)?.want ?? null,
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
        if (o.quirks.length) card.character.quirks = o.quirks.slice(0, 2);
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
    st.leads.push(starterDripLead(st.starterDripped, st.cycle, () => freshId('lead-')));
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
      report.push(`🔗 ${card.name} is broken — obedient, stationable.`);
    }
  }
}

export { renderTags, ROOM_TYPE, REGION, REGIONS, GH_THRESHOLDS, U };
