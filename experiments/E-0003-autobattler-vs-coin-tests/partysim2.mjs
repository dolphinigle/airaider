// E-0003 party sim v2: Live A Hero-style skill slots + lootable tactic books.
// Each merc has up to 4 skills (S1-S4) drawn from their core skills. On their turn a merc uses the first READY skill in
// slot order (cooldown done, mana enough, makes sense). Tactic books override: "if <condition> → use S<k>".
// Slots and book slots unlock with level: Lv1 = 2 skills, 0 books · Lv6 = 3 skills, 1 book · Lv12 = 4 skills, 2 books.
// Only mercs flip (D-0013). Losing injures, never kills (D-0024).
//   node partysim2.mjs play <lv> <foe> <seed> [config-json]   one fight, dev text log
//   node partysim2.mjs calibrate                              foe HP per level+foe so the default setup wins ~55%
//   node partysim2.mjs study [n]                              default vs random vs best (coordinate search) per level+foe

const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---- skills, each from a core skill (docs/design/mercs.md) ----
// pool = coins flipped; cd = cooldown in rounds; mana = cost
const SK = {
  chop:     { core: 'Heavy Weapons', kind: 'strike', pool: 5, cd: 0 },
  cleave:   { core: 'Heavy Weapons', kind: 'strike2', pool: 4, cd: 2 },          // hits two front foes
  wall:     { core: 'Defense', kind: 'wall', cd: 3 },                             // taunt 2 rounds, +2 block coins
  expose:   { core: 'Arcane Lore', kind: 'expose', pool: 3, cd: 3 },              // mark: +1 dmg per hit (+2 vs undead), 2 rounds
  slash:    { core: 'Light Weapons', kind: 'strike', pool: 4, cd: 0 },
  lunge:    { core: 'Light Weapons', kind: 'strike', pool: 6, cd: 2 },
  snarl:    { core: 'Intimidation', kind: 'scare', pool: 5, cd: 3 },              // weakest foe flees if heads >= its HP
  wind:     { core: 'Survival', kind: 'selfheal', pool: 4, cd: 99 },              // once per fight, only below 50%
  staff:    { core: 'Elemental Magic', kind: 'strike', pool: 2, cd: 0, reach: true },
  bolt:     { core: 'Elemental Magic', kind: 'strike', pool: 5, cd: 0, mana: 1, reach: true },
  wave:     { core: 'Elemental Magic', kind: 'wave', pool: 5, cd: 1, mana: 3 },   // every foe takes heads-1
  focus:    { core: 'Arcane Lore', kind: 'focus', cd: 3 },                        // +3 mana
  mace:     { core: 'Holy Magic', kind: 'strike', pool: 2, cd: 0 },
  heal:     { core: 'Holy Magic', kind: 'heal', pool: 5, cd: 0, mana: 2 },
  smite:    { core: 'Holy Magic', kind: 'strike', pool: 3, cd: 0, mana: 1, reach: true, holy: true },  // x2 vs undead
  bless:    { core: 'Holy Magic', kind: 'bless', cd: 4, mana: 3 },                // party +1 coin, 2 rounds
};
// kit in unlock order (the default S-order is unlock order)
const MERCS = [
  { name: 'Brann', row: 'front', hp: 12, armor: 3, spd: 2, kit: ['chop', 'wall', 'cleave', 'expose'] },
  { name: 'Atlas', row: 'front', hp: 10, armor: 1, spd: 4, kit: ['slash', 'lunge', 'snarl', 'wind'] },
  { name: 'Mira', row: 'back', hp: 6, armor: 0, spd: 3, mana: 6, kit: ['staff', 'bolt', 'wave', 'focus'] },
  { name: 'Oswin', row: 'back', hp: 8, armor: 1, spd: 1, mana: 6, kit: ['mace', 'heal', 'smite', 'bless'] },
];
const LEVELS = { 1: { skills: 2, books: 0, coin: 0, hp: 0 }, 6: { skills: 3, books: 1, coin: 1, hp: 3 }, 12: { skills: 4, books: 2, coin: 2, hp: 6 } };

