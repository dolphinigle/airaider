# Saga lab: Phase 0 baseline (today's storyteller)

I could not save `REPORT.md` at the root of `lab0`: the harness blocks subagents from writing report files. The full report is below. The table `score.ts` printed for A+B is at `lab0/A/REPORT.md`.

**What was scored.** Three sets of 12 fixtures each, run on the real gpt-5-mini with forced paths: `base_A`, `base_B`, and `base_B2` (B regenerated, called B′).

| reader seat | what it read |
|---|---|
| J1 gpt-5 (API, one text at a time) | all of A and B: 24 sagas, 184 texts |
| J1 Opus (files, honour system) | all of A and B: 24 sagas, 184 texts |
| J2 Opus (auditor) | B only: 12 sagas |
| J3 gpt-5 and J3 Opus (pair reader) | B vs B′: 12 pairs each |
| J4 gpt-5 (series reader) | two series of 10 |
| J4 Opus (series reader) | all 24 in a row, once forward, once reversed |
| mech (code) | A, B and B′ |

Confidence intervals are bootstrap 95% over sagas (2,000 resamples, seeded).

**How the Opus results got in.** `score.ts` could not see them where they were written, so I copied them into the folders it reads (details in §6.6). My extra splits, noise figures, J3 figures and latency medians are in `lab0/_score/extra.py` and `extra.out`.

## Headline

1. **Readers often cannot follow the saga cards, but M1 as built cannot show it.**
   - J2 graded every Opus paraphrase as right (M1 = 100%). The rubric counts "unclear" as a right answer when the card never states that part.
   - Counting "unclear" as a failure to follow gives **M1-strict = 59.6% [47.5–70.6]** over all B cards, and **25% (3 of 12) on card 1**.
   - Opus wrote "unclear" in 39 of 92 card paraphrases; gpt-5 in 2 of 92.
2. **Rereads are high: M5 = 57.6% [46.7–69.0]** (cards 66%, reports 49%). The G2 target is 15%. The Opus seat quotes a reread on 98% of texts, so "both seats reread" is in practice gpt-5's rate.
3. **Stories do not pay off.**
   - M8 (question answered): 50% [25–75].
   - The J1 readers themselves said the question was answered in 1 of 48 reads, partly in 14, not at all in 33.
   - **M11: 5.75 continuity errors per saga [4.6–6.9]**, 69 across 12 sagas.
4. **Taste scores depend mostly on which seat reads.** gpt-5 scores 2.9 points higher than Opus on every 0–10 scale (M2 8.14 vs 5.25; M3 7.46 vs 4.54). Per-text agreement between the two seats is only r = 0.36–0.48.
5. **J3 shows strong position bias, in opposite directions per model family.**
   - On "follow", gpt-5 picks the second saga 10 of 12 times; Opus picks the first 10 of 12.
   - B vs B′ (same storyteller) still split 75/25 in one family (gpt-5 "keep").
   - With 12 pairs per family, an M10 of 65–70% cannot be told apart from noise.
6. **Repetition: J4 averages 6.25/10** (gpt-5 5 and 6; Opus 7 and 7).
   - Premise, question, clue pattern and opening tics really do repeat.
   - But 10 of the 12 Opus "same story" groups are fixture pairs that share a seed, so they share a cast. That part is a lab artifact.
7. **Cost and speed:**
   - Cost: $0.040 per saga, $0.0105 per beat.
   - Latency: time from pursuing a lead to card 1 has a median of 86 s; card and report calls have medians of 14 s and 16 s.
   - Word caps are held on 39.5% of calls.
8. **No context-free verifier ran in Phase 0**, so there are no verifier findings (§6).

## 1. Baseline table, M1–M19

A+B pooled unless marked. "B" means the J2-graded set (12 sagas).

