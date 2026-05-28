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

interface CliArgs {
  dayPath: string;
  useReal: boolean;
  model?: string;
  outPath?: string;
  writeTranscript: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let dayPath: string | undefined;
  let useReal = false;
  let model: string | undefined;
  let outPath: string | undefined;
  let writeTranscript = true;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--real') useReal = true;
    else if (a === '--model') {
      i++;
      model = args[i];
    } else if (a === '--out') {
      i++;
      outPath = args[i];
    } else if (a === '--no-write') writeTranscript = false;
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
  return { dayPath, useReal, model, outPath, writeTranscript };
}

function printUsage(): void {
  console.error(
    `Usage: npm run day -- <day.json> [--real] [--model gpt-4.1-nano] [--out path] [--no-write]

  <day.json>       Path to day fixture (e.g. fixtures/day-01.json)
  --real           Use real OpenAI; needs OPENAI_API_KEY
  --model NAME     Override OpenAI model (default gpt-4.1-nano)
  --out PATH       Override transcript output path
  --no-write       Don't write a transcript JSON file (still prints to stdout)
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

  const resolution = await resolveDay({ day, dayPath: dayAbs, mercs, llm });

  console.log(renderDayTranscript(resolution));

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
