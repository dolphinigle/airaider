// The saga SEED ARMS (docs/STORYTELLER.md North Star 7–8): the theme library (held byte for byte by
// test/sagagolden.test.ts) vs the seed kit — one situation + keyword atoms + a supporting cast with no parts — with or
// without the small pick and premise calls before the plan. The build ships kit+pick. Played here on the mock floor; the lab plays them for real
// (scripts/sagalab/seedlab.ts).
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { dealSaga, castSaga, seedOf, seedPending, keepPicked, piped, SEED_ARM, KIT_CLIENT_PART, PIPE_ARMS, PIPE_ARM, GAME_PIPE, type SeedArm, type SagaPlan, type SagaWorld } from '../src/engine/saga.js';
import { dealKit, KIT, KIT_DEAL, SEED_ARMS, plainAtom, plainKeywords } from '../src/engine/seedkit.js';
import { planPayload, pickPayload, premisePayload, readPick, mockPick, seedSteps, cannedOption, clientOf, whyFlags, planHope, graftRoad, newKnowing, newState, questLog, logLines, laterCardPayload, oneResult, troublePhrase, validatePlan, planLint, haveOf, readLate, choiceTarget, mockPlan, cardWhy, capFor, pageChecks, grownLine, dealtWords, namedIn, roleOf, ownCost, askerWant, withLead, wantPhrase, knowingOf, wantWhy, withLatest, forWho } from '../src/ai/storyteller.js';
import type { AiProvider, SagaCall } from '../src/ai/provider.js';
import { newGame, sagaChain, playSaga, hostFor } from './sagaharness.js';
import { renderSaga, sagaTemplate } from '../src/ai/prompts/saga/render.js';
import { deal, standsFact } from '../src/game/sagaflow.js';

const POOLS = ['things', 'creatures', 'places', 'occasions', 'uncanny'] as const;
const poolOf = (x: string) => POOLS.find(p => KIT[p].includes(x) || (p === 'things' && KIT.qualities.some(q => x.startsWith(`${q} `) && KIT.things.includes(x.slice(q.length + 1)))));

describe('the seed kit deal', () => {
  it('the build ships kit+pick, the seed lab\'s follow winner (reports/2026-10-04-seed-arms.md)', () => expect(SEED_ARM).toBe('kit+pick'));
  it('no keyword atom is also a field a saga prompt glosses (stack-round verifier: the keyword "seed" beside the field "seed: … never pasted")', () => {
    const fields = new Set((['plan', 'pick', 'premise', 'card', 'report'] as const).flatMap(t => [...sagaTemplate(t).matchAll(/(?<![\w-])([a-z_]+):/g)].map(m => m[1]!)));
    expect(fields).toContain('seed');
    const atoms = (['things', 'creatures', 'places', 'occasions', 'qualities', 'uncanny'] as const).flatMap(p => KIT[p]);
    expect(atoms.filter(a => fields.has(a.toLowerCase()))).toEqual([]);
  });
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
    expect(PIPE_ARMS).toEqual(['one', 'grafts', 'sides', 'reads', 'fixes', 'late', 'trail', 'narrow', 'line', 'plain', 'link', 'fx', 'room', 'weight', 'voice', 'lore', 'page', 'past', 'clean', 'voice+line', 'past+voice', 'voice+clean', 'voice+asker', 'voice+setback', 'voice+stands', 'past+return', 'past+trait', 'voice+reach', 'voice+log', 'past+log', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'grafts'))).toEqual(['grafts', 'reads', 'fixes', 'late', 'trail', 'narrow', 'line', 'plain', 'link', 'fx', 'room', 'weight', 'voice', 'lore', 'page', 'past', 'clean', 'voice+line', 'past+voice', 'voice+clean', 'voice+asker', 'voice+setback', 'voice+stands', 'past+return', 'past+trait', 'voice+reach', 'voice+log', 'past+log', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    // round T: each arm is grafts plus its own change, and no other round-T arm carries it (judged against G0's draws on disk);
    // the verifier's shared fixes (clean) ride on no round-T arm. The stack round (S1–S3): a shipped arm plus one change
    for (const part of ['room', 'weight', 'lore', 'page'] as const) expect(PIPE_ARMS.filter(p => piped({ pipe: p }, part))).toEqual([part]);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'past'))).toEqual(['past', 'past+voice', 'past+return', 'past+trait', 'past+log', 'past+trouble', 'past+want']);
    // chain B's inputs (CBR, CBT): the game's personal pipe (cost fix included) plus the shared `event` and one dealt item each
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'event'))).toEqual(['past+return', 'past+trait']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'returner'))).toEqual(['past+return']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'trait'))).toEqual(['past+trait']);
    expect([GAME_PIPE.personal, GAME_PIPE.other].some(p => ['event', 'returner', 'trait'].some(x => piped({ pipe: p }, x as 'event')))).toBe(false);
    // RFW shipped (chain-B round §2.4): both game pipes deal a failed job's report the widened fact
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'reach'))).toEqual(['voice', 'past', 'voice+reach', 'voice+log', 'past+log', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    expect([GAME_PIPE.personal, GAME_PIPE.other].every(p => piped({ pipe: p }, 'stands') && piped({ pipe: p }, 'reach'))).toBe(true);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'clean'))).toEqual(['clean', 'voice+clean']);
    // voice (TC) is three pieces: card 1's line (the plan's), a won clue's witness, the finale's teller; S2 takes the teller, and
    // its card-1 line is the past's own first sentence (quote)
    // (round H: HP keeps `says` for a personal saga, whose soldier has no hired asker's past to stand in its place)
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'says'))).toEqual(['voice', 'voice+line', 'voice+clean', 'voice+asker', 'voice+setback', 'voice+stands', 'voice+reach', 'voice+log', 'voice+trouble', 'voice+want', 'voice+want+link']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'teller'))).toEqual(['voice', 'voice+line', 'past+voice', 'voice+clean', 'voice+asker', 'voice+setback', 'voice+stands', 'voice+reach', 'voice+log', 'voice+trouble', 'voice+want', 'voice+want+link']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'witness'))).toEqual(['voice', 'voice+line', 'voice+clean', 'voice+asker', 'voice+setback', 'voice+stands', 'voice+reach', 'voice+log', 'voice+trouble', 'voice+want', 'voice+want+link']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'quote'))).toEqual(['past+voice']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'motive'))).toEqual(['voice+line', 'voice+trouble', 'past+trouble']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'asker'))).toEqual(['voice+asker']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'setback'))).toEqual(['voice+setback']);
    // RFA: RF part (a) alone, on TC as measured (no cost fix); RFW (its fact widened) shipped on the game's two pipes; the cost
    // fix rides on the game's two pipes only
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'stands'))).toEqual(['voice', 'past', 'voice+stands', 'voice+reach', 'voice+log', 'past+log', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'owncost'))).toEqual(['voice', 'past', 'past+return', 'past+trait', 'voice+log', 'past+log', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    expect([GAME_PIPE.personal, GAME_PIPE.other].every(p => piped({ pipe: p }, 'owncost'))).toBe(true);
    // the So far log (designer 2026-10-05) rides on the game's two pipes only; the lab's controls (LV, LP) are exactly those
    // pipes minus it, so NV vs LV and NP vs LP differ by the log alone
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'sofar'))).toEqual(['voice', 'past', 'voice+trouble', 'past+trouble', 'voice+want', 'voice+want+link', 'past+want']);
    const parts = ['one', 'grafts', 'sides', 'reads', 'fixes', 'late', 'trail', 'narrow', 'line', 'plain', 'link', 'fx', 'room', 'weight', 'lore', 'page', 'past',
      'clean', 'says', 'witness', 'teller', 'quote', 'motive', 'asker', 'setback', 'stands', 'owncost', 'event', 'returner', 'trait', 'reach', 'sofar', 'want'] as const;
    for (const [game, log] of [['voice', 'voice+log'], ['past', 'past+log']] as const)
      expect(parts.filter(x => piped({ pipe: log }, x))).toEqual(parts.filter(x => x !== 'sofar' && piped({ pipe: game }, x)));
    // the trouble line on the game's pipes (NT, PT; lab only): exactly the shipped pipe plus line + motive
    for (const [game, arm] of [['voice', 'voice+trouble'], ['past', 'past+trouble']] as const)
      expect(parts.filter(x => piped({ pipe: arm }, x))).toEqual(parts.filter(x => ['line', 'motive'].includes(x) || piped({ pipe: game }, x)));
    expect([GAME_PIPE.personal, GAME_PIPE.other].some(p => piped({ pipe: p }, 'line'))).toBe(false);
    // whom it is for, without the log (NW, NWL; PW; lab only): the shipped pipe plus want, and plus link
    for (const [game, want] of [['voice', 'voice+want'], ['past', 'past+want']] as const)
      expect(parts.filter(x => piped({ pipe: want }, x))).toEqual(parts.filter(x => x === 'want' || piped({ pipe: game }, x)));
    expect(parts.filter(x => piped({ pipe: 'voice+want+link' }, x))).toEqual(parts.filter(x => x === 'link' || piped({ pipe: 'voice+want' }, x)));
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'want'))).toEqual(['voice+want', 'voice+want+link', 'past+want']);
    // each E arm is grafts plus its own change, and no other arm carries it; each F arm too, and FX carries all three
    for (const part of ['late', 'trail', 'narrow'] as const) expect(PIPE_ARMS.filter(p => piped({ pipe: p }, part))).toEqual([part]);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'line'))).toEqual(['line', 'fx', 'voice+line', 'voice+trouble', 'past+trouble']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'plain'))).toEqual(['plain', 'fx']);
    expect(PIPE_ARMS.filter(p => piped({ pipe: p }, 'link'))).toEqual(['link', 'fx', 'voice+want+link']);
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
    // the card after a won job opens on the report's summary (reads, D1) or on the plan's forecast `win` (every other arm;
    // clean: with a met person's name in place of their label, as the card's names entry calls them)
    const metIn = (c: SagaCall) => ({ met: new Set(plan.cast.filter(q => (c.payload.names as { name?: string }[]).some(n => n.name === q.name)).map(q => q.id)), named: new Set<string>(), seen: new Set<string>() });
    let differs = 0;
    p.reports.forEach((r, i) => {
      if (r.pos.finale || r.outcome === 'failure') return;
      const next = cardCalls[i + 1]!, win = plan.episodes[r.pos.job - 1]!.win;
      // (link under want, NWL: the next job's lead after it — the showdown's too, the last job won)
      const nextLead = piped(w, 'want') && piped(w, 'link') && !next.flags.includes('retry') ? (next.flags.includes('finale') ? plan.showdown : plan.episodes[r.pos.job])?.lead : undefined;
      expect(next.payload.latest).toBe(pipe === 'reads' ? r.rep.summary : piped(w, 'clean') ? namedIn(win ?? '', plan, metIn(next)) : withLatest(win!, nextLead));
      if (r.rep.summary !== win) differs++;
    });
    expect(differs).toBeGreaterThan(0);
    // the finale card's stake: on every finale with fixes (D2), beside the trouble's will; else only at a last chance
    const fin = cardCalls[cardCalls.length - 1]!;
    expect(fin.flags).toContain('finale');
    expect(fin.flags.includes('lastchance')).toBe(false);
    expect(fin.flags.includes('lose')).toBe(pipe === 'fixes');
    expect(!!fin.payload.lose).toBe(pipe === 'fixes');
    // (pipe arm line, F1: the trouble is one sentence, its will inside it — no `will` part)
    expect(fin.flags.includes('will')).toBe(!piped(w, 'line'));
    // the finale's result: ONE sentence with fixes (the way, then what it settles), two sentences in every other arm
    const finRep = reportCalls[reportCalls.length - 1]!;
    expect(finRep.flags).toContain('answer');
    expect(String(finRep.payload.result).match(/[.!?](?=\s|$)/g)).toHaveLength(pipe === 'fixes' ? 1 : 2);
    expect(reportCalls.every(c => c.flags.includes('fixes') === (pipe === 'fixes'))).toBe(true);
    // fixes (D2): every call it sends carries its lines; a card's trouble is one phrase; the finale's names keep who loses
    expect([planCall, ...cardCalls].every(c => c.flags.includes('fixes') === (pipe === 'fixes'))).toBe(true);
    // (pipe arm line, F1: one sentence on every card but a retry, which is dealt none)
    const lineRetry = (c: SagaCall) => piped(w, 'line') && c.flags.includes('retry');
    expect(cardCalls.filter(c => !lineRetry(c)).every(c => (typeof c.payload.trouble === 'string') === (pipe === 'fixes' || piped(w, 'line') || piped(w, 'clean')))).toBe(true);
    expect(cardCalls.filter(lineRetry).every(c => !('trouble' in c.payload))).toBe(true);
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
        // (pipe arm clean: a why the road kept off is checked again when its card comes, and a met person's name replaces
        // their label — the report's hope is the card's why, below)
        if (!piped(w, 'clean')) expect(r.payload.hope).toBe(n === 1 ? plan.episodes[0]!.why : rec.hopes![n - 1]);
        // (pipe arm link, F3: the card's why is the job's lead, then that same hope; pipe part want, NW: whom the job is for and
        // their want, then that hope after its subject — the lead, NWL, rides in `latest`)
        const hopeTail = String(r.payload.hope).slice(clientOf(plan).name.length);
        if (n > 1) expect(later.some(c => c.payload.job === job && (piped(w, 'want') ? String(c.payload.why).endsWith(hopeTail) && String(c.payload.why).startsWith(`${clientOf(plan).name}, `)
          : piped(w, 'link') ? String(c.payload.why).endsWith(` ${String(r.payload.hope)}`) : c.payload.why === r.payload.hope))).toBe(true);
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
    // ...but a clause opener before someone else's clause takes "that": never "<who> hopes if …" (no recorded why changes)
    expect(planHope('If the reeve is shamed, the village may take him back.', p, 'Flodoard Coalgate')).toBe('Flodoard Coalgate hopes that if the reeve is shamed, the village may take him back.');
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

