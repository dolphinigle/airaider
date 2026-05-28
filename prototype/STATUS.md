# Prototype STATUS

> **Updated:** 2026-05-28 ~20:35 WIB
> **Branch:** `prototype/m0`
> **Last verified command:** `npm test` → 21 / 21 passing
> **Last verified real-LLM command:** `npm run scenario -- fixtures/raid-01.json --real` → nano produced sensible grimdark narrative on UNFAVORABLE band

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

---

## Milestone M1 — NEXT (stretch attempted this session)

Goal: prove the engine across all 5 scenario archetypes + add tag-on-tag party synergy.

- [ ] Fixture: `raid-02-recruit.json` (tavern recruit interview, archetype: `recruit`)
- [ ] Fixture: `raid-03-captive.json` (interrogating a captured human, archetype: `captive`)
- [ ] Fixture: `raid-04-build.json` (commissioning a new room, archetype: `build`) — *note CANONICAL §2.11 says construction takes no scenario slot; this fixture exists to validate the archetype's narrative shape only*
- [ ] Fixture: `raid-05-tavern.json` (downtime/morale, archetype: `tavern`)
- [ ] Golden mock + real sample per fixture
- [ ] Snapshot tests for each
- [ ] Add "tag-on-tag" pairwise bonus: +1 coin per pair of party mercs sharing a personality / temperament tag (CANONICAL §5 god-combo seed)
- [ ] Add veterancy contribution: V≥2 grants +1 coin once per scenario
- [ ] Tune budget formulas as needed based on fixture playthroughs

## Milestone M2 — DEFERRED (probably not tonight)

- [ ] Day loop: campaign harness — multi-scenario per day, fatigue tick
- [ ] Roster persistence (save/load JSON)
- [ ] Multi-day quest arc seeded by rare/legendary tag (mini Sevrenne pattern)

## Milestone M3 — DEFERRED

- [ ] Llama 3.3 70B via Groq (A/B against nano on narrative-heavy fixtures)
- [ ] Captive cycle (ransom/sell/display/recruit/execute)
- [ ] Basic prestige tier ticks
- [ ] Tag-rarity-aware recruit pool generator

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
