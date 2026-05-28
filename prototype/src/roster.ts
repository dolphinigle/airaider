// Roster persistence — the small bit of state that survives across days.
//
// CANONICAL §state: a roster is the fort's living crew plus runtime state.
// For the prototype we persist: merc identities (refs to data/mercs.json by
// id PLUS any generated/recruited mercs in full), per-merc fatigue and hp,
// veterancy, captives currently held, gold, reputation counters, and day#.

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { z } from 'zod';
import type { Merc, Tag } from './types.js';
import type { Captive, CaptiveEffect } from './captive.js';

const AttrBlockSchema = z.object({
  physical: z.number().int().min(1).max(7),
  agility: z.number().int().min(1).max(7),
  intelligence: z.number().int().min(1).max(7),
  charisma: z.number().int().min(1).max(7),
  willpower: z.number().int().min(1).max(7),
});

const MercStateSchema = z.object({
  id: z.string(),
  fatigue: z.number().int().min(0).default(0),
  hpDamage: z.number().int().min(0).default(0),
  veterancyGain: z.number().int().min(0).default(0),
  /** M6.1: lifetime xp earned across scenarios + errand returns. v5+. */
  xp: z.number().int().min(0).default(0),
  /** M6.1: derived from xp, persisted for convenience. v5+. */
  tier: z.enum(['rookie', 'veteran', 'grizzled']).default('rookie'),
  /** M6.2: co-deployment counters keyed by partner merc id. v6+. */
  coDeployments: z.record(z.string(), z.number().int().min(0)).default({}),
  /** M9.8: name of a bonded partner this merc lost (most recent only),
   *  passed to the LLM as a `recentlyLostBondPartner` flavor hint. Cleared
   *  automatically `BOND_GRIEF_HINT_WINDOW_DAYS` days after `recentGriefDay`. */
  recentGriefPartner: z.string().optional(),
  recentGriefDay: z.number().int().min(0).optional(),
});

const GeneratedMercSchema = z.object({
  id: z.string(),
  name: z.string(),
  attrs: AttrBlockSchema,
  tagIds: z.array(z.string()),
  veterancy: z.number().int().min(0).max(5).default(0),
  wage: z.number().int().min(0).default(1),
  hp: z.number().int().min(0).max(3).default(3),
});

const CaptiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: z.string(),
  backstory: z.string(),
  notoriety: z.number().int().min(1).max(5),
  tagIds: z.array(z.string()),
});

/** M10.1: persisted form of a tavern hire-pool entry. v10+. M10.4: optional veteran starter (v11+). */
const HirePoolEntrySchema = z.object({
  merc: GeneratedMercSchema,
  price: z.number().int().min(0),
  postedDay: z.number().int().min(0),
  /** M10.4: optional starting tier for veteran/grizzled bench arrivals. */
  startingTier: z.enum(['rookie', 'veteran', 'grizzled']).optional(),
  /** M10.4: optional starting xp paired with startingTier. */
  startingXp: z.number().int().min(0).optional(),
});

const DeceasedSchema = z.object({
  id: z.string(),
  name: z.string(),
  dayDied: z.number().int().min(0),
  reason: z.string(),
});

const ActiveQuestSchema = z.object({
  questId: z.string(),
  stageIndex: z.number().int().min(0),
  seededByMercId: z.string().optional(),
  stirredOnDay: z.number().int().min(0),
});

const CompletedQuestSchema = z.object({
  questId: z.string(),
  dayCompleted: z.number().int().min(0),
});

const PendingErrandSchema = z.object({
  /** Unique id of this dispatched errand instance (scenarioId + dispatchedOnDay). */
  errandId: z.string().min(1),
  scenarioId: z.string().min(1),
  /** Path to the scenario fixture, relative to the day file's fixtures dir, or absolute. */
  scenarioPath: z.string().min(1),
  /** Mercs sent on the errand (locked out of other duty). */
  partyMercIds: z.array(z.string().min(1)).min(1),
  /** Day the errand was dispatched. */
  dispatchedOnDay: z.number().int().min(0),
  /** Day on which the errand resolves (return + outcome). */
  returnsOnDay: z.number().int().min(0),
  /** Seed for the scenario RNG; locked at dispatch so the outcome is deterministic. */
  seedSource: z.string().min(1),
});

