# Sagas — meta-arcs of chains with a hidden master plot

**Status: prototype design (2026-05-30).** Not yet implemented. Validated by hand-run AI cross-check; see §12.

---

## 0. Vocabulary alignment (read this first)

The user asked for "quest chains: quests with a main storyline and subquests" and "unit quests using quest chains tied to units".

There is a **terminology clash** with [`QUEST_CHAINS.md`](./QUEST_CHAINS.md), which already calls a single bible+5-beats arc a "Quest Chain". To avoid breaking existing docs and code:

| User's word | This doc's word | Existing-doc word |
|---|---|---|
| "quest chain" (the long story) | **Saga** | — (NEW tier above Chain) |
| a single quest in that chain | Chain | Chain |
| one beat in a quest | Beat | Beat / Step |

A **Saga** is the tier this doc adds. Mentally: *a saga is to a chain what a season is to an episode*.

---

## 1. Why this exists

### 1.1 The "no vision for future" failure mode

Today every Chain is generated independently. §9 of `QUEST_CHAINS.md` rolls a dice after each chain for a "follow-up chain" — but the follow-up only sees the prior chain's epilogue. **The AI is allowed to wing it.** Consequence: follow-ups feel like the writer remembered a name and called it back, not like *act 2 of a planned story*.

This is the well-known LLM failure mode: writing prose forward without a destination. Good human authors don't do this — they write a skeleton first, then flesh out scenes that *land* the skeleton's payoffs.

### 1.2 The fix: pre-written master skeleton

Before any chains in a saga exist, the writer's-room AI is asked to produce a **3-4 paragraph master skeleton** with: a controlling idea, an antagonist plan, a final image, and 2-5 phase-payoffs. This skeleton is hidden from the player but lives in every chain's prompt as ground truth.

When the engine later spawns a chain *within* this saga, it asks the AI: *"deliver phase N of THIS skeleton; here is what already happened in phases 1..N-1."* The chain still has its own bible+beats, but it inherits the saga's destination — so plants in chain 1 pay off in chain 3.

### 1.3 What's already in QUEST_CHAINS.md

| Already covered | Where |
|---|---|
| Single chain bible + 5 beats + epilogue | §4, §18.4 |
| Per-chain hidden skeleton (chain-level, not saga-level) | §2 "Skeleton" row |
| Unit chains (anchor merc must be present) | §8, §18.5 |
| Reactive follow-up chain (dice-rolled after a chain ends) | §9 |
| ArcState evolution across chains | §18.7 |
| Reward fulfillment as engine spec | §18.6 |

**What's NEW in this doc:**
1. A **Saga** object that owns a hidden master skeleton spanning multiple chains
2. Saga genesis (3-4 paragraph skeleton, then a fleshed-out story)
3. Chain-from-saga generation (chain inherits phase position + prior phase summaries)
4. Skeleton mutation on chain failure (cheap append, not rewrite)
5. **Unit sagas** as a specialization of saga (anchor merc, lifetime arc)
6. **Saga-tier follow-ups** ("the merc's next decade" / "the region's next era")

---

## 2. Saga data model

