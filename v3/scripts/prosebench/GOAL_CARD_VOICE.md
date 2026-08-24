# THE GOAL for one-off card prose (designer ruling 2026-08-24)

Designer on the Sultan's Game openers: **"these are very good and interesting"** — they are the
target. Our P26 batch (15/18 by lint+read) was judged *"still not great"*. What follows is the goal,
with the reference text verbatim and the measured gap.

## The target texts (verbatim, Sultan's Game)
> A bored noble in the city sent his two slaves into the desert, betting on which slave would live longer.

> A colleague from the court came to your home for a feast. Probably having drunk too much, he drunkenly vented his grievances to you.

> A lavishly dressed man suddenly appeared at your door, gesturing to indicate he was an exiled foreign prince and hoping for your support.

> A noble presents the Sultan with a strange beast: It has the head of a deer. The body of a leopard, and the tail of a pheasant.

> A peculiar man claiming to be an inventor seeks an audience, presenting a mechanical bird made of metal.

> A person suddenly approaches you, showing you a bundle of old items, claiming they are treasures passed down from your ancestors.

> At midnight, you hear a knock on your door. A young, beautiful woman dressed seductively appears, shyly asking to spend the night with you…

Plus the already-frozen A2 anchor (`ANCHORS.md`):
> Junah is beautiful, but lacks a certain poise. This means she cannot charge as much, which, for many patrons, works just fine. The other prostitutes think she is wasting her potential, but they do not know what she wants.

## MEASURED — the biggest gap is LENGTH, and it is the opposite of what we assumed
Word counts over the full Spanish text dump (community translation, 56k keys; Spanish runs roughly
15–25% longer than English, so the English originals are SHORTER still than these figures):

| field | n | median | p25 | p75 | p90 | max |
|---|---|---|---|---|---|---|
| `rite_N_text` — the quest intro | 1485 | **24 w** | 14 | 39 | 60 | 181 |
| `rite_N_cards_slot_sN_text` — per-slot line | 5390 | 5 w | 2 | 9 | 13 | 61 |
| `card_N_text` — character/item card | 1273 | 19 w | 12 | 26 | 37 | 139 |
| `rite_N_settlement_N_text` — RESULT after assigning | 3639 | **51 w** | 22 | 106 | 159 | 592 |
| `rite_N_settlement_extre_N_text` — extreme result | 4783 | 51 w | 27 | 83 | 132 | 658 |

**A Sultan's quest intro has a median of ~24 Spanish words — one or two sentences.** Our P26 cards
run 50–75 words in four mandated sentences, i.e. **two to three times the reference length.** Every
"four things in four sentences" rule I built is pushing directly away from the goal. The reference
puts ONE situation on the card and stops.

Structure note: 1042 rites carry settlement text, median **2** settlements each, plus a separate
**extreme** tier on 764 of them (median 2) — outcomes are TIERED and multi-variant, not one blob.

## What the reference does that we do not
1. **Opens on a PERSON DOING SOMETHING.** Every opener has a human subject and a finite verb inside
   six words: *a noble sent, a colleague came, a man appeared, a person approaches, you hear a
   knock.* Our rule 1 mandates the opposite — "one thing out of place that an eye could catch" — so
   all 18 P26 cards open on scenery (*a barred door hangs*, *a dark smear runs*). This is our rule,
   not a fact about the genre, and it is the likeliest single cause of the inertness.
2. **The strangeness is the PREMISE, not a detail bolted on the end.** A bet on which slave outlives
   the other; a beast made of three animals; a mechanical bird. We generate an ordinary situation
   and append one odd act.
3. **People have appetites and motives** — drunken grievance, seduction, imposture, a wager for
   amusement. Our clients only ever want their trade restored; nobody wants anything disreputable.
4. **Withholding lands on something already established** ("but they do not know what she wants";
   "the woman's face has been erased") — never on a stray prop.
5. **Sentences may run long and subordinate** — "This means she cannot charge as much, which, for
   many patrons, works just fine." Our fifteen-word chop forbids this rhythm.
6. **No cost-to-the-client accounting at all.** None of the openers explains what the trouble is
   costing anyone. The pull is the situation itself. Our rule 2 spends a whole sentence on losses.

## Consequences for the prompt (proposals, not decisions — rulings stay with the designer)
- Cut the four-sentence mandate. Target the reference band: ~25–40 words for a common card.
- Rule 1 becomes a person acting, not an object sitting.
- Drop or demote the cost sentence; let the premise carry the pull.
- Keep: the withheld thing, plain words, one person, parse-once readability.
