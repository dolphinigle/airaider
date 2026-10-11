# Saga panel: hiding the forward quest log (2026-10-05)

**Question.** The designer asked us to hide the quest log (For / Road ahead / Known / Held / Open question) and show only the past parts. The game now does that ("So far" rows from card 3 on). Are sagas still as easy to follow, and as good?

**Answer.**
- **Personal sagas: yes.** No measurable change.
- **Hired sagas: no.** Followability drops beyond the CI. Readers lose track 0.43 more times per saga, and the story score falls 0.39 points.
- **The cause:** later jobs arrive with no visible reason, and the hired finale card often no longer says whom the job is for.
- **The fix proposed here is input-side** (what the card writer is given), not the log coming back. It is not built.

## 1. What was compared

| arm | pipe | set |
|---|---|---|
| **NV** | the game's `voice` pipe: no log, So far rows | seed1 (hired), 24 slots |
| **LV** | `voice+log`: the same parts with the old log | seed1 (hired), 24 slots |
| **NP** | the game's `past` pipe: no log | pers1 (personal), 24 slots |
| **LP** | `past+log`: the same parts with the old log | pers1 (personal), 24 slots |

- **Generations:** two (g1, g2), so 48 pairs per set. A pair means the same slot and the same generation.
- **What differs between the arms:** the prompts are the same, apart from how a name is introduced the first time. Each arm writes its own plan from the same deal. So a pair shares its deal, but not its story.
- **Readers:** two blind Opus readers per saga, in one shuffled batch per set with both arms mixed. That is 192 reads per set, and every saga was present.
- **What each reader gives:**
  - **S10:** a 1–10 story score.
  - **Lost:** each place where they lost track (whom the job is for, what the job is or why, who someone is, what happened before), with the line quoted.
- **Reader agreement:** the two readers gave the same score 59% (hired) and 64% (personal) of the time, and were within one point 98% and 99% of the time.
- **Level:** no anchor arm was in the batch, so compare pairs only, never levels.

## 2. Results (paired by slot and generation; 95% bootstrap CI over the 48 pairs)

| set | S10 no log | S10 with log | **S10 diff** | pairs lower / higher / tied | lost no log | lost with log | **lost diff** |
|---|---|---|---|---|---|---|---|
| hired (NV − LV) | 5.50 | 5.89 | **−0.39 [−0.65, −0.12]** | 25 / 14 / 9 | 3.44 | 3.01 | **+0.43 [+0.05, +0.81]** |
| personal (NP − LP) | 6.02 | 6.19 | −0.17 [−0.45, +0.10] | 21 / 17 / 10 | 3.39 | 3.34 | +0.04 [−0.36, +0.43] |

- **By generation:**
  - Hired S10: g1 −0.52 [−0.83, −0.19], g2 −0.25 [−0.67, +0.15]. Behind in both.
  - Personal S10: g1 −0.02, g2 −0.31.
- **Resampling whole slots** (both generations together) gives the same answer:
  - Hired: S10 [−0.65, −0.11], lost [+0.04, +0.80].
  - Personal: S10 [−0.38, +0.04].
- **Noise yardstick:** round H's A/A run (the same arm generated again, 48 slots) moved S10 by +0.01 [−0.27, +0.29]. The hired drop is outside that.

## 3. Where the extra lost points are (each quoted line located in the saga)

Lost points per saga, by where the quoted line sits:

| where the line is | hired: no log | hired: log | hired: diff | personal: no log | personal: log | personal: diff |
|---|---|---|---|---|---|---|
| card 1 (prose + rows) | 0.61 | 0.60 | +0.01 | 0.38 | 0.71 | **−0.33 [−0.53, −0.14]** |
| later cards (prose + rows) | 1.18 | 0.92 | **+0.26 [+0.04, +0.47]** | 1.44 | 0.83 | **+0.60 [+0.38, +0.81]** |
| reports | 1.65 | 1.49 | +0.16 [−0.16, +0.45] | 1.57 | 1.80 | −0.23 [−0.55, +0.07] |
| *of which on the log rows themselves* | 0 | 0.19 | | 0 | 0.42 | |

- **Personal sagas come out flat** because removing the log fixed card 1 about as much as it hurt the later cards. Card 1's road rows were costing them.
- **Hired sagas only lose.**
- **The So far rows cost nothing.** No lost quote sits in a So far row. One reader noticed "Card 3's So-far skips step 2". That is by design: the last part is told by the card's own opening.

