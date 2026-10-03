// Two ingestion guards a Sonnet playtest exposed: a model's self edge, and quirks written as sentences; and the
// reckoning's stamp gutter. (The genesis premise-clash cases went with the genesis call — v4 plans instead.)
import { describe, it, expect } from 'vitest';
import { normQuirks } from '../src/game/game.js';
import { modelEdges } from '../src/engine/lore.js';
import { render } from '../cli/format.js';

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
