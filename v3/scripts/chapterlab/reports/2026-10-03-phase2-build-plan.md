# Phase 2 build plan: the R7 lab storyteller in the game (sagas only)

> **The relayed question (nano).** Per 1M tokens, gpt-5-nano costs $0.05 in and $0.40 out. GPT-6 Luna costs $0.10 in and $0.50 out. So nano is 2× cheaper on input and 1.25× cheaper on output. That tier runs only `themeRoll` and the lore `select` call, which is well under a cent per playthrough. Commit e05e646 already moved the tier to Luna, on the designer's "move everything to luna". Setting `AIRAIDER_NANO_MODEL=gpt-5-nano` puts nano back. The v4 build also removes the saga `select` call.

## 0. Rules for every step (each step goes to one Opus builder; Fable verifies)
- **Where the code comes from.** Port from the frozen lab tag `$SRC` (set in Step 0). Read it with `git show $SRC:v3/scripts/sagalab/v4lab.ts`, `probe.ts` and `src/ai/prompts/*`. Never import `scripts/` from `src/` or `test/`: v4lab imports `Game`, which makes an import cycle, and R7 keeps editing it.
- **Port line for line, with the arm fixed.** Keep the lab's `arm` parameters, bound to one module constant `ARM = {structure:'L', names:'labels', cast:'lean'}`. Prune the dead S/H/full/named branches only after the Step 2 golden diff passes. The shipped text has to be the text that was measured.
- **Green means:** `cd v3 && npm run typecheck && npm test`, plus a mock CLI campaign (`npm run cli -- --script …`) played to a saga finale. Each step gets one fix round; after that it goes back to Fable.
- **No gameplay changes (North Star 0).** These stay exactly as they are: slot counts, thresholds, difficulty rolls and caps, the fillability guard, side loot and relics, bank, payoff and failure budget, the stall guard, finale fates, `settleFinale` dispositions, REWARD, XP, served-with edges and the dice. Every place where the lab assumes something else is listed in §3, with a default that keeps today's mechanics.
- **One-offs are untouched:** `generateOneOff`, one-off `writeQuest`/`resolve`, the ERRAND line on one-offs, and the flesh prompt.
- **Sandbox:**
  - Never use ports 3210/5273; set `PORT`/`WEB_PORT` for scratch servers.
  - Use `AIRAIDER_SAVE=$SCRATCH/x.json`.
  - Kill scratch servers by port (`ss -ltnp`), never with `pkill -f`.
  - Never run `npm run fresh`, and never save the CLI game under the name `web`.
- **RNG split:** story draws go on a new persisted `storyRng`; mechanics stay on the main `rng`.

## Step 0: freeze, fix the docs, ask for rulings (Fable; no code)
1. Once R7 is judged, tag the winner `storyteller-build-src`: either the R7 HEAD or `storyteller-best-follow-r5`. Record it in the STORYTELLER checkpoint table.
2. Fix STORYTELLER.md:
   - Add one line at the top of §2, §3.1 and §4.3: "where these differ from `scripts/sagalab` at `storyteller-build-src`, the lab code is the spec". Those sections are pre-R1; without the line a builder will build the overturned design (pitch = card 1, `opens`, plan-written options, stake, traits, a one-call pursue).
   - Rewrite §4.3 to match the checkpoint's screen.
   - Record the 2026-10-03 agreement: build after R7, G1 waived, and G2 still decides the ship (§D.6).
   - Fix the §D.5 / §4.5 contradiction. `legacylapse` and `lapseChain` do not exist; what is needed is an old-save refusal test.
3. Send the ⏳ rulings in §3 to the designer. The build goes ahead on the defaults.
4. **The build works with either checkpoint.** The provider is keyed by template name and the UIs render whatever rows the engine returns, so R5 needs no UI change:

| piece | R7 | R5 |
|---|---|---|
| templates | plan · card · report | adds `outline` (budget 115), a second call after the plan, so plan → outline → card 1 run in sequence |
| road hopes | `jobHopes`/`hopeLine`/`whyFlags` from the plan's `why` | `outlinePayload`/`roadHopes`/`roadLine` + `mockOutline` |
| finale buttons | engine `finaleOptions`/`cannedOption`; button shows only gold's `→ coin` plus the stat | option labels written by the plan, canned if missing |
| report screen | `ledgerLines` (Learned / Took / Cost / Outcome); 📖 shows status only | no ledger; R5's 📖 line |
| finale log | `stakesLine` as the last row | none |
| names | `metNames` on every dealt string, `notePresent`, `innerArticlesOut`, `problemOf` | absent |
| gains | `gainKinds`/`gainDeal` | absent |
| card 1 | prose above its log | log above, as on every card |