// ─── round E (scripts/sagalab/seedlab.ts E1/E2/E3): grafts plus one change each, never the build's ─────────────────────────

describe('pipeline arm late (E1): the finale written after play', () => {
  for (const [path, personal] of [['clean', false], ['lastchance', false], ['personal', true]] as const) it(`${path}: one showdown call when the finale comes; the finale card and report use it`, async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: path === 'lastchance' ? 4 : 3, personal });
    let before: { lines: number; latest: string; held: string[]; known: string[] } | undefined;
    const p = await playSaga(g, chain, path, focal, pos => {
      const r = chain.saga!;
      if (pos.finale) before = { lines: r.lines.length, latest: r.lines.at(-1)!.text, held: haveOf(r.plan!, r.state, false) as string[], known: [...r.state.learned] };
    }, { pipeArm: () => 'late' });
    const rec = chain.saga!, plan = rec.plan!;
    const t = ai.calls.map(c => c.template);
    expect(t.filter(x => x === 'showdown')).toHaveLength(1);
    const at = t.indexOf('showdown');
    // after the last report before the finale, and before the finale card
    expect(t.slice(at + 1)).toEqual(['card', 'report']);
    expect(ai.calls[at]!.tier).toBe('plan');
    expect(ai.calls[at]!.effort).toBe('low');
    const sd = ai.calls[at]!.payload as { mystery: { question: string; secret: string }; people: Record<string, unknown>[]; ways: string[]; places: string[]; now: { held?: { holds: string; use?: string }[]; known?: string[]; latest: string } };
    expect(sd.mystery).toEqual({ question: plan.question, secret: plan.answer });
    expect(sd.now.latest).toBe(before!.latest);
    // each held thing with the use the plan's edge gives it: the finale report shows each used against what this call writes
    expect((sd.now.held ?? []).map(h => h.holds)).toEqual(before!.held);
    for (const h of sd.now.held ?? []) { const e = plan.episodes.find(x => x.gain === h.holds)!; expect(h.use).toBe(plan.showdown.edge?.[e.n - 1]?.trim() || undefined) }
    expect(sd.now.known ?? []).toEqual(before!.known);
    expect(sd.places).toEqual(rec.world.places);
    expect(sd.people.filter(e => e.asker)).toHaveLength(1);
    expect(sd.people.filter(e => e.ending)).toHaveLength(1);
    // never an id, never the name of someone the player has not met
    const json = JSON.stringify(sd);
    for (const c of plan.cast) { expect(json).not.toMatch(new RegExp(`"${c.id}"`)); if (!rec.knowing.met.includes(c.id)) expect(json).not.toContain(c.name) }
    if (!personal) expect(JSON.stringify(sd.ways)).not.toMatch(/treasure|\bpa(?:y|ys|id)\b|\bcoin|\bgold\b/i);
    // the floor's reply is the plan's own showdown: the finale card gets its job and trouble, and no why (R5 verify 2)
    expect(rec.late).toEqual({ job: plan.showdown.job, trouble: plan.showdown.trouble, lose: plan.showdown.lose });
    const fin = ai.calls[at + 1]!, finRep = ai.calls[at + 2]!;
    expect(fin.flags).toContain('finale');
    expect(fin.payload.job).toBe(rec.late!.job);
    expect(fin.flags).not.toContain('why');
    expect(fin.flags.includes('lastchance')).toBe(path === 'lastchance');
    expect(finRep.payload.job).toBe(rec.late!.job);
    expect(p.cards.at(-1)!.out.job).toBe(rec.late!.job);
    // the record stays JSON
    expect(JSON.parse(JSON.stringify(rec))).toEqual(rec);
  });
  it('the late fields replace the plan\'s; a failed call leaves the plan\'s showdown', async () => {
    for (const fail of [false, true]) {
      seedIdCounter(1);
      const { g, ai } = newGame(23);
      const late = { job: 'Corner the ending person at the ford of the asker\'s mill', trouble: { who: 'hired river men', with: 'boathooks', will: 'cut the ferry loose' }, lose: 'the asker\'s mill' };
      const inner = ai.sagaCall.bind(ai);
      ai.sagaCall = async (c: SagaCall) => { if (c.template !== 'showdown') return inner(c); ai.calls.push(c); if (fail) throw new Error('down'); return late };
      const { chain, focal } = sagaChain(g, { N: 3, personal: false });
      const dev: string[] = [];
      await playSaga(g, chain, 'clean', focal, undefined, { pipeArm: () => 'late', log: (_k, t) => dev.push(t) });
      const rec = chain.saga!, plan = rec.plan!, k = rec.knowing;
      const fin = ai.calls.filter(c => c.template === 'card').at(-1)!, finRep = ai.calls.filter(c => c.template === 'report').at(-1)!;
      if (fail) {
        expect(rec.late).toBeNull();
        expect(fin.payload.job).toBe(plan.showdown.job);
        expect(fin.flags).not.toContain('why');
        expect(dev.some(l => /late showdown: the call failed.*showdown stood in/.test(l))).toBe(true);
        continue;
      }
      // the prompt's words for the people become them: the asker by name, the person in ending by label (unmet)
      const client = clientOf(plan), target = choiceTarget(plan);
      const tName = k.met.includes(target.id) ? target.name : `the ${target.label.replace(/^an? /, '')}`;
      expect(rec.late!.job).toBe(`Corner ${tName} at the ford of ${client.name}'s mill`);
      expect(rec.late!.trouble).toEqual({ who: 'hired river men', carry: 'boathooks', will: 'cut the ferry loose' });
      expect(fin.payload.job).toBe(rec.late!.job);
      expect((fin.payload.trouble as { who: string }).who).toBe('hired river men');
      expect(fin.flags).not.toContain('why');
      expect(finRep.payload.job).toBe(rec.late!.job);
      expect(plan.showdown.job).not.toBe(rec.late!.job);   // the plan itself is untouched
      expect(dev.some(l => /late showdown lint .*trouble names nobody in cast/.test(l))).toBe(true);
    }
  });
  it('its prompt scopes the secret to what is known, and asks for no why', () => {
    const sys = renderSaga('showdown', []);
    expect(sys).toContain('Shown before play: none of the secret beyond known;');
    expect(sys).not.toContain('"why"');
  });
  it('a reply with no job, foe or loss is none', () => {
    const plan = { cast: [{ id: 'p1', name: 'Ada Reed', sex: 'female', race: 'human', seat: 'client', focal: false, part: '', known: true, label: 'a human miller', want: 'keep her mill' }, { id: 'f1', name: 'Oskar', sex: 'male', race: 'human', seat: 'opponent', focal: true, part: '', known: false, label: 'a human steward', want: '' }] } as SagaPlan;
    const w = { personal: false } as SagaWorld, k = newKnowing(plan.cast);
    expect(readLate({ job: 'Face the steward', trouble: { who: 'his men' } }, plan, w, k)).toMatchObject({ late: null, missing: ['lose'] });
    expect(readLate(null, plan, w, k).missing).toEqual(['job', 'who', 'lose']);
    // an unmet name the reply somehow wrote goes back to its label
    expect(readLate({ job: 'Catch Oskar at the weir', trouble: { who: 'Oskar and his men' }, lose: 'her mill' }, plan, w, k).late!.job).toBe('Catch the human steward at the weir');
  });
});

