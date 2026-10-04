// The game's own saga (designer 2026-10-04, docs/STORYTELLER.md North Star 5): the kit+pick seed and the C2 'grafts'
// pipeline, played through the Game facade both UIs read, to a gold finale on the mock. Ruling 1: the gold way's money
// shows on its finale BUTTON only (the label and its fate fact) — never in a card, report, summary, fate sentence,
// chronicle line, the memory the saga leaves, or any payload the writer sees. The engine's 💰 payout line stays: a game
// line, not story text. Nothing about play changes: the gold way pays what it paid.
import { describe, it, expect, afterEach } from 'vitest';
import { Game } from '../src/game/game.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { PIPE_ARM, SEED_ARM, WAY_ENDING, FREE_WAY, helped, wayMeans, type CastEntry } from '../src/engine/saga.js';
import type { LabFixture } from '../src/engine/lab.js';
import { cannedOption, toldOption, fateSentence } from '../src/ai/storyteller.js';
import * as flow from '../src/game/sagaflow.js';
import { RecordingMock } from './sagaharness.js';

/** the gold way's money as a writer would paste it */
const MONEY = /\bpa(?:y|ys|id|ying)\b|\bcoins?\b|\btreasure\b/i;

const fixture = (over: Partial<LabFixture>): LabFixture => ({
  id: 'GD1', seed: 1, path: 'clean', spark: 'a border stone moved by night, a little each year',
  focal: { name: 'Rautio', sex: 'male', race: 'human', seed: 1104, value: 150 },
  N: 3, kind: 'gold-hoard', personal: false, twist: false, level: 2, rarity: 'uncommon', ...over,
});

/** one saga played the way a player does — pursue its lead, man every quest, END — choosing the gold way at the finale */
async function goldFinale(seed: number, fx: LabFixture) {
  seedIdCounter(1);
  const ai = new RecordingMock(seed);
  const g = new Game(ai, seed);
  expect(g.labSaga(fx).ok).toBe(true);
  let button: { label: string; outcome: string } | undefined;
  const lines: string[] = [];
  for (let c = 0; c < 40; c++) {
    const chain = g.state.chains.find(ch => ch.lab?.fixture === fx.id);
    if (chain && (chain.state === 'done' || chain.state === 'slipped')) break;
    const q = chain && g.state.quests.find(x => x.state === 'open' && x.chainId === chain.id);
    if (!q) {
      const lead = chain
        ? g.state.leads.find(l => l.chainInfo.kind === 'continues' && l.chainInfo.chainId === chain.id)
        : g.state.leads.find(l => l.lab?.id === fx.id);
      if (lead) { await g.pursue(lead.id); continue }
      await g.endCycle();
      continue;
    }
    if (q.approaches && !q.chosenApproach) {
      const gold = q.approaches.find(a => a.rewardKind === 'gold')!;
      button = { label: gold.label, outcome: g.approachOutcome(q.id, gold.id) };
      g.chooseApproach(q.id, gold.id);
    }
    g.autoAssign(q.id);
    await g.endCycle();
    lines.push(...(g.reckoningAt()?.lines ?? []));
  }
  const chain = g.state.chains.find(ch => ch.lab?.fixture === fx.id)!;
  return { g, ai, chain, button: button!, lines };
}

afterEach(() => { delete process.env.AIRAIDER_FORCE_OUTCOMES });

