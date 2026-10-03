// TEMPO G3/P11/P15: the reckoning is READ while it is written. Each marching quest holds a slot
// on the screen in quest-id order, and that slot is filled the moment ITS OWN ai call lands —
// so a finished report never waits on a slow one, and the telling order never depends on the
// network. These are the guarantees the GUI's reckoning page is built on; nothing else pins them.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { ResolveQuestInput, ResolveQuestOut, SagaCall } from '../src/ai/provider.js';
import { logLines } from '../src/ai/storyteller.js';

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

/** drive a game until `want` quests march in the same cycle.
 *  Pushes its OWN one-slot leads rather than taking whatever the board happens to offer: the
 *  board's mix is seeded, so any engine change that shifts the rng stream used to make this test
 *  fail with "could not stage 2" — a seed-luck failure, not a product one (2026-08-27). */
async function stage(g: Game, want: number): Promise<void> {
  g.build('map-room'); g.build('lead-room');
  let n = 0;
  for (let i = 0; i < 12; i++) {
    while (g.state.quests.filter(q => q.state === 'open').length < want) {
      g.state.leads.push({ id: `lead-stage${++n}`, rarity: 'common', level: 1, region: 'forests',
        archetype: 'contract', chainInfo: { kind: 'none' }, expiresAtCycle: 99, source: 'starter' });
      const lead = g.visibleLeads().at(-1)!;
      if (!(await g.pursue(lead.id)).ok) break;
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

  it('a saga report and a one-off land in the same reckoning, each in its own slot, whatever order they arrive in', async () => {
    // the saga's report call is the slow one, so the one-off lands first
    class SlowSaga extends MockProvider {
      override async sagaCall(c: SagaCall): Promise<unknown> {
        if (c.template === 'report') await new Promise(r => setTimeout(r, 60));
        return super.sagaCall(c);
      }
    }
    const g = new Game(new SlowSaga(4343), 4343);
    g.build('map-room'); g.build('lead-room');
    // the lab hook stands up a fort that can field a saga and a one-off at once (four soldiers)
    const lead = g.labSaga({ id: 'R01', seed: 1, path: 'clean', spark: 'a border stone moved by night', N: 3, kind: 'captive', personal: false, twist: false,
      focal: { name: 'Rautio', sex: 'male', race: 'human', seed: 1104, value: 150 }, level: 2, rarity: 'uncommon' }).leadId!;
    expect((await g.pursue(lead)).ok).toBe(true);
    const saga = g.state.quests.find(q => q.chainId)!;
    g.state.leads.push({ id: 'lead-one', rarity: 'common', level: 1, region: 'forests', archetype: 'contract', chainInfo: { kind: 'none' }, expiresAtCycle: 99, source: 'starter' });
    expect((await g.pursue('lead-one')).ok).toBe(true);
    const one = g.state.quests.find(q => !q.chainId)!;
    for (const q of [saga, one]) for (let s = 0; s < q.slots.length; s++) {
      const free = g.roster().find(m => m.location.kind === 'held');
      if (free) g.assign(q.id, s, free.id);
    }
    expect(marching(g)).toBe(2);
    const seen: string[][] = [];
    const poll = setInterval(() => { const v = g.reckoningView(); if (v) seen.push([...v.lines]) }, 5);
    const report = await g.endCycle();
    clearInterval(poll);
    // the one-off was readable while the saga's slot still held its placeholder
    expect(seen.some(v => v.some(l => l.startsWith('✎')) && v.filter(l => l.startsWith('⚄')).length === 1)).toBe(true);
    // telling order: id order; the saga's block starts as its placeholder did (title, the card's prose) and never echoes the log
    const ids = [saga.id, one.id].sort((a, b) => a.localeCompare(b));
    expect(report.filter(l => l.startsWith('— ')).map(l => l.match(/\(([^)]+)\)$/)?.[1])).toEqual(ids);
    const at = report.indexOf(`— ${saga.title} (${saga.id})`);
    expect(report[at + 1]).toBe(`「${saga.situation}」`);
    for (const row of logLines(saga.saga!.rows)) if (row.trim().length > 12) expect(report).not.toContain(row);
    expect(report.some(l => l.startsWith(`📖 ${g.state.chains[0]!.saga!.plan!.title}: `))).toBe(true);
    expect(report.some(l => l.startsWith('✎'))).toBe(false);
  });
});
