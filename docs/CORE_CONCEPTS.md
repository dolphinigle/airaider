# Core Concepts — AI Raider

**Status:** Locked synthesis (the load-bearing decisions). For the rationale behind each principle, see the individual design docs cited inline.

This is a **single-file bootstrap** of everything an AI (or a new collaborator) needs to know to reason about AI Raider end-to-end. Read this first; only descend into the detail docs (`RAID_DESIGN.md`, `HEROES_AND_GROWTH.md`, `GAMEPLAY_LOOP.md`, `FORT_AND_PRESTIGE.md`, `PROGRESSION_AND_PAYOFF.md`, `PROBLEM_AND_INHERITANCE.md`, `VISION.md`) when you need to dig into a specific subsystem.

Conventions used below:
- 🔒 = **Locked** principle. Do not reopen without strong reason.
- 🛠 = **Locked-shape / Open-numbers.** The shape is locked; exact coefficients deferred to balance pass.
- 🟡 = **Open.** Genuinely unresolved.

---

## 1. Vision in one paragraph

AI Raider is a single-player fortress-management game where the player builds a prestigious stronghold by sending heroes on raids that *they actually play*. The fort is the trophy case and economic engine (inherited from `aistronghold`); the raid is the moment-to-moment agency layer (newly designed). Heroes acquire mechanical identity through play, not stat sheets. AI writes all flavor (names, prose, fiction); the engine owns all numbers (stats, balance, outcomes). Target campaign length: **200+ hours**.

The remake exists to fix one specific problem in `aistronghold`: missions were auto-resolved, so heroes were interchangeable stat blocks and no relationship could form with them. AI Raider solves this by inserting a player-controlled raid layer between "pick a lead" and "see results."

---

## 2. The single most important rule 🔒

> **Engine owns numbers. AI owns flavor. They hand off via a numeric envelope.**

- **Engine (deterministic code)** owns: all numbers, balance, probabilities, gold/stat/level/threshold/reward amounts, all hard rules. Tunable in spreadsheets.
- **AI (generative model)** owns: all names, voices, prose, character lines, scenario flavor, *type* of reward, narrative consequences, hero personalities, tag *labels*.
- **Handoff = reward-as-budget pattern.** Engine declares a budget or constraint; AI fills it with meaning; engine validates the result.

Example: engine says *"this raid closed in band B, budget = 80 gold-equivalent."* AI says *"50g in a pouch + a 25g captive merchant + a 5g trinket — here's the scene."* Engine validates totals ±10% and commits.

Same pattern applies to: scenario thresholds, recruitment, loot generation, consequence narration. **This rule is universal.**

---

## 3. Universal design principles 🔒

1. **Cards-as-universal-abstraction.** Heroes, followers, equipment, scenarios (raid + errand + camp), captives, raid leads — every gameplay object is a card with a `type` field and a common shape pattern.
2. **Cards into scenario slots = the core agency action.** The player's primary verb in the raid (and most of the camp) is "drag this card onto that slot."
3. **Fiction-forward UI.** *Never show a menu when you can show a scene.* The roster is captains around the fire; the inventory is items on a blanket; the quest log is a hooded man arriving with news. Stats and modifiers appear *inside* the fiction (a `+3` next to a tag name in a sentence), never as the primary screen surface.
4. **No false choices.** *If a choice has a single dominant answer per actor, it's bookkeeping, not choice.* Collapse such variants.
5. **Prestige comes only from rooms.** Raids do NOT grant prestige directly. Raids grant *inputs* (followers, artifacts, gold, leads) that the player then *places* into rooms to make prestige. This forces engagement with both layers.
6. **Both layers are mandatory.** You cannot bypass the raid by optimizing the fort. You cannot bypass the fort by grinding raids. Both feed each other.
7. **AI generates flavor, not mechanics.** Restated for emphasis. Mechanics are deterministic and inspectable.
8. **All content types are hand-authored in JSON.** RoomTypes, ScenarioTemplates, ErrandTemplates, EquipmentTemplates — all declared in JSON and shippable/moddable. AI never invents content types or adjusts their mechanics. AI only generates: theme strings, names, prose, narration, tag labels (within engine-set tier/weight constraints).

