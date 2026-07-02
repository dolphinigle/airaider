> **⚠ PARTIALLY SUPERSEDED (2026-07-03).** The BANK mechanism (accrual · crystallization · shortfall/debt · failure budget · last-chance) is canon — but details predating later locks are overridden: focal sizing = share×E[payoff] (GENERATION_FLOW §1–§2, replaces `maxCharValue`); no `risky` flag — injury is AI-judged & decoupled (F5); attribute names & the roll = §10. Treat QUESTS.md + ECONOMY.md as the entry points.

# Reward bank, off-rails & last-chance — design + plan

**Status:** spec (2026-06-06). Implements the chain reward as an *accrued merc-day bank*, replacing
the static genesis-estimate focal and the hacky success-gated retry. Builds on
[ECONOMY.md](ECONOMY.md) (§2 `V_base` = value-per-merc-per-cycle, §5 shortfall) and
[QUESTS.md](QUESTS.md) (chain pipeline).

## 1. Why — the merc-day insight

`V_base(level)` is **value per merc per cycle**. One quest pays ~one merc-cycle. A reward worth
*more* than one merc-cycle can only be earned across several beats. So a chain's payoff (a strong
focal character, worth many merc-cycles) **must accrue over the beats and pay at the end.** The bank
*is* that ledger; the focal is its concentrated payout. Two pre-existing bugs this fixes:

- **Static estimate, not accrued.** `V = vBase × rarityMult × (B·n)` was computed once at genesis from
  *expected* beats; failures never shrank it; the focal was pre-minted whole. Overflow above
  `maxCharValue` was **silently dropped** → chains *under-paid* badly (a level-3 focal worth ~78 for
  ~8 merc-cycles of work).
- **Beat-count mismatch.** Value used `B = randInt(2,4)`; the arc ran `arcBeats = {4,5,6,7}`. Priced
  for 2–4 beats but played 4–7.

## 2. The bank

- `chain.bank` starts 0. Each resolved beat accrues
  `earned = round(party.length × V_base(level) × rarityMult[rarity] × outcomeScale)`,
  `outcomeScale = success 1 · partial 0.5 · failure 0`.
- Accrual happens in `resolveQuest` **before** delivery, so the finale's own earn is in the bank when
  it crystallizes.
- **AI-proposed immediate vs deferred** (reward *type*, content-driven). `chainBeat` returns
  `immediateReward` — true only when the beat physically hands over loot now (raid/loot/seize/crack a
  chest), false for meet/scout/travel/talk/escort. The engine still **always banks a floor** of every
  beat (`BALANCE.minDeferShare = 0.4`): an immediate beat pays `60%` as gold now and banks `40%`; a
  deferred beat banks 100%. So the saga always builds a finale payoff (the focal stays affordable), and
  immediate loot taken en route is **locked in** (only the deferred bank rides on the finale). No
  premium — deferring's upside is the *character*, not a multiplier.
- Income-neutral vs one-offs: a chain banks the same per-merc-cycle as N one-offs would pay; it only
  **defers** payment into a lump + a character, and adds **variance** (failed beats earn 0).

## 3. Finale crystallization (non-personal)

`realizedBank` = `chain.bank` (incl. the finale beat). `focalTarget` = `focal.value`.

- **Finale failure** → quest failed → **0 reward**: focal lost (grief), **bank forfeited**, + any
  punishment. (ECONOMY §5 failure row; user "failure quest = 0".)
