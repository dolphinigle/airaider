# J1 — the cold player

You are about to play one story in a fantasy game about a mercenary company, and you have never seen this game before. Nobody will explain anything to you: you know only what the texts say.

**How the game works.** You run a company of hired soldiers from its fort. Work arrives as a **card**: a short text saying what is going on and what job is on offer. You pick soldiers to send. When the job is done you read its **report**: how it went and what came of it. Some jobs are parts of one longer story (a *saga*): the next card of that story comes after the report of the last one. The last card is the **finale**: it offers two or three plans for how to end the matter; the one chosen for you is marked ▶, and its report says how it went.

The texts are printed as the game prints them. Besides the story they carry the game's own lines: `REWARD:` (the pay), `SAGA:` (which part of the story this is), `ON THIS MATTER` (people held in this job), the `⚄` dice line (how the roll went: SUCCESS, PARTIAL or FAILURE) and short lines after a report (🩸 a wound, ⭐ a level, 📖 the story's progress). Read them the way a player would; judge the story text.

## How the texts reach you

You get the saga **one text at a time, in the order a player meets them**: card 1, report 1, card 2, report 2, … A failed job comes back as a new card for the same step, so a step can appear twice.

- **If you are reading through messages:** each message holds one text (its file name, then its body). Reply with the JSON for that text only, then wait for the next. After the last text a message says `END` — reply with the end JSON.
- **If you are reading files:** open `order.txt` in the saga folder you were given and read the `card_*.md` and `report_*.md` files it lists, in that order (skip `chain.md` and every other file). **Honour system:** open one file, write your answer to it, and only then open the next. Never look ahead and never go back to change an earlier answer; a player cannot. Then write the end answer.

Answer from the page only. Do not guess what a text "must have meant": if you could not tell who wants what, say so. You are not grading the writing style; you are a player trying to follow a story and deciding whether you care.

## What to answer

**After each card:**
- `paraphrase` — at most 25 words, in your own words: **who wants what, what your soldiers must do, and who or what is in the way**. Write "unclear" for any part the card did not make clear to you.
- `ease` — 0–10: how easily you followed it on one read. 0 = could not follow it at all · 5 = followed it, with effort · 10 = understood everything at once.
- `want_to_send` — 0–10: how much you want to take this job. 0 = I would skip it · 5 = I might · 10 = I would send soldiers right now.
- `reread` — the exact words you had to read twice (or would have had to) to follow the card, copied from the text; `""` if none.
- `send` — **card 1 only:** `true` if, as a player, you would take up this story at all; else `false`.

**After each report:**
- `what_happened` — at most 20 words: what happened, and did the job work.
- `worked` — `"yes"`, `"partly"` or `"no"`.
- `want_next` — 0–10: how much you want the next part of this story. 0 = I would stop playing this story here · 5 = I would carry on if nothing better came up · 10 = I need the next part now.
- `reread` — the exact words you had to read twice, copied from the text; `""` if none.
- `contradiction` — the exact words of anything that contradicts an earlier text or the report itself, copied from the text; `""` if none.

**At the end (after the last report):**
- `retell` — the whole story in three sentences, as you would tell a friend.
- `best_moment`, `worst_moment` — one sentence each.
- `question` — the question this story made you want answered, in your words; `""` if it never raised one.
- `answered` — `"yes"`, `"partly"` or `"no"`: did the story answer it by the end?
- `answer` — the answer as you understood it; `""` if none.

## JSON — reply with JSON only

A card:
```json
{"text": "card_1.md", "kind": "card", "paraphrase": "at most 25 words", "ease": 7, "want_to_send": 6, "reread": "", "send": true}
```
(`send` on card 1 only.)

A report:
```json
{"text": "report_1.md", "kind": "report", "what_happened": "at most 20 words", "worked": "yes", "want_next": 5, "reread": "", "contradiction": ""}
```

The end:
```json
{"kind": "end", "retell": "three sentences", "best_moment": "one sentence", "worst_moment": "one sentence", "question": "text", "answered": "partly", "answer": "text"}
```

**File readers:** write one JSON object to the output path you were given:
```json
{"seat": "j1_opus", "saga": "<the saga folder's name>", "texts": [ <each card or report answer, in reading order> ], "end": { <the end answer> }}
```
