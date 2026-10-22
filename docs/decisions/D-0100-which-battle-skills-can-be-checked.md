---
id: D-0100
title: Which battle skills can be checked
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0058 let battle skills be checked too (Doctor, Leadership) without saying which. With the roster settled at 29 battle skills (D-0099), Claude listed them with a lean and the designer marked the ones check nodes may name.

## Decision

**13 of the 29 battle skills can be checked** (designer, 2026-10-22: "stealth, doctor, alchemy, leadership, animal companion, all five maci, warfare, performance, carousing"):

- Stealth, Doctor, Alchemy, Leadership, Animal Companion, Warfare, Performance, Carousing;
- all five magics: Fire, Frost, Lightning, Holy, Dark.

**The other 16 are never checked:** the 8 weapon skills, Berserk, Executioner, Precision, Concentration, Defender, Survivor, Dirty Fighting, Retaliation. They are how a merc fights, and combat nodes already use them.

A check node names one skill from the 11 check skills or these 13. The flip is attribute + skill level, or the attribute alone without the skill (D-0069).

## Consequences

- A check node can name any of 24 skills.
- Examples (Claude's draft): Stealth sneaks past a camp; Doctor treats a wounded stranger; Alchemy identifies a potion; Leadership rallies refugees; Animal Companion calms a beast; Fire Magic burns a barricade; Frost Magic freezes a river to cross; Lightning Magic wakes a dead mechanism; Holy Magic exorcises a haunt; Dark Magic reads a cursed tome; Warfare reads an old battlefield; Performance distracts a crowd; Carousing wins a drinking contest.
- design/mercs.md marks which battle skills can be checked.
