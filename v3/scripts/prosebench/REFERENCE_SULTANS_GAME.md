# Sultan's Game — reference quest/event prose (gathered 2026-08-24, designer request)

Purpose: the designer judged our P26 cards "still not great" and asked for the reference craft to
be found and recorded before any further iteration. This is the raw material, not yet a rule.
See also `ANCHORS.md` A2 (Sultan's Game card texts, already frozen as the 10/10 anchor) and B1
(Fort of Chains, the 8/10 anchor).

## What I could NOT find
The **Sewer Crocodile** event's intro prose. `sultansgame.wiki.gg/wiki/Sewer_Crocodile` carries
mechanics only (duration, card slots, dice check, success/failure stat deltas) and no flavour text;
the Events page is a disambiguation stub. The designer offered to supply it — that text is worth
having, since it is the exact case they had in mind.

## Random-event openers (verbatim, via sultansgame.wiki.gg/wiki/Random_Events)
> A bored noble in the city sent his two slaves into the desert, betting on which slave would live longer.

> A colleague from the court came to your home for a feast. Probably having drunk too much, he drunkenly vented his grievances to you.

> A lavishly dressed man suddenly appeared at your door, gesturing to indicate he was an exiled foreign prince and hoping for your support.

> A noble presents the Sultan with a strange beast: It has the head of a deer. The body of a leopard, and the tail of a pheasant.

> A peculiar man claiming to be an inventor seeks an audience, presenting a mechanical bird made of metal.

> A person suddenly approaches you, showing you a bundle of old items, claiming they are treasures passed down from your ancestors.

> At midnight, you hear a knock on your door. A young, beautiful woman dressed seductively appears, shyly asking to spend the night with you…

## Card texts already frozen as anchor A2 (verbatim)
> Junah is beautiful, but lacks a certain poise. This means she cannot charge as much, which, for many patrons, works just fine. The other prostitutes think she is wasting her potential, but they do not know what she wants.

> Card of the [tier], its texture [quality]. The image faintly depicts a scene of virtuous self-sacrifice, but alas, the woman's face has been erased.

## Where the full text lives (10 MB, NOT committed — kept out of the repo deliberately)
No English dump is public. The complete game text exists as flat keyed JSON in the community
translations, and the key schema maps almost 1:1 onto our engine:
- `rite_N_text` — the quest intro (what we call the card situation)
- `rite_N_cards_slot_sN_text` — the per-slot line (what the slot asks for)
- `rite_N_settlement_N_text` — **the result text after you assign units** (the designer's ask)
- `rite_N_settlement_extre_N_text` — a separate EXTREME outcome tier
- `rite_N_prior_settlement_N_text`, `rite_N_random_text_rN_text` — variants
Sources (translations, so usable for STRUCTURE and LENGTH, not for English craft):
Spanish `github.com/Jastro/sultan` → `StreamingAssets/i18n/es/config.json` (56,367 keys);
Vietnamese `github.com/neyney2810/sultan-game-vi-translation` → `config.json`.
The official wiki (`sultansgame.wiki.gg`) carries MECHANICS ONLY — verified through its api.php,
which is why the Sewer Crocodile prose is not obtainable there.

Measured length bands are in `GOAL_CARD_VOICE.md`; the headline is that a quest intro's median is
~24 Spanish words while our cards run 50-75.

## First observations — how this differs from what we generate (NOT yet acted on)
1. **They open on a PERSON DOING SOMETHING, not on an object out of place.** Every opener above has
   a human subject and a finite verb in the first six words: a noble sent, a colleague came, a man
   appeared, a person approaches. Our P26 rule 1 mandates the opposite — "one thing out of place
   that an eye could catch" — so all 18 of our cards open on scenery: *a barred door hangs*, *a row
   of smashed hives sits*, *a dark smear runs*. That is a rule of ours, not a fact about the genre.
2. **The strangeness is in the PREMISE, not appended as a closing detail.** A bet on which slave
   outlives the other; a beast assembled from three animals; a mechanical bird. We manufacture
   ordinariness and then bolt one odd act onto the end.
3. **They are not afraid of a person's motive or appetite.** Drunken grievance, seduction, an
   imposter prince. Our cards contain work, loss and property — nobody wants anything but their
   trade restored.
4. **Withholding is done by a final clause on a KNOWN thing** ("but they do not know what she
   wants", "the woman's face has been erased") — the gap sits on something the sentence has already
   made us care about, rather than on a stray prop.
5. **Sentences run long and subordinate**, against our five-clause chop: "This means she cannot
   charge as much, which, for many patrons, works just fine."
