// Plain words for a card's tags (docs/STORYTELLER.md §2.4.2) — what the saga storyteller's calls say about a person:
// their race, sex, a trait or two and a trade, never the engine's tag ids. Ported line for line from the saga lab at
// tag `storyteller-build-src` (scripts/sagalab/v4lab.ts, R5): the shipped text is the text that was measured.
// Pure.

import { CONCEPT } from './tags.js';
import type { Card } from './cards.js';

export const BACKGROUND_WORD: Record<string, string> = {
  ruler: 'noble', soldier: 'soldier', criminal: 'outlaw', priest: 'priest', mystic: 'mystic', artisan: 'artisan',
  adventurer: 'wanderer', entertainer: 'entertainer', merchant: 'merchant', scholar: 'scholar', courtesan: 'courtesan',
  sailor: 'sailor', slave: 'freed slave', hunter: 'hunter', peasant: 'peasant', servant: 'servant',
};
export const TRAIT_WORD: Record<string, string> = {
  cool: 'calm', hotheaded: 'hot-headed', serious: 'serious', playful: 'playful', greedy: 'greedy', generous: 'generous',
  loner: 'solitary', gregarious: 'sociable', dominant: 'domineering', submissive: 'meek', calculating: 'shrewd',
  instinctive: 'impulsive', muscular: 'strong', scrawny: 'thin', nimble: 'quick', clumsy: 'clumsy', clever: 'clever',
  dull: 'slow-witted', beautiful: 'good-looking', ugly: 'plain-faced', tough: 'tough', sickly: 'sickly', tall: 'tall', short: 'short',
  famous: 'famous', infamous: 'notorious', 'high-born': 'high-born',
};
export const SKILL_NOUN: Record<string, string> = {
  melee: 'a brawler', ranged: 'an archer', leadership: 'a leader', social: 'a talker', roguery: 'a thief', lore: 'a scholar',
  heal: 'a healer', craft: 'a tinkerer', nature: 'a tracker', performance: 'a performer', intimidation: 'an enforcer', food: 'a cook',
};
export const RACE_WORD: Record<string, string> = { human: 'human', elf: 'elf', wolfman: 'wolfkin', lizardman: 'lizardfolk' };

const groupOfTag = (c: string) => CONCEPT[c]?.group;
export const raceOf = (c: Card) => c.tags.find(t => groupOfTag(t.concept) === 'race')?.concept ?? 'human';
export const sexOf = (c: Card): 'male' | 'female' => c.tags.some(t => t.concept === 'female') ? 'female' : 'male';
export const manWoman = (sex: 'male' | 'female') => sex === 'female' ? 'woman' : 'man';
export const an = (w: string) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
export function plainWords(c: Card, n: number): string[] {
  const words = c.tags.filter(t => ['personality', 'body', 'standing'].includes(groupOfTag(t.concept) ?? '')).map(t => TRAIT_WORD[t.concept]).filter((w): w is string => !!w);
  return words.slice(0, n);
}
export const backgroundOf = (c: Card) => c.tags.map(t => BACKGROUND_WORD[t.concept]).find(Boolean);
export const topSkill = (c: Card) => [...c.tags].filter(t => groupOfTag(t.concept) === 'skill' && SKILL_NOUN[t.concept])
  .sort((a, b) => (b.tier ?? 1) - (a.tier ?? 1))[0]?.concept;
/** a soldier's trade, ONE source for every call: the plan's cast entry for a personal saga's soldier and every
 *  report's `soldiers[].is` (they named the same soldier "wanderer" and "a cook"). The top skill's noun, else the
 *  background word */
export const soldierTrade = (c: Card) => { const s = topSkill(c); return s ? SKILL_NOUN[s]!.replace(/^an? /, '') : backgroundOf(c) ?? 'wanderer' };
/** a soldier as the report meets them: "a human man, hot-headed, a brawler" (§2.9.3) */
export function soldierIs(c: Card): string {
  const w = plainWords(c, 1)[0];
  return [an(`${RACE_WORD[raceOf(c)] ?? raceOf(c)} ${manWoman(sexOf(c))}`), w, an(soldierTrade(c))].filter(Boolean).join(', ');
}
/** a focal card's trade for the plan, on its own key like a coined person's: the plan's label ends in
 *  the trade, and a trade buried in a traits list ("human, hunter, slow-witted, thin") left it guessing */
export const tradeOf = (c: Card) => { const s = topSkill(c); return backgroundOf(c) ?? (s ? SKILL_NOUN[s]!.replace(/^an? /, '') : 'wanderer') };
/** a focal card's traits: two plain words ("greedy, calm"). (R5 verify 2) Not the race, which has its own key: led by the
 *  race, the list was copied whole into the label the plan builds from race and trade ("thin, slow-witted human hunter"),
 *  and the comma cut left "thin" */
export const traitsOf = (c: Card) => plainWords(c, 2).join(', ') || undefined;
