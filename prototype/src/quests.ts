// M5.2 — multi-day quest arcs.
//
// A quest is a small chain of scenarios linked by a narrative thread.
// Quests live in data/quests.json (read-only catalog) and are tracked
// on the roster as `activeQuests` / `completedQuests` arrays.
//
// Trigger model: a quest is "stirred" when at least one merc on the
// roster carries the quest's `seededByTag` (typically a legendary tag).
// Once stirred, it appears in `activeQuests` at stage 0. Running the
// scenario whose id matches the active stage advances or completes it.

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Roster } from './roster.js';
import type { Merc } from './types.js';

const QuestStageSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  summary: z.string(),
});

const QuestSchema = z.object({
  id: z.string(),
  name: z.string(),
  seededByTag: z.string().optional(),
  /** M13.1: alternative seeding mechanism — quest stirs automatically when
   *  the roster has the named faction at enemy tier (reputation ≤ −5). */
  seededByEnemyFaction: z.string().optional(),
  summary: z.string(),
  stages: z.array(QuestStageSchema).min(1),
  rewardOnComplete: z.object({
    goldDelta: z.number().int(),
    reputationGain: z.string(),
  }),
});

export type Quest = z.infer<typeof QuestSchema>;
export type QuestStage = z.infer<typeof QuestStageSchema>;

export function loadQuests(path: string): Map<string, Quest> {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const arr = z.array(QuestSchema).parse(raw);
  const m = new Map<string, Quest>();
  for (const q of arr) m.set(q.id, q);
  return m;
}

/** Find quests that should fire ("stir") given the roster's current mercs. */
export function findStirrableQuests(
  roster: Roster,
  catalog: Map<string, Quest>,
): Quest[] {
  const active = new Set(roster.activeQuests.map((q) => q.questId));
  const completed = new Set(roster.completedQuests.map((q) => q.questId));
  const carriedTags = new Set<string>();
  for (const m of roster.mercs) for (const t of m.tags) carriedTags.add(t.id);

  const out: Quest[] = [];
  for (const q of catalog.values()) {
    if (active.has(q.id) || completed.has(q.id)) continue;
    if (q.seededByTag && carriedTags.has(q.seededByTag)) out.push(q);
  }
  return out;
}

/**
 * M13.1: find quests that should auto-stir because at least one faction the
 * quest names via `seededByEnemyFaction` has reached enemy tier on this
 * roster. Skips quests already active or completed.
 */
export function findEnemyFactionStirrableQuests(
  roster: Roster,
  catalog: Map<string, Quest>,
  enemyFactions: Iterable<string>,
): Quest[] {
  const enemies = new Set<string>(enemyFactions);
  if (enemies.size === 0) return [];
  const active = new Set(roster.activeQuests.map((q) => q.questId));
  const completed = new Set(roster.completedQuests.map((q) => q.questId));
  const out: Quest[] = [];
  for (const q of catalog.values()) {
    if (active.has(q.id) || completed.has(q.id)) continue;
    if (q.seededByEnemyFaction && enemies.has(q.seededByEnemyFaction)) out.push(q);
  }
  return out;
}

/** Returns the merc id that triggered the quest (first carrier of the tag). */
export function carrierOf(roster: Roster, tag: string): string | undefined {
  for (const m of roster.mercs) {
    if (m.tags.some((t) => t.id === tag)) return m.id;
  }
  return undefined;
}

/** Stir (activate) a quest at stage 0. Mutates the roster. */
export function stirQuest(roster: Roster, quest: Quest, seededBy: Merc | string | undefined): void {
  if (roster.activeQuests.some((q) => q.questId === quest.id)) return;
  if (roster.completedQuests.some((q) => q.questId === quest.id)) return;
  const mercId = typeof seededBy === 'string' ? seededBy : seededBy?.id;
  roster.activeQuests.push({
    questId: quest.id,
    stageIndex: 0,
    seededByMercId: mercId,
    stirredOnDay: roster.dayCount,
  });
}

/**
 * Inspect a resolved scenario id against the roster's active quests.
 * If it matches the active stage, advance — possibly completing.
 * Returns { advanced: [{questId, fromStage, toStage}], completed: [{questId}] }.
 */
export function advanceQuestsForScenario(
  roster: Roster,
  scenarioId: string,
  catalog: Map<string, Quest>,
): {
  advanced: Array<{ questId: string; fromStage: number; toStage: number }>;
  completed: Array<{ questId: string }>;
} {
  const advanced: Array<{ questId: string; fromStage: number; toStage: number }> = [];
  const completed: Array<{ questId: string }> = [];
  const still: typeof roster.activeQuests = [];
  for (const aq of roster.activeQuests) {
    const q = catalog.get(aq.questId);
    if (!q) {
      still.push(aq);
      continue;
    }
    const currentStage = q.stages[aq.stageIndex];
    if (!currentStage || currentStage.scenarioId !== scenarioId) {
      still.push(aq);
      continue;
    }
    const nextIndex = aq.stageIndex + 1;
    if (nextIndex >= q.stages.length) {
      completed.push({ questId: q.id });
      roster.completedQuests.push({ questId: q.id, dayCompleted: roster.dayCount });
      roster.gold += q.rewardOnComplete.goldDelta;
      roster.reputation[q.rewardOnComplete.reputationGain] =
        (roster.reputation[q.rewardOnComplete.reputationGain] ?? 0) + 1;
    } else {
      advanced.push({ questId: q.id, fromStage: aq.stageIndex, toStage: nextIndex });
      still.push({ ...aq, stageIndex: nextIndex });
    }
  }
  roster.activeQuests = still;
  return { advanced, completed };
}