## 4. Lost-point classes that appear only or mostly without the log

### 4.1 The next job arrives cold (the big one)

A later card's job or hope sentence was quoted as lost:
- **Hired:** 88 times without the log, 57 with it.
- **Personal:** 116 times without the log, 46 with it.

With the log, part of the same confusion moved up to card 1's road rows (personal: 51 such quotes on card 1 against 13). Counting those as well, the net is still:
- hired +0.31 per saga [+0.08, +0.53]
- personal +0.33 per saga [+0.09, +0.57]

It happens even on cards that carry a hope sentence. Lost points per middle card that has one:
- hired: 0.31 without the log, 0.19 with it
- personal: 0.52 without the log, 0.24 with it

The road had shown each job ahead with its hope (law 6c), and Known had shown the clue. Without them, the card's "X hopes…" alone does not say why *this* person or place. Quotes from the arms without the log:
- *"Now you must bring the elf charcoal-burner from Hawhollow safely to Harrowlea."* NV F2_1 g1, flagged by both readers: "the charcoal-burner arrives with no reason given".
- *"Now you must find the elf herbalist, who fled the flood."* NV F8_2 g1, flagged by both readers: "the herbalist and the wolfkin captain arrive cold".
- *"Next, you must win over the herbalist at Nethercroft."* NV F5_3 g2: "Nothing says why the herbalist matters".
- *"Now you must track the magpie that carries the smith's silver seal ring to its nest near Marllea."* NP S6_1 g1: "the key evidence comes from nowhere".
- *"Ilwen hopes the book can be read for what the elder meant to count."* NP S3_1 g2, flagged by both readers.

### 4.2 Whom the job is for drops off the later cards

- **Only without the log:** readers named this in 7 reads, against 0 with the log.
- **Hired finale cards:** the asker appears anywhere on the card (prose or ON THIS MATTER) in 17 of 48. With the log it was 48 of 48.
- **Personal finales:** 37 of 48.
- **No finale states the want in either arm** (0–2 of 48). This is by design: the finale's why was the For line (`laterCardPayload`: "the finale none — its why is the For line's want").

Quotes:
- *"You must win her brother's release from the bond."* NV F2_1 g2: "Jervaise is never named on this card, so 'her' has no one to point to".
- *"Now you must take Secile, a sailor, from the Tarnbourne gallows before the hanging."* NV F7_3 g1: "who wants this… Baxilt-Gah drops off ON THIS MATTER".
- NV F8_1 g1: "In card 3, Autonoe drops off the card and 'She' could mean either woman".
- NP S8_2 g1: "card 3 never names Yrsa".
- NP S5_2 g1: "Bran is missing from its text".

### 4.3 A card with no reason at all

- **When it happens:** the engine withholds a job's hope when it would spoil. That happened on 7 of 82 hired middle cards without the log and 11 of 82 with it.
- **What is left:** with the log, the For line was the only reason left on such a card. Without it, the card has none.
- **Cost:** 0.79 lost points per read of such a card without the log, against 0.50 with it.
- **Example:** NV F5_3 g2 card 2 names no one, has no hope sentence and has no ON THIS MATTER line: *"You beat back the raid and saved the flock. One raider is now your captive. Next, you must win over the herbalist at Nethercroft. She is afraid and keeps her door barred. She will stay silent and turn you away unless you earn her trust."*

### 4.4 Not changed, and gone

- **Not changed by the log:**
  - A culprit named with no clue pointing at them: 15 reads without the log against 16 with it.
  - Contradictions.
  - The stock trouble lines. Your *"They will turn strangers back and raise the camp."* class is in both arms, for example NV F1_1 *"They will shoot at you and raise the camp."* and LV F1_3 *"He will turn strangers away"*. It needs its own fix (the NT / PT line arms are built and have not been run).
- **Gone with the log:** 18 hired and 40 personal lost quotes sat on the log rows themselves:
  - Road rows that name a job before it is set up: *"Take the fake quilt from the baron's drying loft in Millhollow unseen."* (what quilt?).
  - Garbled rows: *"Marta of the Marches hopes the company hopes to walk the cave…"*.
  - Held or Known rows that the page never showed: *"Held: … the freed elf trapper"* (no trapper was ever freed).

