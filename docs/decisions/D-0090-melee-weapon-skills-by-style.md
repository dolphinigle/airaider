---
id: D-0090
title: Melee weapon skills by style
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0063, D-0088] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0063 split melee by weapon family (Fast, Cleaving, Heavy, Long-reach). With one weapon skill per merc (D-0088), the designer said he thinks of weapons as how they are held: "dual wield, sword and shield, and single sword". A per-merc fighting-style tag (Claude) was rejected: "that doesnt work".

## Decision

The designer, 2026-10-22: "i think instead we can revamp the skills to: Two-handed, Polearm, Weapon and Shield, Dual wield, Single weapon, and Unarmed?"; on weapon flavor: "we will have the mods right then ai pick right? so it should resolve it"; "Defender overlap is fine".

| skill | covers (Claude) | attributes (Claude, draft) |
|---|---|---|
| **Two-handed** | greatswords, greataxes, warhammers: big swings, hit two foes, stun, armor break | STR |
| **Polearm** | spears, halberds: strike from ranks 2–3, reach deep, push and pull | STR |
| **Weapon and Shield** | one-handed weapon + shield: shield bash, block, shield wall, counter | STR + CON |
| **Dual Wield** | two blades, two axes: multi-hits, bleeds | DEX + STR |
| **Single Weapon** | one sword or rapier, free hand: lunge, riposte, crits, the duelist | DEX |
| **Unarmed** | fists, kicks, grapples, martial arts, claws and bites | STR + DEX |
| **Ranged** | bows, crossbows, guns, thrown (weapon tags); a split is being discussed | DEX |

- **At most one weapon skill per merc** (restating D-0088) from this list.
- **Weapon flavor** (axe vs hammer vs sword) comes from the modifiers the engine deals and the AI's pick and name (D-0069, D-0025), not from separate skills or tags.
- **Defender stays** (shields, taunts, guarding, party shields); its overlap with Weapon and Shield is fine. Tanks come in several shapes: Defender + Grit, Weapon and Shield + Grit, Weapon and Shield + Defender.

## Consequences

- Fast, Cleaving, Heavy and Long-reach Weapons are gone; 22 battle skills.
- Attribute pairs stay covered: Weapon and Shield takes STR + CON from Heavy.
- Darkest Dungeon: Crusader = Weapon and Shield or Two-handed + Holy; Leper = Two-handed + Grit; Hellion = Polearm + Fury; Highwayman = Single Weapon (+ Ranged would break the one-weapon rule).
