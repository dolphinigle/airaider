# Game State & Progression

**Status:** Canonical. What the game persists, the determinism model, and how progression flows. Builds on [CARDS.md](CARDS.md) (Card/CardSlot), [FORT.md](FORT.md) (comfort/prestige), [LORE.md](LORE.md) (the lore graph). Conventions: 🔒 · 🛠 · 🟡.

---

## 1. The state = one card collection + placements + the lore graph 🔒

Everything you own — mercs, captives, relics, stackables (gold/debt) — is a **Card** (`type` tag: character / relic / stackable; §7.1), stored uniformly. The save is:
- the **card collection** — each card's `location` is a **CardSlot reference** when slotted (`room:<id>#1` / `quest:<id>#2`), else a holding state (roster / inventory / staged / limbo — limbo = generated but not yet owned, e.g. a chain focal pre-acquisition);
- **gold** (a stackable card, shown as a counter), the **fort** (cells + rooms + their CardSlots + upgrade levels + stored theme-tags), the **lead board**, **active chains**, the **Great Hall tier**, **unlocked regions**, and the **RNG state** (persisted, not re-derived);
- the **lore graph** ([LORE.md](LORE.md)): nodes' blurbs/dossiers + memory-edges — **append-only with an `active` flag; nothing is ever hard-deleted** (inactive = hidden from AI context, still player-readable in the Chronicle).

**Comfort/prestige are computed live, never stored** — recomputed on any card move; free rearrange. **Cards are never attached to cards** — only rooms and quests have CardSlots. A character's gear lives in its owned bedroom; an **injury is intrinsic tiered state** on the character (GENERATION_FLOW §11), not a card or tag.

---

## 2. Determinism — the three producers of saved state 🔒

1. **Engine (seeded RNG + fixed mappings)** — dice outcomes, reward *values* (generated at quest birth), XP/gold/prestige math, band→tier conversions. Reproducible from the seed.
2. **AI: creative + bounded categorical picks** — bibles, narration, memory-edges (+ per-edge blurbs; the engine renders dossiers from them), room theme-tags, reward **kind**/label, injury **severity band**. **All saved as concrete fields.** The AI never emits a raw number — it picks a category; the engine prices it.
3. **AI: pickers** (e.g. the lore selector "which candidates need full text?") — **discarded**; their only effect is the creative call's output, which is saved.

**Reload re-runs NO AI call** — every AI effect is baked into the save. "Determinism" = engine math is seeded; AI outputs are persisted; nothing is re-derived.

**Cycle order 🔒-shape:** Fort phase (build/slot/assign) → commit → **Resolution** (quests resolve in quest-id order; lore write-backs apply *after* all of the cycle's resolutions — no same-cycle cross-feed, enabling parallel AI calls) → healing ticks, salience decay, staging timers → lead grants/expiry → next cycle.

---

## 3. Comfort → benefit; prestige = the clock 🔒 *(summary; formula & catalog in FORT.md)*

Every comfort room computes **one number (comfort)** from its slotted cards, driving its **one benefit**:

| Room | comfort drives | feeds global prestige? |
|---|---|---|
| **Bedroom** (owner = you or a merc) | **that owner's level cap** (`3 + 0.9×comfort`) | **No** |
| **Theme rooms** | **+global prestige** | that *is* their benefit |
| **Functional rooms** | their unique bonus (heal speed, prices, …) | No (Hospital: small) |

**Global prestige = Σ theme-room comfort → the master clock**: it gates the **Great Hall tiers**, which gate room unlocks, upgrade depth, and (via region rooms) the map. A prestige→expected-level mapping keeps prestige, merc caps, and region content in lock-step (sim-verified, GENERATION_FLOW §20).

**The loot-allocation choice**: a great card can deepen a **bedroom** (raise *that* merc's cap) or a **theme room** (raise *global* prestige). Captives (broken → `obedient`) and items are the fort's workforce — the min-max tension is where to slot whom, and the per-merc track ties power to **attachment**.

---

## 4. Merc power 🔒-shape 🛠-numbers

- **Attributes → coins** (the roll, GENERATION_FLOW §10).
- **Level → grows attributes** (per growth vector + player FOCUS). **Quest-XP** levels a merc toward the cap set by *their own bedroom's* comfort (normal band max ≈45 → cap ~40; endgame buildings → cap ~50). 🟡 XP curve tuned at impl (~40 cycles/level mid-game per the pacing sim).
- **Cap-downgrade**: above a lowered cap → keep level, can't grow. **Cap-binding must be loudly visible** (UI).

---

## 5. Progression — the spiral 🔒

```
loot (captives + artifacts) → slot into rooms → COMFORT
   bedroom comfort  → merc caps  → higher-level quests
   theme comfort    → GLOBAL PRESTIGE → Great Hall tiers → new rooms/upgrades/regions
   functional comfort → better fort services (heal/prices/breaking/odds)
gold → builds/upgrades/renovates (prestige is the permission, gold the cost)
higher regions → higher-band loot → every room re-fillable better → …
```

The marriage: the mechanical grind (prestige tiers) is what **unlocks the rare, known-cast sagas** — the min-max engine buys access to the story engine.

---

## 6. Staging & capacity 🔒

No one joins or is held instantly — they **stage** with full stats and a timer: **Tavern** stages hireable people (hire for gold; needs a free roster slot — merc bedrooms grant +1 each; the Bunkroom provides the starting base slots (🛠 count)); **Holding cell** stages captive candidates; **Dungeon cells** hold captives (several per cell; build more for capacity). Disposition: display/station (if obedient) · ransom/sell · (torture chamber →) break. **No other state-flow conversions in prototype**; a focal character's play-determined fate decides which staging building they land in. **No inventory capacity anywhere.**

---

## 7. Open 🟡
XP curve numbers · staging timers · starter fort composition (FORT §7) · **first-class repeat-assignment / party-memory / re-station affordances** (2,000 cycles of manual re-slotting is RSI, not min-maxing).
