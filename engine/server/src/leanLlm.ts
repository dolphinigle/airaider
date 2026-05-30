// PROTO-GUI v0.5: leaner OpenAI scenario LLM tuned for playtest cost.
//
// Why a separate impl instead of reusing prototype/src/llm/openai.ts:
// - The prototype version dumps the entire ScenarioLLMRequest (raw merc
//   attribute numbers, slot ids, fatigueAtStart, bonded-id lists, etc.)
//   into the user message. Per playtest feedback those numeric fields
//   carry no narrative signal but burn tokens.
// - The prototype version also asks for one short contribution line per
//   merc PLUS a 2-3 sentence outcome. Per feedback, contribution lines
//   are noisy filler — a single richer outcome paragraph is better fuel.
//
// This impl:
// - Renders party + scenario as compact PROSE the model can read at a
//   glance (no JSON attribute soup).
// - Returns one richer outcomeNarrative (4-6 sentences) and zero
//   contribution lines (engine accepts an empty array — the GUI just
//   renders no per-merc bullets, which the operator prefers).
// - Same ScenarioLLM interface so it plugs into resolveScenario() with
//   no engine changes.

import OpenAI from 'openai';
import { z } from 'zod';
import { pushLLMLog } from './llmLog.js';
import type {
  ScenarioLLM,
  ScenarioLLMRequest,
  ScenarioLLMNarration,
} from '../../../prototype/src/llm/interface.js';

const NarrationSchema = z.object({
  outcomeNarrative: z.string(),
});

const SYSTEM_PROMPT = `You are the narration engine for a grimdark mercenary-fort game.
The ENGINE owns numbers and outcome; you own FLAVOR.

Voice: grimdark, terse, mortal, mud-and-blood. Low-medieval Europe (Germanic/Celtic/Slavic feel). No glory, no high-fantasy, no anachronisms (use bells, torches, watch-horns — not sirens, firearms, electricity).

What you have to work with:
- The outcome BAND is given (catastrophic / unfavorable / favorable / catastrophic-favorable). You narrate WHY it happened in-fiction. Unfavorable/catastrophic must actually hurt — a wound that will fester, a name burned, a body left behind.
- The LEAD HOOK tells you what the job actually is. Name the specific thing won, lost, or carried — never "the prize/the goods/the target".
- Use each merc's NAME at least once. Use their tags + standout attributes for colour (never quote numbers). If they have a backstory, you may anchor ONE small detail from it.
- Do NOT invent stats, dice rolls, new mechanics, or characters not in the party or blurb.

Include at least one sensory detail (smell/sound/weight/temperature/injury) and one proper noun beyond merc names (a place, person, object, faction).

LENGTH: 4-6 sentences, single paragraph. Show the moment, then the consequence.
Output: { "outcomeNarrative": "..." }`;

function attrDescriptor(value: number): string | null {
  // Attribute scale is 0-5 (5 = peerless). Only surface the extremes —
  // mid-range values carry no narrative signal.
  if (value >= 5) return 'peerless';
  if (value >= 4) return 'high';
  if (value <= 1) return 'low';
  return null;
}

function mercLine(p: ScenarioLLMRequest['party'][number]): string {
  const { merc, tier, fatigueAtStart, recentlyLostBondPartner } = p;
  const parts: string[] = [merc.name];
  const standoutAttrs = (Object.entries(merc.attrs) as Array<[string, number]>)
    .map(([k, v]) => {
      const d = attrDescriptor(v);
      return d ? `${d} ${k.toUpperCase()}` : null;
    })
    .filter((s): s is string => !!s);
  if (standoutAttrs.length > 0) parts.push(standoutAttrs.join(', '));
  // Flat tag list — gender, traits, veterancy all together. Cheapest +
  // easiest format for the model to read.
  const flatTags: string[] = merc.tags.map((t) => t.label);
  if (tier && tier !== 'rookie') flatTags.push(tier);
  if (flatTags.length > 0) parts.push(flatTags.join(', '));
  if (fatigueAtStart && fatigueAtStart >= 2) parts.push(`worn (fatigue)`);
  if (recentlyLostBondPartner) parts.push(`grieving ${recentlyLostBondPartner}`);
  let line = parts.join('. ');
  if (merc.backstory) line += `\n  backstory: ${merc.backstory}`;
  return `- ${line}`;
}

