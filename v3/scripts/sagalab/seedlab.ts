// SAGA LAB — the SEED LAB (docs/STORYTELLER.md North Star 7–9). Plays the 24 probe slots (fixtures/P F1..F8 × draws
// 1–3) under five SEED ARMS through the GAME's own storyteller — src/game/sagaflow.ts deal → plan → card → report, the
// shipped prompts and repairs (never the lab's v4lab.ts) — so a winning arm ships by changing one default
// (engine/saga.ts SEED_ARM):
//
//   A0  themes               the theme library, the lean cast (R5's seed)
//   A1  kit                  one situation + 1–3 keyword atoms (each from a different pool); the client + 1–3 supporting
//                            people with no part (the person the ending decides among them)
//   A2  kit+pick             one situation + ~10 keywords; a small pick call keeps the 1–3 that fit one clear story (the
//                            build's default since seed1)
//   A2b kit+pick             A2 again on A2's own deals (each slot's dealt world read back from A2's plan.json): the
//                            noise floor — different text, the same inputs
//   A2c kit+pick             A2 a third time on A2's deals (the power rule: >= 3 generations per arm)
//   A3  kit+pick+situation   as A2 with three situations; the pick also chooses the situation
//   A4  kit+pick+premise     A2, then a small premise call writes three sentences — the plan's seed
//   B1  kit+pick+cast        A2's deal with 3–4 supporting people; the same pick keeps the 0–1 its story needs (the plan
//                            never sees the rest) and chooses the two keywords the plan gets (measured when it only
//                            ranked them, the plan keeping the top two)
//
// PIPELINE arms (engine/saga.ts PipeArm, North Star 8): kit+pick plus one input-pipeline change each, every one played on
// A2's own dealt worlds (REPLAY), so the only difference from A2 / A2b is the arm:
//   B2  one      the pick chooses one keyword, told so; the plan gets only it
//   C1  core     after the pick, a small core call writes the want, the question, the answer and who is against; the plan
//                gets them as fixed facts and writes no question or answer
//   C2  grafts   R6's class fixes: the road prints the plan's own why per later job (no outline call; a flagged why leaves
//                the title), the card's hope goes to its report, engine finale buttons, the gold way paid
//   C3  sides    the plan writes each person's side; cards and reports get it for the people present
//
//   npx tsx scripts/sagalab/seedlab.ts [--arm A0|A1|A2|A2b|A2c|A3|A4|B1|B2|C1|C2|C3|all, or <arm>_g<N> = a further generation] [--fixtures F1,F6|all] [--draws 3 | --draw 1,3]
//        [--slots F6_3,F1_1] [--writer sonnet|haiku|openai] [--mock] [--pool 6] [--run seed1] [--force]
//   npx tsx scripts/sagalab/seedlab.ts --stats [--run seed1]     spend and latency per call kind over the run's folders
//   npx tsx scripts/sagalab/seedlab.ts --check [--run seed1]     which saga folders are missing or incomplete
//   npx tsx scripts/sagalab/seedlab.ts --render --arm B2,C1,C2,C3 --slots F6_3 [--mock] [--run seed1]
//        every NEW or CHANGED prompt variant a pipeline arm sent (one call per template + flag set), its system prompt and
//        its real payload, into runs/<run>/_pipeline_rendered/ (cleared first) for the context-free verifier
//
// The world of a slot is the probe's: the base fixture's game (seed, fort, roster), its focal from the fixture's own seed
// (a personal fixture's soldier), N, kind, a personal saga's past (the base spark), F5's returning client. The story rng
// is seeded per slot and the same in every arm (each arm then deals its own way from it); the play rng — parties, the ⚄
// line, gravity, wounds — is the same in every arm too. Outcomes follow the probe's paths: draws 1–2 clean (a personal
// fixture: personal), draw 3 bumpy (lastchance when N = 2); the finale plays the likely way (g0), as R5 did. F1's pinned
// seed is NOT pinned: the seed is what the arms test, and the game deals A0 a theme for every saga.
//
// The writer: the game's provider — sonnet / haiku on the Claude CLI transport (the subscription; list price kept for
// information), openai = production GPT tiers (plan GPT-6 Sol, the rest GPT-6 Luna). --mock: the floor, free.
//
// Writes each saga in the folder format the judges read (judge_gpt.ts, mech.ts, score.ts; the R5 probe's layout):
//   runs/<run>/<arm>/<fixture>_<draw>/   (mock: runs/<run>/mock-<arm>/…)
//     card_k.md (the quest log as the player sees it, the prose, ON THIS MATTER, the footer, the PLANS) · report_k.md ·
//     chain.md (the game's chronicle) · order.txt · texts.json · plan.json (the dealt inputs, the pick and premise
//     outputs, the plan) · calls.jsonl · meta.json
// and runs/<run>/<arm>/INDEX.md.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game } from '../../src/game/game.js';
import { MockProvider } from '../../src/ai/mock.js';
import { makeOpenAiProvider } from '../../src/ai/openai.js';
import { renderSaga } from '../../src/ai/prompts/saga/render.js';
import type { AiProvider, AiCallRecord, SagaCall } from '../../src/ai/provider.js';
import { sampleGravity } from '../../src/ai/keywords.js';
import { Rng } from '../../src/engine/rng.js';
import { HELD, seedIdCounter, type Card } from '../../src/engine/cards.js';
import { bankBeat, type Chain, type FinaleFate } from '../../src/engine/chains.js';
import { materializeReward } from '../../src/engine/quests.js';
import { labOutcome, type LabFixture, type LabPath } from '../../src/engine/lab.js';
import type { Outcome, SlotTest } from '../../src/engine/roll.js';
import type { Attribute } from '../../src/engine/tags.js';
import { renderTags } from '../../src/engine/tags.js';
import { hashStr, seedOf, type SeedArm, type PipeArm, type Face, type Hurt, type SagaRecord, type SagaWorld } from '../../src/engine/saga.js';
import { logLines, matterLine, buttonLine } from '../../src/ai/storyteller.js';
import * as flow from '../../src/game/sagaflow.js';
import type { TextRec } from './extract.js';
import { glossEchoes, cardStamps } from './mech.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');
process.chdir(V3);   // loadKey looks beside the package

