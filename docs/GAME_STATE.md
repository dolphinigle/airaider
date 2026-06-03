# Game State & Progression

**Status:** Canonical (prototype-2, 2026-06-03). What the game persists, how characters/loot enter, and how the fort progresses. Builds on [CARDS.md](CARDS.md) (the card model) and [DESIGN.md](DESIGN.md) (the loop). The full room-set is a separate pass (TBD). Conventions: 🔒 · 🛠 · 🟡.

---

## 1. The state = one card collection + placements 🔒

Everything you own — mercs, captives, items, gold — is a **Card**, stored uniformly. The save is:
- the **card collection**, each card with a **location**: inventory / staged in the **Tavern** / held in the **Holding Cells** / occupying a **room-slot** / assigned to a **quest-slot**;
- **gold** (a stack), the **fort layout** (rooms + their slots + contents), the **lead board**, and **active chains**.

**Prestige is computed live, never stored.** Leads and quests are board state, not owned cards.

**Cards are never attached to cards** — only **slottables** (rooms, quests) have slots. A character's gear lives in its *owned bedroom* (a room); an **injury is a temporary tag** on the character, not an attached card; a negative that hits a room (`infestation`) is **force-slotted into the room** (occupies a slot → negative output; clear it at a cost).

---

## 2. Two prestige pools 🔒 *(the key structure)*

> The fort's spatial model, room set, and the **prestige formula** are in [FORT.md](FORT.md). This section is the summary.

There are **two** prestiges, and they do **not** mix:

| | source | drives | feeds global? |
|---|---|---|---|
| **Merc-Room prestige** ("comfort") | items/furnishings displayed in *that merc's own bedroom* (tag-matched) | **that merc's level cap** (per-merc) | **No** |
| **Global prestige** | captives + items displayed in the fort's *theme rooms* | **unlocks new ROOMS only** (its sole job) — content is then gated by the *rooms* you build (a Scout-tier room raises lead rarity, a better Tavern raises recruit quality, …) | — |

"Comfort" is the in-fiction name; mechanically both are prestige. The level cap is therefore **per-merc**, set by how well *their* room is appointed — not a global ceiling.

**The loot-allocation choice this creates:** a great item can pump a **merc's room** (raise *that* merc's cap) or a **theme room** (raise *global* prestige for everyone). Captives mostly feed global; **items are the flexible resource you split between the two tracks.** That opportunity cost is the min-max tension, and the per-merc track ties power progression directly to **attachment** — you build up the people you love.

---

## 3. Merc power 🔒-shape 🛠-numbers

- **Attributes → coins** (the roll, CARDS.md §2).
- **Level → grows attributes.** Two inputs: **quest-XP** levels a merc *up*, toward a **cap set by their room comfort** (respecting the soft cap ~40; crawl past it, no hard cap). 🟡 the XP curve is open (likely XP from completed quests).

So a merc gets stronger by being *played* (XP) and *housed well* (comfort → cap). Items feed power only through this controlled channel — never the roll.

---

## 4. Progression — the two-track spiral 🔒

```
 per-merc track:  loot(items) → furnish a merc's bedroom → COMFORT → their cap
                                                  → level (quest-XP) → stronger
 global track:    loot(captives+items) → theme rooms → GLOBAL prestige
                                                  → fort tier: rarer leads, new room types
 gold:            builds the rooms for both tracks (+ prerequisite rooms = a tech-tree)
```

**Gold builds; global prestige unlocks room-types + content tier; comfort caps each merc; quest-XP levels mercs toward their cap.** The **marriage**: global prestige raising the lead-rarity ceiling is what makes the mechanical grind **unlock the rare / focal-character sagas** — the min-max engine buys access to the AI/story engine.

---

## 5. Staging, capacity, no conversions 🔒

No one joins or is held instantly — they **stage** in a building, with full stats visible and a **timer**:

- **Tavern** (build → unlocks recruiting): stages *all* hireable people — recruit-pool applicants **and** quest-reward recruits. Inspect, then hire for gold (needs a free merc slot). They leave when the timer ends. 🟡 earned/focal recruits may get a longer hold.
- **Holding Cells** (+ buildable **Cells/Dungeons** for capacity): stage captives and their disposition choices (display-for-prestige / ransom / sell).
- **Merc Bedrooms**: each grants **+1 merc slot**, is **owned by a merc**, and is their personal display space (its comfort sets their cap).

**No state-flow conversions in prototype 2** — a captive stays a captive; a recruit is hired or expires. A focal character's play-determined **fate just decides which staging building they land in** (recruit → Tavern, captive → Holding Cells).

---

## 6. Live, never permanent 🔒

Prestige and every room effect = `Σ rooms overlap(theme, currently-slotted cards)`, **recomputed on any move**. **Free rearrange** — nothing is a stored increment. (Add move-friction only if shuffling proves degenerate in play.)

---

## 7. Open / next
- 🟡 **Merc XP curve** (numbers; fun-before-balance).
- 🟡 **The full fort room-set** — the next design pass; this doc gives it solid nouns to sit on.
- 🟡 Earned-recruit Tavern timer.
