// How does the game actually proportion a quest's reward today?
import { Rng } from '../src/engine/rng.js';
import { splitOneOff, vBase, RARITY_MULT } from '../src/engine/economy.js';
import type { Archetype } from '../src/engine/quests.js';

const rng = new Rng(31337);
const ARCH: Archetype[] = ['raid', 'capture', 'rescue', 'escort', 'investigate', 'hunt', 'contract', 'lead-hunt'];
const rows: Record<string, { n: number; parts: number[]; shape: Record<string, number> }> = {};
for (const a of ARCH) {
  const r = rows[a] = { n: 0, parts: [], shape: {} };
  for (let i = 0; i < 20000; i++) {
    const specs = splitOneOff(rng, 100, a, 1);          // V = 100 so every share reads as a %
    r.n++; r.parts.push(specs.length);
    const key = specs.map(s => s.kind).sort().join('+');
    r.shape[key] = (r.shape[key] ?? 0) + 1;
  }
}
console.log('per archetype — how many pieces the reward comes in, and the shapes it takes\n');
for (const [a, r] of Object.entries(rows)) {
  const avg = (r.parts.reduce((x, y) => x + y, 0) / r.n).toFixed(2);
  const three = Math.round(100 * r.parts.filter(p => p >= 3).length / r.n);
  const top = Object.entries(r.shape).sort((x, y) => y[1] - x[1]).slice(0, 3)
    .map(([k, v]) => `${k} ${Math.round(100 * v / r.n)}%`).join(' · ');
  console.log(`${a.padEnd(12)} pieces ${avg}  (3+ pieces: ${String(three).padStart(2)}%)   ${top}`);
}
// what the pieces are actually WORTH at a typical early-game quest
console.log('\nwhat one piece is worth on a level-2 common 2-slot quest (V ≈ ' + Math.round(vBase(2) * RARITY_MULT.common * 2) + '):');
const V = vBase(2) * RARITY_MULT.common * 2;
for (const a of ['hunt', 'capture', 'raid'] as Archetype[]) {
  const specs = splitOneOff(new Rng(5), V, a, 2);
  console.log(`  ${a.padEnd(10)} ${specs.map(s => `${s.kind} ${Math.round(s.value)}`).join(' + ')}`);
}
// where does the value actually GO, across a campaign's mix of archetypes?
const tot: Record<string, number> = {}; let all = 0;
const rng2 = new Rng(4242);
for (let i = 0; i < 60000; i++) {
  const a = ARCH[Math.floor(rng2.float(0, ARCH.length))]!;
  for (const sp of splitOneOff(rng2, 100, a, 1)) { tot[sp.kind] = (tot[sp.kind] ?? 0) + sp.value; all += sp.value }
}
console.log('\nwhere a campaign\'s reward value GOES (equal archetype mix):');
for (const [k, v] of Object.entries(tot).sort((x, y) => y[1] - x[1]))
  console.log(`  ${k.padEnd(9)} ${String(Math.round(100 * v / all)).padStart(3)}%`);
console.log('\nthe tag curve, for scale: t1 6 · t2 11 · t3 22 · t4 41 · t5 78 · t6 149');
