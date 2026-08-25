// Keyword seeds — §5: ONE unlabeled KEYWORDS line; sampling = 1 BOND + 1 TIE + 1-2 WILDCARDS
// (wildcards uniform over THINGS ∪ OCCASIONS ∪ PEOPLE ∪ UNCANNY ∪ MOODS ∪ QUALITIES).
// 🛠 2026-07-12 ATOMIZATION (designer ruling): entries are SINGLE common words. The old pools'
// 2-3-word entries pre-authored a premise ('banned festival', 'fairy mound') and the AI could
// only transcribe them — atoms combine instead ('festival' + 'banned' arrive as separate draws
// and the model invents the story). Variety now comes from COMBINATIONS, not from entry count.
// STYLE BAR: one word (two only for a common lexical unit with no one-word form); a curious
// twelve-year-old knows it; plain English first, low-medieval compatible; no proper nouns;
// no anachronisms; no dictionary-obscure medievalia; never a pose or a joke; no cross-pool dupes.
// BOND bar (2026-07-17 designer flag: "shyness"): a BOND word must be strong enough to make
// someone HIRE mercenaries or start a quarrel — inward micro-discomforts don't qualify.

import type { Rng } from '../engine/rng.js';

// ---- BOND (~350): feelings, stances, drives, relations — the draw's emotional axis ------------
export const BOND: string[] = [
  // feelings
  'grief', 'longing', 'spite', 'envy', 'dread', 'shame', 'pride', 'guilt', 'rage', 'pity',
  'tenderness', 'contempt', 'awe', 'loneliness', 'homesickness', 'jealousy', 'devotion', 'resentment',
  'gratitude', 'mercy', 'malice', 'remorse', 'yearning', 'bitterness', 'adoration', 'loathing',
  'despair', 'hope', 'relief', 'humiliation', 'vindication', 'heartbreak', 'infatuation',
  'disgust', 'terror', 'melancholy', 'glee', 'scorn', 'reverence', 'suspicion', 'trust',
  'mistrust', 'forgiveness', 'regret', 'nostalgia', 'restlessness', 'serenity', 'fury',
  'sorrow', 'joy', 'delight', 'misery', 'anguish', 'torment', 'unease', 'worry', 'panic',
  'fright', 'horror', 'revulsion', 'fondness', 'affection', 'warmth', 'indifference',
  'boredom', 'weariness', 'desire', 'satisfaction', 'contentment', 'calm', 'doubt',
  'certainty', 'conviction', 'confusion', 'bewilderment', 'astonishment', 'surprise', 'shock',
  'dismay', 'disappointment', 'frustration', 'exasperation', 'irritation', 'annoyance',
  'anger', 'wrath', 'hatred', 'hostility', 'grudge',
  'anxiety', 'apprehension', 'foreboding', 'anticipation', 'eagerness',
  'excitement', 'thrill', 'elation', 'triumph', 'gloating', 'smugness', 'wonder',
  'gloom', 'cheer', 'mirth', 'sulking', 'brooding', 'pining', 'aching', 'numbness',
  // stances & habits
  'stubbornness', 'cowardice', 'bravado', 'humility', 'vanity', 'greed', 'generosity', 'patience',
  'impatience', 'cruelty', 'kindness', 'caution', 'recklessness', 'cunning', 'innocence',
  'zeal', 'apathy', 'curiosity', 'denial', 'arrogance', 'modesty', 'pettiness',
  'severity', 'leniency', 'sloth', 'industry', 'thrift', 'extravagance', 'prudence',
  'folly', 'wisdom', 'naivety', 'cynicism', 'idealism', 'fatalism', 'defiance',
  'obedience', 'servility', 'loyalty', 'disloyalty', 'fickleness', 'constancy',
  'honesty', 'dishonesty', 'tact', 'bluntness', 'discretion', 'indiscretion',
  'secrecy', 'openness', 'hypocrisy', 'piety', 'faith', 'superstition',
  'courage', 'valor', 'daring', 'boldness', 'timidity', 'meekness', 'gentleness',
  'harshness', 'mildness', 'temperance', 'gluttony', 'sobriety', 'drunkenness',
  'lust', 'chastity', 'fidelity', 'infidelity', 'diligence', 'laziness',
  'complacency', 'vigilance', 'negligence', 'carelessness', 'fussiness', 'squeamishness',
  'stinginess', 'charity', 'hospitality', 'rudeness', 'courtesy', 'insolence',
  'deference', 'condescension', 'spitefulness', 'vindictiveness',
  'gullibility', 'wariness', 'optimism', 'pessimism', 'stoicism', 'self-pity',
  'self-denial', 'self-importance', 'self-sacrifice', 'penance', 'martyrdom',
  // appetites & drives
  'ambition', 'wanderlust', 'bloodlust', 'belonging', 'oblivion', 'recognition', 'legacy',
  'atonement', 'absolution', 'redemption', 'salvation', 'damnation', 'temptation',
  'obsession', 'compulsion', 'craving', 'vengeance', 'retribution', 'justice',
  'honor', 'dishonor', 'glory', 'fame', 'infamy', 'reputation', 'respect',
  'dignity', 'indignity', 'freedom', 'captivity', 'escape',
  'hunger', 'thirst', 'want', 'plenty', 'poverty', 'wealth', 'comfort', 'hardship',
  'survival', 'safety', 'danger', 'risk', 'ruin', 'fortune', 'advancement', 'station',
  // relations
  'rivalry', 'kinship', 'brotherhood', 'sisterhood', 'fellowship', 'enmity', 'courtship',
  'estrangement', 'betrayal', 'reconciliation', 'mentorship', 'friendship',
  'partnership', 'marriage', 'widowhood', 'motherhood', 'fatherhood', 'childhood',
  'familiarity', 'intimacy', 'distance',
  'attachment', 'dependence', 'independence', 'protection', 'neglect', 'abandonment',
  'favoritism', 'exclusion', 'welcome', 'rejection', 'acceptance', 'tolerance',
  // duties & weights
  'duty', 'obligation', 'responsibility', 'stewardship', 'guardianship', 'fealty',
  'allegiance', 'service', 'servitude', 'birthright', 'debt',
  'mourning', 'loss', 'bereavement', 'absence', 'emptiness',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'fear', 'love', 'passion', 'lovesickness', 'compassion', 'outrage', 'indignation', 'offense',
  'insult', 'mockery', 'flattery', 'boasting', 'mischief', 'meddling', 'temper', 'distress',
  'desperation', 'helplessness', 'suffering', 'grievance', 'discontent', 'unrest', 'blame', 'disgrace',
  'disrespect', 'ingratitude', 'intolerance', 'shunning', 'persecution', 'oppression', 'tyranny', 'lawlessness',
  'slavery', 'treachery', 'brutality', 'ruthlessness', 'wickedness', 'selfishness', 'shamelessness', 'possessiveness',
  'virtue', 'vice', 'righteousness', 'purity', 'grace', 'worship', 'godlessness', 'chivalry',
  'conscience', 'ignorance', 'knowledge', 'truth', 'memory', 'power', 'conquest', 'mastery',
  'profit', 'ownership', 'claim', 'favor', 'alliance', 'resemblance', 'beauty', 'youth',
  'pleasure', 'solitude', 'childlessness', 'weakness', 'sickness', 'injury', 'death', 'failure',
  // 'burden'/'shadow'/'fate'/'destiny' are BANNED prose words on cards (writeQuest hard
  // rules) — a draw containing one forces the writer to echo a banned word or waste the slot
  'calling', 'safekeeping', 'self-loathing',
];

