# Ship and stack round: 2026-10-05

**Goal (North Star 0):** readability plus story quality. Followability is the floor: an arm that loses J3 *follow* by more than 15 held slots over 72 does not ship. Story quality (J3 *keep* and the anchored S10 score) is the target, and round T's law applies: ship only where both move.
**What this round did:** (1) shipped round T's two winners into the game, then reviewed them and played them for real; (2) tested three "stack" arms, each a shipped arm plus ONE more change, against that arm: S1 = TC + line, S2 = PP + voice, S3 = TC + clean. Each arm ran 3 generations (72 sagas). Readers: blind J3 pairs in both orders, plus S10 with two readers per saga, shuffled across arms. The writer is Sonnet. S1 and S3 replay A2's seed1 deals; S2 plays pers1's shared deals. The incumbents are round T's own TC_g1–g3 and PP_g1–g3 folders.

## 0. Verdict

| | change | follow floor | story quality | verdict |
|---|---|---|---|---|
| **Game default** | personal sagas play **PP**, every other saga plays **TC** | round T: PP +11 held, TC +12 held | round T: PP S10 +0.70, TC +0.40 | **SHIPPED** (fa86555) |
| **S1** | TC + round F's trouble line (+ `motive`: the line gives a reason only where the seed or cast already has one) | passes: held **+3** (33–30) | keep held **+19** (39–20, p ≈ 0.02), ahead in all 3 generations; S10 +0.11 [−0.11, +0.33] | **HOLD**: keep-only, one cheap check decides (§5) |
| S2 | PP + voice (the past's first sentence quoted, in place of its narration; the secret said by someone who could know it) | passes: held −1 (28–29) | keep held +4 (30–26); S10 −0.08 [−0.31, +0.15] | no |
| S3 | TC + clean (the verifier's shared-pipeline fixes) | passes: held +3 (30–27) | keep held +5 (32–27; g3 6–14); S10 +0.14 [−0.05, +0.33] | no |

No stack arm beats its incumbent on follow. S1 wins keep beyond the floor, and this is the second time: round F's line won keep 40–20 over the old default, and S1 now wins 39–20 over TC. But S10 does not move, which makes it the same profile as TA and TB in round T. The game default stays as shipped.

## 1. What shipped in the game

- **By saga type.** The game's host (`sagaHost()` in game.ts) picks the pipe from `chain.isPersonal`: `GAME_PIPE = { personal: 'past', other: 'voice' }` in saga.ts. `PIPE_ARM` is still `'grafts'`, so the lab's G0 and PG0 still mean the old default; a mock re-run of PG0 and PP produced the same bytes as before. Sagas already in a save keep the pipe they were dealt.
- **The soldier grows.** At a personal finale that is not lost, the soldier keeps one dossier line (`character.grown`: the seed that saga was dealt, the past it told, and the line). It shows on the GUI soldier sheet and in CLI `merc` (the same `dossier` string from the server, so both UIs are at parity). It is written as a fresh memory, so a second line no longer merges into the first. The soldier's next personal saga is seeded from the last entry's seed, past and line, never from company history.
- **Fixes from the review and the playtest:** a company-won soldier's next seed no longer uses company history; finale buttons call already-named people by name; a soldier's own saga no longer writes the same lore line twice; the keyword atom `seed` became `grain` (it clashed with the prompt's `seed` field; this also changes the game's pool).
- **Checks:** 693 tests green including golden parity, typecheck clean. Committed with the S1–S3 lab arms as fa86555. This report and the `docs/STORYTELLER.md` ledger lines are not committed.

## 2. The real playtest (CLI, Sonnet writer, seed 815273, 11 cycles)

It played 1 hired TC saga and 3 personal PP sagas to their finales. 51 calls, 0 failed. Nothing crashed, and the march flow for a locked soldier worked.

**Hired, TC card 1 (verbatim):**
> Alyenore, a human smith, needs you. She wants to keep her smithy in Sedgeworth. She says, "I cannot bear to watch this forge go cold and be taken from me." No one yet knows who sent the raven that told the reeve where the sick noblewoman lay hidden. You hold the smithy against the reeve's riders. She hopes the forge will still stand at dawn, so the reeve cannot burn it out of her hands. The riders come with torches, spears and lamp oil.

**TC finale, the secret spoken:**
> Rosa wept, then spoke. "I sent the raven myself. The reeve meant to hang Alyenore for hiding me, so I offered myself for the smithy's freedom. He took it, and he meant to break it."

**Personal, PP: the past on card 1** (Burl):
> Burl Nightrunner, one of your soldiers, wants the den's hunting hills back from the wolfkin moneylender. As a boy, Burl saw his father mark a tally he could not read, and the hills were lost for a debt. Burl could not read it either. Nobody knows what that tally says.

**…how it resolves in the finale:**
> He broke it before them all and read the tally aloud, slowly. The den's debt was paid in full. … Burl did not stumble once. He had hidden from letters as a boy. Now he held out the tally and said, "I am my den's reader."

**…and the line on his sheet (`merc`):**
> - After The Tally in the Wax: Burl has put down his boyhood shame and stands as his den's reader instead of its failure. (defining memory)

**The player's read:** the TC saga is about a 6. The voiced line is generic, and the real situation (Alyenore is hiding a noblewoman) comes out only in the finale; the spoken secret is the high point. The PP sagas are 7–8, and Burl's finale is the best text of the session. Rosa's change is shown in action ("Instead she let Tervur speak first… Her anger went out of her"). Irna's change is subtle and only clear with the dossier beside it.

**What broke followability** came from the shared pipeline, not from PP or TC:
- **Retry contradictions on 2 of 2 setbacks.** The failure report burned the forge down, although its prompt says "nothing else changes". The retry then had the company hold the same smithy, and its report ends with "The forge stayed dark and whole."
- **Card-1 setup gaps.** "The sick noblewoman" is named on Alyenore's card 1 and never set up, because the plan's label for her was "human noble".
- **PP's card 1 drops the open question.** It happened on Rosa's card in the playtest, and lab telemetry shows it is the norm: PP's card 1 states the plan's "Nobody knows" in **23 of 72** sagas, against PG0's 66 of 72 (§3).
- **TC's quoted clue never fired mid-saga in this run.** Job 1's gain (a captain) is not in the cast, and job 2 was a sneak, so the only voices were card 1 and the finale.

**Decision for the designer (from the ship report, confirmed in play):** none of the three grown soldiers can get a second personal saga in normal play. `personalChainDrip` deals a personal saga only to a soldier who never had one; the only other route is a sequel whose returning person is now your soldier, which is rare. So the growth line reaches the sheet but almost never seeds anything. If a second one is dealt, the plan reads its seed as "the soldier's old wrong", and a seed that now holds the wrong *and* its resolution will likely be told again as unresolved. Two rulings: **does a grown soldier get another personal saga, and what is a second personal saga about?** Changing when they are dealt is a gameplay rule, so it was left alone.

**Small note:** the CLI banner says "haiku mechanical tier", but all 51 logged calls ran on `claude-sonnet-5-5`, including the 4 `pick` calls. This affects only the free transport's speed and cost.

## 3. Stack arms: the numbers

### J3 whole-saga pairs (arm generation g against the incumbent's generation g; all 432 reads present, none missing)

| arm | vs | follow reads | follow held (flips) | sign p | follow held by gen | keep reads | keep held (flips) | sign p | keep held by gen |
|---|---|---|---|---|---|---|---|---|---|
| **S1** | TC | 75–69 | 33–30 (9) | 0.80 | 10–9 · 10–12 · 13–9 | 91–53 | **39–20** (13) | **0.018** | 14–5 · 14–7 · 11–8 |
| S2 | PP | 71–73 | 28–29 (15) | 1.0 | 14–6 · 6–9 · 8–14 | 76–68 | 30–26 (16) | 0.69 | 8–10 · 11–7 · 11–9 |
| S3 | TC | 75–69 | 30–27 (15) | 0.79 | 9–10 · 11–9 · 10–8 | 77–67 | 32–27 (13) | 0.60 | 13–7 · 13–6 · 6–14 |

No arm hit the early stop (−5 held after g1). Position bias is small: the first-shown saga won follow in 77, 75 and 83 of 144 reads. On S1's 63 non-personal slots (the only ones TC plays in the game), the result is the same: follow held 29–26, keep held 37–17.

### S10 absolute story score (mean of 2 readers per saga; paired bootstrap over 72 sagas, 20 000 resamples)

| arm | arm mean [95% CI] | incumbent, same slots | difference [95% CI] | better / worse / tie | difference by gen |
|---|---|---|---|---|---|
| S1 | 6.14 [5.93, 6.34] | TC 6.03 | +0.11 [−0.11, +0.33] | 31 / 25 / 16 | +0.01 · +0.29 · +0.02 |
| S2 | 6.66 [6.43, 6.88] | PP 6.74 | −0.08 [−0.31, +0.15] | 28 / 32 / 12 | −0.04 · +0.15 · −0.35 |
| S3 | 6.17 [5.99, 6.34] | TC 6.03 | +0.14 [−0.05, +0.33] | 35 / 21 / 16 | +0.02 · +0.44 · −0.03 |

Directly, S1 vs S3 is −0.03 [−0.24, +0.17]. Both S1 and S3 gain only in g2, against the same TC_g2 draw, so that gain belongs to a weak incumbent draw rather than to either arm (§4). Of 720 scores, 716 came back; 4 sagas have one reader. The two readers gave the same score 56% of the time and were within one point 98% of the time.

### Text telemetry (computed from texts.json; per card unless marked)

| arm | card 1 words | finale card words | "carry" | "stands in your way" | card 1 states the open question | card 1 quotes someone | finale report quotes someone |
|---|---|---|---|---|---|---|---|
| G0 (old default) | 66 | 59 | 0.68 | 0.14 | 69/72 | 0/72 | 3/72 |
| TC | 85 | 59 | 0.73 | 0.16 | 63/72 | 72/72 | 55/72 |
| **S1** | 87 | 54 | **0.09** | **0.00** | **52/72** | 72/72 | 52/72 |
| S3 | 86 | 60 | 0.14 | 0.03 | 62/72 | 72/72 | 54/72 |
| PG0 (old default) | 67 | 61 | 0.58 | 0.12 | 66/72 | 0/72 | 8/72 |
| PP | 83 | 61 | 0.72 | 0.13 | **23/72** | 0/72 | 32/72 |
| S2 | 85 | 62 | 0.67 | 0.06 | 58/72 | 71/72 | 53/72 |

### S1: TC + line (+ motive): HOLD

- **What it does:** the plan writes each job's trouble as one sentence (who stands against it, what they will do, and a reason only where the seed or cast already gives one), and the card gets that sentence instead of the `{who, carry, will}` atoms. The motive clause targets round F's forced motives ("…for they are paid by the hive"). "because" appears 0.03 times per card here, against F1's 0.06.
- **Before and after, same slot (F1_2 g1), the trouble at the end of card 1:**
  - TC: *"The human hunter leads them. They carry bows and skinning knives."*
  - S1: *"The hunter is slow but wood-wise. He fears the wardens' fines, so he hides among the old trees with false trails and snares."*
- **Result:** keep held 39–20, ahead in every generation. This replicates round F, where line won keep 40–20 against a different base. Follow passes (+3). The stamps go: "carry" falls from 0.73 to 0.09 per card and "stands in your way" from 0.16 to 0.
- **Against it:** S10 +0.11 with a CI that includes 0, and most of that is the weak TC_g2 draw. The readers' keep reasons credit clue chains and hooks ("the tin tag, the clean saw cuts and the 'fingers scarred by hot metal' narrow things down to the tinker"), which are plan-level, so the reasons do not show how the line lifts keep.
- **Known cost, replicated:** card 1 states the open question less often (TC 63 → S1 52 of 72; round F G0 69 → F1 57). The trouble sentence and its reason crowd the ~85-word voiced card 1.
- **Verdict:** by round T's law this is a keep-only win and does not ship on this evidence. It is still the strongest candidate on the table: no follow cost, keep beyond the floor twice on two bases, and it removes a stock-sentence class. §5 gives the cheap check that decides it.

### S2: PP + voice: NO

- **What it does:** the engine splits PP's two-sentence past. The card quotes the first sentence in the soldier's own words ("I …") *in place of* its narration and tells the rest as "what followed". The finale's secret is said by someone there who could know it. PP's plan is untouched.
- **Same slot (S2_1 g3):**
  - PP: *"At the autumn drive, raiders hit his clan's herd. Gruk fled the high pass and left his young cousin to hold it alone. The cousin died, and the herd scattered."*
  - S2: *"He says, 'I fled the high pass and left my young cousin to die holding the herd.' His clan still calls him a coward."*
- **Result:** flat on everything. Follow 28–29 (behind in g2 and g3), keep 30–26, S10 −0.08.
- **Why:** the quote compresses the past. It keeps the deed but drops the occasion and what followed, and the readers credit the past told plainly: *"Y's card 1 lays out the whole backstory: the raid at shearing, the broken set, the missing king"* (PP). When an opening is cited, PP wins follow 17 to 9.
- **One side effect worth knowing:** S2's card 1 kept the open question in 58 of 72 sagas against PP's 23. The readers did not reward it, so it is not worth chasing on its own.
- **Principle:** voice and the personal past are one lever, a person's own wrong handed to the writer as an item. On a personal saga PP already supplies it, so the quote adds nothing. This is also why TC's round-T gain was largest on personal slots.

### S3: TC + clean: NO

- **What it does:** the verifier's shared-pipeline fixes, as already built in the lab-only `clean` option, plus this round's verifier fixes to it. The job is "asked of you" and the card gives no advice; the hope gloss is rewritten; anyone the seed implies is in the cast; a clue is something the soldiers find, see or hear; and the opponent comes from the job type again, so talk jobs are not fights.
- **Result:** follow +3, keep +5 (g3 behind 6–14), S10 +0.14 with a CI that includes 0. It also clears most of the "carry" stamp (0.14 per card).
- **Verdict:** a neutral bundle. Each fix touches a slice well under the ~15% of losses that 72 pairs can see (round D's principle), and together they still do not show. Do not ship it as a bundle. A fix that is a real game-line defect (a contradiction, a wrong name) can still go in as a code fix on its own evidence.

## 4. Measurement notes

- **S10's level is relative to its batch.** Round T's TC_g1–g3 and PP_g1–g3 were scored again here: these are the same sagas and the same texts. TC fell from 6.43 to 6.03 (41 sagas lower, 5 higher) and PP from 6.97 to 6.74. Yet the per-saga test-retest correlation is r = 0.82 (TC) and 0.74 (PP).
  - So S10 ranks sagas reliably, but readers re-centre "a typical saga ≈ 6" on whatever the batch holds. In round T the batch held the old default; here it held only improved arms.
  - **Law:** compare S10 only inside one shuffled batch, and never across rounds. Put the old default (G0/PG0) in every S10 batch as a fixed anchor, so that progress stays cumulative and a re-centred level shows up.
- **The incumbent's draw.** S1 and S3 were both judged against the same TC draws, and both gain S10 only in g2 (+0.29 and +0.44), against TC_g2. This is the noise-floor law again: arms that share an incumbent draw share its luck, so a gain that appears only against one incumbent generation is not an arm effect.
- **Integrity:** every slot existed before judging. All 144 reads per arm were judged (no MISSING), and 716 of 720 S10 scores came back.

## 5. Recommendation

1. **Keep the game default as shipped:** PP on personal sagas, TC on every other saga. Do not ship S2 or S3.
2. **Decide S1 with one cheap S10 batch, with no new generation.** Score G0 and round F's F1 (both on disk), together with this round's TC and S1, in one shuffled batch with G0 as the anchor. That measures line's S10 effect on two bases at once.
   - If line's pooled S10 difference excludes 0, **ship line + motive on non-personal sagas** (TC → `voice+line`). The follow floor is already passed, and keep has been won twice.
   - If it does not, drop line as a keep-only effect.
   - Either way, card 1 losing its open question is the cost to watch.
3. **Designer rulings needed:**
   - (a) Does a grown soldier ever get a second personal saga, and what is it about (§2)? Until then the growth seeding is built but unused in normal play.
   - (b) No ruling is needed on clean; it is neutral, so the recommendation is to drop it as an arm.
4. **Next experiment, the bigger change (round T's principle carried to hired sagas):** **HP, the asker's own past on hired sagas.**
   - **The evidence:** in round T, what moved story quality was a person's own wrong handed to the writer as an item, and this round's S2 points the same way. PP beat the old default by S10 +0.70. TC's gain was largest where the asker was a soldier with a past (S10 +1.00 on F2 slots). Adding a quote on top of a past added nothing (S2).
   - **The gap:** hired sagas have the voice but no past. The asker wants something, but the story is not about *their* wrong.
   - **The arm:** the plan writes the asker's `past` (2 plain sentences: what happened to them that makes this want theirs) and `change`. Card 1 tells the past *in place of* TC's `says` line, so the card does not grow. The quoted clue and the spoken secret stay, and the finale shows the change. No dossier line, since the asker is not a soldier.
   - **The run:** seed1 non-personal slots, against TC, 3 generations with the −5 early stop, J3 plus S10 with G0 anchors in the batch. Watch card 1 for two risks: the open question (PP already drops it in 49 of 72) and past-overturning reveals (PP's watch item).
5. **Below the pairs' resolution, but real for the player:** the retry contradicted the failure report on 2 of 2 setbacks in the playtest. There are two input fixes:
   - give the failure report, as a fact, that the job's target still stands;
   - give the retry card the failure as a fact that replaces the plan's framing.
   Both touch a small slice (failures only). Judge them by a targeted contradiction count on retry texts across 3 generations, plus J3 not worse, rather than expecting a pair win.

**Plateau watch:** round T shipped. This round ships nothing unless S1 passes its check. If it fails, this is the first failed round after round T, and the next round should be the bigger change (HP), not another slice fix.

Ledger lines added to `docs/STORYTELLER.md` item 9; item 5's checkpoint table updated.
