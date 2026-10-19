# PROSE METHOD — how we judge card writing, and what we have learned
*Anchor document. Written 2026-08-25 after two full rounds of independent prompt-writing plus five
blind judging batches. Read this before touching any writing prompt — it exists so the same
expensive mistakes are not repeated.*

Companions: `docs/PROMPT_RULES.md` (the rules themselves, §0–§12) ·
`v3/scripts/prosebench/CHEAP_MODEL_PROMPTING.md` (the measured laws L1–L17) ·
`v3/scripts/prosebench/COORDINATOR_LOG.md` (the full experimental record).

---
# PART 1 — GUIDING PRINCIPLES FOR A CARD
What a good one-off card does, in the order it matters. All of these are designer rulings or
blind-measured, not taste.

### 1. Readability outranks everything
The designer's standing instruction: **"readability >>> everything."** A card the reader must
re-read to parse cannot be saved by being interesting. Every blind judge across five batches
independently made unresolvable reference their #1 complaint.

### 2. Name a thing by what it IS before what it is LIKE  🔒 §12
*"a reed-woven token"* hands the reader an exotic material for a thing they cannot yet place.
*"a stolen heirloom"* names the thing and the wrong. **A modifier the reader cannot use yet is noise.**

### 3. Introduce a person by their RELATION, never a bare category  🔒 §12
*"a kin"*, *"a runaway servant"* are labels. *"his servant"*, *"the burners' steward's apprentice"*,
*"a guest of the fort"* carry the matter. **The relationship IS the story.**

### 4. SHOW the wrong; do not announce it
Measured directly: *"Charcoal loads were taken"* → *"Charcoal carts from Hawmoss leave full and
return empty."* Same fact, and the second is a hook. Announcing produces passive victim-first
sentences; showing produces a picture.

### 5. The card must never narrate its own bookkeeping
*"and is the one who holds the token now"* is the prompt's internal ledger rule surfacing as prose.
Who-holds-what is a consistency constraint for the WRITER. It is not a fact for the reader.

### 6. Pay is ONE closing clause, conditional on the work
Not a sentence, and loot rights never get their own. For scale: **Sultan's Game job cards carry no
payment language in the card prose at all** — it lives in slot lines and UI.

### 7. INTERESTING ≠ MOTIVATING  🔒 designer, at the very start
*"it's fine if it's not interesting since this is a routine job, but for a routine job I still want
to be motivated to do this."* This is the axis we are still losing on — see Part 4.

### 8. The result CONTINUES the card, it does not repeat it  🔒 §11
Verified against 4 shipped rite configs: **0 of 21 `result_text` fields contain their intro.**

### 9. We narrate procedure; the reference narrates CONSEQUENCE
Our resolutions describe *how the job was done* (braced the axle, crawled beneath the tongue).
Sultan's spends eleven words on the action and everything else on what it COST and CHANGED — an
ambiguous grief, a new ally, a court complaint. **Ours answers "what happened"; theirs answers
"what now".** Largest known gap in the resolution prose.

---
# PART 2 — METHODOLOGY (the part that was hardest won)

## The protocol — do not run a comparison any other way
1. **≥24 UNIQUE cards per arm.** An 8–12 card arm cannot rank prompts: the gold arm's own
   batch-to-batch swing was **1.29 points**, larger than any gap ever measured between arms.
2. **≥2 seeds, REGENERATED for every test.**
3. **≥3 fresh zero-context judge seats**, one frozen rubric, sources hidden, judges explicitly told
   not to guess provenance.
4. **The endorsed gold as the calibration arm** — never a filtered corpus draw (see below).
5. Report a **95% CI or a Fisher test**. Differences under ~0.5 on n=48 are noise.

## The five traps, each paid for in this project
1. **RE-JUDGING THE SAME CARDS IS NOT REPLICATION.** ⚠️ The single most expensive error. Three
   batches were pooled into "n=46/arm, direction consistent, p=0.0295" — but all three drew from
   ONE generation run of 24 cards. That measured judge agreement, not prompt quality. A proper test
   with 48 unique cards over two seeds showed **no effect at all**, and a champion claim was
   retracted in full.
2. **"Most common failure in a batch" ≠ "what separates the best from the rest."** Dangling
   referents were the unanimous #1 complaint — and the control had **0/10** while the GOLD had
   **2/10**. A whole round was spent on a defect that did not discriminate. **Always check that the
   defect distinguishes the arms before spending a round on it.**
3. **Lint is telemetry; the blind judges are ground truth.** They disagreed four times.
   Worst case: the prompt with the BEST lint (96%) never once scored 8 across 144 judgements. And
   a lint that "validated" a change was blind to the exact defect that change introduced.
