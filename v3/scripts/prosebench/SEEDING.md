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
