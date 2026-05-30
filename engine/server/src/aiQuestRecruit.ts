// AI-driven recruit generation from a successful quest outcome.
//
// Mirrors aiLeadGen / flavorCaptive principle: engine owns numbers (attrs,
// tag count/rarity), AI owns flavor (name, backstory, tag picks) — and the
// flavor is derived from the OUTCOME STORY so the recruit reads as a
// consequence of what happened ("you found Borrek bleeding under a cart
// after the raid; he asks for a place by your fire").

import OpenAI from 'openai';
import { z } from 'zod';
import { pushLLMLog } from './llmLog.js';
import { VOCAB_BLOCK } from './promptVocab.js';
import {
  PLAN_BY_LEAD_RARITY,
  resolveCaptiveTagsAI,
} from '../../../prototype/src/captiveTags.js';
import type { Merc, Tag, AttributeBlock, Attribute } from '../../../prototype/src/types.js';
import { ATTRIBUTES } from '../../../prototype/src/types.js';
import { rngFromString } from '../../../prototype/src/rng.js';

function clampAttr(n: number): number {
  return Math.max(1, Math.min(7, Math.round(n)));
}

const QUEST_RECRUIT_SYSTEM = `You generate a new mercenary recruit who emerged from a just-resolved quest in a grimdark mercenary-fort game.

You return:
- name (1 first name + optional epithet/clan, pan-european low-medieval register; match the gender tagId if any)
- archetype (one word: 'sellsword', 'hunter', 'former-soldier', 'cutpurse', 'fenfolk', etc.)
- backstory (2-3 sentences, grimdark, terse, references the OUTCOME STORY — why did this person end up walking back with the party?)
- tagIds (pick from VOCAB below; MUST be IDs that exist in VOCAB; pick ones that match the OUTCOME STORY and the recruit's role)

Voice: grimdark, terse, pan-european low-medieval (Germanic/Celtic/Slavic). No grand destiny, no magic unless tags say so.

TAGID RULES — READ CAREFULLY:
- Every tagId MUST start with the EXACT category prefix shown in VOCAB. Common confusions:
  * "cynical/stoic/loyal/charming/greedy/proud/zealous/honorable/ruthless/melancholic/vengeful/kind/cowardly/superstitious/suspicious" → pers:* (NOT temp:*)
  * "brave/cautious/reckless/hot-tempered/nervous/patient/methodical" → temp:* (NOT pers:*)
- Never invent IDs not in VOCAB. Copy them character-for-character.

RARITY BUDGET — CRITICAL:
- The engine tells you the rarity budget (e.g. "common + uncommon + rare"). You MUST include AT LEAST ONE tagId of EACH rarity tier listed in that budget that fits the story.
- If budget says "common + rare + legendary" you MUST pick at least one common, one rare, AND one legendary tagId — all consistent with the outcome story.
- Pick 6-10 total tagIds. Cover background + temperament + personality + physical + race + gender. Engine narrows to the budget.

STORY CONSISTENCY:
- The recruit must FIT the OUTCOME STORY. If the story is a raid on bandits, the recruit might be a survivor who joined the party; if a recovery in a chapel, perhaps a young priest. The recruit's tags + archetype + backstory all match what happened.

${VOCAB_BLOCK}

Output: { "name": "...", "archetype": "...", "backstory": "...", "tagIds": ["...", "..."] }`;

const QuestRecruitSchema = z.object({
  name: z.string().min(1),
  archetype: z.string().min(1),
  backstory: z.string().min(1),
  tagIds: z.array(z.string()).default([]),
});

export interface QuestRecruitInput {
  leadBlurb: string;
  leadArchetype: string;
  leadRegion: string;
  leadRarity: string;
  outcomeNarrative: string;
  /** Stable seed (e.g. lead id) for deterministic engine attr rolls. */
  seed: string;
  /** Existing roster names so AI doesn't duplicate. */
  existingNames: readonly string[];
}

interface AIFlavor {
  name: string;
  archetype: string;
  backstory: string;
  tagIds: string[];
}

