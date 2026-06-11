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

## §1 The calculation phase 🔶
- 📌 Today: one-offs compute `V = slots × vBase(level) × rarityMult` ✓; chains compute NOTHING
  up front — bank accrues at resolution; focal target is the unrelated `maxCharValue(level)`.
- Proposal: at genesis, `E[payoff] = expectedBeats × E[slots/beat] × vBase(level) × rarityMult`
  (≈ what the bank accrues on a clean run, so promise ≈ delivery).
- OPEN: confirm formula + whether E[slots/beat] uses the actual beat-slot distribution (~1.4
  middle / 2–3 finale) or a flat constant.

## §2 The split — chain reward kinds 🔶
- 📌 Today: core kind hardcoded `captive|recruit` (twist-linked coin-flip); gold exists only as
  a finale CHOICE; `splitValue`'s chain branch is dead code.
- Proposal: roll core kind from a weighted table incl. non-unit payoffs (treasure/relic sagas);
  focal character ALWAYS exists (story seed 🔒) but need not be the acquisition.
- OPEN: kind weights (draft: recruit 35 / captive 35 / gold-hoard 20 / relic 10) · unit share
  (fixed ~70% vs rolled range like one-offs) · how a gold-hoard finale crystallizes.

## §3 Unit generation at a target value ✅ (built, commit 653f9b3)
Tags roll INDEPENDENTLY (identity preserved); a wealth parameter (Monte-Carlo-bisected against
the real roll) shapes the distribution so E[value] ≈ target; right tail from rare top tiers.
Saturation note: targets above the level's reachable mean saturate; §1 makes targets realistic.

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
