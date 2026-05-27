# AI Raider — Design Docs

This folder contains the working design for AI Raider. The design is intentionally incomplete: the central open problem (how to give the player real agency during raids while keeping the strong meta loop inherited from AI Stronghold) is still being worked through. See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## Reading order

1. [VISION.md](VISION.md) — One-page pitch, design pillars, non-goals.
2. [PROBLEM_AND_INHERITANCE.md](PROBLEM_AND_INHERITANCE.md) — What is kept from AI Stronghold, what is replaced, and *why* the previous design lacked agency.
3. [GAMEPLAY_LOOP.md](GAMEPLAY_LOOP.md) — Macro (fort week) and micro (raid run) loops.
4. [RAID_DESIGN.md](RAID_DESIGN.md) — The tactical raid layer (where agency lives). Several candidate styles are sketched; this is the most unresolved doc.
5. [HEROES_AND_GROWTH.md](HEROES_AND_GROWTH.md) — Heroes as characters the player invests in, not as stat blocks.
6. [FORT_AND_PRESTIGE.md](FORT_AND_PRESTIGE.md) — Inherited fort / theme / follower / item / prestige systems.
7. [PROGRESSION_AND_PAYOFF.md](PROGRESSION_AND_PAYOFF.md) — RNG dopamine loop, reward economy, why prestige stays room-only.
8. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — Unresolved decisions, especially around raid format.

## Status legend

Each doc starts with a status line:
- **Locked** — design decision is intentionally fixed; reopen only with strong reason.
- **Draft** — current working answer; expected to evolve.
- **Open** — explicitly unresolved; multiple candidates listed.
