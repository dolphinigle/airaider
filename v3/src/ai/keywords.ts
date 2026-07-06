// Keyword seeds — §5: ONE unlabeled KEYWORDS line; sampling = 1 BOND + 1 TIE + 1-2 WILDCARDS
// (wildcards uniform over THINGS ∪ OCCASIONS ∪ PEOPLE ∪ UNCANNY ∪ MOODS).
// Pools ported whole from v2-final app/core/keywords.ts (~2,400 entries; append-to-grow).
// STYLE BAR: bare words; 1-3 words; evocative-generic, never a micro-premise; low-medieval;
// no proper nouns; no cross-pool dupes.

import type { Rng } from '../engine/rng.js';

// ---- BOND (~500): emotions, stances, relations — the draw's emotional axis -------------------
export const BOND: string[] = [
  // raw feeling
  'grief', 'longing', 'spite', 'envy', 'dread', 'shame', 'pride', 'guilt', 'rage', 'pity',
  'tenderness', 'contempt', 'awe', 'loneliness', 'homesickness', 'jealousy', 'devotion', 'resentment',
  'gratitude', 'mercy', 'malice', 'remorse', 'yearning', 'bitterness', 'adoration', 'loathing',
  'wonder', 'despair', 'hope', 'relief', 'humiliation', 'vindication', 'heartbreak', 'infatuation',
  'disgust', 'terror', 'melancholy', 'glee', 'scorn', 'reverence', 'suspicion', 'trust',
  'mistrust', 'forgiveness', 'unforgiveness', 'regret', 'nostalgia', 'restlessness', 'serenity', 'fury',
  // stances & habits of heart
  'stubbornness', 'cowardice', 'bravado', 'humility', 'vanity', 'greed', 'generosity', 'patience',
  'impatience', 'cruelty', 'kindness', 'caution', 'recklessness', 'cunning', 'innocence', 'worldliness',
  'zeal', 'apathy', 'curiosity', 'denial', 'obstinacy', 'meekness', 'arrogance', 'modesty',
  'pettiness', 'magnanimity', 'severity', 'leniency', 'rigour', 'sloth', 'industry', 'thrift',
  'extravagance', 'prudence', 'folly', 'wisdom', 'naivety', 'cynicism', 'idealism', 'fatalism',
  'defiance', 'obedience', 'servility', 'rebelliousness', 'loyalty', 'disloyalty', 'fickleness', 'constancy',
  // bonds between people
  'rivalry', 'kinship', 'brotherhood', 'sisterhood', 'fellowship', 'enmity', 'courtship', 'estrangement',
  'reunion', 'betrayal', 'reconciliation', 'mentorship', 'apprentice loyalty', 'first love', 'old love', 'lost love',
  'forbidden love', 'unrequited love', 'married silence', 'widowed love', 'mother love', 'father hunger',
  'orphan longing', 'sibling rivalry', 'twin bond', 'blood feud', 'sworn friendship', 'broken friendship',
  'soldier fellowship', 'shield-brotherhood', 'oath kinship', 'milk kinship', 'foster bond', 'ward bond',
  'master and servant', 'debtor and lender', 'hunter and quarry', 'jailer and prisoner', 'healer and patient',
  'priest and doubter', 'teacher and pupil', 'rival heirs', 'rival suitors', 'rival craftsmen', 'rival houses',
  'old comrades', 'old enemies', 'new neighbours', 'estranged kin', 'distant cousins', 'in-laws',
  // shaded, specific feelings (2-3 words)
  'cold charity', 'borrowed courage', 'quiet hatred', 'public devotion', 'private doubt', 'old guilt',
  'fresh grief', 'inherited grudge', 'misplaced trust', 'earned distrust', 'reluctant respect', 'grudging love',
  'feigned indifference', 'hidden admiration', 'jealous guardianship', 'smothering care', 'wounded pride', 'borrowed shame',
  'survivor guilt', 'deathbed tenderness', 'gallows humour', 'famine temper', 'harvest joy', 'winter patience',
  'pilgrim hope', 'convert zeal', 'apostate doubt', 'exile longing', 'homecoming fear', 'stranger kindness',
  'neighbourly spite', 'village pity', 'crowd cruelty', 'mob courage', 'lonely vigilance', 'shared silence',
  'sworn silence', 'guilty silence', 'protective lies', 'loving deceit', 'honest cruelty', 'kind cowardice',
  'brave despair', 'cheerful menace', 'gentle ruthlessness', 'patient vengeance', 'hasty mercy', 'weary duty',
  'glad obedience', 'sullen service', 'eager servitude', 'proud poverty', 'ashamed wealth', 'guilty comfort',
  'envious admiration', 'admiring envy', 'fearful love', 'loving fear', 'holy terror', 'profane joy',
  'sour gratitude', 'sweet revenge', 'stale anger', 'banked fury', 'kindled hope', 'doused hope',
  'second thoughts', 'cold feet', 'iron resolve', 'failing nerve', 'borrowed time', 'stolen happiness',
  'unearned fame', 'earned infamy', 'quiet heroism', 'loud piety', 'secret pride', 'open scorn',
  'old tenderness', 'new suspicion', 'mutual need', 'one-sided love', 'mutual hatred', 'wary truce',
  'forced politeness', 'false cheer', 'true grief', 'practised grief', 'borrowed grief', 'rented loyalty',
  'bought silence', 'sold honour', 'pawned dignity', 'redeemed honour', 'squandered trust', 'hoarded love',
  // appetites & drives
  'ambition', 'lust', 'gluttony', 'wanderlust', 'bloodlust', 'gold hunger', 'land hunger', 'name hunger',
  'glory hunger', 'belonging', 'escape', 'oblivion', 'recognition', 'legacy', 'atonement', 'absolution',
  'redemption', 'salvation', 'damnation', 'temptation', 'obsession', 'compulsion', 'addiction', 'craving',
  'self-denial', 'self-punishment', 'self-deception', 'self-importance', 'self-pity', 'self-sacrifice',
  'martyrdom', 'penance', 'confession hunger', 'secret keeping', 'truth hunger', 'gossip hunger',
  // duties & weights of place
  'duty', 'obligation', 'responsibility', 'stewardship', 'guardianship', 'wardship', 'fealty', 'allegiance',
  'patriot love', 'clan pride', 'family honour', 'house shame', 'name shame', 'trade pride', 'craft pride',
  'guild loyalty', 'parish duty', 'neighbour duty', 'host duty', 'guest right', 'salt bond', 'bread debt',
  'roof debt', 'life debt', 'blood debt', 'honour debt', 'gambling debt', 'gratitude debt',
  // fears
  'fear of water', 'fear of fire', 'fear of dark', 'fear of crowds', 'fear of priests', 'fear of dogs',
  'fear of debt', 'fear of shame', 'fear of dying poor', 'fear of dying alone', 'fear of being known', 'fear of being forgotten',
  'fear of the fen', 'fear of the sea', 'fear of winter', 'fear of childbirth', 'fear of madness', 'fear of heights',
  // griefs & losses
  'mourning', 'unfinished mourning', 'denied mourning', 'public mourning', 'mourning cut short', 'mourning overlong',
  'child loss', 'spouse loss', 'parent loss', 'friend loss', 'home loss', 'limb loss',
  'sight loss', 'voice loss', 'memory loss', 'faith loss', 'face loss', 'fortune loss',
  // odd, vivid stances
  'borrowed plumage', 'small tyranny', 'petty kingdom', 'kitchen pride', 'doorstep honour', 'market face',
  'church face', 'tavern truth', 'morning regret', 'night courage', 'fair-weather faith', 'foxhole prayer',
  'one good deed', 'one bad day', 'last straw', 'first offence', 'old habit', 'new leaf',
  'second chance', 'third strike', 'final warning', 'last kindness', 'parting gift', 'cold shoulder',
  'long memory', 'short fuse', 'thick skin', 'thin patience', 'hard bargain', 'soft heart',
  'sharp tongue', 'still water', 'slow burn', 'quick temper', 'high horse', 'low cunning',
  'dumb luck', 'sore loser', 'gracious winner', 'bitter winner', 'happy loser', 'bad blood',
  'good riddance', 'fond farewell', 'unwelcome return', 'prodigal welcome', 'overdue apology', 'refused apology',
  'unsaid thanks', 'unpaid respects', 'empty condolence', 'true condolence', 'crocodile tears', 'honest tears',
];

