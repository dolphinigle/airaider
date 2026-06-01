// storyGen/cliCampaign — the Chain Campaign prototype: a scriptable text REPL.
//
// THROWAWAY PROTOTYPE (docs/PROTOTYPE_DOCTRINE.md). The whole game in one loop:
// the world OFFERS chains (AI bibles), you ASSIGN mercs to each quest card, you
// RESOLVE (engine scores fit + luck -> outcome tier, AI writes the aftermath),
// chains ADVANCE and CLOSE, rewards fold NPCs into your roster, faces RECUR.
//
// Line-based I/O so a human OR an AI can pipe commands via stdin.
//
// Run:  cd engine/server && npx tsx src/storyGen/cliCampaign.ts
//       (needs OPENAI_API_KEY in env or ~/.airaider/openai.env)
//   commands: help | status | view <chain> | offer | assign <chain> <merc...>
//             | resolve <chain> | day | save | load | quit

import { createInterface } from 'node:readline/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

import { CharacterPool, type PoolCharacter } from '../chainBible/characterPool.js';
import { makeClient } from './ai.js';
import {
  newCampaign, offerChain, resolveOpenQuest, mercsInPool,
  type CampaignState, type ChainRun,
} from './campaign.js';

// ---------------------------------------------------------------------------
// Paths + args
// ---------------------------------------------------------------------------
const SEED_POOL = join(process.cwd(), 'data', 'seed_pool_mireford.json');

