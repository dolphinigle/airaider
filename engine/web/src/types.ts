// Mirrors the snapshotState() shape from engine/server/src/routes.ts.
export interface Tag {
  id: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  tier: number;
  label: string;
}

export interface Merc {
  id: string;
  name: string;
  archetype: string;
  attrs: Record<string, number>;
  hp: number;
  wage: number;
  tags: Tag[];
}

export interface Captive {
  id: string;
  name: string;
  archetype: string;
  backstory: string;
  notoriety: number;
  tags: Tag[];
  cellIdx?: number;
  cellEffects: {
    roomName: string | null;
    adjacentRoomIds: string[];
    chapelAdjacent: boolean;
    smithyAdjacent: boolean;
  };
}

export interface PlacedRoom {
  roomId: string;
  cellIdx: number;
  builtOnDay: number;
}

export interface Cell {
  idx: number;
  openedOnDay: number;
}

export interface Lead {
  id: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  archetype: string;
  region: string;
  dc: number;
  rewardGold: number;
  pursueCost: number;
  postedDay: number;
  expiryDay: number;
  blurb: string;
}

export interface HirePoolEntry {
  merc: Merc;
  price: number;
  postedDay: number;
  startingTier?: 'rookie' | 'veteran' | 'grizzled';
  startingXp?: number;
}

export interface FortLogEntry {
  day: number;
  kind: string;
  message: string;
}

export interface PrestigeView {
  score: number;
  tier: 'unknown' | 'whispered' | 'feared' | 'storied' | 'legendary';
  tierLabel: string;
  displayedCount: number;
  legendaryLeadsCompleted: number;
}

export interface GameState {
  dayCount: number;
  gold: number;
  fort: {
    level: number;
    upgrades: string[];
    cells: Cell[];
    placedRooms: PlacedRoom[];
  };
  fortLayoutLines: string[];
  adjacencyBonuses: string[];
  adjacencyEffectIds: string[];
  captives: Captive[];
  dungeonFreeCells: number[];
  dungeonCapacity: number;
  leadBoard: Lead[];
  mercs: Merc[];
  hirePool: HirePoolEntry[];
  reputation: Record<string, number>;
  fortLog: FortLogEntry[];
  prestige: PrestigeView;
}

export interface RoomDef {
  id: string;
  name: string;
  category: string;
  cost: number;
  description: string;
  capacity?: number;
  incomePerDay?: number;
  gates: string[];
  adjacencyMates: string[];
  starter?: boolean;
}

export type Command =
  | { kind: 'advance-day' }
  | { kind: 'build-room'; roomId: string; cellIdx: number }
  | { kind: 'excavate' }
  | { kind: 'place-captive'; captiveId: string; cellIdx: number | null }
  | { kind: 'captive-action'; captiveId: string; action: 'ransom' | 'sell' | 'display' | 'recruit' | 'execute' }
  | { kind: 'refresh-leads' }
  | { kind: 'hire-merc'; mercId: string };
