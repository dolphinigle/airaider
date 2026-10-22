---
id: D-0081
title: Attribute passives count from a baseline of 10
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0080]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0080 set each attribute's passive at "per point" without a zero point.

## Decision

The designer, 2026-10-22: "10 should be the baseline, so for example mercs with 10 INT does NOT gain extra exp. less than 10 = los exp".

**Every passive counts from 10:** at 10 it does nothing, above 10 it helps, below 10 it hurts.

| stat | passive (working size per point) |
|---|---|
| STR | damage on all the merc's damage, +1% per point above 10 (designer's 1%), −1% per point below |
| DEX | speed coins (turn order) |
| INT | XP of every kind, merc and every skill: ±1% per point from 10, stacking with skill stars |
| CHA | quest gold: ±1% per point from 10, from the squad's highest CHA |
| CON | max HP |
| LUK | heads chance on every coin: 50% at 10, ±0.5% per point (55% at 20) |

DEX and CON feed whole systems (turn order, HP) and keep their own scales.

## Consequences

- A 10 is "average": readable at a glance on a recruit card. A low stat is now a real flaw, which fits gacha recruits with rough spots.
- STR 20 gives +10% damage; STR 8 gives −2%.
- Touches design/mercs.md.
