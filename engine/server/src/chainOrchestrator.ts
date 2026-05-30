// PROTO-GAME v16: Quest-chain orchestration (between dispatch & AI calls).
//
// dispatch.ts is already long; chain genesis + step-spawn + epilogue glue
// lives here so dispatch only needs ~5 call sites. All state mutations
// happen on the passed-in roster.

import { randomBytes } from 'node:crypto';
import type { Roster } from '../../../prototype/src/roster.js';
import { appendFortLog } from '../../../prototype/src/roster.js';
import type { Tag, Merc } from '../../../prototype/src/types.js';
import {
  type QuestChain,
  type ChainStep,
  type ChainKind,
  plannedStepCount,
  plannedRarityCurve,
  chainDigest,
  bandToStepStatus,
  isStepSuccessful,
  isStepCatastrophic,
  downshiftRarity,
  blurbMentionsAnchor,
} from '../../../prototype/src/questChain.js';
import {
  generateLead,
  type Lead,
  type LeadRarity,
  type LeadArchetype,
  ARCHETYPES,
  EXPIRY_BY_RARITY,
  PURSUE_COST_BY_RARITY,
} from '../../../prototype/src/leads.js';
import {
  generateChainGenesis,
  generateChainStepBlurb,
  generateChainEpilogue,
  summarizeStep,
  type GenesisInput,
} from './aiQuestChain.js';

/** Cap on simultaneously active chains. */
export const ACTIVE_CHAIN_CAP = 3;

/** Default follow-up chance per chain rarity. */
export const FOLLOWUP_CHANCE: Record<LeadRarity, number> = {
  common: 5, uncommon: 15, rare: 35, legendary: 60,
};
/** Test-only: when AIRAIDER_CHAIN_PLAYTEST=1, multiply genesis triggers
 *  for fast iteration. */
const PLAYTEST_MODE = process.env.AIRAIDER_CHAIN_PLAYTEST === '1';

function uid(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex')}`;
}

export function activeChains(roster: Roster): QuestChain[] {
  return roster.questChains.filter((c) => c.status === 'active');
}

/** Spawn genesis after a player-pursued rare/legendary lead resolved
 *  favorably. Lazy: skeleton + step 0 lead are generated AFTER the genesis
 *  call returns. Returns the new chain or null if blocked (cap reached,
 *  AI unavailable, parse failed). */
export async function trySpawnWorldChain(
  roster: Roster,
  opts: {
    seedLead: Lead;
    chainRarity: LeadRarity;
    partyTagLabels: readonly string[];
  },
): Promise<QuestChain | null> {
  if (activeChains(roster).length >= ACTIVE_CHAIN_CAP) {
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `(chain limit reached — saga from "${opts.seedLead.blurb.slice(0, 40)}…" deferred)`,
    });
    return null;
  }
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const input: GenesisInput = {
      seedReason: `${opts.chainRarity} ${opts.seedLead.archetype} resolved favorably`,
      seedLeadBlurb: opts.seedLead.blurb,
      region: opts.seedLead.region,
      chainRarity: opts.chainRarity,
      themeTagLabels: opts.partyTagLabels,
    };
    const gen = await generateChainGenesis(input);
    const chain = freshChain({
      kind: 'world',
      seedLeadId: opts.seedLead.id,
      region: opts.seedLead.region,
      chainRarity: opts.chainRarity,
      genesis: gen,
      startedDay: roster.dayCount,
    });
    roster.questChains.push(chain);
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `SAGA BEGINS: "${chain.title}" — ${chain.hook}`,
    });
    console.log(`[chain] genesis ${chain.id} "${chain.title}" (${chain.steps.length} steps, ${chain.chainRarity})`);
    return chain;
  } catch (err: any) {
    console.warn(`[chain] genesis failed: ${err?.message ?? String(err)}`);
    return null;
  }
}

