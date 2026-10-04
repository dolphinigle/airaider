// THE SAGA STORYTELLER v4 — engine side (docs/STORYTELLER.md §2.3–§2.6; Phase 2 build plan Step 1). Types, tables and
// the deal/cast of one saga, all pure and seeded from the persisted `storyRng`, so the main rng (mechanics) never moves
// on a story draw. Ported from the saga lab at tag `storyteller-build-src` (= R5, scripts/sagalab/v4lab.ts); where this
// file and STORYTELLER.md §2 disagree, the lab code is the spec. The build is one lab arm, fixed: structure L (the plan
// picks job types), names `labels` (strangers by label until met), cast `lean` (the one who asks + the person the ending
// decides, plus the personal soldier or a returning face) — `ARM` below.
//
// JSON-safe throughout: a SagaRecord lives on the chain in the save (the lab's Sets and Maps are arrays and records).

import type { Rng } from './rng.js';
import type { Card } from './cards.js';
import type { Outcome } from './roll.js';
import type { TraitPrefs } from './economy.js';
import { prefPick } from './economy.js';
import { REGION } from './regions.js';
import { rollName, rollPlaceName } from './names.js';
import { dealSeed, THEME_NO_REPEAT } from './themes.js';
import { dealKit, PICKS, CASTS, KIT_DEAL, type SeedArm } from './seedkit.js';
import { pickTone } from '../ai/keywords.js';   // a pure weighted table (no AI); the lab dealt the tone from it too
import { raceOf, sexOf, soldierTrade, tradeOf, traitsOf } from './plainwords.js';

// ─── the arm this build ships (§D.1, §D.4; R1 C5) ──────────────────────────────────────────────

export type Structure = 'S' | 'L' | 'H';
export type NamesArm = 'labels' | 'named';
export type CastArm = 'full' | 'lean';
export interface Arm { structure: Structure; names: NamesArm; cast: CastArm }
/** the measured checkpoint (R5): loose structure, strangers by label, lean cast — the only arm this build carries (the
 *  lab's other branches were pruned after the golden diff, test/sagagolden.test.ts) */
export const ARM: Arm = { structure: 'L', names: 'labels', cast: 'lean' };
export type { SeedArm } from './seedkit.js';
/** the seed arm this build ships (North Star 7): kit+pick, the seed lab's follow winner over the theme library and over
 *  purely random keywords (scripts/sagalab/reports/2026-10-04-seed-arms.md). A host may name another (SagaHost.seedArm:
 *  the lab; the golden parity test pins 'themes', the R5 lab's seed) */
export const SEED_ARM: SeedArm = 'kit+pick';
/** a PIPELINE arm on top of kit+pick (North Star 8: shape what the AI is given, split the work into small steps;
 *  scripts/sagalab/seedlab.ts B2/C2/C3/D1/D2). The build deals PIPE_ARM; absent, the pipeline is R5's, byte for byte (the
 *  golden parity, the seed lab's A arms, and every saga dealt before grafts shipped).
 *   one     B2  the pick chooses one keyword, told so; the plan gets only it (one object to follow)
 *   grafts  C2  R6's class fixes: the road prints the plan's own why per later job (no outline call; a flagged why leaves
 *               the title), the card's hope goes to its report, the finale buttons are the engine's, the gold way is paid
 *               on its button only (designer 2026-10-04: the story tells the person going free — `freeGold`)
 *   sides   C3  the plan writes each person's side (whose side, and why); cards and reports get it for the people present
 *   reads   D1  grafts, and a card after a won job reads the report's summary (the text the player just read), never the
 *               plan's forecast `win`: every text is given the last text the player read
 *   fixes   D2  grafts, and the verifiers' class fixes (pipeline-round report §3.1, then the D-arm verifier): the report's
 *               hope shows only what result, brought and clue leave unmet, as still hoped for; every fact in the writer's
 *               own words, a clue with nothing added, the secret said, shown or found against a known fact; every finale
 *               card gets the stake (`lose`) and keeps its owner in names; the finale's way and settles are ONE result
 *               sentence; a card's trouble is one phrase, never three labelled parts; the plan's edges beat the showdown's
 *               trouble, its loss is what that trouble takes, its trouble says what they fight `with`; the company has no
 *               other owner in plan text
 *   late    E1  grafts, and the finale's job, trouble and loss are written AFTER play — a small showdown call when the
 *               finale comes (the last middle job won, or the last chance), from the question and answer, the person the
 *               ending decides and its ways, what the company holds (each with the use the plan's edge gives it, which the
 *               finale report shows used) and knows, and what happened last. The finale card and report use them instead of
 *               the plan's pre-play showdown (round D §3.1: a third of the contradictions are a later card restating that
 *               forecast after play overturned it); settles, edges and buttons stay the plan's, and the finale card still
 *               has no why (R5 verify 2). The call failed: the plan's showdown stands
 *   trail   E2  grafts, and the plan writes the clues in order (`trail`, one per middle job; together they leave the
 *               answer's why to the showdown) right after the question and answer — output order is a lever; the engine
 *               copies trail[i] into job i's learn, so they cannot diverge; a win never repeats its clue (the win is the
 *               report's result and the next card's latest: a clue in it reached the player three times)
 *   narrow  E3  grafts, and D2's report hope alone (its part (a): won-job shortfall lines 17 → 5 of 192): what result,
 *               brought and clue miss, show as still hoped — D2's line said in 10 words (its 12 overran the report budget
 *               without D2's other cuts), never "show shortfalls"
 *   line    F1  grafts, and the trouble as ONE sentence the plan writes — who stands in the way, what they will do, and why
 *               — in place of the {who, carry, will} atoms (law 6b: three labelled items came back as three stock sentences,
 *               "They carry X", 24% of the reader-throwing sentences in 72 default sagas). Each job type is dealt who stands
 *               against it (`AGAINST`: a talk job's is the one to win over, for a reason of their own), in place of "armed
 *               people or a beast" for every job (filler foes, talk targets written up as armed). Every card gets the whole
 *               line, card 1 too (it lost `will` in R5), but a retry: its retry line is what that trouble did, one fact
 *               told twice (the default leaves out `will` there for the same reason). The card glosses it as a noun, "the
 *               obstacle" ("who stands in the way" came back as its own sentence, "He stands in your way."), and its cap
 *               follows its data (`capFor`, R6 verify: the finale's 90 words of room split the one line back into stock
 *               sentences and invented filler)
 *   plain   F2  grafts, and the keyword deal never glues a quality onto a thing (a compound only the dealer made, which
 *               the plan then forces in as a definite thing to explain): the qualities leave the deal before the pick sees
 *               it (seedkit plainKeywords)
 *   link    F3  grafts, and the plan writes each job's `lead` FIRST — the fact that points the company to this job's place or
 *               person, one the player has by then (job 1: something the one who asked knows; later: the last job's
 *               learn) — so each job is chained to what came before (output order is a lever). The lead says why THIS person or
 *               place; the why stays the hope, still with only what the job names (so a road row on card 1 never leans on
 *               a lead's later fact), minus "for a thing or person, what they can then do" (odd-logic hopes). The job's own
 *               card gets lead + hope as its one why; the road (card 1, before any learn) keeps the hope alone. Titles, jobs,
 *               whys and troubles "show before any job is played" and never use a gain either ("shown before play", beside
 *               a lead built from a learn, read as "before that job": later whys leaned on earlier learns or named their
 *               own gains, and whyFlags blanked them)
 *   fx      FX  grafts + line + plain + link
 *  (C1 `core` — a call fixing the want, question and answer before the plan — was removed: a measured loss, follow 26–116) */
