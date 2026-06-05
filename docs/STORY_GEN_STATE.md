# Story-generation — current implementation state & learnings

> Snapshot of how the v2 AI story engine works *right now* (`app/core/`), the design decisions and
> WHY behind them, what's been validated by reading real output, and the open questions. Written so the
> understanding survives a context reset. The design intent lives in `STORY_ENGINE.md` / `QUEST_BIBLE.md`;
> this is the as-built + lessons.

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
- **gate-bundle cliché banned** ("wrapped/sodden/shrouded corpse left at the gate"), incl. finales.
- **Reveal gating** — each beat's `newLayerRevealed` (the one concrete truth) is surfaced to the PLAYER
  only on success/partial: `resolveQuest` passes it to `ai.outcome` as `reveal` and the afterText shows
  the company uncovering it; failure withholds it (mystery holds, world still worsens). The coin flip
  decides what the player learns.
- **Reward model** — a beat's reward is EITHER intermediate **side-loot** (gold/clue/item, themed by the
  AI's `proposedReward`) OR the finale **payoff** = the focal CHARACTER (recruit/captive/ransom), themed
  by the bible. `proposedReward` is side-loot ONLY; it never names the finale character.
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

## OPEN QUESTIONS

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
