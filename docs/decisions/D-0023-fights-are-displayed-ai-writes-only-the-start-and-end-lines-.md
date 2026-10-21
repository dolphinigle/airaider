---
id: D-0023
title: Fights are displayed; AI writes only the start and end lines and the sprites
status: accepted
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0003]
sources: []
---

## Context

E-0003 moved fights toward a party coin autobattle. The text sim printed 40-60 lines per fight, and Claude flagged that as a readability problem.

## Decision

The designer's words: "yea the fight will be DISPLAYED not read. ai writing is just for start/end not mid fight and for generating the sprites."

- A fight is shown as animation (sprites, coins flipping, hearts), not as text.
- The AI writes one line when a fight starts and one when it ends, plus the sprites. It writes nothing mid-fight.

## Consequences

- Fight length is a pacing question (how long it plays on screen), not a reading question.
- Claude still needs a text log of every fight to playtest (text-UI parity); that log is a dev view, not the player's.
- Fits D-0004 (mechanics carry the fun) and D-0007 (one line to open, one to close).
