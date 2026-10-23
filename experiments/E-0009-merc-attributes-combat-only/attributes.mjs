// E-0009 merc attributes, combat only (Claude's draft, 2026-10-23).
//   node attributes.mjs recruits [seed]  → sample recruits   ·   node attributes.mjs speed  → who acts first   ·   node attributes.mjs luk  → LUK's worth
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const STATS = ['STR', 'DEX', 'INT', 'CHA', 'CON', 'LUK'];
// race leans (placeholder roster; the AI reskins races): +2 and +1 on two stats, −1 on one; human: +1 on two random stats
export const RACES = {
  human: null, wolfkin: ['DEX', 'STR', 'INT'], catfolk: ['DEX', 'LUK', 'CON'], bearkin: ['STR', 'CON', 'DEX'],
  elf: ['INT', 'DEX', 'CON'], dwarf: ['CON', 'STR', 'CHA'], dragonkin: ['CON', 'INT', 'DEX'], giantkin: ['STR', 'CON', 'INT'],
};
export function recruit(r, race) {
  const st = Object.fromEntries(STATS.map(s => [s, 10])), lean = RACES[race];
  if (lean) { st[lean[0]] += 2; st[lean[1]] += 1; st[lean[2]] -= 1; }
  else { const a = STATS[Math.floor(r() * 6)]; let b; do b = STATS[Math.floor(r() * 6)]; while (b === a); st[a]++; st[b]++; }
  const keep = lean ? lean.slice(0, 2) : [], from = STATS.filter(s => !keep.includes(s));
  for (let i = 0; i < 2; i++) { st[from[Math.floor(r() * from.length)]]--; st[STATS[Math.floor(r() * 6)]]++; }  // a little random: two coins move, never off the race's lean
  const w = STATS.map(s => lean && (s === lean[0] || s === lean[1]) ? 2 : 1), draw = () => { let x = r() * w.reduce((a, b) => a + b), i = 0; while ((x -= w[i]) > 0) i++; return STATS[i]; };
  const talents = [draw(), draw()];                                                   // race-lean stats twice as likely
  return { race, st, talents, hp: 30 + 3 * (st.CON - 10) };
}
const binom = (n, p) => { const d = Array(n + 1).fill(0); d[0] = 1; for (let i = 0; i < n; i++) for (let k = i + 1; k > 0; k--) d[k] = d[k] * (1 - p) + d[k - 1] * p, k === 1 && (d[0] *= 1 - p); return d; };
const first = (a, b, p = 0.5) => { const A = binom(a, p), B = binom(b, p); let w = 0; A.forEach((x, i) => B.forEach((y, j) => { w += x * y * (i > j ? 1 : i === j ? 0.5 : 0); })); return w; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, a] = process.argv.slice(2);
  if (cmd === 'recruits') {
    const r = rng(+a || 3);
    for (const race of Object.keys(RACES)) { const m = recruit(r, race); console.log(`${race.padEnd(10)} ${STATS.map(s => `${s} ${String(m.st[s]).padEnd(2)}`).join('  ')}  talents ${m.talents[0] === m.talents[1] ? m.talents[0] + '++' : m.talents.join('+ ') + '+'}  HP ${m.hp}`); }
  } else if (cmd === 'speed') {
    const D = [8, 10, 12, 15, 18, 21];
    console.log('chance the row DEX acts before the column DEX (ties split)\n      ' + D.map(d => String(d).padEnd(6)).join(''));
    for (const x of D) console.log(String(x).padEnd(6) + D.map(y => (first(x, y) * 100).toFixed(0).padStart(3) + '%  ').join(''));
  } else if (cmd === 'luk') {
    for (const per of [0.005, 0.01]) console.log(`${per * 100}% a point: ` + [8, 10, 14, 18, 21].map(l => `LUK ${l} → ${(50 + (l - 10) * per * 100).toFixed(1)}% heads (${((0.5 + (l - 10) * per) / 0.5 * 100 - 100).toFixed(0)}% damage)`).join(' · '));
  }
}
