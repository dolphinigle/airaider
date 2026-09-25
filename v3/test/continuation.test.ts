// A saga the player already took is not news from the board: its next step must reach them
// without the Lead room. The day-0 packet deals a ✦STORY lead pre-Lead-room; beat 1 resolved and
// beat 2's continuation sat invisible, so the saga silently stalled (playtest 2026-09-25).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

describe('a saga continuation before the Lead room', () => {
  it('is visible and pursuable with only a Map room', async () => {
    const g = new Game(new MockProvider(11), 11);
    g.build('map-room');
    expect(g.hasRoom('lead-room')).toBe(false);
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new');
    expect(story).toBeDefined();
    const r = await g.pursue(story!.id);
    expect(r.ok).toBe(true);
    g.autoAssign(r.questId!);
    await g.endCycle();
    const cont = g.state.leads.find(l => l.source === 'continuation');
    expect(cont).toBeDefined();
    expect(g.visibleLeads().some(l => l.id === cont!.id)).toBe(true);
  });
});