// ---- TIE (~330): situations — the draw's story axis (what HAPPENED or is happening) ------------
export const TIE: string[] = [
  // words given
  'wager', 'oath', 'vow', 'promise', 'pledge', 'pact', 'bargain', 'contract', 'agreement',
  'treaty', 'truce', 'surrender', 'parley', 'ransom', 'tribute', 'indenture', 'apprenticeship',
  'testimony', 'perjury', 'betrothal', 'elopement', 'annulment', 'dowry', 'exchange',
  'negotiation', 'ultimatum', 'compromise', 'concession', 'forfeit',
  // money & property
  'usury', 'inheritance', 'dispute', 'quarrel', 'rent', 'wages', 'tax', 'tithe', 'toll',
  'fine', 'bribe', 'monopoly', 'hoarding', 'smuggling', 'salvage', 'plunder', 'spoils',
  'eviction', 'repossession', 'confiscation', 'compensation', 'restitution', 'arrears',
  'partition', 'trespass', 'encroachment', 'squatting', 'poaching', 'rustling',
  'embezzlement', 'swindle', 'shortchange', 'overcharge',
  'barter', 'credit', 'collateral', 'windfall',
  // crimes & wrongs
  'theft', 'robbery', 'burglary', 'arson', 'murder', 'poisoning', 'kidnapping', 'extortion',
  'blackmail', 'bribery', 'fraud', 'forgery', 'impersonation', 'piracy', 'mutiny',
  'treason', 'sedition', 'sabotage', 'slander', 'accusation',
  'assault', 'ambush', 'raid', 'abduction', 'menace', 'harassment', 'intimidation',
  'vandalism', 'desecration', 'looting',
  // justice
  'trial', 'verdict', 'sentence', 'pardon', 'amnesty', 'bounty', 'manhunt', 'banishment',
  'exile', 'arrest', 'imprisonment', 'execution', 'hanging', 'confession', 'appeal',
  'acquittal', 'injustice', 'reprieve', 'clemency', 'outlawing',
  'inquiry', 'investigation', 'inquest', 'summons', 'indictment', 'denunciation',
  // power & faction
  'succession', 'usurpation', 'abdication', 'coronation', 'election', 'rebellion', 'revolt',
  'uprising', 'riot', 'purge', 'plot', 'scheme', 'faction', 'coup', 'regicide',
  'nepotism', 'corruption', 'graft', 'patronage', 'appointment',
  'demotion', 'dismissal', 'resignation', 'promotion', 'reinstatement',
  'infiltration', 'defection', 'eavesdropping',
  // faith
  'heresy', 'blasphemy', 'sacrilege', 'excommunication', 'sin', 'sermon', 'sanctuary',
  'idolatry', 'conversion', 'fasting', 'penitence', 'indulgence',
  'ordination', 'defrocking', 'tithing',
  // family & blood
  'adoption', 'disowning', 'parentage', 'ancestry', 'lineage', 'bloodline',
  'custody', 'legitimacy', 'illegitimacy', 'remarriage', 'bigamy', 'adultery', 'divorce',
  'incest', 'orphaning', 'widowing',
  // war
  'invasion', 'skirmish', 'retreat', 'occupation', 'conscription', 'blockade', 'massacre',
  'reprisal', 'desertion', 'discharge', 'requisition', 'fortification',
  // flight & hiding
  'hiding', 'flight', 'pursuit', 'disappearance', 'deception', 'lie', 'alias',
  'amnesia', 'concealment', 'evasion', 'misdirection', 'diversion', 'decoy',
  'refuge', 'asylum', 'harboring', 'sheltering',
  // love
  'affair', 'jilting', 'matchmaking', 'proposal', 'seduction',
  'cuckoldry', 'philandering',
  // work & land
  'blight', 'famine', 'plague', 'quarantine', 'shortage', 'surplus', 'commission',
  'masterpiece', 'guild', 'strike', 'lockout', 'apprenticing', 'journeying',
  'irrigation', 'drainage', 'clearing', 'enclosure', 'grazing', 'foraging',
  // odd
  'prank', 'dare', 'riddle', 'taboo', 'custom', 'tradition', 'law', 'decree',
  'proclamation', 'petition', 'boundary', 'border', 'feud', 'vendetta',
  'misunderstanding', 'mistake', 'accident', 'blunder', 'coincidence', 'omission',
  'discovery', 'revelation', 'exposure', 'unmasking', 'reappearance',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'loan', 'pawn', 'hire', 'sale', 'purchase', 'haggling', 'bidding', 'swap',
  'grave-robbing', 'banditry', 'flogging', 'whipping', 'beating', 'strangling', 'stabbing', 'brawl',
  'scuffle', 'oathbreaking', 'misrule', 'regency', 'overthrow', 'fostering', 'disinheritance', 'bride-price',
  'tryst', 'wooing', 'flirtation', 'infestation', 'hoax', 'disguise', 'cave-in', 'rockfall',
  'snub', 'taunt', 'challenge', 'boast', 'sighting', 'encounter', 'intrusion', 'spying',
  'stalking', 'shadowing', 'lawsuit', 'expulsion', 'migration', 'baptism', 'gambling', 'apology',
  'assassination', 'cheating', 'trickery', 'homage', 'edict', 'beheading', 'torture', 'enslavement',
  'mining', 'drowning', 'stalemate', 'ransacking',
];

