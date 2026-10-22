// E-0008 merc level up, combat only (Claude's draft, 2026-10-23). One merc from Lv 1 to Lv 12 under the proposed XP curve.
// Ruled: three coins per level led by talents (D-0018); coins = attribute + skill level (D-0069); stat passives (D-0081).
// Placeholders until the skill-ups step: skill level +1 per merc level from 1 (cap 10); new ability at skill levels 1, 3, 5, 7, 9.
// Working: max HP = 3 × CON; LUK 50% heads at 10, ±0.5% per point.
//   node career.mjs [seed]   → the career table   ·   node career.mjs stats   → averages over 5000 careers
import { all } from '../E-0007-ability-brainstorm-per-battle-skill/baseline.mjs';
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// fights won at the merc's level to reach the next level (Lv 1→2 is index 0); XP = 100 a fight, 200 a boss
export const FIGHTS = [2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16];
export const XP_TO_NEXT = FIGHTS.map(f => f * 100);
// quest size by merc level, for the sample (D-0052: 1–2 fights early, ~4 fights + a boss late)
const questFights = lv => lv <= 2 ? 2 : lv <= 4 ? 3 : lv <= 7 ? 4 : 5;

const STATS = ['STR', 'DEX', 'INT', 'CHA', 'CON', 'LUK'];
const SK = Object.fromEntries(all().map(k => [k.name, k]));
const DEAL_W = [0, 8, 6, 3, 2, 1];                     // placeholder odds by ability star when an ability is dealt

function levelUp(r, m) {                               // D-0018: exactly three coins, at most one per stat
  const got = new Set(), [t1, t2] = m.talents, rand = () => { const pool = STATS.filter(s => !got.has(s)); return pool[Math.floor(r() * pool.length)]; };
  if (t1 === t2) { got.add(t1); got.add(rand()); }                            // ++: no second talented stat, so coin 2 is random
  else { const [a, b] = r() < 0.5 ? [t1, t2] : [t2, t1]; got.add(a); got.add(r() < 0.5 ? b : rand()); }
  got.add(rand());
  for (const s of got) m.st[s]++;
  return [...got];
}
function newAbility(r, m, skill) {
  const pool = SK[skill].abilities.filter(a => !m.known.some(k => k.name === a.name) && (m.known.length || /^0 cd/.test(a.cost) && /%/.test(a.power)));
  const deal = []; for (let i = 0; i < 3 && pool.length; i++) { let x = r() * pool.reduce((s, a) => s + DEAL_W[a.star], 0), j = 0; while ((x -= DEAL_W[pool[j].star]) > 0) j++; deal.push(pool.splice(j, 1)[0]); }
  const a = deal[0]; m.known.push({ ...a, skill }); return a;
}
const coins = (m, skill) => { const at = SK[skill].attr.split(' + '); return at.reduce((s, x) => s + m.st[x], 0) / at.length + m.sk[skill]; };
const heads = m => 0.5 + (m.st.LUK - 10) * 0.005;
// expected damage of a 100% hit with the main skill, STR passive included (1% increased per point from 10)
const hit = (m, skill) => coins(m, skill) * heads(m) * (1 + (m.st.STR - 10) / 100);

export function career(seed, opt = {}) {
  const r = rng(seed);
  const m = { name: 'Brann', race: 'wolfkin', talents: opt.talents || ['STR', 'CON'], skills: ['Two-handed', 'Beast Blood'], lv7: 'Survivor',
    st: { STR: 11, DEX: 11, INT: 9, CHA: 10, CON: 11, LUK: 10 }, sk: {}, known: [] };
  const rows = [], gain = (skill, lv) => { m.sk[skill] = Math.min(10, (m.sk[skill] || 0) + 1); return [1, 3, 5, 7, 9].includes(m.sk[skill]) ? newAbility(r, m, skill) : null; };
  const lvl1 = m.skills.map(s => gain(s)).filter(Boolean);
  let fights = 0, quests = 0;
  rows.push({ lv: 1, fights, quests, coins: [], abil: lvl1, ...snap(m) });
  for (let lv = 2; lv <= 12; lv++) {
    const need = FIGHTS[lv - 2]; let done = 0; while (done < need) { const q = questFights(lv - 1); done += q; quests++; }
    fights += need;                                      // overflow ignored in the sample
    const c = levelUp(r, m), abil = [];
    if (lv === 7) m.skills.push(m.lv7);
    for (const s of m.skills) { const a = gain(s); if (a) abil.push(a); }
    rows.push({ lv, fights, quests, coins: c, abil, ...snap(m) });
  }
  return { m, rows };
}
function snap(m) { return { st: { ...m.st }, sk: { ...m.sk }, hp: 3 * m.st.CON, spd: m.st.DEX, atk: coins(m, 'Two-handed'), dmg: hit(m, 'Two-handed') }; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv[2];
  if (a === 'stats') {
    const N = 5000, acc = Array.from({ length: 12 }, () => ({ dmg: 0, hp: 0, STR: 0, CON: 0, DEX: 0 }));
    for (let i = 0; i < N; i++) career(i + 1).rows.forEach((x, j) => { acc[j].dmg += x.dmg; acc[j].hp += x.hp; acc[j].STR += x.st.STR; acc[j].CON += x.st.CON; acc[j].DEX += x.st.DEX; });
    const d1 = acc[0].dmg / N;
    console.log('lv  STR   CON   DEX   HP    hit (vs Lv1)');
    acc.forEach((x, j) => console.log(`${String(j + 1).padEnd(3)} ${(x.STR / N).toFixed(1).padEnd(5)} ${(x.CON / N).toFixed(1).padEnd(5)} ${(x.DEX / N).toFixed(1).padEnd(5)} ${(x.hp / N).toFixed(0).padEnd(5)} ${(x.dmg / N / d1 * 100).toFixed(0)}%`));
  } else {
    const { rows } = career(+a || 7), d1 = rows[0].dmg;
    console.log('lv  fights quests | STR DEX INT CHA CON LUK | coins this level | HP  speed | Two-handed coins  hit | new abilities');
    for (const x of rows) console.log(`${String(x.lv).padEnd(3)} ${String(x.fights).padEnd(6)} ${String(x.quests).padEnd(6)} | ${STATS.map(s => String(x.st[s]).padEnd(3)).join(' ')} | ${(x.coins.join(' ') || '—').padEnd(16)} | ${String(x.hp).padEnd(3)} ${String(x.spd).padEnd(5)} | ${x.atk.toFixed(0).padEnd(16)} ${(x.dmg / d1 * 100).toFixed(0)}% | ${x.abil.map(b => `${b.name} (${b.star}★)`).join(', ')}`);
  }
}
