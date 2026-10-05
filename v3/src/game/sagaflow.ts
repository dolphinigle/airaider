// THE SAGA FLOW (docs/STORYTELLER.md; Phase 2 build plan Step 4): the saga lab's probe loop (scripts/sagalab/probe.ts
// `runSaga` at tag `storyteller-build-src`, R5) cut into the game's event handlers — deal at pursue, plan, each card,
// each report in, after each report, the finale's fate line, and the read-only views. Nothing in game.ts calls this yet
// (Step 5a wires it); it is played against a fake host in test/sagaflow.test.ts and held to the lab's bytes in
// test/sagagolden.test.ts.
//
// Every number and rule stays the game's (North Star 0): slot counts, difficulty, caps, fillability, rewards, the bank,
// the failure budget, the stall guard, finale fates, settleFinale, XP and the dice are untouched. The flow only decides
// what the story says, plus the few mechanics the plan's §3 defaults hand it: asks by job type (D1), the finale's ways
// (D2), injuries by rollHurt under today's guard (D3), and who decides a job (D5).

import type { Rng } from '../engine/rng.js';
import type { Card } from '../engine/cards.js';
import type { Chain, FinaleFate } from '../engine/chains.js';
import { finaleReady } from '../engine/chains.js';
import type { Lead } from '../engine/quests.js';
import { coins, type Outcome, type SlotTest } from '../engine/roll.js';
import { KEEP_THRESHOLD, type TraitPrefs } from '../engine/economy.js';
import {
  dealSaga, castSaga, rollHurt, clampHurt, helped, piped, askerPast, looksOf, EPISODE_TESTS, WAY_TESTS, WAY_REWARD, HOW_BAND, SEED_ARM, PIPE_ARM,
  type SagaRecord, type SeedArm, type PipeArm, type SagaWorld, type SagaPlan, type SagaPos, type LogRow, type Matter, type Hurt, type Cost, type Way,
  type EpisodeType, type CastEntry, type Face, type EpisodeTest, type Episode,
} from '../engine/saga.js';
import {
  newKnowing, newState, planSaga, seedSteps, writeOutline, writeCard, writeReport, firstCardPayload, laterCardPayload, reportPayload,
  questLog, logLines, noteDelivered, forLineShown, onThisMatter, jobWhy, roadLines, roadHopes, mockOutline, bank, triedLine,
  revealLint, choiceTarget, fateSentence, knowingOf, keepKnowing, roadOf, toNullable, PRONOUN, graftRoad, toldOption, cannedOption,
  writeLate, cardWhy, grownLine, cardHope, withLead, mentions,
  type ReportCall,
} from '../ai/storyteller.js';
import type { AiProvider, AskSlotOut } from '../ai/provider.js';
import type { GameState } from './game.js';

/** what the flow needs from the game */
export interface SagaHost {
  rng: Rng; storyRng: Rng; ai: AiProvider; state: GameState;
  card(id: string): Card | undefined;
  roster(): Card[];
  /** the player's campaign direction for the payload (`directionText`), or none */
  direction(): string | undefined;
  log(kind: string, text: string): void;
  /** a name already in use or too close to one (roster, lore, recent NPC names, nameTooSimilar) */
  takenName(n: string): boolean;
  /** a trade someone in another live saga already has (engine/saga.ts CastInput.takenTrade) */
  takenTrade?(t: string): boolean;
  /** a coined name the world now holds (the recent-NPC window) */
  noteNpcName(n: string): void;
  /** the npc trait preferences (Settings) for the coined people */
  npcPrefs?(): TraitPrefs | undefined;
  /** a place name the game still wants rested */
  placeOk?(p: string): boolean;
  /** the seed arm to deal (North Star 7); absent: the build's SEED_ARM. The seed lab names one */
  seedArm?(): SeedArm;
  /** the pipeline arm on top of the seed (engine/saga.ts PipeArm), per saga; absent: PIPE_ARM. The game's host picks one
   *  by saga type (GAME_PIPE); the seed lab names one, or none (undefined: R5's pipeline, its A arms) */
  pipeArm?(chain: Chain): PipeArm | undefined;
  // the predicates settleFinale reads, for the Outcome line (sagaFate)
  hasRoom(type: string): boolean;
  rosterCapacity(): number;
  captiveCount(): number;
  captiveCapacity(): number;
}

/** D22: the player's guidance, then what they want kept out, as one string in the payload (never the system prompt) */
export const directionText = (d?: { guidance: string; avoid: string[] } | null): string | undefined => {
  if (!d) return undefined;
  const t = `${d.guidance.trim()}${d.avoid.length ? ` Keep out: ${d.avoid.join('; ')}.` : ''}`.trim();
  return t || undefined;
};
const recOf = (chain: Chain): SagaRecord => { if (!chain.saga) throw new Error(`chain ${chain.id} has no saga record`); return chain.saga };
const planOf = (rec: SagaRecord): SagaPlan => { if (!rec.plan) throw new Error('the saga has no plan yet'); return rec.plan };
/** the plan as the finale plays it: pipe arm late (E1) puts the showdown written after play in place of the plan's pre-play
 *  job, trouble and loss (its title, people, edges and settles stay the plan's); every other saga, the plan itself */
