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

## Doc-conformance audit round (2026-07-05, four parallel doc↔code audits + fixes)

Method: user hit immediate discords (ungated menus, saga-less backstories); four systematic
audits swept QUESTS+BIBLE, DESIGN+CARDS, STORY_ENGINE+PROMPTS, GENERATION_FLOW §1–§21 against
the code. Every confirmed mismatch fixed at the root. Findings #62–75:

| # | Finding → fix | Class |
|---|---|---|
| 62 | **Menus never gated** — gate rooms' `unlocks` metadata was dead; every tab visible at cycle 0 → engine `menuGates()` (open = room built OR content already present), server `menus`, web 🔒 tabs + lock panels, CLI locked-view messages. Roster stays open (FOCUS is a base function, §12.1 CUT note) — designer flag | design conformance |
| 63 | **Backstory not tied to genesis saga** (BIBLE/DESIGN lock: flesh-on-delivery must fit the story) — fleshPass ran at step 0 with generic role strings; finale focals (rewardCards:[]) got swept a cycle late, saga-blind → fleshPass moved to step 7 (post-staging, same reckoning), looks up the focal's chain, passes saga {title,kernel,situation,want}; flesh+resolve prompts instruct the tie; mock echoes it; invariant test added | design conformance |
| 64 | **Slot requirements never authored** (QUESTS §3: AI authors open/must-be/must-have) — zAsk had no field, buildSlots hardcoded open, assign guards dead → AI emits requiredTag/mustBeFocal (≤1 per quest, engine-guarded, parseAiTag-canonicalized); shown in CLI (⚑) + GUI | design conformance |
| 65 | **Genesis missing tone/avoid/focal-id** (BIBLE: pickTone weighted-lighter; avoid = recent titles; focal edges) — tone+avoid+focal.id now passed; focal genesis edges no longer silently dropped by guardEdges | design conformance |
| 66 | **Focal archetype convergence** (BIBLE: recent-tag exclusion + 2-skill cap) → generateCard excludeConcepts/maxSkills; genesis excludes last-4 focals' skill/body/standing tags | design conformance |
| 67 | **"Rotate arrivals" told to a stateless model** (STORY_GEN: engine seeds beat prose bans) → engine-rolled opening {mode,time,landmarkAllowed(25%)} per card; prompt consumes it | prompt fix |
| 68 | **Buildup-to-brink gutted** (STORY_ENGINE §7a) — "before" was 1 departure clause → brink spec (challenge materialises, party commits, held breath) + rarity budgets 2/3/4-5 sentences | prompt fix |
| 69 | **Purple-word ban absent** (BIBLE lock) → in NUMBER_BAN; **no length caps** (STORY_ENGINE §10 cost guardrail) → zProse soft-clamps on all prose fields | prompt fix |
| 70 | **`infamous` rolled onto relics** (§9b W17: fame only for objects) → domainOverride: character | engine bug |
| 71 | **Recruiting post was a dead building** (§19: a quest faucet) → standing region recruit lead (rescue archetype) on build; survives pursue like lead-hunts | engine bug |
| 72 | **Captive `sell` disposition missing** (DESIGN §6; CLI advertised it, errored "not a relic") → sell() handles captives at SELL_RATE, leaves them alive in lore; previews in both UIs | design conformance |
| 73 | Keyword sampler always drew 2 wildcards (§5: ~25% draw 1) → leaner draw at 25% | engine bug |
| 74 | themeRoll ran on the prose model; effort uniform 'low' → nano + 'minimal' for mechanical tier (STORY_ENGINE §10.5) | cost |
| 75 | r-twin parse guard: AI stripping 'r-' ('beautiful') made gallery wants match bodies, not relics → hint-favored twin restored at renovate parse | latent bug |

## Open designer flags 🚩 (this round)
- **Mess hall → roster menu**: §12.1 (unlocked brainstorm) gates the merc list behind it, but FOCUS
  assignment is a locked "base game function" living in that menu — roster left always-open; needs a ruling.
- **Chronicle room** exists in the catalog (`unlocks: 'chronicle'`) but appears in NO doc; the chains
  tab is left ungated. Rule or cut.
- **leadBlurb** (BIBLE.md board line) still unimplemented — the board reuses `bible.title`.
- **Finale approach slots** ignore mustBeFocal (left open) — is a personal finale allowed to pin?
- **PLAYER_PREFERENCES tone knob** not implemented — tone is engine-weighted (lighter) only.

## Adversarial re-verification hour (2026-07-05, after the conformance round)

Method: distrust every fix — drive the REAL server API through the player's exact cycle-0 flow,
vite production build, a 19-point property battery over the engine fixes (incl. an AI-input spy
proving tone/avoid/focal-id/opening actually reach the provider), 2×300-cycle autoplay, real-AI
renovate (nano). Findings #76–78 — two real bugs and one display gap:

| # | Finding → fix | Class |
|---|---|---|
| 76 | **"Ransom now" from Holding ALWAYS failed** ("not yours to ransom — accept first"): staged candidates fail `isOwned`, yet the UI offers the button and without a Dungeon the person was a dead end that silently timed out → ransom+sell now accept holding candidates (the §6 "decide by cX" window is exactly accept-or-cash-out); regression test | engine bug (pre-existing) |
| 77 | **Faucet leads invisible without a Lead room**: `visibleLeads` pre-Lead-room only showed `starter` — the new Recruiting-post lead (and the older scouting hunt lead) could never be pursued if built first → standing (expiry-null) leads are always visible: they're posted at their own buildings; regression test | engine bug (one mine, one latent) |
| 78 | GUI quest slots never showed the new ⚑ requirement (CLI/server had it; a pinned slot looked open and refusals read as bugs) → shown in the slot row | legibility |
| 79 | **Unfillable must-have = a dead card** (live real-AI run: 'needs heal' pinned with no healer on the roster — the quest blocked the board 6+ cycles until TTL) → fillability guard at authoring: a must-have nobody satisfies downgrades to a favored tag; regression test | engine guard |

Verified clean this hour: cycle-0 menu gating over the live API (lock → build map-room → unlock,
starter packet visible), tavern build correctly tier-blocked, hire cleanly refused, captive
sellEst in view, App.tsx↔stateView data contract (every `s.*` read exists server-side), vite
build, nano themeRoll live (2s, parsed, wants stored), infamous×500 relics = 0, focal caps/
exclusions ×300 = 0 violations, keyword texture 24.1%, must-be/must-have build+enforce, 2×300c
autoplay stable (74 chains done, saves ≤650kB). Note: the morning GUI session's ai log shows
cost>0 — that session ran the OpenAI provider (AIRAIDER_AI was set), not mock.

## POV round (2026-07-05, from a live GUI report: "You find a battered cart…")

