# Sultan's Game — RESULT texts (designer-supplied, 2026-08-24). VERBATIM, do not edit.

Supplied by the designer after the wiki proved to hold mechanics only. These are the reference for
the long text you get AFTER assigning units. Transcribed exactly as given (typos included).

---

## Sample 1 — "Managing the Estate" (designer notes: this is a SHORTER quest)

**Intro:**
> People are still willing to come under your roof and share words, promises, and opporunities.

**RESULT (before the roll):**
> People are still willing to come under your roof and share words, promises, and opporunities.
> A nod, a word shared, a handshake. Nobles need not labor to make a living...

*(ROLL WISDOM AND CHARISMA HERE)*

**Success:**
> The clicking of coins make you smile, but then you start to worry how long this kind of life will last.

*(get gold)*

---

# Observations (sample 1 — provisional, more samples pending)

1. **The result REUSES the intro line verbatim as its own first sentence, then continues past it.**
   The card text is not consumed and discarded; it is the opening of the scene. We currently write
   the situation and the resolution as two unrelated pieces of prose.
2. **The pre-roll text is a fragment stack**: "A nod, a word shared, a handshake." Three noun
   fragments, no finite verb. ⚠️ This is precisely the construction our `PROMPT_RULES.md` §7
   FORBIDS ("not telegraphic fragment-stacks — 'Grey morning. Mud. A man.'"). The reference uses it
   as the rhythm carrying the montage of a whole week's work. Worth a designer ruling: the rule may
   be banning a device the goal text depends on.
3. **It closes on an aphorism trailing into the roll**: "Nobles need not labor to make a living..."
   — a worldly observation with an ellipsis, handing off to the dice. The pre-roll text's job is to
   set the scene and then LEAN, not to resolve anything.
4. **The success text is an image plus an emotional TURN, and the turn is a shadow.**
   sensory detail (coins clicking) → immediate feeling (you smile) → **but** → a fear about the
   future (how long can this last). **The win is undercut in the same sentence that grants it.**
   This is the single most transferable craft note so far: a success that is purely good reads flat;
   the reference makes every gain carry its own worry.
5. **No numbers, no amounts in the prose.** The mechanical grant is separate — "(get gold)". This
   MATCHES our design (grant line outside the prose) and confirms it.
6. **Very short.** The success text is 20 words — consistent with the measured settlement median of
   ~51 Spanish words across 3,639 settlements, with the p25 at 22.
7. **Second person, present-tense-ish narration to the player** ("you smile", "you start to worry").
   NOTE: not directly portable — in Sultan's the player IS the protagonist. In our game the boss
   stays at the fort and the sent soldiers act, so our resolutions are third person by design
   (`RESOLVE_HEAD_FRAME`). The transferable part is the emotional turn, not the person.

---

## Sample 2 — "Divine Stallion" (a LONG one; designer's own caveat recorded below)

**Intro:**
> Someone swore that they had seen a pure black horse in the wilds east of the city. It was elegant
> and slender, with stain-like hair that shone as it ran, seeming to fly with the wind despite
> lacking wings. Many hunters tried to track it down and tame it, but they all returned
> empty-handed.

**RESULT** — *(repeats the intro verbatim, then continues)*:
> Following the hunter's guidance, you lay in ambush for several days and finally saw it. The pure
> black stallion stepped into the shallow ripples of the oasis under the enchanting moonlight, its
> fur shimmering as though it held a light. Seemingly catching your scent, it raised its head and
> looked towards your hiding spot. You almost dared not breathe as it gazed out at you from afar.
> "They say the divine steed chooses its own master." Your guide's voice drops to a whisper. "Many
> have tried to capture it. All have failed."
>
> Something stirs within Zephyr, and slowly he rises to his feet, his eyes fix on the horse, a
> creature not of this worlds. He opens his arms to it.

*(ROLL SURVIVAL AND DEX)*

**Success:**
> The stallion steps gingerly, seeming hesitant. However, it soons snorts and approaches you. The
> shimmering light reflects in the water, creating a path of scattered brightness behind it. It
> lowers its head gently as it reaches you. You touch its warm forehead, feeling as though you've
> touched the generous gift of a deity.

