// The engine half of the 2026-09-30 GUI-audit fixes — one test per engine fix. Every surface (web and
// CLI) prints these Game answers, so each is pinned here once rather than per UI.
import { describe, it, expect } from 'vitest';
import { Game, STALL_LIMIT } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import { HELD, mintStackable, freshId, type Card } from '../src/engine/cards.js';
import { T } from '../src/engine/tags.js';
import { rollBase, rollGrowthLean } from '../src/engine/growth.js';
import { maxSlotsAtTier, nextSlotTier, GH_THRESHOLDS } from '../src/engine/fort.js';
import { roomDesc } from '../src/game/roomInfo.js';
import type { FleshInput, FleshOut } from '../src/ai/provider.js';

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
function mkRelic(g: Game, tags: string[], value = 80): Card {
  const c: Card = { id: freshId('r'), name: `Relic ${tags.join('-')}`, value, tags: [{ concept: 'relic' }, ...tags.map(t => T(t, 2))], location: HELD('inventory'), chainIds: [] };
  g.state.cards.push(c);
  return c;
}
function rich(tier = 6): Game {
  const g = new Game(new MockProvider(5), 5);
  g.state.cards.push(mintStackable('gold', 100000));
  g.state.fort.ghTier = tier;
  for (let i = 0; i < 8; i++) g.excavate();
  return g;
}
const room = (g: Game, type: string) => g.state.fort.rooms.find(r => r.type === type)!;
const open = (g: Game) => g.state.quests.filter(q => q.state === 'open');
const clean = (g: Game) => { const e = auditGame(g); expect(e, e.join(' | ')).toEqual([]) };
async function staged(seed = 9101) {
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room');
  for (let c = 0; c < 3 && open(g).length < 2; c++) {
    for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
    if (open(g).length >= 2) break;
    await g.endCycle();
  }
  return g;
}
/** a quest the tests can shape: its slots all open, every soldier back in the hand */
function bare(g: Game, q = open(g).find(x => !x.approaches)!) {
  for (const s of q.slots) if (s.filledBy) g.unassign(q.id, q.slots.indexOf(s));
  return q;
}

describe('Add a place at the tier depth names the tier that actually adds one (gh-fix-false-promise)', () => {
  it('nextSlotTier is the first tier whose depth is deeper', () => {
    for (let t = 1; GH_THRESHOLDS[t + 1] !== undefined; t++) {
      const nt = nextSlotTier(t);
      if (nt === null) continue;
      expect(maxSlotsAtTier(nt)).toBeGreaterThan(maxSlotsAtTier(t));
      for (let x = t + 1; x < nt; x++) expect(maxSlotsAtTier(x)).toBe(maxSlotsAtTier(t));
    }
    expect(nextSlotTier(2)).toBe(4);
    expect(nextSlotTier(3)).toBe(4);
  });
  it('at GH T2 with a full rack the fix is NOT "raise to T3" (T3 adds none); at T3 it is the raise', () => {
    const g = rich(2);
    g.build('dungeon'); g.build('torture-chamber');
    const rack = room(g, 'torture-chamber');
    g.upgrade(rack.id); g.upgrade(rack.id);
    expect(rack.slots.length).toBe(maxSlotsAtTier(2));
    const f = g.addPlaceFix(rack)!;
    expect(f).toMatchObject({ action: 'gh', tier: 4 });
    expect((f as { block: string | null }).block).toMatch(/T3 adds no racks/);
    expect(g.upgrade(rack.id).msg).toMatch(/more at GH T4 \(T3 adds none\)/);
    expect(g.upgradeBlock(rack)).toMatch(/more at GH T4/);
    g.state.fort.ghTier = 3;
    expect(g.addPlaceFix(rack)).toMatchObject({ action: 'gh', tier: 4 });
    expect((g.addPlaceFix(rack) as { label: string }).label).toMatch(/Raise the Great Hall to T4/);
  });
});

