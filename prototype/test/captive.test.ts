import { describe, it, expect } from 'vitest';
import { effectOf, CAPTIVE_ACTIONS, type Captive } from '../src/captive.js';
import { MockCaptiveLLM } from '../src/llm/captiveLLM.js';

const KAEL: Captive = {
  id: 'c1',
  name: 'Kael Vurst',
  archetype: 'deserter',
  backstory: 'caught hiding in a culvert',
  notoriety: 2,
  tags: [],
};

describe('captive cycle', () => {
  it('exposes exactly 5 actions in fixed order', () => {
    expect(CAPTIVE_ACTIONS).toEqual(['ransom', 'sell', 'display', 'recruit', 'execute']);
  });

  it('ransom returns positive gold scaled by notoriety', () => {
    const e1 = effectOf({ ...KAEL, notoriety: 1 }, 'ransom');
    const e5 = effectOf({ ...KAEL, notoriety: 5 }, 'ransom');
    expect(e1.goldDelta).toBeGreaterThan(0);
    expect(e5.goldDelta).toBeGreaterThan(e1.goldDelta);
    expect(e1.captiveRemoved).toBe(true);
  });

  it('sell yields gold but assigns ruthless reputation', () => {
    const e = effectOf(KAEL, 'sell');
    expect(e.goldDelta).toBeGreaterThan(0);
    expect(e.reputationGain).toBe('ruthless');
  });

  it('display + execute give no gold; display=feared, execute=just', () => {
    expect(effectOf(KAEL, 'display').goldDelta).toBe(0);
    expect(effectOf(KAEL, 'display').reputationGain).toBe('feared');
    expect(effectOf(KAEL, 'execute').goldDelta).toBe(0);
    expect(effectOf(KAEL, 'execute').reputationGain).toBe('just');
  });

  it('recruit produces a fresh merc with the captive name and 0 veterancy', () => {
    const e = effectOf(KAEL, 'recruit');
    expect(e.captiveRemoved).toBe(false);
    expect(e.recruitedAs).toBeDefined();
    expect(e.recruitedAs!.name).toBe('Kael Vurst');
    expect(e.recruitedAs!.veterancy).toBe(0);
    expect(e.recruitedAs!.wage).toBe(1);
  });

  it('mock LLM produces distinct narration per action', async () => {
    const llm = new MockCaptiveLLM();
    const outs = await Promise.all(
      CAPTIVE_ACTIONS.map((a) =>
        llm.narrate({
          captive: KAEL, action: a, effect: effectOf(KAEL, a),
          fortName: 'Crow', partyNames: ['Marek'],
        }),
      ),
    );
    const lines = outs.map((o) => o.outcomeNarrative);
    expect(new Set(lines).size).toBe(5);
    for (const o of outs) {
      expect(o.outcomeNarrative.length).toBeGreaterThan(0);
      expect(o.captiveLine.length).toBeGreaterThan(0);
    }
  });

  it('mock LLM is deterministic', async () => {
    const llm = new MockCaptiveLLM();
    const req = {
      captive: KAEL, action: 'ransom' as const, effect: effectOf(KAEL, 'ransom'),
      fortName: 'Crow', partyNames: ['Marek'],
    };
    const a = await llm.narrate(req);
    const b = await llm.narrate(req);
    expect(a).toEqual(b);
  });
});

describe('M7.3 recruit gated by fort level', () => {
  it('blocks recruit when fortLevel < 2', () => {
    const e = effectOf(KAEL, 'recruit', { fortLevel: 1 });
    expect(e.blocked).toBeDefined();
    expect(e.recruitedAs).toBeUndefined();
    expect(e.captiveRemoved).toBe(false);
  });

  it('allows recruit when fortLevel >= 2', () => {
    const e = effectOf(KAEL, 'recruit', { fortLevel: 2 });
    expect(e.blocked).toBeUndefined();
    expect(e.recruitedAs).toBeDefined();
  });

  it('does not affect other dispositions when fortLevel is low', () => {
    expect(effectOf(KAEL, 'ransom', { fortLevel: 1 }).blocked).toBeUndefined();
    expect(effectOf(KAEL, 'execute', { fortLevel: 1 }).blocked).toBeUndefined();
  });

  it('keeps prior recruit behavior when no fortLevel is provided', () => {
    const e = effectOf(KAEL, 'recruit');
    expect(e.blocked).toBeUndefined();
    expect(e.recruitedAs).toBeDefined();
  });
});

