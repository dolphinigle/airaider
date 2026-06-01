// Seed bank — handcrafted "what if" sparks. A seed is the IGNITION for a story:
// at genesis it is collided with one or more persistent-pool characters to make
// "something new under the sun" (King/Gaiman). A seed is a SPARK, never a plot —
// it must stay abstract enough to land on many different people.
//
// PROTOTYPE SET (~14). Later: scale toward 1000, anchored on Polti's 36 Dramatic
// Situations for breadth. Tags drive weighted, anti-repeat selection.

export type Stakes = 'common' | 'rare' | 'legendary';

export interface Seed {
  id: string;
  spark: string;           // the "what if ..." one-liner
  situation: string;       // Polti-ish dramatic-situation label (for breadth tracking)
  emotionalCore: string;   // the feeling the spark presses on
  stakes: Stakes;          // scale this spark naturally supports
}

export const SEEDS: Seed[] = [
  { id: 'betray-savior', spark: 'What if someone must betray the one person who once saved their life?',
    situation: 'loyalty vs survival', emotionalCore: 'guilt of self-preservation', stakes: 'rare' },
  { id: 'debt-at-funeral', spark: 'What if a debt comes due on the day of a funeral?',
    situation: 'obstacle / obligation', emotionalCore: 'grief vs duty', stakes: 'common' },
  { id: 'witness-cant-speak', spark: 'What if the only witness to a wrong is the one person who cannot speak of it?',
    situation: 'enigma / suppressed testimony', emotionalCore: 'fear of speaking', stakes: 'rare' },
  { id: 'mercy-was-cowardice', spark: 'What if an act everyone praises as mercy was really cowardice the doer cannot admit?',
    situation: 'remorse / false virtue', emotionalCore: 'shame behind a good name', stakes: 'rare' },
  { id: 'child-unknown', spark: 'What if a parent works beside their grown child, who does not know who they are?',
    situation: 'recognition delayed', emotionalCore: 'longing and shame', stakes: 'rare' },
  { id: 'healer-caused-it', spark: 'What if the person fighting a sickness is the one who first carried it in?',
    situation: 'discovery of own dishonor', emotionalCore: 'buried guilt', stakes: 'legendary' },
  { id: 'oath-demands-harm', spark: 'What if keeping a sworn oath now requires harming someone you have come to love?',
    situation: 'sacrifice for an ideal', emotionalCore: 'honor vs affection', stakes: 'rare' },
  { id: 'revenge-target-wronged', spark: 'What if the person you came to kill turns out to be more wronged than you?',
    situation: 'vengeance turning to pity', emotionalCore: 'hatred meeting empathy', stakes: 'rare' },
  { id: 'inheritance-not-theirs', spark: 'What if someone holds something that was never rightfully theirs, and the rightful owner walks in?',
    situation: 'recovery of a lost thing', emotionalCore: 'greed and exposure', stakes: 'common' },
  { id: 'faith-gone-hollow', spark: 'What if a believer who lost their faith keeps performing it to protect everyone who leans on them?',
    situation: 'pretense to spare others', emotionalCore: 'private doubt', stakes: 'rare' },
  { id: 'deserter-recognized', spark: 'What if a quiet newcomer is recognized by someone hunting them for an old desertion?',
    situation: 'pursuit', emotionalCore: 'fear of the past arriving', stakes: 'rare' },
  { id: 'two-mourn-one-dead', spark: 'What if two people who loved the same dead person each blame the other for the death?',
    situation: 'rivalry in grief', emotionalCore: 'blame as a way to mourn', stakes: 'rare' },
  { id: 'comfort-sold-neighbor', spark: 'What if a small comfort someone enjoys was bought by quietly selling out a neighbor?',
    situation: 'betrayal for gain', emotionalCore: 'guilt under ease', stakes: 'common' },
  { id: 'promise-unkept', spark: 'What if someone made a promise to return that they cannot keep, and the one waiting still waits?',
    situation: 'obstacles of love', emotionalCore: 'guilt of the absent', stakes: 'common' },
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