**⚠️ DESIGNER'S CAVEAT (recorded, do not lose):** *"this is a rather hard to read one compared to the
rest."* So this sample is a STRUCTURE reference, NOT a style target. Given the standing ruling that
readability outranks everything, do not imitate its sentence craft: the participial pileups ("its
fur shimmering as though it held a light"), the stacked subordination, and the abstract closing
simile are what make it heavy.

---

# THE STRUCTURAL LAW (2 samples for 2 — this is the shape, and it is implementable)

**RESULT = [the intro text, repeated VERBATIM] → [approach, time compressed] → [a SPOKEN line that
echoes the intro's hook] → [the SENT CHARACTER, by name, commits] → ROLL → [outcome beats, ending on
a feeling rather than a fact].**

Confirmed in both samples: **the result opens by repeating the card's own intro word for word and
then continues past it.** We currently generate situation and resolution as two unrelated pieces of
prose. Implication for our engine: the RESOLVER should receive the card text and continue it, not
re-imagine the scene.

Other transferable notes from sample 2:
1. **The intro's hook returns as SPEECH at the pivotal moment.** The intro's "many hunters tried…
   all returned empty-handed" comes back as the guide's whispered "Many have tried to capture it.
   All have failed." The card plants it; the result pays it off in a voice.
2. **The pre-roll text ends ON the sent soldier committing to the act** — named, in his own
   paragraph, right before the dice. This is exactly the slot our resolutions leave empty. It also
   gives the assigned character a reason to matter beyond their dice.
3. **The intro's last sentence is a FAILED PRECEDENT** — "many tried, all returned empty-handed."
   That is a difficulty signal and a dare in one, aimed at the player's decision (the same device as
   the Fort of Chains setup-closers in anchor B1).
4. **Tonal, not universal, endings.** Sample 1 undercuts its win with a worry; sample 2 ends on
   wonder. The rule is that the last line delivers a FEELING, not that the feeling is always a
   shadow.
5. **Intro length scales with stakes**: sample 1's intro is one sentence, sample 2's is ~55 words.
   Consistent with the measured spread (median 24, p90 60).

---

## Sample 3 — "Project Investment" (designer: from a story WITH GENESIS — i.e. a saga beat, not a one-off)

**Intro:**
> A female craftsman who calls herself an inventor came to your door, eagerly and enigmatically
> intorduction you to hear latest research project. She assured you that the development had reached
> its final stage and that she just neede a little more sponsorship to complete this unprecented
> great invention - an instrument capable of unveiling secrets beyond the starry sky.

**RESULT** — *(repeats the intro, then continues)*:
> Moved by Mahir's words, you give her a significant Sponsorship. The mysteries of the firmament,
> the celestial abode of the divine... you aspire, you crave, you anxiously await the day Mahir
> completes her Work.

*(ROLL INT)*

**Success:**
> Mahir has completed the project. She shows you a complex and mangificnat instrument, with
> intricate patterns conformoingn to some natural logic and rhythm. Through the lens, you peer into
> the distant starry sky, the timeless gleam of faraway starts captured in your eyes, while Mahir's
> excited voice echoed in your ears.
>
> "I knew it... You know, I always felt that we are all governed by a force, just like these starts
> moving in definite trajectories. I want to disocver the laws governing that force, governing
> eerything. That is my dream".
>
> "I think people call that force 'God'", you reply instinctively. THe real m of God is quietly
> shedding its evil of mystery. Now you have glemated it. In the future, you will reach it.

---

# CONSOLIDATED LAWS — 3 samples for 3

## A. The result CONTINUES the card; it does not restate the situation in new words
**3/3.** Every result opens with the intro repeated VERBATIM and then writes on past it. Our engine
generates the two independently, so our resolver re-imagines a scene the player has already read.
→ Give the resolver the card text and have it CONTINUE.

