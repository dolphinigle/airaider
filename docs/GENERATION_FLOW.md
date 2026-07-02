# GENERATION_FLOW.md — how a saga/quest is generated (the canonical pipeline)

**Status: WIP DRAFT (2026-06-12) — being finalized item-by-item with the designer.**
Supersedes the scattered flow descriptions; QUESTS.md §"reward-first" 🔒 is the governing rule.
Each section below is marked ✅ agreed · 🔶 OPEN (decision pending) · 📌 current-impl note.

**RESUME POINT (for the next session): §9b vocabulary ✅ (W1–W18). DICE/ATTRIBUTE/THRESHOLD ✅
FULLY LOCKED 2026-06-14 (#27 done) — see §10 THE ROLL for the verified spec: attribute set
STRENGTH·DEXTERITY(=agi+perception)·INTELLIGENCE·CHARISMA·CONSTITUTION; build = fixed-sum
base(≈3/stat)+growth(g0=2) vectors + player FOCUS (single→great / dual→good); co-equal lever model
E = ATTRIBUTE(great=1.0U) + MATCHING-TAG(0.5U favored skill) + ATTRIBUTE-TAG(0.5U body+background),
U(L)=base+2·g0·(L−1); threshold = E·U/2 with difficulty E .25/.5/1/1.5/2; multi-stat ×(n+1)/2; body
stat tags feed attributes (muscular/nimble/clever/beautiful/tough), background tiny rank-scaled, race
biases body-tag odds, personality/skill-direct/standing/gender = none. VERIFIED 36/36 across L3–L20
(supervisor agent loop; only change from L10 draft = base 4→3). clash=mirror; injury=#39 placeholder.
INJURY ✅ LOCKED (#39, §11) — one generic injury in TIERS, AI-judged severity, flat coin penalty,
tiers→death-cap(10)+building-extend, rest/infirmary/pay-gold-room healing, value=tiers×V_base.
CURRENT design area: FORT ROOM CATALOG (#36, §12). BRAINSTORM POOL recorded (§12.1, ⏳ not locked):
rooms = 4 kinds (A feature/menu gates · B capacity · C region-scoped quest faucets · D prestige
gates). Kinds A+B drafted; torture chamber RESOLVED-keep (gpt-5-mini probed L1–L6, 0 refusals).
REGIONS (§13, #42) — LIST ✅ locked 2026-06-15: 5 mapped (Western Forests=elf · The City=human ·
Drowned Coast=lizardman · Highlands=wolfman · Underdeep=no-faction) + SHARED off-map endgame "The
Outskirts" (L40→50, keyed by ALL per-region endgame buildings). Unlock = shallow GRAPH (spine
Forests→City→Coast→Highlands + Underdeep optional branch). "location" concept DROPPED → region=sole
mechanical unit, lorebook=flavor (#43). Dice re-verified L3–L50 (§10). Region core ✅ DONE; deferred:
poolWeights (#31) · costs/gates (#41).
LORE & context-retrieval (§14, #43) ✅ DESIGNED + VALIDATED 2026-06-16 (5-exp campaign w/ controls):
unified LoreNode (lore=layer over Cards); memory=salience-ranked EDGE (CORE pinned/never-decay —
REQUIRED, decay-all lost 0/9 defining mems); dossier=bounded render over edges; retrieval=engine
ranked-recall + size-gated nano selector (F1 0.89); edges=enum+direction-convention, append+supersede;
≤2 round-trips (genesis 1 call w/ write-back folded; selector only if >8 cands; resolution=1 batched
call) — IMPLEMENTER: join/batch queries. PURPOSE=continuity (canon-consistency 1.00 vs 0.55).
SLOTTABLES/FIT/PRESTIGE (§15, #36/#41) ✅ CONFIRMED 2026-06-21: one prestige formula (comfort=bedroom
prestige, global=Σ theme rooms); shared Slot/Slottable (promote Room.displayCardIds→typed slots,
reuse QuestSlot requirement union); shared overlap() primitive (keep RAW/tier-scaled, quest U-scales
on top — don't fork); UPGRADES ADD SLOTS (U0=0 slots, +1/upgrade — reverses FORT "no upgrades", fix
in transform); prestige=saturating band, designed via per-room [min,expected,max]; player THEME→AI
rolls wanted-tags ONCE→engine scores. §16 = review resolutions F1–F8 (incl. lore FLOW + 3-producer
determinism + soft-delete). §17 = doc-redo coverage checklist. §18 (2026-06-22) UNIFIES the room
model: **comfort** = the ONE per-room number (rename; "prestige"=global currency only) → ONE typed
benefit (theme→+prestige · bedroom→owner cap · functional→unique bonus, NO double-dip); slots
GENERIC (accepts-list, +1/upgrade, ~3–6); **CAPTIVE LABOR** (break→obedient→station; captives=core
loot; mercs NOT stationable). CARDS+FORT need §18 retouch (flagged in §17). Remaining gaps:
forced-negatives · cap-downgrade (capacity/acceptance now trivial via accepts+slot count).
CATALOG+PRESTIGE STAGE (#36+#41) ✅ CLOSED 2026-06-22: (1) catalog §19 · (2) math skeleton §20 +
sim-verified §20.1 · (3) catalog-tied assignment §20.2 — TWO independent sim agents ALL-PASS
(T15≈2,000–2,320c ≈100–115h; greedy P-rush SLOWER than humans; convergent rules: measured+monotonic
thresholds · loot −30% · asymptote-aware early tiers (≥3 prestige rooms by T1) · re-theming agency
REQUIRED · replacement staffing · bedroom depth drives cap; build-order TABLE recorded).
DOC-REDO ✅ EXECUTED 2026-07-02/03 (overnight mandate): all §17 items — CARDS/FORT/GAME_STATE/
QUESTS/ECONOMY/DESIGN rewritten-or-retouched, LORE.md NEW canonical, TAGS/UNIT_GENERATION/WIP
archived, PROMPTS/AI_PROVIDER/REWARD_BANK/QUEST_BIBLE banners+fixes, README reordered. 3 independent
reviews (consistency / design-fun / implementability ~70–75% buildable) + fix pass + round-2
verification + must-fixes → SHIP. Review-resolved into canon: leads EARNED not restocked · AI
proposes reward kind, engine grants (F6) · pooled aggregation Σcoins vs Σthresholds (partial 0.6×) ·
odds baseline always-raw, Oracle adds computed % · genesis=1 call · engine renders dossiers from AI
edges. OPEN DESIGNER DECISIONS: (1) LOSS/stakes design (reviews' top issue — departure/bitter-exit
candidate) · (2) ambient lead-trickle floor y/n · (3) known-cast cadence target · (4) torture-chamber
throughput spec+sim · then → BUILD PROTOTYPE V3.
After all design: the LEAN-DOC TRANSFORM (commit checkpoint → rewrite every doc to
END-result-only / implementable, verify each claim vs chat history → archive superseded docs
TAGS.md/UNIT_GENERATION.md/scratch). (PROMPTS.md attribute names — FIXED 2026-07-03 in the doc-redo.) BIG PICTURE ([[v3-docs-finalization]]):
finalize ALL system docs → build prototype v3.
Parked: band display names (display-only). Tag-system IMPLEMENTATION (#30) waits until the
docs are finalized. The §9b GROUP PASS is COMPLETE (see "§9b CONTENT WALK" +
"RELIC-SIDE GROUPS" sections): Character 8 = type/gender/race/personality/background(tiered,
rank-is-the-tier)/trait/skill/standing · Relic 7 = type/form(tiered, embodies material+craft)/
style/trait/enchantment(label-rendered)/standing(fame only) · Stackable = type/kind.
AI tag format LOCKED: `word (rank)`, ranks low/mid/high/legendary, both directions; bare
words (no group labels) EXCEPT enchantment. Walk ONE DECISION AT A TIME; EXPRESS green
light required before recording ANY lock (designer called out assumed locks twice); answer
designer questions directly before proceeding. NO implementation until the designer ends
the walkthrough — EXCEPT task #30 (tag-system STRUCTURE), which the designer green-lit
("for prototype that sounds ok. Implement"; current words migrate as PROVISIONAL).
Designed-not-built queue: §1+§2 calc/split · §4/4b handoff+names · §7 card system/relics ·
§8+§9a+§9b-structure tag system (#30 in progress).

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

BANDS — 4, generic by default (reviewed/final 2026-06-12): depth-20 mapping t1–5 / 6–10 /
11–15 / 16–20. Band WORDS are AUTO-GENERATED from the concept word ("somewhat strong /
strong / very strong / extremely strong") — zero authoring by default — with OPTIONAL custom
names per concept where flavor pays (skills: apprentice/journeyman/master/grandmaster; craft:
sound/fine/masterwork/wonder). All 4 bands are AI-requestable; a request rolls its window
weighted-low with ~7%/step SPILLOVER above; the maxTier clamp still guards the top (no minting
Mirrors by adjective). Non-20 depths map bands proportionally over the concept's tierRange.

DICE (reviewed/final 2026-06-12): favoredBonus per band = +1 / +1 / +2 / +3, and a t20 tag
gives +4 — the ONLY place dice acknowledge the Mirror tier (dopamine: a singular person is
FELT in the roll, once per scale). Value soars geometrically; usefulness stays nearly flat
(value ≠ usefulness).
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
2. THE AI'S TAG LANGUAGE = BAND WORDS, BOTH DIRECTIONS (4 bands — reviewed 2026-06-12).
   Read: tags render as their band word ("very strong", "master smith"). Write: the AI uses
   the same band words; engine parses by lookup (generic auto-words make parsing trivial;
   fallback: bare concept → engine picks band) and ROLLS the exact tier within the band
   (weighted-low + spillover). Integers never cross the AI boundary.
3. READ DETAIL: full substantive tag-set in all contexts MINUS system tags (`type:*` — never
   rendered), salience-ordered. Trim only if real prompts bloat (not pre-emptively).
4. MENUS: static per call-type/domain → prompt-cache safe (§10.2). Content gating is a SILENT
   ENGINE CLAMP preserving relative intent (a "legendary" ask at L1 rolls the best allowed).
5. RARE FLAT CONCEPTS: gated by RARITY WEIGHTS ONLY (no minContentLevel field) — and a weight
   MAY be a FUNCTION of content level (constant for normal flats; a ramp ≈0→up for exotics).
   One mechanism, tunable, preserves the anywhere-drop jackpot. Valuable rares are HIGH BANDS
   of tiered lines (princess = lineage 'royal blood') — hard-gated by maxTier for free.
DEFAULTS: salience = identity → tiered desc → flats; band words are GENERIC AUTO-WORDS by
default ("somewhat X / X / very X / extremely X"), custom names opt-in per concept.

## §9a.2 TAG SCHEMA & SYSTEM RULES ✅ (decided interactively; REVIEWED-FINAL 2026-06-12)
- TWO structures (group records chosen; impl details Claude's call — designer confirms
  MECHANISMS/CONCEPTS only):
  TagGroup   { id, domains: character|relic|both, pickPolicy: exactly-1 | at-most-1 | free,
               appearOdds default (level-rampable), menuLabel }
  TagConcept { id, group, word, depth (1 = flat), valueWeight?,
               customBandNames?[4], opposite?, oddsOverride? }
               // minTier DROPPED (W8 2026-06-13): all concepts start at t1; "inherent
               // grandness" = valueWeight + appearOdds, not a tier floor.
- pickPolicy meanings: exactly-1 = mandatory floor (gender, race; relic form/material);
  at-most-1 = optional-but-exclusive (background, notoriety — the old group-mutex);
  free = everything else, antonym PAIRS inside free groups handled by `opposite`.
  Arbitrary at-most-N caps are CUT (appearance odds keep counts sane).
- appearOdds: group default + per-concept override — effectively per tag.
- ~~tierRange / minTier~~ DROPPED (W8 2026-06-13, designer: "minimum tier is flawed"): all
  concepts start at t1. The "no faintly royal" goal is met instead by valueWeight (high-born's
  t1 is already valuable) + tiny appearOdds (rare) — a GRADIENT (t1 minor noble → t20 imperial
  blood), not a hard floor. Generalizes the W7 skill value-weight to all concepts.
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

## §9b STRUCTURE ✅ (designer-approved 2026-06-12: "for prototype that sounds ok. Implement.")

The complete structure — SIX concepts, nothing else exists:
  1 TagGroup (family + family rules) · 2 TagConcept (one word in the vocabulary) ·
  3 TagInstance (word+tier ON a card — the only place tiers exist) · 4 Band (the coarse
  4-step language everything outside the engine speaks) · 5 TagQuery (a pointer at tags) ·
  6 Slot (requires/favors lists of TagQueries).

KEY PROPERTY (designer): the structure must support "slot requires tags". Hence:
- The vocabulary is COMPLETE — system tags live in it too, so slot queries have one
  namespace: group `type` (character/relic/stackable, exactly-1, identity, never rendered)
  and group `kind` (stackable kinds: gold, debt, … — §7.1 "kind is a tag").
- TagQuery { match: concept-or-group, minBand?: band words not tiers }. A card matches ⇔
  it carries an instance whose concept (or that concept's group) matches at ≥ the band floor.
- Slot { requires: TagQuery[] (hard gate, ALL), favors: TagQuery[] (each held match adds
  band dice +1/+1/+2/+3, +4 at t20; holding the OPPOSITE of a favored concept = clash) }.
  Examples: quest beat = requires [character], favors [stealth, brave] · bedroom shelf =
  requires [relic], favors [craft≥fine, renown(group)] · ransom = requires [stackable, gold] ×200.

SCALE FACTOR (added 2026-06-13, designer: "multiplicative factor is a good concept"):
a concept may carry a MULTIPLIER applied to a defined subset of co-resident tags' values —
the one multiplicative element in an otherwise additive value model. First user: relic
`form.scale` ("how much object is this": nail 0.05, sword 1.0, crown 1.5) multiplies
SUBSTANCE tags (material, craft) only; STANDING tags never scale (the Saint's Nail keeps
its famous-t14 value). RELIC VALUE FORMULA — AGREED (designer 2026-06-13):
  relicValue = formFactor × materialFactor × (base + Σ substance tags) + Σ standing tags
(material is a FACTOR, not added gold — the golden version of a thing ≈ ×8 that thing;
small base so a tag-less relic isn't worth 0; standing stays OUTSIDE the product — the
Grail is a plain wooden cup: story-value doesn't live in the matter.) Characters: NOT NEEDED
YET (designer 2026-06-13); if one ever appears the holder should be BACKGROUND, not race —
race-as-multiplier rejected (game-wise it pushes players to farm the high-value race).
Standing lines (high-born/famous/background-rank) must stay ADDITIVE — multiplying needs
substance and would kill the value-without-usefulness jackpots (the penniless saint).

FEEDING A UNIT TO THE AI (designer-confirmed example): drop `type:*` → salience order
(identity → tiered desc by value → flats) → tiered instances render as BAND WORDS,
flats bare. `[{female},{human},{brave},{strong,t13},{stealth,t6}]` →
"Ysolde — female human; very strong, journeyman stealth; brave". Same words parse back:
AI proposes "master smith" → engine parses concept+band, rolls exact tier in-band.

IMPLEMENTATION: green-lit for the STRUCTURE (task #30); current word list migrates as
PROVISIONAL content. The §9b CONTENT walk below decides the real vocabulary.

### §9b CONTENT WALK — GROUPS (locked one by one; concept/word lists = a second pass)
Pass 1 locks GROUPS ONLY (policy/value shape), pass 2 walks each group's concepts.
1. `type` ✅ — character/relic/stackable · exactly-1 · value 0 · never rendered;
   exists so slots can `requires: [character]` / `[stackable, gold]`.
2. `gender` ✅ — male/female · exactly-1 · value 0.
3. `race` ✅ — human/wolfman/elf/lizardman (flat concepts, one tier each) · exactly-1 ·
   value 0 · odds skewed human-common; exotic-race VALUE comes via pools (#31), not the tag.
4. `personality` ✅ — free · FLAT (one tier) · ~~SIGNED value~~ SUPERSEDED by pass 2
   (W1, designer 2026-06-13): ALL words value 0, pure flavor; opposite-pairs
   (exclusion + dice clash); appearOdds = tunable balance baseline, NOT a design constant
   (negatives fold into E[total]≈target calibration).
5. `background` ✅ REVERSED-THEN-FINAL (designer 2026-06-13: "im positive now, BACKGROUND
   should have tiers") — at-most-1 · TIERED · PER-WORD DEPTH = each vocation's ceiling
   (peasant ~6 shallow, soldier/priest/merchant deep ~14-16): rank IS the tier of your
   background, and per-word depth prices rank-5-soldier ≠ rank-5-peasant (a shared "rank"
   line could not — that candidate is DEAD, subsumed). Custom band names per word are
   REQUIRED (auto "very soldier" is nonsense) but ⚠ NAMES TBD — walkthrough examples
   (levy/veteran/captain/general) are PLACEHOLDERS; real names must not assume one
   army's/country's structure (designer). Birth stays in `standing` (princess = high-born,
   not a background tier); battlefield-competence `command` skill = pass-2 call.
   Probes that got here: criminal lord, princess-outvalues-crime-lord (per-concept depth),
   high-post-but-incompetent general = {soldier,t13}+{dull}+no skill. CUT "noble" word.
6. `trait` ✅ (replaces "physical" — name clashed with the physical ATTRIBUTE; designer:
   attributes are the dice layer, tags stay the priced/story/slot face, decoupled) —
   free · TIERED opposite-pairs (strong/weak, tough/sickly, beautiful/ugly, clever/dull,
   scarred… pass 2) · deep positive / shallow negative · SIGNED value (negative sides go
   more negative with tier, shallow depth keeps it mild). Group id is ENGINE-SIDE ONLY.
   ⭑ PRESENTATION RULE (all groups, designer 2026-06-13): on units, tags render to the AI
   as BARE band words — group labels are never part of the AI language; labels appear only
   in the pick-menu (neutral headers, e.g. "qualities:") and player-UI grouping.
   ⭑⭑ AI TAG FORMAT — LOCKED (designer 2026-06-13, supersedes fused band words): BOTH
   directions = `word (rank)` with ONE generic 4-step rank vocabulary shared by ALL tiered
   concepts: low / mid / high / legendary. Engine {criminal,t10} → "criminal (high)"; AI
   "criminal (high)" → engine rolls a tier in the high band. Flats = bare word. Custom band
   names (crime lord / grandmaster) are DEMOTED to optional player-display flavor only —
   no longer part of the AI language, authorable anytime (resolves the armies-differ
   naming worry). Tier integers never cross the AI boundary.
RELIC-SIDE GROUPS:
R1. `form` ✅ FINAL (designer 2026-06-13; supersedes two earlier iterations — flat+formFactor,
    then tier-derived multiplier × material × craft) — exactly-1 · TIERED LIKE BACKGROUND:
    each form word ROLLS a tier with PER-WORD DEPTH CAPS (nail ~4, like peasant; sword/crown
    deep). THE FORM TIER EMBODIES BOTH MATERIAL AND CRAFT (designer: "sword TIER is the
    embodiment of both") — one number for how fine the thing is; WHY it's fine (starmetal,
    masterwork forging) = AI FLAVOR TEXT, never engine data. AI format: "sword (high)".
    Authored CATEGORY metadata stays (sword→weapon, ring→jewelry) — NOT a second rolled tag
    (two rolled groups could contradict; designer caught it). TagQuery may match concept OR
    group OR CATEGORY (armory rack `requires [relic, weapon]`; favors [form ≥ high]).
R2. `material` + `craft` — DROPPED (designer: "they are EMBODIED by the sword quality").
    RELIC VALUE = FULLY ADDITIVE: value(formTier) + Σ standing. NO multiplier survives —
    the scale-factor concept stays parked in the structure section, currently UNUSED; the
    golden-nail problem is solved by nail's own depth cap. Grail = {cup t3, famous t18}.
    Relic roster built by ANALOGY to the 8 character groups (designer): BG≈form ·
    race≈style · personality≈trait(renamed — "personality" is a misnomer for objects) ·
    skill≈power · standing≈fame-only. Gender: no analogue.
R3. `style` ✅ (designer 2026-06-13; AMENDED at W12 to exactly-1) — exactly-1 · FLAT
    (no tiers) · value ~0 · culture-marks mirroring races ("lizardkin-styled sword") ·
    slot-fit + story (lizard shrine favors lizardkin style). Now parallel to `race`:
    every relic has a style, human the common default. See W12 for words.
R4. `trait` ✅ (designer 2026-06-13; "personality" misnomer renamed) — free ·
    opposite-pairs · PER-WORD DEPTH (beautiful/ugly tiered; sturdy/fragile flat-or-
    shallow — per pair in pass 2; depth is per-CONCEPT so groups mix freely) · signed
    value where it matters, ~0 for neutral descriptors (heavy/light, grim/cheerful).
R5. `enchantment` ✅ (designer 2026-06-13; named "enchantment" per designer — was "power")
    — free, tiny appearOdds · tiered DEEP earning lines (relics' rare jackpots) ·
    all positive. ⭑ EXCEPTION to the bare-words rule (designer): enchantments render
    WITH their label — "enchantment: fire (high)" — bare "fire (high)" is ambiguous
    on an object.
R6. relic `standing` ✅ (designer 2026-06-13: "standing only famous yea") — FAME ONLY:
    the shared `famous` concept (domain both, tiered deep). No infamous/high-born for
    objects; a curse, if ever wanted, = a negative enchantment line (pass-2/later).
    Grail = {cup t3, famous t18} → "a cup (low); famous (legendary)".
S1. `kind` ✅ (designer 2026-06-13) — stackables' identity group: gold, debt, grain… ·
    exactly-1 · flat · exists so slots can `requires [stackable, gold]`; stackables have
    no rolled tags (§7.1) — type + kind is their whole tag-set.
GROUP PASS COMPLETE (2026-06-13). Character 8: type/gender/race/personality/background/
trait/skill/standing · Relic 7: type/form/style/trait/enchantment/standing · Stackable:
type/kind. NEXT: PASS 2 — word lists per group, one group at a time.

## §9b PASS 2 — WORD LISTS (one group at a time)

W1. `personality` ✅ LOCKED (designer 2026-06-13) — 7 opposite-pairs, all flat, **ALL
    VALUE 0** (designer reversed the pass-1 signed-value plan: "i dont think theres a
    good/bad pairs… cowardly can be seen as careful, brave as reckless" — every word is
    pure flavor + dice-hook; supersedes §9b group-4's good +6 / bad −6 note):
      cool/hotheaded · serious/playful · greedy/generous · loner/gregarious ·
      lustful/chaste · dominant/submissive · calculating/instinctive
    Designer authored the list, replacing the old vocab (brave/cowardly, honest/deceitful,
    kind/cruel CUT — kind/cruel overlapped greedy/generous). Cross-pair audit (all 21
    pair×pair, 84 word-combos) done: clean EXCEPT designer's original `stoic` — wrong
    axis (temper word in the company-preference pair): hotheaded+stoic contradiction,
    playful+stoic clash, stoic≈cool/serious overlap → replaced; designer picked `loner`.
    All-zero values also drop personality out of E[total] calibration entirely.

W2. `background` WORDS ✅ LOCKED (designer 2026-06-13) — 16 vocations:
      soldier · hunter · peasant · sailor · criminal · merchant · mystic · artisan ·
      adventurer · scholar · priest · slave · ruler · entertainer · servant · courtesan
    `courtesan` ADDED (designer probe "are brothel workers appropriate" → yes: fits the
    fiction, passes the career-ladder test — streetwalker → courtesan → royal mistress,
    high tiers are intrigue gold; dedicated word over folding into entertainer so the AI
    doesn't have to infer it). UNISEX-BY-GLOSS: the word connotes female but the
    always-present `gender` tag overrides connotation — "male · courtesan (high)" is
    unambiguous; vocab gloss carries "unisex; pairs with the gender tag". Alternatives
    rejected: companion (bare-word ambiguity — reads as friend/retainer), escort
    (modern), consort (only coherent at top tier). NOT gated on `lustful` — a chaste
    calculating courtesan is a valid roll.
    Changes from old vocab: `noble` CUT (pass 1 — birth = standing:high-born) · `beggar`
    CUT (designer: "beggar is just lowest tier peasant") · `wanderer` → `adventurer`
    (tier = how storied the career; "high-rank drifter" was fuzzy) · `healer` → `mystic`
    (designer asked rename after the forest-witch probe; "witch" gendered/dark-coded,
    "magic practitioner" names a capability = background/skill collision; mystic =
    consultable-about-the-beyond ladder: fortune-teller → seer → oracle → prophet; healing
    competence was half-duplicating skill:heal — physician = scholar+heal, village healer
    = mystic+heal) · ADDED ruler (the OFFICE ladder: headman → mayor → lord → emperor;
    distinct from high-born BLOOD — usurper = ruler w/o high-born, princess = high-born
    w/o ruler) · ADDED entertainer (street performer → court bard → living legend) ·
    ADDED servant (maid/groom → steward of a great house; employed, vs slave = unfree).
    Candidates passed over: gladiator, official (overlapped ruler/scholar).
    RULE established (named-profession test): background word = a CAREER LADDER SOCIETY
    RECOGNIZES, never a capability. Archer = soldier/hunter + skill:weapon (AI guise);
    assassin = criminal(high) + stealth; witch/wizard = any bg + magic-* skill (court
    wizard = scholar+magic-fire, forest witch = mystic+magic-dark+loner — lifestyle/
    location is AI flavor, not a tag); fraud fortune-teller = mystic w/o magic skill
    (incompetent-officer trick generalizes). ⚠ FLAG for skill station: melee/ranged split
    of skill:weapon (the "where do archers live" question).
    Still open for background: band names (now DISPLAY-ONLY given the word(rank) AI
    lock — recommend deferring past the walkthrough).

W3. `background` DEPTH CAPS ✅ LOCKED (designer 2026-06-13) — per-word cap table:
      20: ruler · soldier · criminal · priest · mystic · artisan · adventurer ·
          entertainer   (emperor · kingdom-breaking warlord · shadow-emperor · pontiff ·
          prophet · grandmaster-of-national-treasures · hero-of-songs · voice-of-an-age)
      16: merchant · scholar · courtesan · sailor · slave   (magnate · archsage ·
          kingmaker mistress · admiral of legend · A DEPOSED KING IN CHAINS)
      12: hunter   (mythic beast-slayer)
      10: peasant · servant   (village patriarch · majordomo)
    FLOOR: every word ≥10 (designer). PRINCIPLE (designer, via slave-16): DEPTH CAP =
    what's POSSIBLE; the bottom-weighted tier-roll odds = what's FREQUENT — slave >4 is
    vanishingly rare but a t16 slave (~91k) is legal jackpot material; maxTier=2×level+2
    still gates by content level. Designer deltas from proposal: sailor 14→16,
    servant 12→10; merchant/scholar/courtesan deliberately NOT 20.
    Background band names: PARKED past the walkthrough (display-only since the AI lock).

W4/W5 ⚠ REVAMPED 2026-06-14 (SUPERSEDES the attr-decoupling parts below). Attributes restructured
    to STRENGTH·DEXTERITY·INTELLIGENCE·CHARISMA·CONSTITUTION, and body "stat" tags now FEED their
    attribute (the old "muscular ≠ strength / gym-body who folds" DECOUPLING is OVERTURNED — A locked).
    ONE stat tag per attribute (B locked): strength `muscular/scrawny` · dexterity `nimble/clumsy`
    (NEW pair) · intelligence `clever/dull` · charisma `beautiful/ugly` · constitution `tough/sickly`.
    LEFTOVER body tags `tall/short` + `endowed/flat` stay NON-stat (flavor + favored-eligible only).
    WHICH GROUPS INFLUENCE ATTRIBUTES (designer 2026-06-14):
    • body = FULL (the primary stat lever, above).
    • RACE = INDIRECT — race does NOT modify attributes directly; it BIASES the APPEARODDS of the
      body stat tags (e.g. wolfkin → more likely muscular/nimble · elven → clever/nimble · lizardkin
      → tough). So race shapes a unit's likely build through the TAG layer, not a flat racial stat.
      Per-race odds table TBD (ties to pools #31).
    • personality = NONE (designer 2026-06-14: trade-off ±attr mappings were considered then
      DROPPED — personalities stay pure story/flavor, value 0). STR especially didn't fit temperament.
    • background = VERY SMALL +, RANK-SCALED ✅ LOCKED 2026-06-14 (designer "do this") —
      5 PURE + 10 SPLIT (every attribute-pairing EXACTLY ONCE) + servant=all-5 → perfect 6/6/6/6/6:
        PURE: soldier=STR · hunter=DEX · scholar=INT · ruler=CHA · slave=CON
        SPLIT: sailor=STR+DEX · priest=STR+INT · adventurer=STR+CHA · peasant=STR+CON ·
        artisan=DEX+INT · entertainer=DEX+CHA · criminal=DEX+CON · merchant=INT+CHA ·
        mystic=INT+CON · courtesan=CHA+CON
        ALL-5 (tiny each): servant
      A SPLIT gives the small + to BOTH its attrs (vs split half/half — minor, → C).
    • skill / standing / gender = NONE. (per-group weights = #40.)
    • ✅ MODEL RESOLVED 2026-06-14: effective attr = BUILD + TAGS, ADDITIVE & BUILD-DOMINANT.
      BUILD = focus (player reallocation, the big lever) + natural-lean (random growth-vector
      component; "talent" = NO separate system). TAGS = small across the board — body is the
      biggest tag contributor but still POLISH (not a build-rung rival, moderating the earlier
      strong-lever idea); background tiny. Factors SUBSTITUTABLE: great-talent+decent-tags ≈
      great-focus+decent-tags can both reach "Great STR" (focus still near-necessary; tags/talent
      fine-tune). This SUPERSEDES the §10 single-lever pass-tables; magnitudes set in C.
    Pending walkthrough: stat-bonus magnitudes (C); depth (designer leans 10-tier max for body, vs
    the old 16–20 — D); whether `clever` cap lifts now that it feeds intelligence. Original W4/W5
    word/depth notes kept below for context; their attribute-decoupling claims are superseded.
W4. `body` WORDS ✅ LOCKED (designer 2026-06-13 "sounds good. proceed") — group RENAMED
    trait→`body` (designer;
    engine-side id only, AI gets bare words as agreed; bonus: no more name-share with the
    relic `trait` group). 5 opposite-pairs + 1 unpaired:
      muscular/scrawny (build) · tough/sickly (constitution) · beautiful/ugly (looks) ·
      clever/dull (wits) · tall/short (height — designer add) · endowed/flat (sexual
      body — designer paired it: "endowed should have a negative… like a flat woman")
    AMENDED at the depths station (designer 2026-06-13, before table lock): strong/weak
    → `muscular/scrawny` — strength-as-CAPABILITY is the physical ATTRIBUTE's job, the
    tag is the visible BUILD (muscular + physical-4 = gym-body who folds — incompetent-
    officer trick on a body; scrawny over "weak" (capability word) and "frail" (collides
    w/ sickly); scrawny+tough wiry survivor, muscular+sickly coherent). `flat` as
    endowed's negative (gloss "render per gender: bust/endowment"; AI sees vocab glosses
    at prompt time; rejected: modest — bare-word misreads as personality, meager —
    vague).
    `endowed` (designer 2026-06-13: "remove shapely, add endowment" — the sexual-body
    axis, explicit register; unisex via the COURTESAN PATTERN: the always-present gender
    tag tells the AI which kind — female·endowed = bust, male·endowed = endowment; gloss
    "render per gender tag"). Superseded candidates: `alluring` (carnal magnetism —
    designer meant literal physique), `shapely` (figure — designer chose the explicit
    word instead; ⚠ noted risk stands: OpenAI narrator may sanitize explicit renderings).
    `scarred` DROPPED for now (designer). Axis boundaries: beautiful=face,
    endowed=sexual body, strong=functional muscle. clever/dull (wits) living in a group
    named `body` = accepted (label never rendered); audit clean (short+strong stocky
    bruiser, dull+beautiful fine, ugly+endowed fine, etc.).
W5. `body` SIGNS + DEPTHS ✅ LOCKED (designer 2026-06-13 "sounds good. record") —
      muscular +20 / scrawny −4 · tough +20 / sickly −4 · beautiful +20 / ugly −4 ·
      clever +16 / dull −4 · tall 0,d6 / short 0,d6 · endowed +16 / flat −4
    Cap anchors: muscular t20 build-of-legend · tough t20 the unkillable · beautiful t20
    face-that-launches-wars · clever t16 once-a-generation mind (NOT 20 — would shadow
    scholar(legendary); intelligence attribute + background own genius-of-the-age) ·
    endowed t16 (parallel narrower-than-beauty). RULES established: (1) NEGATIVES
    SHALLOW (4) — deep negatives would let the generator FUND monster positives by
    dumping a huge minus (degenerate jackpots); shallow = complications, not financing.
    (2) VALUE-0-BUT-TIERED is legal (tall/short d6): tiers buy AI intensity
    ("tall (legendary)" = a giant) without gold value.

W6. `skill` WORDS ✅ LOCKED (designer 2026-06-13 "this list looks good. continue") — 16
    skills (free · deep tiered lines · believability cap ~2–3 per character · DECOUPLED
    from attributes: attribute = slot base coins, skill = favored-dice band bonus only):
      roguery · lore · nature · craft · performance · food · heal · social ·
      intimidation · leadership · melee · ranged · magic-fire · magic-earth ·
      magic-water · magic-dark
    Changes from old vocab: stealth→roguery (broader: locks/theft/sleight/forgery/
    infiltration) · beast→nature (covers handling + wilderness/tracking/herb-gathering) ·
    song→performance (music/dance/acting) · weapon→melee+ranged SPLIT (archers live in
    ranged; duelist vs sharpshooter; slots favor one — "a rooftop shot") · ADDED social
    (one-on-one influence — ABSORBS trade + seduce, designer) · ADDED intimidation
    (influence by stick) · ADDED leadership (=the dropped `command`; group command/
    generalship — completes the officer probe) · DROPPED magic-air (designer; 4 schools,
    dark = the forbidden one). sail folds to background tier (seaman = sailor tier), not
    a skill (designer).
    SCOPE TABLE (makes the audit decidable): roguery=stealth/locks/theft/infiltration ·
    lore=books/history/arcane THEORY/secrets-by-study · nature=wilderness/tracking/
    animals/herb GATHERING · craft=making objects · performance=entertain an AUDIENCE ·
    food=cook/brew/provision · heal=mundane medicine · social=ONE-ON-ONE influence
    (persuade/charm/deceive/seduce/haggle) · intimidation=fear/coercion · leadership=
    command a GROUP/tactics · melee=close combat · ranged=bow/thrown · magic-*=casting.
    FULL PAIRWISE AUDIT (all 120 pairs) — NO true collisions; 9 overlap-risk pairs
    adjudicated by domain boundary: social/intimidation = carrot/stick · social/leadership
    = individual/group · social/performance = influence/entertain (seduce→social) ·
    intimidation/leadership = frighten-individual/move-group · leadership/melee+ranged =
    command/personally-fight (THE OFFICER PROBE: soldier(high)+leadership=real general,
    +melee no leadership=duelist, +neither+dull=appointee) · lore/magic-* = know-about/
    cast (scholar can have lore + zero schools) · nature/heal = gather/treat · nature/food
    = find/prepare · magic-water/heal = elemental-casting/mundane-medicine (both heal in
    FICTION, different source — vocab gloss to keep AI from conflating).
W7. `skill` VALUE MODEL ✅ LOCKED (designer 2026-06-13 "sounds good. lock it") — NEW
    MECHANISM, supersedes the per-word-depth-cap proposal for skills: ALL skills have
    UNIFORM DEPTH 20 (every line runs 1→20, so low/mid/high/legendary band mapping is
    identical across skills; reaching high tiers is "very rare" via the bottom-weighted
    tier-roll, SAME for every skill) — and a PER-SKILL VALUE WEIGHT differentiates worth
    (this is the recorded-but-unused SCALE FACTOR / multiplicative-factor concept, now
    in use). Curve = PER-SKILL GROWTH RATE (not a flat multiplier): every skill t1 ≈ 6
    (a novice is a novice), values diverge as they climb (a flat multiplier would make a
    novice cook worth 0.06g — rejected for insane floors). t20 VALUE CEILINGS (= the old
    depth-table caps, now all reachable):
      ~1.19M: melee · ranged · leadership · magic-fire · magic-earth · magic-water ·
              magic-dark   (g≈1.90)
      ~626k:  social   (g≈1.84)
      ~91k:   roguery · lore · heal · craft   (g≈1.66)
      ~25k:   nature · performance · intimidation   (g≈1.55)
      ~13k:   food   (g≈1.50)
    So t20 magic-fire ≈ 90× t20 food, while both are equally rare to roll and both read
    "legendary" to the AI. PRINCIPLE (designer, justifies leaving background W3 on
    depth-caps): RANK IS BOUNDED, MASTERY IS NOT — no emperor-peasant exists (depth-cap
    is a real ceiling), but anyone can master any skill (uniform depth, value differs).
    Magic stays special via tiny appearOdds (rarity lever), NOT depth — combat shares the
    1.19M ceiling. ⚠ flat-favored-dice-vs-high-attrs revisit still stands (pass-1 flag).
    ⚠ IMPL NOTE for #30: the SCALE-FACTOR section earlier in this doc (recorded unused)
    is now LIVE for skills — per-concept growth rate / value weight is required in the
    value curve; characters are otherwise additive (Σ tag values), skills just price
    their own curve.

W8. `standing` WORDS + minTier DROP ✅ LOCKED (designer 2026-06-13 "Just these three are
    enough. continue" + "minimum tier is flawed… T1 just rarer and more value by
    default") — 3 words:
      famous (renown for deeds — admired; opposite of infamous; domain BOTH — a famed
              blade) · infamous (renown for deeds — feared/hated; opposite of famous) ·
      high-born (birth/blood — aristocracy; CHARACTER-ONLY domain override; distinct from
              `ruler` background = the OFFICE)
    Candidates SKIPPED (designer "three are enough"): wealthy (double-counts gold economy),
    connected (= social skill + AI flavor), blessed/divine-favored.
    minTier DROPPED globally (mechanism deleted — see §9a.2, §8 schema, §8 group-8 edits):
    designer judged it flawed. Replacement = the W7 value-weight mechanism GENERALIZED to
    ALL concepts — "inherent grandness" = high valueWeight + tiny appearOdds, never a tier
    floor. high-born = high value-weight + tiny appearOdds → gradient t1 minor noble →
    t20 imperial blood (the old "no faintly royal" goal met by a valuable+rare floor, not
    a cut). CONFLICT CHECK (designer-requested): minTier was used in EXACTLY ONE place
    (high-born); dropping it conflicts with nothing — flats are depth-1, background/skills
    already start t1, bands still map t1-5/6-10/11-15/16-20; only change is high-born can
    roll its low tier at low content levels (fine — minor noble is a good early card,
    appearOdds keeps it rare). AI disclaimer (as `body`): never "standing:famous" — bare
    `famous (high)` only; group id engine-side. (Group 9 "lineage" stays DEAD — absorbed.)
W9. `standing` VALUES ✅ LOCKED (designer 2026-06-13 "famous/infamous should be apexes
    too… a way to add extra value to units") — all 3 are APEX value lines:
      high-born  + · depth 20 · t20 ≈ 1.19M · tiny appearOdds  (imperial blood — princess)
      famous     + · depth 20 · t20 ≈ 1.19M · low appearOdds   (a name sung across lands)
      infamous   + · depth 20 · t20 ≈ 1.19M · low appearOdds   (a name that empties taverns)
    All POSITIVE-ADDITIVE (the value-without-usefulness group — princess/Grail jackpots
    live here). `infamous` POSITIVE confirmed (NOT a liability): notoriety IS value
    (recruits through fear, opens underworld doors); the "brings heat" downside is a STORY
    consequence the AI writes, never a value penalty. Designer raised famous/infamous from
    the proposed 626k to the full 1.19M apex — standing exists precisely to ADD extra value
    to units, so the renown lines hit the top ceiling. Stacking is additive → a legendary
    famous princess = famous(t20) + high-born(t20) ≈ 2.38M, the intended top jackpot.
    high-born stays rarest (tiny appearOdds) so the princess remains the rare apex.
    STANDING GROUP COMPLETE — character side (8 groups) DONE.

W10. relic `form` WORDS ✅ LOCKED (designer 2026-06-13 "yes") — DESIGN CHANGED: form is
    now a SMALL set of BROAD CATEGORIES; the exact type (sword, ring) is AI FLAVOR TEXT,
    not a tag. 9 forms:
      melee-weapon · ranged-weapon · armor · clothes · accessory · document ·
      curio · decoration · furniture
    Rationale (designer "the exact type should be flavor… dont want too many, fed to AI"):
    fewer AI tokens + the narrator is better at the specific object anyway ("a jeweled
    starmetal blade" from melee-weapon(legendary)+ornate+fire). CONSEQUENCES recorded:
    (1) R1 "category metadata" (sword→weapon) is now REDUNDANT/DROPPED — FORM IS THE
    QUERYABLE CATEGORY (slots match form directly: armory `requires [melee-weapon,
    ranged-weapon]`). (2) The golden-nail problem DISSOLVES (nail was an exact type; nails
    aren't relic cards now) → per-form DEPTH CAPS likely OUT; form probably goes
    UNIFORM-DEPTH-20 like skills (W7), the TIER embodying material+craft/quality
    (t1 rusty junk → t20 legendary artifact) — CONFIRM at the form-value decision (next).
    Weapon split melee/ranged mirrors the skill split; "any weapon" slots list both.
    Word calls: `curio` = portable object valued for rarity/craft/material (carvings,
    masks, gems, oddments — designer: "weird things like wooden carvings… cover gems too")
    — beat `trinket` (connotes CHEAP — "legendary trinket" oxymoron), `treasure`/`gem`
    (narrower). vs `decoration` = a DISPLAY piece that furnishes a room (tapestry/statue/
    mirror/vase); split line = PORTABLE-sells-in-vault vs MOUNTED-for-room-prestige.
W11. relic `form` VALUE MODEL ✅ LOCKED (designer 2026-06-13 "sounds good") — UNIFORM
    DEPTH 20, the TIER IS the quality/value, standard global curve 6×1.9^(t−1) (legendary
    relic ≈ 1.19M base). Every category spans t1 (rusty junk/rags) → t20 (legendary
    artifact); tier embodies material+craft as locked. NO per-category value weight — all
    categories EQUAL value: at t20 every category is "a legendary masterwork of its kind"
    (throne/blade/robe/grimoire/gem comparably worth), and the tier already encodes
    fineness, so weighting would double-count. What differs between categories is UTILITY
    (weapons equip, decoration/furniture furnish prestige rooms, curio sells) — a fort
    mechanic, NOT a tag-value one. WHICH form you get is CONTEXT-driven via POOLS (R1b
    base-weight table, #31: armory→weapons, hoard→curio/treasure), not intrinsic per-form
    odds. (Per-category weights slot in trivially later if playtest demands; not now.)
    Relic value = value(formTier) + Σ trait + Σ enchantment + Σ standing (fully additive,
    R2). RELIC FORM COMPLETE.

W12. relic `style` WORDS ✅ LOCKED (designer 2026-06-13 "should be exactly 1 then.
    human wolfkin elven lizardkin ancient exotic") — pickPolicy AMENDED at-most-1 →
    EXACTLY-1 (amends R3). 6 words: human · wolfkin · elven · lizardkin · ancient ·
    exotic. FLAT · value ~0 · human-common odds (now fully parallel to `race`: every
    relic has exactly one style, human the default). human KEPT (it's the mandatory
    default value, like race's human — not absence). ancient (old-world/antique craft)
    and exotic (foreign/unnamed-faraway) are non-cultural styles that still occupy the
    single style slot. CONSEQUENCE: an "ancient elven" relic picks ONE as the style tag,
    the other = AI flavor (acceptable for prototype). Slot-fit hook: lizard shrine favors
    lizardkin, ruin favors ancient, etc.

W13. relic `trait` ✅ LOCKED (designer 2026-06-13 "skip and proceed… beautiful should go
    up to T20") — ONE group, per-concept value (NO body/personality-style split — designer
    agreed: relic traits don't cleave into two clean domains, only grim/cheerful was pure
    vibe and it's cut). 4 opposite-pairs:
      beautiful / ugly  — looks — SIGNED: beautiful depth 20 (t20 ≈ 1.19M, a top value
                          line like form/character-beauty), ugly depth 4 (≈ −41g)
      decorative / simple — ornamentation — value 0, tiered d6 (AI intensity)
      sturdy / fragile    — durability — value 0 (fragile's drawback is utility/story,
                          not gold; per W11 utility≠value), tiered d6
      heavy / light       — weight — value 0, tiered d6 (slot-fit: heavy wants strong
                          wielder)
    REMOVED grim/cheerful (designer: vibe belongs to style/AI-flavor, not a physical
    trait). REJECTED additional axes (designer "all look bad"): pristine/battle-worn
    (condition/provenance), balanced/unwieldy (handling), large/small (size — proxied by
    heavy/light). KEY PoE INSIGHT (designer pointer): PoE "traits" are FUNCTIONAL affixes
    (+life/res/damage) — in our split those are the `enchantment` group's job, NOT traits;
    so descriptive traits stay few, enchantment carries functional richness. OPEN for the
    enchantment station: should a relic's power BOOST ITS WIELDER (PoE-style equip bonus —
    combat dice / attribute bump on equip), tied to §7 equip/bedroom mechanic?
    [RESOLVED W14 — relics equip on ROOMS not units; see W14.]

W14. relic `enchantment` MECHANISM + ELEMENTAL words ✅ LOCKED (designer 2026-06-13 "yes")
    — MECHANISM (corrects the W13 flag: relics equip on ROOMS, NOT units): enchantment =
    deep VALUE + FLAVOR + ROOM PRESTIGE via the existing overlap/themeFavored mechanic
    (a fire relic in a forge boosts that room's prestige when the enchantment matches the
    room theme) — NO new system. QUEST RELIC-SLOTS = FUTURE WORK (deferred): structurally
    trivial (the "slot requires/favors tags" property already lets a relic contribute its
    tags like a unit), only the gameplay/UX integration is deferred. NOT a unit equip-buff.
    ELEMENTAL enchantments = THE 4 MAGIC SCHOOLS: fire · earth · water · dark (designer:
    "match elemental with magic elements from characters"). ONE element vocabulary shared
    across magic skills / enchantments / room themes / pool roll-table (coherence). My
    proposed shadow = dark; radiance DROPPED (no light school — air cut, dark kept);
    frost/venom/storm become AI FLAVOR under the real elements (frost=water, venom=earth/
    dark). "mystical" category rejected (designer).
    AUGMENTING enchantments — ONE per ATTRIBUTE EXCEPT intelligence (= magic, the elemental
    set) → 4 augmenting enchantments, REMAPPED 2026-06-14 to the new attribute set:
    strength · dexterity · charisma · constitution (every attribute has a relic-power path).
    Render: label-rendered "enchantment: fire (high)" (R5 exception). Value + odds: W15+.

W15. relic `enchantment` AUGMENTING words ✅ LOCKED (designer 2026-06-13 "yes"; REMAPPED
    2026-06-14 to the new attribute set) — 4 augmenting enchantments, one per non-magic attribute:
      strength → might · dexterity → swiftness · charisma → presence · constitution → vigor
    (intelligence = the elemental set). Changes from the original: `glamour`→`presence` (designer:
    glamour read badly; presence = commanding aura spanning social/leadership/seduction);
    `insight` DROPPED (perception merged into dexterity→swiftness); `vigor` ADDED for constitution.
    NB thematic only — relics don't boost the wielder (W14: relics on ROOMS); the per-attribute
    mapping is for coherence + future quest-relic-slot favored-matches.
    FULL ENCHANTMENT SET = 8: fire · earth · water · dark · might · swiftness · presence · vigor.
    Distinctness: might vs muscular(body) vs strength(attr); presence vs beautiful(body) vs
    charisma(attr); vigor vs tough(body) vs constitution(attr) — all clean (magic power vs
    descriptor vs stat). Every attribute has a relic-power path.

W16. relic `enchantment` VALUE + ODDS ✅ LOCKED (designer 2026-06-13 "yes") — uniform
    depth 20 (all 8 start t1) · uniform value weight → t20 ≈ 1.19M (APEX line — the
    relic's rare jackpot power; no per-enchantment weight, like form categories: WHICH
    one is utility/theme, not value) · TINY appearOdds (uniform, tunable — the rarity
    lever; also naturally caps count per relic, usually 0-1) · all positive, fully
    additive. RELIC VALUE = value(formTier) + Σ trait + Σ enchantment + Σ standing
    (maxed legendary artifact = multi-M jackpot, vanishingly rare via odds). MULTI-
    ENCHANT allowed-but-rare (free group; a flaming swift blade is legal, tiny odds make
    it rare not impossible — no hard cap). ENCHANTMENT COMPLETE.

W17. relic `standing` ✅ LOCKED (designer 2026-06-13 "yes") — confirms R6: reuses the
    SHARED `famous` concept (domain = both), nothing new. famous ONLY for objects (a
    renowned relic — Grail, a named blade); same apex value line as character famous
    (W9: depth 20, t20 ≈ 1.19M, low appearOdds). NO infamous / high-born for objects
    (character-only via domain override). A relic CURSE = a negative enchantment line,
    FUTURE WORK (not a standing word). Grail = chalice/curio + famous(legendary).

W18. stackable `kind` ✅ LOCKED (designer 2026-06-13 "just have Gold and Debt for now")
    — 2 kinds: gold (currency, unit value 1) · debt (owed coin, negative stackable).
    exactly-1 · flat · value-0 identity tag (the card's value = quantity × unit value;
    kind just says which resource). grain CUT (designer; no upkeep mechanic yet). evidence/
    mess stay LIABILITY cards (discrete complications), NOT stackable kinds. FUTURE: more
    kinds when mechanics need them — consumable items (designer), building materials, etc.
    §9b PASS 2 VOCABULARY WALK COMPLETE (W1–W18).
    Pass-2 note (designer): words will in practice be BASIC/elemental — fire, frost,
    venom… — not fancy adjectives like "flaming".
R1b. ✅ (designer 2026-06-13) — COMPATIBILITY = POOLS WITH BASE-WEIGHT-0: no separate
    appliesTo field. The DEFAULT roll table holds concept×category weights (1 default,
    0 = nonsense: iron×tapestry); pools (#31, now covering relics too: forge-hoard,
    reliquary…) MULTIPLY base weights — 0×anything=0, bans authored once, bias per pool.
8. `standing` ✅ (absorbs renown + lineage + any future pure value-line — designer: "the
   one housing value-adding tags, same category") — free (NOT at-most-1: famous princess
   = famous+high-born stack, rare via tiny odds) · tiered deep · all positive value ·
   famous/infamous opposite pair · high-born high value-weight + tiny appearOdds (W8 —
   minTier dropped; gradient t1 minor noble → t20 imperial blood), deepest · domain BOTH (relic
   renown: a famed blade) with CONCEPT-LEVEL DOMAIN OVERRIDE (high-born = character-only;
   small schema addition). Same disclaimer as `trait`: NEVER "standing:famous" to the AI —
   bare `famous (high)` only; group id is engine-side. (Group 9 "lineage" is DEAD — absorbed.)
7. `skill` ✅ — free (believability cap ~2-3 kept) · tiered DEEP earning lines (flagships
   depth 20) · custom band names (apprentice/journeyman/master/grandmaster) · all positive ·
   exotics (magic) gated by tiny appearOdds only. Attribute interaction: DECOUPLED layers —
   attribute = slot's base coins, skill tag = band bonus ONLY when the slot favors it
   (attrBias stays cut; pools own coherence #31). Word list pass 2 (+`command` candidate).
   DICE/ATTRIBUTE/THRESHOLD ✅ LOCKED 2026-06-14 → see **§10 — THE ROLL** (end of doc) for the
   full spec (fixed-sum base+growth vectors + player FOCUS; per-test difficulty × parHeads;
   OR-additive capped `bandFrac×std` tag bonus; 5 difficulty tiers; ideal + realistic pass-tables).
   Designed against goals G1–G7 (per-test difficulty · pass-table · no level-inversion · dopamine ·
   attachment-via-differentiation · locked invariants · specialist+hybrid builds). Injury term is a
   RESERVED placeholder pending its own design phase (#39).

### Part 1 — the authored vocabulary (static content; two lists)

    TagGroup {
      id          // 'race', 'physical', 'skill', 'craft', ...   (~10 groups total)
      domain      // 'character' | 'relic' | 'both' — which species can roll members
      pickPolicy  // 'exactly-1' — every card gets one member (gender, race, relic form)
                  // 'at-most-1' — optional, but never two members (background, renown)
                  // 'free'      — any members may stack (personality, physical, skill)
      identity?   // true → members worth 0 gold (gender/race/form/material — they say
                  //        WHAT the card is, they aren't treasure)
      appearOdds  // chance each member rolls (free/at-most-1); may grow with content level
      menuLabel   // header word shown to AI/player ('background:', 'craft:')
    }

    TagConcept {
      id, group, word   // ONE entry per word: 'strong' is one entry, 'weak' another
      depth?            // highest tier this word reaches. absent/1 = flat (no tiers).
                        //   strong: 20 (deep line) · weak: 4 (texture) · brave: flat
      valueWeight?      // per-concept growth/value scalar (W7/W8). high-value lines
                        //   (magic, high-born) reach big value; "inherent grandness" lives
                        //   HERE + appearOdds, NOT a tier floor. (minTier DROPPED — W8.)
      bandNames?        // 4 custom AI/player words; default auto "somewhat X / X / very X /
                        //   extremely X". skill: apprentice/journeyman/master/grandmaster
      opposite?         // partner that can NEVER coexist with this one + clashes in dice
      appearOdds?       // per-word override (rare exotics get tiny odds)
    }

### Part 2 — what a generated card carries

    card.tags = TagInstance[]        // TagInstance { concept, tier? }
    // e.g.: [ {concept:'female'}, {concept:'human'},      // identity, worth 0
    //         {concept:'brave'},                           // flat, ~6
    //         {concept:'strong', tier:13},                 // value(13) ≈ 13k — the prize
    //         {concept:'stealth', tier:6} ]                // "journeyman stealth", ~149

Tiers exist ONLY here — rolled per card, never stored in the vocabulary.

### Part 3 — who reads which field

| consumer | uses |
|---|---|
| generation | exactly-1 groups roll first (identity floor) → others roll via appearOdds under E[total]≈target calibration (§9a.2); `opposite` removes the partner once one side lands; maxTier = 2×contentLevel+2 clamps |
| value/mark | identity group → 0 · flat → ~6 · tiered → 6×1.9^(tier−1) |
| AI read/write | band words only (`bandNames` or auto-words); engine rolls exact tier in band |
| player display | word + band word + per-tag rarity border (keyed to band) |
| dice | favored tag → +1/+1/+2/+3 by band, +4 at t20; `opposite` of a favored tag → clash |

Exclusivity recap: whole-group exclusives (race, background, renown) = pickPolicy;
pair exclusives inside free groups (brave/coward, strong/weak) = `opposite`; tiers are
orthogonal to exclusion (they set magnitude, never coexistence). Sides of a pair set depth
independently — deep positive, shallow negative is the norm (strong 20 / weak 4).

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

## §10 — THE ROLL: dice / attribute / threshold ✅ LOCKED 2026-06-14 (numbers verified L3–L50)

Serves G1 per-test difficulty · G2 pass-table holds (every level) · G3 no level-inversion · G4
dopamine · G5 attachment-via-differentiation · G6 engine owns numbers / pooled resolution · G7
specialist AND hybrid builds. Verified via a supervisor agent loop (2 independent Opus sims converged
on the params + supervisor re-simulated → all 36 ladder cells in-band across L3/5/10/20).

### Attributes (5) — STRENGTH · DEXTERITY (= agility + perception, merged) · INTELLIGENCE · CHARISMA · CONSTITUTION

### Build — how a unit's attribute grows
`attr_A(L) = base_A + growth_A·(L−1)`
- **base** = born as a **fixed-sum random vector** (total ≈15, ~3/stat avg): random *distribution* =
  birth lean (dopamine); fixed *total* = balance (no birth-OP, only birth-SHAPE). Flat L1 floor — does
  NOT scale (the growth term does).
- **growth** = a **fixed-sum budget** (≈10/level; standard g0 = 2/stat) distributed by a random vector
  (natural lean) **reshaped by the player's FOCUS**: single focus → one **GREAT** stat (share 2.0) ·
  dual → two **GOOD** (1.5) · none → generalist (1.0). Two greats impossible (over budget). Re-assignable
  but only FUTURE growth re-skews (past banked → history sticks → attachment).
- **Build quality** (growth share in the tested attr): **weak 0.7 · decent 1.1 · good 1.5 · great 2.0**.
- DROPPED: rollTalents, aptitude, old ATTR_BIAS. "Natural talent" = the random growth-lean (no separate
  system). Differentiation GROWS with level (L1 ≈ all base; veterans diverge).

### The co-equal lever model
Effective power **E = ATTRIBUTE + MATCHING-TAG + ATTRIBUTE-TAG** (additive), in units of
**U(L) = a great build's coins = base + 2·g0·(L−1)** (scales with level):
- **ATTRIBUTE** (build; great = **1.0 U**) · **MATCHING-TAG** (a favored SKILL the slot wants, per-slot)
  = **0.5 U** · **ATTRIBUTE-TAG** (body + background, always-on) = **0.5 U**.
- Tags are **co-equal with the attribute** (matching + attr-tag = 1.0 = a full attribute); **max E = 2.0**.
- Every term **scales with level** (× U(L)) but tags are **flat across builds** (a weak and a great unit
  get the same 0.5U tag) → tags help any unit equally AND never invert with level (G3).

### What feeds the attribute (tag → attribute map)
- **BODY stat tags** (the bulk of ATTRIBUTE-TAG), one per attribute: STR `muscular/scrawny` · DEX
  `nimble/clumsy` · INT `clever/dull` · CHA `beautiful/ugly` · CON `tough/sickly`. (Reverses the old W4
  decoupling — a body tag now boosts its attribute.)
- **BACKGROUND** (a sliver of ATTRIBUTE-TAG), very small, **rank-scaled** — the locked 6/6/6/6/6 map
  (5 pure + 10 split, each attribute-pairing once, + servant = all-5).
- **RACE** — *indirect*: biases the appearOdds of body stat tags (wolfkin→muscular/nimble …), not a
  direct modifier.
- **MATCHING-TAG** = favored **skills** (per-slot). **PERSONALITY / STANDING / GENDER = none.**

### Per-test threshold
- A quest = SLOTS. Each slot: **AI picks** the tested attribute + favored/clashing skills; **ENGINE
  rolls** a difficulty.
- **threshold (heads) = E_difficulty × U(L) / 2.** Difficulty E (each tier = one more 0.5-lever):
  **trivial 0.25 · standard 0.5 · hard 1.0 · brutal 1.5 · extreme 2.0.**
- **Multi-stat quest** = ONE unit, its tested attributes **pooled across attributes** (NOT across units);
  combined bar **× (n+1)/2** → same pass-chance as single-stat (a HYBRID is the natural fit; a lopsided
  unit underperforms).

### Resolution (unchanged)
`coins = attribute + matching-tag (0.5U if the slot's favored skill is owned) + attribute-tag (body+bg)
− clash − injury` → flip, count heads. **Pooled**: heads vs the bar → success (≥bar) · partial
(≥0.6×bar) · failure → value **full / half / zero**. `clash` mirrors a tag (negative, same scaling);
`injury` = RESERVED placeholder (#39); coins floored at 0.

### The ladder + verified pass-table
≤ standard = **attribute alone** · hard = a **great attribute OR build + 1 tag** · brutal = **attribute
+ 1 tag** · extreme = **attribute + BOTH tags**. A sub-great generalist with no tag **caps at standard**.
Binomial success probabilities (final params), all in their target band — **re-verified L3–L50
(2026-06-14)** when the cap was raised to 40 (50 with a region's endgame building). Bands STABILIZE
as level rises (scale-invariant: coins & threshold both ∝ U(L); "coin" checks pinned ~.50;
"clears/fails" sharpen toward target then flatten) — nothing drifts out past L20:

| design check | target | L3 | L10 | L20 | L30 | L40 | L50 |
|---|---|---|---|---|---|---|---|
| decent, no-tag @ standard | clears | .77 | .80 | .81 | .84 | .86 | .87 |
| good, no-tag @ standard | sure | .91 | .98 | 1.0 | 1.0 | 1.0 | 1.0 |
| **great, no-tag @ hard** | **coin** | .50 | .50 | .50 | .50 | .50 | .50 |
| good, no-tag @ hard | fails | .25 | .05 | .01 | .00 | .00 | .00 |
| decent + 1 tag @ hard | clears | .61 | .68 | .71 | .73 | .76 | .78 |
| great, no-tag @ brutal | fails | .03 | .00 | .00 | .00 | .00 | .00 |
| **great + 1 tag @ brutal** | **coin** | .40 | .45 | .46 | .47 | .47 | .48 |
| great + 1 tag @ extreme | fails | .11 | .01 | .00 | .00 | .00 | .00 |
| **great + 2 tags @ extreme** | **coin** | .58 | .55 | .53 | .53 | .52 | .52 |

### Final numbers (LOCKED; tunable in playtest)
base ≈3/stat (fixed-sum random, total ~15) · g0 = 2 (growth budget ~10/lvl) · build shares
**weak .7 / decent 1.1 / good 1.5 / great 2.0** · tag = **0.5 · U(L)** each (matching & attribute) ·
**U(L) = base + 2·g0·(L−1)** · difficulty E **.25 / .5 / 1.0 / 1.5 / 2.0** · threshold = **E · U(L) / 2** ·
partial **0.6×** · value full/half/0 · multi-stat **× (n+1)/2**.
**Accepted drift:** L1–L2 degenerate (growth·(L−1)≈0 → builds collapse to base; early game is
luck/tag-driven). **The one fix from the working L10 draft was `base 4→3`** (+ decent share 1.0→1.1);
g0, tag weights (1.0/0.5/0.5), and the 0.5-spaced thresholds were unchanged.

### Implementation (economy.ts)
DROP rollTalents · ATTR_BIAS · flat favoredBonus(tier) · thresholdPerMerc. ADD: fixed-sum base+growth
vectors + focus allocation · U(L) · per-slot difficulty E → threshold E·U/2 · matching-tag (0.5U, favored
skills) · attribute-tag (body ≈ bulk of 0.5U + background tiny, rank-scaled) folded into the attribute ·
multi-stat pool ×(n+1)/2 · clash (mirror, negative) · injury placeholder (#39). KEEP flipCoins · pooled
resolveRoll · success/partial/value.
- SINGULAR vs FUNGIBLE falls out of type: character/relic carry name+story+chainIds;
  stackables carry qty, no identity. Value: singulars = mark; stackables = qty × unit value.
- LIABILITIES = NEGATIVE STACKABLES (debt/evidence/mess as kind tags, negative value) that
  TRIGGER BAD EVENTS IF UNRESOLVED — the trigger is the STORY ENGINE: an unresolved liability
  eventually spawns a hostile lead/event (the collector arrives; the evidence surfaces).
  Plugs the "debts never bite" dead mechanic found in the 100-day test. Prototype mechanism:
  per cycle, each liability older than N cycles has p% to spawn its collection lead.
- Migration order: type-tag injection → slot requires[]/wants[] generalization → gold stack
  merge → relic class + room item slots → chainIds to BaseCard → liability event trigger.

## §11 — INJURY *(⚠ scope updates: §16-F5 — injury AI-judged on ANY outcome, decoupled from tier, no risky flag; §19 — DEATH ignored in prototype, no death-cap/extend-buildings)* ✅ LOCKED 2026-06-14 (#39)
Implements the `injury` negative term in §10 (`coins = … − injury`).

**ONE generic injury** — NOT per-attribute (designer: multiple injury types = overkill). A single
temporary negative tag on a unit, measured in **TIERS** (each tier ≈ one merc-day). U = a great
build's coins at level L (§10); `V_base(level)` = the per-merc-per-cycle value (ECONOMY).

- **Acquisition — AI judges, engine counts.** On a quest **partial or failure**, the **AI resolution
  decides the injury SEVERITY: `none / low / med / high`** (and narrates the wound in prose). The
  **engine maps the band → TIERS** (rolls within): **low 1–2 · med 3–5 · high 6–9.** No separate
  `risky` flag — the AI only wounds when the fiction warrants it (a failed raid, not a failed
  negotiation). On success: no injury.
- **The bite:** a **FLAT coin penalty on ALL of the unit's rolls** = **tiers × ~0.2·U(L)** (steep —
  ~5 tiers ≈ a whole great-build's worth off every roll; coins floored at 0). A wounded unit still
  deploys, just worse at everything.
- **Stacking:** new injuries **add tiers** to one running total (no per-type bookkeeping).
- **Death:** total tiers **> CAP (base 10) → death.** Deploying a wounded unit risks *more* tiers
  (worsening toward the cap) → "pull them out or lose them." **Building upgrades raise the cap.**
- **Healing:** default **rest in bed = 1 tier / 2 days** (idle, unavailable) · **infirmary room →
  1 tier / day + raises the death cap** · a **further room upgrade unlocks PAY-GOLD healing**
  (≈ tiers × daily value to clear tiers instead of idling).
- **Monetary value:** injury = a **negative-value tag = tiers × V_base(level)** (the merc-days lost)
  → a wounded roster is a real gold/productivity drag (the gold/time SINK we wanted).
- **Out of scope:** CON does NOT resist injury (it stays a normal tested attribute).

**Fort hooks (→ #36):** a medical room line — *infirmary* (faster recovery + cap raise; may carry a
heal-skill occupant slot so healers have a job) and a higher *upgrade* that unlocks pay-gold healing.

Goals hit: I1 stakes · I2 roll-coupled · I4 gold-sink + medical rooms · I5 recoverable · I6
escalation/death. (I3 "CON's job" — dropped, out of scope.)

## §12 — FORT ROOM CATALOG (historical; superseded by §18–§19 — ⚠ mentions of "2 prestige pools"/"death cap" are pre-revision) — #36
(Builds on FORT.md's spatial model: side-view cells, 1 room/cell, 2 prestige pools. Will consolidate
into FORT.md in the lean transform.)

GOAL — a **BIG room set so progression is SMOOTH**: there's always a meaningful next thing to build
(fixes the 100-day "prestige wall / nothing left to build" gap). Deliverable = a **TABLE of the
expected build order** (the rough sequence a player constructs over a campaign) — each row: room ·
when (early/mid/late) · what it gates/unlocks · gold cost · prestige contribution. The order ties to
the **PRESTIGE MATH** (rooms are what prestige is computed over).

ROOMS MUST COVER the now-locked hooks:
- **dice/build (§10):** BEDROOMS — a unit rests/levels/focus-trains there; bedroom comfort caps level.
- **injury (§11):** INFIRMARY (faster recovery + raises death cap; maybe a heal-skill occupant slot)
  + a higher MEDICAL upgrade unlocking pay-gold healing.
- **relics (§7):** rooms with ITEM SLOTS that want tags (fit-click + prestige).
- **economy:** construction = a gold sink; theme rooms → prestige → leadTier (content gate).

OPEN (walk next session): (a) the **capability-set STEER** from designer — which functional rooms
exist + what each unlocks (recruiting/tavern · holding cells · training · medical line · workshops ·
theme/prestige rooms · housing); (b) the room LIST (functional / theme / housing); (c) the
**build-order / progression TABLE**; (d) per-room gold cost + prestige contribution.

⚠ FOLLOW-ON: **PRESTIGE MATH** needs its own planning pass (formula / curve / thresholds; FORT.md has
it 🟡 open) — do it AFTER the room catalog (rooms define what prestige sums over). Tracked as #41.

---

### §12.1 — BRAINSTORM POOL (2026-06-14, ⏳ NOT LOCKED — pending region pass)

KEY INSIGHT (the catalog spine): **most rooms are *feature/menu GATES*.** A room unlocks a game
function — a menu, a capability, or a repeatable-quest faucet. Rooms fall into **4 kinds**:

**A. Feature / menu unlockers** (build once → unlocks a menu or capability)
- **Map room** — unlocks **quests**. The game's FIRST mandated build (onboarding spine).
- **(Lead room)** — unlocks the **leads** menu.
- **Tavern** — unlocks the **new-recruits** menu.
- **Dungeon** — unlocks the **captive-list** menu (view captives you hold).
- **Holding cell** — unlocks the **new-captives** menu (acquire/select new captives).
- **Ransom/slaver office** — unlocks **ransom / sell captive**.
- **Mess hall** — unlocks the **merc list / details** menu.
- **Storage** — unlocks the **relic / item list** menu.
- **Market** — unlocks **buy/sell stackables**.
- **Oracle / seer room** — unlocks **quest success %** display.
- **Library** — unlocks **NPC roster / lore** menu.
- **Workshop / forge** — unlocks **craft/reroll** menu (⚠ FUNCTION DEFERRED — build the room, wire the
  actual crafting/reroll mechanic later).
- (CUT: focus chamber — FOCUS assignment is a BASE game function, not a room.)

**B. Capacity rooms** (build many → each +N to a cap)
- **Merc bedrooms** (1/merc; comfort gates that merc's level-cap; holds their gear).
- **Your bedroom** (= same as a merc bedroom but for YOU; gates YOUR level-cap — the player is a
  leveling character too).
- **Dungeon cell** (each +captive capacity).
- **Infirmary** (heal speed + raises death-cap; slottable heal-skill occupant sets speed) →
  **Hospital** upgrade (pay-gold instant heal, expensive — the §11 pay-gold room).
- **Warehouse** (consumable / stackable stockpile cap).

(CUT this pass: treasury/vault, bathhouse, chapel, kitchen, structural stairs/corridors.)

**C. Repeatable-quest FAUCETS** (unlock a recurring quest type — ⚠ **region-scoped, multiple
versions**; depends on the REGION pass)
- **Training hall** → catch-up / level quests.
- **Scouting room** → repeatable lead-gathering quests.
- **(Recruiting post)** → repeatable get-new-recruit quests.
- → each has a **per-region variant** (Scouting: Desert / Coast / Mountains…). ← blocked on regions.

**D. Prestige gates + prestige-only / theme rooms** (⚠ DEFERRED — discuss AFTER the region pass)
- **Grand hall / throne room**, etc. — big-cost landmarks that dump prestige + unlock TIERS of other rooms.
- Pure **theme/display** rooms (trophy hall, garden, shrine, gallery, menagerie…) for prestige.
  ← this is where the count balloons toward 50–100 (theme variants + tiered upgrades).
- NOT YET DESIGNED — comes after regions, alongside the PRESTIGE topic below.

**STILL-OPEN ROOM TOPICS (after regions):**
- **ROOM SLOT ASSIGNMENT** — how cards/occupants slot into rooms (e.g. heal-skill merc in infirmary
  sets speed; relics in theme rooms; captives in cells). Unify with the relic/slot grammar (§7).
- **PRESTIGE** — what prestige is computed over + what it gates (leadTier? room tiers?). Feeds #41
  prestige math. Kind-D rooms can't be finalized until this is settled.

**Torture chamber — RESOLVED (keep).** Concern was AI refusal. Probed gpt-5-mini (v3 narrative
model) 2026-06-14 with escalating-darkness quest prompts L1→L6 (raid → capture → ransom → **torture
to break captive** → enslaved labor → maiming): **all 6 COMPLIED, zero refusals.** So torture
chamber is safe to ship. Mechanic: a captive must be **broken → `obedient`/`trained` tag** before it
can be slotted to work. (Impl note for v3: gpt-5-mini spends reasoning tokens — set generous
`max_completion_tokens` / low effort, else empty `finish=length` responses.)

SCOPE: ~15–20 distinct *capability* rooms; 50–100 total reached via theme variants + tiered
upgrades. **Prototype target = ~half.** Build-order spine falls out naturally: Map room (quests) →
lead room → bedrooms/infirmary → capacity/faucets → prestige gates.

ORDER FROM HERE (designer-set 2026-06-14):
1. **REGION pass** (#42) — faucet rooms (C) multiply per region; quests carry `location`/`unlockedLocations`.
   Plan regions (count · unlock-by · identities).
2. Back to rooms: **ROOM SLOT ASSIGNMENT**, then **PRESTIGE** (what it sums over / gates),
   then **kind-D prestige gates + theme rooms**.
3. Finalize the region-scoped faucets + the **build-order TABLE** + per-room cost/prestige.
4. **PRESTIGE MATH** (#41).

---

## §13 — REGIONS (design IN PROGRESS, started 2026-06-15) — #42

Formalizes "location" into a real progression axis. **"location" as a separate mechanical concept is
DROPPED** — there is ONE mechanical unit, the **REGION**; everything finer (a village, a ruin, a
named NPC) is a **lorebook entry** = pure flavor/consistency, no mechanics (lorebook = its own pass,
#43, AFTER this). The old `Lead.location` becomes just a name drawn from / appended to the region's
lorebook. `GameState.unlockedLocations` → `unlockedRegions`.

### Goals
1. **Progression spine** — regions unlock over time (a sequence/graph) → steady "new place" dopamine
   + structures the level/difficulty curve (unlock outward → higher-level content).
2. **Variety / identity** — each region biases its **quest pool · recruit types · landmarks** so it
   *feels* different and recruiting there yields different units (ties to hierarchical pools #31 +
   race/background `appearOdds`).
3. **Consistency** — content within a region stays coherent via the lightweight seed + emergent
   ledger (the lorebook, #43).
4. **Two clean layers** — MECHANICAL region (engine: gates, level band, pool weights) kept separate
   from FLAVOR (AI lorebook/prose). Engine owns numbers, LLM owns prose.
5. **Room hook** — regions scope the faucet rooms (§12.1 C); reaching/unlocking a region is a build act.

### The mechanical region bundle (per region)
| field | does |
|---|---|
| `levelBand [min,max]` | the level range of its leads → **the difficulty ladder** |
| `poolWeights` | biases recruit/captive/cast generation (race appearOdds, background mix, tag leans) — the *variety* engine |
| `unlockGate` | the prestige (or level) threshold that makes it **buildable** |
| `seed` | 1–2 anchor lore facts (name, theme, a landmark) → handed to the lorebook (#43) |
| faucet rooms | its scouting / training / recruiting variants (§12.1 C) |

### Unlock flow (ties regions to the room loop)
region **locked** → reach its **prestige gate** → becomes **buildable** → build its **scouting room**
(gold) → its leads + faucet quests flow. Progression is *earned* (gate, can't rush) **and** a *build
act* (gold sink, agency) — matches DESIGN.md "prestige unlocks new content" + the faucet-room model.

### The region list (✅ LIST locked 2026-06-15; bands/order tunable)
| # | Region | Faction | Base band |
|---|---|---|---|
| 1 | **Western Forests** (start) | elf | L1–8 |
| 2 | **The City** | human | L6–16 |
| 3 | **The Drowned Coast** | lizardman | L12–22 |
| 4 | **The Highlands** | wolfman | L18–28 |
| 5 | **The Underdeep** | NONE (a place, not a people — monster/hazard quests, no native recruits) | L24–34 |
| 6 | **The Outskirts** (endgame, **off-map**) | mixed / monstrous | L40 → **L50** |

- 4 of 5 mapped regions map 1:1 to the race roster (human/wolfman/elf/lizardman, TAGS.md). Underdeep
  has no faction. Bands **overlap** (smooth — open a region, do its low end immediately, no wall).
- **The Outskirts = SHARED** single off-map endgame region (NOT per-region). The **endgame buildings
  are the KEYS to it** (§ cap model below). It's the L50 endgame everyone funnels into.

### Cap model (reconciled with §10 + injury)
- Normal merc cap = bedroom **comfort** (`cap = 3 + 0.9×comfort`), **soft ~40, no hard cap** (§10/FORT).
- **Endgame building (one per region)** = a region capstone; building them are the **keys** that open
  the shared **Outskirts** and lift the ceiling **40 → 50** (the sanctioned way past the soft cap, for
  both content level and the mercs pushed there). Dice **verified to L50** (§10).

### Unlock structure ✅ locked 2026-06-15 — shallow GRAPH (not a strict line)
- **Main spine:** Forests → City → Coast → Highlands (each gates the next).
- **Underdeep = optional BRANCH** — a "place, no faction," hangs off the spine (unlockable mid-game
  from the City or Coast), not a mandatory step. A side path.
- **The Outskirts = convergence** (endgame), gated by the keys below.

### Outskirts keys ✅ locked 2026-06-15 — ALL region endgame buildings
- The Outskirts opens only when **every mapped region's endgame building is built** ("master the whole
  map → go beyond it"). Each endgame building also lifts its own region to L50, so all-keys = whole map
  at L50 + Outskirts open. One clean capstone goal; keeps every region relevant into endgame.
- **Prototype:** ship fewer regions (first 3–4); the all-keys rule scales down to whatever ships.

### STILL OPEN (deferred to their own passes):
- (c) exact `poolWeights` per region — needs hierarchical pools (#31).
- (d) per-region scouting-room + endgame-building COSTS / prestige gates — ties to PRESTIGE MATH (#41).

### NEXT: LOREBOOK (#43) — the flavor layer for these regions (seed + emergent ledger), then back to
rooms (slot assignment → prestige → kind-D) → build-order table → prestige math.

---

## §14 — LORE & CONTEXT-RETRIEVAL ("relevant-object" system) — #43 (design IN PROGRESS, 2026-06-16)

The lorebook's CORE problem is **context selection**: at quest-genesis about a focal entity (e.g. a
unit Alex), feed the LLM the RELEVANT entities/lore (Alex's brother Bob, his birthplace region, a
life-changing past-quest memory + a few RANDOM seeds for spark) WITHOUT feeding the whole growing
world. Designed via a 3-angle deep dive (primary architecture + alternatives red-team + codebase
grounding), 2026-06-16.

### Grounding facts (reshape the problem)
- **No relation graph exists today** — "Alex's brother Bob" is only a substring in a chain's bible
  prose; the only typed links are `chainIds`/`focalCardIds`. The typed-edge graph is THE new build.
- **A crude version already ships**: `gatherPoolCast()` feeds a RANDOM sample of 3 roster chars into
  genesis. The real ask = replace random with **relevance**.
- **World is small (~10–40 entities)** + reproducibility matters → This is **relevance-ranking over a
  small set**, NOT an information-retrieval problem. (Determinism model = §16: engine math seeded, AI
  outputs persisted, nothing re-derived on reload.)

### CONFIRMED decisions (2026-06-16)
1. ✅ **Unified `LoreNode` base** — characters/relics/places/factions/sagas share one shape (extends
   CARDS.md "everything is a Card"). **Lore is a LAYER over entities, not a separate store**: a
   character is ONE object = gameplay Card + LoreNode (same id, two views). Some nodes are lore-only
   (places, factions, dead NPCs).
   ```
   LoreNode { id, type(character|relic|place|faction|saga),
              blurb,    // SHORT ≤~25 tok, byte-stable, prompt-cacheable
              dossier,  // LONG — evolving living record
              edges[],  // typed relations
              ...gameplay data (gameplay entities only) }
   ```
2. ✅ **Memory = EDGE, not node** — `Alex —scarred-by→ Bob`, annotated with a one-liner + pointer to
   `Chain.log[beat]` (dereference for full). Relation is first-class; no bible duplication.
3. ✅ **Evolvable lore** = stable identity (blurb + birth tags + origin backstory; ~immutable,
   cacheable) vs living dossier. **REFINED (validated 2026-06-16):** the dossier/blurb are NOT a
   stored growing blob — they are a **bounded top-K RENDER over (stable identity + salience-ranked
   memory-edges)**. Memory-edges are the source of truth; the dossier is a derived, cached projection.
4. ✅ **Retrieval pipeline** = deterministic ranked recall + thematic seed **+ dossier render**;
   size-gated **nano LLM selector** (validated, kept — F1 0.89); **NO embeddings/tool-use yet**.

### PURPOSE (validated, E5b)
The system exists for **CONTINUITY** — recurring entities stay consistent with established canon. Its
value is NOT single-genesis polish: blind test showed feeding edge-context → canon-consistency **1.00
vs 0.55** blurb-only (a blood-feud rival rendered at 0.2 without it). The North Star, demonstrated.

### Edge model (the one genuinely new structure)
`RelEdge { id, from, to, type, salience 0..1, core?, lastCycle, blurb?, sourceChainId? }`, directed
w/ inverse table; `GameState.edges[]` + a built-on-load adjacency index.
- **Type = a fixed `EdgeType` ENUM** (rival-of · scarred-by · bonded-by · owes · saved-by · kin-of ·
  betrayed-by · served-with · born-in · member-of · …) handed to the AI. **+ explicit DIRECTION
  convention** (`from` = the state-holder; symmetric types → alphabetical-first id). Validated E4b:
  enum + convention → valid-ids 5/5, direction 4/5, type-in-enum 5/5 (vs 2/5 direction without).
- **Salience / decay:** `effectiveSalience = base · 0.97^(cycle−lastCycle)`. **CORE memories
  (AI-flagged `core:true`, or importance ≥ ~0.8) are PINNED — never decay** (REQUIRED, E3b: under an
  event-flood, decay-all retained **0/9** defining memories; pinning retained **8/9**). Non-core that
  decay below the floor → flagged **inactive** (NOT deleted — see §16 F8 soft-delete).
- **Append + SUPERSEDE, never delete** (a betrayal stays true after a later rescue — both true; the AI
  superseded `betrayed-by → sacrificed-for`, never removed). **Soft-delete only** (§16 F8): superseded
  status edges + below-floor memories go **inactive** (hidden from AI recall, still player-readable);
  nothing is ever hard-deleted.
- Created by: engine-cheap (co-deploy → `served-with`, birth → `born-in`), genesis write-back, and
  **resolution** (the outcome → memory-edges; validated E-test: clean `{from,to,type,blurb}`).

### Retrieval pipeline — ≤ 2 LLM ROUND-TRIPS (implementer: JOIN queries wherever possible)
1. **Recall** (engine, deterministic, ranked, ZERO tokens) — replaces random `gatherPoolCast`:
   candidates = top edge-neighbors by effectiveSalience (**1–2 hop, NO recursive expansion**) +
   recency + a few SEEDED thematic wildcards (tag/keyword overlap, not embeddings). Cold-start =
   today's behavior. Candidate row carries the **edge-relation phrase** (why it's relevant) so the
   selector can judge from blurbs alone.
2. **Genesis round-trip** (gpt-5-mini, ONE call) — full dossiers for picked + blurbs for the rest →
   **bible + write-back (relevantIds / newEntities / newEdges) in a SINGLE response.** Write-back is
   folded in — never its own call.
3. **Selector** (gpt-5-nano) — the ONLY extra round-trip, and only when candidates > ~8; else skip
   and feed all blurbs into genesis. Validate ids (drop unknown / strip `id=` prefix); deterministic
   top-K = the reproducibility fallback.
→ So genesis path = **1 call (small world) or 2 calls (large world)**. **Resolution = ONE batched
   call** updating ALL affected lores' dossiers + emitting all edges together (validated E-test: one
   nano call handled 3 entities + 3 edges). **Implementer: batch/join every query you can.**

### Validation summary (experiments, 2026-06-16)
E1 retrieval selector F1 **0.89** (vs feed-all .67, random .52) · E2 salience std **0.054**, clean
core/mid/trivia separation, 5/5 ordering · E3b **pinning required** (decay-all 0/9 → pin 8/9) ·
E4b edges enum+convention valid 5/5 / dir 4/5 / enum 5/5 · E5b continuity **1.00 vs 0.55**.
All mechanisms run on **gpt-5-nano** (cheap) except the genesis bible (gpt-5-mini).

### Pushed back / DROPPED
- "location" as a mechanical concept (region = sole mechanical unit; §13).
- **Embeddings / vector store** — infra overkill at this scale; tag/keyword overlap covers the
  "thematic spark" deterministically. Park for thousands-of-entities scale.
- **Agentic tool-use mid-generation** — breaks the cached single-JSON-schema harness + latency +
  non-determinism + ≫2 round-trips. Park for when the graph outgrows the prompt.

### Implementability
Builds on `gatherPoolCast`, `GenesisInput`/`GenesisOut`, `Chain`/`CharacterCard`. New = the RelEdge
store + the dossier-render step. Cold-start degrades to exactly today's shipped behavior. OPEN items
(1)-(4) from the prior pass are all RESOLVED above (node change = render from salience-ranked edges;
candidate vs full contents = edge-phrase blurb vs evolved dossier; relevance = engine edge-graph 1–2
hop; new lore + memory = genesis write-back + resolution memory-edges, YES we want memories).

---

## §15 — SLOTTABLES, FIT & PRESTIGE (unified model) ✅ CONFIRMED 2026-06-21 — #36/#41 *(⚠ numbers + slot-kinds superseded: k/bands/archetypes → §20; slot kinds → §18 generic accepts; comfort rename → §18)*

Grounding: the shared primitive ALREADY exists in code — `overlap(have,favored,clashing)` (economy.ts)
already feeds BOTH quest coins (`coinsFor`) AND room prestige (`roomPrestige` w/ saturating band).
So this is reconciliation + gap-closing, not greenfield.

### (1) ONE prestige computation — comfort is not special
There is a single prestige formula. **Comfort** = the prestige of a merc's OWN bedroom (target = that
merc's tags) → feeds THAT merc's cap. **Global** = the SUM of prestige over theme rooms → unlocks
buildable room-types. Same formula, two aggregations. Comfort = `roomPrestige(bedroom)`.

### (2) Shared SLOT / SLOTTABLE (structural fix — DO IT)
Promote `Room.displayCardIds` → typed slots, symmetric with `QuestSlot`. Both Quest and Room are
**Slottables**:
```
Slot { index; accepts: CardClass[]; requirement: open|must-be<id>|must-have<tag>; filledBy? }
QuestSlot = Slot + { tested:{attribute,favored,clashing}, groupId? }   // quest-only
RoomSlot  = Slot + { kind: display|occupant|captive|owner }            // room-only
Slottable { id, slots: Slot[] }
```
ONE `place(card, slottable, idx)` (validates accepts+requirement), one fill-rule, one fit call. Reuse
`QuestSlot`'s requirement union verbatim — no second grammar. Fixes the "rooms enforce nothing" gap.

### (3) Shared FIT primitive (no duplication)
`overlap(cardTags, wants, clashes)` → signed, tier-weighted (matching +favoredBonus(tier), clashing
−clashPenalty(tier)). **QUEST:** `coins = attribute + overlap(…) − injury` → dice → success/partial/
fail. **ROOM:** `raw = adjacency · Σ_slots slotBase[kind]·overlap(…)` → saturating band → prestige
(DETERMINISTIC, no dice). `wants` = quest slot's favored skills OR a room's theme tags.
⚠ **RULE (prevents the one real fork):** keep `overlap` RAW/tier-scaled; §10's flat "0.5·U(L) if
favored skill owned" is a THRESHOLDING of overlap's sign done in the QUEST layer — never edit
`overlap` itself (rooms need the raw tier value). Body/bg tags fold into the attribute before the
attr term, never into `overlap`.

### (4) Upgrades ADD slots (⚠ reverses FORT.md "no upgrades" — fix FORT in the transform)
Every room starts at **U0 with ZERO slots**; each upgrade (gold) unlocks **+1 slot**. Upgrade-level
and fill-quality are two independent prestige levers (gold sink + loot sink) → smooth, always-something
-to-build.

### (5) Prestige formula + table
`raw = adjacency · Σ_slots slotBase[kind]·overlap(card,wants,clashes)` ;
`prestige = min + (max−min)·(1 − e^(−max(0,raw)/k))` (k≈14, floor at min). Band `[min,expected,max]`
per room-type; k tuned so typical stocking → `expected`. `max` reached only at full-upgrade+great-fill.
| upgrade | slots | empty | avg-fill | great-fill |  (theme band [3,16,36]) |
|---|---|---|---|---|---|
| U0 | 0 | 3 | — | — | |
| U1 | 1 | 3 | ~10 | ~16 | |
| U2 | 2 | 3 | ~16 | ~24 | |
| U3 | 3 | 3 | ~20 | ~29 | |
| U4 | 4 | 3 | ~24 | ~32 | |
Comfort: same formula, target=owner tags, band [3,18,40] → `cap = 3 + 0.9·comfort`. Global: Σ theme
prestige → gates `unlockPrestige`. The whole catalog+curve is designed by choosing each room's band.

### (6) Player THEME → AI-rolled tags (NOT static catalog)
A room has a player-assigned **THEME** (renovate = gold). The AI rolls the wanted-tag set FROM the
theme **ONCE** (at renovation — a discrete action, prompt-cache-safe) → stored on the room → engine
scores deterministically against the stored set on every move. e.g. theme a kitchen "candy" → AI rolls
`wants={skill:food, pers:kind, …}`+clashes. Player agency + AI flavor + engine determinism (the
"AI generates once, engine uses forever" pattern, same as §14 lore). Replaces "AI-adjudicated" wording.

### (7) Slot kinds
**display** (item/furniture/captive → prestige) · **occupant** (working merc → prestige + FUNCTION
boost, e.g. heal-skill → infirmary speed) · **captive** (capacity + prestige) · **owner** (bedroom;
sets target=owner tags, not scored).

### OPEN gap-decisions (next):
(a) **occupant FUNCTION hook** — `occupantEffect(occupants)→functionValue`, separate from prestige
(not built). (b) **forced negatives** — infestation/liability force-slotted must SUBTRACT prestige
(today off-theme tags score 0, not negative). (c) **cap-downgrade rule** — unslot a bedroom item →
comfort drops → merc now above cap: clamp/freeze/soft-overflow? (d) **capacity + acceptance
enforcement** (rooms enforce neither today).

### Implementability
`overlap` + `roomPrestige` (saturating band) + `levelCap=3+0.9·comfort` ALREADY in code (economy.ts,
fort.ts). Build = typed `RoomSlot[]` (replaces `displayCardIds`), upgrade levels (+slot each),
theme-roll storage, occupant-function hook. Also fix the duplicate/buggy `coinsForSlot` (missing
clashing) → call shared `coinsFor`.

---

## §16 — REVIEW RESOLUTIONS (independent review, 2026-06-21) ✅

Two independent reviewers checked the design before the doc-redo. CARDS.md confirmed **faithful** (8/8
locked facts). Cross-system holes resolved with the designer (F1–F6); F7–F8 still open (below).

**F1 — endgame cap reachability.** Cap is purely comfort-driven; its CEILING is the **bedroom comfort
band** (not hardcoded — the old "~34" was a band/coefficient artifact + the saturation asymptote).
Calibrate (#41) so a maxed *normal* bedroom → cap ~40; **endgame buildings RAISE the comfort band →
cap 50.** One mechanism, no out-of-formula bonus.

**F2 — tier on the roll.** §10 wins: owning the slot's favored skill = **flat 0.5·U, tier-BLIND on
the quest roll.** Tier instead pays off in **value** (§8 curve) + **room prestige** (overlap
magnitude — and only realizable once you've **upgraded + themed** the room to slot the card). Retire
§8's tier-scaled favored-*dice* bonus.

**F3 — prestige progression / no gold-rush.** **Theme rooms unlock GRADUALLY behind prestige
thresholds** (bounds how many rooms exist at a tier → no empty-room spam). **Prestige gates BOTH room
*unlocks* AND *upgrades*** (gold = the cost, prestige = the permission). MASTER CLOCK: a
**prestige → expected-level mapping** (#41) ties prestige to merc cap + the quest/region level you
face. Principle: **no single dominant strategy** — deep-fill few / spread many / bedroom-vs-theme all
viable; don't tune the math to force one route.

**F4 — Underdeep / Outskirts.** The Outskirts is keyed by the **4 SPINE regions'** endgame buildings
only (Forests→City→Coast→Highlands). **The Underdeep is OPTIONAL**, unlocking **between region 3
(Coast) and region 4 (Highlands)**; you may still build its endgame building for its own L50 content,
but it is NOT a key.

**F5 — injury.** **Fully AI-judged at resolution, DECOUPLED from the outcome tier** (any outcome;
typically failure, sometimes *none even on failure*; a costly partial may carry a minor one). AI picks
the severity BAND (none/low/med/high); the engine maps band → tiers → flat coin penalty. Engine
**value** (full/half/zero) and the partial's **liability** are independent channels.

**F6 — determinism + the lore/quest FLOW.** See below. F6 is resolved by the 3-producer model.

### The lore/quest FLOW (plain)
**What the world stores:** every character/relic/place is a **node** with a **blurb** (one line) + a
**dossier** (fuller). Between nodes are **memory-edges** ("Bob —betrayed→ Alex at Coldfen"), each with
an **importance**; big ones are **pinned** (stay), trivial ones fade. A **dossier is just the top few
memory-edges written up** — re-rendered, never a growing blob.

**New questline (genesis):** (1) engine **gathers candidates** instantly — focal's closest
connections by importance, 1–2 hops, + a couple of random wildcards. (2) AI **picks** the ~3–4 it
needs full detail on (one cheap call, only if many candidates). (3) engine hands picked dossiers +
the rest as blurbs to the **writer**. (4) writer **creates the bible** AND, in the same call, declares
which entities it used + any new people/places/edges. (5) engine **saves** the bible + new edges.
→ **≤ 2 AI calls** (picker + writer).

**Quest resolves:** the engine computes the **result** (seeded roll → outcome → value/rewards/XP/
prestige). **One AI call** wraps it — narration + dossier updates + new memory-edges + injury band.
Engine saves everything.

### Three producers of saved state (the determinism model)
1. **Engine (seeded RNG + fixed mappings)** — quest **outcome**, reward **VALUE**, XP/prestige/gold,
   band→tier conversions. Reproducible from the seed.
2. **AI (creative + bounded CATEGORICAL picks)** — prose, bibles, dossiers, edges, theme tags, reward
   **KIND**/label, injury **SEVERITY** band. **All saved as concrete fields** (a bible string, edge
   rows `{from,to,type,blurb}`, dossier lines, `injuryTiers`, `Room.themeTags`).
3. **AI picker** (selector "which candidates are relevant?") — **discarded**; its only effect is the
   writer's output, which is already saved.

**Principle: engine owns NUMBERS, AI owns FLAVOR + categorical picks** — the AI never emits a raw
number (gold, DC, tier); it picks a category/band and the engine prices it. **Reload re-runs NO AI
call** — every AI effect is baked into the save (bible, edges, dossier, injury tiers, theme tags).
"Determinism" = engine math is seeded; AI outputs are persisted; nothing is re-derived.

### F8 — SOFT-DELETE ONLY (resolved 2026-06-21)
**Nothing in the lore graph is ever truly deleted.** Every memory + edge is append-only with an
**`active` flag**. **Active** → fed to the AI (recall/context). **Inactive** → **hidden from the AI**
(token saving + avoids contradicted facts) but **still saved, readable by the player** (the full
history). Becomes inactive when: a memory **decays below the floor**, or a **status edge is
SUPERSEDED** (`captive-of`→freed, `member-of`→defected). This **replaces** the earlier "engine GC
deletes decayed edges" — it's mark-inactive, never delete. (Memories are what players browse; edges
less so — same rule for both.)
- (F7 dossier-ossification — DROPPED as premature detail; revisit only if playtest shows it.)

---

## §17 — DOC-REDO COVERAGE CHECKLIST (so no core decision is dropped) — #44

Doc-redo is POSTPONED until the remaining DECISIONS land (catalog #36, prestige math #41, + the open
gaps). When we resume the redo, every core decision below MUST be reflected in its target doc. Source
of truth for each = its GENERATION_FLOW section (§8–§16). ✅ = doc already rewritten.

**CARDS.md ✅ DONE** — Card+CardSlot concept · attrs STR/DEX/INT/CHA/CON · growth+focus (no talents) ·
the roll (§10) · injury intrinsic (§11) · MARKED value · prestige-via-CardSlots hook · tags are 20-tier.

**FORT.md ✅ DONE** — CardSlots + slot kinds · UPGRADES-ADD-SLOTS (reverses no-upgrades) · prestige by
effect (bedroom→cap sole / non-bedroom→global) · global gates unlocks AND upgrades · theme rooms
gradually unlock · player-theme→AI-rolls-once→engine-scores · saturating-band formula + upgrade×fill
table · region faucet + endgame-building hooks (comfort-band lift, 4-spine Outskirts keys).

**GAME_STATE.md ⏳** — prestige by EFFECT, NOT "two symmetric pools" (bedroom→cap sole effect /
non-bedroom→summed global gating unlocks+upgrades) · CardSlot placement (location = slot-ref when
slotted; else roster/inventory/limbo/staged) · live-recompute on slot change · the 3-PRODUCER save
model (§16: engine seeded numbers / AI flavor+categorical persisted / picker discarded; reload re-runs
no AI) · SOFT-DELETE lore graph (active flag; inactive hidden from AI, player-readable) · injury =
intrinsic tiered state · `unlockedLocations`→`unlockedRegions`.

**QUESTS.md ⏳** — QuestSlot = CardSlot + {tested,groupId} (one Slot concept) · the roll = §10 ·
reward-FIRST (engine generates value bundle at quest birth; AI proposes KIND+label, engine grants) ·
injury AI-judged at resolution, decoupled from tier (F5) · partial=half+liability / failure=0+AI-injury ·
lore retrieval feeds genesis (recall→size-gated nano selector→genesis w/ write-back folded; ≤2
round-trips) · leads region-scoped (location = a lorebook name, not a mechanical unit).

**ECONOMY.md ⏳ (stale, F11)** — 20-tier GEOMETRIC value curve `6·1.9^(t−1)` (DROP old 5-tier
common/uncommon/rare/legendary) · DROP rollTalents · MARKED value (card.value=target; tags=substance,
may diverge) · injury value = tiers×V_base · reward-first bundle · debt = negative gold (vs liability).

**LORE — new doc or §14/§16 promoted ⏳** — unified LoreNode · memory=EDGE (salience; CORE pinned
never-decay; append+SUPERSEDE; enum type + direction convention; SOFT-DELETE active flag) · dossier =
bounded top-K render over salience-ranked edges · retrieval pipeline (≤2 round-trips, batch/join) ·
3-producer determinism · PURPOSE = continuity (1.00 vs 0.55).

**TAGS.md / PROMPTS.md / UNIT_GENERATION.md ⏳ (stale)** — attribute names → STR/DEX/INT/CHA/CON
(kill physical/agility/perception/willpower) · 20-tier · growth+focus not talents · archive superseded.

**Cross-cutting principles to preserve everywhere** — engine owns NUMBERS, AI owns FLAVOR + bounded
CATEGORICAL picks (never a raw number) · no single dominant strategy · prestige = master clock
(prestige→expected-level mapping, #41) · F1 endgame raises comfort band→50 · F2 roll tier-blind
(tier→value+prestige) · F3 gradual prestige-gated unlock · F4 Underdeep optional/4-spine keys ·
F5 injury AI-judged decoupled · F6 3-producer determinism · F8 soft-delete.

**Decision sections (source of truth):** §8 tags · §9b vocabulary · §10 roll · §11 injury · §12 rooms ·
§13 regions · §14 lore · §15 slottables · §16 resolutions (F1–F8).

---

## §18 — ROOM MODEL UNIFIED: comfort → one benefit + CAPTIVE LABOR ✅ CONFIRMED 2026-06-22 — #36

Refines §15/§16-F3. Supersedes the display/occupant slot-kind split and "all non-bedroom prestige sums
to global."

### One number, one benefit per room
```
comfort(room) = band-curve( Σ overlap(slotted cards' tags, room theme) )   ← the ONE number
benefit(room) = benefitCurve( comfort )                                     ← ONE benefit, typed per room
```
- **RENAME:** the per-room fit-derived number = **"comfort"** (every room, not just bedrooms).
  **"Prestige"** = the GLOBAL progression currency only.
- **One benefit channel per room — NO double-dipping:**
  - **Theme rooms** → benefit = **+global PRESTIGE** (that is ALL they do; the prestige generators).
  - **Merc bedroom** → benefit = the owner's **level cap**.
  - **Functional rooms** → benefit = their **unique bonus** (infirmary heal speed, scout lead quality,
    market prices…) — and **NOT** global prestige.
- Everything is `overlap` → comfort → per-RoomType benefitCurve ("prestige multiplier"). Engine-owned.
  All curve numbers → #41.

### Slots are GENERIC + the CAPTIVE-LABOR loop
- **CardSlot is the one generic concept** (quests and rooms both have CardSlots). The old room slot
  "kinds" collapse into the slot's **`accepts` list**; the only special slot = a bedroom's **owner**.
- Each upgrade = **+1 generic slot**; a room slot accepts **items OR obedient captives** (both scored
  by the same `overlap` vs the room theme). ~3–6 slots/room via upgrades (grand late rooms up to ~8).
  No display-vs-occupant split, no authored slot-ladder.
- **THE LOOP:** capture → hold (cells) → **break** (torture chamber → `obedient` tag) → **station in
  rooms** → comfort ↑ → benefit ↑. **Captives are core loot** — every room is a collection puzzle
  ("find a gorgeous singer for the music hall") → the FUN + game-length engine (keep hunting better
  fits region after region, re-theme + upgrade all campaign).
- **Mercs are NOT stationable** — mercs quest; their fort presence = their own bedroom (owner slot).
  (Merc stationing later = one `accepts` flag if ever wanted.) Exceptions via `accepts`: **cells** =
  captive-only (raw/unbroken ok — holding, not working) · **bedroom** = owner + item slots.
- Staffing example: a kitchen wants `skill:food` — a captive cook or a copper cauldron both fit; the
  cook's rarer tags fit better. A well-appointed infirmary (items + a broken healer) heals faster —
  one rule, no exceptions.

### ⚠ §17 checklist impact — CARDS.md + FORT.md need a RETOUCH in the doc-redo *(✅ DONE 2026-07-03 — retouches landed in the doc-redo)*
Both were rewritten before this refinement and now carry superseded bits: CARDS §2 room slot kinds
(display/occupant/captive/owner → generic accepts + owner), CARDS §5 / FORT §3 "non-bedroom prestige
sums to global" (→ only THEME rooms feed prestige; functional rooms' comfort → unique benefit),
FORT §2 occupant→function hook (→ benefit = curve(comfort), captive labor not merc staffing), FORT §6
open-gaps list (occupant-hook resolved by this section). Also propagate the comfort/prestige RENAME
everywhere.

### §18.1 — last two gaps closed (2026-06-22)
- **Forced negatives** (infestation/liability in a room slot) — **DEFERRED, out of prototype scope.**
  The force-slot concept stays canon; its comfort bite gets designed when liabilities ship.
- **Cap-downgrade** (unslot/re-theme drops a bedroom's comfort below the owner's level) — **keep
  level, can't grow**: levels never regress; the merc just can't level further until comfort recovers.

---

## §19 — ROOM CATALOG: classified (walkthrough 2026-06-22) ✅ — #36 step 1

Every room is one of two SPECIES: **pure gate** (build once; no comfort/slots/upgrades) or **comfort
room** (slots via upgrades; comfort → ONE typed benefit, §18). Class: PROTO / AFTER / NOT.

**Core gates:** Map room (PROTO gate, FIRST build → quests) · Lead room (PROTO gate → leads menu;
leads come from quests + lead-HUNTING quests, NOT restocks) · Mess hall (PROTO gate → merc list) ·
Storage (PROTO gate → item menu; **NO capacity mechanics anywhere, ever** — inventory unlimited) ·
Market (PROTO comfort → buy/sell prices) · Library (PROTO gate → lore/NPC menu) · Oracle (PROTO
comfort → odds precision, U1 coarse → exact) · Chronicle room (PROTO gate → browse memory/lore
archive) · Workshop (AFTER gate → craft) · Quartermaster (NOT).

**GREAT HALL (PROTO)** — the TIER SPINE: upgradable T1→Tn, **NO slots**; each tier = gold + a
global-prestige threshold; **each tier unlocks the next tier of buildings** (the tech tree made
physical; the master clock embodied).

**Housing:** **Bedroom — ONE type** (owner = you OR a merc; yours pre-built day 0; merc bedrooms
grant +1 roster slot each, yours doesn't) PROTO comfort → owner's level cap · Bunkroom (PROTO
starter; bedroom-less mercs at a low cap floor) · Tavern (PROTO gate → new-recruits menu) · Veteran
hall (NOT — bedrooms grant roster) · Guest quarters (AFTER).

**Captive line:** Dungeon (PROTO gate → captive list) · Holding cell (PROTO gate → new captives) ·
Dungeon cell ×N (PROTO **capacity-only**: no comfort/upgrades, build more; MULTIPLE captives/cell) ·
Ransom office (PROTO comfort → prices) · Torture chamber (PROTO comfort → break speed) ·
Interrogation room (PROTO comfort → LEADS only) · Slave pens (NOT — stationed captives live in their
work slot; cells hold raw + idle) · Auction stage (NOT).

**Training rooms (tag-teaching family): NOT PLANNED entirely.**

**Medical:** Infirmary (PROTO comfort → heal speed ONLY) · Hospital = its top tier (PROTO; building
it gates PAY-GOLD instant heal; comfort → small +prestige) · **DEATH IS IGNORED IN PROTOTYPE** (trims
§11: no death at max tiers — unit is just long-term out; no death-cap, no cap-extending buildings) ·
Trauma sanctum / Apothecary (NOT).

**Region rooms (× 4 spine + optional Underdeep):** Scouting lodge (PROTO **pure gate** — opens the
region + its repeatable lead-hunting quests; quest QUALITY comes from slotting the right units into
the quests, not room comfort) · Recruiting post (PROTO pure gate — region recruit quests) · Training
hall (AFTER — catch-up XP quests) · Endgame building (PROTO **pure landmark**, no comfort/slots;
prestige+gold gated; raises comfort band → cap 50; 4 spine = Outskirts keys).

**PRESTIGE rooms (one family, benefit = +global prestige EXCLUSIVELY — no passive gold, no upkeep,
no second channel).** Concrete TYPE + player-applied STYLE theme (renovation; AI rolls wants ONCE
from type+style — revises §18's abstract "shells"). Tiered by canvas-breadth × loot-fit confidence:
- **TIER 1 (bulletproof):** Dining hall · Kitchen · Smithy · Garden · Gallery · Trophy room · Hall of
  arms · Shrine · Music hall · Menagerie · Treasure vault · Curiosity cabinet
- **TIER 2 (solid, narrower):** Crypt · Gambling den · Bathhouse · Reading room · Brewery · Stables ·
  Farm plot · Bakery · Theatre stage · Feast hall · Greenhouse/fountain court · Aviary/falconry/
  kennel · Tapestry/portrait halls · Map chamber/observatory
- **TIER 3 (niche/filler):** tea parlor · perfumery · silk lounge · opium den · steam room · apiary ·
  herbarium · jewel room · clockwork room · bone chapel/idol vault/ritual circle/séance · duelling
  ring · beast pit · banner/memorial/champions' halls · hall of mirrors · hedge maze · rooftop
  terrace · gallows yard · head-spikes · plague memorial · taxidermy · antiquities · aquarium ·
  laundry/scullery · smokehouse · granary/mill · sewing room · tannery · well
- How many per stage ships = decided in the PRESTIGE pass (#41 step 2/3).

**CUT:** faith/dark choice axis (chapel-vs-dark-altar — invents new mechanics; shrine/crypt cover the
fantasy as prestige rooms) · structural walls/defense (no fort-attack system).

NEXT: #41 step 2 — prestige MATH skeleton (master clock prestige→level map · comfort→cap curve +
endgame band lift · Great-Hall-tier threshold curve · band archetypes · k · benefitCurves), then
step 3 assignment (bands/costs per room → build-order TABLE → simulate the timeline).

---

## §20 — PRESTIGE MATH SKELETON (⏳ concept BLESSED 2026-06-22; numbers pending step-3 sim) — #41

GOALS: G1 master clock (P→L→region) · G2 GH tiers = acts · G3 cadence (always a next build) · G4
comfort→cap tracks expected L · G5 multiple viable paths · G6 loot-driven (captives/artifacts; gold
can't cross a gate) · G7 verifiable by simulation.

**TIME BUDGET:** 100+ h ≈ **2,000 cycles** (~3 min/cycle). **15 GH tiers** ≈ ~130 cycles (~5–7h)
each. Region arcs of ~3 tiers: Forests T1–3 · City T4–6 · Coast T7–9 · Highlands+Underdeep T10–12 ·
endgame→Outskirts T13–15. Levels ≈ +3/tier (L1→50, dice-verified). Prototype = T1–T6 (~30h, cuttable
to T1–T4). Tier count NOT locked — collapse to 12 if sim shows drag.
**CONTENT ENGINE (multiplicative):** rooms × loot strata (each region opens a higher §8 tag BAND →
every built room re-fillable better) × per-merc tracks (~15 bedrooms/caps/chains) × infinite AI quests.

**THREE GROWTH AXES per room** (why 4–6 slots serve 15 tiers):
1. **Slots** — max 6; allowed upgrade depth gated by GH tier: T1-2→U1 · T3-5→U2 · T6-8→U3 ·
   T9-11→U4 · T12-13→U5 · T14-15→U6 (~one step per region arc).
2. **Fill quality** — a matched card's fill score = its §8 tag BAND: band 1→1 · 2→2 · 3→4 · 4→8
   (mild ×2/band; NOT the gold curve). Loot stratum at tier ≈ band 1 @T1-4 · 2 @T5-8 · 3 @T9-12 ·
   4 @T13-15 (aligned with region arrivals — the structural argument FOR 15 tiers).
3. **Count** — more rooms per tier (~2–3 new prestige rooms + 1–2 functional/upgrades per tier =
   the ~130-cycle cadence budget; a build every ~30–40 cycles, fills between).

**DERIVED per-room expectation** (no hand-authored per-tier tables):
`raw(T) = slots(T) × bandScore(stratum(T)) × adjacency(~1.2)` → `comfort = min+(max−min)(1−e^(−raw/k))`.
Standard room (band [2,—,60], k=20): T2≈5 · T5≈14 · T8≈19 · T10≈37 · T13≈54 · T15≈57 (asymptote 60).
Room variety = **3 archetypes** scaling the band: **Minor ×0.5 · Standard ×1 · Grand ×2**.

**GLOBAL:** P(T) = Σ over the growing roster (illustrative: T2≈15 · T5≈100 · T8≈250 · T10≈550 ·
T13≈1,100 · T15≈1,500 — super-linear: count↑ × per-room↑). **GH threshold(T+1) ≈ ~70% of expected
P(T)** — crossable by any strategy mix (breadth / depth+refill / great-fit) without perfection.
Old-room band-1 drag is deliberate (re-filling old rooms = within-tier activity); sim must check
thresholds don't require 100% re-fill sweeps.

**BEDROOM/CAP:** same derived table → `cap = 3 + 0.9×comfort`: ~16 @T5 (City L6-16 ✓) · ~33 @T10
(Highlands L18-28 ✓) · ~40 @T14 (normal band max ~45) · **endgame lift = band max +~10 → cap ~50**.

**STEP 3 SIM (next):** assign archetypes+costs to the §19 catalog → simulate 2,000 cycles under 2–3
player policies → verify: ~130-cycle tier cadence · cap-vs-region-L lockstep · thresholds crossable
by all policies (within ~20%) · no wall/stall · prototype T1-T6 pacing. Iterate numbers until green.

### §20.1 — SIM-VERIFIED (step-3 pacing sim, 6 iterations, 2026-06-22) ✅ shape verified

RESULT (v6): all 3 policies (breadth 60/25/15 · depth 25/25/50 · bedroom-lean 30/45/25 mixes of
build/bed/upgrade) reach **T15 at ~2,220–2,250 cycles ≈ 110h** (target 100h+ ✓), spread <1.5% (G5 ✓),
per-tier 46–320c around the ~130c budget with no stall >2.5× (G3 ✓), end cap ≈ 50 (G4 ✓), prototype
T1–T6 ≈ ~750c ≈ 35h ✓. **KEEP 15 TIERS** (no need to drop to 12).

DESIGN FINDINGS the iterations forced (all load-bearing, must survive into implementation):
1. **Loot band must grow CONTINUOUSLY within a tier** (ilvl follows quest level) — a step-function
   band deadlocks the clock at saturation (v1: 665c wall at T6→7 with P frozen).
2. **Cap→loot coupling is load-bearing**: loot band + gold derive from merc LEVEL ≤ cap ≤ bedroom
   comfort. Without it, skip-all-bedrooms is the dominant clock strategy (v3); with it, that
   strategy stalls at T8 with band-1 loot. Bedrooms are part of the master clock, not a side track.
3. **Gold income must scale ~1.09^level vs build costs ~1.32^tier** (i.e. income tracks
   vBase-like growth) — flatter income starves the late game (v5: 400-730c tiers, gold the binder).
4. **Loot rate grows with the roster**: ~0.4 → ~1.5 slottable drops/cycle across the campaign.
5. **Threshold fracs: 0.70 (T2–8) / 0.60 (T9+)** of expected P, with a live-correction factor
   (~0.77) — pure analytic thresholds overshoot because real fills lag the model.
6. Residual spikiness (T7/T13/T15 ≈ 2× budget) = per-tier frac tuning at implementation, not a
   shape problem.

VERIFIED PARAMETER SET (v6, the step-3 assignment baseline): bandScore 1/2/4/8 · slots≤6 depth-gated
(T1-2:1 · T3-5:2 · T6-8:3 · T9-11:4 · T12-13:5 · T14-15:6) · K=20 · adjacency 1.2 · archetypes
minor(1,30)/std(2,60)/grand(4,120), grand phases in 5%/tier from T7 (max 30%) · ~4 new prestige
rooms/tier · beds ≤ 2+tier (→15) · build cost 120·1.32^(T−1), upgrade 0.7×, GH 1.6× · income
10·1.09^(L−1)/cycle · loot 0.4+0.08·T (cap 1.5) · cap = 3+0.9·comfort, endgame band-lift → ~50.

NEXT: **step 3 ASSIGNMENT** — map the §19 catalog onto the archetypes (which room = minor/std/grand ·
per-room costs/unlock tiers) → the BUILD-ORDER TABLE → re-run the sim against the real catalog.

### §20.2 — STEP-3 ASSIGNMENT: catalog-tied sim, TWO INDEPENDENT AGENTS ✅ ALL CHECKS PASS (2026-06-22)

Two independent sim agents (A: 24 seeds, B: 32 seeds; 4 policies each incl. a greedy P-optimizer)
built the campaign sim against the REAL §19 catalog with an EXPLICIT random-fit model (per-drop
match/partial/dead rolls per room theme, best-of-portfolio placement, dead drops sold). Both PASS
every check; spot-verified live. Headline: **T15 ≈ 2,000–2,320 cycles (~100–115h)** · human-policy
spread 1.2–3.1% · prototype T1–T6 ≈ 790–840c (~40h) · caps clear every region floor · dead-drops
~33% act-1 → ~8% act-3 · **the greedy P-rush is SLOWER than human play** (cap→loot coupling holds
under attack — no degenerate strategy).

**CONVERGENT DESIGN RULES (both agents independently — treat as LOCKED-shape):**
1. **Thresholds = measured calibration × a hand-smoothed MONOTONIC ramp** (effective ~0.87–1.10 of
   the measured curve — the §20.1 0.70/0.60 fracs pace ~20% too fast under real fit). Auto-tuners
   oscillate/deadlock (threshold sits on a knee); calibrate-then-manual-ramp, in-engine at impl.
2. **Loot rate ≈ 30% LOWER than §20.1** (both cut to ~0.70×: ~0.29+0.06·T, cap ~1.05/cycle) — author
   drops/cycle from the slot+band growth budget; oversupply = dead-drop misery, not generosity.
3. **Early-tier P ASYMPTOTES are hard walls**: a threshold above what a tier's unlocks can produce =
   permanent deadlock (T1 asymptote ≈11 w/ 2 rooms; T2 ≈23). Rules: **≥3 prestige rooms by T1**
   (Garden→T1 adopted; Infirmary→T1 as early leftover-sink), thresholds < ~85% of tier-reachable P.
4. **Re-theming agency is REQUIRED**: the 2–3 newest prestige rooms tuned toward the loot stream
   (p_match 0.20→~0.45–0.55; renovation-cost 0.25×). p_match tuning alone cannot fix act-1 dead rates.
   Base fit p_match 0.20 / p_partial 0.30 kept by both.
5. **Functional rooms = leftover-fill sinks w/ REPLACEMENT staffing** (better staff swaps in), else
   they saturate after 1 fill and late dead rates blow the limit.
6. **Bedroom DEPTH drives the cap clock** (deepen the best bedroom, not build many); **cap-binding
   must be loudly player-visible** (sims needed a react-to-cap override or they stalled at T13+).

**Adopted retunes:** Garden→T1 · Infirmary→T1 · early prestige spread ≥3 by T2 · **grand archetype
costs 1.5–2× std** (else strictly dominant P-per-gold — B's find) · endgame buildings sequenced
T13–T15, each lifts the bedroom band (→cap ~50), 2× GH cost.
**Reference thresholds** (A/B agree ±15%; recalibrate in-engine): T2≈12 · T3≈23 · T4≈60 · T5≈88 ·
T6≈118 · T7≈230 · T8≈310 · T9≈350 · T10≈510 · T11≈650 · T12≈785 · T13≈1,030 · T14≈1,275 · T15≈1,500.

**THE BUILD-ORDER TABLE (median, bedroom-lean policy — the §12 goal deliverable):**
c0 Bedroom(own) · c2 Map room · c14 Lead room · c25 Mess hall · c35 Storage · c45 Scouting lodge
(Forests) · c55 Recruiting post (Forests) · c55-65 Infirmary · c65 Dining hall · c80 Kitchen ·
c90-105 Bedrooms #2-3 · c110 Garden · **GH→T2 ~c120-145** · c130-170 Tavern · Dungeon · Holding cell ·
c175 Bedroom #4 · c185 Trophy room · c200 Gallery · **GH→T3 ~c280** · c280-300 Library · Market ·
Ransom office · c300 Smithy · c310 Bedroom #5 · c360 Shrine · **GH→T4 ~c400** · c410 Chronicle · …
(each ~130-190c tier thereafter; T15 ≈ c2,100).

**Implementation notes (spec gaps the sims exposed):** (a) roster width must feed loot rate (more
mercs → parallel quests → drops; sims under-valued beds beyond the active squad — the real per-merc
cap + party model provides this, keep the coupling explicit); (b) hoard-for-GH windows are 40–80c of
nothing-to-buy → give a gold-reserve/wishlist affordance + always-available bed fills/renovations;
(c) T13–15 gold competition (GH vs endgame buildings vs region gates) needs a purchase-priority hint;
(d) cap model: sims used max/top-3 bedroom; real game = PER-MERC caps (richer, softens finding 6 but
someone's bedroom must still be deep).

**#36 + #41 = DONE.** The catalog+prestige stage is CLOSED. NEXT: resume the DOC-REDO per §17
checklist (GAME_STATE/QUESTS/ECONOMY/LORE/TAGS + CARDS/FORT §18-§20 retouch) → lean transform → v3.
