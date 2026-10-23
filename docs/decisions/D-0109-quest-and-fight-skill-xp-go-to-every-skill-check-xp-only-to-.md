---
id: D-0109
title: Quest and fight skill XP go to every skill; check XP only to the checked skill; elf is STR minus
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0010, E-0009] # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

E-0010 proposed fight skill XP only for battle skills whose abilities the merc used. D-0108 gave elf CON − as Claude's working shift.

## Decision

The designer, 2026-10-23: "quest xp should go to all skills. only skillc heck exp go to specific skills. elf should be -STR."

- **Skill XP from quest ends goes to every skill** the merc has. Claude's reading: fight XP too; only checks are specific.
- **Skill check XP goes only to the checked skill.**
- **Elf: INT + / STR −** (amends D-0108's working elf shift; the rest of D-0108 stands).

## Consequences

- No use-tracking: a merc's skills level together, so equipping never starves a skill.
- Check skills grow from quest ends and fights too, faster when checked.