// ---- MOODS (~100): genre / mode words — what KIND of story this wants to be -------------------
export const MOODS: string[] = [
  'adventure', 'mystery', 'tragedy', 'comedy', 'farce', 'romance', 'caper', 'heist',
  'intrigue', 'scandal', 'conspiracy', 'whodunit', 'chase', 'siege', 'standoff',   'rescue', 'downfall', 'comeuppance', 'windfall', 'reversal',
  'homecoming', 'farewell', 'initiation', 'awakening', 'reckoning', 'corruption',
  'seduction', 'conversion', 'odyssey', 'vigil', 'haunting',   'masquerade', 'mistaken identity', 'double life', 'long con', 'slow poison', 'cold case',
  'last stand', 'fool\'s errand', 'wild goose chase', 'treasure hunt', 'race against time', 'game of nerves',
  'battle of wits', 'war of whispers', 'trial', 'ordeal', 'duel',
  'courtship dance', 'cat and mouse', 'tug of war', 'house of cards', 'powder keg', 'slow thaw',
  'gathering storm', 'calm before storm', 'aftermath', 'cleanup', 'unravelling',
  'domino fall', 'snowball', 'spiral', 'descent', 'ascent', 'tightrope',
  'crossroads', 'point of no return', 'eleventh hour', 'dawn raid', 'long night',   'bad bargain', 'devil\'s bargain', 'pyrrhic victory', 'hollow victory', 'narrow escape', 'near miss',
  'comedy of errors', 'tangled web', 'bedlam', 'quiet dread', 'creeping rot', 'small mercy',
  'minor miracle', 'everyday heroism', 'banal evil', 'petty apocalypse', 'storm in a teacup', 'tempest',
];

