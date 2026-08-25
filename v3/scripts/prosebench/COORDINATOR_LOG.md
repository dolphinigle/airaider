# COORDINATOR LOG — independent prompt-writing round (2026-08-25)

Designer directive: independent agents write prompts THEMSELVES, without being shown the existing
ones; they get the seeding techniques and the reference. Target 8+/10 against Sultan's Game.
Baseline to beat: the incumbent 918-word prompt, blind-judged **5.84**.

Four writers, each barred from `pullprompts.ts`, `CHAMPION_*.txt`, `GUIDELINE.md`, `PULL_LAB_LOG.md`,
`CARD_PULL.md`, `INDEPENDENT_WRITERS.md` and every `batch-P*.md`. Each given: the gold standard, the
full official corpus, `TRANSFER.md`, `CHEAP_MODEL_PROMPTING.md`, the payload shape, the seeding
findings, and `scripts/runprompt.ts` to iterate with.

| writer | angle |
|---|---|
| w1 | free hand |
| w2 | derive the prompt statistically from the corpus |
| w3 | smallest prompt that works |
| w4 | teach by demonstration rather than rule |

---
## w3 — MINIMALIST — RETURNED
**`agents/w3_BEST.txt`, 293 words** (incumbent: 918). 26 versions, 4 seeds.
- w3's own score **7.2/10**; lint-clean **74%** over 96 cards; addresses player 69%; client speaks 100%.
- **Verified independently by me on a seed w3 never used: 71% clean, median 33w.** Claim holds.
- My own read is more cautious than 7.2 — call it **6-6.5 with high variance**. When it lands it is
  genuinely good (*"A logger panics: boots left at his door. 'He came back with my boots.' The boots
  are the wrong size for the man he names."*). Roughly a third go opaque from terseness
  (*"A niece lost a trinket at Hawwell ford owed to you before naming; the reeve profits."*).

### The headline finding — where a prompt breaks under compression
| words | score | what fails |
|---|---|---|
| 293 | 7.2 | — |
| 264 | ~7.0 | holds |
| **205** | **~6.2** | first real break: player address collapses 75%→20%, quotes revert to reciting the job |
| 134 | ~5.0 | grammar collapses — dropped articles, semicolon-chained fragments |
| 66 | ~3.5 | structural collapse: beats migrate into the wrong JSON fields, field labels leak |

**Quality starts breaking ~260w, unmistakable below ~210.** So a 293-word prompt beats a 918-word
one, but there is a hard floor — "a couple of hard constraints plus structured input" does not reach it.

### The control that is worth more than the ladder
w3's first ladder appeared to collapse at 187w — an artefact, because it had also compressed the
JSON output spec. Restoring the full spec (~20 words) held field discipline down to 134w.
**Those 20 words of output spec are worth more than 70 words of style rules. Cut the spec last.**

### w3's unfixable defect, and its generalisation
Architectural sameness: every card is trouble → quoted self-serving claim → flat undercut. Four
attempts to break it all regressed. Root cause w3 identifies, and it sharpens our L1:
**any beat grounded in the prompt's own prose becomes a verbatim grammatical template within one
generation (10-20 of 24 cards, every time). The only beats that resisted are those grounded in a
VARYING INPUT FIELD** — `seen` and `shape`. There is no input field for the client's MOTIVE, which
is why that beat templated in every formulation tried.
→ **Actionable: add a motive field to the payload rather than more prompt.**

---
## ⚠ HARNESS BUG FOUND BY w3 — MINE, AND IT CAPS EVERY WRITER
`ask`/`seen` are rotated independently of `opening.spark` and `location`, so some payloads are
self-contradictory — spark "livestock loose on the road" combined with ask "open a lock without the
key". 2-4 cards per 24 are unsalvageable by any prompt, capping the achievable score.
**Not fixed mid-round**: w1, w2 and w4 are still running against this harness and changing it now
would make their results incomparable. Fix before the next round, then re-baseline.

---
## w4 — DEMONSTRATION — RETURNED WITH A CLEAN NEGATIVE RESULT
**`agents/w4_R7.txt`, 611 words — and it is a RULES prompt with ZERO examples anywhere.**
w4's own blind protocol: 3 fresh zero-context judge seats per batch, frozen rubric/anchors,
calibration holdout scoring 10/10/10 every time. Pooled median **7.0**, mean **6.50** over 48 cards.
- **Verified by me on a seed w4 never used: 63% clean, median 37w** — below its claimed 79-92%.
  ⚠️ 5 of the flags are `account-book` (the word "ledger"), which is a project-wide banned prop w4
  was never told about because the ban lives in a file it was barred from. **My briefing gap, and it
  penalises w4 unfairly.** Fix the brief before the next round.
- Its cards run long (median 37w vs the reference's 24-28) and capitalise trades mid-sentence
  ("A Beekeeper", "A Herder"). One card leaked unquoted first person.

### The three-arm blind result: demonstration LOSES
Same job, same fixtures, same seed, judged blind together:
| arm | median | mean |
|---|---|---|
| **rules-only** | **8.0** | 7.25 |
| rules + demonstration | 7.0 | 7.25 |
| **demonstration-only** | **4.5** | 5.00 |

**The mechanism, measured, and it is the valuable part:** the demo-only arm had FOUR of eight
demonstration cards containing spoken dialogue and produced **0/24 voiced outputs**. One sentence of
RULE produced **21/24**. *Demonstration shows a register; it does not install a feature, and it
cannot suppress a default.*

### THE COPY LAW IS ABOUT CONCRETENESS, NOT ABOUT EXAMPLES
w4's leak counts:
| prompt | what leaked | rate |
|---|---|---|
| a demo's field labels printed as literal text | — | 5/24 |
| demo props | — | 5/24 |
| a demo's *semantic category* (all reasons became family obligation) | — | ~24/24 |
| **five closer fragments given as examples INSIDE A RULE** | — | **24/24** |
| **one example sentence inside a rule** | — | **16/24** |
A *rule* carrying concrete instances leaked at **66-100%, worse than any demonstration**. Stripping
every instance dropped it to 0/24.
**Restated law: ANY concrete instance anywhere in the prompt is copied, and the rate scales with how
neatly it fits the slot the model must invent into.** Rules win not because rules are magic but
because ABSTRACT instructions are the only kind that cannot be pasted — and demonstration is
concrete by definition.

### Two techniques from the losing angle that DID pay
1. A **no-reuse line placed immediately after** the demo block cut prop leakage 5/24 → 0/24 with no
   pink-elephant rebound. **Adjacent bans work** — consistent with our own L3.
2. **Never repeat a construction across examples**: giving each a distinct main verb frame cut
   construction-copying 54% → 21%.

---
## ⭐ CONVERGENCE — w3 AND w4 INDEPENDENTLY REACHED THE SAME ROOT CAUSE AND THE SAME FIX
Neither saw the other's work, and they attacked from opposite directions (minimal rules vs
demonstration). Both ended at the same wall and named the same remedy:
- **w3**: *"any beat I ground in my own prose becomes a verbatim grammatical template within one
  generation. The only beats that resisted are those grounded in a VARYING INPUT FIELD."*
- **w4**: *"at reasoning_effort low this model holds exactly one card-shape at a time; whatever you
  demonstrate or state becomes that shape, and any instruction to vary either produces a NEW single
  mold or breaks clarity. Breaking this needs an engine-side lever — a dealt card-shape token
  varying per call, the way shape/ask/seen already are — not more prompt text."*
w4 tried five separate ways to break the template (four differently-built demos, distinct
construction per demo, shape bound to gravity, length bound to gravity, stake folded into the line).
**All five scored worse than the plain version.**

**ACTIONABLE, with two independent votes: deal a STRUCTURE token per call** — not the story's shape
but the CARD's shape (where the concrete fact sits, whether anyone speaks, what the last clause
does). This is the same lever that already fixed variety for `ask`/`seen`/`shape`, applied to form
instead of content.