describe('pipeline arm trail (E2): the clues written first', () => {
  it('the plan writes its trail after the answer; each job\'s learn is its trail item', async () => {
    for (const personal of [false, true]) {
      seedIdCounter(1);
      const { g, ai } = newGame(21);
      const { chain, focal } = sagaChain(g, { N: 4, personal });
      await playSaga(g, chain, 'clean', focal, undefined, { pipeArm: () => 'trail' });
      const planCall = ai.calls.find(c => c.template === 'plan')!, plan = chain.saga!.plan!;
      expect(planCall.flags).toContain('trail');
      const sys = renderSaga('plan', planCall.flags, planCall.vars);
      expect(sys).toMatch(/"answer": "text", "trail": \["text"\], "episodes"/);
      expect(sys).not.toContain('"learn"');
      expect(sys).toContain('trail: one clue per episode, in order:');
      expect(sys).toContain('together they leave the answer\'s why to the showdown');
      expect(sys).toContain('win: what success changes, naming who or what, never its clue.');
      const raw = planCall.floor() as { trail: string[]; episodes: Record<string, unknown>[] };
      expect(raw.episodes.every(e => !('learn' in e))).toBe(true);
      expect(plan.episodes.map(e => e.learn)).toEqual(raw.trail);
    }
  });
  it('a short trail falls back to a learn the job wrote, else a defect; extra items are cut', () => {
    seedIdCounter(1);
    const { g } = newGame(31);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    const w = deal({ ...hostFor(g), pipeArm: () => 'trail' }, chain, undefined, focal).world;
    const raw = mockPlan({ w }, 'x') as { trail: string[]; episodes: Record<string, unknown>[] };
    const ok = validatePlan(raw, { w });
    expect(ok.defects).toEqual([]);
    expect(ok.plan!.episodes.map(e => e.learn)).toEqual(raw.trail);
    expect(validatePlan({ ...raw, trail: [...raw.trail, 'a third clue'] }, { w }).repairs).toContain('1 extra trail item(s) cut');
    expect(validatePlan({ ...raw, trail: raw.trail.slice(0, 1) }, { w }).defects).toContain('missing episode 2 learn');
    const own = validatePlan({ ...raw, trail: raw.trail.slice(0, 1), episodes: raw.episodes.map(e => ({ ...e, learn: 'its own clue' })) }, { w });
    expect(own.plan!.episodes.map(e => e.learn)).toEqual([raw.trail[0], 'its own clue']);
    expect(own.repairs).toContain('episode 2 learn kept from the episode: no trail item');
    // the build's plan ignores a trail: each job's own learn stands, and its win line is the build's
    expect(renderSaga('plan', ['types', 'keywords', 'support', 'grafts'])).toContain('win: what success changes, naming who or what. gain:');
    delete w.pipe;
    expect(validatePlan({ ...raw, episodes: raw.episodes.map(e => ({ ...e, learn: 'its own clue' })) }, { w }).plan!.episodes.map(e => e.learn)).toEqual(['its own clue', 'its own clue']);
  });
});

describe('pipeline arm narrow (E3): the report\'s hope, D2\'s line alone', () => {
  it('a won job\'s report with a hope carries narrow, and nothing else of D2', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    await playSaga(g, chain, 'clean', focal, undefined, { pipeArm: () => 'narrow' });
    const reports = ai.calls.filter(c => c.template === 'report');
    expect(reports.some(r => r.flags.includes('hope'))).toBe(true);
    for (const r of reports) {
      expect(r.flags.includes('narrow')).toBe(r.flags.includes('hope'));
      expect(r.flags).not.toContain('fixes');
      const hope = renderSaga('report', r.flags, r.vars).split('\n').find(l => l.startsWith('- hope:'));
      if (r.flags.includes('hope')) expect(hope).toBe('- hope: what result, brought and clue miss, show as still hoped.');
    }
    expect(ai.calls.every(c => !c.flags.includes('fixes'))).toBe(true);
  });
});

describe('the build sends none of round E', () => {
  it('no showdown call, no trail, no narrow, on the build\'s own pipeline', async () => {
    for (const path of ['clean', 'lastchance'] as const) {
      seedIdCounter(1);
      const { g, ai } = newGame(21);
      const { chain, focal } = sagaChain(g, { N: 4, personal: false });
      await playSaga(g, chain, path, focal);
      expect(chain.saga!.world.pipe).toBe('grafts');
      expect(chain.saga!.late).toBeUndefined();
      expect(ai.calls.some(c => c.template === 'showdown')).toBe(false);
      expect(ai.calls.some(c => c.flags.includes('trail') || c.flags.includes('narrow'))).toBe(false);
      const fin = ai.calls.filter(c => c.template === 'card').at(-1)!;
      expect(fin.payload.job).toBe(chain.saga!.plan!.showdown.job);
      expect(fin.flags).not.toContain('why');
    }
  });
});

// ─── round F (scripts/sagalab/seedlab.ts F1/F2/F3/FX): grafts plus one INPUT change each, never the build's ────────────────

describe('pipeline arm line (F1): the trouble as one sentence', () => {
  it('each type is dealt who stands against it; the plan writes one sentence; every card gets it whole, card 1 too', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    await playSaga(g, chain, 'bumpy', focal, undefined, { pipeArm: () => 'line' });
    const plan = chain.saga!.plan!;
    const planCall = ai.calls.find(c => c.template === 'plan')!;
    expect(planCall.flags).toContain('line');
    const types = planCall.payload.types as { type: string; against?: string }[];
    expect(types.every(t => !!t.against)).toBe(true);
    expect(types.find(t => t.type === 'talk')!.against).toBe('the one to win over, for a reason of their own');
    for (const e of [...plan.episodes, plan.showdown]) { expect(e.trouble.line).toMatch(/\bwill\b.*,/); expect([e.trouble.who, e.trouble.carry, e.trouble.will]).toEqual(['', '', '']) }
    const cards = ai.calls.filter(c => c.template === 'card');
    for (const c of cards) { expect(c.flags).toContain('line'); expect(c.flags).not.toContain('will') }
    expect(cards[0]!.payload.trouble).toBe(plan.episodes[0]!.trouble.line);
    expect(cards.at(-1)!.payload.trouble).toBe(plan.showdown.trouble.line);
    // a retry gets none (its retry line is what that trouble did), and its prompt glosses and orders none
    const retry = cards.find(c => c.flags.includes('retry'));
    expect(retry).toBeDefined();
    expect('trouble' in retry!.payload).toBe(false);
    for (const c of cards.filter(x => !x.flags.includes('retry'))) expect(typeof c.payload.trouble).toBe('string');
    // every card's cap follows its data, never past the old caps (70; the finale 90)
    for (const c of cards) expect(c.vars.MAX).toBe(capFor(c.payload, c.flags.includes('finale') ? 90 : 70));
  });
  it('its prompts: the plan asks one sentence from the type, never "armed people or a beast"; the card glosses who and why', () => {
    const base = ['types', 'keywords', 'support', 'grafts'];
    // (the plan payload sends `against` with line: who stands against each type)
    const plan = renderSaga('plan', [...base, 'line', 'against']), plain = renderSaga('plan', base);
    expect(plan).toContain('types: what soldiers do, the kind of win, who stands against it.');
    expect(plan).toContain('trouble: one sentence: who stands against this job (from its type; by label if in cast), what they will do, and why.');
    expect(plan.match(/"trouble": "≤20 words"/g)).toHaveLength(2);
    expect(plan).not.toMatch(/armed people or a beast|"carry"|"will": /);
    expect(plain).toContain('(by label if in cast; armed people or a beast), with what, what they will do.');
    // the card's gloss is a noun the writer cannot say as a sentence of its own ("He stands in your way.")
    const card = renderSaga('card', ['first', 'why', 'line'], { MAX: 70 });
    expect(card).toContain('why: why it matters. trouble: the obstacle.\n');
    expect(card).toContain('in this order: premise, job, why, trouble.');
    expect(card).not.toMatch(/carry|foe|stands/);
    // a retry has no trouble: neither glossed nor ordered; the build's retry card keeps its own, byte for byte
    const retry = renderSaga('card', ['later', 'retry', 'why', 'line'], { MAX: 70 });
    expect(retry).not.toContain('trouble');
    expect(retry).toContain('in this order: retry, job, why.');
    const built = renderSaga('card', ['later', 'retry', 'why'], { MAX: 70 });
    expect(built).toContain('why: why it matters. trouble: the foe, what they carry.');
    expect(built).toContain('in this order: retry, job, why, trouble.');
  });
  it('capFor: about 1.4 words per dealt word, rounded up to 5, at least 45, never past the ceiling; names count only what the card must tell', () => {
    const w = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    expect(capFor({ latest: w(12), job: w(18), trouble: w(18), names: [{ name: 'Benjamund', label: 'a merchant', sex: 'man' }] }, 90)).toBe(70);
    expect(capFor({ job: w(10), trouble: w(10) }, 90)).toBe(45);
    expect(capFor({ premise: { who: w(2), wants: w(30), unknown: w(20) }, job: w(20), why: w(30), trouble: w(20) }, 70)).toBe(70);
    expect(capFor({ job: w(20), trouble: w(20), direction: w(40), names: [{ name: 'Urfon Reed', label: 'a human fisher', sex: 'man', intro: true }] }, 90)).toBe(65);
  });
  it('an object written anyway is joined into one line; the default still needs its object', () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    deal({ ...hostFor(g), pipeArm: () => 'line' }, chain, undefined, focal);
    const w = chain.saga!.world;
    const raw = mockPlan({ w }, 'k') as { episodes: Record<string, unknown>[] };
    raw.episodes[0]!.trouble = { who: 'the reeve\'s men', carry: 'clubs', will: 'drive you off' };
    const v = validatePlan(raw, { w });
    expect(v.defects).toEqual([]);
    expect(v.plan!.episodes[0]!.trouble.line).toBe('The reeve\'s men with clubs, who will drive you off.');
    expect(v.repairs.join()).toMatch(/trouble parts joined into one line in episode 1/);
    // the build's pipeline: a sentence where the object belongs is a missing trouble, as before (one plain re-draw)
    const def = { ...w, pipe: 'grafts' as const };
    const sraw = mockPlan({ w: def }, 'k') as { episodes: Record<string, unknown>[] };
    sraw.episodes[0]!.trouble = 'The reeve\'s men will drive you off, for the reeve pays them.';
    expect(validatePlan(sraw, { w: def }).defects).toContain('missing trouble in episode 1');
  });
});

