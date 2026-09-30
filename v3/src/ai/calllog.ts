// AIRAIDER_CALL_LOG=<file> — every AI call, whole, one JSON line each (docs/STORYTELLER.md §5.1:
// the saga lab's instrument). The in-memory ring behind the GUI's ai tab keeps 120 records with the
// user prompt cut at 20k chars; this keeps everything: full system and user prompt, the raw output,
// tokens, latency. Logging only — unset, nothing is written and nothing else changes.

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CallLogLine {
  t: string;                 // ISO time the call settled
  provider: 'openai' | 'mock';
  n: number;                 // the provider's call ordinal
  purpose: string;           // writeQuest / genesis / resolve / flesh / select / themeRoll / review / direction
  model: string;
  effort?: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
  ok: boolean;
  error?: string;
  system: string;
  user: string;
  output?: string;           // raw model text (the mock: its JSON)
}

export function callLogPath(): string | null {
  return process.env.AIRAIDER_CALL_LOG || null;
}

/** append one call — never throws (a full disk must not break play) */
export function appendCallLog(line: CallLogLine): void {
  const p = callLogPath();
  if (!p) return;
  try {
    fs.mkdirSync(path.dirname(path.resolve(p)), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(line) + '\n');
  } catch { /* logging never breaks play */ }
}

/** every call logged so far, oldest first ([] when unset or unreadable) */
export function readCallLog(p = callLogPath()): CallLogLine[] {
  if (!p) return [];
  try {
    return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as CallLogLine);
  } catch { return [] }
}
