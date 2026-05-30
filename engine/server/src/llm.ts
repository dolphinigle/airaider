// PROTO-GUI v0.5: scenario LLM provider. Picks real OpenAI when
// OPENAI_API_KEY is set, falls back to the deterministic mock otherwise.
// Single shared instance per process so the call-limit accumulates.

import type {
  ScenarioLLM,
  ScenarioLLMRequest,
  ScenarioLLMNarration,
} from '../../../prototype/src/llm/interface.js';
import { MockScenarioLLM } from '../../../prototype/src/llm/mock.js';
import { OpenAIScenarioLLM } from '../../../prototype/src/llm/openai.js';
import { LeanOpenAIScenarioLLM } from './leanLlm.js';

/**
 * Wraps any ScenarioLLM and dumps the full JSON request/response pair to
 * stdout for every call. Lets the operator inspect exactly what the model
 * was asked and what it returned during End Day.
 */
class LoggingScenarioLLM implements ScenarioLLM {
  readonly name: string;
  constructor(private inner: ScenarioLLM) { this.name = `logged:${inner.name}`; }
  async narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration> {
    const callId = Math.random().toString(36).slice(2, 8);
    console.log(`[llm:req ${callId}] ${this.inner.name} ⟵ ${JSON.stringify(req, null, 2)}`);
    const startedAt = Date.now();
    try {
      const res = await this.inner.narrate(req);
      console.log(
        `[llm:res ${callId}] (${Date.now() - startedAt}ms) ⟶ ${JSON.stringify(res, null, 2)}`,
      );
      return res;
    } catch (err) {
      console.log(
        `[llm:err ${callId}] (${Date.now() - startedAt}ms) ⟶ ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }
}

let cachedLLM: ScenarioLLM | null = null;

export function getScenarioLLM(): ScenarioLLM {
  if (cachedLLM) return cachedLLM;
  const key = process.env.OPENAI_API_KEY;
  let inner: ScenarioLLM;
  if (key) {
    // Lean prose-based prompt is the default for playtest (cheaper, richer
    // outcome). Set AIRAIDER_LLM_VARIANT=full to use the prototype's
    // JSON-blob prompt with per-merc contribution lines.
    if (process.env.AIRAIDER_LLM_VARIANT === 'full') {
      inner = new OpenAIScenarioLLM({
        apiKey: key,
        model: process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini',
        callLimit: Number(process.env.AIRAIDER_LLM_CALL_LIMIT ?? 50),
      });
    } else {
      inner = new LeanOpenAIScenarioLLM({
        apiKey: key,
        model: process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini',
        callLimit: Number(process.env.AIRAIDER_LLM_CALL_LIMIT ?? 50),
      });
    }
    console.log(`[llm] using OpenAI (${inner.name})`);
  } else {
    inner = new MockScenarioLLM();
    console.log('[llm] OPENAI_API_KEY not set — using MockScenarioLLM (deterministic, no AI)');
  }
  // Wrap for full request/response JSON dump. The lean impl additionally
  // logs the actual prose prompt it sends to OpenAI (which is what you
  // typically want to inspect). Opt out of the wrapper dump entirely with
  // AIRAIDER_LLM_VERBOSE=0.
  cachedLLM = process.env.AIRAIDER_LLM_VERBOSE === '0' ? inner : new LoggingScenarioLLM(inner);
  return cachedLLM;
}

export function resetLLM(): void {
  cachedLLM = null;
}
