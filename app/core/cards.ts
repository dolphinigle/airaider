// Card factories — build concrete Card objects from generated/AI data.
// Keeps the discriminated-union construction in one place (no duplication).

import type {
  Card, CharacterCard, GoldCard, LiabilityCard, CharacterRole, TagInstance,
} from './types.js';
import type { GeneratedCharacter } from './economy.js';

export type MkId = (prefix: string) => string;

export function characterFromGen(
  mkId: MkId, gen: GeneratedCharacter, role: CharacterRole, cycle: number,
  fleshed?: { name?: string; who?: string; backstory?: string; quirks?: string[] },
): CharacterCard {
  return {
    id: mkId('char'),
    class: 'character',
    role,
    name: fleshed?.name ?? 'Unknown',
    tags: gen.tags,
    value: gen.value,
    location: 'limbo',
    createdCycle: cycle,
    attrs: gen.attrs,
    base: gen.base,
    talents: gen.talents,
    level: gen.level,
    xp: 0,
    who: fleshed?.who,
    backstory: fleshed?.backstory,
    quirks: fleshed?.quirks ?? [],
    chainIds: [],
    injuries: [],
  };
}

export function goldCard(mkId: MkId, qty: number, cycle: number): GoldCard {
  return { id: mkId('gold'), class: 'gold', name: `${qty} gold`, tags: [], value: qty, location: 'limbo', createdCycle: cycle, qty };
}

export function liabilityCard(mkId: MkId, kind: LiabilityCard['kind'], value: number, cycle: number): LiabilityCard {
  const names = { evidence: 'Incriminating evidence', mess: 'A mess left behind', debt: 'A debt owed' };
  return { id: mkId('liab'), class: 'liability', kind, name: names[kind], tags: [], value: -Math.abs(value), location: 'limbo', createdCycle: cycle };
}

export function isMerc(c: Card): c is CharacterCard { return c.class === 'character' && (c as CharacterCard).role === 'merc'; }
export function isCaptive(c: Card): c is CharacterCard { return c.class === 'character' && (c as CharacterCard).role === 'captive'; }

/** Display tags (labels) for any card. */
export function injuryTags(c: CharacterCard): TagInstance[] { return c.injuries; }
