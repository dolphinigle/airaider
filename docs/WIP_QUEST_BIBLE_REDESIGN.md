# WIP — Quest-Bible Understanding (CORRECTED 2026-06-04)

## TL;DR — no redesign needed
The live game (`prototype/src/storyGen/chainGen.ts`, used by `npm run gui`) **faithfully implements the
approved, validated bible design** from `~/.copilot/session-state/d7cc1691-.../files/FOCUS_story_bible_system.md`.
Same pipeline, same schema, same prompt that produced the GOLDEN sample.

## The approved design (FOCUS, locked 2026-05-31; user-praised)
- Bible = **plain hidden TRUTH** (no reveal-cadence machinery). Pipeline = how writers work:
  - **GENESIS (collision)** — collide seed + pool character(s) → one-line kernel (King/Gaiman).
  - **WHY-LADDER (BUILD)** — ask "why?" to bedrock → each person's `history`; concealment EMERGES from
    `history`+`feels` (NO secret/lie field; most conceal nothing). **COMMIT-TO-TRUTH** = key unlock.
  - **ASSEMBLE** — cast{who, history(why-ladder), wants, feels, conceals?} + situation + tensions + openDirections{ambient|active}.
- Research basis (already in FOCUS): Egri (wants-collide=plot), emergent secrets (event+feeling),
  ensemble "character web"/third-factor (depth at the intersection = the Bob←addiction←dealer-Alice model),
  King/Gaiman collision, why-laddering, Polti's 36 situations (seed bank).
- GOLDEN sample: `GOLDEN_bible_carried-the-fever_legendary.md` (legendary). Depth scales with stakes.

## Corrected: my earlier WRONG claims (do not trust prior version of this note)
1. "biblePipeline rich vs chainGen thin divergence" — WRONG. biblePipeline (backstoryThreads/conflictingInterests/
   trajectory) was the OLD experiment FOCUS REJECTED. chainGen is the correct successor.
2. "live prompt drifted" — WRONG. chainGen BUILD_SYSTEM IS the approved prompt (commit-to-truth, why-ladder, rubric).
3. "STORY_ENGINE.md dropped conflictingInterests" — WRONG; dropping it was correct.

## Why a saved bible can feel weaker than GOLDEN
- Stakes scaling (rare = leaner than legendary GOLDEN, by design) + model variance.
- `tensions` may render as abstract `{between, over}` theme-labels vs GOLDEN's concrete "A wants X, B wants Y, because Z".

## Genuinely-open polish items (separate from bible design)
1. **Bad tags** — bible cast has NO tags field; tags come from the recruit/character-flesh prompt, which likely
   lacks the `docs/TAGS.md` vocab block. Inspect `logs/llm-calls.jsonl` (logging added to `ai.ts` this session).
2. **Hook** (`openDirections[].hook`) lacks `leadBlurb`'s concreteness discipline; only 1 becomes `drivingHook`.
3. **Climax** — quest-writer judges `closesChain` on a fast model; can misfire.
4. **GUI half-screen** — design `engine/web`/`app/` for ~half-width.
5. **Doc reconciliation** — fold FOCUS specifics into canonical `docs/STORY_ENGINE.md`; retire legacy confusion.

## Logging added this session
`prototype/src/storyGen/ai.ts` callJson → `logs/llm-calls.jsonl` (labels genesis/bible/quest/resolve/fit; gitignored).
