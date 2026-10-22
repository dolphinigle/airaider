---
id: D-0082
title: Percent modifiers use Path of Exile increased and more
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Percent effects are piling up: attribute passives (D-0081), traits ("Wolfkin: +10% damage"), trait stars (D-0068), foe defense % per type (D-0070), statuses that raise damage taken, ability modifiers. Without a stacking rule, stacked percents are ambiguous and can explode.

## Decision

The designer, 2026-10-22: "make sure our system uses path of exile "more" and "increased" keywords."

- **increased / reduced:** all of them on the same stat **add together** into one multiplier. 10% increased + 20% increased + 5% reduced = ×1.25.
- **more / less:** each one **multiplies separately**. 10% more and 20% more = ×1.1 × 1.2 = ×1.32.
- Final value = base × (1 + sum of increased − reduced) × each (1 ± more/less).
- Player-facing text always uses these words, never a bare "+10%".

Claude's working sort (not ruled):
- **increased/reduced** for broad, common sources: attribute passives (STR "1% increased damage per point above 10", reduced below), traits, later gear.
- **more/less** for rare, specific, build-defining sources: some ability modifiers, Resolve, a few statuses and boss mechanics.
- Foe defense % per damage type (D-0070) stays its own layer, applied after, like Path of Exile resistances.

## Consequences

- Stacking many common sources gives diminishing returns per source; a "more" stays a prized find. This keeps the minmaxer's edge real but bounded (balance target: average players clear, minmaxers get an edge).
- Touches design/mercs.md wording; any later combat page states the formula.
