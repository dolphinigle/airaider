---
id: D-0112
title: Starting attributes roll each stat on its own, like Battle Brothers
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0106]      # e.g. [D-0003]
superseded-by: D-0113
evidence: [E-0009, E-0011] # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0106's working randomness (three zero-sum coin moves from 10) left some recruits at all 10s (E-0011's elf).

## Decision

The designer, 2026-10-23: "starting stat shouldnt all be the same is what i meant." · "attributes*" · "should have a little randomless like in battle brothers"

Restated in full (replaces D-0106):
- **Each starting attribute is rolled on its own**, a little random, as in Battle Brothers: no two recruits alike, never all the same.
- **The race trait's +1 / −1** applies on top (D-0110); humans none.

Claude's working numbers: each stat uniform 8–12 (20% each value), then the race trait. A merc's highest and lowest stats differ by about 3.4; the six-stat total varies (56 at the 10th percentile, 65 at the 90th), so some recruits roll better overall, as in Battle Brothers.

## Consequences

- A good stat roll is part of the recruit chase, next to stars.
