# AI Provider — Selection & Strategy

**Status:** Recommendation (locked direction; revisit when prototype data arrives).

This doc records the AI provider research and the **recommended strategy** for Airaider's prototype and beyond. Source data: market survey done at the time of issue #2 (200-day sim writeup). Pricing moves quickly; re-verify before billing-critical decisions.

---

## TL;DR

- **Price ceiling: GPT-4o-mini ($0.15/$0.60 per 1M tokens).** Anything more expensive is out of scope for routine scenario generation.
- **Default: GPT-4o-mini.** Within the cap, it's the only model that combines (a) **strict JSON Schema** enforcement and (b) **strong character voice** — the two non-negotiables for airaider scenarios.
- **Cheaper fallback: GPT-4.1-nano** ($0.10/$0.40). Same strict JSON Schema, ~33% cheaper, but lower narrative/voice quality per public benchmarks. Use if 4o-mini's quality budget allows downgrade.
- **Narrative-heavy A/B candidate: Llama 3.3 70B (open-weight, served by Groq/Deepinfra/Together).** Best open-model creative writing in the cap **and** the most permissive on grimdark themes (combat, character death, ransom, morally grey mercenary choices) — which matters for airaider's tone. JSON output is prompt-based, not strict — requires client-side validation + retry. Worth testing on legendary recruits / quest beats only. **Hosting note**: Groq is fastest (~220 tok/s) but $0.79/M out is slightly above the cap; Deepinfra ($0.10/$0.30) fits in cap but is slower. All providers expose an OpenAI-compatible API — same SDK, change base_url.
- **Rejected**: Gemini Flash (loose JSON breaks engine), Claude Haiku/Sonnet (out of cap for routine use), DeepSeek V3 (output ~$1.10/M, over cap).
- **Output format**: strict JSON Schema with a `narrative` string field inside the structured object — single round-trip, best of both worlds.
- **Wrap calls in a thin `ScenarioLLM` interface** so swapping providers is a 5-minute change. No LiteLLM/LangChain at prototype scale.
- **Cost is not the constraint**. A 100-scenario playthrough on 4o-mini is ~$0.05; 30 playtests stay under $5. Reliability and voice quality are the constraints.

---

## 1. The price cap and what fits under it

**Cap = GPT-4o-mini pricing ($0.15 input / $0.60 output per 1M tokens).** Anything more expensive (Haiku, Sonnet, Opus, GPT-4o, GPT-5-mini, Gemini 2.5 Flash, DeepSeek V3) is out of scope for routine scenario generation. They can still be considered for **rare high-stakes one-offs** (legendary recruit arrival, quest finales) where the per-call cost is trivial against the total budget.

### Models that fit under the cap (per 1M tokens, mid-2025/2026 survey)

| Model | Input | Output | Context | Open weights | Notes |
|---|---|---|---|---|---|
| Llama 3.3 70B (Deepinfra) | $0.10 | $0.30 | 128K | ✓ | In cap; slower (~30–90 tok/s); OpenAI-compatible API |
| Ministral 8B | ~$0.10 | ~$0.10 | 128K | (Mistral hosted) | Surprisingly good budget-roleplay model |
| Gemini 2.0 Flash Lite | $0.075 | $0.30 | 1M | ✗ | Cheapest hyperscaler tier |
| **GPT-4.1-nano** | **$0.10** | **$0.40** | 128K | ✗ | Cheapest strict-JSON tier |
| Gemini 2.0 Flash | $0.10 | $0.40 | 1M | ✗ | Faster Gemini tier |
| Mistral Small | $0.10–0.20 | $0.30–0.50 | 128K | ✓ | Decent budget all-rounder |
| **GPT-4o-mini** | **$0.15** | **$0.60** | 128K | ✗ | **The cap. Best voice + strict JSON in budget.** |

### Slightly over the cap (still worth considering for narrative A/B)

| Model | Input | Output | Notes |
|---|---|---|---|
| Llama 3.3 70B (Groq) | $0.59 | $0.79 | Just over cap on output; **fastest in class** (~220 tok/s); best dev-experience for the A/B |

### Models over the cap (rare-use only)

| Model | Output $/1M | When to consider for airaider |
|---|---|---|
| GPT-5-mini | $1.25 | If 4o-mini's voice consistency proves insufficient |
| DeepSeek V3 | ~$1.10 | Logical/rule-driven scenarios needing huge context (400K) |
| Claude Haiku 4.5 | $5.00 | One-off narration if voice drift becomes a problem |
| Claude Sonnet 4.5 | $15.00 | Legendary recruits, quest arc beats, god-combo crit moments |