// ---- tactic books (lootable): a condition; the player picks which slot it fires ----
const BOOKS = {
  undead:   { label: 'vs undead', test: s => s.foes.some(f => f.undead) },
  allyLow:  { label: 'ally < 50%', test: s => s.mercs.some(a => a.hp / a.max < 0.5) },
  selfLow:  { label: 'self < 50%', test: (s, m) => m.hp / m.max < 0.5 },
  lowMana:  { label: 'low mana', test: (s, m) => m.mana !== undefined && m.mana < 3 },
  crowd:    { label: '3+ foes', test: s => s.foes.length >= 3 },
  healer:   { label: 'foe healer', test: s => s.foes.some(f => f.heals) },
  boss:     { label: 'vs boss', test: s => s.foes.some(f => f.boss) },
  opening:  { label: 'first round', test: s => s.round === 1 },
};

const FOES = {
  road: [...[1, 2, 3, 4].map(i => ({ name: `Bandit ${i}`, hp: 4, dmg: 2, armor: 0, spd: 3, row: 'front' })),
    { name: 'Crossbow', hp: 4, dmg: 2, armor: 0, spd: 2, row: 'back', ranged: true },
    { name: 'Red Hob', hp: 10, dmg: 3, armor: 1, spd: 2, row: 'front', boss: true }],
  barrow: [...[1, 2, 3].map(i => ({ name: `Skeleton ${i}`, hp: 5, dmg: 2, armor: 1, spd: 2, row: 'front', undead: true })),
    { name: 'Barrow-wight', hp: 8, dmg: 2, armor: 0, spd: 3, row: 'back', ranged: true, undead: true, drain: true }],
  wolves: [1, 2, 3, 4, 5, 6].map(i => ({ name: `Wolf ${i}`, hp: 3, dmg: 2, armor: 0, spd: 5, row: 'front' })),
  ogre: [{ name: 'Ogre', hp: 24, dmg: 5, armor: 1, spd: 1, row: 'front', boss: true }],
  cult: [{ name: 'Cultist 1', hp: 6, dmg: 2, armor: 1, spd: 2, row: 'front' }, { name: 'Cultist 2', hp: 6, dmg: 2, armor: 1, spd: 2, row: 'front' },
    { name: 'Blood Priest', hp: 5, dmg: 1, armor: 0, spd: 3, row: 'back', heals: 3 }],
};
// SHARP=1: twists that a single universal slot order can't cover
if (process.env.SHARP) {
  FOES.barrow.forEach(f => { if (f.name.startsWith('Skeleton')) f.armor = 3; });                 // blades barely scratch bone; holy x2 and expose +2 still bite
  FOES.ogre[0].enrage = true;                                                                    // below half HP the ogre hits twice as hard
  FOES.imps = [1, 2, 3, 4, 5].map(i => ({ name: `Ember Imp ${i}`, hp: 3, dmg: 2, armor: 0, spd: 4, row: 'front', immune: 'Elemental Magic' }));
}
// foe HP multiplier per level+foe (from `calibrate`)
let KHG = {};

const faces = f => f.map(h => (h ? '●' : '○')).join('');
// default = unlocked skills, free basic attacks (no cooldown, no mana) sorted last; no books
const isBasic = id => !SK[id].cd && !SK[id].mana;
const defaultConfig = lv => MERCS.map(m => { const k = m.kit.slice(0, LEVELS[lv].skills); return { order: [...k.filter(x => !isBasic(x)), ...k.filter(isBasic)], books: [] }; });

