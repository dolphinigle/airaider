// E-0011 recruit randomness (Claude's draft, 2026-10-23): everything rolled when a merc is made (the starting position, D-0032),
// plus the pre-rolled career (D-0104). Uses E-0007 baseline abilities, E-0009 stats, E-0004 star odds.
//   node recruit.mjs [seed] [progress 0..1]   → three recruits   ·   node recruit.mjs stats [progress]   → mixes over 20000 recruits
import { all } from '../E-0007-ability-brainstorm-per-battle-skill/baseline.mjs';
import { recruit as rollStats, RACES } from '../E-0009-merc-attributes-combat-only/attributes.mjs';
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (r, w) => { let x = r() * w.reduce((a, b) => a + b, 0), i = 0; while ((x -= w[i]) > 0) i++; return i; };
const choose = (r, arr, wf = () => 1) => arr[pick(r, arr.map(wf))];

const STARS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const PULL_EARLY = [30, 22, 18, 12, 8, 5, 3, 1.5, 0.5], PULL_LATE = [8, 10, 14, 16, 16, 14, 11, 7, 4];   // E-0004
const MODS = { 1: [88, 12, 0, 0, 0], 2: [75, 23, 2, 0, 0], 3: [60, 33, 6, 1, 0], 4: [45, 42, 11, 1.98, 0.02], 5: [30, 50, 16, 3.9, 0.1] };
const modOdds = st => Number.isInteger(st) ? MODS[st] : MODS[st - 0.5].map((x, i) => (x + MODS[st + 0.5][i]) / 2);
// a skill's or trait's star: around the merc's star (same 45%, ±½★ 20% each, ±1★ 7.5% each), clamped to 1–5
const near = (r, st) => { const d = [-1, -0.5, 0, 0.5, 1][pick(r, [7.5, 20, 45, 20, 7.5])]; return Math.min(5, Math.max(1, st + d)); };

const BATTLE = all(), WEAPON = new Set(['Two-handed', 'Polearm', 'Weapon and Shield', 'Dual Wield', 'Single Weapon', 'Unarmed', 'Shooting', 'Throwing']);
const MAGIC = new Set(['Fire', 'Frost', 'Lightning', 'Holy', 'Dark']);
const BLOOD = { 'Beast Blood': ['wolfkin', 'catfolk'], 'Ancient Blood': ['dragonkin'] };
const CHECK = { Athletics: 'STR', Survival: 'DEX + CON', Perception: 'DEX', Thievery: 'DEX', Streetwise: 'CHA + INT', Persuasion: 'CHA', Intimidation: 'STR + CHA', Lore: 'INT', Smithing: 'INT + CON', Engineering: 'INT', Cooking: 'CON' };
const PEOPLES = ['northerner', 'western', 'eastern', 'southern'];
const RACE_W = { human: 40, wolfkin: 12, catfolk: 12, elf: 12, dragonkin: 12, orc: 12 };
const PERSONALITY = ['Stubborn', 'Reckless', 'Gruff', 'Cheerful', 'Cautious', 'Greedy', 'Pious', 'Cold'], BODY = ['tall', 'short', 'muscular', 'skinny', 'scarred', 'nimble'];
const DEAL_W = st => [0, 8, 6, 3, 2 + (st - 3), 1].map((w, i) => i >= 3 ? w * (0.5 + st / 4) : w);   // rarer bases likelier at higher skill stars

// D-0114: the engine deals skills (rules applied, no talent lean) and the AI picks the ones that fit the merc; the sim picks at random
const legal = (m, have) => BATTLE.filter(k => !have.some(h => h.name === k.name) && !(WEAPON.has(k.name) && have.some(h => WEAPON.has(h.name)))
  && (!BLOOD[k.name] || BLOOD[k.name].includes(m.race)) && !(BLOOD[k.name] && have.some(h => BLOOD[h.name])));
