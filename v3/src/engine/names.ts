// Names — §4b: the ENGINE rolls a name for EVERY character that materializes.
// The AI receives assigned names and uses them as-is, never inventing its own.

import type { Rng } from './rng.js';

// human first-name parts are GENDERED (a "Branbert" must not carry a female tag);
// the other races' name-sounds are unisex by design
const HUMAN_M: string[][] = [
  ['Al', 'Bran', 'Cas', 'Dor', 'Ed', 'Fen', 'Gar', 'Hal', 'Jor', 'Kel', 'Lam', 'Mar', 'Ned', 'Os', 'Pell', 'Quin', 'Rod', 'Sam', 'Tom', 'Wil', 'Ys'],
  ['ric', 'den', 'ton', 'win', 'mund', 'bert', 'fred', 'gard', 'helm', 'man', 'ard'],
];
const HUMAN_F: string[][] = [
  ['Bet', 'Cla', 'El', 'Gwen', 'Isa', 'Mag', 'Ros', 'Sar', 'Tilda', 'Ann', 'Ed', 'Mar', 'Hild'],
  ['a', 'eth', 'ine', 'wen', 'da', 'ra', 'lin', 'et', 'ny'],
];
const PARTS: Record<string, { first: string[][]; epithets: string[] }> = {
  human: {
    first: HUMAN_M, // default; rollName swaps by gender
    epithets: ['of the Ford', 'Longshanks', 'the Quiet', 'Redhand', 'of Millbrook', 'the Younger', 'Ashworth', 'Coalgate', 'Thatcher', 'Reed'],
  },
  elf: {
    first: [
      ['Ae', 'Cael', 'Elo', 'Fae', 'Ith', 'Lia', 'Mael', 'Nim', 'Ori', 'Sylv', 'Thal', 'Vael', 'Yll', 'Ara', 'Eir',
       'Bri', 'Cor', 'Dae', 'Gal', 'Hele', 'Ilm', 'Kess', 'Lor', 'Mira', 'Nae', 'Ola', 'Pell', 'Quil', 'Rhi', 'Sera', 'Tia', 'Une', 'Wist'],
      ['wen', 'rion', 'thil', 'anor', 'iel', 'las', 'dir', 'wyn', 'nith', 'rael', 'ion', 'a', 'is',
       'dai', 'eth', 'inne', 'lion', 'mar', 'neth', 'olas', 'ryn', 'sha', 'via'],
    ],
    epithets: ['Leafshade', 'Duskbough', 'Dawnsinger', 'Mosswalker', 'Palebough', 'Windrow',
      'Fernbrook', 'Thistledown', 'Greenmantle', 'Sorrowsong', 'Brightwater', 'Ashveil', 'Rootward', 'Elmwhisper'],
  },
  wolfman: {
    first: [
      ['Grak', 'Har', 'Kor', 'Mag', 'Rok', 'Skar', 'Thur', 'Ulf', 'Var', 'Zur', 'Bru', 'Fang'],
      ['nar', 'gash', 'tooth', 'jaw', 'gar', 'muzzle', 'howl', 'ka', 'grim', 'nak'],
    ],
    epithets: ['of the Pass', 'Greypelt', 'Nightrunner', 'Bonechewer', 'Stormhide'],
  },
  lizardman: {
    first: [
      ['Ss', 'Za', 'Xi', 'Kre', 'Ith', 'Vex', 'Ska', 'Nash', 'Tza', 'Hess'],
      ['sska', 'zith', 'xesh', 'kaal', 'issh', 'zzar', 'thek', 'ossk', 'ess'],
    ],
    epithets: ['of the Shallows', 'Salt-born', 'Tidecaller', 'Scale-of-Bronze', 'Marshwalker'],
  },
};

export function rollName(rng: Rng, race: string, gender?: string): string {
  const p = PARTS[race] ?? PARTS.human!;
  const first = (race === 'human' || !PARTS[race]) ? (gender === 'female' ? HUMAN_F : HUMAN_M) : p.first;
  // collapse letter pile-ups at the part join ('Pell'+'lion' → 'Pellion', never 'Pelllion')
  const name = (rng.pick(first[0]!) + rng.pick(first[1]!)).replace(/(.)\1\1+/g, '$1$1');
  return rng.chance(0.35) ? `${name} ${rng.pick(p.epithets)}` : name;
}

const RELIC_ADJ = ['Weathered', 'Gilded', 'Silent', 'Broken', 'Old', 'Salt-stained', 'Painted', 'Iron', 'Pale', 'Twin',
  'Mossgrown', 'Ashen', 'Riverworn', 'Lacquered', 'Nicked', 'Hollow', 'Amber', 'Sooted', 'Threadbare', 'Kingless'];
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

/** emergent lorebook place names (villages, taverns — AI may also coin these freely) */
export function rollPlaceName(rng: Rng): string {
  const a = ['Ash', 'Bram', 'Cold', 'Dun', 'Elm', 'Fal', 'Grey', 'Haw', 'Mill', 'Oak', 'Raven', 'Stone', 'Thorn', 'Wold'];
  const b = ['brook', 'combe', 'ford', 'gate', 'hollow', 'march', 'mere', 'stead', 'well', 'wick'];
  return rng.pick(a) + rng.pick(b);
}
