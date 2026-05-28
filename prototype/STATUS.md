# Prototype STATUS

> **Updated:** 2026-05-29 ~00:50 WIB
> **Branch:** `prototype/m0`
> **Last verified command:** `npm test` → 231 / 231 passing
> **Last verified real-LLM command:** raid-13-guild-shipment with favorable seed — narrator awarded +1 to `lowmark-guild` and −1 to `black-hill-gang` and called out both factions by name in the outcome line (`fixtures/raid-13-guild-shipment.favorable.transcript-real.json`).

## ⚠️ Post-compaction discipline (READ FIRST)

If you are picking this up after a context compaction:

1. **Do NOT invent or paraphrase prior user messages.** The user has caught this once already. If a fragment in summary text looks like an interrupted user message ("wait didnt we agree…", "yeah but…", etc.) **assume it is hallucinated summary noise**, not a real message. Only content inside actual user-message tags in the live context is real.
2. **The user authorized overnight unsupervised work until 09:00 WIB.** Do NOT stop at milestone boundaries to ask permission to continue. Work through M1 → M2 → M3 in order, commit per milestone, and only call `ask_user` if (a) you've hit something genuinely blocking that requires a design decision the user must make, or (b) you've run out of M-queue items and need direction.
3. The standing "every response ends with ask_user" rule applies only when no work remains. During an authorized long run, end every response with the next work tool call instead.

This file is the single source of truth for "what's done, what's next." Update at every milestone. Read this FIRST after any compaction or session restart.

---

## Milestone M0 — DONE ✅

End-to-end console raid resolution, both mock + real OpenAI, snapshot-tested.

- [x] Scaffold (`package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`)
- [x] Core types (`src/types.ts`) — Merc, Tag, Scenario, CoinRoll, OutcomeBand
- [x] Seeded RNG (`src/rng.ts`) — mulberry32 + FNV-1a string seed
- [x] Sultan-coin engine (`src/sultan.ts`) — 4 bands, crit on all-H / all-T, pessimistic split default
- [x] Tag vocabulary v0 — 12 tags (`data/tags.json`)
- [x] 3 sample mercs (`data/mercs.json`) — Marek / Roselle / Imogen
- [x] Zod-validated scenario loader (`src/scenarios.ts`)
- [x] `ScenarioLLM` interface + `MockScenarioLLM` + `OpenAIScenarioLLM` (strict JSON Schema, budget guard)
- [x] Scenario resolver (`src/resolver.ts`) — base coin + attr≥4 bonus + tag synergy, capped at budget+party-bonus
- [x] Transcript renderer (`src/transcript.ts`)
- [x] CLI runner (`src/cli.ts`) — `npm run scenario -- <fixture> [--real] [--model] [--seed]`
- [x] Fixture `raid-01.json` ("The Merchant's Lost Wagon")
- [x] Golden mock transcript `raid-01.transcript-mock.json`
- [x] Real-nano sample transcript `raid-01.transcript-real.json` (committed for human review)
- [x] Snapshot test passes (`test/fixture.test.ts`)
- [x] Unit tests: 15 sultan, 5 resolver, 1 fixture = 21 / 21 ✅
- [x] README explains console=prototype, GUI=later
- [x] OPEN_QUESTIONS.md seeded

## Milestone M1 — DONE ✅

All 5 scenario archetypes covered + party-pair synergy.

- [x] Add 2 mercs (Dren — male/soldier/brave/quick; Veska — female/scholar/stoic)
- [x] Fixture `raid-02-recruit.json` ("The Coward at the Crossroads")
- [x] Fixture `raid-03-captive.json` ("The Brigand's Tongue")
- [x] Fixture `raid-04-build.json` ("Watchtower at the Pass")
- [x] Fixture `raid-05-tavern.json` ("The Recruits' Drinking Match") — synergy demo
- [x] Golden mock + real sample per fixture, all committed
- [x] Parameterized snapshot test over all 5 fixtures
- [x] Tag-on-tag synergy: +1 coin per pair of party mercs sharing a `pers:*` or `temp:*` tag, capped at `SYNERGY_CAP=3`
- [x] Synergy unit tests (7 tests)
- [x] Transcript shows SYNERGY line when fired

