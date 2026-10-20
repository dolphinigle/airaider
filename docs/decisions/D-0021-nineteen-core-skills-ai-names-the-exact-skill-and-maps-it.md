---
id: D-0021
title: Nineteen core skills; AI names the exact skill and maps it to one
status: proposed
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

Tests pair stats with a skill (D-0013, D-0019). The designer later asked to "add (rare) offensive magic and healing magic skills". The designer asked for a fixed set of core skills, with the exact skills AI-generated: "i want you to design 10-20 core skills (core skill is like 'melee combat', 'ranged combat' etc. Then the exact skill (like swords) is ai generated then mapped to one of the core skills)."

## Decision

Proposed by Claude:

**Nineteen core skills in six families**, checked against the D&D 5e, Pathfinder, Pillars of Eternity and Divinity skill lists so every common adventuring action has a home ([reference/rpg-skill-lists.md](../reference/rpg-skill-lists.md)). Each core skill has the stats its tests usually pool with it (six stats, D-0022); a quest may pair it differently. ✦ = rare: seldom rolled at recruitment or for an unlock (D-0020).

| family | core skill | covers | stats |
|---|---|---|---|
| Fighting | **Melee** | swords, axes, maces, brawling | STR, DEX |
| | **Ranged** | bows, crossbows, slings, throwing | DEX, PER |
| | **Defense** | shields, armor, parrying, holding a line | CON, STR |
| | **Athletics** | climbing, swimming, running, hauling, tumbling | STR, DEX |
| Wilds | **Survival** | foraging, camping, weather, cold, terrain | CON, PER |
| | **Tracking** | trails, scouting, hunting | PER, INT |
| | **Awareness** | spotting ambushes, keeping watch, searching, reading people | PER, INT |
| | **Beasts** | riding, taming, handling animals | CHA, PER |
| Shadows | **Stealth** | sneaking, hiding, ambushes | DEX, PER |
| | **Thievery** | locks, pockets, traps | DEX, INT |
| Talk | **Persuasion** | haggling, charm, lies, performing | CHA, PER |
| | **Intimidation** | threats, interrogation | CHA, STR |
| | **Leadership** | commanding, rallying, morale | CHA, CON |
| Knowing | **Lore** | history, monsters, languages, gods, customs | INT |
| | **Occult** | curses, rituals, wards, relics | INT, CON |
| | **Medicine** | wounds, poisons, potions, surgery | INT, DEX |
| | **Craft** | smithing, repairs, building, explosives | STR, INT |
| Magic ✦ | **Battle Magic** ✦ | fire, lightning, hexes hurled in a fight | INT, CON |
| | **Healing Magic** ✦ | mending flesh, cleansing, prayers that work | CHA, CON |

How often each stat appears: STR 5 · DEX 6 · PER 7 · INT 8 · CHA 5 · CON 6.

**Exact skills.** The AI writes the skill's name (and a few words of flavor) and picks its core skill from the list; the engine stores the mapping once and only ever reads the core skill. Examples: Swords → Melee · Wolf-tongue → Beasts · Grave-robbing → Thievery · Bone-setting → Medicine · Tavern lies → Persuasion.

- The screen shows both: "Swords (Melee) ●".
- Only the core skill counts in a test; the exact name colors the line ("Atlas swings his sword").
- A merc's unlock options (D-0020) come from cores they don't have yet, so every new skill widens them.

## Consequences

- Mechanics stay on a fixed list the engine owns; the AI's job is a name plus a pick from 19, which suits cheap models (D-0004).
- Craft and Leadership give the base and the squad layer hooks later.

## Options considered

- **Exact skill matters too** (a test favoring Spears gives +1 to a Spears merc): more flavor, more rules. Can be added later.
- **Seventeen cores, without magic**: the second draft; the designer asked for rare offensive and healing magic.
- **Sixteen cores, without Awareness**: the first draft. The D&D check found perception, insight and investigation homeless, and spotting an ambush is a common quest moment.
- **Fewer cores (about 10)**: merges Defense into Melee, Thievery into Stealth, Occult into Lore, drops Athletics and Leadership. Simpler, but mercs blur together.
