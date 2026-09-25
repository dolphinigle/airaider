// A trait is never favored AND clashing on one test: a finale plan read "favors social … clashes
// social", and the dice line credited and docked the same soldier for the same trait.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

describe('a quest slot test', () => {
  it('drops a clashing trait that is also favored', () => {
    const g = new Game(new MockProvider(3), 3);
    const slots = (g as unknown as { buildSlots(...a: unknown[]): { test: { favored: string[]; clashing: string[] } }[] })
      .buildSlots(1, 2, 'common', 'contract', [{ attribute: 'cha', favored: ['social'], clashing: ['social', 'hotheaded'] }]);
    const t = slots[0]!.test;
    expect(t.favored).toContain('social');
    expect(t.clashing).not.toContain('social');
  });
});
