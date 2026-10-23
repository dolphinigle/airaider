// E-0010 skill ups (Claude's draft, 2026-10-23). Skill XP per quest by star and use; skill level by quest count.
// Ruled: skill XP from fights and checks (small) and quest ends (D-0102); star sets XP gain (D-0069); INT 3% per point (D-0084);
// abilities rolled at recruitment, revealed at skill levels (D-0104). Working: abilities at skill levels 1, 3, 5, 7, 9; cap 10.
//   node skills.mjs   → skill level after N quests, by star, for a used and an unused skill
export const XP_TO_NEXT = [75, 150, 275, 450, 450, 500, 700, 950, 1700];   // skill level 1→2 … 9→10
export const QUEST_END = 40, PER_FIGHT = 10, PER_CHECK = 10;               // every skill / each skill used in a won fight / the checked skill
export const starMult = st => 0.5 + st / 4;                                 // 1★ 0.75× · 3★ 1.25× · 5★ 1.75×
const fightsPerQuest = q => q < 3 ? 2 : q < 8 ? 3 : q < 20 ? 4 : 5;         // D-0052 quest sizes, by quests done
const levelAt = (quests, star, used, int = 10) => {
  let xp = 0, lv = 1;
  for (let q = 0; q < quests; q++) {
    xp += (QUEST_END + (used ? PER_FIGHT * fightsPerQuest(q) : 0)) * starMult(star) * (1 + (int - 10) * 0.03);
    while (lv < 10 && xp >= XP_TO_NEXT[lv - 1]) { xp -= XP_TO_NEXT[lv - 1]; lv++; }
  }
  return lv;
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const Q = [1, 3, 5, 8, 11, 15, 20, 30, 50];
  console.log('skill level after N quests (merc Lv in brackets, D-0105 curve)');
  const mlv = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log('                ' + Q.map((q, i) => `${q} (Lv${mlv[i]})`.padEnd(10)).join(''));
  for (const used of [true, false]) for (const st of [1, 2, 3, 4, 5])
    console.log(`${used ? 'used  ' : 'unused'} ${st}★       ` + Q.map(q => String(levelAt(q, st, used)).padEnd(10)).join(''));
}