function fight(lv, foeKey, seed, config, verbose, kh) {
  const L = LEVELS[lv], r = rng(seed), out = [], say = s => verbose && out.push(s);
  const flip = n => { const f = []; for (let i = 0; i < n; i++) f.push(r() < 0.5); return f; };
  const K = kh ?? KHG[`${lv}:${foeKey}`] ?? 1;
  const mercs = MERCS.map((m, i) => ({ ...m, side: 'merc', hp: m.hp + L.hp, max: m.hp + L.hp, mana: m.mana, maxMana: m.mana, cds: {}, taunt: 0, wall: 0, order: config[i].order, books: config[i].books }));
  const foes = FOES[foeKey].map(f => { const hp = Math.max(1, Math.round(f.hp * K)); return { ...f, hp, max: hp, side: 'foe', mark: 0 }; });
  let round = 0, party = 0, low = 1, flips = 0;
  const alive = xs => xs.filter(x => x.hp > 0);
  const st = () => ({ mercs: alive(mercs), foes: alive(foes), round });
  const front = () => { const f = alive(foes).filter(x => x.row === 'front'); return f.length ? f : alive(foes); };
  const weakest = xs => xs.reduce((a, b) => (b.hp < a.hp ? b : a));
  const backline = xs => xs.find(x => x.heals) || xs.find(x => x.ranged) || weakest(xs);
  const ready = (m, id) => {
    const s = SK[id]; if ((m.cds[id] || 0) > 0) return false; if (s.mana && (m.mana ?? 0) < s.mana) return false;
    if (s.kind === 'heal') return alive(mercs).some(a => a.max - a.hp >= 3);
    if (s.kind === 'wall') return m.wall === 0;
    if (s.kind === 'selfheal') return m.hp / m.max < 0.5;
    if (s.kind === 'focus') return m.mana <= m.maxMana - 3;
    if (s.kind === 'bless') return party === 0;
    if (s.kind === 'expose') return alive(foes).some(f => f.mark === 0);
    if (s.kind === 'strike2') return front().length >= 2;
    return true;
  };
  const dmgTo = (t, h, s) => { if (t.immune === s.core) return 0; let d = Math.max(0, h - t.armor); if (d > 0 && t.mark) d += t.undead ? 2 : 1; if (s.holy && t.undead) d *= 2; t.hp -= d; return d; };
  const use = (m, id) => {
    const s = SK[id], pool = (s.pool || 0) + L.coin + (party ? 1 : 0);
    m.cds[id] = s.cd + 1; if (s.mana) m.mana -= s.mana;
    const f = s.pool ? flip(pool) : [], h = f.filter(Boolean).length; flips += f.length;
    const fall = t => (t.hp <= 0 ? ` ${t.name.toUpperCase()} FALLS` : '');
    if (s.kind === 'strike') { const list = s.reach ? alive(foes) : front(); const t = s.reach ? backline(list) : weakest(list); const d = dmgTo(t, h, s); say(`  ${m.name} ${id} → ${t.name} ${faces(f)} ${d}${fall(t)}`); }
    else if (s.kind === 'strike2') { const ts = [...front()].sort((a, b) => a.hp - b.hp).slice(0, 2); say(`  ${m.name} cleave ${faces(f)} → ` + ts.map(t => `${t.name} ${dmgTo(t, h, s)}${fall(t)}`).join(', ')); }
    else if (s.kind === 'wave') { const hit = Math.max(0, h - 1); say(`  ${m.name} wave ${faces(f)} → ${hit} to all` + alive(foes).map(t => { const d = dmgTo(t, hit, s); return t.hp <= 0 ? ` ${t.name.toUpperCase()} FALLS` : ''; }).join('')); }
    else if (s.kind === 'heal') { const t = alive(mercs).reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a)); t.hp = Math.min(t.max, t.hp + h); say(`  ${m.name} heal → ${t.name} ${faces(f)} +${h} (${t.hp}/${t.max})`); }
    else if (s.kind === 'selfheal') { m.hp = Math.min(m.max, m.hp + h); say(`  ${m.name} second wind ${faces(f)} +${h}`); }
    else if (s.kind === 'wall') { m.wall = 2; m.taunt = 2; say(`  ${m.name} SHIELD WALL: foes come at him, +2 block`); }
    else if (s.kind === 'expose') { const t = alive(foes).filter(x => !x.mark).sort((a, b) => b.hp - a.hp)[0]; if (h >= 2) { t.mark = 2; say(`  ${m.name} expose → ${t.name} ${faces(f)} MARKED`); } else say(`  ${m.name} expose → ${t.name} ${faces(f)} fails`); }
    else if (s.kind === 'scare') { const t = weakest(alive(foes)); if (h >= t.hp) { t.hp = 0; say(`  ${m.name} snarl ${faces(f)} → ${t.name} FLEES`); } else say(`  ${m.name} snarl ${faces(f)} → ${t.name} holds`); }
    else if (s.kind === 'focus') { m.mana = Math.min(m.maxMana, m.mana + 3); say(`  ${m.name} focus +3 mana`); }
    else if (s.kind === 'bless') { party = 2; say(`  ${m.name} BLESS: party +1 coin`); }
  };
  const mercTurn = m => {
    const s = st();
    for (const b of m.books) { const id = m.order[b.slot]; if (id && BOOKS[b.book].test(s, m) && ready(m, id)) return use(m, id); }
    for (const id of m.order) if (ready(m, id)) return use(m, id);
  };
  const foeTurn = f => {
    if (f.heals) { const hurt = alive(foes).filter(x => x.hp < x.max); if (hurt.length) { const t = weakest(hurt); t.hp = Math.min(t.max, t.hp + f.heals); say(`  ${f.name} mends ${t.name} +${f.heals}`); return; } }
    const am = alive(mercs); if (!am.length) return;
    let t; const tank = am.find(m => m.taunt > 0);
    if (f.ranged) t = weakest(am); else if (tank) t = tank; else { const fr = am.filter(m => m.row === 'front'); const pool = fr.length ? fr : am; t = pool[Math.floor(r() * pool.length)]; }
    const fb = flip(t.armor + (t.wall ? 2 : 0)); flips += fb.length; const b = fb.filter(Boolean).length, d = Math.max(0, f.dmg * (f.enrage && f.hp < f.max / 2 ? 2 : 1) - b);
    t.hp -= d; if (f.drain && d > 0) f.hp = Math.min(f.max, f.hp + d);
    say(`  ${f.name} → ${t.name} −${d}${fb.length ? ` (block ${faces(fb)})` : ''}${t.hp <= 0 ? ` ${t.name.toUpperCase()} IS INJURED` : ''}`);
  };
  say(`Lv${lv} vs ${foeKey}: ${mercs.map(m => `${m.name} [${m.order.map((id, i) => `S${i + 1} ${id}`).join(', ')}${m.books.length ? ' | ' + m.books.map(b => `${BOOKS[b.book].label}→S${b.slot + 1}`).join(', ') : ''}]`).join('  ')}`);
  while (alive(mercs).length && alive(foes).length && round < 12) {
    round++; say(`R${round}`);
    for (const u of [...alive(mercs), ...alive(foes)].sort((a, b) => b.spd - a.spd || (a.side === 'merc' ? -1 : 1))) {
      if (u.hp <= 0 || !alive(mercs).length || !alive(foes).length) continue; u.side === 'merc' ? mercTurn(u) : foeTurn(u);
    }
    for (const m of mercs) { for (const k in m.cds) m.cds[k] = Math.max(0, m.cds[k] - 1); if (m.taunt) m.taunt--; if (m.wall) m.wall--; if (m.mana !== undefined) m.mana = Math.min(m.maxMana, m.mana + 1); }
    for (const f of foes) if (f.mark) f.mark--;
    if (party) party--;
    low = Math.min(low, alive(mercs).reduce((a, m) => a + m.hp, 0) / mercs.reduce((a, m) => a + m.max, 0));
  }
  const win = !alive(foes).length, inj = mercs.filter(m => m.hp <= 0).length;
  say(`${win ? (inj ? 'WON, AT A COST' : 'WON') : alive(mercs).length ? 'HELD OFF: the party falls back' : 'LOST: the party is INJURED'} in ${round} rounds · ${mercs.map(m => `${m.name} ${m.hp > 0 ? `${m.hp}/${m.max}` : 'INJURED'}`).join(' · ')}`);
  return { win, inj, rounds: round, close: win && (low < 0.4 || inj > 0), flips, out };
}

