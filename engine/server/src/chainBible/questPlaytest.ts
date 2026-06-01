// questPlaytest — generate actual QUESTS from a character-driven bible and read
// whether the player "feels they're doing something" (agency), or just reads narration.
//
// The bible is generated ONCE (V2 char-spine) and cached to /tmp so quest-writer
// iterations don't regenerate it (keeps the bible constant + saves cost).
//
// Run: cd engine/server && npx tsx src/chainBible/questPlaytest.ts [tibalt|roselle|marek] [--fresh]
//   AIRAIDER_BEAT_MODEL=gpt-5-mini AIRAIDER_BEAT_EFFORT=low  (recommended for a fair read)

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import OpenAI from 'openai';
import { CharacterPool } from './characterPool.js';
import { generateBible, generateBeat, generateEpilogue, type BibleRequest, type Bible, type PriorBeat } from './biblePipeline.js';
import { buildCharSpineSystem, applyHint, HINT_DECK } from './charDrivenPrompt.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-questplay-pool.json';

interface Spec { id: string; rarity: BibleRequest['rarity']; hintId: string; req: Omit<BibleRequest, 'pool'>; }
const SPECS: Record<string, Spec> = {
  tibalt: { id: 'tibalt', rarity: 'rare', hintId: 'grief-unsaid', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
    requiredAnchorId: 'char_tibalt', isUnitChain: true,
    seedLeadBlurb: 'A wagoner asks the fort if anyone ever found the courier who vanished on the Coldfen road three winters back.' } },
  roselle: { id: 'roselle', rarity: 'rare', hintId: 'faith-performed', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_roselle', traitName: 'Quiet Vigil' },
    requiredAnchorId: 'char_roselle', isUnitChain: true,
    seedLeadBlurb: 'A grieving family at Penholt begs for someone to recover a relic the abbey says was never theirs.' } },
  marek: { id: 'marek', rarity: 'rare', hintId: 'mercy-cowardice', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'captive_to_dungeon' },
    seedLeadBlurb: 'A drowned man washed up at Greyford with a sealed letter sewn into his cloak.' } },
};

function setupPool(): CharacterPool {
  if (!existsSync(SEED_PATH)) throw new Error(`missing seed pool ${SEED_PATH}`);
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  return pool;
}

async function getBible(client: OpenAI, spec: Spec, fresh: boolean): Promise<{ bible: Bible; cost: number }> {
  const cachePath = `/tmp/airaider-bible-${spec.id}.json`;
  if (!fresh && existsSync(cachePath)) {
    return { bible: JSON.parse(readFileSync(cachePath, 'utf8')) as Bible, cost: 0 };
  }
  const pool = setupPool();
  const hint = HINT_DECK.find((h) => h.id === spec.hintId)!;
  const req = applyHint(spec.req, hint);
  const { bible, usage } = await generateBible(client, { pool, ...req }, buildCharSpineSystem());
  writeFileSync(cachePath, JSON.stringify(bible, null, 2));
  return { bible, cost: usage.costUsd };
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });

  const which = (process.argv[2] ?? 'tibalt').toLowerCase();
  const fresh = process.argv.includes('--fresh');
  const spec = SPECS[which];
  if (!spec) throw new Error(`unknown spec ${which}`);

  const out: string[] = [];
  const log = (s: string) => { out.push(s); console.log(s); };

  let cost = 0;
  const { bible, cost: bcost } = await getBible(client, spec, fresh);
  cost += bcost;

  log(`# QUEST PLAYTEST — ${spec.id} (${bible.shape})  beatModel=${process.env.AIRAIDER_BEAT_MODEL ?? 'gpt-5-nano'}/${process.env.AIRAIDER_BEAT_EFFORT ?? 'minimal'}`);
  log(``);
  log(`## BIBLE: "${bible.title}"`);
  log(`leadBoardBlurb: ${bible.leadBoardBlurb}`);
  log(`hiddenSituation: ${bible.hiddenSituation}`);
  log(`trajectory:`); for (const t of bible.trajectory) log(`  - ${t}`);
  log(``);
  log(`## PLAYED CHAIN (assume clean-win each beat)`);
  log(``);

  const priorBeats: PriorBeat[] = [];
  const maxBeats = 6;
  for (let i = 0; i < maxBeats; i++) {
    const forceClimax = i === maxBeats - 1;
    const { beat, usage } = await generateBeat(client, bible, priorBeats, spec.rarity, forceClimax);
    cost += usage.costUsd;
    log(`### QUEST ${i + 1}${beat.isClimax ? ' — CLIMAX' : ''}`);
    log(`HOOK (deploy screen): ${beat.hook}`);
    log(`BODY (outcome on success): ${beat.body}`);
    log(``);
    priorBeats.push({ outcome: 'clean-win', hook: beat.hook, body: beat.body, narration: beat.body });
    if (beat.isClimax) break;
  }

  const { epilogue, usage: eu } = await generateEpilogue(client, bible, priorBeats);
  cost += eu.costUsd;
  log(`## EPILOGUE: "${epilogue.title}"`);
  log(epilogue.prose);
  log(``);
  log(`TOTAL COST $${cost.toFixed(4)} over ${priorBeats.length} quests`);

  const outPath = `/tmp/airaider-questplay-${spec.id}.md`;
  writeFileSync(outPath, out.join('\n'));
  console.log(`\nTranscript: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
