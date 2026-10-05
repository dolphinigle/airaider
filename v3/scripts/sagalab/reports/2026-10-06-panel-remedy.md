# Panel remedy: whom the job is for and why this job, given to the card writer (2026-10-06)

**Question.** Without the forward quest log, hired sagas got harder to follow (saga panel, 2026-10-05: S10 −0.39, lost +0.43). The panel's §6 proposed giving the card writer two things the log used to carry:
- the asker and their want;
- the lead into each job.

Does either one win the loss back? The log stays hidden, as ruled.

**Answer.**
- **Neither arm ships under the pre-registered rule. The game default does not change.**
- **NW** (the want only) fails both halves of the rule. Its middle cards got worse.
- **NWL** (the want plus the lead) passes the lost half and fails the S10 half. It wins back about half the loss on both numbers (S10 +0.18 of 0.39; lost −0.21 of 0.47), but neither gain is beyond the noise.
- **What NWL fixed:**
  - Every finale now names the asker, against 17 of 48 in NV.
  - No card is left without a reason.
  - Cold "now you must…" lines on later cards were halved, down to the level they had with the log.
- **What it cost:** the lead sentence became the new place readers lose track. A lead does its job only when it repeats a fact the page has already shown.

## 1. What was compared

| arm | pipe | what the card writer gets |
|---|---|---|
| **NV** | `voice`, the game's hired pipe | no log, So far rows (anchor) |
| **LV** | `voice+log` | the same pipe with the old log (anchor) |
| **NW** | `voice+want` | every later card's one `why` opens with the asker's name, label and want, then the job's hope: "Laudus Fairweather, a merchant, wants…, and hopes…". With no hope (always on the finale, and where a hope would tell its own clue), the want comes before the job. The plan and card 1 are the same as NV's. |
| **NWL** | `voice+want+link` | NW, plus the plan's lead, "what the last learn says of this job's person or place", for job 2 on and for the finale. It is put into the card's `latest`, after the win and before the job. Card 1 gets no lead, because the plan prompt stays at its 620-word budget and round F found that card 1 overloads. |

- **The arms are broader than §6.** The context-free verifier's pass changed them before generation:
  - The want went from cards with no hope to every later card.
  - The lead moved from `why` into `latest`.
  - The finale got a lead.
- **Set:** seed1, A2's replayed deals, 24 slots × 2 generations (g1, g2). That gives 48 pairs. A pair is the same slot and generation, with each arm writing its own plan from the same deal.
  - The F2 slots are personal sagas played on the voice pipe.
  - Dropping them (42 pairs) changes no verdict.
- **All NW and NWL folders are on the final code:**
  - 48 of 48 finales carry the want with `wantfirst`.
  - Every NWL middle card and 47 of 48 finales carry a lead in `latest` (113 cards). By design, retries get none, and neither does a finale after a lost job.
  - The six g1 slots made before the fix were regenerated.
- **Readers:** one shuffled batch of all four arms (384 reads). Each saga was read by two blind Opus readers, giving S10 and lost points with quotes.
  - The readers agreed exactly 61% of the time and within one point 98% of the time.
  - Every saga was present.

## 2. Results (paired by slot and generation; 95% bootstrap CI over 48 pairs)

| comparison | S10 diff | arm higher / lower / tied | S10 g1 · g2 | lost diff | lost g1 · g2 |
|---|---|---|---|---|---|
| NW − NV | +0.14 [−0.14, +0.40] | 27 / 13 / 8 | +0.21 · +0.06 | +0.06 [−0.25, +0.38] | +0.10 · +0.02 |
| NWL − NV | **+0.18 [−0.09, +0.45]** | 24 / 17 / 7 | +0.27 · +0.08 | −0.21 [−0.56, +0.14] | −0.21 · −0.21 |
| NW − LV | −0.25 [−0.52, +0.02] | 13 / 19 / 16 | −0.25 · −0.25 | **+0.53 [+0.19, +0.86]** | +0.52 · +0.54 |
| NWL − LV | −0.21 [−0.49, +0.07] | 17 / 24 / 7 | −0.19 · −0.23 | **+0.26 [−0.09, +0.60]** | +0.21 · +0.31 |
| NWL − NW | +0.04 [−0.23, +0.30] | 21 / 14 / 13 | | −0.27 [−0.61, +0.07] | |
| LV − NV (replication) | +0.39 [+0.11, +0.66] | 28 / 11 / 9 | | −0.47 [−0.81, −0.14] | |

- **Means** (S10 / lost per saga): NV 5.73 / 3.03 · LV 6.11 / 2.56 · NW 5.86 / 3.09 · NWL 5.91 / 2.82.
- **Resampling whole slots** gives the same answers:
  - NWL − NV S10 [−0.10, +0.45]
  - NWL − LV lost [−0.11, +0.64]
  - NW − LV lost [+0.18, +0.90]
- **The panel's loss replicates.** The same NV and LV sagas, read again by new readers, give LV − NV +0.39 / −0.47, against the panel's +0.39 / −0.43.

## 3. The panel's three lost classes, per arm

