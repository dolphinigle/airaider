// Captive disposition cycle (CANONICAL §captive-cycle).
//
// After a captive-archetype scenario resolves favorably, the player owns a
// captive and must choose ONE disposition. Each action has a different
// engine effect AND a different narrative tone — this module proves the
// LLM can render distinct grimdark consequences for the same input.

import type { Merc, Tag } from './types.js';

export type CaptiveAction = 'ransom' | 'sell' | 'display' | 'recruit' | 'execute';

export const CAPTIVE_ACTIONS: readonly CaptiveAction[] = [
  'ransom', 'sell', 'display', 'recruit', 'execute',
];

export interface Captive {
  id: string;
  name: string;
  /** What sort of captive this is — narrative hook, not an engine type. */
  archetype: string;
  /** Free-text background; the LLM will weave it into the disposition. */
  backstory: string;
  /** Optional tags carried by the captive (used if recruited). */
  tags: Tag[];
  /** A simple 1..5 "how feared / valuable" indicator. */
  notoriety: number;
}

/** Engine-side effects of a disposition — concrete, no narration. */
export interface CaptiveEffect {
  action: CaptiveAction;
  /** Gold delta (positive = paid to player, negative = costs player). */
  goldDelta: number;
  /** Reputation tag the fort earns. */
  reputationGain: 'merciful' | 'mercenary' | 'feared' | 'just' | 'ruthless';
  /** If true, the captive is consumed (no longer in roster / world). */
  captiveRemoved: boolean;
  /** If set, the captive joins the player roster as a fresh merc (loyalty 0). */
  recruitedAs?: Merc;
}

export function effectOf(captive: Captive, action: CaptiveAction): CaptiveEffect {
  const notor = captive.notoriety;
  switch (action) {
    case 'ransom':
      return {
        action,
        goldDelta: 10 + notor * 5,
        reputationGain: 'mercenary',
        captiveRemoved: true,
      };
    case 'sell':
      return {
        action,
        goldDelta: 6 + notor * 2,
        reputationGain: 'ruthless',
        captiveRemoved: true,
      };
    case 'display':
      return {
        action,
        goldDelta: 0,
        reputationGain: 'feared',
        captiveRemoved: true,
      };
    case 'recruit':
      return {
        action,
        goldDelta: 0,
        reputationGain: 'mercenary',
        captiveRemoved: false,
        recruitedAs: captiveToMerc(captive),
      };
    case 'execute':
      return {
        action,
        goldDelta: 0,
        reputationGain: 'just',
        captiveRemoved: true,
      };
  }
}

function captiveToMerc(c: Captive): Merc {
  return {
    id: `recruit-${c.id}`,
    name: c.name,
    attrs: {
      physical: 3, agility: 3, intelligence: 3, charisma: 2, willpower: 2,
    },
    tags: c.tags,
    veterancy: 0,
    wage: 1,
    hp: 3,
  };
}
