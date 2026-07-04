// Chaos monkey: a storm of random actions (valid ids, stale ids, garbage) must never
// corrupt state or throw — only return ok:false. Audit runs throughout.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import { Rng } from '../src/engine/rng.js';
import { mintStackable } from '../src/engine/cards.js';

describe('chaos monkey', () => {
  it('4000 random actions, audited — no throws, no corruption', async () => {
    const g = new Game(new MockProvider(13), 13);
    g.state.cards.push(mintStackable('gold', 3000));
    const rng = new Rng(999); // driver rng, separate from the game's
    const ROOMS = ['map-room', 'lead-room', 'mess-hall', 'storage', 'tavern', 'dungeon', 'holding-cell',
      'dungeon-cell', 'torture-chamber', 'infirmary', 'dining-hall', 'kitchen', 'garden', 'bedroom',
      'scouting-forests', 'recruiting-forests', 'trophy-room', 'gallery', 'market', 'oracle', 'nonsense-room'];
    const STYLES = ['elven', 'ancient', 'garbage-style', 'human'];

    const anyId = (): string => {
      const pools: string[][] = [
        g.state.cards.map(c => c.id),
        g.state.fort.rooms.map(r => r.id),
        g.state.quests.map(q => q.id),
        g.visibleLeads().map(l => l.id),
        ['bogus', 'q999', 'room-999', 'c999', ''],
      ];
      const pool = pools[rng.int(pools.length)]!;
      return pool.length ? pool[rng.int(pool.length)]! : 'empty';
    };

    let acted = 0;
    for (let i = 0; i < 4000; i++) {
      const roll = rng.int(20);
      try {
        switch (roll) {
          case 0: g.build(ROOMS[rng.int(ROOMS.length)]!, rng.chance(0.3) ? anyId() : undefined); break;
          case 1: g.upgrade(anyId()); break;
          case 2: await g.renovate(anyId(), STYLES[rng.int(STYLES.length)]!); break;
          case 3: g.excavate(); break;
          case 4: g.ghUpgrade(); break;
          case 5: g.slot(anyId(), rng.int(4), anyId()); break;
          case 6: g.unslot(anyId(), rng.int(4)); break;
          case 7: await g.pursue(anyId()); break;
          case 8: g.assign(anyId(), rng.int(4), anyId()); break;
          case 9: g.unassign(anyId(), rng.int(4)); break;
          case 10: g.chooseApproach(anyId(), `g${rng.int(4)}`); break;
          case 11: g.abandon(anyId()); break;
          case 12: g.hire(anyId()); break;
          case 13: g.acceptCaptive(anyId()); break;
          case 14: g.ransom(anyId()); break;
          case 15: g.sell(anyId()); break;
          case 16: g.payOffLiability(anyId()); break;
          case 17: g.interrogate(anyId()); break;
          case 18: g.payHeal(anyId()); break;
          case 19: await g.endCycle(); break;
        }
        acted++;
      } catch (e) {
        throw new Error(`action ${roll} threw at step ${i}: ${(e as Error).message}`);
      }
      if (i % 25 === 0) {
        const errs = auditGame(g);
        expect(errs, `step ${i} (action ${roll}): ${errs.join(' | ')}`).toEqual([]);
      }
    }
    expect(acted).toBe(4000);
    const errs = auditGame(g);
    expect(errs, errs.join(' | ')).toEqual([]);
  }, 120_000);
});
