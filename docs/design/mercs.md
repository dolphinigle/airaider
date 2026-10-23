# Mercs

What a merc is made of (stats, skills, talents, level) and how they grow.

## Stats (D-0096)

**Percent effects use Path of Exile wording (D-0082):** *increased/reduced* add together into one multiplier; each *more/less* multiplies on its own. Final = base × (1 + Σ increased − Σ reduced) × Π(1 ± more/less).

Six stats, each a number of **coins**, about **10 → 20** over a career. Checks and attacks flip **attribute + skill level** (D-0069); statuses land on a separate skill flip. Foes scale by HP.

Each stat also has a small **passive**, counted from **10 = no effect**: above helps, below hurts (D-0081):

| stat | covers | skills | passive |
|---|---|---|---|
| **STR** | strength | its battle and check skills | **1% increased damage per point above 10** (designer; reduced below), on all damage |
| **DEX** | agility, hands, reflexes, aim | its battle and check skills | **speed coins** (turn order; scale left to the balance pass, designer; placeholder speed coins = DEX) |
| **INT** | intelligence | its battle and check skills | **increased XP**, merc and every skill (**3% per point above 10**, D-0084; reduced below) |
| **CHA** | charisma | its battle and check skills | **increased quest gold** (designer), **summed over the squad** (designer), each merc 1% per point from 10 (working; reduced below) |
| **CON** | endurance, toughness | its battle and check skills | **max HP** (scale left to the balance pass, designer; placeholder 30 at CON 10, ±3 a point) |
| **LUK** | luck | none (D-0095) | raises the heads chance of **every coin** (50% at 10; size per point left to the balance pass, designer) |

**Starting stats** (D-0106): every stat starts at 10, then mild randomness (working: three random coin moves, each stat kept within 8–12), then the **race gives +1 to one stat and −1 to another** (a wolfkin: DEX +1, INT −1), so races don't force builds. Talents are not weighted by race (Claude).

## Skills (D-0021, D-0022)

A skill is also a number of coins, shown like a stat: "Swords (Light Weapons) ●●●".

- The engine knows a fixed list of **core skills**. The AI names each merc's **exact skill** (Swords, Wolf-tongue, Grave-robbing) and maps it to one core skill; the engine stores that mapping once.
- Only the core skill counts in a test. The exact name colors the text ("Atlas swings his sword").
- Skills have their **own XP** and level up separately from the merc (D-0012).

**Two kinds (D-0058):** **battle skills** give abilities; **check skills** give none. Check nodes name a check skill or one of **13 checkable battle skills** (D-0100): Stealth, Doctor, Alchemy, Leadership, Animal Companion, Warfare, Performance, Carousing and all five magics. The weapon skills, Berserk, Executioner, Precision, Concentration, Defender, Survivor, Dirty Fighting and Retaliation are never checked. Quotas: 3 battle skills and **3 check skills** (D-0083): 2 + 2 at the start, a battle skill at Lv 3, a check skill at Lv 5 (D-0102). Civilians have check skills only.

**Coins (D-0069):** a check flips **attribute + skill level** if the merc has the skill, else the attribute alone (Survival check: DEX + Survival, or just DEX). An attack flips **its attribute + its battle skill's level**; each head deals the ability's base damage.

### Battle skills (29: 8 weapon + 21 others, D-0099)

**No skill is rare** (D-0093): rarity lives in stars. **Skill names are generic categories**; the AI skins each merc's exact name over them (a greatsword skill maps to Two-handed, D-0021). **Each single attribute gets two flex skills** (not weapon, not magic; D-0097): DEX Precision + Stealth, INT Alchemy + Concentration (Doctor is INT's role skill, D-0098), CHA Leadership + Animal Companion, CON Defender + Survivor, STR Berserk + Executioner. **Most skills use one attribute, a few use two** (D-0074); a two-attribute skill flips their average + skill level (working). No skill is dedicated to lowering foe resistances; such effects are bases in other skills (D-0097). Pairings: D-0099 (Fire, Frost, Lightning follow Path of Exile: STR, DEX, INT).

