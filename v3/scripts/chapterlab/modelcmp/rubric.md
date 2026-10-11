# Writer comparison — blind judge rubric

You judge three anonymous writers (A, B, C) on the SAME task. Each item shows the exact prompt a writer got
(system prompt + data) and the three replies. The writers are AI models for a fantasy game about a
mercenary company; the player reads cards (a job offer), sends soldiers, then reads a report of what
happened. The game's top priority: **a player can FOLLOW it after one read** — plain, readable, never a
jumble of random detail. Literary flair is NOT the goal; clear game writing is.

The letters are shuffled per item. Never guess which model wrote what; judge only the text.

For EACH item and EACH of A, B, C:

- `valid`: true if it returned the JSON fields the prompt asked for.
- `breaks`: concrete breaks of THIS prompt's rules, each a few words (e.g. "card over 70 words (84)",
  "names the merchant though no name was given", "a number", "invents that the soldier dies", "pastes the
  data label 'trouble:'", "hurt in data not shown", "outcome says success but data say partial",
  "reveals the answer before the finale"). Count words yourself when a cap looks exceeded. Empty if none.
- by kind:
  - **card_first / card_later / card_finale** (the player reads it, then picks soldiers):
    `follow` = {who_wants_what, what_to_do, who_in_way}, each "yes" | "partial" | "no" — could a player
    say it plainly after ONE read? Strict: a part left vague or needing a reread is "partial".
  - **rep_moved / rep_fail / rep_finale** (the report): `follow` = {what_happened, what_changed}, each
    "yes" | "partial" | "no" — after one read, is it unmistakable what happened in the job and what is
    different now? Also check it matches the data's outcome/result/hurt/cost exactly (breaks if not).
  - **plan** (a hidden story plan; only the `pitch` field, if present, is shown to the player):
    `follow` = {one_story, jobs_follow, answer_works}, each "yes" | "partial" | "no" — do the seed, the
    asker's want, the opponent's want, the jobs and the answer form ONE story where every part has a plain
    reason (one_story)? does each job follow from the last (jobs_follow)? is the answer a real surprise
    that still makes sense once told (answer_works)?
- `read`: 1–10, how well it reads for a player: 10 = reads clean once, like a good game card; 7 = clear
  with a small stumble; 5 = followable with effort, some jumble or filler; 3 = must reread, disjointed;
  1 = unusable. Use the whole scale.
- `rank`: for the item, the letters best → worst, e.g. ["B","A","C"] (followability first, then rule
  breaks, then readability).
- `why`: one short sentence on what decided the rank.

Return JSON only:
{"packet": "<id>", "items": [{"item": 1, "kind": "...", "A": {"valid": true, "breaks": [], "follow": {...}, "read": 7},
 "B": {...}, "C": {...}, "rank": ["A","C","B"], "why": "..."}, ...]}
