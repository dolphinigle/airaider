// The fixed tag vocabulary (docs/TAGS.md). Engine rolls tags; the AI references
// them (never invents). One overlap() function powers fit (quests) and prestige
// (rooms). The parser normalizes whatever the AI returns into a canonical id.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface TagDef {
  id: string;            // canonical, e.g. "bg:soldier"
  group: string;         // prompt-facing group header, e.g. "background"
  word: string;          // bare suffix, e.g. "soldier" (globally unique)
  mutex: string | null;  // mutex-group key; one tag per key on a character. null = stackable
  tiered: boolean;       // does the tier (1..5) carry magnitude?
  rarity: Rarity;
  opposite?: string;     // for pairs (the clashing tag)
  tierLabels?: [string, string, string, string, string]; // [T5..T1] for tiered tags
  gloss?: string;
}

// prompt-group header -> canonical id prefix
const PREFIX: Record<string, string> = {
  gender: 'gender', race: 'race', personality: 'pers',
  background: 'bg', physical: 'phys', skill: 'skill', notoriety: 'noto',
};

// ---- vocabulary authoring helpers -------------------------------------------
function flat(group: string, words: string[], rarity: Rarity, mutex: string | null): TagDef[] {
  return words.map((word) => ({ id: `${PREFIX[group]}:${word}`, group, word, mutex, tiered: false, rarity }));
}
function pairs(group: string, list: [string, string, string][], rarity: Rarity): TagDef[] {
  // [mutexKey, a, b]; a and b clash with each other
  const out: TagDef[] = [];
  for (const [key, a, b] of list) {
    out.push({ id: `${PREFIX[group]}:${a}`, group, word: a, mutex: `${group}:${key}`, tiered: group === 'physical', rarity, opposite: `${PREFIX[group]}:${b}` });
    out.push({ id: `${PREFIX[group]}:${b}`, group, word: b, mutex: `${group}:${key}`, tiered: group === 'physical', rarity, opposite: `${PREFIX[group]}:${a}` });
  }
  return out;
}
function skill(word: string, rarity: Rarity, gloss?: string): TagDef {
  return { id: `skill:${word}`, group: 'skill', word, mutex: null, tiered: true, rarity,
    tierLabels: ['Apprentice', 'Journeyman', 'Adept', 'Expert', 'Master'], gloss };
}

const T_PHYS = (a: string, b: string, c: string, d: string, e: string): [string, string, string, string, string] => [a, b, c, d, e];

// ---- THE VOCABULARY ---------------------------------------------------------
export const VOCAB: TagDef[] = [
  ...flat('gender', ['male', 'female'], 'common', 'gender'),
  ...flat('race', ['human', 'wolfman', 'elf', 'lizardman'], 'common', 'race'),

  ...pairs('personality', [
    ['courage', 'brave', 'cowardly'], ['honesty', 'honest', 'deceitful'],
    ['heart', 'kind', 'cruel'], ['ego', 'humble', 'proud'],
    ['money', 'generous', 'greedy'], ['temper', 'calm', 'wrathful'],
    ['company', 'gregarious', 'aloof'], ['mood', 'cheerful', 'gloomy'],
  ], 'common'),

  ...flat('background', ['soldier', 'hunter', 'peasant', 'sailor', 'criminal', 'merchant',
    'healer', 'artisan', 'wanderer', 'scholar', 'priest', 'noble'], 'common', 'background'),
  ...flat('background', ['slave', 'beggar'], 'common', 'background'),

  // physical pairs are tiered (intensity); labels per direction below
  ...pairs('physical', [
    ['build', 'muscular', 'frail'], ['looks', 'beautiful', 'ugly'],
    ['mind', 'clever', 'slow-witted'], ['vigor', 'tough', 'sickly'],
  ], 'common'),
  { id: 'phys:scarred', group: 'physical', word: 'scarred', mutex: null, tiered: false, rarity: 'common' },

  skill('weapon', 'rare'), skill('stealth', 'rare'),
  skill('lore', 'rare', 'books, history, secrets'), skill('heal', 'rare'),
  skill('beast', 'rare', 'taming/handling animals'), skill('craft', 'rare'),
  skill('food', 'uncommon', 'cooking, foraging, provisioning'), skill('song', 'rare'),
  skill('magic-fire', 'legendary'), skill('magic-earth', 'legendary'),
  skill('magic-water', 'legendary'), skill('magic-air', 'legendary'),
  skill('magic-dark', 'legendary'),

  { id: 'noto:famous', group: 'notoriety', word: 'famous', mutex: 'notoriety', tiered: true, rarity: 'uncommon', opposite: 'noto:infamous', tierLabels: ['Known', 'Noted', 'Renowned', 'Celebrated', 'Legendary'] },
  { id: 'noto:infamous', group: 'notoriety', word: 'infamous', mutex: 'notoriety', tiered: true, rarity: 'uncommon', opposite: 'noto:famous', tierLabels: ['Suspect', 'Notorious', 'Feared', 'Dreaded', 'Reviled'] },
];

