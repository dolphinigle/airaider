// PROTO-GUI v0.1: catalog/pool/roster loaders shared across routes.
// Reuses the prototype's loader modules verbatim — no rewrite, no
// duplication. Cached per-process; call resetCaches() after a mod
// reload to pick up data changes.

import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';

import { loadTags } from '../../../prototype/src/tags.js';
import { loadMercs } from '../../../prototype/src/mercs.js';
import { loadFortCatalog } from '../../../prototype/src/fort.js';
import { loadRoomCatalog, type RoomDef } from '../../../prototype/src/rooms.js';
import {
  loadRoster,
  newRoster,
  rosterExists,
  saveRoster as saveRosterToDisk,
  type Roster,
} from '../../../prototype/src/roster.js';
import type { Merc, Tag } from '../../../prototype/src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROTO_ROOT = resolve(__dirname, '../../../prototype');
export const DATA_DIR = join(PROTO_ROOT, 'data');

export const DEFAULT_SAVE_PATH = process.env.AIRAIDER_SAVE_PATH
  ?? join(homedir(), '.airaider', 'gui-save.json');

interface Caches {
  tagPool: Map<string, Tag>;
  mercPool: Map<string, Merc>;
  roomCatalog: Map<string, RoomDef>;
  fortCatalog: ReturnType<typeof loadFortCatalog>;
}

let caches: Caches | null = null;
let cachedRoster: Roster | null = null;

export function loadCatalogs(): Caches {
  if (caches) return caches;
  const tagPool = loadTags(join(DATA_DIR, 'tags.json'));
  const mercPool = loadMercs(join(DATA_DIR, 'mercs.json'), tagPool);
  const fortCatalog = loadFortCatalog(join(DATA_DIR, 'fort-upgrades.json'));
  const roomCatalogList = loadRoomCatalog(join(DATA_DIR, 'rooms.json'));
  const roomCatalog = new Map<string, RoomDef>(roomCatalogList.map((r) => [r.id, r]));
  caches = { tagPool, mercPool, roomCatalog, fortCatalog };
  return caches;
}

export function resetCaches(): void {
  caches = null;
  cachedRoster = null;
}

export function getRoster(): Roster {
  if (cachedRoster) return cachedRoster;
  const { tagPool, mercPool } = loadCatalogs();
  if (rosterExists(DEFAULT_SAVE_PATH)) {
    cachedRoster = loadRoster(DEFAULT_SAVE_PATH, mercPool, tagPool);
  } else {
    // GUI cold-start: seed 2 starter mercs + 60g so the player can immediately
    // build (scouting-post 6g + tavern 8g), pursue a lead, and recruit more
    // from the bench. CLI starts leaner because it has interactive onboarding;
    // the GUI loop benefits from a faster ramp.
    const starterMercs: Merc[] = Array.from(mercPool.values()).slice(0, 2);
    cachedRoster = newRoster(starterMercs);
    cachedRoster.gold = 60;
    saveRoster();
  }
  return cachedRoster;
}

export function saveRoster(): void {
  if (!cachedRoster) return;
  const { mercPool } = loadCatalogs();
  const dir = dirname(DEFAULT_SAVE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  saveRosterToDisk(DEFAULT_SAVE_PATH, cachedRoster, mercPool);
}

export function setRoster(r: Roster): void {
  cachedRoster = r;
}
