// TEMPO G1: the background pursuit queue. Everything here is about the FACADE — a click is
// answered at once (P1), the cap holds (P8), a lead is reserved from the click (I6/P2), a failure
// costs nothing (P3/P4), END waits (P9), and pursue() still works to completion (I11).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import type { QuestWriteInput, QuestWriteOut, GenesisInput, GenesisOut } from '../src/ai/provider.js';

/** the mock, slow on purpose (I13), counting how many calls are open at once */
class CountingMock extends MockProvider {
  live = 0;
  peak = 0;
  private async track<T>(f: () => Promise<T>): Promise<T> {
    this.live++;
    this.peak = Math.max(this.peak, this.live);
    try { return await f() } finally { this.live-- }
  }
  override writeQuest(i: QuestWriteInput): Promise<QuestWriteOut> { return this.track(() => super.writeQuest(i)) }
  override genesis(i: GenesisInput): Promise<GenesisOut> { return this.track(() => super.genesis(i)) }
}

/** blows up the first N card writes, then behaves */
class FlakyMock extends MockProvider {
  constructor(seed: number, latency: number, private failures: number) { super(seed, latency) }
  override async writeQuest(i: QuestWriteInput): Promise<QuestWriteOut> {
    if (this.failures-- > 0) throw new Error('the map table upset the ink');
    return super.writeQuest(i);
  }
}

function fresh(ai: MockProvider): Game {
  const g = new Game(ai, 7);
  g.build('map-room'); g.build('lead-room');
  return g;
}
/** the day-0 board's plain one-offs (the third starter lead starts a saga) */
const oneOffs = (g: Game) => g.visibleLeads().filter(l => l.chainInfo.kind === 'none');

