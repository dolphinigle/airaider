// HAND-CRAFTED STORY SEEDS — the better fix for premise variety (deriving the bible purely from the
// focal's tags converges on one shape). Genesis draws ONE premise + ONE place and FUSES them with the
// rolled focal. Premises are concrete dramatic SITUATIONS (with a built-in tension) but written to be
// adaptable to whatever person the engine rolled — the genesis adapts the specifics to the focal's tags.
//
// This is a SEED set meant to grow toward 1000+. To add variety, just append strings — no other code
// changes needed. Keep them: concrete, one human situation each, fen/low-medieval, NOT tied to a
// particular gender/profession, and NOT resolved (the genesis writes who/why). Avoid the model's stock
// crutches (a sunk barge, a burned ledger, a magistrate's cargo inquiry).

export const PREMISES: string[] = [
  // — kinship, blood, inheritance —
  'A child is being raised by someone who knows the child is not theirs, and the true parent has come back to claim them.',
  'Two siblings inherit one cottage and one has quietly had the other struck from the deed.',
  'A stranger arrives claiming to be the heir of a house everyone believed drowned, and half their proof is genuine.',
  'An old soldier has lived for years under a dead comrade’s name to draw his pension; the comrade’s kin have found them.',
  'A dying elder wants to confess a thing that will overturn who inherits, and the family is racing to keep them quiet.',
  'A foundling left at a hamlet years ago has grown up, and the one who abandoned them is now their neighbour.',
  'A family keeps a grown child hidden away, and a tax-reeve counting heads has started asking who lives in the back room.',

  // — love, betrothal, marriage —
  'A betrothal arranged to end a feud collapses the night the bride is found already secretly wed.',
  'A widow is being courted by the very man she believes drove her husband to his death.',
  'Two people who love each other are each bound by an oath of service that forbids them to leave together.',
  'A marriage of convenience is unravelling because one partner has fallen in love with the other’s sibling.',
  'A go-between hired to arrange a match has fallen for the bride and is sabotaging the wedding from inside.',
  'A man pays every season for the upkeep of a grave no one else visits, and his wife has begun to wonder whose it is.',

  // — debt, obligation, oaths —
  'A life-debt sworn on a battlefield is being called in, and the price is something the debtor cannot bear to give.',
  'A hamlet owes its survival to a lender who now wants a person handed over instead of coin.',
  'A favour done long ago in the dark is being repaid with a demand that would ruin the one who asks it.',
  'Someone has pledged a thing they did not own to settle a debt, and the true owner is about to find out.',
  'A retired killer is being hunted by the family of a man they put down on someone else’s orders.',
  'A promise made to a dying friend — to keep their child fed — has become impossible as the one thing that helped the child dies out.',

  // — feud, community, scarcity —
  'Two families have shared one well for generations; this drought, one has fenced it off.',
  'A new toll on the only dry road is slowly starving a fen-hamlet, and someone has begun wrecking the toll-gate by night.',
  'A boundary-stone has been moved in the night, and a quiet quarrel is sharpening toward blood.',
  'A village blessing-relic has vanished and neighbour is accusing neighbour faster than anyone can think.',
  'A drainage cut that saves one hamlet’s fields is flooding another’s, and patience on both sides has run out.',
  'A shared grazing-common is being enclosed by one household, and the rest are deciding whether to tear the fences down.',
  'A respected family is quietly buying up every debt in a hamlet, and people are beginning to understand what that means.',

  // — faith, the uncanny, folk-magic —
  'A shrine’s idol has begun to weep, and pilgrims are arriving faster than the village can feed them.',
  'A hedge-priest has been burying the unbaptised in consecrated ground, and a bishop’s man is on the road to check.',
  'A healer’s cures all draw on one forbidden source, and her patients are starting to ask why they work.',
  'Something in the fen has been answering when a lonely child calls to it, and the child has stopped being afraid.',
  'A holy spring has gone bitter, and the village has decided someone’s sin is the cause and means to name them.',
  'A travelling relic-seller’s bones have begun to do what relics are supposed to do, and that is the problem.',
  'A house keeps its dead unburied through the cold months by old custom, and a new reeve means to put a stop to it.',

  // — guilt, old crimes resurfacing —
  'A fire years ago that an elder could have stopped made their fortune, and the only survivor has just walked back into town.',
  'Someone helped frame an innocent long ago; new testimony has surfaced and amends may no longer be possible.',
  'A respected figure has been quietly paying off the one witness who could undo them, and the witness wants more.',
  'A grave has been found empty, and the person who knows why has spent ten years pretending they don’t.',
  'A craftsman’s signature mark is turning up on work they never made, and the forger is someone they trust.',
  'Letters are being forged to wreck a betrothal, and the handwriting is too good to be a stranger’s.',

  // — rescue, danger, the clock —
  'A child has wandered into the drowned ruins at low tide and the water is coming back.',
  'A healer is shut inside a hamlet the town means to burn at dawn to stop a sickness.',
  'A prisoner is being walked to a hanging, and there are only hours to prove the wrong person was taken.',
  'Someone is trapped where a tide-gate or a barrow-door will seal hard at a fixed hour, and no one else will go in.',
  'A person everyone has written off as already dead has been seen alive, held somewhere, and the window to reach them is closing.',
  'A storm is coming that the dykes won’t hold, and the one who knows which to cut to save the rest won’t say.',

  // — grief, revenge, plans gone wrong —
  'A parent is methodically ruining the man whose carelessness killed their child, and the innocent are being caught in it.',
  'Grief has curdled into a quiet plan to harm someone who does not deserve it, and only one person has guessed.',
  'A bereaved spirit-talker has begun calling something back that should have been let go.',
  'Someone is poisoning a household by inches, sure they are owed it, and the wrong person is starting to sicken first.',

  // — bondage, escape, the powerless —
  'A smuggler moves people, not goods, out of bondage — and one they freed was never meant to be freed.',
  'A bonded servant is diverting small coins to keep a sibling out of worse bondage, and the master has started counting.',
  'A runaway has reached a place that could shelter them, but doing so would bring a powerful family down on everyone there.',
  'A press-gang or a levy is coming, and a hamlet is hiding the one person they cannot afford to lose.',

  // — work, craft, the ordinary made dire —
  'A craftsman is going blind and racing to finish one last commission that will secure their family before anyone notices.',
  'A ferry or a mill that a whole district depends on is failing, and only its keeper knows it cannot be saved.',
  'An old couple mean to end things on their own terms before winter and have asked for a help no one will give them.',
  'A young person wants to leave the only life they’ve known, and the whole hamlet is quietly conspiring to keep them.',
  'A reputation for a useful talent has become a cage — everyone wants the thing, no one wants the person.',
  'A homecoming after years away forces a life the traveller had carefully hidden into the open.',

  // — power, intrigue, the local great —
  'A steward has been skimming from a lord’s charity and means to pin it on the people it was meant to feed.',
  'An election or a succession among local elders turns on one disputed witness everyone is now courting or threatening.',
  'A garrison captain is selling protection to the very raiders he’s paid to drive off, and a junior has noticed.',
  'A landholder is forcing tenants off good ground with a story of a curse they invented, and it is starting to come true.',
  'Two claimants to a guild’s mastership each hold half the proof, and the third person who could decide it has gone missing.',

  // — strangers, arrivals, claims —
  'A stranger arrives wounded with a tale that doesn’t add up and a name that means something to exactly one person here.',
  'A child appears at the gate able to describe a house and a family with uncanny accuracy, and none of it is supposed to exist anymore.',
  'A returning veteran is greeted as a hero by people who do not know what they actually did out there.',
  'Someone has come to settle an old score and discovered the person they hate is already destroyed — and now doesn’t know what to do.',

  // — the land, the season, the fen itself —
  'The peat has given up a body that did not rot, and three different families recognise the face.',
  'A drowned chapel surfaces at an unusually low tide, and what’s inside was meant to stay under.',
  'The eels haven’t run this season and a stilt-village is quietly starving while pretending it isn’t.',
  'A sinkhole has opened under a graveyard and the village must decide, fast, whose dead to save.',
  'A bog-fire underground won’t go out, and it’s creeping toward the one dry road and the one full granary.',
];

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

