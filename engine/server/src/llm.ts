// PROTO-GUI v0.5: scenario LLM provider. Picks real OpenAI when
// OPENAI_API_KEY is set, falls back to the deterministic mock otherwise.
// Single shared instance per process so the call-limit accumulates.

import type { ScenarioLLM } from '../../../prototype/src/llm/interface.js';
import { MockScenarioLLM } from '../../../prototype/src/llm/mock.js';
import { OpenAIScenarioLLM } from '../../../prototype/src/llm/openai.js';

let cachedLLM: ScenarioLLM | null = null;

export function getScenarioLLM(): ScenarioLLM {
  if (cachedLLM) return cachedLLM;
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    cachedLLM = new OpenAIScenarioLLM({
      apiKey: key,
      model: process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4.1-nano',
      // GUI playtest can fire many quests per End Day; cap is permissive.
      callLimit: Number(process.env.AIRAIDER_LLM_CALL_LIMIT ?? 50),
    });
    console.log(`[llm] using OpenAI (${cachedLLM.name})`);
  } else {
    cachedLLM = new MockScenarioLLM();
    console.log('[llm] OPENAI_API_KEY not set — using MockScenarioLLM (deterministic, no AI)');
  }
  return cachedLLM;
}

export function resetLLM(): void {
  cachedLLM = null;
}
