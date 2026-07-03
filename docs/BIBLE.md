# The Quest Bible — LOCKED spec 🔒

> The genesis/"bible" design is settled (playtested, dogfood-read, user-approved 2026-06-06). This is the
> authoritative reference; change only with a deliberate reason. The BEAT/quest generator that consumes
> the bible is a separate, still-evolving piece (see STORY_GEN_STATE.md). Implementation: `genesis()` in
> `core/openaiNarrator.ts`, glue in `core/quest.ts`, types in `core/ai.ts`, seeds in `core/seeds.ts`.

## What the bible is
The hidden, settled TRUTH + plan for ONE quest a mercenary company would take. The player runs the
company; the bible is never shown to them. It exists to make a quest they have a clear REASON to take and
a STAKE in — not a drama they spectate.

## Inputs the engine hands genesis (alongside the focal's rolled tags)
Deriving a story from the focal's tags alone CONVERGES (always "a person with a concealed truth"). So the
engine injects independent seeds — this is the core architectural lesson:
- **THEME keywords** (`pickThemes`: one BOND + one TIE + one FLAVOUR, e.g. "love, debt, a curse") — a
  spark to FUSE, decorrelating the story's SHAPE from the tags. Beat keywords > a fixed premise list
  (cheap AI can't "be original" but it can fuse concrete sparks).
- **PLACE** (`pickPlace`) — a concrete setting so sagas aren't all "a fen-hamlet".
- **TONE** (`pickTone`, weighted toward lighter — the weighting is shifted by the PLAYER_PREFERENCES tone knob: slice-of-life / wry / bittersweet / adventurous / tense
  / dark) so not every saga is grim.
- **TWIST** — engine-rolled ~30% (the AI NEVER decides; left alone it twisted 9/9). When set, the
  apparent goal is a misdirection.
- **expectedBeats** — sizes the arc to the rarity (uncommon 4 … legendary 7).
- **recurring poolCast** — a sample of existing mercs/captives the bible MAY weave in as ≤1-2 SECONDARY
  people (recurrence = attachment); MANY sagas use none.
- **avoid** — recent titles + premise snippets, to steer away from repeats.
- **focal tag exclusion** — recent focals' skill+physical+notoriety tags excluded so the ARCHETYPE varies
  (not every focal a "beautiful scarred notorious wolf-witch"). FOCAL skills capped at 2.

## Output (the bible)
- **title** — concrete action-title (e.g. "Escort Bren Tholl to the Old Sluice"), never a poetic two-noun.
- **leadBlurb** — the player-facing job-board line: a CLEAR, inviting job (who/what, what they're wanted
  for, the draw). Hides the deep secret; never hides what the JOB is.
- **goal** — the APPARENT throughline the company commits to.
- **twistReveal** — (twist quests only) how the truth subverts the apparent goal; hidden, surfaces across
  beats, lands at a MIDDLE step.
- **arc** — a ROUGH ordered ~N-step guide (a skeleton, not a script): step 1 = take the job / meet (goal
  NOT done here), middles = escalating turns, LAST = the goal achieved at the finale.
- **cast** — LEAN: each person is one vivid line (who) + a want + a ROLE (client / companion / quarry /
  obstacle / ally / prize). NO why-ladders — deep history is written at DELIVERY (`flesh`), only for the
  one character the company keeps. (Validated equal-quality to ladders, ~⅓ cheaper.)
- **situation** — the real truth behind the job, told straight.
- **tensions** — obstacles ALONG the goal (not a standalone argument).
- **directions** — active (next step toward the goal) + ambient (pressure that unfolds regardless).

## Locked principles
- A QUEST the company would take (hook + goal + stake), goal-driven OR mystery-driven — don't force a secret.
- DRAMA SERVES THE QUEST; the player is a PARTICIPANT, never a spectator.
- COMMIT TO THE TRUTH (no "unknown/mysterious"); believability (every fact traces to a cause).
- The focal's tags are CENTRAL to what the quest is about.
- BANNED purple words: weight, shadow, burden, fate, destiny. Clinical voice.

## Validated (don't regress)
Goal-based quests with clear hooks; tone variety; engine-rolled twists that surface gradually and land
(e.g. "recover the sacred bell" → it's a sluice-latch the client uses to flood homesteads); arc kills the
beat-1-completes-goal rewind; recurring mercs land in meaningful roles; lean+flesh gives kept characters
depth. Dogfood prompt-read (2026-06-06) found the bible prompts mechanically clean (0 assembly smells).
