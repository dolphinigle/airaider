# Prototype OPEN QUESTIONS

Things that came up during M0 that we made a conservative call on, plus things we deliberately deferred. **Every entry here is a deliberate non-decision** — if you want to lock one, edit `docs/CANONICAL_DESIGN.md` and remove from here.

Format: each entry says **(a)** what the question is, **(b)** what M0 currently does, **(c)** the conservative fallback if no decision is made.

---

## Coin engine

### Q1. All-heads / all-tails crit threshold
- Refs: CANONICAL §2.1, §7 #13
- **Now:** crit only at N ≥ 3 coins. At N = 1 or 2 a single tails is just "unfavorable," not catastrophic.
- **Conservative fallback:** keep N ≥ 3 floor — single-coin coin pools (only 1 attribute relevant) shouldn't be able to crit either way.

### Q2. Split / middle-band default direction
- **Now:** 50/50 splits read as `unfavorable` (pessimistic). The player has to bring real merc-fit to flip to `favorable`.
- **Conservative fallback:** keep pessimistic. Generosity is easy to add later; removing it after the player normalizes feels punitive.

### Q3. Should band depend on N (coin pool size)?
- **Now:** No — same heads-ratio bands regardless of N.
- Idea for later: bigger pools should swing further (4-of-5 heads feels different from 8-of-10). Defer until M1 fixtures suggest it.

---

## Scenario / coin budget

### Q4. Coin-budget formula
- **Now:** `min(summedSlotContributions, scenario.coinBudget + (partySize − partySize.min))`, then capped at `MAX_COINS = 7`.
- **Conservative fallback:** small fixed budget per scenario (3 typical, 5 for climaxes) + 1 per extra party member. Tune as fixtures demand.

### Q5. Attr threshold for bonus coin
- **Now:** `score ≥ 4` (Above Average) grants +1 coin to that slot.
- **Conservative fallback:** keep at 4. Could move to ≥ 5 (Strong) if early game feels too easy; could add a *second* bonus at ≥ 6 (Exceptional) for high-tier mercs.

### Q6. Tag-tier (T1-T5) doesn't currently grant extra coins
- **Now:** every matching `preferredTag` is worth +1 coin regardless of T-tier or rarity.
- Idea for later: T2/T1 rolls grant +2; legendary tags grant +3. Defer until tag-tier interactions are demonstrated to feel weak.

### Q7. Tag-on-tag pairwise synergy
- **Now:** none. Each merc is scored independently.
- **Conservative fallback:** add +1 coin per pair of party mercs sharing a personality tag (CANONICAL §5 god-combo seed). Planned for M1.

---

## Mercs / tags

### Q8. Mock LLM picks `tags[0]` for the contribution line — currently surfaces gender first
- Cosmetic only (mock isn't shipping). Real OpenAI references the most-narrative-relevant tag anyway.
- **Conservative fallback:** mock could prefer non-gender / non-background mutex tags when available. Not worth fixing in M0.

### Q9. `attrBias` in tag data is documentary only
- **Now:** merc attrs in `data/mercs.json` are PRE-BAKED; tag attrBias is metadata for future re-rolling, not engine math.
- **Conservative fallback:** when a recruit generator lands (M3?), it applies `attrBias` at hire time.

### Q10. HP scale (0-3)
- **Now:** every merc starts at HP 3; nothing actually deducts HP yet.
- **Conservative fallback:** wait for permadeath spec (CANONICAL §7 #2, #6). M2-M3 problem.

### Q11. Veterancy is loaded but unused
- **Now:** `veterancy: 0-5` in JSON; engine ignores it.
- **Conservative fallback:** wire into M1 as a small "+1 coin once per scenario if V ≥ 2".

### Q11b. Day-level fatigue is not surfaced to the LLM
- **Now (M2):** the engine tracks fatigue and applies a coin penalty, and the transcript shows `[fatigued N, −P]`, but the LLM request does not include fatigue. The narration therefore can't say "Marek is dragging from yesterday's intimidation."
- **Conservative fallback:** add a `fatigueAtStart` field to `ScenarioLLMRequest.party[i]` and pass it through `resolveScenario`. Small, low-risk; deferred only to keep M2 focused.

---

## LLM layer

### Q12. Real-LLM tests
- **Now:** no automated tests against real OpenAI; one curated sample per fixture is committed for human review.
- **Why:** non-determinism makes snapshot diffs noisy. Burn rate also non-trivial in CI.
- **Conservative fallback:** keep mock-LLM as the regression test. Add a `npm run smoke:real` script later that just exercises one fixture end-to-end without asserting content.

### Q13. JSON-Schema strictness on nano vs 4o-mini
- nano accepted `strict: true` JSON Schema and returned valid JSON on the M0 smoke test. We have N=1 evidence.
- **Conservative fallback:** if strict-mode ever fails on nano, fall back to `response_format: {type:'json_object'}` and validate with zod (`OpenAIScenarioLLM.narrate` already parses through zod).

### Q14. Llama 3.3 70B via Groq
- Deferred to M3 per CANONICAL §AI_PROVIDER. Will require a `GroqScenarioLLM` mirroring `OpenAIScenarioLLM`; both speak OpenAI-compatible API.

### Q15. Temperature
- **Now:** 0.7 — generous variability for character voice.
- **Conservative fallback:** keep at 0.7 for narrative fixtures; lower to 0.3 only if mechanical outputs ever feel inconsistent.

### Q16. Token budget per call
- **Now:** `max_tokens: 800` and `callLimit: 5` per process.
- **Conservative fallback:** raise via constructor; never silently.

---

## Engine-level deferred

### Q17. Multi-scenario raid (3-5 scenarios per raid per CANONICAL §GAMEPLAY_LOOP)
- **Now:** one scenario per CLI invocation.
- **Conservative fallback:** M2 — wrap N scenarios in a `Raid` container, carry mercenary state forward (fatigue, HP).

### Q18. Climax scenario with 2-3 approaches
- CANONICAL says climax slots multiple approaches with different consequences.
- **Now:** every scenario is single-approach.
- **Conservative fallback:** M2 — add `approaches?: Array<{name, slots, ...}>` to scenario schema.

### Q19. Errands / long-clock scenarios
- CANONICAL `GAMEPLAY_LOOP.md` calls these out. Same engine, different clock.
- **Now:** no clocks.
- **Conservative fallback:** M2-M3.

---

## Process / discipline

### Q20. Per-prototype `package.json` vs root
- **Now:** prototype has its own `package.json` (chose isolation over hoist).
- **Conservative fallback:** keep separate. If the GUI layer arrives later, switch to npm workspaces.

### Q21. ESM-only (`"type": "module"`)
- **Now:** ESM. Works with tsx + vitest. No CJS dependencies needed so far.
- **Conservative fallback:** stay ESM unless an Angular GUI later forces CJS.
