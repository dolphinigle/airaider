---
id: D-0083
title: Check skills: eleven, three per merc
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0077, D-0078] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0077 merged the check skills to nine and D-0078 named two of them (Intimidation, Craft). While pairing attributes, the designer reshaped the list again.

## Decision

The designer, 2026-10-22: "Awareness should be Perception"; "lets split craft again. Smithing (INT+STR) and Cooking maybe?"; "put Engineering back"; "lets lock Cook".

**Eleven check skills, 3 per merc:**

| skill | covers |
|---|---|
| Athletics | climbing, swimming, running, hauling |
| Survival | foraging, camping, weather, terrain, trails |
| Perception | spotting ambushes, keeping watch, searching (was Awareness) |
| Roguery | locks, pockets, traps, forgery |
| Streetwise | rumors, finding people, city ways |
| Persuasion | charm, diplomacy, haggling, appraising (took in Bargaining) |
| Intimidation | threats, interrogation, lies, bluffs, disguises (took in Deception) |
| Lore | the past, peoples, faiths; plants, beasts, monsters; undead, demons, curses, relics (the three lores) |
| Smithing | weapons, armor, repairs |
| Engineering | building, machines, explosives, traps |
| Cooking | camp meals, provisions, the base kitchen |

Craft is gone (split back into Smithing and Engineering). Cooking is a new skill; the name stays "Cooking", not "Food" (Claude: a skill is what a merc does; "Food" is free for a resource later).

## Consequences

- Coverage (Claude's math, random skills): a 4-merc squad holds about 7.9 of the 11; a check node's named skill is in the squad about 72% of the time.
- Cooking gives the base a kitchen skill and camp meals a home (ties to the open question of check-skill uses outside nodes).
- Open: when the 3 are gained; uses outside check nodes; what each does in nodes.
