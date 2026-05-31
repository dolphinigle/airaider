// sagaSkeletonRunner — cross-check harness for docs/SAGAS.md Phase S-A.
//
// Generates N saga skeletons against the Mireford seed pool, validates each,
// and prints a graded report. Used to verify the AI's saga genesis output
// shape parses correctly and meets the design rules BEFORE building Phase S-B
// (chain-from-saga).
//
// Run: cd engine/server && npx tsx src/chainBible/sagaSkeletonRunner.ts

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { CharacterPool } from './characterPool.js';
import { generateSagaSkeleton, validateSkeleton, type SagaGenesisRequest, type SagaSkeleton, type SkeletonValidation } from './sagaSkeleton.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-saga-skeleton-pool.json';
const TRANSCRIPT_PATH = '/tmp/airaider-saga-skeleton-transcript.md';

interface RunSpec {
  label: string;
  req: Omit<SagaGenesisRequest, 'pool'>;
}

function setupPool(): CharacterPool {
  if (!existsSync(SEED_PATH)) throw new Error(`missing seed pool ${SEED_PATH}`);
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  console.log(`[pool] loaded from ${SEED_PATH}`);
  return pool;
}

function pretty(skel: SagaSkeleton): string {
  const lines: string[] = [];
  lines.push(`workingTitle: "${skel.workingTitle}"`);
  lines.push(`controllingIdea: ${skel.controllingIdea}`);
  lines.push(`antagonistPlan: ${skel.antagonistPlan}`);
  lines.push(`finalImageTarget: ${skel.finalImageTarget}`);
  lines.push(`pinnedCastIds: ${skel.pinnedCastIds.join(', ')}`);
  lines.push(``, `body:`);
  skel.body.forEach((p, i) => lines.push(`  ¶${i + 1}: ${p}`));
  lines.push(``, `phases:`);
  skel.phases.forEach((p, i) => {
    lines.push(`  phase ${i + 1}:`);
    lines.push(`    intent: ${p.intent}`);
    lines.push(`    delivery: ${p.deliveryHint}`);
  });
  return lines.join('\n');
}

function printValidation(v: SkeletonValidation): void {
  console.log(`\n[validate] pass=${v.pass}`);
  for (const e of v.errors) console.log(`  ERROR: ${e}`);
  for (const w of v.warnings) console.log(`  warn:  ${w}`);
}

async function runOne(client: OpenAI, pool: CharacterPool, spec: RunSpec): Promise<{ skel: SagaSkeleton; validation: SkeletonValidation; costUsd: number }> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`>>> RUN: ${spec.label}`);
  console.log(`${'─'.repeat(70)}`);
  const t0 = Date.now();
  const { skeleton, usage, sample, anchor } = await generateSagaSkeleton(client, { ...spec.req, pool });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[gen] ${usage.model} effort=low ${elapsed}s  ${usage.promptTokens}p (${usage.cachedTokens} cached) + ${usage.completionTokens}c  $${usage.costUsd.toFixed(4)}`);
  console.log(`\n=== SAGA SKELETON ===\n${pretty(skeleton)}`);
  const validation = validateSkeleton(skeleton, { ...spec.req, pool }, sample, anchor);
  printValidation(validation);
  return { skel: skeleton, validation, costUsd: usage.costUsd };
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const pool = setupPool();

  const runs: RunSpec[] = [
    {
      label: 'REGIONAL — rare — 4 phases — inciting: a smuggling ring across Mireford',
      req: {
        region: 'Mireford',
        kind: 'regional',
        rarity: 'rare',
        targetPhaseCount: 4,
        perPhaseRewardHints: ['captive_to_dungeon', 'regional_prestige', 'gold', 'captive_to_dungeon'],
        incitingEventBlurb: 'A barge captain washes up dead on the jetty with a sealed Tevin chit nailed to his palm.',
      },
    },
    {
      label: 'REGIONAL — uncommon — 3 phases — no inciting (system pick)',
      req: {
        region: 'Mireford',
        kind: 'regional',
        rarity: 'uncommon',
        targetPhaseCount: 3,
        perPhaseRewardHints: ['regional_prestige', 'gold', 'promote_to_merc'],
      },
    },
    {
      label: 'UNIT — rare — 3 phases — anchor: Tibalt Renn (ghost: vanished brother)',
      req: {
        region: 'Mireford',
        kind: 'unit',
        rarity: 'rare',
        anchorMercId: 'char_tibalt',
        targetPhaseCount: 3,
        perPhaseRewardHints: ['gold', 'captive_to_dungeon', 'unique_trait_on_anchor'],
        incitingEventBlurb: 'A wagoner asks the fort about a courier who vanished on the Coldfen road three winters ago — the description matches Tibalt\'s brother.',
      },
    },
  ];

  let totalCost = 0;
  const results: Array<{ label: string; ok: boolean; warnings: number; cost: number }> = [];
  const md: string[] = [`# Saga Skeleton Playtest — iteration 1`, ``, `Date: ${new Date().toISOString()}`, ``];
  for (const spec of runs) {
    try {
      const { skel, validation, costUsd } = await runOne(client, pool, spec);
      totalCost += costUsd;
      results.push({ label: spec.label, ok: validation.pass, warnings: validation.warnings.length, cost: costUsd });
      md.push(`## ${spec.label}`, ``, `pass=${validation.pass} warnings=${validation.warnings.length} cost=$${costUsd.toFixed(4)}`, ``, '```', pretty(skel), '```', ``);
      if (validation.errors.length) md.push(`**Errors:**`, ...validation.errors.map((e) => `- ${e}`), ``);
      if (validation.warnings.length) md.push(`**Warnings:**`, ...validation.warnings.map((w) => `- ${w}`), ``);
    } catch (e) {
      console.error(`[run failed] ${(e as Error).message}`);
      results.push({ label: spec.label, ok: false, warnings: 0, cost: 0 });
      md.push(`## ${spec.label}`, ``, `**FAILED:** ${(e as Error).message}`, ``);
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.label}  warnings=${r.warnings}  $${r.cost.toFixed(4)}`);
  }
  console.log(`\nTotal cost: $${totalCost.toFixed(4)}`);
  console.log(`Transcript: ${TRANSCRIPT_PATH}`);

  md.push(`---`, ``, `**Total cost:** $${totalCost.toFixed(4)}`, `**Pass count:** ${results.filter((r) => r.ok).length}/${results.length}`);
  writeFileSync(TRANSCRIPT_PATH, md.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
