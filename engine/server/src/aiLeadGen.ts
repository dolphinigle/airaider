// AI lead enrichment. Game owns numbers (rarity/archetype/region/dc/reward);
// AI fills the hook blurb. Batched: one API call per refresh (N leads).
//
// Gated on OPENAI_API_KEY. If absent or call fails, leaves template
// blurbs in place — game stays playable without API.

import OpenAI from 'openai';
import { pushLLMLog } from './llmLog.js';
import { VOCAB_BLOCK } from './promptVocab.js';
import type { Lead } from '../../../prototype/src/leads.js';

const LEAD_GEN_SYSTEM = `You are the lead-board writer for a grimdark mercenary-fort game.
Voice: terse, mortal, mud-and-blood, low-medieval, no glory, no high-fantasy. Names feel pan-european (Germanic/Celtic/Slavic).

The ENGINE has decided each lead's rarity/archetype/region/DC/reward. You write the HOOK only.
A hook is ONE specific sentence displayed on the lead board. It must:
- Name the specific thing on offer (a person, an object, a sum, a corpse, an heirloom, a vow). NEVER use generic placeholders like "the prize/the goods/the target/the spoils".
- Reference the region by name (or implicitly via a regional detail).
- Match archetype: raid=violent loot, recovery=fetch lost item, contract=protect/escort/quiet job, heist=stealth/lift, captive=take someone alive.
- Match rarity feel: common = mundane village stakes; uncommon = town/trade; rare = noble/abbey/cursed; legendary = mythic, historical, cursed bloodline.
- DO NOT use the words "common/uncommon/rare/legendary/mythic/epic/heroic/glorious/destined" in the hook itself — those are mechanical labels, not narrative words.
- Include one sensory detail OR concrete proper noun beyond the region.

EXAMPLES (study the *style* — invent fresh content, never reuse these names/objects):
- legendary/captive → "Take Aldric the Hollow alive — the prophet-touched heretic last seen preaching in the drowned chapel."
- common/heist → "Lift the tithe-box from the chapel before second bell — six silver shields, the priest counts every coin."
- rare/recovery → "Recover the bone-locked St. Hadric reliquary from the wreck — the abbess pays in old Imperial marks."
- uncommon/contract → "Escort the salt-trader Helga Vass through the moor by night; her last guard was found face-down in the heather."
- common/raid → "Burn the deserters' camp in the frost — eight men, mostly drunk, with a stolen mule and a chest of moldy bread."
IMPORTANT: Names like Aldric, St. Hadric, Helga Vass are EXAMPLES ONLY. Invent your own names and objects for each hook.

${VOCAB_BLOCK}`;

let cachedClient: OpenAI | null = null;
function getClient(apiKey: string): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

interface HookOut { leadId: string; hook: string }

/** Replace each lead's blurb in-place with an AI-written hook.
 *  Silently no-ops if no API key or on any failure. */
export async function enrichLeadBlurbs(leads: Lead[]): Promise<void> {
  if (leads.length === 0) return;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return;
  const model = process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini';

  const userPrompt =
    `Write a hook for each of these ${leads.length} leads. Return JSON: {"hooks":[{"leadId":"...","hook":"..."},...]}.\n\n` +
    leads.map((l) => `- ${l.id}: rarity=${l.rarity} archetype=${l.archetype} region="${l.region}" dc=${l.dc} reward=${l.rewardGold}g`).join('\n');

  const startedAt = Date.now();
  try {
    const resp = await getClient(apiKey).chat.completions.create({
      model,
      temperature: 0.9,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: LEAD_GEN_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = resp.choices[0]?.message?.content ?? '{}';
    pushLLMLog({
      ts: Date.now(),
      kind: 'lead-gen',
      model,
      systemPrompt: LEAD_GEN_SYSTEM,
      userPrompt,
      response: content,
      label: `${leads.length} leads`,
      elapsedMs: Date.now() - startedAt,
      promptTokens: resp.usage?.prompt_tokens,
      completionTokens: resp.usage?.completion_tokens,
      cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    });
    const parsed = JSON.parse(content) as { hooks?: HookOut[] };
    const byId = new Map((parsed.hooks ?? []).map((h) => [h.leadId, h.hook]));
    for (const l of leads) {
      const hook = byId.get(l.id);
      if (hook && hook.trim().length > 0) l.blurb = hook.trim();
    }
  } catch (err) {
    // Log to stderr only — leads keep template blurbs so the game still plays.
    console.error(`[ai-lead-gen] failed (using template blurbs):`, (err as Error).message);
  }
}