export type PipeArm = 'one' | 'grafts' | 'sides' | 'reads' | 'fixes' | 'late' | 'trail' | 'narrow' | 'line' | 'plain' | 'link' | 'fx';
export const PIPE_ARMS: readonly PipeArm[] = ['one', 'grafts', 'sides', 'reads', 'fixes', 'late', 'trail', 'narrow', 'line', 'plain', 'link', 'fx'];
/** the changes each pipe arm carries, by the arm that brought each in: D1, D2, E1–E3 and F1–F3 are C2 plus one change each;
 *  FX is C2 plus all of round F */
const PIPE_PARTS: Record<PipeArm, readonly PipeArm[]> = {
  one: ['one'], grafts: ['grafts'], sides: ['sides'], reads: ['grafts', 'reads'], fixes: ['grafts', 'fixes'],
  late: ['grafts', 'late'], trail: ['grafts', 'trail'], narrow: ['grafts', 'narrow'],
  line: ['grafts', 'line'], plain: ['grafts', 'plain'], link: ['grafts', 'link'], fx: ['grafts', 'line', 'plain', 'link'],
};
/** whether a dealt world's pipe arm carries `part` */
export const piped = (w: Pick<SagaWorld, 'pipe'>, part: PipeArm): boolean => !!w.pipe && PIPE_PARTS[w.pipe].includes(part);
/** the pipeline this build ships (designer 2026-10-04): C2 grafts, ahead on follow in all three generations (83–61) and on
 *  keep beyond the noise floor (93–51) — scripts/sagalab/reports/2026-10-04-pipeline-round.md §3.1. A host may name
 *  another, or none (SagaHost.pipeArm: the seed lab) */
export const PIPE_ARM: PipeArm = 'grafts';

// ─── shapes, job types, ways (§2.4.1) ──────────────────────────────────────────────────────────

/** support: a kit arm's "potential supporting cast" — coined with no part; the plan decides what each is to the story */
export type Seat = 'client' | 'opponent' | 'other' | 'soldier' | 'support';
export type ShapeId = 'rescue' | 'hunt' | 'recovery' | 'escort' | 'defense' | 'feud' | 'heist' | 'beast';
export type JobType = 'fight' | 'guard' | 'catch' | 'hunt' | 'sneak' | 'free' | 'find' | 'talk' | 'escort';
export type EpisodeType = JobType | 'showdown';
export type Way = 'recruit' | 'captive' | 'gold' | 'talk' | 'fight' | 'sneak';

/** every part stands alone: a report meets people as a list, so "took it" or "holds them" had no referent. Under the
 *  lean cast only the client's part (parts[0]) is read; the floor's stake is drawn by shape (D13) */
export const SHAPES: Record<ShapeId, { parts: [string, string, string]; A: JobType[]; B: JobType[] }> = {
  rescue: { parts: ['asks for help', 'holds the captive', 'is held captive'], A: ['find', 'sneak', 'free', 'catch', 'fight'], B: ['talk', 'find', 'fight', 'free', 'escort'] },
  hunt: { parts: ['asks for help', 'is hunted', 'knows the ground'], A: ['find', 'catch', 'fight', 'guard', 'catch'], B: ['talk', 'find', 'sneak', 'catch', 'fight'] },
  recovery: { parts: ['lost something', 'took the lost thing', 'knows where the lost thing is'], A: ['find', 'sneak', 'catch', 'fight', 'talk'], B: ['talk', 'find', 'fight', 'sneak', 'catch'] },
  escort: { parts: ['asks for help', 'wants the journey stopped', 'must get through'], A: ['talk', 'escort', 'guard', 'sneak', 'fight'], B: ['escort', 'find', 'guard', 'catch', 'escort'] },
  defense: { parts: ['asks for help', 'attacks the place', 'helps the defenders from inside'], A: ['guard', 'find', 'sneak', 'guard', 'fight'], B: ['talk', 'guard', 'catch', 'fight', 'guard'] },
  feud: { parts: ['asks for help', 'stands in the way', 'serves the one in the way'], A: ['guard', 'catch', 'talk', 'fight', 'sneak'], B: ['talk', 'fight', 'find', 'guard', 'catch'] },
  heist: { parts: ['was wronged', 'holds what is not theirs', "works inside the holder's house"], A: ['find', 'talk', 'sneak', 'fight', 'catch'], B: ['talk', 'find', 'guard', 'sneak', 'catch'] },
  beast: { parts: ['asks for help', 'keeps the beast', 'knows the beast'], A: ['find', 'hunt', 'guard', 'talk', 'hunt'], B: ['guard', 'find', 'hunt', 'catch', 'fight'] },
};
export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];
export const PERSONAL_PARTS: [string, string, string] = ["one of the company's soldiers", 'stands in the way', "knows the soldier's past"];
/** the loose arm deals no shape, so its parts say only where someone stands, never their seat in a
 *  shape; still a concrete part for everyone (a vague one left the model guessing who opposes whom) */
