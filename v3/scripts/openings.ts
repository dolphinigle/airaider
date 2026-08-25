// Dealt OPENING-FRAME values — the variety lever, in its corrected form (2026-08-25).
//
// THE LAW THIS ENCODES (measured, 5 arms x 24 cards, seed 101):
//   A feature is installed by a MANDATE; VARIETY is installed by a mandate that is DEALT.
//   - permission ("you may use names")        -> nothing:      24/24 cards keep the default frame
//   - mandate in prompt text                  -> ONE new shape: prompt text holds only one value
//   - mandate in the prompt + value DEALT     -> N shapes at no quality cost (92% clean, = control)
//
// THE SPLIT BELOW IS THE WHOLE TRICK. The IMPERATIVE lives in the prompt, once and fixed
// ("openWith: the situation's first clause must begin with this. Obey it exactly."). Only the VALUE
// is dealt. The first draft of this pool dealt whole commands ("Begin with the place.") and the
// model pasted the command into the card: 10/24 outputs literally began with the word "Begin".
// That is this project's prose-shaped-input-paste law for the sixth time — an imperative is just as
// pasteable as prose. A bare noun phrase is not a sentence, so it cannot be pasted as one.
//
// Values are FRAMES, never content: no game-world nouns (a token naming one deals a scene, not a
// structure — an earlier draft pushed "gate" from 42% of inputs to 79% of outputs).

// THIRD FORM, and the one that holds. Commands pasted ("Begin..." x10/24); bare noun phrases pasted
// too ("a physical object rests on a cracked hive box" x10/24 — and the LINT SCORED THAT 100% CLEAN,
// a blind spot now known). Anything that reads as writable English gets printed when the prompt says
// the card "must begin with this". So the dealt value is a bare CATEGORY LABEL — a word that cannot
// sit in period prose — and the prompt carries an adjacent no-print ban (w4 measured adjacent bans
// at 5/24 -> 0/24 leakage with no pink-elephant rebound).
export const OPENINGS: string[] = [
  'SECOND-PERSON',   // the card's first word is You
  'PERSON',
  'PLACE',
  'OBJECT',
  'SPEECH',          // a quoted line comes first
  'TIME',
  'PRIOR-EVENT',     // something that already happened
  'FLAT-FACT',
];
