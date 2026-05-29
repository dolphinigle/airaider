// Interactive terminal game loop ("DF-style" command-mode UI).
//
// Wraps the existing engine (day.ts / fort.ts / tavern.ts / captive.ts /
// quests.ts / roster.ts / rosterAlerts.ts) in a single REPL using Node's
// built-in `readline/promises`. Line-based I/O so the game is scriptable —
// a tester (human OR AI) can pipe commands in via stdin.
//
// Usage:  npm run game                 (interactive)
//         npm run game -- --save=PATH  (use a custom save path)
//         echo "h\nQ" | npm run game   (scripted; useful for AI playtests)
//
// Save file defaults to ~/.airaider/save.json. Auto-saves after every
// advance-day, fort purchase, tavern hire, captive disposition.

import { createInterface } from 'node:readline/promises';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir } from 'node:os';
import { config as loadDotenv } from 'dotenv';

import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import {
  loadRoster, saveRoster, newRoster, type Roster,
  rosterExists, appendFortLog,
} from './roster.js';
import { loadDay, resolveDay } from './day.js';
import { renderDayTranscript } from './dayTranscript.js';
import { MockScenarioLLM } from './llm/mock.js';
import { OpenAIScenarioLLM } from './llm/openai.js';
import type { ScenarioLLM } from './llm/interface.js';
import { loadFortCatalog, affordableUpgrades, purchaseUpgrade } from './fort.js';
import { loadQuests, abandonQuest, type Quest } from './quests.js';
import { hireFromPool } from './tavern.js';
import { effectOf, FORMER_CAPTIVE_TAG_ID, type CaptiveAction, CAPTIVE_ACTIONS } from './captive.js';
import { applyCaptiveEffect } from './roster.js';
import { statusAlerts, watchTowerForecast } from './rosterAlerts.js';
import { reputationTier } from './reputation.js';
import { seasonFor } from './season.js';
import { bondedPairsOf } from './bonds.js';

// ---------- paths & args ----------

interface GameArgs {
  savePath: string;
  useReal: boolean;
}

function parseArgs(argv: string[]): GameArgs {
  let savePath = join(homedir(), '.airaider', 'save.json');
  let useReal = false;
  for (const a of argv.slice(2)) {
    if (a.startsWith('--save=')) savePath = a.slice('--save='.length);
    else if (a === '--real') useReal = true;
    else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    }
  }
  return { savePath: resolve(savePath), useReal };
}

function printUsage(): void {
  console.log(`
airaider — interactive prototype game

Usage: npm run game -- [--save=PATH] [--real]

Options:
  --save=PATH   Save file path (default: ~/.airaider/save.json)
  --real        Use OpenAI gpt-4.1-nano LLM (needs OPENAI_API_KEY).
                Default is MockScenarioLLM (deterministic, no API call).

Once running, type 'h' for a list of commands.
`);
}

// ---------- main ----------

