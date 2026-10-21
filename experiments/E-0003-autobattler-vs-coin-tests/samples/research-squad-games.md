# How squad and dispatch games handle combat skills, autoresolve and non-combat checks

## Summary

- **No game in this survey makes a fight check name one weapon skill.** Weapon-specific skills appear only inside a full combat simulation. There, the weapon the character is holding decides which skill applies (Kenshi, Stoneshard, Battle Brothers masteries, Wartales classes). Abstract resolvers use one broad combat number instead (CK3 Prowess, Dispatch "Combat", Sultan's Game "Combat", ME2's per-character defence value).
- **Most games split fights from everything else.** Fights get a richer resolver, usually tactical. Non-combat challenges get text events, and what changes those events is *who is present*, more than any number.
- **Players mostly dislike autoresolve.** The complaints repeat across Total War, Bannerlord and Wrath of the Righteous: you can't see why it decided what it did, it values some stats wrongly, it inflicts losses in lopsided fights, and its odds displays are wrong.
- **Hands-off resolution works when the player's choice is the thing being judged.** ME2's suicide mission, Banner Saga's war stances, Gratuitous Space Battles' fleet design, Loop Hero's tile placement and CK3's per-round duel cards all do this.
- **Non-combat checks pick their skill in five main ways:**
  1. A fixed attribute pair on the challenge (Sultan's Game).
  2. Assigning a person to a role (ME2, Kingmaker advisors).
  3. How well a hero's stat shape covers the call's needs (Dispatch).
  4. Which hero you pick to interact (Darkest Dungeon curios).
  5. Options unlocked by background or personality (Battle Brothers, Wildermyth).

---

## 1. How combat skill is represented

### Battle Brothers: one generic skill, plus weapon perks and gear
- **One Melee Skill covers every melee weapon.** Battle Brothers has no per-weapon skill. Raising melee skill "will increase accuracy with all weapons" ([Steam](https://steamcommunity.com/app/365360/discussions/0/3153060475180161988)).
- **Weapon type works as a modifier, not a check.** Spears give +20 to hit and swords +10, while "axes and maces have no hit chance bonus" (same thread).
- **Weapon perks are masteries picked at level-up.** Each one gives 25% less fatigue on that weapon's skills plus a special effect. Mace Mastery makes Knock Out a 100% stun; Hammer Mastery does 33% more damage to armour ([fan wiki](https://battlebrothers.fandom.com/fr/wiki/Perks?oldid=1647), [Steam](https://steamcommunity.com/app/365360/discussions/0/350542145694088354)).
- **Backgrounds set stat ranges; stars set growth.** Each background sets the range of starting stats, and "stars (talents)" set how much a stat grows per level ([Steam](https://steamcommunity.com/app/365360/discussions/0/1607148447822206442)).
- **Hit chance adds up many terms.** It is additive and clamped to 5–95%. Flanking adds +5 per adjacent ally, height +10, and shieldwall stacks onto the defender's defence ([Steam](https://steamcommunity.com/app/365360/discussions/0/1319961618830969791)).
- **In short:** a fight comes from stats, gear, position and perks. Nothing asks "roll Axe."

### RimWorld: two broad combat skills, scaled by body and gear
- **Only two combat skills exist,** Shooting and Melee. Players note that "shooting skill is not even the largest factor in shooting accuracy" ([Steam](https://steamcommunity.com/app/294100/discussions/0/3958162152962814765)). Weapon, distance, cover and body parts carry much of the weight.
- **Non-combat work uses the same composite style.** Surgery success = surgeon's Medicine skill × Manipulation (100% weight) × Sight (40%) × the bed/room factor × medicine potency × operation difficulty. Failure never drops below 2% ([RimWorld wiki](https://www.rimworldwiki.com/wiki/Surgery_Success_Chance)).
- **Raids are pressure on the colony.** Tynan said he wants raids to apply pressure without feeling like an RTS or a turn-based game ([Ludeon forum](https://ludeon.com/forums/index.php?msg=421572)).
- **Raid size follows colony state.** The storyteller turns colony wealth and pawn count into "raid points," and an adaptation factor eases off after colonists are downed or killed ([wiki](https://rimworldwiki.com/wiki/Raid_points), [storytellers](https://rimworldwiki.com/wiki/Storyteller)).

### Kenshi: skill per weapon class, but the weapon in hand decides which one counts
- **Fights run in real time, with pause.** Players control them through stances such as Hold, Taunt and block-only (block-only gives +20 melee defence) ([Steam](https://steamcommunity.com/app/233860/discussions/0/1640926712930142725), [wiki](https://kenshi.fandom.com/wiki/Loading_Screen)).
- **Skills grow by use.** Getting beaten up trains defence and Toughness, and stronger opponents train you faster ([wiki](https://kenshi.fandom.com/wiki/Loading_Screen), [GameSkinny](https://www.gameskinny.com/tips/how-to-become-a-competent-fighter-in-kenshi/)).
- **Weapon-class skills appear only through equipment.** A Katana user trains and uses the Katana skill because they hold a katana; no check ever asks for it.
- **Stealth and thieving work the same way.** These are separate skills trained by doing them, and some outcomes blend skills: sneak-disarm uses Thievery and Stealth together ([Nexus](https://www.nexusmods.com/kenshi/mods/2028)).

### Stoneshard and Wartales: the weapon decides your abilities
- **Stoneshard has one skill tree per weapon type** (8 abilities for one-handed weapons, 10 for two-handed) ([GameBanshee](https://gamebanshee.com/3wppy)). Matchups give the choice meaning: "Maces are good for Undead… Swords against Living… Axes against shields" ([Steam](https://steamcommunity.com/app/625960/discussions/0/599641410463919699)).
- **Wartales ties class to weapon family** (Brute, Swordsman, Spearman, Archer, Ranger) ([Gamepressure](https://www.gamepressure.com/S013-amp.asp?ID=21565)).
- **Wartales keeps non-combat work in separate professions** with five ranks; some are mini-games ([GameSkinny](https://www.gameskinny.com/tips/wartales-professions-guide/)).

### Games that resolve fights abstractly use one broad combat number
- **CK3: duels use Prowess.** It decides which move "cards" you draw each round. If four rounds end without a winner, the character with higher prowess wins ([PCGamesN](https://pcgamesn.com/crusader-kings-3/duel-system)).
- **Dispatch: Combat is one of five stats** (Combat, Vigor, Mobility, Charisma, Intellect), each rated 1–10 ([guide](https://progameguides.com/guides/dispatch-characters-tier-list/)).
- **Sultan's Game: Combat is one of eight attributes,** alongside Physique, Survival, Stealth, Charisma, Sociability, Wisdom and Magic. Checks pair them, for example "Physique/Combat" or "Physique/Survival" ([Steam notes](https://steamcommunity.com/app/3117820/discussions/0/604153852924567547)).
- **Mass Effect 2: each character has a fixed defence value for "hold the line."** Garrus, Grunt and Zaeed are strongest; Jack, Kasumi, Mordin and Tali weakest. Disloyal squadmates die first ([RPGSite](https://www.rpgsite.net/feature/11118-mass-effect-2-suicide-mission-choices-how-to-make-sure-everyone-lives-to-get-the-best-ending)).

**Pattern:** games either simulate the fight and let the loadout choose the skill, or they collapse "can fight" into one number. None of them makes a narrow weapon skill the gate for a fight.

---

## 2. How games split combat from other challenges

**A. Tactical fights, plus text events where who is present matters.**
- **Battle Brothers.** Fights are full turn-based tactics.
  - Events change with the roster: "thieves can steal maps you normally would have to buy" ([Steam](https://steamcommunity.com/app/365360/discussions/0/1734343428038224574)).
  - Some events need a particular background, or a pair such as "Graverobber + historian." Monks are known for solving "interpersonal problems" ([Steam](https://steamcommunity.com/app/365360/discussions/0/2595630410176362588)).
  - Background also shows up in combat behaviour: "a former court jester will be much more likely to run away" ([KeenGamer](https://www.keengamer.com/articles/reviews/battle-brothers-review/)).
- **Wildermyth.** Combat is XCOM-like tactics. Events *cast* heroes into roles by personality score.
  - "Before the Fall" needs a Proud hero, a coward who is friends with them, and a hothead. Each choice is phrased around a named hero ("If [Name] says they know where they're going, I trust them"), and the outcome changes relationships ([wiki](https://wildermyth.com/wiki/Before_the_Fall)).
  - Casting works by `PICK_BY_SCORE` with thresholds. If no hero qualifies, the event cannot fire ([modding wiki](https://wildermyth.com/wiki/Modding_encounter_choice)).
  - Stronger traits can shift odds of success ([PressReader](https://www.pressreader.com/usa/arkansas-democrat-gazette/20210823/282857964001559)).
  - Reviewers still call the combat "a bit SRPG-lite" and repetitive after one campaign ([RPGSite](https://rpgsite.net/review/12107-wildermyth-review)).
- **Darkest Dungeon.** Curios are mostly optional. You choose *which hero* interacts and which provision to spend, and the right provision "cleanses" the curio for a better result ([guide](https://gameslikefinder.com/article/darkest-dungeon-curio-guide/)).
  - Class matters too: antiques drop "only when [the Antiquarian] is the one who interacts" ([wiki.gg](https://darkestdungeon.wiki.gg/wiki/Curio)).
  - Quirks can take the choice away. A Kleptomaniac may loot the curio before you get to decide.
- **Banner Saga.**
  - **Wars:** you choose one of about five stances: lead the fight yourself (a tactical battle), form a battle line, hold them off, oversee, or retreat. The outcome compares your numbers with the enemy's under that stance ([GameBanshee review](https://www.gamebanshee.com/4w94)).
  - "Hold them off" gives the easiest battle but heavy caravan casualties ([Steam](https://steamcommunity.com/app/237990/discussions/0/616187839410345664)).
  - **Travel events:** some options exist only if a particular hero is in the caravan, for example "Morale +5 (only if Krumr is in caravan)" ([TrueAchievements](https://i1.trueachievements.com/game/The-Banner-Saga/walkthrough/8)).
- **Mordheim.**
  - Tactical skirmishes, then post-battle injury rolls. Injuries stack and can retire a hero, and treatment costs gold ([TheSixthAxis](https://www.thesixthaxis.com/2016/02/03/mordheim-city-of-the-damned-review/)).
  - Rout tests begin once 25% of the warband is down.
  - Exploration is "rolling on big tables."
  - Reviewers complain about "too many random die rolls" ([RPGamer](https://archive.rpgamer.com/games/mordheim/mordheim/reviews/mordheimstrev1.html)).

**B. One simulation covers everything.** RimWorld and Kenshi run fights and work in the same real-time system. Skills are just inputs to the simulation. That works for a colony sim, but it needs real-time control and is not text-playable.

**C. Dispatch and assignment: choosing who is the whole decision.**
- **Mass Effect 2's suicide mission** is a list of roles with suitable candidates:
  - Tech specialist: Tali, Legion or Kasumi. Biotic: Jack or Samara.
  - Fireteam leader: Garrus, Jacob or Miranda. If this leader isn't loyal, *the tech specialist* dies.
  - Missing ship upgrades kill specific people.
  - Sources: [RPGSite](https://www.rpgsite.net/feature/11118-mass-effect-2-suicide-mission-choices-how-to-make-sure-everyone-lives-to-get-the-best-ending), [Wikipedia](https://en.wikipedia.org/wiki/Suicide_Mission_(Mass_Effect_2)).
  - Critics called it "intense" because "anyone can die." Kotaku suspected the high survival rates came from flowcharts and save-scumming. Once the rules were readable, the outcome became mostly deterministic.
- **Dispatch:**
  - **Pooling and odds.** Several heroes' stats pool against a call's requirement shape. Easy calls reach 100%; hard calls cap at 85% unless a synergy bonus applies ([guide](https://backyarddrunkard.com/game-guides/dispatch-stats/)).
  - **Cooldowns and penalties.** Heroes need rest afterwards. On failure, a hero's traits can be "cut in half for the rest of the shift" ([CanIPlayThat](https://caniplaythat.com/2025/12/05/indie-spotlight-dispatch/)).
  - **Hidden requirements were the main complaint.** In the demo, required stats were only inferred from the call's text and shown after the mission, which "sometimes felt like guesswork" ([Aftermath](https://aftermath.site/dispatch-demo)).
- **XCOM 2 covert actions:**
  - **Visible risks.** Each covert action shows its risks: wounds, capture, or an *ambush that becomes a real tactical mission* with 2–3 soldiers.
  - **Ways to improve the odds.** Adding soldiers or staff raises the chance of success ([Twinfinite](https://twinfinite.net/guides/xcom-2-war-chosen-how-covert-actions-what/)).
- **Pathfinder: Kingmaker:**
  - **Advisor checks.** Each kingdom event has a DC, and an advisor's bonus comes from a role-specific attribute: the Regent uses Charisma, the General Strength.
  - **Cheaper, weaker option.** Mercenaries can be used instead, with a lower base chance.
  - **Advisors push back.** They may quit if you override them three times in a row ([GamerGuides](https://www.gamerguides.com/pathfinder-kingmaker/guide/kingdom-information/kingdom-development/events-projects-and-regions), [Steam](https://steamcommunity.com/app/640820/discussions/0/1734340257887179338)).
- **CK3 schemes:**
  - **Two separate numbers.** Power (progress) is separate from Success Chance. Both come from the schemer's skill, the spymaster and recruited agents ([GameWatcher](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue)).
  - **Players distrust the odds.** They complain that "95%" murders fail too often ([Paradox forum](https://forum.paradoxplaza.com/forum/threads/why-are-the-numbers-behind-murder-schemes-so-misleading.1526182/)).
- **Sultan's Game:**
  - **Rituals and dice.** A ritual lists attributes. You slot a character, and the sum of those attributes is the dice pool.
  - **What counts as success.** Each die is binary. Difficulty sets how many faces succeed, and the outcome depends on the number of successes.
  - **Contested checks.** An opponent's attributes are subtracted from your pool. Gold dice add guaranteed successes, and rerolls are consumables ([wiki](https://sultansgame.wiki.gg/wiki/Ritual)).
  - **Fights use the same system.** A fight is just a ritual using Combat and Physique; there is no separate combat system.

**D. Autoresolve as an optional skip** (Total War, Mount & Blade, Wrath of the Righteous). See section 3.

---

## 3. Autoresolve: what players complain about

**Total War**
- **You can't see how it decides.** "After almost 2,000 hours… I still have no idea what's up with auto resolve" ([Steam](https://steamcommunity.com/app/1142710/discussions/0/3827536762634797868)).
- **It values some things wrongly.** Players say it overweights armour, melee and walls, and undervalues spells and factions that rely on tactics (Skaven).
- **Its results swing oddly.** Adding a unit turned one player's "pyrrhic victory into a valiant defeat."
- **Its odds bar is wrong.** A modder says the resolver is deterministic and the bar's "uncertainty zone" is cosmetic. Players report a 50% bar meaning about 90% when fought manually ([TWCenter](https://www.twcenter.net/threads/question-about-auto-resolving-battles.536886/), [Steam](https://steamcommunity.com/app/594570/discussions/0/4763089742396284829)).
- **It ignores tactics.** "Autoresolve only takes the mere value of a unit into account, not the strategic possibilities," so players build armies for the formula ([Steam](https://steamcommunity.com/app/594570/discussions/0/2522527267222150889)).

**Mount & Blade: Bannerlord**
- **Losses in lopsided fights.** "15 looters just KILLED a banner knight in auto resolve" ([Steam](https://steamcommunity.com/app/261550/discussions/0/595144534553276353)).
- **Feels like a dice roll.** "Pure RNG… 100 top tier troops against 10 looters and someone may still die" ([Steam](https://steamcommunity.com/app/261550/discussions/0/3712685279023308920)).
- **The developer responded.** TaleWorlds promised an improved autoresolve ([Gamepressure](https://www.gamepressure.com/newsroom/bannerlord-creating-kingdoms-and-improved-auto-resolve-in-next-pa/zc1d07)).
- **Warband's version was simpler.** Its autocalc reportedly used troop count, troop level and the Tactics skill, ignoring equipment ([guide](https://steamah.com/mount-blade-warband-hidden-mechanics-guide/)).

**Pathfinder: Wrath of the Righteous**
- **Wrong predictions.** Its crusade autoresolve predicted a forced retreat in a battle the reviewer then won in under 10 turns without taking a hit.
- **Manual battles weren't the answer either.** They were "brainlessly monotonous," and players asked for "abstracted blob armies auto-battling each other" instead ([Gamepressure](https://www.gamepressure.com/newsroom/crusade-in-pathfinder-wrath-of-the-righteous-annoys-players/z638fe)).

**Autobattlers**
- **Combat on autopilot.** Loop Hero reviewers say battles run "on autopilot" and wish for more say. The praise goes to tile and deck planning ("placing tiles is strangely addictive"). The complaint is repetition ([PC Gamer](https://pcgamer.com/loop-hero-is-giving-me-a-major-god-complex), [Pocket Tactics](https://www.pockettactics.com/loop-hero/switch-review)).

**Even tactical games draw the same anger at visible odds**
- **Battle Brothers.** Players get angry at the 95% hit cap and miss streaks ([Steam](https://steamcommunity.com/app/365360/discussions/0/4897088319047692139/?ctp=2), [review summary](https://vaporlens.app/app/365360/battle_brothers)).
- **Darkest Dungeon.** Players complain that "heroes built over long hours lost to bad RNG" ([GOG](https://www.gog.com/en/game/darkest_dungeon?page=23)). Defenders reply that planning avoids it.
- **The difference:** the player chose the action that failed, so the anger is aimed at the dice, not at the resolver.

### What gives a hands-off fight player ownership
1. **Judge a decision the player just made.** Two clear examples: Banner Saga's stance choice (casualties against difficulty) and ME2's role assignment.
2. **Put agency in the build or orders before the fight.** Cliff Harris made Gratuitous Space Battles hands-off as "a reaction to frustration" with RTS micromanagement. Agency lives in fleet design and orders, and post-battle reports explain the loss. The concession: auto-resolve loses "the dramatic comeback" ([Old Light](https://oldlight.io/blog/gratuitous-space-battles-auto-resolve/)).
3. **Show the factors, not just a verdict.** Empires in Ruins built its chance of victory as a visible sum: base + battle modifier + research + commander + officers ±1–3 + scouted (+3, unscouted −5) + difficulty, rolled on a d100. Negative modifiers are clamped harder than positive ones ([devlog](https://sgth.itch.io/empires-in-ruins/devlog/100949/autoresolving-battles)).
4. **Allow mid-fight exits at a price.** Darkest Dungeon's retreat succeeds 70% of the time on the first try, +5% per later try, and costs 25 stress ([wiki.gg](https://darkestdungeon.wiki.gg/wiki/Retreating)). Battle Brothers lets you flee off the map edge at any time.
   - Darkest Dungeon II removed the chance to skip or flee, and players said "you wipe or win, and that takes away player agency" ([Steam](https://steamcommunity.com/app/1940340/discussions/0/4434444088611201975)).
5. **Short rounds with a choice between them.** CK3 duels take 2–4 rounds. Each round you draw cards (better hands with higher prowess), and some special moves use other skills or traits. Each pick moves a shared success meter ([PCGamesN](https://pcgamesn.com/crusader-kings-3/duel-system)).

---

## 4. How non-combat checks choose the skill

| Method | Example | What it does well | Risk |
|---|---|---|---|
| Fixed attribute set on the challenge | Sultan's Game rituals (Physique+Survival); Kingmaker roles (Regent = CHA) | Readable, quick to compute | Same character wins every time |
| Role assignment from suitable candidates | ME2 suicide mission | "Who" becomes the decision; failure is personal | Becomes solvable by flowchart |
| Coverage of a multi-stat shape | Dispatch | Several heroes combine; natural synergies | Hidden requirements feel like guessing |
| Player picks which hero acts | Darkest Dungeon curios; Antiquarian bonus | The class choice matters | Players settle on the one best hero |
| Options unlocked by who is present | Battle Brothers backgrounds; Wildermyth casting; Banner Saga "only if Krumr" | Roster becomes story ("who you sent changes the event") | Needs authored content per tag |
| Composite derived stat | RimWorld surgery (skill × body × facility) | Plausible | Opaque unless broken down |

---

## Implications for airaider

**Combat skills**
- **Don't make a fight test name a single weapon core.** No game surveyed does this. Let the merc's own weapon pick the core: each sent merc adds coins from their *wielded* Fighting core (Heavy, Light or Ranged) plus a stat. Battle Brothers, Kenshi and Stoneshard all work this way.
- **Make weapon cores matter through matchups, not gates.** Enemy tags such as *armoured*, *swarm*, *at range* or *undead* grant bonus coins to particular cores, the way spears get +20 to hit, maces beat armour and Stoneshard's maces beat undead. The core name becomes an edge you plan for, not a reason to fail.
- **Give Defense, Athletics and Warfare roles.** For example, front-liner, flanker, or "leader adds coins to the whole fight." That follows ME2's role slots and Mount & Blade's Tactics adding to the fight.

**Fights**
- **Keep fights as coin tests, but run them over 2–4 rounds with a choice each round** (push / hold / retreat), as in CK3 duels and Darkest Dungeon retreats. That gives you an "autobattle" rhythm without spectator mode. It is also text-playable, which a Loop Hero-style simulation mostly is not.
- **Give an autoresolve-like fight one up-front decision with visible trade-offs.** Banner Saga's stance (fewer casualties against more risk) is the model. Then show the factors that add up to the pool, as Empires in Ruins does. Avoid opaque formulas; that opacity is the top complaint in Total War and Bannerlord.
- **Show true odds.** Coin count, heads needed and percentage should all be real. Total War's fake uncertainty band and CK3's "95% fails" are what made players distrust those numbers.
- **Price the exit.** Retreat should always be available and always cost something: a wound, stress, lost loot or reputation. Removing it (Darkest Dungeon II) cost players their sense of agency.

**Non-combat checks**
- **Keep them as single coin tests, but let the player pick an approach.** Offer 2–3 approaches, each naming a different core, for example Persuasion, Intimidation or Roguery for one gate. Each approach has its own stakes. This stops one stat from always winning (the weakness of a fixed set) and still hands the "who" choice to the player.
- **Gate or label options by who was sent.** Use background, family or trait, as Battle Brothers backgrounds, Wildermyth casting and Banner Saga's "only if Krumr" do. This is the cheapest proven way to make the roster change the story. The AI flavour text can name the merc ("Vessa offers to pick the lock").
- **Treat quest steps as ME2-style role slots.** Examples: "who scouts," "who talks," "who holds the door." A wrong or unfit merc in a slot should hurt *a specific person*, ideally someone else, the way ME2's disloyal leader kills the tech specialist. That makes the assignment memorable.
- **Show the requirements before sending.** Dispatch's hidden stat shapes felt like guessing. List which cores and stats feed each slot.

**Failure and range**
- **Failure leaves a named mark.** Use Mordheim and Battle Brothers style lasting injuries, Dispatch's "stats halved for the rest of the shift," and XCOM's turn into a worse situation (a covert action becoming an ambush).
- **Keep a probability ceiling so success is never certain.** Dispatch caps hard calls at 85%; Battle Brothers caps hits at 95%. A bonus such as Sultan's Game gold dice or Dispatch's synergy can earn the last step. Players hate odd caps less when they can see the way past them.
