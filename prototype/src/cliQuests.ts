// `npm run quests -- show <roster>`     — print quest state on a roster
// `npm run quests -- stir <roster> <quest-id>` — force-stir a quest (testing)
// `npm run quests -- list`               — print the catalog

import { resolve, dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { loadRoster, saveRoster, rosterExists } from './roster.js';
import { loadQuests, stirQuest, carrierOf } from './quests.js';

function dataDirFor(rosterPath: string): string {
  // First preference: the package's own data/ directory (resolved relative
  // to this source file). This works for any roster path the user passes
  // in. The original implementation derived data/ from the roster's
  // parent-parent dir, which broke when the roster lived outside the
  // prototype tree (e.g. /tmp/pt.json -> looked at /data/tags.json).
  const here = fileURLToPath(import.meta.url);
  const packaged = resolve(dirname(here), '..', 'data');
  if (existsSync(join(packaged, 'tags.json'))) return packaged;
  // Fallback for callers who really want a roster-co-located data dir.
  return resolve(dirname(rosterPath), '..', 'data');
}

function printUsage(): void {
  console.error(
    `Usage:
  npm run quests -- list
  npm run quests -- show <roster.json>
  npm run quests -- stir <roster.json> <quest-id>
`,
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) { printUsage(); process.exit(2); }
  const sub = args[0];

  if (sub === 'list') {
    // Use this file's path to find the data directory.
    const here = fileURLToPath(import.meta.url);
    const dataDir = resolve(dirname(here), '..', 'data');
    const catalog = loadQuests(join(dataDir, 'quests.json'));
    for (const q of catalog.values()) {
      console.log(`✦ ${q.id} — ${q.name}`);
      console.log(`  seed: ${q.seededByTag}`);
      console.log(`  ${q.summary}`);
      for (let i = 0; i < q.stages.length; i++) {
        const s = q.stages[i]!;
        console.log(`    stage ${i}: ${s.scenarioId} — ${s.summary}`);
      }
      console.log(`  reward: +${q.rewardOnComplete.goldDelta}g, +1 ${q.rewardOnComplete.reputationGain}`);
    }
    return;
  }

  const rosterArg = args[1];
  if (!rosterArg) { printUsage(); process.exit(2); }
  const rosterPath = resolve(rosterArg);
  if (!rosterExists(rosterPath)) {
    console.error(`Roster not found: ${rosterPath}`);
    process.exit(3);
  }
  const dataDir = dataDirFor(rosterPath);
  const tags = loadTags(join(dataDir, 'tags.json'));
  const mercsPool = loadMercs(join(dataDir, 'mercs.json'), tags);
  const roster = loadRoster(rosterPath, mercsPool, tags);
  const catalog = loadQuests(join(dataDir, 'quests.json'));

  if (sub === 'show') {
    console.log(`Roster: ${rosterPath}  (day ${roster.dayCount})`);
    console.log(`Mercs (${roster.mercs.length}):`);
    for (const m of roster.mercs) {
      const carriedRare = m.tags.filter((t) => t.rarity === 'rare' || t.rarity === 'legendary').map((t) => t.id);
      console.log(`  - ${m.id} (${m.name})${carriedRare.length ? '  rare/legendary: ' + carriedRare.join(', ') : ''}`);
    }
    console.log(`\nActive quests: ${roster.activeQuests.length}`);
    for (const aq of roster.activeQuests) {
      const q = catalog.get(aq.questId);
      const s = q?.stages[aq.stageIndex];
      console.log(`  ✦ ${aq.questId}  stage ${aq.stageIndex}/${(q?.stages.length ?? 1) - 1}: ${s?.summary ?? '?'}`);
      console.log(`    next scenario id: ${s?.scenarioId ?? '?'}  (seeded by ${aq.seededByMercId ?? 'unknown'} on day ${aq.stirredOnDay})`);
    }
    console.log(`\nCompleted quests: ${roster.completedQuests.length}`);
    for (const cq of roster.completedQuests) {
      const q = catalog.get(cq.questId);
      console.log(`  ✓ ${cq.questId} (${q?.name ?? '?'}) on day ${cq.dayCompleted}`);
    }
    return;
  }

  if (sub === 'stir') {
    const questId = args[2];
    if (!questId) { printUsage(); process.exit(2); }
    const q = catalog.get(questId);
    if (!q) {
      console.error(`Unknown quest id: ${questId}`);
      process.exit(4);
    }
    const seedingTag = q.seededByTag;
    const carrier = seedingTag ? carrierOf(roster, seedingTag) : undefined;
    if (seedingTag && !carrier) {
      console.error(`No roster merc carries seeding tag "${seedingTag}"; stirring anyway with unknown carrier.`);
    }
    stirQuest(roster, q, carrier);
    saveRoster(rosterPath, roster, mercsPool);
    console.log(`Stirred "${q.name}" on ${rosterPath} (carrier: ${carrier ?? 'unknown'})`);
    return;
  }

  printUsage();
  process.exit(2);
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
// eslint suppression
void existsSync;
