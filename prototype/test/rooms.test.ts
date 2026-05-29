// PROTO-GAME tests: fort cells + room placement + adjacency + gates.

import { describe, it, expect } from 'vitest';
import { loadRoomCatalog, nextExcavationCost, adjacentIndices, type RoomDef } from '../src/rooms.js';
import {
  renderFortLayout,
  buildRoom,
  excavateCell,
  activeGates,
  totalCapacity,
  adjacencyBonuses,
} from '../src/fortLayout.js';
import type { FortState } from '../src/fort.js';

const CATALOG_PATH = new URL('../data/rooms.json', import.meta.url).pathname;
const catalogList = loadRoomCatalog(CATALOG_PATH);
const catalog = new Map<string, RoomDef>(catalogList.map((r) => [r.id, r]));

function starterFort(): FortState {
  return {
    level: 1,
    upgrades: [],
    cells: [
      { idx: 0, openedOnDay: 0 },
      { idx: 1, openedOnDay: 0 },
      { idx: 2, openedOnDay: 0 },
    ],
    placedRooms: [
      { roomId: 'drust-bedroom', cellIdx: 0, builtOnDay: 0 },
      { roomId: 'bunkroom', cellIdx: 1, builtOnDay: 0 },
      { roomId: 'storeroom', cellIdx: 2, builtOnDay: 0 },
    ],
  };
}

describe('rooms catalog', () => {
  it('loads without errors and contains the starter rooms', () => {
    expect(catalog.size).toBeGreaterThanOrEqual(8);
    expect(catalog.has('bunkroom')).toBe(true);
    expect(catalog.has('storeroom')).toBe(true);
    expect(catalog.has('drust-bedroom')).toBe(true);
    expect(catalog.has('tavern')).toBe(true);
    expect(catalog.has('scouting-post')).toBe(true);
  });

  it('Scouting Post gates the lead board', () => {
    const sp = catalog.get('scouting-post')!;
    expect(sp.gates).toContain('lead-board');
  });

  it('Tavern gates the recruit pool', () => {
    const t = catalog.get('tavern')!;
    expect(t.gates).toContain('recruit-pool');
  });

  it('Storeroom contributes captive cap = 1', () => {
    const s = catalog.get('storeroom')!;
    expect(s.category).toBe('dungeon');
    expect(s.capacity).toBe(1);
  });
});

describe('adjacency helpers', () => {
  it('cell 0 in a 3-cell row sees only cell 1', () => {
    expect(adjacentIndices(0, 3)).toEqual([1]);
  });
  it('cell 1 in a 3-cell row sees both 0 and 2', () => {
    expect(adjacentIndices(1, 3)).toEqual([0, 2]);
  });
});

describe('excavation cost', () => {
  it('first excavation beyond starter costs 15g', () => {
    expect(nextExcavationCost(3)).toBe(15);
  });
  it('second excavation costs ~24g (15 × 1.6)', () => {
    expect(nextExcavationCost(4)).toBe(24);
  });
  it('cost grows monotonically', () => {
    expect(nextExcavationCost(5)).toBeGreaterThan(nextExcavationCost(4));
    expect(nextExcavationCost(6)).toBeGreaterThan(nextExcavationCost(5));
  });
});

describe('renderFortLayout', () => {
  it('renders 3-cell starter fort with rooms', () => {
    const lines = renderFortLayout(starterFort(), catalog);
    const joined = lines.join('\n');
    expect(joined).toContain('Hero Bedroom');
    expect(joined).toContain('Bunkroom');
    expect(joined).toContain('Storeroom');
    expect(joined).toContain('cell 0');
    expect(joined).toContain('cell 2');
  });

  it('shows adjacency bonus when bedroom+bunkroom paired', () => {
    const lines = renderFortLayout(starterFort(), catalog);
    const joined = lines.join('\n');
    // drust-bedroom lists bunkroom in adjacencyMates
    expect(joined).toContain('Hero Bedroom ↔ Bunkroom');
  });
});

