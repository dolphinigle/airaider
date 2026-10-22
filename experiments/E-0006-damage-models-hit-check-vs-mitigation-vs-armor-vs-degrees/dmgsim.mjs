// E-0006: damage models for coin-flip combat. A merc flips A coins; h = heads ~ Binomial(A, ½).
// Exact binomial math for means / P(0) / CV; seeded Monte Carlo only for attacks-to-kill and sample logs.
//   node dmgsim.mjs [n] [seed]   → tables per curve, kill test, three-merc ratios, two-flip status odds, sample logs
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const C = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return c; };
const pmf = A => Array.from({ length: A + 1 }, (_, h) => C(A, h) / 2 ** A);
const flip = (r, A) => Array.from({ length: A }, () => r() < 0.5);

const CURVES = { 'OLD curve (Lv1 / Lv12 untalented / Lv12 talented)': [3, 6, 13], 'FLAT curve (Lv1 / Lv12 untalented / Lv12 talented)': [10, 15, 21] };
const n0 = s => String(+s.toFixed(1));
const MODELS = [
  { id: 'M1 HitCheck', note: 'D=12, hit iff h > T', sweep: [0, 2, 4, 6, 8, 10], std: 4, lab: d => `T=${d}`,
    dmg: (h, T) => h > T ? 12 : 0, log: (h, T) => `${h} heads vs DEF ${T} → ${h > T ? 'HIT 12' : 'MISS'}` },
  { id: 'M2 Mitigate', note: 'dmg = h × 2.5 × (1 − p)', sweep: [0, 20, 40, 60, 80, 90], std: 20, lab: d => `p=${d}%`,
    dmg: (h, p) => h * 2.5 * (1 - p / 100), log: (h, p) => `${h} heads × 2.5 −${p}% → ${n0(h * 2.5 * (1 - p / 100))}` },
  { id: 'M3 ArmorSubtract', note: 'dmg = 3 × max(0, h − K)', sweep: [0, 1, 2, 3, 4, 6], std: 1, lab: d => `K=${d}`,
    dmg: (h, K) => 3 * Math.max(0, h - K), log: (h, K) => `${h} heads − ARMOR ${K} → ${Math.max(0, h - K)} × 3 = ${3 * Math.max(0, h - K)}` },
  { id: 'M4 Degrees', note: 'h < T graze 6 · T ≤ h < T+3 hit 12 · h ≥ T+3 crit 24', sweep: [0, 2, 4, 6, 8, 10], std: 4, lab: d => `T=${d}`,
    dmg: (h, T) => h < T ? 6 : h < T + 3 ? 12 : 24, log: (h, T) => `${h} heads vs DEF ${T} → ${h < T ? 'GRAZE 6' : h < T + 3 ? 'HIT 12' : 'CRIT 24'}` },
];
const stats = (A, m, d) => { const p = pmf(A); let mu = 0, m2 = 0, z = 0;
  p.forEach((q, h) => { const x = m.dmg(h, d); mu += q * x; m2 += q * x * x; if (x === 0) z += q; });
  return { mu, sd: Math.sqrt(Math.max(0, m2 - mu * mu)), z }; };
const pct = x => x === 0 ? '0%' : x < 0.005 ? '<1%' : x > 0.995 && x < 1 ? '>99%' : `${Math.round(100 * x)}%`;
const W = 13, cell = s => s.padStart(W);

const [nArg, sArg] = process.argv.slice(2), N = +nArg || 100000, SEED = +sArg || 6;
for (const m of MODELS) {
  console.log(`\n=== ${m.id}: ${m.note}   (cell = mean dmg (P zero dmg); CV at standard ${m.lab(m.std)})`);
  for (const [name, As] of Object.entries(CURVES)) {
    console.log(`  ${name}\n  ${'A'.padEnd(4)}${m.sweep.map(d => cell(m.lab(d))).join('')}${cell('CV@std')}`);
    for (const A of As) { const s = stats(A, m, m.std);
      console.log(`  ${String(A).padEnd(4)}${m.sweep.map(d => { const t = stats(A, m, d); return cell(`${t.mu.toFixed(1)} (${pct(t.z)})`); }).join('')}${cell(s.mu ? (s.sd / s.mu).toFixed(2) : '—')}`); }
  }
}

const HP = 40, kill = (r, A, m, d) => { let hp = HP, k = 0; while (hp > 0 && k < 1000) { hp -= m.dmg(flip(r, A).filter(Boolean).length, d); k++; } return k; };
console.log(`\n=== KILL TEST: flat curve, foe HP ${HP}, standard defense, ${N} fights (seed ${SEED})`);
console.log(`  ${'model'.padEnd(22)}${'A'.padEnd(4)}${'mean'.padStart(7)}${'p10'.padStart(5)}${'p90'.padStart(5)}${'≥2×mean'.padStart(10)}`);
for (const m of MODELS) for (const A of [10, 21]) {
  const r = rng(SEED * 1000 + A), ks = Array.from({ length: N }, () => kill(r, A, m, m.std)).sort((a, b) => a - b);
  const mean = ks.reduce((a, b) => a + b, 0) / N, fr = ks.filter(k => k >= 2 * mean).length / N;
  console.log(`  ${(m.id + ' ' + m.lab(m.std)).padEnd(22)}${String(A).padEnd(4)}${mean.toFixed(2).padStart(7)}${String(ks[Math.floor(N * 0.1)]).padStart(5)}${String(ks[Math.floor(N * 0.9)]).padStart(5)}${(100 * fr).toFixed(1).padStart(9)}%`);
}

console.log('\n=== SAME FOE, THREE MERCS: flat curve, standard defense, mean dmg A=10 / 15 / 21 and ratios');
for (const m of MODELS) { const [a, b, c] = [10, 15, 21].map(A => stats(A, m, m.std).mu);
  console.log(`  ${(m.id + ' ' + m.lab(m.std)).padEnd(22)}${a.toFixed(1).padStart(6)}${b.toFixed(1).padStart(6)}${c.toFixed(1).padStart(6)}   21:15 ${(c / b).toFixed(2)}   21:10 ${(c / a).toFixed(2)}`); }

const tail = (S, k) => pmf(S).slice(k).reduce((a, b) => a + b, 0);
console.log('\n=== M5 TwoFlip: amount = A × 2.5 per head (M2 p=0, mean 1.25 × A); status lands iff skill flip of S coins ≥ 2 heads');
console.log(`  ${'S'.padEnd(10)}${[1, 2, 3, 4, 6].map(S => String(S).padStart(7)).join('')}`);
console.log(`  ${'lands ≥2'.padEnd(10)}${[1, 2, 3, 4, 6].map(S => pct(tail(S, 2)).padStart(7)).join('')}`);
console.log('  grid: P(skill heads ≥ k)');
for (const k of [1, 2, 3]) console.log(`  ${('k=' + k).padEnd(10)}${[1, 2, 3, 4, 6].map(S => (100 * tail(S, k)).toFixed(1).concat('%').padStart(7)).join('')}`);

console.log(`\n=== SAMPLE LOGS: Brann A=10 vs the standard-defense foe, 6 attacks each (seed ${SEED})`);
for (const m of MODELS) { const r = rng(SEED); console.log(`  ${m.id} (${m.lab(m.std)})`);
  for (let i = 0; i < 6; i++) { const c = flip(r, 10); console.log(`    Brann  ${c.map(x => x ? '●' : '○').join('')}  ${m.log(c.filter(Boolean).length, m.std)}`); } }
