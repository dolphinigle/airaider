# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style
- **Be terse. Save tokens.** Short answers, minimal preamble, no recap of what you just did.
- The current task is **pure planning / design** — think and write docs, don't write code unless asked.

## Project status
- Airaider is in the **DESIGN phase.** The design question: *does an AI-driven, character-driven quest chain over a persistent recurring cast feel fun?*
- The code under `prototype/`, `engine/server/`, `engine/web/` is a **throwaway prototype, likely to be deleted.** Don't invest in its robustness. Design-learning per hour > code quality.
- The real artifacts are the design docs in `docs/` (rewritten from scratch for prototype 2). Read in order: `docs/VISION.md` → `docs/DESIGN.md` (the core game) → `docs/STORY_ENGINE.md` (the AI half). `docs/README.md` is the index. The v1 prototype code under `prototype/`, `engine/` is superseded and likely to be deleted.

## Layout (if you do touch code)
- npm-workspace monorepo: `prototype/` (TS game engine + console CLIs, run via `tsx`, no build), `engine/server/` (Fastify wrapper importing `prototype/src/*` directly), `engine/web/` (React/Vite GUI over `/api`). Game logic lives in `prototype/src/`.
- Engine owns the numbers (Sultan-coin resolution, seeded RNG); the LLM owns flavor (narration/prose), behind `ScenarioLLM` (deterministic Mock vs real OpenAI).

## Commands
```bash
npm run gui                              # server + web
cd prototype && npm test                 # main vitest suite
cd prototype && npm test -- -t "name"    # single test by pattern
cd prototype && npm run game             # full campaign console runner
```
