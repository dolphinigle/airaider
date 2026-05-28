import type { Merc, ScenarioSlot, OutcomeBand } from '../types.js';

export interface ScenarioLLMRequest {
  scenarioTitle: string;
  scenarioTarget: string;
  archetype: string;
  party: Array<{
    merc: Merc;
    assignedSlotId: string;
    fatigueAtStart?: number;
    /**
     * M7.11: veterancy tier label ('rookie' | 'veteran' | 'grizzled') passed
     * to the narrator so prose can lean on the merc's experience. Optional —
     * omitted from roster-less scenario runs.
     */
    tier?: 'rookie' | 'veteran' | 'grizzled';
    /**
     * M7.11: ids of other party members this merc is bonded with. Lets the
     * narrator give bonded duos shared beats ("they moved as one"). Empty
     * array when no bonds in-party.
     */
    bondedPartyMercIds?: string[];
  }>;
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
  /** M5.5: factions involved in this scenario and the roster's current standing. */
  factionContext?: Array<{
    factionId: string;
    summary?: string;
    currentStanding: number;
    /** M8.1: tier label derived from currentStanding for narrator color. */
    standingTier?: 'ally' | 'friendly' | 'neutral' | 'hostile' | 'enemy';
  }>;
  /** M6.3: in-game season ('thaw' | 'high' | 'wane' | 'frost'). */
  season?: 'thaw' | 'high' | 'wane' | 'frost';
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
