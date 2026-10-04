// The saga SEED ARMS (docs/STORYTELLER.md North Star 7–8): the theme library (held byte for byte by
// test/sagagolden.test.ts) vs the seed kit — one situation + keyword atoms + a supporting cast with no parts — with or
// without the small pick and premise calls before the plan. The build ships kit+pick. Played here on the mock floor; the lab plays them for real
// (scripts/sagalab/seedlab.ts).
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { dealSaga, castSaga, seedOf, seedPending, keepPicked, SEED_ARM, KIT_CLIENT_PART, PIPE_ARMS, type SeedArm, type SagaPlan, type SagaWorld } from '../src/engine/saga.js';
import { dealKit, KIT, KIT_DEAL, SEED_ARMS } from '../src/engine/seedkit.js';
import { planPayload, pickPayload, premisePayload, readPick, mockPick, seedSteps, cannedOption, clientOf, whyFlags, planHope, graftRoad, newKnowing, newState, questLog, logLines, laterCardPayload } from '../src/ai/storyteller.js';
import type { AiProvider, SagaCall } from '../src/ai/provider.js';
import { newGame, sagaChain, playSaga, hostFor } from './sagaharness.js';
import { renderSaga } from '../src/ai/prompts/saga/render.js';
import { deal } from '../src/game/sagaflow.js';

const POOLS = ['things', 'creatures', 'places', 'occasions', 'uncanny'] as const;
const poolOf = (x: string) => POOLS.find(p => KIT[p].includes(x) || (p === 'things' && KIT.qualities.some(q => x.startsWith(`${q} `) && KIT.things.includes(x.slice(q.length + 1)))));

describe('the seed kit deal', () => {
  it('the build ships kit+pick, the seed lab\'s follow winner (reports/2026-10-04-seed-arms.md)', () => expect(SEED_ARM).toBe('kit+pick'));
  it('kit: one situation and 1–3 keywords, each from a different pool; the uncanny now and then', () => {
    let uncanny = 0;
    const counts = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const d = dealKit(new Rng(i), 'kit', false);
      expect(d.situations).toHaveLength(1);
      expect(KIT.situations).toContain(d.situations[0]);
      counts.add(d.keywords.length);
      const pools = d.keywords.map(poolOf);
      expect(pools.every(Boolean)).toBe(true);
      expect(new Set(pools).size).toBe(pools.length);
      if (pools.includes('uncanny')) uncanny++;
    }
    expect([...counts].sort()).toEqual([1, 2, 3]);
    expect(uncanny / 400).toBeGreaterThan(0.12);
    expect(uncanny / 400).toBeLessThan(0.28);
  });
  it('a pick arm deals the whole offer, spread across the pools; kit+pick+situation three situations; a personal saga none', () => {
    const offer = Object.values(KIT_DEAL.offer).reduce((s, n) => s + n, 0);
    for (let i = 0; i < 50; i++) {
      const d = dealKit(new Rng(i), 'kit+pick', false);
      expect(d.keywords.length === offer || d.keywords.length === offer + 1).toBe(true);
      expect(new Set(d.keywords).size).toBe(d.keywords.length);
      for (const p of ['things', 'creatures', 'places', 'occasions'] as const) expect(d.keywords.filter(x => poolOf(x) === p).length).toBe(KIT_DEAL.offer[p]);
      const s = dealKit(new Rng(i), 'kit+pick+situation', false);
      expect(new Set(s.situations).size).toBe(3);
      expect(dealKit(new Rng(i), 'kit+pick+premise', true).situations).toEqual([]);
    }
  });
  it('dealSaga: the theme arm is the default draw for draw; a kit arm deals the kit, the tone roll and a supporting count', () => {
    for (let i = 0; i < 20; i++) {
      expect(dealSaga(new Rng(i), [], { personal: false, arm: 'themes' })).toEqual(dealSaga(new Rng(i), [], { personal: false }));
      const recent: string[] = [];
      const d = dealSaga(new Rng(i), recent, { personal: false, arm: 'kit' });
      expect(recent).toEqual([]);
      expect(d.seed).toEqual({ id: null, text: d.kit!.situations[0] });
      expect([0, 1, 2]).toContain(d.support);
      const p = dealSaga(new Rng(i), recent, { personal: true, personalSeed: 'she left her brother', arm: 'kit+pick' });
      expect(p.seed.text).toBe('she left her brother');
      expect(p.kit!.situations).toEqual([]);
    }
  });
  it('kit+pick+cast deals what kit+pick deals, draw for draw, but 3–4 supporting people', () => {
    const counts = new Set<number>();
    for (let i = 0; i < 60; i++) for (const personal of [false, true]) {
      const a = { personal, ...(personal ? { personalSeed: 'she left her brother' } : {}) };
      const pick = dealSaga(new Rng(i), [], { ...a, arm: 'kit+pick' }), cast = dealSaga(new Rng(i), [], { ...a, arm: 'kit+pick+cast' });
      expect({ ...cast, support: 0, kit: { ...cast.kit, arm: 'kit+pick' } }).toEqual({ ...pick, support: 0 });
      counts.add(cast.support!);
    }
    expect([...counts].sort()).toEqual([3, 4]);
  });
});