function parseArgs(argv: string[]): { savePath: string } {
  let savePath = join(homedir(), '.airaider', 'campaign.json');
  for (const a of argv.slice(2)) {
    if (a.startsWith('--save=')) savePath = a.slice('--save='.length);
  }
  return { savePath: resolve(savePath) };
}
function poolPathFor(savePath: string): string {
  return savePath.replace(/\.json$/, '') + '.pool.json';
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function saveCampaign(savePath: string, camp: CampaignState): void {
  mkdirSync(dirname(savePath), { recursive: true });
  writeFileSync(savePath, JSON.stringify(camp, null, 2));
}
function loadCampaign(savePath: string): CampaignState | null {
  if (!existsSync(savePath)) return null;
  return JSON.parse(readFileSync(savePath, 'utf-8')) as CampaignState;
}

function openPool(savePath: string, fresh: boolean): CharacterPool {
  const poolPath = poolPathFor(savePath);
  if (fresh || !existsSync(poolPath)) {
    mkdirSync(dirname(poolPath), { recursive: true });
    copyFileSync(SEED_POOL, poolPath);
  }
  const pool = new CharacterPool();
  pool.load(poolPath);
  return pool;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const HR = '─'.repeat(68);

function fmtMerc(m: PoolCharacter): string {
  return `  ${m.id.padEnd(26)} ${m.name.padEnd(18)} [${m.tags.join(', ')}]`;
}

function chainSummary(c: ChainRun): string {
  const prog = `${c.stepIdx}/${c.pacing.target}~${c.pacing.max}`;
  const state = c.status === 'closed' ? 'CLOSED' : c.openQuest ? (c.assignedMercIds.length ? `assigned:${c.assignedMercIds.length}` : 'AWAITING ASSIGN') : '—';
  return `  ${c.id.padEnd(14)} [${c.stakes}] ${prog.padEnd(8)} ${state.padEnd(16)} "${c.title}"`;
}

function printStatus(camp: CampaignState, pool: CharacterPool): void {
  console.log(`\n${HR}\n  DAY ${camp.day}    gold ${camp.gold}\n${HR}`);
  const mercs = mercsInPool(pool);
  console.log(`  MERCENARIES (${mercs.length}):`);
  for (const m of mercs) console.log(fmtMerc(m));
  const active = camp.chains.filter((c) => c.status === 'active');
  const closed = camp.chains.filter((c) => c.status === 'closed');
  console.log(`\n  ACTIVE CHAINS (${active.length}):`);
  if (!active.length) console.log('   (none — "offer" to draw a new job)');
  for (const c of active) console.log(chainSummary(c));
  if (closed.length) {
    console.log(`\n  CLOSED (${closed.length}):`);
    for (const c of closed) console.log(chainSummary(c));
  }
  console.log('');
}

function printOpenQuest(c: ChainRun): void {
  if (!c.openQuest) { console.log(`  chain ${c.id} has no open quest (${c.status}).`); return; }
  const q = c.openQuest;
  console.log(`\n${HR}\n  ${c.id} — quest ${c.stepIdx + 1}: ${q.questTitle}   [${c.stakes}]\n${HR}`);
  console.log(`\n${q.card}\n`);
  console.log(`  the contract calls for:`);
  console.log(`    stats:  ${(q.assignmentAsk.desiredStats ?? []).join(', ') || '—'}`);
  console.log(`    traits: ${(q.assignmentAsk.desiredTraits ?? []).join(', ') || '—'}`);
  if (q.assignmentAsk.fictionalReason) console.log(`    because: ${q.assignmentAsk.fictionalReason}`);
  if (c.state.knownToPlayer.length) {
    console.log(`\n  what the company has learned so far:`);
    for (const k of c.state.knownToPlayer) console.log(`    · ${k}`);
  }
  if (c.assignedMercIds.length) console.log(`\n  assigned: ${c.assignedMercIds.join(', ')}`);
  console.log('');
}

function printChainHistory(c: ChainRun): void {
  for (const s of c.steps) {
    console.log(`\n  ── quest ${s.step}: ${s.questTitle}  (${s.outcome}; ${s.assignedNames.join(', ') || 'no one'}) ──`);
    console.log(`  ${s.resolutionProse}`);
    if (s.newlyRevealed.length) console.log(`    ↳ learned: ${s.newlyRevealed.join(' | ')}`);
    if (s.closingNote) console.log(`    ✦ ${s.closingNote}`);
  }
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------
function findChain(camp: CampaignState, id: string): ChainRun | undefined {
  return camp.chains.find((c) => c.id === id || c.id.endsWith(id));
}

function resolveMercIds(pool: CharacterPool, tokens: string[]): { ids: string[]; bad: string[] } {
  const mercs = mercsInPool(pool);
  const ids: string[] = [];
  const bad: string[] = [];
  for (const t of tokens) {
    const m = mercs.find((x) => x.id === t || x.id.endsWith(t) || x.name.toLowerCase() === t.toLowerCase() || x.name.toLowerCase().startsWith(t.toLowerCase()));
    if (m) ids.push(m.id); else bad.push(t);
  }
  return { ids, bad };
}

const HELP = `
commands:
  status                  day, gold, roster, active/closed chains
  view <chain>            show a chain's open quest + history (id or suffix)
  offer                   the world offers a new chain (AI; ~20s)
  assign <chain> <merc..> assign mercs (by id-suffix or name) to a chain's quest
  resolve <chain>         resolve the open quest with assigned mercs (AI; ~15s)
  day                     advance a day (may auto-offer a chain)
  save | load             persist / reload the campaign
  help | quit
`;

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const { savePath } = parseArgs(process.argv);
  const client = makeClient();

  let camp = loadCampaign(savePath) ?? newCampaign();
  const fresh = !existsSync(savePath);
  let pool = openPool(savePath, fresh);
  if (fresh) saveCampaign(savePath, camp);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n=== airaider — CHAIN CAMPAIGN (prototype) ===`);
  console.log(`save: ${savePath}`);
  console.log(`type "help" for commands.\n`);
  printStatus(camp, pool);

  const persist = () => { saveCampaign(savePath, camp); pool.save(); };

  // Async-iterator loop: buffers stdin lines correctly even while a command's
  // long AI await is in flight, so piped scripts (AI playtests) never drop input.
  process.stdout.write('› ');
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) { process.stdout.write('› '); continue; }
    const [cmd, ...args] = line.split(/\s+/);

    try {
      if (cmd === 'quit' || cmd === 'q' || cmd === 'exit') { persist(); break; }
      else if (cmd === 'help' || cmd === 'h') console.log(HELP);
      else if (cmd === 'status' || cmd === 's') printStatus(camp, pool);
      else if (cmd === 'save') { persist(); console.log('  saved.'); }
      else if (cmd === 'load') {
        camp = loadCampaign(savePath) ?? newCampaign();
        pool = openPool(savePath, false);
        console.log('  loaded.'); printStatus(camp, pool);
      }
      else if (cmd === 'view') {
        const c = findChain(camp, args[0] ?? '');
        if (!c) { console.log('  no such chain.'); continue; }
        printOpenQuest(c); printChainHistory(c);
        if (c.reward) console.log(`\n  ✦ REWARD: +${c.reward.gold}g — ${c.reward.detail}`);
      }
      else if (cmd === 'offer') {
        console.log('  …the world stirs (authoring a story)…');
        const chain = await offerChain(client, pool, camp);
        camp.chains.push(chain); persist();
        console.log(`\n  NEW JOB ON THE BOARD — ${chain.id} [${chain.stakes}]`);
        console.log(`  "${chain.leadBlurb}"`);
        printOpenQuest(chain);
      }
      else if (cmd === 'assign') {
        const c = findChain(camp, args[0] ?? '');
        if (!c) { console.log('  no such chain.'); continue; }
        if (!c.openQuest) { console.log('  that chain has no open quest.'); continue; }
        const { ids, bad } = resolveMercIds(pool, args.slice(1));
        if (bad.length) console.log(`  unknown mercs: ${bad.join(', ')}`);
        c.assignedMercIds = ids; persist();
        console.log(`  assigned to ${c.id}: ${ids.join(', ') || '(none)'}`);
      }
      else if (cmd === 'resolve') {
        const c = findChain(camp, args[0] ?? '');
        if (!c) { console.log('  no such chain.'); continue; }
        if (!c.openQuest) { console.log('  that chain has no open quest.'); continue; }
        console.log('  …the company acts…');
        const r = await resolveOpenQuest(client, pool, camp, c);
        camp.gold += r.goldDelta;
        persist();
        console.log(`\n  FIT: ${r.fit}/6 — ${r.fitNote}`);
        console.log(`  OUTCOME: ${r.outcome}   (+${r.goldDelta}g → ${camp.gold}g)`);
        console.log(`\n  ${r.resolution.resolutionProse}`);
        if (r.resolution.newlyRevealed?.length) console.log(`\n    ↳ learned: ${r.resolution.newlyRevealed.join(' | ')}`);
        if (r.closed) {
          console.log(`\n  ######## CHAIN CLOSED — "${c.title}" ########`);
          if (r.resolution.closingNote) console.log(`  ✦ ${r.resolution.closingNote}`);
          if (r.reward) console.log(`  ✦ REWARD (${r.reward.kind}): +${r.reward.gold}g — ${r.reward.detail}`);
        } else {
          console.log(`\n  — the story turns. next quest:`);
          printOpenQuest(c);
        }
      }
      else if (cmd === 'day' || cmd === 'n') {
        camp.day++;
        const active = camp.chains.filter((c) => c.status === 'active').length;
        let offered = false;
        if (active < 3 && Math.random() < 0.6) {
          console.log('  …a new petitioner approaches the gate…');
          const chain = await offerChain(client, pool, camp);
          camp.chains.push(chain); offered = true;
          console.log(`\n  NEW JOB — ${chain.id} [${chain.stakes}]: "${chain.leadBlurb}"`);
        }
        persist();
        console.log(`\n  ── DAY ${camp.day} ──${offered ? '' : '  (quiet; "offer" to seek work)'}`);
        printStatus(camp, pool);
      }
      else console.log(`  unknown command "${cmd}" — type "help".`);
    } catch (e) {
      console.error(`  ! ${(e as Error).message ?? e}`);
    }
    process.stdout.write('› ');
  }

  rl.close();
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