```ts
type SagaId = string;   // saga-<ulid>
type ChainId = string;  // chain-<ulid>

type SagaKind = 'regional' | 'unit';
type SagaStatus = 'active' | 'completed' | 'failed' | 'abandoned';

type Saga = Readonly<{
  id: SagaId;
  kind: SagaKind;
  status: SagaStatus;

  // Anchor mercenary for unit sagas; null for regional.
  unitId: string | null;

  // What region this saga's center of mass is in (chains may roam).
  region: string;

  // The hidden master skeleton (NEVER shown to player verbatim).
  // 3-4 short paragraphs, written at genesis, mutable via amendments only.
  skeleton: SagaSkeleton;

  // Cumulative amendments appended when chains within this saga fail.
  // The engine never edits skeleton.body; it appends to amendments instead.
  amendments: readonly SkeletonAmendment[];

  // Phase pointer. Saga is structured as 2-5 phases.
  // Each phase is realized by one Chain (sometimes two, if a phase fails).
  phases: readonly SagaPhase[];
  currentPhaseIdx: number;

  // Chains spawned by this saga, in order of release.
  chainIds: readonly ChainId[];

  // Stable cast pulled from the character pool at genesis.
  // These characters' arcStates are expected to move across phases.
  pinnedCastIds: readonly string[];

  createdAtDay: number;
  closedAtDay: number | null;
}>;

type SagaSkeleton = Readonly<{
  workingTitle: string;                  // hidden; for log only
  controllingIdea: string;               // moral spine + logline
  antagonistPlan: string;                // what the world is doing if heroes do nothing
  finalImageTarget: string;              // the climactic image phase N should land
  body: readonly string[];               // 3-4 paragraphs of fleshed-out hidden plot
}>;

type SagaPhase = Readonly<{
  idx: number;
  intent: string;                        // 1-sentence: what THIS phase delivers
  deliveryHint: string;                  // 1-sentence: how a chain should embody it
  rewardSpecHint: RewardKind;            // engine-balanced reward tier expected
  status: 'pending' | 'in_flight' | 'delivered' | 'failed';
  realizingChainId: ChainId | null;      // null until a chain is spawned for it
  summaryAfter: string | null;           // 2-sentence wrap, written after chain ends
}>;

type SkeletonAmendment = Readonly<{
  atDay: number;
  triggeredByChainId: ChainId;
  triggeredByOutcome: 'failed' | 'partial';
  text: string;                          // 1-2 sentences: how the world bent
}>;
```

### 2.1 Why phases are pre-numbered

The skeleton is generated with 2-5 phase intents at genesis. The engine knows *upfront* how many chains this saga aims for. This:

- Caps the saga's length (a saga is not infinite; it ends)
- Lets the engine plan pacing (e.g., one chain every 3-5 in-world days)
- Gives the AI a destination ("phase 3 of 4 — the cliff before the climax")

### 2.2 Why amendments instead of editing the body

Editing `skeleton.body` after every failure means re-prompting the AI to rewrite paragraphs, which:
- Costs more
- Breaks the prompt-cache prefix (the cached system prompt was matched against the original body)
- Risks the AI rewriting parts that were already delivered

Appending an amendment is cheap, deterministic, and the prompt instructs the next chain's writer-room to *honour both the body AND every amendment*. This solves the user's question "*not sure if easy when quest failed*" — yes, it's easy, because we don't mutate, we accrete.

---

## 3. AI pipeline

A saga adds **two new AI calls** on top of the existing chain pipeline.

```
[saga genesis]          1 call,  narrative tier   (mini, low)   ~25s, ~$0.005
[chain genesis ×N]      existing chain pipeline   (mini, low)   ~25s, ~$0.005 each
[chain beats ×5 ×N]     existing beats pipeline   (nano, min)   ~3s each, ~$0.001
[chain epilogue ×N]     existing epilogue         (mini, low)   ~12s, ~$0.003
[saga epilogue]         1 call,  narrative tier   (mini, low)   ~15s, ~$0.004
```

Total saga cost (4-phase saga, all clean wins): roughly **$0.04** over its in-world lifetime (15-30 days). The numbers come from the playRunner cost-bench (`/tmp/airaider-bible-playtest-transcript.md`).

### 3.1 Saga genesis (1 call)

**Input:**
- Pool sample (12-18 characters from the region — same shape as Chain genesis input)
- `kind`: 'regional' | 'unit'
- For unit sagas: anchor merc full profile (want/need/ghost/lie/highest-rarity tag)
- Optional inciting event ("Captain Reyna's brother washed up dead", "a comet was seen over Mireford")
- Optional prior saga epilogue (when this is a saga-tier follow-up)
- Target phase count (2-5, engine-picked based on rarity)
- Per-phase reward spec hints (engine-balanced)

**Output (zod-validated):**

```ts
const SagaSkeletonSchema = z.object({
  workingTitle: z.string().min(2).max(60),
  controllingIdea: z.string().min(40).max(220),
  antagonistPlan: z.string().min(40).max(700),
  finalImageTarget: z.string().min(40).max(280),
  body: z.array(z.string().min(120).max(900)).min(3).max(4),
  phases: z.array(z.object({
    intent: z.string().min(40).max(220),
    deliveryHint: z.string().min(40).max(280),
  })).min(2).max(5),
  pinnedCastIds: z.array(z.string()).min(2).max(6),
});
```