### Cost per 100-scenario playthrough (~2K in + 500 out per scenario)

| Strategy | Per playthrough |
|---|---|
| All Llama 3.3 70B | ~$0.02 |
| All GPT-4.1-nano | ~$0.04 |
| All Gemini 2.0 Flash | ~$0.04 |
| **All GPT-4o-mini (recommended default)** | **~$0.05** |
| Mixed: 90% 4o-mini + 10% Sonnet on key beats | ~$0.20 |
| All Claude Sonnet 4.5 | ~$1.35 |

**Implication**: Cost is not the constraint at prototype scale. 30 playtests stay under $5. **Reliability and voice quality are the constraints.**

---

## 2. Head-to-head: every model under the cap, scored on airaider's needs

Airaider isn't a generic chatbot. Its scenario engine needs **five specific things at once**, and the right model is whichever scores best on the conjunction:

1. **Strict JSON output** (engine consumes `sultan_coin_band`, `tags_invoked`, `wound_severity`, etc. — one malformed JSON crashes a turn)
2. **Character voice consistency** (each merc has a distinct tag-driven personality that must hold across 50+ scenarios)
3. **Narrative quality** (the `narrative` field has to feel like a story, not a corporate memo)
4. **Reasoning** (correctly map merc tags + situation → which Sultan-coin band fires, which tags get invoked, what flavor of loss/win emerges)
5. **Grimdark tolerance** (won't refuse or sanitize combat, character death, ransom, morally grey mercenary choices, or dark-backstory tags)

Scoring is `⭐⭐⭐⭐⭐` (excellent) → `⭐` (poor) drawn from a 2025/2026 cross-source survey (intuitionlabs, ranksaga, deepreview, lmsys-arena, openrouter community ratings). **All scores are public-benchmark consensus, NOT airaider-tested — the prototype will A/B them.**

| Model | $/1M out | Strict JSON | Char. voice | Narrative | Reasoning | Grimdark tolerance | Verdict for airaider |
|---|---|---|---|---|---|---|---|
| **GPT-4o-mini** | $0.60 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ (occasional sanitizing) | **Recommended default.** Only model in cap with strict JSON + strong voice. |
| GPT-4.1-nano | $0.40 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Cost-saving fallback. Use if 4o-mini cost ever matters (it won't at prototype scale). |
| Llama 3.3 70B (Groq) | $0.10–0.30 | ⭐⭐ (prompt-based) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (handles grimdark cleanly) | **A/B candidate for narrative-heavy beats.** Best voice + reasoning + permissiveness in cap; JSON tax is real. |
| Gemini 2.0 Flash | $0.40 | ⭐⭐⭐ (loose) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (frequent refusals) | **Rejected for scenarios.** Loose JSON breaks engine. OK for bulk filler text (names, environment descriptions). |
| Gemini 2.0 Flash Lite | $0.30 | ⭐⭐ (loose) | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Even more rejected. Cheap-but-weak. |
| Ministral 8B | $0.10 | ⭐⭐ (prompt) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Below airaider quality bar. Consider only if budget collapses (it won't). |
| Mistral Small | $0.30–0.50 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Dominated by GPT-4o-mini on every axis except open-weight + permissiveness. |

**Note on "Grimdark tolerance"**: airaider is a medieval mercenary fort sim with permadeath, captives, ransoms, morally grey choices, and tag-driven dark backstories (brothel mercs, addicts, fanatics, etc.). Models that refuse, sanitize, or insert "however, war is bad" disclaimers actively damage the game's tone. Llama 3.3 70B's base (Meta-aligned, what Groq serves) is the most permissive in cap on these themes without crossing into explicit NSFW (which it still filters).

### Why GPT-4o-mini wins the default

The non-negotiable for airaider is **strict-JSON + voice + tolerable censorship together**. That conjunction eliminates almost everything:
- Strict-JSON tier (OpenAI only, in cap): GPT-4o-mini, GPT-4.1-nano.
- Of those two, GPT-4o-mini scores noticeably higher on creative writing and character consistency in public surveys.
- GPT-4o-mini's censorship is moderate — it'll occasionally insert "however, this is a fictional setting" framing on grim scenarios, but rarely outright refuses. Workable with a strong system prompt establishing the grimdark medieval mercenary setting.
- The voice gap (over nano) is the airaider differentiator. The cost gap (~$0.01 per playthrough) is rounding error.

### Why Llama 3.3 70B deserves an A/B test anyway

- **Best open-weight creative writing** in the cap by community consensus (EQ-Bench Creative Writing v3, LMSYS Arena open-ended generation).
- **Excellent reasoning** (86% MMLU, 93.7% GSM8K — beats GPT-4o-mini's projected scores).
- **128K context** preserves character consistency over long sessions.
- **Least censored model in cap** — and this matters for airaider's tone. The Meta-aligned base (what Groq serves) is permissive on combat, character death, betrayal, morally grey mercenary choices, captives/ransoms, brothel-merc tags, and other grimdark medieval themes airaider needs. GPT-4o-mini sometimes sanitizes or inserts "however, war is bad" disclaimers; Claude frequently refuses or softens. Llama handles all of it without flinching (short of explicit NSFW, which the base model still filters).
- Self-host fallback exists if Groq / Together / Deepinfra ever go away.
- **Catch**: JSON is prompt-based, not strict. Mitigation: client-side JSON Schema validator + 1-retry-on-failure (`pydantic` + `jsonschema`). Expect ~2-5% retry rate.
- **Use case**: route only the narrative-heaviest prompts (legendary recruit arrival, quest finales, god-combo crits, dark-twist scenarios) to Llama via Groq for the voice + permissiveness boost, accepting the validation tax. Routine scenarios stay on 4o-mini.
- Watch out: minor tendency to over-explain / simplify; needs slightly tighter system prompts.

### Why we skip everything else

- **Gemini Flash family**: `responseSchema` is best-effort, not strict. Google's own docs admit this. Unacceptable for engine-consumed data.
- **DeepSeek V3**: Over cap ($1.10/M output). Voice is "literal, logical" — wrong style for character-driven scenarios. Worth re-evaluating in 6 months if pricing drops.
- **Mistral Small / Ministral 8B**: Dominated on quality by GPT-4o-mini; the savings don't matter at our volume.
- **Anything above $0.60 output**: reserved for rare one-off narration only (e.g., Sonnet 4.5 for a Day-167 coronation).

### Speed / latency (per ~500-token scenario, mid-2025/2026 benchmarks)

Scenarios are short (~500 output tokens), so total time ≈ TTFT + (500 / throughput).

| Model | Throughput (tok/s) | Time to first token | ~500-tok scenario | Notes |
|---|---|---|---|---|
| **Groq Llama 3.3 70B** | 161–276 | **0.17s** | **~2.4s** | Fastest. Groq's custom LPU silicon. |
| Gemini 2.0 Flash | 221 | 0.5s | ~2.8s | Hyperscaler-fast. |
| GPT-4.1-nano | 181 | 0.63s | ~3.4s | Fastest OpenAI tier. |
| **GPT-4o-mini** | ~161 | ~0.5–1.0s | **~3.5s** | Acceptable for turn-based gameplay. |
| Claude Haiku 4.5 | 138 | 1.16s | ~4.8s | Slowest of the cluster. |

**For airaider**: turn-based game, ~3-5s per scenario is fine and even feels "AI is thinking." Real-time streaming the `narrative` field while structured fields finalize at the end will hide the latency entirely. Speed is **not** a constraint in cap.

### How to actually call Llama 3.3 70B (concrete)

Multiple hosted providers serve Llama 3.3 70B Instruct (Meta's official weights, no need for self-hosting). Crucially, **all of them speak the OpenAI-compatible API** — same `openai` Python SDK, just override `base_url` and `api_key`:

| Provider | Per 1M tokens (in/out) | Speed | When to pick |
|---|---|---|---|
| **Groq** | $0.59 / $0.79 (slightly above cap on output) | **Fastest (~220 tok/s)** | Prototype default for Llama — fastest, simplest |
| Deepinfra | $0.10 / $0.30 | Slower (~30–90 tok/s) | Cheapest hosted; use for batch generation |
| Together AI | $0.20 / $0.90 | Medium (~80–350 tok/s) | Compliance / variety; mid prototype |
| Fireworks | $0.20 / $0.90 | Medium | Production scale, fine-tuning |

Example call (works for all four — just change base_url + key):
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",   # or deepinfra, together, fireworks
    api_key=os.environ["GROQ_API_KEY"],
)
resp = client.chat.completions.create(
    model="llama-3.3-70b-versatile",   # provider-specific model name; check docs
    messages=[{"role": "system", "content": SCENARIO_SYSTEM_PROMPT},
              {"role": "user", "content": prompt}],
    response_format={"type": "json_object"},   # cooperative JSON, not strict
)
```

**Practical recommendation for the prototype**: Groq for the Llama A/B (fastest + simplest), Deepinfra as the cheap fallback if Groq pricing matters at scale. Note Groq's output token price ($0.79/M) is slightly **above** the GPT-4o-mini cap; if that bothers you, use Deepinfra ($0.30/M out) and trade speed for cost.

The `ScenarioLLM` interface (§4) hides all of this. Adding a Llama backend is ~20 lines: instantiate an `OpenAI` client pointed at the provider's URL, return the parsed JSON.

---

## 3. Output format for airaider scenarios

Strict JSON Schema with a `narrative` string field nested inside the structured object:

```json
{
  "narrative": "Marek mutters a prayer under his breath as he climbs the rope. His Strong Physical holds him steady; his superstitious tag whispers warnings he can't quite ignore...",
  "attributes_used": ["physical", "willpower"],
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

## 4. Provider abstraction strategy

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

## 5. Local / open-source — defer

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

## 6. Open questions for the prototype to answer

| # | Question | How to answer |
|---|---|---|
| 1 | Does GPT-4o-mini hold character voice across a 50-scenario session? | Generate 50 scenarios using one merc's tags; manually rate consistency. If excellent, try downgrading to GPT-4.1-nano for cost savings. |
| 2 | Does Llama 3.3 70B (Groq) produce better narrative on legendary recruits / quest beats than 4o-mini, enough to justify the JSON-validation tax? | A/B test ~20 high-stakes scenarios on both; player-rate immersion; measure JSON retry rate |
| 3 | Does Claude Sonnet 4.5 (out-of-cap one-off) justify ~25× the cost for true climax moments (god-combo crit, coronation)? | Compare on 5 hand-picked Day-100+ peak moments |
| 4 | Is strict JSON Schema enforcement actually preventing bugs we'd otherwise have? | Track JSON parse failures across providers for a week of dev play |
| 5 | Does the AI hallucinate tags outside the locked vocabulary? | Lint generated `tags_invoked` against the canonical tag list; track out-of-vocab error rate per provider |
| 6 | Does narrative quality degrade in long sessions (context filled with history)? | Compare scenario quality at turn 5 vs. turn 50 of a session |
| 7 | Does GPT-4o-mini refuse / sanitize any of airaider's grimdark scenarios (captives, brothel mercs, ransom torture, betrayal)? | Construct a 20-prompt "grimdark stress test" hitting every dark theme in the design; track refusal + softening rate per model |

---

## 7. Decision log

| Date | Decision | Rationale |
|---|---|---|
| (today) | **Price cap = GPT-4o-mini.** Anything more expensive is one-off-only. | User constraint. Cost is negligible at prototype scale regardless. |
| (today) | **Default = GPT-4o-mini.** Within cap, only model combining strict JSON Schema + strong character voice. | Voice consistency is the airaider differentiator; strict JSON is non-negotiable for engine-consumed data. |
| (today) | GPT-4.1-nano = cost-saving fallback only | Same strict JSON, ~33% cheaper, but lower public-benchmark voice scores. Try it if 4o-mini ever feels excessive (unlikely at prototype volume). |
| (today) | Add "grimdark tolerance" as a 5th evaluation axis | Airaider's medieval mercenary tone is non-negotiable; sanitizing AI actively damages the game. Llama 3.3 70B leads in cap; GPT-4o-mini is workable with strong system prompts; Claude is risky on this axis. |
| (today) | A/B test **Llama 3.3 70B via Groq** on narrative-heavy beats | Best open-model creative writing in cap; pay JSON-validation tax only for the 10% of scenarios that benefit most |
| (today) | **Reject Gemini Flash family for scenarios** | `responseSchema` is best-effort, not strict; engine data would break. OK for bulk filler text. |
| (today) | **Reject DeepSeek V3, Mistral, Ministral** | Either over cap or dominated by GPT-4o-mini on relevant axes |
| (today) | Reserve Claude Sonnet 4.5 for true climax moments (legendary arrivals, quest finales, coronations) | Out of cap for routine, trivial cost at one-off scale, best voice |
| (today) | Defer local / self-hosted models | Iteration speed > per-call cost at prototype phase |
| (today) | Use strict JSON Schema with embedded `narrative` field | Best balance of validation rigor and storytelling flexibility |
| (today) | Build thin `ScenarioLLM` provider abstraction, skip LiteLLM | Avoid premature framework adoption |

---

## 8. References

- 2025 LLM pricing comparison surveys (multiple sources; pricing moves quickly — re-verify before billing)
- OpenAI Structured Outputs documentation
- Anthropic Tool Use documentation
- Community benchmarks for character voice consistency in creative writing tasks
- Airaider 200-day validation sim (issue #2) — informs the character-voice-consistency requirement
