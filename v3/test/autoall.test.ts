// auto-all must never leave a quest half-manned: a quest that is not fully manned does not march,
// so a soldier parked in one is wasted ("3 soldiers named across 3 quests" left one idle in a
// half-manned raid while a one-slot job went unmanned — playtest 2026-09-25).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

describe('auto-assign everything', () => {
  it('fills quests whole or not at all', async () => {
    const g = new Game(new MockProvider(9), 9);
    g.build('map-room');
    const extra = structuredClone(g.roster()[0]!); extra.id = 'c-x3'; extra.name = 'Third Blade';
    g.state.cards.push(extra);                       // three soldiers
    const ids: string[] = [];
    for (const k of [0, 1, 2]) {
      g.state.leads.push({ id: `aa${k}`, rarity: 'common', level: 1, region: 'forests', archetype: 'contract',
        chainInfo: { kind: 'none' }, expiresAtCycle: 40, source: 'reward' });
      ids.push((await g.pursue(`aa${k}`)).questId!);
    }
    const qs = ids.map(id => g.state.quests.find(q => q.id === id)!);
    const slot = qs[0]!.slots[0]!;
    // two-slot, two-slot, one-slot — three soldiers can man the first and the last, not all three
    qs[0]!.slots = [structuredClone(slot), structuredClone(slot)];
    qs[1]!.slots = [structuredClone(slot), structuredClone(slot)];
    qs[2]!.slots = [structuredClone(slot)];
    for (const q of qs) for (const s of q.slots) { s.filledBy = null; s.requirement = { kind: 'open' } }
    g.autoAssignAll();
    for (const q of qs) {
      const n = q.slots.filter(s => s.filledBy).length;
      expect(n === 0 || n === q.slots.length).toBe(true);
    }
    expect(qs.filter(q => q.slots.every(s => s.filledBy)).length).toBe(2);
  });
});