The schema enforces that the AI can't drift to >700 chars per paragraph (cost) or fewer than 3 paragraphs (no skeleton substance). It also enforces phases match the engine's target.

**Prompt sketch (don't write final yet — validate via playtest in §12):**

```
SYSTEM: You are the writer-room foreman for a long-arc story (a "saga") that
will be delivered to the player as 2-5 separate episodic Chains over many
in-world days. You will write the HIDDEN master plot. The player will NEVER
see your output. Your job is to give every chain-writer-room downstream a
fixed destination so plants in chain 1 can pay off in chain 3.

OUTPUT REQUIREMENTS:
- Write a 3-4 paragraph body. Each paragraph covers a 1-3 chain span and
  ends with a CONCRETE physical image, not an abstract concept.
- The antagonist must have a PLAN that progresses even if the heroes do
  nothing. State it explicitly.
- The finalImageTarget must be a single sentence describing the LAST shot
  the player should see in the last chain's last beat.
- Reuse pool characters wherever the role fits; only introduce new ones if
  the pool offers nothing usable.
- Do NOT write any beats, leads, or chain bibles. Phase intents are
  one-sentence promises only.
```

### 3.2 Chain genesis from saga (modified existing call)

The chain-genesis call from `QUEST_CHAINS.md` §5.1 is **extended** when the chain is spawned from a saga:

**Added prompt context:**
- `saga.skeleton.body` (the 3-4 paragraphs verbatim)
- `saga.amendments` (all of them, in order)
- `saga.phases[currentPhaseIdx].intent` and `.deliveryHint`
- `saga.phases[0..currentPhaseIdx-1]`, each with `.summaryAfter` (what actually happened in earlier phases)
- The saga's `pinnedCastIds` are marked as REQUIRED in this chain's cast (unless dead/captive — see §6)

**Added prompt rules:**
```
You are writing CHAIN N of a saga of M total chains.
- This chain MUST deliver the phase intent. The reward kind is FIXED.
- The bible's trajectory MUST end with the finalImageTarget LANDING if N==M,
  else MUST end on a state that makes N+1 inevitable.
- You MAY foreshadow later phases but you MUST NOT spend their payoffs.
- If the skeleton contradicts a prior chain's actual epilogue, defer to the
  epilogue (the world wins, not the plan).
```

That last rule matters: if chain 2 failed unexpectedly (say, the antagonist died early when the skeleton expected them in chain 4), the writer-room must adapt. The amendment system (§3.3) usually patches this, but the rule is a safety net.

### 3.3 Skeleton mutation on chain failure

When a chain in a saga ends with `status='failed'` or has a `partial-loss` outcome at the climax beat, the engine spawns **one tiny AI call** to write an amendment:

**Input:** the original skeleton body + all prior amendments + the chain that just failed (its bible + outcome).

**Output:**
```ts
{ text: string }  // 1-2 sentences, ≤ 240 chars
```

**Prompt:**
```
The plan called for X. Instead, the heroes failed at Y. In one or two
sentences, describe how this changes the world for the next chain.
Do NOT rewrite earlier paragraphs; just describe what BENT.
```

The engine appends to `saga.amendments`. The next chain's genesis prompt includes the full amendment list.

If the **same phase** fails twice, the engine MAY allow a third try OR mark the saga `failed`. Decision: prototype caps at 1 retry per phase. (Configurable later.)

### 3.4 Saga epilogue (1 call, on saga close)

Same shape as chain epilogue (`QUEST_CHAINS.md` §5.4 / §18.4) but takes the whole saga as input. Returns a 4-6 sentence saga-level coda + a one-line "what the world remembers about this".

For unit sagas, the saga epilogue is appended to `merc.backstory` *in addition to* per-chain epilogues. This means a long-lived merc's backstory is the union of phases × chains, which is exactly the "decade-long arc" feel the user wants.

---

## 4. Engine ↔ AI split (strict)

Per `CANONICAL_DESIGN.md` §1: engine owns numbers, AI owns flavor.

| Decision | Owner | Notes |
|---|---|---|
| When to spawn a saga | Engine | Triggers in §5 |
| Saga rarity / phase count | Engine | Common=2, uncommon=3, rare=4, legendary=5 |
| Per-phase reward kind | Engine | Pre-allocated at saga genesis |
| Per-phase reward magnitude | Engine | Numbers from existing economy |
| In-world cadence (days between chains) | Engine | §7 |
| Phase intent / delivery hint | AI | Inside genesis schema |
| Skeleton paragraphs | AI | Hidden from player |
| Working title | AI | Used only in dev logs |
| Cast pinning | AI proposes, engine validates | Must exist in pool |
| Chain bible / beats / epilogue | AI | Existing pipeline, with added saga context |
| Amendment text | AI | One-shot, deterministic length cap |
| Mark saga `failed` after 2 retries | Engine | Hard rule |

The AI is **NEVER** asked to: pick reward magnitudes, decide whether to spawn a new chain now, decide a merc died, pick the next merc to anchor.

---

## 5. Saga genesis triggers

### 5.1 Regional saga triggers
- 5% nightly roll for regions where the player has done ≥3 chains and has no active saga in that region
- Region-event seed (a Lead that explicitly flags `seedsSaga: true` — see §11)
- Manual debug spawn (dev only)

### 5.2 Unit saga triggers (the "Sevrenne pattern" upgraded)

Today `QUEST_CHAINS.md` §8 says a rare recruit triggers a single unit chain. Upgrade:

| Trigger | Today | After this design |
|---|---|---|
| Rare+ recruit accepted | 60% to spawn unit **chain** | 60% to spawn unit **saga** (3 phases if rare, 4 if legendary) |
| Merc reaches V3 | 40% to spawn chain | 40% to spawn 2-phase unit saga |
| Merc completes a saga | (n/a) | 50% to spawn a follow-up saga 30-90 in-world days later |

The 3-phase rare unit saga is what gives a merc like Sevrenne the long-form Tibalt-Renn-style arc the user described in checkpoint 18, but spread across multiple chains:

- **Phase 1 — The Whisper:** a small lead reveals their secret to the fort only
- **Phase 2 — The Hunt:** the world catches on; cost rises
- **Phase 3 — The Reckoning:** they choose; the world re-shapes

### 5.3 Saga follow-up (saga → saga)

When a saga closes `completed`, roll for a saga-tier follow-up using the same table as `QUEST_CHAINS.md` §9 but at the saga tier:

| Closed saga rarity | Chance of follow-up saga | Cooldown |
|---|---|---|
| common | 5% | 60 days |
| uncommon | 15% | 60 days |
| rare | 40% | 90 days |
| legendary | 80% | 90 days |

Follow-up sagas inherit `kind`, get +1 rarity tier (capped at legendary), and receive the prior saga's full epilogue as input to genesis.

---

## 6. Failure handling (saga-tier)

Beyond what `QUEST_CHAINS.md` §7 covers for individual chains:

### 6.1 Anchor merc death (unit saga)
- Saga immediately `failed`
- Saga epilogue is forced through with `outcome='tragic'` so the merc's bio gets a proper closing
- Any pinned cast in the dungeon stay there; any pinned merc allies don't get a free reward

### 6.2 Pinned cast death/disappearance
- A pinned NPC died mid-chain (e.g., antagonist was supposed to live until phase 3 but was killed in phase 2)
- Engine appends a forced amendment: *"X died in phase N; the role of Y must transfer to or be voided"*
- Next chain's writer-room reads the amendment and adapts

### 6.3 Phase failure retry
- 1 retry per phase; on second failure, saga marks `failed` and runs saga epilogue with `outcome='cut-short'`

### 6.4 Saga timeout
- A saga that doesn't progress (no new chain spawned) for 60 in-world days is auto-closed `abandoned`. Prevents zombie sagas.

---

## 7. Cadence / pacing (engine, not AI)

A saga doesn't fire all its chains back-to-back. The engine paces:

| Saga rarity | Min days between chains | Max days |
|---|---|---|
| common | 2 | 6 |
| uncommon | 3 | 10 |
| rare | 5 | 15 |
| legendary | 5 | 20 |

The engine picks the actual day uniformly in that range, *biased toward earlier days if the player is on a cold streak* (no chains active). This ties saga progress to actual play rhythm rather than calendar tick.

A saga may have at most one chain in flight at a time. If the player abandons a chain mid-way, the saga waits.

---

## 8. UI surface (prototype: minimal)

The player MUST NOT see:
- The skeleton body
- The phase pointer ("phase 2/4")
- The amendment list
- The working title (it's hidden; the per-chain title is what the player sees)

The player MAY see:
- A subtle "this lead feels connected" hint on the lead-board entry (the chain shows its own title; the saga is implicit)
- In the chain epilogue, a one-line tease: *"There may be more to this."*
- After saga close, a saga-log entry that strings together the chain titles and the saga epilogue prose

For prototype, the **saga is fully invisible** — only chain-level UI exists. The player just notices that chains thread together. Visible UI deferred.

---

## 9. Cross-check protocol (anti-AI-drift, saga-specific)

Per the user's standing rule (`QUEST_CHAINS.md` §10) — every AI response is parsed and validated, drift is logged.

Saga-specific validations:

1. **Skeleton schema** — strict zod (§3.1); reject and retry once if schema fails.
2. **Cast existence** — every `pinnedCastIds` entry must exist in the pool at genesis time. If AI invented an ID, drop it from the list (don't crash) and log.
3. **Phase count match** — `phases.length` must equal the engine-requested target. Retry once on mismatch.
4. **Body length** — paragraphs ≥ 3 and ≤ 4, each in [120, 700] chars. Enforced by zod.
5. **No proper-noun leakage** — sanity-grep the player-visible chain title against the skeleton body; if the skeleton invents a name not in the pool, log it (don't block — but flag for review).
6. **Final-image landing check** — after the last chain's last beat, run a fuzzy similarity (Jaccard on word stems) between `finalImageTarget` and the actual climax beat body. If similarity < 0.15, log as drift.

Validations 1-4 are blocking (retry). Validations 5-6 are observational (log to `pushLLMLog`).

---

## 10. Implementation phases (prototype)

Mirrors the existing prototype-phase structure in `QUEST_CHAINS.md` §12.

### Phase S-A — saga skeleton MVP [~2-3h]
- `engine/server/src/chainBible/sagaSkeleton.ts`: schema + genesis call + zod validation
- `engine/server/src/chainBible/sagaTypes.ts`: Saga, SagaPhase, SagaSkeleton, SkeletonAmendment
- New `sagaRunner.ts` CLI: pick pool → generate one skeleton → print → exit
- Acceptance: 3 hand-runs on the Mireford pool produce valid, coherent skeletons

### Phase S-B — chain-from-saga genesis [~2-3h]
- Extend `biblePipeline.ts` `generateBible(req)` to accept optional `sagaContext`
- When supplied, prepend skeleton/amendments/prior-phase summaries to the prompt
- Wire `sagaRunner.ts` to generate 2-3 chains from one skeleton, mock the beats, print the bibles
- Acceptance: the second bible's cast/plants visibly reference the first bible's epilogue
- Acceptance: a phase intent and the bible's controllingIdea are recognizably aligned

### Phase S-C — amendments on failure [~1-2h]
- `appendAmendment(saga, failedChain)` one-shot
- Add to `sagaRunner.ts`: after generating chain 1, force the user to mark it 'failed' and observe the amendment + chain 2 adaptation
- Acceptance: chain 2's bible references the failure, not the original plan

### Phase S-D — unit-saga playtest [~1h]
- Add `--unit-anchor=char_marek` flag to `sagaRunner.ts`
- Hand-run a 3-phase rare unit saga end-to-end (full beats + epilogues + saga epilogue)
- Acceptance: the saga epilogue + each chain epilogue together read like the merc's biography for the in-world year

### Phase S-E — saga-tier follow-up [~1h]
- After a completed saga, prompt the user "spawn follow-up?" → roll → if yes, generate a follow-up saga skeleton with prior epilogue as input
- Acceptance: the follow-up saga's controllingIdea is recognizably evolved from the first

### Phase S-F — cross-check harness [~30min]
- Implement validations 5-6 (§9) as logged warnings
- Run end-to-end and inspect

**Total prototype effort: ~7-10h.** Same order of magnitude as the bible/pool prototype (which took ~8h). Cost per saga playtest: ~$0.04-0.08 (3-4 chains).

---

## 11. Integration with existing code (callout)

These touchpoints must be respected:

- `QUEST_CHAINS.md` §18 character pool — sagas pull their pinned cast from the same pool service; pool mutations from a chain inside a saga apply normally.
- `CANONICAL_DESIGN.md` §1 — every reward magnitude stays engine-owned.
- `AI_PROVIDER.md` §4 — saga genesis and epilogue use gpt-5-mini reasoning_effort=low (same as chain bible). Amendment one-shot uses gpt-5-nano minimal (it's a 1-2 sentence task).
- The existing `Lead` type may grow an optional `seedsSagaSpec?: SagaSeedHint` field for region-event triggers. Add only when wiring §5.1; don't speculatively add now.

**Out of prototype scope** (deferred to proper-impl):
- Player-visible saga UI (saga log tab, "this is connected" hints)
- Saga branching (skeletons that fork mid-way based on outcome)
- Cross-saga character collisions (one merc anchoring two sagas simultaneously — for now: 1 active saga per merc)
- Persistent saga storage (prototype uses /tmp JSON like the bible playRunner)
- AI-suggested skeleton revisions on success (only failure-amendments in prototype)

---

## 12. Cross-check playtest plan (run BEFORE building Phase S-A code)

Per user standing rule: "cross check between ai result and the game to see if the game parses ai results as expected" and "playtest yourself using the text based system".

The plan:

1. Hand-write a `sagaSkeleton.ts` stub that does ONLY the genesis call and prints the raw AI response.
2. Run it 3 times on the Mireford pool (2 regional, 1 unit-anchored on Tibalt Renn).
3. For each output, manually grade:
   - Does the body have 3-4 concrete paragraphs with physical images at the end?
   - Does `finalImageTarget` actually describe a SHOT, not a concept?
   - Are pinned cast IDs all in the pool?
   - Is the antagonist plan something the antagonist would do without prompting?
   - Could chain-genesis convincingly deliver phase 1 from this skeleton?
4. If 2/3 pass, proceed to Phase S-B. If ≤1/3, iterate prompt and retry.
5. Document grade results in `files/saga_playtest_iter1.md`.

This catches AI drift BEFORE we build the chain-from-saga plumbing on top of an unstable foundation.

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Skeleton too long → expensive prompt prefix for every chain in the saga | M | Hard cap at 4 × 900 = 3600 chars; cache prefix; observed cost target $0.04/saga |
| Amendments accrete unboundedly | L | Cap at 6 amendments per saga; engine refuses further chains after that |
| AI invents pinned cast names not in pool | M | Schema validates; on failure, drop invented IDs and continue |
| Phase intent and chain bible diverge | M | §9.6 logged similarity check; iterate prompt if observed |
| Player notices a "narrative seam" between chains in the same saga | H | Acceptance test in §10 Phase S-B specifically grades this; if 2/3 fail, redesign genesis prompt |
| Saga locks anchor merc out of other content | M | Cap 1 active unit saga per merc; regional sagas don't lock |
| Saga genesis cost makes early-game expensive | L | Common-rarity sagas are only 2 phases; trigger gated to ≥3 chains/region |

---

## 14. Open questions deferred past prototype

- Can two unit sagas share a skeleton? (e.g., a romance arc anchored to two mercs) — defer.
- Saga branching: chains that bifurcate the skeleton irreversibly — defer; amendments are simpler and have covered every observed case so far.
- Player-driven saga genesis ("pursue this lead's deeper story") — defer; engine-spawned only for prototype.
- Cross-region sagas (a saga whose chains roam between regions) — defer; saga has a single `region` for prototype.
- AI-suggested skeleton expansion mid-saga ("this got more interesting than planned, add a phase") — defer; phase count is locked at genesis.

---

## 15. Definition of done (prototype)

The saga prototype is "good enough to playtest into proper impl" when:

- 5/5 saga skeletons hand-run produce 3-4 concrete paragraphs with a landable final image
- 3/3 chain-from-saga bibles visibly inherit the skeleton's phase intent
- 1/1 forced-failure run produces an amendment that the next chain's bible visibly responds to
- 1/1 end-to-end unit saga (3 phases) reads as a coherent biographical arc for the anchor merc
- Total saga cost stays under $0.10 in the end-to-end playtest
- No schema-failure crashes; all drift is logged not thrown

Then we either (a) wire saga into the live chain orchestrator OR (b) hand off the design to proper-impl. User-decision point.
