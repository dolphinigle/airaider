// placementsFor / sendTo (the map drag + the card sheet's "send to", both UIs) and the room
// descriptions the build lists read (src/game/roomInfo.ts).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { coins } from '../src/engine/roll.js';
import { ROOM_TYPES } from '../src/engine/fort.js';
import { roomDesc } from '../src/game/roomInfo.js';

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

describe('placementsFor / sendTo', () => {
  it('names the best free slot on each quest, and sendTo puts the soldier exactly there', async () => {
    const g = await staged();
    const m = g.roster()[0]!;
    const rows = g.placementsFor(m.id);
    expect(rows.length).toBeGreaterThan(0);
    const r = rows[0]!;
    const q = g.state.quests.find(x => x.id === r.questId)!;
    // no other free, legal slot on that quest scores higher for this soldier
    for (const s of q.slots) if (!s.filledBy && (!q.approaches || s.groupId === q.chosenApproach) && s.requirement.kind === 'open')
      expect(coins(m, s.test)).toBeLessThanOrEqual(r.coins);
    expect(g.sendTo(r.questId, m.id).ok).toBe(true);
    expect(m.location).toMatchObject({ kind: 'quest', questId: r.questId, slot: r.idx });
  });

  it('moves a committed soldier instead of refusing', async () => {
    const g = await staged();
    const m = g.roster()[0]!;
    const rows = g.placementsFor(m.id);
    if (rows.length < 2) return;
    g.sendTo(rows[0]!.questId, m.id);
    expect(g.sendTo(rows[1]!.questId, m.id).ok).toBe(true);
    expect(m.location).toMatchObject({ kind: 'quest', questId: rows[1]!.questId });
    const first = g.state.quests.find(x => x.id === rows[0]!.questId)!;
    expect(first.slots.some(s => s.filledBy === m.id)).toBe(false);
  });
});

describe('roomDesc', () => {
  it('says what every buildable room does', () => {
    for (const rt of ROOM_TYPES) expect(roomDesc(rt.id), rt.id).not.toBe('');
  });
});