describe('pipeline arm plain (F2): no quality glued onto a thing', () => {
  it('plainAtom strips a dealt quality from a thing only', () => {
    const q = KIT.qualities[0]!, t = KIT.things[0]!;
    expect(plainAtom(`${q} ${t}`)).toBe(t);
    expect(plainAtom(t)).toBe(t);
    expect(plainAtom('fairy ring')).toBe('fairy ring');
    expect(plainKeywords([`${q} ${t}`, t, 'mill'])).toEqual([t, 'mill']);
  });
  it('the pick and the plan see no quality; the build keeps the deal as dealt', async () => {
    const hasQuality = (xs: string[]) => xs.some(x => plainAtom(x) !== x);
    let seen = 0;
    for (let seed = 1; seed <= 40 && seen < 2; seed++) {
      seedIdCounter(1);
      const { g } = newGame(seed);
      const { chain, focal } = sagaChain(g, { N: 3, personal: false });
      deal(hostFor(g), chain, undefined, focal);
      if (!hasQuality(chain.saga!.world.kit!.keywords)) continue;
      seen++;
      const dealt = [...chain.saga!.world.kit!.keywords];
      for (const pipe of ['plain', 'fx', 'grafts'] as const) {
        seedIdCounter(1);
        const { g: g2, ai } = newGame(seed);
        const { chain: c2, focal: f2 } = sagaChain(g2, { N: 3, personal: false });
        await playSaga(g2, c2, 'clean', f2, undefined, { pipeArm: () => pipe });
        const pick = ai.calls.find(c => c.template === 'pick')!;
        const offered = pick.payload.keywords as string[];
        if (pipe === 'grafts') expect(offered).toEqual(dealt);
        else { expect(hasQuality(offered)).toBe(false); expect(offered).toEqual(plainKeywords(dealt)) }
      }
    }
    expect(seen).toBe(2);
  });
});

describe('pipeline arm link (F3): each job\'s lead first', () => {
  it('the plan writes a lead per job; its own card gets lead + hope as one why; the road and the report the hope alone', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    await playSaga(g, chain, 'clean', focal, undefined, { pipeArm: () => 'link' });
    const rec = chain.saga!, plan = rec.plan!;
    expect(ai.calls.find(c => c.template === 'plan')!.flags).toContain('link');
    expect(plan.episodes.every(e => !!e.lead)).toBe(true);
    const cards = ai.calls.filter(c => c.template === 'card');
    expect(cards[0]!.payload.why).toBe(`${plan.episodes[0]!.lead} ${plan.episodes[0]!.why}`);
    for (const c of cards.filter(x => x.flags.includes('later'))) {
      const n = plan.episodes.findIndex(e => e.job === c.payload.job) + 1;
      expect(c.payload.why).toBe(rec.hopes![n - 1] ? `${plan.episodes[n - 1]!.lead} ${rec.hopes![n - 1]}` : plan.episodes[n - 1]!.lead);
    }
    expect(cards.at(-1)!.flags).not.toContain('why');
    for (const l of rec.road!) if (l) expect(plan.episodes.some(e => l.includes(e.lead!))).toBe(false);
    for (const r of ai.calls.filter(c => c.template === 'report' && c.flags.includes('hope'))) expect(plan.episodes.some(e => String(r.payload.hope).includes(e.lead!))).toBe(false);
  });
  it('its prompt: the lead first in each episode, from what the player has; the why keeps to the job\'s own words', () => {
    const base = ['types', 'keywords', 'support', 'grafts'];
    const plan = renderSaga('plan', [...base, 'link']);
    expect(plan).toContain('- episodes, in order. lead: the fact that points the company to this job\'s person or place, one the player already has: for episode 1, something the one who asked knows; later, from the last episode\'s learn. job:');
    expect(plan).toContain('"episodes": [{"lead": "one sentence", "type": "from types"');
    expect(plan).toContain('a step short of their want, with only what the job names; word or proof only as a hope');
    expect(plan).not.toContain('what they can then do');
    expect(renderSaga('plan', base)).toContain('with only what the job names: for a thing or person, what they can then do;');
    expect(renderSaga('plan', [...base, 'link', 'personal'])).toContain('something the soldier knows');
    // what card 1 shows is shown before ANY job (beside a lead built from a learn, "before play" read as "before that job")
    expect(plan).toContain('the showdown\'s too, show before any job is played: never a learn, a gain or the answer.');
    expect(renderSaga('plan', base)).toContain('the showdown\'s too, are shown before play: never a learn or the answer.');
  });
  it('a missing lead is no defect: the card has the hope alone', () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    deal({ ...hostFor(g), pipeArm: () => 'link' }, chain, undefined, focal);
    const w = chain.saga!.world;
    const raw = mockPlan({ w }, 'k') as { episodes: Record<string, unknown>[] };
    delete raw.episodes[1]!.lead;
    const v = validatePlan(raw, { w });
    expect(v.defects).toEqual([]);
    expect(v.plan!.episodes[1]!.lead).toBeUndefined();
    expect(v.repairs).toContain('episode 2: no lead');
    expect(cardWhy(v.plan!, 2, [null, 'He hopes so.'])).toBe('He hopes so.');
    expect(cardWhy(v.plan!, 1, null)).toBe(`${v.plan!.episodes[0]!.lead} ${v.plan!.episodes[0]!.why}`);
  });
});

describe('the build sends none of round F', () => {
  it('no line, no lead, no against; the deal as dealt', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    await playSaga(g, chain, 'bumpy', focal);
    const plan = chain.saga!.plan!;
    expect(ai.calls.some(c => c.flags.includes('line') || c.flags.includes('link'))).toBe(false);
    expect((ai.calls.find(c => c.template === 'plan')!.payload.types as Record<string, unknown>[]).some(t => 'against' in t)).toBe(false);
    expect([...plan.episodes, plan.showdown].every(e => e.trouble.line === undefined && e.lead === undefined)).toBe(true);
    expect(ai.calls.filter(c => c.template === 'card').every(c => typeof c.payload.trouble === 'object')).toBe(true);
  });
});

