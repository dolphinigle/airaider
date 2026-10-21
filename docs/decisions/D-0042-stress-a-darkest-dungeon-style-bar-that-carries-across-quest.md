---
id: D-0042
title: "Stress: a Darkest Dungeon style bar that carries across quests"
status: accepted
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

The designer accepted Claude's proposal on 2026-10-22: "no pick up quirks, we dont want that. but stress is a good idea. lets do that."

- **The bar:** each merc has **stress from 0 to 100**, and it **carries across quests**.
- **How it rises:**
  - stress attacks from some foe families (undead, cults);
  - an ally dropping;
  - a heavy hit;
  - failed skill checks;
  - long quests.
- **What happens at 100:**
  - The merc flips a check against a threshold (D-0013).
  - On a pass, they gain **Resolve**, a strong buff for the rest of the fight.
  - On a fail, they suffer a **Breakdown**: for the rest of the fight they act outside their tactics (skip a turn, use a random ability, or raise their allies' stress).
  - This is shown as engine text, with no AI lines (D-0023).
- **How it falls:**
  - rest in buildings at base;
  - Leadership and Performance abilities;
  - personality traits, which change how fast stress builds (on the mood axis, D-0040).
- **No quirks:** stress never adds quirks.

## Open

- Which stat or skill the breakdown check flips (Claude suggested CON).
- Whether high stress matters outside fights (e.g. refusing quests).
- Whether foes get a morale bar as the mirror.
- Numbers (all parked with balance):
  - stress per source;
  - the check's threshold;
  - Resolve and Breakdown effects.
