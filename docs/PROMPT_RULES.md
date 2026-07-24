# PROMPT_RULES.md — how to write airaider's AI prompts

**Status:** living rules, distilled from dogfshooting (read with [STORY_ENGINE.md](STORY_ENGINE.md)).
Check this before editing any prompt in `core/openaiNarrator.ts`. The engine owns numbers + structure;
the AI owns fiction. These rules are about getting good, coherent fiction out of a model that knows
**nothing** about our game.

## 0. Written for CHEAP models — the prompt budget is the first constraint *(designer ruling 2026-07-12)*
We run budget models (gpt-5-mini at low/medium effort). A rule that exists but sits in a wall of text
does NOT exist for these models — every rule added dilutes every other rule.
- **Adding a rule requires paying for it**: merge it into an existing rule or cut something first.
  Prompt growth is a regression even when every line is individually right.
- **Structure over volume**: fenced, headed sections (the TAG VOCABULARY pattern) hold; buried
  mid-paragraph clauses don't. The load-bearing constraint takes the section-header position.
- **When a rule is ignored twice at the model's effort tier, stop rewording it** — enforce it
  mechanically (engine seed, input shaping, schema transform) per §2, or accept the cost.
- Judge every prompt against the CHEAPEST model that will run it, never against what a frontier
  model could follow.
- **"The AI didn't follow the instruction" is a prompt-design bug report, not a model complaint.**
  The question is always "how do I make this instruction one the model WILL follow" — and the answer,
  in order of measured effectiveness: (1) engine enforcement — don't ask; (2) input shaping — deal
  concrete data (a literal ban-list, a withheld field) instead of an abstract rule; (3) structure —
  fenced, headed section; (4) wording — the weakest lever; (5) more model/effort — measured ZERO
  judge-score return at 2.3× cost on this project (seeds 39019 vs 40020, 2026-07-12).
- **Position, once, no contradictions** *(2026-07-13, external research + measured here)*:
  (a) small models weight the END of the prompt — the critical rules and the output schema go LAST
  (measured here: +2.2/10 on cards from this alone); (b) every rule stated EXACTLY ONCE — OpenAI
  measured deleting repeated rules at +10-15% score and −66% tokens; move a rule to its best
  position, never duplicate it; (c) NEVER ship a contradiction for the model to arbitrate — a
  "where X and Y disagree, X wins" clause means the prompt should be TWO prompts; small models
  fail contradiction-resolution almost universally.

## 1. The AI is STATELESS and has NO game context
It sees only what THIS prompt hands it. It does not know prior calls, our code, or our jargon.
- **Never use internal/game-dev terms.** Words like **"beat"**, **"slot"**, **"arc step"**, "chain",
  "finale flag" mean nothing to it (or worse, mislead). Say it in plain fiction terms: "the next job",
  "how many mercenaries the company sends", "the closing job of this story".
- **Hand it the context it needs each call** — who's on stage, what's already happened (chain state),
  what the player can see. Don't assume it remembers.
- **Tell it the player's POV.** The player runs a mercenary company and reads jobs on a **JOB BOARD**
  at the fort, then sends mercs. Frame every job as something postable they'd choose to take.

