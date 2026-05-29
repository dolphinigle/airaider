import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';

import type { Merc } from './types.js';
import type { ScenarioLLM } from './llm/interface.js';
import type { Rng } from './rng.js';
import { rngFromString } from './rng.js';
import { loadScenario, type FixtureScenario } from './scenarios.js';
import {
  resolveScenario,
  type Assignment,
  type ScenarioResolution,
} from './resolver.js';
import type { Roster, RosterPendingErrand, FortLogEntry } from './roster.js';
import { appendFortLog } from './roster.js';
import { dispatchErrand, resolveDueErrands } from './errands.js';
import { applyVeterancyXp, type Promotion } from './veterancy.js';
import { recordCoDeployment, bondedPairsOf, type BondFormation } from './bonds.js';
import { seasonFor, type SeasonClock } from './season.js';
import { loadEventCatalog, rollEventForDay, type DailyEvent } from './events.js';
import { loadTags } from './tags.js';
import { refreshHirePool, dropStaleListings, HIRE_REFRESH_INTERVAL_DAYS, type HirePoolEntry } from './tavern.js';
import { reputationTier } from './reputation.js';
import {
  loadQuests,
  findEnemyFactionStirrableQuests,
  stirQuest,
  type Quest,
} from './quests.js';

/** M9.1: wages are paid every Nth day (CANONICAL §2.7 flat-wage rule). */
export const WAGE_INTERVAL_DAYS = 7;
/** M9.2: a merc deserts after this many consecutive days of fort debt (gold < 0). */
export const DEBT_DESERTION_THRESHOLD_DAYS = 3;
/** M11.5: gold cost per captive per day for food + guards. */
export const CAPTIVE_UPKEEP_PER_DAY = 1;
import { fortEffectsFor, chapelHealsWounds, fatigueRecoveryAmount, granaryWageReduction } from './fortEffects.js';
import { affordableUpgrades, loadFortCatalog, type FortUpgrade } from './fort.js';
import { loadRoomCatalog, type RoomDef } from './rooms.js';
import { effectiveUpgradeIds } from './fortLayout.js';

let _roomCatalogCache: Map<string, RoomDef> | null = null;
function roomCatalogSingleton(): Map<string, RoomDef> {
  if (_roomCatalogCache) return _roomCatalogCache;
  const list = loadRoomCatalog(new URL('../data/rooms.json', import.meta.url).pathname);
  _roomCatalogCache = new Map(list.map((r) => [r.id, r]));
  return _roomCatalogCache;
}
function effUpgradesForRoster(roster: { fort: { upgrades: string[]; cells: any[]; placedRooms: any[] } }): string[] {
  return effectiveUpgradeIds(roster.fort as any, roomCatalogSingleton(), roster.fort.upgrades);
}

const DaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Paths to scenario fixtures, resolved relative to the day fixture file. */
  scenarios: z.array(z.string().min(1)).min(1),
  /** Optional day-level seed; defaults to id. Currently informational only. */
  seed: z.string().optional(),
});

export type Day = z.infer<typeof DaySchema>;

export function loadDay(path: string): Day {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return DaySchema.parse(raw);
}

export interface DayResolutionInput {
  day: Day;
  /** Absolute path of the day fixture file; used to resolve scenario paths. */
  dayPath: string;
  mercs: Map<string, Merc>;
  llm: ScenarioLLM;
  /**
   * Optional RNG factory per scenario; defaults to `rngFromString(scenario.seed)`.
   * Pass a custom one to test reproducibility.
   */
  rngFor?: (scenario: FixtureScenario, index: number) => Rng;
  /** Optional starting fatigue per merc (carries over from previous days). */
  initialFatigue?: Map<string, number>;
  /** M5.4: roster carries pending errands; if provided, errands are dispatched/resolved. */
  roster?: Roster;
  /**
   * PROTO-GAME: when set, replaces the scenario's hard-coded assignments[]
   * for the scenario at the given index. Lets the interactive game prompt
   * the player to pick deployments. Return undefined to fall back to the
   * scenario's own assignments (deterministic-fixture behavior).
   */
  assignmentsOverride?: (scenarioIndex: number, scenario: FixtureScenario) =>
    Array<{ slotId: string; mercId: string }> | undefined;
}