describe('the countdown folds in the stall rule (lapse-ignores-stall-rule)', () => {
  it('a part-filled quest stalled twice lapses at THIS END, and every surface says so', async () => {
    const g = await staged();
    const q = bare(g, open(g).find(x => !x.approaches && x.slots.length >= 2) ?? open(g).find(x => !x.approaches)!);
    if (q.slots.length < 2) return;   // the seed dealt no multi-place quest
    q.createdCycle = g.state.cycle;   // its TTL is far away
    const m = g.roster().find(x => x.location.kind === 'held' && !g.canTake(q.id, 0, x.id))!;
    expect(g.assign(q.id, 0, m.id).ok).toBe(true);
    expect(g.questLapsesAt(q)).toBe(g.state.cycle + STALL_LIMIT);
    q.stalls = STALL_LIMIT - 1;
    expect(g.questLapsesAt(q)).toBe(g.state.cycle + 1);
    expect(g.questStallAt(q)).toBe(g.state.cycle + 1);
    expect(g.questUrgent(q)).toBe(true);
    const w = g.endWarnings().find(x => x.questId === q.id)!;
    expect(w).toMatchObject({ why: 'lapses', lapsesNow: true });
    await g.endCycle();
    expect(open(g).some(x => x.id === q.id)).toBe(false);
  });
});

describe("your own bedroom has no effect — no planner ranks it (own-bedroom-no-effect-ranked)", () => {
  it('owner=you: no kind, no places offered, never a placement row, never a next step', () => {
    const g = rich();
    const mine = g.state.fort.rooms.find(r => r.ownerId === 'you')!;
    expect(g.roomKind(mine)).toBeNull();
    expect(g.roomEffect(mine)).toBe('no effect yet');
    expect(g.addPlaceFix(mine)).toBeNull();
    expect(g.upgrade(mine.id).ok).toBe(false);
    const relic = mkRelic(g, ['furniture', 'decoration']);
    expect(g.roomPlacementsFor(relic.id).some(r => r.roomId === mine.id)).toBe(false);
    expect(g.nextSteps().some(s => s.target.roomId === mine.id)).toBe(false);
  });
});

describe('the place to make is ONE engine choice (hub-fix-rederived-client)', () => {
  it('a tamed captive nothing takes: a prestige room before a function room, named', () => {
    const g = rich();
    for (const t of ['dungeon', 'dungeon-cell', 'infirmary', 'garden']) expect(g.build(t).ok).toBe(true);
    const tamed = mkCaptive(g, ['nature'], true);
    const pf = g.placeFixFor(tamed.id)!;
    expect(pf.roomName).toBe('Garden');
    expect(pf.fix).toMatchObject({ action: 'upgrade', roomId: room(g, 'garden').id });
    const step = g.nextSteps().find(s => s.kind === 'addplace')!;
    expect(step.text).toBe('Add a place to the Garden');
  });
});

describe('moving a placed soldier says what it breaks (send-breaks-old-party-silently)', () => {
  it('leaving a ready quest names it, its new count, and warns', async () => {
    const g = await staged();
    const [a, b] = open(g).filter(q => !q.approaches);
    if (!a || !b) return;
    bare(g, a); bare(g, b);
    for (const q of open(g)) bare(g, q);
    g.autoAssign(a.id);
    if (!g.isReady(a.id)) return;
    const mover = g.card(a.slots.find(s => s.filledBy)!.filledBy!)!;
    const idx = b.slots.findIndex((s, i) => !s.filledBy && !g.canTake(b.id, i, mover.id));
    if (idx < 0) return;
    const r = g.sendTo(b.id, mover.id, idx);
    expect(r.ok).toBe(true);
    expect(r.msg).toContain(`leaves ${a.title}`);
    expect(r.warn).toBe(true);
    expect(g.placementsFor(mover.id).find(p => p.questId === a.id)?.from?.questId).toBe(b.id);
  });
});

