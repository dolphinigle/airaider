# Prototype v3 — Implementation Plan

Built against `docs/` (README order; GENERATION_FLOW §1–§21 = frozen decision log). Docs are law; doc gaps → flag to designer. Fun before balance; throwaway-quality code, but the ENGINE MATH must match the locked numbers exactly (they're sim-verified).

## Scope

**Ship = Great Hall T1–T6** (~acts 1–2), regions **Forests (L1–8) → City (L6–16) → Coast (L12–22)**; the all-keys/Outskirts rule scales down to what ships. Cuts (per docs): death · tag-drift · consumables · pay-in antes · forced negatives · branches except chain finales · embeddings · training rooms · room sizes.

## Module map (src/)

**engine/** — pure, deterministic, seeded; owns every number
- `rng.ts` — sfc32 seeded PRNG, serializable state (persisted in save, never re-derived)
- `tags.ts` — tag = (concept, tier 1–20); 4 bands; value(t)=6×1.9^(t−1); identity tags value 0; band words `word (rank)` low/mid/high/legendary; vocab = §9b W1–W18 prototype subset; body→attr map, background 6/6/6/6/6, race→appearOdds; mutex/opposites; maxTier=2×contentLevel+2
- `cards.ts` — Card {id,name,tags,value(mark),location,chainIds}; `type` tag: character(+attrs,growth,level,role,injuryTiers,focus)/relic/stackable(kind,qty); stack merge iff tag-sets match; liabilities = negative stackables (debt/evidence/mess)
- `overlap.ts` — the ONE fit primitive: overlap(tags, wants, clashes) + `accepts` type/kind query; quests read sign (≥1 favored → flat), rooms read magnitude (bandScore 1/2/4/8)
- `roll.ts` — §10 LOCKED: U(L)=base+2·g0·(L−1) (base≈3/stat·5, g0=2); coins=attr+0.5U(≥1 favored)+attrTag(body+bg)−0.5U(clash)−0.2U·injuryTiers, floor 0; threshold=E·U(L)/2, E∈{.25,.5,1,1.5,2}; multi-stat ×(n+1)/2; POOLED Σcoins vs Σthresholds; partial ≥0.6×; binomial odds calculator (for the always-visible raw odds + Oracle %)
- `growth.ts` — fixed-sum base(15)+growth(10/lvl) vectors; FOCUS single→2.0/dual→1.5/none→1.0 reshape (future growth only, past banked); XP→level toward cap
- `injury.ts` — §11: band none/low/med/high → tiers 1-2/3-5/6-9; stacking adds; heal rest 1/2c → infirmary f(comfort) → Hospital pay-gold; NO death
- `economy.ts` — V_base(L)=30×1.35^(L−1); E[payoff]=B×1.5×V_base×rarity×0.8; splitValue (chain: unit share 55–85%; one-off archetype kinds; gold-share shrinks with L 🟡); generateCard(targetV, ceiling, required) tier-weighted-low + jackpot-with-catch lottery; marked value; ransom 0.6×; hire ≥ grow-cost
- `fort.ts` — cells {floor,col} (3/floor, gold excavation); rooms: pure-gate vs comfort; slots 0→+1/upgrade, depth-gate T1-2:1…T14-15:6; comfort=min+(max−min)(1−e^(−raw/k)), k=20, raw=adj(1.2)×Σ bandScore fills; archetypes minor(1,30)/std(2,60)/grand(4,120) ×2 costs; benefit: theme→prestige, bedroom→cap 3+0.9×comfort, functional→benefitCurve 🛠; P=Σ theme comfort; GH thresholds T2≈12…T6≈118 (in-engine recalib); costs 120·1.32^(T−1), upgrade 0.7×, GH 1.6×, endgame 2×GH; catalog data from §19 PROTO set; captive break: chamber slots, ~5→2c
- `regions.ts` — §13 bundle {levelBand, poolWeights, unlockGate, seed}; spine graph; endgame keys
- `names.ts` — engine rolls ALL names (§4b): syllable tables per race
- `leads.ts` — lead {rarity,level,region,archetype,chainInfo}; EARNED only (hunt quests, priced reward grants, continuation, personal-chain); expiry; day-0 Map-room starter packet
- `quests.ts` — pursue→spec: engine N (archetype) + reward-at-birth (splitValue→generateCard) + per-slot E→threshold; QuestSlot {accepts, requirement, tested{attrs,favored,clashing}, groupId mutex}; resolve → s/p/f → delivery full/half+liability/none; liability collector-events (age>N → p% hostile lead)
- `chains.ts` — genesis: focal FIRST @ share×E[payoff] (main chain: focal = the merc); bank += party×V_base×rarity×outcomeScale, side-loot deducted; climax gate on merc-cycles SPENT; failure budget → last-chance; finale mutex kinds, KEEP≈0.4; §21-4a: fail → bank forfeit + focal → lore graph + sequel lead
- `lore.ts` — LoreNode {blurb ≤25tok, dossier DERIVED}; RelEdge {type enum, salience, core, active, blurb}; decay 0.97^Δ, CORE pinned; soft-delete only; recall = 1–2 hop rank (candidates ≤14) w/ edge-relation phrases; engine renders dossiers top-K
- `state.ts` + `cycle.ts` — GameState (cards+placements+fort+leads+chains+lore+GH+regions+rngState); save/load JSON; cycle: fort→commit→resolve (quest-id order, lore write-back after all)→heal/decay/staging→lead grants/expiry

**ai/** — flavor only; never emits numbers (exemption: edge importance 0–1)
- `provider.ts` — interface; every call = (promptInput, zodSchema); 3-producer discipline: creative outputs persisted, picker outputs discarded
- `mock.ts` — deterministic template mock (default; full game playable offline)
- `openai.ts` — gpt-5-mini writer / gpt-5-nano selector; zod-validated, tag-canonicalized, name-guarded (names handed in)
- `schemas.ts` + `prompts.ts` — the 5 calls: ① genesis+write-back (bible: lean cast/goal/arc/twist30%, kernel; relevantIds+new edges) ② quest-writer beat (card+ask, no numbers) / one-off dress ③ batched resolution (before-blind/after-sighted + edges w/ blurb+importance + injury bands + reward-kind proposal) ④ theme-roll (type+style→wants, ONCE per renovation) ⑤ selector (nano, discarded); keyword sampler 1B+1T+2W from §5 pools

**game/** — `game.ts` facade: views (fort, roster, leads, quests, chains, lore, odds) + actions (build/upgrade/renovate/slot/pursue/assign/endCycle/hire/captive-dispositions); consumed identically by CLI and web.

**cli/** — interactive REPL + `--script` batch mode (dogfooding: I pipe command files). **server/ + web/** — Fastify JSON API over the same facade; React: fort cross-section, roster cards w/ tag chips (band borders), lead/quest boards, chain reader, Chronicle.

## Build order & verification

1. engine core (rng→tags→cards→overlap→roll→growth→injury) — **tests: §10 pass-table cells (L3–L50 bands) as vitest baselines**
2. economy — tests: mark semantics, split sums, generateCard E[value]≈target (MC)
3. fort+regions — tests: §20 comfort table (std room T2≈5…T15≈57), cap ladder (~16@T5, ~33@T10), threshold crossability smoke-sim
4. quests+leads+chains (mock AI) — tests: pooled resolution, bank accounting, climax gate, §21-4a
5. lore — tests: decay/pinning, recall ranking, dossier render bounded
6. game facade + save/load — test: save→load→identical continue (reload re-runs NO AI)
7. CLI → **first dogfood (mock)** → fix loop
8. AI layer real (OpenAI) → **dogfood a real campaign T1–T2**; word budgets by rarity
9. web GUI → human-playable
10. iterate: pacing sanity vs §20 (~130c/tier), fun-shape defects, polish reveal cascade

Commit per module. If OpenAI credits run out → tell the designer (refill offered).