## Step 1: engine (saga types, storyRng, deal, cast; all pure)
**Files:** new `src/engine/plainwords.ts`; new `src/engine/saga.ts`; `src/engine/chains.ts`; `src/game/game.ts` (GameState and storyRng only).
- **plainwords.ts**, ported from v4lab: `BACKGROUND_WORD, TRAIT_WORD, SKILL_NOUN, RACE_WORD, plainWords, backgroundOf, topSkill, soldierTrade, soldierIs, tradeOf, raceOf, sexOf, manWoman, an`.
- **saga.ts**, ported from v4lab:
  - types: `Seat, JobType, EpisodeType, Way, GainKind, Person (→ SagaPerson), Trouble, Episode, CastEntry, SagaPlan, SagaState, Hurt, Cost`;
  - tables: `TYPES, GAIN_WEIGHTS, GAIN_ATOMS, PERSON_GAIN, WAY_MEANS, HELPED_GOLD, WAY_ATTR, WAY_WORD, WAY_GAIN, SHAPES (parts only), STAKES, PERSONAL_PARTS, LOOSE_PARTS, TONE_FROM_THEME`;
  - helpers: `wrongedPart, waysOf, helped, meetBy, rollHurt, COSTS`;
  - new: `EPISODE_TESTS` (§3 D1).
- **Persisted shapes.** Everything must be JSON-safe, so the lab's Sets and Maps become arrays and records:
```ts
export interface SagaWorld {        // replaces the lab's World + Draw + the ProbeFixture fields builders read
  personal: boolean; N: number; kind: 'recruit'|'captive'|'gold'; shape: ShapeId;   // shape: client part + floor stake only (D13)
  focalId: string; cast: SagaPerson[]; stake: string; places: string[]; land: string;
  seed: { id: string|null; text: string }; tone: string;
  kinds: GainKind[]; gains: string[];   // dealt ONCE (the lab recomputed them from hashStr(fx.id, draw) in 3 places)
  region: string; level: number;
}
export interface SagaLine { n: number; attempt: number; outcome: Outcome; party: string[]; text: string; hurt: Hurt[] }
export type LogRow = { kind: 'for'|'road'|'roadrow'|'known'|'knownrow'|'held'|'open'|'stakes'; mark?: '▶'|'✓'|'✗'|'·'; text: string };
export interface Matter { id: string; name: string; label: string }
export interface SagaRecord {
  v: 4; world: SagaWorld; plan: SagaPlan; fallback: boolean;
  knowing: { met: string[]; named: string[]; seen: string[] };
  state: SagaState;                                   // learned[], held[]
  hopes: { print?: string; deal?: string }[];         // R5: roadHopes
  road: (string|undefined)[] | null;                  // roadLines, computed once at plan time
  done: Record<number, 'won'|'lost'>; tries: Record<number, number>;
  latest: string; lastchance: boolean; card1: string; lines: SagaLine[];
  cache?: { job: number; attempt: number; title: string; prose: string; job_: string; rows: LogRow[]; matter: Matter[] };  // verbatim re-offer
}
```
- **`dealSaga(storyRng, recentThemeIds, a)`** deals:
  - the seed: `dealSeed` from themes.ts, or `a.personalSeed`, or the lab pin `spark`;
  - the tone: `TONE_FROM_THEME[theme.tone] ?? pickTone(storyRng)`;
  - the shape (D13);
  - the gains: `gainKinds`/`gainDeal`, with `storyRng` in place of `new Rng(hashStr(…))`.

  It also pushes the theme id into a window of 50.
- **`castSaga(storyRng, a)`** builds the lean cast directly, folding the lab's `buildWorld` `coin()` and `leanWorld` together:
  - The focal sits in the opponent seat ("stands in the way").
  - The client is coined: name, sex and race from the game's npc prefs and REGION poolWeights; no trade; known.
  - A personal saga casts the soldier (focal, known, `soldierTrade`) plus a coined opponent, plus the seed person from D10.
  - Inputs from the game: `focal: Card`, `personal`, `region`, `taken(name)` (roster, lore, `recentNpcNames`, `nameTooSimilar`), `returningClient?` (D9) and `seedPerson?` (D10).
  - Places and land follow D11.
- **chains.ts:** add `Chain.saga?: SagaRecord`. `bible` and `story` stay until Step 5b.
- **game.ts:**
  - Add `GameState.storyRngState?: RngState` and `recentThemeIds?: string[]`.
  - Create `this.storyRng = new Rng(st.storyRngState ?? hashStr('story:' + seed))`, and have `save()` write it.
  - Nothing calls deal or cast yet, so the main stream does not move.
