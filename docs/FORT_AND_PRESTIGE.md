# Fort and Prestige

**Status:** Draft (inherited from AI Stronghold; locked unless explicitly reopened)

The fort layer is taken almost wholesale from AI Stronghold because it worked. This doc is short on purpose: it summarizes inherited design and only flags what changes. For deep detail, refer back to AI Stronghold's `FORT_AND_ROOM_DESIGN.md` until those are mirrored here.

## Core concepts (inherited)

### Fort

Singleton. Contains rooms. Prestige is computed (`Σ room.prestige`), never stored.

### Room

An instance of a RoomType. Properties:
- `roomTypeId` — the blueprint.
- `level` — upgrade level.
- `theme` — player-provided string (e.g. "Candy Kingdom", "Sunken Library"). AI derives compatible traits from this.
- `assignedFollowerIds`, `displayedArtifactIds` — what's in it.

### RoomType

Blueprint loaded from JSON. Defines base prestige, upgrade tracks, max followers, max items, max copies.

### Theme

Free-text on a room. The AI generates a list of compatible traits the first time it sees a theme. Compatible follower traits in this room → bonus prestige.

## Prestige calculation (inherited)

```
Fort Prestige = Σ Room Prestige

Room Prestige = base_prestige(roomType, level)
              + Σ follower.prestige × theme_multiplier(follower.traits, room.theme)
              + Σ artifact.prestige
```

Followers in matching rooms can multiply their contribution substantially. Achieving the cap requires finding a follower whose traits closely match a room's theme — this is the **RNG dopamine loop** the game is built around.

## What changes vs. AI Stronghold

### 1. Heroes can be retired into rooms

In AI Stronghold heroes were a separate category from followers and could not be assigned to rooms. In AI Raider a hero can be **retired**: they leave the raid roster and become a permanent room occupant. Their prestige contribution is computed from their level, gear, and **history** (number of raids survived, scars earned).

This gives veteran heroes a meaningful end-of-life. A favorite hero you no longer want to risk becomes a centerpiece of the fort.

### 2. Rooms grant raid-side effects (some of them)

Some rooms, in addition to prestige, provide a **raid buff** — but only one buff per category is active. This is the channel by which fort investment translates into raid power without bypassing the play layer.

Examples:
- **Apothecary (level 3+):** Party starts each raid with N healing potions.
- **Library (level 2+):** Trap locations are revealed in 1 node per raid.
- **Chapel (level 2+):** Trauma chance reduced by X.
- **Armory:** Equipped artifact effects amplified by Y%.

Buffs are *small* — they do not replace play. They make the fort *matter* during a raid without auto-resolving it.

### 3. No "End Week"

There is no global tick. The fort is a save-anywhere screen. Time advances per raid.

Knock-on effects on previously week-based systems:
- Wound and trauma healing are measured in **raids-completed** (a wound heals in "2 raids by anyone in the party that wasn't this hero", for example). This keeps the player from healing for free by sitting in the fort.
- Production rooms generate resources **on raid return**, scaled to raid difficulty. This ties the economy to play, not to idle time.

## Prestige stays room-only

Locked. Raids do not grant prestige directly. This was the most important load-bearing decision in AI Stronghold and the reason its meta loop worked. It is preserved.

The raid layer feeds prestige *only* by feeding the fort the inputs (followers, artifacts) that the player then has to place into rooms.

## What is still open

- **Room upgrade costs vs. raid economy:** how much does upgrading a Library cost in raid currency? Needs balance pass after raid design is locked.
- **Hero retirement formula:** prestige value of a retired hero is interesting — should it dominate? Should it cap at a follower's value?
- **Buff design list:** the room-to-raid buff catalog. To be designed after raid mechanics are chosen.

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