describe('cashing out a card on show says the prestige it takes (cashout-on-show-hides-prestige)', () => {
  it('cashOutLoss before; ransom/sell carry it after, and warn', () => {
    const g = rich();
    for (const t of ['dungeon', 'dungeon-cell', 'kitchen']) g.build(t);
    const k = room(g, 'kitchen');
    g.upgrade(k.id); g.upgrade(k.id);
    const tamed = mkCaptive(g, ['food'], true), relic = mkRelic(g, ['food']);
    expect(g.setInRoom(k.id, tamed.id).ok).toBe(true);
    expect(g.setInRoom(k.id, relic.id).ok).toBe(true);
    const loss = g.cashOutLoss(tamed.id)!;
    expect(loss).toMatch(/^prestige [\d.]+ → [\d.]+$/);
    const r = g.ransom(tamed.id);
    expect(r.msg).toContain(loss);
    expect(r.warn).toBe(true);
    expect(g.cashOutLoss(relic.id)).toMatch(/prestige/);
    const s = g.sell(relic.id);
    expect(s.msg).toMatch(/prestige/);
    expect(g.cashOutLoss(mkRelic(g, ['food']).id)).toBeNull();   // in the stores: nothing to lose
    clean(g);
  });
});

describe('Auto never parks a half-manned party (auto-short-quest)', () => {
  it('too few idle hands: nothing placed, a red refusal, and no dead Auto-fill step', async () => {
    const g = await staged();
    const q = bare(g, open(g).find(x => !x.approaches && x.slots.length >= 2) ?? open(g)[0]!);
    for (const x of open(g)) bare(g, x);
    // leave exactly one idle soldier by parking the rest on other quests' places
    const idle = g.roster().filter(m => m.location.kind === 'held');
    if (q.slots.length < 2 || idle.length < 1) return;
    for (const m of idle.slice(1)) m.location = HELD('lore');   // off the board for this test
    const r = g.autoAssign(q.id);
    expect(r.ok).toBe(false);
    expect(r.placed).toBe(0);
    expect(q.slots.every(s => !s.filledBy)).toBe(true);
    expect(g.canFullyMan(q.id)).toBe(false);
    for (const s of g.nextSteps()) if (s.act?.type === 'auto') expect(s.act.args[0]).not.toBe(q.id);
    if (!open(g).some(x => g.canFullyMan(x.id))) expect(g.nextSteps().some(s => s.act?.type === 'autoall')).toBe(false);
  });
});

describe('END warns for everything that goes at this END (end-guard-misses-go-cold, faucet-short-warn-wrong)', () => {
  it('a captive handed off from holding, and a hireable guest leaving the tavern', () => {
    const g = rich();
    g.build('tavern');
    const cap = mkCaptive(g); cap.location = HELD('staged');
    g.state.holding.push({ cardId: cap.id, expiresAtCycle: g.state.cycle + 1 });
    const guest = mkCaptive(g); guest.character!.role = 'npc'; guest.location = HELD('staged');
    g.state.tavern.push({ cardId: guest.id, expiresAtCycle: g.state.cycle + 1 });
    const w = g.endWarnings();
    expect(w.find(x => x.key === cap.id)).toMatchObject({ why: 'handoff', lapsesNow: true, target: { screen: 'holding', cardId: cap.id } });
    expect(w.find(x => x.key === guest.id)).toMatchObject({ why: 'leaves', target: { screen: 'tavern' } });
    expect(g.holdingDeadline(cap.id)).toBe('handed off at this END');
    g.state.holding[0]!.expiresAtCycle = g.state.cycle + 3;
    expect(g.holdingDeadline(cap.id)).toBe('handed off in 3 cycles');
    expect(g.endWarnings().some(x => x.key === cap.id)).toBe(false);
  });
  it("a saga's continuation lead going cold is warned", async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room'); g.pursueAll(); await g.drain();
    const chain = g.state.chains.find(c => c.state === 'active');
    if (!chain) return;
    g.state.quests = g.state.quests.filter(q => q.chainId !== chain.id);
    g.state.leads.push({ id: freshId('lead-'), rarity: 'common', level: 1, region: 'forests', archetype: 'investigate',
      chainInfo: { kind: 'continues', chainId: chain.id, hook: '' }, expiresAtCycle: g.state.cycle + 1, source: 'continuation', title: 'x' });
    const w = g.endWarnings().find(x => x.why === 'lead-lapses')!;
    expect(w.title).toBe(chain.bible.title);
    expect(w.text).toMatch(/slips this END/);
  });
  it('a part-filled standing-post quest goes cold (not "won\'t march"); an empty one is silent', async () => {
    const g = await staged();
    const q = bare(g, open(g).find(x => !x.approaches && x.slots.length >= 2) ?? open(g)[0]!);
    for (const x of open(g)) bare(g, x);
    q.fromLead = { ...(q.fromLead ?? g.state.leads[0]!), expiresAtCycle: null } as never;
    q.createdCycle = g.state.cycle;
    expect(g.endWarnings().some(x => x.questId === q.id)).toBe(false);
    if (q.slots.length < 2) return;
    const m = g.roster().find(x => x.location.kind === 'held' && !g.canTake(q.id, 0, x.id))!;
    g.assign(q.id, 0, m.id);
    const w = g.endWarnings().find(x => x.questId === q.id)!;
    expect(w).toMatchObject({ why: 'lapses', lapsesNow: true });
    expect(w.text).toMatch(/goes cold this END/);
  });
});