export interface DayResolution {
  dayId: string;
  dayName: string;
  scenarios: ScenarioResolution[];
  /** Final fatigue per merc after the whole day. */
  finalFatigue: Record<string, number>;
  /** M5.4: errands dispatched today (informational; not yet resolved). */
  errandsDispatched: RosterPendingErrand[];
  /** M5.4: errands that returned and were resolved today. */
  errandsResolved: ScenarioResolution[];
  /** M6.1: veterancy tier crossings during the day (roster-mode only). */
  promotions: Promotion[];
  /** M6.2: pairs that crossed the bond threshold today (roster-mode only). */
  bondsFormed: BondFormation[];
  /** M6.3: season clock at the time of this day (roster-mode only; null otherwise). */
  seasonClock: SeasonClock | null;
  /** M7.4: daily event rolled at the start of the day (null if none / roster-less). */
  dailyEvent: DailyEvent | null;
  /**
   * M7.5: fort upgrades affordable as of end-of-day (roster-mode only).
   * Empty if none. The dayTranscript surfaces these as a FORT HINT block.
   */
  fortHints: Pick<FortUpgrade, 'id' | 'name' | 'cost' | 'description'>[];
  /**
   * M7.10: fatigue recovery applied at end-of-day. Each entry is one merc
   * who was idle (not deployed, not on errand) and shed 1 fatigue. Empty
   * in roster-less mode.
   */
  fatigueRecovery: Array<{ mercId: string; before: number; after: number }>;
  /**
   * M9.3: true when end-of-day fatigue recovery was skipped because the
   * fort entered this day already in debt (roster.consecutiveDebtDays > 0).
   * Always false in roster-less mode.
   */
  fatigueRecoverySuspended: boolean;
  /**
   * M7.12: end-of-day wound healing from the chapel. Empty unless the fort
   * has the chapel upgrade AND idle mercs had hpDamage > 0.
   */
  woundHealing: Array<{ mercId: string; before: number; after: number }>;
  /**
   * M9.1: weekly payday. Non-empty only on days where `(dayCount+1)`
   * is a multiple of WAGE_INTERVAL_DAYS (7) AND the roster has mercs.
   * Each entry records one merc's wage; `wagesTotalPaid` is the sum
   * deducted from `roster.gold` (gold may go negative — debt is allowed
   * for now; future milestones will add desertion / morale loss).
   */
  wagesPaid: Array<{ mercId: string; wage: number }>;
  wagesTotalPaid: number;
  /**
   * M9.2: mercs who deserted at end-of-day because the fort has been in
   * debt for at least `DEBT_DESERTION_THRESHOLD_DAYS` consecutive days.
   * At most one merc deserts per day; the counter resets to 0 afterwards
   * so the next desertion needs another full debt streak. Empty when the
   * fort is solvent or has no mercs.
   */
  desertions: Array<{ mercId: string; reason: string }>;
  /**
   * M10.2: hire-pool entries added by the day's auto-refresh. Non-empty
   * only on days where `(dayCount+1)` is a multiple of
   * HIRE_REFRESH_INTERVAL_DAYS (7) AND the pool is below target size.
   */
  tavernRefresh: HirePoolEntry[];
  /**
   * M10.3: hire-pool entries that aged off the bench this refresh because
   * their postedDay is older than HIRE_LISTING_TTL_DAYS. Always [] off the
   * refresh cadence (and in roster-less mode).
   */
  tavernExpired: HirePoolEntry[];
  /**
   * M9.4: true when the fort entered the day already in debt
   * (`consecutiveDebtDays > 0`). While low-morale is set, bond
   * co-deployment counters do not advance — see bondsFormed.
   */
  lowMorale: boolean;
  /**
   * M7.6: fort log entries appended during THIS day (currently only the
   * daily-event entry; upgrade purchases happen via the fort CLI, not the day
   * loop). Empty in roster-less mode.
   */
  newFortLogEntries: FortLogEntry[];
  /**
   * M13.1: quests auto-stirred at the START of this day because a faction
   * crossed into enemy tier. Each entry records the quest id + the faction
   * that triggered it. Empty in roster-less mode.
   */
  questsStirred: Array<{ questId: string; questName: string; enemyFactionId: string }>;
  /**
   * M11.5: daily captive upkeep — each captive currently held costs
   * CAPTIVE_UPKEEP_PER_DAY (=1g) per in-game day in food/guards. Applied
   * unconditionally at end-of-day (after scenarios). Gold may go negative.
   * `count` is the number of captives charged; `goldSpent = count * CAPTIVE_UPKEEP_PER_DAY`.
   * Both 0 when no captives are held or in roster-less mode.
   */
  captiveUpkeep: { count: number; goldSpent: number };
  /**
   * M11.7: captive escape attempts. Each captive currently held rolls a
   * deterministic escape chance equal to `notoriety * 10%` (so a notoriety-5
   * captive escapes 50% of days, while notoriety-1 escapes ~10%). Successful
   * escapes remove the captive from `roster.captives` and append a fortLog
   * note. Empty array in roster-less mode or when no captives are held.
   */
  captiveEscapes: Array<{ captiveId: string; captiveName: string; notoriety: number }>;
}

