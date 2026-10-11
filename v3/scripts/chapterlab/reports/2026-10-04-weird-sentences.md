# Round F (seed1): the weird-sentence round. Four arms on the game default, 3 generations each, read blind. Sonnet writer, 2026-10-04

**Why this round.** The designer's card-1 complaint (North Star 0): *"the logic is so jumbled … weird sentences … like he carries a vow to shield pilgrims"*. A blind reader marked the reader-throwing sentences in 72 default sagas and sorted them by source (`scratchpad/f_classes.txt`). Each arm below removes one source, through what the writer is given (North Star 8). None of them rewords a prompt.

| arm | the one change on top of G0 (the game default: kit+pick + C2 grafts) | target class (share of G0's marked sentences) |
|---|---|---|
| **F1** line | The plan writes each job's trouble as **one sentence: who stands against the job, what they will do, and why**. It replaces the `{who, carry, will}` object. "armed people or a beast" becomes a per-type `against` (talk: the one to win over, for a reason of their own). Every card, card 1 included, gets the whole line. | 1 + 2, the trouble object (32%) |
| **F2** plain | A dealt quality no longer stays glued to its thing ("half-eaten oar" → "oar"). There is no prompt change. | part of 8, invented compounds |
| **F3** link | The plan writes a `lead` before each job: the fact the player already has that points to this job's person or place. The job's card gets lead + hope as its why. | 4 + 5, the why (17%) |
| **FX** | line + plain + link | all of the above |

**Run.**
- `runs/seed1/{F1,F2,F3,FX}_g{1,2,3}/<slot>/`: 24 slots × 3 generations × 4 arms = 288 sagas. All completed with no problems.
- Each arm replays A2's dealt world, against the same three G0 draws as round E.
- Spend per saga at list price: G0 $0.101, F1 $0.107, F2 $0.102, F3 $0.114, FX $0.120.
- Card 1 p50: 47.6 / 50.7 / 47.7 / 54.5 / 56.8 s. Plan p50: 40.1 / 40.6 / 38.3 / 42.8 / 45.0 s.

**Judging, all blind.**
- **weird.** A reader counts the reader-throwing sentences on every card. One reader per 6 sagas, arm unknown, 72 sagas per arm including G0. That makes 3,115 marked sentences.
- **card1_sense.** Card 1 alone, in pairs, both orders: 144 reads per arm.
- **J3 whole-saga.** Pairs read for *follow more easily* and *rather keep playing*, both orders: 144 reads per arm.
- **Tally correction.** In FX g2's saga block the supplied tally counted a `placeholder` row as a read (F8_1: G0 on follow, FX on keep). Two reads never came back (F8_2 and F8_3, G0 shown first).
  - True FX numbers: **follow 86–56, keep 85–57** (142 reads). Held pairs are unchanged.
  - Every number below is recomputed from the 1,151 reads and 3,115 marked sentences pulled from the judge transcripts. F1, F2, F3 and every card-1 tally match the supplied numbers exactly.

**Rule.** The goal is readability + story quality (North Star 0). Follow is the floor and keep is a target.
- Noise floor: two identical arms land within **±15 held pairs over 72** (item 2).
- p is a two-sided exact sign test on held pairs.

## 0. Verdict

- **Ship F1 "line" as the game default.**
  - **It deletes the designer's sentence.**
    - "carry/carries" in card prose: **175 → 16**. On card 1: 41 → 5.
    - "stands in your way / against you": **41 → 2**.
    - Beast stat lines ("It has tusks and a foul temper"): 9 → 0.
    - The marked trouble sentences of the stamp kind ("He carries a hooked staff and fear"): **118 → 16**.
  - **Readers prefer it.**
    - **Keep 92–52, held 40–20 (p ≈ 0.013).** This is beyond the noise floor, and ahead in all 3 generations.
    - **Follow 83–61, held 33–22.** Ahead in all 3 generations (9–8, 12–8, 12–6), but inside the floor.
    - **Card 1: 78–66** (held 29–23).
    - This is the same profile C2 shipped on (follow 83–61, keep 93–51).
- **The total weird-sentence count did not fall in any arm.** It was 615–630 against G0's 622.
  - The judge marks about **2.3 sentences per card in every arm and every generation** (2.30–2.36).
  - When a class goes, the next most noticeable sentence takes its place. So the total cannot show a fix at this scale.
  - **The class mix and the pairs can.** §1 explains this, and §3 counts the mix.
- **F1's new weak spot is the motive it now writes.**
  - Each trouble line must give a reason, and about half of those reasons are forced or come from nowhere: *"…for they are paid by the hive"*; *"…she fears you will take the rod from her"*.
  - Marked trouble sentences with a forced or missing motive: **44 → 92**. All marked trouble sentences: 160 → 160. The stamp went, and an invented motive took its place.
  - Readers still prefer a stated motive to none. In card-1 reads that cite *who is in the way and why*, F1 won **35–0**.
- **F3 "link" helps follow but not keep, and is not shipped alone.**
  - **Follow 86–58, held 33–19 (p ≈ 0.07).** That is +14, at the floor's edge (13–7, 8–8, 12–4 by generation).
  - **Keep is flat**, 75–69 (held 31–28), and lost g3 by 8.
  - Card-1 reads citing *why go to this person or place* went **36–5** its way.
  - It moved flags from the job sentence to the new lead sentence: job 104 → 62, lead 0 → 65.
- **FX (all three) is no better than F1 and overloads card 1.**
  - Follow 86–56, held 32–18 (+14, p ≈ 0.065). Keep 85–57, held 38–24 (+14, p ≈ 0.10). Both are at the floor's edge.
  - **Card 1 is flat**: 73–71, held 30–29.
  - The line and the lead both land in the same ~70 words. That brings pronoun knots and strangers on card 1: *"You slip into her camp … take her pack"* (whose?), and *"a short stranger in a tarred coat"*.
  - FX has the most card-1 marks (234 against 201) and the most road-row marks (51 against 28). It also adds $0.019 and 9 s per saga.
- **F2 "plain" removed its target and nothing else, and is not shipped.**
  - Marked quality compounds: **13 → 0** ("half-eaten oar", "weeping wine's name", "brand-new crown").
  - That target is 2% of the marks, and every reader number is slightly negative: follow 69–75, keep 68–76, card 1 66–78. All are inside the floor.
  - This is round D's law again: a slice that small cannot show.
- **A combination is not supported.** FX is the only combination measured, and it does not beat F1. F1+F3 without F2 was not run.
- **The plateau is broken if F1 ships** (North Star 4). F1 beats the default on the whole-saga pair, beyond the floor on keep.

## 1. Weird-sentence count, arm vs G0 (72 sagas each)

| arm | marked sentences | g1 · g2 · g3 (G0: 202 · 220 · 200) | marks per card | per 100 prose sentences |
|---|---|---|---|---|
| G0 | 622 | 202 · 220 · 200 | 2.33 | 39.3 |
| F1 line | 629 | 220 · 208 · 201 | 2.36 | 43.9 (fewer, longer sentences) |
| F2 plain | 615 | 208 · 218 · 189 | 2.30 | 38.6 |
| F3 link | 619 | 212 · 181 · 226 | 2.32 | 37.1 |
| FX | 630 | 211 · 202 · 217 | 2.36 | 41.6 |

**Why the total is flat.**
- Each arm differs from G0 by at most 8 marks (1.3%), yet one class moved by 100 (§3).
- Each generation moves by ±20 marks on its own: G0 g2 has 220, against 202 and 200 in the other two.
- The marks-per-card rate is the same everywhere (2.30–2.36). Per saga it is 8.6, with a spread of 2.2–2.7.
- The total also does not track the pairs. F1 has *more* card-1 marks than G0 (221 against 201) and still wins card-1 sense 78–66.
- **Law: the blind weird count saturates.** A reader asked to mark weird sentences finds about two per card in any of these arms. Read it by its **class mix**, not its total.

## 2. Pairs, arm vs G0

"held (flipped)" is arm–G0 in both orders, with flips in brackets. "1st / 2nd" is the arm's wins when shown first and second. "slots" counts, per slot, which side held more of its three generations (arm – G0 – tie).

**Card 1 alone (card1_sense)**

| arm | all reads | 1st / 2nd | held (flipped) | p | g1 · g2 · g3 reads | g1 · g2 · g3 held | slots |
|---|---|---|---|---|---|---|---|
| F1 | **78–66** | 42/72 · 36/72 | 29–23 (20) | 0.49 | 24 · 29 · 25 /48 | 9–9 · 11–6 · 9–8 | 9–8–7 |
| F2 | 66–78 | 31/72 · 35/72 | 26–32 (14) | 0.51 | 25 · 24 · 17 /48 | 11–10 · 9–9 · 6–13 | 7–12–5 |
| F3 | **81–63** | 43/72 · 38/72 | 33–24 (15) | 0.29 | 24 · 29 · 28 /48 | 9–9 · 12–7 · 12–8 | 14–6–4 |
| FX | 73–71 | 40/72 · 33/72 | 30–29 (13) | 1.0 | 25 · 27 · 21 /48 | 9–8 · 13–10 · 8–11 | 9–10–5 |

**Whole saga: follow (the floor)**

| arm | all reads | 1st / 2nd | held (flipped) | p | g1 · g2 · g3 reads | g1 · g2 · g3 held | slots |
|---|---|---|---|---|---|---|---|
| F1 | **83–61** | 48/72 · 35/72 | 33–22 (17) | 0.18 | 25 · 28 · 30 /48 | 9–8 · 12–8 · 12–6 | 13–8–3 |
| F2 | 69–75 | 42/72 · 27/72 | 25–28 (19) | 0.78 | 22 · 23 · 24 /48 | 10–12 · 7–8 · 8–8 | 8–10–6 |
| F3 | **86–58** | 47/72 · 39/72 | 33–19 (20) | 0.07 | 30 · 24 · 32 /48 | 13–7 · 8–8 · 12–4 | 14–5–5 |
| FX | **86–56** | 51/72 · 35/70 | 32–18 (20) | 0.065 | 31/48 · 26/46 · 29/48 | 13–6 · 9–7 · 10–5 | 13–7–4 |

**Whole saga: keep (the story target)**

| arm | all reads | 1st / 2nd | held (flipped) | p | g1 · g2 · g3 reads | g1 · g2 · g3 held | slots |
|---|---|---|---|---|---|---|---|
| F1 | **92–52** | 46/72 · 46/72 | **40–20** (12) | **0.013** | 35 · 31 · 26 /48 | 16–5 · 13–6 · 11–9 | 16–5–3 |
| F2 | 68–76 | 30/72 · 38/72 | 28–32 (12) | 0.70 | 26 · 25 · 17 /48 | 12–10 · 10–9 · 6–13 | 7–12–5 |
| F3 | 75–69 | 35/72 · 40/72 | 31–28 (13) | 0.79 | 33 · 26 · 16 /48 | 15–6 · 11–9 · 5–13 | 11–10–3 |
| FX | **85–57** | 41/72 · 44/70 | 38–24 (8) | 0.10 | 34/48 · 28/46 · 23/48 | 16–6 · 12–7 · 10–11 | 11–9–4 |

**Against the floor (±15 held).**
- **F1 keep (+20) is the only margin beyond it.**
- F3 follow (+14), FX follow (+14) and FX keep (+14) sit at its edge.
- F1 follow (+11) and every card-1 margin are inside it.
- Ahead in all 3 generations on held: **F1 follow, F1 keep, FX follow.** F3 follow ties g2. F3 and FX keep lose g3.
- **Position bias.** The saga shown first won 52% of card-1 reads, 59% of follow reads and 47% of keep reads. Each arm was shown first in half its reads, so the bias cancels.

## 3. Which source classes each arm removed

### 3.1 Classes, by the reader's stated reason

**How counted.** Each marked sentence goes to one of the 8 root classes of `f_classes.txt`. A fixed rule cascade reads the judge's `why` plus where the sentence sits (card 1, finale, Known/Held/road line). The same rules run on all five arms.
- Use the counts for **arm-vs-G0 deltas**, not as exact class sizes.
- Classes 4 and 5 are merged: the rules cannot split them reliably.

| root class | G0 | F1 | F2 | F3 | FX |
|---|---|---|---|---|---|
| 1+2 trouble object: the stamp ("They carry X", "stands in your way", stat lines) + foe with no side or motive | **118** | **16** | 120 | 99 | **17** |
| …per generation g1 · g2 · g3 | 40 · 36 · 42 | 6 · 5 · 5 | 41 · 46 · 33 | 34 · 30 · 35 | 8 · 6 · 3 |
| 4+5 the why: hope with no link, job not chained to the last find | 113 | 113 | 119 | **87** | 98 |
| 3 finale: ending person, finale with no why, padding | 125 | 141 | 116 | 124 | 128 |
| 6 engine pipes plan text (Known / Held / road / stale `win`) | 122 | 151 | 126 | 116 | 143 |
| 7 premise has no "what happened" ("Nobody knows…", "X needs you") | 47 | 45 | 43 | 50 | 49 |
| 8 dealt atoms raw (traits as tags, names or things from nowhere, place drift, pronouns) | 37 | 59 | 37 | 59 | **88** |
| other (forced logic, garbled or stock phrasing) | 60 | **104** | 54 | 84 | **107** |
| total | 622 | 629 | 615 | 619 | 630 |

### 3.2 Mechanism markers (exact patterns; judge marks unless noted)

| marker | G0 | F1 | F2 | F3 | FX |
|---|---|---|---|---|---|
| **all card prose** (not judge): "carry / carries" (on card 1) | 175 (41) | **16 (5)** | 174 (42) | 157 (40) | **15 (4)** |
| all card prose: "stands in your way / against you" | 41 | **2** | 40 | 24 | **0** |
| all card prose: motive clauses ("because", "fearing", ", for they") | 0 | 35 | 0 | 0 | 26 |
| marked: carry / "armed with" stamp | 71 | **10** | 76 | 69 | **10** |
| marked: "stands in your way" / "your foe" | 24 | 1 | 18 | 8 | 0 |
| marked: beast stat line (claws, tusks, great weight) | 8 | 0 | 9 | 6 | 0 |
| marked: **trouble sentence with a forced or missing motive** | 44 | **92** | 66 | 51 | **80** |
| marked: any sentence rendered from the plan's trouble | 160 | 160 | 177 | 154 | 162 |
| marked: sentence rendered from a non-finale `job` | 104 | 97 | 85 | **62** | **50** |
| marked: sentence rendered from the new `lead` | — | — | — | **65** | **61** |
| marked: job + why + lead together | 174 | 181 | 171 | 193 | 206 |
| marked: a dealt quality compound | 13 | 14 | **0** | 16 | **1** |
| marked: on card 1 | 201 | 221 | 204 | 215 | **234** |
| marked: road rows | 28 | 43 | 34 | 30 | **51** |

How a sentence is matched to its source: it is tied to the plan field it renders when at least 40% of its content words come from that field (`plan.json`).

### 3.3 What each arm removed, and what came in

**F1 line: removed the stamp (class 1). The new class is the invented motive.**
- Gone (G0 quotes):
  - "He carries a hooked staff and fear." (g1 F3_3)
  - "She carries a sharp tongue and old debts." (g1 F4_3)
  - "The cart guards carry crossbows and a heavy wagon." (g1 F1_2)
  - "The elf wanderer stands in your way." (g1 F4_3)
  - "It is huge. It has tusks and a foul temper." (round F diagnosis)
- In card-1 reads, a common reason given is that the obstacle now comes with its reason. **All 35** reads that cite it went to F1. For example: *"Y states the obstacle and its motive: 'The scouts will fire the barn and drive off the warhorse. They believe it was promised to them.' X ends with 'He carries a hooked staff and fear' and never says who is in the way."*
- **New: the motive itself is forced, circular, or a fact from nowhere** (marked 44 → 92). The plan must now give every foe a reason, and it invents one:
  - "At dusk, armed men will rush the hives to carry them off, for they are paid by the hive." (g3 F1_1: *forced, and contradicts the comb-only mystery*)
  - "She will fight you and run through the storm, for she fears you will take the rod from her." (*circular*)
  - "The moneylender lays false trails and fears debtors' kin will cheat her." (g1 F2_3: *doesn't explain hiding ledgers in a forest*)
  - "The human tax collector means to bar the flock, because his lord will dock him for every uncounted sheep." (*he could just count them*)
  - "Her guards will hold the path for her, because she cannot bear to be shamed." (*the guards' motive is her pride*)
- The motive line also costs room on card 1. "Nobody/No one knows" appears on 55 of 72 F1 card 1s, against 67 for G0, and the hope on 34 against 46.
- F1's "other" bucket (60 → 104) is mostly this same forced-motive line. The rule cascade only catches it under class 1+2 when the reason names a missing side.

**F2 plain: removed invented compounds (13 → 0). Nothing new came in, and nothing else moved.**
- Gone:
  - "a half-eaten oar from a timber barge was left wedged at the gorge mouth" (g2 F7_3)
  - "He wants to clear his weeping wine's name" (g2 F8_3)
  - "You must take back the brand-new crown from him." (g2 F6_3)
  - "No one knows where the smuggled antler hides…" (g1 F1_2)
- Traits used as tags (13 → 15) and names from nowhere (class 8: 37 → 37) are untouched. They come from the cast and the plan, not the keywords.

**F3 link: thinned the why (class 4+5: 113 → 87). The new class is the lead sentence.**
- Job sentences marked: 104 → 62. Card-1 reads that cite *why you go there* went 36–5 its way.
  - *"Y explains why you go to the landing: 'Merete saw the barrels rolled down there the night before they vanished.'"*
- Whole-saga follow losses that blame a job with no reason or a detour: **2 of F3's 58**, against **17 of G0's 86** (keyword tags).
- **New: the lead is itself marked 65 times** (32 on card 1). It is a compressed clue, an unsaid leap, or a fact the player never saw found:
  - "The scout's slate shows a hound's paw drawn beside the forest road." (*why does a paw doodle mean a message hound?*)
  - "Snares for a white hare point there." (*how do snares point to a village?*)
  - "The cutters came after the anniversary feast, wore red scarves, and sent wagons there." (*three unrelated facts, 'there' points nowhere*)
  - "The chart marks the far reed cove, and his pasture looks right down on it." (*nothing says we got a chart*)
- So job + why + lead marks went 174 → 193. The why got better and the new line brought its own marks. This is law 6b again.

**FX: both removals, plus card-1 overload.**
- Class 1+2: 118 → 17. Job marks 104 → 50.
- **New: names and pronouns tangle on card 1** (class 8 on card 1: 43, against 17). The line brings a foe and a reason, and the lead brings a witness, all in about 70 words:
  - "You slip into her camp outside Rushdale and take her pack unseen." (g1 F4_1: *'her' reads as Patty*)
  - "He sells his catch to the merchant's wagon, then vanishes; she would reach him first." (g2 F6_3)
  - "The human merchant talks over every plea." (g1 F3_3: *a stranger nobody introduced*)
  - "His road leads her to the purse." (g3 F3_2)
- **New: road rows print later leads' facts before play.** Road-row marks: 28 → 51.
  - "Win over the moneylender in Coldhollow. Ruurifin hopes she will say where the sailor's debt came from." (*'the sailor's debt' is not yet known*)
  - The builder predicted this: chaining job N+1 to learn N puts learn N's thing into a job the card-1 road prints.

**Unchanged in every arm** (shared plan sources; no arm targeted them):
- the finale (class 3: 116–141);
- engine-piped Known / Held lines (class 6);
- the premise's missing "what happened" (class 7: 43–50; "Nobody knows" 27–37 marks).

## 4. Three card 1s, before and after (G0 → F1, same slot and generation; REWARD/SAGA lines omitted)

**g1 F3_3. F1 held both orders.**

> G0 · ═══ The Goatherd's Silence · The Barn at Thorncroft ═══
> The elf farmer Eraldil needs you. She wants to keep her farm at Thorncroft and its warhorse safe. Nobody knows why raiders would come for so small a farm. You must win over the goatherd at Hawwick. Eraldil hopes he will say where the raiders gather and which road they will take. He carries a hooked staff and fear.

> F1 · ═══ Raiders at the Barn · The Warhorse in the Barn ═══
> An elf farmer named Eraldil needs you. She wants the raiders stopped before they burn her farm. Nobody knows who promised them her warhorse, or why. You hold the barn near Greydale against the raiding scouts. Eraldil hopes the beaten scouts will leave proof of who sent them. The scouts will fire the barn and drive off the warhorse. They believe it was promised to them.

Reader: *"The task and the enemy fit together … In Y nobody is clearly in the way, and 'He carries a hooked staff and fear' reads oddly."*

**g1 F4_3. F1 held both orders.**

> G0 · ═══ The Innkeeper's Word · The Fisher's Brooch ═══
> Road ahead:
>   ▶ The Innkeeper's Word
>   · Track down the fisher's hiding place from the woods of Hawholt. Cartia hopes the place will show her how to reach the fisher.
>   · Finale
> The human seeker Cartia needs you. She wants to find the missing elf fisher. No one knows why the fisher left her boat and nets and vanished. You must win over the wolfkin innkeeper of Woldcombe. Cartia hopes he will say where the fisher was last seen. The elf wanderer stands in your way. She carries a sharp tongue and old debts.

> F1 · ═══ A Word at the Inn · The Fisher on the Island ═══
> Road ahead:
>   ▶ A Word at the Inn
>   · Track down the fisher's hiding place along the shore at Hawholt. Cartia hopes to learn where on the lake the fisher is hidden.
>   · Finale
> Cartia, a human music box maker, needs you. She wants to find the elf fisher who vanished from the lake. No one knows why the fisher left her home and boat to hide. You go to Woldcombe to win over the wolfkin innkeeper at his inn. He may say which way she went. He swore to keep quiet, and a bossy elf wanderer at his hearth backs his silence.

Reader: *"The obstacle comes with its reason … Y's 'The elf wanderer stands in your way' never explains why she does."* The talk job's foe is now the person to win over, as the `against` table asks.

**g1 F2_3. G0 held both orders: the new class costs F1 here.**

> G0 · ═══ The Ledger at the Fair · The Debt at Stonecot ═══
> Road ahead:
>   ▶ The Ledger at the Fair
>   · Chase down the moneylender's runner on the forest road near Dunshaw. Jervaise Greyfell hopes the runner will lead her to where her brother is kept.
>   · Finale
> Jervaise Greyfell, one of your soldiers, wants to win back her younger brother and beg his pardon. Long ago she sold his freedom to buy her own way out. You must find the moneylender's hidden ledger chest at the Fernwell fair. Jervaise hopes it will show what her brother still owes. The moneylender's hired fair-guards stand in the way. They carry cudgels and have sharp eyes.

> F1 · ═══ The Hidden Ledger · The Scraped Mark ═══
> Road ahead:
>   ▶ The Hidden Ledger
>   · Slip into the moneylender's counting-room at Fernwell during the harvest fair and take the sealed bond-slip. Jervaise Greyfell hopes to take the bond-slip, so she can see the exact words that bind her brother.
>   · Finale
> Jervaise Greyfell, one of your soldiers, wants her younger brother freed from the moneylender's debt-bond. She left him for her own freedom. No one knows why his debt is never cleared, though he has worked it many times over. Find the moneylender's hidden ledger-house in the forest near Stonecot. Jervaise hopes to read the true debt page. The moneylender lays false trails and fears debtors' kin will cheat her.

Reader: *"X's goal and blocker are concrete … Y's 'fears debtors' kin will cheat her' is a vague obstacle that throws you off."* The stamp is gone, but the motive line is the weak sentence.

In the 41 slot-generations where G0's card 1 has a carry or "stands in your way" sentence, the card-1 pair held 15–14 for F1. **F1's card-1 gain is not only the stamp disappearing. It comes from the foe having a reason when the reason holds up.**

## 5. Recommendation

1. **Ship F1 "line" into the game default (pipe arm `line` in place of `grafts`).**
   - It is the only arm with a margin beyond the floor (keep +20 held, p ≈ 0.013). It leads on follow and keep in all 3 generations, and it deletes the designer's sentence class (carry 175 → 16; "stands in your way" 41 → 2).
   - It matches the evidence C2 shipped on. Cost +$0.006 per saga; card 1 +3 s.
2. **Do not ship F2.** Its target is 2% of marks, and every reader number is slightly behind.
3. **Do not ship F3 or FX yet.**
   - F3's follow gain (+14 held) is at the floor's edge, its keep is flat, and its lead adds its own marks.
   - FX shows that the line and the lead together overload card 1 (card 1 flat; 234 marks; pronoun knots) and leak later facts onto the road (51 marks).
   - **If link is pursued, the next arm is line + link on the new default.** Keep the lead off card 1's crowded space, or show road rows after the next job as titles only (the builder's follow-up). Test it against `line`, 3 generations.
4. **The next class to work on is the motive F1 now writes** (forced or from-nowhere reasons: 92 marks).
   - It is an input to shape (North Star 8), not a wording pass.
   - Possible direction: the motive comes from something the plan already holds for that person, such as a cast member's want or the job's lead, rather than being invented per job.
   - C3 (the plan writing each person's side) did not move follow, so this needs its own measured arm.
5. **Stop reading the weird total as a score.** It saturates at about 2.3 per card. Report its class mix, and judge on the pairs.
6. **Still live in the default:** the byname label bug. "Autonoe of the Ford — of the human woman" (G0 g1 F8_1) and "— human wage-clerk of the" (F1 g1 F8_1) appear on several cards.

## Files

- Reads and marks pulled from the judge transcripts (workflow `wf_c9d7b95e-9a4`) into `scratchpad/fr/reads.json` and `weird.json`.
- Classification: `fr/classify.py` (reason cascade), `fr/source.py` (plan-field match), `fr/markers.py`, `fr/stats.py`.
- Sagas: `runs/seed1/{G0,F1,F2,F3,FX}_g{1,2,3}`.
- Build notes: `scratchpad/f_build.txt`. Diagnosis: `scratchpad/f_classes.txt`.
