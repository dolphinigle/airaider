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
