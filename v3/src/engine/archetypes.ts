// ONE-OFF ARCHETYPES — the kind of work a lead promises.
//
// An archetype is a DATA ROW, not a code branch. It carries a gloss (the only thing the card
// writer ever sees, and only for the drawn one — so this list costs the same prompt at 100 rows
// as it did at 8), a reward PROFILE shared with its siblings, a slot range, and an optional fort
// gate. `splitOneOff` switches on the profile; nothing switches on the name.
//
// WHY SO MANY (designer, 2026-08-28: "can you just generate 100 to make it not monotonous"): the
// archetype is the strongest input-shaping lever on a one-off card — §0's hierarchy puts dealt
// facts above wording, and this is the dealt fact that decides what the job IS. At eight names a
// player meets a repeat every few leads. The pool is necessarily FIXED (it picks the reward
// branch, so it cannot be AI-written without a call per lead), so the repetition horizon is what
// we can move: across a ~300-lead campaign each of these is met about three times. The thing that
// repeats is a one-word label; the card underneath it is written fresh every time.
//
// `investigate` and `lead-hunt` are load-bearing NAMES elsewhere in the engine (sceneMode, the
// standing lodge faucet, continuation leads) — do not rename them.

/** what a job of this kind pays. ~8 shapes shared across the whole pool. */
export type Profile = 'spoils' | 'captive' | 'recruit' | 'relic' | 'lead' | 'coin' | 'find' | 'bloody';

export interface ArchetypeDef {
  gloss: string;                 // ≤10 words, the writer's only view of the archetype
  profile: Profile;
  slots: [number, number];
  gate?: 'dungeon';              // a captive needs somewhere to put them
}

/** the ROW for every kind of one-off work. Pool sizes ARE the draw weights — a uniform pick over
 *  this table is how often each kind of work appears, so the counts per profile are deliberate. */
