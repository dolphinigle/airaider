// THE SEED KIT (docs/STORYTELLER.md North Star 7, designer 2026-10-04): the saga seed as ONE generic situation + a few
// random keyword atoms + the dealt cast, in place of a finished theme from themes.json ("too specific, and it doesn't even
// make sense"). Pure: the caller passes the rng (storyRng in play). The pools are data/seedkit.json, hand-curated; a pool
// grows by editing the file, never by a prompt rule (CHEAP_MODEL_PROMPTING L12: variety comes only from a dealt mandate).
//
// The seed arms the lab compares (scripts/sagalab/seedlab.ts); the game ships `SEED_ARM` (engine/saga.ts):
//   themes               today's: a theme from the library
//   kit                  one situation + 1–3 keywords, each from a different pool
//   kit+pick             one situation + ~10 keywords; a small pick call keeps the 1–3 that fit one clear story
//   kit+pick+situation   as kit+pick, but 3 situations; the pick also chooses the situation
//   kit+pick+premise     kit+pick, then a small premise call writes the story's start in three sentences (the plan's seed)
//   kit+pick+cast        kit+pick, "deal plenty, keep few" for people too: 3–4 supporting people, the same pick call keeps
//                        the 0–1 its story needs (the plan never sees the rest) and chooses the two keywords the plan
//                        gets (measured when it only ranked them, the plan keeping the top two)

import type { Rng } from './rng.js';
import raw from './data/seedkit.json';

export type SeedArm = 'themes' | 'kit' | 'kit+pick' | 'kit+pick+situation' | 'kit+pick+premise' | 'kit+pick+cast';
export const SEED_ARMS: readonly SeedArm[] = ['themes', 'kit', 'kit+pick', 'kit+pick+situation', 'kit+pick+premise', 'kit+pick+cast'];
/** the arms whose seed passes through the pick call */
export const PICKS = new Set<SeedArm>(['kit+pick', 'kit+pick+situation', 'kit+pick+premise', 'kit+pick+cast']);
/** the arms whose pick also keeps the supporting people its story needs (KIT_DEAL.cast) */
export const CASTS = new Set<SeedArm>(['kit+pick+cast']);

export type KitPool = 'things' | 'creatures' | 'places' | 'occasions' | 'uncanny';
export const KIT: Record<KitPool | 'situations' | 'qualities', readonly string[]> = {
  situations: raw.situations, things: raw.things, creatures: raw.creatures, places: raw.places, occasions: raw.occasions,
  qualities: raw.qualities, uncanny: raw.uncanny,
};
/** 🛠 the deal's knobs */
export const KIT_DEAL = {
  /** a thing takes a quality in front of it about 1 in 3 ("a cracked bell"); pipe arm plain (F2) strips it again before the
   *  pick (`plainKeywords`: the draws stay the same, so every other field deals alike) */
  quality: 1 / 3,
  /** the uncanny comes into about 1 saga in 5 */
  uncanny: 0.2,
  /** the pick arms' offer, spread across the pools (10 atoms; + 1 uncanny on an uncanny deal) */
  offer: { things: 3, creatures: 2, places: 3, occasions: 2 } as Record<Exclude<KitPool, 'uncanny'>, number>,
  /** kit+pick+situation: how many situations the pick chooses from */
  situations: 3,
  /** the most keywords the plan gets from a pick: the first the pick names */
  keep: 3,
  /** kit+pick+cast: deal plenty, keep few — 3–4 supporting people coined, of whom the pick keeps at most one; the plan
   *  gets two keywords (a third was the one forced in, seed-arms report N1), and the pick is told so (B1 was measured on a
   *  pick told only to rank them: it ranked seven of ten) */
  cast: { support: [3, 4] as const, keep: 2 },
  /** pipe arm one (B2): the pick chooses the one keyword the plan gets */
  one: 1,
};
const BASE_POOLS: Exclude<KitPool, 'uncanny'>[] = ['things', 'creatures', 'places', 'occasions'];

/** what the dealer dealt for one saga: the situation(s) (none on a personal saga, whose own past is its seed) and the
 *  keyword atoms */
export interface KitDeal { situations: string[]; keywords: string[] }

type AtomPool = KitPool | 'situations';
const atom = (rng: Rng, pool: AtomPool): string => {
  const a = rng.pick(KIT[pool]);
  return pool === 'things' && rng.chance(KIT_DEAL.quality) ? `${rng.pick(KIT.qualities)} ${a}` : a;
};
/** n distinct atoms of one pool (a thing's quality makes its own atom distinct) */
const atoms = (rng: Rng, pool: AtomPool, n: number, have: string[]): string[] => {
  const out: string[] = [];
  for (let i = 0; out.length < n && i < n * 8; i++) { const a = atom(rng, pool); if (!have.includes(a) && !out.includes(a)) out.push(a) }
  return out;
};

/** (pipe arm plain, F2) a thing as dealt with no quality glued on (a quality + a thing is a compound only the dealer made):
 *  any other atom as it is */
export const plainAtom = (x: string): string => {
  const q = KIT.qualities.find(y => x.startsWith(`${y} `));
  return q && KIT.things.includes(x.slice(q.length + 1)) ? x.slice(q.length + 1) : x;
};
/** (pipe arm plain, F2) the keywords with the qualities gone, in deal order; a thing dealt twice is kept once */
export const plainKeywords = (xs: readonly string[]): string[] => [...new Set(xs.map(plainAtom))];

/** ONE deal of the kit, every draw on the rng: the situation(s), then the keywords. `kit` deals 1–3 atoms, each from a
 *  different pool, the uncanny taking one of them about 1 saga in 5; a pick arm deals the whole offer (KIT_DEAL.offer),
 *  shuffled so no pool sits first. A personal saga deals no situation (its seed is the soldier's own past) */
export function dealKit(rng: Rng, arm: Exclude<SeedArm, 'themes'>, personal: boolean): KitDeal {
  const situations = personal ? [] : arm === 'kit+pick+situation' ? atoms(rng, 'situations', KIT_DEAL.situations, []) : [rng.pick(KIT.situations)];
  const keywords: string[] = [];
  if (!PICKS.has(arm)) {
    const n = 1 + rng.int(3);
    const pools: KitPool[] = rng.shuffle([...BASE_POOLS]).slice(0, n);
    if (rng.chance(KIT_DEAL.uncanny)) pools[n - 1] = 'uncanny';
    for (const p of pools) keywords.push(...atoms(rng, p, 1, keywords));
  } else {
    for (const p of BASE_POOLS) keywords.push(...atoms(rng, p, KIT_DEAL.offer[p], keywords));
    if (rng.chance(KIT_DEAL.uncanny)) keywords.push(...atoms(rng, 'uncanny', 1, keywords));
    rng.shuffle(keywords);
  }
  return { situations, keywords };
}
