---
id: E-0003
title: Quest gameplay: autobattler vs coin tests for combat and non-combat skills
date: 2026-10-21
status: running
type: sim                 # research + sim
question: Should quests resolve fights as a Loop Hero-style autobattle instead of coin tests, and should non-combat checks (lores, talk, stealth) use the same engine or a different one?
verdict:                  # one line, filled in when done: the answer
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer (2026-10-21): "previously you just flip coins vs tests. but my concern is, lots of the 'skils' like the heavy weapon, ranged, etc, are 'combat' skills. in checks it make little sense to must pick one of them. maybe autobattler is better? do we still want autobattler for, say, other skill checks like lores? pls experiment, investigate online, then propose"

The problem: a test pools stats plus ONE core skill (D-0019). Six of the 27 cores are Fighting skills, and a fight test that names "Light Weapons" fails a merc who carries an axe. Fights are where weapon, armor and approach should matter, and a single pooled test flattens all of that.

Cross-check with findings: an autobattle has no player input while it runs, which is the known "spectator mode" failure (findings: Doesn't work). It can only work if the decisions sit around it: loadout, approach, retreat, push. That builds on "rolls that pay off a player decision" and answers the open question "What replaces combat?".

What would change our minds: if the sims show autobattle fights are no more decision-rich than coin tests, or if a single engine reads worse for talk/lore than a plain test, we keep tests for that side.

## Setup

Exactly what was run, so someone else could rerun it: the build, scripts in this folder, prompts, models, seeds, sample size, judges.

## Result

The numbers and the key observations. Paste the best samples here, or keep them in `samples/`. Bulk output stays in `raw/` (gitignored).

## Verdict

What we now believe, in a sentence or two. What it changes, and any decision it proposes.

## Next

Optional. The follow-up it suggests.