const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined };
const flag = (name: string) => argv.includes(`--${name}`);
const MOCK = flag('mock'), FORCE = flag('force');
const RUN = opt('run') ?? 'seed1';
type Writer = 'openai' | 'sonnet' | 'haiku';
const WRITER = (opt('writer') ?? 'sonnet') as Writer;
if (!['openai', 'sonnet', 'haiku'].includes(WRITER)) { console.error(`--writer: ${WRITER} is not one of openai/sonnet/haiku`); process.exit(2) }
const POOL = Math.max(1, Number(opt('pool') ?? (MOCK ? 8 : 6)));
// the Claude transport's CLI pool is module-level and read per call: one pool for every saga in flight
if (!MOCK && WRITER !== 'openai') {
  process.env.AIRAIDER_CLAUDE_POOL = String(POOL);
  process.env.AIRAIDER_CLAUDE_WRITER = WRITER;
  delete process.env.AIRAIDER_CLAUDE_PLAN;
}

export const ARMS: Record<string, SeedArm> = {
  A0: 'themes', A1: 'kit', A2: 'kit+pick', A2b: 'kit+pick', A2c: 'kit+pick', A3: 'kit+pick+situation', A4: 'kit+pick+premise', B1: 'kit+pick+cast',
  B2: 'kit+pick', C1: 'kit+pick', C2: 'kit+pick', C3: 'kit+pick',
};
/** the pipeline arms: kit+pick's seed, one pipeline change each (the host's pipeArm) */
export const PIPES: Record<string, PipeArm> = { B2: 'one', C1: 'core', C2: 'grafts', C3: 'sides' };
/** an arm that plays another arm's deals: each slot's dealt world is read back from that arm's plan.json (the noise
 *  control: a later change to the deal — the supporting trades — cannot move its inputs; the pipeline arms: the arm is the
 *  only difference) */
const REPLAY: Record<string, string> = { A2b: 'A2', A2c: 'A2', B2: 'A2', C1: 'A2', C2: 'A2', C3: 'A2' };
/** a further generation of an arm (the power rule): `<arm>_g<N>` plays `<arm>` exactly — its seed, pipe and replayed deals — into
 *  its own folder, runs/<run>/<arm>_g<N>/ */
const gen = (armId: string) => armId.replace(/_g\d+$/, '');
const armArg = opt('arm') ?? 'all';
const ARM_IDS = armArg === 'all' ? Object.keys(ARMS) : armArg.split(',').map(s => s.trim());
for (const a of ARM_IDS) if (!ARMS[gen(a)]) { console.error(`--arm: ${a} is not one of ${Object.keys(ARMS).join('/')}`); process.exit(2) }

// ─── fixtures and slots ────────────────────────────────────────────────────────────────────────

interface ProbeFixture {
  id: string; base: string; N: number; kind: 'recruit' | 'captive' | 'gold'; personal: boolean;
  returning?: { seat: 'client'; name: string; sex: 'male' | 'female'; race: string; trade?: string; memory: string; where: string };
}
const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8')) as T;
const ALL_FX: ProbeFixture[] = fs.readdirSync(path.join(LAB, 'fixtures/P')).filter(f => /^F\d+\.json$/.test(f))
  .sort((a, b) => Number(a.slice(1, -5)) - Number(b.slice(1, -5))).map(f => readJson<ProbeFixture>(path.join(LAB, 'fixtures/P', f)));
const baseOf = (id: string): LabFixture => readJson<LabFixture>(path.join(LAB, 'fixtures', id[0]!, `${id}.json`));
const wantFx = opt('fixtures') && opt('fixtures') !== 'all' ? opt('fixtures')!.split(',') : ALL_FX.map(f => f.id);
const DRAWS: number[] = opt('draw') ? opt('draw')!.split(',').map(Number) : Array.from({ length: Number(opt('draws') ?? 3) }, (_, i) => i + 1);
const SLOTS = opt('slots')?.split(',').map(s => s.trim()).filter(Boolean);
const PLAY: { fx: ProbeFixture; d: number }[] = SLOTS
  ? SLOTS.map(sl => { const [f, d] = sl.split('_'); const fx = ALL_FX.find(x => x.id === f); if (!fx || !(Number(d) >= 1)) { console.error(`bad slot: ${sl}`); process.exit(2) } return { fx, d: Number(d) } })
  : DRAWS.flatMap(d => ALL_FX.filter(f => wantFx.includes(f.id)).map(fx => ({ fx, d })));
const pathOf = (fx: ProbeFixture, d: number): LabPath => d < 3 ? (fx.personal ? 'personal' : 'clean') : fx.N >= 3 ? 'bumpy' : 'lastchance';
const armDir = (arm: string) => path.join(LAB, 'runs', RUN, `${MOCK ? 'mock-' : ''}${arm}`);

