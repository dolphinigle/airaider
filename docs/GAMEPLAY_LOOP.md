# Gameplay Loop

**Status:** Locked (campaign shape, loop structure). Open (exact prestige tier count, errand catalog).

AI Raider has two nested loops: the **macro loop** (Camp Phase) and the **micro loop** (Raid Phase). They share the same heroes, items and stories, but they are different games to play.

## Campaign shape (Locked)

Target campaign length: **200+ hours**.

- **First ~10 hours**: early game. Hero levels climb 1→6. Player learns the systems, runs P0–P1 raids, settles a starter camp.
- **Hours ~10 to ~50**: mid game. Levels climb 6→20. Camp expands through mid prestige tiers. Most systems are unlocked. Hero deaths start mattering.
- **Hours ~50+**: endgame, where most play happens. Levels creep slowly 20→40+, soft cap around 40, no hard cap. Prestige climbs through high tiers, unlocking diplomatic / political / faction-scale content. The number-go-up curve never quite finishes; the content variety is what carries the time.

The hero level cap is intentionally soft (see `HEROES_AND_GROWTH.md`): a player who loves a hero can keep grinding them up forever in tiny increments, but the *intended* loop is "hit ~L40 in the mid-late game and then play *with* that hero across diverse endgame content."

## Top-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          FORT PHASE                              │
│                                                                  │
│  Build/upgrade rooms                                             │
│  Assign followers to rooms (prestige optimization)               │
│  Display artifacts                                               │
│  Equip heroes                                                    │
│  Choose a raid lead to pursue                                    │
│  Pick a party of heroes for the raid                             │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Launch raid
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                         RAID PHASE                               │
│                                                                  │
│   Player-controlled tactical play with the chosen party          │
│   Decisions: positioning, ability use, push vs. retreat,         │
│              sacrifice, loot-or-leave                            │
│   Ends with: success / partial / failure / wipe                  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Return home
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                       RESOLUTION                                 │
│                                                                  │
│   Loot is distributed (followers, artifacts, resources, leads)   │
│   Hero state updated (XP, scars, traumas, deaths)                │
│   Related stories advance                                        │
│   New raid leads may appear                                      │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Back to fort
                               ↓
                          (loop repeats)
