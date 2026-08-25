// DEALT CARD-STRUCTURE TOKENS — the convergent recommendation of writers w3 and w4 (2026-08-25).
//
// WHY THIS FILE EXISTS. Two independent agents, working from opposite directions (minimal-rules vs
// teach-by-demonstration), hit the same wall and named the same fix:
//   w3: "any beat I ground in my own prose becomes a verbatim grammatical template within one
//        generation. The only beats that resisted are those grounded in a VARYING INPUT FIELD."
//   w4: "at reasoning_effort low this model holds exactly ONE card-shape at a time; whatever you
//        demonstrate or state becomes that shape. Breaking it needs a dealt token, not prompt text."
// w4 tried five prompt-side ways to break the template; all five scored WORSE than the plain version.
//
// SHAPES (shapes.ts) varies WHAT HAPPENS. This varies HOW THE CARD IS BUILT. They are orthogonal and
// are dealt from different rotations.
//
// TWO CONSTRUCTION LAWS THIS FILE OBEYS — both measured in this project, both expensive to relearn:
//  1. NO CONCRETE INSTANCE. Any concrete instance anywhere in the prompt is copied, and a concrete
//     instance inside a RULE leaks worse than one inside a demonstration (w4: 24/24 vs 5/24). So no
//     nouns from the game world appear below — only meta-vocabulary about clauses and lines.
//     MEASURED 2026-08-25: the first draft of this pool violated its own law. Six tokens said "the
//     fort"/"the asker", which imply an arrival scene; they pushed the word "gate" from 42% of
//     inputs to 79% of outputs, while the control amplified nothing (42% in, 45% out). A token that
//     names ANY game-world noun deals a scene, not a structure. Keep this list purely formal.
//  2. NOT PROSE-SHAPED. Prose-shaped input fields get pasted into the card verbatim; this project has
//     been bitten four separate times (pay envelope, oddActor rotation, motive hidden-truth, want's
//     grammatical voice). Every token below is IMPERATIVE and uses words a card would never contain
//     ("clause", "close", "line"), so a verbatim paste is self-evidently wrong and rare.

export const STRUCTURES: string[] = [
  // — where the hard concrete fact sits —
  'open on a physical object; let who and why arrive after it',
  'open on a person; put the physical object in the last clause',
  'put the hardest concrete detail in the middle, flanked by plainer clauses',
  'name no object at all; the card is what is said and what is missing',

  // — voice —
  'one person speaks, in quoted words; do not paraphrase what they said',
  'no one speaks; report only what could be seen from outside',
  'the one quoted line comes from someone other than the person asking',
  'someone speaks, and what they say does not match what is visible',

  // — what the last clause does —
  'close on a complication that makes the work harder than it first sounded',
  'close on a flat physical fact and stop; explain nothing',
  'close on something no one present can account for',
  'close on a stated cost',
  'close on a refusal, a condition, or a thing someone will not do',

  // — vantage —
  'write in the second person; the reader is the one being asked',
  'report it at one remove, as word that arrived, and name who carried it',
  'stay with a single observer throughout; report only what they could know',
];