## 2. Repetition → inject an ENGINE SEED, don't nag
If the model defaults to the same shape (every story a wolf-witch; every scene "X staggers to the gate
at dusk"), the fix is **not** "VARY THIS!!" in the prompt — that barely works and bloats it. The fix is
to **feed a random seed from the engine** and let the model fuse it:
- theme **keywords** (seeds.ts) decorrelate the genesis story;
- engine-picked **place / tone / arrival-mode / time-of-day** decorrelate scenes;
- engine-rolled **twist (~30%)**, cast count, choice placement.
Validated repeatedly: engine-seed-then-let-AI-vary beats asking-AI-to-vary. So prefer adding a seed
token over adding an instruction. (Then you can DELETE the nagging "vary the X" lines.)

## 3. Engine decides numbers/structure; AI PROPOSES within fiction
The split is "engine owns the dice, AI owns the prose." Where the AI's fiction should *influence* a
mechanic, use **AI-proposes → engine-decides/caps**, never AI-sets-the-number:
- the beat proposes a reveal/loot flavour → the **resolution** (knowing the dice) decides what actually
  lands, scaled to the outcome;
- the resolver proposes the **reward KIND/label** → the engine validates & grants from the budget (F6); side-loot = an engine-set per-beat budget deducted from the bank;
- the genesis proposes **which arc steps afford a branching choice** → the engine caps how many.
A pure-engine roll is fine when fiction shouldn't drive it (twist %, failure budget). Let the AI propose
when the *story* knows best (is there loot here? does this step branch?).

## 3a. The player is a MERCENARY BOSS who wants GAIN — every job must answer "what's in it for us?"
*(2026-07-18 R1 "sell the stake", blind-benched +1.25 and boss-pull 5-0: beat-1 SAGA cards close on an
engine-dealt `stake` rumor line — the WHOLE matter's worth in world words from the chain envelope
(recruit/ransom/hoard by payoff band; personal sagas NAME the soldier — an anonymous "one of our own…
them" judged as pasted boilerplate). Rumor-toned so a slip breaks no promise; the demand lives as
conditional rule 5 in END position — buried mid-paragraph it fired ~50%, end-position 6/6.)*

The player runs a fort for profit; they are NOT a do-gooder. What they want: **coin**, **recruits**
(skilled people worth bringing into the company), **captives** (to ransom or hold), **salvage/loot**,
and **threats to their trade/fort removed**. So every job's intro MUST make the company's concrete
**gain** plain — woven into the fiction (the petitioner *offers* coin / a favour that pays / a thing of
value; the quarry is *worth taking*). An emotional plea alone ("save the orphans/puppies") is NOT a
reason for a mercenary — attach the payoff. Never a job with no gain for the company. (Keep the gain
*in-fiction*; don't surface mechanical "banked payoff" text — see the reward UX in REWARD_BANK.md.)

## 4. It's a QUEST CHAIN, not one quest
Genesis designs a **chain**: a sequence of linked jobs the company takes one at a time. Each job must
**stand on its own** (a clear, concrete reason to take it) AND the bible threads them into **one coherent
story**. Don't let the bible read as a single quest or a vague mood piece.

## 5. Anti-cliché: ban concrete TOKENS, not abstractions
"Avoid clichés" does nothing. Ban specific words/patterns (`weight`, `shadow`, `burden`, `fate`,
`the spoils`; titles like `The Weight of X`, `Whispers of X`; openers like "the dice fall/fate decides").
Require concrete proper nouns. Keep the ban list — it earns its keep.

## 6. Length scales with stakes; give a HARD ceiling
Resolution caps by rarity, **set from the reference band, not guessed** *(2026-07-18: Fort of Chains
outcomes measured 60–250w from source, Sultan's "a couple short paragraphs"; our old caps sat at the
70w minimum and the designer felt the thinness)*: common → before ≤35 / after ≤75, uncommon ≤45/≤95,
rare-or-finale ≤60/≤125 — blind-benched vs the old caps (5.8 vs 5.2; the batch's best scene needed the
room). The model treats a range as loose and **overshoots ~25%** — state the upper number as a **HARD
CEILING**, and pair any raise with "length is room, not a target — fewer words is BETTER". Watch class
when raising: investigate scenes fill spare room with evidence-inventory waffle. Calibrate by READING
outputs on the prosebench, never by asserting numbers.

## 7. Readability + orient-once
2–4 clean sentences a player reads once — not telegraphic fragment-stacks ("Grey morning. Mud. A man.")
nor comma-splice run-ons. Orient a person ONCE on first appearance (natural apposition, not parens);
pass the already-met list so the AI uses bare names thereafter.

## 7a. System prompt is BYTE-STABLE; all variable data in the user message
The system prompt (schema + instructions) is the prompt-cached prefix — it must not vary per call
(STORY_ENGINE §10.2). Never interpolate per-call data (word budgets, step counts, twist flags, caps)
into it; put those in the user message ("the cap given in the user message") and have the stable text
reference them. Conditional rules (twist vs straight) live in the stable text as both branches, selected
by a user-message flag. Implemented 2026-06-11 for outcome + genesis.

## 8. PRINCIPLES, not instance-patches (prompts AND code)
When a bad output or bug surfaces, do NOT patch in the instance that failed ("never open on the boss
finding a cart"). State the PRINCIPLE that makes the whole class impossible ("the boss is never in the
field; write only what reaches the fort"). Instance-patches are brittle — the next failure is a sibling
of the last one, not a repeat — and concrete examples in prompts are STICKY (the model copies them).
The system fits together as: instructions = principles (this rule) · variety = engine seeds, not
examples (§2) · bans = concrete tokens, the one place specificity wins (§5). Same discipline in code:
fix the class, not the case. (Designer ruling, 2026-07-05.)

## 9. How to change a prompt
Edit → **read real outputs** (run a `_exp_*` harness with the real AI, or `/playtest`) → judge the prose,
not the diff → iterate. Offline gates (selftest/looptest/conformance) use the Mock narrator and only prove
no *breakage*; they can't judge prose. See the **playtest** skill.

## 10. Prose STYLE steering — the measured laws *(prosebench, 2026-07-18; designer-verified on sagas)*
How the reports went from "clear but dead" (4.5) to good (6.5–7, peaks 8) — all A/B'd blind on the
anchored bench in `v3/scripts/prosebench/` (rubric + frozen anchors + judge protocol). These are LAWS
for style edits; every one below was measured, most the expensive way.

- **~4 style rules is the cheap model's whole budget.** Beyond that, EVERY added directive was
  net-negative per-sample even when it fixed its target class (three independent rounds). To add a
  style rule, CUT one. Corollary of §0, now with numbers.
- **All-negative constraint piles produce telegraphese.** The old block (one fact per sentence, one
  clause, no similes, mood cut) was the CAUSE of the dead prose: a model under pure constraint emits
  the safest generic sentence. Give ONE positive register line ("plain words, real events, no
  ornament — every sentence earns its place by what happens in it") and few positive rules.
- **The shipped four** (resolve prompts, `openai.ts`): vary rhythm — the SHORTEST sentence for the
  moment that matters · ONE quoted line where it changes something (the single cheapest lever: judges'
  best moments are always the spoken line) · anything uncanny acts by its strange nature or stays off
  stage (a wonder two hired guards could replace is furniture) · LAST sentence is an act, image, or
  spoken line — never a tally, never what it meant. The last-sentence rule sits in END position (§0);
  in short-form the final line dominates the read.
- **Exemplars underperform rules here** (+0.5 alone, nothing on top of rules) — contra the general
  literature; our register line + rules already carry the voice.
- **Prompt-side shape rotation STAMPS**: 3 rotating molds = 3 visible stamps (half the reports ended
  on palms). Variety is an INPUT-shaping problem (engine seeds per §2 — e.g. archetype-weighted speech
  demand), never more prompt directives.
- **A cheap model treats permission as prohibition** *(batch N, 2026-07-24)*: "dialogue is not
  required, only where needed" → ZERO dialogue in 14 reports. Optional behaviors happen only when
  PUSHED — and a flat always-push metronomes (one quote in 16/16 reports, plus summarize-then-staple
  quotes). SHIPPED: condition the push on ENGINE DATA (sceneMode: social scenes invite a 2-voice
  exchange, others get the neutral rule) — "sometimes" must come from input shaping, never from
  trusting the model's judgment or a bare option. Full samples: prosebench/SAMPLES_SPARSE_AB.md.
- **Bench before ship**: any style change is judged on the SAME frozen anchors, blind, ≥3 judges with
  the calibration holdout; batch effects run ±1, so ties are settled by SAME-batch head-to-head.
- **Known residuals are STRUCTURAL** (resistant to wording, don't re-try rules on them): finale
  fate-formula echo, deliveredSummary loot pastes, parley pivots summarized when the speech demand is
  scene-blind, same-ground chain monotony (arc-skeleton). 🟡 **One-off CARD briefings never got this
  pass** (designer 2026-07-18: sagas good, one-offs lag) — the reference craft is Sultan's Game /
  Fort of Chains: every setup's LAST sentence is a vector at the player's decision; each card
  WITHHOLDS exactly one named thing; failure plays deadpan; restraint at the extremes.
