# Gameplay Loop

**Status:** Draft

AI Raider has two nested loops: the **macro loop** (Fort Phase) and the **micro loop** (Raid Phase). They share the same heroes, items and stories, but they are different games to play.

## Top-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          FORT PHASE                              │
│                                                                  │
│  Build/upgrade rooms                                             │
│  Assign followers to rooms (prestige optimization)               │
│  Display artifacts                                               │
│  Equip heroes                                                    │
│  Choose a raid lead to pursue                                    │
│  Pick a party of heroes for the raid                             │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Launch raid
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                         RAID PHASE                               │
│                                                                  │
│   Player-controlled tactical play with the chosen party          │
│   Decisions: positioning, ability use, push vs. retreat,         │
│              sacrifice, loot-or-leave                            │
│   Ends with: success / partial / failure / wipe                  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Return home
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                       RESOLUTION                                 │
│                                                                  │
│   Loot is distributed (followers, artifacts, resources, leads)   │
│   Hero state updated (XP, scars, traumas, deaths)                │
│   Related stories advance                                        │
│   New raid leads may appear                                      │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Back to fort
                               ↓
                          (loop repeats)
```

## Macro loop — Fort Phase

The Fort Phase is when the player is *the lord*. There is no real-time pressure. The player can:

### Build and theme

- Construct new rooms (some are unique, some can be built multiple times).
- Apply a **theme** to a room (player-provided string; AI derives compatible follower traits). Themes are the trait-matching surface.
- Upgrade rooms.

### Staff

- Assign followers to rooms. Each follower contributes prestige; followers whose traits match the room's theme contribute *bonus* prestige.
- Display artifacts in rooms (flat prestige).
- Equip heroes with artifacts (changes raid options, not fort prestige).

### Plan the next raid

- Browse available **Raid Leads** (analog of Quest Leads). Leads are hooks: "Excavate the buried ruins", "Investigate the smuggler's cove". Each lead has a level, difficulty, rarity, related story.
- Pursuing a lead generates the full Raid (AI generates the introductory hook, the map's flavor, the kind of encounters expected). The raid is then ready to play.
- Pick a party of heroes to bring. Party size is bounded (proposed 3–5; see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).
- Launch.

### Why not "end week"?

AI Stronghold used a weekly tick so that all assigned missions could resolve in parallel. In AI Raider missions are played, not assigned. There is nothing to advance time *for* — fort changes happen instantly, and a raid is its own session. So time advances **per raid**, not per week. (Some systems may still use "raids-since-X" as a soft clock; see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).)

## Micro loop — Raid Phase

The Raid Phase is when the player is *the raid leader*. The player controls the party directly.

What a raid contains, mechanically, is still open (see [RAID_DESIGN.md](RAID_DESIGN.md)), but the *shape* of a raid is fixed:

1. **Entry.** Brief setup screen: the lead's hook, the map, the party. Last chance to swap loadout.
2. **Exploration / Encounters.** Several decision points (combat, traps, choices, social, treasure). Player navigates; not every node must be cleared.
3. **Pressure mechanic.** Something pushes the player to not dawdle (resource attrition, escalating danger, a "noise" meter, etc. — see Open Questions). Without pressure there is no push-vs-retreat tension.
4. **Loot-or-leave checkpoints.** The player chooses when to extract. Extracting early = less loot but safer. Pushing deeper = more loot but compounding risk.
5. **Boss / climax (optional per lead).** Some leads have a fixed end; others are pure expeditions.
6. **Exit.** Successful extraction, partial loot, or wipe.

### Outcome shape

- **Clean success:** all objectives, full loot, no scars.
- **Partial:** some objectives, some loot, possibly scars or trauma.
- **Failure:** raid aborted, minimal loot, likely scars.
- **Wipe:** party lost. Heroes may die (configurable), artifacts on them may be lost or recoverable on a later "recovery" raid.

## Resolution

After the raid the game returns to the fort and applies consequences:
- Loot enters inventory; followers are added to the unassigned roster; artifacts are available to display or equip.
- Heroes gain XP. Heroes may gain **scars** (persistent traits with mechanical effect) or **traumas** (psychological state that affects future raids until healed).
- Related stories advance (state update, history entry, possibly new lead generation).
- AI generates a short **epilogue** summarising what happened in narrative form. The player consumed the *event*; the AI just decorates it.

Then the player is back in the Fort with new toys and possibly a different roster.

## What the player is *doing* moment-to-moment

| Loop | Player's hands | Player's brain |
|------|----------------|----------------|
| Fort | Slow, deliberate: drag-drop, menu picks | Optimization, collection, planning |
| Raid | Fast, tactical: ability picks, movement, target priority | Reading the situation, risk assessment |
| Resolution | Passive: review screens | Emotional payoff, planning next loop |

This rhythm — slow / fast / cool-down — is the same rhythm Darkest Dungeon, FTL, and Slay the Spire use, and it is what AI Stronghold lacked because the fast layer never existed.
