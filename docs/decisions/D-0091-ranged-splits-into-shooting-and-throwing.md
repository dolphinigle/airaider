---
id: D-0091
title: Ranged splits into Shooting and Throwing
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0090 made melee five style skills plus Unarmed, leaving one ranged skill. The designer: "im more concerned about ranged being just one. ideally two. maybe Ranged and Throwing?"

## Decision

Claude proposed the split and names (Bannerlord splits Bow, Crossbow, Throwing; RimWorld calls it Shooting); the designer: "Agree."

| skill | covers | plays like | attributes |
|---|---|---|---|
| **Shooting** | bows, crossbows, guns | back-rank sniper: long reach to ranks 3–4, aimed shots, volleys, piercing | DEX |
| **Throwing** | knives, axes, javelins, slings | skirmisher: throws from front or middle ranks, quick multi-throws, bleeds | STR + DEX |

Both are weapon skills: at most one weapon skill per merc (D-0090). Ranged is gone; its weapon tags are no longer needed (flavor from modifiers and the AI's pick, D-0090).

## Consequences

- 23 battle skills; 8 weapon skills.
- Guns live in Shooting (D-0072 kept guns in the setting).