export const playedPlan = (rec: SagaRecord): SagaPlan => {
  const plan = planOf(rec), l = rec.late;
  return l ? { ...plan, showdown: { ...plan.showdown, job: l.job, trouble: { ...l.trouble }, lose: l.lose } } : plan;
};

/** (pipe arm weight, TB) someone the plan puts in this job, met in person for the first time — never the one the company
 *  acts for, a face already known, anyone a report already named, or anyone in a job already played — with how they look
 *  (looksOf). The first such, in the plan's own order; none: no meeting here. `card`: as a card meets them — never one its
 *  job already names (verify: "win over the moneylender … There you meet the moneylender"); the report meets them instead */
export function firstMeet(rec: SagaRecord, plan: SagaPlan, e: Episode, finale: boolean, card = false): { id: string; looks: string } | undefined {
  const k = knowingOf(rec), N = rec.world.N;
  const before = new Set(rec.lines.flatMap(l => (l.n >= N ? plan.showdown : plan.episodes[l.n - 1])?.people ?? []));
  const here = finale ? [...e.people, choiceTarget(plan).id] : e.people;
  const p = here.map(id => plan.cast.find(c => c.id === id))
    .find((c): c is CastEntry => !!c && c.seat !== 'client' && c.seat !== 'soldier' && !c.known && !k.met.has(c.id) && !before.has(c.id) && !(card && mentions(e.job, c)));
  return p ? { id: p.id, looks: looksOf(p) } : undefined;
}

// ─── deal (synchronous: runs in runPursue's prefix, so two queued pursues never share a theme or a name) ─

/** what the game chose before the deal: a personal saga's seed, and the known faces (D9, D10) */
export interface DealPins { personalSeed?: string; focalMemory?: { memory: string; where: string }; returningClient?: Face; seedPerson?: Face & { rival: boolean } }

export function deal(host: SagaHost, chain: Chain, lead: Pick<Lead, 'lab'> | undefined, focal: Card, pins: DealPins = {}): SagaRecord {
  const personal = chain.isPersonal;
  host.state.recentThemeIds ??= [];
  const arm = host.seedArm?.() ?? SEED_ARM;
  const d = dealSaga(host.storyRng, host.state.recentThemeIds, { personal, personalSeed: pins.personalSeed, spark: lead?.lab?.spark, ...(arm !== 'themes' ? { arm } : {}) });
  const c = castSaga(host.storyRng, {
    focal, personal, region: chain.region, shape: d.shape, taken: n => host.takenName(n), prefs: host.npcPrefs?.(),
    ...(host.takenTrade ? { takenTrade: (t: string) => host.takenTrade!(t) } : {}),
    focalMemory: pins.focalMemory, returningClient: pins.returningClient, seedPerson: pins.seedPerson, placeOk: host.placeOk ? p => host.placeOk!(p) : undefined,
    ...(d.kit ? { kit: { support: d.support ?? 0 } } : {}),
  });
  for (const p of c.cast) if (!p.focal && !p.memory) host.noteNpcName(p.name);
  const world: SagaWorld = {
    personal, N: chain.expectedBeats, kind: chain.kind === 'gold-hoard' ? 'gold' : chain.kind, shape: d.shape,
    focalId: focal.id, cast: c.cast, stake: d.stake, places: c.places, land: c.land, seed: d.seed, tone: d.tone,
    region: chain.region, level: chain.level, ...(d.kit ? { kit: d.kit } : {}),
  };
  const pipe = host.pipeArm ? host.pipeArm(chain) : PIPE_ARM;
  if (pipe) world.pipe = pipe;
  const rec = newRecord(world);
  chain.saga = rec;
  return rec;
}
/** a fresh record for a dealt world: Knowing from the cast (the soldier and a returning face named, the known met) */
export function newRecord(world: SagaWorld): SagaRecord {
  const k = newKnowing(world.cast);
  return {
    v: 4, world, plan: null, fallback: false,
    knowing: { met: [...k.met], named: [...k.named], seen: [...k.seen] }, state: newState(),
    hopes: null, road: null, done: {}, tries: {}, latest: '', lastchance: false, card1: '', lines: [],
  };
}

// ─── plan ───────────────────────────────────────────────────────────────────────────────────────

/** the plan call (at most 2, then the floor). avoid: the last five sagas' title and question. A kit arm's pick and
 *  premise calls run first, once (North Star 8: deal → pick → premise → plan); their results stay on the world */
export async function plan(host: SagaHost, chain: Chain): Promise<SagaPlan> {
  const rec = recOf(chain);
  await seedSteps(host.ai, rec.world, (kind, t) => host.log(kind, t));
  const avoid = host.state.chains.filter(c => c !== chain && c.saga?.plan).slice(-5).map(c => ({ title: c.saga!.plan!.title, question: c.saga!.plan!.question }));
  const r = await planSaga(host.ai, { w: rec.world, avoid, direction: host.direction() }, chain.id, (kind, t) => host.log(kind, t));
  rec.plan = r.plan;
  rec.fallback = r.fallback;
  rec.ownJobs = r.ownJobs;
  return r.plan;
}