/** the dealt world of another arm's saga in the same slot, in place of this deal's (REPLAY). The slot's own facts — the
 *  focal, N, kind, region, level — must agree; returns the fields that differed from this deal */
function replayDeal(sagaRec: SagaRecord, from: string, slot: string): string[] {
  const src = readJson<{ dealt: { seed: SagaWorld['seed']; tone: string; kit: SagaWorld['kit'] | null; cast?: SagaWorld['cast'] }; engine: { cast: SagaWorld['cast']; stake: string; shape: SagaWorld['shape']; places: string[]; land: string; region: string; N: number; kind: SagaWorld['kind']; focal: { id: string } } }>(path.join(armDir(from), slot, 'plan.json'));
  const w = sagaRec.world, e = src.engine;
  if (e.focal.id !== w.focalId || e.N !== w.N || e.kind !== w.kind || e.region !== w.region) throw new Error(`${slot}: ${from}'s world is another slot's`);
  const kit = src.dealt.kit ? { arm: src.dealt.kit.arm, situations: src.dealt.kit.situations, keywords: src.dealt.kit.keywords } : undefined;
  const dealt: SagaWorld = { ...w, cast: src.dealt.cast ?? e.cast, stake: e.stake, shape: e.shape, places: e.places, land: e.land, seed: src.dealt.seed, tone: src.dealt.tone, ...(kit ? { kit } : {}) };
  if (!kit) delete dealt.kit;
  const diff = (Object.keys(dealt) as (keyof SagaWorld)[]).filter(k => JSON.stringify(dealt[k]) !== JSON.stringify(w[k]));
  Object.assign(sagaRec, flow.newRecord(JSON.parse(JSON.stringify(dealt)) as SagaWorld));
  return diff;
}

// ─── the world of a slot: the base fixture's game, the focal, the chain ───────────────────────

interface World { game: Game; chain: Chain; focal: Card; base: LabFixture; region: string; level: number }
/** synchronous from the id counter's reset on, so a slot's card ids are the same in every arm and every order */
function buildWorld(fx: ProbeFixture, d: number): World {
  const base = baseOf(fx.base);
  seedIdCounter(1);
  const game = new Game(new MockProvider(base.seed), base.seed);
  const posted = game.labSaga(base);
  if (!posted.ok) throw new Error(`${fx.id}: ${posted.msg}`);
  const lead = game.state.leads.find(l => l.id === posted.leadId)!;
  game.state.leads = game.state.leads.filter(l => l !== lead);
  const level = base.level ?? 2;
  const region = base.region ?? game.activeRegions()[0]!;
  let focal: Card;
  if (fx.personal) focal = game.card(lead.personalMercId!)!;
  else {
    const f = base.focal;   // the game's labFocal, verbatim: the same face in every arm
    focal = materializeReward(new Rng(f.seed >>> 0), { kind: 'captive', value: f.value ?? 120, required: f.tags?.map(concept => ({ concept })) },
      level, region, { presetName: f.name, race: f.race, gender: f.sex, maxSkills: 2 })[0]!;
    focal.location = HELD('limbo');
    game.state.cards.push(focal);
  }
  const chain: Chain = {
    id: `chain-${fx.id}_${d}`, kind: fx.kind === 'gold' ? 'gold-hoard' : fx.kind, isPersonal: fx.personal, focalId: focal.id, level,
    rarity: base.rarity ?? 'common', region, expectedBeats: fx.N, payoff: 300, bank: 0, cyclesSpent: 0,
    failureBudget: Math.max(2, Math.ceil(fx.N / 2)), failures: 0, beatIndex: 0, state: 'active', createdCycle: game.state.cycle,
  };
  game.state.chains.push(chain);
  return { game, chain, focal, base, region, level };
}

// ─── the writer: the game's provider, every saga call recorded whole ──────────────────────────

interface CallRec {
  t: string; n: number; provider: string; purpose: string; template: string; flags: string[]; model: string; effort?: string;
  durationMs: number; inputTokens: number; outputTokens: number; cachedTokens: number;
  /** list price (the Claude transport's subscription calls are not billed; this is what the API would charge) */
  costUsd: number; ok: boolean; error?: string; system: string; user: string; output?: string; tries: number;
}
/** a provider that hands each saga call to the game's provider and records it, with the inner provider's own attempts
 *  (tokens, price, model; a retry is a second attempt of the same call) */