// ---- TIE (~500): plot situations & mechanics — the draw's story axis --------------------------
export const TIE: string[] = [
  // pacts, promises, words given
  'wager', 'oath', 'broken vow', 'deathbed promise', 'secret betrothal', 'forced betrothal',
  'broken betrothal', 'elopement', 'secret marriage', 'sham marriage', 'marriage of convenience', 'annulment',
  'blood oath', 'peace pact', 'broken truce', 'surrender terms', 'parley',
  'hostage exchange', 'prisoner swap', 'ransom', 'tribute', 'protection pact', 'sworn service',
  'indenture', 'bonded labour', 'manumission', 'sworn testimony', 'retracted testimony', 'false oath',
  // money, property, inheritance
  'debt', 'usury', 'foreclosure', 'bankruptcy', 'embezzlement', 'skimming',
  'counterfeiting', 'coin clipping', 'forged will', 'contested will', 'disinheritance', 'inheritance',
  'dowry dispute', 'bride price', 'unpaid wages', 'rent strike', 'evictions', 'land grab',
  'boundary dispute', 'water rights', 'grazing rights', 'fishing rights', 'salvage rights', 'mineral rights',
  'toll farming', 'tax farming', 'tithe dispute', 'crooked audit', 'cooked books', 'double mortgage',
  'pawned heirloom', 'unredeemed pledge', 'hidden treasure', 'buried savings', 'split spoils', 'cheated partner',
  'silent partner', 'failed venture', 'cornered market', 'price fixing', 'hoarding', 'smuggled goods',
  // crimes & wrongs
  'theft', 'burglary', 'highway robbery', 'cattle rustling', 'poaching', 'arson',
  'murder', 'manslaughter', 'poisoning', 'kidnapping', 'abduction', 'extortion',
  'blackmail', 'bribery', 'fraud', 'impersonation', 'identity theft', 'forgery',
  'perjury', 'jury tampering', 'witness bribing', 'evidence planting', 'frame job', 'cover-up',
  'smuggling', 'fencing stolen goods', 'grave robbing', 'body snatching', 'relic theft', 'horse theft',
  'piracy', 'wrecking', 'mutiny', 'desertion', 'treason', 'sedition',
  'espionage', 'sabotage', 'vandalism', 'trespass', 'squatting', 'rustled brand',
  // justice & its machinery
  'trial by ordeal', 'trial by combat', 'sanctuary claim', 'outlawry', 'banishment', 'exile',
  'pardon', 'amnesty', 'bounty', 'manhunt', 'wrongful conviction', 'miscarried justice',
  'vigilante justice', 'mob justice', 'show trial', 'secret tribunal', 'appeal', 'royal pardon',
  'confession', 'false confession', 'coerced confession', 'deathbed confession', 'sealed verdict', 'unsolved crime',
  'cold trail', 'reopened case', 'eyewitness', 'sole witness', 'missing witness', 'silenced witness',
  // power, office, faction
  'succession', 'usurpation', 'regency', 'puppet rule', 'abdication', 'coup',
  'election rigging', 'vote buying', 'office selling', 'nepotism', 'purge', 'proscription',
  'guild war', 'trade war', 'turf war', 'family feud', 'clan feud', 'vendetta',
  'power vacuum', 'contested command', 'divided loyalties', 'secret faction', 'shadow council', 'traitors within',
  'infiltration', 'defection', 'double agent', 'sleeper agent', 'dead drop', 'coded letters',
  // faith & heresy
  'heresy', 'apostasy', 'schism', 'excommunication', 'interdict', 'inquisition',
  'false prophecy', 'failed prophecy', 'self-fulfilling prophecy', 'miracle claim', 'fraudulent relic', 'pilgrimage',
  'indulgence selling', 'simony', 'desecration', 'iconoclasm', 'forbidden rite',
  'secret congregation', 'hedge preaching', 'unlicensed burial', 'unbaptised dead', 'broken sanctuary', 'sacrilege',
  'monastic intrigue', 'stolen tithe', 'cursed offering', 'unanswered prayer', 'answered prayer', 'rash vow',
  // family & blood
  'illegitimacy', 'bastardy', 'secret parentage', 'switched infants', 'lost heir', 'returned heir',
  'false heir', 'changeling claim', 'adoption', 'fosterage', 'abandonment', 'foundling',
  'runaway child', 'prodigal return', 'family secret', 'sealed adoption', 'twin confusion', 'hidden sibling',
  'forbidden union', 'cousin marriage', 'misalliance', 'morganatic match', 'widow remarriage', 'levirate claim',
  'custody fight', 'stolen child', 'sold child', 'pawned child', 'apprenticed child', 'conscripted son',
  // work, craft, trade
  'apprenticeship', 'masterpiece trial', 'guild examination', 'trade secret', 'stolen formula', 'poached craftsman',
  'sabotaged work', 'shoddy work', 'cursed commission', 'unpaid commission', 'rival workshop', 'broken monopoly',
  'patent quarrel', 'signature forgery', 'workshop fire', 'ruined harvest', 'failed crop', 'blighted field',
  'dead livestock', 'dry well', 'broken mill', 'silted channel', 'collapsed mine', 'flooded quarry',
  'lost cargo', 'spoiled cargo', 'mislabeled cargo', 'short weight', 'crooked scales', 'watered wine',
  'adulterated flour', 'poisoned batch', 'tainted well', 'bad medicine', 'quack cure', 'botched surgery',
  // war & soldiering
  'levy', 'conscription', 'draft dodging', 'billeting', 'requisition', 'war debt',
  'lost standard', 'abandoned post', 'friendly fire', 'massacre', 'war crime', 'old battlefield',
  'unburied dead', 'missing in action', 'presumed dead', 'returned veteran', 'deserter colony', 'mercenary contract',
  'unpaid soldiers', 'mutinous garrison', 'disbanded company', 'occupied village', 'reprisal', 'scorched earth',
  'siege debt', 'surrendered keep', 'razed watchtower', 'border raid', 'cattle raid', 'slave raid',
  // escape, flight, hiding
  'prison break', 'asylum seeking', 'witness protection', 'safe house', 'underground road',
  'hidden fugitive', 'harboured outlaw', 'sheltered heretic', 'smuggled person', 'bought passage', 'stowaway',
  'false papers', 'assumed name', 'faked death', 'staged accident', 'vanished traveller', 'missing person',
  'amnesia', 'hidden past', 'buried scandal', 'erased record', 'burned letters', 'destroyed evidence',
  // love & its plots
  'love triangle', 'matchmaking', 'arranged match', 'broken engagement', 'jilted bride',
  'jilted groom', 'runaway bride', 'abandoned spouse', 'bigamy', 'adultery', 'cuckoldry',
  'love letters', 'intercepted letters', 'go-between', 'love potion claim', 'courtship contest', 'bride kidnapping',
  'morning gift dispute', 'separated lovers', 'reunited lovers', 'deathbed wedding', 'ghost marriage', 'mourning courtship',
  // odd situations
  'wandering madman', 'holy fool', 'silent stranger', 'unclaimed corpse', 'unidentified body', 'mystery bequest',
  'anonymous gift', 'anonymous accusation', 'poison pen letters', 'graffiti campaign', 'effigy burning', 'charivari',
  'bell ringing dispute', 'banned festival', 'broken taboo', 'violated custom', 'forgotten law', 'absurd law',
  'wager gone wrong', 'prank gone wrong', 'rumour spiral', 'moral panic', 'witch scare', 'plague scare',
  'quarantine', 'lifted quarantine', 'premature burial', 'mistaken burial', 'double funeral', 'empty grave',
  'second body', 'wrong body', 'unquiet estate', 'locked room', 'sealed cellar', 'walled-up door',
];

