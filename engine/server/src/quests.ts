// PROTO-GUI v0.5: PursuedQuest model for the GUI's quest-assignment loop.
// Lives in a sidecar file (~/.airaider/gui-quests.json) so the additive
// fields don't touch the prototype's Roster schema or save format.
// Each quest holds an in-memory FixtureScenario + per-slot merc assignments
// + an expiry day. End Day resolves every fully-assigned quest via the LLM,
// drops expired ones, and ages the rest.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { FixtureScenario } from '../../../prototype/src/scenarios.js';
import type { Lead, LeadRarity } from '../../../prototype/src/leads.js';

export interface PursuedQuest {
  questId: string;
  scenario: FixtureScenario;
  /** Original lead so we can credit reward + flavor on resolution. */
  lead: {
    id: string;
    rarity: LeadRarity;
    archetype: string;
    region: string;
    blurb: string;
    dc: number;
    rewardGold: number;
  };
  /** PROTO-GAME v16: when set, this pursued quest is a chain step; on
   *  resolution dispatch advances chain[chainId].steps[stepIdx]. */
  chainStepRef?: { chainId: string; stepIdx: number; chainTitle: string };
  /** slotId → mercId (null/absent = unassigned). */
  assignments: Record<string, string | null>;
  pursuedOnDay: number;
  expiresOnDay: number;
}

export const QUESTS_PATH = process.env.AIRAIDER_QUESTS_PATH
  ?? join(homedir(), '.airaider', 'gui-quests.json');

interface QuestStore {
  pursued: PursuedQuest[];
  /** Last End-Day resolution batch, surfaced to the frontend then cleared. */
  lastResolutions: ResolutionRecord[];
}

export interface ResolutionRecord {
  questId: string;
  scenarioTitle: string;
  region: string;
  archetype: string;
  rarity: LeadRarity;
  rewardGold: number;
  band: string;
  bandReason: string;
  outcomeNarrative: string;
  contributions: Array<{ mercId: string; mercName: string; line: string }>;
  rollFaces: string[];
  heads: number;
  tails: number;
  coinsActual: number;
  goldAwarded: number;
  casualties: Array<{ mercId: string; mercName: string; damage: number; reason: string }>;
  outcomeKind: 'success' | 'partial' | 'failure';
}

let cached: QuestStore | null = null;

export function getQuestStore(): QuestStore {
  if (cached) return cached;
  if (existsSync(QUESTS_PATH)) {
    try {
      cached = JSON.parse(readFileSync(QUESTS_PATH, 'utf8')) as QuestStore;
      cached.pursued ??= [];
      cached.lastResolutions ??= [];
      return cached;
    } catch {
      // fall through to fresh
    }
  }
  cached = { pursued: [], lastResolutions: [] };
  return cached;
}

export function saveQuestStore(): void {
  if (!cached) return;
  const dir = dirname(QUESTS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(QUESTS_PATH, JSON.stringify(cached, null, 2));
}

export function resetQuestStore(): void {
  cached = null;
}

/** Expiry per SIM_BIBLE: pursued quests live 2 in-game days. */
export const QUEST_EXPIRY_DAYS = 2;

export function quoteLead(lead: Lead): PursuedQuest['lead'] {
  return {
    id: lead.id,
    rarity: lead.rarity,
    archetype: lead.archetype,
    region: lead.region,
    blurb: lead.blurb,
    dc: lead.dc,
    rewardGold: lead.rewardGold,
  };
}
