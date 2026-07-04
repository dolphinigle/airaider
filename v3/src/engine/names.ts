// Names — §4b: the ENGINE rolls a name for EVERY character that materializes.
// The AI receives assigned names and uses them as-is, never inventing its own.

import type { Rng } from './rng.js';

const PARTS: Record<string, { first: string[][]; epithets: string[] }> = {
  human: {
    first: [
      ['Al', 'Bran', 'Cas', 'Dor', 'Ed', 'Fen', 'Gar', 'Hal', 'Jor', 'Kel', 'Lam', 'Mar', 'Ned', 'Os', 'Pell', 'Quin', 'Rod', 'Sam', 'Tom', 'Wil', 'Ys', 'Bet', 'Cla', 'El', 'Gwen', 'Isa', 'Mag', 'Ros', 'Sar', 'Tilda'],
      ['ric', 'den', 'ton', 'win', 'mund', 'bert', 'fred', 'gard', 'helm', 'man', 'ny', 'ard', 'a', 'eth', 'ine', 'wen', 'da', 'ra', 'lin', 'et'],
    ],
    epithets: ['of the Ford', 'Longshanks', 'the Quiet', 'Redhand', 'of Millbrook', 'the Younger', 'Ashworth', 'Coalgate', 'Thatcher', 'Reed'],
  },
  elf: {
    first: [
      ['Ae', 'Cael', 'Elo', 'Fae', 'Ith', 'Lia', 'Mael', 'Nim', 'Ori', 'Sylv', 'Thal', 'Vael', 'Yll', 'Ara', 'Eir',
       'Bri', 'Cor', 'Dae', 'Gal', 'Hele', 'Ilm', 'Kess', 'Lor', 'Mira', 'Nae', 'Ola', 'Pell', 'Quil', 'Rhi', 'Sera', 'Tia', 'Une', 'Wist'],
      ['wen', 'rion', 'thil', 'anor', 'iel', 'las', 'dir', 'wyn', 'nith', 'rael', 'ion', 'a', 'is',
       'dai', 'eth', 'inne', 'lion', 'mar', 'neth', 'olas', 'ryn', 'sha', 'via'],
    ],
    epithets: ['Leafshade', 'of Thornhollow', 'Dawnsinger', 'Mosswalker', 'Palebough', 'Windrow'],
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

export function rollName(rng: Rng, race: string): string {
  const p = PARTS[race] ?? PARTS.human!;
  const name = rng.pick(p.first[0]!) + rng.pick(p.first[1]!);
  return rng.chance(0.35) ? `${name} ${rng.pick(p.epithets)}` : name;
}

const RELIC_ADJ = ['Weathered', 'Gilded', 'Silent', 'Broken', 'Old', 'Salt-stained', 'Painted', 'Iron', 'Pale', 'Twin'];
const RELIC_NOUN: Record<string, string[]> = {
  'melee-weapon': ['Blade', 'Axe', 'Maul', 'Spear', 'Dirk'],
  'ranged-weapon': ['Bow', 'Sling', 'Arbalest', 'Javelin'],
  armor: ['Hauberk', 'Helm', 'Shield', 'Cuirass'],
  clothes: ['Cloak', 'Robe', 'Veil', 'Mantle'],
  accessory: ['Ring', 'Chain', 'Brooch', 'Signet'],
  document: ['Ledger', 'Charter', 'Map', 'Letters'],
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
