# Autobattlers and auto-resolved fights: where the decisions sit

## 1. Loop Hero in depth

**Core idea.** Loop Hero began as a "zero-player game" idea. The hero walks a loop and fights on his own. The player shapes what lies ahead and acts as the hero's dungeon master, placing "just enough challenge ahead to avoid killing the hero while still making them stronger" ([Destructoid](https://destructoid.com/?p=265570); [Game Developer postmortem](https://www.gamedeveloper.com/design/postmortem-loop-hero)). Combat runs by itself, and "the hero pushes forward until ordered to retreat or dies in battle" (Destructoid).

**Where the player's decisions sit. None of them are inside a fight.**
- **Tile placement (the main lever).** There are road cards (they spawn enemies on the path), roadside cards and landscape cards (passive stat or HP effects) ([Pixel Twelve guide](https://pixeltwelve.com/guides/loop-hero-beginner-guide-cards-gear-retreat-camp)). Tiles combine. Ten rocks or mountains spawn a goblin camp. A cemetery spawns skeletons every n days, which are stronger but drop better loot ([AV Club](https://www.avclub.com/loop-hero-tips); [postmortem](https://www.gamedeveloper.com/design/postmortem-loop-hero)). Every placed card also fills the boss meter, so greed brings the boss sooner (Pixel Twelve). Reviewers describe the appeal as push-your-luck: "taking higher risks means potentially better rewards" ([Indie Game Reviewer](https://indiegamereviewer.com/loop-hero-review-keeps-goin-and-goin-and-goin/)).
- **Gear.** Stats come mostly from items. When the inventory is full, the oldest item is destroyed on pickup. The designers wanted it to "fill up, but not clutter," which forces quick comparisons (postmortem).
- **Planning mode.** You can pause at any time to place cards and change gear ([Gigazine](https://www.gigazine.net/gsc_news/en/20210320-loop-hero); [Checkpoint](https://checkpointgaming.net/reviews/2021/03/loop-hero-review-a-surprising-strategy-format/)). Placing a card also pauses the game.
- **Retreat timing (the push-your-luck valve).** Retreating at the campfire tile keeps 100% of collected resources. Retreating anywhere else keeps 60%. Dying keeps 30% ([AV Club](https://www.avclub.com/loop-hero-tips); [Geeks Under Grace](https://www.geeksundergrace.com/gaming/pc/review-loop-hero/)). The decision comes once per lap, when the hero reaches camp. Guides advise deciding before the next loop, not when the boss appears (Pixel Twelve).
- **Deck and camp.** Before the run you pick which cards go in a capped deck. Camp buildings unlock potions, classes and new tiles. Traits picked at level-up "strongly affect how a run plays out" (postmortem). Death refunds part of the resources, so losing still pays for progress (Destructoid).

**Stat model.** Fights run on a small set of numbers: Damage, Damage to All, Attack Speed, Defense (flat reduction per hit), Evasion %, Counter %, Vampirism (a % of damage dealt returned as HP), Regen/sec, and Crit for some classes ([PC Gamer classes](https://www.pcgamer.com/au/loop-hero-classes); [Gfinity](https://www.gfinityesports.com/article/loop-hero-vampirism-what-does-the-vampirism-stat-do)). Each stat has situational value. Defense is useless against the Lich's magic damage. Evasion above about 30% is the counter to the Lich and to fast goblins and ratwolves. Vampirism only heals when a hit lands ([Steam](https://steamcommunity.com/app/1282730/discussions/0/3112522283879913233); [GameRevolution](https://www.gamerevolution.com/?p=675891); [AV Club](https://www.avclub.com/loop-hero-tips)). The lesson is that stats become interesting decisions when enemy types beat different stats.

**Fight display.** From play (I found no written source for this): a small panel opens with the hero on one side and the enemies on the other, each with an HP bar and an attack timer. Ars Technica calls the presentation "itty-bitty sprites, limited animations, and a menu-swapping interface" that can "scream the word 'boring'" ([Ars via Harvard TagTeam](https://tagteam.harvard.edu/hub_feeds/3382/feed_items/2900969)). Gigazine sums up a boss fight: "the player can only pray."

**Praise and criticism.**
- Praise centers on discovering synergies ("it's genuinely thrilling to stumble on something new"), risk/reward and build-crafting ([Indie Game Reviewer](https://indiegamereviewer.com/loop-hero-review-keeps-goin-and-goin-and-goin/)). Ars calls it "barely interactive tea" that it "cannot stop playing."
- Criticism:
  - Players call it an idle game. "Playing the game now is like data entry, the game plays itself," and placement "rarely matters" ([Steam thread](https://steamcommunity.com/app/1282730/discussions/0/4768721792061328701)).
  - Some only play it with "sports or a show on in the background" ([RAWG/Backloggd roundup](https://rawg.io/games/loop-hero/reviews)).
  - Aggregated reviews cite "long combat sequences without interaction" ([OpenCritic](https://opencritic.com/game/11017/-/reviews?page=3)). Even at 2x speed it "feels far too slow" ([Twinfinite](https://twinfinite.net/features/ways-loop-hero-even-better/)).
  - Late chapters "deteriorate into more of a grind," and random drops can leave you "entire loops without what you need" (Indie Game Reviewer).
- Defenders reply that "this isn't an idle game, things don't just happen on their own" ([Steam](https://steamcommunity.com/app/1282730/discussions/0/3278066986681565260)). The split runs along one line: players who see their placements change fights call it strategy, and players who don't call it idle.

**Takeaway.** Loop Hero works because the fight is the test of decisions you made a few seconds earlier: the tile you just placed, the ring you just equipped, the lap you chose to push. It drifts toward "spectator mode" when fights become routine and the cause and effect blurs.

## 2. The other games

### Shop-and-fight autobattlers (Super Auto Pets, TFT/Auto Chess, Backpack Battles, The Bazaar)
- **Where decisions sit.** All of them are made before the fight, in a shop phase. Combat then runs with no player input ([Backpack Battles Wikipedia](https://en.wikipedia.org/wiki/Backpack_Battles); [Hearthstone Top Decks](https://www.hearthstonetopdecks.com/how-does-hearthstone-battlegrounds-compare-to-other-auto-battlers/)). A Backpack Battles reviewer: "the shop screen is where I've spent most of my time" ([GamingOnLinux](https://www.gamingonlinux.com/2024/03/backpack-battles-is-another-clear-indie-steam-hit)). Super Auto Pets was built to be an autobattler "but with time to think through actions" ([itch.io dev post](https://itch.io/t/1355958/super-auto-pets-chill-online-auto-battler)). TFT's lead designer framed the goal as "tough choices rather than touch execution" ([Pocket Tactics on the GDC 2020 talk](https://www.pockettactics.com/teamfight-tactics-design)). One of TFT's pillars is "Fortune," which it defines as "the skill of managing luck and unpredictable outcomes" ([TFT pillars](https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/dev-design-pillars-of-tft)).
- **Fight math.**
  - **Super Auto Pets** is the simplest: each pet has Attack and Health. The front pets trade hits until one faints, the next steps up, and triggers (Start of Battle, Faint, Hurt) add the surprises. A win earns a trophy, a loss costs a life, and a draw changes nothing ([SAP wiki](https://superautopets.wiki.gg/wiki/The_Basics)). Trigger ordering is opaque even to veterans ([Steam](https://steamcommunity.com/app/1714040/discussions/0/3086646248547568129)).
  - **Backpack Battles and The Bazaar** use timelines. Each item fires on its own cooldown and buffs its neighbors. Bazaar effects act on time itself: Haste doubles charge speed, Slow halves it, Freeze stops it ([Mobalytics keywords](https://mobalytics.gg/the-bazaar/guides/keywords-and-terms)).
- **Fight length and forced endings.** Backpack Battles fights run about 10 to 20 seconds (Wikipedia). Fatigue starts at 17 seconds, at 1 damage and rising each tick ([BB wiki](https://backpackbattles.wiki.gg/wiki/Fatigue)). The Bazaar's Sandstorm starts at 30 seconds ([PCGamesN](https://www.pcgamesn.com/the-bazaar/mak-new-hero-season-1)). Both games force a hard cap on fight length, so nobody watches a stalemate.
- **Readability.** In its Galaxies retrospective, Riot says the previous set had "invisible power" and was "often quite hard to track." Their fix was slower spells with travel time, and standout key champions. "High-spectacle" moments (Darius dunks, Ziggs bombs) "created hype moments" ([TFT Galaxies learnings](https://teamfighttactics.leagueoflegends.com/en-us/news/dev/dev-teamfight-tactics-galaxies-learnings/)). A developer interview on pacing auto battles recommends a slow start "so players can read the situation," building to an explosive finale. Clear rock-paper-scissors matchups let players think "Yes, that makes sense." Fast-forward should be available to veterans ([80.lv, Sangokushi Bond](https://80.lv/articles/interview-the-sega-veteran-behind-get-wrapped-up-on-sangokushi-bond-and-the-future-of-auto-battlers)). Players say a fight is "only really worth watching" when "the outcome didn't go as you expected" ([Steam, Millennia](https://steamcommunity.com/app/1268590/discussions/0/4356743780108354582)).
- **Non-combat in The Bazaar.** Each "hour" offers a choice of merchant, random event, PvE monster or PvP fight ([Game8](https://game8.co/articles/games/the-bazaar)). Events are text choices with "unexpected outcomes," not autobattles. Non-combat flows through the same item board, though (economy items, event rewards).

### Hero's Hour
Combat is real-time with "little player input." The only meaningful intervention is spending mana on spells ([Tech-Gaming](https://tech-gaming.com/heros-hour)). Reviewers say the graphics make it "difficult to determine what's going on," and that highlighting a spell's targets was more useful than the spell ([Cubed3](https://cubed3.com/review/6660/1/heros-hour-pc.html)). Players call it "just an autobattler, with spells" ([Steam](https://steamcommunity.com/app/1656780/discussions/0/3184612855376310116)). The lesson: a token intervention button does not make a fight readable, and spectacle cannot compensate for unclear causes.

### Despot's Game
You position units and draft weapons and mutations, then "sit back and watch the 8-bit massacre commence." The game shows no damage numbers, so "it's quite difficult to tell which units are effective." The reviewer asks for a post-battle recap ([SuperJump](https://www.superjumpmagazine.com/despots-game-review/)). Between fights, every room costs food, and starving debuffs damage by 40% to 70%. That resource pressure carries the decisions between fights. Verdict: "fun, but just a limited amount of fun."

### Legend of Keepers
Traps fire on their own. Monster rooms are turn-based with a few choices ([Turn Based Lovers](https://turnbasedlovers.com/review/legend-of-keepers)). It has two ways to beat an adventurer: kill him (pays blood) or break his morale until he flees (pays tears) ([JumpDashRoll](https://www.jumpdashroll.com/article/first-impressions-legend-of-keepers-career-of-a-dungeon-master); [Steam](https://steamcommunity.com/app/1151080/discussions/0/3159763879073698607)). This is a non-lethal win track inside the combat engine. Criticism: "most fights feel the exact same" ([TechRaptor](https://techraptor.net/gaming/reviews/legend-of-keepers-review)).

### Ogre Battle: March of the Black Queen (1993)
This is the closest ancestor to a squad-of-named-mercs autobattler.
- **Fight structure.** A fight is a single round. Each character acts according to its row (a mage strikes twice from the front, or casts one spell that hits everyone from the back).
- **Interventions mid-fight.** You can change the tactic (Best, Strong, Weak or Leader), play one of 22 Tarot cards, or retreat. Retreat always succeeds but counts as a loss and lowers the leader's Charisma ([RPGFan](https://www.rpgfan.com/review/ogre-battle-the-march-of-the-black-queen-4/)).
- **Partial results.** If both sides survive, the side that dealt more damage wins and pushes the other back. Fights rarely end in total wipes; they produce small advances and setbacks.
- **Non-combat checks.** Liberating a town is a non-combat event, and who you send decides the result. High-alignment, high-charisma leaders raise reputation, low ones lower it, and a random Tarot is drawn ([Wikipedia](https://en.wikipedia.org/wiki/Ogre_Battle:_The_March_of_the_Black_Queen)).

Unicorn Overlord (2024) revives this formula with priority-ordered tactics, each carrying two conditions, plus an "Optimize" button. Reviewers praise the depth but say setting tactics "can get time consuming" ([Checkpoint](https://checkpointgaming.net/reviews/2024/03/unicorn-overlord-review-another-win-for-vanillaware/); [RPG Site](https://www.rpgsite.net/news/15481-unicorn-overlord-highlights-tactics-priority-and-battle-stages-along-with-several-new-non-human-allies)).

### Gratuitous Space Battles
Cliff Harris: "I wanted to design a game where having no control was actually the main mechanic" ([Pixel Dynamo via N4G](https://n4g.com/news/1696340/pixel-dynamo-because-lasers-gratuitous-space-battles-2)). You give orders before the battle, such as engage this ship class at this range, or stay in formation ([Bit-Tech](https://bit-tech.net/reviews/gaming/pc/gratuitous-space-battles-review/1/)). Harris later patched in direct control for single-player ([PC Gamer](https://www.pcgamer.com/uk/gratuitous-space-battles-patch)). The sequel was criticized for "easy cheese strategies" ([PC Gamer GSB2](https://www.pcgamer.com/uk/gratuitous-space-battles-2-review)). A deterministic, fully pre-committed fight can be solved, and then it is dead.

### FF12 gambits and Dragon Age: Origins tactics
Square Enix adopted gambits because full real-time control "might be too fast-paced and difficult." The payoff is the "feeling of triumph when you defeat a formidable enemy through a fine-tuned setting" ([PlayStation Blog](https://blog.playstation.com/?p=192698)). Gambits are if/then rules evaluated top-down, with a limited number of slots ([StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XII/Gambits)). Critics say the player is "one step removed," "programming the combat from a distance." Dragon Age: Origins uses the same idea, with slots that unlock by level. A common failure is a companion with an unfilled slot just auto-attacking ([Steam](https://steamcommunity.com/app/47810/discussions/0/2579854400736575780/?l=latam)). Programmable AI works for experts but is a setup burden for everyone else.

### Darkest Dungeon (not automatic, for contrast)
Sigman wanted to force "permanent decisions with imperfect information," and treated loss of agency as part of the design ([GamesBeat](https://gamesbeat.com/darkest-dungeon-designers-really-arent-sadists-were-realists/3/); [PC Gamer](https://www.pcgamer.com/uk/how-darkest-dungeon-got-inspiration-from-band-of-brothers-and-aliens)). Its non-combat layer is curios (using the right item avoids stress), camping and provisioning ([DD wiki](https://darkestdungeon.wiki.gg/wiki/Camp)). Its rule is that every swing leaves a persistent mark, through stress, afflictions and quirks.

### CK3 duels (an outside example worth stealing)
Each round you draw 3 moves from a pool. Prowess sets how good the draw is, and traits, location and relationships can add special moves, including insults. You trade "Likelihood of Success" against "Risk of Injury." If nobody wins after 4 rounds, the higher prowess wins. Outcomes include wounded, more dreadful, stressed or dead ([PCGamesN](https://pcgamesn.com/crusader-kings-3/duel-system); [Paradox DD#51](https://forum.paradoxplaza.com/forum/threads/crusader-kings-3-dev-diary-51-its-time-to-duel.1461029/page-13)). Tournaments use the same contest frame for jousts, wrestling, chess and poetry recitals, with approach choices drawing on different skills. The skill mapping comes from players, not the developers ([Steam](https://steamcommunity.com/app/1158310/discussions/0/4038102936181024923)).

## 3. Answers to the key questions

**Where decisions sit.** Three patterns appear:
- **Before the fight only:** SAP, TFT, Backpack Battles, The Bazaar, Despot's Game, GSB. This works when the setup phase is dense, fights are short, and you fight many times per session.
- **Between beats:** Loop Hero's per-lap retreat and the card placed before the next fight. Planning mode lets you act at any moment, but not on the fight itself.
- **Interrupts during the fight:** Ogre Battle (tactic, Tarot, retreat), Hero's Hour (spells), CK3 (a move every round). Interrupts only add value when each one shows a clear effect. Hero's Hour spells are the counter-example.

**Length and readability.** Successful autobattlers keep fights to roughly 10 to 30 seconds and hard-cap them (Fatigue at 17 s, Sandstorm at 30 s). Readability needs:
- **Visible causes:** numbers, travel time, standout units. Despot's Game and Hero's Hour fail here.
- **Few actors.** TFT caps board size. Despot's Game's 40-unit brawls are "cluttered."
- **Matchups a newcomer can read**, like rock-paper-scissors.

**Stats to fight math.** The successful games use small, legible stat sets: Attack/Health in SAP, Damage/Defense/Evasion/Speed in Loop Hero, cooldown and adjacency in Backpack Battles and The Bazaar. Depth comes from enemy types that make different stats valuable (Lich ignores Defense, goblins punish low Evasion) and from triggers and adjacency, not from many stats.

**What makes watching fun or dead.**
- **Fun:**
  - A build you just changed being tested.
  - Swingy, visible trigger moments (a faint trigger, a crit, a summon).
  - A short fight with a forced end.
  - Surprise ("only worth watching if the outcome didn't go as expected").
  - Shared spectacle.
- **Dead:**
  - Routine fights whose result is already known.
  - No numbers or log.
  - Clutter.
  - Long fights with no input.
  - Grind fights with nothing at stake (Loop Hero's late game).

**Non-combat in the same engine.** No game I found runs lockpicking or persuasion as an autobattle. The workable patterns are:
1. A **parallel engine with the same skeleton.** Griftlands' negotiation mirrors its combat turn structure, with "arguments" in place of HP ([PC Gamer](https://www.pcgamer.com/uk/griftlands-complex-double-deck-building-shows-promise-in-early-access); [GameCritics](https://gamecritics.com/mike-suskie/griftlands-review/)).
2. A **second damage track** in the combat engine: Legend of Keepers' morale or flee win.
3. **Non-combat moves inside the contest:** CK3 insults; tournament approaches using different skills.
4. A **stat-gated outcome with no simulation:** Ogre Battle liberation by alignment and charisma; The Bazaar's text events.

## Implications for airaider

- **The designer's worry is valid, and autobattle fights are a good answer to it.** Fights should resolve from each merc's own weapon skill (an axe-user swings Heavy Weapons). A fight should not be a single test naming one skill. The fight's math can still be coins: each merc flips their weapon-skill pool every exchange, and SAP's two-number model shows how little is needed.
- **Put every decision before or between beats, never inside an exchange.** Loop Hero's model fits a mercenary game: who goes, approach, push or retreat. Add one Ogre Battle-style interrupt per fight at most (a stance or tactic switch, or a retreat that always succeeds but costs something).
- **Make retreat a tiered push-your-luck choice, offered at fixed checkpoints between fights:** clean withdrawal keeps everything, mid-quest retreat keeps part, a wipe keeps little (Loop Hero's 100/60/30).
- **Keep fights short and capped:** about 3 to 6 exchanges, then a forced resolution such as dusk, reinforcements, or morale breaking. Partial results are allowed: whoever dealt more damage holds the field, as in Ogre Battle. Fatigue and Sandstorm show that the cap itself creates tension.
- **Enemy types should beat specific stats** (armored = Defense useless, swift = needs Evasion or DEX, magic = Arcane matters). That makes "who you sent" visible in the result without adding stats.
- **Readability is a requirement:** show coins, numbers and a one-line cause per swing. Despot's Game and Hero's Hour show that unclear causes kill auto fights. Text-first is an advantage here; a fight log is the "post-battle recap" Despot's Game lacked.
- **Keep non-combat checks as coin tests. Don't autobattle them.** No game does stealth or lore as an autobattle. If a parallel structure is wanted, reuse the fight's skeleton (Griftlands: composure in place of HP) or add a second track (Legend of Keepers morale: Intimidation breaks the enemy's will, Persuasion avoids the fight).
- **Allow non-combat skills inside fights as moves, as CK3 does with insults.** Leadership rallies, Intimidation drains morale, Holy heals. Talk and Magic mercs then matter in fights without every test naming a weapon skill.
- **Give the auto fight a real stake.** Late Loop Hero shows that fights with nothing on the line turn into spectator mode. Every fight should risk a wound, loot, a stress or affliction-like mark, or the quest. Darkest Dungeon's lasting marks are what make swings matter.
- **Let the player read the odds before committing,** like CK3's Likelihood of Success against Risk of Injury. Show squad-vs-enemy odds and the stakes at the decision points; the odds band of 40-75% from the earlier lessons still applies.
- **Avoid programmable AI** (gambits, tactic slots) for a light, fast game. It is a setup burden and empty slots fail silently. Use one approach or stance chosen per fight or per quest instead.
- **A deterministic pre-committed fight can be solved** (GSB2 "cheese"). Coin flips per exchange plus trigger moments keep the variance and surprise that make watching worthwhile.
