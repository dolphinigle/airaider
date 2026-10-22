---
id: D-0074
title: Most skills use one attribute; a few use two
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0071]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0071 misrecorded the designer's "skills can have two attributes" as "each skill has two attributes", and Claude's draft gave every battle skill two. The designer: "dont make all of them dual stat??? wtf".

## Decision

- **Most skills use one attribute; a few use two** (designer's examples: Fast Weapons DEX + STR, Heavy Weapons STR + CON). A two-attribute skill flips their average + skill level (Claude, working).
- From D-0071, still standing: **Villainy is renamed Dirty Fighting.**
- Pairings: design/mercs.md (Claude's draft; two attributes only where both clearly matter).

## Consequences

- One attribute reads at a glance on a recruit card; the few dual skills stand out.
