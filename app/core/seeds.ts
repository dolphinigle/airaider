// (the old hand-crafted PREMISES list is superseded by the keyword pools — see keywords.ts / GENERATION_FLOW §5)

// CONCRETE PLACES within the salt-fen world — drawn as the specific SETTING so sagas don't all read as
// "a fen-hamlet". Also a growing list; append freely. Keep them low-medieval and fen-appropriate.
export const PLACES: string[] = [
  'a half-drowned lock-keeper’s cottage on the dyke',
  'the eel-fishers’ stilt-village at Reedmark',
  'a peat-cutters’ camp on the Black Fen',
  'the hedge-shrine and holy spring at Coldwell',
  'the bog-iron smeltery at Slagmere',
  'a leper-house on Gull Island',
  'the drowned chapel of St. Maru, bared only at low tide',
  'the cattle-fair on the dry rise at Ashmoor Cross',
  'a salt-boiling works out on the tidal flats',
  'the watch-fort at Saltreach Gate',
  'a reed-weavers’ longhouse',
  'the pilgrim road up to the weeping shrine',
  'a smugglers’ tide-cave below the cliffs',
  'the drovers’ inn at the dry-ground crossing',
  'a fen-hermit’s reed hut out on the Mire',
  'the tollhouse on the lazar bridge',
  'a graveyard of sunken barges in the slack water',
  'the hill-forge above Ashmoor',
  'a peat-bog where the dead do not rot',
  'the market quay at Lower Kovar',
  'a tide-mill that only turns twice a day',
  'a sheep-walk on the high reed-meadows',
  'the alms-house and its walled physic-garden',
  'a wildfowler’s blind among the high reeds',
  'the moot-stone where the hundred meets',
  'a flooded osier-bed cut through with narrow channels',
  'the kennels and mews of a fen-lord’s manor',
  'a withy-and-daub hamlet ringed by floodwater',
  'the saltern cottages on the brackish edge',
  'an abandoned abbey grange sinking into the marsh',
  'the cockle-pickers’ strand at low water',
  'a charcoal-burners’ clearing on the wooded rise',
  'the garrison’s lazaretto outside the walls',
  'a ferry-crossing where the channel shifts with the tide',
  'the night-soil men’s wharf below the town',
  'a hedge-chapel at a crossroads gibbet',
  'the drowned water-meadows after a dyke-burst',
  'a beekeeper’s heath above the fen',
  'the shambles and tannery row by the cut',
  'a wrecker’s cottage on the storm coast',
  'the old causeway that floods at spring tide',
  'a quarantine hulk moored off the quay',
  'the reed-thatched grange of a failing manor',
  'a hunting-lodge stranded by the rising water',
];

export function pickPlace(r: () => number, avoid: string[] = []): string {
  // avoid-window like names: two same-session sagas drew the same landmark ("…of the High Walk" twice)
  const pool = PLACES.filter((p) => !avoid.includes(p));
  const from = pool.length ? pool : PLACES;
  return from[Math.floor(r() * from.length)];
}

// THEME/PROP/PRESSURE/CLIENT pools superseded by keywords.ts (GENERATION_FLOW §5).
export { pickKeywords } from './keywords.js';




// NAME SEEDS — a broad, sound-varied given-name pool the engine hands to genesis so the AI doesn't
// converge on the same handful of names (Marek / Sigrun / Wren…). The AI may use these or riff on their
// SOUND; the point is decorrelation, not a fixed cast. (Engine-seed-beats-AI-vary, PROMPT_RULES §2.)
const NAME_SEEDS = [
  'Talin', 'Yorsa', 'Bevan', 'Nilse', 'Orrin', 'Haldra', 'Cael', 'Vesna', 'Doran', 'Ysolde',
  'Garrick', 'Maelis', 'Toller', 'Brannoch', 'Senna', 'Ourik', 'Lisbet', 'Hagen', 'Perrin', 'Aldith',
  'Riska', 'Movar', 'Edrun', 'Sable', 'Korrin', 'Yelena', 'Drust', 'Mably', 'Fenwick', 'Corra',
  'Ulric', 'Nesta', 'Bram', 'Oswin', 'Tamsin', 'Voss', 'Hethra', 'Calder', 'Wynn', 'Jessa',
  'Roban', 'Imke', 'Sorrel', 'Davos', 'Kestrel', 'Anika', 'Merrow', 'Tibalt', 'Greer', 'Lune',
];
// ARRIVAL SPARKS — a bag of keyword seeds for HOW a job reaches the boss's desk. The engine throws a
// random one or two; the AI weaves them into the scene (like themes). Decorrelates the opening WITHOUT
// prescribing a full sentence (a full sentence got copied verbatim).
const ARRIVAL_WHO = ['one of your own mercs', 'a petitioner', 'a frightened runner', 'a courier', 'a creditor', 'a passing trader', 'a child', 'a rival', 'an old contact', 'a town official', 'a wounded survivor', 'a hooded stranger'];
const ARRIVAL_HOW = ['a sealed letter', 'a posted notice', 'urgent word', 'a plea', 'a summons', 'a warrant', 'a torn map', 'a whispered tip', 'a bounty', 'a debt called in'];
/** One or two arrival keyword-sparks for the AI to weave into the opening. */
export function pickArrival(r: () => number): string {
  const who = ARRIVAL_WHO[Math.floor(r() * ARRIVAL_WHO.length)];
  const how = ARRIVAL_HOW[Math.floor(r() * ARRIVAL_HOW.length)];
  return r() < 0.6 ? `${who}, ${how}` : who;   // sometimes just the bringer, sometimes bringer + how
}
/** A few fresh name seeds for the genesis to draw from / riff on. */
export function pickNameSeeds(r: () => number, n = 5): string[] {
  return [...NAME_SEEDS].map((name) => ({ name, k: r() })).sort((a, b) => a.k - b.k).slice(0, n).map((x) => x.name);
}

// STORY TONE — the engine sets the register so NOT every saga is grim/scary. Weighted toward the lighter
// end (most jobs are ordinary); the heavy registers are rarer and land harder for being so.
const TONES: Array<{ tone: string; w: number }> = [
  { tone: 'a light SLICE-OF-LIFE — a small, low-stakes human problem; warm or wry, no one in real danger', w: 3 },
  { tone: 'a WRY, roguish caper — trouble, banter, a scheme; fun more than fraught', w: 2 },
  { tone: 'a tender, BITTERSWEET tale — quiet feeling, a small loss or kindness, melancholy not menace', w: 2 },
  { tone: 'an ADVENTUROUS romp — a journey, a find, a risk worth taking for its own sake', w: 2 },
  { tone: 'a TENSE situation — real stakes and pressure, but not yet horror', w: 2 },
  { tone: 'a DARK, serious saga — danger, dread, hard choices; let it be heavy', w: 1 },
];
const TONE_TOTAL = TONES.reduce((s, t) => s + t.w, 0);
/** Pick a tone (weighted) so the engine, not the AI, sets each saga's register. */
export function pickTone(r: () => number): string {
  let x = r() * TONE_TOTAL;
  for (const t of TONES) { if ((x -= t.w) < 0) return t.tone; }
  return TONES[0].tone;
}