describe('M11.2 captive recruit lands on tavern bench', () => {
  it('successful recruit returns a benchPrice paired with recruitedAs', () => {
    const e = effectOf(KAEL, 'recruit');
    expect(e.recruitedAs).toBeDefined();
    expect(e.benchPrice).toBeDefined();
    expect(e.benchPrice).toBeGreaterThan(0);
  });

  it('benchPrice scales with notoriety but stays at a discount vs base price', () => {
    const low = { ...KAEL, notoriety: 1 };
    const high = { ...KAEL, notoriety: 5 };
    const lo = effectOf(low, 'recruit').benchPrice!;
    const hi = effectOf(high, 'recruit').benchPrice!;
    expect(lo).toBeLessThan(hi);
    // HIRE_BASE_PRICE is 5 — low-notoriety captives undercut it.
    expect(lo).toBeLessThan(5);
  });

  it('blocked recruit (fort too low) carries no benchPrice', () => {
    const e = effectOf(KAEL, 'recruit', { fortLevel: 1 });
    expect(e.blocked).toBeDefined();
    expect(e.benchPrice).toBeUndefined();
  });
});

describe('M11.6 recruit carries bg:former-captive tag', () => {
  const FORMER_TAG = {
    id: 'bg:former-captive', category: 'background', rarity: 'uncommon' as const,
    tier: 3 as const, label: 'Former Captive',
  };

  it('appends the supplied formerCaptiveTag to the recruited merc', () => {
    const e = effectOf(KAEL, 'recruit', { formerCaptiveTag: FORMER_TAG });
    expect(e.recruitedAs).toBeDefined();
    expect(e.recruitedAs!.tags.some((t) => t.id === 'bg:former-captive')).toBe(true);
  });

  it('does not append when the tag is not supplied (backward-compat)', () => {
    const e = effectOf(KAEL, 'recruit');
    expect(e.recruitedAs!.tags.some((t) => t.id === 'bg:former-captive')).toBe(false);
  });

  it('does not duplicate the tag if the captive already carries it', () => {
    const captive: Captive = { ...KAEL, tags: [FORMER_TAG] };
    const e = effectOf(captive, 'recruit', { formerCaptiveTag: FORMER_TAG });
    const count = e.recruitedAs!.tags.filter((t) => t.id === 'bg:former-captive').length;
    expect(count).toBe(1);
  });

  it('preserves the captive\'s pre-existing tags alongside former-captive', () => {
    const soldier = {
      id: 'bg:soldier', category: 'background', rarity: 'common' as const,
      tier: 5 as const, label: 'Soldier',
    };
    const captive: Captive = { ...KAEL, tags: [soldier] };
    const e = effectOf(captive, 'recruit', { formerCaptiveTag: FORMER_TAG });
    const ids = e.recruitedAs!.tags.map((t) => t.id);
    expect(ids).toContain('bg:soldier');
    expect(ids).toContain('bg:former-captive');
  });
});

describe('captive adjacency context (PROTO-GAME v14)', () => {
  const KAEL2: Captive = {
    id: 'k', name: 'Kael', archetype: 'deserter', backstory: '', notoriety: 3, tags: [],
  };

  it('chapel-adjacent recruit posts at 0g bench price', () => {
    const e = effectOf(KAEL2, 'recruit', {
      fortLevel: 1,
      chapelAdjacent: true,
      formerCaptiveTag: { id: 'bg:former-captive', category: 'background', rarity: 'common', tier: 5, label: 'Former Captive' },
    });
    expect(e.blocked).toBeUndefined();
    expect(e.benchPrice).toBe(0);
  });

  it('chapel-adjacent recruit bypasses fort-level gate', () => {
    const e = effectOf(KAEL2, 'recruit', {
      fortLevel: 1,
      chapelAdjacent: true,
      formerCaptiveTag: { id: 'bg:former-captive', category: 'background', rarity: 'common', tier: 5, label: 'Former Captive' },
    });
    expect(e.blocked).toBeUndefined();
    expect(e.recruitedAs).toBeDefined();
  });

  it('non-chapel recruit at low fort level still blocks', () => {
    const e = effectOf(KAEL2, 'recruit', { fortLevel: 1 });
    expect(e.blocked).toBeDefined();
  });

  it('smithy-adjacent ransom gains +5g', () => {
    const base = effectOf(KAEL2, 'ransom', {});
    const adj = effectOf(KAEL2, 'ransom', { smithyAdjacent: true });
    expect(adj.goldDelta).toBe(base.goldDelta + 5);
  });
});