// ---- QUALITIES (~190): plain modifiers — combine with any noun the draw supplies ---------------
export const QUALITIES: string[] = [
  'stolen', 'banned', 'forbidden', 'forged', 'counterfeit', 'false', 'true', 'hidden',
  'secret', 'broken', 'mended', 'last', 'first', 'final', 'lost', 'found',
  'borrowed', 'cursed', 'blessed', 'unpaid', 'owed', 'sworn', 'abandoned', 'forsaken',
  'poisoned', 'tainted', 'spoiled', 'sealed', 'unsealed', 'locked', 'unlocked', 'empty',
  'full', 'missing', 'returned', 'ruined', 'restored', 'rightful', 'wrongful', 'disputed',
  'unclaimed', 'claimed', 'overdue', 'sudden', 'slow', 'silent', 'loud', 'midnight',
  'unfinished', 'twin', 'third', 'seventh', 'foreign', 'ancient', 'new',
  'old', 'young', 'sacred', 'profane', 'holy', 'unholy', 'cheap', 'priceless',
  'worthless', 'precious', 'unwanted', 'coveted', 'inherited', 'promised', 'refused',
  'denied', 'delayed', 'marked', 'unmarked', 'nameless', 'named', 'masked', 'veiled',
  'drowned', 'burned', 'buried', 'unburied', 'frozen', 'thawed', 'rotten', 'fresh',
  'stale', 'crooked', 'straight', 'bent', 'sharp', 'blunt', 'heavy', 'light',
  'hollow', 'solid', 'cracked', 'patched', 'stained', 'clean', 'filthy', 'gilded',
  'plain', 'ornate', 'rare', 'common', 'smuggled', 'looted', 'ransomed', 'orphaned',
  'widowed', 'exiled', 'banished', 'outlawed', 'pardoned', 'condemned', 'accused',
  'innocent', 'guilty', 'wanted', 'hunted', 'watched', 'followed', 'betrayed',
  'avenged', 'sold', 'bought', 'traded', 'gifted', 'misplaced', 'unread', 'unsent',
  'unopened', 'unanswered', 'unspoken', 'whispered', 'shouted', 'sung', 'written',
  'erased', 'faded', 'forgotten', 'remembered', 'dreamed', 'feared', 'beloved',
  'hated', 'envied', 'mourned', 'unmourned', 'bewitched', 'blighted', 'barren',
  'fertile', 'flooded', 'parched', 'overgrown', 'trampled', 'fallow', 'ripe',
  'unripe', 'harvested', 'unharvested', 'branded', 'shorn', 'saddled', 'lame',
  'blind', 'deaf', 'mute', 'scarred', 'maimed', 'healed', 'feverish', 'sleepless',
  'starving', 'gorged', 'sober', 'drunk', 'mad', 'sane', 'wise', 'foolish',
  'brave', 'afraid', 'loyal', 'faithless', 'honest', 'lying', 'generous', 'greedy',
  'proud', 'humble', 'patient', 'restless', 'kind', 'cruel', 'gentle', 'savage',
  'wild', 'tame', 'stray', 'caged', 'freed', 'escaped', 'captured', 'surrendered',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'pawned', 'hired', 'swapped', 'switched', 'divided', 'shared', 'hoarded', 'wagered',
  'pledged', 'seized', 'forfeited', 'reclaimed', 'salvaged', 'rescued', 'recovered', 'replaced',
  'copied', 'faked', 'mislaid', 'dented', 'chipped', 'shattered', 'splintered', 'warped',
  'rusted', 'tarnished', 'moldy', 'worm-eaten', 'moth-eaten', 'singed', 'scorched', 'charred',
  'sodden', 'soaked', 'waterlogged', 'leaky', 'sunken', 'wrecked', 'stranded', 'beached',
  'snapped', 'frayed', 'threadbare', 'darned', 'betrothed', 'jilted', 'disowned', 'adopted',
  'fostered', 'annulled', 'unwed', 'remarried', 'cheated', 'robbed', 'ransacked', 'homeless',
  'landless', 'penniless', 'beggared', 'indebted', 'secondhand', 'spare', 'sole', 'belated',
  'untimely', 'premature', 'fleeting', 'unseen', 'unheard', 'unnoticed', 'overlooked', 'misheard',
  'misread', 'garbled', 'coded', 'rumored', 'alleged', 'confessed', 'proven', 'unproven',
  'doubted', 'believed', 'disbelieved', 'foretold', 'expected', 'unexpected', 'uninvited', 'unwelcome',
  'summoned', 'conjured', 'doomed', 'damned', 'saved', 'spared', 'punished', 'rewarded',
  'tested', 'tempted', 'corrupted', 'redeemed', 'shamed', 'disgraced', 'honored', 'celebrated',
  'pitied', 'scorned', 'mocked', 'deceived', 'tricked', 'fooled', 'threatened', 'warned',
  'forewarned', 'besieged', 'cornered', 'trapped', 'ensnared', 'tangled', 'limping', 'toothless',
  'bald', 'bearded', 'pregnant', 'newborn', 'dying', 'dead', 'undead', 'lifeless',
  'headless', 'barefoot', 'unwashed', 'unshaven', 'ragged', 'tattered', 'naked', 'cloaked',
  'hooded', 'armored', 'armed', 'unarmed', 'mounted', 'unhorsed', 'marooned', 'adrift',
  'distant', 'neighboring', 'contested', 'garrisoned', 'deserted', 'uninhabited', 'haunted', 'possessed',
  'enchanted', 'spellbound', 'moonlit', 'candlelit', 'unlucky', 'lucky', 'dreaded', 'awaited',
  'long-lost', 'ill-gotten', 'hard-won', 'short-lived', 'newfound', 'handmade', 'half-built', 'mismatched',
  'miscounted', 'misdelivered', 'underpaid', 'one-eyed', 'left-handed', 'two-headed', 'thirteenth',
];

