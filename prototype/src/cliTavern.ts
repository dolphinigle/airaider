// CLI: view + manage a roster's tavern hire pool.
// Usage:
//   npm run tavern -- show --roster=<path>
//   npm run tavern -- refresh --roster=<path> [--seed=<n|string>] [--day=<n>]
//   npm run tavern -- hire --roster=<path> --index=<n>
//
// `show` is read-only. `refresh` and `hire` mutate the roster file in place.
// `refresh` does not gate on the weekly cadence — callers (or a future day
// loop integration) decide when to call it; this CLI is the manual override.

import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { loadRoster, saveRoster } from './roster.js';
import { refreshHirePool, hireFromPool, HIRE_BASE_PRICE } from './tavern.js';
import { mulberry32, rngFromString } from './rng.js';

interface Args {
  cmd: 'show' | 'refresh' | 'hire';
  rosterPath?: string;
  seed: string;
  day?: number;
  index?: number;
}

function parseArgs(argv: string[]): Args {
  const cmd = (argv[0] as Args['cmd']) ?? 'show';
  const args: Args = { cmd, seed: String(Date.now()) };
  for (const a of argv.slice(1)) {
    if (a.startsWith('--roster=')) args.rosterPath = a.slice('--roster='.length);
    else if (a.startsWith('--seed=')) args.seed = a.slice('--seed='.length);
    else if (a.startsWith('--day=')) args.day = parseInt(a.slice('--day='.length), 10);
    else if (a.startsWith('--index=')) args.index = parseInt(a.slice('--index='.length), 10);
  }
  return args;
}

function rngFromSeed(seed: string) {
  const asNum = Number(seed);
  return Number.isFinite(asNum) && /^-?\d+$/.test(seed) ? mulberry32(asNum) : rngFromString(seed);
}

function renderPool(roster: ReturnType<typeof loadRoster>): string {
  const lines: string[] = [];
  lines.push(`TAVERN — ${roster.hirePool.length} on the bench  |  gold ${roster.gold}g`);
  if (roster.hirePool.length === 0) {
    lines.push('  (no one is drinking. refresh with: tavern refresh)');
    return lines.join('\n');
  }
  roster.hirePool.forEach((e, i) => {
    const attrs = Object.entries(e.merc.attrs)
      .map(([k, v]) => `${k[0]!.toUpperCase()}${k.slice(1, 3)}:${v}`)
      .join(' ');
    const tagList = e.merc.tags.map((t) => `${t.label}(${t.rarity[0]!})`).join(', ');
    lines.push(`  [${i}] ${e.merc.name} (${e.merc.id})  ${e.price}g — posted day ${e.postedDay}`);
    lines.push(`        ${attrs}`);
    lines.push(`        tags: ${tagList}`);
  });
  lines.push(`  (base price ${HIRE_BASE_PRICE}g + 0..2 jitter; debt allowed)`);
  return lines.join('\n');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.rosterPath) {
    console.error('--roster=<path> is required');
    process.exit(2);
  }
  const tags = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
  const mercs = loadMercs(new URL('../data/mercs.json', import.meta.url).pathname, tags);
  const roster = loadRoster(args.rosterPath, mercs, tags);

  switch (args.cmd) {
    case 'show': {
      console.log(renderPool(roster));
      return;
    }
    case 'refresh': {
      const day = args.day ?? roster.dayCount;
      const rng = rngFromSeed(args.seed);
      const added = refreshHirePool(roster, rng, tags, day);
      saveRoster(args.rosterPath, roster, mercs);
      console.log(`Refreshed pool — added ${added.length} entries (day ${day}).`);
      console.log(renderPool(roster));
      return;
    }
    case 'hire': {
      if (args.index === undefined || Number.isNaN(args.index)) {
        console.error('--index=<n> is required for hire');
        process.exit(2);
      }
      const entry = roster.hirePool[args.index];
      if (!entry) {
        console.error(`no entry at index ${args.index} (pool size ${roster.hirePool.length})`);
        process.exit(1);
      }
      const hired = hireFromPool(roster, args.index);
      saveRoster(args.rosterPath, roster, mercs);
      console.log(`Hired ${hired.name} (${hired.id}) for ${entry.price}g. Gold: ${roster.gold}g.`);
      return;
    }
    default: {
      console.error(`unknown command: ${args.cmd}`);
      process.exit(2);
    }
  }
}

main();
