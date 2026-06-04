# Airaider — prototype v2 (the build)

A single-player, AI-driven character-collection fort game. Two front-ends share **one engine**:
a **text CLI** (for fast dogfooding) and a **web GUI** (for playing). All game logic lives in
`core/`; the front-ends are presentation only. Design docs are in `../docs/`.

## Run

```bash
npm install
# put your key in ../.env  →  OPENAI_API_KEY=sk-...   (or export it)

npm run cli                 # interactive text game (real AI if a key is present)
npm run cli -- auto 6       # auto-play 6 cycles, printing every AI beat (dogfood)
npm run cli -- auto 6 --mock      # offline, no tokens
npm run cli -- auto 6 --verbose   # also dump every AI prompt/response
npm run web                 # the GUI at http://localhost:5173 (auto-reads ../.env)

npm test                    # pure-engine self-test (tags, generation, the roll curve)
npm run looptest            # headless full-loop integration test (offline mock)
npm run aismoke             # one real call per AI path, against the live model
npm run typecheck
```

Both front-ends read `OPENAI_API_KEY` from `../.env` automatically (the GUI's Vite config
injects it). Without a key they fall back to the deterministic offline **mock narrator**.
The GUI's **AI Log** tab shows every prompt + response + token count (collapsible).

**Model tiers** (docs/AI_PROVIDER.md §4.1): narrative work (chain bibles, the resolution
narration, character backstory) uses `gpt-5-mini` at `reasoning_effort:low`; mechanical work
(quest/beat cards, tag picks) uses `gpt-5-nano` at `minimal`. Override via env:
`AIRAIDER_LLM_NARRATIVE_MODEL`, `AIRAIDER_LLM_MECHANICAL_MODEL`, `AIRAIDER_LLM_MODEL`
(single-knob), `AI_EFFORT`. Per-call latency ≈ 2s (nano) / 8–11s (mini); end-day resolves
run concurrently. (Production would pre-generate asynchronously — latency isn't the constraint, quality is.)

## Architecture — the shared core

```
core/                       UI-AGNOSTIC ENGINE (imported by both front-ends)
  tags.ts        the locked tag vocabulary + canonicalizing parser + tagLabel/tagName
  rng.ts         seeded deterministic RNG
  types.ts       the domain model (Card union, Quest, Chain, Fort, GameState)
  economy.ts     value chart, generateCharacter, splitValue, overlap(), the coin roll  ← BALANCE block
  ai.ts          Narrator interface + MockNarrator + factory
  openaiNarrator.ts   the real gpt-5-mini prompts (validated against docs/PROMPTS.md)
  cards.ts       card factories      reward.ts   value → bundle of cards
  state.ts       GameState init + accessors      leads.ts   the lead-board roller
  quest.ts       THE SPINE: pursue → ask → assign → resolve → deliver; chains + finale
  fort.ts        cross-section grid, room catalog, expansion, the prestige formula
  game.ts        GameEngine — the one command API both front-ends call
cli/             TEXT FRONT-END (format.ts = pure rendering, main.ts = REPL + auto mode)
web/             GUI FRONT-END (React + Zustand + Vite; store.ts wraps GameEngine)
```

The contract: **the engine owns every number; the Narrator only writes fiction and picks
tags from the fixed vocabulary.** Swap `MockNarrator` ↔ `OpenAINarrator` without touching game logic.

## The cycle

Fort Phase (pursue leads → AI writes the quest card+ask → assign mercs, build rooms; no rolls)
→ **End the Day** → Resolution Phase (every filled quest rolls coins-vs-threshold at once →
AI narrates before→after → deliver full / half+liability / none+punishment) → restock → next cycle.

Tuning lives in `economy.ts` `BALANCE`. Everything else is structure.
