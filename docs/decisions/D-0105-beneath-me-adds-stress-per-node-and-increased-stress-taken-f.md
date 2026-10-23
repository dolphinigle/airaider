---
id: D-0105
title: Beneath me adds stress per node and increased stress taken for the whole quest; the designer's quest curve stands
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0103]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0008]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0103 gave overleveled mercs flat stress per node. Claude also pointed out that the designer's quest curve (1, 2, 2, 3, 3, 4, 5, 10, 20, 100, 1000, 10000) makes Lv 10 the practical maximum, not Lv 12, and offered a later-starting curve.

## Decision

The designer, 2026-10-23: "beneath me should also add stress inc multiplier on the quest itself. use my curve."

Restated in full (replaces D-0103):
- **Beneath me**, for a merc 3 or more levels above the quest:
  - **stress at every node:** 3 above +25, 4 or more above +50 (working);
  - **increased stress taken for the whole quest** (D-0082 wording): 3 above 50% increased, 4 or more above 100% increased (working);
  - **skill XP follows the merc XP penalty** (2 below 50%, 3 below 20%, 4+ below 0%);
  - the quest preview shows it ("Brann: beneath me, +50 stress a node, 100% increased stress taken");
  - later, with gold: such a merc also asks for higher pay.
- **The quest curve is the designer's:** quests at the merc's level to the next level 1, 2, 2, 3, 3, 4, 5, 10, 20, 100, 1000, 10000. Lv 10 after 50 quests, Lv 11 after 150, Lv 12 after 1150: in practice mercs end at Lv 10, Lv 11 is rare.

## Consequences

- A merc 4 above the quest hits 100 stress in two nodes even before the fights add their own, now doubled.
- Lv 10 is the effective career length for sims and balance; Lv 11–12 are bragging rights.