describe('the kit cast', () => {
  it('the client asks; the person the ending decides and the coined supporting people carry no part', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: false });
    const region = g.activeRegions()[0]!;
    for (const support of [0, 1, 2]) {
      const c = castSaga(new Rng(7), { focal, personal: false, region, shape: 'heist', taken: () => false, kit: { support } });
      expect(c.cast).toHaveLength(2 + support);
      expect(c.cast[0]).toMatchObject({ seat: 'client', part: KIT_CLIENT_PART, known: true });
      expect(c.cast[0]!.trade).toBeUndefined();
      expect(c.cast[1]).toMatchObject({ id: focal.id, focal: true, seat: 'opponent', part: '' });
      for (const p of c.cast.slice(2)) { expect(p).toMatchObject({ seat: 'support', part: '', known: false }); expect(p.trade).toBeTruthy() }
      expect(new Set(c.cast.map(p => p.name)).size).toBe(c.cast.length);
      expect(new Set(c.cast.slice(1).map(p => p.trade)).size).toBe(c.cast.length - 1);
      expect(c.places).toHaveLength(3);
    }
  });
  it('the company\'s own trade is never a supporting person; a personal saga\'s opponent may still have it', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: false });
    const region = g.activeRegions()[0]!;
    const support = new Set<string>(), opp = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const sup = castSaga(new Rng(i), { focal, personal: false, region, shape: 'heist', taken: () => false, kit: { support: 4 } }).cast.slice(2);
      expect(new Set(sup.map(p => p.trade)).size).toBe(4);
      for (const p of sup) support.add(p.trade!);
      opp.add(castSaga(new Rng(i), { focal: g.roster()[0]!, personal: true, region, shape: 'heist', taken: () => false, kit: { support: 0 } }).cast[1]!.trade!);
    }
    expect(support.has('mercenary captain')).toBe(false);
    expect(support.size).toBeGreaterThan(30);
    expect(opp.has('mercenary captain')).toBe(true);
  });
});

describe('the plan payload under a kit arm', () => {
  it('the situation and its keywords (the picked ones once picked), or the premise alone; no part key for the supporting cast', async () => {
    seedIdCounter(1);
    const { g } = newGame(11);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    await playSaga(g, chain, 'clean', focal, undefined, { seedArm: () => 'kit+pick+premise' });
    const w = chain.saga!.world;
    const k = w.kit!;
    expect(k.picked!.keywords.every(x => k.keywords.includes(x))).toBe(true);
    expect(k.premise).toHaveLength(3);
    const pp = planPayload({ w });
    expect(pp.flags).toEqual(expect.arrayContaining(['premise', 'support']));
    expect(pp.flags).not.toContain('keywords');
    expect(pp.payload.seed).toBe(k.premise!.join(' '));
    const cast = pp.payload.cast as Record<string, unknown>[];
    for (const p of w.cast) expect('part' in cast.find(c => c.id === p.id)!).toBe(p.seat === 'client');
    // the same world before its premise: the situation and the picked keywords
    const pre = { ...w, kit: { ...k, premise: undefined } };
    expect(seedOf(pre)).toEqual({ text: k.situations[0], keywords: k.picked!.keywords });
    expect(planPayload({ w: pre }).payload.keywords).toEqual(k.picked!.keywords);
    expect(seedPending(pre)).toBe(true);
    expect(seedPending(w)).toBe(false);
    expect(JSON.stringify(premisePayload(w).payload)).not.toMatch(new RegExp(`"${focal.id}"`));
    expect(pickPayload(w).payload.keywords).toEqual(k.keywords);
  });
});