---

## 4. The two-loop structure 🔒

```
┌─ CAMP PHASE (day cycle, slow, deliberate) ─────────────────────┐
│  Build/upgrade rooms · Assign followers · Display artifacts    │
│  Equip heroes (into their rooms) · Pick a raid lead · Launch   │
└──────────────────────┬─────────────────────────────────────────┘
                       ↓
┌─ RAID PHASE (3–5 scenarios, fast, tactical) ───────────────────┐
│  Player assigns hero-cards to scenario-slots, scene by scene.  │
│  Engine resolves Narrated Pool checks; AI narrates each line.  │
│  Climax scenario offers 2–3 distinct approaches.               │
└──────────────────────┬─────────────────────────────────────────┘
                       ↓
┌─ RESOLUTION ───────────────────────────────────────────────────┐
│  Loot, XP, new tags (incl. scar-origin), traumas, deaths.      │
│  Stories advance. New leads may appear. AI epilogue.           │
└──────────────────────┬─────────────────────────────────────────┘
                       ↓
                  (back to camp)
```

**Camp = day cycle.** Each day is a decision; no global "End Week" tick (that's an aistronghold artifact). The player allocates each hero to one action per day, then advances time deliberately. Idle heroes recover Fatigue passively.

**Raid = 3–5 scenarios.** Setup scenarios (1–3, single-approach) build momentum; **climax scenario** offers branching approaches; exit screen distributes loot. Within a raid the player makes ~10–20 decisions (slot assignments, approach picks).

**Rhythm:** slow (camp) / fast (raid) / cool-down (resolution). Same shape as Darkest Dungeon, FTL, Slay the Spire.

---

## 5. The raid resolution mechanic — Narrated Pool 🔒

For each scenario:

1. Engine declares a **threshold** (e.g. 12), the relevant **stat-pool** (e.g. "Cunning, or Wits as fallback"), and **outcome bands** (clean / partial / fail / catastrophe with consequences).
2. Player assigns 1–N heroes to the scenario's slots.
3. Each hero contributes: **(their stat) + (one of their tags' modifier)**.
4. The **engine** selects which of the hero's tags fits the scenario best — *the player does not pick tags*.
5. The **AI** generates one short narration line per contribution, citing the chosen tag.
   > *"Marcus knows this defile — same goat-track he used running stolen amphorae for old Calvus.* `road-bred (+2)`*"*
6. Total pool is compared to threshold; outcome band fires; AI generates a closing line.

**Wobble:** a deterministic ±2 variance, narrated as a story element ("the moon is bright tonight"). No hidden RNG that the player can't reason about.

**Why it works:** AI's single best fit — one cheap call per scenario, generating 4–5 lines of in-character story directly tied to engine math. No long-range coherence demand. Every roll is a micro-story.

---

## 6. Difficulty model — `required_level` + `difficulty_class` 🔒

Every raid scenario carries **two** difficulty numbers:

- **`required_level: int`** (1..~50) — the *power* axis. Sets the threshold's center.
- **`difficulty_class: enum { standard, hard, legendary }`** — the *optimization-pressure* axis. Sets the threshold's tightness coefficient.

| Class | Coeff | Meaning |
|---|---|---|
| Standard | 1.0 | Any hero at required_level with average tags clears |
| Hard | 1.3 | Needs OPTIMAL tag match at level OR over-level flex |
| Legendary | 1.6 | Needs over-level + tag match + best gear |

**Penalty rules:**
- Hero level ≥ required: no penalty from level. `difficulty_class` still tightens the threshold.
- Hero level < required: **−2 per level of gap** to that hero's contribution; also raises catastrophe-band chance.
- **No over-level penalty.** A level-30 hero can clear a level-5 errand — the opportunity cost (that hero is unavailable for real work) is the natural balance.

`difficulty_class` is NOT the dropped Easy/Standard/Hard/Lethal axis (that was a power duplicate of level). It's a separate *optimization-pressure* axis that lets high-level heroes legitimately "flex" through low-required-level legendary content if well-equipped.

---

## 7. Hero data model 🛠

```yaml
Hero:
  thingId, type='hero'
  # Identity (AI-owned, immutable)
  name, backstory, voice_profile: string
  # Stats (engine-owned)
  level: int                          # 1..no hard cap; soft cap ~40; realistic ceiling ~45
  xp: int
  attributes: {brawn, cunning, wits}  # range 2..6 start; +0.1/level avg growth
  # Tags (hybrid)
  tags: [Tag]                         # 3 starting + earned; soft cap ~10 active
  # Equipment (cards in personal room)
  equipped: { weapon: EquipmentCardId?, armor: EquipmentCardId?, rings: [EquipmentCardId] }
  # Transient (engine-owned)
  stamina: int                        # 0..3 in-raid charges
  fatigue: int                        # 0..N between-raid exhaustion
  status: enum { available, on_raid, wounded, traumatized, dead }
  # Renown, Relationships, History
  renown_tier: int                    # 0..3
  relationships: { heroId -> {shared_raids: int, bond_tag: string|null} }
  loyalty: int                        # 0..100
  history: [HistoryEntry]
```

**Levels (Locked: soft cap ~40, no hard cap):**
- L1–L6: early game (~10h play). Tutorial-to-competent curve.
- L6–L40: mid-to-late game. Most progression-feel here.
- L40+: post-cap drip. XP grows geometric; cosmetic level-number-go-up continues forever for beloved heroes.

**Per-level effects** (exact tables Open):
- Stat growth: avg +0.1/level.
- Tag modifier multiplier: `tag_mod × (1 + 0.02 × level)`.
- Equipment level gate: hero of level L can equip equipment of level ≤ L.

**Recruitment scales with camp prestige** (~`recruit_level ≈ prestige_tier × 2`). High-prestige camps attract pre-grown veterans, fictionally justified by AI backstory.

---

## 8. Tags — the core differentiator 🔒 (with 🛠 numeric tables)

Tags REPLACE the older "trait + ability + class + scar" tangle from aistronghold. Single unified mechanic, both mechanical AND narrative.

Examples: `legion-deserter`, `axe-and-shield`, `weatherproof`, `centurion-slayer`, `crypt-walker`, `burned`.

### Tag data shape

```yaml
Tag:
  label: string                   # AI-generated
  tier: int                       # 1..10 (engine, PoE-style)
  modifier: int                   # derived from tier
  weight: int                     # engine, drop probability
  min_source_level: int           # engine, gates rolls
  origin: enum { starting, earned, scar, equipment_granted, recruited }
  flavor: string                  # AI-generated
  earned_at: timestamp?
```

### Tier model — Path-of-Exile semantics

- **T1 = strongest modifier + lowest drop weight + highest source-level gate.** The "legendary mod."
- **T10 = weakest modifier + highest drop weight + no level requirement.** The "common mod."
- Lower number = stronger AND rarer (same as PoE affixes).

Approximate (Open balance numbers):

| Tier | Modifier | Drop weight | Sample sources |
|------|----------|-------------|----------------|
| T1   | +5       | very low    | endgame raid boss, P15+ camp, legendary scar |
| T5   | +3       | medium      | mid-game raid earned tag, P5 camp recruit |
| T10  | +0..+1   | very high   | starting peasant, rural origin |

### Tag origin (engine-owned enum)

- **starting** — generated at hero creation; rolls from low-tier pool.
- **earned** — added during play after an engine-detected notable deed.
- **scar** — special earned tag from catastrophic-band raid events. Often **mixed** (e.g. `burned`: +3 in fire scenarios, −1 in cold). The word "scar" survives only as this flag and as fictional flavor.
- **equipment_granted** — pushed by equipped equipment; removed when unequipped.
- **recruited** — high-prestige recruit's starting tag pool rolls higher.

### Ownership split

- Engine: tier, modifier, weight, source-level gate, when a tag fires in a scenario, fading.
- AI: label, origin sentence, narration line.

### Tag cap and fading

Soft cap **~10 active tags** per hero. Past the cap, engine demotes the least-fired tag to *inactive* (still on the record for AI flavor, no longer rolled). This is the only fading mechanic.

### Tags apply to all card types

Heroes, followers, equipment, rooms, scenarios — every card carries tags from the **same global pool** and the engine has **one** `tag_overlap_score()` function powering: scenario contributions, room prestige multipliers, equipment fit. (Stronghold's room-theme-compatibility loop is preserved through this — finding a follower whose tags match a room's theme is still the headline dopamine moment.)

---

## 9. Equipment 🔒 (principles) / 🛠 (deep room design)

**Locked principles:**

- Equipment **is a card** (cards-as-universal-abstraction).
- Equipment **lives in the hero's personal room** (Hero's Bedroom RoomType, width 1). The room IS the loadout — no per-hero inventory bloat.
- Personal bedrooms are **built like any other room** (pay gold, place into an opened cell). Heroes without a bedroom sleep in the shared Bunkroom and cannot equip anything.
- Equipment slot count **scales with bedroom level:**
  - L1 Quarters → 1 weapon slot
  - L2 Chamber → +1 armor slot
  - L3 Captain's Den → +2 ring slots
- Equipment uses **level, not tier.** A piece is "Centurion's Helm L18." Equippable by any hero of level ≥ piece level. Higher-level heroes wearing low-level gear is allowed.
- Equipment has **rarity** — `common / uncommon / rare / legendary`. (This is the *only* rarity word in airaider; scenarios use `difficulty_class`.)
- **Slot ceiling = weapon + armor + 2 rings = 4 pieces.** Rings predominantly grant tags; weapons/armor grant stats and sometimes tags.
- Equipment data **feeds AI narration.** When a scenario fires, equipped cards' names and flavor are in the AI prompt so prose can reference them (*"Drust hefts the named axe Iron-Tongue..."*).

**Data shape:**

```yaml
EquipmentCard:
  id, type='equipment'
  name, flavor, origin: string         # AI-generated
  level: int                            # ≤ hero level to equip
  rarity: enum { common, uncommon, rare, legendary }
  slot: enum { weapon, armor, ring }
  stat_bonus: { brawn, cunning, wits }  # nonzero for weapon/armor
  tags_granted: [tag]                   # nonzero for ring; sometimes weapon
```

**Open (smaller TODO now that the shape is locked):** exact upgrade costs per bedroom level (subject to balance pass), artifact transfer between rooms, dead-hero room inheritance (proposal: bedroom becomes a memorial niche, contributes small permanent prestige, may display one artifact).

---

## 10. Camp / Fort 🔒

**Inherited from aistronghold** (shape preserved):

- Singleton **Fort** contains **Rooms**.
- Each Room: `roomTypeId, level, theme (free-text), assignedFollowerIds, displayedArtifactIds`.
- **Theme** is a free-text label; AI derives compatible tags from it the first time. Followers/equipment with matching tags get prestige multipliers.
- **RoomTypes are hand-authored in JSON.** AI never invents room types or mechanics — only generates the `theme` string and narration flavor.
- **Prestige formula:**
  ```
  Fort Prestige = Σ Room Prestige
  Room Prestige = ( base_prestige(roomType, level)
                  + Σ follower.prestige × theme_multiplier(follower.tags, room.theme)
                  + Σ artifact.prestige
                  + retired_hero.prestige (if bedroom)
                  + hero_present.prestige × hero_bedroom_tag_match (if bedroom)
                  )
                  × adjacency_bonus                  # RoomType-pair pairs, capped ~×1.50
  ```

**Two prestige pressures, kept distinct:**
- *Theme-tag matching* — assigning followers whose tags overlap a room's theme into that work room. **Inherited core dopamine loop.** RNG discovery joy.
- *RoomType-pair adjacency* — placing the right rooms next to each other. **New layer.** Hand-authored, learnable. Each RoomType JSON declares which other RoomTypes give it adjacency bonus.

These don't overlap mechanically — placement is a designable strategy layer; follower matching is RNG joy.

**Airaider-specific spatial model (NEW):**

The fort is a **2D side-view cross-section** of a hill-fort. Always entirely visible (zoom out to see silhouette; zoom in to interact). No view switching.

- Cell coordinates: `(tier, x)`. `tier=0` ground; `tier>0` upper floors; `tier<0` cellars.
- Cells are **empty / opened / occupied**. Expansion = paying gold to open a cell adjacent to any opened cell. Cost scales (`BaseCost × Multiplier^N`). **No prestige gate** on cell expansion — pure economic pressure.
- **No tier names, no tier themes.** Tiers are spatial coordinates. AI uses raw spatial vocabulary ("above the hall", "the cellar's far end").
- Rooms occupy `width × height` rectangles:
  - Widths: **1, 2, or 3** (declared per RoomType in JSON).
  - Heights: **1** for almost all rooms; a small hand-authored set (~3) of monumental `maxCopies: 1` rooms are **height-2** (Great Hall, Reliquary, Cathedral-type endgame trophies).
- **Adjacency = RoomType-pair hand-authored bonuses.** Each RoomType JSON declares which other RoomType IDs grant it +X% prestige when adjacent (Kitchen↔Dining +25%, Library↔Scriptorium +20%, Armory↔Sparring Post +20%, etc.). **Not** generic theme-tag adjacency — placement strategy is designable and learnable. Late-game min-max layer: a Hero's Bedroom gains bonus when adjacent to room types that match that hero's tags.

**Housing and assignment (two separate mechanics):**

- **Heroes:** 1 Hero's Bedroom per hero, or 1 Bunkroom slot for un-roomed heroes. Bunkroom is the starter shared-housing RoomType.
- **Followers:** Total cap = Σ capacity of follower-housing RoomTypes (Servants' Quarters, Barracks, Common Room, ...). A housed follower may be *assigned* to a separate work room (Kitchen, Library, etc.) for theme-tag prestige. Housing room ≠ work room.
- **Captives:** Total cap = Σ capacity of Dungeon-type rooms. No work assignment; captives have ransom/sale/conversion value.
- **Equipment / artifacts:** Equipped in their hero's bedroom (per slot rules) or displayed in any room with `maxItems > 0`.

**Other airaider-specific changes:**

1. **Heroes can be retired into rooms.** Their prestige contribution = level + gear + history. A favorite hero you no longer want to risk becomes a fort centerpiece.
2. **Each hero can have a personal room (Hero's Bedroom RoomType, width 1).** Built like any other room (must pay, must place). Equipment slots unlock by bedroom level (L1=weapon, L2=+armor, L3=+2 rings). **Bedroom is a recruit-license:** a hero must have either a dedicated Bedroom OR a Bunkroom slot to be retained. The total bedroom + bunkroom slots = your hero roster cap (concrete spatial pressure, not abstract).
3. **Some rooms grant raid-side buffs** (e.g. Apothecary L3+ → start raid with N healing potions). Small, single-buff-per-category. The fort *matters* during a raid without auto-resolving it.
4. **No "End Week" tick.** Day cycle; wound/trauma healing is measured in raids-completed (not real time).

**Progression beats come from room-types unlocking at prestige tiers**, not from spatial unlocks. Target 20+ prestige tiers, each unlocking qualitatively new RoomTypes (Watchtower, Reliquary, Scriptorium, Forge, Throne Room, etc.) and new raid leads. Variety, not number-growth, carries 200+ hours.

| Band | Sample tiers | What unlocks |
|---|---|---|
| Survival | Hideout, Outlaw Den | Lone-traveler raids, caravan ambushes; basic RoomTypes (Hall, Bedroll Pit, Bedroom) |
| Mid-banditry | Brigand Hold, Bandit Lord | Villa raids, town strikes; Armory, Sparring Post, Apothecary |
| Warlord | Regional Warlord, Frontier Rival | Legion engagements; Watchtower, Scriptorium, Forge |
| Power-broker | Shadow King, Kingmaker | Assassination contracts; Reliquary (monumental), private Captain's Quarters |
| Empire-scale | Open Rebellion, Empire Challenger | Province campaigns; Throne Room (monumental), Cathedral (monumental) |

---

## 11. Errands 🔒

An **errand** is just a **scenario card** with two distinguishing properties:

1. **Long clock** — resolves over N days, not within a raid. Hero is committed for the duration.
2. **Auto-resolve** — engine runs the resolution at end-of-clock; no per-day player interaction.

Errands use the same Narrated Pool engine, same `required_level + difficulty_class` rules, same outcome bands, same AI narration. **Scenarios with a different clock, not a different system.**

Examples:
- *Patrol the trade road* — Lv2, 2d, gold + rumor chance.
- *Drink in town* — Lv1, 1d, Fatigue recovery + lead chance.
- *Train recruits* — Lv3, 3d, accelerates XP for new heroes.
- *Personal errand* — hero-specific, from backstory, may earn a new tag.
- *Run a protection racket* — ongoing, passive gold + raises local infamy.

This guarantees no hero is ever idle, feeds new leads into the raid loop, and gives AI more storytelling beats per campaign hour.

---

## 11b. Leads vs Story Beats 🔒

A **Lead** is a **cheap stub** placed on the job board so the player has many visible options without burning AI tokens on quests they won't pursue.

- **Lead = `{difficulty_class, reward_budget, region, expiry_days}`.** That's it — **no archetype, no hook, no prose** in the MVP. A lead is just an opportunity-with-numbers. UI displays as `Lead · {region} · L{dc} · ~{reward}g · {expiry}d`. 100% engine-generated, zero AI.
- **Pursue Lead** is a free, instant, zero-hero-cost action. It fires the AI quest-gen and turns the Lead stub into a real Quest (visible scenarios, NPCs, named loot, twists). **Assign heroes** is a separate decision made with full info on the now-visible Quest. **Pursued Quests expire fast** (~2 days) — natural rate-limiter against gratuitous pursuit.
- **Archetype categories are a future layer**, not MVP. If play reveals that the AI generates samey jobs (5 bandit ambushes in a row) or that players want tactical "I want a bandit-camp-shape job specifically" choices, *then* we add a hand-authored archetype enum back. Earn the complexity before introducing it.
- **Region is a string label for now.** A real region/world-geography system is a future design problem — flagged as a known headache.
- **The full quest content is generated AT COMMIT TIME.** Until the player commits a party, no scenarios, NPCs, named loot, or twists exist. This is the **only token-saving justification** for having leads as a distinct concept.
- **Commit-with-imperfect-info tension** is intentional but shifted: the player sees difficulty + reward magnitude + region on the lead board. **Pursuing** a lead (free, instant, zero hero cost) fires the AI and produces a real **Quest** with visible scenarios. **Assigning heroes** to the Quest is a separate decision made with full info. The "imperfect info" gamble is now on the *pursue* step — am I willing to spend a slot in my quest tray (and the ~2-day quest expiry clock) to find out what this lead actually is? **Lead-scouting** (a cunning-hero action) can reveal 1–2 hints about the lead before pursuit.
- **Lead-finding** is a separate action category — errands like *drink in town*, *patrol the trade road*, *scout a village* roll **new leads onto the board.** Action → fills board (vs lead-scouting: action → reduces uncertainty on a known lead). Both serve idle cunning/social heroes; both are scenario cards. Without a lead-finding cadence the board would go empty and the camp loop would stall.

**Story Beats** are the deliberate exception: quests that exist because of a prior outcome, character arc, or fort milestone. They **bypass the lead-stub flow** and are **fully generated at trigger time** (player intent is high; story coherence requires it). They can appear on the board next to leads (UI parity) but are full Quest objects under the hood. Engine distinguishes via `lead.kind = stub | story_beat`.

Full spec: see `RAID_DESIGN.md` § Leads.

---

## 12. Long-horizon targets 🔒

Every campaign should always surface **1–3 active "big targets"** with a future deadline (e.g. "pay-chest moves north in 9 days"). These give the player something to plan around across many days. Without a visible big target, the camp loop drifts into busy-work.

### Starting Campaign Arc 🔒

Every campaign **opens with** a long-horizon target on day 1 — the **Starting Campaign Arc** — rooted in the heroes' own situation, not abstract progression. This is the gold-motivator of the early game, the thing that makes the player *want* to grind raids.

- **Hero-rooted:** the arc's premise should reference the starting party's backstory tags or shared situation (deserter warband, exiled house, etc.).
- **Multi-milestone:** broken into 3–6 visible steps (e.g. "5 working rooms", "first monumental built", "fort prestige 50").
- **Open-ended completion:** finishing it triggers a **Story Beat** (a fully-generated continuation quest — see §11b) rather than ending the campaign.

Example: this playthrough's arc is *"Rebuild the Wreckhouse Fort"* — Drust's old legion deserters holed up in a half-collapsed hill-fort. Milestones drive gold spend toward rooms, which feed prestige, which unlocks bigger leads, which feed gold. The arc closes the early-game loop.

---

## 13. Two-tier exhaustion 🔒

**Stamina (within a raid):** 3 charges per hero per raid; 1 per scenario assignment. At 0, that hero is *spent* for the rest of this raid.

**Fatigue (between raids):** raid raises participant Fatigue (+2 base + 1/scenario). Must be unwound at camp (sleep/drink/duty/rooms). High-Fatigue heroes refuse dangerous jobs or take penalties.

This makes **roster depth a real strategic resource** — you NEED 6–10 captains, not 3 — and pulls the inherited fort loop directly into raid-side decision-making (rooms are unwinding facilities).

---

## 14. Reward economy 🔒

| Reward type | Used for | Rarity model |
|---|---|---|
| Gold | Build/upgrade rooms; the only construction & operating resource | Bulk, common |
| Artifacts | Display in fort OR equip on heroes | Tag-randomized, tiered rarity |
| Followers | Assign to themed rooms | Tag-randomized, tiered rarity |
| Hero XP | Hero progression | Scaled to raid difficulty |
| Earned tags (incl. scar-origin) | Hero individuality | Event-triggered, not chosen |
| Story progression | Future raid leads | Narrative-driven |
| New raid leads | Future content | Event/story-driven |

**Reroll budget pattern (inherited):** lead's `rewardValue` is a reroll budget; higher-value leads generate more candidate drops and keep the best. Engine of rarity.

**The locked constraint:** raids generate *inputs* to the prestige machine; they do not generate prestige directly.

**Single resource (locked):** **gold** is the only tracked construction/operating resource. No wood, stone, or other resource bars. Errand variety comes from fiction (timber runs, escorts, debt collection) and from which hero tags shine — they all pay gold. Specific scenarios may demand named *plot-token items* (e.g. "3 cured planks for the gate"), but those are quest objects, not a global bar.

---

## 15. Death and trauma 🔒

- **Default mode:** downed hero in a successful raid = wounded (long heal). Downed in a wipe = dead unless rescued.
- **Hardcore mode:** always-on permadeath.
- **Mercy mode:** dying heroes are merely retired.
- Dead heroes get a Hall-of-Fallen entry — loss → fort trophy, on-pillar.
- **Traumas** are temporary mental states from bad raid events; healable at fort (Chapel, Apothecary, Tavern). Distinct from scar-origin tags (which are permanent).

---

## 16. Heroes vs Followers vs Captives 🔒

| | Heroes | Followers | Captives |
|---|---|---|---|
| Count | 6–10/campaign | many | flow-through |
| Role | go on raids; named; cards played into scenario slots | rank-and-file; assigned to camp duties; passive effects | inventory item; sellable / ransomable / breakable into followers |
| Growth | full level/tag/equipment system | minimal stat (prestige value, trait/tag matching) | none |
| Death | hurts | replaceable | n/a |

**Promotion** (follower → hero) is rare and meaningful; a celebration moment.
**Retirement** (hero → room occupant) is a meaningful late-game choice.

---

## 17. Hero stats and contribution formula 🛠

```
contribution = base_stat(L)                         # attribute value + level growth
             + best_tag_mod × tag_multiplier(L)     # engine picks best-fitting tag
             + equipment_stat_bonus
             - under_level_penalty                  # 2 × (required - L), if L < required
                                                    # floored at −3
```

Scenario threshold:
```
threshold = expected_contribution(L) × slot_count × difficulty_coeff + situational_modifier(±2)
```

Exact coefficients live in `airaider/balance/*.csv` (to be created):
- `level_table.csv` — base_stat by level, tag_multiplier by level, XP curve.
- `tag_tiers.csv` — modifier and weight per tier, min_source_level.
- `scenario_templates.csv` — threshold templates by level and difficulty_class.

---

## 18. What the player must always see (UI contract) 🔒

For any scenario, the UI must communicate:

1. The scenario as a **scene** (fiction first).
2. Each slot's threshold and stat-pool.
3. Each available hero's relevant stat AND a *preview* of which tag will likely fire.
4. Outcome bands' consequences in plain language.
5. Available stamina and current Fatigue per hero.

If the player can't answer *"who do I send and what happens if it goes wrong?"*, the UI has failed.

---

## 19. The progression triangle 🔒

```
       Prestige (fort)
         ↗         ↘
        /           \
   Raid Leads ←── Hero Levels (raids)
        ↘              ↗
         Loot drops
```

- Prestige unlocks higher-tier raid leads.
- Raid leads test heroes (skill challenge).
- Heroes earn XP and new tags from raids.
- Loot feeds the fort.
- Loop tightens at every tier.

**Player skill is part of the difficulty curve** — a skilled player can attempt higher-tier raids earlier; a struggling player can grind a tier safely. Same shape as Slay-the-Spire ascensions or Darkest-Dungeon expedition difficulty.

---

## 20. Endgame 🔒

Endgame is what the player makes of it. Three suggested terminal goals:

1. **Maxed fort** — every room built and themed; near-perfect follower matches everywhere.
2. **Hall of Heroes** — a roster of richly-historied veterans displayed/retired into the fort.
3. **All stories concluded** — every active narrative thread resolved.

None are gated by a final boss; they are personal completion states. An optional capstone raid may exist (Open).

---

## 21. Non-goals 🔒

- Not a roguelike — heroes are persistent, named, expensive to lose.
- Not an idle/auto-battler — if the player isn't playing the raid, the game isn't happening.
- Not a narrative adventure — stories are flavor framing for mechanical events.
- Not multiplayer — single-player, save-anywhere.
- Not a pixel-perfect tactics game — combat is tactical but readable, fast, and forgiving.

---

## 22. Glossary (terms used precisely)

- **Card** — any gameplay object with a `type` field and shared data shape pattern (hero, follower, equipment, scenario, captive, lead).
- **Scenario** — a scene played by assigning hero-cards to slots; resolved by Narrated Pool. Includes raid scenarios, errands, camp scenarios.
- **Slot** — a position in a scenario into which a hero-card is dropped.
- **Tag** — a labeled tier-modifier carried by any card type; fires in scenarios for +N to the pool; AI cites in narration.
- **Tier (tag)** — T1..T10, lower = stronger + rarer (PoE-style). Engine-owned.
- **Rarity (equipment)** — common/uncommon/rare/legendary. The *only* rarity word in the game; scenarios use `difficulty_class` instead.
- **`required_level`** — power-axis difficulty number on a scenario.
- **`difficulty_class`** — optimization-pressure-axis (standard/hard/legendary) on a scenario.
- **Lead** — pre-raid hook the player chooses to pursue.
- **Raid** — sequence of 3–5 scenarios + climax.
- **Errand** — scenario card with long clock + auto-resolve.
- **Stamina** — in-raid hero charges (3 per raid).
- **Fatigue** — between-raid hero exhaustion.
- **Renown** — engine tier (0..3: Unknown/Known/Famous/Legendary) on each hero.
- **Camp prestige tier** — global tier (target 20+) gating content unlocks.

---

## 23. Big TODOs (not yet designed)

- **Balance numbers.** First-pass CSVs in `airaider/balance/`.
- **Earned-tag triggers.** What engine events award new tags, AI prompt structure, frequency.
- **Per-level reward model.** Auto-stat-up vs every-5-levels pick — proposed but not locked.
- **Concrete prestige tier ladder.** Target 20+ tiers; need content design naming each tier and what RoomTypes/leads it unlocks.
- **Errand catalog.** ~10–15 errand templates.
- **Scenario content.** What scenarios exist, written.
- **Tag content pool.** Initial AI prompt seeds for tag naming.
- **RoomType catalogue.** The full JSON list of room types, their widths/heights/costs/effects.
- **Monumental room set.** The ~3 height-2 endgame rooms (proposed: Great Hall, Reliquary, Throne Room) — exact effects and unlock tiers.
