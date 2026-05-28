# Canonical Design — Airaider

**Status:** Canonical. Last refreshed after the 200-day validation sim. Supersedes `CORE_CONCEPTS.md`, large portions of `RAID_DESIGN.md`, and `HEROES_AND_GROWTH.md` (each has a SUPERSEDED banner explaining what's still in force).

This is the single document that captures the current, locked state of Airaider's design. It is intended to be a complete enough load that a new contributor (or a new AI agent) can read this file + `AGENT_BOOTSTRAP.md` and reason about the design without consulting any other source.

> If you only have 60 seconds, read `AGENT_BOOTSTRAP.md`. If you have an hour, read this. If you need history or rationale beyond what's here, descend into the legacy docs.

---

## Conventions

- 🔒 **Locked.** Do not reopen without strong reason.
- 🛠 **Locked-shape, open-numbers.** The mechanism is locked; exact coefficients deferred to balance pass.
- 🟡 **Open.** Genuinely unresolved.

---

## 0. Elevator pitch

**Airaider** is a single-player **mercenary-fort management game** with **AI-driven scenarios** and **deep character identity** through a tag-loot system. You play a mercenary commander (the *avatar*) who built a small fort. You hire mercs, take contracts, build rooms, capture humans, display them for prestige, and rise through prestige tiers as your fort becomes regionally — eventually kingdom-level — notable.

The dopamine comes from three intertwined loops:

1. **Recruit lottery** — refresh the tavern's recruit pool; find god-tier tag combinations (common → uncommon → rare → legendary)
2. **Tag-synergy** — assemble parties whose tags resonate with the scenario, triggering crits and god-combo cascades
3. **Captive/artifact** — extract loot from defeated humans (ransom, sell, display, recruit) and rare equippable items

Around these loops, the AI generates scenarios that resolve via the **Sultan-coin** mechanic, narrates outcomes that fit each merc's locked tag identity, and seeds multi-day arcs from legendary-tier tags.

---

## 1. Core pillars 🔒

| Pillar | Decision | Why |
|---|---|---|
| **Character > Engine** | Story/character is the foundational dopamine driver, NOT engine scaling | Decided Day 100 post-pivot. Stops over-investing in spreadsheet complexity. |
| **AI-native** | Scenarios are LLM-authored; the design provides STRUCTURE for the AI to fill | Lets the game produce infinite content without scripted-content debt |
| **Engine owns numbers, AI owns flavor** | Top-tier architecture principle | Every system has engine-owned fields (deterministic) and AI-owned fields (narration within numeric envelope) |
| **Mercenary terminology** | "Mercenaries," not "heroes" | Sets tone — pragmatic, mortal, replaceable |
| **Permadeath real** | Mercs die permanently; the loss is real | Validated 2× in sim. Drives dopamine on BOTH sides. |
| **Avatar = wage 0** | The player-avatar costs nothing to maintain | Prevents the "wage spiral" bug we hit in early sim |
| **Tag identity is precious** | The full tag vocabulary (~50-100 base tags) is small enough for the AI to see as token vocabulary | Keeps AI prompts coherent; makes each tag mechanically and narratively meaningful |
| **Campaign length** | 200+ days target (~10 hours playthrough) | Validated end-to-end this sim. |

---

## 2. The locked systems

### 2.1 Sultan-coin resolution 🔒  *(was SIM_BIBLE §17 / supersedes Narrated Pool)*

Every non-trivial scenario resolves via a **Sultan-coin flip**:

- AI authors a **target** (narrative goal: "rescue the merchant," "convince the baron"), NOT a numeric threshold
- Roll **N coins** where N = number of relevant attributes/tags brought to bear
- Resolution falls into one of **4 hidden bands** (catastrophic / unfavorable / favorable / catastrophic-favorable) revealed at flip time
- Bands are **HIDDEN pre-flip** — the player commits to the scenario, then sees the result
- 🟡 All-heads / all-tails crit triggers still need formal lock (currently hand-resolved per scenario)

**Why this works** (validated): "Author the target, not the threshold" lets the AI write authentic narrative goals; the engine owns the resolution math; the player gets clear stakes without seeing arbitrary numbers.

### 2.2 Level / Tag / Attribute integrated model 🔒 *(canonical, supersedes prior conflicts)*

| System | Role | Behavior |
|---|---|---|
| **Level (= Veterancy, DD-style)** | Per-unit progression vehicle | Earned via contracts. PRIMARY: gates which quests unit can take. SECONDARY: tiny attribute boost per tier (infinite scaling without veterans dominating). |
| **Tag (PoE-style unified)** | General loot/identity | ONE vocabulary covering personality, gender, physicality, background, profession, religion. Rarity × roll quality tier (T1-T5). Mostly fixed at hire. |
| **Attribute** | Natural giftedness | 5 scalars. Base roll at hire. Tags add/subtract. Slight veterancy growth. Read by scenario resolution. |

**Critical insight**: Tags are NOT earned through experience (that would feel forced). Tags are NATURAL AFFINITY. The AI generates flavor-text bios that REFLECT tags, not the other way around.

### 2.3 The five attributes 🔒 *(final)*

| # | Attribute | Active Face | Defensive Face |
|---|---|---|---|
| 1 | **Physical** | strike, climb, haul | endure, withstand |
| 2 | **Agility** | dodge, stealth, sleight-of-hand | evade, escape |
| 3 | **Intelligence** | scheme, learn, decipher | see through deception |
| 4 | **Charisma** | persuade, lead, charm | resist persuasion |
| 5 | **Willpower** | intimidate, torture, deceive (active assertion) | resist interrogation, hold oath, stay cold |

Every attribute has **both faces** (active + defensive). *Rejected alternatives for #5: Mettle, Steel, Conviction, Cruelty — AI-legibility was decisive.*

### 2.4 Attribute descriptor scale 🔒 *(mundane, NOT rarity-loaded)*

```
Poor (1) / Below Average (2) / Average (3) / Above Average (4) / Strong (5) / Exceptional (6) / Peerless (7+)
```

**Rarity vocabulary (common/uncommon/rare/legendary) is RESERVED FOR TAGS ONLY.** Attributes use mundane descriptors so that a "high strength" merc reads as a real person, not a loot drop. Legendary recruits get legendary by *tags*, not by hitting Peerless attribute (though they often do both).

🛠 Stat ceiling above 6 — one sim character hit C9 (Peerless+). Need formal off-band scaling rule.

### 2.5 Tag system constraints 🔒

- **ONE base tag per concept** — `muscular`, NOT `muscular` + `brawny` + `strong`
- **Tier system handles intensity** — T5 (Toned) → T1 (Herculean) for `muscular`
- **MOST tags are NEUTRAL**, especially personality
- **Mutex groups** prevent contradiction (see §2.8 below)
- **NO experience-earned tags** — the AI writes earned-flavor in bios, not into the tag schema
- **Negative tags exist** — `sickly`, `lame`, `ugly` mark cheap-tier recruits
- **Tag vocabulary cap** — ~50-100 base tags. Small enough for AI to see as a token vocabulary.

### 2.6 PoE tag-tier naming pattern 🔒

Each base tag has 5 descriptor tiers (T5 → T1, weakest to strongest). Example for `muscular`:

```
T5 Toned → T4 Athletic → T3 Strong-Built → T2 Brawny → T1 Herculean
```

T1 rolls are rare; T5 rolls are common. Combined with tag-rarity (common/uncommon/rare/legendary), a recruit can have e.g. a `bg:priest` (rare base tag) at T2 roll (rare quality) — both AI and player recognize this as a top recruit.

🟡 Full ~50-100 base-tag vocabulary with 5 tiers each is **the largest unspeced content authoring job remaining**.

### 2.7 Flat wage rule 🔒

ALL mercs cost the same flat wage regardless of attribute roll or tag tier. **The constraint becomes BEDROOMS**, not coin-per-day.

Future gold sinks (deferred):

- **Crusader-Kings-style luxury slider** — global lifestyle multiplier
- **Building upkeep costs** — per-building per-day gold drain

Wage was retroactively corrected mid-sim (e.g. Kael 3g → 1g flat).

### 2.8 Personality mutex groups 🔒

Mercs have personality tags from mutually-exclusive groups so they can't contradict themselves. Validated mutex groups:

- **Temperament**: brave / cautious / reckless / coward
- **Mood**: cheerful / gloomy / volatile / composed
- **Ethics**: honorable / pragmatic / underhanded / cruel
- **Work-ethic**: diligent / lazy / driven / aimless
- **Allegiance**: loyal / fickle / mercenary-hearted / fanatical
- **Money**: frugal / spendthrift / greedy / generous
- **Faith**: devout / skeptical / atheist / superstitious
- **Background**: noble / soldier / priest / peasant / scholar / criminal / merchant / wanderer / artisan / outlander (mutex; pick exactly one)
- **Gender**: male / female (mutex)

Personality tags drove every merc's consistent in-character behavior across 200 days — the strongest qualitative validation of the system.

### 2.9 Captive / artifact dopamine cycle 🔒 *(structure)*  🛠 *(numbers)*

Defeating humans produces captives. Captive flows:

- **Ransom** — high gold, faction rep cost
- **Sell** — medium gold, low risk
- **Display** — prestige tick (requires Main Hall + display rooms)
- **Recruit** — rare; uncommon-or-higher captives may join
- **Execute** — Willpower flavor mark, narrative weight

Artifacts drop from rare/legendary contracts and high-tier captive defeats. 🟡 Drop economy is unspeced; was hand-resolved in sim.

### 2.10 Prestige tiers 🔒 *(structure)* — validated P0→P4

| Tier | Days reached (sim) | Unlocks | Recruit pool |
|---|---|---|---|
| **P0** | Day 1 | mundane work, V0-V1 contracts | all common tier |
| **P1** | Day 22 | V1-V2, scouting post, captive system | rare uncommon |
| **P2** | Day 59 | V2-V3, watchtower, artifact drops | uncommon routine, first rare |
| **P3** | Day 90 | V3-V4, multi-day quests, factional invites | rare routine, legendary possible |
| **P4** | Day 175 | V4-V5, kingdom-tier rep, embassy, keep | ~10% legendary per refresh |

Each tier ADDED new dopamine sources without obsoleting prior ones. Common-tier captive sales still hit at P4. 🟡 Tier count beyond P4 is unspeced.

### 2.11 Construction rules 🔒

- Building takes **NO scenario slot** — background activity
- Building has **NO quality penalty** — pay gold, wait 1 day, get full-spec room
- No supervisor required, no quality roll
- Construction does NOT compete with raiding for merc time

(This retconned the early SIM_BIBLE §13 narrated-pool roll for construction.)

### 2.12 Party-size rule 🔒

- **Minimum 2 mercs** for raid scenarios; `target_heads += (party_size − 2)`
- Solo allowed for default scenarios (scout / guard / tavern)
- Prevents the combined-pool trivialization bug from early sim
- TRAIN scenario **removed** — no safe XP grind

### 2.13 Misc systemic locks 🔒

- **Bankruptcy = debt, not game-over**
- **Forced-rest thin days are FINE** (Day 6 finding overruled by Day 7) — pacing breath, not bug
- **Cold-start vise is intentional** — the early-game scarcity is the design, not a leak
- **Loyalty-at-100 is a trap** — replaced with rivalries, faction allegiances, personal goals, secrets, permadeath (🟡 loyalty mechanic itself unspeced)

---

## 3. The 200-day validated dopamine ladder

Empirically observed dopamine arc through the locked systems. Each tier ADDS sources without obsoleting prior ones.

### Phase 0: Days 1-21 — Cold start
- Recruit Marek (common-tier, safe Physical pick)
- Mundane contracts (repair work, drunkard, peddler scams)
- Day 9: First small tag synergy (Roselle's Agility on a roof-search) — first dopamine micro-spike

### Phase 1: Days 22-58 — First uncommon
- **Day 22 P0→P1 tick**
- **Day 22 Kael recruit** (`bg:deserter` uncommon + `quick T3`) — first uncommon dopamine spike
- Day 42: Marek near-permadeath, survives — first real loss-stakes test
- Day 49: First tag-on-tag synergy crit

### Phase 2: Days 59-89 — First rare and first death
- **Day 59 P1→P2 tick**
- **Day 59 Imogen recruit** (`bg:priest` RARE + `charming T2`) — first rare spike; constraint-as-superpower (won't bear weapons → non-violent resolution specialty)
- Day 65: First artifact (Pectoral of the Worn Saint)
- **Day 84 MAREK PERMADEATH** — Day-1 hire dies. Validated the loss-cost loop.

### Phase 3: Days 90-170 — Legendary & kingdom-scale arc
- **Day 89 SEVRENNE recruit** (`bg:princess` LEGENDARY + `well-spoken T1` + `charming T3`, Peerless C9) — first legendary; apex dopamine of run
- **Day 90 P2→P3 tick**
- Day 93: Drust+Sevrenne god combo → permanent diplomatic alliance with 5g/month tribute
- Days 131-170: **Sevrenne quest arc** (40 days), peaking in:
  - Day 147 GOD COMBO: 3-merc Cha stack rallies loyalist army (kingdom-toppling)
  - Day 165 KAEL PERMADEATH (heroic-sacrifice flavor — held the stairwell)
  - Day 167 Sevrenne crowned Queen of Vellis; leaves roster (NEW LOSS FLAVOR: promotion)

### Phase 4: Days 171-200 — Settled at kingdom tier
- **Day 175 P3→P4 tick** (kingdom-level rep)
- **Day 185 Halrik recruit** (`bg:knight-errant` LEGENDARY + `stoic T2` + `muscular T2`) — second legendary
- **Day 190 Roselle voluntarily departs** ("this fort eats people") — NEW LOSS FLAVOR: voluntary exit
- Day 195: V4 regional alliance contract begins

---

## 4. Loss-flavor taxonomy 🔒 *(emerged from sim, codified post-hoc)*

Four distinct flavors of merc loss were OBSERVED — not designed up front, just emerged:

| Flavor | Example | Emotional Note |
|---|---|---|
| **Tragic grief** | Marek (Day 84) | Long-served, slowly built; quiet sacrifice; bedroom stays a memorial |
| **Heroic sacrifice** | Kael (Day 165) | Peak-moment death; held the stairwell; entered bio as legend |
| **Bitter exit** | Roselle (Day 190) | The fort failed her; no death, just an empty room and a grudge |
| **Bittersweet promotion** | Sevrenne (Day 167) | Ascended past the fort's scope; her gain, your loss |

**Design implication**: loss routing should choose among these flavors based on circumstances + merc personality. The system should make all four reachable, not just permadeath.

---

## 5. God-combo scaling principle 🔒

God combos (multiple-merc tag stacks resolving one scenario) scale to the STAKES of the scenario:

| Scale | Example | Scope |
|---|---|---|
| Single-contract crit | Day 49 Drust solo tag-stack | one contract reward |
| Cumulative alliance | Day 93 Drust+Sevrenne | permanent 5g/month tribute |
| Kingdom-toppling | Day 147 Drust+Sevrenne+Imogen | crowned a queen |

**The system rewards INTENTIONAL party composition**, and the reward scale matches the scenario's stake-tier. The "build-a-unit" promise pays off at every prestige tier.

---

## 6. Constraint-bearing rare tags 🔒

Rare and legendary tags often carry **RP constraints** that flip into superpowers:

- Imogen's `won't bear weapons` → non-violent specialty
- Sevrenne's `won't be openly identified` → hunter-evasion scenes that exercised the whole roster

**Design directive**: high-tier tags should change PLAY PATTERNS, not just amplify stats. Different gameplay, not bigger numbers.

---

## 7. Critical open specs (ranked by 200-day priority)

| # | Spec | Triggered by |
|---|---|---|
| 1 | 🟡 **Loyalty mechanic** | Roselle's exit was vibe-based; needs hidden-stat tick rule |
| 2 | 🟡 **Willpower-survival math** | Kael's "W5 alone vs threshold 8 = death" needs spec |
| 3 | 🛠 **Recruit refresh cadence + rarity prob tables per prestige tier** | Used continuously; was hand-waved |
| 4 | 🟡 **Quest-arc auto-seeding from legendary tags** | Sevrenne's arc was hand-narrated; needs auto-trigger |
| 5 | 🛠 **Building upkeep numbers** | ~2g/day guessed; needs real values |
| 6 | 🟡 **Permadeath / wound math** | Survival rolls used 3+ times; rule was case-by-case |
| 7 | 🛠 **Artifact drop economy** | Worked but unspeced |
| 8 | 🟡 **Stat ceiling above 6** | One sim character hit C9; need off-band scaling rule |
| 9 | 🛠 **Veterancy XP formula + trauma V-loss** | Loosely tracked |
| 10 | 🟡 **Multi-artifact-per-merc rules** | One sim character ended with 3 artifacts; can they? Conflicts? |
| 11 | 🟡 **Off-roster character progression** | Informal V2 hit by an unofficial staffer; system needs codification |
| 12 | 🟡 **Inter-merc relationship system** | Hinted (Kael-Roselle quiet bond); not codified |
| 13 | 🟡 **All-heads / all-tails crit triggers** | Sultan-coin rule still missing |
| 14 | 🟡 **Avatar vs merc distinction** | Avatar does scenarios AND admin; needs design sprint |
| 15 | 🛠 **LEGENDARY frequency throttle** | Two legendaries in 200 days felt right; need rule |
| 16 | 🟡 **Verb-constraint system** | Which tags block which verbs (e.g. Imogen's no-weapons) |

These are **tuning** problems, not foundational ones. The core design is sound.

---

## 8. What 200 days proved (bottom line)

The Level/Tag/Attribute model + personality mutex + Sultan-coin resolution + captive/artifact cycle produces:

1. **Continuous, varied dopamine** across 200 days — no dopamine-cliff after major events
2. **Emergent character ensemble** that reads as people, not stat-blocks
3. **Natural difficulty curve through prestige tiers** — content scales with capability without artificial gates
4. **Four distinct loss flavors** (death / sacrifice / exit / promotion) — rich character endings, not just permadeath roulette
5. **God-combo build payoffs at every scale** — single-contract, cumulative-alliance, kingdom-toppling
6. **Legendary tiers anchor multi-day quest arcs** — the design SEEDS them through tag-driven story hooks
7. **Tier dopamine sources don't obsolete each other** — common-tier captive sales still hit at P4

**The design is ready for implementation prototyping.**

---

## 9. Prototype-first vs code-first (with AI in the loop)

**Recommendation: prototype first, but the AI changes WHY.**

Traditionally you prototype to *discover* the design. The mental sim already did most of that — the design is well-specified. So the prototype's job has shifted: **validate that the AI scenario engine produces what the mental sim predicted.** That's the actual unknown; you cannot validate it in your head.

**Target prototype scope** (1-2 weeks):

- ✅ Real Sultan-coin resolution (RNG-backed, not hand-waved)
- ✅ A starter tag vocabulary (~30 base tags from the sim's §0 inventory)
- ✅ LLM-driven scenario generation for ~5 scenario archetypes (contract, recruit, captive, build, tavern)
- ✅ Minimal captive/artifact cycle
- ✅ Save/load (just JSON)
- ❌ Skip: graphics, UI polish, balance tuning, edge cases, animation, sound, complete tag vocabulary, all building types

**Then PLAY it for 20-30 sessions.** Validate:

- Does the AI generate scenarios that FEEL like the mental sim?
- Does Sultan-coin pacing produce the dopamine spikes the sim predicted?
- Does the tag system READ as identity, or as spreadsheet?
- Does the recruit refresh loop create real anticipation?

**Then decide** (with data, not before): evolve the prototype, or rebuild. AI-assisted rebuilds are cheap now — the "throwaway" cost wall from 2015 is gone.

---

## 10. Reading order beyond this doc

This file + `AGENT_BOOTSTRAP.md` is the canonical load. Beyond that:

- `OPEN_QUESTIONS.md` — will be re-aligned with §7 above
- `VISION.md` — one-page pitch (still aligned)
- Legacy detail docs (`RAID_DESIGN.md`, `HEROES_AND_GROWTH.md`, `GAMEPLAY_LOOP.md`, `PROGRESSION_AND_PAYOFF.md`, `FORT_AND_PRESTIGE.md`, `CORE_CONCEPTS.md`) — each has a SUPERSEDED banner explaining what's still valid

---

## 11. Provenance

This document distills:

- 200+ days of mental simulation across multiple sessions
- All canonical locks from `~/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/findings.md` (~807 lines)
- Full validation sim in `~/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/sim_validated_d1_10.md` (~1125 lines)
- The total writeup originally posted to GitHub as issue #2

Session artifacts are not in the repo. If you need the historical trace, read those files directly.

---

*End of canonical design doc. If anything here surprises you compared to a legacy doc, **this doc is right and the legacy doc is stale.***
