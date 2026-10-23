---
id: D-0114
title: Every recruit starts with a weapon or magic skill; the AI picks skills from engine deals with no talent lean
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0011]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

E-0011 (recruit randomness): 29% of recruits had no weapon or magic skill and opened with a generic attack (D-0050). Claude proposed guaranteeing one, and a talent lean on skills (twice as likely if a skill uses a talented attribute).

## Decision

The designer, 2026-10-23: "(1): Yes. (2) so skills are offered to ai right? like you offer lots of them then ai select 3? then no. (3) up to u. (4) up to u"

- **One of the two starting battle skills is always a weapon or magic skill**, so every merc opens with a real default attack (D-0104's 0-cd first ability). The generic fallback (D-0050) stays only for edge cases.
- **Skills are dealt by the engine and picked by the AI**, like abilities: the engine deals legal candidates (at most one weapon skill, blood skills only for their races), the AI picks those that fit the merc. **No talent lean.**
- Skill-star spread and race odds: Claude's call.

Claude's working numbers:
- Starting battle skills: a deal of 4 weapon or magic skills, the AI picks 1; a deal of 4 more, the AI picks 1. Lv 3 offer: deal 6, the AI picks the 3 the player will see. Check skills: deal 4, pick 2; Lv 5 offer: deal 6, pick 3. All at recruitment (D-0104).
- Skill and trait stars: around the merc's star, same 45%, ±½★ 20% each, ±1★ 7.5% each.
- Races: human 40%, wolfkin, catfolk, elf, dragonkin, orc 12% each.

## Consequences

- The AI shapes a coherent merc (an elf frost mage with Fire, a gunner with Defender) inside engine-set rules; balance stays in the engine.
