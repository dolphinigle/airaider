# AI Provider — Selection & Strategy

**Status:** Recommendation (locked direction; revisit when prototype data arrives).

This doc records the AI provider research and the **recommended strategy** for Airaider's prototype and beyond. Source data: market survey done at the time of issue #2 (200-day sim writeup). Pricing moves quickly; re-verify before billing-critical decisions.

---

## TL;DR

- **Use GPT-4o-mini for everything in the prototype** — covers structured JSON + creative output, ~$0.05 per 100-scenario playthrough, strict schema enforcement eliminates a class of parsing bugs.
- **A/B test Claude Sonnet 4.5** on narrative-heavy prompts (legendary recruits, quest beats, god combos) starting week 2-3 of prototype.
- **Wrap the calls in a thin provider abstraction** so swapping is a 5-minute change, not a refactor. Don't pull in heavy frameworks (LiteLLM) yet.
- **Output format**: strict JSON Schema with a `narrative` string field inside the structured object. Best of both worlds: free-form storytelling + engine-consumable data.
- **Cost is not a constraint** at prototype scale. Even the most expensive option (Claude Haiku 4.5) is under $0.50 per playthrough.

---

## 1. Pricing landscape (market survey)

Re-verify on the official pricing pages before billing-critical decisions. Prices below are USD per 1M tokens.

| Model | Input | Output | Context | Structured Output | Notes |
|---|---|---|---|---|---|
| **Gemini 2.0 Flash Lite** | $0.07 | $0.30 | 1M | JSON mode (loose) | Cheapest hosted-mainstream tier |
| **Gemini 2.0 Flash** | $0.10 | $0.40 | 1M | JSON mode (loose) | Excellent price/quality for filler |
| **GPT-4o-mini** | $0.15 | $0.60 | 128K | Strict JSON Schema | **Recommended default** |
| **GPT-5-mini** | $0.30 | $1.25 | 128K | Strict JSON Schema | Slightly better quality than 4o-mini |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | 1M | JSON mode (loose) | Long-context creative work |
| **Claude Haiku 4.5** | $1.00 | $5.00 | 200K | Tool use (typed) | "Cheap Anthropic," but mid-tier in market |
| **GPT-4o** | $2.50 | $10.00 | 200K | Strict JSON Schema | Mainstream quality tier |
| **Claude Sonnet 4.5** | $3.00 | $15.00 | 200K | Tool use (typed) | **Best narrative consistency** |
| **GPT-5.4** | $2.50 | $15.00 | 1.1M | Strict JSON Schema | Top GPT quality |
| **Claude Opus 4.6** | $5.00 | $25.00 | 1M | Tool use (typed) | Premium; only for special cases |
| Llama 3.3 70B via Groq | $0.05 | $0.10 | 8K-128K | Partial / prompt-based | Cheapest with self-host alternative |

### Cost per 100-scenario playthrough (rough estimate)

Assuming ~2K input + ~500 output tokens per scenario.

| Strategy | Per playthrough |
|---|---|
| All Gemini 2.0 Flash | ~$0.04 |
| All GPT-4o-mini | ~$0.05 |
| Mixed: 80% GPT-4o-mini + 20% Claude Sonnet 4.5 | ~$0.15 |
| All Claude Haiku 4.5 | ~$0.45 |
| All Claude Sonnet 4.5 | ~$1.35 |

**Implication**: Cost is not the constraint at prototype scale. **Reliability and quality are.** 30 playtests of any of the above stays under $50.

---

## 2. Structured output capability ranking

This matters more for airaider than raw narrative quality, because scenarios produce engine-consumed data alongside flavor text.

| Provider | Mechanism | Strictness | Notes |
|---|---|---|---|
| **OpenAI** | Strict JSON Schema (fail on mismatch) | ⭐⭐⭐⭐⭐ | Gold standard. Define a Pydantic-like schema, API guarantees match or errors. |
| **Anthropic** | Tool use with typed inputs + XML tags | ⭐⭐⭐⭐ | Strong but less standardized than JSON Schema. Excellent for mixed narrative + struct. |
| **Google Gemini** | "JSON mode" — cooperative not strict | ⭐⭐⭐ | Works for simple schemas but no fail-on-mismatch. Postprocessing needed. |

For airaider: **OpenAI's strict JSON Schema is the right tool** for scenario output schemas, because the engine consumes the structured fields and we want errors to be loud, not silent.

---

## 3. Narrative & character voice ranking

| Provider | Character consistency | Narrative range | Notes |
|---|---|---|---|
| **Anthropic Claude** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Best at personality emulation; least drift over long sessions; excels at tag-template adherence |
| **OpenAI GPT** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Most "cinematic" but more drift in long sessions; persona prompts help significantly |
| **Google Gemini** | ⭐⭐⭐ | ⭐⭐⭐ | More generic out of the box; needs strong prompting to maintain voice |

