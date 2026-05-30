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

Rules:
- The outcome band is GIVEN (catastrophic / unfavorable / favorable / catastrophic-favorable). You narrate WHY it happened in-fiction.
- Do NOT invent stats, dice rolls, new mechanics, or new characters.
- Tone: pragmatic, mortal, slightly bleak. Mercs are people, not heroes. No purple prose. No "destiny."
- Use each merc's NAME at least once. Lean on their TAGS (cautious, light-footed, etc.) and standout TRAITS (high INT, low STR) for colour — these are the only "stats" you may reference, and only by feel, never by number.
- If a merc has a backstory, you may anchor ONE small concrete detail from it (an object, a place, a habit). Never summarise the backstory verbatim.
- Length: 4-6 sentences, single paragraph. Show the moment, then the consequence.
- Output must be valid JSON: { "outcomeNarrative": "..." }`;

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
    this.model = cfg.model ?? 'gpt-4.1-nano';
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

    const userPrompt = `Job: "${req.scenarioTitle}" — ${req.scenarioTarget}.
${seasonLine}${approachLine}${factionLine}${synergyLine}
Party:
${partyBlock}

Outcome (ENGINE-DECIDED, you must narrate consistent with this):
- band: ${req.band} (${bandFlavor(req.band)})
- why: ${req.bandReason}

Narrate the moment. 4-6 sentences. Return JSON: { "outcomeNarrative": "..." }`;

    if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
      console.log(`[lean-llm:prompt] system:\n${SYSTEM_PROMPT}`);
      console.log(`[lean-llm:prompt] user:\n${userPrompt}`);
    }

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
    let parsed: unknown;
    try { parsed = JSON.parse(content); }
    catch (err) { throw new Error(`OpenAI returned non-JSON: ${(err as Error).message}\n${content}`); }
    const { outcomeNarrative } = NarrationSchema.parse(parsed);
    return { contributions: [], outcomeNarrative };
  }
}
