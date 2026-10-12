# Story Engine — Behind the Board

**Status:** Canonical (prototype-2, 2026-06-02). This is the AI machinery that keeps the board alive. It sits **entirely behind** the board described in [DESIGN.md](DESIGN.md) — the player never interacts with it directly. Grounded in the validated v1 `storyGen` prototype (`prototype/src/storyGen/`); this doc says what to keep, what to fix, and how it serves the core game.

Principle inherited from the whole project: **the engine owns numbers, the AI owns flavor.** The AI is asked *what qualities* a job wants and *who* a reward fits — never the DC, the gold, or the odds.

---

## 1. What the engine does (three invisible jobs)

The story engine never presents a "story mode." It works behind the board:

1. **Feeds** the board through earned channels only (continuations, lead-hunts, priced reward grants — QUESTS §1), fitting the fort's capabilities and prestige, cast at the right tier.
2. **Connects** quests — a finished quest can drop its next step back onto the board as a lead; the player chooses to pursue it or let it lapse, so **story length is organic** (driven by pursuit, never an engine beat-count).
3. **Grows** characters — every quest a character touches becomes part of who they are; a strong-hook character becomes the *subject* of quests.

---

## 2. The hidden bible (keep — validated) 🔒

When a story is born, the AI authors its **complete settled truth** up front — a hidden "bible" the player never sees. Because the ending already exists, downstream beats can foreshadow honestly instead of ass-pulling. This is the single most validated idea from v1 and it stays.

Key disciplines that made it work (preserve):
- **Settled truth, told straight — not a mystery.** The bible states what is *actually* true. Mystery is added later by the quest-writer choosing what to reveal.
- **Cast drawn from the pool** (per the tier rules in §3), with new people coined only when no existing character fits a role.
- **Ordinary motives; few secret-bearers.** Most people are exactly what they seem; 1–2 conceal anything, and only when a feeling makes hiding natural. (This replaced the old `want/need/ghost/lie/secret` 5-tuple, which made everyone a workshop construct. Do not bring it back.)

---

## 3. Casting tiers by rarity 🔒

Casting from known characters is the **rare apex, not the default** — this controls both attachment and token cost:

| Rarity | Cast | Purpose |
|---|---|---|
| **Common** | none — generic ("raid an unnamed village") | cheap, mechanical roll for loot; barely needs the AI |
| **Uncommon** | a **new** generated cast | world variety; mints fresh faces |
| **Rare / special** | weaves in **characters you already know** | apex attachment — *deliberately scarce* |

New faces from uncommon quests **persist in the pool** (survivors, notable NPCs, un-killed antagonists). They later get captured, recruited, or brought back in a rare known-cast quest. So the world **populates itself**, and the scarce known-cast peak lands precisely *because* it's rare.

---

## 4. The character record — how depth stays affordable 🔒

A character's depth comes from the chains they've lived through — but you can't feed all their chains into a new quest's prompt (token blowout). So the record stores a **distillation**, and the chains keep refilling it:

- **The living document** (LORE §1b, designer 2026-10-12): tags (= personality) and quirks from the card, plus **Identity** (fixed keys, very rarely rewritten), **Blurb** (≤~25 tokens, cacheable), **Brief** (the short version) and **History** (the bounded, told past summary), both AI-rewritten whole at each chapter close: *the compact summary of the chains they're in*. Not a separate psychological model. The backstory itself lives in the mercenary's linked **arc**, a story node (LORE §1b: Blurb and Brief told only, the full text only in their own arc and chapter calls).

**Token discipline at generation time:**
- Always feed the **stable identity** for the relevant pool — small and prompt-cacheable.
- Feed the **Brief** (the short version) only for the characters the chapter plan's picker picks (LORE §3).
- Feed only a **one-line surface** for the wider "casting pool" the AI picks supporting roles from.

### Characters are story-seeds
A character is self-contained from birth, so the AI can grow a **new** story about them later. When a merc joins, a **main chain** is generated for them (their personal arc), seeded by their record. When that story resolves, it distills back into the living document, so their *next* chain reads a richer them. This is the recurring-personal-arc engine — the core of attachment. It rides the existing genesis "collision" mechanism (pick the character a spark lands hardest on; anchor the chain to them).