describe('round T (Sultan texture/pacing; the page first; personal past + change): each arm\'s inputs', () => {
  const play = async (pipe: string, personal: boolean, path: 'bumpy' | 'personal' | 'clean' = personal ? 'personal' : 'bumpy') => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal });
    const p = await playSaga(g, chain, path, focal, undefined, { pipeArm: () => pipe as never });
    const cards = ai.calls.filter(c => c.template === 'card'), reports = ai.calls.filter(c => c.template === 'report');
    return { g, ai, chain, p, rec: chain.saga!, plan: chain.saga!.plan!, planCall: ai.calls.find(c => c.template === 'plan')!, cards, reports };
  };
  it('room (TA): the same payloads and prompts as the default (grafts), the caps raised by half', async () => {
    const t = await play('room', false), base = await play('grafts', false);
    expect(t.cards.map(c => c.vars.MAX)).toEqual(t.cards.map(c => c.flags.includes('finale') ? 140 : 110));
    expect(t.cards.map(c => c.payload)).toEqual(base.cards.map(c => c.payload));
    expect(t.cards.map(c => c.flags)).toEqual(base.cards.map(c => c.flags));
    t.reports.forEach((r, i) => { expect(r.vars.B).toBeGreaterThan(base.reports[i]!.vars.B as number); expect(r.vars.A).toBeGreaterThan(base.reports[i]!.vars.A as number) });
  });
  it('weight (TB): a retry 35, the finale card 50, a first meeting 100 with how they look; a failed job with no wound 25 / 40', async () => {
    const t = await play('weight', false);
    for (const c of t.cards) {
      // (verify) never under what the card is dealt, plus a margin
      const size = c.flags.includes('first') ? 70 : c.flags.includes('retry') ? 35 : c.flags.includes('finale') ? 50 : c.flags.includes('meet') ? 100 : 45;
      expect(c.vars.MAX, c.flags.join(',')).toBe(c.flags.includes('first') ? size : Math.max(size, Math.ceil((dealtWords(c.payload) + 10) / 5) * 5));
      if (c.flags.includes('meet')) {
        expect(c.payload.meet).toEqual({ who: expect.any(String), looks: expect.stringMatching(/\w+, \w+/) });
        // (verify) a meeting the job already names is the report's, never the card's: the card said the person twice
        expect(String(c.payload.job)).not.toContain(String((c.payload.meet as { who: string }).who).replace(/^(?:an?|the)\s+/i, '').split(' ').at(-1));
      }
    }
    // a report's first meeting: that person's people entry is an intro with how they look
    // (verify) how they look rides in the label, never its own field (a field of its own was pasted as an appositive, the label lost)
    for (const r of t.reports.filter(x => x.flags.includes('meet'))) {
      const ppl = r.payload.people as Record<string, unknown>[];
      expect(ppl.some(p => 'looks' in p)).toBe(false);
      expect(ppl.filter(p => p.intro && /^\w[\w-]*, \S+ \S+/.test(String(p.label)))).toEqual([expect.objectContaining({ intro: true })]);
    }
    // a meeting is told once: the report of a card that told it deals no looks again
    t.cards.forEach(c => {
      if (!c.flags.includes('meet')) return;
      const r = t.reports.find(x => x.payload.job === c.payload.job && x.payload.card !== undefined);
      if (r) expect(r.flags).not.toContain('meet');
    });
    expect(t.reports.at(-1)!.vars).toEqual({ B: expect.any(Number), A: expect.any(Number) });
    expect(t.reports.at(-1)!.vars.A).toBeGreaterThanOrEqual(180);
    for (const r of t.reports.filter(x => x.flags.includes('failure') && !x.flags.includes('hurt') && !x.flags.includes('meet'))) expect(r.vars).toEqual({ B: 25, A: 40 });
    // the first meeting is in a job the plan put the person in, and never twice
    expect([...t.cards, ...t.reports].filter(c => c.flags.includes('meet')).length).toBeGreaterThan(0);
  });
  it('voice (TC): card 1\'s line beside the narrated want (personal: and past); a won clue has its witness; the finale\'s secret its teller', async () => {
    for (const personal of [false, true]) {
      const t = await play('voice', personal);
      const c1 = t.cards[0]!;
      expect(c1.flags).toContain('says');
      const premise = c1.payload.premise as Record<string, string>;
      // (verify) the line itself, as the plan wrote it in their voice — never a bare want for the card writer to turn into one
      expect(clientOf(t.plan).says).toBeTruthy();
      expect(premise.says).toBe(clientOf(t.plan).says);
      // (verify 2) the line is feeling with no new fact: the want (and a personal past) is still narrated plainly
      expect(premise.wants).toBeDefined();
      if (personal) expect(premise.past).toBeDefined();
      expect(renderSaga('card', c1.flags, c1.vars)).not.toContain('in your own words');
      expect(renderSaga('card', c1.flags, c1.vars)).toMatch(/wants: what they want\. .*says: their own words; quote them\./);
      const witnessed = t.reports.filter(r => r.flags.includes('witness'));
      for (const r of witnessed) expect(r.payload.clue).toEqual({ fact: expect.any(String), by: expect.any(String) });
      for (const r of witnessed) expect(renderSaga('report', r.flags, r.vars)).toContain('by: who says it, quoted, in their own words, nothing past it');
      // never in a job done unseen, never the one the company acts for
      for (const r of witnessed) {
        const e = t.plan.episodes.find(x => x.job === r.payload.job || namedIn(x.job, t.plan, { met: new Set(t.plan.cast.map(c => c.id)), named: new Set(), seen: new Set() }) === r.payload.job)!;
        expect(e.type).not.toBe('sneak');
        expect((r.payload.clue as { by: string }).by).not.toBe(clientOf(t.plan).name);
      }
      const fin = t.reports.at(-1)!;
      expect((fin.payload.answer as { teller: string }).teller).toBe(choiceTarget(t.plan).name);
      expect(renderSaga('report', fin.flags, fin.vars)).toContain('The teller says the secret in one quoted line, their own words');
    }
  });
  it('lore (TD): the plan writes it, card 1 tells it, the finale report pays it off', async () => {
    const t = await play('lore', false);
    expect(t.planCall.flags).toContain('lore');
    expect(t.plan.lore).toBeTruthy();
    expect((t.cards[0]!.payload.premise as { lore: string }).lore).toBe(t.plan.lore);
    expect(t.cards[0]!.vars.MAX).toBe(95);
    expect(t.cards.slice(1).every(c => !JSON.stringify(c.payload).includes('"lore"'))).toBe(true);
    expect(t.reports.at(-1)!.payload.lore).toBe(t.plan.lore);
    expect(t.reports.slice(0, -1).every(r => !('lore' in r.payload))).toBe(true);
  });
  it('page (TP): learns are the clues written after the jobs and the answer; each why stays in its episode, ahead of what it turns up; the checks are log-only', async () => {
    const t = await play('page', false);
    expect(t.planCall.flags).toContain('page');
    const raw = JSON.parse(JSON.stringify(t.ai.calls.find(c => c.template === 'plan')!)) as { payload: unknown };
    expect(raw).toBeTruthy();
    expect(t.plan.episodes.every(e => !!e.turnsUp && !!e.learn && !!e.why)).toBe(true);
    const sys = renderSaga('plan', t.planCall.flags, t.planCall.vars);
    expect(sys.indexOf('"question"')).toBeLessThan(sys.indexOf('"turns_up"'));
    expect(sys.indexOf('"turns_up"')).toBeLessThan(sys.indexOf('"answer"'));
    expect(sys.indexOf('"answer"')).toBeLessThan(sys.indexOf('"clues"'));
    expect(sys.indexOf('"clues"')).toBeLessThan(sys.indexOf('"showdown"'));
    // (verify) a why is shown before play: written ahead of what its job turns up and of the clues, never after them
    expect(sys.indexOf('"why"')).toBeLessThan(sys.indexOf('"turns_up"'));
    expect(sys).not.toMatch(/"whys"|"learn": "text"/);
    expect(sys).toContain('clues: one per episode, in order, none for the showdown');
  });
  it('page checks: an answer naming someone no job meets, a learn naming nothing its job turned up', () => {
    const plan = {
      title: 't', question: 'Nobody knows why.', answer: 'The miller hid it.', options: [], cast: [
        { id: 'p1', name: 'Ann', sex: 'female', race: 'human', seat: 'client', focal: false, part: '', known: true, label: 'a human weaver', want: 'x' },
        { id: 'p2', name: 'Bo', sex: 'male', race: 'human', seat: 'support', focal: false, part: '', known: false, label: 'a human miller', want: '' },
      ],
      episodes: [{ n: 1, type: 'find', title: 'a', job: 'Find the mill.', people: ['p1'], trouble: { who: 'x', carry: '', will: '' }, why: 'w', learn: 'A sack of flour lay torn.', turnsUp: 'a broken wheel' }],
      showdown: { n: 2, type: 'showdown', title: 'b', job: 'Face him.', people: ['p2'], trouble: { who: 'x', carry: '', will: '' }, why: '' },
    } as unknown as SagaPlan;
    expect(pageChecks(plan)).toEqual(['the answer names p2 (a human miller), whom no job meets', "episode 1's learn names nothing its job turns up"]);
  });
  it('past (PP): the plan writes the past in two sentences and the change; card 1 tells it; the finale shows it; the engine writes one dossier line', async () => {
    const t = await play('past', true);
    expect(t.planCall.flags).toContain('past');
    const soldier = t.plan.cast.find(p => p.seat === 'soldier')!;
    expect(soldier.past!.split(/(?<=\.)\s+/)).toHaveLength(2);
    expect(soldier.change).toBeTruthy();
    expect(t.cards[0]!.flags).toContain('past');
    expect((t.cards[0]!.payload.premise as { past: string }).past).toBe(soldier.past);
    expect(t.reports.at(-1)!.payload.change).toBe(soldier.change);
    expect(t.rec.grown).toBe(grownLine(t.plan));
    expect(t.rec.grown).toMatch(new RegExp(`^After ${t.plan.title}: `));
    // a hired saga under past changes nothing: no past flag, no change, no line
    const h = await play('past', false);
    expect(h.planCall.flags).not.toContain('past');
    expect(h.rec.grown).toBeUndefined();
    expect(h.reports.every(r => !('change' in r.payload))).toBe(true);
  });
  it('past (PP), in the game: the finale keeps the dossier line on the soldier (their sheet\'s memory, both UIs) and seeds their next personal saga', async () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: true });
    focal.character!.backstory = 'Sesh slept drunk the night slavers took the girl he swore to guard.';
    g.ensureLoreNode(focal);
    await playSaga(g, chain, 'personal', focal, undefined, { pipeArm: () => 'past' });
    const line = chain.saga!.grown!;
    expect(line).toMatch(/^After /);
    const report: string[] = [];
    (g as unknown as { settleFinale: (q: unknown, c: unknown, r: unknown, rep: string[], f: unknown) => void }).settleFinale({ id: 'q-test' }, chain, { outcome: 'success', party: [focal] }, report, { fate: 'clean' });
    // kept on the soldier: the seed the saga was dealt, the past it told (the past the change resolves) and the line
    const past = chain.saga!.plan!.cast.find(p => p.seat === 'soldier')!.past!;
    expect(focal.character!.grown).toEqual([{ seed: chain.saga!.world.seed.text, past, line, title: chain.saga!.plan!.title, chainId: chain.id, cycle: g.state.cycle }]);
    // the sheet's own memories (the CLI's `merc` dossier and the GUI sheet read the same lines)
    expect(g.dossier(focal.id, { player: true })).toContain(`- ${line}`);
    expect(g.dossier(focal.id, { player: true })).not.toContain('came through');
    // the next personal saga (chain B): seeded from the living dossier's Now, who they became (no settled marks), and dealt
    // the settled past as history
    const next = (g as unknown as { personalSeedOf: (m: unknown, r: string, ids: Set<string>) => { seed: string; history?: string } }).personalSeedOf(focal, chain.region, new Set());
    expect(next.history).toBe(past);
    expect(next.seed.split('\n')[0]).toBe(line.replace(`After ${chain.saga!.plan!.title}: `, ''));
    expect(next.seed).not.toContain(chain.saga!.plan!.title);
    expect(next.seed).not.toContain(past);
    // a later saga that closes on this soldier with no line of its own (its plan wrote no change) leaves its own memory beside
    // the growth line — a new fact, never merged into it (dropped, or written over it)
    delete chain.saga!.grown;
    (g as unknown as { settleFinale: (q: unknown, c: unknown, r: unknown, rep: string[], f: unknown) => void }).settleFinale({ id: 'q-test-2' }, chain, { outcome: 'success', party: [focal] }, [], { fate: 'clean' });
    const sheet = g.dossier(focal.id, { player: true });
    expect(sheet).toContain(`- ${line}`);
    expect(sheet).toContain('came through');
  });
  it('a host naming no pipe arm (PIPE_ARM: the lab\'s G0 / PG0) sends none of round T, and leaves no dossier line', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: true });
    await playSaga(g, chain, 'personal', focal);
    expect(ai.calls.some(c => c.flags.some(f => ['says', 'saywant', 'saypast', 'lore', 'meet', 'witness', 'teller', 'change', 'page', 'past'].includes(f)))).toBe(false);
    expect(chain.saga!.grown).toBeUndefined();
    expect(chain.saga!.plan!.lore).toBeUndefined();
  });
});

