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

export function pickPlace(r: () => number): string {
  return PLACES[Math.floor(r() * PLACES.length)];
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
