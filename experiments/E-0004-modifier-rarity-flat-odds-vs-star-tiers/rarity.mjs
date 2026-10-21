// E-0004: how often modifiers show up on recruits under three rarity schemes.
//   node rarity.mjs board <scheme> <seed>   → a tavern board of 5 recruits, as the player reads it
//   node rarity.mjs stats [n]               → per scheme: mods per merc, 2-mod / 3-mod skill rates, campaign odds
// Schemes: flat (per-skill 40/50/9/1, designer) · flatmerc (one 40/50/9/1 roll per merc, on one skill) · starodds (star sets per-skill odds) · starcount (star fixes the mod count)
import { SKILLS, MODS, MERCS } from '../E-0003-autobattler-vs-coin-tests/skills-mock2/gen.mjs';
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (r, table) => { let x = r() * table.reduce((a, b) => a + b, 0), i = 0; while ((x -= table[i]) > 0) i++; return i; };

const KIT_SIZE = 4;                                   // battle skills per merc (2 open at Lv1, rest unlock with level)
const STAR_PULL = [40, 30, 18, 9, 3];                 // 1★..5★
const STAR_ODDS = [                                   // per skill: 0/1/2/3 mods, by star
  [85, 15, 0, 0], [65, 33, 2, 0], [45, 48, 6, 1], [25, 55, 17, 3], [5, 50, 35, 10]];
const FLAT_ODDS = [40, 50, 9, 1];
const NAMES = ['Atlas', 'Brann', 'Hulda', 'Mira', 'Oswin', 'Sela', 'Kettle', 'Ivo', 'Rusk', 'Teodor', 'Wren', 'Galla', 'Fenn', 'Ysolde', 'Bram', 'Odo'];

const fitting = s => Object.keys(MODS).filter(m => MODS[m].fits.some(t => SKILLS[s].tags.includes(t)) && !(SKILLS[s].not || []).includes(m));
// a mod whose theme matches one of the merc's cores is 4x likelier (as the engine deals candidates in E-0003)
const addMods = (r, cores, s, have, k) => { const pool = fitting(s).filter(m => !have.includes(m)).map(m => ({ m, w: MODS[m].w.some(c => cores.includes(c)) ? 4 : 1 }));
  while (k-- > 0 && pool.length) have.push(pool.splice(pick(r, pool.map(x => x.w)), 1)[0].m); return have; };

function recruit(r, scheme, name = NAMES[Math.floor(r() * NAMES.length)]) {
  const tmpl = Object.values(MERCS)[Math.floor(r() * 6)], cores = tmpl.cores;
  const star = scheme.startsWith('flat') ? 0 : pick(r, STAR_PULL) + 1;
  const kit = tmpl.kit.slice(0, KIT_SIZE).map(s => ({ s, mods: [] }));
  if (scheme === 'flat' || scheme === 'starodds') {
    const odds = scheme === 'flat' ? FLAT_ODDS : STAR_ODDS[star - 1];
    for (const k of kit) addMods(r, cores, k.s, k.mods, pick(r, odds));
  } else if (scheme === 'flatmerc') {
    const k = kit[Math.floor(r() * kit.length)]; addMods(r, cores, k.s, k.mods, pick(r, FLAT_ODDS));
  } else {                                            // starcount: star−1 mods, each on a random skill (max 3 per skill)
    for (let n = star - 1; n > 0; n--) { const open = kit.filter(k => k.mods.length < 3 && fitting(k.s).length > k.mods.length); if (!open.length) break; const k = open[Math.floor(r() * open.length)]; addMods(r, cores, k.s, k.mods, 1); }
  }
  return { name, tmpl, star, kit };
}

const card = m => {
  const head = `${m.name}${m.star ? ' ' + '★'.repeat(m.star) + '☆'.repeat(5 - m.star) : ''} · ${m.tmpl.who.split('. ')[0].split(', ')[1]} · ${m.tmpl.cores.join(', ')}`;
  return [head, ...m.kit.map((k, i) => `   ${['S1 ', 'S2 ', 'Lv6', 'L12'][i]} ${k.s}${k.mods.length ? '  +' + k.mods.join(' +') : ''}${k.mods.length >= 2 ? '   ' + '◆'.repeat(k.mods.length) : ''}`)].join('\n');
};

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'board') {
  const r = rng(+a2 || 1);
  const names = [...NAMES].sort(() => r() - 0.5);
  console.log(`TAVERN BOARD (${a1})\n` + names.slice(0, 5).map(nm => card(recruit(r, a1, nm))).join('\n\n'));
} else if (cmd === 'stats') {
  const n = +a1 || 100000, CAMPAIGN = 40;              // assumed recruits seen per campaign
  for (const scheme of ['flat', 'flatmerc', 'starodds', 'starcount']) {
    const r = rng(42), perMerc = [0, 0, 0, 0, 0, 0]; let s2 = 0, s3 = 0, skills = 0, modded = 0;
    for (let i = 0; i < n; i++) {
      const m = recruit(r, scheme), tot = m.kit.reduce((a, k) => a + k.mods.length, 0);
      perMerc[Math.min(tot, 5)]++;
      for (const k of m.kit) { skills++; if (k.mods.length) modded++; }
      const top = Math.max(...m.kit.map(k => k.mods.length)); if (top === 2) s2++; if (top >= 3) s3++;
    }
    const pct = x => (100 * x / n).toFixed(1) + '%', seen3 = 1 - Math.pow(1 - s3 / n, CAMPAIGN);
    console.log(`\n${scheme}`);
    console.log(`  mods per merc  0:${pct(perMerc[0])}  1:${pct(perMerc[1])}  2:${pct(perMerc[2])}  3:${pct(perMerc[3])}  4:${pct(perMerc[4])}  5+:${pct(perMerc[5])}`);
    console.log(`  skills with any mod ${(100 * modded / skills).toFixed(1)}% · mercs whose best skill has 2 mods ${pct(s2)} · 3 mods ${pct(s3)}`);
    console.log(`  over ${CAMPAIGN} recruits seen: ≥1 three-mod skill ${(100 * seen3).toFixed(0)}% of campaigns`);
  }
}
