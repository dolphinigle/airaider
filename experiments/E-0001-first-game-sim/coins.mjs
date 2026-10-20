// E-0001 coin helper: odds and real flips for opposed coin tests.
//   node coins.mjs odds <mine> <theirs>        → P(my heads >= their heads)  (ties go to the merc)
//   node coins.mjs flip <mine> <theirs> [...]  → flip each pair, print faces and result
//   node coins.mjs need <coins> <threshold>    → P(heads >= threshold); flipneed flips it for real
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
const pmf = n => Array.from({ length: n + 1 }, (_, k) => C(n, k) / 2 ** n);
const odds = (a, b) => { const A = pmf(a), B = pmf(b); let p = 0; A.forEach((pa, x) => B.forEach((pb, y) => { if (x >= y) p += pa * pb; })); return p; };
const flip = n => Array.from({ length: n }, () => Math.random() < 0.5);
const faces = f => f.map(h => (h ? '●' : '○')).join('');
const [cmd, ...nums] = process.argv.slice(2);
const n = nums.map(Number);
for (let i = 0; i < n.length; i += 2) {
  const [a, b] = [n[i], n[i + 1]];
  if (cmd === 'need') console.log(`${a} coins, need ${b}: ${Math.round(pmf(a).slice(b).reduce((x, y) => x + y, 0) * 100)}%`);
  else if (cmd === 'flipneed') { const x = flip(a), h = x.filter(Boolean).length; console.log(`${a} coins, need ${b}: ${faces(x)} ${h} → ${h >= b ? 'WIN' : 'LOSE'}`); }
  else if (cmd === 'odds') console.log(`${a} vs ${b}: ${Math.round(odds(a, b) * 100)}%`);
  else { const x = flip(a), y = flip(b), hx = x.filter(Boolean).length, hy = y.filter(Boolean).length;
    console.log(`${a} vs ${b}: merc ${faces(x)} ${hx} · foe ${faces(y)} ${hy} → ${hx >= hy ? 'WIN' : 'LOSE'}`); }
}
