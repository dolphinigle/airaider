# Economy — Value, Reward Generation & Gold

**Status:** Canonical. The value economy and how the engine generates rewards. Numbers 🛠 (fun before balance); structure 🔒. Builds on [CARDS.md](CARDS.md), feeds [QUESTS.md](QUESTS.md); tag/curve decisions in GENERATION_FLOW §8, pacing couplings in §20.

---

## 1. Value is gold-denominated and signed 🔒

**Everything's worth is one number — value — in gold-equivalent.** Gold is 1:1.

- **Tag value curve (20 tiers, geometric):** `value(t) = 6 × 1.9^(t−1)` — one curve over the unified 20-tier tag scale (4 bands of 5; GENERATION_FLOW §8). High tiers are rare and *feel* like jackpots by price alone.
- **MARKED value** 🔒: a card's `value` = **the generation target spent on it** (the mark), not a live Σ of its tags — tags are the *substance* and may diverge from the mark (the jackpot gap: a lucky high-tier roll is worth more than its mark says).
- **Signed:** negatives exist — **negative stackables** (kinds `debt` = negative gold, `evidence`, `mess` — ALL are liabilities: left unresolved they TRIGGER hostile events via the story engine — the collector arrives, the evidence surfaces; §7.1/§10), and **injury** (intrinsic tiers on a character; its cost = `tiers × V_base(level)`, §11). A **reward is a bundle of cards whose NET value = a target.**
- A **source-level ceiling** (ilvl) gates the tag *tiers* a quest can roll — higher-level quests drop better loot; each region's band opens a new loot **stratum** (the re-fill chase, FORT §6).

---

## 2. The master chart: `V_base(level)` 🔒 🛠

**Level → value-per-merc-per-cycle** (reference `≈ 30 × 1.35^(L−1)`), the anchor everything is priced against: quest reward `V = V_base(quest level) × rarity × slots × split`, hire cost, room/upgrade costs, injury value, healing prices.

**Quest-level-matching is the optimum** — a level-L merc on a level-L quest earns `V_base(L)` at good odds; over-leveled under-earns, under-leveled gets bad odds. "Send mercs at their level" emerges for free.

**Pacing couplings (sim-verified, §20):** player gold **income ≈ ×1.09 per level** (V_base grows ×1.35 — the gold *share* of rewards must shrink with level so income tracks 1.09; 🟡 the lever = a level-dependent gold-share table in `splitValue`, set at impl calibration) while build/upgrade costs ≈ ×1.32 per Great-Hall tier (income must track V_base-like growth or the late game starves); **slot-ready loot ≈ 0.29 + 0.06×tier drops/cycle (cap ~1.05)** — author the drop rate from the fort's slot+band growth budget, never from generosity (oversupply = dead-drop misery); roster width feeds drop volume.

---

## 3. The split — value → a reward bundle 🔒

`splitValue(V, archetype, isChain)`: **chain → the focal character = a rolled unit SHARE (~55–85%) × E[payoff], remainder gold** (structure per GENERATION_FLOW §1–§2; accrued as a bank, §5a); **one-off → archetype sets a primary kind + a randomized unit:gold ratio range** (capture → captive 70–90% + gold · rescue → recruit · raid → gold · contract → gold · scout → a lead), value-scaled counts, small lottery of a bonus lead / jackpot-with-catch. Gold portions are the player's income; unit portions go to `generateCard`.

> 🛠 2026-07-10: hunt/investigate softened from always-relic to 65% relic / else gold or gold+lead —
> with escort/raid relic chances on top, ~half of ALL one-offs read as fetch-the-object (readers'
> premise-monotony consensus). Mid-saga beat side-loot may also roll a relic (35%), per QUESTS §6's
> "gold/stackables/relics". Designer review pending.

---

### 3.1 What the split ACTUALLY produces — measured 2026-08-28 📏

Read off the shipped `splitOneOff`, not from intent (`v3/scripts/_rewardshape.ts`, 20k rolls per
archetype). Recorded because the shape surprised the designer, and because two of these are faults.