// ---- THINGS (~500): objects, beasts, substances — concrete anchors ----------------------------
export const THINGS: string[] = [
  // tokens & keepsakes
  'signet ring', 'wedding band', 'betrothal cup', 'locket', 'lock of hair', 'christening shawl',
  'baby shoe', 'child\'s toy', 'wooden doll', 'carved whistle', 'keepsake ribbon', 'mourning brooch',
  'funeral mask', 'death mask', 'memorial stone', 'name-day gift', 'soldier\'s medal', 'campaign badge',
  'pilgrim badge', 'saint medallion', 'prayer beads', 'worry stone', 'lucky coin', 'cursed coin',
  // documents & marks
  'a will', 'deed', 'charter', 'manifest', 'muster roll', 'parish register',
  'ransom note', 'sealed confession', 'coded letter', 'burnt letter', 'unsent letter',
  'map half', 'treasure map', 'star chart', 'tide table', 'recipe book', 'herbal',
  'bestiary', 'psalter', 'forbidden book', 'banned pamphlet', 'wanted poster', 'eviction notice',
  'wax seal', 'seal die', 'tally-stick', 'notched stick', 'brand iron', 'maker\'s mark',
  'guild mark', 'smith\'s punch', 'mason\'s mark', 'cattle brand', 'ear notch', 'signature',
  // keys, locks, containers
  'key without a lock', 'lock without a key', 'skeleton key', 'strongbox', 'iron chest', 'puzzle box',
  'sealed jar', 'reliquary', 'lead casket', 'coffer', 'hidden drawer', 'false bottom',
  'locked diary', 'sea chest', 'dowry chest', 'grain bin', 'salt cellar', 'tithe barn key',
  // weapons & soldier gear
  'notched sword', 'broken blade', 'named blade', 'rusted dagger', 'poisoned knife', 'hidden knife',
  'heirloom axe', 'boar spear', 'hunting bow', 'crossbow bolt', 'spent quiver', 'split shield',
  'dented helm', 'torn banner', 'battle standard', 'war horn', 'signal horn', 'drum',
  'mail shirt', 'gambeson', 'old wound', 'arrowhead', 'caltrops', 'siege ladder',
  // tools of trades
  'fishing net', 'eel trap', 'wicker creel', 'gutting knife', 'flensing blade', 'harpoon',
  'plough', 'scythe', 'sickle', 'flail', 'millstone', 'quern',
  'anvil', 'bellows', 'tongs', 'crucible', 'mould', 'ingot',
  'loom', 'spindle', 'distaff', 'shuttle', 'dye vat', 'tenterhooks',
  'awl', 'last', 'tanning knife', 'lime pit', 'potter\'s wheel', 'kiln',
  'chisel', 'adze', 'auger', 'plumb line', 'level', 'scaffold rope',
  'mortar and pestle', 'scales', 'weights', 'false weights', 'measuring rod', 'counting board',
  'lancet', 'leech jar', 'splint', 'crutch', 'tooth key', 'trepan',
  'rope coil', 'block and tackle', 'grappling hook', 'boat hook', 'caulking iron', 'oakum',
  // boats & travel
  'leaky skiff', 'sunken barge', 'ferry punt', 'coracle', 'oar', 'broken rudder',
  'anchor', 'mooring ring', 'lodestone', 'compass needle', 'waymarker', 'milestone',
  'cart wheel', 'broken axle', 'wagon', 'sledge', 'pack saddle', 'saddlebag',
  'horseshoe', 'spur', 'bridle', 'wagon grease', 'lantern pole', 'walking staff',
  // animals
  'falcon', 'hooded hawk', 'hunting hound', 'lame horse', 'stolen horse', 'prize bull',
  'brood mare', 'black ram', 'white hart', 'old sow', 'fighting cock', 'messenger pigeon',
  'raven', 'magpie', 'heron', 'eel', 'pike', 'carp',
  'otter', 'beaver', 'badger', 'fox', 'wolf pelt', 'bear skin',
  'beehive', 'swarm', 'silkworm', 'leeches', 'toad', 'white snake',
  'cat', 'church grim', 'goat', 'donkey', 'ox team', 'goose flock',
  // food, drink, substances
  'salt', 'salt loaf', 'spice packet', 'saffron', 'pepper', 'honeycomb',
  'mead cask', 'wine tun', 'ale barrel', 'brandy keg', 'sour beer', 'poisoned cup',
  'wedding cake', 'funeral bread', 'first loaf', 'last sheaf', 'seed corn', 'blighted grain',
  'smoked eel', 'salted pork', 'wheel of cheese', 'butter churn', 'milk pail', 'tainted milk',
  'quicklime', 'pitch', 'tar', 'tallow', 'lamp oil', 'whale oil',
  'lye', 'soap', 'dye', 'woad', 'madder', 'ink',
  'gall', 'vitriol', 'arsenic', 'hemlock', 'nightshade', 'poppy milk',
  'healing salve', 'plague water', 'holy water', 'grave dirt', 'bone ash', 'iron filings',
  // clothes & cloth
  'wedding dress', 'mourning veil', 'christening gown', 'monk\'s habit', 'borrowed cloak', 'turned coat',
  'patched cloak', 'fine gloves', 'single glove', 'embroidered kerchief', 'silk ribbon', 'velvet purse',
  'leather apron', 'smith\'s apron', 'bloody apron', 'bolt of cloth', 'tapestry', 'banner cloth',
  'shroud', 'winding sheet', 'swaddling cloth', 'beggar\'s rags', 'stolen livery', 'mask',
  // valuables
  'pearl', 'amber bead', 'jet brooch', 'silver spoon', 'gold tooth', 'coin hoard',
  'foreign coin', 'ancient coin', 'gem rough', 'cut stone', 'paste jewel', 'crown',
  'circlet', 'chalice', 'paten', 'censer', 'icon', 'gilded plate',
  'candlesticks', 'altar cloth', 'bell metal', 'church bell', 'hand bell', 'sanctus bell',
  // structures & fixtures
  'gibbet', 'stocks', 'pillory', 'whipping post', 'boundary stone', 'standing stone',
  'sundial', 'weathervane', 'dovecote', 'well winch', 'sluice gate', 'weir',
  'tide mill', 'windmill sail', 'drawbridge chain', 'portcullis', 'gate bar', 'door knocker',
  'hearthstone', 'chimney', 'thatch', 'ridgepole', 'lintel', 'threshold',
  'cellar door', 'trapdoor', 'priest hole', 'secret stair', 'walled door', 'bricked window',
  // remains & relics
  'saint\'s finger-bone', 'knuckle bone', 'skull', 'jawbone', 'rib', 'spine',
  'bog body', 'mummified cat', 'horse skull', 'whale rib', 'antler crown', 'tooth necklace',
  'old grave', 'fresh grave', 'unmarked grave', 'opened grave', 'ossuary', 'charnel box',
  'ashes', 'urn', 'coffin nail', 'hearse cloth', 'grave goods', 'barrow treasure',
  // light & fire
  'lantern', 'storm lamp', 'rushlight', 'beeswax candle', 'black candle', 'votive candle',
  'beacon', 'signal fire', 'watch fire', 'forge fire', 'ember', 'cold hearth',
  'tinderbox', 'flint and steel', 'fire bell', 'cresset', 'torch stub', 'burnt match',
  // misc vivid
  'hourglass', 'broken clock', 'astrolabe', 'spyglass', 'magnifying lens', 'mirror shard',
  'silvered mirror', 'scrying bowl', 'dice', 'weighted dice', 'card deck', 'marked cards',
  'game board', 'chess piece', 'puppet', 'marionette', 'music box', 'hurdy-gurdy',
  'fiddle', 'reed pipe', 'drum skin', 'harp string', 'songbook', 'sheet ballad',
  'rocking chair', 'cradle', 'spinning top', 'kite', 'fishhook', 'thimble',
  'needle case', 'pincushion', 'button', 'odd buttons', 'bootlace', 'left boot',
  'wig', 'false teeth', 'glass eye', 'ear trumpet', 'eye patch', 'wooden leg',
];

