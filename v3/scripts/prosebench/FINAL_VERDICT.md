# Prose bench — final verdict (2026-07-18)

## SHIPPED: the "diet + stack" resolve style (was lab variant V3), now the DEFAULT
Replaces the old style block ("GAME WRITING, not literature… short sentences, mostly one clause,
no similes, mood-only sentence cut" + "every sentence changes the picture") with:
1. One positive register line: "Plain words, real events, no ornament — every sentence earns
   its place by what happens in it."
2. THE TELLING (3 rules): functional rhythm (shortest sentence for the moment that matters) ·
   one quoted line of speech where it changes something · load-bearing strangeness (a wonder
   two hired guards could replace is furniture — the designer's druid-ring class).
3. ABOVE-ALL rule 5 (end position): last sentence is a concrete act, an image, or a spoken
   line — never a tally of goods, never what it all meant.
`PROSE_VARIANT=v0` restores the legacy block; exemplar/stack/r2/r3/r4 remain as lab lineage.

## The measured curve (all judged blind on the frozen anchored bench; 21 judge-runs, calibration
## perfect throughout — holdout always 10, hidden repeats stable at 3 and 7-8)
| config | score | note |
|---|---|---|
| old prompts (V0) | ~4.5 (playthrough median 5) | "clear but dead"; failures worst |
| + in-voice exemplar only (V1) | 5.3 | wording lever ≈ nothing, as §0 predicts |
| exemplar + rule stack (V2) | 5.6→6.1 | ceiling up, garble floor down |
| **rules only (V3) — SHIPPED** | **6.5-7** | head-to-head 6.3 vs r4 5.3 |
| V3 + rotation + 4 more rules (r2/r3/r4) | 5.3-5.6 | every rule past ~4 paid for itself |

Peaks under the shipped config hit 8 ("'It won't come,' he said and left the gloves on the
roots"; the keeper who "turned pages until his finger stopped"); FAILURE reports went from the
worst class to among the best.

## The two design laws this bench established (both now in memory)
1. RULE BUDGET IS REAL: ~4 style rules is the ceiling for gpt-5-mini at LOW effort; the
   research-predicted 3-6 decay held exactly — r2/r3/r4 each added measured net-negative mass.
2. SINGLE-AXIS ROTATION STAMPS (3 molds = 3 stamps: palm-closers 4/8); combinatorial co-prime
   axes lifted variety 3→4-5 but cost per-sample quality — variety must come from INPUT shaping
   (archetype-weighted speech, scene atoms), not more prompt directives.

## Residual classes — STRUCTURAL, deferred to the story-interest phase (not prose-rule fixable;
## every one measured resistant to wording)
- Finale fate-formula echo ("The matter closed around X, who remained with the company") —
  present in BOTH head-to-head arms; comes from the fate instruction demanding an end-state.
  Fix belongs in the finale contract wording/engine, not style rules.
- Uncaused loot pastes (the mossgrown chair) — deliveredSummary input shaping.
- Orbit-summary of performative pivots (the laugh, the negotiation) — needs archetype-aware
  speech demand (engine knows cha-parley vs dex-stealth).
- Cross-report scene monotony (same ground staged 4 beats running; token-courier arcs) —
  chain/arc-skeleton content, the #1 item on the story-interest agenda.
- One-quote-per-report cadence — visible but cheap; revisit with input-shaped speech.

Records: RUBRIC.md · ANCHORS.md (frozen) · JUDGE_PROMPT.md · ROUND1-3_RESULTS.md · round1-key.md.
Campaign logs lived in the session scratchpad (ephemeral); every judged sample is quoted in the
round files and key.
