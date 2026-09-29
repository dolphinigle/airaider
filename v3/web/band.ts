// VERDICT WORDS + COLOURS for the GUI. No game math lives here: the engine hands every view a
// `band` (the POOLED quest verdict, src/engine/roll.ts oddsBand) or a `strength` (one place's
// colour, slotStrength). This file only maps those engine words to display words and css classes.
// R2 (designer 2026-09-30): only the pooled quest gets the 5 words; a single slot/card gets a
// strong / fair / weak colour, never a band word (it would contradict the pooled roll).

export type Band = 'likely' | 'even' | 'partial' | 'long' | 'hopeless';
export type Strength = 'strong' | 'fair' | 'weak';

/** the pooled verdict as the player reads it */
export const BAND_WORD: Record<Band, string> = {
  likely: 'likely',
  even: 'coin-flip',
  partial: 'a partial at best',
  long: 'long shot',
  hopeless: 'hopeless',
};

/** the 5 bands worst → best, for a band meter */
export const BAND_ORDER: Band[] = ['hopeless', 'long', 'partial', 'even', 'likely'];

/** css class for a pooled band: 'good' | 'even' | 'part' | 'bad' (null/unknown → '') */
export function bandCls(b: Band | null | undefined): string {
  switch (b) {
    case 'likely': return 'good';
    case 'even': return 'even';
    case 'partial': return 'part';
    case 'long': case 'hopeless': return 'bad';
    default: return '';
  }
}

/** a single place's strength as a word (for a tooltip or a sheet — never as the quest verdict) */
export const STRENGTH_WORD: Record<Strength, string> = { strong: 'strong', fair: 'fair', weak: 'weak' };

/** css class for one place's strength: 'good' | 'part' | 'bad' (null/unknown → '') */
export function strengthCls(s: Strength | null | undefined): string {
  return s === 'strong' ? 'good' : s === 'fair' ? 'part' : s === 'weak' ? 'bad' : '';
}

/** a shape per strength, so a token never says it by colour alone (▲ strong · ● fair · ▼ weak) */
export const STRENGTH_MARK: Record<Strength, string> = { strong: '▲', fair: '●', weak: '▼' };

/** one coin badge, one format everywhere (hand, seat, map drag, sheet): the unit and the engine's
 *  strength word — "DEX 28" read as an attribute, and a colour alone is not a word */
export function coinBadge(coins: number, strength: Strength | null | undefined, attr?: string): string {
  return `${attr ? `${attr} ` : ''}${Math.round(coins)}c · ${strength ? STRENGTH_WORD[strength] : '?'}`;
}