- **Tests:**
  - `saga.test.ts`: seats, known flags and parts for personal × kind; no taken name; a SagaRecord survives a JSON round-trip; every EPISODE_TESTS tag passes FAVOR_OK and none zeroes a founder roster.
  - `storyrng.test.ts`: save/load keeps storyRng; `rng.state()` is unchanged by deal and cast.
  - `castrules.test.ts`: location fences, ≤1 returning face, the 2-saga cooldown, and no repeated theme within 50.

## Step 2: storyteller text side (pure: payloads, validation, Knowing, log, ledger, floor)
**File:** new `src/ai/storyteller.ts`. It imports from the engine only, never from Game.
- **Port as-is.** Replace `w.fx.X` with `w.X` and `w.focal.id` with `w.focalId`. The lab's default `seed = w.fx.seed ?? ''` must become `w.seed.text`: for a dealt theme that default is empty, which breaks `whyFlags`.
  - Schemas: `zPlanOut, zTrouble, zEdge, zEp, zCardOut, zReportOut`.
  - Validation: `validatePlan` with every repair (`stripTraits, edgesOf, shortLabel, innerArticlesOut, engineLabel, theLabel, cannedOption, STAKE_WANT, stakeLine, cannedWant`, plus the deId and unRole repairs).
  - Payloads: `planPayload, firstCardPayload, laterCardPayload, capFor, metTrouble, problemOf, openQuestion, reportPayload` (with `namesFor, entry/cardEntry/reportEntry, labelOf, partIn, inJob, heldFor, haveOf, clientOf, choiceTarget, toYou, lossSentence`).
  - Knowing: `newKnowing, forLineShown, noteDelivered, notePresent, metNames, displayName, callName, mentions, headNoun`.
  - Screen: `questLog, wantPhrase, roadLines, jobHopes, hopeLine, hopeOf, whyFlags, answerKeys, assertsKnowing, jobWhy, winIsGain, stakesLine, ledgerLines, costText, triedLine, finaleOptions, onThisMatter, bank`.
  - Floor: `mockPlan` (its rng becomes `new Rng(hashStr(chainId))`), `mockCard`, `mockReport`.
  - Log-only, sent to `log('dev')`: `planLint, revealLint, winTellsLearn`. These are the only telemetry. `whyFlags`, `winIsGain`, `answerKeys` and `assertsKnowing` decide what prints, so they are not telemetry.
- **Structured log.** `questLog` returns `LogRow[]`, and `logLines(rows)` produces the lab's exact strings. The GUI gets structure; the CLI gets the lab's text.
- **Boundary helpers:** `knowingOf(rec)` turns the stored arrays into Sets, `keepKnowing(rec, k)` writes them back, and `roadOf(rec, at, retry)` builds a RoadState with a Map. The ported functions stay unchanged.
- **Golden diff (Fable, not committed).** Run probe `--mock` on the L_lean fixtures at `$SRC`. Feed the same world and plan through storyteller.ts with a scratch driver. Payloads, rendered prompts, log, ledger and buttons must match byte for byte. Then prune the dead arm branches and diff again.
- **Tests:**
  - `planvalidate.test.ts`: each repair; each hard defect; the floor plan validates clean for N 2–6 × personal × kind.
  - `payloadlint.test.ts`: the §2.8.8 rules over every engine-composed value in mock sagas.
  - `nameleak.test.ts`: 20 seeds; no unmet name in a card payload; no roster name except the personal soldier; label once.
  - `promptbudget.test.ts`: narrowed to the built variants, after R7 lands (R7 is editing it now).

## Step 3: provider (one template-keyed saga call, both transports, plus the mock)
**Files:** `src/ai/provider.ts`, `openai.ts`, `mock.ts`, `calllog.ts`; typed wrappers go in storyteller.ts.
```ts
export interface SagaCall {
  template: TemplateName; flags: string[]; vars: Record<string, number>;
  payload: Record<string, unknown>;     // user JSON, sent verbatim; direction rides here (§2.8.5)
  tier: 'plan'|'writer'; effort: 'low'|'medium';
  schema: z.ZodTypeAny;                 // lab zPlanOut | zCardOut | zReportOut (| zOutlineOut on R5)
  floor: () => unknown;                 // mockPlan/mockCard/mockReport — the mock's reply and the fallback; never sent
}
interface AiProvider { …; sagaCall(c: SagaCall): Promise<unknown> }   // schema-parsed JSON; throws on transport failure
```
- **openai.ts:** `sagaCall = c => callR(c.template, c.tier==='plan' ? PLAN_MODEL : WRITER_MODEL, render(c.template, c.flags, c.vars), JSON.stringify(c.payload), c.schema, c.effort, c.tier)`.
  - `call()` and `callR()` take an explicit optional `tier`, checked before the guess at :777 (`purpose==='genesis' ? 'plan'`). Without it the plan call runs on Claude's writer tier without any error.
  - plan, card and report stay out of `DIRECTED`, so system prompts stay byte-stable.
  - No `zProse`/`desemi`: the lab measured raw text.
  - AiCallRecord and CallLogLine get optional `template` and `flags`, so mech.ts and drive.ts can read real game runs.
