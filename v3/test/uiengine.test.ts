// The engine verdicts the UIs render (GUI pass 2026-09-30, package F1): the pooled odds band and
// slot strength, the ONE quest-legality predicate + sendTo moves/swaps, the room placement API
// (roomPlacementsFor / setInRoom), price quotes, pre-click blocks, and the leads board.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import { HELD, mintStackable, freshId, type Card } from '../src/engine/cards.js';
import { T } from '../src/engine/tags.js';
import { rollBase, rollGrowthLean } from '../src/engine/growth.js';
import { oddsBand, slotStrength, coinsBreakdown, coinsWhy, type Band } from '../src/engine/roll.js';

const BAND_RANK: Record<Band, number> = { hopeless: 0, long: 1, partial: 2, even: 3, likely: 4 };

function mkCaptive(g: Game, tags = ['food'], obedient = false): Card {
  const c: Card = {
    id: freshId('c'), name: `Prisoner ${Math.random().toString(36).slice(2, 6)}`, value: 100,
    tags: [{ concept: 'character' }, T('human'), T('male'), ...tags.map(t => T(t, 3)), ...(obedient ? [T('obedient')] : [])],
    location: HELD('roster'), chainIds: [],
    character: { role: 'captive', level: 3, xp: 0, attrs: rollBase(g.rng), growthLean: rollGrowthLean(g.rng), focus: { kind: 'none' }, injuryTiers: 0 },
  };
  g.state.cards.push(c);
  return c;
}
function mkRelic(g: Game, tags: string[], value = 80): Card {
  const c: Card = { id: freshId('r'), name: `Relic ${tags.join('-')}`, value, tags: [{ concept: 'relic' }, ...tags.map(t => T(t, 2))], location: HELD('inventory'), chainIds: [] };
  g.state.cards.push(c);
  return c;
}
function rich(): Game {
  const g = new Game(new MockProvider(5), 5);
  g.state.cards.push(mintStackable('gold', 100000));
  g.state.fort.ghTier = 6;
  for (let i = 0; i < 8; i++) g.excavate();
  return g;
}
const clean = (g: Game) => { const e = auditGame(g); expect(e, e.join(' | ')).toEqual([]) };

async function staged(seed = 9101) {
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room');
  for (let c = 0; c < 3 && g.state.quests.filter(q => q.state === 'open').length < 2; c++) {
    for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
    if (g.state.quests.filter(q => q.state === 'open').length >= 2) break;
    await g.endCycle();
  }
  return g;
}

describe('odds band + slot strength (R2)', () => {
  it('a 5-coin party against a 3.75 bar is a long shot or worse', () => {
    expect(BAND_RANK[oddsBand(5, 3.75)]).toBeLessThanOrEqual(BAND_RANK.long);
  });
  it('is monotone in coins', () => {
    for (const bar of [3, 7.5, 12, 20]) {
      let prev = -1;
      for (let c = 0; c <= 60; c++) {
        const r = BAND_RANK[oddsBand(c, bar)];
        expect(r).toBeGreaterThanOrEqual(prev);
        prev = r;
      }
      expect(oddsBand(60, bar)).toBe('likely');
      expect(oddsBand(0, bar)).toBe('hopeless');
    }
  });
  it('strength is scale-free: expected heads against the place bar', () => {
    expect(slotStrength(24, 10)).toBe('strong');
    expect(slotStrength(17, 10)).toBe('fair');
    expect(slotStrength(10, 10)).toBe('weak');
  });
  it('questOdds carries the band at Oracle precision 0 once manned, null before', async () => {
    const g = await staged();
    const q = g.state.quests.find(x => x.state === 'open' && !x.approaches)!;
    expect(g.questOdds(q.id).precision).toBe(0);
    expect(g.questOdds(q.id).band).toBeNull();
    g.autoAssign(q.id);
    const o = g.questOdds(q.id);
    if (o.filled === o.of) {
      expect(o.band).toBe(oddsBand(o.coins, o.bar));
      expect(o.success).toBeNull();   // the % stays Oracle-gated
    }
    expect(o.partialAt).toBeCloseTo(0.6 * o.bar);
  });
  it('why.wound equals the injury term of coinsBreakdown', async () => {
    const g = await staged();
    const m = g.roster()[0]!;
    m.character!.injuryTiers = 3;
    const t = g.state.quests.find(x => x.state === 'open')!.slots[0]!.test;
    expect(coinsWhy(m, t).wound).toBeCloseTo(-coinsBreakdown(m, t).injury, 1);
    expect(g.woundPenalty(m.id)).toBeCloseTo(-coinsBreakdown(m, t).injury, 1);
  });
});

