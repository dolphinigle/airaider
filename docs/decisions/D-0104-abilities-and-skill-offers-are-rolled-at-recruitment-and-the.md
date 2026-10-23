---
id: D-0104
title: Abilities and skill offers are rolled at recruitment and the AI picks them all up front; a weapon or magic skill's first ability has 0 cooldown; Lv 3 and Lv 5 skills are picks of 1 of 3
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0008]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0102 left two of Claude's readings open (the Lv 3 and Lv 5 skills as picks of 1 of 3), and Claude explained how abilities are learned (D-0069: battle-skill level ups at working skill levels 1, 3, 5, 7, 9; the engine deals a few bases and the AI picks and renames one).

## Decision

The designer, 2026-10-23: "(2) bases and skills rolled preferably is rolled at start so ai picks all five and their mods first. The FIRST skill of a weapon / magic skill line must be a 0 cd skill. (1) yes pick 1 from 3."

- **Rolled at recruitment:** the skill offers and, for each battle skill, the bases dealt for **all five** of its abilities and their mods. The AI picks and names all five up front, when the merc is made; later skill level ups only reveal them.
- **A weapon or magic skill's first ability has 0 cooldown** (the 8 weapon skills and the 5 magics). Claude's reading: a 0-cooldown attack, so every such skill opens with a default attack.
- **The Lv 3 battle skill and the Lv 5 check skill are each a pick of 1 of 3**, hidden until then, rolled at recruitment (D-0102).

Claude's reading, not yet ruled: the Lv 3 options' abilities are also rolled and picked at recruitment, so whichever the player picks is already written.

## Consequences

- One AI call writes a merc's whole ability career at recruitment; the player can't game future picks by timing.
- D-0032: rolls that the level-up seed decides (future abilities, mods, skill offers) are still rerolled by a reset; the AI then picks again.
- D-0050's generic fallback still covers a merc whose two starting battle skills are neither weapon nor magic.
