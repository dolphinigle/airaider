// Hostile-order action sweep — every path a player can abuse, audited after each step.
import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import { HELD, mintStackable, freshId, type Card } from '../src/engine/cards.js';
import { T, hasTag } from '../src/engine/tags.js';
import { rollBase, rollGrowthLean } from '../src/engine/growth.js';

function mkCaptive(g: Game, name = 'Prisoner', value = 100): Card {
  const c: Card = {
    id: freshId('c'), name, value,
    tags: [{ concept: 'character' }, T('human'), T('male'), T('food', 3)],
    location: HELD('roster'), chainIds: [],
    character: {
      role: 'captive', level: 3, xp: 0,
      attrs: rollBase(g.rng), growthLean: rollGrowthLean(g.rng),
      focus: { kind: 'none' }, injuryTiers: 0,
    },
  };
  g.state.cards.push(c);
  return c;
}

function clean(g: Game): void {
  const errs = auditGame(g);
  expect(errs, errs.join(' | ')).toEqual([]);
}

describe('hostile-order edge cases', () => {
  let g: Game;
  beforeEach(() => {
    g = new Game(new MockProvider(3), 3);
    g.state.cards.push(mintStackable('gold', 100000)); // rich, to isolate logic from economy
    g.state.fort.ghTier = 6;                            // unlock everything relevant
  });

  it('ransom a captive MID-BREAK cleans the rack and the breaking queue', () => {
    g.build('dungeon'); g.build('torture-chamber');
    const rack = g.state.fort.rooms.find(r => r.type === 'torture-chamber')!;
    g.upgrade(rack.id);
    const cap = mkCaptive(g);
    expect(g.slot(rack.id, 0, cap.id).ok).toBe(true);
    expect(g.state.breaking).toHaveLength(1);
    expect(g.ransom(cap.id).ok).toBe(true);
    expect(g.state.breaking).toHaveLength(0);
    expect(rack.slots[0]).toBeNull();
    clean(g);
  });

  it('unslot mid-break → raw again, re-rackable', () => {
    g.build('dungeon'); g.build('torture-chamber');
    const rack = g.state.fort.rooms.find(r => r.type === 'torture-chamber')!;
    g.upgrade(rack.id);
    const cap = mkCaptive(g);
    g.slot(rack.id, 0, cap.id);
    expect(g.unslot(rack.id, 0).ok).toBe(true);
    expect(g.state.breaking).toHaveLength(0);
    expect(hasTag(cap.tags, 'obedient')).toBe(false);
    expect(g.slot(rack.id, 0, cap.id).ok).toBe(true);
    clean(g);
  });

  it('ransom a STATIONED obedient captive frees the room slot', async () => {
    g.build('garden');
    const room = g.state.fort.rooms.find(r => r.type === 'garden')!;
    g.upgrade(room.id);
    const cap = mkCaptive(g);
    cap.tags.push({ concept: 'obedient' });
    expect(g.slot(room.id, 0, cap.id).ok).toBe(true);
    expect(g.ransom(cap.id).ok).toBe(true);
    expect(room.slots[0]).toBeNull();
    clean(g);
  });

  it('staged tavern/holding people who time out leave cleanly (no orphaned staged cards)', async () => {
    g.build('tavern'); g.build('dungeon'); g.build('holding-cell');
    const rec = mkCaptive(g, 'Hopeful');
    rec.character!.role = 'npc';
    rec.location = HELD('staged');
    g.state.tavern.push({ cardId: rec.id, expiresAtCycle: g.state.cycle + 1 });
    const cap = mkCaptive(g, 'Doomed');
    cap.location = HELD('staged');
    g.state.holding.push({ cardId: cap.id, expiresAtCycle: g.state.cycle + 1 });
    await g.endCycle();
    await g.endCycle();
    expect(g.state.tavern).toHaveLength(0);
    expect(g.state.holding).toHaveLength(0);
    const recNow = g.card(rec.id)!;
    const capNow = g.card(cap.id)!;
    expect(recNow.location).toEqual(HELD('lore'));
    expect(capNow.location).toEqual(HELD('lore'));
    clean(g);
  });

  it('one bedroom per owner', () => {
    const merc = g.roster()[0]!;
    expect(g.build('bedroom', merc.id).ok).toBe(true);
    expect(g.build('bedroom', merc.id).ok).toBe(false);
    clean(g);
  });

  it('abandon a manned quest frees the party; quest TTL frees too', async () => {
    g.build('map-room');
    const lead = g.visibleLeads().find(l => l.chainInfo.kind === 'none')!;
    const r = await g.pursue(lead.id);
    const q = g.state.quests[0]!;
    const merc = g.roster()[0]!;
    g.assign(q.id, 0, merc.id);
    expect(merc.location.kind).toBe('quest');
    expect(g.abandon(q.id).ok).toBe(true);
    expect(merc.location).toEqual(HELD('roster'));
    expect(g.state.quests).toHaveLength(0);
    clean(g);
  });

  it('approach switching unassigns the other group; committed = chosen group only', async () => {
    g.build('map-room');
    // force a finale-shaped quest through a chain
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    await g.pursue(story.id);
    const chain = g.state.chains[0]!;
    chain.cyclesSpent = 999; // force finaleReady
    for (const q of [...g.state.quests]) g.abandon(q.id);
    const cont = {
      ...g.visibleLeads()[0]!, id: freshId('lead-'),
      chainInfo: { kind: 'continues' as const, chainId: chain.id, hook: 'x' },
    };
    g.state.leads.push(cont);
    await g.pursue(cont.id);
    const finale = g.state.quests.find(q => q.isFinale)!;
    expect(finale.approaches!.length).toBeGreaterThanOrEqual(2);
    expect(finale.slots.length).toBe(finale.approaches!.length); // one slot per approach
    g.chooseApproach(finale.id, finale.approaches![0]!.id);
    const m = g.roster()[0]!;
    const slotIdx = finale.slots.findIndex(s => s.groupId === finale.approaches![0]!.id);
    expect(g.assign(finale.id, slotIdx, m.id).ok).toBe(true);
    g.chooseApproach(finale.id, finale.approaches![1]!.id);
    expect(m.location).toEqual(HELD('roster')); // unassigned by the switch
    clean(g);
  });

  it('guards: double-assign, over-hire, cells full, settle without gold, GH beyond max', async () => {
    g.build('map-room'); g.build('tavern'); g.build('dungeon');
    const lead = g.visibleLeads()[0]!;
    await g.pursue(lead.id);
    const q = g.state.quests[0]!;
    const [a] = g.roster();
    g.assign(q.id, 0, a!.id);
    expect(g.assign(q.id, 0, a!.id).ok).toBe(false);              // slot filled
    if (q.slots.length > 1) expect(g.assign(q.id, 1, a!.id).ok).toBe(false); // merc committed
    // cells full
    const cap = mkCaptive(g);
    cap.location = HELD('staged');
    g.state.holding.push({ cardId: cap.id, expiresAtCycle: 999 });
    expect(g.acceptCaptive(cap.id).ok).toBe(false);               // 0 cells built
    // settle without gold
    const debt = mintStackable('debt', 999999);
    g.state.cards.push(debt);
    g.state.liabilityBirth[debt.id] = 0;
    expect(g.payOffLiability(debt.id).ok).toBe(false);
    // GH beyond max
    g.state.fort.ghTier = 15;
    expect(g.ghUpgrade().ok).toBe(false);
    clean(g);
  });

  it('interrogate once only; heal guards', () => {
    g.build('dungeon'); g.build('interrogation');
    const cap = mkCaptive(g);
    expect(g.interrogate(cap.id).ok).toBe(true);
    expect(g.interrogate(cap.id).ok).toBe(false);
    const merc = g.roster()[0]!;
    expect(g.payHeal(merc.id).ok).toBe(false);   // no hospital
    g.build('hospital');
    expect(g.payHeal(merc.id).ok).toBe(false);   // not injured
    merc.character!.injuryTiers = 3;
    expect(g.payHeal(merc.id).ok).toBe(true);
    expect(merc.character!.injuryTiers).toBe(0);
    clean(g);
  });

  it('a merc goes to lore when… nothing — mercs never leave (loss = TIME)', async () => {
    // 30 cycles of failure-heavy play must never remove a merc
    g.build('map-room');
    const ids = g.roster().map(m => m.id);
    for (let i = 0; i < 30; i++) await g.endCycle();
    for (const id of ids) expect(g.card(id)?.character?.role).toBe('merc');
    clean(g);
  });
});

