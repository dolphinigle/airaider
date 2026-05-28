# Airaider Prototype

**Status:** M0 — proof-of-concept console runner. **Not** the final game.

The final airaider game is intended to be a **card-drag GUI** (Angular/Electron or successor) where players drag mercenary cards onto scenario slots, like Slay-the-Spire-meets-Darkest-Dungeon. This prototype exists for a different purpose:

1. **Validate the AI scenario engine end-to-end.** Does the LLM-narrated, Sultan-coin-resolved core loop *feel right*? (The mental sim said yes; we now need machine evidence.)
2. **Be self-testable.** Scenarios are scripted JSON fixtures; transcripts are deterministic when run with the mock LLM. An AI agent (or a CI run) can produce, diff, and regenerate transcripts without a human in the loop.
3. **Iterate on design + balance fast.** No webpack, no Angular, no Electron — just `tsx` and JSON.

The GUI layer is a separate concern that will sit *on top of* the same engine API once this layer is trusted.

---

## Quick start

```bash
cd prototype
npm install
npm test                                              # 21 tests, all should pass
npm run scenario -- fixtures/raid-01.json             # mock LLM (deterministic)
npm run scenario -- fixtures/raid-01.json --real      # real OpenAI gpt-4.1-nano
```

For `--real` you need an OpenAI key at `~/.airaider/openai.env` containing `OPENAI_API_KEY=sk-...`. See [Setup](#setup) below.

---

## What's in M0

| Piece | File(s) | Purpose |
|---|---|---|
| Core types | `src/types.ts` | Merc, Tag, Scenario, CoinRoll, OutcomeBand |
| Seeded RNG | `src/rng.ts` | mulberry32 — deterministic across machines |
| Sultan-coin engine | `src/sultan.ts` | N coins → 4 hidden bands (CANONICAL §2.1) |
| Tag vocabulary (v0) | `data/tags.json` | 12 base tags hand-picked from sim §0 |
| Sample mercs | `data/mercs.json` | Marek, Roselle, Imogen |
| Scenario loader | `src/scenarios.ts` | Zod-validated fixture JSON |
| `ScenarioLLM` interface | `src/llm/interface.ts` | Mock + OpenAI implementations |
| Mock LLM | `src/llm/mock.ts` | Deterministic canned narration |
| OpenAI LLM | `src/llm/openai.ts` | `gpt-4.1-nano` default, strict JSON Schema |
| Resolver | `src/resolver.ts` | Combines slot contributions → coins → flip → narration |
| Transcript renderer | `src/transcript.ts` | Pretty console output |
| CLI | `src/cli.ts` | `npm run scenario -- <fixture.json> [--real]` |
| Fixture | `fixtures/raid-01.json` | "The Merchant's Lost Wagon" — 2-slot contract |
| Golden (mock) | `fixtures/raid-01.transcript-mock.json` | Snapshot test source of truth |
| Real sample | `fixtures/raid-01.transcript-real.json` | One real nano call's output, for human review |
| Tests | `test/*.test.ts` | 21 tests covering RNG, coin engine, resolver, fixture |

## What's deliberately NOT in M0

- Full ~50-100 tag vocabulary — only 12 to prove the shape
- Multiple scenario archetypes — only `contract` covered
- Day loop / multi-scenario campaigns — single scenario only
- Captive cycle, artifact economy, prestige tiers
- Loyalty, wounds/permadeath math, building, equipment
- Any GUI — by design
- Llama 3.3 70B (Groq) — the A/B candidate from `docs/AI_PROVIDER.md`, deferred
- Real-LLM regression tests — non-determinism makes snapshot diffs noisy; we commit one curated sample for human review instead

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) for design questions deferred during M0.

## What's next

See [STATUS.md](STATUS.md) for current milestone and queue.

---

## Setup

### Prerequisites
- Node.js ≥ 20 (tested on 22.15)
- An OpenAI API key (for `--real`)

### Key storage
```bash
mkdir -p ~/.airaider
printf 'OPENAI_API_KEY=sk-proj-...\n' > ~/.airaider/openai.env
chmod 600 ~/.airaider/openai.env
chmod 700 ~/.airaider
```

The CLI reads `~/.airaider/openai.env` only when invoked with `--real`. The key is never logged, echoed, or written into transcripts. The root `.gitignore` blocks `.env*` everywhere as belt-and-suspenders.

### Model selection
Default: `gpt-4.1-nano` (~$0.10 / $0.40 per 1M tokens). Override:
```bash
npm run scenario -- fixtures/raid-01.json --real --model gpt-4o-mini
```

Per-call budget guard: `max_tokens=800` per call, and the `OpenAIScenarioLLM` instance refuses more than 5 calls per process unless `callLimit` is raised. This prevents runaway spend if a loop ever escapes.

---

## Design references

- `../docs/CANONICAL_DESIGN.md` — full locked design (§2.1 Sultan-coin, §2.5-2.8 tags, §9 prototype scope)
- `../docs/AGENT_BOOTSTRAP.md` — 60-second orientation
- `../docs/AI_PROVIDER.md` — why nano/4o-mini, Llama A/B plan
- aistronghold (predecessor): https://github.com/dolphinigle/aistronghold — `OPENAI_INTEGRATION_SUMMARY.md` was the prior art for `ScenarioLLM`
- aivn (sibling): https://github.com/dolphinigle/aivn — `src/cli/main.ts` was the prior art for the CLI entry-point pattern

---

## Commands cheat-sheet

| Command | What it does |
|---|---|
| `npm install` | Install deps |
| `npm test` | Run vitest (21 tests; all should pass) |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | TypeScript noEmit check |
| `npm run scenario -- <fixture>` | Mock LLM, deterministic |
| `npm run scenario -- <fixture> --real` | Real OpenAI nano |
| `npm run scenario -- <fixture> --real --model gpt-4o-mini` | Bump to 4o-mini |
| `npm run scenario -- <fixture> --seed STRING` | Override RNG seed |
| `npm run scenario -- <fixture> --no-write` | Print only, don't write transcript |

---

*Standing rules from `CANONICAL_DESIGN.md`: mercenary terminology (NOT heroes), rarity vocabulary reserved for tags only, permadeath real, flat wage rule, avatar wage = 0.*
