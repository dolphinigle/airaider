// The engine deals ONE place already introduced ("a mill town, Sedgedale") and owns both its
// introduction and its punctuation. Measured 2026-08-28: heavy one-off cards named 2-3 invented
// toponyms cold, and prompt wording moved it 0% -> 0%. See docs/PLAYTEST_NOTES.md.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { introducePlace } from '../src/engine/names.js';
import { Rng } from '../src/engine/rng.js';

const splice = (dealt: string, situation: string): string =>
  (new Game(new MockProvider(1), 1) as unknown as {
    introduceDealtPlace(d: string, o: { situation: string }): { situation: string };
  }).introduceDealtPlace(dealt, { situation }).situation;

describe('introducePlace', () => {
  it('hands the writer a phrase that is already an introduction', () => {
    const p = introducePlace('Sedgedale', new Rng(3));
    expect(p).toMatch(/^(a|an|the) [a-z' ]+, Sedgedale$/);
  });
});

describe('the engine puts the introduction back', () => {
  const D = 'a mill town, Sedgedale';

  it('introduces a bare name mid-sentence', () => {
    expect(splice(D, 'The herd was driven to Sedgedale and never came back.'))
      .toBe('The herd was driven to a mill town, Sedgedale, and never came back.');
  });

  it('capitalises and closes when the name opens the sentence', () => {
    expect(splice(D, 'Sedgedale will pay coin.'))
      .toBe('A mill town, Sedgedale, will pay coin.');
    expect(splice(D, 'A cart was taken. Sedgedale will pay coin.'))
      .toBe('A cart was taken. A mill town, Sedgedale, will pay coin.');
  });

  it('leaves the writer\'s own introduction alone, but still closes it', () => {
    expect(splice(D, 'The gravedigger of the mill town, Sedgedale took it.'))
      .toBe('The gravedigger of the mill town, Sedgedale, took it.');
  });

  it('does not double a comma that is already there', () => {
    const done = 'The herd went to a mill town, Sedgedale, and stayed.';
    expect(splice(D, done)).toBe(done);
  });

  it('never touches a possessive or a sentence end', () => {
    expect(splice(D, "The herd sits on a mill town, Sedgedale's common."))
      .toBe("The herd sits on a mill town, Sedgedale's common.");
    expect(splice(D, 'The herd was driven to a mill town, Sedgedale.'))
      .toBe('The herd was driven to a mill town, Sedgedale.');
  });

  it('only ever touches the FIRST mention — later ones are correct as they stand', () => {
    expect(splice(D, 'A herd left Sedgedale. Sedgedale wants it back.'))
      .toBe('A herd left a mill town, Sedgedale. Sedgedale wants it back.');
  });

  it('does nothing when the card never used the place, or nothing was dealt', () => {
    const t = 'A herd went missing from the old wood.';
    expect(splice(D, t)).toBe(t);
    expect(splice('', t)).toBe(t);
  });
});