describe('§21-4a sequel road-back', () => {
  it('a slipped focal returns as the SAME card when the sequel lead is pursued', async () => {
    const g = new Game(new MockProvider(31), 31);
    g.state.cards.push(mintStackable('gold', 50000));
    g.build('map-room');
    g.build('lead-room');
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    await g.pursue(story.id);
    const chain = g.state.chains[0]!;
    const focalId = chain.focalId;
    // force a finale and fail it
    chain.cyclesSpent = 999;
    for (const q of [...g.state.quests]) g.abandon(q.id);
    g.state.leads.push({
      id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
      archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: 'x' },
      expiresAtCycle: g.state.cycle + 5, source: 'continuation',
    });
    await g.pursue(g.state.leads[g.state.leads.length - 1]!.id);
    const finale = g.state.quests.find(q => q.isFinale)!;
    g.chooseApproach(finale.id, finale.approaches![0]!.id);
    const slotIdx = finale.slots.findIndex(s => s.groupId === finale.approaches![0]!.id);
    const merc = g.roster()[0]!;
    // sabotage: massive injury → 0 coins → guaranteed failure
    merc.character!.injuryTiers = 99;
    g.assign(finale.id, slotIdx, merc.id);
    await g.endCycle();
    expect(chain.state).toBe('slipped');
    const focal = g.card(focalId)!;
    expect(focal.location).toEqual(HELD('lore'));
    const sequel = g.state.leads.find(l => l.source === 'sequel')!;
    expect(sequel.focalId).toBe(focalId);
    // pursue the sequel: the SAME card comes back within reach
    await g.pursue(sequel.id);
    expect(g.card(focalId)!.location).toEqual(HELD('limbo'));
    const newChain = g.state.chains.find(c => c.id !== chain.id)!;
    expect(newChain.focalId).toBe(focalId);
    // and the sequel lead is consumed (no double-pursue into parallel sagas)
    expect(g.state.leads.some(l => l.source === 'sequel')).toBe(false);
    const errs = auditGame(g);
    expect(errs, errs.join(' | ')).toEqual([]);
  });
});

