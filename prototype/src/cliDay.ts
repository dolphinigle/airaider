import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'node:os';

import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { loadDay, resolveDay } from './day.js';
import { renderDayTranscript } from './dayTranscript.js';
import { MockScenarioLLM } from './llm/mock.js';
import { OpenAIScenarioLLM } from './llm/openai.js';
import type { ScenarioLLM } from './llm/interface.js';
import { loadRoster, saveRoster, rosterExists } from './roster.js';
import { loadQuests, findStirrableQuests, stirQuest, carrierOf, advanceQuestsForScenario } from './quests.js';

interface CliArgs {
  dayPath: string;
  useReal: boolean;
  model?: string;
  outPath?: string;
  writeTranscript: boolean;
  rosterPath?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let dayPath: string | undefined;
  let useReal = false;
  let model: string | undefined;
  let outPath: string | undefined;
  let writeTranscript = true;
  let rosterPath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--real') useReal = true;
    else if (a === '--model') {
      i++;
      model = args[i];
    } else if (a === '--out') {
      i++;
      outPath = args[i];
    } else if (a.startsWith('--roster=')) rosterPath = a.slice('--roster='.length);
    else if (a === '--no-write') writeTranscript = false;
    else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else if (!dayPath) dayPath = a;
    else throw new Error(`Unexpected arg: ${a}`);
  }
  if (!dayPath) {
    printUsage();
    process.exit(2);
  }
  return { dayPath, useReal, model, outPath, writeTranscript, rosterPath };
}

function printUsage(): void {
  console.error(
    `Usage: npm run day -- <day.json> [--real] [--model gpt-4.1-nano] [--out path] [--no-write] [--roster=PATH]

  <day.json>       Path to day fixture (e.g. fixtures/day-01.json)
  --real           Use real OpenAI; needs OPENAI_API_KEY
  --model NAME     Override OpenAI model (default gpt-4.1-nano)
  --out PATH       Override transcript output path
  --no-write       Don't write a transcript JSON file (still prints to stdout)
  --roster=PATH    Load/save persistent roster state (creates if missing)
`,
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.useReal) {
    const envPath = join(homedir(), '.airaider', 'openai.env');
    if (existsSync(envPath)) loadDotenv({ path: envPath, override: false });
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        `--real requires OPENAI_API_KEY (looked in ${envPath} and process env). Aborting.`,
      );
      process.exit(3);
    }
  }

  const dayAbs = resolve(args.dayPath);
  const dataDir = resolve(dirname(dayAbs), '..', 'data');

  const tags = loadTags(join(dataDir, 'tags.json'));
  const mercs = loadMercs(join(dataDir, 'mercs.json'), tags);
  const day = loadDay(dayAbs);

  let roster: ReturnType<typeof loadRoster> | undefined;
  let mercsForDay: Map<string, import('./types.js').Merc> = mercs;
  let initialFatigue: Map<string, number> | undefined;
  const rosterAbs = args.rosterPath ? resolve(args.rosterPath) : undefined;
  const questCatalog = (() => {
    try { return loadQuests(join(dataDir, 'quests.json')); } catch { return new Map(); }
  })();
  if (rosterAbs) {
    if (rosterExists(rosterAbs)) {
      roster = loadRoster(rosterAbs, mercs, tags);
      console.log(`Loaded roster: ${rosterAbs}  (day ${roster.dayCount} → ${roster.dayCount + 1})`);
    } else {
      const { newRoster } = await import('./roster.js');
      roster = newRoster([...mercs.values()]);
      console.log(`Initialized roster: ${rosterAbs}`);
    }
    mercsForDay = new Map(roster.mercs.map((m) => [m.id, m]));
    initialFatigue = new Map([...roster.states.values()].map((s) => [s.id, s.fatigue]));

    // M5.2: auto-stir any quest whose seeded tag is now carried.
    if (questCatalog.size > 0) {
      const stirrable = findStirrableQuests(roster, questCatalog);
      for (const q of stirrable) {
        const carrier = carrierOf(roster, q.seededByTag);
        stirQuest(roster, q, carrier);
        console.log(`\n  ✦ Quest stirred: "${q.name}" (carried by ${carrier ?? 'unknown'})`);
        console.log(`    ${q.summary}`);
      }
    }
  }

  let llm: ScenarioLLM;
  if (args.useReal) {
    llm = new OpenAIScenarioLLM({
      apiKey: process.env.OPENAI_API_KEY!,
      model: args.model ?? 'gpt-4.1-nano',
      // day loops can run more scenarios than the single-scenario CLI;
      // bump the call limit accordingly.
      callLimit: 25,
    });
  } else {
    llm = new MockScenarioLLM();
  }

  const resolution = await resolveDay({ day, dayPath: dayAbs, mercs: mercsForDay, llm, initialFatigue, roster });

  console.log(renderDayTranscript(resolution));

  if (roster && rosterAbs) {
    roster.dayCount += 1;
    for (const [mercId, fatigue] of Object.entries(resolution.finalFatigue)) {
      const s = roster.states.get(mercId) ?? { id: mercId, fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 0, tier: 'rookie' as const };
      s.fatigue = fatigue;
      roster.states.set(mercId, s);
    }
    // M5.1: apply casualties from each scenario in order.
    const { applyCasualties } = await import('./roster.js');
    const allCasualties = resolution.scenarios.flatMap((s) => s.casualties);
    const killed = applyCasualties(roster, allCasualties);
    if (allCasualties.length > 0) {
      console.log(`\nWounds inflicted: ${allCasualties.length}`);
      for (const c of allCasualties) {
        const dead = killed.includes(c.mercId) ? '  ☠ PERMADEATH' : '';
        console.log(`   • ${c.mercId} took ${c.damage} (${c.reason})${dead}`);
      }
    }
    // M5.2: advance quest stages for any scenario id matching an active quest stage.
    if (questCatalog.size > 0) {
      for (const s of resolution.scenarios) {
        const { advanced, completed } = advanceQuestsForScenario(roster, s.scenarioId, questCatalog);
        for (const a of advanced) {
          const q = questCatalog.get(a.questId);
          console.log(`\n  ✦ Quest "${q?.name ?? a.questId}" stage ${a.fromStage} → ${a.toStage}: ${q?.stages[a.toStage]?.summary ?? ''}`);
        }
        for (const c of completed) {
          const q = questCatalog.get(c.questId);
          console.log(`\n  ✦✦ Quest COMPLETED: "${q?.name ?? c.questId}"  reward: +${q?.rewardOnComplete.goldDelta ?? 0} gold, +1 rep ${q?.rewardOnComplete.reputationGain ?? ''}`);
        }
      }
    }
    saveRoster(rosterAbs, roster, mercs);
    console.log(`\nUpdated roster → ${rosterAbs}  (day ${roster.dayCount}, ${roster.mercs.length} mercs, ${roster.deceased.length} deceased, ${roster.activeQuests.length} active quests, ${roster.completedQuests.length} completed)`);
  }

  if (args.writeTranscript) {
    const defaultName = args.useReal ? 'day-real' : 'day-mock';
    const out =
      args.outPath ??
      join(dirname(dayAbs), `${basename(dayAbs, '.json')}.${defaultName}.json`);
    writeFileSync(out, JSON.stringify(resolution, null, 2) + '\n');
    console.log(`\nWrote: ${out}`);
  }
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
