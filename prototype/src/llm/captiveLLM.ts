// LLM layer for captive dispositions. Separate from ScenarioLLM because the
// schema (one outcome narrative + an optional last-words line) differs.

import OpenAI from 'openai';
import { z } from 'zod';
import type { Captive, CaptiveAction, CaptiveEffect } from '../captive.js';

export interface CaptiveLLMRequest {
  captive: Captive;
  action: CaptiveAction;
  effect: CaptiveEffect;
  /** Fort context — name, dominant reputation, party who took the captive. */
  fortName: string;
  partyNames: string[];
}

export interface CaptiveLLMNarration {
  /** 2-4 sentence outcome narrative grounded in the action + captive identity. */
  outcomeNarrative: string;
  /** Captive's reported last reaction — a single line. */
  captiveLine: string;
}

export interface CaptiveLLM {
  readonly name: string;
  narrate(req: CaptiveLLMRequest): Promise<CaptiveLLMNarration>;
}

// --- Mock ------------------------------------------------------------------

export class MockCaptiveLLM implements CaptiveLLM {
  readonly name = 'mock-captive';
  async narrate(req: CaptiveLLMRequest): Promise<CaptiveLLMNarration> {
    const { captive, action, effect } = req;
    return {
      outcomeNarrative: mockOutcome(captive, action, effect),
      captiveLine: mockLine(captive, action),
    };
  }
}

function mockOutcome(c: Captive, action: CaptiveAction, e: CaptiveEffect): string {
  const gold = e.goldDelta > 0 ? ` +${e.goldDelta}g.` : '';
  switch (action) {
    case 'ransom':   return `[mock] ${c.name}'s people pay.${gold} The fort is known as a paying market.`;
    case 'sell':     return `[mock] You sell ${c.name} to a passing slaver.${gold} No one in the yard meets your eye.`;
    case 'display':  return `[mock] ${c.name} hangs in a cage at the gate. The next caravan asks fewer questions.`;
    case 'recruit':  return `[mock] ${c.name} takes the oath. Loyalty: thin.`;
    case 'execute':  return `[mock] You execute ${c.name} at first light. The crows arrive on schedule.`;
  }
}

function mockLine(c: Captive, action: CaptiveAction): string {
  switch (action) {
    case 'ransom':   return `[mock] "${c.name}: 'My uncle will hear of this courtesy.'"`;
    case 'sell':     return `[mock] "${c.name} says nothing as the chain changes hands."`;
    case 'display':  return `[mock] "${c.name}: 'You'll regret leaving me up here in the wind.'"`;
    case 'recruit':  return `[mock] "${c.name}: 'I take the coin. I keep one eye on the door.'"`;
    case 'execute':  return `[mock] "${c.name} does not beg. That is something."`;
  }
}

// --- OpenAI ----------------------------------------------------------------

const NarrationSchema = z.object({
  outcomeNarrative: z.string(),
  captiveLine: z.string(),
});

const SYSTEM_PROMPT = `You are the narration engine for a grimdark mercenary-fort game.
The ENGINE owns numbers and disposition outcome; you own FLAVOR.

Rules:
- Do NOT invent stats, new mechanics, or alternative dispositions.
- The chosen action is GIVEN; you narrate what happens IN-FICTION.
- Each action MUST feel different:
  * ransom — mercantile, faintly shameful, paperwork
  * sell — bleak commerce; the fort earns 'ruthless' name
  * display — public spectacle, deterrence, ugly
  * recruit — pragmatic; the captive's compliance is shallow
  * execute — quick, lawful-looking; nobody celebrates
- Reference the captive by name and at least one fact from their backstory or tags.
- Tone: pragmatic, mortal, slightly bleak. No purple prose, no destiny.
- Output must be valid JSON matching the schema. captiveLine is a single quoted line.`;

export interface OpenAICaptiveConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  callLimit?: number;
}

export class OpenAICaptiveLLM implements CaptiveLLM {
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private callLimit: number;
  private callCount = 0;

  constructor(cfg: OpenAICaptiveConfig) {
    if (!cfg.apiKey) throw new Error('OpenAICaptiveLLM requires apiKey');
    this.client = new OpenAI({ apiKey: cfg.apiKey });
    this.model = cfg.model ?? 'gpt-4.1-nano';
    this.maxTokens = cfg.maxTokens ?? 500;
    this.temperature = cfg.temperature ?? 0.7;
    this.callLimit = cfg.callLimit ?? 10;
    this.name = `openai-captive:${this.model}`;
  }

  async narrate(req: CaptiveLLMRequest): Promise<CaptiveLLMNarration> {
    if (this.callCount >= this.callLimit) {
      throw new Error(`OpenAICaptiveLLM call-limit ${this.callLimit} reached.`);
    }
    this.callCount++;

    const userPayload = {
      captive: {
        name: req.captive.name,
        archetype: req.captive.archetype,
        backstory: req.captive.backstory,
        notoriety: req.captive.notoriety,
        tags: req.captive.tags.map((t) => ({ id: t.id, label: t.label })),
      },
      action: req.action,
      effect: {
        goldDelta: req.effect.goldDelta,
        reputationGain: req.effect.reputationGain,
        captiveRemoved: req.effect.captiveRemoved,
        recruited: !!req.effect.recruitedAs,
      },
      fort: { name: req.fortName, partyNames: req.partyNames },
    };

    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'captive_narration',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              outcomeNarrative: { type: 'string' },
              captiveLine: { type: 'string' },
            },
            required: ['outcomeNarrative', 'captiveLine'],
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
    return NarrationSchema.parse(JSON.parse(content));
  }
}