const PROTO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = join(PROTO_ROOT, 'data');
const FIXTURES_DIR = join(PROTO_ROOT, 'fixtures');

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.useReal) {
    const envPath = join(homedir(), '.airaider', 'openai.env');
    if (existsSync(envPath)) loadDotenv({ path: envPath, override: false });
    if (!process.env.OPENAI_API_KEY) {
      console.error(`--real requires OPENAI_API_KEY (looked in ${envPath} and process env).`);
      process.exit(3);
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('');
  console.log('===============================================================');
  console.log('  airaider — grimdark mercenary fort  (prototype build)');
  console.log('===============================================================');
  console.log(`  save: ${args.savePath}`);
  console.log(`  llm:  ${args.useReal ? 'openai:gpt-4.1-nano (real)' : 'mock (deterministic, no API call)'}`);
  console.log('  type "h" for help, "Q" to quit.');
  console.log('');

  // load data
  const tagPool = loadTags(join(DATA_DIR, 'tags.json'));
  const mercPool = loadMercs(join(DATA_DIR, 'mercs.json'), tagPool);
  const fortCatalog = loadFortCatalog(join(DATA_DIR, 'fort-upgrades.json'));
  const questCatalog = (() => {
    try { return loadQuests(join(DATA_DIR, 'quests.json')); }
    catch { return new Map<string, Quest>(); }
  })();

  // load or create roster
  let roster: Roster;
  if (rosterExists(args.savePath)) {
    roster = loadRoster(args.savePath, mercPool, tagPool);
    console.log(`Loaded save: day ${roster.dayCount}  gold ${roster.gold}g  ${roster.mercs.length} mercs`);
  } else {
    console.log(`No save at ${args.savePath} — starting a fresh fort.`);
    // start with the full default pool so all bundled day-fixture scenarios
    // have the mercs they reference; player can fire/lose them later.
    roster = newRoster([...mercPool.values()]);
    roster.gold = 10;
    // make sure save dir exists
    mkdirSync(dirname(args.savePath), { recursive: true });
    saveRoster(args.savePath, roster, mercPool);
    console.log(`Initialized roster with ${roster.mercs.length} mercs, ${roster.gold}g.`);
  }

  const llm: ScenarioLLM = args.useReal
    ? new OpenAIScenarioLLM({ apiKey: process.env.OPENAI_API_KEY!, model: 'gpt-4.1-nano', callLimit: 50 })
    : new MockScenarioLLM();

  // available day fixtures the player can roll
  const dayFixtures = readdirSync(FIXTURES_DIR)
    .filter((f) => /^day-\d+\.json$/.test(f))
    .sort();

  let running = true;
  while (running) {
    printStatus(roster);
    printMenu();
    const cmd = (await rl.question('> ')).trim();
    if (cmd === '' ) continue;
    try {
      switch (cmd) {
        case 'h': case 'H': case '?': printHelp(); break;
        case 'r': case 'R': cmdRosterShow(roster); break;
        case 'd': case 'D': await cmdAdvanceDay(rl, roster, mercPool, llm, dayFixtures, args.savePath, tagPool); break;
        case 'f': case 'F': await cmdFort(rl, roster, fortCatalog, mercPool, args.savePath); break;
        case 'q': case 'Q_'/*placeholder*/: await cmdQuests(rl, roster, questCatalog, mercPool, args.savePath); break;
        case 't': case 'T': await cmdTavern(rl, roster, mercPool, args.savePath); break;
        case 'c': case 'C': await cmdCaptives(rl, roster, tagPool, mercPool, args.savePath); break;
        case 's': case 'S': saveRoster(args.savePath, roster, mercPool); console.log('Saved.'); break;
        case 'Q': running = false; break;
        default: console.log(`Unknown command "${cmd}" — type "h" for help.`);
      }
    } catch (err) {
      console.error(`!! Error: ${(err as Error).message}`);
    }
  }

  saveRoster(args.savePath, roster, mercPool);
  console.log('Saved. Farewell.');
  rl.close();
}

// ---------- status & menu ----------

function printStatus(r: Roster): void {
  const sc = seasonFor(r.dayCount);
  const repParts = Object.entries(r.reputation).map(([k, v]) => `${k}:${v}(${reputationTier(v)})`);
  const upgrades = r.fort.upgrades.length > 0 ? r.fort.upgrades.join(',') : '—';
  console.log('');
  console.log('---------------------------------------------------------------');
  console.log(` Day ${r.dayCount}  |  season:${sc.season}(d${sc.dayOfSeason}/30)  |  gold:${r.gold}g`);
  console.log(` fort L${r.fort.level} [${upgrades}]   mercs:${r.mercs.length}  captives:${r.captives.length}  bench:${r.hirePool.length}`);
  if (repParts.length > 0) console.log(` reputation: ${repParts.join('  ')}`);
  const alerts = statusAlerts(r);
  for (const a of alerts) console.log(` ${a}`);
  console.log('---------------------------------------------------------------');
}

function printMenu(): void {
  console.log(' [d] advance day   [f] fort     [q] quests    [t] tavern');
  console.log(' [c] captives      [r] roster   [s] save      [Q] quit  [h] help');
}

function printHelp(): void {
  console.log(`
Commands:
  d   advance one day — pick a day fixture, the engine resolves all
      scenarios on it (assignments come from the scenario fixtures
      themselves; deploy-picker is a future milestone). Auto-saves.
  f   fort menu — buy upgrades you can afford.
  q   quests menu — list active quests, abandon one.
  t   tavern menu — list bench, hire a candidate.
  c   captives menu — choose disposition (ransom/sell/display/recruit/execute).
  r   verbose roster show.
  s   save now.
  Q   save and quit.
  h   this help.
`);
}

// ---------- helpers ----------

function nameOf(r: Roster, id: string): string {
  return r.mercs.find((m) => m.id === id)?.name ?? id;
}

async function pickFromList<T>(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  items: T[],
  render: (t: T, i: number) => string,
): Promise<T | undefined> {
  if (items.length === 0) {
    console.log('(nothing to pick from)');
    return undefined;
  }
  for (let i = 0; i < items.length; i++) console.log(`  ${i + 1}) ${render(items[i]!, i)}`);
  console.log('  0) back');
  const ans = (await rl.question(`${prompt} > `)).trim();
  const idx = parseInt(ans, 10);
  if (!Number.isFinite(idx) || idx <= 0 || idx > items.length) return undefined;
  return items[idx - 1];
}

// ---------- commands ----------

function cmdRosterShow(r: Roster): void {
  console.log('');
  console.log(`Mercs (${r.mercs.length}):`);
  for (const m of r.mercs) {
    const st = r.states.get(m.id);
    const tier = st && st.tier !== 'rookie' ? `  ${st.tier}` : '';
    const fat = st && st.fatigue > 0 ? `  fat:${st.fatigue}` : '';
    const dmg = st && st.hpDamage > 0 ? `  hp-${st.hpDamage}` : '';
    const grief = st && st.recentGriefPartner ? `  grieving:${st.recentGriefPartner}` : '';
    console.log(`  • ${m.name} [${m.id}]${tier}${fat}${dmg}${grief}  wage:${m.wage}`);
  }
  const bonds = bondedPairsOf(r);
  if (bonds.size > 0) {
    console.log(`\nBonded pairs (${bonds.size}):`);
    for (const k of [...bonds].sort()) {
      const [a, b] = k.split('|');
      console.log(`  ⤬ ${nameOf(r, a!)} ⇔ ${nameOf(r, b!)}`);
    }
  }
  if (r.captives.length > 0) {
    console.log(`\nCaptives (${r.captives.length}):`);
    for (const c of r.captives) console.log(`  • ${c.name}  ${c.archetype}  notoriety:${c.notoriety}`);
  }
  if (r.activeQuests.length > 0) {
    console.log(`\nActive quests (${r.activeQuests.length}):`);
    for (const aq of r.activeQuests) console.log(`  ◆ ${aq.questId}  stage ${aq.stageIndex + 1}`);
  }
  if (r.fortLog.length > 0) {
    console.log(`\nFort log (last 5 of ${r.fortLog.length}):`);
    for (const e of r.fortLog.slice(-5)) console.log(`  day ${e.day}  [${e.kind}]  ${e.message}`);
  }
}

async function cmdAdvanceDay(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  mercPool: Map<string, any>,
  llm: ScenarioLLM,
  dayFixtures: string[],
  savePath: string,
  tagPool: Map<string, any>,
): Promise<void> {
  console.log('\nPick a day fixture to run:');
  const pick = await pickFromList(rl, 'day', dayFixtures, (f) => f);
  if (!pick) return;
  const dayAbs = join(FIXTURES_DIR, pick);
  const day = loadDay(dayAbs);
  const mercsForDay = new Map(r.mercs.map((m) => [m.id, m]));
  const initialFatigue = new Map([...r.states.values()].map((s) => [s.id, s.fatigue]));

  // PROTO-GAME: pre-resolve assignments for each scenario by prompting the
  // player. Loads scenarios up-front, asks for deployment per slot, and then
  // hands the overrides to resolveDay. Errand scenarios (daysToResolve > 0)
  // also get assigned this way — same picker, just dispatches instead.
  const { loadScenario } = await import('./scenarios.js');
  const deployedSoFar = new Set<string>(); // can't deploy same merc twice in one day
  const overrides = new Map<number, Array<{ slotId: string; mercId: string }>>();
  console.log(`\n→ ${day.name} (${day.scenarios.length} scenario${day.scenarios.length === 1 ? '' : 's'})`);
  console.log('Pick deployments for each scenario (0 to skip — fall back to fixture default):\n');

  for (let i = 0; i < day.scenarios.length; i++) {
    const scenAbs = day.scenarios[i]!.startsWith('/')
      ? day.scenarios[i]!
      : join(FIXTURES_DIR, day.scenarios[i]!);
    const scen = loadScenario(scenAbs);
    const isErrand = !!scen.daysToResolve && scen.daysToResolve > 0;
    console.log(`--- Scenario ${i + 1}/${day.scenarios.length}: ${scen.title} [${scen.archetype}]${isErrand ? `  (errand, ${scen.daysToResolve}d)` : ''}`);
    console.log(`    target: ${scen.target}`);
    const slotAssignments: Array<{ slotId: string; mercId: string }> = [];
    let skipped = false;
    for (const slot of scen.slots) {
      const eligible = r.mercs.filter((m) => !deployedSoFar.has(m.id));
      if (eligible.length === 0) {
        console.log(`    (no mercs free to fill slot "${slot.id}" — falling back to fixture default for this scenario)`);
        skipped = true;
        break;
      }
      // sort eligibles: preferred-attr value desc, then preferred-tag matches desc
      const pAttr = slot.preferredAttr;
      const ranked = [...eligible].sort((a, b) => {
        if (pAttr) {
          const av = a.attrs[pAttr];
          const bv = b.attrs[pAttr];
          if (av !== bv) return bv - av;
        }
        const aTagHit = a.tags.some((t) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
        const bTagHit = b.tags.some((t) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
        return bTagHit - aTagHit;
      });
      console.log(`\n    slot "${slot.id}" — prefers ${pAttr ?? '(any)'}${slot.preferredTags?.length ? `, tags:[${slot.preferredTags.join(',')}]` : ''}`);
      console.log(`    "${slot.description}"`);
      const picked = await pickFromList(rl, `    assign to ${slot.id}`, ranked, (m) => {
        const st = r.states.get(m.id);
        const tagHit = m.tags.some((t) => slot.preferredTags?.includes(t.id)) ? '  ★preferred-tag' : '';
        const attrStr = pAttr ? `  ${pAttr}=${m.attrs[pAttr]}` : '';
        const fat = st && st.fatigue > 0 ? `  fat:${st.fatigue}` : '';
        const tier = st && st.tier !== 'rookie' ? `  ${st.tier}` : '';
        return `${m.name} [${m.id}]${attrStr}${tagHit}${fat}${tier}`;
      });
      if (!picked) {
        console.log(`    (skipped — falling back to fixture default for this scenario)`);
        skipped = true;
        break;
      }
      slotAssignments.push({ slotId: slot.id, mercId: picked.id });
      deployedSoFar.add(picked.id);
    }
    if (!skipped && slotAssignments.length === scen.slots.length) {
      overrides.set(i, slotAssignments);
    } else {
      // undo any reservations from a partially-built assignment so they stay free
      for (const a of slotAssignments) deployedSoFar.delete(a.mercId);
    }
  }

  console.log(`\n→ Running ${day.name}…\n`);
  const res = await resolveDay({
    day, dayPath: dayAbs, mercs: mercsForDay, llm, initialFatigue, roster: r,
    assignmentsOverride: (idx) => overrides.get(idx),
  });
  console.log(renderDayTranscript(res));
  // mirror cliDay end-of-day: bump dayCount + apply fatigue/casualties/bonds.
  const { applyCasualties } = await import('./roster.js');
  const { bondedPairsOf: bp, applyBondGrief, pruneStaleGriefHints } = await import('./bonds.js');
  r.dayCount += 1;
  for (const [mercId, fatigue] of Object.entries(res.finalFatigue)) {
    const s = r.states.get(mercId) ?? { id: mercId, fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 0, tier: 'rookie' as const, coDeployments: {} };
    s.fatigue = fatigue;
    r.states.set(mercId, s);
  }
  const bondsBefore = bp(r);
  const allCasualties = res.scenarios.flatMap((s) => s.casualties);
  const killed = applyCasualties(r, allCasualties);
  if (killed.length > 0) {
    const griefs = applyBondGrief(r, killed, bondsBefore);
    if (griefs.length > 0) {
      console.log(`\nBond grief: ${griefs.map((g) => `${g.survivorId} mourns ${g.deceasedId}`).join(', ')}`);
    }
  }
  pruneStaleGriefHints(r, r.dayCount);
  saveRoster(savePath, r, mercPool);
  console.log(`\n(auto-saved → ${savePath})`);
}

async function cmdFort(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  catalog: any,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  const affordable = affordableUpgrades(catalog, r.fort, r.gold);
  console.log(`\nFort L${r.fort.level}  owned:[${r.fort.upgrades.join(',') || '—'}]  gold:${r.gold}g`);
  if (affordable.length === 0) {
    console.log('(no affordable / unowned upgrades right now)');
    return;
  }
  const pick = await pickFromList(rl, 'upgrade', affordable, (u) => `${u.name} [${u.id}]  ${u.cost}g  — ${u.description}`);
  if (!pick) return;
  const out = purchaseUpgrade({ fort: r.fort, gold: r.gold, upgrade: pick });
  if (out.ok) {
    r.fort = out.result.fort;
    r.gold = out.result.gold;
    appendFortLog(r, {
      day: r.dayCount + 1,
      kind: 'upgrade',
      message: `Purchased ${pick.name} for ${pick.cost}g (fort → L${r.fort.level}).`,
    });
    console.log(`✓ Bought ${pick.name}. Fort L${r.fort.level}, ${r.gold}g left.`);
    saveRoster(savePath, r, mercPool);
  } else {
    const e = out.error;
    const msg = e.kind === 'insufficient-gold' ? `need ${e.need}g, have ${e.have}g`
      : e.kind === 'level-locked' ? `requires fort L${e.require}, have L${e.have}`
      : 'already owned';
    console.log(`✗ ${msg}`);
  }
}

async function cmdQuests(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  catalog: Map<string, Quest>,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  if (r.activeQuests.length === 0) {
    console.log('\n(no active quests)');
    return;
  }
  console.log(`\nActive quests (${r.activeQuests.length}):`);
  const pick = await pickFromList(rl, 'abandon which?', r.activeQuests, (aq) => {
    const q = catalog.get(aq.questId);
    return `${q?.name ?? aq.questId} [${aq.questId}]  stage ${aq.stageIndex + 1}/${q?.stages.length ?? '?'}`;
  });
  if (!pick) return;
  const confirm = (await rl.question(`Abandon "${pick.questId}"? this costs 1 rep. (y/N) > `)).trim().toLowerCase();
  if (confirm !== 'y') { console.log('cancelled.'); return; }
  const res = abandonQuest(r, pick.questId, catalog);
  if (res) {
    console.log(`✓ Abandoned ${res.questName}.  ${res.reputationFaction} ${-res.reputationPenalty}.`);
    saveRoster(savePath, r, mercPool);
  } else {
    console.log('quest not found (race?).');
  }
}

async function cmdTavern(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  if (r.hirePool.length === 0) {
    console.log('\n(bench is empty — wait for a refresh)');
    return;
  }
  const pick = await pickFromList(rl, 'hire who?', r.hirePool, (e) => `${e.merc.name} [${e.merc.id}]  ${e.price}g  wage:${e.merc.wage}  posted day ${e.postedDay}`);
  if (!pick) return;
  if (r.gold < pick.price) {
    console.log(`✗ Can't afford (have ${r.gold}g, need ${pick.price}g).`);
    return;
  }
  const idx = r.hirePool.indexOf(pick);
  try {
    const hired = hireFromPool(r, idx);
    console.log(`✓ Hired ${hired.name}.`);
    saveRoster(savePath, r, mercPool);
  } catch (err) {
    console.log(`✗ hire failed: ${(err as Error).message}`);
  }
}

async function cmdCaptives(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  tagPool: Map<string, any>,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  if (r.captives.length === 0) {
    console.log('\n(no captives held)');
    return;
  }
  const cap = await pickFromList(rl, 'which captive?', r.captives, (c) => `${c.name}  ${c.archetype}  notoriety:${c.notoriety}`);
  if (!cap) return;
  console.log(`\nCaptive ${cap.name} — choose disposition:`);
  const action = await pickFromList(rl, 'action', CAPTIVE_ACTIONS as readonly CaptiveAction[] as CaptiveAction[], (a) => a);
  if (!action) return;
  const formerCaptiveTag = tagPool.get(FORMER_CAPTIVE_TAG_ID);
  const eff = effectOf(cap, action, { fortLevel: r.fort.level, ...(formerCaptiveTag ? { formerCaptiveTag } : {}) });
  if (eff.blocked) {
    console.log(`✗ Blocked: ${eff.blocked.reason}`);
    return;
  }
  applyCaptiveEffect(r, cap, eff);
  console.log(`✓ ${action}: gold ${eff.goldDelta >= 0 ? '+' : ''}${eff.goldDelta}g, rep ${eff.reputationGain} +1`);
  saveRoster(savePath, r, mercPool);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