4. **The corpus is gold IN CONTEXT.** Most Sultan's text is mid-campaign material about a cast the
   player knows (*"Soon, Buthayna discovers the four girls are missing"*). Read cold it scores
   ~5.1 — no better than ours. **Only the hand-curated endorsed set (n=20) is a valid gold arm; no
   automated filter can separate job cards from campaign beats, because the difference is narrative
   context, not surface form.**
5. **Our cards must work with ZERO context; most reference cards never have to.** That is a harder
   problem, not the same problem — and it explains the name gap (0% vs 64%) and the opening gap
   (5% vs 96%) as symptoms of a persistent cast rather than as defects.

## Useful instruments
- **`cardlint.ts`** — calibrated so the official corpus passes; includes a dealt-value paste check
  calibrated on 537,570 gold-text × dealt-value pairings at zero false positives.
- **The splice test** (`w2_splice.py`) — transplant each card's closer onto the NEXT card's body and
  ask a blind reader to spot it. If a closer is decoration, the splice reads fine. Ours detected at
  96–100%, which is how we proved attachment was never our problem.
- **`runprompt.ts`** — fast lab harness (lab prompts only). **`oneofflab.ts`** — the real shipped
  pipeline, cards AND resolutions, ~$0.02/run.

---
# PART 3 — THE LAWS THAT GOVERN EVERY EDIT
Full statements in `CHEAP_MODEL_PROMPTING.md`. The four that bite most often:

- **L12 — permission ⊂ mandate ⊂ DEALT mandate.** Permission buys nothing (a cheap model reads it as
  prohibition). A mandate in prompt text installs the feature but yields exactly ONE shape, because
  prompt text holds one value. **Variety can only come from a mandate whose value is dealt per call.**
  *Corollary, hit four times in this session alone: any rule phrased with a single grammatical
  realisation becomes that realisation in every card. Fixing one defect installs a template.*
- **L13 — the copy law is about CONCRETENESS, not examples.** Any concrete instance anywhere is
  copied, and instances inside a RULE leak worse than inside a demonstration (24/24 vs 5/24).
- **L1 — your rule's own wording comes back as prose.** Twice in one session, both in rules written
  minutes earlier to fix something else: "the job **turns on**" → *"It turns on a guild steward's
  servant"*; "no one **expected of them**" → *"a deed none expected of their order"*.
  **Phrase every rule so it cannot sit in period prose.**
- **L16 — ban a PASTE, never a BEHAVIOUR.** Adjacent bans on reproducing a dealt value work
  (confirmed 3×). Bans on a way of writing backfire (pink elephant, −0.6 measured).
- **§0 — rule mass has a floor AND a ceiling.** Adding a rule means merging or cutting another.
  Deleting a rule a verifier called "dead weight" caused a measured regression.

---
# PART 4 — OPEN DESIGNER QUESTIONS (all blocking, all measured)
1. **May a one-off card state what the FORT stands to lose?** Gold's best cards put the PLAYER at
   risk (*"tonight, this man kills you"*); ours put a stranger's problem in front of them. Installing
   stakes prompt-side is **measured dead** — it produced the vocabulary of stakes (fort-mentions
   4→16, all cosmetic) while regressing `asks you to` from 2/24 to 9/24 against a reference rate of
   **0.3%**. Needs a dealt fact.
2. **May the card carry a person's TENURE?** The designer's own model card reads *"a servant… who had
   worked for over 20 years"* — the betrayal weight. `NUMBER_BAN` forbids it, for the measured reason
   that invented durations were a real defect. Options: deal a tenure fact, or relax the ban for
   relationship-tenure only.
3. **Voice.** The reference is **4% voiced**; one agent champion ran **87%**. Blind judges reward
   dialogue (+1 on the prose bench); the gold standard does not use it. These point opposite ways.
4. **Names** (§ anonymity-by-omission): reference 64%, ours 0%. Names need a MANDATE — permission
   yields 6/24, a mandate 16/24. The ruling costs the name rate; it does NOT cost variety.

---
# PART 5 — THE TROPE CENSUS (added 2026-08-25)
🔒 **Designer ruling:** *"routine quests redundant is fine — overused tropes is not, and if it
happens too much, it's the SEEDS' fault."*

A repeated PROP or TRADE across many cards is a **seed-pool defect**, not a prompt defect. No prompt
rule can suppress a trope the engine is dealing. The loop:

