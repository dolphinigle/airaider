// Pure-engine self-test: validates tags, generation, and the roll's success curve
// by simulation. No AI, no network. Run: npm test
import { rngFrom } from './rng.js';
import { canonicalTag, canonicalTags, promptVocabBlock, tagLabel, allTags } from './tags.js';
import {
  BALANCE, generateCharacter, splitValue, resolveRoll, coinsFor, thresholdFor,
  attrsAtLevel, rollBaseAttrs, rollTalents, estimateOdds, overlap,
} from './economy.js';
import type { CharacterCard, TagInstance } from './types.js';

let pass = 0, fail = 0;
function ok(cond: boolean, msg: string) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } }
function section(s: string) { console.log('\n— ' + s); }

// ---- tags -------------------------------------------------------------------
section('tags');
ok(canonicalTag('soldier') === 'bg:soldier', 'bare suffix → id');
ok(canonicalTag('bg:soldier') === 'bg:soldier', 'prefixed → id');
ok(canonicalTag('tag:bg:soldier') === 'bg:soldier', 'tag: prefixed → id');
ok(canonicalTag('Soldier') === 'bg:soldier', 'cased → id');
ok(canonicalTag('wizard') === null, 'unknown → null');
ok(canonicalTags(['brave', 'xyz', 'weapon']).length === 2, 'drops unknowns');
ok(canonicalTags(['brave', 'brave']).length === 1, 'dedupes');
ok(tagLabel('skill:weapon', 1) === 'Master Weapon', 'tier-1 skill label keeps the noun');
ok(tagLabel('phys:muscular', 1) === 'Herculean', 'tier-1 phys label');
ok(tagLabel('bg:noble') === 'Noble', 'flat label');
console.log('  vocab block:\n' + promptVocabBlock().split('\n').map((l) => '    ' + l).join('\n'));
ok(new Set(allTags().map((t) => t.word)).size === allTags().length, 'suffixes globally unique');

// ---- generation (UNIT_GENERATION §1+§2a: independent rolls; distribution SHAPED so E[value]≈target) ----
section('generateCharacter — independent rolls, expectation tracks achievable targets');
{
  // achievable (small/mid) targets: the calibrated mean lands on target; the roll keeps real variance
  for (const [tgt, lvl] of [[20, 1], [45, 2], [55, 3]] as Array<[number, number]>) {
    const n = 250; const vals: number[] = [];
    let manySkills = 0;
    for (let i = 0; i < n; i++) {
      const g = generateCharacter(rngFrom(`g${tgt}.${i}`), { targetValue: tgt, level: lvl });
      vals.push(g.value);
      if (g.tags.filter((t) => t.id.startsWith('skill:')).length > 3) manySkills++;
      ok(g.tags.some((t) => t.id.startsWith('gender:')) && g.tags.some((t) => t.id.startsWith('race:')), 'has identity (mandatory)');
      ok(g.value >= 0, 'value is sane');
    }
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const max = Math.max(...vals);
    console.log(`  target=${tgt} (L${lvl}): mean=${mean.toFixed(0)} (${(mean / tgt * 100).toFixed(0)}%) max=${max}`);
    ok(mean > tgt * 0.82 && mean < tgt * 1.22, `E[value]≈target at ${tgt}`);
    ok(max > mean * 1.3, `right-leaning tail exists at ${tgt} (a lucky roll is a standout)`);
    ok(manySkills === 0, 'skill cap respected');
  }
  // the saga focal targets maxCharValue — the LEVEL'S MAX, so the distribution saturates below it by
  // design (as strong as the level allows; the bank pads the gap with gold). Assert it's still PRIZE
  // money and the tail can exceed the nominal target.
  for (const lvl of [1, 3]) {
    const m = 150; const vals: number[] = [];
    for (let i = 0; i < m; i++) vals.push(generateCharacter(rngFrom(`f${lvl}.${i}`), { targetValue: BALANCE.maxCharValue(lvl), level: lvl, maxSkills: 2 }).value);
    const mean = vals.reduce((a, b) => a + b, 0) / m;
    ok(mean > BALANCE.maxCharValue(lvl) * 0.6, `focal mean is prize-worthy at lvl${lvl}`);
    ok(Math.max(...vals) > BALANCE.maxCharValue(lvl), `a lucky focal can exceed the nominal max at lvl${lvl}`);
  }
}

