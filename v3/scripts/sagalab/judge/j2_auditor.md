# J2 — the auditor

You audit one saga from a fantasy game about a mercenary company, and the answers two cold readers gave while playing it. You see everything the players did not: the story's hidden plan. Your job is to check facts, not to judge taste.

**The game.** The player runs a company of hired soldiers from a fort. Each job arrives as a **card** (what is going on, what the job is); the player sends soldiers; a **report** says how it went (the `⚄` line gives the verdict: SUCCESS, PARTIAL or FAILURE). A saga is several jobs in a row; a failed job comes back as a new card for the same step; the last card is the **finale**, which offers plans for how to end the matter (the chosen one is marked ▶; its report tells how it went). Cards and reports also carry the game's own lines (`REWARD:`, `SAGA:`, `ON THIS MATTER`, 🩸 ⭐ 📖 …); they are not story prose.

## What you are given

- **The saga folder:** `order.txt` (the reading order), the texts `card_1.md`, `report_1.md`, `card_2.md`, … and `chain.md` (the game's chronicle page), and `plan.json`: the story's hidden design and the lab's settings. Today's storyteller keeps a hidden "bible" under `chain.bible` (title, kernel, cast with roles, situation, goal, arc steps, twist, tensions); a newer one keeps a question, an answer and episodes. Use whatever the plan holds. The `fixture` block is the lab's setting (which outcomes were forced), not story.
- **The readers' answers:** one JSON file per reader seat (for example `j1_gpt5`, `j1_opus`). Each has one answer per text in reading order (a card: `paraphrase` of who wants what, what to do, who is in the way; a report: `what_happened`, `worked`) and an `end` block (`retell`, `question`, `answered`, `answer`). Key your grades by the seat names you were given.

Read the plan first, then the texts in order, then the answers.

## What to decide

**Each card:**
- `paraphrase_right`, per seat: three yes/no grades of that seat's paraphrase: `who_wants_what`, `what_to_do`, `who_in_way`. Right means it matches what the card says and the plan intends. If the card itself never says a part, a paraphrase that says "unclear" or "no one" for it is right, and one that invents an answer is wrong.
- `job_type`: what the soldiers are sent to do, one of `fight` (fight armed people) · `guard` (hold a place against an attack) · `catch` (chase someone down) · `hunt` (track a beast) · `sneak` (get in and out unseen) · `free` (break someone out) · `find` (track down a person or hiding place) · `talk` (win someone over) · `escort` (bring someone through danger) · `showdown` (the finale) · `paperwork` · `other`.
- `paperwork`: `true` when the job's point is getting, delivering, reading or proving a document, record, letter, seal, deed, map or testimony.
- `unmet_names`: every person the card names although the player has no way to know them yet: not the one who brings the job or asks for help, not one of the company's own soldiers, and not someone an earlier **report** already named. `[]` if none.
- `spoiler`: the exact words that give away what the plan keeps hidden until later (the twist or hidden truth before the finale, the result of a later job); `""` if none.
- `engine_speak`: exact words where the prose talks like game machinery or like instructions to a writer ("the hire", "this step", "beat", "the company's keeping", a pay sum pasted into the story). `[]` if none.
- `part_word_labels`: exact words where a person is called only by a bare story-part word ("the client", "the ally", "the obstacle", "the quarry", "the rival"). `[]` if none.

**Each report:**
- `j1_right`, per seat: `outcome` (the seat's `worked` matches the verdict and the text) and `change` (its `what_happened` gets right what actually changed).
- `spoiler`, `engine_speak`, `part_word_labels`: as for cards.

**The whole saga:**
- `retell`, per seat: three yes/no grades of the seat's `end.retell`: `ask` (what the company was asked to do), `answer` (the truth behind the story's question, or how it came out), `ending` (what became of the person or matter the finale decided).
- `question`: the central thing card 1 makes a player want to know, in one line (derive it from card 1 and the plan).
- `question_category`: one of `who-did-it` · `why` · `where-is` · `in-time` (can someone be saved or stopped in time) · `trust` (who is on whose side) · `what-is-it` · `the-past` · `none` · `other`.
- `answer`: the truth that settles the question, per the plan and the finale report, in one line.
- `answer_category`: one of `hidden-reason` · `hidden-person` · `bond` (kin or love) · `lie` (a betrayal or deceit) · `debt` (a debt, bargain or oath) · `thing-or-place` · `none` (no answer beyond the obvious) · `other`.
- `question_answered`: `true` if, by the last report, the texts bring the answer out plainly enough for a player to state it.
- `answer_guessable_from_card1`: `true` if a player could have guessed the answer from card 1 alone.
- `continuity_errors`: every place a text contradicts an earlier text, itself, or the plan's facts as the player was shown them (a person in two places, a thing won and then still missing, a dead man talking), each as `{"text": file, "quote": exact words, "why": one line}`. `[]` if none.
- `notes`: at most 60 words on what most helps or hurts a player following this saga.

## JSON — write one object, JSON only, to the output path you were given

```json
{
  "seat": "j2_opus",
  "saga": "A01",
  "cards": [
    {"text": "card_1.md",
     "paraphrase_right": {"j1_gpt5": {"who_wants_what": true, "what_to_do": true, "who_in_way": false},
                          "j1_opus": {"who_wants_what": true, "what_to_do": true, "who_in_way": true}},
     "job_type": "find", "paperwork": false,
     "unmet_names": [], "spoiler": "", "engine_speak": [], "part_word_labels": []}
  ],
  "reports": [
    {"text": "report_1.md",
     "j1_right": {"j1_gpt5": {"outcome": true, "change": true}, "j1_opus": {"outcome": true, "change": false}},
     "spoiler": "", "engine_speak": [], "part_word_labels": []}
  ],
  "retell": {"j1_gpt5": {"ask": true, "answer": false, "ending": true}, "j1_opus": {"ask": true, "answer": true, "ending": true}},
  "question": "one line", "question_category": "why",
  "answer": "one line", "answer_category": "hidden-reason",
  "question_answered": true, "answer_guessable_from_card1": false,
  "continuity_errors": [{"text": "report_2.md", "quote": "exact words", "why": "one line"}],
  "notes": "at most 60 words"
}
```
One entry per card and per report, in reading order.
