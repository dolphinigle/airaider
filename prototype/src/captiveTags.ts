// PROTO-GAME: Roll a captive's tags at capture time so captives become
// real "loot" with identity (per sim Day-100 lock: late-game loot = captives,
// not gold). Without this, captives are inert bags with notoriety only.
//
// Strategy:
//   - Demographics ALWAYS: exactly 1 gender + 1 race tag (independent of plan).
//   - Traits via lead.rarity plan (background/personality/temperament/physical):
//       common    → 2 trait tags
//       uncommon  → 1 common + 1 uncommon trait
//       rare      → 1 common + 1 uncommon + 1 rare trait
//       legendary → 1 common + 1 rare + 1 legendary trait
//   - Always roll at most 1 tag per mutex group (gender/background/...)
//   - Deterministic via lead.id-derived seed.
//
// (Demographics are guaranteed because a "captive without a gender or race"
//  reads as a bug — the AI's prose almost always names them, and the unit
//  card needs to render those tags consistently.)

import type { Tag, TagRarity } from './types.js';
import { rngFromString, type Rng } from './rng.js';

export type RarityPlan = readonly TagRarity[];

/** Tag "kind" — coarser than mutexGroup, used to separate identity vs traits. */
function tagKind(t: Tag): 'gender' | 'race' | 'trait' {
  if (t.mutexGroup === 'gender') return 'gender';
  if (t.mutexGroup === 'race') return 'race';
  return 'trait';
}

export const PLAN_BY_LEAD_RARITY: Record<string, RarityPlan> = {
  common:    ['common', 'common'],
  uncommon:  ['common', 'uncommon'],
  rare:      ['common', 'uncommon', 'rare'],
  legendary: ['common', 'rare', 'legendary'],
};

function pickWeighted<T>(rng: Rng, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/**
 * Reserve one gender + one race tag from `all`, preferring any AI-picked IDs
 * present; falls back to a random valid tag of that kind. Mutates picked /
 * usedIds / usedMutex.
 */
function reserveDemographics(
  rng: Rng,
  all: readonly Tag[],
  aiPicks: readonly Tag[],
  picked: Tag[],
  usedIds: Set<string>,
  usedMutex: Set<string>,
): void {
  for (const kind of ['gender', 'race'] as const) {
    if (picked.some((p) => tagKind(p) === kind)) continue;
    const aiOfKind = aiPicks.find((t) => tagKind(t) === kind && !usedIds.has(t.id));
    let chosen: Tag | undefined = aiOfKind;
    if (!chosen) {
      const candidates = all.filter((t) => tagKind(t) === kind && !usedIds.has(t.id));
      chosen = pickWeighted(rng, candidates);
    }
    if (!chosen) continue;
    picked.push(chosen);
    usedIds.add(chosen.id);
    if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
  }
}

export function rollCaptiveTags(
  tagPool: Map<string, Tag>,
  leadRarity: string,
  seed: string,
): Tag[] {
  const plan = PLAN_BY_LEAD_RARITY[leadRarity] ?? PLAN_BY_LEAD_RARITY.common!;
  const rng = rngFromString(`captive-tags-${seed}`);
  const all = [...tagPool.values()];
  const usedMutex = new Set<string>();
  const usedIds = new Set<string>();
  const picked: Tag[] = [];

  // Always reserve gender + race first so trait slots don't crowd them out.
  reserveDemographics(rng, all, [], picked, usedIds, usedMutex);

  // Trait slots per the rarity plan — pick from non-gender/non-race tags.
  // Highest rarities first so legendary/rare reserve mutex before commons.
  const order: TagRarity[] = ['legendary', 'rare', 'uncommon', 'common'];
  for (const r of order) {
    const wantCount = plan.filter((x) => x === r).length;
    for (let i = 0; i < wantCount; i++) {
      const candidates = all.filter((t) =>
        t.rarity === r
        && tagKind(t) === 'trait'
        && !usedIds.has(t.id)
        && (!t.mutexGroup || !usedMutex.has(t.mutexGroup)),
      );
      const chosen = pickWeighted(rng, candidates);
      if (!chosen) continue;
      picked.push(chosen);
      usedIds.add(chosen.id);
      if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
    }
  }
  return picked;
}

/**
 * Hybrid resolver: prefers AI-picked tagIds (consistent with story). Engine
 * always reserves gender + race slots; rarity plan governs the *trait* slots
 * on top — we'd rather have a story-fitting common trait than a story-
 * breaking random rare.
 *
 * Algorithm:
 *  1. Reserve 1 gender + 1 race (from AI picks if available, else random).
 *  2. Walk AI trait picks (highest rarity first), keeping any in pool that
 *     pass mutex, until plan.length trait slots filled.
 *  3. If short on traits, top off with engine random pick at matching plan
 *     rarity (highest unfilled rarity first).
 */
export function resolveCaptiveTagsAI(
  aiTagIds: readonly string[],
  tagPool: Map<string, Tag>,
  leadRarity: string,
  seed: string,
): Tag[] {
  const plan = PLAN_BY_LEAD_RARITY[leadRarity] ?? PLAN_BY_LEAD_RARITY.common!;
  const rng = rngFromString(`captive-tags-ai-${seed}`);
  const all = [...tagPool.values()];
  const usedMutex = new Set<string>();
  const usedIds = new Set<string>();
  const picked: Tag[] = [];

  const aiPicks = aiTagIds
    .map((id) => tagPool.get(id))
    .filter((t): t is Tag => !!t);

  // 1. Demographics first.
  reserveDemographics(rng, all, aiPicks, picked, usedIds, usedMutex);

  // 2. AI trait picks, sorted highest-rarity first.
  const rarityRank: Record<TagRarity, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
  const aiTraitsSorted = aiPicks
    .filter((t) => tagKind(t) === 'trait')
    .sort((a, b) => rarityRank[a.rarity] - rarityRank[b.rarity]);
  let traitCount = 0;
  for (const t of aiTraitsSorted) {
    if (traitCount >= plan.length) break;
    if (usedIds.has(t.id)) continue;
    if (t.mutexGroup && usedMutex.has(t.mutexGroup)) continue;
    picked.push(t);
    usedIds.add(t.id);
    if (t.mutexGroup) usedMutex.add(t.mutexGroup);
    traitCount++;
  }

  // 3. If trait slots short, top off with random of plan rarities.
  if (traitCount < plan.length) {
    const haveByRarity = new Map<TagRarity, number>();
    for (const t of picked) {
      if (tagKind(t) !== 'trait') continue;
      haveByRarity.set(t.rarity, (haveByRarity.get(t.rarity) ?? 0) + 1);
    }
    const need: TagRarity[] = [];
    for (const r of plan) {
      const wantCount = plan.filter((x) => x === r).length;
      const havCount = haveByRarity.get(r) ?? 0;
      if (need.filter((x) => x === r).length < Math.max(0, wantCount - havCount)) {
        need.push(r);
      }
    }
    const order: TagRarity[] = ['legendary', 'rare', 'uncommon', 'common'];
    for (const r of order) {
      let want = need.filter((x) => x === r).length;
      while (want > 0 && traitCount < plan.length) {
        const candidates = all.filter((t) =>
          t.rarity === r
          && tagKind(t) === 'trait'
          && !usedIds.has(t.id)
          && (!t.mutexGroup || !usedMutex.has(t.mutexGroup)),
        );
        if (candidates.length === 0) break;
        const chosen = candidates[Math.floor(rng() * candidates.length)]!;
        picked.push(chosen);
        usedIds.add(chosen.id);
        if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
        traitCount++;
        want--;
      }
    }
  }
  return picked;
}
