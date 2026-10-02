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
export type Card1Arm = 'pitch' | 'first';
export interface Arm { structure: Structure; names: NamesArm; card1: Card1Arm }
export const armKey = (a: Arm) => `${a.structure}_${a.names}_${a.card1}`;

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
/** a soldier as the report meets them: "a human man, hot-headed, a brawler" (§2.9.3) */
export function soldierIs(c: Card): string {
  const w = plainWords(c, 1)[0];
  const skill = topSkill(c);
  return [an(`${RACE_WORD[raceOf(c)] ?? raceOf(c)} ${manWoman(sexOf(c))}`), w, skill ? SKILL_NOUN[skill] : undefined].filter(Boolean).join(', ');
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
 *  worlds in a FIXED order: card ids come from a process-wide counter. */
export function buildWorld(fx: ProbeFixture, base: LabFixture): World {
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
    const f = base.focal;   // the lab's labFocal, verbatim: the same face in every run
    focal = materializeReward(new Rng(f.seed >>> 0), { kind: 'captive', value: f.value ?? 120, required: f.tags?.map(concept => ({ concept })) },
      level, region, { presetName: f.name, race: f.race, gender: f.sex, maxSkills: 2 })[0]!;
  }
  const roster = game.roster();
  const rng = new Rng(hashStr(`cast:${fx.id}:${base.seed}`));
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
      trade: tradeOf(focal), traits: traitsOf(focal), known: fx.personal,
    };
    const r = fx.returning;
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
  if (arm.card1 === 'pitch') flags.push('pitch');
  if (arm.structure !== 'L') flags.push('shape');
  if (arm.structure === 'S') flags.push('episodes'); else flags.push('types');
  if (w.fx.personal) flags.push('personal');
  if (w.cast.some(p => p.memory)) flags.push('memory');
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
  payload.stake = w.stake;
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
const zEp = z.object({
  n: z.any().optional(), type: zs, title: zs, job: zs, people: z.array(z.string()).optional().catch(undefined),
  trouble: zTrouble, win: zs, opens: zs, settles: zs, lose: zs,
}).passthrough();
export const zPlanOut = z.object({
  title: zs, question: zs, answer: zs, pitch: zs,
  cast: z.array(z.object({ id: zs, label: zs, want: zs, past: zs }).passthrough()).optional().catch(undefined),
  episodes: z.array(zEp).optional().catch(undefined),
  showdown: zEp.optional().catch(undefined),
  options: z.array(z.object({ way: zs, label: zs }).passthrough()).optional().catch(undefined),
}).passthrough();

export interface Trouble { who: string; carry: string; will: string }
export interface Episode { n: number; type: EpisodeType; title: string; job: string; people: string[]; trouble: Trouble; win?: string; opens?: string; settles?: string; lose?: string }
/** past: a personal saga's soldier only, the old wrong in a few words (the card retells it; the seed
 *  sentence itself was pasted onto card 1) */
