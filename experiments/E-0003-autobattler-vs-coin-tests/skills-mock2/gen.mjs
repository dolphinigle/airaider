// E-0003 mock 2: base battle skills + modifiers; renders AI prompts (variant a: free pick, b: dealt candidates) and cards.
//   node gen.mjs prompts      → prompts/<a|b>-<merc>.txt
//   node gen.mjs cards        → cards.md from outputs/<a|b>-<merc>.json
import fs from 'fs';
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// tags: dmg (deals damage), single / multi (targets), heal, buff, control
export const SKILLS = {
  Strike:        { core: 'weapon', text: 'Deal 3 PHYSICAL to one frontline enemy', sta: 1, mana: 0, tags: ['dmg', 'single', 'melee'] },
  Cleave:        { core: 'Heavy Weapons', text: 'Deal 3 PHYSICAL to all frontline enemies', sta: 3, mana: 0, tags: ['dmg', 'multi', 'melee'] },
  Crush:         { core: 'Heavy Weapons', text: 'Deal 4 PHYSICAL to one frontline enemy, ignoring armor', sta: 3, mana: 0, tags: ['dmg', 'single', 'melee'], not: ['Sundering'] },
  Lunge:         { core: 'Light Weapons', text: 'Deal 5 PHYSICAL to one frontline enemy', sta: 2, mana: 0, tags: ['dmg', 'single', 'melee'] },
  Riposte:       { core: 'Light Weapons', text: 'For 1 round, deal 2 PHYSICAL back to each enemy that hits you', sta: 2, mana: 0, tags: ['dmg', 'buff', 'melee'] },
  Charge:        { core: 'Athletics', text: 'Deal 3 PHYSICAL to one frontline enemy; act first next round', sta: 2, mana: 0, tags: ['dmg', 'single', 'melee'] },
  'Shield Wall': { core: 'Defense', text: 'You and allies behind you take 2 less damage for 2 rounds; enemies must target you', sta: 3, mana: 0, tags: ['buff'] },
  Shot:          { core: 'Ranged', text: 'Deal 3 PHYSICAL to any enemy', sta: 1, mana: 0, tags: ['dmg', 'single', 'ranged'] },
  Volley:        { core: 'Ranged', text: 'Deal 2 PHYSICAL to all backline enemies', sta: 3, mana: 0, tags: ['dmg', 'multi', 'ranged'] },
  Pierce:        { core: 'Ranged', text: 'Deal 3 PHYSICAL to one column (front and back enemy)', sta: 2, mana: 0, tags: ['dmg', 'multi', 'ranged'] },
  Bolt:          { core: 'Elemental Magic', text: 'Deal 3 FIRE to any enemy', sta: 0, mana: 1, tags: ['dmg', 'single', 'spell'] },
  Wave:          { core: 'Elemental Magic', text: 'Deal 2 FIRE to all enemies', sta: 0, mana: 3, tags: ['dmg', 'multi', 'spell'] },
  Heal:          { core: 'Holy Magic', text: 'Restore 4 HP to one ally', sta: 0, mana: 2, tags: ['heal', 'spell'] },
  Smite:         { core: 'Holy Magic', text: 'Deal 3 HOLY to any enemy', sta: 0, mana: 1, tags: ['dmg', 'single', 'spell'] },
  Potion:        { core: 'Alchemy', text: 'Restore 3 HP to one ally; 2 uses', sta: 1, mana: 0, tags: ['heal'] },
  Snarl:         { core: 'Intimidation', text: 'One enemy with 4 HP or less flees', sta: 2, mana: 0, tags: ['control'] },
  Parley:        { core: 'Persuasion', text: 'One non-boss enemy stops fighting for 2 rounds', sta: 1, mana: 0, tags: ['control'] },
  Expose:        { core: 'Arcane Lore', text: 'One enemy takes 2 more from every hit for 2 rounds', sta: 1, mana: 0, tags: ['control'] },
  'Know the Beast': { core: 'Science Lore', text: 'One beast takes 2 more from every hit for 2 rounds', sta: 1, mana: 0, tags: ['control'] },
};
// fits: the skill tags a mod can go on; w: themes that make the engine deal it more often
export const MODS = {
  Fiery:     { text: '+1 FIRE damage', cost: '+1 MANA', fits: ['dmg'], w: ['Elemental Magic', 'Craft'] },
  Icy:       { text: 'the target acts last next round', cost: '+1 MANA', fits: ['dmg', 'control'], w: ['Elemental Magic'] },
  Venomous:  { text: 'the target loses 1 HP each round for 3 rounds', cost: '+1 STA', fits: ['dmg'], w: ['Alchemy', 'Roguery'] },
  Heavy:     { text: '+2 damage', cost: '+1 STA', fits: ['dmg'], w: ['Heavy Weapons'] },
  Swift:     { text: 'you act first this round', cost: '+1 STA', fits: ['dmg', 'heal', 'buff', 'control'], w: ['Light Weapons', 'Athletics', 'Ranged'] },
  Wide:      { text: 'also hits one enemy next to the target', cost: '+2 STA', fits: ['single'], w: ['Heavy Weapons', 'Ranged'] },
  Sundering: { text: 'ignores 1 armor', cost: '+1 STA', fits: ['dmg'], w: ['Heavy Weapons'] },
  Holy:      { text: '+1 HOLY damage; double vs undead', cost: '+1 MANA', fits: ['dmg'], w: ['Holy Magic'] },
  Vampiric:  { text: 'heal yourself 1 per enemy hit', cost: '+1 MANA', fits: ['dmg'], w: ['Dark Magic'] },
  Stunning:  { text: 'if it deals 3+, the target skips its next action', cost: '+2 STA', fits: ['dmg'], w: ['Heavy Weapons', 'Athletics'] },
  Guarding:  { text: 'you take 1 less damage next round', cost: '+1 STA', fits: ['dmg', 'control', 'heal'], w: ['Defense'] },
  Rallying:  { text: 'an ally next to you heals 1', cost: '+1 STA', fits: ['dmg', 'buff', 'control'], w: ['Leadership', 'Intimidation'] },
  Lasting:   { text: 'the effect lasts 1 round longer', cost: '+1 MANA', fits: ['buff', 'control'], w: ['Arcane Lore', 'Science Lore', 'Defense', 'Persuasion'] },
  Generous:  { text: 'also affects one more ally', cost: '+2 MANA', fits: ['heal'], w: ['Holy Magic', 'Alchemy'] },
  Thrifty:   { text: 'costs 1 less (STA or MANA)', cost: 'its effect is 1 weaker', fits: ['dmg', 'heal'], w: [] },
};
export const MERCS = {
  Atlas: { who: 'Atlas, wolfkin, gruff. Skills: Swords (Light Weapons) 2 coins; Wolf-howl (Intimidation) 1. Gear: sword, leather armor.', cores: ['Light Weapons', 'Intimidation'], kit: ['Strike', 'Lunge', 'Riposte', 'Snarl'] },
  Brann: { who: 'Brann, dwarf, stubborn. Skills: Axe (Heavy Weapons) 2; Shieldwork (Defense) 1; Rune-lore (Arcane Lore) 1. Gear: axe, round shield, mail.', cores: ['Heavy Weapons', 'Defense', 'Arcane Lore'], kit: ['Strike', 'Cleave', 'Shield Wall', 'Expose'] },
  Hulda: { who: 'Hulda, human, reckless. Skills: Greatsword (Heavy Weapons) 3; Brawling (Athletics) 1. Gear: greatsword, scale armor.', cores: ['Heavy Weapons', 'Athletics'], kit: ['Strike', 'Cleave', 'Crush', 'Charge'] },
  Mira:  { who: 'Mira, human, bookish. Skills: Fire-speech (Elemental Magic) 2; Star-charts (Science Lore) 1. Gear: staff, robes.', cores: ['Elemental Magic', 'Science Lore'], kit: ['Bolt', 'Wave', 'Know the Beast', 'Strike'] },
  Oswin: { who: 'Oswin, human, gentle. Skills: Prayers of the Lamp (Holy Magic) 2; Herb-craft (Alchemy) 1. Gear: mace, hooded lamp, robes.', cores: ['Holy Magic', 'Alchemy'], kit: ['Heal', 'Smite', 'Potion', 'Strike'] },
  Sela:  { who: 'Sela, elf, curious. Skills: Longbow (Ranged) 2; Silver Tongue (Persuasion) 1. Gear: longbow, cloak.', cores: ['Ranged', 'Persuasion'], kit: ['Shot', 'Volley', 'Pierce', 'Parley'] },
};
const fitting = s => Object.keys(MODS).filter(m => MODS[m].fits.some(t => SKILLS[s].tags.includes(t)) && !(SKILLS[s].not || []).includes(m));
const deal = (merc, s, r) => { // 3 candidates, weighted 4x if the mod's theme matches one of the merc's cores
  const pool = fitting(s).map(m => ({ m, w: MODS[m].w.some(c => MERCS[merc].cores.includes(c)) ? 4 : 1 })), out = [];
  while (out.length < 3 && pool.length) { const tot = pool.reduce((a, x) => a + x.w, 0); let x = r() * tot, i = 0; while ((x -= pool[i].w) > 0) i++; out.push(pool.splice(i, 1)[0].m); }
  return out;
};
const SYS = `You name battle skills for mercenaries in a dark fantasy squad game told in a light, fast tone. Battles are automatic and shown as animation on a 2x3 grid per side (3 frontline, 3 backline).

Each base skill below has a fixed effect. For each one:
1. Pick 1 or 2 modifiers from that skill's list that fit this merc: their weapon, exact skill names, race and traits.
2. Name the result in 1-3 words, fitting the merc and the modifiers. The name must not promise an effect the skill doesn't have.

Return JSON only: {"skills":[{"base":"base skill name","mods":["modifier name"],"name":"1-3 words"}]}`;
const modLine = m => `${m} (${MODS[m].text}; ${MODS[m].cost})`;
const [cmd] = process.argv.slice(2);
if (cmd === 'prompts') {
  const r = rng(7);
  for (const [n, M] of Object.entries(MERCS)) for (const v of ['a', 'b']) {
    const body = M.kit.map(s => { const sk = SKILLS[s]; const mods = v === 'a' ? fitting(s) : deal(n, s, r);
      return `- ${s}: ${sk.text}. Stamina ${sk.sta}, mana ${sk.mana}.\n  Modifiers: ${mods.map(modLine).join('; ')}`; }).join('\n');
    fs.writeFileSync(`prompts/${v}-${n}.txt`, `SYSTEM:\n${SYS}\n\nUSER:\nMerc: ${M.who}\n\nBase skills:\n${body}\n`);
  }
} else if (cmd === 'cards') {
  const cost = (sk, mods) => { let sta = sk.sta, mana = sk.mana; for (const m of mods) { const c = MODS[m]?.cost || ''; const k = +(c.match(/\+(\d)/)?.[1] || 0); if (c.includes('STA')) sta += k; if (c.includes('MANA')) mana += k; if (m === 'Thrifty') { if (sta) sta--; else if (mana) mana--; } } return `${sta} STA · ${mana} MANA`; };
  let md = '# Mock 2 cards\n\nBase skill + AI-picked modifiers + AI name (Sonnet high, one call per merc). The engine computes the card from the picks.\n';
  const freq = { a: {}, b: {} };
  for (const v of ['a', 'b']) {
    md += `\n## Variant ${v}: ${v === 'a' ? 'AI picks from every fitting modifier' : 'engine deals 3 candidates (weighted by the merc\'s skills), AI picks'}\n`;
    for (const n of Object.keys(MERCS)) {
      const f = `outputs/${v}-${n}.json`; if (!fs.existsSync(f)) continue;
      const o = JSON.parse(fs.readFileSync(f, 'utf8'));
      md += `\n**${n}**\n\n| name | base + mods | effect | cost |\n|---|---|---|---|\n`;
      for (const s of o.skills) { const sk = SKILLS[s.base]; s.mods.forEach(m => (freq[v][m] = (freq[v][m] || 0) + 1));
        md += `| **${s.name}** | ${s.base}${s.mods.length ? ' + ' + s.mods.join(' + ') : ''} | ${sk.text}${s.mods.map(m => `; ${MODS[m] ? MODS[m].text : '?? unknown mod'}`).join('')} | ${cost(sk, s.mods)} |\n`; }
    }
  }
  md += `\n## Modifier counts\n\n- a: ${Object.entries(freq.a).sort((x, y) => y[1] - x[1]).map(([k, c]) => `${k} ${c}`).join(', ')}\n- b: ${Object.entries(freq.b).sort((x, y) => y[1] - x[1]).map(([k, c]) => `${k} ${c}`).join(', ')}\n`;
  fs.writeFileSync('cards.md', md); console.log(md);
}