describe('the stack round (S1–S3): a shipped arm plus one change, each against that arm', () => {
  const play = async (pipe: string, personal: boolean, path: 'bumpy' | 'personal' = personal ? 'personal' : 'bumpy') => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal });
    await playSaga(g, chain, path, focal, undefined, { pipeArm: () => pipe as never });
    const cards = ai.calls.filter(c => c.template === 'card'), reports = ai.calls.filter(c => c.template === 'report');
    return { rec: chain.saga!, plan: chain.saga!.plan!, planCall: ai.calls.find(c => c.template === 'plan')!, cards, reports };
  };
  it('S1 voice+line: TC\'s three lines, the trouble as one sentence on every card but a retry, its reason only where seed or cast gives one', async () => {
    const t = await play('voice+line', false), tc = await play('voice', false);
    expect([...t.planCall.flags].sort()).toEqual([...tc.planCall.flags, 'line', 'against', 'motive'].sort());
    const sys = renderSaga('plan', t.planCall.flags, t.planCall.vars);
    expect(sys).toContain('what they will do, and any reason the seed or cast already gives them.');
    expect(sys).not.toMatch(/what they will do, and why\b/);
    expect(renderSaga('plan', tc.planCall.flags.concat('line'), {})).toContain('what they will do, and why.');
    // card 1: the asker's line beside the plan's trouble sentence
    const c1 = t.cards[0]!;
    expect(c1.flags).toEqual(expect.arrayContaining(['says', 'line']));
    expect((c1.payload.premise as { says: string }).says).toBe(clientOf(t.plan).says);
    expect(c1.payload.trouble).toBe(t.plan.episodes[0]!.trouble.line);
    expect(c1.vars.MAX).toBe(capFor(c1.payload, 70) + 15);
    // the reports: TC's, a won clue witnessed where TC's was
    expect(t.reports.map(r => r.flags.includes('witness'))).toEqual(tc.reports.map(r => r.flags.includes('witness')));
    expect(t.reports.at(-1)!.flags).toContain('teller');
  });
  it('S2 past+voice: PP\'s plan byte for byte; card 1 quotes the past\'s first sentence in place of its narration; the finale\'s teller, no quoted clue', async () => {
    const t = await play('past+voice', true), pp = await play('past', true);
    expect(t.planCall.flags).toEqual(pp.planCall.flags);
    expect(renderSaga('plan', t.planCall.flags, t.planCall.vars)).toBe(renderSaga('plan', pp.planCall.flags, pp.planCall.vars));
    expect(t.planCall.payload).toEqual(pp.planCall.payload);
    const past = t.plan.cast.find(p => p.seat === 'soldier')!.past!;
    const [first, ...rest] = past.split(/(?<=[.!?])\s+/);
    const c1 = t.cards[0]!, premise = c1.payload.premise as Record<string, string>;
    expect(c1.flags).toEqual(expect.arrayContaining(['personal', 'says', 'quote', 'past']));
    expect(premise.says).toBe(first);
    expect(premise.past).toBe(rest.join(' '));
    // the line comes first, the rest after it; one sentence each, never the whole past twice
    expect(Object.keys(premise).indexOf('says')).toBeLessThan(Object.keys(premise).indexOf('past'));
    expect(c1.vars.MAX).toBe(pp.cards[0]!.vars.MAX);
    const sys = renderSaga('card', c1.flags, c1.vars);
    // (real run) "their old wrong, quoted" over a third-person sentence came back narrated, and "quote them saying" over it came
    // back a paraphrase, and "their old wrong, quoted, first person" came back narrated again: the soldier says it, "I …"; the rest
    // is what followed
    expect(sys).toContain('says: their old wrong; they say it, "I …". past: what followed.');
    expect(sys).not.toContain('their own words; quote them');
    // a past of one sentence: the line alone, no past field and no line about one
    const one = { ...c1, flags: c1.flags.filter(f => f !== 'past') };
    expect(renderSaga('card', one.flags, one.vars)).not.toMatch(/past:/);
    // the reports: PP's change and the secret said at the finale; no witness anywhere
    expect(piped(t.rec.world, 'witness')).toBe(false);
    expect(t.reports.some(r => r.flags.includes('witness'))).toBe(false);
    const fin = t.reports.at(-1)!;
    // (verify) nobody is named to say it: a personal secret is often the soldier's own reason, which the one in their way cannot
    // know ("you hid it, and you were too ashamed"); "built from known" fought a secret that is new beyond known
    expect(fin.flags).toEqual(expect.arrayContaining(['anyteller', 'change']));
    expect(fin.flags).not.toContain('teller');
    expect('teller' in (fin.payload.answer as object)).toBe(false);
    const finSys = renderSaga('report', fin.flags, fin.vars);
    expect(finSys).toContain('Someone there who could know it says the secret in their own words, one or two quoted sentences.');
    expect(finSys).not.toMatch(/teller|built from known/);
    expect(fin.vars.A).toBe(Number(pp.reports.at(-1)!.vars.A) + 15);
    expect(t.rec.grown).toBe(pp.rec.grown);
    // a hired saga under past+voice: no past to quote, the teller only
    const h = await play('past+voice', false);
    expect(h.cards[0]!.flags).not.toContain('quote');
    expect('says' in (h.cards[0]!.payload.premise as object)).toBe(false);
  });
  it('S3 voice+clean: TC\'s three lines and clean\'s lines on every call', async () => {
    const t = await play('voice+clean', false);
    expect(t.planCall.flags).toEqual(expect.arrayContaining(['voice', 'clean']));
    expect([...t.cards, ...t.reports].every(c => c.flags.includes('clean'))).toBe(true);
    expect((t.cards[0]!.payload.premise as { says: string }).says).toBe(clientOf(t.plan).says);
    expect(piped(t.rec.world, 'witness')).toBe(true);
    const fin = t.reports.at(-1)!;
    expect(fin.flags).toContain('teller');
    expect(renderSaga('report', fin.flags, fin.vars)).toContain('The teller says the secret in their own words, one or two short quoted sentences');
    // a personal saga under clean: nobody named to say the secret (whoever there could know it)
    const own = await play('voice+clean', true);
    expect(own.reports.at(-1)!.flags).toEqual(expect.arrayContaining(['anyteller', 'clean']));
    expect(renderSaga('report', own.reports.at(-1)!.flags, own.reports.at(-1)!.vars)).toContain('Someone there who could know it says the secret');
  });
  it('S3 clean, the stack-round verifier\'s classes: one phrase for the trouble, its foe from the type; one name per person; a met role in full, definite', async () => {
    const t = await play('voice+clean', false);
    // the plan: who stands against each type, the trouble's second key `with`, a learn the soldiers themselves come by, the seed's people
    expect(t.planCall.flags).toEqual(expect.arrayContaining(['against', 'with']));
    expect((t.planCall.payload.types as { against?: string }[]).every(x => !!x.against)).toBe(true);
    const sys = renderSaga('plan', t.planCall.flags, t.planCall.vars);
    expect(sys).toContain('trouble: who stands against it (from its type), with what, what they will do.');
    expect(sys).toContain('learn: a plain fact the soldiers find, see or hear there,');
    expect(sys).toContain("the seed's people are among them, or added if none fits; add nobody else who matters.");
    expect(sys).not.toMatch(/armed people or a beast|"carry"|someone is one of them/);
    // every card: the trouble is ONE phrase (three labelled parts came back as "They carry X. They will Y."), the job a task
    for (const c of t.cards) {
      const cs = renderSaga('card', c.flags, c.vars);
      expect(typeof c.payload.trouble).toBe('string');
      expect(cs).toContain('trouble: the obstacle.');
      expect(cs).toContain('- job: the task asked of you, and where.');
      expect(cs).not.toMatch(/carry|orders/);
      // one name per person: no dealt field calls a person the card names by name by their label instead
      const met = { met: new Set(t.plan.cast.filter(q => (c.payload.names as { name?: string }[]).some(n => n.name === q.name)).map(q => q.id)), named: new Set<string>(), seen: new Set<string>() };
      for (const key of ['latest', 'retry', 'job', 'why', 'trouble'] as const) if (typeof c.payload[key] === 'string') expect(namedIn(c.payload[key] as string, t.plan, met), key).toBe(c.payload[key]);
      // a met person's role: the whole trade, definite — never an introduction's indefinite, never the label's last word alone
      for (const n of c.payload.names as Record<string, unknown>[]) if (n.name && !n.intro && n.label !== 'one of your soldiers') expect(n.label).toBe(roleOf(t.plan.cast.find(q => q.name === n.name)!));
    }
  });
  it('clean\'s small pieces: a role in full and definite; a cost its owner\'s own; a last chance\'s stake keeps its owner in names', () => {
    const p = (label: string, race = 'human') => ({ label, race }) as never;
    expect(roleOf(p('dwarf guild master', 'dwarf'))).toBe('the guild master');
    expect(roleOf(p('human tax collector'))).toBe('the tax collector');
    expect(roleOf(p('an elf envoy', 'elf'))).toBe('the envoy');
    expect(roleOf(p('Woodcutter woman'))).toBe('the woodcutter woman');
    expect(roleOf(p('a local woman'))).toBe('the local woman');
    expect(roleOf(p('human woman'))).toBe('the woman');
    expect(roleOf(p('human lord of Ashworth Hold'))).toBe('the lord');
    expect(ownCost({ what: 'horse', how: 'lamed', whose: 'the company' })).toEqual({ what: "the company's own horse", how: 'lamed' });
    expect(ownCost({ what: 'goodwill', how: 'lost', whose: 'the locals' })).toEqual({ what: "the locals' goodwill", how: 'lost' });
    expect(ownCost({ what: 'sword', how: 'broken', whose: 'Nicholina' })).toEqual({ what: "Nicholina's sword", how: 'broken' });
  });
});

