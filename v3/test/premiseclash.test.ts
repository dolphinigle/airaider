// The genesis guard's PREMISE CLASH (game.ts premiseFingerprint) — it fired on every saga after the
// first, because the arc's format token, the dealt region, the hire's frame and plain English all
// counted as shared "premise" words. Plus two ingestion guards a Sonnet playtest exposed: a model's
// self edge, and quirks written as sentences.
import { describe, it, expect } from 'vitest';
import { premiseFingerprint, PREMISE_CLASH, normQuirks } from '../src/game/game.js';
import { modelEdges } from '../src/engine/lore.js';
import { render } from '../cli/format.js';

// four real Sonnet bibles from one campaign (2026-10-02 playtest)
const drowned = { title: "The Drowned Man's Horses", kernel: 'A man who drowned with a barge is shopping for pack-horses, and the gold he sank is not the sort that stays buried quietly.', goal: "Find Fardulf, the drowned man seen buying horses at the fairs, and bring the hoard he is the key to into Meenai-Enoo's hands at her windmill farm." };
const choirA = { title: "Breaking the Choirboy's Oath", kernel: "A scrawny barge-hand's boyhood vow of fealty to a patron who sold it behind his back comes due, and the company must cheat the seller out of her own bargain.", goal: "The company means to free Fardulf of Taxilteer's claim on his boyhood oath and keep both him and the fort's timber-leave." };
const choirB = { title: "Ringing Out the Choirboy's Oath", kernel: "A runaway boy's sworn service to a marsh lady comes to collect at the fort, and the only way to break it is to find the bell he was blamed for stealing.", goal: "The company means to recover the chapel's stolen silver bell and bring it to the fort, so that the marsh lady's claim on Fardulf's fealty falls." };
const favors = { title: "Pouring Out the Dead Man's Favors", kernel: "A barkeep's foster-daughter inherits every favor her dead guardian ever banked, and a toll-keeper who owes the most would sooner see the debt die with him.", goal: "The company means to claim the favors Haize's dead guardian left her, and bring the proof of them home to the fort." };

const shared = (fp: ReturnType<typeof premiseFingerprint>, a: typeof drowned, b: typeof drowned) =>
  [...fp(a)].filter(w => fp(b, 'forests').has(w));

describe('premise clash — premise words only', () => {
  const fp = premiseFingerprint('forests', ['Western Forests — Old-growth elven forests west of the fort.', 'Fardulf', 'Haize', 'Rodburga']);
  it('a re-rolled twin clashes even at the recent bar', () => {
    expect(shared(fp, choirA, choirB).length).toBeGreaterThanOrEqual(PREMISE_CLASH.recent);
  });
  it('unrelated sagas that share only everyday words stay under the live bar', () => {
    expect(shared(fp, favors, choirB).length).toBeLessThan(PREMISE_CLASH.live);
    expect(shared(fp, choirA, drowned).length).toBeLessThan(PREMISE_CLASH.live);
  });
  it('format tokens, the dealt region, the hire frame and the soldiers never count', () => {
    const a = { title: 'Fetch for the Fort', kernel: 'The company hires out to fetch a thing from the forest west of Thornhollow → yields: first sign at the river ford.', goal: 'The company means to bring it back to the fort with Fardulf.' };
    const b = { title: 'Recover at the Ford', kernel: 'A client hires mercenaries to recover what was lost in the Western Forests → yields: the loggers\' winter huts.', goal: 'Deliver it to the fort with Haize; Fardulf must return first.' };
    expect(shared(fp, a, b)).toEqual([]);
  });
});

describe('ingestion guards', () => {
  it("drops a model's self edge, keeps the rest", () => {
    const es = [
      { from: 'c11', to: 'c11', type: 'party-to', blurb: 'placeholder', importance: 0.1 },
      { from: 'c2', to: 'c9', type: 'scarred-by', blurb: 'took a blade for her', importance: 0.6 },
    ];
    expect(modelEdges(es).map(e => e.blurb)).toEqual(['took a blade for her']);
    expect(modelEdges(undefined)).toEqual([]);
  });
  it('quirks become habit phrases whatever shape the writer used', () => {
    expect(normQuirks(['Sits with her back to a wall and counts the doors.', 'coughs into her sleeve, then grins', ' Spits before a fight. ', 'I-shaped scar']))
      .toEqual(['sits with her back to a wall and counts the doors', 'coughs into her sleeve, then grins', 'spits before a fight', 'I-shaped scar']);
  });
});

describe('CLI reckoning stream', () => {
  it('a block that spans lines keeps the stamp gutter', () => {
    const out = render.reckoningLine('"He talked of you," Pejureel said.\n"Kindly?"\n\n"Mostly."', 10_200);
    const lines = out.split('\n');
    expect(lines[0]).toBe(' [+10.2s] "He talked of you," Pejureel said.');
    expect(lines[1]).toBe(' '.repeat(10) + '"Kindly?"');
    expect(lines[2]).toBe('');
    expect(lines[3]).toBe(' '.repeat(10) + '"Mostly."');
  });
});
