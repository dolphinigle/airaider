# PULL LAB — standing anchor (2026-08-24). READ THIS FIRST after any context loss.

## ⛳ THE BIG PLAN — re-read at the END OF EVERY STEP before deciding what to do next

**THE JOB IS DESIGNING A PROMPT.** Everything else — the corpus, the measurements, the guideline —
is scaffolding for that one deliverable: a system prompt that makes gpt-5-mini write quest cards and
resolutions at the quality of the designer's Sultan's Game samples, MOST of the time, on real engine
payloads, at shipped cost. If an activity is not moving that prompt forward, it is off-task.

- **Step 1 — CAN the cheap model do it?** ✅ DONE. Yes; it was a prompting failure, not a model
  ceiling. Same model, same effort, same cost — only the prompt changed.
- **Step 2 — HIT RATE.** ✅ reached 83% on the OLD rubric (P26) — then the designer judged the output
  "still not great" and supplied the real target, which invalidated that rubric. See step 2b.
- **Step 3 — REFERENCE RESEARCH.** ✅ DONE and audited (3 adversarial audits, no fabrication).
  Output: `GUIDELINE.md`, self-audited 8/8 against the designer's samples. Corpus in `research/`.
- **Step 2b — REDESIGN THE PROMPT AGAINST THE GUIDELINE. ← CURRENT, and this is the whole job.**
  Rewrite from the guideline, not by patching P26 — P26's core mandates (four sentences, 15-word
  cap, restitution frame, scenery opening) are the things the research falsified. Measure the hit
  rate on real payloads from `pullfixtures.ts` across many situations; report passes/total, never a
  peak.
- **Step 4 — BLIND BENCH** against the shipped prompt under the frozen prosebench protocol.
  Nothing ships without winning it.
- **Step 5 — SHIP** into `src/ai/openai.ts`, then re-playtest the full surface.

**Tools already built — use them, do not rebuild:** `scripts/pullfixtures.ts` (captures real
`writeQuest` payloads from the engine via MockProvider, zero API cost) · `scripts/pullbatch.ts`
(stratified batch over those payloads + log-only lint telemetry + the PAY_ARRAY / ODD_ACTOR input
switches) · `scripts/pullprompts.ts` (the P1–P26 lineage, each variant carrying a comment recording
what it broke) · engine seeding for variety · `prosebench/` frozen anchors and judge protocol.

**End-of-step ritual:** state which step finished · report the number with its denominator · re-read
this plan · name the next step and its bar · update the ROUND LOG. Rulings stay with the designer.

## THE GOAL (do not drift from this)
Master plan step 1: **gauge whether gpt-5-mini can write a GOOD, MOTIVATING card at all.**
Designer's hypothesis: this is a PROMPTING failure, not a model ceiling — the shipped prompt is not
tailored for a cheap model. Scope of this step = ONE fixed situation (q9 Peatmoss washing), prose
only. NOT shipping anything yet. NOT touching src/. NOT redesigning the game.

## THE BAR
Beat the shipped baseline on all three axes in `CARD_PULL.md` (QUALITY · READABILITY · PULL), judged
against that file's numbered defect list. Baseline = q9, ~3.5/10. Target = the hand-written card at
the bottom of CARD_PULL.md.

**From step 2 on, the bar is a HIT RATE, not a peak.** A card PASSES only if it carries all four —
a seen trouble, a cost to a named someone, one outcome, and one unexplained human trace — with no
axis-1 or axis-2 defect from CARD_PULL.md. Report `passes/total` over a spread of fixtures. A
cherry-picked good card is not evidence; a batch is.

## HOW TO WRITE THE PROMPT (measured; full note in `CHEAP_MODEL_PROMPTING.md`)
Cheap-model laws this lab established, in the order they bite: every rule's OWN WORDING becomes a
template · question-form rules get answered inside the prose · a ban is broken by whatever nearby
rule makes breaking it the cheapest compliance · examples inside rules are copied verbatim · there
is a FLOOR on rule mass (cutting to a third collapsed register and coherence) · input shaping beats
any wording · pinning a requirement to ground the card already contains stops the model inventing
a mold. Literature that lines up: pink-elephant negative instructions, few-shot collapse,
lost-in-the-middle. Untested and possibly large: JSON mode degrading creative prose.

