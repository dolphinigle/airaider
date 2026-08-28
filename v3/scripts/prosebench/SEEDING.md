# SEEDING — what actually produces variety (2026-08-24)

Designer's challenge: *"i think your seeds are bad. the goal of seed is to make the stories vary.
the 'story' seed can be 'person with unexpected background'. then we have keyword seeds — maybe it
randomly picks 'wolf' and 'morning', so the ai can generate a werewolf that transforms in morning."*

The critique was correct: my `motives2.ts` was 149 **pre-written scenarios**, which is a plot list,
not a seed — 149 stories and then repetition. It also violated this project's own recorded law that
AI-feeding lists are atoms that COMBINE, never authored phrases.

## What was tested, blind
Three generators, sources hidden, judged by an independent Opus judge calibrated on 95 sampled
reference rites:

| seeding | mean | in judge's best cluster | "decorated noun" defect |
|---|---|---|---|
| **paired ask + observable tell** (149 authored pairs) | **6.31** | **14/16** | **1/16** |
| generic shape + 1 concrete atom | 4.75 | 1/16 | 13/16 |
| generic shape + 2 concrete atoms | 4.56 | 2/16 | 12/16 |

## THE FINDING — the principle is right, the AXIS was wrong
The judge, without knowing the sources:
> *"The evidence is NOT in the objects or the people — those pools are shared across all three
> groups, so noun-swapping produces no felt range at all. Three owls and three dogs read as one
> card, not three. The evidence is in the KINDS OF TROUBLE… it varies the VERB, not the prop."*

**Variety comes from varying the ACTION the job asks for, not the nouns that appear in it.**
Swapping owl→dog→crow does not change what the job IS, so the model treats the atom as decoration —
hence 13/16 cards where a concrete noun is merely mentioned, hanging on a door or lying nearby.
The authored pool accidentally got this right: its 149 `want` strings are 149 distinct *actions*
(arbitrate a boundary, seal a well, brand livestock, hold a prisoner, intercept a rider), and the
judge counted ~17 distinct job-kinds in 19 cards from it versus ~10 in 23 from the atom groups.

## THE SECOND FINDING — ask and tell CANNOT be decoupled
The obvious way to make the authored pool combinatorial is to deal a random `want` with a random
`tell`: 149 × 149 = 22,201 pairings instead of 149. Tested (P53). It gains ~3% vocabulary
distinctness and **destroys coherence**, because a tell is by definition a fact that undercuts
THAT request:
> *"She asks you to watch the roof at night; their beds have been moved to the outbuilding already."*
> *"They wanted it carried into the woods; the old key is on the table between you."*
The pairing is load-bearing, not incidental.

## WHERE THAT LEAVES THE DESIGN
- **Keep** the authored ask+tell PAIR. It is the only configuration that scored above 6 and the only
  one free of the decoration defect.
- **Add** a generic SHAPE as an ORTHOGONAL third dimension (P54). A shape modulates the turn of any
  pair without needing to be paired to it, so it multiplies 149 → 149 × 40 without breaking the
  ask/tell relationship. Coherence holds; vocabulary distinctness is 72% vs 71%, so the measurable
  gain is small and the real gain (kinds of trouble) needs another blind round to confirm.
- **Grow the pair pool** for range. That is authoring work, not design work, and it is the honest
  cost of this approach.
- `shapes.ts` retains the 40 shapes and the concrete atom pools. The atoms are NOT dealt to cards;
  they are kept because the analysis of why they failed is worth preserving.

## The engine's own keyword mix is implicated
`sampleKeywords` deals BOND + TIE — two ABSTRACT words — plus 1-2 concrete ones, which is why
payloads arrive as `fealty, seduction, pulley, tongs` or `astonishment, perjury, sling, wildcat`.
All three independent writers reported the abstract half unusable: an abstraction cannot be
depicted in a 25-word card, only named, and naming it reads as filler. **Rebalancing that mix toward
concrete pools is a live engine change, unresolved.**

---

## Round 2 (2026-08-28) — the keyword MIX is not a lever either

Designer: *"i think you need to look at the keyword/seeds list too. i expect easier words too like
sword, etc mostly?"* The §5 style bar agrees in principle ("a curious twelve-year-old must know the
word"), and the abstract-half problem was left open at the bottom of this file. So it was benched:
three keyword mixes, same twelve archetypes, same seed, three blind judges (inter-judge r 0.82–0.90).

