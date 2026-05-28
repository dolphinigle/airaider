// CLI: resolve a captive disposition (one action or all 5).
// Usage:
//   npm run captive -- <fixture.json> [--action=<a>] [--all] [--real] [--model=<m>] [--out=<path>]

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { homedir } from 'node:os';
import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import type { Tag } from './types.js';
import type { Captive, CaptiveAction } from './captive.js';
import { CAPTIVE_ACTIONS, effectOf, FORMER_CAPTIVE_TAG_ID } from './captive.js';
import { MockCaptiveLLM, OpenAICaptiveLLM, type CaptiveLLM } from './llm/captiveLLM.js';

const FixtureSchema = z.object({
  captive: z.object({
    id: z.string(),
    name: z.string(),
    archetype: z.string(),
    backstory: z.string(),
    notoriety: z.number().int().min(1).max(5),
    tagIds: z.array(z.string()),
  }),
  fortName: z.string(),
  partyMercIds: z.array(z.string()),
});

interface Args {
  fixture: string;
  action?: CaptiveAction;
  all: boolean;
  real: boolean;
  model?: string;
  out?: string;
  fortLevel?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { fixture: '', all: false, real: false };
  for (const a of argv) {
    if (a.startsWith('--action=')) args.action = a.slice(9) as CaptiveAction;
    else if (a === '--all') args.all = true;
    else if (a === '--real') args.real = true;
    else if (a.startsWith('--model=')) args.model = a.slice(8);
    else if (a.startsWith('--out=')) args.out = a.slice(6);
    else if (a.startsWith('--fort-level=')) args.fortLevel = parseInt(a.slice(13), 10);
    else if (!a.startsWith('--') && !args.fixture) args.fixture = a;
  }
  if (!args.fixture) throw new Error('captive: missing <fixture.json>');
  if (!args.action && !args.all) args.all = true;
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const fixturePath = resolve(process.cwd(), args.fixture);
  const raw = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const parsed = FixtureSchema.parse(raw);

  const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
  const mercPool = loadMercs(
    new URL('../data/mercs.json', import.meta.url).pathname,
    tagPool,
  );

  const captiveTags: Tag[] = parsed.captive.tagIds.map((id) => {
    const t = tagPool.get(id);
    if (!t) throw new Error(`unknown tag in captive: ${id}`);
    return t;
  });
  const captive: Captive = {
    id: parsed.captive.id,
    name: parsed.captive.name,
    archetype: parsed.captive.archetype,
    backstory: parsed.captive.backstory,
    notoriety: parsed.captive.notoriety,
    tags: captiveTags,
  };

  const partyNames = parsed.partyMercIds.map((id) => {
    const m = mercPool.get(id);
    if (!m) throw new Error(`unknown merc id in fixture party: ${id}`);
    return m.name;
  });

  let llm: CaptiveLLM = new MockCaptiveLLM();
  if (args.real) {
    loadEnv({ path: `${homedir()}/.airaider/openai.env`, quiet: true });
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY not found in ~/.airaider/openai.env');
    llm = new OpenAICaptiveLLM({ apiKey: key, model: args.model, callLimit: 10 });
  }

  const actions: CaptiveAction[] = args.all ? [...CAPTIVE_ACTIONS] : [args.action!];

  const transcript = {
    captiveId: captive.id,
    captiveName: captive.name,
    fortName: parsed.fortName,
    llm: llm.name,
    dispositions: [] as Array<{
      action: CaptiveAction;
      effect: ReturnType<typeof effectOf>;
      narration: { outcomeNarrative: string; captiveLine: string };
    }>,
  };

  for (const action of actions) {
    const effect = effectOf(captive, action, {
      fortLevel: args.fortLevel,
      formerCaptiveTag: tagPool.get(FORMER_CAPTIVE_TAG_ID),
    });
    const narration = await llm.narrate({
      captive,
      action,
      effect,
      fortName: parsed.fortName,
      partyNames,
    });
    transcript.dispositions.push({ action, effect, narration });
  }

  printTranscript(transcript);

  if (args.out) {
    writeFileSync(resolve(dirname(fixturePath), args.out), JSON.stringify(transcript, null, 2) + '\n', 'utf8');
    console.log(`\nWrote: ${args.out}`);
  }
}

function printTranscript(t: {
  captiveName: string;
  fortName: string;
  llm: string;
  dispositions: Array<{
    action: CaptiveAction;
    effect: ReturnType<typeof effectOf>;
    narration: { outcomeNarrative: string; captiveLine: string };
  }>;
}): void {
  console.log(`Captive: ${t.captiveName}  @ ${t.fortName}  (llm: ${t.llm})`);
  console.log('━'.repeat(63));
  for (const d of t.dispositions) {
    const e = d.effect;
    const gold = e.goldDelta > 0 ? `+${e.goldDelta}g` : (e.goldDelta < 0 ? `${e.goldDelta}g` : '0g');
    const tail = e.blocked
      ? `  → BLOCKED (${e.blocked.reason})`
      : (e.recruitedAs ? `  → posted to tavern bench @ ${e.benchPrice}g` : '');
    console.log(`\n[${d.action.toUpperCase()}]  ${gold}  rep:${e.reputationGain}` + tail);
    console.log(`  ${d.narration.outcomeNarrative}`);
    console.log(`  ${d.narration.captiveLine}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
