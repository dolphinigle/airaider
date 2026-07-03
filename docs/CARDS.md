# Cards — the unit model

**Status:** Canonical. Everything you own is a **Card** (`class` distinguishes types). **Quests and rooms hold cards in CardSlots.** One function — `overlap(have, want)` — scores a card's tags against any CardSlot it sits in, powering both the dice roll and prestige. Conventions: 🔒 locked · 🟡 open. Roll/comfort numbers live in [GENERATION_FLOW.md](GENERATION_FLOW.md) §10/§18–§20 and [FORT.md](FORT.md).

---

## 1. The Card 🔒

A **Card** is any owned, taggable thing.

**THREE TYPES — `type` is a tag** (🔒 §7.1, uniform rule: every card = tags + value + location):
```
Card { id, name, tags[], value, location, ... }        // type:character | type:relic | type:stackable (a tag)
  type:character → + attributes, growth, level, role    (the ONLY dice-toucher; the sole GROWING type)
  type:relic     → ilvl + tags; category = its `form` tag (furniture, decoration, melee-weapon, … §9b W10)
  type:stackable → MINTED, not rolled: fixed defining tags + qty; `kind` is a tag —
                   gold · debt (negative gold) — W18: "just Gold and Debt for now"
                   LIABILITIES = NEGATIVE stackables (kind: evidence/mess/debt, negative value)
                   that TRIGGER bad events if unresolved (the story engine collects)
```
Singular vs fungible falls out of type: characters/relics carry name + story + chainIds; stackables carry qty, no identity (value: singulars = mark; stackables = qty × unit value). Consumables = a future stackable kind (not in the prototype vocabulary).

**Two load-bearing rules:**
1. Only the **character** type carries attributes/level, so **only characters touch the dice**. Every other class contributes **only tags** (read by `overlap()` wherever it sits) — so items can never unbalance the roll.
2. **Cards never attach to cards.** Only **rooms and quests** have CardSlots. Slot `accepts` matches on **type/kind tags** (`requires:[type:relic]`, `requires:[kind:gold]`) — one matching primitive. A character's gear lives in its owned bedroom (a room); an **injury** is intrinsic state on the character (§11), not a card; a negative that hits a room (`infestation`) is *force-slotted into the room*. (See [GAME_STATE.md](GAME_STATE.md).)

**Value** is gold-denominated and signed — every card has a value (negatives are negative). Full economy in [ECONOMY.md](ECONOMY.md).

---

## 2. CardSlots 🔒

A **CardSlot** is one spot that holds a Card. **Quests and rooms have CardSlots** — a Card is placed *into* a CardSlot; cards never attach to cards. Placing a Card into a CardSlot is the one universal interaction; the engine validates the slot's `accepts` (a type/kind tag query, e.g. `[type:relic]`) + `requirement`.

```
CardSlot { accepts: type/kind tag query; requirement: open | must-be <card> | must-have <tag>; filledBy? }
   + on a QUEST slot:  tested { attribute | attributes[] (multi-stat pools ×(n+1)/2), favored, clashing }, groupId
```
When slotted, a Card's `location` is a CardSlot reference (`quest:<id>#2` / `room:<id>#1`); otherwise it is a holding state (roster / inventory / limbo / staged). One placement model for both hosts.

- **Quest slots** by accepted class: *party* (character; carries the `tested` attribute + favored/clashing skills) · *cost* (gold — reserved; pay-in antes cut from prototype) · *requirement* (item/consumable, consumed).
- **Room slots are GENERIC** — differentiated only by `accepts`: a normal room slot accepts **items OR obedient captives** (both are just tagged cards to `overlap()`); a **cell** slot accepts captives only (holding, raw ok); a bedroom's **owner** slot holds exactly one merc (it *binds the room's target* to that merc's own tags — not scored itself). **Mercs are never stationable in room slots** — mercs quest; captives and items staff the fort (see §5, the captive-labor loop).
- **Requirement** — `open` / `must-be <card>` / `must-have <tag>`.
- **Fill rule** — a quest needs **all party slots filled** (no partial sends; the threshold assumes N). A room scores whatever is filled.
- **Mutex (branches)** — quest approach-groups are mutually exclusive: filling one locks the others.
- **Fit** — `overlap(card.tags, wants, clashes)` scores a card against its slot's wants (quest = the slot's favored skills; room = its theme) — the **one shared primitive** powering both the dice roll and prestige. (Kept raw/tier-scaled; rooms use its magnitude. On dice: **+0.5·U flat if the unit owns ≥1 favored skill** (no stacking, tier-blind — §16-F2, §10) and **−0.5·U mirror if it owns ≥1 clashing**; independent levers, not netted. In rooms all matched tags score by tier.)

**Stacks.** Fungible cards (gold, identical consumables) store as `{card ×N}` — a count, not N objects. Unique cards (characters, rolled items) are singletons.

---

## 3. The character class 🔒

Mercenaries, captives, and NPCs are all `type:character`, distinguished by `role` (merc / captive / npc; `dead` = lore-only, never a roster outcome). A character is:

- **Tags** — identity + fit + the loot dopamine. **Personality IS tags.** Plus AI-generated **quirks**.
- **Attributes** — five scalars: **Strength · Dexterity · Intelligence · Charisma · Constitution** → the **coin count** (the only thing that generates dice).
- **Growth (replaces "talents")** — a fixed-sum **base** vector (random distribution = birth lean; flat L1 floor) + a fixed-sum **growth** vector reshaped by the player-assigned **FOCUS** (single → one GREAT stat · dual → two GOOD · none → generalist). No rolled talents. Past growth is **banked** (re-focus only reshapes future levels → per-merc history persists). 🛠 reshape/renormalization algorithm at impl. (Detail: GENERATION_FLOW §10.)
- **Level** — grown by quest-XP toward a cap = **`3 + 0.9 × comfort(their own bedroom)`** (the bedroom's comfort band tops out ~40 under normal play; region **endgame buildings raise the band → cap ~50**). Items feed power *only* through this channel, never the roll.
- **who + backstory** — AI-written at acquisition, fitting the tags.
- **Chains / dossier** — the sagas a character passes through are its **living dossier** (no separate psychological model; see GENERATION_FLOW §14).

### The roll (numbers in GENERATION_FLOW §10)
> `coins = attribute + matching-tag + attribute-tag − clash − injury`
> Flip `coins` fair coins; count heads vs the slot's threshold → **success** (≥ bar) / **partial** (≥ 0.6 × bar) / **failure** → reward value **full / half / zero**. A party **pools** its members. **Engine owns every number**; odds are shown before commit. (No critical — jackpot variance lives at reward *generation*, not the roll.)

**Injury** = intrinsic tiered state on the character (AI-judged severity → tiers → a flat coin penalty on all rolls; heals at gold/time). Full model in GENERATION_FLOW §11.

---

## 4. Relics 🔒

Items are **`type:relic`** — **ilvl + tags, no attributes, no level-growth.** Category = the `form` tag (§9b W10: furniture, decoration, melee-weapon, …); vocabulary = form/style/trait/enchantment/standing (W10–W17).

- **Item level (ilvl)** — fixed at the drop = the **source quest's level**; it never grows. It **gates which tag-tiers can roll**, so higher-level quests drop more desirable items (the loot chase). Item generation mirrors character-gen (value-budgeted, ilvl-gated tags).
- **Display**: a relic slotted into a tag-matched room → **comfort** (§5). Relics **never touch the roll**.
- **Consumables** — a future **stackable kind** (post-prototype): one-shot in a quest requirement slot. 🟡 effect model at impl.
- **Gold / debt** — the two prototype stackable kinds (W18). Gold pays build/upgrade/renovation costs (quest cost-slot antes cut); debt = negative gold; liability stackables (evidence/mess) arrive via partial outcomes and TRIGGER events if left unresolved.

---

## 5. Comfort, prestige & the captive-labor loop — the main progression (detail in FORT.md) 🔒

Every room computes **ONE number — its "comfort"** — a saturating band over the slotted cards' `overlap` fit vs the room's theme. Comfort drives the room's **ONE typed benefit** (no double-dipping):
- **Theme rooms** → **+global PRESTIGE** — the progression currency, exclusively theirs to generate;
- a **bedroom** → its **owner merc's level cap** (and nothing else);
- **functional rooms** → their **unique bonus** (infirmary heal speed, market prices, torture-chamber break speed, oracle odds-precision…) — *not* prestige (Hospital: small exception).

**Prestige is the master clock**: it gates room **unlocks AND upgrades** (gold is the cost, prestige is the permission), quantized by the **Great Hall's tiers** (each tier = an act that unlocks the next batch of buildings). A room starts with **zero CardSlots**; each upgrade adds one. A theme room is a **concrete type** (Dining hall, Gallery, Menagerie…) plus a **player-applied STYLE** (renovation, gold): the AI rolls type+style into a wanted-tag set **once**; the engine scores deterministically forever after.

**The captive-labor loop** (who fills all those slots): capture → hold (cells) → **break** (torture chamber → `obedient`) → **station in rooms**. Captives and items are the fort's workforce and its collection game — every room is a puzzle of finding better-fitting cards, refreshed each region by higher-tier loot. Mercs never staff rooms; they quest.

---

## 6. Value & generation 🔒

**Value is the universal currency** (gold-denominated, signed). A card's `value` is **marked at generation = the target value spent**; its tags are the *substance* and may diverge from the mark (the jackpot gap). Generation spends the target on tags under a source-level/ilvl tier ceiling. Full pricing + the `generateCard` algorithm in [ECONOMY.md](ECONOMY.md). Attributes grow with level (per growth + focus); tags are fixed (rare quest-stamped tags = deferred, not in prototype).

---

## 7. Deliberately cut / deferred 🟡

Cut (anti-bloat): rolled talents/aptitude · tag fading · the `origin` field · attribute two-faces · free item→merc tag-lending (off-balance). Deferred: the tag vocabulary + mutex lists (content); reroll currencies; quest-stamped/tier-drift tags; bounded merc-facing item effects; all balance numbers (in ECONOMY / GENERATION_FLOW). (Tags are 20-tier per §8 — not the old 5.)
