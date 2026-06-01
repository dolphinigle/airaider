// e2eQuickPlaytest — end-to-end PLAYED chain: bible -> beats -> epilogue.
// Generates the actual text a player reads, so we can grade the PRODUCT, not just the scaffold.
// Run: cd engine/server && npx tsx src/chainBible/e2eQuickPlaytest.ts

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { CharacterPool } from './characterPool.js';
import {
  generateBible, generateBeat, generateEpilogue,
  type BibleRequest, type PriorBeat,
} from './biblePipeline.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-e2e-pool.json';
const OUT = '/tmp/airaider-e2e-transcript.md';

async function main(): Promise<void> {
  if (!existsSync(TMP_POOL)) copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const req: Omit<BibleRequest, 'pool'> = {
    region: 'Mireford',
    rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
    requiredAnchorId: 'char_tibalt',
    isUnitChain: true,
    seedLeadBlurb: 'A wagoner at the gate asks if anyone ever found the courier who vanished on the Coldfen road three winters ago.',
  };

  const out: string[] = [];
  const log = (s = ''): void => { console.log(s); out.push(s); };

  let cost = 0;
  log(`# E2E PLAYED CHAIN — rare unit (Tibalt)\n`);
  const { bible, usage } = await generateBible(client, { ...req, pool });
  cost += usage.costUsd;
  log(`## BIBLE: "${bible.title}" (${bible.shape})  [$${usage.costUsd.toFixed(4)}]`);
  log(`leadBoardBlurb: ${bible.leadBoardBlurb}`);
  log(`trajectory:`); for (const t of bible.trajectory) log(`  - ${t}`);
  log(``);

  const priorBeats: PriorBeat[] = [];
  const maxBeats = 6;
  for (let i = 0; i < maxBeats; i++) {
    const forceClimax = i === maxBeats - 1;
    const { beat, usage: bu } = await generateBeat(client, bible, priorBeats, req.rarity, forceClimax);
    cost += bu.costUsd;
    log(`### BEAT ${i + 1}${beat.isClimax ? ' (CLIMAX)' : ''}  [$${bu.costUsd.toFixed(4)}]`);
    log(`HOOK (player sees on deploy): ${beat.hook}`);
    log(`BODY (played-out success): ${beat.body}`);
    log(``);
    priorBeats.push({ outcome: 'clean-win', hook: beat.hook, body: beat.body, narration: beat.body });
    if (beat.isClimax) break;
  }

  const { epilogue, usage: eu } = await generateEpilogue(client, bible, priorBeats);
  cost += eu.costUsd;
  log(`## EPILOGUE: "${epilogue.title}"  [$${eu.costUsd.toFixed(4)}]`);
  log(epilogue.prose);
  log(``);
  log(`TOTAL COST: $${cost.toFixed(4)} over ${priorBeats.length} beats`);

  writeFileSync(OUT, out.join('\n'));
  console.log(`\nTranscript: ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