1. **Census live-generated cards** for prop/trade frequency.
2. Find the over-represented one.
3. **Trace it to the pool(s) that deal it** — usually more than one.
4. Fix the pool. Re-census.

### ⚠️ CENSUS ONLY LIVE-GENERATED CARDS
`runprompt.ts` lab batches reuse the same ~146 FROZEN payloads (`pull-fixtures.json`) across every
prompt experiment, so their tropes are counted dozens of times and will dominate any pooled count —
and they do not even come from the live pools. **I got this wrong once:** a pooled census of 1,030
cards reported `gate` at 31%; separating the populations showed 936 were lab fixtures, and the true
live rate was **18%**, with `charcoal` (19%) actually the top trope. Filter: `oneofflab.ts` /
campaign output = live; anything whose first line matches `# <path> — n=` = lab, exclude it.

### ⚠️ CORRECTION 2026-08-26 — I fixed the MINOR sources and missed the dominant ones
An independent review of the diff caught this. The commit `ed72e32` claimed to "de-charcoal the place
pool"; it removed `'by the charcoal camps'` from `SPARK_WHERE` (1 of 16, dealt on a fraction of
cards) while **`the charcoal-burners' camps` remained a `forests` REGION ANCHOR** (`regions.ts:33`),
dealt in the `location` line of EVERY forests card. Likewise `gate` was removed from a ~250-entry
noun pool while it remained a `rollPlaceName` SUFFIX with **two place suggestions dealt per card**
(`names.ts:64`).
**Before claiming a trope is fixed, enumerate EVERY path that deals it** — pools, region anchors,
name generators, intake facts, sparks — and rank them by how often each is actually dealt. A 1-in-250
pool entry cannot produce a 19% rate; something dealt on every card can.
*(The region anchor is left in place deliberately: a region with charcoal camps having charcoal jobs
is the routine-is-fine case. What was wrong was the claim, not the anchor.)*

### Fixed so far (live rates, before → after)
| trope | before | after | dealt by |
|---|---|---|---|
| gate | 18% | **4%** | `INTAKE_FACT.bringer` (3 of 7 entries!) · an authored spark · `WILDCARD_NOUNS` · `SPARK_WHERE` |
| charcoal | 19% | measuring | a goods atom **and** `SPARK_WHERE`'s "by the charcoal camps"; the writer then coins "charcoal-burner" as a trade |

### Watch for DISPLACEMENT
When `gate` fell 18→4, `ford` rose 10→20 on a small sample. Pruning one prop may just concentrate
the next. Re-census the whole distribution after every fix, never just the prop you removed.

### A trope can also come from a RULE
`gate` had a prompt-side helper: §12 read *"whose servant, whose kin, who they answer to"*, and
**"whose kin" came back as the bare noun** the designer complained about (*"A Lingthorpe kin will
pay coin"*). L13 — instances inside a rule leak. Check the rule's own example words before blaming
a pool.

### 🔎 THE CENSUS MUST BE OPEN-ENDED — and what it found underneath the props
Counting a prop list you choose only finds tropes you already suspect. My first census used a fixed
list and ranked `charcoal` third while missing `steward` entirely; both surfaced immediately once the
census counted EVERY content word instead.

And underneath the props it found the real repetition, which is not a prop at all. Live census, n=52:

| word | rate |
|---|---|
| bring | 36% |
| **seized** | **34%** |
| **taken** | **30%** |
| return | 25% |
| join | 25% |
| fetch | 19% |

**A third of all cards are an abduction, and the job is nearly always retrieval.** The trope is the
PREMISE, not the props.

**Cause, and it is not fixable by wording.** `ONE_OFF_ARCHETYPES` = raid · capture · rescue · escort
· investigate · hunt · contract. **Two of those seven are seizure premises** (capture = take someone
alive, rescue = free someone held) and `hunt` is usually a person as well. 2/7 ≈ 29% predicts the
measured 30-34%. The roll itself is fine — uniform, with a 3-deep no-repeat rotation.

🔒 **DESIGNER QUESTION:** the premise mix is the composition of the job-type pool — what kinds of
work the game offers. Widening it (a siege, a delivery under weather, a negotiation, a build, a
vigil) is a DESIGN change, not a prose or seed-wording one. **Do not attempt to fix this in the
prompt**: the writer is correctly executing the archetype it is dealt.

### Stopping condition reached (2026-08-26)
Prop-level tropes are fixed and measured (gate 18→4%, steward 19→5%, charcoal 19→15%). What remains
above the noise floor is premise-level and belongs to the ruling above. Further small-sample
iterations were chasing ±10% swings at n=20 — see the batch-size rule in Part 2.
