// Interactive bible+pool playtest runner.
//
// Usage: cd engine/server && npx tsx src/chainBible/playRunner.ts
//
// Loads the seed pool, lets the user spawn chains, walks beats with outcome prompts,
// generates the epilogue, applies pool updates. Dumps state at exit.

import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';
import { CharacterPool } from './characterPool.js';
import {
  generateBible, generateBeat, generateEpilogue, applyPoolUpdates,
  describeReward,
  type RewardSpec, type PriorBeat, type Bible, type CallUsage,
} from './biblePipeline.js';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) {
  console.error('Need OPENAI_API_KEY in ~/.airaider/openai.env');
  process.exit(1);
}

const SEED_PATH = resolve(import.meta.dirname, '../../data/seed_pool_mireford.json');
const SESSION_PATH = '/tmp/airaider-bible-playtest-pool.json';
const TRANSCRIPT_PATH = '/tmp/airaider-bible-playtest-transcript.md';

function ensureSession(): void {
  if (!existsSync(SESSION_PATH)) {
    if (!existsSync(SEED_PATH)) throw new Error(`seed pool not found at ${SEED_PATH}`);
    copyFileSync(SEED_PATH, SESSION_PATH);
    console.log(`[init] copied seed pool to ${SESSION_PATH}`);
  } else {
    console.log(`[init] resuming session pool at ${SESSION_PATH}`);
  }
}

function hr(): void { console.log('\n' + '─'.repeat(70) + '\n'); }
function fmt(n: number): string { return `$${n.toFixed(4)}`; }

const rl = createInterface({ input: stdin, output: stdout });
async function ask(q: string): Promise<string> { return (await rl.question(q)).trim(); }

const OUTCOMES = ['clean-win', 'narrow-win', 'partial-loss', 'failure'] as const;
type Outcome = typeof OUTCOMES[number];

async function askOutcome(): Promise<Outcome> {
  while (true) {
    const a = await ask('Outcome [c=clean-win, n=narrow-win, p=partial-loss, f=failure]: ');
    if (a === 'c' || a === 'clean' || a === 'clean-win') return 'clean-win';
    if (a === 'n' || a === 'narrow' || a === 'narrow-win') return 'narrow-win';
    if (a === 'p' || a === 'partial' || a === 'partial-loss') return 'partial-loss';
    if (a === 'f' || a === 'failure') return 'failure';
  }
}

async function askRarity(): Promise<'common' | 'uncommon' | 'rare' | 'legendary'> {
  while (true) {
    const a = await ask('Rarity [c=common, u=uncommon, r=rare, l=legendary]: ');
    if (a === 'c') return 'common';
    if (a === 'u') return 'uncommon';
    if (a === 'r') return 'rare';
    if (a === 'l') return 'legendary';
  }
}

async function pickReward(rarity: 'common' | 'uncommon' | 'rare' | 'legendary', anchorId: string | undefined, pool: CharacterPool): Promise<RewardSpec> {
  console.log('\nReward options:');
  console.log('  1) gold (engine number)');
  console.log('  2) regional_prestige');
  console.log('  3) captive_to_dungeon (an antagonist NPC ends in dungeon)');
  console.log('  4) promote_to_merc (rare: an NPC joins fort)');
  console.log('  5) unique_trait_on_anchor (rare: anchor gets a custom trait)');
  while (true) {
    const a = await ask('Pick [1-5]: ');
    if (a === '1') return { kind: 'gold', amount: { common: 40, uncommon: 80, rare: 160, legendary: 320 }[rarity] };
    if (a === '2') return { kind: 'regional_prestige', amount: { common: 1, uncommon: 2, rare: 4, legendary: 8 }[rarity] };
    if (a === '3') return { kind: 'captive_to_dungeon' };
    if (a === '4') return { kind: 'promote_to_merc' };
    if (a === '5') {
      let id = anchorId;
      if (!id) {
        const merc = pool.cachedPrefix('Mireford').filter(c => c.role === 'mercenary');
        console.log('Mercenaries:'); merc.forEach((c, i) => console.log(`  ${i + 1}) ${c.id} — ${c.name}`));
        const pick = await ask('Anchor index: ');
        id = merc[parseInt(pick, 10) - 1]?.id;
        if (!id) continue;
      }
      const trait = await ask('Trait name (e.g., "Reckoned With"): ');
      return { kind: 'unique_trait_on_anchor', anchorId: id, traitName: trait };
    }
  }
}

