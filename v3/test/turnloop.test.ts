// The turn loop the UIs render (GUI pass 2026-09-30, package F2): the END guard's warnings (R5),
// the next-steps list (R4), the reckoning's per-quest verdicts + the cycle tally (kept in the save),
// arrivals by settle number, and where a saga stands in play.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { HELD, mintStackable, freshId, type Card } from '../src/engine/cards.js';
import { T } from '../src/engine/tags.js';
import { rollBase, rollGrowthLean } from '../src/engine/growth.js';
import type { ResolveQuestInput, ResolveQuestOut } from '../src/ai/provider.js';

/** resolutions land staggered, last quest first — the plain mock lands them all at once */
class Staggered extends MockProvider {
  override async resolve(inputs: ResolveQuestInput[], onEach?: (o: ResolveQuestOut) => void): Promise<ResolveQuestOut[]> {
    const outs = await super.resolve(inputs);
    for (const o of [...outs].reverse()) { await new Promise(r => setTimeout(r, 25)); onEach?.(o) }
    return outs;
  }
}

async function staged(seed = 9101, slow = false) {
  const g = new Game(slow ? new Staggered(seed) : new MockProvider(seed), seed);
  g.build('map-room');
  for (let c = 0; c < 3 && g.state.quests.filter(q => q.state === 'open').length < 2; c++) {
    for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
    if (g.state.quests.filter(q => q.state === 'open').length >= 2) break;
    await g.endCycle();
  }
  return g;
}
const open = (g: Game) => g.state.quests.filter(q => q.state === 'open');
function rich(): Game {
  const g = new Game(new MockProvider(5), 5);
  g.state.cards.push(mintStackable('gold', 100000));
  g.state.fort.ghTier = 6;
  for (let i = 0; i < 8; i++) g.excavate();
  return g;
}
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

describe('END warnings (R5)', () => {
  it('a quest going cold this END is warned, a faucet quest never is, and END then does exactly that', async () => {
    const g = await staged();
    const qs = open(g);
    expect(qs.length).toBeGreaterThanOrEqual(2);
    const [cold, faucet] = qs;
    cold!.fromLead = cold!.fromLead ? { ...cold!.fromLead, expiresAtCycle: g.state.cycle + 3 } : undefined;
    cold!.createdCycle = g.state.cycle + 1 - 10;   // QUEST_TTL 10 → lapses at this END
    faucet!.fromLead = { ...(faucet!.fromLead ?? cold!.fromLead!), expiresAtCycle: null };
    faucet!.createdCycle = g.state.cycle;          // a standing post's quest lasts one cycle
    for (const q of qs) for (const s of q.slots) if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s));
    const w = g.endWarnings();
    const mine = w.find(x => x.questId === cold!.id)!;
    expect(mine.why).toBe('lapses');
    expect(mine.lapsesNow).toBe(true);
    expect(mine.text).toMatch(/cold this END/);
    expect(w.some(x => x.questId === faucet!.id)).toBe(false);
    expect(g.nobodyMarches()).toBe(true);
    const warnedCold = new Set(w.filter(x => x.lapsesNow && x.questId).map(x => x.questId!));
    const stay = open(g).filter(q => !warnedCold.has(q.id) && !g.questIsFaucet(q)).map(q => q.id);
    await g.endCycle();
    const after = new Set(open(g).map(q => q.id));
    for (const id of warnedCold) expect(after.has(id), `${id} was warned cold`).toBe(false);
    for (const id of stay) expect(after.has(id), `${id} was not warned`).toBe(true);
  });

  it('a part-filled quest is "short"; a finale with no approach is "needs-approach"; a manned quest marches', async () => {
    const g = await staged();
    const multi = open(g).find(q => !q.approaches && q.slots.length >= 2);
    if (multi) {
      for (const s of multi.slots) if (s.filledBy) g.unassign(multi.id, multi.slots.indexOf(s));
      const m = g.roster().find(x => x.location.kind === 'held' && g.canTake(multi.id, 0, x.id) === null);
      if (m) {
        expect(g.assign(multi.id, 0, m.id).ok).toBe(true);
        const w = g.endWarnings().find(x => x.questId === multi.id)!;
        expect(w.why).toBe('short');
        expect(w.filled).toBe(1);
        expect(w.of).toBe(multi.slots.length);
      }
    }
    const q = open(g).find(x => x !== multi)!;
    q.approaches = [{ id: 'g0', label: 'the hard way', rewardKind: 'gold' }] as never;
    q.chosenApproach = undefined;
    expect(g.endWarnings().find(x => x.questId === q.id)?.why).toBe('needs-approach');
    expect(g.nextSteps()[0]!.kind).toBe('approach');
  });

  it('marching counts committed parties', async () => {
    const g = await staged();
    const q = open(g).find(x => !x.approaches)!;
    for (const x of open(g)) for (const s of x.slots) if (s.filledBy) g.unassign(x.id, x.slots.indexOf(s));
    expect(g.marching()).toBe(0);
    g.autoAssign(q.id);
    if (q.slots.every(s => s.filledBy)) {
      expect(g.marching()).toBe(1);
      expect(g.nobodyMarches()).toBe(false);
    }
  });
});

