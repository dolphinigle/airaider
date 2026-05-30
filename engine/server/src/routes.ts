// PROTO-GUI v0.5: HTTP routes. Single dispatch endpoint plus read paths.

import type { FastifyInstance } from 'fastify';
import { CommandSchema, dispatch } from './dispatch.js';
import { loadCatalogs, getRoster, saveRoster, resetCaches, DEFAULT_SAVE_PATH } from './state.js';
import { getQuestStore, saveQuestStore } from './quests.js';
import {
  renderFortLayout,
  adjacencyBonuses,
  adjacencyEffectIds,
  dungeonCellsWithSpace,
  captiveCellEffects,
  totalCapacity,
  totalRoomPrestige,
  captiveRoomPrestige,
} from '../../../prototype/src/fortLayout.js';
import { computePrestige, prestigeTier, prestigeTierLabel } from '../../../prototype/src/prestige.js';
import { recentLLMLog } from './llmLog.js';
import type { Roster } from '../../../prototype/src/roster.js';
import type { RoomDef } from '../../../prototype/src/rooms.js';

function snapshotState(roster: Roster, roomCatalog: Map<string, RoomDef>): unknown {
  const prestige = computePrestige({
    displayedCount: roster.displayedCount,
    legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
    fortLevel: roster.fort.level,
    roomPrestige: totalRoomPrestige(roster.fort, roomCatalog),
    captivePrestige: captiveRoomPrestige(roster.fort, roomCatalog, roster.captives),
  });
  const tier = prestigeTier(prestige);
  const fortLayoutLines = renderFortLayout(roster.fort, roomCatalog);
  const adjBonuses = adjacencyBonuses(roster.fort, roomCatalog);
  const adjEffects = [...adjacencyEffectIds(roster.fort, roomCatalog)];
  const dungeonFree = dungeonCellsWithSpace(roster.fort, roomCatalog, roster.captives);
  const dungeonCap = totalCapacity(roster.fort, roomCatalog, 'dungeon');
  const captives = roster.captives.map((c) => ({
    ...c,
    cellEffects: captiveCellEffects(roster.fort, roomCatalog, c.cellIdx),
  }));
  const mercs = roster.mercs.map((m) => {
    const st = roster.states.get(m.id);
    return { ...m, fatigue: st?.fatigue ?? 0, hpDamage: st?.hpDamage ?? 0, tier: st?.tier ?? 'rookie' };
  });
  const store = getQuestStore();
  const pursuedQuests = store.pursued.map((q) => ({
    questId: q.questId,
    title: q.scenario.title,
    target: q.scenario.target,
    lead: q.lead,
    slots: q.scenario.slots,
    assignments: q.assignments,
    pursuedOnDay: q.pursuedOnDay,
    expiresOnDay: q.expiresOnDay,
    daysLeft: Math.max(0, q.expiresOnDay - roster.dayCount),
  }));
  return {
    dayCount: roster.dayCount,
    gold: roster.gold,
    fort: roster.fort,
    fortLayoutLines,
    adjacencyBonuses: adjBonuses,
    adjacencyEffectIds: adjEffects,
    captives,
    dungeonFreeCells: dungeonFree,
    dungeonCapacity: dungeonCap,
    leadBoard: roster.leadBoard,
    mercs,
    applicants: roster.applicants,
    hirePool: roster.hirePool,
    reputation: roster.reputation,
    fortLog: roster.fortLog.slice(-20),
    prestige: {
      score: prestige,
      tier,
      tierLabel: prestigeTierLabel(tier),
      displayedCount: roster.displayedCount,
      legendaryLeadsCompleted: roster.legendaryLeadsCompleted,
    },
    pursuedQuests,
    lastResolutions: store.lastResolutions,
    llmLog: recentLLMLog(20),
    questChains: roster.questChains.map((c) => ({
      id: c.id,
      kind: c.kind,
      unitId: c.unitId,
      unitName: c.unitId ? (roster.mercs.find((m) => m.id === c.unitId)?.name ?? roster.deceased.find((d) => d.id === c.unitId)?.name) : undefined,
      chainRarity: c.chainRarity,
      region: c.region,
      title: c.title,
      hook: c.hook,
      skeleton: c.skeleton,
      stepBeats: c.stepBeats,
      anchors: c.anchors,
      currentStepIdx: c.currentStepIdx,
      totalSteps: c.steps.length,
      plannedStepCount: c.steps.length,
      status: c.status,
      startedDay: c.startedDay,
      endedDay: c.endedDay,
      epilogue: c.epilogue,
      steps: c.steps.map((s) => {
        const lead = s.leadId
          ? (roster.leadBoard.find((l) => l.id === s.leadId)
            ?? getQuestStore().pursued.find((q) => q.lead.id === s.leadId)?.lead)
          : undefined;
        return {
          stepIdx: s.stepIdx,
          plannedRarity: s.plannedRarity,
          status: s.status,
          band: s.band,
          summary: s.summary,
          leadBlurb: lead?.blurb,
          leadDc: lead?.dc,
          leadArchetype: lead?.archetype,
          partyMercNames: (s.partyMercIds ?? []).map((mid) =>
            roster.mercs.find((m) => m.id === mid)?.name
            ?? roster.deceased.find((d) => d.id === mid)?.name
            ?? mid,
          ),
        };
      }),
    })),
  };
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({ ok: true, savePath: DEFAULT_SAVE_PATH }));

  app.get('/api/state', async () => {
    const { roomCatalog } = loadCatalogs();
    const roster = getRoster();
    return { state: snapshotState(roster, roomCatalog) };
  });

  app.get('/api/catalog/rooms', async () => {
    const { roomCatalog } = loadCatalogs();
    return { rooms: [...roomCatalog.values()] };
  });

  app.post('/api/reload', async () => {
    resetCaches();
    return { ok: true };
  });

  app.post('/api/cmd', async (req, reply) => {
    const parsed = CommandSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: 'invalid command', issues: parsed.error.issues });
    }
    const { roomCatalog, tagPool } = loadCatalogs();
    const roster = getRoster();
    const result = await dispatch(roster, parsed.data, { roomCatalog, tagPool });
    if (!result.ok) {
      return reply.code(409).send({ ok: false, error: result.error, state: snapshotState(roster, roomCatalog) });
    }
    saveRoster();
    saveQuestStore();
    return { ok: true, message: result.message, state: snapshotState(roster, roomCatalog) };
  });
}