// ─── the card ───────────────────────────────────────────────────────────────────────────────────

export interface SagaCardOut {
  title: string; prose: string; job: string;
  rows: LogRow[];
  /** the log prints above the prose on every card (R5) */
  logFirst: true;
  matter: Matter[];
  pos: SagaPos;
  /** the finale's ways and the plan's labels for them (canned where the plan wrote none) */
  options?: { way: Way; label: string }[];
}
const wonCount = (rec: SagaRecord) => Object.values(rec.done).filter(s => s === 'won').length;
/** where the saga stands: the job to pose next (a won job moves it on), whether the finale is here, which try */
export function posOf(rec: SagaRecord): SagaPos {
  const N = rec.world.N, job = wonCount(rec) + 1;
  const finale = rec.lastchance || job > N - 1;
  return finale ? { job: N, finale: true, attempt: 1 } : { job, finale: false, attempt: (rec.tries[job] ?? 0) + 1 };
}

/** the next card. Card 1 runs beside the outline call (R5: the road ahead) and is the only card with no For line and no
 *  Open question (its prose tells the premise). Knowing changes here and at a report's arrival only (D20). A card already
 *  on offer comes back verbatim (D15) */
export async function card(host: SagaHost, chain: Chain): Promise<SagaCardOut> {
  const rec = recOf(chain), plan = planOf(rec), w = rec.world;
  const pos = posOf(rec);
  const options = pos.finale ? buttons(rec) : undefined;
  const c = rec.cache;
  if (c && c.pos.job === pos.job && c.pos.finale === pos.finale && c.pos.attempt === pos.attempt)
    return { title: c.title, prose: c.prose, job: c.job, rows: c.rows, logFirst: true, matter: c.matter, pos, ...(options ? { options } : {}) };
  const log = (kind: string, t: string) => host.log(kind, t);
  const k = knowingOf(rec);
  const first = rec.card1 === '';
  // (R5 verify) from card 2 the log's For line names and labels the one the company acts for above the prose
  if (!first) forLineShown(plan, k);
  // pipe arm late (E1): the finale is written now, from where the story stands (once; a failed call leaves the plan's)
  if (pos.finale && piped(w, 'late') && rec.late === undefined)
    rec.late = await writeLate(host.ai, plan, w, rec.state, k, rec.lines.at(-1)?.text ?? rec.latest, log);
  const played = playedPlan(rec);
  const e = pos.finale ? played.showdown : plan.episodes[pos.job - 1]!;
  const direction = host.direction();
  const retry = pos.attempt > 1;
  // round T (engine/saga.ts PipeArm): room's caps; weight's sizes, and a later card's first in-person meeting (`firstMeet`)
  const weight = piped(w, 'weight');
  const meet = weight && !first && !pos.finale && !retry ? firstMeet(rec, plan, e, false, true) : undefined;
  // round T's shared fixes (clean): a middle job's hope checked when its card comes (`cardHope`), labels and names in the fields
  const clean = piped(w, 'clean'), n = pos.finale ? w.N : pos.job;
  // (pipe arm voice+setback, RF) a retry is framed by how the last try ended (`retry`) alone, never by the plan's pre-play
  // framing of the job: no hope, no trouble (the retry names what stopped them)
  const setbackRetry = retry && piped(w, 'setback');
  const cc = first ? firstCardPayload(plan, w, k, direction)
    : laterCardPayload(played, e, rec.latest, k, { finale: pos.finale, lastchance: rec.lastchance, retry, direction, fixes: piped(w, 'fixes'),
      why: setbackRetry ? undefined : clean ? withLead(n <= plan.episodes.length ? plan.episodes[n - 1]?.lead : undefined, cardHope(plan, w, n, rec.hopes, k)) : cardWhy(plan, n, rec.hopes),
      ...(piped(w, 'room') ? { room: true } : {}), ...(weight ? { weight: true, ...(meet ? { meet } : {}) } : {}), ...(clean ? { clean: true } : {}),
      ...(setbackRetry ? { setback: true } : {}) });
  let prose: string;
  if (first && piped(w, 'grafts')) {
    // pipe arm grafts (R6, F1): no outline call — the road and each later job's hope are the plan's own whys, a flagged
    // one kept off the screen (its row the title alone)
    prose = await writeCard(host.ai, cc, log);
    if (plan.episodes.length >= 2) {
      const g = graftRoad(plan, w, k);
      rec.road = g.road; rec.hopes = g.hopes;
      g.flags.forEach((f, i) => { if (i > 0 && f.length) log('dev', `saga road (log-only): job ${i + 1}'s why kept off the road: ${f.join('; ')}`) });
    }
  } else if (first) {
    // the road ahead beside card 1 (no added wait); a saga with fewer than two jobs before the finale gets none
    const road = plan.episodes.length >= 2 ? writeOutline(host.ai, plan, k, log) : null;
    const [text, r] = await Promise.all([writeCard(host.ai, cc, log), road]);
    prose = text;
    if (r) {
      const got = r.lines ?? mockOutline(r.payload).lines;
      rec.road = toNullable(roadLines(plan, got, k));
      rec.hopes = toNullable(roadHopes(plan, got, k));
    }
  } else prose = await writeCard(host.ai, cc, log);
  // (R4, Q1) the quest log, rendered by the engine from data above the prose
  const rows = questLog(plan, k, rec.state, roadOf(rec, pos.finale ? w.N : pos.job, !pos.finale && retry), { forLine: !first, open: !first }, w.places);
  const shown = `${logLines(rows).join('\n')}\n${prose}`;
  noteDelivered(shown, plan, k, false);
  keepKnowing(rec, k);
  const matter = onThisMatter(plan, shown);
  if (first) rec.card1 = prose;
  rec.cache = { pos, title: e.title, prose, job: e.job, rows, matter };
  return { title: e.title, prose, job: e.job, rows, logFirst: true, matter, pos, ...(options ? { options } : {}) };
}

