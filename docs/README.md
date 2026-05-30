# Airaider — Design Docs

This folder contains the working design for Airaider. The design was substantially refreshed after a 200-day end-to-end validation simulation. The canonical state lives in **[CANONICAL_DESIGN.md](CANONICAL_DESIGN.md)**; the older detail docs remain as historical references with SUPERSEDED banners noting what's still in force vs. what has changed.

## Reading order

1. **[AGENT_BOOTSTRAP.md](AGENT_BOOTSTRAP.md)** — Start here. 30-second orientation for a new agent or contributor. Pointers and terminology rules.
2. **[CANONICAL_DESIGN.md](CANONICAL_DESIGN.md)** — The full canonical synthesis. Every load-bearing decision, post-200-day validation. Read this in full.
3. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — Living list of unresolved questions. Being re-aligned with `CANONICAL_DESIGN.md` §7.
4. [AI_PROVIDER.md](AI_PROVIDER.md) — AI model selection: hybrid recommendation (GPT-4o-mini default, A/B test Claude Sonnet for narrative), pricing landscape, structured-output strategy, output JSON schema pattern.
5. [VISION.md](VISION.md) — One-page pitch, design pillars, non-goals.
6. [PLAYER_PREFERENCES.md](PLAYER_PREFERENCES.md) — Player-supplied flavor knobs (tone, writing style, NPC gender bias, cultural register) that flow into every AI prompt without affecting engine math.

## Legacy detail docs (have SUPERSEDED banners)

These predate the 200-day sim. Each has a banner at the top explaining what's still valid and what has been replaced by `CANONICAL_DESIGN.md`. Read for historical perspective or for the parts still in force.

6. [PROBLEM_AND_INHERITANCE.md](PROBLEM_AND_INHERITANCE.md) — Why Airaider exists as a remake; what is kept from AI Stronghold; what is replaced.
7. [GAMEPLAY_LOOP.md](GAMEPLAY_LOOP.md) — Macro (camp day cycle) and micro (raid) loops.
8. [CORE_CONCEPTS.md](CORE_CONCEPTS.md) — The old single-file synthesis. Predates the 200-day sim. Read `CANONICAL_DESIGN.md` instead.
9. [RAID_DESIGN.md](RAID_DESIGN.md) — Narrated Pool (superseded by Sultan-coin), leads, arcs, equipment principles.
10. [HEROES_AND_GROWTH.md](HEROES_AND_GROWTH.md) — "Heroes" (terminology superseded by "mercenaries"), early tag PoE-tier model, equipment.
11. [FORT_AND_PRESTIGE.md](FORT_AND_PRESTIGE.md) — 2D side-view cross-section fort, RoomTypes, adjacency, prestige formula.
12. [PROGRESSION_AND_PAYOFF.md](PROGRESSION_AND_PAYOFF.md) — Dopamine loop, reward economy, progression triangle.

## Status legend

Each doc starts with a status line:
- **Canonical** — current load-bearing decisions (post-200-day sim).
- **Locked** — design decision is intentionally fixed; reopen only with strong reason.
- **Draft** — current working answer; expected to evolve.
- **Open** — explicitly unresolved; multiple candidates listed.
- **SUPERSEDED** — predates the 200-day sim. See top-of-doc banner for what is still in force.