## Milestone M2 — DONE ✅

Day loop with fatigue accumulation.

- [x] `Day` schema + `loadDay` + `resolveDay` (`src/day.ts`)
- [x] Per-merc fatigue accumulation across scenarios
- [x] Fatigue penalty: at-start fatigue ≥ `FATIGUE_THRESHOLD=2` ⇒ −1 coin to that merc's slot (floor 1)
- [x] Day-level CLI: `npm run day -- fixtures/day-01.json [--real]` (`src/cliDay.ts`)
- [x] Day transcript renderer with day-end fatigue summary (`src/dayTranscript.ts`)
- [x] `fixtures/day-01.json` ("First Day at the Crow's Wing"): raid-01 → raid-03 → raid-04, marek used in all three (demonstrates fatigue penalty on scenario 3)
- [x] Mock day golden + real day sample (committed at `fixtures/day-01.day-mock.json` and `day-01.day-real.json`)
- [x] 5 day-loop tests: fatigue accrual, penalty trigger, no-penalty for fresh mercs, determinism, golden snapshot
- [x] Tests now 37 / 37 ✅

## Milestone M3 — DONE ✅

- [x] M3.1 Pass fatigue to LLM request so narration can reference yesterday's exertion (commit `2f41546`)
- [x] M3.2 Tag-rarity-aware recruit pool generator + 10 new tags incl. 1 legendary (commit `ac9fe75`)
- [x] M3.3 Captive cycle (5 outcomes: ransom / sell / display / recruit / execute) (commit `6802c8e`)
- [x] M3.4 Roster JSON persistence (save/load across days; `npm run day -- ... --roster=PATH`) (commit `54abccc`)
- [ ] Llama 3.3 70B via Groq A/B (BLOCKED: no GROQ_API_KEY)

## Milestone M4 — DONE ✅ (overnight)

- [x] M4.1 Three new themed raid fixtures (raid-06-mire, raid-07-plague, raid-08-tax-riot) + mock/real transcripts (commits `46d4a8a`, `02d383d`)
- [x] M4.2 Merc backstories woven into LLM payload (commit `dadae6a`) — `backstory?: string` on Merc, threaded through OpenAI scenario prompt with anchor-one-detail directive
- [x] M4.3 3-day campaign demo with persistent roster (commit `5fd7c72`) — `day-01` → `day-02` → `day-03` against `fixtures/campaign-roster.json`, 8 nano-narrated scenarios in sequence, cumulative fatigue
- [x] M4.4 `SAMPLES.md` morning-handoff doc — navigation guide to every committed transcript (commit `c2478ea`)

## Milestone M5 — DONE ✅ (overnight, all five)

- [x] M5.1 Wounds / permadeath math (commit `91251ed`). HP threading on merc + roster (schema v1 → v2 with `deceased[]`), resolver writes `casualties[]`, transcript surfaces wounds, deterministic-seed tests for crit-fail trigger / favorable no-op / permadeath removal.
- [x] M5.2 Multi-day quest arcs (commit `787db7a`). `Quest` schema, `pers:touched-by-the-mire` seeds the "Echoes of the Mire" 3-stage arc (raid-06 → raid-09-mire-shrine → raid-10-mire-confrontation), roster schema v2 → v3 (`activeQuests[]` / `completedQuests[]`), auto-stir + auto-advance in day loop, `npm run quests -- show <roster>` CLI, 3-day real-LLM demo (`quest-day-{1..3}.real.json`).
- [x] M5.3 Climax scenario with multi-approach selection (commit `50bef42`, typecheck fix `d469c3e`). `ScenarioApproach { id, label, slots, slotModifiers }` with per-slot `coinDelta` / `requireTag`; `raid-11-the-warden` ships three approaches (assault / parley / poison-the-well); CLI `--approach=<id>`; mock + real transcripts per approach.
- [x] M5.4 Errand long-clock scenarios (commit `8a6112e`). Scenarios gain `daysToResolve`; roster schema v3 → v4 with `pendingErrands[]`; `dispatchErrand` / `resolveDueErrands` integrated into day loop; `raid-12-errand-courier` (4-day round trip to Lowmark) + real-LLM demo where the errand fires on day 4.
- [x] M5.5 Reputation surfacing in scenarios (commit `74de9d6`). `factionContext[]` with per-band deltas (with catastrophic→unfavorable and catastrophic-favorable→favorable fallbacks); resolver emits `reputationDeltas[]`; transcript renders REPUTATION block; LLM prompt receives faction summary + current standing; day loop mutates `roster.reputation` after each scenario + errand return; `raid-13-guild-shipment` demo with Lowmark Guild vs Black Hill toll-gang.