// ---- THINGS (~400): concrete nouns — objects, beasts, substances, structures -------------------
export const THINGS: string[] = [
  // tokens & valuables
  'ring', 'locket', 'brooch', 'medallion', 'beads', 'coin', 'purse', 'hoard', 'gem',
  'pearl', 'amber', 'ivory', 'silver', 'copper', 'iron', 'steel', 'bronze', 'crown',
  'circlet', 'chalice', 'goblet', 'icon', 'idol', 'candlestick', 'heirloom', 'keepsake', 'trinket',
  'ribbon', 'kerchief', 'glove', 'comb', 'hairpin', 'bracelet', 'anklet', 'earring',
  // documents & marks
  'letter', 'map', 'chart', 'deed', 'charter', 'will', 'scroll', 'seal', 'signature',
  'book', 'diary', 'song', 'ballad', 'poem', 'list', 'notice', 'poster', 'sign',
  'brand', 'tattoo', 'crest', 'emblem', 'insignia', 'tally', 'receipt',
  'parchment', 'ink', 'quill', 'wax',
  // keys & containers
  'key', 'lock', 'chain', 'strongbox', 'chest', 'coffer', 'casket', 'coffin', 'urn',
  'jar', 'jug', 'flask', 'bottle', 'cask', 'barrel', 'crate', 'sack', 'pouch',
  'satchel', 'basket', 'bucket', 'trunk', 'drawer', 'cupboard', 'cabinet', 'shelf',
  // weapons & war gear
  'sword', 'dagger', 'knife', 'spear', 'lance', 'bow', 'arrow', 'quiver', 'crossbow',
  'shield', 'helmet', 'armor', 'gauntlet', 'banner', 'horn', 'drum', 'trumpet',
  'club', 'cudgel', 'sling', 'whetstone', 'scabbard', 'hilt', 'pommel',
  // tools
  'net', 'hook', 'anchor', 'oar', 'sail', 'mast', 'rudder', 'rope', 'pulley', 'winch',
  'cart', 'wagon', 'wheel', 'axle', 'saddle', 'bridle', 'stirrup', 'horseshoe', 'spur',
  'whip', 'harness', 'plough', 'scythe', 'sickle', 'hoe', 'spade', 'rake', 'axe',
  'saw', 'hammer', 'anvil', 'bellows', 'tongs', 'kiln', 'loom', 'spindle', 'needle',
  'thread', 'thimble', 'button', 'nail', 'hinge', 'latch', 'ladder', 'lantern',
  'lamp', 'torch', 'candle', 'beacon', 'flint', 'tinder', 'mirror', 'lens', 'hourglass',
  'scales', 'weights', 'measure', 'compass', 'trap', 'snare', 'bait', 'cage',
  'shackles', 'noose', 'gallows', 'stocks', 'scaffold', 'millstone', 'grindstone',
  // clothes & cloth
  'cloak', 'robe', 'veil', 'mantle', 'gown', 'dress', 'shirt', 'boot', 'shoe',
  'hat', 'hood', 'mask', 'belt', 'buckle', 'apron', 'shawl', 'shroud', 'blanket',
  'quilt', 'rug', 'tapestry', 'curtain', 'cloth', 'wool', 'linen', 'silk', 'velvet',
  'fur', 'hide', 'leather', 'pelt', 'fleece', 'rags', 'livery',
  // food & substances
  'bread', 'loaf', 'flour', 'grain', 'wheat', 'barley', 'oats', 'hay', 'straw', 'seed',
  'apple', 'pear', 'plum', 'cherry', 'berry', 'grape', 'wine', 'ale', 'mead', 'cider',
  'brandy', 'milk', 'butter', 'cheese', 'egg', 'meat', 'bacon', 'ham', 'sausage',
  'venison', 'fish', 'stew', 'broth', 'porridge', 'pie', 'cake', 'honey', 'honeycomb',
  'salt', 'pepper', 'saffron', 'spice', 'garlic', 'onion', 'cabbage', 'turnip',
  'bean', 'mushroom', 'acorn', 'chestnut', 'herb', 'vinegar', 'oil', 'tallow',
  'soap', 'dye', 'pitch', 'tar', 'charcoal', 'peat', 'coal', 'ore', 'poison',
  'antidote', 'potion', 'salve', 'bandage', 'splint', 'crutch', 'cane', 'staff',
  // animals
  'falcon', 'hawk', 'hound', 'wolf', 'fox', 'badger', 'otter', 'deer', 'stag', 'doe',
  'boar', 'bear', 'horse', 'mare', 'stallion', 'colt', 'mule', 'donkey', 'ox', 'bull',
  'cow', 'calf', 'goat', 'sheep', 'ram', 'ewe', 'lamb', 'pig', 'sow', 'hen',
  'rooster', 'goose', 'duck', 'swan', 'dove', 'pigeon', 'raven', 'crow', 'magpie',
  'owl', 'wren', 'sparrow', 'eagle', 'heron', 'gull', 'eel', 'carp', 'trout',
  'salmon', 'herring', 'crab', 'oyster', 'snail', 'toad', 'frog', 'snake', 'adder',
  'lizard', 'rat', 'mouse', 'mole', 'bat', 'moth', 'bee', 'wasp', 'hornet', 'ant',
  'spider', 'worm', 'leech', 'cricket', 'beetle', 'butterfly', 'cat', 'swarm', 'hive',
  // plants & ground
  'moss', 'fern', 'ivy', 'thorn', 'nettle', 'reed', 'willow', 'oak', 'elm', 'birch',
  'pine', 'yew', 'holly', 'mistletoe', 'rose', 'lily', 'violet', 'daisy', 'poppy',
  'lavender', 'heather', 'clover', 'root', 'bark', 'sap', 'resin', 'timber', 'log',
  'plank', 'stump', 'firewood', 'stone', 'boulder', 'gravel', 'sand', 'clay', 'mud',
  'dust', 'ash', 'ember', 'smoke', 'feather', 'antler', 'tusk', 'claw', 'fang',
  'bone', 'skull', 'skeleton', 'relic', 'moon', 'star',
  // structures & fixtures
  'shrine', 'chapel', 'altar', 'well', 'fountain', 'bridge', 'ford', 'mill', 'dam',
  'ditch', 'hedge', 'fence', 'gate', 'wall', 'tower', 'cellar', 'attic', 'stable',
  'barn', 'granary', 'orchard', 'vineyard', 'garden', 'field', 'meadow', 'pasture',
  'crossroads', 'milestone', 'signpost', 'grave', 'tomb', 'hearth', 'chimney',
  'threshold', 'doorstep', 'window', 'roof', 'rafter', 'beam', 'door', 'stair',
  'trapdoor', 'tunnel', 'passage', 'archway', 'courtyard', 'alley', 'lane', 'path',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'fiddle', 'lute', 'harp', 'flute', 'bell', 'whistle', 'ship', 'boat',
  'raft', 'barge', 'skiff', 'hull', 'keel', 'figurehead', 'dock', 'pier',
  'harbor', 'lighthouse', 'reliquary', 'gravestone', 'epitaph', 'pulpit', 'spire', 'steeple',
  'cloister', 'crypt', 'pew', 'font', 'kettle', 'cauldron', 'pot', 'pan',
  'ladle', 'spoon', 'platter', 'bowl', 'cup', 'mug', 'tankard', 'spit',
  'oven', 'churn', 'mortar', 'pestle', 'sieve', 'funnel', 'keg', 'vat',
  'trough', 'dice', 'doll', 'puppet', 'hoop', 'marbles', 'ball', 'tooth',
  'braid', 'blood', 'heart', 'lightning', 'thunder', 'rainbow', 'icicle', 'snowdrift',
  'dew', 'puddle', 'wave', 'whirlpool', 'cliff', 'cave', 'cavern', 'gorge',
  'ravine', 'valley', 'hill', 'mountain', 'marsh', 'bog', 'swamp', 'moor',
  'glade', 'grove', 'thicket', 'ridge', 'peak', 'island', 'shore', 'cove',
  'bay', 'waterfall', 'rapids', 'hut', 'hovel', 'cottage', 'cabin', 'manor',
  'hall', 'keep', 'castle', 'palace', 'dungeon', 'moat', 'drawbridge', 'portcullis',
  'rampart', 'battlement', 'turret', 'watchtower', 'windmill', 'forge', 'smithy', 'tavern',
  'inn', 'bathhouse', 'bakery', 'brewery', 'tannery', 'warehouse', 'shed', 'coop',
  'kennel', 'sty', 'treasure', 'scepter', 'orb', 'throne', 'statue', 'sundial',
  'weathervane', 'chisel', 'mallet', 'wheelbarrow', 'handcart', 'sled', 'sleigh', 'stilts',
  'mace', 'flail', 'pike', 'javelin', 'dart', 'bolt', 'catapult', 'bonnet',
  'mitten', 'scarf', 'stocking', 'garter', 'breeches', 'tunic', 'pastry', 'tart',
  'pudding', 'dumpling', 'pancake', 'pickle', 'brine', 'lard', 'mustard', 'radish',
  'carrot', 'parsnip', 'leek', 'pea', 'lentil', 'fig', 'raisin', 'almond',
  'walnut', 'hazelnut', 'nutmeg', 'cinnamon', 'ginger', 'clove', 'sugar', 'weasel',
  'ferret', 'hedgehog', 'squirrel', 'hare', 'rabbit', 'lynx', 'wildcat', 'elk',
  'reindeer', 'walrus', 'whale', 'dolphin', 'shark', 'minnow', 'tadpole', 'newt',
  'salamander', 'viper', 'centipede', 'flea', 'louse', 'tick', 'maggot', 'grub',
  'caterpillar', 'slug', 'nightingale', 'lark', 'thrush', 'robin', 'swallow', 'cuckoo',
  'woodpecker', 'kingfisher', 'crane', 'stork', 'peacock', 'pheasant', 'partridge', 'quail',
  'buzzard', 'vulture', 'cedar', 'maple', 'beech', 'aspen', 'juniper', 'hawthorn',
  'bramble', 'briar', 'thistle', 'dandelion', 'buttercup', 'foxglove', 'nightshade', 'hemlock',
  'wormwood', 'mandrake', 'sage', 'thyme', 'rosemary', 'mint', 'parsley', 'fennel',
  'hops', 'flax', 'hemp', 'rye', 'marble', 'granite', 'slate', 'chalk',
  'quartz', 'crystal', 'glass', 'brick', 'tile', 'shingle', 'plaster', 'gold',
  'tin', 'lead', 'brass', 'pewter', 'caravan',
];

