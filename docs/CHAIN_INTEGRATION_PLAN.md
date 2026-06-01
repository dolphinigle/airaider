# Quest-Chain Integration Plan — wiring the validated storyGen pipeline into the live game

> **Status:** PLAN (not yet implemented). Created 2026-06-01.
> **Supersedes the build sequence in:** QUEST_CHAINS.md §18.9 (refines it with a
> safer, additive sequencing after a rubber-duck review).
> **Read first:** QUEST_CHAINS.md §18 (target architecture — character pool + bible),
> §17 (playtest learnings), CANONICAL_DESIGN §1 (engine owns numbers, AI owns flavor).

---

## 0. What this plan is

The TARGET architecture (persistent character pool + hidden story bible → stepwise
player-facing quests) is already designed in QUEST_CHAINS.md §18 and has been
**validated end-to-end** as a standalone experiment in `engine/server/src/storyGen/`
(`genesis.ts` authors a bible; `questWriter.ts` turns it into POV-locked quest cards
+ resolutions). The user has read and approved the questWriter output.

This document is the **integration plan**: how to fold that validated generator into
the LIVE game (`engine/server` Fastify API + `prototype/` game-logic core + the React
GUI in `engine/web`), focusing on the two hardest areas the user flagged:
**logistics** (spawning, surfacing, assigning, resolving, advancing, persisting chains)
and **character management** (a unified character registry that quest outcomes mutate
and rewards fulfil into the roster).

---

## 1. Current state — what exists, what is missing

### Three quest representations (today)
1. `prototype/src/quests.ts` — old hand-authored multi-stage `Quest` (scenario-id stages). Legacy.
2. `prototype/src/questChain.ts` — `QuestChain` TYPES + pure helpers: hidden `skeleton`
   + `anchors` + `stepBeats`, player-facing `title`/`hook`, `steps[]`, `currentStepIdx`,
   `status`, `epilogue`. **This is the LIVE chain shape.**
3. `engine/server/src/storyGen/` — the NEW validated bible→quest-card generator. **Not wired.**

### Live chain pipeline (production)
- `engine/server/src/chainOrchestrator.ts` — `trySpawnWorldChain` / `trySpawnUnitChain`
  (genesis), `spawnPendingStepLeads` / `spawnStepLead`, `advanceChainAfterResolution`,
  `finalizeChain` (epilogue), `maybeSpawnFollowup`.
- `engine/server/src/aiQuestChain.ts` — `generateChainGenesis` (authors skeleton+anchors+
  stepBeats), `generateChainStepBlurb`, `generateChainEpilogue`, `summarizeStep`.
- `engine/server/src/dispatch.ts` — command handlers (`end-day`, `pursue-lead`,
  `assign-slot`, `accept-applicant`, `abandon-quest`, `debug-spawn-chain`). `end-day`
  drives chain advance + `spawnPendingStepLeads`.
- GUI: `engine/web/src/components/QuestChainPanel.tsx` (chain summary/next beat),
  `QuestPanel.tsx` (assign-slot). React → `POST /api/cmd`, `GET /api/state`.
- Text: `prototype/src/cliGame.ts`, `cliDay.ts`, `cliQuests.ts`.

### The validated experiment (storyGen/)
- `genesis.ts` — LEAN bible: `{title, leadBlurb (mundane, leaks nothing), cast[] (per-person
  why-ladder: history bullets, wants, feels, conceals), situation, tensions[],
  openDirections[] (ambient|active)}`. Built collision → why-ladder → **commit to the truth**.
- `questWriter.ts` — stepwise quest cards: **POV-locked** (only what arrives at the fort;
  no omniscient narration of unmet NPCs), **plain job statement**, **"allow ending, never
  force early"** pacing (engine sets target/max from rarity; writer writes the finale AS a
  climax), mutable `chainState` (knownToPlayer ledger + open/closed threads + actorStates),
  reveal discipline (symptoms not causes). Outcome tiers: `clean_win | narrow_win | partial_loss | failure`.
- `chainBible/characterPool.ts` — `PoolCharacter` (id, name, region, role, tags, surface,
  want, need, ghost, lie, secret, arcState), reading a `/tmp` JSON pool.

### Also present (diverging) — to resolve
- `chainBible/biblePipeline.ts` + `chainBibleExperiment.ts` — a DIFFERENT, richer bible
  (backstoryThreads/conflictingInterests/looseThreads/vignettes/texture/setupPayoffs), the
  shape documented in §18.4. **Two bible generators diverge.** See Decision A.

