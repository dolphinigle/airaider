---
id: D-0093
title: No rare skills; stars carry rarity
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0021 marked the magics rare (✦: seldom rolled at recruitment or for an unlock, D-0020); D-0070 kept Fire, Frost and Lightning rare. Since then every skill got a star (D-0069), and the designer trimmed the rare list down to Dark Magic alone.

## Decision

The designer, 2026-10-22: "maybe just remove "rare" skills for now. previously we do rare system because we didnt have the STAR rarity system. with it in place we no longer needs it."

- **No skill is rare.** Every battle and check skill rolls at the same odds (still weighted by race and background, D-0035).
- **Rarity lives in stars:** a skill's star (1★–5★) and the merc's star (D-0069).

## Consequences

- The ✦ marks in design/mercs.md go. Overrides the rare flag in D-0021 and D-0070.
- Magic-users are as common as fighters; a 5★ Dark Magic is the chase, not Dark Magic itself.
