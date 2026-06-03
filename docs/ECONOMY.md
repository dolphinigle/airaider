# Economy — Value, Reward Generation & Gold

**Status:** Canonical (prototype-2, 2026-06-03). The value economy and how the engine generates rewards. Numbers are placeholders (fun before balance); the *structure* is what's locked. Builds on [CARDS.md](CARDS.md) (cards/tags) and feeds [QUESTS.md](QUESTS.md) (the quest pipeline). Conventions: 🔒 · 🛠 · 🟡.

---

## 1. Value is gold-denominated and signed 🔒

**Everything's worth is one number — value — measured in gold-equivalent.** A reward of value 500 = "500 gold's worth of stuff." Gold is value 1:1; a unit "worth 400" is worth 400 gold-equivalent.

**Value is signed.** Positives: tags (a card's value = Σ its tag values), gold, items. **Negatives:** `injury` (a temporary negative tag on a character), `debt` (negative gold), `liability` (`evidence`/`mess` — a negative card). A **reward is a bundle of cards (positive + negative) whose NET value = a target.** This one idea unifies clean rewards, jackpot-with-a-catch, partial outcomes, and punishments.

- **tag value = custom per tag** (hand-authored), with a baseline of `rarity-base × tier-multiplier` (e.g. common 1 / uncommon 3 / rare 8 / legendary 20, × T5 1 … T1 5).
- a **source-level ceiling** caps the per-tag value a quest can roll (PoE ilvl gate) — higher-level quests drop better loot.

---

## 2. The master chart: `V_base(level)` 🔒 *(numbers 🛠)*

A **hardcoded table mapping level → value-per-merc-per-cycle** — the anchor everything is priced against. **Rate rises with level.** Everything references it:

- **quest reward** `V = V_base(quest_level) × rarity-mult × slots × random-split`
- **hire cost** `= f(recruit value)`
- **room / upgrade cost** `=` table value at that tier

**Quest-level-matching is the optimum.** Reward and threshold scale with *quest* level; a merc's coins scale with *their* level. So a level-L merc on a level-L quest earns `V_base(L)` at good odds = **ideal**. Over-leveled → trivial odds but you *under-earn*; under-leveled → bad odds. "Send mercs to quests at their level" emerges for free.

---

## 3. The split — value → a reward bundle (issue 1) 🔒

`splitValue(V, archetype, isChain)` allocates the value into kinds. **Archetype-driven, with a *randomized* division** (a ratio *range* rolled per quest, not a fixed number):

```
isChain  → { focal character: ~V }   (concentrate; per-beat side-loot is a thin gold trickle)
one-off  → archetype sets a primary kind + a unit:gold ratio RANGE, e.g.
    capture  → captive 70–90% + gold
    rescue   → recruit 70–90% + gold
    raid     → gold 70–90% + maybe a small captive
    contract → gold
    scout    → a lead + gold
 + value-scaled COUNT (a big raid's unit-share → two captives, not one)
 + small lottery chance of a bonus (a lead) or a jackpot-with-catch
```

🟡 **Need many archetypes** (content). The split's **gold portions are the player's income**; unit portions go to `generateCard` (§4).

---

## 4. `generateCard(targetV, ceiling, required[])` — spend value on tags (issue 2) 🛠

Pure engine; the AI only names/stories *after* (the handoff, QUESTS.md).

```
1. place AI-required tags (must-include); subtract their value → R
2. LOOP until R ~spent (or tag-count cap):
     • pick a base tag — drop-weight-weighted, excluding mutex conflicts
     • pick a tier — weighted toward LOW, capped ≤ ceiling AND ≤ what R affords
     • place it; R −= tagValue(tag, tier)
3. roll TALENTS separately   (attribute growth — NOT value-priced)
4. [lottery] small chance of JACKPOT-WITH-CATCH: overshoot positive, add a negative
   (debt/injury/liability) so the bundle nets back to targetV
```

The **jackpot/dud lottery comes for free** from the tier-weighting: high tiers are rare, so most cards are moderate and a lucky high-tier draw is a standout. No separate distribution machinery.

---

## 5. Outcomes — success / partial / failure 🔒

The roll is **three outcomes, no critical** (the upside lives in §4's generation lottery, so a crit band would double-dip). The reward value is **fixed at quest birth**; the outcome only scales it **down**, never rescaling a unit:

| outcome | delivery |
|---|---|
| **success** | the full bundle |
| **partial** | **half** — keep the unit + a **liability** card sized to net V/2 *(if worth keeping — a focal character survives, saddled with `evidence`)*, else give V/2 in gold |
| **failure** | nothing; **and only on risky quests**, the AI proposes a **punishment** (injury/debt/liability) *within an engine-set envelope* |

`EV per merc-cycle = P(succ)·V + P(partial)·(V/2) − P(fail)·cost`. Threshold sets the probabilities; tag-fit shifts them.

---

## 6. The economy shape — the constraint migrates 🔒

Income and expenditure **both scale with progression** (room prices, hire costs climb with level; rewards climb with rarity/level), so the *feeling* stays constant while numbers grow. The campaign is **not** always-poor (fights the cozy tone, drowns the attachment soul) nor trivially-rich. The **binding constraint migrates:**

- **early → gold** (the cold-start vise; the teacher),
- **mid → prestige + level** (can I access & survive better content?),
- **late → merc-cycles + bedrooms + attachment** (who do I send, who can I bear to lose?).

Gold is the early teacher, then **gets out of the way** so the late-game question is *"is this saga worth risking Marek?"* — not *"can I afford it?"* Keep light late sinks (luxury upkeep, top-tier rooms) so gold isn't meaningless, but never the binding constraint.

**Income:** quest gold-portions + ransom/sell of captives. **Sinks:** hiring, building/upgrading, healing injuries, clearing liabilities. **Lever:** keep income a hair behind desired spending.

---

## 7. Leads are rewards 🔒

A **lead is a deferred reward** — its worth is the **access** it grants (the rarity premium of content above your board's normal ceiling), not the full reward it leads to (you'd spend the merc-cycles anyway). So a rare lead-reward is valuable, a common one cheap. Priced by the same `rate(rarity)`. Awarding a lead = a value-priced stub on your board (a map, a rumor, a chain's sequel-seed).

---

## 8. The design knobs (all mine to tune in play)
The `V_base` chart · per-tag values · the archetype split ranges · the `generateCard` tier-weights + jackpot chance · hire-cost fraction · room costs by tier · ransom/sell rates. Structure locked; numbers tuned in play.