export interface CastEntry extends Person { label: string; want: string; past?: string }
export interface SagaPlan { title: string; question: string; answer: string; pitch?: string; cast: CastEntry[]; episodes: Episode[]; showdown: Episode; options: { way: Way; label: string }[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameParts = (p: Person) => p.name.split(/\s+/).filter(x => x.length > 2);

/** §2.7: the repairs are mechanical and silent; a hard defect earns one plain re-draw */
export function validatePlan(raw: unknown, ctx: PlanCtx): { plan: SagaPlan | null; repairs: string[]; defects: string[] } {
  const { w, arm } = ctx;
  const repairs: string[] = [], defects: string[] = [];
  const parsed = zPlanOut.safeParse(raw);
  if (!parsed.success) return { plan: null, repairs, defects: ['not a plan object'] };
  const o = parsed.data;
  const ids = new Set(w.cast.map(p => p.id));
  const need = (v: string | undefined, what: string) => { if (!v?.trim()) defects.push(`missing ${what}`); return v?.trim() ?? '' };
  // labels and wants; a name inside a label is stripped (a label is what a stranger sees)
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
    const past = p.seat === 'soldier' ? got?.past?.trim() || undefined : undefined;
    return { ...p, label, want: got?.want?.trim() || cannedWant(p, w.stake), ...(past ? { past } : {}) };
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
      win: need(e.win, `episode ${i + 1} win`), opens: e.opens?.trim() || undefined,
    };
  });
  const sd = o.showdown;
  if (!sd) defects.push('missing showdown');
  const showdown: Episode = {
    n: want + 1, type: 'showdown', title: need(sd?.title, 'showdown title'), job: need(sd?.job, 'showdown job'),
    people: people(sd?.people, 'showdown'), trouble: trouble(sd?.trouble, 'showdown'),
    settles: need(sd?.settles, 'settles'), lose: need(sd?.lose, 'lose'),
  };
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
  const pitch = arm.card1 === 'pitch' ? need(o.pitch, 'pitch') : undefined;
  const plan: SagaPlan = {
    title: need(o.title, 'title'), question: need(o.question, 'question'), answer: need(o.answer, 'answer'),
    pitch, cast, episodes, showdown, options,
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
  if (plan.pitch) plan.pitch = deId(plan.pitch, 'pitch');
  for (const c of plan.cast) { c.want = deId(c.want, `${c.id} want`); if (c.past) c.past = deId(c.past, `${c.id} past`, false) }
  for (const e of [...plan.episodes, plan.showdown]) {
    const at = `episode ${e.n}`;
    e.title = deId(e.title, at); e.job = deId(e.job, at);
    e.trouble = { who: deId(e.trouble.who, at, false), carry: deId(e.trouble.carry, at, false), will: deId(e.trouble.will, at, false) };
    for (const k of ['win', 'opens', 'settles', 'lose'] as const) if (e[k]) e[k] = deId(e[k]!, at);
  }
  for (const o of plan.options) o.label = deId(o.label, 'options');
  for (const c of plan.cast) c.label = c.label.trim();
  // an unmet name the model somehow wrote goes back to its label (labels arm only: it saw no such name)
  if (arm.names === 'labels') {
    const fix = (s: string) => { let t = s; for (const p of cast) if (!p.known) for (const part of nameParts(p)) t = t.replace(new RegExp(`\\b${esc(part)}\\b`, 'g'), () => { repairs.push(`unmet name ${part} → label`); return p.label }); return t };
    for (const e of [...plan.episodes, plan.showdown]) { e.job = fix(e.job); e.title = fix(e.title); e.trouble = { who: fix(e.trouble.who), carry: fix(e.trouble.carry), will: fix(e.trouble.will) }; if (e.win) e.win = fix(e.win); if (e.opens) e.opens = fix(e.opens) }
    if (plan.pitch) plan.pitch = fix(plan.pitch);
    for (const c of plan.cast) if (c.past) c.past = fix(c.past);
    if (plan.showdown.lose) plan.showdown.lose = fix(plan.showdown.lose);
  }
  return { plan, repairs, defects };
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
  'a life': [() => 'to save a life', who => `The life ${who} feared for is saved.`, he => `the life ${he.sub} feared for`],
  freedom: [() => 'to see the one held set free', who => `The one held goes free, as ${who} wanted.`, he => `the one ${he.sub} wanted freed`],
  'someone loved': [() => 'to get someone dear back safe', who => `${who} gets someone dear back safe.`, he => `someone ${he.sub} holds dear`],
  'a good name': [pos => `to clear ${pos} name`, (who, pos) => `${who}'s name is cleared.`, he => `${he.pos} good name`],
  'a promise': [pos => `to keep ${pos} promise`, (who, pos) => `${who} keeps ${pos} promise.`, he => `the promise ${he.sub} made`],
};
const stakeLine = (stake: string) => STAKE_WANT[stake] ?? STAKE_WANT['a promise']!;
function cannedWant(p: Person, stake: string): string {
  if (p.seat === 'client' || p.seat === 'soldier') return stakeLine(stake)[0](PRONOUN[p.sex].pos);
  return p.seat === 'opponent' ? `to keep what ${PRONOUN[p.sex].sub} has taken` : 'to come through it unharmed';
}

