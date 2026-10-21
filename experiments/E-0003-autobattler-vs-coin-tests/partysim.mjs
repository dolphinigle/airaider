// E-0003 party coin autobattle: 4 mercs with Dragon Age-style tactics vs a foe group.
// Only mercs flip (D-0013): attacks flip a skill pool (heads = damage), defense flips armor coins (heads block).
// Foes deal fixed damage and have flat armor.
//   node partysim.mjs play <party> <tactics> <foes> <seed>   → one fight as text
//   node partysim.mjs stats [n]                              → win%, closeness, length per setup
// party: classic (2 warriors, mage, healer) | brute (3 warriors, healer) | glass (2 warriors, 2 mages) | archers (warrior, archer, mage, healer)
// tactics: none | simple | smart | bad · foes: road | barrow

const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---- units ----
const MERCS = {
  Brann: { role: 'warrior', row: 'front', hp: 12, armor: 3, spd: 2, skills: { axe: { kind: 'strike', pool: 5, cleave: true, label: 'Axe' }, taunt: { kind: 'taunt', label: 'Taunt' } } },
  Atlas: { role: 'warrior', row: 'front', hp: 10, armor: 1, spd: 4, gruff: true, skills: { sword: { kind: 'strike', pool: 4, label: 'Sword' } } },
  Kael:  { role: 'warrior', row: 'front', hp: 11, armor: 2, spd: 3, skills: { spear: { kind: 'strike', pool: 4, label: 'Spear' } } },
  Mira:  { role: 'mage', row: 'back', hp: 6, armor: 0, spd: 3, skills: { bolt: { kind: 'strike', pool: 5, reach: true, label: 'Firebolt' }, wave: { kind: 'wave', pool: 5, uses: 2, label: 'Flame Wave' } } },
  Ivo:   { role: 'mage', row: 'back', hp: 6, armor: 0, spd: 3, skills: { bolt: { kind: 'strike', pool: 5, reach: true, label: 'Frostbolt' }, wave: { kind: 'wave', pool: 5, uses: 2, label: 'Hail' } } },
  Sela:  { role: 'archer', row: 'back', hp: 7, armor: 1, spd: 4, skills: { bow: { kind: 'strike', pool: 5, reach: true, label: 'Longbow' } } },
  Oswin: { role: 'healer', row: 'back', hp: 8, armor: 1, spd: 1, skills: { heal: { kind: 'heal', pool: 5, label: 'Heal' }, mace: { kind: 'strike', pool: 2, holy: true, label: 'Mace' } } },
};
const PARTIES = {
  classic: ['Brann', 'Atlas', 'Mira', 'Oswin'],
  brute: ['Brann', 'Atlas', 'Kael', 'Oswin'],
  glass: ['Brann', 'Atlas', 'Mira', 'Ivo'],
  archers: ['Brann', 'Sela', 'Mira', 'Oswin'],
};
const FOES = {
  road: [ ...[1, 2, 3, 4].map(i => ({ name: `Bandit ${i}`, hp: 4, dmg: 2, armor: 0, spd: 3, row: 'front' })),
    { name: 'Crossbow', hp: 4, dmg: 2, armor: 0, spd: 2, row: 'back', ranged: true },
    { name: 'Red Hob', hp: 10, dmg: 3, armor: 1, spd: 2, row: 'front' } ],
  barrow: [ ...[1, 2, 3].map(i => ({ name: `Skeleton ${i}`, hp: 5, dmg: 2, armor: 1, spd: 2, row: 'front', undead: true })),
    { name: 'Barrow-wight', hp: 8, dmg: 2, armor: 0, spd: 3, row: 'back', ranged: true, undead: true, drain: true } ],
  wolves: [1, 2, 3, 4, 5, 6].map(i => ({ name: `Wolf ${i}`, hp: 3, dmg: 2, armor: 0, spd: 5, row: 'front' })),
  ogre: [{ name: 'Ogre', hp: 24, dmg: 5, armor: 1, spd: 1, row: 'front' }],
  cult: [ { name: 'Cultist 1', hp: 6, dmg: 2, armor: 1, spd: 2, row: 'front' }, { name: 'Cultist 2', hp: 6, dmg: 2, armor: 1, spd: 2, row: 'front' },
    { name: 'Blood Priest', hp: 5, dmg: 1, armor: 0, spd: 3, row: 'back', heals: 3 } ],
};
const KD = +(process.env.KD || 0); // foe damage + KD
// foe HP multiplier per group, calibrated (node partysim.mjs calibrate) so the classic party with simple tactics wins ~50%
const KHG = { road: 1.63, barrow: 2.1, wolves: 3.83, ogre: 1.69, cult: 1.7 };
let KH = 1;

