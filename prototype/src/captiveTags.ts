// PROTO-GAME: Roll a captive's tags at capture time so captives become
// real "loot" with identity (per sim Day-100 lock: late-game loot = captives,
// not gold). Without this, captives are inert bags with notoriety only.
//
// Strategy:
//   - lead.rarity drives tier mix:
//       common    → 2 common tags
//       uncommon  → 1 common + 1 uncommon
//       rare      → 1 common + 1 uncommon + 1 rare
//       legendary → 1 common + 1 rare + 1 legendary
//   - Always roll at most 1 tag per mutex group (gender/background/...)
//   - Deterministic via lead.id-derived seed.

import type { Tag, TagRarity } from './types.js';
import { rngFromString, type Rng } from './rng.js';

export type RarityPlan = readonly TagRarity[];

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

export function rollCaptiveTags(
  tagPool: Map<string, Tag>,
  leadRarity: string,
  seed: string,
): Tag[] {
  const plan = PLAN_BY_LEAD_RARITY[leadRarity] ?? PLAN_BY_LEAD_RARITY.common!;
  const rng = rngFromString(`captive-tags-${seed}`);
  const all = [...tagPool.values()];
  const usedMutex = new Set<string>();
  const picked: Tag[] = [];
  // Pick highest rarities first so they reserve their mutex slots before
  // commons crowd them out. (Rare tags often share `mutexGroup:background`
  // with commons; reversed order is the only way rare slots survive.)
  const order: TagRarity[] = ['legendary', 'rare', 'uncommon', 'common'];
  const remaining = [...plan];
  for (const r of order) {
    const wantCount = remaining.filter((x) => x === r).length;
    for (let i = 0; i < wantCount; i++) {
      const candidates = all.filter((t) =>
        t.rarity === r
        && !picked.some((p) => p.id === t.id)
        && (!t.mutexGroup || !usedMutex.has(t.mutexGroup)),
      );
      const chosen = pickWeighted(rng, candidates);
      if (!chosen) continue;
      picked.push(chosen);
      if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
    }
  }
  return picked;
}

/**
 * Hybrid resolver: prefers AI-picked tagIds (consistent with story). Engine
 * still owns the COUNT (plan.length), but rarity is now a soft preference —
 * we'd rather have a story-fitting common than a story-breaking random rare.
 *
 * Algorithm:
 *  1. Walk AI picks in order, keeping any that are in pool + pass mutex.
 *     Stop once we have plan.length tags.
 *  2. If short, fill remaining slots with engine random pick at the matching
 *     plan-slot rarity (highest unfilled rarity first).
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

  // Phase 1: take AI picks, preferring higher-rarity first so legendary/rare
  // story-fitting picks aren't truncated by common picks earlier in the list.
  const rarityRank: Record<TagRarity, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
  const sortedAi = aiTagIds
    .map((id) => tagPool.get(id))
    .filter((t): t is Tag => !!t)
    .sort((a, b) => rarityRank[a.rarity] - rarityRank[b.rarity]);
  for (const t of sortedAi) {
    if (picked.length >= plan.length) break;
    if (usedIds.has(t.id)) continue;
    if (t.mutexGroup && usedMutex.has(t.mutexGroup)) continue;
    picked.push(t);
    usedIds.add(t.id);
    if (t.mutexGroup) usedMutex.add(t.mutexGroup);
  }

  // Phase 2: if short, top off using plan's remaining rarities (highest first).
  if (picked.length < plan.length) {
    const haveByRarity = new Map<TagRarity, number>();
    for (const t of picked) haveByRarity.set(t.rarity, (haveByRarity.get(t.rarity) ?? 0) + 1);
    const need: TagRarity[] = [];
    for (const r of plan) {
      const wantCount = plan.filter((x) => x === r).length;
      const havCount = haveByRarity.get(r) ?? 0;
      // Compute deficit only once per rarity bucket by tracking via need[]
      if (need.filter((x) => x === r).length < Math.max(0, wantCount - havCount)) {
        need.push(r);
      }
    }
    const order: TagRarity[] = ['legendary', 'rare', 'uncommon', 'common'];
    for (const r of order) {
      let want = need.filter((x) => x === r).length;
      while (want > 0 && picked.length < plan.length) {
        const candidates = all.filter((t) =>
          t.rarity === r
          && !usedIds.has(t.id)
          && (!t.mutexGroup || !usedMutex.has(t.mutexGroup)),
        );
        if (candidates.length === 0) break;
        const chosen = candidates[Math.floor(rng() * candidates.length)]!;
        picked.push(chosen);
        usedIds.add(chosen.id);
        if (chosen.mutexGroup) usedMutex.add(chosen.mutexGroup);
        want--;
      }
    }
  }
  return picked;
}
