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

type RarityPlan = readonly TagRarity[];

const PLAN_BY_LEAD_RARITY: Record<string, RarityPlan> = {
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
