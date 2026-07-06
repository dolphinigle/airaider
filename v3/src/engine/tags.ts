// The tag system — GENERATION_FLOW §8 (curve/bands/tiers) + §9b W1–W18 (the LOCKED vocabulary).
// A tag instance = (concept, tier). Tiers 1..20 ascending; the AI only ever sees
// `word (rank)` with ranks low/mid/high/legendary (§9b AI-format lock).

export type Domain = 'character' | 'relic' | 'stackable';
export type PickPolicy = 'exactly-1' | 'at-most-1' | 'free';
export type Attribute = 'str' | 'dex' | 'int' | 'cha' | 'con';
export const ATTRIBUTES: readonly Attribute[] = ['str', 'dex', 'int', 'cha', 'con'];

export interface TagGroup {
  id: string;
  domain: Domain | 'both';
  pickPolicy: PickPolicy;
  identity?: boolean;      // members worth 0 gold
  labelRendered?: boolean; // render with group label ("enchantment: fire (high)") — R5 exception
}

export interface TagConcept {
  id: string;              // one entry per WORD ('muscular' and 'scrawny' are separate concepts)
  group: string;
  depth: number;           // highest tier; 1 = flat (no tiers)
  growth?: number;         // per-concept value growth rate g (W7 scale factor); default 1.9
  negative?: boolean;      // signed value: value goes NEGATIVE with tier (shallow, W5 rule 1)
  zeroValue?: boolean;     // tiered-but-value-0 (tall/short d6 — W5 rule 2)
  opposite?: string;       // never coexists + dice clash mirror
  appearOdds?: number;     // base chance to roll in generation (free/at-most-1 groups)
  domainOverride?: Domain; // concept-level domain override (high-born = character-only, W8)
  statAttr?: Attribute;    // body stat tag feeds this attribute (W4 revamp)
}

// ---- groups ------------------------------------------------------------------

export const GROUPS: Record<string, TagGroup> = {
  type:        { id: 'type', domain: 'both', pickPolicy: 'exactly-1', identity: true },
  gender:      { id: 'gender', domain: 'character', pickPolicy: 'exactly-1', identity: true },
  race:        { id: 'race', domain: 'character', pickPolicy: 'exactly-1', identity: true },
  personality: { id: 'personality', domain: 'character', pickPolicy: 'free', identity: true },
  background:  { id: 'background', domain: 'character', pickPolicy: 'at-most-1' },
  body:        { id: 'body', domain: 'character', pickPolicy: 'free' },
  skill:       { id: 'skill', domain: 'character', pickPolicy: 'free' },
  standing:    { id: 'standing', domain: 'both', pickPolicy: 'free' },
  form:        { id: 'form', domain: 'relic', pickPolicy: 'exactly-1' },
  style:       { id: 'style', domain: 'relic', pickPolicy: 'exactly-1', identity: true },
  rtrait:      { id: 'rtrait', domain: 'relic', pickPolicy: 'free' },
  enchantment: { id: 'enchantment', domain: 'relic', pickPolicy: 'free', labelRendered: true },
  kind:        { id: 'kind', domain: 'stackable', pickPolicy: 'exactly-1', identity: true },
  // system status tags (FORT §2: break → `obedient` tag; kept in the vocabulary so slot
  // queries stay one namespace)
  status:      { id: 'status', domain: 'character', pickPolicy: 'free', identity: true },
};

// ---- concepts (the locked word lists) ------------------------------------------

const C = (id: string, group: string, depth: number, extra: Partial<TagConcept> = {}): TagConcept =>
  ({ id, group, depth, ...extra });

function pair(a: TagConcept, b: TagConcept): TagConcept[] {
  a.opposite = b.id; b.opposite = a.id; return [a, b];
}

// W7 per-skill growth (t1 ≈ 6 for all; ceilings diverge)
const G_APEX = 1.90, G_SOCIAL = 1.84, G_CRAFTY = 1.66, G_MINOR = 1.55, G_FOOD = 1.50;

