// E-0001 growth sim (designer rule 2026-10-21, gaps filled by Claude, see log):
//   level up = 1 coin on a random talent stat, then 50% a coin on the other talent stat (if any),
//   then 1 coin on a random stat not raised this level. Start = ●● each + race bonus + 2 random coins.
//   node grow.mjs <race> <talent> <talent> [levels=12] [runs=1]
//   ALWAYS3=1 node grow.mjs …  → a missed 50% roll (or no second talent) puts that coin on a random stat instead
const STATS = ['STR', 'DEX', 'INT', 'CHA', 'CON'];
const RACE = { wolfkin: ['DEX'], human: [], dwarf: ['CON'], elf: ['INT'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
const [race = 'human', t1, t2, lv = 12, runs = 1] = process.argv.slice(2);
const talents = [t1, t2].filter(Boolean);
const distinct = [...new Set(talents)];
for (let r = 0; r < runs; r++) {
  const s = Object.fromEntries(STATS.map(k => [k, 2]));
  for (const k of RACE[race] || []) s[k] += 1;
  for (let i = 0; i < 2; i++) s[pick(STATS)] += 1;
  const start = { ...s };
  const log = [];
  for (let L = 2; L <= lv; L++) {
    const up = [];
    const first = pick(distinct);
    up.push(first);
    const second = distinct.find(t => t !== first);
    if (second && Math.random() < 0.5) up.push(second);
    else if (process.env.ALWAYS3) up.push(pick(STATS.filter(k => !up.includes(k))));
    up.push(pick(STATS.filter(k => !up.includes(k))));
    for (const k of up) s[k] += 1;
    log.push(`Lv${L}: ${up.join(' ')}`);
  }
  const fmt = o => STATS.map(k => `${k} ${o[k]}`).join(' · ');
  console.log(`${race} ${talents.map(t => t + '+').join(' ')}\n  start  ${fmt(start)}\n  Lv${lv}   ${fmt(s)}  (total ${STATS.reduce((a, k) => a + s[k], 0)})`);
  if (runs == 1) console.log('  ' + log.join(' | '));
}