async function maybePickAnchor(pool: CharacterPool): Promise<{ id?: string; isUnit: boolean }> {
  const merc = pool.cachedPrefix('Mireford').filter(c => c.role === 'mercenary');
  console.log('\nAnchor (drives unit chain) — pool mercenaries:');
  merc.forEach((c, i) => console.log(`  ${i + 1}) ${c.id} — ${c.name} (arc: ${c.arcState.slice(0, 60)}...)`));
  console.log('  0) no anchor (regional chain)');
  while (true) {
    const a = await ask('Anchor index [0 for none]: ');
    const n = parseInt(a, 10);
    if (n === 0) return { id: undefined, isUnit: false };
    if (n >= 1 && n <= merc.length) return { id: merc[n - 1].id, isUnit: true };
  }
}

async function pickRewardRecipient(bible: Bible, reward: RewardSpec): Promise<string | undefined> {
  if (reward.kind === 'unique_trait_on_anchor') return reward.anchorId;
  if (reward.kind !== 'promote_to_merc' && reward.kind !== 'captive_to_dungeon') return undefined;
  const want = reward.kind === 'promote_to_merc' ? 'an ally / complication who joins the fort' : 'an antagonist who ends imprisoned';
  console.log(`\nPick reward recipient (${want}):`);
  bible.cast.forEach((c, i) => {
    const name = c.kind === 'existing' ? `[existing ${c.characterId}]` : `[new ${c.character.name}]`;
    console.log(`  ${i + 1}) ${name} role=${c.roleInChain}`);
  });
  while (true) {
    const a = await ask('Index: ');
    const n = parseInt(a, 10);
    if (n < 1 || n > bible.cast.length) continue;
    const entry = bible.cast[n - 1];
    if (entry.kind === 'existing') return entry.characterId;
    // new char — not yet in pool. Apply will create it; we need its post-create id.
    // Simplification: only allow existing for these rewards in playRunner.
    console.log('  ↳ new character not yet in pool. Pick an existing entry instead, or skip the reward.');
  }
}

function printBible(bible: Bible): void {
  console.log(`\n=== "${bible.title}" (${bible.shape}) ===`);
  console.log(`\n[LEAD BOARD — what the player sees first]:\n  ${bible.leadBoardBlurb}`);
  console.log(`\n[BEAT 1 onramp (writer's note)]:\n  ${bible.firstBeatOnramp}`);
  console.log(`\n--- writers'-room internal (don't reveal in beat 1) ---`);
  console.log(`surface (regional gossip): ${bible.surfaceSituation}`);
  console.log(`hidden: ${bible.hiddenSituation}`);
  console.log(`trajectory: ${bible.trajectory}`);
  console.log(`\ncast (${bible.cast.length}):`);
  for (const c of bible.cast) {
    if (c.kind === 'existing') console.log(`  - [reuse] ${c.characterId} as ${c.roleInChain}`);
    else console.log(`  - [NEW]   ${c.character.name} (${c.character.tags.join(',')}) as ${c.roleInChain}`);
  }
  console.log(`\nplants/payoffs: ${bible.setupPayoffs.length}`);
  bible.setupPayoffs.forEach((sp, i) => console.log(`  ${i + 1}. plant: ${sp.plant}\n     payoff: ${sp.payoff}`));
  if (bible.dramaticIrony) console.log(`\ndramaticIrony: ${bible.dramaticIrony}`);
}

async function withSpinner<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  let dots = 0;
  const iv = setInterval(() => {
    dots++;
    const sec = ((Date.now() - start) / 1000).toFixed(0);
    stdout.write(`\r[${label}] elapsed ${sec}s${'.'.repeat((dots % 4))}   `);
  }, 1000);
  try {
    const r = await fn();
    const sec = ((Date.now() - start) / 1000).toFixed(1);
    stdout.write(`\r[${label}] done in ${sec}s.${' '.repeat(20)}\n`);
    return r;
  } finally {
    clearInterval(iv);
  }
}

