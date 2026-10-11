# Sultan pacing study: what makes the saga text 6/10, and what to test (2026-10-04)

**Why this exists.** The designer rates today's saga text at about 6/10 and asked for experiments: *"longer pre-text or at least ALLOW the ai to have that. Dialogues, lore exposition … check sultan game … sometimes very short intro, sometimes long, depends on what the saga wants to tell in that part of the story … dont just impl but test."* (STORYTELLER.md ★ NORTH STAR, item 0, TEXTURE + PACING). This file holds the evidence and the arm designs. It changes no code.

**Sources.**
- Sultan text comes from the **official shipped English**: `prosebench/research/sultans_en/config.json.gz`, plus `config_merged.json.gz` where a key was missing. All 19 rites studied here are in the clean file.
- Sultan coverage: 12 rites hand-tabled (the 10 PART 3 rites plus 2 Jabal siblings), the Adila dragon storyline (5006030–40), the Alim/Hemir storyline (5008060–80), and the whole corpus (about 1,370 intros, 5,900–7,100 result texts depending on deduplication).
- The designer's four quests (`REFERENCE_SULTANS_RESULTS.md`) are ground truth. Nothing here contradicts them.
- **PART 3 agent translations are not used.** Every Sultan quote below is official English.
- "Ours" means the current default (C2 grafts on kit+pick): `runs/seed1/G0_g1..g3`, 72 sagas, 267 cards and 267 reports. Outcomes: 141 job successes, 27 partials, 27 failures, 51 finale successes, 21 finale partials.
- Four independent readers measured these. Where they overlap, they agree to within a few points. The headline numbers were re-checked for this file.
- The in-flight round E arms (late showdown, trail, narrow hope, uncommitted in the working tree) are out of scope.

**How the parts map.** Our saga is a chain of quests, like a Sultan storyline, not like one rite. Within one part:

| Sultan | ours |
|---|---|
| rite intro (card text) | card prose (under the quest log) |
| stage goal line + the stage's shared setup | report `before` (shown before the dice line) |
| outcome branch | report `after` |
| storyline of rites (Adila, Alim) | a saga |

---

## TL;DR

1. **The rule:** in Sultan, **the length of a part follows what it delivers.** A part that teaches a legend or rule, introduces a person, gives a backstory or carries a reveal runs long. A connective beat, a mechanical step, or anything already told runs short. Position in the story barely matters. The usual pattern is a short climax intro followed by a long climax result.
2. **Sultan is not longer than us, it is more varied.** Sultan intros have a median of 23 words, ours 61. The text before the roll has a median of about 25 words in Sultan and about 100 in ours. The gap is spread: intro length CV is 0.75 for Sultan and 0.11 for ours, result CV 0.93 against 0.26. Read "longer pre-text" as **"long where the part has something to tell"**. That is exactly the designer's *"sometimes very short, sometimes long"*.
3. **Our length is locked by the field list, not by the cap.** Card cap 70 gives a median of 62 words; the finale's cap of 90 gives 59. 99% of card sentences restate a payload field, in one skeleton. Report caps do move output: they fill to 72–93%, whatever is in them.
4. **Dialogue and lore are the largest content gaps.**
   - Quoted speech: Sultan has it in 21–25% of results, rising to 55% of results over 100 words. Ours: 0 of 267 cards and 10 of 267 reports. 60–63 of our 72 finale reveals arrive as reported speech.
   - Lore: 7 of Sultan's 12 rites open on a lore intro, and that lore is paid off later in 4 of 4 expeditions and rituals. Our 72 sagas contain about 0–3 flavour lore sentences in total.
   - Voice and endings: Sultan's narrator shows attitude in 48% of intros and 65% of results; ours in 3% and 0%. 57% of Sultan endings are plain statements; 91% of ours are.
5. **Arms (section 3), each one input-shaping change against the default:**
   - (a) **ROOM**: caps up only. This is the control.
   - (b) **WEIGHT**: the engine, or the plan, deals each part a size *and the content that fills it*.
   - (c) **VOICE**: one quoted line where a person with a stake speaks: the asker on card 1, the clue's witness, the secret in its owner's mouth. Never a script.
   - (d) **LORE**: one plan-written local-lore fact, told on card 1 and paid off later.
   - Judge them with J3 plus a new **anchored whole-saga story score S10**, where the median default saga is 6 by construction (section 4).

---

## 1. How Sultan's Game paces a multi-part story

### 1.1 The measured rule: length follows what a part delivers

Across all 7,169 result texts and 1,366 intros (median words):

| what the text delivers | with | without |
|---|---|---|
| quoted speech (results) | **107** | 36 |
| a lore marker (legend, ancient, custom, according to…) (results) | **96** | 41 |
| gated on a specific named person or card (results) | 54 | 42 |
| speech (intros) | **58** | 22 |
| lore (intros) | 37 | 22 |

Clean single proofs from the official English:
- **Same moment, told once vs again.** God-Hunting's Sultan-card coda runs **65 words** the first time, because it carries the banished-god lore: *"In ancient times, a god was judged evil and banished for unauthorized world-alteration…"*. On a repeat it runs **10 words**: *"You've murdered a god... the Sultan's Game witnesses this achievement."*
- **A backstory is the longest text there is.** Sharp Grass Plain's generic stages run 18–48 words. When the Roaming Swordsman is slotted, his backstory branch runs **158–221**, the longest text in the 10 rites.
- **Mechanical beats are tiny; the spectacle is long.** Palace Duel's mid-fight beats run 5–19 words (*"Abdul's Shield Blocked Your Attack"* is 5). Only the decisive or spectacle beats are long: the instant win 47, the beheading 48, the feigned-surrender death 57.
- **The truth is long; the truth lost is short.** White-Belly's reveal branches run 165–320 words. The branch where the truth is lost runs **16**: *"Alim tortured White-Belly to death. Even in his final moments, he never revealed the child's whereabouts."*

