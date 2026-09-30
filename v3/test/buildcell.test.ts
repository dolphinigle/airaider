// Game.build into a picked free cell (designer 2026-09-30: click a free cell, then choose what to build).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

describe('build into a chosen cell', () => {
  it('puts the room exactly in the picked free cell, not the first free one', () => {
    const g = new Game(new MockProvider(3), 3);
    const free = g.freeCells();
    expect(free.length).toBeGreaterThan(1);
    const target = free[free.length - 1]!;
    const r = g.build('map-room', undefined, target);
    expect(r.ok).toBe(true);
    const room = g.state.fort.rooms.find(x => x.id === r.id)!;
    expect(room.cell).toEqual(target);
    expect(g.freeCells().some(c => c.floor === target.floor && c.col === target.col)).toBe(false);
  });

  it('refuses a taken cell or a cell that does not exist, and spends nothing', () => {
    const g = new Game(new MockProvider(3), 3);
    const taken = g.state.fort.rooms[0]!.cell;
    const gold = g.gold();
    expect(g.build('map-room', undefined, taken)).toMatchObject({ ok: false, msg: 'that cell is already built on' });
    expect(g.build('map-room', undefined, { floor: 99, col: 0 })).toMatchObject({ ok: false });
    expect(g.gold()).toBe(gold);
  });

  it('with no cell given, still uses the first free cell', () => {
    const g = new Game(new MockProvider(3), 3);
    const first = g.freeCells()[0]!;
    const r = g.build('map-room');
    expect(g.state.fort.rooms.find(x => x.id === r.id)!.cell).toEqual(first);
  });
});
