import OpenAI from 'openai';
import { z } from 'zod';
import type { ScenarioLLM, ScenarioLLMRequest, ScenarioLLMNarration } from './interface.js';

const NarrationSchema = z.object({
  contributions: z.array(z.object({
    mercId: z.string(),
    line: z.string(),
  })),
  outcomeNarrative: z.string(),
});

const SYSTEM_PROMPT = `You are the narration engine for a grimdark mercenary-fort game.
The ENGINE owns numbers and outcome; you own FLAVOR.

Rules:
- Do NOT invent stats, dice rolls, or new mechanics.
- The outcome band is GIVEN; you narrate WHY it happened in-fiction.
- Reference each merc's name + at least one of their tags or attributes.
- Keep each contribution line to one tight sentence.
- Outcome narrative: 2-3 sentences max.
- Tone: pragmatic, mortal, slightly bleak. Mercs are people, not heroes.
- Reference \`fatigueAtStart\` when it is >= 2: the merc is visibly worn (the bruise from yesterday, dull reflexes, short patience).
- When a merc has a non-empty \`backstory\`, you may anchor their contribution line in ONE small concrete detail from it (an object, a place, a habit) — do not summarize the backstory verbatim.
- No purple prose. No "destiny." No omniscient narrator.
- Output must be valid JSON matching the provided schema.`;

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Per-instance call counter cap; prevents runaway spend in loops. */
  callLimit?: number;
}

export class OpenAIScenarioLLM implements ScenarioLLM {
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private callLimit: number;
  private callCount = 0;

  constructor(cfg: OpenAIConfig) {
    if (!cfg.apiKey) throw new Error('OpenAIScenarioLLM requires apiKey');
    this.client = new OpenAI({ apiKey: cfg.apiKey });
    this.model = cfg.model ?? 'gpt-4.1-nano';
    this.maxTokens = cfg.maxTokens ?? 800;
    this.temperature = cfg.temperature ?? 0.7;
    this.callLimit = cfg.callLimit ?? 5;
    this.name = `openai:${this.model}`;
  }

  async narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration> {
    if (this.callCount >= this.callLimit) {
      throw new Error(
        `OpenAIScenarioLLM call-limit ${this.callLimit} reached; pass callLimit higher to override.`,
      );
    }
    this.callCount++;

    const userPayload = {
      scenario: {
        title: req.scenarioTitle,
        target: req.scenarioTarget,
        archetype: req.archetype,
      },
      slots: req.slots.map((s) => ({
        id: s.id,
        description: s.description,
        preferredAttr: s.preferredAttr,
      })),
      party: req.party.map(({ merc, assignedSlotId, fatigueAtStart }) => ({
        id: merc.id,
        name: merc.name,
        assignedSlotId,
        fatigueAtStart: fatigueAtStart ?? 0,
        attrs: merc.attrs,
        backstory: merc.backstory ?? '',
        tags: merc.tags.map((t) => ({
          id: t.id,
          label: t.label,
          tier: t.tier,
          rarity: t.rarity,
        })),
      })),
      resolution: { band: req.band, reason: req.bandReason },
      synergy: req.synergy ?? { pairs: [], bonusCoins: 0 },
      approach: req.approach ?? null,
      factionContext: req.factionContext ?? [],
      season: req.season ?? null,
      instructions:
        'Produce a JSON object matching the schema. One contribution line per party merc, in the order given.' +
        (req.approach
          ? ` The player chose the "${req.approach.label}" approach (${req.approach.summary}). Let this colour every contribution line and the outcome narrative; refer to the approach by feel, not by name.`
          : '') +
        (req.factionContext && req.factionContext.length > 0
          ? ` The factions involved are: ${req.factionContext.map((f) => `${f.factionId} (current standing ${f.currentStanding}${f.summary ? '; ' + f.summary : ''})`).join('; ')}. Refer to them by name in the outcome and let prior standing colour reactions.`
          : '') +
        (req.season
          ? ` The season is "${req.season}" — work this into the atmosphere (thaw=mud and runoff, high=long hot days, wane=harvest and short tempers, frost=biting cold and short days).`
          : ''),
    };

    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'scenario_narration',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              contributions: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    mercId: { type: 'string' },
                    line: { type: 'string' },
                  },
                  required: ['mercId', 'line'],
                },
              },
              outcomeNarrative: { type: 'string' },
            },
            required: ['contributions', 'outcomeNarrative'],
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned no content');
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new Error(`OpenAI returned non-JSON content: ${(err as Error).message}\n${content}`);
    }
    return NarrationSchema.parse(parsed);
  }
}
