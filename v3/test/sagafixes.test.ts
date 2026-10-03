// The storyteller integration's fix round (2026-10-03): mechanics restored to what they were before the v4 storyteller
// came in (North Star 0 — no gameplay change), a save that dies mid-pursuit, the lore a saga leaves when it closes before
// any report, and the engine lines the player reads (a failed try, So far, the road after a last chance).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { seedIdCounter } from '../src/engine/cards.js';
import type { Lead } from '../src/engine/quests.js';
import type { SagaWorld, SagaPlan } from '../src/engine/saga.js';
import type { SagaCall } from '../src/ai/provider.js';
import { validatePlan, triedLine, logLines } from '../src/ai/storyteller.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, hostFor, playSaga } from './sagaharness.js';

const SOLDIER_PART = "one of the company's soldiers";

/** a personal saga's lead for the first soldier, as the game posts one (read at a Lead room) */
function personalLead(g: Game): Lead {
  if (!g.hasRoom('lead-room')) g.build('lead-room');
  const merc = g.roster()[0]!;
  const lead: Lead = { id: `lead-p-${merc.id}`, rarity: 'uncommon', level: merc.character!.level, region: g.activeRegions()[0]!, archetype: 'investigate',
    chainInfo: { kind: 'starts-new' }, expiresAtCycle: g.state.cycle + 12, source: 'personal', title: `${merc.name}'s past stirs`, personalMercId: merc.id };
  g.state.leads.push(lead);
  return lead;
}
/** the mock, but its plan writes the soldier into job 1's people (the plan staging their own matter in person) */
class SoldierInJob1 extends MockProvider {
  override async sagaCall(c: SagaCall): Promise<unknown> {
    const out = await super.sagaCall(c) as Record<string, any>;
    if (c.template !== 'plan') return out;
    const soldier = (c.payload.cast as { id: string; part: string }[]).find(p => p.part === SOLDIER_PART);
    if (soldier) out.episodes[0].people = [soldier.id, ...out.episodes[0].people];
    return out;
  }
}
/** the mock, holding one saga template's calls until released */
class Held extends MockProvider {
  release!: () => void;
  private gate = new Promise<void>(r => { this.release = r });
  constructor(seed: number, private hold: 'plan' | 'card') { super(seed) }
  override async sagaCall(c: SagaCall): Promise<unknown> { if (c.template === this.hold) await this.gate; return super.sagaCall(c) }
}
const until = async (ok: () => boolean) => { for (let i = 0; i < 200 && !ok(); i++) await new Promise(r => setTimeout(r, 2)) };

