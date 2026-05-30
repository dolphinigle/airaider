import { describe, it, expect } from 'vitest';
import {
  plannedStepCount,
  plannedRarityCurve,
  downshiftRarity,
  bandToStepStatus,
  isStepSuccessful,
  isStepCatastrophic,
  blurbMentionsAnchor,
  chainDigest,
  type QuestChain,
  type ChainAnchors,
} from '../src/questChain.js';

describe('plannedStepCount', () => {
  it('common/uncommon = 3, rare = 4, legendary = 5', () => {
    expect(plannedStepCount('common')).toBe(3);
    expect(plannedStepCount('uncommon')).toBe(3);
    expect(plannedStepCount('rare')).toBe(4);
    expect(plannedStepCount('legendary')).toBe(5);
  });
});

describe('plannedRarityCurve', () => {
  it('common chain: [common, common, common]', () => {
    expect(plannedRarityCurve('common')).toEqual(['common', 'common', 'common']);
  });
  it('uncommon chain: [common, common, uncommon]', () => {
    expect(plannedRarityCurve('uncommon')).toEqual(['common', 'common', 'uncommon']);
  });
  it('rare chain: [common, uncommon, rare, rare] (climax + previous step both at chain rarity)', () => {
    const curve = plannedRarityCurve('rare');
    expect(curve).toHaveLength(4);
    expect(curve[curve.length - 1]).toBe('rare');
    expect(curve[0]).toBe('common');
  });
  it('legendary chain: 5 steps, climax legendary', () => {
    const curve = plannedRarityCurve('legendary');
    expect(curve).toHaveLength(5);
    expect(curve[curve.length - 1]).toBe('legendary');
    expect(curve[0]).toBe('common');
  });
});

describe('downshiftRarity', () => {
  it('floors at common', () => {
    expect(downshiftRarity('common')).toBe('common');
    expect(downshiftRarity('uncommon')).toBe('common');
    expect(downshiftRarity('rare')).toBe('uncommon');
    expect(downshiftRarity('legendary')).toBe('rare');
  });
});

describe('bandToStepStatus', () => {
  it('maps each band', () => {
    expect(bandToStepStatus('favorable')).toBe('resolved-favorable');
    expect(bandToStepStatus('unfavorable')).toBe('resolved-unfavorable');
    expect(bandToStepStatus('catastrophic')).toBe('resolved-catastrophic');
    expect(bandToStepStatus('catastrophic-favorable')).toBe('resolved-catastrophic-favorable');
  });
  it('successful bands include catastrophic-favorable', () => {
    expect(isStepSuccessful('resolved-favorable')).toBe(true);
    expect(isStepSuccessful('resolved-catastrophic-favorable')).toBe(true);
    expect(isStepSuccessful('resolved-unfavorable')).toBe(false);
    expect(isStepSuccessful('resolved-catastrophic')).toBe(false);
  });
  it('catastrophic helper covers both catastrophic variants', () => {
    expect(isStepCatastrophic('resolved-catastrophic')).toBe(true);
    expect(isStepCatastrophic('resolved-catastrophic-favorable')).toBe(true);
    expect(isStepCatastrophic('resolved-favorable')).toBe(false);
  });
});

describe('blurbMentionsAnchor', () => {
  const anchors: ChainAnchors = {
    centralNpc: 'Mara Loth',
    antagonistFaction: 'the Iron Witnesses',
    recurringPlaces: ['the Sunken Chapel', 'Greythorn'],
    mustMentionByStep: [[], [], [], []],
  };
  it('matches first name of central NPC', () => {
    expect(blurbMentionsAnchor('Mara was last seen at dusk in the marsh.', anchors, 0)).toBe('Mara Loth');
  });
  it('matches a recurring place', () => {
    expect(blurbMentionsAnchor('The price waits in the Sunken Chapel.', anchors, 1)).toBe('the Sunken Chapel');
  });
  it('matches faction', () => {
    expect(blurbMentionsAnchor('Iron Witnesses ride at first light.', anchors, 2)).toBe('the Iron Witnesses');
  });
  it('returns null when no anchor present', () => {
    expect(blurbMentionsAnchor('Some random tavern in nowhere.', anchors, 0)).toBeNull();
  });
});

describe('chainDigest', () => {
  function mockChain(): QuestChain {
    return {
      id: 'chain-x',
      kind: 'world',
      chainRarity: 'rare',
      region: 'Greythorn',
      skeleton: 'four paragraphs hidden',
      anchors: {
        centralNpc: 'Mara Loth',
        antagonistFaction: 'Iron Witnesses',
        recurringPlaces: ['Sunken Chapel'],
        mustMentionByStep: [[], [], [], []],
      },
      stepBeats: [
        'meet Mara in the marsh',
        'hunters arrive at the chapel',
        'pivot at the standing stones',
        'climax at the abbey vault',
      ],
      title: 'The Witness in the Marsh',
      hook: 'A noblewoman hides in Greythorn.',
      themeTagIds: [],
      steps: [
        { stepIdx: 0, plannedRarity: 'common', originalPlannedRarity: 'common', status: 'resolved-favorable', summary: '[favorable] Mara was retrieved alive.', band: 'favorable', partyMercIds: ['m-marek'] },
        { stepIdx: 1, plannedRarity: 'uncommon', originalPlannedRarity: 'uncommon', status: 'active' },
        { stepIdx: 2, plannedRarity: 'rare', originalPlannedRarity: 'rare', status: 'pending' },
        { stepIdx: 3, plannedRarity: 'rare', originalPlannedRarity: 'rare', status: 'pending' },
      ],
      currentStepIdx: 1,
      status: 'active',
      startedDay: 5,
    };
  }
  it('includes title, anchors, prior summaries', () => {
    const d = chainDigest(mockChain());
    expect(d).toContain('The Witness in the Marsh');
    expect(d).toContain('Mara Loth');
    expect(d).toContain('Iron Witnesses');
    expect(d).toContain('Sunken Chapel');
    expect(d).toContain('meet Mara');
    expect(d).toContain('hunters arrive');
    expect(d).toContain('[favorable]');
  });
  it('omits future-step beats AND outcomes', () => {
    const d = chainDigest(mockChain());
    expect(d).not.toContain('climax at the abbey vault');
    expect(d).not.toContain('pivot at the standing stones');
  });
});
