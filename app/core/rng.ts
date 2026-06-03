// Seeded RNG (mulberry32 + FNV-1a string seed) — deterministic across machines.
export type Rng = () => number;

export function rngFrom(seed: string | number): Rng {
  let h = typeof seed === 'number' ? seed >>> 0 : fnv1a(seed);
  return function mulberry32() {
    h |= 0; h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export const randInt = (r: Rng, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
export function weightedPick<T>(r: Rng, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let x = r() * total;
  for (const t of items) { x -= weight(t); if (x <= 0) return t; }
  return items[items.length - 1];
}
/** Sample heads out of n coin flips. */
export function flipCoins(r: Rng, n: number): number {
  let heads = 0;
  for (let i = 0; i < n; i++) if (r() < 0.5) heads++;
  return heads;
}