class Recorder {
  calls: CallRec[] = [];
  private used = new Set<number>();
  constructor(private inner: AiProvider, private provider: string) {}
  asProvider(): AiProvider {
    const self = this;
    return new Proxy(this.inner, { get(t, k) { return k === 'sagaCall' ? (c: SagaCall) => self.sagaCall(c) : Reflect.get(t, k) } });
  }
  async sagaCall(c: SagaCall): Promise<unknown> {
    const system = renderSaga(c.template, c.flags, c.vars), user = JSON.stringify(c.payload);
    const t0 = Date.now(), t = new Date().toISOString();
    let out: unknown, err: Error | undefined;
    try { out = await this.inner.sagaCall(c) } catch (e) { err = e as Error }
    const tries = this.attemptsOf(c.template, user);
    const sum = (f: (r: AiCallRecord) => number) => tries.reduce((s, r) => s + f(r), 0);
    this.calls.push({
      t, n: this.calls.length + 1, provider: this.provider, purpose: c.template, template: c.template, flags: [...c.flags].sort(),
      model: tries.at(-1)?.model ?? (MOCK ? 'mock' : WRITER), effort: MOCK ? undefined : c.effort,
      durationMs: Date.now() - t0, inputTokens: sum(r => r.inputTokens), outputTokens: sum(r => r.outputTokens), cachedTokens: sum(r => r.cachedTokens),
      costUsd: sum(r => r.listCostUsd ?? r.costUsd), ok: !err, ...(err ? { error: err.message.slice(0, 300) } : {}),
      system, user, ...(out !== undefined ? { output: JSON.stringify(out) } : {}), tries: Math.max(1, tries.length),
    });
    if (err) throw err;
    return out;
  }
  private attemptsOf(template: string, user: string): AiCallRecord[] {
    const got = this.inner.callLog().filter(r => !this.used.has(r.n) && r.template === template && r.userPrompt === user.slice(0, 20000));
    for (const r of got) this.used.add(r.n);
    return got;
  }
}
function providerFor(seed: number): { ai: AiProvider; name: string } {
  if (MOCK) return { ai: new MockProvider(seed, 0), name: 'mock' };
  return WRITER === 'openai' ? { ai: makeOpenAiProvider({ transport: 'openai' }), name: 'openai' } : { ai: makeOpenAiProvider({ transport: 'claude' }), name: 'claude' };
}

// ─── the play: parties, the ⚄ line ──────────────────────────────────────────────────────────────

/** two soldiers on a job, three at the finale; a personal saga's soldier always goes, first. Off the play rng only, so
 *  every arm sends the same soldiers */
function pickParty(rng: Rng, w: World, finale: boolean): Card[] {
  const size = finale ? 3 : 2;
  const pool = rng.shuffle(w.game.roster().filter(c => c.id !== w.focal.id));
  return w.chain.isPersonal ? [w.focal, ...pool.slice(0, size - 1)] : pool.slice(0, size);
}
/** the R5 probe's ⚄ line: a roll that agrees with the forced outcome (decides/lowest are the game's, sagaflow.decidesOf) */
function diceLine(rng: Rng, party: Card[], outcome: Outcome): string {
  const coins = party.map(() => 2 + rng.int(3));
  const C = coins.reduce((s, c) => s + c, 0);
  const bar = Math.max(2.5, Math.round(C * rng.float(0.45, 0.65) * 10) / 10);
  const need = (x: number) => Math.ceil(x - 1e-9);
  const s = need(bar), p = need(0.6 * bar);
  const [lo, hi] = outcome === 'success' ? [s, C] : outcome === 'partial' ? [p, s - 1] : [0, p - 1];
  const H = lo + rng.int(Math.max(1, hi - lo + 1));
  return `⚄ [${outcome.toUpperCase()}] · rolled ${H} heads of ${C} coins vs bar ${bar} (partial from ${Math.round(0.6 * bar * 10) / 10})`;
}
const testOf = (a: { attribute: string; favored: string[]; clashing: string[] }, level: number): SlotTest =>
  ({ attributes: [a.attribute.toLowerCase() as Attribute], favored: a.favored, clashing: a.clashing, difficulty: 'standard', level });
const HOW_BAND: Record<Hurt['how'], string> = { lightly: 'light', badly: 'serious', gravely: 'grave' };
const words = (s: string | undefined) => (s ?? '').split(/\s+/).filter(Boolean).length;

// ─── one saga ───────────────────────────────────────────────────────────────────────────────────

interface Row { id: string; path: string; N: number; outcomes: string; files: number; complete: boolean; problems: string[]; cost: number; card1Ms: number; title: string; seed: string; keywords: string; dev: string[] }

