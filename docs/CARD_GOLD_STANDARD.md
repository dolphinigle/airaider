# ⛳ THE GOLD STANDARD — what a saga's FIRST card must be

**Status: the target, drafted 2026-08-27.** Everything in the intro-coherence work is measured
against this page. If an iteration does not move a card toward it, the iteration failed.

---

## THE GOAL, in one sentence

> **A player who knows nothing must finish the first card of a saga knowing who wants something,
> what they want, why it matters, why it takes hired steel — and wanting to find out the rest.**

The last clause matters as much as the first four. A card that is merely legible is not the goal.

---

## THE GOLD STANDARD (the designer's own, `REFERENCE_SULTANS_RESULTS.md` sample 3)

Written out by hand by the designer, from a story WITH genesis — i.e. our beat 1:

> *A female craftsman who calls herself an inventor came to your door, eagerly and enigmatically
> introducing you to her latest research project. She assured you that the development had reached
> its final stage and that she just needed a little more sponsorship to complete this unprecedented
> great invention — an instrument capable of unveiling secrets beyond the starry sky.*

**Read what it does, clause by clause:**

| clause | what it is doing |
|---|---|
| *"A female craftsman who calls herself an inventor"* | first mention, **indefinite** — a stranger is introduced as a stranger. `who calls herself` is a whole characterisation in three words: she has a claim about herself others may not grant. |
| *"came to your door"* | she acts, and she acts **on you**. The player is in the scene. |
| *"eagerly and enigmatically"* | her manner IS the hook — something is being withheld, and the card says so. |
| *"reached its final stage… a little more sponsorship"* | the ask, and why it is small. |
| *"an instrument capable of unveiling secrets beyond the starry sky"* | the **last sentence is a vector at the player's want**, not a cost accounting. |

**And she is never named.** The name arrives in the RESULT — *"Moved by Mahir's words…"* — once the
player has committed. `GUIDELINE.md` C10.

Two more from the same corpus, same shape:

> *Someone swore that they had seen a pure black horse in the wilds east of the city… many hunters
> tried to tame it, but they all returned empty-handed.*

> *A woman dressed as a warrior blocks your doorway, aggressively demanding an explanation.*

---

## THE SEVEN PROPERTIES (each one testable)

1. **Opens on a person doing something, inside the first seven words.** Measured 84% in KoDP/Six
   Ages, 59% across Sultan. Never on an object sitting in a place.
2. **Every first mention is INDEFINITE.** *"A female craftsman…"*, *"A woman dressed as a warrior"*,
   *"Someone swore…"*. A proper noun is a definite reference and presupposes acquaintance the reader
   does not have (the known-new contract — see `prosebench/INTRO_COHERENCE.md` §1).
3. **Nobody the player has not met is NAMED.** Names arrive in the resolution, when the company
   reaches them. This is the one-off anonymity ruling extended to sagas.
4. **The person is placed by their RELATION to the matter and to you** — never a bare category.
   *"A servant of theirs, who had worked for over twenty years"* (PROMPT_RULES §12), not *"a
   servant"*.
5. **Something is visibly WITHHELD, and the card says so.** *"eagerly and enigmatically"*, *"what is
   left unspoken is this"*, *"they do not know what she wants"*. The reader must be able to tell the
   difference between a secret and an omission. Our failure mode is that they cannot.
6. **The last sentence is a vector at the player's want or nerve** — a prize, a dare, a failed
   precedent. Never a cost accounting, never a rumour about a person the card never named.
7. **45–70 words**, 2–4 sentences. Sultan's character intros sit in this band without exception.

---

## THE TEST (run it on every iteration)

A zero-context reader is shown ONLY the card and asked four questions. Baseline today: **2.44 / 4**.

- **hirer** — can you say who is hiring, well enough to picture them?
- **matter** — can you say what the job is actually about?
- **why** — can you say why it matters to anyone?
- **steel** — can you say why it needs armed strangers rather than a servant?

Plus two counts: **unexplained proper nouns** (target 0) and **length** (target 45–70).

Harness: `v3/scripts/introlab.ts`.

---

## THE WORKED TARGET, for a bible we actually generated

`chain-69 "The Wheel's Bargain"` — the saga live in the designer's game. Its genesis holds:

```
client    a retired border reeve who kept watch on the forest road
          wants: the healer handed alive at the Tainted Wheel
quarry    a wandering healer who murmurs old phrases and will not stay in town
          wants: to stay free and avoid the Tainted Wheel
obstacle  a wheel-keeper who tends the old stone wheel   (NOT met — stays off this card)
twist     the man whose living presence anchored the forest truce is dead   (must not leak)
step 1    reach the keeper at Wheelstead, using the reeve's letter
```

**What shipped** (2.44/4 — you cannot say who anyone is):

> *Afer Harrow presses a folded letter into your hands and asks you to take it to Wheelstead. He says
> the keeper there will admit anyone bearing Afer's seal. Afer's voice cracks when he begs that
> Fitellus be brought alive. Pay stands as agreed, and what the company hauls back is its own to
> keep. They say the one at the heart of this would fetch a ransom worth a season of contracts.*

**The target** (all seven properties, 71 words):

> *A border reeve, too old now to walk the road he spent his life watching, presses a sealed letter
> into your hands. He wants a wandering healer brought to the old stone wheel alive — and will not
> say what the wheel is for. The healer keeps to no town and will not come for the asking. The
> reeve's seal opens a gate upriver, where the keeper is said to know where the healer last slept.*

- opens on a person acting on you, in five words ✔
- *"A border reeve"* — indefinite first mention ✔ · no names at all ✔
- *"too old now to walk the road he spent his life watching"* — relation, not category ✔
- *"will not say what the wheel is for"* — the withholding is named ✔
- last sentence points at where to start, not at a rumour ✔
- 71 words ✔

---

## WHAT WOULD MAKE THIS FAIL

Written down so the iteration cannot quietly drift:

- **A cheap-model win that does not replicate.** Two runs, or it did not happen.
- **A gain in "no strange names" with comprehension flat.** Measured twice already; removing names is
  not the goal, being understood is.
- **Prose that scores 4/4 and reads like a form.** The seventh property is not measured by the four
  questions — read the cards.
- **Losing the saga.** The card must still perform its ONE arc step and leak no twist.
