// SAGA LAB — Phase 1 (docs/STORYTELLER.md §5.2). The v4 storyteller's ENGINE side, simulated for the
// probe: shapes and job types (§2.4.1), casting from a real MockProvider world (§2.4.2), stake, places,
// land and tone (§2.4.3), what each call receives (§2.5), plan repairs and defects (§2.7), fate
// sentences and button endings (§2.6), injuries and dice, and the mock writer — the lab's FLOOR (§4.4).
//
// Lab-only: nothing in the game imports this. The live game plays exactly as before. Phase 2a builds
// the real engine pieces (saga.ts, themes dealer wiring, storyRng); these are their stand-ins.

import { z } from 'zod';
import { Game } from '../../src/game/game.js';
import { MockProvider } from '../../src/ai/mock.js';
import { Rng } from '../../src/engine/rng.js';
import { REGION } from '../../src/engine/regions.js';
import { rollName, rollPlaceName } from '../../src/engine/names.js';
import { materializeReward } from '../../src/engine/quests.js';
import { CONCEPT } from '../../src/engine/tags.js';
import { prefPick } from '../../src/engine/economy.js';
import { pickTone } from '../../src/ai/keywords.js';
import { labOutcome, type LabFixture, type LabPath } from '../../src/engine/lab.js';
import type { Outcome } from '../../src/engine/roll.js';
import type { Card } from '../../src/engine/cards.js';
import type { DealtSeed } from '../../src/engine/themes.js';

// ─── arms (§D.1, §D.4, §5.2) ────────────────────────────────────────────────────────────────────

export type Structure = 'S' | 'L' | 'H';
export type NamesArm = 'labels' | 'named';
/** R1 (C5): who the engine casts before the plan. `full` = Phase 1's casting (the shape's seats, a
 *  trade for everyone, a stake category). `lean` = the one who asks (name, sex, race; the plan coins
 *  their trade from the seed) + the person the ending decides + the personal soldier or a returning
 *  face only when the fixture deals one; no third seat, no stake (the plan reads what is at risk off
 *  the seed). Card 1 is always the `first` card call (C3: the plan's pitch spoiled and told job 1 as done). */
export type CastArm = 'full' | 'lean';
export interface Arm { structure: Structure; names: NamesArm; cast: CastArm }
export const armKey = (a: Arm) => `${a.structure}_${a.cast}${a.names === 'named' ? '_named' : ''}`;

// ─── shapes and job types (§2.4.1) ──────────────────────────────────────────────────────────────

export type Seat = 'client' | 'opponent' | 'other' | 'soldier';
export type ShapeId = 'rescue' | 'hunt' | 'recovery' | 'escort' | 'defense' | 'feud' | 'heist' | 'beast';
export type JobType = 'fight' | 'guard' | 'catch' | 'hunt' | 'sneak' | 'free' | 'find' | 'talk' | 'escort';
export type EpisodeType = JobType | 'showdown';
export type Way = 'recruit' | 'captive' | 'gold' | 'talk' | 'fight' | 'sneak';

/** every part stands alone: a report meets people as a list, so "took it" or "holds them" had no referent */
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
const PERSONAL_PARTS: [string, string, string] = ["one of the company's soldiers", 'stands in the way', "knows the soldier's past"];
/** the loose arm deals no shape, so its parts say only where someone stands, never their seat in a
 *  shape; still a concrete part for everyone (a vague one left the model guessing who opposes whom) */
const LOOSE_PARTS: Partial<Record<Seat, string>> = { opponent: 'stands in the way', other: 'is caught between the two sides' };
/** the part a person plays, as the plan and every report receive it */
export const partOf = (p: Person, arm: Arm): string => arm.structure === 'L' && !PERSONAL_PARTS.includes(p.part) ? LOOSE_PARTS[p.seat] ?? p.part : p.part;
/** a shape travels with what kind of story it is: a bare word left the model guessing (§2.4.1).
 *  An atom-level gloss, never a sentence to print, and none of the payload lint's instruction words */
const SHAPE_GLOSS: Record<ShapeId, string> = {
  rescue: 'someone held against their will is got out', hunt: 'someone dangerous is tracked down',
  recovery: 'something taken is got back', escort: 'someone is brought safely through danger',
  defense: 'a place under attack is held', feud: 'two sides quarrel over one thing',
  heist: 'something wrongly held is taken back', beast: 'a beast is killing, and someone keeps it',
};

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
const JOB_TYPES = Object.keys(TYPES) as JobType[];

const WAY_ENDING: Record<Way, string> = {
  recruit: 'joins the company', captive: 'held in your cells', gold: 'coin; goes free',
  talk: 'their matter settled', fight: 'their matter settled', sneak: 'their matter settled',
};
/** someone the company helps (the escorted, the held, an inside hand), not someone on the opponent's
 *  side. Cells or a treasure taken make no sense for them: the plan had to write options to jail or
 *  rob the person it had just brought through, so they are dealt only the ways that fit (`waysOf`),
 *  and gold means a share they give */
const SIDES_WITH_OPPONENT = new Set(['serves the one in the way']);
export const helped = (p: Pick<Person, 'seat' | 'part'>) => p.seat === 'other' && !SIDES_WITH_OPPONENT.has(p.part);
/** what each non-personal way means, dealt with the ways (a gloss for a way not dealt never reaches the model) */
// each names its subject: "they end in its cells" was read as the soldiers ("Blunder into the manor's laws, are arrested")
const WAY_MEANS: Record<'recruit' | 'captive' | 'gold', string> = { recruit: 'that person joins the company', captive: "that person ends in the company's cells", gold: "the company takes that person's treasure" };
const HELPED_GOLD = 'that person shares their treasure with the company and goes their way';
const wayMeans = (v: Way, isHelped: boolean) => v === 'gold' && isHelped ? HELPED_GOLD : WAY_MEANS[v as keyof typeof WAY_MEANS];
const WAY_ATTR: Record<Way, string> = { recruit: 'CHA', captive: 'STR', gold: 'INT', talk: 'CHA', fight: 'STR', sneak: 'DEX' };
/** a personal saga's ways are HOW it is settled, so the plan gets words that are not job type names */
const WAY_WORD: Partial<Record<Way, string>> = { talk: 'words', fight: 'force', sneak: 'stealth' };
const wayWord = (v: Way) => WAY_WORD[v] ?? v;
const wayOf = (word: string): string => (Object.entries(WAY_WORD).find(([, x]) => x === word)?.[0]) ?? word;

const STAKES: Record<ShapeId | 'personal', [string, number][]> = {
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

// coined people get a trade word (§2.4.2); the seat decides which pool
const FOLK_TRADES = ['miller', 'weaver', 'shepherd', 'beekeeper', 'ferryman', 'brewer', 'woodcutter', 'potter', 'fisher',
  'innkeeper', 'carter', 'herbalist', 'mason', 'tanner', 'widow', 'farmer', 'smith', 'peddler', 'charcoal-burner', 'midwife',
  'goatherd', 'trapper', 'baker', 'thatcher', 'healer', 'fowler', 'tinker', 'cooper'];
/** trades that name a sex: dealt only to that sex (a man dealt "midwife" came back as "her stall") */
const TRADE_SEX: Record<string, 'male' | 'female'> = { widow: 'female', midwife: 'female' };
const POWER_TRADES = ['reeve', 'moneylender', 'steward', 'landlord', 'bandit chief', 'toll-keeper', 'tax collector',
  'hedge knight', 'guild master', 'smuggler', 'forester', 'slaver', 'mercenary captain', 'magistrate', 'horse dealer',
  'abbot', 'poacher', 'cattle baron'];

// plain words for a card's tags (the Phase-2 `plainWords(card)` stand-in, §2.4.2)
const BACKGROUND_WORD: Record<string, string> = {
  ruler: 'noble', soldier: 'soldier', criminal: 'outlaw', priest: 'priest', mystic: 'mystic', artisan: 'artisan',
  adventurer: 'wanderer', entertainer: 'entertainer', merchant: 'merchant', scholar: 'scholar', courtesan: 'courtesan',
  sailor: 'sailor', slave: 'freed slave', hunter: 'hunter', peasant: 'peasant', servant: 'servant',
};
const TRAIT_WORD: Record<string, string> = {
  cool: 'calm', hotheaded: 'hot-headed', serious: 'serious', playful: 'playful', greedy: 'greedy', generous: 'generous',
  loner: 'solitary', gregarious: 'sociable', dominant: 'domineering', submissive: 'meek', calculating: 'shrewd',
  instinctive: 'impulsive', muscular: 'strong', scrawny: 'thin', nimble: 'quick', clumsy: 'clumsy', clever: 'clever',
  dull: 'slow-witted', beautiful: 'good-looking', ugly: 'plain-faced', tough: 'tough', sickly: 'sickly', tall: 'tall', short: 'short',
  famous: 'famous', infamous: 'notorious', 'high-born': 'high-born',
};
const SKILL_NOUN: Record<string, string> = {
  melee: 'a brawler', ranged: 'an archer', leadership: 'a leader', social: 'a talker', roguery: 'a thief', lore: 'a scholar',
  heal: 'a healer', craft: 'a tinkerer', nature: 'a tracker', performance: 'a performer', intimidation: 'an enforcer', food: 'a cook',
};
const RACE_WORD: Record<string, string> = { human: 'human', elf: 'elf', wolfman: 'wolfkin', lizardman: 'lizardfolk' };

const groupOfTag = (c: string) => CONCEPT[c]?.group;
const raceOf = (c: Card) => c.tags.find(t => groupOfTag(t.concept) === 'race')?.concept ?? 'human';
const sexOf = (c: Card): 'male' | 'female' => c.tags.some(t => t.concept === 'female') ? 'female' : 'male';
const manWoman = (sex: 'male' | 'female') => sex === 'female' ? 'woman' : 'man';
const an = (w: string) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
function plainWords(c: Card, n: number): string[] {
  const words = c.tags.filter(t => ['personality', 'body', 'standing'].includes(groupOfTag(t.concept) ?? '')).map(t => TRAIT_WORD[t.concept]).filter((w): w is string => !!w);
  return words.slice(0, n);
}
const backgroundOf = (c: Card) => c.tags.map(t => BACKGROUND_WORD[t.concept]).find(Boolean);
const topSkill = (c: Card) => [...c.tags].filter(t => groupOfTag(t.concept) === 'skill' && SKILL_NOUN[t.concept])
  .sort((a, b) => (b.tier ?? 1) - (a.tier ?? 1))[0]?.concept;
/** a soldier's trade, ONE source for every call: the plan's cast entry for a personal saga's soldier and every
 *  report's `soldiers[].is` (they named the same soldier "wanderer" and "a cook"). The top skill's noun, else the
 *  background word */
const soldierTrade = (c: Card) => { const s = topSkill(c); return s ? SKILL_NOUN[s]!.replace(/^an? /, '') : backgroundOf(c) ?? 'wanderer' };
/** a soldier as the report meets them: "a human man, hot-headed, a brawler" (§2.9.3) */
export function soldierIs(c: Card): string {
  const w = plainWords(c, 1)[0];
  return [an(`${RACE_WORD[raceOf(c)] ?? raceOf(c)} ${manWoman(sexOf(c))}`), w, an(soldierTrade(c))].filter(Boolean).join(', ');
}
/** a focal card's trade for the plan, on its own key like a coined person's: the plan's label ends in
 *  the trade, and a trade buried in a traits list ("human, hunter, slow-witted, thin") left it guessing */
const tradeOf = (c: Card) => { const s = topSkill(c); return backgroundOf(c) ?? (s ? SKILL_NOUN[s]!.replace(/^an? /, '') : 'wanderer') };
/** a focal card's traits: race and two plain words ("human, greedy, calm") */
const traitsOf = (c: Card) => [RACE_WORD[raceOf(c)] ?? raceOf(c), ...plainWords(c, 2)].filter(Boolean).join(', ');

export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0;
}
const NUMBER_WORD = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];

// ─── fixtures and the world ─────────────────────────────────────────────────────────────────────

export interface ProbeFixture {
  id: string;
  /** the existing lab fixture (fixtures/A|B) whose world, focal and personal past this one reuses */
  base: string;
  shape: ShapeId; variant: 'A' | 'B'; N: number;
  kind: 'recruit' | 'captive' | 'gold';
  personal: boolean;
  /** pins the saga's seed (the idea under it) instead of dealing a theme */
  seed?: string;
  stake?: string; tone?: string;
  returning?: { seat: 'client' | 'opponent' | 'other'; name: string; sex: 'male' | 'female'; race: string; trade: string; memory: string; where: string };
  note?: string;
}

