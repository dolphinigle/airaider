// The saga SEED ARMS (docs/STORYTELLER.md North Star 7–8): the theme library (held byte for byte by
// test/sagagolden.test.ts) vs the seed kit — one situation + keyword atoms + a supporting cast with no parts — with or
// without the small pick and premise calls before the plan. The build ships kit+pick. Played here on the mock floor; the lab plays them for real
// (scripts/sagalab/seedlab.ts).
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { dealSaga, castSaga, seedOf, seedPending, keepPicked, piped, SEED_ARM, KIT_CLIENT_PART, PIPE_ARMS, PIPE_ARM, type SeedArm, type SagaPlan, type SagaWorld } from '../src/engine/saga.js';
import { dealKit, KIT, KIT_DEAL, SEED_ARMS } from '../src/engine/seedkit.js';
import { planPayload, pickPayload, premisePayload, readPick, mockPick, seedSteps, cannedOption, clientOf, whyFlags, planHope, graftRoad, newKnowing, newState, questLog, logLines, laterCardPayload, oneResult, troublePhrase, validatePlan, planLint } from '../src/ai/storyteller.js';
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
  it('a trade someone in another live saga has is never dealt again, while any other is free', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: false });
    const region = g.activeRegions()[0]!;
    const held = new Set(['horse dealer', 'toll-keeper', 'miller', 'weaver', 'reeve']);
    for (let i = 0; i < 200; i++) {
      const sup = castSaga(new Rng(i), { focal, personal: false, region, shape: 'heist', taken: () => false, takenTrade: t => held.has(t), kit: { support: 4 } }).cast.slice(2);
      for (const p of sup) expect(held.has(p.trade!)).toBe(false);
      expect(held.has(castSaga(new Rng(i), { focal: g.roster()[0]!, personal: true, region, shape: 'heist', taken: () => false, takenTrade: t => held.has(t) }).cast[1]!.trade!)).toBe(false);
    }
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

// ─── the lab's PIPELINE arms (engine/saga.ts PipeArm; scripts/sagalab/seedlab.ts B2/C2/C3/D1/D2): kit+pick plus one change
// each (D1 and D2: C2 plus one), never set by the build ────────────────────────────────────────────────────────────────────