// ─── the mechanics the plan's §3 defaults hand the flow ────────────────────────────────────────

const askOf = (t: EpisodeTest, mustBeFocal: boolean): AskSlotOut => ({ attribute: t.attribute, favored: [...t.favored], clashing: [...t.clashing], ...(mustBeFocal ? { mustBeFocal: true } : {}) });
/** D1: a job's asks from its type (slot i takes option i % 2); a personal saga pins the soldier to slot 0 when the job
 *  stages their own matter in person (`soldierInJob` — the plan's people as written, `pinsSoldier`). The showdown's are its
 *  ways' tests, one per way */
export function asks(type: EpisodeType, n: number, personal: boolean, soldierInJob: boolean, ways: Way[] = []): AskSlotOut[] {
  if (type === 'showdown') return ways.map((v, i) => askOf(WAY_TESTS[v], personal && soldierInJob && i === 0));
  return Array.from({ length: n }, (_, i) => askOf(EPISODE_TESTS[type][i % 2]!, personal && soldierInJob && i === 0));
}
/** whether job `n` pins a personal saga's soldier to a place: only a job the plan itself put them in (`ownJobs`), never
 *  one the repair added them to (validatePlan) — before v4 the writer pinned the soldier only when the step staged their
 *  own matter in person, "in doubt, omit" */
export const pinsSoldier = (rec: SagaRecord, n: number): boolean => rec.world.personal && (rec.ownJobs ?? []).includes(n);
/** D2: the finale's approach groups from the plan's ways: the plan's label, the way's reward kind and its test */
export function approaches(rec: SagaRecord): { id: string; label: string; rewardKind: 'recruit' | 'captive' | 'gold'; way: Way; test: EpisodeTest }[] {
  return buttons(rec).map((o, i) => ({ id: `g${i}`, label: o.label, rewardKind: WAY_REWARD[o.way], way: o.way, test: WAY_TESTS[o.way] }));
}
/** the plan's cast as engine lines name them now: anyone the player has met by name (Knowing `met`) is called by it, as a
 *  face known from the start is (storyteller refOf) — never "the human noble" for someone the reports already named */
const castNow = (rec: SagaRecord): CastEntry[] => {
  const k = knowingOf(rec);
  return planOf(rec).cast.map(p => !p.known && k.met.has(p.id) ? { ...p, known: true } : p);
};
/** the ending buttons as the player reads them, and as the report and the memory tell the one chosen: pipe arm grafts's
 *  are the engine's (cannedOption), rendered from where the story stands (`castNow`); any other arm's as the plan wrote them */
export function buttons(rec: SagaRecord): { way: Way; label: string }[] {
  const plan = planOf(rec);
  if (!piped(rec.world, 'grafts')) return plan.options.map(o => ({ ...o }));
  const cast = castNow(rec);
  return plan.options.map(o => ({ way: o.way, label: cannedOption(o.way, cast, true) }));
}

/** what the reckoning rolled for one saga quest (the game's real party and dice) */
export interface SagaRoll {
  outcome: Outcome;
  /** the party in slot order, and each one's slot test (D5) */
  party: Card[]; tests: SlotTest[];
  /** the quest's gravity (sampleGravity, unchanged) */
  gravity: string;
  /** the finale: the chosen way and the fate settleFinale will apply (finaleFate, decided before the narrator) */
  way?: Way; fate?: FinaleFate;
}
/** D5: whose deed decides (most coins) and who fares worst (fewest), ties in slot order; no rng */
export function decidesOf(party: Card[], tests: SlotTest[]): { decides: string; lowest: string } {
  const c = party.map((m, i) => coins(m, tests[i] ?? tests[0]!));
  let hi = 0, lo = 0;
  c.forEach((x, i) => { if (x > c[hi]!) hi = i; if (x < c[lo]!) lo = i });
  return { decides: party[hi]!.name, lowest: party[lo]!.name };
}

