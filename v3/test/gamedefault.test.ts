// The game's own saga (designer 2026-10-04, docs/STORYTELLER.md North Star 5): the kit+pick seed and the C2 'grafts'
// pipeline under the pipe arm the game's host deals by saga type (designer 2026-10-05, engine/saga.ts GAME_PIPE): a hired
// saga TC (voice), a soldier's own saga PP (past + change + the dossier line that seeds their next one). Played through the
// Game facade both UIs read, on the mock. Ruling 1 (the hired saga, to a gold finale): the gold way's money
// shows on its finale BUTTON only (the label and its fate fact) — never in a card, report, summary, fate sentence,
// chronicle line, the memory the saga leaves, or any payload the writer sees. The engine's 💰 payout line stays: a game
// line, not story text. Nothing about play changes: the gold way pays what it paid.
import { describe, it, expect, afterEach } from 'vitest';
import { Game } from '../src/game/game.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { PIPE_ARM, GAME_PIPE, SEED_ARM, WAY_ENDING, FREE_WAY, helped, wayMeans, type CastEntry } from '../src/engine/saga.js';
import type { Card } from '../src/engine/cards.js';
import type { Chain } from '../src/engine/chains.js';
import type { LabFixture } from '../src/engine/lab.js';
import { cannedOption, toldOption, fateSentence, clientOf, grownLine } from '../src/ai/storyteller.js';
import * as flow from '../src/game/sagaflow.js';
import { render } from '../cli/format.js';
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