// ---- OCCASIONS (~300): events, moments, deadlines ---------------------------------------------
export const OCCASIONS: string[] = [
  // rites of passage
  'wedding', 'betrothal feast', 'christening', 'name-day', 'coming of age', 'first hunt',
  'first voyage', 'apprenticeship oath', 'mastership trial', 'knighting', 'tonsuring', 'taking the veil',
  'funeral', 'wake', 'month\'s mind', 'year\'s mind', 'will reading', 'estate auction',
  'widow\'s remarriage', 'mourning\'s end', 'birth', 'difficult birth', 'twin birth', 'churching',
  // calendar & season
  'midsummer', 'midwinter', 'first frost', 'last frost', 'thaw', 'spring flood',
  'harvest', 'failed harvest', 'gleaning', 'threshing', 'slaughter month', 'salting season',
  'eel run', 'herring run', 'lambing', 'calving', 'shearing', 'haymaking',
  'planting', 'first plough', 'fallow year', 'drought', 'long rain', 'hard winter',
  'spring tide', 'neap tide', 'king tide', 'storm surge', 'fog week', 'ice road',
  // feasts & gatherings
  'market day', 'fair day', 'horse fair', 'goose fair', 'hiring fair', 'saint\'s day',
  'feast day', 'fast day', 'vigil night', 'procession', 'pilgrimage season', 'relic showing',
  'church ale', 'harvest supper', 'wassail', 'mumming', 'bonfire night', 'beating the bounds',
  'moot', 'folkmoot', 'guild feast', 'lodge meeting', 'veterans\' reunion', 'family gathering',
  // justice & rule
  'assize', 'court day', 'hanging day', 'pillory day', 'tax day', 'rent day',
  'quarter day', 'tithe collection', 'census', 'muster', 'levy call', 'beacon lighting',
  'royal progress', 'lord\'s visit', 'bishop\'s visitation', 'inspection', 'audit', 'inventory',
  'election', 'lot drawing', 'oath taking', 'homage ceremony', 'border perambulation', 'charter renewal',
  // commerce & work moments
  'auction', 'debt due', 'loan call', 'foreclosure day', 'ship sailing', 'caravan departure',
  'fleet return', 'cargo landing', 'warehouse clearing', 'stocktaking', 'launch day', 'keel laying',
  'mill opening', 'forge lighting', 'kiln firing', 'brew day', 'baking day', 'washing day',
  'pay day', 'settling day', 'contract signing', 'partnership dissolution', 'shop opening', 'shop closing',
  // disruptions
  'fire', 'flood', 'dyke breach', 'bridge collapse', 'roof fall', 'landslip',
  'shipwreck', 'grounding', 'plague outbreak', 'murrain', 'blight',
  'riot', 'bread riot', 'strike', 'lockout', 'desertion wave', 'press gang sweep',
  'raid', 'border alarm', 'wolf winter', 'beggar influx', 'refugee column', 'eviction day',
  // small sharp moments
  'midnight knock', 'dawn departure', 'last ferry', 'curfew bell', 'angelus', 'lights out',
  'changing of watch', 'shift change', 'low tide window', 'moonless night', 'first snow', 'candle auction',
  'final notice', 'last banns reading', 'third summons', 'grace period\'s end', 'ultimatum', 'amnesty\'s end',
  'anniversary', 'deathday', 'old promise due', 'prophecy date', 'comet', 'eclipse',
];