function bandFlavor(band: ScenarioLLMRequest['band']): string {
  switch (band) {
    case 'catastrophic-favorable': return 'a triumph past hope (more than they came for)';
    case 'favorable': return 'a clean win';
    case 'unfavorable': return 'they got SOME of what they came for, but at a cost';
    case 'catastrophic': return 'a disaster — the job is lost';
  }
}

export interface LeanOpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  callLimit?: number;
}

export class LeanOpenAIScenarioLLM implements ScenarioLLM {
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private callLimit: number;
  private callCount = 0;

  constructor(cfg: LeanOpenAIConfig) {
    if (!cfg.apiKey) throw new Error('LeanOpenAIScenarioLLM requires apiKey');
    this.client = new OpenAI({ apiKey: cfg.apiKey });
    this.model = cfg.model ?? 'gpt-4o-mini';
    this.maxTokens = cfg.maxTokens ?? 500;
    this.temperature = cfg.temperature ?? 0.8;
    this.callLimit = cfg.callLimit ?? 50;
    this.name = `lean-openai:${this.model}`;
  }

  async narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration> {
    if (this.callCount >= this.callLimit) {
      throw new Error(`LeanOpenAIScenarioLLM call-limit ${this.callLimit} reached`);
    }
    this.callCount++;

    const partyBlock = req.party.map(mercLine).join('\n');
    const seasonLine = req.season ? `Season: ${req.season}.\n` : '';
    const approachLine = req.approach ? `Approach chosen: ${req.approach.label} — ${req.approach.summary}.\n` : '';
    const factionLine = req.factionContext && req.factionContext.length > 0
      ? `Factions: ${req.factionContext.map((f) => `${f.factionId}${f.standingTier ? ` (${f.standingTier})` : ''}`).join(', ')}.\n`
      : '';
    const synergyLine = req.synergy && req.synergy.pairs.length > 0
      ? `Bonded pairs in party: ${req.synergy.pairs.map((p) => `${p.mercA}+${p.mercB}`).join(', ')}.\n`
      : '';
    const leadHookLine = req.leadHook
      ? `LEAD HOOK — the actual job, in the patron's words:\n  "${req.leadHook.blurb}" (${req.leadHook.archetype} job near ${req.leadHook.region}, ${req.leadHook.rarity})\nYou MUST name the specific thing/person/place from this blurb in the outcome. Don't say "the prize" — say what it actually is.\n\n`
      : '';

    const userPrompt = `Job: "${req.scenarioTitle}" — ${req.scenarioTarget}.
${seasonLine}${approachLine}${factionLine}${synergyLine}${leadHookLine}Party:
${partyBlock}

Outcome (ENGINE-DECIDED, you must narrate consistent with this):
- band: ${req.band} (${bandFlavor(req.band)})
- why: ${req.bandReason}

Narrate the moment. 4-6 sentences. Name the specific stakes from the lead hook. Return JSON: { "outcomeNarrative": "..." }`;

    if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
      console.log(`[lean-llm:prompt] system:\n${SYSTEM_PROMPT}`);
      console.log(`[lean-llm:prompt] user:\n${userPrompt}`);
    }

    const startedAt = Date.now();
    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lean_scenario_narration',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { outcomeNarrative: { type: 'string' } },
            required: ['outcomeNarrative'],
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned no content');
    pushLLMLog({
      ts: Date.now(),
      kind: 'narrate',
      model: this.model,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      response: content,
      label: `${req.archetype}/${req.leadHook?.rarity ?? '?'}/${req.leadHook?.region ?? '?'} · ${req.band}`,
      elapsedMs: Date.now() - startedAt,
      promptTokens: resp.usage?.prompt_tokens,
      completionTokens: resp.usage?.completion_tokens,
      cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    });
    let parsed: unknown;
    try { parsed = JSON.parse(content); }
    catch (err) { throw new Error(`OpenAI returned non-JSON: ${(err as Error).message}\n${content}`); }
    const { outcomeNarrative } = NarrationSchema.parse(parsed);
    return { contributions: [], outcomeNarrative };
  }
}

