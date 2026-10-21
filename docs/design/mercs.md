# Mercs

What a merc is made of (stats, skills, talents, level) and how they grow.

## Stats (D-0022)

Six stats, each a number of **coins**:

| stat | covers |
|---|---|
| **STR** | strength |
| **DEX** | agility, hands, reflexes |
| **PER** | noticing, aim, reading people |
| **INT** | intelligence |
| **CHA** | charisma |
| **CON** | endurance, toughness, willpower (nerve, fear, curses) |

Starting stats are a little randomized, biased by **race**; a wolfkin leans DEX (D-0018).

## Skills (D-0021, D-0022)

A skill is also a number of coins, shown like a stat: "Swords (Light Weapons) ●●●".

- The engine knows a fixed list of **core skills**. The AI names each merc's **exact skill** (Swords, Wolf-tongue, Grave-robbing) and maps it to one core skill; the engine stores that mapping once.
- Only the core skill counts in a test. The exact name colors the text ("Atlas swings his sword").
- Skills have their **own XP** and level up separately from the merc (D-0012).

The core skills, with the stats their tests usually pool with them (a quest may pair them differently). ✦ = rare: seldom rolled at recruitment or for an unlock.

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
| | **Villainy** | banditry, smuggling, extortion, slaving, black markets, bribes | CHA, STR |
| | **Streetwise** | rumors, finding people, city ways, local customs, who's who | PER, CHA |
| Talk | **Persuasion** | charm, diplomacy, winning people over | CHA, PER |
| | **Deception** | lies, bluffs, disguises, cons | CHA, INT |
| | **Bargaining** | haggling, selling, appraising: making money | CHA, INT |
| | **Intimidation** | threats, interrogation | CHA, STR |
| | **Leadership** | inspiring, rallying, morale, keeping a crew together | CHA, CON |
| | **Performance** | music, song, dance, acting, storytelling | CHA, DEX |
| Knowing | **Civilization Lore** | the past, languages, peoples, faiths, heraldry | INT |
| | **Science Lore** | nature, beasts, stars, numbers, how things work | INT, PER |
| | **Arcane Lore** | the hidden world: monsters, undead, curses, relics, how magic works (knowing, not casting) | INT, CON |
| | **Alchemy** | potions, poisons, remedies, bandaging | INT, PER |
| | **Craft** | smithing, repairs, building, explosives | STR, INT |
| Magic ✦ | **Elemental Magic** ✦ | fire, frost, lightning | INT, CON |
| | **Holy Magic** ✦ | healing, blessing, warding off the dead | CHA, CON |
| | **Dark Magic** ✦ | curses, necromancy, draining life, pacts | INT, CHA |

## Talents (D-0018)

Two random draws over the six stats at recruitment. They may land on the same stat: one stat **++**, or two stats **+** each. Talents decide where stat growth lands.

## Level and XP (D-0012, D-0018)

- Every merc has a level, starting at **Lv 1**. **Lv 12** is around the endgame.
- XP comes from quests. XP from quests **below the merc's level is severely penalized**, as in Path of Exile. Quests have levels.
- At the XP threshold a **Level up** button appears; the player presses it. XP overflows into the next level.

## Level up

**Stats grow at random: exactly three coins per level, at most one per stat** (D-0018):
1. one coin on a random talented stat;
2. one coin on the second talented stat with a 50% chance; on a miss, or with no second talented stat, it goes to a random stat;
3. one coin on a random stat.

Expected gain per level: a ++ stat +1.00 (others +0.5); two + stats about +0.875 each (others about +0.42), with five stats; slightly less on the others with six.

**The player's choice is a skill** (D-0020; D-0035 proposes instead: start with two skills, rarely three by star, and pick 1 of 3 at Lv 7): every 3 levels (Lv 3, 6, 9, 12) the merc unlocks a new skill, picking 1 of 2 options. The options are rolled at recruitment (weighted by race and background, from core skills the merc lacks) and stay hidden until that level up.

## Rarity (D-0027)

Every merc has a **rarity from 1★ to 5★ in half steps**, rolled at recruitment. For now it affects only modifiers: each ability the merc gets rolls 0–4 modifiers, more often at higher stars (four on about 0.1% of a 5★'s skills). Higher stars get more common as the game goes on. Working odds: E-0004 `halfstar.mjs`.

## Abilities (D-0031, D-0033)

What a merc does in a fight is an **ability**; a **skill** (Survival, Swords…) is what they know.

- **Every level up rolls one new ability**, with modifiers by star, from the base abilities of the merc's skills. **Never the same base twice.**
- A merc **equips four** abilities.
- An ability is a fixed base plus modifiers, named by the AI (D-0025, proposed).
- Proposed: passives are personality traits (D-0036).

## Upgrade items (D-0029)

- A **star-up item** raises a merc's star. Very rare, probably also limited per game. It resets the merc's level and rerolls their seed.
- A **reroll item** (like Path of Exile's Chaos Orb) rerolls the merc's seed, probably resetting their level too.
- A reset keeps everything (the **starting position**) except the **level-up seed**, which decides only what level ups roll (D-0032).

## The recruit's gacha

Rolled when a merc is generated: race, rarity, starting stats, talents, starting skills, starting abilities, personality traits, and the hidden skill-unlock options.

## Open

- Numbers: starting stat spread per race, XP curve and penalty curve, skill XP thresholds.
- What personality traits (Gruff) do mechanically.
