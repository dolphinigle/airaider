// bibleQuickPlaytest — clinical-voice playtest for BIBLE_SYSTEM.
// Generates 3 bibles non-interactively against the Mireford seed pool and
// prints them so an author can grade voice quality at the scaffold tier.
//
// Run: cd engine/server && npx tsx src/chainBible/bibleQuickPlaytest.ts

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { CharacterPool } from './characterPool.js';
import { generateBible, type BibleRequest, type Bible, type RewardSpec } from './biblePipeline.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-bible-clinical-pool.json';
const TRANSCRIPT_PATH = '/tmp/airaider-bible-clinical-transcript.md';

interface Spec {
  label: string;
  req: Omit<BibleRequest, 'pool'>;
}

const SPECS: Spec[] = [
  {
    label: 'REGIONAL — common — captive_to_dungeon — drowned smuggler at Greyford',
    req: {
      region: 'Mireford',
      rarity: 'common',
      rewardSpec: { kind: 'captive_to_dungeon' },
      seedLeadBlurb: 'A drowned smuggler washed up at Greyford with a sealed letter sewn into his cloak.',
    },
  },
  {
    label: 'REGIONAL — rare — regional_prestige — corrupt magistrate',
    req: {
      region: 'Mireford',
      rarity: 'rare',
      rewardSpec: { kind: 'regional_prestige', amount: 15 },
      seedLeadBlurb: 'Mireford\'s magistrate is taking quiet bribes; a copy of his ledger could be lifted from the assize.',
    },
  },
  {
    label: 'UNIT — rare — unique_trait_on_anchor — Tibalt (vanished brother)',
    req: {
      region: 'Mireford',
      rarity: 'rare',
      rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
      requiredAnchorId: 'char_tibalt',
      isUnitChain: true,
      seedLeadBlurb: 'A wagoner asks the fort if anyone ever found the courier who vanished on the Coldfen road three winters back.',
    },
  },
];

function setupPool(): CharacterPool {
  if (!existsSync(SEED_PATH)) throw new Error(`missing seed pool ${SEED_PATH}`);
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  console.log(`[pool] loaded from ${SEED_PATH}`);
  return pool;
}

function pretty(b: Bible): string {
  const lines: string[] = [];
  lines.push(`title: "${b.title}"`);
  lines.push(`shape: ${b.shape}`);
  lines.push(``, `leadBoardBlurb (PLAYER-FACING — voice allowed):`);
  lines.push(`  ${b.leadBoardBlurb}`);
  lines.push(``, `firstBeatOnramp (SCAFFOLD — clinical):`);
  lines.push(`  ${b.firstBeatOnramp}`);
  lines.push(``, `cast (${b.cast.length}):`);
  for (const c of b.cast) {
    if (c.kind === 'existing') {
      lines.push(`  [existing ${c.roleInChain}] ${c.characterId}`);
      lines.push(`    arcStateAfterChain: ${c.arcStateAfterChain}`);
    } else {
      lines.push(`  [new ${c.roleInChain}] ${c.character.name} (tags: ${c.character.tags.join(',')})`);
      lines.push(`    surface: ${c.character.surface}`);
      lines.push(`    want: ${c.character.want}`);
      lines.push(`    need: ${c.character.need}`);
      lines.push(`    ghost: ${c.character.ghost}`);
      lines.push(`    lie: ${c.character.lie}`);
      lines.push(`    secret: ${c.character.secret}`);
      lines.push(`    arcStateAfterChain: ${c.arcStateAfterChain}`);
    }
  }
  lines.push(``, `surfaceSituation (SCAFFOLD — clinical):`);
  lines.push(`  ${b.surfaceSituation}`);
  lines.push(``, `hiddenSituation (SCAFFOLD — clinical):`);
  lines.push(`  ${b.hiddenSituation}`);
  lines.push(``, `openQuestion (the puzzle the PLAYER solves):`);
  lines.push(`  ${b.openQuestion}`);
  lines.push(``, `mercObservations (${b.mercObservations.length} — what mercs report back):`);
  for (const o of b.mercObservations) lines.push(`  - ${o}`);
  lines.push(``, `playerDecisions (${b.playerDecisions.length} — moments where the player chooses):`);
  for (const d of b.playerDecisions) lines.push(`  - ${d}`);
  lines.push(``, `trajectory (SCAFFOLD — branching, decision-driven):`);
  lines.push(`  ${b.trajectory}`);
  lines.push(``, `setupPayoffs (${b.setupPayoffs.length} — terse):`);
  for (const p of b.setupPayoffs) lines.push(`  plant: ${p.plant}`, `  payoff: ${p.payoff}`);
  lines.push(``, `vignettes (${b.vignettes.length} — world-building, do NOT advance plot):`);
  for (const v of b.vignettes) lines.push(`  - ${v}`);
  lines.push(``, `texture (${b.texture.length} — physical objects/places):`);
  for (const t of b.texture) lines.push(`  - ${t}`);
  lines.push(``, `antagonistHumanity:`);
  lines.push(`  ${b.antagonistHumanity}`);
  if (b.dramaticIrony) lines.push(``, `dramaticIrony (SCAFFOLD — clinical):`, `  ${b.dramaticIrony}`);
  return lines.join('\n');
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const pool = setupPool();

  const transcriptLines: string[] = ['# Bible clinical-voice playtest', ''];
  let totalCost = 0;
  let passCount = 0;

  for (const spec of SPECS) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`>>> SPEC: ${spec.label}`);
    console.log('─'.repeat(70));
    transcriptLines.push(`## ${spec.label}`, '');
    try {
      const t0 = Date.now();
      const { bible, usage } = await generateBible(client, { pool, ...spec.req });
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[gen] ${usage.model} ${dt}s  ${usage.promptTokens}p (${usage.cachedTokens} cached) + ${usage.completionTokens}c  $${usage.costUsd.toFixed(4)}`);
      const body = pretty(bible);
      console.log(`\n=== BIBLE ===\n${body}`);
      transcriptLines.push('```', body, '```', '');
      totalCost += usage.costUsd;
      passCount++;
    } catch (e) {
      console.log(`[run failed] ${(e as Error).message}`);
      transcriptLines.push(`**FAILED:** ${(e as Error).message}`, '');
    }
  }

  console.log(`\n${'═'.repeat(70)}\nSUMMARY: ${passCount}/${SPECS.length} pass, total cost $${totalCost.toFixed(4)}\n═${'═'.repeat(69)}`);
  writeFileSync(TRANSCRIPT_PATH, transcriptLines.join('\n'));
  console.log(`Transcript: ${TRANSCRIPT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