export const LOOSE_PARTS: Partial<Record<Seat, string>> = { opponent: 'stands in the way', other: 'is caught between the two sides' };
/** the part a person plays, as the plan and every report receive it. A kit arm deals its supporting cast (the person the
 *  ending decides among them) with none (''): no text gets a part for them, the plan decides what each is to the story */
export const partOf = (p: SagaPerson): string => p.part === '' ? '' : !PERSONAL_PARTS.includes(p.part) ? LOOSE_PARTS[p.seat] ?? p.part : p.part;
/** a kit arm's client: the part says only that they ask (the shape's part, "lost something", could fight the situation) */
export const KIT_CLIENT_PART = 'asks for help';

export const TYPES: Record<JobType, { do: string; kind: string }> = {
  fight: { do: 'fight armed people', kind: 'they are beaten or driven off' },
  guard: { do: 'hold a place against an attack', kind: 'the attack is beaten back' },
  catch: { do: 'chase someone down', kind: 'someone is caught' },
  hunt: { do: 'track a beast', kind: 'the beast is killed or trapped' },
  sneak: { do: 'get in and out unseen', kind: 'someone or something is taken unseen' },
  free: { do: 'break someone out', kind: 'someone is freed' },
  find: { do: 'track down a person or a hiding place', kind: 'someone or somewhere is found' },
  talk: { do: 'win someone over', kind: 'someone takes a side' },
  escort: { do: 'bring someone through danger', kind: 'someone arrives safe' },
};
export const JOB_TYPES = Object.keys(TYPES) as JobType[];
/** (pipe arm line, F1) who stands against each job type, dealt with the types: the plan's one-line trouble names them, so a
 *  job's obstacle fits what the soldiers do there (one rule for every job, "armed people or a beast", made talk and find
 *  targets armed foes and gave filler foes to jobs that had none) */
export const AGAINST: Record<JobType, string> = {
  fight: 'armed people', guard: 'the attackers', catch: 'the one who runs', hunt: 'the beast', sneak: 'whoever keeps watch',
  free: 'the captors', find: 'whoever or whatever keeps it hidden', talk: 'the one to win over, for a reason of their own',
  escort: 'whoever or whatever waits on the way',
};

export const WAY_ENDING: Record<Way, string> = {
  recruit: 'joins the company', captive: 'held in your cells', gold: 'coin; goes free',
  talk: 'their matter settled', fight: 'their matter settled', sneak: 'their matter settled',
};
/** someone the company helps (the escorted, the held, an inside hand), not someone on the opponent's
 *  side. Cells or a treasure taken make no sense for them: the plan had to write options to jail or
 *  rob the person it had just brought through, so they are dealt only the ways that fit (`waysOf`),
 *  and gold means a share they give */
const SIDES_WITH_OPPONENT = new Set(['serves the one in the way']);
export const helped = (p: Pick<SagaPerson, 'seat' | 'part'>) => p.seat === 'other' && !SIDES_WITH_OPPONENT.has(p.part);
/** what each non-personal way means, dealt with the ways (a gloss for a way not dealt never reaches the model) */
// each names its subject: "they end in its cells" was read as the soldiers ("Blunder into the manor's laws, are arrested")
export const WAY_MEANS: Record<'recruit' | 'captive' | 'gold', string> = { recruit: 'that person joins the company', captive: "that person ends in the company's cells", gold: "the company takes that person's treasure" };
export const HELPED_GOLD = 'that person shares their treasure with the company and goes their way';
/** (pipe arm grafts) the gold way as the story tells it: no treasure (R6 F2: a treasure in the gloss made stock "buried
 *  hoard" answers) and no money — the money is the finale button's alone (designer 2026-10-04: pasted payment was in 15
 *  of 18 gold finales, and clashed with "no pay"). The ending the person meets, nothing the company takes */
export const FREE_GOLD = 'that person is cornered, then let go';
export const FREE_HELPED_GOLD = 'that person goes their way';
/** (pipe arm grafts) the gold way's name as the plan reads it: the reward's word ("gold") is money too. Like WAY_WORD, never
 *  a job type name ("free" is "break someone out" in the same payload's types) */
export const FREE_WAY = 'let go';
export const wayMeans = (v: Way, isHelped: boolean, freeGold = false) => v === 'gold' && freeGold ? (isHelped ? FREE_HELPED_GOLD : FREE_GOLD)
  : v === 'gold' && isHelped ? HELPED_GOLD : WAY_MEANS[v as keyof typeof WAY_MEANS];
export const WAY_ATTR: Record<Way, string> = { recruit: 'CHA', captive: 'STR', gold: 'INT', talk: 'CHA', fight: 'STR', sneak: 'DEX' };
/** a personal saga's ways are HOW it is settled, so the plan gets words that are not job type names */
export const WAY_WORD: Partial<Record<Way, string>> = { talk: 'words', fight: 'force', sneak: 'stealth' };
export const wayWord = (v: Way) => WAY_WORD[v] ?? v;
export const wayOf = (word: string): string => (Object.entries(WAY_WORD).find(([, x]) => x === word)?.[0]) ?? word;

