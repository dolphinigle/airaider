---
id: D-0066
title: Merc defense: shield and guard, percent only from traits; no misses; eight damage types
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by: D-0070
evidence: [E-0006]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0065 gave foes defense % per damage type. The designer asked: "for our defense, we just use SHIELD above hp right? or do we also want % per damage type like in path of exile? do we want dodges/avoids/misses?"

## Decision

The designer answered Claude's proposal: "sounds good".

- **One rule for both sides:** damage-type % works the same on mercs and foes; each side gets it from different places.
- **Foes:** HP (scales with quest level, D-0065) and **% per damage type** (resists and weaknesses per family) as their main defense; some bosses get shields; some foes taunt or guard.
- **Mercs:** HP (CON); **shield above HP** (Defense and Holy abilities) as the main active defense; taunt and guard (Defense); buffs such as "−25% damage taken". **No base resist stat:** % per damage type comes only from traits ("Ironhide: −20% slash") and later gear, so it is a bonus, never a tax.
- **No random misses.** Attacks always hit. **Dodge is a charge**: a visible status ("Blur: dodges the next attack"). Foe families can carry dodge charges; a Mark (Villainy) or an area attack strips them.
- **Eight damage types:** Slash (Fast, Cleaving), Pierce (Long-reach, Ranged), Blunt (Heavy, Unarmed), Fire, Frost, Lightning (Elemental), Holy, Dark. Poison and bleed are statuses (damage over time), not types.

## Consequences

- Weapon skill choice matters against foe families ("Skeletons: weak to blunt, resist pierce").
- E-0006: whiffs felt bad (hit check wasted 38% of turns); charges keep counterplay without a hidden roll.