// ---- tactics: ordered rules, first match wins (Dragon Age style) ----
// conditions: always | ally<50 | self>50 | foes>=3 | ranged-foe ; targets: weakest | strongest | ranged | first | ally-lowest
const T = (cond, use, target = 'weakest') => ({ cond, use, target });
const TACTICS = {
  none: { warrior: [T('always', 0, 'first')], mage: [T('always', 0, 'first')], archer: [T('always', 0, 'first')], healer: [T('always', 1, 'first')] },
  simple: { warrior: [T('always', 0)], mage: [T('always', 0)], archer: [T('always', 0)], healer: [T('ally<50', 'heal', 'ally-lowest'), T('always', 'mace')] },
  smart: {
    warrior: [T('foes>=3', 'taunt', 'self'), T('always', 0)],
    mage: [T('foes>=3', 'wave'), T('ranged-foe', 0, 'ranged'), T('always', 0)],
    archer: [T('ranged-foe', 0, 'ranged'), T('always', 0)],
    healer: [T('ally<50', 'heal', 'ally-lowest'), T('always', 'mace')],
  },
  bad: { warrior: [T('always', 0, 'strongest')], mage: [T('always', 'wave'), T('always', 0, 'strongest')], archer: [T('always', 0, 'strongest')], healer: [T('ally<25', 'heal', 'ally-lowest'), T('always', 'mace', 'strongest')] },
};

const heads = (r, n) => { const f = []; for (let i = 0; i < n; i++) f.push(r() < 0.5); return f; };
const faces = f => f.map(h => (h ? '●' : '○')).join('');
const hpbar = u => '♥'.repeat(Math.max(0, u.hp)) + '·'.repeat(Math.max(0, u.max - Math.max(0, u.hp)));