describe("an approach card names the engine's best, busy or not (best-soldier-parity)", () => {
  it('approachBest = the strongest legal-but-for-the-gate fit, busy ones included', async () => {
    const g = await staged();
    const q = open(g)[0]!;
    q.approaches = [{ id: 'g0', label: 'A', rewardKind: 'gold' }, { id: 'g1', label: 'B', rewardKind: 'gold' }] as never;
    q.slots = [0, 1].map(i => ({ ...q.slots[0]!, groupId: `g${i}`, filledBy: null, requirement: { kind: 'open' as const } }));
    q.chosenApproach = undefined;
    for (const m of g.roster()) if (m.location.kind === 'quest' && m.location.questId === q.id) m.location = HELD('roster');
    const best = g.approachBest(q.id, 0)!;
    const top = g.slotFits(q.id, 0).filter(f => !f.blocked || f.gated).sort((a, b) => b.coins - a.coins)[0]!;
    expect(best.id).toBe(top.id);
    g.autoAssignAll();   // everyone busy elsewhere: the card still names someone
    expect(g.approachBest(q.id, 0)).not.toBeNull();
    expect(g.isReady(q.id)).toBe(false);   // an unchosen finale is never "ready"
    g.chooseApproach(q.id, 'g0');
    const m = g.roster().find(x => x.location.kind === 'held' || x.location.kind === 'quest')!;
    g.sendTo(q.id, m.id, 0);
    expect(g.approachSwitchLoss(q.id, 'g1')).toContain(m.name);
    expect(g.approachSwitchLoss(q.id, 'g0')).toBeNull();
  });
});

describe('the tally exists the moment the lines are in (proceed-before-tally)', () => {
  it('while the flesh tail runs, the archive already holds THIS cycle and its summary', async () => {
    let seen: { cycle: number; summaryCycle: number | null; writing: boolean | null } | null = null;
    let g!: Game;
    class SlowFlesh extends MockProvider {
      override async flesh(ins: FleshInput[]): Promise<FleshOut[]> {
        seen = { cycle: g.state.cycle, summaryCycle: g.reckoningAt()?.summary?.cycle ?? null, writing: g.reckoningView()?.writing ?? null };
        return super.flesh(ins);
      }
    }
    g = new Game(new SlowFlesh(9101), 9101);
    g.build('map-room');
    for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
    // a fresh face with no `who`, so the flesh pass has work
    const c = mkCaptive(g); c.character!.who = undefined;
    g.autoAssignAll();
    await g.endCycle();
    expect(seen).not.toBeNull();
    expect(seen!.writing).toBe(false);
    expect(seen!.summaryCycle).toBe(seen!.cycle);
  });
});

