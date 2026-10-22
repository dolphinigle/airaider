---
id: E-0006
title: Damage models: hit check vs mitigation vs armor vs degrees
date: 2026-10-22
status: running           # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: Which damage model gives readable, tense, fair coin-flip attacks: hit check, % mitigation, armor subtraction, or degrees of success?
verdict:                  # one line, filled in when done: the answer
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer asked how attributes and defense should shape an attack (2026-10-22), offering (1) fixed damage per skill, attribute heads must beat the foe's defense to hit, and (2) always hit, damage from heads, cut by the foe's defense %. "propose several, test a bit". Goal (designer): "something thats POSSIBLE to balance and also FUN to the players." Balance means: "average player can clear the fights, if you minmax youll get advantage. not that you cannot clear unless you minmax, thats bad balance". So a weaker-but-reasonable merc must still contribute; min-maxing is a bonus, never the entry fee. We compare those two with two of Claude's (armor subtracts heads; degrees: graze / hit / crit) and a two-flip add-on (skill flip decides whether a status lands). What would change our minds: a model with frequent whole-turn whiffs, cliffs where one defense point swings hit chance hugely, or attribute gaps that make weaker mercs useless.

## Setup

`dmgsim.mjs` (exact binomial math, seeded Monte Carlo for kill counts and sample logs). Output: `samples/out.txt`. Attributes: old curve 3/6/13, flat curve 10/15/21 (Lv1, Lv12 untalented, Lv12 talented; D-0018 growth on a 10 base, the designer's idea). Foe HP 40.

## Result

The numbers and the key observations. Paste the best samples here, or keep them in `samples/`. Bulk output stays in `raw/` (gitignored).

## Verdict

What we now believe, in a sentence or two. What it changes, and any decision it proposes.

## Next

Optional. The follow-up it suggests.
