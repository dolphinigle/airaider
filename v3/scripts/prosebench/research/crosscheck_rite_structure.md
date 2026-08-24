# Cross-check #3 — how a Sultan's rite is ACTUALLY built (from the game's own config files)
Source: the shipped rite JSON (`liwenhao0427/sultans-game-config`, Chinese verbatim), with the
agent's literal English translation, cross-validated against `[OFFICIAL EN]` lines quoted on the
wiki that matched sentence-for-sentence. Example: rite 5000703, "Canyon of Gales".

## 1. THE SLOT LINE is where "what should I bring?" lives — not the card intro
Each character slot carries its own one-line brief. Verbatim (translated):
- s1 — *"The adventure-loving general — will he come this time?"*
- s2 — *"You need at least 5 Magic to part the storm and shield the party"*
- s3 — *"An archer, for the beasts lying in wait"*
- s4 — *"A quick-witted adventurer, Survival 4 or higher, for all the unexpected dangers"*
- s5 — *"Someone strong enough to endure the storm, Physique 4 or higher"*

**The pattern is: ROLE + THRESHOLD + WHY.** The numeric requirement is stated openly ("Survival 4 or
higher"), and every one ends on the reason it is needed ("for the beasts lying in wait", "to part
the storm and shield the party").

This resolves a confusion in my earlier drafts. The designer's ask — *"a card should make me look at
my roster"* — is not satisfied by the card intro at all. It is satisfied by the SLOT LINES. We render
slots as bare dice fields (`test.attributes`, `favored`, `difficulty`); Sultan's renders them as a
sentence. **Our engine already has every number needed to write these.**
It also reconciles the apparent contradiction in the craft literature: Choice of Games says signal
which stats are tested and the relative difficulty, while Failbetter says never state how hard a
challenge is. Sultan's does both without conflict — the SLOT says what the work demands, the PROSE
never comments on difficulty.

## 2. Success and failure are THE SAME SCENE, diverging at the check
Verbatim pair from the first check (Physique+Combat), translated:

> **Failure** — "Under the protection of [s2.name]'s spell the party charges into the canyon — only
> to find a griffin has nested here, and that you are the meal delivered to its door… [s3.name]
> draws and looses, and is still a step slower than the griffin's talons. In the gap bought by a
> companion being torn apart, the expedition bolts blindly forward…"

> **Success** — "Under the protection of [s2.name]'s spell the party charges into the canyon. A
> griffin has nested here, and you are the meal delivered to its door… [s3.name]'s eye and hand are
> quick: the arrow blinds its left eye, and then Jabal drives a blade through its heart. Now you can
> cross the stinking den of the beast and press on…"

**The opening sentence is identical. The divergence happens at the verb of the assigned character.**
This is the same continuity law as "the result repeats the intro" (`PROMPT_RULES` §11), operating one
level down: the outcome does not re-imagine the scene, it continues it and turns.

Note also: **the failure is not "you failed."** It costs a companion and the party presses on —
Ingold's *"failing-but-not-failed"*, shipped.

## 3. A quest is a SEQUENCE of checks, each with its own scene and its own pair
`settlement_extre[0..3]` = check-1 failure, check-1 success, check-2 success, check-2 failure. Each
check is a small scene of its own. The second check pair:

> **Success** — "…At the critical moment [s4.name] steps forward — [s4.gender] sets [s4.gender] own
> cloak alight and stays behind to hold off the snakes, and the rest of you can only quicken your
> step…"

> **Failure** — "…At the critical moment [s4.name] steps forward, draws a weapon and charges into
> the snakes, pulling their attention onto [s4.gender]self, and the rest of you can only quicken
> your step…"

Both cost something; the failure costs more. Neither is a verdict.

## 4. THE ASSIGNED CHARACTERS ARE THE ACTORS, by name, doing specific things
`[s3.name] draws and looses` · `[s4.name] sets [s4.gender] own cloak alight and stays behind`.
The people you chose do the deeds and pay the prices, named, in the outcome prose. Our resolutions
name the sent party but rarely give them a decisive individual act — this is the empty slot.

## 5. Placeholders are engine-filled and unashamed
`[s2.name]`, `[s4.gender]`. Same pattern as KoDP's `<treasure>` and Battle Brothers' `%employer%`.
Every reference corpus is template-driven.

---
## ACTIONABLE FOR THE DESIGNER
The single best remaining source is **the game's own `StreamingAssets/i18n/en/config.json`**, which
holds official English for all ~1,150 rites and every branch. The agent established it is not
published anywhere (only Chinese source and Spanish/Vietnamese translations are public) — **but it
is sitting in the Steam install folder of anyone who owns the game.** If the designer owns Sultan's
Game, copying that one file makes every translated sample in this study obsolete and gives us the
full official corpus to measure.

---

# THE SCHEMA, read directly from the shipped configs (2026-08-24)
Verified by me against `rite/5000131`, `5000506`, `5000703`, `5000704` on the `master` branch.

A rite carries TWO kinds of result text, and this maps almost exactly onto our engine:

| field | what it is | evidence |
|---|---|---|
| `settlement[]` | **unconditional** result paragraphs — shown whatever the dice do | 5000506 has 7 of these and ZERO dice conditions (a rite that cannot fail); 5000704 has 5 |
| `settlement_extre[]` | **conditional** branches, each with a `condition` and its own `result_text` | 5000703 has 8, gated by 12 dice conditions |

**This settles the "is the pre-roll beat real?" question.** A research agent, reading a review site's
account of the UI, suggested the moment between card and dice is stat-surfacing rather than authored
prose — i.e. that our pre-roll text has no ground truth. **That is wrong.** The unconditional
`settlement` array IS the authored always-shown beat, and the designer's transcription
(*"RESULT: (repeat the before, then) … ROLL … SUCCESS:"*) maps onto it exactly:
`settlement` = the paragraph you always read · `settlement_extre` = the branch the dice select.

**The dice condition names the SLOTS, not the party.** Verbatim from 5000703:
`"r2:s1.体魄+s1.战斗+s3.体魄+s3.战斗+s6.体魄+s6.战斗<":[1,5]` — "roll 2: Physique+Combat of the
characters in slots 1, 3 and 6; fewer than 1 success out of 5 dice." The developers even annotate
each branch in-line: `//射杀狮鹫失败` ("failed to shoot the griffin").
So the check is composed from **who the player put in which slot** — the same shape as our
`test.attributes` over assigned mercs — and the prose branch is written against that specific
failure, which is why the outcome can name what went wrong so precisely.

**Consequence for our resolver:** a Sultan quest is not one card plus one outcome. It is
[unconditional beat] + [a SEQUENCE of checks, each with its own written failure and success], and the
branch prose is authored against the specific check that failed. Our engine already rolls per slot;
we currently collapse everything into one resolution paragraph.
