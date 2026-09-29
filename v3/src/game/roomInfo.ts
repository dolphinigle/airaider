// WHAT EACH ROOM DOES, in plain words — the build list's one line per room. One table read by
// both UIs (server buildable/rooms + cli buildable), so the GUI and the text UI cannot disagree.
// Numbers here restate engine curves (fort.ts / injury.ts); if a curve moves, this line moves.

import { ROOM_TYPE, type RoomType } from '../engine/fort.js';
import { REGION } from '../engine/regions.js';

const DESC: Record<string, string> = {
  'map-room': 'Opens the map, so quests can be taken on.',
  'lead-room': 'Reads the extra leads your jobs bring back.',
  // ⚠ doc-gap (flagged 2026-09-30): FORT §5 / §12.1 give these gates a menu each, but v3 never
  // enforces them — the roster is always open, relics are kept and sold with no Storage, holding
  // works with no Holding cell (Game.menuGates marks them locks:false). Said plainly, not promised.
  'mess-hall': 'No effect yet — the roster, focus and healing work without it.',
  'storage': 'No effect yet — relics are kept and sold, and debts settled, without it.',
  'tavern': 'Soldiers looking for work drift in here to be hired.',
  'dungeon': 'Opens the captives: ransom, sell or break them.',
  'holding-cell': 'No effect yet — a newly taken captive waits in holding without it.',
  'library': 'Opens the lore: every person and place you have met.',
  'chronicle': 'The full history of every name, forgotten parts included.',
  'dungeon-cell': 'Room for three more captives.',
  'bedroom': 'One soldier’s own room. The more comfortable it is, the higher its owner can level.',
  'bunkroom': 'Beds for five soldiers.',
  'infirmary': 'Wounds heal faster — up to four times as fast when the room is comfortable.',
  'hospital': 'Pay gold to heal a wound at once.',
  'market': 'Relics sell for more: from half their worth up to seven tenths.',
  'ransom-office': 'Ransoms pay more: from six tenths of a captive’s worth up to eight.',
  'torture-chamber': 'Breaks captives to obedience — five cycles, two when comfortable.',
  'interrogation': 'Pay to question a captive; each one yields a lead.',
  'oracle': 'Shows the odds on every quest — exact once the room is comfortable.',
  'great-hall': 'The heart of the hold. Raising it opens new rooms and regions; it takes prestige and gold.',
};

/** the one-line "what it does" for a room type. `activeRegions` = Game.activeRegions() — a
 *  region already on the map (a fresh fort's home) is not "opened" by its lodge; the lodge then
 *  says what it adds there. */
export function roomDesc(typeId: string, activeRegions: string[] = []): string {
  const rt: RoomType | undefined = ROOM_TYPE[typeId];
  if (!rt) return '';
  if (DESC[typeId]) return DESC[typeId]!;
  const region = rt.region ? REGION[rt.region]?.name ?? rt.region : '';
  if (rt.roomKind === 'scouting') return rt.region && activeRegions.includes(rt.region)
    ? `Scouts ${region}: its lead-hunt goes on the board, and its Recruiting post can be built.`
    : `Opens ${region} on the map, with its own scouting jobs.`;
  if (rt.roomKind === 'recruiting') return `Recruitment jobs in ${region}.`;
  if (rt.roomKind === 'endgame') return `A landmark of ${region}: raises how comfortable every bedroom can get.`;
  if (rt.benefit === 'prestige') {
    const mate = rt.mates?.[0] ? ROOM_TYPE[rt.mates[0]]?.name : null;
    return `Prestige from the relics and tamed captives you set in it.${mate ? ` Pairs with a ${mate} for a bonus.` : ''}`;
  }
  return '';
}

/** what a comfort room is looking for, in the player's words (theme tags, r- prefix dropped) */
export function roomWants(typeId: string): string[] {
  return (ROOM_TYPE[typeId]?.themeHints ?? []).map(h => h.replace(/^r-/, '').replace('-', ' '));
}

/** the build list's grouping */
export function roomCategory(typeId: string): 'unlocks' | 'living' | 'prestige' | 'regions' {
  const rt = ROOM_TYPE[typeId];
  if (!rt) return 'unlocks';
  if (rt.region) return 'regions';
  if (rt.benefit === 'prestige') return 'prestige';
  if (rt.species === 'gate' && rt.id !== 'bunkroom') return 'unlocks';
  return 'living';
}
