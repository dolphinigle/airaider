---
id: D-0062
title: Nature Lore and Engineering leave combat; per-quest uses; stress healing in fights is rare
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Reviewing the battle skills (D-0058) after the Darkest Dungeon class check (E-0005 round 4).

## Decision

The designer, 2026-10-22:
- **Nature Lore and Engineering leave combat** ("remove nature lore and engineering fromc obmat"). They become check skills.
- **Some abilities have a limited number of uses per quest** ("especially alchemy / doctor, since they are using their medicines which can run out"). This adds to cooldowns (D-0041); there is still no mana or stamina.
- **Stress healing in fights is really rare and weak** ("because the main way to stress heal is resting"). Leadership and Performance keep their auras, songs and buffs; their stress healing is the exception, not their job (narrows D-0042).

## Consequences

- Battle skills drop to 16 before the melee split (D-0063).
- Per-quest uses make the node line (D-0057) a resource run: spend the potion now or save it for the boss.
- Rest at the base becomes the stress economy (D-0052 gold sink).
- To do: how status effects work, Pokémon style (one major status at a time) or Darkest Dungeon style (many stacking statuses with durations and resistances).
