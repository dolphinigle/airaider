# Prose bench — the judging framework for "is this good to READ?"

Purpose: an **unbiased, anchored scale** for the prose quality of player-facing game text
(card situations, resolution reports, hooks). Built BEFORE any style tuning (designer directive
2026-07-18: "find a good 10/10 score, then judge the current score so you have an unbiased thing").
This measures WRITING QUALITY ONLY — the story skeleton, coherence, and rules-conformance are
judged elsewhere and are NOT this bench's business. A sample here is assumed coherent; the
question is whether a human ENJOYS reading it.

## What "good" means here (register contract)

The target register is **laconic game fiction**: session-log entries read once between dice
rolls. Icelandic-saga / field-report lineage — NOT literary fiction. So: economy is a virtue,
purple prose is a defect, and LENGTH IS NOT QUALITY (a 10 can be four sentences). The bench asks:
within this register, does the text read like a *teller* or like a *form being filled in?*

## The five dimensions (diagnostic notes, not sub-scores)

1. **FLOW** — sentence rhythm varies; reads aloud without monotone. Defect: chains of same-length
   one-clause sentences; "and … and" freight trains; every sentence opening subject-verb the same way.
2. **LIFE** — people behave like people, not units executing errands: a spoken line, a gesture,
   a visible want, a reaction. Defect: "spoke low and firm to the camp" (conversation reported
   from orbit); nobody ever answers anybody.
3. **THE TELLING DETAIL** — at least one specific that sticks and does story work (sensory, odd,
   particular). Defect: generic-medieval wallpaper (a fire, a camp, a road) — or atoms welded in
   without being *seen* ("a ring of salted pebbles" named but never made vivid).
4. **MOMENTUM** — events feel CAUSED (because/so, setup→turn), and the piece ends on a turn or an
   image, not a summary. Defect: beads-on-a-string event lists; closing ceremony/bookkeeping.
5. **CLARITY (gate, not a bonus)** — one skim still tells you exactly what happened / what's asked.
   A beautiful but ambiguous text CANNOT score above 5. This keeps the game-writing bar.

## The scale (holistic 1–10, anchor-defined)

- **10** — you'd screenshot it for a friend: "this game *writes*." Every dimension lands; at least
  one line you remember tomorrow. (See anchors A1–A3.)
- **8** — solidly enjoyable; a phrase worth keeping; small flatnesses allowed. (Anchor B1.)
- **6** — competent, clear, mildly pleasant; nothing sticks. You read it and move on.
- **4** — report-speak: clear but dead. Facts delivered in monotone; no human sound in it.
- **2** — slop: confusing, templated, echo-ridden, or AI-tells throughout.

Scores are INTEGERS. 7 means "between the 6 and 8 descriptions", etc.

## Judge protocol (bias controls)

1. Judges are FRESH agents with zero project context; they see: this rubric, the anchor texts
   with their fixed scores, then the samples **shuffled, unlabeled, provenance-blind** (no
   "current system" / "variant B" markers, no filenames, no dates).
2. Every batch includes the **calibration holdout** (anchor C-H, a text of known ~9–10 grade NOT
   listed as an anchor). A judge who scores the holdout ≤6 is discarded and replaced.
3. ≥3 independent judges per batch; report median and spread per sample; a sample's score is its
   MEDIAN. Judges never see each other's scores.
4. Judges must quote, for every sample scored ≥8 or ≤4, the line that earned it — a score with no
   quotable evidence is re-judged.
5. Anchors were authored/selected BEFORE any candidate system output was scored; anchors are
   never edited to move a baseline.

## Anchor set

Lives in `ANCHORS.md` beside this file. Composition rule: at least one **matched-content** anchor
(the SAME game-generated facts rewritten by a master hand — isolates craft from content), at
least one **external** anchor (great published prose in the target register — proves the 10 is
real, not house taste), and the 8-anchor from a shipped game the designer rates 8/10
(Fort of Chains). Diction note: anchors demonstrate CRAFT (economy, dialogue as combat,
the telling detail), never diction to imitate — archaisms in an external anchor are not the bar.
