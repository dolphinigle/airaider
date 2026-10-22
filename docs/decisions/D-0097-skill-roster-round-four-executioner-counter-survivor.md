---
id: D-0097
title: Skill roster round four: Executioner, Counter, Survivor
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0096]      # e.g. [D-0003]
superseded-by: D-0098     # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0096 left two battle skills to find. The designer then set a structure rule, renamed Grit, and picked both skills from E-0005 round 11 (a sweep of what games put on Strength).

## Decision

The designer, 2026-10-22: "every class except STR has two \"flex\" skills ... so we want to add one more to st[r]"; "change Grit to survivor. rmb that the actual skill name will be a \"skin\" that ai picks over theses so they have to be generic"; "Executioner is really the best. like deal damage to foes with lower hps"; "counter should be a DEX+CON missing link we were looking for earlier. executioner put in str".

- **Skill names are generic categories;** the AI skins each merc's exact name over them (a greatsword skill maps to Two-handed; D-0021).
- **Each single attribute has two flex skills** (not weapon, not magic): STR Berserk + Executioner, DEX Precision + Stealth, INT Doctor + Alchemy, CHA Leadership + Animal Companion, CON Defender + Survivor.
- **Grit is renamed Survivor** (scope unchanged from D-0089).
- **Executioner** (STR): the finisher, more damage the lower the foe's HP.
- **No skill is dedicated to lowering foe resistances** (drops D-0095's ask); such effects can live as bases in other skills.
- **Counter** (DEX + CON): counters, ripostes, punishing foes that hit you or a neighbor; archers shoot back. Fills the weak DEX + CON row.

W = weapon skill (at most one per merc, D-0090).

| attribute | battle skills | check skills |
|---|---|---|
| STR | Two-handed (W), Polearm (W), Berserk, **Executioner** | Athletics |
| DEX | Shooting (W), Stealth, Precision | Perception, Roguery |
| INT | Doctor, Alchemy, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Animal Companion, Holy Magic | Persuasion |
| CON | Defender, **Survivor** | Cooking |
| STR + DEX | Single Weapon (W), Dual Wield (W), Unarmed (W), Throwing (W) | |
| STR + CON | Weapon and Shield (W) | |
| STR + INT | Fire Magic, Warfare | |
| STR + CHA | | Intimidation |
| DEX + INT | Frost Magic | |
| DEX + CHA | Performance | |
| DEX + CON | Dirty Fighting, **Counter** | Survival |
| INT + CON | | Smithing |
| CHA + INT | | Streetwise |
| CHA + CON | Dark Magic | |

27 battle skills (8 weapon + 19 others), 11 check skills. Rest of D-0096 stands.

## Consequences

- Load per stat (two-attribute skills count half): STR 9, DEX 9.5, INT 7.5, CHA 6, CON 6.
- Rejected on the way: Sundering (heavy weapons only, belongs in Two-handed), Strongman, Slayer, Vanguard, Power, Earthshaker, Juggernaut.
- Overlaps to keep apart in bases: Executioner vs Berserk ("kills feed it"); Counter vs Single Weapon's riposte and Defender's guarding.
- Open: Warfare's scope; Precision vs LUK; which skills carry resistance-lowering bases.