export interface ReportIn { call: ReportCall; hurt: Hurt[]; cost?: Cost; decides: string; lowest: string; option?: { way: Way; label: string }; fate?: string }
/** a saga quest's report payload, at the reckoning, synchronously in the roll loop: who decides (D5), the hurt (D3, on the
 *  main rng), the fate line (D18). The writer call (`writeSagaReport`) runs after, in parallel with the others */
export function reportIn(host: SagaHost, chain: Chain, pos: SagaPos, prose: string, roll: SagaRoll): ReportIn {
  const { decides, lowest } = decidesOf(roll.party, roll.tests);
  const r = rollHurt(host.rng, roll.outcome, roll.party, lowest);
  const hurt = clampHurt(roll.outcome, r.hurt);
  // the button chosen, as the player read it
  const ways = pos.finale ? buttons(recOf(chain)) : [];
  const option = pos.finale ? ways.find(o => o.way === roll.way) ?? ways[0] : undefined;
  const fate = pos.finale && option ? sagaFate(fateFacts(host, chain, option.way, roll.outcome, roll.fate)) : undefined;
  const call = reportCall(host, chain, pos, prose, { party: roll.party, decides, outcome: roll.outcome, hurt, cost: r.cost, option, fate, gravity: roll.gravity });
  return { call, hurt, ...(r.cost ? { cost: r.cost } : {}), decides, lowest, ...(option ? { option } : {}), ...(fate ? { fate } : {}) };
}
/** the report payload from facts already decided (reportIn decides them; the golden test feeds the lab's) */
export function reportCall(host: Pick<SagaHost, 'direction'>, chain: Chain, pos: SagaPos, prose: string,
  f: { party: Card[]; decides: string; outcome: Outcome; hurt: Hurt[]; cost?: Cost; option?: { way: Way; label: string }; fate?: string; gravity: string }): ReportCall {
  // pipe arm late (E1): the finale's job, trouble and loss as written after play
  const rec = recOf(chain), plan = playedPlan(rec);
  const e = pos.finale ? plan.showdown : plan.episodes[pos.job - 1]!;
  // the chosen button's deed as the story tells it: the gold way's money stays on the button (toldOption)
  const option = f.option && { way: f.option.way, label: toldLabel(rec, f.option) };
  // pipe arm grafts (R6, F1): a middle job's report is dealt the hope its card was dealt (the card's promise)
  // (pipe arm clean) the hope its card was dealt, checked when that card came (`cardHope`)
  // (pipe arm voice+setback, RF) a retry's card was dealt no hope, so neither is its report (the card it reads tells the failure:
  // dealt again as `last`, the summary came back a copy of it); a failed middle job's report, that the job still stands
  const clean = piped(rec.world, 'clean'), setback = piped(rec.world, 'setback') && !pos.finale;
  const stands = setback && f.outcome === 'failure' ? standsFact(triedAgain(chain, f.party.length)) : undefined;
  const hope = piped(rec.world, 'grafts') && !pos.finale && !(setback && pos.attempt > 1) ? clean ? cardHope(plan, rec.world, pos.job, rec.hopes, knowingOf(rec)) : jobWhy(plan, pos.job, rec.hopes) : undefined;
  // round T: room, weight (+ a first in-person meeting here — none again for the one this job's card met, verify: the report
  // repeated the card's looks word for word), voice, lore (its payoff), past (the soldier's change)
  const w = rec.world;
  const cardMet = piped(w, 'weight') && !pos.finale && pos.job > 1 && pos.attempt === 1 ? firstMeet(rec, plan, e, false, true) : undefined;
  const meet = piped(w, 'weight') ? firstMeet(rec, plan, e, pos.finale) : undefined;
  const t = {
    ...(piped(w, 'room') ? { room: true } : {}),
    ...(piped(w, 'weight') ? { weight: true, ...(meet && meet.id !== cardMet?.id ? { meet } : {}) } : {}),
    // (teller) on a personal saga with the past told (S2) or clean, nobody named: whoever there could know the secret says it
    ...(piped(w, 'witness') ? { witness: true } : {}), ...(piped(w, 'teller') ? { teller: w.personal && (piped(w, 'past') || clean) ? 'any' as const : true } : {}),
    ...(piped(w, 'lore') && plan.lore ? { lore: plan.lore } : {}),
    ...((c => w.personal && piped(w, 'past') && c ? { change: c } : {})(plan.cast.find(p => p.seat === 'soldier')?.change)),
    // (voice+asker, HP) a hired asker's change, shown at a finale not lost
    ...((c => askerPast(w) && c ? { change: c } : {})(plan.cast.find(p => p.seat === 'client')?.change)),
  };
  return reportPayload({
    plan, e, card: prose, party: f.party, decides: f.decides, outcome: f.outcome, finale: pos.finale, hurt: f.hurt, cost: f.cost, option, fate: f.fate,
    k: knowingOf(rec), gravity: f.gravity, direction: host.direction(), state: { learned: [...rec.state.learned], held: [...rec.state.held] },
    ...(hope ? { hope } : {}), ...(piped(rec.world, 'fixes') ? { fixes: { places: rec.world.places } } : {}),
    ...(piped(rec.world, 'narrow') ? { narrow: true } : {}),
    ...(Object.keys(t).length ? { t } : {}), ...(clean ? { clean: true } : {}),
    ...(stands ? { stands } : {}),
  });
}
/** (pipe arm voice+setback, RF) whether a failed middle job is posed again: the failure bankBeat is about to count and the party's
 *  cycles, read against finaleReady (the setbacks spent, or the stall guard: afterReport then deals the last chance). Read at
 *  reportIn, BEFORE bankBeat — the game's reckoning and the lab's both write the report payload first */
