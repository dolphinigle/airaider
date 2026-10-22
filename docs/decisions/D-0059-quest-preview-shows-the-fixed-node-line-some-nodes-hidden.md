---
id: D-0059
title: Quest preview shows the fixed node line, some nodes hidden
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0057 made a quest a straight line of combat and skill-check nodes. Open: how many nodes, and what the player knows before picking the squad.

## Decision

The designer, 2026-10-22: "i think just be fixed. in the quest preview it should tell like COMBAT - <survival!> - COMBAT - ... something like this. sometimes its HIDDEN"

- Each quest's node line is **fixed**.
- The **quest preview shows it**: `COMBAT – SURVIVAL – COMBAT – ??? – BOSS`. A check node names the skill it tests.
- **Some nodes are hidden** (`???`) until reached.

Claude's notes, not yet ruled:
- A check node tests **one named skill** (any skill, battle or check: `DOCTOR`, `LORE`). This replaces Claude's earlier 2–3-approaches shape: the preview becomes a squad-building puzzle (see a Survival check, bring a Survival merc).
- A hidden node could be a combat or a check; Scouting could reveal some later.

## Consequences

- Squad picking (D-0055 "pick squad") is now informed by the line: who you send matters before the quest starts.
- Touches design/quests.md.