## 5. One saga both ways: seed1 F2_1, generation 1, card 2

The deal is the same. Each arm wrote its own plan, so the job differs. S10: NV 5 / 5, LV 6 / 7.

**Without the log (NV).** Both readers flagged the job line.
```
═══ The Burner's Road · The Brother's Bond ═══
You found Vulmon the weaver, and he agreed to speak with you. Now you must bring the elf charcoal-burner from Hawhollow safely to Harrowlea. Jervaise Greyfell hopes he can then stand and speak for her brother there. The magistrate's mounted wardens stand in your way. They carry lances and a sealed writ, and they will turn the burner back by force.
ON THIS MATTER: Jervaise Greyfell — human soldier · Vulmon — elf weaver
```

**With the log (LV).** Card 1's road had already shown this job and its hope. One reader still flagged the weaver as coming from nowhere, so the road halves the problem rather than removing it.
```
═══ A Word at the Tavern · The Cook's Debt ═══
For: Jervaise Greyfell, one of your soldiers, who wants to free her younger brother from the debt-master.
Road ahead:
  ✓ Smoke at Rushmoss
  ▶ A Word at the Tavern
  · Finale
Known:
  The brother's debt is not held by a far-off lord but by someone in Hawhollow, and the bond has been kept open for years.
Held: the charcoal-burner as guide
Open question: why her brother has never come looking for her
You found Thiile, the charcoal-burner, and he agreed to guide you through the forest. Now you must win over the elf weaver at the tavern in Harrowlea. Jervaise Greyfell hopes he will take her side and tell what he knows of her brother. Two bailiffs stand at the tavern door. They carry staves and strict orders, and they will bar strangers from the weaver.
ON THIS MATTER: Jervaise Greyfell — human soldier · Thiile — elf charcoal-burner
```

**The same NV saga's finale (card 3).** Jervaise is not on the card at all.
```
So far:
  ✓ The Weaver at the Tavern — The company went into the Rushmoss tavern, got past the magistrate's bullies, and found the weaver, who agreed to speak with them.
Thiile, the charcoal-burner, has reached Harrowlea safe. Your task now is to make the elf magistrate give up the brother's bond, here in the town. She stands against you with her wardens. They hold the bond and the law. They will keep the brother bound, and they will use that law to do it.
ON THIS MATTER: Thiile — elf charcoal-burner
```

## 6. Verdict and remedy

**The change stays: you asked for it.**
- **Personal sagas** hold: S10 −0.17, with a CI that includes 0, and lost points are flat.
- **Hired sagas** lose followability beyond the CI: +0.43 lost points per saga and S10 −0.39 [−0.65, −0.12], behind in both generations. Law 6(c) shows again: the road was doing the work of "why each job leads to the next" and "whom it is for".

**The smallest remedy is on the input side (not built).** The card prose should carry the two things the log used to carry for it. Both come from parts that already exist:

1. **The want on every card that has no hope of its own.** That means the finale always, and any middle card whose hope was withheld.
   - Deal the asker's name and want to the card as its `why`, the For line's content, so the card's own sentence says whom the job is for.
   - This is engine-only: card 1's payload already carries them (`premise.who`, `premise.wants`).
   - It targets classes 4.2 and 4.3.
2. **The lead into each middle job.** Add the existing `link` part to the game pipes.
   - The plan writes the fact the player already has that points to this job's person or place.
   - `withLead` folds it and the hope into the card's one `why` item, so it does not become its own stock sentence (law 6b).
   - On G0, round F measured it at follow +14 held (at the floor's edge) with keep flat.
   - It targets 4.1, the largest class.

**How to test it.** Two arms against LV, in one shuffled S10 batch with NV as the second anchor, on seed1 hired, 2 generations:
- **NW** = NV + the want
- **NWL** = NV + the want + link

Pre-registered rule: an arm ships if its lost − LV CI includes 0 or is below it, **and** its S10 − NV CI is above 0. Run personal (pers1) only if NWL ships, since personal did not drop.

---
Data: `runs/seed1/{NV,LV}_g{1,2}`, `runs/pers1/{NP,LP}_g{1,2}`. The reads come from workflow wf_ddded131-826. Paired statistics and line locations were computed from the reads; the counts in §3–§4 come from quote-to-file matching (every quote was located).
