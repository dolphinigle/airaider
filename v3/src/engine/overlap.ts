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

export const BAND_SCORE = [1, 2, 4, 8]; // §20: band 1→1 · 2→2 · 3→4 · 4→8 (mild ×2/band, NOT the gold curve)
/** a tag of the wanted GROUP (not the exact concept) scores this share of its band score */
export const GROUP_FIT = 0.5;

/** WHICH tag earned a card's fill score, and how — the score and the reason are ONE read, so the
 *  explanation the UIs print (Game.slotWhy) can never drift from the number. `full` = an exact
 *  concept match (scored by the tag's band), `half` = a tag of the wanted GROUP (half that),
 *  `none` = no match (the floor), `nowants` = the room wants nothing (the floor). */
export interface FillDetail { score: number; fit: 'full' | 'half' | 'none' | 'nowants'; tag: TagInstance | null; want: string | null }
const FLOOR = 0.25;

export function fillDetail(tags: TagInstance[], wants: TagQuery[]): FillDetail {
  if (wants.length === 0) return { score: FLOOR, fit: 'nowants', tag: null, want: null };
  let best: FillDetail | null = null; let groupBest: FillDetail | null = null;
  for (const t of tags) {
    const c = CONCEPT[t.concept];
    if (!c) continue;
    // identity tags (type/gender/kind/status) never score; race/style/personality DO fit themes
    if (GROUPS[c.group]?.identity && (c.group === 'type' || c.group === 'kind' || c.group === 'gender' || c.group === 'status')) continue;
    const score = BAND_SCORE[bandOf(t.concept, t.tier ?? 1)]!;
    for (const w of wants) {
      if (t.concept === w.match) { if (!best || score > best.score) best = { score, fit: 'full', tag: t, want: w.match } }
      else if (c.group === w.match) { if (!groupBest || score * GROUP_FIT > groupBest.score) groupBest = { score: score * GROUP_FIT, fit: 'half', tag: t, want: w.match } }
    }
  }
  // a match always beats the floor (a band score is ≥1, a group share of it ≥0.5)
  const pick = best && (!groupBest || best.score >= groupBest.score) ? best : groupBest;
  return pick ?? { score: FLOOR, fit: 'none', tag: null, want: null };
}

/**
 * A filled card's contribution to a room's raw comfort vs the room's wanted tags.
 * Exact concept match → full band score of the best matching tag; group-level
 * match → half; no match → small floor (a warm body/any object; the real comfort
 * comes from FIT — this is why dead drops are dead).
 */
export function fillScore(tags: TagInstance[], wants: TagQuery[]): number {
  return fillDetail(tags, wants).score;
}
