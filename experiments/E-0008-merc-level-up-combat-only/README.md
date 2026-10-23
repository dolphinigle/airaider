---
id: E-0008
title: Merc level up, combat only
date: 2026-10-23
status: running           # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: What XP curve, cap and combat gains should a merc level have, and how does a Lv 1 → 12 career feel?
verdict:                  # one line, filled in when done: the answer
decisions: [D-0102, D-0103, D-0104]             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

Step 2 of the plan to a playtest (NOW.md), part 1 of merc details (designer, 2026-10-23: "you do (1) then propose to me. we are not caring about GOLD yet, we're doing the combat aspect of it first"). Ruled already: three attribute coins per level, led by talents (D-0018); a level grants attributes only (D-0069); Lv 12 is around the endgame; Level up button, overflow, PoE-style penalty for low-level quests (D-0012); third battle skill at Lv 7 (D-0035). Open: the XP numbers and what a level is worth in a fight.

## Setup

`career.mjs`: one merc (wolfkin, STR+ CON+, Two-handed + Beast Blood, Survivor at Lv 7) from Lv 1 to 12; `node career.mjs [seed]`, `node career.mjs stats` (5000 careers). Abilities dealt from E-0007 `baseline.mjs`. Placeholders until the skill-ups step: skill level +1 per merc level (cap 10), abilities at skill levels 1, 3, 5, 7, 9, deal odds by star. Working: max HP = 3 × CON; LUK as D-0081.

## Result

Claude's draft (2026-10-23), proposed to the designer:
- **Cap Lv 12** for now (room caps come with gold).
- **XP from fights won:** 100 a fight, 200 a boss; every merc in the squad gets it in full; a lost fight gives none; a retreat keeps what was earned. Checks feed skill XP only (skill-ups step).
- **Curve** (fights at level to the next): 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16 = 87 fights, about 25 quests. Lv 2 after the first quest, Lv 7 after about 11, Lv 12 after about 25.
- **Penalty:** full XP on quests down to 1 level below the merc; 2 below 50%, 3 below 20%, 4+ below 5%. No bonus for higher quests.
- **Level up** at the base, between quests.
- **Per level in a fight:** 3 coins. The main attack stat gains about 0.85 a level; a 100% hit from merc levels alone grows about 6% a level (1.95× by Lv 12), about 10% a level with skill levels (2.9× by Lv 12). HP 33 → 61.

**Designer, 2026-10-23, reshaped it (D-0102):** XP from quest ends, curve in quests, soft cap past Lv 10, 4+ below gives 0%, start 2 battle + 2 check skills, battle skill at Lv 3, check skill at Lv 5; asked for a penalty on overleveled mercs (D-0103, proposed: stress). The sim now runs the quest curve 1, 1, 1, 2, 2, 2, 3, 3, 3, 6, 12 (Lv 12 after 36 quests).

**Designer, 2026-10-23, replaced the curve:** "maybe 1 2 2 3 3 4 5 10 20 100 1000 10000?" (quests at level to the next level). Lv 10 after 50 quests, Lv 11 after 150, Lv 12 after 1150.

**Designer, 2026-10-23:** beneath-me stress too low (raised to 25 / 50 a node, D-0103 accepted); abilities, mods and skill offers rolled and AI-picked at recruitment; a weapon or magic skill's first ability has 0 cd; Lv 3 / Lv 5 skills pick 1 of 3 (D-0104).

Samples: `samples/career-seed7.txt`, `samples/stats.txt`.

## Verdict

## Next
