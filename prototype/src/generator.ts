// Tag-rarity-aware recruit pool generator. Pure / deterministic given an Rng.
// Produces fresh-recruit Mercs (veterancy 0, wage 1, hp 3).

import type { Attribute, AttributeBlock, AttributeScore, Merc, Tag, TagRarity } from './types.js';
import { ATTRIBUTES } from './types.js';
import type { Rng } from './rng.js';

const MALE_NAMES = [
  'Borrek', 'Calden', 'Davrin', 'Eldun', 'Fyrn', 'Garreth', 'Hask', 'Joran',
  'Korm', 'Larik', 'Mortha', 'Nevin', 'Orsen', 'Pell', 'Quenn', 'Rastan',
  'Solm', 'Tarek', 'Ulfar', 'Vellan', 'Wren', 'Yorrick',
];

const FEMALE_NAMES = [
  'Aida', 'Brenna', 'Cessa', 'Drava', 'Ennel', 'Falka', 'Gretha', 'Hessa',
  'Ileth', 'Jovi', 'Kelle', 'Lirra', 'Mavra', 'Nessa', 'Ondra', 'Petra',
  'Quira', 'Rynna', 'Saela', 'Thessa', 'Vanya', 'Yelka',
];

const GENDERLESS_FALLBACK = ['Arryn', 'Cael', 'Iven', 'Sael', 'Toren', 'Wynn'];

const RARITY_WEIGHT: Record<TagRarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3,
};

export interface GeneratorOpts {
  /** Min extra (non-mandatory) tags. */
  extraTagMin?: number;
  /** Max extra (non-mandatory) tags. */
  extraTagMax?: number;
  /** Base attribute target sum (clamped 1..7 per attr). Default 16 (avg ~3.2). */
  baseAttrSum?: number;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function randInt(rng: Rng, loInclusive: number, hiInclusive: number): number {
  return loInclusive + Math.floor(rng() * (hiInclusive - loInclusive + 1));
}

function clampAttr(n: number): AttributeScore {
  const c = Math.max(1, Math.min(7, Math.round(n)));
  return c as AttributeScore;
}

/** Weighted pick from a list of tags by rarity, optionally filtered. */
function weightedTagPick(rng: Rng, candidates: Tag[]): Tag | undefined {
  if (candidates.length === 0) return undefined;
  let total = 0;
  for (const t of candidates) total += RARITY_WEIGHT[t.rarity];
  let r = rng() * total;
  for (const t of candidates) {
    r -= RARITY_WEIGHT[t.rarity];
    if (r <= 0) return t;
  }
  return candidates[candidates.length - 1];
}

/**
 * Generate a single fresh-recruit merc using the provided tag pool.
 *
 * Rolls in order:
 *   1) gender (mandatory: gender:* mutex group)
 *   2) background (mandatory: background mutex group)
 *   3) temperament (mandatory: temperament mutex group)
 *   4) 0-2 extra non-mutex flavor tags (physicality / personality)
 *   5) base attribute block + per-tag attrBias, clamped 1..7
 */
export function generateMerc(
  rng: Rng,
  tagPool: Map<string, Tag>,
  opts: GeneratorOpts = {},
  idHint?: string,
): Merc {
  const allTags = [...tagPool.values()];

  const byMutex = (group: string): Tag[] =>
    allTags.filter((t) => t.mutexGroup === group);

  const genderTag = weightedTagPick(rng, byMutex('gender'));
  const bgTag = weightedTagPick(rng, byMutex('background'));
  const tempTag = weightedTagPick(rng, byMutex('temperament'));

  const tags: Tag[] = [];
  for (const t of [genderTag, bgTag, tempTag]) {
    if (t) tags.push(t);
  }

  const extraMin = opts.extraTagMin ?? 0;
  const extraMax = opts.extraTagMax ?? 2;
  const extraCount = randInt(rng, extraMin, extraMax);

  const usedMutex = new Set(tags.map((t) => t.mutexGroup).filter(Boolean) as string[]);
  const usedIds = new Set(tags.map((t) => t.id));
  for (let i = 0; i < extraCount; i++) {
    const pool = allTags.filter(
      (t) =>
        !usedIds.has(t.id) &&
        (!t.mutexGroup || !usedMutex.has(t.mutexGroup)),
    );
    const chosen = weightedTagPick(rng, pool);
    if (!chosen) break;
    tags.push(chosen);
    usedIds.add(chosen.id);
    if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
  }

  const baseSum = opts.baseAttrSum ?? 16;
  const attrs: Record<Attribute, number> = {
    physical: 0, agility: 0, intelligence: 0, charisma: 0, willpower: 0,
  };
  for (const a of ATTRIBUTES) attrs[a] = 2 + Math.floor(rng() * 3); // 2..4
  const targetExtra = Math.max(0, baseSum - ATTRIBUTES.reduce((s, a) => s + attrs[a], 0));
  for (let i = 0; i < targetExtra; i++) {
    attrs[pick(rng, ATTRIBUTES)] += 1;
  }
  for (const t of tags) {
    if (!t.attrBias) continue;
    for (const a of ATTRIBUTES) {
      if (t.attrBias[a]) attrs[a] += t.attrBias[a]!;
    }
  }
  const clamped: AttributeBlock = {
    physical: clampAttr(attrs.physical),
    agility: clampAttr(attrs.agility),
    intelligence: clampAttr(attrs.intelligence),
    charisma: clampAttr(attrs.charisma),
    willpower: clampAttr(attrs.willpower),
  };

  let namePool: readonly string[] = GENDERLESS_FALLBACK;
  if (genderTag?.id === 'gender:male') namePool = MALE_NAMES;
  else if (genderTag?.id === 'gender:female') namePool = FEMALE_NAMES;
  const name = pick(rng, namePool);
  const id = idHint ?? `gen-${name.toLowerCase()}-${Math.floor(rng() * 0xffff).toString(16)}`;

  return {
    id,
    name,
    attrs: clamped,
    tags,
    veterancy: 0,
    wage: 1,
    hp: 3,
  };
}

export function generateRecruitPool(
  rng: Rng,
  tagPool: Map<string, Tag>,
  count: number,
  opts: GeneratorOpts = {},
): Merc[] {
  const out: Merc[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < count; i++) {
    let m = generateMerc(rng, tagPool, opts, `gen-${i + 1}`);
    while (seenIds.has(m.id)) m = generateMerc(rng, tagPool, opts);
    seenIds.add(m.id);
    out.push(m);
  }
  return out;
}