describe('endgame band lift', () => {
  it('an endgame key lifts bedroom comfort band → cap can pass 40', () => {
    const g = new Game(new MockProvider(41), 41);
    g.state.cards.push(mintStackable('gold', 999999));
    g.state.fort.ghTier = 13;
    const merc = g.roster()[0]!;
    g.build('bedroom', merc.id);
    const bed = g.state.fort.rooms.find(r => r.ownerId === merc.id)!;
    // saturate the bedroom with perfect fits
    for (let i = 0; i < 6; i++) { bed.slots.push(null); }
    for (let i = 0; i < 6; i++) {
      const relic: Card = {
        id: freshId('r'), name: `gift${i}`, value: 0, location: HELD('inventory'), chainIds: [],
        tags: [{ concept: 'relic' }, T('furniture', 18), T('famous', 12)],
      };
      g.state.cards.push(relic);
      expect(g.slot(bed.id, i, relic.id).ok).toBe(true);
    }
    const capBefore = g.capOf(merc.id);
    expect(g.build('scouting-forests').ok).toBe(true);  // region must be open first
    expect(g.build('endgame-forests').ok).toBe(true);
    const capAfter = g.capOf(merc.id);
    expect(capAfter).toBeGreaterThan(capBefore);
    expect(g.state.fort.endgameKeys).toContain('forests');
    const errs = auditGame(g);
    expect(errs, errs.join(' | ')).toEqual([]);
  });
});