describe('room moves say what they do to prestige (move-preview-hides-prestige-loss, occupied-slot-no-preview, hand badge)', () => {
  it('a relic leaving a prestige room for a function room says the loss, in label, badge and tone', () => {
    const g = rich();
    for (const t of ['garden', 'infirmary']) g.build(t);
    const garden = room(g, 'garden'), inf = room(g, 'infirmary');
    g.upgrade(garden.id); g.upgrade(inf.id);
    const relic = mkRelic(g, ['nature', 'curio', 'decoration', 'heal']);
    expect(g.setInRoom(garden.id, relic.id).ok).toBe(true);
    const row = g.roomPlacementsFor(relic.id).find(r => r.roomId === inf.id)!;
    expect(row.ok).toBe(true);
    expect(row.gain).toBeLessThan(-0.05);
    expect(row.label).toMatch(/heals ×[\d.]+ · −[\d.]+ prestige/);
    expect(row.badge).toMatch(/^−[\d.]+ prestige$/);
    expect(row.tone).toBe('bad');
  });
  it('roomSlotPlans: a drop on an occupied prestige place is a swap with its own (losing) number', () => {
    const g = rich();
    g.build('garden');
    const garden = room(g, 'garden');
    g.upgrade(garden.id);
    const good = mkRelic(g, ['nature', 'curio', 'decoration']), weak = mkRelic(g, ['armor']);
    g.setInRoom(garden.id, good.id);
    expect(g.setInRoom(garden.id, weak.id).ok).toBe(false);          // no swap GAINS
    const [plan] = g.roomSlotPlans(garden.id, weak.id);
    expect(plan!.ok).toBe(true);
    expect(plan!.swapWith).toBe(good.id);
    expect(plan!.gain).toBeLessThan(0);
    expect(plan!.tone).toBe('bad');
    const before = g.prestige();
    g.setInRoom(garden.id, weak.id, 0);
    expect(g.prestige()).toBeCloseTo(before + plan!.gain, 6);
  });
  it('a prestige move that gains nothing badges neutral, never a green room total', () => {
    const g = rich();
    g.build('garden');
    const garden = room(g, 'garden');
    g.upgrade(garden.id);
    const a = mkRelic(g, ['armor']), b = mkRelic(g, ['armor']);   // wanted by nothing in a Garden
    expect(g.setInRoom(garden.id, a.id).ok).toBe(true);
    const [row] = g.roomSlotPlans(garden.id, b.id);   // swap like for like: prestige unchanged
    expect(row!.ok).toBe(true);
    expect(Math.abs(row!.gain)).toBeLessThan(0.05);
    expect(row!.tone).toBe('neutral');
    expect(row!.badge).toMatch(/^\+0\.0 prestige$/);
  });
});

describe('abandoning a saga step says what the engine will do (abandon-confirm-lies)', () => {
  it('a third untaken offer slips the saga — the confirm and the reply say so', async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room'); g.pursueAll(); await g.drain();
    const q = open(g).find(x => x.chainId && !x.isFinale);
    if (!q) return;
    const chain = g.state.chains.find(c => c.id === q.chainId)!;
    expect(g.abandonConsequence(q.id)).toMatch(/continuation lead returns/);
    chain.reOffers = 2;
    expect(g.abandonConsequence(q.id)).toMatch(/slips out of reach/);
    const r = g.abandon(q.id);
    expect(r.msg).toMatch(/out of reach/);
    expect(chain.state).toBe('slipped');
  });
  it('a first abandon returns the continuation lead — and the reply says it is back', async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room'); g.pursueAll(); await g.drain();
    const q = open(g).find(x => x.chainId && !x.isFinale);
    if (!q) return;
    const r = g.abandon(q.id);
    expect(r.msg).toMatch(/continuation lead is back/);
    expect(g.state.leads.some(l => l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === q.chainId)).toBe(true);
  });
});

describe('a finale recruit joins when the roster has room (finale-recruit-self-counted)', () => {
  it('one free place: the focal joins, not the tavern', async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room'); g.pursueAll(); await g.drain();
    const chain = g.state.chains.find(c => !c.isPersonal);
    if (!chain) return;
    const focal = g.card(chain.focalId)!;
    focal.location = HELD('limbo');
    // fill the roster to capacity − 1
    while (g.roster().filter(m => m.id !== focal.id).length < g.rosterCapacity() - 1) {
      const m = mkCaptive(g); m.character!.role = 'merc';
    }
    chain.bank = focal.value * 2;
    const q = { id: 'qx', title: 'x', chainId: chain.id, isFinale: true, approaches: [{ id: 'g0', label: 'Win', rewardKind: 'recruit' }], chosenApproach: 'g0' } as never;
    const report: string[] = [];
    (g as unknown as { settleFinale: (...a: unknown[]) => void }).settleFinale(q, chain, { outcome: 'success', party: [] }, report, { fate: 'clean' });
    expect(report.join(' ')).toMatch(/joins the company/);
    expect(focal.location).toMatchObject({ kind: 'held', state: 'roster' });
  });
});