describe('canTake / sendTo — one legality predicate, moves and swaps', () => {
  it('canTake() === null ⇔ sendTo(q, m, idx) succeeds, for every place and soldier', async () => {
    const g = await staged();
    const snapshot = g.save();
    for (const q of g.state.quests.filter(x => x.state === 'open')) {
      q.slots.forEach((_, idx) => {
        for (const m of g.roster()) {
          const h = Game.load(new MockProvider(1), snapshot);
          const legal = h.canTake(q.id, idx, m.id) === null;
          const r = h.sendTo(q.id, m.id, idx);
          expect(r.ok, `${q.id}/${idx}/${m.id}: ${r.msg}`).toBe(legal);
          if (r.ok) expect(h.card(m.id)!.location).toMatchObject({ kind: 'quest', questId: q.id, slot: idx });
        }
      });
    }
  });
  it('fits with blocked === null are exactly the soldiers assign() accepts into an empty place', async () => {
    const g = await staged();
    const q = g.state.quests.find(x => x.state === 'open' && !x.approaches)!;
    q.slots[0]!.requirement = { kind: 'must-have', concept: 'lore' };
    const snapshot = g.save();
    for (const f of g.slotFits(q.id, 0)) {
      const h = Game.load(new MockProvider(1), snapshot);
      expect(h.assign(q.id, 0, f.id).ok).toBe(f.blocked === null);
    }
  });
  it('sendTo with a place moves a committed soldier; their old place empties', async () => {
    const g = await staged();
    const qs = g.state.quests.filter(x => x.state === 'open' && !x.approaches);
    const m = g.roster()[0]!;
    const a = qs[0]!, b = qs[1] ?? qs[0]!;
    const ia = a.slots.findIndex((_, i) => g.canTake(a.id, i, m.id) === null);
    const ib = b.slots.findIndex((_, i) => g.canTake(b.id, i, m.id) === null && !(b === a && i === ia));
    if (ia < 0 || ib < 0) return;
    expect(g.sendTo(a.id, m.id, ia).ok).toBe(true);
    expect(g.sendTo(b.id, m.id, ib).ok).toBe(true);
    expect(a.slots[ia]!.filledBy === m.id).toBe(false);
    expect(b.slots[ib]!.filledBy).toBe(m.id);
    clean(g);
  });
  it('an occupied place SWAPS: the holder takes the mover\'s old place when legal', async () => {
    const g = await staged();
    const q = g.state.quests.find(x => x.state === 'open' && !x.approaches && x.slots.length >= 2);
    const [m1, m2] = g.roster();
    if (!q || !m1 || !m2) return;
    q.slots.forEach(s => { s.requirement = { kind: 'open' }; s.groupId = undefined });
    expect(g.sendTo(q.id, m1.id, 0).ok).toBe(true);
    expect(g.sendTo(q.id, m2.id, 1).ok).toBe(true);
    const r = g.sendTo(q.id, m1.id, 1);
    expect(r.ok).toBe(true);
    expect(q.slots[1]!.filledBy).toBe(m1.id);
    expect(q.slots[0]!.filledBy).toBe(m2.id);
    expect(r.msg).toMatch(/swaps/);
    clean(g);
  });
});

