// CLI: inspect / create a roster file.
// Usage:
//   npm run roster -- init <path>           # write a fresh roster from data/mercs.json
//   npm run roster -- show <path>           # pretty-print current state
//
// Day-loop integration is wired into cliDay.ts via --roster=<path>.

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { newRoster, loadRoster, saveRoster, type Roster } from './roster.js';
import { reputationTier } from './reputation.js';

function main(): void {
  const [cmd, pathArg] = process.argv.slice(2);
  if (!cmd || !pathArg) {
    console.error('Usage: npm run roster -- <init|show> <path>');
    process.exit(2);
  }
  const path = resolve(process.cwd(), pathArg);
  const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
  const basePool = loadMercs(
    new URL('../data/mercs.json', import.meta.url).pathname,
    tagPool,
  );

  if (cmd === 'init') {
    if (existsSync(path)) {
      console.error(`Refusing to overwrite existing file: ${path}`);
      process.exit(2);
    }
    const r = newRoster([...basePool.values()]);
    saveRoster(path, r, basePool);
    console.log(`Wrote fresh roster (${r.mercs.length} mercs) → ${path}`);
    return;
  }

  if (cmd === 'show') {
    if (!existsSync(path)) {
      console.error(`Roster file not found: ${path}`);
      process.exit(2);
    }
    const r = loadRoster(path, basePool, tagPool);
    printRoster(r, path);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(2);
}

function printRoster(r: Roster, path: string): void {
  console.log(`Roster @ ${path}`);
  console.log(`  day ${r.dayCount}   gold ${r.gold}g   v${r.schemaVersion}`);
  if (Object.keys(r.reputation).length > 0) {
    const rep = Object.entries(r.reputation)
      .map(([k, v]) => `${k}:${v}(${reputationTier(v)})`)
      .join('  ');
    console.log(`  reputation: ${rep}`);
  }
  console.log('━'.repeat(63));
  console.log(`Mercs (${r.mercs.length}):`);
  for (const m of r.mercs) {
    const st = r.states.get(m.id);
    const fatigue = st && st.fatigue > 0 ? `  fatigue:${st.fatigue}` : '';
    const dmg = st && st.hpDamage > 0 ? `  hp-${st.hpDamage}` : '';
    const vGain = st && st.veterancyGain > 0 ? `  v+${st.veterancyGain}` : '';
    console.log(`  • ${m.name} [${m.id}]${fatigue}${dmg}${vGain}`);
  }
  if (r.captives.length > 0) {
    console.log(`\nCaptives held (${r.captives.length}):`);
    for (const c of r.captives) {
      console.log(`  • ${c.name} [${c.id}]  ${c.archetype}  notoriety:${c.notoriety}`);
    }
  }
  if (r.fortLog.length > 0) {
    const tail = r.fortLog.slice(-5);
    console.log(`\nFort log (last ${tail.length} of ${r.fortLog.length}):`);
    for (const e of tail) {
      console.log(`  day ${e.day}  [${e.kind}]  ${e.message}`);
    }
  }
}

main();
