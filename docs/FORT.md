# The Fort — Structure, Rooms, Comfort & Prestige

**Status:** Canonical. The fort is the **main progression view**: you slot cards into rooms, rooms produce **comfort**, comfort produces each room's **benefit**, and theme-room benefits are the **prestige** that drives the master clock. Builds on [CARDS.md](CARDS.md) (Card/CardSlot), [GAME_STATE.md](GAME_STATE.md), [ECONOMY.md](ECONOMY.md); decisions recorded in GENERATION_FLOW §12, §15, §18–§20. Conventions: 🔒 locked · 🛠 numbers tunable · 🟡 open.

---

## 1. Structure — a 2D vertical cross-section 🔒

A side-view cross-section of a hill-fort, always visible.
- **Cells** = `{ idx, floor, col }`; each floor starts with 3 cells; **expansion is pure gold** (excavate sideways, dig up/down; costs scale). **One room per cell**; rooms are not sized. 🟡 sizes/packing = a later depth layer.
- **Adjacency** = orthogonal neighbors; hand-authored **mate-pairs** (Kitchen↔Dining…) multiply a room's raw score (typical ×1.2, capped ×1.5).
- **Gold is the only construction resource.** Prestige is never spent — it's the *permission* (§3).

---

## 2. Rooms — two species, generic CardSlots 🔒

A **room** is built into a cell (gold cost; its type/tier must be unlocked — §3). Every room is one of **two species**:

- **Pure gate** — build once; no slots, no upgrades, no comfort. Its effect is the *unlock itself* (a menu, a capability, a region).
- **Comfort room** — has **CardSlots** (starts with **zero**; each **upgrade adds one**, gold + prestige-gated) and a **theme**; computes **comfort** (§4) which drives its **one typed benefit** (§3).

**Slots are generic** (CARDS §2): a room slot accepts **items OR obedient captives**; cells accept captives only; a bedroom has one **owner** (merc) slot that binds its theme to the owner's tags. **Mercs never staff rooms.**

**The captive-labor loop** 🔒: capture → hold (cells) → **break** (torture chamber, → `obedient` tag) → **station** in room slots. Captives + items are the workforce and the collection chase; each region's higher-tier loot makes every built room re-fillable better (the length engine).

**Slot-depth gate** 🛠 (§20.2-verified): max slots per room follows the Great Hall tier — GH T1-2 → 1 · T3-5 → 2 · T6-8 → 3 · T9-11 → 4 · T12-13 → 5 · T14-15 → 6.

---

## 3. Comfort → one benefit; prestige = the master clock 🔒

Each comfort room's number drives its **single** benefit channel (no double-dipping):

| Room family | benefit = f(comfort) |
|---|---|
| **Theme rooms** (Dining hall, Gallery, Menagerie, Kitchen, Smithy, …) | **+global PRESTIGE** — exclusively; they are the only prestige generators (plus a small Hospital contribution) |
| **Bedroom** (one type; owner = you or a merc) | the **owner's level cap** = `3 + 0.9 × comfort`; band tops ~40 normally, **endgame buildings raise the band → ~50** |
| **Functional rooms** (Infirmary, Market, Ransom office, Torture chamber, Interrogation, Oracle, Hospital) | their **unique bonus** (heal speed, prices, break speed, leads, odds precision; Hospital also grants pay-gold instant heal on build) |

**GLOBAL PRESTIGE = Σ theme-room comfort.** Its only job: **permission** — it gates the **Great Hall tier ladder**, and the Great Hall tier gates everything else:

> **The GREAT HALL** 🔒 — a no-slot landmark upgraded T1→T15 (gold + a prestige threshold per tier). **Each tier unlocks the next batch of buildings + the next slot-depth** — the tech tree made physical, the campaign's act structure (regions arrive ~every 3 tiers; see §6). Thresholds 🛠: measured-calibration × hand-smoothed **monotonic** ramp (reference: T2≈12 · T5≈88 · T8≈310 · T11≈650 · T15≈1,500; recalibrate in-engine — §20.2).

Principles 🔒: **prestige is loot-driven** (slotted captives/artifacts; gold alone can't cross a gate — theme rooms *unlock gradually*, so empty-room spam can't ladder) · **no single dominant strategy** (deep-fill / spread-wide / bedroom-lean all verified viable within ~3%) · **bedroom depth drives the cap clock** (deepen your best bedrooms; cap-binding must be loudly visible in UI).