export const CONCEPTS: TagConcept[] = [
  // type / gender / race / kind — identity
  C('character', 'type', 1), C('relic', 'type', 1), C('stackable', 'type', 1),
  C('male', 'gender', 1), C('female', 'gender', 1),
  C('human', 'race', 1), C('wolfman', 'race', 1), C('elf', 'race', 1), C('lizardman', 'race', 1),
  // kinds — gold/debt (§9b W18) + evidence/mess (liability kinds per §7.1/§10 supersession)
  C('gold', 'kind', 1), C('debt', 'kind', 1), C('evidence', 'kind', 1), C('mess', 'kind', 1),
  C('obedient', 'status', 1),
  C('interrogated', 'status', 1),

  // W1 personality — 7 opposite-pairs, all flat, all value 0
  ...pair(C('cool', 'personality', 1), C('hotheaded', 'personality', 1)),
  ...pair(C('serious', 'personality', 1), C('playful', 'personality', 1)),
  ...pair(C('greedy', 'personality', 1), C('generous', 'personality', 1)),
  ...pair(C('loner', 'personality', 1), C('gregarious', 'personality', 1)),
  ...pair(C('lustful', 'personality', 1), C('chaste', 'personality', 1)),
  ...pair(C('dominant', 'personality', 1), C('submissive', 'personality', 1)),
  ...pair(C('calculating', 'personality', 1), C('instinctive', 'personality', 1)),

  // W2/W3 background — 16 vocations, per-word depth caps
  C('ruler', 'background', 20), C('soldier', 'background', 20), C('criminal', 'background', 20),
  C('priest', 'background', 20), C('mystic', 'background', 20), C('artisan', 'background', 20),
  C('adventurer', 'background', 20), C('entertainer', 'background', 20),
  C('merchant', 'background', 16), C('scholar', 'background', 16), C('courtesan', 'background', 16),
  C('sailor', 'background', 16), C('slave', 'background', 16),
  C('hunter', 'background', 12),
  C('peasant', 'background', 10), C('servant', 'background', 10),

  // W4/W5 body — stat pairs (one per attribute) + non-stat leftovers
  ...pair(C('muscular', 'body', 20, { statAttr: 'str' }), C('scrawny', 'body', 4, { statAttr: 'str', negative: true })),
  ...pair(C('nimble', 'body', 20, { statAttr: 'dex' }), C('clumsy', 'body', 4, { statAttr: 'dex', negative: true })),
  ...pair(C('clever', 'body', 16, { statAttr: 'int' }), C('dull', 'body', 4, { statAttr: 'int', negative: true })),
  ...pair(C('beautiful', 'body', 20, { statAttr: 'cha' }), C('ugly', 'body', 4, { statAttr: 'cha', negative: true })),
  ...pair(C('tough', 'body', 20, { statAttr: 'con' }), C('sickly', 'body', 4, { statAttr: 'con', negative: true })),
  ...pair(C('tall', 'body', 6, { zeroValue: true }), C('short', 'body', 6, { zeroValue: true })),
  ...pair(C('endowed', 'body', 16), C('flat', 'body', 4, { negative: true })),

  // W6/W7 skill — 16 skills, uniform depth 20, per-skill growth
  C('melee', 'skill', 20, { growth: G_APEX }), C('ranged', 'skill', 20, { growth: G_APEX }),
  C('leadership', 'skill', 20, { growth: G_APEX }),
  C('magic-fire', 'skill', 20, { growth: G_APEX, appearOdds: 0.01 }),
  C('magic-earth', 'skill', 20, { growth: G_APEX, appearOdds: 0.01 }),
  C('magic-water', 'skill', 20, { growth: G_APEX, appearOdds: 0.01 }),
  C('magic-dark', 'skill', 20, { growth: G_APEX, appearOdds: 0.005 }),
  C('social', 'skill', 20, { growth: G_SOCIAL }),
  C('roguery', 'skill', 20, { growth: G_CRAFTY }), C('lore', 'skill', 20, { growth: G_CRAFTY }),
  C('heal', 'skill', 20, { growth: G_CRAFTY }), C('craft', 'skill', 20, { growth: G_CRAFTY }),
  C('nature', 'skill', 20, { growth: G_MINOR }), C('performance', 'skill', 20, { growth: G_MINOR }),
  C('intimidation', 'skill', 20, { growth: G_MINOR }),
  C('food', 'skill', 20, { growth: G_FOOD }),

  // W8/W9 standing — 3 apex value lines (all depth 20, t20 ≈ 1.19M)
  ...pair(
    C('famous', 'standing', 20, { appearOdds: 0.02 }),
    // §9b W17: objects may be famous, never infamous — infamy is earned by deeds (characters only)
    C('infamous', 'standing', 20, { appearOdds: 0.02, domainOverride: 'character' })),
  C('high-born', 'standing', 20, { appearOdds: 0.006, domainOverride: 'character' }),

  // W10/W11 relic form — 9 broad categories, uniform depth 20, tier embodies material+craft
  C('melee-weapon', 'form', 20), C('ranged-weapon', 'form', 20), C('armor', 'form', 20),
  C('clothes', 'form', 20), C('accessory', 'form', 20), C('document', 'form', 20),
  C('curio', 'form', 20), C('decoration', 'form', 20), C('furniture', 'form', 20),

  // W12 relic style — exactly-1, flat, ~0 value
  C('human-style', 'style', 1), C('wolfkin-style', 'style', 1), C('elven-style', 'style', 1),
  C('lizardkin-style', 'style', 1), C('ancient', 'style', 1), C('exotic', 'style', 1),

  // W13 relic trait — 4 opposite-pairs
  ...pair(C('r-beautiful', 'rtrait', 20), C('r-ugly', 'rtrait', 4, { negative: true })),
  ...pair(C('decorative', 'rtrait', 6, { zeroValue: true }), C('simple', 'rtrait', 6, { zeroValue: true })),
  ...pair(C('sturdy', 'rtrait', 6, { zeroValue: true }), C('fragile', 'rtrait', 6, { zeroValue: true })),
  ...pair(C('heavy', 'rtrait', 6, { zeroValue: true }), C('light', 'rtrait', 6, { zeroValue: true })),

  // W14–W16 enchantments — 8, uniform depth 20 apex, tiny odds
  ...(['fire', 'earth', 'water', 'dark', 'might', 'swiftness', 'presence', 'vigor'] as const)
    .map(w => C(w, 'enchantment', 20, { appearOdds: 0.015 })),
];