## FIXED CONDITIONS (a win only counts under these)
- model gpt-5-mini, `reasoning_effort: low`, chat.completions, json_object — same as shipped.
- inputs = `scripts/pulllab.ts` USER_INPUT, the real engine payload for q9 (`rewardEnvelope: 'coin'`
  — one word; game.ts:907. My first fixture wrongly used a prose envelope and manufactured an echo).
- prose only: {title, situation, job}. Dice `ask` fields deliberately dropped.
- run: `cd v3 && npx tsx scripts/pulllab.ts <P1..Pn> [n]` · variants in `scripts/pullprompts.ts`.

## STANDING LESSON (the biggest finding so far)
**Every distinctive phrase in the prompt becomes a template in the output.** Not just examples —
RULE WORDING too. Each round, the newest rule's own words came back 4-5/5. This is §8 (principles
not instance-patches) biting at the level of *how a rule is phrased*, not just what it exemplifies.
Corollary: state requirements as a TEST the writer must pass, never as a form of words.

## ROUND LOG
| v | change | result |
|---|---|---|
| baseline | shipped prompt | q9. No want, no cost, no open question; answer leaked; pay boilerplate. ~3.5 |
| P1 | tailored: 4 requirements (seen trouble / cost to client / one outcome / one unexplained thing) + cohesion rules | **Big jump — pull appears.** Defects: prose envelope quoted verbatim; first-person drift; scope ballooned to whole-camp; oddity = gimmicky portent; 117-149w |
| P3 | third-person register, envelope-is-a-system-note, oddity must be REPORTED, hard word budget | intake pasted verbatim as opener 3/4; job line assumes a cause; cost bloated; 101-112w |
| P4 | kill messenger opening, ONE concrete cost, strip pay/plan from job line | opener + cost fixed. `"coin"` quoted literally; "wants it fixed because" 4/4 template; lizard prop 4/4 |
| P5 | de-stick rule wording, pay = payer + means, allow one spoken line | **regression.** My examples went 5/5 sticky ("the crew's winter chest"); the one spoken line was spent on the pay 4/5; outcome sentence broke twice |
| P6 | ALL examples removed, speech withdrawn, oddity redefined as a HUMAN TRACE | **best so far.** Human-trace oddity 5/5 and genuinely good (ribbon looped over the empty peg). Left: rule wording sticky again ("bears it", "He needs…", "coin from the crew's ___" 5/5); 83-107w |
| P7 | §0 test: one third the rule text, no fixed order | **regression — rule mass matters.** First-person drift, POV breaks ("none of us put it there"), `The foreman says coin.`, lizard back as a prop, order-free = incoherent. P6 > P7 |

