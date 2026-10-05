# Chain B round: who they became, dealt (CBR, CBT); RF widened (RFW) (2026-10-05)

**Goal (North Star 0):** a soldier's next personal saga is a NEW matter that grows out of who they became, never a retelling of the old wrong. Last round's CB (chain B as it ships, be284f1) was a new matter in only 24 of 72 sagas and grew out of the change in 9 of 72. Its plan was handed the Now (chain A's change, written as the old flaw undone) and built on it (recurring-arcs report §1.4).

**What this round did:**
1. Built a shared input fix (`event`) and two arms. Each arm adds one dealt personal item, on the game's personal pipe (PP plus the cost owner). The game default did not change.
2. Generated CBT × 3 generations × 24 pers1 slots, and CBR × generation 1 only (stopped early, §1.1). Sonnet wrote; every saga completed.
3. Generated RFW (RFA's fact, widened) × 3 generations on the 8 draw-3 slots.
4. Readers, all Opus:
   - an S10 batch of CB, CBT and PP (72 slots, 2 readers per saga);
   - an earlier S10 batch of CB, CBR and CBT on generation 1;
   - one retelling reader per CBR and CBT saga, with chain A beside it;
   - an S10 batch of RFW, TC and G0;
   - a blind count of retry contradictions in RFW and TC.

## 0. Verdict

| | what | numbers | verdict |
|---|---|---|---|
| shared **`event`** (in both arms) | No call gets the Now. The plan writes what just happened (`event`) instead of a `past` | New matter "yes" 24 → **68 of 72** (CBT) and 22 of 24 (CBR). Change copies the Now: 0.40 → **0.04** | It fixes the retelling, but it also takes away the growth: grows out "yes" 9 → 3 of 72 |
| **CBT** | adds one trait from the soldier's card for the matter to test | S10 vs CB **+0.18 [−0.05, +0.40]** (40 better / 25 worse / 7 tied); vs chain A −0.44 [−0.71, −0.15]. Grows out 3 yes / 37 partly / 32 no. Followable "no": 0 | **Not shipped.** It fails 2 of the 4 bars (the S10 CI and grows out) |
| **CBR** | adds a person from chain A who asks for help, with their memory | Generation 1 only. S10 vs CB −0.38 [−0.83, +0.10]. Grows out "yes" 3 of 24 | **Not shipped**, stopped after generation 1 |
| **RFW** | a failed job's report is dealt that job's people and place by name, "all still within the company's reach" | Hard contradictions inside the retry: TC 4 → **0**. All hard ones: 5 → 1. All contradictions: 7 → 4. S10 vs TC +0.25 [−0.10, +0.58] (15 / 5 / 4) | **Ships on both game pipes** (§2.4) |

**After this report, the game default changes in one place only: RFW (§2.4).** Chain B in the game stays CB.

Typecheck is clean and 742 of 742 tests pass (re-run for this report). Nothing is committed.

## 1. Chain B

### 1.1 What ran

These are verified from the run payloads (`calls.jsonl`). They differ from the build summary in two places. The build first sent the Now to card 1 and to the finale. The render verifier then showed two failures:
- **card 1 pasted the Now as a dead-end line:** *"She is a woman never simply thrown away. She wants to hide Rhene…"*;
- **the finale used it to settle the old wrong again:** *"Her father had sent her away from it, not thrown her out"*, which contradicts chain A's gambling debt.

Both were removed before generation.

**Shared (`event`), in both arms:**
- No call gets the Now: not the pick, the plan, card 1 or any report.
- The plan's card-1 field is `event`: *"two plain sentences: what just happened, at what season, that pulls the soldier in"*. Card 1's premise is {who, wants, event, unknown}.
- Reports call the soldier the one *"whose story this is"*.
- A situation that takes a person ("hide someone") is dealt that person; 8 of the 24 slots have one. The verifier had caught the plan folding "someone" onto the soldier: *"hide herself from the cattle baron's rope"*.

**CBT (`trait`):**
- One personality trait or quirk from the soldier's card (`testedTraits`) is sent as `tests`: *"the soldier's trait it puts to the test"*.
- The plan writes the change *"from the trait in tests"*. The trait leads the soldier's traits in the plan and in every report.
- The deal is the same for a slot in every generation, so there are 24 distinct deals, not 72. Six of the 24 drew *domineering* (Hessa ×3, Bran, Yrsa ×2).

**CBR (`returner`):**
- Someone chain A met in a job comes to the fort and *"asks the soldier for help"*. It is never the person chain A was resolved against, and never a captive.
- Their `memory` is the latest chain-A chronicle line that names them, with chain A's other people turned into labels.
- 15 of the 24 generation-1 slots had such a person (44 of 72 across the three PP generations). The other 9 played the shared fix alone.
- **Why it stopped early.** In the generation-1 batch CBR was 0.38 behind CB and 0.27 behind CBT. Its retelling reads showed no gain in growth (3 of 24). Generations 2 and 3 (about $6) were not bought.

### 1.2 Numbers

**S10, one shuffled batch:** 72 slots × 3 arms × 2 readers, 432 of 432 scores. Pairs are matched by slot and generation; paired bootstrap with 10,000 resamples.

| arm | S10 | g1 | g2 | g3 |
|---|---|---|---|---|
| PP (chain A, shipped) | **6.60** | 6.43 | 6.71 | 6.67 |
| **CBT** | **6.16** | 6.35 | 6.15 | 5.99 |
| CB (chain B, shipped) | **5.99** | 5.96 | 6.17 | 5.83 |

| pair | Δ S10 [95% CI] | better / worse / tie | by generation |
|---|---|---|---|
| CBT − CB | **+0.18 [−0.05, +0.40]** | 40 / 25 / 7 (sign p = 0.08) | +0.40 · −0.02 · +0.16 |
| CBT − PP | −0.44 [−0.71, −0.15] | 20 / 42 / 10 | −0.07 · −0.56 · −0.68 |
| CB − PP (anchor) | −0.61 [−0.86, −0.36] | 15 / 44 / 13 | −0.47 · −0.54 · −0.83 |

- The anchor replicates: last round measured CB − PP at −0.64.
- CBT is ahead of CB in all three draws: +0.21, +0.14 and +0.19.
- It moves soldiers apart. Gruk is +0.83 over CB (and +0.44 over his own chain A) and Ilwen +0.61. Yrsa is −0.50 and Bran −0.39 (see §1.4).

**Generation-1 batch** (CB, CBR, CBT; 24 slots × 2 readers; 144 of 144 scores):

| pair | Δ S10 [95% CI] | better / worse / tie |
|---|---|---|
| CBR − CB | −0.38 [−0.83, +0.10] | 6 / 14 / 4 |
| CBT − CB | −0.10 [−0.60, +0.38] | 11 / 11 / 2 |
| CBR − CBT | −0.27 [−0.67, +0.10] | 9 / 13 / 2 |

The same CBT_g1 and CB_g1 sagas came out at +0.40 in one batch and −0.10 in the other. On 24 slots, the batch alone moves the margin by about ±0.25. Pooling every read from both batches puts CBT − CB at +0.09 [−0.13, +0.32]. The decisive figure is the one-batch number above.

**Retelling reads** (one reader per saga, with chain A beside it):

| | new matter (yes / partly / no) | grows out of who they became | followable on one read | both yes |
|---|---|---|---|---|
| CB (last round, 72) | 24 / 36 / 12 | 9 / 38 / 25 | 20 / 52 / 0 | 8 |
| **CBT** (72) | **68** / 4 / 0 | **3** / 37 / 32 | 40 / 32 / 0 | 3 |
| **CBR** (generation 1, 24) | 22 / 2 / 0 | 3 / 16 / 5 | 10 / 14 / 0 | 3 |

**Change copies the Now** (log-only): the share of the change's content words that also appear in the Now. CB was re-scored offline with the same function; the stored CBT and CBR values match it exactly.

| arm | mean | at half or more | word for word |
|---|---|---|---|
| CB | 0.40 | 26 of 72 | 10 |
| CBT | 0.04 | 0 | 0 |
| CBR | 0.05 | 0 | 0 |

**The bars** (recurring-arcs report §1.6):

| bar | CBT | CBR |
|---|---|---|
| S10 above CB beyond its CI | +0.18 [−0.05, +0.40] ✗ | −0.38 [−0.83, +0.10] ✗ |
| new matter "yes" in at least half | 68 of 72 ✓ | 22 of 24 ✓ |
| grows out "yes" well above 9 of 72 | 3 of 72 ✗ | 3 of 24 ✗ |
| followable kept | 0 "no", 40 "yes" ✓ | 0 "no" ✓ |

**Caveat.** The retelling reads come from a new batch with no CB in it, so CB's row is last round's reader. That reader's generation 1 was harsh (new matter "yes" in 2 of 24). This round's CBT counts per generation are 22 / 24 / 22, so the gap is far beyond that spread.

### 1.3 What the shared fix did: the retelling is gone

The plan no longer sees the old flaw, so it no longer re-stages it.

- **Yrsa (S8_2 g1):** same soldier, same dealt "hide someone", same draw.
  - CB card 1: *"Yrsa believed her father cast her off as a child. Now she sees the baron wants her, and she does not know why."* That is the question chain A answered.
  - CBT card 1: *"Yrsa Greypelt, one of your soldiers, wants to keep the elf carter from the cattle baron's rope. The baron's riders seized him in late autumn over a dead prize cow."*
- **Gruk (S2_1 g3).** Chain A was about a goat. CB: *"wants to protect his clan's old goat and bring it home. Years ago he ran off with a stolen coin and left the goat as pledge at the abbey."* CBT: a beekeeper the abbot means to hang.
- No CBT or CBR saga was read as "new matter: no". Readers: *"Saving the framed carter is new"*; *"a fresh wrong and never touches the old draught"*.
- Inside CBT, S10 follows followability: sagas read "followable: yes" score 6.59, "partly" 5.62.

### 1.4 Why the growth fell (classes, with quotes)

**The cause: no call is handed who they became.** B1 holds both ways. The plan builds on what it is handed, and only on that. With the Now gone, the stories fit who the soldier became but never use it.
- 21 CBT reads say the link is only implied:
  - *"fit a man who now stands his ground and owns his wrongs, though the saga never draws that link"* (S2_3 g1);
  - *"echoes the Sesh who now keeps every watch, though the text never draws that link"* (S4_3 g3).
- Growing out still tracks the story score inside CBT: S10 6.83 where it grows out, 6.28 partly, 5.97 not at all.

**1. CBT: the trait becomes a new flaw, then undone.** The plan's `change` field turns whatever personal item it gets into a flaw to undo. Handed a card trait, it writes the trait's opposite: a flaw born in this saga.
- *domineering* (6 slots × 3 generations = 18 sagas) gives:
  - *"Hessa Thatcher has learned to hear people out before she gives them orders."*
  - *"Bran Redhand has learned to ask and to listen, and no longer only barks orders."*
  - *"Yrsa Greypelt has learned to hear the toll-keeper out before giving orders."*
- 20 of 72 CBT changes say hear, listen or orders; CB had 1. One stock arc now runs across three soldiers.
- 20 reads name a new flaw born here, and 15 of those score grows out "no":
  - *"her growth into letting the frightened miller speak comes from her domineering trait, not chain A"* (S1_1 g1);
  - *"the barking-orders-to-listening arc is real, but it starts inside this saga rather than from the cleared man walking home under his own name"* (S5_3 g2);
  - *"a new flaw to drop … that has nothing to do with the man who learned to stand and own his running"* (S2_2 g2).
- **Where the card trait was also chain A's flaw, chain A's arc runs again.** Yrsa (*playful*), S8_3, all three generations: *"Yrsa Greypelt stops joking away what frightens her and says plainly what she needs."* That is chain A's change. Reader: *"she is back to joking and ends on 'Yrsa did not joke' again, re-running chain A's growth instead of building on it."* This is why Yrsa is CBT's worst soldier: −1.36 against her chain A.

**2. CBR: the memory is a chain-A job line, so it brings back chain A's events, not the person.** The memory is written about the company and keeps the job's cost.
- **S5_1.** Memory: *"…won over the wolfkin ferryman at Rushhollow, and he agreed to stand with them, though Bran lost his shield."* Card 1 repeats it: *"…though Bran lost his shield."* Part 2 then loses the shield again; the S10 reader: *"Bran loses his shield twice."*
- **S3_3.** The memory's *"though a horse was lamed"* comes back as *"a horse nobody mentioned goes lame (copied from the last saga's ending)."*
- **S6_3.** A memory of freeing the herbalist from the Bramcot cellars turns into an old oath no reader can place: *"recalled his oath, sworn in the Bramcot cellars."*
- **Card 1 points back to events the reader never saw.** S10 readers, who read chain B alone, flagged this in 6 of 15 returner slots:
  - *"Card_1 is hard to parse. It points back to earlier events ('won over Ortis in Lingbourne')"* (S3_1);
  - *"Card 1 is garbled (an off-screen 'you found the hidden wolfkin', a pile of dale names)"* (S8_1);
  - *"Rhene arrives at the fort wounded, yet 'you reached Millcot and found her'"* (S8_2).
- **The tie runs through the person, not the soldier.** With a returner, grows out was "no" in 0 of 15 slots (5 of 9 without one), but "yes" in only 2.
- **It picks by seat, not by side.** S5_2 brought back Dralasa, chain A's slaver: *"It circles back to the brother and the slaver Dralasa instead of something new."*
- **S10, same slots:** CBR with a returner 5.90, against CB's 6.13 on those slots; without one 6.11, against 6.72.

**3. The S10 reader cannot see growth.** It reads chain B alone, so a callback counts as "no setup" and growth is invisible. An arm that grows out of chain A pays for it in S10 and gets no credit. A player has the dossier on the soldier sheet ("Story so far").

### 1.5 One soldier, verbatim: Gruk Ironjaw (pers1 S2_1, g3, CBT)

**Chain A's ending** (PP_g3/S2_1, finale report):
> Pateem stepped out first, with her hands open. Gruk followed and laid the boar's tusks on the grass. Talso Brightwater drew his bow and said nothing. Pateem spoke of the cairn and the bell. She said a man did not tend a grave so well for a stranger. Talso's arm shook. Gruk told him what the raider captive had said. The raiders had quit the pass because of arrows from the ridge. Gruk said he had run, and the boy had stood. Talso lowered the bow. He said he had watched from the ridge and had come too late. The boy had begged him to keep the goat from the raiders. He had kept it out of guilt, and he would not give it to the cousin who ran. Pateem told him the cousin was here and had not run this time. Talso looked long at Gruk, then nodded. Gruk used the sketch to find the pen. He led the goat out himself and held its rope as his own.
> 📖 The Goat at the Standing Stones: it is settled. The company talked the poacher Talso Brightwater round at Whinbarrow and brought the cousin's goat back, which Gruk Ironjaw now holds as his own.

**The dossier's Now** (sent to no CBT call): *"Gruk Ironjaw stands his ground where he once ran, and walks the goat home to his clan's standing stones."*

Dealt: *protect someone* · funeral, coffin, cellar · tests: *tough*.

**Chain B, card 1** (CBT_g3, "The Beekeeper's Burial"):
> Gruk Ironjaw, one of your soldiers, wants to keep the human beekeeper safe. Once, the beekeeper fed him and hid him. In early autumn, the elf abbot's men burned the beekeeper's hives. They swore to hang him when the old abbot's funeral is done. Nobody knows why the abbot wants this. Gruk hears of it at the fort and rides west alone. You follow. The job is to find the hiding beekeeper in the woods near Yarstead. Then you bring him under the company's guard. The abbot's mounted men hunt him too. They carry torches and crossbows.

**Chain B's ending** (finale report body):
> Pateem Salt-born stepped forward and spoke low and calm. She laid the abbot's sealed writ before him and named its orders. Brelyn went stiff. She held up the brass plate. It showed the coffin was filled with stones. Then she called on Turgis to speak of the grave. Turgis told how the old abbot had asked to rest under the hives, among the bees. Pateem put it together for the crowd. The abbot's men had dug through the burned hive ground and the cellar, searching. The writ held the beekeeper alive only until the funeral. Brelyn needed the body for a grand funeral, or the pilgrims' gifts and his seat were lost. He wanted the one man who knew silenced. The crowd muttered. Brelyn gave up his claim on Turgis. A guard stepped toward the beekeeper, and Gruk Ironjaw moved between them and took the shove on his own shoulder. He did not strike back. He walked Turgis out of the yard and home, safe from the abbot's reach for good.

**The plan's change:** *"Gruk Ironjaw has learned that being tough means taking the blow meant for another, not only dealing blows."*

**How the readers rated it:**
- Retelling reader: new matter yes, grows out yes, followable yes. *"Gruk, who once fled and left his cousin to die, now rides out alone to guard the beekeeper who once hid him, and at the end he steps in and takes the shove for Turgis."*
- S10: 8 and 7. His chain A scored 8 and 8. CB on the same slot scored 6 and 7, and it brought back the clan goat.

**It worked by luck.** The dealt trait (*tough*) happened to point the way the Now points; the plan never saw the Now. The common case is Yrsa S8_2 (*domineering*). All three generations wrote *"let the carter choose his own road instead of ruling it for him"*. The generation-3 reader: *"nothing ties it to her past or to her learning to ask plainly for what she needs."*

### 1.6 Verdict and next

**Not shipped. The game's chain B stays CB.** Neither arm clears the bar. Both fix the retelling and lose the growth.

What the round found is the lever: the one personal item the plan is handed.

| what chain B's plan is handed | new matter | grows out |
|---|---|---|
| the old wrong (`history`) | 0 of 8 | — |
| the settled marks | 4 of 8 reopened | — |
| the Now beside the seed (CB) | 24 of 72 | 9 of 72 |
| no Now, plus a card trait (CBT) | 68 of 72 | 3 of 72 |
| no Now, plus a person from chain A (CBR) | 22 of 24 | 3 of 24 |

**Principle:** the plan builds on what it is handed, and only on that, and its `change` field turns that item into a flaw to undo.
- The Now is itself written as "the old flaw undone", so it comes back as the old flaw (CB).
- A card trait comes back as a new flaw with no tie to chain A (CBT).

**Next — a proposal to plan, not built:**
1. Hand the plan who the soldier became in the slot it obeys, as what the new matter *tests*, not as its topic.
   - CBT showed the `tests` slot is obeyed: the change came from the dealt trait across the arm.
   - Candidate arm: `tests` takes the dossier's Now in place of a card trait, with `event` kept.
   - The risk is CB's: the change copying the Now (0.40 in CB). The change-vs-Now overlap and the retelling read guard against it.
2. If CBR comes back: the memory is the person's own act in chain A, never the job's line with its cost.
3. Measurement: give every chain-B S10 reader the soldier's dossier lines (the "Story so far" the player sees), for every arm in the batch. Growth can then count, and a callback stops reading as "no setup".

## 2. RFW: RF's fact, widened and named

### 2.1 What it is

RFW is RFA (TC plus `stands`) with the fact widened and made concrete. A real payload (g2 F3_3):

> "Eraldil, Eussorus, the barn at Thorncroft and whatever else the job names, all still within the company's reach, for the company tries this job again"

- The final clause is added only when the engine will pose the job again.
- RFW carries no `owncost`, so on disk it differs from RFA only in the fact's words.
- It ran the 8 draw-3 slots × 3 generations, replaying A2's deals: 24 of 24 sagas.

### 2.2 Numbers

**S10, one batch** (24 sagas × 3 arms × 2 readers, 144 of 144 scores):

| arm | S10 | g1 | g2 | g3 |
|---|---|---|---|---|
| **RFW** | **6.46** | 6.50 | 6.44 | 6.44 |
| TC (shipped) | 6.21 | 6.56 | 6.06 | 6.00 |
| G0 | 5.94 | 5.94 | 5.75 | 6.12 |

| pair | Δ S10 [95% CI] | better / worse / tie | by generation |
|---|---|---|---|
| RFW − TC | **+0.25 [−0.10, +0.58]** | 15 / 5 / 4 (sign p = 0.04) | −0.06 · +0.38 · +0.44 |
| RFW − G0 | +0.52 [+0.21, +0.85] | 15 / 3 / 6 | |
| TC − G0 | +0.27 [−0.12, +0.67] | 13 / 7 / 4 | |

**Retry contradictions** (blind count; *hard* = a later text needs what the failure removed):

| | failures | contradictions | hard | hard inside the retry | hard after the last failure |
|---|---|---|---|---|---|
| TC | 26 | 7 | 5 (3 sagas) | 4 | 1 |
| RFA (last round) | 27 | 4 | 2 (1 saga) | 2 | 0 |
| **RFW** | 27 | **4** | **1** | **0** | 1 |

S10 reads calling the saga a job log: RFW 5, TC 9, G0 18.

### 2.3 Classes

**What it fixed.** RFW has none of TC's hard cases:
- a captive back free with no word of how (g1 F2_3);
- a hanged man cut from the rope alive (g1 F7_3);
- a burned barn whole again on the retry (g2 F3_3).

RFA's case, a barn the raiders took and then *"held again"*, is gone too. In RFW g3 the retry after the first failure is consistent.

**What remains.** Each class is outside the retry, and TC has every one:

1. **The last failure ignores the fact.**
   - With the reason clause (*"for the company tries this job again"*), the guarded barn stood both times:
     - g2: *"Fire caught the thatch above the doors. The company beat it out… Hrormir called the fall back to the stalls."*;
     - g3: *"Trelon dropped from the loft to beat it out"*.
   - On the last failure no retry follows, so the clause is absent, and both burned it. In g2 the report was dealt *"Eraldil, Eussorus, the barn at Thorncroft … all still within the company's reach"* and still wrote *"The barn burned. Hrormir pulled Eraldil clear and watched the beams fall."* The finale then says *"Eraldil's barn and warhorse were left in peace"*: RFW's one hard contradiction. TC's same slot: *"Eraldil's warhorse stayed safe in her barn."*
   - In g3 the fact itself also dropped the barn. The job *"Hold the barn against night raiders at Thorncroft farm"* puts more than two words between the barn and the place, so `standing` fell back to the bare "Thorncroft".
2. **A gain the company holds is lost in a failure.**
   - g1 F7_3: *"The scout slipped his rope in the noise and ran into the trees."* Held still lists him, and the finale reads *"The captured scout led them down a hidden path to the dam."*
   - TC g1 F1_3 does the same with the hare.
   - The fact names what the job names, not what the company holds.
3. **A person with no part in the job turns up as a cameo** (from the verifier; both arms). A report gets someone with no part in its job: *"Eussorus fled behind his cart."*

### 2.4 Verdict: ships on both game pipes

- **The bar, set before the run:** hard contradictions ≈ 0, and S10 not below TC beyond its CI.
- **Hard:** inside the retry, the window the fact governs, there are 0 (TC 4). The one left comes after the last failure, where TC fails the same way.
- **S10:** +0.25, with the CI's floor at −0.10.

**The game default becomes:**
- `GAME_PIPE` is unchanged: personal sagas play `past`, every other saga `voice`.
- `PIPE_PARTS.voice`: grafts, says, witness, teller, owncost, **plus stands, reach**.
- `PIPE_PARTS.past`: grafts, past, owncost, **plus stands, reach**.
- **The effect:** every failed job's report gets `stands`. That covers a middle job's failure and the last failure before the finale, never the finale itself. The fact reads:
  - the job's people by name (not the soldiers sent);
  - its place as the job states it;
  - *"and whatever else the job names, all still within the company's reach"*;
  - *", for the company tries this job again"* when the engine will pose the job again.
- The plan, the cards, the retry card and every success report are unchanged. Chain B plays `past`, so it gets the fact too.

**At ship:**
- The gamedefault and golden fixtures change, on failure reports only.
- `past` with `reach` has no real text yet: RFW played TC, and F2_3 is a personal slot played on TC. Run one mock floor and one real PP saga with a failed job as a smoke check.
- Lab TC and PP generated after the switch carry the fact. TC_g* and PP_g* on disk do not.

**Next (small, not built):**
- Give the last failure's fact its own reason, e.g. *"for the last chance turns on them"*.
- Add the company's held gains to the fact.
- Only 3 of 24 sagas reach a last failure, so test this with a targeted F3_3 rerun, not a batch.

## 3. Measurement and integrity notes

- **Completeness** (`--check`): CBR_g1 24/24, CBT_g1–g3 72/72, RFW_g1–g3 24/24.
- **Code version.** Every CBR, CBT and RFW saga was generated after the last code edit (17:39). That edit touched only `standing`, which is RFW's. The CBR/CBT code was stable from 17:34. The payloads confirm the post-verifier inputs: no `now` on card 1, no `became` in the finale, and the `someone` person dealt.
- **Reader agreement** (exact / within one point):

  | batch | exact | within one |
  |---|---|---|
  | chain B | 56% | 97% |
  | generation 1 | 51% | 99% |
  | RFW | 54% | 100% |

  Two reads gave half scores (6.5 and 7.5).
- **S10 levels depend on the batch.** CB_g1 scored 5.96 in the chain-B batch and 6.35 in the generation-1 batch. Compare only inside one batch.
- **CBT's trait deal is fixed per slot**, so its 72 sagas test 24 deals.
- **Cost:** CBR $2.95, CBT $8.16, RFW $2.81, about $13.9 in all. Per saga: CBR $0.12, CBT $0.11, RFW $0.12.

## 4. For the designer

1. **RFW ships on both pipes** (§2.4). This is the only change to the game default. Please confirm or overrule.
2. **Chain B stays CB in the game.** CBT fixes the retelling (new matter 68 of 72, no copied Now) and is a step ahead on S10, inside its CI. But it loses the growth (3 of 72), which is the other half of your ruling. If you weigh "never a retelling" above "grows out", CBT matches the ruling's words better than CB. By the pre-set bar it does not ship.
3. **The next chain-B round:** hand the plan who the soldier became as what the new matter tests (`tests` ← the Now), and give the S10 readers the dossier (§1.6).
4. **Still open:**
   - **The live game's chain B seats one tied face from the lore, with its memory** (CB's People line). `persistMetCast` remembers chain A's opponent first, as a rival. So the game may seat the very person chain A was resolved against, and the memory brings back chain A's job line (CBR's class 2). The lab never tested this path, because it has no lore.
   - **Verifier findings not built**, on every arm and on the shipped pipes:
     - The change is written as the showdown's deed while the engine rolls who decides. Jervaise does the talking, and Yrsa's change shrinks to a gesture.
     - Edges written as fallbacks: *"The hermitage waits as a place to hide him"*.
     - Learns the soldiers cannot find on the page.
     - People with no part (§2.3).
   - **The cost "the locals' goodwill, lost"** reads as a village turning on the company for no reason. S10 readers flagged it 11 times in CBT, against 2 in CB and 2 in PP, though each arm carries it in 18–19 sagas.

**Files:**
- Runs: `runs/pers1/CBR_g1`, `CBT_g1–g3`; `runs/seed1/RFW_g1–g3`.
- Code (uncommitted): `src/engine/saga.ts` (arms `past+return`, `past+trait`, `voice+reach`), `src/engine/plainwords.ts` (`testedTraits`), `src/game/sagaflow.ts` (deal, `standsFact`), `src/ai/storyteller.ts` (`standing`, `changeNowShare`), `prompts/saga/{plan,card,report}.txt`, `scripts/sagalab/seedlab.ts`.
- Tests: `livingdossier`, `seedarms`, `sagaprompts`, `sagaharness`.

---
Written to /home/irvan/airaider/v3/scripts/sagalab/reports/2026-10-05-chain-b-round.md. Ledger lines were added to /home/irvan/airaider/docs/STORYTELLER.md item 9, after "Kept: the cost owner": a "Did not" entry for the chain-B round (shared `event`, CBT, CBR and the principle), a measurement law (give chain-B readers the dossier), and "Worked → ships" for RFW. The game default code was not changed and nothing is committed.