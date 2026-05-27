# Progression and Payoff

**Status:** Draft (inherited core; locked principles)

This doc covers the meta-progression and dopamine economy. The principles are inherited from AI Stronghold's `GAME_PROGRESSION.md` and remain the spine of the game. The only structural change is *what the player does* between drops — they now play raids instead of clicking End Week.

## The dopamine loop (locked)

The headline payoff in AI Raider is the same as in AI Stronghold:

> *"I found a follower whose traits perfectly match my Sunken Library. Equip, place, watch prestige jump. Feels like a Path of Exile drop."*

This is the engagement engine. It works because:

1. **Randomization creates value.** Followers and artifacts have randomized traits and AI-flavored backstory.
2. **Perfect-match pursuit.** Rooms have themes. Matching traits give bonus prestige. The hunt is for the perfect fit.
3. **Tiered access.** Higher prestige unlocks higher-tier raid leads, which drop higher-tier loot. The loop tightens its own progression.

## Progression triangle

Three interlocking systems, each gating the others:

```
       Prestige (fort)
         ↗         ↘
        /           \
       /             \
   Raid Leads ←── Hero Levels (raids)
       ↘              ↗
        ↘            ↗
         Loot drops
```

- **Prestige unlocks raid leads.** Higher prestige → higher-tier leads available.
- **Raid leads test heroes.** Each raid is a play-skill challenge for the party.
- **Heroes earn XP and scars from raids.** Heroes grow not just numerically but characterfully.
- **Loot from raids feeds the fort.** Followers and artifacts and resources flow into the prestige machine.
- **Loop tightens at every tier.**

Critical constraint (locked): **raids do not grant prestige directly.** They grant the inputs (followers, artifacts) that the player then places to *make* prestige. This forces the player to engage both layers; you cannot grind one side.

## Reward economy

### Raid rewards (per raid)

Each raid yields some combination of:

| Reward type | Used for | Rarity model |
|---|---|---|
| Resources (gold, wood, etc.) | Building / upgrading rooms | Bulk, common |
| Artifacts | Display in fort OR equip on heroes | Trait-randomized, tiered rarity |
| Followers | Assign to themed rooms | Trait-randomized, tiered rarity |
| Hero XP | Hero progression | Scaled to raid difficulty |
| Scars | Hero individuality | Event-triggered, not chosen |
| Story progression | Future raid leads | Narrative-driven |
| New raid leads | Future content | Event/story-driven |

Reward value scales with raid tier; the *kind* of reward also shifts (a tier-1 raid mostly gives resources and a chance at a common follower; a tier-5 raid mostly gives artifacts and hero scars/abilities and rare follower chances).

### The reroll budget (inherited)

For artifact/follower rewards, the lead's `rewardValue` is a reroll budget. Higher-value leads generate more candidate drops and keep the best. This is the engine of rarity. Identical to AI Stronghold's mechanism.

## Progression tiers

| Tier | Prestige | Raid Lead Levels | Approximate vibe |
|---|---|---|---|
| 1 — Hovel | 0–50 | 1–5 | Local trouble. Bandits, rats, leaky cellar. |
| 2 — Hall | 50–150 | 5–12 | Regional. Bandit captains, cursed wells. |
| 3 — Keep | 150–400 | 12–22 | Notable. Cults, ancient ruins, named foes. |
| 4 — Castle | 400–900 | 22–35 | Famous. Demons, lost cities, prophecy threads. |
| 5 — Citadel | 900+ | 35–50 | Legendary. Endgame stakes. |

Numbers are placeholder; the *shape* (exponential gates, soft floors) is the inherited design.

## What play-skill replaces

In AI Stronghold, "progression" meant: build prestige → unlock higher leads → assign higher-stat heroes → auto-win. Stats were the only player input on the raid side.

In AI Raider, "progression" means: build prestige → unlock higher leads → bring well-built heroes → *play the raid well*. Stats and gear are necessary but not sufficient; play-skill is the bridge. A perfect roster played badly will lose. A scrappy roster played carefully can punch above its tier.

This is the agency fix surfacing in the progression model: **player skill is now part of the difficulty curve.** A skilled player can attempt higher-tier raids earlier; a struggling player can grind a tier safely. This is the same shape as Slay the Spire's ascensions or Darkest Dungeon's expedition difficulty — the player's skill is a real variable in the equation.

## Anti-stagnation

The mechanisms from AI Stronghold are preserved:
- Multiple raid leads available at all times (player picks).
- Difficulty variation within a tier (Easy/Normal/Hard/V.Hard variants of a lead).
- Multiple story arcs in parallel (different lead pools active).
- Fort actions (building, theme experimentation, retirement) provide progression even when raids are going badly.

A new mechanism specific to AI Raider:
- **Easier raids remain valuable for hero training.** A skilled player can choose to run a lower-tier raid to bring a new hero up safely, even though the loot is below their fort tier. This converts "easy content" into a meaningful tool (roster building) rather than wasted time.

## Endgame

Endgame is what the player makes of it. Three suggested terminal goals:

1. **Maxed fort:** every room built and themed; every room hosting near-perfect follower matches. The "trophy castle" win.
2. **Hall of Heroes:** a roster of veteran heroes with rich histories, displayed and retired into the fort.
3. **All stories concluded:** every active narrative thread driven to resolution through raids.

None of these are gated by a final boss; they are personal completion states. (A "final raid" / capstone lead may be authored, but it is optional — see Open Questions.)
