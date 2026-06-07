---
name: playtest
description: Dogfood-playtest the airaider game loop with the REAL AI — drive the engine through many cycles (one-offs AND quest chains), read every prompt + result for coherence, and assert engine/AI invariants to catch bugs (e.g. the AI hallucinating reward types, the engine mis-applying AI output). Use after any change to story-gen, quests, rewards, chains, or the narrator prompts.
---

# Playtest the airaider loop

Airaider's design question is *"is the AI-driven, character-driven quest chain fun?"* — so the only
way to trust a change is to **play it and read the prose**, not to assert from the code. This skill is
the dogfood loop. The **text CLI and the web GUI share `core/`**, so driving the engine headlessly
exercises exactly what a player hits in either UI.

## When to use
After ANY change to: `core/quest.ts`, `core/economy.ts`, `core/openaiNarrator.ts` (prompts),
`core/ai.ts`, chains/rewards/genesis, or the narrator. Big changes *introduce bugs* — assume they did.

## Setup (one-time per run)
- The OpenAI key is in `/home/irvan/airaider/.env` (`OPENAI_API_KEY=...`), gitignored, **read for
  dogfooding only** — the user has authorized this. Never print or commit it.
- Run harnesses from `app/` with `npx tsx <harness>.ts`. They use `provider: 'openai'` and
  `GameEngine.create({ onCall })` to capture every prompt/response.

## The loop (per the user's instruction)
Drive ~12–20 cycles. **On each iteration:**
1. **Pursue BOTH one-offs and chains** — sort leads so chains fire (genesis → beats → finale), but
   **always also pursue plain one-off leads** (`chain.kind === 'none'`). Non-chain quests must keep
   working — they're easy to break when you touch chain code.
2. **Read the prompt AND the result.** For each AI call (via `onCall`), check the *prose* is coherent
   (situation reads cleanly, job is one concrete action, names oriented once) AND that the
   **engine result matches the AI output** — the real bug class here is the seam between them.
3. **Check the AI isn't hallucinating engine-controlled fields.** Parse each `chainBeat`/`outcome`
   response and verify AI-proposed *types/flags* are sane and the engine handled them (e.g.
   `immediateReward` is a clean bool; a FINALE is never treated as immediate; `closesChain` only
   honored when the engine permits; `learned`/`loot` scaled to the outcome).

## Invariants to assert (flag, don't crash)
- **One-offs**: a non-failure one-off delivers SOMETHING (gold or a unit). (Regression canary.)
- **Chain finale**: crystallizes — focal delivered (recruit/captive) OR gold (ransom/void) OR, on
  failure, lost. Never silently empty.
- **Reward bank** (REWARD_BANK.md): `chain.bank` finite & ≥ 0; immediate beats bank the
  `minDeferShare` floor; deferred beats bank in full; the finale includes its own earn.
- **Off-rails**: a failed middle beat banks 0 and advances (no retry); `failsSpent ≤ budget+1`;
  exceeding the budget forces a LAST-CHANCE finale.
- **No throws**; **gold never negative**; every owned merc/captive is a complete card (name/who/
  backstory/quirks).

## How
Prefer the existing harness `app/_exp_playtest.ts` (real AI, captures prompts, asserts the above) as
the starting point — run it, READ the dumped prompts/results, extend its assertions for whatever you
just changed. For deterministic edge cases (forced failure patterns, last-chance, give-with-debt,
void-to-gold) use `app/_exp_bank.ts` (mock, offline). Also run the offline gates every time:
`npm run -s test` (selftest 226), `npm run -s looptest` (errors=0), `npm run -s conformance`.

## Report back
- Bugs found (engine/AI seam, hallucination, accounting) + the fix.
- Prose quality: 1–2 lines on coherence, plus any smell (repetition, over-orientation, a flag the AI
  over/under-uses). Note prompt-tuning opportunities separately from bugs.
- Confirm one-offs still work and the offline suites are green.

## Don't
- Don't assert from the code that it "should" work — run it and read it.
- Don't burn the whole budget: ~12 cycles is usually enough; one full chain + several one-offs is the
  minimum useful sample. Read prompts in full for the part you changed; skim the rest.
