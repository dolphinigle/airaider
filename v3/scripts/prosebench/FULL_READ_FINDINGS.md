# What reading ALL 389 job-like cards showed (2026-08-24)

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