Important: **this is community/benchmark consensus, NOT airaider-tested.** Real A/B test on actual scenario prompts during prototype week 2-3 is required.

---

## 4. The recommended hybrid (by purpose) — UPDATED 2026-05-30 per benchmark (issue #6)

For the production game, organize OpenAI calls by purpose. The gpt-5 family (released after the earlier sections of this doc) is cheaper AND higher-quality than the gpt-4.1 / gpt-4o tiers it supersedes. Benchmark in `engine/server/src/modelBenchmark.ts` (5 models × 2 chains × gpt-5 judge) shows:

- gpt-5-mini avg 7.92, $0.008/chain — winner
- gpt-4.1 avg 7.26, $0.010/chain — worse AND more expensive
- gpt-5-nano avg 6.25, $0.005/chain — fine for low-stakes; weak climax (4.2-5.4)
- gpt-4.1-mini avg 5.73 — vague climaxes
- gpt-4o-mini avg 5.05 — 1/2 chains schema-failed

**gpt-4.1 family and gpt-4o family are obsoleted by the gpt-5 family for airaider's tasks.** Do not use them.

| Purpose | Model | Cost/chain | Why |
|---|---|---|---|
| **Bible genesis** (story spine, controllingIdea, cast, trajectory) | **gpt-5-mini** | ~$0.008 | High-leverage call; best quality/$ ratio |
| **Beat generation** (one beat at a time) | **gpt-5-nano** | ~$0.001/beat | 3-6 calls per chain; cheap is fine |
| **Epilogue** (voice + cliche discipline) | **gpt-5-mini** | ~$0.003 | Voice matters; one call per chain |
| **Cliche scrub** (regex + retry) | **gpt-5-nano** | ~$0.0005 | Mechanical text rewrite |
| **Tag extraction** (parse AI prose → tagIds) | **gpt-5-nano** | ~$0.0005 | Player only sees the resulting tags |
| **Numeric envelope** (AI asks "what stats", engine picks numbers — but the "what stats" call) | **gpt-5-nano** | ~$0.0003 | Structured output; voice irrelevant |

**Per-chain total:** ~$0.012-0.018 including all beats.

