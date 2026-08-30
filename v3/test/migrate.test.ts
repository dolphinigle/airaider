// A standing faucet lead is minted once, when its building goes up, and then lives forever — so a
// change to what the faucet deals never reaches a game already in progress without a migration.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

describe('save migration', () => {
  it("retypes an in-progress Recruiting post's standing lead from rescue to hire", () => {
    const g = new Game(new MockProvider(5), 5);
    g.state.leads.push({ id: 'lead-old', rarity: 'common', level: 2, region: 'forests',
      archetype: 'rescue', chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'recruiting' } as never);
    const back = Game.load(new MockProvider(5), g.save());
    expect(back.state.leads.find(l => l.id === 'lead-old')?.archetype).toBe('hire');
  });

  it('leaves an ordinary rescue lead alone — only the faucet is retyped', () => {
    const g = new Game(new MockProvider(6), 6);
    g.state.leads.push({ id: 'lead-plain', rarity: 'common', level: 2, region: 'forests',
      archetype: 'rescue', chainInfo: { kind: 'none' }, expiresAtCycle: 30, source: 'reward' } as never);
    const back = Game.load(new MockProvider(6), g.save());
    expect(back.state.leads.find(l => l.id === 'lead-plain')?.archetype).toBe('rescue');
  });
});