## Milestone M6 — DONE ✅ (overnight, all four)

- [x] M6.1 Veterancy progression (commit `da13ee5`). `mercState.xp` + `tier ∈ {rookie, veteran, grizzled}`; XP awarded per band (favorable 2, catastrophic-favorable 3, unfavorable 1, catastrophic 1); thresholds 10 / 25; one-shot PROMOTIONS block in day transcript; roster schema v4 → v5 with default-based migration; 8 new tests (93 total).
- [x] M6.2 Co-deployment bonds (commit `67cdf9e`). `mercState.coDeployments` counts shared scenarios; after `BOND_THRESHOLD=3` shared deployments a `bond:trusts` synergy pair is injected; BONDS FORMED block in day transcript; roster schema v5 → v6; 8 new tests (101 total).
- [x] M6.3 Season clock (commit `1c6ec28`). `src/season.ts` derives `seasonClock = {season, dayOfSeason}` from `roster.dayCount` (no schema bump); 4 seasons × 30 days each; scenarios may carry `seasonModifier:{thaw,high,wane,frost}` flat coin deltas; LLM prompt picks up season for narration colour; `fixtures/raid-14-frostwatch.json` build scenario with frost penalty / high-summer bonus; 6 new tests (107 total).
- [x] M6.4 Fort upgrade hooks (commit `391265e`). Roster schema v6 → v7 adds `fort: {level, upgrades[]}` (level≥1, defaults via Zod so v6 rosters load cleanly). `data/fort-upgrades.json` catalog of 5 upgrades (Reinforced Palisade L1→2, Winter Larder, Smithy L2→3, Chapel L2, Watch Tower L3→4) with cost + `requiresLevel` gates and an optional `levelsUp` flag. New `npm run fort -- <roster.json> list|upgrade <id>` CLI with friendly error reporting for already-owned / insufficient-gold / level-locked. 9 new tests (116 total).

## Milestone M7 — IN PROGRESS