export const STAKES: Record<ShapeId | 'personal', [string, number][]> = {
  rescue: [['freedom', 3], ['someone loved', 3], ['a life', 2]],
  hunt: [['a life', 3], ['a livelihood', 2], ['a home', 1]],
  recovery: [['a livelihood', 3], ['a good name', 2], ['a promise', 2]],
  escort: [['a life', 3], ['a promise', 2], ['someone loved', 1]],
  defense: [['a home', 3], ['a livelihood', 2], ['a life', 2]],
  feud: [['a home', 3], ['a good name', 2], ['a livelihood', 2]],
  heist: [['a livelihood', 3], ['a good name', 2], ['a promise', 1]],
  beast: [['a life', 3], ['a livelihood', 2], ['a home', 2]],
  personal: [['someone loved', 3], ['a good name', 2], ['a promise', 2], ['a life', 1]],
};

/** a personal saga's coined opponent gets a trade from the lab's power pool (the measured text: a personal plan was
 *  dealt "slaver", "moneylender"…); trades that name a sex go only to that sex */
const POWER_TRADES = ['reeve', 'moneylender', 'steward', 'landlord', 'bandit chief', 'toll-keeper', 'tax collector',
  'hedge knight', 'guild master', 'smuggler', 'forester', 'slaver', 'mercenary captain', 'magistrate', 'horse dealer',
  'abbot', 'poacher', 'cattle baron'];
const TRADE_SEX: Record<string, 'male' | 'female'> = { widow: 'female', midwife: 'female' };
/** the company's own trade: as a supporting person it reads as the company's double (the client hires them instead,
 *  seed-arms report N3); as a personal saga's opponent it stays, a rival of the soldier's own kind */
const COMPANY_TRADES = new Set(['mercenary captain']);
/** a kit arm's supporting people: folk and power trades alike (the lab's FOLK_TRADES + POWER_TRADES) — nobody is dealt as
 *  a friend or a foe, the plan decides */
const SUPPORT_TRADES = ['miller', 'weaver', 'shepherd', 'beekeeper', 'ferryman', 'brewer', 'woodcutter', 'potter', 'fisher',
  'innkeeper', 'carter', 'herbalist', 'mason', 'tanner', 'widow', 'farmer', 'smith', 'peddler', 'charcoal-burner', 'midwife',
  'goatherd', 'trapper', 'baker', 'thatcher', 'healer', 'fowler', 'tinker', 'cooper', ...POWER_TRADES.filter(t => !COMPANY_TRADES.has(t))];
/** every trade the deal coins (the live-saga trade fence reads them off the plans' labels) */
export const DEALT_TRADES: readonly string[] = [...new Set([...SUPPORT_TRADES, ...POWER_TRADES])];

/** one source per feeling: a theme labelled with a feeling passes it on; otherwise the engine's tone roll */
export const TONE_FROM_THEME: Record<string, string> = { funny: 'wry', tender: 'warm', grim: 'grim', tense: 'tense' };
export const NUMBER_WORD = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];

/** FNV-1a: the lab's string hash (the floor plan's rng, a cost's pick off the soldiers' names) */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0;
}

// ─── the people and the plan ───────────────────────────────────────────────────────────────────

export interface SagaPerson {
  id: string; name: string; sex: 'male' | 'female'; race: string;
  seat: Seat; focal: boolean; part: string;
  trade?: string; traits?: string;
  /** named from card 1 (R5): the client, the personal soldier, a returning face */
  known: boolean;
  memory?: string; where?: string;
}
/** line: pipe arm line (F1) — the trouble as ONE sentence (who, what they will do, and why); who, carry and will are then
 *  empty, and every reader takes the line (`troubleWho`) */
export interface Trouble { who: string; carry: string; will: string; line?: string }
/** the trouble's words that say who stands in the way: the line (F1), else `who` */
export const troubleWho = (t: Trouble): string => t.line ?? t.who;
/** why: what the one who asked hopes this job gets them (only job 1's prints; a later job's card prints its outline
 *  line). gain / learn: a middle job's — what the company holds after a win, and the piece toward the answer the win
 *  brings out. edge: the showdown's — one per middle job, in job order: how holding that job's gain helps here. lead: pipe
 *  arm link (F3) — the fact that points the company to this job, one the player has by its card */
export interface Episode { n: number; type: EpisodeType; title: string; job: string; people: string[]; trouble: Trouble; win?: string; gain?: string; learn?: string; why: string; settles?: string; lose?: string; edge?: string[]; lead?: string }
/** past: a personal saga's soldier only, the old wrong in a few words. side: pipe arm sides only — whose side they are
 *  on, and why, as the plan wrote it */
export interface CastEntry extends SagaPerson { label: string; want: string; past?: string; side?: string }
export interface SagaPlan { title: string; question: string; answer: string; cast: CastEntry[]; episodes: Episode[]; showdown: Episode; options: { way: Way; label: string }[] }
/** pipe arm late (E1): the finale's own fields, written from where the story stands when the finale comes — they replace
 *  the plan's showdown job, trouble and lose (no why: a finale's is the For line's want, R5 verify 2) */
export interface LateShowdown { job: string; trouble: Trouble; lose: string }

/** what the saga has banked so far: `learned` = the learns of won middle jobs, in order; `held` = the numbers of won
 *  middle jobs, whose gains the company holds. Only a win banks */
export interface SagaState { learned: string[]; held: number[] }
export interface Hurt { name: string; how: 'lightly' | 'badly' | 'gravely' }
/** a partial's price: atoms the writer realises; `whose` names who pays it */
export interface Cost { what: string; how: string; whose?: string }

// ─── the persisted record (Chain.saga) ─────────────────────────────────────────────────────────

