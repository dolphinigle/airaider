// Focused playtest: construct a fort with a tavern, chapel, throne-room,
// and storeroom; manufacture 3 captives with different tags; verify the
// themed-prestige mechanic does what the player would expect.
//
// Usage: npx tsx scripts/playtestThemedCaptives.ts

import { resolve, dirname, join } from 'node:path';
import { loadTags } from '../src/tags.js';
import { loadRoomCatalog } from '../src/rooms.js';
import {
  captiveRoomPrestige,
  captiveRoomPrestigeBreakdown,
  captiveHostableCells,
} from '../src/fortLayout.js';
import { computePrestige, prestigeTier, prestigeTierLabel } from '../src/prestige.js';
import type { FortState } from '../src/fort.js';

const PROTO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = join(PROTO_ROOT, 'data');

const tagPool = loadTags(join(DATA_DIR, 'tags.json'));
const roomCatalog = new Map(loadRoomCatalog(join(DATA_DIR, 'rooms.json')).map((r) => [r.id, r]));

const fort: FortState = {
  level: 1,
  upgrades: [],
  cells: [
    { idx: 0, floor: 0, col: 0, openedOnDay: 1 }, // tavern
    { idx: 1, floor: 0, col: 1, openedOnDay: 1 }, // throne-room
    { idx: 2, floor: 0, col: 2, openedOnDay: 1 }, // chapel
    { idx: 3, floor: 0, col: 3, openedOnDay: 1 }, // storeroom
  ],
  placedRooms: [
    { roomId: 'tavern', cellIdx: 0, builtOnDay: 1 },
    { roomId: 'throne-room', cellIdx: 1, builtOnDay: 1 },
    { roomId: 'chapel', cellIdx: 2, builtOnDay: 1 },
    { roomId: 'storeroom', cellIdx: 3, builtOnDay: 1 },
  ],
};

function tag(id: string) {
  const t = tagPool.get(id);
  if (!t) throw new Error(`unknown tag ${id}`);
  return t;
}

const captives = [
  {
    id: 'c1',
    name: 'Lord Aldric',
    archetype: 'noble heir',
    tags: [tag('bg:noble-bastard'), tag('trait:lost-heir'), tag('pers:charming')],
    cellIdx: undefined as number | undefined,
  },
  {
    id: 'c2',
    name: 'Brother Cael',
    archetype: 'wandering priest',
    tags: [tag('bg:priest'), tag('pers:stoic'), tag('trait:prophet-touched')],
    cellIdx: undefined as number | undefined,
  },
  {
    id: 'c3',
    name: 'Old Nan',
    archetype: 'peasant cook',
    tags: [tag('bg:peasant'), tag('pers:charming')],
    cellIdx: undefined as number | undefined,
  },
];

function printFort() {
  console.log('\nFORT LAYOUT:');
  for (const p of fort.placedRooms) {
    const def = roomCatalog.get(p.roomId)!;
    const wants = def.wantedTags?.length ? `  wants: [${def.wantedTags.map((t) => t.replace(/^[^:]+:/, '')).join(', ')}]` : '';
    const inCell = captives.find((c) => c.cellIdx === p.cellIdx);
    const holding = inCell ? `  ⛓ ${inCell.name}` : '';
    console.log(`  cell ${p.cellIdx} (${p.roomId}) cap:${def.capacity ?? '-'}${wants}${holding}`);
  }
}

function printPrestige(label: string) {
  const captiveP = captiveRoomPrestige(fort, roomCatalog, captives);
  const score = computePrestige({
    displayedCount: 0,
    legendaryLeadsCompleted: 0,
    fortLevel: 1,
    roomPrestige: 1 + 1, // chapel (1) + throne-room (5) wait actually
    captivePrestige: captiveP,
  });
  console.log(`\n[${label}] captivePrestige=${captiveP}  totalScore=${score}  tier=${prestigeTierLabel(prestigeTier(score))}`);
  for (const c of captives) {
    const b = captiveRoomPrestigeBreakdown(fort, roomCatalog, c);
    const cellTxt = c.cellIdx === undefined ? 'OVERFLOW' : `cell ${c.cellIdx} (${b.roomId})`;
    const matchTxt = b.total > 0 ? ` → +${b.total}★/day  matches:[${b.matchedTagIds.join(',') || 'none'}]` : '';
    console.log(`  - ${c.name} [${c.tags.map((t) => t.id).join(',')}]  @ ${cellTxt}${matchTxt}`);
  }
}

// SCENARIO 1: All captives unassigned (overflow)
console.log('=== SCENARIO 1: all captives in overflow ===');
printFort();
printPrestige('S1');

// SCENARIO 2: All captives stuffed in storeroom (no prestige, but held)
console.log('\n=== SCENARIO 2: all captives in storeroom (no themed prestige) ===');
captives[0]!.cellIdx = 3;
captives[1]!.cellIdx = 3; // storeroom can hold up to 1 — bad placement test
captives[2]!.cellIdx = 3;
printFort();
printPrestige('S2');

// SCENARIO 3: Smart assignment — match captives to themed rooms
console.log('\n=== SCENARIO 3: smart themed assignment ===');
const hostable = captiveHostableCells(fort, roomCatalog, []);
console.log(`hostable cells (any captive can go here): ${hostable.join(', ')}`);
captives[0]!.cellIdx = 1; // Lord Aldric → throne-room (Lost Heir + Charming + noble-bastard)
captives[1]!.cellIdx = 2; // Brother Cael → chapel (priest + stoic + prophet-touched)
captives[2]!.cellIdx = 0; // Old Nan → tavern (peasant + charming)
printFort();
printPrestige('S3');

// SCENARIO 4: Reversed — mismatched assignments (just to see contrast)
console.log('\n=== SCENARIO 4: mismatched assignment (no tag overlap) ===');
captives[0]!.cellIdx = 0; // Lord Aldric → tavern (no tag overlap)
captives[1]!.cellIdx = 1; // Brother Cael → throne-room (no overlap)
captives[2]!.cellIdx = 2; // Old Nan → chapel (no overlap)
printFort();
printPrestige('S4');

// SCENARIO 5: Hostable when full (can we double-book?)
console.log('\n=== SCENARIO 5: throne-room already holds Aldric — hostable for c2? ===');
captives[0]!.cellIdx = 1;
captives[1]!.cellIdx = undefined;
captives[2]!.cellIdx = undefined;
const free = captiveHostableCells(fort, roomCatalog, captives, 'c2');
console.log(`hostable cells for Cael (excluding self) with Aldric in throne-room: ${free.join(', ')}`);
console.log('expected: tavern (0), chapel (2), storeroom (3) — NOT throne-room (1, full)');
