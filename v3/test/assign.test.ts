// autoAssign / autoAssignAll / questCast — the engine both UIs share (docs/QUEST_SCREEN.md G5).
// Everything here is deterministic: the Mock narrator plus a fixed seed.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { coins } from '../src/engine/roll.js';
import type { Quest } from '../src/engine/quests.js';
import { logLines } from '../src/ai/storyteller.js';
import type { SagaCall } from '../src/ai/provider.js';
import { seedIdCounter } from '../src/engine/cards.js';

/** a game with a manned-up roster and at least one open quest */
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
/** the mock, but each saga card it writes names the person the ending decides (the focal), as a writer does once the
 *  story has met them */
class NamesFocal extends MockProvider {
  g!: Game;
  override async sagaCall(c: SagaCall): Promise<unknown> {
    const out = await super.sagaCall(c) as { card?: string };
    if (c.template !== 'card') return out;
    const focal = this.g.card(this.g.state.chains.at(-1)!.focalId)!;
    return { ...out, card: `${out.card} ${focal.name} waits.` };
  }
}
const openQuests = (g: Game) => g.state.quests.filter(q => q.state === 'open');
const activeSlots = (q: Quest) => q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;

describe('autoAssign', () => {
  it('mans a quest and every placement is a real, legal assignment', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    const before = activeSlots(q).filter(s => s.filledBy).length;
    const r = g.autoAssign(q.id);
    const filled = activeSlots(q).filter(s => s.filledBy);
    expect(r.placed).toBe(filled.length - before);
    // every filled slot points at a merc, and that merc points back at this slot
    for (const s of filled) {
      const m = g.card(s.filledBy!)!;
      expect(m.character?.role).toBe('merc');
      expect(m.location).toMatchObject({ kind: 'quest', questId: q.id });
    }
  });

  it('never puts the same soldier in two places', async () => {
    const g = await staged();
    g.autoAssignAll();
    const used = openQuests(g).flatMap(q => activeSlots(q).map(s => s.filledBy).filter(Boolean));
    expect(new Set(used).size).toBe(used.length);
  });

  it('is greedy: no free soldier beats the one it chose for a slot', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    g.autoAssign(q.id);
    const stillFree = g.roster().filter(m => m.location.kind === 'held');
    for (const s of activeSlots(q)) {
      if (!s.filledBy) continue;
      const mine = coins(g.card(s.filledBy)!, s.test);
      // nobody left on the bench should be a strictly better fit for a slot it already filled
      for (const other of stillFree) {
        expect(coins(other, s.test)).toBeLessThanOrEqual(mine);
      }
    }
  });

  it('fills empty slots only — a hand-picked soldier is never displaced', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches && x.slots.length > 1);
    if (!q) return;                                   // seed gave no multi-slot quest; nothing to prove
    const pick = g.roster().find(m => m.location.kind === 'held')!;
    expect(g.assign(q.id, 0, pick.id).ok).toBe(true);
    g.autoAssign(q.id);
    expect(q.slots[0]!.filledBy).toBe(pick.id);       // still the player's choice
  });

  it('re-running changes nothing once a quest is manned', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    g.autoAssign(q.id);
    const snap = q.slots.map(s => s.filledBy);
    const again = g.autoAssign(q.id);
    expect(again.placed).toBe(0);
    expect(q.slots.map(s => s.filledBy)).toEqual(snap);
  });

  it('refuses a branched quest until the player picks an approach', async () => {
    const g = await staged();
    const q = openQuests(g)[0]!;
    // stage a branch by hand — finales are rare in a three-cycle fixture
    q.approaches = [{ id: 'g0', label: 'Win them over', rewardKind: 'recruit' },
                    { id: 'g1', label: 'Subdue them', rewardKind: 'captive' }];
    q.slots.forEach((s, i) => { s.groupId = `g${i % 2}`; s.filledBy = null });
    q.chosenApproach = undefined;
    const r = g.autoAssign(q.id);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/approach/);
    expect(q.slots.every(s => !s.filledBy)).toBe(true);
    // once chosen it mans only that branch's slots
    g.chooseApproach(q.id, 'g0');
    g.autoAssign(q.id);
    expect(q.slots.filter(s => s.groupId === 'g1').every(s => !s.filledBy)).toBe(true);
  });

  it('honours a must-be slot, or leaves it empty', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    const [wanted, other] = g.roster().filter(m => m.location.kind === 'held');
    if (!wanted || !other) return;
    q.slots[0]!.requirement = { kind: 'must-be', cardId: wanted.id };
    g.autoAssign(q.id);
    expect([null, wanted.id]).toContain(q.slots[0]!.filledBy);
  });

  it('prefers the whole soldier when the hurt one is no better', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    const bench = g.roster().filter(m => m.location.kind === 'held');
    if (bench.length < 2) return;
    // wound whoever auto would otherwise have taken first, then re-run
    g.autoAssign(q.id);
    const first = q.slots.find(s => s.filledBy)?.filledBy;
    if (!first) return;
    q.slots.forEach(s => { if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s)) });
    g.card(first)!.character!.injuryTiers = 3;
    g.autoAssign(q.id);
    const now = q.slots.find(s => s.filledBy)?.filledBy;
    const alt = bench.find(m => m.id !== first);
    // either it picked somebody else, or the wounded one was genuinely the only fit
    expect(now === first ? bench.length === 1 || !alt : true).toBeTruthy();
  });

  it('says plainly when nobody free fits', async () => {
    const g = await staged();
    const q = openQuests(g).find(x => !x.approaches)!;
    g.autoAssignAll();                                 // drain the bench
    for (const s of q.slots) if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s));
    for (const m of g.roster().filter(m => m.location.kind === 'held')) {
      const other = openQuests(g).find(x => x.id !== q.id && x.slots.some(s => !s.filledBy));
      if (other) g.assign(other.id, other.slots.findIndex(s => !s.filledBy), m.id);
    }
    if (g.roster().some(m => m.location.kind === 'held')) return;   // bench not actually empty
    const r = g.autoAssign(q.id);
    expect(r.placed).toBe(0);
    expect(r.msg).toMatch(/nobody/);
  });
});

