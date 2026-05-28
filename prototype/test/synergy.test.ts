import { describe, it, expect } from 'vitest';
import { computePartySynergy, SYNERGY_CAP, type Assignment } from '../src/resolver.js';
import type { Merc, Tag } from '../src/types.js';

function tag(id: string): Tag {
  return { id, category: id.split(':')[0]!, rarity: 'common', tier: 5, label: id };
}

function merc(id: string, tagIds: string[]): Merc {
  return {
    id,
    name: id,
    attrs: { physical: 3, agility: 3, intelligence: 3, charisma: 3, willpower: 3 },
    tags: tagIds.map(tag),
    veterancy: 0,
    wage: 1,
    hp: 3,
  };
}

function asn(m: Merc): Assignment {
  return { slotId: `s-${m.id}`, merc: m };
}

describe('party-pair synergy (M1)', () => {
  it('no synergy when no pers:/temp: tags shared', () => {
    const a = merc('a', ['gender:male', 'bg:soldier', 'phys:muscular']);
    const b = merc('b', ['gender:male', 'bg:peasant', 'phys:quick']);
    const s = computePartySynergy([asn(a), asn(b)]);
    expect(s.bonusCoins).toBe(0);
    expect(s.pairs).toEqual([]);
  });

  it('shared temp:brave gives +1', () => {
    const a = merc('a', ['temp:brave']);
    const b = merc('b', ['temp:brave']);
    const s = computePartySynergy([asn(a), asn(b)]);
    expect(s.bonusCoins).toBe(1);
    expect(s.pairs).toHaveLength(1);
    expect(s.pairs[0]).toMatchObject({ sharedTagId: 'temp:brave' });
  });

  it('shared pers:stoic gives +1', () => {
    const a = merc('a', ['pers:stoic']);
    const b = merc('b', ['pers:stoic']);
    const s = computePartySynergy([asn(a), asn(b)]);
    expect(s.bonusCoins).toBe(1);
  });

  it('shared bg: or gender: tag does NOT trigger synergy', () => {
    const a = merc('a', ['bg:soldier', 'gender:male']);
    const b = merc('b', ['bg:soldier', 'gender:male']);
    const s = computePartySynergy([asn(a), asn(b)]);
    expect(s.bonusCoins).toBe(0);
  });

  it('three mercs all sharing temp:brave → 3 pairs → +3 (cap honored at 3)', () => {
    const a = merc('a', ['temp:brave']);
    const b = merc('b', ['temp:brave']);
    const c = merc('c', ['temp:brave']);
    const s = computePartySynergy([asn(a), asn(b), asn(c)]);
    expect(s.pairs).toHaveLength(3);
    expect(s.bonusCoins).toBe(3);
  });

  it('four mercs all sharing temp:brave → 6 pairs but bonus capped at SYNERGY_CAP', () => {
    const a = merc('a', ['temp:brave']);
    const b = merc('b', ['temp:brave']);
    const c = merc('c', ['temp:brave']);
    const d = merc('d', ['temp:brave']);
    const s = computePartySynergy([asn(a), asn(b), asn(c), asn(d)]);
    expect(s.pairs).toHaveLength(6);
    expect(s.bonusCoins).toBe(SYNERGY_CAP);
  });

  it('multiple shared synergy tags between same pair count separately', () => {
    const a = merc('a', ['temp:brave', 'pers:stoic']);
    const b = merc('b', ['temp:brave', 'pers:stoic']);
    const s = computePartySynergy([asn(a), asn(b)]);
    expect(s.pairs).toHaveLength(2);
    expect(s.bonusCoins).toBe(2);
  });
});
