import { BOND, TIE, QUALITIES, THINGS, OCCASIONS, PEOPLE, UNCANNY, MOODS } from '../src/ai/keywords.js';
const pools: [string, string[]][] = [['BOND', BOND], ['TIE', TIE], ['QUALITIES', QUALITIES],
  ['THINGS', THINGS], ['OCCASIONS', OCCASIONS], ['PEOPLE', PEOPLE], ['UNCANNY', UNCANNY], ['MOODS', MOODS]];
// a crude but honest proxy for "a twelve-year-old knows it": long words and -ion/-ism/-ity/-ance
// endings are the abstract-latinate register the style bar bans.
const HARD = /(tion|sion|ism|ity|ance|ence|ment|ude|acy|ary|ure)$/;
for (const [name, p] of pools) {
  const hard = p.filter(w => HARD.test(w) || w.length >= 11);
  const short = p.filter(w => w.length <= 5);
  console.log(`${name.padEnd(10)} n=${String(p.length).padStart(4)}  latinate/long ${String(hard.length).padStart(3)} (${Math.round(100*hard.length/p.length)}%)  ≤5 letters ${String(short.length).padStart(3)} (${Math.round(100*short.length/p.length)}%)`);
  console.log(`           hard: ${hard.slice(0, 14).join(', ')}`);
}
const everyday = ['sword','rope','horse','bread','knife','axe','boot','cart','dog','key','coin','well','fire','door','bone','cloak','bow','salt','goat','nail'];
const all = new Set(pools.flatMap(([, p]) => p));
console.log(`\nplain everyday words present: ${everyday.filter(w => all.has(w)).join(', ') || 'NONE'}`);
console.log(`missing: ${everyday.filter(w => !all.has(w)).join(', ')}`);
