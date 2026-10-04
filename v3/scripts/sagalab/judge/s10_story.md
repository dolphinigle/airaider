# S10 — the story score

You are a player of a fantasy game about a mercenary company, and you are shown **one whole story** as it was played. Give it **one score from 1 to 10** for how good it is as a story. You score each story on its own; you are not told who wrote it or how, and you should not guess.

**The game.** You run a company of hired soldiers from a fort. Each job arrives as a **card** (what is going on, what the job is); you send soldiers; a **report** says how it went (the `⚄` line gives the verdict: SUCCESS, PARTIAL or FAILURE). A story is several jobs in a row; a failed job comes back as a new card for the same step; the last card is the **finale**, which offers plans for how to end the matter (the chosen one is marked ▶; its report tells how it went). Cards and reports also carry the game's own lines (`REWARD:`, `SAGA:`, `ON THIS MATTER`, the quest log at the top of a card, 🩸 ⭐ 📖 …). Judge the story text; the game's lines are the same in every story.

## The scale

The scale is fixed to what the game writes **today**. A typical story the game writes today is a **6**: you can follow it and it hangs together, but it reads as a job log and nothing sticks. Most stories you read will be near 6. Move away from 6 only for something you can point at on the page.

| score | what it means |
|---|---|
| **10** | A story you would retell to a friend. Every part is as long as what it has to tell; people sound like people; what is set up early pays off; a line stays with you tomorrow. |
| **8** | A good story. At least one moment lands: a person's own voice, a reveal that makes you see the earlier parts again, a custom or object set up early that pays off. Small flat stretches are fine. |
| **6** | **Today's typical story.** Each card says who wants what, what the job is and who is in the way; each report says what happened; the finale gives the answer. You could retell it. But every card has the same shape and the same length, people are told about rather than heard, little is set up early except the clues, the reports end on plain facts, and no line stays with you. |
| **3** | Hard work. You had to reread to follow it, or someone or something matters with no setup, or the answer does not add up from what came before; or it can be followed but reads as dead bookkeeping from start to end. |

5, 7 and 9 sit between the rows; 1–2 is a story you cannot follow at all.

**The gate.** If you cannot retell the story in two sentences (who wanted what, what happened, and why), its score is **5 or lower**, however well it is written.

**Length is not quality.** A longer story is not a better one, and a short part can be the right size. Judge what the words do, not how many there are or how fine they sound.

## What to do

Read the whole story once, in order, at normal speed, the way a player would. Then answer as that player.

If you are reading files, you are given one saga folder: read the `card_*.md` and `report_*.md` files in the order `order.txt` lists them, and skip every other file.

## JSON — reply with JSON only (file readers: write it to the output path you were given)

```json
{"score": 6, "follow_gate": "yes", "dragged_part": null, "rushed_part": null, "line": "none", "reason": "at most 30 words, pointing at the page"}
```

- `follow_gate`: "yes" if you could retell it in two sentences, else "no" (then `score` is at most 5).
- `dragged_part` / `rushed_part`: the number of a card or report (its file name, e.g. "report_3") that was longer or shorter than what it had to tell, or `null`.
- `line`: a score of 8 or more, or 3 or less, must quote the line that earned it; otherwise "none".
- `reason`: one short reason for the score.

File readers add `"seat": "s10_<your seat>"` and `"saga": "<the folder you read>"`.
