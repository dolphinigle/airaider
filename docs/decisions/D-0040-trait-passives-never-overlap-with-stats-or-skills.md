---
id: D-0040
title: Trait passives never overlap with stats or skills
status: accepted
date: 2026-10-21
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0110
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Traits (gender, race, personality, body) give passives (D-0036, D-0038, D-0039). Stats (STR, DEX…) and skills (Survival, Swords…) are already coins that skill checks and abilities use.

## Decision

The designer: "make sure they don overlap with attributes / skills"

- A trait's passive **never adds or removes stat or skill coins**: Muscular is not +STR, Clever is not +INT.
- It works on axes that stats and skills don't touch, for example: fight numbers (damage %, speed, HP, dodge, who foes target), injury and recovery, upkeep and pay, loot and XP, mood at base.

## Consequences

- Muscular reads as "+10% HP, eats double rations", not "+1 STR".
- Open: race already biases starting stats (D-0018). That is generation, not a passive, but it is an overlap the designer may want gone.
