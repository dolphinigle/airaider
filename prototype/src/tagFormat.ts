// Shared tag rendering for CLI surfaces (roster, tavern, captives, deploy picker, leads).
// Per SIM_BIBLE Day-100 lock: roster-craft dopamine requires tag bonuses to be
// visible to the player. This helper turns a Tag[] into a compact glyph+label
// string sorted rare→common so high-rarity tags pop visually.

import type { Tag, TagRarity } from './types.js';

const RARITY_GLYPH: Record<TagRarity, string> = {
  legendary: '✨',
  rare: '★',
  uncommon: '✦',
  common: '·',
};

const RARITY_ORDER: Record<TagRarity, number> = {
  legendary: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
};

/** Render a list of tags as " ★Priest ✦Stoic ·Male", sorted rare-first. */
export function formatTags(tags: readonly Tag[]): string {
  if (!tags || tags.length === 0) return '';
  const sorted = [...tags].sort((a, b) => {
    const r = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    if (r !== 0) return r;
    return a.label.localeCompare(b.label);
  });
  return ' ' + sorted.map((t) => `${RARITY_GLYPH[t.rarity]}${t.label}`).join(' ');
}

/** Render preferredTag IDs against the tag pool: " prefers: ★Priest ·Brawny". */
export function formatPreferredTags(
  tagIds: readonly string[] | undefined,
  tagPool: Map<string, Tag>,
): string {
  if (!tagIds || tagIds.length === 0) return '';
  const resolved = tagIds
    .map((id) => tagPool.get(id))
    .filter((t): t is Tag => t !== undefined);
  if (resolved.length === 0) return ` prefers:[${tagIds.join(',')}]`;
  return ` prefers:${formatTags(resolved)}`;
}
