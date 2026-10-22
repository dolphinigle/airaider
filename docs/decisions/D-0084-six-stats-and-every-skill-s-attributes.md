---
id: D-0084
title: Six stats and every skill's attributes
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0079]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0079 cut WIL, added LUK and restated the battle-skill pairings. The designer then paired every check skill, moved Dark Magic off INT and gave Fire and Frost a second attribute, to take load off INT ("its already a strong stat").

## Decision

The designer, 2026-10-22: "Streetwise is Cha+Int", "Awareness should be Dex", "Craft should be STR+INT" (now Smithing), "Cooking ... maybe CON?", "Intimidation should be str+cha", "int should be 3% xp then. its already a strong stat. Dark magic lets move to CON", "Fire magic is STR+INT i think (path of exile does that) ... another magic there is DEX+INT", "yea ok dark magic put to con", "yea agree with path of exile magic". Claude's drafts for Athletics, Survival, Roguery, Persuasion, Lore and Engineering were approved with "ok".

**Stats (restating D-0079):** STR DEX INT CHA CON LUK. WIL is gone; no stat touches stress. LUK has no skills and raises the heads chance of every coin (working 50% at 10, ±0.5% per point).

| attribute | battle skills | check skills |
|---|---|---|
| STR | Cleaving Weapons, Long-reach Weapons | Athletics |
| DEX | Unarmed, Ranged, Dirty Fighting, Stealth | Roguery, Perception |
| INT | Doctor, Alchemy, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Performance, Animal Companion, Holy Magic | Persuasion |
| CON | Defense, **Dark Magic** | Survival, Cooking |
| two | Fast Weapons DEX + STR, Heavy Weapons STR + CON, **Fire Magic STR + INT, Frost Magic DEX + INT** | Streetwise CHA + INT, Intimidation STR + CHA, Smithing STR + INT |

Fire, Frost and Lightning follow Path of Exile's colors (Anger STR, Hatred DEX, Wrath INT). A two-attribute skill flips the average of the two + skill level (Claude, working).

**INT's XP passive is 3% increased XP per point above 10** (reduced below; D-0081 counted from 10).

## Consequences

- Load per stat (a two-attribute skill counts half each): STR 5.5, DEX 7, INT 7, CHA 6, CON 4.5 (INT was 9). CON also gives HP.
- 7 of 30 skills use two attributes: still "a few" (D-0074).
- A fire mage is a burly battle-caster; Dark Magic is a tough warlock who pays in stress.
- Touches design/mercs.md, NOW.
