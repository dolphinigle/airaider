# Dialogue-framing A/B (2026-07-19) — batches L (resolutions) + M (cards) + preference pass

Designer directive: "for ALL player facing texts, is it easier to read if they were framed as
dialogues?" — cards as the bearer's own first-person words (`[a washerwoman] My friend lent me a
pestle…`), resolutions as a played scene (`[Narrator]` lines + character speech).

## Config
- Lab variants in openai.ts, env-gated, default untouched: `CARD_VARIANT=dlg` (card = bracketed
  bearer + first-person pitch, station diction within plain period words, pay in kind never a sum,
  beat-1 teller = the client) · `PROSE_VARIANT=dlg` (resolution = script lines; sentence-rules bind
  the [Narrator] lines; tags outside word counts; lone soldier gets no invented listener).
- Both dlg prompts passed the context-free verifier gate (2 fresh audits + 1 re-audit after fixes;
  the audits also flagged PRE-EXISTING classes — see worklist note at bottom).
- Generation: campaignread 10 cycles, seed 90701, both arms — same engine inputs, ~$0.08/arm.
- Judging: frozen protocol (anchors/rubric untouched; judge-facing copies stripped of the holdout
  sections). 5 fresh blind judges per batch, medians; plus a 3-judge paired-preference pass per
  register (same-slot pairs, arm order randomized). Judge seats ran on Opus (calibration gate makes
  judge strength non-critical; more independent seats > fewer stronger ones).
- Calibration: holdout scored 10,10,10,10,10 (L) and 10,10,10,9,9 (M) — zero discards. NOTE: the
  batch-I briefing holdout (FoC out_of_retirement) text was never stored; M reused the C-H report
  holdout as fallback.

## Result — a clean split by surface
| surface | base median (mean) | dlg median (mean) | preference (all judges×pairs) |
|---|---|---|---|
| CARDS | 5.5 (5.75) | **6.5 (6.38)** | **dlg 15 : 9 base** |
| RESOLUTIONS | **7 (6.63)** | 6 (5.88) | 6 dlg : **18 base** |

Per-pair card preference was UNANIMOUS in all 8 pairs (3:0 each way): dlg took P2/P5/P6/P7/P8,
base took P1/P3/P4. The three base wins are exactly the dlg failure classes below.

## Why cards WIN in voice (judge evidence)
The winning card samples are the voiced ones with a live witness: the sentry's beheaded horses
(M9=7), the tenant farmer's "a scrap of cloth with a foxglove mark… the church chisel too, the one
with the carved cross. I cannot fetch it myself" (M13=7, one judge 8), the dlg finale's "I will pay
coin and a crate of salted meat if you bring Gunmar to me alive" (M12=7 — beat base finale 5).
Judges' class findings on the LOSING base cards: "voice-from-orbit", "report-speak openers",
"conversation reported from orbit". First-person voice buys the LIFE dimension that the base
briefing register keeps failing.

## Why script resolutions LOSE (judge evidence)
- Format chop: "the tagged style felt segmented and mechanical, draining momentum"; "chopped and
  inventory-like" — preference judges chose flowing prose 18/24.
- NEW STAMP: speech-as-stage-direction — characters announce the next task instead of talking
  ("Hold still." "Keep him down." "Chest first, chisel next."); one judge made it the batch's #1
  defect. The one-quoted-line-that-changes-something rule did MORE with less.
- The two worst dlg samples garbled where the format demanded extra juggling (L7=5 clotted clause
  chain; L12=5 finale abstraction) — consistent with the demand-overload law (3× measured).
- dlg's best resolution (L10=7, the Yarstead rune-scrape) equals base's TYPICAL score.

## dlg card failure classes (fix before any ship)
1. SAGA-CARD VOICE BREAK: mid-saga/finale re-grounding rules collide with first person — the
   client narrates himself in third person ("[Drelden] Drelden is a pewterman…", M7=5, worst dlg
   card) or recites the company's own record back at the player. Beat-1 and one-offs don't suffer it.
2. Place-name scatter in voice (P1's peddler card smeared the ask across 3 names).
3. Self-narrated gestures ("I press a small pewter token into your palm") — stage-direction-in-mouth.

## SHIPPED 2026-08-28 for one-offs (see CHEAP_MODEL_PROMPTING L29)
Re-benched on the current prompts and shipped: `CARD_VARIANT` now defaults to `dlg` and the
saga branches are **removed**, not merely disabled — failure class 1 below is still unfixed,
so a saga card must never take the voice until it is. Resolutions stay prose, as ruled here.

## Verdict (2026-07-19, pending designer ruling — player-facing format change)
- Resolutions: KEEP PROSE. Script format is measured-worse on both instruments.
- Cards: the VOICED PITCH is a real lever (+1 median, unanimous preference on commons) — candidate
  to ship for one-offs; saga cards need the voice-break class fixed and re-benched first.
- If voiced cards ship for sagas: recurring tellers need a voice line (bible cast `voice:` field)
  for speech-pattern consistency — phase 2, designer-gated.

## Provenance key (batches L/M + pairs)
L: dlg = L1(q46) L3(q24) L7(q31) L9(q8) L10(q51) L12(q39 finale) L13(q53) L16(q10 partial);
base = L4(q30) L5(q10) L6(q61) L8(q54) L11(q59) L14(q47 finale) L15(q8) L17(q35 FAIL); L2=HOLDOUT.
M: dlg = M1(hunt) M3(beat1) M7(beat2) M9(contract) M10(investigate) M12(FINALE) M13(raid)
M16(rescue); base = M4(beat1) M5(rescue) M6(raid) M8(hunt) M11(investigate) M14(FINALE)
M15(contract) M17(beat2); M2=HOLDOUT.
Pairs (dlg side): R1v1 R2v2 R3v2 R4v2 R5v1 R6v1 R7v1 R8v1 · P1v1 P2v2 P3v2 P4v2 P5v1 P6v1 P7v1 P8v1.
Campaign logs + full judge JSONs lived in the session job dir (ephemeral).

## Pre-existing prompt defects the verifier audits surfaced (NOT dlg's — separate worklist)
questId output field has no sourcing instruction (both resolve prompts); saga resolve inputs list
omits chainContext/storyState/bible; saga edge-id line references deliveredCharacters the saga never
carries; beat-1 "open on the CLIENT" vs head-frame "open on what has just changed" tension; the
"ONE LEDGER" instruction word vs the account-book ban; dead "JSON field whose schema demands a
number" exception (no numeric field in card schema).

## Round 2 (2026-07-24) — post-hoc chip-splitting (SPEECH_ANCHORS), the designer's RPG-alternation ask
Design: prose UNCHANGED (the measured winner); the model additionally LISTS its own quotes
verbatim with speakers (extraction, not composition); the engine splits display at anchored
quotes into narration blocks + [Speaker] "line" chips, safe fallback on any mismatch.
- CHEAP-MODEL FIDELITY (the designer's worry): 100% — every listed quote anchored verbatim
  (5/5, seed 94401); a multi-sentence quote missed the splitter once (graceful inline fallback).
- Same-text pairs (6, order-alternated), 3 blind judges: **paragraph 17 : chips 1.**
- WHY (unanimous): our reports carry 0-2 short quotes with attribution baked into the sentence;
  extracting the quote strands subjectless em-dash orphans ("— walked toward the path…"), the
  chip repeats a name the adjacent narration just gave, and one chip per report chops a
  read-once log without the RPG payoff. "Chips earn their keep in exchanges; these logs have none."
- The ONE chip win (P6): the quote stood ALONE between complete sentences. Convergent judge law:
  **chips need text GENERATED for that shape — standalone speaker-led quote sentences and 2+
  exchanges — never converted after the fact.** But generating for that shape = the script
  format that lost round 1. VERDICT: resolutions stay prose (measured twice, two designs).
  The bench-backed dialogue lever remains the round-1 VOICED CARDS win (+1, ruling pending).
Code kept as env-off lab lineage: SPEECH_ANCHORS=1 (openai.ts speech extraction line,
game.ts renderWithBubbles).
