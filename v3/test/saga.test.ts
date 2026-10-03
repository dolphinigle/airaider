// The v4 saga engine (src/engine/saga.ts): the deal, the lean cast, the persisted record, and the asks the engine owns.
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { CONCEPT } from '../src/engine/tags.js';
import { hasClash } from '../src/engine/overlap.js';
import { REGION } from '../src/engine/regions.js';
import { THEMES } from '../src/engine/themes.js';
import { soldierTrade, tradeOf, traitsOf } from '../src/engine/plainwords.js';
import {
  dealSaga, castSaga, SHAPES, SHAPE_IDS, PERSONAL_PARTS, STAKES, TONE_FROM_THEME, EPISODE_TESTS, WAY_TESTS, JOB_TYPES, waysOf, ARM,
} from '../src/engine/saga.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, hostFor } from './sagaharness.js';

const FAVOR_OK = (c: string) => CONCEPT[c]?.group === 'skill' || CONCEPT[c]?.group === 'personality' || ['tall', 'short', 'endowed', 'flat'].includes(c);

describe('the build is one arm', () => {
  it('loose structure, strangers by label, the lean cast', () => expect(ARM).toEqual({ structure: 'L', names: 'labels', cast: 'lean' }));
});

describe('dealSaga — one dealer for the story inputs', () => {
  it('deals a theme, its feeling as the tone when it has one, a shape and a stake; the theme joins the window', () => {
    const recent: string[] = [];
    for (let i = 0; i < 40; i++) {
      const d = dealSaga(new Rng(i), recent, { personal: false });
      const t = THEMES.find(x => x.id === d.seed.id)!;
      expect(d.seed.text).toBe(t.theme);
      expect(recent[recent.length - 1]).toBe(t.id);
      if (TONE_FROM_THEME[t.tone]) expect(d.tone).toBe(TONE_FROM_THEME[t.tone]);
      expect(SHAPE_IDS).toContain(d.shape);
      expect(STAKES[d.shape].map(s => s[0])).toContain(d.stake);
    }
  });
  it('a personal saga takes its own past as the seed (no theme dealt); a lab spark wins over both', () => {
    const recent: string[] = [];
    const p = dealSaga(new Rng(3), recent, { personal: true, personalSeed: 'she left her brother bound to a debt' });
    expect(p.seed).toEqual({ id: null, text: 'she left her brother bound to a debt' });
    expect(STAKES.personal.map(s => s[0])).toContain(p.stake);
    expect(recent).toEqual([]);
    expect(dealSaga(new Rng(3), recent, { personal: true, personalSeed: 'x', spark: 'the fixture spark' }).seed.text).toBe('the fixture spark');
  });
});

