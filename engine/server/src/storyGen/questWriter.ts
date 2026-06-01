// storyGen/questWriter — stepwise quest-chain experiment.
//
// Turns a hidden story BIBLE into a sequence of player-facing quests, revealing
// the truth a little at a time. Each step:
//   QUEST-WRITE  write the next quest the company is offered (card leaks nothing)
//   RESOLVE      apply a chosen outcome, write what happened, update chain state
//   the resolved {quest, outcome, resolution} goes into the chain history, which
//   feeds the next step. The writer asks to END only inside an allowed window;
//   the engine sets a target length from the bible's stakes.
//
// The BIBLE is immutable PAST truth. Outcomes bend the FUTURE via a mutable
// chainState (knownToPlayer ledger + open/closed threads + actor states).
//
// Run: cd engine/server && AIRAIDER_QUEST_MODEL=gpt-5-mini AIRAIDER_QUEST_EFFORT=low \
//        npx tsx src/storyGen/questWriter.ts <seedId> [outcome1 outcome2 ...]
//   outcomes ∈ clean_win | narrow_win | partial_loss | failure (default: a varied script)
//   (run genesis.ts <seedId> first to produce the bible)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { z } from 'zod';
import { CharacterPool, type PoolCharacter } from '../chainBible/characterPool.js';
import { type Stakes } from './seeds.js';
import { makeClient, callJson, type Effort } from './ai.js';

const MODEL = process.env.AIRAIDER_QUEST_MODEL ?? 'gpt-5-mini';
const EFFORT = (process.env.AIRAIDER_QUEST_EFFORT ?? 'low') as Effort;
const TMP_POOL = '/tmp/airaider-storygen-pool.json';

type Outcome = 'clean_win' | 'narrow_win' | 'partial_loss' | 'failure';
const OUTCOMES: Outcome[] = ['clean_win', 'narrow_win', 'partial_loss', 'failure'];
const DEFAULT_SCRIPT: Outcome[] = ['narrow_win', 'partial_loss', 'clean_win', 'narrow_win', 'clean_win', 'narrow_win'];

// Engine-owned pacing: how many quests a chain of this rarity should run.
const TARGET: Record<Stakes, { target: number; max: number }> = {
  uncommon: { target: 2, max: 3 },
  rare: { target: 3, max: 4 },
  legendary: { target: 5, max: 6 },
};

// ---------------------------------------------------------------------------
// Schemas (defensive: low-effort gpt-5-mini may omit arrays or send odd types)
// ---------------------------------------------------------------------------
const strArr = z.array(z.string()).optional();

const QuestSchema = z.object({
  questTitle: z.string().min(2),
  card: z.string().min(20),                 // player-facing; enticing; leaks NO hidden cause
  missionFiction: z.string().min(8),        // what the job openly is
  hiddenPurpose: z.string().min(8),         // what truth this quest privately advances
  assignmentAsk: z.object({
    desiredStats: strArr,
    desiredTraits: strArr,
    fictionalReason: z.string().optional(),
  }),
  revealOnSuccess: strArr,                  // facts a win may surface
  revealOnFailure: strArr,                  // facts a loss may surface
  wantsFinal: z.union([z.boolean(), z.string(), z.null()]).optional(),
  finalReason: z.string().optional(),
});
type Quest = z.infer<typeof QuestSchema>;

const ResolutionSchema = z.object({
  resolutionProse: z.string().min(20),      // player-facing aftermath
  newlyRevealed: strArr,                    // appended to knownToPlayer
  threadsOpened: strArr,
  threadsClosed: strArr,
  actorUpdates: z.record(z.any()).optional(),
  currentSituation: z.string().min(10),     // rewritten hidden present reality
  closingNote: z.string().optional(),
});
type Resolution = z.infer<typeof ResolutionSchema>;

