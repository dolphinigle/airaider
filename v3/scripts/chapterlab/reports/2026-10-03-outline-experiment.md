# Saga outline experiment: results (probe4, 24 Sonnet sagas)

**Setup.** I compared three versions of each saga. Only the cards differ; the reports are byte-identical across all three.
- **V0** is the saga as it is now.
- **V1** adds a route line of job titles to every card.
- **V2** adds a numbered "road ahead" list where each step carries a purpose. It comes from a separate Sonnet call costing $0.0055 per saga (median 4.1 s).

Judging was blind and pairwise, and every saga was judged in both orders. That gives 102 judgments per pair: 2 per order per saga, plus 3 extra.

## Wins, losses and ties (W-L-T for the first-named version), split by position

| Pair · criterion | Total | Shown first | Shown second |
|---|---|---|---|
| V1 vs V0 · follow | 69-0-33 | 47-0-4 | 22-0-29 |
| V1 vs V0 · want next | 48-6-48 | 32-2-17 | 16-4-31 |
| V2 vs V0 · follow | 95-0-7 | 50-0-1 | 45-0-6 |
| V2 vs V0 · want next | 47-15-40 | 33-6-12 | **14-9-28** |
| V2 vs V1 · follow | 99-1-2 | 50-0-1 | 49-1-1 |
| V2 vs V1 · want next | 61-11-30 | 39-3-9 | 22-8-21 |
| all pairs · sequence | 102-0-0 each | 51-0-0 | 51-0-0 |

- **Order balance.** No version wins in only one position, so none of these wins is pure position bias. The position effect is still large: the version shown first wins about twice as often.
- **Sequence** went 306 to 0 for whichever version added structure. The criterion is at its ceiling, so give it no weight.
- **Weakest result.** When V2 is shown second, "want next" against V0 is only +5 out of 51. Its clear wins over V0 are on follow. Its "want next" win over V1 holds in both positions.
- **Every "want next" loss is on a saga where the added text gives something away:**
  - V1's 6 losses: F5_2 ×3, F2_2 ×2, F4_2 ×1.
  - V2's 15 losses to V0: F5_2 ×4, F1_1 ×3, F1_2 ×2, F1_3 ×2, F8_2 ×2, F6_1, F7_3.
  - V2's 11 losses to V1: F7_3 ×4, F8_2 ×3, F5_2 ×2, F1_3, F6_1.

