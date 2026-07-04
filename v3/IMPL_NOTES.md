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

## Quality round (2026-07-04, fresh-eyes judge on 2×30-cycle real-AI corpus)

Judge scorecard (post-audit build): blind-before STRONG · fusion/individuation/budgets/register
ADEQUATE · **variety + chain-advancement WEAK** → all three recommendation tracks applied:

| # | Fix | Judge evidence |
|---|---|---|
| 39 | **Beat-advancement contract**: engine records `lastBeatOutcome`; writer must open on what it CREATED, may not re-pose the previous JOB (materially different objective) | Two Shrines beats 2–4 were the same card; finales replayed beat 1 |
| 40 | **Roster-never-NPCs**: rosterNames passed to writer + genesis slate rule (own-people only) | roster merc cast as rival claimant / capering petitioner |
| 41 | **Variety rules**: landmark ≤1-in-4 + no stock epithet; arrival-mode rotation (posting/patrol/prisoner/wreckage/summons/rumor — not always "at the gate"); seeds must be LOAD-BEARING or transformed | 24/24 gate openings; "moss-shrined ruin" ×10; checklist seeds |
| 42 | **Narrator token bans**: traits shown through action (no trait-adverbs), rewards woven (no "Item, N gold" lists, no "(npc)"), failure stated in-fiction (no canned "the reward is lost") | "instinctive" ×10; "came to nothing — nothing — the reward is lost" |
| 43 | **Blind-before cut to one short clause that ADDS something** (≈40% of resolver tokens were card restatement) | economic note |
| 44 | **Retry-once before fallback prose** (a single parse hiccup shipped "It goes their way:" raw) | qB degenerate resolution |
| 45 | Reveal ordering: title → before → after → consequences; delivery summaries prose-friendly; elf syllable pool widened (Thal-cluster) | injury lines preceding their quest; name confusion |

## Attachment round (2026-07-04, pre-playtest — story quality & character attachment)

| # | Change | Why |
|---|---|---|
| 46 | **Flesh pass**: every merc + staged person gets who/backstory/quirks (ONE batched call at cycle end; founders included; persisted producer-2) | Attachment started at zero — founders had no prose identity at all |
| 47 | **Founders get personal chains** (staggered drip once there's roster slack — 3rd merc or c25) | Only hires fired main chains; the two people you start with had no story |
| 48 | AI-facing dossiers carry **known-as + habits**; resolver continuity mandate (relevant memory/quirk surfaces, one touch per person) | The narrator couldn't individuate with data it never saw |
| 49 | **Beat-1 CARE spec**: a concrete human moment with the focal BEFORE plot pressure | Judge: care beats were interleaved with plot |
| 50 | **Failure-debt ECHOES**: a named person forfeited on failure passes to the lore graph and RESURFACES as a rescue lead in 4–8 cycles — the SAME card, same memories (abandon path also preserves people) | Judge: failures stranded named people forever (design promises story-bending, not dead ends); also fixed a limbo-orphan leak |
| 51 | Resolver: **one pair-interaction per resolution**, habit VARIATION (no verbatim quirk reuse), weather-tic ban | Judge: two vivid strangers, no relationship; signature lines became generator tics |
| 52 | Standing-hunt board level tracks the roster (stale L1 starved post-chain openings) | Regression exposed by founder chains |
| 53 | Seed-bank ledger purge + genesis title-variety rule; GUI surfaces quirks/backstory (roster, tavern, holding) | The engine's own seed fed the banned crutch; attachment must be VISIBLE |

Attachment judge verdict on the verification campaign (35c real-AI): mercs-as-people STRONG ·
continuity STRONG (six object/motif arcs cited) · distinctness STRONG ("no misattributable
sentence") · chains ADEQUATE→addressed · failure feel ADEQUATE→echo mechanic added.

## Deep-dogfood round (2026-07-04, played every subsystem via the text UI until dry)

Method: chained save/load CLI sessions played as a player; every "wait, why?" checked against
both UIs; engine bugs fixed at the root. Findings #54–61:

| # | Finding → fix | Class |
|---|---|---|
| 54 | **§9 violation**: finale approach labels shown but NO per-branch envelope before choosing (and a meaningless "bar 0.0") → every branch now shows test/difficulty/bar/favors/best-candidate pre-choice, both UIs | design conformance |
| 55 | **Generator: enchantment spam** — junk relics rolled 4-5 enchantments (W16: tiny odds, usually 0-1) → acceptance roll on tiny-odds lines | engine bug |
| 56 | **Generator: "legendary" flavor spam** — zero-value tiered tags (sturdy/heavy/tall…) always rolled MAX tier (0 ≤ any budget) → bottom-weighted intensity roll; rarity language restored | engine bug |
| 57 | **The reveal shows the dice**: "rolled 4 heads of 18 coins vs bar 7.0" — an unlucky 1.5% draw looked exactly like an engine bug until the roll was visible; owned loss (DESIGN §5) needs the numbers | legibility |
| 58 | **Excavation wall**: 60·1.25^n ≈ 50k gold at 40 cells, millions at the §20-assumed 60-room fort → 45·1.09^n (expansion stays a minor sink, FORT §1) | balance bug |
| 59 | **Founders' saga drip strictly gated on roster ≥ 3** — the c25 fallback let two personal chains monopolize a 2-merc company (poverty trap, reproduced) | pacing bug |
| 60 | Info surfaces added to BOTH UIs: per-slot candidate coins (CLI), coin breakdown/explain on filled slots + dropdowns, quest lapse cycle, heal ETA (+route hint), xp-to-next, per-room benefit (→P/→cap) + global prestige sum, per-fill fit scores + effective wants, ransom/sell/settle payout previews, upgrade/excavate cost previews, readable focus, bank delta per beat, who/backstory at hire/accept decisions, quest id in reveal lines | legibility |
| 61 | Relic adjective pool widened ("Old ×5" runs) | flavor |

Exit criterion met: a full fresh-seed replay of every screen raised no unanswerable question;
chaos battery + 500c marathon clean after all changes.

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
