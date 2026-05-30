// PROTO-GUI v0.5: shared vocab payload for AI generation prompts.
//
// Purpose: a single, stable text block listing the FULL tag/archetype/region
// vocab so the AI can pick valid ids when generating units or leads. Goes
// in the SYSTEM prompt → OpenAI prompt-caching covers it after call #1, so
// repeated calls within a session pay ~25% input cost on this prefix.
//
// Principle: GAME owns numbers (rarity weights, tier values, stat bonuses);
// AI owns FLAVOR (which tags suit this unit, what their name is, backstory).
// This vocab tells the AI what's *available* but never tells it what to pick.

import tagsJson from '../../../prototype/data/tags.json' assert { type: 'json' };
import { REGIONS, ARCHETYPES, LEAD_RARITIES } from '../../../prototype/src/leads.js';

interface TagRow {
  id: string;
  category: string;
  rarity: string;
  tier: number;
  mutexGroup?: string;
  label: string;
}

const ALL_TAGS = tagsJson as TagRow[];

/** Tag IDs the AI is allowed to pick from, by category.
 *  Engine validates AI output against this list. */
export const VALID_TAG_IDS: ReadonlySet<string> = new Set(ALL_TAGS.map((t) => t.id));

/** Tag IDs grouped by category — used for context-aware seed picks. */
export const TAGS_BY_CATEGORY: Readonly<Record<string, readonly TagRow[]>> = (() => {
  const out: Record<string, TagRow[]> = {};
  for (const t of ALL_TAGS) {
    (out[t.category] ??= []).push(t);
  }
  return out;
})();

/** Tag IDs grouped by mutexGroup — at most one per group may be on a unit. */
export const TAGS_BY_MUTEX: Readonly<Record<string, readonly string[]>> = (() => {
  const out: Record<string, string[]> = {};
  for (const t of ALL_TAGS) {
    if (t.mutexGroup) (out[t.mutexGroup] ??= []).push(t.id);
  }
  return out;
})();

function formatTagLine(t: TagRow): string {
  const mutex = t.mutexGroup ? ` [mutex:${t.mutexGroup}]` : '';
  return `  - ${t.id}  "${t.label}"  (${t.rarity})${mutex}`;
}

/** The canonical vocab block. Embed in SYSTEM prompts that need tag picking. */
export const VOCAB_BLOCK: string = (() => {
  const sections: string[] = [];
  sections.push('=== TAG VOCAB ===');
  sections.push('Pick tag IDs ONLY from this list. Use the exact id (left of the quotes).');
  sections.push('Rarity hints frequency: common > uncommon > rare > legendary.');
  sections.push('Tags sharing a [mutex:...] group are mutually exclusive — pick at most one per group.');
  sections.push('');
  for (const [cat, list] of Object.entries(TAGS_BY_CATEGORY)) {
    sections.push(`Category: ${cat}`);
    for (const t of list) sections.push(formatTagLine(t));
    sections.push('');
  }
  sections.push('=== LEAD ARCHETYPES ===');
  for (const a of ARCHETYPES) sections.push(`  - ${a}`);
  sections.push('');
  sections.push('=== LEAD RARITIES ===');
  for (const r of LEAD_RARITIES) sections.push(`  - ${r}`);
  sections.push('');
  sections.push('=== REGIONS ===');
  sections.push('Setting is a low-medieval grimdark patchwork. Region names evoke mood:');
  for (const r of REGIONS) sections.push(`  - ${r}`);
  return sections.join('\n');
})();

/** Token-count estimate for debugging (rough: 1 token ≈ 4 chars English). */
export function estimateVocabTokens(): number {
  return Math.ceil(VOCAB_BLOCK.length / 4);
}
