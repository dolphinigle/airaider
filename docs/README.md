# Airaider — Design Docs

Airaider is a persistent, single-player, **AI-driven character-collection fort game**: you collect characters you grow attached to, assign them to AI-generated quests, and live with what happens. These docs were rewritten from scratch for **prototype 2** (2026-06-02); the prior AI-Stronghold-remake design and the v1 story-chain prototype have been superseded (history is in git).

## Reading order

1. **[VISION.md](VISION.md)** — the North Star. Three engines of fun, two loops, character attachment, what the game is and isn't. Read first.
2. **[DESIGN.md](DESIGN.md)** — the core game. The Fort→Resolution cycle, the two boards, risk/loss, progression, recruitment. The authoritative *what* (with summaries that point into the docs below).
3. **[CARDS.md](CARDS.md)** — the unit model: everything is a Card (`type` tag: character / relic / stackable); **quests and rooms hold cards in CardSlots**; one `overlap()` fit primitive powers the roll *and* comfort/prestige. Characters (tags, the 5 attributes, growth+focus, the roll) + relics (tier-ceiling loot).
4. **[GAME_STATE.md](GAME_STATE.md)** — the save (cards + placements + the lore graph), the 3-producer determinism model, comfort→benefit progression, staging.
   - **[FORT.md](FORT.md)** — the fort: the grid, room species + generic slots, the captive-labor loop, comfort formula, the Great Hall master clock, the catalog, sim-verified pacing.
5. **[ECONOMY.md](ECONOMY.md)** — value (signed, 20-tier geometric tag curve, marked value), `V_base(level)`, reward generation, outcomes + the decoupled injury channel, the bank, the migrating constraint.
6. **[QUESTS.md](QUESTS.md)** — lead & quest generation: cheap lead spec → AI quest → resolution → reward → chain. The crucial core.
7. **[LORE.md](LORE.md)** — the world graph (LoreNodes + memory-edges), soft-delete, salience/pinning, and the ≤2-round-trip context-retrieval pipeline (continuity engine).
8. **[STORY_ENGINE.md](STORY_ENGINE.md)** — the AI craft behind the board: the hidden bible, casting tiers, quest-card structure/voice, individuated outcomes, the 5 prompt principles.
   - **[PROMPTS.md](PROMPTS.md)** — example prompts (partially stale; GENERATION_FLOW + LORE.md are authoritative; refresh at implementation).
9. **[GENERATION_FLOW.md](GENERATION_FLOW.md)** — the decision log (§8 tags · §10 the roll · §11 injury · §13 regions · §14 lore · §15 slottables · §16 resolutions · §18 room model · §19 catalog · §20 prestige math + sims · §21 post-review rulings). Where every 🔒 above traces to.

## Supporting

- **[BIBLE.md](BIBLE.md)** — the LOCKED bible-authoring spec (wins over QUEST_BIBLE.md where they differ) · **[PROMPT_RULES.md](PROMPT_RULES.md)** — prompt-craft rules (v2 code paths; principles current). · **[WRITING_CHECKPOINT.md](WRITING_CHECKPOINT.md)** — ⛳ the designer-approved writing baseline (2026-08-25) + what remains to implement. · **[PROSE_METHOD.md](PROSE_METHOD.md)** — ⭐ card-writing guiding principles + the blind-measurement protocol and its five traps. Read before touching any writing prompt.
- **[CARD_GOLD_STANDARD.md](CARD_GOLD_STANDARD.md)** — ⛳ what a saga's FIRST card must be: the goal in one sentence, the designer's own Sultan sample read clause by clause, the seven testable properties, and the four-question cold-reader test every writing iteration is scored against.
- **[REFERENCE_CHARACTER_INTROS.md](REFERENCE_CHARACTER_INTROS.md)** — all 22 of Sultan's Game's character introductions, verbatim, and the structural fact behind them: a character is introduced on their OWN CARD with a role-title, and quests afterwards use the bare name freely.
- **[DOGFOODING.md](DOGFOODING.md)** — 🔒 how this game gets playtested: the text UI is at PARITY with the web GUI, and playtesting means *playing* a real UI, never simulating one. Read before claiming anything is playtested.
- **[TEMPO.md](TEMPO.md)** — 🟡 **goals** for the current phase: no dead time. Async work in the fort phase + a reckoning that unfolds. Measured latency baseline lives here; lifts `STORY_ENGINE §9`'s prototype exemption.
- **[AI_PROVIDER.md](AI_PROVIDER.md)** — model selection, structured-output strategy.
- **[PLAYER_PREFERENCES.md](PLAYER_PREFERENCES.md)** — player-facing flavor knobs (tone, writing style) that flow into AI prompts without touching engine math.

## Status legend

- **Canonical** — current load-bearing design.
- 🔒 **Locked** — don't reopen without strong reason · 🛠 **Locked-shape** — mechanism fixed, numbers deferred · 🟡 **Open**.

## Doctrine

Everything in this repo is a **throwaway prototype** — optimize for design-learning per hour, not robustness. Per current direction: **fun before balance.** The core question prototype 2 must answer: *is the marriage of the mechanical loop (min-max, fort, the roll) and the AI loop (individuated character stories) actually fun?* — the exact thing v1 failed to deliver because its two halves were disconnected.
