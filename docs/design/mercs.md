# Mercs

What a merc is made of (stats, skills, talents, level) and how they grow.

## Stats (D-0044)

Six stats, each a number of **coins**, about **10 → 20** over a career. Checks and attacks flip **attribute + skill level** (D-0069); statuses land on a separate skill flip. Foes scale by HP.

| stat | covers | in a fight |
|---|---|---|
| **STR** | strength | attack coins for its battle skills |
| **DEX** | agility, hands, reflexes, aim | **speed coins**; attack coins for its battle skills |
| **INT** | intelligence | attack coins for its battle skills |
| **CHA** | charisma | attack coins for its battle skills |
| **CON** | endurance, toughness | **max HP** |
| **WIL** | willpower: nerve, fear, curses, focus | the **stress check** (D-0042); stress builds slower (proposed) |

Starting stats are a little randomized, biased by **race**; a wolfkin leans DEX (D-0018).

## Skills (D-0021, D-0022)

A skill is also a number of coins, shown like a stat: "Swords (Light Weapons) ●●●".

- The engine knows a fixed list of **core skills**. The AI names each merc's **exact skill** (Swords, Wolf-tongue, Grave-robbing) and maps it to one core skill; the engine stores that mapping once.
- Only the core skill counts in a test. The exact name colors the text ("Atlas swings his sword").
- Skills have their **own XP** and level up separately from the merc (D-0012).

**Two kinds (D-0058):** **battle skills** give abilities; **check skills** give none. Every skill can be checked (Doctor, Leadership too). Quotas: 3 battle skills (2 at the start, 1 at Lv 7; working) and **3 check skills** (D-0077). Civilians have check skills only.

**Coins (D-0069):** a check flips **attribute + skill level** if the merc has the skill, else the attribute alone (Survival check: DEX + Survival, or just DEX). An attack flips **its attribute + its battle skill's level**; each head deals the ability's base damage.

### Battle skills (19)

✦ = rare. **Most skills use one attribute, a few use two** (D-0074); a two-attribute skill flips their average + skill level (working). Pairings are Claude's draft.

| skill | covers | attributes |
|---|---|---|
| **Fast Weapons** | swords, daggers, rapiers: multi-hits, bleeds, crits (D-0063) | DEX + STR |
| **Cleaving Weapons** | greatswords, axes: hits two adjacent foes | STR |
| **Heavy Weapons** | hammers, clubs, maces: stuns, armor break, knockback (moves foes back) | STR + CON |
| **Long-reach Weapons** | polearms, spears: strikes from rank 2–3, reaches deep, pushes and pulls | STR |
| **Unarmed** | fists, kicks, grapples, martial arts, claws and bites (werewolves) | DEX |
| **Ranged** | bows, crossbows, guns, slings, throwing (weapon tags) | DEX |
| **Defense** | shields, taunts, guarding, party shields | CON |
| **Leadership** | your side: party auras, Resolve, moving teammates, focus-fire orders (D-0073); rare, weak stress healing (D-0062) | CHA |
| **Performance** | songs, Haste, distraction; rare, weak stress healing | CHA |
| **Animal Companion** | a fighting pet, like the Houndmaster (no rank of its own) | CHA |
| **Dirty Fighting** | their side (was Villainy, D-0074): debuffs (blind, weaken), marks, yanking foes forward (D-0073) | DEX |
| **Stealth** | hiding, ambush strikes | DEX |
| **Doctor** | healing; limited uses per quest (D-0062) | INT |
| **Alchemy** | potions, poisons, flasks; limited uses per quest | INT |
| **Fire Magic** ✦ | fire damage, burns (D-0070) | INT |
| **Frost Magic** ✦ | frost damage, slows | INT |
| **Lightning Magic** ✦ | lightning damage, chains | INT |
| **Holy Magic** ✦ | healing, blessing, warding off the dead; deals mostly Physical | CHA + WIL |
| **Dark Magic** ✦ | curses, necromancy, pacts; deals Chaos; **its abilities cost stress** (D-0072) | INT + WIL (designer) |