const deal = (r, pool, n) => { const p = [...pool], out = []; while (out.length < n && p.length) out.push(p.splice(Math.floor(r() * p.length), 1)[0]); return out; };
const aiPick = (r, dealt, n) => deal(r, dealt, n);   // stand-in for the AI's pick
function abilities(r, k, star) {                       // D-0104: all five pre-rolled; first of a weapon/magic skill is a 0-cd attack
  const pool = [...k.abilities], out = [];
  for (let i = 0; i < 5 && pool.length; i++) {
    const elig = pool.filter(a => i > 0 || !(WEAPON.has(k.name) || MAGIC.has(k.name)) || (/^0 cd/.test(a.cost) && /%/.test(a.power)));
    const deal = []; const e = [...elig]; for (let j = 0; j < 3 && e.length; j++) deal.push(e.splice(pick(r, e.map(a => DEAL_W(star)[a.star])), 1)[0]);
    const a = deal[0]; pool.splice(pool.indexOf(a), 1);                              // the AI would pick one of the three; the sim takes the first
    out.push({ at: [1, 3, 5, 7, 9][i], name: a.name, star: a.star, mods: pick(r, modOdds(star)) });
  }
  return out;
}
export function makeRecruit(seed, progress = 0) {
  const r = rng(seed), race = choose(r, Object.keys(RACE_W), x => RACE_W[x]);
  const st = STARS[pick(r, PULL_EARLY.map((e, i) => e * (1 - progress) + PULL_LATE[i] * progress))];
  const base = rollStats(r, race), m = { race, people: race === 'human' ? choose(r, PEOPLES) : null, star: st, stats: base.st, talents: base.talents, hp: base.hp };
  // one AI ask at recruitment (designer): from one battle deal of 8 (at least 3 weapon or magic) it picks the 2 starting skills
  // (one weapon or magic, D-0114) and the 3 the Lv 3 offer will show; from one check deal of 8, the 2 starting and the 3 for Lv 5
  const L = legal(m, []), wmPool = L.filter(k => WEAPON.has(k.name) || MAGIC.has(k.name));
  const bDeal = deal(r, wmPool, 3); bDeal.push(...deal(r, legal(m, bDeal).filter(k => !bDeal.includes(k)), 5));
  const wm = aiPick(r, bDeal.filter(k => WEAPON.has(k.name) || MAGIC.has(k.name)), 1);
  const second = aiPick(r, legal(m, wm).filter(k => bDeal.includes(k)), 1), battle = [...wm, ...second];
  const offer3 = aiPick(r, legal(m, battle).filter(k => bDeal.includes(k)), 3);
  const checks = Object.keys(CHECK), cDeal = deal(r, checks, 8), ck = aiPick(r, cDeal, 2), offer5 = aiPick(r, cDeal.filter(c => !ck.includes(c)), 3);
  const sk = k => { const s = near(r, st); return { name: k.name ?? k, star: s, ...(k.abilities ? { abil: abilities(r, k, s) } : {}) }; };
  Object.assign(m, { battle: battle.map(sk), checks: ck.map(sk), lv3: offer3.map(sk), lv5: offer5.map(sk) });
  const sh = RACES[race];
  m.traits = [{ kind: 'gender', name: choose(r, ['man', 'woman']) }, { kind: 'race', name: race + (sh ? ` (${sh[0]} +1, ${sh[1]} −1)` : '') }, { kind: 'personality', name: choose(r, PERSONALITY) }, { kind: 'body', name: choose(r, BODY) }].map(t => t.kind === 'gender' || t.kind === 'race' ? t : { ...t, star: near(r, st) });   // D-0111: race (and gender) have no star
  if (r() < 0.25) m.traits.push({ kind: 'personality', name: choose(r, PERSONALITY.filter(p => p !== m.traits[2].name)), star: near(r, st) });
  m.generic = !m.battle.some(k => WEAPON.has(k.name) || MAGIC.has(k.name));       // D-0050: generic 0-cd attack as the first ability
  return m;
}
const S = st => `${Math.floor(st)}${st % 1 ? '½' : ''}★`;
const show = m => {
  const L = [`${m.people ? m.people + ' ' : ''}${m.race} ${m.traits[0].name}, merc ${S(m.star)} · ${Object.entries(m.stats).map(([k, v]) => `${k} ${v}`).join(' ')} · talents ${m.talents[0] === m.talents[1] ? m.talents[0] + '++' : m.talents.join('+ ') + '+'} · HP ${m.hp}`,
    `  traits: ${m.traits.map(t => t.kind === 'gender' ? t.name + ' (flavor)' : t.kind === 'race' ? t.name : `${t.name} ${S(t.star)}`).join(', ')}${m.generic ? '  · first ability: a generic attack (no weapon or magic skill)' : ''}`];
  for (const k of m.battle) L.push(`  ${k.name} ${S(k.star)}: ` + k.abil.map(a => `${a.name}${a.mods ? ' ' + '◆'.repeat(a.mods) : ''}`).join(' · '));
  L.push(`  checks: ${m.checks.map(k => `${k.name} ${S(k.star)}`).join(', ')}`);
  L.push(`  Lv 3 offer: ${m.lv3.map(k => `${k.name} ${S(k.star)}`).join(' / ')}   ·   Lv 5 offer: ${m.lv5.map(k => `${k.name} ${S(k.star)}`).join(' / ')}`);
  return L.join('\n');
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const [a, p] = process.argv.slice(2);
  if (a === 'stats') {
    const N = 20000, star = {}, gen = { n: 0 }, mods = [0, 0, 0, 0, 0], rare = [0, 0, 0, 0, 0, 0];
    for (let i = 1; i <= N; i++) { const m = makeRecruit(i, +p || 0); star[m.star] = (star[m.star] || 0) + 1; if (m.generic) gen.n++;
      for (const k of m.battle) for (const x of k.abil) { mods[x.mods]++; rare[x.star]++; } }
    const nA = mods.reduce((a, b) => a + b);
    console.log(`progress ${+p || 0}: merc stars ` + STARS.map(s => `${S(s)} ${((star[s] || 0) / N * 100).toFixed(0)}%`).join(' ') + `\n  starting abilities by mods 0–4: ${mods.map(x => (x / nA * 100).toFixed(1) + '%').join(' / ')} · by base rarity 1★–5★: ${rare.slice(1).map(x => (x / nA * 100).toFixed(0) + '%').join(' / ')} · generic first attack ${(gen.n / N * 100).toFixed(0)}%`);
  } else { for (let i = 0; i < 3; i++) console.log(show(makeRecruit((+a || 1) * 100 + i, +p || 0)) + '\n'); }
}
