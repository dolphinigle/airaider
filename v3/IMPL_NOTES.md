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

## Dogfood rounds 3–6 (2026-07-04, the long grind)

| # | Ruling / fix | Anchor | Found by |
|---|---|---|---|
| 14 | **Invariant auditor** (`src/game/audit.ts`) — card↔slot bijection, staging integrity, numeric sanity — runs per-cycle in autoplay + in tests | — | (tooling) |
| 15 | **Staging boundary sealed**: staged/limbo cards can't be slotted; `captives()` = owned only | GAME_STATE §6 | auditor: holding captive racked → corrupted |
| 16 | Ransom mid-break cleans the rack queue · staged-expiry sends people to lore (no orphans) · one bedroom per owner | — | hostile-order tests |
| 17 | **endCycle re-entrancy guard + server action serialization** (GUI double-click safety) | — | code review |
| 18 | **Stale continuation leads pruned**; one open quest per chain | — | code review (ghost-finale repro) |
| 19 | **§21-4a sequel leads carry the slipped focal** — the road back is to the SAME card (limbo on pursue, lead consumed) | §21-4a | code review + roundtrip test |
| 20 | **Engine injury guard**: success → none, partial → at most low (AI was wounding on nearly every success) | §11 + §16-F5 wording | real-AI prose audit |
| 21 | **Beat-1/2 difficulty caps** (standard/hard) — chains were dying at b2 before the player could care | QUESTS §8-B "beat 1 makes the player CARE" | real-AI campaign (2/3 chains slipped at b2) |
| 22 | **Ledger-crutch ban** in genesis AND quest-writer + engine-rolled place-name suggestions (every quest was a Thornhollow ledger) | §5 empirical note | real-AI prose audit (3/3 chains "…Ledger") |
| 23 | **Collector loop closed**: liability leads carry `liabilityId`; winning the collection quest settles it; one live collector per liability | §10 impl note | 400c verbose (fuse re-triggered forever) |
| 24 | Resolver word budgets by rarity (common 1/2 sentences … finale 3/5) | QUESTS §10 latency | real-AI log length |
| 25 | Determinism tests: same-seed identity · **load is byte-idempotent** · post-reload AI divergence is BY DESIGN (persisted-producer) | GAME_STATE §2 | — |
| 26 | Chaos monkey: 4,000 random/garbage actions, audited — no throws, no corruption | — | (tooling) |

| 27 | Finale GOLD approach on a partial pays the LESSER price (0.7×) — was paying full crystallization | QUESTS §9 "lesser version of that kind" | real-AI finale review |
| 28 | Selector path verified LIVE (dense graph → nano pick → bible casts the loaded relation) | LORE §3 | forced-scenario run |
| 29 | Places: engine-rolled suggestions to one-offs AND beats; prose now rotates fresh hamlets (Ravenwick, Dunwick, Woldhollow) | §13 lorebook-names | prose audit |

Marathon state: 3 seeds × 2,200 cycles audit-clean (GH T5–T7); save at c2200 ≈ 2–5 MB (post-proto: compaction).
Real-AI cost: ~0.5–1¢/cycle of play (~$0.15–0.25 per 25–35-cycle session).

## Conformance audit round (2026-07-04, three independent reviewers: FACTS / PRINCIPLES / DRIFT)

FACTS verdict: fully conformant (every §8/§10/§11/§13/§20 number, W1–W18 vocabulary, economy
formulas verified in code) with ONE gap, now fixed. PRINCIPLES verdict: 13/15 held; 2 violations
fixed. DRIFT: 2 high + 12 medium/low, all fixed:

| # | Fix | Anchor |
|---|---|---|
| 30 | **Ownership boundary generalized** — `isOwned()` required by ransom/sell/interrogate/payHeal (a LIMBO chain focal was ransomable mid-chain for 0.6× its season-sized mark, then deliverable AGAIN at the finale) | GAME_STATE §6 |
| 31 | **Collector loop truly closed**: duplicate-guard now checks open quests' own liabilityId (was dead code); collector leads forced one-off (a starts-new roll made the liability unsettleable forever) | §10 impl note |
| 32 | **Finale fate decided BEFORE the AI narrates** (P11): fate + delivery summary precomputed, passed via chainContext.fate; settleFinale applies the precomputed fate | QUESTS §8 rule b |
| 33 | **§4b genesis name guard**: known-cast entries keep canon lore names; new-cast names must come from engine-rolled assignedNames (now 4, rolled by REGION race weights) — AI-invented names can no longer persist in bibles | §4b |
| 34 | **§13 Outskirts keys implemented**: all 4 SPINE endgame buildings (Underdeep is NOT a key) → Outskirts unlocks | §13/§16-F4 |
| 35 | ONE debt rule at finales: shortfall(mark − bank) only — removed an unledgered flat 0.25×payoff surcharge | QUESTS §5 |
| 36 | Dedrift: growth logic unified (growToLevel everywhere); interrogated = status TAG; RoomType.roomKind/multiBuild fields replace id-prefix matching; captiveCapacity from cellSlots; named staging/lead TTL constants (twin-path 4/6-cycle drift removed); wildcards rng-sampled; sell/heal fallbacks use named constants; pick-lists derived from vocabulary GROUPS; difficulty order exported once; personalMercId a typed field; dead code removed | — |
| 37 | Interrogation comfort now DOES something (FORT §5 "leads only"): comfort → chance to upgrade the yielded lead's rarity; price ledgered (30 + 0.1×mark 🛠) | FORT §5 |
| 38 | Finale writeQuest told the true shape (3 approaches, one slot each) | — |

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
- **Early-roster poverty trap (found in bot play, can bite humans):** with 2 starting mercs, the
  3rd hire is pivotal — a trajectory that can't afford it crawls at ~35g/cycle for hundreds of
  cycles. Knobs: day-0 gold (300), hire lean (1.2×mark), recruit mark sizes. A human escapes by
  selling junk relics + ransoming aggressively (the bot now does both), but the edge is sharp;
  consider a cheaper "desperate hire" tier or a day-0 3rd merc.
- Threshold retune (#10) is measured against the BOT; re-measure against human play in the GUI.
- Idle-obedient hoarding: nothing pushes back on stockpiling broken captives (no upkeep by design) — fine for proto?
- One-off common quests still fire one cheap AI call for the card (QUESTS §10 lean says "templated + tiny flavor line") — currently full writeQuest; cost is small, but templating can trim it later.
- Word budgets by rarity not yet enforced on the resolver (QUESTS §10 latency note) — measure minutes/cycle in GUI play.