/** everything the engine dealt before the plan call (the lab's World + Draw, as data) */
export interface SagaWorld {
  personal: boolean; N: number; kind: 'recruit' | 'captive' | 'gold';
  /** read for two things only (D13): the client's part and the floor's stake */
  shape: ShapeId;
  focalId: string; cast: SagaPerson[]; stake: string; places: string[]; land: string;
  seed: { id: string | null; text: string }; tone: string;
  region: string; level: number;
  /** a kit arm's seed (North Star 7): absent on the theme arm */
  kit?: SagaKit;
  /** the pipeline arm (PipeArm): the build deals PIPE_ARM; absent, R5's pipeline */
  pipe?: PipeArm;
}
/** a kit arm's seed: what the dealer dealt, then what the pick and premise calls made of it (filled before the plan) */
export interface SagaKit {
  arm: Exclude<SeedArm, 'themes'>;
  /** dealt: the situation(s) (none on a personal saga, whose seed is the soldier's past) and the keyword atoms */
  situations: string[]; keywords: string[];
  /** the pick call's choice (kit+pick arms); `floor`: the call failed and the floor's choice stood in. kit+pick+cast:
   *  `person`, the id of the one supporting person the pick kept (none: it kept nobody) */
  picked?: { situation?: string; keywords: string[]; person?: string; floor?: boolean };
  /** kit+pick+premise: the premise call's sentences (who wants what and why; what stands in the way and why; what nobody
   *  knows yet) — the plan's seed */
  premise?: string[]; premiseFloor?: boolean;
}
/** the seed as the plan receives it: the theme or a personal past; a kit arm's situation and keywords (the picked ones
 *  once the pick call has run); a premise arm's premise, alone */
export function seedOf(w: Pick<SagaWorld, 'seed' | 'kit'>): { text: string; keywords?: string[]; premise?: true } {
  const k = w.kit;
  if (!k) return { text: w.seed.text };
  if (k.premise?.length) return { text: k.premise.join(' '), premise: true };
  const keywords = k.picked?.keywords ?? k.keywords;
  return { text: k.picked?.situation ?? k.situations[0] ?? w.seed.text, ...(keywords.length ? { keywords } : {}) };
}
/** every word the seed dealt, for the log-only lints (a seed word in the plan is no stray, no answer leak) */
export const seedText = (w: Pick<SagaWorld, 'seed' | 'kit'>): string => { const s = seedOf(w); return s.keywords ? `${s.text} ${s.keywords.join(' ')}` : s.text };
/** kit+pick+cast, once picked: the cast keeps only the supporting person the pick kept — the plan, the cards, the reports
 *  and the chronicle never see the others (the one who asks and the person the ending decides are never supporting) */
export function keepPicked(w: SagaWorld): void {
  if (!w.kit?.picked || !CASTS.has(w.kit.arm)) return;
  const keep = w.kit.picked.person;
  w.cast = w.cast.filter(p => p.seat !== 'support' || p.id === keep);
}
/** whether a kit arm still waits on its pick or premise call before the plan */
export const seedPending = (w: Pick<SagaWorld, 'kit'>): boolean => !!w.kit && ((PICKS.has(w.kit.arm) && !w.kit.picked) || (w.kit.arm === 'kit+pick+premise' && !w.kit.premise));
/** one attempt as the chronicle keeps it. `decides`: whose deed decided a job that was not failed (the game sets it after
 *  the report lands; the memory edge to the deciding soldier reads it at the saga's close, §2.6) */
export interface SagaLine { n: number; attempt: number; outcome: Outcome; party: string[]; text: string; hurt: Hurt[]; decides?: string }
/** one row of the quest log as the engine renders it (the GUI gets the structure, the CLI the lab's text) */
export type LogRow = { kind: 'for' | 'road' | 'roadrow' | 'known' | 'knownrow' | 'held' | 'open'; mark?: '▶' | '✓' | '✗' | '·'; text: string };
/** ON THIS MATTER: a person the card calls by name (label without its article) */
export interface Matter { id: string; name: string; label: string }
/** where a card sits in the saga: the job it poses (the finale's is N), whether it is the finale, which try at the job */
export interface SagaPos { job: number; finale: boolean; attempt: number }
export interface SagaRecord {
  v: 4;
  world: SagaWorld;
  /** null until the plan call lands */
  plan: SagaPlan | null;
  /** a personal saga: the middle jobs whose people the plan itself wrote the soldier into (validatePlan `ownJobs`, before
   *  the repair adds them everywhere) — the only jobs that pin the soldier to a place. Absent in saves before 2026-10-03:
   *  no pin */
  ownJobs?: number[];
  /** the floor's plan stood in */
  fallback: boolean;
  knowing: { met: string[]; named: string[]; seen: string[] };
  state: SagaState;
  /** R5: each job's hope as its card is dealt it (outline lines through roadHopes); null before card 1 or with < 2 jobs */
  hopes: (string | null)[] | null;
  /** R5: the road's line per job before the finale (roadLines), computed once beside card 1 */
  road: (string | null)[] | null;
  done: Record<number, 'won' | 'lost'>;
  tries: Record<number, number>;
  latest: string; lastchance: boolean;
  /** card 1's prose ('' until it is written) */
  card1: string;
  lines: SagaLine[];
  /** how the saga ended: the finale's Outcome sentence (sagaflow.sagaFate), set when its report lands */
  ending?: string;
  /** pipe arm late (E1): the finale as written after play, once the finale comes; null: the call failed and the plan's
   *  showdown stands; absent: not yet written (or another arm) */
  late?: LateShowdown | null;
  /** the card on offer, re-offered verbatim while unmarched (D15); cleared by every report */
  cache?: { pos: SagaPos; title: string; prose: string; job: string; rows: LogRow[]; matter: Matter[] };
}

// ─── the deal (D12, D13) ───────────────────────────────────────────────────────────────────────

export interface SagaDeal {
  seed: { id: string | null; text: string }; tone: string; shape: ShapeId; stake: string;
  /** a kit arm: what the kit dealt, and how many supporting people the cast coins beside the person the ending decides */
  kit?: SagaKit; support?: number;
}
/** ONE dealer for a saga's story inputs (§D): the seed (a theme from the library, never repeated within the window; a
 *  personal saga's own past; a lab fixture's spark), the tone (a theme's feeling, else the tone roll), the shape (read
 *  only for the client's part and the floor's stake) and the stake. Pushes a dealt theme id onto `recentThemeIds`,
 *  trimmed to the no-repeat window. Every draw is on `storyRng` */
