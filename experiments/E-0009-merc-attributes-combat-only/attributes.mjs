// E-0009 merc attributes, combat only (Claude's draft, 2026-10-23).
//   node attributes.mjs recruits [seed]  → sample recruits   ·   node attributes.mjs speed  → who acts first   ·   node attributes.mjs luk  → LUK's worth
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const STATS = ['STR', 'DEX', 'INT', 'CHA', 'CON', 'LUK'];
// race leans (designer, 2026-10-23: +1 to one stat, −1 to another, so races don't force builds; placeholder roster, the AI reskins races)
export const RACES = {
  human: null, wolfkin: ['DEX', 'INT'], catfolk: ['CHA', 'CON'], elf: ['INT', 'CON'], dragonkin: ['CON', 'DEX'], orc: ['STR', 'CHA'],   // D-0108; human peoples are flavor only
};
export const MOVES = 3;                                // random coin moves: each takes 1 from a random stat and gives it to another
export function recruit(r, race) {
  const st = Object.fromEntries(STATS.map(s => [s, 10])), any = () => STATS[Math.floor(r() * 6)];
  for (let i = 0; i < MOVES; i++) { let a, b; do { a = any(); b = any(); } while (a === b || st[a] <= 8 || st[b] >= 12); st[a]--; st[b]++; }  // RNG, kept within 8–12
  let lean = RACES[race]; if (!lean) { const a = any(); let b; do b = any(); while (b === a); lean = [a, b]; }               // human: a random +1 / −1
  st[lean[0]]++; st[lean[1]]--;
  const talents = [any(), any()];                      // unweighted: race doesn't steer talents
  return { race, st, talents, hp: 30 + 3 * (st.CON - 10) };
}
const binom = (n, p) => { const d = Array(n + 1).fill(0); d[0] = 1; for (let i = 0; i < n; i++) for (let k = i + 1; k > 0; k--) d[k] = d[k] * (1 - p) + d[k - 1] * p, k === 1 && (d[0] *= 1 - p); return d; };
const first = (a, b, p = 0.5) => { const A = binom(a, p), B = binom(b, p); let w = 0; A.forEach((x, i) => B.forEach((y, j) => { w += x * y * (i > j ? 1 : i === j ? 0.5 : 0); })); return w; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, a] = process.argv.slice(2);
  if (cmd === 'recruits') {
    const r = rng(+a || 3);
    for (const race of Object.keys(RACES)) { const m = recruit(r, race); console.log(`${race.padEnd(10)} ${STATS.map(s => `${s} ${String(m.st[s]).padEnd(2)}`).join('  ')}  talents ${m.talents[0] === m.talents[1] ? m.talents[0] + '++' : m.talents.join('+ ') + '+'}  HP ${m.hp}`); }
  } else if (cmd === 'spread') {
    const r = rng(1), N = 20000, hist = {}; let spread = 0;
    for (let i = 0; i < N; i++) { const m = recruit(r, 'human'); for (const s of STATS) hist[m.st[s]] = (hist[m.st[s]] || 0) + 1; spread += Math.max(...STATS.map(s => m.st[s])) - Math.min(...STATS.map(s => m.st[s])); }
    console.log('starting stat values (all stats, human): ' + Object.keys(hist).sort((a, b) => a - b).map(k => `${k}: ${(hist[k] / N / 6 * 100).toFixed(0)}%`).join('  ') + `  · highest − lowest stat, average ${(spread / N).toFixed(1)}`);
  } else if (cmd === 'speed') {
    const D = [8, 10, 12, 15, 18, 21];
    console.log('chance the row DEX acts before the column DEX (ties split)\n      ' + D.map(d => String(d).padEnd(6)).join(''));
    for (const x of D) console.log(String(x).padEnd(6) + D.map(y => (first(x, y) * 100).toFixed(0).padStart(3) + '%  ').join(''));
  } else if (cmd === 'luk') {
    for (const per of [0.005, 0.01]) console.log(`${per * 100}% a point: ` + [8, 10, 14, 18, 21].map(l => `LUK ${l} → ${(50 + (l - 10) * per * 100).toFixed(1)}% heads (${((0.5 + (l - 10) * per) / 0.5 * 100 - 100).toFixed(0)}% damage)`).join(' · '));
  }
}
