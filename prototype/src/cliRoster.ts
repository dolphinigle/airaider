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
import { statusAlerts, watchTowerForecast } from './rosterAlerts.js';
import { seasonFor, DAYS_PER_SEASON } from './season.js';
import { loadQuests } from './quests.js';
import { bondedPairsOf } from './bonds.js';

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
  const sc = seasonFor(r.dayCount);
  console.log(`  day ${r.dayCount}   gold ${r.gold}g   season:${sc.season}(d${sc.dayOfSeason}/${DAYS_PER_SEASON})   v${r.schemaVersion}`);
  const upg = r.fort.upgrades.length > 0 ? `  upgrades:[${r.fort.upgrades.join(',')}]` : '';
  console.log(`  fort: level ${r.fort.level}${upg}`);
  if (Object.keys(r.reputation).length > 0) {
    const rep = Object.entries(r.reputation)
      .map(([k, v]) => `${k}:${v}(${reputationTier(v)})`)
      .join('  ');
    console.log(`  reputation: ${rep}`);
  }

  // M15.1: status alert lines — surface debt, morale, payday/refresh
  // countdowns so the player isn't surprised by next-day mechanics.
  const alerts = statusAlerts(r);
  // M12.2: watch-tower forecast appended as an alert when the upgrade is owned.
  const forecast = watchTowerForecast(
    r,
    new URL('../data/events.json', import.meta.url).pathname,
  );
  if (forecast) alerts.push(forecast.line);
  if (alerts.length > 0) {
    console.log('  alerts:');
    for (const a of alerts) console.log(`    ${a}`);
  }

  console.log('━'.repeat(63));
  console.log(`Mercs (${r.mercs.length}):`);
  for (const m of r.mercs) {
    const st = r.states.get(m.id);
    const fatigue = st && st.fatigue > 0 ? `  fatigue:${st.fatigue}` : '';
    const dmg = st && st.hpDamage > 0 ? `  hp-${st.hpDamage}` : '';
    const vGain = st && st.veterancyGain > 0 ? `  v+${st.veterancyGain}` : '';
    const tier = st && st.tier !== 'rookie' ? `  ${st.tier}` : '';
    // M9.10: surface in-window grief stamp so the player sees who is mourning
    // (the same hint the LLM gets via recentlyLostBondPartner).
    const grief = st && st.recentGriefPartner ? `  grieving:${st.recentGriefPartner}` : '';
    console.log(`  • ${m.name} [${m.id}]${tier}${fatigue}${dmg}${vGain}${grief}`);
  }
  // M16.1: surface currently-bonded pairs so the player can see emergent
  // comradeship. Bonded pairs are derived from co-deployment counters.
  const bondKeys = bondedPairsOf(r);
  if (bondKeys.size > 0) {
    const nameOf = (id: string): string => r.mercs.find((m) => m.id === id)?.name ?? id;
    console.log(`\nBonded pairs (${bondKeys.size}):`);
    for (const key of [...bondKeys].sort()) {
      const [a, b] = key.split('|');
      if (!a || !b) continue;
      console.log(`  ⤬ ${nameOf(a)} [${a}] ⇔ ${nameOf(b)} [${b}]`);
    }
  }
  if (r.hirePool.length > 0) {
    console.log(`\nTavern bench (${r.hirePool.length}):`);
    for (const e of r.hirePool) {
      const vet = e.startingTier && e.startingTier !== 'rookie' ? ` ${e.startingTier}` : '';
      console.log(`  ⚑ ${e.merc.name} [${e.merc.id}]${vet}  ${e.price}g  (posted day ${e.postedDay})`);
    }
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
  // M15.2: active + recently-completed quest summary so the player
  // can see what's on the docket without crossing to `npm run quests`.
  if (r.activeQuests.length > 0 || r.completedQuests.length > 0) {
    try {
      const catalog = loadQuests(new URL('../data/quests.json', import.meta.url).pathname);
      if (r.activeQuests.length > 0) {
        console.log(`\nActive quests (${r.activeQuests.length}):`);
        for (const aq of r.activeQuests) {
          const q = catalog.get(aq.questId);
          const name = q?.name ?? aq.questId;
          const total = q?.stages.length ?? 0;
          const stageName = q?.stages[aq.stageIndex]?.scenarioId ?? '?';
          console.log(`  ◆ ${name} [${aq.questId}]  stage ${aq.stageIndex + 1}/${total} → ${stageName}`);
        }
      }
      if (r.completedQuests.length > 0) {
        const tail = r.completedQuests.slice(-3);
        console.log(`\nCompleted quests (last ${tail.length} of ${r.completedQuests.length}):`);
        for (const cq of tail) {
          const q = catalog.get(cq.questId);
          console.log(`  ✓ ${q?.name ?? cq.questId} [${cq.questId}]  (day ${cq.dayCompleted})`);
        }
      }
    } catch {
      // catalog missing or malformed — silently skip the section
    }
  }
}

/**
 * M15.1: derive a short list of status alert lines from the roster.
 * Surfaces debt streak, low morale, upcoming payday, and upcoming
 * tavern refresh so the player can plan ahead.
 */
// statusAlerts moved to ./rosterAlerts.ts for testability.

main();