```

## Macro loop — Fort Phase (the **camp day cycle**)

The Fort Phase is when the player is *the lord*. It is a **day-based cycle**: each day, the player allocates their heroes (and followers) to camp activities or outside opportunities, then clicks **End Day**. Time advances; consequences resolve; a new day appears with new offers, news, and pressures.

This replaces aistronghold's "End Week" tick. It is finer-grained (one day per decision) and *every day is a decision*, not a passive timer.

### The camp screen — a scene, not a menu

Per the [fiction-forward UI principle](RAID_DESIGN.md#presentation--fiction-forward-ui), the camp screen is presented as a **scene**: heroes around the fire, captives in a hut, news being delivered by a gate-watch. Everything the player can do appears as a visible thing-in-the-scene, not a menu item.

### A day's actions

Each day the player sees:

1. **News and offers** brought in overnight (intel about caravans, traders arriving, faction messengers, weather, ambient threats). Some are time-limited; some persist.
2. **Errands** for heroes (see [RAID_DESIGN.md § Errands](RAID_DESIGN.md#errands--long-clock-scenarios-for-idle-heroes-locked)). These are long-clock scenario cards: patrol the road, drink in town, train recruits, run a protection racket, personal errand. Each commits a hero for N days; the engine resolves at the end of the clock with AI flavor.
3. **Camp-and-captive interactions** that need a hero today: question a captive, break a captive, lead the morning drill. Also expressed as scenario cards but with a 1-day clock.
4. **Outside-camp opportunities** — short raids and full raids; pursue a raid lead. Each consumes hero stamina and accrues Fatigue.
5. **Follower duty assignments** (one-time setup, no daily decision once placed): gate-watch, kitchen-help, gallows-keeper, etc. Each follower in a duty provides a passive camp effect.

The core insight: **almost every "daily activity" is just a scenario card with a clock**. Errand scenarios, camp scenarios, raid scenarios — same engine, different clocks. The player drags hero-cards onto scenario-slots; the engine resolves; the AI narrates. The fiction-forward UI displays them all as visible things in the camp scene.

### Idle heroes always have something to do

The errand system guarantees there is never a "useless turn" for any hero — even a fully-rested L40 veteran can take a high-level personal errand or a protection racket. The opportunity cost of using a high-level hero on a trivial errand is its own balancing pressure (that hero isn't available for the next real raid).

### Hero allocation rules

- Each hero takes **one action per day**.
- Heroes left **idle** auto-recover **+1 Fatigue** passively (issue: at Fatigue 0 this is wasted — see [Open issues](RAID_DESIGN.md#open-issues-logged-from-playtest)).
- Outside-camp opportunities consume Fatigue at the per-scenario rate from the raid economy.

### Build and theme (inherited from aistronghold, unchanged shape)

- Construct new rooms (some unique, some buildable multiple times).
- Apply a **theme** to a room; themes determine which follower traits earn bonus prestige.
- Upgrade rooms.
- **New in airaider:** rooms double as Fatigue-recovery facilities. A bath-house, drinking hall, women's quarters, or chapel each modify how heroes unwind. This is the concrete bridge from the inherited fort layer to the new raid layer.

### Staff

- Assign followers to rooms / duties. Each follower contributes prestige and a passive camp effect; followers whose traits match a theme contribute *bonus* prestige.
- Display artifacts in rooms (flat prestige).
- **Each hero has a personal room.** The room doubles as the hero's equipment screen: artifacts and gear cards placed in that room are simultaneously prestige sources for the camp AND that hero's equipped loadout (see HEROES_AND_GROWTH.md Equipment section). This unifies aistronghold's room/artifact system with airaider's lean equipment model — no parallel inventory exists.
- Equip heroes with equipment cards (placed into their personal room — changes raid options, also contributes to fort prestige).

### Plan the next raid

- Browse available **Raid Leads** (analog of aistronghold's Quest Leads). Leads are hooks: "Pay-chest moving north in 9 days", "Christian funerary procession passes Caesina tomorrow", "Frontier governor's tax-equestrian sleeps at the Three-Pines mansio tonight." Each lead has an estimated take, a Heat cost, an optional deadline, and required minimum bench depth.
- Pursuing a lead generates the full raid (AI flavors the scenarios, engine generates structure).
- Pick a party (typically 2–4 heroes from your roster).
- Launch.

### Long-horizon targets pull the loop forward

A locked design observation from playtest: every campaign should always surface **1–3 active "big targets"** with a future deadline (e.g. "pay-chest in 9 days"). These give the player something to *plan around* across many days — turning errand and camp decisions from idle filler into purposeful preparation. Without a big target visible, the camp loop drifts into busy-work.

### Camp prestige — many tiers, content unlocks not power unlocks (Open)

Camp prestige is the campaign's long-arc progression. Each prestige tier unlocks **new content types** (new cards, new errands, new raid leads, new diplomatic options), not merely "stronger versions of the same raids." This is what makes 200+ hours viable: variety, not number-growth.

Approximate tier shape (exact count is **Open** — target 20+ tiers, depends on how many rooms/content modes we end up designing):

| Tier band | Example tiers | What unlocks |
|---|---|---|
| Survival | Hideout, Outlaw Den | Lone-traveler raids, caravan ambushes |
| Mid-banditry | Brigand Hold, Bandit Lord | Villa raids, town strikes, gladiator recruiting |
| Warlord | Regional Warlord, Frontier Rival | Legion engagements, local nobles parley, proxy wars |
| Power-broker | Shadow King, Kingmaker | Assassination contracts, court intrigue minigame |
| Empire-scale | Open Rebellion, Empire Challenger | Province campaigns, march-on-Rome arc, endgame politics |

Each tier should add something *qualitatively new* to the play surface. A tier that only adds bigger numbers does not earn its slot.

### Passive pressure: factions and reputation

The world reacts to the player's actions even on quiet days. Examples implemented in playtest:
- **Heat** rises with each raid and falls with quiet days. High Heat brings investigators (Centurion Petillius in the playtest example) who close on the camp over real days, eventually triggering a defensive raid.
- **Prestige in local villages** rises when raids align with peasant sentiment (burning a Roman official) and falls when they don't.
- **Faction offers** appear unprompted (a slave-buyer arrives, a deserter offers service, a rival warlord sends a demand).

### Why not "end week"?

aistronghold used a weekly tick so that all assigned missions could resolve in parallel. In airaider the **day** is the tick, and *each day is a decision*. No invisible passage of time; no batched resolution. The player feels the calendar advancing because they advanced it themselves, one allocation at a time.

## Micro loop — Raid Phase

The Raid Phase is when the player is *the raid leader*. The player controls the party directly. The mechanic is fully specified in [RAID_DESIGN.md](RAID_DESIGN.md); summarised here:

A raid is a sequence of **3–5 scenarios**. Each scenario is presented as a scene with one or more slots; the player assigns heroes to slots from their party; the engine resolves a **Narrated Pool** check (stat + tag + AI-generated narration line per contribution); outcome band fires. The **climax scenario** offers 2–3 distinct approaches with meaningfully different consequences.

Pressure is twofold: in-raid **Stamina** (each hero has 3 charges per raid, 1 per assignment) and between-raid **Fatigue** (raids exhaust heroes; they need camp time to unwind before the next).

The *shape* of a raid is fixed:

1. **Entry.** The lead's hook, the chosen party, last chance to equip. Launch.
2. **Setup scenarios (1–3).** Single approach each. Build momentum.
3. **Climax scenario.** Multiple approaches; the payoff choice the raid built toward.
4. **Exit.** Resolution screen with loot, captives, fatigue, heat, and an AI epilogue.

There is no separate "extract or push" toggle — the choice lives inside *which heroes you commit at each scenario* and *which approach you pick at the climax*.

### Outcome shape

- **Clean success:** all objectives, full loot, no scars.
- **Partial:** some objectives, some loot, possibly scars or trauma.
- **Failure:** raid aborted, minimal loot, likely scars.
- **Wipe:** party lost. Heroes may die (configurable), artifacts on them may be lost or recoverable on a later "recovery" raid.

## Resolution

After the raid the game returns to the fort and applies consequences:
- Loot enters inventory; followers are added to the unassigned roster; artifacts are available to display or equip.
- Heroes gain XP. Heroes may gain **scars** (persistent traits with mechanical effect) or **traumas** (psychological state that affects future raids until healed).
- Related stories advance (state update, history entry, possibly new lead generation).
- AI generates a short **epilogue** summarising what happened in narrative form. The player consumed the *event*; the AI just decorates it.

Then the player is back in the Fort with new toys and possibly a different roster.

## What the player is *doing* moment-to-moment

| Loop | Player's hands | Player's brain |
|------|----------------|----------------|
| Fort | Slow, deliberate: drag-drop, menu picks | Optimization, collection, planning |
| Raid | Fast, tactical: ability picks, movement, target priority | Reading the situation, risk assessment |
| Resolution | Passive: review screens | Emotional payoff, planning next loop |

This rhythm — slow / fast / cool-down — is the same rhythm Darkest Dungeon, FTL, and Slay the Spire use, and it is what AI Stronghold lacked because the fast layer never existed.
