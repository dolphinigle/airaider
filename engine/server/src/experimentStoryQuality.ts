// Story-quality experimentation harness.
//
// Spawns N chain geneses + step blurbs + epilogues against a chosen model
// config, dumps outputs and token counts to stdout + a structured JSON file.
//
// Usage:
//   cd engine/server
//   AIRAIDER_LLM_GENESIS_MODEL=gpt-4.1 AIRAIDER_LLM_EPILOGUE_MODEL=gpt-4.1 \
//   AIRAIDER_LLM_STEPBLURB_MODEL=gpt-4o-mini \
//   npx tsx src/experimentStoryQuality.ts <label>

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import {
  generateChainGenesis,
  generateChainStepBlurb,
  generateChainEpilogue,
} from './aiQuestChain.js';
import { recentLLMLog } from './llmLog.js';
import {
  chainDigest,
  type QuestChain,
  type ChainStep,
} from '../../../prototype/src/questChain.js';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) {
  console.error('Need OPENAI_API_KEY');
  process.exit(1);
}

const label = process.argv[2] ?? 'unlabeled';
const outDir = resolve('/home/irvan/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/experiments');
mkdirSync(outDir, { recursive: true });

// Three fixed seeds across diverse regions/themes so we can compare runs
// apples-to-apples regardless of model.
const SEEDS = [
  {
    region: 'Mireford',
    chainRarity: 'rare' as const,
    seedReason: 'rare lead resolved favorably',
    seedLeadBlurb: 'A drowned smuggler washed up at Greyford with the Vellis family seal stitched into his cloak. Marek recognised the cipher.',
    themeTagLabels: ['veteran', 'haunted', 'oath-bound'],
  },
  {
    region: 'Highholt',
    chainRarity: 'rare' as const,
    seedReason: 'rare-tag applicant accepted (unit chain)',
    anchorMerc: {
      name: 'Roselle Vance',
      backstory: 'Former monastery scribe; ran when the abbot was hanged; carries a small enamelled icon she never explains.',
      tagLabels: ['lettered', 'light-footed', 'haunted'],
    },
    themeTagLabels: ['lettered', 'light-footed', 'haunted'],
  },
  {
    region: 'Coldwater Coast',
    chainRarity: 'legendary' as const,
    seedReason: 'legendary lead resolved favorably',
    seedLeadBlurb: 'A salt-blistered courier reached Saltgate at dusk with a writ bearing the Doge of Ardun\'s personal seal. No one knows why he asked for the company by name.',
    themeTagLabels: ['noble', 'oath-bound', 'mythic'],
  },
];

interface RunResult {
  seedIdx: number;
  title: string;
  hook: string;
  centralNpc: string;
  antagonist: string;
  places: readonly string[];
  skeleton: string;
  steps: { idx: number; band: string; hook: string }[];
  epilogue: string;
  llmCalls: number;
  promptTokens: number;
  completionTokens: number;
}

function tally(): { calls: number; pIn: number; pOut: number } {
  const log = recentLLMLog(10000);
  let pIn = 0,
    pOut = 0;
  for (const e of log) {
    pIn += e.promptTokens ?? 0;
    pOut += e.completionTokens ?? 0;
  }
  return { calls: log.length, pIn, pOut };
}

async function runOne(seedIdx: number): Promise<RunResult> {
  const seed = SEEDS[seedIdx];
  const before = tally();

  const genesis = await generateChainGenesis({
    seedReason: seed.seedReason,
    seedLeadBlurb: 'seedLeadBlurb' in seed ? seed.seedLeadBlurb : undefined,
    region: seed.region,
    chainRarity: seed.chainRarity,
    themeTagLabels: seed.themeTagLabels,
    anchorMerc: 'anchorMerc' in seed ? seed.anchorMerc : undefined,
  });

  // Build a fake chain so we can call step + epilogue.
  const chain: QuestChain = {
    id: `exp_${Date.now()}_${seedIdx}`,
    kind: 'anchorMerc' in seed ? 'unit' : 'world',
    chainRarity: seed.chainRarity,
    region: seed.region,
    skeleton: genesis.skeleton,
    anchors: genesis.anchors,
    stepBeats: genesis.stepBeats,
    title: genesis.title,
    hook: genesis.hook,
    themeTagIds: [],
    steps: [],
    currentStepIdx: 0,
    status: 'active',
    startedDay: 0,
  };

  // Walk steps. Alternate bands so we exercise continuity logic.
  const bands = ['favorable', 'unfavorable', 'favorable', 'favorable', 'favorable'] as const;
  const stepOut: { idx: number; band: string; hook: string }[] = [];
  for (let i = 0; i < genesis.stepBeats.length; i++) {
    const beat = genesis.stepBeats[i];
    const digest = chainDigest(chain, []);
    const hook = await generateChainStepBlurb({
      chain,
      digest,
      stepIdx: i,
      beat,
      plannedRarity: seed.chainRarity,
      originalPlannedRarity: seed.chainRarity,
      archetype: 'patrol',
      dc: 12 + i,
      rewardGold: 20 + i * 5,
    });
    const band = bands[i] ?? 'favorable';
    const summary = `[${band}] ${hook.slice(0, 100)}`;
    const step: ChainStep = {
      stepIdx: i,
      plannedRarity: seed.chainRarity,
      originalPlannedRarity: seed.chainRarity,
      blurb: hook,
      status: band === 'favorable' ? 'resolved-favorable' : 'resolved-unfavorable',
      summary,
      band,
      partyMercIds: [],
    };
    chain.steps.push(step);
    stepOut.push({ idx: i, band, hook });
  }

  const epilogue = await generateChainEpilogue({
    chain,
    finalBand: 'favorable',
    partyAcrossAllSteps: ['Marek', 'Roselle', 'Tibalt'],
  });

  const after = tally();
  return {
    seedIdx,
    title: genesis.title,
    hook: genesis.hook,
    centralNpc: genesis.anchors.centralNpc,
    antagonist: genesis.anchors.antagonistFaction,
    places: genesis.anchors.recurringPlaces,
    skeleton: genesis.skeleton,
    steps: stepOut,
    epilogue,
    llmCalls: after.calls - before.calls,
    promptTokens: after.pIn - before.pIn,
    completionTokens: after.pOut - before.pOut,
  };
}