async function runSaga(armId: string, fx: ProbeFixture, d: number, dir: string): Promise<Row> {
  const arm = ARMS[gen(armId)]!, id = `${fx.id}_${d}`, path_ = pathOf(fx, d);
  const w = buildWorld(fx, d);
  const { game, chain, focal, base } = w;
  const N = fx.N, budget = chain.failureBudget;
  const prov = providerFor(base.seed);
  const rec = new Recorder(prov.ai, prov.name);
  const dev: string[] = [];
  const play = new Rng(hashStr(`seedlab:play:${fx.id}:${d}:${path_}`));   // the same in every arm
  const host: flow.SagaHost = {
    rng: play, storyRng: new Rng(hashStr(`seedlab:story:${fx.id}:${d}`)), ai: rec.asProvider(), state: game.state,
    card: cid => game.card(cid), roster: () => game.roster(), direction: () => undefined,
    log: (k, t) => dev.push(`${k}: ${t}`),
    takenName: n => game.state.cards.some(c => c.character && c.name === n),
    noteNpcName: () => {},
    hasRoom: t => game.hasRoom(t), rosterCapacity: () => game.rosterCapacity(),
    captiveCount: () => game.captives().length, captiveCapacity: () => game.captiveCapacity(),
    seedArm: () => arm,
    pipeArm: () => PIPES[gen(armId)],
  };
  const pins: flow.DealPins = {};
  if (fx.personal) pins.personalSeed = base.spark;
  if (fx.returning) { const r = fx.returning; pins.returningClient = { id: 'n1', name: r.name, sex: r.sex, race: r.race, memory: r.memory, where: r.where, ...(r.trade ? { trade: r.trade } : {}) } satisfies Face }

  // the deal (synchronous), then the kit's pick and premise and the plan
  const sagaRec = flow.deal(host, chain, undefined, focal, pins);
  const replayed = REPLAY[gen(armId)] ? { from: REPLAY[gen(armId)]!, differed: replayDeal(sagaRec, REPLAY[gen(armId)]!, id) } : undefined;
  const world0 = JSON.parse(JSON.stringify(sagaRec.world)) as typeof sagaRec.world;   // as dealt, before the pick
  const t0 = Date.now();
  const plan = await flow.plan(host, chain);
  const planMs = rec.calls.filter(c => ['pick', 'premise', 'core', 'plan'].includes(c.purpose)).reduce((s, c) => s + c.durationMs, 0);

  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const texts: TextRec[] = [], order: string[] = [], problems: string[] = [];
  const attempts: { k: number; questId: string; isFinale: boolean; outcome: string | null }[] = [];
  let attempt = 0, kk = 0, card1Ms = 0;
  const helpedFocal = () => flow.focalHelped(chain.saga!);
  for (; ;) {
    const out = await flow.card(host, chain);
    const r = chain.saga!;
    const { pos } = out;
    kk++;
    if (kk === 1) card1Ms = Date.now() - t0;
    const questId = `${id}.q${kk}`;
    const e = pos.finale ? plan.showdown : plan.episodes[pos.job - 1]!;
    const log = logLines(out.rows);
    const failures = chain.failures;
    const setbackLine = !pos.finale && pos.attempt > 1 ? ` · a setback — ${failures} of ${budget} before it slips away` : '';
    const matter = matterLine(out.matter);
    const opts = out.options ?? [];
    const cardMd = [
      `═══ ${out.title} · ${plan.title} ═══`, ...log, out.prose,
      ...(matter ? [matter] : []),
      pos.finale ? 'REWARD: the rest of the saga\'s pay, and what the ending brings' : "REWARD: a few days' pay",
      pos.finale ? `SAGA: ${plan.title} · the finale${r.lastchance ? ' · the last chance' : ''} · setbacks ${failures} of ${budget}`
        : `SAGA: ${plan.title} · part ${pos.job} of ${N}${setbackLine || ` · setbacks ${failures} of ${budget}`}`,
      ...(pos.finale ? ['PLANS (pick one) — chosen: g0', ...opts.map((o, i) => buttonLine(o, i, i === 0, helpedFocal()))] : []),
    ].join('\n') + '\n';
    const cardFile = `card_${kk}.md`;
    fs.writeFileSync(path.join(dir, cardFile), cardMd);
    order.push(cardFile);
    texts.push({ file: cardFile, kind: 'card', k: kk, questId, isFinale: pos.finale, title: out.title, beat: pos.finale ? 'finale' : pos.job, prose: out.prose, log: log.join('\n'), errand: '', approaches: pos.finale ? opts.map((o, i) => buttonLine(o, i, i === 0, helpedFocal()).slice(2)) : [] });

    // the outcome, forced by the path; the soldiers, the ⚄ line and the gravity off the play rng; wounds in reportIn
    if (!pos.finale) attempt++;
    const outcome = labOutcome(path_, { isFinale: pos.finale, job: pos.job, tryOnJob: pos.attempt, attempt });
    const party = pickParty(play, w, pos.finale);
    const dice = diceLine(play, party, outcome);
    const gravity = sampleGravity(play, base.rarity ?? 'common', 'saga');
    const ways = pos.finale ? flow.approaches(r).map(a => a.way) : [];
    const asks = flow.asks(e.type, party.length, chain.isPersonal, !pos.finale && flow.pinsSoldier(r, pos.job), ways);
    const tests = pos.finale ? party.map(() => testOf(flow.approaches(r)[0]!.test, w.level)) : party.map((_m, j) => testOf(asks[j % asks.length]!, w.level));
    const fate: FinaleFate | undefined = pos.finale ? (outcome === 'success' ? { fate: 'clean' } : outcome === 'partial' ? { fate: 'saddled' } : { fate: 'slipped', sequelRarity: 'uncommon' }) : undefined;
    const inn = flow.reportIn(host, chain, pos, out.prose, { outcome, party, tests, gravity, ...(pos.finale ? { way: ways[0], fate } : {}) });
    attempts.push({ k: kk, questId, isFinale: pos.finale, outcome });
    const rep = await flow.writeSagaReport(host, inn.call);
    bankBeat(chain, party.length, outcome, 0);
    const after = flow.afterReport(host, chain, pos, { outcome, party, hurt: inn.hurt, ...(inn.fate ? { fate: inn.fate } : {}) }, rep);
    const repMd = [
      `━━ ${outcome.toUpperCase()} ━━ ${e.title}${pos.finale ? ' ♛' : ''}`, rep.before, dice, rep.after,
      ...inn.hurt.map(h => `🩸 ${h.name} is wounded (${HOW_BAND[h.how]}).`),
      after.book,
    ].join('\n') + '\n';
    const repFile = `report_${kk}.md`;
    fs.writeFileSync(path.join(dir, repFile), repMd);
    order.push(repFile);
    texts.push({ file: repFile, kind: 'report', k: kk, questId, isFinale: pos.finale, title: e.title, before: rep.before, after: rep.after, outcome, diceLine: dice });
    if (pos.finale) { chain.state = outcome === 'failure' ? 'slipped' : 'done'; break }
    if (kk > 20) { problems.push('runaway saga (> 20 attempts)'); break }
  }
  const final = chain.saga!;
  fs.writeFileSync(path.join(dir, 'chain.md'), flow.chronicleText(flow.chronicle(chain)!).join('\n') + '\n');
  order.push('chain.md');

  // the floor standing in anywhere is a problem (the folder is re-run); lint lines are log-only
  for (const l of dev) if (/fallback|floor stood in|floor's choice stood in|the call failed/.test(l)) problems.push(l.replace(/^dev: /, ''));
  if (final.fallback) problems.push('plan-fallback: the floor\'s plan stood in');
  const cards = texts.filter(t => t.kind === 'card'), reports = texts.filter(t => t.kind === 'report');
  if (cards.length !== reports.length) problems.push(`${cards.length} cards but ${reports.length} reports`);
  if (!cards.some(c => c.isFinale && (c.approaches?.length ?? 0) >= 2)) problems.push('no finale card with plans');
  for (const t of reports) if (!t.before || !t.after || !t.diceLine) problems.push(`${t.file}: missing prose or ⚄ line`);
  for (const t of cards) if (words(t.prose) < 5) problems.push(`${t.file}: the card has no prose`);
  const textLint: string[] = [];
  let nc = 0, nr = 0;
  for (const c of rec.calls.filter(x => x.ok && (x.purpose === 'card' || x.purpose === 'report'))) {
    const o = JSON.parse(c.output ?? '{}') as Record<string, unknown>;
    const label = c.purpose === 'card' ? `card_${++nc}` : `report_${++nr}`;
    const prose = c.purpose === 'card' ? String(o.card ?? '') : [o.before, o.after].filter(x => typeof x === 'string').join(' ');
    for (const g of glossEchoes(c.system, c.user, prose)) textLint.push(`gloss echo ${label}: "${g}"`);
    const st = c.purpose === 'card' ? cardStamps(prose) : [];
    if (st.length) textLint.push(`stamps ${label}: ${st.join(', ')}`);
  }
  const callOf = (p: string) => rec.calls.filter(c => c.purpose === p);
  const io = (p: string) => callOf(p).map(c => ({ flags: c.flags, input: JSON.parse(c.user) as unknown, output: c.output ? JSON.parse(c.output) as unknown : null, ok: c.ok, ms: c.durationMs }));
  const cost = rec.calls.reduce((s, c) => s + c.costUsd, 0);
  const seed = seedOf(final.world);
  fs.writeFileSync(path.join(dir, 'order.txt'), order.join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'texts.json'), JSON.stringify(texts, null, 2));
  fs.writeFileSync(path.join(dir, 'calls.jsonl'), rec.calls.map(c => JSON.stringify(c)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({
    // probe.arm / probe.seed: the fields mech.ts reads (the built storyteller is R5's L · labels · lean)
    probe: { fixture: fx, base: base.id, arm: { structure: 'L', names: 'labels', cast: 'lean', seed: armId, seedArm: arm, ...(PIPES[gen(armId)] ? { pipe: PIPES[gen(armId)] } : {}) }, armKey: armId, draw: d, path: path_, seed: { text: seed.text, ...(seed.keywords ? { keywords: seed.keywords } : {}) }, tone: final.world.tone, mock: MOCK, writer: MOCK ? 'mock' : WRITER },
    engine: {
      cast: final.world.cast, stake: final.world.stake, shape: final.world.shape, places: final.world.places, land: final.world.land, region: final.world.region, N, kind: final.world.kind,
      focal: { id: focal.id, name: focal.name, tags: renderTags(focal.tags) },
      roster: game.roster().map(c => ({ id: c.id, name: c.name, tags: renderTags(c.tags) })),
    },
    // what the dealer dealt (before the pick), then what the pick and premise made of it, and the seed the plan got
    dealt: { seed: world0.seed, tone: world0.tone, kit: world0.kit ?? null, cast: world0.cast }, ...(replayed ? { replayed } : {}),
    kit: final.world.kit ?? null, seedToPlan: seed,
    pick: io('pick')[0] ?? null, premise: io('premise')[0] ?? null, ...(PIPES[gen(armId)] === 'core' ? { core: io('core')[0] ?? null } : {}),
    planInput: (io('plan').at(-1)?.input) ?? null, rawPlan: io('plan').at(-1)?.output ?? null, plan, planCalls: callOf('plan').length,
    outline: io('outline')[0] ?? null, road: final.road, hopes: final.hopes,
    validation: { defects: [], redraws: Math.max(0, callOf('plan').length - 1), fallback: final.fallback },
    dev, textLint, lines: final.lines, banked: final.state, knowing: final.knowing, ending: final.ending ?? null,
    cost, latency: { planMs, card1Ms, calls: rec.calls.map(c => ({ purpose: c.purpose, ms: c.durationMs })) },
  }, null, 2));
  const meta = {
    fixture: { id, set: 'P', seed: base.seed, path: path_, N, kind: fx.kind, personal: fx.personal, probe: fx.id, draw: d },
    run: `${RUN}/${path.basename(path.dirname(dir))}`, chainId: chain.id, chainState: chain.state, seedArm: arm, ...(PIPES[gen(armId)] ? { pipe: PIPES[gen(armId)] } : {}),
    attempts, order, complete: problems.length === 0, problems,
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  return {
    id, path: path_, N, outcomes: attempts.map(a => (a.outcome ?? '?')[0]!.toUpperCase()).join(''), files: order.length,
    complete: problems.length === 0, problems, cost, card1Ms, title: plan.title, seed: seed.text, keywords: (seed.keywords ?? []).join(', '), dev,
  };
}

// ─── the run ────────────────────────────────────────────────────────────────────────────────────

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const q = [...items];
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => { for (let x = q.shift(); x !== undefined; x = q.shift()) await fn(x) }));
}
const complete = (dir: string) => { try { return (readJson<{ complete: boolean }>(path.join(dir, 'meta.json'))).complete } catch { return false } };

