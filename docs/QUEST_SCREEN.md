# 🎯 THE QUEST SCREEN — goals, and the checklist that stops the drift

**Status: goals fixed 2026-08-28, before any code.** Revert point: `git reset --hard pre-questscreen`.
The approved look is `docs/proto/muster.html` (variant G). Every step of the build is checked against
§1 and §5 below; anything that cannot be traced to a goal is drift and gets cut.

---

## 1 · THE GOALS

**G1 — A quest is its own page.** You open it, read the writ, decide, and leave. Not a block in a
scrolling list.

**G2 — You place soldiers by dragging cards from a hand that is always on screen — and never ONLY
by dragging.** Every place a drag works, a click works too. (Sultan ships drag, right-click
quick-place, and keyboard filtering; forcing the drag is the single easiest way to make this
annoying.)

**G3 — The saga's own people are already on the board, held in place.** Readable, never movable —
Sultan's "involved" cards, held down with brackets. They are how the player meets a face instead of
only reading a name.

**G4 — A routine quest never costs a decision the player doesn't want to make.** One click mans it
sensibly, *from the board, without opening it*. Designer: *"make sure routine quests have an auto
assign or something or this could get annoying fast."*

**G5 — Whatever ships in the GUI ships in the text UI, the same session, through the SAME engine
code.** Not a port, not a copy — one `autoAssign`, one cast accessor, both surfaces calling it. The
CLI is the only surface that can be playtested here; if it drifts, the playtest is worthless
(`docs/DOGFOODING.md`).

**G6 — Readability outranks atmosphere.** No rotated, skewed or arced body text. Colour and
background come from the same token set on every surface. Both rules exist because a mockup broke
them and was rejected on sight.

**G7 — It holds across the real range of content.** A one-sentence routine card *and* a five-sentence
saga beat. One slot and four. With approaches and without. Zero cast and three.

**G8 — Nothing regresses.** The writing work stays where it was measured, the suite stays green,
existing saves still load.

---

## 2 · NON-GOALS (say no to these)

- Rebuilding the fort, roster, or reckoning screens. Only the quest surface.
- New art or per-location illustration. The design exists *because* we have none.
- The plain-language slot line (*"Someone who can read the ground"*) — **Phase 4, deliberately.** It
  needs either a new AI output field, which risks the prompt just stabilised, or an engine phrase
  table, which will stamp exactly as L19/L20 predict. It ships as its own measured change.
- Changing how odds, coins, bars, or difficulty are computed. The screen only displays them.

---

## 3 · DECISIONS TAKEN (assumptions, flagged)

| | decision | why |
|---|---|---|
| **Unmet cast** | Not shown at all. The rack holds only people the player has met. | Designer: *"the unrevealed ones shouldnt be in the quest list imo."* Kept behind a one-line flag in case the face-down card is wanted back. |
| **Oracle** | Coins-vs-bar and the plain-language odds line are always visible; the needle and the **%** appear only with an Oracle. | Preserves the existing progression (`questOdds().precision`). Auto-assign stays free — it reads only coins, which are already on screen. |
| **Approaches** | `autoAssign` REFUSES when no approach is chosen. | Recruit vs captive vs cash-out is a story decision. Auto must not make it silently. |
| **Injury** | A penalty, not a bar. | The engine lets a wounded soldier march; that is the player's call. Auto merely prefers not to. |
| **Ordering** | `autoAssignAll` takes most-constrained quests first (`must-be`/`must-have`), then soonest to lapse. | One soldier can only be on one quest, so order decides who gets the good people. |

---

## 4 · PHASES

1. **Engine** — `autoAssign`, `autoAssignAll`, `questCast`, one shared `metNames` helper, tests.
2. **CLI** — `auto <id>` / `auto all`, the cast block, list pips. Real-AI playtest, iterate.
3. **Web** — cast on the DTO, the actions, the quest page, board rows. Then playtest the real page
   in a real browser and READ THE SCREENSHOTS.
4. *(deferred)* the plain-language slot line.

---

## 5 · THE ANTI-DRIFT CHECKLIST — run after every step

1. **Does it work in the CLI too?** (G5) If a feature exists only in the web, stop and fix it.
2. **Does it go through engine code both UIs call?** (G5) A second implementation is a bug.
3. **Is any text rotated? Is any colour set on a surface it doesn't belong to?** (G6)
4. **Does it still hold for a ONE-SENTENCE card with no cast and one slot?** (G7)
5. **Did I add a fixed dealt string that will get pasted verbatim?** (L19/L20)
6. **Can a routine quest still be manned without opening it?** (G4)
7. **Suite green? Saves load?** (G8)

---

## 6 · MEASURES

- **M1** `npm test` green, plus `test/assign.test.ts`.
- **M2** a real-AI CLI campaign in which every quest is manned by `auto` alone, no `assign` typed.
- **M3** screenshots of the real page at three content shapes (one-sentence one-off · saga beat ·
  finale with approaches), read and judged.
- **M4** the beat-1 writing numbers unchanged from `docs/CARD_GOLD_STANDARD.md`.
