---
id: D-0025
title: Battle skills are base skills plus engine-priced modifiers, named by the AI
status: proposed
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0003]
sources: []
---

## Context

E-0003 mocked three sources of battle skills with Sonnet standing in for the game's AI. AI-generated mechanics drifted (5 of 6 mercs got the same block skill, wrong sources, wild power). A fixed list was clean but samey. The designer then proposed base skills plus modifiers; mock 2 showed the engine can price every modifier, so AI picks shape skills without breaking balance, and that free picks pile on raw damage while engine-dealt candidates spread them out.

## Decision

The designer's words: "we have a list of skills, and a bunch of modifiers for it. Then AI skin it and pick one or two modifiers. For example, Cleave: Deal 3 PHYSICAL to all frontline enemies (battle is on a 2x3 grid, 3 backline 3 frontline, see vagrus). Stamina cost: 3. Mana cost: 0. Mods: "Fiery": add 1 FIRE damage, 1 MANA cost" · "3 is 3 damage PER heads." · "NO LINES. no ai stuff except BEFORE and AFTER battle."

- **Grid.** Each side fights on a 2×3 grid: 3 frontline, 3 backline (as in Vagrus).
- **Base skills** are a fixed engine list. Each comes from a core skill and states a damage type, a target pattern on the grid, a stamina cost and a mana cost.
- **Damage is per heads.** The merc flips their coin pool for the skill; each heads deals the skill's number ("Deal 3 PHYSICAL" = 3 per heads).
- **Modifiers** are a fixed engine list. Each adds an effect and a cost; the engine computes the final skill.
- **The AI** names each of a merc's skills and picks 1 or 2 modifiers for it, once, when the merc's skills are made. Names only: no flavor lines. Proposed by Claude: the engine deals the AI 3 fitting candidate modifiers per skill, weighted by the merc's skills, and the AI picks from those.

## Consequences

- Balance stays in engine data; the AI only shapes and names.
- Damage scales with coins, so foe HP is set in multiples of the per-heads numbers.
- Open: whether a modifier's damage (Fiery +1 FIRE) is per heads too (assumed yes); damage types and resistances; stamina and mana pools and regeneration; how slots and tactic books (E-0003) sit on top.