async function main() {
  if (flag('stats')) return stats();
  if (flag('check')) return check();
  if (flag('render')) return render();
  if (!PLAY.length) { console.error('no slots selected'); process.exit(2) }
  // every arm's slots in one queue, interleaved slot by slot (so a stop part-way leaves every arm about as far along)
  const jobs: { armId: string; fx: ProbeFixture; d: number; dir: string }[] = [];
  for (const { fx, d } of PLAY) for (const armId of ARM_IDS) {
    const dir = path.join(armDir(armId), `${fx.id}_${d}`);
    if (!FORCE && complete(dir)) { console.log(`[${armId} ${fx.id}_${d}] complete — skipped (--force to redo)`); continue }
    jobs.push({ armId, fx, d, dir });
  }
  const rows = new Map<string, Row[]>();
  let total = 0;
  await pool(jobs, POOL, async j => {
    const tag = `[${j.armId} ${j.fx.id}_${j.d}]`;
    try {
      const row = await runSaga(j.armId, j.fx, j.d, j.dir);
      (rows.get(j.armId) ?? rows.set(j.armId, []).get(j.armId)!).push(row);
      total += row.cost;
      console.log(`${tag} ${row.outcomes} · ${row.files} files · ${row.complete ? 'complete' : `INCOMPLETE: ${row.problems.join('; ')}`} · $${row.cost.toFixed(4)} list · card 1 after ${(row.card1Ms / 1000).toFixed(1)}s · seed: ${row.seed}${row.keywords ? ` + ${row.keywords}` : ''}`);
    } catch (e) {
      console.error(`${tag} FAILED: ${(e as Error).stack}`);
    }
  });
  for (const armId of ARM_IDS) writeIndex(armId);
  console.log(`total: $${total.toFixed(4)} (list price) → ${path.relative(V3, path.join(LAB, 'runs', RUN))}`);
}