describe('kit+pick+cast: the pick keeps the supporting person its story needs, and its best two keywords', () => {
  it('on the floor: nobody kept, two keywords', async () => {
    seedIdCounter(1);
    const { g } = newGame(31);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    await playSaga(g, chain, 'clean', focal, undefined, { seedArm: () => 'kit+pick+cast' });
    const w = chain.saga!.world;
    expect(w.cast.map(p => p.seat)).toEqual(['client', 'opponent']);
    expect(w.kit!.picked!.person).toBeUndefined();
    expect(w.kit!.picked!.keywords).toHaveLength(2);
  });
  it('the pick sees the supporting people apart from the cast; the plan gets only the one it kept', async () => {
    seedIdCounter(1);
    const { g } = newGame(31);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    deal({ ...hostFor(g), seedArm: () => 'kit+pick+cast' }, chain, undefined, focal);
    const w = chain.saga!.world;
    const offered = w.cast.filter(p => p.seat === 'support');
    expect(offered.length === 3 || offered.length === 4).toBe(true);
    const pp = pickPayload(w);
    expect(pp.flags).toContain('people');
    expect(pp.payload.cast).toHaveLength(2);
    expect(pp.payload.people).toHaveLength(offered.length);
    const people = pp.payload.people as string[], kw = w.kit!.keywords;
    const calls: SagaCall[] = [];
    const ai = { sagaCall: async (c: SagaCall) => { calls.push(c); return { keywords: [kw[3], kw[0], kw[5], kw[1]], person: `The ${people[1]!.replace(/^an? /, '')}` } } } as unknown as AiProvider;
    await seedSteps(ai, w);
    expect(calls.map(c => c.template)).toEqual(['pick']);
    expect(w.kit!.picked!.keywords).toEqual([kw[3], kw[0]]);
    expect(w.kit!.picked!.person).toBe(offered[1]!.id);
    expect(w.cast.map(p => p.id)).toEqual([w.cast[0]!.id, focal.id, offered[1]!.id]);
    expect(planPayload({ w }).payload.keywords).toEqual([kw[3], kw[0]]);
    expect(planPayload({ w }).payload.cast).toHaveLength(3);
    // once picked, the pick never runs again and nothing more is cut
    await seedSteps(ai, w);
    expect(calls).toHaveLength(1);
    keepPicked(w);
    expect(w.cast).toHaveLength(3);
  });
  it('"none" keeps nobody and drops nothing; a person not offered is dropped', () => {
    const k = { arm: 'kit+pick+cast' as const, situations: ['rescue someone'], keywords: ['lantern', 'mill', 'goose'] };
    const payload = { situation: 'rescue someone', keywords: k.keywords, people: ['a human miller', 'an elf reeve'] };
    expect(readPick({ keywords: ['mill'], person: 'none' }, k, payload)).toEqual({ keywords: ['mill'], dropped: [], floor: false });
    expect(readPick({ keywords: ['mill'], person: 'a dwarf smith' }, k, payload)).toEqual({ keywords: ['mill'], dropped: ['a dwarf smith'], floor: false });
    expect(readPick({ keywords: ['mill', 'goose', 'lantern'], person: ['elf reeve'] }, k, payload)).toEqual({ keywords: ['mill', 'goose'], person: 'an elf reeve', dropped: [], floor: false });
    expect(mockPick(payload)).toEqual({ keywords: ['lantern', 'mill'], person: 'none' });
  });
});

describe('the pick reads only what was dealt', () => {
  const k = { situations: ['rescue someone', 'stop an attack', 'lift a curse'], keywords: ['lantern', 'cracked bell', 'mill', 'goose', 'harvest'] };
  const payload = { situations: k.situations, keywords: k.keywords };
  it('matches loosely, keeps the dealt words, caps at three, drops the rest', () => {
    const r = readPick({ situation: 'Lift a curse.', keywords: ['The cracked bell', 'harvest', 'dragon', 'mill', 'goose'] }, k, payload);
    expect(r).toEqual({ situation: 'lift a curse', keywords: ['cracked bell', 'harvest', 'mill'], dropped: ['dragon'], floor: false });
  });
  it('nothing usable is the floor\'s choice', () => {
    const r = readPick({ keywords: ['dragon'] }, k, payload);
    expect(r.floor).toBe(true);
    expect(r.keywords).toEqual(mockPick(payload).keywords);
    expect(r.situation).toBe('rescue someone');
    expect(readPick(null, k, payload).floor).toBe(true);
  });
});