export function dealSaga(storyRng: Rng, recentThemeIds: string[], a: { personal: boolean; personalSeed?: string; spark?: string; arm?: SeedArm }): SagaDeal {
  if (a.arm && a.arm !== 'themes') return dealKitSaga(storyRng, a.arm, a);
  let seed: SagaDeal['seed'];
  let themeTone: string | undefined;
  if (a.spark) seed = { id: null, text: a.spark };
  else if (a.personal && a.personalSeed) seed = { id: null, text: a.personalSeed };
  else {
    const t = dealSeed(storyRng, recentThemeIds);
    seed = { id: t.id, text: t.theme };
    themeTone = t.tone;
    recentThemeIds.push(t.id);
    while (recentThemeIds.length > THEME_NO_REPEAT) recentThemeIds.shift();
  }
  const tone = (themeTone && TONE_FROM_THEME[themeTone]) ?? pickTone(storyRng);
  const shape = storyRng.pick(SHAPE_IDS);
  const stake = storyRng.weighted(STAKES[a.personal ? 'personal' : shape]);
  return { seed, tone, shape, stake };
}
/** a kit arm's deal (North Star 7): the kit (situation(s), keywords), the supporting cast's size (0–2 coined beside the
 *  person the ending decides; kit+pick+cast 3–4, of whom its pick keeps at most one), the tone roll (no theme brings
 *  one), the shape (read only for the floor's stake) and the stake. A personal saga's seed stays its own past; a lab
 *  spark still wins. Every draw on `storyRng`, one per field in every arm (so arms that deal alike draw alike) */
function dealKitSaga(storyRng: Rng, arm: Exclude<SeedArm, 'themes'>, a: { personal: boolean; personalSeed?: string; spark?: string }): SagaDeal {
  const personal = a.personal && !!a.personalSeed;
  const k = dealKit(storyRng, arm, personal);
  const [lo, hi] = KIT_DEAL.cast.support;
  const support = CASTS.has(arm) ? storyRng.range(lo, hi) : storyRng.int(3);
  const seed = { id: null, text: a.spark ?? (personal ? a.personalSeed! : k.situations[0]!) };
  const tone = pickTone(storyRng);
  const shape = storyRng.pick(SHAPE_IDS);
  const stake = storyRng.weighted(STAKES[a.personal ? 'personal' : shape]);
  return { seed, tone, shape, stake, kit: { arm, situations: a.spark ? [a.spark] : k.situations, keywords: k.keywords }, support };
}

// ─── the lean cast (R1 C5; D9, D10, D11) ───────────────────────────────────────────────────────

/** a face the world already knows, as the host found it (fenced, cooled down, its memory one the player read) */
export interface Face { id: string; name: string; sex: 'male' | 'female'; race: string; memory: string; where: string; trade?: string }
export interface CastInput {
  focal: Card; personal: boolean; region: string; shape: ShapeId;
  /** a name already in use or too close to one (roster, lore, recent NPC names) */
  taken: (name: string) => boolean;
  /** a trade someone in another live saga already has: two horse dealers on the board at once are one to the player */
  takenTrade?: (trade: string) => boolean;
  /** the player's npc trait preferences (Settings): steer the coined people's sex and race */
  prefs?: TraitPrefs;
  /** D9: the focal is a returning or sequel face the player knows — named from card 1, with their past with you */
  focalMemory?: { memory: string; where: string };
  /** D9: a known face reused in the client seat (the host picks it: `pickClientFace`) */
  returningClient?: Face;
  /** D10: the person a personal saga's seed came from; `rival` (a rival-type edge) puts them in the opponent seat */
  seedPerson?: Face & { rival: boolean };
  /** a place name the host still wants rested (the game's anti-repeat over recent sagas) */
  placeOk?: (place: string) => boolean;
  /** a kit arm (North Star 7): the client's part says only that they ask; the person the ending decides has no part; and
   *  `support` more people are coined with none (name, sex, race, trade) — the plan decides what each is to the story */
  kit?: { support: number };
}
export interface SagaCast { cast: SagaPerson[]; places: string[]; land: string }

/** the lean cast, built directly: the one who asks (name, sex, race; no trade — the plan coins one off the seed) and the
 *  person the ending decides, who stands in the way; on a personal saga the soldier and a coined opponent instead. A
 *  returning face fills the client seat (D9) and a personal seed's person a seat of their own (D10). Then three places
 *  (never the landmark; distinct stems) and the land in plain words. Every draw on `storyRng`, in seat order */