- **Claude transport:** nothing new. `claudeOptsFor('plan','medium')` (AIRAIDER_CLAUDE_PLAN, default Sonnet) and `('writer','low')` match the lab's Sonnet calls at medium and low.
- **mock.ts:** `sagaCall = async c => { await lag(); logCall(c.template…); return c.floor() }`. It takes no draws from `this.rng`.
- **storyteller.ts wrappers:**
  - `planSaga`: at most 2 calls, then validatePlan, else the floor plus a `plan-fallback` dev log;
  - `writeCard` and `writeReport`: catch, then fall back to the floor; a missing summary takes the floor's summary;
  - R5 only: `writeOutline`.
- **Tests (new `tiers.test.ts`):** a fake transport records each call's tier (plan → plan; card and report → writer; themeRoll and select → nano); direction never appears in a saga system prompt; the mock's `sagaCall` is pure.

## Step 4: game-side saga flow (glue, tested against a fake host)
**File:** new `src/game/sagaflow.ts`. This is probe.ts `runSaga` cut into event handlers.
```ts
interface SagaHost { rng: Rng; storyRng: Rng; ai: AiProvider; state: GameState; card(id: string): Card|undefined; roster(): Card[];
  direction(): string|undefined; log(kind: string, text: string): void; takenName(n: string): boolean; noteNpcName(n: string): void }
```
- **`deal(host, chain, lead, focal)`** is synchronous and fills `chain.saga.world`. It must run in `runPursue`'s synchronous prefix, so two queued pursues never get the same theme or name (TEMPO I3).
- **`plan(host, chain)`** fills plan, hopes, road, knowing and state.
  - `avoid` = the last 5 chains' {title, question}.
  - `direction` = guidance + " Keep out: " + avoid.
- **`card(host, chain)`** returns `{title, prose, job, rows, logFirst, matter, options?}`.
  - Payload: `firstCardPayload` while `rec.card1 === ''`, otherwise `laterCardPayload`.
  - Flags: `retry` when `tries[job] ≥ 1`; `lastchance` from the record.
  - Knowing: `noteDelivered(log + prose)`; `forLineShown` from card 2.
  - ON THIS MATTER skips the For person from card 2.
  - The result is written to the cache.
- **`asks(type, n, personal, soldierInJob)`** returns `AskSlotOut[]` (D1). **`approaches(rec)`** returns `{id, label, rewardKind, way}` plus each way's test (D2).
- **`reportIn(host, chain, quest, res)`** is synchronous and returns `{call, hurt, cost, decides, lowest, option, fate}`: decides and lowest per D5, hurt per D3, fate from `sagaFate`.
- **`afterReport(...)`** returns `{ledger: string[], status: string}`. It runs `noteDelivered` + `notePresent` + `ledgerLines` + `bank` + `triedLine`, appends the SagaLine, and updates done, tries and lastchance. It sets `latest` by the probe's rule (probe.ts :504) and clears the cache on a failure.
- **`sagaFate(...)`** is ONE function for the Outcome line.
  - It merges the lab's wording with every game branch: merc focal; slipped; void; saddled; recruit with no Tavern or a full roster; captive with no Dungeon or full cells; personal talk/fight/sneak on the opponent.
  - It reads the same predicates as `settleFinale` (`hasRoom`, capacities, `KEEP_THRESHOLD`).
- **Views** are read-only and never write Knowing. `chronicle(rec)` returns {rows (For line on, open question until the finale), card1, lines, answer (done or slipped only), people (the seen; the named as "name — label"; tie)}.
- **Tests:**
  - `sagaflow.test.ts`: fake host + MockProvider, N 2–6, personal and not, every lab path including a failure re-pose and a last chance, played through to the finale; records serialize; views are pure.
  - `fatesentence.test.ts`: every branch, checked against what `settleFinale` actually does.

## Step 5a: wire it into game.ts (sagas only), plus the old-save refusal
**Files:** `src/game/game.ts`, `src/engine/chains.ts`, `src/engine/quests.ts`, `server/main.ts` (boot only), `cli/main.ts` (`--load` only), and the tests below.
- **quests.ts:** `Quest.saga?: { rows: LogRow[]; logFirst: boolean; matter: Matter[]; part: number|null; of: number; again: boolean; lastchance: boolean; setbacks: number; budget: number }` and `ApproachGroup.way?: Way`.
- **`runPursue`, starts-new** (replaces `generateGenesis` 2278–2783):
  - `newChainEconomy` is unchanged; its twist is still drawn and ignored.
  - The focal pick is unchanged: personal merc, sequel focal, `labFocal`, lore promotion on the main rng, or `materializeReward`.
  - Then `applyLabPins` → `flow.deal` → `flow.plan` → `flow.card`.
