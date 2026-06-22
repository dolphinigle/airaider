# The Fort — Structure, Rooms & Prestige

**Status:** Canonical. The fort is the **main progression view** — you raise **prestige** to advance. Rooms hold cards in **CardSlots** (see [CARDS.md](CARDS.md) §2); prestige is computed from what's slotted. Builds on [GAME_STATE.md](GAME_STATE.md), [CARDS.md](CARDS.md), [ECONOMY.md](ECONOMY.md), and GENERATION_FLOW §13 (regions) / §15 (slottables) / §16 (resolutions). Conventions: 🔒 locked · 🛠 numbers → prestige-math (#41) · 🟡 open.

---

## 1. Structure — a 2D vertical cross-section 🔒

A side-view cross-section of a hill-fort, always visible.
- **Cells** = `{ idx, floor, col }`: floor is vertical (0 = ground, + up, − cellar), col horizontal.
- **Each floor starts with 3 cells.** **Expansion is pure GOLD** (no prestige gate on *space*): excavate left/right on a floor, or dig a floor up/down; costs scale.
- **One room per cell.** Rooms are not sized (1-cell model). 🟡 sizes/packing = a possible later depth layer.
- **Adjacency** = orthogonal neighbors. Hand-authored RoomType **mate-pairs** (Kitchen↔Dining…) give a multiplicative bonus, capped ~×1.5.
- **Gold is the only construction resource.**

---

## 2. Rooms & CardSlots 🔒-shape

A **room** is built into a cell. Building/upgrading a room costs **gold** (the cost) and requires its type/tier to be **unlocked by prestige** (the permission — §3). A room holds cards in **CardSlots** (kinds: *display / occupant / captive / owner* — CARDS §2).

**Rooms start with ZERO CardSlots; UPGRADES ADD SLOTS.** Each upgrade (gold + a prestige gate) unlocks +1 slot. Upgrade-level and how well you fill the slots are the two prestige levers. *(This replaces the old "no upgrades — build another room" rule.)*

Three room buckets:
- **Functional (capability) rooms** — grant a **gate** that unlocks a capability/menu or a repeatable quest faucet (Map→quests · Scout→leads · Tavern→recruits · Dungeon→captive list · Holding cell→new captives · Market, Library, Workshop, Infirmary, …). Their **occupant** slot lets a working merc boost the room's **FUNCTION** (e.g. a heal-skilled merc → faster infirmary). Low prestige band; built for the gate. (Full capability list: GENERATION_FLOW §12.1.)
- **Theme rooms** — the **prestige generators** (display slots → global prestige). Their **theme** (the tags `overlap` scores against) is **player-assigned via RENOVATION** (gold): the player names a theme ("candy"), the **AI rolls it into a wanted-tag set ONCE**, the set is stored, and the **engine scores deterministically** thereafter. Theme rooms **unlock gradually** as prestige rises (§3). High band.
- **Housing** — **Merc Bedroom** (an *owner* slot + display slots; its prestige = that merc's **comfort** → their level cap) · **Bunkroom** (starter shared housing) · **Dungeon / cells** (captive slots = capacity).

Each RoomType declares: its **gate/effect**, which **prestige pool** it feeds (comfort / global / none), **slot kinds + counts per upgrade tier**, **adjacency mates**, and its prestige **band `[min, expected, max]`** (§4). Theme **tags are NOT authored** — they're player-assigned per room.

🟡 Open: the **occupant→function** hook (how a working merc's skill maps to the room's functional output) is its own mechanic, separate from prestige — see §6.

---

## 3. Prestige — the main progression (ONE formula, by effect) 🔒

There is **one** prestige computation per room (§4). What a room's prestige *does* depends on the room:

- **A bedroom's prestige = "comfort"** → it sets **that owner merc's level cap, and nothing else.** `cap` is comfort-driven; the cap **ceiling is the comfort band** (not hardcoded). Calibrated (#41) so a maxed *normal* bedroom → cap ~40; **region ENDGAME buildings RAISE the comfort band → cap 50** (F1).
- **Every NON-bedroom room's prestige is SUMMED into GLOBAL prestige.** Global is the **master clock**:
  - it **gates BOTH room *unlocks* (new types buildable) AND room *upgrades* (more slots)** — gold is the cost, **prestige is the permission**;
  - **theme rooms unlock gradually** as global prestige climbs (so you can't gold-spam empty rooms — F3);
  - a **prestige → expected-level mapping** (#41) ties global prestige to the merc cap + quest/region level you should be facing.

Principle: **no single dominant strategy** — deep-filling a few rooms, spreading across many, leaning bedrooms vs theme rooms are all viable; the math is not tuned to force one route.

---

## 4. Prestige formula 🔒-shape 🛠-numbers

### The shared primitive
`overlap(card.tags, wants, clashes) → signed` — matching tags **add** (tier-weighted), clashing tags **subtract**. This is the **same** primitive the quest roll uses (kept raw/tier-scaled; the quest layer scales it into coins — CARDS §2, GENERATION_FLOW §15). Rooms use its **magnitude**; quests use its **sign**.

### The band & computation
Each RoomType has a band `[min, expected, max]`: `min` = empty-but-built floor · `max` = an **unattainable asymptote** (permanent headroom) · `expected` = where typical play lands (the calibration anchor).
```
rawScore(room) = adjacencyMult · Σ_filledSlots  slotBase[kind] · overlap(card.tags, wants, clashes)
prestige(room) = min + (max − min) · (1 − e^(−max(0, rawScore) / k))      // floored at min
```
- `wants/clashes` = the room's player-assigned theme (theme rooms) or the **owner merc's own tags** (bedrooms).
- A room with **0 slots (U0)** → rawScore 0 → prestige = `min`. Upgrades add slots → more rawScore → closer to `max`; `max` is only approached at **full upgrade + great fill**.
- `adjacencyMult` scales rawScore (so it can't break `max`), capped ~×1.5. `k` is tuned so typical play → `expected`.

Example theme room, band `[3, 16, 36]`:
| upgrade | slots | empty | avg-fill | great-fill |
|---|---|---|---|---|
| U0 | 0 | 3 | — | — |
| U1 | 1 | 3 | ~10 | ~16 |
| U2 | 2 | 3 | ~16 | ~24 |
| U4 | 4 | 3 | ~24 | ~32 |

**Live-computed, never stored** — recomputed on any card move; free rearrange. No base/upgrade/income terms beyond the band.

---

## 5. Region & endgame hooks 🔒-shape

- **Region faucet rooms** (Scouting / Training / Recruiting) are scoped per region (GENERATION_FLOW §13 C) — each unlocks that region's repeatable quests.
- **Endgame building (one per region)** — a capstone that (a) lifts the comfort band so caps reach **50** for that region's content, and (b) the **4 spine regions'** endgame buildings are the **keys to the shared Outskirts** (§13 F4). The Underdeep's is optional.

---

## 6. Open / next 🟡
- **RoomType catalog** (#36) — enumerate rooms (gate, pool, slot kinds×upgrade tier, mates, band). Capability list in GENERATION_FLOW §12.1.
- **Prestige math** (#41) — the bands, `k`, the comfort→cap curve + band (incl. endgame lift to 50), the room unlock/upgrade prestige thresholds, and the **prestige→expected-level mapping**.
- **Occupant→function** hook — how a working merc's skill sets a functional room's output (heal speed, etc.), distinct from prestige.
- **Forced negatives** — a liability/infestation force-slotted into a room must *subtract* prestige (off-theme tags currently score 0).
- **Slot acceptance + capacity enforcement**; **starter fort + build/excavate/assign flow**.
