import { describe, it, expect } from 'vitest';
import {
  tierFromFit, goldFor, recruitCandidate, mercToSlate,
} from '../src/storyGen/chainPlay.js';
import type { Bible } from '../src/storyGen/chainGen.js';
import type { Merc } from '../src/types.js';

describe('tierFromFit (engine owns the outcome tier)', () => {
  it('an empty party always fails', () => {
    expect(tierFromFit(6, 0)).toBe('failure');
  });
  it('high fit + best luck is a clean win', () => {
    expect(tierFromFit(6, 3, () => 0.99)).toBe('clean_win'); // 6 + 2 = 8
  });
  it('high fit + worst luck still wins narrowly', () => {
    expect(tierFromFit(5, 3, () => 0)).toBe('narrow_win'); // 5 + 0 = 5
  });
  it('middling fit + worst luck is a partial loss', () => {
    expect(tierFromFit(3, 3, () => 0)).toBe('partial_loss'); // 3 + 0 = 3
  });
  it('poor fit + worst luck is a failure', () => {
    expect(tierFromFit(1, 3, () => 0)).toBe('failure'); // 1 + 0 = 1
  });
});

describe('goldFor (engine owns reward numbers)', () => {
  it('scales base by stakes and tier multiplier', () => {
    expect(goldFor('uncommon', 'narrow_win')).toBe(8);
    expect(goldFor('rare', 'clean_win')).toBe(24); // 16 * 1.5
    expect(goldFor('legendary', 'partial_loss')).toBe(13); // round(32 * 0.4)
  });
  it('a failure pays nothing', () => {
    expect(goldFor('rare', 'failure')).toBe(0);
  });
});

function bibleWith(cast: Bible['cast']): Bible {
  return {
    title: 'T', leadBlurb: 'a plain job posting that says nothing',
    cast,
    situation: 'the settled hidden truth, told straight and plainly here',
    tensions: ['a clashes with b over the debt'],
    openDirections: [{ kind: 'active', hook: 'someone asks the company for help' }, 'a death drifts closer'],
  };
}

const person = (name: string, who: string, history: string[]) => ({
  person: { name, who, history, wants: 'something', feels: 'something' },
});

describe('recruitCandidate (a new story face can join on a win)', () => {
  const slate = new Set(['Roselle', 'Marek']);
  it('returns the first cast member who is not on the roster slate', () => {
    const bible = bibleWith([
      { ...person('Roselle', 'a roster merc', ['raised on the docks']) },
      { ...person('Jorun', 'a travelling fence', ['lost his brother to a debt']) },
    ]);
    const rec = recruitCandidate(bible, slate);
    expect(rec).not.toBeNull();
    expect(rec!.name).toBe('Jorun');
    expect(rec!.background).toContain('a travelling fence');
    expect(rec!.background).toContain('lost his brother to a debt'); // bedrock appended
  });
  it('ignores the AI coined flag and trusts slate membership', () => {
    const bible = bibleWith([
      { ...person('Marek', 'a roster merc', ['ran from a name']), coined: true },
      { ...person('Veska', 'a sharp clerk', ['keeps the crooked ledgers']) },
    ]);
    // Marek is coined-flagged but IS on the slate, so Veska (the real new face) wins.
    expect(recruitCandidate(bible, slate)!.name).toBe('Veska');
  });
  it('never recruits a deceased cast member', () => {
    const bible = bibleWith([
      { ...person('Keld', 'the murdered merchant, found dead in the yard', ['was killed over a debt']) },
      { ...person('Veska', 'a sharp clerk', ['keeps the crooked ledgers']) },
    ]);
    expect(recruitCandidate(bible, slate)!.name).toBe('Veska');
  });
  it('returns null when every cast face is on the slate', () => {
    const bible = bibleWith([
      { ...person('Roselle', 'a roster merc', ['raised on the docks']) },
      { ...person('Marek', 'another roster merc', ['ran from a name']) },
    ]);
    expect(recruitCandidate(bible, slate)).toBeNull();
  });
});

describe('mercToSlate (roster is the cast)', () => {
  const merc: Merc = {
    id: 'm1', name: 'Dren',
    attrs: { physical: 4, agility: 4, intelligence: 3, charisma: 3, willpower: 3 },
    tags: [
      { id: 'gender:male', category: 'gender', rarity: 'common', tier: 5, label: 'Male' },
      { id: 't1', category: 'temperament', rarity: 'common', tier: 5, label: 'Brave' },
    ],
    veterancy: 0, wage: 1, hp: 3,
  };
  it('maps a merc to a mercenary-role slate character with tag labels', () => {
    const s = mercToSlate(merc);
    expect(s.id).toBe('m1');
    expect(s.role).toBe('mercenary');
    expect(s.tags).toEqual(['Male', 'Brave']);
    expect(s.surface).toContain('Brave'); // composed surface when no backstory
  });
  it('uses an explicit backstory as the surface when present', () => {
    const s = mercToSlate({ ...merc, backstory: 'A deserter from the levy.' });
    expect(s.surface).toBe('A deserter from the levy.');
  });
});
