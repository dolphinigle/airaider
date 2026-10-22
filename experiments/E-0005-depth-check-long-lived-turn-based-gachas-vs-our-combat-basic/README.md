---
id: E-0005
title: Depth check: long-lived turn-based gachas vs our combat basics
date: 2026-10-22
status: done
type: research
question: Do long-lived games run on a battle system like D-0041, and does it hold up for years?
verdict: Yes. Summoners War, Raid, Epic Seven, Honkai Star Rail and Pokémon share the core (one line, speed order, cooldowns, weaknesses, buffs and debuffs, mostly played on auto). Two depth sources they have that we lack: controllable speed and gear.
decisions: [D-0041]
commit:
---

## Question

The designer asked whether the D-0041 combat basics are deep enough, with long-lived games (probably gachas) as proof.

## Setup

Desk research: web searches plus known mechanics of Summoners War, Raid: Shadow Legends, Epic Seven, Honkai: Star Rail, Pokémon and Darkest Dungeon.

## Result

| game | since | shared with D-0041 | depth source we lack |
|---|---|---|---|
| Summoners War | 2014, $3B lifetime, ~220M downloads | no rows, speed order, cooldowns, buffs and debuffs, elements, PvE on auto | turn-bar control (speed buffs, push and pull), runes (gear) |
| Raid: Shadow Legends | 2018 | same model; auto with per-skill orders "Opener / 1st / 2nd / 3rd / Don't use" (patch 4.30), which is our S1–S4 | gear; its default auto AI made many champions unusable until players could set priorities |
| Epic Seven | 2018 | speed turn bar, cooldowns, element wheel, debuffs land by Effectiveness vs Resistance | readiness push and pull, gear |
| Honkai: Star Rail | 2023 | one line per side, adjacency (Blast) targets, weakness types, shields, DoTs, auto | Toughness break (weakness hits break a foe), shared team skill points |
| Pokémon | 1996 | speed order, four moves equipped, type chart, statuses | — (depth from types + status + build for 30 years) |
| Darkest Dungeon | 2016 | speed plus a random roll every round | ranks (positions) |

Key observations:
- **In these games the depth sits in the build.** Players run PvE on auto. What they plan is team comp, speed and the kit.
- **Speed is the stat everyone builds around** in SW and E7. A fast unit acts more often, and skills push or pull the turn bar.
- **Gear (runes, artifacts) carries most of the long-term depth.** We have none for now (D-0034). Modifiers, skill picks, tactics and traits stand in for it.

## Verdict

The core is proven deep enough. To close the gap, give speed teeth (statuses that shift it) and lean on weaknesses plus statuses that others read.

Sources: pocketgamer.biz (SW 10th anniversary), pocketgamer.com (220M downloads), hellhades.com (Raid patch 4.30 skill instructions), gamepress.gg (Epic Seven basics), bluestacks.com (Raid auto AI).

## Next

Mechanics worth borrowing, offered to the designer on 2026-10-22:
- Toughness break (Honkai: Star Rail).
- Foe intents (Slay the Spire, and the charge-up turns of gacha bosses).
- Waves, made harder by mana that doesn't refill.
- Extra turn on a kill (Summoners War).
- Cleanse and dispel.
- Leader aura from the Leadership skill (Summoners War, Raid).
- Reaction triggers: counter and retaliate.
- One major status per unit (Pokémon).

Designer, 2026-10-22: "foe intent isnt relevant here though since we are autobattler. waves is automatic i think. look at the ones with autobattler, like Loop Hero." Gear: "we will have this... eventually".

### Round 2: autobattlers only

Games looked at:
- Loop Hero
- Super Auto Pets
- Teamfight Tactics and Underlords
- Backpack Battles and The Bazaar
- AFK Arena
- Legend of Keepers

Ideas offered to the designer:
- **Adjacency on the line** (Super Auto Pets: friend ahead and behind; Backpack Battles: adjacent items).
- **Party synergies on shared tags** (Teamfight Tactics traits, Underlords alliances, AFK Arena factions).
- **Triggers:**
  - start of fight;
  - when hurt;
  - when an ally drops;
  - on a kill.
- **Stacks that grow over a quest's waves** (Super Auto Pets, Hearthstone Battlegrounds).
- **A morale bar as a second way to win** (Legend of Keepers).

