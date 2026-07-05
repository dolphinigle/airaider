// Keyword seeds — §5: ONE unlabeled KEYWORDS line; sampling = 1 BOND + 1 TIE + 2 WILDCARDS
// (wildcards uniform over THINGS ∪ OCCASIONS ∪ PEOPLE ∪ UNCANNY ∪ MOODS).
// Prototype-scale pools (the full ~2,500-entry set is content work, append-to-grow).

import type { Rng } from '../engine/rng.js';

const BOND = [
  'blood debt', 'old oath', 'shared scar', 'buried secret', 'broken betrothal', 'sworn silence',
  'war comrade', 'estranged kin', 'unpaid ransom', 'stolen credit', 'mentor’s shame', 'rival’s respect',
  'forbidden letters', 'childhood pact', 'divided inheritance', 'mutual blackmail', 'saved life', 'denied parentage',
];
const TIE = [
  'guild charter', 'border toll', 'smuggling route', 'tithe ledger', 'grain contract', 'marriage alliance',
  'disputed well', 'poaching rights', 'temple lease', 'salvage claim', 'mill dam', 'burial ground',
  'road warden’s writ', 'harbor berth', 'seized cargo', 'bounty posting',
];
const THINGS = [
  'millstone', 'forgery', 'church face', 'salt cellar', 'wedding ring', 'branded hide', 'broken seal',
  'mourning veil', 'tin whistle', 'lodestone', 'wax tablet', 'hunting horn', 'a will', 'reliquary',
  'ferry rope', 'signal lantern', 'moth-eaten banner', 'second key',
];
const OCCASIONS = [
  'wedding', 'wake', 'harvest fair', 'execution day', 'first frost', 'muster', 'pilgrimage',
  'eclipse', 'spring flood', 'census', 'tourney', 'quarantine',
];
const PEOPLE = [
  'hedge-knight', 'wet nurse', 'deserter', 'moneylender', 'gravedigger', 'itinerant judge',
  'falconer', 'plague doctor', 'bell-ringer', 'horse thief', 'letter-carrier', 'widowed brewer',
];
const UNCANNY = [
  'hollow hill', 'talking raven', 'dream shared twice', 'bleeding stone', 'wrong reflection',
  'candle that relights', 'salt circle', 'nameless grave', 'backwards footprints', 'silent bell',
];
const MOODS = [
  'grudging', 'feverish', 'threadbare', 'gallows-humored', 'homesick', 'defiant', 'penitent', 'greedy-hearted',
];

const WILDCARD_UNION = [...THINGS, ...OCCASIONS, ...PEOPLE, ...UNCANNY, ...MOODS];

/** 1 BOND + 1 TIE + 1-2 WILDCARDS (§5 locked sampler; ~25% of draws go leaner, for texture) */
export function sampleKeywords(rng: Rng): string[] {
  const draw = [rng.pick(BOND), rng.pick(TIE), rng.pick(WILDCARD_UNION)];
  if (!rng.chance(0.25)) draw.push(rng.pick(WILDCARD_UNION));
  return draw;
}

/** engine-rolled opening seed (STORY_GEN: a positive seed each card beats telling the model "rotate") */
const OPENING_MODES = [
  'a petitioner at the gate', 'a nailed posting or writ', "a returning patrol's report",
  'a prisoner or survivor brought in', 'wreckage or a body found on the road',
  'a summons from the fort outward', 'rumor at market', 'a messenger who will not dismount',
];
const OPENING_TIMES = ['at first light', 'mid-morning', 'at noon', 'late afternoon', 'at dusk', 'after dark', 'in the small hours'];
export function sampleOpening(rng: Rng): { mode: string; time: string; landmarkAllowed: boolean } {
  return { mode: rng.pick(OPENING_MODES), time: rng.pick(OPENING_TIMES), landmarkAllowed: rng.chance(0.25) };
}

/** saga tone, weighted toward lighter (BIBLE.md tone knob; PLAYER_PREFERENCES shift is a later 🛠) */
const TONES: [string, number][] = [
  ['slice-of-life', 2], ['wry', 3], ['warm', 2], ['bittersweet', 2], ['grim', 2], ['dark', 1],
];
export function pickTone(rng: Rng): string { return rng.weighted(TONES) }

/** seed sparks for chain genesis (Polti-anchored what-ifs, weighted by region later 🛠) */
const SEEDS = [
  'a ransom paid to the wrong hands', 'an heir who does not want to be found',
  'a debt sold three times over', 'a relic that two shrines both claim',
  'a deserter who knows where the bodies are', 'a betrothal that would end a feud',
  'a list of names the respectable would kill to burn', 'a beast that only hunts the guilty',
  'a will that frees the wrong people', 'a siege that ended too quietly',
  'a smuggler’s route that moves more than goods', 'a caged singer whose songs start riots',
];
export function sampleSeed(rng: Rng): string { return rng.pick(SEEDS) }