export interface Person {
  id: string; name: string; sex: 'male' | 'female'; race: string;
  seat: Seat; focal: boolean; part: string;
  trade?: string; traits?: string;
  /** named from card 1 (R5): the client, the personal soldier, a returning face */
  known: boolean;
  memory?: string; where?: string;
}
export interface World {
  fx: ProbeFixture; base: LabFixture;
  region: string; level: number;
  roster: Card[];
  focal: Card;
  cast: Person[];
  stake: string; places: string[]; land: string;
}

/** a real engine world for one fixture: the MockProvider game at the base fixture's seed, the lab
 *  fort and roster (`labSaga`), the focal built exactly as the lab builds it, then v4 casting on a
 *  story rng of its own (frozen per fixture, so every arm and draw meets the same people). Build
 *  worlds in a FIXED order: card ids come from a process-wide counter.
 *  `castDraw` (the repetition series only): that draw gets its own people and places — a fresh
 *  focal face, coined cast, stake and places from a draw-keyed rng — so J4 reads ten different casts,
 *  not triplets of one frozen cast (a lab artifact). The roster, and a personal saga's soldier, stay;
 *  a returning face does not. */
export function buildWorld(fx: ProbeFixture, base: LabFixture, castDraw?: number): World {
  const game = new Game(new MockProvider(base.seed), base.seed);
  const posted = game.labSaga(base);
  if (!posted.ok) throw new Error(`${fx.id}: ${posted.msg}`);
  const level = base.level ?? 2;
  const region = base.region ?? game.activeRegions()[0]!;
  const lead = game.state.leads.find(l => l.id === posted.leadId)!;
  let focal: Card;
  if (fx.personal) {
    focal = game.card(lead.personalMercId!)!;
  } else {
    const f = base.focal;   // the lab's labFocal, verbatim: the same face in every run (a series draw: a new face, same tags)
    focal = materializeReward(new Rng(castDraw === undefined ? f.seed >>> 0 : hashStr(`focal:${f.seed}:${castDraw}`)), { kind: 'captive', value: f.value ?? 120, required: f.tags?.map(concept => ({ concept })) },
      level, region, castDraw === undefined ? { presetName: f.name, race: f.race, gender: f.sex, maxSkills: 2 } : { maxSkills: 2 })[0]!;
  }
  const roster = game.roster();
  const rng = new Rng(hashStr(castDraw === undefined ? `cast:${fx.id}:${base.seed}` : `cast:${fx.id}:${base.seed}:${castDraw}`));
  const races = Object.entries(REGION[region]!.poolWeights) as [string, number][];
  const taken = new Set(game.state.cards.filter(c => c.character).map(c => c.name));
  const coin = (seat: Seat, part: string, n: number): Person => {
    const sex = prefPick(rng, ['male', 'female']) as 'male' | 'female';
    const race = rng.weighted(races);
    let name = rollName(rng, race, sex);
    for (let i = 0; i < 12 && taken.has(name); i++) name = rollName(rng, race, sex);
    taken.add(name);
    return { id: `p${n}`, name, sex, race, seat, focal: false, part, trade: rng.pick((seat === 'opponent' ? POWER_TRADES : FOLK_TRADES).filter(t => (TRADE_SEX[t] ?? sex) === sex)), known: seat === 'client' };
  };
  const parts = fx.personal ? PERSONAL_PARTS : SHAPES[fx.shape].parts;
  const seats: Seat[] = fx.personal ? ['soldier', 'opponent', 'other'] : ['client', 'opponent', 'other'];
  const focalSeat: Seat = fx.personal ? 'soldier' : fx.shape === 'hunt' || fx.kind !== 'recruit' ? 'opponent' : 'other';
  let n = 0;
  const cast: Person[] = seats.map((seat, i) => {
    const part = parts[i]!;
    if (seat === focalSeat) return {
      id: focal.id, name: focal.name, sex: sexOf(focal), race: raceOf(focal), seat, focal: true, part,
      trade: fx.personal ? soldierTrade(focal) : tradeOf(focal), traits: traitsOf(focal), known: fx.personal,
    };
    // a series draw deals no returning face: the engine rests a used face for two sagas, so the same face
    // in back-to-back draws would itself be the repetition J4 is reading for
    const r = castDraw === undefined ? fx.returning : undefined;
    if (r && r.seat === seat) return { id: 'n1', name: r.name, sex: r.sex, race: r.race, seat, focal: false, part, trade: r.trade, known: true, memory: r.memory, where: r.where };
    return coin(seat, part, ++n);
  });
  const stake = fx.stake ?? rng.weighted(STAKES[fx.personal ? 'personal' : fx.shape]);
  const reg = REGION[region]!;
  const places: string[] = [];
  for (let i = 0; places.length < 3 && i < 40; i++) {
    const p = rollPlaceName(rng);
    if (p !== reg.landmark && !places.some(q => q.slice(0, 4) === p.slice(0, 4))) places.push(p);
  }
  const plain = (reg.seedPlain ?? reg.seed).replace(/\.$/, '');
  const land = `${reg.name.startsWith('The ') ? reg.name.replace(/^The/, 'the') : `the ${reg.name}`}, ${plain[0]!.toLowerCase()}${plain.slice(1)}`;
  return { fx, base, region, level, roster, focal, cast, stake, places, land };
}

/** the lean cast (R1, C5), derived from the full one so the people both arms share keep their names:
 *  the one who asks loses the engine's trade (the plan coins one from the seed); the person the ending
 *  decides stands in the way (they can join, be jailed or pay, so every way is dealt); the personal
 *  soldier and a returning face stay; nobody else is cast. The stake stays on the world for the
 *  floor's fallbacks only — `planPayload` deals it to the full arm alone. */
export function leanWorld(w: World): World {
  const decided = w.fx.personal ? w.cast.find(p => p.seat === 'opponent') : w.cast.find(p => p.focal);
  const cast: Person[] = [];
  for (const p of w.cast) {
    if (p === decided) cast.push(p.seat === 'opponent' ? p : { ...p, seat: 'opponent', part: LOOSE_PARTS.opponent! });
    else if (p.seat === 'soldier' || p.memory) cast.push(p);
    else if (p.seat === 'client') { const { trade: _trade, ...asker } = p; cast.push(asker) }
  }
  return { ...w, cast };
}

// ─── a draw: the dealt seed, tone and path (§5.2: draws 1–2 clean, draw 3 a failure and a re-pose) ─

export interface Draw { n: number; seed: { id: string | null; text: string; tone?: string; scale?: string }; tone: string; path: LabPath }
const TONE_FROM_THEME: Record<string, string> = { funny: 'wry', tender: 'warm', grim: 'grim', tense: 'tense' };

export function makeDraw(w: World, n: number, dealt: DealtSeed | null): Draw {
  const rng = new Rng(hashStr(`draw:${w.fx.id}:${n}`));
  const seed = w.fx.seed ? { id: null, text: w.fx.seed }
    : w.fx.personal ? { id: null, text: w.base.spark }
    : { id: dealt!.id, text: dealt!.theme, tone: dealt!.tone, scale: dealt!.scale };
  // one source per feeling: a theme labelled with a feeling passes it on; otherwise the engine's tone roll
  const tone = w.fx.tone ?? (seed.tone && TONE_FROM_THEME[seed.tone]) ?? pickTone(rng);
  const path: LabPath = n < 3 ? (w.fx.personal ? 'personal' : 'clean') : w.fx.N >= 3 ? 'bumpy' : 'lastchance';
  return { n, seed, tone, path };
}

// ─── the plan call's payload (§2.9.1) ───────────────────────────────────────────────────────────

/** avoid: recent sagas as title + question (titles alone gave the model nothing to steer away from) */
export interface PlanCtx { w: World; arm: Arm; draw: Draw; avoid?: { title: string; question: string }[]; direction?: string }
export const waysOf = (w: World): Way[] => w.fx.personal ? ['talk', 'fight', 'sneak']
  : [w.fx.kind, ...(['captive', 'recruit', 'gold'] as Way[]).filter(k => k !== w.fx.kind && !(k === 'captive' && helped(focalOf(w))))];
const focalOf = (w: World) => w.cast.find(p => p.focal)!;
const dealtTypes = (w: World) => SHAPES[w.fx.shape][w.fx.variant].slice(0, w.fx.N - 1);

export function planPayload(ctx: PlanCtx): { payload: Record<string, unknown>; flags: string[] } {
  const { w, arm, draw } = ctx;
  const flags: string[] = [];
  if (arm.structure !== 'L') flags.push('shape');
  if (arm.structure === 'S') flags.push('episodes'); else flags.push('types');
  if (w.fx.personal) flags.push('personal');
  if (w.cast.some(p => p.memory)) flags.push('memory');
  if (arm.cast === 'full') flags.push('stake');
  if (w.cast.some(p => !p.trade)) flags.push('notrade');
  if (ctx.direction) flags.push('direction');
  if (ctx.avoid?.length) flags.push('avoid');
  const payload: Record<string, unknown> = { seed: draw.seed.text };
  if (arm.structure !== 'L') payload.shape = `${w.fx.shape}: ${SHAPE_GLOSS[w.fx.shape]}`;
  if (arm.structure === 'S') payload.episodes = dealtTypes(w).map((t, i) => ({ n: i + 1, do: TYPES[t].do, kind: TYPES[t].kind }));
  else {
    payload.jobs = NUMBER_WORD[w.fx.N - 1];
    payload.types = JOB_TYPES.map(t => ({ type: t, do: TYPES[t].do, kind: TYPES[t].kind }));
  }
  payload.cast = w.cast.map(p => ({
    id: p.id, sex: manWoman(p.sex), part: partOf(p, arm),
    ...(p.trade ? { trade: p.trade } : {}), ...(p.traits ? { traits: p.traits } : {}),
    ...(p.known || arm.names === 'named' ? { name: p.name } : {}),
    ...(p.memory ? { memory: p.memory, where: p.where } : {}),
  }));
  if (arm.cast === 'full') payload.stake = w.stake;
  const ways = waysOf(w), isHelped = helped(focalOf(w));
  payload.ending = w.fx.personal ? { about: w.focal.id, likely: wayWord(ways[0]!), ways: ways.map(wayWord) }
    : { about: w.focal.id, likely: ways[0], ways: ways.map(v => ({ way: v, means: wayMeans(v, isHelped) })) };
  payload.land = w.land;
  payload.places = w.places;
  payload.tone = draw.tone;
  if (ctx.avoid?.length) payload.avoid = ctx.avoid;
  if (ctx.direction) payload.direction = ctx.direction;
  return { payload, flags };
}

// ─── the plan: schema, repairs, defects (§2.7) ──────────────────────────────────────────────────

const zs = z.union([z.string(), z.number()]).transform(String).optional().catch(undefined);
const zTrouble = z.object({ who: zs, carry: zs, will: zs }).partial().optional().catch(undefined);
/** an edge as written: a plain line (in job order), or an object naming its job ({"job": 2, "helps": "…"}) */
const zEdge = z.union([z.string(), z.object({ job: z.any().optional(), n: z.any().optional(), helps: zs, edge: zs, how: zs }).passthrough()]);
const zEp = z.object({
  n: z.any().optional(), type: zs, title: zs, job: zs, people: z.array(z.string()).optional().catch(undefined),
  trouble: zTrouble, win: zs, gain: zs, learn: zs, why: zs, settles: zs, lose: zs,
  edge: z.array(zEdge).optional().catch(undefined),
}).passthrough();
export const zPlanOut = z.object({
  title: zs, question: zs, answer: zs,
  cast: z.array(z.object({ id: zs, label: zs, want: zs, past: zs }).passthrough()).optional().catch(undefined),
  /** the one the company acts for, in an object of their own: `asker` (want), or on a personal saga
   *  `soldier` (want, past). A want and a past shown on every cast entry were written for everyone, read by
   *  no writer, and the soldier's own want went unwritten */
  asker: z.object({ want: zs }).partial().passthrough().optional().catch(undefined),
  soldier: z.object({ want: zs, past: zs }).partial().passthrough().optional().catch(undefined),
  episodes: z.array(zEp).optional().catch(undefined),
  showdown: zEp.optional().catch(undefined),
  options: z.array(z.object({ way: zs, label: zs }).passthrough()).optional().catch(undefined),
}).passthrough();