// ---- OCCASIONS (~160): events, moments, deadlines ----------------------------------------------
export const OCCASIONS: string[] = [
  // rites of passage
  'wedding', 'christening', 'birth', 'name-day', 'funeral', 'wake', 'burial', 'anniversary',
  'knighting', 'initiation', 'retirement', 'farewell', 'departure', 'arrival',
  'homecoming', 'return', 'send-off', 'oath-taking',
  // calendar & season
  'midsummer', 'midwinter', 'solstice', 'spring', 'summer', 'autumn', 'winter', 'thaw',
  'frost', 'snow', 'rain', 'hail', 'storm', 'gale', 'flood', 'drought', 'wildfire',
  'earthquake', 'landslide', 'avalanche', 'eclipse', 'comet', 'dawn', 'dusk', 'noon',
  'nightfall', 'tide', 'harvest', 'planting', 'shearing', 'lambing', 'slaughter',
  'brewing', 'baking', 'gleaning', 'haymaking', 'threshing', 'salting', 'smoking',
  // feasts & gatherings
  'market', 'fair', 'festival', 'feast', 'banquet', 'fast', 'procession', 'pilgrimage',
  'prayer', 'dance', 'play', 'pageant', 'contest', 'tournament', 'joust', 'race',
  'game', 'gathering', 'meeting', 'council', 'assembly', 'reunion', 'celebration',
  'toast', 'bonfire', 'carnival', 'holiday', 'vigil', 'ceremony',
  // justice & rule
  'census', 'muster', 'audit', 'inspection', 'visitation',
  'lottery', 'auction', 'hearing', 'tribunal', 'reckoning',
  'collection', 'levy', 'draft',
  // commerce & work moments
  'sailing', 'voyage', 'journey', 'landing', 'launch', 'delivery', 'shipment',
  'opening', 'closing', 'signing', 'settlement', 'payment', 'deadline',
  'stocktaking', 'weighing', 'measuring', 'branding', 'shoeing', 'foaling',
  // disruptions
  'fire', 'collapse', 'shipwreck', 'sinking', 'outbreak', 'fever', 'alarm', 'battle',
  'war', 'peace', 'victory', 'defeat', 'exodus', 'stampede',
  'curfew', 'search', 'sweep', 'moonrise', 'moonset',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'sowing', 'mowing', 'reaping', 'pruning', 'milking', 'blizzard', 'downpour', 'mudslide',
  'revel', 'crossing', 'unveiling', 'dedication', 'calving', 'hatching', 'sunset', 'sunrise',
  'sabbath',
];