describe('the game default, a hired saga: kit+pick + TC (voice), to a gold finale', () => {
  for (const fx of [fixture({}), fixture({ id: 'GD2', seed: 7, N: 4, kind: 'recruit', approach: 'gold' })]) it(`${fx.id} (N${fx.N}, ${fx.kind})`, async () => {
    process.env.AIRAIDER_FORCE_OUTCOMES = '1';
    const { g, ai, chain, button, lines } = await goldFinale(31, fx);
    const rec = chain.saga!, plan = rec.plan!, w = rec.world;
    expect(SEED_ARM).toBe('kit+pick');
    // the game's host deals by saga type; PIPE_ARM stays C2 for a host that names none (the lab's G0 / PG0)
    expect(GAME_PIPE).toEqual({ personal: 'past', other: 'voice' });
    expect(PIPE_ARM).toBe('grafts');
    expect(w.pipe).toBe(GAME_PIPE.other);
    expect(w.kit!.arm).toBe('kit+pick');
    expect(chain.state).toBe('done');
    // TC: card 1 is voiced — the asker's own line, as the plan wrote it, quoted in the prose the player reads (the
    // chronicle's card 1 in both UIs: the GUI's Sagas tab, the CLI's chain view); never PP's past on a hired saga
    const planFlags = ai.calls.find(c => c.template === 'plan')!.flags;
    expect(planFlags).toContain('voice');
    expect(planFlags).not.toContain('past');
    const c1 = ai.calls.find(c => c.template === 'card' && c.flags.includes('first'))!;
    expect(c1.flags).toContain('says');
    const says = clientOf(plan).says!;
    expect(says).toBeTruthy();
    expect((c1.payload.premise as { says: string }).says).toBe(says);
    const quoted = `"${says.replace(/[.!?]+$/, '')}`;
    expect(rec.card1).toContain(quoted);
    expect(g.chainViews().find(v => v.id === chain.id)!.card1).toContain(quoted);
    expect(render.chainDetail(g, chain.id)).toContain(quoted);
    // a hired saga leaves no dossier line
    expect(rec.grown).toBeUndefined();
    // the grafts pipeline: no outline call; the engine writes the buttons
    expect(ai.calls.some(c => c.template === 'outline')).toBe(false);
    expect(ai.calls.filter(c => c.template === 'report').length).toBeGreaterThanOrEqual(fx.N);
    const focal = plan.cast.find(p => p.focal)!;
    // the BUTTON keeps the money: the label and its fate fact, the same text both UIs print. It names the person by name once
    // the reports have (Knowing `met`), never by the label the player has stopped reading them by
    const metCast = plan.cast.map(p => rec.knowing.met.includes(p.id) ? { ...p, known: true } : p);
    expect(rec.knowing.met).toContain(focal.id);
    expect(button.label).toBe(cannedOption('gold', metCast, true));
    expect(button.label).toContain(focal.name);
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
    expect(fin.payload.plan).toBe(toldOption({ way: 'gold', label: button.label }, metCast, true));
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

/** a soldier's own saga as the game spawns one (the personal lead) — pursued, every quest manned by a strong company, to
 *  its end; the calls it made */
async function personalSaga(g: Game, ai: RecordingMock, merc: Card): Promise<{ chain: Chain; calls: RecordingMock['calls'] }> {
  const n0 = ai.calls.length, before = new Set(g.state.chains.map(c => c.id));
  (g as unknown as { spawnPersonalChainLead(m: Card): void }).spawnPersonalChainLead(merc);
  await g.pursue(g.state.leads.find(l => l.source === 'personal' && l.personalMercId === merc.id)!.id);
  const chain = g.state.chains.find(c => !before.has(c.id))!;
  expect(chain.isPersonal).toBe(true);
  for (let i = 0; i < 40 && chain.state !== 'done' && chain.state !== 'slipped'; i++) {
    const q = g.state.quests.find(x => x.state === 'open' && x.chainId === chain.id);
    if (!q) {
      const lead = g.state.leads.find(l => l.chainInfo.kind === 'continues' && l.chainInfo.chainId === chain.id);
      if (lead) await g.pursue(lead.id); else await g.endCycle();
      continue;
    }
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    for (const m of g.roster()) m.character!.attrs = { str: 30, dex: 30, int: 30, cha: 30, con: 30 };
    g.autoAssign(q.id);
    await g.endCycle();
  }
  return { chain, calls: ai.calls.slice(n0) };
}

describe('the game default, a soldier\'s own saga: PP (past + change), to the finale and into the next one', () => {
  it('card 1 tells the past, the finale shows the change, the dossier line is shown in both UIs and seeds the next personal saga', async () => {
    seedIdCounter(1);
    const ai = new RecordingMock(11);
    const g = new Game(ai, 11);
    g.build('map-room'); g.build('lead-room');
    const merc = g.roster()[0]!;
    // a soldier the company WON: the backstory written when it found them is the company's own history, never their past
    // (game.ts personalSeedBase, playtest 2026-09-25); their own saga is told from who they were
    const history = `The company found ${merc.name} pressed to the mill shutter after the raiders led them away.`;
    Object.assign(merc.character!, { origin: { title: 'Ash Road', situation: 'raiders at the mill', job: 'free the miller' }, who: "a miller's child from the fens", backstory: history });
    g.ensureLoreNode(merc);

    const first = await personalSaga(g, ai, merc);
    const rec = first.chain.saga!, plan = rec.plan!;
    expect(rec.world.pipe).toBe(GAME_PIPE.personal);
    const planCall = first.calls.find(c => c.template === 'plan')!;
    expect(planCall.flags).toContain('past');
    expect(planCall.flags).not.toContain('voice');
    const soldier = plan.cast.find(p => p.seat === 'soldier')!;
    expect(soldier.past).toBeTruthy();
    expect(soldier.change).toBeTruthy();
    // card 1 tells the past plainly; the finale report shows the change
    const c1 = first.calls.find(c => c.template === 'card' && c.flags.includes('first'))!;
    expect(c1.flags).toContain('past');
    expect((c1.payload.premise as { past: string }).past).toBe(soldier.past);
    expect(first.calls.filter(c => c.template === 'report').at(-1)!.payload.change).toBe(soldier.change);
    // the finale not lost: the engine's one dossier line, kept on the soldier
    expect(first.chain.state).toBe('done');
    const line = rec.grown!;
    expect(line).toBe(grownLine(plan));
    expect(line).toMatch(new RegExp(`^After ${plan.title}: `));
    const seed1 = String(planCall.payload.seed);
    expect(seed1).toBe(rec.world.seed.text);
    expect(seed1).not.toContain(history);
    // kept on the soldier: the seed it was told from, the past it told (what the change resolves), the line
    expect(merc.character!.grown).toEqual([{ seed: seed1, past: soldier.past, line }]);
    // shown: the sheet's memories (the GUI soldier sheet reads this dossier from the server) and the CLI's `merc`
    expect(g.dossier(merc.id, { player: true }).split('\n')).toContain(`- ${line} (defining memory)`);
    expect(render.merc(g, merc.id)).toContain(`- ${line}`);
    expect(g.dossier(merc.id, { player: true })).not.toContain('came through');

    // the next personal saga: on the same base the first was told from, the past it told, then that line — never the
    // company's history the full backstory holds
    const second = await personalSaga(g, ai, merc);
    const seed = String(second.calls.find(c => c.template === 'plan')!.payload.seed);
    expect(seed).toBe(`${seed1} ${soldier.past} ${line}`);
    expect(seed).not.toContain(history);
    expect(second.chain.saga!.world.pipe).toBe(GAME_PIPE.personal);
    // its own line is a new memory beside the first, never merged into it: both on the sheet, both seed the third
    expect(second.chain.state).toBe('done');
    const line2 = second.chain.saga!.grown!;
    expect(line2).not.toBe(line);
    const past2 = second.chain.saga!.plan!.cast.find(p => p.seat === 'soldier')!.past!;
    expect(merc.character!.grown!.map(x => x.line)).toEqual([line, line2]);
    for (const l of [line, line2]) expect(render.merc(g, merc.id)).toContain(`- ${l}`);
    expect((g as unknown as { personalSeed(m: Card): string }).personalSeed(merc)).toBe(`${seed} ${past2} ${line2}`);
  });
});
