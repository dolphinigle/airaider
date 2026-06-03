# Design — The Core Game

**Status:** Canonical (prototype-2, 2026-06-02). This is the authoritative description of the game. Read [VISION.md](VISION.md) first for the *why*; this doc is the *what*. The AI/story machinery that sits behind the board is detailed in [STORY_ENGINE.md](STORY_ENGINE.md).

Conventions: 🔒 locked · 🛠 locked-shape, numbers deferred · 🟡 open.

---

## 1. The frame: two loops, three pleasures 🔒

One persistent fort. Two loops that share one currency — **tagged characters** — and feed each other so neither can become a side-panel:

- **Gameplay loop** — assign characters to quests → roll → AI narrates an individuated outcome → loot drops.
- **Progression loop** — spend gold and captives to build rooms; rooms unlock new quests, turn tag-matched captives into prestige, and gate the next tier of rooms.

Three distinct pleasures live across these loops. Pull any one and the others starve:

1. **Mechanical** — reading leads, min-maxing which characters to send, watching the fort grow, and *rolling for it*.
2. **AI** — infinite quests, and each character acting as *uniquely themselves* in every outcome.
3. **Loot** — tagged characters and items dropping; the rare perfect tag for an empty slot.

The hinge that marries the loops: **tags are dual-use.** A character's tags set both their *odds on a quest* and their *prestige in a room* — and one character can't be in both places at once. Every assignment is an opportunity cost spanning the two loops.

---

## 2. The cycle: Fort Phase → Resolution Phase 🔒

