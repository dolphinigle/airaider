# Fort and Prestige

**Status:** Locked. Diverges from AI Stronghold's flat-list room model in favor of a 2D side-view cross-section ("Tiers" model). Theme/tag-matching, prestige formula, and JSON-defined RoomTypes are all inherited unchanged.

## Locked principle: hand-authored content, AI flavor only

**Every RoomType is hand-authored in JSON.** AI generates only:
- The `theme` string on a built room instance (player-prompted or AI-suggested).
- The flavor narration describing the room and what happens in it.

AI never invents new RoomTypes, never adjusts base prestige or slot widths, never gates on mechanics. This is the universal "engine owns numbers, AI owns flavor" rule applied to rooms. Moddability: shipping content + community mods both come through JSON.

## Spatial model — side-view 2D cross-section

The fort is a **2D grid of cells** rendered as a side-view cross-section of a hill-fort. Always entirely visible (zoom out to see the silhouette; zoom in to interact). No view switching, no wing tabs.

- **Cell coordinates:** `(tier, x)`. `tier = 0` is ground level; `tier > 0` is upper floors built up; `tier < 0` is cellar levels carved down.
- **Cells have one of three states:** empty (unbuilt void), opened (paid for, available), occupied (part of a room).
- **Expansion** = paying **gold** to open a new cell adjacent to any already-opened cell. **Cost scales** with total opened cells (inherited `BaseCost × Multiplier^N` formula). There is no prestige unlock gate on cells — expansion is pure economic pressure. **Gold is the only tracked construction resource** — no wood, no stone, no second bar.
- **No tier names, no tier themes, no architectural personality.** Tiers are spatial coordinates only. AI uses raw spatial language ("above the hall", "leftmost on the ground floor", "the cellar's far end") freely.

## Rooms

A `Room` instance occupies a `width × height` rectangle of opened, currently-empty cells in a single tier.

- **Widths: 1, 2, or 3.** Declared per RoomType in JSON. Examples: bedroom = 1, armory = 2, great hall = 3.
- **Heights: 1 (default) or 2.** Almost all rooms are height-1. A small hand-authored set (~3) of monumental, `maxCopies: 1` rooms are height-2 (Great Hall, Reliquary, Cathedral-type endgame trophies). Height-2 rooms span across one tier and the one above.
- **Properties (inherited):** `roomTypeId`, `level`, `theme`, `assignedFollowerIds`, `displayedArtifactIds`.

### Adjacency

Two rooms are **adjacent** when one's outer cell-boundary touches another's. Within a tier this is left↔right neighbors (most common). For monumental height-2 rooms, adjacency also exists on the upper tier.

Adjacency bonuses come from **hand-authored RoomType pairs**, declared per RoomType in JSON. Examples:
- Kitchen ↔ Dining Room: +25%
- Library ↔ Scriptorium: +20%
- Armory ↔ Sparring Post: +20%
- Armory ↔ Forge: +15%
- Dungeon ↔ Interrogation Room: +30%

There is **no generic theme-tag adjacency between rooms** — adjacency is exclusively between explicit RoomType pairs. This keeps placement strategy designable and learnable.

