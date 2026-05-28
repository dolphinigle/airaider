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