// ---- PEOPLE (~300): roles & figures ------------------------------------------------------------
export const PEOPLE: string[] = [
  // kin & household
  'widow', 'widower', 'orphan', 'twins', 'bastard',
  'heir', 'disowned heir', 'younger son', 'spinster aunt', 'grandmother', 'stepmother',
  'foster child', 'ward', 'godparent', 'wet nurse', 'midwife', 'housekeeper',
  'estranged brother', 'prodigal son', 'runaway daughter', 'child bride', 'old retainer',
  // authority
  'reeve', 'bailiff', 'steward', 'magistrate', 'sheriff', 'constable',
  'tax collector', 'toll keeper', 'customs man', 'gaoler', 'hangman', 'herald',
  'notary', 'scrivener', 'clerk of court', 'coroner', 'plague warden', 'harbourmaster',
  'alderman', 'burgomaster', 'guildmaster', 'castellan', 'marshal', 'chamberlain',
  // church
  'parish priest', 'hedge-priest', 'curate', 'friar', 'pardoner', 'summoner',
  'anchorite', 'hermit', 'abbess', 'prioress', 'novice', 'lay brother',
  'sexton', 'bell ringer', 'verger', 'relic keeper', 'pilgrim', 'flagellant',
  'heretic preacher', 'defrocked priest', 'church builder', 'icon painter', 'choirboy', 'beguine',
  // trades
  'smith', 'farrier', 'wheelwright', 'cooper', 'chandler', 'tanner',
  'weaver', 'dyer', 'fuller', 'seamstress', 'glover', 'cobbler',
  'miller', 'baker', 'brewer', 'alewife', 'butcher', 'fishmonger',
  'salter', 'eel fisher', 'fowler', 'reed cutter', 'peat cutter', 'charcoal burner',
  'mason', 'thatcher', 'carpenter', 'shipwright', 'ropemaker', 'sailmaker',
  'potter', 'glassblower', 'tinker', 'knife grinder', 'rat catcher', 'chimney sweep',
  'apothecary', 'barber-surgeon', 'bone setter', 'herbalist', 'leech', 'tooth puller',
  // road & water
  'ferryman', 'bargeman', 'pilot', 'lighterman', 'drover', 'carter',
  'pedlar', 'tinker family', 'travelling player', 'minstrel', 'ballad seller', 'bear ward',
  'puppeteer', 'fortune teller', 'quack doctor', 'relic seller', 'letter carrier', 'king\'s messenger',
  'pilgrim band', 'merchant venturer', 'spice trader', 'horse trader', 'wool stapler', 'moneychanger',
  // margins
  'beggar', 'leper', 'lazar-house keeper', 'gravedigger', 'night-soil man', 'mudlark',
  'scavenger', 'wrecker', 'smuggler', 'poacher', 'outlaw', 'highwayman',
  'cutpurse', 'housebreaker', 'fence', 'forger', 'coiner', 'cardsharp',
  'procuress', 'tavern girl', 'pot boy', 'link boy', 'urchin', 'street gang',
  'madman', 'village idiot', 'wise woman', 'cunning man', 'witch-finder',
  // soldiers & violence
  'veteran', 'maimed soldier', 'deserter', 'mercenary', 'sellsword', 'bodyguard',
  'watchman', 'gatekeeper', 'archer', 'pikeman', 'siege engineer', 'sapper',
  'press-gang', 'recruiting sergeant', 'duellist', 'prizefighter', 'wrestler', 'bear baiter',
  'bandit chief', 'pirate captain', 'raider', 'feud champion', 'hired bully', 'kneecapper',
  // strangers & arrivals
  'stranger', 'foreigner', 'refugee', 'returned traveller', 'shipwreck survivor',
  'amnesiac', 'mute stranger', 'veiled lady', 'disguised noble', 'royal bastard', 'pretender',
  'long-lost sibling', 'doppelganger', 'imposter', 'witness', 'sole survivor',
  'informer', 'spy', 'agent provocateur', 'debt collector', 'bounty hunter', 'man hunter',
];

