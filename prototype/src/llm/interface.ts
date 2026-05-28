import type { Merc, ScenarioSlot, OutcomeBand } from '../types.js';

export interface ScenarioLLMRequest {
  scenarioTitle: string;
  scenarioTarget: string;
  archetype: string;
  party: Array<{ merc: Merc; assignedSlotId: string }>;
  slots: ScenarioSlot[];
  band: OutcomeBand;
  bandReason: string;
}

export interface ScenarioLLMNarration {
  /** One line per assigned merc, citing their tag/attribute identity. */
  contributions: Array<{ mercId: string; line: string }>;
  /** 2-3 sentence outcome that fits the resolved band. */
  outcomeNarrative: string;
}

export interface ScenarioLLM {
  readonly name: string;
  narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration>;
}
