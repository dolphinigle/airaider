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

### Round 6: what attributes do besides skills (passives)

The designer asked what each attribute's passive should be (like CON giving HP), from other games. From Claude's knowledge, not re-checked online.

| attribute | passives seen elsewhere |
|---|---|
| STR | carry weight (Fallout, D&D, Ragnarok, Oblivion, Divinity OS2); extra HP (Mount & Blade, Path of Exile); melee damage % (Fallout, Path of Exile); grapple/jump (D&D) |
| DEX | initiative/turn order (D&D, Pillars action speed, Ragnarok attack speed and cast time); accuracy (Path of Exile, Ragnarok, Diablo 2); evasion/dodge (Path of Exile, Ragnarok flee); block chance (Diablo 2) |
| CON | max HP (nearly all); healing received (Ragnarok VIT); resist poison, stun, disease (Ragnarok, Stoneshard VIT); stamina (Dark Souls) |
| INT | XP or skill points (Fallout, Mount & Blade); area size and effect duration (Pillars); mana (Path of Exile, Diablo 2); magic defense (Ragnarok) |
| CHA | prices (Fallout, Oblivion); party or companion size (Mount & Blade, Fallout); NPC disposition (Oblivion) |
| LUK | crit chance (Fallout, Ragnarok, Divinity OS2 Wits); loot (Fallout, Dark Souls item discovery); perfect dodge (Ragnarok); a little on every roll (Oblivion) |

Patterns: CON → HP and DEX → speed are near universal. STR's common side effect is carrying; INT's is learning or durations; CHA's lives outside fights (money, people); Luck touches crits and loot. Path of Exile gives each attribute one small defensive side effect (STR life, DEX evasion, INT energy shield).

### Round 7: skills on CON and CHA in other games

The designer asked what new skills could go on CON or CHA + CON, looking at D&D and others. From Claude's knowledge, not re-checked online.

| game | CON-type stat's skills | CHA-type stat's skills |
|---|---|---|
| D&D 5e | **none** (CON = HP, concentration and endurance saves; drinking in carousing uses CON saves) | Deception, Intimidation, Performance, Persuasion; Warlock, Sorcerer, Paladin cast with CHA (Sorcerers want CON second) |
| D&D 3.5 | Concentration (its only CON skill) | Bluff, Diplomacy, Intimidate, Perform, Handle Animal |
| Pathfinder 1e/2e | none | as D&D |
| Warhammer Fantasy RPG 4e | **Consume Alcohol**, Endurance (Toughness) | Charm, Entertain, Gossip, Haggle, Leadership, Bribery, Gamble (Fellowship) |
| Kingdom Come: Deliverance | **Drinking** is its own skill | Speech |
| Mount & Blade Bannerlord | Endurance: Riding, Athletics, **Smithing** | Social: Charm, Leadership, Trade |
| Elder Scrolls (Morrowind, Oblivion) | Endurance: Heavy Armor, Blunt, Block, Spear | Personality: Speechcraft, Mercantile, Illusion |
| Fallout 3 / New Vegas | Endurance: Unarmed (3), Survival (NV) | Speech, Barter |
| Kenshi | Toughness (levels by taking hits) | none |
| Cyberpunk 2077 | Body: Athletics, Annihilation, Street Brawler | (Cool: Stealth, Cold Blood) |
| Shadowrun 5e | none | Con, Etiquette, Leadership, Negotiation, Intimidation, Animal Handling |

Patterns:
- **CON with few or no skills is the tradition** (D&D, Pathfinder, Shadowrun): it is the HP stat. A thin CON is normal.
- When CON has skills they are **drinking** (WFRP, Kingdom Come, D&D carousing saves), **endurance** (marching, toughness), **armor and blocking** (Elder Scrolls), **smithing and riding** (Bannerlord).
- CHA + CON together: the D&D Sorcerer and Warlock (CHA casters who want CON); drinking with company (WFRP Consume Alcohol + Gossip).

### Round 8: Fury (Hellion) and Grit (Leper)