Loop Hero's fight itself is shallow. Its depth comes from the build and from choosing what you face, which is the quest layer for us.

### Round 3: beyond combat

Ideas offered to the designer, 2026-10-22:
- **Bonds between mercs.** From Darkest Dungeon 2 relationships, XCOM 2 bonds, Fire Emblem supports and RimWorld.
- **Camping between waves.** From Darkest Dungeon: skills restore mana and stress at camp.
- **Downed at 0 HP.** From Darkest Dungeon's Death's Door: a healer can bring the merc back, and each hit while downed worsens the injury.
- **A risk dial per quest.** From Darkest Dungeon's torch: more loot for more stress and tougher foes.

### Round 4: Darkest Dungeon classes vs our skills

The designer asked whether our skills cover every Darkest Dungeon class (DD1 with DLC, DD2 with The Binding Blade). Rosters from [darkestdungeon.wiki.gg](https://darkestdungeon.wiki.gg/wiki/Heroes_(Darkest_Dungeon_II)) and [darkestdungeon.com](https://www.darkestdungeon.com/news/darkest-dungeon-ii-the-binding-blade-base-game-retail-release).

Result: **every class maps to one or two of our skills**, the same shape as our two starting skills. Abomination is the one exception.

| class | our skills |
|---|---|
| Abomination | Unarmed + Dark, plus **shapeshift (no home)** |
| Antiquarian | Lore + Alchemy; brought along for extra loot |
| Arbalest, Musketeer | Ranged + Doctor (bandage) / Leadership (flare) |
| Bounty Hunter | Villainy (mark, pull, knockback) |
| Crusader | Heavy + Holy |
| Flagellant | Light + Holy, plus **abilities paid in HP, stronger at low HP** |
| Grave Robber | Light + Roguery (Shadow Fade) |
| Hellion | Heavy (polearm) |
| Highwayman | Light + Ranged (pistol) |
| Houndmaster | Animal Companion + Defense |
| Jester | Light + Performance |
| Leper | Heavy |
| Man-at-Arms | Defense + Warfare |
| Occultist | Dark |
| Plague Doctor | Alchemy + Doctor |
| Vestal | Holy |
| Shieldbreaker | Light (spear) + Defense; attacks that pierce ranks |
| Runaway (DD2) | Elemental (fire) + Defense |
| Duelist (DD2) | Light, plus **stances** |

Gaps are mechanics, not skills: shapeshift, HP-cost abilities, stances, guns (setting question). Our skills with no Darkest Dungeon class: Unarmed, Engineering, Lore as a fighting skill, mostly Elemental. Plague Doctor supports merging Doctor into Alchemy; Antiquarian is a model for civilians brought along for loot.

### Round 5: how many attributes, and Luck

The designer asked whether 5 attributes (WIL cut) is decent, and about a 6th, LUK, with no skills that raises coin heads odds. From Claude's knowledge, not re-checked online.

| attributes | games |
|---|---|
| 0 (class stats only) | Darkest Dungeon, RimWorld (skills + traits), Wildermyth |
| 3 | Path of Exile (STR DEX INT) |
| 4 | Diablo 2, Mount & Blade Warband, Disco Elysium (4 attributes, 6 skills each) |
| 5 | Stoneshard (STR AGL PER VIT WIL) |
| 6 | D&D, Pathfinder, Baldur's Gate 3, Pillars of Eternity, Divinity OS2, Bannerlord, Shadowrun Returns, Ragnarok Online (with LUK) |
| 7 | Fallout SPECIAL (with Luck) |
| 8 | Battle Brothers (combat numbers, not attributes); Fire Emblem (with Luck) |

- 4–6 is the normal range; 6 is the D&D habit, not a need. Games where stats grow on their own (not player-allocated) lean fewer: each stat must read on a recruit card.
- Luck as a stat appears in Fallout (crits, random encounters), Fire Emblem (hit, dodge, crit dodge), Ragnarok Online (crits, perfect dodge). Common rep: a weird, loved stat; Fallout 4 Luck builds became a god stat when its effects stacked.
- Lesson for us: a stat that touches every flip must stay small per point, or it beats every other stat.
