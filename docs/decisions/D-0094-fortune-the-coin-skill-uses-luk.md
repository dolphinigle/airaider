---
id: D-0094
title: Fortune, the coin skill, uses LUK
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

The designer wanted a 16th non-weapon battle skill "in the spirit of fury/grit", then: "i think a CRIT (aka coin manipulation) line will be good. Precision? Luck? Godsense?" Claude offered Precision, Fortune, Foresight and Gambit, recommending Fortune on CHA and keeping LUK skill-free.

## Decision

The designer, 2026-10-22: "ok put fortune as a luk skill then."

- **Fortune** is a battle skill (not a weapon skill; combines with any weapon): the gambler with charmed coins. Bases from the coin toolkit: crit chance up (self or party), re-flip your tails, double or nothing, weighted coins on allies' flips, a marked foe's next hit crits, act again or reset a cooldown on a crit, cancel a foe's next crit.
- **Fortune uses LUK.** It is LUK's only skill; this overrides "LUK has no skills" (D-0079, D-0086).

## Consequences

- 24 battle skills: 8 weapon + 16 others.
- A high-LUK Fortune merc double-dips (better heads on every coin + Fortune's coins): Fortune is the luck build.
- Crits (D-0092) get a home skill.