export function castSaga(storyRng: Rng, a: CastInput): SagaCast {
  const reg = REGION[a.region]!;
  const races = Object.entries(reg.poolWeights) as [string, number][];
  let n = 0;
  // a kit cast coins up to six strangers, so a name already in this cast is taken too (the theme arm's two never met)
  const taken = a.kit ? (name: string) => a.taken(name) || cast.some(p => p.name === name) : a.taken;
  const coin = (seat: Seat, part: string, trade: boolean | readonly string[]): SagaPerson => {
    const sex = prefPick(storyRng, ['male', 'female'], a.prefs) as 'male' | 'female';
    const race = prefPick(storyRng, races.map(r => r[0]), a.prefs, m => races.find(r => r[0] === m)![1]);
    let name = rollName(storyRng, race, sex);
    for (let i = 0; i < 12 && taken(name); i++) name = rollName(storyRng, race, sex);
    const fits = (trade === true ? POWER_TRADES : trade || []).filter(t => (TRADE_SEX[t] ?? sex) === sex);
    const free = fits.filter(t => !a.takenTrade?.(t));
    const trades = free.length ? free : fits;
    return {
      id: `p${++n}`, name, sex, race, seat, focal: false, part,
      ...(trades.length ? { trade: storyRng.pick(trades) } : {}),
      known: seat === 'client',
    };
  };
  const face = (f: Face, seat: Seat, part: string): SagaPerson =>
    ({ id: f.id, name: f.name, sex: f.sex, race: f.race, seat, focal: false, part, ...(f.trade ? { trade: f.trade } : {}), known: true, memory: f.memory, where: f.where });
  const f = a.focal;
  const cast: SagaPerson[] = [];
  if (a.personal) {
    cast.push({ id: f.id, name: f.name, sex: sexOf(f), race: raceOf(f), seat: 'soldier', focal: true, part: PERSONAL_PARTS[0], trade: soldierTrade(f), traits: traitsOf(f), known: true });
    const sp = a.seedPerson;
    cast.push(sp?.rival ? face(sp, 'opponent', PERSONAL_PARTS[1]) : coin('opponent', PERSONAL_PARTS[1], true));
    if (sp && !sp.rival) cast.push(face(sp, 'other', PERSONAL_PARTS[2]));
  } else {
    const part = a.kit ? KIT_CLIENT_PART : SHAPES[a.shape].parts[0];
    // at most one returning face a saga (§2.4.2): a focal the player already knows leaves the client seat to a stranger
    const back = a.focalMemory ? undefined : a.returningClient;
    cast.push(back ? face(back, 'client', part) : coin('client', part, false));
    // (the seat stays 'opponent' on a kit arm: the engine's own lines need one; the part, which the writers read, is none)
    cast.push({
      id: f.id, name: f.name, sex: sexOf(f), race: raceOf(f), seat: 'opponent', focal: true, part: a.kit ? '' : LOOSE_PARTS.opponent!,
      trade: tradeOf(f), traits: traitsOf(f), known: !!a.focalMemory, ...(a.focalMemory ? { memory: a.focalMemory.memory, where: a.focalMemory.where } : {}),
    });
  }
  // a kit arm's potential supporting cast, after the people above (so a theme deal's draws never move); each a trade
  // nobody in the cast has (two "human weavers" offered to the pick are one choice, and a cast of twins to the plan)
  for (let i = 0; a.kit && i < a.kit.support; i++) cast.push(coin('support', '', SUPPORT_TRADES.filter(t => !cast.some(p => p.trade === t))));
  const places: string[] = [];
  for (let i = 0; places.length < 3 && i < 40; i++) {
    const p = rollPlaceName(storyRng);
    if (p !== reg.landmark && !places.some(q => q.slice(0, 4) === p.slice(0, 4)) && (a.placeOk?.(p) ?? true)) places.push(p);
  }
  const plain = (reg.seedPlain ?? reg.seed).replace(/\.$/, '');
  const land = `${reg.name.startsWith('The ') ? reg.name.replace(/^The/, 'the') : `the ${reg.name}`}, ${plain[0]!.toLowerCase()}${plain.slice(1)}`;
  return { cast, places, land };
}

/** the ways the finale can end (personal: how the soldier's matter is settled), the likely one first */
export const waysOf = (w: Pick<SagaWorld, 'personal' | 'kind' | 'cast'>): Way[] => w.personal ? ['talk', 'fight', 'sneak']
  : [w.kind, ...(['captive', 'recruit', 'gold'] as Way[]).filter(k => k !== w.kind && !(k === 'captive' && helped(w.cast.find(p => p.focal)!)))];

// ─── returning faces (D9; §2.4.2 fences) ───────────────────────────────────────────────────────

/** a lore face as the host offers it, with where it stands (the lore slate's fences) and its strongest company edge */
export interface FaceCandidate extends Face {
  edgeType: string; edges: number;
  companySoldier?: boolean; companyCaptive?: boolean; atTheFort?: boolean; outOfReach?: boolean; staged?: boolean;
}
/** a returning face's seat follows their strongest edge to the company (§2.4.2) */
export const CLIENT_EDGES = new Set(['party-to', 'saved-by', 'bonded-by', 'owes']);
export const OPPONENT_EDGES = new Set(['rival-of', 'captive-of', 'betrayed-by']);
/** how many sagas a used face sits out (the villain snowball) */
export const FACE_COOLDOWN = 2;
/** the faces that took a seat in the last `FACE_COOLDOWN` sagas */
export const recentFaces = (chains: readonly { saga?: SagaRecord }[]): string[] =>
  chains.filter(c => c.saga).slice(-FACE_COOLDOWN).flatMap(c => c.saga!.world.cast.filter(p => p.memory && !p.focal).map(p => p.id));
/** the faces that may fill the client seat: none on the roster, staged, in the cells, at the fort or out of reach; none
 *  used in the last two sagas; a client-type edge; a memory the player read */
export const castableClients = (cands: readonly FaceCandidate[], recent: readonly string[]): FaceCandidate[] =>
  cands.filter(c => !c.companySoldier && !c.companyCaptive && !c.atTheFort && !c.outOfReach && !c.staged && !recent.includes(c.id)
    && CLIENT_EDGES.has(c.edgeType) && !!c.memory.trim());
/** P(a new face) = θ/(θ+N) (RECURRING_CAST §3); a reuse is weighted by edge count. At most one returning face per saga:
 *  the caller seats only what this returns */
export function pickClientFace(storyRng: Rng, eligible: readonly FaceCandidate[], theta: number): FaceCandidate | undefined {
  const N = eligible.length;
  if (!N || storyRng.chance(theta / (theta + N))) return undefined;
  return storyRng.weighted(eligible.map(c => [c, Math.max(1, c.edges)] as const));
}

// ─── mechanics the engine owns (D1, D2, D3) ────────────────────────────────────────────────────

/** one ask option: the tested attribute, favored and clashing tag words (FAVOR_OK: skills and personality only) */
export interface EpisodeTest { attribute: string; favored: string[]; clashing: string[] }
/** §2.4.1 🛠 — one option per slot, slot i takes option i % 2 (D1). Placeholders tuned on the sims: no pool zeroes a
 *  typical roster, and buildSlots' fillability guard, difficulty caps and the one-requirement rule still apply */
