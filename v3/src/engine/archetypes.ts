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
  /** HOW this kind of work gets done, as single words. The engine deals ONE per card, and the
   *  writer combines it with the keywords' concrete noun — `method: listening` + `thing: tavern`
   *  becomes "go to the tavern and fish for news". Single words on purpose: a dealt string that is
   *  a complete predicate gets pasted verbatim (N7, measured — `arrival` and `clientTell` do
   *  exactly that), and a one-word method cannot be. This is what varies two cards of the SAME
   *  kind of work, so the gloss can stay a general description instead of naming one scenario. */
  methods?: string[];
  /** work NOBODY brings to the fort — the company goes looking of its own accord. The one-off
   *  frame otherwise says "what came in… only what has reached the fort goes on the card", which
   *  forces the writer to invent an arrival, and an invented arrival is a grievance, and a
   *  grievance is a mystery. That is why lead-hunt cards read as investigations however the gloss
   *  is worded (N10). The saga path has had this branch as `noClient` all along. */
  selfDirected?: boolean;
  /** a writer-facing CONSTRAINT for this kind of work, rendered as its own sentence. It is kept
   *  out of `gloss` on purpose: the gloss is DATA describing the job, and a prohibition parked
   *  inside it ("sweep for rumors; never promise further work") both muddies the description and
   *  reads as part of the work. Only lead-hunt has needed one so far. */
  rule?: string;
}

/** the ROW for every kind of one-off work. Pool sizes ARE the draw weights — a uniform pick over
 *  this table is how often each kind of work appears, so the counts per profile are deliberate. */
