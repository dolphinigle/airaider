# GENERATION_FLOW.md — how a saga/quest is generated (the canonical pipeline)

**Status: WIP DRAFT (2026-06-12) — being finalized item-by-item with the designer.**
Supersedes the scattered flow descriptions; QUESTS.md §"reward-first" 🔒 is the governing rule.
Each section below is marked ✅ agreed · 🔶 OPEN (decision pending) · 📌 current-impl note.

## The corrected pipeline (target design)

```
LEAD PURSUED (rarity · level · region)
 1. CALC      E[payoff] = expectedBeats × E[slots/beat] × vBase(level) × rarityMult     🔶 §1
 2. SPLIT     core kind ∈ {recruit, captive, gold-hoard, relic…} + unit/gold shares      🔶 §2
 3. ROLL      focal unit at unitShare × E[payoff]  (shaped distribution, E≈target)       ✅ §3
 4. SHAPE     arc length · twist 30% · choice budget · recurring-cast cap                ✅ (as-is)
 5. SEEDS     ONE keyword field (themes + 0–2 extras) · place · tone · names · pool      🔶 §5
 6. AI #1     genesis → bible (title/blurb/goal/arc/cast/truth/tensions/branch steps)    (prompt rework after §1-5)
 7. GUARDS    name-collision guard · persist Chain (incl. E[payoff], split, place)
 8. AI #2     chainBeat → beat-1 card
 9. RESOLVE   per-beat bank accrual (unchanged) · finale crystallizes split              🔶 §2 interaction
```

## §1 The calculation phase ✅ (decided 2026-06-12)
At genesis: `E[payoff] = expectedBeats × SLOTS_PER_BEAT × vBase(level) × rarityMult × 0.8`
- `0.8` = outcome discount (partials half-bank, failures zero) so a DECENT run delivers the
  prize + modest surplus; only bad runs hit debt/void.
- `SLOTS_PER_BEAT` = flat constant (~1.5) — designer: distribution-exact is over-engineering.
- This is BEST-EFFORT guidance (the realized bank varies with play) — it sizes the focal and
  the split; the bank's crystallization machinery reconciles reality as it already does.
- 📌 Replaces: focal target `maxCharValue(level)` (unrelated constant) and the absent chain calc.

## §2 The split — chain reward kinds ✅ (decided 2026-06-12)
- CORE KIND rolled from an EXTENDABLE weighted table — prototype set: `recruit / captive /
  gold-hoard` (relic/artifact deferred → §7). Twist DECOUPLED from kind (independent rolls).
- UNIT SHARE: ROLLED range (~55–85%) when the kind is a unit; focal target = share × E[payoff].
- GOLD IS SUPPLEMENTARY (designer): the saga promises E[payoff]; the unit covers its MARKED
  value; gold = E[payoff] − unit-marked. ("Quest worth 1000g, unit marked 800g → 200g gold.")
- MARKED VALUE (designer, §2.5): a unit generated at target T is MARKED as worth T regardless
  of what the tags actually rolled (the roll's variance is the gamble — a great roll is a
  bargain, a dud is overpriced, like PoE crafting). ALL accounting (bank reconciliation,
  ransom 0.6×, hire costs) uses the marked value. `card.value = target`, tags are the substance.
- CHOICES vs KIND: the genesis kind is a GENERATION-TIME suggestion — it sizes the split and
  frames the bible. The finale's kinded choices (recruit/captive/gold) pick the final
  DISPOSITION freely; mid-quest choices remain method-only. Value is INVARIANT under
  disposition (marked value doesn't change when a captive becomes a recruit) — choices change
  what you DO with the prize, never what it's worth.
- Focal character ALWAYS exists (story seed 🔒) even for gold-hoard sagas (they're the person
  the saga is about, e.g. the hoard's guardian — finale choices may still take them instead).

## §3 Unit generation at a target value ✅ (built, commit 653f9b3)
Tags roll INDEPENDENTLY (identity preserved); a wealth parameter (Monte-Carlo-bisected against
the real roll) shapes the distribution so E[value] ≈ target; right tail from rare top tiers.

## §3b UNIT VALUATION REVAMP 🔶 (designer-added 2026-06-12 — not yet designed)
GOAL: a unit's value scale must extend FAR upward — a high-value generation target means a GOOD
CHANCE the unit rolls genuinely RARE (PoE-style: some weapons are chase items; some people
should be too). No hard "capacity ceiling per level" clamping the economy.
- 📌 Today the scale is compressed: tag value = rarityBase(1/3/8/20) × tier(1–5×), per-tag value
  capped by tagCeiling(level); realistic unit means ~20–80, absolute pool max ~854. There is no
  chase-unit tail — a "500g person" cannot exist.
- Needs a full design pass: value curve (likely super-linear in tier/rarity), how rarity tiers
  of TAGS map to unit rarity, whether new tag rarities/pools are needed, how the shaped
  distribution's tail produces them, jackpot interplay.
- **Working assumption for §1/§2 (per designer): ASSUME THIS EXISTS** — i.e. focal target =
  share × E[payoff] directly, NO min(·, unitCap) clamp; under/overshoot is the roll's variance
  and any shortfall pads as gold at crystallization (already the bank's behavior).

## §4 Secondary NPCs → real units (partial-unit handoff) 🔶
- 📌 Today: bible cast are prose-only; only the focal is a card; one-off captives are fully
  engine-rolled, AI only names them.
- Proposal (pattern B, "seed the AI again"):
  1. engine rolls a PARTIAL unit: identity + ~half the value budget;
  2. AI may ADD up to K vocab tags fitting the story role;
  3. engine canonicalizes, prices, rejects over-budget, completes remainder with shaped rolls.
- OPEN: K (draft 2–3) · which flows use it (bible secondaries? beat captives? sequel focals?).

## §5 Keyword seeds — ONE field 🔶
- 📌 Today: four labeled lines (THEMES / PROP / PRESSURE / CLIENT sparks) — labels prescribe
  each word's story role; entries drifted to phrase-length micro-premises.
- Agreed direction: ONE unlabeled `KEYWORDS:` line; balance lives in engine-side sampling
  (bond + tie + flavour always, 0–2 extras from prop/pressure/client pools); entries are
  noun-length (1–3 words); same single field for one-off cardAsk (ARRIVAL stays separate);
  chainBeat gets no keywords (bible drives beats).
- OPEN: final pool contents (keywordize my phrase-entries) · extras always-on vs 0–2.

## §6 Prompt-field naming (after §1–5 land)
Known confusions to fix: `SETTING` vs `ENGINE SETTINGS` (→ `PLACE` + `STORY SHAPE`);
`REGION` vs `SETTING`; `Focal unit` (user msg) vs `CORE PERSON` (system prompt).

## §7 Artifacts / relics 🔶 (deferred — discuss at the end)
A THING as a saga's prize (name TBD: artifact? relic?). Pays gold in the prototype; becomes a
display item feeding prestige when the rooms/items build lands. Needs: kind weight, how it's
generated (tagged item? unique?), display/prestige hookup. Discussion step after §5/§6.
