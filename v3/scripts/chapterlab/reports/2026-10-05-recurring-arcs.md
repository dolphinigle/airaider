# Recurring personal arcs: the living dossier and chain B; RF(a) alone; the cost owner (2026-10-05)

**Goal (North Star 0, designer 2026-10-05):** a soldier whose personal saga resolved gets another. The docs require a bounded **living dossier** distilled as chains resolve, so that *"their next chain reads a richer them"* (STORY_ENGINE §4), and an arc that *"runs A → B → C, each richer"* (§111, DESIGN §76). Each later chain must be **a NEW matter that grows out of who they became, never a retelling of the old wrong.**

**What this round did:**
1. Built the dossier, the chain-B offer and seeding, and both UIs. Also built the lab arm **CB**: chain B for each pers1 slot, seeded from that slot's PP chain A (CB_g*N* reads PP_g*N*).
2. Generated CB × 3 generations × 24 pers1 slots, all 72 on the final code (Sonnet writer).
3. Generated **RFA** (TC + RF part (a) only) × 3 generations on the 8 draw-3 slots.
4. Readers:
   - S10, one shuffled batch of CB, PP (chain A) and PG0 (the old personal default), 2 readers per saga, each saga read alone.
   - One retelling reader per CB saga, with chain A beside it.
   - One S10 batch of RFA, TC and G0.
   - A blind count of retry contradictions in RFA and TC.

## 0. Verdict

| | what | numbers | verdict |
|---|---|---|---|
| **Chain B** (CB) | dossier + next chapter: a dealt kit situation is the new matter, and the dossier's Now rides beside it | S10 vs chain A **−0.64 [−0.87, −0.41]**; vs PG0 **+0.15 [−0.11, +0.41]**. New matter: yes 24 / partly 36 / no 12 of 72. Grows out of the change: yes 9 / partly 38 / no 25. Followable: yes 20 / partly 52 / **no 0** | **Enable in the game now. Not yet good enough:** it reads at the old personal default's level, not chain A's, and half of it re-stages the settled change (§1.6) |
| **RFA** | a failed job's report is dealt that the job's people, things and place still stand | hard retry contradictions TC 4 → **2** (one saga); all contradictions 8 → 4. S10 vs TC **−0.12 [−0.54, +0.31]** | **Not shipped.** It fails the pre-registered "hard ≈ 0". The one remaining class: the place is taken, not destroyed. Widen the same fact and do one cheap rerun (§2) |
| **Cost owner** | a partial's cost is one engine phrase naming its owner | wrong owner in real chain-B partials: **0 of 66**, against PP's 1 of 66 | **Keep.** It is built on both game pipes (§3) |

Tests: typecheck clean, 727/727 pass (golden parity, game default and livingdossier included; re-run for this report). Nothing is committed.

## 1. The recurring arc

### 1.1 What was built

- **The living dossier** (`src/engine/dossier.ts`, no AI call). The engine composes it from lines the player already read. Never more than 6 lines:
  - **Now:** their last change (`character.grown`), else their card line.
  - **Marks:** one per saga that marked them, newest first. Kinds: their own saga, the hired saga that brought them in, a job they decided, a job they were hurt in.
  - **Earlier:** older marks folded into one line of titles.
  - **People:** at most 2 people who matter (lore ties).

  It is refreshed when any saga closes (the finale or either lapse), for every soldier that saga touched, and stored on `character.living`.
- **Both UIs print the same lines.** The GUI soldier sheet shows them as "Story so far", the CLI `merc` command as `story so far:`. From the CLI campaign (seed 7, mock AI, played through the real text UI by a stdin driver):
  ```
  story so far:
    Now: Kjeld Winterborn stops running from the old wrong.
    - Trouble at Marlbarrow, Kjeld's own matter: Gargrell is talked round.
    - Trouble at Oaklea: The prisoner is freed from Dunwell — Kjeld decided it.
    - The Chief of Harrowstead: The bandit chief's runner is caught before reaching Yarmere, but at a price — Kjeld decided it.
    Earlier: Blood at Hawlea, Blood at Nethercot.
    People: Osane, a peddler — a shared matter; Gargrell, a mercenary captain — a rival.
  ```
  (The mock pastes its seed, so this shows the flow, not real prose.)
