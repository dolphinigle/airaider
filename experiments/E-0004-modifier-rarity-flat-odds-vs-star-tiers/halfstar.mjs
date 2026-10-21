// E-0004 round 2 (designer rulings 2026-10-21): half-star rarity 1★–5★, per-skill mod odds by star, cap 4 mods,
// higher stars commoner as the game goes on, one new battle skill rolled per level up.
//   node halfstar.mjs board <progress 0..1> <seed>   → a tavern board of 5 recruits at that point in the game
//   node halfstar.mjs career <seed>                   → one 4★ merc from Lv1 to Lv12, a skill per level
//   node halfstar.mjs stats [n]                       → odds tables + pull mix + career numbers
import { SKILLS, MODS, MERCS } from '../E-0003-autobattler-vs-coin-tests/skills-mock2/gen.mjs';
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (r, table) => { let x = r() * table.reduce((a, b) => a + b, 0), i = 0; while ((x -= table[i]) > 0) i++; return i; };

const STARS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const WHOLE = {                                        // per skill: chance of 0/1/2/3/4 mods (%); half stars average their neighbours
  1: [88, 12, 0, 0, 0], 2: [75, 23, 2, 0, 0], 3: [60, 33, 6, 1, 0], 4: [45, 42, 11, 1.98, 0.02], 5: [30, 50, 16, 3.9, 0.1] };
const odds = st => Number.isInteger(st) ? WHOLE[st] : WHOLE[st - 0.5].map((x, i) => (x + WHOLE[st + 0.5][i]) / 2);
const PULL_EARLY = [30, 22, 18, 12, 8, 5, 3, 1.5, 0.5];   // 1★ … 5★ at the start of a game
const PULL_LATE = [8, 10, 14, 16, 16, 14, 11, 7, 4];      // at the end; in between, mixed by progress
const pull = p => PULL_EARLY.map((e, i) => e * (1 - p) + PULL_LATE[i] * p);
const START_SKILLS = 2, LEVELS = 12;
const NAMES = ['Atlas', 'Brann', 'Hulda', 'Mira', 'Oswin', 'Sela', 'Kettle', 'Ivo', 'Rusk', 'Teodor', 'Wren', 'Galla', 'Fenn', 'Ysolde', 'Bram', 'Odo'];

const fitting = s => Object.keys(MODS).filter(m => MODS[m].fits.some(t => SKILLS[s].tags.includes(t)) && !(SKILLS[s].not || []).includes(m));
const rollMods = (r, cores, s, star) => { const k = pick(r, odds(star)), have = [];
  const pool = fitting(s).map(m => ({ m, w: MODS[m].w.some(c => cores.includes(c)) ? 4 : 1 }));
  for (let i = 0; i < k && pool.length; i++) have.push(pool.splice(pick(r, pool.map(x => x.w)), 1)[0].m); return have; };
const offer = (r, tmpl) => tmpl.kit[Math.floor(r() * tmpl.kit.length)];   // the merc's skills decide which battle skills can come up

function recruit(r, p, name, star) {
  const tmpl = Object.values(MERCS)[Math.floor(r() * 6)];
  star ??= STARS[pick(r, pull(p))];
  const known = tmpl.kit.slice(0, START_SKILLS).map(s => ({ s, mods: rollMods(r, tmpl.cores, s, star), lv: 1 }));
  return { name, tmpl, star, known };
}
const levelUp = (r, m, lv) => { const s = offer(r, m.tmpl); m.known.push({ s, mods: rollMods(r, m.tmpl.cores, s, m.star), lv }); };
const stars = st => '★'.repeat(Math.floor(st)) + (st % 1 ? '½' : '') + '';
const line = k => `${k.s}${k.mods.length ? '  +' + k.mods.join(' +') : ''}${k.mods.length >= 2 ? '   ' + '◆'.repeat(k.mods.length) : ''}`;
const head = m => `${m.name} ${stars(m.star)} · ${m.tmpl.who.split('. ')[0].split(', ')[1]} · ${m.tmpl.cores.join(', ')}`;

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'board') {
  const r = rng(+a2 || 1), p = +a1 || 0, names = [...NAMES].sort(() => r() - 0.5);
  console.log(`TAVERN BOARD (game progress ${Math.round(p * 100)}%)`);
  for (const nm of names.slice(0, 5)) { const m = recruit(r, p, nm); console.log(head(m) + '\n' + m.known.map(k => '   ' + line(k)).join('\n') + '\n'); }
} else if (cmd === 'career') {
  const r = rng(+a1 || 1), m = recruit(r, 0.5, 'Brann', +a2 || 4);
  console.log(head(m)); m.known.forEach(k => console.log(`   Lv1  ${line(k)}`));
  for (let lv = 2; lv <= LEVELS; lv++) { levelUp(r, m, lv); console.log(`   Lv${String(lv).padEnd(3)}${line(m.known.at(-1))}`); }
} else if (cmd === 'stats') {
  const n = +a1 || 100000, f = x => x.toFixed(x < 1 ? 2 : 1).padStart(5);
  console.log('per skill: chance of 0 / 1 / 2 / 3 / 4 mods');
  for (const st of STARS) console.log(`  ${String(st).padEnd(3)}★ ${odds(st).map(f).join(' ')}`);
  console.log('\nrecruit star mix (%), 1★ … 5★');
  for (const p of [0, 0.5, 1]) { const t = pull(p), s = t.reduce((a, b) => a + b, 0); console.log(`  progress ${String(p * 100).padStart(3)}%: ${t.map(x => f(100 * x / s)).join(' ')}`); }
  console.log(`\na full career (${START_SKILLS} start skills + ${LEVELS - 1} level ups = ${START_SKILLS + LEVELS - 1} battle skills), equip the best 4`);
  for (const st of [1, 2, 3, 4, 5]) {
    const r = rng(st * 99); let two = 0, three = 0, four = 0, anyMod = 0, best4 = 0;
    for (let i = 0; i < n; i++) {
      const m = recruit(r, 0.5, 'x', st); for (let lv = 2; lv <= LEVELS; lv++) levelUp(r, m, lv);
      const c = m.known.map(k => k.mods.length).sort((a, b) => b - a);
      anyMod += c.filter(x => x).length; best4 += c.slice(0, 4).reduce((a, b) => a + b, 0);
      if (c[0] >= 2) two++; if (c[0] >= 3) three++; if (c[0] >= 4) four++;
    }
    console.log(`  ${st}★: skills with a mod ${(anyMod / n).toFixed(1)} · mods on the best 4 ${(best4 / n).toFixed(1)} · has a 2+ skill ${(100 * two / n).toFixed(0)}% · 3+ ${(100 * three / n).toFixed(1)}% · 4 ${(100 * four / n).toFixed(2)}%`);
  }
}
