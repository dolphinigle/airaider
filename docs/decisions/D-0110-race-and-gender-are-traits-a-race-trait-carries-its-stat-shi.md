---
id: D-0110
title: Race and gender are traits; a race trait carries its stat shift; humans and gender have no effect
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0040]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0011]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0106 and D-0108 gave each race a +1 / −1 stat shift, rolled into starting stats (a human a random one). D-0040 said a trait never adds or removes stat coins, and flagged race's stat bias as an overlap the designer might want gone. While Claude drafted recruit randomness (E-0011), the designer moved the shift into the trait.

## Decision

The designer, 2026-10-23: "btw the race affecting attr shouldnt be hardcoded. Instead, it should be a TRAIT. i think humans should just do ntohing instead of picking 2 random -- thats handled by the randomness" · "the TRAIT then gives the +1 dex -1 con for example." · "races gender everything should all be traits. gender has no effect but flavor."

- **Everything about who a merc is, race and gender included, is a trait** (D-0039's four kinds).
- **A race trait carries its stat shift** (+1 / −1, D-0106; shifts per race in D-0108, elf in D-0109). It applies on top of the starting stats; it is not baked into them.
- **Human: no stat shift.** Starting-stat randomness already varies humans.
- **Gender: flavor only, no effect.**
- Restating D-0040 with the exception: **trait passives never add or remove stat or skill coins, except a race trait's +1 / −1.**

Claude's reading: a race trait's star scales its passive (D-0068), not its ±1 shift.

## Consequences

- Race identity: its trait (stat shift + passive), its exclusive skill; human peoples stay flavor (D-0108).
- Personality and body traits still work only on axes stats and skills don't touch.
