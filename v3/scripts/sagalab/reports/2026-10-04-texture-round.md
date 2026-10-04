# Texture round (round T) and personal sagas: 2026-10-04/05

**Goal (North Star 0):** readability plus story quality. Followability is the floor: an arm that loses J3 *follow* by more than 15 held slots over 72 does not ship. Story quality (J3 *keep*, S10) is the target.
**Design:** each arm is the game default plus one change (`PIPE_PARTS` in `src/engine/saga.ts`). Seed1 arms are judged against G0 (the default) generation for generation. The personal arm PP is judged against PG0 (the default on the personal set pers1). Readers: blind J3 pairs read in both orders, plus the S10 absolute 1–10 story score (`judge/s10_story.md`, anchored so a typical saga today is a 6). Every saga got two S10 readers, shuffled across arms. The writer is Sonnet. Nothing is committed, and the game default is unchanged apart from the step-0 byname fix.

## 0. Verdict

| arm | change | follow floor | story quality | verdict |
|---|---|---|---|---|
| **PP** | personal: the plan writes `past` (2 plain sentences) and `change`; card 1 tells the past, the finale shows the change, and the change goes into the dossier | passes: held **+11** (32–21), ahead in all 3 generations | keep held **44–14** (p ≈ 0.0001), ahead in all 3; S10 **+0.70** [+0.47, +0.93] | **SHIP** (personal sagas) |
| **TC** | voice: the asker's first-person line on card 1, a quoted clue line on won jobs, the secret spoken in the finale | passes: held **+12** (34–22), ahead in all 3 generations | keep held +13 (36–23); S10 **+0.40** [+0.20, +0.60], the only seed1 arm whose CI excludes 0 | **SHIP** (non-personal sagas, see §5) |
| TA | room: caps only (card 110, finale card 140, report after up to 210) | passes: held +4 (21–17) | keep held 33–9 (p ≈ 0.0003), but S10 +0.13 [−0.13, +0.39] | no: keep win with no story-score gain |
| TB | weight: per-part caps and in-person meetings | passes: held +3 (31–28) | keep held 38–18 (p ≈ 0.01), but S10 +0.01 [−0.18, +0.19] | no: same as TA |
| TD | lore: one local custom or legend, told on card 1 and paid off in the finale | **fails**: −6 held over 24 slots (on pace for −18 over 72), stopped after g1 | keep held 14–7; S10 +0.21 [−0.06, +0.48] | no |
| TP | page first: question → jobs with `people`/`turns_up` → answer → clues | **fails**: −7 held over 24 slots (on pace for −21), stopped after g1 | keep flat (10–9); S10 **−0.42** [−0.77, −0.04] | no |

**Anchor check:** G0 averaged **6.03** (by generation 5.94 / 6.10 / 6.04; per-saga sd 0.73; no G0 saga reached 8) and PG0 averaged 6.26. The rubric's "today ≈ 6" held. The anchor is written into the rubric, so this shows the reader followed it; it is not an independent calibration. The signal is the difference between arms, which were shuffled. The two readers of a saga gave the same score 62% of the time and were within one point 97% of the time.

