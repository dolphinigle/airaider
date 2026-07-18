# Prose bench — round 1 results (2026-07-18, seed 90501, 8 report-samples/variant, 6 blind judges)

All 6 judges passed calibration (holdout scored 10 by every judge, both batches).

| variant | style change (resolve prompts only) | median | mean | scores (sorted) |
|---|---|---|---|---|
| V0 control | current prompts | **5** | 4.9 | 3 4 5 5 5 5 5 7 |
| V1 exemplar | rotated in-voice sample replaces style block | 5.5 | 5.3 | 4 4 4 5 6 6 6 7 |
| V2 exemplar+stack | V1 + rule stack | 6 | 6.1 | 4 5 5 6 6 7 8 8 |
| V3 diet+stack | positive one-liner + rule stack, NO exemplar | **7** | 6.5 | 5 5 6 7 7 7 7 8 |

The rule stack (rhythm / one spoken line / load-bearing strangeness / last-sentence-is-act-image-or-line)
is the ACTIVE ingredient; the exemplar alone ≈ +0.5 and adds nothing on top of the stack
(V3 ≥ V2 — contra the research prediction; our diet line + stack already fixes the register).
V0's median 5 replicates the designer-playthrough baseline (4-6) → bench is stable across batches.

Consistent with §0 levers: V1 = wording-only ≈ nothing; the stack's checkable rules (quota,
last-sentence) = structure/position lever — and the two biggest REMAINING classes are input-shaping
(actorStates pasting) and stamp-rotation problems, both engine-side.

## Residual defect classes (unanimous across judges; the round-2 worklist)
1. LEDGER CLOSERS survive in finales + investigate quests: "The matter closed around Ratchis
   Thatcher, who remained with the company" / "The job's question was answered and the party
   prepared to follow the trace" — the fate/storyUpdate machinery speaking in the last sentence.
2. WHEREABOUTS LEAK (sticky-string law): actorStates phrasing pasted into prose — "Cecelyna
   carried the half-burnt token on the sill"; unintroduced prop manifests ("the braid and the
   smouldered stake"); mid-scene renames (Silent Carving → "the cup").
3. DEMONSTRATIVE-QUOTE STAMP (new, stack-induced): reports close on "That's the road." /
   "That proves the path." / "That knot answered where it passed." — the spoken-line rule
   satisfied formulaically, drifting gnomic.
4. SYSTEM VOCABULARY leaking: "forced a payment of temper", "fed the ward the named oath it
   wanted", "The spear made the exchange", "loose and unclaimed".
5. Minor: word echo inside a sentence ("levered with the bar until the iron bar snapped");
   speech-summarized-from-orbit persists wherever the quota isn't triggered (V0/V1 only).

## Stamp judges (cross-report repetition, one judge per variant, full 8-report sequence)
ALL FOUR variants scored variety 3/10 — per-sample quality rose but shapes rubber-stamp:
- V0: arrival opener 8/8; possession-ledger closer 6/8; "produce token → name mark aloud →
  blocker yields" ritual 5 reports straight (R3/R5/R7 "the same scene re-shot").
- V1: arrival opener 8/8 (4 with time-of-day tag); ledger closer 7/8; extract-from-clutching-
  terrain ×4; "wrapped the X" ×3.
- V2: "said + exit-step" closer welded 8/8; demonstrative "That…" verdict quote 5/8;
  "shoved past" ×4; "crude" epidemic; "turned for the fort" verbatim ×2.
- V3: "drew up to" opener ×4; NPC-gets-last-word 6/8 ("the keeper said" ×3); seated-gatekeeper-
  with-object-at-feet tableau ×5; lay-credential-unlock ×3; "cut the cord" verbatim ×2.
STRUCTURAL (not prose-fixable here, → story-interest phase): the token ritual / credential-unlock
/ seated-gatekeeper staging come from arc-step + card design; logged for the arc-shape ruling.

## Round-2 design (adopt V3 as base)
- Drop the exemplar (cost, no gain). Keep diet line + stack.
- CLOSER ROTATION (engine-side, rotation precedent = pay-gloss pools): rule 5's demanded ending
  rotates per call among act / image / short exchange — kills the demonstrative-quote stamp a
  per-call prompt cannot see.
- WHEREABOUTS in own words: actorStates = where things START, retold fresh — never its phrasing
  (+ candidate log-only lint: n-gram overlap between actorStates strings and prose).
- Finale/storyUpdate: the last sentence belongs to the fiction — the fate lands as an event,
  never as a status line.
- System-vocab: extend the never-echo list with the observed leaks (constructions as positives).
