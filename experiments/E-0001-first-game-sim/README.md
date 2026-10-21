---
id: E-0001
title: first game sim
date: 2026-10-19
status: done
type: sim                 # sim | playtest | lab | judge | research
question: What does a fun squad-on-base session look like when Claude plays the game live and the designer steers it?
verdict: A quest of plain coin tests feels flat; the session designed the mercs (D-0007 to D-0022) and led to E-0002 and E-0003, which replaced fights with autobattles (D-0026).
decisions: [D-0004, D-0005, D-0006, D-0007, D-0008, D-0012, D-0013, D-0018, D-0019, D-0020, D-0021, D-0022]
commit: ebc79e2           # repo state at start; no v4 code exists
---

## Question

Before any v4 code (D-0002): Claude acts as the game, the designer plays and steers the rules turn by turn. We want to see which squad moments create frequent, tense chance rolls and readable story, and which feel flat. Whatever the designer keeps or cuts becomes proposed decisions.

## Setup

Paper sim in chat. Claude improvises the game state and rules under the designer's live instructions; no code, no AI calls. The full turn-by-turn transcript, including the designer's instructions verbatim, is kept in [log.md](log.md).

## Result

_Running; interim, 2026-10-21._

- Run 1: a walk with three trait-modified rolls, AI one-liners. Watchable but flat (3/3 wins, no choice during the walk). Led to the research in E-0002.
- Run 2: coin tests (stat + skill vs foe coins). Atlas lost 0/2; one bad flip decided the quest. The designer then fixed the rules: thresholds instead of foe coins, minimum successes, simpler lines.
- Mercs designed through play: six stats, 27 core skills with AI-named exact skills, random talents, random three-coin growth, hidden skill unlocks, PoE-style XP (D-0007 to D-0022; spec in docs/design/mercs.md, docs/design/quests.md).
- Next in this experiment: gameplay options to make quests more fun (designer has several, including Loop Hero-style autobattler fights).

Turn-by-turn record in [log.md](log.md); helper scripts [coins.mjs](coins.mjs) (odds, flips) and [grow.mjs](grow.mjs) (growth sim).

## Verdict

Plain coin tests with no choices are watchable but flat; designing mercs through live play worked well (mercs and tests are now in docs/design/). Fights moved to the autobattle work in E-0003 (D-0026). The next simulated playtest is its own experiment.