const FortStateSchema = z.object({
  level: z.number().int().min(1).default(1),
  upgrades: z.array(z.string()).default([]),
});

const FortLogEntrySchema = z.object({
  day: z.number().int().min(0),
  kind: z.enum(['upgrade', 'event', 'note']),
  message: z.string().min(1),
});

/** M7.6: keep the persistent fort log bounded so save files stay small. */
export const FORT_LOG_MAX = 50;

const RoasterSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10), z.literal(11)]).default(11),
  dayCount: z.number().int().min(0).default(0),
  gold: z.number().int().default(0),
  reputation: z.record(z.string(), z.number().int()).default({}),
  /** Mercs by id reference data/mercs.json. */
  rosterMercIds: z.array(z.string()).default([]),
  /** Procedurally-generated or recruited mercs persisted in full. */
  generatedMercs: z.array(GeneratedMercSchema).default([]),
  mercStates: z.array(MercStateSchema).default([]),
  captives: z.array(CaptiveSchema).default([]),
  /** M5.1: mercs who have died permanently. v2+. */
  deceased: z.array(DeceasedSchema).default([]),
  /** M5.2: in-progress quest arcs. v3+. */
  activeQuests: z.array(ActiveQuestSchema).default([]),
  /** M5.2: finished quest arcs. v3+. */
  completedQuests: z.array(CompletedQuestSchema).default([]),
  /** M5.4: errands dispatched but not yet returned. v4+. */
  pendingErrands: z.array(PendingErrandSchema).default([]),
  /** M6.4: fort upgrade state (level + purchased upgrade ids). v7+. */
  fort: FortStateSchema.default({ level: 1, upgrades: [] }),
  /** M7.6: persistent fort log (upgrades + daily events). v8+. */
  fortLog: z.array(FortLogEntrySchema).default([]),
  /** M9.2: consecutive days the fort has ended with gold < 0. v9+. */
  consecutiveDebtDays: z.number().int().min(0).default(0),
  /** M10.1: persistent tavern hire pool. v10+. */
  hirePool: z.array(HirePoolEntrySchema).default([]),
});

export type RosterMercState = z.infer<typeof MercStateSchema>;
export type RosterDeceased = z.infer<typeof DeceasedSchema>;
export type RosterActiveQuest = z.infer<typeof ActiveQuestSchema>;
export type RosterCompletedQuest = z.infer<typeof CompletedQuestSchema>;
export type RosterPendingErrand = z.infer<typeof PendingErrandSchema>;
export type FortLogEntry = z.infer<typeof FortLogEntrySchema>;
export type RosterFile = z.infer<typeof RoasterSchema>;

export interface Roster {
  schemaVersion: 11;
  dayCount: number;
  gold: number;
  reputation: Record<string, number>;
  /** All mercs currently in the fort, resolved with their Tag[] objects. */
  mercs: Merc[];
  /** Runtime per-merc state keyed by merc id. */
  states: Map<string, RosterMercState>;
  captives: Captive[];
  /** M5.1: permadeath log. */
  deceased: RosterDeceased[];
  /** M5.2: in-progress quest arcs. */
  activeQuests: RosterActiveQuest[];
  /** M5.2: finished quest arcs. */
  completedQuests: RosterCompletedQuest[];
  /** M5.4: errands in flight. */
  pendingErrands: RosterPendingErrand[];
  /** M6.4: fort upgrade state. */
  fort: { level: number; upgrades: string[] };
  /** M7.6: persistent fort log entries (latest at the end, trimmed to FORT_LOG_MAX). */
  fortLog: FortLogEntry[];
  /** M9.2: consecutive days ended in debt (gold < 0). Resets to 0 on a non-debt day or after a desertion. */
  consecutiveDebtDays: number;
  /** M10.1: tavern hire pool — generated bench of hireable mercs with prices. */
  hirePool: import('./tavern.js').HirePoolEntry[];
}

/**
 * M7.6: append a log entry to the roster's fortLog, trimming the head
 * so the list never exceeds FORT_LOG_MAX entries.
 */
export function appendFortLog(roster: Roster, entry: FortLogEntry): void {
  roster.fortLog.push(entry);
  if (roster.fortLog.length > FORT_LOG_MAX) {
    roster.fortLog.splice(0, roster.fortLog.length - FORT_LOG_MAX);
  }
}

