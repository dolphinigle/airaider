// Shared AI plumbing for storyGen (bible generator + quest-writer).
import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
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
  opts: { system: string; user: string; schema: z.ZodType<T>; model: string; effort: Effort; maxTokens?: number },
): Promise<T> {
  const res = await client.chat.completions.create({
    model: opts.model,
    messages: [{ role: 'system', content: opts.system }, { role: 'user', content: opts.user }],
    response_format: { type: 'json_object' },
    max_completion_tokens: opts.maxTokens ?? 8000,
    reasoning_effort: opts.effort,
  } as never);
  const content = (res as { choices: { message: { content: string } }[] }).choices[0]?.message.content ?? '';
  return opts.schema.parse(JSON.parse(content));
}
