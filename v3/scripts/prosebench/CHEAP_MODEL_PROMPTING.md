# Writing prompts for CHEAP models — measured laws + literature (2026-08-24)

Context: the one-off card failure (`CARD_PULL.md`) was diagnosed as a **PROMPTING failure, not a
model ceiling** — designer's hypothesis, since confirmed. Same gpt-5-mini, same `reasoning_effort:
low`, same inputs, same cost; only the prompt changed, and the card went ~3.5 → ~7. Anything that
follows is about how to write FOR the cheap model, because that is where the score lives.

## PART 1 — laws measured in THIS project (trust these over Part 2)

**L1. Every distinctive phrase in the prompt comes back as a template — RULE WORDING INCLUDED.**
Not just examples. In each lab round the newest rule's own words appeared in 4-6 of 6 samples:
"bears it" · "He needs X back" · "wants it put right because" · "coin from the crew's winter chest".
Proven prompt-borne, not sampling noise, by re-running the champion on a completely different
situation (different archetype, land, cast) — three templates survived the change intact.
⇒ Assume ANY phrasing you write will be echoed. State a requirement as a thing to DO plus the
GROUND it must come from, never as a form of words. Extends PROMPT_RULES §8 one level deeper:
§8 says don't patch the failing EXAMPLE; this says the RULE'S OWN SENTENCE is also sticky.

**L2. Requirements phrased as questions get answered inside the prose.** Rewriting the four
requirements as "What is out of place? / Who is worse off? / When the soldiers come home, what is
different?" produced cards containing literal answer-sentences ("When the company returns the huts
will hold an answer", 5/5), blew the length budget (131-160w vs 73-90w), and re-broke two rules that
had been holding. Questions are a WORSE instruction form than declaratives for this model.

**L3. A ban activates the banned thing when a nearby rule makes it the cheapest way to comply.**
"Nobody speaks aloud on this card" held at 0/5 — until a pay rule demanded attribution ("names who
pays"), at which point quoting became the cheapest attribution and speech returned 4-5/6 *with the
ban still in the prompt*. Same shape as the already-shipped §10 law (a cheap model reads PERMISSION
as PROHIBITION); the inverse is: it reads a NEARBY DEMAND as a licence to break a distant ban.
⇒ Put a ban next to the rule that tempts it, or remove the temptation instead of banning.

**L4. A concrete example inside a rule is copied verbatim.** Listing three ways a client might fund
a payment put the FIRST one on 5/5 cards word for word. Zero examples is the safe default; if an
exemplar is used it must be MUNDANE and share no props with the task (the existing VOICE_EXEMPLARS
convention). Consistent with the earlier bench finding that exemplars gave +0.5 alone and nothing
on top of rules.

**L5. There is a FLOOR on rule mass — "shorter" is not the same as "cheaper to parse".** Cutting the
working prompt to one third (requirements as a short checklist, order free) regressed hard: register
collapsed to first person, POV broke mid-card ("none of us put it there"), the pay became `The
foreman says coin.`, and the keyword went back to being a prop. §0's rule budget means EACH RULE
MUST EARN ITS PLACE — it does not mean fewer words wins. Reliability came from the rules that pin
register, order, and grounding; those are load-bearing.

**L6. Input shaping beats any wording (§0 #2 re-confirmed, hard).** The engine hands the card writer
`rewardEnvelope: "coin"` — one word — and the shipped card duly said "will pay coin. The coin is
yours to keep." No rule fixed that. What fixed it was changing what the writer had to DO with it:
merge the pay into the outcome sentence so the pay is never a sentence of its own.

**L7. Ground a requirement in data the card already contains, and the model stops inventing.**
"One thing nobody can account for" collapsed into a single mold — a child's garment belonging to a
stranger, 6/6 and 3/4 on a different situation. Adding *whose* it must be ("it belongs to somebody
this card has already put on the page") killed the mold outright and produced the best writing of
the whole lab: a knife cleaned and sharpened this morning though its owner is gone; a boot set
neatly by the door; the missing man's keepsake resting on the foreman's bench.

**L19. A DEALT STRING IS PASTED WHERE IT LANDS — so it must be grammatical there.** Measured hard,
twice over. The old beat-1 pay envelope survived **36/36** generations and the stake rumour
**35/36**, including in an arm whose prompt explicitly said *"the rumour is cut"* — ~25 of ~80 words,
a third of the card, immovable by instruction. The corollary bit back the moment the pay was
reshaped: dealt as a bare noun phrase (`"the agreed coin, and what the road turns up"`) it landed
appositive and shipped as *"…watch who tends the winter road, payment the agreed coin and what the
road turns up."* Every dealt clause now carries its own verb. **The strongest form of this law: if
you want a sentence on the card, deal the sentence.**

**L20. …which means a pre-shaped string you deal is a STAMP you built yourself.** `standsAgainst`
was dealt as `a ${trade} who means ${want}` and appeared on **6 of 6** live cards as "A trader means
to keep…", "A soldier who means to hold…", "An acolyte means to assert…". It is two atoms now, as
`arrival` is, and the writer must build the sentence. L19 and L20 are the same fact from both ends:
**deal a sentence only where you want that exact sentence; deal atoms everywhere else.**

**L21. A payload KEY that reads like card English becomes card English.** *"Known obstacles are that
scavengers…"*, then after renaming, *"What stands against this is a hunter who…"* — the field name
became the sentence, twice, under two names. `KEYWORDS` is the one label in this codebase that has
never leaked, and it earns that two ways: a shouted, un-Englishy key **and** an explicit
never-print-the-label rule. Renaming alone is not the fix; it just moves the leak.

**L22. Count the obligations against the length cap, in sentences, before shipping any prompt.**
Nine blind writer-reports and one zero-context auditor independently did this arithmetic and reached
the same verdict: ~13 sentences of mandated content against a 7-sentence ceiling. *"It guarantees I
break a stated rule on every generation, and leaves the choice of WHICH to chance."* An
over-subscribed prompt does not degrade gracefully — it degrades **randomly**, and the thing dropped
is whatever the model reached last. Every list of required content needs a **keep-in-this-order**
line, the shape the resolve prompt has used for months.

**L23. Fixing one defect by adding emphasis reliably breaks a neighbouring one.** Live, in sequence:
stressing that a name takes no article ("a Meluririe Dawnsinger") pushed bare-name openers from
**1/8 to 5/10** — the very defect the rule existed to prevent. Naming the money sentence as the
tell's home welded the tell to the pay on **5/8**. The safe form of a rule is POSITIONAL and
POSITIVE ("the card's first words say what someone IS"), never a prohibition with an intensifier.

**L24. The lever hierarchy, restated by a writer who had never heard of it.** After a day of doing
the job blind: ***"The dealt facts outperformed my writing everywhere they existed."*** On the best
card of that round the only two live sentences were the engine-dealt `arrival` and `clientTell`,
*"barely touched"*. Nine reports, three rounds, one conclusion — and it is §0 #2, arrived at from
the other side.

## PART 2 — literature, and how it lines up

- **The "pink elephant" problem — negative instructions are weak.** To suppress a concept the model
  must first activate it; guidance is to state the positive action instead. Matches L3 exactly.
  ⚠️ ACTION: the current card prompt's `NEVER` block is large. Converting bans to positive
  requirements is a live candidate lever — but it must be BENCHED, because several of our bans
  (open on the trouble, no distant perception) are currently doing real work.
  <https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis>
  · <https://gadlet.com/posts/negative-prompting/>
- **Few-shot collapse / verbatim example copying.** Performance peaks at some number of in-context
  examples then DECLINES, and copying the example verbatim is a documented failure mode; diversity
  drops as the model mimics the limited patterns in context. Matches L4 and our exemplar result.
  <https://dev.to/shuntarookuma/when-more-examples-make-your-llm-worse-discovering-few-shot-collapse-106i>
- **Lost in the middle / primacy + recency.** Models use information best at the START and END of
  context and degrade in the MIDDLE; long instruction blocks cause "instruction dilution". This is
  the mechanism behind our §0 #3 (move the load-bearing rule to the END anchor) and behind the
  measured "stake demand only fired 6/6 once moved to END-position rule 5".
  <https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long>
  · <https://arxiv.org/pdf/2508.07479>
- **JSON mode degrades creative writing.** Constrained decoding masks tokens that would violate the
  schema, and the guidance is explicitly to avoid JSON mode for narrative/creative fields.
  ⚠️ UNTESTED HERE AND POTENTIALLY BIG: every card and report we generate runs under
  `response_format: {type:'json_object'}`. Candidate experiment: same prompt, prose out with plain
  delimiters vs JSON, blind-judged. Constraint: the single-call ruling forbids a second extraction
  call, so a win would have to be captured by parsing delimited text, not by adding a call.
  <https://towardsdatascience.com/structured-outputs-with-llms-json-mode-function-calling-and-when-to-use-each/>
- **Mode collapse / verbalized sampling** (ICML 2026) — asking for a distribution of candidates
  restores diversity. PARKED: it costs extra generations and collides with the single-shot ruling.
  <https://openreview.net/forum?id=9jQkmGunGo>
- **Generic small-model advice** (few-shot, chain-of-thought, more detail, step-by-step) — noted and
  largely CONTRADICTED by our own measurements: exemplars gave +0.5 alone and nothing stacked, more
  reasoning effort bought zero on cards, and every "elaborate more" nag backfired. Weight measured
  project results above generic guides.
  <https://web.dev/articles/practical-prompt-engineering>

## The shape that actually worked (champion P10, for reference)
Register/frame → what the inputs are → the four things the card must do IN ORDER, each pinned to a
ground → how it reads (cohesion + length) → a short NEVER list → output spec last. Requirements as
DOs, no examples anywhere, no questions, no speech permission, and the load-bearing constraints at
the end.

---
# L12 — PERMISSION ⊂ MANDATE ⊂ DEALT MANDATE
*(measured 2026-08-25, 5 arms × 24 cards, one seed; corroborated by four independent prompt-writers
who each reached the same law from a different direction)*

The single most useful thing learned in the independent-writer round. Three grammatical moods, three
completely different outcomes:

| you write | you get |
|---|---|
| **permission** — "you may use names" | **nothing.** 24/24 cards keep the default frame. (This is L10 restated: a cheap model reads permission as prohibition.) |
| **mandate in prompt text** — "give the person a name" | **ONE new shape.** The feature installs (names 3/24 → 16/24) but every card gets the *same* one, because prompt text can only hold one value. |
| **mandate + the value DEALT per call** | **N shapes at no quality cost.** Distinct openings 1 → 10, lint-clean unchanged at 92%. |

**A feature is installed by a MANDATE. VARIETY is installed by a mandate that is DEALT.**

Corollaries, each paid for:
- **Variety can never come from prompt text.** Not from asking for it, not from listing alternatives,
  not from a rhythm rule (w1 measured −0.45), not from telling the model to vary. Prompt text holds
  one value; that is a property of the medium, not of the wording.
- **Descriptive dealt values are advisory and lose to the model's default frame.** Dealing
  *"open on a physical object; let who and why arrive after it"* changed almost nothing. The dealt
  value must be a COMMAND or a LABEL, not a description.
- **But anything that reads as writable English gets PRINTED.** Dealing whole commands put "Begin"
  at the head of 10/24 cards; dealing bare noun phrases put "a physical object" at the head of 7/24.
  Deal a token that cannot sit in period prose (a bare category label), and…
- **…ban printing it in the very next clause.** Isolated by accident when a patch failed to apply to
  one prompt but not another: **same labels, same rotation, 21/24 paste without the adjacent ban,
  2/24 with it**, with the variety gain fully retained. This is the second independent confirmation
  of L3 (adjacent bans work, no pink-elephant rebound); w4 separately measured 5/24 → 0/24.

# L13 — THE COPY LAW IS ABOUT CONCRETENESS, NOT ABOUT EXAMPLES
We had been recording this as "examples get copied". Wrong emphasis. w4 measured a *rule* carrying
five concrete fragments leaking at **24/24** — worse than any demonstration block it wrote (5/24).
Stripping every instance dropped it to 0/24.
**Any concrete instance ANYWHERE in the prompt is copied, and the rate scales with how neatly it fits
the slot the model must invent into.** Rules beat examples only because abstract instructions are the
only kind that *cannot* be pasted — not because rules are privileged.

# L14 — DEMONSTRATION SHOWS A REGISTER; IT DOES NOT INSTALL A FEATURE
Blind three-arm, same job and fixtures: rules-only **8.0** median, rules+demo 7.0, demo-only **4.5**.
The demo-only arm had FOUR of eight demonstration cards containing spoken dialogue and produced
**0/24 voiced outputs**; one sentence of rule produced 21/24. A demonstration cannot suppress a
default and cannot install a feature — it only tints the register.

# L15 — MATCHING A CORPUS STATISTIC CAN HURT
w2 pushed its aside rate to the reference's measured 33% and scored *below* leaving it alone (it
over-fired to 87%). The reference's headline rates are subsidised by things we cannot copy: 255/555
of its cards name a RECURRING NPC, and its ellipsis rate is a Chinese-translation artefact.
**Measure the corpus to find your gaps; do not target its numbers as goals.**
Related, from w2: **implementing its own judges' top recommendation cost 1.2 points** — a mechanism
copied without the anchoring that made it work in the original is worse than its absence.

# L16 — WHICH BANS WORK: ban a PASTE, never a BEHAVIOUR
Two results looked contradictory and are not:
- **Adjacent bans WORK** on copying a dealt value. Measured three times: 5/24 → 0/24 (w4, demo props),
  21/24 → 2/24 (mine, dealt labels), 4 → 2 `dealt-paste` (w2, the `ask` line).
- **Adjacent bans BACKFIRE** on a writing behaviour. w2 banned "restatement" with a test attached and
  scored **5.19 vs 5.78**, hit rate 12% vs 31% — textbook pink elephant.

**The rule: a ban works when it forbids REPRODUCING SOMETHING PRESENT IN THE PROMPT, and backfires
when it forbids a way of writing.** The first is a mechanical check the model can apply by comparison
("is this string in my input?"). The second requires holding a negative property in mind while
generating, which at low effort just raises the property's salience.
For a writing behaviour, **state the positive mechanism only** and let the wrong behaviour fall out.

# L17 — ATTACHMENT ≠ REPETITION (the sign was backwards)
We spent a round believing closers failed because they did not connect to the scene. Two independent
routes proved they already did — a splice test (transplant each closer onto the next card's body and
see if a blind reader notices: **96–100% detection**, i.e. ceiling) and the judges' own audits (our
control dangled **0/10**; the GOLD STANDARD dangled **2/10**).
The real measurement, inverted:
> **A closer that repeats a noun from the scene is not ATTACHED, it is RESTATING.**
> Reference **25%** noun-repeat; ours **71–83%**. Reference closers carry a median **6 new content
> words**; ours **3**.
> **The reference attaches WITHOUT repeating — it introduces new material whose damningness is
> inferential.**
The rule "never introduce an object the card has not already put on the page" *manufactures* the
restatement it was written to prevent. Releasing it did not help either: **the model will not
introduce genuinely new material at this size no matter how the rule is phrased.** Unsolved.

**Methodological warning, paid for twice this session:** "the most common failure in a batch" is NOT
"what separates the best from the rest." Dangling referents were the #1 failure by unanimous judge
agreement AND were absent from the control AND present in the gold. Always check whether the defect
you are chasing discriminates between the arms before spending a round on it.

# L18 — THE §0 HIERARCHY, DEMONSTRATED END TO END (2026-08-25)
The cleanest single case this project has of *why* input shaping outranks wording.

**The defect:** a card read *"A cask of **election milk** was stolen from Oakthorpe."* Two keyword
atoms from different pools — `election` (a happening) and `milk` (a thing) — welded into one
unreadable noun phrase.

**Three WORDING fixes, all failed:**
1. Turned the rule from permission into a mandate ("Take ONE, or none"). Still welded — **and the
   rule contradicted the engine**, which deals 3–4 atoms on purpose because pool MIX drives variety.
   Reverted.
2. Banned welding explicitly ("NEVER weld two of them into a single name or thing"). Still welded.
3. Added a concrete example to the ban — **rejected by the compiler**, which incidentally prevented
   an L13 violation: the example would have been a concrete instance free to leak.

**One INPUT-SHAPING fix, worked immediately:** label each atom by its axis in the engine —
`bond: … · happening: … · thing: … · quality: …`. The writer can no longer read two atoms as one
compound noun, because they are visibly different kinds. `milk` became a milk cask; `election` became
a rival candidate.

**Wording is lever #4 and lost three times. Shaping is lever #2 and won once.**
When a prompt rule has to be repeated or strengthened, stop writing rules and ask what shape the
INPUT would have to be for the defect to be impossible.

**Corollary, hit twice in one session:** before adding a rule, check whether the engine already does
something deliberate in that area. Two of my prompt edits (a saga pay rule, this keyword mandate)
contradicted deliberate engine design and had to be reverted. A contradiction inside a cheap-model
prompt is worse than either instruction alone.