// ---- PEOPLE (~230): roles & figures --------------------------------------------------------------
export const PEOPLE: string[] = [
  // kin & household
  'widow', 'widower', 'orphan', 'twins', 'bastard', 'heir', 'heiress', 'firstborn',
  'stepmother', 'godmother', 'grandmother', 'aunt', 'uncle', 'cousin', 'nephew', 'niece',
  'foundling', 'ward', 'midwife', 'nurse', 'servant', 'maid', 'housekeeper', 'steward',
  'daughter', 'son', 'mother', 'father', 'sister', 'brother', 'husband', 'wife',
  // authority
  'lord', 'lady', 'baron', 'duke', 'prince', 'princess', 'king', 'queen', 'mayor',
  'magistrate', 'sheriff', 'constable', 'bailiff', 'warden', 'jailer', 'hangman',
  'herald', 'crier', 'messenger', 'envoy', 'clerk', 'scribe', 'taxman', 'gatekeeper',
  'watchman', 'sentry', 'guard', 'official', 'inspector', 'examiner',
  // church
  'priest', 'monk', 'nun', 'friar', 'abbot', 'abbess', 'bishop', 'chaplain', 'hermit',
  'pilgrim', 'preacher', 'zealot', 'heretic', 'martyr', 'saint', 'sinner', 'penitent',
  'convert', 'novice', 'acolyte', 'gravedigger',
  // trades
  'smith', 'tanner', 'weaver', 'dyer', 'spinner', 'seamstress', 'tailor', 'cobbler',
  'miller', 'baker', 'brewer', 'butcher', 'fishmonger', 'fisherman', 'sailor', 'boatman',
  'ferryman', 'shepherd', 'goatherd', 'swineherd', 'drover', 'plowman', 'farmer',
  'farmhand', 'milkmaid', 'beekeeper', 'forester', 'woodcutter', 'trapper', 'hunter',
  'falconer', 'gamekeeper', 'stableboy', 'carter', 'porter', 'laborer',
  'mason', 'carpenter', 'thatcher', 'painter', 'carver', 'potter', 'glassblower',
  'jeweler', 'goldsmith', 'locksmith', 'mapmaker', 'cook', 'innkeeper', 'shopkeeper',
  // learning & arts
  'scholar', 'student', 'teacher', 'tutor', 'librarian', 'poet', 'bard', 'minstrel',
  'singer', 'dancer', 'actor', 'acrobat', 'juggler', 'puppeteer', 'storyteller',
  'sculptor', 'apprentice', 'journeyman', 'master', 'prodigy',
  // healing & lore
  'healer', 'surgeon', 'barber', 'apothecary', 'herbalist', 'alchemist', 'astrologer',
  'seer', 'prophet', 'witch', 'sorcerer', 'embalmer',
  // road & margins
  'trader', 'merchant', 'peddler', 'moneylender', 'pawnbroker', 'courtesan', 'mistress',
  'matchmaker', 'suitor', 'admirer', 'sweetheart', 'lover', 'bride', 'groom',
  'spinster', 'bachelor', 'beggar', 'vagrant', 'leper', 'madman', 'fool', 'jester',
  'drunkard', 'gambler', 'urchin', 'runaway',
  // violence & shadow
  'bandit', 'outlaw', 'highwayman', 'thief', 'cutpurse', 'poacher', 'smuggler',
  'pirate', 'forger', 'swindler', 'soldier', 'archer', 'sergeant', 'veteran',
  'deserter', 'mercenary', 'bodyguard', 'champion', 'thug', 'bully', 'henchman',
  'accomplice', 'ringleader', 'traitor', 'spy', 'informer', 'assassin', 'duelist',
  // strangers & arrivals
  'stranger', 'foreigner', 'refugee', 'survivor', 'castaway', 'wanderer', 'nomad',
  'traveler', 'guide', 'hostage', 'prisoner', 'imposter', 'witness', 'namesake', 'scapegoat',
  'gossip', 'busybody', 'neighbor', 'landlord', 'tenant', 'lodger', 'guest', 'host',
  'patron', 'benefactor', 'overseer', 'go-between', 'peacemaker', 'troublemaker',
  'agitator', 'courtier', 'advisor', 'confidant', 'flatterer', 'rival', 'double',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'knight', 'squire', 'page', 'count', 'countess', 'duchess', 'earl', 'emperor',
  'empress', 'regent', 'chancellor', 'treasurer', 'ambassador', 'courier', 'scout', 'general',
  'captain', 'commander', 'admiral', 'drummer', 'piper', 'deacon', 'prior', 'choirboy',
  'shipwright', 'cooper', 'glover', 'saddler', 'ropemaker', 'sailmaker', 'candlemaker', 'miner',
  'ratcatcher', 'chimneysweep', 'tinker', 'cheesemaker', 'harpist', 'fiddler', 'outcast', 'grandfather',
  'stepfather', 'granddaughter', 'grandson', 'elder', 'ancestor', 'descendant', 'lookout', 'burglar',
  'brigand', 'graverobber', 'poisoner', 'kidnapper', 'blackmailer', 'counterfeiter', 'harbormaster', 'coroner',
  'judge', 'juror', 'lawyer', 'executioner', 'physician', 'philosopher', 'historian', 'astronomer',
  'architect', 'surveyor', 'translator', 'interpreter', 'godfather', 'godchild', 'washerwoman', 'chambermaid',
  'reaper', 'sower', 'mower', 'thresher', 'oarsman', 'deckhand', 'navigator', 'mutineer',
];

// ---- UNCANNY (~140): folk-horror & wonder --------------------------------------------------------
export const UNCANNY: string[] = [
  // presences
  'ghost', 'specter', 'phantom', 'wraith', 'spirit', 'shade', 'apparition', 'haunting',
  'changeling', 'fairy', 'goblin', 'imp', 'sprite', 'giant', 'ogre', 'troll', 'dragon',
  'serpent', 'unicorn', 'griffin', 'phoenix', 'mermaid', 'siren', 'vampire', 'ghoul',
  'demon', 'devil', 'fiend', 'angel', 'familiar', 'revenant', 'doppelganger',
  'shapeshifter', 'hag', 'monster', 'beast', 'creature', 'thing', 'presence',
  // signs & fates
  'omen', 'premonition', 'prophecy', 'vision', 'dream', 'nightmare', 'trance',
  'curse', 'spell', 'charm', 'enchantment', 'illusion', 'possession', 'exorcism',
  'madness', 'frenzy', 'miracle', 'marvel', 'blessing', 'amulet', 'effigy', 'rune',
  'doom', 'luck', 'misfortune', 'jinx', 'wish', 'bane',
  // practices
  'witchcraft', 'sorcery', 'necromancy', 'alchemy', 'magic', 'ritual', 'sacrifice',
  'offering', 'coven', 'summoning', 'banishing', 'warding', 'divination',
  'invocation', 'consecration', 'anointing', 'purification',
  // places & thresholds
  'underworld', 'afterlife', 'heaven', 'hell', 'graveyard', 'catacomb', 'labyrinth',
  'maze', 'wilderness', 'wasteland', 'ruins',
  'darkness', 'twilight', 'mist', 'fog', 'silence', 'echo', 'howl', 'knocking',
  // wrongness
  'transformation', 'resurrection', 'immortality', 'invisibility', 'petrification',
  'levitation', 'portent', 'hex', 'talisman', 'wail', 'second-sight', 'evil-eye',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'banshee', 'werewolf', 'bogeyman', 'pixie', 'gnome', 'hobgoblin', 'golem', 'gargoyle',
  'basilisk', 'kraken', 'leviathan', 'knell', 'stargazing', 'broomstick', 'wand', 'spellbook',
  'elixir', 'sleepwalking', 'delirium', 'barrow', 'withering', 'vanishing', 'birthmark', 'warlock',
  'wizard', 'enchantress', 'necromancer', 'oracle', 'druid',
];