| # | metric | **base** | 95% CI | n | target G2 · G3 | note |
|---|---|---|---|---|---|---|
| M1 | Follow, objective (J2: paraphrase 3/3), as built | **100.0%** | 100–100 | 12 (B) | ≥ 85% · ≥ 90% and ≥ min(base+15pp, 97%) | ceiling; J2 graded only the Opus seat (§6.1) |
| M1-strict | same, "unclear" counted as not followed | **59.6%** | 47.5–70.6 | 12 (B) | — | card 1 only: **25%** (3/12) [0–50] |
| M2 | Follow, felt (J1 ease, cards) | **6.70** | 6.47–6.92 | 24 | ≥ base · ≥ base+1.0 | gpt-5 8.14 [7.89–8.37] · Opus 5.25 [4.98–5.55] |
| M3 | Want the next part (J1, reports) | **6.00** | 5.80–6.18 | 24 | ≥ base · ≥ base+1.0 | gpt-5 7.46 [7.20–7.70] · Opus 4.54 [4.26–4.80] |
| M3b | Want to send (J1, cards) | 6.44 | 6.26–6.62 | 24 | — | gpt-5 7.88 · Opus 5.00 |
| M4 | Send on card 1 | **100%** | 100–100 | 24 | ≥ base | 24/24 for both seats: ceiling, tells nothing |
| M5 | Reread (both seats quote one) | **57.6%** | 46.7–69.0 | 24 | ≤ 15% · ≤ 10% | cards 66.3% [53.6–79.0] · reports 48.9% [35.8–62.4] |
| M5′ | Reread, any one seat (per seat-text) | 77.7% | 72.0–83.7 | 24 | — | gpt-5 57.6% · Opus 97.8% |
| M6 | Report clarity: outcome / change (J2) | **91.5% / 100%** | 82.1–98.1 / 100–100 | 12 (B) | ≥ 95% / ≥ 85% | 4 outcome misses: B01 r3, B03 r2, B04 r2, B05 r3 |
| M7 | Retell, facts out of 3 (J2) | **2.75** | 2.50–3.00 | 12 (B) | ≥ 2.0 · ≥ 2.5 | Opus retells only |
| M8 | Question answered (J2) | **50.0%** | 25–75 | 12 (B) | 100% | J1's own view: yes 1/48, partly 14/48, no 33/48 |
| M9 | Answer not guessable from card 1 (J2) | **41.7%** | 16.7–66.7 | 12 (B) | ≥ 60% | |
| M10 | Pair preference | calibration only (§3) | — | 12+12 | ≥ 65% · ≥ 70% in both families | noise floor: a 75/25 split within one family |
| M11 | Continuity errors per saga (J2) | **5.75** | 4.58–6.92 | 12 (B) | ≤ 0.5 · ≤ 0.3 | 69 total; no saga is clean |
| M12a | Spoilers per saga (J2) | **0.92** | 0.42–1.50 | 12 (B) | 0 | 11, mostly the opponent or destination named on card 1 or 2 |
| M12b | Unmet names per saga (J2) | **1.50** | 0.92–2.25 | 12 (B) | 0 | 18; B07 names Songdis on all 5 cards |
| M12c | Unmet names per saga (code) | 1.13 | 0.83–1.38 | 24 | 0 | B′ 1.17 |
| M12d | Soldier names on cards per saga (code) | 0.25 | 0.08–0.46 | 24 | 0 | |
| M13 | Paperwork jobs (J2) | **22.9%** | 8.3–36.8 | 12 (B) | ≤ 12.5% | 8 of 35 non-finale jobs |
| — | Game-machinery wording per saga (J2) | 6.25 | 4.58–8.17 | 12 (B) | — | 75 quotes; 44 are the pay clause in prose |
| — | Bare role words for people, per saga (J2) | 0.75 | 0–2.08 | 12 (B) | — | all in B09/B10 ("the captive", "the client's") |
| M14a | Cards sharing an opening trigram (code) | **7.6%** | — | 92 cards | ≤ 15% | A 0% · B 10.6% · B′ 12.8% |
| M14b | Cards ending on "?" (code) | 0.0% | 0–0 | 24 | ≤ 25% | |
| M15a | Word caps held, raw output (code) | **39.5%** | 34.4–44.8 | 24 | ≥ 95% | |
| M15b | Hard failures per attempt (code) | 0.0% | 0–0 | 24 | ≤ 2% | 0 soft errors |
| M16 | Cost per saga / per beat | **$0.0403 / $0.0105** | $0.0370–0.0436 / 0.0102–0.0109 | 24 | ≤ $0.035 / ≤ $0.005 | |
| M17 | Median latency: pursue → card 1 · pursue → later card · card call · report call | **86.2 s · 14.6 s · 14.0 s · 16.3 s** | 82.7–89.6 · 13.7–15.2 · 13.4–14.7 · 15.2–17.2 | 24 / 68 / 92 / 92 | G2 ≤ base · G5 ≤ 15 · 5 · 6 s | genesis call median 71.1 s |
| — | Share of card-1 text copied from the prompt (code) | 57.6% | 50.9–63.7 | 24 | (earlier measure 52%) | B′ 64.3% |
| M18 | Designer | not measured at G0 | — | — | "I can follow it, and I want the next part." | suggested glance: B01 (a clean chase) and B10 (card 3 breaks) |
| M19 | Repetition, J4 (0–10) | **6.25** | 5–7 (range of 4 reads) | 4 reads | watch only | gpt-5 5 and 6 · Opus 7 and 7 |