## B. The intro opens on a PERSON DOING SOMETHING
**3/3** (`Someone swore…`, `A female craftsman … came to your door`, `People are still willing to
come…`). Never on an object sitting in a place. Our P26 rule 1 mandates the opposite and produced
18/18 scenery openers.

## C. The intro's LAST sentence is a vector at the player's want or nerve
- sample 1: an aphorism about the life ("Nobles need not labor to make a living...")
- sample 2: a failed precedent / dare ("Many hunters tried… all returned empty-handed")
- sample 3: the promise itself ("an instrument capable of unveiling secrets beyond the starry sky")
Same device as anchor B1's Fort of Chains setup-closers. **Not** a cost accounting — none of the
three intros says what the trouble costs anybody.

## D. The pre-roll text ends on a LEAN, never on a resolution
- sample 1: aphorism trailing on an ellipsis
- sample 2: the sent character rises and opens his arms
- sample 3: a tricolon of craving ("you aspire, you crave, you anxiously await")
The text leans into the dice and stops.

## E. Anonymity on the CARD, the NAME in the RESULT
Sample 3's card says "a female craftsman who calls herself an inventor"; the result calls her Mahir
throughout. This CONFIRMS our existing anonymity-by-omission rule and tells us where the name is
supposed to land — the resolver names them at the moment they matter.

## F. The success text ends on a FEELING or a FORWARD POINT, never on a fact
- sample 1: a worry that undercuts the win
- sample 2: wonder ("the generous gift of a deity")
- sample 3: a promise of more ("Now you have glimpsed it. In the future, you will reach it.")
Tonal, not formulaic. Sample 3's forward-point is a chain hook — the saga's next beat pre-sold.

## G. Character revelation happens in SPEECH, inside the success text
Sample 3: Mahir states her dream in her own voice, and the player answers her. Two paragraphs, two
voices. This is where the person becomes a person — not on the card.
For us: the boss is not there, so the answering line belongs to the SENT SOLDIER.

## H. No numbers in the prose; the grant is separate ("get gold"). Matches our design.

## STILL MISSING: a FAILURE result.
Three successes, no loss. Failure prose is historically our weakest class, and laws D/F above are
derived only from wins.

---

## Sample 4 — "Major Construction" (NO ROLLS — a pure-requirement quest)

**Intro:**
> First you need the funds, then you need a legendary architect, or the Sultan will get bored before
> you even finish it.

*(NO ROLLS)*

**Result:**
> This is a miracle, a miracle of money and manpower, this architectural wonder wa created in just 7
> days.

*(receive WONDER card as quest result)*

**DESIGNER'S NOTE (important, applies to ALL samples):** *"all of their quests also give matching
rewards."*

---

# TWO MORE LAWS FROM SAMPLE 4

## I. The intro may state the SLOT REQUIREMENTS as prose, in voice
"First you need the funds, then you need a legendary architect" IS the card's requirement list,
written as someone talking. Then the consequence clause — "or the Sultan will get bored before you
even finish it" — supplies the stake and the wry tone in the same breath.
**This is the mechanism the designer asked for earlier**: *"a card should make me look at my
roster."* Our cards never say what to bring; the `ask` dice fields carry it invisibly and the prose
never points at it. Sultan's says it out loud, in character, and it costs one clause.

## J. The reward IS a named thing from the fiction, and it re-enters play
WONDER card here; the Little Crocodile from Sewer Crocodile (which then enables the "Crocodile Pond"
ritual); Mahir's instrument. The prize is the story object, not a generic payout.
Ours are `coin`, `salvage-rights`, `a recruit` — categories, not things. Note the live tension: our
`rewardItems` are **deliberately withheld from the card writer** (game.ts, lab batches C-I: every
framing of "the company keeps X" bred possession contradictions). Sultan's shows that naming the
prize is exactly what makes the quest want doing — so the omission may be costing us the pull it was
protecting us from. **DESIGNER RULING NEEDED**; do not act on this unilaterally.

## Also note: not every quest rolls dice.
"Major Construction" resolves on requirements alone. Our engine always rolls. Out of scope for the
prose work, recorded because it shapes how their cards read (a card can be a pure shopping list with
a joke attached).