function fight(partyKey, tacticKey, foeKey, seed, verbose) {
  KH = +(process.env.KH || KHG[foeKey] || 1);
  const r = rng(seed), out = [], say = s => verbose && out.push(s);
  const mercs = PARTIES[partyKey].map(n => { const m = MERCS[n]; return { name: n, side: 'merc', ...m, max: m.hp, skills: JSON.parse(JSON.stringify(m.skills)), taunt: 0 }; });
  const foes = FOES[foeKey].map(f => { const hp = Math.max(1, Math.round(f.hp * KH)); return { ...f, hp, dmg: f.dmg + KD, side: 'foe', max: hp }; });
  const alive = xs => xs.filter(x => x.hp > 0);
  let flips = 0, swings = 0, lead = null, round = 0, lowPoint = 1;
  const ratio = () => alive(mercs).reduce((a, m) => a + m.hp, 0) / mercs.reduce((a, m) => a + m.max, 0);
  const foeRatio = () => alive(foes).reduce((a, f) => a + f.hp, 0) / foes.reduce((a, f) => a + f.max, 0);
  const reachable = () => { const fr = alive(foes).filter(f => f.row === 'front'); return fr.length ? fr : alive(foes); };
  const pick = (target, list) => target === 'first' ? list[0] : target === 'strongest' ? list.reduce((a, b) => (b.hp > a.hp ? b : a)) : target === 'ranged' ? (list.find(f => f.heals) || list.find(f => f.ranged) || list[0]) : list.reduce((a, b) => (b.hp < a.hp ? b : a));
  const cond = (c, m) => {
    if (c === 'always') return true;
    if (c === 'ally<50') return alive(mercs).some(a => a.hp / a.max < 0.5);
    if (c === 'ally<25') return alive(mercs).some(a => a.hp / a.max < 0.25);
    if (c === 'self>50') return m.hp / m.max > 0.5;
    if (c === 'foes>=3') return alive(foes).length >= 3;
    if (c === 'ranged-foe') return alive(foes).some(f => f.ranged || f.heals);
    return false;
  };
  const mercAct = m => {
    const rules = TACTICS[tacticKey][m.role];
    const keys = Object.keys(m.skills);
    for (const rule of rules) {
      if (!cond(rule.cond, m)) continue;
      const sk = m.skills[typeof rule.use === 'number' ? keys[rule.use] : rule.use];
      if (!sk || (sk.uses !== undefined && sk.uses <= 0)) continue;
      if (sk.kind === 'taunt') { if (m.taunt > 0) continue; m.taunt = 2; say(`  ${m.name} TAUNTS: foes come at him`); return; }
      if (sk.kind === 'heal') {
        const t = alive(mercs).reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
        const f = heads(r, sk.pool); flips += f.length; const h = f.filter(Boolean).length; t.hp = Math.min(t.max, t.hp + h);
        say(`  ${m.name} ${sk.label} → ${t.name} ${faces(f)} +${h}  ${t.name} ${hpbar(t)}`); return;
      }
      if (sk.kind === 'wave') {
        sk.uses--; const f = heads(r, sk.pool); flips += f.length; const h = f.filter(Boolean).length, d = Math.max(0, h - 1);
        alive(foes).forEach(x => { x.hp -= Math.max(0, d - x.armor); });
        say(`  ${m.name} ${sk.label} ${faces(f)} ${h} → ${d} to every foe${alive(foes).length ? '' : ''}  [${foes.map(x => x.hp > 0 ? `${x.name.split(' ').pop()} ${x.hp}` : '✕').join(' ')}]`); return;
      }
      // strike
      const list = sk.reach ? alive(foes) : reachable(); if (!list.length) return;
      const t = pick(rule.target, list);
      const pool = sk.pool + (m.gruff && m.hp / m.max < 0.5 ? 1 : 0);
      const f = heads(r, pool); flips += f.length; let h = f.filter(Boolean).length;
      let d = Math.max(0, h - t.armor) * (sk.holy && t.undead ? 2 : 1);
      const over = Math.max(0, d - t.hp); t.hp -= d;
      let line = `  ${m.name} ${sk.label} → ${t.name} ${faces(f)} ${d}${pool > sk.pool ? ' (GRUFF +1)' : ''}${t.hp <= 0 ? `  ${t.name.toUpperCase()} FALLS` : ''}`;
      if (sk.cleave && over > 0) { const n2 = reachable().find(x => x !== t && x.hp > 0); if (n2) { n2.hp -= over; line += `  · CLEAVE ${over} → ${n2.name}${n2.hp <= 0 ? ' FALLS' : ''}`; } }
      say(line); return;
    }
  };
  const foeAct = f => {
    const am = alive(mercs); if (!am.length) return;
    if (f.heals) { const hurt = alive(foes).filter(x => x.hp < x.max); if (hurt.length) { const t = hurt.reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a)); t.hp = Math.min(t.max, t.hp + f.heals); say(`  ${f.name} mends ${t.name} +${f.heals}`); return; } }
    let t;
    if (f.ranged) t = am.reduce((a, b) => (b.hp < a.hp ? b : a));
    else { const taunter = am.find(m => m.taunt > 0); const front = am.filter(m => m.row === 'front'); t = taunter || (front.length ? front : am)[Math.floor(r() * (front.length ? front.length : am.length))]; }
    const f2 = heads(r, t.armor); flips += f2.length; const b = f2.filter(Boolean).length, d = Math.max(0, f.dmg - b);
    t.hp -= d; if (f.drain && d > 0) f.hp = Math.min(f.max, f.hp + d);
    say(`  ${f.name} → ${t.name} ${f.dmg}${t.armor ? ` blocked ${faces(f2)} ${b}` : ''} = −${d}  ${t.name} ${t.hp > 0 ? hpbar(t) : 'DOWN'}`);
  };
  say(`PARTY ${mercs.map(m => `${m.name} (${m.role})`).join(' · ')}   TACTICS ${tacticKey}   vs ${foes.map(f => f.name).join(', ')}`);
  while (alive(mercs).length && alive(foes).length && round < 12) {
    round++; say(`R${round}`);
    const order = [...alive(mercs), ...alive(foes)].sort((a, b) => b.spd - a.spd || (a.side === 'merc' ? -1 : 1));
    for (const u of order) { if (u.hp <= 0 || !alive(mercs).length || !alive(foes).length) continue; u.side === 'merc' ? mercAct(u) : foeAct(u); }
    mercs.forEach(m => { if (m.taunt > 0) m.taunt--; });
    const lr = ratio() - foeRatio(), now = lr >= 0 ? 'merc' : 'foe'; if (lead && now !== lead) swings++; lead = now; lowPoint = Math.min(lowPoint, ratio());
  }
  const win = !alive(foes).length, down = mercs.filter(m => m.hp <= 0).length;
  const result = win ? (down ? 'WON, AT A COST' : 'WON') : alive(mercs).length ? 'STALEMATE: THE PARTY FALLS BACK' : 'PARTY DOWN';
  say(`${result} in ${round} rounds · ${mercs.map(m => `${m.name} ${m.hp > 0 ? `${m.hp}/${m.max}` : 'DOWN'}`).join(' · ')}`);
  return { win, down, rounds: round, flips, swings, close: win && (lowPoint < 0.4 || down > 0), hpLeft: ratio(), lines: out.length, out };
}

