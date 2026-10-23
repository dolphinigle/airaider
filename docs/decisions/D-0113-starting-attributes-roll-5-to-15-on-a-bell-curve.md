---
id: D-0113
title: Starting attributes roll 5 to 15 on a bell curve
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0112]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0009]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0112 rolled each starting attribute on its own (Battle Brothers style), with Claude's working range uniform 8–12.

## Decision

The designer, 2026-10-23: "it should be 5-15 but with a normal disribution. so 5 and 15 are EXTREMELY RARE (0.1%), 6 is like 1%, 7 is like 5% 8 is 10-20%, 9 and 10 the rest."

Restated in full (replaces D-0112):
- **Each starting attribute is rolled on its own, 5 to 15 on a bell curve**, as in Battle Brothers.
- Odds per value: **5 and 15 0.1%, 6 and 14 1%, 7 and 13 5%, 8 and 12 10–20%**, the middle the rest (Claude: symmetric around 10; 8 and 12 14%, 9 and 11 19%, 10 21.8%).
- **The race trait's +1 / −1** applies on top (D-0110), so a race can reach 4 or 16 on its stats; humans none.

## Consequences

- A merc's highest and lowest starting stats differ by about 4; the six-stat total runs 55 (10th percentile) to 65 (90th).
- A 13+ start is a real find (about 6% of stats); a 15 is a legend.