- **The cadence** (`personalChainDrip`). A soldier qualifies when:
  - every personal saga of theirs is over;
  - the last one ended done and left a growth entry;
  - 6 cycles have passed (`PERSONAL_CHAPTER_COOLDOWN`);
  - no personal lead of theirs is on the board.

  A soldier with no personal saga yet goes first. The existing 25% roll and the one-personal-lead-at-a-time rule stagger the rest. The lead reads *"<name>'s next chapter"*. In the campaign, Kjeld's chain A was offered at c9 and closed at c12, and his chain B was offered at c20 and closed at c24.
- **The seeding**, chosen after three measured inputs:

  | what chain B's plan was handed | result on real Sonnet chain Bs | kept in |
  |---|---|---|
  | the old wrong as `history` ("never retold") | **8 of 8 retold it**, 3 nearly word for word | `runs/_superseded/pers1/CB_history_g1` |
  | the dossier with its settled marks as the seed | **4 of 8 reopened** the settled matter (its goat, its crime, its lie) | `runs/_superseded/pers1/CB_marks_g1` |
  | **shipped:** a dealt kit situation as `seed`, plus `now` (the dossier's Now) | this report | `runs/pers1/CB_g1–g3` |

  - In the game, `now` also carries a People line for one tied face the saga can seat, who comes in with their memory, the way chain A seats a person. The lab keeps no lore, so CB tested the bare case: situation plus Now.
  - The old wrong is stored on the world only for a log-only retelling check.
  - Prompt changes sit inside `[[next]]` in plan, pick and card. Chain-A renders are byte-identical (41,145 hashed). The chain-B plan is at the 620-word budget.

### 1.2 Does chain B read as a new chapter that grows out of who they became?

One reader per saga, with chain A's first card and ending beside it:

| | yes | partly | no |
|---|---|---|---|
| a **new matter** (not a retelling of the settled wrong) | 24 (33%) | 36 (50%) | 12 (17%) |
| **grows out of** who the soldier became | 9 (13%) | 38 (53%) | 25 (35%) |
| **followable** on one read | 20 (28%) | 52 (72%) | 0 |

- **Both yes:** only 8 of 72 (g1 S4_3; g2 S6_2; g3 S1_3, S4_1, S4_3, S7_2, S8_1, S8_2).
- **By draw:** draw 2 is the worst (new matter "no" 8 of 24, grows out "no" 13 of 24).
- **By soldier:** Sesh (S4) and Yrsa (S8) read as new most often (5 of 9 each). Bran (S5) never clearly grows out (6 of 9 "no").
- **The reads match S10.** CB's S10 is 6.42 where the matter is new, 5.86 where it is half new and 5.79 where it is retold. It is 6.40 where it is followable and 5.89 where it is partly followable.

### 1.3 S10, one shuffled batch

72 sagas per arm, 2 readers each, 432 of 432 scores. Pairs are by slot and generation, so each CB saga sits beside its own chain A. Paired bootstrap, 100,000 resamples.

| arm | S10 | draw 1 | draw 2 | draw 3 |
|---|---|---|---|---|
| **PP** (chain A, shipped) | **6.67** | 6.60 | 6.85 | 6.56 |
| **CB** (chain B) | **6.03** | 6.08 | 5.94 | 6.08 |
| PG0 (the old personal default) | 5.89 | 5.79 | 6.17 | 5.70 |

| pair | Δ S10 [95% CI] | better / worse / tie | by gen |
|---|---|---|---|
| CB − PP | **−0.64 [−0.87, −0.41]** | 14 / 46 / 12 (sign p < 0.001) | −0.52 · −0.46 · −0.94 |
| CB − PG0 | +0.15 [−0.11, +0.41] | 36 / 23 / 13 (p = 0.12) | +0.18 · +0.38 · −0.10 |
| PP − PG0 (anchor) | +0.79 [+0.56, +1.02] | 52 / 10 / 10 | +0.70 · +0.83 · +0.83 |

- The anchor holds: round T measured PP − PG0 at +0.70.
- **Chain B is behind chain A for every soldier.** Ilwen and Sesh are furthest behind (−1.17), Bran least (−0.28).
- The per-saga link between a chain A's score and its chain B's is weak (r = 0.24). A good first chapter does not carry the second.
- **Caveat.** The S10 readers read chain B alone (never prev.md), so a callback to chain A reads as "no setup". Examples: *"'Yrsa did not joke' points back to nothing on the page"*, *"'not a stage name' points at nothing earlier"*. A player who remembers chain A would catch these. But the retelling reader had chain A beside them and still rated only 28% "followable: yes", so this does not explain the gap.

### 1.4 Why it falls short (classes, with quotes)

**The cause: chain B is handed the old flaw.** The Now is chain A's `change`, and every chain-A change is written as the old flaw undone: *"Hessa has stopped running"*, *"Sesh has put down the cup for good"*, *"Bran no longer hides behind the brand"*, *"Yrsa stops hiding her hurt behind jokes"*. It is the only personal item chain B's plan gets, so the plan builds the new chapter on the old flaw. This is the B1 law (*the plan builds on whatever it is handed*) for the third time in this build: `history` was retold 8/8, the marks were reopened 4/8, and the Now is re-staged in about half the sagas. It shows in four ways.

1. **The change copies the Now.** In 11 of 72 the change is the Now word for word. Across all 72, a mean 45% of the change's content words are in the Now, and 29 of 72 reach half or more. The overlap tracks the reader: 0.34 where the saga grows out of the change, 0.40 "partly", 0.56 "no". The prompt's *"now: who the soldier became; the change goes further"* (the verifier's fix) did not move it. Prompt text never adds variety (L12).
   - g1 S7_2, Now: *"Marta has stopped running from her desertion and stands openly beside her captain, owning what she did."* The change is identical.
2. **The past invents a second old wrong of the same shape.** 40 of 72 chain-B pasts reach back ("years ago", "once", "years before"), even though the prompt asks for a new event. The finale then ends on the same public confession.
   - g1 S1_1: *"Years ago Hessa, a travelling performer, took the funeral purse of a miller's family at Woldcroft and ran."*
   - g2 S3_1: *"Years before, at the hunting lodge in Marlgarth, she had let that same herbalist take the blame for the death of the abbey's stag, and she had said nothing."*
   - Reader, g1 S6_1: *"the same sin again: a second hidden false oath, plus a reused magpie. It ends on a near-copy of the last finale."*
3. **Card 1 resets the change.**
   - g2 S8_2: *"She joked, as always, but could not sleep that night."*
   - g2 S5_1: *"Bran's dead brother caused that crime, and Bran has kept it secret since summer."* Reader: *"wipes out the change he just made."*
4. **Settled questions are asked again, and chain-A facts are contradicted** (chain B never sees them).
   - g1 S8_2. Now: *"Yrsa now knows why her father let her go"*. The plan's question: *"Nobody knows why Yrsa's father let her go."*
   - g2 S4_1: *"The previous saga already brought the ferryman's daughter home, yet this one sends Sesh to bring her home again."*
   - g1 S3_1: Ilwen's teacher is a man in exile, against the woman whose exile chain A lifted.

**What the 8 that work share.** The dealt situation brings in a new person in need, and the change is *how the soldier acts*, not what the story is about:
- Sesh's sobriety becomes the guard's tool (§1.5).
- Yrsa, who learned to ask plainly, makes the dying baron ask plainly for his cure (g3 S8_2).
- Faelor's new honesty gets him named the thief (g2 S6_2: *"his honest admission gets him named the thief"*).

**The retelling lint is blind.** The log-only `retellShare` (word overlap with the old past) scored 0.04–0.30 on all 72, under its 0.4 threshold. The reader called 48 retold or half-retold. The retelling is by shape (the same flaw, the same beat, the same question), not by words. The change-vs-Now overlap above does track it.

### 1.5 One soldier, verbatim: Sesh Reedspear (pers1 S4_3, g1)

**Chain A's ending** (PP_g1/S4_3, finale report, body):
> Curinure spoke low and plain. He laid the tally board on her table and showed the slaver route. Then the ledger went beside it, open to the night crossings with no ford or bridge named. Gertrun read it and said nothing. The hound sniffed at the girl's door, and its collar bore the river-traders' seal. Curinure said the slavers had taken captives for one buyer only. Gertrun's ears fell. She said the girl alone knew a hidden ford in the old forest, taught her by her father. Gertrun had wanted it for night crossings without toll, so she had told the slavers to take the girl. Curinure said the ledger would go to the river folk unless she let the girl walk. Gertrun waved the guards aside. A guard's hand slipped and cut Sesh's arm. He bound it and lifted the girl to his back. He walked her down the river road to her father's ferry. At the landing he set his spear by the post and sat there until her father held her.
> 📖 The Ferryman's Daughter: it is settled. The company talked Gertrun, a wolfkin guild master, into releasing the ferryman's daughter, and Sesh brought her home to her father's ferry.

**The dossier before chain B** (CB_g1/S4_3/dossier.md). Only the Now line goes to the plan:
> Now: Sesh has put down the cup for good and keeps his oath awake, a guard who stays at his post until she is home.
> \- The Ferryman's Daughter, Sesh's own matter: The company talked Gertrun, a wolfkin guild master, into releasing the ferryman's daughter, and Sesh brought her home to her father's ferry.

Dealt: *hide someone* · cellar, tavern, wolf cub.

**Chain B, card 1** (CB_g1/S4_3, "The Sober Guard"):
> Sesh Reedspear, one of your soldiers, met a human mason on the Whinford road in the first frost of winter. The elf landlord was hunting her. She once hid him in a cellar after a tavern brawl, and he swore an oath that night. He wants to hide the mason until she is home. You chase down the elf horse dealer who is running from Birgill. Sesh hopes the dealer will name who paid for his barred cart. The dealer carries a hidden knife and rides a fast horse.

**Chain B's ending** (finale report, body):
> Curinure stepped out before the riders and asked Bredami one question. Why would a landlord hang a mason, when coin could have bought her? Bredami said nothing. Curinure named the hidden room built at midsummer and the raw meat bought every day since. He had read it in her own ledger, and he held it up. Then Sesh let the she-wolf's howling carry from the cart behind him. The horses shied, and two riders lost their seats. Bredami went pale. She said the mason had built a cage for a stolen wolf cub, and elf law hanged cub thieves. Curinure told her the horse dealer had sworn to the barred cart, and the howling would draw the forest's notice whether Engle lived or not. Silence would not save her. Bredami turned her horse and called her riders off. Sesh took a graze on the arm from a rider's blade as the gate was cleared. He walked Engle home through the lanes, cup left behind. At her door he sat down with his back to the wood and stayed awake until she was inside.

**How the readers rated it:**
- Retelling reader: new matter yes, grows out yes, followable partly: *"a fresh matter… that tests his new self as 'The Sober Guard'."*
- S10: 7 and 7, *"The best reveal of the batch."* Chain A scored 7 and 7.
- **Even here the change restates the Now:** *"…has put down the cup for good and keeps watch awake at the mason's door until she is home"*. The past also invents a new oath sworn after a brawl. It works because the matter (the mason, the walled-up cub) is new and the sobriety is a tool.

**The common case**, Yrsa (g1 S8_2), for contrast. Card 1 reads *"Yrsa believed her father cast her off as a child."* That is the exact question chain A answered, and the Now handed it back.

### 1.6 Verdict and what to fix

**Enable chain B in the game now: yes.**
- **The plumbing is sound.** The dossier, cadence, seeding and both UIs are what the ruling asked for: 727/727 tests, and a text-UI campaign that played chain A through to chain B's close.
- **Its prose is at the level the game shipped until fa86555.** S10 is +0.15 over PG0 (the CI spans 0). It is never unfollowable (0 of 72), and it is rare: at least 6 cycles after a settled chain A, then 25% a cycle, one personal lead at a time.

**But it does not yet meet the ruling's own bar.** Only 1 in 3 is a fully new matter, only 1 in 8 grows out of who the soldier became, and it sits 0.64 below chain A. The fix is the next round, not a reason to keep it off. Fix the class at the input, not the wording (North Star 8; the HP principle: a person's own material must come in as an item, never as a request):
1. **Deal chain B's personal item instead of handing it the old flaw.** Give the plan something new and dealt about the soldier. Then send the Now only to the card and report writers, so the soldier *acts* changed without the old flaw being the topic. Two arms:
   - **(a) A returning person.** Someone from chain A brings the new matter, with their memory of the soldier. This is STORY_ENGINE §111's *"a finished chain's loose thread + a cast member seeds the next chain"*. The game already seats a tied face when the lore has one; the lab needs chain A's cast to stand in for the lore.
   - **(b) A dealt trait.** One of the soldier's traits or quirks that the new matter tests.
2. **Chain B's card-1 field is the new event, not a `past`.** The key "past" pulls toward backstory (40 of 72 reached back), and card 1 tells it "plainly, nothing added".
3. **Log the change-vs-Now overlap** in place of `retellShare`, which is blind (log-only, per the single-shot ruling).

**The test:** each arm × 3 generations on pers1, with CB, PP and PG0 in one shuffled S10 batch, plus the retelling read.
- The bar: S10 above CB beyond its CI, new matter "yes" in at least half, and grows out "yes" well above 9 of 72.
- The game path with a seated returning person is untested in the lab, so arm (a) also measures what the game already does when a tied face exists.

## 2. RFA: RF part (a) alone

RFA is TC plus one change. A failed job's report is dealt `stands`: *"whoever and whatever the job names, and its place, for the company tries this job again"*. It carries no cost fix, so on disk it differs from TC_g1–g3 by `stands` alone. It played the 8 draw-3 slots × 3 generations, replaying A2's deals; all 24 completed.

| | failures | contradictions | hard (the retry needs what the failure removed) | S10 (one batch, 24 sagas × 2 readers) |
|---|---|---|---|---|
| TC | 27 | 8 | 4 (2 sagas) | 6.21 |
| **RFA** | 27 | **4** | **2** (1 saga) | **6.08** |
| G0 | — | — | — | 5.90 |

- **S10:** RFA − TC **−0.12 [−0.54, +0.31]**, 10 better / 13 worse / 1 tie (by gen −0.50 · −0.25 · +0.38). RFA − G0 +0.19 [−0.08, +0.46]; TC − G0 +0.31 [−0.06, +0.69].
- **What (a) fixed.** TC's hard ones were a captive back free with no word of how (g1 F2_3), a hanged man rescued from the noose (g1 F7_3), and a barn burned twice and then whole (g2 F3_3). RFA has none of these. Its g1 and g2 have 0 contradictions.
- **What remains: possession, not existence.** All of RFA's 4 contradictions are in g3 F3_3. The failure report obeys `stands` (the barn and the horse still exist), but the raiders took the barn: *"The raiders drove through the gap. The company had to fall back from the barn."* The retry card then says *"Now you hold the barn at Thorncroft farm again,"* and its report has the company already inside. The fact covers what exists, not who holds it.
- **The S10 dip was (b).** Round H's RF, with (b), measured −0.33 [−0.69, +0.04] on this slice. Without (b) it is −0.12.
- **No stamp.** Round H's warning was "stayed hidden" / "was still…" (7 against 1). In RFA's failure reports, "still" appears 8 times and "stayed" 10, against TC's 11 and 9.
- **The counter is noisy on soft cases.** The same TC texts counted 6 contradictions / 4 hard in round H and 8 / 4 here.

**Verdict: not shipped**, by the rule set before the run: *hard ≈ 0 and S10 not below TC beyond its CI*.
- S10 passes. Hard contradictions halve (4 → 2) but are not about 0.
- **Next:** widen the same fact to the whole class, "what the retry needs is still standing **and still within the company's reach**" (destroyed, taken, captured and overrun alike). Rerun the same 8 slots × 3 generations (about $1 per generation), with the retry count and one S10 batch. If hard reaches 0 with S10 flat, ship it on both pipes (`voice` + stands, `past` + stands).
- If you count 2 hard in 1 saga of 24 as "about 0", (a) ships as built. That is your call. I don't count it as 0, because TC's own count is only 4.

## 3. The cost owner (round H §5)

- **The bug.** The engine sent a partial's cost as `{what, how, whose}` atoms, and the writer could hand the company's loss to someone else. Round H's case, in TC: *"Benjamund's horse went down at the barrier and was lamed."*
- **The fix.** The engine now sends one phrase naming the owner, built from the lab's `ownCost`: *"the company's own horse, lamed"*, *"Bran Redhand's shield, lost"*. It is on both game pipes (`voice`, `past`) and tested. The mock dump of 700 sagas differs from HEAD only in this payload, on 18 report calls per pipe.
- **Evidence on real text** (a scan of each partial's cost noun in its report):
  - CB (which carries the fix): 66 partial costs, **0** given to the wrong owner. It also tells the cost in the company's voice where it should: *"lost its own horse in the escape"*, *"the company's own supplies, spoiled"*.
  - PP (old atoms, the same personal fixtures): 1 of 66 wrong: *"A guard's horse bolted at the noise and lamed its leg in a ditch"* (PP_g2 S3_3).
- **Verdict: keep.** It is a defect fix at the input (one author per fact: the engine names the owner), not a story arm. It changes only the cost payload.
- The voice pipe's version has no real-text sample yet, because RFA deliberately ran without it.

## 4. Measurement and integrity notes

- **The chain-B batch.** 432 of 432 scores. The two readers agreed exactly 55% of the time and within one point 97%.
  - One PP read (g1 S5_1, score 7) came back with the `why` "Placeholder". Without it, CB − PP is −0.63.
  - One PG0 read scored 5.5.
- **The RFA batch.** 144 of 144 scores; readers agreed exactly 68% of the time, within one point 97%. The workflow summary gave only arm means, so the per-saga scores were rebuilt from the workflow journal by replaying the script's shuffle. The same replay reproduces the chain-B batch exactly (432 of 432), so the mapping is right.
- **Retelling reads.** One reader per saga, one per generation's batches. The g1 reader was harsher: new matter "yes" in 2 of 24, against 12 and 10 for g2 and g3. Read the totals, not the generations.
- **Code version.** All 72 CB plans carry `now` and no marks, generated after the last code edit (14:42). The older variants are in `runs/_superseded/pers1/`.
- **The lab is thinner than the game.** The lab dossier has no People line (no lore) and no deed marks (lab chronicle lines record no `decides`). CB tested the Now line alone.
- **Cost.** CB about $3.0–3.2 per generation; RFA about $0.92–0.95.

## 5. For the designer

1. **Enable chain B now** (§1.6). The dossier shows on the soldier sheet and in the CLI.
2. **Ruling-level choices the build made.** Please confirm or overrule:
   - chain B's new matter is a dealt kit situation;
   - the old wrong is never sent to a writer (it is kept only for logging);
   - the cooldown is 6 cycles after a settled chain A;
   - a soldier with no personal saga yet goes ahead of a next chapter.
3. **Next round:** deal chain B's personal item (a returning person or a dealt trait), with the Now going to the writers only. The test is in §1.6.
4. **RFA:** widen `stands` to "within reach" and rerun, or take (a) as is (§2).
5. **Still open, unchanged:**
   - The report prompt still calls the soldier *"whose past this story is"* on chain B.
   - The dossier's Now can lag until the soldier's next saga closes.
   - The drip's 25% roll now fires in more states, which shifts the main rng in campaigns that have a settled personal saga (determinism tests pass).
   - North Star 0's "Missing:" line goes stale once this is committed.

**Files:**
- Code: `src/engine/dossier.ts` (new), `src/engine/saga.ts`, `cards.ts`, `chains.ts`, `src/ai/storyteller.ts`, `prompts/saga/{plan,card,pick}.txt`, `src/game/{sagaflow,game}.ts`, `server/main.ts`, `web/Sheets.tsx`, `cli/format.ts`, `scripts/sagalab/seedlab.ts`.
- Tests: `test/livingdossier.test.ts` (new), `gamedefault`, `seedarms`, `sagaprompts`.
- Runs: `runs/pers1/CB_g1–g3`, `runs/seed1/RFA_g1–g3`.
