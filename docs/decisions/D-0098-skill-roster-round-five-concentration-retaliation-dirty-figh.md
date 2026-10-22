---
id: D-0098
title: Skill roster round five: Concentration, Retaliation, Dirty Fighting to STR + DEX
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0097]      # e.g. [D-0003]
superseded-by: D-0099     # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0097 set the roster at 27 battle skills. The designer then moved Dirty Fighting, renamed Counter, and asked for one last skill: an INT flex skill a pure spellcaster can pair with, since Doctor is a role (the healer), not a flex skill.

## Decision

The designer, 2026-10-22: "Dirty fighting should be DEX+STR now that we have counter there"; "rename counter to Retaliation"; "ok dirty fighting is fine then" (name kept over Skullduggery); "lets pick one more so we have 8 weapons and 20 non weapons ... something that can be paired for pure spellcasters ... a flex skill for int that isnt doctor"; "i dont want it to be spell specific. for example, Precision is likely also working for magic"; "Concentration is great i think. lets go with that. Basically empowers your next action".

- **Concentration** (INT, flex): empowers your next action, any ability, weapon or spell. Claude's draft bases: charge the next ability, cut a cooldown, repeat the last ability, act twice, recover a per-quest use. Skins: Meditation, Monastic Training, Scholar's Rigor, Clear Mind.
- **INT's flex pair is Alchemy + Concentration;** Doctor is INT's role skill (the healer).
- **Counter is renamed Retaliation** (DEX + CON).
- **Dirty Fighting moves to STR + DEX** and keeps its name. Its skins come from a rough past (thug, bandit, gutter kid, pit fighter, bouncer: Thuggery, Gutter Brawling, Pocket Sand, Low Blows). Unarmed is how you hit; Dirty Fighting is what you do to the foe besides hitting (blind, weaken, mark, yank).

W = weapon skill (at most one per merc, D-0090).

| attribute | battle skills | check skills |
|---|---|---|
| STR | Two-handed (W), Polearm (W), Berserk, Executioner | Athletics |
| DEX | Shooting (W), Stealth, Precision | Perception, Roguery |
| INT | Doctor, Alchemy, **Concentration**, Lightning Magic | Lore, Engineering |
| CHA | Leadership, Animal Companion, Holy Magic | Persuasion |
| CON | Defender, Survivor | Cooking |
| STR + DEX | Single Weapon (W), Dual Wield (W), Unarmed (W), Throwing (W), **Dirty Fighting** | |
| STR + CON | Weapon and Shield (W) | |
| STR + INT | Fire Magic, Warfare | |
| STR + CHA | | Intimidation |
| DEX + INT | Frost Magic | |
| DEX + CHA | Performance | |
| DEX + CON | **Retaliation** | Survival |
| INT + CON | | Smithing |
| CHA + INT | | Streetwise |
| CHA + CON | Dark Magic | |

**28 battle skills (8 weapon + 20 others), 11 check skills. The roster is complete.** Rest of D-0097 stands (generic names, two flex skills per single attribute, no skill dedicated to lowering resistances).

## Consequences

- Load per stat (two-attribute skills count half): STR 9.5, DEX 9.5, INT 8.5, CHA 6, CON 5.5.
- Concentration vs Precision: Precision bends the coin, Concentration bends the action (tempo, charge, repeats).
- Open: Warfare's scope; Precision vs LUK; which skills carry resistance-lowering bases.