| skill | covers | attributes |
|---|---|---|
| **Two-handed** | greatswords, greataxes, warhammers: big swings, hit two foes, stun, armor break (D-0090) | STR |
| **Polearm** | spears, halberds: strike from ranks 2–3, reach deep, push and pull | STR |
| **Weapon and Shield** | one-handed weapon + shield: shield bash, block, shield wall, counter | STR + CON |
| **Dual Wield** | two blades, two axes: multi-hits, bleeds | DEX + STR |
| **Single Weapon** | one sword or rapier, free hand: lunge, riposte, crits (the duelist) | STR + DEX |
| **Unarmed** | fists, kicks, grapples, martial arts, claws and bites (werewolves); **rank 1 against foe 1 only** (no weapon, no range): stuns, holds, knocks the front foe back to reach the next (E-0007, D-0101) | STR + DEX |
| **Shooting** | bows, crossbows, guns: back-rank sniper, long reach, aimed shots, volleys (D-0091) | DEX |
| **Throwing** | knives, axes, javelins, slings: skirmisher from front or middle ranks, multi-throws, bleeds (D-0091) | STR + DEX |
| **Defender** | shields, taunts, guarding, party shields (was Defense, designer) | CON |
| **Berserk** | (was Fury, D-0095) the berserker (Hellion), physical AoE (whirlwind, rampage, trample): burst self-buffs, huge hits that exhaust you after, war cries, kills feed it, stronger when hurt or paid in HP (D-0089) | STR |
| **Executioner** | (D-0097) the finisher: more damage the lower the foe's HP; Claude's draft also has kill-outright blows under a threshold, a kill refunding the turn or resetting a cooldown, and picking out the weakest foe in reach. Skins: Headsman, Butcher, Death Blow | STR |
| **Survivor** | (was Grit, D-0097) the Leper: self-heal, shrug off statuses, survive a killing blow once, regen; keeps only itself alive (D-0089) | CON |
| **Precision** | raises the heads chance of coin flips, self or allies, and so crits (D-0095) | DEX |
| **Warfare** | back (D-0095): orders that **move allies between ranks** (D-0101), debuffs foes, some buffs | STR + INT |
| **Leadership** | your side: party auras, Resolve, focus-fire orders; rare, weak stress healing (D-0062); doesn't move allies (D-0101) | CHA |
| **Performance** | songs, Haste, distraction; rare, weak stress healing | DEX + CHA |
| **Animal Companion** | a fighting pet, like the Houndmaster (no rank of its own) | CHA |
| **Dirty Fighting** | their side (was Villainy, D-0074): debuffs (blind, weaken), marks, yanking foes forward (D-0101) | STR + DEX (D-0098) |
| **Retaliation** | (was Counter, D-0098) counters, ripostes, punishing foes that hit you or a neighbor; archers shoot back | DEX + CON |
| **Stealth** | hiding, ambush strikes | DEX |
| **Doctor** | healing: single-target heals, Regen, cures, minor area heals; **some** abilities have limited uses (emergency kits, D-0062); Alchemy is the limited-use skill | INT |
| **Alchemy** | potions, poisons, flasks; limited uses per quest | INT |
| **Fire Magic** | fire damage, burns (D-0070) | STR + INT |
| **Frost Magic** | frost damage, slows | DEX + INT |
| **Concentration** | (D-0098) empowers your next action, any ability, weapon or spell: charge the next ability, cut a cooldown, repeat the last, act twice, recover a per-quest use (Claude's draft). Skins: Meditation, Monastic Training, Clear Mind | INT |
| **Lightning Magic** | lightning damage, chains | INT |
| **Holy Magic** | healing, blessing, warding off the dead; deals mostly Physical | CHA |
| **Dark Magic** | curses, necromancy, pacts; deals Chaos; **its abilities cost stress** (D-0072) | CHA + CON |
| **Carousing** | (D-0099) **doping** (designer): drink or take something for a big self-buff, then pay after (drink, war-mushrooms, stimulants, pain-killing herbs); **all its abilities are one-time uses** (bottles, per quest): liquid courage (no stress gain for a few turns), drunken sway (dodge charges), spit a burning spirit (Fire), share a flask, a hangover after (Claude's draft). Skins: Tavern Brawler, Sailor's Grog, Dwarven Stout, Berserker Mushrooms, War-Snuff, Combat Chems. Alchemy brews and throws; Carousing takes it and pushes through | CHA + CON |

**Weapon skills are styles (D-0090). At most one per merc:** Two-handed, Polearm, Weapon and Shield, Dual Wield, Single Weapon, Unarmed, Shooting or Throwing (D-0091); the rest combine freely. Weapon flavor (axe, hammer, sword) comes from modifiers and the AI's pick and name. Attributes of the new ones: Claude's draft.

**Damage types (D-0070):** Physical, Fire, Frost, Lightning, Chaos. Poison and bleed are statuses. **One status per damage type** (designer, 2026-10-22): Physical → Bleed, Chaos → Poison, Fire → Burn, Lightning → Shocked, Frost → Chilled. What each does is open.

### Check skills (11)

No abilities; flipped in check nodes (D-0059). **3 per merc** (D-0083). Attributes: D-0099.

| skill | covers | attr |
|---|---|---|
| **Athletics** | climbing, swimming, running, hauling | STR |
| **Survival** | foraging, camping, weather, terrain, trails | DEX + CON |
| **Perception** | spotting ambushes, keeping watch, searching (was Awareness) | DEX |
| **Thievery** | (was Roguery, D-0099) locks, pockets, traps, forgery | DEX |
| **Streetwise** | rumors, finding people, city ways | CHA + INT |
| **Persuasion** | charm, diplomacy, haggling, appraising (+ Bargaining) | CHA |
| **Intimidation** | threats, interrogation, lies, bluffs, disguises (+ Deception) | STR + CHA |
| **Lore** | the past, peoples, faiths; plants, beasts, monsters; undead, demons, curses, relics (three lores merged) | INT |
| **Smithing** | weapons, armor, repairs | INT + CON |
| **Engineering** | building, machines, explosives, traps | INT |
| **Cooking** | camp meals, provisions, the base kitchen | CON |

## Talents (D-0018)

Two random draws over the six stats at recruitment. They may land on the same stat: one stat **++**, or two stats **+** each. Talents decide where stat growth lands.

## Level and XP (D-0012, D-0018, D-0102)

- Every merc has a level, starting at **Lv 1**. **Soft cap:** from Lv 10 each level costs much more XP, so **Lv 12** is the maximum in normal play (D-0102).
- **Merc XP comes from quest ends** (D-0102); the curve counts quests done. Fights and skill checks give small **skill** XP only; quest ends give skill XP too.
- XP from quests **below the merc's level is penalized**, as in Path of Exile; **4+ levels below gives none** (D-0102). Quests have levels.
- At the XP threshold a **Level up** button appears; the player presses it **at the base, between quests** (D-0102). XP overflows into the next level.
- Working: 100 XP for a quest at the merc's level (Claude). **Quests at level to the next level** (designer, D-0105; replaces D-0102's working curve): 1, 2, 2, 3, 3, 4, 5, 10, 20, 100, 1000, 10000, so Lv 8 after 20 quests, Lv 10 after 50, Lv 11 after 150, Lv 12 after 1150: in practice mercs end at Lv 10. Penalty: full XP down to 1 below, 2 below 50%, 3 below 20% (Claude).
- **Beneath me** (D-0105): a merc 3 levels above the quest gains 25 stress at every node and takes 50% increased stress all quest; 4+ above, 50 a node and 100% increased (working); skill XP follows the same penalty.

## Level up

**A merc level up grants attributes only** (D-0069). **Stats grow at random: exactly three coins per level, at most one per stat** (D-0018):
1. one coin on a random talented stat;
2. one coin on the second talented stat with a 50% chance; on a miss, or with no second talented stat, it goes to a random stat;
3. one coin on a random stat.

Expected gain per level: a ++ stat +1.00 (others +0.5); two + stats about +0.875 each (others about +0.42), with five stats; slightly less on the others with six.

**The player's choice is a skill** (D-0102, replaces D-0035): a merc **starts with 2 battle skills and 2 check skills**, gains **a new battle skill at Lv 3** and **a new check skill at Lv 5**. Each is a **pick of 1 of 3** (D-0104), hidden until then, rolled at recruitment (weighted by race and background, from skills the merc lacks).

## Stars (D-0067, D-0069)

- **Every skill has a star**, 1★–5★ in half steps (talent), battle and check skills alike (D-0069). **The star sets the skill's XP gain** (how fast it levels). A battle skill's star also sets its abilities' modifier odds: 0–4 modifiers, more at higher stars (four on about 0.1% of a 5★ skill's abilities). Working odds: E-0004 `halfstar.mjs`, now per skill.
- **A merc's star** (1★–5★, half steps, rolled at recruitment) makes their skills likelier to roll high stars. Higher stars get more common as the game goes on.
- **Traits have stars too**; a trait's passive scales a little with its star (D-0068; working: 5★ = 1.5× the 1★ effect, upside only). Intent (designer): "just to make rare chase feels better not to force players to have to have them": a 1★ trait is fully playable.