describe('the game default: kit+pick + grafts, to a gold finale', () => {
  for (const fx of [fixture({}), fixture({ id: 'GD2', seed: 7, N: 4, kind: 'recruit', approach: 'gold' })]) it(`${fx.id} (N${fx.N}, ${fx.kind})`, async () => {
    process.env.AIRAIDER_FORCE_OUTCOMES = '1';
    const { g, ai, chain, button, lines } = await goldFinale(31, fx);
    const rec = chain.saga!, plan = rec.plan!, w = rec.world;
    expect(SEED_ARM).toBe('kit+pick');
    expect(w.pipe).toBe(PIPE_ARM);
    expect(w.kit!.arm).toBe('kit+pick');
    expect(chain.state).toBe('done');
    // the grafts pipeline: no outline call; the engine writes the buttons
    expect(ai.calls.some(c => c.template === 'outline')).toBe(false);
    expect(ai.calls.filter(c => c.template === 'report').length).toBeGreaterThanOrEqual(fx.N);
    const focal = plan.cast.find(p => p.focal)!;
    // the BUTTON keeps the money: the label and its fate fact, the same text both UIs print
    expect(button.label).toBe(cannedOption('gold', plan.cast, true));
    expect(button.label).toMatch(/\bpay\b/);
    expect(button.outcome).toBe(helped(focal) ? 'coin; goes their way' : WAY_ENDING.gold);
    // the payout is the engine's game line, as before
    expect(lines.some(l => l.startsWith('💰 The whole affair pays out: +'))).toBe(true);
    // every payload the writer saw: never the button's words, never the gold way's money
    for (const c of ai.calls) expect(JSON.stringify(c.payload), c.template).not.toContain(button.label);
    // the plan reads the gold way by the end the person meets, name and gloss: no reward word, no money
    const planCall = ai.calls.find(c => c.template === 'plan')!;
    const ending = planCall.payload.ending as { likely: string; ways: { way: string; means: string }[] };
    expect(ending.ways.map(x => x.way)).toContain(FREE_WAY);
    // a way's name is never a job type's name in the same payload (WAY_WORD's rule): "free" read as "break someone out"
    const types = new Set((planCall.payload.types as { type: string }[] | undefined ?? []).map(t => t.type));
    expect([ending.likely, ...ending.ways.map(x => x.way)].filter(x => types.has(x))).toEqual([]);
    expect(JSON.stringify(ending)).not.toMatch(/\bgold\b/);
    expect(JSON.stringify(ending)).not.toMatch(MONEY);
    const fin = ai.calls.filter(c => c.template === 'report').pop()!;
    expect(fin.flags).toContain('answer');
    expect(fin.payload.plan).toBe(toldOption({ way: 'gold', label: button.label }, plan.cast, true));
    expect(String(fin.payload.plan)).not.toMatch(MONEY);
    expect(String(fin.payload.result)).not.toMatch(MONEY);
    // the story: the fate sentence, the chronicle's ending line and So far, and the memory the saga leaves
    const view = g.chainViews().find(v => v.id === chain.id)!;
    expect(view.endLine).toBe(`ending: ${rec.ending}`);
    expect(rec.ending).toMatch(helped(focal) ? /goes (his|her) way\.$/ : /is cornered, then let go\.$/);
    for (const t of [rec.ending!, view.endLine, view.likely, ...view.soFar.map(flow.soFarLine), ...rec.lines.map(l => l.text)]) expect(t).not.toMatch(MONEY);
    if (w.kind === 'gold') expect(view.likely).toBe('they may go their way');
    const memory = g.state.lore.edges.find(e => e.from === chain.focalId && e.blurb.includes("the company's way"))!;
    expect(memory.blurb).toContain(String(fin.payload.plan));
    expect(memory.blurb).not.toMatch(MONEY);
  });
});

describe('the gold way, worded three ways', () => {
  it('the button pays; the writer and the story are told the person goes free — helped or not; R5 keeps its wording', async () => {
    process.env.AIRAIDER_FORCE_OUTCOMES = '1';
    const { chain } = await goldFinale(31, fixture({}));
    const cast = chain.saga!.plan!.cast;
    const f = cast.find(p => p.focal)!;
    expect(helped(f)).toBe(false);
    for (const focal of [f, { ...f, seat: 'other', part: 'travels with the company' } as CastEntry]) {
      // the cast keeps someone in the way (a focal who was the opponent leaves a stand-in)
      const c = [...cast.map(p => p.focal ? focal : p), ...(focal.seat !== f.seat && f.seat === 'opponent' ? [{ ...f, id: 'x-opp', focal: false }] : [])];
      const h = helped(focal);
      const button = cannedOption('gold', c, true);
      expect(button).toMatch(/\bpay\b/);
      const told = toldOption({ way: 'gold', label: button }, c, true), fate = fateSentence('gold', 'success', focal, undefined, true), means = wayMeans('gold', h, true);
      for (const t of [told, fate, means]) expect(t, `${h ? 'helped' : 'not helped'}: ${t}`).not.toMatch(MONEY);
      expect(fate).toBe(h ? `${focal.name} goes ${focal.sex === 'male' ? 'his' : 'her'} way.` : `${focal.name} is cornered, then let go.`);
      // every other way's deed is its button, word for word
      for (const way of ['recruit', 'captive'] as const) expect(toldOption({ way, label: cannedOption(way, c, true) }, c, true)).toBe(cannedOption(way, c, true));
      // R5's pipeline (no grafts) is the measured lab text, unchanged
      expect(toldOption({ way: 'gold', label: 'Take what he hoards' }, c, false)).toBe('Take what he hoards');
      expect(fateSentence('gold', 'success', focal)).toMatch(/treasure/);
      expect(wayMeans('gold', h)).toMatch(/treasure/);
    }
  });
});