// ---- UNCANNY (~300): folk-horror & wonder ------------------------------------------------------
export const UNCANNY: string[] = [
  // creatures & presences
  'ghost', 'restless dead', 'drowned dead', 'churchyard walker', 'phantom funeral', 'death coach',
  'banshee wail', 'black dog', 'barghest', 'will-o-wisp', 'corpse candle',
  'bog spirit', 'fen wraith', 'water horse', 'river hag', 'mermaid', 'selkie',
  'changeling', 'fairy mound', 'fae bargain', 'fae debt', 'fairy ring',
  'household spirit', 'hearth ghost', 'knocker', 'brownie', 'poltergeist', 'familiar',
  'werewolf', 'wolf charm', 'hare witch', 'cat omen', 'raven omen', 'magpie count',
  'revenant', 'hungry grave', 'walking corpse', 'plague ghost', 'gibbet ghost', 'headless rider',
  // witchcraft & cunning craft
  'witch mark', 'evil eye', 'overlooking', 'hex', 'curse', 'inherited curse',
  'curse tablet', 'poppet', 'pin doll', 'witch bottle', 'witch ladder', 'knotted cord',
  'love charm', 'fertility charm', 'protection charm', 'iron horseshoe', 'rowan cross', 'salt line',
  'hag stone', 'hag riding', 'night terror', 'sleep paralysis', 'sent dream', 'stolen voice',
  'blighted touch', 'milk theft', 'butter that won\'t come', 'bees told', 'untold bees', 'swarm omen',
  'familiar toad', 'black cockerel', 'midnight sabbat', 'devil\'s mark', 'pact', 'soul wager',
  // holy & unholy
  'miracle', 'false miracle', 'weeping icon', 'bleeding host', 'incorrupt body', 'saint\'s breath',
  'healing spring', 'cursed well', 'holy fool\'s word', 'prophecy', 'speaking in tongues', 'stigmata',
  'visitation', 'angel sighting', 'demon whisper', 'possession', 'exorcism', 'unquiet relic',
  'desecrated altar', 'inverted cross', 'black mass rumour', 'unhallowed ground', 'suicide corner', 'crossroads burial',
  // omens & signs
  'omen', 'ill omen', 'death omen', 'birth caul', 'seventh son', 'two moons',
  'red sky', 'blood rain', 'fish fall', 'frog rain', 'eclipse dread',
  'howling night', 'silent birds', 'fleeing rats', 'beached whale', 'white stag', 'three knocks',
  'stopped clock', 'cracked mirror', 'spilled salt', 'crossed knives', 'dropped ring', 'guttered candle',
  // places that are wrong
  'haunted mill', 'cursed field', 'sour ground', 'hungry marsh', 'singing reeds', 'whispering wood',
  'hollow hill', 'barrow light', 'sunken bell', 'drowned village', 'phantom island', 'moving bog',
  'door that opens', 'room kept locked', 'cold spot', 'shadow corner', 'watching window', 'path that shifts',
  'circle of mushrooms', 'lightning oak', 'gallows tree', 'wishing thorn', 'boundary ghost', 'spite hedge',
  // things that are wrong
  'unrotting corpse', 'too-heavy coffin', 'empty coffin', 'extra grave', 'name worn off', 'portrait that watches',
  'bell that tolls itself', 'untraceable smell', 'bleeding stone', 'sweating idol', 'warm grave', 'frost in summer',
  'milk turned', 'bread won\'t rise', 'fire won\'t catch', 'iron gone cold', 'salt gone wet', 'well gone bitter',
  'beast born wrong', 'two-headed calf', 'crowing hen', 'swarm in the wall', 'rats in formation', 'eel knot',
  // time & memory wrongness
  'lost hour', 'repeated day', 'remembered future', 'borrowed years', 'aged overnight', 'unaging stranger',
  'forgotten name', 'unrememberable face', 'shared dream', 'inherited dream', 'memory in the blood', 'walked path remembering',
];

