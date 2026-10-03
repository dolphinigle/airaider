// The STORY rng (docs/STORYTELLER.md §2.4): every saga story draw runs on its own persisted stream, so the main rng —
// mechanics, the §20 baselines — never moves on one.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { seedIdCounter } from '../src/engine/cards.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, hostFor } from './sagaharness.js';

describe('storyRng', () => {
  it('is saved and loaded beside the main rng', () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(3), 3);
    g.storyRng.next(); g.storyRng.next();
    const snap = g.save();
    expect(JSON.parse(snap).storyRngState).toEqual(g.storyRng.state());
    const b = Game.load(new MockProvider(3), snap);
    expect(b.storyRng.state()).toEqual(g.storyRng.state());
    expect([b.storyRng.next(), b.storyRng.next()]).toEqual([g.storyRng.next(), g.storyRng.next()]);
  });
  it('an older save without one seeds it from the game seed', () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(4), 4);
    const st = JSON.parse(g.save());
    delete st.storyRngState;
    const b = Game.load(new MockProvider(4), JSON.stringify(st));
    expect(b.storyRng.state()).toEqual(new Game(new MockProvider(4), 4).storyRng.state());
    expect(b.storyRng.state()).not.toEqual(b.rng.state());
  });
  it('the deal and the cast leave the main rng where it was, and the mock\'s saga calls draw nothing from it', async () => {
    for (const personal of [false, true]) {
      seedIdCounter(1);
      const { g } = newGame(17);
      const { chain, focal } = sagaChain(g, { N: 4, personal });
      const host = hostFor(g);
      const main = g.rng.state();
      const story = g.storyRng.state();
      flow.deal(host, chain, undefined, focal);
      expect(g.rng.state()).toEqual(main);
      expect(g.storyRng.state()).not.toEqual(story);
      await flow.plan(host, chain);
      await flow.card(host, chain);
      expect(g.rng.state()).toEqual(main);
    }
  });
  it('the same story stream deals the same saga', () => {
    const world = () => {
      seedIdCounter(1);
      const { g } = newGame(23);
      const { chain, focal } = sagaChain(g, { N: 3, personal: false });
      return flow.deal(hostFor(g), chain, undefined, focal).world;
    };
    expect(world()).toEqual(world());
  });
});
