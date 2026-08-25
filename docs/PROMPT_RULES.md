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

## 11. The RESULT continues the CARD — it never re-tells it 🔒 *(designer ruling 2026-08-24; CORRECTED 2026-08-24 after checking the shipped data)*

**The correction first, because the original wording of this section was wrong.** It said every
result text "opens by repeating its card's intro VERBATIM". That was inferred from the designer's
transcription, which reads *"RESULT: (repeat the before, then)"*. Checked against four shipped
Sultan's Game rite configs (`rite/5000131`, `5000506`, `5000703`, `5000704`): **0 of 21 `result_text`
fields contain their rite's intro.** The repetition is the game UI stacking the card above the
result on screen — a DISPLAY behaviour, not authored duplication.

**The law that survives, and it is the useful one:** the player reads card and result as ONE
CONTINUOUS PASSAGE, so the result must be written as a CONTINUATION of the card — it neither repeats
the card nor re-tells the situation in new words. Our resolver does the second thing today: it
re-imagines from engine facts a scene the player has already read, discarding the card's own images,
client and hook at the moment they would pay off.

What this implies for our prompts (targets — not yet implemented):
- The resolver RECEIVES the card's situation text and writes what happens NEXT. It does not restate
  the situation, and it does not repeat it either.
- Consider showing the card text above the resolution in both UIs, as the reference does — that is
  what makes the continuation read correctly.
- **The card's hook may return as SPEECH at the pivotal moment.** Reference: a card ending "many
  hunters tried to tame it, but all returned empty-handed" pays off mid-result as the guide's
  whisper — *"Many have tried to capture it. All have failed."*
- **Success and failure of the same check may open on the same sentence and diverge at the assigned
  character's verb.** A device, not a rule: present in 5 of 21 shipped pairs, and in 4 of 4 within
  one rite. Verbatim (translated): *"[s3.name] draws and looses, and is still a step slower than the
  griffin's talons"* versus *"[s3.name]'s eye and hand are quick: the arrow blinds its left eye."*
- **The pre-roll text ends on a LEAN, never a resolution** — an aphorism trailing off, a craving, or
  the sent soldier rising to commit by name. Then the dice.
- **The person the card kept anonymous is NAMED in the result.** This confirms anonymity-by-omission
  (§4b) and tells us where the name belongs: the resolver names them at the moment they matter.
- **The last line delivers a FEELING or points FORWARD, never a fact** — a win undercut by a worry, a
  moment of wonder, or a promise of more. Tonal, not formulaic. In the reference, even the failure
  branch plants a hook (*"maybe he will come back again"*).
- Numbers and amounts stay out of the prose; the grant line carries them (already our design, and
  the reference confirms it).

## §12 — INTRODUCE A THING BY WHAT IT IS BEFORE WHAT IT IS LIKE
*(designer ruling, 2026-08-25, from a side-by-side against Sultan's Game)*

The designer's verdict on a shipped one-off card: **"yours is very very unclear… weird things tacked
on it."** The card read:

> *At first light a visitor brought a confession and a plea. A runaway servant took a reed-woven
> token that a kin claims as inheritance. The servant left on the old elf road through the Western
> Forests and is the one who holds the token now. A kin at Oakstead will pay coin on delivery. The
> company keeps the coin and any goods turned up while on the road.*

The designer's model of what it should have been:

> *You woke up early morning to a messenger bringing a plea: to recover a stolen heirloom
> inheritance. A servant of them, who had worked for over 20 years, suddenly disappeared one morning
> with the token. The client promises gold if you are able to track him down.*

### The class (fix this, never the example)
1. **FUNCTION BEFORE TEXTURE.** "a reed-woven token" hands the reader an exotic material for a thing
   they cannot yet place. "a stolen heirloom inheritance" names what it IS and what is wrong with it;
   the weave can come later or never. **A modifier the reader cannot use yet is noise.**
2. **A PERSON IS INTRODUCED BY THEIR RELATION TO THE MATTER, not by a bare category.** "a runaway
   servant" and "a kin" are labels. "A servant of theirs, who had worked for over twenty years"
   carries the betrayal — which is the entire reason the job is worth taking. The relationship IS the
   story; omitting it leaves only bookkeeping.
3. **THE CARD MUST NOT NARRATE ITS OWN LEDGER.** "and is the one who holds the token now" is ABOVE
   ALL rule 2 (*who holds the wanted thing NOW*) surfacing as prose. The ledger is a consistency
   constraint for the WRITER; it is not a fact for the reader. This is §8/L1 again — rule wording
   comes back as output.
4. **PAY IS ONE CLAUSE, CONDITIONAL, HUMAN.** "The client promises gold if you are able to track him
   down" — one clause, and the *if* restates the job. The shipped prompt instead MANDATES a whole
   sentence for pay plus another for loot rights, so 2 of 5 sentences were contract terms.
   For comparison: Sultan's Game job cards carry **no payment language in the card prose at all** —
   it lives in the slot lines and UI.
5. **THE OPENING NAMES WHAT IS WANTED, not the manner of arrival.** "a visitor brought a confession
   and a plea" is two abstractions and zero facts.

### ⚠️ Tension this ruling exposes — flagged, NOT silently resolved
The designer's model card contains **"worked for over 20 years"** — a duration and a number, both
forbidden by `NUMBER_BAN`. That ban exists for a measured reason (the payload carries no such fact,
so the model invents one, and `invented-duration` was a real defect in q9). **But the ban is also
what strips out the concrete grounding the designer is asking for.** The honest options are (a) deal
a tenure/duration fact from the engine so it need not be invented, or (b) relax the ban for
relationship-tenure only. **This is a designer call and is left open.**