// ---- MOODS (~50): genre / mode words — what KIND of story this wants to be -----------------------
export const MOODS: string[] = [
  'adventure', 'mystery', 'tragedy', 'comedy', 'farce', 'romance', 'caper', 'heist',
  'intrigue', 'scandal', 'conspiracy', 'chase', 'siege', 'standoff', 'rescue',
  'downfall', 'reversal', 'awakening', 'ordeal',
  'masquerade', 'duel', 'aftermath', 'unraveling', 'descent',
  'misadventure', 'disaster', 'escapade', 'gambit',
  'fable', 'legend', 'myth', 'saga', 'spectacle',
  // ---- 2026-07-17 expansion (designer: pools toward ~1000; agent-generated, bar-linted) ----
  'quest', 'hunt', 'escort', 'expedition', 'crusade', 'witch-hunt', 'last stand', 'dilemma',
  'ruse', 'rebirth', 'restoration', 'epic', 'chronicle', 'parable', 'satire',
];

// ---- the sampler (§5 locked shape: 1 BOND + 1 TIE + 1-2 wildcards) -------------------------------
// 🛠 2026-07-12: QUALITIES enters ONLY as the 2nd wildcard (35% lean) — the guaranteed wildcard
// is always a concrete noun, so a modifier never lands alone ("grief, theft, only" read as
// nonsense; a quality needs a noun in the draw to bite on: 'banned' + 'festival').
const WILDCARD_NOUNS = [...THINGS, ...OCCASIONS, ...PEOPLE, ...UNCANNY, ...MOODS];
export function sampleKeywords(rng: Rng): string[] {
  // LABELLED by axis on purpose. The atoms come from different pools and seed different parts of a
  // card; dealt as a bare list the writer welds two into one noun phrase (a cask of "election milk").
  // Three prompt-side rewrites failed to stop it — §0: wording is the weakest lever, shaping wins.
  const draw = [`bond: ${rng.pick(BOND)}`, `happening: ${rng.pick(TIE)}`, `thing: ${rng.pick(WILDCARD_NOUNS)}`];
  if (!rng.chance(0.25)) draw.push(rng.chance(0.35) ? `quality: ${rng.pick(QUALITIES)}` : `thing: ${rng.pick(WILDCARD_NOUNS)}`);
  return draw;
}

// ---- arrival sparks (🛠 2026-07-12 ATOMIZED like keywords: the old pools were authored images
// ('a light where none should burn') the writer could only transcribe — now the spark is 2-3
// plain seed atoms the writer combines its own way) ------------------------------------------------
const SPARK_WHO = ['a courier', 'a shepherd', 'a widow', 'a child', 'a friar', 'a peddler',
  'a creditor', 'a neighbor', 'a poacher', 'an innkeeper', 'a ferryman', 'a drover',
  'a beggar', 'a clerk', 'a town official', 'a wounded survivor', 'a straggler',
  'an old friend of the company', 'a rival', 'a passing trader', 'a hooded stranger',
  'a tenant farmer', 'a miller', 'a fisherman', 'a gravedigger', 'a tinker', 'a midwife',
  'a stableboy', 'a nun', 'a woodcutter', 'a horse trader', 'a hired guard',
  'a runaway servant', 'a village elder', 'a hunter', 'a washerwoman', 'a swineherd',
  'one of your own soldiers', 'a petitioner', 'a drunk', 'an apprentice', 'a shipmaster'];
const SPARK_WHAT = ['a letter', 'a plea', 'a summons', 'a warrant', 'a rumor', 'a bounty',
  'a token', 'a name', 'a warning', 'an offer', 'a grievance', 'a tale', 'a demand',
  'a debt', 'a map', 'a confession', 'a gift', 'a threat', 'a question', 'an invitation',
  'an apology', 'a boast', 'a price', 'a list', 'an accusation'];
// sign atoms: OBSERVABLE facts, no inference, no poetry
const SPARK_SEEN = ['smoke over the trees', 'fires on the ridge at night', 'an abandoned cart',
  'animals fleeing the wood', 'fresh graves', 'an empty road at midday', 'a boat adrift',
  'circling crows', 'a missed market day', 'prices doubled overnight', 'strange hoofprints',
  'a shuttered farmhouse', 'travelers turning back', 'a felled bridge', 'a dry stream',
  'washing left out for days', 'a riderless horse', 'bells at the wrong hour',
  'a cold chimney at a lived-in house', 'livestock loose on the road', 'a burned hayrick',
  'doors barred in daylight', 'a beacon lit in peacetime', 'more strangers on the road than usual',
  'carts leaving full and returning empty', 'the weekly peddler never came', 'fresh-cut stumps past the boundary',
  'lamplight in a house that stands empty', 'tracks that end mid-field', 'a gate left open that is always locked'];
const SPARK_WHERE = ['on the ridge', 'at the ford', 'on the mill road', 'by the far bank',
  'at the tree line', 'at the crossroads', 'in the south pasture', 'by the old bridge',
  'on the quarry track', 'near the churchyard', 'at the gate', 'below the walls',
  'on the cart road', 'in the lower fields', 'by the charcoal camps', 'at the boundary stone'];
const PATROL_SPARKS = ['a returning patrol saw it', 'one of your soldiers heard it on the road back',
  'the wood-detail came back full of talk', 'your forager marked the spot and hurried home',
  'the night watch marked fires on the far ridge', 'a scout\'s report, two days stale'];
const TALK_SPARKS = ['talk at the market', 'a quarrel overheard at the mill',
  'the tavern keeps repeating one name', 'washerwomen trading the same story',
  'a sermon that named no names but meant one', 'carters who all take the long way round now'];
const NOTICE_SPARKS = ['a posted bounty', 'a notice nailed at the crossroads',
  'a guild letter passed hand to hand', 'a standing reward, long unclaimed',
  'a magistrate\'s writ, badly copied'];