/** Spawn a unit chain anchored on a specific merc. */
export async function trySpawnUnitChain(
  roster: Roster,
  opts: {
    anchor: Merc;
    chainRarity: LeadRarity;
    region: string;
    reason: string;
  },
): Promise<QuestChain | null> {
  if (activeChains(roster).length >= ACTIVE_CHAIN_CAP) return null;
  if (!process.env.OPENAI_API_KEY) return null;
  // Don't double-anchor.
  if (roster.questChains.some((c) => c.status === 'active' && c.unitId === opts.anchor.id)) {
    return null;
  }
  try {
    const input: GenesisInput = {
      seedReason: opts.reason,
      region: opts.region,
      chainRarity: opts.chainRarity,
      themeTagLabels: opts.anchor.tags.map((t) => t.label),
      anchorMerc: {
        name: opts.anchor.name,
        ...(opts.anchor.backstory ? { backstory: opts.anchor.backstory } : {}),
        tagLabels: opts.anchor.tags.map((t) => t.label),
      },
    };
    const gen = await generateChainGenesis(input);
    const chain = freshChain({
      kind: 'unit',
      unitId: opts.anchor.id,
      region: opts.region,
      chainRarity: opts.chainRarity,
      genesis: gen,
      startedDay: roster.dayCount,
    });
    roster.questChains.push(chain);
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `SAGA BEGINS for ${opts.anchor.name}: "${chain.title}" — ${chain.hook}`,
    });
    console.log(`[chain] unit-genesis ${chain.id} "${chain.title}" anchor=${opts.anchor.name}`);
    return chain;
  } catch (err: any) {
    console.warn(`[chain] unit-genesis failed: ${err?.message ?? String(err)}`);
    return null;
  }
}

function freshChain(opts: {
  kind: ChainKind;
  unitId?: string;
  seedLeadId?: string;
  region: string;
  chainRarity: LeadRarity;
  genesis: Awaited<ReturnType<typeof generateChainGenesis>>;
  startedDay: number;
}): QuestChain {
  const stepCount = plannedStepCount(opts.chainRarity);
  const curve = plannedRarityCurve(opts.chainRarity);
  const steps: ChainStep[] = Array.from({ length: stepCount }, (_, i) => ({
    stepIdx: i,
    plannedRarity: curve[i]!,
    originalPlannedRarity: curve[i]!,
    status: 'pending',
    partyMercIds: [],
  }));
  const chain: QuestChain = {
    id: uid('chain'),
    kind: opts.kind,
    chainRarity: opts.chainRarity,
    region: opts.region,
    skeleton: opts.genesis.skeleton,
    anchors: opts.genesis.anchors,
    stepBeats: opts.genesis.stepBeats,
    title: opts.genesis.title,
    hook: opts.genesis.hook,
    themeTagIds: [],
    steps,
    currentStepIdx: 0,
    status: 'active',
    startedDay: opts.startedDay,
    ...(opts.unitId ? { unitId: opts.unitId } : {}),
    ...(opts.seedLeadId ? { seedLeadId: opts.seedLeadId } : {}),
  };
  return chain;
}

/** Spawn the lead for the current step of every active chain that doesn't
 *  yet have one on the board. Called from end-day after resolutions. */
export async function spawnPendingStepLeads(roster: Roster): Promise<void> {
  for (const chain of activeChains(roster)) {
    const step = chain.steps[chain.currentStepIdx];
    if (!step) continue;
    if (step.leadId) {
      // Lead still on board (player hasn't pursued yet) OR moved into a
      // pursued quest. Either way: don't double-spawn. If the lead expired
      // off the board without pursuit, the chain stalls — player ignored
      // the saga step. Acceptable prototype behavior.
      const stillOnBoard = roster.leadBoard.some((l) => l.id === step.leadId);
      if (stillOnBoard) continue;
      // Lead is either in-flight (pursued) or expired. Don't respawn —
      // pursuing or letting it expire is the player's choice.
      continue;
    }
    // Unit chain: if anchor is dead, fail the chain immediately and skip spawning.
    if (chain.kind === 'unit' && chain.unitId) {
      const anchor = roster.mercs.find((m) => m.id === chain.unitId);
      if (!anchor) {
        // Anchor not in roster anymore (died or left). Finalize.
        const isDead = roster.deceased.some((d) => d.id === chain.unitId);
        await finalizeChain(roster, chain, isDead ? 'failed' : 'completed', {
          anchorDied: isDead,
          ...(isDead ? { anchorName: chain.unitId } : {}),
        });
        continue;
      }
    }
    await spawnStepLead(roster, chain, step);
  }
}