describe('room placement API', () => {
  it('every ok row is accepted by setInRoom, and prestigeAfter is what prestige() reads after', () => {
    const g = rich();
    for (const t of ['dungeon', 'dungeon-cell', 'torture-chamber', 'garden', 'kitchen', 'dining-hall', 'infirmary']) expect(g.build(t).ok).toBe(true);
    for (const r of g.state.fort.rooms) if (g.roomKind(r)) { g.upgrade(r.id); g.upgrade(r.id) }
    const cards = [mkRelic(g, ['food']), mkRelic(g, ['curio', 'nature']), mkRelic(g, ['decoration']), mkRelic(g, ['furniture']),
      mkCaptive(g), mkCaptive(g, ['food'], true)];
    // fill some places so full-room swaps get exercised
    const garden = g.state.fort.rooms.find(r => r.type === 'garden')!;
    g.setInRoom(garden.id, cards[3]!.id); g.setInRoom(garden.id, cards[2]!.id);
    const snapshot = g.save();
    let oks = 0;
    for (const c of cards) {
      for (const row of g.roomPlacementsFor(c.id)) {
        if (!row.ok) continue;
        oks++;
        const h = Game.load(new MockProvider(1), snapshot);
        const r = h.setInRoom(row.roomId!, c.id);
        expect(r.ok, `${c.name} → ${row.roomName}: ${r.msg}`).toBe(true);
        expect(h.prestige()).toBeCloseTo(row.prestigeAfter, 6);
        clean(h);
      }
    }
    expect(oks).toBeGreaterThan(3);
  });

  it('models the FULL move: a relic leaving one prestige room for another is a net change', () => {
    const g = rich();
    g.build('garden'); g.build('kitchen');
    const garden = g.state.fort.rooms.find(r => r.type === 'garden')!, kitchen = g.state.fort.rooms.find(r => r.type === 'kitchen')!;
    g.upgrade(garden.id); g.upgrade(kitchen.id);
    const relic = mkRelic(g, ['curio']);
    expect(g.setInRoom(garden.id, relic.id).ok).toBe(true);
    const row = g.roomPlacementsFor(relic.id).find(r => r.roomId === kitchen.id)!;
    expect(row.ok).toBe(true);
    const before = g.prestige();
    const naive = before + g.roomPlacementsFor(mkRelic(g, ['curio']).id).find(r => r.roomId === kitchen.id)!.gain;
    expect(row.prestigeAfter).toBeLessThan(naive);   // it loses the Garden's share on the way
    g.setInRoom(kitchen.id, relic.id);
    expect(g.prestige()).toBeCloseTo(row.prestigeAfter, 6);
    expect(garden.slots[0]).toBeNull();
  });

  it('racks never swap: a full rack answers "rack full"', () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('torture-chamber');
    const rack = g.state.fort.rooms.find(r => r.type === 'torture-chamber')!;
    g.upgrade(rack.id);
    const a = mkCaptive(g), b = mkCaptive(g);
    expect(g.setInRoom(rack.id, a.id).ok).toBe(true);
    const r = g.setInRoom(rack.id, b.id);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/rack full/);
    const r2 = g.setInRoom(rack.id, b.id, 0);
    expect(r2.ok).toBe(false);
    expect(rack.slots[0]).toBe(a.id);
    expect(g.roomPlacementsFor(b.id).find(p => p.roomId === rack.id)!.ok).toBe(false);
    clean(g);
  });

  it('one breaking entry per captive: re-racking is refused, rows exclude racks while breaking', () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('torture-chamber'); g.build('torture-chamber');
    const [r1, r2] = g.state.fort.rooms.filter(r => r.type === 'torture-chamber');
    // (not multiBuild — one chamber; give it two racks instead)
    const rack = r1!;
    g.upgrade(rack.id); g.upgrade(rack.id);
    expect(r2).toBeUndefined();
    const a = mkCaptive(g);
    expect(g.slot(rack.id, 0, a.id).ok).toBe(true);
    expect(g.slot(rack.id, 1, a.id).ok).toBe(false);          // moving rack→rack would double the entry
    expect(g.state.breaking.filter(b => b.cardId === a.id)).toHaveLength(1);
    expect(g.roomPlacementsFor(a.id).some(p => p.kind === 'rack')).toBe(false);
    expect(g.captiveState(a.id)!.state).toBe('breaking');
    clean(g);
  });

  it('unslot off a rack says what was lost; rackLoss() names it before the click', () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('torture-chamber');
    const rack = g.state.fort.rooms.find(r => r.type === 'torture-chamber')!;
    g.upgrade(rack.id);
    const a = mkCaptive(g);
    g.setInRoom(rack.id, a.id);
    const due = g.state.breaking.find(b => b.cardId === a.id)!.doneAtCycle;
    expect(g.rackLoss(a.id)).toBe(`breaking lost (was due c${due})`);
    const r = g.unslot(rack.id, 0);
    expect(r.msg).toMatch(/breaking lost/);
    expect(r.warn).toBe(true);
    expect(g.state.breaking).toHaveLength(0);
    expect(g.captiveState(a.id)!.state).toBe('raw');
  });

  it('refusals name the reason and carry a fix; a 0-place room offers "Add a place"', () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('kitchen');
    const kitchen = g.state.fort.rooms.find(r => r.type === 'kitchen')!;
    const raw = mkCaptive(g);
    const rows = g.roomPlacementsFor(raw.id);
    expect(rows.find(r => r.roomId === kitchen.id)!.reason).toMatch(/tamed captives only/);
    // no Torture chamber: a build row
    const build = rows.find(r => r.roomId === null)!;
    expect(build.fix).toMatchObject({ action: 'build', type: 'torture-chamber' });
    const relic = mkRelic(g, ['food']);
    const k = g.roomPlacementsFor(relic.id).find(r => r.roomId === kitchen.id)!;
    expect(k.ok).toBe(false);
    expect(k.fix).toMatchObject({ action: 'upgrade', roomId: kitchen.id });
    expect(g.addPlaceFix(kitchen)).toMatchObject({ action: 'upgrade', cost: expect.any(Number) });
    // the dungeon cell is not a place to "set" anyone
    expect(rows.some(r => r.roomType === 'dungeon-cell')).toBe(false);
  });

  it('the build message carries no internal room id', () => {
    const g = rich();
    const r = g.build('garden');
    expect(r.msg).not.toMatch(/room-/);
    expect(r.id).toMatch(/^room-/);
  });
});