A turn is a **cycle of two phases** (the Sultan's-Game cadence: a stretch of quiet commitment, then a reckoning).

### Fort Phase — assign. No rolls, no outcomes.
The player plans and commits, with **no results revealed**:
- Browse the **lead board**; **pursue** leads worth chasing (pursuing generates the quest card so it can be read and assigned to).
- **Assign characters** to pursued quests — the odds are visible while assigning.
- Place new **captives** into matching rooms; **build/upgrade** rooms.
- Commit → Resolution.

### Resolution Phase — everything rolls at once, then the AI narrates it all.
- Every committed quest **rolls** (§5).
- The AI **narrates each outcome**, giving every assigned character their own beat (§6, STORY_ENGINE.md).
- **Loot lands**, captives are taken, characters are wounded or die, stories advance and spawn new leads.
- The player reads the cascade — one **batched payoff** — then returns to Fort Phase.

**Each character does one thing per cycle** (a quest, or staffing nothing — captives staff rooms, not mercs). The cycle is the unit of time; there is no separate "day" clock.

---

## 3. The two boards 🔒

The game is played across two boards at two speeds.

### Lead board — cheap, deterministic, the strategic surface
A **lead is pure data**, no AI: `{ rarity, level, location, chain-info }` where `chain-info ∈ { continues an existing story · starts a new one · none }`. The player reads leads like loot filters and decides where to spend scarce effort. This is fun *before any story exists* — like a good map drop. The lead board is **dialed by the fort**: build a Scout post → leads appear in new locations; raise prestige → higher-rarity leads show up. It is the visible payoff of progression.

Leads **expire** (use-it-or-lose-it). What stocks the board each cycle: deterministic generation (gated by fort + prestige), plus "continue" leads from live stories, plus first-beat leads from new mercs' personal chains.

### Quest board — the AI quests you committed to
**Pursuing** a lead generates the full quest (its card) and moves it here, where you assign characters and, in the Resolution Phase, it resolves. AI cost fires only on pursuit, so the expensive generation is spent only on quests the player chose to care about.

---

## 4. Characters & the tag system 🔒-shape 🛠-numbers

> **Authoritative detail: [CARDS.md](CARDS.md).** This section is the summary.

Characters are the atoms. Mercenaries (roster), captives (loot), and NPCs (world cast) are one kind of object distinguished by a `role` field — no parallel hierarchies. A character is:

- **Tags** — the loot/identity layer *and* the personality. **Personality = tags** (a `cruel, greedy, ex-soldier` merc behaves cruelly, greedily, like a soldier). Tags are the behavioral fingerprint that individuates them.
- **Quirks** — small AI-generated concrete habits ("counts coins twice").
- **`who` + backstory** — a one-line known-for and a short AI-written origin, generated when they enter the pool, fitting their tags and how they were acquired.
- **Their chains** — the quests they pass through (cast in others') plus the one chain about them (their main story). *The chains are their living memory and biography* — there is no separate psychological model. (See STORY_ENGINE.md for how this stays token-affordable.)
- **State** — level/veterancy, wounds, fatigue, alive/dead/departed, current room (captives only).

**The tag system:**
- **One unified vocabulary** (~50–100 base tags) covering personality, physique, background, talent, faith. Small enough for the AI to treat as a known vocabulary. 🟡 full authoring is the big content job.
- **Intensity tiers within an axis** — e.g. beauty `pretty → … → gorgeous` (higher = rarer drop).
- **Desirability is both rarity and context** — a higher tier is intrinsically better, but the real thrill is *fit*: a tag is "perfect" because it matches a quest's ask or a room's theme.
- **Themed rooms, AI-adjudicated** — a themed room grants bonus prestige to tags that resonate with the theme; the AI decides the resonance dynamically.
- **Mostly fixed** at acquisition (natural affinity, not grind-earned), with rare quest-stamped unique tags as growth.
- **Mutex groups** prevent self-contradiction. 🛠 group list TBD.

---

## 5. Resolution — the Sultan-coin roll 🔒-shape 🛠-numbers

> **Authoritative detail: the roll math is in [CARDS.md](CARDS.md) §2; what's tested + the threshold + the resolution pipeline are in [QUESTS.md](QUESTS.md).** This section is the summary.

Engine owns the math; the AI narrates the result it's told.

- The quest's **ask** + the assigned characters' relevant **tags/attributes** → a **coin count N** (better fit = more coins).
- The quest carries a **threshold T**. Flip N coins → heads vs T → **success / partial / failure** (three outcomes, no critical — the jackpot lives at reward *generation*, not the roll). See [ECONOMY.md](ECONOMY.md) §5 for delivery (success = full · partial = half / keep+liability · failure = none + risk-gated punishment).
- **Odds are visible before commit** ("6 coins vs threshold 4 → ~78%"). This is what makes the min-max legible and what makes loss *owned* (§7) — you always knew the danger.
- The engine tells the AI the outcome and the cast; the AI never invents numbers.
- 🟡 exact thresholds and tag-vs-attribute weighting are open numbers (**fun before balance**).

---

## 6. Individuated outcomes 🔒

The differentiator. In the Resolution Phase, each quest's outcome is written so **every assigned character gets their own beat, driven by their tags + quirks + story — never the party as a blob.** Casting depth scales with rarity (§ STORY_ENGINE): common quests are generic (no named cast), uncommon introduce new faces, and rare quests bring back characters you already know (the apex). This is where "each character does something uniquely their own" must land.

---

## 7. Risk & loss — TO DESIGN
How a bad roll lands (wounds / death / departure) is not yet designed.

---

## 8. The progression loop 🔒-shape 🛠-numbers

> **Authoritative detail: [GAME_STATE.md](GAME_STATE.md)** (two prestige pools, the progression spiral, staging buildings). This section is the summary; note the two-prestige model below supersedes any single-"prestige-gate" phrasing.

The persistent base. It grows; it never resets. **Two prestige pools:** *comfort* (items in a merc's own room → that merc's level cap) and *global* (captives + items in theme rooms → **unlocks new rooms**, which then gate content). **Gold builds rooms**; prestige is the room-*availability* meter, not the build currency. **Functional rooms gate content (tiered); theme rooms generate prestige (flat).** Detail: [FORT.md](FORT.md).

### 8.1 Captives — dual-use loot
Quests produce **captives** carrying tags. Per captive you choose:
- **Place in a tag-matched room** → prestige (the core progression act; a standing arrangement, not a per-cycle action).
- **Recruit** → joins the roster (Game State, TBD).
- **Ransom** (high gold, faction cost) / **Sell** (medium gold) / **Execute** (narrative weight).

The choice is the fun: a `gorgeous`-tagged captive is a prestige drop *and* a future diplomacy asset *and* a ransom payday — pick one.

### 8.2 Rooms — the tech tree
Rooms gate on **prestige** to build, and do three jobs:
1. **Capability** — unlock new quest types/locations (Scout post → lead-hunt quests; Dungeon → hold captives + capture quests; Tavern → recruit pool).
2. **Theme/prestige** — tag-matched captive/follower slots (Kitchen=cooking, Chapel=devout, Library=scholar…); AI adjudicates theme-fit bonus.
3. **Housing** — **Bedrooms cap the roster** ("the constraint is bedrooms").

### 8.3 Prestige — gate and score
Prestige is earned from tag-matched captives/followers in rooms. It is both the **gate** (rooms have prestige requirements) and a **score** that raises recruit quality and unlocks higher-stakes content. Ladder: *prestige → unlock room → room unlocks quests + makes more prestige → higher prestige → better rooms & recruits.*

### 8.4 Recruitment & captives — TO DESIGN
How mercs enter the roster and how captives flow (recruit / room / ransom / sell) is part of the **Game State** design, not yet done.

---

## 9. How the board stays alive (story integration) 🔒

There is **no separate story system the player touches** — only the board, kept alive by the engine behind it (full detail in STORY_ENGINE.md). That engine does three invisible jobs: it **stocks** the board (fitting fort + prestige, cast from the right tier), **connects** quests (a finished quest can drop its next step back as a lead you choose to pursue or let lapse — so story length is organic, driven by pursuit, never an engine beat-count), and **grows** characters (every quest a character touches becomes part of them; a strong-hook character becomes the *subject* of quests). The fort dials what stories the board can tell; playing the quests produces the loot and characters that drive the fort.

---

## 10. Deferred (intentionally) 🟡

- **Artifacts** — tagged items (equipment boosts a character's quest odds; furniture boosts a room's prestige). Extra loot-dopamine that rides the *same* tag/fit/prestige rails. Slot reserved: keep those systems **item-agnostic** ("a tag-bearing thing that boosts a quest or a room") so artifacts drop in later with zero rework. Detail deferred — not where the fun-risk is.
- **All balance/economy numbers** — fun before balance (user directive).
- **AI prompt/schema specifics** — implementation, in STORY_ENGINE.md and code.

---

## 11. Honest risks (executional, not structural)

The structure is sound; these are the things to watch when building:

1. **AI quest quality & consistency at scale** — the validated engine is good, but holding voice/coherence across many concurrent stories is the hardest unproven part.
2. **AI cost & latency** — every pursued quest and every resolution is a model call; the batched Resolution Phase fires many at once. Needs the model-tier split and pre-generation (STORY_ENGINE.md).
3. **Readability of the batched reveal** — when ten quests resolve at once, the cascade must stay legible and paced, not a wall of text.
4. **Depth of tag→room prestige** — the matching puzzle must stay interesting for a long campaign, not collapse into "obvious slot for obvious tag."
5. **Content variety over a long persistent campaign** — the AI carries variety, but the *mechanical* surface (rooms, lead types) must keep adding qualitatively new choices, not just bigger numbers.

None is fatal; each has a known mitigation direction. They are flagged so we build against them, not around them.
