// UNIT VALUE BALANCE — what a quest actually hands over, measured.
// Pure engine (no AI, free): rolls the real pipeline — oneOffValue → splitOneOff → generateCard —
// and reports the distribution of the delivered person's marked value, per level and rarity.
// Usage: npx tsx scripts/unitcurve.ts [samplesPerCell]
import { Rng } from '../src/engine/rng.js';
import { oneOffValue, materializeReward } from '../src/engine/quests.js';
import { splitOneOff, vBase, RARITY_MULT, type Rarity } from '../src/engine/economy.js';
import { CONCEPTS } from '../src/engine/tags.js';
const SKILLS = new Set(CONCEPTS.filter(c => c.group === 'skill').map(c => c.id));

const N = Number(process.argv[2] ?? 4000);
const rng = new Rng(12345);
const pct = (v: number[], p: number) => v[Math.min(v.length - 1, Math.floor(v.length * p))]!;

function cell(level: number, rarity: Rarity) {
  const vals: number[] = [];
  const peaks: number[] = [];      // the highest tier the person ended up with
  for (let i = 0; i < N; i++) {
    const V = oneOffValue(rng, level, rarity, 1);
    const spec = splitOneOff(rng, V, 'rescue', level).find(s => s.kind === 'recruit' || s.kind === 'captive');
    if (!spec) continue;
    const [card] = materializeReward(rng, spec, level, 'forests');
    if (!card) continue;
    vals.push(card.value);
    peaks.push(Math.max(0, ...card.tags.map(t => t.tier ?? 0)));
  }
  vals.sort((a, b) => a - b);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { mean, med: pct(vals, 0.5), p90: pct(vals, 0.9), p99: pct(vals, 0.99), max: vals.at(-1)!,
    lo: pct(vals, 0.05), peak: Math.max(...peaks), n: vals.length };
}

console.log('\nDELIVERED PERSON — marked value, by lead level (common rarity, 1 slot)\n');
console.log('  L   E[V] per ECONOMY   mean    p5     med    p90    p99    max    spread(max/med)');
for (const L of [1, 2, 3, 5, 8, 12, 20, 30]) {
  const c = cell(L, 'common');
  console.log(`${String(L).padStart(3)}   ${Math.round(vBase(L)).toString().padStart(9)}   ` +
    [c.mean, c.lo, c.med, c.p90, c.p99, c.max].map(x => Math.round(x).toString().padStart(6)).join(' ') +
    `   ${(c.max / c.med).toFixed(1)}×`);
}
console.log('\nRARITY — same level (L5), what the rarer leads pay\n');
console.log('  rarity      mult   mean    med    p90    max');
for (const r of ['common', 'uncommon', 'rare'] as Rarity[]) {
  const c = cell(5, r);
  console.log(`  ${r.padEnd(10)} ${String(RARITY_MULT[r]).padStart(4)}   ` +
    [c.mean, c.med, c.p90, c.max].map(x => Math.round(x).toString().padStart(6)).join(' '));
}
console.log('\nTHE TAIL — value is a MARK the generator prices tags TO, so it cannot have a tail by');
console.log('construction. Any "rarely a standout" must live in the SUBSTANCE. At L5 common:\n');
{
  const peak: number[] = [];        // highest tier on the person
  const skills: number[] = [];      // how many skill tags they carry
  const jack: number[] = [];        // best skill tier — what actually makes a unit good in a slot
  for (let i = 0; i < N * 3; i++) {
    const V = oneOffValue(rng, 5, 'common', 1);
    const spec = splitOneOff(rng, V, 'rescue', 5).find(s => s.kind === 'recruit' || s.kind === 'captive');
    if (!spec) continue;
    const [card] = materializeReward(rng, spec, 5, 'forests');
    if (!card) continue;
    peak.push(Math.max(0, ...card.tags.map(t => t.tier ?? 0)));
    const sk = card.tags.filter(t => SKILLS.has(t.concept));
    skills.push(sk.length);
    jack.push(Math.max(0, ...sk.map(t => t.tier ?? 0)));
  }
  const hist = (v: number[], label: string) => {
    const m = new Map<number, number>();
    for (const x of v) m.set(x, (m.get(x) ?? 0) + 1);
    console.log(`  ${label}: ` + [...m.entries()].sort((a, b) => a[0] - b[0])
      .map(([k, n]) => `${k}:${(100 * n / v.length).toFixed(1)}%`).join('  '));
  };
  hist(peak, 'highest tier on the person ');
  hist(skills, 'number of skill tags      ');
  hist(jack, 'best SKILL tier           ');
}

console.log('\nPROGRESSION IN SUBSTANCE — best SKILL tier by level (common). The ceiling rises with');
console.log('content level, so a chase unit is not merely bigger, it is a KIND you could not roll before.\n');
console.log('   L    none    1     2     3     4     5     6     7     8     9    10+   best');
for (const L of [1, 3, 5, 8, 12, 20, 30]) {
  const jack: number[] = [];
  for (let i = 0; i < N; i++) {
    const V = oneOffValue(rng, L, 'common', 1);
    const spec = splitOneOff(rng, V, 'rescue', L).find(s => s.kind === 'recruit' || s.kind === 'captive');
    if (!spec) continue;
    const [card] = materializeReward(rng, spec, L, 'forests');
    if (!card) continue;
    const sk = card.tags.filter(t => SKILLS.has(t.concept));
    jack.push(Math.max(0, ...sk.map(t => t.tier ?? 0)));
  }
  const pc = (f: (x: number) => boolean) => `${(100 * jack.filter(f).length / jack.length).toFixed(1)}`.padStart(5);
  console.log(`${String(L).padStart(4)}  ` + [0,1,2,3,4,5,6,7,8,9].map(t => pc(x => x === t)).join(' ')
    + ' ' + pc(x => x >= 10) + `   ${Math.max(...jack)}`);
}
