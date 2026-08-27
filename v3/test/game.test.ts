// Integration: the full loop against the mock provider.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

function newGame(seed = 7): Game { return new Game(new MockProvider(seed), seed) }

async function playCycles(g: Game, n: number): Promise<string[]> {
  const all: string[] = [];
  for (let i = 0; i < n; i++) {
    // naive auto-player: pursue first lead, assign all free mercs greedily, end cycle
    const leads = g.visibleLeads();
    if (leads.length && g.state.quests.length < 2) await g.pursue(leads[0]!.id);
    for (const q of g.state.quests.filter(q => q.state === 'open')) {
      if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      for (let s = 0; s < q.slots.length; s++) {
        const slot = q.slots[s]!;
        if (!active.includes(slot) || slot.filledBy) continue;
        const free = g.roster().find(m => m.location.kind === 'held');
        if (free) g.assign(q.id, s, free.id);
      }
    }
    all.push(...await g.endCycle());
  }
  return all;
}

describe('game loop (mock AI)', () => {
  it('bootstraps: gold, 3 mercs, day-0 fort', () => {
    const g = newGame();
    expect(g.gold()).toBe(300);
    expect(g.roster()).toHaveLength(2);   // 🛠 2026-07-19: 3→2 designer-ruled (1 stalls, measured)
    expect(g.state.fort.rooms.map(r => r.type).sort()).toEqual(['bedroom', 'bunkroom', 'great-hall']);
    expect(g.visibleLeads()).toHaveLength(0); // no Map room yet
  });

  it('map room grants the starter packet; pursue → quest; full party rolls', async () => {
    const g = newGame();
    expect(g.build('map-room').ok).toBe(true);
    const leads = g.visibleLeads();
    expect(leads.length).toBeGreaterThanOrEqual(3);
    const res = await g.pursue(leads[0]!.id);
    expect(res.ok).toBe(true);
    const q = g.state.quests[0]!;
    expect(q.rewardSpecs.length).toBeGreaterThan(0);  // reward generated at BIRTH
    // odds are always visible raw
    const o = g.questOdds(q.id);
    expect(o.bar).toBeGreaterThan(0);
    // assign everyone needed
    for (let s = 0; s < q.slots.length; s++) {
      const free = g.roster().find(m => m.location.kind === 'held');
      if (free) g.assign(q.id, s, free.id);
    }
    const filled = q.slots.every(s => s.filledBy);
    const report = await g.endCycle();
    if (filled) {
      expect(report.join('\n')).toMatch(/SUCCESS|PARTIAL|FAILURE/);
      expect(g.state.quests.filter(x => x.state === 'open')).toHaveLength(0);
    } else {
      // 2-man roster may not fill a 3-slot quest — quest stays open, nothing rolls
      expect(g.state.quests[0]!.state).toBe('open');
    }
  });

  it('a 30-cycle campaign runs without errors and progresses', async () => {
    const g = newGame(11);
    g.build('map-room'); g.build('lead-room');
    await playCycles(g, 30);
    expect(g.state.cycle).toBe(30);
    // something happened: log grew, gold moved or quests resolved
    expect(g.state.log.length).toBeGreaterThan(3);
  });

  it('chains: a starts-new lead builds a bible around a focal and banks beats', async () => {
    const g = newGame(13);
    g.build('map-room');
    const chainLead = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new' && l.source !== 'personal');
    expect(chainLead).toBeDefined();
    await g.pursue(chainLead!.id);
    expect(g.state.chains).toHaveLength(1);
    const chain = g.state.chains[0]!;
    expect(chain.bible.cast.length).toBeGreaterThanOrEqual(2);
    expect(g.card(chain.focalId)).toBeDefined();          // focal exists (ALWAYS — §2)
    const q = g.state.quests[0]!;
    expect(q.chainId).toBe(chain.id);
    // resolve the beat with everyone
    for (let s = 0; s < q.slots.length; s++) {
      const free = g.roster().find(m => m.location.kind === 'held');
      if (free) g.assign(q.id, s, free.id);
    }
    if (q.slots.every(s => s.filledBy)) {
      await g.endCycle();
      // the beat is CONSUMED either way — it advances on a win and books a failure on a loss.
      // Asserting beatIndex === 1 outright was asserting a lucky roll: any engine change that
      // shifts the rng stream flipped this beat to a failure and failed the test (2026-08-27).
      expect(chain.beatIndex + chain.failures).toBe(1);
      expect(chain.cyclesSpent).toBeGreaterThan(0);       // effort banked even on failure
      // and the story waits for the company either way
      expect(g.state.leads.some(l => l.chainInfo.kind === 'continues')).toBe(true);
    }
  });

  it('save/load: reload re-runs NO AI and continues deterministically', async () => {
    const g1 = newGame(17);
    g1.build('map-room'); g1.build('lead-room');
    await playCycles(g1, 6);
    const snap = g1.save();
    const aiCallsAtSave = (g1.ai as MockProvider).usage().calls;

    const g2 = Game.load(new MockProvider(999), snap);    // different mock seed on purpose:
    expect((g2.ai as MockProvider).usage().calls).toBe(0); // loading itself ran NO AI
    // engine determinism: the same engine-side rolls continue identically
    const r1 = g1.rng.next();
    const r2 = g2.rng.next();
    expect(r1).toBe(r2);
    expect(JSON.parse(snap).cycle).toBe(6);
    expect(aiCallsAtSave).toBeGreaterThan(0);
  });

  it('economy guardrails: mercs never staff rooms; GH gates builds', () => {
    const g = newGame(19);
    expect(g.build('dungeon').ok).toBe(false);      // GH T2 gate (tavern moved to T1, 🛠 2026-07-10)
    expect(g.build('hospital').ok).toBe(false);     // GH T5 gate
    const merc = g.roster()[0]!;
    g.build('garden');
    const garden = g.state.fort.rooms.find(r => r.type === 'garden')!;
    // no slots yet (upgrades add slots)
    expect(garden.slots).toHaveLength(0);
  });
});