Player-reported POV break — a quest opening narrated the BOSS personally finding wreckage in the
field. Root cause was doc-conformance drift, not the model: v3's writeQuest prompt had shrunk the
frame to one jargon sentence ("POV-locked…") where PROMPT_RULES §1 + PROMPTS.md (and v2's narrator)
mandate telling the stateless model WHO the player is (boss at the fort, reads the card, SENDS
soldiers, never in the field) and putting the POV constraint inside the situation field spec
("only what arrives at the gate; no off-scene narration"). There is NO quality gate on prose —
zod checks shape only — so nothing caught it.

| # | Finding → fix | Class |
|---|---|---|
| 80 | writeQuest frame restored to doc/v2 grade (boss at fort, sends soldiers, never in field; everything beyond the walls secondhand); situation field spec carries the POV rule; ARRIVAL rule labels opening.mode as HOW word reaches the fort; the one non-fort-anchored opening mode reworded ('found on the road' → 'hauled back to the gate') | prompt conformance |
| 81 | AI call log never recorded the model's OUTPUT (`AiCallRecord` had prompts only; GUI ai-log tab useless for prose debugging) → `output` field, captured before schema.parse so failed validations keep the raw; GUI shows it (+ literal `\n` render bug fixed) | tooling |
| 82 | Engine dealt a seed the prompt bans: 'tithe ledger' in the TIE pool vs BANNED CRUTCH (produced 2 ledger-centered cards in one 8-cycle read) → 'unpaid tithe' | seed/ban conflict |
| 83 | writeQuest lacked PROMPT_RULES §3a (mercenary GAIN in the fiction; a payoff-free plea card observed) and v2's instruction-echo guard (2 cards performed the POV rule as prose) → both principle lines added; SEEDS rule: weave substance, never quote wording (a card quoted 'dream shared twice' verbatim) | prompt conformance |

**New designer ruling written down** (was unwritten, violated by the first patch attempt this
round): **PRINCIPLES, not instance-patches** — in prompts and code, fix the class, never bolt on
the failing example; examples are sticky, instance-patches brittle → PROMPT_RULES.md §8 +
CLAUDE.md working style.

Verified by reading (playtest skill): 23 real-AI cards over 3 seeds/8-cycle runs post-fix — 23/23
POV-clean (both draws of the reworded wreckage mode arrive at the gate), gain explicit, seeds
woven not quoted, 0 ledgers. Watch items (single occurrences, left unpatched by the new rule):
an occasional "reaches the fort" instruction-shadow; one muddy clause ("the captain's party waits
beyond sight"). Reading harness kept at `scripts/povread.ts`. Gates green: typecheck + 82 tests.

## Prompt-audit round (2026-07-05, designer challenge: "seed, don't ban — what else is missing?")

Full v2-final `cardAsk` ↔ docs ↔ v3 `writeQuest` comparison. Designer thesis confirmed WHERE the
docs already ruled it (§2 seeds > nags; validated precedents: v2's time-of-day BAN became v3's
`opening.time` SEED; gate-bundle ban retired once the mode seed existed). Kept as distinct
categories, not bans-to-seed: ARCHITECTURE guards (NUMBER_BAN = engine owns every number, any
model-written number is wrong by construction; echo guard = JSON field names/meta out of prose)
and §5 TOKEN bans (ban+steer; the steer half was the broken part — pool fix last round).

| # | Finding → fix | Class |
|---|---|---|
| 84 | v2-validated pieces missing from v3 writeQuest → restored: ONE line of direct word per card (spoken at the gate or written on what arrives); READABILITY/orient-once (PROMPT_RULES §7 — was entirely absent); JOB TYPE glossary + attribute steer (§1 — archetype passed as bare jargon) | prompt conformance |
| 85 | **`introducedNames` orient-once tracking absent from v3** (STORY_GEN_STATE.md:72, doc-mandated) → `ChainStoryState.introducedNames`, accumulated by scanning each beat's player-facing text (situation/job/before/after) for bible-cast given names; flows to the writer inside storyState; READABILITY line tells the model bare-name-only for listed names | engine conformance |
| 86 | First dialogue wording ("stating the work plainly") was STICKY — 8 of 15 cards across 2 seeds tagged dialogue "…says/reads plainly"; one corpse forced to speak ("carry one line") → reworded without the manner adverb, speech anchored at the gate / written word on what arrives; confirm seed: 0/7 echoes, tags varied, written channel used naturally | prompt (own-goal, caught in-round) |

Read 45 real-AI cards across 6 seeds today. Post-fix state: POV 100% clean, every card carries a
direct line, gain explicit in most cards. Watch items: 1 ledger slip post-pool-fix (model violated
the explicit ban once — ban alone isn't airtight; frequency way down vs 2/8 pre-fix); beat-1
side-cast sometimes un-oriented (Nimdir; Uneinne/Eloeth — 2 occurrences); one triple-L name
"Pelllion" (check names.ts generator vs model typo); povread harness doesn't print rosterNames so
a suspected roster-name leak in one beat-1 couldn't be verified — worth adding to the harness.
🚩 Designer ruling wanted: retire the ledger BAN now that the pool steers (gate-bundle precedent),
or keep as backstop; §5 says keep while it earns its keep. Gates green: typecheck + 82 tests.

## Full-surface round (2026-07-05, designer: "WAY too short — critical issues throughout; playtest properly")

Correct call. The earlier reads covered ONE call type (quest openings); this round audited ALL six
prompts against docs + v2-final and read full 30-cycle real-AI campaigns end-to-end (cards,
resolutions, chains→finale, dossiers) via new `scripts/campaignread.ts` (prints roster names per
card for leak checks; bible/story/dossier dumps at end). Lessons written to permanent memory:
playtest-the-full-surface; drift is systemic — one drifted prompt ⇒ audit all.

| # | Finding → fix | Class |
|---|---|---|
| 87 | **genesis prompt drifted from BIBLE.md**: title rule inverted (doc: concrete ACTION-title, never poetic two-noun — code invited "the wound at its heart" naming); ARC-shape constraint absent (the validated "beat-1-completes-goal rewind" killer: step 1 = take job/meet, middles escalate+move, LAST achieves); hook/stake ("a quest the company would TAKE", participant-never-spectator) absent; commit-to-truth (no "unknown/mysterious"; every fact traces to a cause) absent; twist semantics unexplained; focal-tags-central absent; tensions/directions unannotated → all restored | prompt conformance |
| 88 | **resolve prompt missing outcome semantics**: no frame (whose result), no OUTCOME MEANINGS (partial = SHOW the cost), no BE-CLEAR-ABOUT-RESULT (the anti-vague-outcome rule), no outcome-scaled storyUpdate truth (success full / partial hedged / failure at most a misleading scrap — STORY_GEN_STATE don't-regress) → all added; flesh got never-contradict-a-tag | prompt conformance |
| 89 | **CRITICAL: NPC/roster name collision** (campaign 12002): genesis `assignedNames` rolled with no uniqueness check → new bible cast "Fenlin" ≡ roster merc Fenlin; the §4b name guard then whitelisted it. Saga collapsed: the player's own soldier "hired the company", "collected the passing fee", stood at the gate while also being SENT. → uniqueness at BOTH boundaries: `addCard` rerolls any character name already borne by a living character; `assignedNames` filtered against all character names + in-batch dups | engine bug (critical) |
| 90 | **Slate never marked the player's soldiers** — the genesis prompt referenced "people marked as the player's own soldiers" but no mark existed in the input (instruction pointing at data never provided) → `companySoldier: true` flag on slate entries; prompt names the field | engine/prompt contract |
| 91 | **Seed/ban collision #2**: `rollPlaceName` can roll the region landmark itself ('Thorn'+'hollow' → "Thornhollow" offered as a "fresh" place while landmarkAllowed gates it); elf epithet 'of Thornhollow' hard-coupled every elf name to the landmark (9 of 18 cards mentioned Thornhollow) → `REGION.landmark` field + `freshPlaceName()` rerolls collisions; epithet swapped to 'Duskbough' | seed/ban conflict |
| 92 | **Habit spam**: Osmund's cup-roll/trill and Fenlin's quill-tap appeared in nearly EVERY resolution (dossier touch treated as mandatory) → "MOST resolutions need none; never a signature stamped on every job" | prompt |
| 93 | Name pile-ups at part joins ('Pell'+'lion' → "Pelllion", 'Yll'+'las' → "Ylllas") → collapse 3+ letter runs in rollName | engine (name gen) |
| 94 | Degenerate `who` from resolve-flesh ("WHO: Betric" — just the name) → who spec: "one line they'd be known by — never merely their name"; JOB lines clamp-truncated mid-word ("…") → "ONE short sentence" | prompt |

Also verified working in the 12002 read: echo-rescue leads (Miraneth left behind → word returns),
beat-must-advance (beat 2 opened on beat 1's failure), finale approach envelopes, introducedNames
accumulating, before-texts ending on the brink, failure aftertexts showing the cost in-fiction.
Post-fix confirm campaigns running (13003, 14004). Gates green: typecheck + 82 tests.

Campaign 11001 (same pre-fix code, richer chains) hardened the diagnosis and added four classes:

| # | Finding → fix | Class |
|---|---|---|
| 95 | **Roster-cast is systemic, not a name fluke**: every chain's bible pulled the roster mercs in — "Unenith (client; he will hire mercenaries…)", "meets Unenith and Pelldai who know the lesser trails" — the slate offered them unmarked and "reuse slate people" invited it (12002's Fenlin: same path — founders get lore nodes). #90's companySoldier flag is the fix; prompt now also states the principle "the company does not hire, pay, or petition itself" | engine/prompt contract (critical) |
| 96 | **Re-staged climax**: Coranor's token-casting happened in beat 2 — beats 3, 4 AND the finale resolutions each re-narrated the same token-drop as happening NOW (4 near-identical scenes; the resolver reached for the bible's climax instead of THIS beat's job) → resolve rule: storyState events are DONE, never re-staged; narrate this job only, moving forward | prompt (critical) |
| 97 | **knownToPlayer duplicate spam**: the same fact restated 5× (newlyRevealed never excluded already-known facts) → only facts NOT already in storyState | prompt |
| 98 | **Company captive walking free**: Aerael taken CAPTIVE at one finale, then next genesis cast her as the free client "waiting at the gate" (slate never said she sat in the cells) → companyCaptive flag + rule: captives cannot walk the world free | engine/prompt contract |
| 99 | **Same-cycle saga clones**: two chains both Hollow-Cairn reckoning rites at Thornhollow Glen, same client — avoid list didn't cover places/devices → avoid extended to central PLACES and rites/devices + "visibly apart from every entry" | prompt |

Gates green after all fixes: typecheck + 82 tests. Final all-fixes confirm campaign to follow.

Post-round-1 confirm campaigns (13003, 14004) — round-1 fixes hold (no roster-as-client casts;
habit spam down to occasional; who lines never bare names; no name pile-ups; PARTIAL shows cost;
13003's Grain Contract chain reads genuinely well: escalating beats, no re-staging, a rescued NPC
recurring as the saga's excavator). Two more criticals caught and fixed:

| # | Finding → fix | Class |
|---|---|---|
| 100 | **SPOILER: `story.currentSituation` initialized to the bible's hidden situation** — and BOTH UIs display it (cli format.ts chains view, server stateView) — so from genesis until beat 1 resolves the chains tab showed the hidden truth, twist included (14004: Faedir's cover-up fully visible) → initialize from the APPARENT goal; openThreads start empty (openDirections stay on the bible for the writer) | engine bug (critical, spoiler) |
| 101 | **fallbackResolve leaked engine numbers to the player** ("A messy half-win: 128 gold" — deliveredSummary verbatim after the resolve call failed schema twice; fired 2× in ~50 resolve calls) → fallback prose rewritten number-free (grant lines already show the take); campaignread now dumps failed AI calls (error + raw output) for diagnosis | engine bug + tooling |

Watch items: resolve schema failure rate (~4%) worth a look at zResolveOne strictness once a
failed-call dump is captured; "a cup she did not have" — habit-vary contortion (model referencing
a quirk while varying it); Thornhollow still gravitational for one-region play (lore accretes
around the single landmark — designer knob 🟡, not a prompt bug). Final confirm campaign: 15005.

## Context-free verifier rounds (2026-07-05, designer: "review prompts like a human; the AI can't understand slotCount:3, KEYWORDS unexplained; seed, don't ban; severity missing; far from deliverable")

New MANDATORY playtest gate (written into the playtest skill + permanent memory): render every
prompt COMPLETELY (system + full user JSON — call-log now stores both untruncated) and hand it to a
zero-context Opus subagent that must explain the task, every input field, every output field's
downstream use, and flag anything guessed/blind/useless/conflicting. Three rounds run
(`scripts/promptdump.ts` renders; 12 verifier agents total). Root cause of the earlier miss:
I audited by docs-diff and output-reading — neither can see incomprehensibility.

Round-1 verifier findings (all six prompts) → fixes #103-118, highlights:

| # | Finding → fix | Class |
|---|---|---|
| 103 | **Naming pincer**: "never invent names" + roster names forbidden + no other names given ⇒ no legal way to name a client (every named petitioner had been a violation) → engine-rolled `npcNameSuggestions` seed (uniqueness-checked) + rule scoped to it | engine+prompt (high) |
| 104 | **Name/gender contradiction** ("Branbert the Younger" tagged female): names rolled independent of gender tag → gendered human name pools; gender rolled FIRST at every site (incl. generateCard, which had NO gender tag at all) | engine (high) |
| 105 | **Beat archetype fought the bible** (random 'investigate' vs a fetch saga) → beats no longer get an archetype; the bible drives the job. Beats' landmarkAllowed forced true (a saga AT the landmark was unwritable). Genesis arc length now = expectedBeats (was 5 steps for 3 beats) | engine (high) |
| 106 | **Dead outputs**: proposedRewardKind + closesChain consumed NOWHERE → removed from schema/prompt/types | schema |
| 107 | **NUMBER_BAN self-conflict** with `importance: NUMBER 0-1` → explicit schema-demands-a-number exemption; 'clinical voice' dropped from the shared ban (fought flesh's warmth) | prompt |
| 108 | **deliveredSummary "26 gold" vs number ban** → prose translates THINGS not amounts; sticky "eighty gold" example removed | prompt |
| 109 | **Unparseable tag notation** ("flat (legendary)", "dull (high)") → shared TAGS_NOTE (rank scale + looks-words scope) in all prompts handling tags | prompt |
| 110 | **Unexplained load-bearing inputs** (slotCount, KEYWORDS, rewardEnvelope, rarity, kind, stakes, relationPhrase, framedCharacter, bible/storyState substructure, cast.role, loreId, blurb…) → every prompt rewritten input-explanation style ("YOUR INPUTS, field by field"); BANNED CRUTCH/VARIETY RULES label-blocks dissolved into field explanations | prompt (systemic) |
| 111 | **Dossier renderer** emitted "(betrayed-by by) X" + unexplained [core] → readable both-ways rendering + "(defining memory)"; dossiers that are just name—tags no longer sent | engine |
| 112 | **One-off severity missing** (v2 had a per-card register; every common job read like doom — the "Shrine Lease Ripped" murk) → engine-rolled `gravity` seed, rarity-weighted (common mostly small/light) | engine+prompt |
| 113 | genesis situation/goal/twistReveal overlap + "apparent goal achieved at finale" contradiction → TRUTH vs SURFACE split; kind moved top-level and explained per value | prompt |
| 114 | resolve chain-lines unconditional for one-offs; injuries "none" band unreachable; edges to id-less dossier people; storyUpdate for standalone jobs → all conditionally scoped; harmed-only injuries; ids from this message only | prompt |
| 115 | slate relationPhrase 'thematic wildcard' contradicted companySoldier flag → engine overrides the phrase with the company relation | engine |
| 116 | **Seed bug caught by verifier**: opening mode 'a summons from the fort outward' contradicts "how word reaches the fort" → 'a summons delivered to the gate, calling the company out'; beat-1 care beat now draws GENTLE arrival modes only (wreckage/prisoner openings fought the low-stakes mandate) | seed |
| 117 | **Ledger-ban removal EXPERIMENT failed**: with the ban off, both sagas + a one-off centered on ledgers/promissory slates → §5 vindicated (ban+steer, not steer alone); ban restored covering renames ("by any name") | experiment |
| 118 | **Finale three-way mismatch** (approach promised "keep her free", prose locked her up, engine crystallized gold) → approach labels may promise only what their rewardKind delivers; resolve must land the focal exactly on chainContext.fate | prompt |

Also: my own round-1 fix planted a sticky example — "(a counted purse, never a figure)" stamped
"counted purse" into ~8 straight resolutions → de-exampled (§8 strikes its own author). Round-3
verifier verdicts: one-off/resolve/flesh parse CLEAN; beat/genesis clean after final polish
(loreId covers focal; symmetric edge direction; bible substructure documented in the beat branch).
Output reads: 21001 povread (named NPCs everywhere, tone finally varies, POV clean) + 22002
campaign (failure-driven saga arc — a bolting thief in beat 1 shapes the whole chain; distinct
creative finale approaches; ZERO resolve schema failures after the band annotation). Verifier notes
that stay open: regionSeed's own "moss-shrined ruin" phrasing still gets copied despite the
epithet rule (content fix 🛠 — reword the seed, don't add a ban); Thornhollow gravity for
one-region play 🟡.

Verifier-round confirmation campaign (23003, all fixes live): the fixes hold — varied hand-off
phrasing (no "counted purse" tic), beat 1 opened gentle with the care-token (a prayer-pin bearing
the focal's mark), finale approaches each promised exactly what their rewardKind grants and the
prose landed the focal on her engine fate (recruit, shown joining), zero ledgers, zero schema
failures, dossiers strong ("stitches laughter into the sickroom"). Last catches, fixed: | 119 |
one resolution wrote "You leaned to the rail" — the resolve prompt never had the boss-stays-home
frame → added (third person in the field, never "you") | prompt |. Watch items: saga cast can
draw the same EPITHET as a roster merc (Ilmwyn Palebough vs roster Heleolas Palebough — reads as
accidental kin; possibly charming, possibly confusing 🟡); a lapsed beat card re-offers the same
step next cycle (mechanical TTL re-pursue, mild repetition when the roster is starved).
Gates green: typecheck + 82 tests. ~$1.3 real-AI this verifier round (3 prompt dumps, 12 Opus
verifier agents, 1 povread, 2 campaigns).

## Verifier fixpoint (2026-07-05, designer: "iterate UNTIL the verifier returns fine on ALL prompts")

Ran the context-free gate to convergence: rounds 4→7, ALL FIVE prompts re-dumped and re-judged by
fresh zero-context Opus agents each time text changed, explicit CLEAN/DEFECTS verdicts. Tally:
R4 flesh/genesis/resolve CLEAN, one-off+beat DEFECTS → fixes. R5 four CLEAN, resolve DEFECTS →
fixes. R6 resolve re-judge → template clean but DATA defects → engine+prompt fixes (shared text
changed). R7 (all five): **CLEAN × 5 — fixpoint.** Fixes landed during the loop:

| # | Finding → fix | Class |
|---|---|---|
| 120 | Direct-word channels didn't cover rumor/report openings → "or quoted from the report or rumor" | prompt |
| 121 | Ledger ban ("record-book by any name") caught wills/leases and its KEYWORDS escape hatch doesn't exist for beats → rescoped to the ACCOUNT-BOOK; wills/charters/leases/letters explicitly welcomed (both writers) | prompt |
| 122 | Beat branch gaps: "side loot" undefined; cast role enum too rigid (genesis emits e.g. "rival"); bible.title/loreId/actorStates undocumented; place suggestions vs bible anchors → all defined ("side loot" = incidental valuables, true prize at finale; roles as e.g.-list; bookkeeping = ignore; bible places outrank suggestions); finale line: rewardEnvelope names the central prize | prompt |
| 123 | resolve schema demanded storyUpdate.openThreads but never defined it → defined (live loose ends, replacing the old list); dossier memory-line format documented | prompt |
| 124 | **Card promises a prize the engine didn't roll** ("a horn" written, "the Amber Bow" granted — the writer never saw the materialized item) → `rewardItems` input: pre-rolled prize object names; fiction naming a prize must use them. Also deliveredSummary defined as what ends in the COMPANY's hands (client's due separate) — killed the kept-vs-delivered ambiguity; TAGS_NOTE glosses opaque skill words ("food" = cookery) | engine+prompt |

Verifier watch items (non-blocking, logged): edge DIRECTION sometimes stored inverted vs its own
blurb (blurb self-corrects; renderer relies on it); genesis-authored cast blurbs can still hand
props like "ledger-sack" to the beat writer (rated self-resolving — the ban covers plot objects).
Gates green every round: typecheck + 82 tests. Loop cost: 4 dumps + 16 verifier agents ≈ $2.

## Seeds round (2026-07-05 evening, designer: location confusing; openings too prescriptive; keywords fixed/tiny; favored missing in-game)

| # | Finding → fix | Class |
|---|---|---|
| 125 | region + regionLore two-field split confusing → merged into ONE `location` line ("name — anchor facts"), writeQuest + genesis | contract |
| 126 | **Openings regressed a documented v2 lesson** (v2 seeds.ts: "a full sentence got copied verbatim") — v3's 8 fixed sentence-modes → v2-style ARRIVAL SPARKS (who × how word-seeds, "a pedlar, a plea"); model builds the arrival itself. Beat-1 gentle filter kept | seed |
| 127 | **Keyword pools were the ~94-entry stub** while v2-final held the real §5 bags → ported whole (~2,400 entries: BOND/TIE/THINGS/OCCASIONS/PEOPLE/UNCANNY/MOODS); KEYWORDS rule softened from LOAD-BEARING to v2's sparks-not-checklist | seed |
| 128 | favored/clashing "not showing in game" → verified INTACT end-to-end in current code (engine populates, server sends, both UIs render); the report came from the pre-fix save — reset required | verified-ok |
| 129 | **Landmark gate violated persistently** (Thornhollow named in 5/8 landmark-disallowed cards — a shown token gets used, a rule doesn't stop it) → gate now works by OMISSION: `seedPlain` on REGION; a card that may not name the landmark never sees it; `landmarkAllowed` no longer sent to the model. Output-verified: 0 leaks in 5 omitted cards | seed (structural) |

Verifier gate re-run on changed prompts: R8 one-off/genesis/beat CLEAN; R9 (after landmark omission)
one-off/beat CLEAN — fixpoint holds. Output reads: sparks weave creatively (a riderless mare from
"an old contact, a riderless horse"), pool variety visible (betrothal cup, eel-runs, glandrot —
no more blood-debt/temple/eclipse recycling), gravity lands ("Return a Donkey from Thornhollow" —
a genuinely small job with a human hook). Watch: 1 ledger slip in 8 cards persists (model ignores
the ban ~10% — engine post-filter is the structural fix if it stays annoying 🟡).

## Day-1 playability round (2026-07-06, designer blocked at day 1; coordinator mode — delegated hunts)

Three delegated hunts (live day-1 API driver · web↔server contract audit · lore-prompting docs audit)
+ re-delegated confirmation. Fixes:

| # | Finding → fix | Class |
|---|---|---|
| 130 | **THE DAY-1 WALL: 3-slot quests vs the 2-merc starter roster** — can never march ("no partial sends"), no feedback, assigned merc stuck committed, odds shown confidently → fillability guard #79's class applied to SLOT COUNT: never more slots than the roster has soldiers (one-offs + beats); ⏸ report line when a partially-staffed quest doesn't march; `ready` flag + "will not march" in the quest card; "A quiet cycle" line when nothing marches | engine (critical) |
| 131 | Bedroom renovate = 6 dead buttons on the fort's only day-1 interactive room (server offered renovateCost for cap-benefit rooms the engine rejects) → cost omitted for cap rooms | server |
| 132 | **LORE two-part prompting missing from beats/finales** (designer's call; docs audit confirmed: recall→selector→dossiers ran ONLY at genesis; beats got zero lore, not even the focal's evolving dossier; QuestWriteInput had no field for it) → `buildLoreSlate()` shared helper (selector picks who gets FULL dossiers → writer gets RELEVANT LORE block); `relevantLore` + `focalDossier` inputs + beat-branch prompt gloss; echo-rescue framedCharacter now carries the returning person's dossier | engine+prompt (doc conformance) |
| 133 | Branched-quest odds read "0 coins vs bar 0.0" pre-approach → "pick an approach first"; heal/interrogate buttons offered without their rooms → `can` flags, gated client-side; relic reward invisible behind locked Items tab → gate opens on held relics (orContent precedent) | UX |
| 134 | Relic name generator dealt "Iron Ledger" as a fated prize vs the account-book ban (seed/ban collision #3, caught by a round-10 verifier) → 'Ledger' out of the relic noun pool | seed/ban |

Verifier gate on changed prompts: R10 one-off DEFECTS (Iron Ledger collision → seed fix) + beat
DEFECTS (relevantLore said "person" but carries places; dangling companyCaptive reference → both
reworded); R11 one-off CLEAN, beat CLEAN — fixpoint restored across all five.

## Reader round (2026-07-06, delegated harsh prose read of a 30c campaign post-lore-wiring)

Reader verdicts: lore-in-beats MIXED (three-card object threads DO work — a rag pinned in one
resolution carried through two later cards; but one chain self-completed at beat 1 then reset),
cards GOOD on mechanics, resolutions MIXED. Fixes #135-146:

| # | Finding → fix | Class |
|---|---|---|
| 135 | **Saga self-completed at beat 1, then the world reset** (beat-1 job = the bible's goal; its resolution narrated total victory; beats 2-4 re-posed the same job) → beat writer: the job may NEVER be/complete the goal pre-finale; resolver: unless isFinale, a success succeeds at THIS job only — the goal stays unachieved | prompt (critical) |
| 136 | **Arc-over-state after failures** (beat 3 = escort of a person the company didn't hold) → when lastBeatOutcome/storyState contradict the arc step, the STATE wins; re-derive the objective | prompt (critical) |
| 137 | Habit signature-stamp (scar-rub in 9/15 resolutions) → STRUCTURAL: dossier habits now reach the resolver only ~40% of calls (a habit not shown can't be stamped) | engine |
| 138 | Injuries invented on harmless failures (med-4 from a gossip sweep) → wounds only when the fiction put them in harm's way | prompt |
| 139 | Phantom + misgendered "own soldier" arrivals → rosterNames now carry pronouns ("Roktooth (she)"); a staged soldier must match name+pronoun exactly | engine+prompt |
| 140 | Engine fate string "season's surplus" reified as a physical object in prose → fate strings reworded fiction-safe; resolver told never to quote the fate's wording | engine+prompt |
| 141 | Account-book ban absent from resolve (a "guard's ledger" walked into a resolution) → ban added to resolve | prompt |
| 142 | "moss-shrined ruin" epithet copied verbatim ≥5× → epithet REMOVED from the region seed (nothing to copy) | seed (structural) |
| 143 | Genesis kernel echoed input fields into the permanent bible ("…Keywords: … Tone: grim. Stakes: low") → kernel = pure story, never restates inputs; roles strict enum; card titles never archetype-prefixed | prompt |
| 144 | Disposition tease ("may yet be persuaded to remain") vs engine's leaving → never HINT at dispositions either | prompt |
| 145 | Flesh echoed its instruction as a template ("One thing she loves: …") → detail shown never announced + echo guard added to flesh | prompt |
| 146 | Twin-stem names (consecutive focals Pellthil/Pellnith; 3 unrelated Mosswalkers) → name guard extended to 4-letter given-name stems (addCard, npc names, assignedNames); elf epithet pool 6→14 | engine |

Reader watch items (designer 🟡): zero-coin assignments may march (guaranteed failure — block or
warn?); post-finale storyState can contradict later world state (recruit who then left the tavern);
scrap/rag as the arriving prop in ~half the cards (texture tic); semicolon mega-sentences satisfy
the sentence budget's letter, not its spirit. R12 full verifier pass: 5/5 CLEAN.

## Reader round 2 (2026-07-06, confirmation read: fates+kernels DEAD; the WORST defect reproduced)

Second harsh read (30c, seed 37373): fiction-safe fates and kernel purity confirmed dead; habit
stamp halved (braid 25%) but not gone (rim-thumbing 45%); injuries mostly earned (2 soft
relapses); "moss-shrined" gone; NAMED phantom soldiers gone — but **saga self-completion at
beat 1 reproduced in full** (beat-1 job ≡ the bible's goal; resolution completed it; the chain
sat active with 2 empty beats owed), a climax was re-staged 3× (band burned thrice), and the
"(she)" pronoun annotation leaked verbatim into prose. Fixes #147-157:

| # | Finding → fix | Class |
|---|---|---|
| 147 | **Engine tripwire for settled sagas** (the reader's key insight: prompt discipline can't survive one overshoot) → resolver reports storyUpdate.sagaSettled; engine sets chain.settled → finaleReady fires NEXT step (AI judges, engine gates — the closesChain idea reborn, this time consumed) | engine (critical) |
| 148 | knownToPlayer near-duplicate facts (same fact ×3 invited the re-staging) → stem-dedupe on push | engine |
| 149 | "(she)" leaked into prose → rosterNames bare again + separate rosterPronouns map (metadata isn't quoted); prompt says never print pronoun annotations | engine+prompt |
| 150 | Genesis cast bloat (8 entries, 4 coined "companions" incl. phantom soldiers) → STRICTLY 1-3; soldiers are never cast unless the saga is about one | prompt |
| 151 | Offscreen custody teleports between beats (a phantom patrol captured the focal) → the world moves ONLY as lastBeatOutcome says | prompt |
| 152 | Solo jobs narrated as parties ("the others crossed the threshold") → party list is COMPLETE; one sent = alone | prompt |
| 153 | Finale prose staged an UN-chosen approach → chainContext.approach (the chosen plan's label) passed; resolution must follow that plan and no other | engine+prompt |
| 154 | Quirk monoculture (6/6 fleshed NPCs "fingers X + hums Y") → stock quirks token-banned (fingering/humming/whistling); reach wider | prompt |
| 155 | Name near-twins beyond prefix (Ulfka/Ulfnak, Harmuzzle/Magmuzzle) → similarity guard extended with edit-distance ≤2 on given names | engine |
| 156 | **Thornhollow monoculture at the ROOT**: genesis could always see the landmark (both sagas took it) and beats always saw it → genesis sees the landmark only 25% of rolls; beats see it only if THEIR bible uses it; one-off landmark odds 0.25→0.15 | seed (structural) |
| 157 | Account-book leaked twice into resolutions despite the new ban (model violation) — left as prompt-ban; if it persists, engine post-filter 🟡 | watch |

## Reader round 3 (2026-07-06, confirmation on seed 434445: 7 of 10 DEAD — settled-tripwire FIRED correctly)

The settled-saga tripwire worked in the wild (beat 4 settled → beat 5 was the finale). Pronouns,
lean casts, kernels, landmark spread (Thornhollow 17% of cards), solo-solo, chosen-approach
fidelity, prop bans: all confirmed dead. Still alive → fixes #158-165:

| # | Finding → fix | Class |
|---|---|---|
| 158 | **Unearned wounds persisted** (med-4 from fleeing a CLOSED DOOR) → injuries must CITE a phrase from the model's own after-text showing the harm; the ENGINE drops uncited wounds (verifiable guard, not another plea) | engine+prompt (critical) |
| 159 | **Resolution overreach re-staged the climax** (job said FIND the glove; the narration TOOK it; the finale then re-took it) → success = the job AS WRITTEN: never take/deliver/finish what the job only asked to find, learn, or scout | prompt |
| 160 | **"Messenger at the gate + prop + quote" macro owned ~40/42 cards** → ARRIVAL_SIGNS pool (matters with NO bringer: smoke on the ridge, the pedlar who never came, washing left on the lines — 20% of draws); never open the card's first words with the time of day | seed (structural) |
| 161 | Purse-handoff choreography every resolution → routine payments may be skipped entirely | prompt |
| 162 | NPC name near-twins (Betda/Betra/Beteth — card NPCs never become cards so the guard couldn't see them) → rolling recentNpcNames window (20) feeds the similarity guard | engine |
| 163 | "elven X" race-labeling on every NPC → race named at most once per card, only where it matters | prompt |
| 164 | Saga threat with no FACE (the "respectable buyers" never appeared; every beat repeated their absence) → genesis: opposing pressure gets a cast FACE who can actually appear | prompt |
| 165 | knownToPlayer dedup missed re-worded duplicates — left as-is for now (stem check is cheap; full similarity is overkill) 🟡; R13/14 wording collisions from the cast-lean fix reconciled (naming whitelist covers rosterNames+relevantLore; soldiers = context not cast) | watch |

Reader watch items (designer 🟡): 30 cycles of all-common cards = flat narrative gravity (rarity
mix + single region is prototype scope); roster frozen at 2 all campaign (everyone "moves on —
build a Tavern"; economy never affords one — the fun-check knob); saga GOAL field sometimes
mis-scoped to the beat-1 MacGuffin.

R15 verifier (all changed templates + injuries.cause mechanism): 4/4 CLEAN — "purpose and
verification clear... a mechanically checkable substring constraint". Full template fixpoint.

## Overnight loop (2026-07-06, designer asleep; standing goal: play must read WELL from day 1)

Iteration 0 (closing read, 525354): injuries-cited-only DEAD in the wild (engine guard verified —
3 wounds, all shown); tripwire numbering, race labels, saga-face all DEAD. Three drones needed
structural teeth → #166-172. Iteration 1 (596061): payment endings mostly dead, investigate
answers DEAD, goal scope DEAD — but later-beat completion reproduced (vial delivered in beat 1,
re-staged beat 3, finale premised on it) and time-openers persisted (the ban had been lost in a
rewrite; 16/38 cards).

| # | Finding → fix | Class |
|---|---|---|
| 166 | Resolution performing LATER beats' objectives (dug the finale's tool at beat 1) → resolve: the arc's later steps belong to later cards — may not perform/recover/complete ANY of them | prompt |
| 167 | Time-of-day openers (20/27 then 16/38) → time FOLDED into the spark string (standalone field taught "At dusk, …"); explicit first-words ban restored in WRITING; resolve lead-in stamp extended ("Dawn found them…") | seed+prompt |
| 168 | Purse handoff closing ~24/25 resolutions → payment staging DEFAULT OFF (end on the deed, a face, the road; engine reports the take) | prompt |
| 169 | Epithet reuse (Redhand ×2, Elmwhisper ×2 14 cycles apart) + same-cycle given twins → epithet equality added to the similarity guard; recentNpcNames window 20→60 | engine |
| 170 | Investigate jobs resolving as fetches → when the job's verb is learn/uncover/question, the result IS the answer found | prompt |
| 171 | Saga GOAL scoped to beat-1's errand → goal spans the WHOLE arc, never step 1's errand | prompt |
| 172 | **Beat overrun re-runs** (beats 4/3 — no arc step left → same card re-posed; lapsed beats re-minted verbatim after quiet cycles) → finaleReady fires when beatIndex ≥ expectedBeats (arc exhausted = the head); a re-posed lapsed step gets an explicit reframe note (same step, fresh angle) | engine (structural) |

Also: genesis landmark visibility 0.25→0.15 (chains still gravitating to Thornhollow), wound-variety
clause (every wound was a gashed palm/forearm). Reader consensus on iteration 1: standalone commons
are "genuinely good now"; sameness (one ruin, one wood, coin-roll closings) is the remaining drag.

Iteration 2 (656667): Thornhollow DECENTERED (3/41 cards — fix confirmed); investigate-answers,
habit frequency, kernel purity, cited injuries, mechanics-speak all DEAD. Three still alive →
#173-177: | 173 | **finale off-by-one** (beats consumed ALL N arc steps, then a finale re-ran
step N — the figurine opened before the moot twice) → beats consume steps 1..N-1; finaleReady at
beatIndex ≥ expectedBeats-1; finale prompt = "covers the arc's LAST step" | engine (critical) |
| 174 | time-openers persisted (~49%) despite fold + ban → time now seasons only 30% of sparks
(no clock token to lead with) | seed (structural) | | 175 | payment-close persisted (27/32)
because my own rules collided (WEAVE-the-gains vs staging-off) → GOLD IS NEVER STAGED; weave only
items/people; end on the deed, a face, or the road | prompt (structural rewrite) | | 176 |
"the elf" as name-substitute even for own mercs → banned alongside name-twice | prompt | | 177 |
R17 caught prize-object written as client cargo (Pale Chair delivered away while deliveredSummary
kept it) → rewardItems = end IN COMPANY HANDS, never cargo; resolve reconciliation rule (company's
take wins) | prompt contract |. Name stem-clusters (Wil-/Ann-/-anor) noted 🟡 — 4-letter guard
passes them; 3-letter too aggressive for the elf pool.

Iteration 3 (686970): **finale off-by-one DEAD** (the saga's finale "the campaign's best moment" —
coffer deliberately left shut, chosen approach honored); gold-staging DEAD (1 defensible instance);
name-substitute DEAD; payment endings DEAD. Fixes #178-183: | 178 | scrap-with-ominous-line frame
owned ~100% of cards (my "written on what arrives" channel taught it) → spoken forms outnumber
written in ARRIVAL_HOW; prompt: the direct word is usually SPOKEN, scraps the exception | seed+prompt |
| 179 | R16 (late): genesis situation clamp-truncated MID-SENTENCE ("renounce the…") → zProse clamps
at a sentence boundary when one exists; lore blurbs word-safe | engine | | 180 | habit rate 0.4→0.25
(map-tuck ×9) | engine | | 181 | wound body-part palm-default → variety clause + never narrate an
unlisted wound | prompt | | 182 | beat-1 profit vs take-up tension → beat-1 pay may rest on the
client's promise | prompt | | 183 | harness builds the Tavern early (roster starvation was starving
the features under test) | harness |.

Iteration 4 (717273): delivery-frame DEAD (1/33 written; 32 spoken), quirk spam DEAD (20%/0%),
wound rut DEAD (8 wounds = 8 🩸, four body sites), finale-once + no re-runs PASS. Fixes #184-186:
| 184 | **echo-rescue reinvented the person** (Claet: male under a kiln → female on a witch-ladder)
→ framedCharacter carries explicit pronoun + lastSeen (the resolve line where the story left them);
prompt: continue from there, never reinvent | engine+prompt | | 185 | near-duplicate one-off
premises (two "Lantern in the Old Growth" stake-rescues) → one-offs get an avoid list (last 6 card
titles+jobs, rolling window) | engine+prompt | | 186 | time-openers still ⅓ → noted; time now
seasons only 30% of sparks (applied in it-3; verify in it-5) 🟡 |.

Iteration 5 (747576): reader verdict **"qualified NO — but close"** to prototype-playtest bar;
chains "genuinely good" (4 finale choices honored, clean banking); pronouns/kernels/gold/solo/
approach all PASS. Bar items fixed → #187-190: | 187 | 🩸 with no wound in prose (cause "the shaft
caved" passed the substring check) → cause must NAME the harmed person taking hurt; engine verifies
name-in-cause + cause-in-after | engine+prompt | | 188 | echo-rescue reinvented peril (Sylvlion:
mill-wheel → forest chase; Caeldir inherited correctly) → peril CAPTURED at left-behind time
(pendingEchoes.lastSeen = title+situation snippet) and carried via lead.echoNote → framedCharacter
.lastSeen | engine | | 189 | finale JOB said "send three soldiers" (slotCount=3 mutex plans misread
as a party) → finale slots = mutually exclusive PLANS, never a party | prompt | | 190 | messenger-
at-dusk migrated from openers into arrival clauses (18/40) → "not every arrival happens at dusk;
most business reaches a fort in daylight" | prompt |. R18 full-template verify: 5/5 CLEAN.

**DESIGNER DECISIONS NEEDED 🔴 (readers' consensus on remaining drags — all knobs, not bugs):**
1. **Roster dead-lock** (top item, twice running): Tavern behind GH T2 is unreachable in 30 cycles;
   every rescue "moves on" (nudge ×6-7/run); one wound stalls the 2-merc company for cycles.
   Options: cheaper/earlier Tavern; understaffed march with penalty; starter roster 3.
2. **Finale captives evaporate**: Eloion won WITH a 120g debt, then "slipped away from holding"
   6 cycles later (no Dungeon buildable that early) — winning feels hollow. Convert to auto-ransom
   when no Dungeon exists?
3. **World monotony is scope, not prompt**: one region, elf-weighted victim pool, one landmark —
   readers rank it the #1 experiential drag across every run. Second region / flattened victim
   races / more landmarks per region are content+design work.
4. Failure troughs (5 consecutive failures read as demoralizing) — dice/pacing knob.

Iteration 6 (808182): reader verdict — **"Qualified YES: sentence-level prose is good enough for a
prototype playtest; the remaining bar is VARIETY, not quality."** Wound forward-citation 4/4 DEAD;
finale slot semantics DEAD; dusk 18→7 DEAD; approach fidelity 4/4; investigate answers "strong
PASS"; the ransom wrong-girl twist and gleaner-share finale called "genuinely good." Fixes
#191-195: | 191 | "at noon" replaced dusk (frame states arrival time in ~35/39 cards — word-bans
are whack-a-mole) → VARY THE OPENING SHAPE clause (begin mid-word / on the thing brought / on the
fort's reaction; most cards need no clock); SIGNS 20%→30% | prompt+seed | | 192 | genesis-coined
cast names never entered the recent-names window → assignedNames pushed into it ("Ashveil" ×3) |
engine | | 193 | signature-object over-staging (Marlin's sprig ×25 — it lives in her identity
line, not quirks) → dossier identity is WHO they are, not a prop to stage | prompt | | 194 |
premise re-deal 6 cycles apart escaped the 6-card avoid window → widened to 10 | engine | | 195 |
reverse wound leak 2/37 (prose wound, no listed injury, on partial/failure) — instruction exists;
low rate; watch 🟡 |.

Iteration 7 (838485): **second consecutive "QUALIFIED YES — sentence-craft clearly above the
prototype bar; the remaining bar is macro-variety, mostly design-scope."** Sprig spam 25→1;
surname stamping DEAD; 10/37 non-arrival openers appeared; echo-continuity held on the one case
(Sszzar's return coherently motivated); solo/approach/kernels/pronouns clean. Final micro fixes
#196-199: | 196 | "Tiainne" reused for two unrelated people — likely leaked via the avoid list
(titles carry names; the model recycled one) → avoid rule: NEVER reuse a name appearing in avoid
entries; premise must land clear of them | prompt | | 197 | "road home" closer ×10 = MY OWN
instruction phrase gone sticky (§8 strikes its author a third time) → de-exampled ("end where the
story actually stops... never the same closing image twice in a row") | prompt | | 198 | NPC quirk
recycling (wrist-rub ×3, cloth-fold ×3) → those tokens banned + each batch member fidgets
differently | prompt | | 199 | Kelmund's cook-kit in ~60% of his beats (identity-driven, varied
wording) — watch 🟡 |.

**OVERNIGHT LOOP CLOSED (2026-07-06 morning): closing template verify 5/5 CLEAN (R19).
Trajectory: "can't get past day 1" → live-replay "a new player clears days 1-3 without a wall" →
two independent readers: "qualified YES, above the prototype-playtest bar." What remains is
design-scope (the 🔴 queue above), not prompt quality.**

## FINAL DOGFOODING (2026-07-06, designer directive)

**Favored/clashing PROVEN end-to-end with live numbers** (scripts/surfacecheck.ts, kept): AI wrote
non-empty favored/clashing on 6/6 slots; 27/27 stored words canonical; same merc on the same slot:
neutral 4 coins → 93.8%, +favored 7 coins → 99.2%, +clashing 0 coins → 0.0% (±0.5·U exact, mirror
rule live); server serialized all fields verbatim; web renders at App.tsx:228, CLI at format.ts:179.
New-player walkthrough (scripts/playerwalk.ts, 6 real-AI cycles): menu gates "excellent", cards in-
POV, assign-time info complete, ⏸/🙏 messaging "excellent". Fixes #200-208:

| # | Finding → fix | Class |
|---|---|---|
| 200 | JOB promised a person the envelope couldn't grant ("bring her back alive" on relic+gold — the bound woman then evaporated, no ⛓/🙏 line) → a person may be a deliverable only when the envelope grants one | prompt (HIGH) |
| 201 | Success loot SILENT in the reckoning (gold 119→247 with no line; relics slide into Items) → 💰/🗝 say-lines in applyResolution | engine |
| 202 | Earned "+ lead" invisible pre-Lead-room (expired unseen) → reward-source leads always visible + 🧭 say-line | engine |
| 203 | Beat JOB used unintroduced bible-cast name ("Edard's hire") → job names only people the situation introduced | prompt |
| 204 | Level-ups silent → ⭐ say-line on grantXp gain | engine |
| 205 | ~10% off-vocab favored words silently dropped ("healing","stealth") → stem fallback in parseAiTag (healing→heal class); true unknowns still dropped | engine |
| 206 | First-board card at 0% for the WHOLE starter roster (clash + mirror zeroed both mercs) → #79-class guard: drop authored clash when it zeroes everyone; drop mirror-favored if still zeroed | engine |
| 207 | "Marny" dealt beside quarry "Magny" in ONE card (reward people not yet in state.cards — guard blind) → reward characters registered in recentNpcNames before suggestions roll | engine |
| 208 | Campaign-A reader: phantom "company men" garrison (roster IS the whole company — never invent watchmen); "as she always did" habit-tell banned; closing-image variety enforced across the resolve BATCH ("back toward the fort" ×10 was the reworded road-home) | prompt |

Campaign-A reader (899091): qualified YES again; wound citation 11/11 forward; echo-continuity
threads RESOLVE (Magny left behind → word returns → rescued; Elorael rescue → saga client).
Correctness slips fixed above; Brutooth pronoun leak (she→he ×2 on a wolfborn merc) noted — model
slip against provided rosterPronouns, watch 🟡.

Campaign-B closing read (939495, all #200-208 live): **"ship for designer-playtest: QUALIFIED
YES."** All four reward glyphs landed clean (💰×29 🗝×7 🧭×15 ⭐×8, sensible order, no number
leaks); person-promise discipline "airtight" (9/9 person-quests delivered a body); JOB-name
hygiene "perfect" (42/42); kernel purity, finale-once, gold-out-of-prose all hold. R20 verify:
2/2 CLEAN. Final fixes #209-211: | 209 | reward-person names rolled engine-side with NO guard
(rescuee "Olarion" twinned merc "Olaiel" in one card; Marny/Magny same class) → generateOneOff
rerolls a twinned reward name (race+gender from tags) before the writer sees it, then registers
all reward names in the window | engine | | 210 | merc pronoun leaks ("his hammer" on a she-merc,
the reader's #2 bar item) → tags-are-pronoun check spelled out in resolve | prompt | | 211 |
fabricated callback (twice-used invented memory of a scene no log contains) → callbacks may
reference only dossier/storyState events | prompt |. R21 verify on resolve: pending.

Remaining watch 🟡: untagged prose wounds ~1/run; "calf" as default wound site; return-and-latch
closer creeping; beat-1 lapse-repose relabels the archetype (cosmetic incoherence); approach
sub-clause under-delivery. NEW design ruling needed 🔴: fort-staff fiction (serjeant ×13, "the
watch" ×12, paymaster, surgeon) — is caretaker staff licit, or is the roster the whole fort?
**The reader's bar to an UNQUALIFIED yes: (1) world diversity (Thornhollow/Western-Forests
monocropping — the 🔴 region-scope item), (2) merc pronoun stability (#210 applied).**

**The single highest-impact item every reader agrees on: the
2-merc roster dead-lock.** Tavern needs GH T2; 30-cycle campaigns never reach it; every rescue
"moves on" (nudge printed 7×), one wound stalls the company (5 consecutive dead cycles in 717273).
Options: cheaper/earlier Tavern; understaffed march with penalty; starter roster 3. Economy call —
not made unilaterally. Iteration-5 campaign (747576) running.

New designer watch items 🟡: retry/echo leads reinvent a lost person's captivity from scratch
(prior-captivity fiction isn't carried; needs an engine memory hook); "messenger at the gate with
prop + quote" is ~33/35 cards' macro-shape (the situation spec itself may need 2-3 alternate
frames); left-behind/handed-over state doesn't constrain later genesis casting (kidnapped man
hired the company while captive). R13 full verifier + fresh confirmation read running. The R11 beat
verifier's read confirms the lore is landing: the focal's dossier handed it "perfect secondhand
hooks" (owed coins, an old rescue) for the care beat. Watch: founders' who-lines can come out
near-identical (both "keep the accounting in his head" this seed) — flesh distinctness under
similar tags 🟡. **Confirmation replay (fresh agent, live server, real
AI, days 1-3): all six fixes RESOLVED, zero new bugs, zero engine errors — "a new player can clear
days 1-3 without a wall."** Notable design note from the replay: quest-reward leads stay hidden
until a Lead room exists (visibleLeads design, not a bug). No spoiler (chain NOW = player-safe route status); no
fallback text reached the player; KNOWN TO PLAYER duplicate-free; roster only as company people;
captive-finale correct; chain "Seize the Second Key" reads well (twist lands, a failed escort's
consequence — Kormuzzle seized — carries into later beats, finale recovers it). The failed-call
dump found the resolve-schema failure root cause: | 102 | model wrote wound DESCRIPTIONS into
injuries[].band ("bleeding gash at right forearm…") instead of the enum (3 of 4 failures), plus
one newlyRevealed-as-object → JSON spec line now annotates band (STRICTLY none|low|med|high; the
wound is shown in prose) and newlyRevealed/openThreads ([plain strings]) | prompt/schema |.
Cosmetic watch: "Hejoined" model typo in one dossier. Gates green: typecheck + 82 tests.
~$0.75 total real-AI spend this round across 6 campaign reads + 6 povread seeds.

## Designer session round (2026-07-06 evening) — card voice, merged card, pattern-B built (#212-220)

Designer rulings (recorded in QUESTS.md §card + GENERATION_FLOW §10 annotation): (1) situation IS
the whole card, job = list-line only, never rendered on the card (both UIs updated); (2) card voice
= BRIEFING to the boss — second person, present tense, plain declaratives, context→hook→task+hands+
qualitative pay/risk, calibrated against Fort of Chains quest offers (research in session; agent
pulled 13 verbatim samples from gitgud); (3) personality words legal in favored/clashing (±0.5U
levers only, never attribute feeds) — GENERATION_FLOW "=none" clarified in place.

Full-docs conformance sweep (4 Opus agents, every doc vs v3): ~180 decisions CONFORM. Silently
MISSING found and BUILT this round:

| # | Item | Build |
|---|---|---|
| 212 | §4 pattern-B partial-unit collaboration (the "AI shapes the quarry" channel; bandWindow never called anywhere) → one-off person rewards: engine pre-rolls IDENTITY (race/gender/name, similarity-guarded) → writer outputs quarryTags (≤3 vocab words, optional rank = BAND proposal) → engine fences families (skill/personality/body/background), rolls tier weighted-low in the band window, generateCard places required first, budget completion nets to mark. VERIFIED LIVE: card wrote "Edny the Younger, a human peasant" → delivered unit `female; human; peasant (low); …` | engine+prompt |
| 213 | Coined bible cast never persisted → they now become lore-only character nodes at genesis (who-line as blurb, loreId written back into the cast entry) — the world populates itself with recurring faces beyond focals (LORE §1 / STORY_ENGINE §3) | engine |
| 214 | §14 engine-cheap edges → co-deployed pairs linked served-with at zero tokens (existing link refreshes via touchEdge); born-in still impossible (regions aren't nodes) 🔴 | engine |
| 215 | ECONOMY §4 jackpot-with-catch (dead jackpotChance field) → wired: flaw seeded first, budget loop overshoots positives to compensate, bundle nets mark; 0.08 on person+relic rewards 🛠 | engine |
| 216 | favored/clashing family fence (audit: engine accepted ANY concept incl. group names + stat body tags = unpriced double-dip) → FAVOR_OK filter; vocab line gains tall/short/endowed/flat | engine+prompt |
| 217 | situation clamp 650→1200 for the merged card | schema |
| 218 | requiredTag band floor (minRank) still dropped at slot build — noted, not built 🟡 | watch |
| 219 | MISSING items DEFERRED to designer queue 🔴: known-cast saga cadence (§21-3, ~2/GH-tier pool-gated); PLAYER_PREFERENCES plumbing; level-dependent gold-share (income 1.35 vs mandated ~1.09/level); finale-earn-in-bank (REWARD_BANK §2 vs supersession); born-in region nodes; STORY_ENGINE §10.1 min-length caps | queue |
| 220 | Audit drift notes accepted as-is: MC-bisection→greedy budget-spend (value marked anyway); recall wildcards random-not-thematic; endgame lift binary/global (beyond prototype scope); blurb not edge-derived; zProse has no min cap | recorded |

R22 verifier round on the rewritten writeQuest templates: pending. Live samples of the new voice
(cardsample.ts 31007/32009): dispatcher briefings landed — "The work is plain, wet, and supervisory;
expect hours on feet, council with wary peasants, and no glory." Gates green: typecheck + 82 tests.

Verifier rounds R22-R25 on the rewritten templates (fixpoint discipline): R22 oneoff CLEAN /
beat 3 defects → #221 mustBeFocal explicitly optional-and-omitted; #222 side-loot ∕ beat-1 promise
∕ plain-profit reconciled in one clause; #223 storyState.currentSituation seeded as "just taken
this up — the aim as the client puts it: <goal>" (a bare goal read as things-already-at-the-goal).
R23 exposed the CLASS behind (c): genesis goals carried branch/twist tails + attribution prefixes
→ #224 goal = PLAIN unattributed engagement (no "X states:", no "unless the company…", no unlearned
facts — branches to openDirections, truths to situation); genesis account-book ban widened to
ANYWHERE in the bible (a "ledger of meals" cast-want had seeded a downstream collision — the
seed/ban-collision class again); cast.role "prize" = person-prize only (thing-prize → focal is
quarry); recall wildcard relationPhrase de-jargoned ("thematic wildcard" reached prompts).
**R25: 2/2 CLEAN — fixpoint.** Closing validation campaign (484950) running with the full stack:
briefing voice + merged card + quarryTags + coined-cast lore nodes + served-with edges + jackpot.

Closing validation read (484950) + response batch #225-231. Reader confirmed: task unmistakable
41/41, structure clean, kernels pure, finale-once ×3, approach fidelity, no garrison, no gold
staging, no payment endings, investigate answers "strong", jackpot-with-catch observed working
("the ink run, so the proof felt planted"). Three of its findings were MY OWN artifacts: the JOB
line it saw is campaignread's stale render (UIs are merged — harness fixed, #225); 5 "phantom
wounds" were the name-in-cause guard dropping real 🩸 on SOLO marches while prose kept the wound →
solo parties skip the name check (#226); "this morning" ×16 was my "most business reaches a fort
in daylight" line gone sticky (§8 strikes its author AGAIN) → de-exampled to "name a time only
when it matters" (#227). Real fixes: | 228 | voice mixed three addresses (you/the company/us) →
ADDRESS THE BOSS AS "you" THROUGHOUT, never us/we, present/present-perfect — live samples now
consistently second-person | prompt | | 229 | Sylvvia sex+station flip at flesh (bride → he/him
kettle-page) → flesh: tags fix SEX and STATION; never demote a story's central figure | prompt |
| 230 | "Grakjaw" worn by two opposite characters (saga warlord node + fresh rescue victim) →
nameTooSimilar scans active lore character nodes | engine | | 231 | echo re-deals read as fresh
news ×3 → lastSeen cards must read as another TRY at a known matter | prompt |. Escort-saga
beat-1 overreach + finale re-deal seen again (known class, resolve rule in place — watch 🟡);
"empty satchel + spat" failure formula + thigh ×8 noted 🟡. R26 pending. The reader's #1 drag is
the 🔴 progression queue (roster starvation → back-half failure wall), not prose.

## Writing simplification round (2026-07-06, designer: "RPG game writing, not novel") #232-236

| # | Ruling/finding → change | Class |
|---|---|---|
| 232 | "no blaze of banners, no long stays at a watchpost" — zero-information sentences → governing positive rule: GAME WRITING — every sentence gives the player something usable (problem/place/client/task/hands/pay/risk); mood-only sentences cut | prompt (core) |
| 233 | Named NPCs gravitate small jobs ("Briis" made routine work read important; one-offs have no room to introduce people — names read as already-familiar) → ANONYMITY BY OMISSION: small-gravity one-offs deal NO npcNameSuggestions (folk stay nameless by trade); serious+ get ONE; the quarry alone always carries a name | engine+prompt (structural) |
| 234 | Preamble too long, accumulated do-nots → one-off template rewritten: input glosses one line each (~40% shorter), bans folded to one ALWAYS line + the two earned concrete bans (numbers, account-book); quarryTags spec moved from the npcNames bullet to the OUTPUT section beside ask (designer: vocab belongs with ask) | prompt |
| 235 | Stray-tag audit answer: raw AI ~90% on-vocab; engine stores 100% canonical (stem fallback + family fence); both live quarryTags legal | measured |
| 236 | R27 verify of compressed template: 2/2 CLEAN — no orphaned references, quarryTags trigger/vocab/rank clear; prize-focal added to the care-beat sympathetic bucket | verify |

Live samples (34031): "He asks that you fetch her alive if possible; the friar fears wolves and a
bad fall more than malice." — informational, brisk, anonymous-by-trade. Validation campaign
(575859) running. Gates green.

Writing-validation read (575859): **"RPG game writing bar MET — readability 7.5/10, up from ~5/10;
reads like quest text, not a novel."** Anonymity STRONG PASS (0 named color NPCs on small cards);
info density near-target (~4 mood sentences/10 cards, all in resolutions); voice PASS (0 us/we);
wounds 7/7 both ways; garrison 0; care-beat tone matches focal role. Repetition is now the dominant
defect → #237-240: | 237 | **finale ignored resolved chain state** (Krezzar captured at beat 1;
finale re-posed "hides at the weir"; dossier held both facts) → finale opens from storyState AS IT
STANDS; earlier successes stay done | prompt (HIGH) | | 238 | cast.want doubled its label ("wants
he wants…") → want = the want itself, no subject prefix | prompt | | 239 | toponym stem families
(Haw-×3, Mill-×3…) → freshPlaceName same-stem window guard (10) | engine | | 240 | lapse-repose
reframe renamed the HOLD (Hawgate→Black Weir) → reframe keeps same places/people, varies only
bringer+telling | prompt |. Remaining 🟡: resolution time-stamp openers (~16/30) + object-on-table
closer ×5 (narrator habit); premise monotony (fetch-object 14/24) + single-region = the 🔴 world-
variety queue. R28 verify pending.

## Readability push 7.5→target 8-9 (2026-07-06 late) #241-243

| # | Change | Class |
|---|---|---|
| 241 | Designer: one-offs "still too literatey" → PLAIN ENGLISH rule: common everyday words ("the world is medieval; the language is not"), mostly one-clause sentences, NO semicolons (split instead), common cards hard-capped 3-5 short sentences. Live samples read 8.5-9 ("A wounded forester stumbled in at dusk. He points to an elm hollow near Millmere… expect close work and startled dogs.") | prompt |
| 242 | R29 caught the stale register line ("low-medieval register" now read as the OPPOSITE of the new rule) → shared NUMBER_BAN reworded: plain low register — no archaic diction, no modern idiom; gravity=TONE vs rarity=SIZE made explicit (common+serious = short AND straight); "weight"/"carry weight" scrubbed from instruction text (banned-word echo risk) | prompt |
| 243 | job-field audit (designer asked if wasted tokens): NOT wasted — resolver anchor ("the job as written" overreach guard, game.ts:1187) + avoid-list dedup string; ~20 tokens/card for a correctness anchor; player never sees it | measured |

R30 verify: CLEAN (all three R29 defects confirmed resolved). Gates green.

## Extended writing playtest (2026-07-07, designer: "same goal, other quest types, several hours") #244-252

Register extended to ALL read surfaces: resolve gained the GAME WRITING field-report block (AFTER =
did/cost/hold/know, ONE action per sentence <~20 words; BEFORE = stakes/challenge only; decoration
cut) — R31 caught my global scoping colliding with the brink spec, R32 CLEAN after scoping. flesh
who-line: a plain FACT, never a metaphor (R31 CLEAN). Campaign-B writing judge (757677) scored
surfaces 6-8: finales 8, meta-surfaces 8, quirks 9 ("the best writing in the log"), after-texts 6
(clause-stuffing). Fixes #244-252:
| 244 | **semicolon ban ignored ~23×/run** → MECHANICAL: zProse desemi splits "; " into two
sentences (prose semicolons splice independent clauses — safe) | engine (structural) |
| 245 | "a messenger arrives" opener ~90% → shape inverted: THE MATTER FIRST (what is wrong and
where); how word arrived = one clause at most, many cards skip it; never open on a messenger |
prompt (structural) |
| 246 | obscure nouns (cuir, rood, interdict, procuress) → "if a farmhand would not say the word,
use the plain one" | prompt |
| 247 | after-text run-ons (25-43 words) → one action per sentence, <~20 words | prompt |
| 248 | **resolver framed a ROSTER MERC as the culprit** (c13: "pointed the reeve to Thatcher as
the hand that staged the fall" — the company incriminated its own investigator) → party members
are never the culprit/suspect/wrongdoer of their own job | prompt (correctness) |
| 249 | echo re-offer copied prior card text near-verbatim → lastSeen retold in NEW words | prompt |
| 250 | WHO metaphor-riddles ("beauty reads like a mask over old hunger") → plain FACT rule | prompt |
| 251 | before-text purple clauses ("the house breathed") — covered by decoration-cut; watch 🟡 |
| 252 | Sarny's calf/thigh wound ×5, Thornhollow ×8 again — known 🟡 classes | watch |

Judge A (727374) converged with B: content clears the bar, FORM is templated. New classes fixed
#253-257: | 253 | before-text opener template ("[Name] left the fort alone with [object] folded in
[garment]" ~75%) → begin where the CHALLENGE is (place/obstacle/person waiting); never the
departure | prompt | | 254 | wound-sentence stamp ("took a cut to her [part] from a [thing]" ×13)
→ vary the how and the words, not just the body part | prompt | | 255 | novelistic backstories
("traded secrets for song… a place she will not name") → plain concrete events; never withheld
mysteries | prompt | | 256 | fort-receiver drift (quartermaster/sergeant/captain/clerk/foreman
invented across resolutions) + handed-away-yet-retained wobble → goods return to the COMPANY's
keeping; no invented fort officials; past tense start to finish | prompt | | 257 | "Pay is X;
expect Y" semicolon weld (~25/30 cards) — resolved mechanically by #244 desemi (becomes two clean
sentences, the proven c6 register) | covered |. R34: 2/2 CLEAN (no collisions: challenge-first vs
brink structure OK; no-fort-officials scopes to the company fort, client-side officials untouched).
Campaign C (iteration-2 fixes) running; D follows with iteration-3.

Judge C (848586, iteration-2 measure): desemi LANDED (0 semicolons in all narrative prose);
matter-first openers 73%; but the model evades one-action via and/comma chains, desemi missed
dossier/cast/story fields, and a "photograph" appeared. Judge D (919293, iteration-3 measure):
**5/7 landed — before-texts +1.5 (0 departure templates), 0 invented officials, 0 tense slips,
0 self-incrimination, concrete backstories.** Fixes #258-263:
| 258 | and/comma action-chaining (2.7 actions/sentence) → never ACTIONS chained (compound objects
fine); R35 caught the budget bind → after budget +1 sentence per extra party member | prompt |
| 259 | desemi wired into zStrArr (quirks, knownToPlayer) + storyUpdate.currentSituation | engine |
| 260 | "photograph"/"co-op"/"Fifth Column" anachronisms → NUMBER_BAN: no object or term from after
the age of candles and horses; AND "fifth column" found as a KEYWORD SEED (seed/ban-collision class
AGAIN — v2 pool) → replaced with "traitors within" | prompt+seed |
| 261 | wound frame ("took a cut to her X" ×4, forearm ×3 near-verbatim) → wound rides INSIDE its
action beat, never stapled on | prompt |
| 262 | dangling "—and" brink glitch → desemi trims trailing conjunction after em-dash | engine |
| 263 | WHO similes survive ("wore rules like a careful garment") → simile tell named | prompt |.
Messenger-device saturation ~90% (beyond openers): partly inherent to boss-at-fort POV; added
"no bringer needed when the matter is visible/known" 🟡. "0 heads of 0 coins" display + roster
starvation deadlock (6 dead cycles, campaign ends at 2 wounded mercs) → the standing 🔴 economy
queue, now with sharper evidence. Campaign E (010203) = final measure with iterations 4+5.

Final judge E (010203, full stack): **"The targeted defect classes are cleared… the corpus now
reads as functional RPG quest text, not purple novel prose. On the sentence-craft bar the designer
set, this run passes on nearly every surface."** Counts: anachronisms 0 (seed fix holds), WHO
similes 0, departure templates 0, dangling "—and" 0, semicolons 0 in ALL AI prose, and-chains
2.7→1.48 actions/sentence, wound-folding integrated 5/5; after-texts 6→7. Closing fixes #264-267:
| 264 | **finale resolution contradicted the CHOSEN approach** (plan named Magka; narration
produced Rodton — "the only place the writing actively lies to the player") → the approach is a
CONTRACT: named actions happen to named people; the outcome judges THAT plan, never a swap | prompt
(correctness) | | 265 | brink truncation mid-phrase ("into the—") + R37 caught MY "word half-spoken"
example licensing exactly that (§8 strikes again) → complete-image-halted examples only | prompt |
| 266 | cross-item batch rules self-scoped ("when this message carries more than one quest") —
R37 flagged them un-actionable on single-quest calls | prompt | | 267 | CAST render glue semicolon
→ em-dash (harness) | harness |. R38: CLEAN — fixpoint.

**EXTENDED PLAYTEST CLOSED. Trajectory: after-texts 6→7, before-texts 5→7, one-offs/beats hold 7,
finales 8 (with the contract fix pending live confirm), dossiers 7, meta 7. Sentence-craft bar MET
on all surfaces per the final judge. What remains is design-scope 🔴: single-region monotony,
messenger-device as the core intake loop (92% of cards — partly inherent to boss-at-fort POV),
roster-starvation failure spirals, "0 heads of 0 coins" display. Watch 🟡: residual ~1.5 and-chain,
fixture pronoun/name-gender mismatches (Caelinne tagged male), q124-class grammar slips ~1/run.**

## FIX-EVERYTHING WEEKEND (2026-07-10, designer directive: "FIX EVERYTHING — fun, smooth, coherent, story GOOD and MAKES SENSE")

Designer authorized acting on the whole 🔴 queue with own judgment, each change marked 🛠 for review.
Method: docs re-audit (2 agents) + R39/R40 context-free verifier rounds + 3 baseline campaigns
(313233/343536/373839, judges scored fun 3-4.5/10) → engine+prompt batch → confirm campaigns.

**Docs-conformance misses BUILT (were silent — the pattern-B class again):**
| # | Finding → fix | Class |
| 268 | REWARD_BANK §3 void-to-gold ABSENT: a bank < KEEP(0.4)·mark delivered the focal + crushing debt ("6g debt with a recruit who then left") → thin finales now salvage round(bank) gold, focal to lore + sequel road back; regression test added | engine |
| 269 | finale cash-out paid max(mark, bank) (equal-total invariant broken; cash strictly dominated thin banks) → gold fate pays round(bank) | engine |
| 270 | recruit finale staged focal at tavern at 1.2×mark hire (mark paid TWICE; "Casden drank up and left" with no tavern built) → joins CLEAN when roster room, else stages PREPAID (hire cost 0) | engine |
| 271 | lapsed continuation lead left chain 'active' forever, focal stranded invisible in limbo → chain slips, focal → lore + sequel lead, report line | engine |
| 272 | holding expiry = zero-payoff evaporation → quick-price handoff (SELL_RATE gold; active ransom still pays better) + lore memory edge | engine |
| 273 | §21-3 known-cast cadence + LORE §1 lazy promotion BUILT: ≤2/GH-tier, pool≥3-gated, 35% — a coined lore-only person becomes the new saga's focal; engine rolls their Card (race/sex sniffed from blurb), node+edges REMAPPED onto it so memories follow | engine |
| 274 | STORY_ENGINE §5 trigger 2 BUILT: captive joining spawns a personal-chain lead 30% (🛠 rate) | engine |
| 275 | #218 minRank band floor BUILT end-to-end (type, slot build w/ fillability soften, assign check, CLI+web display) + §8 ~7%/step spillover above quarry band windows | engine |
| 276 | Chronicle room was a dead building → menu gate wired | engine |

**Roster dead-lock (worktree agent, 12 seeds × 40 cycles, mock):** blockage measured 99% = GH T2
prestige gate, NOT gold. 🛠 Tavern T2→T1 + 🛠 starter roster 3 (options A+B: Tavern ~c12, first hire
~c18, roster 4@c20 → 6.5 end, dead cycles 2.5→0, all-wounded stalls 0, fail streaks ≤3). Snowball
watch 🟡: c40 gold 5-7× baseline — damp via day-0 gold or hire lean if GUI play confirms a glut.
Heal rate left at doc 0.5/cycle (not needed once roster ≥3). | 277 | mock injury causes now NAME
the merc — all multi-party wounds were silently dropped in every sim (the §20 baselines were blind
to the wound channel) | sim |

**Monotony (3 campaign judges unanimous: variety, not prose, is the drag):**
| 278 | intake CHANNEL: engine rolls how word reached the fort and deals it as a FACT (quarryTags
pattern; lead.source was known and discarded) — bringer/sign/patrol/talk/notice weighted 4.5/2.5/
1.2/1.2/0.6 + source-mapped facts for interrogation/hunt/reward/collector; beats get NO spark
(a random spark fought the saga) | engine+prompt |
| 279 | envelope kind words writer-UNSAFE: 'lead' read as METAL (12 lead-bar fetches in one run;
"a parcel of lead" pay in another) → kinds translated ("a fresh trail to further work (knowledge,
never an object)") | engine |
| 280 | genesis kernel-novelty GUARD (mechanical): content-word overlap ≥3 vs avoid list → ONE
retry with the collision named (two reliquary-in-a-cellar sagas shipped in one campaign) | engine |
| 281 | archetype bag rotation (recent 3 skipped); hunt/investigate envelope decorrelated (65%
relic / else gold or gold+lead 🛠, ECONOMY §3 annotated); beat side-loot may carry a relic (35%,
QUESTS §6 "gold/stackables/relics" was gold-only); partial side-loot docks half (was full) | engine |
| 282 | world texture: forests poolWeights elf 4→2.5 🛠 (§13 knob explicitly open; elves were 60%
of every roll), rotating named ANCHORS in the location line, landmark cooldown 6 cycles after a
deal, place-name pool 14×10→28×24 (Fal-family stamping), SEEDS 12→30, spark recency reroll
("a poacher turned informer" ×3/run), TONES ∪ BIBLE.md list (adventurous/tense added 🛠) | engine |
| 283 | names: elf suffix pools gendered (male "Caelinne"/"Ilmvia" class), given-name TAIL check
(Pellmund/Nedmund read as kin), genesis assignedNames rolled WITH sex and dealt annotated ("(a
woman's name)") — order freed | engine |
| 284 | delivered-person FATE dealt to the resolver (no tavern → "they will thank the company and
MOVE ON") — prose said "may be persuaded to stay" while the engine line said "moves on" | engine |
| 285 | finale approaches roll per-branch difficulty (gold leans standard; one cloned roll made an
easy cash-out impossible per QUESTS §9 sketch) | engine |

**Prompt batch (R39: 5 zero-context judges + cross-template, ~50 defects; then R40):**
| 286 | correctness fences: saga-block PRECEDENCE line; custody fence (companyCaptive only — the
"Harjaw held in your cells after slipping away" class, genesis + beat); finale ground/frame
stability (stands on SEEN ground; never reframes the focal against the saga's telling — "bring
Rhivia to account" class); approach CONTRACT hardened (first sentence executes the chosen plan,
unchosen-approach actions/props/verbs forbidden, failure fails THE CHOSEN plan); mid-saga
goal-stays-open even on overreaching success (beat-1 overreach erased a finale); lastSeen facts
settled (captor/place/cause drift); company stores hold only what the message lists (phantom
tapestry); rewardItems never simultaneously the client's sought thing unexplained | prompt |
| 287 | clarity: culprit-by-role answers legal; anonymous-client delivery default (waits at the
fort); gold-only deliveredSummary = nothing to weave; injury bands calibrated (days/weeks/months);
after-budget priority (result > promise > beats); intake/opening/quarryTags glosses render-
conditional; keyword no-quote scoped to phrases; common-card size decoupled from gravity wording;
requiredTag rank affordance documented | prompt |
| 288 | §8 sweep: drover/reeve + night-watch + Galdai + want-list + wound-site list + token-of-
theirs de-exampled; "Expect …" closer named as stamp (20-26/run); "the company's keeping" echo
banned (MY OWN phrase ×9-12/run — §8 strikes its author AGAIN); before-openers vary beyond
terrain-tableau ("crouched" ×7); departures rule un-contradicted; counting-house idiom ban
("filing a complaint") | prompt |
| 289 | cross-template: dossier contract UNIFIED (flesh rules → resolve.fleshed + genesis cast.who);
flesh gains semicolon + account-book bans + both-sex pronoun map + homely-counts carve-out; echo-
instructions ban → resolve + genesis; genesis newPlaces blurb spec (one sentence <15 words) +
place-stem rule (Thornbar-beside-Thornhollow class) + no-client goal scope + tensions 2-4 + edge
importance anchor; TAGS_NOTE trait-scope (race/sex words fine) + 'nature' gloss; EDGE direction
for 'defeated' + people-only note | prompt |

Also: "0 heads of 0 coins" → plain zero-dice line; campaignread harness prints BUILD/UPGRADE spends
(judges called the gold drain invisible), abandons 0-coin marches (guard bug marched 3 guaranteed
losses/run), CAST render em-dash. Baseline logs + judge verdicts: scratchpad campaign-3132/3435/
3738; fixed-build confirm campaigns 616263/646566/676869 running at commit time.

**Confirm campaigns (fixed build, seeds 616263/646566/676869) — three judges: fun 3-4.5 → 5.5-6.**
Approach-contract 5/5 and 6/6 and 7/7 HONORED (was the top lie); finales pay (1,111g crystallized
in one run, zero evaporations); messenger intake 81-100% → 11-19%; fetch ~50% → 25-35%; lead-bar
fetches DEAD; elf skew 60% → 0-37%; zero-to-few dead cycles. Unanimous remaining #1: SAGA STATE
LOOPS (delivered things re-fetched; 4-5 of 7-8 chains) + the intake/closer stamps changed costume.
Final wave #297-312:
| 297 | finaleReady cycle-gate 1.5→3×beats 🛠 (merc-cycle gate fired finales after ~2 beats once
parties grew — arcs truncated mid-step; beat-count is the trigger, cycles now a stall guard) | engine |
| 298 | fate/disposition guards: a focal on the ROSTER never "slips away"/re-recruits — personal-
style close + fateSentence branch + runtime focalIsMerc ("Zaxesh slips away" ran while he stood in
the yard; Marric was recruited twice) | engine |
| 299 | STAND-DOWN: a quest whose empty slots outnumber free fit soldiers releases its parked party
(3 mercs split 1+2 froze a campaign 6 cycles); campaignread never splits the roster | engine+harness |
| 300 | prepaid finale prizes never walk from the tavern (Brugrim: won saga → 24g debt + nothing);
BUNK_ROSTER_SLOTS 4→5 🛠 (cap 4 left ONE hire; 5/6 guests walked) | engine |
| 301 | noteCustodyChange: ransom/sell/handoff/move-on now write "SETTLED: no longer in the
company's hands" into every saga the person anchors (finale staged "your captive Heleis" 3 cycles
after her ransom) | engine |
| 302 | MECHANICAL stamp-breakers in desemi: sentence-initial "Expect " → rotating substitutes
(×23-27/run despite the named ban); "the company's keeping" → "the company('s hands)" (ban echoed
AND grammar-mangled: "The company's keeping him."); both de-named from prompts (naming a stamp
plants it — §8's final lesson) | engine |
| 303 | DEAD-GROUND rule (saga block): anything an earlier step delivered/handed/settled may not
be asked for again in any costume; genesis: no two arc steps target the same delivery/place/
person-outcome; resolve keeps larger matter open on overreach (already in) | prompt |
| 304 | intake fact VARIANTS per channel + fold-or-omit rule ("The company's own sweep" ×3-12/run;
"no one brought it" negation leaked verbatim → de-negated) | engine+prompt |
| 305 | coin-custody sentences cut (a custody sentence with nothing else is cut — engine pay lines
say it; was ~25/run incl. "the promised coin now belongs to the roster") | prompt |
| 306 | genesis slate: reused people keep their SIDE, never client of two sagas at once (Elodir 3
chains, Lamfred 5); blurb/dossier lines are SETTLED history; cast must have arc parts; kernel-guard
fingerprint + avoid entries now include cast names + coined places (5/5 deliver-to-ceremony run) | engine+prompt |
| 307 | party never left behind/lodged/stationed (resolve); focal sex from tags, never flipped
mid-saga (Brugrim she→him inside one saga) | prompt |
| 308 | recentPlaceStems 10→16; PATROL spark de-templated ('lights where none should burn' ×5) | engine+seed |
**Finale surface verified for the FIRST time (scripts/finaledump.ts): R42 found 3 BREAKS in
resolve-finale (raw fate token; recruit-vs-claim contradiction; invisible unchosen approaches) and
2 in writeQuest-finale (ask↔approaches contract undefined; blind bible/relevantLore on finale
renders) — all rebuilt: saga gloss SHARED across beat+finale, fate as plain sentence via ONE
fateSentence source, rejectedApproaches dealt, plans-settle-focalName contract, finale-on-young-
saga scope, focal into deliveredCharacters. R42/R43 confirmations: prior breaks GONE.**
Watch 🟡: sweep-speak variants may still stamp (measure next run); success 39-43/43 with fat bars
— dice risk texture is a 🔴 DESIGNER knob (roster health made marches near-sure; the harness also
min-maxes); wound site "forearm" ×13 + all-low bands; lead-hunt template sameness (recruiting/
scouting faucet cards); relic name collisions (Weathered Bow ×2); one-region world remains THE
structural 🔴 (city at GH T4 still out of a 30-cycle campaign's reach).
| 313 | R43/R44 finish line: non-bringer/sign channels deal NO spark (their pools were arrival-of-
word images — the intake fact again, fighting the matter-first shape; the q14 card opened on "The
last patrol brought…" from exactly this); lore blurbs clamp sentence-safe everywhere (clampBlurb —
"speaks with a charter's" reached finale renders as a dangling fragment); genesis name-sex gloss
bidirectional ("Tzazith (a woman's name)" landed on a woodsman); arc-named people must be cast or
nameless-by-trade (arc-only names strand beats that cannot name them); SETTLED: prefix glossed in
knownToPlayer | engine+prompt |
**R44: ALL SEVEN render surfaces CLEAN at the breaks/degrades bar (one-off, beat, FINALE writeQuest;
resolve, FINALE resolve; genesis; flesh) — first fixpoint that includes the finale surfaces.**

## CONVERGENCE LOOP (2026-07-10 evening, designer: "run until satisfied; no drifting, no overly specific fixes")
| 314 | Loop-5 judge (787980, pass-III build): fun 6.5 (from 5.5-6), approach-contract 6/6, prior
loop/stamp classes dead. New classes fixed: EXPECT_SUBS rotation reset per call → every card got
"Count on" ×38 (start index now hashed from the text); settled-fact regression fences (a report
performs ONLY its card's job; broken stays broken; finale USES knownToPlayer proofs); merc-focal
finale plans never trade the soldier + fate-is-the-last-word return clause (Wilfred was narrated
into a lodge and marched on); stall cap (3 part-staffed unmarched cycles → set aside; the ⏸ line
had printed 10 cycles straight); same-CLIENT mechanical retry at genesis (Daeis clienting 3 sagas);
intake pools widened again; describeDelivery tells the writer when the roster is FULL (rescues
promised joins the cap couldn't take) | engine+prompt |
| 315 | §8 DE-DRIFT SWEEP (designer directive; audit agent over the whole suite): the drift class
was "positive menus of 2-3 ready-made phrasings appended after correct class rules" — 16 menus
deleted or rewritten class-level ("spoken, posted, or sworn"; "payment in kind, …" ×2; "a passed
object, an answered glance…"; "two winters" ×2; "a new hitch, a claim unpaid, a rite unfinished";
"handed on, or waiting at the fort"; "hamlets, waysides, crossings" ×2; "closed doors, an empty
site, cold trails"; "a quirk performed under stress…"; "her hammer/at her flank"; engine-decides
rule inverted positive-first; genesis want example → schematic; custody instance-glosses → class;
fidget-ban lists reconciled; care-beat meta-commentary trimmed). KEEP-BUT-WATCH guards untouched:
messenger triple, before-opener menu (needs an engine seed), per-field quote bans, trait-adverb
dup. Cleared as house-style: schematic examples ("X did A"), §5 token bans, definitional glosses | prompt |
| 316-319 | loop-6 (campaign-4 judge, 7/10): approach-label kind-verbs; lapsed unmarched beats
re-offer VERBATIM from cache 🛠 (fresh retellings drifted settled facts); kernel fingerprint +=
arc steps; surplus line self-explains | engine+prompt |
| 320 | loop-7 (campaign-5 judge, 7/10, "one focused loop then converged"): **arcStep dealt
verbatim** — writers fumbled indexing arc[beat-1] and scoped beat 1 to the WHOLE goal (5/6 sagas
retconned; the single dominant class) — the engine now hands each card its one step; finale
premise may not contradict knownToPlayer | engine+prompt |
| 321 | riders: client window includes last-3 closed chains (Hildine cliented 5/6 sequentially);
'fresh trail' scrubbed from the lead envelope (leaked into titles ×32); intake hunt/reward strings
de-quotabled; sceneFacet engine seed for before-text openings ('crouched' terrain owned 22/30 —
the §2 fix the audit prescribed); 'Pay is coin.' mechanical rotation; flesh avoidQuirks (one tic
landed on 4 people); finale memory edge records the approach ARRANGEMENT (informer deals were
invisible to dossiers); stall set-aside prints one line, not two | engine+prompt+seed |
| 322-323 | loop-8: chainContext.arcStep dealt to the RESOLVER + hard fence (resolutions
overreached even when cards were scoped: 6/8 → 1(+1 borderline)/13 beats after); atTheFort slate
flag; sceneFacet never-echo; saga cards drop the fake archetype label | engine+prompt |
| 324 | CLOSING patches per the final judge (campaign 7 = 8/10, verdict "stop the loop"):
outOfReach slate flag — the MIRROR of atTheFort ("Ulfgash sits in your cells" 19 cycles after
slipping away; a lore-held person is free in the world unless won back on screen); forecast
stamp-breaker REWRITTEN — word-substitution into arbitrary clauses was itself the grammar-breakage
source ("Count on others may be…"): the only safe mechanical move is dropping every other
forecast SENTENCE whole (hash-alternating), 'crouched' rotated | engine |

**CONVERGENCE LOOP CLOSED (2026-07-11). Judged-campaign fun trajectory: 3-4.5 (baseline) →
5.5-6 → 6.5 → 7 → 7 → 7.5 → 8/10. Final judge: finales 8.5 ("the strongest surface — all six
honored the approach, two produced non-obvious, earned outcomes"), resolution overreach cleared,
failed-beat-shapes-finale working as designed. Remaining watch 🟡: wound-stamp/prose desync ~1/run,
dossier cross-contamination (events the person wasn't in), same-cycle shared-NPC card collisions,
off-screen player-history invention (a "siege of the fort" retro-written as backstory), venue
fatigue within the one region, late formatting artifacts. Remaining 🔴 designer-scope: ONE-REGION
world (city at GH T4 still out of reach — THE structural ceiling), dice difficulty + payout spread
(89% success, +9g vs +351g commons, saga beats pay less than commons), roster-cap-5 tavern
treadmill (8/10 guests time out unhired), finale debt/Surplus-0 legibility, gold sink exhaustion
after ~c22 (#219 gold-share item).**
| 325-328 | LIVE-PLAYTEST rounds (designer playing): quarryTags race/sex echo (2 of 3 slots wasted
restating fixed identity — probe-verified fix: hunter/tough/clever, zero echo); actorless
before-texts ("a cord led from a forked stake to a spring snare—" — scenery capped at one
sentence, party must appear, brink = something in MOTION); web AI-log JSON pretty-printed;
**WHO-LINE RULING (docs/DESIGN.md 🔒 2026-07-11)**: character-card register calibrated on Fire
Emblem Heroes blurbs — station/origin + ONE hook; micro-habits belong to quirks ("she sees every
blade leave the racks" was the failure class); probe-verified ("A scribe who signed on when the
company formed. She will not bend to work that breaks her rules."); batch station-phrase dedup;
**founders get personal chains** (STORY_ENGINE trigger 1 never fired for the day-0 three — their
pasts could not stir; test selectors now skip personal leads when picking generic sagas) | engine+prompt+docs |
| 329-331 | LATE-GAME first read (scripts/_lateprobe.ts — fast-forwarded GH T5 fort, City unlocked,
real AI; the City had NEVER been generated live): verdict "the City's voice is ready — guilds,
debts, quays land as a real different place; not ready as an experience". Fixes: City gains
seedPlain + landmark('the Brass Quarter') + 6 anchors — 8/8 city cards had crammed into the Brass
Quarter (the Thornhollow one-landmark trap, second region); far-region cards never roll the
'seen from the walls' intake (a fort in the forests watched into a city back room); lead-hunt
variety gloss ("further work" promise leaked from the envelope ×5; 'routine pass' intake string
stamped ×8 — replaced); failure-cost line de-worded ('without X and without Y' frame ×3 grew from
the instruction's own 'without'); focal-merc never handed into custody mid-saga (a founder was
narrated into wardens' custody then marched next cycle); genesis may invent the WORLD's past,
never the COMPANY's (sieges/vouches the player never played — third sighting). Late-game pay/bar
scaling + lead-hunt faucet monoculture recorded 🔴 designer-scope | engine+prompt+seed |
| 339 | Region-brief CONFIRM probe (74504): 4/4 LANDED — Underdeep 10/10 cards keep people at the
entrances (things below: fissures, sounds, an unaging figure); Highlands off the Howling Pass
(6/8 → 1/3, anchors live); Outskirts name-loss identity is load-bearing ("the ring is the only
steady name beyond the border-stones"); Coast clan-speakers are clients with a NAMED speaker
(Tzaess). 'further work' purged 0 hits. Wound LANGUAGE now matches band (a lodged spear read as
low-tier) | confirm+prompt |

## LONG-HORIZON READ (64-cycle campaign, the longest ever run — 2026-07-11)
First half 7/10, second half 4/10, overall 5.5: **the content horizon is ~30-35 cycles** — the
second half fails from PROGRESSION STARVATION, not prose decay (gold sink exhausted c28, zero
builds/levels/hires/regions after c30, success 99%, 20 tavern guests walked at roster cap, 8/8
captives timed out, season marks outgrow banks → debt finales). The approach contract held 15-16
of 17 finales at 2x length; client-side cast reuse read as the run's best feature (rescued →
client arcs). | 340 | mechanical: 'forearm' wound rotation (11 of 14 second-half wounds);
RELIC_ADJ pool 20→30 (Broken ×7) | engine |
**🔴 DESIGNER QUEUE (updated, ordered by the long read):**
1. THE HORIZON DECISION: make region 2 reachable ~c30 (GH tier pacing — T2 lands ~c27; T4/City is
   out of reach) OR end a campaign formally ~c35 with a finale. Everything else is downstream.
2. Risk curve at veteran level (bars don't scale; failure extinct; wounds cosmetic — "dice are
   decoration" three judges running).
3. Roster cap 5 + tavern churn (20 broken "may join" promises in one run) + captive accept/ransom
   loop (dungeon = dead purchase; 8/8 timeouts).
4. Season-mark scaling vs bank pace late (3 of last 5 person finales end in shortfall/debt).
5. Soft-pool budgets for 60+ cycle play (venues ~8 stock locations, intake framings, premise
   families — sized for ~30 cycles by design; fine if the horizon decision caps campaigns).
Watch 🟡 (fixes in but untested at length — most postdate the 64-cycle run's start): want-binding
to wrong cast names (validation rule new), delivered-then-respawned third-party custody (Ithlas
class; dead-ground covers company custody, third-party custody claims still drift), stat-dump WHO
leaks (timeless-card register new), harness doesn't print GH tier-ups or dossier MEMORIES (judges
couldn't see either — add to campaignread next session).

## TWO-PHASE TIER RE-PACE (2026-07-11 designer ruling: "8/10 fun until T10, then endgame slows")
| 341 | GH_THRESHOLDS recalibrated (worktree sim, 10 seeds × 130cy, binder-instrumented): T2-T10 =
2/7/16/30/42/54/68/82/96 (was 9/16/48/80/118/230/310/350/510), knee, T11-15 = 200/320/460/620/800.
Post-change: T4/City c37 median 10/10 seeds · T7 c71 · T10 ~c100 8/10 · T10→11 transit 21-49cy ✓.
Baseline had T5+ NEVER reached (prestige plateau P77-79 vs old T5=80). Latent bug fixed: a zero
threshold read as "final tier" (game.ts need===undefined). Tier-ups now ANNOUNCED in the cycle
report with newly-unlocked building names (judges read 3 campaigns without seeing a tier event).
ghUpgradeCost re-paced two-phase to match (1.18^T through T10 — the old 1.32 tail stalled half
the seeds 10-27cy on gold with prestige ready; ×2.2/tier after T10 = the endgame money sink sims
showed was missing, 14-36k banked unused). Rarity shift: rares from ~T3/c29 (was ~c40). Docs
annotated (FORT.md Great Hall block, GENERATION_FLOW §20 time budget). Long-play harness: bedrooms
+ dungeon-cells on demand, full unlock queue (no prior run could build a 6th bed or enter the
City by POLICY — rosters froze at 5 in every judged campaign) | engine+harness+docs |
| 342 | T10-bar judges (two 115-cycle runs: early 8/10 ✓, mid 7, late 5-5.5 — bar missed): ladder
starved at T7-T8 (harness build fuel + policy), levels/roster frozen (build('bedroom') defaulted
owner to the BOSS who has one — failed silently every cycle of every campaign ever), the deferred
#219 gold-curve divergence exploded at region levels (+25,395g PARTIAL common; ~752k season lines;
34-54k idle treasuries). FIXES: **income curve BUILT** (ECONOMY §2 ~1.09/level — incomeScale on
gold splits/side-loot, cashValue() at every cash mint: ransom/sell/handoff/tips/crystallize/gold-
fate/void-salvage/personal close; hireCost cash-priced); harness builds a bedroom PER MERC with
ownerId (unfreezes levels AND roster) + generic build fallback (ladder fuel); chain RE-OFFER CAP
(3 lapses → slip with road back; one card had been re-offered ×28); newest region ×2 lead weight
(forests never receded); focal names now pass the similarity guard (two Hessossks); CAST-SLOT
integrity forced (focal owns quarry/prize; imposters demoted); fateSentence void-aware ("he will
ride with the company" shipped beside "ran too thin to keep him"); release-verb labels coerce
rewardKind gold ("Yield Ysard" ended captive) | engine+harness |
| 343 | round-2: income 1.09→1.20/level 🛠 (1.09 starved a 115-cycle fort to 234g; 1.35 exploded to
54k — 1.20 matches the re-paced ladder costs). Campaign-13 judge (economy aside, 7.5/7/6.5):
roster/levels MOVE (3→33 mercs, ⭐ through c110), re-offer cap 100% honored and slips CONVERT TO
CONSEQUENCE (an unprotected quarry returned sold-onward with the old client as slaver-patron —
the system generating story), City refresh lands. Fixes: custody-of-the-departed mechanical retry
at genesis (a SOLD entertainer re-appeared "in your cells"); 3-char prefix crowding guard
(Naemar/Naeryn/Naeiel/Naeeth); difficulty MIX stiffens with GH tier 🛠 (+3%/tier easy→hard;
veterans strolled commons at 95%+); gold-fate leaves INTO the arrangement (paid-despite-escape);
wrongness-signal variety (misplaced child's object ×14); pair-exchange de-whispered; avoidQuirks
20; flesh batch cap 8 (tag-dump WHO backlog); recruiting faucet pauses at tavern≥3 | engine+prompt |
| 344 | round-3: economy CONFIRMED healthy (1-3.3k gold, 30 hires, ~32 ⭐, 14-16 real failures per
115 cycles) but the ladder slowed to T5-T6 — the income fix cut prestige-side spending ~40%.
Slot-depth gate loosened one band 🛠 (the reserved lever: P plateaued at 22 for 30 cycles — the
tier↔slots↔prestige loop; 1.25^slots upgrade cost stays the brake); harness does 2 upgrades/cycle
when flush; GH_THRESHOLDS re-fitted to the MEASURED prestige curve (T2-T10 = 2/4/8/13/19/24/32/
44/58, knee 150-650): sim medians T4 c40 · T7 c58-75 · T10 c96 | engine+harness |

## ROUND-4 CHECKPOINT (2026-07-12) — judged 6.5-7/10 vs the 8/10-until-T10 bar
Both 115-cycle judges: thirds ≈ 8/7.5 · 7 · 5-5.5. THE WRITING HOLDS ~8 THROUGHOUT ("the narrative
machine is the healthiest component at cycle 110+"); the miss is SYSTEMS. Verified working: tier
announcements, City refresh cashed in, 24-34 hires + ⭐ through c114, crystallization spikes legible,
finale-approach fidelity mostly verbatim, failure→left-behind→rescue loops, re-offer caps.
**REMAINING CLASSES (ranked, with the designer's efficiency split):**
NUMBER-ONLY → verify in MOCK sim (no OpenAI):
 1. Risk collapse past c40 (bars ≈0.6× expected heads; 0 FAILs after ~c88; wounds never bench a
    30-merc roster) — bar/difficulty curve + wound bench scaling. THE biggest fun lever.
 2. Tier cadence: T2-T6 sprint then 48-cycle T6 park / 29-cycle T4 drought — bedroom upkeep
    monopolizes build throughput; region posts never built after unlock (T7/T8 dead-on-arrival).
    Harness build priorities (region posts+key rooms > bedrooms), assert tier-gap ≤K and ≥M cycles
    of runway after each region unlock.
 3. Economy legibility: +1g finale line items (fold), ~season estimates overshooting 30-60%
    (recompute or hide), slip-forfeit shadow-gold shown, payout outliers clamped by rarity.
 4. Custody ENGINE routing: delivered-to-CLIENT captures still land in the player's ⛓ holding
    (fiction hands over, engine keeps) — deterministic code split of capture-for-client vs
    capture-for-company; departed-yet-held state leaks at edges.
 5. Name guard v3: exact dupes among HELD characters (Magny×2, Fenden×2 opposite genders),
    Tild-/Lam- clusters, surname mills (four Thatchers/Reeds) — extend to all pools + surnames.
 6. Card volume late (12 offers + 9 resolutions/cycle; lead faucet self-feeds while hiring is
    capacity-capped) — offer caps by tier, faucet coupled to capacity.
 7. Re-offer/lapse presentation: verbatim 130-word reprints, silent vs stamped chain deaths,
    lapse messages using never-shown titles.
REAL-AI (story/prompt) → needs live rounds:
 8. Chain-state fidelity INSIDE chains (name-strip burned ×4 then "must stay whole"; Garmund
    delivered twice) — pipe beat-settled facts as dealt data + validation.
 9. Approach-constrained finales (chose sell → buyer is the victim's own kin; chose secret-cure →
    "is yours — captive"): the chosen approach must constrain narration AND the disposition stamp.
 10. Capture-custody narration (never narrate final client handover on ⛓ results) + close-
    disposition fidelity ("pledged to ride with the company" on a captive).
 11. Prose tic classes at 115-cycle horizon: object-out-of-place opener (30+), "thinned" weather,
    tap-sleeve closers, item adjective mill, sleeve-quirks ~20% of cast — class bans per §8.
 12. Bio hygiene: stat-dump WHOs (add engine guard: who matching tag-dump pattern is dropped for
    re-flesh), truncated bios, gender flips across chains (Korjaw her→his ×12), "phone docks"
    anachronism, ⭐-printed-on-FAIL display, N−1/N beat display off-by-one.

## 2026-07-12 — cringe overhaul: atomized keywords/sparks + FoC whole names (#346-349)
Designer mandate: story ≈8/10 but CRINGEY — 'fairy mound' / 'banned festival' keyword class
(pre-authored micro-premises the model can only transcribe), authored spark images ('a light
where none should burn'), mad-libs name texture. Ruling: ATOMIZE — seeds are single common
words; the model composes; variety = combinations, not entry count.
- **#346 keywords v2** (`src/ai/keywords.ts`, old file frozen at `scripts/_ab_old_keywords.ts`):
  all pools rebuilt as single-word atoms (1,785; zero cross-pool dupes; 10 two-word lexical
  units); new QUALITIES modifier pool (208) joins the wildcard union, 2nd wildcard leans it 35%;
  obscure medievalia (charivari/simony/levirate), anachronisms (identity theft/witness
  protection), and posed cleverness (petty apocalypse) purged. §5 doc annotated 🛠.
- **#347 sparks atomized + intake widened**: bringer = WHO+WHAT atoms (+time 25%), sign = one
  flat OBSERVABLE (+where 60%) — joined ' · ', writer prompt line reworded to "seed atoms,
  combine your own way"; INTAKE_FACT 3→7 variants/channel; game.ts specialPools 2-3→5 each;
  sampleOpening now returns sparkCore for the recency guard.
- **#348 names** (`names_data.ts` GENERATED by `scripts/_importnames.ts`): whole curated names,
  700/700 human M/F, 500/500 elf, 400/350 wolf, 300/300 lizard, filtered from FoC corpora
  (GPL-3; themselves from UESP lore lists + public generators) — filters: single token, len,
  perceived-gender ENDING rules (female corpus leaked Latin '-us' males), modern-name blocklist
  (Bob/Olivia), mythic-famous blocklist (Agamemnon), /cock/. Syllable PARTS deleted; epithets
  kept (human pool 10→20, wolf 5→9, lizard 5→7). §4b doc annotated 🛠.
- **#349 verification**: 83 tests green; sampling probe reads clean; real-AI 15-cycle campaign
  (seed 20001) + blind cringe-judge vs old-list logs — results below.
- **#350 genesis cast-reuse guard hardened** (found by reading the two verification campaigns):
  one coined foreman obstacled THREE concurrent sagas (20001) and one client ran three (21002).
  Two holes: (a) the same-role guard keyed on MODEL-reported loreId — a slate name copied
  without its id slipped the fence → engine now resolves loreIds by name against lore.nodes
  before checking; (b) the single retry was never re-validated — a stubborn draft shipped
  unchecked → validated retry loop (×2) + mechanical last resort (duplicate client/obstacle
  recast with a fresh engine-rolled name). Also: my new sign-intake variant re-introduced a
  NEGATION ('no one reported it…' → "You were not told this by a petitioner." on a card) —
  replaced with positive phrasing; the negation lesson holds.
- **#351 blind-judge round 1 (2 judges, old-arm logs vs new-arm campaigns 20001/21002)**: NEW ARM
  WINS both — cringe 6/10 vs 3/10 (10=clean) and 6 vs 3; story 6 vs 5 and 7 vs 5. The atomization
  classes are confirmed dead in the new arm: zero transcribed-seed cards (old: fairy-mound card,
  walking-corpse+grudge+love-potion stack), zero anachronisms (old: 'for ID', 'co-op', 'fifth
  column', 'sleep paralysis', 'rewilded'), zero misgendered names (old: ~1 in 3 elf names),
  opening variety real. Convergent REMAINING classes → fixed in round 2 (#352):
- **#352 round-2 class fixes** (prompts + data, verifier-gated):
  (a) beat writer: client-DELIVERY is always later work (beat-1 'Bones' completed the whole goal
      → later beats re-did then contradicted it — bones exhumed twice, then 'undisturbed');
      twistReveal nudge (a middle beat surfaces it — 21002's spirits-twist never reached a card);
  (b) saga gloss: bible coinages are notes never names ('the hung thing' ×9, 'alloy rib' ×8) +
      beat-1 must parse for a cold reader;
  (c) finale: labels never promise away a prize the envelope keeps ('Witness a public handover'
      chosen → 'company kept custody' narrated); labels in period words ('technical unbinding');
  (d) resolve: system words (approach/plan/roster/lead/envelope/outcome) named as
      machinery-never-in-prose ('carried out the chosen plan', 'sketched for the roster');
      uncanny promises pay off in one concrete moment (levitating bundle fetched as a parcel);
      own soldier never worded into 'custody/care'; PAIR exchange must carry information
      (hip-bump/shin-grip filler); before-opening GRAMMAR varies ('X showed Y' ×5);
  (e) genesis: dispute-SHAPE joins the avoid axes (three custody-dispute-by-witnessed-proof
      sagas in one run); period law words (no 'temporary custodial control');
  (f) names importer: alien consonant clusters rejected for humans ('Martxot').
- **#353 verifier pass (context-free, 4 rendered prompts) + fixes**: resolve = clean; the ONE
  BLOCKING find is the ROOT of the beat-1 overreach class — genesis wrote arc step 1 as a
  fort-side handshake ("Meet X and accept the hire"), leaving the beat writer squeezed between
  "cover arcStep ONLY" and "a real job to send soldiers on" → it steals later steps' work.
  Fixed both ends: ARC SHAPE requires step 1 to CONTAIN a sendable field leg (accepting = a
  clause, not the step); beat-1 gains the no-fieldwork escape (smallest leg TOWARD the next
  ground). Minor fixes: `level` was explained to the card writer but never SENT in the user
  JSON (weight-class calibration silently dead — now sent); framedCharacter null→omitted;
  quarryTags omit-line self-contained; worn-through idiom → plain; law-register list → register
  description (enumerated words would stamp); genesis schema de-interleaved + soldier-tie rule
  resolved against the company-history ban; 'clocks' idiom out of the resolve style rule.
- **#354 round-2 campaign read (22003) + guard hole #2**: the round-2 classes visibly fixed in
  the wild — five DISTINCT saga premises (custody-clause skeleton gone), chosen approaches
  enacted as labeled, "remained a soldier of the company" (no custody wording on own mercs),
  client delivery held to the finale, twist surfaced via the singer's song mid-saga. BUT the
  cast-reuse guard leaked once more: a COINED cast member has no loreId in her own bible, so the
  id-keyed liveClients set couldn't see her when the next saga reused her (one heir cliented two
  sagas born a cycle apart) → canonical personKey (loreId ∨ name-resolved node ∨ bare name)
  applied to BOTH sides of the check. Remaining watchlist from my read: twist blurted on a
  beat-1 card (should be a middle-step reveal), 'legal claim' register on cards, beat cards
  recapping a traveler as still at the gate mid-journey, one simile slip in report prose.