/** INDEX.md over every saga folder the arm has (this pass's and earlier ones) */
function writeIndex(armId: string) {
  const dir = armDir(armId);
  if (!fs.existsSync(dir)) return;
  const ids = fs.readdirSync(dir).filter(f => fs.existsSync(path.join(dir, f, 'meta.json'))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const rows = ids.map(id => {
    const m = readJson<{ complete: boolean; problems: string[]; attempts: { outcome: string }[]; fixture: { path: string; N: number } }>(path.join(dir, id, 'meta.json'));
    const p = readJson<{ plan: { title: string }; seedToPlan: { text: string; keywords?: string[] }; cost: number; latency: { card1Ms: number }; dev: string[] }>(path.join(dir, id, 'plan.json'));
    const lint = p.dev.filter(l => /lint/.test(l)).length;
    return `| ${id} | ${p.plan.title} | ${p.seedToPlan.text.replace(/\|/g, '/')}${p.seedToPlan.keywords ? ` · ${p.seedToPlan.keywords.join(', ')}` : ''} | ${m.fixture.path} | ${m.fixture.N} | ${m.attempts.map(a => a.outcome[0]!.toUpperCase()).join('')} | ${m.complete ? '✓' : `✗ ${m.problems.join('; ')}`} | ${lint} | ${p.cost.toFixed(4)} | ${(p.latency.card1Ms / 1000).toFixed(1)}s |`;
  });
  fs.writeFileSync(path.join(dir, 'INDEX.md'), [
    `# ${RUN} · ${MOCK ? 'mock floor · ' : ''}seed arm ${armId} (${ARMS[gen(armId)]}${PIPES[gen(armId)] ? ` + pipe ${PIPES[gen(armId)]}` : ''}) · the game's storyteller (src/game/sagaflow.ts)`, '',
    '| saga | title | seed to the plan | path | N | outcomes | complete | lint lines | $ list | card 1 after |',
    '|---|---|---|---|---|---|---|---|---|---|', ...rows, '',
  ].join('\n'));
}

/** spend (list price) and latency per call kind, per arm and overall, from the run's calls.jsonl */
function stats() {
  const root = path.join(LAB, 'runs', RUN);
  const out: Record<string, Record<string, { n: number; ms: number[]; cost: number; tries: number; fails: number }>> = {};
  const sagaCost: Record<string, number[]> = {}, card1: Record<string, number[]> = {};
  for (const arm of fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory() && !f.startsWith('_')).sort()) {
    for (const id of fs.readdirSync(path.join(root, arm)).filter(f => fs.existsSync(path.join(root, arm, f, 'calls.jsonl')))) {
      const calls = fs.readFileSync(path.join(root, arm, id, 'calls.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as CallRec);
      for (const c of calls) {
        for (const key of [arm, 'ALL']) {
          const s = ((out[key] ??= {})[c.purpose] ??= { n: 0, ms: [], cost: 0, tries: 0, fails: 0 });
          s.n++; s.ms.push(c.durationMs); s.cost += c.costUsd; s.tries += c.tries ?? 1; if (!c.ok) s.fails++;
        }
      }
      (sagaCost[arm] ??= []).push(calls.reduce((s, c) => s + c.costUsd, 0));
      try { (card1[arm] ??= []).push(readJson<{ latency: { card1Ms: number } }>(path.join(root, arm, id, 'plan.json')).latency.card1Ms) } catch { /* no plan.json */ }
    }
  }
  const pct = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))]! : 0 };
  const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const lines: string[] = [`# ${RUN} — spend (list price) and latency per call kind`, ''];
  for (const [arm, kinds] of Object.entries(out)) {
    lines.push(`## ${arm}${sagaCost[arm] ? ` · ${sagaCost[arm]!.length} sagas · $${(sagaCost[arm]!.reduce((a, b) => a + b, 0)).toFixed(3)} total, $${(sagaCost[arm]!.reduce((a, b) => a + b, 0) / sagaCost[arm]!.length).toFixed(4)}/saga · card 1 after p50 ${sec(pct(card1[arm] ?? [], 0.5))}` : ''}`, '',
      '| call | n | tries | failed | p50 | p90 | $ total | $ per call |', '|---|---|---|---|---|---|---|---|');
    for (const [k, s] of Object.entries(kinds).sort()) lines.push(`| ${k} | ${s.n} | ${s.tries} | ${s.fails} | ${sec(pct(s.ms, 0.5))} | ${sec(pct(s.ms, 0.9))} | ${s.cost.toFixed(3)} | ${(s.cost / s.n).toFixed(4)} |`);
    lines.push('');
  }
  fs.writeFileSync(path.join(root, 'STATS.md'), lines.join('\n'));
  console.log(lines.join('\n'));
}