describe('every seed arm plays a saga to its end on the floor', () => {
  for (const arm of SEED_ARMS as readonly SeedArm[]) for (const personal of [false, true]) it(`${arm} · ${personal ? 'personal' : 'hired'}`, async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal });
    const p = await playSaga(g, chain, personal ? 'personal' : 'bumpy', focal, undefined, { seedArm: () => arm });
    const rec = chain.saga!;
    expect(rec.fallback).toBe(false);
    expect(p.cards.length).toBe(p.reports.length);
    expect(p.cards[p.cards.length - 1]!.pos.finale).toBe(true);
    expect(!!rec.world.kit).toBe(arm !== 'themes');
    const templates = ai.calls.map(c => c.template);
    expect(templates.filter(t => t === 'pick').length).toBe(arm.includes('pick') ? 1 : 0);
    expect(templates.filter(t => t === 'premise').length).toBe(arm === 'kit+pick+premise' ? 1 : 0);
    if (arm === 'kit+pick+situation' && !personal) expect(rec.world.kit!.situations).toContain(rec.world.kit!.picked!.situation);
    expect(JSON.parse(JSON.stringify(rec))).toEqual(rec);
  });
});

// ─── the lab's PIPELINE arms (engine/saga.ts PipeArm; scripts/sagalab/seedlab.ts B2/C1/C2/C3): kit+pick plus one change
// each, never set by the build ────────────────────────────────────────────────────────────────────

