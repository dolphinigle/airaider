# What reading the corpus IN FULL showed (2026-08-24)

## ⚠ FIRST: my published corpus numbers were CONTAMINATED
A full read of the non-job half found that **~21% of the corpus teaches nothing**: 86 cards share
ONE identical sentence (*"Reading can improve yourself, so develop a habit of reading."* — every
book in the game gets it), plus ~24 stubs and UI labels (*"Abandoned"* ×5, *"This is where Attire is
sold"*, *"An Extremely Difficult Boss Battle"*). Any statistic computed over the raw corpus — mine
included — is wrong.

**Corrected, with boilerplate and stubs removed:**
| set | n | words median | p25-p75 | p90 | ≤2 sentences |
|---|---|---|---|---|---|
| all rite intros (contaminated) | 1485 | 23.0 | 13-36 | 57 | 70% |
| all rite intros (CLEAN) | 1282 | **25.0** | 17-39 | 60 | 67% |
| job-like (CLEAN) | 363 | **29.0** | 20-47 | 65 | 58% |
| **stranger-jobs (CLEAN) — our analogue** | **165** | **25.0** | **18-39** | 54 | **60%** |

The shift is modest (23 → 25) but the principle is not: **exclude boilerplate before measuring a
corpus.** The design lesson underneath is sharper — *the game puts ZERO flavour on items whose NAME
already carries it* (Forty-Seven Elegant Poses, Scroll of Worms) and spends its word budget only
where a decision happens.

## THE DIVISION OF LABOUR — the most important structural fact found
**Only 18 of 429 non-job cards mention game mechanics at all.** The requirements live in the sibling
`cards_slot_s<n>_text` keys, never in the body. **Body = fiction. Slot = contract.**
And the slot labels are sometimes the better writing:
> *"Only those bound by fate may pass through your door"* (×7)
> *"Your rationality can help, if you possess it"* (×15)
> *"It only costs 3 Gold Coins. No use to spend more."*
> *"Can the mirror-born ever understand human?"* (×18)
Anyone imitating this corpus by reading only the bodies misses half the design. We currently write
only bodies.

## THE LINE THAT SEPARATES LIVE CARDS FROM DEAD ONES
**Nearly every assignment card names a REASON, not just a task** — and the reader of all 530 cards
identified the bare-task ones as "the dead ones":
> *"Sadani said that on the day the Sultan visited her, several crucial details were omitted from
> the Sultan's daily logs. **These errors could be the death of her unborn child.**"*
versus the dead register: *"According to the regicide plot, gather all the prerequisites."*

## THE SIGNATURE CLOSER: the sting / reversal
The last clause deflates or contradicts everything before it. ~25 cards, and it is what makes the
good ones good:
> *"Anyone who's ever killed a man knows that it's easy to kill a man and hard to dump his body.
> **Alas, for you, that is no problem at all.**"*
> *"Finally, the curse gradually lost power over time. **Turns out it was single-use — thankfully it
> was single-use.**"*
> *"…the Purist Order invites a faithful person of your reputation to guard the Sacred Light Source.
> **What a fortunate situation — like a mouse falling into a rice bin!**"*

## SIX REGISTERS, VARYING BY SUBJECT FAMILY — not one voice
dry-blunt operational (the default for errands) · wry/sardonic (domestic, merchants, pets) ·
**cruel-flippant** (atrocity in the register of an inconvenience — the corpus's most distinctive
move) · grand/lyrical (gods, ruins, temples) · crude/leering (narrow, clusters in one location) ·
bureaucratic-absurdist (procedure applied to horror). **Register does not vary with length**: a
9-word card can be lyrical, a 75-word card entirely wry.

## LENGTH IS NOT CORRELATED WITH IMPORTANCE
The card opening a major questline runs 146 words. The card carrying the emotional peak of the
wife's arc is **eight**: *"One evening, you didn't see Maggie at home."*

## WHAT WOULD MISLEAD AN IMITATOR (recorded so we do not)
- `[xiaochou.name]` / `[player.name]` are runtime placeholders, not names.
- The 86-card boilerplate block and ~24 stubs are cut content and UI chrome, not craft.
- Two large families (the Mirror, 46 cards; Battle of the Mind, 16) are ONE sentence stamped 15+
  times with a swapped noun — they make the corpus look either more repetitive or more varied than
  it is, depending which way you sample.
- Proper nouns from this game's ruleset ("break a Bloodshed Card") carry meaning we cannot borrow.
  **What transfers is the STRUCTURE — someone offers you something, the last clause reveals the
  catch — not the vocabulary.**
- The corpus contains real typos ("he Sultan declares", "a Extravagance Card", wrong pronouns,
  missing terminal periods). A model prompted on raw text will reproduce them as style.
- The moral flatness is a setting choice licensed by that game's premise, not a transferable rule.

---
# What reading ALL 389 job-like cards showed

The designer asked whether I had really read the corpus. I had not — I had CLASSIFIED all 1,446
rite intros programmatically and read about 36. This file records the full read of the 389 job-like
cards (the subset with ≥2 character slots AND a dice check, our true analogue), 13,525 words.

## Things reading found that the regexes had missed

**1. The corpus repeats itself far more than a sample suggests.**
23 of 389 cards (6%) are EXACT duplicates; 34 (9%) share their first twelve words with another card.
The biggest families: "Jalila enthusiastically advertises…" ×5 · "Aziz has completely betrayed
you…" ×5 · "Night falls. Wickedness stirs…" ×4.
**And the reuse is a deliberate STRUCTURE, not laziness**: five Nawfal cards share a 40-word preamble
and differ only in their final line —
> *…now you have gained a Great Adversary who will go on…*
> **"This time, you hear that Nawfal is secretly sharpening his knife, forming factions…"**
> **"This time, you learn that Nawfal is spreading word of your misdeeds…"**
> **"This time, you discover that Nawfal is trying to persuade your supporters to abandon you…"**
A shared situation + one distinguishing last line. That is exactly what a saga/chain wants, and we
generate every beat from scratch instead.

**2. 46% of job cards involve NO recurring character at all.**
211/389 name someone from the recurring cast (Jawad, Nawfal, Maggie, Adila, Jabal…); **178 (46%) do
not.** Those 178 are our true analogue — a job about strangers — and they are SHORTER: median **25
words** (p25 17, p75 39, p90 55).
This settles a flip-flop of mine. I first concluded the reference works because the player knows
everyone (from a skewed 16-card sample), then over-corrected. The truth is a near-even split, and
the stranger half is the half we should imitate.

**3. My "rumour opening" impression was WRONG.** Reading the stranger jobs I noticed hearsay openings
("It is said…", "Travelling merchants tell tales…", "You've heard of…", "Legends tell of…") and was
about to call it the dominant device. Measured: **4% of all job cards, 7% of the stranger jobs.** It
is a real device and a rare one. Impression from reading is not evidence either — measure it.

## Devices confirmed by reading the whole set
- **The wry aside survives into grave work**: *"but can trolls even mine? It's the first time you've
  ever heard of such a thing – though it's not important."* · *"Habib has made an incredibly
  delicious Marvelous Mush from kitchen scraps - er, I mean, from leftover ingredients!"* ·
  *"mm... anyway, this should count as a true act of Extravagance!"* · *"Hey, isn't this turning
  into a disaster?!"*
- **Character contrast as the whole hook**: *"One values life more than money, and the other values
  money more than life."*
- **Questions are everywhere** and often ARE the card: *"Who are you trying to satirize?"* ·
  *"An epic? What story does it tell?"* · *"So... whom will you help?"* · *"Should you go look for
  her?"* · *"is this something you need to address personally?"*
- **Imperatives DO occur** — *"Draw your weapon!"*, *"prepare for battle!"*, *"Beware."*,
  *"Steel yourself for blood."* My earlier 1% measurement was an artefact of a narrow regex that
  only looked for Find/Send/Recover-type verbs. Correct reading: commands exist, but they are
  exhortations, not task assignments.
- **Cards can be five words**: *"Pay Jenna to design accessories."* · *"An Extremely Difficult Boss
  Battle"* · *"You will duel with Nabhani"*. The bottom of the distribution is barely prose, and the
  game is unembarrassed about it.
- **Length tracks stakes, not rules** — 5-20w for routine beats, 45-70w when a saga turns.

## Where our generated cards sit against the STRANGER subset (n=178, our analogue)
| | reference strangers | ours |
|---|---|---|
| words | median 25 (p25 17, p75 39) | 28-42 |
| addresses the player | 74% of job cards | 0% |
| a person with a stake on the page | ~all | rare |
