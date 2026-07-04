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

/** 1 BOND + 1 TIE + 2 WILDCARDS (§5 locked sampler) */
export function sampleKeywords(rng: Rng): string[] {
  return [rng.pick(BOND), rng.pick(TIE), rng.pick(WILDCARD_UNION), rng.pick(WILDCARD_UNION)];
}

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
