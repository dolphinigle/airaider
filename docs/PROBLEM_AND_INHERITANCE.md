# Problem and Inheritance

**Status:** Draft

This doc records *why* AI Raider exists as a remake rather than a continuation of [aistronghold](https://github.com/dolphinigle/aistronghold), and pins down what is inherited vs. replaced.

## The agency problem (the reason for the remake)

AI Stronghold's mission system worked like this:

> Quest leads appear → player pursues a lead → AI generates a Quest with role requirements (required traits, positive/negative relevant traits) → player assigns heroes to slots → click "End Week" → quest resolves automatically from stats + RNG → AI writes a narrative of what happened → rewards are granted.

The problem: **the player's only mission-related decision is the assignment.** Once heroes are slotted, the outcome is a function of their stats. The hero is, mechanically, a slot-fitting object with numbers attached. The AI-generated narrative is post-hoc; the player has no input on it.

Contrast with Darkest Dungeon, where the player also:
- Collects heroes with personalities and quirks.
- Sends them on missions that match their composition.
- *Then plays the mission*. Positioning, ability use, stress management, when to retreat. The player *develops a relationship* with each hero by the choices they made *with* that hero.

In AI Stronghold, you cannot develop a relationship with a hero — only an opinion about whether their stats are good. The hero collection loop therefore feels hollow: heroes are interchangeable numerical contributors.

## Diagnosis

The previous design has **two strong layers** that were stitched together incorrectly:

| Layer | Quality | Why |
|---|---|---|
| Fort / prestige / RNG drops | **Strong** | Direct lift of ARPG dopamine loop. Theming and trait-matching is satisfying. Works. |
| Mission narrative | **Decorative** | AI writes flavor over a die roll. The player consumes; they do not participate. |
| Hero collection | **Weak** | Heroes have no individuality beyond stats. No player-driven story attaches to them. |

The remake replaces the middle layer (auto-resolved mission narrative) with a **player-controlled raid layer**, which in turn fixes the bottom layer (heroes become individuals through how the player *plays* them).

## What we keep (Locked)

These designs are explicitly inherited from AI Stronghold. They worked and we are not rebuilding them.

1. **Fort as the only source of Prestige.** Prestige = Σ(Room Prestige). Quests/raids do not grant Prestige directly. See [FORT_AND_PRESTIGE.md](FORT_AND_PRESTIGE.md).
2. **Rooms have themes; themes set follower trait compatibility; matched followers give bonus prestige.** The "perfect follower for this room" RNG dopamine is the central meta-game payoff.
3. **Followers and artifacts as the RNG payoff.** Raid loot is followers (for fort) and artifacts (for fort display or hero equipment), with randomized traits and AI-generated flavor. This is the ARPG-style dopamine generator.
4. **Stories as persistent narrative threads** that influence which raid leads appear, not as primary content. Stories accumulate state from raid outcomes.
5. **Quest Leads → Quests** pursuit model. The player decides which leads to pursue; pursuit consumes time/resources; the resulting raid is what you actually play.
6. **Trait + attribute system for entities.** Traits are tags (no values); attributes are numbers. Used for compatibility (rooms ↔ followers) and for raid mechanics (heroes ↔ encounters).
7. **Everything is a "Thing" with an ID.** Central registry pattern. Mods drop in JSON.
8. **AI generates flavor; mechanics are deterministic.** AI writes names, descriptions, post-raid epilogues. AI does not decide outcomes.

## What we replace (Locked)

1. **Auto-resolved missions → player-controlled raids.** This is the headline change. The raid is a real play session. See [RAID_DESIGN.md](RAID_DESIGN.md) (currently Open).
2. **Quest "role slots with trait requirements" as the central mechanic → heroes as playable units.** Traits still matter (they unlock options, modify abilities, gate certain raids), but the primary question becomes "can I play this raid well with this party?" not "do my heroes satisfy the trait checklist?".
3. **Hero injury / death as a number-flag → hero state earned through play.** A hero's scars, traumas, and signature abilities come from raids the player ran. Permadeath is possible.
4. **Week-based turn → run-based turn.** "End Week" becomes "Return from Raid". A raid takes as long as the raid takes; back at the fort the player decides when to launch the next one. See [GAMEPLAY_LOOP.md](GAMEPLAY_LOOP.md).

## What is still open

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). The big one:

> **What does a raid actually look like?** Real-time tactics? Turn-based grid? Card-driven encounters? Darkest-Dungeon-style line combat? Each option has different implications for agency, dev cost, and how heroes feel.
