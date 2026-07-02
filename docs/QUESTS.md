# Lead & Quest Generation

**Status:** Canonical (prototype-2, 2026-06-02). How opportunities appear, become AI quests, resolve, and pay out. This is the crucial core — the generation pipeline that keeps the two boards alive. Builds on [DESIGN.md](DESIGN.md) (the loop/boards), [CARDS.md](CARDS.md) (units/value), and [STORY_ENGINE.md](STORY_ENGINE.md) (the AI craft).

---

## 0. The principle that makes the mechanical and AI halves coexist

**A lead is the engine's cheap *spec*. A quest is the AI's *realization* of that spec on pursue.** At every stage: **engine sets the numbers/constraints → AI fills the fiction** — never the reverse. The two halves ping-pong through one pipeline but never cross.

```
 MECHANICAL                              │ AI
 ───────────────────────────────────────┼──────────────────────────────────
 1. stock lead board                     │
 2. lead = {rarity,level,location,       │
    archetype, chain-info}               │
        — player PURSUES —               │
 3. generate SUCCESS reward (value →     │
    split → generateCard)  [ECONOMY]     │
                                         │ 4. HANDOFF: name/flesh char + write CARD/BIBLE + author ASK
 5. set THRESHOLD                        │
        — Fort Phase: assign cards —     │
 6. END DAY → roll → success/partial/fail│
                                         │ 7. ONE batched call: outcome story +
                                         │    dossier updates + memory-edges +
                                         │    injury severity band (LORE.md)
 8. deliver bundle (full / half+liability│
    / none); map injury band → tiers     │
 9. continue chain / spawn leads         │ (finale → epilogue + sequel lead)
```

## 1. Lead board (mechanical, per-cycle, no AI)