describe('A — a personal saga pins its soldier only where the plan put them', () => {
  const personalWorld = (): SagaWorld => ({
    personal: true, N: 3, kind: 'captive', shape: 'heist', focalId: 'c3',
    cast: [
      { id: 'c3', name: 'Jervaise Greyfell', sex: 'female', race: 'human', seat: 'soldier', focal: true, part: SOLDIER_PART, trade: 'cook', known: true },
      { id: 'p1', name: 'Jofstrom', sex: 'male', race: 'wolfman', seat: 'opponent', focal: false, part: 'stands in the way', trade: 'slaver', known: false },
    ],
    stake: 'someone loved', places: ['Millthorpe', 'Yarlea', 'Dunbrook'], land: 'the Western Forests', seed: { id: null, text: 'a brother left bound' },
    tone: 'tense', region: 'forests', level: 2,
  });
  const rawPlan = () => ({
    title: 'The Cook\'s Debt', question: 'Nobody knows why the slaver keeps him.', answer: 'The debt was paid long ago.',
    cast: [{ id: 'p1', label: 'a wolfkin slaver' }], soldier: { want: 'free her brother', past: 'left her brother bound' },
    episodes: [
      { type: 'sneak', title: 'The Chest', job: 'Steal the slaver\'s chest at Millthorpe.', why: 'She hopes it tells where he is.', people: ['p1'], trouble: { who: 'the slaver\'s guards', carry: 'spears', will: 'raise the horn' }, win: 'The chest is taken.', gain: 'the slaver\'s ledger', learn: 'The debts were marked paid.' },
      { type: 'talk', title: 'The Hold', job: 'Talk her way into the hold at Yarlea.', why: 'She can see him again.', people: ['c3', 'p1'], trouble: { who: 'the warden', carry: 'keys', will: 'bar the door' }, win: 'The warden lets her in.', gain: 'a map of the hold', learn: 'Her brother keeps the books.' },
    ],
    showdown: { title: 'The Bond', job: 'Face the slaver at Dunbrook.', people: ['p1'], trouble: { who: 'the slaver', carry: 'a whip', will: 'hold the yard' }, edge: ['the ledger shames him', 'the map shows the way'], settles: 'Her brother walks free.', lose: 'her brother' },
    options: [{ way: 'talk', label: 'Talk the slaver round' }, { way: 'fight', label: 'Fight the slaver' }, { way: 'sneak', label: 'Slip past the slaver' }],
  });

  it('validatePlan: the pin comes from the people as written; the repair still reaches the prose', () => {
    const v = validatePlan(rawPlan(), { w: personalWorld() });
    expect(v.defects).toEqual([]);
    expect(v.ownJobs).toEqual([2]);
    // the repair is untouched: every job's people carry the soldier for the payloads
    expect(v.plan!.episodes.every(e => e.people.includes('c3'))).toBe(true);
    expect(v.repairs).toContain('soldier added to episode 1');
  });

  it('in game: a job the plan did not put the soldier in has no must-be place', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(31), 31);
    g.build('map-room');
    const r = await g.pursue(personalLead(g).id);
    const q = g.state.quests.find(x => x.id === r.questId)!;
    const chain = g.state.chains.find(c => c.id === q.chainId)!;
    expect(chain.isPersonal).toBe(true);
    // the floor's plan never writes the soldier into a job; the repair added them to every job's people all the same
    expect(chain.saga!.plan!.episodes.every(e => e.people.includes(chain.focalId))).toBe(true);
    expect(chain.saga!.ownJobs).toEqual([]);
    expect(q.slots.some(s => s.requirement.kind === 'must-be')).toBe(false);
  });

  it('in game: a job the plan did put the soldier in pins them to the first place', async () => {
    seedIdCounter(1);
    const g = new Game(new SoldierInJob1(31), 31);
    g.build('map-room');
    const r = await g.pursue(personalLead(g).id);
    const q = g.state.quests.find(x => x.id === r.questId)!;
    const chain = g.state.chains.find(c => c.id === q.chainId)!;
    expect(chain.saga!.ownJobs).toEqual([1]);
    expect(q.slots[0]!.requirement).toEqual({ kind: 'must-be', cardId: chain.focalId });
    expect(q.slots.filter(s => s.requirement.kind === 'must-be')).toHaveLength(1);
  });

  it('a save from before the fix (no ownJobs) pins nobody', () => {
    seedIdCounter(1);
    const { g } = newGame(32);
    const { chain, focal } = sagaChain(g, { N: 3, personal: true });
    flow.deal(hostFor(g), chain, undefined, focal);
    expect(flow.pinsSoldier(chain.saga!, 1)).toBe(false);
    chain.saga!.ownJobs = [1];
    expect(flow.pinsSoldier(chain.saga!, 1)).toBe(true);
    expect(flow.pinsSoldier(chain.saga!, 2)).toBe(false);
  });
});

