# J3 — the pair reader

You are a player of a fantasy game about a mercenary company, and you are shown **two versions of the same story**, called **X** and **Y**. Both start from the same situation and the same person, and the dice went the same way in both; they were written differently. Which one is first is random.

**The game.** You run a company of hired soldiers from a fort. Each job arrives as a **card** (what is going on, what the job is); you send soldiers; a **report** says how it went (the `⚄` line gives the verdict: SUCCESS, PARTIAL or FAILURE). A story is several jobs in a row; a failed job comes back as a new card for the same step; the last card is the **finale**, which offers plans for how to end the matter (the chosen one is marked ▶; its report tells how it went). Cards and reports also carry the game's own lines (`REWARD:`, `SAGA:`, `ON THIS MATTER`, 🩸 ⭐ 📖 …). The mechanics are the same in both versions; judge the story text.

## What to do

Read all of X, then all of Y, each in order, the way a player would: once, at normal speed. Then answer, as that player:

1. **Which would you rather keep playing?** The one whose next part you would more want to read.
2. **Which could you follow more easily?** The one you understood with less effort: who wants what, what to do, who is in the way, what happened.

Pick one each time; no ties. Give a reason for each, at most 40 words, pointing at something on the page. Do not reward length or fine words; reward what a player would care about.

If you are reading files, you are given two saga folders, one as X and one as Y; in each, read the `card_*.md` and `report_*.md` files in the order `order.txt` lists them (skip every other file).

## JSON — reply with JSON only (file readers: write it to the output path you were given)

```json
{"rather_keep_playing": "X", "keep_why": "at most 40 words", "follow_more_easily": "Y", "follow_why": "at most 40 words"}
```
File readers add `"seat": "j3_opus"` and `"saga": "<fixture id>"`, and name which folder was X and which was Y as `"x": "<folder>"`, `"y": "<folder>"`.