describe('reward warnings (rescue-no-tavern-warn, finale-warn-union)', () => {
  it('a recruit with no Tavern warns that they will move on', async () => {
    const g = await staged();
    const q = open(g)[0]!;
    q.rewardSpecs = [{ kind: 'recruit', value: 60 } as never];
    expect(g.hasRoom('tavern')).toBe(false);
    expect(g.questRewardWarn(q.id)).toMatch(/no Tavern — they will thank you and move on/);
  });
  it('an unchosen finale warns on its captive ENDING, not the quest', async () => {
    const g = await staged();
    const q = open(g)[0]!;
    q.isFinale = true; q.rewardSpecs = [];
    q.approaches = [{ id: 'g0', label: 'Win', rewardKind: 'recruit' }, { id: 'g1', label: 'Subdue', rewardKind: 'captive' }] as never;
    q.chosenApproach = undefined;
    expect(g.hasRoom('dungeon')).toBe(false);
    expect(g.questRewardWarn(q.id) ?? '').not.toMatch(/captive/);
    expect(g.approachRewardWarn(q.id, 'g1')).toMatch(/brings a captive · no Dungeon/);
    q.chosenApproach = 'g1';
    expect(g.questRewardWarn(q.id)).toMatch(/brings a captive/);
  });
});

describe('the tally counts each loss once, and every kind of loss (tally-double-count, tally-missing-losses, setback-unreported)', () => {
  it('a part-filled quest that times out is one "went cold", not also "did not march"', async () => {
    const g = await staged();
    const q = bare(g, open(g).find(x => !x.approaches && x.slots.length >= 2) ?? open(g)[0]!);
    for (const x of open(g)) bare(g, x);
    if (q.slots.length < 2) return;
    q.createdCycle = g.state.cycle + 1 - 10;
    const m = g.roster().find(x => x.location.kind === 'held' && !g.canTake(q.id, 0, x.id))!;
    g.assign(q.id, 0, m.id);
    await g.endCycle();
    const sum = g.reckoningAt()!.summary!;
    expect(sum.lapsed).toContain(q.title);
    expect(sum.stalled).not.toContain(q.title);
  });
  it('a captive handed off from holding is in the tally, and in its line', async () => {
    const g = rich();
    const cap = mkCaptive(g); cap.location = HELD('staged');
    g.state.holding.push({ cardId: cap.id, expiresAtCycle: g.state.cycle + 1 });
    await g.endCycle();
    const sum = g.reckoningAt()!.summary!;
    expect(sum.handedOff?.map(h => h.id)).toEqual([cap.id]);
    expect(Game.tallyLine(sum)).toMatch(/handed off/);
  });
  it('a failed saga beat says the setback, and the tally counts it', async () => {
    const g = new Game(new MockProvider(77), 77);
    g.build('map-room'); g.pursueAll(); await g.drain();
    const chain = g.state.chains.find(c => c.state === 'active');
    if (!chain) return;
    chain.failures = 0;
    const report: string[] = [];
    (g as unknown as { cycleAcc: unknown }).cycleAcc = { wounds: [], tamed: [], lapsed: [], stalled: [], leadsCold: [], handedOff: [], setbacks: [] };
    (g as unknown as { advanceChain: (...a: unknown[]) => void }).advanceChain(
      { id: 'qx', title: 'x', chainId: chain.id, beatIndex: 1, isFinale: false, sideLootV: 0 }, { outcome: 'failure', party: [] }, undefined, report);
    expect(report.join(' ')).toMatch(new RegExp(`A setback — 1 of ${chain.failureBudget}`));
    expect((g as unknown as { cycleAcc: { setbacks: unknown[] } }).cycleAcc.setbacks).toHaveLength(1);
  });
});