### What is MISSING for integration
- No `CharacterPoolService` in the live game (storyGen reads `/tmp`; roster has
  mercs/captives/deceased/applicants/hirePool but no unified registry with ghost/lie/arcState).
- storyGen generators are not called by the orchestrator; live still uses skeleton genesis.
- Bible cast entries have **no stable pool IDs** (only names) — blocks rewards/arcState/deaths.
- No quest-card snapshot shape; `pursue-lead` materialises a generic `templateFor(lead)` scenario,
  so the authored card would not actually be the thing resolved.
- No band→outcome-tier contract; resolver emits 4 sultan bands, questWriter expects 4 tiers
  encoding a different axis (success vs complication).
- No reward-spec fulfilment dispatch; no arcState write-back; no async handling for 20s genesis.

---

## 2. Design decisions (surface to user before building)

- **A. Bible shape.** storyGen LEAN why-ladder bible (latest, user-praised, POV-clean) vs the
  richer §18.4 bible (world-density: vignettes/texture/setupPayoffs) vs a merge.
  **Recommendation:** standardise on the storyGen lean bible as the base; treat §18.4
  world-density fields as an OPTIONAL later enrichment, not a blocker. Delete/retire the
  divergent `chainBibleExperiment.ts`/`biblePipeline.ts` once the lean one is wired.
- **B. Replace-in-place vs build-alongside.** **Recommendation:** build the new chain module
  ALONGSIDE the old one, additive schema fields, switch the orchestrator to it behind a flag,
  delete the old skeleton path only after the GUI slice is green.
- **C. Scope of THIS pass.** Full §18.9 vs world-chain MVP. **Recommendation:** world-chain
  MVP end-to-end through the GUI first (Phases 0a–6), then unit chains + follow-ups + CLI.
- **D. Pool persistence + authority.** **Recommendation:** roster stays MECHANICALLY
  AUTHORITATIVE; the pool is a NARRATIVE PROJECTION persisted on roster (schema v14) and kept
  in sync via hooks. Pool is not the source of truth for gameplay state.

---

## 3. Refined phased plan (post rubber-duck)

> Sequencing principle: make every step **additive and reversible**; land a single
> world-chain vertical slice before breadth. Nail the three contracts (quest-card snapshot,
> stable IDs, band→outcome) BEFORE swapping the generator.

### Phase 0a — Library extraction (no behaviour change)
Promote `storyGen/genesis.ts` + `questWriter.ts` into a production module
(`engine/server/src/chain/`) as PURE functions — no `/tmp` paths, no file writes, no
`main()` side effects:
- `generateBible(input): Promise<Bible>`
- `writeQuestCard(input): Promise<QuestCard>`
- `resolveQuestStep(input): Promise<Resolution>`
- `mergeChainState(state, resolution): ChainState`
Keep the existing CLI runners as thin wrappers for playtesting.
**Verify:** typecheck + the CLI playtest still produces the same output.

### Phase 0b — Three integration contracts (types only, no wiring)
1. **Stable cast IDs.** Extend the bible cast to `{ id, source: 'pool'|'coined', person, roleInChain, arcStateAfterChain }`.
   Reused pool chars keep their pool id; coined NPCs mint an id and are inserted into the pool at genesis.
2. **Quest-card snapshot** (the chain-step deliverable, distinct from `Lead`/`FixtureScenario`):
   ```ts
   { leadId, chainId, stepIdx, questTitle, card, missionFiction, hiddenPurpose,
     assignmentAsk, revealOnSuccess, revealOnFailure, chainStateBefore }
   ```
3. **Structured outcome** (replaces a naive band→tier 1:1):
   ```ts
   { tier: 'clean_win'|'narrow_win'|'partial_loss'|'failure', band, objectiveAchieved,
     complicationSeverity: 'none'|'minor'|'major'|'catastrophic', casualties, goldAwarded, finalStep }
   ```
   Map: `favorable`→clean_win (narrow_win if casualties); `catastrophic-favorable`→narrow_win
   (success, scarred); `unfavorable`→partial_loss; `catastrophic`→failure. questWriter consumes
   the structured object, not just the tier.

### Phase 0c — Additive schema (roster v13 → v14, migration)
Add OPTIONAL fields, preserve old ones until the slice works:
- `QuestChain`: optional `bible`, `chainState`, `storySteps[]` (each carrying the quest-card
  snapshot + resolution + knownToPlayer-at-step), alongside the existing `skeleton`/`stepBeats`.
- Roster: optional `characterPool: PoolCharacter[]`.
**Verify:** old saves load; existing tests pass.