// ---------------------------------------------------------------------------
// Stage E: AI-flavored captive spawn.
//
// Engine decides notoriety + tags. AI decides name + archetype + backstory,
// keeping it consistent with the lead's blurb so a "deserter in the marsh"
// produces a captive that reads as a deserter, not a Star-Crowned dragon-slayer.
// ---------------------------------------------------------------------------

const CAPTIVE_FLAVOR_SYSTEM = `You are the flavor engine for a grimdark mercenary-fort game.
The ENGINE has rolled a captive's notoriety + tags. You return a name + archetype + 1-2 sentence backstory that reads as a believable consequence of the LEAD the player pursued.

Voice: grimdark, terse, pan-european low-medieval (Germanic/Celtic/Slavic). No grand destiny, no magic unless tags say so.

Rules:
- Archetype follows the lead's blurb. "deserter in the marsh" → 'deserter'; "courier" → 'courier'. Don't invent a 'Lost Heir' if the blurb says 'deserter'.
- Name: 1 first name + optional epithet/clan ("Marek of the Fen"). Match cultural register.
- Backstory: 1-2 sentences. Let the tags shape the detail ("the bog still on him; flinches at lanterns").

Output: { "name": "...", "archetype": "...", "backstory": "..." }`;

const CaptiveFlavorSchema = z.object({
  name: z.string().min(1),
  archetype: z.string().min(1),
  backstory: z.string().min(1),
});

export interface CaptiveFlavorInput {
  leadBlurb: string;
  leadArchetype: string;
  leadRegion: string;
  leadRarity: string;
  notoriety: number;
  tagLabels: readonly string[];
}

export interface CaptiveFlavorOutput {
  name: string;
  archetype: string;
  backstory: string;
}

export async function flavorCaptive(
  apiKey: string,
  model: string,
  input: CaptiveFlavorInput,
): Promise<CaptiveFlavorOutput> {
  const client = new OpenAI({ apiKey });
  const userPrompt = `Lead pursued: "${input.leadBlurb}"
Lead archetype: ${input.leadArchetype}  region: ${input.leadRegion}  rarity: ${input.leadRarity}
Captive (engine-decided): notoriety ${input.notoriety}, tags [${input.tagLabels.join(', ')}]

Return JSON: { "name": "...", "archetype": "...", "backstory": "..." }`;

  if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
    console.log(`[lean-llm:captive-flavor] user:\n${userPrompt}`);
  }

  const startedAt = Date.now();
  const resp = await client.chat.completions.create({
    model,
    max_tokens: 300,
    temperature: 0.9,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'captive_flavor',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            archetype: { type: 'string' },
            backstory: { type: 'string' },
          },
          required: ['name', 'archetype', 'backstory'],
        },
      },
    },
    messages: [
      { role: 'system', content: CAPTIVE_FLAVOR_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });
  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no content for captive flavor');
  pushLLMLog({
    ts: Date.now(),
    kind: 'captive-flavor',
    model,
    systemPrompt: CAPTIVE_FLAVOR_SYSTEM,
    userPrompt,
    response: content,
    label: `${input.leadArchetype}/${input.leadRegion} (notoriety ${input.notoriety})`,
    elapsedMs: Date.now() - startedAt,
    promptTokens: resp.usage?.prompt_tokens,
    completionTokens: resp.usage?.completion_tokens,
    cachedPromptTokens: resp.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  });
  const parsed = CaptiveFlavorSchema.parse(JSON.parse(content));
  if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
    console.log(`[lean-llm:captive-flavor] ← ${parsed.name} (${parsed.archetype}): ${parsed.backstory}`);
  }
  return parsed;
}