export const CONCEPT: Record<string, TagConcept> = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));

// ---- tag instances ---------------------------------------------------------------

export interface TagInstance { concept: string; tier?: number }

export const T = (concept: string, tier?: number): TagInstance =>
  CONCEPT[concept]?.depth === 1 ? { concept } : { concept, tier: tier ?? 1 };

export function hasTag(tags: TagInstance[], concept: string): boolean {
  return tags.some(t => t.concept === concept);
}
export function tierOf(tags: TagInstance[], concept: string): number {
  return tags.find(t => t.concept === concept)?.tier ?? 0;
}
export function groupOf(concept: string): string { return CONCEPT[concept]?.group ?? '?' }
export function tagsInGroup(tags: TagInstance[], group: string): TagInstance[] {
  return tags.filter(t => groupOf(t.concept) === group);
}

// ---- value (§8 curve, W7 growth weights) --------------------------------------------

/** value of a single tag instance in gold */
export function tagValue(tag: TagInstance): number {
  const c = CONCEPT[tag.concept];
  if (!c) return 0;
  if (GROUPS[c.group]?.identity || c.zeroValue) return 0;
  const t = tag.tier ?? 1;
  const g = c.growth ?? 1.9;
  const v = 6 * Math.pow(g, t - 1);
  if (c.negative) return -v;
  if (c.depth === 1) return 6;
  return v;
}
export function tagsValue(tags: TagInstance[]): number {
  return tags.reduce((s, t) => s + tagValue(t), 0);
}

// ---- bands & the AI language (§9b `word (rank)` lock) --------------------------------

export type Rank = 'low' | 'mid' | 'high' | 'legendary';
export const RANKS: readonly Rank[] = ['low', 'mid', 'high', 'legendary'];

/** band index 0..3 for a tier, mapped proportionally over the concept's depth */
export function bandOf(concept: string, tier: number): number {
  const depth = CONCEPT[concept]?.depth ?? 20;
  if (depth <= 1) return 0;
  return Math.min(3, Math.floor(((tier - 1) / depth) * 4));
}
export function rankOf(concept: string, tier: number): Rank { return RANKS[bandOf(concept, tier)]! }

/** the band's tier window for a concept (for rolling a tier within an AI-requested rank) */
export function bandWindow(concept: string, rank: Rank): [number, number] {
  const depth = CONCEPT[concept]?.depth ?? 20;
  const i = RANKS.indexOf(rank);
  const lo = Math.floor((i / 4) * depth) + 1;
  const hi = Math.max(lo, Math.floor(((i + 1) / 4) * depth));
  return [Math.min(lo, depth), Math.min(hi, depth)];
}

/** render one tag for the AI: flat → bare word; tiered → `word (rank)`; enchantment label-rendered */
export function renderTag(tag: TagInstance): string {
  const c = CONCEPT[tag.concept];
  if (!c) return tag.concept;
  const word = tag.concept.replace(/^r-/, ''); // relic trait ids are engine-side
  const body = c.depth === 1 ? word : `${word} (${rankOf(tag.concept, tag.tier ?? 1)})`;
  return GROUPS[c.group]?.labelRendered ? `${c.group}: ${body}` : body;
}

