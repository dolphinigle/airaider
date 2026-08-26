# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style
- **Be terse. Save tokens.** Short answers, minimal preamble, no recap of what you just did.
- **Principles, not instance-patches.** In prompts and code alike, fix the CLASS, never bolt on the specific example that failed — examples are sticky, instance-patches brittle. Full rule: `docs/PROMPT_RULES.md` §8.
- **Prompts are written for CHEAP models.** A rule buried in a long prompt does not exist for gpt-5-mini; adding a rule means merging or cutting another first. Full rule: `docs/PROMPT_RULES.md` §0.
- **The text UI is how you playtest — keep it at PARITY.** You cannot drive a browser. `v3/cli/` is
  the only surface you can actually play, and that is the entire reason it exists: same engine,
  different UI. So **every player-facing feature ships in the CLI in the same session it ships in
  the web GUI** — not "later", not "the CLI is the batch/reference surface". Never dogfood by
  *simulating* a UI you cannot run (copying client logic into a test harness): a simulation can only
  confirm what you already believed, and it is blind to rendering. Full rule + the failure that
  taught it: `docs/DOGFOODING.md`.
- **Division of labor (designer-ruled 2026-07-19): Fable plans, Opus codes.** Plans, code plans, prompt design, and judging/synthesis stay with Fable (the main session); manual coding tasks are delegated to Opus subagents, whose output Fable verifies.

## Project status
- Airaider is in the **PROTOTYPE V3 IMPLEMENTATION phase.** The design is FINALIZED and verified — build against `docs/`, don't redesign.
- **Docs are law.** Read in `docs/README.md` order. `docs/GENERATION_FLOW.md` §1–§21 is the frozen decision log; every 🔒 in the other docs traces to it. If code and docs disagree, docs win; if a doc gap forces a decision, flag it to the user (rulings stay with the designer). Impl-time knobs are flagged 🛠/🟡 in-place.
- The code is still a **throwaway prototype** — design-learning per hour > robustness. Fun before balance.
- v1/v2 prototypes are deleted (git tag `v2-final` to recover).

## Layout
- **`v3/`** — single npm package, TypeScript via `tsx` (no build step), Vite for web.
  - `src/engine/` — pure deterministic game logic (seeded RNG; the engine owns EVERY number).
  - `src/ai/` — the AI layer behind a provider interface (deterministic Mock vs real OpenAI, zod-validated). The AI owns flavor/story only; it never emits numbers (sole exemption: the lore salience score).
  - `src/game/` — the Game facade both UIs consume.
  - `cli/` — text UI (dogfooding) · `server/` + `web/` — Fastify API + React GUI.
  - `test/` — vitest: engine invariants + §20 sim baselines.

## Commands
```bash
cd v3
npm run cli                   # text game (mock AI default; --ai for OpenAI)
npm run gui                   # server + web
npm test                      # vitest suite
npm test -- -t "name"         # single test by pattern
npm run typecheck             # tsc --noEmit
```

## Secrets
`OPENAI_API_KEY` lives in `/home/irvan/airaider/.env` + `~/.airaider/openai.env` (gitignored). Read for dogfooding only; never print or commit.
