// The ONE fit primitive (CARDS §2): overlap scores a card's tags against a slot's
// wants. Quests read its SIGN (≥1 favored → flat 0.5U, §16-F2 tier-blind);
// rooms read its MAGNITUDE (matched tag scores by band: 1/2/4/8 — §20).

import { CONCEPT, GROUPS, bandOf, type TagInstance, type Rank, RANKS } from './tags.js';

/** §9b TagQuery: matches a concept OR a whole group, optionally with a band floor */
export interface TagQuery { match: string; minRank?: Rank }

/** a slot's `accepts`: OR over alternatives, each an AND of queries */
export type Accepts = TagQuery[][];

export const ACCEPTS = {
  character: [[{ match: 'character' }]] as Accepts,
  captive: [[{ match: 'character' }]] as Accepts,                       // + role check engine-side
  relicOrObedient: [[{ match: 'relic' }], [{ match: 'character' }, { match: 'obedient' }]] as Accepts,
  gold: [[{ match: 'stackable' }, { match: 'gold' }]] as Accepts,
};

export function queryMatches(tags: TagInstance[], q: TagQuery): boolean {
  for (const t of tags) {
    const c = CONCEPT[t.concept];
    if (!c) continue;
    if (t.concept !== q.match && c.group !== q.match) continue;
    if (q.minRank && c.depth > 1) {
      if (bandOf(t.concept, t.tier ?? 1) < RANKS.indexOf(q.minRank)) continue;
    }
    return true;
  }
  return false;
}

export function acceptsCard(accepts: Accepts, tags: TagInstance[]): boolean {
  return accepts.some(alt => alt.every(q => queryMatches(tags, q)));
}

// ---- quest side: sign reads (dice are tier-blind — §16-F2) ---------------------------

/** does the card own ≥1 of the favored concepts (any tier)? */
export function hasFavored(tags: TagInstance[], favored: string[]): boolean {
  return favored.some(f => tags.some(t => t.concept === f || CONCEPT[t.concept]?.group === f));
}
/** clash = owning ≥1 clashing concept, OR the OPPOSITE of a favored concept (§9b) */
export function hasClash(tags: TagInstance[], favored: string[], clashing: string[]): boolean {
  if (clashing.some(cl => tags.some(t => t.concept === cl))) return true;
  const opposites = favored.map(f => CONCEPT[f]?.opposite).filter(Boolean) as string[];
  return opposites.some(o => tags.some(t => t.concept === o));
}

// ---- room side: magnitude (§20 fill quality) -----------------------------------------

const BAND_SCORE = [1, 2, 4, 8]; // §20: band 1→1 · 2→2 · 3→4 · 4→8 (mild ×2/band, NOT the gold curve)

/**
 * A filled card's contribution to a room's raw comfort vs the room's wanted tags.
 * Exact concept match → full band score of the best matching tag; group-level
 * match → half; no match → small floor (a warm body/any object; the real comfort
 * comes from FIT — this is why dead drops are dead).
 */
export function fillScore(tags: TagInstance[], wants: TagQuery[]): number {
  if (wants.length === 0) return 0.25;
  let best = 0; let groupBest = 0;
  for (const t of tags) {
    const c = CONCEPT[t.concept];
    if (!c || GROUPS[c.group]?.identity && c.group !== 'race' && c.group !== 'style') {
      // identity tags (type/gender/kind/status) never score; race/style DO fit themes
      if (c && (c.group === 'type' || c.group === 'kind' || c.group === 'gender' || c.group === 'status')) continue;
    }
    if (!c) continue;
    const score = BAND_SCORE[bandOf(t.concept, t.tier ?? 1)]!;
    for (const w of wants) {
      if (t.concept === w.match) best = Math.max(best, score);
      else if (c.group === w.match) groupBest = Math.max(groupBest, score / 2);
    }
  }
  return Math.max(best, groupBest, 0.25);
}
