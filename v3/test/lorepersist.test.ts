// LORE §1 story-NPC write-back: coined cast the player MET persist at saga close (cap 2,
// client > obstacle > ally, edge-anchored to the focal); unmet / existing / colliding don't.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

function fakeChain(over: Record<string, unknown> = {}) {
  return {
    id: 'chain-t', focalId: 'cX', state: 'done',
    bible: {
      title: 'The Test Matter',
      cast: [
        { name: 'Aldo', who: 'A miller of the ford who owes half his season.', want: 'x', role: 'client' },
        { name: 'Bren', who: 'A warden who guards the pass gate.', want: 'y', role: 'obstacle' },
        { name: 'Cira', who: 'A guide of the high paths.', want: 'z', role: 'ally' },
        { name: 'Dun', who: 'Never met on any card.', want: 'w', role: 'ally' },
      ],
    },
    story: { introducedNames: ['Aldo', 'Bren', 'Cira'] },
    ...over,
  };
}

function gameWithFocalNode(seed: number) {
  const g = new Game(new MockProvider(seed), seed) as unknown as {
    persistMetCast(c: unknown): void;
    state: { lore: { nodes: Record<string, unknown>; edges: { to: string; type: string; blurb: string; salience: number; core: boolean }[] } };
  };
  g.state.lore.nodes['cX'] = { id: 'cX', kind: 'character', name: 'Focal', blurb: 'f', identity: 'f', active: true, createdCycle: 0 };
  return g;
}

describe('met-cast persistence (LORE §1 story NPCs)', () => {
  it('persists met coined cast at cap 2 with role-typed edges to the focal', () => {
    const g = gameWithFocalNode(1);
    g.persistMetCast(fakeChain());
    const names = Object.values(g.state.lore.nodes).map(n => (n as { name: string }).name);
    expect(names).toContain('Aldo');
    expect(names).toContain('Bren');
    expect(names).not.toContain('Cira');   // cap 2: client + obstacle outrank ally
    expect(names).not.toContain('Dun');    // never met
    const edges = g.state.lore.edges.filter(e => e.to === 'cX');
    expect(edges).toHaveLength(2);
    const bren = edges.find(e => e.blurb.includes('against'))!;
    expect(bren.type).toBe('rival-of');
    expect(edges.every(e => e.salience <= 0.6 && !e.core)).toBe(true);   // decays, never pinned
  });

  it('skips loreId-carrying cast and names already in the graph (even inactive)', () => {
    const g = gameWithFocalNode(2);
    g.state.lore.nodes['old'] = { id: 'old', kind: 'character', name: 'Aldo', blurb: 'o', identity: 'o', active: false, createdCycle: 0 };
    const before = new Set(Object.keys(g.state.lore.nodes));
    const ch = fakeChain();
    (ch.bible.cast[1] as { loreId?: string }).loreId = 'someone';   // Bren = existing person, not coined
    g.persistMetCast(ch);
    const added = Object.entries(g.state.lore.nodes)
      .filter(([id]) => !before.has(id))
      .map(([, n]) => (n as { name: string }).name);
    expect(added).toEqual(['Cira']);   // Aldo name-collides (inactive tombstone), Bren existing, Dun unmet
  });

  it('is idempotent — a second call adds nothing', () => {
    const g = gameWithFocalNode(3);
    g.persistMetCast(fakeChain());
    const count = Object.keys(g.state.lore.nodes).length;
    g.persistMetCast(fakeChain());
    expect(Object.keys(g.state.lore.nodes)).toHaveLength(count);
  });
});