| mix | mean |
|---|---|
| `action` — TIE-led, BOND dropped | 5.81 |
| `base` — shipped (1 BOND + 1 TIE + wildcards) | 5.67 |
| `concrete` — a QUALITY on a THING, no abstraction at all | 5.61 |

**A 0.20 spread at n=12 is nothing.** This replicates the round-1 finding on a different surface:
swapping which nouns arrive does not change what the job IS, so it does not change the card. That
`action` (transactions: oath, ransom, parley) edges the other two is consistent with the axis
finding — vary the VERB — but not at a magnitude worth shipping.

### The pool audit, which is a separate matter

| pool | latinate/long | ≤5 letters | share of a LIGHT card's single word |
|---|---|---|---|
| BOND | **42%** | 15% | 45% |
| TIE | 32% | 15% | 35% |
| THINGS | 3% | 56% | 20% |

`THINGS` already holds exactly the register the designer expected — sword, rope, horse, bread,
knife, axe, boot, cart, key, coin, well, fire, door, bone, cloak, bow, salt, goat, nail — and it
wins one light-card draw in five. `BOND` (*homesickness, vindication, infatuation, reverence,
restlessness*) wins nearly half and fails §5's own bar. **Purging BOND's latinate tail is right on
the style bar and is NOT expected to move the bench** — say so when doing it, rather than booking it
as an improvement.

### What the round actually surfaced

Heavy cards scored **5.15** against light cards' **5.88** (n=9 vs 27; register and voiced-format are
confounded here, so this is not evidence against the voice — arm-level rounds had voice ahead). All
three judges named the same causes, unprompted, and neither is a keyword:

> *"pile up unglossed place names, filler openings ('I rode back with word') and hedged
> double-asks"* · *"buries its one good image under provenance and payment bookkeeping"*

That is the pay clause and place-name traffic — PLAYTEST_NOTES N8 item 3 and DIALOGUE_AB failure
class 2, both still untested. **That** is the next experiment, not the word lists.

## Round 3 (2026-08-28) — the pay clause and the place names

Two things all three judges named as the heavy card's drag, benched as arms (seed 7001, twelve
archetypes, three blind judges, r ≈ 0.90):

| arm | seed 7001 | seed 7002 |
|---|---|---|
| no invented place names (`NOPLACE`) | **5.89** | 5.42 |
| no place + no pay | 5.58 | — |
| base | 5.22 | 5.33 |
| no pay clause (`NOPAY`) | 5.03 | — |

- **Dropping the pay clause is −0.19 and does not ship.** It was the change the reasoning most
  favoured — ECONOMY §7.1b now prints a banded reward on its own line in both UIs, so the card's
  clause is duplicated — and the bench said no. A duplicated fact in prose is apparently not the
  same as a redundant one: the pay is *why a mercenary takes the job*, and a card that never names
  it reads as a rumour with no hire in it. This answers the open ruling in PLAYTEST_NOTES N8 item 3.
- **Dropping invented place names looked like +0.67 and did NOT replicate (+0.09).** Not shipped.
  Second time in one day that replication caught a change that a single seed made look good.

Both arms stay env-gated (`NOPAY=1`, `NOPLACE=1`) and default OFF.

## The standing #1, measured over the whole day

204 distinct cards across five blind rounds, three judges each, overall mean **5.53**:

| tag | share of judgements |
|---|---|
| flat | 26% |
| unclear | 25% |
| clutter | 17% |
| formula | 10% |
| nonsense | 8% |

The tag counts understate the real problem, because every round's prose summary named the same
single cause and it splits across `unclear`/`nonsense`: **the JOB contradicts or outruns its
SITUATION.** Verbatim, from three different judges in three different rounds:

> *"a corpse found stripped then ordered stripped, a rope already sawn through then ordered cut"* ·
> *"the job names a place or object the situation never introduced (grove holdout, hidden stashes,
> pledged peasant)"* · *"Situations generally outclass their jobs."*

The `JOB2` rewrite (shipped) reduced this and did not close it. **This is the highest-value target
left on the one-off card, and it is an engine-checkable defect** — the situation and the job are two
strings the engine holds at the same moment, and "the job names a noun absent from the situation" is
a mechanical test, not a prompt rule. That is the next thing to try, and §0 says enforcement outranks
the three prompt levers already spent on it.
