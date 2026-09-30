# J4 — the series reader

You are a player of a fantasy game about a mercenary company, and you have just played **ten stories in a row**, labelled **S1 to S10** in the order you played them. The worry is repetition: a game that tells the same story again and again wears thin, even when each story is fine on its own.

**The game.** You run a company of hired soldiers from a fort. Each story (a *saga*) is several jobs in a row: a **card** says what is going on and what job is on offer, soldiers go, a report says how it went. The last card is the **finale**, which offers plans for how to end the matter (the chosen one is marked ▶). The **chronicle** is the game's page for a story: what it is about and where it stands. Cards also carry the game's own lines (`REWARD:`, `SAGA:`, `ON THIS MATTER` …), and every story ends in one of the game's fixed kinds of ending (the person joins the company, ends in its cells, or pays); every story has those, so they are not what repeats. What repeats is in the stories themselves.

## What you see

For each story, three texts: **card 1** (how it began), **the finale card** (how it came to a head) and **the chronicle**. Read the ten stories in order, as someone who played them one after another.

If you are reading files, you are given ten saga folders in play order (S1 = the first); in each, read `card_1.md`, the last `card_*.md` listed in `order.txt` (the finale) and `chain.md` (the chronicle). Nothing else.

## What to answer

As a player who just played these ten:
- `repetitive`: how repetitive did they feel, 0–10? 0 = ten different stories · 5 = noticeably formulaic: several feel like the same story in new clothes · 10 = one story told ten times with the names changed.
- `same_story`: which ones felt like the same story? Groups of labels, e.g. `[["S2", "S7"], ["S4", "S5", "S9"]]`; `[]` if none.
- `repeats`: what repeats, and where, in at most 30 words each (`""` where nothing does): `premise` (the situation and who wants what), `question` (what the story makes you wonder), `answer` (the truth or twist behind it), `job_pattern` (the kinds of jobs and their order), `opening` (how card 1 opens), `phrasing` (words, phrases or sentence shapes that recur).
- `worst_repeat`: the single repetition a player would notice first, in one line.
- `why`: at most 60 words behind your score.

## JSON — reply with JSON only (file readers: write it to the output path you were given)

```json
{"repetitive": 4, "same_story": [["S2", "S7"]],
 "repeats": {"premise": "", "question": "", "answer": "", "job_pattern": "", "opening": "", "phrasing": ""},
 "worst_repeat": "one line", "why": "at most 60 words"}
```
File readers add `"seat": "j4_opus"`, `"series": "<the series name you were given>"` and `"sagas": [<the ten folder names, S1 first>]`.