**Spread across B (J2 labels):**
- Question types: where-is 5, who-did-it 2, why 2, the-past 1, what-is-it 1, in-time 1.
- Answer types: hidden-person 4, none 3, thing-or-place 3, bond 1, hidden-reason 1.
- Job types: find 19, talk 12, sneak 2, fight 1, other 1.

**Mechanical spread, A / B:**
- Card-1 trigram overlap between sagas: mean 0.013 / 0.016, max 0.19.
- Titles sharing a word: 0% / 17%.
- Distinct job sequences: 67% / 100%.

## 2. Noise band

This is what a change has to beat.

- "±" columns are half the width of the 95% CI.
- **A−B** compares the two fixture sets: same storyteller, different fixtures, unpaired.
- **B−B′** compares a regeneration of the same fixtures, paired, mechanical metrics only.
- **Seat gap** is gpt-5 minus Opus, paired.

| metric | base | ± A+B (24) | ± A alone (per-change) | ± B alone (gates) | A−B | B−B′ | seat gap |
|---|---|---|---|---|---|---|---|
| M2 | 6.70 | 0.23 | 0.31 | 0.32 | −0.30 [−0.70, +0.17] | — | **+2.89** [+2.60, +3.17] |
| M3 | 6.00 | 0.20 | 0.27 | 0.30 | 0.00 [−0.40, +0.40] | — | **+2.91** [+2.59, +3.27] |
| M3b | 6.44 | 0.18 | 0.26 | 0.28 | −0.01 [−0.36, +0.40] | — | +2.88 [+2.65, +3.11] |
| M5 | 57.6% | 11 pp | 12.5 pp | 17 pp | +17.7 pp [−4.7, +38.2] | — | — |
| M5′ | 77.7% | 5.9 pp | 6.3 pp | 9.3 pp | +9.9 pp [−1.8, +20.5] | — | −40 pp [−51, −29] |
| M1-strict | 59.6% | — | — | 11.6 pp | — | — | — |
| M8 · M9 | 50% · 42% | — | — | 25 pp | — | — | — |
| M11 | 5.75 | — | — | 1.17 | — | — | — |
| M12c | 1.13 | 0.27 | 0.33 | 0.38 | — | 0.00 [−0.50, +0.50] | — |
| M15a | 39.5% | 5.2 pp | 7.6 pp | 6.4 pp | — | +4.3 pp [−1.9, +10.3] | — |
| M16a | $0.0403 | $0.0033 | $0.0047 | $0.0047 | — | −$0.0009 [−0.0024, +0.0010] | — |
| card-1 copy share | 57.6% | 6.4 pp | 10.3 pp | 7.0 pp | — | −5.4 pp [−11.0, +0.1] | — |
| M17 pursue → card 1 | 86.2 s | [82.7–89.6] | — | — | — | B 88.2 s vs B′ 96.5 s [81.0–103.2] | — |

**What this means:**
- **A and B behave the same within noise** on every J1 metric, though M5 can swing about 18 pp between them.
- **Regenerating B moved no mechanical metric** beyond its confidence interval.
- **A per-change check on A (12 sagas) detects about ±0.3 on M2/M3 and ±12 pp on M5**, as long as the seats are the same. The G3 "+1.0" targets are well clear of that; G2's "≥ base" is a no-worse test with a ±0.3 band.
- **Compare taste scores only between runs read by the same seats.** The 2.9-point seat gap is nearly three times the G3 +1.0 target.

## 3. J3 position-bias calibration (B vs B′, same storyteller, blind)

| seat | kept base_B | followed base_B | kept the one shown first | followed the one shown first |
|---|---|---|---|---|
| gpt-5 | 3/12 = 25% [9–53] | 6/12 = 50% [25–75] | 5/12 = 42% [19–68] | **2/12 = 17%** [5–45] |
| Opus | 5/12 = 42% [19–68] | 6/12 = 50% [25–75] | 7/12 = 58% [32–81] | **10/12 = 83%** [55–95] |
| pooled | 8/24 = 33% [18–53] | 12/24 = 50% [31–69] | 12/24 = 50% | 12/24 = 50% |