**Leads are EARNED, not restocked** (locked, GENERATION_FLOW §19): the board is fed by
- **Continuation leads** — one per *live chain* that wants to go on; carries the chain's **cached title/hook** (zero new AI cost). How the mechanical board feels connected to the stories.
- **Personal-chain leads** — beat-1 of a newly-joined merc's main chain.
- **Fresh leads** — from **lead-hunting quests** (each region's Scouting lodge unlocks its repeatable hunt), **quest rewards** (scout archetype, interrogation, chain spawns) — rolled by the engine when granted. 🟡 optional small ambient trickle as an anti-starvation floor (designer call).

A **lead** is pure data: `{ rarity, level, region, archetype, chain-info }`.

The **fresh-lead roller** is the "fort dials the board" mechanism — four constrained rolls:
- **region** — from *unlocked regions* (GENERATION_FLOW §13; a region's Scouting lodge opens it + its repeatable lead-hunting quests). The region sets the level band + the casting sub-pool; any finer "location" is just a **lorebook name** on the quest (flavor, not a mechanical unit).
- **rarity** — weighted; the **ceiling rises with prestige**. Mostly common; rare is scarce (and is where known-cast + big rewards live).
- **level** — banded around the roster (always doable work) + occasional stretch.
- **archetype** — the kind of job (raid / capture / rescue / escort / investigate / hunt / contract…), gated by fort capability (capture needs a Dungeon; lead-hunt needs a Scout). Does triple duty: info for the player's pursue decision, a seed for AI generation, and the bias for the reward kind.
- **chain-info** — `none` (common → one-off) or `starts-new` (uncommon+ → will spawn a chain), tilted by rarity.

Fresh leads show **mechanical info only** (no AI teaser) — keeps them cheap and makes the story the *payoff of pursuing* (the "map drop" feel). Leads **expire** (use-it-or-lose-it), and **mercs are the pursue budget** (you can only meaningfully pursue as many quests as you have mercs to send).

## 2. Pursue → quest generation (AI, cost scaled by rarity)

Spend the expensive generation only where the story matters:

| chain-info / rarity | Generated | Cost |
|---|---|---|
| `none` (common) | **no bible** — a light/templated card from {archetype + location}, generic loot | cheap |
| `starts-new` (uncommon) | **genesis a bible** casting **new** characters from the location sub-pool → beat-1 card | full |
| `starts-new` (rare) | bible weaving in **known** characters (the apex) → beat-1 card | full |
| `continues-X` | **load bible X + state** → beat-N card reacting to prior beats; check if at climax → finale | medium |

### Everything is reward-first — a chain is built around a focal character 🔒
The unifying rule: **the engine determines the reward first; a one-off dresses it with a line, a chain builds a whole story around it.** The axis is **one-off vs chain** (`chain-info = none` vs `starts-new/continues`), *independent of rarity*.
- **One-off = reward, dressed.** The engine rolls the loot *first*; the AI writes a thin line to frame it. A one-off has no ongoing fiction to honor — the captive is *whatever tags rolled*, and the AI just frames them ("among the prisoners, a sullen militiaman").
- **Chain = reward, storied.** At genesis the engine **generates the chain's FOCAL CHARACTER first** — the person the saga is about — at the saga's payoff value, plus a **likely fate** (recruit / captive / ally). The AI then authors the bible **around that character** (the "baseline guy"; the AI may flesh them out further; *their tags are the story seed* — a rolled `bg:princess` hands the AI "a crown in exile"). For a **main chain** (merc-join), the focal character is the **existing merc** — the chain develops *them* (a stamped tag, a meaningful event, possibly their death) rather than acquiring someone new. The focal character can be **new or known** (a rare chain's payoff might be re-recruiting a departed merc, or capturing a recurring antagonist — recurrence and attachment become one engine).

This makes the payoff a person you've spent the whole arc with — you *know* them before you get them. The **vague direction** ("likely ends with a powerful recruit") gives the AI a climax to write toward *and* the player a visible long-horizon goal. But the **fate is play-determined**: the engine sets the *likely* outcome, the finale **roll** decides the *actual* one (success → they join clean; partial → they join lesser — saddled with a debt/liability; failure → they slip away / turn bitter captive — you lose them. Injury is the separate AI-judged channel; focal "loss" here is narrative, not roster death — death is ignored in prototype). You can lose the character you spent a saga earning — the gamble stays real. Most chains are character-focal (for attachment); occasionally a chain is built around a non-character prize (a legendary artifact, a faction alliance) for variety.

One-offs are **progression fuel** — the steady supply of tagged captives + gold that feeds the fort — not narrative. Their pipeline: (1) engine generates the **reward at quest-birth** (kind + value + tags, fixed then) + a templated card + ask (zero AI for common; richer for rare); player sees the reward **envelope**; (2) assign → roll → **success / partial / failure**; (3) the outcome **applies a consequence, never rescaling the unit** (success → reward clean; partial → reward + a **negative-gold liability card** — `evidence` / `a mess` / `a debt`; failure → lose the reward; injuries = the AI-judged channel above, any outcome); (4) **one cheap AI call** writes the outcome line (individuating the assigned merc) *and* names/describes any acquired captive. Anti-sameness = varied archetype→ask + the loot lottery, not bespoke prose. No bible, no chain.

The structured card below and the story-first reward flow (§4–5) apply to **chain** quests.

The card is the structured, friendly form (situation / job / stakes) from STORY_ENGINE.md — **plus the ask:**

### The ask — engine owns the slot *count* + threshold; AI authors the *requirements* + what's tested
A quest's party slots are **CardSlots** (CARDS §2) + quest-only data `tested{attribute, favored, clashing}` and `groupId` — the same slot concept rooms use. The **engine** sets the **slot count N** (from the lead's archetype — a duel is 1, a siege is many) **before** generating the reward, because `V` depends on `N`. The **AI** then authors, per slot:
- **what's tested** — the attribute + favored/clashing skills this job checks;
- **slot requirements** — `open` / `must-be <merc>` / `must-have <tag>` (a quest about *Marek's* past pins a *must-be-Marek* slot).

The **engine** then sets each slot's **threshold** per the locked roll (GENERATION_FLOW §10): it rolls a per-slot **difficulty E** (trivial .25 / standard .5 / hard 1.0 / brutal 1.5 / extreme 2.0) → `threshold = E × U(level)/2`; multi-attribute tests pool one unit's tested attributes with the bar ×(n+1)/2. 🛠 the E-roll weights (by rarity/level) = sim-calibrated at impl.
**Party aggregation (pooled — one outcome per quest):** each filled slot contributes `coins(occupant vs its own tested/favored/clashing)`; the quest rolls **Σ coins vs Σ slot thresholds** → success (≥ bar) / partial (≥ 0.6× bar) / failure. Engine owns *how many* + *how hard*; AI owns *who fits* + *what's tested*. The player chooses **who fills the slots**, never how many.

## 3. Fort Phase — assign
Player assigns mercs respecting party size + required units, sees the visible odds (coins vs threshold), commits. No results yet.

## 4. Resolution Phase — one AI call, blind-then-sighted

The engine rolls coins vs threshold → **success / partial / failure**, hands the outcome to the AI. A **single resolution prompt** produces, in order:
1. **before-roll** — the lead-in/tension, written under instruction to **not look at the outcome** (a neutral setup that can't leak it);
2. **after-roll** — what happened, written *now knowing the outcome*.

(No "reward hints" — the reward was already generated at quest birth; the AI only narrates and *names* what's delivered.) Shown to the player as setup → [the dice reveal] → consequence — the dramatic beat of the batched reveal.

## 5. Reward

**The reward is generated at quest birth** (value → split → `generateCard`; full detail in [ECONOMY.md](ECONOMY.md)). The roll only scales it **down**, never rescaling a unit:
- **success** → the full bundle;
- **partial** → **half**: keep the unit + a **liability card** (`evidence`/`mess`/`debt`) sized to net V/2 *(a focal character survives, just saddled with it)*, or give V/2 in gold if it's not worth keeping;
- **failure** → nothing.

**Injury is a separate, AI-judged channel, decoupled from the outcome tier** (GENERATION_FLOW §11, §16-F5): at resolution the AI judges from the fiction whether each party member is hurt and picks a **severity band** (none/low/med/high) — typically on failure, *sometimes none even on failure*, occasionally a minor one on a costly partial. The engine maps band → injury tiers → a flat coin penalty until healed. (There is no "risky" flag; the AI's judgment replaces it. Death is ignored in the prototype.)

So you keep a hard-won focal character even on a *partial* — you only **lose** them on a *failure*. No value-rescaling anywhere; the outcome composes a down-scaled bundle.

**Kind**: the **AI proposes the kind + player-facing label** (a bounded categorical pick — §16 3-producer model), with the archetype as its bias (capture→captive, raid→gold, rescue→recruit); the **engine validates & grants** it from the fixed value budget; multi-kind allowed. Value then **converts**: `value→gold`, `value→character` (the value *is* the character's target value → character-gen, CARDS.md §2), `value→tag-stamp`.

**One-off vs chain:**
- **One-off** — the engine rolls the reward, the AI dresses it (§2). Reward-first.
- **Chain** — the **focal character generated at genesis IS the payoff**, and its value is **accrued over the beats as a merc-day bank** (ECONOMY §5a, [REWARD_BANK.md](REWARD_BANK.md)). Intermediate beats **bank** their merc-cycles (no immediate side-loot; a failed beat banks 0); the **finale crystallizes the bank** into the focal character **+ surplus gold**, the focal's **fate decided by the finale roll** (success = clean · partial = wounded/lesser · failure = lost *and* the bank forfeited). A bank short of the focal's value delivers them **with a debt**, or — if too thin — lets them **slip away** for salvage gold. A per-chain **failure budget** (harder = fewer) turns repeated stumbles into a forced **last-chance** finale rather than an endless retry.

**Character rewards recurse** — a captive/recruit/promoted NPC runs character-generation, and if they become a merc fires the **main-chain** generation. A reward seeds the next story.

*(Cut from prototype 2: cost-to-boost antes — the focal-character payoff already carries the "build toward a bigger reward" fantasy. Noted future option.)*

## 6. Chain advance — organic length, no forced count

- **Birth** — a `starts-new` lead pursued, a **merc joining** (main-chain built around the merc), or a **captive sometimes**. The engine generates **only the 1–2 focal (reward) characters** at `V = rolled unit SHARE (~55–85%) × E[payoff] ≈ V_base(level)×rarity×(B×N)×0.8` (structure per GENERATION_FLOW §1–§2; supersedes REWARD_BANK's maxCharValue; 🛠 numbers) (B = expected beats), **role-agnostic**; the **AI** then fleshes them and **invents the rest of the cast** freely (story NPCs, no value/gen) + writes the bible + a vague direction.
- **Per beat** — the engine sets the beat's slot count + a small side-loot budget; **the AI proposes the beat reward (thematic) → the engine translates it** to value/cards. AI owns theme; engine owns value.
- **Climax gate** — the finale unlocks only once **merc-cycles *spent* ≥ target** (effort, not value-gained — so failures can't stall the chain). Below the gate, a resolved beat spawns a **continuation lead** (pursue or let lapse). Length = `min(player interest, the arc's climax)`.
- **Finale** — the engine hands the AI a **reward recommendation** (the focal char); if the AI decides this beat is the finale, it writes it as **branched approach-groups** (§9) and may substitute the reward if the story diverged. The roll + the chosen branch decide the focal char's **kind + fate** → epilogue → maybe a **sequel lead**.

## 7. Ownership map

| Engine (numbers, constraints, cheap) | AI (fiction, specifics, expensive) |
|---|---|
| lead granting; rarity/level/region/archetype/chain-info rolls | the bible (settled truth) |
| **threshold number**; reward budget | quest card + **the ask (what's tested, party size, required units)** |
| roll coins → outcome (success/partial/failure) | resolution: **before-roll (blind) → after-roll (sighted)** |
| reward VALUE + bundle composition (ECONOMY) | name/flesh the reward character(s) |
| validate & grant reward KIND from the budget | propose reward KIND + label; cast selection |
| chain continuation (spawn lead / expire) | finale epilogue + sequel seed |

## 8. Flowcharts 🔒

**One-off (linear):**
| # | Actor | Action |
|---|---|---|
| 1 | Engine | lead stub `{rarity, level, region, archetype, chain-info=none}` (from a hunt/reward — §1) |
| 2 | Player | pursue |
| 3 | Engine | `N` from archetype; `V = V_base(level)×rarity×N×random-split` |
| 4 | Engine | `splitValue` → bundle; `generateCard` per unit (tags rolled, **role-agnostic**) |
| 5 | AI | HANDOFF: write card + author ask (requirements + what's-tested) + **flesh** framed char |
| 6 | Engine | threshold = f(N, level) |
| 7 | Player | fill N slots (respect requirements) → End Day |
| 8 | Engine | roll → success/partial/failure → **compute delivery** (full / half+liability / none) |
| 9 | AI | ONE call: narrate (before→after) + **flesh/name** delivered card(s) + injury **band** per merc + memory-edges/dossier updates ([LORE.md](LORE.md)) |
| 10 | Engine | apply; map injury band → tiers |

**Chain = genesis (build the bible) → linear beats (quest-writer) → branched finale.** *(GENESIS+BUILD below = two logical stages of ONE AI call — the ≤2-round-trip rule (LORE §3) counts selector + genesis only.)*

### Phase A — Bible genesis (the writers'-room build; full spec in [QUEST_BIBLE.md](QUEST_BIBLE.md))

```
seed bank ──pick(stakes, region, anti-repeat)──┐
fort roster + region pool sample ──────────────┤
engine: focal character @ value V ─────────────┤   focal = the chain's REWARD (main chain → the joining merc)
                                               ▼
              GENESIS    collide seed × slate → one-line KERNEL; pick 1–3 CORE people (focal MUST be core)
                                               ▼
              BUILD      per core person: ask "why?" to bedrock → history;  feels → emergent conceals;
                         COMMIT-TO-TRUTH (settle every fact);  reuse pool first, coin few;  edge cast stay shallow
                                               ▼
              ASSEMBLE   cast{who, history(why-ladder), wants, feels, conceals?} + situation
                         + tensions(who clashes, plain reason) + openDirections{ambient | active}
                                               ▼
                    BIBLE = hidden settled truth   (cast size + ladder depth scale with stakes)
```

| # | Actor | Action |
|---|---|---|
| 1 | Engine | trigger; rarity → **stakes** (sets cast size + why-ladder depth), beats `B`, slots `N`, `V = V_base×rarity×(B×N)` |
| 2 | Engine | pre-generate the **focal character @ V** (role-agnostic tags) = the chain's **reward** *(main chain: focal = the joining merc)* |
| 3 | Engine | pick a **seed** from the seed bank (Polti-anchored "what-if" spark, weighted by stakes/region, anti-repeat); build the **slate** via LORE RETRIEVAL ([LORE.md](LORE.md)): ranked recall over the focal's memory-edges (1–2 hops + wildcards) → optional nano **selector** picks who gets full dossiers (≤2 LLM round-trips total incl. genesis) |
| 4 | AI · **GENESIS** | collide seed × slate → one-line **kernel**; choose **1–3 core** people (**focal must be core**); **write-back folded into the same response**: relevant ids + new entities/places + new memory-edges (engine persists, guarded) |
| 5 | AI · **BUILD** | per core person: ladder *why?* → `history`; `feels` → emergent `conceals` (most conceal nothing); **commit-to-truth**; reuse pool first / coin few; edge cast shallow → `cast` + `situation` + `tensions` + `openDirections` |
| 6 | Engine | persist bible (hidden); spawn **beat-1 lead** from an `active` openDirection (its hook = `drivingHook`) |

### Phase B — per beat (quest-writer reveals one layer; resolver updates the world)

| # | Actor | Action |
|---|---|---|
| 7 | Engine | per beat: set `N` + budget + threshold; hand the **quest-writer** the bible + **chain-state** (*story-so-far*: `currentSituation`, `knownToPlayer`, `openThreads`, `actorStates`) + `drivingHook` + pacing |
| 8 | AI · **quest-writer** | write the **card** (POV-locked — only what arrives at the gate; **reveal ≤ 1 new layer**; state the job plainly) + **assignmentAsk** (qualities/tags, **no numbers**) + hiddenPurpose; propose reward fit. **Attachment: Beat 1 makes the player CARE (a low-stakes shared moment) before plot pressure; escalate from Beat 2.** Judge climax → `closesChain` |
| 9 | Player | fill `N` slots → End Day |
| 10 | Engine | roll → s/p/f → deliver side-loot (**failure bends the future; focal stays SAFE**) |
| 11 | AI · **resolver** | narrate (individuate each merc by tags + dossier); update chain-state (`newlyRevealed`, threads, `actorUpdates`, `currentSituation`). **Bible PAST is immutable; outcomes bend the FUTURE only** |
| 12 | Engine | **CLIMAX GATE: merc-cycles *spent* < target → continuation lead, loop (→ 7)**; else finale |

### Phase C — branched finale

| # | Actor | Action |
|---|---|---|
| 13 | Engine | hand AI the **finale recommendation** (focal char, value V) |
| 14 | AI | finale card as **mutex approach-groups** (§9); may substitute reward if story diverged |
| 15 | Player | **pick one approach** → fill its slots → End Day |
| 16 | Engine | per-approach threshold; roll → s/p/f → **deliver focal char in the chosen KIND**, gated by roll |
| 17 | AI | finale outcome + epilogue + maybe sequel lead |

**Solidity rules baked in:** (a) slot **count N is engine-set** (V needs it at birth, before the AI); (b) engine **computes delivery before the AI narrates** (so it names what's actually delivered); (c) the **climax gate is on merc-cycles spent** (effort), not value gained (else failures stall the chain); (d) the **bible is plain settled truth** — mystery/reveal-cadence is the quest-writer's job at beat time, never baked into the bible.

## 9. Branches — mutex approach-groups 🔒-shape *(prototype: finale only)*

A quest can be resolved multiple ways via **mutex approach-groups** — the player's choice of *which slot-group to fill* is their approach (no mid-quest choices). Each group has its own `{ slots + requirements, what's-tested, threshold, reward KIND }`, and the player sees each branch's envelope before committing.

**Branches determine the reward KIND (either-or).** The engine generates the focal unit's **value/tags once, role-agnostic**; each approach realizes it as a different *form* — same value V:
```
 finale card
   ├ "Win them over"  → CHA test → MERC
   ├ "Subdue them"    → STR test  → CAPTIVE
   └ "Ransom/sell"    → easy test → GOLD (value V)
   (partial = the lesser/saddled version of that kind · failure = lost)
```
Double-axis decision: *which test fits my roster?* + *which reward form does my fort need?* For a chain, the finale branch is the attachment-meets-agency beat — *welcome them / cage them / sell them*, after a whole saga.

**Prototype scope = branches at chain FINALES only** — and that's mechanically *right*, not just simpler: a one-off's `V` depends on `N`, so per-branch `N` would make `V` depend on an unchosen branch (circular). At a **finale, `V` is already fixed at birth**, so the approaches only choose *kind* + *test*, never value — no circular dependency, no re-generation. 🟡 Branches on arbitrary quests = later work.

## 10. Open forks 🟡

- **Common `none` quests: templated (zero AI) or one cheap AI call?** *Lean: templated card + a tiny AI flavor line — cheap variety.* (This is the next thing to design.)
- **Fresh lead: pure mechanical stub or a one-line teaser?** *Lean: pure stub — cheaper; story is the pursue payoff.*
- **Rare/known-cast cadence** 🟡 — the rarity weights + prestige→ceiling mapping set how often the apex known-cast quests fire; pick a target ("a known face every ~N cycles per act"), derive weights, sim like §20.
- **Latency & reading load** — the batched Resolution fires many AI calls at once (needs pre-generation + parallel resolution), and prose volume × roster width × 3-min-cycle is a three-way tension: enforce word budgets by rarity (commons ≈ one line) and MEASURE real minutes/cycle in the first playtest before trusting §20 hour figures.
