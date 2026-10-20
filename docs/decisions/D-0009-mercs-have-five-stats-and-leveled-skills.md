---
id: D-0009
title: Mercs have five stats and leveled skills
status: accepted
date: 2026-10-20
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: [archive/v3/GENERATION_FLOW.md §10, archive/v3/CARDS.md]
---

## Context

The E-0001 stat screen showed four placeholder stats (STR, DEX, END, INT) and a flat "Swords" skill. The designer asked for more stats, pointing at the earlier docs, and for leveled skills.

## Decision

The designer's words: "should have more stats, pls check docs v4. For skills should have level, eg sword lv1." Then: "or rather just make the 'skills' like the 'stats' eg 'swords (3 coins)'."

- **Five stats**, taken from v3 (GENERATION_FLOW §10): **STR** strength · **DEX** dexterity (agility and perception) · **INT** intelligence · **CHA** charisma · **CON** constitution (endurance, toughness).
- **Skills work like stats**: each skill is a number of coins (Swords ●●● = 3 coins). *Ruled.*
- Coins for a test = the tested stat's coins + the matching skill's coins. *Placeholder for the sim.*

## Consequences

- The quest's tests name one stat and one skill each (e.g. STR + Swords, CON + Survival).
- v3's growth, focus, tag-lever and level-scaling math is not carried over; only the stat set is.

## Options considered

- Four stats with END (E-0001 placeholder): the designer asked for more.
