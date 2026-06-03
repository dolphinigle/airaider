# PROTOTYPE DOCTRINE — read this before touching airaider code

> **This whole repo is a THROWAWAY PROTOTYPE.** When the design is proven fun,
> the real game gets rebuilt from scratch. Nothing here ships. Optimise for
> **design-learning per hour**, not robustness.

If you ever catch yourself writing any of the following, STOP — you have drifted
back into production thinking:

- schema-version migrations / "don't break old saves"
- feature flags / build-alongside-the-old-path
- async job queues to hide latency
- "source of truth vs projection" authority dances
- defensive layers for inputs we fully control
- abstractions "for when we scale"

A prototype's only job is to answer a DESIGN question fast: *is this fun?* The
cheapest code that lets a human (or an AI) **playtest** the experience wins.
Delete freely. Hard-code freely. One save file, blow it away when the shape
changes. Text UI over GUI — it iterates 10x faster and we playtest via console.

---

## The one design question this prototype must answer

> Does an AI-driven, character-driven **quest chain** over a **persistent,
> recurring cast** feel good to play? Specifically the two hard parts:
>
> - **Character management** — a living pool where the same faces return across
>   chains; quest outcomes mutate them; rewards fold NPCs into your roster.
> - **Logistics** — multiple chains running at once; assigning limited mercs;
>   cadence over days; chains opening, advancing, closing, spawning sequels.

Single-chain *readability* is already proven (storyGen, user-approved). What is
NOT yet proven is the **campaign**: recurrence, rewards, cadence, growth.

---

## What already exists (reuse, don't rebuild)

All under `engine/server/src/`:

- `storyGen/genesis.ts` — author a hidden **bible** by colliding a seed with the
  pool (why-ladder cast, situation, tensions, openDirections). VALIDATED.
- `storyGen/questWriter.ts` — turn a bible + chain-state into a **POV-locked
  quest card**, then **resolve** an outcome tier into aftermath + state merge.
  Engine-owned **pacing** (`TARGET` by stakes). VALIDATED + user-approved.
- `storyGen/ai.ts` — `makeClient` + `callJson<T>` (gpt-5-mini/nano).
- `storyGen/seeds.ts` — seed bank + `Stakes` (uncommon/rare/legendary).
- `chainBible/characterPool.ts` — `PoolCharacter` + `CharacterPool` (persistent
  JSON registry: cachedPrefix = your mercs, regionSample, arcState, role
  promotion). This IS the character-management substrate.
- `engine/server/data/seed_pool_mireford.json` — the starting world cast.

These are scattered CLI scripts today. The missing piece is a **campaign driver**
that ties them into ONE persistent, playable loop.

---

## The prototype game: "Chain Campaign" (text REPL)

A single scriptable text loop (`npm run campaign`) over one save file.

**State (one JSON):** `{ day, gold, pool: PoolCharacter[], chains: ChainRun[], log }`
- `pool` seeds from `seed_pool_mireford.json`; your mercenaries are
  `role:'mercenary'`, the world is npc/captive/landmark.
- `ChainRun = { id, bible, chainState, stakes, stepIdx, openQuest?, status,
  reward }` — one running story.

**Loop / commands:**
- `status` — day, gold, your mercs, each active chain + its open quest card.
- `offer` — the world offers a new chain (genesis a bible from a seed + pool,
  write its first quest card). Also fires on day-advance.
- `assign <chain> <merc...>` — commit mercs to a chain's open card.
- `resolve <chain>` — **engine** scores assigned mercs' stats/tags vs the card's
  `assignmentAsk` (+ rng) → an outcome **tier**; AI writes the aftermath; chain
  advances (next card) or closes (epilogue + reward fulfils into the pool).
- `day` — advance; ambient world movement; maybe new offers.
- `save` / `load` / `quit`.

**Engine owns numbers, AI owns flavor** (CANONICAL_DESIGN §1):
- engine: merc-fit score → outcome tier, gold amounts, pacing, reward KIND.
- AI: all prose, names, the quest card, who the reward recipient is.

**Rewards (lean, meaningful in a roster game):**
- `promote_to_merc` — a chain NPC joins your roster (pool role npc→mercenary).
  *This is the headline reward: it makes the recurring cast tangible.*
- `unique_trait_on_merc` — stamp a tag onto an assigned merc (growth).
- `gold`.
Captive/dungeon/prestige rewards come later only if the loop proves fun.

**Why this proves the design question:**
- recurrence — promoted NPCs and arcState-updated faces re-enter later chains'
  casts via `cachedPrefix`/`regionSample`.
- character growth — mercs gain traits; their `ghost/lie` can anchor a unit chain.
- logistics — several chains compete for your finite mercs across days.

---

## Build sequence (lean — each step ends in a playtest)

0. **Export the generators.** Lightly refactor `genesis.ts` + `questWriter.ts`
   so their core functions are importable (`buildBible`, `writeQuest`,
   `resolveQuest`, `mergeChainState`, `pacingFor`) — keep their `main()` CLIs
   working as thin wrappers. No new behaviour.
1. **Campaign state + engine.** `storyGen/campaign.ts`: state type, save/load
   (reuse CharacterPool for the pool), merc-fit → outcome tier, gold, reward KIND
   selection. Pure, unit-testable.
2. **REPL.** `storyGen/cliCampaign.ts`: the command loop above; scriptable via
   stdin so an AI can playtest. Wire `npm run campaign`.
3. **One chain end-to-end.** offer → assign → resolve → advance → close →
   reward → recur. Playtest by reading it as a player.
4. **Rewards fold into the pool.** promote_to_merc + unique_trait; confirm the
   promoted face returns in a later chain's cast. Playtest recurrence.
5. **Multi-chain cadence.** 2–3 concurrent chains over several days; finite
   mercs; abandon a chain. Playtest logistics + fun. Tune.
6. **Unit chains (if loop is fun).** a merc with a ghost/lie anchors a chain
   about them; a closed chain with loose threads spawns a sequel.

Stop and ask the user to playtest at steps 3 and 5 (the fun checkpoints).

Anything not on this list is out of scope until the core loop is proven fun.