describe('pipeline arms on the floor', () => {
  it('the build deals no pipe arm', () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    deal(hostFor(g), chain, undefined, focal);
    expect(chain.saga!.world.pipe).toBeUndefined();
    expect(PIPE_ARMS).toEqual(['one', 'core', 'grafts', 'sides']);
  });
  for (const pipe of PIPE_ARMS) for (const personal of [false, true]) it(`${pipe} · ${personal ? 'personal' : 'hired'}: plays to its end, on kit+pick`, async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal });
    const p = await playSaga(g, chain, personal ? 'personal' : 'bumpy', focal, undefined, { pipeArm: () => pipe });
    const rec = chain.saga!, w = rec.world, plan = rec.plan!;
    expect(rec.fallback).toBe(false);
    expect(w.pipe).toBe(pipe);
    expect(w.kit!.arm).toBe('kit+pick');
    expect(p.cards[p.cards.length - 1]!.pos.finale).toBe(true);
    expect(JSON.parse(JSON.stringify(rec))).toEqual(rec);
    const t = ai.calls.map(c => c.template);
    const pick = ai.calls.find(c => c.template === 'pick')!;
    expect(pick.flags.includes('count')).toBe(pipe === 'one');
    if (pipe === 'one') expect(pick.vars).toEqual({ KEEP: 'one keyword' });
    expect(w.kit!.picked!.keywords).toHaveLength(pipe === 'one' ? 1 : 2);
    expect(t.includes('outline')).toBe(pipe !== 'grafts');
    expect(t.filter(x => x === 'core').length).toBe(pipe === 'core' ? 1 : 0);
    const planCall = ai.calls.find(c => c.template === 'plan')!;
    // every key an arm's call carries has a line in its prompt (the payload lint, for the arms' new keys and lines)
    for (const c of ai.calls) for (const key of Object.keys(c.payload)) expect(renderSaga(c.template, c.flags, c.vars), `${c.template} ${key}`).toMatch(new RegExp(`\\b${key}\\b`));
    if (pipe === 'core') {
      // the core comes after the pick and before the plan, and the plan's question and answer are the core's
      expect(t.slice(0, 3)).toEqual(['pick', 'core', 'plan']);
      expect(planCall.flags).toContain('core');
      expect(planCall.payload.core).toEqual(w.kit!.core);
      expect(plan.question).toBe(w.kit!.core!.question);
      expect(plan.answer).toBe(w.kit!.core!.answer);
      const core = ai.calls.find(c => c.template === 'core')!;
      expect(core.tier).toBe('plan');
      // the core knows the setting it writes for (C1's, blind to it, set a forest saga at sea)
      expect(core.payload.land).toBe(w.land);
      expect(core.payload.places).toEqual(w.places);
      expect(JSON.stringify(core.payload)).not.toMatch(new RegExp(`"${focal.id}"`));
    }
    if (pipe === 'grafts') {
      // the buttons are the engine's; the gold way is paid, never a treasure
      expect(planCall.flags).toContain('grafts');
      const ending = planCall.payload.ending as { ways: { way: string; means: string }[] | string[] };
      if (!personal) expect(JSON.stringify(ending)).not.toMatch(/treasure/);
      for (const o of plan.options) expect(o.label).toBe(cannedOption(o.way, plan.cast, true));
      // the road prints the plan's own why per later job; each won middle job's report gets the hope its card was dealt
      const later = ai.calls.filter(c => c.template === 'card' && c.flags.includes('later'));
      const reports = ai.calls.filter(c => c.template === 'report');
      expect(reports.some(r => r.flags.includes('hope'))).toBe(true);
      for (const r of reports.filter(x => x.flags.includes('hope'))) {
        const job = String(r.payload.job);
        const n = plan.episodes.findIndex(e => e.job === job) + 1;
        expect(r.payload.hope).toBe(n === 1 ? plan.episodes[0]!.why : rec.hopes![n - 1]);
        if (n > 1) expect(later.some(c => c.payload.job === job && c.payload.why === r.payload.hope)).toBe(true);
      }
      expect(rec.road!.slice(1).every((l, i) => l === null || l.endsWith(rec.hopes![i + 1]!))).toBe(true);
    }
    if (pipe === 'sides') {
      expect(planCall.flags).toContain('sides');
      const others = plan.cast.filter(c => c.seat !== 'soldier' && c.id !== clientOf(plan).id);
      expect(others.every(c => !!c.side)).toBe(true);
      // cards and reports carry each present person's side, never a part, and never the one the company acts for
      const entries = ai.calls.filter(c => c.template === 'card' || c.template === 'report')
        .flatMap(c => ((c.payload.names ?? c.payload.people ?? []) as Record<string, unknown>[]).map(e => ({ e, flags: c.flags })));
      expect(entries.some(x => x.e.side)).toBe(true);
      for (const x of entries) { expect(x.e.part).toBeUndefined(); expect(x.flags).not.toContain('part'); if (x.e.side) expect(x.flags).toContain('side') }
      expect(entries.filter(x => x.e.name === clientOf(plan).name).every(x => !x.e.side)).toBe(true);
      // a side is told on a person's first appearance, as a memory is: never dealt once a text has shown them
      const sides = (k: ReturnType<typeof newKnowing>) => laterCardPayload(plan, plan.showdown, 'The raid is beaten back.', k, { finale: true, lastchance: false });
      const fresh = sides(newKnowing(plan.cast)), seen = newKnowing(plan.cast);
      for (const c of plan.cast) seen.seen.add(c.id);
      expect((fresh.payload.names as Record<string, unknown>[]).some(e => e.side)).toBe(true);
      expect((sides(seen).payload.names as Record<string, unknown>[]).some(e => e.side)).toBe(false);
      expect(sides(seen).flags).not.toContain('side');
    } else expect(plan.cast.every(c => c.side === undefined)).toBe(true);
  });
});

describe('pipeline arm one: the pick\'s top keyword', () => {
  it('readPick keeps only the first the pick named', () => {
    const k = { arm: 'kit+pick' as const, situations: ['rescue someone'], keywords: ['lantern', 'mill', 'goose'] };
    const payload = { situation: 'rescue someone', keywords: k.keywords };
    expect(readPick({ keywords: ['goose', 'mill'] }, k, payload, KIT_DEAL.one)).toEqual({ keywords: ['goose'], dropped: [], floor: false });
    expect(readPick(null, k, payload, KIT_DEAL.one).keywords).toEqual(['lantern']);
    // no override: kit+pick's keep, as shipped
    expect(readPick({ keywords: ['goose', 'mill'] }, k, payload).keywords).toEqual(['goose', 'mill']);
  });
});

