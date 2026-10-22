---
id: D-0067
title: Skills level up to grant abilities; skills have stars that set modifier odds
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0027, D-0047] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0047 gave one new ability per merc level up, and D-0027 set modifier odds by the merc's star. Skills already have their own XP (D-0012).

## Decision

The designer, 2026-10-22: "level up i think should just grant attributes. instead, skills are gained when the SKILLS level up. skills should also have STARS (aka talent), and the chance of getting multiple mods scales with this STAR instead of merc STAR. merc STAR just make them more likely to roll skills with stars. more rng = more fun. add stars to both batlte and non battle skills."

- **A merc level up grants attributes only** (D-0018's three coins).
- **A battle skill's level up grants a new ability.** The rest of D-0047 stands: about 10–20 bases per battle skill; the engine deals the AI a few random bases from that skill that fit the merc's weapon and are not already known; the AI picks one that fits the merc's theme and renames it; never the same base twice; four equipped.
- **Every skill has a star, 1★–5★ in half steps** (talent), battle and check skills alike.
- **A skill's star sets its abilities' modifier odds** (the D-0027 odds, now per skill star). The rest of D-0027 stands: at most 4 modifiers per ability (about 0.1% at 5★); about 30 modifiers fit each base; higher stars get more common as the game goes on.
- **A merc's star** (still 1★–5★ in half steps) **makes their skills likelier to roll high stars.**

Claude's notes, not yet ruled:
- **What a check skill's star does:** it has no abilities, so its star could set how fast the skill grows (XP needed per level) — and the same could apply to battle skills.
- **Skill level = skill coins** (the coins for checks and the status flip, D-0065), and the ability base damage rises with it.

## Consequences

- Using a skill grows it and its abilities: the thing you practise is the thing that gets new moves.
- A 2★ merc can still own one 5★ skill: more rolls on a recruit, more reasons to read the card.
- Touches design/mercs.md (Level up, Rarity, Abilities) and E-0004's odds (now per skill).
