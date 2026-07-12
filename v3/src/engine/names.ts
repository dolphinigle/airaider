// Names — §4b: the ENGINE rolls a name for EVERY character that materializes.
// The AI receives assigned names and uses them as-is, never inventing its own.
// 🛠 2026-07-12 (designer ruling, Fort-of-Chains calibrated): whole CURATED names, one draw,
// no syllable mad-libs — joins minted 'Branbert/Pelllion' texture; every whole name was
// vetted by a human eye at import (scripts/_importnames.ts → names_data.ts).

import type { Rng } from './rng.js';
import {
  HUMAN_M, HUMAN_F, ELF_M, ELF_F, WOLF_M, WOLF_F, LIZARD_M, LIZARD_F,
} from './names_data.js';

const FIRST: Record<string, { male: string[]; female: string[] }> = {
  human: { male: HUMAN_M, female: HUMAN_F },
  elf: { male: ELF_M, female: ELF_F },
  wolfman: { male: WOLF_M, female: WOLF_F },
  lizardman: { male: LIZARD_M, female: LIZARD_F },
};

const EPITHETS: Record<string, string[]> = {
  human: ['of the Ford', 'Longshanks', 'the Quiet', 'Redhand', 'of Millbrook', 'the Younger',
    'Ashworth', 'Coalgate', 'Thatcher', 'Reed', 'Greyfell', 'of the Marches', 'the Elder',
    'Blackbrook', 'Hollis', 'Fairweather', 'Stonebridge', 'the Lame', 'Wexcombe', 'Harrow'],
  elf: ['Leafshade', 'Duskbough', 'Dawnsinger', 'Mosswalker', 'Palebough', 'Windrow',
    'Fernbrook', 'Thistledown', 'Greenmantle', 'Sorrowsong', 'Brightwater', 'Ashveil',
    'Rootward', 'Elmwhisper'],
  wolfman: ['of the Pass', 'Greypelt', 'Nightrunner', 'Bonechewer', 'Stormhide',
    'Snowtracker', 'Ironjaw', 'of the High Fells', 'Winterborn'],
  lizardman: ['of the Shallows', 'Salt-born', 'Tidecaller', 'Scale-of-Bronze', 'Marshwalker',
    'of the Deep Fens', 'Reedspear'],
};

export function rollName(rng: Rng, race: string, gender?: string): string {
  const pools = FIRST[race] ?? FIRST.human!;
  const name = rng.pick(gender === 'female' ? pools.female : pools.male);
  return rng.chance(0.35) ? `${name} ${rng.pick(EPITHETS[race] ?? EPITHETS.human!)}` : name;
}

const RELIC_ADJ = ['Weathered', 'Gilded', 'Silent', 'Broken', 'Old', 'Salt-stained', 'Painted', 'Iron', 'Pale', 'Twin',
  'Mossgrown', 'Ashen', 'Riverworn', 'Lacquered', 'Nicked', 'Hollow', 'Amber', 'Sooted', 'Threadbare', 'Kingless',
  // widened 2026-07-11: a 64-cycle run minted Broken ×7 / Sooted ×5 / Nicked ×5 — mad-libs ledger
  'Crooked', 'Waxed', 'Horn-hafted', 'Braided', 'Dun', 'Smoke-dark', 'Patched', 'Unlettered', 'Cold', 'Nine-ringed'];
const RELIC_NOUN: Record<string, string[]> = {
  'melee-weapon': ['Blade', 'Axe', 'Maul', 'Spear', 'Dirk'],
  'ranged-weapon': ['Bow', 'Sling', 'Arbalest', 'Javelin'],
  armor: ['Hauberk', 'Helm', 'Shield', 'Cuirass'],
  clothes: ['Cloak', 'Robe', 'Veil', 'Mantle'],
  accessory: ['Ring', 'Chain', 'Brooch', 'Signet'],
  document: ['Deed', 'Charter', 'Map', 'Letters'],   // never 'Ledger' — the writers ban account-books as props
  curio: ['Idol', 'Mask', 'Orb', 'Carving', 'Gem'],
  decoration: ['Tapestry', 'Statue', 'Mirror', 'Vase'],
  furniture: ['Chair', 'Chest', 'Table', 'Lectern'],
};

export function rollRelicName(rng: Rng, form: string): string {
  const noun = rng.pick(RELIC_NOUN[form] ?? ['Relic']);
  return `${rng.pick(RELIC_ADJ)} ${noun}`;
}

/** emergent lorebook place names (villages, taverns — AI may also coin these freely)
 *  pool widened 2026-07-10: 14×10 stamped families (Falmere/Falbrook/Falwell/Falford in one run) */
export function rollPlaceName(rng: Rng): string {
  const a = ['Ash', 'Bram', 'Cold', 'Dun', 'Elm', 'Fal', 'Grey', 'Haw', 'Mill', 'Oak', 'Raven', 'Stone', 'Thorn', 'Wold',
    'Bir', 'Crag', 'Dew', 'Fern', 'Harrow', 'Ling', 'Marl', 'Nether', 'Peat', 'Rush', 'Sedge', 'Tarn', 'Whin', 'Yar'];
  const b = ['brook', 'combe', 'ford', 'gate', 'hollow', 'march', 'mere', 'stead', 'well', 'wick',
    'barrow', 'bourne', 'cot', 'croft', 'dale', 'fen', 'garth', 'gill', 'holt', 'lea', 'moss', 'shaw', 'thorpe', 'worth'];
  return rng.pick(a) + rng.pick(b);
}
