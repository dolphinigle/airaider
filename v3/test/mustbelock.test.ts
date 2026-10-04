// THE MUST-BE LOCK (QUESTS §3 🔒, designer 2026-10-04: "locked in. same for any other quests that 'locks' a card in"):
// while a quest with a must-be place is open, the named soldier stands in that place and can be sent nowhere else; the
// way out is the game's own — set the quest aside, or let it lapse. Deterministic: the Mock narrator plus fixed seeds.
import { describe, it, expect } from 'vitest';
import { Game, STALL_LIMIT, type LockNote } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { seedIdCounter, HELD } from '../src/engine/cards.js';
import type { Lead, Quest } from '../src/engine/quests.js';
import type { SagaCall } from '../src/ai/provider.js';

const SOLDIER_PART = "one of the company's soldiers";
/** the mock, but its plan writes the soldier into job 1's people — the plan staging their own matter in person, which
 *  pins them to the job's first place (the mock's own plan never does) */
class SoldierInJob1 extends MockProvider {
  override async sagaCall(c: SagaCall): Promise<unknown> {
    const out = await super.sagaCall(c) as Record<string, any>;
    if (c.template !== 'plan') return out;
    const soldier = (c.payload.cast as { id: string; part: string }[]).find(p => p.part === SOLDIER_PART);
    if (soldier) out.episodes[0].people = [soldier.id, ...out.episodes[0].people];
    return out;
  }
}
/** a personal saga's lead for the first soldier, as the game posts one */
function personalLead(g: Game): Lead {
  if (!g.hasRoom('lead-room')) g.build('lead-room');
  const merc = g.roster()[0]!;
  const lead: Lead = { id: `lead-p-${merc.id}`, rarity: 'uncommon', level: merc.character!.level, region: g.activeRegions()[0]!, archetype: 'investigate',
    chainInfo: { kind: 'starts-new' }, expiresAtCycle: g.state.cycle + 12, source: 'personal', title: `${merc.name}'s past stirs`, personalMercId: merc.id };
  g.state.leads.push(lead);
  return lead;
}
const open = (g: Game) => g.state.quests.filter(q => q.state === 'open');

/** a game with the starter one-offs on the board and a personal saga lead ready to pursue (not yet pursued) */
async function board(seed = 31) {
  seedIdCounter(1);
  const g = new Game(new SoldierInJob1(seed), seed);
  g.build('map-room');
  for (const l of [...g.visibleLeads()]) await g.pursue(l.id);
  const lead = personalLead(g);
  const soldier = g.roster()[0]!;
  return { g, lead, soldier };
}
/** …and the personal saga's first job landed: its first place names the soldier */
async function locked(seed = 31) {
  const b = await board(seed);
  const r = await b.g.pursue(b.lead.id);
  const job = b.g.state.quests.find(q => q.id === r.questId)!;
  return { ...b, job, r };
}
/** a plain one-off (no saga, no standing post) with at least `n` places — places are added by hand when the deal
 *  gave fewer, so the tests never hinge on a seed's slot roll */
function oneOff(g: Game, n = 2): Quest {
  const q = open(g).find(x => !x.chainId && !x.approaches && x.fromLead?.expiresAtCycle !== null)!;
  while (q.slots.length < n) q.slots.push({ requirement: { kind: 'open' }, test: { ...q.slots[0]!.test }, filledBy: null });
  return q;
}
/** name a soldier in one of a quest's places by hand (as a writer could on any quest) and let the lock take hold */
function pin(g: Game, q: Quest, idx: number, cardId: string): LockNote[] {
  q.slots[idx]!.requirement = { kind: 'must-be', cardId };
  return g.settleLocks();
}

