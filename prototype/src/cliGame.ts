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
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir, tmpdir } from 'node:os';
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
import { loadRoomCatalog, type RoomDef } from './rooms.js';
import { renderFortLayout, buildRoom, excavateCell, activeGates, totalCapacity, totalRoomPrestige, dungeonCellsWithSpace, captiveCellEffects } from './fortLayout.js';
import { loadQuests, abandonQuest, type Quest } from './quests.js';
import { hireFromPool } from './tavern.js';
import { effectOf, FORMER_CAPTIVE_TAG_ID, type CaptiveAction, CAPTIVE_ACTIONS } from './captive.js';
import { applyCaptiveEffect } from './roster.js';
import { statusAlerts, watchTowerForecast } from './rosterAlerts.js';
import { reputationTier } from './reputation.js';
import { seasonFor } from './season.js';
import { bondedPairsOf } from './bonds.js';
import { refreshLeadBoard, pursueLead, PURSUE_COST_BY_RARITY, BASE_RARITY_WEIGHTS, type Lead } from './leads.js';
import { computePrestige, prestigeTier, prestigeTierLabel, tiltRarityWeights } from './prestige.js';
import { templateFor } from './scenarioTemplates.js';
import { formatTags, formatPreferredTags } from './tagFormat.js';
import { rollCaptiveTags } from './captiveTags.js';

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
  const roomCatalogList = loadRoomCatalog(join(DATA_DIR, 'rooms.json'));
  const roomCatalog = new Map<string, RoomDef>(roomCatalogList.map((r) => [r.id, r]));
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
    // PROTO-GAME v13: enough gold to build the first room or two (Scouting
    // Post 6g + Chapel 4g, with a few left over). Per SIM_BIBLE Day-1 treasury.
    roster.gold = 20;
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
    printStatus(roster, roomCatalog);
    printMenu();
    const cmd = (await rl.question('> ')).trim();
    if (cmd === '' ) continue;
    try {
      switch (cmd) {
        case 'h': case 'H': case '?': printHelp(); break;
        case 'r': case 'R': cmdRosterShow(roster); break;
        case 'l': case 'L': cmdLeads(roster, tagPool); break;
        case 'd': case 'D': await cmdAdvanceDay(rl, roster, mercPool, llm, dayFixtures, args.savePath, tagPool, roomCatalog); break;
        case 'f': case 'F': await cmdFort(rl, roster, fortCatalog, roomCatalog, mercPool, args.savePath); break;
        case 'q': case 'Q_'/*placeholder*/: await cmdQuests(rl, roster, questCatalog, mercPool, args.savePath); break;
        case 't': case 'T': await cmdTavern(rl, roster, roomCatalog, mercPool, args.savePath); break;
        case 'c': case 'C': await cmdCaptives(rl, roster, tagPool, mercPool, roomCatalog, args.savePath); break;
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

function printStatus(r: Roster, roomCatalog: Map<string, RoomDef>): void {
  const sc = seasonFor(r.dayCount);
  const repParts = Object.entries(r.reputation).map(([k, v]) => `${k}:${v}(${reputationTier(v)})`);
  const roomCount = r.fort.placedRooms.length;
  const cellCount = r.fort.cells.length;
  const upgrades = r.fort.upgrades.length > 0 ? r.fort.upgrades.join(',') : '—';
  const prestige = computePrestige({
    displayedCount: r.displayedCount,
    legendaryLeadsCompleted: r.legendaryLeadsCompleted,
    fortLevel: r.fort.level,
    roomPrestige: totalRoomPrestige(r.fort, roomCatalog),
  });
  const tier = prestigeTier(prestige);
  console.log('');
  console.log('---------------------------------------------------------------');
  console.log(` Day ${r.dayCount}  |  season:${sc.season}(d${sc.dayOfSeason}/30)  |  gold:${r.gold}g`);
  console.log(` fort L${r.fort.level}  rooms:${roomCount}/${cellCount} cells  upgrades:[${upgrades}]   mercs:${r.mercs.length}  captives:${r.captives.length}  bench:${r.hirePool.length}`);
  console.log(` prestige: ${prestige}  (${prestigeTierLabel(tier)})   heads-on-pikes:${r.displayedCount}   legendary-kills:${r.legendaryLeadsCompleted}`);
  if (repParts.length > 0) console.log(` reputation: ${repParts.join('  ')}`);
  const alerts = statusAlerts(r);
  for (const a of alerts) console.log(` ${a}`);
  console.log('---------------------------------------------------------------');
  // PROTO-GAME v13: room-gate tutorial nudges. Surface what the player must
  // build to unlock systems that are currently silent.
  const placedRoomIds = new Set(r.fort.placedRooms.map((p) => p.roomId));
  const tutorialHints: string[] = [];
  if (!placedRoomIds.has('scouting-post')) {
    tutorialHints.push('No Scouting Post → no leads. Build via [f]→[b]uild (6g).');
  }
  if (!placedRoomIds.has('tavern')) {
    tutorialHints.push('No Tavern → no recruits drift in. Build via [f]→[b]uild (8g).');
  }
  for (const h of tutorialHints) console.log(` ▶ ${h}`);
  if (tutorialHints.length > 0) console.log('---------------------------------------------------------------');
}

function printMenu(): void {
  console.log(' [d] advance day   [l] leads    [f] fort      [q] quests   [t] tavern');
  console.log(' [c] captives      [r] roster   [s] save      [Q] quit     [h] help');
}

function printHelp(): void {
  console.log(`
Commands:
  d   advance one day — refresh the lead board, then either pursue a
      lead (pay gold → resolve that scenario today) or take a rest day
      (no scenario, recover fatigue). Auto-saves.
  l   lead board — list available opportunities (read-only; pursue
      happens inside [d] advance-day).
  f   fort menu — view 2D layout, build rooms in cells, excavate new
      cells, or shop legacy upgrades. Rooms gate systems (Scouting Post
      → leads, Tavern → recruits, Dungeon Storeroom → captive cap).
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

function cmdLeads(r: Roster, tagPool: Map<string, any>): void {
  console.log('');
  if (r.leadBoard.length === 0) {
    console.log('Lead board is empty. Advance a day to refresh it.');
    return;
  }
  console.log(`LEAD BOARD  (day ${r.dayCount}, ${r.leadBoard.length} active)`);
  for (const lead of r.leadBoard) {
    const daysLeft = Math.max(0, lead.expiryDay - r.dayCount);
    const glyph = lead.rarity === 'legendary' ? '✨' : lead.rarity === 'rare' ? '★' : lead.rarity === 'uncommon' ? '✦' : '·';
    const rarityLabel = lead.rarity === 'legendary' ? 'LEGENDARY' : lead.rarity;
    console.log(`  • ${glyph} [${rarityLabel}] ${lead.archetype} — ${lead.region}  DC${lead.dc}  reward ${lead.rewardGold}g  cost ${lead.pursueCost}g  expires in ${daysLeft}d`);
    console.log(`      "${lead.blurb}"`);
    const scen = templateFor(lead);
    for (const slot of scen.slots) {
      const pAttr = slot.preferredAttr ? `  attr:${slot.preferredAttr}` : '';
      console.log(`      ↳ slot "${slot.id}"${pAttr}${formatPreferredTags(slot.preferredTags, tagPool)}`);
    }
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
  roomCatalog: Map<string, RoomDef>,
): Promise<void> {
  // PROTO-GAME v13: room gates. Lead board needs a Scouting Post.
  const gates = activeGates(r.fort, roomCatalog);
  if (!gates.has('lead-board')) {
    console.log('\nLEAD BOARD  (locked)');
    console.log('  No Scouting Post built — without it, no runners reach the gate.');
    console.log('  Build one via [f] fort → [b]uild → Scouting Post (6g).');
    r.leadBoard = []; // ensure no stale leads linger
    console.log(`  R) rest day (no scenario, fatigue recovers)`);
    console.log(`  F) play a hand-authored day fixture (${dayFixtures.length} available)`);
    console.log(`  0) cancel`);
    const ansLocked = (await rl.question('choose > ')).trim();
    if (ansLocked === '' || ansLocked === '0') return;
    if (ansLocked.toLowerCase() === 'r') {
      await runRestDay(r, savePath, mercPool);
      return;
    }
    if (ansLocked.toLowerCase() === 'f') {
      await runFixtureDay(rl, r, mercPool, llm, dayFixtures, savePath, tagPool, roomCatalog);
      return;
    }
    console.log('cancelled.');
    return;
  }

  // PROTO-GAME: refresh the lead board first so today's options are visible.
  // PROTO-GAME v14: tilt rarity weights by current prestige tier — high-
  // prestige forts attract richer leads.
  const prestigeNow = computePrestige({
    displayedCount: r.displayedCount,
    legendaryLeadsCompleted: r.legendaryLeadsCompleted,
    fortLevel: r.fort.level,
    roomPrestige: totalRoomPrestige(r.fort, roomCatalog),
  });
  const tiltedWeights = tiltRarityWeights({ ...BASE_RARITY_WEIGHTS }, prestigeTier(prestigeNow));
  const refresh = refreshLeadBoard({ board: r.leadBoard, dayCount: r.dayCount, rarityWeights: tiltedWeights });
  r.leadBoard = [...refresh.kept, ...refresh.added];
  if (refresh.expired.length > 0) {
    console.log(`\n${refresh.expired.length} lead(s) expired overnight: ${refresh.expired.map((l) => l.id).join(', ')}`);
  }

  // PROTO-GAME v13.1: rare/legendary fanfare — call out arrivals that should
  // make the player lean forward.
  const newLegendaries = refresh.added.filter((l) => l.rarity === 'legendary');
  const newRares = refresh.added.filter((l) => l.rarity === 'rare');
  for (const l of newLegendaries) {
    console.log('');
    console.log('  ✦✦✦  A LEGENDARY LEAD HAS REACHED THE GATE  ✦✦✦');
    console.log(`        ${l.archetype} at ${l.region} — DC${l.dc}, reward ${l.rewardGold}g`);
    console.log(`        "${l.blurb}"`);
    console.log(`        only ${Math.max(0, l.expiryDay - r.dayCount)}d before the moment passes`);
  }
  if (newLegendaries.length === 0 && newRares.length > 0) {
    console.log(`\n  ★ ${newRares.length} rare lead${newRares.length === 1 ? '' : 's'} on the board today.`);
  }

  console.log(`\nLEAD BOARD  (day ${r.dayCount})`);
  for (let i = 0; i < r.leadBoard.length; i++) {
    const lead = r.leadBoard[i]!;
    const daysLeft = Math.max(0, lead.expiryDay - r.dayCount);
    const afford = r.gold >= lead.pursueCost ? '' : '  ⚠ cannot afford';
    // PROTO-GAME v13.1: rarity glyph prefix for instant visual sort.
    const glyph = lead.rarity === 'legendary' ? '✨' : lead.rarity === 'rare' ? '★' : lead.rarity === 'uncommon' ? '✦' : '·';
    const rarityLabel = lead.rarity === 'legendary' ? 'LEGENDARY' : lead.rarity;
    console.log(`  ${i + 1}) ${glyph} [${rarityLabel}] ${lead.archetype} — ${lead.region}  DC${lead.dc}  reward ${lead.rewardGold}g  cost ${lead.pursueCost}g  ${daysLeft}d left${afford}`);
    console.log(`     "${lead.blurb}"`);
    const scen = templateFor(lead);
    for (const slot of scen.slots) {
      const pAttr = slot.preferredAttr ? `  attr:${slot.preferredAttr}` : '';
      console.log(`     ↳ slot "${slot.id}"${pAttr}${formatPreferredTags(slot.preferredTags, tagPool)}`);
    }
  }
  console.log(`  R) rest day (no scenario, fatigue recovers)`);
  console.log(`  F) play a hand-authored day fixture (${dayFixtures.length} available)`);
  console.log(`  0) cancel`);
  const ans = (await rl.question('choose > ')).trim();
  if (ans === '' || ans === '0') return;
  if (ans === 'R' || ans === 'r') {
    await runRestDay(r, savePath, mercPool);
    return;
  }
  if (ans === 'F' || ans === 'f') {
    await runFixtureDay(rl, r, mercPool, llm, dayFixtures, savePath, tagPool, roomCatalog);
    return;
  }
  const idx = parseInt(ans, 10);
  if (!Number.isFinite(idx) || idx < 1 || idx > r.leadBoard.length) {
    console.log('cancelled.');
    return;
  }
  const lead = r.leadBoard[idx - 1]!;
  if (r.gold < lead.pursueCost) {
    console.log(`Not enough gold (need ${lead.pursueCost}g, have ${r.gold}g).`);
    return;
  }
  const pursued = pursueLead(lead, r.dayCount);
  if (!pursued.ok) {
    console.log(`Cannot pursue: ${pursued.error}`);
    return;
  }
  // Pay & remove from board
  r.gold -= pursued.goldSpent;
  r.leadBoard = r.leadBoard.filter((l) => l.id !== lead.id);
  console.log(`\n→ Pursuing [${lead.rarity}] ${lead.archetype} at ${lead.region} (paid ${pursued.goldSpent}g, ${r.gold}g remaining)`);

  // Materialize the in-memory scenario as a temp file so resolveDay can load it.
  const sessTmp = join(tmpdir(), `airaider-game-${process.pid}`);
  mkdirSync(sessTmp, { recursive: true });
  const scenarioPath = join(sessTmp, `${pursued.scenario.id}.json`);
  writeFileSync(scenarioPath, JSON.stringify(pursued.scenario, null, 2));
  const dayPath = join(sessTmp, `day-pursued-${lead.id}.json`);
  const dayObj = {
    id: `day-pursued-${lead.id}`,
    name: `${lead.archetype} at ${lead.region}`,
    scenarios: [scenarioPath],
    seed: `day-${r.dayCount}-${lead.id}`,
  };
  writeFileSync(dayPath, JSON.stringify(dayObj, null, 2));

  const day = loadDay(dayPath);
  await runPlayerDay(rl, r, mercPool, llm, day, dayPath, savePath, [pursued.scenario], tagPool, roomCatalog, {
    rewardGold: lead.rewardGold,
    captiveFromLead: lead.archetype === 'captive' ? lead : undefined,
    leadForOutcome: lead,
  });
}

/** Common deploy-picker + resolve + end-of-day wrapping used by lead & fixture paths. */
async function runPlayerDay(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  mercPool: Map<string, any>,
  llm: ScenarioLLM,
  day: any,
  dayPath: string,
  savePath: string,
  preloadedScenarios: any[] | null,
  tagPool: Map<string, any>,
  roomCatalog: Map<string, RoomDef>,
  opts: { rewardGold?: number; captiveFromLead?: Lead; leadForOutcome?: Lead } = {},
): Promise<void> {
  const { loadScenario } = await import('./scenarios.js');
  const mercsForDay = new Map(r.mercs.map((m) => [m.id, m]));
  const initialFatigue = new Map([...r.states.values()].map((s) => [s.id, s.fatigue]));
  const deployedSoFar = new Set<string>();
  const overrides = new Map<number, Array<{ slotId: string; mercId: string }>>();
  console.log(`\n→ ${day.name} (${day.scenarios.length} scenario${day.scenarios.length === 1 ? '' : 's'})`);
  console.log('Pick deployments for each scenario (0 to skip — fall back to fixture default):\n');

  for (let i = 0; i < day.scenarios.length; i++) {
    const scen = preloadedScenarios?.[i] ?? loadScenario(
      (day.scenarios[i] as string).startsWith('/') ? (day.scenarios[i] as string) : join(dirname(dayPath), day.scenarios[i] as string),
    );
    const isErrand = !!scen.daysToResolve && scen.daysToResolve > 0;
    console.log(`--- Scenario ${i + 1}/${day.scenarios.length}: ${scen.title} [${scen.archetype}]${isErrand ? `  (errand, ${scen.daysToResolve}d)` : ''}`);
    console.log(`    target: ${scen.target}`);
    const slotAssignments: Array<{ slotId: string; mercId: string }> = [];
    let skipped = false;
    for (const slot of scen.slots) {
      const eligible = r.mercs.filter((m: any) => !deployedSoFar.has(m.id));
      if (eligible.length === 0) {
        console.log(`    (no mercs free to fill slot "${slot.id}" — falling back to fixture default)`);
        skipped = true;
        break;
      }
      const pAttr = slot.preferredAttr;
      const ranked = [...eligible].sort((a: any, b: any) => {
        if (pAttr) {
          const av = a.attrs[pAttr]; const bv = b.attrs[pAttr];
          if (av !== bv) return bv - av;
        }
        const aTagHit = a.tags.some((t: any) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
        const bTagHit = b.tags.some((t: any) => slot.preferredTags?.includes(t.id)) ? 1 : 0;
        return bTagHit - aTagHit;
      });
      console.log(`\n    slot "${slot.id}" — prefers ${pAttr ?? '(any)'}${formatPreferredTags(slot.preferredTags, tagPool)}`);
      console.log(`    "${slot.description}"`);
      const picked = await pickFromList(rl, `    assign to ${slot.id}`, ranked, (m: any) => {
        const st = r.states.get(m.id);
        const matched = (m.tags as any[]).filter((t) => slot.preferredTags?.includes(t.id));
        const star = matched.length > 0 ? `  ★(${matched.map((t) => t.label).join(',')})` : '';
        const attrStr = pAttr ? `  ${pAttr}=${m.attrs[pAttr]}` : '';
        const fat = st && st.fatigue > 0 ? `  fat:${st.fatigue}` : '';
        const tier = st && st.tier !== 'rookie' ? `  ${st.tier}` : '';
        return `${m.name} [${m.id}]${attrStr}${star}${fat}${tier}${formatTags(m.tags)}`;
      });
      if (!picked) {
        console.log(`    (skipped — falling back to fixture default for this scenario)`);
        skipped = true;
        break;
      }
      slotAssignments.push({ slotId: slot.id, mercId: (picked as any).id });
      deployedSoFar.add((picked as any).id);
    }
    if (!skipped && slotAssignments.length === scen.slots.length) {
      overrides.set(i, slotAssignments);
    } else {
      for (const a of slotAssignments) deployedSoFar.delete(a.mercId);
    }
  }

  console.log(`\n→ Running ${day.name}…\n`);
  const res = await resolveDay({
    day, dayPath, mercs: mercsForDay, llm, initialFatigue, roster: r,
    assignmentsOverride: (idx) => overrides.get(idx),
  });
  console.log(renderDayTranscript(res));

  // PROTO-GAME: pay out lead reward on FAVORABLE/CATASTROPHIC_FAVORABLE; half on UNFAVORABLE; nothing on CATASTROPHIC.
  if (opts.rewardGold !== undefined && res.scenarios.length > 0) {
    const band = res.scenarios[0]!.band;
    let payout = 0;
    if (band === 'catastrophic-favorable') payout = Math.floor(opts.rewardGold * 1.5);
    else if (band === 'favorable') payout = opts.rewardGold;
    else if (band === 'unfavorable') payout = Math.floor(opts.rewardGold * 0.4);
    else payout = 0;
    if (payout > 0) {
      r.gold += payout;
      console.log(`\nREWARD: +${payout}g (band: ${band})  gold now ${r.gold}g`);
    } else {
      console.log(`\nREWARD: 0g (band: ${band})  gold ${r.gold}g`);
    }

    // PROTO-GAME v14: tally legendary kills for prestige. Only counts on
    // favorable+ resolution of a legendary lead.
    if (opts.leadForOutcome && opts.leadForOutcome.rarity === 'legendary'
        && (band === 'favorable' || band === 'catastrophic-favorable')) {
      r.legendaryLeadsCompleted += 1;
      console.log(`  ✨ LEGENDARY DEED RECORDED. Fort prestige climbs. Total legendary kills: ${r.legendaryLeadsCompleted}.`);
    }

    // PROTO-GAME: captive lead success grants a new captive to the roster
    // on favorable+ bands. The captive carries notoriety scaled with the
    // lead's DC so disposition choices (ransom/sell/recruit/...) matter.
    if (opts.captiveFromLead && (band === 'favorable' || band === 'catastrophic-favorable')) {
      const lead = opts.captiveFromLead;
      const cap = totalCapacity(r.fort, roomCatalog, 'dungeon');
      if (r.captives.length >= cap) {
        console.log(`\nCAPTIVE TAKEN but NO CELL FREE: dungeon cap ${cap}, currently held ${r.captives.length}.`);
        console.log(`  The prisoner was bound and dragged here — but with no Storeroom space, they slip free in the night.`);
        console.log(`  Build a Deep Storeroom or dispose of an existing captive first.`);
      } else {
        const captiveId = `captive-${lead.id}`;
        const notoriety = Math.max(1, lead.dc);
        const rolledTags = rollCaptiveTags(tagPool, lead.rarity, lead.id);
        // PROTO-GAME v14: auto-assign to first available dungeon cell so the
        // spatial system has visible state from day one. Player can `move`
        // from the captives menu.
        const freeCells = dungeonCellsWithSpace(r.fort, roomCatalog, r.captives);
        const assignedCell = freeCells[0];
        r.captives.push({
          id: captiveId,
          name: `Captive of ${lead.region}`,
          archetype: 'deserter',
          backstory: lead.blurb,
          notoriety,
          tags: rolledTags,
          cellIdx: assignedCell,
        });
        const cellNote = assignedCell !== undefined
          ? `held in cell ${assignedCell}`
          : `held in overflow corner (+escape risk — assign to a cell with [c])`;
        console.log(`\nCAPTIVE TAKEN: "${captiveId}" added to your hold (notoriety ${notoriety}, ${r.captives.length}/${cap} cells, ${cellNote}).${formatTags(rolledTags)}`);
        console.log(`  Use [c] to choose disposition or move.`);
      }
    }
  }

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

async function runRestDay(r: Roster, savePath: string, mercPool: Map<string, any>): Promise<void> {
  console.log('\n--- Rest day ---');
  r.dayCount += 1;
  // simple recovery: -1 fatigue for each merc (min 0)
  let recovered = 0;
  for (const s of r.states.values()) {
    if (s.fatigue > 0) { s.fatigue = Math.max(0, s.fatigue - 1); recovered += 1; }
  }
  console.log(`Day advances. ${recovered} merc(s) recovered fatigue.`);
  saveRoster(savePath, r, mercPool);
  console.log(`(auto-saved → ${savePath})`);
}

async function runFixtureDay(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  mercPool: Map<string, any>,
  llm: ScenarioLLM,
  dayFixtures: string[],
  savePath: string,
  tagPool: Map<string, any>,
  roomCatalog: Map<string, RoomDef>,
): Promise<void> {
  console.log('\nPick a hand-authored day fixture:');
  const pick = await pickFromList(rl, 'day', dayFixtures, (f) => f);
  if (!pick) return;
  const dayAbs = join(FIXTURES_DIR, pick);
  const day = loadDay(dayAbs);
  await runPlayerDay(rl, r, mercPool, llm, day, dayAbs, savePath, null, tagPool, roomCatalog);
}

async function cmdFort(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  catalog: any,
  roomCatalog: Map<string, RoomDef>,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  // Always render the layout first so the player sees what they have.
  console.log('');
  for (const line of renderFortLayout(r.fort, roomCatalog)) console.log(line);
  const cellsOpen = r.fort.cells.length;
  const placed = r.fort.placedRooms.length;
  console.log(`\nFort L${r.fort.level}  cells:${cellsOpen} (${placed} occupied)  upgrades:[${r.fort.upgrades.join(',') || '—'}]  gold:${r.gold}g`);
  const gates = activeGates(r.fort, roomCatalog);
  if (gates.size > 0) {
    console.log(`  active gates: ${[...gates].sort().join(', ')}`);
  } else {
    console.log('  active gates: (none — build rooms to unlock systems)');
  }

  const choice = (await rl.question('\n[b]uild room   [e]xcavate cell   [u]pgrade shop   [back] > ')).trim().toLowerCase();
  if (choice === 'b') {
    await cmdBuildRoom(rl, r, roomCatalog, mercPool, savePath);
  } else if (choice === 'e') {
    await cmdExcavate(rl, r, mercPool, savePath);
  } else if (choice === 'u') {
    await cmdBuyUpgrade(rl, r, catalog, mercPool, savePath);
  }
}

async function cmdBuildRoom(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  roomCatalog: Map<string, RoomDef>,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  // Find empty cells.
  const occupiedCells = new Set(r.fort.placedRooms.map((p) => p.cellIdx));
  const emptyCells = r.fort.cells.filter((c) => !occupiedCells.has(c.idx)).sort((a, b) => a.idx - b.idx);
  if (emptyCells.length === 0) {
    console.log('\n(no empty cells — excavate first)');
    return;
  }
  // Catalog of buildable rooms (excludes already-placed unique rooms, sorted by cost asc).
  const placedRoomIds = new Set(r.fort.placedRooms.map((p) => p.roomId));
  const uniques = new Set(['scouting-post', 'tavern', 'chapel', 'watch-tower', 'granary']);
  const buildable = [...roomCatalog.values()]
    .filter((rd) => !(uniques.has(rd.id) && placedRoomIds.has(rd.id)))
    .filter((rd) => !rd.starter || !placedRoomIds.has(rd.id))
    .sort((a, b) => a.cost - b.cost);
  if (buildable.length === 0) {
    console.log('\n(every room already placed)');
    return;
  }
  const room = await pickFromList(rl, '\nbuild which?', buildable, (rd) => {
    const affordTag = rd.cost <= r.gold ? '' : ' (✗ insufficient gold)';
    const gates = rd.gates.length > 0 ? `  gates:[${rd.gates.join(',')}]` : '';
    const adj = rd.adjacencyMates.length > 0 ? `  pairs:[${rd.adjacencyMates.join(',')}]` : '';
    return `${rd.name} [${rd.id}]  ${rd.cost}g  cat:${rd.category}${gates}${adj}${affordTag}\n      ${rd.description}`;
  });
  if (!room) return;
  if (room.cost > r.gold) { console.log('✗ insufficient gold.'); return; }
  const cell = await pickFromList(rl, 'place in which cell?', emptyCells, (c) => `cell ${c.idx}  (opened day ${c.openedOnDay})`);
  if (!cell) return;
  const out = buildRoom(r.fort, r.gold, room, cell.idx, r.dayCount);
  if (!out.ok) {
    const e = out.error;
    const msg = e.kind === 'insufficient-gold' ? `need ${e.need}g, have ${e.have}g`
      : e.kind === 'cell-occupied' ? `cell already holds ${e.existing}`
      : e.kind === 'duplicate-room' ? `${e.roomId} already exists (unique room)`
      : e.kind === 'unknown-cell' ? 'unknown cell'
      : 'unknown room';
    console.log(`✗ ${msg}`);
    return;
  }
  r.fort = out.fort;
  r.gold = out.gold;
  appendFortLog(r, {
    day: r.dayCount + 1,
    kind: 'upgrade',
    message: `Built ${room.name} in cell ${cell.idx} for ${room.cost}g.`,
  });
  console.log(`✓ Built ${room.name} in cell ${cell.idx}. ${r.gold}g left.`);
  saveRoster(savePath, r, mercPool);
}

async function cmdExcavate(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  const out = excavateCell(r.fort, r.gold, r.dayCount);
  if (!out.ok) {
    if (out.error.kind === 'insufficient-gold') {
      console.log(`✗ excavation needs ${out.error.need}g, you have ${out.error.have}g.`);
    } else {
      console.log(`✗ excavation: floor ${out.error.floor} not opened.`);
    }
    return;
  }
  const confirm = (await rl.question(`Excavate a new cell for ${out.cost}g? (y/N) > `)).trim().toLowerCase();
  if (confirm !== 'y') { console.log('cancelled.'); return; }
  r.fort = out.fort;
  r.gold = out.gold;
  appendFortLog(r, {
    day: r.dayCount + 1,
    kind: 'upgrade',
    message: `Excavated cell ${r.fort.cells[r.fort.cells.length - 1]!.idx} for ${out.cost}g.`,
  });
  console.log(`✓ Excavated cell ${r.fort.cells[r.fort.cells.length - 1]!.idx}. ${r.gold}g left.`);
  saveRoster(savePath, r, mercPool);
}

async function cmdBuyUpgrade(
  rl: ReturnType<typeof createInterface>,
  r: Roster,
  catalog: any,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  const affordable = affordableUpgrades(catalog, r.fort, r.gold);
  if (affordable.length === 0) {
    console.log('\n(no affordable / unowned upgrades right now)');
    return;
  }
  const pick = await pickFromList(rl, '\nupgrade', affordable, (u) => `${u.name} [${u.id}]  ${u.cost}g  — ${u.description}`);
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
  roomCatalog: Map<string, RoomDef>,
  mercPool: Map<string, any>,
  savePath: string,
): Promise<void> {
  const gates = activeGates(r.fort, roomCatalog);
  if (!gates.has('recruit-pool')) {
    console.log('\nTAVERN  (locked)');
    console.log('  No Tavern built — drifters drift past without stopping.');
    console.log('  Build one via [f] fort → [b]uild → Tavern (8g).');
    return;
  }
  if (r.hirePool.length === 0) {
    console.log('\n(bench is empty — wait for a refresh)');
    return;
  }
  const pick = await pickFromList(rl, 'hire who?', r.hirePool, (e) => `${e.merc.name} [${e.merc.id}]  ${e.price}g  wage:${e.merc.wage}  posted day ${e.postedDay}${formatTags(e.merc.tags)}`);
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
  roomCatalog: Map<string, RoomDef>,
  savePath: string,
): Promise<void> {
  if (r.captives.length === 0) {
    console.log('\n(no captives held)');
    return;
  }
  const cap = await pickFromList(rl, 'which captive?', r.captives, (c) => {
    const eff = captiveCellEffects(r.fort, roomCatalog, c.cellIdx);
    const cellLabel = c.cellIdx === undefined
      ? 'OVERFLOW CORNER (+escape risk)'
      : `cell ${c.cellIdx} (${eff.roomName ?? '?'})`;
    const adjLabels: string[] = [];
    if (eff.chapelAdjacent) adjLabels.push('chapel-adj → free recruit');
    if (eff.smithyAdjacent) adjLabels.push('smithy-adj → +5g ransom');
    const adj = adjLabels.length > 0 ? `  [${adjLabels.join(', ')}]` : '';
    return `${c.name}  ${c.archetype}  notoriety:${c.notoriety}  ${cellLabel}${adj}${formatTags(c.tags)}`;
  });
  if (!cap) return;
  const currentEff = captiveCellEffects(r.fort, roomCatalog, cap.cellIdx);
  console.log(`\nCaptive ${cap.name} — held in ${cap.cellIdx === undefined ? 'OVERFLOW CORNER' : `cell ${cap.cellIdx} (${currentEff.roomName ?? '?'})`}`);
  if (currentEff.chapelAdjacent) console.log('  ⛪ chapel adjacent — recruit will be free + bypasses fort level');
  if (currentEff.smithyAdjacent) console.log('  ⚒  smithy adjacent — ransom gains +5g');

  // PROTO-GAME v14: 'move' is a CLI-only meta-action alongside the
  // engine dispositions. Don't add it to CAPTIVE_ACTIONS (which feeds
  // schemas / saves); offer it as a separate menu option.
  const MENU = ['move', ...CAPTIVE_ACTIONS] as const;
  const choice = await pickFromList(rl, 'action', [...MENU], (a) => a);
  if (!choice) return;

  if (choice === 'move') {
    const free = dungeonCellsWithSpace(r.fort, roomCatalog, r.captives.filter((c) => c.id !== cap.id));
    if (free.length === 0) {
      console.log('  No dungeon cells with capacity. Build another Storeroom first.');
      return;
    }
    const target = await pickFromList(rl, 'move to which cell?', free, (idx) => {
      const eff = captiveCellEffects(r.fort, roomCatalog, idx);
      const adj: string[] = [];
      if (eff.chapelAdjacent) adj.push('chapel-adj');
      if (eff.smithyAdjacent) adj.push('smithy-adj');
      return `cell ${idx} (${eff.roomName ?? '?'})${adj.length ? '  [' + adj.join(', ') + ']' : ''}`;
    });
    if (target === undefined) return;
    cap.cellIdx = target;
    console.log(`✓ moved ${cap.name} to cell ${target}`);
    saveRoster(savePath, r, mercPool);
    return;
  }

  const action = choice as CaptiveAction;
  console.log(`\nCaptive ${cap.name} — disposition: ${action}`);
  const formerCaptiveTag = tagPool.get(FORMER_CAPTIVE_TAG_ID);
  const eff = effectOf(cap, action, {
    fortLevel: r.fort.level,
    chapelAdjacent: currentEff.chapelAdjacent,
    smithyAdjacent: currentEff.smithyAdjacent,
    ...(formerCaptiveTag ? { formerCaptiveTag } : {}),
  });
  if (eff.blocked) {
    console.log(`✗ Blocked: ${eff.blocked.reason}`);
    return;
  }
  applyCaptiveEffect(r, cap, eff);
  console.log(`✓ ${action}: gold ${eff.goldDelta >= 0 ? '+' : ''}${eff.goldDelta}g, rep ${eff.reputationGain} +1`);
  if (eff.benchPrice !== undefined) {
    console.log(`  posted to tavern bench at ${eff.benchPrice}g${eff.benchPrice === 0 ? ' (chapel-converted — free)' : ''}`);
  }
  saveRoster(savePath, r, mercPool);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