describe('B — a save taken mid-pursuit leaves no dead saga', () => {
  for (const hold of ['plan', 'card'] as const) for (const personal of [false, true]) it(`saved while the ${hold} is written (${personal ? 'personal' : 'hired'})`, async () => {
    seedIdCounter(1);
    const ai = new Held(40, hold);
    const g = new Game(ai, 40);
    g.build('map-room');
    const lead = personal ? personalLead(g) : g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    expect(g.enqueuePursue(lead.id).ok).toBe(true);
    await until(() => g.state.chains.length > 0 && (hold === 'plan' || !!g.state.chains[0]!.saga?.plan));
    const chain = g.state.chains[0]!;
    expect(hold === 'plan' ? chain.saga!.plan : chain.saga!.card1).toBeFalsy();
    // still being written: no view shows it (E3)
    expect(g.chainViews()).toEqual([]);
    const focalId = chain.focalId;
    const json = g.save();

    const back = Game.load(new MockProvider(40), json);
    expect(back.state.chains.find(c => c.id === chain.id)).toBeUndefined();
    const focal = back.card(focalId)!;
    expect(focal.chainIds).not.toContain(chain.id);
    expect(focal.location).toEqual(personal ? { kind: 'held', state: 'roster' } : { kind: 'held', state: 'lore' });
    // the lead is still on the board: pursuing it again starts the saga afresh
    expect(back.state.leads.some(l => l.id === lead.id)).toBe(true);
    const again = await back.pursue(lead.id);
    expect(again.ok).toBe(true);
    const q = back.state.quests.find(x => x.id === again.questId)!;
    expect(back.state.chains.find(c => c.id === q.chainId)!.saga!.card1).toBeTruthy();
    expect(back.chainViews().map(c => c.id)).toEqual([q.chainId]);

    // the game that kept running finishes its pursuit as before
    ai.release();
    await g.drain();
    expect(g.chainViews().map(c => c.id)).toEqual([chain.id]);
  });
});

describe('C — a saga that closes before any report leaves no memoryless person', () => {
  it('a met person is remembered by their part in the matter, under its title', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(50), 50);
    g.build('map-room');
    const r = await g.pursue(g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!.id);
    const chain = g.state.chains.find(c => c.id === g.state.quests.find(q => q.id === r.questId)!.chainId)!;
    const rec = chain.saga!, plan = rec.plan!;
    expect(rec.lines).toEqual([]);
    const client = plan.cast.find(p => p.seat === 'client')!;
    expect(rec.knowing.met).toContain(client.id);
    (g as unknown as { persistMetCast(c: unknown): void }).persistMetCast(chain);
    const node = Object.values(g.state.lore.nodes).find(n => n.name === client.name)!;
    expect(node).toBeTruthy();
    const edges = g.state.lore.edges.filter(e => e.from === node.id || e.to === node.id);
    expect(edges).toHaveLength(1);
    expect(edges[0]!.blurb).toBe(`asked the company for help in the matter of "${plan.title}"`);
    expect(edges[0]!.to).toBe(chain.focalId);
  });
});

describe('D3 — a failed try never doubles its subject', () => {
  const plan = { cast: [{ id: 'c9', name: 'Rautio Greypelt', seat: 'opponent', label: 'a hunter' }] } as unknown as SagaPlan;
  const w = { places: ['Woldcot'] } as unknown as SagaWorld;
  it('a summary that opens on the company keeps its subject in a sentence of its own', () => {
    expect(triedLine('Track down the cats in Woldcot.', 'The company was stopped when the gate shut.', plan, w))
      .toBe('The company tried to track down the cats in Woldcot. The company was stopped when the gate shut.');
    expect(triedLine('Track down the cats.', "the company's scouts were seen at the gate", plan, w))
      .toBe("The company tried to track down the cats. The company's scouts were seen at the gate.");
    expect(triedLine('Track down the cats.', 'your soldiers lost the trail', plan, w)).toBe('The company tried to track down the cats. Your soldiers lost the trail.');
  });
  it('any other subject still runs on after "but", a name keeping its capital', () => {
    expect(triedLine('Track down the cats.', 'They beat the company back.', plan, w)).toBe('The company tried to track down the cats, but they beat the company back.');
    expect(triedLine('Track down the cats.', 'Rautio drove them off', plan, w)).toBe('The company tried to track down the cats, but Rautio drove them off.');
    expect(triedLine('Track down the cats.', 'A charging boar drove them back', plan, w)).toBe('The company tried to track down the cats, but a charging boar drove them back.');
  });
});