export function newRoster(initialMercs: Merc[]): Roster {
  return {
    schemaVersion: 11,
    dayCount: 0,
    gold: 0,
    reputation: {},
    mercs: initialMercs,
    states: new Map(initialMercs.map((m) => [m.id, { id: m.id, fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 0, tier: 'rookie', coDeployments: {} }])),
    captives: [],
    deceased: [],
    activeQuests: [],
    completedQuests: [],
    pendingErrands: [],
    fort: { level: 1, upgrades: [] },
    fortLog: [],
    consecutiveDebtDays: 0,
    hirePool: [],
  };
}

export function loadRoster(
  path: string,
  basePool: Map<string, Merc>,
  tagPool: Map<string, Tag>,
): Roster {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const parsed = RoasterSchema.parse(raw);

  const mercs: Merc[] = [];
  for (const id of parsed.rosterMercIds) {
    const m = basePool.get(id);
    if (!m) throw new Error(`roster: unknown base merc id ${id}`);
    mercs.push(m);
  }
  for (const g of parsed.generatedMercs) {
    const tags = g.tagIds.map((tid) => {
      const t = tagPool.get(tid);
      if (!t) throw new Error(`roster: unknown tag id ${tid} in generated merc ${g.id}`);
      return t;
    });
    mercs.push({
      id: g.id,
      name: g.name,
      attrs: g.attrs as import('./types.js').AttributeBlock,
      tags,
      veterancy: g.veterancy,
      wage: g.wage,
      hp: g.hp,
    });
  }
  const states = new Map<string, RosterMercState>(
    parsed.mercStates.map((s) => [s.id, s]),
  );
  for (const m of mercs) {
    if (!states.has(m.id)) states.set(m.id, { id: m.id, fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 0, tier: 'rookie', coDeployments: {} });
  }
  const captives: Captive[] = parsed.captives.map((c) => ({
    id: c.id,
    name: c.name,
    archetype: c.archetype,
    backstory: c.backstory,
    notoriety: c.notoriety,
    tags: c.tagIds.map((tid) => {
      const t = tagPool.get(tid);
      if (!t) throw new Error(`roster: unknown tag id ${tid} in captive ${c.id}`);
      return t;
    }),
  }));

  return {
    schemaVersion: 11,
    dayCount: parsed.dayCount,
    gold: parsed.gold,
    reputation: parsed.reputation,
    mercs,
    states,
    captives,
    deceased: parsed.deceased,
    activeQuests: parsed.activeQuests,
    completedQuests: parsed.completedQuests,
    pendingErrands: parsed.pendingErrands,
    fort: parsed.fort,
    fortLog: parsed.fortLog,
    consecutiveDebtDays: parsed.consecutiveDebtDays,
    hirePool: parsed.hirePool.map((e) => ({
      merc: {
        id: e.merc.id,
        name: e.merc.name,
        attrs: e.merc.attrs as import('./types.js').AttributeBlock,
        tags: e.merc.tagIds.map((tid) => {
          const t = tagPool.get(tid);
          if (!t) throw new Error(`roster: unknown tag id ${tid} in hire pool merc ${e.merc.id}`);
          return t;
        }),
        veterancy: e.merc.veterancy,
        wage: e.merc.wage,
        hp: e.merc.hp,
      },
      price: e.price,
      postedDay: e.postedDay,
      ...(e.startingTier ? { startingTier: e.startingTier } : {}),
      ...(e.startingXp !== undefined ? { startingXp: e.startingXp } : {}),
    })),
  };
}

