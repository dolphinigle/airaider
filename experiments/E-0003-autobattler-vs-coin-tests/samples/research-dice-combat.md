# Coin-flip auto combat: how chance fights stay swingy, readable and owned

## 1. The closest model: Limbus Company's coin clashes

Limbus Company (Project Moon) already does most of what airaider needs: automatic coin-flip combat, decided ahead of time and readable.

**Skills are sets of coins.** Each skill has three numbers: a Base Power, a number of Coins, and a Coin Power. Heads adds the Coin Power to the running total. Tails adds nothing ([Limbus wiki: Sanity](https://limbuscompany.wiki.gg/wiki/Sanity), [Wikipedia](https://en.wikipedia.org/wiki/Limbus_Company)). The UI shows a white base number, which is what you get if every coin lands tails, and a smaller per-heads number. Together they give a min–max range on every skill ([gamepretty combat guide](https://gamepretty.com/limbus-company-combat-guide-for-aspiring-clockfaces-to-stop-being-murdered-by-mariachis/)).

**A clash is a war of attrition between two coin sets.** Both sides flip all their coins. The lower total loses one coin, and both sides re-flip. This repeats until one side has no coins left. The winner then makes a one-sided attack with the coins it has left ([Limbus wiki: Battle](https://limbuscompany.wiki.gg/wiki/Battle)). In that attack each coin is a separate hit, and heads keep adding to the total. The guide's example is base 5, +4 per heads, hitting 9, 13, 17, 21 for 60 total, doubled against a weakness ([gamepretty](https://gamepretty.com/limbus-company-combat-guide-for-aspiring-clockfaces-to-stop-being-murdered-by-mariachis/)). One exchange therefore yields many flips with a clear shape: a tug-of-war, a break, then a payoff hit-chain that builds.

**Morale is the heads chance.** Heads chance = 50 + SP, with SP running from -45 to +45, so 5% to 95%. SP rises mainly from winning clashes and killing enemies. It falls from allies dying, using E.G.O, and some status effects. At -30 a unit may get Low Morale, and at -45 it Panics and loses its turn ([Limbus wiki: Sanity](https://limbuscompany.wiki.gg/wiki/Sanity)). This is a built-in momentum loop. Winning raises your odds of winning again, but the cap and the Panic reset keep the snowball bounded.

**HP bars carry stagger thresholds.** Taking damage past a threshold Staggers a unit. It can't use skills for the rest of that turn or the next, and it takes double physical damage. Crossing several thresholds in one turn stacks the multiplier: ×2, then ×2.5, then ×3 ([Battle](https://limbuscompany.wiki.gg/wiki/Battle)). A long HP bar becomes a series of breakpoints, each one a story beat.

**Odds are shown in words.** The UI shows a Clash Outcome Forecast: Hopeless (<10%), Struggling (10–40%), Neutral (40–60%), Favored (60–90%), Dominating (>90%). One-sided attacks get a min–max damage preview ([Battle](https://limbuscompany.wiki.gg/wiki/Battle)).

**Player input happens before the flips.** You choose which skill goes in each slot (a slot offers two skills, drawn from a weighted list), whom to target, which enemy attacks to contest, and when to spend SP on E.G.O. Speed order decides who can force a clash ([Battle](https://limbuscompany.wiki.gg/wiki/Battle), [Steam thread](https://steamcommunity.com/app/1973530/discussions/0/4844273660401341725)). Once you commit, everything resolves automatically.

**Special coin rules create variety.** Unbreakable coins still attack after losing a clash, and Excision coins destroy Unbreakable ones ([Sanity](https://limbuscompany.wiki.gg/wiki/Sanity)).

**What players complain about** ([Steam discussion](https://steamcommunity.com/app/1973530/discussions/0/598526935953321091)):
- Cascades: "one bad coin flip, one bad speed roll, or one bad targeting" can stagger a character and sink the fight.
- Negative "red" coins feel like losing even when you win the clash.
- Auto-selection leaves enemy attacks unopposed ([search summary of Steam threads](https://steamcommunity.com/app/1973530/discussions/0/3791505882408384719/?l=spanish)).
- Some players prefer Library of Ruina, where damage lands immediately per clash, though newer sound and effects improved Limbus clashes.
- A Game8 review lists the system's complexity as a weakness ([game8](https://game8.co/articles/review/205)).

Defenders argue Limbus gives more in-battle control over its randomness than Ruina did ([same thread](https://steamcommunity.com/app/1973530/discussions/0/598526935953321091)).

**What to take from it:** a skill as a coin set, attrition clashes, morale as heads chance, stagger breakpoints, and worded odds. Avoid stacked multipliers (weakness ×2 then stagger ×2 or more), which turn one bad flip into a collapse, and avoid negative coins.

## 2. Telegraphed intent: Into the Breach, Wildfrost, Slay the Spire, Slice & Dice

- **Into the Breach.** Enemies show their attacks a turn ahead, which makes each turn a puzzle ([Game Developer, Road to the IGF](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)). Matthew Davis said the vision was to be "more deterministic in the moment-to-moment gameplay" ([PC Gamer](https://pcgamer.com/into-the-breach-preview)). The one random element left is Grid Defense, a 25% chance a hit building takes no damage ([Nintendo Life](https://nintendolife.com/reviews/switch-eshop/into_the_breach)). The randomness is in the setup (map, spawns), and the player responds to known threats ([GMTK, "The Two Types of Random"](https://amara.org/en-gb/videos/C3IIn1JRUBXt)).
- **Wildfrost: timers instead of intent icons.** Every unit shows a counter that ticks down to its automatic action. Snow freezes counters ([Checkpoint](https://checkpointgaming.net/reviews/2023/04/wildfrost-review-dynamic-and-delightful/), [Xbox Hub](https://www.thexboxhub.com/wildfrost-review/)). A reviewer said visible timers "removed a lot of the guesswork," allowing planning "several turns ahead." The devs prototyped it as a physical card game to sort out the counters, and kept everything around the counter "as simple as possible" with consistent terms ([MCV, "When We Made… Wildfrost"](https://mcvuk.com/?p=224506)). Countdowns are a clean, text-friendly form of intent: "Ghoul strikes in 2."
- **Slay the Spire.** PC Gamer's Best Design award credits openness about enemy intent as adding certainty to each random shuffle ([PC Gamer](https://pcgamer.com/best-design-2019-slay-the-spire)).
- **Slice & Dice** (tann). Five heroes, each with a six-sided die whose faces reflect the class. Enemy rolls are telegraphed before your turn. You choose which dice to reroll and can undo freely ([tvtropes summary](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SliceAndDice), [Buried Treasure](https://buried-treasure.org/2021/07/slice-dice/)). Reviewers call rerolls a "hooky gambly feel," since you can lose a good result, and praise luck "as a deliberate design choice" ([Buried Treasure](https://buried-treasure.org/2021/07/slice-dice/), [Automaton](https://automaton-media.com/en/news/slice-dice-strategic-monster-battling-roguelike-with-tons-of-variety/)). The structure is: see the threat, roll, keep or reroll, assign. The chance is real, but every result passes through a decision.
- **Lonestar.** The store page promises no "surprise attacks," and power beams compete so that lining up your weapons cancels enemy attacks ([Steam](https://store.steampowered.com/app/2056210/), [Rogueliker](https://rogueliker.com/lonestar-review/)). Details are thin because the search budget ran out.

**Design rule:** when the whole fight is chance, the enemy's next move should not be. Telegraph intent (icon or countdown), then let chance decide how well you answer it.

## 3. Randomness first, then choose: Dicey Dungeons, Dicefolk, Coin Crypt

- **Dicey Dungeons.** Terry Cavanagh calls the design "an inversion of RPG combat": "you get the RNG up front, and you get to decide how to make the best of it" ([Game Developer](https://www.gamedeveloper.com/disciplines/road-to-the-igf-cavanagh-houston-dobbe-s-i-dicey-dungeons-i-)). Two random layers, random cards plus random dice, "led to the game just feeling way too chaotic," so he made equipment layouts static. He called the balance between strategy and chaos "the hardest thing to get right!" (same source). Equipment slots take dice with rules such as odd, even or ≤3, so every roll becomes an assignment puzzle.
- **Input vs output randomness.** Geoff Engelstein coined the terms, framing them as randomness that supports strategy versus randomness that undercuts it ([Loop & Ledger](https://loopandledger.beehiiv.com/p/input-vs-output-randomness)). Some research finds input randomness can also hurt satisfaction ([arXiv](https://arxiv.org/pdf/2107.08437v1.pdf)), so it is not automatically safe.
- **Dicefolk.** You roll dice for both sides, and its rotation of three chimera makes each turn a positioning puzzle ([MP1st](https://mp1st.com/reviews/dicefolk-review-a-spin-of-the-dice), [God is a Geek](https://godisageek.com/reviews/dicefolk-review/)). Critics praise it, but some say it "can sometimes feel a touch too random for its own good" ([OpenCritic](https://opencritic.com/game/16335/dicefolk)).
- **Coin Crypt** uses coins as consumable cards. Reviewers liked the resource management but complained it is "too dependent on luck," since entire floors can pass without an attack coin ([Cubed3](https://www.cubed3.com/games/reviews/pc/coin-crypt), [TheSixthAxis](https://www.thesixthaxis.com/2014/05/28/indie-focus-coin-crypt/)). When the right tool can fail to show up, the run feels unfair.

## 4. The thrill of watching it score: Balatro, Luck be a Landlord, Peglin

- **Balatro.** LocalThunk deliberately hides the score preview: the game "is more fun when you set up your Rube Goldberg machine and watch it go" before learning whether the hand wins ([GMTK Substack](https://gmtk.substack.com/p/balatros-cursed-design-problem), [Aftermath](https://aftermath.site/balatro-the-long-dark/)). The payoff is staged:
  - cards and jokers step forward one at a time;
  - the numbers tick up with escalating sound;
  - a big multiplier "burns hotter" with each step ([GMTK](https://gmtk.substack.com/p/balatros-cursed-design-problem));
  - each card's tally rises in pitch, and each joker raises the pitch and speed toward "a breakneck, euphoric crescendo" ([AV Club](https://www.avclub.com/balatro-hones-the-art-of-making-numbers-go-up));
  - several feedback channels stack on each event: motion, a rolling counter, particles, sound ([Blake Crosley breakdown](https://blakecrosley.com/ja/guides/design/balatro)).

  GMTK's caveat: if the information can be calculated, players will calculate it ([GMTK](https://gmtk.substack.com/p/balatros-cursed-design-problem)). Hide only the result of the flips, never the odds.
- **Luck be a Landlord**, Balatro's main inspiration ([Shacknews](https://shacknews.com/article/139116/balatro-inspiration-luck-be-a-landlord-reddit-ama)). Each spin is fully automatic. All decisions sit between spins: which symbol to add, what to destroy. Rent rises steadily ([Game Developer PR](https://www.gamedeveloper.com/press-release/roguelike-deckbuilder-luck-be-a-landlord-crushes-capitalism-on-consoles-feb-6-2025)). Its designer aims for players to never think "that's not fair." For example, if rent leaves you at 0 coins, the game gives you one coin instead of ending the run ([TrampolineTales Q&A](https://blog.trampolinetales.com/questions-and-danswers/)).
- **Peglin.** Peg hits become damage. Crit pegs retroactively boost every hit the ball has already made, so one lucky bounce turns the whole shot gold ([Rogueliker](https://rogueliker.com/peglin-review/), [Siliconera](https://siliconera.com/?p=1050661)). Reviewers note "a fair bit of 'hit and hope'" and limited control over outcomes ([TheSixthAxis](https://www.thesixthaxis.com/2025/09/09/peglin-review/), [NWR](https://www.nintendoworldreport.com/review/69288/peglin-switch-review)).

**Rule:** reveal the flips one at a time with a running total and rising intensity, and save the verdict for the end.

## 5. Light-input autobattles: Loop Hero, Hero's Hour, Monster Train, Backpack Hero

- **Loop Hero** began as a jam idea about zero-player games ([Inverse](https://www.inverse.com/gaming/loop-hero-interview)). The player controls gear, tiles and traits, and combat runs automatically until the player retreats or the hero dies. Four Quarters frames the player as a dungeon master placing just enough danger ([Destructoid](https://destructoid.com/?p=265570)). The retreat rule is the main live decision ([Twinfinite](https://twinfinite.net/guides/loop-hero-return-to-camp-how/), [LadiesGamers](https://ladiesgamers.com/loop-hero-review/)):
  - retreat at camp: keep 100% of resources;
  - retreat mid-loop: keep 60%;
  - die: keep 30%.

  The retreat decision gives the long automatic stretch its tension.
- **Hero's Hour** shows the spectator risk. You can position units and drag them a little during battle, "but neither of these measures make much of a difference." Spells are "the one significant managerial decision," and battles are decided "in a minute or two" ([Tech-Gaming](https://tech-gaming.com/heros-hour)). The developer pitches "or just sit back and watch" ([Goblinz](https://goblinzstudio.com/game/heros-hour/)).
- **Monster Train.** You place units on floors and cast spells. The enemy climbs each turn and combat resolves on its own ([KeenGamer](https://keengamer.com/articles/reviews/pc-reviews/monster-train-review-snowpiercer-meets-slay-the-spire-it-is-sinfully-fun), [PocketGamer](https://www.pocketgamer.com/monster-train/review/)). The pattern is: plan, then auto-resolve, then plan again.
- **Backpack Hero.** The packing puzzle (adjacency, permanent grid growth) is praised, but combat is called repetitive ([OpenCritic](https://opencritic.com/game/15870/-/reviews), [a-to-jconnections](https://a-to-jconnections.com/gaming/thats-my-purse-i-dont-know-you-a-backpack-hero-review)). Loadout alone does not carry a fight.
- **Community view.** Indie autobattler players complain of "just watching things happen" and "buy, place, watch." The fix most often suggested is a triggerable ability during battle ([itch threads](https://itch.io/post/12070570)). Front-loaded agency works in Super Auto Pets and old football-manager sims ([Skeleton Code Machine comments](https://www.skeletoncodemachine.com/p/magical-athlete/comments)).

## 6. Stats in events, and coins in card games: Death Road to Canada, Pokemon TCG

- **Death Road to Canada.** Characters have about ten stats, mostly 0–6, and personality and skills unlock extra event choices ([Nintendo Life interview](https://www.nintendolife.com/news/2018/03/feature_road_tripping_with_death_road_to_canadas_rocketcat_games), [GameCritics](https://gamecritics.com/aj-small/death-road-to-canada-review/), [Steam dev reply](https://steamcommunity.com/app/252610/discussions/0/3022387599803485163)). Players complain when a maxed character still fails a hidden check ([Steam](https://steamcommunity.com/app/252610/discussions/0/353916981469506585)). Who you send should unlock options, and hidden odds feel like betrayal.
- **Pokemon TCG coin flips.** Celebi ex's Powerful Bloom flips one coin per attached Energy, 50 damage per heads ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Celebi_ex_(Mythical_Island_3))). That is the "pool size = investment" pattern: build up, then flip. Bulbapedia notes heads is conventionally the good result, and some cards give a useful effect on both sides of the flip, such as Tangrowth's Plow Over ([Bulbapedia: Coin](https://bulbapedia.bulbagarden.net/wiki/First_Coin)). Pure-flip cards draw backlash, with Lucky Ice Pop called "an abomination" ([Wargamer](https://www.wargamer.com/pokemon-tcg-pocket/lucky-ice-pop-ruin)), and players track flips suspecting rigging ([Sportskeeda](https://www.sportskeeda.com/pokemon/pokemon-tcg-pocket-player-tracked-coin-flips-claim-game-was-on-hard-mode)).

## 7. Progress tracks: Ironsworn and Starforged

Ironsworn gives fights, journeys, bonds and vows the same move structure. Each roll is a d6 plus a stat against two d10 challenge dice ([Quest Portal](https://www.questportal.com/blog/what-is-ironsworn)):
- **strong hit:** beat both dice;
- **weak hit:** beat one die;
- **miss:** beat neither;
- **doubles:** amplify the result.

**Combat** ([rulebook, DOKK](https://dokk.org/library/ironsworn_starforged_rulebook_2019)):
- Enter the Fray sets each foe's rank and opens a progress track for your advantage.
- Strike, when you have initiative: strong hit inflicts +1 harm and you keep initiative. Weak hit inflicts harm and you lose initiative. Miss means Pay the Price and the foe takes initiative.
- Clash, when the foe has initiative: strong hit inflicts harm, you choose +1 momentum or +1 harm, and you take initiative. Weak hit inflicts harm and then you Pay the Price.
- Ending the fight is a separate decisive roll. A weak hit wins with a cost from a list, such as "Your victory is short-lived," "You suffer collateral damage," or "Others won't forget: you are marked for vengeance."

**Progress ranks** set how much each hit fills the 10-box track: Troublesome 3 boxes, Dangerous 2, Formidable 1, Extreme 2 ticks, Epic 1 tick ([DOKK](https://dokk.org/library/ironsworn_starforged_rulebook_2019)).

**Journeys** use the same shape. Undertake a Journey marks progress per waypoint, and a miss means "waylaid by a perilous event." Reach Your Destination is a progress roll. **Bonds** mark ticks the same way.

**Progress rolls** use no action die and ignore momentum. You roll the challenge dice against the number of filled boxes. Many small rolls build a track, and one final roll against what you built decides the outcome. Failure along the way costs harm, stress, supply or initiative, not the whole quest.

**Momentum** is a resource you can burn to upgrade a result ([Quest Portal](https://www.questportal.com/blog/what-is-ironsworn)).

This is the answer to "fights vs everything else": **one engine, many skins.** A fight, a chase, a negotiation and a ritual are all a ranked track plus one roll per move, with the approach deciding which stat and skill feed the roll.

## 8. A side note from Darkest Dungeon

Its stress and Affliction system expresses "heroes are human." The designers wanted you in situations "where you do not have complete control of your party" ([Game Developer, Road to the IGF](https://www.gamedeveloper.com/audio/road-to-the-igf-red-hook-studios-i-darkest-dungeon-i-), [GDC 2016 abstract](https://gdconf.com/news/come_to_gdc_2016_and_attend_a_)). In a squad game, partial loss of control reads as character, as long as the cause is visible.

---

## Implications for airaider

These are my proposals, built from the research. They go to the designer for rulings and will be tested in E-0003.

**Fights**
- **Drop "a test names one Fighting core."** Make each merc's equipped weapon a coin set, as in Limbus. The weapon decides which Fighting core feeds it (axe → Heavy Weapons, bow → Ranged). The core sets the coin count and a stat sets the base. The axe-user problem goes away because the test never names a skill: the merc's kit does.
- **Build fights from clashes, not one pooled test and not a free-running autobattler.** A clash is merc vs enemy intent: both flip, the loser loses a coin, re-flip until one side is out, and the winner's remaining coins hit. One exchange gives 3–8 flips with a readable arc: tug-of-war, break, payoff.
- **Telegraph every enemy action with a countdown,** Wildfrost-style and text-friendly ("Ghoul: Rend in 2, 6–14"). Show odds as words plus a percentage, using Limbus's tiers (Struggling / Even / Favored). Hide only the flips, never the odds.
- **Turn many flips into momentum with tracks, not one pass/fail.** Split enemy HP into stagger breakpoints, where a staggered enemy skips its next intent. The squad side gets a Harm/Morale track.
- **Make morale the heads chance,** around 50% plus or minus. Won clashes raise it and deaths lower it, and it is capped so most flips stay in the 40–75% band. Panic is a failure that leaves a mark.
- **Put the decisions between rounds, Monster Train / Loop Hero style.** After each round the player picks one of:
  - who faces which intent (swap a guard in);
  - Push: spend supply or grit to re-flip a merc's tails, the Slice & Dice reroll, gambly because you can lose;
  - fire one special skill;
  - Retreat with partial loot, a Loop Hero-style keep percentage that drops after a loss.

  Every flip then pays off a choice. No rounds play out with no input.

**Non-combat**
- **Use the same engine for non-combat, as Ironsworn does.** A guard, a ward or a debate is an obstacle with a ranked progress track and telegraphed intents ("Suspicion: alarm in 3"). The approach the player picks (talk, sneak, lore) decides which core supplies coins. The merc sent changes the coin source and unlocks options, Death Road-style.
- **Keep single coin tests for small beats** (one roll, Ironsworn-style strong / weak / miss). Use the full clash-and-track engine only for scenes with stakes.

**Outcomes and fairness**
- **Use a three-band outcome everywhere: strong, weak, miss.** A weak hit succeeds at a cost picked from a short list of lasting marks (injury, lost item, grudge, time), Ironsworn-style. A failure costs resources along the way, not the whole quest at once.
- **Don't stack random layers** (Dicey Dungeons). If coins are random, the enemy roster and intents should be readable, and the merc's coin set should be fixed per loadout.
- **Avoid compounding multipliers and negative coins** (the Limbus complaints). Cap the cascade, so one flip can lose a round but not the quest. Add a fairness floor (Luck be a Landlord): a total wipe on bad flips leaves a crawl-home outcome, not a dead end.
- **Give both sides of a coin something where you can** (Plow Over). On a tails, the AI's flavor line can describe a near miss that still shifts an intent or reveals info.

**Presentation and ownership**
- **Stage the reveal, Balatro-style, in text first.** One line per coin, a running total, rising intensity markers, and the verdict last. For example: `Brakka (axe 4+3x3): H H T -> 10 vs Ghoul 6+2x2: T H -> 8. Ghoul loses a coin.` The AI writes one tiny line at breakpoints only (stagger, break, kill, panic). This keeps text-UI parity and suits cheap models.
- **Make pool size a visible investment** (Celebi ex). Pre-fight choices such as gear, a buff, or pairing mercs who know each other add coins you can see. The player knows why the pool is big, so the swing feels owned.

Caveat: the shared web-search budget ran out partway through, so the Lonestar and Dicefolk mechanics rest on store copy and review snippets only. I found no developer statements on why Slay the Spire and Into the Breach show enemy intent.
