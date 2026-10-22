---
id: D-0064
title: Attributes affect combat only indirectly
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0065
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Darkest Dungeon has no attributes, so the designer asked whether we still want the six (D-0044).

## Decision

The designer, 2026-10-22: "i think we still want them because they are used for skill checks. the question now becomes if we want them to also affect combat or no." Then: "probably they should indirectly. for example CON raising HP."

- **The six attributes stay**, for skill checks.
- **In combat they work only indirectly** (CON raises max HP). An ability flips **skill coins only**; no attribute coins join the pool. This replaces D-0041's "stat + skill" pool.

Claude's indirect hooks, one per attribute so every talent matters in fights (not yet ruled):

| attribute | in combat |
|---|---|
| STR | physical damage +% |
| DEX | speed coins (D-0044) |
| INT | magic damage +%, status effects last longer |
| CHA | healing and buffs +% |
| CON | max HP (D-0044) |
| WIL | stress builds slower; the stress check (D-0042) |

## Consequences

- No stat/skill pairing table for abilities. Checks keep pooling stat + skill.
- Combo bases (two skills) average the two skills.
- Touches design/mercs.md stats table and D-0041 (proposed).
