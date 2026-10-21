---
id: D-0027
title: Recruits have half-star rarity that sets their modifier odds
status: accepted
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0004]
sources: []
---
## Context

D-0025 (proposed) made modifiers rare and part of the recruit gacha. E-0004 compared flat odds with 1★–5★ star tiers; the designer picked stars.

## Decision

The designer's words: "ok lets try this. Stars: yes. and make it every half star so even more variance. Higher rarity units become mroe \"common\" as game progress. ... for now rarity only affect mods. lets cap mods at FOUR mods then, its like 0.1% on a five star unit per skill or something. there should be like 30 mods on each skill or something like that, more = better = more fun."

- Every merc has a **rarity from 1★ to 5★ in half-star steps** (1, 1.5 … 5), rolled at recruitment.
- **For now, rarity affects only modifiers.** Each battle skill the merc gets rolls its modifier count from odds set by the star; higher stars roll more.
- **At most 4 modifiers** on one battle skill; a 5★ rolls four on about 0.1% of its skills.
- **Higher stars get more common as the game goes on.**
- Aim for **about 30 modifiers that fit each base skill**: more variety, more fun.

## Consequences

- The working odds and pull mix are E-0004's `halfstar.mjs` tables (balance parked): 1★ 88/12/0/0/0 … 5★ 30/50/16/3.9/0.1 for 0–4 mods; recruits shift from mostly 1–2★ early to mostly 2.5–4★ late.
- Because a merc rolls a new battle skill every level (D-0028), the star is a promise about every future roll, not only what the recruit shows today.
- The modifier list must grow from E-0003's 15 to about 30 per base skill.
- Touches design/mercs.md (rarity) and D-0025's modifier rules.
