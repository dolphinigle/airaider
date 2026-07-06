// Regions — GENERATION_FLOW §13 (locked list, bands, shallow graph).
// ONE mechanical unit; everything finer is a lorebook name.

export interface Region {
  id: string;
  name: string;
  faction: string | null;       // native race (null = Underdeep)
  levelBand: [number, number];
  /** race appearOdds bias for casting/recruits from this region */
  poolWeights: Record<string, number>;
  /** unlocked by building its Scouting lodge, which needs this GH tier */
  ghTier: number;
  prev: string | null;          // spine gating (build prev's lodge first)
  seed: string;                 // 1–2 anchor lore facts
  seedPlain?: string;           // the seed WITHOUT its landmark — sent when the card may not name it
  landmark?: string;            // the seed's named landmark — engine seeds must not re-deal it
}

export const REGIONS: Region[] = [
  {
    id: 'forests', name: 'Western Forests', faction: 'elf', levelBand: [1, 8],
    poolWeights: { elf: 4, human: 2, wolfman: 0.5, lizardman: 0.2 },
    ghTier: 1, prev: null,
    // no ready-made epithet before the landmark's name — a shown phrase gets copied verbatim
    seed: 'Old-growth elven forests west of the fort; the ruin of Thornhollow lies at their heart.',
    seedPlain: 'Old-growth elven forests west of the fort.',
    landmark: 'Thornhollow',
  },
  {
    id: 'city', name: 'The City', faction: 'human', levelBand: [6, 16],
    poolWeights: { human: 5, elf: 1, wolfman: 0.5, lizardman: 0.5 },
    ghTier: 4, prev: 'forests',
    seed: 'A walled river-city of guilds and grudges; the Brass Quarter never sleeps.',
  },
  {
    id: 'coast', name: 'The Drowned Coast', faction: 'lizardman', levelBand: [12, 22],
    poolWeights: { lizardman: 4, human: 2, elf: 0.5, wolfman: 0.3 },
    ghTier: 7, prev: 'city',
    seed: 'Salt-marsh coastline of sunken temples; lizardman clans fish the drowned streets.',
  },
  {
    id: 'highlands', name: 'The Highlands', faction: 'wolfman', levelBand: [18, 28],
    poolWeights: { wolfman: 4, human: 1.5, elf: 0.5, lizardman: 0.3 },
    ghTier: 10, prev: 'coast',
    seed: 'Storm-bitten crags where wolfman packs keep the old ways; the Howling Pass divides them.',
  },
  {
    id: 'underdeep', name: 'The Underdeep', faction: null, levelBand: [24, 34],
    poolWeights: { human: 1, elf: 1, wolfman: 1, lizardman: 1 },
    ghTier: 8, prev: 'coast',   // optional branch off the spine (§13)
    seed: 'A lightless labyrinth beneath the map; no people live there — things do.',
  },
  {
    id: 'outskirts', name: 'The Outskirts', faction: 'mixed', levelBand: [40, 50],
    poolWeights: { human: 1, elf: 1, wolfman: 1, lizardman: 1 },
    ghTier: 15, prev: null,     // opens via ALL endgame keys, not the spine
    seed: 'Off every map: the lands beyond the border-stones, where the roads themselves are lost.',
  },
];

export const REGION: Record<string, Region> = Object.fromEntries(REGIONS.map(r => [r.id, r]));
