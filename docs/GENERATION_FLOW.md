# GENERATION_FLOW.md — how a saga/quest is generated (the canonical pipeline)

**Status: WIP DRAFT (2026-06-12) — being finalized item-by-item with the designer.**
Supersedes the scattered flow descriptions; QUESTS.md §"reward-first" 🔒 is the governing rule.
Each section below is marked ✅ agreed · 🔶 OPEN (decision pending) · 📌 current-impl note.

**RESUME POINT (for the next session): §9b PASS 2 — VOCABULARY WALK COMPLETE ✅ (W1–W18,
all groups, both card species + stackables). NEXT = task #30 IMPLEMENTATION** of the full
tag system (structure + all pass-2 vocabulary), migrating the old `tags.ts`/`economy.ts`.
See "§9b PASS 2" section for every locked word list, value model, and the minTier-drop /
value-weight (W7/W8) and uniform-depth (W7/W11/W16) mechanisms. Open ⚠: favored-dice vs
high-attrs scaling; band display names (parked, display-only). The §9b GROUP PASS is COMPLETE (see "§9b CONTENT WALK" +
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
    AUGMENTING enchantments — PLAN LOCKED, words next (W15): ONE per ATTRIBUTE EXCEPT
    intelligence (= magic, covered by the elemental set) → 4 augmenting enchantments
    mapping to physical · agility · charisma · perception (every attribute gets a
    relic-power path).
    Render: label-rendered "enchantment: fire (high)" (R5 exception). Value + odds: W15+.

W15. relic `enchantment` AUGMENTING words ✅ LOCKED (designer 2026-06-13 "yes") — 4
    augmenting enchantments, one per attribute (intelligence = the elemental set):
      physical → might · agility → swiftness · charisma → glamour (magical allure/charm)
      · perception → insight
    FULL ENCHANTMENT SET = 8: fire · earth · water · dark · might · swiftness · glamour ·
    insight. Distinctness: might (enchantment) vs muscular (body) vs physical (attribute);
    glamour (charm magic) vs beautiful (trait); insight (perception magic) vs lore (skill)
    — all clean (magical power vs descriptor vs stat). Every attribute now has a
    relic-power path.

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
   ⚠ REVISIT (designer 2026-06-13): flat favored-dice +1/+1/+2/+3 (+4 t20) won't scale —
   at high level (attr ~20) +2 is insignificant. Later: level-scaled band bonus, % of
   coins, or slower attribute growth.

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
- SINGULAR vs FUNGIBLE falls out of type: character/relic carry name+story+chainIds;
  stackables carry qty, no identity. Value: singulars = mark; stackables = qty × unit value.
- LIABILITIES = NEGATIVE STACKABLES (debt/evidence/mess as kind tags, negative value) that
  TRIGGER BAD EVENTS IF UNRESOLVED — the trigger is the STORY ENGINE: an unresolved liability
  eventually spawns a hostile lead/event (the collector arrives; the evidence surfaces).
  Plugs the "debts never bite" dead mechanic found in the 100-day test. Prototype mechanism:
  per cycle, each liability older than N cycles has p% to spawn its collection lead.
- Migration order: type-tag injection → slot requires[]/wants[] generalization → gold stack
  merge → relic class + room item slots → chainIds to BaseCard → liability event trigger.