These are Wilson 95% intervals.

- **Order.** Each fixture was shown to the two families in opposite order, so position only balances out when both are pooled. Within each family, "follow" is mostly a position pick: gpt-5 picks the second saga, Opus the first.
- **Agreement.** Because the orders are opposite, the two families pick the same version whenever both pick by position. They agree on follow 8 of 12 times and on keep 6 of 12.
- **Noise floor for M10.** A regeneration by the same storyteller produced a 75% split in one family (gpt-5 preferred B′ on "keep"). With 12 pairs per family, the 65% and 70% targets sit inside that floor. A new version would need to beat about 75% in each family at this size, or the design needs more reads (§6.4).

## 4. M19: repetition (J4 series readers)

**Scores.**
- gpt-5: 5 (A01–A10) and 6 (A11–B08). B09–B12 were left out of its series of 10.
- Opus: 7 forward and 7 reversed. Each read covered all 24 sagas, not the 10 the rubric specifies.
- Mean: 6.25.

**What the readers say repeats.** All four reads agree unless marked.
- **Premise:** a client will lose a home, claim, trade or harvest unless a missing person or object is recovered, and a warden, keeper or ranger holds it.
- **Question:** "where is it, who holds it, and will they let go?" It is a trace hunt, rarely a why. J2 agrees: where-is is 5 of 12.
- **Answer:** there is no twist. The opponent named on card 1 holds it, and is found through an object stamped with their mark: Dagnir's mark, Godefe's pendant, Gelthior's seal, Moryse's seal, Varasa's grove-mark. The target often slips out of reach.
- **Job pattern:** search or question a place (winter huts, burners' camps, inn, waypost), find the stamped token, follow it to a hideout, then a handover at dusk or low light by force, stealth or parley. About 20 of 24 open with a search, and the loggers' winter huts are searched in 5 sagas.
- **Opening:** the client arrives with the same tics:
  - "turned up with the tally-carts … kept looking back down the road"
  - "was waiting at first light"
  - "sent a rider ahead and came behind it"
  - "sent word twice"
  - refuses food or the chair; "looks at the door before answering"; "holds her gloves"
- **Phrasing:**
  - pay written into the story: "the fee is as agreed, and the company keeps what it hauls back", "what else shakes loose the company keeps", "goods off the dead"
  - "If this fails, X will lose Y"
  - "A warden intends to…", "stands against", "out of the company's reach"
  - the surnames Duskbough, Rootward and Windrow; Thornhollow six times
  - gpt-5 only: the exact title "Question pilgrims at …" twice (A02, A08)

**The repeat each reader noticed first:**
- gpt-5: "Two sagas literally begin 'Question pilgrims at …'" and "So many start by searching the loggers' winter huts."
- Opus: "Each story reuses the cast and place of the one before in new roles (Athelisa, Avron and Dagnir at the winter huts, Brimfja at first light)."

**Groups the readers called the same story:**
- gpt-5: [A02, A08], [A03, A04] · [B03, B04], [B01, B02, B07], [A12, B05, B06], [A11, B08].
- Opus: [A01, A02], [A03, A04], [A06, B06], [A09, A10], [B01, B02], [B09, B10] · [B07, B02, B01], [B10, B09], [B04, B03], [B06, B05], [A02, A01], [A10, A09].

**Lab artifact.**
- Fixtures come in pairs on one seed (A01 and A02 are both seed 101, and so on). Each pair is two fresh games of the same world, so the same cast and places come back in new roles.
- **10 of the 12 Opus groups, and 2 of the 6 gpt-5 groups, are same-seed pairs.** Cast reuse is therefore overstated here.
- The repeats in premise, question, answer, job pattern, opening and pay clause are not artifacts.

**Mechanical checks.**
- Card-1 trigram overlap: mean 0.013 (A) / 0.016 (B), max 0.19.
- M14a shared openers: 7.6% ("fouque of the", "brimfja a courtesan", "a woman who").
- Titles sharing a word: 0% (A) / 17% (B).

## 5. Worst baseline texts (both seats reread, lowest ease)

1. **A01 card 1** (ease: gpt-5 7, Opus 4). Both seats flagged the same sentence. No cavern and no captive has come up before it:
   > "A reclusive cairn-keeper, Godefe the Quiet, intends to keep her living toll held in the cavern. The fee is fixed, and what else shakes loose the company keeps."
2. **A06 card 1** (ease 7 / 3). Opus: "unclear why that saves the fort's grain."
   > "If he finds nothing, the fort loses its steady grain supply. A raiding caravan will seize passing grain wagons and force its mills into permanent levy. Any trace of the pack in Thornhollow is to be found, and no coin is owed."
3. **B06 card 3, the finale** (ease 6 / 3). Both flagged the same sentence. The chosen plan says "seize and hold Bangin in place", but Bangin is the company's own soldier and the target is Talso:
   > "If the survivor Talso demands token and public reckoning, Bangin will quit the night's watch rather than answer."

**Runners-up:**
- A03 card 1: "A kennel-master means to bring his piece to the vault himself and keep his hounds."
- A05 report 2: "a nailed scrap of leather nailed to an ash tree that read like a refusal"
- A11 card 6: Opus could not tell whether Secile is a person or a thing to dig up.

**J2's most common kinds of continuity error** (69 in all):
- clue objects jumping between hands or places (B07, B11, B12)
- a finale marked SUCCESS that narrates something else, or ends with the target lost (B01, B05)
- the twist appearing only in the chronicle, never in a card or report (B03, B06)
- people changing sex (B09, B11)
- failure reports replaying the same scene (B05)

## 6. Measurement problems to fix before Phase 1

Each item fixes the whole class, not one case.

1. **M1 is at ceiling and graded on one seat only.**
   - The J2 prompt pointed at `sagas/<id>/j1_*.json`, but the gpt-5 answers live in `judge/j1_gpt5/`, so J2 only ever graded Opus.
   - The rubric counts "unclear" as right when the card leaves a part out. That measures whether the reader is accurate, not whether the card can be followed.
   - Fix: J2 grades every J1 seat, and M1 counts an "unclear" part as not followed (M1-strict above). As built, the baseline already meets the G3 bar of "≥ min(base+15pp, 97%)".
2. **M5 "both seats" is really one seat.** The J1 rubric allows a quote you "would have had to" reread, so Opus quotes a sentence on 98% of texts. Either tighten it to "you did reread; empty if not", or define M5 on the gpt-5 seat.
3. **M4, M6b and M7 are at or near ceiling** (100%, 100%, 2.75 of 3) and cannot show a difference. Keep them only as checks that nothing got worse.
4. **J3 is dominated by position bias**, in opposite directions per family, with only 12 pairs per family.
   - Fix: each seat reads each pair in both orders (24 reads per family), and M10 counts only picks that hold in both orders.
   - Otherwise the bar for M10 must be about 75% per family.
5. **J4 does not follow its own spec, and its result is confounded.**
   - The Opus seat read 24 sagas instead of 10.
   - The gpt-5 seat dropped 4 sagas.
   - Same-seed fixture pairs inflate cast reuse.
   - Fix: series of exactly 10 sagas on distinct seeds, or one continuous campaign, identical for both seats.
6. **`score.ts` could not find the Opus seat outputs where they were written.**
   - Its `normalizeJ3` reads the folder path the Opus J3 seat records ("lab0/Bp/sagas/B01") as run "lab0" for both X and Y.
   - What I did: wrote normalized J3 copies to `B/judge/j3_opus/vs_base_B2/`, with X and Y resolved to base_B and base_B2 and the original paths kept.
   - I also copied the Opus J1 and J2 files from `sagas/<id>/j1_opus.json` and `j2.json` into `judge/j1_opus/` and `judge/j2_opus/`, and the J4 files into `A/judge/j4_opus/`.
   - The script should find seat folders itself.
7. **Context-free verifier: not run.** §5.1 lists verifier findings on today's prompts as a Phase-0 deliverable, and the build produced none. It still needs to run before any live Phase-1 run.

## 7. Spend

- **OpenAI, about $4.3 in all:**
  - generation: $0.52 (A) + $0.53 (B) + $0.54 (B′)
  - J1 gpt-5: $1.02 + $1.04
  - J3: $0.50
  - J4: $0.17
- **Opus seats:** 24 J1, 12 J2, 12 J3, 2 J4.

Files are in /tmp/claude-1000/-home-irvan-airaider/80974e3b-1108-4ee5-8d27-6e2a5e6f3904/scratchpad/lab0:
- A/REPORT.md
- _score/extra.py
- _score/extra.out