**gpt-5 (full) ruled out at any tier (issue #6):** ceiling test showed +0.53 quality points for 6.4× cost. Sharper controlling ideas can be obtained from gpt-5-mini with prompt iteration that hasn't been fully exploited.

**Multi-provider (Claude / Gemini)** stays a future option. Lines 85-88 of an earlier draft suggested Claude Sonnet 4.5 for high-stakes / Gemini 2.0 Flash for bulk — those recommendations are NOT validated. For now, all calls go to OpenAI.

### 4.1 Pricing reference (per 1M tokens, confirmed 2026-05-30)

| Model | Input | Output | Cached input |
|---|---|---|---|
| gpt-5 | $1.25 | $10.00 | $0.125 |
| gpt-5-mini | $0.25 | $2.00 | $0.025 |
| gpt-5-nano | $0.05 | $0.40 | $0.005 |
| gpt-4.1 | $2.00 | $8.00 | $0.50 |
| gpt-4.1-mini | $0.40 | $1.60 | $0.10 |
| gpt-4.1-nano | $0.10 | $0.40 | $0.025 |
| gpt-4o-mini | $0.60 | $2.40 | $0.30 |

`gpt-5-nano` is the cheapest reliable option. `gpt-4o-mini` (older default) is 12× more expensive than gpt-5-nano on input. Never use it.

### Narrative-vs-mechanical tier split (production wiring)

The prototype runs one model (`AIRAIDER_LLM_MODEL`, default `gpt-5-mini`) for every callsite. Production should split into two tiers — narrative (player reads it) gets a stronger model; mechanical (engine consumes IDs) gets the cheapest model that can follow JSON schema.

| Env var | Default | Used by |
|---|---|---|
| `AIRAIDER_LLM_NARRATIVE_MODEL` | `gpt-5-mini` | `narrate()`, `aiLeadGen`, chain bibles & epilogues — anything the player reads as prose |
| `AIRAIDER_LLM_MECHANICAL_MODEL` | `gpt-5-nano` | `flavorCaptive()`, `generateQuestRecruit()`, tag extraction, beat generation — player only sees the resulting tags/labels |
| `AIRAIDER_LLM_MODEL` | (unset) | Single-knob override; if set, wins over both above |

**Rationale (per @dolphinigle, 2026-05-30):** "we want the more expensive model for narration and the cheap model like mini/nano for the mechanical stuff like generating unit tags from story." Benchmark (issue #6) confirmed gpt-5-mini is the winner for narrative work; gpt-5-nano is the cheapest reliable mechanical option.

**Implementation note:** wire `pickModel(tier: 'narrative' | 'mechanical')` once in `engine/server/src/leanLlm.ts`; have callsites pass their tier. Falls back to `AIRAIDER_LLM_MODEL` then to the tier default.

---

## 5. Output format for airaider scenarios

Strict JSON Schema with a `narrative` string field nested inside the structured object:

```json
{
  "narrative": "Marek mutters a prayer under his breath as he climbs the rope. His Strong Physical holds him steady; his superstitious tag whispers warnings he can't quite ignore...",
  "attributes_used": ["strength", "constitution"],
  "tags_invoked": ["muscular", "superstitious"],
  "sultan_coin_target": "reach the upper window without alerting the guards",
  "sultan_coin_band": "favorable",
  "merc_wound_severity": 0,
  "captive_taken": null,
  "narrative_consequences": ["+1 reputation with Brother Cedric", "Marek gains 1 V"],
  "follow_up_hooks": []
}
```

**Why this pattern works:**
- The `narrative` field is free-form storytelling — voice consistency lives here
- All engine-consumed fields are typed and validated — no silent parsing failures
- The AI can reference its narrative when writing the structured fields (e.g., choosing the right Sultan-coin band based on what it wrote)
- One round-trip per scenario, not two

**Patterns to AVOID:**
- ❌ XML tags as primary format — harder to validate, needs custom parser
- ❌ Plain text with regex extraction — will break in production
- ❌ Function calling as the entire scenario interface — overkill; use only when LLM should DECIDE between distinct discrete actions

---

## 6. Provider abstraction strategy

**Build a thin interface, NOT a heavy framework.**

```
class ScenarioLLM:
    def generate(self, prompt: str, schema: dict) -> dict: ...
```

Two implementations (`OpenAIScenarioLLM`, `ClaudeScenarioLLM`). One config flag to swap. No LiteLLM, no LangChain, no abstraction over abstraction.

**Why no LiteLLM yet**: at prototype scale (one-developer iteration speed matters more than infrastructure flexibility), the overhead of a routing layer exceeds its value. Add it later if/when you have 3+ providers in production.

**What to abstract:**
- The `generate` call (prompt in, validated structured output out)
- The schema definition (Pydantic models work for both OpenAI and Claude with light adapters)

**What NOT to abstract:**
- Provider-specific features like Anthropic's prompt caching or OpenAI's parallel function calls — these are leaky abstractions; use them directly when needed

---

## 7. Local / open-source — defer

**Skip local LLMs for prototype.** Reasons:
- Iteration speed matters more than per-call cost right now
- Quality gap exists vs. frontier models for character voice consistency
- Hardware investment ($2K-5K GPU) doesn't pay back at prototype scale
- API cost at prototype scale is genuinely negligible (under $50 for 30 playtests)

**When to reconsider local**:
- If the game ships and per-user API cost becomes a significant fraction of revenue
- If privacy/offline play becomes a requested feature
- If a specific model (Llama 3.3 70B, Mistral Large) demonstrably matches frontier quality on airaider-specific prompts

---

## 8. Open questions for the prototype to answer

| # | Question | How to answer |
|---|---|---|
| 1 | Does GPT-4o-mini hold character voice across a 50-scenario session? | Generate 50 scenarios using one merc's tags; manually rate consistency |
| 2 | Does Claude Sonnet's voice consistency justify 4x the cost for high-stakes scenarios? | A/B test legendary recruit arrivals on both; player-rate which feels more immersive |
| 3 | Is strict JSON Schema enforcement actually preventing bugs we'd otherwise have? | Track JSON parse failures across providers for a week |
| 4 | Does the AI hallucinate tags outside the locked vocabulary? | Lint generated `tags_invoked` against the canonical tag list; rate of out-of-vocab errors |
| 5 | Does narrative quality degrade in long sessions (context filled with history)? | Compare scenario quality at turn 5 vs. turn 50 of a session |

---

## 9. Decision log

| Date | Decision | Rationale |
|---|---|---|
| (today) | Start prototype with GPT-4o-mini | Cheapest with strict JSON Schema; best balance for prototype |
| (today) | A/B test Claude Sonnet 4.5 on narrative-heavy prompts | Validate community consensus on voice consistency for airaider's actual prompts |
| (today) | Defer local/open-source models | Iteration speed > per-call cost at prototype phase |
| (today) | Use strict JSON Schema with embedded narrative field | Best balance of validation rigor and storytelling flexibility |
| (today) | Build thin provider abstraction, skip LiteLLM | Avoid premature framework adoption |

---

## 10. References

- 2025 LLM pricing comparison surveys (multiple sources; pricing moves quickly — re-verify before billing)
- OpenAI Structured Outputs documentation
- Anthropic Tool Use documentation
- Community benchmarks for character voice consistency in creative writing tasks
- Airaider 200-day validation sim (issue #2) — informs the character-voice-consistency requirement