describe('pipeline arms on the floor', () => {
  it('the build deals grafts (designer 2026-10-04); a host naming none deals R5\'s pipeline (the seed lab\'s A arms)', () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    deal(hostFor(g), chain, undefined, focal);
    expect(PIPE_ARM).toBe('grafts');
    expect(chain.saga!.world.pipe).toBe('grafts');
    expect(chain.saga!.world.kit!.arm).toBe('kit+pick');
    deal({ ...hostFor(g), pipeArm: () => undefined }, chain, undefined, focal);
    expect(chain.saga!.world.pipe).toBeUndefined();
    expect(PIPE_ARMS).toEqual(['one', 'grafts', 'sides', 'reads', 'fixes']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'grafts'))).toEqual(['grafts', 'reads', 'fixes']);
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
    expect(t.includes('outline')).toBe(!piped(w, 'grafts'));
    expect(t.slice(0, 2)).toEqual(['pick', 'plan']);
    const planCall = ai.calls.find(c => c.template === 'plan')!;
    // every key an arm's call carries has a line in its prompt (the payload lint, for the arms' new keys and lines)
    for (const c of ai.calls) for (const key of Object.keys(c.payload)) expect(renderSaga(c.template, c.flags, c.vars), `${c.template} ${key}`).toMatch(new RegExp(`\\b${key}\\b`));
    const cardCalls = ai.calls.filter(c => c.template === 'card'), reportCalls = ai.calls.filter(c => c.template === 'report');
    expect(cardCalls.length).toBe(p.cards.length);
    // the card after a won job opens on the report's summary (reads, D1) or on the plan's forecast `win` (every other arm)
    let differs = 0;
    p.reports.forEach((r, i) => {
      if (r.pos.finale || r.outcome === 'failure') return;
      const next = cardCalls[i + 1]!, win = plan.episodes[r.pos.job - 1]!.win;
      expect(next.payload.latest).toBe(pipe === 'reads' ? r.rep.summary : win);
      if (r.rep.summary !== win) differs++;
    });
    expect(differs).toBeGreaterThan(0);
    // the finale card's stake: on every finale with fixes (D2), beside the trouble's will; else only at a last chance
    const fin = cardCalls[cardCalls.length - 1]!;
    expect(fin.flags).toContain('finale');
    expect(fin.flags.includes('lastchance')).toBe(false);
    expect(fin.flags.includes('lose')).toBe(pipe === 'fixes');
    expect(!!fin.payload.lose).toBe(pipe === 'fixes');
    expect(fin.flags).toContain('will');
    // the finale's result: ONE sentence with fixes (the way, then what it settles), two sentences in every other arm
    const finRep = reportCalls[reportCalls.length - 1]!;
    expect(finRep.flags).toContain('answer');
    expect(String(finRep.payload.result).match(/[.!?](?=\s|$)/g)).toHaveLength(pipe === 'fixes' ? 1 : 2);
    expect(reportCalls.every(c => c.flags.includes('fixes') === (pipe === 'fixes'))).toBe(true);
    // fixes (D2): every call it sends carries its lines; a card's trouble is one phrase; the finale's names keep who loses
    expect([planCall, ...cardCalls].every(c => c.flags.includes('fixes') === (pipe === 'fixes'))).toBe(true);
    expect(cardCalls.every(c => (typeof c.payload.trouble === 'string') === (pipe === 'fixes'))).toBe(true);
    if (pipe === 'fixes') expect((fin.payload.names as { name?: string }[]).some(n => n.name === clientOf(plan).name)).toBe(true);
    if (piped(w, 'grafts')) {
      // the buttons are the engine's; the gold way is never a treasure, and its money is on its button only (designer
      // 2026-10-04): the plan's gloss tells the person going free
      expect(planCall.flags).toContain('grafts');
      const ending = planCall.payload.ending as { ways: { way: string; means: string }[] | string[] };
      if (!personal) expect(JSON.stringify(ending)).not.toMatch(/treasure|\bpa(?:y|ys|id)\b|\bcoin|\bgold\b/i);
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

describe('pipeline arm fixes: the card\'s trouble as one phrase', () => {
  it('joins who, with what and what they will do; a part the plan wrote twice goes', () => {
    const t = { who: 'The merchant\'s dock guards', carry: 'cudgels and a harbor chain', will: 'drive off any stranger asking questions' };
    expect(troublePhrase(t, true)).toBe('The merchant\'s dock guards with cudgels and a harbor chain, who will drive off any stranger asking questions');
    expect(troublePhrase(t, false)).toBe('The merchant\'s dock guards with cudgels and a harbor chain');
    expect(troublePhrase({ who: 'a bear', carry: 'with teeth and claws', will: 'will maul anyone near.' }, true)).toBe('a bear with teeth and claws, who will maul anyone near');
    expect(troublePhrase({ who: 'outlaws', carry: '', will: 'they will shoot' }, true)).toBe('outlaws, who will shoot');
  });
});

describe('pipeline arm fixes: the plan\'s own repairs and lints', () => {
  it('the trouble\'s `with` fills carry; the company keeps no owner but the player; an edge or loss off the showdown\'s trouble is logged', () => {
    seedIdCounter(1);
    const { g } = newGame(31);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    const w = deal(hostFor(g), chain, undefined, focal).world;
    w.pipe = 'fixes';
    const client = w.cast.find(p => p.seat === 'client')!, target = w.cast.find(p => p.id === w.focalId)!;
    const pos = client.sex === 'female' ? 'her' : 'his';
    const ep = (n: number) => ({ type: n === 1 ? 'find' : 'sneak', title: `Job ${n}`, job: `Find the boat at ${w.places[0]}`, why: `${client.name} hopes the fisher will take ${pos} company to the island.`, people: [target.id],
      trouble: { who: 'dock guards', with: 'cudgels', will: 'drive off strangers' }, win: 'The fisher is found.', gain: 'the fisher\'s boat', learn: 'Boats leave by night.' });
    const raw = { title: 'T', question: 'Nobody knows why.', answer: 'Because.', cast: w.cast.map(p => ({ id: p.id, label: `a ${p.race} ${p.trade ?? 'farmer'}` })), asker: { want: 'win the race' },
      episodes: [ep(1), ep(2)], showdown: { title: 'S', job: `Catch the ${target.trade ?? 'thief'} at the shore`, people: [target.id], trouble: { who: 'hired guards', with: 'swords', will: 'sail off with the cargo' }, edge: ['The boat gets the company to the shore', 'A song is sung'], settles: `${client.name} wins.`, lose: 'her good name' } };
    const v = validatePlan(raw, { w, avoid: [] } as never);
    expect(v.plan).not.toBeNull();
    expect(v.plan!.episodes[0]!.trouble.carry).toBe('cudgels');
    expect(v.plan!.showdown.trouble.carry).toBe('swords');
    expect(v.plan!.episodes[0]!.why).toBe(`${client.name} hopes the fisher will take the company to the island.`);
    expect(v.repairs.some(r => r.startsWith('owned company'))).toBe(true);
    const lint = planLint(v.plan!, w);
    expect(lint).toContain('edge 2 names nothing of the showdown\'s job or trouble');
    expect(lint.some(l => l.startsWith('edge 1 names nothing'))).toBe(false);
    expect(lint).toContain('lose shares nothing with the showdown\'s trouble');
    // the build's plan: no `fixes` repairs or lints
    delete w.pipe;
    const b = validatePlan(raw, { w, avoid: [] } as never);
    expect(b.plan!.episodes[0]!.why).toContain(`${pos} company`);
    expect(planLint(b.plan!, w).some(l => /names nothing|shares nothing/.test(l))).toBe(false);
  });
});

describe('pipeline arm fixes: the finale\'s result as one sentence', () => {
  const cast = [
    { id: 'p1', name: 'Patty Reed', sex: 'female', race: 'human', seat: 'client', focal: false, part: 'asks for help', known: true, label: 'a human widow', want: 'take back the ring' },
    { id: 'f1', name: 'Muvulrea', sex: 'female', race: 'elf', seat: 'opponent', focal: true, part: '', known: false, label: 'an elf wanderer', want: '' },
  ] as SagaPlan['cast'];
  const plan = { cast } as SagaPlan;
  it('joins the way and what it settles; a name or a place keeps its capital', () => {
    expect(oneResult("Muvulrea is taken to the fort's cells.", 'Patty gets the ring back.', plan, [])).toBe("Muvulrea is taken to the fort's cells, and Patty gets the ring back.");
    expect(oneResult("Muvulrea slips out of the company's reach, for now.", 'The forest is felled.', plan, [])).toBe("Muvulrea slips out of the company's reach, for now, and the forest is felled.");
    expect(oneResult('Muvulrea joins the company.', 'Greymere is safe again.', plan, ['Greymere'])).toBe('Muvulrea joins the company, and Greymere is safe again.');
    expect(oneResult('Muvulrea joins the company.', '', plan, [])).toBe('Muvulrea joins the company.');
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
    // a phrase fronted before the asker's own clause takes "that", and the asker inside becomes a pronoun
    expect(planHope('With the boat, Flodoard can follow the mare across the water.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes that with the boat, he can follow the mare across the water.');
    expect(planHope('Once Muvulrea talks, he will know where the boy went', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes that once Muvulrea talks, he will know where the boy went.');
    // ...and a fronted phrase before someone else's clause stays as it was
    expect(planHope('With the map, the company can reach the oak.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes with the map, the company can reach the oak.');
    // a why already governed by the asker's verb is not a fronted phrase
    expect(planHope('Flodoard hopes that once he has the key, he can open the chest.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes that once he has the key, he can open the chest.');
    expect(planHope('Hoping that with the key, he can open the chest.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes that with the key, he can open the chest.');
  });
  it('a name with particles or an epithet goes whole as the subject', () => {
    for (const name of ['Vyell the Quiet', 'Ariald of the Marches']) {
      const p = plan(['a', 'b', 'c']);
      p.cast[0]!.name = name;
      expect(planHope(`${name} can then keep his inn safe.`, p, name)).toBe(`${name} can then keep his inn safe.`);
      expect(planHope(`${name} hopes the men will leave.`, p, name)).toBe(`${name} hopes the men will leave.`);
      expect(planHope(`With the boat, ${name} can follow the mare.`, p, name)).toBe(`${name} hopes that with the boat, he can follow the mare.`);
    }
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
