# Raid Design

**Status:** Locked (core), Open (long-term arc, defensive raids)

The raid system is the central agency layer of AI Raider. This document records the **locked core loop** as resolved through design conversation and self-playtest (see [issue #1](https://github.com/dolphinigle/airaider/issues/1) for the full trace). Sections marked Open are pending later design rounds.

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
- **Scars** earned at specific catastrophic-band events become permanent tags (see HEROES_AND_GROWTH).
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
- **Fully-rested heroes need useful work.** When all heroes are at Fatigue 0, "Rest" is a wasted token. Likely fix: auto-rest at F0, and add a few meaningful daily camp activities that are always available.
- **Variety in the camp loop.** Repeating the same camp screen 15 days in a row will fatigue the player. Needs rotating events, seasonal shifts, faction reactions.
- **Long-term arc structure.** The core loop entertains for ~20 hours. To carry a campaign, the game needs escalating ambition (bandit → regional warlord → frontier rival). See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- **Defensive raids.** When enemies attack the camp, the same engine should handle "your gate is a slot, your wall is a scenario card." Probably trivial — confirm.
- **AI narration variety.** Each tag firing 30+ times across a campaign must not feel repetitive. Likely: each tag has 5–10 narration templates rotated by AI with a short memory of recent uses.
- **Earned tags.** Late-game heroes need new tags from earned events ("centurion-slayer"), not only their starting 3. This is the primary long-term hero progression.
- **Stat-block leveling — yes or no?** Inherited from aistronghold but in tension with the design pillars. See dedicated discussion thread in issue #1.

## What is NOT in this doc (deferred)
- Specific scenario *content* (what scenarios exist, what tags exist) — content design comes after the engine is locked.
- The camp/Lord-layer screen design — covered in [GAMEPLAY_LOOP.md](GAMEPLAY_LOOP.md).
- Hero progression specifics (scars, earned tags, renown) — covered in [HEROES_AND_GROWTH.md](HEROES_AND_GROWTH.md).
