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
  // Cinderella-shape: hook + endearing pinnedCast; per-phase plot points
  // live inside `phases` below. Mutable via amendments only.
  skeleton: SagaSkeleton;

  // Cumulative amendments appended when chains within this saga fail.
  // The engine never edits the skeleton or earlier plot points; it appends
  // to amendments instead.
  amendments: readonly SkeletonAmendment[];

  // Phase pointer. Saga is structured as 2-5 phases.
  // Each phase is realized by one Chain (sometimes two, if a phase fails).
  phases: readonly SagaPhase[];
  currentPhaseIdx: number;

  // Chains spawned by this saga, in order of release.
  chainIds: readonly ChainId[];

  createdAtDay: number;
  closedAtDay: number | null;
}>;

type SagaSkeleton = Readonly<{
  workingTitle?: string;                 // optional, internal log only
  hook: string;                          // 1-2 sentence dramatic payoff promise (what makes the reader want this saga)
  pinnedCast: readonly PinnedCastEntry[]; // see §2.3 — characters who appear across multiple chains
}>;

type PinnedCastEntry = Readonly<{
  characterId: string;                   // verbatim from pool
  sagaRole: string;                      // 1 sentence: what they DO across the saga
  charmHook: string;                     // 1 sentence: what makes them endearing/alive (gacha-style)
}>;