describe('reckoning meta + tally', () => {
  it('each verdict matches its dice line; the tally matches the gold and levels', async () => {
    const g = await staged();
    g.autoAssignAll();
    const marching = open(g).filter(q => (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy)).map(q => q.id).sort();
    const gold0 = g.gold();
    const levels0 = new Map(g.roster().map(m => [m.id, m.character!.level]));
    const lines = await g.endCycle();
    const r = g.reckoningAt()!;
    expect(r.lines).toEqual(lines);
    expect(r.meta.map(m => m.questId).sort()).toEqual(marching);
    for (const m of r.meta) {
      const block = r.lines.slice(m.from, m.to);
      expect(block[0]).toBe(`— ${m.title} (${m.questId})`);
      expect(block.some(l => l.startsWith(`⚄ [${m.outcome.toUpperCase()}]`))).toBe(true);
      expect(m.party.length).toBe(m.partyIds.length);
      expect(m.partialAt).toBeCloseTo(0.6 * m.bar, 6);
    }
    const s = r.summary!;
    expect(s.cycle).toBe(g.state.cycle);
    expect(s.goldBefore).toBe(gold0);
    expect(s.goldAfter - s.goldBefore).toBe(g.gold() - gold0);
    expect(s.outcomes.success + s.outcomes.partial + s.outcomes.failure).toBe(r.meta.length);
    const ups = g.roster().filter(m => m.character!.level > (levels0.get(m.id) ?? 99)).map(m => m.id).sort();
    expect(s.levelUps.map(l => l.id).sort()).toEqual(ups);
    expect(s.newLeads).toBe(s.newLeadIds.length);
    expect(Game.tallyLine(s).length).toBeGreaterThan(0);
  });

  it('the tally counts a lapse as lost — but not a faucet quest going cold', async () => {
    const g = await staged();
    const [cold, faucet] = open(g);
    for (const q of open(g)) for (const s of q.slots) if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s));
    cold!.fromLead = cold!.fromLead ? { ...cold!.fromLead, expiresAtCycle: 99 } : undefined;
    cold!.createdCycle = g.state.cycle + 1 - 10;
    faucet!.fromLead = { ...(faucet!.fromLead ?? cold!.fromLead!), expiresAtCycle: null };
    faucet!.createdCycle = g.state.cycle;
    await g.endCycle();
    const s = g.reckoningAt()!.summary!;
    expect(s.lapsed).toContain(cold!.title);
    expect(s.lapsed).not.toContain(faucet!.title);
    expect(Game.tallyLine(s)).toMatch(/went cold/);
  });

  it('meta and summary round-trip through save/load; an old archive loads with meta [] / summary null', async () => {
    const g = await staged();
    g.autoAssignAll();
    await g.endCycle();
    const r = g.reckoningAt()!;
    const h = Game.load(new MockProvider(1), g.save());
    expect(h.reckoningAt(r.cycle)).toEqual(r);
    const st = JSON.parse(g.save());
    for (const x of st.reckonings) { delete x.meta; delete x.summary }
    const old = Game.load(new MockProvider(1), JSON.stringify(st));
    expect(old.reckoningAt()!.meta).toEqual([]);
    expect(old.reckoningAt()!.summary).toBeNull();
    expect(old.reckoningAt()!.lines).toEqual(r.lines);
  });

  it('the live view lists a verdict only once its report has landed', async () => {
    const g = await staged(9101, true);
    g.autoAssignAll();
    const want = g.marching();
    expect(want).toBeGreaterThanOrEqual(2);
    const seen: number[] = [];
    const p = g.endCycle();
    for (let i = 0; i < 40; i++) {
      const v = g.reckoningView();
      if (v) {
        for (const m of v.meta) expect(v.lines[m.from]).toBe(`— ${m.title} (${m.questId})`);
        for (const m of v.meta) expect(v.lines.slice(m.from, m.to).some(l => l.startsWith('⚄'))).toBe(true);
        seen.push(v.meta.length);
      }
      await new Promise(r => setTimeout(r, 1));
    }
    await p;
    expect(seen.every((n, i) => i === 0 || n >= seen[i - 1]!)).toBe(true);
    expect(seen[0]).toBe(0);                               // nothing landed yet: no verdict shown
    expect(seen.some(n => n > 0 && n < want)).toBe(true);  // one landed, the other still out
    expect(g.reckoningAt()!.meta.length).toBe(want);       // and the archive keeps them all
  });
});