async function spawnStepLead(roster: Roster, chain: QuestChain, step: ChainStep): Promise<void> {
  // Pick archetype matching the beat (engine-side: random for now; future
  // could parse beat keywords).
  const archetype: LeadArchetype = pickArchetype(chain, step);
  const baseLead = generateLead({
    seed: `chain-${chain.id}-step${step.stepIdx}-d${roster.dayCount}`,
    postedDay: roster.dayCount,
    rarityWeights: makeForcedWeights(step.plannedRarity),
  });
  // Force the engine fields we care about (rarity already forced via weights;
  // override archetype + region for chain coherence).
  let lead: Lead = {
    ...baseLead,
    archetype,
    region: chain.region,
    // Extra expiry: chain steps live LONGER than regular leads so the
    // anchor merc has time to recover.
    expiryDay: roster.dayCount + EXPIRY_BY_RARITY[step.plannedRarity] + 3,
    pursueCost: PURSUE_COST_BY_RARITY[step.plannedRarity],
    chainStepRef: { chainId: chain.id, stepIdx: step.stepIdx, chainTitle: chain.title },
  };

  // Get AI-authored hook (with anchor-mention validation).
  try {
    const priorHooks = chain.steps
      .slice(0, step.stepIdx)
      .map((s) => s.blurb)
      .filter((b): b is string => !!b);
    const digest = chainDigest(chain, priorHooks);
    const hook = await generateChainStepBlurb({
      chain,
      digest,
      stepIdx: step.stepIdx,
      beat: chain.stepBeats[step.stepIdx]!,
      plannedRarity: step.plannedRarity,
      originalPlannedRarity: step.originalPlannedRarity,
      archetype,
      dc: lead.dc,
      rewardGold: lead.rewardGold,
    });
    const mention = blurbMentionsAnchor(hook, chain.anchors, step.stepIdx);
    if (!mention) {
      console.warn(`[chain] step ${step.stepIdx} of ${chain.id} blurb has NO anchor mention — using anyway: "${hook}"`);
    } else {
      console.log(`[chain] step ${step.stepIdx} of ${chain.id} mentions "${mention}"`);
    }
    lead = { ...lead, blurb: hook };
  } catch (err: any) {
    console.warn(`[chain] step blurb failed (using template): ${err?.message ?? String(err)}`);
    // Use template blurb (already in lead.blurb from generateLead).
  }

  step.leadId = lead.id;
  step.blurb = lead.blurb;
  step.status = 'active';
  roster.leadBoard.push(lead);
  appendFortLog(roster, {
    day: roster.dayCount,
    kind: 'note',
    message: `[${chain.title}] step ${step.stepIdx + 1}/${chain.steps.length}: ${lead.blurb}`,
  });
}