---

## 4. The comfort formula 🔒-shape 🛠-numbers

```
raw(room)     = adjacencyMult · Σ_filledSlots overlap(card.tags, wants, clashes)
comfort(room) = min + (max − min) · (1 − e^(−max(0, raw) / k))        // k ≈ 20, floored at min
```
- `overlap` = the **same primitive the quest roll uses** (kept raw/tier-scaled; quests read its sign, rooms its magnitude — CARDS §2). A matched card's contribution scales with its **tag band** (≈ ×2 per band, 1/2/4/8 — *not* the gold curve).
- **Archetype bands** `(min,max)` 🛠: **minor (1,30) · std (2,60) · grand (4,120)**; grand rooms cost ~1.5–2× std (else dominant); `max` is an asymptote — approached only at full upgrade + great fill.
- **Theme** = concrete room type + player-applied **style** (renovation, 0.25× cost): AI rolls type+style → wanted-tags **once**; engine scores deterministically. **Re-theming your newest rooms toward the loot stream is a real, needed lever** (§20.2 — required for early-game fit rates).
- **Live-computed, never stored**; free rearrange. Cap-downgrade rule: a merc above a lowered cap **keeps their level, can't grow** past it.

---

## 5. The room catalog 🔒 (full classification: GENERATION_FLOW §19)

- **Pure gates (proto):** Map room *(first build → quests)* · Lead room · Mess hall · Storage *(no capacity mechanics anywhere)* · Tavern *(recruits)* · Dungeon *(captive list)* · Holding cell *(new captives)* · Library · Chronicle *(browse the lore/memory archive)*. (After: Workshop.)
- **Capacity:** Dungeon cells (×N, several captives each, no comfort). **Housing:** Bedroom (one type; merc bedrooms +1 roster slot; yours pre-built) · Bunkroom (starter floor).
- **Functional comfort (proto):** Infirmary *(heal speed — death is ignored in prototype)* · Hospital *(top tier; pay-gold heal + small prestige)* · Market · Ransom office · Torture chamber · Interrogation *(leads)* · Oracle *(odds precision)*.
- **Region rooms (× 4 spine + optional Underdeep):** Scouting lodge + Recruiting post = **pure gates** (open the region + its repeatable lead-hunt/recruit quests; quest *quality* comes from unit fit, not room comfort) · Training hall (after) · **Endgame building** = pure landmark (raises the bedroom comfort band; the 4 spine ones are the **Outskirts keys**).
- **Theme rooms (prestige family; ~50 types in 3 confidence tiers, §19):** proto tier-1 set ≈ Dining hall · Kitchen · Smithy · Garden · Gallery · Trophy room · Hall of arms · Shrine · Music hall · Menagerie · Treasure vault · Curiosity cabinet.
- **Cut:** training-tag rooms, faith/dark axis, walls/defense, slave pens, passive-gold production.

---

## 6. Pacing (sim-verified ×3 — §20.1, §20.2) 🛠

15 Great-Hall tiers ≈ **2,000–2,300 cycles ≈ 100–115h**; ~130–190 cycles/tier; regions arrive ~every 3 tiers (Forests T1 → City ~T4 → Coast ~T7 → Highlands ~T10 → endgame T13–15); prototype = T1–T6 (~40h). Verified: 3 player policies within ~3%, greedy prestige-rush *slower* than human play (cap→loot coupling), caps clear every region gate, dead-drop rates 33%→8%. **The build-order table** (median opening: Map room → Lead room → Mess hall → Storage → Forests lodge/post → Infirmary → Dining hall → Kitchen → bedrooms → Garden → GH T2 ≈ c130 …) lives in §20.2.
Implementation notes: loot ≈ 0.29+0.06/tier drops/cycle (author from the slot budget — oversupply = dead-drop misery) · income ~1.09^L vs costs ~1.32^T · roster width must feed loot rate · give a gold-reserve/wishlist affordance for hoard windows.

---

## 7. Open 🟡
Starter fort + build/excavate flow detail · per-room gold-cost/unlock/archetype table + adjacency mate list (assignment exists in sim; finalize at impl calibration) · **functional-room benefitCurve table** (heal speed, prices, break speed, precision — esp. **torture-chamber THROUGHPUT**: concurrent breaks + cycles/break; spec + extend the sim, it's the one unmodeled pipe) · forced negatives (deferred) · room sizes/packing (later).