async function callAI(input: QuestRecruitInput): Promise<AIFlavor | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini';
  const plan = PLAN_BY_LEAD_RARITY[input.leadRarity] ?? PLAN_BY_LEAD_RARITY.common!;
  const userPrompt = `Lead pursued: "${input.leadBlurb}"
Lead archetype: ${input.leadArchetype}  region: ${input.leadRegion}  rarity: ${input.leadRarity}
Engine tag budget: ${plan.join(' + ')}
Existing roster names (DO NOT REUSE any of these — pick a DISTINCT first name): [${input.existingNames.join(', ')}]

OUTCOME STORY (what just happened — drive your tagIds + archetype + backstory from this):
${input.outcomeNarrative}

Return JSON: { "name": "...", "archetype": "...", "backstory": "...", "tagIds": ["...", "..."] }
The tagIds you return must exist in VOCAB. Pick 6-10 that fit the OUTCOME STORY; engine will narrow to budget.
NAME RULE — TWO PARTS:
1. If the OUTCOME STORY names the person who joins (e.g. "a young woman in a torn priest's robe named Elena asked to come with them"), use THAT EXACT name. The recruit on the roster should match the name the player just read.
2. Only if the story does NOT name the recruit, invent one that is DIFFERENT from every Existing roster name above.`;

  const startedAt = Date.now();
  try {
    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model,
      temperature: 0.9,
      max_tokens: 400,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'quest_recruit',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              archetype: { type: 'string' },
              backstory: { type: 'string' },
              tagIds: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'archetype', 'backstory', 'tagIds'],
          },
        },
      },
      messages: [
        { role: 'system', content: QUEST_RECRUIT_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = resp.choices[0]?.message?.content ?? '{}';
    pushLLMLog({
      ts: Date.now(),
      kind: 'quest-recruit',
      model,
      systemPrompt: QUEST_RECRUIT_SYSTEM,
      userPrompt,
      response: content,
      label: `${input.leadArchetype}/${input.leadRegion}/${input.leadRarity}`,
      elapsedMs: Date.now() - startedAt,
      promptTokens: resp.usage?.prompt_tokens,
      completionTokens: resp.usage?.completion_tokens,
      cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    });
    return QuestRecruitSchema.parse(JSON.parse(content));
  } catch (err) {
    console.warn(`[quest-recruit] AI flavor failed: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Build a fresh recruit Merc from a quest outcome. Engine rolls attrs (random
 * 16-sum); AI flavors name + tagIds from the story; engine resolves final
 * tags via captive-tag plan (same rarity envelope), applies attrBias.
 *
 * Falls back to a procedural recruit if no API key or AI fails.
 */
export async function generateQuestRecruit(
  input: QuestRecruitInput,
  tagPool: Map<string, Tag>,
): Promise<Merc> {
  const flavor = await callAI(input);
  const rng = rngFromString(`quest-recruit-attrs-${input.seed}`);

  // Engine: roll attrs (mirror generator.ts pattern, baseSum 16, clamped 1..7).
  const attrs: Record<Attribute, number> = {
    physical: 0, agility: 0, intelligence: 0, charisma: 0, willpower: 0,
  };
  for (const a of ATTRIBUTES) attrs[a] = 2 + Math.floor(rng() * 3); // 2..4
  const targetExtra = Math.max(0, 16 - ATTRIBUTES.reduce((s, a) => s + attrs[a], 0));
  for (let i = 0; i < targetExtra; i++) {
    const a = ATTRIBUTES[Math.floor(rng() * ATTRIBUTES.length)]!;
    attrs[a] += 1;
  }

  // Engine: resolve final tags (AI picks + plan fallback).
  const tags = resolveCaptiveTagsAI(
    flavor?.tagIds ?? [],
    tagPool,
    input.leadRarity,
    input.seed,
  );
  // Apply tag attrBias.
  for (const t of tags) {
    if (!t.attrBias) continue;
    for (const a of ATTRIBUTES) {
      if (t.attrBias[a]) attrs[a] += t.attrBias[a]!;
    }
  }
  const clamped: AttributeBlock = {
    physical: clampAttr(attrs.physical) as AttributeBlock['physical'],
    agility: clampAttr(attrs.agility) as AttributeBlock['agility'],
    intelligence: clampAttr(attrs.intelligence) as AttributeBlock['intelligence'],
    charisma: clampAttr(attrs.charisma) as AttributeBlock['charisma'],
    willpower: clampAttr(attrs.willpower) as AttributeBlock['willpower'],
  };

  // Hard collision guard: if AI returned a name whose first word matches an
  // existing roster member, fall back to a deterministic distinct name. AI
  // sometimes ignores the existingNames rule when stories rhyme.
  const existingFirsts = new Set(
    input.existingNames.map((n) => n.split(/\s+/)[0]?.toLowerCase()).filter(Boolean),
  );
  let finalName = flavor?.name ?? `Wanderer of ${input.leadRegion}`;
  const firstWord = finalName.split(/\s+/)[0]?.toLowerCase();
  if (firstWord && existingFirsts.has(firstWord)) {
    const fallbackPool = [
      'Borrek', 'Aldric', 'Cyran', 'Doran', 'Edvin', 'Frelda', 'Gunnar',
      'Hartwin', 'Ilse', 'Jorund', 'Kettil', 'Lothar', 'Mira', 'Nessa',
      'Orin', 'Petra', 'Quill', 'Rangar', 'Sable', 'Toren', 'Una', 'Vesna',
      'Wilf', 'Yara', 'Zane',
    ];
    const epithet = finalName.split(/\s+/).slice(1).join(' ');
    const free = fallbackPool.filter((n) => !existingFirsts.has(n.toLowerCase()));
    const picked = free[Math.floor(rng() * free.length)] ?? `${firstWord} of ${input.leadRegion}`;
    finalName = epithet ? `${picked} ${epithet}` : picked;
  }

  return {
    id: `recruit-${input.seed}`,
    name: finalName,
    attrs: clamped,
    tags,
    veterancy: 0,
    wage: 1,
    hp: 3,
    backstory: flavor?.backstory ?? input.outcomeNarrative.slice(0, 200),
  };
}