Each lost quote was located in its saga file (all 1106 were found) and sorted by card position and by the kind of line. The numbers are per saga, the mean of 2 reads.

| | NV | LV | NW | NWL |
|---|---|---|---|---|
| **4.1 cold next job:** a later card's job or hope line quoted as lost | 0.82 | 0.54 (+0.10 on card 1's road rows) | 1.02 | **0.43** |
| ... on middle cards | 0.48 | 0.21 | 0.69 | 0.18 |
| new: quotes on NWL's lead sentence | | | | 0.46 (44 quotes; 11 are also the job line) |
| **4.2 whom-for:** finale names the asker (prose or ON THIS MATTER) | 17/48 | 48/48 | **48/48** | **48/48** |
| ... in the finale's prose | 10/48 | 10/48 | 48/48 | 48/48 |
| ... finale states the want | 0/48 | 1/48 | 47/48 | 47/48 |
| ... reads that say the client dropped off | 3 | 0 | 0 | 0 |
| ... lost on the finale card | 0.58 | 0.56 | 0.47 | 0.52 |
| **4.3 no reason at all:** middle cards dealt no why | 7 | 7 | **0** | **0** |
| ... lost per read on those cards | 0.79 | 0.43 | | |
| ... cards where the want stands alone (hope withheld) | | | 4 (0.50 per read) | 2 (0.50 per read) |

### 4.1 Cold next job

**NWL halves it.**
- NWL − NV: −0.40 [−0.62, −0.18].
- NWL − LV: −0.11 [−0.33, +0.10]. Counting LV's road-row quotes, NWL − LV is −0.22 [−0.43, −0.01].
- Examples of the class:
  - NV, F2_1 g1, flagged by both readers: *"Now you must bring the elf charcoal-burner from Hawhollow safely to Harrowlea."*
  - LV, F2_1 g1, flagged by both readers even with the road: *"Now you must win over the elf weaver at the tavern in Harrowlea."*
  - NWL, F5_2 g1, a want-only card: *"Now you must track the fox that raids the goat pens near Linglea."* This is the class that remains in NWL.

**NW makes it worse.**
- On middle cards: +0.21 [+0.02, +0.40]. Hope lines quoted as lost went from 4 to 21.
- All NW middle-card lost: 0.57 → 0.83 per saga, +0.26 [+0.04, +0.47].
- The want became a stock sentence: it is on 77 of 82 NW middle cards (NV: 5). It sits between the job and the job's own reason, NW F8_1 g2 card 2:
  > Now you sneak the mason out of the mine house at Marlwell. Autonoe of the Ford, a ferrywoman, wants the ferry fees the merchant owes her. She hopes the mason built the strongroom and can show where it is and how to open it.
- Both readers flagged the hope line ("the mason and the strongroom come from nowhere").
- The want says whom the job is for. It does not say why this mason, and with the goal stated beside the job, the missing link shows more.

**NWL's lead is the new lost spot.**
- 44 of NWL's 96 later-card lost quotes touch the lead. The lead swapped a cold job line for a cold lead line almost one for one.
  - *"The tinker at Dewbourne buys antler."* (F1_2 g1: "the tinker arrives with no link to the story")
  - *"Little can be left of Rautio's hoard."* (F1_2 g1: "first mention of any hoard")
  - *"The tin tokens were struck in Marlholt, and a courier now carries the smugglers' accounts away."* (F1_2 g2: "how is this known?")
- **Dose-response.** The lead is supposed to be what the last report showed. For each lead, we measured what share of its content words the page had shown before the card:

| lead's words shown earlier | cards | lost per read on the card |
|---|---|---|
| under 50% | 29 | 0.59 |
| 50–75% | 50 | 0.39 |
| 75% or more | 34 | 0.32 |

- For reference, an NV middle card with a hope costs 0.29, and an LV one 0.13.
- On average a lead shares only 50% of its words with the previous report. It usually extends the clue with a new fact.
- A lead that repeats what the player read works. A lead that brings a new fact is one more thing that arrives cold.
- The word-share measure is crude (paraphrase hides overlap). It points one way and has not been checked by hand.

### 4.2 Whom the job is for

**Fixed by construction in both arms.**
- Every NW and NWL finale names the asker in its prose, and 47 of 48 state the want.
- Three NV reads named this class, for example:
  - F8_1 g1: *"Cydippe, the toll-keeper, has taken your side and opened her records to you."* ("the client Autonoe drops out of the finale card entirely")
  - F7_3 g1: "the gallows finale comes with no reason why the client needs her"
- No NW or NWL read did.
- The finale's lost points barely move (0.58 → 0.47 / 0.52), because this class was never where NV and LV differed. LV's finale was 0.56.

### 4.3 No reason at all

**Gone in both arms.**
- No card is dealt without a why; NV had 7 such cards (0.79 lost per read).
- NV example, F5_3 g2, both readers: *"Next, you must win over the herbalist at Nethercroft."*
- **What is left:** the few cards where the want stands in for a withheld hope still cost 0.50 per read. NW F1_3 g2, both readers: *"The reeve's message doves must be taken first."* The want says whom the job is for, not what this job is for.

### Where the remaining gap sits