type SagaPhase = Readonly<{
  idx: number;
  plotPoints: readonly string[];         // 1-5 terse key events (TV beat-sheet, not shooting script)
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

### 2.1 The Cinderella shape (design rationale, validated 2026-05-30)

The skeleton was originally going to have `controllingIdea` + `antagonistPlan` + `finalImageTarget` + 3-4 prose paragraphs (the "body"). Playtest revealed three problems:

1. **`controllingIdea` moralizes.** AI writes thesis statements like *"Silence bought to protect reputations becomes its own crime"* — that's a thematic essay, not a story. The reader wants characters they care about, not morals they're taught.
2. **Prose body did the chain-writer's job.** Body paragraphs ended with concrete physical images (a sealed Tevin chit nailed to a palm, etc) — but that level of detail belongs in the per-chain Bible / per-beat writer, not in the meta-skeleton. The skeleton is a SCAFFOLD, not a script.
3. **Antagonists were "plans", not people.** A separate `antagonistPlan` field encouraged listing villain actions divorced from the villain's humanity.

The Cinderella reframe: **the skeleton is a hook + a cast that feels alive + per-phase key plot points (bullet-level, NOT prose)**. Like a TV writers' room beat-sheet, not the shooting script.

> **Hook**: "An abused orphan, secretly destined for royalty — reader pays off when the family eats crow."
> **Cast (with charmHooks)**:
> - Cinderella — *too kind to wish ill on her tormentors, which makes her victory sweeter*
> - Stepmother — *performs propriety publicly, petty venom privately — comically self-defeating*
> - Fairy godmother — *loves bending rules but enforces midnight strictly — chaotic-good auntie energy*
> - Prince — *genuinely smitten by ONE dance, no pickup-artist suaveness*
> **Phase plot points** (per chain): 2-4 bullets each. *"Party invitation arrives", "family forbids her", "she prays, fairy answers, blesses her with deadline"* — NOT *"the fairy descends from the chimney as moonlight catches her wand"*.

### 2.2 Why phases are pre-numbered

The skeleton is generated with 2-5 phases at genesis. The engine knows *upfront* how many chains this saga aims for. This:

- Caps the saga's length (a saga is not infinite; it ends)
- Lets the engine plan pacing (e.g., one chain every 3-5 in-world days)
- Gives the AI a destination ("phase 3 of 4 — the cliff before the climax")

### 2.3 The charmHook rule

Every entry in `pinnedCast` MUST have a `charmHook` — one sentence describing what makes that character feel like a PERSON, not a role. The standard the prompt enforces: it must be a behavioral specific you could imagine a fan-art of, not an adjective list.

| Good | Bad |
|---|---|
| *Tells the truth to his pet crow and smooths over small crimes with a weary, practical laugh* | *Cynical and pragmatic harbour-master* |
| *Polishes his crossbow mid-conversation like a nervous ritual and blushes at praise* | *Insecure young soldier with a mystery* |
| *Folds tiny paper boats and leaves them in the pockets of acquaintances as a coded signature of favor* | *Quiet, mysterious operative* |

Antagonists need charmHooks too — a villain who doesn't feel alive isn't a villain, it's a plot device.

### 2.4 Why amendments instead of editing the plot points

Editing earlier plot points after a chain fails means re-prompting the AI to rewrite, which:
- Costs more
- Breaks the prompt-cache prefix
- Risks the AI rewriting parts that were already delivered to the player

Appending an amendment is cheap, deterministic, and the prompt instructs the next chain's writer-room to *honour the plot points AND every amendment*. This solves the user's question "*not sure if easy when quest failed*" — yes, it's easy, because we don't mutate, we accrete.

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

**Output (zod-validated, post-Cinderella pivot 2026-05-30):**

```ts
const SagaSkeletonSchema = z.object({
  workingTitle: z.string().min(2).max(60).optional(),
  hook: z.string().min(40),                       // dramatic payoff promise
  pinnedCast: z.array(z.object({
    characterId: z.string().min(2),               // verbatim from pool
    sagaRole: z.string().min(20),                 // what they DO across the saga
    charmHook: z.string().min(20),                // what makes them endearing/alive
  })).min(2).max(6),                              // refined to enforce unique IDs
  phases: z.array(z.object({
    plotPoints: z.array(z.string().min(15)).min(1).max(5),
  })).min(2).max(5),
});
```

**Locked design rules** (validated by playtest iter 2, see `files/saga_playtest_iter2_cinderella.md`):
- Free-form prose fields have only `min` caps (let voice/cost decide; see repo memory "schema caps").
- Phase count MUST equal engine's `targetPhaseCount` (validator enforces).
- All `characterId` values MUST be in the pool (validator enforces).
- Last plot point of each phase MUST justify that phase's engine-fixed reward (prompt rule; validator does not enforce).

**Prompt summary (full text in `engine/server/src/chainBible/sagaSkeleton.ts:SAGA_SYSTEM`):**

```
SYSTEM: You author a SAGA SKELETON for a long arc delivered as 2-5 chains.
The player never sees this. You provide downstream chains with:
  1. A clear DRAMATIC PAYOFF the saga is reaching for (the hook).
  2. A handful of MEMORABLE, ENDEARING characters (charmHook required for each).
  3. The KEY PLOT POINTS each chain must hit — terse, NOT prose.

THE FOCUS IS CHARACTERS, NOT THEMES.

DO NOT write a controllingIdea, a moralizing theme, prose body paragraphs,
or a separate antagonist plan. Antagonists are people; their plan is implicit
in plot points; their humanity is in their charmHook.

The HOOK names the dramatic payoff (e.g., "abused orphan, secretly destined
for royalty — reader pays off when the family eats crow").

PLOT POINTS are bullet-level outline ("she leaves the shoe at midnight"),
NOT scene-level detail ("she descends the marble stair as the bell tolls").
```

### 3.2 Chain genesis from saga (modified existing call)

The chain-genesis call from `QUEST_CHAINS.md` §5.1 is **extended** when the chain is spawned from a saga:

**Added prompt context:**
- `saga.hook` (verbatim)
- `saga.pinnedCast` (every entry, with sagaRole + charmHook)
- `saga.amendments` (all of them, in order)
- `saga.phases[currentPhaseIdx].plotPoints` (verbatim — the chain MUST land these events)
- `saga.phases[0..currentPhaseIdx-1]`, each with `.summaryAfter` (what actually happened in earlier phases)

**Added prompt rules:**
```
You are writing CHAIN N of a saga of M total chains.
- This chain MUST hit every plot point listed for phase N.
- The reward kind is engine-fixed; the LAST plot point determines how the
  climax delivers that reward.
- For pinned cast appearing in this chain, their charmHook is the voice
  reference — they must feel like the same character readers met before.
- If the skeleton contradicts a prior chain's actual epilogue, defer to the
  epilogue (the world wins, not the plan).
```

That last rule matters: if chain 2 failed unexpectedly (say, the antagonist died early when the skeleton expected them in chain 4), the writer-room must adapt. The amendment system (§3.3) usually patches this, but the rule is a safety net.

### 3.3 Saga ↔ chain player-agency contract (added 2026-06-XX, updated after bible iter-E)

The chain bible (post iter-E, commit `fef259b`) is FICTIONAL TRUTH ONLY — it holds the WHY of the situation:
- `backstoryThreads` — the why-chain, one link per bullet, depth-first on ONE central cause
- `conflictingInterests` — who wants what from whom and WHY they clash
- `looseThreads` — open hooks future chains can pull
- `hiddenSituation` / `trajectory` — compressed summary + rough scaffold (not prescriptive)

Player agency does NOT live in the bible. It emerges LATER when a separate quest-writer AI consumes the bible + prior-quest summaries and authors the next quest. The contract:

| Saga side (writers' room) | Bible side (fictional truth) | Quest layer (player-facing) |
|---|---|---|
| `phases[N].plotPoints` = destinations | `backstoryThreads` answers WHY those destinations exist | quest-writer chooses HOW the next quest surfaces a thread |
| `phases[N].plotPoints[last]` = lands reward | bible.trajectory sketches reward fire path | quest-writer choreographs the beat-level decisions |
| `pinnedCast[i].charmHook` | bible.cast carries the same voice | quest-writer keeps the voice in dialogue |
| `amendments[]` (from failed chains) | bible bakes them into backstoryThreads / hiddenSituation | quest-writer respects them when generating next quest |

**Why this separation matters:** the bible is the "no asspulling" guarantee. If a quest reveals X, X must already be in backstoryThreads or be a natural consequence of them. The quest-writer is FREE to pick HOW to surface threads (player deploys mercs, mercs report observations, player decides) — but the bible holds the truth they're surfacing.

**Saga prompt rule (unchanged):** translate per-phase plotPoints into the chain's fictional ground (extend the why-chain into backstoryThreads; add adversaries' stakes to conflictingInterests). The quest layer downstream handles the player-facing surface.

### 3.4 Skeleton mutation on chain failure

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
Do NOT rewrite earlier plot points; just describe what BENT.
```

The engine appends to `saga.amendments`. The next chain's genesis prompt includes the full amendment list.

If the **same phase** fails twice, the engine MAY allow a third try OR mark the saga `failed`. Decision: prototype caps at 1 retry per phase. (Configurable later.)

### 3.5 Saga epilogue (1 call, on saga close)

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
| Phase plot points | AI | Inside genesis schema (bullet-level, not prose) |
| Hook | AI | One sentence: dramatic payoff promise |
| Working title | AI | Used only in dev logs (optional) |
| Cast pinning + charmHook | AI proposes, engine validates IDs | Must exist in pool |
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
2. **Cast existence** — every `pinnedCast[].characterId` must exist in the pool at genesis time. If AI invented an ID, drop that entry from the list (don't crash) and log.
3. **Phase count match** — `phases.length` must equal the engine-requested target. Retry once on mismatch.
4. **Unique cast IDs** — `pinnedCast` cannot list the same `characterId` twice. Enforced by zod `.refine()`.
5. **CharmHook thinness** — observational: log when a charmHook reads as adjectives-only ("cynical and pragmatic") rather than a behavioral specific ("tells truth to his pet crow"). Heuristic: word count < 8 OR no verb, log warning. Don't block.
6. **Reward landing per phase** — observational: after each chain's climax beat resolves, check that the *last* plot point of the phase matches the reward kind delivered. If reward was `unique_trait_on_anchor` but the last plot point was about money, log drift.

Validations 1-4 are blocking (retry). Validations 5-6 are observational (log to `pushLLMLog`).

(The previous `finalImageTarget` similarity check is gone — there is no `finalImageTarget` in v2. The "last plot point lands the reward" rule replaces it.)

---

## 10. Implementation phases (prototype)

Mirrors the existing prototype-phase structure in `QUEST_CHAINS.md` §12.

### Phase S-A — saga skeleton MVP [~2-3h] **DONE** (commits `940609b`, `8ba97fd`)
- `engine/server/src/chainBible/sagaSkeleton.ts`: Cinderella-shape schema (hook + pinnedCast w/ charmHooks + per-phase plotPoints), genesis call, zod validation, density rule, clinical voice rule
- `engine/server/src/chainBible/sagaSkeletonRunner.ts`: 3-spec cross-check (regional rare, regional uncommon, unit rare on Tibalt)
- Result: 3/3 pass at ~$0.005 per skeleton; each charmHook is a behavioral specific, each plot point is bullet-density not prose
- Saga types still inline in sagaSkeleton.ts; promote to sagaTypes.ts when S-B wires the saga object

### Phase S-B — chain-from-saga genesis [~2-3h]
- Extend `biblePipeline.ts` `generateBible(req)` to accept optional `sagaContext`
- When supplied, prepend skeleton/amendments/prior-phase summaries to the prompt
- Wire `sagaRunner.ts` to generate 2-3 chains from one skeleton, mock the beats, print the bibles
- Acceptance: the second bible's cast/plants visibly reference the first bible's epilogue
- Acceptance: a phase's plot points and the bible's hook/leadBoardBlurb are recognizably aligned

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
- Acceptance: the follow-up saga's hook is recognizably evolved from the first (e.g., picks up a loose-thread character or unresolved consequence)

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
3. For each output, manually grade as a **player**, not as a schema-validator:
   - Does the hook promise a real dramatic payoff (e.g., "the abused orphan eats with royalty")?
   - Does every `pinnedCast` entry have a charmHook that makes the character feel alive (behavioral specific, not adjectives)?
   - Are all `characterId`s present in the pool?
   - Could a chain-writer-room convincingly hit phase 1's plot points with one chain?
   - Does the last plot point of each phase justify that phase's engine-fixed reward?
4. If 2/3 pass, proceed to Phase S-B. If ≤1/3, iterate prompt and retry.
5. Document grade results in `files/saga_playtest_iterN.md`.

**Iter 1 result (2026-05-30):** v1 schema passed validators 3/3 but failed quality-grade on first read (`controllingIdea` moralized, `finalImageTarget` was indistinguishable from the body's last sentence, antagonist felt like a plot device). Pivoted to Cinderella shape (§2.1). Iter 2 (`files/saga_playtest_iter2_cinderella.md`) passed 3/3 with character-alive charmHooks.

This protocol catches AI drift BEFORE we build the chain-from-saga plumbing on top of an unstable foundation — but only when the human grader reads as a player, not as a schema linter.

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
