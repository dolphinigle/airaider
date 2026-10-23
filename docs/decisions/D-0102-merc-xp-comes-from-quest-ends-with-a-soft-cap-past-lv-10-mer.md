---
id: D-0102
title: Merc XP comes from quest ends with a soft cap past Lv 10; mercs start with 2 battle and 2 check skills, gain a battle skill at Lv 3 and a check skill at Lv 5
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0035]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0008]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

E-0008: Claude proposed merc level up, combat only (XP per fight won, hard cap Lv 12, third battle skill at Lv 7 per D-0035). The designer reshaped it.

## Decision

The designer, 2026-10-23: "cap: should be a soft cap (just make the exp after you reach level 10 increase exponetially fast or something, so that 12 is the absolute maximum in any normal play). main XP sources are quest ends. skill checks and fights give small SKILL XP only (quest end still give skill XP). Curve: should ot be fights won but quests done. low level: four should just give 0%. … When: agree. What a level grants: fine. Lv 7 third battle skill is incorrect though. i suggest: Lv 3 get a new battle skill, level 5 get a new non battle skill. Mercs start with 2 battle skills and 2 non battle skills."

- **Merc XP comes from quest ends.** Fights and skill checks give only small **skill** XP; quest ends give skill XP too.
- **The curve counts quests done**, not fights.
- **Soft cap:** from Lv 10 the XP per level rises steeply, so Lv 12 is the maximum in any normal play.
- **Low-level penalty** (D-0012): a quest 4 or more levels below the merc gives no XP.
- **The Level up button is pressed at the base**, between quests.
- **A merc level grants attributes only** (D-0018's three coins; D-0069).
- **Skills:** a merc **starts with 2 battle skills and 2 check skills**, gains **a new battle skill at Lv 3** and **a new check skill at Lv 5**. That fills D-0083's quotas of 3 + 3. Replaces D-0035 (two starting skills, a third at Lv 7).

Claude's working numbers and readings, not yet ruled:
- A quest at the merc's level gives 100 XP. Quests at level to the next level: 1, 1, 1, 2, 2, 2, 3, 3, 3, then 6 and 12. Lv 10 after 18 quests, Lv 11 after 24, Lv 12 after 36; Lv 13 would take 24 more.
- Penalty: full XP down to 1 level below the merc, 2 below 50%, 3 below 20%, 4+ below 0%.
- The Lv 3 and Lv 5 skills are picks of 1 of 3, hidden until then and rolled at recruitment (as D-0035). D-0035's rare third starting skill is dropped.

## Consequences

- Retreating or losing a quest decides whether the quest-end XP comes; Claude's reading: only a finished quest pays it.
- The skill-ups step must set skill XP per fight, per check and per quest end, and the skill-level cadence of new abilities.
- Overleveled mercs on easy quests: D-0103 (proposed).
