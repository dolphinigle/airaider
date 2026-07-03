> **⚠ v2 IMPLEMENTATION SNAPSHOT (non-canonical).** State of the v2 code + learnings; the v3 canon is the README reading order + GENERATION_FLOW.

# Story-generation — current implementation state & learnings

> Snapshot of how the v2 AI story engine works *right now* (`app/core/`), the design decisions and
> WHY behind them, what's been validated by reading real output, and the open questions. Written so the
> understanding survives a context reset. The design intent lives in `STORY_ENGINE.md` / `QUEST_BIBLE.md`;
> this is the as-built + lessons.

## PLANNED — not yet built

- **Engine NAME-SEED (break the name convergence).** Data: left to "invent," the AI converges on a small
  name pool — across dumped bibles, EXCLUDING the 4 starters (Sigrun/Marek/Ivo/Aldric — intended
  recurrence), the invented names repeat hard: Tomas ×14, Lysa ×10, Mira ×9, Theren ×8, Mara/Maera ×10,
  Coren ×5, Sera, Harrow… "Tomas"/"Lysa" recur across unrelated quests. Same failure mode as the
  wolf-witch / fixed-premise convergence. FIX (same principle: engine seed > AI-vary): a curated name pool
  in `seeds.ts` — varied low-medieval / fen given-names + bynames, ideally a few per race
  (elf/lizardman/wolfman read differently). The engine draws a handful of CANDIDATE names (recent-excluded
  like `avoid`/`recentFocalSkills`) and passes them to **genesis** ("name new cast from these / in this
  register; don't reuse recent names") and to **flesh** (delivered characters). Partial is the sweet spot:
  hand a name or register as a SPARK and let the AI adapt it to gender/race. Keep starter recurrence
  untouched (the seed governs only NEW invented names). [User: deferred; do after off-rails.]

## The pipeline (one saga)

1. **Lead pursued** → engine rolls a **focal character** first (tags = the seed of who the saga is about),
   role `npc` until the finale decides their fate.
2. **`genesis(GenesisInput)`** → the **bible**: hidden TRUTH (situation), a **cast** with why-ladders
   (cause→cause→bedrock), `wants`/`feels`/optional `conceals`, **tensions**, **open directions**
   (active/ambient). Narrative-tier model (`gpt-5-mini`), bounded `max_completion_tokens: 4000` (cannot
   run rogue; retries on empty, falls back to mock). The bible is HIDDEN from the player.
3. **`chainBeat(ChainBeatInput)`** per beat → the player-facing quest (`situation`, `job`, `ask`, …).
4. **assign mercs → `endDay` → `outcome(...)`** narration → **`recordBeat`** advances the saga.

### What the engine hands genesis ALONGSIDE the focal's tags (the core architectural insight)

Deriving the story *purely from the focal's tags converges* on ONE shape ("a person with a concealed
truth, under threat of exposure, resolved at a confrontation"). So the engine injects independent seeds
that decorrelate the story from the tags. (`GenesisInput`):
- **The bible is a QUEST, not just drama** (playtest verdict: the conflict-web made great drama but
  the player had no reason to take the job / no stake). Genesis now leads with THE HOOK (why a merc
  company takes it) + THE GOAL (`goal` field — one clear thing to achieve), goal-driven OR mystery-driven
  (don't force a secret; "escort X on an adventure" is valid). Drama serves the goal; the player is a
  PARTICIPANT. Beats each STEP toward the goal; beat 1 makes the job + reason clear; chainBeat gets the
  player-POV. Titles are now actions ("Escort Bren Tholl to the Old Sluice").
- **`tone`** — engine-set register (`pickTone`, weighted toward lighter: slice-of-life / wry / bittersweet
  / adventurous / tense / dark) so not every saga is grim.
- **Focal skills capped at 2** (`GenSpec.maxSkills`; global stays 3 for value-packing).
- **`seed`** — a few random **THEME keywords** (`core/seeds.ts` `pickThemes`: one BOND + one TIE + one
  FLAVOUR, e.g. "love, debt, a curse"). The engine hands raw sparks; genesis FUSES them into the
  focal's life. Experiment-validated to beat a concrete premise: keywords keep the focal's tags central
  and read far less "canned", with huge combinatorial variety. (Replaced the old `PREMISES` list.)
- **`place`** — a concrete **SETTING** (`core/seeds.ts` `PLACES`). Stops every saga reading "a fen-hamlet".
- **`poolCast`** — a sample of existing world characters (mercs/captives) the bible MAY weave in as
  SECONDARY people. Wires up the long-dormant `QUEST_BIBLE.md §4` "reuse the pool first" → recurrence =
  attachment. Tuned to ≤1–2 per saga so a small early pool doesn't concentrate.
- **`avoid`** — recent saga titles + premise snippets, to steer away from repeats.

### What the engine controls in each beat (NOT left to the AI)

`makeBeatQuest` in `quest.ts` builds the **beat instruction**:
- **Beat 1** centers the **focal** (engine passes their name) in a small human moment — UNLESS the focal
  is the hidden wrongdoer, then a victim/kin/bystander. Never the faceless client.
- **Mid beats** advance the **bible's OWN tensions/directions** and keep its CENTRAL TRUTH live — NOT a
  fixed verb-arc (a fixed arc flattened every saga into the same crime procedural). A dramatic-function
  rotation (`SCENE_KINDS`) + "different verb than prior beats, never chase the same object" gives variety
  without re-padding.
- **Finale** = the reckoning that pays off the central truth. Engine gates the WINDOW (merc-cycles ≥
  `climaxTarget`); a **rarity-scaled max-beats cap** (`common 4 … legendary 7`) FORCES a close — this is
  load-bearing, the AI will NOT reliably self-close.
- **Rotated opening MODE + TIME** per beat (so beats don't all read "X staggers to the gate at dusk").
- **`introduced` list** — names the player has already met (`chain.introducedNames`, accumulated by
  scanning each beat's player-facing text for bible-cast names) so a name is oriented only ONCE.

## Validated-by-reading rules (don't regress these)

- **Length** capped (resolved 4–5 typical, 0 slogs). Cap is the load-bearing lever; rotation kills
  *repetition* but not length. (Experiment: rotation-only still ran to 15 beats; +cap → max 6.)
- **No within-saga padding**: ≤2 of any verb per saga, no chasing one object across beats.
- **Beat 1 = focal attachment**, not the client.
- **No reflexive death**: many sagas have no corpse; `midSaga` flag forbids killing/capturing named cast
  in a non-finale beat (a failure is a SETBACK).
- **gate-bundle cliché** — the explicit BAN was REMOVED (a brittle negative patch); the engine-rotated
  opening MODE (a positive seed: a specific arrival each beat) keeps it at 0 occurrences on its own.
  Same principle as premises/keywords: a positive seed beats a "don't do X" ban.
- **The roll is the dramatic beat** (STORY_ENGINE §7a). Resolution = buildup until the challenge
  materialises and the merc commits (END ON THE BRINK, held breath) → the roll shown (verdict) →
  consequence with weight. `beforeRoll` 35-55w builds to the brink (no result hint); `afterRoll` 55-90w
  is the consequence, each merc their own beat. GUI `ResultReveal` stages it (buildup → "dice fall…" →
  verdict → consequence). Keep the resolution GENEROUS — it's the payoff moment.
- **Beat proposes, RESOLUTION decides.** The beat's `newLayerRevealed` + `proposedReward` are only
  PROPOSALS (carried on the quest as `stakes` / `proposedLoot`). The dice outcome is known at resolution,
  so `ai.outcome` receives the proposals + the outcome and returns `learned` + `loot` scaled to it:
  success = the full truth + clean loot; **partial = a hedged/partial truth + a lesser haul** (the old
  pre-baked design couldn't express this); failure = nothing (a misleading scrap). The afterText shows
  the company discovering `learned`; `recordBeat` logs the actual `learned`; the loot card is named from
  `loot` at resolution. (Validated `_exp_scale.ts`: full → hedged → empty.)
- **Reward model** — a beat's reward is EITHER intermediate **side-loot** (gold/clue/item; flavour decided
  by resolution's `loot`, value by the engine) OR the finale **payoff** = the focal CHARACTER (recruit/
  captive/ransom), themed by the bible. The side-loot path never names the finale character.
- **Readability** (player-facing `situation`): 2–4 clean sentences, time woven into prose (no "Grey
  morning." fragments), **orient each name exactly once** in natural apposition (no parentheses), bare
  name thereafter. — *user verdict: "the beat text looks amazing now."*

## Model tiers & cost
- Narrative tier `gpt-5-mini` (genesis, outcome, flesh, chainBeat) at `reasoning_effort` low.
- Mechanical tier `gpt-5-nano` (cardAsk, conceptTags) at `minimal`.
- AI log (GUI) shows per call: latency, model, ↑prompt ↓completion, cached tokens.

## Premise convergence had MULTIPLE roots (all addressed)
1. **Tag attractors** — beautiful+scarred+notorious → "wolf-witch"; fixed by excluding recent focals'
   skill+physical+notoriety tags (`recentFocalSkills`).
2. **Model stock plots** — "secret-monster-killed-someone-staged-as-animal" and "ledger fraud"; fixed by
   the seed + anti-default prose. **(The anti-default/vary-milieu prose is bloated and under review.)**
3. **Deriving from tags at all** — fixed by the independent premise/place seeds.

## The method (the meta-lesson, enforced repeatedly by the user)
**TEST claims with controlled experiments and READ the prose — do not assert.** Scratch harnesses in
`app/` (untracked): `_exp_chain.ts` (length, resolved-vs-pursued), `_exp_deep.ts` (full prose end-to-end),
`_exp_variety.ts` / `_exp_seeds.ts` (premise/place/recurrence spread). Always compare before/after on data.
Twice this overturned a confident claim (free-length-is-fine; duplicate-beats-are-padding) and once it
caught a self-inflicted regression (homogenization → verb-padding 56%→0%).

## RESOLVED (this session)

- **Premise → THEME keywords.** Tested keyword-seeding head-to-head vs concrete premises (`_exp_kw.ts`,
  5 focals × 3 styles): keywords win — focal's tags stay central, far more varied, far less canned, still
  coherent. Structured draw (bond+tie+flavour) is most reliable. Done in `core/seeds.ts` `pickThemes`.
- **Removed the "please vary" prose.** Deleted PREMISE-VARIETY / NOT-EVERY-SAGA-NEEDS-A-DEATH /
  VARY-THE-MILIEU paragraphs and rewrote the genesis prompt around engine-provided seeds. Validated:
  convergence did NOT return (0 barge/ledger across the spread). **Principle: give the engine a concrete
  random seed instead of prose telling cheap AI to "be diverse" — it can't, but it can fuse sparks.**
- **Holistic rewrite done** — the genesis system prompt is now one clean "BUILD FROM PERSON + THEMES"
  block instead of stacked "don't do X" patches.

## DECIDED — genesis direction (from the extensive 21-playthrough experiment, `_exp_long.ts`)

Experiment: {A straight+ladders, D twist+lean, B twist+ladders} × {common/rare/legendary} × 3 reps, each
played end-to-end to finale. Findings → decisions:
- **Apparent goal + ENGINE-ROLLED twist (~30%).** The engine rolls twist-or-not and TELLS the genesis
  (the AI never decides — left to itself it made a twist 9/9 times). When rolled, the genesis must give an
  apparent goal + a real situation + the misdirection; the twist surfaces through the reveal-log and lands
  at the finale. Validated: the twist lands at EVERY length, even 4-beat shorts (a "return the locket" job
  becomes a dead man's dying wish; "recover the relic" becomes "it kills the person bonded to it"; an
  escort becomes "the one you guard is the threat"). Rate ~30% (not 45%) so straights stay common and
  twists stay surprising.
- **Lean cast, not why-ladders, at genesis.** B (twist+ladders) and D (twist+lean) produced
  indistinguishable QUEST quality — the ladders never show in the beats; their value is the delivered
  character's dossier. So genesis goes lean (role + want + one vivid line); depth is paid only at
  flesh-on-delivery for the character actually recruited. ~⅓ cheaper.
- **Length control is solid** (common→4, rare→6, legendary→7 via the rarity cap).

## DONE — off-rails handling (a failed step is RETRIED, not skipped)

The fixed arc assumed every step succeeds. Fixed: the arc is **success-gated** — `chain.arcProgress`
advances only on success/partial; a FAILED step keeps it, so the next beat RE-ATTEMPTS the same step
(with a "worse conditions" retry note), never plows past a step it failed (which would be incoherent for
hard-gated steps like "recover the ledger" → "decide its fate"). The finale is engine-decided (reaching
the last step, or a stuck-safety cap `beatsResolved ≥ nSteps+2` forces a desperate climax); a failed
finale = the goal is lost. Replaced the old climaxTarget/maxBeats/closesChain gating. Validated
(`_exp_fail.ts`): forced beat-2 failure → step 2 re-attempted → then 3,4,5 → finale.

## DONE — quest-generator unified (beat = arc step)

The quest generator (separate from the LOCKED bible — see BIBLE.md) was the weak half: the AI got FOUR
competing framings per beat (`BEAT N`, `arc step M of N` clamped so they diverged, a `SCENE_KINDS`
dramatic turn, and "do something different"). Confusing; beats drifted off-arc or just restated the goal.
Experiment (`_exp_quest.ts`, current vs unified) → fix: **ONE numbering — each beat realizes the matching
arc step 1:1 ("STEP k of n")**; dropped the competing SCENE turn (it invented off-arc beats); and a strong
rule that **the job line is THIS step's concrete action, never a restatement of the goal** (the situation
carries the goal). Validated: quests now read as clean, on-arc step sequences (meet→travel→confront→
recover→resolve), beat-1 a real opener. The arc is the weak link to watch — if a genesis arc has redundant
steps, the quest faithfully renders them; arc-clarity at genesis is the next lever if needed.

## DONE — arc planning + choices (implemented & playtested)

- **Rough ARC, engine-rolled twist (30%), lean cast** — `GenesisOut.arc` is an ordered ~N-step guide;
  the engine feeds each beat its step (beat 1 = open, finale = goal achieved). Killed the
  beat-1-completes-goal rewind (validated: bowl recovered ~beat 3, settled at finale). Twist surfaces
  across beats and lands mid-arc (validated: "sacred bell" → it's a sluice-latch the client uses to flood
  homesteads).
- **Mid-beat CHOICES, engine-gated** — a beat may offer 2-3 approaches (sneak/fight/talk), each testing a
  DIFFERENT attribute (reuses the finale approach-groups); the player picks by who they staff, and the
  choice flavors the resolution. Engine-gated to ~1 choice-beat per chain (~70% of chains have one) so
  it's a sometimes-thing, not every beat. The finale choice (recruit/subdue/ransom) already existed.

## OPEN QUESTIONS (next experiments)

- **(superseded — arc planning is DONE above)** Historical note: the bible used to improvise reactively → Currently REACTIVE and it
  shows a SHARP bug on close read of the long-experiment transcripts: the engine hands BEAT 1 the whole
  GOAL as its job, so the AI completes the goal in beat 1 ("retrieve the Moon-Root AND escort Seren to the
  exchange" — done, beat 1), then the climax gate forces N more beats, which REWIND ("beat 2: reach the
  tide-cave and Seren" — already done) or pad with logistics. Object-retrieval goals are worst (locket
  returned in b1, re-retrieved at the finale). Twist quests partly mask it (the rug-pull motivates
  continuation) but the geography/state still rewinds. FIX: the genesis must DECOMPOSE the goal into an
  arc — beat 1 = the FIRST step/obstacle (not the whole goal), each beat advances, the finale is where the
  goal completes. This is the next experiment: planned arc (a step outline + where the twist lands) vs the
  current reactive beats. Likely a hybrid (plan major turns, fill reactively, the finale = goal achieved).
- **The ~4-beat minimum is arbitrary** — it falls out of the climax gate `B×slots` (B=randInt 2-4), not a
  design intent. Bible quests can't currently be 1-2 beats; true one-offs only come from the `cardAsk`
  path. If short bible-quests are wanted, lower/flex the gate. Revisit.

- **Recurrence is TEXT-LEVEL only** — bible/beats NAME existing mercs (reads great) but they aren't
  mechanically linked as units, and nothing stops assigning a merc to a quest they're a character in.
  Mechanical linking is the doc's deeper vision and the next real step.

## Where things live
- `app/core/openaiNarrator.ts` — all prompts (genesis, chainBeat, outcome, cardAsk, flesh, conceptTags).
- `app/core/quest.ts` — the spine: genesis glue, `makeBeatQuest`, beat instruction, finale, seeds wiring.
- `app/core/seeds.ts` — `PREMISES` + `PLACES` (hand-crafted, meant to grow toward 1000+).
- `app/core/ai.ts` — `GenesisInput`/`ChainBeatInput`/`OutcomeInput` types, `renderBible`, MockNarrator.
- `app/core/types.ts` — `Chain` (`seedKernel`, `introducedNames`), `Quest`.
- Run GUI: `cd app && npm run web`. Tests: `npm run -s test` / `npm run -s conformance`.
