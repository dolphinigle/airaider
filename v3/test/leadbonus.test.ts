// ECONOMY §7.1–§7.3 — a lead's own worth is zero; the value rides on it as a carried bonus.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { leadBand, leadQuestWorth, expectedSlots, computeDelivery, oneOffValue, LEAD_BANDS, type Lead, type Quest } from '../src/engine/quests.js';
import { splitOneOff, vBase, RARITY_MULT } from '../src/engine/economy.js';
import { Rng } from '../src/engine/rng.js';

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'lead-t', rarity: 'common', level: 3, region: 'forests', archetype: 'investigate',
  chainInfo: { kind: 'none' }, expiresAtCycle: 20, source: 'reward', ...over,
});

describe('leadBand', () => {
  it('is nothing at all when the lead carries nothing', () => {
    expect(leadBand(lead()).band).toBe(0);
    expect(leadBand(lead({ bonus: 0 })).band).toBe(0);
  });

  it('bands on the RATIO, so the same gold reads differently by level', () => {
    // 200 on a common L3 investigate is a windfall; on a rare L5 raid it is pocket change
    const small = leadBand(lead({ bonus: 200 }));                                        // baseV ≈ 82
    const big = leadBand(lead({ bonus: 200, level: 5, rarity: 'rare', archetype: 'raid' })); // baseV ≈ 1225
    expect(small.band).toBe(4);                     // 2.44× — worth more than the job itself
    expect(big.band).toBe(1);                       // 0.16× — a few coins more
    expect(small.band).toBeGreaterThan(big.band);
  });

  it('puts each threshold on the right side of its boundary', () => {
    const baseV = vBase(3) * RARITY_MULT.common * expectedSlots('investigate', 'common');
    const at = (ratio: number) => leadBand(lead({ bonus: Math.round(baseV * ratio) })).band;
    expect(at(0.1)).toBe(1);
    expect(at(LEAD_BANDS[0]! - 0.05)).toBe(1);
    expect(at(LEAD_BANDS[0]! + 0.05)).toBe(2);
    expect(at(LEAD_BANDS[1]! + 0.05)).toBe(3);
    expect(at(LEAD_BANDS[2]! + 0.5)).toBe(4);
  });

  it('names and stars line up with the band', () => {
    for (const [ratio, label] of [[0.2, 'a few coins more'], [0.4, 'a purse'], [0.8, 'a chest'], [2, 'a fortune']] as const) {
      const baseV = vBase(3) * RARITY_MULT.common * expectedSlots('investigate', 'common');
      const b = leadBand(lead({ bonus: Math.round(baseV * ratio) }));
      expect(b.label).toBe(label);
      expect(b.stars).toBe('★'.repeat(b.band) + '☆'.repeat(4 - b.band));
    }
  });
});

describe('expectedSlots', () => {
  it('is the midpoint of the archetype range, +1 for rare, capped at 4', () => {
    expect(expectedSlots('contract', 'common')).toBe(1);      // [1,1]
    expect(expectedSlots('investigate', 'common')).toBe(1.5); // [1,2]
    expect(expectedSlots('raid', 'common')).toBe(2.5);        // [2,3]
    expect(expectedSlots('raid', 'rare')).toBe(3.5);
    expect(expectedSlots('contract', 'rare')).toBe(2);
  });

  it('tracks what slotCount actually rolls', async () => {
    const { slotCount } = await import('../src/engine/quests.js');
    const rng = new Rng(7);
    for (const a of ['raid', 'rescue', 'contract'] as const) {
      let sum = 0; const n = 4000;
      for (let i = 0; i < n; i++) sum += slotCount(rng, a, 'common');
      expect(Math.abs(sum / n - expectedSlots(a, 'common'))).toBeLessThan(0.1);
    }
  });
});