// THEME KEYWORDS — the better premise seed (experiment-validated, see STORY_GEN_STATE.md): instead of a
// fixed concrete premise (which ignores the focal's tags and reads "canned"), hand genesis a few raw
// theme words and let it FUSE them into THIS person's life. Cheap AI can't "vary" on command but it CAN
// combine given sparks. Drawn one-per-register (a BOND + a TIE + a FLAVOUR) so the fuel is well-rounded:
// an emotional axis, a plot axis, a concrete hook. Combinatorially huge (≫ a fixed premise list) and the
// focal's craft/magic/trade ends up central. Append freely to grow.
export const THEME_BOND = ['love', 'jealousy', 'grief', 'betrayal', 'loyalty', 'revenge', 'forgiveness', 'shame', 'devotion', 'obsession', 'estrangement', 'reunion', 'rivalry', 'guilt', 'mercy', 'longing', 'pride', 'spite', 'envy', 'duty', 'tenderness', 'resentment'];
export const THEME_TIE  = ['debt', 'bondage', 'exile', 'heresy', 'an oath', 'blackmail', 'smuggling', 'desertion', 'impersonation', 'pilgrimage', 'sacrifice', 'inheritance', 'a feud', 'theft', 'ransom', 'escape', 'rebellion', 'a secret marriage', 'kidnapping', 'a succession', 'a debt of honour', 'a broken vow', 'sanctuary', 'a wager'];
export const THEME_FLAV = ['werewolf', 'a curse', 'a ghost', 'a witch', 'a relic', 'a miracle', 'an omen', 'plague', 'famine', 'the drowned dead', 'a fae bargain', 'a prophecy', 'a haunting', 'a bog-body', "a saint's bones", 'a changeling', 'a twin', 'a bastard heir', 'a hidden letter', 'leprosy', 'madness', 'fire', 'a flood', 'a mask', 'a foundling', 'a deathbed promise'];