describe('pipeline arm grafts: the plan\'s own why on the road', () => {
  const plan = (whys: string[], extra: Partial<SagaPlan> = {}): SagaPlan => ({
    title: 'The Hollow Oak', question: 'Nobody knows why the boy walked into the forest.', answer: 'The boy saw the reeve hang the wrong man, and the wanderer hid him from the reeve.',
    cast: [
      { id: 'p1', name: 'Flodoard Coalgate', sex: 'male', race: 'human', seat: 'client', focal: false, part: 'asks for help', known: true, label: 'a human petitioner', want: 'find his missing son' },
      { id: 'f1', name: 'Muvulrea', sex: 'female', race: 'elf', seat: 'opponent', focal: true, part: '', known: false, label: 'an elf wanderer', want: '' },
    ],
    episodes: whys.map((why, i) => ({ n: i + 1, type: 'find' as const, title: `Job ${i + 1}`, job: ['Track down the wanderer\'s camp near Greymere', 'Steal the hanging ledger from the hall at Millshaw', 'Find the old mill on the moor'][i]!, people: [], trouble: { who: 'outlaws', carry: 'bows', will: 'shoot' }, win: 'done', gain: ['a map of her trail', 'the hanging ledger', 'a bronze lantern'][i]!, learn: ['A candle burns by a struck-out name in her camp.', 'The last hanging is struck out with a candle mark.', 'The reeve paid the hangman twice.'][i]!, why })),
    showdown: { n: 4, type: 'showdown', title: 'The Oak', job: 'Catch the wanderer at the oak', people: ['f1'], trouble: { who: 'the elf wanderer', carry: 'a longbow', will: 'fight' }, why: '', settles: 'He finds his son.', lose: 'his son', edge: ['', '', ''] },
    options: [], ...extra,
  });
  const w = { seed: { id: null, text: 'find someone who is missing' }, kit: { arm: 'kit+pick' as const, situations: ['find someone who is missing'], keywords: ['gallows', 'crow', 'candle'], picked: { keywords: ['gallows', 'crow', 'candle'] } }, places: ['Greymere', 'Millshaw', 'Hawbourne'], land: 'the Western Forests', cast: [] } as unknown as SagaWorld;
  it('flags a why that names its gain, tells a learn, or says two answer words; one answer word passes', () => {
    const f = whyFlags(plan(['Flodoard hopes she saw which way his son went.', 'Flodoard hopes the ledger shows who was hanged.', 'Flodoard hopes the bronze lantern lights the way.']), w);
    expect(f[1]).toEqual([]);   // "ledger" and "hanged" are the job's own words
    expect(f[2]!.join()).toMatch(/names its gain \(bronze, lantern\)/);
    expect(whyFlags(plan(['x', 'Flodoard hopes the reeve paid the hangman twice.', 'y']), w)[1]!.join()).toMatch(/tells learn 3/);
    expect(whyFlags(plan(['x', 'Flodoard hopes the wanderer will speak.', 'y']), w)[1]).toEqual([]);
    expect(whyFlags(plan(['x', 'Flodoard hopes to learn why the reeve chose the wrong man.', 'y']), w)[1]!.join()).toMatch(/answer words \(reeve, wrong\)/);
  });
  it('the engine owns the subject of each hope', () => {
    const p = plan(['a', 'b', 'c']);
    expect(planHope('Flodoard hopes the ledger shows who was hanged.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes the ledger shows who was hanged.');
    expect(planHope('He can then follow her trail.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate can then follow her trail.');
    expect(planHope('The petitioner hopes to read it', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes to read it.');
    expect(planHope('To learn where the boy went.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes to learn where the boy went.');
  });
  it('a flagged why leaves its road row to the title, and its card and report no hope', () => {
    const p = plan(['Flodoard hopes she saw which way his son went.', 'Flodoard hopes the ledger shows who was hanged.', 'Flodoard hopes the bronze lantern lights the way.']);
    const k = newKnowing(p.cast);
    const g = graftRoad(p, w, k);
    expect(g.hopes).toEqual([null, 'Flodoard Coalgate hopes the ledger shows who was hanged.', null]);
    expect(g.road).toEqual([null, 'Steal the hanging ledger from the hall at Millshaw. Flodoard Coalgate hopes the ledger shows who was hanged.', null]);
    const rows = logLines(questLog(p, k, newState(), { lines: g.road, done: new Map(), at: 1 }, { forLine: false, open: false }));
    expect(rows).toEqual(['Road ahead:', '  ▶ Job 1', `  · ${g.road[1]}`, '  · Job 3', '  · Finale']);
  });
});