export const ARCHETYPES = {
  // ── THE ORIGINAL EIGHT (restored 2026-08-28) ──────────────────────────────────────────────
  // A row is a KIND OF WORK a company advertises, never an incident. The 109-row pool that stood
  // here briefly drifted into micro-premises — witness-finding, barrow-opening, flood-leavings —
  // and the designer called it: "wtf is witness-finding and barrow-opening, too specific."
  // That is the authored-premise mistake this project already has a law about (SEEDING.md): a
  // specific archetype is a scenario the writer can only transcribe, so it buys one story, not a
  // category. A good row is reusable across a hundred different premises; the SPECIFICS come from
  // the keywords and the framed character, never from the row's own name.
  'raid': { methods: ['storming', 'burning', 'ambushing', 'surrounding', 'breaching', 'outnumbering'], gloss: 'hit a holdout for spoils', profile: 'spoils', slots: [2, 3] },
  'capture': { methods: ['cornering', 'luring', 'tracking', 'outnumbering', 'drugging', 'waylaying'], gloss: 'take someone alive', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'rescue': { methods: ['sneaking', 'bargaining', 'storming', 'bribing', 'distracting', 'cutting'], gloss: 'free someone held', profile: 'recruit', slots: [1, 2] },
  'escort': { methods: ['guarding', 'outpacing', 'hiding', 'rerouting', 'shadowing', 'bluffing'], gloss: 'guard a journey', profile: 'coin', slots: [1, 2] },
  'investigate': { methods: ['questioning', 'watching', 'searching', 'following', 'listening', 'comparing'], gloss: 'uncover a hidden thing', profile: 'find', slots: [1, 2] },
  'hunt': { methods: ['tracking', 'baiting', 'trapping', 'cornering', 'waiting', 'driving'], gloss: 'track down a person or beast', profile: 'find', slots: [1, 2] },
  'contract': { methods: ['labouring', 'hauling', 'mending', 'clearing', 'standing', 'digging'], gloss: 'an agreed task for set pay — the work IS the premise', profile: 'coin', slots: [1, 1] },
  // designer 2026-08-30: "shouldnt it be something like 'go to tavern and fish for news'" — the old
  // gloss ('sweep for rumors') was too vague to produce one, so the writer made mysteries instead:
  // a live card had the company tracking a missing apprentice into the woods. Name the ACTIVITY.
  'lead-hunt': {
    selfDirected: true,
    methods: ['listening', 'asking', 'drinking', 'waiting', 'loitering', 'bribing', 'eavesdropping'],
    gloss: 'go where people talk — a tavern, a market, a ford crossing — and come back knowing where the next job is',
    rule: 'Never promise "further work" or more jobs: the card is the ASKING, and the engine announces whatever it turns up.',
    profile: 'lead', slots: [1, 1],
  },

  // ── APPROVED BY THE DESIGNER, one batch at a time (2026-08-28) ────────────────────────────
  // guard/recover proposed and approved; explore/trade are the designer's own additions.
  'guard': { methods: ['watching', 'patrolling', 'barring', 'standing', 'hiding', 'waiting'], gloss: 'hold a place or a person against whatever comes', profile: 'coin', slots: [1, 2] },
  'recover': { methods: ['searching', 'buying', 'stealing', 'digging', 'demanding', 'trading'], gloss: 'get back a specific thing that was taken', profile: 'relic', slots: [1, 2] },
  'explore': { selfDirected: true, methods: ['walking', 'mapping', 'climbing', 'wading', 'fording', 'scouting'], gloss: 'go into ground nobody has crossed and come back knowing it', profile: 'lead', slots: [1, 2] },
  'trade': { methods: ['haggling', 'bribing', 'undercutting', 'brokering', 'smuggling', 'appraising'], gloss: 'buy, sell, or broker a thing whose price is somebody\'s trouble', profile: 'coin', slots: [1, 1] },

  // batch 2 — five approved from the Sultan taxonomy, plus the designer's `occult` and `fight`.
  // ritual vs occult is a deliberate split: ritual PERFORMS a working (the company supplies the
  // hands), occult CONFRONTS one already there. fight replaces the narrower `duel`.
  'assassinate': { methods: ['poisoning', 'ambushing', 'waylaying', 'drowning', 'arranging', 'waiting'], gloss: 'kill one named person and be gone', profile: 'coin', slots: [1, 2] },
  'occult': { methods: ['burning', 'binding', 'banishing', 'salting', 'breaking', 'sealing'], gloss: 'face something that should not be, and end or contain it', profile: 'relic', slots: [2, 3] },
  'ritual': { methods: ['attending', 'guarding', 'supplying', 'carrying', 'holding', 'witnessing'], gloss: 'see a working through — someone must hold the circle', profile: 'bloody', slots: [2, 3] },
  'negotiate': { methods: ['bargaining', 'threatening', 'flattering', 'bribing', 'waiting', 'conceding'], gloss: 'get a yes without drawing steel', profile: 'lead', slots: [1, 2] },
  'fight': { methods: ['duelling', 'brawling', 'wrestling', 'outlasting', 'disarming', 'feinting'], gloss: 'a fight that was arranged, and is watched', profile: 'coin', slots: [1, 2] },
  'research': { selfDirected: true, methods: ['reading', 'copying', 'questioning', 'measuring', 'comparing', 'digging'], gloss: 'work a text or a site until it gives up its meaning', profile: 'find', slots: [1, 1] },
  'heist': { methods: ['sneaking', 'picking', 'distracting', 'tunnelling', 'impersonating', 'waiting'], gloss: 'take a thing out of a guarded place without being seen', profile: 'relic', slots: [2, 3] },
  'adventure': { methods: ['descending', 'climbing', 'wading', 'torching', 'mapping', 'digging'], gloss: 'go into a dangerous place and come back with what is in it', profile: 'relic', slots: [2, 3] },
  'bounty-hunt': { methods: ['tracking', 'ambushing', 'bribing', 'waiting', 'cornering', 'baiting'], gloss: 'a posted name, brought in for the price on it', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'gather': { selfDirected: true, methods: ['cutting', 'digging', 'picking', 'netting', 'felling', 'hauling'], gloss: 'bring back a quantity of something that grows where people do not go', profile: 'coin', slots: [1, 2] },

  // ── FAUCET-ONLY, never on the ordinary board ──────────────────────────────────────────────
  // `hire` belongs to the Recruiting post's standing lead (QUESTS §19) and nothing else. That
  // faucet used to deal `rescue`, so every hire from your own recruiting post read as freeing a
  // captive — the wrong job entirely for a post whose whole purpose is to bring on paid hands.
  'hire': { methods: ['persuading', 'outbidding', 'buying', 'promising', 'drinking', 'vouching'], gloss: 'find someone worth paying, and bring them back willing', profile: 'recruit', slots: [1, 2] },
} as const satisfies Record<string, ArchetypeDef>;

export type Archetype = keyof typeof ARCHETYPES;

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPES) as Archetype[];
/** `as const` keeps the KEYS literal (so Archetype is the union of names) but narrows each row to
 *  its own shape, which loses the optional `gate`. Read rows through here. */
const defOf = (a: Archetype): ArchetypeDef => ARCHETYPES[a] as ArchetypeDef;
export const profileOf = (a: Archetype): Profile => defOf(a).profile;
export const slotRangeOf = (a: Archetype): [number, number] => defOf(a).slots;
export const glossOf = (a: Archetype): string | undefined => ARCHETYPES[a] ? defOf(a).gloss : undefined;
export const isSelfDirected = (a: Archetype): boolean => !!(ARCHETYPES[a] && defOf(a).selfDirected);
export const methodsOf = (a: Archetype): string[] | undefined => ARCHETYPES[a] ? defOf(a).methods : undefined;
export const ruleOf = (a: Archetype): string | undefined => ARCHETYPES[a] ? defOf(a).rule : undefined;

/** the random board pool: everything the fort can actually take on. `lead-hunt` is excluded —
 *  it is the Scouting lodge's own standing repeatable, not a thing the board rolls. */
/** archetypes that belong to a FAUCET and must never be rolled onto an ordinary lead: each is
 *  minted by one standing lead and would misread anywhere else (a `hire` that nobody posted, a
 *  `lead-hunt` without a Scouting lodge). */
const FAUCET_ONLY: Archetype[] = ['lead-hunt', 'hire'];

export function boardPool(ctx: { hasDungeon: boolean }): Archetype[] {
  return ARCHETYPE_NAMES.filter(a =>
    !FAUCET_ONLY.includes(a) && (defOf(a).gate !== 'dungeon' || ctx.hasDungeon));
}
