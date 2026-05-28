import { describe, it, expect } from 'vitest';
import { resolveScenario, type Assignment } from '../src/resolver.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import type { FixtureScenario, ScenarioApproach } from '../src/scenarios.js';
import type { Merc } from '../src/types.js';

const mockMerc = (id: string, tags: string[] = [], physical = 3): Merc => ({
  id,
  name: id[0]!.toUpperCase() + id.slice(1),
  attrs: { physical, agility: 3, intelligence: 3, charisma: 3, willpower: 3 },
  tags: tags.map((t) => ({ id: t, label: t, tier: 'common', rarity: 'common' as const })),
  veterancy: 0,
  wage: 1,
  hp: 3,
});

const baseScenario = (approaches: ScenarioApproach[], defaultApproachId?: string): FixtureScenario => ({
  id: 'approach-test',
  archetype: 'contract',
  title: 'Approach Test',
  target: 'test the approach mechanism',
  slots: [
    { id: 'edge', description: 'fight', preferredAttr: 'physical' },
    { id: 'tongue', description: 'talk', preferredAttr: 'charisma' },
  ],
  partySize: { min: 2, max: 2 },
  coinBudget: 7,
  approaches,
  defaultApproachId,
});

describe('M5.3 approaches', () => {
  const llm = new MockScenarioLLM();
  const rng = () => 0.5;
  const fighter = mockMerc('fighter', ['phys:quick'], 5);
  const talker = mockMerc('talker', ['pers:charming'], 2);
  const assignments: Assignment[] = [
    { slotId: 'edge', merc: fighter },
    { slotId: 'tongue', merc: talker },
  ];

  it('picks defaultApproachId when --approach not supplied', async () => {
    const scen = baseScenario(
      [
        { id: 'a', label: 'A', summary: 'a' },
        { id: 'b', label: 'B', summary: 'b' },
      ],
      'b',
    );
    const r = await resolveScenario({ scenario: scen, assignments, llm, rng });
    expect(r.approachId).toBe('b');
    expect(r.approachLabel).toBe('B');
  });

  it('uses explicit approachId when provided', async () => {
    const scen = baseScenario(
      [
        { id: 'a', label: 'A', summary: 'a' },
        { id: 'b', label: 'B', summary: 'b' },
      ],
      'a',
    );
    const r = await resolveScenario({ scenario: scen, assignments, llm, rng, approachId: 'b' });
    expect(r.approachId).toBe('b');
  });

  it('throws on unknown approach id', async () => {
    const scen = baseScenario([{ id: 'a', label: 'A', summary: 'a' }]);
    await expect(
      resolveScenario({ scenario: scen, assignments, llm, rng, approachId: 'nope' }),
    ).rejects.toThrow(/Unknown approach/);
  });

  it('slotModifiers.coinDelta shifts slot coin contributions', async () => {
    const baseScen = baseScenario([{ id: 'noop', label: 'Noop', summary: 's' }], 'noop');
    const baseR = await resolveScenario({ scenario: baseScen, assignments, llm, rng });
    const edgeBase = baseR.slotContributions.find((s) => s.slotId === 'edge')!.coinsContributed;

    const buffScen = baseScenario(
      [{ id: 'buff', label: 'Buff', summary: 's', slotModifiers: { edge: { coinDelta: 2 } } }],
      'buff',
    );
    const buffR = await resolveScenario({ scenario: buffScen, assignments, llm, rng });
    const edgeBuff = buffR.slotContributions.find((s) => s.slotId === 'edge')!.coinsContributed;
    expect(edgeBuff).toBe(edgeBase + 2);
  });

  it('requireTag penalty applies when merc lacks the required tag', async () => {
    // Combine a +2 coinDelta with requireTag so we observe the -1 penalty above the floor.
    const scen = baseScenario(
      [
        {
          id: 'gate', label: 'Gate', summary: 's',
          slotModifiers: { tongue: { coinDelta: 2, requireTag: 'phys:quick' } },
        },
      ],
      'gate',
    );
    // talker lacks phys:quick → penalty applies
    const r = await resolveScenario({ scenario: scen, assignments, llm, rng });
    const tongueCoinsNoTag = r.slotContributions.find((s) => s.slotId === 'tongue')!.coinsContributed;

    // fighter has phys:quick → no penalty
    const fighterTongue: Assignment[] = [
      { slotId: 'edge', merc: talker },
      { slotId: 'tongue', merc: fighter },
    ];
    const r2 = await resolveScenario({ scenario: scen, assignments: fighterTongue, llm, rng });
    const tongueCoinsWithTag = r2.slotContributions.find((s) => s.slotId === 'tongue')!.coinsContributed;
    expect(tongueCoinsWithTag).toBe(tongueCoinsNoTag + 1);
  });

  it('mock LLM tags contribution lines with approach id', async () => {
    const scen = baseScenario([{ id: 'parley', label: 'Parley', summary: 's' }], 'parley');
    const r = await resolveScenario({ scenario: scen, assignments, llm, rng });
    for (const c of r.contributions) {
      expect(c.line).toContain('[parley]');
    }
    expect(r.outcomeNarrative).toContain('[parley]');
  });
});