export type IntakeChannel = 'bringer' | 'sign' | 'patrol' | 'talk' | 'notice';
// VARIANTS per channel — a single fact string became a stamp ("The company's own sweep" ×3/run),
// and a negation in one ("no one brought it") leaked onto cards verbatim.
// Widened 3→7 per channel 2026-07-12 (3 variants stamp over a long campaign).
const INTAKE_FACT: Record<IntakeChannel, string[]> = {
  bringer: ['someone came to the fort with it', 'it was carried to the gate in person',
    'it arrived with a caller at the gate', 'it was brought to the company directly',
    'a visitor put it before the company', 'it came through the gate with the morning\'s callers',
    'whoever carried it did not linger'],
  sign: ['it was seen from the fort\'s own walls', 'the fort noticed it before anyone spoke of it',
    'the signs of it are plain from the walls', 'it showed itself before any word of it came',
    'the walls have a view of it', 'the company saw it before hearing of it',
    'it sits in plain sight of the watch'],
  patrol: ['the company\'s own people came back with it', 'it came home with the last patrol',
    'one of your own crossed it in the field', 'your own people walked into it',
    'it was picked up in the course of the company\'s rounds', 'the company found it while out on other business',
    'it followed your soldiers home'],
  talk: ['it was picked up from common talk in the country nearby', 'the countryside is talking of it',
    'it is the story every visitor tells this week', 'it drifted in with ordinary gossip',
    'half the district has a version of it', 'it came secondhand, thirdhand, and then again',
    'everyone tells it a little differently'],
  notice: ['it stands promised in public writing', 'it is posted for any taker',
    'the offer has hung unclaimed a while', 'it is written where anyone can read it',
    'the promise of payment is public', 'it waits on a board for whoever will have it',
    'the notice has weathered a season already'],
};

// a saga's CARE beat must not open on blood or menace
const GRIM = /wounded|creditor|warrant|bounty|debt|rival|confession|graves|burned|barred|beacon|threat|accusation/;
const OPENING_TIMES = ['at first light', 'mid-morning', 'at noon', 'late afternoon', 'at dusk',
  'after dark', 'in the small hours', 'in the rain', 'in fog', 'on market day'];
export function sampleOpening(rng: Rng, opts?: { gentle?: boolean; channel?: IntakeChannel }):
  { spark: string; sparkCore: string; landmarkAllowed: boolean; channel: IntakeChannel; intake: string } {
  const channel = opts?.channel ?? rng.weighted<IntakeChannel>(
    [['bringer', 4.5], ['sign', 2.5], ['patrol', 1.2], ['talk', 1.2], ['notice', 0.6]]);
  const pick = (a: string[]) => rng.pick(opts?.gentle ? a.filter(w => !GRIM.test(w)) : a);
  let atoms: string[]; let core: string;
  if (channel === 'sign') {
    core = pick(SPARK_SEEN);
    atoms = [core];
    if (rng.chance(0.6)) atoms.push(rng.pick(SPARK_WHERE));
    if (rng.chance(0.2)) atoms.push(rng.pick(OPENING_TIMES));
  } else if (channel === 'patrol') { core = pick(PATROL_SPARKS); atoms = [core]; }
  else if (channel === 'talk') { core = pick(TALK_SPARKS); atoms = [core]; }
  else if (channel === 'notice') { core = pick(NOTICE_SPARKS); atoms = [core]; }
  else {
    core = pick(SPARK_WHO);
    atoms = [core, pick(SPARK_WHAT)];
    // time only SOMETIMES seasons the spark — any time token at all kept teaching cards to open
    // "At dusk, ..." (~50% even after folding + an explicit ban); most cards get no clock to lead with
    if (rng.chance(0.25)) atoms.push(rng.pick(OPENING_TIMES));
  }
  return { spark: atoms.join(' · '), sparkCore: core, landmarkAllowed: rng.chance(0.15), channel, intake: rng.pick(INTAKE_FACT[channel]) };
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

/** saga tone, weighted toward lighter (BIBLE.md tone knob; PLAYER_PREFERENCES shift is a later 🛠)
 *  2026-07-10: BIBLE.md's adventurous/tense added to the pool (doc list ∪ impl list) */
const TONES: [string, number][] = [
  ['slice-of-life', 2], ['wry', 3], ['warm', 2], ['bittersweet', 2],
  ['adventurous', 2], ['tense', 1.5], ['grim', 1.5], ['dark', 1],
];
export function pickTone(rng: Rng): string { return rng.weighted(TONES) }

/** seed sparks for chain genesis (Polti-anchored what-ifs, weighted by region later 🛠)
 *  These are the ONE list that is SUPPOSED to be premise-shaped — a genesis needs a what-if.
 *  🛠 2026-07-12 re-balanced by CONFLICT TYPE: the old pool skewed legal-ritual (wills, claims,
 *  rites, witnesses) and a judged campaign grew FIVE witnessed-rite sagas from it — the seed
 *  mix, not the writer, was the monoculture. Now spread over rescue/hunt/heist/betrayal/love/
 *  revenge/survival/identity/crime/uncanny/power; append-to-grow keeps the balance. */
const SEEDS = [
  // rescue & captivity
  'a ransom paid to the wrong hands', 'a hostage both sides would rather forget',
  'a kidnapping staged to look like a running-away', 'an heir who does not want to be found',
  // hunt & beast
  'a beast that only hunts the guilty', 'a predator that has learned to follow funerals',
  'something in the millpond that takes lambs and dogs but never fish',
  // heist & theft
  'a vault key split among three enemies who now need each other',
  'a theft the victim refuses to admit happened',
  // betrayal & war
  'an old victory that was really a massacre', 'a garrison sold to raiders by its own paymaster',
  'a truce that holds only while one old man lives', 'a siege that ended too quietly',
  'a deserter who knows where the bodies are',
  // love & kinship
  'a betrothal that would end a feud', 'a marriage sworn to end a war neither side stopped',
  'a love letter delivered twenty years late', 'a foundling raised under someone else’s name',
  // revenge
  'a widow buying, one by one, the men who burned her farm',
  'an exile come home richer than the lord who banished them',
  // survival & land
  'a village that must move before the water rises and cannot agree where',
  'a winter road kept open by feeding something at the pass',
  'a granary full the year everyone starved', 'a village that pays two masters and can afford neither',
  // identity & secrets
  'a dead man seen buying horses at three fairs', 'a list of names the respectable would kill to burn',
  'an oath kept long after it should have broken',
  // crime & coin
  'a debt sold three times over', 'a smuggler’s route that moves more than goods',
  'a counterfeiter whose fakes are better than the mint’s coin', 'a bridge toll that funds something worse',
  // uncanny
  'a saint’s bones that will not stay buried', 'a cure that works only while its price is paid',
  'a road that was safe until someone made it safer', 'a relic that two shrines both claim',
  // power & law (capped — this shape once owned the pool)
  'a will that frees the wrong people', 'two heirs, one seal, and no witnesses',
  'a border stone moved by night, a little each year',
  // performance & voice
  'a caged singer whose songs start riots',
  // wagers
  'a wager between lords paid in other people’s lives',
  'a healer who chooses who is worth saving',
];
export function sampleSeed(rng: Rng): string { return rng.pick(SEEDS) }
