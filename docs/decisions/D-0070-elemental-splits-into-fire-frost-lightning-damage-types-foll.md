---
id: D-0070
title: Elemental splits into Fire, Frost, Lightning; damage types follow Path of Exile
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0066] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0066 set eight damage types tied to the melee split (Slash, Pierce, Blunt, Fire, Frost, Lightning, Holy, Dark) and kept Elemental as one skill.

## Decision

The designer, 2026-10-22: "check skill star for xp gain only sounds good. battle skill star using the same rule probably for the best. battle skills should be learned when a skill levels up, instead of when a merc levels up. -- clearly not every time the skill level up that would be too much. -- skill level becomes the skill additional coin when doing skill checks. for example, say we have a survival check. if A has a survival skill, then the coinc sare dex coins + survival coins. otherwise its just dex coins. probably same for battle skills, the damage is the skill coin plus the STR. melee split good lets go. elemental should be split. damage types probably just same from path of exile: Fire, Frost, Lightning, Physical, and Chaos. Holy magic deals physical damage mostly."

- **Elemental splits into three battle skills: Fire Magic, Frost Magic, Lightning Magic** (all ✦ rare).
- **Five damage types, as in Path of Exile: Physical, Fire, Frost, Lightning, Chaos.** Holy Magic deals mostly Physical. Claude: Dark Magic deals Chaos.
- The rest of D-0066 stands: one rule for both sides (damage-type % works the same on mercs and foes); foes defend with HP (scales with quest level) and % per damage type, some bosses shield, some foes taunt or guard; mercs defend with HP (CON), shield above HP (Defense and Holy abilities) as the main active defense, taunt and guard, and buffs such as "−25% damage taken"; mercs have no base resist stat, % per type comes only from traits and later gear; no random misses, dodge is a visible charge that Marks and area attacks strip; poison and bleed are statuses, not types.

## Consequences

- Battle skills: 20 (Fast, Cleaving, Heavy, Long-reach, Unarmed, Ranged, Defense, Warfare, Leadership, Performance, Animal Companion, Villainy, Stealth, Doctor, Alchemy, Fire, Frost, Lightning, Holy, Dark).
- Weapon choice no longer meets resists by type (all melee is Physical); foe families differ by Physical vs elemental vs Chaos resists.
