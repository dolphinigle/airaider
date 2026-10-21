---
id: D-0037
title: A star-up item sets a merc to a fixed star, so 5 stars stay valuable
status: accepted
date: 2026-10-21
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0029 made a star-up item that raises a merc's star; its step size was open.

## Decision

The designer: "Star up item should instead UPGRADE fixed, e.g., this star upgrades a 2-3 star to 4 star for exasmple, that way 5 star are still valuable."

- A star-up item **sets a merc to a fixed star**, and works only on a stated range ("turns a 2–3★ merc into a 4★").
- It is not a step up (+½★), so a lucky pull stays the only road to the top: **5★ stays valuable**. Claude's reading: no star-up item reaches 5★.
- The rest of D-0029 and D-0032 stands: very rare, probably limited per game, resets the level and rerolls only the level-up seed.

## Consequences

- Different items can carry different ranges and targets (e.g. a 1–2★ → 3★ one, commoner). Which ones exist is open.