const evalCfg = (lv, foe, cfg, n, base = 1) => {
  if (Array.isArray(foe)) { const rs = foe.map(f => evalCfg(lv, f, cfg, n, base)); const avg = k => rs.reduce((x, y) => x + y[k], 0) / rs.length; return { win: avg('win'), close: avg('close'), inj: avg('inj'), rounds: avg('rounds'), per: rs.map(x => x.win) }; }
  let w = 0, c = 0, i2 = 0, rd = 0; for (let i = 0; i < n; i++) { const f = fight(lv, foe, base + i * 7919, cfg); w += f.win; c += f.close; i2 += f.inj; rd += f.rounds; } return { win: w / n, close: w ? c / w : 0, inj: i2 / n, rounds: rd / n }; };
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
const bookOpts = lv => { const o = [null]; if (LEVELS[lv].books) for (const b of Object.keys(BOOKS)) for (let s = 0; s < LEVELS[lv].skills; s++) o.push({ book: b, slot: s }); return o; };

// coordinate search: per merc, best order, then best book in each book slot; repeat passes
function search(lv, foe, n, books = true) {
  let cfg = defaultConfig(lv), best = evalCfg(lv, foe, cfg, n).win;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 4; i++) {
    for (const p of perms(MERCS[i].kit.slice(0, LEVELS[lv].skills))) { const c = cfg.map((x, j) => (j === i ? { ...x, order: p } : x)); const w = evalCfg(lv, foe, c, n).win; if (w > best) { best = w; cfg = c; } }
    if (books) for (let b = 0; b < LEVELS[lv].books; b++) for (const o of bookOpts(lv)) {
      const books = [...cfg[i].books]; if (o) books[b] = o; else books.splice(b, 1); const c = cfg.map((x, j) => (j === i ? { ...x, books: books.filter(Boolean) } : x)); const w = evalCfg(lv, foe, c, n).win; if (w > best) { best = w; cfg = c; }
    }
  }
  return cfg;
}
const randomCfg = (lv, r) => MERCS.map(m => { const ps = perms(m.kit.slice(0, LEVELS[lv].skills)); const bo = bookOpts(lv).slice(1); const books = []; for (let b = 0; b < LEVELS[lv].books; b++) books.push(bo[Math.floor(r() * bo.length)]); return { order: ps[Math.floor(r() * ps.length)], books }; });
const describe = (lv, cfg) => cfg.map((c, i) => `${MERCS[i].name}:${c.order.join('>')}${c.books.length ? '|' + c.books.map(b => `${b.book}→S${b.slot + 1}`).join(',') : ''}`).join('  ');