function priceUSD(model: string, pIn: number, pOut: number): number {
  // Prices per 1M tokens (May 2026 standard table).
  const T: Record<string, [number, number]> = {
    'gpt-4o-mini': [0.15, 0.6],
    'gpt-4.1-nano': [0.1, 0.4],
    'gpt-4.1-mini': [0.4, 1.6],
    'gpt-4.1': [2.0, 8.0],
    'gpt-4o': [2.5, 10.0],
    'gpt-5-nano': [0.05, 0.4],
    'gpt-5-mini': [0.25, 2.0],
    'gpt-5': [1.25, 10.0],
  };
  const [pi, po] = T[model] ?? [0, 0];
  return (pIn * pi + pOut * po) / 1_000_000;
}

async function main() {
  console.log(`==== experiment ${label} ====`);
  console.log(`GENESIS  model: ${process.env.AIRAIDER_LLM_GENESIS_MODEL ?? process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-4o-mini'}`);
  console.log(`EPILOGUE model: ${process.env.AIRAIDER_LLM_EPILOGUE_MODEL ?? process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-4o-mini'}`);
  console.log(`STEPBLRB model: ${process.env.AIRAIDER_LLM_STEPBLURB_MODEL ?? process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini'}`);
  console.log('');

  const results: RunResult[] = [];
  for (let i = 0; i < SEEDS.length; i++) {
    try {
      console.log(`--- seed ${i}: ${SEEDS[i].region} ${SEEDS[i].chainRarity} ---`);
      const r = await runOne(i);
      results.push(r);
      console.log(`title: ${r.title}`);
      console.log(`hook : ${r.hook}`);
      console.log(`npc/ant: ${r.centralNpc} / ${r.antagonist}`);
      console.log(`places: ${r.places.join(', ')}`);
      console.log(`steps:`);
      for (const s of r.steps) console.log(`  ${s.idx} [${s.band}]: ${s.hook}`);
      console.log(`EPILOGUE: ${r.epilogue}`);
      console.log(`tokens: ${r.promptTokens} in / ${r.completionTokens} out  (${r.llmCalls} calls)`);
      console.log('');
    } catch (e) {
      console.error(`seed ${i} failed:`, e);
    }
  }

  // Cost estimate using the genesis-model as the dominant one (cheap heuristic).
  const totalIn = results.reduce((a, r) => a + r.promptTokens, 0);
  const totalOut = results.reduce((a, r) => a + r.completionTokens, 0);
  const dominantModel =
    process.env.AIRAIDER_LLM_GENESIS_MODEL ?? process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-4o-mini';
  const costRough = priceUSD(dominantModel, totalIn, totalOut);
  console.log(`TOTAL: ${totalIn} in / ${totalOut} out`);
  console.log(`rough cost (all-at-${dominantModel} rate): $${costRough.toFixed(4)}`);

  const outPath = `${outDir}/${label}.json`;
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        label,
        env: {
          genesis: process.env.AIRAIDER_LLM_GENESIS_MODEL ?? process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-4o-mini',
          epilogue: process.env.AIRAIDER_LLM_EPILOGUE_MODEL ?? process.env.AIRAIDER_LLM_NARRATIVE_MODEL ?? 'gpt-4o-mini',
          step: process.env.AIRAIDER_LLM_STEPBLURB_MODEL ?? process.env.AIRAIDER_LLM_MODEL ?? 'gpt-4o-mini',
        },
        totalIn,
        totalOut,
        costRough,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