**Pieces per reward: 1.57 – 2.22.** Three-piece bundles run 7–22% depending on archetype. Note the
lottery takes its cut from the GOLD portion only, so the primary reward is never diluted by it.

| archetype | most common shapes |
|---|---|
| raid · escort · contract | **gold 51%** · gold+relic 27% · gold+lead 15% |
| capture | captive+gold 83% · captive+gold+lead 17% |
| rescue | gold+recruit 78% · gold+lead+recruit 22% |
| hunt · investigate | gold+relic 51% · gold 16% · gold+lead 16% |
| lead-hunt | gold+lead 78% · **gold+lead+lead 22%** |

**Where a campaign's reward value goes** (equal archetype mix): **gold 56%** · lead 13% · relic 12%
· captive 10% · recruit 9%.

Three things worth acting on, none yet acted on:

1. **Over half of all reward value is gold**, and raid/escort/contract pay *nothing but* gold 51% of
   the time. A level-2 raid is `gold 72`, full stop.
2. **Relics are frequently single-tag trinkets.** A level-2 hunt pays `relic 39`; against the §8 tag
   curve (t4 = 41) that buys about one tier-4 tag. §7 calls relics "dopamine-first"; at this size
   they are not.
3. 🐛 **`lead-hunt` grants TWO leads 22% of the time** — the archetype pushes one and the 22% lottery
   pushes another, because it never checks whether the bundle already has one. Under §7.1 that is
   two separately-banded leads off one quest. The lottery's value should thicken the existing lead.

**Leads are a ONE-OFF reward only** — every `kind: 'lead'` lives in `splitOneOff`. A saga beat pays
gold, or gold + a relic at 35%; a finale pays the bank. Correct as it stands: a chain already mints
its own continuation lead, so loot-granting another would open an unrelated thread mid-story.

### 6.1 What a SAGA actually pays — measured 2026-08-28 📏

A saga has no archetype split at all (`v3/scripts/_chainshape.ts`; level 3, party of 2, all beats
succeeding):

| rarity | beats | payoff | focal mark | side-loot total | bank |
|---|---|---|---|---|---|
| common | 2.5 | 164 | 115 | 38 | 235 |
| uncommon | 3.5 | 414 | 290 | 95 | 595 |
| rare | 5.0 | 1150 | 808 | 265 | 1651 |

**⚠ `focalTarget` is NOT the payout.** It is 55–85% of E[payoff] (≈70% on average) and it sizes the
focal's *tag substance* — what they are good at, what they ransom for. What the player RECEIVES is
**the bank**, and §2's value-invariance means the three finale dispositions pay the same total:
cash-out is `round(bank)`; recruiting is the person (marked `focal.value`) plus `bank − focal.value`.

So: **every saga is ABOUT a person (🔒 §2 story seed, gold-hoard sagas included), and none forces
you to TAKE one.** `gold-hoard` as a kind only frames the bible.

📏 **Side loot is nearly invisible while you play.** 15g a beat on a common saga against a beat that
banks 109 — ~14% of what the beat earns, and the only thing actually delivered before the finale.
Mid-saga beats feel like they pay almost nothing because they nearly do. 🛠 If saga pacing ever feels
flat mid-story, `beatSideLoot`'s `0.2–0.5` band is the lever.

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

Each beat banks `party × V_base(level) × rarity × outcomeScale` (success 1 · partial 0.5 · failure 0); the **finale crystallizes** the bank into the focal character + surplus gold. The per-beat side-loot budget is **deducted from the beat's banked earn** (not paid on top — preserves income-neutrality vs one-offs; 🛠 2026-07-10: the deduction scales with what was DELIVERED — a partial pays half the loot, so it docks half). Shortfall → keep-with-debt or the focal slips away for salvage gold; finale failure → **the bank is forfeit (the time sting) and the focal slips away FOR NOW** — alive in the lore graph, a rarity-priced sequel lead the road back (§21-4a; permanent loss out of prototype). A per-chain **failure budget** forces a last-chance finale rather than endless retries. Income-neutral vs one-offs; adds variance + a lump payoff.

