// The saga SEED ARMS (docs/STORYTELLER.md North Star 7–8): the theme library (the default, held byte for byte by
// test/sagagolden.test.ts) vs the seed kit — one situation + keyword atoms + a supporting cast with no parts — with or
// without the small pick and premise calls before the plan. Played here on the mock floor; the lab plays them for real
// (scripts/sagalab/seedlab.ts).
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { dealSaga, castSaga, seedOf, seedPending, SEED_ARM, KIT_CLIENT_PART, type SeedArm } from '../src/engine/saga.js';
import { dealKit, KIT, KIT_DEAL, SEED_ARMS } from '../src/engine/seedkit.js';
import { planPayload, pickPayload, premisePayload, readPick, mockPick } from '../src/ai/storyteller.js';
import { newGame, sagaChain, playSaga } from './sagaharness.js';

const POOLS = ['things', 'creatures', 'places', 'occasions', 'uncanny'] as const;
const poolOf = (x: string) => POOLS.find(p => KIT[p].includes(x) || (p === 'things' && KIT.qualities.some(q => x.startsWith(`${q} `) && KIT.things.includes(x.slice(q.length + 1)))));

describe('the seed kit deal', () => {
  it('the build ships the theme library until the lab picks a winner', () => expect(SEED_ARM).toBe('themes'));
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
      expect(c.places).toHaveLength(3);
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