describe('the must-be lock', () => {
  it('a card whose must-be place names a soldier locks them in the moment it lands', async () => {
    const { g, soldier, job, r } = await locked();
    expect(job.slots[0]!.requirement).toEqual({ kind: 'must-be', cardId: soldier.id });
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
    expect(soldier.location).toEqual({ kind: 'quest', questId: job.id, slot: 0 });
    expect(g.lockOf(soldier.id)).toEqual({ questId: job.id, title: job.title, idx: 0 });
    expect(r.note).toMatch(new RegExp(`${soldier.name} is locked to ${job.title}`));
    expect(g.placeLock(job.id, 0)).toMatchObject({ locked: true, note: expect.stringMatching(/^locked in — this place names .+; set the quest aside to free them$/) });
  });

  it('a soldier busy on another quest when the card lands (async, mid-cycle) is moved in, with a plain notice', async () => {
    const { g, lead, soldier } = await board();
    const other = oneOff(g);
    expect(g.sendTo(other.id, soldier.id).ok).toBe(true);
    const from = (soldier.location as { slot: number }).slot;
    const seq = g.arrivalSeq();
    expect(g.enqueuePursue(lead.id).ok).toBe(true);
    await g.drain();
    const [job] = g.arrivals(seq);
    const q = g.state.quests.find(x => x.id === job!.questId)!;
    expect(q.slots[0]!.filledBy).toBe(soldier.id);
    expect(other.slots[from]!.filledBy).toBeNull();
    expect(job!.note).toMatch(new RegExp(`locked to ${q.title}: its place names them — taken off ${other.title} \\(now 0 of ${other.slots.length} placed\\)`));
  });

  it('refuses every move elsewhere, in plain words', async () => {
    const { g, soldier, job } = await locked();
    const other = oneOff(g);
    const why = new RegExp(`^locked to ${job.title} — its place names ${soldier.name}; set that quest aside to use them elsewhere$`);
    expect(g.sendTo(other.id, soldier.id)).toMatchObject({ ok: false, msg: expect.stringMatching(new RegExp(`\\(locked to ${job.title}`)) });
    expect(g.sendTo(other.id, soldier.id, 0)).toMatchObject({ ok: false, msg: expect.stringMatching(why) });
    expect(g.assign(other.id, 0, soldier.id)).toMatchObject({ ok: false, msg: expect.stringMatching(why) });
    expect(g.canTake(other.id, 0, soldier.id)).toMatch(why);
    // the quest screens and the hand read the same refusal (slotFits), and the sheet's "send to" offers nothing else
    expect(g.slotFits(other.id, 0).find(f => f.id === soldier.id)?.blocked).toMatch(why);
    expect(g.placementsFor(soldier.id).map(p => [p.questId, p.here])).toEqual([[job.id, true]]);
    // nor back to the hand, nor off by Clear
    expect(g.unassign(job.id, 0)).toMatchObject({ ok: false, msg: `${soldier.name} is locked in — this place names them; set the quest aside to free them` });
    const c = g.clearQuest(job.id);
    expect(c.msg).toMatch(new RegExp(`${soldier.name} stays — locked in`));
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
    // nor to another place on its own quest
    if (job.slots.length > 1) expect(g.sendTo(job.id, soldier.id, 1)).toMatchObject({ ok: false, msg: expect.stringMatching(/^locked to the .+ place here — that place names /) });
    // and nobody else takes the place that names them
    const mate = g.roster().find(m => m.id !== soldier.id)!;
    expect(g.canTake(job.id, 0, mate.id)).toBe(`this place names ${soldier.name}`);
  });

  it('Clear still empties what the player placed, and says who stays', async () => {
    const { g, soldier, job } = await locked();
    if (job.slots.length < 2) job.slots.push({ requirement: { kind: 'open' }, test: { ...job.slots[0]!.test }, filledBy: null });
    const mate = g.roster().find(m => m.id !== soldier.id)!;
    expect(g.sendTo(job.id, mate.id, 1).ok).toBe(true);
    const c = g.clearQuest(job.id);
    expect(c.ok).toBe(true);
    expect(c.msg).toMatch(new RegExp(`^${mate.name} back in the hand · ${soldier.name} stays — locked in`));
    expect(job.slots[1]!.filledBy).toBeNull();
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
  });

  it('autoAssign never moves a locked soldier', async () => {
    const { g, soldier, job } = await locked();
    g.autoAssignAll();
    for (const q of open(g)) g.autoAssign(q.id);
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
    expect(open(g).filter(q => q.id !== job.id).flatMap(q => q.slots.map(s => s.filledBy))).not.toContain(soldier.id);
  });

  it('a wounded soldier stays locked in (a wound is a penalty, never a bar)', async () => {
    const { g, soldier, job } = await locked();
    soldier.character!.injuryTiers = 3;
    g.settleLocks();
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
    expect(g.canTake(job.id, 0, soldier.id)).toBeNull();
    expect(g.sendTo(oneOff(g).id, soldier.id, 0).ok).toBe(false);
  });

  it('a job the lock alone fills marches at the next END (the game\'s own rule) — the notice says so, warn-toned; so does one that breaks a ready party', async () => {
    const { g } = await board();
    const [a, b] = open(g).filter(x => !x.chainId && !x.approaches);
    a!.slots.splice(1); b!.slots.splice(1);
    const x = g.roster()[1]!;
    expect(g.sendTo(b!.id, x.id, 0).ok).toBe(true);
    expect(g.isReady(b!.id)).toBe(true);
    const [n] = pin(g, a!, 0, x.id);
    expect(n).toEqual({ warn: true, line: `🔒 ${x.name} is locked to ${a!.title}: its place names them — taken off ${b!.title} (now 0 of 1 placed, it won't march). That fills every place: it marches at the next END unless you set it aside.` });
    expect(g.isReady(a!.id)).toBe(true);
    await g.endCycle();
    expect(a!.state).toBe('resolved');
    expect(x.location).toEqual(HELD('roster'));
    // a partial fill that breaks nothing is plain news
    const c = oneOff(g, 2), y = g.roster()[2] ?? g.roster()[0]!;
    for (const q of open(g)) g.clearQuest(q.id);
    expect(pin(g, c, 0, y.id)).toEqual([{ warn: false, line: expect.stringMatching(/Set it aside to use them elsewhere\.$/) }]);
  });

  it('a soldier waiting locked in heals as one waiting in the hand (a lock is no deployment)', async () => {
    const { g } = await board();
    const q = oneOff(g, 2);
    const [x, mate] = [g.roster()[1]!, g.roster()[2] ?? g.roster()[0]!];
    for (const o of open(g)) g.clearQuest(o.id);
    pin(g, q, 0, x.id);
    x.character!.injuryTiers = 2; mate.character!.injuryTiers = 2;
    for (let i = 0; i < 4; i++) await g.endCycle();
    expect(q.slots[0]!.filledBy).toBe(x.id);
    expect(mate.character!.injuryTiers).toBeLessThan(2);
    expect(x.character!.injuryTiers).toBe(mate.character!.injuryTiers);
  });

  it('a soldier not with the company is locked nowhere — the place stays empty and says so', async () => {
    const { g } = await board();
    const q = oneOff(g);
    const gone = g.roster()[1]!;
    gone.location = HELD('lore');
    expect(pin(g, q, 0, gone.id)).toEqual([]);
    expect(q.slots[0]!.filledBy).toBeNull();
    expect(g.lockOf(gone.id)).toBeNull();
    expect(g.placeLock(q.id, 0)!.note).toBe(`must be ${gone.name} — not with the company, so nobody can take this place`);
  });

  it('two open quests naming one soldier: the first posted keeps them, the other says so — and takes them once the first is set aside', async () => {
    const { g } = await board();
    const [a, b] = open(g).filter(x => !x.chainId);
    const x = g.roster()[1]!;
    expect(pin(g, a!, 0, x.id)).toHaveLength(1);
    expect(pin(g, b!, 0, x.id)).toEqual([]);
    expect(a!.slots[0]!.filledBy).toBe(x.id);
    expect(b!.slots[0]!.filledBy).toBeNull();
    expect(g.placeLock(b!.id, 0)!.note).toBe(`must be ${x.name} — already locked to ${a!.title}; this place waits until that quest is done`);
    expect(g.canTake(b!.id, 0, x.id)).toMatch(new RegExp(`^locked to ${a!.title} — `));
    const r = g.abandon(a!.id);
    expect(r.msg).toMatch(new RegExp(`🔒 ${x.name} is locked to ${b!.title}`));
    expect(b!.slots[0]!.filledBy).toBe(x.id);
    expect(g.lockOf(x.id)).toMatchObject({ questId: b!.id });
  });

  it('setting a saga step aside frees the soldier — and keeps its consequence (the thread dangles)', async () => {
    const { g, soldier, job } = await locked();
    const r = g.abandon(job.id);
    expect(r.msg).toMatch(/the thread dangles/);
    expect(soldier.location).toEqual(HELD('roster'));
    expect(g.lockOf(soldier.id)).toBeNull();
    expect(g.state.leads.some(l => l.chainInfo.kind === 'continues' && (l.chainInfo as { chainId: string }).chainId === job.chainId)).toBe(true);
    expect(g.sendTo(oneOff(g).id, soldier.id).ok).toBe(true);
  });

  it('a quest that lapses frees its soldier', async () => {
    const { g } = await board();
    const q = oneOff(g);
    const x = g.roster()[1]!;
    pin(g, q, 0, x.id);
    q.createdCycle = g.state.cycle - 9;   // its last cycle (QUEST_TTL 10)
    await g.endCycle();
    expect(g.state.quests.includes(q)).toBe(false);
    expect(x.location).toEqual(HELD('roster'));
    expect(g.lockOf(x.id)).toBeNull();
  });

  it('a quest only its lock staffs neither stalls nor stands down; a party the player parked beside it still does', async () => {
    const { g } = await board();
    const q = oneOff(g, 2);
    const x = g.roster()[1]!;
    pin(g, q, 0, x.id);
    expect(g.questStallAt(q)).toBeNull();
    expect(g.endWarnings().some(w => w.questId === q.id && w.why === 'short')).toBe(false);
    for (let i = 0; i < STALL_LIMIT + 1; i++) await g.endCycle();
    expect(g.state.quests.includes(q)).toBe(true);
    expect(q.stalls ?? 0).toBe(0);
    expect(q.slots[0]!.filledBy).toBe(x.id);
    // the stand-down: three places, the lock, one the player parked, and nobody left to fill the third
    q.slots.splice(2);
    q.slots.push({ requirement: { kind: 'open' }, test: { ...q.slots[0]!.test }, filledBy: null });
    for (const o of open(g)) if (o !== q) g.clearQuest(o.id);
    const parked = g.roster().find(m => m.location.kind === 'held')!;
    expect(g.sendTo(q.id, parked.id, 1).ok).toBe(true);
    for (const m of g.roster().filter(m => m.location.kind === 'held')) m.character!.injuryTiers = 4;
    q.createdCycle = g.state.cycle;
    const lines = await g.endCycle();
    expect(lines).toContain(`⏸ ${q.title}: the plan needs more hands than the company can field — the party stands down.`);
    expect(q.slots[1]!.filledBy).toBeNull();
    // the lock never let go (no fresh "locked to" notice — it was not released and re-taken)
    expect(q.slots[0]!.filledBy).toBe(x.id);
    expect(lines.some(l => l.startsWith('🔒'))).toBe(false);
  });

  it('save/load keeps the lock; a save from before the lock is repaired on load', async () => {
    const { g, soldier, job } = await locked();
    const back = Game.load(new MockProvider(31), g.save());
    expect(back.lockOf(soldier.id)).toEqual(g.lockOf(soldier.id));
    expect(back.state.quests.find(q => q.id === job.id)!.slots[0]!.filledBy).toBe(soldier.id);
    expect(back.unassign(job.id, 0).ok).toBe(false);
    // the old save: the must-be place empty, its soldier in the hand
    const st = JSON.parse(g.save());
    st.quests.find((q: Quest) => q.id === job.id).slots[0].filledBy = null;
    st.cards.find((c: { id: string }) => c.id === soldier.id).location = HELD('roster');
    const old = Game.load(new MockProvider(31), JSON.stringify(st));
    expect(old.state.quests.find(q => q.id === job.id)!.slots[0]!.filledBy).toBe(soldier.id);
    expect(old.card(soldier.id)!.location).toEqual({ kind: 'quest', questId: job.id, slot: 0 });
    expect(old.state.log.at(-1)).toMatchObject({ kind: 'lock' });
  });

  it('room slots respect it: a locked soldier is set in no room', async () => {
    const { g, soldier, job } = await locked();
    const room = g.state.fort.rooms[0]!;
    expect(g.setInRoom(room.id, soldier.id).ok).toBe(false);
    expect(g.roomPlacementsFor(soldier.id)).toEqual([]);
    expect(job.slots[0]!.filledBy).toBe(soldier.id);
  });
});
