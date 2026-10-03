// WHICH AI IS LIVE — one picker shared by the GUI server and the text CLI, so every way to choose the AI
// exists in both (docs/DOGFOODING.md parity):
//   mock   (default) — deterministic, free, no key
//   openai (AIRAIDER_AI=openai / --ai)     — PRODUCTION: GPT-6 Sol plans sagas, GPT-6 Luna writes, gpt-5-nano
//          does the mechanical tier; billed per call (openai.ts OPENAI_MODELS)
//   claude (AIRAIDER_AI=claude or sonnet / --claude or --sonnet) — the designer's FREE PLAYTEST transport: the same
//          prompts through the headless Claude CLI on the Claude subscription, Sonnet writing (designer 2026-10-02;
//          claudecli.ts). 'sonnet' is the designer's name for it (2026-10-03: "do implement ai=sonnet option")

import type { AiProvider } from './provider.js';
import { MockProvider } from './mock.js';
import { makeOpenAiProvider, OPENAI_MODELS } from './openai.js';
import { assertClaudeCli, claudeOptsFor } from './claudecli.js';

export type AiKind = 'mock' | 'openai' | 'claude';
const KINDS: AiKind[] = ['mock', 'openai', 'claude'];

/** the CLI's flags win; else AIRAIDER_AI; else the mock. An unknown AIRAIDER_AI is said out loud */
/** names that pick a kind: the kinds themselves, plus 'sonnet' for the Claude transport */
const ALIASES: Record<string, AiKind> = { sonnet: 'claude' };

export function aiKindFrom(envValue: string | undefined, flags: { ai?: boolean; claude?: boolean; sonnet?: boolean } = {}): { kind: AiKind; warning?: string } {
  if (flags.claude || flags.sonnet) return { kind: 'claude' };
  if (flags.ai) return { kind: 'openai' };
  const v = (envValue ?? '').trim().toLowerCase();
  if (!v) return { kind: 'mock' };
  if (ALIASES[v]) return { kind: ALIASES[v]! };
  if ((KINDS as string[]).includes(v)) return { kind: v as AiKind };
  return { kind: 'mock', warning: `AIRAIDER_AI=${envValue} is not one of ${[...KINDS, ...Object.keys(ALIASES)].join(' / ')} — using the mock` };
}

/** the provider, plus the one line that says which AI is live. claude fails fast when the CLI is missing */
export function makeAi(kind: AiKind, seed: number): { ai: AiProvider; banner: string } {
  if (kind === 'openai')
    return { ai: makeOpenAiProvider(), banner: `AI: OpenAI — ${OPENAI_MODELS.plan} plans sagas, ${OPENAI_MODELS.writer} writes, ${OPENAI_MODELS.nano} mechanical tier (production; billed per call)` };
  if (kind === 'claude') {
    const version = assertClaudeCli();
    const p = claudeOptsFor('plan', 'medium'), w = claudeOptsFor('writer', 'low'), n = claudeOptsFor('nano', 'minimal');
    return { ai: makeOpenAiProvider({ transport: 'claude' }),
      banner: `AI: Claude via the claude CLI (${version || 'version unknown'}) on the subscription — FREE playtest transport, not production; `
        + `${p.model === w.model ? `${w.model} plans and writes` : `${p.model} plans sagas, ${w.model} writes`}, ${n.model} mechanical tier; the same prompts as OpenAI` };
  }
  return { ai: new MockProvider(seed), banner: 'AI: mock (deterministic; --ai / AIRAIDER_AI=openai for OpenAI, --sonnet / AIRAIDER_AI=sonnet for the free Claude playtest transport)' };
}