// physical-pair tier labels (intensity per direction)
const PHYS_TIER: Record<string, [string, string, string, string, string]> = {
  'phys:muscular': T_PHYS('Toned', 'Sturdy', 'Brawny', 'Mighty', 'Herculean'),
  'phys:frail': T_PHYS('Slight', 'Slim', 'Thin', 'Gaunt', 'Wasted'),
  'phys:beautiful': T_PHYS('Comely', 'Fair', 'Lovely', 'Stunning', 'Gorgeous'),
  'phys:ugly': T_PHYS('Plain', 'Homely', 'Coarse', 'Hard-Faced', 'Hideous'),
  'phys:clever': T_PHYS('Sharp', 'Quick', 'Keen', 'Brilliant', 'Genius'),
  'phys:slow-witted': T_PHYS('Simple', 'Slow', 'Dull', 'Dim', 'Witless'),
  'phys:tough': T_PHYS('Hardy', 'Rugged', 'Stout', 'Iron', 'Unbreakable'),
  'phys:sickly': T_PHYS('Delicate', 'Wan', 'Ailing', 'Failing', 'Wretched'),
};
for (const t of VOCAB) if (PHYS_TIER[t.id]) t.tierLabels = PHYS_TIER[t.id];

// ---- lookups ----------------------------------------------------------------
const BY_ID = new Map(VOCAB.map((t) => [t.id, t]));
const BY_WORD = new Map(VOCAB.map((t) => [t.word, t])); // suffixes are globally unique

export function tagDef(id: string): TagDef | undefined { return BY_ID.get(id); }
export function allTags(): TagDef[] { return VOCAB; }

/** Normalize whatever the AI returned into a canonical id, or null if unknown.
 *  Accepts "soldier", "bg:soldier", "tag:bg:soldier", "Soldier" — strips/lowercases/maps. */
export function canonicalTag(raw: string): string | null {
  if (!raw) return null;
  let w = raw.trim().toLowerCase().replace(/^tag:/, '');
  if (w.includes(':')) w = w.split(':').pop()!;
  return BY_WORD.get(w)?.id ?? null;
}

/** Canonicalize a list, dropping unknowns. */
export function canonicalTags(raw: string[]): string[] {
  const out: string[] = [];
  for (const r of raw) { const id = canonicalTag(r); if (id && !out.includes(id)) out.push(id); }
  return out;
}

/** The grouped bare-suffix vocab block to paste into prompts (validated cheapest form). */
export function promptVocabBlock(): string {
  const order = ['gender', 'race', 'personality', 'background', 'physical', 'skill', 'notoriety'];
  return order.map((g) => `  ${g}: ${VOCAB.filter((t) => t.group === g).map((t) => t.word).join(' ')}`).join('\n');
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).replace(/-/g, ' ');

/** The tier-less concept noun (e.g. skill:stealth → "Stealth"). Use for favored/requirement
 *  tags where the tier isn't known or isn't relevant. */
export function tagName(id: string): string {
  const d = BY_ID.get(id);
  return d ? cap(d.word) : id;
}

/** Display label for a tag at a tier (1..5; T1 strongest). Skills keep their noun
 *  ("Adept Stealth"); physical/notoriety tier-labels are self-descriptive adjectives. */
export function tagLabel(id: string, tier = 3): string {
  const d = BY_ID.get(id);
  if (!d) return id;
  if (d.tiered && d.tierLabels) {
    const t = d.tierLabels[5 - Math.min(5, Math.max(1, tier))]; // tier1 -> last (strongest)
    return d.group === 'skill' ? `${t} ${cap(d.word)}` : t;
  }
  return cap(d.word);
}
