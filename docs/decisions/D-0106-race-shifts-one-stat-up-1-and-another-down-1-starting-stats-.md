---
id: D-0106
title: Race shifts one stat up 1 and another down 1; starting stats get mild randomness
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0112
evidence: [E-0009]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0018 biases starting stats by race and adds a little randomness, with no numbers. Claude proposed (E-0009) a race lean of +2 / +1 / −1, two random coin moves, and talents weighted toward the race's stats.

## Decision

The designer, 2026-10-23: "race should just +1 to a stat and -1 to another so they dont 'force' builds for races. there should be RNG at play here so the starting attrs feel a little diff from merc to merc (but not too extreme)."

- **A race gives +1 to one stat and −1 to another.** It doesn't force a build.
- **Starting stats are mildly random**, so mercs feel a little different, never extreme.

Claude's working numbers and readings:
- Every stat starts at 10; three coins move at random (−1 from one stat, +1 to another), each stat kept within 8–12; then the race's +1 / −1 (a human's is random). Result: 35% of stats at 10, 82% at 9–11, 2% at 7 or 13; a merc's highest and lowest stats differ by about 3.
- Talents are not weighted by race (same reason: no forced builds).
- Placeholder races (the AI reskins them): wolfkin DEX / INT, catfolk DEX / CON, bearkin STR / DEX, elf INT / CON, dwarf CON / CHA, dragonkin CON / DEX, giantkin STR / INT (+ / −).

## Consequences

- Race identity lives in its trait passive (D-0038) and its exclusive skills (Beast Blood, Ancient Blood), not in stats.