| lost per saga | NV | LV | NW | NWL |
|---|---|---|---|---|
| card 1 | 0.49 | 0.48 | 0.58 | 0.44 |
| middle cards | 0.57 | 0.26 | 0.83 | 0.49 |
| finale card | 0.58 | 0.56 | 0.47 | 0.52 |
| reports | 1.38 | 1.26 | 1.22 | 1.38 |

- NWL's remaining gap to LV is on the middle cards: +0.23 [+0.02, +0.45]. That is the lead's own cost.

## 4. One finale: seed1 F2_1, generation 1, card 3

The deal is the same; each arm wrote its own plan.

| arm | S10 (two readers) |
|---|---|
| NV | 5 / 5 |
| NW | 6 / 6 |
| NWL | 6 / 6 |
| LV | 8 / 7 |

No arm won, so NV is set beside NWL, the arm that passed half the rule.

**NV.** Jervaise is not on the card, and "the brother's bond" points at no one.
```
So far:
  ✓ The Weaver at the Tavern — The company went into the Rushmoss tavern, got past the magistrate's bullies, and found the weaver, who agreed to speak with them.
Thiile, the charcoal-burner, has reached Harrowlea safe. Your task now is to make the elf magistrate give up the brother's bond, here in the town. She stands against you with her wardens. They hold the bond and the law. They will keep the brother bound, and they will use that law to do it.
ON THIS MATTER: Thiile — elf charcoal-burner
```

**NWL.**
- The second sentence is the lead.
- The third is the want, which comes before the job.
- Neither reader lost track on this card.
```
So far:
  ✓ The Burner in the Hollow — The company found the hidden charcoal-burner near Hawhollow, and he chose to stand with them, safe from the bailiffs, and told Jervaise where her brother was.
Vulmon, the weaver, took your side and handed over the hidden cloth. It marks the debt as paid, yet the magistrate still holds the brother. Jervaise Greyfell, one of your soldiers, wants her younger brother freed from the debt-master's bond. You go to the magistrate's hall in Harrowlea and make her let him go. The elf magistrate waits with her guards. They carry spears and the bond itself. They will keep the brother bound.
ON THIS MATTER: Jervaise Greyfell — human soldier · Vulmon — elf weaver
```

- NW's finale reads the same way, without the lead's "It marks the debt as paid, yet…".
- Both arms paste "one of your soldiers" as an appositive. This happens on personal-on-voice slots only, and no reader flagged it.

## 5. Verdict

The rule: an arm ships if its lost − LV CI includes 0 or lies below it, **and** its S10 − NV CI lies above 0.

| arm | lost − LV | first half | S10 − NV | second half | ships |
|---|---|---|---|---|---|
| NW | +0.53 [+0.19, +0.86] | fails | +0.14 [−0.14, +0.40] | fails | **no** |
| NWL | +0.26 [−0.09, +0.60] | passes | +0.18 [−0.09, +0.45] | fails | **no** |

**The game default stays as it is:**
- `GAME_PIPE` = `{ personal: 'past', other: 'voice' }`.
- `voice` and `past` keep `grafts`, `owncost`, `stands`, `reach` and `sofar`. `voice` also keeps its own parts.
- Nothing in `VOICE_PIPE` / `PAST_PIPE` was touched. NW and NWL live only as lab arms.

**What was learned (principles):**
1. **The want answers whom the job is for, not why this job.**
   - Dealt to cards with no hope, it fixes classes 4.2 and 4.3 by construction.
   - Dealt to every card, it becomes a stock sentence (law 6b) and makes middle cards worse.
2. **A lead helps only when it repeats what the page already showed** ("knowing counts only what is shown").
   - The plan writes the lead before play, from its own `learn`.
   - The report shows only part of that learn. About a quarter of the leads (29 of 113) share under half their words with anything shown before, and those cost the most.

**Next arm (not built).** It applies both principles to NWL. Each change folds into an item that already exists (law 6b):
- **The want only where there is no hope:** the finale, and a withheld hope. This is §6 as first written.
- **The lead folded into the previous report's clue:** the report is dealt the lead with the learn it already shows, so the next card's `latest` repeats a fact the player has read.
- **The test:** the same batch design (NV and LV as anchors, seed1, 2 generations), under the same rule.

**Personal, when a hired arm ships:**
- **PW (`past+want`) is built, not run.**
- **Link on personal:** PP's plan already sits at its 620-word budget, and `past+link+midlead` is 634 words. Link can land there only by cutting one of PP's measured lines. That is a designer ruling.
- **The smoke check personal needs:** a real PP saga on pers1, one with a withheld hope and one finale. Read it card by card to check that:
  - the soldier is named as "whose story this is", without the repeated "one of your soldiers";
  - the finale still shows the change after the want;
  - card 1's told past is unchanged.

---
- **Data:** `runs/seed1/{NV,LV,NW,NWL}_g{1,2}`.
- **Reads:** workflow wf_20171192-c73, rebuilt from its journal. The means match the workflow's own summary exactly.
- **Analysis scripts:** session scratchpad `remedy/` (stats, quote location, class counts, payload census, lead check).
- **Renders:** `runs/seed1/_nw_rendered/`.