## Abilities (D-0031, D-0069)

What a merc does in a fight is an **ability**; a **skill** (Survival, Swords…) is what they know.

- Every merc's **first ability is a 0-cooldown attack**, a normal ability: from their skills (most skills have one, e.g. Light Weapons' Double Attack) or, as a fallback, a **generic** attack anyone can get (Smash, Kick) (D-0050); generic bases can also come up, rarely, on any level up (D-0051).
- The player sees only the AI name, never the base (D-0048).
- Only **battle skills** give abilities (D-0058). Each has **about 10–20 base abilities** (designer 2026-10-23: 10–30 in the final game; a default attack is any 0-cooldown damaging ability, so a skill may have several; not yet a decision); weapon flavor (axe, hammer, sword) comes from modifiers and the AI's pick (D-0090).
- **Rolled at recruitment** (D-0104): the skill offers and the bases and mods for all five abilities of each battle skill; the AI picks and names them all when the merc is made, and skill level ups only reveal them. **A weapon or magic skill's first ability has 0 cooldown** (D-0104).
- **Some battle-skill level ups give a new ability** from that skill, not every one (D-0069; working: skill levels 1, 3, 5, 7, 9), with modifiers by the skill's star. A merc level up gives attributes only. The engine deals the AI a few random bases from that skill that fit their weapon; the AI picks one that fits the merc's theme and renames it. **Never the same base twice.**
- A merc **equips four** abilities.
- An ability is a fixed base plus modifiers, named by the AI (D-0025, proposed). **The AI is shown every mod that fits the ability and picks as many as were rolled** (designer, 2026-10-22; replaces the dealt-3-candidates idea).
- **Ability damage is written as a % of a standard hit** (designer, 2026-10-22, Darkest Dungeon style; Cleave 60% on each of two foes). Statuses are named only for now; how they are applied is open. Brainstorm: E-0007 `brainstorm.md`.
- **Passives are traits** (D-0036, D-0038, D-0039). Traits come in four kinds: **gender, race, personality and body** (tall, short, muscular, skinny), all part of the starting position. A passive never touches stat or skill coins; it works on other axes (damage %, speed, HP, targeting, recovery, upkeep, loot) (D-0040). Often a trade-off: "Wolfkin: 10% increased damage, 10% reduced speed", "Stubborn: can't be stunned while above half HP".

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
- **No quirks.** **No stat touches stress** (D-0079: "stress is stress"). Open: what decides Resolve vs Breakdown at 100; whether stress matters outside fights.

## Upgrade items (D-0029)

- A **star-up item** sets a merc to a fixed star within a stated range ("turns a 2–3★ into a 4★"); none reaches 5★, so 5★ stays valuable (D-0037). Very rare, probably also limited per game. It resets the merc's level and rerolls their seed.
- A **reroll item** (like Path of Exile's Chaos Orb) rerolls the merc's seed, probably resetting their level too.
- A reset keeps everything (the **starting position**) except the **level-up seed**, which decides only what level ups roll (D-0032).

## The recruit's gacha

Rolled when a merc is generated: race, rarity, starting stats, talents, starting skills, starting abilities, personality traits, and the hidden skill-unlock options.

## Open

- Numbers: starting stat spread per race, skill XP thresholds (merc XP curve: working, D-0102).
- Each trait's passive effect, parked by the designer: also whether race keeps its stat bias, how gender traits differ, and whether every trait is a trade-off (D-0036 to D-0040).
