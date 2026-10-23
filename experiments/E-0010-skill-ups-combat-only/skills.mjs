// E-0010 skill ups (Claude's draft, 2026-10-23). Skill XP per quest by star and use; skill level next to merc level.
// Ruled: skill XP from fights and checks (small) and quest ends (D-0102); star sets XP gain (D-0069); INT 3% per point (D-0084);
// abilities rolled at recruitment, revealed at skill levels (D-0104); skills level roughly with the merc (designer, 2026-10-23).
// Working: abilities at skill levels 1, 3, 5, 7, 9; skill level capped at the merc's level; a skill below the merc's level gains 2× XP.
//   node skills.mjs   → skill level vs merc level after N quests, by star, used / unused, from the start / from Lv 3
export const MERC_QUESTS = [1, 2, 2, 3, 3, 4, 5, 10, 20, 100, 1000];        // D-0105
export const XP_TO_NEXT = [100, 200, 200, 300, 300, 400, 500, 1000, 2000];  // skill level 1→2 … 9→10: the merc curve × 100
export const QUEST_END = 70, PER_FIGHT = 10, PER_CHECK = 10;               // every skill / each skill used in a won fight / the checked skill
export const starMult = st => 0.625 + st / 8;                               // 1★ 0.75× · 3★ 1× · 5★ 1.25×
const fightsPerQuest = q => q < 3 ? 2 : q < 8 ? 3 : q < 20 ? 4 : 5;
const mercLv = q => { let lv = 1, need = 0; for (const n of MERC_QUESTS) { need += n; if (q >= need) lv++; else break; } return lv; };
export function run(quests, star, used, from = 0) {
  let xp = 0, lv = 1;
  for (let q = from; q < quests; q++) {
    const cap = mercLv(q + 1), catchUp = lv < mercLv(q) ? 2 : 1;
    xp += (QUEST_END + (used ? PER_FIGHT * fightsPerQuest(q) : 0)) * starMult(star) * catchUp;
    while (lv < Math.min(10, cap) && xp >= XP_TO_NEXT[lv - 1]) { xp -= XP_TO_NEXT[lv - 1]; lv++; }
    if (lv >= Math.min(10, cap)) xp = Math.min(xp, XP_TO_NEXT[lv - 1] ?? 0);   // capped: XP holds at the threshold
  }
  return lv;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const Q = [1, 3, 5, 8, 11, 15, 20, 30, 50];
  console.log('quests          ' + Q.map(q => String(q).padEnd(5)).join(''));
  console.log('merc Lv         ' + Q.map(q => String(mercLv(q)).padEnd(5)).join(''));
  for (const [label, used, from] of [['used', true, 0], ['unused', false, 0], ['used, Lv 3', true, 3]])
    for (const st of [1, 3, 5]) console.log(`${(label + ' ' + st + '★').padEnd(16)}` + Q.map(q => (q <= from ? '—' : String(run(q, st, used, from))).padEnd(5)).join(''));
}
