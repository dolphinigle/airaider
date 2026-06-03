# Cards — Characters, Items & the Roll

**Status:** Canonical (prototype-2, 2026-06-03). The unit model. **Everything you own is a Card; `class` distinguishes types; Character is one class.** This supersedes the old CHARACTERS.md. Conventions: 🔒 locked · 🛠 numbers deferred · 🟡 open.

---

## 1. The Card abstraction 🔒

A **Card** is any owned, taggable thing. One field — `class` — says what it is; one function — `overlap(have, want)` — scores its tags against any slot it sits in (a quest's ask, a room's theme). That single function powers fit, prestige, and (later) everything else.

```
Card { class, tags[], location, ... }
  class = character   → also has attributes + TALENTS + level + role   (the ONLY dice-toucher)
        = equipment   → ilvl + tags        (display → prestige; "equipment" vs "furniture" = flavor)
        = furniture   → ilvl + tags        (display → prestige)
        = consumable  → ilvl + tags        (stackable; one-shot in a quest, consumed)
        = gold        → stackable count     (currency, paid into cost slots)
        = liability   → negative value      (evidence / mess / debt — a problem with a face; see ECONOMY)
        … more classes later — the model is built to extend
```

**Two load-bearing rules:**
1. Only the **character** class carries attributes/talents/level, so **only characters touch the dice**. Every other class contributes *only tags*, read by `overlap()` wherever it's slotted — that's why items can never unbalance the roll.
2. **Cards are never attached to cards.** Only **slottables** (rooms, quests) have slots that hold cards. A character is a card, not a slottable, so its state is *intrinsic* (tags/attributes/talents) — its gear lives in its owned bedroom (a room), and an **injury is just a temporary negative tag** on it. Negatives that hit a room (`infestation`) are *force-slotted into the room*. (See [GAME_STATE.md](GAME_STATE.md).)

**Value** is gold-denominated and signed — every card has a value (negatives are negative). The full economy is in [ECONOMY.md](ECONOMY.md).

### Slots & slottables 🔒
**Slottables** — the things that *have* slots — are **quests** and **rooms**. Cards are placed *into* slots; cards never attach to cards.
- **Slot types** (each accepts certain classes): *party* (character) · *cost* (gold) · *requirement* (item/consumable, consumed) · *room-display* (captive / item) · *approach-group* (a branch wrapper — QUESTS §9).
- **Requirements** — a slot is `open` / `must be <merc>` / `must have <tag>`.
- **Fill rule** — a quest requires **all its party slots filled** (a full party; no partial sends — the threshold assumes N). If a required slot can't be filled (you own no valid card), the quest is **unpursuable** until you do.
- **Mutex (branches)** — approach-groups are mutually exclusive: filling one **locks the others**; the chosen group is your approach.

**Stacks.** Fungible cards (gold, identical consumables) store as `{card ×N}` — a count, not N objects. Unique cards (characters, rolled items) are singletons.

**Slots are typed by the classes they accept** (Sultan's-Game style): quest *party*-slots (character), *cost*-slots (gold), *requirement*-slots (item/consumable, consumed); room *display*-slots (captive or item). Some accept any. Placing a card in a slot is the one universal interaction.

---

## 2. The character class 🔒

Mercenaries, captives, and NPCs are all `class:character`, distinguished by `role` (merc / captive / npc / dead). A character is:

- **Tags** — identity + fit + the loot dopamine. **Personality IS tags.** Plus AI-generated **quirks** ("counts coins twice").
- **Attributes** — five scalars (Physical, Agility, Intelligence, Charisma, Willpower) → the **coin count**. The only thing that generates dice.
- **Talents** — per-attribute **growth rates** (Pokemon-style innate potential): how fast each attribute climbs with level. Rolled at acquisition, **separately from the value budget** (value = tags only). Two same-level mercs differ by their talents.
- **Level** — grows attributes per the talents (the progression axis). Grown by quest-XP, capped by the merc's room comfort (see GAME_STATE.md).
- **`who` + backstory** — AI-written at acquisition, fitting the tags.
- **Their chains** — the quests they pass through (cast in others') plus the one about them. *The chains are their living dossier* — no separate psychological model.

### Tags
One unified vocabulary (~50–100 base tags). Each tag = `{ base, tier }` — one tag per concept, **5 intensity tiers** (T5 common → T1 rare, e.g. `pretty → gorgeous`). **Mutex groups** (temperament, mood, ethics, work-ethic, allegiance, money, faith, background, gender) prevent self-contradiction. **Matching and clashing both bite** in the roll. Themed-room fit is AI-adjudicated. Identity tags are mostly fixed; rare exceptions = quest-stamped tags + scars. **Injury = a temporary negative tag** (clashes in the roll → fewer coins; healable at gold/time — wounds are tags, not attached cards). 🟡 the vocabulary is the big content job.

### The roll
> **coins N = base(relevant attribute × level) + Σ matching-tag bonuses (by tier) − Σ clashing-tag penalties.**
> Flip N coins → heads vs threshold → **success / partial / failure** (three outcomes — *no critical*; the jackpot variance lives at reward *generation*, not the roll). Party sums contributions. Odds are visible before commit.

Two levers move the odds: **level** (the grind, via attributes) and **tag-match** (per-quest min-max). The quest authors *what is tested*; the engine sets the *threshold* (QUESTS.md).

### Value & generation
**Value is the universal currency** (gold-denominated, signed). A card's value = Σ its tag values; generation spends a target value on tags under a source-level tier ceiling. **Full detail — pricing, the `generateCard` algorithm, talents, the split — is in [ECONOMY.md](ECONOMY.md).** Growth: attributes ↑ with level (per talents); tags fixed except rare quest-stamped/scars.

---

## 3. Item classes 🔒

Items are `class:equipment | furniture | consumable`. They carry **ilvl + tags, no attributes, no level-growth.**

- **Item level (ilvl)** — PoE-style, **fixed at the drop = the source quest's level**. It does *not* grow. It **gates which tag-tiers can roll** on the item, so **higher-level quests drop more desirable items** (the loot-tier chase). Item generation mirrors character-gen (value-budgeted, ilvl-gated tags). Reroll currencies (chaos-orb style) = later.
- **Display items** (equipment / furniture — flavor distinction, differ mainly by which themed slot they fit): displayed in a tag-matched room → **prestige** (GAME_STATE.md). They never touch the roll. *(A controlled, bounded per-merc effect could be added later, but never free tag-stacking.)*
- **Consumables**: stackable; slotted into a quest's requirement/boost slot for a **one-shot, bounded** effect, then consumed. Faucet = quest rewards (shop later).
- **Gold**: stackable currency; minted from your counter into a quest's cost slots when you pay.

---

## 4. Deliberately cut / deferred
Cut (anti-bloat): tag fading / soft-cap-of-10 · the `origin` field · attribute two-faces · ten-tier curve (5 is plenty) · traumas-as-tags · free item→merc tag-lending (off-balance). Deferred: tag vocabulary + mutex lists (content); reroll currencies; bounded merc-facing item effects; all balance numbers.