export const ARCHETYPES = {
  // ── taking a place by force ────────────────────────────────── spoils ──
  'raid': { gloss: 'hit a holdout for spoils', profile: 'spoils', slots: [2, 3] },
  'sack': { gloss: 'strip a place before anyone rallies', profile: 'spoils', slots: [2, 3] },
  'answering-raid': { gloss: 'answer a raid in kind', profile: 'spoils', slots: [2, 3] },
  'camp-strike': { gloss: 'hit them where they sleep', profile: 'spoils', slots: [2, 3] },
  'toll-breaking': { gloss: 'open a road someone closed', profile: 'spoils', slots: [2, 3] },
  'cattle-lifting': { gloss: 'take the herd and outrun the anger', profile: 'spoils', slots: [2, 3] },
  'press-breaking': { gloss: 'scatter a gang that has grown bold', profile: 'spoils', slots: [2, 3] },
  'gate-forcing': { gloss: 'get past a door answering to someone else', profile: 'spoils', slots: [2, 3] },
  'watch-breaking': { gloss: 'take a picket without waking the rest', profile: 'spoils', slots: [1, 2] },
  'stores-taking': { gloss: 'they have more than they need', profile: 'spoils', slots: [2, 3] },
  'wreck-taking': { gloss: 'reach a wreck before the water does', profile: 'spoils', slots: [1, 2] },
  'tithe-seizing': { gloss: 'the collection never reached anyone', profile: 'spoils', slots: [1, 2] },
  'boat-taking': { gloss: 'it is tied up and lightly watched', profile: 'spoils', slots: [1, 2] },
  'baggage-cutting': { gloss: 'a column, and the tail of it', profile: 'spoils', slots: [2, 3] },

  // ── work that costs you ─────────────────────────────────────── bloody ──
  'den-clearing': { gloss: 'put something out of its hole', profile: 'bloody', slots: [2, 3] },
  'nest-burning': { gloss: 'burn out what has bred there', profile: 'bloody', slots: [2, 3] },
  'siege-lifting': { gloss: 'break a ring around a place', profile: 'bloody', slots: [3, 4] },
  'road-clearing': { gloss: 'make a road passable again', profile: 'bloody', slots: [2, 3] },
  'cleansing': { gloss: 'something unnatural has settled in', profile: 'bloody', slots: [2, 3] },
  'laying-to-rest': { gloss: 'the dead are not resting', profile: 'bloody', slots: [2, 3] },
  'blight-cutting': { gloss: 'stop it spreading, whatever it costs', profile: 'bloody', slots: [2, 3] },
  'ground-holding': { gloss: 'stand at a place and keep it', profile: 'bloody', slots: [2, 3] },
  'bridge-holding': { gloss: 'nobody crosses until it is settled', profile: 'bloody', slots: [2, 3] },
  'culling': { gloss: 'too many of them, and they are coming closer', profile: 'bloody', slots: [2, 3] },
  'putting-down': { gloss: 'it was someone\'s once', profile: 'bloody', slots: [1, 2] },
  'eviction': { gloss: 'they will not go, and they have to go', profile: 'bloody', slots: [2, 3] },
  'quarantine': { gloss: 'nobody in or out, whoever asks', profile: 'bloody', slots: [2, 3] },
  'reprisal-raid': { gloss: 'the fort has to be seen doing something', profile: 'bloody', slots: [1, 2] },
  'rear-guard': { gloss: 'hold while the others get clear', profile: 'bloody', slots: [2, 3] },

  // ── an object is the prize ───────────────────────────────────── relic ──
  'salvage': { gloss: 'pick a ruin over before someone else does', profile: 'relic', slots: [1, 2] },
  'barrow-opening': { gloss: 'open what was closed on purpose', profile: 'relic', slots: [2, 3] },
  'grave-work': { gloss: 'the ground is holding something', profile: 'relic', slots: [1, 2] },
  'vault-cracking': { gloss: 'a lock, and a reason it was locked', profile: 'relic', slots: [1, 2] },
  'reliquary-taking': { gloss: 'a holy thing, in the wrong hands', profile: 'relic', slots: [2, 3] },
  'hoard-finding': { gloss: 'someone died rich and told nobody where', profile: 'relic', slots: [1, 2] },
  'wreck-diving': { gloss: 'go down for what went down with it', profile: 'relic', slots: [1, 2] },
  'corpse-stripping': { gloss: 'the dead have no use for it now', profile: 'relic', slots: [1, 2] },
  'cache-lifting': { gloss: 'they buried it and mean to come back', profile: 'relic', slots: [1, 2] },
  'workshop-taking': { gloss: 'the maker is gone, the work is not', profile: 'relic', slots: [1, 2] },
  'root-burning': { gloss: 'something grew where it should not have', profile: 'relic', slots: [1, 2] },
  'warding': { gloss: 'set a thing that keeps a thing out', profile: 'relic', slots: [1, 2] },
  'thing-binding': { gloss: 'it cannot be killed; it can be held', profile: 'relic', slots: [2, 3] },
  'haunt-breaking': { gloss: 'a house nobody will enter', profile: 'relic', slots: [1, 2] },
  'curse-lifting': { gloss: 'someone was told a thing and it stuck', profile: 'relic', slots: [1, 2] },
  'quiet-theft': { gloss: 'take it without anyone knowing it went', profile: 'relic', slots: [1, 2] },

  // ── an object, and coin with it ───────────────────────────────── find ──
  'investigate': { gloss: 'uncover a hidden thing', profile: 'find', slots: [1, 2] },
  'hunt': { gloss: 'track down a person or beast', profile: 'find', slots: [1, 2] },
  'tracing': { gloss: 'follow where something went', profile: 'find', slots: [1, 2] },
  'prospecting': { gloss: 'find out whether it is worth anything', profile: 'find', slots: [1, 2] },
  'body-naming': { gloss: 'nobody knows who this was', profile: 'find', slots: [1, 2] },
  'omen-reading': { gloss: 'nobody can say what is wrong, only that it is', profile: 'find', slots: [1, 2] },
  'debt-seizure': { gloss: 'take the goods when the coin never came', profile: 'find', slots: [1, 2] },
  'inheritance-work': { gloss: 'an estate, and nobody agreeing whose', profile: 'find', slots: [1, 2] },
  'strayed-goods': { gloss: 'it left the road and did not come back', profile: 'find', slots: [1, 2] },
  'wrong-grave': { gloss: 'the name on it is not the man in it', profile: 'find', slots: [1, 2] },
  'sinkhole-work': { gloss: 'the ground opened and showed something', profile: 'find', slots: [1, 2] },
  'flood-leavings': { gloss: 'the water went down and left this', profile: 'find', slots: [1, 2] },

  // ── word is the prize ─────────────────────────────────────────── lead ──
  'lead-hunt': { gloss: 'sweep for rumors', profile: 'lead', slots: [1, 1] },
  'shadowing': { gloss: 'watch someone without being watched', profile: 'lead', slots: [1, 1] },
  'questioning': { gloss: 'get an answer out of people who have one', profile: 'lead', slots: [1, 2] },
  'surveying': { gloss: 'walk ground nobody has walked lately', profile: 'lead', slots: [1, 2] },
  'mapping': { gloss: 'put a road on paper for the first time', profile: 'lead', slots: [1, 2] },
  'rumour-buying': { gloss: 'somebody knows and somebody will sell it', profile: 'lead', slots: [1, 1] },
  'listening': { gloss: 'sit somewhere long enough to hear it', profile: 'lead', slots: [1, 1] },
  'census-taking': { gloss: 'count what is there and who is missing', profile: 'lead', slots: [1, 2] },
  'witness-finding': { gloss: 'someone saw it and has not said', profile: 'lead', slots: [1, 2] },
  'sign-reading': { gloss: 'the marks mean something to someone', profile: 'lead', slots: [1, 1] },
  'parley': { gloss: 'carry terms to somebody who hates them', profile: 'lead', slots: [1, 1] },
  'bribing': { gloss: 'find the price and pay it', profile: 'lead', slots: [1, 1] },
  'back-tracking': { gloss: 'where did they come from, not where they went', profile: 'lead', slots: [1, 2] },

  // ── bringing someone back alive ─────────────────────────── captive 🔒 ──
  'capture': { gloss: 'take someone alive', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'bounty': { gloss: 'a name is posted; bring them in', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'warrant-serving': { gloss: 'a writ names them; the writ needs hands', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'debt-taking': { gloss: 'they owe, and will not come for asking', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'press-ganging': { gloss: 'take the ones nobody will miss', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'hostage-taking': { gloss: 'take one worth keeping whole', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'surrender-forcing': { gloss: 'make them yield rather than fight', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'runaway-taking': { gloss: 'they ran; someone wants them back', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'oath-breaking': { gloss: 'he swore to one house and serves another', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'deserter-work': { gloss: 'he left with things that were not his', profile: 'captive', slots: [1, 2], gate: 'dungeon' },

  // ── getting someone out ────────────────────────────────────── recruit ──
  'rescue': { gloss: 'free someone held', profile: 'recruit', slots: [1, 2] },
  'jail-breaking': { gloss: 'get them out before the sentence', profile: 'recruit', slots: [2, 3] },
  'gallows-cutting': { gloss: 'reach them before the drop', profile: 'recruit', slots: [2, 3] },
  'ransoming': { gloss: 'carry the price and bring back the person', profile: 'recruit', slots: [1, 2] },
  'unbinding': { gloss: 'something holds them that is not rope', profile: 'recruit', slots: [1, 2] },
  'debt-clearing': { gloss: 'buy someone out of what they owe', profile: 'recruit', slots: [1, 1] },
  'homecoming': { gloss: 'walk someone back who cannot walk alone', profile: 'recruit', slots: [1, 2] },
  'vouching': { gloss: 'stand for someone nobody else will', profile: 'recruit', slots: [1, 1] },
  'sanctuary-running': { gloss: 'move someone beyond reach', profile: 'recruit', slots: [1, 2] },
  'recruiting-drive': { gloss: 'find out who might be persuaded', profile: 'recruit', slots: [1, 1] },
  'apprentice-buying': { gloss: 'a trade will sell a pair of hands', profile: 'recruit', slots: [1, 1] },

  // ── work you are simply paid for ──────────────────────────────── coin ──
  'contract': { gloss: 'an agreed task for set pay', profile: 'coin', slots: [1, 1] },
  'escort': { gloss: 'guard a journey', profile: 'coin', slots: [1, 2] },
  'haulage': { gloss: 'move something heavy through somewhere bad', profile: 'coin', slots: [2, 3] },
  'standing-watch': { gloss: 'be there, visibly, for a while', profile: 'coin', slots: [1, 2] },
  'debt-collection': { gloss: 'go and ask, and keep asking', profile: 'coin', slots: [1, 2] },
  'arbitration': { gloss: 'two parties, one answer, no blood', profile: 'coin', slots: [1, 1] },
  'drover-work': { gloss: 'get them there with them still alive', profile: 'coin', slots: [1, 2] },
  'ferrying': { gloss: 'across, quietly, and back', profile: 'coin', slots: [1, 2] },
  'bodyguarding': { gloss: 'somebody expects to be killed this week', profile: 'coin', slots: [1, 2] },
  'funeral-guard': { gloss: 'let them bury him without interruption', profile: 'coin', slots: [1, 2] },
  'harvest-guard': { gloss: 'the crop comes in or the village does not eat', profile: 'coin', slots: [2, 3] },
  'well-clearing': { gloss: 'the water is wrong and the village is thirsty', profile: 'coin', slots: [1, 2] },
  'sabotage': { gloss: 'break it so it stays broken', profile: 'coin', slots: [1, 2] },
  'smuggling': { gloss: 'carry it past people paid to stop it', profile: 'coin', slots: [1, 2] },
  'arson': { gloss: 'burn it and be somewhere else', profile: 'coin', slots: [1, 2] },
  'framing': { gloss: 'make it look like someone else', profile: 'coin', slots: [1, 2] },
  'feud-settling': { gloss: 'two houses, and a body between them', profile: 'coin', slots: [1, 2] },
  'intimidation-work': { gloss: 'make plain what happens next time', profile: 'coin', slots: [1, 2] },
} as const satisfies Record<string, ArchetypeDef>;

export type Archetype = keyof typeof ARCHETYPES;

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPES) as Archetype[];
/** `as const` keeps the KEYS literal (so Archetype is the union of names) but narrows each row to
 *  its own shape, which loses the optional `gate`. Read rows through here. */
const defOf = (a: Archetype): ArchetypeDef => ARCHETYPES[a] as ArchetypeDef;
export const profileOf = (a: Archetype): Profile => defOf(a).profile;
export const slotRangeOf = (a: Archetype): [number, number] => defOf(a).slots;
export const glossOf = (a: Archetype): string | undefined => ARCHETYPES[a] ? defOf(a).gloss : undefined;

/** the random board pool: everything the fort can actually take on. `lead-hunt` is excluded —
 *  it is the Scouting lodge's own standing repeatable, not a thing the board rolls. */
export function boardPool(ctx: { hasDungeon: boolean }): Archetype[] {
  return ARCHETYPE_NAMES.filter(a =>
    a !== 'lead-hunt' && (defOf(a).gate !== 'dungeon' || ctx.hasDungeon));
}