describe('next steps (R4)', () => {
  it('a fresh game starts on "Build a Map room", pointed at the build list', () => {
    const g = new Game(new MockProvider(77), 77);
    const s = g.nextSteps()[0]!;
    expect(s.kind).toBe('build');
    expect(s.text).toBe('Build a Map room');
    expect(s.target).toEqual({ screen: 'build', type: 'map-room' });
    expect(s.act?.cli).toBe('build map-room');
    expect(s.act?.block).toBeNull();
  });

  it('with every quest manned and nothing else to do, the list is just END', async () => {
    const g = await staged();
    g.state.leads = []; g.state.tavern = []; g.state.holding = [];
    // a prestige room already standing (without one the scroll's GROW step names one to build)
    g.state.fort.rooms.push({ id: 'room-g', type: 'garden', cell: { floor: 9, col: 9 }, slots: [], wants: [], style: null });
    g.autoAssignAll();
    g.state.quests = g.state.quests.filter(q => q.state !== 'open' || (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy));
    const steps = g.nextSteps();
    expect(steps.map(s => s.kind)).toEqual(['end']);
    expect(steps[0]!.text).toMatch(g.marching() ? /march/ : /end the cycle/);
  });

  it('unmanned quests with soldiers idle point at auto; pursuable leads at pursue all', async () => {
    const g = await staged();
    for (const q of open(g)) for (const s of q.slots) if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s));
    const man = g.nextSteps().find(s => s.kind === 'man')!;
    expect(man).toBeTruthy();
    expect(['auto', 'autoall']).toContain(man.act!.type);
    const n = g.leadBoard().filter(r => !r.blocked).length;
    const pursue = g.nextSteps().find(s => s.kind === 'pursue');
    expect(!!pursue).toBe(n > 0);
  });

  it('the one-click acts run: raise the Great Hall, set a tamed captive in a room', () => {
    const g = rich();
    for (const t of ['dungeon', 'dungeon-cell', 'kitchen']) expect(g.build(t).ok).toBe(true);
    g.state.fort.ghTier = 2;
    const kitchen = g.state.fort.rooms.find(r => r.type === 'kitchen')!;
    // 0 places: the step is to add one (R8)
    const tamed = mkCaptive(g, ['food'], true);
    const add = g.nextSteps().find(s => s.kind === 'addplace')!;
    expect(add.target.roomId).toBe(kitchen.id);
    expect(add.act?.cli).toBe(`upgrade ${kitchen.id}`);
    expect(g.upgrade(kitchen.id).ok).toBe(true);
    const set = g.nextSteps().find(s => s.kind === 'setin')!;
    expect(set.text).toBe(`Tamed ${tamed.name} — set them in a room`);
    expect(set.act!.args).toEqual([kitchen.id, tamed.id]);
    expect(g.setInRoom(set.act!.args[0] as string, set.act!.args[1] as string).ok).toBe(true);
    // prestige now over the T2 line? then the Great Hall step is there and it runs
    const gh = g.nextSteps().find(s => s.kind === 'gh');
    expect(!!gh).toBe(g.ghInfo().ready);
    if (gh) expect(g.ghUpgrade().ok).toBe(true);
  });
});