**Hero bedroom adjacency (planned, for late-game min-maxing):** a Hero's Bedroom gets bonus prestige when adjacent to a room whose RoomType is in that hero's `tag_preferred_neighbors` set (derived from the hero's own tags). Different heroes want different neighbors. Numbers TBD.

Adjacency bonuses stack multiplicatively, capped at ~×1.50 to prevent runaway chains.

### RoomType (JSON-declared)

```json
{
  "thingId": "room_type:armory",
  "type": "room_type",
  "name": "Armory",
  "width": 2,
  "height": 1,
  "maxCopies": 2,
  "basePrestige": 8,
  "maxFollowers": 2,
  "maxItems": 4,
  "themePromptHint": "weapons, training, war",
  "upgradeTrack": [...],
  "adjacency_bonuses": {
    "room_type:sparring_post": 20,
    "room_type:forge": 15
  },
  "raidBuff": { ... optional ... }
}
```

## Housing and assignment (cap mechanics)

**Cards that occupy the fort have two separate mechanics:** housing (caps total count) and assignment (drives prestige). Both apply to followers and captives; heroes use a simplified version.

| Card type | Housing mechanic (cap) | Assignment mechanic (prestige) |
|---|---|---|
| **Heroes** | 1 Hero's Bedroom per hero (or 1 Bunkroom slot for un-roomed heroes). Bedroom is a normal RoomType; Bunkroom is the starter shared-housing RoomType, vestigial once dedicated bedrooms cover the roster. | Heroes "work" on raids; their bedroom's RoomType-specific prestige formula factors in level, gear, history, and tag-match adjacency. |
| **Followers** | Total follower cap = Σ capacity of follower-housing RoomTypes built (e.g. `Servants' Quarters` cap 5, `Barracks` cap 10, `Common Room` cap 3). Follower with no housing slot can't be retained. | Followers can be optionally *assigned* to a work room (Kitchen, Library, Armory, etc.). An assigned follower contributes prestige scaled by tag overlap with the room's theme. Housed-but-idle followers count toward cap but contribute no prestige. |
| **Captives** | Need at least one Dungeon-type RoomType. Captive cap = Σ capacity of dungeon-type rooms. | Captives have no work assignment. Their value is ransom/sale/conversion-to-follower. |
| **Equipment / artifacts** | Held in their owner-hero's bedroom (per equip slot rules) OR displayed in any room with `maxItems > 0`. | Equipped on a hero adds to that hero's contribution in raids; displayed artifacts add flat prestige to their room. |

**Housing rooms ≠ work rooms.** A follower lives in Servants' Quarters AND works in the Kitchen. Two different rooms, two different RoomTypes.

## Theme

Free-text on a room instance. The AI generates a list of compatible tags the first time it sees a theme. Compatible follower/equipment tags in this room → bonus prestige. (See HEROES_AND_GROWTH.md for the unified tag model — these are the same tags heroes carry.)

### Theme (legacy section)

This concept is now covered above in "Rooms · Theme". The free-text + AI-derived-compatible-tags pattern is unchanged from AI Stronghold.

## Prestige calculation

```
Fort Prestige = Σ Room Prestige

Room Prestige = ( base_prestige(roomType, level)
                + Σ follower.prestige × theme_multiplier(follower.tags, room.theme)
                + Σ artifact.prestige
                + retired_hero.prestige (if bedroom housing retired hero)
                + hero_present.prestige × hero_bedroom_tag_match (if bedroom)
                )
                × adjacency_bonus   # product of RoomType-pair bonuses
                                    # capped at ~×1.50
```

**Two prestige pressures, kept distinct:**
- *Theme-tag matching* — assigning the right follower (whose tags overlap a room's theme) to the right work room. **Inherited core dopamine loop.** Drives roster decisions.
- *RoomType-pair adjacency* — placing the right rooms next to each other. **New layer.** Drives spatial decisions.

These don't overlap mechanically — placement is a hand-authored, learnable strategy layer; follower matching is RNG-discovery joy. Both stack on top of `base_prestige`.

## What changes vs. AI Stronghold

### 1. Heroes can be retired into rooms

In AI Stronghold heroes were a separate category from followers and could not be assigned to rooms. In AI Raider a hero can be **retired**: they leave the raid roster and become a permanent room occupant. Their prestige contribution is computed from their level, gear, and **history** (number of raids survived, tags earned).

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
- Wound and trauma healing are measured in **days at camp** (a wound heals in N days of rest at the fort, faster in a Chapel/Apothecary/Tavern depending on type). Days at camp accrue wages (see `CORE_CONCEPTS.md` §14a), so healing is never *free* — the upkeep clock is the cost.
- Production rooms generate resources **on raid return**, scaled to raid difficulty. This ties the economy to play, not to idle time.

## Prestige stays room-only

Locked. Raids do not grant prestige directly. This was the most important load-bearing decision in AI Stronghold and the reason its meta loop worked. It is preserved.

The raid layer feeds prestige *only* by feeding the fort the inputs (followers, artifacts) that the player then has to place into rooms.

### 4. Spatial 2D fort layout (NEW model — Tiers cross-section)

AI Stronghold treated the fort as a flat list of rooms. AI Raider replaces this with a hand-authored 2D side-view cross-section (see "Spatial model" above). Adjacency-based prestige bonuses become a core puzzle layer; expansion is cost-driven rather than prestige-gated.

### 5. Variable room sizes

AI Stronghold rooms were uniform abstract entries. AI Raider rooms occupy `width × height` cell rectangles, hand-authored per RoomType. Width 1/2/3 is common; a handful of unique monumental rooms are height-2. This makes packing into the fort a Tetris-like decision on top of theme matching.

## Open questions

- **Room upgrade costs vs. raid economy:** how much does upgrading a Library cost in raid currency? Needs balance pass after raid design is locked.
- **Hero retirement formula:** prestige value of a retired hero is interesting — should it dominate? Should it cap at a follower's value?
- **Buff design list:** the room-to-raid buff catalog. To be designed after raid mechanics are chosen.

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
