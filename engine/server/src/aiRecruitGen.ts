// AI flavor for tavern recruits. Engine decides tags + stats; AI replaces
// the procedural name with a thematic one and writes a 1-2 sentence
// backstory tied to those tags.
//
// One API call per new recruit. Tavern refresh is weekly (small N).
// Gated on OPENAI_API_KEY. If absent or call fails, recruit keeps the
// procedural name and has no backstory.

import OpenAI from 'openai';
import { pushLLMLog } from './llmLog.js';
import type { Merc } from '../../../prototype/src/types.js';

const RECRUIT_FLAVOR_SYSTEM = `You write the name + backstory for a wandering mercenary who walks into a tavern looking for work, in a grimdark low-medieval fort game.
Voice: terse, mortal, mud-and-blood. Pan-european feel (Germanic/Celtic/Slavic).

The ENGINE has already decided this recruit's TAGS and STAT highlights. Your job is to give them a fitting name and a 1-2 sentence backstory that the tags would explain.

Rules:
- Name: 1 first name + optional epithet/clan ("Marek of the Fen", "Hilde Cold-Hand"). Match cultural register. Match the gender tag if present.
- Backstory: 1-2 sentences. Anchor on the tags concretely — if scarred, say where; if scholar, say what they studied; if greedy, say what they want. No grand destiny, no magic unless tags say so. No prophecy. No "chosen one".
- Output STRICT JSON: { "name": "...", "backstory": "..." }`;

interface FlavorOut { name: string; backstory: string }

let cachedClient: OpenAI | null = null;
function getClient(apiKey: string): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function describeStandoutAttrs(merc: Merc): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(merc.attrs)) {
    if (v >= 5) out.push(`high ${k.toUpperCase()}`);
    if (v <= 1) out.push(`low ${k.toUpperCase()}`);
  }
  return out.join(', ') || 'unremarkable stats';
}

/** Replace merc.name + add merc.backstory using AI. Silently no-ops on failure. */
export async function flavorRecruit(merc: Merc): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return;
  const model = process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini';

  const tagList = merc.tags.map((t) => `${t.id} (${t.label})`).join(', ');
  const userPrompt = `RECRUIT TAGS: ${tagList}
STAT HIGHLIGHTS: ${describeStandoutAttrs(merc)}
Procedural placeholder name (replace it): ${merc.name}

Return JSON: { "name": "...", "backstory": "..." }`;

  const startedAt = Date.now();
  try {
    const resp = await getClient(apiKey).chat.completions.create({
      model,
      temperature: 0.95,
      max_tokens: 250,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recruit_flavor',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              backstory: { type: 'string' },
            },
            required: ['name', 'backstory'],
          },
        },
      },
      messages: [
        { role: 'system', content: RECRUIT_FLAVOR_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = resp.choices[0]?.message?.content ?? '{}';
    pushLLMLog({
      ts: Date.now(),
      kind: 'recruit-flavor',
      model,
      systemPrompt: RECRUIT_FLAVOR_SYSTEM,
      userPrompt,
      response: content,
      label: tagList.slice(0, 60),
      elapsedMs: Date.now() - startedAt,
      promptTokens: resp.usage?.prompt_tokens,
      completionTokens: resp.usage?.completion_tokens,
      cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    });
    const parsed = JSON.parse(content) as FlavorOut;
    if (parsed.name && parsed.name.trim().length > 0) merc.name = parsed.name.trim();
    if (parsed.backstory && parsed.backstory.trim().length > 0) merc.backstory = parsed.backstory.trim();
  } catch (err) {
    console.error(`[ai-recruit-flavor] failed (keeping procedural name):`, (err as Error).message);
  }
}

/** Flavor every recruit in the list in parallel. */
export async function flavorRecruits(mercs: Merc[]): Promise<void> {
  if (mercs.length === 0) return;
  await Promise.all(mercs.map((m) => flavorRecruit(m)));
}
