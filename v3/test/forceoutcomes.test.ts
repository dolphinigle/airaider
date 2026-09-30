// SAGA LAB (docs/STORYTELLER.md §5.0): AIRAIDER_FORCE_OUTCOMES and the `lab saga` pins.
//  1. unset, the hook is a NO-OP: a mock campaign — lab saga included — ends in the byte-identical
//     state it reaches with the hook replaced by the identity (and set, a game with no lab saga
//     is untouched too)
//  2. set, each §5.0 path plays its rule, and the dice heads always agree with the forced verdict
//  3. a fixture reproduces its spark, focal, N and kind whatever game it lands in
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { Game, type ReckonMeta } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { renderTags } from '../src/engine/tags.js';
import { PARTIAL_FRAC } from '../src/engine/roll.js';
import type { LabFixture } from '../src/engine/lab.js';

const fixture = (over: Partial<LabFixture>): LabFixture => ({
  id: 'T01', seed: 1, path: 'clean', spark: 'a border stone moved by night, a little each year',
  focal: { name: 'Rautio', sex: 'male', race: 'human', seed: 1104, value: 150 },
  N: 3, kind: 'captive', personal: false, twist: false, level: 2, rarity: 'uncommon', ...over,
});

const hash = (g: Game) => createHash('sha256').update(g.save()).digest('hex');

/** an ordinary mock campaign: board built, a lead taken whenever fewer than two quests are open,
 *  every quest manned (first approach on finales), END — with an optional lab saga riding along */
async function campaign(seed: number, fx?: LabFixture, cycles = 16): Promise<Game> {
  seedIdCounter(1);
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room'); g.build('lead-room');
  if (fx) expect(g.labSaga(fx).ok).toBe(true);
  for (let c = 0; c < cycles; c++) {
    for (const row of g.leadBoard()) {
      if (g.state.quests.filter(q => q.state === 'open').length >= 2) break;
      if (!row.blocked) await g.pursue(row.lead.id);
    }
    for (const q of g.state.quests.filter(x => x.state === 'open')) {
      if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
      g.autoAssign(q.id);
    }
    await g.endCycle();
  }
  return g;
}

/** play ONE lab saga to its end the way the driver does; returns its reckoning verdicts */
async function playLab(fx: LabFixture, seed = 5): Promise<{ g: Game; metas: ReckonMeta[] }> {
  seedIdCounter(1);
  const g = new Game(new MockProvider(seed), seed);
  expect(g.labSaga(fx).ok).toBe(true);
  const metas: ReckonMeta[] = [];
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
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    g.autoAssign(q.id);
    await g.endCycle();
    metas.push(...(g.reckoningAt()?.meta ?? []).filter(m => m.chainId === chain!.id));
  }
  return { g, metas };
}

afterEach(() => { delete process.env.AIRAIDER_FORCE_OUTCOMES; vi.restoreAllMocks() });