export function saveRoster(
  path: string,
  roster: Roster,
  basePool: Map<string, Merc>,
): void {
  const baseIds = new Set(basePool.keys());
  const rosterMercIds: string[] = [];
  const generatedMercs: z.infer<typeof GeneratedMercSchema>[] = [];
  for (const m of roster.mercs) {
    if (baseIds.has(m.id) && basePool.get(m.id) === m) {
      rosterMercIds.push(m.id);
    } else {
      generatedMercs.push({
        id: m.id,
        name: m.name,
        attrs: m.attrs,
        tagIds: m.tags.map((t) => t.id),
        veterancy: m.veterancy,
        wage: m.wage,
        hp: m.hp,
      });
    }
  }
  const file: RosterFile = {
    schemaVersion: 11,
    dayCount: roster.dayCount,
    gold: roster.gold,
    reputation: roster.reputation,
    rosterMercIds,
    generatedMercs,
    mercStates: [...roster.states.values()],
    captives: roster.captives.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      backstory: c.backstory,
      notoriety: c.notoriety,
      tagIds: c.tags.map((t) => t.id),
    })),
    deceased: roster.deceased,
    activeQuests: roster.activeQuests,
    completedQuests: roster.completedQuests,
    pendingErrands: roster.pendingErrands,
    fort: roster.fort,
    fortLog: roster.fortLog,
    consecutiveDebtDays: roster.consecutiveDebtDays,
    hirePool: roster.hirePool.map((e) => ({
      merc: {
        id: e.merc.id,
        name: e.merc.name,
        attrs: e.merc.attrs,
        tagIds: e.merc.tags.map((t) => t.id),
        veterancy: e.merc.veterancy,
        wage: e.merc.wage,
        hp: e.merc.hp,
      },
      price: e.price,
      postedDay: e.postedDay,
      ...(e.startingTier ? { startingTier: e.startingTier } : {}),
      ...(e.startingXp !== undefined ? { startingXp: e.startingXp } : {}),
    })),
  };
  // M17.1: defensive backup. If a roster file already exists at this path,
  // copy it to `<path>.bak` before overwriting so a corrupted save (or an
  // unwanted mutation) can be recovered manually. Best-effort: failures
  // (e.g. read-only fs) are swallowed so they never block the actual save.
  if (existsSync(path)) {
    try {
      copyFileSync(path, `${path}.bak`);
    } catch {
      // ignore — backup is best-effort
    }
  }
  writeFileSync(path, JSON.stringify(file, null, 2) + '\n', 'utf8');
}

/** Apply a captive disposition's CaptiveEffect to a roster, mutating it. */
export function applyCaptiveEffect(
  roster: Roster,
  captive: Captive,
  effect: CaptiveEffect,
): void {
  roster.gold += effect.goldDelta;
  roster.reputation[effect.reputationGain] = (roster.reputation[effect.reputationGain] ?? 0) + 1;
  if (effect.captiveRemoved) {
    roster.captives = roster.captives.filter((c) => c.id !== captive.id);
  }
  if (effect.recruitedAs) {
    // M11.2: recruited captives are posted to the tavern bench at a
    // discount price (effect.benchPrice). The player must still pay to
    // hire them via the normal tavern flow; until then they sit on the
    // bench. The captive record is consumed.
    const price = effect.benchPrice ?? 1;
    roster.hirePool.push({
      merc: effect.recruitedAs,
      price,
      postedDay: roster.dayCount,
    });
    roster.captives = roster.captives.filter((c) => c.id !== captive.id);
  }
}

/**
 * M5.1: apply a list of casualties to the roster, mutating it.
 * Returns the ids of mercs killed (permadeath) by this batch.
 * A merc dies when hpDamage >= hp; they are moved from `mercs` into `deceased`
 * and their state record is dropped.
 */
export function applyCasualties(
  roster: Roster,
  casualties: Array<{ mercId: string; damage: number; reason: string }>,
): string[] {
  const killed: string[] = [];
  for (const c of casualties) {
    const merc = roster.mercs.find((m) => m.id === c.mercId);
    if (!merc) continue;
    const state =
      roster.states.get(c.mercId) ??
      { id: c.mercId, fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 0, tier: 'rookie' as const, coDeployments: {} };
    state.hpDamage += c.damage;
    roster.states.set(c.mercId, state);
    if (state.hpDamage >= merc.hp) {
      roster.deceased.push({
        id: merc.id,
        name: merc.name,
        dayDied: roster.dayCount,
        reason: c.reason,
      });
      roster.mercs = roster.mercs.filter((m) => m.id !== merc.id);
      roster.states.delete(merc.id);
      killed.push(merc.id);
    }
  }
  return killed;
}

/** Convenience: 'has this roster been saved before?' */
export function rosterExists(path: string): boolean {
  return existsSync(path);
}