// ---- the sampler (§5 locked: 1 BOND + 1 TIE + 1-2 wildcards) -----------------------------------
const WILDCARD_UNION = [...THINGS, ...OCCASIONS, ...PEOPLE, ...UNCANNY, ...MOODS];
export function sampleKeywords(rng: Rng): string[] {
  const draw = [rng.pick(BOND), rng.pick(TIE), rng.pick(WILDCARD_UNION)];
  if (!rng.chance(0.25)) draw.push(rng.pick(WILDCARD_UNION));
  return draw;
}

// ---- arrival sparks (v2 lesson, kept: a keyword spark decorrelates the opening WITHOUT
// prescribing a sentence — full sentences got copied verbatim) -----------------------------------
const ARRIVAL_WHO = ['one of your own soldiers', 'a petitioner', 'a frightened runner', 'a courier',
  'a creditor', 'a passing trader', 'a child', 'a rival', 'an old contact', 'a town official',
  'a wounded survivor', 'a hooded stranger', 'a straggler', 'a widow', 'a returning patrol',
  'a pedlar', 'a shepherd', 'a ferryman', 'a friar', 'an innkeeper', 'a poacher turned informer',
  'a drunk who swears it is true', 'a neighbour farmer', 'an old friend of the company'];
const ARRIVAL_HOW = ['a sealed letter', 'a posted notice', 'urgent word', 'a plea', 'a summons',
  'a warrant', 'a whispered tip', 'a bounty', 'a debt called in', 'a rumor',
  'a token pressed into a hand', 'a bell rung at odd hours',
  'a riderless horse', 'a basket left at the gate', 'word from the market',
  // SPOKEN forms outnumber written ones — "written on what arrives" taught a scrap-with-ominous-line
  // frame onto ~100% of cards
  'a tale told at the gate', 'a name gasped out', 'a demand called from horseback',
  'a warning sung as a rhyme', 'an offer made too smoothly', 'a grievance shouted over the wall',
  'a bargain proposed in whispers', 'a story that changes with each telling'];
// SIGNS: matters that reach the fort with NO bringer at all — seen, heard, or missed from the
// walls (breaks the "supplicant hands over a prop" macro that owned ~40 of 42 cards)
const ARRIVAL_SIGNS = ['smoke on the ridge', 'bells from the valley, wrong hour', 'a cart abandoned on the road',
  'animals fleeing the wood', 'a light where none should burn', 'the weekly pedlar simply never came',
  'a price suddenly doubled at market', 'a boat drifting empty past the ford', 'fresh graves where there was no sickness',
  'a road gone silent that is never silent', 'washing left three days on the lines', 'hoofprints circling the walls by night'];
// a saga's CARE beat must not open on blood or menace
const GRIM = /wounded|creditor|warrant|bounty|debt|rival|confession|graves|blood/;
const OPENING_TIMES = ['at first light', 'mid-morning', 'at noon', 'late afternoon', 'at dusk', 'after dark', 'in the small hours'];
export function sampleOpening(rng: Rng, opts?: { gentle?: boolean }): { spark: string; landmarkAllowed: boolean } {
  const pick = (a: string[]) => rng.pick(opts?.gentle ? a.filter(w => !GRIM.test(w)) : a);
  const core = rng.chance(0.3) ? pick(ARRIVAL_SIGNS)
    : rng.chance(0.6) ? `${pick(ARRIVAL_WHO)}, ${pick(ARRIVAL_HOW)}` : pick(ARRIVAL_WHO);
  // time only SOMETIMES seasons the spark — any time token at all kept teaching cards to open
  // "At dusk, ..." (~50% even after folding + an explicit ban); most cards get no clock to lead with
  const spark = rng.chance(0.3) ? `${core} — ${rng.pick(OPENING_TIMES)}` : core;
  return { spark, landmarkAllowed: rng.chance(0.15) };
}

/** one-off gravity — not every job is dire (v2's per-card register knob, rarity-weighted).
 *  Engine-rolled seed: most common jobs are small; rare ones lean grave. */
const GRAVITY: Record<string, [string, number][]> = {
  common: [['a small, everyday job', 5], ['a serious matter', 4], ['a grave affair', 1]],
  uncommon: [['a small, everyday job', 2], ['a serious matter', 5], ['a grave affair', 3]],
  rare: [['a serious matter', 2], ['a grave affair', 3]],
};
export function sampleGravity(rng: Rng, rarity: string): string {
  return rng.weighted(GRAVITY[rarity] ?? GRAVITY.common!);
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
