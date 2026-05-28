// CLI: print a randomly generated recruit pool.
// Usage:
//   npm run recruit -- [--seed=<n|string>] [--count=<k>]
//
// Output is plain-text human-readable, NOT JSON. For programmatic use
// import generateRecruitPool from src/generator.ts directly.

import { loadTags } from './tags.js';
import { generateRecruitPool } from './generator.js';
import { mulberry32, rngFromString } from './rng.js';
import type { Merc } from './types.js';

function parseArgs(argv: string[]): { seed: string; count: number } {
  let seed = String(Date.now());
  let count = 5;
  for (const a of argv) {
    if (a.startsWith('--seed=')) seed = a.slice('--seed='.length);
    else if (a.startsWith('--count=')) count = parseInt(a.slice('--count='.length), 10);
  }
  return { seed, count };
}

function rngFromSeed(seed: string) {
  const asNum = Number(seed);
  return Number.isFinite(asNum) && /^-?\d+$/.test(seed) ? mulberry32(asNum) : rngFromString(seed);
}

function renderMerc(m: Merc): string {
  const lines: string[] = [];
  lines.push(`  ${m.name}  [${m.id}]`);
  const attrs = Object.entries(m.attrs)
    .map(([k, v]) => `${k[0]!.toUpperCase()}${k.slice(1, 3)}:${v}`)
    .join('  ');
  lines.push(`    ${attrs}`);
  const tags = m.tags.map((t) => `${t.label} (${t.rarity[0]!})`).join(', ');
  lines.push(`    tags: ${tags}`);
  return lines.join('\n');
}

function main(): void {
  const { seed, count } = parseArgs(process.argv.slice(2));
  const tags = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
  const rng = rngFromSeed(seed);
  const pool = generateRecruitPool(rng, tags, count);
  console.log(`Recruit pool — seed=${seed} count=${count}`);
  console.log('━'.repeat(63));
  for (const m of pool) {
    console.log(renderMerc(m));
    console.log('');
  }
}

main();