describe('quotes and blocks — the true number and the refusal before the click', () => {
  it('ransomQuote / sellQuote equal the gold ransom() / sell() pay', () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('market');
    const caps = [mkCaptive(g), mkCaptive(g), mkCaptive(g)];
    caps[1]!.value = 237; caps[2]!.value = 55;
    for (const [i, c] of caps.entries()) {
      const q = i % 2 ? g.sellQuote(c.id)! : g.ransomQuote(c.id)!;
      const before = g.gold();
      expect((i % 2 ? g.sell(c.id) : g.ransom(c.id)).ok).toBe(true);
      expect(g.gold() - before).toBe(q);
    }
    const relic = mkRelic(g, ['curio'], 300);
    const q = g.sellQuote(relic.id)!;
    const before = g.gold();
    g.sell(relic.id);
    expect(g.gold() - before).toBe(q);
  });

  it('acceptBlock is non-null iff acceptCaptive fails', () => {
    const g = rich();
    const stage = () => { const c = mkCaptive(g); c.location = HELD('staged'); g.state.holding.push({ cardId: c.id, expiresAtCycle: 99 }); return c };
    const a = stage();
    expect(g.acceptBlock(a.id)!.fix).toMatchObject({ action: 'build', type: 'dungeon' });
    expect(g.acceptCaptive(a.id).ok).toBe(false);
    g.build('dungeon');
    expect(g.acceptBlock(a.id)!.reason).toMatch(/no cells/);
    g.build('dungeon-cell');
    expect(g.acceptBlock(a.id)).toBeNull();
    expect(g.acceptCaptive(a.id).ok).toBe(true);
    for (let i = 0; i < 2; i++) g.acceptCaptive(stage().id);
    const d = stage();
    expect(g.acceptBlock(d.id)!.reason).toBe('cells full 3/3');
    expect(g.acceptCaptive(d.id).ok).toBe(false);
  });

  it('ghBlock is null iff ghUpgrade succeeds', () => {
    const g = new Game(new MockProvider(5), 5);
    expect(g.ghBlock()).not.toBeNull();
    expect(g.ghUpgrade().ok).toBe(false);
    g.state.cards.push(mintStackable('gold', 100000));
    for (const t of ['garden']) g.build(t);
    const garden = g.state.fort.rooms.find(r => r.type === 'garden')!;
    g.upgrade(garden.id);
    g.setInRoom(garden.id, mkRelic(g, ['nature', 'curio']).id);
    const block = g.ghBlock();
    expect(g.ghUpgrade().ok).toBe(block === null);
    expect(g.ghInfo().unlocks.length).toBeGreaterThan(0);
  });

  it('pursueBlock is non-null iff enqueuePursue refuses; activeRegions never empty', async () => {
    const g = new Game(new MockProvider(5), 5);
    expect(g.activeRegions()).toEqual(['forests']);
    g.build('map-room');
    const lead = g.visibleLeads()[0]!;
    expect(g.pursueBlock(lead.id)).toBeNull();
    expect(g.enqueuePursue(lead.id).ok).toBe(true);
    expect(g.pursueBlock(lead.id)).not.toBeNull();
    expect(g.enqueuePursue(lead.id).ok).toBe(false);
    const board = g.leadBoard();
    expect(board.find(r => r.lead.id === lead.id)!.working).not.toBeNull();
    await g.drain();
  });

  it('pursueAll queues every pursuable lead once', async () => {
    const g = new Game(new MockProvider(5), 5);
    g.build('map-room');
    const n = g.leadBoard().filter(r => !r.blocked).length;
    const r = g.pursueAll();
    expect(r.jobIds).toHaveLength(n);
    expect(g.pursueAll().ok).toBe(false);
    await g.drain();
  });
});
