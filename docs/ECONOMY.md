# Economy — Value, Reward Generation & Gold

**Status:** Canonical. The value economy and how the engine generates rewards. Numbers 🛠 (fun before balance); structure 🔒. Builds on [CARDS.md](CARDS.md), feeds [QUESTS.md](QUESTS.md); tag/curve decisions in GENERATION_FLOW §8, pacing couplings in §20.

---

## 1. Value is gold-denominated and signed 🔒

**Everything's worth is one number — value — in gold-equivalent.** Gold is 1:1.

- **Tag value curve (20 tiers, geometric):** `value(t) = 6 × 1.9^(t−1)` — one curve over the unified 20-tier tag scale (4 bands of 5; GENERATION_FLOW §8). High tiers are rare and *feel* like jackpots by price alone.
- **MARKED value** 🔒: a card's `value` = **the generation target spent on it** (the mark), not a live Σ of its tags — tags are the *substance* and may diverge from the mark (the jackpot gap: a lucky high-tier roll is worth more than its mark says).
- **Signed:** negatives exist — `debt` (negative gold), `liability` (`evidence`/`mess` — a negative card), and **injury** (intrinsic tiers on a character; its cost = `tiers × V_base(level)`, §11). A **reward is a bundle of cards whose NET value = a target.**
- A **source-level ceiling** (ilvl) gates the tag *tiers* a quest can roll — higher-level quests drop better loot; each region's band opens a new loot **stratum** (the re-fill chase, FORT §6).

---

## 2. The master chart: `V_base(level)` 🔒 🛠

**Level → value-per-merc-per-cycle** (reference `≈ 30 × 1.35^(L−1)`), the anchor everything is priced against: quest reward `V = V_base(quest level) × rarity × slots × split`, hire cost, room/upgrade costs, injury value, healing prices.

**Quest-level-matching is the optimum** — a level-L merc on a level-L quest earns `V_base(L)` at good odds; over-leveled under-earns, under-leveled gets bad odds. "Send mercs at their level" emerges for free.

**Pacing couplings (sim-verified, §20):** player gold **income ≈ ×1.09 per level** while build/upgrade costs ≈ ×1.32 per Great-Hall tier (income must track V_base-like growth or the late game starves); **slottable loot ≈ 0.29 + 0.06×tier drops/cycle** — author the drop rate from the fort's slot+band growth budget, never from generosity (oversupply = dead-drop misery); roster width feeds drop volume.

---

## 3. The split — value → a reward bundle 🔒

`splitValue(V, archetype, isChain)`: **chain → the focal character ≈ V** (accrued as a bank, §5a); **one-off → archetype sets a primary kind + a randomized unit:gold ratio range** (capture → captive 70–90% + gold · rescue → recruit · raid → gold · contract → gold · scout → a lead), value-scaled counts, small lottery of a bonus lead / jackpot-with-catch. Gold portions are the player's income; unit portions go to `generateCard`.

---

## 4. `generateCard(targetV, ceiling, required[])` 🔒 🛠

Pure engine; the AI only names/stories after (the handoff).
```
1. place AI-required tags; subtract their value → R
2. LOOP until R ~spent (or tag-count cap):
     pick a base tag (drop-weight, mutex-safe) · pick a tier (weighted LOW, ≤ ceiling, ≤ affordable) · place
3. characters: roll the fixed-sum BASE + GROWTH vectors (GENERATION_FLOW §10 — no rolled talents; FOCUS is player-assigned later)
4. [lottery] small JACKPOT-WITH-CATCH chance: overshoot positive + add a negative so the bundle nets targetV
```
The jackpot/dud lottery comes free from tier-weighting; the card's `value` is **marked** = targetV (§1).

---

## 5. Outcomes — success / partial / failure 🔒

Three outcomes, no critical (upside lives in the generation lottery). Reward fixed at birth; the roll only scales **down**:

| outcome | delivery |
|---|---|
| **success** | full bundle |
| **partial** | **half** — keep the unit + a liability sized to net V/2, else V/2 gold |
| **failure** | nothing |

**Injury is a decoupled, AI-judged channel** (any outcome; typically failure, sometimes none even then): AI picks the severity band → engine maps to tiers → flat coin penalty; heal by rest (1 tier/2d) → infirmary (comfort → speed) → Hospital pay-gold instant. Injury's economic weight = `tiers × V_base(level)` of lost merc-time/gold. *(No "risky" flag; no death in prototype.)*

---

## 5a. Chains accrue value — the bank 🔒 *(REWARD_BANK.md)*

Each beat banks `party × V_base(level) × rarity × outcomeScale` (success 1 · partial 0.5 · failure 0); the **finale crystallizes** the bank into the focal character + surplus gold. Shortfall → keep-with-debt or the focal slips away for salvage gold; finale failure → all forfeited. A per-chain **failure budget** forces a last-chance finale rather than endless retries. Income-neutral vs one-offs; adds variance + a lump payoff.

---

## 6. The economy shape — the constraint migrates 🔒

Income and costs both scale with progression, so the *feel* stays constant. The binding constraint moves: **early → gold** (the teacher) · **mid → prestige + level** (the master clock; can I access better content?) · **late → merc-cycles + attachment** (who can I bear to risk?) — with gold returning as the *pacer* at T13–15 (Great Hall + endgame buildings are deliberately expensive; give a gold-reserve/wishlist affordance for hoard windows, §20.2).

**Income:** quest gold + ransom/sell (captives, dead drops). **Sinks:** hiring, builds/upgrades/renovations, Great Hall tiers, endgame buildings, healing. **Lever:** income a hair behind desired spending.

---

## 7. Leads are rewards 🔒

A lead is a **deferred reward** — priced by the access it grants (its rarity premium), not the reward behind it. Lead-hunting quests (region Scouting lodges) are the renewable faucet.

---

## 8. Design knobs 🛠
`V_base` · per-tag values (the §8 curve × hand exceptions) · split ranges · tier-weights + jackpot chance · hire fraction · room/upgrade/Great-Hall cost tables · ransom/sell rates · drop rate · XP curve. Structure locked; numbers tuned at implementation against the §20 sim.
