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

## Doesn't work

- **AI-written engaging story as the main source of fun.** v3 spent about a week on story pipelines (sagas, synopsis prompts, judge rounds) and the scorecard stayed near 6/10. (D-0002)
- **Resolution with no player input during the quest.** Atlas's walk was watchable but flat; research names it the classic dispatch failure. (E-0001, E-0002)
- **Foregone outcomes.** 3/3 wins at 65–80% felt like nothing was at stake; players read 80%+ as certain. (E-0001, E-0002)
- **Intertwining quests as a goal.** Plot intricacy isn't what makes this game fun; the squad rolling coins is. (D-0002)

## Open

- **What replaces combat?** Research says dice can, if built from decisions around the rolls; which mix (push your luck, coin pool, push lever, trait-unlocked options, mid-walk stops) is most fun is still untested. (E-0001, E-0002, D-0004)
- **Is choice around the roll enough ownership without tactics?** Tactics make a loss feel like your own fault; whether dice choices do that too is unproven. (E-0002)
