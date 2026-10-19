# Findings: what works, what doesn't

The lessons ledger. Every test teaches something; the lesson lands here, one bullet each, citing the experiment or decision that showed it. Read this before proposing anything, so we never retry what failed.

Rules:
- One bullet per lesson: `- **Claim.** Detail. (E-NNNN, D-NNNN)`. At least one citation; `node tools/rec.mjs finding works|fails|open "…" E-NNNN` adds one.
- Curate, don't pile up: when new evidence flips or sharpens a lesson, rewrite or move its bullet and add the new citation. History lives in the cited records.
- A done or abandoned experiment must be cited here at least once (`rec.mjs check` enforces it).
- Findings inform; they don't rule. A lesson that should change the game becomes a decision.

## Works

_Nothing proven in v4 yet._

## Doesn't work

- **AI-written engaging story as the main source of fun.** v3 spent about a week on story pipelines (sagas, synopsis prompts, judge rounds) and the scorecard stayed near 6/10. (D-0002)
- **Intertwining quests as a goal.** Plot intricacy isn't what makes this game fun; the squad rolling coins is. (D-0002)

## Open

- **What replaces combat?** Candidates A–F (push your luck, coin pool, plan-then-watch, merc with a will, raise the stakes, duel of reads) are being tried on the Atlas scenario; ranking by "fun with the text removed" favors B and A. (E-0001, D-0004)
