# Mercs

What a merc is made of (stats, skills, talents, level) and how they grow.

## Stats (D-0044)

Six stats, each a number of **coins**:

| stat | covers | in a fight |
|---|---|---|
| **STR** | strength | heavy melee |
| **DEX** | agility, hands, reflexes, aim | **speed coins**; light weapons, ranged |
| **INT** | intelligence | magic, lore |
| **CHA** | charisma | holy magic, rallying, fear, songs |
| **CON** | endurance, toughness | **max HP**; defense |
| **WIL** | willpower: nerve, fear, curses, focus | the **stress check** (D-0042) |

Starting stats are a little randomized, biased by **race**; a wolfkin leans DEX (D-0018).

## Skills (D-0021, D-0022)

A skill is also a number of coins, shown like a stat: "Swords (Light Weapons) ●●●".

- The engine knows a fixed list of **core skills**. The AI names each merc's **exact skill** (Swords, Wolf-tongue, Grave-robbing) and maps it to one core skill; the engine stores that mapping once.
- Only the core skill counts in a test. The exact name colors the text ("Atlas swings his sword").
- Skills have their **own XP** and level up separately from the merc (D-0012).

The core skills (D-0021, D-0045, D-0046 proposed), with the stats their tests usually pool with them (a quest may pair them differently). ✦ = rare: seldom rolled at recruitment or for an unlock.

| family | core skill | covers | stats |
|---|---|---|---|
| Fighting | **Heavy Weapons** | greatswords, axes, hammers, polearms | STR, CON |
| | **Light Weapons** | swords, daggers, rapiers, brawling | DEX, STR |
| | **Unarmed** | fists, kicks, grapples, martial arts | DEX, STR |
| | **Ranged** | bows, crossbows, slings, throwing | DEX, STR |
| | **Defense** | shields, armor, parrying, holding a line | CON, STR |
| | **Athletics** | climbing, swimming, running, hauling, tumbling | STR, DEX |
| | **Warfare** | tactics, formations, sieges, fortifications, battle plans | INT, STR |
| Wilds | **Survival** | foraging, camping, weather, terrain, trails, hunting | CON, INT |
| | **Awareness** | spotting ambushes, keeping watch, searching, reading people | DEX, INT |
| | **Animal Companion** | a fighting pet (like Darkest Dungeon's Houndmaster), riding, taming, handling animals | CHA, WIL |
| Shadows | **Stealth** | sneaking, hiding, ambushes | DEX, INT |
| | **Roguery** | locks, pockets, traps, forgery | DEX, INT |
| | **Villainy** | banditry, smuggling, extortion, slaving, black markets, bribes | CHA, STR |
| | **Streetwise** | rumors, finding people, city ways, local customs, who's who | CHA, INT |
| Talk | **Persuasion** | charm, diplomacy, winning people over | CHA, INT |
| | **Deception** | lies, bluffs, disguises, cons | CHA, INT |
| | **Bargaining** | haggling, selling, appraising: making money | CHA, INT |
| | **Intimidation** | threats, interrogation | CHA, STR |
| | **Leadership** | inspiring, rallying, morale, keeping a crew together | CHA, WIL |
| | **Performance** | music, song, dance, acting, storytelling | CHA, DEX |
| Knowing | **Civilization Lore** | the past, languages, peoples, faiths, heraldry | INT |
| | **Nature Lore** | plants, beasts, weather, stars, natural monsters | INT, DEX |
| | **Arcane Lore** | the hidden world: undead, demons, curses, relics, how magic works (knowing, not casting) | INT, WIL |
| | **Alchemy** | potions, poisons, flasks | INT, DEX |
| | **Doctor** | healing, bandaging, surgery, remedies | INT, DEX |
| | **Smithing** | weapons, armor, repairs | STR, DEX |
| | **Engineering** | building, machines, how things work, numbers, explosives, setting traps | INT, STR |
| Magic ✦ | **Elemental Magic** ✦ | fire, frost, lightning | INT, WIL |
| | **Holy Magic** ✦ | healing, blessing, warding off the dead | CHA, WIL |
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

**The player's choice is a skill** (D-0035): a merc **starts with two skills** (a third is rare, likelier at higher stars), and at **Lv 7** learns one more, **picking 1 of 3**, hidden until then. The options are rolled at recruitment (weighted by race and background, from skills the merc lacks).

## Rarity (D-0027)

Every merc has a **rarity from 1★ to 5★ in half steps**, rolled at recruitment. For now it affects only modifiers: each ability the merc gets rolls 0–4 modifiers, more often at higher stars (four on about 0.1% of a 5★'s skills). Higher stars get more common as the game goes on. Working odds: E-0004 `halfstar.mjs`.

## Abilities (D-0031, D-0047)

What a merc does in a fight is an **ability**; a **skill** (Survival, Swords…) is what they know.

- The player sees only the AI name, never the base (D-0048).
- Only **fighting skills** give abilities (D-0046, proposed). Each has **about 10–20 base abilities**; weapon tags filter them (D-0045).
- **Every level up gives one new ability**, with modifiers by star. The engine deals the AI a few random bases from the merc's fighting skills that fit their weapon; the AI picks one that fits the merc's theme and renames it. **Never the same base twice.**
- A merc **equips four** abilities.
- An ability is a fixed base plus modifiers, named by the AI (D-0025, proposed).
- **Passives are traits** (D-0036, D-0038, D-0039). Traits come in four kinds: **gender, race, personality and body** (tall, short, muscular, skinny), all part of the starting position. A passive never touches stat or skill coins; it works on other axes (damage %, speed, HP, targeting, recovery, upkeep, loot) (D-0040). Often a trade-off: "Wolfkin: +10% damage, −10% speed", "Stubborn: can't be stunned while above half HP".

## Stress (D-0042)

- Each merc has **stress from 0 to 100**, and it carries across quests.
- **It rises** from:
  - foe stress attacks;
  - an ally dropping;
  - heavy hits;
  - failed skill checks;
  - long quests.
- **At 100** the merc flips a check:
  - on a pass, **Resolve**, a strong buff for the rest of the fight;
  - on a fail, a **Breakdown**: they act outside their tactics for the rest of the fight.
- **It falls** with:
  - rest in base buildings;
  - Leadership and Performance abilities;
  - personality traits, which set how fast it builds.
- **No quirks.** The check flips **WIL** (D-0044). Open: whether stress matters outside fights.

## Upgrade items (D-0029)

- A **star-up item** sets a merc to a fixed star within a stated range ("turns a 2–3★ into a 4★"); none reaches 5★, so 5★ stays valuable (D-0037). Very rare, probably also limited per game. It resets the merc's level and rerolls their seed.
- A **reroll item** (like Path of Exile's Chaos Orb) rerolls the merc's seed, probably resetting their level too.
- A reset keeps everything (the **starting position**) except the **level-up seed**, which decides only what level ups roll (D-0032).

## The recruit's gacha

Rolled when a merc is generated: race, rarity, starting stats, talents, starting skills, starting abilities, personality traits, and the hidden skill-unlock options.

## Open

- Numbers: starting stat spread per race, XP curve and penalty curve, skill XP thresholds.
- Each trait's passive effect, parked by the designer: also whether race keeps its stat bias, how gender traits differ, and whether every trait is a trade-off (D-0036 to D-0040).
