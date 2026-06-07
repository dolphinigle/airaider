// Throwaway — play a FULL chain (bible → quest → resolve → loop) to feel the
// quest-writer: does Beat 1 make you care? reveal one layer/beat? climax land?
// Run: cd prototype && npx tsx src/storyGen/_expChainFeel.ts [seedId ...]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeClient } from './ai.js';
import { buildBible, writeQuest, resolveQuest, drivingHookOf, pacingFor, type ChainState } from './chainGen.js';
import { SEEDS } from './seeds.js';

const POOL = JSON.parse(readFileSync(join(process.cwd(), '..', 'engine', 'server', 'data', 'seed_pool_mireford.json'), 'utf8')) as Array<Record<string, unknown>>;
const slate = POOL.map((c) => ({ id: c.id as string, name: c.name as string, role: c.role as string, surface: c.surface as string, tags: (c.tags as string[]) ?? [], region: c.region as string }));
const OUTCOMES = ['clean_win', 'narrow_win', 'clean_win', 'narrow_win', 'partial_loss', 'clean_win'] as const;

const client = makeClient();
const want = process.argv.slice(2);
const seeds = (want.length ? SEEDS.filter((s) => want.includes(s.id)) : SEEDS.slice(0, 2));

for (const seed of seeds) {
  console.log(`\n${'#'.repeat(80)}\n# CHAIN: ${seed.id} (${seed.stakes}) — ${seed.spark}\n${'#'.repeat(80)}`);
  try {
    const { bible } = await buildBible(client, { seed, slate });
    console.log(`BIBLE: "${bible.title}" — cast: ${bible.cast.map((c: any) => c.person.name).join(', ')}`);
    console.log(`LEAD BLURB (player sees): ${bible.leadBlurb}`);
    const drivingHook = drivingHookOf(bible);
    const pacing = pacingFor(seed.stakes);
    let state: ChainState = { currentSituation: bible.situation, knownToPlayer: [bible.leadBlurb], openThreads: [], closedThreads: [], actorStates: {} };
    for (let step = 1; step <= pacing.max; step++) {
      const quest = await writeQuest(client, { bible, state, drivingHook, step, pacing });
      const isFinal = !!quest.closesChain || step >= pacing.max;
      console.log(`\n── BEAT ${step}${isFinal ? ' (FINALE)' : ''} ─────────────────────────────────────`);
      console.log(`  CARD: ${quest.card}`);
      console.log(`  ASK: ${JSON.stringify(quest.assignmentAsk)}`);
      console.log(`  (hidden purpose: ${quest.hiddenPurpose})  closesChain=${quest.closesChain}`);
      const outcome = OUTCOMES[(step - 1) % OUTCOMES.length];
      const res = await resolveQuest(client, { bible, state, quest, outcome, assignedDesc: 'a fitting party of mercs', isFinal });
      console.log(`  → [${outcome}] ${res.resolutionProse}`);
      if (res.newlyRevealed?.length) console.log(`    revealed: ${res.newlyRevealed.join(' | ')}`);
      state = {
        currentSituation: res.currentSituation || state.currentSituation,
        knownToPlayer: [...state.knownToPlayer, ...(res.newlyRevealed ?? [])],
        openThreads: [...state.openThreads, ...(res.threadsOpened ?? [])].filter((t) => !(res.threadsClosed ?? []).includes(t)),
        closedThreads: [...state.closedThreads, ...(res.threadsClosed ?? [])],
        actorStates: { ...state.actorStates, ...(res.actorUpdates ?? {}) },
      };
      if (isFinal) { console.log(`  CLOSING: ${res.closingNote ?? '(none)'}`); break; }
    }
  } catch (e) {
    console.log(`[${seed.id} CHAIN FAILED] ${(e as Error).message}`);
  }
}
