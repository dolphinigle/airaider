// GameState construction + small accessors. Init is deterministic and offline
// (no AI at boot) so both front-ends can start instantly; the AI fires on pursue/resolve.

import type { GameState, Card, CharacterCard, TagInstance, Room } from './types.js';
import { rngFrom, type Rng } from './rng.js';
import { rollBaseAttrs, rollTalents, attrsAtLevel, cardTagsValue } from './economy.js';
import { starterCells, ROOM_TYPES } from './fort.js';

export function uid(state: GameState, prefix: string): string {
  return `${prefix}_${state.nextId++}`;
}
export function addCard(state: GameState, card: Card): Card {
  state.cards[card.id] = card;
  return card;
}
export function logLine(state: GameState, msg: string): void {
  state.log.push(`[c${state.cycle}] ${msg}`);
}

export function allMercs(state: GameState): CharacterCard[] {
  return Object.values(state.cards).filter((c): c is CharacterCard => c.class === 'character' && c.role === 'merc');
}
export function availableMercs(state: GameState): CharacterCard[] {
  // a merc is sendable only when actually on the roster (not on a quest, displayed, or in limbo)
  return allMercs(state).filter((m) => m.location === 'roster');
}
export function captives(state: GameState): CharacterCard[] {
  return Object.values(state.cards).filter((c): c is CharacterCard => c.class === 'character' && c.role === 'captive');
}

// ---- starter mercs (fixed identities so boot is offline + reproducible) ------
interface StarterDef { name: string; who: string; backstory: string; tags: string[]; quirks: string[] }
const STARTERS: StarterDef[] = [
  { name: 'Marek of Saltreach', who: 'A scarred line-soldier who holds when others break', backstory: 'Drafted from the salt-flats and bled in a dozen border musters; the long scar down his cheek is from the day his shield-wall broke and he did not.', tags: ['gender:male', 'race:human', 'bg:soldier', 'skill:weapon', 'pers:brave', 'phys:scarred', 'phys:muscular'], quirks: ['oils his blade before sleep'] },
  { name: 'Ivo Wulfson', who: 'A fen-hunter who moves like weather', backstory: 'Raised trapping in the reed-mazes of Saltreach, he learned to vanish before he learned to read; he speaks little and notices everything.', tags: ['gender:male', 'race:human', 'bg:hunter', 'skill:stealth', 'pers:aloof', 'pers:calm'], quirks: ['never sits with his back to a door'] },
  { name: 'Sigrun Edda', who: 'A quiet field-healer with steady hands', backstory: 'Apprenticed to a plague-camp matron who taught her that most wounds are won with patience; she has closed more throats with thread than any blade has opened.', tags: ['gender:female', 'race:human', 'bg:healer', 'skill:heal', 'pers:kind', 'pers:gregarious'], quirks: ['hums while binding wounds'] },
  { name: 'Aldric the Patient', who: 'A hedge-scholar who reads people and old script alike', backstory: 'An elf turned out of a cloister library for asking the wrong questions; he reads a room the way he reads a ledger — slowly, and to the last line.', tags: ['gender:male', 'race:elf', 'bg:scholar', 'skill:lore', 'phys:clever', 'pers:calm'], quirks: ['annotates the margins of any letter he is handed'] },
];

function makeStarterMerc(state: GameState, r: Rng, def: StarterDef): CharacterCard {
  const tags: TagInstance[] = def.tags.map((id) => ({ id, tier: 3 }));
  const base = rollBaseAttrs(r, tags);
  const talents = rollTalents(r);
  const level = 1;
  return {
    id: uid(state, 'char'), class: 'character', role: 'merc', name: def.name, tags,
    value: cardTagsValue(tags), location: 'roster', createdCycle: 0,
    attrs: attrsAtLevel(base, talents, level), base, talents, level, xp: 0,
    who: def.who, backstory: def.backstory, quirks: def.quirks, chainIds: [], injuries: [],
  };
}

export function initGame(seed = 'airaider'): GameState {
  const r = rngFrom(seed);
  const state: GameState = {
    seed, cycle: 1, phase: 'fort', gold: 250,
    cards: {}, cells: starterCells(), rooms: {},
    leads: [], quests: {}, chains: {},
    unlockedLocations: ['the Saltreach fens', 'the river marches of Kovar', 'the Ashmoor hills'],
    globalPrestige: 0, pendingMainChains: [], nextId: 1, log: [],
  };

  // starter rooms: a bunkroom (cell 0) + a scout post (cell 1) so leads flow day 1
  const bunk: Room = { id: uid(state, 'room'), cellIdx: 0, type: 'bunkroom', displayCardIds: [] };
  const scout: Room = { id: uid(state, 'room'), cellIdx: 1, type: 'scout', displayCardIds: [] };
  state.rooms[bunk.id] = bunk; state.rooms[scout.id] = scout;
  state.cells[0].roomId = bunk.id; state.cells[1].roomId = scout.id;
  void ROOM_TYPES; // catalog referenced for types

  let first = '';
  for (const def of STARTERS) {
    const m = makeStarterMerc(state, r, def);
    addCard(state, m);
    bunk.displayCardIds.push(m.id);
    if (!first) first = m.id;
  }
  // seed one starter's personal chain so the "saga about a merc you keep" hook is visible early
  if (first) state.pendingMainChains.push(first);
  logLine(state, 'The company musters at the fort gate. Four mercs, a scout post, and 250 gold.');
  return state;
}
