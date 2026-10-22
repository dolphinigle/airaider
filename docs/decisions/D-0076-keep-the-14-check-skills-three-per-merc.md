---
id: D-0076
title: Keep the 14 check skills, three per merc
status: superseded         # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0077
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0058 set a working quota of 2 check skills per merc. Claude proposed merging the 14 check skills into 8 so a 4-merc squad (8 slots) covers most check nodes.

## Decision

The designer, 2026-10-22: "i think the earlier is better? just make 3 per merc instead?"

- The 14 check skills stay unmerged: Athletics, Survival, Awareness, Roguery, Streetwise, Persuasion, Deception, Bargaining, Intimidation, Civilization Lore, Nature Lore, Arcane Lore, Engineering, Smithing.
- **Each merc has 3 check skills** (was 2, working). Battle skills stay at 3 (2 at the start + the Lv 7 pick).

## Consequences

- Coverage (Claude's math, random skills): a 4-merc squad holds about 8.7 of the 14, so a check node's named skill is in the squad about 62% of the time (the 8-skill merge gave 68%). Anyone can still flip the attribute alone (D-0069), and some nodes name battle skills.
- Open: when the 3 are gained (all at recruitment, or some later); attribute pairings; whether check skills do anything outside check nodes; what each does in nodes.
- Touches design/mercs.md (quota line).

## Options considered

- Merge to 8, 2 per merc (Claude): fewer, broader skills; lost to the designer's preference for the finer list.
