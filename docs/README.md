# Airaider — Design Docs

Airaider is a persistent, single-player, **AI-driven character-collection fort game**: you collect characters you grow attached to, assign them to AI-generated quests, and live with what happens. These docs were rewritten from scratch for **prototype 2** (2026-06-02); the prior AI-Stronghold-remake design and the v1 story-chain prototype have been superseded (history is in git).

## Reading order

1. **[VISION.md](VISION.md)** — the North Star. Three engines of fun, two loops, character attachment, what the game is and isn't. Read first.
2. **[DESIGN.md](DESIGN.md)** — the core game. The Fort→Resolution cycle, the two boards, risk/loss, progression, recruitment. The authoritative *what* (with summaries that point into the docs below).
3. **[CARDS.md](CARDS.md)** — the unit model: everything is a Card (`class` = character / item / gold / …). Characters (tags, attributes, the roll, value, generation) + items (ilvl). One global tag pool, one `overlap()` function.
   - **[TAGS.md](TAGS.md)** — the fixed tag vocabulary (the list the AI references, never invents) + the prompt vocab block.
4. **[GAME_STATE.md](GAME_STATE.md)** — what's persisted (one card collection + placements), the two prestige pools (comfort → merc cap; global → fort tier), the progression spiral, staging buildings.
   - **[FORT.md](FORT.md)** — the fort: the 2D cross-section grid, expansion, the room set, and the prestige formula.
5. **[ECONOMY.md](ECONOMY.md)** — value (gold-denominated, signed), the `V_base(level)` chart, reward generation (split + generateCard), the success/partial/failure outcome model, and the migrating-constraint economy.
6. **[QUESTS.md](QUESTS.md)** — lead & quest generation: the pipeline from a cheap lead spec → AI quest → resolution → reward → chain. The crucial core.
7. **[STORY_ENGINE.md](STORY_ENGINE.md)** — the AI craft behind the board: the hidden bible, casting tiers, quest-card structure/voice, individuated outcomes, the 5 prompt principles.
   - **[PROMPTS.md](PROMPTS.md)** — production-close example prompts (card+ask, outcome, character-flesh, chain beat, genesis), validated against real models with the real tag vocabulary. The starting point for the prototype's AI layer.

## Supporting

- **[AI_PROVIDER.md](AI_PROVIDER.md)** — model selection, structured-output strategy.
- **[PLAYER_PREFERENCES.md](PLAYER_PREFERENCES.md)** — player-facing flavor knobs (tone, writing style) that flow into AI prompts without touching engine math.

## Status legend

- **Canonical** — current load-bearing design.
- 🔒 **Locked** — don't reopen without strong reason · 🛠 **Locked-shape** — mechanism fixed, numbers deferred · 🟡 **Open**.

## Doctrine

Everything in this repo is a **throwaway prototype** — optimize for design-learning per hour, not robustness. Per current direction: **fun before balance.** The core question prototype 2 must answer: *is the marriage of the mechanical loop (min-max, fort, the roll) and the AI loop (individuated character stories) actually fun?* — the exact thing v1 failed to deliver because its two halves were disconnected.
