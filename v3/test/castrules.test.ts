// The cast rules (docs/STORYTELLER.md §2.4.2, build plan D9): who may come back into a saga's client seat — the lore
// slate's location fences, the two-saga cooldown, a client-type edge, a memory the player read — how often (P(new) =
// θ/(θ+N), reuse weighted by edges), at most one returning face a saga; and the theme dealer's no-repeat window.
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/engine/rng.js';
import { THEME_NO_REPEAT } from '../src/engine/themes.js';
import { castableClients, pickClientFace, recentFaces, dealSaga, FACE_COOLDOWN, type FaceCandidate, type SagaRecord } from '../src/engine/saga.js';

const face = (id: string, o: Partial<FaceCandidate> = {}): FaceCandidate =>
  ({ id, name: `Name ${id}`, sex: 'female', race: 'human', memory: 'The company saved her mill.', where: 'at the mill', edgeType: 'saved-by', edges: 1, ...o });

describe('castableClients — the fences', () => {
  it('keeps nobody on the roster, staged, in the cells, at the fort or out of reach', () => {
    const cands = [face('a'), face('b', { companySoldier: true }), face('c', { companyCaptive: true }), face('d', { atTheFort: true }), face('e', { outOfReach: true }), face('f', { staged: true })];
    expect(castableClients(cands, []).map(c => c.id)).toEqual(['a']);
  });
  it('rests a face used in the last two sagas', () => {
    expect(castableClients([face('a'), face('b')], ['a']).map(c => c.id)).toEqual(['b']);
  });
  it('only a client-type edge to the company seats a face as the client; a face with no memory the player read is a stranger', () => {
    const cands = [face('a', { edgeType: 'party-to' }), face('b', { edgeType: 'owes' }), face('c', { edgeType: 'rival-of' }), face('d', { edgeType: 'captive-of' }), face('e', { memory: '  ' })];
    expect(castableClients(cands, []).map(c => c.id)).toEqual(['a', 'b']);
  });
});

describe('recentFaces — the cooldown window', () => {
  const rec = (ids: string[]) => ({ saga: { world: { cast: ids.map(id => ({ id, memory: 'm', focal: false })) } } as unknown as SagaRecord });
  it(`the faces seated in the last ${FACE_COOLDOWN} sagas (not the focal, not a coined stranger)`, () => {
    const chains = [rec(['x']), {}, rec(['y']), rec(['z'])];
    expect(recentFaces(chains)).toEqual(['y', 'z']);
  });
});

describe('pickClientFace — P(new) = θ/(θ+N), reuse weighted by edges', () => {
  it('nothing eligible: a stranger', () => expect(pickClientFace(new Rng(1), [], 4)).toBeUndefined());
  it('θ = 0: always a returning face; the rate of strangers falls as the cast grows', () => {
    expect(pickClientFace(new Rng(1), [face('a')], 0)?.id).toBe('a');
    const rate = (n: number) => {
      const cands = Array.from({ length: n }, (_, i) => face(`f${i}`));
      let fresh = 0;
      for (let s = 0; s < 400; s++) if (!pickClientFace(new Rng(s), cands, 4)) fresh++;
      return fresh / 400;
    };
    const r1 = rate(1), r8 = rate(8);
    expect(r1).toBeGreaterThan(0.65);   // 4/5
    expect(r8).toBeLessThan(0.45);      // 4/12
  });
  it('a face already in more matters comes back more often', () => {
    const cands = [face('light', { edges: 1 }), face('heavy', { edges: 9 })];
    let heavy = 0, light = 0;
    for (let s = 0; s < 400; s++) { const f = pickClientFace(new Rng(s), cands, 0); if (f?.id === 'heavy') heavy++; else if (f) light++ }
    expect(heavy).toBeGreaterThan(light * 3);
  });
});

describe('the theme dealer', () => {
  it(`never repeats a theme within ${THEME_NO_REPEAT} deals (and the window it keeps never grows past that)`, () => {
    const rng = new Rng(99), recent: string[] = [], dealt: string[] = [];
    for (let i = 0; i < 300; i++) {
      const d = dealSaga(rng, recent, { personal: false });
      dealt.push(d.seed.id!);
      expect(recent.length).toBeLessThanOrEqual(THEME_NO_REPEAT);
    }
    for (let i = 0; i < dealt.length; i++) expect(dealt.slice(Math.max(0, i - THEME_NO_REPEAT + 1), i)).not.toContain(dealt[i]);
  });
});
