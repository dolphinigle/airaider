// Shared AI plumbing for storyGen (bible generator + quest-writer).
import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { appendFileSync, mkdirSync } from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

export type Effort = 'minimal' | 'low' | 'medium' | 'high';

export function makeClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  return new OpenAI({ apiKey });
}

export async function callJson<T>(
  client: OpenAI,
  opts: { system: string; user: string; schema: z.ZodType<T>; model: string; effort: Effort; maxTokens?: number; label?: string },
): Promise<T> {
  // One schema-failure retry: a single short field / stray shape used to crash
  // the whole generation. On a validation miss we re-ask once, feeding the zod
  // errors back, before giving up.
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: opts.system },
    { role: 'user', content: opts.user },
  ];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await client.chat.completions.create({
      model: opts.model, messages, response_format: { type: 'json_object' },
      max_completion_tokens: opts.maxTokens ?? 8000, reasoning_effort: opts.effort,
    } as never);
    const content = (res as { choices: { message: { content: string } }[] }).choices[0]?.message.content ?? '';
    // Best-effort prompt+response log (logged BEFORE parse so bad output is captured). Never throws.
    try {
      const usage = (res as { usage?: unknown }).usage;
      const dir = process.env.AIRAIDER_LOG_DIR ?? join(process.cwd(), 'logs');
      mkdirSync(dir, { recursive: true });
      appendFileSync(
        join(dir, 'llm-calls.jsonl'),
        JSON.stringify({ ts: new Date().toISOString(), label: (opts.label ?? opts.model) + (attempt > 1 ? `:retry${attempt - 1}` : ''), model: opts.model, usage, system: opts.system, user: opts.user, response: content }) + '\n',
      );
    } catch { /* best-effort */ }
    try {
      return opts.schema.parse(JSON.parse(content));
    } catch (e) {
      if (attempt === 2) throw e;
      messages.push({ role: 'assistant', content });
      messages.push({ role: 'user', content: `Your previous JSON failed validation:\n${(e as Error).message.slice(0, 800)}\nReturn the corrected, COMPLETE JSON only — fix exactly those fields, keep everything else valid.` });
    }
  }
  throw new Error('callJson: unreachable');
}