/** render a card's tags for the AI (drops type:*, salience order: identity → tiered desc value → flats) */
export function renderTags(tags: TagInstance[]): string {
  const visible = tags.filter(t => groupOf(t.concept) !== 'type' && groupOf(t.concept) !== 'kind');
  const identity = visible.filter(t => ['gender', 'race', 'style'].includes(groupOf(t.concept)));
  const tiered = visible.filter(t => !identity.includes(t) && (CONCEPT[t.concept]?.depth ?? 1) > 1)
    .sort((a, b) => Math.abs(tagValue(b)) - Math.abs(tagValue(a)));
  const flats = visible.filter(t => !identity.includes(t) && (CONCEPT[t.concept]?.depth ?? 1) === 1);
  return [...identity, ...tiered, ...flats].map(renderTag).join('; ');
}

/** parse an AI `word (rank)` back to concept + rank; returns null for unknown words (guarded) */
export function parseAiTag(s: string): { concept: string; rank: Rank | null } | null {
  const m = s.trim().toLowerCase().match(/^(?:\w+:\s*)?([a-z-]+(?:\s[a-z-]+)*)\s*(?:\((low|mid|high|legendary)\))?$/);
  if (!m) return null;
  const word = m[1]!.replace(/\s+/g, '-');
  let id = CONCEPT[word] ? word : CONCEPT[`r-${word}`] ? `r-${word}` : null;
  if (!id) {
    // stem fallback: ~10% of AI favored words are morphological variants of canon
    // ("healing"→heal, "intimidating"→intimidation) — resolve instead of silently thinning
    id = Object.keys(CONCEPT).find(c => {
      const base = c.replace(/^r-/, '');
      return base.length >= 4 && (word.startsWith(base) || base.startsWith(word)) && Math.abs(base.length - word.length) <= 5;
    }) ?? null;
  }
  if (!id) return null;
  return { concept: id, rank: (m[2] as Rank) ?? null };
}

// ---- content gating (§8) -----------------------------------------------------------

/** maxTier = 2×contentLevel+2 (the ilvl principle) */
export function maxTier(contentLevel: number): number {
  return Math.min(20, 2 * contentLevel + 2);
}

// ---- attribute feeds (§10 / W4-W5) ---------------------------------------------------

/** W4 background→attribute map: 5 pure + 10 split + servant all-5 (6/6/6/6/6) */
export const BACKGROUND_ATTRS: Record<string, Attribute[]> = {
  soldier: ['str'], hunter: ['dex'], scholar: ['int'], ruler: ['cha'], slave: ['con'],
  sailor: ['str', 'dex'], priest: ['str', 'int'], adventurer: ['str', 'cha'], peasant: ['str', 'con'],
  artisan: ['dex', 'int'], entertainer: ['dex', 'cha'], criminal: ['dex', 'con'],
  merchant: ['int', 'cha'], mystic: ['int', 'con'], courtesan: ['cha', 'con'],
  servant: ['str', 'dex', 'int', 'cha', 'con'],
};

/** race → body stat-tag appearOdds bias (W4: race is INDIRECT; wolfkin→muscular/nimble, elf→clever/nimble, lizard→tough) */
export const RACE_BODY_BIAS: Record<string, Partial<Record<string, number>>> = {
  human: {},
  wolfman: { muscular: 2.5, nimble: 1.8, beautiful: 0.6 },
  elf: { clever: 2.2, nimble: 2.0, beautiful: 1.6, muscular: 0.5 },
  lizardman: { tough: 2.5, muscular: 1.4, beautiful: 0.5 },
};

// ---- mutex/validation ---------------------------------------------------------------

/** enforce pickPolicy + opposite pairs; returns violations (empty = valid) */
export function validateTags(tags: TagInstance[]): string[] {
  const errs: string[] = [];
  const byGroup = new Map<string, TagInstance[]>();
  for (const t of tags) {
    const c = CONCEPT[t.concept];
    if (!c) { errs.push(`unknown concept: ${t.concept}`); continue }
    if (t.tier !== undefined && (t.tier < 1 || t.tier > c.depth)) errs.push(`${t.concept} tier ${t.tier} > depth ${c.depth}`);
    (byGroup.get(c.group) ?? byGroup.set(c.group, []).get(c.group)!).push(t);
  }
  for (const [gid, list] of byGroup) {
    const g = GROUPS[gid]!;
    if ((g.pickPolicy === 'exactly-1' || g.pickPolicy === 'at-most-1') && list.length > 1)
      errs.push(`group ${gid}: ${list.length} members (policy ${g.pickPolicy})`);
  }
  const owned = new Set(tags.map(t => t.concept));
  for (const t of tags) {
    const opp = CONCEPT[t.concept]?.opposite;
    if (opp && owned.has(opp)) errs.push(`opposites coexist: ${t.concept} + ${opp}`);
  }
  return errs;
}
