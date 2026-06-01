// storyGen/genesis — CLI wrapper around the bible generator in chainGen.ts.
//
// Run: cd engine/server && AIRAIDER_BIBLE_MODEL=gpt-5-mini AIRAIDER_BIBLE_EFFORT=low \
//        npx tsx src/storyGen/genesis.ts [seedId] [--anchor <charId>]

import { join } from 'path';
import { writeFileSync, copyFileSync } from 'fs';
import { CharacterPool } from '../chainBible/characterPool.js';
import { pickSeed, seedById } from './seeds.js';
import { makeClient } from './ai.js';
import { buildBible, renderBible, BIBLE_MODEL, BIBLE_EFFORT } from './chainGen.js';

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-storygen-pool.json';

function setupPool(): CharacterPool {
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  return pool;
}

async function main(): Promise<void> {
  const client = makeClient();

  const seedArg = process.argv[2];
  const anchorIdx = process.argv.indexOf('--anchor');
  const anchorId = anchorIdx >= 0 ? process.argv[anchorIdx + 1] : undefined;
  const seed = seedArg && !seedArg.startsWith('--') ? (seedById(seedArg) ?? pickSeed()) : pickSeed();

  const pool = setupPool();
  const { genesis, bible } = await buildBible(client, { seed, slate: pool.all(), anchorId, model: BIBLE_MODEL, effort: BIBLE_EFFORT });

  const text = renderBible(seed, genesis, bible);
  console.log(text);
  const out = `/tmp/airaider-storygen-${seed.id}.md`;
  writeFileSync(out, text);
  writeFileSync(`/tmp/airaider-storygen-${seed.id}.json`, JSON.stringify({ seed, genesis, bible }, null, 2));
  console.log(`\n---\nsaved: ${out}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
