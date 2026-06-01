// storyGen/questWriter — CLI wrapper around the quest generators in chainGen.ts.
//
// Turns a hidden story BIBLE into a sequence of player-facing quests. Each step:
//   writeQuest    write the next quest the company is offered (card leaks nothing)
//   resolveQuest  apply a chosen outcome, write what happened, update chain state
//
// Run: cd engine/server && AIRAIDER_QUEST_MODEL=gpt-5-mini AIRAIDER_QUEST_EFFORT=low \
//        npx tsx src/storyGen/questWriter.ts <seedId> [outcome1 outcome2 ...]
//   outcomes ∈ clean_win | narrow_win | partial_loss | failure (default: a varied script)
//   --interactive : assign units + pick outcome by hand each step
//   (run genesis.ts <seedId> first to produce the bible)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'node:readline';
import { CharacterPool, type PoolCharacter } from '../chainBible/characterPool.js';
import { type Stakes } from './seeds.js';
import { makeClient } from './ai.js';
import {
  writeQuest, resolveQuest, mergeChainState, newChainState, drivingHookOf, pacingFor, truthy,
  OUTCOMES, type Outcome, type Quest, type Resolution,
  QUEST_MODEL, QUEST_EFFORT,
} from './chainGen.js';

const TMP_POOL = '/tmp/airaider-storygen-pool.json';
const INTERACTIVE = process.argv.includes('--interactive') || process.env.AIRAIDER_QUEST_INTERACTIVE === '1';
const DEFAULT_SCRIPT: Outcome[] = ['narrow_win', 'partial_loss', 'clean_win', 'narrow_win', 'clean_win', 'narrow_win'];

const rl = INTERACTIVE ? createInterface({ input: process.stdin, output: process.stdout }) : null;
function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => rl!.question(prompt, (a) => resolve(a.trim())));
}

function sampleMercs(pool: CharacterPool, n: number): PoolCharacter[] {
  let mercs = pool.all().filter((c) => c.role === 'mercenary');
  if (mercs.length === 0) mercs = pool.all().filter((c) => c.role !== 'landmark');
  const shuffled = [...mercs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function printQuest(step: number, q: Quest): void {
  console.log(`\n${'='.repeat(70)}\n  QUEST ${step}: ${q.questTitle}\n${'='.repeat(70)}`);
  console.log(`\n[ JOB BOARD — what the player sees ]\n${q.card}`);
  const stats = q.assignmentAsk.desiredStats ?? [];
  const traits = q.assignmentAsk.desiredTraits ?? [];
  console.log(`\n[ the contract calls for ]`);
  console.log(`  stats:  ${stats.join(', ') || '—'}`);
  console.log(`  traits: ${traits.join(', ') || '—'}`);
  if (q.assignmentAsk.fictionalReason) console.log(`  because: ${q.assignmentAsk.fictionalReason}`);
  console.log(`\n[ hidden — purpose ] ${q.hiddenPurpose}`);
}

function printResolution(outcome: Outcome, assignedLabel: string, r: Resolution): void {
  console.log(`\n--- RESOLUTION (${outcome}) — assigned: ${assignedLabel} ---`);
  console.log(r.resolutionProse);
  if (r.newlyRevealed?.length) console.log(`\n  ↳ player now knows: ${r.newlyRevealed.join(' | ')}`);
  if (r.closingNote) console.log(`\n  ✦ ${r.closingNote}`);
}

async function main(): Promise<void> {
  const seedId = process.argv[2];
  if (!seedId) throw new Error('usage: questWriter.ts <seedId> [outcomes...]');
  const biblePath = `/tmp/airaider-storygen-${seedId}.json`;
  if (!existsSync(biblePath)) throw new Error(`no bible at ${biblePath} — run genesis.ts ${seedId} first`);

  const { seed, bible } = JSON.parse(readFileSync(biblePath, 'utf-8'));
  const stakes: Stakes = seed.stakes;
  const pacing = pacingFor(stakes);

  const cliOutcomes = process.argv.slice(3).filter((o): o is Outcome => (OUTCOMES as string[]).includes(o));
  const outcomes = cliOutcomes.length ? cliOutcomes : DEFAULT_SCRIPT;

  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  const client = makeClient();

  const drivingHook = drivingHookOf(bible);
  const state = newChainState(bible);

  console.log(`\n########  QUEST CHAIN — ${bible.title}  (${stakes})  ########`);
  console.log(`\n[ opening job posting ]\n"${bible.leadBlurb}"`);
  console.log(`\n[ hidden — the active hook driving this chain ]\n${drivingHook}`);

  const history: { step: number; quest: Quest; outcome: Outcome; assigned: string[]; resolution: Resolution }[] = [];

  for (let step = 1; step <= pacing.max; step++) {
    const mustEndNow = step >= pacing.max;
    const canEndNow = step >= pacing.target;

    const quest = await writeQuest(client, { bible, state, drivingHook, step, pacing, model: QUEST_MODEL, effort: QUEST_EFFORT });
    const isFinal = mustEndNow || (truthy(quest.closesChain) && canEndNow);
    printQuest(step, quest);

    let outcome: Outcome;
    let assignedDesc: string;
    let assignedLabel: string;
    if (INTERACTIVE) {
      const unitLine = await ask(`\n  > assign units (freeform, e.g. "Felix the Wolfman, high CHA"): `);
      assignedDesc = unitLine || '(an unnamed pair of company hands)';
      assignedLabel = unitLine || '(unnamed)';
      const tier = (await ask(`  > outcome [clean_win | narrow_win | partial_loss | failure]: `)).toLowerCase();
      outcome = (OUTCOMES as string[]).includes(tier) ? (tier as Outcome) : 'narrow_win';
    } else {
      outcome = outcomes[step - 1] ?? 'narrow_win';
      const assigned = sampleMercs(pool, 2);
      assignedDesc = assigned.map((a) => `${a.name} [${a.tags.join(', ')}]`).join('; ');
      assignedLabel = assigned.map((a) => a.name).join(', ');
    }

    const resolution = await resolveQuest(client, { bible, state, quest, outcome, assignedDesc, isFinal, model: QUEST_MODEL, effort: QUEST_EFFORT });
    printResolution(outcome, assignedLabel, resolution);

    mergeChainState(state, resolution);
    history.push({ step, quest, outcome, assigned: [assignedLabel], resolution });

    if (isFinal) { console.log(`\n########  CHAIN COMPLETE after ${step} quests  ########`); break; }
  }

  rl?.close();
  const outPath = `/tmp/airaider-questchain-${seedId}.json`;
  writeFileSync(outPath, JSON.stringify({ seed, title: bible.title, drivingHook, history, finalState: state }, null, 2));
  console.log(`\nsaved: ${outPath}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