describe('buildRoom', () => {
  it('rejects when cell is occupied', () => {
    const fort = starterFort();
    const out = buildRoom(fort, 100, catalog.get('tavern')!, 1, 0);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('cell-occupied');
  });

  it('rejects when cell does not exist', () => {
    const fort = starterFort();
    const out = buildRoom(fort, 100, catalog.get('tavern')!, 99, 0);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('unknown-cell');
  });

  it('rejects when gold insufficient', () => {
    const fort: FortState = { ...starterFort(), cells: [...starterFort().cells, { idx: 3, openedOnDay: 1 }] };
    const out = buildRoom(fort, 2, catalog.get('tavern')!, 3, 1);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('insufficient-gold');
  });

  it('builds the tavern when affordable in an empty cell', () => {
    const fort: FortState = { ...starterFort(), cells: [...starterFort().cells, { idx: 3, openedOnDay: 1 }] };
    const tavern = catalog.get('tavern')!;
    const out = buildRoom(fort, 20, tavern, 3, 5);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.gold).toBe(20 - tavern.cost);
      expect(out.fort.placedRooms.find((p) => p.cellIdx === 3)?.roomId).toBe('tavern');
      expect(out.fort.placedRooms.find((p) => p.cellIdx === 3)?.builtOnDay).toBe(5);
    }
  });

  it('rejects duplicate of a unique room', () => {
    const fort: FortState = {
      ...starterFort(),
      cells: [...starterFort().cells, { idx: 3, openedOnDay: 1 }, { idx: 4, openedOnDay: 1 }],
      placedRooms: [
        ...starterFort().placedRooms,
        { roomId: 'tavern', cellIdx: 3, builtOnDay: 1 },
      ],
    };
    const out = buildRoom(fort, 100, catalog.get('tavern')!, 4, 2);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('duplicate-room');
  });
});

describe('excavateCell', () => {
  it('adds a new cell at the next index', () => {
    const fort = starterFort();
    const out = excavateCell(fort, 50, 1);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.fort.cells.length).toBe(4);
      expect(out.fort.cells[out.fort.cells.length - 1]!.idx).toBe(3);
      expect(out.cost).toBe(15);
      expect(out.gold).toBe(50 - 15);
    }
  });

  it('rejects when gold insufficient', () => {
    const fort = starterFort();
    const out = excavateCell(fort, 5, 1);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('insufficient-gold');
  });
});

describe('gates & capacity', () => {
  it('starter fort has captive-cap and bunk-cap but not lead-board or recruit-pool', () => {
    const gates = activeGates(starterFort(), catalog);
    expect(gates.has('captive-cap')).toBe(true);
    expect(gates.has('bunk-cap')).toBe(true);
    expect(gates.has('lead-board')).toBe(false);
    expect(gates.has('recruit-pool')).toBe(false);
  });

  it('total dungeon capacity starts at 1 (storeroom)', () => {
    expect(totalCapacity(starterFort(), catalog, 'dungeon')).toBe(1);
  });

  it('adding a Deep Storeroom raises dungeon capacity to 3', () => {
    const fort: FortState = {
      ...starterFort(),
      cells: [...starterFort().cells, { idx: 3, openedOnDay: 1 }],
      placedRooms: [
        ...starterFort().placedRooms,
        { roomId: 'extra-storeroom', cellIdx: 3, builtOnDay: 1 },
      ],
    };
    expect(totalCapacity(fort, catalog, 'dungeon')).toBe(3);
  });
});

describe('adjacency bonuses', () => {
  it('detects bedroom↔bunkroom in starter layout', () => {
    const bonuses = adjacencyBonuses(starterFort(), catalog);
    expect(bonuses.length).toBe(1);
    expect(bonuses[0]).toContain('Hero Bedroom');
    expect(bonuses[0]).toContain('Bunkroom');
  });

  it('detects smithy↔workshop when adjacent', () => {
    const fort: FortState = {
      level: 1,
      upgrades: [],
      cells: [
        { idx: 0, openedOnDay: 0 },
        { idx: 1, openedOnDay: 0 },
      ],
      placedRooms: [
        { roomId: 'smithy', cellIdx: 0, builtOnDay: 1 },
        { roomId: 'workshop', cellIdx: 1, builtOnDay: 1 },
      ],
    };
    const bonuses = adjacencyBonuses(fort, catalog);
    expect(bonuses.length).toBe(1);
    expect(bonuses[0]).toContain('Smithy');
    expect(bonuses[0]).toContain('Workshop');
  });

  it('does NOT detect a bonus across a non-adjacent gap', () => {
    const fort: FortState = {
      level: 1,
      upgrades: [],
      cells: [
        { idx: 0, openedOnDay: 0 },
        { idx: 1, openedOnDay: 0 },
        { idx: 2, openedOnDay: 0 },
      ],
      placedRooms: [
        { roomId: 'smithy', cellIdx: 0, builtOnDay: 1 },
        { roomId: 'workshop', cellIdx: 2, builtOnDay: 1 },
      ],
    };
    const bonuses = adjacencyBonuses(fort, catalog);
    expect(bonuses.length).toBe(0);
  });
});
