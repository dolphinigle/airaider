import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'node:os';

import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { loadScenario } from './scenarios.js';
import { resolveScenario, type Assignment } from './resolver.js';
import { renderTranscript } from './transcript.js';
import { rngFromString } from './rng.js';
import { MockScenarioLLM } from './llm/mock.js';
import { OpenAIScenarioLLM } from './llm/openai.js';
import type { ScenarioLLM } from './llm/interface.js';

interface CliArgs {
  fixturePath: string;
  useReal: boolean;
  model?: string;
  outPath?: string;
  seed?: string;
  writeTranscript: boolean;
  approachId?: string;
  force: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let fixturePath: string | undefined;
  let useReal = false;
  let model: string | undefined;
  let outPath: string | undefined;
  let seed: string | undefined;
  let writeTranscript = true;
  let approachId: string | undefined;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--real') useReal = true;
    else if (a === '--model') {
      i++;
      model = args[i];
    } else if (a === '--out') {
      i++;
      outPath = args[i];
    } else if (a === '--seed') {
      i++;
      seed = args[i];
    } else if (a === '--approach') {
      i++;
      approachId = args[i];
    } else if (a.startsWith('--approach=')) {
      approachId = a.slice('--approach='.length);
    } else if (a === '--no-write') writeTranscript = false;
    else if (a === '--force') force = true;
    else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else if (!fixturePath) fixturePath = a;
    else throw new Error(`Unexpected arg: ${a}`);
  }
  if (!fixturePath) {
    printUsage();
    process.exit(2);
  }
  return { fixturePath, useReal, model, outPath, seed, writeTranscript, approachId, force };
}

function printUsage(): void {
  console.error(
    `Usage: npm run scenario -- <fixture.json> [--real] [--model gpt-4o-mini] [--seed STR] [--out path] [--no-write] [--force]

  <fixture.json>   Path to scenario fixture (e.g. fixtures/raid-01.json)
  --real           Use real OpenAI; needs OPENAI_API_KEY (read from ~/.airaider/openai.env or env)
  --model NAME     Override OpenAI model (default gpt-4o-mini)
  --seed STR       Override the deterministic RNG seed
  --approach ID    For multi-approach scenarios, pick approach by id (e.g. assault|parley|poison)
  --out PATH       Override transcript output path
  --no-write       Don't write a transcript JSON file (still prints to stdout)
  --force          Allow overwriting an existing transcript at the default path
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

  // data/ is sibling of fixtures/ by convention
  const fixtureAbs = resolve(args.fixturePath);
  const dataDir = resolve(dirname(fixtureAbs), '..', 'data');

  const tags = loadTags(join(dataDir, 'tags.json'));
  const mercs = loadMercs(join(dataDir, 'mercs.json'), tags);
  const fixture = loadScenario(fixtureAbs);

  if (!fixture.assignments || fixture.assignments.length === 0) {
    throw new Error(
      `Fixture ${fixture.id} has no assignments[] — M0 prototype requires explicit slot→merc binding`,
    );
  }
  const assignments: Assignment[] = fixture.assignments.map((a) => {
    const merc = mercs.get(a.mercId);
    if (!merc) throw new Error(`Unknown merc ${a.mercId} in fixture ${fixture.id}`);
    return { slotId: a.slotId, merc };
  });

  const seedSource = args.seed ?? fixture.seed ?? fixture.id;
  const rng = rngFromString(seedSource);

  let llm: ScenarioLLM;
  if (args.useReal) {
    llm = new OpenAIScenarioLLM({
      apiKey: process.env.OPENAI_API_KEY!,
      model: args.model ?? 'gpt-4o-mini',
    });
  } else {
    llm = new MockScenarioLLM();
  }

  const resolution = await resolveScenario({
    scenario: fixture, assignments, llm, rng, approachId: args.approachId,
  });

  console.log(renderTranscript(resolution));

  if (args.writeTranscript) {
    const defaultName = args.useReal ? 'transcript-real' : 'transcript-mock';
    const usingDefault = args.outPath == null;
    const out =
      args.outPath ??
      join(dirname(fixtureAbs), `${basename(fixtureAbs, '.json')}.${defaultName}.json`);
    if (usingDefault && existsSync(out) && !args.force) {
      console.error(`\nRefusing to overwrite existing transcript at ${out}.`);
      console.error(`Pass --out PATH to write elsewhere, --force to overwrite, or --no-write to skip.`);
      process.exit(3);
    }
    writeFileSync(out, JSON.stringify(resolution, null, 2) + '\n');
    console.log(`\nWrote: ${out}`);
  }
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
