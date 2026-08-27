# Can a cheap model be prompted to introduce a stranger? — measured, 2026-08-27

Designer: *"the main thing is that writing should be coherent right… is there a writing guide? and is
this something we can prompt? pls research properly esp. with cheap ai models, experiment by calling
apis directly."*

Harness: `scripts/introlab.ts` (direct `chat.completions` calls, gpt-5-mini @ reasoning low — the
shipped settings), over THREE real captured beat-1 prompts (system + user verbatim as the game sends
them, `beat1-system*.txt` / `beat1-user*.json`).

---

## 1. The principle has a name, and the designer's own sample obeys it

**The known-new contract** (a.k.a. given-new), and its article rule, the **anaphoric chain**: a first
mention takes an INDEFINITE reference, later mentions take definite ones. Readers use definiteness in
real time to predict which referent comes next (Carter et al., *Cognitive Science* 2022; GMU Writing
Center, "Improving Cohesion: The Known/New Contract").

**A proper noun is inherently definite.** So *"Afer Harrow presses a folded letter into your hands"*
tells a first-time reader *"you already know this person"* — and they do not. That is a
presupposition failure, not a style preference.

Sultan's Game, sample 3 in `REFERENCE_SULTANS_RESULTS.md`, which the designer wrote out by hand:

> ***A** female craftsman who calls herself an inventor came to your door…*  → the RESULT then says
> *"Moved by **Mahir's** words…"*

Indefinite on first mention; the name arrives once the player has committed. `GUIDELINE.md` C10
already recorded this and it was not acted on.

---

## 2. Prompting it DOES NOT WORK — measured twice, contradictory

2×2: the RULE (a prompt line stating the contract) × WITHHOLDING the names from the payload.

```
run 1 (n=6/cell)          answered/4    unexplained proper nouns
  V0 baseline                 2.67           2.33
  V1 rule only                2.67           0.83      ← looked like a 64% win
  V2 withhold only            2.33           1.17
  V3 rule + withhold          2.33           1.33

run 2 (n=9/cell, withhold bug fixed, + a WHY arm)
  V0 baseline                 2.44           0.89
  V1 rule only                2.44           1.00      ← the win did not replicate
  V3 rule + withhold          2.44           1.22
  V4 rule + the WHY           2.67           0.78
```

The rule's effect **reversed sign between runs**. At these sample sizes that is noise, and it is
exactly what this project has measured before (`CHEAP_MODEL_PROMPTING` §0 / L18: wording is the
weakest lever; it lost three times and input shaping won once).

**Comprehension never moved.** 2.44-2.67 out of 4 in every arm, including arms whose cards contain no
strange names at all. Removing names does not make a card EXPLAIN anything.

---

## 3. The actual discovery: a third of the card is boilerplate no instruction can remove

Every generated card, every arm, ends with the same two dealt sentences:

> *"Coin as promised, and the pick of whatever the job turns up. Word runs that the one at the heart
> of this would be worth a place on any roster."*

```
                        pay line survived   rumour line survived   mean length
  V0 baseline                 9/9                  9/9                80w
  V1 rule only                9/9                  9/9                83w
  V3 rule + withhold          9/9                  9/9                80w
  V4 rule + the WHY           9/9                  8/9                74w   ← told explicitly to CUT it
```

**36/36 and 35/36.** V4's prompt said *"the rumour is cut"* and the model pasted it anyway, because
both strings are DEALT pre-shaped in the payload (`rewardEnvelope`, `stake`) — and a pre-shaped
string gets pasted whatever the rules say. That is ~25 of ~80 words, a third of the card.

Worse: the rumour line — *"the one at the heart of this"* — refers to a person the card never names
or explains. **The boilerplate is itself an instance of the bug being investigated.**

---

## 4. Why comprehension is stuck at ~2.5/4

Cards with zero strange names still fail. From V3, which reads cleanly:

> *"A local steward came to the fort and pressed a thin wooden box into your hands. She says
> Harrowgate Pass's winter feeder is tended by an unknown keeper and she wants that keeper
> recruited."*

Who hires you: answerable. What the job is: answerable. **Why it matters to anyone: nothing.** The
bible holds `kernel` and every cast member's `want`, and the card is never asked to spend them — nor
does it have the room, because the boilerplate took it.

---

## 5. What follows (proposal, not yet acted on)

Ordered by the lever hierarchy, engine first:

1. **Stop dealing the stake rumour.** Twelve words that name nobody and explain nothing, and no
   prompt rule removes them.
2. **Deal the pay as a CLAUSE, not a sentence** — pre-shaped short, since whatever is dealt gets
   pasted whole.
3. **Withhold the names of people the player has not met**, dealing a designation from the bible's
   `who` instead. Omission, not instruction — `stageBible` already does this for off-stage cast and
   stops one step short.
4. **Deal the client's WANT as a first-class field**, so the freed words have a why to spend on.
5. **Only then** a prompt line, and only as a tiebreaker — not as the mechanism.

Measured with the four-question test already in `introlab.ts`: can a cold reader say who hires them,
what the matter is, why it matters, and why it takes armed strangers. Baseline is **2.44 / 4**.
