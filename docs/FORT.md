# The Fort — Structure, Rooms & Prestige

**Status:** Canonical (prototype-2, 2026-06-03). The fort is the **main progression view** — it must be viewable and fun. The spatial model is adopted wholesale from the **finalized v1 prototype** (`prototype/src/{rooms,fort,fortLayout}.ts`); this doc reconciles it to v2's two-prestige + card model and specifies the prestige formula. Builds on [GAME_STATE.md](GAME_STATE.md), [CARDS.md](CARDS.md), [ECONOMY.md](ECONOMY.md). Conventions: 🔒 · 🛠 · 🟡.

---

## 1. Structure — a 2D vertical cross-section 🔒 *(adopted from v1)*

A side-view cross-section of a hill-fort, always visible (v1 renders the ASCII silhouette).

- **Cells** are `{ idx, floor, col }`: **floor** is vertical (0 = ground, + = up, − = cellar/down); **col** is horizontal within a floor (negative = left).
- **Each floor starts with 3 cells** (`STARTER_CELL_COUNT = 3`).
- **Expansion — two axes, both pure GOLD** (no prestige gate on space):
  - **Excavate left/right** on a floor — cost scales once beyond the starter 3.
  - **Dig a floor up/down** — cost scales with floors opened.
- **One room per cell** — rooms are **not** sized (the legacy `width×height` was dropped in the finalized prototype; we keep the simpler 1-cell model). 🟡 sizes + a spatial packing puzzle are a possible *later* depth layer.
- **Adjacency** = orthogonal neighbors (same floor ±1 col, or same col ±1 floor). Bonuses come from hand-authored RoomType **mate-pairs** (Kitchen↔Dining, Armory↔Forge…), multiplicative, capped ~×1.5.
- **Gold is the only construction resource** — no second material bar.

---

## 2. Rooms 🔒-shape

A **room** is a slottable built into a cell (gold cost + prerequisites + its type must be unlocked). Three buckets:

- **Functional (capability) rooms** — **TIERED gate-ladders**: each grants a `gate` that unlocks a content tier (Scout-t1 → tier-1 leads, a higher Scout → tier-2…; Tavern → recruiting; Dungeon → captive capacity + capture quests). To unlock a higher tier you **build another room** (no upgrades), which **consumes a cell → the fort grows as you climb.** Open/extensible: add content later by adding a room with a new gate. Low prestige band; built for their gate.
- **Theme/work rooms** — **flat, NOT tiered**: the **prestige *generators*** (tag-matched occupants/items → **global prestige** via §4; Kitchen, Chapel, Library…). You don't tier them — you build them and stock them well. High band.
- **Housing** — **Merc Bedroom** (comfort → that merc's cap; owned by a merc), **Bunkroom** (starter shared housing), **Dungeon** (captive capacity).

Each RoomType (hand-authored JSON, reusing v1's `data/rooms.json` as the catalog base) declares: its **gate/effect**, which **prestige pool** it feeds, **slot counts** (occupants + items), **adjacency mates**, **theme/wanted-tags**, and its prestige **band `[min, expected, max]`** (§4).

**No room upgrades, no passive room income** (out of scope for v2).

### v2 reconciliations (from the v1/legacy model)
- **No "follower" class** — heroes→**mercs** (bedrooms); the room-staffing role is filled by **captives + items** displayed in theme rooms; captives→**Dungeon capacity + theme display**; equipment→**bedroom/display slots**.
- **Room-*types* unlock by global-prestige tier** (the tech-tree); **cells + builds stay pure gold**.

---

## 3. The two prestige pools 🔒
- **Comfort** — a **Merc Bedroom's** prestige → *that merc's level cap* (the intimate "build up your favorite" track). The bedroom's *target* is the **owner merc's own tags**, so comfort is personalized.
- **Global** — **theme/work rooms'** prestige, summed → **unlocks new ROOMS (its ONLY job)**. It never unlocks content directly: a *room* unlocks content (its gate). So *prestige → room becomes buildable → gold builds it → the room's gate unlocks the content* (e.g. a higher Scout-tier room raises lead rarity; a better Tavern raises recruit quality). **Rooms are the single locus of all unlocks; prestige is just the availability meter.**

Both use the **same formula** (§4); the only difference is the *target* and which pool the sum feeds.

---

## 4. Prestige formula 🔒-shape 🛠-numbers

### The primitive
`overlap(card.tags, target) → signed` — matching tags **add** (scaled by tag value/tier), clashing tags **subtract**. Theme→tag resonance is **AI-adjudicated**.

### The band
Each RoomType has `[min, expected, max]`:
- **`min`** = the empty-but-built room's prestige (the floor; replaces a "base" term).
- **`max`** = an **unattainable ceiling** — you asymptote toward it, never reach it → permanent headroom.
- **`expected`** = where **typical play** lands — the **balancing anchor** the progression curves are tuned against.

### The computation
```
rawScore(room) = ( Σ occupants overlap(occ.tags,  target)
                 + Σ items     overlap(item.tags, target) ) × adjacencyMult(room)

prestige(room) = min + (max − min) · (1 − e^(−rawScore / k))      // saturate; floored at min
```
- **`target`** = the room's **theme** (theme rooms) or the **owner merc's tags** (bedrooms).
- **`adjacencyMult`** multiplies **rawScore** (not the output — so it can't break `max`); capped ~×1.5.
- **`saturate` makes `max` unattainable** (a hard clamp would let you hit it) and gives diminishing-returns feel.
- **Floored at `min`** (you'd just remove a net-negative occupant).
- **`k`** calibrated so a typical rawScore lands on `expected`.

### The consumers
```
GLOBAL = Σ over theme rooms · prestige(room)      →  fort tier (lead rarity + room-type unlocks)
COMFORT(merc) = prestige(merc's own bedroom)      →  merc level cap = capCurve(comfort)
```
The **`expected`** values are what make calibration possible: fort-tier thresholds sit against `Σ expected`; `capCurve` maps `expected` comfort → a level-appropriate cap and `max` comfort → near the soft cap (~40, never quite).

### Properties
- **Live-computed, never stored** — recomputed on any card move; free rearrange.
- **No base / upgrade / income terms.** One function, one formula, two targets, two pools.

---

## 5. Open / next 🟡
- **The RoomType catalog** — enumerate the actual rooms (gate, pool, slots, adjacency mates, theme, band) off v1's `rooms.json`. *Needs a steer on the capability set.*
- **Curve calibration (#3)** — `capCurve` and the fort-tier thresholds, tuned against `expected` (numbers, fun-before-balance).
- **Starter fort + build flow** — day-1 cells/rooms + the Fort-Phase build/excavate/assign actions.
- 🟡 room sizes + spatial packing puzzle (a later depth layer).
