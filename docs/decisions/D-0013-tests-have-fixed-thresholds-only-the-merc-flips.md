---
id: D-0013
title: Tests have fixed thresholds; only the merc flips
status: accepted
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

E-0001 run 2 had enemies flip coins against the merc (a placeholder). Reviewing the coins-per-level odds, the designer changed it.

## Decision

The designer's words: "ok you DONT want enemis to flip coins. so the 'challenges' have fixed thresholds (eg 2) and only you flip coins i think. … Later on most quests will test two stats, RARELY three."

- Each test (challenge) has a **fixed threshold**: the number of heads needed (e.g. 2).
- **Only the merc flips.** Heads ≥ threshold is a success.
- Later in the game, most quests test **two stats**, rarely three.

## Consequences

- Odds are exact and easy to show: P(heads ≥ threshold) for the merc's coins. Table in `experiments/E-0001-first-game-sim/coins.mjs need`.
- A coin matters most when the threshold is near half the pool, about +15–20 points per coin there.
- Open: whether "test two stats" means one test pooling two stats or a quest whose tests span two stats.
