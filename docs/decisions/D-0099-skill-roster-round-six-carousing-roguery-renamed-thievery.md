---
id: D-0099
title: Skill roster round six: Carousing, Roguery renamed Thievery
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0098]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

After D-0098, weighted counts (weapon skills at half) showed CHA (6) and CON (5.25) as the lightest stats. The designer asked for one more battle skill there; E-0005 round 12 surveyed CHA and CON combat packages.

## Decision

The designer, 2026-10-22: "change roguery to thievery to be more clear its lockpicks etc. ok drinking is good, add it to CHA+CON then as carousing. its a BATTLE skill full o[f] one time use skills."

- **Carousing** (CHA + CON, battle skill): drinking. **Its abilities are one-time uses** (bottles, per quest; D-0062). Claude's draft bases from round 12: liquid courage (no stress gain for a few turns, heals none), drunken sway (dodge charges), spit a burning spirit (Fire), share a flask with an ally, a hangover after. Skins: Tavern Brawler, Sailor's Grog, Dwarven Stout, Old Soldier's Flask. Alchemy brews and throws; Carousing drinks and endures.
- **Roguery is renamed Thievery** (check skill, DEX): locks, pockets, traps, forgery.

W = weapon skill (at most one per merc, D-0090).

| attribute | battle skills | check skills |
|---|---|---|
| STR | Two-handed (W), Polearm (W), Berserk, Executioner | Athletics |
| DEX | Shooting (W), Stealth, Precision | Perception, **Thievery** |
| INT | Doctor, Alchemy, Concentration, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Animal Companion, Holy Magic | Persuasion |
| CON | Defender, Survivor | Cooking |
| STR + DEX | Single Weapon (W), Dual Wield (W), Unarmed (W), Throwing (W), Dirty Fighting | |
| STR + CON | Weapon and Shield (W) | |
| STR + INT | Fire Magic, Warfare | |
| STR + CHA | | Intimidation |
| DEX + INT | Frost Magic | |
| DEX + CHA | Performance | |
| DEX + CON | Retaliation | Survival |
| INT + CON | | Smithing |
| CHA + INT | | Streetwise |
| CHA + CON | Dark Magic, **Carousing** | |

**29 battle skills (8 weapon + 21 others), 11 check skills.** Rest of D-0098 stands.

## Consequences

- Weighted load (two-attribute skills half each, weapon skills half again): INT 8.5, DEX 8, STR 7.25, CHA 6.5, CON 5.75.
- Open: Warfare's scope; Precision vs LUK; which skills carry resistance-lowering bases.