const [cmd, ...a] = process.argv.slice(2);
import fs from 'fs';
const CAL = new URL(process.env.SHARP ? './partysim2-cal-sharp.json' : './partysim2-cal.json', import.meta.url);
if (fs.existsSync(CAL)) KHG = JSON.parse(fs.readFileSync(CAL, 'utf8'));
if (cmd === 'calibrate') {
  const target = { 1: 0.6, 6: 0.5, 12: 0.5 };
  for (const lv of Object.keys(LEVELS)) for (const foe of Object.keys(FOES)) {
    let lo = 0.3, hi = 8;
    for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; let w = 0; for (let i = 0; i < 600; i++) w += fight(+lv, foe, i * 31 + 5, defaultConfig(+lv), false, mid).win; if (w / 600 > target[lv]) lo = mid; else hi = mid; }
    KHG[`${lv}:${foe}`] = +((lo + hi) / 2).toFixed(2);
  }
  fs.writeFileSync(CAL, JSON.stringify(KHG, null, 1)); console.log(KHG);
} else if (cmd === 'play') {
  const lv = +(a[0] || 6), cfg = a[3] ? JSON.parse(a[3]) : defaultConfig(lv);
  console.log(fight(lv, a[1] || 'ogre', +(a[2] || 1), cfg, true).out.join('\n'));
} else if (cmd === 'mixed') {
  // one loadout must cover a quest of mixed fights (no re-slotting mid-quest)
  const n = +(a[0] || 150), foes = Object.keys(FOES), pct = x => `${Math.round(100 * x)}%`;
  for (const lv of (process.env.LV ? [+process.env.LV] : [6, 12])) {
    const show = (name, cfg) => { const e = evalCfg(lv, foes, cfg, n * 2, 90001); console.log(`Lv${lv} ${name.padEnd(22)} avg ${pct(e.win)}  [${foes.map((f, i) => `${f} ${pct(e.per[i])}`).join(' · ')}]`); };
    show('default', defaultConfig(lv));
    const nb = search(lv, foes, n, false); show('best order, no books', nb); console.log('      ' + describe(lv, nb));
    const wb = search(lv, foes, n, true); show('best order + books', wb); console.log('      ' + describe(lv, wb));
    const per = foes.map(f => evalCfg(lv, f, search(lv, f, n), n * 2, 90001).win); console.log(`Lv${lv} re-slot per fight (bound)  avg ${pct(per.reduce((x, y) => x + y) / per.length)}`);
  }
} else if (cmd === 'study') {
  const n = +(a[0] || 300), r = rng(99), pct = x => `${Math.round(100 * x)}%`;
  const out = {};
  for (const lv of Object.keys(LEVELS)) for (const foe of Object.keys(FOES)) {
    const d = evalCfg(+lv, foe, defaultConfig(+lv), n, 50001);
    const rs = Array.from({ length: 40 }, () => evalCfg(+lv, foe, randomCfg(+lv, r), n, 50001).win).sort((x, y) => x - y);
    const cfg = search(+lv, foe, n), b = evalCfg(+lv, foe, cfg, n * 2, 90001);
    out[`${lv}:${foe}`] = cfg;
    console.log(`Lv${lv} ${foe.padEnd(6)} default ${pct(d.win)} · random median ${pct(rs[20])} (worst ${pct(rs[0])}) · best ${pct(b.win)} close ${pct(b.close)} inj ${b.inj.toFixed(2)}\n      best: ${describe(+lv, cfg)}`);
  }
  fs.writeFileSync(new URL('./samples/partysim2-best.json', import.meta.url), JSON.stringify(out, null, 1));
}
