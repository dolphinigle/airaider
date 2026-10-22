---
id: D-0092
title: Crits: every coin heads for mercs, 1.5x for foes
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Several skills mention crits (Single Weapon, Fury) with no rule for what a crit is. Mercs attack by flipping coins (D-0069); foes are fixed and never flip (D-0041 working model).

## Decision

The designer, 2026-10-22: "CRIT = causes all coins to flip heads btw." and "(for enemies CRIT is 1.5x damage)".

- **A merc's crit turns every coin of the attack to heads:** the attack deals its maximum (coins × ability base, then the usual multipliers).
- **A foe's crit deals 1.5× damage.**

## Consequences

- A merc crit is about 2× an average flip at 50% heads (about 1.8× at LUK 20, since LUK already lifts the average). It grows with coins, so it stays exciting all career, and it is readable: a row of all heads.
- Open: what sets crit chance (a base %, abilities, modifiers, Single Weapon and Fury bases); whether checks and status flips can crit; how crits show in text.
