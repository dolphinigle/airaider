# PROMPT_RULES.md — how to write airaider's AI prompts

**Status:** living rules, distilled from dogfshooting (read with [STORY_ENGINE.md](STORY_ENGINE.md)).
Check this before editing any prompt in `core/openaiNarrator.ts`. The engine owns numbers + structure;
the AI owns fiction. These rules are about getting good, coherent fiction out of a model that knows
**nothing** about our game.

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
- the beat proposes **immediateReward** (loot now vs banked) → the engine sizes it + always banks a floor;
- the genesis proposes **which arc steps afford a branching choice** → the engine caps how many.
A pure-engine roll is fine when fiction shouldn't drive it (twist %, failure budget). Let the AI propose
when the *story* knows best (is there loot here? does this step branch?).

## 3a. The player is a MERCENARY BOSS who wants GAIN — every job must answer "what's in it for us?"

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
Resolution length is engine-set by position × rarity (BALANCE.resWords): a common one-off ~50w, a
legendary finale ~165w. The model treats a word range as loose and **overshoots ~25%** — so state the
upper number as a **HARD CEILING, never exceed**. A finale also gets a "this is the climax, weight of an
ending" note. Calibrate by READING outputs (`_exp_reslength.ts`), not by asserting numbers.

## 7. Readability + orient-once
2–4 clean sentences a player reads once — not telegraphic fragment-stacks ("Grey morning. Mud. A man.")
nor comma-splice run-ons. Orient a person ONCE on first appearance (natural apposition, not parens);
pass the already-met list so the AI uses bare names thereafter.

## 8. How to change a prompt
Edit → **read real outputs** (run a `_exp_*` harness with the real AI, or `/playtest`) → judge the prose,
not the diff → iterate. Offline gates (selftest/looptest/conformance) use the Mock narrator and only prove
no *breakage*; they can't judge prose. See the **playtest** skill.