const STOP = new Set('the a an of to in and that was is who his her their it for with on at by from as has had have been be not but this they them he she its only than so what when where which will would'.split(' '));
const stem = (x: string) => x.slice(0, 5);
const contentWords = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x));
/** a dealt line adds something only with two content words the other lacks ("to keep his promise" /
 *  "his promise is broken" repeats; a line that only repeats gets pasted as its own sentence) */
const adds = (line: string, to: string, min = 2) => { const have = new Set(contentWords(to).map(stem)); return contentWords(line).filter(x => !have.has(stem(x))).length >= min };

/** §2.7 log-only telemetry: nothing here re-rolls anything */
export function planLint(plan: SagaPlan, w: World): string[] {
  const out: string[] = [];
  if (plan.pitch && plan.pitch.split(/\s+/).length > 80) out.push(`pitch ${plan.pitch.split(/\s+/).length} words`);
  const known = new Set([...w.cast.flatMap(p => nameParts(p)), ...w.places, ...w.land.split(/\W+/)]);
  const skip = new Set(plan.cast.flatMap(p => [p.trade ?? '', p.traits ?? '', p.label].join(' ').split(/\W+/)));
  const fields = [plan.question, plan.pitch ?? '', ...plan.episodes.flatMap(e => [e.job, e.trouble.who, e.trouble.carry, e.trouble.will, e.win ?? '', e.opens ?? '']), plan.showdown.job, plan.showdown.settles ?? '', plan.showdown.lose ?? ''];
  // a capital that does not open a sentence and names nobody and nowhere the engine dealt
  const stray = [...new Set(fields.flatMap(f => f.split(/[.!?:;"]\s*/).flatMap(s => s.trim().split(/\s+/).slice(1)))
    .map(t => t.replace(/[^A-Za-z'-]/g, '').replace(/'s$/, '')).filter(t => /^[A-Z][a-z]{2,}/.test(t) && !known.has(t) && !skip.has(t)))];
  if (stray.length) out.push(`stray capitalised: ${stray.join(', ')}`);
  const plainSet = new Set([...w.fx.seed ? w.fx.seed.toLowerCase().split(/\W+/) : [], ...plan.cast.flatMap(p => p.label.toLowerCase().split(/\W+/)), ...w.places.map(x => x.toLowerCase())]);
  const plainStems = new Set([...plainSet].map(stem));
  const answerWords = (plan.answer.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x) && !plainStems.has(stem(x)));
  // lose reaches card 1 (the first arm's premise) and a last-chance card, so it counts as early
  const early = [plan.pitch ?? '', plan.showdown.lose ?? '', ...plan.episodes.map(e => `${e.title} ${e.job} ${e.win ?? ''} ${e.opens ?? ''}`)].join(' ').toLowerCase();
  const leak = answerWords.filter(x => new RegExp(`\\b${x}\\b`).test(early));
  if (leak.length) out.push(`answer words before the finale: ${leak.join(', ')}`);
  if (plan.episodes[0] && !plan.episodes[0].people.includes(w.focal.id)) out.push('the person in ending is not among job 1\'s people');
  // fields the plan is asked to keep to a few words: a finished clause here was pasted whole into cards
  const long = (v: string | undefined, max: number) => (v ?? '').split(/\s+/).filter(Boolean).length > max;
  // (`will` is a verb phrase, so it gets a little more room before it counts)
  for (const e of [...plan.episodes, plan.showdown]) for (const f of ['who', 'carry', 'will'] as const) if (long(e.trouble[f], f === 'will' ? 8 : 6)) out.push(`episode ${e.n} trouble.${f} past a few words`);
  if (long(plan.showdown.lose, 8) || /\b(?:loses?|lost)\b|^if\b/i.test(plan.showdown.lose ?? '')) out.push('lose past a few words');
  for (const c of plan.cast) if (long(c.past, 8)) out.push(`${c.id} past past a few words`);
  if (/\bif\b/i.test(plan.showdown.settles ?? '')) out.push('settles says "if"');
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
/** what each way means for the one the finale decides about; a personal saga's ways are how it is settled */
const CHOICE_END: Record<Way, (pos: string, isHelped: boolean) => string> = {
  recruit: () => 'joins your company', captive: () => 'is held in your cells',
  gold: (pos, isHelped) => isHelped ? `shares ${pos} treasure with you and goes ${pos} way` : `gives up ${pos} treasure and goes free`,
  // a personal saga's options are how the one in the soldier's way is dealt with, said as what becomes
  // of them ("decides Jofstrom's fate by words or by force" answered the wrong question)
  talk: () => 'is talked round', fight: () => 'is beaten in a fight', sneak: () => 'is slipped past unseen',
};
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
  const premise = { who: displayName(client, arm, k), wants: client.want, ...(w.fx.personal ? { past: client.past ?? 'an old wrong left behind' } : {}), ...(adds(loss, client.want, 1) ? { loses: loss } : {}) };
  const planText = `${e.job} ${JSON.stringify(e.trouble)} ${plan.question}`;
  const names = namesFor(plan, [client.id, ...e.people], planText, arm, k, [client.id]);
  const flags = ['first'];
  if (w.fx.personal) flags.push('personal');
  if (names.some(n => n.memory)) flags.push('memory');
  if (direction) flags.push('direction');
  return { payload: { premise, job: e.job, trouble: e.trouble, question: plan.question, names, ...(direction ? { direction } : {}) }, flags, vars: { MAX: 70 } };
}

export function laterCardPayload(plan: SagaPlan, e: Episode, latest: string, question: string | null, arm: Arm, k: Knowing, o: { finale: boolean; lastchance: boolean; direction?: string }): CardCall {
  const client = clientOf(plan), target = choiceTarget(plan);
  const always = [client.id, ...(o.finale ? [target.id] : [])];
  const planText = `${e.job} ${JSON.stringify(e.trouble)} ${o.finale ? '' : question ?? ''}`;
  const names = namesFor(plan, [...always, ...e.people], `${latest} ${planText}`, arm, k, always);
  const flags = [o.finale ? 'finale' : 'later'];
  // a personal saga's options are how the soldier's matter is settled with the one in the way, not a fate
  if (o.finale && client.seat === 'soldier') flags.push('personal');
  if (names.some(n => n.memory)) flags.push('memory');
  if (o.finale && o.lastchance) flags.push('lastchance');
  if (o.direction) flags.push('direction');
  // `helping` on every card: who the company acts for and what they want, so a job ties back to why
  // (a key named `for` read as the idiom "the one in for")
  const payload: Record<string, unknown> = { helping: { who: displayName(client, arm, k), wants: client.want }, latest, job: e.job, trouble: e.trouble };
  // the options as the engine's endings, the buttons' "→ ending" (the plan's whole option lines were
  // pasted one by one and ran the finale card 20–40 words past its cap)
  if (o.finale) payload.choice = { who: displayName(target, arm, k), options: plan.options.map(x => CHOICE_END[x.way](PRONOUN[target.sex].pos, helped(target))) };
  else payload.question = question ?? plan.question;
  // the last chance says what failing it costs: without it "last chance" was hollow and got pasted
  if (o.finale && o.lastchance && e.lose) payload.lose = e.lose;
  payload.names = names;
  if (o.direction) payload.direction = o.direction;
  return { payload, flags, vars: { MAX: o.finale ? 80 : 70 } };
}

/** §2.5 names filter: only the people the dealt text refers to (an unreferenced entry gave "Odo is an
 *  ally."), plus the ones the card must carry (the one it acts for, the choice on the finale). Anyone
 *  the dealt text names counts, in the job's people or not: `latest` named someone who was not, and the
 *  card printed a name it had no label or sex for */
function namesFor(plan: SagaPlan, ids: string[], dealt: string, arm: Arm, k: Knowing, always: string[]): Entry[] {
  const out: Entry[] = [];
  for (const id of [...new Set([...ids, ...plan.cast.map(p => p.id)])]) {
    const p = plan.cast.find(c => c.id === id);
    if (!p || (!always.includes(id) && !mentions(dealt, p))) continue;
    const entry = cardEntry(p, arm, k);
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
  hurt: Hurt[]; cost?: string; option?: { way: Way; label: string }; fate?: string; arm: Arm; k: Knowing; gravity: string; direction?: string;
}): ReportCall {
  const { plan, e, arm, k } = a;
  const failedJob = a.outcome === 'failure' && !a.finale;
  const result = failedJob ? undefined : a.finale ? `${a.fate} ${a.outcome === 'failure' ? lossSentence(plan) : e.settles}` : e.win;
  // people: the job's, the one the finale decides about, and anyone the card or the result refers to
  // (a client the card named but the list left out could not be named in the report); never a soldier sent
  const sent = new Set(a.party.map(s => s.name));
  const refs = `${a.card} ${result ?? ''}`;
  const ids = [...new Set([...e.people, ...(a.finale ? [choiceTarget(plan).id] : []), ...plan.cast.filter(p => mentions(refs, p)).map(p => p.id)])];
  const flags = ['saga'];
  const payload: Record<string, unknown> = { card: a.card, job: e.job, soldiers: a.party.map(s => ({ name: s.name, is: soldierIs(s) })) };
  if (a.outcome !== 'failure') { payload.decides = a.decides; flags.push('decides') }
  // a part that points at the company's soldier names them: a report meets people as a list, often
  // beside two soldiers, so "knows the soldier's past" had no referent
  const soldier = plan.cast.find(p => p.seat === 'soldier');
  const part = (p: CastEntry) => soldier ? partOf(p, arm).replace(/\bthe soldier\b/g, soldier.name) : partOf(p, arm);
  payload.people = ids.map(id => plan.cast.find(p => p.id === id)).filter((p): p is CastEntry => !!p && !sent.has(p.name))
    .map(p => ({ ...reportEntry(p, k), part: part(p) }));
  // a failed job's report has its outcome in the prompt itself, so the key would be spare
  if (!failedJob) payload.outcome = a.outcome;
  if (result !== undefined) { payload.result = result; flags.push('result') }
  if (a.option) { payload.plan = a.option.label; flags.push('option') }
  if (a.hurt.length) { payload.hurt = a.hurt; flags.push('hurt') }
  if (a.cost) { payload.cost = a.cost; flags.push('cost') }
  // the answer travels with the question it answers, so the report can stage it as the reveal
  if (a.finale) { payload.answer = { question: plan.question, truth: plan.answer }; flags.push('answer') }
  if (a.direction) { payload.direction = a.direction; flags.push('direction') }
  flags.push(...(failedJob ? ['failure', 'stopped'] : ['moved']));
  const [B, A] = a.finale || a.gravity.startsWith('a grave') ? [60, 140] : a.gravity.startsWith('a serious') ? [40, 90] : [22, 45];
  return { payload, flags, vars: { B, A } };
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
 *  `result`). Each names who pays it: "someone there turned against the company" was pinned on a soldier */
const COSTS: Record<string, string> = {
  gear: 'a piece of their gear lost or broken', time: 'a long, costly delay',
  goodwill: 'the locals turned against the company', noise: 'the fight drew eyes, and word of it spread',
};
/** §2.6 injuries, rolled after the outcome (a success can still wound) + the partial's cost */
export function rollHurt(rng: Rng, outcome: Outcome, party: Card[], lowest: string): { hurt: Hurt[]; cost?: string } {
  const band = (bands: [Hurt['how'], number][]) => rng.weighted(bands);
  if (outcome === 'failure') return { hurt: rng.chance(0.5) ? [{ name: lowest, how: band([['lightly', 70], ['badly', 25], ['gravely', 5]]) }] : [] };
  if (outcome === 'partial') {
    if (rng.chance(0.33)) return { hurt: [{ name: lowest, how: band([['lightly', 80], ['badly', 20]]) }] };
    const cost = COSTS[rng.pick(Object.keys(COSTS))]!;
    return { hurt: rng.chance(0.1) ? [{ name: lowest, how: 'lightly' }] : [], cost };
  }
  return { hurt: rng.chance(0.05) ? [{ name: rng.pick(party).name, how: 'lightly' }] : [] };
}

/** the fate fact that drives both the button ending and the finale's `result` (§2.6) */
export function fateSentence(way: Way, outcome: Outcome, focal: CastEntry): string {
  if (outcome === 'failure') return focal.seat === 'soldier' ? `${focal.name}'s old matter stays unsettled.` : `${focal.name} slips out of the company's reach, for now.`;
  return {
    recruit: `${focal.name} joins the company.`, captive: `${focal.name} is taken to the fort's cells.`,
    gold: helped(focal) ? `${focal.name} shares ${PRONOUN[focal.sex].pos} treasure with the company and goes ${PRONOUN[focal.sex].pos} way.` : `The company takes ${focal.name}'s treasure, and ${PRONOUN[focal.sex].sub} goes free.`,
    talk: `${focal.name}'s old matter is settled, and ${PRONOUN[focal.sex].sub} stays with the company.`,
    fight: `${focal.name}'s old matter is settled, and ${PRONOUN[focal.sex].sub} stays with the company.`,
    sneak: `${focal.name}'s old matter is settled, and ${PRONOUN[focal.sex].sub} stays with the company.`,
  }[way];
}
export const buttonLine = (o: { way: Way; label: string }, i: number, chosen: boolean, helpedFocal = false) =>
  `${chosen ? '▶' : ' '} [g${i}] ${o.label} → ${o.way === 'gold' && helpedFocal ? 'coin; goes their way' : WAY_ENDING[o.way]} · ${WAY_ATTR[o.way]}`;

/** the soldiers sent: two on a job, three on a showdown; a personal saga's soldier always goes (§2.6) */
export function pickParty(rng: Rng, w: World, finale: boolean): Card[] {
  const size = finale ? 3 : 2;
  const pool = rng.shuffle(w.roster.filter(c => c.id !== w.focal.id));
  return w.fx.personal ? [w.focal, ...pool.slice(0, size - 1)] : pool.slice(0, size);
}

// ─── the mock writer: the floor (§4.4) ──────────────────────────────────────────────────────────
// Deterministic templates with every contract honoured: pitch = client + first job + trouble +
// stake; card = latest + job + trouble; report by outcome and `decides`; summary = job + outcome.

/** a job line and its win per type, naming whom it is about ("Chase down the one who ran" named nobody) */
type JobText = (place: string, target: string, opp: string) => string;
const TYPE_JOB: Record<JobType, JobText> = {
  fight: (p, _t, o) => `Drive ${o}'s men out of ${p}.`, guard: (p, _t, o) => `Hold ${p} against ${o}'s men.`,
  catch: (p, t) => `Chase down ${t}, who fled toward ${p}.`, hunt: (p, _t, o) => `Track the beast ${o} keeps near ${p}.`,
  sneak: (p, _t, o) => `Get into ${p} unseen and take what ${o} keeps there.`, free: (p, t) => `Break ${t} out of ${p}.`,
  find: (p, _t, o) => `Find ${o}'s hiding place near ${p}.`, talk: (p, t) => `Win ${t} over at ${p}.`,
  escort: (p, t) => `Bring ${t} safely through ${p}.`,
};
const TYPE_WIN: Record<JobType, JobText> = {
  fight: (p, _t, o) => `${o}'s men are driven out of ${p}.`, guard: p => `The attack on ${p} is beaten back.`,
  catch: (p, t) => `${t} is caught before reaching ${p}.`, hunt: p => `The beast near ${p} is trapped.`,
  sneak: (p, _t, o) => `What ${o} kept at ${p} is taken unseen.`, free: (p, t) => `${t} is freed from ${p}.`,
  find: (p, _t, o) => `${o}'s hiding place near ${p} is found.`, talk: (_p, t) => `${t} takes the company's side.`,
  escort: (p, t) => `${t} comes safely through ${p}.`,
};
const TYPE_WILL: Record<JobType, string> = {
  fight: 'fight for every yard', guard: 'attack at dusk', catch: 'cover the escape', hunt: 'turn and charge',
  sneak: 'keep a close watch', free: 'guard the door', find: 'cover their tracks', talk: 'shout the company down',
  escort: 'lie in wait on the road',
};
/** the floor's answers: a few with concrete referents, dealt by the mock's rng, never one canned line */
const MOCK_ANSWERS: ((o: string, c: string) => string)[] = [
  (o, c) => `${o} is ${c}'s own kin, cut out of an old will.`,
  (o, c) => `${o} owes a debt to a harder man, who wants ${c} ruined.`,
  (o, c) => `${o} hides an old crime, and ${c} is the only one who saw it.`,
];
const cap = (s: string) => s ? s[0]!.toUpperCase() + s.slice(1) : s;
const sentence = (s: string) => s.trim() ? cap(s.trim()).replace(/([^.!?])$/, '$1.') : '';
const firstSentence = (s: string) => s.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s.trim();
const the = theLabel;

export function mockPlan(ctx: PlanCtx): Record<string, unknown> {
  const { w, arm } = ctx;
  const rng = new Rng(hashStr(`mockplan:${w.fx.id}:${ctx.draw.n}:${armKey(arm)}`));
  const label = (p: Person) => p.seat === 'soldier' ? an(`${RACE_WORD[p.race] ?? p.race} soldier`)
    : an(p.trade ?? (p.traits ?? '').split(', ').slice(0, 2).join(' '));
  const opp = w.cast.find(p => p.seat === 'opponent')!, client = w.cast.find(p => p.seat === 'client' || p.seat === 'soldier')!;
  const other = w.cast.find(p => p.seat === 'other') ?? opp;
  const types: JobType[] = arm.structure === 'S' ? dealtTypes(w) : rng.shuffle([...JOB_TYPES]).slice(0, w.fx.N - 1);
  const o = the(label(opp)), t = the(label(other));
  const oHe = PRONOUN[opp.sex];
  const episodes = types.map((ty, i) => {
    const place = w.places[i % w.places.length]!;
    const opens = [`What will ${o} do next?`, `Who is ${o} protecting?`, `What does ${o} want with ${place}?`][i % 3]!;
    return {
      n: i + 1, ...(arm.structure === 'S' ? {} : { type: ty }), title: `${cap(ty)} at ${place}`, job: TYPE_JOB[ty](place, t, o),
      people: w.cast.filter(p => p.seat !== 'client' && p.seat !== 'soldier').map(p => p.id),
      trouble: ty === 'hunt' ? { who: `the beast ${o} keeps`, carry: 'teeth and claws', will: TYPE_WILL[ty] } : { who: `${o}'s men`, carry: 'clubs and knives', will: TYPE_WILL[ty] },
      win: cap(TYPE_WIN[ty](place, t, o)), opens,
    };
  });
  const last = w.places[w.places.length - 1]!;
  const cName = client.known ? client.name : cap(the(label(client)));
  const clientRef = client.known ? `${client.name}, ${label(client)},` : cap(label(client));
  const cHe = PRONOUN[client.sex];
  const want = cannedWant(client, w.stake);
  const loss = stakeLine(w.stake)[2](cHe);
  const oNoun = cap(headNoun(label(opp)));
  return {
    title: rng.pick([`The ${oNoun} of ${w.places[0]}`, `Trouble at ${w.places[0]}`, `${w.places[0]} Under Threat`, `Blood at ${last}`]),
    question: rng.pick([`Why does ${o} stand in the way?`, `What is ${o} hiding?`, `What does ${o} want with ${w.places[0]}?`, `Who is ${o} protecting?`, `What happened at ${last} long ago?`]),
    answer: rng.pick(MOCK_ANSWERS)(cap(o), client.known ? client.name : the(label(client))),
    cast: w.cast.map(p => ({ id: p.id, label: label(p), want: cannedWant(p, w.stake), ...(p.seat === 'soldier' ? { past: 'an old wrong left behind' } : {}) })),
    episodes,
    showdown: {
      title: `The Reckoning at ${last}`, job: `Face ${o} at ${last}.`, people: w.cast.filter(p => p.seat !== 'client').map(p => p.id),
      trouble: { who: `${o} and ${oHe.pos} last men`, carry: 'swords', will: 'hold their ground' },
      settles: w.fx.personal ? `${cName} no longer has to run from ${cHe.pos} past.` : stakeLine(w.stake)[1](cName, cHe.pos),
      lose: loss,
    },
    options: waysOf(w).map(way => ({ way, label: cannedOption(way, w.cast.map(p => ({ ...p, label: label(p), want: '' })), arm) })),
    ...(arm.card1 === 'pitch' ? { pitch: `${clientRef} ${w.fx.personal ? `is called back to an old matter at ${w.places[0]}` : `comes to you from ${w.places[0]}`}: ${cHe.sub} wants ${want}. ${episodes[0] ? `${episodes[0].job} ${cap(episodes[0].trouble.who)} with ${episodes[0].trouble.carry} will ${episodes[0].trouble.will}.` : `Face ${o} at ${last}.`} If nobody acts, ${cName} loses ${loss}.` } : {}),
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
  if (flags.includes('first')) {
    const p = payload.premise as Record<string, string>;
    const who = cap(mockRef(p.who!, names));
    const sub = names.find(n => n.name === p.who)?.sex === 'woman' ? 'she' : 'he';
    return { card: `${who} ${p.past ? `has a past: ${p.past}. ${cap(sub)} wants ${p.wants}` : `asks for your help ${p.wants}`}. ${job} ${troubleLine}${p.loses ? ` If nobody acts, ${sub} loses ${p.loses}.` : ''}` };
  }
  const helping = payload.helping as { who: string } | undefined;
  const last = flags.includes('lastchance') ? ` This is your last chance.${payload.lose && helping ? ` If it fails, ${mockRef(helping.who, names)} loses ${String(payload.lose)} for good.` : ''}` : '';
  const choice = payload.choice as { who: string } | undefined;
  const decide = flags.includes('finale') && choice ? ` What becomes of ${mockRef(choice.who, names)} is yours to decide.` : '';
  return { card: `${String(payload.latest)} ${job} ${troubleLine}${last}${decide}` };
}

export function mockReport(payload: Record<string, unknown>, flags: string[]): { before: string; after: string; summary: string } {
  const soldiers = (payload.soldiers as { name: string }[]).map(s => s.name);
  const who = soldiers.length > 1 ? `${soldiers.slice(0, -1).join(', ')} and ${soldiers[soldiers.length - 1]}` : soldiers[0]!;
  const job = String(payload.job).replace(/\.$/, '');
  const lc = job[0]!.toLowerCase() + job.slice(1);
  const hurt = ((payload.hurt as Hurt[] | undefined) ?? []).map(h => ` ${h.name} was hurt ${h.how}.`).join('');
  const cost = payload.cost ? ` It cost them: ${String(payload.cost)}.` : '';
  const ans = payload.answer as { truth: string } | undefined;
  const answer = ans ? ` The truth came out at last: ${ans.truth}` : '';
  const before = `${who} set out to ${lc}.`;
  const result = String(payload.result ?? '');
  const after = flags.includes('failure') ? `They were beaten back, and the job was not done.${hurt}`
    : `${String(payload.decides ?? who)} ${payload.outcome === 'success' ? 'carried it' : payload.outcome === 'partial' ? 'carried it, at a price' : 'could not carry it'}. ${sentence(result)}${hurt}${cost}${answer}`.trim();
  // the summary says what changed, from the result (a "The company managed to <job>." template read stiff and got copied)
  const changed = sentence(firstSentence(result));
  const summary = flags.includes('stopped') || !changed ? `The company tried to ${lc} and was driven back.`
    : payload.outcome === 'partial' ? changed.replace(/[.!?]$/, ', but at a price.') : changed;
  return { before, after, summary };
}

export const zCardOut = z.object({ card: z.string().min(1) }).passthrough();
export const zReportOut = z.object({ before: z.string().min(1), after: z.string().min(1), summary: z.string().optional() }).passthrough();