**Data integrity (read before reusing the orchestrator's pooled numbers):** `runs/seed1/TA_g1` holds only F6_3; the other 23 g1 slots were never generated. The workflow still logged those slots. Its J3 reads marked "NOT JUDGED" were counted as wins for whichever side existed: 39 of TA's 41 g1 records, which inflated TA follow flips to 27. Its S10 rows were counted as **0**, which pulled the reported TA mean down to 4.31. Every TA number below is recomputed from g2 + g3 plus g1 F6_3 (49 slots). TD and TP stopped early by design after g1, so their g2 and g3 were never generated.

## 1. J3 whole-saga pairs (each arm's generation g against the default's generation g)

| arm | slots | follow reads | follow held arm–base (flips) | sign p | follow by gen | keep reads | keep held (flips) | sign p | keep by gen |
|---|---|---|---|---|---|---|---|---|---|
| TA | 49 | 53–45 | 21–17 (11) | 0.63 | g1 0/2 · g2 25/48 · g3 28/48 | 73–25 | **33–9** (7) | 0.0003 | 2/2 · 43/48 · 28/48 |
| TB | 72 | 75–69 | 31–28 (13) | 0.79 | 27 · 23 · 25 /48 | 92–52 | **38–18** (16) | 0.011 | 34 · 33 · 25 |
| TC | 72 | 84–60 | 34–22 (16) | 0.14 | 26 · 31 · 27 | 85–59 | 36–23 (13) | 0.12 | 35 · 27 · 23 |
| TD | 24 | 18–30 | 6–12 (6) | 0.24 | 18/48 | 31–17 | 14–7 (3) | 0.19 | 31/48 |
| TP | 24 | 17–31 | 8–15 (1) | 0.21 | 17/48 | 25–23 | 10–9 (5) | 1.0 | 25/48 |
| **PP** vs PG0 | 72 | 83–61 | 32–21 (19) | 0.17 | 25 · 32 · 26 | 102–42 | **44–14** (14) | 0.0001 | 31 · 35 · 36 |

No arm wins follow beyond the ±15 floor. TC (+12) and PP (+11) lead it in every generation. TD and TP fall behind it by more than the floor allows.

**TC by slot type.** On seed1 the F2 slots are personal; their client is one of your own soldiers. TC's 9 F2 sagas: follow held 5–2, keep held **7–0**, S10 **+1.00** [+0.44, +1.56]. TC's 63 non-personal sagas: follow held 29–20, keep held 29–23, S10 +0.31 [+0.10, +0.52]. TC's follow gain and its S10 gain both survive on ordinary sagas. Most of its keep margin comes from the soldier's own voice on personal sagas, which points the same way as PP.

## 2. S10 absolute story score (mean of 2 readers per saga; paired bootstrap over sagas, 20 000 resamples)

| arm | sagas | arm mean [95% CI] | default, same slots | difference [95% CI] | sagas better / worse / tie |
|---|---|---|---|---|---|
| TA | 49 | 6.20 [5.96, 6.44] | 6.07 | +0.13 [−0.13, +0.39] | 21 / 16 / 12 |
| TB | 72 | 6.03 [5.84, 6.22] | 6.03 | +0.01 [−0.18, +0.19] | 26 / 25 / 21 |
| **TC** | 72 | 6.43 [6.23, 6.61] | 6.03 | **+0.40 [+0.20, +0.60]** | 42 / 18 / 12 |
| TD | 24 | 6.15 [5.81, 6.46] | 5.94 | +0.21 [−0.06, +0.48] | 11 / 5 / 8 |
| TP | 24 | 5.52 [5.21, 5.83] | 5.94 | **−0.42 [−0.77, −0.04]** | 5 / 15 / 4 |
| **PP** | 72 | 6.97 [6.81, 7.13] | PG0 6.26 | **+0.70 [+0.47, +0.93]** | 51 / 11 / 10 |

Score spread: G0 had 4×4, 31×5, 66×6, 43×7 and 0×8. TC had 10×8; PP had 34×8 against PG0's 7×8 and no score below 5.
**Measurement law (new):** TA and TB won J3 *keep* beyond the floor while S10 stayed flat. TC and PP are the only arms both instruments moved. More room and more scenes can win "rather keep playing" without making a better story by the anchored score. Trust a change only where both move.

## 3. Text telemetry (computed from texts.json and plan.json; cards are prose only, reports are before + after)

| arm | card words (card 1 / finale) | report words (finale) | card-length CV in a saga | report CV | texts with a quoted line | quotes per saga | card 1 quoted | finale report quoted | per card: carry · needs you · stand in your way · You must |
|---|---|---|---|---|---|---|---|---|---|
| G0 | 61 (66 / 59) | 140 (176) | 0.08 | 0.21 | 2% | 0.17 | 0% | 4% | 0.66 · 0.23 · 0.14 · 0.18 |
| TA | 72 (78 / 72) | 208 (269) | 0.11 | 0.23 | 4% | 0.37 | 0% | 6% | 0.78 · 0.23 · 0.22 · 0.20 |
| TB | 59 (66 / 49) | 149 (207) | 0.14 | 0.26 | 3% | 0.24 | 0% | 1% | 0.62 · 0.22 · 0.07 · 0.13 |
| TC | 66 (85 / 59) | 145 (186) | 0.18 | 0.22 | **32%** | **2.69** | **100%** | **76%** | 0.69 · 0.21 · 0.16 · 0.16 |
| TD | 66 (87 / 59) | 146 (195) | 0.20 | 0.25 | 2% | 0.17 | 0% | 0% | 0.61 · 0.22 · 0.12 · 0.22 |
| TP | 61 (66 / 59) | 139 (177) | 0.08 | 0.21 | 1% | 0.08 | 0% | 0% | 0.67 · 0.24 · 0.15 · 0.24 |
| PG0 | 62 (67 / 61) | 147 (184) | 0.08 | 0.18 | 4% | 0.42 | 0% | 11% | 0.53 · 0.00 · 0.12 · 0.18 |
| PP | 67 (83 / 61) | 153 (207) | 0.15 | 0.24 | 8% | 1.08 | 0% | **44%** | 0.67 · 0.00 · 0.13 · 0.20 |

- **Lore:** TD wrote a custom in 24 of 24 plans, for example *"Folk say no felling charter holds unless a nightingale sings over the island oaks while it is read."* Its card 1 grew to 87 words.
- **Dossier:** PP wrote a `grown` line in 72 of 72 sagas, for example *"After The Goat at the Standing Stones: Gruk Ironjaw stands his ground where he once ran, and walks the goat home to his clan's standing stones."*
- **Pacing:** TA's room went mostly to reports, which grew 49% while cards grew only 19%. TB was the pacing arm, yet its card-length CV (0.14) is below TC's and TD's (0.18–0.20), which come only from a longer card 1. No arm reaches Sultan-style short-or-long variation in the middle cards.
- **Stamps:** "carry/carries" (0.6–0.8 per card) and "needs you" (0.23 per seed1 card) are equal in every arm. They come from the shared pipeline, from the `{who, carry, will}` trouble and the card-1 gloss "the one who needs you" (verifier, §6), not from any arm. Round F's "trouble as one line" already removes the carry stamp.

## 4. What the readers credit and blame (classes, quoted from the reads)

**TC (voice).**
*Credited:* a goal in the asker's own words makes the want concrete. *"Merete's goal, her name among the furriers, is stated in her own words."* *"Y's card 1 says outright that Laudus must prove the mirror he sold was true."* Confessions in a person's own voice make earlier clues read differently: *"Secile's finale line ('you swore the rod to me. You forgot') recasts the earlier clues"*; *"'The potter gives me bread. I give him wax.' Marz-Ja looking at his boots turns his help into a betrayal."*; *"The merchant speaks in her own voice: 'The camp stands on the old ring where my river people buried their dead.'"* Personal stakes stick: *"Pirtar's line about sharing a bench with the cooper for years gives real stakes."*
*Blamed:* a quoted clue from the wrong mouth: *"Secile, the enemy, keeps calmly handing over intel and describes herself in the third person"*, and *"a man who can't read 'misheard' a written dove message"*. The finale secret turning into a speech: *"the answer comes as a villain's confession dump"*, *"the finale confession is a stiff speech that explains everything"*.

**PP (personal past and change).**
*Credited:* the soldier's own wrong is stated, then acted on in the finale. *"Gruk said he had run, and the boy had stood."* *"Bran stood in the square and said his own name aloud, and no one turned from him."* *"Sesh pushed the wine cup away. He sat up through the night with his eyes open."* *"Then he wrote the false oath against his own name and signed it."* Card 1 is clearer: *"Y's card 1 says plainly that her draught nearly killed the elder and that she stayed silent."*
*Blamed:* the finale contradicting the stated past (*"card 1 says the brother did the killing, yet Bran ends with 'My brother did not do this.'"*); props the plan invents for the past clashing or doubling (*"a duplicate necklace"*, and the build's gown contradiction); the past's goal drifting (*"the goal is to make the brother own the killing, but the finale target is 'the smuggler'"*).

**TA (room).** *Credited* (keep): bigger scenes and twists, *"a cart chase ended by a thrown pot, a captive collector carried along"*, *"the music-box tune drifting across the lake at dusk"*. *Blamed:* the extra room fills with recitation and late arrivals: *"the finale recites the clues one 'she said' at a time"*; *"Kosmas the tinker shows up in the finale with no setup"*; *"Eussorus is named the thief with no evidence"*.

**TB (weight).** *Credited* (keep): planted in-person meetings, *"The lean hunter trailing the cart and begging to buy back the antler is a great hook."* *Blamed:* the short retry cards and failure reports read as copies, *"Two near-identical failed inn cards are dead weight"*, *"the two failure reports repeat the same barred door almost word for word"*; and people's looks drift once they have looks, *"Secile is 'tall, bald' early and 'the short sailor' later"*.

**TD (lore).** *Credited:* a custom that pays off. *"The gnawed-oar custom set up on card 1 pays off as Secile draining the pond to bury her dead."* *"'The ring had not swallowed the boy. It had only kept him.'"* *Blamed (the follow losses):* the legend is a second puzzle on card 1, competing with the want. *"Y's 'the storm never gives back' saying muddies its goal."* *"Y opens with a folk saying and 'send word to those who keep the dam'."* *"the chests of paper and the nightingale lore never quite connect"*. Customs are set up and dropped (*"the duel-at-the-ford custom is set up and dropped"*, *"the ferry-hook custom never pays off"*), and the verifier found the lore settled twice.

**TP (page first).** *Blamed:* when the answer may name only people the jobs meet, a helper becomes the culprit with no turn. *"Marz-Ja ... is won over and helps catch the hunter"*; *"the moneylender who helped the company is suddenly the villain"*; *"The client Selagus turns out to have poisoned the hares ... no setup"*. Cards name the culprit before any discovery (*"card_3 names Eussorus as the leak before any discovery"*), and it adds contradictions (*"Nicholina leads the mare out, but the finale still has her racing"*). *Credited* (keep only): twists that turn on the client (*"the tally mark is Pirtar's, so his rushed order caused the sour wine"*). This is the B1 principle again: the plan builds on whatever it is handed as chosen, and an answer drawn only from people already met is drawn from the helpers. Its own page check flagged 7 of 24 plans, the same rate as arms that never author the page (TC 21/72, TB 19/72). The check counts people set up only by the want (the build's open question), so it cannot tell the arms apart.

## 5. Personal sagas: does PP make them tell and resolve the past?

**Yes, on both counts.** The default already prints a one-line past, but as a label. PP tells the past as a scene and ends on the soldier doing the opposite of it.

| slot | PG0 card 1 (past) | PP card 1 (past) |
|---|---|---|
| S2_1 g3 | "Once he fled the pass and left the young one to die." | "At the autumn drive, raiders hit his clan's herd. Gruk fled the high pass and left his young cousin to hold it alone. The cousin died, and the herd scattered." |
| S5_3 g2 | "He was branded and driven out for his brother's killing." | "At the harvest fair, his brother struck down the reeve's son in a quarrel, and Bran swore the blow was his own. They branded his hand and drove him out." |
| S1_2 g1 | "She stole their dowry silver and shamed them." | "On her wedding night in Harrowholt, she fled with the dowry silver and left them shamed. She still keeps one coin from the chest." |

| slot | PG0 finale, last lines | PP finale, last lines |
|---|---|---|
| S2_1 g3 | "Gruk dug into the earth with his hands and lifted out his cousin's bones. He wrapped them in his cloak and carried them home to the clan's standing stones." (the errand closes) | "Gruk said he had run, and the boy had stood. … Pateem told him the cousin was here and had not run this time. … He led the goat out himself and held its rope as his own." (the wrong is answered) |
| S5_3 g2 | "The reeve read the paper aloud before the moot and struck Bran's brand from the roll." | "Bran stood in the square and said, \"I am Bran Redhand,\" and no one looked away." |
| S1_2 g1 | "He drew the bond from the chest and put it in Hessa's hand. She tore it across." | "Then she went out to the family waiting in the street, and she looked each of them in the face and gave them the halves." |

The designer asked: *"is the 'soldier grows after critical points' implemented?"* In the PP build it is. The change is written to `character.grown`, shown on the GUI soldier sheet and in CLI `merc`, and the soldier's next personal saga is seeded with backstory plus that line. In this round it is lab-only until shipped.
**Watch item (one fixture):** when the past is stated plainly, it becomes a mystery to overturn. In 6 of 9 PP S4 sagas (Sesh slept drunk on watch), the finale reveals that he was drugged; PG0 did this in 2 of 9. Readers liked it (most of these scored 8), but it absolves the soldier rather than resolving the past. At scale it could become the stock twist for drunk-or-asleep backstories. Watch it in the next personal run; do not patch the instance.

## 6. Shared-pipeline defects (verifier; present in every arm, G0 included, and tested by none)

These are the "clean" layer, now a lab-only option with no seedlab id. **Ruling needed:** test it as its own arm against the new default. The top classes: `carry` filled with things that are not gear in hand (→ "They carry spears and heavy locks"); the card-1 glosses ("needs you", "nobody knows") written out as stock sentences; `people` used as "may be named" while glossed as "is present", so people the soldiers never met get named; a name and its label not merged ("Benjamund's trackers … the merchant's hired trackers"); cards ending on invented advice; `latest`/`retry` sent in the third person; the finale cost dropped in with no cause; the finale `after` carrying 7 required items in 175–240 words (a checklist climax); a `hope` field with no slot in the output; TB's budgets upside down (failure *after* shorter than *before*); the company's own soldier written into `people`/`win` on personal plans; the seed and the keyword atoms clashing with field names; the asker's label dropped after card 1. If clean ships, one known gap: with lore on top, the "shown before play" line no longer covers lore.

## 7. Recommendation

1. **Ship PP on personal sagas.** Follow +11 held, ahead in every generation; keep 44–14 held (p ≈ 0.0001); S10 +0.70 [+0.47, +0.93]; 51 of 72 sagas scored better. It answers North Star 0: the past is told, it is resolved by the soldier, and the change persists in the dossier.
2. **Ship TC on non-personal sagas.** Over all 72 sagas: follow +12 held (ahead in all 3 generations), keep +13, S10 +0.40 [+0.20, +0.60]. On the 63 non-personal sagas alone: follow 29–20 held, S10 +0.31 [+0.10, +0.52]. Splitting by saga type gives every saga exactly one measured change: PP as measured on pers1, TC as measured on seed1. **Not supported yet:** TC's quoted line *together with* PP's past on the same card 1. Both are card-1 additions (+15 and +20 words), and round F showed that two card-1 additions overload the ~70-word card (line + lead).
3. **Do not ship TA, TB, TD or TP.** TA and TB buy keep without story score. TD's legend costs follow. TP's page-first plan costs follow and S10, and makes helpers into culprits.
4. **Next round (3 generations each, same deals):**
   - **(a) Combination test, personal.** PP + voice (the soldier's own quoted line on card 1 and the secret spoken in the finale) against PP, on pers1. Card 1 is the risk to watch.
   - **(b) Stack test, seed1.** Round F's "trouble as one line" (recommended there, not yet shipped) + TC against TC. Both touch card 1.
   - **(c) Clean (the verifier's 19 fixes) as its own arm** against the new default, if the designer rules it in.
   Keep reading both J3 and S10; §2's law says a keep-only win is not enough.

Ledger lines added to `docs/STORYTELLER.md` item 9.

---

## Appendix A: best saga of the best seed1 arm, in full: **TC g3 F2_3** (S10 8 and 8; J3: TC won follow and keep in both orders)

*Readers:* "Jervaise speaks in her own voice. The grey scarf she knitted and the brother's 'neat hand' set up the moneylender's voiced confession, and the scarf closes the story." · "Y [TC] builds real pull: the tally-man names where the brother is kept, the scarf she knitted turns up in the chest, the pages are in his neat hand, and he walks out with ink on his fingers. X's [G0's] courier chase has no stakes."
(F2 is the seed1 personal slot. TC's three top-scored sagas, 8/8, are all on F2. Its best non-personal saga is g2 F8_2, at 7.5.)

```
═══ Runner at the Harvest Fair · The Debt at Dunshaw ═══
Road ahead:
  ▶ Runner at the Harvest Fair
  · Slip into the moneylender's grain-store at Stonecot and take her bond-roll unseen. Jervaise Greyfell hopes the roll will show what her brother is said to owe.
  · Finale
Jervaise Greyfell wants to free her younger brother from the moneylender's bond. She left him bound to that debt. She says, "I took the road out of the valley and told myself he would forgive me, and I have never forgiven myself." You must chase down the moneylender's tally-man through the Fernwell harvest fair. Jervaise hopes he will tell her where her brother is kept. The moneylender's hired fair guards stand in your way, with cudgels and a blocking cart.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Debt at Dunshaw · part 1 of 3 · setbacks 0 of 2


━━ SUCCESS ━━ Runner at the Harvest Fair
The fair crowd pressed thick around the stalls. Ahead, the tally-man slipped between the pie sellers. Hired guards raised their cudgels, and a loaded cart rolled across the lane. Niraselya laughed and shouted for room.
⚄ [SUCCESS] · rolled 8 heads of 8 coins vs bar 5.2 (partial from 3.1)
Jervaise did not wait for the guards to move. She seized a trestle of pumpkins and sent it rolling under the cart's wheels, and the cart stuck fast. The tally-man ran for the gap. She leapt after him and caught his collar. He fell among the gourds, gasping. Niraselya talked the guards into confusion until they stepped back. Jervaise hauled the tally-man up and held him. He wheezed that her brother was kept in the counting-house at Dunshaw, never sent to the fields. Jervaise let out a slow breath and tightened her grip on his coat.
📖 The Debt at Dunshaw: the story moves on. The company chased down the moneylender's tally-man through the Fernwell fair, got past the guards, and took him captive so Jervaise could question him.


═══ The Strongbox at Stonecot · The Debt at Dunshaw ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's bond.
Road ahead:
  ✓ Runner at the Harvest Fair
  ▶ The Strongbox at Stonecot
  · Finale
Known:
  The brother is kept inside the moneylender's counting-house at Dunshaw, never sent to the fields.
Held: the tally-man, captive
Open question: why the moneylender has kept the brother bound all these years instead of selling his bond on
You caught the tally-man, and Jervaise can now question him. Next, you slip into the moneylender's grain-store at Stonecot and take her bond-roll unseen. Jervaise Greyfell hopes the roll will show what her brother is said to owe. The moneylender's night watchmen walk the store with lanterns and a guard hound. If they spot you, they will raise the alarm and seize you as thieves.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Debt at Dunshaw · part 2 of 3 · setbacks 0 of 2


━━ FAILURE ━━ The Strongbox at Stonecot
Jervaise and Godgiva crept along the store wall at Stonecot. Lantern light swung across the grain sacks. A hound's claws clicked on stone. Jervaise hissed orders, and Godgiva watched the watchmen's rounds in silence.
⚄ [FAILURE] · rolled 2 heads of 8 coins vs bar 5 (partial from 3)
The hound lifted its head and whined at the sacks where they hid. A watchman stopped and raised his lantern. Jervaise bit back a curse. Godgiva stepped on a loose board, and it cracked. The watchman shouted. Boots pounded in from the yard. The two women ran for the broken shutter with the roll still out of reach. Behind them, the hound's bark rang across the dark.
📖 The Debt at Dunshaw: a setback — 1 of 2. The company was spotted by the moneylender's hound and watchmen, and fled Stonecot before Jervaise could reach the bond-roll.


═══ The Strongbox at Stonecot · The Debt at Dunshaw ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's bond.
Road ahead:
  ✓ Runner at the Harvest Fair
  ▶ The Strongbox at Stonecot (again)
  · Finale
Known:
  The brother is kept inside the moneylender's counting-house at Dunshaw, never sent to the fields.
Held: the tally-man, captive
Open question: why the moneylender has kept the brother bound all these years instead of selling his bond on
Last time, the moneylender's hound and watchmen spotted you, and you fled Stonecot before Jervaise could reach the bond-roll. Now you slip into her grain-store and take the roll unseen. Jervaise Greyfell hopes it will show what her brother is said to owe. The night watchmen carry lanterns and keep a guard hound.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Debt at Dunshaw · part 2 of 3 · a setback — 1 of 2 before it slips away


━━ PARTIAL ━━ The Strongbox at Stonecot
Jervaise and Roruld crouched behind a cart at the edge of the grain-store yard. Lantern light swung along the wall. The guard hound paced the gate, nose low, and the night watchmen walked slowly between the sacks and the door.
⚄ [PARTIAL] · rolled 4 heads of 8 coins vs bar 4.6 (partial from 2.8)
Jervaise waited until the lanterns turned the far corner. She threw a handful of grain across the yard. The hound ran after it, and she slipped through the door. Roruld held the gate. She found the chest under the sacks and lifted out the bond-roll. A grey scarf lay beneath it. She knew her own stitches and took it too. The hound barked as they ran. The company got clear unseen, but the horse bolted and was lost in the dark. Later, by the fire, Jervaise unrolled the pages. The first were the moneylender's. The later ones were in her brother's neat hand. She held the scarf and said nothing. The roll did not yet say what he owed.
📖 The Debt at Dunshaw: it now comes to a head. The company stole the moneylender's bond-roll from the Stonecot grain-store unseen and brought away a scarf too, but lost a horse in the escape.


═══ The Counting-House · The Debt at Dunshaw ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's bond.
Road ahead:
  ✓ Runner at the Harvest Fair
  ✓ The Strongbox at Stonecot
  ▶ Finale: The Counting-House
Known:
  The brother is kept inside the moneylender's counting-house at Dunshaw, never sent to the fields.
  The later pages of the roll are written in the brother's neat hand, not the moneylender's.
Held: the tally-man, captive; the bond-roll and scarf
Open question: why the moneylender has kept the brother bound all these years instead of selling his bond on
The bond-roll has left the store unseen. The grey scarf that Jervaise knitted for her brother was in the same chest, and it went with the roll. Now you must free her brother from the moneylender's counting-house at Dunshaw. The moneylender and her house guards hold it. The guards carry clubs, and a locked bond-chest sits within. She will keep the brother at any cost.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Debt at Dunshaw · the finale · setbacks 1 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Talk it out with the human moneylender → their matter settled · CHA
  [g1] Fight it out with the human moneylender → their matter settled · STR
  [g2] Slip past the human moneylender's guards and settle it unseen → their matter settled · DEX


━━ PARTIAL ━━ The Counting-House ♛
The counting-house at Dunshaw stood shut behind a heavy door. Two guards with clubs stood before it. Auizia, the human moneylender, waited inside among her chests. Jervaise held the grey scarf tight. Calpydir stayed close behind her.
⚄ [PARTIAL] · rolled 3 heads of 8 coins vs bar 4.9 (partial from 2.9)
Niraselya stepped past the guards and smiled at Auizia as if they were old friends. She talked of ledgers, of trust, and of what a woman fears to lose. Jervaise laid the bond-roll and the scarf on the counter. The tally-man, bound at the door, had already named the brother's room. Niraselya pointed to the neat hand on the later pages. Auizia went quiet. Then she said, "His work paid the bond off long ago. I hid it. I cannot read figures, and he is the only one I trust with my ledgers. If he goes, my trade falls apart." She called off the guards. Jervaise pushed forward in anger, and a club-haft caught her arm before it was lowered. Her brother came out of the back room with ink on his fingers. Jervaise wrapped the grey scarf around his neck, and they walked out of Dunshaw side by side.
🩸 Jervaise Greyfell is wounded (light).
📖 The Debt at Dunshaw: it is settled. The company talked the moneylender Auizia round at Dunshaw, and Jervaise's brother was freed from his bond and left the town beside her.


═══ The Debt at Dunshaw ═══ (done)
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's bond.
Road ahead:
  ✓ Runner at the Harvest Fair
  ✓ The Strongbox at Stonecot
  ✓ Finale: The Counting-House
Known:
  The brother is kept inside the moneylender's counting-house at Dunshaw, never sent to the fields.
  The later pages of the roll are written in the brother's neat hand, not the moneylender's.
Held: the tally-man, captive; the bond-roll and scarf
Jervaise Greyfell wants to free her younger brother from the moneylender's bond. She left him bound to that debt. She says, "I took the road out of the valley and told myself he would forgive me, and I have never forgiven myself." You must chase down the moneylender's tally-man through the Fernwell harvest fair. Jervaise hopes he will tell her where her brother is kept. The moneylender's hired fair guards stand in your way, with cudgels and a blocking cart.
ending: Auizia is talked round. · setbacks 1 of 2
So far:
  1 ✓ Jervaise Greyfell, Niraselya Leafshade — The company chased down the moneylender's tally-man through the Fernwell fair, got past the guards, and took him captive so Jervaise could question him.
  2 ✗ Jervaise Greyfell, Godgiva Greyfell — The company tried to slip into the moneylender's grain-store at Stonecot and take her bond-roll unseen. The company was spotted by the moneylender's hound and watchmen, and fled Stonecot before Jervaise could reach the bond-roll.
  2 ~ Jervaise Greyfell, Roruld — The company stole the moneylender's bond-roll from the Stonecot grain-store unseen and brought away a scarf too, but lost a horse in the escape.
  finale ~ Jervaise Greyfell, Niraselya Leafshade, Calpydir Rootward — The company talked the moneylender Auizia round at Dunshaw, and Jervaise's brother was freed from his bond and left the town beside her. · Jervaise Greyfell hurt (light)
The answer: The brother's work paid off the bond long ago, but the moneylender hid it. She cannot read figures, and he is the only one she trusts to keep her ledgers. She fears that if he goes, her whole trade will fall apart.
People:
  Jervaise Greyfell — human soldier
  Auizia — human moneylender


```

### The default on the same slot and generation: **G0 g3 F2_3** (S10 6 and 7)

*Readers:* "Easy to follow: ledger overpayments, then the courier's letters, explain why the brother is held. But the courier job comes out of nowhere ('her scarfed courier'), the finale's leverage logic is muddled, and it reads as a job log." · "Clean and adds up: a failed chase, then the retry where Jervaise sacrifices the horse lands."

```
═══ The Counting-House · The Late Return ═══
Road ahead:
  ▶ The Counting-House
  · The Scarfed Courier
  · Finale
Jervaise Greyfell is one of your soldiers. She wants her younger brother freed from the moneylender's hold. Long ago she left him bound there. Nobody knows why the moneylender never lets him go. You must steal the debt ledger from the counting-house in Dunshaw. It may show what he truly owes. Hired door guards stand watch, armed with cudgels and a bell.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Late Return · part 1 of 3 · setbacks 0 of 2


━━ SUCCESS ━━ The Counting-House
Two guards with cudgels sat by the counting-house door, a bell hung beside them. Niraselya Leafshade smiled at them and started talking. Jervaise Greyfell watched the shutters along the side wall and the dark alley behind.
⚄ [SUCCESS] · rolled 8 heads of 8 coins vs bar 5.2 (partial from 3.1)
Niraselya kept the guards laughing at her tales while the bell hung still. Jervaise slipped through a back shutter and found the strongroom. She picked the lock with steady hands and took the ledger from its shelf. No one saw her go. In the alley she opened it by lantern light and found her brother's page. It listed many payments, far more than a bond of that size needed. The last ones were written over. She could not read what he still owed. Jervaise closed the book and held it tight.
📖 The Late Return: the story moves on. The company stole the moneylender's debt ledger from the Dunshaw counting-house unseen, though it does not yet show what her brother truly owes.


═══ The Scarfed Courier · The Late Return ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's hold.
Road ahead:
  ✓ The Counting-House
  ▶ The Scarfed Courier
  · Finale
Known:
  Her brother's page lists many payments, far more than a bond of that size needs, and the last ones are written over.
Held: the moneylender's debt ledger
Open question: why the moneylender has never let her brother go
You took the ledger from the moneylender's strongroom, and no one saw you. Now you chase her scarfed courier down the road from the Fernwell harvest fair. The courier's mounted guards carry spears and ride fast horses. They will ride you down and guard the satchel.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Late Return · part 2 of 3 · setbacks 0 of 2


━━ FAILURE ━━ The Scarfed Courier
Jervaise and Godgiva ran the dusty road past the last fair stalls. Ahead, the scarfed courier rode hard. Behind her came the mounted guards, spears level, closing the gap between them and the two women on foot.
⚄ [FAILURE] · rolled 2 heads of 8 coins vs bar 5 (partial from 3)
The horses caught them at the bend. Jervaise shouted and swung a heavy pan, but a spear shaft struck her arm and she fell. Godgiva dragged her into the ditch as the riders wheeled round. The courier did not slow. Her scarf was a red streak far down the road, and the guards sat waiting.
📖 The Late Return: a setback — 1 of 2. Mounted guards rode the company down on the open road, and the scarfed courier escaped with the satchel while Jervaise lay in a ditch.


═══ The Scarfed Courier · The Late Return ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's hold.
Road ahead:
  ✓ The Counting-House
  ▶ The Scarfed Courier (again)
  · Finale
Known:
  Her brother's page lists many payments, far more than a bond of that size needs, and the last ones are written over.
Held: the moneylender's debt ledger
Open question: why the moneylender has never let her brother go
Last time, mounted guards rode you down on the open road. The courier slipped away with the satchel while Jervaise lay in a ditch. This time, you chase the moneylender's scarfed courier down the road from the Fernwell harvest fair. The courier's guards ride fast horses and carry spears.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: a few days' pay
SAGA: The Late Return · part 2 of 3 · a setback — 1 of 2 before it slips away


━━ PARTIAL ━━ The Scarfed Courier
The fair fell behind them. Dust hung over the road where the scarfed courier rode ahead. Her guards turned in their saddles, spears levelled, and their fast horses closed the gap between them.
⚄ [PARTIAL] · rolled 4 heads of 8 coins vs bar 4.6 (partial from 2.8)
Jervaise did not slow. She cut the company's horse across the guards' path and drove it hard at the ditch. The horse screamed and fell, and the lead guard's mount shied from it. Roruld hauled the guard from the saddle. Jervaise ran down the courier on foot, caught her scarf and pulled her to the dirt. She tore the satchel from her shoulder. The horse lay broken in the road and did not rise. Jervaise broke a seal and read the page by the roadside. It named the debtors' bonds as pledge to a greater lender in Stonecot. She folded it, tied the satchel to her belt and said, "Stonecot holds her bonds."
📖 The Late Return: it now comes to a head. The company chased down the moneylender's courier and took her satchel of sealed letters, but lost a horse in the chase.


═══ The Stonecot Reckoning · The Late Return ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's hold.
Road ahead:
  ✓ The Counting-House
  ✓ The Scarfed Courier
  ▶ Finale: The Stonecot Reckoning
Known:
  Her brother's page lists many payments, far more than a bond of that size needs, and the last ones are written over.
  The moneylender hands her debtors' bonds to a greater lender in Stonecot as pledge for her own loans.
Held: the moneylender's debt ledger, the moneylender's sealed letters
Open question: why the moneylender has never let her brother go
You caught the courier and took her satchel of sealed letters. Now you go to Stonecot. There you must face the moneylender and take back her brother's bond. She keeps her bond-chest close and has hired guards at her side. She will refuse you. Then she will call the guards. Be ready before you speak.
ON THIS MATTER: Jervaise Greyfell — human soldier
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Late Return · the finale · setbacks 1 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Talk it out with the human moneylender → their matter settled · CHA
  [g1] Fight it out with the human moneylender → their matter settled · STR
  [g2] Slip past the human moneylender's guards and settle it unseen → their matter settled · DEX


━━ PARTIAL ━━ The Stonecot Reckoning ♛
Stonecot's streets were quiet. Auizia, the human moneylender, sat behind her bond-chest in a narrow room. Two hired guards stood at her shoulders. Jervaise Greyfell wiped her hands on her apron and stepped in first. Niraselya and Calpydir followed.
⚄ [PARTIAL] · rolled 3 heads of 8 coins vs bar 4.9 (partial from 2.9)
Jervaise demanded the bond, and Auizia refused. She called her guards. Calpydir stepped forward but did not strike. Niraselya smiled and set the debt ledger on the table. She opened it to the brother's page and let Auizia read the payments. Then she laid the sealed letters beside it. Auizia went pale. Niraselya said the debt had been paid off years ago, and that his bond was the pledge for all her other loans. Free him, and the greater lender would find her ledger bare. Keep him, and the letters would reach that lender anyway. Auizia waved the guards back. A guard grabbed Jervaise's arm in the last scuffle and wrenched it. Auizia tore the bond in two. The brother walked out with Jervaise, rubbing his wrists in the daylight.
🩸 Jervaise Greyfell is wounded (light).
📖 The Late Return: it is settled. The company talked the moneylender Auizia round with the ledger and her own letters, and she tore up the bond, freeing Jervaise's brother.


═══ The Late Return ═══ (done)
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the moneylender's hold.
Road ahead:
  ✓ The Counting-House
  ✓ The Scarfed Courier
  ✓ Finale: The Stonecot Reckoning
Known:
  Her brother's page lists many payments, far more than a bond of that size needs, and the last ones are written over.
  The moneylender hands her debtors' bonds to a greater lender in Stonecot as pledge for her own loans.
Held: the moneylender's debt ledger, the moneylender's sealed letters
Jervaise Greyfell is one of your soldiers. She wants her younger brother freed from the moneylender's hold. Long ago she left him bound there. Nobody knows why the moneylender never lets him go. You must steal the debt ledger from the counting-house in Dunshaw. It may show what he truly owes. Hired door guards stand watch, armed with cudgels and a bell.
ending: Auizia is talked round. · setbacks 1 of 2
So far:
  1 ✓ Jervaise Greyfell, Niraselya Leafshade — The company stole the moneylender's debt ledger from the Dunshaw counting-house unseen, though it does not yet show what her brother truly owes.
  2 ✗ Jervaise Greyfell, Godgiva Greyfell — The company tried to chase the moneylender's scarfed courier down the road from the Fernwell harvest fair, but mounted guards rode the company down on the open road, and the scarfed courier escaped with the satchel while Jervaise lay in a ditch.
  2 ~ Jervaise Greyfell, Roruld — The company chased down the moneylender's courier and took her satchel of sealed letters, but lost a horse in the chase.
  finale ~ Jervaise Greyfell, Niraselya Leafshade, Calpydir Rootward — The company talked the moneylender Auizia round with the ledger and her own letters, and she tore up the bond, freeing Jervaise's brother. · Jervaise Greyfell hurt (light)
The answer: His debt was paid off years ago by his own labor, but the moneylender hides it. His bond is the pledge that props up all her other loans, and freeing him would bring her whole ledger down.
People:
  Jervaise Greyfell — human soldier
  Auizia — human moneylender


```

## Appendix B: one personal saga before and after: **S2_1, generation 3**

### After: **PP g3 S2_1** (S10 8 and 8; J3 keep PP in both orders, follow split)

*Readers:* "The arrows from the ridge, the cairn with its bell and the boar's tusks all pay off in the talk with the poacher. Gruk's guilt runs the story: 'Gruk said he had run, and the boy had stood.'" · "One goal from start to finish: get the goat back from this poacher. In X [PG0] the bell goat is found in step one and then forgotten."
Dossier written after the saga: *"After The Goat at the Standing Stones: Gruk Ironjaw stands his ground where he once ran, and walks the goat home to his clan's standing stones."*

```
═══ The Poacher's Hide · The Goat at the Standing Stones ═══
Road ahead:
  ▶ The Poacher's Hide
  · Fight the raiders selling stolen goats at the ford of Rushbourne. Gruk Ironjaw hopes the raiders will tell what became of the herd and his cousin's goat.
  · Track and trap the great boar raiding the poacher's snares at Whinbarrow. Gruk Ironjaw hopes that ridding the poacher of the boar will win him a fair hearing.
  · Finale
Gruk Ironjaw, one of your soldiers, wants his dead cousin's bell goat back from the elf poacher. At the autumn drive, raiders hit his clan's herd. Gruk fled the high pass and left his young cousin to hold it alone. The cousin died, and the herd scattered. Nobody knows why the poacher guards one common goat like gold. You must find the hidden camp in the oaks of Oakmoss. Gruk hopes it shows where the goat is kept. The poacher's hounds wait there with teeth and a loud bay.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat at the Standing Stones · part 1 of 4 · setbacks 0 of 2


━━ SUCCESS ━━ The Poacher's Hide
Under the oaks of Oakmoss, the two soldiers followed a faint trail through moss and root. Far ahead, hounds began to bay. Gruk gripped his knife. Pateem tasted the air and slowed her steps.
⚄ [SUCCESS] · rolled 4 heads of 8 coins vs bar 3.7 (partial from 2.2)
Pateem stepped out first, hands open, and spoke low to the hounds. She talked on and on in a soft voice. Gruk tossed them the dried meat from his pack. The bay faded to whining, and the hounds ate. The soldiers crept on and found the camp hidden in the oaks. Behind it stood a small pen of clean straw. The bell goat stood inside, fat and combed. A full trough of grain sat before it, while the poacher's own bowl by the fire held only scraps. Gruk looked at the goat a long time. Pateem drew the camp and its paths in the dirt, then copied them onto hide.
📖 The Goat at the Standing Stones: the story moves on. The company found the poacher's hidden camp in Oakmoss, quieted his hounds, and came away with a sketch of the camp and its paths.


═══ Raiders at the Ford · The Goat at the Standing Stones ═══
For: Gruk Ironjaw, one of your soldiers, who wants to win back his dead cousin's bell goat from the poacher.
Road ahead:
  ✓ The Poacher's Hide
  ▶ Raiders at the Ford
  · Track and trap the great boar raiding the poacher's snares at Whinbarrow. Gruk Ironjaw hopes that ridding the poacher of the boar will win him a fair hearing.
  · Finale
Known:
  The goat is penned and fed better than the poacher himself, and it is never sold or eaten.
Held: a sketch of the camp and its paths
Open question: why the poacher guards one common goat as if it were gold
You found the hidden camp, and the hounds are fed and quiet. Now you go to the ford of Rushbourne to fight the raiders who sell stolen goats there. Gruk Ironjaw hopes they will tell what became of the herd and his cousin's goat. The raider band holds spears and a stolen herd. They will defend their ford and their trade.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat at the Standing Stones · part 2 of 4 · setbacks 0 of 2


━━ PARTIAL ━━ Raiders at the Ford
Gruk Ironjaw and Qoramir came down to the ford of Rushbourne at dusk. Goats bleated in a rope pen on the far bank. Raiders stood in the shallows with spears and watched the road. Qoramir whispered that they had been seen. Gruk looked at the water and the spears.
⚄ [PARTIAL] · rolled 2 heads of 5 coins vs bar 2.5 (partial from 1.5)
Gruk Ironjaw broke the line. He waded in low, caught a spear shaft, and wrenched it away. He threw the nearest raider into the water. Qoramir took a cut on the arm, but he kept the flank. The raiders ran for the reeds. Gruk caught one by the collar and held him. The captive spat and said arrows from the ridge had made them quit the pass, though too late to save the boy. He would say nothing of the herd or the goat. Gruk cut the pen rope and let the goats scatter on the bank.
🩸 Qoramir is wounded (light).
📖 The Goat at the Standing Stones: the story moves on. The company fought the raiders at the ford of Rushbourne, drove them off and took one captive, but he would not tell what became of the herd.


═══ The Beast Among the Stones · The Goat at the Standing Stones ═══
For: Gruk Ironjaw, one of your soldiers, who wants to win back his dead cousin's bell goat from the poacher.
Road ahead:
  ✓ The Poacher's Hide
  ✓ Raiders at the Ford
  ▶ The Beast Among the Stones
  · Finale
Known:
  The goat is penned and fed better than the poacher himself, and it is never sold or eaten.
  The raiders say arrows from the ridge made them quit the pass, though too late to save the boy.
Held: a sketch of the camp and its paths, a raider captive
Open question: why the poacher guards one common goat as if it were gold
You drove off the raiders and took one prisoner. The ford is yours now. Next, you go to Whinbarrow to track and trap the great boar that raids the elf poacher's snares. Gruk Ironjaw hopes that ridding the poacher of the boar will win him a fair hearing. The boar has tusks and a foul temper. It will gore anyone who comes near its den.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat at the Standing Stones · part 3 of 4 · setbacks 0 of 2


━━ SUCCESS ━━ The Beast Among the Stones
Whinbarrow was cold and wet. Gruk Ironjaw and Pateem Salt-born found torn snares and deep hoof marks in the mud. The tracks led into thick brush. Somewhere ahead, a boar waited near its den, and neither of them could see it.
⚄ [SUCCESS] · rolled 3 heads of 4 coins vs bar 2.5 (partial from 1.5)
Gruk read the churned mud and saw where the boar passed each dawn. He dug a pit in the narrow path and hid it with bracken. Pateem called from the far side and drew the boar out. It charged straight at Gruk, then crashed into the pit. Gruk finished it with a spear. The snare lines were safe again. Gruk cut the tusks free as a gift for the poacher. Past the standing stones, he saw a fresh cairn with a goat bell hung on it. Someone had tended it that morning. The bell rang once in the wind.
📖 The Goat at the Standing Stones: it now comes to a head. The company tracked and trapped the great boar at Whinbarrow, killed it, and made the poacher's snare lines safe again.


═══ Words at the Standing Stones · The Goat at the Standing Stones ═══
For: Gruk Ironjaw, one of your soldiers, who wants to win back his dead cousin's bell goat from the poacher.
Road ahead:
  ✓ The Poacher's Hide
  ✓ Raiders at the Ford
  ✓ The Beast Among the Stones
  ▶ Finale: Words at the Standing Stones
Known:
  The goat is penned and fed better than the poacher himself, and it is never sold or eaten.
  The raiders say arrows from the ridge made them quit the pass, though too late to save the boy.
  A fresh cairn stands by the standing stones, tended daily, with a goat bell hung on it.
Held: a sketch of the camp and its paths, a raider captive, the boar's tusks as a gift
Open question: why the poacher guards one common goat as if it were gold
You trapped and killed the boar, and the snare lines are safe again. Now you must take the cousin's goat back from the poacher at the standing stones of Whinbarrow. He is an elf, and he carries a longbow and a guilty heart. He will refuse you. He will shoot to keep the goat.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Goat at the Standing Stones · the finale · setbacks 0 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Talk it out with the elf poacher → their matter settled · CHA
  [g1] Fight it out with the elf poacher → their matter settled · STR
  [g2] Slip past the elf poacher's guards and settle it unseen → their matter settled · DEX


━━ SUCCESS ━━ Words at the Standing Stones ♛
The standing stones of Whinbarrow rose grey out of the heather. Smoke curled from a small camp between them. A cairn stood nearby with a bell on it. An elf sat watching with a longbow across his knees. Gruk's hands wanted to turn back.
⚄ [SUCCESS] · rolled 6 heads of 8 coins vs bar 4.2 (partial from 2.5)
Pateem stepped out first, with her hands open. Gruk followed and laid the boar's tusks on the grass. Talso Brightwater drew his bow and said nothing. Pateem spoke of the cairn and the bell. She said a man did not tend a grave so well for a stranger. Talso's arm shook. Gruk told him what the raider captive had said. The raiders had quit the pass because of arrows from the ridge. Gruk said he had run, and the boy had stood. Talso lowered the bow. He said he had watched from the ridge and had come too late. The boy had begged him to keep the goat from the raiders. He had kept it out of guilt, and he would not give it to the cousin who ran. Pateem told him the cousin was here and had not run this time. Talso looked long at Gruk, then nodded. Gruk used the sketch to find the pen. He led the goat out himself and held its rope as his own.
📖 The Goat at the Standing Stones: it is settled. The company talked the poacher Talso Brightwater round at Whinbarrow and brought the cousin's goat back, which Gruk Ironjaw now holds as his own.


═══ The Goat at the Standing Stones ═══ (done)
For: Gruk Ironjaw, one of your soldiers, who wants to win back his dead cousin's bell goat from the poacher.
Road ahead:
  ✓ The Poacher's Hide
  ✓ Raiders at the Ford
  ✓ The Beast Among the Stones
  ✓ Finale: Words at the Standing Stones
Known:
  The goat is penned and fed better than the poacher himself, and it is never sold or eaten.
  The raiders say arrows from the ridge made them quit the pass, though too late to save the boy.
  A fresh cairn stands by the standing stones, tended daily, with a goat bell hung on it.
Held: a sketch of the camp and its paths, a raider captive, the boar's tusks as a gift
Gruk Ironjaw, one of your soldiers, wants his dead cousin's bell goat back from the elf poacher. At the autumn drive, raiders hit his clan's herd. Gruk fled the high pass and left his young cousin to hold it alone. The cousin died, and the herd scattered. Nobody knows why the poacher guards one common goat like gold. You must find the hidden camp in the oaks of Oakmoss. Gruk hopes it shows where the goat is kept. The poacher's hounds wait there with teeth and a loud bay.
ending: Talso Brightwater is talked round. · setbacks 0 of 2
So far:
  1 ✓ Gruk Ironjaw, Pateem Salt-born — The company found the poacher's hidden camp in Oakmoss, quieted his hounds, and came away with a sketch of the camp and its paths.
  2 ~ Gruk Ironjaw, Qoramir — The company fought the raiders at the ford of Rushbourne, drove them off and took one captive, but he would not tell what became of the herd. · Qoramir hurt (light)
  3 ✓ Gruk Ironjaw, Pateem Salt-born — The company tracked and trapped the great boar at Whinbarrow, killed it, and made the poacher's snare lines safe again.
  finale ✓ Gruk Ironjaw, Pateem Salt-born, Qoramir — The company talked the poacher Talso Brightwater round at Whinbarrow and brought the cousin's goat back, which Gruk Ironjaw now holds as his own.
The answer: The poacher watched the boy's last stand from the ridge and was too slow to help. He buried the boy, and the dying boy had begged him to keep the goat from the raiders, so he keeps it out of guilt and will not hand it to the cousin who ran.
People:
  Gruk Ironjaw — wolfkin soldier
  Talso Brightwater — elf poacher


```

### Before: **PG0 g3 S2_1** (the game as it ships; S10 6 and 7)

*Readers:* "Easy to follow, and the bell goat leading Gruk to the grave pays off the title. But it is muddled whether the Whinbarrow stones are the clan's own stones, and Gruk's own guilt over the pass never comes back." · the order PG0 won follow: "Y [PG0] is a simple chain where each step answers the last … X's [PP's] boar hunt for a 'fair hearing' is a side trip."

```
═══ The Cold Camp · The Goat That Knew the Way Home ═══
Road ahead:
  ▶ The Cold Camp
  · Catch the raider runner who fled toward Rushbourne. Gruk Ironjaw hopes the runner will say where that word came from.
  · Sneak into the poacher's hut at Whinbarrow and take what he hides. Gruk Ironjaw hopes something in the hut shows what became of his cousin.
  · Finale
Gruk Ironjaw, one of your soldiers, wants to bring his cousin's bones home to the clan's standing stones. Once he fled the pass and left the young one to die. Nobody knows why the raiders struck the high pass that night. You go to find their old camp near Oakmoss. Gruk hopes it shows who sent them. Raider stragglers there carry spears and bad tempers.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat That Knew the Way Home · part 1 of 4 · setbacks 0 of 2


━━ SUCCESS ━━ The Cold Camp
Smoke-blackened trees closed in around Oakmoss. Gruk and Pateem found cold fire pits and trampled ground, then spearmen watching from the ridge, shifting their feet and muttering.
⚄ [SUCCESS] · rolled 4 heads of 8 coins vs bar 3.7 (partial from 2.2)
Pateem walked out alone with her hands open and spoke in a slow, even voice. She talked of the dead and of tired men far from any lord. The stragglers listened, then lowered their spears and slipped away into the trees. Gruk searched the camp unhindered. In a torn tent he found a scrap of cloth with a message scratched on it. It said the pass would be thinly watched. Tied to a stake behind the tent stood a bell goat, marked with his clan's colors. Gruk knelt and cut the rope. The goat's bell rang once, and he held it still.
📖 The Goat That Knew the Way Home: the story moves on. The company found the raiders' old camp near Oakmoss, and Pateem's talk scattered the stragglers, so the camp could be searched and the clan's bell goat reclaimed.


═══ The Runner at the Ford · The Goat That Knew the Way Home ═══
For: Gruk Ironjaw, one of your soldiers, who wants to bring his dead cousin's bones home to the clan's standing stones.
Road ahead:
  ✓ The Cold Camp
  ▶ The Runner at the Ford
  · Sneak into the poacher's hut at Whinbarrow and take what he hides. Gruk Ironjaw hopes something in the hut shows what became of his cousin.
  · Finale
Known:
  The raiders struck on word that the pass would be thinly watched.
Held: his clan's bell goat
Open question: why the raiders struck the high pass on the very night they did
You found the raiders' camp and scattered the stragglers. Gruk Ironjaw can search it freely. Now you must catch the raider runner who fled toward Rushbourne. Gruk hopes the runner will say where that word came from. The raider rearguard holds slings and a hay cart. They will block the road to cover the runner.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat That Knew the Way Home · part 2 of 4 · setbacks 0 of 2


━━ PARTIAL ━━ The Runner at the Ford
The road to Rushbourne ran straight and muddy. Ahead, the raider rearguard had dragged a hay cart across it. Slingers crouched behind the cart. Stones began to whistle past. Gruk Ironjaw and Qoramir kept low in the ditch and watched the runner's dust thin away.
⚄ [PARTIAL] · rolled 2 heads of 5 coins vs bar 2.5 (partial from 1.5)
Gruk crept along the ditch, then ran. He heaved the hay cart onto its side and it crashed down over the slingers' feet. A stone clipped Qoramir's arm as he followed, and he gasped but kept going. Gruk caught the runner by the collar and pinned him in the mud. The rearguard scattered, cursing, and sat down sulking in the mire. The runner spat, then muttered that an elf of the Western Forests, one who knew the pass, had sent the word. Qoramir bound his own arm and said nothing. Gruk only tied the runner's hands.
🩸 Qoramir is wounded (light).
📖 The Goat That Knew the Way Home: the story moves on. The company broke the raiders' road block and caught the runner who fled toward Rushbourne, though the runner gave only a part of what Gruk hoped to learn.


═══ A Quiet Look at the Hut · The Goat That Knew the Way Home ═══
For: Gruk Ironjaw, one of your soldiers, who wants to bring his dead cousin's bones home to the clan's standing stones.
Road ahead:
  ✓ The Cold Camp
  ✓ The Runner at the Ford
  ▶ A Quiet Look at the Hut
  · Finale
Known:
  The raiders struck on word that the pass would be thinly watched.
  The word came from an elf of the Western Forests who knew the pass.
Held: his clan's bell goat, the captive raider runner
Open question: why the raiders struck the high pass on the very night they did
You caught the runner, and the rearguard now sulks in the mud. Next, you slip into the elf poacher's hut at Whinbarrow and take what he hides. Gruk Ironjaw hopes something inside shows what became of his cousin. The poacher's snare-hounds guard the place. They have sharp teeth and sharper noses. They will raise the alarm at any scent, so you must stay downwind.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: a few days' pay
SAGA: The Goat That Knew the Way Home · part 3 of 4 · setbacks 0 of 2


━━ SUCCESS ━━ A Quiet Look at the Hut
Gruk and Pateem crept through wet bracken toward the poacher's hut at Whinbarrow. The wind shifted twice. Beyond the low fence, the snare-hounds paced and lifted their noses. Gruk watched the door. Pateem watched the grass for the way the wind bent it.
⚄ [SUCCESS] · rolled 3 heads of 4 coins vs bar 2.5 (partial from 1.5)
Pateem settled the matter. She led Gruk in a wide curve until the wind blew from the hounds toward them, not from them. Then she spoke low and slow to the nearest hound, and it lay down. Gruk went in at the back, found the cousin's horn under the poacher's cot, and slipped out. The hounds never barked. They kept watch over an empty hut. Outside, Pateem pointed to the standing stones. Fresh earth lay heaped beside them. Gruk held the horn and looked at the mound a long while.
📖 The Goat That Knew the Way Home: it now comes to a head. The company crept past the poacher's hounds at Whinbarrow and took the cousin's horn from his hut unseen, a clean success.


═══ Under the Standing Stones · The Goat That Knew the Way Home ═══
For: Gruk Ironjaw, one of your soldiers, who wants to bring his dead cousin's bones home to the clan's standing stones.
Road ahead:
  ✓ The Cold Camp
  ✓ The Runner at the Ford
  ✓ A Quiet Look at the Hut
  ▶ Finale: Under the Standing Stones
Known:
  The raiders struck on word that the pass would be thinly watched.
  The word came from an elf of the Western Forests who knew the pass.
  Fresh earth lies heaped by the standing stones at Whinbarrow.
Held: his clan's bell goat, the captive raider runner, the cousin's horn
Open question: why the raiders struck the high pass on the very night they did
Gruk Ironjaw slipped out unseen with the cousin's horn. The hounds now guard an empty hut. Your task is to bring the cousin's bones out of the earth at Whinbarrow. An elf poacher stands in your way. He carries a longbow and hidden snares. He is a man with a secret, and he will fight to keep it.
ON THIS MATTER: Gruk Ironjaw — wolfkin soldier
REWARD: the rest of the saga's pay, and what the ending brings
SAGA: The Goat That Knew the Way Home · the finale · setbacks 0 of 2
PLANS (pick one) — chosen: g0
▶ [g0] Talk it out with the elf poacher → their matter settled · CHA
  [g1] Fight it out with the elf poacher → their matter settled · STR
  [g2] Slip past the elf poacher's guards and settle it unseen → their matter settled · DEX


━━ SUCCESS ━━ Under the Standing Stones ♛
The standing stones at Whinbarrow rose grey out of the mist. Fresh earth lay heaped beside them. The bell goat pulled at its rope and led Gruk straight toward it. Then an arrow struck the turf at his feet. An elf stepped from the heather with a longbow drawn. Snare cords lay hidden in the grass around him.
⚄ [SUCCESS] · rolled 6 heads of 8 coins vs bar 4.2 (partial from 2.5)
Pateem Salt-born raised her open hands and walked forward slowly. She spoke of the raiders and the thin watch in the pass. Talso Brightwater said nothing. Qoramir held up the captive runner, who swore the elf had paid the raiders with word of the herd. Gruk drew out his cousin's horn. Talso's bow sank. He said he had wanted the watchers drawn off his snare-lines. He had never meant a death. Guilt had made him bury the cousin under the stones and keep silent. Pateem told him the truth would cost him less than the silence had. Talso threw down his bow. Gruk dug into the earth with his hands and lifted out his cousin's bones. He wrapped them in his cloak and carried them home to the clan's standing stones.
📖 The Goat That Knew the Way Home: it is settled. The company talked the elf poacher round at Whinbarrow, and Gruk carried his cousin's bones home to rest at the clan's standing stones.


═══ The Goat That Knew the Way Home ═══ (done)
For: Gruk Ironjaw, one of your soldiers, who wants to bring his dead cousin's bones home to the clan's standing stones.
Road ahead:
  ✓ The Cold Camp
  ✓ The Runner at the Ford
  ✓ A Quiet Look at the Hut
  ✓ Finale: Under the Standing Stones
Known:
  The raiders struck on word that the pass would be thinly watched.
  The word came from an elf of the Western Forests who knew the pass.
  Fresh earth lies heaped by the standing stones at Whinbarrow.
Held: his clan's bell goat, the captive raider runner, the cousin's horn
Gruk Ironjaw, one of your soldiers, wants to bring his cousin's bones home to the clan's standing stones. Once he fled the pass and left the young one to die. Nobody knows why the raiders struck the high pass that night. You go to find their old camp near Oakmoss. Gruk hopes it shows who sent them. Raider stragglers there carry spears and bad tempers.
ending: Talso Brightwater is talked round. · setbacks 0 of 2
So far:
  1 ✓ Gruk Ironjaw, Pateem Salt-born — The company found the raiders' old camp near Oakmoss, and Pateem's talk scattered the stragglers, so the camp could be searched and the clan's bell goat reclaimed.
  2 ~ Gruk Ironjaw, Qoramir — The company broke the raiders' road block and caught the runner who fled toward Rushbourne, though the runner gave only a part of what Gruk hoped to learn. · Qoramir hurt (light)
  3 ✓ Gruk Ironjaw, Pateem Salt-born — The company crept past the poacher's hounds at Whinbarrow and took the cousin's horn from his hut unseen, a clean success.
  finale ✓ Gruk Ironjaw, Pateem Salt-born, Qoramir — The company talked the elf poacher round at Whinbarrow, and Gruk carried his cousin's bones home to rest at the clan's standing stones.
The answer: The elf poacher paid the raiders with word of the herd, so the clan's watchers would be drawn off his snare-lines in the pass. He never meant a death, and out of guilt he buried the cousin under the standing stones at Whinbarrow and kept it secret.
People:
  Gruk Ironjaw — wolfkin soldier
  Talso Brightwater — elf poacher


```
