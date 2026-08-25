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
