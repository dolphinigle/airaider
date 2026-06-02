# Story Generation — Prototype Findings & Handover

**Status:** Findings. Empirical results from the throwaway `storyGen` prototype, written as a HANDOVER for the next (stronger) AI that will build the real prototype. This doc is about *what was actually built and learned*, not design intent — for design intent read `QUEST_CHAINS.md`, `SAGAS.md`, and `CANONICAL_DESIGN.md`.

**Read first:** `PROTOTYPE_DOCTRINE.md` (everything is throwaway; optimize for design-learning per hour), `QUEST_CHAINS.md` §1 (the AI "no vision for future" pitfall and the outline-first fix). This doc reports how those ideas survived contact with real AI output.

---

## 0. TL;DR for the next builder

1. **The story engine works and the prose is genuinely good.** A hidden "settled truth" bible built from the roster, then on-demand POV-locked quest cards that reveal it a little at a time, produces coherent, escalating, character-driven arcs with real foreshadowing payoff. This is the validated core. Keep it. It lives in `prototype/src/storyGen/`.
2. **The integration is the failure, not the generation.** The chains are bolted on as a standalone manual side-panel. They do **not** touch the core gameplay loop (day cycle, lead board, fatigue/time economy, fort/rooms, prestige, gold sinks). The player runs chains in a separate menu that could be deleted without affecting anything else. **This is the #1 thing to fix.** (User verdict: *"the UI is just slapped on top of the game, no connection with the core gameplay loops."*)
3. **There were two attempts and each got exactly one half right.** The original GUI pipeline (`aiQuestChain` + `chainOrchestrator`, now deleted) wove chains INTO the day loop but produced weak, samey, cliché prose. The `storyGen/chainPlay` engine produces excellent prose but is a disconnected manual panel. **The real prototype must marry the two: chainPlay's quality + day-loop integration.**

---

## 1. What was actually built

### 1.1 The engine (`prototype/src/storyGen/`)

| File | Role |
|---|---|
| `seeds.ts` | 17 hand-written story **sparks** (situation + emotional core + stakes tier). A spark is one half of "two unrelated ideas collide." |
| `chainGen.ts` | The pure generators (no I/O, no `main()`): `buildBible`, `writeQuest`, `resolveQuest`, `assessFit`. All zod-schema'd. Holds the system prompts and the engine-owned pacing/gold constants. |
| `chainPlay.ts` | Chain **lifecycle** over the live roster as the cast: `startChain` → `offerNextQuest` → `resolveOpen`, plus `recruitCandidate`/`recruitToRoster` and sidecar persistence. This is the shared engine both surfaces call. |
| `ai.ts` | `makeClient()` + `callJson()` (structured output via zod). |

### 1.2 The pipeline, as implemented

```
seed (spark)  +  roster slate (the player's mercs as the cast)
        │
        ▼  buildBible            [gpt-5-mini]  — collide spark with cast → a hidden, SETTLED-TRUTH bible
   Bible {title, leadBlurb, cast[], backstoryThreads, looseThreads, ...}   (player NEVER sees this)
        │
        ▼  writeQuest            [gpt-5-mini]  — bible + chain-state → the NEXT POV-locked quest CARD
   Quest {questTitle, card, assignmentAsk{desiredStats,desiredTraits,reason}, closesChain?}
        │
   player assigns mercs
        │
        ▼  assessFit             [gpt-5-nano]  — party tags vs assignmentAsk → fit 0..6
        ▼  tierFromFit (engine)                — fit + luck roll → outcome tier
        ▼  resolveQuest          [gpt-5-mini]  — quest + outcome → aftermath prose + chain-state delta
   ChainState.knownToPlayer grows; gold awarded (engine: goldFor)
        │
   repeat until closesChain OR step == max; winning finale may offer a recruit
```

### 1.3 The two surfaces (now sharing ONE engine)

- **Text CLI** (`prototype/src/cliGame.ts`, `npm run game`) — my own test/iteration surface. `[x] chains` menu.
- **GUI** (`engine/server` + `engine/web`, `npm run gui`) — the player surface. `STORY CHAINS` panel; server commands `chain-new` / `chain-offer` / `chain-resolve` / `chain-recruit`; chains persist to a sidecar (`<save>.chains.json`).

Both now call `storyGen/chainPlay`. The earlier separate GUI pipeline was deleted (commits `79ce7ed`, `f77baab`).

---

## 2. What WORKED (validated live with real AI)

These are empirical wins worth preserving in the rebuild:

- **Hidden settled-truth bible, not a mystery.** Telling the bible AI to write the truth *told straight and believable* (mystery is added later by the quest-writer choosing what to reveal) avoids ass-pulls. The quest-writer can foreshadow because the future already exists.
- **POV lock is the single biggest quality lever.** The quest card is *only what arrives at the gate* — what the client/messenger/rumor says or shows, plus facts the company already established. No omniscient narration of off-scene characters' thoughts. This kills the generic-fantasy voice and forces concrete, grounded scenes.
- **Reveal-one-layer-per-quest pacing reads as authored.** `knownToPlayer` accumulates; each card escalates from prior learned facts. Live example: quest 1 planted a notched coin + a name; quest 2 returned a *named* character with a stamped inventory citing the earlier clue and escalated the stakes. The chain felt written, not random.
- **Cast comes from the roster.** The bible is built from the player's actual mercs as the cast, so stories are about *your* company. This is the emotional hook.
- **Slate-membership recruit truth.** A winning finale may offer a *new face* from the story. "New face" is derived from the engine's roster-slate truth (who was NOT in the cast at bible-build), NOT from an unreliable AI flag. Deceased cast are filtered by their identity line only.
- **Model split is correct and cheap.** `gpt-5-mini` for bible/quest/resolution (the prose tiers), `gpt-5-nano` for fit-judging (the mechanical tier). Overridable via `AIRAIDER_*_MODEL` env. (See also `AI_PROVIDER.md`.)
- **Voice tiers.** Bible/hidden fields = **clinical** ("state what is, not how it feels"). Quest card + resolution = **literary/vivid**. Mixing these up (flowery bibles, clinical cards) degrades both.

