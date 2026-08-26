// TEMPO G3/P11/P15: the reckoning is READ while it is written. Each marching quest holds a slot
// on the screen in quest-id order, and that slot is filled the moment ITS OWN ai call lands —
// so a finished report never waits on a slow one, and the telling order never depends on the
// network. These are the guarantees the GUI's reckoning page is built on; nothing else pins them.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { ResolveQuestInput, ResolveQuestOut } from '../src/ai/provider.js';

/** a provider whose resolutions land at staggered times, LAST quest first — the out-of-order
 *  arrival a real provider produces and the plain mock (instant, in submission order) cannot */
class StaggeredMock extends MockProvider {
  override async resolve(inputs: ResolveQuestInput[], onEach?: (o: ResolveQuestOut) => void): Promise<ResolveQuestOut[]> {
    const outs = await super.resolve(inputs);          // no onEach — we fire it ourselves, staggered
    const order = [...outs].reverse();
    for (const o of order) { await new Promise(r => setTimeout(r, 20)); onEach?.(o) }
    return outs;
  }
  /** the real flesh call costs 12-16s and runs AFTER every report line is in — the player must
   *  not be held for it (TEMPO P21), so the test needs a tail long enough to observe */
  override async flesh(inputs: Parameters<MockProvider['flesh']>[0]) {
    await new Promise(r => setTimeout(r, 60));
    return super.flesh(inputs);
  }
}

/** drive a game until `want` quests march in the same cycle */
async function stage(g: Game, want: number): Promise<void> {
  g.build('map-room'); g.build('lead-room');
  for (let i = 0; i < 12; i++) {
    for (const lead of g.visibleLeads().slice(0, want)) {
      if (g.state.quests.filter(q => q.state === 'open').length >= want) break;
      await g.pursue(lead.id);
    }
    for (const q of g.state.quests.filter(q => q.state === 'open')) {
      if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
      for (let s = 0; s < q.slots.length; s++) {
        const slot = q.slots[s]!;
        if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
        const free = g.roster().find(m => m.location.kind === 'held');
        if (free) g.assign(q.id, s, free.id);
      }
    }
    if (marching(g) >= want) return;
    await g.endCycle();
  }
  throw new Error(`could not stage ${want} marching quests`);
}
const marching = (g: Game) => g.state.quests.filter(q => q.state === 'open'
  && (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy)).length;

describe('the reckoning is readable while it is written', () => {
  it('is null outside a cycle, and holds a slot per marching quest in id order during one', async () => {
    const g = new Game(new StaggeredMock(4242), 4242);
    await stage(g, 2);
    expect(g.reckoningView()).toBeNull();

    const ids = g.state.quests.filter(q => q.state === 'open')
      .filter(q => (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy))
      .map(q => q.id).sort((a, b) => a.localeCompare(b));

    // guarantee a flesh tail to observe: someone the cycle must write up afterwards
    g.roster()[0]!.character!.who = undefined;

    const seen: { lines: string[]; writing: boolean }[] = [];
    const poll = setInterval(() => { const v = g.reckoningView(); if (v) seen.push({ lines: [...v.lines], writing: v.writing }) }, 5);
    const report = await g.endCycle();
    clearInterval(poll);

    expect(g.reckoningView()).toBeNull();                      // cleared when the cycle ends
    expect(seen.length).toBeGreaterThan(0);                    // it WAS observable mid-cycle

    // a slot per quest, opened in id order, before any report existed
    const first = seen[0]!.lines;
    expect(first.filter(l => l.startsWith('✎')).length).toBe(ids.length);
    expect(first.filter(l => l.startsWith('— ')).map(l => l.match(/\(([^)]+)\)$/)?.[1])).toEqual(ids);

    // it GREW: at some point one quest was written while another still held its placeholder
    const mixed = seen.find(v => v.lines.some(l => l.startsWith('⚄')) && v.lines.some(l => l.startsWith('✎')));
    expect(mixed, 'a landed report should be readable while another is still out').toBeTruthy();

    // …and the finished telling order is still id order, whatever order they landed in
    expect(report.filter(l => l.startsWith('— ')).map(l => l.match(/\(([^)]+)\)$/)?.[1])).toEqual(ids);
    expect(report.some(l => l.startsWith('✎'))).toBe(false);   // every placeholder was replaced
    // P21: `writing` goes false while the cycle is STILL RUNNING its flesh tail — that gap is
    // what lets PROCEED unlock ~14s early against the real provider
    expect(seen.some(v => v.writing)).toBe(true);
    expect(seen.at(-1)!.writing, 'the door must open before the flesh tail ends').toBe(false);
  });

  it("the plain mock fires onEach in SUBMISSION order — which is why the seeded suite stays stable", async () => {
    const m = new MockProvider(7);
    const inputs = ['q3', 'q1', 'q2'].map(id => ({
      questId: id, title: id, situation: '', job: 'do it', rarity: 'common', outcome: 'success',
      party: [{ id: 'c1', name: 'A', tags: '' }], deliveredSummary: 'nothing', deliveredCharacters: [],
    })) as unknown as ResolveQuestInput[];
    const fired: string[] = [];
    await m.resolve(inputs, o => fired.push(o.questId));
    expect(fired).toEqual(['q3', 'q1', 'q2']);
  });
});
