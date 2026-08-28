// RECURRING_CAST §3 — the two ruled mechanisms, and the two guards that silently undid them.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { guardEdges, edgeCount, newGraph } from '../src/engine/lore.js';
import type { Lead } from '../src/engine/quests.js';

const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];

/** a game whose world already holds six known faces; Alpha has three ties, the rest one */
function worldWithCast(seed: number) {
  const g = new Game(new MockProvider(seed), seed);
  g.build('map-room'); g.build('dungeon');
  NAMES.forEach((n, i) => {
    const id = `lore-x${i}`;
    g.state.lore.nodes[id] = { id, kind: 'character', name: n, blurb: `${n}, a known face.`,
      identity: 'known', active: true, createdCycle: 0 };
  });
  const TYPES = ['party-to', 'rival-of', 'owes'] as const;
  for (let t = 0; t < 3; t++)
    guardEdges(g.state.lore, [{ from: 'lore-x0', to: `lore-x${t + 1}`, type: TYPES[t],
      blurb: 'a past matter', importance: 0.5 }], 1, () => `ea${t}`);
  return g;
}
const sagaLead = (): Lead => ({ id: 'RL', rarity: 'uncommon', level: 3, region: 'forests',
  archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward' });

describe('a returning face actually returns', () => {
  it('reuses a known face at roughly N/(θ+N), not never', async () => {
    let reused = 0, total = 0;
    for (let s = 0; s < 30; s++) {
      const g = worldWithCast(s);
      g.state.leads.push(sagaLead());
      const r = await g.pursue('RL');
      if (!r.ok) continue;
      total++;
      const focal = g.card(g.state.chains[g.state.chains.length - 1]!.focalId);
      if (focal && NAMES.includes(focal.name)) reused++;
    }
    // pool 6, θ=4 → 60% expected. The bar is "the mechanism runs at all": both name guards used
    // to rename a promoted focal into a stranger, and this measured 0/30.
    expect(total).toBeGreaterThan(20);
    expect(reused / total).toBeGreaterThan(0.3);
    expect(reused / total).toBeLessThan(0.85);
  });

  it('KEEPS the returning face\'s name — the twin-name guards must not reroll them', async () => {
    // the whole defect in one assertion: a face the world knows is IN the lorebook, which is
    // exactly what nameTooSimilar() reads as a collision.
    let checked = 0;
    for (let s = 0; s < 30 && checked < 3; s++) {
      const g = worldWithCast(s);
      g.state.leads.push(sagaLead());
      const r = await g.pursue('RL');
      if (!r.ok) continue;
      const chain = g.state.chains[g.state.chains.length - 1]!;
      const focal = g.card(chain.focalId)!;
      const node = g.state.lore.nodes[chain.focalId];
      if (!NAMES.includes(focal.name)) continue;
      checked++;
      // the lore node was remapped onto the card id — the two must agree on who this is
      expect(node?.name).toBe(focal.name);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('weights reuse by how many matters a face is already part of', async () => {
    const picks: Record<string, number> = {};
    for (let s = 0; s < 60; s++) {
      const g = worldWithCast(s);
      g.state.leads.push(sagaLead());
      const r = await g.pursue('RL');
      if (!r.ok) continue;
      const focal = g.card(g.state.chains[g.state.chains.length - 1]!.focalId);
      if (focal && NAMES.includes(focal.name)) picks[focal.name] = (picks[focal.name] ?? 0) + 1;
    }
    // Alpha carries three ties against everyone else's one, so it should lead. Asserted as
    // "leads", not "3x": at these counts the ratio is noisy, the ordering is not.
    const top = Object.entries(picks).sort((a, b) => b[1] - a[1])[0];
    expect(top?.[0]).toBe('Alpha');
  });
});

describe('edgeCount', () => {
  it('counts distinct active ties, floored at 1 so a one-appearance face stays reachable', () => {
    const g = newGraph();
    for (const id of ['a', 'b', 'c']) g.nodes[id] = { id, kind: 'character', name: id, blurb: '', identity: '', active: true, createdCycle: 0 };
    expect(edgeCount(g, 'a', 1)).toBe(1);                       // no ties → still pickable
    guardEdges(g, [{ from: 'a', to: 'b', type: 'party-to', blurb: 'x', importance: 0.5 }], 1, () => 'e1');
    guardEdges(g, [{ from: 'a', to: 'c', type: 'rival-of', blurb: 'x', importance: 0.5 }], 1, () => 'e2');
    expect(edgeCount(g, 'a', 1)).toBe(2);
    // a REPEAT of the same memory is refreshed, never stacked (guardEdges dedup) — so it must
    // not inflate the weight
    guardEdges(g, [{ from: 'a', to: 'b', type: 'party-to', blurb: 'x', importance: 0.5 }], 2, () => 'e3');
    expect(edgeCount(g, 'a', 2)).toBe(2);
  });
});
