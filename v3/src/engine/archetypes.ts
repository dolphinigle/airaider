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
  // ── THE ORIGINAL EIGHT (restored 2026-08-28) ──────────────────────────────────────────────
  // A row is a KIND OF WORK a company advertises, never an incident. The 109-row pool that stood
  // here briefly drifted into micro-premises — witness-finding, barrow-opening, flood-leavings —
  // and the designer called it: "wtf is witness-finding and barrow-opening, too specific."
  // That is the authored-premise mistake this project already has a law about (SEEDING.md): a
  // specific archetype is a scenario the writer can only transcribe, so it buys one story, not a
  // category. A good row is reusable across a hundred different premises; the SPECIFICS come from
  // the keywords and the framed character, never from the row's own name.
  'raid': { gloss: 'hit a holdout for spoils', profile: 'spoils', slots: [2, 3] },
  'capture': { gloss: 'take someone alive', profile: 'captive', slots: [2, 3], gate: 'dungeon' },
  'rescue': { gloss: 'free someone held', profile: 'recruit', slots: [1, 2] },
  'escort': { gloss: 'guard a journey', profile: 'coin', slots: [1, 2] },
  'investigate': { gloss: 'uncover a hidden thing', profile: 'find', slots: [1, 2] },
  'hunt': { gloss: 'track down a person or beast', profile: 'find', slots: [1, 2] },
  'contract': { gloss: 'an agreed task for set pay — the work IS the premise', profile: 'coin', slots: [1, 1] },
  'lead-hunt': { gloss: 'sweep for rumors; never promise "further work" — the engine announces leads', profile: 'lead', slots: [1, 1] },

  // ── APPROVED BY THE DESIGNER, one batch at a time (2026-08-28) ────────────────────────────
  // guard/recover proposed and approved; explore/trade are the designer's own additions.
  'guard': { gloss: 'hold a place or a person against whatever comes', profile: 'coin', slots: [1, 2] },
  'recover': { gloss: 'get back a specific thing that was taken', profile: 'relic', slots: [1, 2] },
  'explore': { gloss: 'go into ground nobody has crossed and come back knowing it', profile: 'lead', slots: [1, 2] },
  'trade': { gloss: 'buy, sell, or broker a thing whose price is somebody\'s trouble', profile: 'coin', slots: [1, 1] },

  // batch 2 — five approved from the Sultan taxonomy, plus the designer's `occult` and `fight`.
  // ritual vs occult is a deliberate split: ritual PERFORMS a working (the company supplies the
  // hands), occult CONFRONTS one already there. fight replaces the narrower `duel`.
  'assassinate': { gloss: 'kill one named person and be gone', profile: 'coin', slots: [1, 2] },
  'occult': { gloss: 'face something that should not be, and end or contain it', profile: 'relic', slots: [2, 3] },
  'ritual': { gloss: 'see a working through — someone must hold the circle', profile: 'bloody', slots: [2, 3] },
  'negotiate': { gloss: 'get a yes without drawing steel', profile: 'lead', slots: [1, 2] },
  'fight': { gloss: 'a fight that was arranged, and is watched', profile: 'coin', slots: [1, 2] },
  'research': { gloss: 'work a text or a site until it gives up its meaning', profile: 'find', slots: [1, 1] },
  'heist': { gloss: 'take a thing out of a guarded place without being seen', profile: 'relic', slots: [2, 3] },
  'adventure': { gloss: 'go into a dangerous place and come back with what is in it', profile: 'relic', slots: [2, 3] },
  'bounty-hunt': { gloss: 'a posted name, brought in for the price on it', profile: 'captive', slots: [1, 2], gate: 'dungeon' },
  'gather': { gloss: 'bring back a quantity of something that grows where people do not go', profile: 'coin', slots: [1, 2] },
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