describe('round H (HP, RF): TC plus one change, each against TC', () => {
  const play = async (pipe: string, personal: boolean, path: 'bumpy' | 'personal' | 'lastchance' = personal ? 'personal' : 'bumpy', N = 4) => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N, personal });
    await playSaga(g, chain, path, focal, undefined, { pipeArm: () => pipe as never });
    const cards = ai.calls.filter(c => c.template === 'card'), reports = ai.calls.filter(c => c.template === 'report');
    return { rec: chain.saga!, plan: chain.saga!.plan!, planCall: ai.calls.find(c => c.template === 'plan')!, cards, reports };
  };
  it('HP voice+asker: a hired asker\'s past and change in place of TC\'s line; card 1 tells the past at TC\'s cap; the finale shows the change, the asker there', async () => {
    const t = await play('voice+asker', false), tc = await play('voice', false);
    expect([...t.planCall.flags].sort()).toEqual([...tc.planCall.flags.filter(f => f !== 'voice'), 'askerpast'].sort());
    const sys = renderSaga('plan', t.planCall.flags, t.planCall.vars);
    expect(sys).toContain('past: two plain sentences: what happened to them that makes this want theirs. change: how they end up different; a done fact naming them.');
    // a returning asker: the past is never their memory (card 1 tells both), and "use both" — which gave the memory the past as
    // its only target — is gone (TC keeps it)
    const mem = renderSaga('plan', [...t.planCall.flags, 'memory'], t.planCall.vars), tcMem = renderSaga('plan', [...tc.planCall.flags, 'memory'], tc.planCall.vars);
    expect(mem).toContain('what happened to them that makes this want theirs, not their memory.');
    expect(mem).toContain('memory, where: their past with the company, where they are now.');
    expect(tcMem).toContain('where they are now; use both.');
    expect(sys).toContain('Titles, jobs, whys, troubles and past, the showdown\'s too, are shown before play');
    expect(sys).not.toMatch(/says:|"says"/);
    const asker = clientOf(t.plan);
    expect(asker.past).toBeTruthy();
    expect(asker.change).toBeTruthy();
    expect(asker.says).toBeUndefined();
    // card 1: the past told in place of the quoted line; the card does not grow
    const c1 = t.cards[0]!, premise = c1.payload.premise as Record<string, string>;
    expect(c1.flags).toContain('askerpast');
    expect(c1.flags).not.toContain('says');
    expect(premise.past).toBe(asker.past);
    expect('says' in premise).toBe(false);
    expect(Object.keys(premise)).toEqual(['who', 'wants', 'past', 'unknown']);
    expect(c1.vars.MAX).toBe(tc.cards[0]!.vars.MAX);
    expect(renderSaga('card', c1.flags, c1.vars)).toContain('wants: what they want. past: what happened to them. unknown:');
    // the quoted clue and the spoken secret stay; the finale not lost shows the change, the asker among its people; no dossier line
    expect(t.reports.some(r => r.flags.includes('witness'))).toBe(tc.reports.some(r => r.flags.includes('witness')));
    const fin = t.reports.at(-1)!;
    expect(fin.flags).toEqual(expect.arrayContaining(['teller', 'change', 'askerpast']));
    expect(fin.payload.change).toBe(asker.change);
    expect((fin.payload.people as { name?: string }[]).some(p => p.name === asker.name)).toBe(true);
    expect(renderSaga('report', fin.flags, fin.vars)).toContain('change: how the one who asked is different now; show it happen.');
    expect(fin.vars.A).toBe(Number(tc.reports.at(-1)!.vars.A) + 20);
    expect(t.rec.grown).toBeUndefined();
    // the asker's past is shown on card 1: the plan lint reads it as early (an answer word there is a leak)
    expect(planLint({ ...t.plan, cast: t.plan.cast.map(c => c.id === asker.id ? { ...c, past: `${asker.past} ${t.plan.answer}` } : c) }, t.rec.world).some(l => l.startsWith('answer words before the finale'))).toBe(true);
    // a personal saga has no hired asker: it plays TC
    const own = await play('voice+asker', true), ownTc = await play('voice', true);
    expect(own.planCall.flags).toEqual(ownTc.planCall.flags);
    expect(own.cards.map(c => c.flags)).toEqual(ownTc.cards.map(c => c.flags));
    expect(own.reports.map(r => r.flags)).toEqual(ownTc.reports.map(r => r.flags));
  });
  it('RF voice+setback: a failed job\'s report is dealt that the job still stands; a retry is framed by the failure, never the plan\'s hope', async () => {
    const t = await play('voice+setback', false), tc = await play('voice', false);
    expect(t.planCall.flags).toEqual(tc.planCall.flags);
    // bumpy: job 2 fails, then is tried again — its failure report says so
    const failed = t.reports.filter(r => r.flags.includes('failure'));
    expect(failed).toHaveLength(1);
    expect(failed[0]!.flags).toContain('stands');
    expect(failed[0]!.payload.stands).toBe(standsFact(true));
    expect(renderSaga('report', failed[0]!.flags, failed[0]!.vars)).toContain('- stands: what still stands when it ends.');
    // TC carries RFW's fact since it shipped: the job's own people and place, never RF's bare stands, never `last`
    expect(tc.reports.some(r => 'last' in r.payload)).toBe(false);
    expect(tc.reports.filter(r => 'stands' in r.payload).map(r => r.payload.stands)).not.toContain(standsFact(true));
    // the retry card: the failure's summary alone — no why, no trouble (TC's retry card has the plan's hope and trouble: the
    // summary already names what stopped them), its cap sized to what is left
    const ri = t.cards.findIndex(c => c.flags.includes('retry'));
    const retry = t.cards[ri]!, tcRetry = tc.cards.find(c => c.flags.includes('retry'))!;
    expect(Object.keys(retry.payload)).toEqual(['retry', 'job', 'names']);
    expect(retry.flags).toContain('setback');
    expect(retry.flags).not.toContain('why');
    expect('why' in tcRetry.payload && 'trouble' in tcRetry.payload).toBe(true);
    expect(retry.payload.retry).toBe(tcRetry.payload.retry);
    expect(retry.vars.MAX).toBe(capFor(retry.payload, 70));
    expect(retry.vars.MAX).toBeLessThan(Number(tcRetry.vars.MAX));
    const rsys = renderSaga('card', retry.flags, retry.vars);
    expect(rsys).not.toMatch(/trouble/);
    expect(rsys).toContain('in this order: retry, job.');
    // ...and its report: no hope (its card was dealt none; the card it reads tells the failure, so nothing deals it again)
    const rr = t.reports[ri]!;
    expect(rr.flags).not.toContain('hope');
    expect(Object.keys(rr.payload).filter(x => x === 'hope' || x === 'last')).toEqual([]);
    expect(tc.reports[ri]!.flags).toContain('hope');
    expect(rr.flags).toEqual(tc.reports[ri]!.flags.filter(f => f !== 'hope'));
    // every other card as TC's
    t.cards.forEach((c, i) => { if (i !== ri) expect(c.flags).toEqual(tc.cards[i]!.flags) });
    // the last chance (N 2): the setbacks spent, a failed job is not tried again — it still stands, nothing more is said
    const lc = await play('voice+setback', false, 'lastchance', 2);
    const lcFailed = lc.reports.filter(r => r.flags.includes('failure') && !r.flags.includes('answer'));
    expect(lcFailed.map(r => r.payload.stands)).toEqual([standsFact(true), standsFact(false)]);
    expect(lc.reports.some(r => 'last' in r.payload)).toBe(false);
    expect(standsFact(false)).not.toMatch(/again/);
  });
});

// ─── whom it is for, without the log (saga-panel report 2026-10-05 §6; seedlab NW, NWL; PW): input-side ─────────────────

