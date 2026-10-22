---
id: D-0075
title: Battle skill attribute pairings
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0079
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0074: most skills use one attribute, a few two. Claude drafted the pairings for the 19 battle skills.

## Decision

The designer, 2026-10-22: "dark magic should be INT+WIL", then "the rest looks good".

| attribute | battle skills |
|---|---|
| STR | Cleaving Weapons, Long-reach Weapons |
| DEX | Unarmed, Ranged, Dirty Fighting, Stealth |
| INT | Doctor, Alchemy, Fire Magic, Frost Magic, Lightning Magic |
| CHA | Leadership, Performance, Animal Companion |
| CON | Defense |
| two | Fast Weapons DEX + STR, Heavy Weapons STR + CON, Holy Magic CHA + WIL, Dark Magic INT + WIL |

A two-attribute skill flips their average + skill level (Claude, working).

## Consequences

- CON and WIL feed few battle skills; CON also sets max HP and WIL is the stress check (D-0044).
