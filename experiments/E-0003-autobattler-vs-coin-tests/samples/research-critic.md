# Completeness critique: autobattler fights vs coin tests

*Method note: the shared web-search budget ran out partway through this pass, so some of the later checks below rest on direct page reads.*

## 1. Contradictions between the reports, and how they resolve

**C1. Griftlands: which mode does the game favour?**
- The unified-conflict report (citing the Klei forums) says negotiation "was safer and paid better," so players had little reason to fight.
- The player-sentiment report (citing PC Gamer) says the reverse: building for combat is the easier path.
- **Resolution: both are true, at different levels.** Within a single encounter, talking is safer and pays better. Across a run, the few fights you cannot avoid punish a deck built for negotiation. PC Gamer's final review concludes that combat decks are "the easier path" ([PC Gamer](https://pcgamer.com/griftlands-review)). TechRaptor also calls negotiation "much more tactical" while late fights "feel unwinnable" ([TechRaptor](https://techraptor.net/content/griftlands-preview)).
- **What it means for airaider:** the trap is the combination of an optional mode that pays well and a forced mode that kills. If fights are compulsory and talk is optional, Talk cores become a trap, whatever each encounter pays.

**C2. "Most games split fights from everything else" (squad-games) vs "the good ones run one core" (unified-conflict).**
- **Resolution: the two reports looked at different kinds of game.** Squad-games surveyed video games. Unified-conflict surveyed mostly tabletop RPGs.
- **Tabletop unification depends on a GM.** In Blades, the GM judges whether an action fits by setting position and effect ([SRD](https://bladesinthedark.com/action-roll)). airaider has no GM, so "fit" has to be encoded in data: approach lists, tags and matchups.
- **Video games do unify the roll itself.** Sultan's Game uses rituals for fights as well. For The King uses its slot roll for attacks and for event checks (§2a). Disco Elysium resolves fights with red checks.
- **The part that transfers:** one roll primitive, wrapped in structures of different weight.

**C3. Should fights be an autobattler, a Torchbearer-style conflict, coin rounds, or Limbus-style clashes?** (autobattlers vs unified-conflict vs squad-games vs dice-combat)
- **This is smaller than it looks.** All four propose fights made of several exchanges resolved with coins, with player decisions at the seams. They differ only on how often a decision comes: every round (squad-games, unified-conflict) or only at checkpoints, with at most one interrupt (autobattlers).
- **The tie-breaker is text play.** The MUD lineage (§2c) shows a fully automatic, blow-by-blow fight that players can still steer through a standing retreat rule.

**C4. Should non-combat use the same engine as fights?**
- Dice-combat (Ironsworn) and player-sentiment say yes. Autobattlers says no: "don't autobattle them."
- **Resolution: they agree on the primitive and differ on structure.** Fate (overcome, challenge, contest, conflict), Burning Wheel (simple test, Bloody Versus, Fight!) and Ironsworn all use the same dice. They use a single roll for small beats and a track or structure for scenes with stakes. Nobody in any report wants stealth run as a free-running simulation.

**C5. Darkest Dungeon retreat odds** (squad-games).
- **Verified:** retreat succeeds 70% of the time on the first try, +5% per later try, and costs 25 stress before modifiers ([wiki.gg](https://darkestdungeon.wiki.gg/wiki/Retreating)).
- **Missing nuance:** in the final Darkest Dungeon quest, retreating kills a random party member ([fandom](https://darkestdungeon.fandom.com/wiki/Darkest_Dungeon_(location))).
- **Darkest Dungeon II** did remove fleeing mid-battle ([Fextralife](https://darkestdungeon2.wiki.fextralife.com/Combat)). In its place you can avoid a fight from the pre-combat screen, where heroes gain or lose affinity over the choice. Players argue that choosing your map path now carries the push-your-luck decision ([Steam](https://steamcommunity.com/app/1940340/discussions/0/4434444088611201975)).
- **Lesson:** the retreat decision can move up from the fight to the route, but players still noticed that it was gone.

**C6. Gratuitous Space Battles** (autobattlers says Harris patched in control; squad-games presents the game as purely hands-off).
- **Verified:** version 1.60 (2012) added optional mid-battle orders in single-player only. Campaign and online battles stayed hands-off ([Positech blog](https://positech.co.uk/cliffsblog/2012/09/14/gratuitous-controllable-battles-yes-really), [PC Gamer](https://www.pcgamer.com/uk/gratuitous-space-battles-patch)).
- **Using the orders costs something.** A GameSpot user review says they disable honor and endless-mode scoring. It adds that the orders work like deployment orders, not RTS micro ([GameSpot](https://www.gamespot.com/gratuitous-space-battles/user-reviews/2200-12607644/)).
- **Lesson:** even the designer who made "no control the main mechanic" added an override, and he priced it.
- **Unverified source:** I could not confirm squad-games' "Old Light" citation, so treat it as unconfirmed.

**C7. Disco Elysium combat** (unified-conflict cites the 2018 devblog as if it describes the shipped game; player-sentiment says combat existed "pre-launch").
- **Resolution:** the shipped game has "only a handful" of "half-scripted, pseudo turn-based, set piece" fights, resolved as Hand/Eye Coordination and Reaction Speed red checks ([GameBanshee](https://www.gamebanshee.com/k4684)).
- **So:** it is evidence that a fight can work as a chain of checks for rare, authored scenes. It is not evidence that the same approach scales to a fight system you repeat every session.

## 2. Gaps, and the three researched

**Not covered by any report:**
- For The King: a unified slot roll.
- Renowned Explorers: talk as an attack type inside one encounter engine.
- MUD auto-combat: an autobattler that is pure text.
- Coin-pool probability math for airaider's own model.
- Football Manager and OOTP: text match engines with highlight levels.
- inkle's Sorcery!: combat as a narrative bet.
- Cultist Simulator expeditions: obstacles that ask for aspects.
- Star Traders: Frontiers: crew job checks.

I researched the first three because each answers part of the brief directly: one unified engine, talk inside fights, and text-first autobattles. I also computed the coin-pool math myself.

### 2a. For The King: the closest commercial match to airaider's coin pool
- **How the roll works:**
  - An action has N slots. Each slot is a separate roll whose success chance is the stat as a percentage, capped at 95.
  - If every slot succeeds, the roll is "perfect" and can crit ([wiki: Gameplay](https://fortheking.wiki.gg/wiki/Gameplay)).
  - If only some succeed, the result is weaker: "in many cases you will get reduced damage" ([Steam](https://steamcommunity.com/app/527230/discussions/0/1368380934279478072)).
- **Focus is the "push" lever.** One point guarantees one slot and raises the chance on the remaining slots by +10/15/17/19% as more slots are filled. You can spend it "whenever the player is offered an option to make a skill roll," which includes events ([wiki: Focus](https://fortheking.wiki.gg/wiki/Focus)).
- **One roll serves both combat and events.** A slot roll is still a slot roll whether you are swinging at a monster or facing an event check.
- **Two lessons for airaider:**
  - **Compounding hides the real odds.** Three slots at 85% each give only about 61% for a perfect roll, and players argue about whether the game is fair ("you need data, not individual anecdotes") (same thread).
  - **A spendable resource that makes one coin certain is a proven way to push your luck.**

### 2b. Renowned Explorers: talk inside the fight engine, not a parallel game
- **How encounters work:**
  - Every encounter offers three attack types: aggressive (combat), devious and friendly (speech) ([Quarter to Three](https://www.quartertothree.com/fp/?p=36561)).
  - Actions push a global mood with rock-paper-scissors modifiers. For example, acting devious against an aggressive opponent raises your evasion ([Game Developer](https://www.gamedeveloper.com/design/the-combat-of-renowned-explorers)).
  - The encounter's dominant mood changes what you get from it. Being aggressive or devious toward a nun can permanently debuff the religious members of your party, and hired specialists add rewards that depend on the mood (Game Developer).
- **Who you brought changes the fight:**
  - Each character's kit matters: one can turn the encounter friendly with "Peace Treaty," another makes targets vulnerable to speech.
  - Each enemy has its own lean: an abbess "gets stronger" the more aggressive you are with her (Quarter to Three).
- **It drew the same first complaint as Griftlands and got past it.** The reviewer started with "You just changed the names of stuff," the same reskin charge Griftlands faced, yet ended by calling encounters "the most gratifying part."
- **Why it worked where Griftlands was criticised:** you choose the mode *inside the same encounter*, the approaches mix, and the outcome is graded by the dominant mood instead of a bare win or loss.
- **For airaider:** Talk and Magic cores can be fight moves that steer a shared morale track, without a separate engine.

### 2c. MUD auto-combat: decades of text-playable autobattles
- **Fights run on their own.** "Fights continue automatically in MUD, blow by blow, until either party dies or flees" ([MUSE help](https://mud.co.uk/muse/q18.htm)).
- **Fleeing has a price.** FLEE drops your carried items and sends you in a random direction. Its points cost scales with your remaining stamina, and fleeing at 5% or under costs nothing. Timing is risky, because another exchange can land before the flee takes effect (same page).
- **Wimpy is a standing rule set before the fight.** Below a chosen HP threshold the game attempts to flee automatically and keeps trying until you escape. A berserk mood makes fleeing impossible ([MUME wimpy](https://mume.org/help/wimpy)).
- **Lesson:** a text autobattle stays owned when the player sets the push-or-retreat rule beforehand, as a per-merc threshold or temperament. That is Loop Hero's retreat valve turned into a pre-commitment, and it can be played entirely as text.
- **Fit with airaider's squad:** Darkest Dungeon-style traits (a berserk merc who will not flee) turn that rule into character.

### 2d. Coin-pool math (my own computation, at a 50% heads chance)

| Heads needed | 3 coins | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|
| 2 | 50% | 69% | 81% | 89% | 94% | 96% | 98% | 99% |
| 3 | 12% | 31% | 50% | 66% | 77% | 86% | 91% | 95% |
| 4 | 0% | 6% | 19% | 34% | 50% | 64% | 75% | 83% |

- **The target band is only about two coins wide.** At a fixed threshold, the 40–75% band covers roughly two pool sizes, and each extra coin moves the odds by 11–16 points.
- **Pools can easily overshoot it.** A pool built from 1–3 stats plus a core will often land outside the band unless pools stay small or difficulty raises the heads needed.
- **Chains collapse the odds:**

| Chain | 65% per test | 70% per test |
|---|---|---|
| 3 of 4 tests | 56% | 65% |
| 5 of 6 tests | 32% | 42% |

- **This confirms the ~65% pivot from D&D 4e skill challenges.** A fight made of several exchanges compounds in the same way.

## 3. The eight strongest cross-report conclusions

1. **A fight test should never name one weapon core. The merc's wielded weapon picks it.**
   - Reports: all five.
   - Sources: Battle Brothers, Kenshi and Stoneshard (squad-games); Limbus coin sets (dice-combat); Sawyer's "useful to every character that invested" (player-sentiment).

2. **Resolve fights over several coin exchanges with decisions at the seams, not as one pooled test and not as a zero-input simulation.**
   - Decisions sit before the fight, between short rounds, and at a priced exit.
   - Keep fights to 3–6 exchanges, hard-capped, with few actors and a one-line cause per swing.
   - Reports: autobattlers (Loop Hero, Ogre Battle, Fatigue and Sandstorm caps); squad-games (CK3 duels, Banner Saga stances); dice-combat (Limbus, Monster Train); player-sentiment (front-loaded agency, "too long and too opaque").
   - New here: MUD rounds plus wimpy.

3. **One coin primitive everywhere, with structure scaled to the stakes.** A single test for small beats; a track or several exchanges for scenes with stakes.
   - Reports: unified-conflict (Fate, Burning Wheel, Blades); dice-combat (Ironsworn); player-sentiment (Griftlands' "two different games").
   - New here: For The King's slot roll in combat and events.
   - Autobattlers' "don't autobattle non-combat" is compatible with this.

4. **Non-combat cores must act inside fights, as moves on a second track** (morale, mood, enemy coins), or they become a tax.
   - Reports: autobattlers (CK3 insults, Legend of Keepers morale); unified-conflict (Savage Worlds Tests, Torchbearer's per-action skills); player-sentiment (D&D "tax," Griftlands trap); C1 above.
   - New here: Renowned Explorers.

5. **Retreat is always available, always priced, and tiered.**
   - Reports: autobattlers (Loop Hero 100/60/30, Ogre Battle); squad-games (Darkest Dungeon's 70% retreat and 25 stress; Darkest Dungeon II's removal drew complaints); player-sentiment (Battle Brothers players: retreating "will cost you a lot to heal your boys up").
   - New here: MUD flee costs and wimpy; Darkest Dungeon II moving the decision to path choice.

6. **Show true odds and their factors before the commit, and odds at the quest level, not just per test. Hide only the flips, revealed one at a time.**
   - Reports: dice-combat (Limbus forecast tiers, Balatro staging); squad-games (Empires in Ruins visible sums; Total War's fake uncertainty band; Dispatch's hidden requirements); unified-conflict (the 4e ~65% pivot); player-sentiment (Fallen London "chancy").
   - New here: For The King's 85% × 3 = 61% fairness disputes; the chain table in §2d.

7. **Failure is graded and leaves a mark. It is never "nothing happened" and never a dead end. Knowledge feeds the next roll instead of gating progress.**
   - Reports: unified-conflict (Blades' five consequence types, GUMSHOE, Fate's create-an-advantage); dice-combat (Ironsworn's weak hit at a cost, Luck be a Landlord's fairness floor); player-sentiment (BG3's "failure is content," Pathfinder 2e weakness reveals, the "net zero" lore roll); squad-games (Mordheim injuries, XCOM ambushes).

8. **Who you sent should change the options and matchups, not just the size of the pool.** Use enemy tags that make different cores valuable, and roster tags that unlock approaches.
   - Reports: autobattlers (the Lich ignoring Defense; Ogre Battle liberation by charisma); squad-games (Battle Brothers backgrounds, Wildermyth casting, Mass Effect 2 role slots, "only if Krumr"); unified-conflict ("can your trader fight?", Darkest Dungeon curios); dice-combat (Death Road to Canada).
   - New here: Renowned Explorers' character kits and enemy-specific mood leanings.
