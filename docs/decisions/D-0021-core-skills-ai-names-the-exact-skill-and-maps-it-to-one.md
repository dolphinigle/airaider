---
id: D-0021
title: Core skills; AI names the exact skill and maps it to one
status: proposed
date: 2026-10-21
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

Tests pair stats with a skill (D-0013, D-0019). The designer later asked to "add (rare) offensive magic and healing magic skills", then: "Deception should be added", "should have Warfare.", "mele should be split betwen heavy weapons and light weapons i think", and: "Magic how about: Elemental magic, holy magic, and dark magic? change thievery to roguery? talk should have bargaining or selling (basicaly making money?) medicine should be alchemy. there should be an art related thing, mabye performance?" The designer asked for a fixed set of core skills, with the exact skills AI-generated: "i want you to design 10-20 core skills (core skill is like 'melee combat', 'ranged combat' etc. Then the exact skill (like swords) is ai generated then mapped to one of the core skills)."

## Decision

Proposed by Claude:

**Twenty-three core skills in six families**, checked against the D&D 5e, Pathfinder, Pillars of Eternity and Divinity skill lists so every common adventuring action has a home ([reference/rpg-skill-lists.md](../reference/rpg-skill-lists.md)). Each core skill has the stats its tests usually pool with it (six stats, D-0022); a quest may pair it differently. ✦ = rare: seldom rolled at recruitment or for an unlock (D-0020).

| family | core skill | covers | stats |
|---|---|---|---|
| Fighting | **Heavy Weapons** | greatswords, axes, hammers, polearms | STR, CON |
| | **Light Weapons** | swords, daggers, rapiers, brawling | DEX, PER |
| | **Ranged** | bows, crossbows, slings, throwing | DEX, PER |
| | **Defense** | shields, armor, parrying, holding a line | CON, STR |
| | **Athletics** | climbing, swimming, running, hauling, tumbling | STR, DEX |
| | **Warfare** | tactics, formations, sieges, fortifications, battle plans | INT, STR |
| Wilds | **Survival** | foraging, camping, weather, terrain, trails, hunting | CON, PER |
| | **Awareness** | spotting ambushes, keeping watch, searching, reading people | PER, INT |
| | **Beasts** | riding, taming, handling animals | CHA, PER |
| Shadows | **Stealth** | sneaking, hiding, ambushes | DEX, PER |
| | **Roguery** | locks, pockets, traps, forgery | DEX, INT |
| Talk | **Persuasion** | charm, diplomacy, winning people over | CHA, PER |
| | **Deception** | lies, bluffs, disguises, cons | CHA, INT |
| | **Bargaining** | haggling, selling, appraising: making money | CHA, INT |
| | **Intimidation** | threats, interrogation | CHA, STR |
| | **Leadership** | inspiring, rallying, morale, keeping a crew together | CHA, CON |
| | **Performance** | music, song, dance, acting, storytelling | CHA, DEX |
| Knowing | **Lore** | history, monsters, languages, gods, customs, the uncanny | INT |
| | **Alchemy** | potions, poisons, remedies, bandaging | INT, PER |
| | **Craft** | smithing, repairs, building, explosives | STR, INT |
| Magic ✦ | **Elemental Magic** ✦ | fire, frost, lightning | INT, CON |
| | **Holy Magic** ✦ | healing, blessing, warding off the dead | CHA, CON |
| | **Dark Magic** ✦ | curses, necromancy, draining life, pacts | INT, CHA |

How often each stat appears: STR 6 · DEX 6 · PER 8 · INT 10 · CHA 9 · CON 6.

**Exact skills.** The AI writes the skill's name (and a few words of flavor) and picks its core skill from the list; the engine stores the mapping once and only ever reads the core skill. Examples: Swords → Light Weapons · Wolf-cleaver → Heavy Weapons · Wolf-tongue → Beasts · Grave-robbing → Roguery · Bone-setting → Alchemy · Tavern lies → Deception · Fence's eye → Bargaining.

- The screen shows both: "Swords (Light Weapons) ●".
- Only the core skill counts in a test; the exact name colors the line ("Atlas swings his sword").
- A merc's unlock options (D-0020) come from cores they don't have yet, so every new skill widens them.

## Consequences

- Mechanics stay on a fixed list the engine owns; the AI's job is a name plus a pick from 23, which suits cheap models (D-0004).
- Craft and Leadership give the base and the squad layer hooks later.

## Options considered

- **Exact skill matters too** (a test favoring Spears gives +1 to a Spears merc): more flavor, more rules. Can be added later.
- **One Melee skill**: split into Heavy and Light Weapons by the designer. With Deception and Warfare (designer) the list is at 23, over the 10–20 budget the designer first set.
- **Twenty-two cores, keeping Occult and Tracking**: over the 10–20 budget. Occult split into Lore (knowing the uncanny) and Dark Magic (curses, rituals); Tracking merged into Survival (trails, hunting), since Awareness already covers noticing.
- **Nineteen cores with Battle Magic and Healing Magic, Medicine, Thievery**: the third draft, revised by the designer.
- **Seventeen cores, without magic**: the second draft; the designer asked for rare offensive and healing magic.
- **Sixteen cores, without Awareness**: the first draft. The D&D check found perception, insight and investigation homeless, and spotting an ambush is a common quest moment.
- **Fewer cores (about 10)**: merges Defense into Melee, Thievery into Stealth, Occult into Lore, drops Athletics and Leadership. Simpler, but mercs blur together.