// ---- the success curve: level-L merc on level-L quest should be ~winnable ---
section('roll success curve (matched level, decent fit)');
function makeMerc(seed: string, level: number, favored: string[]): CharacterCard {
  const r = rngFrom(seed);
  const tags: TagInstance[] = favored.map((id) => ({ id, tier: 3 }));
  const base = rollBaseAttrs(r, tags);
  const talents = rollTalents(r);
  return {
    id: seed, class: 'character', name: seed, role: 'merc', tags, value: 0, location: 'roster',
    createdCycle: 0, attrs: attrsAtLevel(base, talents, level), base: undefined as never,
    talents, level, xp: 0, quirks: [], chainIds: [], injuries: [],
  } as unknown as CharacterCard;
}
for (const level of [1, 3, 5, 8]) {
  const r = rngFrom('curve' + level);
  const N = 1, trials = 2000;
  let s = 0, p = 0, f = 0;
  const test = { attribute: 'physical' as const, favored: ['skill:weapon', 'phys:muscular'], clashing: [] as string[] };
  const merc = makeMerc('m' + level, level, ['skill:weapon', 'phys:muscular']);
  const coins = coinsFor(merc, test);
  const thr = thresholdFor(N, level);
  for (let i = 0; i < trials; i++) {
    const o = resolveRoll(r, coins, thr).outcome;
    if (o === 'success') s++; else if (o === 'partial') p++; else f++;
  }
  const est = estimateOdds(coins, thr);
  // an UNFIT party (wrong attribute, no matching tags) at the same threshold — fit must be a real lever
  const unfit = makeMerc('u' + level, level, []);
  const uCoins = coinsFor(unfit, { attribute: 'charisma', favored: ['skill:song'], clashing: [] });
  let us = 0; for (let i = 0; i < trials; i++) if (resolveRoll(r, uCoins, thr).outcome === 'success') us++;
  console.log(`  L${level}: fit coins=${coins} thr=${thr} → S ${(100 * s / trials).toFixed(0)}% P ${(100 * p / trials).toFixed(0)}% F ${(100 * f / trials).toFixed(0)}%  (est ${(100 * est.success).toFixed(0)}%) | unfit coins=${uCoins} S ${(100 * us / trials).toFixed(0)}%`);
  // a PERFECT fit (two favored tags + biased attrs) may near-guarantee success — the gamble lives at
  // decent fit (right attribute, no tag match ≈ 40-60%), tuned via thresholdPerMerc (2026-06-11).
  ok(s / trials > 0.5 && s / trials < 0.995, `L${level} fit party wins often`);
  ok(us / trials < s / trials - 0.15, `L${level} unfit party clearly worse (fit is a lever)`);
}

// ---- overlap sign -----------------------------------------------------------
section('overlap');
ok(overlap([{ id: 'skill:weapon', tier: 1 }], ['skill:weapon'], []) > 0, 'favored adds');
ok(overlap([{ id: 'pers:cowardly', tier: 3 }], [], ['pers:cowardly']) < 0, 'clashing subtracts');

// ---- splitValue -------------------------------------------------------------
section('splitValue');
{
  const r = rngFrom('split');
  const cap = splitValue(r, 500, 'capture', false);
  ok(cap.some((p) => p.kind === 'captive'), 'capture yields a captive');
  const raid = splitValue(r, 500, 'raid', false);
  ok(raid.reduce((s, p) => s + p.value, 0) === 500 || raid.some((p) => p.kind === 'gold'), 'raid mostly gold');
  const chain = splitValue(r, 500, 'capture', true);
  ok(chain.length === 1 && chain[0].kind === 'recruit', 'chain concentrates');
}

console.log(`\n${fail === 0 ? '✓ ALL' : '✗'} ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
