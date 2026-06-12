# GENERATION_FLOW.md — how a saga/quest is generated (the canonical pipeline)

**Status: WIP DRAFT (2026-06-12) — being finalized item-by-item with the designer.**
Supersedes the scattered flow descriptions; QUESTS.md §"reward-first" 🔒 is the governing rule.
Each section below is marked ✅ agreed · 🔶 OPEN (decision pending) · 📌 current-impl note.

## The corrected pipeline (target design)

```
LEAD PURSUED (rarity · level · region)
 1. CALC      E[payoff] = beats × SLOTS_PER_BEAT × vBase(level) × rarityMult × 0.8      ✅ §1 (impl pending)
 2. SPLIT     core kind ∈ {recruit, captive, gold-hoard} + rolled unit share             ✅ §2 (impl pending)
 3. ROLL      focal unit at share × E[payoff]  (shaped distribution, E≈target)           ✅ §3 (built)
 4. SHAPE     arc length · twist 30% · choice budget · recurring-cast cap                ✅ (as-is)
 5. SEEDS     ONE KEYWORDS field (1 bond + 1 tie + 1–2 wild) · place · tone · names      ✅ §5/§6 (built)
 6. AI #1     genesis → bible (title/blurb/goal/arc/cast/truth/tensions/branch steps)
 7. GUARDS    name-collision guard · persist Chain (incl. E[payoff], split, place)
 8. AI #2     chainBeat → beat-1 card
 9. RESOLVE   per-beat bank accrual (unchanged) · finale crystallizes the §2 split       ✅ (impl pending)
IMPLEMENTATION QUEUE: §1+§2+§4/4b (designed, not coded) → §8 tag revamp (design next) →
§7 artifacts (design pending) → pools/name-generator (later).
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

### §3b.1 Goal → character-system mapping (designer-approved 2026-06-12)
| Goal | Where it lives | Status |
|---|---|---|
| E[value]≈target | shaped-distribution generator (reads tagValue → reprice-proof) | ✅ built |
| Jackpot units | tag tier depth + geometric tagValue | ❌ → §8 (only change needed) |
| Value ≠ usefulness | structural: gold axis Σ tagValue vs dice axis attr+favoredBonus(≈flat) | ✅ exists |
| Marked value | card.value semantics (today still substance-sum) | ❌ → §1/§2 impl batch |
| Pools | sampling config over the generator | 📋 later (#31) |
| Content gating | tagCeiling(level), rescale with §8 curve | ✅ exists |
| Quality not sprawl | per-group growth caps in generator | ✅ built |
| Legibility (badge) | derived from substance | ❌ → §8 scope |

## §8 TAG SYSTEM ✅ (designed 2026-06-12; deletion-list deferred to the next station)

ARCHITECTURE — fine TIERS (engine) / coarse BANDS (AI):
- A tag instance = (concept, tier). Tiers are ASCENDING integers (migration inverts today's
  descending 1-is-best data). The AI NEVER sees integers — it reads/writes 5 BAND WORDS per
  concept; the engine rolls the exact tier within the band ("AI proposes quality, engine
  decides magnitude" — PROMPT_RULES §3 applied to tags).

THE CURVE (economy-anchored; vBase 30→448/day, sagas 144→15k, 100-day campaign ≈ 37k gross):
  value(t) = 6 × 1.9^(t−1)        depth 20 → t20 ≈ 1.19M ("the Mirror")
  t1–4    6·11·22·41        trait texture (commons land 25–80 — no economy shock)
  t5–8    79·149·284·540    standout skills; uncommon-saga focals
  t9–12   1.0k–7.0k         rare-saga prizes
  t13–16  13k–92k           legendary territory and beyond
  t17–20  174k–1.19M        mythic / trophy class
- WHY 20 (not 12/15): ratio ×1.9/tier = a drift tick DOUBLES (usable growth grain);
  maxTier = 2×contentLevel+2 (clean 2 tiers unlocked per content level, L1→4 … L9→20);
  4 tiers of in-band leeway. Bands shield the AI, so depth costs nothing to author.

DEPTH POLICY: default depth 10 (top ≈ 1.9k — "the best ordinary people"); designated DEEP
LINES depth 20 (candidates: Strong, Craft, Renown, Kind, Lineage… — finalized in the
vocabulary station). Depth is the per-tag balance knob. Identity tags (gender/race/type) =
value 0; other flat concepts = depth 1 (worth ~6).

RARITY & GATING: tier weight ∝ ~1.9⁻ᵗ…3⁻ᵗ baseline, TUNED BY HARNESS (the MC-calibrated
generator self-recalibrates — repricing needs no generator change). Content gate:
maxTier(contentLevel) = 2L+2; jackpot spillover may pierce it.

BANDS (depth-20 default mapping): B1 1–4 · B2 5–8 · B3 9–12 · B4 13–16 · B5 17–20.
- AI may REQUEST at most B4; a request rolls its window weighted-low with ~7%/step SPILLOVER
  above (the in-band jackpot — "very strong" can come back t18). B5 words are display-only.
- Depth-10 tags: 2 tiers per band; the AI always sees exactly 5 words either way.

DICE STAY SANE: favoredBonus per BAND = +1 / +1 / +2 / +2 / +3 (B1→B5; designer-tuned flat) —
the value curve soars geometrically while the usefulness curve stays nearly flat (goal:
value ≠ usefulness; a Mirror-tier tag barely out-rolls a solid one).
Deep LOW-UTILITY lines (Kind, Lineage, Renown) are first-class: the living saint / noble
hostage / Mona-Lisa relic all roll naturally.

TIER DRIFT — designed, **NOT IN PROTOTYPE** (designer 2026-06-12): characters' tag tiers can
tick ±1 from life events (training, saga stamps, hardship; ×÷1.9 value); relics never change.
Recorded for the post-prototype growth system.

LEGIBILITY = PER-TAG RARITY BORDERS (designer; replaces the unit-level badge, which is OUT):
each tag chip is displayed with a border/color indicating its tier band — rarity readable
tag-by-tag, PoE-style, no derived unit label.

DELETION LIST: deferred to the next station (what the new system replaces — rarity-class,
rarityBase, flatTagMult, tagCeiling-as-value, old tierWeight, descending tiers — to be
confirmed item-by-item there, not locked here).

NOTIONAL TOP END: above ~100k value is trophy-class — selling needs a SPECIAL-BUYER story
event (later); prototype lets the mark sit on the card.

DOMAIN-GENERIC: one curve, both species; vocabularies (~disjoint) are the NEXT PLANNING
STATION — concept lists, deep-line designation, 5 band words per concept, cross-pair
coherence (tough+frail), leveled-personality words, the relic vocabulary.
NOTE: no implementation after §8 — more design stations may follow (designer).

## §9a TAG↔AI INTERFACE ✅ (decided interactively 2026-06-12)
1. SCHEMA: every concept has `depth` (1 = flat, N = tiered). The system supports both; WHICH
   concepts get what depth is §9b content (must support deep skill/fame/lineage/craft lines and
   flat personality/identity tags).
2. THE AI'S TAG LANGUAGE = BAND WORDS, BOTH DIRECTIONS. Read: tags render as their band word
   ("somewhat strong", "masterly stealth"). Write: the AI uses the same band words; engine
   parses by lookup (fallback: bare concept → engine picks band) and ROLLS the exact tier
   within the band (weighted-low + spillover). Integers never cross the AI boundary.
3. READ DETAIL: full substantive tag-set in all contexts MINUS system tags (`type:*` — never
   rendered), salience-ordered. Trim only if real prompts bloat (not pre-emptively).
4. MENUS: static per call-type/domain → prompt-cache safe (§10.2). Content gating is a SILENT
   ENGINE CLAMP preserving relative intent (a "legendary" ask at L1 rolls the best allowed).
5. RARE FLAT CONCEPTS: gated by RARITY WEIGHTS ONLY (no minContentLevel field) — and a weight
   MAY be a FUNCTION of content level (constant for normal flats; a ramp ≈0→up for exotics).
   One mechanism, tunable, preserves the anywhere-drop jackpot. Valuable rares are HIGH BANDS
   of tiered lines (princess = lineage 'royal blood') — hard-gated by maxTier for free.
DEFAULTS: salience = identity → tiered desc → flats; band-word tables live on TagDef (5 per
tiered concept; generic "slightly/very X" fallback when unauthored).

## §9a.2 TAG SCHEMA & SYSTEM RULES ✅ (decided interactively 2026-06-12)
- TWO structures (group records chosen; impl details Claude's call — designer confirms
  MECHANISMS/CONCEPTS only):
  TagGroup   { id, domains: character|relic|both, pickPolicy: exactly-1|at-most-N|free,
               appearOdds (level-rampable), menuLabel }
  TagConcept { id, group, word, depth (1=flat), bandWords[5] if tiered, opposite?, weightOverride? }
- WHY a group record: pick policy ("exactly one race") is a SET-level fact no per-tag field can
  express; groups are ~7 rows of policy with one home (today's scattered tagAppear/BALANCE
  functions were the failure mode).
- SHARED GROUPS exist across species (renown, cursed/blessed) — domain lives on the group.
- DELETED: `mutex` (subsumed: group pickPolicy + `opposite`); `opposite` survives doing BOTH
  antonym exclusion AND the dice clash. `attrBias` CUT — tag/attr coherence is a POOL job (#31).
- BUDGET = EXPECTATION (supersedes §4's "drop randomly" line, which was pre-curve): AI band
  requests are folded into the generation CALIBRATION — the engine solves its completion rolls
  (and may shift a requested band) so E[total] ≈ target, then EVERYTHING rolls. No caps, no
  drops, no post-hoc trims; overshoot is jackpot, the mark stays the target.

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

## §7 RELICS ✅ (designed 2026-06-12) — second card species, dopamine-first

PURPOSE (hierarchy): 1) DOPAMINE — the drop-thrill (reward lottery, §8 jackpot tail) plus the
FIT CLICK (a relic matching a slot that wants it). 2) Gameplay = SLOTTING INTO ROOMS, same verb
as units. 3) Prestige / economy / story-trophy are consequences, not the point.

THE UNIFIED SLOT GRAMMAR (the structural heart — one grammar for all cards):
  "SLOTS WANT TAGS; units ROLL their fit (coins), relics ARE their fit (static)."
  QUEST actor slot    wants tags → unit fits  → more coins   (dynamic gamble)
  ROOM  occupant slot wants tags → unit fits  → works/rests
  ROOM  item slot     wants tags → relic fits → comfort/prestige (placement)
  A room TYPE declares its slot mix (unit slots, item slots, or both).

BEDROOM PERSONALIZATION (closes the growth loop): a merc's bedroom item-slots are DERIVED FROM
THE MERC'S TAGS (AI-determined — piggyback on the flesh call, no new calls): soldier → weapon
rack (wants war-loot/blade); healer → herb niche; singer → instrument stand. Fitting relic →
big comfort, any relic → small; comfort already gates level caps (3 + 0.9×comfort) →
**relics don't grow — they fuel the growth of those who do.** Dopamine fused into attachment.

GLOBAL ROOMS = the prestige path: hall/tavern/shrine item slots want renown-type tags;
displayed storied relics → prestige → leadTier (plugs the 100-day dead faucet).
SELL = cash-out at a discount off the mark (background dilemma, not the headline).

STRUCTURE: Card contract = name + tags + value(mark) + location + chainIds (moves to BaseCard).
GROWTH is THE species discriminator: characters grow (level/xp/talents/stamped tags); relics
are IMMUTABLE post-creation. Condition/repair: parked (items don't grow).
INVARIANTS: cards never hold cards (no equipping in prototype) · only characters roll coins ·
one value system both species (§8 designed domain-generic; vocabularies ~disjoint, next PR).
NAME: **relic** (the world's word; encodes relic-OF-a-story; class `relic`).

### §7.1 THE CARD SYSTEM ✅ (designer-finalized 2026-06-12)
THREE TYPES, type is a tag: `type:character` · `type:relic` · `type:stackable`.
- UNIFORM RULE: every card = tags + value + location. The ONLY differences:
  CHARACTERS grow (the sole growing type); STACKABLES are MINTED (fixed defining tags + qty)
  instead of ROLLED (randomized tag-sets) — that is the main stackable difference, everything
  else (slots, value, storage, matching) is the same system.
- KIND IS A TAG: a stackable's kind is a tag (`gold`, `salt`, `debt`) → slot matching stays ONE
  primitive: requires:[type:character] · requires:[type:relic] wants:[storied] ·
  requires:[type:stackable, gold] (a bribe slot). Merge rule: stacks merge iff tag-sets match.
- SINGULAR vs FUNGIBLE falls out of type: character/relic carry name+story+chainIds;
  stackables carry qty, no identity. Value: singulars = mark; stackables = qty × unit value.
- LIABILITIES = NEGATIVE STACKABLES (debt/evidence/mess as kind tags, negative value) that
  TRIGGER BAD EVENTS IF UNRESOLVED — the trigger is the STORY ENGINE: an unresolved liability
  eventually spawns a hostile lead/event (the collector arrives; the evidence surfaces).
  Plugs the "debts never bite" dead mechanic found in the 100-day test. Prototype mechanism:
  per cycle, each liability older than N cycles has p% to spawn its collection lead.
- Migration order: type-tag injection → slot requires[]/wants[] generalization → gold stack
  merge → relic class + room item slots → chainIds to BaseCard → liability event trigger.