/**
 * Runs the day's scenarios sequentially with a shared roster.
 * Fatigue accumulates per merc (+1 per scenario participated in).
 * computeSlotContributions applies a penalty when fatigue ≥ FATIGUE_THRESHOLD.
 */
export async function resolveDay(input: DayResolutionInput): Promise<DayResolution> {
  const { day, dayPath, mercs, llm, rngFor, initialFatigue, roster } = input;
  const fatigue = new Map<string, number>(initialFatigue ?? []);
  const fatigueOf = (mercId: string): number => fatigue.get(mercId) ?? 0;
  const tierOf = roster
    ? (mercId: string) => roster.states.get(mercId)?.tier
    : undefined;
  // M9.8: scenario-narrator hint — survivor still grieving a bond partner.
  const recentlyLostBondPartnerOf = roster
    ? (mercId: string) => roster.states.get(mercId)?.recentGriefPartner
    : undefined;

  const fixturesDir = dirname(resolve(dayPath));
  const scenarioResolutions: ScenarioResolution[] = [];
  const errandsDispatched: RosterPendingErrand[] = [];
  const errandsResolved: ScenarioResolution[] = [];
  const promotions: Promotion[] = [];
  const bondsFormed: BondFormation[] = [];
  const newFortLogEntries: FortLogEntry[] = [];
  const bondedPairs = roster ? bondedPairsOf(roster) : undefined;
  const seasonClock: SeasonClock | null = roster ? seasonFor(roster.dayCount) : null;
  const season = seasonClock?.season;
  const fortUpgrades = roster ? effUpgradesForRoster(roster) : undefined;

  // M7.4: roll the day's event (if any) before scenarios begin, and apply
  // its flat effects to the roster. Roster-less callers get no event.
  let dailyEvent: DailyEvent | null = null;
  if (roster) {
    const catalog = loadEventCatalog(new URL('../data/events.json', import.meta.url).pathname);
    // M8.2: enemy-tier factions on this roster unlock punitive events.
    const enemyFactions: string[] = [];
    for (const [factionId, standing] of Object.entries(roster.reputation)) {
      if (reputationTier(standing) === 'enemy') enemyFactions.push(factionId);
    }
    // M11.3: highest captive notoriety on the roster unlocks sympathizer events.
    const maxCaptiveNotoriety = roster.captives.reduce((m, c) => Math.max(m, c.notoriety), 0);
    dailyEvent = rollEventForDay(catalog, {
      dayCount: roster.dayCount + 1,
      season,
      fortUpgrades: fortUpgrades ?? [],
      enemyFactions,
      maxCaptiveNotoriety,
    });
    if (dailyEvent) {
      const eff = dailyEvent.effect;
      roster.gold += eff.goldDelta;
      if (eff.fatigueDelta !== 0) {
        for (const m of roster.mercs) {
          fatigue.set(m.id, Math.max(0, (fatigue.get(m.id) ?? 0) + eff.fatigueDelta));
        }
      }
      for (const d of eff.reputationDeltas) {
        roster.reputation[d.factionId] = (roster.reputation[d.factionId] ?? 0) + d.delta;
      }
      const parts: string[] = [`${dailyEvent.label}`];
      if (eff.goldDelta !== 0) parts.push(`${eff.goldDelta > 0 ? '+' : ''}${eff.goldDelta}g`);
      if (eff.fatigueDelta !== 0) parts.push(`fatigue ${eff.fatigueDelta > 0 ? '+' : ''}${eff.fatigueDelta}`);
      for (const d of eff.reputationDeltas) parts.push(`${d.factionId} ${d.delta > 0 ? '+' : ''}${d.delta}`);
      const entry: FortLogEntry = {
        day: roster.dayCount + 1,
        kind: 'event',
        message: parts.join('  '),
      };
      appendFortLog(roster, entry);
      newFortLogEntries.push(entry);
    }
  }
  const reputationOf = roster
    ? (factionId: string): number => roster.reputation[factionId] ?? 0
    : undefined;
  const applyDeltas = (r: ScenarioResolution): void => {
    if (!roster) return;
    for (const d of r.reputationDeltas) {
      roster.reputation[d.factionId] = (roster.reputation[d.factionId] ?? 0) + d.delta;
    }
  };

  // M9.4: when the fort enters the day already in debt, mercs are too
  // miserable to deepen relationships — bond co-deployment counters do
  // not advance. Existing bonds are unaffected.
  const lowMorale = !!roster && roster.consecutiveDebtDays > 0;
  const bondRecord = (party: readonly string[]): BondFormation[] => {
    if (!roster || lowMorale) return [];
    return recordCoDeployment(roster, party);
  };

  // M5.4: resolve any errands due TODAY before processing today's scenarios.
  // Use roster.dayCount + 1 as "current day" since the loop hasn't bumped it yet.
  if (roster) {
    const currentDay = roster.dayCount + 1;
    const dueResolutions = await resolveDueErrands({
      roster, currentDay, mercs, llm, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf, basePath: dayPath,
    });
    for (const r of dueResolutions) {
      errandsResolved.push(r);
      scenarioResolutions.push(r);
      applyDeltas(r);
      if (roster) {
        promotions.push(...applyVeterancyXp(roster, r.slotContributions.map((sc) => sc.mercId), r.band));
        bondsFormed.push(...bondRecord(r.slotContributions.map((sc) => sc.mercId)));
      }
      // Errands cost 1 fatigue per participating merc on return day.
      for (const a of r.slotContributions) {
        fatigue.set(a.mercId, (fatigue.get(a.mercId) ?? 0) + 1);
      }
    }
  }

  for (let i = 0; i < day.scenarios.length; i++) {
    const scenarioRelOrAbs = day.scenarios[i]!;
    const scenarioAbs = scenarioRelOrAbs.startsWith('/')
      ? scenarioRelOrAbs
      : join(fixturesDir, scenarioRelOrAbs);
    const scenario = loadScenario(scenarioAbs);
    // PROTO-GAME: allow caller to override hard-coded assignments per scenario.
    const overrideAssignments = input.assignmentsOverride?.(i, scenario);
    const effectiveAssignments = overrideAssignments ?? scenario.assignments;
    if (!effectiveAssignments || effectiveAssignments.length === 0) {
      throw new Error(
        `Day ${day.id}: scenario ${scenario.id} has no assignments; the day loop requires them.`,
      );
    }

    // M5.4: if this is an errand and we have a roster, dispatch instead of resolve.
    if (roster && scenario.daysToResolve && scenario.daysToResolve > 0) {
      const partyMercIds = effectiveAssignments.map((a) => a.mercId);
      const errand = dispatchErrand({
        roster, scenario, scenarioPath: scenarioRelOrAbs, partyMercIds,
      });
      errandsDispatched.push(errand);
      // Day-of departure costs 1 fatigue per merc (travel).
      for (const id of partyMercIds) fatigue.set(id, (fatigue.get(id) ?? 0) + 1);
      continue;
    }

    const assignments: Assignment[] = effectiveAssignments.map((a) => {
      const merc = mercs.get(a.mercId);
      if (!merc) {
        throw new Error(`Day ${day.id}: unknown merc ${a.mercId} in scenario ${scenario.id}`);
      }
      return { slotId: a.slotId, merc };
    });
    const rng = rngFor
      ? rngFor(scenario, i)
      : rngFromString(scenario.seed ?? scenario.id);

    const resolution = await resolveScenario({ scenario, assignments, llm, rng, fatigueOf, reputationOf, bondedPairs, season, fortUpgrades, tierOf, recentlyLostBondPartnerOf });
    scenarioResolutions.push(resolution);
    applyDeltas(resolution);
    if (roster) {
      promotions.push(...applyVeterancyXp(roster, assignments.map((a) => a.merc.id), resolution.band));
      bondsFormed.push(...bondRecord(assignments.map((a) => a.merc.id)));
    }

    for (const a of assignments) {
      fatigue.set(a.merc.id, (fatigue.get(a.merc.id) ?? 0) + 1);
    }
  }

  // M7.10: end-of-day fatigue recovery. Mercs who neither deployed today
  // (no slot contribution in any scenarioResolution) nor are currently on an
  // errand (busy travelling) recover 1 fatigue, floored at 0. Recovery is
  // computed against the post-deployment fatigue map but BEFORE finalFatigue
  // is exported, so the saved roster reflects the recovered values.
  const fatigueRecovery: Array<{ mercId: string; before: number; after: number }> = [];
  // M9.3: when the fort enters the day already in debt (consecutiveDebtDays
  // > 0 at end of LAST day), morale rots and idle mercs do not shed fatigue.
  // Recovery still runs in roster-less mode (no debt concept there).
  const recoverySuspended = !!roster && roster.consecutiveDebtDays > 0;
  if (roster && !recoverySuspended) {
    const deployed = new Set<string>();
    for (const sr of scenarioResolutions) {
      for (const sc of sr.slotContributions) deployed.add(sc.mercId);
    }
    const onErrand = new Set<string>();
    for (const e of roster.pendingErrands) for (const id of e.partyMercIds) onErrand.add(id);
    // M7.13: winter-larder doubles fatigue recovery during frost.
    const recoverAmount = fatigueRecoveryAmount(
      fortEffectsFor(effUpgradesForRoster(roster)),
      season,
    );
    for (const m of roster.mercs) {
      if (deployed.has(m.id) || onErrand.has(m.id)) continue;
      const before = fatigue.get(m.id) ?? 0;
      if (before <= 0) continue;
      const after = Math.max(0, before - recoverAmount);
      fatigue.set(m.id, after);
      fatigueRecovery.push({ mercId: m.id, before, after });
    }
  }

  const finalFatigue: Record<string, number> = {};
  for (const [k, v] of fatigue) finalFatigue[k] = v;

  // M7.12: chapel wound healing. Mirrors fatigue recovery — idle mercs with
  // hpDamage > 0 heal 1 hp damage if the fort has the chapel upgrade. The
  // healed value is mutated directly onto the roster state (single source
  // of truth for hp damage; cliDay does NOT round-trip hpDamage the way it
  // does fatigue, because hp damage already lives on roster.states).
  const woundHealing: Array<{ mercId: string; before: number; after: number }> = [];
  if (roster && chapelHealsWounds(fortEffectsFor(effUpgradesForRoster(roster)))) {
    const deployed = new Set<string>();
    for (const sr of scenarioResolutions) {
      for (const sc of sr.slotContributions) deployed.add(sc.mercId);
    }
    const onErrand = new Set<string>();
    for (const e of roster.pendingErrands) for (const id of e.partyMercIds) onErrand.add(id);
    for (const m of roster.mercs) {
      if (deployed.has(m.id) || onErrand.has(m.id)) continue;
      const state = roster.states.get(m.id);
      if (!state || state.hpDamage <= 0) continue;
      const before = state.hpDamage;
      state.hpDamage = before - 1;
      woundHealing.push({ mercId: m.id, before, after: state.hpDamage });
    }
  }


  // M9.1: weekly payday. Every WAGE_INTERVAL_DAYS the fort pays out the
  // sum of wages for the current roster. Flat-wage rule (CANONICAL §2.7)
  // means every merc costs the same regardless of stats/tags. Debt is
  // tolerated for now — gold may go negative.
  const wagesPaid: Array<{ mercId: string; wage: number }> = [];
  let wagesTotalPaid = 0;
  if (roster) {
    const currentDay = roster.dayCount + 1;
    if (currentDay % WAGE_INTERVAL_DAYS === 0 && roster.mercs.length > 0) {
      const wageReduction = granaryWageReduction(fortEffectsFor(effUpgradesForRoster(roster)));
      for (const m of roster.mercs) {
        const paid = Math.max(0, m.wage - wageReduction);
        wagesPaid.push({ mercId: m.id, wage: paid });
        wagesTotalPaid += paid;
      }
      roster.gold -= wagesTotalPaid;
      const granaryNote = wageReduction > 0 ? ` (granary −${wageReduction}g/merc)` : '';
      const payEntry: FortLogEntry = {
        day: currentDay,
        kind: 'note',
        message: `Payday: ${wagesTotalPaid}g wages to ${wagesPaid.length} merc${wagesPaid.length === 1 ? '' : 's'}${granaryNote} (gold ${roster.gold}g)`,
      };
      appendFortLog(roster, payEntry);
      newFortLogEntries.push(payEntry);
    }
  }

  // M9.2: end-of-day debt tracking + desertion. Increment the streak when
  // the fort closes the day with negative gold; reset to 0 on solvent days.
  // When the streak reaches DEBT_DESERTION_THRESHOLD_DAYS, the lowest-tier
  // / least-invested merc walks out and the counter resets.
  const desertions: Array<{ mercId: string; reason: string }> = [];
  if (roster) {
    if (roster.gold < 0) {
      roster.consecutiveDebtDays += 1;
    } else {
      roster.consecutiveDebtDays = 0;
    }
    if (roster.consecutiveDebtDays >= DEBT_DESERTION_THRESHOLD_DAYS && roster.mercs.length > 0) {
      const tierRank: Record<string, number> = { rookie: 0, veteran: 1, grizzled: 2 };
      // M9.6: bonded mercs are last to walk out — comradeship buys time.
      // bondedPairs is a Set of pairKey strings ("a|b"); decode into ids.
      const bondedSet = new Set<string>();
      const bondCount = new Map<string, number>();
      for (const key of bondedPairs ?? []) {
        const [a, b] = key.split('|');
        if (!a || !b) continue;
        bondedSet.add(a); bondedSet.add(b);
        bondCount.set(a, (bondCount.get(a) ?? 0) + 1);
        bondCount.set(b, (bondCount.get(b) ?? 0) + 1);
      }
      const candidates = roster.mercs.map((m) => {
        const st = roster.states.get(m.id);
        return {
          merc: m,
          bondCount: bondCount.get(m.id) ?? 0,
          tier: tierRank[st?.tier ?? 'rookie'] ?? 0,
          xp: st?.xp ?? 0,
        };
      });
      candidates.sort((a, b) => {
        if (a.bondCount !== b.bondCount) return a.bondCount - b.bondCount;
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (a.xp !== b.xp) return a.xp - b.xp;
        return a.merc.id.localeCompare(b.merc.id);
      });
      const leaving = candidates[0]!.merc;
      const wasBonded = bondedSet.has(leaving.id);
      desertions.push({
        mercId: leaving.id,
        reason: wasBonded
          ? `unpaid for ${roster.consecutiveDebtDays} days (no unbonded mercs left to walk first)`
          : `unpaid for ${roster.consecutiveDebtDays} days`,
      });
      roster.mercs = roster.mercs.filter((m) => m.id !== leaving.id);
      roster.states.delete(leaving.id);
      roster.consecutiveDebtDays = 0;
      const desertEntry: FortLogEntry = {
        day: roster.dayCount + 1,
        kind: 'note',
        message: `Desertion: ${leaving.name} (${leaving.id}) walked out — unpaid wages`,
      };
      appendFortLog(roster, desertEntry);
      newFortLogEntries.push(desertEntry);
    }
  }

  // M10.2: weekly tavern auto-refresh. Top up the hire pool on the same
  // cadence as payday (every HIRE_REFRESH_INTERVAL_DAYS days). Uses a
  // deterministic RNG seeded on the absolute day so two runs of the same
  // saved game land on the same bench.
  const tavernRefresh: HirePoolEntry[] = [];
  const tavernExpired: HirePoolEntry[] = [];
  if (roster) {
    const currentDay = roster.dayCount + 1;
    if (currentDay % HIRE_REFRESH_INTERVAL_DAYS === 0) {
      const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
      const rng = rngFromString(`tavern-day-${currentDay}`);
      // capture aged-off entries before refresh refills the slots
      tavernExpired.push(...dropStaleListings(roster, currentDay));
      tavernRefresh.push(...refreshHirePool(roster, rng, tagPool, currentDay));
    }
  }

  // M7.5: compute affordable fort upgrades as of end-of-day so the
  // transcript can nudge the player with a FORT HINT block.
  let fortHints: Pick<FortUpgrade, 'id' | 'name' | 'cost' | 'description'>[] = [];
  if (roster) {
    const fortCatalog = loadFortCatalog(
      new URL('../data/fort-upgrades.json', import.meta.url).pathname,
    );
    fortHints = affordableUpgrades(fortCatalog, roster.fort, roster.gold).map((u) => ({
      id: u.id, name: u.name, cost: u.cost, description: u.description,
    }));
  }

  // M13.1: auto-stir bounty-hunt quests whose `seededByEnemyFaction`
  // matches any faction currently at enemy tier. Computed at end-of-day so
  // reputation deltas from this day's scenarios are taken into account.
  const questsStirred: Array<{ questId: string; questName: string; enemyFactionId: string }> = [];
  if (roster) {
    const endEnemies: string[] = [];
    for (const [factionId, standing] of Object.entries(roster.reputation)) {
      if (reputationTier(standing) === 'enemy') endEnemies.push(factionId);
    }
    if (endEnemies.length > 0) {
      const questCatalog = loadQuests(
        new URL('../data/quests.json', import.meta.url).pathname,
      );
      const triggers = findEnemyFactionStirrableQuests(roster, questCatalog, endEnemies);
      for (const q of triggers) {
        stirQuest(roster, q, undefined);
        questsStirred.push({
          questId: q.id,
          questName: q.name,
          enemyFactionId: q.seededByEnemyFaction!,
        });
        const entry: FortLogEntry = {
          day: roster.dayCount + 1,
          kind: 'note',
          message: `Quest stirred: ${q.name} (${q.seededByEnemyFaction} now enemy)`,
        };
        appendFortLog(roster, entry);
        newFortLogEntries.push(entry);
      }
    }
  }

  // M11.5: daily captive upkeep — each captive currently held costs
  // CAPTIVE_UPKEEP_PER_DAY gold in food + guards. Applied at end-of-day
  // AFTER scenarios but BEFORE the debt-desertion check above already
  // ran — note: we deduct after desertions to avoid double-jeopardy on
  // the same day (desertion already triggered on prior-day debt streak).
  // Gold may go negative; the deduction shows up in the next day's
  // debt-streak increment.
  let captiveUpkeep: { count: number; goldSpent: number } = { count: 0, goldSpent: 0 };
  if (roster && roster.captives.length > 0) {
    const count = roster.captives.length;
    const goldSpent = count * CAPTIVE_UPKEEP_PER_DAY;
    roster.gold -= goldSpent;
    captiveUpkeep = { count, goldSpent };
    const entry: FortLogEntry = {
      day: roster.dayCount + 1,
      kind: 'note',
      message: `Captive upkeep: ${goldSpent}g for ${count} captive${count === 1 ? '' : 's'} (gold ${roster.gold}g)`,
    };
    appendFortLog(roster, entry);
    newFortLogEntries.push(entry);
  }

  // M11.7: captive escape attempts. After upkeep is paid (captive may still
  // bolt the same day they cost food); chance per captive = notoriety * 10%.
  // Deterministic seeded by day so re-running yields the same outcome.
  const captiveEscapes: Array<{ captiveId: string; captiveName: string; notoriety: number }> = [];
  if (roster && roster.captives.length > 0) {
    const escapeRng = rngFromString(`captive-escape-${roster.dayCount}`);
    const survivors: typeof roster.captives = [];
    for (const c of roster.captives) {
      // PROTO-GAME v14: spatial-fort modifier. Unassigned captives (held in
      // an overflow corner) are easier to slip free; assigned captives sit
      // in proper dungeon cells with bolts and bars.
      const baseChance = Math.min(1, Math.max(0, c.notoriety * 0.1));
      const chance = c.cellIdx === undefined ? Math.min(1, baseChance + 0.15) : baseChance;
      if (escapeRng() < chance) {
        captiveEscapes.push({ captiveId: c.id, captiveName: c.name, notoriety: c.notoriety });
        const where = c.cellIdx === undefined ? ' from the overflow corner' : '';
        const entry: FortLogEntry = {
          day: roster.dayCount + 1,
          kind: 'note',
          message: `Captive escaped: ${c.name} (notoriety ${c.notoriety}) slipped the guards${where}`,
        };
        appendFortLog(roster, entry);
        newFortLogEntries.push(entry);
      } else {
        survivors.push(c);
      }
    }
    roster.captives = survivors;
  }

  return {
    dayId: day.id,
    dayName: day.name,
    scenarios: scenarioResolutions,
    finalFatigue,
    errandsDispatched,
    errandsResolved,
    promotions,
    bondsFormed,
    seasonClock,
    dailyEvent,
    fortHints,
    newFortLogEntries,
    fatigueRecovery,
    fatigueRecoverySuspended: recoverySuspended,
    woundHealing,
    wagesPaid,
    wagesTotalPaid,
    desertions,
    tavernRefresh,
    tavernExpired,
    lowMorale,
    questsStirred,
    captiveUpkeep,
    captiveEscapes,
  };
}