---

## 6. The economy shape — the constraint migrates 🔒

Income and costs both scale with progression, so the *feel* stays constant. The binding constraint moves: **early → gold** (the teacher) · **mid → prestige + level** (the master clock; can I access better content?) · **late → merc-cycles + attachment** (who can I bear to risk?) — with gold returning as the *pacer* at T13–15 (Great Hall + endgame buildings are deliberately expensive; give a gold-reserve/wishlist affordance for hoard windows, §20.2).

**Income:** quest gold + ransom/sell (captives, dead drops). **Sinks:** hiring, builds/upgrades/renovations, Great Hall tiers, endgame buildings, healing. **Lever:** income a hair behind desired spending. 🟡 **Hire pricing lean:** recruits enter *below* the region band and cost ≥ the equivalent grow-investment — else buying veterans beats growing your people (would undermine the bedroom/attachment economy). *(Liabilities from partials ARE in prototype; only force-slotting negatives INTO rooms is deferred, §18.1.)*

---

## 7. Leads are rewards 🔒

A lead is a **deferred reward** — priced by the access it grants (its rarity premium), not the reward behind it. Lead-hunting quests (region Scouting lodges) are the renewable faucet.

### 7.1 The carried bonus ✅ (designed 2026-08-28; closes GENERATION_FLOW §21.2)

**Access is free; the premium rides on the lead.** A lead's own worth is **zero** — any lead opens a
quest, and that quest is worth what its level, rarity and archetype say. What a lead may carry is a
**bonus**: value banked onto it at mint, spent when it is pursued.

```
Lead.bonus : number        gold-equivalent, default 0 (absent on old saves = 0)
on pursue  : V = oneOffValue(level, rarity, slots) + lead.bonus   → splitOneOff(V, …) unchanged
```

**Strictly orthogonal 🔒.** The bonus changes NOTHING about how the quest plays: same level, same
slot count, same bar, same difficulty, same archetype. It is added to the value budget and nothing
else. A rich lead is a richer haul, never a harder fight.

Because it enters *before* the split, it flows through `splitOneOff` naturally — a fat `capture`
lead yields a **better captive**, not merely more coin. Nothing in the AI's inputs changes: the
writer sees the same `rewardEnvelope` shape it always did, so **this design touches no prompt.**

For a saga lead (`chainInfo: starts-new`) the bonus is added to `chainPayoff` — the "quest" is the
whole chain — so it surfaces as a better focal character at the finale rather than as coin today.

**The bonus shares the reward's fate** (§5 🔒: fixed at birth, the roll only scales down): a partial
pays half of it, a failure loses it. A fortune can be squandered.

### 7.2 The band — what the player sees 🛠

The engine holds the exact number; the **player reads a band**. This is §8's architecture with the
audience swapped ("fine TIERS engine-side, coarse BANDS for the reader"), and it keeps a lead a
rumour rather than an invoice.

The band is a **ratio against the quest this lead will make**, never an absolute — 200 gold is a
windfall at level 1 and pocket change at level 8, and one threshold cannot describe both:

```
baseV(lead) = V_base(level) × rarityMult[rarity] × expectedSlots(archetype, rarity)
band        = bonus ÷ baseV
```

`expectedSlots` is the midpoint of the archetype's `slotCount` range, +1 for rare, capped at 4 —
every input is known at mint. The ±20% generation roll (mean 1.0) and the roster clamp are not
modelled; both wash out. **Computed at display time, never stored**, so retuning re-bands every
lead on the board instead of leaving frozen labels behind.

| ratio | band | on the face |
|---|---|---|
| 0 | — | *(no marker)* |
| ≤ 0.25 | ★☆☆☆ | a few coins more |
| ≤ 0.55 | ★★☆☆ | a purse |
| ≤ 1.0 | ★★★☆ | a chest |
| > 1.0 | ★★★★ | a fortune |

