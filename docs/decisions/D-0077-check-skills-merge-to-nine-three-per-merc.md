---
id: D-0077
title: Check skills merge to nine, three per merc
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0076]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0076 kept all 14 check skills at 3 per merc. Drafting their attributes, the designer trimmed the list.

## Decision

The designer, 2026-10-22: "merge Lore together, the three lores are too much. Merge Smithing and Engineering. Merge Persuasion and Bargaining. Merge Deception and Intimidation."

Nine check skills, **3 per merc** (kept from D-0076):

| skill | merged from |
|---|---|
| Athletics | |
| Survival | |
| Awareness | |
| Roguery | |
| Streetwise | |
| Persuasion | Persuasion + Bargaining |
| Deception | Deception + Intimidation |
| Lore | Civilization, Nature and Arcane Lore |
| Engineering | Engineering + Smithing |

Names of the merged skills are Claude's working picks.

## Consequences

- Coverage (Claude's math, random skills): a 4-merc squad holds about 7.2 of the 9; a check node's named skill is in the squad about 80% of the time (62% with 14).
- Nature Lore (D-0062) now lives in Lore.
- Open: attribute pairings; when the 3 are gained; uses outside check nodes; what each does in nodes.
