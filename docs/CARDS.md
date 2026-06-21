# Cards — the unit model

**Status:** Canonical. Everything you own is a **Card** (`class` distinguishes types). **Quests and rooms hold cards in CardSlots.** One function — `overlap(have, want)` — scores a card's tags against any CardSlot it sits in, powering both the dice roll and prestige. Conventions: 🔒 locked · 🟡 open. Roll/prestige numbers live in [GENERATION_FLOW.md](GENERATION_FLOW.md) §10/§15 and [FORT.md](FORT.md).

---

## 1. The Card 🔒

A **Card** is any owned, taggable thing.

```
Card { id, class, name, tags[], value, location, ... }
  character  → + attributes, growth, level, role   (the ONLY dice-toucher)
  equipment  → ilvl + tags     (display → prestige)
  furniture  → ilvl + tags     (display → prestige)   ("equipment" vs "furniture" = which slot it fits)
  consumable → ilvl + tags     (stackable; one-shot in a quest, then consumed)
  gold       → count           (currency, paid into cost slots)
  liability  → negative value  (evidence / mess / debt — a problem with a face; see ECONOMY)
  … more classes later — the model is built to extend
```

**Two load-bearing rules:**
1. Only the **character** class carries attributes/level, so **only characters touch the dice**. Every other class contributes **only tags** (read by `overlap()` wherever it sits) — so items can never unbalance the roll.
2. **Cards never attach to cards.** Only **rooms and quests** have CardSlots. A character's gear lives in its owned bedroom (a room); an **injury** is intrinsic state on the character (§11), not a card; a negative that hits a room (`infestation`) is *force-slotted into the room*. (See [GAME_STATE.md](GAME_STATE.md).)

**Value** is gold-denominated and signed — every card has a value (negatives are negative). Full economy in [ECONOMY.md](ECONOMY.md).

---

## 2. CardSlots 🔒

A **CardSlot** is one spot that holds a Card. **Quests and rooms have CardSlots** — a Card is placed *into* a CardSlot; cards never attach to cards. Placing a Card into a CardSlot is the one universal interaction; the engine validates the slot's `accepts` (card classes) + `requirement`.

```
CardSlot { accepts: CardClass[]; requirement: open | must-be <card> | must-have <tag>; filledBy? }
   + on a QUEST slot:  tested { attribute, favored, clashing }, groupId   (approach-branch)
   + on a ROOM slot:   kind: display | occupant | captive | owner
```
When slotted, a Card's `location` is a CardSlot reference (`quest:<id>#2` / `room:<id>#1`); otherwise it is a holding state (roster / inventory / limbo / staged). One placement model for both hosts.

- **Quest slots** by accepted class: *party* (character; carries the `tested` attribute + favored/clashing skills) · *cost* (gold) · *requirement* (item/consumable, consumed).
- **Room slot kinds**: *display* (item/furniture → prestige) · *occupant* (a working merc → prestige **+** a room FUNCTION, e.g. heal speed) · *captive* (a captive → capacity **+** prestige) · *owner* (one merc; binds a bedroom's theme target to its owner).
- **Requirement** — `open` / `must-be <card>` / `must-have <tag>`.
- **Fill rule** — a quest needs **all party slots filled** (no partial sends; the threshold assumes N). A room scores whatever is filled.
- **Mutex (branches)** — quest approach-groups are mutually exclusive: filling one locks the others.
- **Fit** — `overlap(card.tags, wants, clashes)` scores a card against its slot's wants (quest = the slot's favored skills; room = its theme) — the **one shared primitive** powering both the dice roll and prestige. (Kept raw/tier-scaled; the quest layer scales it into coin units — see GENERATION_FLOW §15.)

**Stacks.** Fungible cards (gold, identical consumables) store as `{card ×N}` — a count, not N objects. Unique cards (characters, rolled items) are singletons.

---

## 3. The character class 🔒

Mercenaries, captives, and NPCs are all `class:character`, distinguished by `role` (merc / captive / npc / dead). A character is:

- **Tags** — identity + fit + the loot dopamine. **Personality IS tags.** Plus AI-generated **quirks**.
- **Attributes** — five scalars: **Strength · Dexterity · Intelligence · Charisma · Constitution** → the **coin count** (the only thing that generates dice).
- **Growth (replaces "talents")** — a fixed-sum **base** vector (random distribution = birth lean; flat L1 floor) + a fixed-sum **growth** vector reshaped by the player-assigned **FOCUS** (single → one GREAT stat · dual → two GOOD · none → generalist). No rolled talents. (Detail: GENERATION_FLOW §10.)
- **Level** — grown by quest-XP toward a cap = **`3 + 0.9 × comfort`** (the merc's own bedroom prestige; soft cap ~40, region endgame buildings lift it → 50). Items feed power *only* through comfort, never the roll.
- **who + backstory** — AI-written at acquisition, fitting the tags.
- **Chains / dossier** — the sagas a character passes through are its **living dossier** (no separate psychological model; see GENERATION_FLOW §14).

### The roll (numbers in GENERATION_FLOW §10)
> `coins = attribute + matching-tag + attribute-tag − clash − injury`
> Flip `coins` fair coins; count heads vs the slot's threshold → **success** (≥ bar) / **partial** (≥ 0.6 × bar) / **failure** → reward value **full / half / zero**. A party **pools** its members. **Engine owns every number**; odds are shown before commit. (No critical — jackpot variance lives at reward *generation*, not the roll.)

**Injury** = intrinsic tiered state on the character (AI-judged severity → tiers → a flat coin penalty on all rolls; heals at gold/time). Full model in GENERATION_FLOW §11.

---

## 4. Item classes 🔒

Items are `class:equipment | furniture | consumable` — **ilvl + tags, no attributes, no level-growth.**

- **Item level (ilvl)** — fixed at the drop = the **source quest's level**; it never grows. It **gates which tag-tiers can roll**, so higher-level quests drop more desirable items (the loot chase). Item generation mirrors character-gen (value-budgeted, ilvl-gated tags).
- **Display items** (equipment / furniture — differ by which themed slot they fit): slotted into a tag-matched room → **prestige** (§5). They **never touch the roll**.
- **Consumables** — stackable; slotted into a quest's requirement slot for a **one-shot, bounded** effect, then consumed.
- **Gold** — stackable currency; paid into quest cost slots and room build/upgrade/renovation costs.

---

## 5. Prestige — the main progression (detail in FORT.md, GENERATION_FLOW §15) 🔒

Cards slotted into a room's CardSlots generate **prestige**, the spine of progression: you raise prestige to advance. One formula per room (a saturating band over the slotted cards' `overlap` fit). Then, by room:
- a **bedroom's** prestige (= "comfort") sets **its owner merc's level cap** — *its only effect*;
- **every other room's** prestige is **summed into global prestige**, which unlocks new buildable room-types.

A room starts with **zero CardSlots** and gains them by **upgrading** (gold); its **theme** (the `wants` tags `overlap` scores against) is **player-assigned via renovation** (gold), and the AI rolls the theme into a tag set **once**, which the engine then scores deterministically.

---

## 6. Value & generation 🔒

**Value is the universal currency** (gold-denominated, signed). A card's `value` is **marked at generation = the target value spent**; its tags are the *substance* and may diverge from the mark (the jackpot gap). Generation spends the target on tags under a source-level/ilvl tier ceiling. Full pricing + the `generateCard` algorithm in [ECONOMY.md](ECONOMY.md). Attributes grow with level (per growth + focus); tags are fixed (rare quest-stamped tags = deferred, not in prototype).

---

## 7. Deliberately cut / deferred 🟡

Cut (anti-bloat): rolled talents/aptitude · tag fading · the `origin` field · attribute two-faces · free item→merc tag-lending (off-balance). Deferred: the tag vocabulary + mutex lists (content); reroll currencies; quest-stamped/tier-drift tags; bounded merc-facing item effects; all balance numbers (in ECONOMY / GENERATION_FLOW). (Tags are 20-tier per §8 — not the old 5.)