The designer saw no skill covers the Leper (self-heal) and liked both Fury and Grit. Darkest Dungeon kits from [darkestdungeon.wiki.gg/wiki/Leper](https://darkestdungeon.wiki.gg/wiki/Leper) and [/Hellion](https://darkestdungeon.wiki.gg/wiki/Hellion); other games from Claude's knowledge.

**Leper (Grit):** highest HP and damage, low accuracy and speed, front rank only, strongest against bosses. Solemnity heals self (and a little stress); Withstand marks self + Protection + resist bleed, blight, debuff, move for the fight; Revenge: once per fight, big damage and crit up but more damage taken; Intimidate weakens a foe and speeds himself.

**Hellion (Fury):** glaive berserker. Adrenaline Rush: self cure bleed/blight, tiny heal, big damage up; Breakthrough and Bleed Out: strong hits that leave her exhausted (her own damage and speed down for 3 rounds); Barbaric YAWP: stuns two foes, 3 uses per fight; If It Bleeds: bleed.

| idea | elsewhere |
|---|---|
| Fury: burst self-buff | D&D Barbarian Rage (damage up, resist physical); WoW Fury Warrior Enrage |
| Fury: pay later (exhaustion) | Hellion's self-debuffs; D&D Berserker Frenzy (extra attack, exhaustion after) |
| Fury: kills feed it | Battle Brothers Berserk (action points on a kill), Killing Frenzy (damage up after a kill); Path of Exile Berserker Rage |
| Fury: stronger when hurt / pay HP | Darkest Dungeon Flagellant; Diablo 2 Berserk (defense to zero) |
| Grit: self-heal | Leper Solemnity; D&D Fighter Second Wind; WoW Blood DK Death Strike (heals by recent damage taken) |
| Grit: survive a killing blow once | Battle Brothers Nine Lives; D&D Relentless Endurance; XCOM Sustain; Fire Emblem Miracle |
| Grit: shrug off statuses | Leper Withstand; Battle Brothers Indomitable (halve damage, immune stun/knockback); Path of Exile Juggernaut |
| Grit: regen | Fire Emblem Renewal; Pokémon Leftovers; Slay the Spire Burning Blood (heal after a fight) |

Fit: Leper = Heavy + Grit; Hellion = Long-reach + Fury; Flagellant = Fast + Holy + Fury (closes round 4's HP-cost gap). Split from existing skills: Defender protects others (guard, taunt); Grit keeps only itself alive. Doctor heals others with per-quest uses; Grit heals only itself.

### Round 9: names for Fury and Grit, and other battle skills worth having

The designer found "Fury" and "Grit" weird as skill names. From Claude's knowledge, not re-checked online.

Our names mix roles (Defender, Doctor) and fields (Leadership, Stealth, Alchemy, X Magic).

| for | names elsewhere |
|---|---|
| Fury (Hellion) | **Berserker** (Battle Brothers perk, Path of Exile ascendancy, D&D Path of the Berserker, Wartales class), Rage (D&D Barbarian), Frenzy, Bloodlust, Battle Rage |
| Grit (Leper) | **Juggernaut** (Path of Exile ascendancy: unstoppable, hard to kill), **Toughness** (Kenshi skill), Fortitude (D&D save), Endurance (Warhammer skill), Stalwart, Resilience, Unbreakable, Second Wind (D&D Fighter) |

Other battle skills seen in the genre that no current skill covers:

| skill | what | seen in |
|---|---|---|
| Nature Magic | roots and entangle, thorns, poison, regrowth healing | D&D Druid, Pillars Druid, Wildermyth, Divinity Geomancer |
| Blood Magic | spells paid in HP, life drain (Dark Magic has none, D-0072) | Path of Exile, Dragon Age Blood Mage, Divinity Necromancer |
| Illusion (mind magic) | charm, confuse, sleep, foes hit each other | Elder Scrolls Illusion, D&D Enchanter, Pillars Cipher |
| Duelist | riposte and counters, one-on-one, dodge | Darkest Dungeon 2 Duelist, Highwayman Riposte, Battle Brothers Riposte |
| Hunter | traps on foe ranks, beast slaying, tracking marks | Battle Brothers Hunter background, Darkest Dungeon Bounty Hunter, D&D Ranger |

### Round 10: every Darkest Dungeon class on the current skills

The designer asked to map every Darkest Dungeon class (DD1 + DLC, DD2 + DLC; 35 kits) onto the 23 battle skills (one weapon skill + others) and name what is missing. An Opus agent read each class's skills on [darkestdungeon.wiki.gg](https://darkestdungeon.wiki.gg) (DD1 rank details partly from knowledge).

| class | our skills | fit |
|---|---|---|
| Abomination (DD1, DD2) | Unarmed + Fury (+ Alchemy or Dark Magic) | partial: the class is the shapeshift (dropped) |
| Antiquarian | Alchemy + Leadership (+ Defender) | good |
| Arbalest / Musketeer | Shooting + Doctor (+ Dirty Fighting) | good |
| Bounty Hunter (DD1, DD2) | Throwing + Dirty Fighting (+ Defender) | good |
| Crusader (DD1, DD2) | Two-handed + Holy (+ Defender) | good (greatsword, not shield) |
| Duelist (DD1, DD2) | Single Weapon + Dirty Fighting or Leadership | partial: stances dropped |
| Flagellant (DD1, DD2) | Dual Wield + Grit + Holy | **partial: martyr side missing** |
| Grave Robber (DD1, DD2) | Throwing + Stealth (+ Alchemy) | good |
| Hellion (DD1, DD2) | Polearm + Fury | good |
| Highwayman (DD1, DD2) | Single Weapon + Dirty Fighting | **conflict: blade and pistol** |
| Houndmaster | Animal Companion + Defender (+ Leadership) | good |
| Jester (DD1, DD2) | Single Weapon + Performance | good |
| Leper (DD1, DD2) | Two-handed + Grit (+ Fury) | good |
| Man-at-Arms (DD1, DD2) | Weapon and Shield + Defender (+ Leadership) | good |
| Occultist (DD1, DD2) | Single Weapon + Dark Magic | good |
| Plague Doctor (DD1, DD2) | Alchemy + Doctor | good (per-quest uses may run dry) |
| Runaway (DD1, DD2) | Fire Magic + Stealth (+ Doctor) | good (burning zone partial) |
| Shieldbreaker | Polearm + Alchemy (+ Defender) | good |
| Vestal (DD1, DD2) | Single Weapon + Holy (+ Defender) | good |

Gaps:
- **Martyr support** (Flagellant, Abomination's Absolution): pays own HP or stress to heal allies, takes allies' bleeds and stress onto himself, stronger near death. Grit is self-only, Holy and Doctor heal for free. Real hole.
- **Ally tempo** (Jester's Encore, Duelist's Again!): give an ally an extra action or reset cooldowns. Fits Performance and Leadership bases.
- **Effects on a rank** (Runaway's burning zone, Vestal's Consecrations): optional; muddied by ranks shifting with no corpses.
- Fine to leave out: shapeshift, stances, corpses, torchlight, class stress outcomes.
- Covered already: executes and bonuses vs marked/stunned (modifiers), riposte, self-harm for power (Fury), status detonation (Alchemy, Fire, Dirty Fighting bases).

Conflicts with our rules:
- Highwayman needs a blade and a pistol; one weapon skill per merc (D-0090). Option: Single Weapon gets a few off-hand pistol bases.
- Foe movement in DD is spread wide (Shooting knockback, shield shoves, kicks, Dark pulls, Alchemy blasts); D-0073 gave it to Two-handed, Polearm, Dirty Fighting. Does that mean only them?
- Stress healing in a fight is a main DD support role (Jester, Houndmaster, Crusader); ours is rare and weak (D-0062), so no merc is the stress healer.
- Throwing-based classes (Grave Robber, Bounty Hunter) also stab in melee; Stealth and Dirty Fighting need some melee bases.
- Holy burn (DD2 Crusader) vs burns under Fire.