function pickArchetype(chain: QuestChain, step: ChainStep): LeadArchetype {
  // Deterministic-ish per chain+step: rotate through archetypes weighted by chain rarity.
  // Climax step prefers raid/captive (action); earlier steps prefer recovery/heist/contract.
  const isClimax = step.stepIdx === chain.steps.length - 1;
  const pool: LeadArchetype[] = isClimax
    ? (['raid', 'captive', 'heist'] as LeadArchetype[])
    : (ARCHETYPES.filter((a) => a !== 'raid') as LeadArchetype[]);
  const seed = `${chain.id}-step${step.stepIdx}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length]!;
}

function makeForcedWeights(target: LeadRarity): Record<LeadRarity, number> {
  // Make generateLead always pick target.
  const w: Record<LeadRarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  w[target] = 1;
  return w;
}

/** Advance a chain after one of its step leads resolved. Called from
 *  dispatch after the normal resolution flow records reward/casualties. */
export async function advanceChainAfterResolution(
  roster: Roster,
  chainId: string,
  stepIdx: number,
  band: 'favorable' | 'unfavorable' | 'catastrophic' | 'catastrophic-favorable',
  outcomeNarrative: string,
  partyMercIds: readonly string[],
): Promise<void> {
  const chain = roster.questChains.find((c) => c.id === chainId);
  if (!chain) {
    console.warn(`[chain] advance: chain ${chainId} not found`);
    return;
  }
  if (chain.status !== 'active') return;
  const step = chain.steps[stepIdx];
  if (!step) return;
  const newStatus = bandToStepStatus(band);
  step.status = newStatus;
  step.band = band;
  step.resolvedDay = roster.dayCount;
  step.partyMercIds = [...partyMercIds];
  step.summary = summarizeStep(outcomeNarrative, band);
  step.leadId = undefined;

  // Apply morale-fraying / downshift rules.
  const consecutiveUnfav = (() => {
    let n = 0;
    for (let i = stepIdx; i >= 0; i--) {
      if (chain.steps[i]!.status === 'resolved-unfavorable') n++;
      else break;
    }
    return n;
  })();
  if (band === 'catastrophic' || band === 'catastrophic-favorable') {
    // Downshift remaining steps' plannedRarity by 1.
    for (let i = stepIdx + 1; i < chain.steps.length; i++) {
      const s = chain.steps[i]!;
      s.plannedRarity = downshiftRarity(s.plannedRarity);
    }
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `[${chain.title}] catastrophic outcome — remaining steps drop one tier`,
    });
  }
  if (consecutiveUnfav >= 2) {
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `[${chain.title}] morale fraying — two failures in a row`,
    });
  }

  const isLast = stepIdx === chain.steps.length - 1;
  if (isLast) {
    // Chain ends. Status depends on final band.
    const finalStatus: 'completed' | 'failed' =
      isStepSuccessful(newStatus) ? 'completed' : 'failed';
    await finalizeChain(roster, chain, finalStatus, {});
    return;
  }
  // Hard fail: catastrophic on second-to-last step OR catastrophic with no successes recorded.
  if (isStepCatastrophic(newStatus) && stepIdx === chain.steps.length - 2) {
    await finalizeChain(roster, chain, 'failed', {});
    return;
  }
  chain.currentStepIdx = stepIdx + 1;
  // Next step lead will be spawned at end-of-day by spawnPendingStepLeads.
}

export async function finalizeChain(
  roster: Roster,
  chain: QuestChain,
  status: 'completed' | 'failed',
  opts: { anchorDied?: boolean; anchorName?: string },
): Promise<void> {
  chain.status = status;
  chain.endedDay = roster.dayCount;
  // Final band defaults to last resolved step's band (or unfavorable).
  const lastStep = [...chain.steps].reverse().find((s) => s.band) ?? chain.steps[chain.steps.length - 1]!;
  const finalBand = lastStep.band ?? 'unfavorable';
  const partyAll = Array.from(new Set(chain.steps.flatMap((s) => s.partyMercIds ?? [])))
    .map((mid) => roster.mercs.find((m) => m.id === mid)?.name ?? roster.deceased.find((d) => d.id === mid)?.name ?? mid);

  let epilogue = '';
  try {
    epilogue = await generateChainEpilogue({
      chain,
      finalBand,
      partyAcrossAllSteps: partyAll,
      ...(opts.anchorDied !== undefined ? { anchorDied: opts.anchorDied } : {}),
      ...(opts.anchorName !== undefined ? { anchorName: opts.anchorName } : {}),
    });
  } catch (err: any) {
    console.warn(`[chain] epilogue failed: ${err?.message ?? String(err)}`);
    epilogue = `The saga of "${chain.title}" ended ${status}. ${chain.anchors.centralNpc} and the ${chain.anchors.antagonistFaction} fade into rumour.`;
  }
  chain.epilogue = epilogue;
  appendFortLog(roster, {
    day: roster.dayCount,
    kind: 'event',
    message: `SAGA ENDS [${status}]: "${chain.title}" — ${epilogue}`,
  });
  console.log(`[chain] ${status}: "${chain.title}" — ${epilogue.slice(0, 200)}`);

  // Unit chains: append to anchor merc's backstory.
  if (chain.kind === 'unit' && chain.unitId) {
    const anchor = roster.mercs.find((m) => m.id === chain.unitId);
    if (anchor) {
      const prior = anchor.backstory ?? '';
      // Bound growth: keep up to 2 epilogues.
      const sections = prior.split('\n\n').filter((s) => s.trim().length > 0);
      sections.push(`SAGA — ${chain.title}: ${epilogue}`);
      const kept = sections.slice(Math.max(0, sections.length - 3));
      (anchor as Merc).backstory = kept.join('\n\n');
    }
  }

  // Roll follow-up.
  await maybeSpawnFollowup(roster, chain);
}

async function maybeSpawnFollowup(roster: Roster, prior: QuestChain): Promise<void> {
  if (prior.status !== 'completed') return;
  const chance = PLAYTEST_MODE ? Math.min(95, FOLLOWUP_CHANCE[prior.chainRarity] * 2) : FOLLOWUP_CHANCE[prior.chainRarity];
  if (Math.random() * 100 > chance) return;
  if (activeChains(roster).length >= ACTIVE_CHAIN_CAP) return;
  if (!process.env.OPENAI_API_KEY) return;
  // Rarity bump (capped).
  const order: LeadRarity[] = ['common', 'uncommon', 'rare', 'legendary'];
  const i = order.indexOf(prior.chainRarity);
  const nextRarity = order[Math.min(order.length - 1, i + 1)]!;
  // Anchor: unit-chain follow-ups inherit anchor IF still alive.
  let anchor: Merc | undefined;
  if (prior.kind === 'unit' && prior.unitId) {
    anchor = roster.mercs.find((m) => m.id === prior.unitId);
    if (!anchor) return; // no follow-up if anchor gone
  }
  try {
    const themeTags: readonly string[] = anchor ? anchor.tags.map((t: Tag) => t.label) : prior.themeTagIds;
    const input: GenesisInput = {
      seedReason: `sequel to "${prior.title}"`,
      region: prior.region,
      chainRarity: nextRarity,
      themeTagLabels: themeTags,
      priorEpilogue: prior.epilogue ?? '',
      ...(anchor ? {
        anchorMerc: {
          name: anchor.name,
          ...(anchor.backstory ? { backstory: anchor.backstory } : {}),
          tagLabels: anchor.tags.map((t) => t.label),
        },
      } : {}),
    };
    const gen = await generateChainGenesis(input);
    const followup = freshChain({
      kind: prior.kind,
      ...(anchor ? { unitId: anchor.id } : {}),
      region: prior.region,
      chainRarity: nextRarity,
      genesis: gen,
      startedDay: roster.dayCount,
    });
    followup.priorChainId = prior.id;
    roster.questChains.push(followup);
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'note',
      message: `SEQUEL SAGA: "${followup.title}" — ${followup.hook}`,
    });
    console.log(`[chain] follow-up ${followup.id} (${nextRarity}) from ${prior.id}`);
  } catch (err: any) {
    console.warn(`[chain] follow-up genesis failed: ${err?.message ?? String(err)}`);
  }
}

/** Heuristic genesis trigger after a resolution. Called from dispatch. */
export interface PostResolveContext {
  rarity: LeadRarity;
  band: 'favorable' | 'unfavorable' | 'catastrophic' | 'catastrophic-favorable';
  partyMercs: readonly Merc[];
  chainStepRef?: { chainId: string; stepIdx: number };
}

/** % chance to spawn a world chain after a normal (non-chain) resolution.
 *  Prototype defaults are AGGRESSIVE so playtesting actually exercises chains
 *  — once balance tuning starts these will drop a tier (e.g. rare→25%). */
const WORLD_CHAIN_TRIGGER: Record<LeadRarity, number> = {
  common: 0, uncommon: 10, rare: 80, legendary: 100,
};

export async function maybeTriggerWorldChainFromResolution(
  roster: Roster,
  lead: Lead,
  ctx: PostResolveContext,
): Promise<void> {
  if (ctx.chainStepRef) return; // already part of a chain
  if (ctx.band !== 'favorable' && ctx.band !== 'catastrophic-favorable') return;
  const chance = PLAYTEST_MODE
    ? Math.min(100, WORLD_CHAIN_TRIGGER[ctx.rarity] * 2)
    : WORLD_CHAIN_TRIGGER[ctx.rarity];
  if (Math.random() * 100 > chance) return;
  await trySpawnWorldChain(roster, {
    seedLead: lead,
    chainRarity: ctx.rarity,
    partyTagLabels: ctx.partyMercs.flatMap((m) => m.tags.map((t) => t.label)),
  });
}

/** Phase B: rare+ tag applicant trigger. Called from accept-applicant
 *  dispatch handler. */
export async function maybeTriggerUnitChainFromAcceptance(
  roster: Roster,
  accepted: Merc,
): Promise<void> {
  const rareOrBetter = accepted.tags.some((t: Tag) =>
    (t as Tag & { rarity?: string }).rarity === 'rare' ||
    (t as Tag & { rarity?: string }).rarity === 'legendary'
  );
  if (!rareOrBetter) return;
  const highest = accepted.tags
    .map((t) => (t as Tag & { rarity?: string }).rarity ?? 'common')
    .reduce((best, cur) => rarityRank(cur) > rarityRank(best) ? cur : best, 'common');
  const chainRarity = (highest === 'legendary' ? 'legendary' : 'rare') as LeadRarity;
  // Prototype: rare+ tag → 80% unit chain (tune down once balance starts).
  const chance = PLAYTEST_MODE ? 100 : 80;
  if (Math.random() * 100 > chance) return;
  // Default region: re-use roster region rotation by hashing merc id.
  const REGIONS_LOCAL = ['Crow\'s Ford', 'Pinewood', 'Greythorn', 'Eastfen', 'Saltmire', 'Blackmoor', 'Ironvale'];
  let h = 0;
  for (const c of accepted.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const region = REGIONS_LOCAL[h % REGIONS_LOCAL.length]!;
  await trySpawnUnitChain(roster, {
    anchor: accepted,
    chainRarity,
    region,
    reason: `${accepted.name} carries a ${chainRarity}-tier tag — their personal saga unfolds`,
  });
}

function rarityRank(r: string): number {
  return ['common', 'uncommon', 'rare', 'legendary'].indexOf(r);
}