describe('pursuit queue', () => {
  it('enqueuePursue returns immediately while the provider is slow (P1)', async () => {
    const ai = new CountingMock(7, 400);
    const g = fresh(ai);
    const lead = oneOffs(g)[0]!;
    const t0 = Date.now();
    const r = g.enqueuePursue(lead.id);
    const elapsed = Date.now() - t0;
    expect(r.ok).toBe(true);
    expect(r.jobId).toBeTruthy();
    expect(elapsed).toBeLessThan(50);
    // nothing delivered yet, but the work is visible and the lead is still on the board (P2)
    expect(g.state.quests.length).toBe(0);
    expect(g.jobs()[0]!.state).toBe('running');
    expect(g.visibleLeads().some(l => l.id === lead.id)).toBe(true);
    expect(auditGame(g)).toEqual([]);   // I12: reservation + live job agree
    await g.drain();
    expect(g.state.quests.length).toBe(1);
    expect(g.jobs()[0]!.state).toBe('done');
    expect(g.jobs()[0]!.questId).toBe(g.state.quests[0]!.id);
  });

  it('never more than maxInFlight generations at once (P8)', async () => {
    const ai = new CountingMock(7, 120);
    const g = fresh(ai);
    g.maxInFlight = 2;
    const ids = g.visibleLeads().map(l => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(3);
    for (const id of ids) expect(g.enqueuePursue(id).ok).toBe(true);   // queue any number
    expect(g.jobs().filter(j => j.state === 'running').length).toBe(2);
    expect(g.jobs().filter(j => j.state === 'queued').length).toBe(ids.length - 2);
    await g.drain();
    expect(ai.peak).toBe(2);
    expect(g.jobs().every(j => j.state === 'done')).toBe(true);
    expect(g.state.quests.length).toBe(ids.length);
  });

  it('maxInFlight 1 serialises', async () => {
    const ai = new CountingMock(7, 60);
    const g = fresh(ai);
    g.maxInFlight = 1;
    for (const l of g.visibleLeads()) g.enqueuePursue(l.id);
    await g.drain();
    expect(ai.peak).toBe(1);
  });

  it('the same lead cannot be pursued twice (I6)', async () => {
    const g = fresh(new MockProvider(7, 200));
    const lead = oneOffs(g)[0]!;
    expect(g.enqueuePursue(lead.id).ok).toBe(true);
    const second = g.enqueuePursue(lead.id);
    expect(second.ok).toBe(false);
    expect(second.msg).toMatch(/already/);
    expect(g.jobs().length).toBe(1);
    await g.drain();
    expect(g.state.quests.filter(q => q.leadId === lead.id).length).toBe(1);
    // consumed now, so a third attempt finds nothing
    expect(g.enqueuePursue(lead.id).ok).toBe(false);
  });

  it('a failure costs nothing and the retry is another pursuit (P3/P4)', async () => {
    const g = fresh(new FlakyMock(7, 0, 1));
    const lead = oneOffs(g)[0]!;
    expect(g.enqueuePursue(lead.id).ok).toBe(true);   // must not throw into the caller
    await g.drain();
    const failed = g.jobs()[0]!;
    expect(failed.state).toBe('failed');
    expect(failed.error).toBeTruthy();
    expect(g.state.quests.length).toBe(0);
    expect(g.visibleLeads().some(l => l.id === lead.id)).toBe(true);   // lead still on the board
    expect(g.reservedLeads()).toEqual([]);
    expect(auditGame(g)).toEqual([]);
    // retry
    expect(g.enqueuePursue(lead.id).ok).toBe(true);
    await g.drain();
    expect(g.state.quests.length).toBe(1);
    expect(g.jobs().at(-1)!.state).toBe('done');
  });

  it('drain resolves when nothing is left, and is a no-op when idle', async () => {
    const g = fresh(new MockProvider(7, 50));
    await g.drain();
    for (const l of g.visibleLeads()) g.enqueuePursue(l.id);
    await g.drain();
    expect(g.jobs().some(j => j.state === 'queued' || j.state === 'running')).toBe(false);
    await g.drain();
  });

  it('queued work can be dropped, running work cannot (P5)', async () => {
    const g = fresh(new MockProvider(7, 150));
    g.maxInFlight = 1;
    const ids = g.visibleLeads().map(l => l.id);
    const a = g.enqueuePursue(ids[0]!).jobId!;
    const b = g.enqueuePursue(ids[1]!).jobId!;
    expect(g.cancelJob(a).ok).toBe(false);           // already running
    expect(g.cancelJob(b).ok).toBe(true);            // still queued
    expect(g.reservedLeads()).toEqual([ids[0]!]);
    expect(auditGame(g)).toEqual([]);
    await g.drain();
    expect(g.state.quests.length).toBe(1);
    expect(g.visibleLeads().some(l => l.id === ids[1]!)).toBe(true);   // dropped ⇒ nothing spent
  });

  it('endCycle drains first (P9)', async () => {
    const g = fresh(new MockProvider(7, 120));
    for (const l of g.visibleLeads()) g.enqueuePursue(l.id);
    expect(g.state.quests.length).toBe(0);
    await g.endCycle();
    expect(g.state.cycle).toBe(1);
    expect(g.jobs().some(j => j.state === 'queued' || j.state === 'running')).toBe(false);
    expect(g.state.quests.length).toBeGreaterThanOrEqual(3);
    // every card landed on the board it was pursued from, not the next one
    for (const q of g.state.quests) expect(q.createdCycle).toBe(0);
    expect(auditGame(g)).toEqual([]);
  });

  it('pursue() still works to completion (I11)', async () => {
    const g = fresh(new MockProvider(7, 30));
    const lead = oneOffs(g)[0]!;
    const r = await g.pursue(lead.id);
    expect(r.ok).toBe(true);
    expect(r.questId).toBeTruthy();
    expect(g.state.quests.length).toBe(1);            // delivered by the time it returns
    expect(g.state.quests[0]!.id).toBe(r.questId);
    expect(g.reservedLeads()).toEqual([]);
    expect((await g.pursue('bogus')).ok).toBe(false);
    // and it never waits behind queued work: the cap is full, pursue still returns
    g.maxInFlight = 1;
    const rest = g.visibleLeads().map(l => l.id);
    expect(rest.length).toBeGreaterThanOrEqual(2);
    g.enqueuePursue(rest[0]!);                       // the one slot is taken
    const direct = await g.pursue(rest[1]!);
    expect(direct.ok).toBe(true);
    await g.drain();
  });

  // WHITE-BOX on purpose: endCycle drains first, so the public surface can never reach the expiry
  // passes with work in flight. These two pin the belt UNDER that brace — if the drain is ever
  // removed or a job outlives it, the reservation is what keeps the lead alive.
  it('a reserved lead does not expire under the work (I6)', async () => {
    const g = fresh(new MockProvider(7, 0));
    const lead = oneOffs(g)[0]!;
    lead.expiresAtCycle = g.state.cycle;                    // due to lapse this very cycle
    (g as unknown as { reserved: Set<string> }).reserved.add(lead.id);
    await (g as unknown as { doEndCycle(): Promise<string[]> }).doEndCycle();
    expect(g.state.leads.some(l => l.id === lead.id)).toBe(true);
    (g as unknown as { reserved: Set<string> }).reserved.delete(lead.id);
    await (g as unknown as { doEndCycle(): Promise<string[]> }).doEndCycle();
    expect(g.state.leads.some(l => l.id === lead.id)).toBe(false);   // and it lapses once released
  });

  it('the auditor sees in-flight work (I12)', () => {
    const g = fresh(new MockProvider(7, 0));
    const reserved = (g as unknown as { reserved: Set<string> }).reserved;
    reserved.add('lead-ghost');
    expect(auditGame(g)).toEqual(['lead lead-ghost is reserved by no live job']);
    (g as unknown as { jobRecs: unknown[] }).jobRecs.push({ job: { id: 'job-x', leadId: 'lead-ghost', title: 't', state: 'running' } });
    expect(auditGame(g)).toEqual(['job job-x works missing lead lead-ghost']);
  });

  it('jobs are never saved (N3)', async () => {
    const g = fresh(new MockProvider(7, 40));
    for (const l of g.visibleLeads()) g.enqueuePursue(l.id);
    await g.drain();
    const snap = g.save();
    expect(snap).not.toContain('"job-');
    const b = Game.load(new MockProvider(7), snap);
    expect(b.jobs()).toEqual([]);
    expect(b.reservedLeads()).toEqual([]);
    expect(b.save()).toBe(snap);
  });
});
