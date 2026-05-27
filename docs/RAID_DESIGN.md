# Raid Design

**Status:** Locked (core, balance shape, equipment principles, difficulty class). Open (long-term arc, defensive raids, equipment slot count + room reshape, exact balance coefficients).

The raid system is the central agency layer of AI Raider. This document records the **locked core loop** as resolved through design conversation and self-playtest (see [issue #1](https://github.com/dolphinigle/airaider/issues/1) for the full trace). Sections marked Open are pending later design rounds.

## Top-tier architecture principle — *Engine owns numbers, AI owns flavor*

This is the single most important rule the project commits to. It applies to every system in the game, not just raids.

- **Engine (deterministic code)** owns: all numbers, all balance, all probabilities, all gold/stat/level/threshold/reward amounts, all hard rules. Tunable in spreadsheets.
- **AI (generative model)** owns: all names, voices, prose, character lines, scenario flavor, *type* of reward, narrative consequences, hero personalities, tag *labels*.
- **Engine → AI handoff** is via a **numeric envelope**: the engine declares a budget or constraint, the AI fills it with meaning, the engine validates the result.

### Reward-as-budget pattern (canonical example of the split)

Whenever a raid produces a reward, the flow is:

1. **Engine computes a reward budget** from the raid's difficulty and outcome band.
   > *"This was a difficulty-3 raid that closed in band B (partial). Reward budget = 80 gold-equivalent."*
2. **AI splits the budget into meaningful pieces of fiction.**
   > *"50g in a leather pouch + a 25g-value captive merchant + a 5g trinket. Here's the scene where they're discovered."*
3. **Engine validates** (totals match within ±10%, item types are legal, captives go to the captive table, etc.).
4. **Engine commits** the rewards to the game state.

The same pattern applies to:
- **Scenario stat thresholds** — engine sets threshold *number*; AI describes what the obstacle *is*.
- **Recruitment** — engine sets recruit level/tag count; AI fills in name, backstory, tag names.
- **Loot generation** — engine sets item tier; AI names the item.
- **Consequence narration** — engine sets the mechanical effect (a new tag, a wound, -1 loyalty); AI narrates *why*.

This pattern means the game is **always balanced** (numbers are in code) and **always fresh** (fiction is in AI). Neither layer can corrupt the other's job.

## The core action — *cards into scenario slots*

A **raid** is a small quest-line of 3–5 scenarios played in sequence. The player has a roster of **heroes** (3–10 named captains over a campaign) and assigns them to scenarios as the raid unfolds.

This is the same underlying loop as AI Stronghold's quest system, but presented with a different UI surface. The change is in how the player *interacts* with it: instead of opening a quest log and selecting from menus, the player sees each scenario as a **scene**, and assigning heroes to it is the *moment of agency*.

## Resolution — *Narrated Pool*

For each scenario, the player assigns 1–N heroes to a slot. Resolution proceeds as follows:

1. The scenario declares a **threshold** (e.g. 12), the relevant **stat-pool** (e.g. "Cunning, or Wits as fallback"), and **outcome bands** (clean / partial / fail / catastrophe with consequences for each).
2. Each assigned hero contributes: **(their stat) + (one of their tags' modifier)**.
3. The **engine** selects which of the hero's skill tags fits the scenario best — the player does not pick tags.
4. An **AI** generates one short narration line per contribution, citing the chosen tag.
   > *"Marcus knows this defile — same goat-track he used running stolen amphorae for old Calvus.* `road-bred (+2)`*"*
5. The total pool is compared to the threshold; the outcome band fires.
6. The AI generates a closing line summarising the consequence.

Engine owns all math. AI owns all prose. **The two are visibly bound together** by the tag name appearing both in the line and in the modifier number — so the player sees *why* this hero contributed what they did.

### Why this design won
- AI's single best fit in the project: ~1 cheap call per scenario, generating 4–5 lines of in-character story directly tied to engine math, with no long-range coherence demand.
- Every roll becomes a micro-story (Blades in the Dark / Wildermyth / Crusader Kings event-resolution feeling).
- Hero identity becomes mechanical AND narrative simultaneously — the tag both grants the bonus AND produces the line.
- Threshold-pool is trivial to balance and read on screen.

## Agency — *Approach Selection (climax-only)*

Most scenarios in a raid are **single-approach** — fill the slot, narrate, move on. This keeps pacing fast and cognitive load low.

The **climax scenario** of each raid offers **2–3 distinct approaches** with meaningfully different consequences. Example: a captured tribune can be **Ransomed** (Wits-led, +gold over time, +Heat), **Killed** (Cunning-led, +smaller gold, –Heat), or **Burned with the building** (Brawn-led, +villager prestige, +0 Heat, lose ransom). Each approach has its own stat-pool, threshold, and outcome bands.

This concentrates real branching at the *payoff* moment, like a Slay-the-Spire boss or a Disco-Elysium confrontation. Setup scenarios build momentum; the climax delivers the choice.

## Raid difficulty — *required_level + difficulty_class* (Locked)

Every raid scenario carries two difficulty numbers:

- `required_level: int` (1 through ~50) — the *power* axis. Sets the threshold's center.
- `difficulty_class: enum { standard, hard, legendary }` — the *optimization-pressure* axis. Sets the threshold's tightness coefficient.

| difficulty_class | threshold coefficient | What it asks of the player |
|---|---|---|
| **Standard** | 1.0 | Any hero at required_level with average tags clears reliably. The bread-and-butter content. |
| **Hard** | 1.3 | Hero at required_level needs OPTIMAL tag match to clear. Suboptimal tag → partial. Over-level can flex through with raw stats + gear. |
| **Legendary** | 1.6 | Even optimal tag at required_level is partial. Need over-level OR multiple matching tags OR best gear OR all three. The "this is the boss" content. |

This is **not** the dropped Easy/Standard/Hard/Lethal axis. That one was a *power* duplicate of level (so it was dropped). `difficulty_class` is instead an *optimization-pressure* axis: hard/legendary scenarios reward party-building and gear-investment, and legitimately let high-level heroes "flex" through low-required-level legendary content if they're well-equipped.

**Penalty rules (engine-owned):**
- **Hero level ≥ required:** no penalty from level. Difficulty_class still tightens the threshold.
- **Hero level < required:** **−2 to that hero's contribution per level of gap.** Also increases the catastrophe-band chance.
- **Endgame implication:** some endgame raids will exceed any reasonable hero level. Players are *expected* to absorb some under-level penalty as part of strategy.

**Why no over-level penalty:**
- Airaider's 200h+ campaign means the player will often have a level-30 hero with nothing better to do than clear a level-5 errand for easy gold. That should be *allowed* — but the **opportunity cost** of using that hero for trivial work is the natural balancing pressure. No need for a hard cap.

## Equipment principles (Locked. Deep design Open — see Open issues)

- **Equipment is a card** (cards-as-universal-abstraction holds).
- **Equipment lives in a hero's personal room** (no per-hero inventory bloat — see GAMEPLAY_LOOP.md camp/room section). The room is the equipment screen.
- **Equipment uses level, not tiers.** A "Centurion's Helm L18" reads cleanly.
- **Equipment has rarity:** common / uncommon / rare / legendary. Engine-set; gates effect magnitude and drop rate.
- **Slot count is lean — proposed weapon + armor + 1–2 rings.** Rings tend to grant tags; weapons and armor grant stats and sometimes tags. Exact slot count is Open.
- **Equipment data feeds AI narration.** When a scenario fires, the prompt to the AI includes the equipped cards' names and flavor so the narration can reference them concretely (*"Drust swings the named axe Iron-Tongue..."*). This is part of the engine-AI handoff.

## Errands — long-clock scenarios for idle heroes (Locked)

An **errand** is just a **scenario card** (cards-as-universal-abstraction) with two distinguishing properties:

1. **Long clock:** resolves over multiple days (not within a raid). The hero is committed for the duration.
2. **Auto-resolve:** the engine runs the resolution at the end of the clock; no per-day player interaction is needed.

Errands use the same Narrated Pool engine as raid scenarios. Same required_level rules. Same outcome bands. Same AI narration. They are **scenarios with a different *clock*, not a different *system***.

Examples (each is just a scenario card playable from the camp scene into a hero-slot):
- *Patrol the trade road* — Lv 2 errand, 2 days, small gold + rumor chance.
- *Drink in town* — Lv 1 errand, 1 day, recovers Fatigue faster + chance of lead.
- *Train recruits* — Lv 3 errand, 3 days, accelerates XP for new heroes.
- *Personal errand* — hero-specific, generated from backstory, may earn a new tag.
- *Run a protection racket on a village* — ongoing errand, passive gold + raises local infamy.

This solves the "what does an idle hero do?" problem (every hero always has a use), feeds new leads into the main raid loop (so errands aren't dead weight), and gives the AI more storytelling beats per campaign hour. It also formalises the camp-day activities listed in `GAMEPLAY_LOOP.md` — most of them are simply errands.

## Leads — cheap stubs, AI-generated on commit (Locked)

A **Lead** is a near-zero-cost placeholder for a potential quest. It exists so the game can have a rich, populated *job board* without burning AI tokens on quests the player will never pursue.

### Data shape

```yaml
Lead:
  archetype: enum        # ~15–20 hand-authored archetypes in JSON
                         # e.g. coin_wagon, bandit_camp, lost_heir, haunted_ruin,
                         #      noble_debt, smuggler_run, ruin_delve, escort_caravan
  difficulty_class: int  # L1–L20, gates which heroes can pursue
  reward_budget: int     # reroll budget for loot at pursuit time
  region: string         # short region label (Greythorn outskirts, Pine Hollow…)
  expiry_days: int       # disappears from the board if not pursued
  hook: string           # one sentence, atmospheric only. Pulled from a
                         # per-archetype hook pool with {region} substitution.
                         # 100% engine; NO AI call is ever made for a lead.
                         # MUST NOT name NPCs, specific locations beyond region,
                         # occupations, hiding places, or any plot specifics.
                         # The hook evokes vibe; the quest invents people and
                         # twists at commit time.
```

### Leads are zero-AI (locked)

**No AI call is ever made for a lead.** Archetypes, hook pools, and region labels are all hand-authored in JSON. The engine rolls, substitutes `{region}`, and displays. AI cost happens *only* at commit, when the full quest is generated. If lead generation cost any AI at all — even a tiny hook call — the token-saving justification for leads as a distinct concept weakens.

### Hook rule (locked)

Hooks are **atmospheric**, not **narrative**. They evoke region + risk + vibe. They do NOT name NPCs, locations beyond region, occupations, hiding places, or plot specifics. Two leads of the same archetype in the same region should be **functionally interchangeable** from the hook alone — the actual people, places, and twists are invented *only at commit time*. Otherwise the hook half-writes the quest and the token saving evaporates.

- ❌ *"Old Murch the tanner owes Lord Kessel and hides silver under his hides."*
- ✅ *"A debt-dodger in the west quarter — small purse, easy work."*
- ✅ *"Bandits in the eastern forest. Local bounty posted."*

### Generation flow

1. **Engine rolls** a lead: archetype, difficulty, region, budget, expiry. (Zero AI.)
2. **Optional**: one *very small* AI call (or hook-pool pick) produces the one-line hook. **Locked: hook is pure template-pool pick, ZERO AI.**
3. Lead sits on the **board**, visible to the player.
4. **On commit:** the player assigns a party (1+ heroes). *Only now* does the engine fire the full quest-generation prompt: the lead's archetype + difficulty + region + budget seed an AI call that produces the actual scenarios, NPCs, named loot, twists, and per-scenario narration.
5. The generated quest plays out via the Narrated Pool resolution above. Reward at the end uses the lead's `reward_budget` via the canonical reward-as-budget pattern.

### Why this works

- **Token-cheap board:** dozens of leads can sit on the board for the cost of one real quest. Unpursued leads expire harmlessly.
- **Commit-with-imperfect-info tension:** the player sees archetype + difficulty + reward budget but not the *specific* scenario shapes. Committing a hero is a real bet.
- **Scouting becomes a distinct mechanic:** cunning/social heroes (e.g. `silver-tongue`, `road-bred`) can spend an action to **scout a lead** — engine reveals 1–2 scenario hints before commit. A non-combat use of cunning heroes that doesn't compete with raid slots.
- **Archetypes are public, scenarios are private.** Players learn what "coin wagon" tends to mean over time (pattern recognition is the fun); but each individual coin-wagon raid still has unique AI-generated specifics.

### Story Beats — the deliberate exception

A **Story Beat** is a quest that exists because of a previous outcome, a character arc, or a fort milestone. Story Beats **bypass the lead-stub system** and are **fully generated at trigger time**:

- Player intent is already high (no wasted generation).
- Story coherence *requires* the quest to be written with knowledge of what came before.
- Hiding details from a player already committed to a narrative adds friction, not tension.

Story Beats can still **appear on the board** alongside leads (UI parity), but under the hood they are fully realized Quest objects, not stubs. Their hook line is usually richer and more specific (*"Lord Kessel has summoned Vannis to court — the favor he owes is due."*).

Engine distinguishes the two via `lead.kind = stub | story_beat`. AI cost lives where player intent lives.

## Presentation — *fiction-forward UI*

**Locked principle (design rule):** *Never show the player a menu when you can show them a scene.*

- The roster screen = the captains around the fire.
- The inventory = items laid on a blanket.
- The camp upgrades = building rooms (inherited from aistronghold).
- Quest selection = a hooded man arriving with news, not a quest log.
- A scenario = a paragraph of fiction with hero-slots embedded.

Stats and modifiers still appear, but **inside** the fiction (a `+3` next to a tag name in a sentence) — never as the primary screen surface. This was the single largest fun-multiplier discovered in playtest.

### Sub-rule: no false choices
> *If a choice has a single dominant answer per actor, it isn't a choice — it's bookkeeping.*

When a system would offer multiple variants of an action (rest at fire / drink at wine-tent / pull-ups) but each hero has an obvious-best pick, collapse to one action. Only present variants when the player will genuinely deliberate.

## Resource economy — *two-tier exhaustion*

### Stamina (within a raid)
- Each hero starts a raid with **3 stamina charges**.
- Each scenario assignment costs **1 charge**.
- At 0, that hero is **spent** for the rest of this raid.
- Forces in-raid choice: when to spend strong heroes vs. save them.

### Fatigue (between raids)
- A raid raises each participant's **Fatigue** (e.g. +2 base + 1 per scenario assigned).
- Fatigue must be **unwound** at camp before the hero is ready again (sleep, drink, time on a camp duty).
- High-Fatigue heroes either refuse dangerous jobs or perform at penalty.
- Forces the **lord-layer** decision: do I have a deep enough bench for the next raid?

This makes roster depth a real strategic resource — you NEED 6–10 captains, not 3 — and pulls the inherited fort/prestige loop directly into the raid layer (camp rooms become unwinding facilities).

## Heroes vs Followers

Inherited distinction from aistronghold, now load-bearing:
- **Heroes** = named captains. Stats, tags, story, fatigue. Cards played into raid scenarios. Limited (6–10 per campaign).
- **Followers** = rank-and-file. Recruited from captives, villages, etc. Assigned to **camp duties** (gate-watch, kitchen, training-yard). Generate passive camp effects. Do NOT go on raids as scenario cards (may appear in raid narration as "your three spearmen" but are not individually tracked).
- **Promotion** is rare and meaningful: a follower elevated to hero through a notable deed gains a name, tags, and history. This is a celebration moment.

## Hero state during a raid
- **Wounds** taken at scenario failure persist into Fatigue or, in catastrophic outcomes, into death (configurable; see [HEROES_AND_GROWTH.md](HEROES_AND_GROWTH.md)).
- **Scar-origin tags** earned at specific catastrophic-band events are permanent. Engine sets the tier and modifier; AI names them (e.g. `crypt-walker`, `lone-survivor`, `burned`). See HEROES_AND_GROWTH for the unified tag model.
- **Captives** taken in a raid arrive at the camp as a new inventory type (sellable / ransomable / breakable into followers).

## What the player must always see
For any scenario, the UI must always communicate:
1. The current scenario as a scene (fiction first).
2. Each slot's threshold and stat-pool.
3. Each available hero's relevant stat AND a *preview* of which tag will likely fire (so the player can predict the line, not just the number).
4. Outcome bands' consequences in plain language.
5. Available stamina and current Fatigue per hero.

If the player can't answer "who do I send and what happens if it goes wrong?", the UI has failed.

## Open issues (logged from playtest)

- **Stat-pools per scenario, not single stats.** A scenario must declare which stat(s) heroes can lean on, possibly with fallbacks (e.g. "Wits, or Cunning at –1"). Single-stat scenarios punish spiky heroes unfairly.
- **Variety in the camp loop.** Even with errands, repeating the same camp screen 100+ days in a row will fatigue the player. Needs rotating events, seasonal shifts, faction reactions, prestige-tier content rotation.
- **Long-term arc structure.** With a 200h+ campaign, escalating ambition (bandit → regional warlord → empire challenger) must be paced through the prestige tier ladder. Concrete tier-content design is open.
- **Defensive raids.** When enemies attack the camp, the same engine should handle "your gate is a slot, your wall is a scenario card." Probably trivial — confirm.
- **AI narration variety.** Each tag firing 30+ times across a campaign must not feel repetitive. Likely: each tag has 5–10 narration templates rotated by AI with a short memory of recent uses.
- **Earned tags.** Late-game heroes need new tags from earned events ("centurion-slayer"), not only their starting 3. This is the primary long-term hero progression.
- **Hero level curve specifics.** Soft cap ~40, no hard cap locked. Exact stat-growth and tag-multiplier formulas per level deferred to first prototype balance pass (see `docs/BALANCE.md`).
- **Equipment + room deep design.** Principles are locked (equipment is a card, lives in hero's room, has level + rarity, lean slot count, feeds AI narration). Open: exact slot count (weapon + armor + N rings?), the room/decor system reshape from aistronghold (rooms are now BOTH prestige sources AND hero equipment), the artifact pool unification, how artifact transfer between rooms works, what happens to a dead hero's room.
- **Prestige tier count.** Target 20+ tiers as content modes (see GAMEPLAY_LOOP.md). Final count depends on how many room/content modes get designed.
- **Stat-too-low handling.** Locked: contributions can go negative, floored at −3, AI narrates as fictional failure ("Sextus stands there glowering, contributing nothing useful: −1"). No hard wall on participation.

## What is NOT in this doc (deferred)
- Specific scenario *content* (what scenarios exist, what tags exist) — content design comes after the engine is locked.
- The camp/Lord-layer screen design — covered in [GAMEPLAY_LOOP.md](GAMEPLAY_LOOP.md).
- Hero progression specifics (earned tags, renown) — covered in [HEROES_AND_GROWTH.md](HEROES_AND_GROWTH.md).
