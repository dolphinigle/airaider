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
  fatigue: number;
  hpDamage: number;
  tier: 'rookie' | 'veteran' | 'grizzled';
  /** Optional flavor backstory, present on most generated mercs. */
  backstory?: string;
  gender?: string;
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
  floor: number;
  col: number;
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

export interface LLMLogEntry {
  ts: number;
  kind: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  label?: string;
  elapsedMs?: number;
}

export interface PrestigeView {
  score: number;
  tier: 'unknown' | 'whispered' | 'feared' | 'storied' | 'legendary';
  tierLabel: string;
  displayedCount: number;
  legendaryLeadsCompleted: number;
}

export interface QuestSlot {
  id: string;
  description: string;
  preferredAttr?: string;
  preferredTags?: string[];
}

export interface PursuedQuest {
  questId: string;
  title: string;
  target: string;
  lead: {
    id: string;
    rarity: Lead['rarity'];
    archetype: string;
    region: string;
    blurb: string;
    dc: number;
    rewardGold: number;
  };
  slots: QuestSlot[];
  /** slotId → mercId | null */
  assignments: Record<string, string | null>;
  pursuedOnDay: number;
  expiresOnDay: number;
  daysLeft: number;
}

export interface ResolutionRecord {
  questId: string;
  scenarioTitle: string;
  region: string;
  archetype: string;
  rarity: Lead['rarity'];
  rewardGold: number;
  band: 'catastrophic' | 'unfavorable' | 'favorable' | 'catastrophic-favorable';
  bandReason: string;
  outcomeNarrative: string;
  contributions: Array<{ mercId: string; mercName: string; line: string }>;
  rollFaces: string[];
  heads: number;
  tails: number;
  coinsActual: number;
  goldAwarded: number;
  casualties: Array<{ mercId: string; mercName: string; damage: number; reason: string }>;
  outcomeKind: 'success' | 'partial' | 'failure';
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
  llmLog?: LLMLogEntry[];
  prestige: PrestigeView;
  pursuedQuests: PursuedQuest[];
  lastResolutions: ResolutionRecord[];
}

export interface RoomDef {
  id: string;
  name: string;
  category: string;
  cost: number;
  description: string;
  capacity?: number;
  incomePerDay?: number;
  prestigeBonus?: number;
  wantedTags?: string[];
  gates: string[];
  adjacencyMates: string[];
  starter?: boolean;
}

export type Command =
  | { kind: 'end-day' }
  | { kind: 'build-room'; roomId: string; cellIdx: number }
  | { kind: 'excavate'; floor?: number; side?: 'left' | 'right' }
  | { kind: 'open-floor'; direction: 'up' | 'down' }
  | { kind: 'place-captive'; captiveId: string; cellIdx: number | null }
  | { kind: 'captive-action'; captiveId: string; action: 'ransom' | 'sell' | 'display' | 'recruit' | 'execute' }
  | { kind: 'refresh-leads' }
  | { kind: 'hire-merc'; mercId: string }
  | { kind: 'pursue-lead'; leadId: string }
  | { kind: 'assign-slot'; questId: string; slotId: string; mercId: string | null }
  | { kind: 'abandon-quest'; questId: string }
  | { kind: 'clear-resolutions' };