describe('AIRAIDER_FORCE_OUTCOMES', () => {
  it('unset: the hook is a no-op — same state as the identity, lab saga and all', async () => {
    delete process.env.AIRAIDER_FORCE_OUTCOMES;
    const fx = fixture({ path: 'bumpy' });
    const real = hash(await campaign(21, fx));
    const spy = vi.spyOn(Game.prototype as never, 'forceOutcome').mockImplementation(((_q: unknown, r: unknown) => r) as never);
    const identity = hash(await campaign(21, fx));
    expect(spy).toHaveBeenCalled();   // the hook sits on the path every quest takes
    expect(identity).toBe(real);
  });

  it('set, a game without a lab saga is untouched', async () => {
    delete process.env.AIRAIDER_FORCE_OUTCOMES;
    const plain = hash(await campaign(33));
    process.env.AIRAIDER_FORCE_OUTCOMES = '1';
    expect(hash(await campaign(33))).toBe(plain);
  });

  const cases: [LabFixture['path'], number, boolean, string][] = [
    ['clean', 2, false, 'SS'],
    ['bumpy', 3, false, 'SFPP'],
    ['failing', 3, false, 'FSFF'],
    ['lastchance', 2, false, 'FFS'],
    ['personal', 3, true, 'SPS'],
  ];
  for (const [path, N, personal, want] of cases) {
    it(`set: the ${path} path (N${N}) plays ${want}, and the heads agree with every verdict`, async () => {
      process.env.AIRAIDER_FORCE_OUTCOMES = '1';
      const { g, metas } = await playLab(fixture({ id: `P-${path}`, path, N, personal, kind: personal ? 'recruit' : 'captive' }));
      expect(metas.map(m => m.outcome[0]!.toUpperCase()).join('')).toBe(want);
      expect(metas[metas.length - 1]!.isFinale).toBe(true);
      const chain = g.state.chains.find(c => c.lab?.fixture === `P-${path}`)!;
      expect(chain.state).toBe(path === 'failing' ? 'slipped' : 'done');
      expect(chain.lab!.log.map(x => x.outcome[0]!.toUpperCase()).join('')).toBe(want);
      for (const m of metas) {
        expect(m.heads).toBeLessThanOrEqual(m.coins);
        if (m.outcome === 'success') expect(m.heads).toBeGreaterThanOrEqual(m.bar);
        if (m.outcome === 'partial') { expect(m.heads).toBeGreaterThanOrEqual(PARTIAL_FRAC * m.bar); expect(m.heads).toBeLessThan(m.bar) }
        if (m.outcome === 'failure') expect(m.heads).toBeLessThan(PARTIAL_FRAC * m.bar);
      }
      // the printed dice line says the same as the verdict
      const lines = g.reckonings().flatMap(r => r.lines).filter(l => l.startsWith('⚄ ['));
      for (const m of metas) expect(lines.some(l => l.startsWith(`⚄ [${m.outcome.toUpperCase()}] · rolled ${m.heads} heads of ${m.coins} coins`))).toBe(true);
    });
  }
});

describe('lab saga pins', () => {
  it('a fixture reproduces spark, focal, N and kind in any game', async () => {
    const seen: { spark: string; focal: string; tags: string; N: number; kind: string; beats: number }[] = [];
    for (const seed of [3, 4]) {
      const sparks: string[] = [];
      const orig = MockProvider.prototype.genesis;
      vi.spyOn(MockProvider.prototype, 'genesis').mockImplementation(async function (this: MockProvider, input) {
        sparks.push(input.seed);
        return orig.call(this, input);
      });
      seedIdCounter(1);
      const g = new Game(new MockProvider(seed), seed);
      const fx = fixture({ kind: 'gold-hoard', N: 4, twist: true });
      const lead = g.labSaga(fx).leadId!;
      await g.pursue(lead);
      const chain = g.state.chains[0]!;
      const focal = g.card(chain.focalId)!;
      seen.push({ spark: sparks[0]!, focal: focal.name, tags: renderTags(focal.tags), N: chain.expectedBeats, kind: chain.kind, beats: chain.failureBudget });
      vi.restoreAllMocks();
    }
    expect(seen[0]).toEqual(seen[1]);
    expect(seen[0]).toMatchObject({ spark: 'a border stone moved by night, a little each year', focal: 'Rautio', N: 4, kind: 'gold-hoard', beats: 2 });
  });

  it('a personal fixture makes its person one of the company, with the past it was given', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(8), 8);
    const fx = fixture({ path: 'personal', personal: true, kind: 'recruit', focal: { name: 'Hronolf', sex: 'male', race: 'wolfman', seed: 1106, backstory: 'He left the pack.', who: 'A wolfman.' } });
    await g.pursue(g.labSaga(fx).leadId!);
    const chain = g.state.chains[0]!;
    const focal = g.card(chain.focalId)!;
    expect(chain.isPersonal).toBe(true);
    expect(focal.character!.role).toBe('merc');
    expect(g.roster().map(m => m.id)).toContain(focal.id);
    expect(focal.character!.backstory).toBe('He left the pack.');
  });

  it('refuses a fixture the path rules cannot play', () => {
    const g = new Game(new MockProvider(1), 1);
    expect(g.labSaga(fixture({ path: 'bumpy', N: 2 })).ok).toBe(false);
    expect(g.labSaga(fixture({ path: 'clean', personal: true })).ok).toBe(false);
  });
});