/** what each pipeline arm changed in what a call is sent (the verifier reads exactly these): a template and flag set */
const CHANGED: Record<PipeArm, (c: { template: string; flags: string[] }) => boolean> = {
  one: c => c.template === 'pick' && c.flags.includes('count'),
  core: c => c.template === 'core' || (c.template === 'plan' && c.flags.includes('core')),
  // the plan (no options, an answer free of the endings, the paid gold way); every later card (its why is now the plan's own);
  // a report with the card's hope; the finale report (the paid gold fate)
  grafts: c => (c.template === 'plan' && c.flags.includes('grafts')) || (c.template === 'card' && !c.flags.includes('first'))
    || (c.template === 'report' && (c.flags.includes('hope') || c.flags.includes('answer'))),
  sides: c => (c.template === 'plan' && c.flags.includes('sides')) || (['card', 'report'].includes(c.template) && c.flags.includes('side')),
};
/** --render: the new or changed prompt variants of the selected pipeline arms, one file per call */
function render() {
  const out = path.join(LAB, 'runs', RUN, '_pipeline_rendered');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const index: string[] = [`# ${RUN} · the pipeline arms' new or changed prompt variants${MOCK ? ' (mock floor)' : ''}`, '',
    'One file per template + flag set a pipeline arm sent: the system prompt as rendered, then the user message (the payload) as sent.', '',
    '| file | arm | slot | template | flags | call |', '|---|---|---|---|---|---|'];
  for (const armId of ARM_IDS) {
    const pipe = PIPES[gen(armId)];
    if (!pipe) { console.log(`${armId}: not a pipeline arm — skipped`); continue }
    for (const { fx, d } of PLAY) {
      const slot = `${fx.id}_${d}`, file = path.join(armDir(armId), slot, 'calls.jsonl');
      if (!fs.existsSync(file)) { console.log(`${armId} ${slot}: no calls.jsonl — skipped`); continue }
      const seen = new Set<string>();
      for (const c of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as CallRec)) {
        const key = `${c.template}|${c.flags.join(',')}`;
        if (!CHANGED[pipe](c) || seen.has(key)) continue;
        seen.add(key);
        const name = `${armId}_${slot}_${c.template}_${String(c.n).padStart(2, '0')}.md`;
        fs.writeFileSync(path.join(out, name), [
          `# ${armId} (pipe ${pipe}) · ${slot} · ${c.template} · call ${c.n}`, '', `flags: ${c.flags.join(', ') || '(none)'}`, '',
          '## system prompt', '', '```text', c.system, '```', '', '## user message (the payload as sent)', '', '```json', JSON.stringify(JSON.parse(c.user), null, 2), '```', '',
          ...(c.output ? ['## the reply', '', '```json', JSON.stringify(JSON.parse(c.output), null, 2), '```', ''] : []),
        ].join('\n'));
        index.push(`| ${name} | ${armId} | ${slot} | ${c.template} | ${c.flags.join(', ')} | ${c.n} |`);
      }
    }
  }
  fs.writeFileSync(path.join(out, 'INDEX.md'), index.join('\n') + '\n');
  console.log(`${index.length - 6} variants → ${path.relative(V3, out)}`);
}

/** every selected arm × slot: present and complete? */
function check() {
  let bad = 0;
  for (const armId of ARM_IDS) {
    const missing: string[] = [], incomplete: string[] = [];
    for (const { fx, d } of PLAY) {
      const dir = path.join(armDir(armId), `${fx.id}_${d}`);
      if (!fs.existsSync(path.join(dir, 'meta.json'))) missing.push(`${fx.id}_${d}`);
      else if (!complete(dir)) incomplete.push(`${fx.id}_${d}`);
      else {
        const order = fs.readFileSync(path.join(dir, 'order.txt'), 'utf8').split('\n').filter(Boolean);
        const lost = [...order, 'texts.json', 'plan.json', 'calls.jsonl'].filter(f => !fs.existsSync(path.join(dir, f)));
        if (lost.length) incomplete.push(`${fx.id}_${d} (no ${lost.join(', ')})`);
      }
    }
    bad += missing.length + incomplete.length;
    console.log(`${armId}: ${PLAY.length - missing.length - incomplete.length}/${PLAY.length} complete${missing.length ? ` · missing ${missing.join(' ')}` : ''}${incomplete.length ? ` · incomplete ${incomplete.join(' ')}` : ''}`);
  }
  if (bad) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1) });