// menu of rule lists per role, for the search
const MENU = {
  warrior: { hitWeak: [T('always', 0)], hitFirst: [T('always', 0, 'first')], tauntOpen: [T('foes>=3', 'taunt', 'self'), T('always', 0)], hitStrong: [T('always', 0, 'strongest')], tauntAlways: [T('always', 'taunt', 'self'), T('always', 0)], hitBack: [T('ranged-foe', 0, 'ranged'), T('always', 0)] },
  mage: { boltWeak: [T('always', 0)], waveFirst: [T('foes>=3', 'wave'), T('always', 0)], boltRanged: [T('ranged-foe', 0, 'ranged'), T('always', 0)], waveThenRanged: [T('foes>=3', 'wave'), T('ranged-foe', 0, 'ranged'), T('always', 0)] },
  archer: { shootWeakX: [T('always', 0, 'first')], shootWeak: [T('always', 0)], shootRanged: [T('ranged-foe', 0, 'ranged'), T('always', 0)], shootStrong: [T('always', 0, 'strongest')] },
  healer: { heal50: [T('ally<50', 'heal', 'ally-lowest'), T('always', 'mace')], heal25: [T('ally<25', 'heal', 'ally-lowest'), T('always', 'mace')], healAlways: [T('always', 'heal')], maceOnly: [T('always', 'mace')] },
};
const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'calibrate') {
  for (const foe of Object.keys(FOES)) {
    let lo = 0.5, hi = 6;
    for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; KHG[foe] = mid; let w = 0; for (let i = 0; i < 600; i++) w += fight('classic', 'simple', foe, i * 31 + 5).win; if (w / 600 > 0.5) lo = mid; else hi = mid; }
    console.log(foe, ((lo + hi) / 2).toFixed(2));
  }
  process.exit(0);
}
if (cmd === 'search') {
  const n = +(a[0] || 400);
  for (const foe of Object.keys(FOES)) for (const party of Object.keys(PARTIES)) {
    const roles = [...new Set(PARTIES[party].map(x => MERCS[x].role))];
    let combos = [{}];
    for (const role of roles) combos = combos.flatMap(c => Object.keys(MENU[role]).map(k => ({ ...c, [role]: k })));
    const res = combos.map(c => { TACTICS.tmp = Object.fromEntries(roles.map(rl => [rl, MENU[rl][c[rl]]])); let w = 0, cl = 0, dn = 0; for (let i = 0; i < n; i++) { const f = fight(party, 'tmp', foe, i * 104729 + 7); w += f.win; cl += f.close; dn += f.down; } return { c, win: Math.round(100 * w / n), close: w ? Math.round(100 * cl / w) : 0, down: +(dn / n).toFixed(2) }; }).sort((x, y) => y.win - x.win);
    const fmt = x => `${x.win}% (close ${x.close}%, down ${x.down}) ${roles.map(rl => x.c[rl]).join('/')}`;
    console.log(`${foe} ${party}: ${combos.length} combos · best ${fmt(res[0])} · median ${res[Math.floor(res.length / 2)].win}% · worst ${fmt(res[res.length - 1])}`);
  }
  process.exit(0);
}
if (cmd === 'play') {
  let tk = a[1] || 'smart';
  if (tk.includes('=')) { TACTICS.custom = Object.fromEntries(tk.split(',').map(kv => { const [rl, k] = kv.split('='); return [rl, MENU[rl][k]]; })); for (const rl of Object.keys(MENU)) TACTICS.custom[rl] ||= TACTICS.simple[rl]; tk = 'custom'; }
  console.log(fight(a[0] || 'classic', tk, a[2] || 'road', +(a[3] || 1), true).out.join('\n'));
}
else {
  const n = +(a[0] || 3000), rows = [];
  for (const foe of Object.keys(FOES)) for (const party of Object.keys(PARTIES)) for (const tac of Object.keys(TACTICS)) {
    let s = { win: 0, down: 0, rounds: 0, flips: 0, swings: 0, close: 0, lines: 0 };
    for (let i = 0; i < n; i++) { const f = fight(party, tac, foe, i * 7919 + 13, true); s.win += f.win; s.down += f.down; s.rounds += f.rounds; s.flips += f.flips; s.swings += f.swings; s.close += f.close; s.lines += f.lines; }
    rows.push({ foe, party, tac, win: Math.round(100 * s.win / n), closeWinOfWins: s.win ? Math.round(100 * s.close / s.win) : 0, downPerFight: +(s.down / n).toFixed(2), rounds: +(s.rounds / n).toFixed(1), flips: Math.round(s.flips / n), swings: +(s.swings / n).toFixed(2), lines: Math.round(s.lines / n) });
  }
  console.log('foe     party    tactics  win%  close%  down  rounds flips swings lines');
  rows.forEach(x => console.log(`${x.foe.padEnd(7)} ${x.party.padEnd(8)} ${x.tac.padEnd(8)} ${String(x.win).padStart(4)}  ${String(x.closeWinOfWins).padStart(5)}  ${String(x.downPerFight).padStart(4)}  ${String(x.rounds).padStart(5)} ${String(x.flips).padStart(5)} ${String(x.swings).padStart(5)} ${String(x.lines).padStart(5)}`));
}