describe('pipe part want: every later card says whom the job is for and their want (the For line\'s content) in its one why', () => {
  /** job 3's hope kept off the ROAD (as graftRoad does at card 1); `spoil`: job 3's why also tells its own learn, so it stays
   *  off at its own card too */
  const play = async (pipe: string, personal: boolean, path: 'clean' | 'bumpy' | 'lastchance' = 'clean', spoil = false) => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal });
    const p = await playSaga(g, chain, personal && path === 'clean' ? 'personal' : path, focal, pos => {
      const r = chain.saga!;
      if (pos.job === 2 && r.hopes) r.hopes[2] = null;
      if (spoil && pos.job === 3 && !pos.finale) { const e = r.plan!.episodes[2]!; e.why = `${clientOf(r.plan!).name} hopes to learn that ${e.learn!.replace(/^\w/, x => x.toLowerCase())}` }
    }, { pipeArm: () => pipe as never });
    const sent = (c: SagaCall) => ({ template: c.template, flags: c.flags, vars: c.vars, payload: c.payload });
    return { p, rec: chain.saga!, cards: ai.calls.filter(c => c.template === 'card').map(sent), reports: ai.calls.filter(c => c.template === 'report').map(sent), plans: ai.calls.filter(c => c.template === 'plan').map(sent) };
  };
  const byJob = <T extends { flags: string[]; payload: Record<string, unknown> }>(cs: T[], pl: SagaPlan) => cs.slice(1).map(c => ({ c, n: c.flags.includes('finale') ? 4 : pl.episodes.findIndex(e => e.job === c.payload.job) + 1 }));

  for (const [game, personal] of [['voice', false], ['voice', true], ['past', true]] as const) it(`${game}+want · ${personal ? 'personal' : 'hired'}: the want leads every later why, a hope folded after it; a hope is judged at its own card; a want alone comes before the job`, async () => {
    const base = await play(game, personal), nw = await play(`${game}+want`, personal);
    const plan = nw.rec.plan!, client = clientOf(plan), k = knowingOf(nw.rec), want = askerWant(plan, k)!;
    expect(want).toBe(`${forWho(plan, k)}, wants ${wantPhrase(client.want)}.`);
    expect(forWho(plan, k)).toMatch(new RegExp(`^${client.name}, ${personal ? 'one of your soldiers$' : 'an? '}`));
    // the plan and card 1 are the shipped pipe's, byte for byte (want changes no plan and no card 1)
    expect(nw.plans).toEqual(base.plans);
    expect(nw.cards[0]).toEqual(base.cards[0]);
    expect(byJob(nw.cards, plan).map(x => x.n)).toEqual([2, 3, 4]);
    for (const { c, n } of byJob(nw.cards, plan)) {
      const was = base.cards.find(b => b.payload.job === c.payload.job)!;
      expect(c.payload.latest).toBe(was.payload.latest);
      expect(c.payload.trouble).toEqual(was.payload.trouble);
      // whom the job is for, by name and label, opens the one why; the name reaches the card's names
      expect(String(c.payload.why).startsWith(`${forWho(plan, k)}, `)).toBe(true);
      expect((c.payload.names as { name?: string }[]).some(x => x.name === client.name)).toBe(true);
      if (n === 2) expect(c.payload.why).toBe(wantWhy(plan, k, nw.rec.hopes![1]!));
      // job 3: kept off the road, but nothing at its own card keeps it off — the hope prints there (the base, on the road's
      // verdict, had no why at all), and its report keeps that promise
      if (n === 3) {
        expect(was.payload.why).toBeUndefined();
        const hope = planHope(plan.episodes[2]!.why, plan, client.name);
        expect(c.payload.why).toBe(wantWhy(plan, k, hope));
        expect(nw.reports.find(r => r.payload.job === c.payload.job && r.flags.includes('hope'))?.payload.hope).toBe(hope);
      }
      if (n <= 3) { expect(c.flags).not.toContain('wantfirst'); expect(Object.keys(c.payload).indexOf('job')).toBeLessThan(Object.keys(c.payload).indexOf('why')) }
      // the finale: the want alone, told before the job (a want does not depend on the job; a hope does)
      if (n === 4) {
        expect(was.payload.why).toBeUndefined();
        expect(c.payload.why).toBe(want);
        expect(c.flags.filter(f => f !== 'why' && f !== 'wantfirst')).toEqual(was.flags);
        expect(Object.keys(c.payload).slice(0, 3)).toEqual(['latest', 'why', 'job']);
        expect(renderSaga('card', c.flags, c.vars)).toContain('in this order: latest, why, job, trouble.');
      }
      expect(c.vars).toEqual(was.vars);
    }
    expect(nw.p.cards.at(-1)!.out.matter.some(m => m.id === client.id)).toBe(true);
  });

  it('a hope that would tell its own learn stays off its own card too: the want alone, before the job', async () => {
    const nw = await play('voice+want', false, 'clean', true);
    const plan = nw.rec.plan!, k = knowingOf(nw.rec);
    expect(whyFlags(plan, nw.rec.world, undefined, 3)[2]!.length).toBeGreaterThan(0);
    const c = byJob(nw.cards, plan).find(x => x.n === 3)!.c;
    expect(c.payload.why).toBe(askerWant(plan, k));
    expect(c.flags).toContain('wantfirst');
    expect(nw.reports.some(r => r.payload.job === c.payload.job && r.flags.includes('hope'))).toBe(false);
  });

  it('wantWhy: one item — the want, then the hope after its subject; a hope carrying the want keeps its words, the label after the name', () => {
    const plan = { cast: [{ id: 'p1', name: 'Ada Reed', sex: 'female', race: 'human', seat: 'client', focal: false, part: '', known: true, label: 'human miller', want: 'keep her mill from the baron' }] } as SagaPlan;
    const k = newKnowing(plan.cast);
    expect(wantWhy(plan, k, undefined)).toBe('Ada Reed, a human miller, wants to keep her mill from the baron.');
    expect(wantWhy(plan, k, 'Ada Reed hopes the clerk will say who forged the deed.')).toBe('Ada Reed, a human miller, wants to keep her mill from the baron, and hopes the clerk will say who forged the deed.');
    expect(wantWhy(plan, k, 'Ada Reed hopes the deed keeps her mill from the baron.')).toBe('Ada Reed, a human miller, hopes the deed keeps her mill from the baron.');
    expect(wantWhy({ cast: [{ ...plan.cast[0]!, want: '' }] } as SagaPlan, k, 'Ada Reed hopes so.')).toBe('Ada Reed hopes so.');
  });

  for (const personal of [false, true]) it(`voice+want+link · ${personal ? 'personal' : 'hired'}: the plan writes a lead for each later job, the showdown too; it rides in latest, before the job, never in the why`, async () => {
    const nw = await play('voice+want', personal), nwl = await play('voice+want+link', personal);
    const lp = nwl.rec.plan!, k = knowingOf(nwl.rec);
    expect([...nwl.plans[0]!.flags].sort()).toEqual([...nw.plans[0]!.flags, 'link', 'midlead'].sort());
    const prompt = renderSaga('plan', nwl.plans[0]!.flags, {});
    expect(prompt).toContain("lead: (episode 2 on) what the last learn says of this job's person or place. job:");
    expect(prompt).toContain('- showdown: lead, job, people, trouble as above');
    expect(prompt).toContain('"showdown": {"title": "few words", "lead": "text", "job": "text"');
    // no lead on card 1 (one card-1 addition: TC's quoted line); every later job and the showdown have one
    expect(lp.episodes[0]!.lead).toBeUndefined();
    expect([...lp.episodes.slice(1), lp.showdown].every(e => !!e.lead)).toBe(true);
    expect(nwl.cards[0]!.flags).toEqual(nw.cards[0]!.flags);
    expect(nwl.cards[0]!.payload.why).toBe(lp.episodes[0]!.why);
    for (const { c, n } of byJob(nwl.cards, lp)) {
      const e = n === 4 ? lp.showdown : lp.episodes[n - 1]!;
      expect(c.payload.latest).toBe(withLatest(lp.episodes[n - 2]!.win!, e.lead));
      expect(String(c.payload.why)).not.toContain(e.lead!);
      expect(c.payload.why).toBe(n === 4 ? askerWant(lp, k) : wantWhy(lp, k, n === 2 ? nwl.rec.hopes![1]! : planHope(lp.episodes[2]!.why, lp, clientOf(lp).name)));
    }
  });

  it('voice+want+link: no lead on a retry (the job\'s first card told it), nor on a finale after the last job was lost', async () => {
    const bumpy = await play('voice+want+link', false, 'bumpy');
    const retries = bumpy.cards.filter(c => c.flags.includes('retry'));
    expect(retries.length).toBeGreaterThan(0);
    for (const c of retries) { expect(c.payload.retry).toBeDefined(); expect(String(c.payload.retry)).not.toMatch(/What the company found last/) }
    const lc = await play('voice+want+link', false, 'lastchance');
    const fin = lc.cards.at(-1)!;
    expect(fin.flags).toContain('finale');
    expect(lc.rec.done[lc.rec.plan!.episodes.length]).not.toBe('won');
    expect(String(fin.payload.latest)).not.toContain(lc.rec.plan!.showdown.lead!);
  });

  it('plan lints (log-only): a job telling its own trouble\'s will; a dealt keyword in no job, trouble, lead or gain', async () => {
    const nw = await play('voice+want', false);
    const plan = structuredClone(nw.rec.plan!), w = nw.rec.world;
    const e = plan.episodes[1]!;
    e.trouble = { ...e.trouble, will: 'burn the tannery tally books' };
    e.job = 'Hold the tannery against men who would burn its tally books';
    expect(planLint(plan, w)).toContain('episode 2 job tells its trouble\'s will');
    const kw = { ...w, kit: { ...w.kit!, keywords: ['lantern'], ...(w.kit!.picked ? { picked: { ...w.kit!.picked, keywords: ['lantern'] } } : {}) } } as SagaWorld;
    expect(seedOf(kw).keywords).toEqual(['lantern']);
    expect(planLint(plan, kw)).toContain('keyword in no job, trouble, lead or gain: lantern');
    plan.showdown.job = `${plan.showdown.job} by lantern light`;
    expect(planLint(plan, kw)).not.toContain('keyword in no job, trouble, lead or gain: lantern');
  });
});