**Damage types (D-0070):** Physical, Fire, Frost, Lightning, Chaos. Poison and bleed are statuses.

### Check skills (9)

No abilities; flipped in check nodes (D-0059). **3 per merc** (D-0077); names D-0078. Attributes: Claude's draft, open.

| skill | covers | draft attr |
|---|---|---|
| **Athletics** | climbing, swimming, running, hauling | STR |
| **Survival** | foraging, camping, weather, terrain, trails | CON |
| **Awareness** | spotting ambushes, keeping watch, searching | WIL |
| **Roguery** | locks, pockets, traps, forgery | DEX |
| **Streetwise** | rumors, finding people, city ways | CHA |
| **Persuasion** | charm, diplomacy, haggling, appraising (+ Bargaining) | CHA |
| **Intimidation** | threats, interrogation, lies, bluffs, disguises (+ Deception) | CHA |
| **Lore** | the past, peoples, faiths; plants, beasts, monsters; undead, demons, curses, relics (three lores merged) | INT |
| **Craft** | building, machines, explosives, traps; weapons, armor, repairs (Engineering + Smithing) | INT |

## Talents (D-0018)

Two random draws over the six stats at recruitment. They may land on the same stat: one stat **++**, or two stats **+** each. Talents decide where stat growth lands.

## Level and XP (D-0012, D-0018)

- Every merc has a level, starting at **Lv 1**. **Lv 12** is around the endgame.
- XP comes from quests. XP from quests **below the merc's level is severely penalized**, as in Path of Exile. Quests have levels.
- At the XP threshold a **Level up** button appears; the player presses it. XP overflows into the next level.

## Level up

**A merc level up grants attributes only** (D-0069). **Stats grow at random: exactly three coins per level, at most one per stat** (D-0018):
1. one coin on a random talented stat;
2. one coin on the second talented stat with a 50% chance; on a miss, or with no second talented stat, it goes to a random stat;
3. one coin on a random stat.

Expected gain per level: a ++ stat +1.00 (others +0.5); two + stats about +0.875 each (others about +0.42), with five stats; slightly less on the others with six.

**The player's choice is a skill** (D-0035): a merc **starts with two skills** (a third is rare, likelier at higher stars), and at **Lv 7** learns one more, **picking 1 of 3**, hidden until then. The options are rolled at recruitment (weighted by race and background, from skills the merc lacks).

## Stars (D-0067, D-0069)

- **Every skill has a star**, 1★–5★ in half steps (talent), battle and check skills alike (D-0069). **The star sets the skill's XP gain** (how fast it levels). A battle skill's star also sets its abilities' modifier odds: 0–4 modifiers, more at higher stars (four on about 0.1% of a 5★ skill's abilities). Working odds: E-0004 `halfstar.mjs`, now per skill.
- **A merc's star** (1★–5★, half steps, rolled at recruitment) makes their skills likelier to roll high stars. Higher stars get more common as the game goes on.
- **Traits have stars too**; a trait's passive scales a little with its star (D-0068; working: 5★ = 1.5× the 1★ effect, upside only). Intent (designer): "just to make rare chase feels better not to force players to have to have them": a 1★ trait is fully playable.

## Abilities (D-0031, D-0069)

What a merc does in a fight is an **ability**; a **skill** (Survival, Swords…) is what they know.

- Every merc's **first ability is a 0-cooldown attack**, a normal ability: from their skills (most skills have one, e.g. Light Weapons' Double Attack) or, as a fallback, a **generic** attack anyone can get (Smash, Kick) (D-0050); generic bases can also come up, rarely, on any level up (D-0051).
- The player sees only the AI name, never the base (D-0048).
- Only **battle skills** give abilities (D-0058). Each has **about 10–20 base abilities**; Ranged's weapon tags filter its bases (D-0063).
- **Some battle-skill level ups give a new ability** from that skill, not every one (D-0069; working: skill levels 1, 3, 5, 7, 9), with modifiers by the skill's star. A merc level up gives attributes only. The engine deals the AI a few random bases from that skill that fit their weapon; the AI picks one that fits the merc's theme and renames it. **Never the same base twice.**
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