describe('questCast', () => {
  it('is empty for a one-off; a saga card lists the people it calls by name, as name and label', async () => {
    const g = await staged();
    let sagas = 0;
    for (const q of openQuests(g)) {
      const cast = g.questCast(q.id);
      if (!q.chainId) { expect(cast).toEqual([]); continue }
      sagas++;
      expect(cast.map(({ cardId: _, ...m }) => m)).toEqual(q.saga!.matter);
      for (const c of cast) { expect(c.name).toBeTruthy(); expect(c.label).toBeTruthy(); expect(c.label).not.toMatch(/^an? /) }
    }
    expect(sagas).toBeGreaterThan(0);
  });

  it('a person the card names who is a real card (the focal) carries that card; the people the story coined do not', async () => {
    seedIdCounter(1);
    const ai = new NamesFocal(7);
    const g = ai.g = new Game(ai, 7);
    g.build('map-room');
    const { questId } = await g.pursue(g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!.id);
    const q = g.state.quests.find(x => x.id === questId)!;
    const focal = g.card(g.state.chains.find(c => c.id === q.chainId)!.focalId)!;
    const cast = g.questCast(q.id);
    expect(cast.find(c => c.name === focal.name)?.cardId).toBe(focal.id);
    expect(focal.tags.length).toBeGreaterThan(0);
    // the client the plan coined is a name and a label only
    expect(cast.filter(c => c.name !== focal.name).length).toBeGreaterThan(0);
    for (const c of cast.filter(c => c.name !== focal.name)) expect(c.cardId).toBeUndefined();
  });

  it('the soldier of a personal saga, named on the card, carries their roster card', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(31), 31);
    g.build('map-room');
    g.build('lead-room');
    const merc = g.roster()[0]!;
    g.state.leads.push({ id: 'lead-p', rarity: 'uncommon', level: merc.character!.level, region: g.activeRegions()[0]!, archetype: 'investigate',
      chainInfo: { kind: 'starts-new' }, expiresAtCycle: g.state.cycle + 12, source: 'personal', title: `${merc.name}'s past stirs`, personalMercId: merc.id });
    const { questId } = await g.pursue('lead-p');
    expect(g.questCast(questId!).find(c => c.name === merc.name)?.cardId).toBe(merc.id);
  });

  it('never shows a person the card itself withheld', async () => {
    const g = await staged();
    for (const q of openQuests(g).filter(q => q.chainId)) {
      const shown = `${logLines(q.saga!.rows).join('\n')}\n${q.situation}`;
      for (const c of g.questCast(q.id)) expect(shown).toContain(c.name.split(/\s+/)[0]!);
    }
  });
});
