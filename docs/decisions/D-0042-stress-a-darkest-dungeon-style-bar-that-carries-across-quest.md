---
id: D-0042
title: "Stress: a Darkest Dungeon style bar that carries across quests"
status: proposed
date: 2026-10-22
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0005]
sources: []
---

## Context

The designer chose a Darkest Dungeon style battle system (D-0041), and on Claude's list of what it would bring (ranks, movement, mark, stress) answered: "Stress sounds good yea".

## Decision

- Mercs have **stress**, as in Darkest Dungeon (designer).

## Open (Claude's proposal, not yet ruled)

- **The bar:** stress runs from 0 to 100 per merc and carries across quests.
- **How it rises:**
  - stress hits from some foe families (undead, cults);
  - an ally dropping;
  - a heavy hit;
  - failed skill checks;
  - long quests.
- **What happens at 100:**
  - The merc rolls a check (CON coins against a threshold, as in D-0013).
  - On a pass, they gain **Resolve**, a strong buff.
  - On a fail, they suffer a **Breakdown**: the merc acts outside their tactics (skips a turn, uses a random ability, or stresses their allies).
  - This is shown as engine text, with no AI lines (D-0023).
- **How it falls:**
  - rest at base, in buildings (this ties to base building);
  - Leadership and Performance abilities;
  - a trait's mood axis changes how fast stress builds (D-0040).
- **Open questions:**
  - whether high stress also blocks quests or adds quirks;
  - whether foes get a morale bar as the mirror.
