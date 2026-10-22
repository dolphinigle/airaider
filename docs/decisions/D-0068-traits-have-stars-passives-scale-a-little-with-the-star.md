---
id: D-0068
title: Traits have stars; passives scale a little with the star
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0067 gave every skill a star. Passives come from traits (gender, race, personality, body; D-0036 to D-0040).

## Decision

The designer, 2026-10-22: "Traits should also have stars eg Muscular and the passives scales with thes tar (but only a bit, dont make it too extreme)"

- **Every trait has a star**, 1★–5★ in half steps.
- **A trait's passive scales a little with its star.**

Claude's working numbers, not yet ruled:
- Effect × (1 + 0.125 × (star − 1)): 1★ is the base, 5★ is 1.5× ("Muscular: +10% physical damage" → +15% at 5★).
- Only the upside scales; a trade-off's downside stays fixed.
- The merc's star makes high trait stars likelier, as for skills (D-0067).

## Consequences

- Recruits roll stars on skills and traits: more to read on a card, more RNG.
