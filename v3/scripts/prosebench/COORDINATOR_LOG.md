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

---
# ⛔ THE MONOTONY IS DOWNSTREAM OF A DESIGN RULING, NOT OF THE PROMPT
*(coordinator's own experiment, 2026-08-25, while w1/w2 were still out — 5 arms × 24 cards, seed 101)*

I built the dealt STRUCTURE token that w3 and w4 both asked for (`scripts/structures.ts`,
`runprompt.ts --structure`, opt-in so their in-flight runs stay comparable). **It does not work, and
the reason matters more than the lever.**

### First: the monotony, finally quantified
| arm | opens `A/An …` | distinct 1st words | sentence counts | lint-clean |
|---|---|---|---|---|
| A control P54 | **24/24** | **1** | 2 sentences ×24 | 92% |
| C + dealt structure token | 23/24 | 2 | 2×22, 1×2 | 83% |
| D + instance-carrying opening rule removed | 23/24 | 2 | 2×20, 1×4 | 71% |
| E + sentence count freed too | 23/24 | 2 | 2×20, 1×4 | 75% |
| **REFERENCE (713 job-like rites)** | **5%** | **221** | **1:195 2:247 3:145 4:67 5:30 6+:29** | — |

**Every card we generate opens the same way and is the same length.** 96% vs the reference's 5%;
one distinct first word vs 221. This is a bigger measured gap than the names gap (0% vs 64%) and it
is almost certainly what the designer felt as "not motivating".

**Four independent levers all failed to move it**: the dealt token; deleting the rule that carries
concrete instances (`*a* drover, *a* woman who keeps the ford`); freeing sentence count; and
second-person vantage. Loosening rules cost clean rate (92%→71%) and bought **nothing**.

### The cause: the reference opens on people the player HAS met
Reference first words: `The` 104, `You` 109, `A` 37. I checked what follows `The`, expecting our
cold-referent ban to be the culprit. It is not — those openings are **named or titled recurring
cast**: *The foreign merchant Bharat*, *The cartographer Manar*, *The Royal Guard Captain*, *The
vineyard owner*, *The maid*. Sultan's Game has a **persistent cast**, so a definite article is
honest there.

**Our `anonymity-by-omission` ruling (designer, 2026-07-16) makes every person a stranger. A stranger
can only be introduced indefinitely. "A <trade> <verbs>" is the ONLY grammatical frame left.** The
prompt is not failing; it is correctly executing a constraint that has exactly one output shape.
**No prompt can fix this. It is ruling #1's bill, now itemised.**

### ⚠️ AND: we have been overshooting voice badly
**The reference is 4% voiced (31/713).** w4's champion produces 21/24 = 87%; our arms ran 8-29%.
Every recent push toward dialogue has been moving us AWAY from the gold standard, not toward it.
This collides with the prose-bench A/B where voiced cards scored **+1 with blind judges**. Judge
preference and reference fidelity point opposite ways here — a designer call, not mine.

### One ruling-free lever remains untested
`You …` opens **15%** of reference cards, needs no name, and breaks the `A` frame. We already write
second person mid-card (15/24) but never open on it. Worth a targeted arm next round.

### Correction to my own work
The first draft of `structures.ts` violated the law written in its own header: six tokens said "the
fort"/"the asker", which deal a *scene*, not a structure. They pushed "gate" from 42% of inputs to
79% of outputs (control amplified nothing: 42% in, 45% out). Purifying them fixed the leak but
halved their effect — **concrete tokens get used and leak; abstract tokens are clean and ignored.**
That tension is w4's copy law seen from the other side, and it caps what any dealt token can do.

---
# ✅ CORRECTION AND BREAKTHROUGH — the template BREAKS, and no ruling is needed
*(same session, two arms later. The section above blamed the anonymity ruling. **That was wrong**,
and I falsified it myself with the arm I had built to price it.)*

**Arm G lifted the anonymity ruling entirely** — people may be named, the already-known may be
referred to definitely. Result: **24/24 still opened "A …", and the model used almost no names
(6/24).** Lifting the constraint changed nothing, so the constraint was never the cause.

What it actually is, is our own **§10: a cheap model reads PERMISSION as PROHIBITION.** "You may use
names" buys nothing. The discriminator is permission vs mandate vs *dealt* mandate:

| arm | what changed | opens `A/An` | distinct 1st words | names | lint-clean |
|---|---|---|---|---|---|
| A control | — | 24/24 | 1 | 3/24 | 92% |
| G | *permission* to name | 24/24 | 2 | 6/24 | 83% |
| H | *mandate* names, in prompt text | 22/24 | 3 | **16/24** | 88% |
| **I** | **dealt `openWith` mandate, one per card** | **11/24** | **10** | 6/24 | **92%** |
| ref | — | 5% | 221/713 | 64% | — |

### The law this establishes
**A feature is installed by a MANDATE; VARIETY is installed by a mandate that is DEALT.** Prompt text
can only ever hold one value, so a mandate in prompt text produces one shape (H: names in 16/24, but
still one opening). The same mandate dealt per call produces N shapes at no quality cost — arm I
matched the control's 92% clean rate exactly while going from 1 distinct opening to 10.

This is the *corrected* form of what w3 and w4 converged on. They were right that the lever is a
dealt field; my first implementation failed because I dealt **descriptions** ("open on a physical
object; let who and why arrive after it") rather than **commands** ("Begin the card with the word
'You'."). Descriptive tokens are advisory and get overridden by the model's default frame; imperative
tokens are obeyed. Same field, same rotation — the grammatical mood is the whole difference.

### Remaining defect in arm I — the pool needs tuning, not the mechanism
~4/24 cards are clumsy where the mandated frame fights the dealt content:
> "Cleared the barn, a sergeant stands at your gate…" · "A cart, a shipmaster cut, waits at your
> ford…" · "A hive a woman dragged into Thornhollow's ruin and handed to a man who swore fealty;"

The lint does not catch these — they are grammatical but graceless. The two abstract tokens
("Begin with a statement of fact that turns out to be about someone", "Begin with the physical
object") are the main offenders; the concrete ones ("Begin with the word 'You'") are clean. Tune the
pool toward frames that survive any content.

### What still stands from the section above
- The monotony measurement itself (96% vs 5%, one distinct first word vs 221) — unchanged and real.
- **The voice overshoot** — reference 4% voiced vs w4's champion 87% — unchanged and still a
  designer call.
- Ruling #1 is still open, but it is now **cheap to price**: names need a MANDATE (H: 16/24), never
  permission (G: 6/24). The ruling is not blocking variety; it only costs the 64% name rate.

---
## w1 — FREE HAND — returned. Self-score 6.5; blind 7.0 median vs its reference sample at 5.0
`agents/w1_CHAMPION_v41.txt`, 1,189 words. My verify on unseen seed 101: **88% clean, median 29w**
(it claimed 96% on its own seed 200 — within normal seed spread).
- 43 versions. Its governing law, reached independently: ***any rule demanding invented content
  collapses to one mold; rules pointing at payload fields vary.*** Found via "name one small exact
  thing their body is doing" → **THUMB in 10/24 cards**.
- Negative results it paid for: archetype-keyed openings (coherence collapse — a boar invented for a
  calf job), aphorism closers, short-quote caps (blind 4.25, "My dues are everything"), a rhythm rule
  ("no two sentences built the same way", −0.45), and **deleting a clause a zero-context verifier
  called dead weight → regressed** (confirms L5, the floor on rule mass).
- **Its unsolved defect: the three-beat skeleton** — scene / `X says "…"` / flat contradicting fact,
  visible across a batch. All four of its judges named it as the cap: *"9-grade content sitting
  inside a 7-grade shape."*

## w2 — CORPUS-FIRST — returned. Self-score 5.5; its judges put the reference at 7.44, itself at 4.87
`agents/w2_v20.txt`, 1,036 words. 93% clean over three seeds, **zero repeated 3-grams**, 20–22/24
distinct openings. It rebuilt the reference set itself (347 deduped job-like rites, ~145 read in full).
- Gaps it measured against the corpus, each 3–10×: `"asks you to"` **0.3% ref vs 54% ours**;
  placement verbs (sits/stands/lies/hangs) **7% ref vs 88% ours**; first sentence names a person
  **74% ref vs 29% ours**; `because` **1.4% ref**.
- Its law, reached independently and now the FOURTH vote: ***the one technique that reliably beat
  templating was keying the rule to a field that varies.*** Binding the closer's shape to `gravity`
  reproduced the reference closer mix (62/21/12 vs 57/13/10) and took repeated 3-grams to zero, where
  every fixed wording of the same instruction templated ×5–×7.
- **Negative result worth the whole round: implementing its own judges' top recommendation lost 1.2
  points.** Judges asked for a standing "whenever/if" conditional; it built one, hit the corpus rate
  (0%→29%), and scored 5.25→4.08. *A mechanism copied without its anchoring is worse than absent.*
- **And: matching a corpus statistic can hurt.** The reference's 64% name / 35% ellipsis / 33% aside
  rates are subsidised by things we cannot copy — 255/555 cards name a RECURRING NPC, and the
  ellipses are a Chinese-translation artefact. Pushed to the measured 33%, the aside over-fired to
  87% and scored below leaving it alone.
- Its unsolved defect: `⟨Name⟩ the ⟨trade⟩` in ~30/36 cards — a judge called it *"a database dump."*
  Two attacks failed; removing names collapses opening variety 20/24 → 3/24.

## ⚠️ THE JUDGING INSTRUMENT IS NOT STABLE ACROSS AGENTS
w1's judges scored the reference **5.0**; w2's scored the same corpus **7.44**. Same texts, opposite
verdicts, because each agent built its own rubric and sampled the corpus differently (w1's judges
penalised translation artefacts and boilerplate that w2's judges read as voice).
**Consequence: no cross-agent score in this round is comparable, including the "beats the reference"
claims. Every champion must be re-judged on ONE instrument before any of it means anything.**

---
## THE ROUND'S ACTIONABLE RESULT — `openWith`, and the adjacent ban that makes it safe
Four writers, four independent routes, one law: **variety comes only from a rule keyed to a field
that varies.** I built it (`scripts/openings.ts`, `--opening`) and it took three forms to get right:

| dealt form | paste rate (w1) | distinct openings |
|---|---|---|
| whole command — `Begin with the place.` | **10/24** ("Begin…") | 8 |
| bare noun phrase — `a physical object` | **7/24** — *and lint called that batch 100% CLEAN* | 4 |
| **category label + adjacent no-print ban** | **2/24** | **10** |

The ban is the active ingredient, isolated by accident: my patch silently failed to add it to w1
while P54 got it. **Same labels, same rotation: 21/24 paste without the ban, 2/24 with it**, variety
unchanged (3 → 10 distinct openings). This reproduces w4's adjacent-ban result (5/24 → 0/24) on a
different mechanism, so adjacent bans are now confirmed twice on independent evidence.

**Anything that reads as writable English gets printed** when the prompt says the card must begin
with it — imperatives and noun phrases alike. Deal a label that cannot sit in period prose, and ban
printing it in the very next clause.

🐛 **Lint blind spot found**: the noun-phrase batch scored **24/24 lint-clean** while 7 of those
cards literally began "a physical object …". Lint does not detect dealt-value pastes. Needs a check.

---
# 🏁 UNIFIED BLIND JUDGEMENT — one instrument, 3 fresh seats, 64 cards, sources hidden
Per-seat means **4.86 / 5.00 / 4.77** — a stable instrument at last (the four agents' own instruments
had scored the same reference corpus 5.0 and 7.44). All three seats independently named the SAME
strongest card, the SAME weakest card, and the SAME dominant failure.

### Hit rate (cards averaging ≥7 across the three seats) — the measure that matters
| arm | ≥7 | median | mean |
|---|---|---|---|
| **P54_incumbent** | **3/8** | 5.50 | 5.25 |
| w1_plain | 1/8 | 6.00 | 6.04 |
| w2_v20 · w3_BEST · w4_R7 | 1/8 each | 3.00–5.00 | — |
| REFERENCE_sultans | 1/8 | 5.50 | 4.79 |
| **w1_openWith** | **0/8** | 5.00 | 4.88 |
| **P54_openWith** | **0/8** | 4.00 | 4.17 |

## ⛔ RESULT 1 — THE INCUMBENT WON. The round produced no better prompt.
Four independent writers, ~8 hours, 100+ prompt versions between them, none seeing our existing
work — **and P54 still has the best hit rate.** That is the round's headline and it is a negative
result. The writers' value was the LAWS they measured (L12–L15), not their prompts.

## ⛔ RESULT 2 — `openWith` IS REFUTED. My own lever, killed by the measurement.
**0/8 cards ≥7 on BOTH bases**, and it cost ~1–1.5 points on each (w1 6.00→5.00, P54 5.50→4.00).
It did exactly what I claimed — variety 1→10 distinct openings, lint-clean unchanged — and the cards
got *worse*. The judges say why, unanimously: forcing an opening frame that fights the dealt content
produces exactly the batch's #1 defect. This is the SECOND independent measurement of it (w1's v5
archetype-keyed openings collapsed coherence the same way).
**Variety is not the bottleneck. Do not spend the next round on it.**

## ✅ RESULT 3 — the three seats handed us the actual mechanism, unprompted and identically
**The failure (named #1 by all three): the dangling referent — a punchy final "hook" clause bolted on
without being grammatically attached to the scene.** Judge 2: *"many cards close on a punchy fact
that was clearly meant as the hook, but it is appended without being attached to the scene, so
instead of complicating the job it stalls the read."* Examples they cite: "the saddlebags are gone
from it", "it grew out of business already done", "Bell on a goose shows market is three days the
other way".

**The success, from the top four cards (36, 6, 14, 61 — one from each of four different arms):**
> *one clean, load-bearing wrongness — a final detail that RETROACTIVELY CHANGES what the earlier
> sentences meant, rather than decorating them.*
A cut axle ("cut, not worn through"). A ransom smaller than what was already paid. A sergeant who
will not enter the barn he locked. A grieving father who asks when the watch changes.

**This is the brief for the next round, and it is prompt-fixable**: our cards already CARRY a hook
(that is what `seen` is for); the hook is simply not ATTACHED. Same information, different join.
Judges' secondary failure — "perfectly clear but asks nothing and risks nothing" — is the designer's
original complaint (*"for a routine job i still want to be motivated"*) reappearing in blind data.

## 🔧 Correction to my own measurement
The reference arm's low mean (4.79) is partly MY sampling error, not a fair reading of the gold
standard. My "job-like" filter (≥2 slot lines + a dice check) let non-job texts through: its two
worst cards are *"You have transcended the world woven from ink…"* (an ending text) and
*"Meticulously ensuring its flight capability…"* (a sentence fragment), which all three seats
correctly scored 1–2. Its best scored 7.33. **Rebuild the reference arm from the ENDORSED gold, not
a filter, before quoting any reference number again.**

### Footnote — why the `openWith` claim survived as long as it did
I justified "variety at NO quality cost" with *lint-clean unchanged at 92%*. That number came from a
lint which **could not see dealt-value pastes** — precisely the defect `openWith` was introducing.
The instrument was blind to the failure mode of the thing it was being used to validate.
Re-measured with the fixed lint, the control's own clean rate is 75%, not 92%, so **no clean-rate
figure recorded before commit `00d55b0` is comparable to one after it.**
The blind judges caught it anyway. **When lint and blind judgement disagree, the judges are ground
truth** — lint is telemetry that can only ever check what someone thought to encode.

---
# 🎯 ROUND 2 — I CHASED THE WRONG VARIABLE, AND THE MEASUREMENT SAYS SO
Batch 2: 50 cards, 3 fresh seats, one instrument, sources hidden. Per-seat means 5.16/5.18/5.12.
**Calibration is FIXED**: rebuilt from the ENDORSED gold instead of my faulty "job-like" filter, the
reference now scores **median 7.00, 10/30 cards ≥8 — clearly the top arm**, as the designer requires.
My round-1 reference number was my sampling error, now confirmed twice.

| arm | median | mean | ≥8 | dangling closer | mean, ATTACHED cards only |
|---|---|---|---|---|---|
| **GOLD_endorsed** | **7.00** | 6.40 | **10/30** | 2/10 | **7.12** |
| **V3_both** | 5.50 | 5.23 | 1/30 | 2/10 | **5.62** |
| P54_control | 5.00 | 5.03 | 0/30 | **0/10** | 5.03 |
| V1_referent | 5.00 | 4.77 | 1/30 | 1/10 | 5.07 |
| V2_contradict | 4.00 | 4.33 | 0/30 | 3/10 | 4.57 |

## The correction
I read "all three judges named the dangling referent as the #1 failure" as "dangling is our gap." It
is not, and two facts kill it:
1. **The control dangles 0/10.** I built three variants against a defect the incumbent did not have.
2. **The gold standard dangles 2/10 — the SAME as my best variant and MORE than the control** — and
   still outscores us by ~2 points with dangling cards removed from both sides.

Dangling is real and expensive **when it occurs** (dangling cards mean 3.46 vs attached 5.48), which
is why every judge noticed it. But it is distributed across the bad cards of EVERY arm including
gold. **"The most common failure in a batch" is not "what separates the best from the rest."** Those
are different questions and I answered the wrong one.

Worse, two of my three interventions *caused* the thing they targeted: demanding a contradiction
(V2) took dangling from 0/10 to 3/10 and cost 0.5 points. The mechanism is judge A's sharpest
observation — **the UNEARNED DEFINITE**: *"a noun phrase presented as known information when the card
has never introduced it… the reader does not choose the wrong referent, they wait for one that never
arrives."* Ordering a twist makes the model invent a contradicting entity and then point at it with a
definite article. Requiring the closer to be about an ALREADY-NAMED referent (V3) cancels that harm —
which is why only the combination beat the control.

**KEEP V3** (+0.6 on attached cards, the round's only real gain). It is small; do not oversell it.

## ✅ WHAT THE GAP ACTUALLY IS — and it is the designer's original complaint, unchanged
Gold's 8s and 9s, in the judges' own words: *"tonight, this man kills you"* · *"they are already
armed and waiting for you"* · *"this could cost me my head"* · *"your regicide plot"* · *"a monster
ravaging your own territory."*

**Gold puts the PLAYER at risk. Our cards put a stranger's problem in front of the player.** Every
one of our cards is someone arriving at the gate to request a service; the stakes belong to the
petitioner, never to the fort. That is exactly what the designer said at the very start —
*"for a routine job i still want to be motivated to do this"* — arriving now as blind measurement on
the rubric's MOTIVATION dimension.

And **P54 actively suppresses it in prompt text**:
> *"The trouble is only as urgent as the facts make it — never invent a deadline the message did not
> give you."* … *"The card TELLS the boss what has happened. It never orders them about."*
Both rules exist for good reasons (invented urgency and imperative nagging were measured defects),
but together they forbid the card from ever putting anything on the fort.

🔒 **DESIGNER QUESTION, and the highest-value one open**: may a one-off job card state what it costs
the FORT — a consequence, not a reward — if the job is refused or botched? If yes, is that a payload
field (the engine owns the number/severity) or prompt-side? The engine currently deals no such fact,
so the model would have to invent it, and inventing urgency is a measured defect. **This looks like a
seeding change, not a prompt change** — the same conclusion w1 reached from a different direction.

## And the prompt-side fix for it does NOT work — tested, so the ruling is now well-posed
Before escalating, I tested whether stakes can be installed prompt-side without any new dealt fact.
The lever looked promising: **the engine already deals `gravity`, and P54 spends it entirely on word
count** ("the CEILING on this card's length"). Severity is dealt and we were spending it on length.
So: V4 keeps the ceiling and adds "gravity is also HOW MUCH IS EXPOSED"; V5 makes the exposure
specifically the FORT's. Both refuse a clock, since inventing urgency is a measured defect.

| | `asks you to` | `because` | fort-mention | median |
|---|---|---|---|---|
| P54_control | 3/24 | 2/24 | 6/24 | 26w |
| **V3_both** | **2/24** | **1/24** | 4/24 | 33w |
| V4_exposure | 6/24 | 2/24 | 14/24 | 32w |
| **V5_fort** | **9/24** | 2/24 | 16/24 | 35w |
*(reference rates, w2's measurement over 347 rites: `asks you to` **0.3%**, `because` **1.4%**)*

**It produced the VOCABULARY of stakes, not stakes.** Fort-mentions went 4 → 16, but they are
cosmetic — "from your walls", "your gate" — while the actual exposure stays the petitioner's. And it
regressed the card into the supplicant frame w2 measured as our single largest deviation from the
corpus: `asks you to` 2/24 → 9/24 against a reference rate of 0.3%. Cards also re-acquired false
`because` joins ("She asks you to have it stabled BECAUSE the saddlebags are gone from it").
*(Directional: judged on regression markers and reading, NOT blind-judged — I stopped rather than
spend three more seats on an arm that reads worse than V3 on every marker.)*

**This is L12 again, from the other side.** A mandate installs a feature only when the model has
something to install it FROM. "Name what is exposed" has no dealt fact behind it, so the model
produces the register and not the substance — the same shape as w4's L14 (demonstration shows a
register; it does not install a feature).

**⇒ The ruling is now well-posed and empirically bounded: the stakes gap CANNOT be closed
prompt-side. It needs a dealt fact.** Every other route has been tried and measured.

---
# w2 ROUND 2 — the strongest return of the session. `agents/w2_v43.txt` (1,206 words)
88% lint-clean over three seeds; my verify on seed 101: **88% clean, median 30w**, and
`dealt-restate` **10** vs the control's 22 — the restatement drop it claims is real.
Its honest calibration note: its own v20 measures 12% hit rate on its seats, which matches the 1/8 I
measured for every writer, so **the claim is the 12% → 26% delta, not the absolute.**

## The mechanism — and it explains the one 8.00 card of round 1
v43 collapses the card from four independent beats to **two moving parts, where the second breaks the
first**:
- **THE ACCOUNT** — the person, what they did, and *the reason everyone there has settled on*, stated
  flat and unhedged as though the teller believed it.
- **THE BREAK** — the `seen` fact, aimed at ONE target: the person who gave that account, or the very
  thing they told you about. Never a third party, never the scenery. And the load-bearing line:
  **what the break changes is not WHAT happened, it changes WHY.**

Why round 1's single 8.00 card scored: it was the one card where v20 accidentally produced an account
**with a stated PURPOSE in it** (a ransom) and a break that voided that purpose. The other seven had
an act followed by a neutral second fact — no purpose on the page, so nothing for the break to bite.
v43 makes the accident the required structure. Both of its seats, independently and twice, described
the 7+ cards as *"the closer proved the speaker's account impossible"* — the rule stated back.

## ⭐ THE SPLICE TEST — new project telemetry, and it independently confirms my own result
Transplant each card's final sentence onto the NEXT card's body; hand a blind reader the intact and
spliced texts mixed; see if they can tell. **If a closer is decoration, the splice reads fine.**
Measured: **v20 96% detection, v40 100%** — both at ceiling. w2's closers were referentially attached
*before it changed anything*.
**This is the second independent route to the conclusion that attachment was never our problem** — I
found the same thing from the judges' audits (control dangles 0/10, gold dangles 2/10). Cheap, one
agent call, worth keeping. It cannot discriminate above this level.

## ⚠️ THE SIGN INVERSION — the sharpest single finding, and it cuts against MY V3 rule
w2 tried three surface proxies for "does the closer attach"; all three said its cards already matched
or beat the reference. Then it found the sign was backwards:
> **Closer-repeats-a-noun is not attachment, it is RESTATEMENT** — the exact failure its judges named.
> Reference **25%**, w2's cards **71–83%**. And the reference closer carries a median of **6 new
> content words** against w2's **3**.
> **The reference attaches WITHOUT repeating: it introduces new material whose damningness is
> inferential.**

Its own anti-dangling rule ("never introduce an object the card has not already put on the page") was
*manufacturing* the restatement. **My V1/V3 rule is that same rule** — "a fact about someone or
something ALREADY NAMED on this card". V3 still beat my control (5.62 vs 5.03 on attached cards), but
this says the referent constraint is a trade-off I had the dial hard over on, and that v43 reaches
attachment by a better route. **Do not stack V3's referent rule on top of v43.**
w2 then released the constraint (v46) and the metric did not move: **the model will not introduce
genuinely new material at this size no matter how the rule is phrased. Unsolved.**

## More confirmations and negatives
- **Pink elephant, confirmed again (v45)**: naming "restatement" as a failure with a test attached
  scored **5.19 vs 5.78**, hit rate 12% vs 31%. A ban activates what it names; state the positive
  mechanism only. (Note this does NOT contradict L3 — adjacent bans on *pasting a dealt value* work;
  bans on a *writing behaviour* backfire.)
- **Paraphrasing `seen` is a real trade-off — recommended AGAINST (v47).** It works mechanically
  (`dealt-restate` 13–16 → 0–4, `dealt-paste` → 0, lint 22/24) but the break went blunt and scored
  **0/13 ≥7**. Vindicates `motives2.ts`'s design note: the tell was reshaped into an observable
  precisely so a verbatim lift is harmless.
- 🔧 **ACTIONABLE FOR US, not for the writer**: the recurring-stamp problem (the same tell appearing
  verbatim across cards in one batch) is **pool size, not prompt — 149 pairs against 24 cards a
  batch.** Enlarging `motives2.ts` is our job.
- **Free win, lift into any arm**: an adjacent ban at the `ask` line — it is a task written for the
  engine, so rewrite what is undone in the words the people there would use — took `dealt-paste` 4 → 2
  and lint 18/24 → 20/24. `ask` was leaking verbatim from v20 too (3/24).
- Composing backwards from the break (v44) misfired: lint 22→18, the account got attributed to the
  reader, and a keyword became a person's name ("Spindle the oarsman").

**Known defect it carries**: the `⟨Name⟩ the ⟨trade⟩` stamp is at ~100% — its round-1 unsolved defect,
untouched. Round 1 says variety is not the bottleneck, so this is accepted for now, not fixed.

---
# ⚠️ STATISTICAL CORRECTION — batch sizes were too small to rank arms, mine included
Batch 3 (48 cards) returned V3 6.11, w2_v43 5.44, GOLD **5.11**, P54 5.39 — with **GOLD scoring 5.00
median where batch 2 gave it 7.00**. Same instrument, same sampling method, an arm that did not
change. That swing sizes the noise directly.

Pooled across batches 2+3, card-level means with 95% CIs:
| arm | n | mean | 95% CI | ≥7 |
|---|---|---|---|---|
| V3_both | 22 | 5.71 | [5.05, 6.37] | 7/22 |
| GOLD_endorsed | 22 | 5.70 | [4.84, 6.55] | 9/22 |
| w2_v43 | 12 | 5.44 | [4.78, 6.10] | 2/12 |
| P54_control | 22 | 5.23 | [4.76, 5.70] | 2/22 |

Same-arm batch-to-batch swing: **GOLD 1.29**, V3 0.88, P54 0.36 — the gold arm's own instability is
larger than any gap between arms. **Every CI overlaps.**

**What this retracts:** my earlier statement that gold beats us by ~2 points ("gold 7.12 vs ours
5.0–5.6"). Pooled, gold is **5.70** and V3 is **5.71**. That gap was substantially an artefact of
drawing 10–12 cards from only **20** endorsed intros. The hit rate still separates the control
(2/22 ≥7) from gold (9/22) and V3 (7/22), and that is the more robust signal — but it is not a
two-point quality gap and I should not have quoted one.

**What this does NOT retract:** the qualitative finding stands on its own evidence — gold's top cards
put the PLAYER at risk while ours put a stranger's problem in front of the player, and the
prompt-side attempt to install stakes produced the vocabulary of stakes without the substance
(`asks you to` 2/24 → 9/24 against a reference rate of 0.3%). That was measured on regression
markers, not on the noisy score.

**Fix applied for batch 4 (96 cards, 3 seats):** judge EVERY card of each arm (24 each — zero
sampling variance on our side), and draw the gold arm from a **425-text** pool built with a tighter
job filter (complete sentence, addresses the player, 14–70 words, no placeholders, no ending texts)
instead of the 20 endorsed intros. Arms: P54_control · V3_both · w2_v43 · GOLD_pool.

**Standing lesson: an 8–12 card arm cannot rank prompts.** Every per-arm number recorded in this log
before batch 4 carries a ±0.5–0.9 standard error and the rankings between adjacent arms are noise.

---
# 🔍 WHY THE GOLD ARM KEEPS MOVING — most of the reference corpus is NOT standalone-readable
Three gold arms, three different scores, all on the same instrument:
| gold arm | how built | mean |
|---|---|---|
| 10 endorsed intros (batch 2) | hand-curated | **6.40** |
| 12 endorsed intros (batch 3) | hand-curated | 5.11 |
| 24 from a 425-text auto-filter (batch 4) | filtered: complete sentence, addresses the player, 14–70w, no placeholders | **5.06** |

I read the 24 that batch 4 actually judged. The filter is not the problem — **the corpus is.** Most
of those texts are mid-campaign beats that depend on a persistent cast and prior story:
> *"Soon, Buthayna discovers the four girls are missing…"* · *"Arzuna wants to see you, as soon as
> possible."* · *"A Bloodshed Card placed you and Nabhani at opposite ends of life and death."* ·
> *"According to Mahir, the Dragon's Eye has 'solidified'…"*
plus aphorisms (*"Life is a circle"*), combat barks (*"Get over here and bite!"* — the worst card in
the batch by unanimous judgement), and rhetorical framings. **No automated filter can separate these
from job cards, because the difference is narrative context, not surface form.**

## 🔑 THE REFRAME — and it changes what "match Sultan's Game" can even mean
**Sultan's Game cards are gold IN CONTEXT.** They are read by a player who knows Arzuna, who has met
Nabhani, who drew the Bloodshed Card three turns ago. Read cold by a stranger — which is exactly what
our blind instrument does — the corpus at large scores **~5.1**, i.e. no better than our own cards.
The 20 endorsed intros score higher precisely because they were hand-picked for standalone
readability.

**Our one-off cards are being asked to do something the reference corpus mostly does NOT do: work
with zero context.** That is a harder problem, not the same problem. It also explains, at last, the
0% vs 64% name gap and the 5% vs 96% opening gap: those are both symptoms of the same thing — a
persistent cast the reader already knows.

**Consequences for the benchmark:**
1. **The only valid gold arm is the hand-curated endorsed set**, and there are 20 of it. Any larger
   gold arm drawn by filter is contaminated and will read as ~5.
2. **Comparisons among OUR arms remain fully valid** — same task, same context conditions, and in
   batch 4 every card of every arm is judged, so there is no sampling variance on our side.
3. Chasing corpus-wide statistics (names, openings, voice rates) is chasing numbers produced by a
   game structure we do not have. This is L15 with a much sharper edge: **the reference's numbers are
   not targets, and for the context-dependent ones they are not even meaningful for us.**

---
# 🏆 FINAL RESULT — V3 IS THE NEW CHAMPION, and this one survives the statistics
Batch 4 was properly powered: 96 cards, 3 seats, **every card of each of our arms judged** (24 each,
so zero sampling variance on our side). Pooled with batches 2 and 3 — all on the one instrument:

| arm | n | mean | 95% CI | ≥7 |
|---|---|---|---|---|
| **V3_both (CHAMPION)** | 46 | **5.80** | [5.39, 6.22] | **13/46 (28%)** |
| GOLD_endorsed | 22 | 5.70 | [4.84, 6.55] | 9/22 |
| w2_v43 | 36 | 5.37 | [5.00, 5.74] | 3/36 |
| P54_control (old champion) | 46 | 5.24 | [4.93, 5.55] | **4/46 (8%)** |
| GOLD_pool (contaminated) | 24 | 5.11 | [4.35, 5.87] | 6/24 |

**V3 − P54 = +0.57 ± 0.52 → significant**, and the direction is consistent across all three
independent batches (+0.20, +0.72, +0.64).
**Hit rate ≥7: 28% vs 8% — Fisher exact two-sided p = 0.0295.** That is the metric the designer
actually asked about ("get to 8+ as much as you can"), and it is a 3.5× improvement.

Within batch 4 alone the paired per-fixture differences are NOT individually significant
(V3−P54 = +0.64 ± 0.65). **The result rests on pooling all 46 cards per arm across three batches plus
the consistent direction — not on any single batch.** Stated plainly so nobody later quotes a
stronger claim than the data carries.

## What V3 actually is
`CHAMPION_V3.txt` = P54 with ONE rule changed. P54's `seen` rule said:
> *"Set it down as a plain fact in its own right… Standing alone as a short sentence is usually
> better."* — plus a separate line, *"The thing that can be SEEN closes the card. Set it down and
> stop."*

V3 replaces that with: the closing fact must be **about someone or something already named on this
card**, and must **leave one thing said earlier untrue, or true in a way nobody meant** — the reader
revises what they just read rather than merely adding to it. The standalone-closer instruction and
the "set it down and stop" line are deleted.

Note the honest tension: w2 measured that the already-named constraint *manufactures restatement*
(L17), and it is right that this is a trade-off. But V3 pairs it with the contradiction requirement,
and only the PAIR beats the control — referent alone (V1, 4.77) and contradiction alone (V2, 4.33)
both scored *below* P54. **The two rules cancel each other's failure mode.** Do not ship either half.

## Next round's obvious move (NOT yet tested)
w2's v43 reaches the same goal by a better-argued route — an ACCOUNT carrying a stated purpose, and a
BREAK that changes WHY rather than WHAT — and it scored 5.37 without V3's restatement cost. Merging
V3's contradiction requirement with v43's account/purpose structure is the clear next experiment.
Per L17, do NOT stack V3's already-named rule on top of v43.

---
## Pool enlarged 149 → 409, and it exposed the paste law for the SEVENTH time
`motives2.ts` now holds 409 pairs (the original 149 untouched). Verified: **272 distinct head nouns,
132 distinct main verbs, 0 duplicate tells or wants**, all 520 new strings lint clean. 409 is prime
and coprime with the rotation step 17, so a 24-card batch draws 24 distinct entries for every seed
(0 repeats over 500 seeds) and the rotation now wraps after 17 batches instead of ~6.
*(It also corrected my brief: the existing pool lints **1**, not 0 — a pre-existing
`invented-duration` at entry #58.)*

**But the enlarged pool REGRESSED the champion**: 79% → 63% clean (seed 101) and 54% (seed 202), with
`dealt-paste` jumping 1 → 6–8. Every flag was the **`ask`** field, lifted verbatim:
> `ask=verbatim "watch the churchyard"` · `"sweep the chimney"` · `"shear the flock early"` ·
> `"keep a name off a list"`

**Cause: my own brief.** I required `want` to be a clean verb phrase ("watch the roof at night") to
kill an old passive-nominalisation bug. A clean verb phrase is exactly card-ready English, so it gets
pasted. **Better input English ⇒ more pasteable input.** That is the prose-shaped-paste law for the
seventh time in this project, and this time I caused it.

**Fixed with w2's already-measured adjacent ban at the `ask` line** — *it is a task written for the
engine, not speech: do not reuse its wording; say what is undone in the words the people there would
use*. Result: `dealt-paste` **6 → 2** and **8 → 1**; clean **63% → 71%** and **54% → 83%**.
**Third independent confirmation of L16** (w4 5/24→0/24, mine 21/24→2/24, now this).

`CHAMPION_V3.txt` now = V3 + the `ask` adjacent ban, running against the 409-pair pool.
⚠️ **Not yet blind-judged as a unit.** The +0.57 / 28%-vs-8% result was measured on V3 with the
149-pair pool. The ban is w2-measured and lint-verified and the pool is diversity-verified, but the
combination needs a blind batch before the champion claim carries over in full.

---
# ❌ RETRACTION — the V3 champion claim was built on a statistical error of mine
**Batch 5 (116 cards, 3 seats, 48 UNIQUE cards per arm across TWO seeds, both arms on the same 409
pool) — the first genuinely independent test:**
| arm | n | mean | 95% CI | ≥7 |
|---|---|---|---|---|
| GOLD_endorsed | 20 | 5.98 | [5.24, 6.72] | 7/20 (35%) |
| **P54_old** | 48 | **5.74** | [5.41, 6.06] | 11/48 (22%) |
| **CHAMPION_V3** | 48 | **5.44** | [5.02, 5.87] | 12/48 (25%) |

**V3 − P54 = −0.29 ± 0.54, not significant. Hit rate 12/48 vs 11/48 — indistinguishable.**

## The error
I claimed "+0.57, direction consistent across three independent batches, Fisher p=0.0295, n=46/arm."
**Batches 2, 3 and 4 all drew V3's cards from the SAME single generation run** — `ATT_V3_both.md`,
seed 101, 24 cards (verified: 10/10, 12/12, 24/24 of them came from that one file). The same is true
of the P54 control.

So:
- **"n=46 per arm" double-counted the same cards.** There were only ever 24 unique cards per arm.
- **"Direction consistent across three batches" was three re-judgements of ONE draw**, not three
  replications. It measured judge agreement, not prompt quality.
- **The Fisher test (13/46 vs 4/46, p=0.0295) was computed on duplicated rows and is void.**

On unique cards, no test ever showed a significant V3 advantage: batch 4 alone gave +0.64 ± 0.65
(not significant — I recorded that caveat at the time and then over-rode it by pooling). Batch 5
gives −0.29 ± 0.54.

**⇒ V3's closer rule is UNPROVEN. It is not a champion. Renamed `ATT_V3_UNPROVEN.txt`.**
It may still be worth something — its point estimate led on one draw — but a single 24-card draw
cannot establish it, and the honest state is "no measured effect."

## What survives, and what the champion now is
`CHAMPION.txt` = **P54 + the `ask` adjacent ban, and nothing else.** The ban is validated
independently of any of this: it is a lint-measurable paste defect, fixed three separate times
(w4 5/24→0/24, mine 21/24→2/24, this one 6-8/24→1-2/24). Verified on the 409 pool: **83% and 88%
lint-clean** on two seeds, up from 63%/54% without it.

## The methodological lesson — the expensive one of the session
**Re-judging the same generated cards is not replication.** Every arm must be REGENERATED on a fresh
seed for each independent test, or the batches only measure how much the judges agree with each
other. I built two rounds of conclusions on this and it cost the champion claim.
Combined with the earlier lesson (an 8–12 card arm cannot rank prompts), the standing protocol is:
**≥24 unique cards per arm, ≥2 seeds, regenerated per test, judged blind by ≥3 fresh seats.**
