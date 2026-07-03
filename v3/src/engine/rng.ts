// Seeded, serializable PRNG (sfc32). The RNG state is part of the save
// (GAME_STATE §1) — persisted, never re-derived.

export interface RngState { a: number; b: number; c: number; d: number }

export class Rng {
  private s: RngState;

  constructor(seed: number | RngState) {
    if (typeof seed === 'number') {
      // splitmix32 to spread a single seed into 4 words
      let h = seed >>> 0;
      const next = () => {
        h = (h + 0x9e3779b9) >>> 0;
        let z = h;
        z ^= z >>> 16; z = Math.imul(z, 0x21f0aaad);
        z ^= z >>> 15; z = Math.imul(z, 0x735a2d97);
        z ^= z >>> 15;
        return z >>> 0;
      };
      this.s = { a: next(), b: next(), c: next(), d: next() };
      for (let i = 0; i < 12; i++) this.next(); // warm up
    } else {
      this.s = { ...seed };
    }
  }

  state(): RngState { return { ...this.s } }

  /** uniform float in [0, 1) */
  next(): number {
    const s = this.s;
    const t = (s.a + s.b) >>> 0;
    s.a = s.b ^ (s.b >>> 9);
    s.b = (s.c + (s.c << 3)) >>> 0;
    s.c = ((s.c << 21) | (s.c >>> 11)) >>> 0;
    s.d = (s.d + 1) >>> 0;
    const r = (t + s.d) >>> 0;
    s.c = (s.c + r) >>> 0;
    return r / 4294967296;
  }

  /** integer in [0, n) */
  int(n: number): number { return Math.floor(this.next() * n) }
  /** integer in [lo, hi] inclusive */
  range(lo: number, hi: number): number { return lo + this.int(hi - lo + 1) }
  float(lo: number, hi: number): number { return lo + this.next() * (hi - lo) }
  chance(p: number): boolean { return this.next() < p }
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('pick from empty array');
    return arr[this.int(arr.length)]!;
  }
  /** weighted pick: entries [item, weight] */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    let total = 0;
    for (const [, w] of entries) total += w;
    if (total <= 0) throw new Error('weighted: no positive weights');
    let r = this.next() * total;
    for (const [item, w] of entries) { r -= w; if (r <= 0) return item }
    return entries[entries.length - 1]![0];
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
  /** flip n fair coins, return heads count */
  flipCoins(n: number): number {
    let heads = 0;
    for (let i = 0; i < n; i++) if (this.next() < 0.5) heads++;
    return heads;
  }
  /** random fixed-sum non-negative vector: n cells summing to total.
   *  concentration k = how mild the lean is (1 = wild exponential, 3 = moderate) */
  fixedSumVector(n: number, total: number, concentration = 1): number[] {
    const raw = Array.from({ length: n }, () => {
      let x = 0;
      for (let i = 0; i < concentration; i++) x += -Math.log(1 - this.next());
      return x;
    });
    const sum = raw.reduce((a, b) => a + b, 0);
    return raw.map(x => (x / sum) * total);
  }
}