export const triedAgain = (chain: Chain, partySize: number): boolean =>
  !finaleReady({ ...chain, failures: chain.failures + 1, cyclesSpent: chain.cyclesSpent + partySize });
/** (pipe arm voice+setback, RF) the fact a failed middle job's report is dealt: the job's people, things and place still stand —
 *  and, when the job is posed again, that it is (the playtest's failure burned the forge the retry then had to hold) */
export const standsFact = (again: boolean): string =>
  `whoever and whatever the job names, and its place${again ? ', for the company tries this job again' : ''}`;
/** a finale button's deed as the writer and the story's own lines get it (storyteller toldOption): the report's `plan`,
 *  the memory the saga leaves. The button itself keeps its label */
export const toldLabel = (rec: SagaRecord, o: { way: Way; label: string }): string => toldOption(o, castNow(rec), piped(rec.world, 'grafts'));
/** the report writer (or its floor) */
export const writeSagaReport = (host: SagaHost, call: ReportCall) => writeReport(host.ai, call, (kind, t) => host.log(kind, t));

export interface AfterReport { status: string; book: string; tried: string }
/** after a report lands. PRECONDITION: the host has already run bankBeat for this attempt (advanceChain does), so
 *  chain.failures, beatIndex and cyclesSpent are this attempt's. Knowing takes the report (a name read in it is met);
 *  a won middle job banks its learn and gain; the attempt's SagaLine is appended; the setbacks or the stall guard bring
 *  the last chance; `latest` is what the next card opens on. Returns the 📖 line (R5: status, then the summary) */
export function afterReport(host: SagaHost, chain: Chain, pos: SagaPos, a: { outcome: Outcome; party: Card[]; hurt: Hurt[]; fate?: string }, rep: { before: string; after: string; summary: string }): AfterReport {
  const rec = recOf(chain), plan = planOf(rec), w = rec.world, N = w.N;
  const e = pos.finale ? plan.showdown : plan.episodes[pos.job - 1]!;
  const k = knowingOf(rec);
  noteDelivered(`${rep.before} ${rep.after} ${rep.summary}`, plan, k, true);
  keepKnowing(rec, k);
  bank(rec.state, e, a.outcome);
  // (R5 verify) a failed job's summary is only what stopped the company; the chronicle puts the job in front of it
  const failedJob = !pos.finale && a.outcome === 'failure';
  const tried = failedJob ? triedLine(e.job, rep.summary, plan, w) : rep.summary;
  rec.lines.push({ n: pos.finale ? N : pos.job, attempt: rec.lines.length + 1, outcome: a.outcome, party: a.party.map(p => p.name), text: tried, hurt: a.hurt });
  // how it ended, in the finale's Outcome sentence (sagaFate — every branch settleFinale takes): the views' "ending"
  if (pos.finale && a.fate) rec.ending = a.fate;
  // (pipe arm past, PP) a personal finale not lost leaves the soldier ONE dossier line, from the plan's change (the game keeps
  // it on the soldier and seeds their next personal saga with it)
  if (pos.finale && a.outcome !== 'failure' && w.personal && piped(w, 'past')) { const g = grownLine(plan); if (g) rec.grown = g }
  const wonMiddle = !pos.finale && a.outcome !== 'failure';
  const failures = chain.failures, budget = chain.failureBudget;
  if (!pos.finale) {
    rec.tries[pos.job] = pos.attempt;
    if (wonMiddle) rec.done[pos.job] = 'won';
    // the setbacks spent (the lab's rule), or the game's stall guard (D14): the finale comes next as the last chance
    if (!rec.lastchance && (failures >= budget || (finaleReady(chain) && wonCount(rec) < N - 1))) {
      rec.lastchance = true;
      if (failedJob) rec.done[pos.job] = 'lost';
    }
  }
  const status = pos.finale ? (a.outcome === 'failure' ? 'it slips away, for now' : 'it is settled')
    : a.outcome === 'failure' ? `a setback — ${failures} of ${budget}${rec.lastchance ? failures >= budget ? '; the setbacks are spent, so the last chance comes next' : '; the last chance comes next' : ''}`
    : pos.job + 1 > N - 1 || rec.lastchance ? 'it now comes to a head' : 'the story moves on';
  if (pos.finale) { const rl = revealLint(plan, w, rep.after); if (rl) host.log('dev', `saga reveal lint (log-only): ${rl}`) }
  // (R4 verify) the next card opens on what happened last: a won job's `win`; a failed try's summary; a last-chance
  // finale's job and what stopped it. Pipe arm reads (D1): a won job's summary too — the text the player just read, never
  // the plan's forecast of it (written before play, often with no doer, so the card invented one)
  rec.latest = wonMiddle && e.win && !piped(w, 'reads') ? e.win : failedJob && !rec.lastchance ? rep.summary : tried;
  delete rec.cache;
  return { status, book: `📖 ${plan.title}: ${status}. ${rep.summary}`, tried };
}

