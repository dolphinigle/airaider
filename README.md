# AI Raider

> A tactical raid game with fortress management. Heroes raid dangerous dungeons under direct player control, then return home so you can build, theme, and staff a prestigious stronghold.

This repository currently contains **only design documentation**. There is no code yet. The design is a remake of the ideas explored in [aistronghold](https://github.com/dolphinigle/aistronghold), keeping the prestige / RNG / payoff loop but replacing the auto-resolved stat-vs-stat missions with a real, player-controlled raid layer where most of the agency lives.

## Why a remake?

The predecessor (AI Stronghold) had a strong "payoff and progression" core: rooms, themes, followers and items dropped from quests, with prestige unlocking better quest leads. But missions were auto-resolved from hero stats. That made hero collection feel hollow — heroes were just numeric multipliers, not characters the player developed agency around. Compare to Darkest Dungeon: you also collect heroes and send them on missions, but **you play the missions**, so each hero acquires meaning through how *you* used them, lost them, kept them sane.

AI Raider's goal: **keep the meta loop, give the missions to the player.**

## Documentation

See [docs/README.md](docs/README.md) for the full design index. Start with:

- **[VISION.md](docs/VISION.md)** — pitch, pillars, what this game is and isn't.
- **[PROBLEM_AND_INHERITANCE.md](docs/PROBLEM_AND_INHERITANCE.md)** — what we keep from AI Stronghold, what we throw out, why.
- **[GAMEPLAY_LOOP.md](docs/GAMEPLAY_LOOP.md)** — the macro loop (fort phase) and micro loop (raid phase).
- **[RAID_DESIGN.md](docs/RAID_DESIGN.md)** — the tactical raid layer where player agency lives.
- **[FORT_AND_PRESTIGE.md](docs/FORT_AND_PRESTIGE.md)** — inherited base-building / prestige / RNG dopamine.
- **[OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md)** — unresolved design questions, especially around agency.

## Status

Pre-development. Docs only. Iterating on the agency problem before any code is written.
