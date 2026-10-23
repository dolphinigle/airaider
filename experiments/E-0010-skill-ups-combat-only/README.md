---
id: E-0010
title: Skill ups, combat only
date: 2026-10-23
status: running           # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: How does skill XP accrue, how fast do skills level by star and use, and when do the five abilities arrive?
verdict:                  # one line, filled in when done: the answer
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

Step 2 of the plan to a playtest, part 3 of merc details (after E-0008, E-0009). Ruled: skill XP small from fights and checks, plus quest ends (D-0102); skill star sets XP gain (D-0069); coins = attribute + skill level (D-0069); five abilities per battle skill rolled and AI-picked at recruitment, revealed by skill level ups (D-0104); INT 3% increased XP per point (D-0084); beneath-me skill XP penalty (D-0105). Open: XP amounts, the skill curve and cap, star multipliers, which skills get fight XP, when skill level ups land.

## Setup

`skills.mjs`: skill level after N quests by star, for a skill used in fights and one never used (INT 10). Output `samples/out.txt`.

## Result

Claude's draft (2026-10-23), proposed to the designer:
- **Skill XP:** quest end 40 to every skill; a won fight 10 to each battle skill whose ability the merc used in it; a check 10 to the checked skill.
- **Star multiplier:** 1★ 0.75×, 2★ 1×, 3★ 1.25×, 4★ 1.5×, 5★ 1.75× (0.5 + star / 4).
- **Curve:** skill level 1 → 10, XP to next 75, 150, 275, 450, 450, 500, 700, 950, 1700.
- **Abilities** at skill levels 1, 3, 5, 7, 9 (working since D-0069); level 10 gives only its coin.
- **Skill level ups apply at the quest end**, on the results screen, revealing the pre-picked ability.
- Result: a used 3★ skill reaches level 3 (second ability) after 3 quests, 5 after 11, 8 after 30, 9 at merc Lv 10; a used 5★ skill hits 10 by merc Lv 10; unused skills trail by 2–3 levels.

**Designer, 2026-10-23:** "skill should level roughly the same with their merc levels". Redrafted: skill curve = the merc curve × 100 XP (100, 200, 200, 300, 300, 400, 500, 1000, 2000); quest end 70, used in a won fight 10, check 10; star 0.75× to 1.25×; **skill level capped at the merc's level**; a skill below the merc's level gains **2× XP** (catch-up, so the Lv 3 skill catches up). Result: skills sit at the merc's level or 1 below; 1★ and unused skills lag 1.

## Verdict

## Next
