# Quest Chains & Unit Quests

**Status:** Prototype design. Implements canonical open spec #4 ("Quest-arc auto-seeding from legendary tags") plus an extension to unit-specific arcs.

This doc specs **quest chains** (multi-step storyline arcs that share a hidden skeleton) and **unit quests** (chains tied to a specific mercenary's personal story). Reading order: prerequisites → core problem → data model → AI pipeline → engine/AI split → failure handling → unit-quest variant → follow-up chains → cross-check protocol → implementation phases.

---

## 0. Prerequisites

Read first:
- `CANONICAL_DESIGN.md` §1 (Engine owns numbers, AI owns flavor) — this doc obeys that rule everywhere
- `RAID_DESIGN.md` "Top-tier architecture principle" — same rule, different phrasing
- `AI_PROVIDER.md` "Narrative-vs-mechanical tier split" — chain skeletons are NARRATIVE tier; step generation can be mechanical tier

---

## 1. Core problem this solves

The 200-day validation sim produced one clear emergent value source: **Sevrenne's 40-day arc** (Days 131-170). It was hand-narrated by the sim author. Open spec #4 (`Quest-arc auto-seeding from legendary tags`) says: the production game needs this to fire automatically and feel just as coherent.

But naive AI-driven quest generation hits a known pitfall: **the AI has no memory of future stakes when writing the current beat.** Each independently-generated quest blurb is locally coherent but globally drifts — beat 3 forgets the premise of beat 1; the climax doesn't pay off the setup; the cast turns over arbitrarily.

The classic human-storyteller fix: **outline first, draft second.** A novelist writes a 3-4 paragraph synopsis covering the whole arc before drafting any scene. Each scene is then written *in service of* the outline. The AI can do this too if we structure the pipeline correctly.

**The design move:** every chain has a hidden `skeleton` — a 3-4 paragraph AI-authored arc outline generated ONCE at chain birth. Subsequent step-blurbs are generated *with the skeleton in the prompt*, so each step is locally vivid AND globally consistent.

---

## 2. Vocabulary

| Term | Meaning |
|---|---|
| **Quest Chain** | A sequence of 3-5 leads sharing a hidden skeleton and threaded characters. Has a status (active / completed / failed / abandoned). |
| **Skeleton** | The hidden 3-4 paragraph arc outline. Authored at chain genesis. Never revealed to player verbatim; on completion a *summary* may show in the chain's epilogue. |
| **Step** | One lead within a chain. Created lazily (only after the previous step resolves) so the AI can react to prior outcomes. |
| **World Chain** | A chain seeded by a lead or by a region event. Open to any party composition. |
| **Unit Chain** | A chain tied to a specific Merc. Engine requires that merc in the party for every step. |
| **Follow-up Chain** | A new chain generated when a chain completes — typically a unit's second arc or a sequel-hook spawned by a world chain. |
| **Resolution Log** | Per-chain ledger of how each step resolved (band + 1-sentence summary). Fed into the AI prompt for next step so failures and crits both ripple forward. |

---

## 3. The dopamine target

A quest chain should produce the **Sevrenne arc shape** without authoring effort:

1. **Hook (step 1):** A small, ambiguous lead that hints at something larger. ("A merchant in Greythorn whispers about a noblewoman hiding in the kennels — she may be more than she seems.")
2. **Rising stakes (steps 2-3):** The thing turns out to matter. Allies appear, hunters arrive, the world reacts.
3. **Pivot or reversal:** Something the player did in an earlier step matters now. (Sevrenne's `won't be openly identified` constraint became the spine of the entire arc.)
4. **Climax (final step):** A high-DC scenario where a god-combo party can crit, OR a high-cost loss-flavor moment (heroic sacrifice, bittersweet promotion).
5. **Epilogue (engine-rendered):** A 2-3 sentence wrap that bookends the skeleton — placed in fort log + merc bio if unit-bound.

The player should feel the chain is *authored*, even though no one wrote it.

---

## 4. Data model 🔒-shape

```ts
// prototype/src/questChain.ts

export type ChainStatus = 'active' | 'completed' | 'failed' | 'abandoned';
export type ChainKind = 'world' | 'unit';
export type StepStatus = 'pending' | 'active' | 'resolved-favorable' | 'resolved-unfavorable' | 'resolved-catastrophic' | 'resolved-catastrophic-favorable';

export interface ChainStep {
  stepIdx: number;
  plannedRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  /** Pre-downshift rarity (preserved for prompt context after catastrophic). */
  originalPlannedRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  leadId?: string;
  status: StepStatus | 'pending';
  summary?: string;
  resolvedDay?: number;
  band?: 'favorable' | 'unfavorable' | 'catastrophic' | 'catastrophic-favorable';
  /** Merc IDs that participated in this step's resolution (for epilogue). */
  partyMercIds?: readonly string[];
}

export interface ChainAnchors {
  centralNpc: string;
  antagonistFaction: string;
  recurringPlaces: readonly string[];
  /** Names/places each step MUST reference; engine validates blurb mentions at least one. */
  mustMentionByStep: readonly (readonly string[])[];
}

export interface QuestChain {
  id: string;
  kind: ChainKind;
  chainRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  region: string;

  // --- HIDDEN (never shown to player verbatim) ---
  /** Full 3-4 paragraph arc outline. Used ONLY in the epilogue call. */
  skeleton: string;
  /** Compact anchors fed into every step prompt (cheap token-wise). */
  anchors: ChainAnchors;
  /** Per-step outline beats from genesis. length === steps.length. */
  stepBeats: readonly string[];

  // --- PLAYER-FACING ---
  title: string;
  hook: string;

  // --- ENGINE STATE ---
  unitId?: string;           // unit chain only
  seedLeadId?: string;       // inciting incident lead (NOT step 0)
  priorChainId?: string;     // for follow-up chains
  themeTagIds: readonly string[];   // validated against VOCAB
  steps: ChainStep[];        // length 3-5 fixed at genesis
  currentStepIdx: number;
  status: ChainStatus;
  startedDay: number;
  endedDay?: number;
  /** Epilogue rendered at completion. Shown in fort log + (if unit chain) appended to merc.backstory. */
  epilogue?: string;
}
```

**Lead extension** — add to existing `Lead`:

```ts
chainStepRef?: { chainId: string; stepIdx: number };
```

**PursuedQuest extension** — `engine/server/src/quests.ts` `quoteLead()` currently strips Lead down. MUST extend to carry `chainStepRef` through to resolution, or chain advancement silently dies. Either widen `PursuedQuest.lead` or hoist `chainStepRef` to top-level `PursuedQuest.chainStepRef`. Prefer top-level hoist for clarity.

When a quest with `chainStepRef` is resolved, dispatch advances that chain's step.

**Roster extension** — add to `Roster`:

```ts
questChains: QuestChain[];   // active, completed, failed, abandoned all stored
```

(Schema bump to v16; default `[]` for back-compat.)

---

## 5. AI pipeline

A 4-step chain costs **1 + 4 + 1 = 6 AI calls** total, spread across days. Per-call budget is generous (skeleton uses narrative-tier model).

### 5.1 Chain genesis (1 call, narrative tier)

**Inputs:** seed reason (lead pursued / merc recruited / region event), themes (tag IDs available), region, expected step count (3-5).

**Prompt (system):**
> You are authoring a hidden 3-4 paragraph story SKELETON for a grimdark mercenary-fort game. The player will not see this verbatim; downstream prompts will use it to keep each step coherent. Voice: low-medieval, Germanic/Celtic/Slavic register, no high-fantasy.
>
> Structure: paragraph 1 SETUP (small, grounded hook). Paragraph 2 ESCALATION (the thing turns out to matter; second party / faction reveals itself). Paragraph 3 PIVOT (the central choice, complication, or sacrifice). Paragraph 4 CLIMAX (the high-stakes resolution; allow for both crit-success and tragic-failure to read as authored).
>
> Name the central NPC (with last name / epithet). Name the antagonist faction. Use the supplied themes / region as anchors.

**Output schema:**
```json
{
  "title": "string (2-5 words)",
  "hook": "string (1 sentence, player-facing)",
  "skeleton": "string (3-4 paragraphs, hidden)",
  "stepBeats": ["string", "string", "string", "string"]
}
```

`stepBeats[]` is a one-line beat per step — the writer's outline for each step. Length must match engine-requested step count. Engine validates: `assert(stepBeats.length === requested)`.

### 5.2 Per-step lead generation (1 call per step, mechanical tier OK)

Called when previous step resolves AND chain is not yet at last step. Generates the step's lead blurb.

**Inputs:** skeleton, themes, all prior step summaries, stepIdx, plannedRarity, region, the step's beat from `stepBeats[stepIdx]`.

**Prompt (user):**
> Chain hidden skeleton: «skeleton»
>
> Beat this step must hit: «stepBeats[idx]»
>
> Prior step outcomes (use as context — reference them if natural):
> - step 0: favorable — Marek lifted the ledger from the brewery cellar; the merchant was wounded but lived
> - step 1: unfavorable — Roselle was identified; the chapel saw her face
>
> Step rarity: rare (engine sets DC=3, reward=18g). You author the LEAD BLURB only.

**Output schema:** standard Lead blurb (same as aiLeadGen).

**Engine validation:** lead's archetype must be in `{raid, recovery, contract, heist, captive}`; region must match supplied or be in REGIONS list.

### 5.3 Step resolution → step summary (folded into existing narrate call)

The existing `narrate()` already returns `outcomeNarrative`. Extend its response schema with one optional field:

```json
{ "outcomeNarrative": "...", "chainStepSummary": "string (1 sentence, present only when scenario was a chain step)" }
```

This `chainStepSummary` becomes `ChainStep.summary` and feeds the NEXT step's prompt. Cheap, no extra calls.

### 5.4 Chain epilogue (1 call, narrative tier)

Called when last step resolves (or when chain fails irrecoverably).

**Inputs:** skeleton, all step summaries, final band, all party members across all steps.

**Output:**
```json
{ "epilogue": "string (2-3 sentences, bookends the skeleton)" }
```

Stored on `QuestChain.epilogue`. Appended to fort log and (for unit chains) to `merc.backstory` as a second paragraph.

---

## 6. Engine ↔ AI split — strict

Following canonical principle:

| What | Owner | Notes |
|---|---|---|
| Chain step count (3-5) | Engine | Rolled at genesis from a small RNG: common+uncommon chain=3, rare=4, legendary=5 |
| Chain rarity envelope | Engine | Drives both step rarities (rising curve) and final reward budget |
| Step rarity curve | Engine | E.g. for a 4-step rare chain: `[common, uncommon, rare, rare]`. AI cannot author this. |
| Step DC / reward gold | Engine | Same Lead generation envelope as standalone leads, gated by plannedRarity |
| Themes (tag IDs) | Engine picks valid IDs from VOCAB; AI must use them | Engine validates AI didn't invent a tag ID outside VOCAB |
| Title / hook / skeleton / stepBeats / blurbs / summaries / epilogue | AI | Pure flavor |
| Failure routing (catastrophic → chain fails vs continues) | Engine | A configurable threshold rule, see §7 |
| Which merc(s) anchor a unit chain | Engine | Picked on chain genesis from rare/legendary tag carriers |
| Skeleton REGENERATION on failure | **NOT IMPLEMENTED IN PROTOTYPE** | See §7 — too expensive + ruins consistency |

---

## 7. Failure handling

The user explicitly asked: "story can change if quests fail (not sure if easy)."

**Decision: ADAPTATION-IN-CONTEXT, NOT REGENERATION.**

The skeleton stays fixed. Failures are recorded into `ChainStep.summary`, which is included in subsequent step prompts. The AI is *told* about the failure and writes the next beat *around* it. The skeleton doesn't get rewritten; the AI naturally adapts the beats to fit what already happened. This is:

- **Cheap:** 0 extra AI calls
- **Coherent:** the AI has full context; failed steps become foreshadowing for the climax instead of derailing it
- **Robust:** doesn't need a "is this skeleton still viable?" judgment
- **Authentic:** mirrors how a TV writers' room actually works — scripts are punched up around what's already aired, not rewritten

**Hard failure rules (engine-owned):**

```
catastrophic outcome on step N → chain.status = 'failed' if N ≥ steps.length - 1
catastrophic outcome earlier  → chain continues but plannedRarity for remaining steps drops by 1 tier
                                (so the AI naturally pivots to a smaller-scale resolution)
two consecutive unfavorables  → chain continues, no rarity drop, but step summary
                                explicitly flags 'morale fraying' so AI can ratchet the climax down
unit chain: anchor merc dies  → chain.status = 'failed' immediately; epilogue narrates the cost
unit chain: anchor merc leaves
roster (exit/promotion)       → chain.status = 'completed' early with bittersweet epilogue
abandon-quest on chain step   → chain.status = 'abandoned'; epilogue narrates withdrawal
```

These are mechanical — no AI judgment needed. The AI is told the result and writes accordingly.

---

## 8. Unit Quests (specialization of chains)

A **unit chain** is a quest chain with `kind: 'unit'` and a non-null `unitId`. Engine enforces:

- The anchor merc MUST be assigned to at least one slot in every step's pursued quest. Dispatch checks this at end-day; if anchor is missing, the step does not resolve and the lead expires with `ChainStep.status = 'failed'` flagged.
- If the anchor dies, the chain fails immediately (see §7).
- On completion, the chain's epilogue is appended to `merc.backstory` (existing field on Merc), so the unit's bio grows over time.

**Genesis triggers for unit chains** (priority order):

1. **Rare or legendary tag on recruit acceptance.** When the player accepts an applicant with a rare+ tag, roll a 60% chance to spawn a unit chain for them within 5 days. Themes include their rare tag plus their hometown region.
2. **Veterancy threshold.** When a merc reaches V3 (veteran tier) and has no active chain, 40% to spawn an arc themed around "what built them" (drawn from their highest-rarity tag).
3. **Manual trigger (post-prototype):** future-only — explicit player UI to start a unit chain.

**The Sevrenne pattern as the prototype acceptance test:**

> A player recruits a merc with `bg:princess` (rare). Within 5 days, a chain spawns: title "The Crown in Exile", hook "Whispers in Greythorn say a noblewoman hides in your fort." Over 4 steps (DC2 → DC3 → DC3 → DC4), the chain escalates: a hunter party arrives, an alliance forms, the climax is a god-combo Cha-stack scenario. Epilogue is appended to her bio. If she dies mid-arc, chain fails with a tragic epilogue.

If the prototype reproduces this shape from cold — even once in 10 attempts — the pipeline is good enough to iterate. If it never produces it, the design needs a rethink before more code is written.

---

## 9. Follow-up chains

When a chain completes (status `completed`, NOT `failed`/`abandoned`), the engine rolls:

| Prior chain rarity | Chance of follow-up |
|---|---|
| common  | 10% |
| uncommon | 30% |
| rare    | 60% |
| legendary | 90% |

If a follow-up triggers, engine calls **chain genesis** again with extra context: the prior chain's themes, epilogue, and `priorChainId`. AI is told "write a sequel skeleton — N years later or N days later, the consequences of «epilogue» ripple back." Follow-ups inherit `kind` (a unit's follow-up is also a unit chain, same `unitId`). Engine bumps the follow-up's rarity by 1 tier (capped at legendary).

This naturally generates the **multi-chain character arc** the user described: a merc's first chain → a sequel → a sequel's sequel, each escalating, each tied to the bio.

---

## 10. Cross-check protocol (anti-AI-drift)

User specifically flagged: "cross check between ai result and the game to see if the game parses ai results as expected."

**Every AI response must be:**
1. Parsed against a strict zod schema (already the pattern in `leanLlm.ts` / `aiLeadGen.ts`)
2. Validated against engine constraints — invalid IDs/regions/rarities/lengths trigger fallback, not crash
3. Logged via `pushLLMLog` so the post-hoc playtest harness can inspect what the AI returned vs what the engine kept

**Add a playtest assertion harness:**

```ts
// /home/irvan/airaider/engine/server/src/_smoke-quest-chains.ts (dev only, never committed?)
// or as a vitest under prototype/test/questChain.test.ts with AI mocked

const violations: string[] = [];
for (const chain of roster.questChains) {
  if (chain.steps.length !== expectedStepCount(chain)) violations.push(`chain ${chain.id} step count mismatch`);
  for (const step of chain.steps) {
    if (step.leadId) {
      const lead = roster.leadBoard.concat(consumed).find((l) => l.id === step.leadId);
      if (!lead) violations.push(`step ${step.stepIdx} of ${chain.id} references missing lead`);
      if (lead && lead.rarity !== step.plannedRarity) violations.push(`step ${step.stepIdx} rarity drift: plan=${step.plannedRarity} actual=${lead.rarity}`);
    }
  }
}
```

Run this at end-day in dev mode and console.warn each violation. Goal: catch parser drift early during prototyping.

---

## 11. UI surface (prototype: minimal)

Add to web:

- **Chain panel** (collapsible card in main grid, near MercPanel): lists active chains with title + hook + step N/M + current-step status. Completed chains show in a "saga log" tab.
- **Chain bookmark on leads:** when a Lead has `chainStepRef`, decorate the lead-board entry with a small chain icon + title prefix. Player sees "[The Crown in Exile] Capture the witch's apprentice…".
- **Epilogue popup** on chain completion (modal, like ResolutionModal): renders the epilogue + reveals the skeleton in italic underneath ("the arc you played:"). This is the player's payoff for the slow build.
- **Unit chain on merc detail drawer:** if the merc has an active unit chain, show it in their detail card.

Defer: branching UI, multiple-chain-at-once view, chain history archive.

---

## 12. Implementation phases (prototype-only)

Each phase is independently shippable + playtestable.

### Phase A — world chain MVP (no unit binding) [~2-3h]
- Types in `prototype/src/questChain.ts`
- AI calls in `engine/server/src/aiQuestChain.ts` (genesis, step-blurb, epilogue)
- Schema bump + load/save for `questChains[]` field on roster
- Genesis trigger: when player **resolves** a `rare` or `legendary` lead favorably/catastrophic-favorably, that resolved lead becomes the **inciting incident** (NOT step 0). Skeleton + step 0 are generated AFTER, so the first chain lead IS skeleton-authored.
- Dispatch: extend `PursuedQuest` with `chainStepRef`; on resolution, if present, advance the chain; on end-day, generate the next step's lead and push to leadBoard. Chain leads BYPASS the 5-cap and BYPASS scouting-post gating (chain in progress = AI ride is paid for).
- Suppress normal applicant/captive drops on chain-step resolutions (chain narrative takes precedence; otherwise loot floods).
- UI: minimal chain card in side panel; `[chain-title]` prefix on chain leads.
- **Phase A acceptance:** a rare lead resolution spawns a world chain; 3+ chain leads appear over subsequent days, each blurb mentions ≥1 anchor from `anchors.recurringPlaces ∪ {centralNpc, antagonistFaction}`; chain reaches epilogue without parse failures.

### Phase B — unit chain anchoring [~2-3h]
- Add `unitId` enforcement: **block pursuit** at dispatch level unless anchor merc is assignable (clear UI: "Requires Sevrenne"); do NOT silently fail at end-day.
- If anchor is wounded/fatigued, pause chain-step expiry until anchor recovers.
- Anchor-death → chain fail; anchor-exit → bittersweet completion.
- Genesis trigger 1 (rare+ tag on applicant accept, 60% within 5 days).
- Genesis trigger 2 (V3 veterancy with no active unit chain, 40%).
- Epilogue appended to merc.backstory (cap to last 2 epilogues to bound token growth).
- **Phase B acceptance:** Sevrenne-pattern test from §15.

### Phase C — failure-aware adaptation [~1-2h]
- Resolution log + per-step `summary` integrated into next step prompt
- `originalPlannedRarity` preserved when downshifting on catastrophic; step prompt includes "engine downshifted from X to Y because of prior catastrophe — write a smaller, compromised version of the beat"
- "Morale fraying" flag after 2× unfavorable
- Acceptance: catastrophic on step 1 produces step-2 blurb that references the failure by name AND tones down the planned beat.

### Phase D — follow-up chains [~1h]
- Genesis from prior chain's epilogue + themes; rarity bump (capped at legendary)
- Active-chain cap of 3 enforced BEFORE rolling
- Default probs (NOT playtest probs): `{common:5, uncommon:15, rare:35, legendary:60}`
- Acceptance: a completed legendary unit chain spawns a follow-up ≥60% within 10 days; cap respected.

### Phase E — playtest assertion harness [~30min]
- End-day chain validator (see §10)
- One mocked-AI vitest under `prototype/test/questChain.test.ts` (parser/schema/advancement)
- One live-AI smoke script that walks 50 days + forced-band injection for failure-path testing
- Tune: prompt iterations until violations < 1 per chain on average

**Total: ~8h of focused work. Fits the overnight window with playtesting in between.**

---

## 13. What this does NOT do (out of prototype scope)

- Branching skeletons (player choices that rewrite future paragraphs of the skeleton)
- Cross-chain interaction (chain X reacts to chain Y completing)
- AI-generated chain prerequisites ("the chain only triggers if you own a Chapel")
- Multi-merc anchored chains (chain that requires a specific PAIR of mercs)
- AI-side narrative continuity across save/load gaps (skeleton is fixed at genesis, so this is naturally handled)
- Player-facing chain authoring UI (only auto-trigger in prototype)
- True dynamic skeleton rewrite on failure (rejected in §7 as too expensive for prototype value)

These can all be added later. The data model (`QuestChain.steps[]`, `themes[]`, `resolutionLog`-style summaries) supports each of them without restructuring.

---

## 14. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| AI ignores skeleton and writes generic step blurbs | HIGH at first | Skeleton MUST be in the user prompt of each step call; add a one-line reminder "REFERENCE specific names + places from skeleton" |
| AI invents tag IDs outside VOCAB | MEDIUM | Already handled by leanLlm pattern; extend to chain calls |
| AI returns wrong stepBeats array length | MEDIUM | Engine validates `length === requested`; on mismatch, regen with explicit count |
| Chain spawns too frequently → spammy | MEDIUM | Tune trigger probabilities + cap active-chain count to 3 |
| Chain never completes (player ignores its leads) | LOW | Add chain expiry: 30 days of inactivity → status=abandoned |
| Anchor merc dies before step 2 | LOW | Already handled by §7 anchor-death rule |
| Skeleton too long → token budget per step prompt blows out | LOW | Cap skeleton at 600 tokens (engine truncates) |
| Engine adds step lead to board but board already at 5/5 cap | MEDIUM | Chain leads BYPASS the 5-cap (or replace the oldest non-chain lead). Implementation choice: bypass. |

---

## 15. Acceptance test (single end-to-end scenario)

After the prototype lands, this should reproducibly work:

1. Start game, accept a `bg:princess` rare-tag applicant.
2. Within 5 days of end-day cycles, observe a chain genesis in `llmLog` of kind `chain-genesis`.
3. Chain title appears in the chain panel; first chain lead appears on the lead board with `[chain-title]` prefix and a chain icon.
4. Pursue and resolve that lead with the anchor merc. After resolution, observe a `chain-step` log entry, the chain advances to step 2, and a new lead spawns on the board.
5. Continue through all 4 steps. After the final resolution, observe a `chain-epilogue` log entry, the epilogue modal pops, and the epilogue is appended to the anchor merc's `backstory` field (visible in MercDetailDrawer).
6. Validate that every step-blurb mentions at least ONE name/place/faction from the skeleton (manual check during playtest of 5+ chains).
7. Validate that a failed step (unfavorable on step 2) produces a step-3 blurb that references the failure (manual check).

If 6 & 7 fail consistently, prompt engineering needs more iteration — the *design* is right, the *prompts* aren't.

---

## 16. Open questions deferred past prototype

- 🟡 Should world chains and unit chains share a global active-chain cap, or have separate caps?
- 🟡 Can a single merc anchor two unit chains simultaneously?
- 🟡 Does an active chain block the player from refreshing leads (story-locking)?
- 🟡 Should the player see the count of remaining steps, or just "more to come"?
- 🟡 How to handle save-file migration when a chain's schema changes mid-prototype?

None of these block the prototype. Make defaults: single cap of 3, no double-anchor, no lock, show count, on schema-change drop active chains with a fort-log warning.

---

## 17. Playtest-validated learnings (May 2026)

The Phase A+B prototype was validated end-to-end on the live GUI server with real LLM calls. These are the failure modes observed and the fixes that worked. Future tuning should not regress them.

### 17.1 Anti-cliché prompt discipline

The base genesis prompt produced fantasy-novel cliché phrases on roughly 1 in 3 chains: "nefarious schemes", "pulls the strings", "puppets of", "tightening their grip", "shadows of", "fate hangs in the balance", "darkness descends", "ancient evil", "twisted ambition", "weight of the past", "ghosts of the past", "coin and blood", "the spoils".

**Fix:** Maintain an explicit `BANNED PHRASES` list in `GENESIS_SYSTEM` and `STEP_BLURB_SYSTEM`. The AI obeys named bans more reliably than abstract "avoid clichés" instructions.

### 17.2 Title-pattern lock-in

Across multiple cold runs the AI repeatedly produced titles in the form `"The Weight of X"`, `"The Hollow's X"`, `"Whispers of X"`, `"Shadows over X"`. This made every chain feel similar even when the content was distinct.

**Fix:** The genesis prompt now explicitly bans those title patterns and requires the title to contain a CONCRETE proper noun (a person's name, a place name, or a named object). Examples: "Marek's Crossroads", "Greythorn's Broken Shield", "The St. Hadric Reliquary".

### 17.3 Hook abstraction failure mode

Hooks like "A soldier's past haunts him in the shadows of Blackmoor" or "An old soldier seeks aid against a brutal clan" name nothing concrete and give the downstream step-blurb prompt nothing to anchor on. The chain feels generic from the first beat.

**Fix:** The genesis prompt requires the hook to NAME the centralNpc AND the specific inciting thing in one sentence. The prompt includes three BAD examples and two GOOD examples ("Marek's old regiment was hanged at Greyford. The Grey Crawlers have begun asking who survived.").

### 17.4 Mid-arc epithet abuse

When the genesis output set `centralNpc = "Marek the Brawny"`, the step-blurb prompt used "Marek the Brawny" in every single blurb — across all 4 steps. Repetition broke voice.

**Fix:** Anti-epithet discipline in `STEP_BLURB_SYSTEM`: introduce the NPC with their full name once, then use the first name only. The centralNpc value is split on whitespace for the prompt so the first token becomes the "preferred ongoing reference".

### 17.5 Verbatim phrase reuse across steps

Without intervention, the AI reused multi-word phrases verbatim from earlier blurbs ("the Grey Crawlers tightening their grip" appeared in steps 3 AND 4 of the same chain).

**Fix:** `chainDigest(chain, priorHooks)` accepts an array of prior step blurbs. The orchestrator caches `step.blurb = lead.blurb` on spawn so prior blurbs survive after the lead is consumed. The step-blurb prompt explicitly instructs: *"DO NOT reuse any 3-word phrase from these — coin fresh language."* Observed: zero verbatim 3-word reuse after this change across 6+ subsequent chains.

### 17.6 Pyrrhic-victory finalize bug (engine, not AI)

The hard-fail gate at `advanceChainAfterResolution` used the helper `isStepCatastrophic(status)`, which returns true for BOTH `resolved-catastrophic` and `resolved-catastrophic-favorable`. A Pyrrhic win on step N-1 was therefore wrongly classified as a hard fail and the chain finalized one step early.

**Fix:** Introduced `isStepHardFail()` helper that matches only the pure catastrophic case. The advance() routine uses a direct status comparison rather than the broader catastrophic predicate. `ChainStep` also gained an explicit `blurb` field so blurbs persist for the anti-repetition guard even after the lead is consumed.

### 17.7 Cross-chain NPC and faction collision

With 3+ chains active in parallel, the AI tended to reuse the same antagonist faction ("Grey Crawlers" appeared in three different chains in the same world) and occasionally the same centralNpc. Players reading multiple sagas can't tell them apart.

**Fix:** The orchestrator now collects the centralNpc / antagonistFaction / heavily-reused places from all OTHER active chains and passes them as `avoidNames` to `generateChainGenesis`. The prompt instructs the AI to NOT reuse those names. Sequels are exempt for the prior chain itself (using `excludeChainId = prior.id`) since sequel inheritance is the whole point of a follow-up chain. Validation: with 9 pre-fix chains active (two with duplicate NPC "Alaric", two with duplicate antagonist "Grey Crawlers"), the first post-fix spawn produced a chain with a brand-new centralNpc and a brand-new antagonist faction.

### 17.8 Follow-up sagas are the sleeper feature

The follow-up chain path (one chain's epilogue threading into the next chain's genesis) is the strongest single feature of the chain system. End-to-end test: chain A "The Sorrow of Elowen" ended with Garrick dead, Roselle clutching Elowen's brooch, and Saltmire still under Grey Crawler control. The forced follow-up produced chain B "Roselle's Reckoning" whose hidden skeleton opens with *"In the aftermath of Garrick's death, Roselle struggles under the Grey Crawlers' oppressive rule in Saltmire, haunted by her dreams and the brooch that symbolizes her loss."* The brooch persisted as a memento. Varek persisted as antagonist. A new MacGuffin (Garrick's lost sword) and a new defected-Grey-Crawler NPC (Rurik) entered. Chain B then walked to completion in a single playtest pass; its epilogue folded in a NEW death (Gunther in catastrophic step 5) without ever losing the inherited continuity.

**Implication:** The follow-up chance multiplier on completion is worth tilting upward. Saga depth (chain A → B → C) is where the system feels most authored. The orchestrator currently doubles the follow-up chance in PLAYTEST mode (capped at 95%); production might want the same lift.

### 17.9 Active-chain cap interacts with debug spawn

The default `ACTIVE_CHAIN_CAP = 3` is correct for production but hits hard during debug/playtest sessions where many chains are forced into existence. The orchestrator now reads `process.env.AIRAIDER_CHAIN_PLAYTEST` and uses cap=10 when set, cap=3 otherwise. The same env var also boosts the follow-up multiplier and lifts certain trigger probabilities.

