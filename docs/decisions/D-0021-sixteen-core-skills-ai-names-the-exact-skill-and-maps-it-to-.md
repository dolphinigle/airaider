---
id: D-0021
title: Sixteen core skills; AI names the exact skill and maps it to one
status: proposed
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

Tests pair stats with a skill (D-0013, D-0019). The designer asked for a fixed set of core skills, with the exact skills AI-generated: "i want you to design 10-20 core skills (core skill is like 'melee combat', 'ranged combat' etc. Then the exact skill (like swords) is ai generated then mapped to one of the core skills)."

## Decision

Proposed by Claude:

**Sixteen core skills in five families.** Tests name a core skill; the stats beside it are the usual pairing, not a rule.

| family | core skill | covers | usual stats |
|---|---|---|---|
| Fighting | **Melee** | swords, axes, maces, brawling | STR, DEX |
| | **Ranged** | bows, crossbows, slings, throwing | DEX |
| | **Defense** | shields, armor, parrying, holding a line | CON, STR |
| | **Athletics** | climbing, swimming, running, hauling | STR, CON |
| Wilds | **Survival** | foraging, camping, weather, cold | CON, INT |
| | **Tracking** | trails, scouting, hunting | INT, DEX |
| | **Beasts** | riding, taming, handling animals | CHA, DEX |
| Shadows | **Stealth** | sneaking, hiding, ambushes | DEX |
| | **Thievery** | locks, pockets, traps | DEX, INT |
| Talk | **Persuasion** | haggling, charm, lies | CHA |
| | **Intimidation** | threats, interrogation | STR, CHA |
| | **Leadership** | commanding, rallying, morale | CHA |
| Knowing | **Lore** | history, monsters, languages | INT |
| | **Occult** | curses, rituals, wards | INT, CHA |
| | **Medicine** | wounds, poisons, surgery | INT |
| | **Craft** | smithing, repairs, building | STR, INT |

**Exact skills.** The AI writes the skill's name (and a few words of flavor) and picks its core skill from the list; the engine stores the mapping once and only ever reads the core skill. Examples: Swords → Melee · Wolf-tongue → Beasts · Grave-robbing → Thievery · Bone-setting → Medicine · Tavern lies → Persuasion.

- The screen shows both: "Swords (Melee) ●".
- Only the core skill counts in a test; the exact name colors the line ("Atlas swings his sword").
- A merc's unlock options (D-0020) come from cores they don't have yet, so every new skill widens them.

## Consequences

- Mechanics stay on a fixed list the engine owns; the AI's job is a name plus a pick from 16, which suits cheap models (D-0004).
- Craft and Leadership give the base and the squad layer hooks later.

## Options considered

- **Exact skill matters too** (a test favoring Spears gives +1 to a Spears merc): more flavor, more rules. Can be added later.
- **Fewer cores (about 10)**: merges Defense into Melee, Thievery into Stealth, Occult into Lore, drops Athletics and Leadership. Simpler, but mercs blur together.