describe('the value actually moves', () => {
  it('delivery carries the reserved VALUE, not a bare count', () => {
    const rng = new Rng(11);
    const specs = splitOneOff(rng, 400, 'lead-hunt', 3);
    const q = { rewardSpecs: specs, rewardCards: [] } as unknown as Quest;
    const d = computeDelivery(rng, q, 'success');
    expect(Array.isArray(d.leadGrants)).toBe(true);
    expect(d.leadGrants.length).toBe(specs.filter(s => s.kind === 'lead').length);
    for (const g of d.leadGrants) expect(g).toBeGreaterThan(0);   // never zero — that was the bug
  });

  it('a failure grants no lead, and a partial grants none either', () => {
    const rng = new Rng(12);
    const q = { rewardSpecs: splitOneOff(rng, 400, 'lead-hunt', 3), rewardCards: [] } as unknown as Quest;
    expect(computeDelivery(rng, q, 'failure').leadGrants).toEqual([]);
    expect(computeDelivery(rng, q, 'partial').leadGrants).toEqual([]);
  });

  it('a carried bonus lands in the quest it opens — and changes NOTHING else', async () => {
    const g = new Game(new MockProvider(4242), 4242);
    g.build('map-room');
    await g.endCycle();
    const target = g.visibleLeads().find(l => l.chainInfo.kind === 'none');
    if (!target) return;
    const plain = { ...target, id: 'lead-plain' };
    const rich = { ...target, id: 'lead-rich', bonus: 500 };
    g.state.leads.push(plain as Lead, rich as Lead);
    const a = await g.pursue('lead-plain'); const b = await g.pursue('lead-rich');
    const qa = g.state.quests.find(q => q.id === a.questId)!;
    const qb = g.state.quests.find(q => q.id === b.questId)!;
    const worth = (q: typeof qa) => q.rewardSpecs.reduce((s, r) => s + r.value, 0);
    expect(worth(qb)).toBeGreaterThan(worth(qa));          // richer haul…
    expect(qb.level).toBe(qa.level);                        // …and nothing else moved
    expect(qb.rarity).toBe(qa.rarity);
    expect(qb.slots.length).toBe(qa.slots.length);
    // difficulty is deliberately NOT asserted: it is a fresh per-quest RNG draw that differs
    // between any two pursuits, bonus or no bonus. What matters is that `bonus` feeds only the
    // value line — level, rarity and slot count are all derived from the lead and must not move.
  });

  it('a bonus survives a save round-trip, and an old save reads as zero', () => {
    const g = new Game(new MockProvider(1), 1);
    g.state.leads.push(lead({ id: 'lead-rich', bonus: 250 }));
    g.state.leads.push(lead({ id: 'lead-old' }));           // no field at all
    const g2 = Game.load(new MockProvider(1), g.save());
    expect(g2.state.leads.find(l => l.id === 'lead-rich')!.bonus).toBe(250);
    expect(leadBand(g2.state.leads.find(l => l.id === 'lead-old')!).band).toBe(0);
  });
});

describe('the whole point', () => {
  it('every value the split reserves for a lead now reaches a lead', () => {
    const rng = new Rng(99);
    let reserved = 0, carried = 0;
    for (let i = 0; i < 3000; i++) {
      const level = 1 + Math.floor(rng.float(0, 6));
      const V = oneOffValue(rng, level, 'uncommon', 2);
      const specs = splitOneOff(rng, V, 'lead-hunt', level);
      reserved += specs.filter(s => s.kind === 'lead').reduce((s, r) => s + r.value, 0);
      const d = computeDelivery(rng, { rewardSpecs: specs, rewardCards: [] } as unknown as Quest, 'success');
      carried += d.leadGrants.reduce((s, v) => s + v, 0);
    }
    // was 0.000 before this design — the value was computed, deducted from the player's gold,
    // and thrown away (see ECONOMY §7.1 and the §21.2 note)
    expect(carried / reserved).toBeGreaterThan(0.99);
  });
});

describe('a chain lead is banded against the SAGA it opens', () => {
  const mk = (over: Partial<Lead>): Lead => ({
    id: 'l', rarity: 'uncommon', level: 3, region: 'forests', archetype: 'investigate',
    chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward', ...over,
  });

  it('prices a starts-new lead on the chain payoff, not the one-off value', () => {
    const oneOff = leadQuestWorth(mk({}));
    const saga = leadQuestWorth(mk({ chainInfo: { kind: 'starts-new' } }));
    expect(saga).toBeGreaterThan(oneOff * 2);   // a saga is worth multiples of a one-off
  });

  it('the same bonus reads LOWER on a chain lead, because the quest is bigger', () => {
    const bonus = 236;
    const plain = leadBand(mk({ bonus }));
    const chain = leadBand(mk({ bonus, chainInfo: { kind: 'starts-new' } }));
    expect(plain.band).toBe(4);                 // a fortune against a one-off
    expect(chain.band).toBeLessThan(plain.band);// …but not against a whole saga
  });

  it("never promises a fortune it cannot keep: 4★ means 'worth more than the quest it opens'", () => {
    // §7.2's landmark, checked on the surface that used to break it. Sweep the plausible bonus
    // range on chain leads at every rarity: a 4★ must imply the bonus really does exceed the saga.
    for (const rarity of ['common', 'uncommon', 'rare'] as const) {
      for (const level of [1, 3, 5, 7]) {
        const worth = leadQuestWorth(mk({ rarity, level, chainInfo: { kind: 'starts-new' } }));
        for (const ratio of [0.1, 0.3, 0.6, 0.9, 1.2]) {
          const lead = mk({ rarity, level, chainInfo: { kind: 'starts-new' }, bonus: Math.round(worth * ratio) });
          const b = leadBand(lead);
          if (b.band === 4) expect((lead.bonus ?? 0) / worth).toBeGreaterThan(1);
        }
      }
    }
  });
});