describe('castSaga — the lean cast', () => {
  const region = 'western-forests';
  for (const personal of [false, true]) for (const kind of ['recruit', 'captive', 'gold'] as const) it(`${personal ? 'personal' : 'hired'} · ${kind}`, () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal, kind: kind === 'gold' ? 'gold-hoard' : kind });
    const reg = REGION[g.activeRegions()[0]!] ? g.activeRegions()[0]! : region;
    const c = castSaga(new Rng(5), { focal, personal, region: reg, shape: 'heist', taken: () => false });
    expect(c.cast).toHaveLength(2);
    if (personal) {
      const [s, o] = c.cast;
      expect(s).toMatchObject({ id: focal.id, seat: 'soldier', focal: true, known: true, part: PERSONAL_PARTS[0], trade: soldierTrade(focal) });
      expect(o).toMatchObject({ seat: 'opponent', focal: false, known: false, part: 'stands in the way' });
      expect(o!.trade).toBeTruthy();
    } else {
      const [cl, f] = c.cast;
      // the one who asks: named from card 1, the shape's part, no trade (the plan coins one off the seed)
      expect(cl).toMatchObject({ seat: 'client', focal: false, known: true, part: SHAPES.heist.parts[0] });
      expect(cl!.trade).toBeUndefined();
      // the person the ending decides stands in the way, a stranger by label
      expect(f).toMatchObject({ id: focal.id, seat: 'opponent', focal: true, known: false, part: 'stands in the way', trade: tradeOf(focal) });
      expect(f!.traits).toBe(traitsOf(focal));
      // every way is dealt (the focal is never someone the company helps)
      expect(waysOf({ personal, kind, cast: c.cast })).toEqual([kind, ...(['captive', 'recruit', 'gold'] as const).filter(k => k !== kind)]);
    }
    // three places, never the landmark, no two on one stem; the land in plain words
    expect(c.places).toHaveLength(3);
    expect(c.places).not.toContain(REGION[reg]!.landmark);
    expect(new Set(c.places.map(p => p.slice(0, 4))).size).toBe(3);
    expect(c.land.startsWith('the ')).toBe(true);
    if (REGION[reg]!.landmark) expect(c.land).not.toContain(REGION[reg]!.landmark!);
  });

  it('never coins a taken name; honours a place the game still rests', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: false });
    const reg = g.activeRegions()[0]!;
    const free = castSaga(new Rng(11), { focal, personal: false, region: reg, shape: 'feud', taken: () => false });
    const name = free.cast[0]!.name;
    const again = castSaga(new Rng(11), { focal, personal: false, region: reg, shape: 'feud', taken: n => n === name, placeOk: p => p !== free.places[0] });
    expect(again.cast[0]!.name).not.toBe(name);
    expect(again.places).not.toContain(free.places[0]);
  });

  it('D9: a known focal is named, with their past with you; at most one returning face (the client is then a stranger)', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: false });
    const reg = g.activeRegions()[0]!;
    const face = { id: 'lore-1', name: 'Harl Greyfell', sex: 'male' as const, race: 'human', memory: 'The company pulled him out of a burning mill.', where: 'at the ford' };
    const back = castSaga(new Rng(2), { focal, personal: false, region: reg, shape: 'rescue', taken: () => false, returningClient: face });
    expect(back.cast[0]).toMatchObject({ id: 'lore-1', seat: 'client', known: true, memory: face.memory, where: face.where });
    const both = castSaga(new Rng(2), { focal, personal: false, region: reg, shape: 'rescue', taken: () => false, returningClient: face, focalMemory: { memory: 'Sold you a lame horse.', where: 'in the hills' } });
    expect(both.cast[1]).toMatchObject({ focal: true, known: true, memory: 'Sold you a lame horse.', where: 'in the hills', seat: 'opponent' });
    expect(both.cast[0]!.id).not.toBe('lore-1');
    expect(both.cast.filter(p => p.memory)).toHaveLength(1);
  });

  it('D10: a personal seed\'s person takes a seat — the opponent\'s on a rival edge, a third seat otherwise', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal } = sagaChain(g, { N: 3, personal: true });
    const reg = g.activeRegions()[0]!;
    const kin = { id: 'lore-2', name: 'Odo Reed', sex: 'male' as const, race: 'human', memory: 'Her brother, left behind.', where: 'in a debt-master\'s yard' };
    const third = castSaga(new Rng(4), { focal, personal: true, region: reg, shape: 'rescue', taken: () => false, seedPerson: { ...kin, rival: false } });
    expect(third.cast.map(p => p.seat)).toEqual(['soldier', 'opponent', 'other']);
    expect(third.cast[2]).toMatchObject({ id: 'lore-2', part: PERSONAL_PARTS[2], known: true });
    const rival = castSaga(new Rng(4), { focal, personal: true, region: reg, shape: 'rescue', taken: () => false, seedPerson: { ...kin, rival: true } });
    expect(rival.cast.map(p => p.seat)).toEqual(['soldier', 'opponent']);
    expect(rival.cast[1]).toMatchObject({ id: 'lore-2', part: PERSONAL_PARTS[1], known: true });
  });
});

describe('the saga record', () => {
  it('survives a JSON round trip at every stage', async () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    const host = hostFor(g);
    const rec = flow.deal(host, chain, undefined, focal);
    expect(JSON.parse(JSON.stringify(rec))).toEqual(rec);
    await flow.plan(host, chain);
    await flow.card(host, chain);
    expect(JSON.parse(JSON.stringify(chain.saga))).toEqual(chain.saga);
    // and a reloaded record plays on exactly as the live one does
    const copy = { ...chain, saga: JSON.parse(JSON.stringify(chain.saga)) };
    expect(flow.posOf(copy.saga)).toEqual(flow.posOf(chain.saga!));
    expect(flow.chronicle(copy)).toEqual(flow.chronicle(chain));
  });
});

describe('EPISODE_TESTS and WAY_TESTS (D1, D2)', () => {
  const all = [...JOB_TYPES.flatMap(t => EPISODE_TESTS[t]), ...Object.values(WAY_TESTS)];
  it('every tag is one buildSlots keeps (FAVOR_OK) and every attribute a real one', () => {
    for (const o of all) {
      expect(['STR', 'DEX', 'INT', 'CHA', 'CON']).toContain(o.attribute);
      for (const t of [...o.favored, ...o.clashing]) expect(FAVOR_OK(t), t).toBe(true);
    }
  });
  it('no option zeroes a founder roster (20 seeds)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      seedIdCounter(1);
      const { g } = newGame(seed);
      const roster = g.roster();
      for (const o of all) expect(roster.every(m => hasClash(m.tags, o.favored, o.clashing)), `seed ${seed}: ${o.attribute} ${o.favored}`).toBe(false);
    }
  });
});
