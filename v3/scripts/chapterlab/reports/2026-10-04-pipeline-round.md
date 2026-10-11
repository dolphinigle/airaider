# Pipeline round (seed1): four input-pipeline arms on kit+pick, three generations each, read blind. Sonnet writer, 2026-10-04

**Run.**
- Folders: `runs/seed1/{B2,C1,C2,C3}_g{1,2,3}/<slot>/` (24 slots each, 288 sagas) and `runs/seed1/A2c/` (the shipped arm's third generation).
- Every saga replays A2's dealt world. 336 of 336 deals are byte-equal to A2's (cast, offered keywords, tone, places). Soldiers, dice and paths are the probe's.
- 312 of 312 sagas completed on the first pass: no fallback, no redraw, no floored pick or core call.

**Judging.** J3 whole-saga pairs. Each arm's generation g was read against the shipped arm's generation g (A2, A2′ = `A2b`, A2″ = `A2c`), each slot in both orders.
- That gives 72 slot-pairs and 144 reads per arm, 574 reads in all.
- **C1 has 142 reads, not 143.** Two reads are missing (C1 g1 F4_2 and F4_3 with C1 shown second), and the tally counted one placeholder row as an A2 read. The corrected C1 numbers are used below. The held counts were already right.

**Rule (North Star 0).** Readability first: **follow decides; keep is only watched.**

| arm | the one change on top of kit+pick (A2) |
|---|---|
| **B2** one | the pick ranks the keywords and the plan gets only the top one (the same atom in all three generations in 22 of 24 slots) |
| **C1** core | before the plan, a small call (plan tier) writes {want, question, answer, against}. The plan takes the question and answer as fixed |
| **C2** grafts | R6's class fixes. (a) The road prints the plan's own why for each later job; there is no outline call, and a flagged why leaves the title only. (b) Each card's hope goes to its report. (c) The engine writes the finale buttons. (d) The answer no longer has to fit every ending. (e) The gold way is worded as paid |
| **C3** sides | the plan writes each person's side (≤ 8 words); cards and reports get it for the people present |

**The noise floor.**
- A2′ against A2 is the same arm on the same deals. Over 24 slots it split follow 22–26 (held 9–11), so one run resolves about ±9 held slots.
- Pooled over three generations (about 60 held pairs), two identical arms land within **±15 held** 95% of the time.

## 0. Verdict

- **Ship C2 (grafts), pending two designer rulings (§3).**
  - **Follow: 83–61, held 37–26** (p ≈ 0.21). That is inside the ±15 floor, so it is not a measured gain.
    - It is ahead in **every generation**, each against a different incumbent draw: 28–20, 28–20, 27–21 (held 14–10, 11–7, 12–9).
    - It wins whether shown first (44/72) or second (39/72).
    - Earlier seed1 arms were each judged on a single draw.
  - **Keep: 93–51, held 41–20** (p ≈ 0.01). This is the first seed1 margin beyond the noise floor, and it is ahead in all three generations.
  - **What C2 removes, by construction or by the readers' count:**
    - option spoilers (the engine writes the buttons);
    - stock hoard answers: 16 of 72 → 5;
    - detour blame: 20% of A2's follow losses → 5% of C2's.
  - **Cheaper and faster:** $0.096 per saga against $0.105, and card 1 at about 44.5 s against 48 s. There is no outline call.
- **C1 (core) is a measured loss. Remove it.**
  - Follow 26–116, held 6–51 (p ≈ 6·10⁻¹⁰). It lost every generation: 1–16, 3–19, 2–16.
  - Keep is flat (70–72): the core writes good hooks that the plan then cannot build to.
- **B2 (one keyword): don't ship, and don't add it to C2.**
  - Follow 80–64, held 33–25 (p ≈ 0.36). It lost generation 1 (21–27), and the slots split 8–9.
  - Keyword blame went to zero (0 of its 64 follow losses, against 8 of A2's 80), but that bought no consistent gain.
  - C2 already cuts keyword blame to 3 of 61.
- **C3 (sides): don't ship.**
  - Follow 80–64, held 33–25. The generations went 11–10, 14–7, 8–8.
  - Side confusion did not fall: it is in 19% of C3's follow losses, against 11% of A2's.
- **Next (item 8): D1, "the card reads the report", on top of C2** (§3.4).
  - Contradictions are now the top blame class against every arm.
  - One shipped input causes a share of them: the next card is written from the plan's forecast `win`, not from the report the player just read.

## 1. Results per arm

"Held" is arm–A2 with flips in brackets. p is a two-sided exact sign test on held pairs (flips dropped). "1st / 2nd" counts the arm's wins out of the reads where it was shown first and where it was shown second.

**Follow (decides)**

| arm | all reads | arm 1st / 2nd | held (flipped) | p (held) | g1 · g2 · g3 reads | g1 · g2 · g3 held |
|---|---|---|---|---|---|---|
| B2 one | 80–64 | 45/72 · 35/72 | 33–25 (14) | 0.36 | 21–27 · 31–17 · 28–20 | 8–11 · 13–6 · 12–8 |
| C1 core | **26–116** | 17/72 · 9/70 | **6–51 (13)** | **6·10⁻¹⁰** | 8–38 · 8–40 · 10–38 | 1–16 · 3–19 · 2–16 |
| **C2 grafts** | **83–61** | 44/72 · 39/72 | **37–26 (9)** | 0.21 | **28–20 · 28–20 · 27–21** | **14–10 · 11–7 · 12–9** |
| C3 sides | 80–64 | 42/72 · 38/72 | 33–25 (14) | 0.36 | 25–23 · 31–17 · 24–24 | 11–10 · 14–7 · 8–8 |

**Keep (watched)**

| arm | all reads | arm 1st / 2nd | held (flipped) | p (held) | g1 · g2 · g3 reads | g1 · g2 · g3 held |
|---|---|---|---|---|---|---|
| B2 one | 81–63 | 36/72 · 45/72 | 34–25 (13) | 0.30 | 23–25 · 32–16 · 26–22 | 8–9 · 14–6 · 12–10 |
| C1 core | 70–72 | 32/72 · 38/70 | 27–28 (15) | 1.0 | 22–24 · 25–23 · 23–25 | 9–10 · 9–8 · 9–10 |
| **C2 grafts** | **93–51** | 45/72 · 48/72 | **41–20 (11)** | **0.010** | 36–12 · 29–19 · 28–20 | 15–3 · 13–8 · 13–9 |
| C3 sides | 73–71 | 38/72 · 35/72 | 33–32 (7) | 1.0 | 27–21 · 22–26 · 24–24 | 12–9 · 10–12 · 11–11 |

**Slot level.** For each slot, which side held more of its three generations (arm majority – A2 majority – tied):

| | follow | keep |
|---|---|---|
| B2 | 8–9–7 | 10–8–6 |
| C1 | 1–23–0 | 11–11–2 |
| C2 | **12–7–5** | **14–5–5** (p ≈ 0.06) |
| C3 | 10–9–5 | 10–12–2 |

**Against the floor.**
- **C1 is far outside it.** A loss of −45 held, against a floor of ±15.
- **C2's follow (+11 held) is inside it, but it is the only arm ahead in all three generations.** With three independent draws, an arm no better than A2 would come out ahead in all three only roughly 1 time in 8. That is a direction, not a measurement.
  - C2's keep (+21) is outside the floor.
- **B2 and C3 (+8 each) are inside the floor and inconsistent.** Each lost or tied a generation, and their slot majorities are even.
- **The arms share some wins on A2's weak slots:**
  - F1_2: B2, C2 and C3 all won follow in all three generations. Each A2 draw built on a different third keyword there (hook / grape harvest / weeping beehive), and readers blamed two of them for it.
  - F7_3: B2 and C3 won 3 of 3 and C2 won 2 of 3.
  - So part of every arm's margin is these slots.

**Position bias.**
- Follow: the saga shown first won 313 of 574 reads (55%). Seed1's earlier rounds showed none (51%).
- Keep: the first saga won 271 of 574 (47%), the same slight lean to the second saga as before.
- Each arm was shown first in exactly half its reads, so the bias cancels out of the tallies.

## 2. Reasons, by class

**How counted.**
- I tagged every follow reason (574) by what it blames the losing saga for. One read can carry two or three classes.
- These are hand tags of one reader's text, so the shares are approximate.
- The A2 column is the same reader blaming A2 in that arm's comparison, which makes it a within-comparison baseline.

| class (what the reader blames) | B2 losses (64) | A2 in B2 pairs (80) | C1 losses (116) | A2 in C1 pairs (26) | **C2 losses (61)** | **A2 in C2 pairs (83)** | C3 losses (64) | A2 in C3 pairs (80) |
|---|---|---|---|---|---|---|---|---|
| keyword forced in / keyword detour | **0%** | 10% | 3% | 8% | 5% | 11% | 2% | 11% |
| detour or errand job | 14% | 19% | 21% | 15% | **5%** | **20%** | 17% | 22% |
| side or identity confusion (helper turns target, who is who) | 14% | 15% | 22% | 19% | 21% | 14% | **19%** | **11%** |
| set up nowhere (often only in the finale) | 41% | 45% | 42% | 31% | 36% | 35% | 48% | 36% |
| contradiction (pronoun, place, object state, card vs report) | 34% | 26% | 28% | 42% | **54%** | 34% | 30% | 31% |
| garbled sentence | 22% | 4% | 10% | 0% | 10% | 7% | 14% | 5% |
| reveal does not add up | 41% | 50% | 37% | 27% | 43% | 45% | 41% | 45% |
| **the printed open question is garbled or spoils** | 0% | 0% | **16%** | 0% | 0% | 0% | 0% | 0% |
| the client's reason unclear | 0% | 0% | 4% | 4% | 2% | 4% | 2% | 8% |
| spoiler (button, plan line, early leak) | 2% | 1% | 0% | 0% | 0% | 1% | 2% | 0% |

**Mechanical counts, from the 72 plans of each arm.**

| | A2 (A2, A2′, A2″) | B2 | C1 | C2 | C3 |
|---|---|---|---|---|---|
| question length, words (mean) | 14.1 | 13.9 | **25.7** | 14.7 | 14.2 |
| compound questions ("or why", "and who", …) | 13 | 5 | **42** | 18 | 9 |
| "Nobody knows that …" questions (a statement, which spoils) | 0 | 0 | **6** | 0 | 0 |
| answer length, words (mean) | 42.0 | 41.6 | **61.6** | 42.0 | 38.7 |
| hoard answers (hoard / treasure / buried / vault) | 16 | 20 | 4 | **5** | 7 |
| gold button that names a hoard, treasure, vault or burial | 35 | 35 | 42 | **0** (engine) | 39 |
| plans with a beast-hunt job | 15 | 8 | 7 | 12 | 12 |
| keywords given to the plan | 216 | **72** | 215 | 216 | 215 |
| road rows written from the plan's why / flagged (title only) | — | — | — | 89 / 10 | — |
| gold finales that say "paid the company to go free" | 0 of 18 | 0 | 0 | **15 of 18** | 0 |

### 2.1 C2: detours gone, contradictions now the top class

- **Removed: detours.** 5% of C2's losses blame a job that does not serve the goal, against 20% of A2's losses in the same pairs. Keyword detours fell too (5% against 11%), although C2 still gets all three keywords.
  - **Why:** every later job on card 1's road carries the plan's own reason for it, and each card's hope goes to its report. The report then says whether the hope was met, so a job never looks like an errand.
  - Readers credit C2 for exactly this:
    - "X's aim is plain throughout: toll-silver, proof of smuggling, the ledger, catch the buyer" (F1_2 g2).
    - "Each step points to the next: steal the book, the book names the mason, the mason names the shaft" (F8_1 g1).
    - "Each report ends on a clue that sets up the next job" (F4_1 g2, keep).
- **Removed by construction:**
  - **Option spoilers.** The buttons are engine-written ("Corner the elf wanderer and make her pay to go free"), never the plan's "Take the treasure the wanderer carries". In the plan-written arms, a hoard, treasure or vault sits in the gold button in about half of all sagas (35–42 of 72).
  - **Stock answers.** Hoard answers fell 16 → 5, because the answer no longer has to fit every ending. This is ledger law 6(f), now confirmed by an arm.
- **Not removed:**
  - **Contradictions:** 54% of C2's losses. Examples:
    - "Jervaise leads out Thiile, the burner, where the brother should be" (F2_1 g1, both orders);
    - "hides seized in part 1 yet the finale says 'take back the hides'" (F5_1 g3);
    - "Urreturre holds the painting, yet the job is to stop the merchant taking it" (F3_1 g3).
  - **Side confusion:** 21%. Examples:
    - "Marsilia points out the forged seal and then is the thief" (F5_1 g2);
    - "Eussorus is a helpful merchant, then a hired scout, then the man behind the raids" (F3_3 g2).
- **New, small: a printed hope is a promise.** "The kite was meant to call Bameni's kin but never flies" (F8_2 g3, both orders). The why on the road promises a use, and nothing makes a later text keep it. Watch it; 3 reads so far.
- **The gold way's wording is pasted.** 15 of 18 gold finales end on some form of "He paid the company to go free". No reader blamed it, but it is a stamp, and it collides with "no pay in prose" (§D4). It needs a ruling (§3).

### 2.2 C1: a call blind to the jobs fixes the story, and the plan cannot point at it

- **Added: the printed open question breaks.** The core writes questions nearly twice as long as the plan's (25.7 words against 14.1), 42 of 72 are compound, and 6 are statements. The quest log prints the question on every card after card 1.
  - "Open question: that the thefts were never meant to ruin the wolfkin but to hide that the ferry landing's old torch-post marks the only crossing into the elven old-growth…" (C1 g2 F6_2).
  - Readers: "the 'Open question' line is a long hidden-truth sentence about elven old-growth that I can't make sense of" (F6_2 g2); "a garbled spoiler ('not a person at all')" (F1_3 g3); "the opening line ('who pays it, brews false ale, and keeps alive the betrothal contract') is hard to parse" (F2_1 g1).
  - This class is in 16% of C1's losses. It appears in no other arm.
- **Added: culprits and reasons from nowhere** (42% of losses).
  - The core's answer is fixed before any job exists.
  - The plan, told to treat it as "fixed facts … never changed", builds jobs that do not lead to it:
    - "the finale hangs on a confession from Beraren Windrow, an elf goatherd never mentioned before" (F5_2, g1 and g3, 4 reads);
    - "the herbalist Hurdalas first shows up on the finale card" (F8_2 g2/g3);
    - "sends me after 'the glovemaker', whom the carter never mentioned" (F5_1 g3).
  - Detours (21%) and side confusion (22%) follow from the same cause. Jobs serve the dealt types, not the answer, and the core's `against` often half-answers the question (verifier item 6).
- **Why keep stayed flat.** The core writes stronger hooks than the plan does:
  - "a sister jailed for a debt she never took" (F7_1 g1);
  - "a crow-hung gallows with a fresh candle every night" (F4_2 g2);
  - "My daughter sleeps in that box" (F4_1 g2);
  - "a lighthouse burning … above a flooded mine" (F8_1 g3).
  - The interest is real; the plan cannot deliver it.
- **The same law, a third time.** The outline call blind to the plan (detour jobs), the premise call (A4: hooks with no answer) and now the core call (an answer with no jobs) all failed in the same way. A step that fixes story facts must see what has to point at them. Splitting the work helps only when it happens downstream: card 1 as its own call worked, and C2's road is the plan's own text.

### 2.3 B2: the keyword class is gone, and nothing else moved

- **Removed:** no B2 follow loss blames a keyword (0 of 64). In the same pairs, A2 was blamed 8 times:
  - the pike (F4_3: "In X each clue leads to the next: inn, boat, silver, camp");
  - the eclipse (F8_1);
  - the wager (F6_3);
  - the white stag (F1_3).
  - B2 also has fewer beast-hunt jobs (8 against 15).
- **Not removed:** everything else is at A2's rate. Some examples:
  - set up nowhere: "brings in the farmer from nowhere" (F2_2 g1);
  - identity: "X calls the wrecker 'it', then adds a hunter, a bear and 'pots made for the wrecker'" (F1_1 g1).
  - Three losses say the one object was found in part 1 and the rest felt like filler (F5_1 g1, F5_3 g1). That is a cost of having one thread with nowhere else to go.
- **Why no consistent gain.** The keyword misfit was about 10% of A2's follow losses. Removing it entirely moves a 72-pair tally by a few held slots, which is below this floor.

### 2.4 C3: sides do not stop side swaps

- **Not removed: side confusion.**
  - "Muvulrea helps in part 1 and then has to be fought" (F4_2 g1, both orders).
  - "why Atodir, her guard captain, shakes hands for Brammarch" (F8_3 g1).
  - "the cooper 'took Hawwick's side' in a peace job" (F8_3 g3, both orders).
- **The plan still makes a helper the culprit.** A side label written beside the plan does not change what the plan builds. The verifier also found sides leaking turns ("against at first: paid to ferry the merchant quietly").
- **Added:** set up nowhere, 48% of losses against 36% of A2's. The sides arm cut ", each for a plain human reason" from the cast line to stay in budget.
  - The first card has to fit each person's side into 70 words, and in the verifier's sample it dropped the premise's unknown.
  - 71 side-lint lines over 72 sagas (a missing side, a side over 8 words, or answer words in a side).

### 2.5 The class every arm keeps: the next card is written from the plan's forecast, not from the report

- **What happens:** after a won job, the next card's `latest` is the plan's `win` (`sagaflow.ts:294`). That is a sentence written before play, often passive and with no doer. The card must speak to "you", so it invents a doer:
  - A2′ F3_1: the plan's "The raid fails and the painting stays…" became "**Your raid at Elmmere failed.**" The company had held the hall.
  - A2″ F6_2: "The tally book leaves the merchant's hands…" became "**Benjamund … has put the tally book into your hands**", while the report had just said the company stole it.
  - A2″ F6_1: "The charter and debt roll are taken from the hall unseen" became "**Someone has taken** the charter and the debt roll from the hall".
- **The size of it:**
  - Readers named these three incumbent draws in 16 reads, across all four arms' comparisons.
  - The same "Someone took…" opener appears in C2 g2 F2_3, C3 g1 F1_1 and C3 g3 F7_3.
  - It is shipped behaviour, so every arm has it. Fixing it is an input change, not a prompt edit (§3.4).

## 3. Recommendation

### 3.1 Ship C2 (grafts) as the default, after two designer rulings

- **Why ship on a follow margin that is inside the floor.**
  - C2 is the only arm in seed1 that is ahead on follow in all three generations, against three different incumbent draws.
  - Its keep margin clears the floor.
  - It removes three measured classes, two of them by construction: option spoilers, hoard answers, and detours.
  - It costs less and is faster.
  - Kit+pick shipped on weaker evidence: four comparisons pointing the same way, each one draw.
- **What ships.** The seed arm stays `kit+pick`, and the `grafts` path becomes the build path. Today `SagaHost.pipeArm()` is unset in the game.
  - The parity tests will need a new golden for the grafts renders.
- **Ruling 1 (needed): the gold way's wording.**
  - The fate, button and plan gloss say "pays the company to go free".
  - 15 of 18 gold finales paste it almost word for word (R6's N27 again).
  - It also clashes with the report prompt's "no pay".
  - Options:
    - keep it;
    - word the fate without money, e.g. "buys their freedom";
    - let the button carry it and keep it out of the report payload.
- **Ruling 2 (needed): a flagged why.** Today the row shows the title only (10 of 99 rows).
  - R6 measured that a blank purpose draws complaints, so it printed the job alone.
  - No reader named a title-only row in this round's 144 C2 reads.
  - Either way it is a one-line change in `graftRoad`.
- **Also from the verifier, class-level, before shipping.** Each of these is a prompt line, so it is subject to the word budget: cut or merge one line for each line added.
  - **report.txt.** "hope: … show shortfalls" conflicts with "nothing else changes", and on a partial result it invents a failure event. Narrow it to "show only what the hope wanted that the result and clue do not give; add no event".
  - **The finale card has no stake.** Send `showdown.lose` (or the asker's want) on every finale, not only at a last chance.
  - **The secret is pasted verbatim** ("in your own words" is missing). The finale result is two sentences, so the summary cannot be one. The engine should join the way and settles into one result.

### 3.2 Do not add B2 to C2

- B2's gain is the keyword class, about 10% of A2's follow losses. C2 already brings that class down to 3 of 61 losses.
- What remains would be a few slots, which no 72-pair run can see.
- B2 also lost generation 1 outright.
- Keep it as a lab arm.

### 3.3 Remove C1. C3 can stay behind PipeArm as a lab arm

- C1's code adds a prompt (`core.txt`) and a validatePlan branch for an arm that is now ruled out. Remove both.
- C3 cost a word-budget cut in plan.txt for its variant and gained nothing.

### 3.4 Next experiment (item 8): D1, "the card reads the report"

- **The change, on top of C2:** after a won job, the next card's `latest` is the report's one-sentence summary, the text the player just read. Failed jobs already work this way. This is one input in `sagaflow.ts:294`, and no prompt changes.
- **Principle:** every text is given the last text the player read, never a forecast of it. The summary names the doer ("The company held the painting hall…"), so the card cannot invent one.
- **Target:** the contradiction class (54% of C2's follow losses), at least the card-after-report share of it (§2.5).
- **Risks (watched):**
  - The summary carries less clue content than the plan's `win`. The quest log's Known and Held lines still carry the gains.
  - Report inventions now travel forward. This is one more reason to land the "show shortfalls" fix first.
- **Method:**
  - Replay A2's deals and run 3 generations.
  - Judge against C2's three generations, which become the incumbent's draws.
  - Count it a gain only if it is ahead in all three generations and the contradiction share of its losses falls.
  - A measured gain would need the pooled held margin beyond ±15.
- **In parallel, confirm C2 on seed2.**
  - Every arm so far was built and judged on the same 24 slots.
  - Run 24 new slots with one generation of C2 and one of kit+pick, about $5 at list.
  - This checks out of sample before the designer plays it.
- **Not recommended: splitting C2 into its four parts.**
  - At this power, each part's share would need 100+ slots to see.
  - Decompose only if a ruling takes a part away.

## 4. Ledger lines (written into `docs/STORYTELLER.md`, North Star item 9)

- **Worked (seed1 pipeline round): C2 "grafts".**
  - The change: on kit+pick, the road prints the plan's own why for each later job (no outline call), the card's hope goes to its report, the engine writes the finale buttons, and the answer need not fit every ending.
  - Follow 83–61 (held 37–26), ahead in all 3 generations. Keep 93–51 (held 41–20, p ≈ 0.01), the first seed1 margin beyond the floor.
  - Detour blame 20% → 5% of follow losses. Option spoilers are 0 by construction, and hoard answers fell 16 → 5 of 72.
  - Its follow margin alone is inside the three-generation floor (±15 held).
- **Noise floor:** "Three generations (~60 held pairs) resolve about ±15 held."
- **Did not (seed1 pipeline round):**
  - **A core call that fixes the want, question, answer and against before the plan (C1).** Follow 26–116 (held 6–51), lost in every generation.
    - The call is blind to the jobs and the endings.
    - It writes long compound questions (26 words against 14), which the quest log prints on every card.
    - It fixes an answer the jobs then cannot lead to, so culprits arrive from nowhere.
    - Its hooks were good (keep 70–72).
    - **Principle:** a step may fix story facts only if it sees what must point at them.
  - **One keyword (B2).** Keyword blame went to 0, but follow 80–64 lost generation 1 and the slots split 8–9.
  - **The plan writing each person's side (C3).** Generations 11–10 / 14–7 / 8–8, and side swaps did not fall.

## 5. For the designer: the best C2 saga in full, and the same slot and generation from the shipped arm

**Why this pair.**
- In F4_1, C2 held both follow and keep, in both orders, in **all three** generations. Only one other slot did that: F1_2, where B2 and C3 also beat A2 in every generation.
- Generation 1 is shown here because its opponent is A2's original F4_1. That is a strong incumbent draw: it had already beaten A2′ on follow in both orders.

**The four reads of this pair** (C2 won all four, on both measures):
- *C2 shown first, follow:* "In X the elf stole the ring and we chase her. Y's pledged-ring debt setup is unclear: why track the wanderer at all? The 'hidden it inside' reveal is muddy, and the ending wrongly says Patty's husband was freed of his debt."
- *C2 shown first, keep:* "X's clues build on each other: the map's marked coffin, then a note on the key saying only a signet ring opens the lock, then her motive (the reeve's tithe silver, buying back the felled forest). It is a satisfying mystery to keep chasing."
- *C2 shown second, follow:* "Y's setup is simple: a thief took the ring, get it back. X's lord-pledged debt muddies who owes whom, and its ending says it freed 'Patty's husband of his debt'."
- *C2 shown second, keep:* "Y's open question, 'what she means to open with it', pays off in steps: the map marks a coffin, then the key says only a signet ring turns the lock. Each clue pulls me forward."

**What differs in the inputs.** Nothing in the deal: the same client, wanderer, keywords (coffin, fog, ring), tone, places, soldiers and dice.
- **The road row for job 2.** C2: the plan's own why. A2: the outline call's.
- **The answer.** C2's answer did not have to fit the gold way, and it became a motive: the reeve's tithe silver, to buy back the felled forest. A2's answer had to fit every ending, and it became wages plus a ring hidden from creditors.
- **The gold button.** C2: the engine's "Corner the elf wanderer and make her pay to go free". A2: the plan's "Take the treasure the wanderer carries as the price of her freedom".

### 5.1 C2 grafts, generation 1, F4_1: "The Ring in the Coffin" (`runs/seed1/C2_g1/F4_1/`; path clean, N 3, all successes)

**`card_1.md`**

```text
═══ Camp in the Fog · The Ring in the Coffin ═══
Road ahead:
  ▶ Camp in the Fog
  · Steal the crypt key from the gravewarden's house in Rushdale. Patty hopes the key lets the company reach the crypt before the thief does.
  · Finale
The human widow Patty needs you. She wants her dead husband's ring back. The elf wanderer who took it has told no one why, or what she means to open with it. You must track her hiding camp in the fog outside Ashmarch. Patty hopes the camp will show where the thief keeps the ring. Elven woodwatchers wait there, armed with longbows.
ON THIS MATTER: Patty — human widow
REWARD: a few days' pay
SAGA: The Ring in the Coffin · part 1 of 3 · setbacks 0 of 2
```

**`report_1.md`**

```text
━━ SUCCESS ━━ Camp in the Fog
The fog lay thick on the road out of Ashmarch. Anirione Fernbrook and Henaamo found old boot prints and a trail of snapped twigs. Henaamo wanted to push ahead fast. Anirione held him back. Somewhere in the grey, bowstrings creaked.
⚄ [SUCCESS] · rolled 6 heads of 7 coins vs bar 3.7 (partial from 2.2)
Anirione heard a faint cough ahead and stopped Henaamo before he charged. She crept low, followed a thread of smoke, and found the camp. A woodwatcher aimed at her, but she lowered her hands and spoke softly, and the bow dipped long enough for her to pass. Muvulrea saw the company and fled into the trees. She left no ring behind. The company knew where she hid, but not where the ring lay. Anirione found a map pinned under a stone by the dead fire. One coffin in the Coldcombe crypt was marked, with a ring's pattern drawn beside it. She folded the map and tucked it into her coat.
📖 The Ring in the Coffin: the story moves on. The company tracked the wanderer to her hidden camp and took her map, though she escaped into the trees.
```

**`card_2.md`**

```text
═══ The Gravewarden's Key · The Ring in the Coffin ═══
For: Patty, a human widow, who wants to take back her dead husband's ring.
Road ahead:
  ✓ Camp in the Fog
  ▶ The Gravewarden's Key
  · Finale
Known:
  The map marks one coffin in the Coldcombe crypt, with the ring's pattern drawn beside it.
Held: the wanderer's marked map
Open question: why the elf wanderer stole a dead man's ring and what she means to open with it
You found Muvulrea's camp, so you know where she hides. She slipped away into the trees. Now you must steal the crypt key from the gravewarden's house in Rushdale. Patty hopes the key lets you reach the crypt before the thief does. The gravewarden's guards carry spears and a bell. They will raise the alarm and cut down thieves.
ON THIS MATTER: Patty — human widow · Muvulrea — elf wanderer
REWARD: a few days' pay
SAGA: The Ring in the Coffin · part 2 of 3 · setbacks 0 of 2
```

**`report_2.md`**

```text
━━ SUCCESS ━━ The Gravewarden's Key
Anirione and Eddusa reached the gravewarden's house at dusk. Two guards walked the yard with spears, and a brass bell hung by the door. The shutters were closed, and the lane behind them was narrow.
⚄ [SUCCESS] · rolled 5 heads of 8 coins vs bar 3.7 (partial from 2.2)
Eddusa watched the guards turn their backs at the far wall. She crossed the yard low and quiet, and she held the bell's clapper still with her hand as she passed. Inside, she found the key on a hook above the gravewarden's sleeping chair. She took it and left a plain iron hook in its place. Anirione waited by the gate and kept the dogs calm. They slipped out unseen. On the lane, Eddusa turned the key over and found a small note scratched on its bow. The sealed coffin, it said, had a lock that only a signet ring could turn.
📖 The Ring in the Coffin: it now comes to a head. The company stole the Coldcombe crypt key from the gravewarden's house unseen, and the gravewarden did not know it was gone.
```

**`card_3.md`**

```text
═══ Coffin Lock · The Ring in the Coffin ═══
For: Patty, a human widow, who wants to take back her dead husband's ring.
Road ahead:
  ✓ Camp in the Fog
  ✓ The Gravewarden's Key
  ▶ Finale: Coffin Lock
Known:
  The map marks one coffin in the Coldcombe crypt, with the ring's pattern drawn beside it.
  The sealed coffin has a lock that only a signet ring can turn.
Held: the wanderer's marked map, the Coldcombe crypt key
Open question: why the elf wanderer stole a dead man's ring and what she means to open with it
You took the crypt key unseen. The gravewarden does not know it is gone. Now you must go to the Coldcombe crypt, catch the elf wanderer Muvulrea, and take the ring from her. She does not walk alone. Her woodwatchers guard her with bows and a long knife. They will fight to keep the ring, so move with care.
ON THIS MATTER: Patty — human widow · Muvulrea — elf wanderer
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Ring in the Coffin · the finale · setbacks 0 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Take the elf wanderer to the fort in chains → held in your cells · STR
  [g1] Offer the elf wanderer a place in the company → joins the company · CHA
  [g2] Corner the elf wanderer and make her pay to go free → coin; goes free · INT
```

**`report_3.md`**

```text
━━ SUCCESS ━━ Coffin Lock ♛
The company reached the Coldcombe crypt in the grey of the morning. Cold air rolled out between the stones. Orani spotted woodwatchers in the dark, with bows strung and a long knife among them. Anirione Fernbrook kept low beside Henaamo, who wanted to charge in.
⚄ [SUCCESS] · rolled 7 heads of 11 coins vs bar 6.2 (partial from 3.7)
Henaamo held his temper and read the wanderer's marked map. It showed which way she would come. He set Orani high in the gloom and sent Anirione Fernbrook to the side aisle. Muvulrea walked into the sealed room with her watchers behind her. Henaamo stepped out and shut the crypt door behind her with the crypt key. Orani's arrows pinned the bows. Muvulrea cried that the ring was the only key to the sealed coffin. It held the silver the reeve took as tithe, and she meant to buy back the felled forest. Henaamo saw the coffin on the map, with the ring's pattern drawn beside it. He saw the signet lock fit. The company chained her and took her to the fort. Patty took the ring in her own hand.
📖 The Ring in the Coffin: it is settled. The company trapped the elf wanderer in the Coldcombe crypt, took the ring, and brought her in chains to the fort, and Patty got the ring back.
```

**`chain.md`**

```text
═══ The Ring in the Coffin ═══ (done)
For: Patty, a human widow, who wants to take back her dead husband's ring.
Road ahead:
  ✓ Camp in the Fog
  ✓ The Gravewarden's Key
  ✓ Finale: Coffin Lock
Known:
  The map marks one coffin in the Coldcombe crypt, with the ring's pattern drawn beside it.
  The sealed coffin has a lock that only a signet ring can turn.
Held: the wanderer's marked map, the Coldcombe crypt key
The human widow Patty needs you. She wants her dead husband's ring back. The elf wanderer who took it has told no one why, or what she means to open with it. You must track her hiding camp in the fog outside Ashmarch. Patty hopes the camp will show where the thief keeps the ring. Elven woodwatchers wait there, armed with longbows.
ending: Muvulrea is taken to the fort's cells. · setbacks 0 of 2
So far:
  1 ✓ Anirione Fernbrook, Henaamo — The company tracked the wanderer to her hidden camp and took her map, though she escaped into the trees.
  2 ✓ Anirione Fernbrook, Eddusa Reed — The company stole the Coldcombe crypt key from the gravewarden's house unseen, and the gravewarden did not know it was gone.
  finale ✓ Orani, Anirione Fernbrook, Henaamo — The company trapped the elf wanderer in the Coldcombe crypt, took the ring, and brought her in chains to the fort, and Patty got the ring back.
The answer: The ring is the only key to a sealed coffin in the Coldcombe crypt. The coffin holds the silver the reeve took from the elven clans as tithe. The wanderer means to take that silver back and buy back the old forest land that has been felled.
People:
  Patty — human widow
  Muvulrea — elf wanderer
```


### 5.2 Shipped kit+pick (A2), generation 1, F4_1: "The Ring in the Coffin" (`runs/seed1/A2/F4_1/`; path clean, N 3, all successes)

**`card_1.md`**

```text
═══ Camp in the Fog · The Ring in the Coffin ═══
Road ahead:
  ▶ Camp in the Fog
  · Get in and out unseen and take the grave-warden's keyring from his lodge in Rushdale. Patty hopes to open the grave locks with the keyring.
  · Finale
Patty, a human moneylender's widow, needs you. She wants the ring a lord pledged to her dead husband for a debt. No one knows where it went after the lord was buried. You must track down the elf wanderer's hidden camp in the fog outside Ashmarch. Patty hopes someone there knows the answer. The wanderer's hired woodsmen wait there with hunting bows.
ON THIS MATTER: Patty — human moneylender's widow
REWARD: a few days' pay
SAGA: The Ring in the Coffin · part 1 of 3 · setbacks 0 of 2
```

**`report_1.md`**

```text
━━ SUCCESS ━━ Camp in the Fog
The fog lay thick between the black pines, and every path looked the same. Henaamo pushed ahead and read the broken twigs. Anirione Fernbrook knelt by a cold fire pit and found ash still soft. Somewhere close, a bowstring creaked.
⚄ [SUCCESS] · rolled 6 heads of 7 coins vs bar 3.7 (partial from 2.2)
An arrow hissed past Henaamo's ear. He shouted and made to charge blind into the fog. Anirione Fernbrook caught his sleeve and pointed at a faint lantern glow behind a fallen oak. She led him along the wet ditch, out of the archers' sight, and came up at their backs. The woodsmen broke and ran. Muvulrea, the elf wanderer, slipped away between the trees before anyone could reach her. In her tent Anirione found the lord's burial ledger. She turned the pages and read aloud that Muvulrea alone had sealed the coffin, and that the ring was missing from the list of goods buried with him.
📖 The Ring in the Coffin: the story moves on. The company found the hidden camp in the fog and drove off the woodsmen, though the wanderer escaped, and took the lord's burial ledger.
```

**`card_2.md`**

```text
═══ Keys of the Dead · The Ring in the Coffin ═══
For: Patty, a human moneylender's widow, who wants to collect the ring pledged to her dead husband for a debt.
Road ahead:
  ✓ Camp in the Fog
  ▶ Keys of the Dead
  · Finale
Known:
  The ledger shows the wanderer alone sealed the lord's coffin, and the ring is missing from the list of goods buried with him.
Held: the lord's burial ledger
Open question: where the dead lord's pledged ring went after he was buried
You found the camp and drove the woodsmen off. Muvulrea, the wanderer, slipped away into the trees. Now you must go into Rushdale, stay unseen, and take the keyring from the grave-warden's lodge. Then you must get out again. Patty hopes the keyring will open the grave locks. The grave-warden's guards carry spears and lanterns. If they see you, they will raise the alarm and bar the gate.
ON THIS MATTER: Patty — human moneylender's widow · Muvulrea — elf wanderer
REWARD: a few days' pay
SAGA: The Ring in the Coffin · part 2 of 3 · setbacks 0 of 2
```

**`report_2.md`**

```text
━━ SUCCESS ━━ Keys of the Dead
Rushdale lay quiet under a low mist. Lantern light swung along the lanes as guards walked their rounds. Anirione and Eddusa waited in a doorway and counted the gaps between the passing spears.
⚄ [SUCCESS] · rolled 5 heads of 8 coins vs bar 3.7 (partial from 2.2)
Eddusa chose the moment. She crossed the lane behind the last guard and worked the lodge door with a steady hand. Inside, she found the keyring on a hook beside the warden's sleeping chair. She lifted it without a sound. Anirione kept watch and gave a soft signal. They slipped out through the shadows and past the gate. The warden never stirred. Beyond the wall, Eddusa found a scrap of paper tucked in the ring. It read: the lord's coffin was moved by night to Coldcombe a week after the burial. Anirione held the keyring up in the moonlight.
📖 The Ring in the Coffin: it now comes to a head. The company slipped into Rushdale, took the grave-warden's keyring from his lodge, and left unseen, so the warden never learned it was gone.
```

**`card_3.md`**

```text
═══ The Crypt at Coldcombe · The Ring in the Coffin ═══
For: Patty, a human moneylender's widow, who wants to collect the ring pledged to her dead husband for a debt.
Road ahead:
  ✓ Camp in the Fog
  ✓ Keys of the Dead
  ▶ Finale: The Crypt at Coldcombe
Known:
  The ledger shows the wanderer alone sealed the lord's coffin, and the ring is missing from the list of goods buried with him.
  The lord's coffin was moved by night to Coldcombe a week after the burial.
Held: the lord's burial ledger, the crypt keyring
Open question: where the dead lord's pledged ring went after he was buried
You took the keyring unseen, and the warden never knew it was gone. Now you must catch Muvulrea, the elf wanderer, in the crypt at Coldcombe. She does not stand alone. Her bowmen wait with her, and they carry bows and snares hidden in fog. They will hold the crypt door to the end. Move with care, and watch the fog before you step.
ON THIS MATTER: Patty — human moneylender's widow · Muvulrea — elf wanderer
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Ring in the Coffin · the finale · setbacks 0 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Seize the wanderer and lock her in the fort's cells → held in your cells · STR
  [g1] Offer the wanderer a place in the company's ranks → joins the company · CHA
  [g2] Take the treasure the wanderer carries as the price of her freedom → coin; goes free · INT
```

**`report_3.md`**

```text
━━ SUCCESS ━━ The Crypt at Coldcombe ♛
Fog lay thick across the crypt yard at Coldcombe. Orani crouched low and saw a thin cord glint near the steps. Anirione Fernbrook counted the shapes of bowmen among the stones. Henaamo held the company back and studied the closed door.
⚄ [SUCCESS] · rolled 7 heads of 11 coins vs bar 6.2 (partial from 3.7)
Henaamo led the company along the wall, where the fog was thin and no cord crossed the ground. Orani shot the bowmen's snares loose from afar. Henaamo turned the crypt keyring in the lock and the door swung wide. Muvulrea stood beside the coffin. She said the lord had cheated her of wages. Henaamo opened the burial ledger and showed that she alone had sealed the coffin, and the ring was missing from the list. Her silence told the rest. She had taken the ring from the dead lord's hand and hidden it inside, to keep it from other creditors until she was paid. Henaamo bound her wrists. Later the cell door of the fort shut on her, and Patty held the ring.
📖 The Ring in the Coffin: it is settled. The company broke through the fog and the bowmen, caught the wanderer in the crypt, and locked her in the fort's cells, freeing Patty's husband of his debt.
```

**`chain.md`**

```text
═══ The Ring in the Coffin ═══ (done)
For: Patty, a human moneylender's widow, who wants to collect the ring pledged to her dead husband for a debt.
Road ahead:
  ✓ Camp in the Fog
  ✓ Keys of the Dead
  ✓ Finale: The Crypt at Coldcombe
Known:
  The ledger shows the wanderer alone sealed the lord's coffin, and the ring is missing from the list of goods buried with him.
  The lord's coffin was moved by night to Coldcombe a week after the burial.
Held: the lord's burial ledger, the crypt keyring
Patty, a human moneylender's widow, needs you. She wants the ring a lord pledged to her dead husband for a debt. No one knows where it went after the lord was buried. You must track down the elf wanderer's hidden camp in the fog outside Ashmarch. Patty hopes someone there knows the answer. The wanderer's hired woodsmen wait there with hunting bows.
ending: Muvulrea is taken to the fort's cells. · setbacks 0 of 2
So far:
  1 ✓ Anirione Fernbrook, Henaamo — The company found the hidden camp in the fog and drove off the woodsmen, though the wanderer escaped, and took the lord's burial ledger.
  2 ✓ Anirione Fernbrook, Eddusa Reed — The company slipped into Rushdale, took the grave-warden's keyring from his lodge, and left unseen, so the warden never learned it was gone.
  finale ✓ Orani, Anirione Fernbrook, Henaamo — The company broke through the fog and the bowmen, caught the wanderer in the crypt, and locked her in the fort's cells, freeing Patty's husband of his debt.
The answer: The elf wanderer took the ring from the dead lord's hand and sealed it inside his coffin, which was moved to Coldcombe. The lord had cheated her of wages too, and she hid the ring there to keep it from other creditors until she was paid.
People:
  Patty — human moneylender's widow
  Muvulrea — elf wanderer
```

## Appendix: per-slot results, generations g1 · g2 · g3

**Key.** `X` = the arm held the slot (won in both orders); `A` = the shipped draw held it; `~` = flipped; `?` = one order missing. Each generation is read against a different shipped draw (A2, A2′, A2″).

**Follow**

| slot | F1_1 | F1_2 | F1_3 | F2_1 | F2_2 | F2_3 | F3_1 | F3_2 | F3_3 | F4_1 | F4_2 | F4_3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B2 | AAX | XXX | AX~ | ~AX | AAA | AXA | AXA | X~X | ~~A | AX~ | AX~ | X~X |
| C1 | AA~ | ~AA | AAA | AA~ | AAA | ~A~ | AXA | XAA | AAX | A~~ | ?XX | ?AA |
| C2 | XAX | XXX | AX~ | AAA | AAA | A~X | AXA | XA~ | X~X | XXX | XXA | XAX |
| C3 | ~XX | XXX | XXX | ~AX | AAA | AX~ | AXA | XAA | X~A | AX~ | AXX | XAA |

| slot | F5_1 | F5_2 | F5_3 | F6_1 | F6_2 | F6_3 | F7_1 | F7_2 | F7_3 | F8_1 | F8_2 | F8_3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B2 | AAX | XXX | ~~X | XAA | AAX | ~XA | ~XA | A~A | XXX | XXX | AX~ | XXX |
| C1 | AA~ | AAA | AAA | ~AA | AA~ | ~AA | ~AA | AAA | AAA | AAA | A~A | AXA |
| C2 | AA~ | XXX | AAA | XXX | XXX | X~A | X~X | AXX | X~X | X~A | AXA | AXA |
| C3 | ~X~ | X~~ | XAA | A~A | AAX | XX~ | XX~ | AX~ | XXX | XX~ | AAX | AXA |

**Keep**

| slot | F1_1 | F1_2 | F1_3 | F2_1 | F2_2 | F2_3 | F3_1 | F3_2 | F3_3 | F4_1 | F4_2 | F4_3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B2 | AX~ | XXX | AXA | ~XX | ~A~ | AXX | ~XA | XAA | ~AA | XXX | AXX | X~X |
| C1 | AAX | XAX | ~~~ | A~A | A~A | XXX | AXA | XXA | XAX | XXX | ?XX | ?X~ |
| C2 | ~~~ | XXX | XXX | XXA | XXX | X~X | AXA | ~A~ | XAX | XXX | ~XX | XAX |
| C3 | AAX | XXX | ~XA | ~XX | ~AA | AXA | AXA | XAA | AAA | XAX | AAX | XA~ |

| slot | F5_1 | F5_2 | F5_3 | F6_1 | F6_2 | F6_3 | F7_1 | F7_2 | F7_3 | F8_1 | F8_2 | F8_3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B2 | A~X | XXX | A~A | A~A | AAX | ~XA | XXA | AXA | XAX | ~AX | ~XA | XXX |
| C1 | A~~ | XAA | ~~X | A~A | AA~ | XAA | XXA | AAA | ~~X | AXX | AX~ | XAA |
| C2 | ~AX | XAX | AAA | ~XA | XAX | X~A | ~XA | AXA | XXX | XXA | XXX | XAA |
| C3 | XXX | XAX | AAX | AAA | XAA | X~X | XXA | AXA | XXX | XAA | AXX | X~~ |

**Where the facts come from.**
- Tallies, held pairs, slot majorities and sign tests: recomputed from every read. The tally matched the one supplied, except C1's placeholder row.
- Reason classes: hand tags of all 574 follow reasons.
- Plan counts (question and answer length, compound questions, hoard answers, button wording, hunt jobs, road rows, the gold fate sentence): each slot's `plan.json` and finale `report_N.md`.
- Deal identity: `engine.cast`, `dealt.kit.keywords`, `dealt.tone` and `engine.places` compared with A2's, 336 of 336 equal.
- Spend and latency: each arm's `INDEX.md`.
- The card-after-win openers: the first prose sentence of every card after a won job (`card_k.md`).
