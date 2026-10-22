---
id: D-0071
title: Skills use two attributes; Villainy becomes Dirty Fighting
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0074
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0069 made checks and attacks flip attribute + skill level, with one attribute per battle skill (Claude's draft).

## Decision

The designer, 2026-10-22: "skills can have two attributes. so fast weapons is DEX+STR, heavy is STR+CON, etc. ... lets rename villainy to Dirty fighting."

- **Each skill has two attributes** (Fast Weapons DEX + STR, Heavy Weapons STR + CON).
- **Villainy is renamed Dirty Fighting.**

Claude's working rule, not yet ruled: the flip uses the **average of the two attributes** + skill level, so pools stay on the 10 → 20 scale. The full pairing table is in design/mercs.md (draft, balanced so each attribute feeds 6–7 battle skills).

## Consequences

- A recruit's fit with a skill reads off two attributes, so fewer mercs are a perfect match and more are half-fits.