| P8 | every requirement restated as a QUESTION the card must answer | **regression, and a new failure mode: the model ANSWERS THE QUESTION INSIDE THE PROSE** ("When the company returns the huts will hold an answer" 5/5). Speech returned 5/5 despite the ban; 131-160w; "what it takes them to pay" bred melodrama ("I pried it from the men's rum") |
| P9 | P6 + neutral rewording of its three leftovers | no gain; speech back 5/6 (the pay rule's attribution is cheapest to satisfy with a quote); cost-to-client went vague; trace collapsed to "a child's <garment> … no one can say who left it" 6/6 |
| **P6 on fixture B** | champion re-run on a DIFFERENT situation (rescue / chalk downs / drover / salt debt) | **decisive**: the cards differ completely in content, so sibling-ness was NOT a same-input artifact — but three templates survived the change and are therefore PROMPT-BORNE: "He needs X back" 4/4 · "he will pay coin from his purse" as its own dead sentence 4/4 · "a child's <garment>" trace 3/4 |
| **P10** | P6 with exactly those three killed: outcome+pay merged into one sentence; the trace must belong to someone the card already put on the page; "do not add that it cannot be explained" | **CHAMPION.** All three templates gone 6/6. Length 73-90w (was 83-107). Traces became strong and specific — a knife cleaned and sharpened this morning though its owner is gone; a boot set neatly by the door; the missing man's keepsake resting on the foreman's bench |

## VERDICT ON STEP 1
**gpt-5-mini is capable.** Same model, same `reasoning_effort: low`, same inputs, same cost as
shipped — only the prompt changed. Cost-to-the-client, an open question, seen detail and sentence
cohesion all appear RELIABLY (6/6), which the shipped prompt produces in 0/1. The designer's
hypothesis holds: this was a prompting failure, not a model ceiling.

## P10 SCORED AGAINST THE STEP-2 BAR (done at the step-1 close, so the next step starts honest)
Champion batch, fixture A, n=6, pass = all four elements present with no axis-1/axis-2 defect:
**2/6 clean pass** (#3 the keepsake on the foreman's bench, #2 marginal), 4/6 fail — #1 cost isn't a
cost + scope widened to plural "hands"; #4 mood-cost + doubled outcome; #5 lost the person entirely
and wrote a tidy-the-huts errand; #6 mood-cost + doubled outcome. The PEAK is ~7 and the HIT RATE is
~33%. Step 1 asked for the peak and got it; step 2 exists precisely because the rate is not there.

## P10'S REMAINING DEFECTS (for the next step, not fixed here)
1. "The foreman tends / keeps / watches / has stayed" 6/6 — rule 2's own wording, still sticky.
   Every round proves the same law again; assume ANY rule phrasing will be echoed and budget for it.
2. The cost-to-client drifts toward mood when the model has no concrete loss to reach for
   ("his lamps guttered", "his cooking pot sits cold"). It needs a loss it can SEE.
3. Double outcomes creep back in ("brought back **or the huts put right**") — rule 3 carries two
   clauses now (outcome + pay) and the model sometimes splits the first one.
4. One run in six loses the person entirely and writes a tidy-the-huts errand (#5).
5. Scope still widens occasionally ("the missing hands", plural).

## STEP 2 — HIT RATE ON REAL ENGINE PAYLOADS (2026-08-24)
Tooling: `scripts/pullfixtures.ts` captures REAL one-off `writeQuest` payloads by driving the engine
with MockProvider (zero API cost) — 146 captured, 7 archetypes, 3 gravities, both slot counts.
`scripts/pullbatch.ts` runs a variant over a stratified sample, one card per payload, with log-only
lint telemetry. All rarities came out `common` (uncommon/rare need deeper campaigns) — KNOWN GAP.
Second known gap: 29/146 payloads carry `framedCharacter` and need a `quarryTags` output this lab
does not yet produce; they are EXCLUDED from the pool, not silently dropped from the denominator.

| run | change | hit rate (my read) | what it moved |
|---|---|---|---|
| P10 | champion, real payloads | **3/14 (21%)** | fell off a cliff vs the single-fixture lab — real payloads carry PROSE pay envelopes |
| P10 + PAY_ARRAY=1 | envelope sent as an array | 7/14 envelope-echo, unchanged | array alone does nothing — the gloss IS prose |
| P10 + PAY_ARRAY=2 | envelope sent as bare tokens (`salvage-rights`, `a recruit`) | **~6/14 (43%)** | **envelope-echo 7 → 0.** The single biggest measured win of step 2, and it is an ENGINE fix, not a prompt fix |
| P11 | + account-book ban restored, pay attribution demand dropped, trace pinned to a named trade, duration de-stuck | length exploded, 10/14 >95w | a sentence count with NO word cap lets sentences balloon (127w) |
| P12 | P11 + word cap restored beside the sentence count | ~3-5/14 | lint 11/14 clean, but quoted pay returned 2/14 and new order/referent breaks appeared |
| P13 | **pay removed from the prose entirely**, `rewardEnvelope` not sent | ~2-4/14 | pay defects gone; the model immediately filled the freed sentence with the INTAKE string instead |

### Findings that outrank any wording change
1. **The pay sentence is redundant with the interface.** Both UIs already print the reward beside the
   card — `cli/format.ts:155` (`REWARD envelope:`) and `web/App.tsx:221` (`<b>REWARD:</b>`). Every
   defect family around pay (verbatim echo, quoted pay, dead "he will pay coin" closers, invented
   chests and purses) exists to satisfy a requirement the UI already fulfils. **DESIGNER RULING
   NEEDED** — removing it is a design change, and the shipped prompt deliberately requires pay
   ("they work for PAY, never a payoff-free plea").
2. **`game.ts:907` pre-shapes pay glosses "to read whole if pasted" and joins them with `' + '`.**
   True for one kind, false the moment two join: cards printed `pay with "first claim on what the
   road yields + coin"`, plus sign included. Bare tokens fixed it outright (7 → 0).
3. **My "the fort perceives nothing at a distance" rule CONTRADICTS the engine's own intake pool** —
   `the walls have a view of it`, `the signs of it are plain from the walls`. The model obeyed the
   data and broke the rule (`The fort's walls look out that way and watched the whole morning`).
   Reconcile: the rule must except matters the engine marks as wall-visible.
4. **Remove one crutch and the model grabs the next.** Killing the pay sentence did not free the
   budget for the cost and the trace — it freed it for the INTAKE string, pasted as its own sentence
   on 3/14. Any "stop doing X" needs a positive assignment for the space X occupied.
5. **L1 caught in the act**: P13 wrote *"A trace from the missing keeper lies half-buried..."* — my
   own rule word `trace` in the prose.

### Honest limit reached
P10-tokens / P12 / P13 differ by less than my own judging noise, and my scoring visibly drifted
harsher across the batch. **Single-author scoring is now the bottleneck** — separating these needs
the step-3 blind bench, not another wording round.

## READABILITY-FIRST ROUND (designer: "readability >>> everything") — P16 → P23
Trigger: a COLD READ of my own prompt (P14) found three self-contradictions the bans had been
papering over. Every one had been costing a defect class I was fighting with wording:
- **pay**: the frame and INPUTS said "put it on the card in the client's own words" while NEVER said
  "never put the pay in anyone's mouth" and "nobody speaks aloud". The INPUTS line was INVITING the
  quote I kept banning downstream. Five variants of bans; one contradiction was the cause.
- **intake**: "your opening must agree with it" + "it almost never earns a sentence" → the model
  satisfied both by pasting intake as a NON-opening sentence (the 3/14 defect).
- **distant perception**: my rule contradicted the engine's own wall-visible intake values.
Dead inputs also found: rarity/level claimed to set size under a fixed cap; slotCount was explained
but never given a use, so it leaked into job lines ("Send two soldiers...").

| v | change | result |
|---|---|---|
| P16 | readability-first rebuild: contradictions removed, each rule in exactly ONE place, dead inputs cut, and the END ANCHOR switched from the content block to the READABILITY block | readability leapt (55-81w, one person per card, lint near-clean) but substance fell out — costs became trivial inconveniences ("catches his sleeve"), traces decayed to objects lying somewhere |
| P17 | duration folded back into sentence 1; cost guarded against trivial fumbles; trace restored to an ACT | lint 0/14. Costs real again. But a dead 6th sentence appeared AFTER the closer, and my verb list went sticky ("He carried..." 4/5 — the FIRST item in any list becomes the template) |
| P18 | closer pinned last; verb list de-stuck; actor told to rotate | closer last 5/5 and the acts turned genuinely good ("He lashed the bar there himself with a pulley rope"). New fault: a mood/ground filler moved into slot 4 |
| P19 | **sentence arithmetic fixed** — five sentences were demanded but only FOUR contents specified, so the model invented filler. Four things = four sentences | 45-67w, lint 0/14, clean and readable. Remaining: the odd actor was the CLIENT 14/14 |
| P20 | engine-dealt `oddActor` rotation | first attempt used PROSE values and they were pasted as subjects verbatim ("The person who is gone dragged...") — **the identical failure as the pay envelope, caught twice in one session: ANY prose-shaped field gets pasted**. Word tokens then leaked the literal word "client" |
| P21 | LETTER tokens (A/B/C); conjunction list stopped being used to OPEN sentences; pronoun rule stopped producing appositives ("A shepherd, he cannot...") | rotation works with no leaks — missing warden, bystander oarsman, shepherd, client all appear |
| P22 | job line: "ONE VERB and one object" | **overcorrected** — telegram stubs ("Clear access", "Find cause") and one card lost its situation entirely. The cap must be on ERRANDS, not words |
| **P23** | P21 + the anti-stacking test only ("if you need an *and*, that is two errands") | **CHAMPION — 10/14 (71%) by my read, lint 0/14, 52-74w, four sentences each.** Clears the designer's "most" bar |

### P23 is the working prompt. Conditions it depends on (NOT yet in the engine)
1. `rewardEnvelope` dealt as bare TOKENS, not the pre-shaped prose joined by `' + '` (game.ts:907).
2. `oddActor` rotation dealt per card as a LETTER token.
Both are input-shaping changes and both are load-bearing; P23 without them regresses.

### Still open on P23
- 4/14 failures: an act unconnected to the trouble; a job line naming a different target than the
  outcome; a situation/job referent contradiction ("a stranger's pack" → "the foreman's pack").
- "is left carrying it" — rule 2's wording, still sticky. L1 never stops applying.
- Pronoun drift to they/their for a single named-by-trade person.
- KNOWN GAPS unchanged: all fixtures `common`; the 29/146 `framedCharacter` payloads still need a
  `quarryTags` output this lab does not produce.
- **I am still the only judge.** 71% is my read against CARD_PULL.md, not a blind bench.

## BAN-FORM ROUND + CRAFT RESEARCH (designer: "ban words bad… research writing prompts… what makes a story FUN and READABLE") — P24 → P26

### The designer's ban hypothesis, tested (P24 = every ban converted to a positive assignment)
Grounding is real: ironic-process / "pink elephant" (a ban must activate a concept to suppress it),
the documented "Inducing Effect" (negative prompts pull TOWARD the unwanted content harder than
positive ones), and recency bias — the NEVER block sat in the highest-attention slot, planting every
concept it forbade. **Result: P24 ≈ 6-7/14 vs P23's 10/14.** The conversion LOST two classes:
- numbers — the positive rewrite ("Amounts are spoken as a working person speaks them: a cartload,
  the winter's worth") INVITED them, and its example went sticky: "two crowns", "a cartload of coin" ×2.
- account-book — 2 leaks (ledgers, a receipt) against 0 with the short ban.
**P25 then tested SILENCE on amounts — also failed** ("six silver", "twenty swarms").
**LAW (refined):** a ban fails when another rule makes breaking it the cheapest way to comply (pay
quoting — five variants of bans lost to one inviting INPUTS line). For a CLOSED, CONCRETE class
(numbers, ledgers) a short ban beats both silence and positive rephrasing. Ban the noun, assign the
behaviour.

### Craft research applied (full note in CHEAP_MODEL_PROMPTING.md)
- **Gopen & Swan topic/stress position** — the strongest readability principle there is, and
  REJECTED as an explicit instruction: stated outright, a cheap model literalizes it into lexical
  echo chains ("…the sexton offers coin. Coin does not fit: the drover took the sexton's iron key.";
  "He offers six silver. He offers six silver, yet…"). Rule 4's implicit form already achieves it.
- **Loewenstein's information gap** — curiosity needs PARTIAL knowledge, not a void: the reader must
  know enough to sense something is missing. ADOPTED: the odd act must TOUCH the trouble (same
  place, same thing, or the person it is about). A stray fact is not a mystery. This fixed P23's
  unconnected-act failures directly.
- **Show-don't-tell / sensory anchor** — ADOPTED, folded into rule 1 rather than added as a demand.

| v | change | result |
|---|---|---|
| P24 | every ban → positive assignment | ~6-7/14 — lost numbers and account-book (see above) |
| P25 | P24 + silence on amounts + Gopen/Swan stated outright | worse — echo chains, numbers returned |
| **P26** | **P23 + information-gap connection + sensory anchor; bans KEPT for the two closed classes** | **15/18 (83%), lint 0/18.** Best result of the lab |

### P26 residual class
When oddActor = "B" (the client), the card occasionally has the client both hiring you AND having
walked off — the strongest pull in the batch when phrased as presence, a contradiction when phrased
as departure (2 of the 3 failures). The third was a garbled outcome clause.

## NEXT
Present the champion samples to the designer against CARD_PULL.md's complaint list. Nothing ships
until it wins a blind bench under the frozen prosebench protocol against the current prompt.
