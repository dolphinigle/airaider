# Prototype STATUS

> **Updated:** 2026-05-28 ~20:45 WIB
> **Branch:** `prototype/m0`
> **Last verified command:** `npm test` → 21 / 21 passing
> **Last verified real-LLM command:** `npm run scenario -- fixtures/raid-01.json --real` → nano produced sensible grimdark narrative on UNFAVORABLE band

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

## Milestone M3 — IN PROGRESS

- [x] M3.1 Pass fatigue to LLM request so narration can reference yesterday's exertion (commit `2f41546`)
- [x] M3.2 Tag-rarity-aware recruit pool generator + 10 new tags incl. 1 legendary (commit `ac9fe75`)
- [x] M3.3 Captive cycle (5 outcomes: ransom / sell / display / recruit / execute) (commit `6802c8e`)
- [x] M3.4 Roster JSON persistence (save/load across days; `npm run day -- ... --roster=PATH`)
- [ ] Llama 3.3 70B via Groq A/B (BLOCKED: no GROQ_API_KEY)

## Milestone M4 — STILL DEFERRED

- [ ] Multi-day quest arc seeded by rare tag (mini Sevrenne pattern)
- [ ] Climax scenario with multiple approaches
- [ ] Errand long-clock scenarios
- [ ] Wounds / permadeath math



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
