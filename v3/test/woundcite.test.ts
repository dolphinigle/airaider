// A wound must be SHOWN in the report to be applied — but "shown" cannot mean "quoted verbatim",
// because cheap models paraphrase their own sentence when they cite it (playtest 2026-09-25: both
// saga wounds were dropped, and the story said the soldier bled while the engine said they were fine).
import { describe, it, expect } from 'vitest';
import { causeShown } from '../src/game/game.js';

const after = "She slipped a coin and a question to one sentry and tried the ridge walk to the inner lip, " +
  "but a second sentry shouted and cut her across the thigh with a short spear. Blood stung and she stumbled.";

describe('a wound cited in the report', () => {
  it('counts when the model paraphrases its own sentence', () => {
    expect(causeShown("cut across the thigh by a sentry's short spear while attempting the ridge walk to the inner lip", after)).toBe(true);
  });
  it('counts when quoted exactly', () => {
    expect(causeShown('cut her across the thigh with a short spear', after)).toBe(true);
  });
  it('does not count a wound the report never shows', () => {
    expect(causeShown('an arrow took him in the shoulder at the gate', after)).toBe(false);
  });
  it('does not count an empty or wordless cause', () => {
    expect(causeShown('', after)).toBe(false);
    expect(causeShown('hit', after)).toBe(false);
  });
});

import { woundShownOn } from '../src/game/game.js';
describe('a wound listed without a cause', () => {
  const a = "Ervalir kept the two apart while they tested the snare. The cord gave at the old cut and the apprentice's claim held, but Ervalir's upper arm bled from the wire during the check.";
  it('counts for a solo soldier when the report shows a wound', () => {
    expect(woundShownOn('Ervalir Fernbrook', a, true)).toBe(true);
  });
  it('in a party, counts only on the soldier the wound sentence names', () => {
    expect(woundShownOn('Ervalir Fernbrook', a, false)).toBe(true);
    expect(woundShownOn('Felawen', a, false)).toBe(false);
  });
  it('does not count when nothing in the report hurts anyone', () => {
    expect(woundShownOn('Felawen', 'Felawen read the ledger aloud and the singer answered.', true)).toBe(false);
  });
});
