// DESIGN ANALYSIS (not implementation): what ratios do lead bonuses actually land on?
// The bonus is reserved on the SOURCE quest; the lead it mints is an independent roll, so the
// band is a convolution of two draws. Thresholds should be set from this, not guessed.
import { Rng } from '../src/engine/rng.js';
import { splitOneOff, vBase, RARITY_MULT, type Rarity } from '../src/engine/economy.js';
import { oneOffValue, slotCount, rollFreshLead } from '../src/engine/quests.js';
import type { Archetype } from '../src/engine/quests.js';

// mirrors the (unexported) list in quests.ts, plus lead-hunt which the faucet posts
const ONE_OFF_ARCHETYPES: Archetype[] = ['raid', 'capture', 'rescue', 'escort', 'investigate', 'hunt', 'contract'];
const SOURCE_ARCHETYPES: Archetype[] = [...ONE_OFF_ARCHETYPES, 'lead-hunt'];

const rng = new Rng(20260828);

/** what the lead's own quest is expected to be worth — level, rarity and archetype are all
 *  known at mint time; only the ±20% roll and the roster clamp are not, and both wash out */
function expectedSlots(a: Archetype, r: Rarity): number {
  let lo = 0, hi = 0, n = 0;
  for (let i = 0; i < 4000; i++) { const s = slotCount(rng, a, r); lo += s; n++; hi = Math.max(hi, s) }
  return lo / n;
}
const SLOTS: Record<string, number> = {};
for (const a of ONE_OFF_ARCHETYPES) for (const r of ['common', 'uncommon', 'rare'] as Rarity[])
  SLOTS[`${a}:${r}`] = expectedSlots(a, r);

const baseV = (lvl: number, rar: Rarity, arch: Archetype) =>
  vBase(lvl) * RARITY_MULT[rar] * SLOTS[`${arch}:${rar}`]!;

const ratios: number[] = [];
const bySource: Record<string, number[]> = {};
for (let i = 0; i < 30000; i++) {
  // a source quest somewhere in the campaign's range
  const ghTier = 1 + Math.floor(rng.float(0, 5));
  const level = 1 + Math.floor(rng.float(0, 8));
  const rarity = (['common', 'uncommon', 'rare'] as const)[Math.floor(rng.float(0, 3))]!;
  const arch = SOURCE_ARCHETYPES[Math.floor(rng.float(0, SOURCE_ARCHETYPES.length))]!;
  const V = oneOffValue(rng, level, rarity, slotCount(rng, arch, rarity));
  for (const spec of splitOneOff(rng, V, arch, level)) {
    if (spec.kind !== 'lead') continue;
    // the lead that gets minted is an INDEPENDENT roll — its own level/rarity/archetype
    const lead = rollFreshLead(rng, {
      cycle: 0, unlockedRegions: ['forests'], ghTier, rosterLevels: [level, level], hasDungeon: true,
    }, () => 'lead-x', 'reward');
    const r = spec.value / baseV(lead.level, lead.rarity, lead.archetype);
    ratios.push(r);
    (bySource[arch === 'lead-hunt' ? 'lead-hunt (the faucet)' : 'other quests (lottery / hunt-investigate)'] ??= []).push(r);
  }
}
ratios.sort((a, b) => a - b);
const pc = (p: number) => ratios[Math.floor(ratios.length * p)]!.toFixed(2);
console.log(`${ratios.length} banded leads\n`);
console.log(`ratio percentiles  p10 ${pc(.1)} · p25 ${pc(.25)} · p50 ${pc(.5)} · p75 ${pc(.75)} · p90 ${pc(.9)} · p97 ${pc(.97)} · max ${ratios[ratios.length - 1]!.toFixed(1)}`);
for (const [k, v] of Object.entries(bySource)) {
  v.sort((a, b) => a - b);
  console.log(`  ${k.padEnd(46)} n=${String(v.length).padEnd(6)} median ${v[Math.floor(v.length / 2)]!.toFixed(2)}`);
}
console.log('\nband spread at candidate thresholds:');
for (const t of [[0.3, 0.8, 1.6], [0.25, 0.75, 2.0], [0.4, 1.0, 2.5], [0.5, 1.25, 3.0]]) {
  const c = [0, 0, 0, 0];
  for (const r of ratios) c[r <= t[0]! ? 0 : r <= t[1]! ? 1 : r <= t[2]! ? 2 : 3]!++;
  const pct = c.map(x => `${Math.round(100 * x / ratios.length)}%`);
  console.log(`  ≤${t[0]} ≤${t[1]} ≤${t[2]}   coins ${pct[0]!.padStart(4)} · purse ${pct[1]!.padStart(4)} · chest ${pct[2]!.padStart(4)} · fortune ${pct[3]!.padStart(4)}`);
}
