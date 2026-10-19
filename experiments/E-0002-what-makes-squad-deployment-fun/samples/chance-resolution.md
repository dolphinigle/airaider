# Chance resolution: can trait-modified rolls carry the fun?

Research agent 3 of E-0002 (dice, gambling, auto-battlers, design theory). Web research 2026-10-20.

**Context.** E-0001 run 1 resolved a quest as three coin rolls modified by a merc's traits, each with a one-line narration ("A bear appears! [roll: Strong +15, Swords +15 → 80%] Atlas defeats the bear."). It was watchable but flat: the player made no choice during the quest, and Atlas won 3/3. The question here is whether gambling-style resolution can carry the fun, and what separates exciting chance from flat chance.

**Source quality.** Designer quotes are marked as such. Where only reviews, wikis or forum posts were found, that is said. Several primary sources (GDC Vault videos, Slay the Spire intent rationale, Sultan's Game designer notes) could not be retrieved; claims about them are flagged as secondhand.

---

## Short answer

Watched chance can carry the fun, but in every loved example **the roll is the payoff of a decision, not a substitute for one.** None of the games below has a roll where the player had no hand in the odds, no stake in the outcome, and no surprise in the result. The common structure is:

1. **Commit** (choose who, what, how much to risk) while the odds are visible.
2. **Watch** the roll resolve, ideally as a short sequence that builds (Balatro's count-up, an auto-battle).
3. **Live with** a result that changes the next decision (a wound, a cost, a new option), never a result that merely reads "won" or "lost".

E-0001's walk had only step 2. The odds were also high enough (80%) that step 2 carried little suspense, and the results did not feed a later decision. That combination is what "watchable but flat" looks like.

---

## 1. Loved dice and chance games

### Sultan's Game (2025)
- **Mechanic.** A check rolls a pool of dice equal to the sum of the attributes the ritual lists, taken from the cards the player slots in. Each die is binary success/fail, and the outcome depends on the number of successes. Opposing characters subtract their attributes from your pool, and a pool of 0 usually means instant failure. Gold dice add a guaranteed success after the roll; rerolls re-roll the whole pool and "the new result must be used unless another Reroll is used." Red slots are required, white slots are optional, "usually for Intelligence cards that help the Check," and some items or followers "drastically change the outcome." ([Sultan's Game wiki, Ritual](https://sultansgame.wiki.gg/wiki/Ritual))
- **The decision around the roll.** *Which cards to commit* (each card spent on this ritual is unavailable for others within the seven-day deadline), and *whether to spend scarce rerolls and gold dice now*. A guide advises saving reroll consumables "for high-stakes skill checks" ([Magic Game World guide](https://www.magicgameworld.com/?p=128617)).
- **Feels good / bad.** The roll is the payoff of a commitment made under a deadline. Reviewers' complaints are about readability, not luck: "When you roll the dice, you have gold dice and potential re-rolls; however, the UI can make things a bit challenging to understand or execute" ([Boss Rush review](https://bossrush.net/2025/04/game-review-sultans-game/)).
- **Lesson.** The attribute sum is the player's input. Rerolls and gold dice are *post-roll* decisions, and they turn a bad roll into a choice ("spend the reroll or eat it?").

### Dicey Dungeons (Terry Cavanagh)
- **Mechanic.** Each turn you roll dice, then place them into equipment slots with constraints (even numbers only, max 3, and so on).
- **Decision.** Allocation *after* the roll, which is input randomness. Reviewers sum up the premise as "Here are some dice. Now, what do you want to do with them?" and "the numbers you get each round are random, but what you do with them is up to the player" ([GamingTrend review](https://gamingtrend.com/reviews/of-dice-and-decks-dicey-dungeons-review/)). Cavanagh credits his action-game background for the "snappy, responsive feel" ([Wireframe interview](https://wireframe.raspberrypi.com/articles/dicey-dungeons-terry-cavanagh-interview)).
- **Lesson.** The roll is the *start* of a puzzle, not the end of one. It is also fast.

### Slice & Dice (tann)
- **Mechanic.** Each hero has one die. You see the monsters' rolled actions first, then roll, then lock some dice and reroll the rest (limited rerolls).
- **Decision.** Keep or reroll, per die. Reviewers call this the press-your-luck hook ("tempting to continue rolling past a die face that you should keep") and say it feels fair because players can "influence the odds of getting different results" by levelling heroes and locking dice ([Ezra Szanton on output randomness](https://ezraszanton.substack.com/p/output-randomness-game-designers); [Thinky Games review](https://thinkygames.com/reviews/slice-and-dice-youll-just-keep-rollin/)).
- **Lesson.** One die per character, readable faces, enemy intent shown, and a lock-and-reroll choice. Very close to "one roll per merc", with the decision layer added.

### Dicefolk
- **Mechanic.** You roll your dice *and* control which of the enemy's rolled dice they use. One reviewer compares it to "playing chess all by yourself" ([God is a Geek](https://godisageek.com/reviews/dicefolk-review/)); others note you still "hope lady luck is on your side," which frustrates on bad rolls ([MP1st](https://mp1st.com/reviews/dicefolk-review-a-spin-of-the-dice)).
- **Lesson.** Giving the player a hand in *the threat's* roll turns enemy randomness into a decision.

### Balatro (LocalThunk)
- **Mechanic.** Pick cards to play, then watch each card and joker add chips and mult in turn, with the numbers ticking up.
- **Designer quote.** "The game is more fun when you set up your Rube Goldberg machine and watch it go." On a score preview: "If I add an option to have this score preview, people are just going to click on it" (Reddit AMA, quoted in [Aftermath](https://aftermath.site/balatro-the-long-dark/) and [Game Maker's Toolkit](https://gmtk.substack.com/p/balatros-cursed-design-problem)).
- **Critique.** Mark Brown: "The designer wants the excitement of a slot machine - but also the numerical predicability of an Excel spreadsheet" ([GMTK](https://gmtk.substack.com/p/balatros-cursed-design-problem)).
- **Lesson.** The *watching* is fun because the player *built* the machine. The suspense comes from a staged, step-by-step reveal of a result the player is responsible for. Holding back the final number until the count-up finishes is deliberate.

### Luck be a Landlord (Dan DiIorio / TrampolineTales)
- **Mechanic.** Spin a slot machine, and after each spin add a symbol. Symbols interact (cats with milk, bees with flowers), some destroy others, and rent comes due on a schedule ([Wikipedia](https://en.wikipedia.org/wiki/Luck_Be_a_Landlord)).
- **Decision.** Composition *between* spins, never during one. The spin is pure output, but its odds are the player's build.
- **Lesson.** Even a literal slot machine is loved once the player owns the distribution. Pocket Gamer called it "simple on the surface but full of depth" (via Wikipedia). Google Play banned it in 13 countries as simulated gambling, so the feel is unmistakably gambling.

### Blades in the Dark (TTRPG, John Harper)
- **Mechanic.** Before the roll, the GM sets **position** (controlled / risky / desperate: how bad failure will be) and **effect** (limited / standard / great: how much success achieves). The player can **push yourself** (take 2 stress for +1d or +1 effect) or accept a **Devil's Bargain** (+1d in exchange for a complication that happens regardless of the roll). "The Devil's Bargain is always a free choice" ([Roll20 BitD compendium](https://roll20.net/compendium/BITD/Action%20Roll); [BitD FAQ thread](https://community.bladesinthedark.com/t/bitd-rules-faq-clarification-reference-doc/1611)). Players can trade position for effect: "if they're going to make a risky roll with standard effect, they might instead want to push their luck and make a desperate roll but with great effect" ([bladesinthedark.com/effect](https://bladesinthedark.com/effect)). Results come in three bands: full success, success with consequences (4–5), and failure.
- **Decision.** *How much to spend and risk on this roll*, with stakes stated before the dice. Community GMs note that some players take many bargains and chase desperate positions while others rarely do, so risk appetite becomes characterization ([BitD forum, via search](https://community.bladesinthedark.com/t/bitd-rules-faq-clarification-reference-doc/1611)).
- **Lesson.** This is the cleanest model for "trait-modified roll + a decision". The traits set the base dice. The player chooses whether to buy more with a resource (stress = merc wear) or with a complication (story). The mixed result band is where most of the story comes from.

### Apocalypse World and PbtA (Vincent Baker)
- **Mechanic.** 2d6 + stat: 10+ success, 7–9 success with a "hard bargain, worse outcome, or ugly choice," 6- the MC makes a move ([Wikipedia](https://en.wikipedia.org/wiki/Apocalypse_World)).
- **Practitioner advice.** "If you can't specify a consequence, this means you shouldn't be rolling," and "everyone knows the possible outcome before the roll" ([Viridian Void, "Conquering the dreaded 7-9"](https://viridianvoid.bearblog.dev/conquering-the-dreaded-7-9/)).
- **Lesson.** Only roll when both outcomes are interesting. The middle band (*yes, but*) generates the most story per roll.

### Disco Elysium (ZA/UM)
- **Mechanic.** Active checks show the odds up front: "a window opens up to show your mathematical chances based on your skills and attributes." **White** checks can be retried after you level the skill or change something in the world; **red** checks are one-shot, "you roll with the result." The developers said "anticipating & designing interesting failure states are a key part of the design," and failures "update the state of the world in interesting ways" ([RPG Codex GDC 2017 preview](https://rpgcodex.net/article.php?id=11127)).
- **Feels good / bad.** Failure is loved because it branches instead of blocking: "failure at the hands of RNG ended up taking me down more interesting story paths" ([PC Gamer](https://pcgamer.com/why-i-love-failing-in-disco-elysium)). A Kurvitz quote circulates secondhand: "You never lose content because of failing, the content just becomes more miserable – and a lot funnier" (unverified; [Goodreads review blog](https://www.goodreads.com/author_blog_posts/22671066-review-disco-elysium)). Players do complain that "you will still fail a 90% 'success' roll" ([Steam thread](https://steamcommunity.com/app/632470/discussions/0/3758852249522256931/?ctp=3)).
- **Lesson.** Visible odds and a failure that is *its own content* make a roll worth watching either way. Red (one-shot) checks raise the stakes simply by being rare.

### Quacks of Quedlinburg and Can't Stop (push your luck)
- **Mechanic.** Draw or roll repeatedly, and stop whenever you like to bank your progress. Busting (an exploded pot in Quacks; no legal placement in Can't Stop) loses that turn's gains. Can't Stop is "the idea of 'push your luck' stripped of all nonessentials" ([The Thoughtful Gamer](https://thethoughtfulgamer.com/2022/07/11/cant-stop-review/); [Wikipedia](https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game))). In Quacks an exploded player chooses points *or* coins, not both, which softens the bust ([Quacks review](https://tbgd.blog/2019/10/30/quacks-of-quedlinburg-review/)).
- **Theory.** "They're about gambling. The thrill of potentially enormous success, and the devastation of losing it all" ([Magpie Games, GameTech: Push Your Luck](https://magpiegames.com/blogs/news/gametech-push-your-luck)). When the decision layer is thin, "you are basically left with a pretty generic roll and move game" ([Geeky Hobbies on Push Over](https://www.geekyhobbies.com/push-over-board-game-review-and-rules/)).
- **Decision.** *One more?* repeated, with rising risk, visible progress, and a running tally. Every roll is a decision, and stopping is a decision too.
- **Lesson.** This is the most direct fix for "a quest is a string of rolls": make *continuing* the choice. Interaction appears too: when a rival is near winning, players take bigger risks ([Geeks Under Grace on Can't Stop Express](https://www.geeksundergrace.com/tabletop/reviews-tabletop/review-cant-stop-express/)).

### Cultist Simulator (Weather Factory)
- Little open dice. Most outcomes are deterministic but opaque, and players experience the opacity *as* RNG ([Steam discussion](https://steamcommunity.com/app/718670/discussions/0/1728701877466577295)). Kennedy's goal was "a series of 'aha!' moments when you understand the secret laws of the world" ([MCV, "When We Made Cultist Simulator"](https://mcvuk.com/development-news/when-we-made-cultist-simulator/)).
- **Lesson (contrast).** Hidden rules feel like luck, and visible odds feel like a system you can master. If we want rolls to feel fair, show them.

### Death Road to Canada (Rocketcat)
- Random events check a survivor's stats, and personalities and skills are randomized. Reviewers praise the event writing and humor but note it "Needs a lot of LUCK" ([Sirus Gaming](https://sirusgaming.com/2018/05/08/death-road-to-canada-review)). Players complain about events failing despite maxed stats, which makes the choice "feel meaningless" ([Steam thread](https://steamcommunity.com/app/252610/discussions/0/3022387599803485163)).
- **Lesson.** This is the closest analogue to our quest walk (a car of characters, random events, stat checks, funny one-liners). Its main complaint is opaque checks that ignore the stat the player invested in. When a trait applies, it must visibly move the odds.

### Fire Emblem: displayed vs true hit
- From FE6 (*The Binding Blade*) to FE13 (*Awakening*), the game rolls two numbers and averages them, so a displayed 80% hits about 92% of the time and a displayed 10% about 2%. Later games use a hybrid: one roll below 50%, two at 50% and above ([Fire Emblem Wiki, True hit](https://fireemblemwiki.org/wiki/True_hit)). "This number is a lie, or at least a simplification to the point of lying" ([diplograph](https://diplograph.net/notes/games/randomness/lie-about-probability)).
- **Lesson.** Players read high odds as "should not fail" and low odds as "a hail mary". Games quietly bend the true numbers toward that reading.

### XCOM (Firaxis)
- Jake Solomon: "Players may view that number not from a mathematical sense, but from an emotional sense... If you see an 85 percent chance to hit, you're not looking at that as a 15 percent chance of missing... you think, 'That's close to a hundred; that basically should not miss.'" "We don't want the players missing multiple 85 percent shots, because then the game starts to feel punitive." "There's actually a number of things that tweak that number in the player's favor at the lower difficulty settings." And the counterweight: "If you shave off the lows, a lot of the time you're shaving off the highs." ([Game Developer, "Jake Solomon explains the careful use of randomness in XCOM 2"](https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i-)).
- Enemy Within's lead designer described a bad-streak breaker that grows stronger "the fewer soldiers you have" on Easy (via [Softpedia/Gamebanshee coverage](https://games.softpedia.com/blog/Lead-XCOM-Designer-Regrets-Fixed-Hit-Chance-Results-319573.shtml)). Modders document XCOM 2's hidden "aim assist" ([Nexus mod docs](https://www.nexusmods.com/xcom2/mods/482?tab=docs)).
- **Decision.** Positioning, flanking and cover before the shot. The shot itself is output randomness whose odds the player built.

### Slay the Spire intents (and Into the Breach, as contrast)
- Enemies show their next action. PC Gamer's Best Design 2019 credits "how transparent Slay the Spire makes information and enemy intents," which "stacks some certainty into each shuffle" ([PC Gamer](https://pcgamer.com/best-design-2019-slay-the-spire)). No designer statement on the rationale was found.
- Into the Breach goes all the way: "Part of our vision for Into the Breach is a push to be more deterministic in the moment-to-moment gameplay" ([PC Gamer preview](https://pcgamer.com/into-the-breach-preview)). Its one chance element, building Resist, exists so a lost run's last turns are "more palatable," and it is kept low so players don't rely on it. Justin Ma: "most take no issue with a 5% chance effect where the result is in their favor" ([Cliqist](https://cliqist.com/2018/03/06/into-the-breach-building-a-better-mech-with-subset-games-justin-ma/)).
- **Lesson.** Show the threat *before* the player commits. Low-odds rolls in the player's favor are free delight; low-odds rolls against them are resented.

---

## 2. Auto-battlers: why watching works there

| Game | What the player does | What is watched | Why watching is fun |
|---|---|---|---|
| **Super Auto Pets** | Buy, merge, order a line of pets | The pets fight automatically, front to back | Order and trigger chains produce swings the player set up: "the position of your pets within the team determines their attack order" ([PocketGamer](https://ee.pocketgamer.com/articles/084151/super-auto-pets-review-chill-auto-chess-game-with-deep-strategic-gameplay/)). Charm also helps: "never... did I imagine I'd thoroughly enjoy seeing an ant and an otter go head-to-head" ([Rubicon](https://www.rubiconline.com/?p=71188)). |
| **Teamfight Tactics** | Econ, rolls in the shop, positioning | Real-time auto combat | TFT's lead framed the goal as "tough choices, not touch execution" (Abecassis, GDC 2020, via [Pocket Tactics](https://www.pockettactics.com/teamfight-tactics-design)). Riot wants random effects "in positive and controlled spaces" (Set 1 learnings, via search). Reviewers praise it "despite frustrating RNG" ([PC Gamer](https://pcgamer.com/teamfight-tactics-basic-overview)). |
| **The Bazaar** | Build a board of items with cooldowns | Items fire automatically against a ghost | Reynad pitched it as "multiplayer Slay the Spire" with automatic combat ([Mobalytics](https://mobalytics.gg/the-bazaar/guides/what-is-the-bazaar)). The team went through 5–6 core revamps before the auto version felt "faster, more fluid, and more engaging" ([N-iX](https://gamestudio.n-ix.com/?p=12038)). |
| **Backpack Battles** | Arrange items in a grid for adjacency synergies | Cooldown-based auto fight | "Believes more in tinkering than reflexes" ([Destructoid](https://destructoid.com/?p=477833)). Reviews praise the building, not the watching. |
| **Loop Hero** | Place tiles along the hero's loop, equip, decide when to retreat | The hero walks and fights alone | Came out of talk about "Zero Player Games." The player is "basically play[ing] DM to your questing adventurer," adding danger to make the hero stronger without killing him. The only live decision is **retreat or continue**, a push-your-luck lever ([Destructoid](https://destructoid.com/?p=265570)). |
| **Soda Dungeon** | Recruit and gear a party, upgrade the tavern | The party auto-fights deeper | Idle appeal: "send them into a dungeon while I get up from my desk and do something else" ([GameLuster](https://gameluster.com/soda-dungeon-review/)). The fun is in the meta-loop (loot even on death, deeper runs), not the fights. |

**Why watching works in these games.**
1. **The watched thing is a test of the player's build.** Every swing reads as "my setup did that", or "my setup failed there, and I can see why".
2. **It is a cascade, not one coin.** Many small, legible events (triggers, procs, kills) build to a result the player could not quite predict. This is the Balatro count-up stretched over a fight.
3. **The outcome feeds straight back into the next build** (shop, gold, losses-left counter), so watching is also gathering information.
4. **There is one live lever when there is one at all** (Loop Hero's retreat), and it is push-your-luck shaped.
5. **Charm and speed.** Fights are short, readable, and characterful.

Soda Dungeon is the exception that shows the boundary: with no live decision, watching becomes something you walk away from. That is fine for an idle game and fatal for a game whose core moment is the quest.

---

## 3. Design theory

### Interesting decisions (Sid Meier)
Meier's GDC 2012 talk revisited his 1989 line that a game is "a series of interesting decisions" ([Game Developer video page](https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay)). The widely cited criteria, which are secondhand and not verified against the talk, say no option should be clearly best, options should not be equally attractive, and the player must be able to make an informed choice ([Antoine Buteau, "Lessons from Sid Meier"](https://www.antoinebuteau.com/lessons-from-sid-meier/)). Applied here: a roll with no choice before it fails the definition entirely. A roll at 80% where the alternative is obviously worse fails "no option clearly best".

### Players are not rational about odds (Sid Meier, GDC 2010)
In *Civilization Revolution* testing, players accepted losing at 2-to-1 odds but not at 20-to-10: "It's 20-to-10! I should win! It's a big number!" "To Sid (and math) there's no difference... but the player doesn't see it that way during the battle." "This lead to the realization that it cannot just be a math-based system." ([Game Informer](https://gameinformer.com/b/news/archive/2010/03/12/sid-meier-gamers-arent-logical.aspx)). Secondhand reports say the fix tilted combat so the stronger side won more often than the raw odds implied, by adding more rolls per battle (reduced variance) ([GDC 2010 coverage, Museum of Play](https://www.museumofplay.org/blog/gdc-2010-game-psychology-101/)). Players credit wins to their skill and losses to the game cheating.

### Input vs output randomness (Geoff Engelstein; Keith Burgun)
- "Input randomness is when something random happens before you make a decision. Output randomness is when something random happens after you make your decision." Input randomness is "a powerful way to make things feel fair"; output randomness is "harder to love," but it can "hold the player in a state of uncertainty until the last moment." Players also accept output randomness better "in the form of a visual process" ([Ezra Szanton, crediting Engelstein's GameTek](https://ezraszanton.substack.com/p/output-randomness-game-designers)).
- Burgun's hard line: output randomness is "noise injected between a player's choice and the result"; it "does not increase the depth of a game"; "what it actually does is obscure the outcome"; and "the only time you should use randomness of that kind is if you're making a gambling machine" ([Game Developer, "Randomness and Game Design"](https://gamedeveloper.com/design/randomness-and-game-design)).
- **Our position.** A quest roll is output randomness by construction. Burgun's exception ("a gambling machine") is roughly what we are proposing, which is honest but a warning. Every successful output-random game above pairs the roll with input decisions (build, commit, position) and post-roll decisions (reroll, push, retreat). The fix is to put a choice on both sides of the roll.

### Push-your-luck design
The tension comes from a bank-or-continue choice where each step raises both the reward and the bust risk, with progress visible and a clean stop rule ([Magpie Games](https://magpiegames.com/blogs/news/gametech-push-your-luck); [Meeple's Corner](https://meeplescorner.co.uk/blogs/boardgame-glossary/what-are-push-your-luck-games-everything-you-need-to-know-about-this-board-game-mechanic)). It fails when information removes the risk ("if you're too good at deducing where the enemies are, you're not pushing your luck anymore" — [Mr Magpie devlog](https://giantlight.itch.io/mr-magpies-harmless-card-game/devlog/944370/qol-better-hints-balance-changes)) or when the stop decision is trivial.

### Loss aversion, near misses, illusion of control
- **Near misses.** In Clark et al. (2009, *Neuron*), near-misses were "experienced as less pleasant" than full misses "but increased desire to play," and recruited win-related brain circuitry. The effect on motivation held only "when the participant had control over arranging the gamble" ([ScienceDaily summary](https://sciencedaily.com/releases/2009/02/090211122130.htm); [open-access paper](https://openaccess.sgul.ac.uk/id/eprint/368)). Showing *how close* a roll came, while the player had a hand in setting it up, multiplies the motivation to go again.
- **Illusion of control.** People act as if they control chance when "skill cues" are present (Langer); dice players throw harder for high numbers (Henslin, replicated at 4.1% harder for sixes in a 2025 Warwick study) ([Wikipedia, Illusion of control](https://en.wikipedia.org/wiki/Illusion_of_control); [Warwick](https://wrap.warwick.ac.uk/id/eprint/188285)). A player *triggering* the roll, even with a click, makes it feel more theirs.
- **Losing everything stings more than winning pleases.** That is why Quacks lets a busted player keep half, and why Into the Breach's Resist and XCOM's streak breaker exist.
- **Ethics note.** These are the same levers casinos use (Schüll's "machine zone", built for "time on device" — [Addiction by Design summary](https://muse.jhu.edu/book/61897)). Use them for drama inside a run, never to drive compulsive re-engagement, especially with no real money involved.

### XCOM-style hidden luck adjustment
Shown odds are often bent toward the player's intuitive reading (XCOM below Legend, Fire Emblem's 2RN). Players accept this when they don't notice it. Once it is exposed, players and modders treat it as a betrayal of the number ([Nexus "Show hidden aim assist" mod](https://www.nexusmods.com/xcom2/mods/212)). Solomon's caveat stands: shaving the lows shaves the highs.

### Fail forward
Failure should change the situation, not stall it: "something interesting happens that isn't what you wanted" ([EN World thread](https://www.enworld.org/goto/post?id=6784481)). PbtA's 7–9 and Blades' 4–5 are the mechanical version: success at a cost. Disco Elysium's version is failure as its own content.

### How many rolls, how fast
No rigorous source was found for "rolls per minute". The evidence is indirect: Dicey Dungeons' snappy feel (Cavanagh), TFT's goal of "tough choices, not touch execution", Balatro's cascades of dozens of tiny resolutions per hand, and Meier's finding that more rolls per battle made outcomes feel fairer by cutting variance. Pacing levers to tune in playtests:
- many small, fast, low-stakes resolutions that build into one big one
- fewer, heavier rolls where the player stops and decides
- never a long chain of identical rolls with no decision between them

### Making the player feel responsible for the roll
Across the sources, responsibility comes from:
1. The player assembled the odds (Sultan's Game slots, Luck be a Landlord, XCOM flanking, auto-battler builds).
2. The odds were shown before commitment (Disco Elysium, XCOM, Blades).
3. The player chose to take the risk, or to push it (Blades, Can't Stop, Loop Hero's retreat).
4. The player triggered the roll (illusion of control).
5. The result is explained in terms of what the player brought ("Strong +15 saved him").
6. The player has a post-roll lever (reroll, gold die, lock) that makes a bad roll a decision.

---

## 4. Principles for a quest made of trait-modified coin rolls

Each principle is stated for our case: a merc on a quest, a short series of rolls, a one-line narration per roll, and mechanics carrying the fun (D-0004).

1. **Put a decision before every roll, or cut the roll.** If the player can't change anything about a roll, it is narration with a number attached. At minimum: *who goes* (which merc's traits apply), *how* (pick the approach: fight the bear with Swords, or sneak past with Stealth), or *how much to spend* (push).
2. **Give a push lever on the roll itself (Blades).** Before or after seeing the odds, the player may buy +X% by paying something that matters later: merc stamina or wounds (stress), gold, an item, or a Devil's-Bargain complication that triggers either way. This one lever turns every roll into "how much do I care about this one?"
3. **Make the quest push-your-luck shaped (Can't Stop, Loop Hero).** After each encounter, choose *bank and return* (keep the loot so far) or *go deeper* (bigger rewards, higher risk, a fatigued merc). A three-roll quest with fixed length has no stopping decision; a quest the player can abort has one after every roll.
4. **Show the odds and the stakes before the roll.** "80% — on a fail Atlas is wounded and the bear takes the pack." The PbtA rule applies: if you can't name a failure consequence, don't roll.
5. **Three result bands, not two.** Success / success-with-cost / failure. The middle band is where the one-liner earns its keep ("Atlas kills the bear but loses two fingers. Swords −5 until healed."). Coin rolls can still give bands: roll 2–3 coins and count heads, or use margin-of-success.
6. **Failures must be content, not blanks (Disco Elysium).** A failed roll changes the squad state: a wound, a new trait ("Bear-scarred: Fear of Forests"), a lost item, a captured merc to rescue. That makes losing worth watching and feeds the base and squad layer.
7. **Results feed the next decision.** A wound from roll 1 lowers roll 2's odds and makes the push/retreat choice sharper. Rolls in a chain should change each other's odds; otherwise they are independent coin flips and boring to watch.
8. **Calibrate odds to the emotional band, not the math.** Players read 80% as "certain" (Solomon, Meier). Keep most stakes-bearing rolls at 40–75% displayed, so both outcomes are live. Reserve 85%+ for "routine" rolls whose point is a cascade, and long shots (5–25%) for player-chosen hail marys, where success is pure delight (Ma).
9. **Bend streaks quietly in the player's favor, if at all.** A soft bad-streak breaker (XCOM, Fire Emblem 2RN) for disastrous runs is fine. Never make the displayed number a lie on single high-stakes rolls; once found out, it destroys trust in every number.
10. **Traits must visibly matter.** The breakdown line ("Strong +15, Swords +15 → 80%") is the right instinct; Death Road's main complaint is stats that seem ignored. Show which trait swung it in the result line too ("Swords saved him").
11. **Stage the reveal (Balatro).** Resolve a roll as a short sequence: odds shown, coin(s) flip one at a time, the margin shown ("needed 3 heads, got 2 — so close"), then the one-liner. Near-misses shown visibly drive "go again", and near-misses only motivate when the player arranged the gamble.
12. **Let the player own the trigger and the post-roll save.** The player presses "roll". Scarce rerolls or gold coins (Sultan's Game, Slice & Dice) let a bad roll become a choice: "spend my only reroll here?"
13. **Squad, not solo.** Several mercs on a quest create the richest pre-roll decision: who takes this encounter? That is the Slice & Dice / Dicefolk structure (one die per hero, the player allocates) and the core of a *squad* game.
14. **Keep rolls fast and frequent, decisions sparse but real.** Many quick rolls with no stop-and-think in between become a slot machine. Aim for a decision every one or two rolls, and make no-decision rolls instant.
15. **Win rate is a design knob.** 3/3 wins is flat by construction. A quest the player could plausibly lose, with a loss that is a story beat, is what makes the 80% roll tense.

---

## 5. Failure modes

| Failure mode | What it looks like | Source / evidence | Fix |
|---|---|---|---|
| **Spectator mode** | Player watches rolls they had no hand in | E-0001; Burgun: output randomness "obscure[s] the outcome," fit only for "a gambling machine" | A decision before or after every roll (principles 1–3) |
| **Foregone conclusion** | High odds plus a high win rate (80% → 3/3) | Solomon: "85 percent... basically should not miss"; Meier 20-to-10 | Display 40–75% on stakes rolls; real chance to lose (8, 15) |
| **Binary blank failure** | "Atlas loses. Quest failed." Nothing changes | Disco Elysium: failure states as designed content; PbtA: "if you can't specify a consequence... you shouldn't be rolling" | Mixed band plus failure-as-state-change (5, 6) |
| **Independent coin chain** | Rolls don't affect each other, so each is the same flip | Push-your-luck theory: tension needs accumulating risk | Wounds and fatigue carry over; bank-or-continue (3, 7) |
| **Ignored trait** | Maxed stat, still fails, and it's unclear why | Death Road to Canada Steam complaints | Show the modifier math and credit the trait in the result (10) |
| **Feels-bad streaks** | Several 80% failures in a row, the run collapses | XCOM: "starts to feel punitive"; Meier on players blaming the game | Quiet streak breaker and soft-fail bands; don't lie on single rolls (9) |
| **Exposed lie** | Player finds displayed odds ≠ real odds | XCOM aim-assist mods; Fire Emblem "a lie" | Bend variance (more coins, best-of), not the shown percentage |
| **Opaque system** | Players can't tell what changes the odds, so it reads as random | Cultist Simulator opacity read as RNG; Sultan's Game UI complaints | One readable breakdown line per roll |
| **Slot-machine drift** | Many fast rolls, no decisions, compulsive "again" | Schüll's "machine zone"; Burgun's gambling-machine remark | Sparse but real decisions, plus ethics: no meta-compulsion levers |
| **Thin push-your-luck** | The stop/continue choice is obvious, so it's roll-and-move | Push Over review; Mr Magpie devlog | Asymmetric rewards for going deeper, and a visible, rising bust risk |
| **Narration carrying the fun** | The one-liner is the only interesting part | D-0004; v3 storyteller lab | Judge each roll with the text removed: is the decision still interesting? |
| **Shaving lows shaves highs** | Over-smoothed luck kills the memorable upsets | Solomon: "If you shave off the lows... you're shaving off the highs" | Keep real variance on player-chosen long shots |

---

## 6. Bottom line for E-0002

Gambling-style resolution **can** carry the fun. Luck be a Landlord, Balatro, Can't Stop and Slice & Dice are all loved, and all are gambling at heart. But in each one the fun lives in the player's hand on the odds (build, commit, push, stop, reroll), and the roll is the payoff. Our quest walk keeps its rolls and one-liners, and adds:

- a choice of *who / how* per encounter
- a *push* lever paid in merc wear or a complication
- a *bank-or-go-deeper* stop after each roll
- three result bands, where failure changes the squad
- odds tuned so the outcome is genuinely in doubt

That is the cheapest change that turns "watchable but flat" into "watchable and mine".
