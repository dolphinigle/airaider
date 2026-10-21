# Findings: what works, what doesn't

The lessons ledger. Every test teaches something; the lesson lands here, one bullet each, citing the experiment or decision that showed it. Read this before proposing anything, so we never retry what failed.

Rules:
- One bullet per lesson: `- **Claim.** Detail. (E-NNNN, D-NNNN)`. At least one citation; `node tools/rec.mjs finding works|fails|open "…" E-NNNN` adds one.
- Curate, don't pile up: when new evidence flips or sharpens a lesson, rewrite or move its bullet and add the new citation. History lives in the cited records.
- A done or abandoned experiment must be cited here at least once (`rec.mjs check` enforces it).
- Findings inform; they don't rule. A lesson that should change the game becomes a decision.

## Works

- **Rolls that pay off a player decision.** Research: every loved chance game puts a choice before the roll (who, approach, spend); dice can replace combat this way. Not yet tested in v4. (E-0002)
- **Visible odds and stakes on a named merc.** Research: the emotional core of XCOM, Darkest Dungeon, Battle Brothers; hidden math reads as cheating. (E-0002)
- **Failure that leaves a mark.** Research: wounds, scars, quirks and deaths that stick to the person make failure content instead of dead air. (E-0002)
- **Who you sent changes the event.** Research: trait-unlocked options (FTL, Dispatch) keep events fresh; trait-blind events wear out in a few runs. (E-0002)
- **Big coin pools are fine.** Long animation is a non-issue: coins flip together or in batches (designer). (E-0001)
- **Fights draw on the merc's own weapon, never a test that names one weapon core.** No surveyed game (Battle Brothers, Kenshi, Stoneshard, Limbus) asks for a single weapon skill; the wielded weapon picks it, and enemy tags (armored, undead, swarm) make cores matter as matchups, not gates. (E-0003)
- **Knowledge feeds the next roll.** Lore that reveals a weakness or unlocks an approach is loved (PF2e weakness reveals, Darkest Dungeon provisions); a net-zero lore pass/fail is disliked. Research, untested in v4. (E-0003)
- **Retreat always open, always priced, tiered.** Loop Hero 100/60/30, Darkest Dungeon's priced retreat; Darkest Dungeon II removing mid-fight retreat drew complaints. Research. (E-0003)
- **Watching is fine when the build decides it.** Autobattlers (Loop Hero, Backpack Battles, Super Auto Pets, TFT) put every choice before the fight; the fight is the test of the build, and close fights are the payoff (designer: 'player only watch is fine as long as player can get the just right thing'). Untested in v4. (E-0003)
- **Per-merc tactic rules make a watched fight the player's own.** Party coin autobattle sim: with foe strength calibrated so simple rules win about 50%, the best rule set wins 79-95% and the worst about 0%; the best wins are often close (Ogre falls in the last round, tank at 1 HP). (E-0003)
- **Foes that punish default rules keep tactics a fresh decision.** In the sim the best rules changed by foe group (area attacks vs wolves and skeletons, single bolts vs the ogre, kill the foe healer first vs the cult) and party makeup swung results (3 warriors 26% vs the cult, 2 mages 100%). With uniform foes one rule set won everywhere. (E-0003)
- **Skill slots in priority order, auto-sorted, ramp well.** Sim v2: at Lv1 (2 skills) the auto-sorted default is within 5-16 points of the best setup, so no tactics are needed; at Lv6/Lv12 the best order wins 73-100% vs the default's 24-56%. (E-0003)
- **Fixed battle skills with an AI skin (flavor only).** Same rules and balance for all (Cleave is Cleave), but Brann's reads 'Twin Hew' and Hulda's 'Reckless Reap'; a scholar mage's kit reads 'Ember Verse, Chapter of Cinders, Footnote of Frost'. Mock, untested in play. (E-0003)

## Doesn't work

- **AI-written engaging story as the main source of fun.** v3 spent about a week on story pipelines (sagas, synopsis prompts, judge rounds) and the scorecard stayed near 6/10. (D-0002)
- **Resolution that no player choice shaped.** Atlas's walk was watchable but flat: nothing he carried or chose changed the rolls. Research names it the classic dispatch failure. Watching itself is fine when the build decides the outcome (see Works). (E-0001, E-0002, E-0003)
- **Foregone outcomes.** 3/3 wins at 65–80% felt like nothing was at stake; players read 80%+ as certain. (E-0001, E-0002)
- **Intertwining quests as a goal.** Plot intricacy isn't what makes this game fun; the squad rolling coins is. (D-0002)
- **A separate minigame for talk.** Griftlands' parallel negotiation battle read as two different games and made the weaker mode a trap; tabletop and video successes keep one roll primitive and scale the structure to the stakes. Research. (E-0003)
- **Clash combat where both sides flip (Limbus Company style).** Number-heavy, brings foe coins back (D-0013), needs a move kit per merc; designer: 'clash bad'. (E-0003)
- **AI-generated battle-skill mechanics.** Even within a fixed parts list, Sonnet gave 5 of 6 mercs the same block skill, drew skills from the wrong source, priced a warrior's taunt in mana and swung power (whole-enemy stun at 2 mana). Unique skills per merc also stop the player learning what a skill does. Mock. (E-0003)

## Open

- **Does a party coin autobattle make quests more fun?** Proxies say it beats plain coin tests: setup choices swing fights 0-95%, the best order changes by foe, close wins happen (E-0003). But nobody has played one as a player; win rates are not fun. Needs a playable, displayed fight the designer judges. (E-0001, E-0002, E-0003, D-0004)
- **Is choice around the roll enough ownership without tactics?** Tactics make a loss feel like your own fault; whether dice choices do that too is unproven. (E-0002)
- **Endgame spread.** Under player-placed growth (D-0014) a Lv 12 specialist had 13–14 next to dump stats of 2, so the wrong merc auto-failed. Random three-coin growth (D-0018) lifts untalented stats to about 6–8; whether that gap feels right in play is untested. (E-0001, D-0014, D-0018)
- **Taunt as built was never worth a turn.** In the party sim, tanks did best just hitting; a tank tool needs teeth (free action, damage cut). Fight length is a pacing question now that fights are displayed (D-0023); wipes injure, not kill (D-0024). (E-0003, D-0023, D-0024)
- **Tactic books only matter against sharp twists.** One good slot order covered a mixed quest at 94% (re-slotting per fight 97%; books +1). With sharp twists (blade-proof skeletons, an enraging ogre, fire-immune imps) books added +17 points on the skeleton fight. Books need foe families with twists a universal order can't answer; at Lv12 best setups near 95% also mean fights get solved without harder quests. (E-0003)