interface ChainState {
  currentSituation: string;
  knownToPlayer: string[];
  openThreads: string[];
  closedThreads: string[];
  actorStates: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const QUEST_WRITER_SYSTEM = `You are the quest-writer for a grimdark mercenary-fort game. A hidden STORY BIBLE holds the complete, settled truth of a story. The player NEVER sees the bible. Your job: write the NEXT quest the player's mercenary company is offered, revealing the buried truth only a little at a time, through what the company can actually see and do.

You are given: the BIBLE (hidden truth), the CHAIN STATE (what is currently true and what the player already knows), and PACING.

HARD RULES:
- The player sees ONLY the "card". It must be concrete and enticing — a job, a plea, a rumor, a body — and must reveal NO hidden CAUSE. Symptoms, not causes. (A corpse, never the murderer's name; a missing barge, never the smuggling ring.)
- Reveal SLOWLY. One quest surfaces at most ONE new layer of the truth. Do not dump the conspiracy. Most of the bible stays buried for now.
- CONTINUITY: the quest must follow believably from the CHAIN STATE — react to what the company just did and to what is now in motion. Do not reset. After the first quest, drive the next one from open threads and the actors' reactions, not from a fresh unrelated job.
- The company's only agency is: take the job + assign units. Do NOT write mid-quest branching choices.
- assignmentAsk: name the qualities the job calls for as QUALITATIVE tags only (stats, traits) plus a fiction reason. NEVER numbers, gold, or rewards — the engine owns all numbers.
- PACING: set wantsFinal:true ONLY if canEndNow is true AND the story has reached a natural climax. If mustEndNow is true, write the climactic FINAL quest of the chain. Otherwise keep the arc moving and leave wantsFinal false.

VOICE: the card may be vivid and literary; the hidden fields are clinical.
Output JSON only: { questTitle, card, missionFiction, hiddenPurpose, assignmentAsk { desiredStats[], desiredTraits[], fictionalReason }, revealOnSuccess[], revealOnFailure[], wantsFinal, finalReason }`;

const RESOLVER_SYSTEM = `You resolve a mercenary quest after the company has acted. You are given the BIBLE (hidden truth), the CHAIN STATE, the QUEST just attempted, and the OUTCOME (a tier plus which units were assigned). Write what happened and update the world.

OUTCOME SEMANTICS — every outcome MUST advance the story; failure changes the FUTURE, it never stalls:
- clean_win: the objective is achieved cleanly; the planned success-reveal surfaces; the situation shifts in the company's favor.
- narrow_win: achieved, but at a real cost or with a complication.
- partial_loss: only partly achieved; a thread is left raw; a cost lands.
- failure: the objective fails; an antagonist or the world advances; the chain stays alive on a changed footing.

HARD RULES:
- resolutionProse is player-facing: vivid, grimdark, concrete. Name the assigned units; let their traits color HOW it went. Reveal ONLY facts allowed by the quest's revealOnSuccess (for win tiers) or revealOnFailure (for loss tiers) — and nothing deeper from the bible.
- The BIBLE's PAST truth is IMMUTABLE. You may not retcon what really happened. Outcomes bend only the FUTURE: who now knows what, who reacts, what is set in motion.
- Update state truthfully: newlyRevealed (facts the player now knows), threadsClosed, threadsOpened, actorUpdates (name → short new status), and a rewritten currentSituation (the hidden present reality AFTER this quest).
- If this is the FINAL quest: bring the arc to a real close that pays off the bible's deeper truth — but still honor the outcome tier (a failed finale is a grim ending, not a triumph). Put the closing beat in closingNote.
Output JSON only: { resolutionProse, newlyRevealed[], threadsOpened[], threadsClosed[], actorUpdates{}, currentSituation, closingNote }`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function truthy(v: unknown): boolean {
  return v === true || v === 'true';
}

function bibleBlock(bible: any): string {
  const cast = bible.cast.map((c: any) => {
    const p = c.person;
    const conceal = typeof p.conceals === 'string' && p.conceals.trim() ? ` | conceals: ${p.conceals}` : '';
    return `- ${p.name} — ${c.roleInStory ?? p.who}. wants: ${p.wants}${conceal}`;
  }).join('\n');
  const tensions = bible.tensions.map((t: any) => `- ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n');
  return [
    `## BIBLE — TRUE SITUATION (hidden)`, bible.situation,
    ``, `## CAST (hidden)`, cast,
    ``, `## TENSIONS (hidden)`, tensions,
  ].join('\n');
}

function chainStateBlock(s: ChainState): string {
  const known = s.knownToPlayer.length ? s.knownToPlayer.map((k) => `- ${k}`).join('\n') : '- (the player knows only the original job posting)';
  const open = s.openThreads.length ? s.openThreads.map((t) => `- ${t}`).join('\n') : '- (none yet)';
  const actors = Object.entries(s.actorStates).map(([n, v]) => `- ${n}: ${v}`).join('\n') || '- (unchanged)';
  return [
    `## CHAIN STATE — CURRENT REALITY (hidden)`, s.currentSituation,
    ``, `## WHAT THE PLAYER ALREADY KNOWS`, known,
    ``, `## OPEN THREADS`, open,
    ``, `## ACTOR STATES`, actors,
  ].join('\n');
}

function pacingBlock(stepIndex: number, t: { target: number; max: number }): string {
  const canEndNow = stepIndex >= t.target;
  const mustEndNow = stepIndex >= t.max;
  return [
    `## PACING`,
    `- this is quest #${stepIndex} of a chain that should run about ${t.target} (hard max ${t.max}).`,
    `- canEndNow: ${canEndNow}`,
    `- mustEndNow: ${mustEndNow}`,
  ].join('\n');
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

function printResolution(outcome: Outcome, assigned: PoolCharacter[], r: Resolution): void {
  console.log(`\n--- RESOLUTION (${outcome}) — assigned: ${assigned.map((a) => a.name).join(', ')} ---`);
  console.log(r.resolutionProse);
  if (r.newlyRevealed?.length) console.log(`\n  ↳ player now knows: ${r.newlyRevealed.join(' | ')}`);
  if (r.closingNote) console.log(`\n  ✦ ${r.closingNote}`);
}

function mergeState(s: ChainState, r: Resolution): void {
  for (const k of r.newlyRevealed ?? []) if (!s.knownToPlayer.includes(k)) s.knownToPlayer.push(k);
  const closed = new Set(r.threadsClosed ?? []);
  s.openThreads = s.openThreads.filter((t) => !closed.has(t));
  for (const t of r.threadsClosed ?? []) if (!s.closedThreads.includes(t)) s.closedThreads.push(t);
  for (const t of r.threadsOpened ?? []) if (!s.openThreads.includes(t)) s.openThreads.push(t);
  for (const [name, st] of Object.entries(r.actorUpdates ?? {})) s.actorStates[name] = String(st);
  s.currentSituation = r.currentSituation;
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const seedId = process.argv[2];
  if (!seedId) throw new Error('usage: questWriter.ts <seedId> [outcomes...]');
  const biblePath = `/tmp/airaider-storygen-${seedId}.json`;
  if (!existsSync(biblePath)) throw new Error(`no bible at ${biblePath} — run genesis.ts ${seedId} first`);

  const { seed, bible } = JSON.parse(readFileSync(biblePath, 'utf-8'));
  const stakes: Stakes = seed.stakes;
  const pacing = TARGET[stakes];

  const cliOutcomes = process.argv.slice(3).filter((o): o is Outcome => (OUTCOMES as string[]).includes(o));
  const outcomes = cliOutcomes.length ? cliOutcomes : DEFAULT_SCRIPT;

  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  const client = makeClient();

  // The chain spine starts from one ACTIVE hook in the bible.
  const activeHook = (bible.openDirections as any[]).find((d) => typeof d === 'object' && d.kind === 'active');
  const drivingHook = activeHook ? activeHook.hook : (typeof bible.openDirections[0] === 'object' ? bible.openDirections[0].hook : bible.openDirections[0]);

  const state: ChainState = {
    currentSituation: bible.situation,
    knownToPlayer: [],
    openThreads: [],
    closedThreads: [],
    actorStates: {},
  };

  console.log(`\n########  QUEST CHAIN — ${bible.title}  (${stakes})  ########`);
  console.log(`\n[ opening job posting ]\n"${bible.leadBlurb}"`);
  console.log(`\n[ hidden — the active hook driving this chain ]\n${drivingHook}`);

  const history: { step: number; quest: Quest; outcome: Outcome; assigned: string[]; resolution: Resolution }[] = [];

  for (let step = 1; step <= pacing.max; step++) {
    const mustEndNow = step >= pacing.max;
    const canEndNow = step >= pacing.target;

    // QUEST-WRITE
    const questUser = [
      bibleBlock(bible),
      ``, chainStateBlock(state),
      ``, `## ACTIVE HOOK THAT OPENED THIS CHAIN`, drivingHook,
      ``, pacingBlock(step, pacing),
      ``, `Write quest #${step}. Output JSON only.`,
    ].join('\n');
    const quest = await callJson(client, { system: QUEST_WRITER_SYSTEM, user: questUser, schema: QuestSchema, model: MODEL, effort: EFFORT });
    const isFinal = mustEndNow || (truthy(quest.wantsFinal) && canEndNow);
    printQuest(step, quest);

    // RESOLVE
    const outcome = outcomes[step - 1] ?? 'narrow_win';
    const assigned = sampleMercs(pool, 2);
    const outcomeBlock = [
      `## OUTCOME (engine-decided)`,
      `- tier: ${outcome}`,
      `- assigned units: ${assigned.map((a) => `${a.name} [${a.tags.join(', ')}]`).join('; ')}`,
      isFinal ? `- THIS IS THE FINAL QUEST OF THE CHAIN — close the arc.` : `- the chain continues after this.`,
    ].join('\n');
    const resolveUser = [
      bibleBlock(bible),
      ``, chainStateBlock(state),
      ``, `## QUEST JUST ATTEMPTED`,
      `card: ${quest.card}`,
      `hiddenPurpose: ${quest.hiddenPurpose}`,
      `revealOnSuccess: ${(quest.revealOnSuccess ?? []).join(' | ') || '(none)'}`,
      `revealOnFailure: ${(quest.revealOnFailure ?? []).join(' | ') || '(none)'}`,
      ``, outcomeBlock,
      ``, `Resolve it. Output JSON only.`,
    ].join('\n');
    const resolution = await callJson(client, { system: RESOLVER_SYSTEM, user: resolveUser, schema: ResolutionSchema, model: MODEL, effort: EFFORT });
    printResolution(outcome, assigned, resolution);

    mergeState(state, resolution);
    history.push({ step, quest, outcome, assigned: assigned.map((a) => a.name), resolution });

    if (isFinal) { console.log(`\n########  CHAIN COMPLETE after ${step} quests  ########`); break; }
  }

  const outPath = `/tmp/airaider-questchain-${seedId}.json`;
  writeFileSync(outPath, JSON.stringify({ seed, title: bible.title, drivingHook, history, finalState: state }, null, 2));
  console.log(`\nsaved: ${outPath}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
