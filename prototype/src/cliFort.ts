// CLI: list or purchase fort upgrades.
// Usage:
//   npm run fort -- <roster.json> list
//   npm run fort -- <roster.json> upgrade <upgrade-id>

import { resolve } from 'node:path';
import { loadTags } from './tags.js';
import { loadMercs } from './mercs.js';
import { loadRoster, saveRoster, appendFortLog } from './roster.js';
import { loadFortCatalog, purchaseUpgrade } from './fort.js';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.error('usage: npm run fort -- <roster.json> list|upgrade <id>');
    process.exit(1);
  }
  const rosterPath = resolve(process.cwd(), argv[0]!);
  const cmd = argv[1];

  const tagPool = loadTags(new URL('../data/tags.json', import.meta.url).pathname);
  const mercPool = loadMercs(new URL('../data/mercs.json', import.meta.url).pathname, tagPool);
  const catalog = loadFortCatalog(new URL('../data/fort-upgrades.json', import.meta.url).pathname);

  const roster = loadRoster(rosterPath, mercPool, tagPool);

  if (cmd === 'list') {
    console.log(`Fort  level ${roster.fort.level}   gold ${roster.gold}g`);
    console.log('─'.repeat(63));
    for (const u of catalog.values()) {
      const owned = roster.fort.upgrades.includes(u.id);
      const locked = u.requiresLevel != null && roster.fort.level < u.requiresLevel;
      const tag = owned ? ' [owned]' : locked ? ` [needs L${u.requiresLevel}]` : '';
      console.log(`  ${u.id.padEnd(22)} ${String(u.cost).padStart(3)}g  ${u.name}${tag}`);
      console.log(`      ${u.description}`);
    }
    return;
  }

  if (cmd === 'upgrade') {
    const id = argv[2];
    if (!id) { console.error('upgrade: missing <id>'); process.exit(1); }
    const upgrade = catalog.get(id);
    if (!upgrade) { console.error(`unknown upgrade: ${id}`); process.exit(1); }
    const res = purchaseUpgrade({ fort: roster.fort, gold: roster.gold, upgrade });
    if (!res.ok) {
      if (res.error.kind === 'already-owned') console.error(`already owned: ${id}`);
      else if (res.error.kind === 'level-locked') console.error(`level-locked: needs L${res.error.require}, fort is L${res.error.have}`);
      else console.error(`insufficient gold: need ${res.error.need}g, have ${res.error.have}g`);
      process.exit(1);
    }
    roster.fort = res.result.fort;
    roster.gold = res.result.gold;
    appendFortLog(roster, {
      day: roster.dayCount,
      kind: 'upgrade',
      message: `Purchased ${upgrade.name} for ${upgrade.cost}g${res.result.leveledUp ? ` (fort → L${roster.fort.level})` : ''}.`,
    });
    saveRoster(rosterPath, roster, mercPool);
    console.log(`Purchased ${upgrade.name} (${upgrade.id}) for ${upgrade.cost}g.`);
    if (res.result.leveledUp) console.log(`Fort leveled up → L${roster.fort.level}.`);
    console.log(`Gold remaining: ${roster.gold}g.  Upgrades: ${roster.fort.upgrades.join(', ')}`);
    return;
  }

  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
