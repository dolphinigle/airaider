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

## §3b UNIT VALUATION REVAMP — GOALS LOCKED ✅ (2026-06-12); mechanism → tag revamp (§8)
GOALS (designer-confirmed):
 1. JACKPOT UNITS exist — the scale supports very high rolls; chase units are possible, rare, exciting.
 2. TARGET-EXPECTATION generation — "average ~500g" works for any target (§3 machinery, kept).
 3. UNIT POOLS with identity — hierarchical pool bias at generation ("city denizens" ⊃
    "aristocrat humans"; "dragonkin tend strong"). NOTED IN PLAN; likely overkill for the
    prototype — design exists as a goal, build later.
 4. VALUE ≠ USEFULNESS (designer correction): value is GOLD-WORTH, independent of combat
    utility — a high-value captive can be a useless fighter (a noble hostage: ransom value).
    The roll system and the value system are separate axes that merely share tags.
 5. Value through QUALITY (tier/intensity), not tag-count sprawl.
 6. Content-gated drops (PoE ilvl principle) — better content can drop better units.
 7. Tags stay STORY-SEEDS — pools/pricing must feed the writers, not just the spreadsheet.
 8. MARKED VALUE (§2): the card's price = generation target; the roll's substance varies;
    jackpot = substance ≫ mark (that gap is the thrill).
 9. Legible at a glance (badge or similar — mechanism TBD).
 10. Extendable cheaply (append pools/tags without world rebalance).
MECHANISM DIRECTION (designer): tag INTENSITY is the value/rarity axis — ONE tag ("Strong")
with internal levels; deep geometric scale ("Strong T5" common ~pennies; "Strong T1" ~20,000g
and astronomically rare). Details belong to the TAG REVAMP (§8) — designed there, not here.
- 📌 Today: tag value = rarityBase(1/3/8/20) × linear tier(1–5×); ceiling 8+8L; means 20–80,
  no chase tail. Both axes too flat — the revamp makes the tier axis geometric and deep.
- Working assumption for §1/§2 stands: focal target = share × E[payoff], no capacity clamp.

## §8 TAG REVAMP 🔶 (designer-added — come back after the walkthrough)
One tag per concept with INTERNAL LEVELS (no separate "strong"/"very strong" entries); level
depth extendable per tag; level drives BOTH rarity weight and value on a deep geometric curve;
re-map display labels per level. This is where §3b's mechanism gets its numbers.

## §4 Secondary NPCs → real units (partial-unit handoff) ✅ (decided 2026-06-12)
The handoff (pattern B — both sides seed each other), NO new AI calls (piggyback only):
  1. engine rolls a PARTIAL unit: identity + ~half the value budget;
  2. the AI call that already describes the person may ADD up to 3 vocab tags fitting the role;
  3. engine canonicalizes + prices them; if over budget, drops RANDOMLY (not by heuristic) —
     ⚠ revisit the budget semantics after §3b (unit-valuation revamp) lands;
  4. engine completes the remainder with shaped rolls → unit MARKED at target (§2).
Use sites: one-offs (cardAsk emits optional quarryTags → engine `required`); bible secondaries
materialize LAZILY (only when actually acquired — finale choice / sequel — seeded by their bible
line); chain MIDDLE beats stay unit-free. One-off composition reorder accepted (V/mark still
computed first; only the unit's composition becomes a collaboration).

## §4b NAMES — engine-rolled for ALL characters ✅ (designer 2026-06-12)
The AI does not invent names (it's bad at it). The ENGINE rolls a name for every character that
materializes — focal AND secondaries AND captives/recruits — from the seed pool now, from a
dedicated NAME GENERATOR later (easy: syllable/part tables, fen register). AI calls receive the
assigned name and use it as-is (genesis: cast names ASSIGNED, not inspired-by; flesh/outcome:
name handed in, never chosen).

## §5 Keyword seeds — ONE field ✅ (decided 2026-06-12)
- ONE unlabeled `KEYWORDS:` line; sampling = **1 BOND + 1 TIE + 2 WILDCARDS** (wildcards uniform
  from the union of THINGS ∪ OCCASIONS ∪ PEOPLE ∪ UNCANNY ∪ MOODS; ~25% of draws use 1 wildcard
  for texture). Same single field for one-off cardAsk (ARRIVAL stays separate); chainBeat none.
- POOLS (~2,500 entries, append-to-grow; authored by category, sampled as designed above):
  BOND 500 · TIE 500 · THINGS 500 · OCCASIONS 300 · PEOPLE 300 · UNCANNY 300 · MOODS 100.
- STYLE BAR: bare words by default ("wedding", not "a wedding"); article only where the bare
  word changes meaning ("a will"). 1–3 words · evocative-generic, never a micro-premise ·
  low-medieval-compatible · no proper nouns · no cross-pool duplicates.
- ⚠ PLAYTEST FLAG (designer): when playtesting after this lands, specifically judge keyword-draw
  quality (vivid combos, no nonsense, fusion quality). Tracked as a standing task.
- Old PROP/PRESSURE/CLIENT phrase pools + the dormant PREMISES list are superseded → deleted.
- **BUILT (commit 2bfcc34).** Actual v1 counts: BOND 399 · TIE 380 · THINGS 425 · OCCASIONS 173 ·
  PEOPLE 211 · UNCANNY 183 · MOODS 88 = 1,859 unique (smaller pools still growing toward 500).
- **EMPIRICAL NOTE (taste-tested):** with no ban, the model's LEDGER habit overrode even good
  draws ('forgery, millstone' → "The Moot Ledger"); seeds occupy the slot but this one habit
  needs belt-and-braces — ONE targeted ban-line kept in genesis. Unlabeled keywords are
  generatively ambiguous and that's a feature ('church face' (mask sense) → a carved church
  face as the plot object).

## §6 Prompt-field naming ✅ (built, commit 2bfcc34)
`SETTING` → `PLACE` · `ENGINE SETTINGS FOR THIS CHAIN` → `STORY SHAPE (engine-rolled)` ·
`Focal unit:` → `CORE PERSON:` (user message now matches the system prompt).

## §7 Artifacts / relics 🔶 (deferred — discuss at the end)
A THING as a saga's prize (name TBD: artifact? relic?). Pays gold in the prototype; becomes a
display item feeding prestige when the rooms/items build lands. Needs: kind weight, how it's
generated (tagged item? unique?), display/prestige hookup. Discussion step after §5/§6.
