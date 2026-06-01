// Seed bank — handcrafted "what if" sparks. A seed is the IGNITION for a story:
// at genesis it is collided with one or more persistent-pool characters to make
// "something new under the sun" (King/Gaiman). A seed is a SPARK, never a plot —
// it must stay abstract enough to land on many different people.
//
// PROTOTYPE SET (~14). Later: scale toward 1000, anchored on Polti's 36 Dramatic
// Situations for breadth. Tags drive weighted, anti-repeat selection.

export type Stakes = 'uncommon' | 'rare' | 'legendary';

export interface Seed {
  id: string;
  spark: string;           // the "what if ..." one-liner
  situation: string;       // Polti-ish dramatic-situation label (for breadth tracking)
  emotionalCore: string;   // the feeling the spark presses on
  stakes: Stakes;          // scale this spark naturally supports
}

export const SEEDS: Seed[] = [
  { id: 'final-draught', spark: 'What if the healer who gave a dying man a "merciful" final draught did it so he would never wake to accuse her?',
    situation: 'remorse / false virtue', emotionalCore: 'shame behind a good name', stakes: 'rare' },
  { id: 'drag-back-savior', spark: 'What if a mercenary is hired to drag back a deserter, and it is the man who once carried her out of a burning hold?',
    situation: 'loyalty vs survival', emotionalCore: 'guilt of self-preservation', stakes: 'rare' },
  { id: 'creditor-at-grave', spark: 'What if a creditor arrives to collect at the graveside, before the body is even in the ground?',
    situation: 'obstacle / obligation', emotionalCore: 'grief vs duty', stakes: 'uncommon' },
  { id: 'salt-and-candles', spark: 'What if one house on a starving lane is never short of salt and candles, and the neighbors have begun to wonder how?',
    situation: 'unexplained fortune', emotionalCore: 'guilt under ease', stakes: 'uncommon' },
  { id: 'mute-witness', spark: 'What if the only person who saw the killing is a mute stablehand everyone has already decided not to believe?',
    situation: 'enigma / suppressed testimony', emotionalCore: 'fear of not being heard', stakes: 'rare' },
  { id: 'kin-at-the-fort', spark: 'What if a grey-haired laborer takes work at the fort just to be near the young soldier who has no idea they share blood?',
    situation: 'recognition delayed', emotionalCore: 'longing and shame', stakes: 'rare' },
  { id: 'carried-the-fever', spark: 'What if the woman nursing the fever-ward is the one who first walked the sickness in from the coast?',
    situation: 'discovery of own dishonor', emotionalCore: 'buried guilt', stakes: 'legendary' },
  { id: 'shared-bread', spark: 'What if a sworn man is ordered to put down the one prisoner who shared his bread every night for a month?',
    situation: 'sacrifice for an ideal', emotionalCore: 'honor vs affection', stakes: 'rare' },
  { id: 'feeding-the-orphans', spark: 'What if the raider you crossed three counties to kill turns out to be feeding the orphans of the village they supposedly burned?',
    situation: 'vengeance turning to pity', emotionalCore: 'hatred meeting empathy', stakes: 'rare' },
  { id: 'wrong-signet', spark: 'What if a man wears a signet ring that is not his, and the rightful heir walks into his tavern asking after it?',
    situation: 'recovery of a lost thing', emotionalCore: 'greed and exposure', stakes: 'uncommon' },
  { id: 'empty-prayers', spark: 'What if the priest leading the dawn prayers stopped believing years ago, and the whole village leans on those prayers to survive the winter?',
    situation: 'pretense to spare others', emotionalCore: 'private doubt', stakes: 'rare' },
  { id: 'old-name-at-the-gate', spark: 'What if a quiet newcomer freezes at a name no one here should know, called out by a stranger at the gate?',
    situation: 'pursuit', emotionalCore: 'fear of the past arriving', stakes: 'rare' },
  { id: 'same-grave', spark: 'What if two people meet at the same grave every winter, each certain the other got their shared love killed?',
    situation: 'rivalry in grief', emotionalCore: 'blame as a way to mourn', stakes: 'rare' },
  { id: 'place-at-the-table', spark: 'What if a soldier who swore to come home cannot, and learns the one who waited has set a place at the table every night for years?',
    situation: 'obstacles of love', emotionalCore: 'guilt of the absent', stakes: 'uncommon' },
];

export function pickSeed(opts?: { stakes?: Stakes; excludeIds?: ReadonlySet<string> }): Seed {
  let pool = SEEDS;
  if (opts?.stakes) pool = pool.filter((s) => s.stakes === opts.stakes);
  if (opts?.excludeIds) pool = pool.filter((s) => !opts.excludeIds!.has(s.id));
  if (pool.length === 0) pool = SEEDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function seedById(id: string): Seed | undefined {
  return SEEDS.find((s) => s.id === id);
}
