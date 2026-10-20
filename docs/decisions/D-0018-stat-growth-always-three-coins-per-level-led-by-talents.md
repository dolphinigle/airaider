---
id: D-0018
title: Stat growth: always three coins per level, led by talents
status: accepted
date: 2026-10-21
decided-by: designer
supersedes: [D-0016]
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

D-0016 left a gap: what happens to the second coin when the 50% roll misses, or when a ++ merc has no second talent. Read as "the coin is lost", levels gave only 2–2.5 coins. The designer closed the gap.

## Decision

The designer's words (D-0016): "initial stats should be a little randomized, per race randomization. … stat increase is randomized: one guaranteed on a random talent, then 50% chance on a second talent, if any, then third one is completely random. On level up instead, every (2? 3?) levels, you can pick another SKILL to unlock …" Then: "yea always 3 coins: missed roll goes to random stat sounds good."

Restated in full (this replaces D-0016):
- Every merc has a **level**, starting at Lv 1. Level 12 is around the endgame.
- **Talents:** two random draws over the five stats (D-0009), which may overlap (STR++ or STR+ DEX+).
- **Starting stats** are a little randomized, biased by **race** (a wolfkin leans DEX).
- **Stat growth is random, not chosen. Every level up gives exactly three coins, at most one per stat:**
  1. one coin on a random talented stat;
  2. one coin on the second talented stat with a 50% chance; on a miss, or if there is no second talented stat, this coin goes to a random stat;
  3. one coin on a random stat.
- **The player's level-up choice is a skill**: every few levels the merc unlocks a new skill from a few choices (cadence proposed in D-0017).
- A **Level up** button appears at the XP threshold; XP overflows (D-0012).

## Consequences

Expected gain per level (6000 simulated mercs per build, `ALWAYS3=1 node experiments/E-0001-first-game-sim/grow.mjs`):

| talents | each talented stat | each other stat |
|---|---|---|
| STR++ | 1.00 | 0.50 |
| STR+ DEX+ | 0.875 | 0.42 |

- By Lv 12 untalented stats sit around 6–8, so the right merc still matters but the wrong one isn't hopeless.
- Sim placeholders: start ●● per stat, +1 on the race stat, +2 random coins.