---

## 3. What's WEAK or UNFINISHED

### 3.1 THE BIG ONE — chains are disconnected from the core loop

The chains run in their own bubble. Concretely, they do **not**:
- flow through the **lead board** (chains spawn from a button, not from rumors the player pursues);
- consume the **day / time / fatigue** economy (you can run an entire chain without ending a day; assigned mercs aren't fatigued or locked);
- gate on or feed the **fort / rooms / prestige** systems (a chain doesn't care what you've built, and finishing one doesn't move prestige);
- compete for the same **mercs and gold** as ordinary quests (no opportunity cost — chains are free extra content on the side).

The original design (`QUEST_CHAINS.md`, `SAGAS.md`) wanted chains *woven into* the day loop: chain steps appear as **leads on the board**, are **pursued** like any quest, **resolve at end-of-day**, and ripple into prestige/follow-ups. The first GUI implementation (`chainOrchestrator`) did this structurally — but its generation pipeline produced weak prose, so it was scrapped. The replacement (`chainPlay`) fixed the prose but reverted to a manual, out-of-loop panel.

**Handover task: re-integrate `chainPlay`-quality generation into the day/lead loop.** The generation engine is loop-agnostic by design (it's pure functions in `chainGen` + a thin lifecycle in `chainPlay`); the missing piece is the *orchestration* that turns `offerNextQuest` output into a board lead, charges the player time/gold/mercs to pursue it, and calls `resolveOpen` at end-of-day. See `QUEST_CHAINS.md` §"engine/AI split" and §"implementation phases" for the intended weave.

### 3.2 Pacing — chains run long, rarely self-close

Engine pacing is `TARGET`/`MAX` by stakes (`chainGen.ts`): uncommon 2/3, rare 3/4, legendary 5/6. The quest-writer is *permitted* to close at `target` and *forced* at `max`. In practice the AI keeps the arc open and almost always runs to `max`, so `closesChain` rarely fires early. Net effect: arcs are a bit longer/flatter than the `target`-shaped ideal. Lever options for the rebuild: stronger "close now if peaked" prompting, an engine-side soft cap, or accept-and-tune the bands.

### 3.3 Winning-finale recruit not eyeballed end-to-end in the GUI

The recruit *selection* and *win-gating* are unit-tested, and the `chain-recruit` handler is simple, but I never hit a winning finale live in the GUI to watch the offer render and the merc actually join. Verify this path in the rebuild.

### 3.4 Other open threads (designed, not built)

Unit-anchored chains (a chain that requires a specific merc every step) and sequel chains from `looseThreads` are specced in `QUEST_CHAINS.md` / `SAGAS.md` but only the world-chain shape is implemented here.

---

## 4. Load-bearing architecture facts (keep these)

- **Engine owns numbers, AI owns flavor.** The AI is asked *what qualities* a job wants (`assignmentAsk`), never the DC/gold. The engine computes fit→tier→gold (`tierFromFit`, `goldFor`). Pacing is engine-owned. Do not let the AI emit numbers.
- **Structured output everywhere.** Every AI call goes through `callJson` with a zod schema. Free-form prose fields keep only *min* caps (anti-empty); no eyeballed *max* caps — let voice and cost decide.
- **Persistence is a sidecar.** GUI chains live in `<save>.chains.json` (via `getChains`/`persistChains` in `engine/server/src/state.ts`), keeping the roster schema untouched. `ActiveChain` is plain JSON.
- **Dependency direction:** `engine/server` MAY import `prototype/src`; `prototype` must NOT import `engine`. That's why the shared engine lives under `prototype/src/storyGen/`.
- **Concurrency guard.** Chain commands are slow AI calls; a module-level in-flight flag in `dispatch.ts` prevents a double-click from double-resolving (double gold). Any rebuild needs an equivalent.
- **`pendingRecruit` is durable on the chain**, so a winning-finale offer survives a UI refresh; cleared on accept/decline.

---

## 5. Recommendations for the rebuild

1. **Keep `storyGen/chainGen` almost verbatim.** The generators and prompts are the validated asset. Treat them as a library.
2. **Throw away the standalone chain UI/menu.** Replace it with day-loop integration: chain steps become board leads, pursued and resolved through the existing quest machinery, sharing the merc/time/gold economy.
3. **Make chains the *source* of the best leads, not a parallel system.** A pursued rare/legendary lead should be able to *be* a chain step; finishing a chain should move prestige and can seed a follow-up — exactly the weave `QUEST_CHAINS.md` describes.
4. **Decide the pacing philosophy up front** (target-shaped vs run-to-max) rather than discovering it emergently.
5. **Preserve the engine-owns-numbers / AI-owns-flavor split and structured output** — they are why the system is debuggable and cheap.

---

## 6. Where the code is

- Engine: `prototype/src/storyGen/{seeds,chainGen,chainPlay,ai}.ts`
- Text surface: `prototype/src/cliGame.ts` (`[x] chains`)
- GUI server: `engine/server/src/{state,dispatch,routes}.ts` (`chain-*` commands, `getChains`/`persistChains`/`getChainClient`)
- GUI web: `engine/web/src/components/QuestChainPanel.tsx` (the disconnected panel to replace), `types.ts` (`ChainView`)
- Run: `cd prototype && npm run game` (text); `npm run gui` (web, needs `~/.airaider/openai.env` with `OPENAI_API_KEY`).
