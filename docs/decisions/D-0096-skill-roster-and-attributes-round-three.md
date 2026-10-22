---
id: D-0096
title: Skill roster and attributes, round three
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0086]      # e.g. [D-0003]
superseded-by: D-0097     # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Since D-0086 the battle skills changed a lot: weapon skills became styles (D-0090, D-0091), Fury (now Berserk) and Grit joined (D-0089, D-0095), Precision and Warfare came in (D-0095), and the designer moved several attributes while reading example builds per attribute row.

## Decision

The designer, 2026-10-22: "Lets move single weapon to str+dex" ("DEX is way too high now"), "move dirty fighting to DEX+CON maybe?", "yes move Berserk to STR, makes more sense" (pure STR's theme is physical AoE), "DEX+CON just weak then, its fine. only weak one." Claude's drafts for the other new weapon skills and Grit stood unopposed through every table.

**Stats (restating D-0086):** STR DEX INT CHA CON LUK. No stat touches stress. **LUK has no skills** (D-0095) and raises the heads chance of every coin.

W = weapon skill (at most one per merc, D-0090).

| attribute | battle skills | check skills |
|---|---|---|
| STR | Two-handed (W), Polearm (W), **Berserk** (physical AoE: whirlwind, rampage, trample) | Athletics |
| DEX | Shooting (W), Stealth, **Precision** | Perception, Roguery |
| INT | Doctor, Alchemy, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Animal Companion, Holy Magic | Persuasion |
| CON | Defender, Grit | Cooking |
| STR + DEX | **Single Weapon** (W), Dual Wield (W), Unarmed (W), Throwing (W) | |
| STR + CON | Weapon and Shield (W) | |
| STR + INT | Fire Magic, **Warfare** | |
| STR + CHA | | Intimidation |
| DEX + INT | Frost Magic | |
| DEX + CHA | Performance | |
| DEX + CON | **Dirty Fighting** | Survival |
| INT + CON | | Smithing |
| CHA + INT | | Streetwise |
| CHA + CON | Dark Magic | |

25 battle skills (8 weapon + 17 others), 11 check skills. A build may use any skill touching its stats (a CON merc takes Weapon and Shield). DEX + CON is the one weak row, accepted.

## Consequences

- Load per stat (two-attribute skills count half): STR 8, DEX 9, INT 7.5, CHA 6, CON 5.5.
- Open: two more battle skills (one that lowers foe resistances; Claude: Hexing on CHA + INT); Warfare's scope; Precision vs LUK overlap (both raise heads chance; Precision through abilities).