### Phase 1 — CharacterPoolService (narrative projection)
- `CharacterPoolService`: load/save (on roster v14), `getById`, region filter, recency sort,
  the §18.3 three-bucket selection (cached prefix = roster mercs + landmarks; dynamic sample by
  rarity; optional required anchor).
- **Sync hooks** (roster stays authoritative): merc hired/accepted, applicant generated/
  accepted/dismissed, captive created/recruited/sold/executed/displayed, merc death, reward
  promotion, coined-NPC creation. Add liminal roles/links for `applicant` and `hirePool`.
- Seed from `engine/server/data/seed_pool_*.json`.
**Verify:** a merc death and a captive recruit both reflect into the pool with correct role.

### Phase 2 — Reward-spec contract (design now, fulfil later)
Define the §18.6 `RewardSpec` union and pass the engine-chosen spec INTO the bible prompt so
the AI only writes outcomes the engine can honour. Fulfilment is Phase 6; the CONTRACT lands here.

### Phase 3 — Async generation (latency)
`/api/cmd` is synchronous; bible genesis is ~20s. Do NOT hide it in ordinary GUI actions:
- a persisted `pendingChainJobs` queue (or in-memory + saved completion);
- `/api/state` exposes job status; the spawn command returns immediately ("a saga is forming…");
- a background worker mutates roster under a serialized state lock and saves on completion.
For the very first slice, gating generation behind an explicit `debug-spawn-chain` is acceptable,
but normal end-day spawns must be async before shipping.

### Phase 4 — Wire generation into the orchestrator (one world chain, behind a flag)
- `trySpawnWorldChain` → `generateBible` (cast from the pool, stable IDs, reward spec).
- `spawnStepLead` → `writeQuestCard` (produces the quest-card snapshot; lead carries `leadId`).
- `pursue-lead` materialises the chain step from the snapshot (NOT `templateFor(lead)`); the
  resolver resolves the authored card.
- Resolution → structured outcome → `resolveQuestStep` + `mergeChainState`; engine-owned
  pacing decides `finalStep`.
- `finalizeChain` → epilogue.
**Verify:** one world chain runs start→finish in the GUI with coherent reveals.

### Phase 5 — Abandon / expiry semantics (logistics gap)
Decide and implement missed-step behaviour BEFORE breadth: abandoning a chain quest marks the
step `abandoned`/`failure` and notifies the chain; an expired chain lead either fails the chain,
advances ambiently, or respawns after cooldown. Surface the consequence in GUI.

### Phase 6 — Reward fulfilment + arcState write-back
- Fulfil `RewardSpec` into the roster (promote_to_merc, unique_trait_on_anchor, unique_item,
  captive_to_dungeon, regional_prestige, gold) — engine applies numbers, AI chose recipient.
- Apply `arcStateAfterChain` to the pool on epilogue (§18.7).

### Phase 7 — Unit chains + follow-ups
- Unit-chain trigger: a merc with non-empty ghost/lie and 0 chains → chain anchored to them (§18.5).
- Follow-up: a chain ending with loose threads samples an involved cast member for a sequel,
  passing the prior bible as inheritance context (§18.9-7).

### Phase 8 — Text CLI surface (last)
Adapt `cliQuests.ts` / `cliGame.ts` to the finalized shared view model (cards + knownToPlayer
reveals + resolutions). GUI-first kept the churn in one surface; CLI follows the stabilised shape.

---

## 4. Top risks (carry into implementation)

1. **Schema compatibility** — additive-only fields + a v13→v14 migration; never break old saves.
2. **Stable pool identity** — coined NPCs must mint an id and enter the pool at genesis, or
   rewards/arcState/deaths cannot bind.
3. **Quest card vs template** — if `pursue-lead` still calls `templateFor(lead)`, the authored
   card is never resolved; this is the easiest seam to get subtly wrong.
4. **Band→outcome impedance** — `catastrophic-favorable` is success-but-scarred (narrow_win),
   not clean_win; encode via the structured outcome, not a 1:1 enum map.
5. **Double source of truth** — keep roster authoritative; pool is a projection with sync hooks.
6. **Latency** — never block a normal GUI action on a 20s genesis.
7. **Scope** — resist doing CLI + GUI + unit + follow-ups in one pass; ship the world-chain slice first.

---

## 5. Acceptance (world-chain MVP)

A single world chain, spawned in the GUI, runs to completion: each step shows a POV-locked
quest card (no leaked causes), the player assigns mercs, the sultan-coin resolves a band, the
chain advances with gradual reveals carried in `knownToPlayer`, a reward fulfils into the roster,
the epilogue writes, and `arcStateAfterChain` updates the pool — with no broken old saves and all
existing tests green.
