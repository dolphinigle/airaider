# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style
- **Be terse. Save tokens.** Short answers, minimal preamble, no recap of what you just did.

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
