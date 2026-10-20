---
id: D-0016
title: Stats grow at random, led by talents; level ups unlock skills
status: superseded
date: 2026-10-21
decided-by: designer
supersedes: [D-0010, D-0014]
superseded-by: D-0018
evidence: [E-0001]
sources: []
---

## Context

E-0001's endgame check (Lv 12) under D-0014 showed specialists at 13–14 next to dump stats stuck at 2. The designer reworked growth and moved the player's level-up choice from stats to skills.

## Decision

The designer's words: "initial stats should be a little randomized, per race randomization. Eg atlas is wolfkin so naturally somewhat higher AGI. stat increase is randomized: one guaranteed on a random talent, then 50% chance on a second talent, if any, then third one is completely random. On level up instead, every (2? 3?) levels, you can pick another SKILL to unlock, one of two or three choices (these choices are rolled at character start or smth?)."

Restated in full (this replaces D-0010 and D-0014):
- Every merc has a **level**, starting at Lv 1. Level 12 is around the endgame.
- **Talents:** two random draws over the five stats (D-0009), which may overlap (STR++ or STR+ DEX+).
- **Starting stats** are a little randomized, biased by **race** (a wolfkin leans DEX).
- **Stat growth is random, not chosen.** Each level up:
  1. one coin on a random talented stat (guaranteed);
  2. a 50% chance of one coin on the second talented stat, if there is one;
  3. one coin on a completely random stat.
- **The player's level-up choice is a skill.** Every few levels the merc unlocks a new skill, picked from a few choices. Cadence and choices: proposed in D-0017.
- A **Level up** button appears at the XP threshold; XP overflows (D-0012).

## Consequences

- Two distinct talents give about 2.5 coins per level; a ++ talent gives 2 (no second talent to roll), but all on one stat.
- Neglected stats still creep up from the random third coin, which softens the endgame gap.
- Placeholders in the sim (`experiments/E-0001-first-game-sim/grow.mjs`): start ●● per stat, +1 on the race stat, +2 random coins; the third coin goes on a stat not raised this level.