- **Win them over / subdue (recruit/captive)**:
  - `bank ≥ focalTarget` → deliver focal (clean/wounded) + `round(bank − focalTarget)` gold (surplus).
  - `focalTarget·KEEP ≤ bank < focalTarget` → **give-with-debt**: deliver focal + a liability sized to
    `round(focalTarget − bank)` (net = bank). [§5 "keep the unit + a liability sized to net …"]
  - `bank < focalTarget·KEEP` → **void-to-gold**: focal slips away, give `round(bank)` gold. [§5 "… else
    give gold if not worth keeping"]  `KEEP = BALANCE.focalKeepFraction = 0.4`.
- **Ransom / sell (gold)** → focal sold/handed off; pay `round(bank)` gold. (Same total value as
  recruiting; the choice is *form*, not amount.)

With the current value scale `bank` is usually **>** `focalTarget` (one good beat already exceeds a
level-capped focal), so **surplus-gold is the norm**; debt/void are the catastrophe path (you failed
most beats). That's intended.

**Personal finale** — unchanged renown/scar/death, **plus** award `round(bank)` gold on non-failure.

## 4. Off-rails (replaces the retry) + last chance

- **No retry.** The arc advances **every** beat (step = `beatsResolved`). A failed middle beat banks 0
  and the next beat opens from the *fallout* (`lastFailed` → a consequence note; the off-rails
  experiment's winner B: "do NOT retry; write the consequence, company worse off, press on").
- **Failure budget** `chain.failBudget = BALANCE.failBudget[rarity]` = common 2 · uncommon 2 · rare 1 ·
  legendary 1 (harder = fewer; a fatter prize tolerates fewer wasted cycles). A middle failure →
  `failsSpent++`.
- **Last chance** — when `failsSpent > failBudget`, set `lastChance`; the **next beat is forced to the
  finale** (desperate / out-of-time framing). Fail it → lose everything; scrape it → focal + thin gold.

## 5. Code changes

- **types.ts** `Chain`: add `bank?`, `failBudget?`, `failsSpent?`, `lastChance?`. Keep `lastFailed?`,
  `arcProgress?` (now unused — left for scratch harness typecheck), `mercCyclesSpent`/`climaxTarget`
  (display only, `_looptest` prints them).
- **economy.ts** `BALANCE`: add `failBudget` map + `focalKeepFraction: 0.4`.
- **quest.ts**
  - `genesisChainAndBeat` / `genesisPersonalChain`: drop `B = randInt(2,4)` & `V = questValue(…B·n)`;
    mint focal at `maxCharValue(level)`; init `bank:0, failsSpent:0, failBudget`, `expectedBeats =
    arcBeats`, `climaxTarget = arcBeats` (display).
  - `makeBeatQuest`: step = `beatsResolved`; `isFinale = !beat1 && (beatsResolved ≥ nSteps-1 ||
    lastChance)`; drop `isRetry/stuck/arcProgress`; `lastFailed` → consequence note; middle reward =
    empty bundle (banked, no card); finale reward = focal (as before).
  - `resolveQuest`: accrue `chain.bank` before delivery; drop the loot-card theming for chains.
  - `deliverReward`: middle chain beat → "spoils gathered (~bank)" line, no card. Finale → new
    `crystallizeFinale` per §3. `handleFinaleFate` → bank-driven; personal → + bank gold.
  - `recordBeat`: drop arc success-gating; set `lastFailed`; middle failure `failsSpent++` → maybe
    `lastChance`; keep finale→done + sequel-on-non-failure.
- **web/App.tsx** (light): show `chain.bank` on a saga / in the result ("spoils so far"); show a
  "LAST CHANCE" flag on the finale. (Nice-to-have.)
- **docs**: fold §2–§4 into ECONOMY.md (chain accrual) + QUESTS.md (chain reward + off-rails).

## 6. Verify

`npm run typecheck` · `npm test` (selftest: economy untouched → green) · `npm run looptest` (mock e2e:
no crash, gold sane, finales pay) · `npm run conformance` (focal still fleshed/delivered; sequel on
finale). Plus `_exp_bank.ts`: force outcome patterns (all-success, mixed, budget-blown last-chance,
finale-fail) and print bank accrual + crystallization to confirm the math. Then a short real-AI read
(2–3 sagas) for the new consequence/last-chance prose.

## 7. Edge cases simulated

- 2-step arc → opener + finale (min length holds).
- Budget blown early → forced desperate finale; bank thin; scrape-win = focal + little gold.
- Conformance forces finale threshold=1 → success path crystallizes, focal pushed to `delivered` →
  fleshed; void-to-gold focal is `dead` (not in allMercs/captives) → integrity check unaffected.
- Ransom = bank gold; recruit = focal + (bank−focalTarget) gold → equal total, different form.

## 8. Deferred (noted, not built)

- Concentrate more value *into* the focal (lift `maxCharValue` for focals / higher-level focal) so the
  character holds more of the bank and surplus-gold shrinks — a balance lever, risky to tune unattended.
- Per-beat *immediate vs deferred* is now in (AI-proposed, engine floors 40% banked). A *player*-facing
  take-now choice (let the player, not the AI, decide each beat) is still cut — the AI decides the type.
- Engine name-seed (separate, already documented in STORY_GEN_STATE.md).