// ─── the finale's Outcome line (D18): ONE function, every branch settleFinale takes ─────────────

export interface FateFacts {
  way: Way; outcome: Outcome; fate: 'clean' | 'saddled' | 'slipped';
  /** the plan's focal and the one the choice is about (choiceTarget) */
  focal: CastEntry; target: CastEntry;
  personal: boolean;
  /** the focal is already one of the company's soldiers (hired mid-saga): settleFinale never re-disposes of them */
  focalIsMerc: boolean;
  /** REWARD_BANK void-to-gold: a keep-kind ending on a bank below KEEP_THRESHOLD × the focal's mark */
  void: boolean;
  /** a recruit: is there roster room besides the focal (settleFinale's count) */
  rosterRoom: boolean;
  /** a captive: a Dungeon, and a free cell */
  dungeon: boolean; cellRoom: boolean;
  /** pipe arm grafts: the gold way is told as the person going free — no treasure (R6, F2), its money on the button only
   *  (designer 2026-10-04) */
  freeGold?: boolean;
}
/** the facts settleFinale reads, read the same way */
export function fateFacts(host: SagaHost, chain: Chain, way: Way, outcome: Outcome, fate?: FinaleFate): FateFacts {
  const plan = planOf(recOf(chain));
  const focalCard = host.card(chain.focalId);
  const kind = WAY_REWARD[way];
  const f: 'clean' | 'saddled' | 'slipped' = fate?.fate ?? (outcome === 'success' ? 'clean' : outcome === 'partial' ? 'saddled' : 'slipped');
  return {
    way, outcome, fate: f, focal: plan.cast.find(p => p.focal)!, target: choiceTarget(plan), personal: chain.isPersonal,
    focalIsMerc: focalCard?.character?.role === 'merc',
    void: !!focalCard && kind !== 'gold' && chain.bank < focalCard.value * KEEP_THRESHOLD,
    rosterRoom: host.roster().filter(m => m.id !== chain.focalId).length < host.rosterCapacity(),
    dungeon: host.hasRoom('dungeon'), cellRoom: host.captiveCount() < host.captiveCapacity(),
    ...(piped(recOf(chain).world, 'grafts') ? { freeGold: true } : {}),
  };
}
/** the Outcome sentence: the lab's wording (fateSentence) wherever settleFinale does what the lab assumed, and a plain fact
 *  for every branch it does not (a focal who is already a soldier; the void; a full roster; no Dungeon or full cells) */
export function sagaFate(x: FateFacts): string {
  const name = x.focal.name, he = PRONOUN[x.focal.sex];
  const soldierFocal = x.focal.seat === 'soldier';
  if (x.fate === 'slipped') {
    if (!soldierFocal && x.focalIsMerc) return `The matter around ${name} slips out of reach, for now; ${name} stays with the company.`;
    return fateSentence(x.way, 'failure', x.focal, x.target);
  }
  if (soldierFocal) return fateSentence(x.way, x.outcome, x.focal, x.target);
  if (x.personal || x.focalIsMerc) return `The matter closes around ${name}, who already stands with the company.`;
  const kind = WAY_REWARD[x.way];
  if (x.void) return `The work earned too little to keep ${name}, who passes out of the company's reach, for now.`;
  if (kind === 'gold') return fateSentence('gold', x.outcome, x.focal, x.target, x.freeGold);
  if (kind === 'recruit') return x.rosterRoom ? fateSentence('recruit', x.outcome, x.focal, x.target) : `${name} is won over, but the roster is full, so ${he.sub} waits at the tavern.`;
  if (!x.dungeon) return `${name} is taken, but the fort has no Dungeon to hold ${he.obj}.`;
  if (!x.cellRoom) return `${name} is taken, but the fort's cells are full.`;
  return fateSentence('captive', x.outcome, x.focal, x.target);
}

// ─── views (read-only: they never write Knowing) ───────────────────────────────────────────────

const LIKELY: Record<string, string> = { recruit: 'they may join the company', captive: 'they may end in your cells', gold: 'their treasure may pay out', talk: "a soldier's past to settle" };
/** pipe arm grafts: the gold way's likely end as its story tells it (FREE_GOLD / FREE_HELPED_GOLD) — no treasure, no money:
 *  the money is the finale button's alone (designer 2026-10-04) */
