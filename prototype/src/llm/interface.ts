import type { Merc, ScenarioSlot, OutcomeBand } from '../types.js';

export interface ScenarioLLMRequest {
  scenarioTitle: string;
  scenarioTarget: string;
  archetype: string;
  party: Array<{ merc: Merc; assignedSlotId: string; fatigueAtStart?: number }>;
  slots: ScenarioSlot[];
  band: OutcomeBand;
  bandReason: string;
  /** M1: party-pair synergy info passed to the LLM for narrative hooks. */
  synergy?: {
    pairs: Array<{ mercA: string; mercB: string; sharedTagId: string }>;
    bonusCoins: number;
  };
  /** M5.3: chosen approach for a multi-approach scenario. */
  approach?: { id: string; label: string; summary: string; narrativeHint?: string };
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