export interface Trouble { who: string; carry: string; will: string }
/** why (R1, C1; R2, S6): one plain sentence on what the one who asked needs this job for, saying what any
 *  thing or person in it is — never what it will find, prove or reveal (that is `learn`, hidden until the
 *  win: a why that told the result spoiled 11 of 13 spoiled cards). The card carries it.
 *  gain (R2, S2): a middle job's — what the company holds after a win (a thing, a captive, an ally); the
 *  engine keeps the gains of won jobs (`SagaState.held`), so a middle win is never dropped.
 *  learn (R2, S1): a middle job's — the one piece toward the answer its win brings to light, never the whole;
 *  the engine records it on a win (`SagaState.learned`), so the answer is pieced together, not bolted on.
 *  edge (R2, S2): the showdown's — one per middle job, in job order: how holding that job's gain helps here;
 *  the finale card and report get only the edges whose gain is held */
export interface Episode { n: number; type: EpisodeType; title: string; job: string; people: string[]; trouble: Trouble; win?: string; gain?: string; learn?: string; why: string; settles?: string; lose?: string; edge?: string[] }
/** past: a personal saga's soldier only, the old wrong in a few words (the card retells it; the seed
 *  sentence itself was pasted onto card 1) */
export interface CastEntry extends Person { label: string; want: string; past?: string }
export interface SagaPlan { title: string; question: string; answer: string; cast: CastEntry[]; episodes: Episode[]; showdown: Episode; options: { way: Way; label: string }[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// a name part is a capitalised word: a coined name's particles ("of", "the") are not, or the unmet-name
// repair turned every "the" in a plan into a label
const nameParts = (p: Person) => p.name.split(/\s+/).filter(x => x.length > 2 && /^\p{Lu}/u.test(x));

/** §2.7: the repairs are mechanical and silent; a hard defect earns one plain re-draw */
export function validatePlan(raw: unknown, ctx: PlanCtx): { plan: SagaPlan | null; repairs: string[]; defects: string[] } {
  const { w, arm } = ctx;
  const repairs: string[] = [], defects: string[] = [];
  const parsed = zPlanOut.safeParse(raw);
  if (!parsed.success) return { plan: null, repairs, defects: ['not a plan object'] };
  const o = parsed.data;
  const ids = new Set(w.cast.map(p => p.id));
  const need = (v: string | undefined, what: string) => { if (!v?.trim()) defects.push(`missing ${what}`); return v?.trim() ?? '' };
  // labels; a name inside a label is stripped (a label is what a stranger sees)
  const cast: CastEntry[] = w.cast.map(p => {
    const got = o.cast?.find(c => c.id === p.id);
    let label = got?.label?.trim() ?? '';
    for (const q of w.cast) for (const part of nameParts(q)) if (new RegExp(`\\b${esc(part)}\\b`).test(label)) {
      label = label.replace(new RegExp(`\\s*\\b${esc(part)}\\b,?`, 'g'), '').replace(/\s{2,}/g, ' ').trim();
      repairs.push(`name stripped from ${p.id}'s label`);
    }
    // the company's own soldier is asked for no label (cards and reports call them "one of your
    // soldiers"); theirs only feeds the mention match, so it is the engine's, silently
    if (!label && p.seat === 'soldier') label = an(`${RACE_WORD[p.race] ?? p.race} soldier`);
    if (!label) { label = an(p.trade ?? manWoman(p.sex)); repairs.push(`canned label for ${p.id}`) }
    const short = shortLabel(label);
    if (short !== label) { label = short; repairs.push(`long label cut for ${p.id}`) }
    // only the one the company acts for has a want: it reaches every card (premise, helping). The plan no
    // longer writes one for anyone else: no writer read it, and dealt to cards (R1 verify) an opponent's
    // want named the hidden answer on card 1 and came out as flat "X wants Y" lines
    const actFor = p.seat === 'client' || p.seat === 'soldier';
    const mine = p.seat === 'soldier' ? o.soldier : p.seat === 'client' ? o.asker : undefined;
    const past = p.seat === 'soldier' ? o.soldier?.past?.trim() || got?.past?.trim() || undefined : undefined;
    let want = actFor ? mine?.want?.trim() || got?.want?.trim() : undefined;
    // a want that restates its own subject ("Indure wants the merchant stopped") printed as "wants: Indure
    // wants…": the subject goes when it is this person (name, label or pronoun)
    const subj = want?.match(/^(?:((?:[\w'-]+\s+){0,3}?[\w'-]+)\s+)?wants?\s+(\S.*)$/i);
    if (subj && (!subj[1] || saysName(subj[1], p) || /^(?:he|she|they)$/i.test(subj[1]) || new RegExp(`\\b${esc(headNoun(label))}\\b`, 'i').test(subj[1]))) {
      want = subj[2]!; repairs.push(`subject cut from ${p.id}'s want`);
    }
    // no canned stand-in says the want or the past honestly ("to save a life" — whose?), so a missing one is
    // a hard defect (one plain re-draw), as the pitch was when the plan wrote card 1
    if (actFor && !want) defects.push(`missing want for ${p.id}`);
    if (p.seat === 'soldier' && !past) defects.push('missing soldier past');
    return { ...p, label, want: actFor ? want || cannedWant(p, w.stake) : '', ...(past ? { past } : {}) };
  });
  // a personal saga's soldier goes on every job (pickParty), so they are in every job's people
  const soldier = w.cast.find(p => p.seat === 'soldier');
  const people = (xs: string[] | undefined, where: string) => {
    const kept = (xs ?? []).filter(x => ids.has(x));
    if ((xs ?? []).length !== kept.length) repairs.push(`unknown ids dropped from ${where}`);
    if (soldier && !kept.includes(soldier.id)) { kept.unshift(soldier.id); repairs.push(`soldier added to ${where}`) }
    return [...new Set(kept)];
  };
  const trouble = (t: z.infer<typeof zTrouble>, where: string): Trouble => {
    if (!t?.who?.trim()) defects.push(`missing trouble in ${where}`);
    return { who: t?.who?.trim() ?? '', carry: t?.carry?.trim() ?? '', will: t?.will?.trim() ?? '' };
  };
  const want = w.fx.N - 1;
  const eps = (o.episodes ?? []);
  if (eps.length > want) repairs.push(`${eps.length - want} extra episode(s) cut`);
  if (eps.length < want) defects.push(`${eps.length} episodes, need ${want}`);
  const dealt = dealtTypes(w);
  const used: JobType[] = [];
  const episodes: Episode[] = eps.slice(0, want).map((e, i) => {
    let type: JobType;
    if (arm.structure === 'S') type = dealt[i]!;
    else {
      const t = (e.type ?? '').trim().toLowerCase() as JobType;
      if (JOB_TYPES.includes(t)) type = t;
      else { type = JOB_TYPES.find(x => !used.includes(x)) ?? 'find'; repairs.push(`episode ${i + 1}: type "${e.type ?? ''}" → ${type}`) }
    }
    used.push(type);
    return {
      n: i + 1, type, title: need(e.title, `episode ${i + 1} title`), job: need(e.job, `episode ${i + 1} job`),
      people: people(e.people, `episode ${i + 1}`), trouble: trouble(e.trouble, `episode ${i + 1}`),
      win: need(e.win, `episode ${i + 1} win`), gain: need(e.gain, `episode ${i + 1} gain`), learn: need(e.learn, `episode ${i + 1} learn`),
      why: need(e.why, `episode ${i + 1} why`),
    };
  });
  const sd = o.showdown;
  if (!sd) defects.push('missing showdown');
  const showdown: Episode = {
    n: want + 1, type: 'showdown', title: need(sd?.title, 'showdown title'), job: need(sd?.job, 'showdown job'),
    people: people(sd?.people, 'showdown'), trouble: trouble(sd?.trouble, 'showdown'), why: need(sd?.why, 'showdown why'),
    settles: need(sd?.settles, 'settles'), lose: need(sd?.lose, 'lose'), edge: edgesOf(sd?.edge, want, repairs, defects),
  };
  // a bare stake word as the loss ("a livelihood": whose? what?) was printed as is on card 1 and the last
  // chance; it becomes the stake's own concrete form for the one the company acts for ("his livelihood")
  const bare = Object.keys(STAKE_WANT).find(st => new RegExp(`^(?:(?:an?|the)\\s+)?${esc(st.replace(/^an?\s+/, ''))}\\.?$`, 'i').test(showdown.lose ?? ''));
  const actsFor = cast.find(p => p.seat === 'client' || p.seat === 'soldier');
  if (bare && actsFor) { showdown.lose = stakeLine(bare)[2](PRONOUN[actsFor.sex]); repairs.push('bare stake word in lose') }
  const ways = waysOf(w);
  // a way written into `label` and the line into `way` is swapped back; a way-like word stuck before
  // the line ("Enlist: the craftsman accepts…", "Bind — seize her…") goes, as the button shows the ending
  const opts = (o.options ?? []).map(x => {
    const wy = wayOf(x.way?.trim().toLowerCase().replace(/^by /, '') ?? '');
    let lb = x.label?.trim() ?? '';
    const lead = lb.match(/^[A-Z][a-z]+(?: [a-z]+)?\s*(?::|—|–| - )\s*(.+)$/);
    if (lead && lead[1]!.split(/\s+/).length >= 3) { lb = cap(lead[1]!); repairs.push('lead word cut from an option') }
    if (ways.includes(wy as Way)) return { way: wy, label: lb };
    const hit = ways.find(v => new RegExp(`\\b(?:${v}|${wayWord(v)})\\b`, 'i').test(lb));
    if (hit && lb.split(/\s+/).length <= 3 && x.way) { repairs.push(`option way and label swapped (${hit})`); return { way: hit, label: x.way.trim() } }
    return { way: wy, label: lb };
  });
  const options = ways.map(way => {
    const got = opts.find(x => x.way === way)?.label;
    if (!got) repairs.push(`canned option label for ${way}`);
    return { way, label: got || cannedOption(way, cast, arm) };
  });
  const plan: SagaPlan = {
    title: need(o.title, 'title'), question: need(o.question, 'question'), answer: need(o.answer, 'answer'),
    cast, episodes, showdown, options,
  };
  // a cast id in prose ("c12 prowls the slope", "p1's home") becomes the person: their name where the
  // arm lets it out, else "the <label>"; "a hunter named c12" loses the id outright (§2.7 repairs)
  const ref = (p: CastEntry) => refOf(p, arm);
  const deId = (s: string, where: string, sentence = true) => {
    let t = s, hit = false;
    for (const p of cast) {
      if (!new RegExp(`\\b${esc(p.id)}\\b`, 'i').test(t)) continue;
      hit = true;
      repairs.push(`id ${p.id} in ${where}`);
      // the id and any words beside it that already name the same person ("reeve p1", "the forest
      // reeve p1", "p1, the reeve", "p1 the forest reeve") become ONE reference: swapping the id alone
      // left "reeve the forest reeve". "(c48)" after its own label goes: it read "the elf wanderer (the
      // elf wanderer)"; "a hunter named c12" loses the id outright
      const own = [...new Set([...p.label.split(/[\s,]+/), ...(p.trade ?? '').split(/\s+/), ...nameParts(p)]
        .filter(x => x.length > 2 && !STOP.has(x.toLowerCase())))].map(esc).join('|');
      const before = own ? `(?:\\b(?:the|an?)\\s+)?(?:\\b(?:${own})\\s+)*` : '';
      const after = own ? `(?:,?\\s+(?:(?:the|an?)\\s+)?(?:(?:${own})\\s+)*(?:${own})\\b)?` : '';
      t = t.replace(new RegExp(`\\s*\\(\\s*${esc(p.id)}\\s*\\)`, 'gi'), '')
        .replace(new RegExp(`,?\\s+(?:named|called)\\s+${esc(p.id)}\\b`, 'gi'), '')
        .replace(new RegExp(`${before}\\b${esc(p.id)}\\b${after}`, 'gi'), ref(p));
    }
    // "p2, the goatherd" → "the goatherd, the goatherd" → once; "p2 the miller" → "the Yarlea miller the miller" → once
    if (hit) t = t.replace(/\b((?:[Tt]he|[Aa]n?) ([^,.;]+?)),?\s+the \2\b/g, '$1').replace(/\b((?:the|The) [^,.;]*?\b([A-Za-z-]+)),?\s+the \2\b/g, '$1');
    return hit && sentence ? t.replace(/(^|[.!?]\s+)the /g, (_m, a: string) => `${a}The `) : t;
  };
  plan.title = deId(plan.title, 'title'); plan.question = deId(plan.question, 'question'); plan.answer = deId(plan.answer, 'answer');
  for (const c of plan.cast) { if (c.want) c.want = deId(c.want, `${c.id} want`); if (c.past) c.past = deId(c.past, `${c.id} past`, false) }
  for (const e of [...plan.episodes, plan.showdown]) {
    const at = `episode ${e.n}`;
    e.title = deId(e.title, at); e.job = deId(e.job, at);
    e.trouble = { who: deId(e.trouble.who, at, false), carry: deId(e.trouble.carry, at, false), will: deId(e.trouble.will, at, false) };
    for (const k of ['win', 'gain', 'learn', 'why', 'settles', 'lose'] as const) if (e[k]) e[k] = deId(e[k]!, at, k !== 'gain');
    if (e.edge) e.edge = e.edge.map(x => deId(x, at, false));
  }
  for (const o of plan.options) o.label = deId(o.label, 'options');
  // the prompt's own word for the one the company acts for ("the asker", "the one who asked"; on a personal
  // saga "the soldier") written into plan text that a card prints becomes that person, as a cast id does
  const actFor = cast.find(p => p.seat === 'client' || p.seat === 'soldier');
  if (actFor) {
    const ROLE = actFor.seat === 'soldier' ? /\bthe soldier\b(?!s)/i : /\b(?:the asker|the one who asked)\b/i;
    const unRole = (t: string, where: string) => ROLE.test(t) ? (repairs.push(`role word in ${where}`), t.replace(new RegExp(ROLE.source, 'gi'), ref(actFor)).replace(/(^|[.!?]\s+)the /g, (_m, x: string) => `${x}The `)) : t;
    plan.question = unRole(plan.question, 'question'); plan.answer = unRole(plan.answer, 'answer');
    for (const e of [...plan.episodes, plan.showdown]) {
      e.job = unRole(e.job, `episode ${e.n}`);
      for (const k of ['win', 'gain', 'learn', 'why', 'settles', 'lose'] as const) if (e[k]) e[k] = unRole(e[k]!, `episode ${e.n}`);
      if (e.edge) e.edge = e.edge.map(x => unRole(x, `episode ${e.n}`));
    }
    for (const o of plan.options) o.label = unRole(o.label, 'options');
  }
  for (const c of plan.cast) c.label = c.label.trim();
  // an unmet name the model somehow wrote goes back to its label (labels arm only: it saw no such name)
  if (arm.names === 'labels') {
    const fix = (s: string) => { let t = s; for (const p of cast) if (!p.known) for (const part of nameParts(p)) t = t.replace(new RegExp(`\\b${esc(part)}\\b`, 'g'), () => { repairs.push(`unmet name ${part} → label`); return p.label }); return t };
    // why reaches every card, so an unmet name there would print before anyone met them
    // gain, learn and edge reach later cards (have, mystery) and the finale card, so they are fixed too
    for (const e of [...plan.episodes, plan.showdown]) {
      e.job = fix(e.job); e.title = fix(e.title); e.trouble = { who: fix(e.trouble.who), carry: fix(e.trouble.carry), will: fix(e.trouble.will) }; e.why = fix(e.why);
      for (const k of ['win', 'gain', 'learn'] as const) if (e[k]) e[k] = fix(e[k]!);
      if (e.edge) e.edge = e.edge.map(fix);
    }
    for (const c of plan.cast) { if (c.past) c.past = fix(c.past); if (c.want) c.want = fix(c.want) }
    if (plan.showdown.lose) plan.showdown.lose = fix(plan.showdown.lose);
    // the question is card 1's (what nobody knows yet)
    plan.question = fix(plan.question);
  }
  return { plan, repairs, defects };
}

/** the showdown's edges, one per middle job in job order (R2, S2). A line that names its job ("job": 2)
 *  goes to that job; plain lines fill the rest in order; extras are cut. A job with no edge is a hard
 *  defect, as a missing win is: no canned line says honestly how a held thing helps */
function edgesOf(raw: z.infer<typeof zEdge>[] | undefined, want: number, repairs: string[], defects: string[]): string[] {
  const out: (string | undefined)[] = Array.from({ length: want }, () => undefined);
  const loose: string[] = [];
  for (const x of raw ?? []) {
    const text = (typeof x === 'string' ? x : x.helps ?? x.edge ?? x.how ?? '').trim();
    if (!text) continue;
    const at = typeof x === 'string' ? NaN : Number(x.job ?? x.n);
    if (at >= 1 && at <= want && !out[at - 1]) out[at - 1] = text; else loose.push(text);
  }
  for (let i = 0; i < want && loose.length; i++) if (!out[i]) out[i] = loose.shift();
  if (loose.length) repairs.push(`${loose.length} extra edge(s) cut`);
  out.forEach((x, i) => { if (!x) defects.push(`missing edge for episode ${i + 1}`) });
  return out.map(x => x ?? '');
}

/** a label is what a stranger sees in two or three words, a noun phrase that can stand in a sentence.
 *  A clause after it ("miller who keeps every account in a battered book") was repeated whole at every
 *  mention, and a "trade, look" list ("miller, flour-dusted keeper") was pasted as a prefix ("miller,
 *  flour-dusted keeper Jervaise Greyfell stands before you"): anything after a comma goes, and a clause
 *  goes from a label past three words */
const LABEL_CLAUSE = /\s+(?:who|whose|that|with|from|in|at|on|wearing|carrying|holding)\s+/i;
export function shortLabel(label: string): string {
  // the sex is dealt beside every label, so a label that leads with it ("woman baker") drops it
  const head = (label.split(/[,;(]/)[0]!.trim() || label.trim()).replace(/^((?:an?|the)\s+)?(?:wo)?man\s+(?=\S)/i, '$1');
  if (head.replace(/^(?:an?|the)\s+/i, '').split(/\s+/).length <= 3) return head;
  return head.split(LABEL_CLAUSE)[0]!.trim() || head;
}
/** "the <label>" from a label written any way ("a thin hunter", "thin hunter, slow-eyed") */
export const theLabel = (label: string) => `the ${label.split(',')[0]!.replace(/^(?:an?|the)\s+/i, '').trim()}`;
/** a person in engine-written text: their name where the arm lets it out, else "the <label>" */
const refOf = (p: Person & { label: string }, arm: Arm) => p.known || arm.names === 'named' ? p.name : theLabel(p.label);
const PRONOUN = { male: { sub: 'he', obj: 'him', pos: 'his' }, female: { sub: 'she', obj: 'her', pos: 'her' } } as const;
function cannedOption(way: Way, cast: CastEntry[], arm: Arm): string {
  const f = cast.find(p => p.focal)!, opp = cast.find(p => p.seat === 'opponent')!;
  const who = refOf(f, arm), o = refOf(opp, arm);
  return {
    recruit: `Offer ${who} a place in the company`, captive: `Take ${who} to the fort in chains`,
    gold: helped(f) ? `Take a share of ${who}'s treasure and let ${PRONOUN[f.sex].obj} go ${PRONOUN[f.sex].pos} way` : `Take what ${who} hoards and let ${PRONOUN[f.sex].obj} go`, talk: `Talk it out with ${o}`, fight: `Fight it out with ${o}`,
    sneak: `Slip past ${o}'s guards and settle it unseen`,
  }[way];
}
/** what the one who asked wants, and what is settled for them, from the dealt stake: the floor's
 *  (and a missing want's) stand-in, concrete per saga instead of one canned line for every saga */
type StakeLine = (who: string, pos: string) => string;
type Pro = (typeof PRONOUN)['male' | 'female'];
/** [want, settles, lose]; lose in a few words, as the plan writes it (the engine makes the sentence) */
const STAKE_WANT: Record<string, [(pos: string) => string, StakeLine, (he: Pro) => string]> = {
  'a home': [pos => `to keep ${pos} home`, (who, pos) => `${who} keeps ${pos} home.`, he => `${he.pos} home`],
  'a livelihood': [pos => `to save ${pos} livelihood`, (who, pos) => `${who} keeps ${pos} livelihood.`, he => `${he.pos} livelihood`],
  // (lose: "the life she feared for" ran into the engine's "for good": "loses the life she feared for for good")
  'a life': [() => 'to save a life', who => `The life ${who} feared for is saved.`, he => `a life dear to ${he.obj}`],
  freedom: [() => 'to see the one held set free', who => `The one held goes free, as ${who} wanted.`, he => `the one ${he.sub} wanted freed`],
  'someone loved': [() => 'to get someone dear back safe', who => `${who} gets someone dear back safe.`, he => `someone ${he.sub} holds dear`],
  'a good name': [pos => `to clear ${pos} name`, (who, pos) => `${who}'s name is cleared.`, he => `${he.pos} good name`],
  'a promise': [pos => `to keep ${pos} promise`, (who, pos) => `${who} keeps ${pos} promise.`, he => `the promise ${he.sub} made`],
};
const stakeLine = (stake: string) => STAKE_WANT[stake] ?? STAKE_WANT['a promise']!;
/** the want of the one the company acts for (the only person with a want), from the stake: the floor's */
const cannedWant = (p: Person, stake: string): string => stakeLine(stake)[0](PRONOUN[p.sex].pos);

const STOP = new Set('the a an of to in and that was is who his her their it for with on at by from as has had have been be not but this they them he she its only than so what when where which will would'.split(' '));
const stem = (x: string) => x.slice(0, 5);
const contentWords = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x));
/** a dealt line adds something only with two content words the other lacks ("to keep his promise" /
 *  "his promise is broken" repeats; a line that only repeats gets pasted as its own sentence) */
const adds = (line: string, to: string, min = 2) => { const have = new Set(contentWords(to).map(stem)); return contentWords(line).filter(x => !have.has(stem(x))).length >= min };

/** §2.7 log-only telemetry: nothing here re-rolls anything */
export function planLint(plan: SagaPlan, w: World, seed = w.fx.seed ?? ''): string[] {
  const out: string[] = [];
  // (a person the seed names may appear, so the seed's own words are no stray either)
  const known = new Set([...w.cast.flatMap(p => nameParts(p)), ...w.places, ...w.land.split(/\W+/), ...seed.split(/\W+/)]);
  const skip = new Set(plan.cast.flatMap(p => [p.trade ?? '', p.traits ?? '', p.label].join(' ').split(/\W+/)));
  // the answer, learns, gains and edges too (R2): an answer naming someone not in cast printed or was dropped
  const fields = [plan.question, plan.answer, ...plan.episodes.flatMap(e => [e.job, e.trouble.who, e.trouble.carry, e.trouble.will, e.win ?? '', e.gain ?? '', e.learn ?? '', e.why]),
    plan.showdown.job, plan.showdown.why, plan.showdown.settles ?? '', plan.showdown.lose ?? '', ...(plan.showdown.edge ?? [])];
  // a capital that does not open a sentence and names nobody and nowhere the engine dealt
  const stray = [...new Set(fields.flatMap(f => f.split(/[.!?:;"]\s*/).flatMap(s => s.trim().split(/\s+/).slice(1)))
    .map(t => t.replace(/[^A-Za-z'-]/g, '').replace(/'s$/, '')).filter(t => /^[A-Z][a-z]{2,}/.test(t) && !known.has(t) && !skip.has(t)))];
  if (stray.length) out.push(`stray capitalised: ${stray.join(', ')}`);
  // the seed, labels, names, places and the question's own words are no leak: card 1 prints the question,
  // and an answer shares its subject ("what answers the song?" / "the answering voice is…")
  const plainSet = new Set([...seed.toLowerCase().split(/\W+/), ...plan.cast.flatMap(p => [...p.label.toLowerCase().split(/\W+/), ...nameParts(p).map(x => x.toLowerCase())]),
    ...w.places.map(x => x.toLowerCase()), ...plan.question.toLowerCase().split(/\W+/)]);
  const plainStems = new Set([...plainSet].map(stem));
  const answerWords = (plan.answer.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x) && !plainStems.has(stem(x)));
  // lose reaches card 1 (the premise) and a last-chance card, every why reaches a card (the showdown's
  // the finale card), and the want of the one the company acts for reaches every card, so all count as early.
  // (R2) the answer is pieced together: a word an earlier job's learn already brought to light is no leak
  // where it prints after that win (job k's card after learns 1..k-1, its win after learn k, the finale card's
  // why and edges after every learn); card 1's premise (want, lose) comes before any
  const learnt = (upTo: number) => new Set(plan.episodes.slice(0, upTo).flatMap(e => (e.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? []).map(stem));
  const leakIn = (text: string, known: Set<string>) => answerWords.filter(x => !known.has(stem(x)) && new RegExp(`\\b${x}\\b`).test(text.toLowerCase()));
  const leak = [...new Set([
    ...leakIn([plan.showdown.lose ?? '', ...plan.cast.map(p => p.want)].join(' '), new Set()),
    ...plan.episodes.flatMap((e, i) => [...leakIn(`${e.title} ${e.job} ${e.why}`, learnt(i)), ...leakIn(e.win ?? '', learnt(i + 1))]),
    ...leakIn([plan.showdown.why, ...(plan.showdown.edge ?? [])].join(' '), learnt(plan.episodes.length)),
  ])];
  if (leak.length) out.push(`answer words before the finale: ${leak.join(', ')}`);
  // (R2, S1/S6) a learn is hidden until its own win: its words in its own card's why spoil it (the job and
  // title name the job's thing, so their words are no leak); a learn that holds most of the answer is the
  // whole answer told mid-saga; a why that says what the job will find or prove states the result in advance
  plan.episodes.forEach(e => {
    const named = `${e.title} ${e.job}`.toLowerCase(), why = e.why.toLowerCase();
    const lw = [...new Set((e.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(x => !STOP.has(x) && !plainStems.has(stem(x)));
    const spoil = lw.filter(x => new RegExp(`\\b${x}\\b`).test(why) && !new RegExp(`\\b${x}\\b`).test(named));
    if (spoil.length >= 2) out.push(`episode ${e.n} why tells its learn: ${spoil.join(', ')}`);
    const lstems = new Set(lw.map(stem));
    if (answerWords.length >= 3 && answerWords.filter(x => lstems.has(stem(x))).length >= 0.75 * answerWords.length) out.push(`episode ${e.n} learn tells the whole answer`);
  });
  // ...and together: the learns of every job leave the showdown nothing to bring out (the finale card said
  // "the mystery is solved" and the truth restated the last learn)
  // (word overlap is coarse: a paraphrased learn hides its share, so the bar is low and the share is printed)
  const allLearnt = learnt(plan.episodes.length);
  const share = answerWords.length >= 4 ? answerWords.filter(x => allLearnt.has(stem(x))).length / answerWords.length : 0;
  if (share >= 0.4) out.push(`the learns share ${Math.round(share * 100)}% of the answer's words before the showdown`);
  for (const e of [...plan.episodes, plan.showdown]) if (/\b(?:proof|prov(?:e|es|ing)|reveal(?:s|ing)?|uncover(?:s|ing)?|expos(?:e|es|ing)|find(?:s|ing)? out|learn(?:s|ing)?)\b/i.test(e.why)) out.push(`episode ${e.n} why says what the job will find`);
  if (plan.episodes[0] && !plan.episodes[0].people.includes(w.focal.id)) out.push('the person in ending is not among job 1\'s people');
  // fields the plan is asked to keep to a few words: a finished clause here was pasted whole into cards
  const long = (v: string | undefined, max: number) => (v ?? '').split(/\s+/).filter(Boolean).length > max;
  // (`will` is a verb phrase, so it gets a little more room before it counts)
  for (const e of [...plan.episodes, plan.showdown]) for (const f of ['who', 'carry', 'will'] as const) if (long(e.trouble[f], f === 'will' ? 8 : 6)) out.push(`episode ${e.n} trouble.${f} past a few words`);
  if (long(plan.showdown.lose, 8) || /\b(?:loses?|lost)\b|^if\b/i.test(plan.showdown.lose ?? '')) out.push('lose past a few words');
  for (const c of plan.cast) if (long(c.past, 8)) out.push(`${c.id} past past a few words`);
  // (R2, S2) a gain is a few words; a gain that is the person the ending decides is held before the showdown
  // that decides them (the ledger breaks: caught, then free)
  const target = choiceTarget(plan);
  for (const e of plan.episodes) {
    if (long(e.gain, 8)) out.push(`episode ${e.n} gain past a few words`);
    // the person themselves, not something of theirs ("the merchant's ledger" is no captive merchant)
    const own = [...nameParts(target), headNoun(target.label)].filter(x => x.length > 2).map(esc).join('|');
    if (e.gain && own && new RegExp(`\\b(?:${own})\\b(?!['’]s)`, 'i').test(e.gain)) out.push(`episode ${e.n} gain is the person in ending`);
  }
  (plan.showdown.edge ?? []).forEach((x, i) => { if (long(x, 14)) out.push(`edge ${i + 1} past a few words`) });
  if (/\bif\b/i.test(plan.showdown.settles ?? '')) out.push('settles says "if"');
  // the showdown's trouble should be someone in cast, by label: a free-text role ("the debt-master") became
  // a second antagonist beside the one the finale's choice names
  if (!plan.cast.some(p => p.seat !== 'soldier' && mentions(plan.showdown.trouble.who, p))) out.push('showdown trouble names nobody in cast');
  const PART_WORDS = /\b(the (?:client|ally|obstacle|quarry|rival|opponent|focal|target))\b/i;
  for (const p of plan.cast) if (PART_WORDS.test(p.label)) out.push(`part-word label: ${p.label}`);
  return out;
}

// ─── who is named where (§2.5) ──────────────────────────────────────────────────────────────────

/** what the player knows of each person so far:
 *   met   — may be named (R5): the client, the personal soldier, a returning face, then anyone a
 *           delivered report named (labels arm). The named arm lets every name out from card 1.
 *   named — the player has READ this person's name. Until then a name travels with its label, so
 *           no card or report can drop a bare name on a stranger.
 *   seen  — the person has appeared at all, by name or by label (memory is dealt before this). */
export interface Knowing { met: Set<string>; named: Set<string>; seen: Set<string> }
/** a person as a card or report receives them: name, label, sex, and `intro` / `memory` / `part` */
type Entry = Record<string, string | boolean>;
/** named from the start: the company's own soldier (the player reads their name on the roster) and a
 *  returning face (met in an earlier story), so no card brings either in as a stranger */
export const newKnowing = (cast: Person[]): Knowing => ({ met: new Set(cast.filter(p => p.known).map(p => p.id)), named: new Set(cast.filter(p => p.seat === 'soldier' || p.memory).map(p => p.id)), seen: new Set() });
/** the head noun of a label: "the lord of Ashworth Hold" → lord, "a hill-farm widow" → widow */
const PERSON_NOUNS = new Set(['woman', 'man', 'girl', 'boy', 'lad', 'lass', 'person', 'fellow', 'folk', 'one', 'stranger', 'figure']);
/** the head noun of a label: "the lord of Ashworth Hold" → lord, "a hill-farm widow" → widow; a bare
 *  "man"/"woman" says nothing ("woodcutter woman" → woodcutter), or every woman would match */
export function headNoun(label: string): string {
  const core = label.toLowerCase().replace(/^(an?|the)\s+/, '').split(/\s+(?:of|who|with|from|in|at|on|whose|that)\s+|,/)[0]!;
  const words = core.trim().split(/\s+/).map(x => x.replace(/['’]s$/, ''));
  while (words.length > 1 && PERSON_NOUNS.has(words[words.length - 1]!)) words.pop();
  return words[words.length - 1]!;
}
const saysName = (text: string, p: Person) => nameParts(p).some(n => new RegExp(`\\b${esc(n)}\\b`).test(text));
const saysLabel = (text: string, p: CastEntry) => { const noun = headNoun(p.label); return noun.length > 2 && new RegExp(`\\b${esc(noun)}s?\\b`).test(text.toLowerCase()) };
export const mentions = (text: string, p: CastEntry) => saysName(text, p) || saysLabel(text, p);
const mayName = (p: CastEntry, arm: Arm, k: Knowing) => arm.names === 'named' || k.met.has(p.id);
/** someone already in the story, as a field names them: their name once it may be said, else "the <label>"
 *  ("a merchant" on the finale card read as somebody new) */
const callName = (p: CastEntry, arm: Arm, k: Knowing) => mayName(p, arm, k) ? p.name : theLabel(p.label);

/** Every entry carries the label, so a name can be tied to the role the job, trouble or result names
 *  ("the collector", "the midwife"); a bare name read as someone else. And the sex, which the engine
 *  owns (left out, a goatherd who is a woman came back as "the man"). `intro` marks the one the player
 *  meets here: a flag named `new` leaked into the prose as "a new fowler". The company's own soldier is
 *  labelled as that: the plan's stranger-eye label read as a client ("You are needed by Jervaise"). */
const labelOf = (p: CastEntry, view: 'card' | 'report') => p.seat !== 'soldier' ? p.label : view === 'card' ? 'one of your soldiers' : "one of the company's soldiers";
const entry = (p: CastEntry, k: Knowing, view: 'card' | 'report'): Entry =>
  ({ name: p.name, label: labelOf(p, view), sex: manWoman(p.sex), ...(k.named.has(p.id) ? {} : { intro: true }) });
/** one person as a card receives them: the unnamed keep only their label (§2.5) */
const cardEntry = (p: CastEntry, arm: Arm, k: Knowing): Entry =>
  mayName(p, arm, k) ? entry(p, k, 'card') : { label: labelOf(p, 'card'), sex: manWoman(p.sex), ...(k.seen.has(p.id) ? {} : { intro: true }) };
/** a report names whoever is there (reports are where strangers are met, §2.5) */
const reportEntry = (p: CastEntry, k: Knowing) => entry(p, k, 'report');
export const displayName = (p: CastEntry, arm: Arm, k: Knowing) => mayName(p, arm, k) ? p.name : p.label;
/** ON THIS MATTER (§4.3): the people this card calls by name — name — label */
export const onThisMatter = (plan: SagaPlan, text: string) =>
  plan.cast.filter(p => saysName(text, p)).map(p => `${p.name} — ${p.label.replace(/^an? /, '')}`);

/** after a text is delivered: who appeared, whose name was read, and who a report named (met). A name
 *  counts as read (intro off) only in a text that also carries the label's head noun, so the player
 *  could tie the name to the role; a report that dropped the bare name left the finale card printing a
 *  name the player could not place */
export function noteDelivered(text: string, plan: SagaPlan, k: Knowing, isReport: boolean): void {
  for (const p of plan.cast) {
    if (mentions(text, p)) k.seen.add(p.id);
    if (saysName(text, p)) { if (saysLabel(text, p)) k.named.add(p.id); if (isReport) k.met.add(p.id) }
  }
}

// ─── card and report payloads (§2.5, §2.9.2, §2.9.3) ────────────────────────────────────────────

export interface CardCall { payload: Record<string, unknown>; flags: string[]; vars: Record<string, number> }

/** what the saga has banked so far (R2, lab stand-in for the engine's record): `learned` = the learns of won
 *  middle jobs, in order (S1); `held` = the numbers of won middle jobs, whose gains the company holds (S2).
 *  Only a win banks: a failed try, or a job lost past the setback budget, teaches and gains nothing, and
 *  the finale still works on whatever is held */
export interface SagaState { learned: string[]; held: number[] }
export const newState = (): SagaState => ({ learned: [], held: [] });
/** after a job's report: a won middle job's learn and gain enter the record */
export function bank(state: SagaState, e: Episode, outcome: Outcome): void {
  if (e.type === 'showdown' || outcome === 'failure' || state.held.includes(e.n)) return;
  state.held.push(e.n);
  if (e.learn) state.learned.push(e.learn);
}
/** what the company holds, as a later text receives it: the gains of won jobs; at the finale each with the
 *  showdown's edge for it (only the edges whose gain is held ever reach the finale) */
export function haveOf(plan: SagaPlan, state: SagaState, finale: boolean): string[] | { holds: string; helps: string }[] {
  const held = state.held.map(n => plan.episodes[n - 1]).filter((e): e is Episode => !!e?.gain);
  return finale ? held.map(e => ({ holds: e.gain!, helps: plan.showdown.edge?.[e.n - 1] ?? '' })).filter(x => x.helps) : held.map(e => e.gain!);
}
/** a person's part reaches a text only when they are in THIS job (R2, S4): the static part of someone the
 *  dealt text merely mentioned was printed as a story claim ("X stands in the way" on a job X was not in) */
const inJob = (plan: SagaPlan, e: Episode, finale: boolean): string[] => [...e.people, ...(finale ? [choiceTarget(plan).id] : [])];
// (R2, S3) the finale card no longer receives the ways as endings (CHOICE_END): the card recited them as a
// menu the buttons already list; it gets `fate` (whose fate) and `lose` (what is at stake)
/** the one the company acts for: the client, or on a personal saga its own soldier */
const clientOf = (plan: SagaPlan) => plan.cast.find(p => p.seat === 'client' || p.seat === 'soldier')!;
/** whom the finale's choice is about: the focal, or, when the focal is the company's own soldier, the
 *  one in their way (the options settle the soldier's matter WITH that person) */
export const choiceTarget = (plan: SagaPlan) => plan.cast.find(p => p.focal && p.seat !== 'soldier') ?? plan.cast.find(p => p.seat === 'opponent')!;

export function firstCardPayload(plan: SagaPlan, w: World, arm: Arm, k: Knowing, direction?: string): CardCall {
  const e = plan.episodes[0] ?? plan.showdown;
  const client = clientOf(plan);
  // premise: who, what they want, what they lose if nobody acts (a personal saga adds the past that
  // caught up, from the plan in a few words). The loss is the plan's `lose` in a few words, the stake
  // made concrete: the bare stake word was pasted as "A promise is at risk.", and it is left out when
  // it adds no word to the want
  const loss = plan.showdown.lose ?? '';
  // unknown (R1 verify): the story's question, put to the player as what nobody knows yet, so the finale's
  // truth answers something the player was asked (never dealt, it answered a question nobody had)
  const premise = { who: displayName(client, arm, k), wants: client.want, ...(w.fx.personal && client.past ? { past: client.past } : {}), ...(adds(loss, client.want, 1) ? { loses: loss } : {}), unknown: plan.question };
  const planText = `${e.job} ${e.why} ${JSON.stringify(e.trouble)} ${plan.question}`;
  const names = namesFor(plan, [client.id, ...e.people], planText, arm, k, [client.id], e.trouble.who, inJob(plan, e, false));
  const flags = ['first'];
  // the premise line names the loss only when one is dealt (R1 verify 2): named but absent, it was invented
  if (premise.loses) flags.push('loses');
  if (w.fx.personal) flags.push('personal');
  if (names.some(n => n.memory)) flags.push('memory');
  if (direction) flags.push('direction');
  // no question and no closing sight (R1, C1/C2): the closing-hook rule made every card end on a dangling
  // clue nothing paid off; `why` says what the job's thing or person is and how getting it helps
  return { payload: { premise, job: e.job, why: e.why, trouble: e.trouble, names, ...(direction ? { direction } : {}) }, flags, vars: { MAX: 70 } };
}

export function laterCardPayload(plan: SagaPlan, e: Episode, latest: string, arm: Arm, k: Knowing, o: { finale: boolean; lastchance: boolean; retry?: boolean; state: SagaState; direction?: string }): CardCall {
  const client = clientOf(plan), target = choiceTarget(plan);
  const always = [client.id, ...(o.finale ? [target.id] : [])];
  const have = haveOf(plan, o.state, o.finale);
  const mystery = o.state.learned.length ? { question: plan.question, learned: o.state.learned } : undefined;
  const planText = `${e.job} ${e.why} ${JSON.stringify(e.trouble)} ${JSON.stringify(have)} ${o.state.learned.join(' ')}`;
  const names = namesFor(plan, [...always, ...e.people], `${latest} ${planText}`, arm, k, always, e.trouble.who, inJob(plan, e, o.finale));
  const flags = [o.finale ? 'finale' : 'later'];
  // a personal saga's finale settles the soldier's matter with the one in the way, not a fate
  if (o.finale && client.seat === 'soldier') flags.push('personal');
  if (names.some(n => n.memory)) flags.push('memory');
  if (o.finale && o.lastchance) flags.push('lastchance');
  if (o.retry) flags.push('retry');
  if (mystery) flags.push('mystery');
  if (have.length) flags.push('have', ...(o.finale ? ['edge'] : []));
  if (o.direction) flags.push('direction');
  // `helping` on every card: who the company acts for and what they want, so a job ties back to why
  // (a key named `for` read as the idiom "the one in for"). A re-posed job (R2, S5) gets `retry` in place
  // of `latest`: what stopped the last try at this same job (unmarked, the retry re-posed a done step)
  const payload: Record<string, unknown> = { ...(o.retry ? { retry: latest } : { latest }), helping: { who: displayName(client, arm, k), wants: client.want } };
  // (R2, S1) the mystery builds: the question with every piece learned so far; (S2) what the company holds,
  // at the finale with how each helps there, so a middle win is used and never reappears in enemy hands
  if (mystery) payload.mystery = mystery;
  payload.job = e.job; payload.why = e.why;
  if (have.length) payload.have = have;
  payload.trouble = e.trouble;
  // (R2, S3) the finale names whose fate it decides and what is at stake, never the ways: the buttons list
  // them, and dealt to the card they were recited as a menu (19 and 18 of 24). `lose` carries its owner: a
  // bare "his livelihood" after `fate` read as the fated one's loss, flipping the stakes
  if (o.finale) { payload.fate = callName(target, arm, k); if (e.lose) payload.lose = { who: callName(client, arm, k), loses: e.lose } }
  payload.names = names;
  if (o.direction) payload.direction = o.direction;
  // the finale card gained the why (R1) and lost nothing, so its cap grew by the why's room
  return { payload, flags, vars: { MAX: o.finale ? 90 : 70 } };
}

/** a part as a card or report receives it: one that points at the company's soldier names them (a list of
 *  people, often beside two soldiers, left "knows the soldier's past" with no referent) */
const partIn = (p: CastEntry, plan: SagaPlan, arm: Arm) => {
  const soldier = plan.cast.find(c => c.seat === 'soldier');
  return soldier ? partOf(p, arm).replace(/\bthe soldier\b/g, soldier.name) : partOf(p, arm);
};

/** §2.5 names filter: only the people the dealt text refers to (an unreferenced entry gave "Odo is an
 *  ally."), plus the ones the card must carry (the one it acts for, the choice on the finale). Anyone
 *  the dealt text names counts, in the job's people or not: `latest` named someone who was not, and the
 *  card printed a name it had no label or sex for */
function namesFor(plan: SagaPlan, ids: string[], dealt: string, arm: Arm, k: Knowing, always: string[], troubleWho: string, here: string[]): Entry[] {
  const out: Entry[] = [];
  // whose role another field already gives: the one the company acts for (premise / helping), the one the
  // finale's choice is about (always, beside the client), and whoever the trouble names
  const placed = (p: CastEntry) => always.includes(p.id) || mentions(troubleWho, p);
  for (const id of [...new Set([...ids, ...plan.cast.map(p => p.id)])]) {
    const p = plan.cast.find(c => c.id === id);
    if (!p || (!always.includes(id) && !mentions(dealt, p))) continue;
    const entry = cardEntry(p, arm, k);
    // the part of anyone no other field places, as reports get it (R1 verify 2): a name no field placed got
    // a guessed role ("the soft-eyed miller" stood guard beside the slaver). A part given to everyone was
    // pasted as its own line ("The thin hunter stands in the way, a man."). Only for someone in this job
    // (R2, S4): one the dealt text merely mentions keeps name and label
    if (!placed(p) && here.includes(p.id)) entry.part = partIn(p, plan, arm);
    if (p.memory && !k.seen.has(p.id)) entry.memory = p.memory;
    out.push(entry);
  }
  return out;
}

/** the finale's loss as a sentence: the plan writes `lose` in a few words ("his market"), the engine says
 *  whose it is. A plan that wrote a whole sentence anyway keeps it (the lint logs it) */
export function lossSentence(plan: SagaPlan): string {
  const lose = (plan.showdown.lose ?? '').trim().replace(/[.!]+$/, '').replace(/\s+for good$/i, '');
  if (!lose) return '';
  if (/\b(?:loses?|lost)\b|^if\b/i.test(lose)) return sentence(lose);
  return `${clientOf(plan).name} loses ${lose} for good.`;
}
export interface Hurt { name: string; how: 'lightly' | 'badly' | 'gravely' }
export interface ReportCall { payload: Record<string, unknown>; flags: string[]; vars: Record<string, number> }
export function reportPayload(a: {
  plan: SagaPlan; e: Episode; card: string; party: Card[]; decides: string; outcome: Outcome; finale: boolean;
  hurt: Hurt[]; cost?: Cost; option?: { way: Way; label: string }; fate?: string; arm: Arm; k: Knowing; gravity: string; direction?: string;
  /** the saga's record BEFORE this job (R2): what was learned and what is held */
  state: SagaState;
}): ReportCall {
  const { plan, e, arm, k } = a;
  const failedJob = a.outcome === 'failure' && !a.finale;
  const result = failedJob ? undefined : a.finale ? `${a.fate} ${a.outcome === 'failure' ? lossSentence(plan) : e.settles}` : e.win;
  // a won middle job brings its gain home and its learn to light (R2, S1/S2); a failed one neither
  const won = !a.finale && !failedJob;
  // people (R1, C6): only those who act in THIS job — whoever the job and the trouble refer to (the
  // trouble's side, the one the job is about), whoever the result refers to, and the one the finale
  // decides about; never a soldier sent. Everyone the card or the plan's people list held turned every
  // report into a roll-call ("X stood caught between the sides", "Y watched and begged them on")
  const sent = new Set(a.party.map(s => s.name));
  const refs = `${e.job} ${e.trouble.who} ${e.trouble.carry} ${e.trouble.will} ${result ?? ''}${won ? ` ${e.gain ?? ''} ${e.learn ?? ''}` : ''}`;
  const ids = [...new Set([...(a.finale ? [choiceTarget(plan).id] : []), ...plan.cast.filter(p => mentions(refs, p)).map(p => p.id)])];
  const flags = ['saga'];
  // a personal saga's own soldier is marked in the words the summary rule uses, so the summary may name
  // them (R1 verify 2): "name no soldier" made it drop the one the story is about, or break the rule
  const own = plan.cast.find(p => p.seat === 'soldier');
  const ownSent = !!own && a.party.some(s => s.id === own.id);
  if (ownSent) flags.push('personal');
  const payload: Record<string, unknown> = { card: a.card, job: e.job, soldiers: a.party.map(s => ({ name: s.name, is: `${soldierIs(s)}${ownSent && s.id === own!.id ? ', whose past this story is' : ''}` })) };
  if (a.outcome !== 'failure') { payload.decides = a.decides; flags.push('decides') }
  // a part that points at the company's soldier names them: a report meets people as a list, often
  // beside two soldiers, so "knows the soldier's past" had no referent
  // (R2, S4) the part only for someone in this job: one the result or the learn merely mentions keeps name and label
  const here = inJob(plan, e, a.finale);
  const people = ids.map(id => plan.cast.find(p => p.id === id)).filter((p): p is CastEntry => !!p && !sent.has(p.name))
    .map(p => ({ ...reportEntry(p, k), ...(here.includes(p.id) ? { part: partIn(p, plan, arm) } : {}) }));
  // a job fought against nameless thugs has nobody else in it: no list, and no line explaining one
  if (people.length) { payload.people = people; flags.push('people') }
  // a failed job's report has its outcome in the prompt itself, so the key would be spare
  if (!failedJob) payload.outcome = a.outcome;
  if (result !== undefined) { payload.result = result; flags.push('result') }
  if (a.option) { payload.plan = a.option.label; flags.push('option') }
  if (a.hurt.length) { payload.hurt = a.hurt; flags.push('hurt') }
  // a partial is "done, at a price": with no cost dealt the wound IS the price, said so (left unsaid, the
  // writer invented a price — a burned barn, a lost ally — that nothing else knows)
  if (a.outcome === 'partial' && !a.cost && a.hurt.length) flags.push('hurtprice');
  if (a.cost) { payload.cost = a.cost; flags.push('cost') }
  if (won && e.gain) { payload.brought = [e.gain]; flags.push('brought') }
  // this win's piece is `clue` and the earlier ones `known`: `learn` beside `learned` differed by one suffix,
  // and the new clue and the old ones were easy to swap
  if (won && e.learn) { payload.clue = e.learn; flags.push('clue') }
  // what earlier wins banked (R2), each with a stated role (a field with none was used anyway: old clues staged
  // as fresh finds, held allies dragged into a job told to fail): `known` is never shown as new; `have` stays
  // the company's, brought in only as the card does — at the finale with how each helps, used in the chosen plan.
  // The finale's known is the same field, so the truth is tied to what was learned only when something was
  if (a.state.learned.length) { payload.known = a.state.learned; flags.push('known') }
  const have = haveOf(plan, a.state, a.finale);
  if (have.length) { payload.have = have; flags.push('have', ...(a.finale ? ['edge'] : [])) }
  // the answer travels with the question it answers; the report returns it as its own `truth`, printed after
  // `after` — the moment it comes out, shown, from what is known (R2, S1: a restated plan sentence read as
  // tacked on in 21 of 24). The plan's answer goes in as `secret`: an input named `truth` beside the output
  // `truth` invited pasting it as the output, word for word
  if (a.finale) { payload.answer = { question: plan.question, secret: plan.answer }; flags.push('answer') }
  if (a.direction) { payload.direction = a.direction; flags.push('direction') }
  flags.push(...(failedJob ? ['failure', 'stopped'] : ['moved']));
  // `after`'s room grows with what it must show beyond the deciding moment (each wound, the cost, the gain, the
  // clue): the shortest setting met the fullest payloads, and a required show was dropped. The finale is the longest already
  const shows = a.hurt.length + (a.cost ? 1 : 0) + (payload.brought ? 1 : 0) + (payload.clue ? 1 : 0);
  const [B, A0] = a.finale || a.gravity.startsWith('a grave') ? [60, 140] : a.gravity.startsWith('a serious') ? [40, 90] : [22, 45];
  return { payload, flags, vars: { B, A: a.finale ? A0 : Math.min(140, A0 + 15 * shows) } };
}

// ─── outcomes, dice, injuries, fate (§2.6, §5.0 paths) ──────────────────────────────────────────

export const outcomeFor = (path: LabPath, a: { isFinale: boolean; job: number; tryOnJob: number; attempt: number }): Outcome => labOutcome(path, a);

/** a ⚄ line that agrees with the forced outcome, and who rolled best and worst */
export function rollDice(rng: Rng, party: Card[], outcome: Outcome): { line: string; decides: string; lowest: string } {
  const coins = party.map(() => 2 + rng.int(3));
  const C = coins.reduce((s, c) => s + c, 0);
  const bar = Math.max(2.5, Math.round(C * rng.float(0.45, 0.65) * 10) / 10);
  const need = (x: number) => Math.ceil(x - 1e-9);
  const s = need(bar), p = need(0.6 * bar);
  const [lo, hi] = outcome === 'success' ? [s, C] : outcome === 'partial' ? [p, s - 1] : [0, p - 1];
  const H = lo + rng.int(Math.max(1, hi - lo + 1));
  const slots = coins.flatMap((c, i) => Array.from({ length: c }, () => i));
  rng.shuffle(slots);
  const heads = party.map(() => 0);
  for (const i of slots.slice(0, H)) heads[i]!++;
  const best = heads.indexOf(Math.max(...heads)), worst = heads.lastIndexOf(Math.min(...heads));
  const line = `⚄ [${outcome.toUpperCase()}] · rolled ${H} heads of ${C} coins vs bar ${bar} (partial from ${Math.round(0.6 * bar * 10) / 10})`;
  return { line, decides: party[best]!.name, lowest: party[worst]!.name };
}

/** a partial's price: paid on top of a met goal, never the goal missed ("left unfinished" contradicted
 *  `result`). Atoms the writer realises, never a finished clause (an authored one, "a long, costly delay", was
 *  copied word for word into every saga): the engine picks what is lost and how; `whose` names who pays it
 *  ("someone there turned against the company" was pinned on a soldier) */
export interface Cost { what: string; how: string; whose?: string }
const COSTS: Record<string, (party: Card[], lowest: string) => Cost> = {
  // lost or broken: the engine's pick, off the job's own soldiers so the play rng's stream is unchanged
  gear: (party, lowest) => ({ what: 'gear', how: hashStr(party.map(p => p.name).join()) % 2 ? 'broken' : 'lost', whose: lowest }),
  time: () => ({ what: 'time', how: 'lost', whose: 'the company' }),
  goodwill: () => ({ what: 'goodwill', how: 'lost', whose: 'the locals' }),
  noise: () => ({ what: 'secrecy', how: 'lost', whose: 'the company' }),
};
/** §2.6 injuries, rolled after the outcome (a success can still wound) + the partial's cost */
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

/** the fate fact that drives both the button ending and the finale's `result` (§2.6). On a personal
 *  saga it names what became of the one in the soldier's way (`target`), as the finale card's choice
 *  put it: "X's old matter is settled" was echoed as jargon and left that person's end unsaid */
export function fateSentence(way: Way, outcome: Outcome, focal: CastEntry, target?: CastEntry): string {
  const t = target?.name ?? 'the one in the way';
  if (outcome === 'failure') return focal.seat === 'soldier' ? `${t} still stands in ${focal.name}'s way.` : `${focal.name} slips out of the company's reach, for now.`;
  return {
    recruit: `${focal.name} joins the company.`, captive: `${focal.name} is taken to the fort's cells.`,
    gold: helped(focal) ? `${focal.name} shares ${PRONOUN[focal.sex].pos} treasure with the company and goes ${PRONOUN[focal.sex].pos} way.` : `The company takes ${focal.name}'s treasure, and ${PRONOUN[focal.sex].sub} goes free.`,
    // no "and <soldier> stays with the company" (R1 verify 2): a mechanical default with no reason in the
    // data, copied flat ("Jervaise stayed with the company.") or explained with an invented quarrel
    talk: `${t} is talked round.`, fight: `${t} is beaten in a fight.`, sneak: `The company slips past ${t} unseen.`,
  }[way];
}
export const buttonLine = (o: { way: Way; label: string }, i: number, chosen: boolean, helpedFocal = false) =>
  `${chosen ? '▶' : ' '} [g${i}] ${o.label} → ${o.way === 'gold' && helpedFocal ? 'coin; goes their way' : WAY_ENDING[o.way]} · ${WAY_ATTR[o.way]}`;

/** the soldiers sent: two on a job, three on a showdown; a personal saga's soldier always goes (§2.6) */
/** A soldier sent who shares a surname with someone in the story (two Greyfells on a Greyfell's family
 *  wrong) reads as kin no data supports, so they sit the job out. Filtered after the shuffle, so the rng
 *  runs as before and only a colliding soldier is swapped for the next one (falls back if too few). */
export function pickParty(rng: Rng, w: World, finale: boolean): Card[] {
  const size = finale ? 3 : 2;
  const pool = rng.shuffle(w.roster.filter(c => c.id !== w.focal.id));
  const surnames = new Set(w.cast.map(p => surnameOf(p.name)).filter((x): x is string => !!x));
  const clear = pool.filter(c => !surnames.has(surnameOf(c.name) ?? ''));
  const from = clear.length >= size - (w.fx.personal ? 1 : 0) ? clear : pool;
  return w.fx.personal ? [w.focal, ...from.slice(0, size - 1)] : from.slice(0, size);
}
const surnameOf = (name: string) => { const parts = name.trim().split(/\s+/); return parts.length > 1 && parts[parts.length - 1]!.length > 2 ? parts[parts.length - 1] : undefined };

// ─── the mock writer: the floor (§4.4) ──────────────────────────────────────────────────────────
// Deterministic templates with every contract honoured: pitch = client + first job + trouble +
// stake; card = latest + job + trouble; report by outcome and `decides`; summary = job + outcome.

/** a job line and its win per type, naming whom it is about ("Chase down the one who ran" named nobody).
 *  Job, win, gain and edge of one type are about ONE thing, and never a cast seat: a target taken from the
 *  `other` seat chased "the miller" and brought home "the slaver's runner", and on the lean cast (no other
 *  seat) chased, freed or escorted the person the ending decides */
type JobText = (place: string, opp: string) => string;
const TYPE_JOB: Record<JobType, JobText> = {
  fight: (p, o) => `Drive ${o}'s men out of ${p}.`, guard: (p, o) => `Hold ${p} against ${o}'s men.`,
  catch: (p, o) => `Chase down ${o}'s runner, who fled toward ${p}.`, hunt: (p, o) => `Track the beast ${o} keeps near ${p}.`,
  sneak: (p, o) => `Get into ${p} unseen and take ${o}'s ledger.`, free: (p, o) => `Break the prisoner ${o} keeps out of ${p}.`,
  find: (p, o) => `Find ${o}'s hiding place near ${p}.`, talk: p => `Win the folk of ${p} over.`,
  escort: (p, o) => `Bring a guide who knows ${o}'s ground safely through ${p}.`,
};
const TYPE_WIN: Record<JobType, JobText> = {
  fight: (p, o) => `${o}'s men are driven out of ${p}.`, guard: p => `The attack on ${p} is beaten back.`,
  catch: (p, o) => `${o}'s runner is caught before reaching ${p}.`, hunt: p => `The beast near ${p} is trapped.`,
  sneak: (p, o) => `${o}'s ledger is taken from ${p} unseen.`, free: p => `The prisoner is freed from ${p}.`,
  find: (p, o) => `${o}'s hiding place near ${p} is found.`, talk: p => `The folk of ${p} take the company's side.`,
  escort: p => `The guide comes safely through ${p}.`,
};
const TYPE_WILL: Record<JobType, string> = {
  fight: 'fight for every yard', guard: 'attack at dusk', catch: 'cover the escape', hunt: 'turn and charge',
  sneak: 'keep a close watch', free: 'guard the door', find: 'cover their tracks', talk: 'shout the company down',
  escort: 'lie in wait on the road',
};
/** what a won job leaves the company holding, and how that helps at the showdown (R2, S2): the floor's,
 *  per type, never the person the ending decides (a catch takes one of their runners, not them) */
const TYPE_GAIN: Record<JobType, JobText> = {
  fight: (p, o) => `one of ${o}'s men, taken at ${p}`, guard: p => `the gate of ${p}`,
  catch: (p, o) => `${o}'s runner, caught near ${p}`, hunt: (p, o) => `${o}'s beast, caged at ${p}`,
  sneak: (p, o) => `${o}'s ledger from ${p}`, free: p => `the prisoner freed from ${p}`,
  find: (_p, o) => `a map to ${o}'s hiding place`, talk: p => `the folk of ${p} as allies`,
  escort: p => `the guide brought safe through ${p}`,
};
// each fits every way in ending, as the plan's must (a way-bound edge, "names the unguarded door", forced a
// fight into a parley)
const TYPE_EDGE: Record<JobType, JobText> = {
  fight: (_p, o) => `the captured man tells how few guards ${o} has left`, guard: () => 'the gate gives the company a safe place to fall back',
  catch: (_p, o) => `the runner tells where ${o} will be waiting`, hunt: (_p, o) => `without the beast, ${o} has nothing to set on the company`,
  sneak: (_p, o) => `the ledger shames ${o} before the hired men`, free: () => 'the freed prisoner knows the way in',
  find: () => 'the map shows every way in and out', talk: (_p, o) => `the folk keep ${o}'s help away`,
  escort: () => 'the guide knows the ground',
};
/** the floor's answers, each with the question it answers (picked apart, a question about a place met an
 *  answer about a debt), saying who and why about the cast alone (no new person: "a harder man" was an
 *  off-cast mastermind no job could include), with the pieces the jobs uncover toward it (R2, S1). A
 *  personal saga's answer is about the soldier's old wrong (the shared set had the soldier "silenced") */
type AnswerText = (o: string, c: string) => string;
interface MockAnswer { question: AnswerText; answer: AnswerText; pieces: AnswerText[] }
const MOCK_ANSWERS: MockAnswer[] = [
  { question: o => `Nobody knows why ${o} stands in the way.`,
    answer: (o, c) => `${o} is ${c}'s own kin, cut out of an old will, and wants the share the will denied them.`,
    pieces: [(o, c) => `${o} carries a letter in the hand of ${c}'s family.`, () => 'An old will names a child nobody speaks of.', (o, c) => `${o} was born in ${c}'s house.`, (o) => `The will was sealed the year ${o} left.`] },
  { question: (o, c) => `Nobody knows what ${o} wants from ${c}.`,
    answer: (o, c) => `${c}'s family owes ${o} an old debt, and ${o} means ${c}'s ruin to be the payment.`,
    pieces: [(o, c) => `${o} keeps a debt-note sealed with the mark of ${c}'s family.`, (o) => `${o} was never paid what was owed.`, (o, c) => `${o} asks after ${c} by name.`, (_o, c) => `The debt is older than ${c}.`] },
  { question: o => `Nobody knows what ${o} is hiding.`,
    answer: (o, c) => `${o} hides an old crime, and ${c} is the only one who saw it, so ${c} must be silenced.`,
    pieces: [(o) => `${o} keeps asking who still remembers an old fire.`, (o) => `A burned house stands where ${o} once lived.`, (_o, c) => `${c} once spoke at a hearing about that fire.`, () => 'The fire had one witness, never named aloud.'] },
];
const MOCK_PERSONAL: MockAnswer = {
  question: (o, c) => `Nobody knows why ${o} keeps ${c}'s old wrong alive.`,
  answer: (o, c) => `${o} has lived off ${c}'s old wrong for years, and fears losing it all if ${c} sets it right.`,
  pieces: [(o, c) => `${o} knew ${c} long before the company did.`, (o) => `${o} grew rich the year the old wrong was done.`, (o, c) => `${o} has told everyone that ${c} is dead.`, (o) => `${o} still keeps a paper from those days.`],
};
const cap = (s: string) => s ? s[0]!.toUpperCase() + s.slice(1) : s;
const sentence = (s: string) => s.trim() ? cap(s.trim()).replace(/([^.!?])$/, '$1.') : '';
const firstSentence = (s: string) => s.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s.trim();
const the = theLabel;

export function mockPlan(ctx: PlanCtx): Record<string, unknown> {
  const { w, arm } = ctx;
  const rng = new Rng(hashStr(`mockplan:${w.fx.id}:${ctx.draw.n}:${armKey(arm)}`));
  // the lean arm's asker has no trade and no traits: the floor cannot coin one from the seed, so "a local woman"
  const label = (p: Person) => p.seat === 'soldier' ? an(`${RACE_WORD[p.race] ?? p.race} soldier`)
    : an(p.trade ?? (p.traits ? p.traits.split(', ').slice(0, 2).join(' ') : `local ${manWoman(p.sex)}`));
  const opp = w.cast.find(p => p.seat === 'opponent')!, client = w.cast.find(p => p.seat === 'client' || p.seat === 'soldier')!;
  const types: JobType[] = arm.structure === 'S' ? dealtTypes(w) : rng.shuffle([...JOB_TYPES]).slice(0, w.fx.N - 1);
  const o = the(label(opp));
  const oHe = PRONOUN[opp.sex];
  const last = w.places[w.places.length - 1]!;
  const cName = client.known ? client.name : cap(the(label(client)));
  const cHe = PRONOUN[client.sex];
  const loss = stakeLine(w.stake)[2](cHe);
  // why (R1, C1): what the job does for the one who asked, from the stake's loss ("her home")
  const why = (place: string) => `Every blow against ${o} at ${place} keeps ${loss} safe for ${cName}.`;
  const oNoun = cap(headNoun(label(opp)));
  const title = rng.pick([`The ${oNoun} of ${w.places[0]}`, `Trouble at ${w.places[0]}`, `${w.places[0]} Under Threat`, `Blood at ${last}`]);
  const ans = w.fx.personal ? MOCK_PERSONAL : rng.pick(MOCK_ANSWERS), cRef = client.known ? client.name : the(label(client));
  const episodes = types.map((ty, i) => {
    const place = w.places[i % w.places.length]!;
    return {
      n: i + 1, ...(arm.structure === 'S' ? {} : { type: ty }), title: `${cap(ty)} at ${place}`, job: TYPE_JOB[ty](place, o),
      people: w.cast.filter(p => p.seat !== 'client' && p.seat !== 'soldier').map(p => p.id),
      trouble: ty === 'hunt' ? { who: `the beast ${o} keeps`, carry: 'teeth and claws', will: TYPE_WILL[ty] } : { who: `${o}'s men`, carry: 'clubs and knives', will: TYPE_WILL[ty] },
      win: cap(TYPE_WIN[ty](place, o)), gain: TYPE_GAIN[ty](place, o), learn: cap(ans.pieces[i % ans.pieces.length]!(o, cRef)), why: why(place),
    };
  });
  return {
    // the question is said as what nobody knows (card 1 prints it); the answer says who and why
    title, question: cap(ans.question(o, cRef)), answer: cap(ans.answer(o, cRef)),
    cast: w.cast.filter(p => p.seat !== 'soldier').map(p => ({ id: p.id, label: label(p) })),
    ...(w.fx.personal ? { soldier: { want: cannedWant(client, w.stake), past: 'an old wrong left behind' } } : { asker: { want: cannedWant(client, w.stake) } }),
    episodes,
    showdown: {
      title: `The Reckoning at ${last}`, job: `Face ${o} at ${last}.`, people: w.cast.filter(p => p.seat !== 'client').map(p => p.id),
      trouble: { who: `${o} and ${oHe.pos} last men`, carry: 'swords', will: 'hold their ground' },
      // fits every way in ending (talked round, beaten, slipped past; joins, jailed, pays)
      why: `Only once ${o} no longer stands in the way at ${last} is ${loss} safe for ${cName}.`,
      edge: types.map((ty, i) => TYPE_EDGE[ty](w.places[i % w.places.length]!, o)),
      settles: w.fx.personal ? `${cName} no longer has to run from ${cHe.pos} past.` : stakeLine(w.stake)[1](cName, cHe.pos),
      lose: loss,
    },
    options: waysOf(w).map(way => ({ way, label: cannedOption(way, w.cast.map(p => ({ ...p, label: label(p), want: '' })), arm) })),
  };
}

/** a person as the mock writes them: a new one by name and label, else their name, else the label */
function mockRef(who: string, names: Entry[]): string {
  const e = names.find(n => n.name === who || n.label === who);
  if (e?.name) return e.intro && e.label ? `${String(e.name)}, ${String(e.label)},` : String(e.name);
  return the(who);
}

export function mockCard(payload: Record<string, unknown>, flags: string[]): { card: string } {
  const t = payload.trouble as Trouble;
  const job = String(payload.job);
  const names = (payload.names ?? []) as Entry[];
  const troubleLine = `${cap(t.who)} with ${t.carry} will ${t.will}.`;
  const why = sentence(String(payload.why ?? ''));
  if (flags.includes('first')) {
    const p = payload.premise as Record<string, string>;
    const who = cap(mockRef(p.who!, names));
    const sub = names.find(n => n.name === p.who)?.sex === 'woman' ? 'she' : 'he';
    const unknown = p.unknown ? ` ${sentence(p.unknown)}` : '';
    return { card: `${who} ${p.past ? `has a past: ${p.past}. ${cap(sub)} wants ${p.wants}` : `asks for your help ${p.wants}`}.${p.loses ? ` If nobody acts, ${sub} loses ${p.loses}.` : ''} ${job} ${why} ${troubleLine}${unknown}` };
  }
  // (R2) a re-posed job says so; the mystery with what was learned; what is held, at the finale how it helps
  const opener = payload.retry !== undefined ? `You try this job again. Last time: ${sentence(String(payload.retry))}` : String(payload.latest);
  const m = payload.mystery as { question: string; learned: string[] } | undefined;
  const mystery = m ? ` ${sentence(m.question)} So far you know this: ${m.learned.map(sentence).join(' ')}` : '';
  const held = payload.have as (string | { holds: string; helps: string })[] | undefined;
  const have = !held ? '' : flags.includes('edge') ? ` ${held.map(h => typeof h === 'string' ? '' : `${cap(h.holds)} will help: ${sentence(h.helps)}`).join(' ')}`
    : ` You hold ${held.map(String).join(' and ')}.`;
  const last = flags.includes('lastchance') ? ' This is your last chance.' : '';
  const fate = !flags.includes('finale') || payload.fate === undefined ? ''
    : ` ${flags.includes('personal') ? `This settles your soldier's matter with ${mockRef(String(payload.fate), names)}.` : `This decides the fate of ${mockRef(String(payload.fate), names)}.`}${payload.lose ? ` If it fails, ${(payload.lose as { who: string; loses: string }).who} loses ${(payload.lose as { who: string; loses: string }).loses} for good.` : ''}`;
  return { card: `${opener}${mystery} ${job} ${why}${have} ${troubleLine}${last}${fate}` };
}

export function mockReport(payload: Record<string, unknown>, flags: string[]): { before: string; after: string; summary: string; truth?: string } {
  const soldiers = (payload.soldiers as { name: string }[]).map(s => s.name);
  const who = soldiers.length > 1 ? `${soldiers.slice(0, -1).join(', ')} and ${soldiers[soldiers.length - 1]}` : soldiers[0]!;
  const job = String(payload.job).replace(/\.$/, '');
  const lc = job[0]!.toLowerCase() + job.slice(1);
  const hurt = ((payload.hurt as Hurt[] | undefined) ?? []).map(h => ` ${h.name} was hurt ${h.how}.`).join('');
  const cost = payload.cost ? ` ${sentence(costText(payload.cost as Cost))}` : '';
  const ans = payload.answer as { secret: string } | undefined;
  const known = payload.known as string[] | undefined;
  // the floor honours `intro` as the prompt asks (label and name), so the name counts as read: a floor that
  // never named anyone left every later text meeting the same person as a stranger
  const met = ((payload.people ?? []) as Entry[]).filter(p => p.intro && p.name).map(p => ` ${String(p.name)}, ${String(p.label)}, was there.`).join('');
  const before = `${who} set out to ${lc}.${met}`;
  const result = String(payload.result ?? '');
  // (R2) a won job's gain comes home and its learn is found; at the finale each held gain is used
  const brought = ((payload.brought as string[] | undefined) ?? []).map(b => ` They came away with ${b}.`).join('');
  const learn = payload.clue ? ` They found this out: ${sentence(String(payload.clue))}` : '';
  const used = flags.includes('edge') ? ((payload.have as { holds: string; helps: string }[] | undefined) ?? []).map(h => ` ${cap(h.holds)} helped: ${sentence(h.helps)}`).join('') : '';
  const after = flags.includes('failure') ? `They were beaten back, and the job was not done.${hurt}`
    : `${String(payload.decides ?? who)} ${payload.outcome === 'success' ? 'carried it' : payload.outcome === 'partial' ? 'carried it, at a price' : 'could not carry it'}.${used} ${sentence(result)}${brought}${learn}${hurt}${cost}`.trim();
  // the summary says what changed, from the result (a "The company managed to <job>." template read stiff and got copied)
  const changed = sentence(firstSentence(result));
  const summary = flags.includes('stopped') || !changed ? `The company tried to ${lc} and was driven back.`
    : payload.outcome === 'partial' ? changed.replace(/[.!?]$/, ', but at a price.') : changed;
  // the truth is its own line (R1, C4), never inside after; (R2) the moment it comes out, tied to what was learned
  const tied = known?.length ? `What they had found came together: ${sentence(known[known.length - 1]!)} ` : '';
  return { before, after, summary, ...(ans ? { truth: `${tied}Then the truth came out. ${sentence(ans.secret)}` } : {}) };
}

/** the floor's words for a cost's atoms (the model realises them its own way) */
function costText(c: Cost): string {
  if (c.what === 'gear') return `${c.whose ?? 'one of them'}'s gear was ${c.how}`;
  return { time: 'the job took far longer than it should', goodwill: `${c.whose ?? 'the locals'} turned against the company`, secrecy: 'word of the fight spread' }[c.what] ?? `${c.what} was ${c.how}`;
}

export const zCardOut = z.object({ card: z.string().min(1) }).passthrough();
export const zReportOut = z.object({ before: z.string().min(1), after: z.string().min(1), truth: z.string().optional(), summary: z.string().optional() }).passthrough();