const LIKELY_FREE = 'they may go their way';
const likelyOf = (w: SagaWorld) => w.personal ? LIKELY.talk! : w.kind === 'gold' && piped(w, 'grafts') ? LIKELY_FREE : LIKELY[w.kind]!;
const MARK: Record<Outcome, string> = { success: '✓', partial: '~', failure: '✗' };
/** one row of So far, as both UIs print it: `n` is the job's number, or "finale" — the finale is no job number (a skipped
 *  job left "1, 2, 2, 4") */
export interface SoFarRow { n: string; mark: string; outcome: Outcome; party: string; text: string; hurt: string }
export interface Chronicle {
  title: string; state: 'planned' | 'active' | 'done' | 'slipped';
  rows: LogRow[]; card1: string;
  /** the likely end while the saga is live; `ending` replaces it once the saga is over */
  likely: string; ending?: string; setbacks: { failures: number; budget: number };
  lines: SagaRecord['lines'];
  soFar: SoFarRow[];
  /** after the finale only (done or slipped) */
  answer?: string;
  /** the people the player has seen: by name and label once their name was read, else by label */
  people: { id: string; name?: string; label: string }[];
}
/** the saga as the chronicle shows it: the quest log as it stands (For line on; the open question until the finale),
 *  card 1, the likely end, So far, the answer once played, the people seen */
export function chronicle(chain: Chain): Chronicle | null {
  const rec = chain.saga;
  if (!rec?.plan) return null;
  const plan = rec.plan, N = rec.world.N;
  const k = knowingOf(rec);
  // the finale's line: posed at job N (a middle job is always below N)
  const fin = rec.lines.find(l => l.n === N);
  const finale = fin ? (fin.outcome === 'failure' ? 'lost' as const : 'won' as const) : undefined;
  // a saga let go before its finale (lapsed, or left untaken three times) is over too
  const gone = !finale && chain.state === 'slipped';
  // the finale is next (every job won, or the last chance): a job never reached is no longer ahead
  const at = !finale && !gone && (rec.lastchance || posOf(rec).finale) ? N : undefined;
  const rows = questLog(plan, k, rec.state, roadOf(rec, at, false, finale), { forLine: true, open: !finale }, rec.world.places);
  return {
    title: plan.title, state: !rec.lines.length && !rec.card1 ? 'planned' : finale ? (finale === 'lost' ? 'slipped' : 'done') : gone ? 'slipped' : 'active',
    rows, card1: rec.card1,
    likely: likelyOf(rec.world),
    ...(fin ? { ending: rec.ending ?? fin.text } : gone ? { ending: 'it slipped away before its finale' } : {}),
    setbacks: { failures: chain.failures, budget: chain.failureBudget },
    lines: rec.lines.map(l => ({ ...l, party: [...l.party], hurt: l.hurt.map(h => ({ ...h })) })),
    soFar: soFarRows(rec.lines, N),
    ...(finale ? { answer: plan.answer } : {}),
    people: plan.cast.filter(p => k.seen.has(p.id)).map(p => k.named.has(p.id) ? { id: p.id, name: p.name, label: p.label.replace(/^an? /, '') } : { id: p.id, label: p.label }),
  };
}
/** So far's rows (N: the saga's job count, the finale's number) */
export const soFarRows = (lines: SagaRecord['lines'], N: number): SoFarRow[] => lines.map(l => ({
  n: l.n >= N ? 'finale' : String(l.n), mark: MARK[l.outcome], outcome: l.outcome, party: l.party.join(', '), text: l.text,
  hurt: l.hurt.map(h => `${h.name} hurt (${HOW_BAND[h.how]})`).join(', '),
}));
/** one So far row as text: "  n ✓ party — text · X hurt (band)" (the lab's line; the finale's n is "finale") */
export const soFarLine = (r: SoFarRow): string => `  ${r.n} ${r.mark} ${r.party} — ${r.text}${r.hurt ? ` · ${r.hurt}` : ''}`;
/** the likely end while the saga is live; how it ended once it is over */
export const endLine = (c: { likely: string; ending?: string }): string => c.ending ? `ending: ${c.ending}` : `likely end: ${c.likely}`;
/** the chronicle as the lab's chain.md printed it */
export function chronicleText(c: Chronicle): string[] {
  return [
    `═══ ${c.title} ═══ (${c.state})`, ...logLines(c.rows), c.card1,
    `${endLine(c)} · setbacks ${c.setbacks.failures} of ${c.setbacks.budget}`,
    'So far:', ...c.soFar.map(soFarLine),
    ...(c.answer ? [`The answer: ${c.answer}`] : []),
    'People:', ...c.people.map(p => p.name ? `  ${p.name} — ${p.label}` : `  ${p.label}`),
  ];
}
/** whether the focal is someone the company helps (the gold way's wording and button) */
export const focalHelped = (rec: SagaRecord) => helped(planOf(rec).cast.find(p => p.focal)!);
