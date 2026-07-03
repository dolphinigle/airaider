# v3 Implementation Notes — impl-time rulings & knob settings

Everything here is an **implementation-time decision** inside the docs' sanctioned 🛠/🟡 space
(or an explicit small ruling flagged for the designer). The locked design (GENERATION_FLOW §1–§21)
was not reopened. Dogfooding = the autoplay harness (`scripts/autoplay.ts`, mock AI, 800-cycle runs)
+ real-AI campaigns (`scripts/aicampaign.ts`, `scripts/aismoke.ts`).

## Impl rulings (flagged 🟡 in docs → decided here)

| # | Ruling | Doc anchor | Why |
|---|---|---|---|
| 1 | **Pursued quests expire after 10 cycles** (+ explicit `abandon`); a lapsed chain beat respawns its continuation lead | QUESTS §10 "pursued-quest lifecycle 🟡 decide at impl" | Un-mannable quests walled roster capacity forever (dogfood deadlock) |
| 2 | **Finales always get mutex approach-groups, ONE slot per approach**; if the AI omits them the engine synthesizes the canonical trio (win-over/subdue/cash-out) | QUESTS §9 (finale branches 🔒-shape) | An unbranched 3-slot finale can exceed roster width → infinite stall (found in real-AI campaign) |
| 3 | **Bank short of the focal's mark → delivered WITH a debt** sized to the shortfall | QUESTS §5 "keep-with-debt" | Was silently delivering with 0 surplus |
| 4 | **Failure budget floor = 2** (`max(2, ceil(beats/2))`) | ECONOMY §5a (budget 🛠) | Budget 1 made a single failed beat force the finale — fun-check fail |
| 5 | **Memory-edge dedup**: an ACTIVE edge with the same (from,to,type) is refreshed (touch + best blurb), not re-appended | LORE §2 (append is for NEW facts) | The batched resolver re-emitted the same betrayal every beat (5 copies) |
| 6 | **Cap floors at the bunk floor** (an empty bedroom never caps below bedroom-less housing) | GAME_STATE §4 | Empty bedroom gave cap 3 < bunk floor 6 |
| 7 | **Day-0 packet = 7 leads, 40-cycle TTL**; reward-lead lottery ≈ 22% (priced, deducted) | FORT §7 packet 🛠 · §21.2 priced grants | Must bridge to the first Scouting lodge; 4 leads starved the opening ~20 cycles |
| 8 | **Standing hunt leads re-level to the roster median** (clamped to region band) at pursue | QUESTS §1 (level banded around roster) | Fixed-at-build L1 hunts became trivial free money |
| 9 | **Pre-Tavern recruit rewards convert to salvage gold (0.4× mark)** with a "build a Tavern" nudge | GAME_STATE §6 staging | Tavern is GH-T2-gated; early rescues evaporated to zero value |
| 10 | **GH thresholds recalibrated**: T2 12→9 · T3 23→16 · T4 60→48 · T5 88→80 | §20.2 rule 1 (measured calibration, in-engine) + rule 3 (<85% of reachable P) | T2@12 was a knife-edge vs the T1 single-slot asymptote (~9–13 realistic) — trajectories could stall at T1 forever |
| 11 | **Theme hints cover BOTH workforce species** (each room wants some relic-matchable concepts, not only character skills) | §18 slots accept items OR obedient captives | Kitchen wanting only `food` (a skill) made relics permanently unfittable at T1 (prestige frozen) |
| 12 | **Bedroom wants bind dynamically to the owner's tags** (+furniture/decoration) via `effectiveWants` | CARDS §2 owner-binding | — |
| 13 | Torture-chamber racks accept RAW captives (its slots = the breaking pipe; duration = f(comfort) 5→2c) | §21.4 | — |

## Balance state (mock autoplay, seeds 5/21, 800 cycles)
T5 ≈ c500–660 · tier cadence ~100–220c (budget ~130–190 for a human; the bot is naive) ·
outcome mix ≈ 55–65% success / 25–30% partial / 8–15% failure · chains complete b2–b6, slip ~20% ·
caps track bedroom depth (L22–25 with deep bedrooms, floor 6 without).

## Real-AI state (gpt-5-mini writer + gpt-5-nano selector)
Full chain played to a finale (`scripts/aicampaign.ts`): bible/genesis weaves keywords + slate
(casts existing roster mercs as story roles), objects persist across beats (the moth-eaten banner,
the rusted key), resolutions individuate each merc by tags, injuries fiction-judged, finale
approaches deliver the focal. ~14 calls / ≈$0.09 per short campaign. Schemas hardened against
model quirks (string arrays, worded importance, string booleans); `AI_DEBUG=1` logs fallbacks.

## Open designer flags 🚩
- Threshold retune (#10) is measured against the BOT; re-measure against human play in the GUI.
- Idle-obedient hoarding: nothing pushes back on stockpiling broken captives (no upkeep by design) — fine for proto?
- One-off common quests still fire one cheap AI call for the card (QUESTS §10 lean says "templated + tiny flavor line") — currently full writeQuest; cost is small, but templating can trim it later.
- Word budgets by rarity not yet enforced on the resolver (QUESTS §10 latency note) — measure minutes/cycle in GUI play.
