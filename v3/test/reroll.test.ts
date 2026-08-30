// A card the player will not read is a dead slot on the board. Abandoning puts the LEAD back so
// the job can be written again — rationed to once a cycle so it is a second look, not a slot machine.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { Lead } from '../src/engine/quests.js';

const lead = (id: string): Lead => ({ id, rarity: 'common', level: 2, region: 'forests',
  archetype: 'contract', chainInfo: { kind: 'none' }, expiresAtCycle: 40, source: 'reward' });

async function gameWithQuest(seed = 3) {
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room');
  g.state.leads.push(lead('lead-t'));
  const r = await g.pursue('lead-t');
  return { g, questId: r.questId! };
}

describe('abandoning a quest returns its lead', () => {
  it('puts the lead back so the job can be written again', async () => {
    const { g, questId } = await gameWithQuest();
    expect(g.state.leads.some(l => l.id === 'lead-t')).toBe(false);   // consumed by pursue
    const r = g.abandon(questId);
    expect(r.ok).toBe(true);
    expect(g.state.leads.some(l => l.id === 'lead-t')).toBe(true);
    expect(g.state.quests.some(q => q.id === questId)).toBe(false);
  });

  it('the returned lead keeps its own identity, so the re-roll is the SAME job', async () => {
    const { g, questId } = await gameWithQuest();
    g.abandon(questId);
    const back = g.state.leads.find(l => l.id === 'lead-t')!;
    expect(back.archetype).toBe('contract');
    expect(back.level).toBe(2);
    expect(back.rarity).toBe('common');
    expect(back.expiresAtCycle).toBe(40);      // it ages while you hold it — dawdling costs
  });

  it('is once a cycle — the second abandon still works, but the lead is spent', async () => {
    const { g, questId } = await gameWithQuest();
    g.abandon(questId);
    expect(g.canReroll()).toBe(false);
    g.state.leads.push(lead('lead-u'));
    const r2 = await g.pursue('lead-u');
    const out = g.abandon(r2.questId!);
    expect(out.ok).toBe(true);                              // abandoning always works…
    expect(g.state.leads.some(l => l.id === 'lead-u')).toBe(false);   // …but no second re-roll
    expect(out.msg).toMatch(/once a cycle/);
  });

  it('the allowance comes back next cycle', async () => {
    const { g, questId } = await gameWithQuest();
    g.abandon(questId);
    expect(g.canReroll()).toBe(false);
    await g.endCycle();
    expect(g.canReroll()).toBe(true);
  });

  it('a saga beat has no lead to return to', async () => {
    const g = new Game(new MockProvider(9), 9);
    g.build('map-room');
    g.state.leads.push({ ...lead('lead-s'), rarity: 'uncommon', chainInfo: { kind: 'starts-new' } });
    const r = await g.pursue('lead-s');
    const out = g.abandon(r.questId!);
    expect(out.ok).toBe(true);
    // the ORIGINAL lead is not restored — a saga step is not a card you re-roll. (A sequel lead
    // may appear instead: that is §21-4a's road back after a saga slips, a different mechanism.)
    expect(g.state.leads.some(l => l.id === 'lead-s')).toBe(false);
    expect(g.canReroll()).toBe(true);            // and it did not spend the cycle's re-roll
  });
});