- **`runPursue`, continues:** `flow.card`; a re-offer returns the cached card verbatim.
- **Quest build** (`generateChainBeat` 2785–3061):
  - Keep `slotCount`, `beatSideLoot`, the 35% relic, the difficulty caps, `sampleGravity` and `buildSlots`, now fed by `flow.asks`.
  - title = episode title; situation = prose; job = `metNames(job)`. `q.job` still feeds the map hover and the report.
  - Finale: approaches from `flow.approaches`, one slot per approach, gold at 70% standard. Delete the AI-approach branch and the free/release regex.
- **`doEndCycle`:**
  - One-offs still go to `ai.resolve`, unchanged.
  - Saga quests: `flow.reportIn` runs synchronously in the roll loop, then each `writeReport` runs in parallel and settles into the same `arrive()`. Everything is awaited together with `Promise.all`.
  - The defensive loop applies the floor to any saga quest that never landed.
  - Saga quests take no `sceneFacet`, habits or `partialCost` draws.
- **`applyResolution`, saga branch:**
  - Injuries come from the flow (D3): no AI band, no woundcite.
  - Push order: title · 「situation」 · before · ⚄ (unchanged) · coinTerms · after · **ledger** · news lines (⭐🩸⛓🍺💰…).
  - No ▸turn or speech lines; no AI edges or fleshed people (the flesh pass covers delivered focals).
  - `flow.afterReport` replaces `noteIntroduced`.
- **`advanceChain`:**
  - The ledger half (4980–5017) moves to `afterReport`. `bankBeat` is unchanged; it already re-poses a failed job.
  - Continuation lead: title `${plan.title} — ${next.title}`, hook = `latest`.
  - The 📖 line becomes `${plan.title}: ${status}.`
- **`finaleReady`:** drop the `settled` branch. Set `lastchance` when the finale comes from the failure budget or the stall guard (that is, beatIndex < N−1).
- **`settleFinale`:**
  - Dispositions are untouched.
  - `persistMetCast` reads `plan.cast` + `knowing.met`: at most 2 people, client > opponent > other, blurb = label. It mints lore ids for coined `p*` people, with sex and race from their SagaPerson (this replaces `castIdentity`). Plus D19.
  - `fleshPass` saga context: title = `plan.title`, kernel = `plan.answer`, situation = the last SagaLine, want = the cast entry's want.
- **Title readers:** `abandonQuest`, the lapse pass, `endWarnings`, `labState` and `noteCustodyChange` move from `bible.title` to `plan.title`. Re-offers use the cache. Live-saga cast fences are computed from the live chains' `saga.world.cast`.
- **Views:**
  - `chainViews` returns the economy fields plus `part, of, rows, card1, likely, lines, answer?, people`, and drops goal, situation, known and met.
  - `questCast` returns `quest.saga.matter`.
  - `approachOutcome` returns `WAY_GAIN[way] ?? ''`.
  - **`approachRewardWarn` reads `rewardKind` directly.** Today it goes through `approachOutcome`.
- **Old saves:**
  - `Game.load` throws `OldSaveError("this save is from an older storyteller — start a new game")` when any chain lacks `saga`.
  - Server boot prints that message and exits(1) without touching the file. A fresh game would overwrite the designer's save on its first autosave.
  - CLI `--load` prints the message, starts fresh, and never saves over the old file.
