---
id: D-0011
title: Level up: pick a stat, flip a coin per talent mark
status: proposed
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001, E-0002]
sources: []
---

## Context

D-0010 needs a level-up mechanism that makes talents matter and keeps the player choosing. E-0002 found that chance is fun when it pays off a decision, and the game's fun is rolling coins often (D-0002).

## Decision

Proposed by Claude:

- **Start:** every stat begins at ●● plus one coin per talent mark (STR++ starts at ●●●●).
- **XP:** +1 per test faced, +1 more per test won. Lv n → n+1 at 5 × n XP. (Button, overflow, low-level penalty and skill XP: ruled in D-0012.)
- **Level up:** the player picks one stat. It gains **+1 coin for sure**, then the game flips **one bonus coin per talent mark** on that stat (+ = 1 flip, ++ = 2); each head is +1 more.
  - untalented: +1 · talent +: +1 or +2 · talent ++: +1 to +3
- The choice each level: grow a talent (bigger, gambled) or patch a weak stat (a sure +1) for the quests on the board.
- **Skills** don't grow at level up; they have their own XP (D-0012).
- **Open: coins per level.** The designer asked whether a level should give ONE, TWO or THREE coins. Claude's analysis (opposed flips, ties to the merc, odds from `experiments/E-0001-first-game-sim/coins.mjs`):

  | coins per level | one level ahead at Lv1 | one level ahead at Lv10 | pool at Lv10 |
  |---|---|---|---|
  | 1 | 64% → 75% | 58% → 65% | ~13 |
  | 2 | 64% → 83% | 56% → 67% | ~22 |
  | 3 | 64% → 89% | 55% → 69% | ~31 |

  A coin is worth less as pools grow, so one coin per level makes late levels feel small, while three makes early levels swingy and pools too big to read or animate. Claude recommends **one coin per level** plus the talent flips, keeping pools around 12 coins or fewer, with skills and gear adding the late-game growth.

## Consequences

- A level-up is itself a coin moment, the player's own gamble.
- Talents keep mercs distinct as they grow, without fixing their build.

## Options considered

- **Battle Brothers style:** every stat rolls a random gain at level up, talents raise the floor, the player keeps three. Rich, but five numbers per level to weigh.
- **Offer three stats:** the game offers three random stats (talents weighted), the player picks one. Simple, but less control.