## Spoilers
- **V1: 53 of 102 judgments flag one, mostly mild foreshadowing by the titles.** It is serious only where the finale title is the answer: 'The Silversmith's Door', 'The Timber Camp' and 'The Hinge Post' (also the Cairn, the Oak Vault and the Den). The build notes said V1 has no spoilers; the judges disagree, because titles leak too.
- **V2: 59 of 102, and the leaks are worse.**
  - It names the culprit on card 1 in 6 sagas: F1_1, F1_2 and F1_3 (the hunter), F5_2 (the silversmith), F6_1 (the merchant's lodge) and F7_3 ("when she comes for her bear").
  - It gives away job 1's finding in F8_2 ("follow what tore it apart").
- **Cause.** The outline prompt already said "Never say what a job will find, learn or prove." The plan it reads was written with hindsight. F7_3's finale job reads "…against the sailor, who comes for her bear", and F1_1's reads "Take the hunter at the stone". The model paraphrased its input, so the input won over the instruction.

## Clutter
- **V1: 18 of 102, all mild.** The five-title route in F7_x is long, and on two-job sagas the line repeats "part 1 of 2".
- **V2: 49 of 102.** V2 cards have 54% more words than V0, and some complaints recur:
  - The ▶ line restates the card body.
  - Some purposes are empty: "so you know where to look next", "which sets up the final confrontation".
  - Some links are invented and clash with the cards (F1_3 "so the oak can be reached"; F5_3 "so the quays stop opening for her").
  - The ✗ line still claims its result after the job failed (F3_3).
  - "Storm the camp" appears on sagas whose finale is settled by talk.
  - Labels drift: "raiders" where the card says wolf-trappers.
  - People appear before they are introduced ("the merchant", "the reporter").

## Verbatim, F6_3 card 1
V2:
```
The road ahead:
▶ 1. Track down the merchant's hidden felling camp near Harrowford, so Lariane knows where the axes are working.
  2. Slip into the merchant's counting-house at Stonegill and take his sealed deed unseen, so his claim is in your hands.
  3. Win over the hired axemen at Woldshaw so they will not cut, leaving the merchant short of hands.
  4. Finale: Stop the merchant at the heart-tree in the burial grove and hold it until Lariane sings the last verse.
```
V1:
```
Route: ▶ The Hidden Camp → The Counting-House → The Axemen's Choice → The Heart-Tree (finale)
```

## Recommendation (your ruling)
**Use V2's shape, not as built. Drop V1.** V2 beats V1 in both positions, and the judges' reasons credit the "so…" purpose clause almost every time. Saying why each job leads to the next is what helps, not the list of titles. Changes before shipping:

1. **Fix spoilers through the input, not the prompt wording.** A line on screen may hold only what the player knows when it is shown. The outline writer should get only card-1 knowledge: the asker, their goal, and each job's verb, place and need. It should not get any job's findings or rewards, the opponent's label, the finale job text, or titles. If that removes too much, have the engine reveal the next step's full line only after the previous report lands, with no extra call.
2. **The finale line states the asker's goal.** No opponent, no hidden place, no method ("Storm" clashed with finales won by talking).
3. **Make it shorter.**
   - The current step shows its title only, since the card body already says it.
   - The engine enforces the length cap: the 18-word cap in the prompt was broken in 35 of 81 lines, and tightening the wording barely helped.
   - Empty purposes get flagged automatically, as log-only telemetry.
4. **Failed step:** show `✗ <title>` with no consequence clause.
5. **Labels come from the cards** and are never re-coined.
6. **Two-job sagas:** the block adds almost nothing there (ties in every pair), so keep only the ✗ marker.
7. **Keep it a separate call** (about 4% of a saga's cost). The plan call is where the hindsight lives, and adding a rule to that prompt means cutting another one.
8. **Re-test:** run the revised V2 against V0 on the 7 spoiler sagas plus the clean ones (F2_1, F2_3, F4_3, F6_3, F7_1, F7_2, F8_1). The bar is that "want next" is not negative in either position. If it ships, it ships in the CLI at the same time.

Files are in /tmp/claude-1000/-home-irvan-airaider/80974e3b-1108-4ee5-8d27-6e2a5e6f3904/scratchpad/outline/:
- V0/, V1/, V2/ hold the versions.
- outlines.json holds the prompt and replies.
- build.py is the script.

The judgments themselves were not saved to disk; the splits above are recounted from the judgment list, and the totals match the tally.

## Tally
```
{
 "V1 vs V0 \u00b7 follow": {
  "V1": 69,
  "same": 33
 },
 "V1 vs V0 \u00b7 sequence": {
  "V1": 102
 },
 "V1 vs V0 \u00b7 want_next": {
  "V1": 48,
  "V0": 6,
  "same": 48
 },
 "V2 vs V0 \u00b7 follow": {
  "V2": 95,
  "same": 7
 },
 "V2 vs V0 \u00b7 sequence": {
  "V2": 102
 },
 "V2 vs V0 \u00b7 want_next": {
  "V0": 15,
  "same": 40,
  "V2": 47
 },
 "V2 vs V1 \u00b7 follow": {
  "V2": 99,
  "same": 2,
  "V1": 1
 },
 "V2 vs V1 \u00b7 sequence": {
  "V2": 102
 },
 "V2 vs V1 \u00b7 want_next": {
  "V2": 61,
  "same": 30,
  "V1": 11
 }
}
```