### 1.2 Position does not set length

- **Stage position.** In 78 rites with two or more dice stages, the stage holding the longest text is the first in 24, a middle one in 26, and the last in 28.
- **Medians by position:** first stage 42 words, middle 62, last 48. An unconditional coda after a check runs 68.
- **Success vs failure.** Success is slightly longer overall (first stage 45 vs 30), but **failure runs longer whenever it carries a cost story or a reveal.** God-Hunting's mirror stage: failure 88 vs success 65, because only the failure says *"Only now do you understand – this god, poisoned by human desires…"*. The Forest of the Jinn failure is longer in 3 of 4 stages.
- **Flat failures stay short.** "Nothing happens" failures run 18–28 words.
- **The climax: short intro, long result.** Heroic Act of Dragonslaying has a 26-word intro, a pre-roll line of *"In the consuming flames of the dragon's curse, can Adila survive? No one knows…"*, and results of 128–303 words that carry Adila's speech.

### 1.3 Short vs long: lengths by part role

From the 12 rites, by hand-labelled role (one annotator):

| part role | n | median words (IQR) |
|---|---|---|
| stage goal line (pre-roll) | — | **7** (corpus: 6, p90 17) |
| hook intro, no lore (a summons, rumour, recap or job) | 5 | **18** (13–33) |
| hook intro with lore (a legend, rule or procedure) | 7 | **38** (21–74) |
| quiet beat | 6 | 28 |
| coda | 6 | 32 |
| escalation | 16 | 39 |
| turn / reveal | 5 | 48 (31–82) |
| first obstacle | 14 | 56 |
| climax | 29 | 58 (45–86, p90 112) |
| aftermath | 4 | 59 |
| **character-backstory reveal** | 3 | **158** (125–190) |

Bands worth keeping (Sultan):

| part | words |
|---|---|
| connective intro | 13–23 |
| lore intro | 29–74 |
| dialogue-bearing intro | about 58–107 |
| connective result | 5–30 |
| standard result | about 50 |
| reveal or backstory result | 150–320 |
| aftermath | 60–310 |

**When an intro is long.** It is long when it must **teach** something unknown: a place, a ritual, a rule. That lore is a **roadmap the later stages pay off**, often in order:
- Canyon of Gales (74 words): *"Statues of griffins and snakes flank the canyon, suggesting the challenges adventurers will face..."* Stage 1 is the griffin; stage 2 is the snakes.
- God-Hunting (38 words, one sentence): *"lure the greedy god into the vessel, block escape with darkness, counter resistance with mirrors, then slice open the vessel…"* Its stages follow that exact order.

**When an intro is short.** It is short when the situation explains itself:
- Sultan's Game, 13 words: *"Now, the noble and merciful ruler requests you to join the 'Sultan's Game.'"*
- Palace Duel, 23 words: *"Yesterday, you presented a Bloodshed Card in court. Today is the day you and your opponent must settle this fight to the death."*
- Catching a Thief, 16 words: *"As you step into the study, a dark figure scrambles out the window in a panic –"*

### 1.4 Across a whole storyline (the nearest thing to our saga)

**Adila dragon storyline (5006030–40).** Intro words, results, and speech by beat:

| # | beat | intro | results (min–max) | results with speech |
|---|---|---|---|---|
| 1 | Legend of the Dragon | 22 | 85 | 1/1 |
| 2 | A meeting related to the dragon | 15 | 101–161 | 3/3 |
| 3 | **Things Warriors Do Not Need** (marriage pressure, Adila's heart) | **120** | 113–364 | 6/6 |
| 4 | Journey Alone | 65 | 71–215 | 1/2 |
| 5 | Struggling Forward | 49 | 270 | 1/1 |
| 6 | Dragon Lair Investigation | 31 | 64–120 | 0/3 |
| 7–8 | Final Preparations (logistics) | 20 / 18 | 40–72 | 0 |
| 9 | **Heroic Act of Dragonslaying** (climax) | 26 | **128–303** | 5/5 |
| 10–11 | gifts (aftermath) | 17 / 12 | 29–167 | 5/21 |

**Alim/Hemir storyline (5008067–75).**

| part | role | intro | results | speech |
|---|---|---|---|---|
| Catching a Thief | hook | 16 | 15–39 | 0 |
| One Hand for Goods / Money First / Fate of the Pickpocket | transactions | 14–24 | 11–83 | — |
| **Nest of Decay** | escalation | **106**, with 2 lines of Alim's speech and Dark Alley exposition | 50–125 | 4 of 6 results |
| White-Belly | climax | 39 | **16 (truth lost) to 320 (reveal)** | — |
| Turning the Millstone | denouement | 23 | **120–310** | 5 of 5 |

The denouement also carries custom exposition: an apprenticeship *"where the apprentice must fulfill the obligations of a firstborn and will inherit all the master's property"*.

**The pattern.**
- Intros stay short except where the stakes are re-framed by a person and the world (Adila 3, Nest of Decay).
- Logistics beats are short and silent.
- Character beats, the climax result and the aftermath are long and voiced.
- The largest results sit at the climax and the denouement, not on the cards.

**Total reading per rite spans about 5×.** Palace Duel runs 71–150 words. Canyon of Gales 257. Forest of the Jinn 361–396. God-Hunting about 382. The size of a part is itself a signal to the player.

### 1.5 Text before the roll

- Only 42% of rites have a pre-roll line at all.
- Its median is **6 words**, the p90 17, and quoted speech appears in 2 of 626. Examples: *"Draw your sword."*, *"Play chess with the jinn sage."*
- Intro plus pre-roll, combined: median 25, p90 63, max 163.
- The designer's long pre-roll is the tail. Divine Stallion has 121 words in the designer's transcription and 67 in the shipped English.
- The designer's version carries the guide's whispered line and the sent soldier rising. **Neither is in the shipped config.** Either it comes from a newer build, or memory improved it. What the designer remembers as good is *speech at the hinge, plus the soldier committing*.
- Ours: card plus before comes to about **100 words before every roll**. The gap is shape and voice, not length.

### 1.6 Dialogue

| measure | Sultan | ours |
|---|---|---|
| intros with quoted speech | 4–5% | 0% (0/267 cards) |
| results with quoted speech | 21–25% | **4%** (10/267 reports) |
| speech rate by result length | <20w 3% · 20–50w 9% · 50–100w 26% · **100–200w 55% · 200w+ 83%** | — |
| speech per voiced result | median 2 quoted spans, about 12 words each | — |
| who speaks | about 89% NPCs (the asker, the target, a witness); the sent character 5%; the player 3% | — |
| finale reveal given in direct speech | the designer's Project Investment: Mahir's dream in her own words | **3/72** finale afters carry a quoted line; reported speech in 60–63/72 |

- **Where it goes.** Into results where a person **with a personal stake** is present: a motive or worldview in one line, a witness's testimony that delivers the clue, a reaction.
  - *"I'm certain someone used poison – on the bait rabbit that entices the hounds forward"* (Faris, who asked for the job).
  - *"It's them... They've been eyeing my boys..."* (Alim, Nest of Decay).
- **Where it does not go.** Almost never instructions, intros, goal lines or expedition stages.
- **The sent character speaks mostly to report back:** *"The next day, [s1.name] returned. It eagerly recounted the night's events: …"*
- **Our bench agrees** (`prosebench/DIALOGUE_AB.md`):
  - Voiced one-off cards won +1 with unanimous preference, and shipped for one-offs.
  - Script-format resolutions lost by 1 point, 6:18 on preference.
  - Post-hoc quote chips lost 1:17.
  - *"The one-quoted-line-that-changes-something rule did MORE with less."*
  - Saga cards in full first person broke voice (the client narrating himself in the third person), and that class is still unfixed.

### 1.7 Lore exposition

- **By rite type.** Expeditions, rituals and haunted places carry lore. Duels, hunts and court scenes carry none.
- **Lore per rite** runs from 0 (Palace Duel, Canyon of Gales results, Sultan's Game) to about 7 sentences (God-Hunting), **at most about one sentence per stage, usually at the stage's turn**.
- **Never a block in the narrator's voice.** Four ways of delivering it:
  1. **A legend in the intro, often hedged:** *"Legends tell of fallen Homeland royal ghosts wandering here. Perhaps treasures or secrets lie hidden."* Hearsay or legend framing appears in about 10% of all intros.
  2. **A rule the stage reveals.** The Jinn thorns: *"A single scratch, and your mind is drowned in its worst pains."*
  3. **A realisation on failure:** *"Only now do you understand…"*
  4. **Speech from a character with history.** The priest: *"This woman repeatedly attempted to steal sacred objects."*
- **Lore can be overturned as the turn.** Forest of the Jinn's intro promises a wager; the climax says *"There is no wager here – only her favor."*
- **Lore can be a short paragraph at the moment it pays off.** Journey Alone: *"According to the Book of DragonSlaying, dragons rarely leave footprints… But even the most careful plans have their flaws…"* (about 60 words; it explains how the lair was found).

### 1.8 What makes Sultan's text read better, in measurable terms

| measure | Sultan (official EN) | ours (G0, 267/267) |
|---|---|---|
| intro / card words: median (p10–p90) | 23 (10–58) | 61 (52–68) |
| intro / card length CV | **0.75** (inside one storyline: 0.72–0.85) | **0.11** (within one saga, max/min card = 1.2) |
| result / after words: median (p10–p90) | 51 (9–145) | 101 (60–132) |
| result length CV | **0.93** | **0.26** |
| multi-paragraph intros at 60–90w / 90–200w | 41% / 88% | 0% |
| results with quoted speech | 21–25% | 4% |
| narrator voice (stance adverb, ?, …, !), intros / results | **48% / 65%** | **3% / 0%** |
| last sentence: plain fact or action | 57% (floor; crude classifier) | **91%** |
| last sentence: a feeling, forward hook or modal | 22% | 7% |
| words per sentence (intros) | 12.9–15 | 10.2 |
| sentences per intro / card | about 2 | about 6 |
| flavour lore sentences | 7 of 12 rites open on lore | about 0–3 in 72 sagas |
| content-word repetition at matched length | 0.03 (intros) / 0.06 (results) | 0.07 / 0.10 |

**The designer's four in particular:**
- Intros are 15, 54, 58 and 21 words long, with 1–3 sentences each.
- **0 of 4 intros state a cost.** Each ends on a vector at the player: a failed precedent (*"Many hunters tried… all returned empty-handed"*), a promise, a wry threat (*"or the Sultan will get bored before you even finish it"*), or an aphorism.
- Every result ends on a feeling or a forward point.
- Speech appears only in the saga beat: Project Investment's success is 124 words, 47 of them quoted.

---

## 2. Our current sagas against that

### 2.1 Uniform in size, at every position

| text | median words | p10–p90 | CV | note |
|---|---|---|---|---|
| card prose | 61 | 52–68 | 0.11 | card 1: 66 · middle: 60 · retry: 57 · finale: 59 |
| report before | 40 | 29–50 | 0.20 | fills its cap: 30 / 40 / 60 give 29 / 34 / 45 |
| report after | 101 | 60–132 | 0.26 | grows with beat index (96 → 156), not with what the beat matters |
| one whole saga (prose only) | 672 | 553–1,005 | 0.28 | cards 224, reports 463 |

**Caps vs output.**
- **Cards ignore their cap.** Cap 70 gives 62 words (89% of the cap). The finale's cap of 90 gives **59** (66%); the maximum ever written is 71.
- **Reports fill theirs.** The after cap grows with how many things the report must show (`storyteller.ts`, `reportPayload`), so a partial (117 words) outgrows a success (101). The size follows bookkeeping, not the story's turn.
- **Card 1 is longer than the finale card in 52 of 72 sagas.** In Sultan the finale intro is short too, but the finale *result* is long. Our finale after runs 128 against 95 for a middle after, only 1.35×.

### 2.2 Cards are forms

Each card sentence was matched against the payload its call received (`calls.jsonl`). A sentence where half or more of its content words come from a single field counts as bookkeeping:

| card | sentences that restate a field |
|---|---|
| card 1 | 455/461 (99%) |
| middle | 552/557 (99%) |
| retry | 116/121 (96%) |
| finale | 398/442 (90%; most of the rest are imperatives) |

Real scene or lore sentences on cards: **about 1 in 1,581.**

**One skeleton** (as the prompt orders: *"Say each fact once … in this order: premise, latest, retry, job, why, trouble, lose … Use only the data."*):
- **Card 1:** *"[Name], a [race trade], needs you"* (60/72) → *"He/She wants…"* (sentence 2 in 50/72) → *"Nobody knows…"* (69/72) → *"…hopes…"* (46/72). It ends on the trouble field in **72/72**.
- **Middle cards:** they open *"You <past verb>…"* (99/99) → *"Now you…"* (85/99) → *"…hopes…"* (80/99) → *"They carry…"* → *"They will…"* (96/99). They end on trouble in 96/99.
- **Retold sentences.** 32% of middle-card sentences (40% of words) were already on screen: the quest log, the previous road row, or the previous summary. Example, `G0_g1/F1_3`:
  - Road row: *"…Selagus Redhand hopes the ledger will show who really troubles the village…"*
  - Next card: *"…Selagus Redhand hopes the ledger will show who truly troubles the village…"*

**Thin spot 1: card 1 as a form.** No one acts, nothing can be pictured, and it ends on a kit list. `G0_g1/F3_3/card_1.md`:
> The elf farmer Eraldil needs you. She wants to keep her farm at Thorncroft and its warhorse safe. Nobody knows why raiders would come for so small a farm. You must win over the goatherd at Hawwick. Eraldil hopes he will say where the raiders gather and which road they will take. He carries a hooked staff and fear.

Compare Sultan law B (the intro opens on a person acting: *"Someone swore…"*, *"A female craftsman … came to your door"*) and law C (the last line aims at the player's want or nerve).

**Thin spot 2: the foe triplet.** `G0_g2/F4_3/card_2.md`: *"It is huge. It has tusks and a foul temper. It will charge anyone who nears the landing."* `G0_g3/F8_2/card_3.md`: *"They carry spears and a barred gate."* The word "carry" appears on 66/99 middle and 49/72 finale cards.

**Thin spot 3: the finale card announces the climax as a foe list.** It never brings back the mystery: the finale call gets latest, job, trouble and names, and nothing else, in 69/72. `G0_g3/F8_2/card_3.md`:
> You have taken the map, and the merchant does not know it is gone. Now you must corner the lizardfolk merchant at the old camp by Nethermere. You must force her to give up her hold on it. Her armed wagon guards stand in your way. They carry spears and a barred gate. They will hold the hollow to the last.

### 2.3 Flat: no voices

| measure | value |
|---|---|
| direct quoted lines, all 267 reports | **12** (in 10 reports) |
| indirect-speech sentences | **238**, in 143/267 reports: about 20 indirect for every direct |
| finale afters built on reported speech | 60–63/72 (88%) |
| speech acts with the words left out (*"whispered a joke"*, *"told it all"*) | 59 sentences in 53 reports |
| the client speaks in a report | 3 of 237 non-personal reports (named in 84) |

**Thin spot 4: the words are left out.** `G0_g2/F7_3/report_4.md`: *"She read aloud the old pact between the wardens and the river folk, word for word."* The pact is never given.

**Good spot 2: the right reveal in the wrong mode.** `G0_g1/F2_1/report_3.md` is a real reveal built from witnesses across the jobs, with a humane motive, but every line of it is indirect: *"Then she said the brother alone knew how to grow the old seed-wheat. She feared the valley would starve without him. She had hidden the paid tally so he would not leave as his sister had."* Voiced, it would be Sultan law G.

**Good spot 1: the only report that does it.** `G0_g2/F4_3/report_4.md` (finale, partial; 3 of the corpus's 12 quoted lines):
> "I forbade her to send word," Muvulrea snarled. "I will not be seen weak." In the hut, her leg lay twisted from a fall. Llemisa knelt beside her, with fresh reed-stalks and linen scraps at the bed. The same lay in the skiff. The music box stood open by the pillow. "It is the only thing that eases her at night," Llemisa said.

The secret is said in its owner's mouth, and objects planted two parts earlier pay off as images.

### 2.4 No lore texture

- A regex for past, custom and legend markers, read by hand, finds 32 sentences in about 5,100 that carry any past or world information. Nearly all of them deliver a clue or the answer (*"He had sold the true one years ago"*).
- Flavour lore that is neither a clue nor the answer: **about 0–3 sentences in 72 sagas.**
- Lore on cards: 1 sentence in 1,581.

**Thin spot 5: the personal saga's past is one flat sentence.** `G0_g1/F2_1/card_1.md`: *"She left him bound to a debt-master."* That is 7 words, with no when, why, or what it cost her, and the whole saga turns on it. This matches the designer's *"i dont even understand whats going on"* (item 0). In Sultan, a character's backstory is the **longest** part type (158–221 words).

### 2.5 Endings and befores

- **Endings.** 91% of afters end on a plain fact or action: *"The casks were full."*, *"Llivas bound his hands."* The prompt asks for this: report.txt *"End on something seen, done or said that shows the change."* A feeling word appears in the last sentence of 24/267.
- **Befores.** 47% contain a watching verb, and 33% end on one: *"Roruld stood close, watching every hand."*
- **Good spot 3: a before that leans.** `G0_g2/F4_3/report_3.md`, 37 words: *"The reeds at Hawholt were trampled flat and the mud was churned deep. … Something huge breathed in the dark ahead, and the horse stamped and pulled at its rope."*

### 2.6 What causes it (input, not the model)

| cause | where | effect |
|---|---|---|
| fixed caps by position, not content | `storyteller.ts`: card `MAX: 70` / finale 90; report `B, A0` by gravity, A grown by the count of things to show | no content-driven variation |
| *"Say each fact once … in this order"* + *"Use only the data"* | `prompts/saga/card.txt` | the 6-sentence skeleton; 99% bookkeeping |
| *"short complete sentences"* | card.txt, report.txt | about 10 words per sentence (Sultan 13–15) |
| *"End on something seen, done or said"* | report.txt | 91% plain endings |
| *"Someone says, shows or finds the secret"* | report.txt (`fixes`) / *"said, seen or found"* | the model takes "said" and reports it indirectly |
| finale card dealt only latest, job, trouble and names | `laterCardPayload` | the climax as a foe list |
| nothing in the payload is a voice or a piece of lore | plan, card and report schemas | none written (L12: permission ⊂ mandate ⊂ dealt mandate) |

---

## 3. Candidate arms for a blind A/B

**Common frame.**
- **One change per arm.** Each arm is the current default (C2, or round E's winner if one ships first) plus one change, in the `PIPE_PARTS` way.
- **Fixtures.** The seed1 fixtures with the same deals: 24 slots × **3 generations** = 72 sagas per arm, Sonnet as lab writer.
- **Judging.**
  - **J3** pairs in both orders against **two incumbent draws** (the noise floor is about ±9 held per 24-slot run, about ±15 held per 3 generations).
  - **S10** absolute (section 4), on every arm and both incumbent draws, in one shuffled batch.
  - J1/J2 (M1, M5, M2) as followability telemetry.
  - `mech.ts` telemetry for each arm: length CV, speech rate, lore count, stamps, cap fill.
- **Pre-register each prediction below** before reading.
- **Win condition.** Followability is the floor (★ 19–20): an arm that loses J3 follow beyond the floor does not ship, whatever its story score.

| arm | one-line change | main question | predicted |
|---|---|---|---|
| **a ROOM** | caps up, nothing else | does "allow" do anything? (the length control) | cards unchanged, reports +40–60% filler; story about ±0; follow − |
| **b WEIGHT** | each part dealt a size **plus the content that fills it** | does Sultan-style variation help at the same total? | length CV 0.11 → ≥ 0.4; total about the same; follow ≥; story + |
| **c VOICE** | one quoted line where a person with a stake speaks | does voice lift story without the script penalty? | card-1 speech 0 → most; finale reveal quoted ≥ 50/72; story +0.5 to 1 |
| **d LORE** | one plan-written local-lore fact, told on card 1, paid off later | does a planted legend make the saga a story? | lore 0 → 1 per saga, payoff in most finales; story +; stamp risk |
| e SCENE (optional) | later cards drop the field order; recap as a clause | do cards stop being forms? | bookkeeping 99% → lower; retold sentences 32% → lower |

### (a) ROOM: simply allow more

- **Writer is given:** identical payloads and prompts. Only the caps change:

  | part | cap now | cap in arm (a) |
  |---|---|---|
  | card | 70 | **110** |
  | finale card | 90 | **140** |
  | before (minor / serious / grave or finale) | 30 / 40 / 60 | **50 / 70 / 100** |
  | after base (A0) | 45 / 90 / 140 | **70 / 135 / 210** |
  | after: per thing shown | +15 | +20 |
  | after ceiling | 140 | 210 |

- **UI:** no change. Report blocks get longer. In the GUI reckoning and quest page that means more scroll; the CLI is the same.
- **Why run it:** it is the cheapest arm, it answers the designer's *"at least ALLOW"* literally, and it is **the length control** for b–d. If (a) gains as much as they do, their effect is length, not content.
- **Prediction (from L12 and the cap-fill data):** cards do not grow (they are field-locked; cap 90 already gives 59). Reports fill to about 80% of the new caps with blow-by-blow action and evidence-inventory waffle (the bench's *"investigate scenes fill spare room"*).
- **Risk:**
  - Readability (M5 rereads, M2) falls as reports lengthen with no new content.
  - No new stock sentences, but existing ones get longer.
  - Fits a cheap model: Luna fills caps the same way.
- **Watch:** words per saga; the share of sentences that carry no dealt fact; M5.

### (b) WEIGHT: length follows what the part does

The Sultan rule as input. A cap alone does nothing on cards, so **every size comes with the content that fills it, or takes content away.** The design keeps the saga total near today's ~670 words: it moves words, it does not add them. If the total grows more than 15%, the arm is partly (a).

**b-E: dealt by the engine (run first).** Sizes come from facts the engine already holds. There is no new plan field; it is deterministic and fixes the class.

| part | engine fact | size | cap | content change |
|---|---|---|---|---|
| card | retry (the job is already told) | light | 35 | as now: retry, job, trouble phrase |
| card | later card, nobody new present in person | light | 45 | as now |
| card | later card where a person with a part is **met in person for the first time** | full | 100 | add `meet: {label/name, traits}` for that one person (the engine cast's traits, e.g. *"short, domineering"*) so the meeting can be shown (cf. At Your Service: *"sharp eyes, wears tattered clothes, and walks with a slight tilt…"*) |
| card | card 1 | standard | 70 | as now |
| card | **finale card** | light | 50 | as now (a short climax intro, as in Sultan) |
| report | failed job, no wound | light | before 25 / after 40 | as now ("nothing happens" stays short) |
| report | failed with a wound, or partial | standard | before 40 / after as now | as now (failure carries a cost story) |
| report | won job | standard | before 40 / after as now | as now |
| report | a person met for the first time is present | full before | before 70 | the same `meet` entry |
| report | **finale** | full | before 60 / after 180, +10 per thing shown beyond 2 | as now (the reveal and the aftermath get the room) |

Gravity no longer sets the before cap in this arm. The show-count growth of the after cap stays.

**b-P: assigned by the plan (second, or in parallel if the budget allows).** Sultan's sizes are authored by someone who knows the story. The plan does know it.
- The plan writes, for each episode, `"weight": "light" | "full"`, and for a full one `"shows": "≤12 words: what this part also shows: a person, a custom, a sight, a turn"`.
- The engine enforces a budget: at most one full middle episode, and the finale report always full.
- `shows` is dealt to that part's card and report as `shows: what this part also shows the player`. Caps follow the b-E table, with weight read from the plan.
- **C1 law:** the plan sees every job and the answer, so it may fix this fact.
- **Cost:** one more plan field, so cut a plan line first (PROMPT_RULES §0).

**For both variants:**
- **UI:** no new element. Card heights vary (a 100-word card is about 9 lines at the quest page's 64ch). The lab keeps one paragraph per text.
  - Sultan's long parts are multi-paragraph (88% at 90–200 words), but the GUI renders card prose as one `<p className="sit">` with no `pre-wrap` (`web/QuestPage.tsx:236`, `web/css/quest.css:136`). A blank line would collapse.
  - So if a full-part arm wins, paragraphing is a follow-up that must ship in GUI and CLI together.
- **Risks:**
  - **Readability of light cards:** 35–45 words must still say what to do and who is in the way. The quest log carries the rest, and 32% of middle-card sentences already repeat it. Watch M1 on light cards.
  - **Stock sentences:** `meet` and `shows` are labelled fields, and a labelled field becomes its own stock sentence (law 6b). That is fine for `meet`, which *should* be one sentence. `shows` turns up at most once a saga.
  - **Cheap-model fit:** good, because the size is dealt as a cap plus fields and never as a rule like "write longer when it matters".

### (c) VOICE: one spoken line at the hinge, never a script

Bench constraints: voiced cards +1; script resolutions −1; chips −16; first-person saga cards break voice. So this arm is **narration with one quoted line**, placed where Sultan places speech: a person with a stake, at the moment it matters, saying a motive, a testimony or a secret. Never instructions.

- **Writer is given:**
  - **Card 1:** a `says` entry: `{who: the asker (personal saga: the soldier), of: their want (personal: their past)}`. Prompt line: *"says: who speaks one line, quoted, in their own words; it carries the feeling, adds no fact."*
    - One owner per fact: the line *replaces* the narrated *"She wants…"* sentence and is not added to it. Card 1 loses one bookkeeping sentence and gains a voice.
    - The content of `of` varies with the plan's want and past, so the line's content varies even if its shape stamps.
  - **Won middle job whose clue comes from a person present** (`people` non-empty, not a sent soldier): `clue` becomes `{fact, said by: <that person>}`. The fact is said in one quoted line (Sultan witness testimony). Otherwise the clue is found or seen, as now.
  - **Finale report:** `answer` gains `told by: <the person in ending>` (always present at the finale by plan rule). The secret comes out as **one quoted line** in their words, built from known; the rest stays prose.
  - **At most one quoted line per text,** two for the finale, which may add the sent soldier's answer (law G).
- **Caps:** +15 words on any text that is dealt a line (card 1 85; afters +15).
- **UI:** quotes sit inline in the prose paragraph. No chips (lost 1:17), no speaker tags. GUI and CLI unchanged.
- **Risks:**
  - **Speech as stage direction** (*"Hold still." "Keep him down."*), the stamp measured in DIALOGUE_AB. Mitigation: lines are dealt only where the content is motive, testimony or a secret, never orders.
  - **The fact recited verbatim inside quotes** (*"The fisher left by choice at night," Gunding said*) reads wooden. Mitigation: card lines say feeling, not fact. The finale line is the secret, which is the point.
  - **Tag stamps** (*"…," she said quietly*), and every card 1 having the same shape. Watch J4 phrasing and `mech.ts` opening and 4-gram stamps.
  - **The speaker invents new facts** (contradictions): the prompt says *"nothing past it"*, as for clues today.
  - **The voice-break class does not apply:** the card stays second-person narration and only the line is first person.
- **Cheap-model fit:** good. One-off voiced cards shipped on Luna. "One quoted line" is a single dealt mandate.
- **Variant c′,** if c's effect is too small: card 1 only, in the shipped one-off `dlg` format (the bearer's whole pitch in first person). DIALOGUE_AB found the voice break only on mid-saga and finale cards, never on beat 1.

### (d) LORE: one planted legend that pays off

The Sultan finding: lore is a **roadmap paid off**, never decoration. One sentence at the turn, hedged as hearsay, type-dependent.

- **Writer is given:**
  - **Plan (new output field):** `"lore": "≤20 words: one thing people here say or do: a custom, a legend, a rule of a place or thing in this story, told as hearsay; a later job or the answer proves it true, false or different"`.
    - Add lore to the existing *"shown before play: never a learn or the answer"* line.
    - The plan sees the answer and the jobs, so the C1 law holds.
  - **Card 1:** `lore: what people say` (+25 on the cap, so 95). Told in the card, typically in place of the kit-list closer, which is the slot where Sultan puts its vector line.
  - **Finale report:** `lore` beside `known`: *"lore: told on the first card; show what it turned out to be"*.
  - **Personal saga:** the lore slot holds the soldier's past, told plainly (item 0 overlap; see below).
- **Caps:** card 1 70 → 95; finale after +20.
- **UI:** in the prose only. Optionally later, the engine could print it in the Known log as *"They say: …"*, but that is a presentation decision for a second step and is not in the arm.
- **Risks:**
  - **The opener stamps** (*"Legend says…"*, *"They say…"*) in every saga: watch J4 and opening stamps. The content varies with the seed keywords.
  - **The lore spoils the answer** (the plan knows it): add the J2 auditor question *"does card 1 give the answer away?"*.
  - **Payoff fails**, leaving decoration: J2 question *"is card 1's lore paid off?"*.
  - **Plan prompt growth:** cut a line first.
  - **Sultan's own rule:** duels and hunts carry no lore. Accept that occasional lore will fit poorly, or let the plan write `"lore": ""` when the story has none, and measure the empty rate.
- **Not recommended, variant d-E:** the engine deals a lore *atom* and the writer invents the fact. The writer cannot see the answer, and the random-keyword lesson applies: an odd atom becomes a detour.

### (e) SCENE (optional, lower priority)

- **Change:** later cards (not card 1) drop *"Say each fact once, in this order"* and *"Use only the data"*. The quest log already prints For, Open question, Known, Held and the road.
- **Target:** the 99% bookkeeping and the 32% retold sentences.
- **Risk:** it is closer to a wording round (★ 8 warns against those), so run it only if b–d leave cards as forms.

### Not proposed, and why

- **Rotating dealt "voice devices"** (hearsay, failed precedent, wry aside). Rotation was measured to make stamps. Variety must come from content (L12).
- **Script-format reports and speaker chips:** both measured worse (DIALOGUE_AB, two designs).
- **More style rules** such as "vary sentence length" or "end on a feeling". About 4 style rules is the cheap-model ceiling, and every wording round so far only moved the stamp.
  - The ending gap (91% plain) is better attacked through (c): a quoted line is a natural last line, and Sultan ends 9% of results on speech.
- **Raising caps on cards alone:** already measured null (cap 90 gives 59).

### Run order, combination and the personal-saga overlap

1. **One round:** a, b-E, c and d, each against two incumbent draws. That is 4 × 72 sagas plus 72 for the second incumbent draw. Score J3 and S10 in one shuffled batch.
2. **Then:**
   - If two or more arms win, test their combination ("Sultan pacing": b + c + d) against the best single arm.
   - If (a) ties b–d on S10, the effect is length: say so and stop.
   - If b-E wins or is promising, test b-P against b-E.
3. **Personal sagas (item 0).** Sultan's longest part type is a character backstory, which is exactly the personal saga's card 1. b-E (full card 1 for personal), c (the soldier speaks of their past) and d (lore slot = the past) all touch it.
   - Run item 0's own arms (past stated plainly, what must change, the change written back to the dossier) on the personal-only fixture set first.
   - Keep personal sagas in this round's fixtures, but report them as a separate row, so the two experiments do not confound.

---

## 4. Judging story quality beyond follow and keep: S10, an anchored absolute score

J3 says which of two versions is better. It cannot say "6 → 7". The designer speaks in absolute scores, so add **S10**: a blind, anchored, whole-saga 1–10 story score, with today's default **fixed at 6 by construction.**

**Unit.** One whole saga as played: every card (quest log, prose and engine lines) and every report, in `order.txt` order. This is the same render J3 reads.

**The scale (frozen before any arm is scored):**

| score | meaning |
|---|---|
| **10** | a story you would retell to a friend. The parts are sized to what they tell, people sound like people, the planted things pay off, and a line sticks tomorrow. |
| **8** | a good story; at least one moment that lands (a voice, a reveal, a custom paid off); small flat stretches allowed |
| **6** | **today's typical saga:** followable and coherent, but it reads as a job log; nothing sticks |
| **4** | hard work: you can follow it, but it is dead, repetitive or bookkeeping |
| **2** | you cannot follow what happened or why |

**Gate.** A saga the reader cannot retell (who wanted what, what happened, why) **cannot score above 5**. This keeps followability the floor (★ 19).

**Anchors.** Take them from seed2's C2 runs, so that every seed1 slot stays unseen.

1. **Ranking pass.** 3 unanchored blind judges score all 48 seed2 C2 sagas on the scale descriptions alone.
2. **The 6 anchors** are the two median-ranked sagas: one hired and one personal. Today's median is therefore 6 by definition, which is the designer's verdict.
3. **The 4 anchor** is the 10th-percentile saga.
4. **The 9 anchor** is a **matched-content rewrite** of one 6 anchor: the same plan, dice, facts and people, rewritten by hand by a separate author agent using section 1 (parts sized to content, the asker's line, the secret in its owner's mouth, one planted custom paid off, endings on a feeling). This is the prosebench A1 method: it isolates craft from content. Freeze it before scoring any arm.
5. **Designer check, one read:** show the designer the 6 anchor and the 9 anchor. *"Is this a 6? Is that a 9?"* This grounds the scale in the designer's taste at the cost of two sagas of reading.
6. **Holdout:** a second matched rewrite of a different saga, expected at 8 or above, mixed in unmarked. A judge who scores it 6 or below is discarded and replaced (as in prosebench).

**Judge output (JSON):**

```json
{"score": 6, "follow_gate": "yes|no", "best_part": 3, "best_line": "quoted line or none",
 "dragged_part": 2, "rushed_part": null, "remember": "a line you'd remember tomorrow, or none",
 "why": "at most 40 words, pointing at the page"}
```

- `dragged_part` and `rushed_part` are the **pacing diagnostic**: did the size of a part match what it told? Arm (b) is judged on these as well as on the score.
- A score of 8 or above, or 4 or below, needs a quoted line (prosebench protocol, rule 4).

**Protocol.**
- Fresh zero-context judges: 2 Opus plus 1 GPT-5 via `judge_gpt.ts`.
- They see the rubric and anchors, then sagas shuffled across all arms and both incumbent draws, with no labels.
- The rubric tells them "length is not quality" (RUBRIC register contract), and arm (a) checks that they obey it.
- Saga score = the median of its judges.

**Statistics and the decision rule.**
- **Effect per arm:** the slot-paired mean of (arm − incumbent), with a bootstrap 95% interval over the 72 slots, reported as an absolute mean ("6.1 → 6.8") plus the share of sagas scoring 8 or above (the "a story" share).
- **Noise floor:** score incumbent draw 2 against draw 1 the same way. S10's generation noise is unknown, so this first round measures it.
- **Pre-register: an arm moves story quality when** its gain beats the incumbent-vs-incumbent spread, it is at least +0.5 on the mean, more than 55% of slots score higher, **and** J3 follow is not lost beyond the floor.
- J3 stays the deciding instrument for followability. S10 decides "better story", and both are needed for the goal (★ 19).

**Mechanical rows beside S10 (`mech.ts`), per arm:**
- per-part length CV
- quoted lines per saga, and finale reveals in direct speech
- flavour lore sentences per saga
- the share of sentences that restate a field
- the share of retold sentences
- opening-sentence and 4-gram stamps across sagas
- cap fill
- J4 repetition on 10-saga series for any arm that ships

---

## 5. Open points for the designer

1. **Very short parts.** b-E deals 35–50-word retry, connective and finale cards (Sultan connective intros run 13–23 words). Is that acceptable to test, given that the quest log stays above the prose?
2. **Paragraphs.** Sultan's long parts are multi-paragraph, but our GUI collapses them. Should we build the paragraph render in GUI and CLI only if a full-part arm wins?
3. **Voice on saga cards.** Arm (c) keeps saga cards in narration with **one** quoted line, which avoids the first-person voice break that kept the `dlg` format off saga cards. Is c′ (a fully voiced card 1) worth a slot too?
4. **Lore.** Should it be plan-written (recommended) or not at all? May the plan write no lore for a story that has none?
5. **The aftermath.** Sultan's longest results are often the denouement (Turning the Millstone, 120–310 words). Our finale report plus the 📖 summary is the only aftermath. b-E gives the finale after room for it. A separate epilogue text would be a new surface, so it is not proposed.

**Files.**
- Sultan sources: `v3/scripts/prosebench/research/sultans_en/config.json.gz`, `rite_conditions.json`, `rite_record.py`.
- Designer ground truth: `v3/scripts/prosebench/REFERENCE_SULTANS_RESULTS.md`, `research/anatomy_sultan_ground_truth.md`.
- Bench history: `v3/scripts/prosebench/DIALOGUE_AB.md`, `RUBRIC.md`, `ANCHORS.md`.
- Our corpus: `v3/scripts/sagalab/runs/seed1/G0_g1..g3/` (`texts.json`, `calls.jsonl`).
- Prompts and caps: `v3/src/ai/prompts/saga/{card,report,plan}.txt`, `v3/src/ai/storyteller.ts` (`firstCardPayload`, `laterCardPayload`, `reportPayload`).
- Judges: `v3/scripts/sagalab/judge/j3_pair.md`, `j4_series.md`.
- The readers' analysis scripts live in the session scratchpad only. The repo is untouched except for this file.