### The mercenary's arc, backstory and "opening up" (designer 2026-10-11; GENERATION_FLOW §22)
- **Hierarchy: arc → chapter → quest.** An **arc** is a story made of chapters: one per mercenary (later maybe recurring NPCs or world arcs). It is not playable (no quests). A **chapter** is one playable story; a personal chapter serves one open thread of an arc. A **quest** is one job. Not every chapter has an arc (hired/client chapters stand alone) and not every quest has a chapter (one-offs stand alone). **"Arc" is the general name** (a mercenary's arc begins from their backstory; later maybe an NPC's arc, or a world arc such as a war). ⚠ **Naming in prompts** (designer 2026-10-11): code and docs say arc → chapter → quest, but **a prompt that generates a standalone chapter still says "saga"** (e.g. "A saga is like the backbone of a novel"), because "chapter" alone would confuse a model with no context. Only the prompt that writes a mercenary's arc uses "arc" and "chapter" ("an arc … split into chapters"). Never write "an arc made of sagas" in a prompt (in plain English an arc sits *inside* a saga, which misleads a model with no context). Prompt wording (designer fix 2026-10-12): "An arc is the story of one mercenary, from their past to who they become. The game splits it into chapters, told over time as the mercenary opens up to the captain. Each chapter is played as several quests and ends with a resolution of its own: it settles one of the arc's unfinished matters, or part of one. Only the final chapter may resolve the whole arc, though it does not have to; after it, the game writes the mercenary a new arc. The player learns the mercenary's past only as they tell it: at first only what they would admit to anyone; the rest comes out in the chapters." (Names weighed 2026-10-11: series, chronicle, cycle, campaign; arc kept.)
- **The arc holds:** the past (the backstory), the people from it, and the **open threads** in ladder order (told → secret, small → deep); each thread carries its status (open / resolved / changed) and a link to the chapter that took it up; each personal chapter links back to its thread. The **backstory cap** is computed from the resolved threads (nothing stored).
- **The arc is written once, at recruit:** the mercenary's past, plus its **open threads**: matters left unfinished (who is involved, what is unresolved), each either told (they admit it) or secret (it comes out only when they open up). The threads live in the arc, not in the living document. Later, only links and thread statuses are added.
- **The living document stays bounded** (LORE §1b): Brief and History are rewritten whole, never appended. A whole chapter is its own chapter record. Where the mercenary's story stands (the **"so far"**) lives in the arc, rewritten at chapter close.
- **Opening up:** over time a mercenary opens up to you and gets a personal mini chapter grown from ONE open thread, which resolves it or part of it. They go on every quest of it (must-be, STORYTELLER). Each resolved thread raises their **backstory cap**; their **level cap = min(backstory cap, bedroom cap)** (CARDS §Level). Once every thread is resolved the backstory cap is maxed; later personal chapters play as ordinary chapters and only **rarely** give the mercenary something permanent (🟡 what: undecided).
- **Two arc calls, picker → writer** (designer 2026-10-12; same split as the chapter plan). **Two versions:** a mercenary who has **just joined**, and one whose **last arc just ended** (the game writes them a new arc; its input 🔒 designer 2026-10-13: the mercenary's card line + Blurb + History, **how the last arc ended = the finished arc node's Brief only, never its full text** (the arc's full text is the plan written at recruit; once played it is stale, since the Brief and the "so far" are rewritten at every chapter close, the Brief is the record of what actually happened), and their strongest ties offered for reuse as known entries, as in LORE §3). The prompts reuse the chapter plan's preface (world + company paragraphs verbatim) plus one arc paragraph: "…Only the final chapter may resolve the whole arc, though it does not have to; after it, the game writes the mercenary a new arc…".
- **The arc picker's input** 🔒 (designer 2026-10-12): the mercenary (card line + how they joined); NPCs, places and words dealt as for a chapter; **no region line** (an arc does not take place in one region: places are dealt from several regions, grouped by region; the unit's home region is engine-given unit data); **backstory kinds**: ~5 dealt from a pool of EXTREMELY generic kinds ("unresolved past", "traumatic event", "vengeance", "guilt", "betrayal"…), the picker picks one (it tends to follow the mercenary's traits: fine). **Known lore** (2026-10-13, LORE §3, STORY_PROMPTS §0): the mercenary's own edges (the chapter that recruited them, its people) + a random draw of the world's known nodes, tagged `(known)` beside the new ones; the picker picks the ones it wants to know more about. **Rarely** dealt, each with its picker line only when dealt: **a fellow mercenary** from the company (dealt as a known person) (roll ~15% 🛠, then one merc weighted by 1 / (1 + their edges to other units), so a merc already tied to many units is rarely tied again) and **one relic** (~15% 🛠). No troubles (the backstory kind replaces them). Picker replies: backstory, [mercenary], npcs (1–3, each with their tie to the mercenary, not their traits), [relic + a name], places (1–2), words. Lab checkpoint: STORY_QUALITY "Arc picker A7".
- **Arc rewards** (designer 2026-10-12): **every arc and every personal chapter carries a reward**, and an arc's reward is calculated **the same way as a chapter's** (QUESTS §5, ECONOMY §5a, GENERATION_FLOW §1–§2, REWARD_BANK), including the **banked future reward**: at arc creation the engine computes the arc's E[payoff] (over its expected chapters 🛠) and **mints the arc's final reward up front** (a unit at a rolled share × E[payoff], the rest gold), so the arc can be written around it; the picker picks which dealt reward it is and who (from ~5 dealt, as for a chapter) and the writer earns it in the final chapter. Each chapter of the arc **banks** toward it; the final chapter **crystallizes** the bank (its roll decides the reward's fate; a short bank = a debt or the reward slips away, as for a chapter). The engine sets every gold value. The **level-cap raise is itself priced in that value**: while a chapter raises the backstory cap, part of what it earns goes to the raise, so the material reward is smaller; once the cap is maxed nothing goes to the raise and the material reward grows by that share automatically. (Lab: an arc seeded with its final reward beat the same arc without it 8–2 blind; STORY_QUALITY.)
- **Only the chosen OPEN thread is sent** as the chapter's matter; resolved threads are never sent as a seed (handed a settled matter, the plan retells it: STORYTELLER chain-B measurement, 8 of 8).
- **Feeding by relevance** (token discipline; the role sets the ceiling, the plan's picker chooses within it, LORE §3): merely named (casting pool, one-offs) → the one-line blurb · picked into a chapter plan → + the Brief (the short version) · **their own opening-up chapter → + the History, the FULL backstory (the arc) and the chosen thread**. The full backstory is never fed anywhere else. **Quest writers get no lore dump** (LORE §3b): only their part of the plan, plus each assigned mercenary's gameplay state and identity values changed since the plan (known only after the plan was written).
- 🟡 open: what triggers opening up; how many threads; whether a resolved chapter may add new threads; the backstory cap's start and steps.

---

## 5. Generation triggers (cost-gated) 🔒

AI story generation is expensive, so it fires only on:

1. A character **becoming a merc** → generate their **main chain**.
2. A **captive** joining → **sometimes** (cost-gated).
3. **Pursuing a lead** → generate the quest (a new chain, the next beat of an existing one, or a generic one-off — per the lead's `chain-info`).

Generation is split across the cycle: the quest **card** (setup) is written at pursuit (Fort Phase); the **outcome** (resolution) is written in the Resolution Phase.

---

## 6. The quest card (fix the v1 weakness) 🔒

v1 cards read unfriendly and "didn't feel like a quest" because the prompt licensed *"vivid and literary"* voice and crammed the job into one oblique prose blob. The fix:

**Structure it** — the job becomes structural, not buried. The card has explicit parts:
- **Situation** — the grounded POV hook (who arrived at the gate, what they say/show). 2–4 short sentences.
- **The job** — one plain line: the concrete action you commit to ("escort the salt barge to Coldfen and bring back the seal"). This is what makes it *feel like a quest*.
- **The ask** — what qualities it wants, in plain fiction, backed by the mechanical tags/attributes the engine reads.
- **Stakes** — the reward envelope, the risk, and the **visible odds** once assigned.

**Fix the voice** — replace "vivid and literary" with **terse, plain, concrete, inviting — graspable in ~10 seconds.** Short sentences; no purple atmosphere; no oblique withholding. The reconciling principle:

> **Mystery lives in the cause, never in the task.** The player may not know *why* the barge matters — but must never be confused about *what they're being asked to do.*

**Keep** from v1: POV-lock (only what arrives at the gate; no omniscient narration), continuity from prior beats, reveal one layer at a time, engine-owns-numbers (no AI numbers in the card).

---

## 7. Individuated resolution (the differentiator) 🔒

The outcome is where "each character does something uniquely their own" must land. The resolver is told the outcome (**success / partial / failure**) and the assigned cast, and must **give each assigned character their own distinct beat, driven by their tags + quirks + dossier — never narrate the party as a blob.** Same terse, concrete, readable voice as the card. Reveals only what the outcome permits; the bible's past truth is immutable — outcomes bend only the future (who now knows what, who reacts, what is set in motion). The resolver also judges each assigned character's **injury severity band** (none/low/med/high) from the fiction — any outcome, decoupled from the tier (GENERATION_FLOW §11/F5); the engine maps the band to tiers. Partials' liabilities are engine-composed.

### 7a. The roll IS the dramatic beat 🔒 (the heartbeat)

This game is a **gamble** (VISION §1: "read the odds… pull the lever"). The roll isn't a hidden calculation between two paragraphs — it is the emotional pivot of every assignment, and the resolution must be *staged around it*, not narrated past it. The rhythm, three movements:

1. **Buildup → the brink.** The scene sets, the **challenge materialises** (the wolf rises from the reeds; the creditor's men block the lane; the lock resists), and the chosen merc *commits*. End on the **held breath** — the instant before fate decides, blade raised / question asked / weight thrown — and STOP. Do **not** hint the result. *("Marek steps into the clearing, sword low. The wolf rises, hackles up, and gathers itself to spring—")*
2. **The roll — shown.** The dice/coins resolve *here*, visibly (odds were readable before commit; now the verdict lands: heads vs threshold → success / partial / failure). In the GUI this is a beat the player watches; in any surface, the roll is a **revealed moment**, never skipped.
3. **Consequence → flows from the verdict.** Now narrate what the dice decided, with weight — each merc true to their tags; what is won/lost; **what is learned (scaled to the outcome — see §7, resolution decides)**. Success clean · partial at a shown cost · failure fails and a consequence lands.

Why it matters: the buildup makes you *feel* the stakes you gambled on; the visible roll is the lever you pulled paying off or not; the consequence is the story the dice wrote. Skip the brink and the roll is just a coin-flip with flavour text — the thing that makes it FUN is that the prose holds its breath with you. **Keep the resolution generous** here (this is the payoff moment; terse elsewhere, but not here). Engine owns the odds + the verdict; the AI owns the buildup and the consequence around it.

---

## 8. Chains, recurrence, and chapters 🔒-shape

- **Everything is a chain.** A common quest is a 1-beat chain with no follow-up; rarer ones run longer and spawn sequels. There is no separate "chain vs quest" category for the player.
- **Organic length.** A story continues only while the player keeps pursuing its "continue" leads; it ends when it's spent or the player lets it lapse. The engine never forces a beat count.
- **Recurrence & chapters** (a mercenary's arc: §4, arc → chapter → quest) — the standout magic from v1: a finished chain's loose thread + a cast member seeds the next chain; the dead stay named; a freed captive returns chains later as a witness; a merc's arc runs A → B → C, each richer. This is where attachment compounds. Lift it directly.

---

## 9. Model tiers & latency 🛠

Validated split (keep, revisit model names as they update): a **stronger model** for the prose tiers (bible, card, resolution) and a **cheap fast model** for the mechanical tier (the lore selector, tag extraction — fit itself is engine `overlap()`, never AI). Generation is cost- and latency-bound, so:
- Pre-generate where possible (e.g. draft the next likely card during the Resolution read).
- Background long generations behind a visible "drafting…" affordance — never freeze the UI.
- The batched Resolution Phase fires many resolutions at once; parallelize them.
- **Scope (designer ruling 2026-07-17): parallelizing/backgrounding AI calls is REQUIRED for
  the non-prototype build** — a blocking ~1-minute genesis on a click is not shippable; hide it
  behind pre-generation, background jobs, and parallel fan-out. **The prototype is exempt**:
  serial blocking calls with pending-state feedback are fine (design-learning per hour beats
  robustness there).
- ⚠ **Under revision 2026-08-26 — see [TEMPO.md](TEMPO.md).** Play overturned the exemption: the
  designer's report is *"lots of waiting making the prototype very awkward to play"*, and the measured
  blocking waits are 10s a pursuit and **50–66s to start a chapter**. TEMPO.md holds the goals; this
  bullet is amended once they are approved.

---

## 10. Prompt engineering — the 5 principles 🔒

Every prompt obeys five principles (and *only* these are principles — everything in §11 is tactical, added only when real testing shows a problem):

1. **JSON / structured output** — schema-validated JSON, prose in string fields, validate→fallback. **Min *and* max length caps** on prose (max is a hard cost guardrail so output can't run away on price).
2. **Cache** — a **byte-stable system prompt** (schema + instructions) so it's prompt-cached; **all variable data goes in the user message** (never interpolated into the system prompt); order stable→volatile to maximize the cached prefix.
3. **Token efficiency** — max caps + **compact inputs** (tags as codes, one-line blocks) + maximize cache hits + **minimize calls** (combine related generation into one call when it shares context/model; split only when a *different model* genuinely pays for itself). *(Do not split into "one responsibility per call" — that multiplies cost.)*
4. **Engine owns numbers** — no numeric fields the AI fills (no DCs, gold, thresholds, values); the AI authors *qualities*, never *magnitudes*. **Tags cross the AI boundary in the locked format** (GENERATION_FLOW §9b): `word (rank)`, ranks **low/mid/high/legendary** — bare words, no group labels, no integers; enchantments render via label.
5. **Right model / effort** — prose tier vs mechanical tier, reasoning-effort per call (§9, AI_PROVIDER).

## 11. Tactical fixes (apply only when testing shows the problem — NOT principles)

Empirical fixes from v1; reach for these when real output misbehaves, don't bake them in pre-emptively:
- **Anti-cliché ban lists** work better than abstract "avoid clichés." Ban concrete tokens (`weight`, `shadow`, `burden`, `fate`, `the spoils`) and title patterns (`The Weight of X`, `Whispers of X`); require concrete proper nouns in titles and hooks.
- **Anti-repetition** — forbid reusing 3-word phrases across a chain's beats; introduce a character by full name once, then first-name only.
- **Cross-story name collision** — pass the names/factions of *other* active stories as "avoid" so parallel chains don't all use "the Grey Crawlers."
- **Voice tiers** — hidden/bible fields are clinical ("state what is"); player-facing card + resolution are vivid-but-terse. Mixing them degrades both.
- **Onboarding** — never leak the hidden trajectory into beat 1. The player is always at their fort discovering a lead with zero context; earn each named character on-stage.

---

## 12. The engine/AI boundary (never cross it)

| Owned by the engine (numbers) | Owned by the AI (flavor) |
|---|---|
| coin count, threshold, outcome, odds; roll ALL names (§4b) | the card, the prose, the outcome |
| gold, drop rates; validate & grant the reward kind | **propose** the reward kind + label (F6); which cast member gets it, how the climax delivers it |
| pacing trigger (which leads appear) | the bible, the cast's wants |
| fit score → outcome tier | how each character's tags color what they did |

Every AI response is validated against a strict schema + engine constraints; invalid IDs/tags/lengths trigger a fallback, never a crash. This is what keeps the system debuggable and cheap.
