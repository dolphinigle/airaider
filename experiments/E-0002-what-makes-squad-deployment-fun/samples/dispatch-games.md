# Dispatch, mission-table and auto-resolve systems: what makes them fun or a chore

E-0002 research agent 1 of 3, 2026-10-20. Question: when squad members go out on a mission that is *not* played out as tactical combat, what makes that deployment fun, and when does it fall flat?

## Method and caveats

- Web search plus page fetches across reviews, design postmortems, developer interviews, Steam/GameFAQs/forum threads and wikis.
- **Reddit could not be fetched** (blocked for this tool), and search rarely surfaced Reddit threads, so player voice comes mainly from Steam and GameFAQs forums, review comments and fan guides. Several outlets (Kotaku, Giant Bomb, PC Gamer for some pages) returned 403/429. Where a page couldn't be read, the claim is cited to the search-result excerpt and marked *(excerpt)*.
- Quotes are verbatim from the fetched page or the search excerpt. Forum quotes are single players, not consensus. Evidence is thin for Genshin, Arknights and CK3 schemes (no direct player sentiment found), and that is flagged in those entries.

---

## Summary table

| Game | Player decides | Shown during resolution | At stake | Verdict (critics/players) |
|---|---|---|---|---|
| AC Brotherhood: assassin contracts | Which recruit, which contract (odds meter) | Nothing; timer, then result | Recruit XP vs permadeath; recruit unavailable meanwhile | Loop liked; recruits "just bots", missions never seen |
| Dragon Age Inquisition: war table | Which advisor (Josephine/Leliana/Cullen) solves each operation | Nothing; real-time timer, then a written report | Power, resources, story flags, sometimes major consequences | Stories praised; mechanic called padding, "reading reports" |
| XCOM 2 WotC: covert actions | Which soldiers to commit; accept risk (wound/capture/ambush) | Nothing; days pass on the strategy map; ambush becomes a real mission | Soldiers out of the roster for a week; bonds, faction rewards | Called "vital", "really great, core strategic game play"; adds bloat |
| XCOM Chimera Squad: spec ops/assignments | Which unassigned agents go | Nothing; timer | Resources vs agents missing combat XP | Neutral; an opportunity-cost sink, nobody remembers it |
| Fallout Shelter: wasteland + quests | Who goes, gear, stimpaks; when to recall | Live text journal of finds and fights; quests are played rooms | Dweller death, loot | Explorers "dying when I'm logged off"; quest rewards insulting |
| Mount & Blade / Bannerlord: send troops | Fight yourself or auto-resolve | Instant result | Troop losses | Feels "pure RNG"; elites die to looters, breaks trust |
| Battle Brothers | No auto-resolve; contract choice, events between fights | Events as text choices | Named brothers, permadeath | Players ask for autobattle only for won fights (tedium) |
| Football Manager | Squad, tactics, team talks, in-match shouts | 2D/3D match simulation or commentary, live | Result, morale, season | The set-up-then-watch loop is the game; opacity of "why" is the top complaint |
| Gratuitous Space Battles | Fleet design + pre-battle orders | Full battle plays like a movie, no control | Win/loss | "Committed tinkerer" loves it; the build step's opacity hurts |
| Unicorn Overlord / Ogre Battle | Unit composition, positions, gambit rules | Short automated battle | Unit HP, map control | Unicorn Overlord: "a marvel of system design"; preview can remove adaptation |
| Darkest Dungeon: prep + hamlet | Party, provisions, who rests | (Expedition is played) | Stress, afflictions, permadeath | Prep is a real decision because the run punishes bad prep |
| Shadow Empire | Which leader runs which post/army | Turn reports, events | Leader loyalty, coups | Drama from staffing; "black box" outcomes |
| CK3 schemes | Target, scheme type, agents | Monthly progress bar, event pop-ups | Kill/seduce succeeds or is discovered | Slow, passive; intrigue rarely invested in |
| Banner Saga caravan | Rest vs march, event choices, spend renown | Caravan walking across painted scenery; text events | Clansmen, fighters, named heroes die from choices | Atmosphere and weight praised; outcomes hard to read |
| Oregon Trail / Organ Trail | Pace, rations, supplies, river choices | Wagon animation; travel auto-runs and stops on events | Named family/friends die | Iconic; named party members carry the story |
| FTL events | Text choice; blue options from crew/gear | Text outcome | Crew, hull, scrap | Loved, but "no way to assess or influence the odds"; repeats |
| This Is the Police | How many officers to each call; occasional on-scene choices | Map timers; choice menus | Officers, career | Fun early; becomes "tedious busywork", no closure |
| Dispatch (AdHoc, 2025) | Which hero(es) to each call; pairings; occasional tactical choice; hacking | Live map, radio banter, then stat-pentagon reveal | Success, XP, injury, morale, rest time | The dispatch layer widely praised; banter and fit-reveal carry it |
| Wildermyth | Choices in story events; who to bring | Comic-panel scenes about your specific heroes | Transformations, injuries, death, aging | Beloved; repeats after a few campaigns |
| Mass Effect 2 suicide mission | Who fills each specialist role; who escorts | Cutscene: success or death of that squadmate | Named, loved squadmates die | "one of the best individual missions of the last decade" |
| FFT propositions/errands | Which units go on an errand | Nothing; days pass, report | Gil, JP, artefacts; hidden success formula | Liked for lore; formula opaque until fans decompiled it |
| Legend of Keepers | Room/monster layout, then fights | Short auto-ish fights; morale meters | Monster morale, burnout | Reviewer cared more about morale and events than the fights |
| Genshin expeditions / Arknights base | Who goes / who works where | Nothing; timer | Small resources | Pure chore; developer response was to reduce clicks |

---

## Game by game