async function runChain(client: OpenAI, pool: CharacterPool, day: number, totalUsage: { cost: number }, transcript: string[]): Promise<void> {
  const rarity = await askRarity();
  const { id: anchorId, isUnit } = await maybePickAnchor(pool);
  const reward = await pickReward(rarity, anchorId, pool);
  const seedHint = await ask('Inciting hint (one sentence, or blank): ');

  const chainId = `c${day}_${Math.random().toString(36).slice(2, 8)}`;
  const recentMotifs: string[] = []; // (single-session, no tracking yet)

  console.log('\n[bible] gpt-5-mini (reasoning_effort=low) — typical 15-25s.');
  const { bible, usage: bUsage } = await withSpinner('bible', () => generateBible(client, {
    pool, region: 'Mireford', rarity, rewardSpec: reward,
    seedLeadBlurb: seedHint || undefined, requiredAnchorId: anchorId, isUnitChain: isUnit, recentMotifs,
  }));
  totalUsage.cost += bUsage.costUsd;
  console.log(`[bible] ${bUsage.promptTokens}p (${bUsage.cachedTokens} cached) + ${bUsage.completionTokens}c = ${fmt(bUsage.costUsd)}`);
  printBible(bible);
  transcript.push(`# ${bible.title}\n\n**rarity:** ${rarity} **shape:** ${bible.shape} **chain:** ${chainId}\n\n${bible.surfaceSituation}\n`);

  const beats: PriorBeat[] = [];
  const bounds = { common: [2, 3], uncommon: [2, 4], rare: [3, 5], legendary: [3, 6] }[rarity];

  while (true) {
    hr();
    const force = beats.length + 1 >= bounds[1];
    console.log(`\n[beat ${beats.length + 1}/${bounds[1]}] gpt-5-nano (reasoning_effort=minimal) — typical 5-10s${force ? ' (forced climax)' : ''}.`);
    const { beat, usage: beatUsage } = await withSpinner('beat', () => generateBeat(client, bible, beats, rarity, force));
    totalUsage.cost += beatUsage.costUsd;
    console.log(`\n--- Beat ${beats.length + 1}${beat.isClimax ? ' [CLIMAX]' : ''} ---`);
    console.log(`HOOK: ${beat.hook}`);
    console.log(`\nBODY: ${beat.body}`);
    console.log(`\n[cost: ${fmt(beatUsage.costUsd)}]`);
    transcript.push(`## Beat ${beats.length + 1}${beat.isClimax ? ' (climax)' : ''}\n\n**hook:** ${beat.hook}\n\n${beat.body}\n`);

    const outcome = await askOutcome();
    const narration = await ask('What actually happened (one line for downstream context): ');
    beats.push({ hook: beat.hook, body: beat.body, outcome, narration });
    transcript.push(`*outcome:* ${outcome} — ${narration}\n`);

    if (beat.isClimax) break;
    if (beats.length >= bounds[1]) break;
  }

  hr();
  console.log('[epilogue] gpt-5-mini (reasoning_effort=low) — typical 15-25s.');
  const { epilogue, usage: epUsage } = await withSpinner('epilogue', () => generateEpilogue(client, bible, beats));
  totalUsage.cost += epUsage.costUsd;
  console.log(`\n=== Epilogue: "${epilogue.title}" ===`);
  console.log(epilogue.prose);
  console.log(`\n[cost: ${fmt(epUsage.costUsd)}]`);
  transcript.push(`## Epilogue: ${epilogue.title}\n\n${epilogue.prose}\n`);

  const recipient = await pickRewardRecipient(bible, reward);
  const report = applyPoolUpdates(pool, {
    chainId, day, region: 'Mireford', bible, reward, rewardRecipientId: recipient,
  });
  console.log(`\n[pool] +${report.addedIds.length} added, ${report.updatedIds.length} updated, ${report.roleChanges.length} role-changes`);
  if (report.roleChanges.length) for (const rc of report.roleChanges) console.log(`  - ${rc.id}: ${rc.from} → ${rc.to}`);
  console.log(`[pool] reward: ${describeReward(reward)}`);
  transcript.push(`*pool delta:* +${report.addedIds.length} added, ${report.updatedIds.length} updated, ${report.roleChanges.length} role-changes\n\n---\n`);

  writeFileSync(TRANSCRIPT_PATH, transcript.join('\n'));
}

async function main(): Promise<void> {
  ensureSession();
  const pool = new CharacterPool();
  pool.load(SESSION_PATH);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const totalUsage = { cost: 0 };
  const transcript: string[] = [`# Bible playtest — ${new Date().toISOString()}\n`];
  let day = 1;

  console.log(`\n[pool] loaded ${pool.all().length} characters (${pool.cachedPrefix('Mireford').filter(c => c.role === 'mercenary').length} mercs, ${pool.regionSample('Mireford', 100).length} npcs/captives)`);

  while (true) {
    hr();
    console.log(`Day ${day}. Cumulative cost: ${fmt(totalUsage.cost)}.`);
    const a = await ask('[s]pawn chain, [d]ump pool, [q]uit: ');
    if (a === 'q') break;
    if (a === 'd') {
      console.log(`\n[pool dump]`);
      for (const c of pool.all()) {
        console.log(`  ${c.id} (${c.role}) ${c.name} — ${c.arcState.slice(0, 80)}`);
      }
      continue;
    }
    if (a === 's') {
      try { await runChain(client, pool, day, totalUsage, transcript); day++; }
      catch (e) { console.error(`\n[error] ${(e as Error).message}\n`); }
    }
  }

  console.log(`\nFinal pool saved to ${SESSION_PATH}`);
  console.log(`Transcript at ${TRANSCRIPT_PATH}`);
  console.log(`Total cost: ${fmt(totalUsage.cost)}`);
  rl.close();
}

main().catch(e => { console.error(e); rl.close(); process.exit(1); });