- [x] M7.1 Fort upgrade mechanical effects (commit `0c0e85d`). `src/fortEffects.ts` exposes pure helpers: `flatCoinBonus` (smithy +1 if any merc deployed), `slotCoinBonus` (watch-tower +1 per `sentry`/`scout`/`watch` slot), `negativeSeasonClamped` (winter-larder zeros negative season modifiers), `palisadeBlocksCasualty` (catastrophic damage clauses dropped). Threaded into the resolver via `ResolutionInput.fortUpgrades`; day.ts + errands.ts pass `roster.fort.upgrades`. Chapel is narrative-only. 7 new tests (123 total).
- [x] M7.4 Daily events table (commit `40485aa`). `src/events.ts` rolls one entry per day from `data/events.json`, filtered by current season + `requiresUpgrades[]` / `requiresMissingUpgrades[]`, weighted-sampled, deterministic via `rngFromString('event-<dayCount>')`. Effects: `goldDelta` added to `roster.gold`, `fatigueDelta` applied to every merc (clamped at 0), `reputationDeltas[]` merged. Surfaces as a `DAILY EVENT` block at the top of the day transcript. Seven seed events spanning all four seasons; `bandit-scouts` gated by missing watch-tower. 8 new tests (131 total).
- [x] M7.2 Multi-day campaign demo (commit pending — fixtures + script). `scripts/m7-campaign.sh` runs a deterministic 5-day campaign on `fixtures/m7-campaign-roster.json` (dayCount 27 → 32) that exercises every M6 + M7 system: thaw → high season transition, daily-event swap (`thaw-market-day` × 3 → `high-bandit-scouts` × 2), mid-campaign upgrade purchases (palisade after day 1, smithy after day 3), marek/veska promotion to veteran, and marek↔veska bond formation. Committed mock transcripts at `fixtures/m7-day-{1..5}.day-mock.json` and final roster at `fixtures/m7-campaign-roster.final.json`.
- [x] M7.5 Affordable fort upgrade hint (commit `c1f0c3c`). `affordableUpgrades(catalog, fort, gold)` in `src/fort.ts` returns the catalog entries the roster could buy right now, ordered by cost then id. `resolveDay` populates `DayResolution.fortHints` whenever a roster is present, and `dayTranscript.ts` renders a `FORT HINT:` block after BONDS FORMED. 3 new tests (134 total).
- [x] M7.7 Event catalog expansion (commit `7219db6`). `data/events.json` 7 → 14 entries spanning all four seasons more densely: refugees (wane), merchant-caravan (thaw), tollgang-pressure (high), grain-fire (wane), chapel-vigil (gated on chapel), wolves-at-walls (frost, watch-tower-missing), bard (thaw/high). 2 new tests + the wane reputation-park fixture moved to frost (136 total).
- [x] M7.x foot-gun fix (commit `c966079`). `npm run day` / `npm run scenario` now refuse to overwrite the default-path transcript unless `--out`, `--force`, or `--no-write` is given. cliDay checks both early (pre-side-effect) and at write time. Caught while playtesting on a fresh roster — the old behaviour silently clobbered the committed `fixtures/day-01.day-mock.json` golden.
- [x] M7.8 Veterancy tier feeds the coin pool (commit pending). `ResolutionInput.tierOf?` (and `SlotContribOptions.tierOf`) wires `roster.states.get(id).tier` into `computeSlotContributions`: veteran adds +1 coin to their own slot, grizzled +2, rookie unchanged. Bonus stacks on top of base, attr, and tag bonuses but does NOT bypass the fatigue floor (slot still ≥ 1 coin pre-tier). `SlotContribution` gains `tier` + `tierBonus` fields, threaded through day.ts + errands.ts; transcript renders `[veteran, +1]` next to the slot. All 9 raid + day-01 mock goldens regenerated. 2 new tests (138 total).
- [x] M7.6 Persistent fort log (commit pending). Roster schema v7 → v8 adds `fortLog: { day, kind: 'upgrade'|'event'|'note', message }[]`, bounded to `FORT_LOG_MAX = 50` via `appendFortLog`. Wired into `cliFort upgrade` (upgrade entries) and `day.resolveDay` (daily-event entries). `DayResolution.newFortLogEntries` exposes the entries appended this day; `dayTranscript` renders them as a `FORT LOG (today):` block before the bottom border, and `npm run roster show` tails the last 5 entries. Legacy v7 rosters load cleanly with `fortLog = []`. 3 new tests (141 total).
- [x] M7.10 End-of-day fatigue recovery (commit pending). `resolveDay` now decrements fatigue by 1 (floor 0) at end-of-day for every roster merc who is neither deployed today (in any scenario / errand dispatch) nor currently on a pending errand. Tracked as `DayResolution.fatigueRecovery: {mercId, before, after}[]`; rendered as a `RECOVERY (rested, −1 fatigue):` block in the day transcript when non-empty. Roster-less mode returns an empty array. m7-campaign demo now exhibits recoveries on day 3+. 3 new tests (144 total).
- [x] M7.9 Bond reduces fatigue penalty (commit pending). When a slot occupant is bonded with any other merc in the same party, their fatigue penalty is softened by 1 (floor 0). `SlotContribOptions.bondedPairs` added; `SlotContribution.bondFatigueRelief: number` surfaces the per-slot effect; transcript renders `[fatigued N, −X, bond +1]` (or `[fatigued N, bond +1]` when the penalty was fully cancelled). All 9 raid + day-01 goldens regenerated with the new field. 3 new tests (147 total).
- [x] M7.11 LLM narrator gets tier + bond context (commit pending). `ScenarioLLMRequest.party[i]` gained optional `tier: 'rookie'|'veteran'|'grizzled'` and `bondedPartyMercIds: string[]`, populated by `resolveScenario` from `input.tierOf` + `input.bondedPairs`. OpenAI system prompt instructs the narrator to lean into veteran/grizzled experience and give bonded pairs one shared beat. Mock LLM ignores the new fields (goldens unchanged). Closes Q11b. 2 new tests (149 total).
- [x] M7.12 Chapel heals idle wounds (commit pending). The chapel fort upgrade — narrative-only since M7.1 — now grants 1 hpDamage healing at end-of-day for every roster merc who is idle (not deployed today, not on a pending errand) and has hpDamage > 0. `DayResolution.woundHealing: {mercId, before, after}[]` surfaces the per-merc effect; `dayTranscript` renders `CHAPEL HEALING (−1 hp damage):`. New helper `chapelHealsWounds(effects)` in fortEffects. Healing mutates `roster.states[id].hpDamage` directly (the hp damage field already round-trips on the live roster, unlike fatigue which uses initialFatigue). 4 new tests (153 total).
- [x] M7.13 Smithy/winter-larder secondary effects (commit `b559bdc`). `smithyCasualtyReduction(effects)` subtracts 1 from catastrophic casualty hp damage (floor 0), stacking with the existing +1 flat coin; combined with the base damage of 1 this effectively cancels the single wound. `fatigueRecoveryAmount(effects, season)` returns 2 (instead of 1) when winter-larder is present AND season is frost — idle mercs recover twice as fast through the deep cold. Both behaviors are pure helpers in fortEffects.ts and exercised by 2 unit tests; no fixture regen required. (159 total)
- [x] M8.2 Enemy-tier punitive events (commit `c8e2368`). `events.json` schema gains optional `requiresEnemyFaction: boolean`; `EventRollContext` gains optional `enemyFactions: Iterable<string>`. `eligibleEvents` filters out punitive events unless at least one enemy-tier faction is present. `resolveDay` computes the roster's enemy-tier factions via `reputationTier` and passes them in. Two new catalog entries: `enemy-bounty-posters` (−2 gold) and `enemy-night-raid-probe` (+1 fatigue to all). 3 new tests (162 total).
- [x] M8.1 Reputation tiers + ally coin bonus (commit `5b3e14e`). `src/reputation.ts` introduces `ReputationTier ∈ {ally, friendly, neutral, hostile, enemy}` at thresholds ±5 / ±3 / 0. `allyCoinBonus(factionContext, reputationOf)` returns +1 coin per ally-tier faction listed in the scenario's factionContext (stacks at the sum stage; clamp now includes the bonus). LLM factionContext payload gains `standingTier` so the narrator can color the scene. `npm run roster show` now prints `lowmark-guild:6(ally)` style tier next to each reputation entry. 4 new tests (157 then 159 total). Hostile/enemy tiers narrative-only this milestone — punitive enemy event slated for M8.2.
- [x] M7.3 Recruit gated by fort level (commit pending). `effectOf(captive, action, ctx?)` gains optional `EffectContext` with `fortLevel`. When action is `recruit` AND `ctx.fortLevel < RECRUIT_MIN_FORT_LEVEL (=2)`, the effect is marked `blocked: { reason }` instead of producing a recruited merc — captive stays. `cliCaptive` gains a `--fort-level=N` flag and renders `→ BLOCKED (...)` in the transcript when applicable. No prior caller breaks: omitting `ctx` preserves original recruit semantics (used by existing tests and fixtures). 4 new tests (166 total).
- [ ] M7.3 Recruit gated by fort level (deferred — captive→recruit refactor)
- [x] M15.1 Roster status alerts (commit `9f8c720`). `src/rosterAlerts.ts` exports `statusAlerts(roster)` returning short alert lines: debt streak warning, payday countdown when ≤2 days away, tavern refresh countdown when ≤2 days away AND bench below `HIRE_POOL_TARGET_SIZE`. `npm run roster show` renders an `alerts:` block under the header, plus a `Tavern bench (N):` listing and the merc's veterancy tier next to each name. Extracted into its own module so tests can import without triggering the cliRoster main(). 4 new tests (217 total).
- [x] M11.2 Captive recruit lands on the tavern bench (commit `7c2641f`). `effectOf(captive,'recruit')` now also sets `benchPrice = max(1, notoriety+1)`, a deliberate undercut of `HIRE_BASE_PRICE` (5g). `applyCaptiveEffect` no longer drops the recruited merc into `roster.mercs`; instead it pushes a `HirePoolEntry` to `roster.hirePool` at the discount price with `postedDay = roster.dayCount`. The captive record is still consumed. Player must still pay to actually hire them via the normal tavern flow. cliCaptive transcript line now reads `→ posted to tavern bench @ Ng`. Bumped `recruit-cap1` round-trip test to assert the bench placement. 3 new tests + 1 retargeted test (220 total).
- [x] M13.1 Enemy-faction quest auto-stir (commit `3f9e933`). `quests.json` schema gains optional `seededByEnemyFaction: string`; QuestSchema's `seededByTag` is now also optional. New finder `findEnemyFactionStirrableQuests(roster, catalog, enemyFactions)` returns quests whose enemy faction is currently at enemy tier and aren't already active/completed. `resolveDay` computes the end-of-day enemy-tier factions (post scenario rep deltas) and auto-stirs any matching quest, recording entries in `DayResolution.questsStirred` and appending a `[note]` fortLog entry. dayTranscript renders a `QUESTS STIRRED:` block. Seed catalog entry `lowmark-bounty` (2-stage bounty hunt) demonstrates the mechanic. 8 new tests + 6 day-mock goldens patched with `questsStirred: []`. (228 total)
- [x] M12.2 Watch-tower forecasts tomorrow's daily event (commit `4a92b6d`). `rosterAlerts.ts` exports `watchTowerForecast(roster, eventsPath)` returning null unless the fort owns the `watch-tower` upgrade. Otherwise rolls tomorrow's event using the same `rngFromString('event-' + (dayCount+1))` seed the day loop uses, with current season + fortUpgrades + enemy factions in scope, and returns `{ label, line }` formatted as `▲ Watch-tower forecast (day N): <label>  (+Ng, fatigue +1, ...)`. cliRoster show appends this under `alerts:`. Pure, no roster mutation. 3 new tests (231 total).



---

## Standing rules (DO NOT FORGET)

- Mercenary terminology, NOT heroes
- Rarity vocabulary RESERVED FOR TAGS ONLY (attributes use Poor → Peerless mundane scale)
- Permadeath real; avatar wage = 0; flat wage rule
- Every commit on `prototype/m0` (not main); push frequently; commit message includes test output
- Co-author trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
- Never commit/log/echo the API key
- LLM budget guard: max_tokens=800, callLimit=5 per process unless overridden
- Open design question? → log to OPEN_QUESTIONS.md, take conservative path, move on
- Real-LLM regression tests are NOT in scope (non-determinism); we commit ONE curated sample per fixture for human review

---

## Re-orient ritual (read this after any compaction)

1. `cat prototype/STATUS.md` (this file)
2. `cat prototype/OPEN_QUESTIONS.md`
3. `git log -20 --oneline`
4. `git status`
5. `npm test` (in `prototype/`) — should be all green
6. Glance at `prototype/README.md` if rusty
7. Then continue with the next unchecked M1 item
