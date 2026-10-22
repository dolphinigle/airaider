---
id: D-0086
title: Skill attributes, round two: every pair but one has a skill
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0084, D-0085] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

After D-0084 and D-0085, Claude listed which attribute pairs had a skill: INT + CON, DEX + CHA, DEX + CON and CHA + CON had none. E-0005 round 7: CON with few or no skills is the tradition (D&D, Pathfinder); D&D's Warlock and Sorcerer cast with CHA and lean on CON.

## Decision

The designer, 2026-10-22: "yea but INT+CON combination is missing skills right?" (Smithing to INT + CON), "performance should be DEX CHA for sure. Survival fits DEX+CON so well. Hly magic should be CHA", "yea dark magic being CHA+CON makes sense", "im strongly considering moving dark magic to CHA+CON", "CON a bit thin is fine".

**Stats (restating D-0084):** STR DEX INT CHA CON LUK. No stat touches stress. LUK has no skills and raises the heads chance of every coin. INT's passive is 3% increased XP per point above 10.

| attribute | battle skills | check skills |
|---|---|---|
| STR | Cleaving Weapons, Long-reach Weapons | Athletics |
| DEX | Ranged, Dirty Fighting, Stealth | Roguery, Perception |
| INT | Doctor, Alchemy, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Animal Companion, Holy Magic | Persuasion |
| CON | Defense | Cooking |
| STR + DEX | Fast Weapons, Unarmed | |
| STR + CON | Heavy Weapons | |
| STR + INT | Fire Magic | |
| STR + CHA | | Intimidation |
| DEX + INT | Frost Magic | |
| DEX + CHA | **Performance** | |
| DEX + CON | | **Survival** |
| INT + CON | | **Smithing** |
| CHA + INT | | Streetwise |
| CHA + CON | **Dark Magic** | |

A two-attribute skill flips the average of the two + skill level (Claude, working).

## Consequences

- **All ten attribute pairs have a skill**, so a merc talented in any two stats has a skill that uses both.
- Load per stat (two-attribute skills count half each): STR 5.5, DEX 7.5, INT 7, CHA 6, CON 4. CON is thin by tradition and also gives HP.
- 12 of 30 skills use two attributes; still under half (D-0074).
- Dark Magic is the pact-maker: charms the demon (CHA), endures the price (CON), pays in stress (D-0072).
- Open idea, not taken: Carousing (CHA + CON drinking check skill) if CON ever needs more.
