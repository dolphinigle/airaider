---
id: D-0038
title: Race gives a passive too, a trade-off like the trait passives
status: accepted
date: 2026-10-21
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0036 made personality traits the source of passives.

## Decision

The designer: "yup trait giving passivse sounds more interesting, so for eample Wolfkin can be +10% damage but -10% speed or smth"

- A merc's **race is a trait too** and gives a passive, e.g. **Wolfkin: +10% damage, −10% speed**.
- The designer's example is a **trade-off** (a plus and a minus), which keeps a race from being strictly better.

## Consequences

- A merc's passives are their race plus one or two personality traits, all part of the starting position (D-0032).
- Race already biases starting stats (D-0018); its passive adds a fight identity on top.
- "Speed" assumes fights have turn order or attack speed; the fight model is still the working model (E-0003).