describe('integration fixes (GUI pass 2026-09-30)', () => {
  it('a step whose fix is a build with no free cell offers the dig — never a disabled Build', () => {
    const g = rich();
    expect(g.build('dungeon').ok).toBe(true);
    // use up every free cell (any buildable room will do), so a Dungeon cell cannot be built
    for (let i = 0; i < 40 && g.freeCells().length; i++) {
      const b = g.buildableTypes().find(x => !x.blocker && x.type !== 'dungeon-cell' && x.type !== 'bedroom');
      if (!b || !g.build(b.type).ok) break;
    }
    expect(g.freeCells().length).toBe(0);
    const cap = mkCaptive(g);
    cap.location = HELD('staged');
    g.state.holding.push({ cardId: cap.id, expiresAtCycle: g.state.cycle + 1 });
    for (let i = 0; i < g.captiveCapacity(); i++) mkCaptive(g);
    expect(g.acceptBlock(cap.id)?.fix).toMatchObject({ action: 'build', type: 'dungeon-cell' });
    const step = g.nextSteps().find(s => s.kind === 'holding')!;
    expect(step.act).toMatchObject({ type: 'excavate', cli: 'excavate', block: null });
    for (const s of g.nextSteps()) if (s.act?.type === 'build')
      expect(g.buildableTypes().find(b => b.type === s.act!.args[0])?.blocker).not.toBe('cell');
    expect(g.excavate().ok).toBe(true);
    expect(g.nextSteps().find(s => s.kind === 'holding')!.act).toMatchObject({ type: 'build', args: ['dungeon-cell'], block: null });
  });

  it('a fit refused only by the approach gate is "gated"; a real refusal is not', async () => {
    const g = await staged();
    const q = open(g)[0]!;
    q.approaches = [{ id: 'g0', label: 'A', rewardKind: 'gold' }, { id: 'g1', label: 'B', rewardKind: 'gold' }] as never;
    q.slots = [0, 1].map(i => ({ ...q.slots[0]!, groupId: `g${i}`, filledBy: null, requirement: { kind: 'open' as const } }));
    for (const m of g.roster()) if (m.location.kind === 'quest' && m.location.questId === q.id) m.location = HELD('roster');
    const fits = g.slotFits(q.id, 0);
    expect(fits.length).toBeGreaterThan(0);
    for (const f of fits) expect(f).toMatchObject({ blocked: 'pick an approach first', gated: true });
    q.slots[1]!.requirement = { kind: 'must-have', concept: 'no-such-trait' } as never;
    for (const f of g.slotFits(q.id, 1)) expect(f.gated).toBe(false);
    g.chooseApproach(q.id, 'g0');
    for (const f of g.slotFits(q.id, 0)) expect(f.gated).toBe(false);
  });
});

describe('arrivals + sagas in play', () => {
  it('every settled job is announced once, by settle number, with its quest', async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room');
    expect(g.arrivalSeq()).toBe(0);
    const r = g.pursueAll();
    expect(r.jobIds.length).toBeGreaterThan(0);
    await g.drain();
    const got = g.arrivals(0);
    expect(got.length).toBe(r.jobIds.length);
    expect(got.map(j => j.seq)).toEqual(got.map((_, i) => i + 1));
    for (const j of got.filter(x => x.state === 'done')) {
      expect(j.questId).toBeTruthy();
      expect(j.questTitle).toBe(g.state.quests.find(q => q.id === j.questId)?.title);
    }
    expect(g.arrivals(g.arrivalSeq())).toEqual([]);
  });

  it("a saga's view names its open quest, or the lead that continues it", async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room');
    g.pursueAll();
    await g.drain();
    for (const c of g.chainViews()) {
      const q = g.state.quests.find(x => x.state === 'open' && x.chainId === c.id);
      expect(c.questId).toBe(q?.id ?? null);
      if (q) expect(['on the map', 'choose the ending']).toContain(c.next);
      expect(c.live).toBe(c.state === 'active' || c.state === 'finale-pending');
    }
  });
});
