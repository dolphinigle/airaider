---
id: D-0103
title: Mercs sent on quests far below their level gain stress and earn no XP
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23          # the day it got its current status
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0008]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

The designer, 2026-10-23: "more importantly there should be a penalty for sending high leel quester down, maybe big stress or larger pay or somethign that will prevent players from just slotting them on low level to grind mindlesly." D-0102 already zeroes merc XP 4+ levels down, but a strong merc still clears easy quests safely for skill XP and loot, and carries juniors.

## Decision

Claude's proposal; the designer, 2026-10-23, took the stress approach and said "the beneath me stress is too low" (numbers raised, working):
- **Skill XP follows the merc XP penalty** (2 below 50%, 3 below 20%, 4+ below 0%), so there is nothing to grind.
- **"Beneath me" stress:** a merc on a quest 3 levels below them gains 25 stress at every node, 4 or more below 50 at every node. Two nodes at 4 below reach 100 stress: a Breakdown risk on an easy quest. (Claude first offered 10 and 20; designer: "the beneath me stress is too low.")
- The quest preview shows it before departure ("Brann: beneath me, +20 stress a node").
- Later, with gold: such a merc also asks for higher pay.

Rejected alternative: Darkest Dungeon's refusal (high-level heroes won't go). It removes the choice; stress keeps it a choice with a price.

## Consequences

- Carrying a junior on an easy quest still works, but the carrier pays in stress and the rest weeks it needs.
