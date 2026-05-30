// In-memory ring buffer of recent LLM calls (prompt + raw response). The
// GUI surfaces these in an expandable section under the fort log so the
// player can inspect what the AI saw and what it generated — same info
// the server stdout prints with [lean-llm:...] but accessible inside the
// game without tailing logs.

export interface LLMLogEntry {
  /** Unix epoch ms when the call completed. */
  ts: number;
  /** Short kind tag: 'narrate' | 'captive-flavor' | future. */
  kind: string;
  /** Model name reported by caller. */
  model: string;
  /** System prompt sent to the model (may be elided for brevity). */
  systemPrompt: string;
  /** User prompt sent to the model. */
  userPrompt: string;
  /** Raw text response from the model. */
  response: string;
  /** Optional short label for the call (e.g. quest id, captive id). */
  label?: string;
  /** ms elapsed for the round-trip; 0 if the caller didn't time it. */
  elapsedMs?: number;
}

const MAX = 50;
let buf: LLMLogEntry[] = [];

export function pushLLMLog(entry: LLMLogEntry): void {
  buf.push(entry);
  if (buf.length > MAX) buf = buf.slice(-MAX);
}

/** Return up to `n` most-recent entries, newest last. */
export function recentLLMLog(n: number = MAX): LLMLogEntry[] {
  return buf.slice(-n);
}

export function resetLLMLog(): void {
  buf = [];
}
