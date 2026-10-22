---
id: D-0089
title: Fury and Grit join the battle skills
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

No skill covered Darkest Dungeon's Leper (self-heal) or Hellion (berserker); E-0005 rounds 8 and 9 surveyed both and their names.

## Decision

The designer, 2026-10-22: "both fury and grit are great" ("fury is hellion, grit is leper"), then "ok add: Fury and Grit".

| skill | covers | attributes (Claude, unopposed) |
|---|---|---|
| **Fury** | the berserker (Hellion): burst self-buffs, huge hits that exhaust you after, war cries, kills feed it, stronger when hurt or paid in HP | STR + CON |
| **Grit** | the survivor (Leper): self-heal, shrug off statuses, survive a killing blow once, regen; keeps only itself alive | CON |

Both are style skills, not weapon skills: they combine with any one weapon skill (D-0088). Names are the designer's; Claude's alternatives (Berserker, Juggernaut, Toughness) stay on file in E-0005 round 9.

## Consequences

- 21 battle skills. Darkest Dungeon: Leper = Heavy + Grit, Hellion = Long-reach + Fury, Flagellant = Fast + Holy + Fury (closes the HP-cost gap, E-0005 round 4).
- Split: Defender protects others, Grit protects itself; Doctor heals others with per-quest uses, Grit heals itself.
- Fury is a natural home for rare "more" damage (D-0082).
- Load per stat: STR 6.5, DEX 7.5, INT 7, CHA 6, CON 5.5.
- Not taken (yet): Nature Magic, Blood Magic, Illusion, Duelist, Hunter (E-0005 round 9).