### Assassin's Creed Brotherhood: assassin recruits and contracts (2010)
- **Decides:** recruit citizens (after burning Borgia towers), assign one or more to a contract across Europe; equip and level them.
- **Shown:** a success meter before sending; then nothing but a timer and a result. "When given the option to send a member on a task, a meter displays the probability for success." "Once they die, they are gone forever." ([Engadget preview](https://www.engadget.com/2010-06-17-preview-assassins-creed-brotherhood-single-player.html))
- **Stakes:** permadeath of a recruit you've levelled; that recruit is unavailable to call in during your own fights (the crucial link: the same people serve you in the played layer).
- **What players/critics said:** the loop of risk-for-XP then calling your veterans into combat was the appeal. Weakness was identity: CinemaBlend said the assassins are "just bots that execute very specific tasks on your command", "you never see their missions, and you never talk to them after they're in your stable" ([CinemaBlend](https://cinemablend.com/games/Review-Assassin-Creed-Brotherhood-28431.html), *excerpt*). A GameSpot user called the system "a good idea, but very undeveloped" ([GameSpot user review](https://gamespot.com/assassins-creed-brotherhood/user-reviews/2200-12578180/), *excerpt*).
- **Lesson:** visible odds + permadeath + the dispatched unit also matters in the played layer = tension. No narration of the mission and no personality = the tension has nothing to attach to.

### Dragon Age: Inquisition: the war table (2014)
- **Decides:** pick an operation, then which of three advisors handles it (forces/secrets/connections). Each gives a different outcome and duration.
- **Shown:** nothing; a **real-time** countdown (minutes to days), then a written report you must collect.
- **Stakes:** power, gold, items, agents, story flags; some operations have major consequences.
- **What critics/players said:** GameBanshee: "a time management minigame ... that seems to be designed solely to pad total playtime", yet "many of the stories contained in this War Table interactions are good. In fact, a lot of them have more personality than the actual quests in the game"; but "the player only learns about them via reports", so they are "a diversion at best" ([GameBanshee review](https://www.gamebanshee.com/kaxfx)). A Steam player: "Most are pretty useless in my opinion" ([Steam](https://steamcommunity.com/app/1222690/discussions/0/2447091790574991699), *excerpt*). A Reddit comment (via proxy) said the most interesting side content was reduced to reading reports rather than playing it ([r/DragonAgeInquisition mirror](https://t.sudovanilla.org/r/DragonAgeInqusition/comments/1gue3yj/lxv78x6), *excerpt*). Defenders: a Kotaku essay argued the small operations make the world "feel fully alive" because your choices are recorded across Thedas ([Kotaku](https://kotaku.com/dragon-age-inquisition-s-war-table-brought-the-wider-w-1823169693), *excerpt*). Producer framing: "how you control your Inquisition forces" and "how much power that gives you as the leader" ([Shacknews](https://www.shacknews.com/article/86108/dragon-age-inquisition-producer-discusses-the-war-table-and-more)).
- **Lesson:** the *advisor choice* is a real decision with flavour, but the payoff arrives late, as text in a menu, decoupled from the moment of decision. Real-time timers read as padding.

### XCOM 2: War of the Chosen: covert actions (2017)
- **Decides:** which 1-3 soldiers go on a covert action (faction rewards, bonds, intel, Chosen hunting); accept listed risks (wounded, captured, ambushed); spend resources to remove risks.
- **Shown:** nothing during the week away; risks are rolled at the end. An **ambush** turns the dispatch into a short real mission with those exact soldiers ("Run to the evac zone while avoiding fire") ([Magic Game World](https://www.magicgameworld.com/?p=10683)).
- **Stakes:** soldiers missing from your strike roster for a week; capture (they become a rescue mission later); bond ranks.
- **What players/critics said:** PC Gamer: "a vital tool that gives you a quick way to build relationships with resistance groups, hunt down the Chosen and gather extra supplies", while the expansion's strategy layer adds "some bloat" ([PC Gamer](https://pcgamer.com/xcom-2-war-of-the-chosen-review), *excerpt*). A Steam modder thread praised the choice of how many soldiers to commit versus keep ready for emergencies as "really great, core strategic game play" while calling the selection UI clunky ([Steam Workshop discussion](https://steamcommunity.com/workshop/filedetails/discussion/1123382166/601915153920946419), *excerpt*). A player called ambushes manageable "as long you dont send out a single or 2 bad equiped rookies" and found the capture chance the bigger worry ([Steam](https://steamcommunity.com/app/268500/discussions/0/1779388024846266702), *excerpt*).
- **Lesson:** dispatch is fun when it competes with the main game for the same scarce people, and when a bad roll *escalates into play* (ambush, capture → rescue) instead of just subtracting.

### XCOM: Chimera Squad: spec ops / assignments (2020)
- **Decides:** send idle agents on timed spec ops for Elerium, intel, cash.
- **Shown:** nothing. **Stakes:** agents miss "the combat experience of being in the field" ([GamingTrend](https://gamingtrend.com/reviews/a-new-way-to-breach-and-clear-xcom-chimera-squad-review/), *excerpt*).
- **What critics said:** no review singles it out positively or negatively; Stevivor lists it among the many things to track ([Stevivor](https://stevivor.com/reviews/xcom-chimera-squad-review-city-31s-saviours/), *excerpt*).
- **Lesson:** a dispatch with no risk, no story and no surprise is invisible: a resource tap, not a moment.

### Fallout Shelter: wasteland exploration and quests (2015)
- **Decides:** who goes, their gear, stimpaks/RadAway; when to recall (return trip takes half the time out). Quests (patch 1.5) are actually played room-by-room.
- **Shown:** a live journal of what the explorer finds and fights; a running loot tally.
- **Stakes:** the dweller's death; loot quality scales with Luck.
- **What players said:** frustration at "explorers dying when I'm logged off" ([Steam](https://steamcommunity.com/app/588430/discussions/0/1327844097130452081), *excerpt*); near-zero loot from long trips, answered with "luck ... gives you those random quest locations which is where I find my prime loot" ([Steam](https://steamcommunity.com/app/588430/discussions/0/1319962514593761316/?l=spanish), *excerpt*). Reddit anger at a quest to kill two Deathclaws unarmed for 50 caps ([GameStar](https://www.gamestar.de/artikel/fallout-shelter-spieler-sauer-wegen-absurder-aufgaben,3235154.html)). Wishlists ask for a way to set how long explorers stay out and to ignore junk ([Steam](https://steamcommunity.com/app/588430/discussions/0/4352240417146399507), *excerpt*).
- **Lesson:** a live journal is the right instinct (you check in on someone), but losses that happen while you can't respond feel unfair, and rewards out of scale with risk make players stop caring.

### Mount & Blade / Bannerlord: "send troops" auto-resolve
- **Decides:** fight the battle yourself or auto-resolve.
- **Shown:** an instant casualty list. **Stakes:** troops you spent hours levelling.
- **What players said:** "Send Troops is pure RNG. You can send 100 top tier troops against 10 looters and there's always a chance that someone will die"; "basically RNG on which units you'll lose"; one player reverse-engineered it as summed damage dealt to units one by one, which "doesn't resemble a real simulated fight" ([Steam threads](https://steamcommunity.com/app/261550/discussions/0/2248930420025685447), *excerpt*). TaleWorlds patched auto-resolve repeatedly ([Gamepressure](https://www.gamepressure.com/newsroom/bannerlord-creating-kingdoms-and-improved-auto-resolve-in-next-pa/zc1d07)).
- **Lesson:** when auto-resolve disagrees with the player's mental model of the matchup (100 elites vs 10 looters), losses feel like the game cheating. Resolution must be *legible against what was set up*.

### Battle Brothers (2017): what players want from not-playing
- No auto-resolve. Between fights: contracts, ambitions, and text events that grant or remove traits.
- Players ask for autobattle only for fights already won: "it's tedious to move 12 pawns+wait for your enemies turn" ([Steam](https://steamcommunity.com/app/365360/discussions/0/135510194247672603), *excerpt*). Events are "atmospheric encounters and tough decisions outside of combat" (dev launch copy, via [GameBanshee](https://www.gamebanshee.com/k9rkq)), but a player notes you "pick one option and get its result" ([Steam](https://steamcommunity.com/app/365360/discussions/0/620713633862135318), *excerpt*).
- **Lesson:** players want to skip resolution only when its outcome is already decided. A resolution whose result is foregone (E-0001's 3/3 wins) is exactly the case players skip.

### Football Manager: watching a simulation you set up
- **Decides:** squad, tactic, roles, team talk; during the match, shouts and tactical tweaks.
- **Shown:** the match plays out (2D/3D or commentary only, full or highlights). Watching doesn't change results but gives information: one player says it gives "more or less information about your team's performance", another uses full matches to check whether orders are followed ([Steam](https://steamcommunity.com/app/872790/discussions/0/1742227264187754385), *excerpt*).
- **Stakes:** result, morale, job security, season arc.
- **What critics/players said:** GameSpot (FM2010) credited touchline shouts and on-the-fly tactics, changeable "on the basis of what you see happening on the pitch", with making matches more fun ([GameSpot](https://www.gamespot.com/reviews/football-manager-2010-review/1900-6240556/), *excerpt*). Shouts were cut from FM26 at launch and restored in 26.1.0 ([TheSixthAxis](https://www.thesixthaxis.com/?p=466696)); SI frames them as "that immediate, emotional directive" ([footballmanager.com](https://www.footballmanager.com/node/1108)). The perennial complaint is opacity: told "it's your tactics", but the game makes it hard to see *why* they failed ([JumpDashRoll](https://www.jumpdashroll.com/article/football-manager-2022-review), *excerpt*). HEXUS: FM gives "that chance to prove to ourselves that we could make the grade" ([HEXUS](https://hexus.net/qaj5i), *excerpt*).
- **Lesson:** the strongest "watch the sim" game works because (1) the watched outcome tests *your* prior decisions, (2) you get a few small levers mid-resolution, (3) it's the payoff of a week of prep, and (4) players hate it most when they can't read cause and effect.

### Gratuitous Space Battles (2009) and GSB2
- **Decides:** ship design and standing orders (priorities, range, escort, "vulture" focus-fire). **Shown:** the whole battle as a spectacle you can speed or pause but not command.
- **Said:** "you cannot set targets for your ships or change orders, so setting up the overall tactics can be crucial"; "more of a Tower Defense game than an actual real-time strategy game"; GamesRadar: "will leave the committed tinkerer satisfied" but the ship-building "never quite explains itself" ([GamesRadar](https://gamesradar.com/gratuitous-space-battles-review), [PCWorld](https://www.pcworld.com/article/516383/gratuitous_space_battles.html), *excerpts*). Cliff Harris later added optional mid-battle orders ([Positech blog](https://positech.co.uk/cliffsblog/2012/09/14/gratuitous-controllable-battles-yes-really)). GOG pitches GSB2's hands-off mode as playing "like a sports management simulation" ([GOG](https://www.gog.com/game/gratuitous_space_battles_2)).
- **Lesson:** zero-input resolution can carry a game *if the setup is deep and the watch is legible*. Even then, the designer added a lever because some players wanted one.

### Unicorn Overlord (2024) and Ogre Battle (1993)
- **Decides:** squad composition, front/back row positions, Gambit-style conditional rules ("target the weakest", "heal below 50%"), which squad engages which.
- **Shown:** a short automated battle with a pre-battle outcome preview.
- **Said:** Kotaku: "a marvel of system design" that keeps unveiling "yet another piece of the puzzle" ([Kotaku](https://kotaku.com/unicorn-overlord-review-switch-playstation-xbox-1851315686), *excerpt*). The Xbox Hub, on the preview: "you can even see how the battle will play out before confirming", and the reviewer "never really felt I had to adapt" ([The Xbox Hub](https://www.thexboxhub.com/unicorn-overlord-review/), *excerpt*). Ogre Battle was called "Real time Chess!" ([Digitally Downloaded](https://www.digitallydownloaded.net/?p=53679), *excerpt*).
- **Lesson:** the fun lives in *composition puzzles*: who pairs with whom, in which slot. Full outcome preview removes the gamble. Show the odds, keep the uncertainty.

### Darkest Dungeon (2016): expedition prep and the hamlet
- **Decides:** party of four from a roster, provisions (food, torches, shovels, bandages) at a gold cost and an inventory cost; who rests in the abbey/tavern (and is unavailable).
- **Shown:** the expedition itself is played, so prep is tested in play.
- **Stakes:** stress → afflictions, permadeath; cheap replaceable recruits from the stagecoach.
- **Said:** "Do not get too attached to your heroes as they will drop off over time ... As they perish, you will recruit new heroes from the stagecoach" ([Entertainium](https://entertainium.co/2016/03/30/darkest-dungeon-review-sacrifices-must-be-made/), *excerpt*); keeping heroes alive is costly while arrivals are free, so you send waves of apprentices and keep survivors ([Jesuit Roundup](https://jesuitroundup.org/2020/02/darkest-dungeon-roundup-review/), *excerpt*). Tyler Sigman said affliction design drew on "human experience" (Band of Brothers), not games ([PC Gamer](https://www.pcgamer.com/uk/how-darkest-dungeon-got-inspiration-from-band-of-brothers-and-aliens), *excerpt*); GDC 2016 postmortem ([GDC Vault](https://www.gdcvault.com/play/1023089/contactUs)).
- **Lesson:** prep is interesting only when the run reliably punishes bad prep and rewards good prep in a way the player can trace. Recovery time that benches heroes forces roster depth: the same pressure that makes dispatch meaningful.

### Shadow Empire (2020)
- **Decides:** which leader becomes governor, army commander, council director; whom to fire.
- **Shown:** turn reports and leader events. **Stakes:** leader loyalty and faction anger, up to coups and civil war ([Wikipedia](https://en.wikipedia.org/wiki/Shadow_Empire)); "firing Leaders to make place for a new appointee can cause problems" ([Slitherine dev log](https://www.slitherine.com/news/shadow-empire-developer-log-4-leaders-and-factions)).
- **Said:** PC Gamer praised it as ambitious but criticised parts that "seemed like a black box" ([PC Gamer](https://www.pcgamer.com/shadow-empire-review/), *excerpt*); a Steam player found card outcomes "totally random" ([Steam](https://steamcommunity.com/app/1154840/discussions/0/3113644379486624454), *excerpt*).
- **Lesson:** assigning *people with opinions* to jobs makes drama even without visible missions; opacity drains it.

### Crusader Kings III: schemes
- **Decides:** target and scheme type (murder, seduce, befriend...), recruit agents by bribe or hook; reworked in 1.13 (2024) with agent roles and phases.
- **Shown:** a progress bar that ticks monthly; event pop-ups (discovery, opportunities). **Stakes:** success, or discovery with a large success penalty and the target's reaction ([Gamewatcher](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue)).
- **Said:** players skip intrigue because "other trees are so much more useful" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/4629232489537310885), *excerpt*). Paradox's design aim was murder "slightly easier to predict while keeping it unreliable in its outcome" ([GamingOnLinux](https://www.gamingonlinux.com/2019/12/paradox-give-a-little-insight-into-murder-and-seduction-in-crusader-kings-3s-new-scheme-system/page=1)). *Thin evidence on reception of the rework.*
- **Lesson:** a slow bar with rare check-ins is passive; the fun moments are the event pop-ups (discovery, betrayal) that hand the player a decision mid-resolution.

### The Banner Saga (2014): caravan travel
- **Decides:** march or rest (rest heals and lifts morale but eats supplies), event choices (King of Dragon Pass-style text), spend Renown on supplies or on promoting heroes.
- **Shown:** the caravan walking across hand-painted scenery to Austin Wintory's score; travel stops for text events.
- **Stakes:** clansmen and fighters (numbers), morale (affects willpower in battle), and named heroes who die from choices.
- **Said:** PC Gamer: the writers are quick to kill key characters ([PC Gamer](https://www.pcgamer.com/the-banner-saga-review-2/), *excerpt*). Choices are "heavy with consequence" ([Impulse Gamer](https://www.impulsegamer.com/the-banner-saga-nintendo-switch-review/saga01/), *excerpt*); GameRevolution criticised that choices give little feedback compared with Telltale's flagged moments ([GameRevolution](https://www.gamerevolution.com/review/62736-the-banner-saga-review), *excerpt*). Critics noted a design flaw: one currency for food and upgrades makes letting clansmen die "in many ways, advantageous" ([GameBanshee](https://gamebanshee.com/4w9h), *excerpt*). Mechanics: [Banner Saga wiki](https://bannersaga.fandom.com/wiki/Caravan).
- **Lesson:** travel-as-watching works when it's beautiful, slow and punctuated by choices whose cost lands on named people. Faceless numbers (clansmen) become fodder players optimise away.

### The Oregon Trail (1985) and Organ Trail (2010)
- **Decides:** supplies, pace, rations, river crossings, hunting; name your party.
- **Shown:** the wagon animation; travel "only stopping if an important event occurred, or if the player pressed a key". Designer R. Philip Bouchard: the alpha's data-watching was "rather boring"; the animation was "a huge winner" and kids "watch the animation more closely than the data" ([died-of-dysentery.com](https://died-of-dysentery.com/stories/travel-screen.html)). Jimmy Maher calls it "the first really successful ludic narrative": "Its communications are terse indeed, but one really does get the sense of embarking upon a long and dangerous journey" ([The Digital Antiquarian](https://filfre.net/tag/the-oregon-trail), *excerpt*).
- **Stakes:** named family members die ("You have died of dysentery"). Organ Trail's store pitch: "Name your party after your friends and watch them die slowly" ([MobyGames](https://www.mobygames.com/game/59434)).
- **Lesson:** a terse auto-running journey, interrupted only when something happens to *someone you named*, is enough to generate stories players retell for decades. Progress you can see (the wagon moving, the landmark approaching) is itself watchable.

### FTL: Faster Than Light (2012): events
- **Decides:** a text choice per event; blue options unlocked by specific crew races or equipment.
- **Shown:** a text outcome with resource changes. **Stakes:** crew death, hull, scrap.
- **Said:** push.cx: "There's no way to assess or influence the odds"; "you can't even send a redshirt to do the deed"; "After two or three games, you'll have exhausted most of the events" ([push.cx, "FTL: Simulationism Lost"](https://push.cx/ftl-simulationism-lost)). A Steam player: "depending on your choices in the past (blue options) each event is different" ([Steam](https://steamcommunity.com/app/212680/discussions/0/558753718207574623), *excerpt*). Design origin: the team worked from a feeling, captaining a starship ([GDC Vault](https://gdcvault.com/play/1018034/Designing-Without-a-Pitch-FTL)).
- **Lesson:** blue options are the beloved part because they *reward your build* (whom you recruited). Events that ignore your crew feel like flat coin flips and wear out fast.

### This Is the Police (2016): the predecessor of Dispatch
- **Decides:** how many officers to send to each real-time call, who stays back; some calls open multiple-choice menus.
- **Shown:** officers driving on a city map, timers; a result line.
- **Said:** initially "intrigues and challenges in equal measure"; but "more akin to a mobile game, where you send people out and wait for timers to run out", you "rarely get any kind of follow-up on the outcome other than 'offender arrested'", and it "devolves into tedious busywork, capped off by a general lack of closure or payoff" ([PC Gamer](https://pcgamer.com/this-is-the-police-review), [Games Asylum](https://www.gamesasylum.com/?p=33725), [Vooks](https://vooks.net/police-switch-review), *excerpts*).
- **Lesson:** the same core loop as Dispatch, minus narrated outcomes and personality, becomes a chore. Closure on each mission matters.

### Dispatch (AdHoc Studio, 2025)
- **Decides:** read a call, infer which of five stats it needs, send one or more heroes from a cast of reformed villains (Z-Team); manage travel and rest time; choose synergy pairs; on some calls, pick a tactical option at a stat threshold; some calls need the player's hacking minigame.
- **Shown:** the live city map with calls popping up, heroes travelling, **radio banter** between team members, then a stat pentagon showing what the call actually needed against what the hero had.
- **Stakes:** success, XP and levels; heroes who fail may be injured or lose morale; sabotage between feuding heroes ("Sabotaged heroes gain no XP and may get injured") ([Into Indie Games guide](https://intoindiegames.com/walkthroughs/tips-tricks/dispatch-complete-missions-guide/)); tired heroes are unavailable.
- **Said:** Shacknews: "Your success rate is then dependent on how close the character's attributes fit the job"; "If you immediately throw as many heroes as possible at the first jobs that pop up" you'll have no one later; "Characters also have synergies that incentivize specific pairs" ([Shacknews](https://www.shacknews.com/article/146836/dispatch-review-score)). Aftermath (demo): picking well is "a little puzzle of parsing the call's description"; afterwards you see "a visualization of the stat distribution the mission actually required"; the juggling is "hectic in an enjoyable way" as "new calls pop up" while the team argues; the fuzzy requirements keep it from being "some kind of fancied-up matching game" ([Aftermath](https://aftermath.site/dispatch-demo)). Another reviewer: "the dispatching of superheroes is a fun way to listen in on the banter and jokes of your team as you build up their experience and stats" ([search excerpt, review roundup](https://bossrush.net/2025/11/game-review-dispatch-is-a-telltale-game-done-right/)); a preview: "The banter on the radio between your squad was a notable bright spot" ([Gamereactor](https://www.gamereactor.eu/dispatch-preview-managers-can-be-heroes-too-1561283/), *excerpt*). Some calls have choose-your-own-adventure options that appear only with specific heroes assigned ([games.gg](https://games.gg/hi/news/why-dispatch-minigame-stands-out/)). The hacking was the most criticised part ("either trivial or completely unintuitive", *excerpt*).
- **Lesson:** the clearest modern proof that a no-combat dispatch can be the fun part. It adds what This Is the Police lacked: characters who talk during resolution, a puzzle-y read of the call (not a visible formula), a post-hoc reveal that teaches you, pair chemistry, and a time-pressure juggle.

### Wildermyth (2021)
- **Decides:** choices in story events between fights; who goes; how heroes respond.
- **Shown:** comic-panel scenes starring your specific procedurally generated heroes, keyed to their personality traits and relationships.
- **Stakes:** transformations (one reviewer's hero turned into a bear, another grew wings), injuries that become permanent wounds, aging, death; legacy heroes return in later campaigns ([Cannibal Halfling](https://cannibalhalflinggaming.com/2022/01/12/a-glimpse-into-the-vault-wildermyth/), [Multiplayer.it](https://multiplayer.it/recensioni/wildermyth-recensione.html), *excerpts*).
- **Said:** origin: "All three of us had been playing X-COM a lot ... we wanted a lot more detail about the soldiers"; the game is "about telling origin stories for all these crazy heroes" ([GameBanshee interview](http://www.gamebanshee.com/xykr3)). Criticism: "after just 4 playthroughs, the random story events are already starting to repeat themselves" ([RPGamer](https://rpgamer.com/review/wildermyth-review/), *excerpt*); the same event plays differently with different characters (gem idol: steal vs psychically commune) ([RPG Site](https://rpgsite.net/review/12107-wildermyth-review), *excerpt*).
- **Lesson:** events cast with *your* people, and changing those people permanently, are what turn rolls into story. Repetition is the failure mode, softened when the cast changes the event.

### Mass Effect 2 (2010): the suicide mission
- **Decides:** which squadmate fills each specialist role (tech expert, biotic, fireteam leader, escort); earlier: who you made loyal, which ship upgrades you bought.
- **Shown:** a cutscene: the specialist succeeds or dies on screen.
- **Stakes:** permanent death of characters you've spent 30 hours with; "their loyalty and suitability for the task determines whether they live or perish" ([Wikipedia](https://en.wikipedia.org/wiki/Suicide_Mission_(Mass_Effect_2))).
- **Said:** "intense" because "anyone can die" (PC Gamer); "unparalleled in terms of its labyrinthine choice complexity" (Eurogamer); "the cruel genius is that BioWare knows full well that you've fallen in love with these characters" (GamesRadar+); "one of the best individual missions of the last decade" (GamesRadar+) (all via [Wikipedia](https://en.wikipedia.org/wiki/Suicide_Mission_(Mass_Effect_2))). A PopMatters writer found the tension faded on replay once the rules were known ([PopMatters](https://popmatters.com/131951-least-suicidal-mission-2496128499.html), *excerpt*).
- **Lesson:** the single most praised non-tactical "send this person to do that job" in games. Fit-to-role + prior investment + a named, loved character + a clearly shown outcome. Its weakness (deterministic, solvable) is the replay case.

### Final Fantasy Tactics: propositions / errands (1997)
- **Decides:** pay a fee, send units on an errand for N days. **Shown:** nothing; a report on return with gil, JP, artefacts, sometimes lore.
- **Said:** success "isn't guaranteed, and the game doesn't explain what affects the outcome"; fans decompiled it to find job, level, Brave and Faith all matter ([Caves of Narshe](https://www.cavesofnarshe.com/fft/errands.php), *excerpt*).
- **Lesson:** hidden formulas turn dispatch into guessing; lore rewards are the remembered part.

### Legend of Keepers (2021)
- **Decides:** dungeon layout: traps, monster trios and their row positions. Fights are short and mostly about the set-up.
- **Stakes:** monster morale; demoralised monsters burn out and leave for weeks; bosses lose stamina each fight ([Turn Based Lovers](https://turnbasedlovers.com/review/legend-of-keepers), [Prima](https://primagames.com/reviews/legend-of-keepers-review), *excerpts*).
- **Said:** one reviewer "became less interested in the battling and more interested in their team's morale, the events, and simply working their way up the dungeon master career ladder" ([TheSixthAxis](https://www.thesixthaxis.com/?p=379701), *excerpt*).
- **Lesson:** persistent condition on your roster (morale, burnout) can be more engaging than the resolution itself.

### Gacha/idle dispatch: Genshin expeditions, Arknights base (RIIC)
- **Decides:** who goes for 4/8/12/20h (Genshin); which operator works which facility, rotated through dorms as morale drains (Arknights: "once the Operator's morale reaches 0, they will become distracted") ([Arknights wiki](https://arknights.wiki.gg/wiki/Base)).
- **Shown:** nothing. **Stakes:** small resources.
- **Said:** HoYoverse's own response was to cut clicks: "Claim All" and "Dispatch Again" ([Siliconera](https://www.siliconera.com/genshin-impact-artifacts-and-expeditions-quality-of-life-changes-coming-in-4-3/)), after announcing work on simplifying "expeditions, forging, and cooking" ([SI](https://videogames.si.com/news/genshin-impact-4-1-adventure-encounters)). *No direct player sentiment found*, but the developer's fix (automate it away) is itself the verdict.
- **Lesson:** this is the "chore" pole: no decision, no risk, no story, a timer. When the best fix is a "repeat" button, the system isn't a game.

### Other: RimWorld caravans, Mass Effect Andromeda strike teams, Pillars stronghold
- RimWorld caravans (played on a world map, events abstracted): players find them rarely "outweighing the effort and risk", and a modder calls vanilla caravanning "kind of bare" ([Steam](https://steamcommunity.com/app/294100/discussions/0/3110271287036539929), *excerpts*). Travel with no events is dead time.
- Andromeda strike teams: a parallel meta-game "largely separate from the main storyline" ([GameBanshee](https://gamebanshee.com/kdkhr), *excerpt*); guides advise doing hard ones yourself. Disconnection from the main loop = ignorable.
- Pillars of Eternity stronghold: thin content and weak story link drew a Josh Sawyer "mea culpa" ([GameBanshee postmortem](https://www.gamebanshee.com/kxrpd), *excerpt*).

---

## Cross-cutting principles: loved vs chore

**1. The decision is the game, so it must be a real puzzle of fit.** Every loved system makes "who goes" a judgement call: Dispatch's call-reading ("a little puzzle of parsing the call's description"), ME2's specialist roles, FTL's blue options, Unicorn Overlord's composition, DAI's advisor choice. Chores have no meaningful pick (Genshin, Chimera Squad spec ops). A visible formula reduces it to matching; Aftermath credits Dispatch's fuzzy requirements with keeping it from being "a fancied-up matching game".

**2. Dispatch must cost the main game something: people you'd rather keep.** XCOM covert actions and AC Brotherhood work because the soldier/recruit is missing from the layer you play. Dispatch adds travel and rest time ("throw as many heroes as possible at the first jobs" and you're stuck). Darkest Dungeon's resting heroes force a deep roster. With no opportunity cost (idle-only agents, unlimited slots), the choice is free and therefore boring.

**3. The stakes must land on named people the player is attached to.** ME2 ("BioWare knows full well that you've fallen in love with these characters"), Oregon/Organ Trail (named friends), Wildermyth, Banner Saga heroes. Faceless numbers become fodder (Banner Saga clansmen, Bannerlord troop counts) and AC Brotherhood's recruits fail as "just bots". Attachment comes from identity, history and on-screen voice, not from stats.

**4. Show something during resolution, and make it the characters.** Dispatch's radio banter is the most-praised part of its dispatch layer; Oregon Trail's designer found data-watching "rather boring" and the moving wagon "a huge winner"; Banner Saga's walking caravan; Fallout Shelter's journal; Football Manager's match. The pure-timer systems (DAI, This Is the Police, gacha) get called padding and busywork. What's shown needn't be combat: progress, voices, small incidents.

**5. Interrupt the resolution with a decision when something happens.** Oregon Trail runs automatically "only stopping if an important event occurred"; Banner Saga stops for events; Dispatch has mid-call tactical choices; FM has shouts; CK3's best moments are pop-ups mid-scheme. Zero-input resolution survives only when the setup is very deep (GSB, and even it added mid-battle orders). One or two well-timed interrupts beat continuous control.

**6. Outcomes must be legible against the setup; show the why.** Dispatch's pentagon reveal of "the stat distribution the mission actually required" teaches you; FM's biggest complaint is not seeing why tactics failed; FTL is criticised for "no way to assess or influence the odds"; Bannerlord's elites dying to looters reads as "pure RNG"; Shadow Empire is a "black box"; FFT's formula needed decompiling. Show odds before (AC's success meter), explain after. Losses the player can trace to a choice are accepted (GamesRadar on FTL: "there's a good chance it's going to be your fault"); losses they can't trace feel like cheating.

**7. Keep real uncertainty, and make failure interesting rather than just subtractive.** Full previews kill the gamble (Unicorn Overlord reviewer "never really felt I had to adapt"); deterministic solutions kill replay (ME2 on replay). Foregone wins are what players want to skip (Battle Brothers players want autobattle only for won fights). The best failures escalate into new play or story: XCOM ambush → a mission with those soldiers; capture → a rescue; Wildermyth's fatal blow → a permanent wound or transformation; Dispatch's failure → injury, morale and sabotage that echo into later calls.

**8. Every mission needs closure and a consequence that persists.** This Is the Police's "rarely any kind of follow-up ... other than 'offender arrested'" and "lack of closure or payoff" are its failure. DAI's reports have good stories but arrive detached. Loved systems change the people: XP and levels, bonds (XCOM), injuries and traits (Battle Brothers, Wildermyth), morale and burnout (Dispatch, Legend of Keepers, Arknights), death.

**9. Cast the event from the roster, so the same event plays differently.** FTL's blue options, Dispatch's hero-specific choices, Wildermyth's personality-keyed scenes, DAI's advisor-dependent outcomes. Events that ignore who went wear out in "two or three games" (FTL critique) or "4 playthroughs" (Wildermyth). Variety comes from combining a modest event pool with a roster whose traits change the options and outcomes.

**10. Time and pacing must serve decisions, not pad playtime.** Real-time timers (DAI, gacha) read as padding and retention hooks; HoYoverse's fix was to remove the clicks. Dispatch uses time *inside* the session as juggling pressure ("hectic in an enjoyable way"). FM and Oregon Trail compress time and skip the quiet stretches. Rewards must be in scale with risk (Fallout Shelter's 50-cap Deathclaw quest).

**11. The dispatch layer must feed the main loop.** AC recruits you call into your own fights; XCOM covert actions that unlock Chosen strongholds and bonds; Dispatch heroes who matter in the story scenes. Parallel meta-games that are "largely separate from the main storyline" (Andromeda) or thin (Pillars stronghold) get ignored.

### Quick test: "loved" vs "chore"

| Loved when... | Chore when... |
|---|---|
| Choosing who goes is a judgement call | The pick is obvious, free or irrelevant |
| Sending someone costs you their presence elsewhere | Idle units go at no cost |
| Named, voiced people are at risk | Faceless counts or interchangeable bots |
| You watch or hear something happen | A timer, then a menu report |
| An interrupt hands you a choice mid-mission | No input between send and result |
| Odds before and reasons after are clear | Black-box rolls, unexplained losses |
| Real uncertainty; failure opens new play | Foregone wins or pure subtraction |
| The mission closes with a consequence on the person | "Offender arrested" and nothing changes |
| Events change with who was sent | Same event whoever goes; repeats fast |
| Time pressure inside the session | Real-time waits as padding |

---

## Relevance to E-0001 run 1 (for the synthesis, not a ruling)

Run 1 (a walk with three passive-modified coin rolls, AI one-liners, 3/3 wins) hits four chore markers above: no decision during resolution (5), no real uncertainty, as outcomes were foregone (7), little cost to sending (2), and outcomes that don't change the people (8). It already has two loved markers in seed form: something shown (4) and a named character (3). The examples suggest the cheapest high-value additions are (a) one or two interrupts per walk where an event hands the player a choice cast from who was sent (FTL blue options, Dispatch tactical choices, Oregon Trail stops), (b) failure that leaves a mark on the person or spawns follow-up, and (c) a post-walk reveal of why it went that way. The designer rules on this; it is input for the synthesis only.

---

## Sources

- Assassin's Creed Brotherhood: [Engadget preview](https://www.engadget.com/2010-06-17-preview-assassins-creed-brotherhood-single-player.html) · [CinemaBlend review](https://cinemablend.com/games/Review-Assassin-Creed-Brotherhood-28431.html) · [GameSpot user review](https://gamespot.com/assassins-creed-brotherhood/user-reviews/2200-12578180/) · [Gameswelt preview](https://www.gameswelt.de/assassins-creed-brotherhood/preview/moerderisches-teamwork-6625/2)
- Dragon Age Inquisition: [GameBanshee review](https://www.gamebanshee.com/kaxfx) · [Steam discussion](https://steamcommunity.com/app/1222690/discussions/0/2447091790574991699) · [GameFAQs timers thread](https://gamefaqs.gamespot.com/boards/718650-dragon-age-inquisition/70577615) · [Reddit mirror](https://t.sudovanilla.org/r/DragonAgeInqusition/comments/1gue3yj/lxv78x6) · [Kotaku essay](https://kotaku.com/dragon-age-inquisition-s-war-table-brought-the-wider-w-1823169693) · [Shacknews producer interview](https://www.shacknews.com/article/86108/dragon-age-inquisition-producer-discusses-the-war-table-and-more) · [Prima guide](https://primagames.com/eguides/dragon-age-inquisition-eguide/the-war-council/the-war-table)
- XCOM 2 WotC: [PC Gamer review](https://pcgamer.com/xcom-2-war-of-the-chosen-review) · [Magic Game World](https://www.magicgameworld.com/?p=10683) · [Twinfinite guide](https://twinfinite.net/?p=297668) · [Steam ambush thread](https://steamcommunity.com/app/268500/discussions/0/1779388024846266702) · [Steam Workshop discussion](https://steamcommunity.com/workshop/filedetails/discussion/1123382166/601915153920946419) · [Steam bond thread](https://steamcommunity.com/app/268500/discussions/0/1621724915771897136/) · [Player2 review](https://www.player2.net.au/2017/09/xcom-2-war-chosen-review/)
- XCOM Chimera Squad: [GamingTrend](https://gamingtrend.com/reviews/a-new-way-to-breach-and-clear-xcom-chimera-squad-review/) · [Stevivor](https://stevivor.com/reviews/xcom-chimera-squad-review-city-31s-saviours/) · [PC Gamer](https://pcgamer.com/xcom-chimera-squad-review)
- Fallout Shelter: [Steam: explorers dying](https://steamcommunity.com/app/588430/discussions/0/1327844097130452081) · [Steam: luck/loot](https://steamcommunity.com/app/588430/discussions/0/1319962514593761316/?l=spanish) · [Steam: wishlist](https://steamcommunity.com/app/588430/discussions/0/4352240417146399507) · [GameStar](https://www.gamestar.de/artikel/fallout-shelter-spieler-sauer-wegen-absurder-aufgaben,3235154.html) · [Quests wiki](https://fallout-archive.fandom.com/wiki/Fallout_Shelter_quests)
- Mount & Blade / Bannerlord: [Steam auto-resolve thread](https://steamcommunity.com/app/261550/discussions/0/2248930420025685447) · [Gamepressure patch news](https://www.gamepressure.com/newsroom/bannerlord-creating-kingdoms-and-improved-auto-resolve-in-next-pa/zc1d07) · [Warband autocalc thread](https://steamcommunity.com/app/48700/discussions/6/1488866180606796026)
- Battle Brothers: [Steam autobattle request](https://steamcommunity.com/app/365360/discussions/0/135510194247672603) · [Steam events thread](https://steamcommunity.com/app/365360/discussions/0/620713633862135318) · [GameBanshee release](https://www.gamebanshee.com/k9rkq) · [GameSkinny review](https://www.gameskinny.com/reviews/battle-brothers-review-stylish-but-predictable/)
- Football Manager: [Steam full match vs highlights](https://steamcommunity.com/app/872790/discussions/0/1742227264187754385) · [JumpDashRoll FM22](https://www.jumpdashroll.com/article/football-manager-2022-review) · [GameSpot FM2010](https://www.gamespot.com/reviews/football-manager-2010-review/1900-6240556/) · [God is a Geek FM2015](https://godisageek.com/?p=153375) · [TheSixthAxis FM26 shouts](https://www.thesixthaxis.com/?p=466696) · [footballmanager.com FM27](https://www.footballmanager.com/node/1108) · [HEXUS](https://hexus.net/qaj5i) · [FMScout thread](https://www.fmscout.com/q-10861-Is-the-off-the-pitch-side-of-FM-developed-better.html?p=151324)
- Gratuitous Space Battles: [GamesRadar](https://gamesradar.com/gratuitous-space-battles-review) · [PCWorld](https://www.pcworld.com/article/516383/gratuitous_space_battles.html) · [Positech blog](https://positech.co.uk/cliffsblog/2012/09/14/gratuitous-controllable-battles-yes-really) · [GOG GSB2](https://www.gog.com/game/gratuitous_space_battles_2)
- Unicorn Overlord / Ogre Battle: [Kotaku](https://kotaku.com/unicorn-overlord-review-switch-playstation-xbox-1851315686) · [The Xbox Hub](https://www.thexboxhub.com/unicorn-overlord-review/) · [TheSixthAxis](https://thesixthaxis.com/2024/04/09/unicorn-overlord-review) · [Digitally Downloaded](https://www.digitallydownloaded.net/?p=53679) · [RPGFan](https://www.rpgfan.com/review/ogre-battle-the-march-of-the-black-queen-3/)
- Darkest Dungeon: [PC Gamer on inspiration](https://www.pcgamer.com/uk/how-darkest-dungeon-got-inspiration-from-band-of-brothers-and-aliens) · [GDC 2016 postmortem](https://www.gdcvault.com/play/1023089/contactUs) · [Entertainium](https://entertainium.co/2016/03/30/darkest-dungeon-review-sacrifices-must-be-made/) · [Jesuit Roundup](https://jesuitroundup.org/2020/02/darkest-dungeon-roundup-review/) · [GameSkinny provisioning](https://www.gameskinny.com/tips/darkest-dungeon-provisioning-guide/) · [Wikipedia](https://en.wikipedia.org/wiki/Darkest_Dungeon)
- Shadow Empire: [PC Gamer](https://www.pcgamer.com/shadow-empire-review/) · [Slitherine dev log 4](https://www.slitherine.com/news/shadow-empire-developer-log-4-leaders-and-factions) · [Wikipedia](https://en.wikipedia.org/wiki/Shadow_Empire) · [Steam](https://steamcommunity.com/app/1154840/discussions/0/3113644379486624454)
- Crusader Kings III: [Steam intrigue thread](https://steamcommunity.com/app/1158310/discussions/0/4629232489537310885) · [GamingOnLinux dev diary coverage](https://www.gamingonlinux.com/2019/12/paradox-give-a-little-insight-into-murder-and-seduction-in-crusader-kings-3s-new-scheme-system/page=1) · [Gamewatcher](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue) · [Guild Order guide](https://guildorder.com/games/ck3/guides/schemes-choosing-the-right-plot)
- The Banner Saga: [GameBanshee](https://gamebanshee.com/4w9h) · [PC Gamer](https://www.pcgamer.com/the-banner-saga-review-2/) · [GameRevolution](https://www.gamerevolution.com/review/62736-the-banner-saga-review) · [Impulse Gamer](https://www.impulsegamer.com/the-banner-saga-nintendo-switch-review/saga01/) · [CGMagazine](https://www.cgmagonline.com/review/game/the-banner-saga-review-2/) · [God is a Geek](https://godisageek.com/2014/01/the-banner-saga-review/) · [Wiki: Caravan](https://bannersaga.fandom.com/wiki/Caravan)
- Oregon Trail / Organ Trail: [Bouchard, The Travel Screen](https://died-of-dysentery.com/stories/travel-screen.html) · [The Digital Antiquarian](https://filfre.net/tag/the-oregon-trail) · [EdSurge](https://edsurge.com/news/2022-10-11-reflections-on-50-years-of-game-based-learning-part-1) · [MobyGames Organ Trail](https://www.mobygames.com/game/59434) · [Destructoid](https://www.destructoid.com/reviews/review-the-organ-trail-directors-cut/)
- FTL: [push.cx, Simulationism Lost](https://push.cx/ftl-simulationism-lost) · [Steam blue options](https://steamcommunity.com/app/212680/discussions/0/558753718207574623) · [GDC Vault postmortem](https://gdcvault.com/play/1018034/Designing-Without-a-Pitch-FTL) · [GamesRadar](https://gamesradar.com/faster-than-light-review)
- This Is the Police: [PC Gamer](https://pcgamer.com/this-is-the-police-review) · [Games Asylum](https://www.gamesasylum.com/?p=33725) · [Vooks](https://vooks.net/police-switch-review) · [KeenGamer](https://www.keengamer.com/articles/reviews/this-is-the-police-review/)
- Dispatch: [Shacknews review](https://www.shacknews.com/article/146836/dispatch-review-score) · [Aftermath demo](https://aftermath.site/dispatch-demo) · [Into Indie Games missions guide](https://intoindiegames.com/walkthroughs/tips-tricks/dispatch-complete-missions-guide/) · [games.gg](https://games.gg/hi/news/why-dispatch-minigame-stands-out/) · [Boss Rush](https://bossrush.net/2025/11/game-review-dispatch-is-a-telltale-game-done-right/) · [Gamereactor preview](https://www.gamereactor.eu/dispatch-preview-managers-can-be-heroes-too-1561283/) · [TheXboxHub](https://www.thexboxhub.com/dispatch-review/) · [StackUp](https://www.stackup.org/post/review-dispatch)
- Wildermyth: [GameBanshee interview](http://www.gamebanshee.com/xykr3) · [RPGamer](https://rpgamer.com/review/wildermyth-review/) · [RPG Site](https://rpgsite.net/review/12107-wildermyth-review) · [Cannibal Halfling](https://cannibalhalflinggaming.com/2022/01/12/a-glimpse-into-the-vault-wildermyth/) · [Multiplayer.it](https://multiplayer.it/recensioni/wildermyth-recensione.html) · [Game Maker's Notebook podcast](https://gamemakersnotebook.libsyn.com/balancing-procedural-and-intimate-storytelling-in-wildermyth)
- Mass Effect 2: [Wikipedia, Suicide Mission](https://en.wikipedia.org/wiki/Suicide_Mission_(Mass_Effect_2)) · [PopMatters](https://popmatters.com/131951-least-suicidal-mission-2496128499.html) · [Game Informer](https://www.gameinformer.com/b/features/archive/2010/06/04/how-to-save-or-kill-your-party-in-mass-effect-2.aspx?amp)
- Final Fantasy Tactics: [Caves of Narshe errands](https://www.cavesofnarshe.com/fft/errands.php)
- Legend of Keepers: [Turn Based Lovers](https://turnbasedlovers.com/review/legend-of-keepers) · [Prima](https://primagames.com/reviews/legend-of-keepers-review) · [TheSixthAxis](https://www.thesixthaxis.com/?p=379701) · [FingerGuns](https://fingerguns.net/reviews/2021/04/29/legend-of-keepers-review-pc-a-reverse-dungeon-crawler/)
- Genshin / Arknights: [Siliconera 4.3 QoL](https://www.siliconera.com/genshin-impact-artifacts-and-expeditions-quality-of-life-changes-coming-in-4-3/) · [SI 4.1](https://videogames.si.com/news/genshin-impact-4-1-adventure-encounters) · [RPG Site dailies](https://www.rpgsite.net/news/14808-genshin-impact-version-41-will-make-it-simpler-for-players-to-do-their-dailies) · [Arknights wiki: Base](https://arknights.wiki.gg/wiki/Base)
- Other: [RimWorld caravan thread](https://steamcommunity.com/app/294100/discussions/0/3110271287036539929) · [Andromeda strike teams (GameBanshee)](https://gamebanshee.com/kdkhr) · [Pillars postmortem interviews](https://www.gamebanshee.com/kxrpd)
