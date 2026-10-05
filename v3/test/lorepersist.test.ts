// LORE §1 story-NPC write-back at saga close (STORYTELLER §2.6): at most two MET people who are not the focal persist
// (the one who asked > the one in the way > anyone else). A coined person becomes a lore node (blurb = label, the deal's
// sex and race); a returning face already is one. Each gets an edge to the focal by seat and one to the soldier whose
// deed decided a job they were in. Unmet, colliding or already-known names add no node.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { CastEntry } from '../src/engine/saga.js';

const person = (id: string, name: string, seat: CastEntry['seat'], label: string, o: Partial<CastEntry> = {}): CastEntry =>
  ({ id, name, sex: 'male', race: 'human', seat, focal: false, part: 'x', known: seat === 'client', label, want: '', ...o });

function fakeChain(soldier: string, o: { met?: string[]; returning?: boolean } = {}) {
  const cast = [
    person('p1', 'Aldo', 'client', 'a miller of the ford', { want: 'his mill back' }),
    person('cX', 'Focal', 'opponent', 'a warden', { focal: true }),
    person(o.returning ? 'lore-old' : 'p2', 'Bren', 'other', 'a guide of the high paths', o.returning ? { memory: 'Bren once hid the company.', where: 'in the hills' } : {}),
    person('p3', 'Cira', 'other', 'a hermit'),
    person('p4', 'Dun', 'other', 'a ferryman'),
  ];
  const ep = (n: number, people: string[]) => ({ n, type: 'find' as const, title: `Job ${n}`, job: 'j', people, trouble: { who: 'w', carry: 'c', will: 'v' }, why: '' });
  return {
    id: 'chain-t', focalId: 'cX', state: 'done', isPersonal: false,
    saga: {
      v: 4, world: { N: 3, cast }, fallback: false,
      knowing: { met: o.met ?? ['p1', 'cX', o.returning ? 'lore-old' : 'p2', 'p3'], named: [], seen: [] },
      plan: { title: 'The Test Matter', question: 'q', answer: 'a', cast, episodes: [ep(1, ['p1']), ep(2, ['p3'])], showdown: ep(3, ['cX', o.returning ? 'lore-old' : 'p2']), options: [] },
      lines: [
        { n: 1, attempt: 1, outcome: 'success', party: [soldier], text: `${soldier} dragged Aldo out of the river.`, hurt: [], decides: soldier },
        { n: 2, attempt: 2, outcome: 'failure', party: [soldier], text: 'The hermit would not come down.', hurt: [] },
        { n: 3, attempt: 3, outcome: 'success', party: [soldier], text: 'The guide led the company round the warden.', hurt: [], decides: soldier },
      ],
    },
  };
}

function game(seed: number) {
  const g = new Game(new MockProvider(seed), seed);
  g.state.lore.nodes['cX'] = { id: 'cX', kind: 'character', name: 'Focal', blurb: 'f', identity: 'f', active: true, createdCycle: 0 };
  const soldier = g.roster()[0]!;
  return { g, soldier, persist: (c: unknown) => (g as unknown as { persistMetCast(c: unknown): void }).persistMetCast(c) };
}
const nodeNamed = (g: Game, name: string) => Object.values(g.state.lore.nodes).find(n => n.name === name);

describe('met-cast persistence (LORE §1 story NPCs)', () => {
  it('keeps two met people by seat, with edges to the focal and to the soldier whose deed decided their job', () => {
    const { g, soldier, persist } = game(1);
    persist(fakeChain(soldier.name));
    const aldo = nodeNamed(g, 'Aldo')!, bren = nodeNamed(g, 'Bren')!;
    expect(aldo).toMatchObject({ blurb: 'A miller of the ford', sex: 'male', race: 'human' });
    expect(bren).toBeDefined();
    expect(nodeNamed(g, 'Cira')).toBeUndefined();   // cap 2: the client and the first other outrank her
    expect(nodeNamed(g, 'Dun')).toBeUndefined();    // never met
    const edges = (id: string) => g.state.lore.edges.filter(e => e.from === id);
    expect(edges(aldo.id).map(e => [e.to, e.type])).toEqual([['cX', 'party-to'], [soldier.id, 'saved-by']]);
    expect(edges(aldo.id).every(e => e.blurb === `${soldier.name} dragged Aldo out of the river.`)).toBe(true);
    expect(edges(bren.id).find(e => e.to === 'cX')!.blurb).toBe('The guide led the company round the warden.');
    expect(g.state.lore.edges.every(e => e.salience <= 0.6 && !e.core)).toBe(true);   // decays, never pinned
  });

  it("a soldier's own saga (the soldier whose deed it was is the focal): a line shows once on their sheet, never under both ties", () => {
    const { g, soldier, persist } = game(1);
    g.ensureLoreNode(soldier);
    const c = fakeChain(soldier.name);
    Object.assign(c, { focalId: soldier.id, isPersonal: true });
    persist(c);
    const aldo = nodeNamed(g, 'Aldo')!, bren = nodeNamed(g, 'Bren')!;
    const tie = (id: string) => g.state.lore.edges.filter(e => e.from === id && e.to === soldier.id);
    // their one line was the deed: one memory, the deed's
    expect(tie(aldo.id).map(e => [e.type, e.blurb])).toEqual([['saved-by', `${soldier.name} dragged Aldo out of the river.`]]);
    expect(tie(bren.id).map(e => [e.type, e.blurb])).toEqual([['saved-by', 'The guide led the company round the warden.']]);
    const sheet = g.dossier(soldier.id, { player: true }).split('\n');
    expect(sheet.filter(l => l.includes('dragged Aldo out of the river'))).toHaveLength(1);
  });

  it('a returning face is not minted again; a name the world already holds (even inactive) is never re-dealt', () => {
    const { g, soldier, persist } = game(2);
    g.state.lore.nodes['lore-old'] = { id: 'lore-old', kind: 'character', name: 'Bren', blurb: 'b', identity: 'b', active: true, createdCycle: 0 };
    g.state.lore.nodes['tomb'] = { id: 'tomb', kind: 'character', name: 'Aldo', blurb: 'o', identity: 'o', active: false, createdCycle: 0 };
    const before = new Set(Object.keys(g.state.lore.nodes));
    persist(fakeChain(soldier.name, { returning: true }));
    expect(Object.keys(g.state.lore.nodes).filter(id => !before.has(id))).toEqual([]);
    expect(g.state.lore.edges.some(e => e.from === 'lore-old' && e.to === 'cX')).toBe(true);
  });

  it('is idempotent — a second call adds nothing', () => {
    const { g, soldier, persist } = game(3);
    persist(fakeChain(soldier.name));
    const nodes = Object.keys(g.state.lore.nodes).length, edges = g.state.lore.edges.length;
    persist(fakeChain(soldier.name));
    expect(Object.keys(g.state.lore.nodes)).toHaveLength(nodes);
    expect(g.state.lore.edges).toHaveLength(edges);
  });
});