const tpick = (a: string[], r: () => number) => a[Math.floor(r() * a.length)];

/** A structured theme spark: one bond + one tie + one flavour, as a comma list (the genesis FUSES them). */
export function pickThemes(r: () => number): string {
  return [tpick(THEME_BOND, r), tpick(THEME_TIE, r), tpick(THEME_FLAV, r)].join(', ');
}

// PROP SEEDS — the LOAD-BEARING OBJECT a story's proof/prize turns on. Unseeded, the model converges on
// "a ledger" in nearly every saga (measured: 8–72 mentions per campaign). Seeding the slot beats banning
// the token (PROMPT_RULES §2). Append freely; keep them physical, low-medieval, story-flexible.
export const PROPS: string[] = [
  'a branded hide', 'a signet ring', 'a bundle of letters', 'a notched tally-stick', 'a wax seal-die',
  'a carved token', 'a betrothal cup', 'a soldier’s medal', 'a reliquary', 'a key without its lock',
  'a christening shawl', 'a deed witnessed by three', 'a prized beast', 'a funeral mask', 'a church bell',
  'a smith’s punch-mark', 'a lock of braided hair', 'a map cut in halves', 'a poison vial', 'a wedding band',
  'a saint’s finger-bone', 'a child’s toy', 'an old battle-standard', 'a cargo manifest nailed to a mast',
  'a millstone’s maker-mark', 'a falcon’s jesses', 'a set of weighted dice', 'a pilgrim’s badge',
  'a ransom note', 'a confession sealed for the grave',
];
export function pickProp(r: () => number): string { return tpick(PROPS, r); }

// PRESSURE SEEDS — WHY the matter cannot wait. Unseeded, every saga defaulted to "the tide/surge comes".
export const PRESSURES: string[] = [
  'a rival means to move first', 'the debt falls due', 'a wedding is days away', 'a magistrate is on the road',
  'the patron is losing patience', 'the season turns and the roads close', 'a ship sails at week’s end',
  'the accused hangs at the next assize', 'a feast-day crowd is coming', 'the levy musters soon',
  'a buyer leaves with the next caravan', 'the sickness is spreading', 'winter stores are running out',
  'the old keeper is dying', 'a pilgrimage arrives within days', 'the garrison rotates out',
  'the tide will bury it again', 'a witness is about to leave for good',
];
export function pickPressure(r: () => number): string { return tpick(PRESSURES, r); }

// CLIENT SEEDS — WHO wants this done and what they are to the matter. Unseeded, every client was a
// shrewd merchant posting coin.
export const CLIENTS: string[] = [
  'a guild that wants it handled quietly', 'a widow with the dead man’s savings', 'kin of the victim',
  'a rival of the wrongdoer, paying out of spite', 'an official with a quota to meet', 'a village pooling its coin',
  'the wrongdoer themselves, covering tracks', 'an old comrade calling in a favour', 'a landlord protecting rents',
  'a churchman keeping scandal from the bishop', 'a moneylender protecting collateral', 'a parent who won’t say why',
  'a betrothed protecting the match', 'an innkeeper whose trade is dying', 'a steward acting without their lord’s knowledge',
  'a freed servant repaying an old kindness',
];
export function pickClient(r: () => number): string { return tpick(CLIENTS, r); }

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