- **Determinism:** re-snapshot `determinism.test` and the §20 sims once. The main stream moves because the deleted story draws are gone; this re-snapshot is already planned in §4.5.
- **Tests:**
  - Rewrite: game, auditfixes (#33 becomes a planvalidate case), personalseed (a plain re-draw on the same input), queue (count `sagaCall`), forceoutcomes (spy on `payload.seed`), lorepersist, assign (the `questCast` shape), fixes0930 (replace its 5 `if (!chain) return` early returns with asserts), recurringcast, turnloop, continuation, reckoning (add saga reports landing out of order), migrate (add the refusal).
  - Delete: desoldier, slatephrase, and the `premiseFingerprint` cases in premiseclash.

## Step 5b: delete the old saga path
- **game.ts:** `generateGenesis` and its guards; the premise clash; `buildLoreSlate`'s saga use (delete the function if no one-off calls it); `stageBible`, `scrubUnmet`, `isMet`, `noteIntroduced`, `deSoldier`, `stakeGloss`; the saga calls of `lintCard`/`stripJobEcho`/`capitalizeCard`; `cachedBeatOut`; saga `sceneMode`; `settled`.
- **chains.ts:** `Bible`, `BibleCastEntry`, `ChainStoryState`, and the `bible`/`story`/`settled`/`lastGeneratedBeat` fields. `saga` becomes required.
- **AI layer:**
  - provider.ts: `genesis`, `GenesisInput/Out`, the saga fields of `QuestWriteInput`, the 'beat'/'finale' kinds, `chainContext`, `storyUpdate`; `review` if nothing uses it.
  - openai.ts: `sagaSystem`, `sagaResolveSystem`, `zGenesis`, `genesis`, the `chainContext` branch.
  - mock.ts: genesis and the saga branches.
- **keywords.ts:** the arrival, tell and obstacle pools. Keep `pickTone` and the one-off pools.
- **Flags:** STAKE, NOCLIENT, PERSONAL_CARD, PERSONAL_SEED, KNOWN_FACE, LAWWORDS, and the saga PROSE_VARIANT/CARD_VARIANT.
- **scripts/ (not typechecked):** grep for saga uses of genesis and writeQuest and list them in IMPL_NOTES.md. Delete nothing without Fable's go.
- **Done when:** `grep -rn 'bible\|genesis' v3/src` finds nothing on the saga side.

## Step 6: UIs at parity, in ONE commit (server view + web + CLI + extract.ts)
- **server/main.ts:** pass `quests[].saga` through; `cast` = matter; approaches carry `{label, outcome ('coin' or ''), warn, switchLoss}`; `chains` = the new `chainViews`. The server builds no saga text.
- **CLI `cli/format.ts`:**
  - **questDetail:**
    - header `═══ <episode> · <saga> ═══ (id, L, rarity, region, lapses)`;
    - card 1 prints prose, a blank line, then `logLines`; later cards print `logLines`, a blank line, then prose;
    - `ON THIS MATTER: Name — label · …`;
    - REWARD (the engine's line, unchanged);
    - `SAGA: part n of N (again) · setbacks f of b`, or `SAGA: the finale · the last chance · setbacks f of b`;
    - APPROACHES `[g0] label → coin · STAT  ⚠ warn`, plus the existing tests lines;
    - no ERRAND on saga quests;
    - the quests list shows "part n".
  - **chains / chainDetail:**
    - `═══ title ═══ (state)`, the rows, card 1;
    - `likely end · setbacks · set aside/progress`;
    - `So far:` with one line per attempt: `n ✓/~/✗ party — text · X hurt (band)`;
    - `The answer:` (after the finale only) and `People:`.
  - **Reckoning:** ledger lines arrive inside the blocks, so nothing is added. Leads show the new continuation title.
- **web:**
  - **QuestPage:**
    - the rows block sits inside `.body`: after `.sit` on card 1, before it on later cards;
    - the finale's stakes row is last;
    - no errand row on sagas;
    - clasps show matter name + label;
    - tooltip `c.goal` → `c.card1`;
    - "part n of N" with no "~".
  - **Chronicle:**
    - the sagas tab shows rows, card 1, So far, the answer and People;
    - `lineClass` maps `^(Learned|Took|Cost|Outcome):` to a new `r-ledger` class (story style, not loot).
  - **Others:** MapScreen tip kind line becomes "Saga · part n" (it keeps `q.job`); the Sheets `cast` kind shows the label and no `who`; css gets `.qlog` rows and marks in quest.css and `.r-ledger` in shell.css.
- **`scripts/sagalab/extract.ts`** (once R7 releases it): card prose stops at the log or ON THIS MATTER; log lines go to `log`; the beat regex becomes `part (\d+) of`; ledger lines go to `ledger`.
- **Test (new `cliformat.test.ts`):** `questDetail` and `chainDetail` print exactly the rows the server exposes (golden on a mock saga).

## Step 7: verify on the mock (builder), then the verifier (Fable)
- **`test/sagacampaign.test.ts`:** 3 seeds, auto-assign through every finale. Assert:
  - every saga ends done or slipped;
  - every card has prose and rows;
  - ledger lines appear only on won jobs, plus the finale's Outcome line;
  - no unmet name on any screen;
  - each placeholder block and its landed block start with the same lines;
  - continuation titles and hooks are right;
  - the old save is refused.
- **Mock CLI `--script`:** play one saga per seed to its finale and read every screen.
- **Fable:** run the context-free verifier on real builder output (the game's AIRAIDER_CALL_LOG: rendered prompts plus payloads).

## Step 8: real smoke on `--sonnet` (the implementer PLAYS)
```bash
cd v3
AIRAIDER_SAVE=$SCRATCH/smoke.json AIRAIDER_CALL_LOG=$SCRATCH/calls.jsonl npm run cli -- --sonnet --seed 7
#   pursue a starter saga lead → assign → end … → finale; also a personal saga
AIRAIDER_FORCE_OUTCOMES=1 AIRAIDER_SAVE=$SCRATCH/smoke2.json npm run cli -- --sonnet
#   lab saga scripts/sagalab/fixtures/B/<bumpy or lastchance fixture>.json   → failure re-pose + last chance
```
**Check:**
- The call log shows purposes plan/card/report, with the plan on the plan tier at medium effort.
- Time from pursue to card 1 (plan, then card 1, in sequence).
- No `plan-fallback` or writer fallback; any that happen are logged.
- The screens match the lab's.
- A finale report with one soldier reads right.
- Saga and one-off reports stream together in one reckoning.

**Optional billed check** (`--ai`, about $0.04 for two cycles): one saga on Sol + Luna. Watch for Luna's empty-bracket card.

After that comes the Phase 2e lab on sets A and B through drive.ts, and G2 (Fable).

## Step 9: ship to the designer (needs their go)
1. Stop the designer's server by port (3210/5273). It autosaves on every action and would write the old game back.
2. Move ALL of `v3/saves/` to `~/.airaider/saves-backup/<date>-pre-v4/`, including `portraits/web/`. Portraits are keyed by card id, and a fresh game re-mints c2 and c3.
3. Restart; the designer gets a fresh game.

Banners and GENERATION_FLOW §22 come only after G2.

## 3. Where the lab and the game disagree
Every default below keeps today's mechanics. ⏳ marks a designer ruling.

| # | lab | game today | build default |
|---|---|---|---|
| D1 asks ⏳ | no slots at all | the AI writes `ask` on every card | `EPISODE_TESTS[type]` (§2.4.1) → `AskSlotOut[]` → unchanged `buildSlots` (counts, difficulty, caps, fillability, one requirement); slot i takes option i%2. Personal: `mustBeFocal` on slot 0 when the soldier is in the episode's `people` (today's AI rule, now from data). Only who picks the stat changes; the rules don't |
| D2 finale | ways + `WAY_ATTR`; engine labels | AI approaches, or the canned trio | groups come from `plan.options` with labels from `finaleOptions`; rewardKind = way (gold-hoard → gold). Personal: talk→recruit, fight→captive, sneak→gold (`settleFinale` ignores kind on a personal saga; this keeps one easy gold road). Tests are today's trio: CHA social · STR melee+intimidation · INT roguery; personal talk CHA social · fight STR melee · sneak DEX roguery. One slot each; gold 70% standard |
| D3 injuries ⏳ | `rollHurt`: a success wounds 5% of the time; partial 33% wound (80/20); failure 50% (70/25/5) | AI band, guard (success none, partial ≤ low), cite check | `rollHurt` clamped by today's guard: success never wounds, partial at most light. lightly/badly/gravely → low/med/high → `rollInjuryTiers`, on the main rng; `hurt` is dealt to the report |
| D4 served-with | 30%, one edge | every pair | keep the game's rule |
| D5 party / decides | 2 soldiers on a job, 3 on a showdown; per-soldier heads invented | 1–2 per job, 1 per finale; a pooled roll | the real party. decides = most coins (`coins(card, slot.test)`), lowest = fewest, ties in slot order, no rng draw. The smoke checks a one-soldier finale |
| D6 ⚄ line ⏳ | whole coins | fractional bar plus coinTerms, parsed by Chronicle `cleanRoll`/`segment`, the QuestPage gauge and extract.ts | keep the game's line. If wanted later, one commit changes all four consumers together |
| D7/D8 Cost / Took / Held ⏳ | story-only ledger and log lines | nothing on sagas | ship as the lab has them, styled as story (`r-ledger`), never as loot; real loot keeps 🗝/💰/⛓ (an R6 open ruling) |
| D9 returning faces | a fixture pin; the lean focal is always a label-only stranger | lore-promoted or sequel focal the player knows; the slate brings faces back | a focal who is a returning face or a sequel focal is `known`, with `memory` = their strongest company edge blurb (only if the player read it) and `where`; their seat stays opponent. The client seat reuses a fenced lore face with a client-type edge at P(new) = θ/(θ+N) (`CAST_THETA`), ≤1 per saga, 2-saga cooldown, else coined. Untested in the lab with a known focal, so the smoke covers it |
| D10 wronged kin | `fixture.wronged` | no structured past | if `personalSeed` came from an edge to a castable lore person, seat them (known, memory = the blurb; a rival-type edge replaces the coined opponent). Otherwise no third seat, which is the lab's behaviour without `wronged` |
| D11 places | one town plus the landmark, every saga | landmark gate and `freshPlaceName` anti-repeat (the "Thornhollow ×8" problem) | one town (`freshPlaceName` on storyRng), plus the landmark only when the gate deals it; otherwise `land` uses seedPlain |
| D12 seed / tone | dealt theme | `sampleSeed` + `pickTone` on the main rng | `dealSeed(storyRng, recentThemeIds)`; personal → `personalSeed`; lab pin `spark`; tone as in the lab |
| D13 shape | L has no shape, but fx.shape gives the client's part and the floor's stake | — | deal a shape on storyRng for those two reads only |
| D14 last chance | failures ≥ budget (same formula as the game) | also the stall guard (3N cycles) | `lastchance` on either; road rows mark skipped jobs (`questLog`'s `over` rule) |
| D15 re-offers | none | verbatim re-offer from an in-memory cache | persist `rec.cache`; a failed attempt clears it; 3 unmarched offers still slip the saga |
| D16 📖 ⏳ | status only | bank band, "comes to a head", setbacks | R7's line; the bank band stays in the SagaStrip and the chain view |
| D17 card echo | none in the report | placeholder and final block re-print 「situation」 | keep the prose-only echo (placeholder and re-push must match); never echo the log |
| D18 fate | clean / slip only; report `result` = settles or the loss | `fateSentence` with 6 branches, sent to the narrator | `sagaFate` drives the Outcome line; `settleFinale`'s own news line stays beside it (⏳ minor: wording overlap) |
| D19 edges ⏳ | — | AI edges per report + `persistMetCast` + `settleFinale` | AI edges are gone for sagas; keep the other two; add the NPC → deciding soldier edge (§2.6, R3) to replace them |
| D20 Knowing | changed while the screen is built | views polled every second | change Knowing only at card creation and at report arrival; quests store rows and matter; views are read-only |
| D21 state | local variables | cycles apart, concurrent pursues | everything in `SagaRecord`; Sets become arrays |
| D22 direction | one string | `CampaignDirection` | guidance + " Keep out: " + avoid, in the payload, never in the system prompt |
| D23 counter | — | "beat N of ~M" | "part n of N": the plan fixes N |
| D24 models | Sonnet | Sol plan + Luna writer | the Claude transport matches the lab. GPT-6 is untuned on these prompts. Sol is about $0.03 per saga; `AIRAIDER_PLAN_MODEL=gpt-6-luna` brings it to about $0.006. Luna's empty-bracket card falls back to the writer floor |

Two more pending rulings are built on their defaults: the lean-cast trade/stake move (⏳ since R1; lean is the only cast ever measured), and gold "pays to go free" against R4's no-pay rule (ships as in the lab).

## 4. What stays lab-only (never ported)
- **v4lab:** `buildWorld`, `leanWorld` (its rule is folded into `castSaga`), `makeDraw`, `ProbeFixture`/`World`/`Draw`/`PlanCtx`, the arm machinery (S/H/full/named, `armKey`, the arm branches of `partOf`), `SHAPE_GLOSS`, `dealtTypes`, `TYPE_GAINS`, the FOLK/POWER trade pools, `outcomeFor`/`labOutcome`, `rollDice`, `pickParty`/`surnameOf`, and the `hashStr` seeding.
- **probe.ts, all of it:** arms, fixtures, SEEDS, `runCli`/`cliSlot`/`parseLenient`/`extractJson`, its own OpenAI client with gpt-5-mini prices, `--render`/NEED, the file writers, SERIES, `capBreaks`/`textLint`.
- **Also:** mech.ts, score.ts, judge_gpt.ts, modelcmp, reports and runs.
- **Lab hooks that stay in the game:** engine/lab.ts; `labSaga`, `labFort`, `labFocal`, `applyLabPins`, `forceOutcome`, `labState`; CLI `lab`/`mark`/`ailog json`; AIRAIDER_FORCE_OUTCOMES and AIRAIDER_CALL_LOG.
- **drive.ts and extract.ts** stay, and are still needed afterwards to judge the real CLI at G2. `LabFixture` lacks the probe's returning/wronged/seed pins, so in-game runs cannot be paired one-to-one with probe runs.

## 5. Watch list
- Porting before Step 0's freeze means porting twice.
- R6 measured M5 at 62% and M11 at 1.33, so G2 may fail. After one fix round it goes to the designer.
- Pursue is now two calls in sequence: about 40 s on Sonnet, with the Sol plan alone about 34 s. On R5 it is three calls. The background queue hides this.
- The §20 baselines move once, in Step 5a.
- Step 9 deletes nothing; it only moves files.