Four rungs, deliberately **not** reusing `common/uncommon/rare` (collides with the lead's own
rarity) nor `low/mid/high/legendary` (the §9b format-lock describes a *trait's* intensity, and §8
reserves "legendary" for tiers 13–16, 13k–92k — a lead bonus never reaches it). The ★ glyph mirrors
`unitStars` on purpose: it answers the same question — *how far above par is this, for its level* —
so a player who has read the marker on a soldier reads a lead for free. `1.0` is the teachable
landmark: **a fortune is when the lead is worth more than the quest it opens.**

🛠 **Thresholds are a knob, and they were set from PLAY, not from a simulation.** The first cut
(0.4 / 1.0 / 2.5) came from sampling the design space — source level and lead level drawn
independently — which manufactures mismatches the game never produces. In real play both track the
roster and the Great-Hall tier, so ratios compress hard: measured over **225 cycles**
(`scripts/_leadsoak.ts`, 389 leads granted), p50 is **0.31** and the **maximum is 1.11**, which made
3★ a 3% event and 4★ *literally unreachable*. Two of four rungs were dead content. The cuts above
give **43 / 37 / 17 / 3%** of banded leads, and four fortunes in those 225 cycles — rare, and real.
Percentages are of *banded* leads; unbanded ones outnumber all four (264 of 389 on a real board).
**No cap** on the bonus itself: §3b goal 1 wants jackpots to be possible.

> ⚠ The lesson is worth keeping: a distribution measured over the *design* space is not the
> distribution the *player* meets. Band thresholds, drop rates and anything else tuned to "how often
> should this feel special" must be measured by playing, not by sampling parameters.

### 7.3 Where bonuses come from

| source | bonus |
|---|---|
| a quest's reserved lead share (`splitOneOff`) | the reserved value, which today is **computed and discarded** |
| **lead-hunt** — the Scouting-lodge faucet | its existing `V × 0.7` share; measured median ratio **0.57** vs 0.26 from every other source |
| a sequel lead when a focal slips away (§21-4a) | **none** — "rarity-priced" there means the lead's own RARITY is raised by the chain's (already built). A bonus would refund the forfeited bank, and §21-4a is explicit that the forfeit *is* the sting |
| the day-0 starter packet | 0 — no reward behind it |

**Lead-hunting is prospecting, not restocking** — that falls out of the existing 0.7 share with no
new rule. It also makes the lodge value-positive: 0.7V now becomes 0.7V later *plus* a whole extra
quest's own baseV. The price is merc-cycles, paid twice — which is §21.1's **"LOSS = mostly TIME"**
working as intended. 🛠 If the §20 sim says the faucet floods, that `0.7` is the only lever to touch.

**Expiry** is a plain loss, as any unpursued lead is; the log names it when a *banded* one goes cold
so the sting is legible rather than silent.

**Measured in play (2026-08-28, built):** before a Scouting lodge exists, essentially every earned
lead reads **★☆☆☆ a few coins more** — the only source is the 22% lottery at `V × 0.15`, which on
early-game values is a bonus of 4–14 against a baseV of 50–100. Once the lodge is up, its `V × 0.7`
share puts *a purse* on the board regularly (measured bonuses 32–75 by cycle ~10). This is §7.3
working as designed — **the lodge is what makes the marker mean anything** — but it is worth knowing
that the band is nearly flat for the first hours, so a thin early game is not a bug. 🛠 If it should
bite sooner, the lever is the lottery's `0.15`, not the thresholds.

---

## 8. Design knobs 🛠
`V_base` · **rarityMult table** · per-slot difficulty-E roll weights · per-tag values (the §8 curve × hand exceptions) · split ranges · tier-weights + jackpot chance · hire fraction · room/upgrade/Great-Hall cost tables · ransom/sell rates · drop rate · XP curve. Structure locked; numbers tuned at implementation against the §20 sim.