export const EPISODE_TESTS: Record<JobType, [EpisodeTest, EpisodeTest]> = {
  fight: [{ attribute: 'STR', favored: ['melee', 'intimidation'], clashing: ['submissive'] }, { attribute: 'CON', favored: ['melee', 'leadership'], clashing: [] }],
  guard: [{ attribute: 'CON', favored: ['melee', 'leadership'], clashing: ['loner'] }, { attribute: 'STR', favored: ['melee', 'ranged'], clashing: [] }],
  catch: [{ attribute: 'DEX', favored: ['nature', 'ranged'], clashing: [] }, { attribute: 'CON', favored: ['nature', 'melee'], clashing: [] }],
  hunt: [{ attribute: 'DEX', favored: ['ranged', 'nature'], clashing: [] }, { attribute: 'INT', favored: ['nature', 'lore'], clashing: [] }],
  sneak: [{ attribute: 'DEX', favored: ['roguery', 'nature'], clashing: ['hotheaded'] }, { attribute: 'DEX', favored: ['roguery', 'ranged'], clashing: [] }],
  free: [{ attribute: 'DEX', favored: ['roguery', 'melee'], clashing: [] }, { attribute: 'STR', favored: ['melee', 'intimidation'], clashing: [] }],
  find: [{ attribute: 'INT', favored: ['lore', 'nature'], clashing: ['hotheaded'] }, { attribute: 'INT', favored: ['roguery', 'lore'], clashing: [] }],
  talk: [{ attribute: 'CHA', favored: ['social', 'performance'], clashing: ['hotheaded'] }, { attribute: 'CHA', favored: ['leadership', 'social'], clashing: ['intimidation'] }],
  escort: [{ attribute: 'CON', favored: ['nature', 'melee'], clashing: [] }, { attribute: 'STR', favored: ['melee', 'ranged'], clashing: [] }],
};
/** D2: each finale way's test — today's trio (CHA social · STR melee+intimidation · INT roguery); a personal saga's
 *  talk CHA social · fight STR melee · sneak DEX roguery. One slot per way */
export const WAY_TESTS: Record<Way, EpisodeTest> = {
  recruit: { attribute: 'CHA', favored: ['social'], clashing: [] },
  captive: { attribute: 'STR', favored: ['melee', 'intimidation'], clashing: [] },
  gold: { attribute: 'INT', favored: ['roguery'], clashing: [] },
  talk: { attribute: 'CHA', favored: ['social'], clashing: [] },
  fight: { attribute: 'STR', favored: ['melee'], clashing: [] },
  sneak: { attribute: 'DEX', favored: ['roguery'], clashing: [] },
};
/** D2: the reward kind each way's button carries. A personal saga's settleFinale ignores the kind; sneak → gold keeps
 *  one easy gold road (the gold plan's 70% standard difficulty) */
export const WAY_REWARD: Record<Way, 'recruit' | 'captive' | 'gold'> = { recruit: 'recruit', captive: 'captive', gold: 'gold', talk: 'recruit', fight: 'captive', sneak: 'gold' };

/** a partial's price, off the job's own soldiers so the play rng's stream is unchanged (one pick of four kinds) */
const GEAR = ['sword', 'bow', 'shield', 'pack', 'tools'];
export const COSTS: Record<string, (party: Card[], lowest: string) => Cost> = {
  gear: (party, lowest) => { const h = hashStr(party.map(p => p.name).join()); return { what: GEAR[h % GEAR.length]!, how: h % 2 ? 'broken' : 'lost', whose: lowest } },
  mount: party => ({ what: 'horse', how: hashStr(party.map(p => p.name).join()) % 2 ? 'lamed' : 'lost', whose: 'the company' }),
  goodwill: () => ({ what: 'goodwill', how: 'lost', whose: 'the locals' }),
  supplies: party => ({ what: 'supplies', how: hashStr(party.map(p => p.name).join()) % 2 ? 'spoiled' : 'lost', whose: 'the company' }),
};
/** §2.6 injuries, rolled after the outcome, + the partial's cost (the lab's bands; the flow clamps them, D3) */
export function rollHurt(rng: Rng, outcome: Outcome, party: Card[], lowest: string): { hurt: Hurt[]; cost?: Cost } {
  const band = (bands: [Hurt['how'], number][]) => rng.weighted(bands);
  if (outcome === 'failure') return { hurt: rng.chance(0.5) ? [{ name: lowest, how: band([['lightly', 70], ['badly', 25], ['gravely', 5]]) }] : [] };
  if (outcome === 'partial') {
    if (rng.chance(0.33)) return { hurt: [{ name: lowest, how: band([['lightly', 80], ['badly', 20]]) }] };
    const cost = COSTS[rng.pick(Object.keys(COSTS))]!(party, lowest);
    return { hurt: rng.chance(0.1) ? [{ name: lowest, how: 'lightly' }] : [], cost };
  }
  return { hurt: rng.chance(0.05) ? [{ name: rng.pick(party).name, how: 'lightly' }] : [] };
}
/** D3: today's guard on top of the lab's roll — a success never wounds, a partial wounds at most lightly */
export function clampHurt(outcome: Outcome, hurt: Hurt[]): Hurt[] {
  if (outcome === 'success') return [];
  if (outcome === 'partial') return hurt.map(h => ({ ...h, how: 'lightly' as const }));
  return hurt;
}
/** D3: the injury band each hurt maps to (rollInjuryTiers) */
export const HURT_BAND: Record<Hurt['how'], 'low' | 'med' | 'high'> = { lightly: 'low', badly: 'med', gravely: 'high' };
/** the band word the report and chronicle print beside a hurt */
export const HOW_BAND: Record<Hurt['how'], string> = { lightly: 'light', badly: 'serious', gravely: 'grave' };