describe('small engine answers the UIs print', () => {
  it('clearQuest empties a quest in one action; a second is a harmless no-op', async () => {
    const g = await staged();
    const q = open(g).find(x => !x.approaches)!;
    g.autoAssign(q.id);
    expect(g.clearQuest(q.id).ok).toBe(true);
    expect(q.slots.every(s => !s.filledBy)).toBe(true);
    expect(g.clearQuest(q.id)).toMatchObject({ ok: true, msg: 'nobody was placed' });
  });
  it('an Oracle with no places already reads coarse odds, and says it has no places', () => {
    const g = rich();
    expect(g.build('oracle').ok).toBe(true);
    expect(g.roomEffect(room(g, 'oracle'))).toBe('coarse odds (exact at comfort 15) · no places yet');
  });
  it('bedOwners is build()\'s own rule, and build() with no owner takes the first', () => {
    const g = rich();
    const owners = g.bedOwners();
    expect(owners.some(o => o.id === 'you')).toBe(false);   // your bedroom stands from day 0
    expect(owners.map(o => o.id)).toEqual(g.roster().map(m => m.id));
    const r = g.build('bedroom');
    expect(r.ok).toBe(true);
    expect(g.room(r.id!)!.ownerId).toBe(owners[0]!.id);
  });
  it('a region room names the Scouting lodge; the lodge of a region already on the map says what it adds', () => {
    const g = rich();
    const post = g.buildableTypes().find(b => b.type === 'recruiting-forests')!;
    expect(post.reason).toMatch(/build the Scouting lodge \(Western Forests\) first/);
    expect(roomDesc('scouting-forests', g.activeRegions())).toMatch(/^Scouts Western Forests/);
    expect(roomDesc('scouting-forests', [])).toMatch(/^Opens/);
  });
  it('unenforced gates do not lock (room-gates-not-enforced)', () => {
    const g = rich();
    const gates = Object.fromEntries(g.menuGates().map(m => [m.key, m]));
    expect(gates.items!.locks).toBe(false);
    expect(gates.staging!.locks).toBe(false);
    expect(gates.roster!.locks).toBe(false);
    expect(gates.captives!.locks).toBe(true);
    expect(roomDesc('mess-hall')).toMatch(/^No effect yet/);
    expect(roomDesc('storage')).toMatch(/^No effect yet/);
  });
  it('with no prestige room the Great Hall fix builds one, and the scroll names it (scroll-no-progression)', () => {
    const g = new Game(new MockProvider(101), 101);
    g.build('map-room');
    const fix = g.ghBlock()!.fix!;
    expect(fix).toMatchObject({ action: 'build' });
    expect(g.nextSteps().some(s => s.kind === 'build' && /prestige raises the Great Hall/.test(s.text))).toBe(true);
  });
  it("a rack's progress is THIS captive's breaking, not the room's current duration (client-derived-math)", () => {
    const g = rich();
    g.build('dungeon'); g.build('dungeon-cell'); g.build('torture-chamber');
    const rack = room(g, 'torture-chamber');
    g.upgrade(rack.id); g.upgrade(rack.id);
    const a = mkCaptive(g, ['intimidation']), b = mkCaptive(g, ['intimidation', 'roguery']);
    g.setInRoom(rack.id, a.id);
    const total = g.captiveState(a.id)!.breakTotal;
    const due = g.captiveState(a.id)!.doneAt;
    g.setInRoom(rack.id, b.id);   // the rack's comfort moves
    expect(g.captiveState(a.id)!.breakTotal).toBe(total);
    expect(total).toBe(due! - g.state.cycle);
  });
  it('a debt is settled at its settleQuote', () => {
    const g = rich();
    g.state.cards.push(mintStackable('debt', 40));
    const debt = g.state.cards.find(c => c.name === 'debt')!;
    const q = g.settleQuote(debt.id)!;
    const gold = g.gold();
    expect(g.payOffLiability(debt.id).ok).toBe(true);
    expect(gold - g.gold()).toBe(q);
  });
});