describe('D5, E2 — So far and the road after a last chance', () => {
  it('So far numbers the finale "finale"; the road drops a job the last chance skipped', async () => {
    seedIdCounter(1);
    const { g } = newGame(60);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    let atFinale: flow.Chronicle | null = null;
    await playSaga(g, chain, 'lastchance', focal, pos => { if (pos.finale) atFinale = flow.chronicle(chain) });
    const rec = chain.saga!;
    expect(rec.lastchance).toBe(true);
    const skipped = rec.plan!.episodes.filter(e => !rec.done[e.n]).map(e => e.n);
    expect(skipped.length).toBeGreaterThan(0);
    // the chronicle between the last chance and the finale: no skipped job is "ahead", the finale is next
    const rows = logLines(atFinale!.rows);
    expect(rows.filter(l => l.startsWith('  · '))).toEqual([]);
    expect(rows).toContain(`  ▶ Finale: ${rec.plan!.showdown.title}`);
    // So far: the jobs by their numbers, the finale by name, never N
    const c = flow.chronicle(chain)!;
    expect(c.soFar.map(r => r.n)).toEqual(rec.lines.map(l => l.n === 4 ? 'finale' : String(l.n)));
    expect(c.soFar[c.soFar.length - 1]!.n).toBe('finale');
    expect(flow.chronicleText(c).some(l => /^ {2}finale [✓~✗] /.test(l))).toBe(true);
    expect(flow.chronicleText(c).some(l => /^ {2}4 /.test(l))).toBe(false);
  });

  it('D4: once over, the chronicle says how it ended instead of the likely end', async () => {
    seedIdCounter(1);
    const { g } = newGame(61);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    let live: flow.Chronicle | null = null;
    await playSaga(g, chain, 'clean', focal, pos => { if (pos.finale) live = flow.chronicle(chain) });
    expect(live!.ending).toBeUndefined();
    expect(flow.endLine(live!)).toBe(`likely end: ${live!.likely}`);
    const c = flow.chronicle(chain)!;
    // the harness passes no fate, so the finale's own line stands in
    expect(c.ending).toBe(chain.saga!.lines[chain.saga!.lines.length - 1]!.text);
    expect(flow.endLine(c).startsWith('ending: ')).toBe(true);
  });
});

describe('D1, D10 — a finale says what its chosen plan brings', () => {
  async function finale(g: Game, way: 'recruit' | 'captive' | 'gold') {
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    const host = hostFor(g);
    flow.deal(host, chain, undefined, focal);
    await flow.plan(host, chain);
    const ways = flow.approaches(chain.saga!);
    const q = { id: `qf-${way}`, title: 'The Reckoning', chainId: chain.id, isFinale: true, state: 'open', rewardSpecs: [], rewardCards: [], slots: [],
      approaches: ways.map(a => ({ id: a.id, label: a.label, rewardKind: a.rewardKind, way: a.way })), chosenApproach: ways.find(a => a.rewardKind === way)!.id } as never;
    g.state.quests.push(q);
    return { chain, focal, q: g.state.quests[g.state.quests.length - 1]! };
  }
  it('the gold plan lets the person go: REWARD is the coin set aside, never their name', async () => {
    seedIdCounter(1);
    const { g } = newGame(70);
    const { chain, focal, q } = await finale(g, 'gold');
    chain.bank = 120;
    expect(g.questReward(q.id)).toBe("what was set aside, in coin (a month's pay)");
    expect(g.questReward(q.id)).not.toContain(focal.name);
  });
  it('a keep plan on a bank too thin to keep them pays salvage coin', async () => {
    seedIdCounter(1);
    const { g } = newGame(71);
    const { chain, q } = await finale(g, 'recruit');
    chain.bank = 0;
    expect(g.questReward(q.id)).toBe('salvage coin — too little was set aside to keep the one at the heart of it');
  });
  it('a recruit plan with roster room warns of nothing — they join, Tavern or not', async () => {
    seedIdCounter(1);
    const { g } = newGame(72);
    const { chain, focal, q } = await finale(g, 'recruit');
    chain.bank = focal.value * 2;
    expect(g.hasRoom('tavern')).toBe(false);
    expect(g.roster().length).toBeLessThan(g.rosterCapacity());
    expect(g.questReward(q.id)).toBe('the one at the heart of it');
    expect(g.questRewardWarn(q.id)).toBeNull();
    expect(g.approachRewardWarn(q.id, q.chosenApproach!)).toBeNull();
  });
  it('a captive plan with no Dungeon says they can only be ransomed or sold from holding', async () => {
    seedIdCounter(1);
    const { g } = newGame(73);
    const { q } = await finale(g, 'captive');
    expect(g.approachRewardWarn(q.id, q.chosenApproach!)).toBe('brings a captive · no Dungeon — they can only be ransomed or sold from holding');
  });
});
