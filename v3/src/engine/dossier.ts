// THE LIVING DOSSIER (docs/STORY_ENGINE.md §4; docs/STORYTELLER.md North Star 0, designer 2026-10-05): a soldier carries a
// BOUNDED dossier — who they are now, the events that marked them, the people who matter to them — refreshed when a saga
// they were part of resolves (their own personal saga, and sagas where they decided a job or were hurt; the people a saga
// left them come in through the lore). Engine-composed from what the game already stores, every line one the player read:
// their last change (character.grown), the chronicle lines where they acted (SagaRecord.lines), lore edges. No AI call.
// Both UIs show it (the GUI soldier sheet, the CLI's `merc`), and it seeds their NEXT personal saga (chain B, C…): a dealt
// situation is that saga's seed, its new matter (engine/saga.ts dealSaga `next`), and the dossier's Now — who they became —
// rides beside it (`livingSeed`). Only the Now and the person the saga seats: the marks are settled chapters, and the plan
// builds on whatever it is handed — sent them as its seed, 4 of 8 chain Bs reopened the settled matter (its goat, its
// crime, its lie: runs/pers1/CB_g1). The old wrong their last chapter settled (`historyOf`) rides on the world for the
// log-only retelling lint and is never sent: handed it as `history` ("never retold"), 8 of 8 real chain Bs retold it, 3
// word for word (runs/_superseded/pers1/CB_history_g1).
//
// Pure: the game (game.ts refreshLiving) and the seed lab (scripts/sagalab/seedlab.ts, arm CB) call the same functions.

import type { GrownEntry } from './cards.js';

/** 🛠 the dossier's bound, in lines: "Now", the marks (older ones condensed to one "Earlier" line), "People" */
export const LIVING_MAX_LINES = 6;
/** 🛠 the people who matter, at most */
export const LIVING_PEOPLE = 2;

/** a saga's person as a seed may call them: by label, unless the next saga seats them (`unnamed`) */
export interface Stranger { name: string; label: string }
/** one resolved saga as it marked a soldier: their own saga's ending line (`own`), the ending of the saga that was about them
 *  before they joined (`about`: the hired saga that brought them in), the job they decided, or the job they were hurt in
 *  (`band`: the wound's band word). `text` is the chronicle line the player read; `people` that saga's cast but the
 *  soldier — the next chapter's seed calls them by label (a seed may only name people the next saga can cast) */
export interface LifeMark { title: string; kind: 'own' | 'about' | 'deed' | 'hurt'; text: string; band?: string; people?: readonly Stranger[] }
/** someone who matters to them: a lore face by id, how it is called, and the tie (an edge type) */
export interface LifePerson { id: string; name: string; label: string; tie: string }
export interface LivingDossier {
  /** who they are now: their last change (the latest grown entry, without its title), else their card line; none known yet:
   *  absent (never a filler line) */
  now?: string;
  /** the events that marked them, newest first, as the sheet prints them */
  marks: string[];
  /** the people the shown marks' sagas had (not the soldier): the next chapter's seed calls them by label (`livingSeed`) */
  strangers?: Stranger[];
  /** older marks, condensed to their titles */
  earlier?: string;
  /** the people who matter to them, strongest first */
  people: LifePerson[];
  /** the cycle it was refreshed */
  cycle: number;
}

const bare = (s: string) => s.trim().replace(/[.!?]+$/, '');
const sentence = (s: string) => { const t = s.trim(); return t ? `${t[0]!.toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}` : '' };
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** a saga's people by label, not name ("the elf moneylender"), in a line the next chapter's seed tells: a seed may only name
 *  people the saga can cast (game.ts personalEdges), and a named stranger the plan cannot seat is invented anew. The whole
 *  name, then its first word alone; a sentence (or a mark's text, after its colon) opened by one keeps its capital */
export function unnamed(text: string, people: readonly { name: string; label: string }[]): string {
  let t = text;
  for (const p of people) {
    const bareLabel = p.label.replace(/^(?:an?|the)\s+/i, '').split(',')[0]!.trim(), label = `the ${bareLabel}`;
    const head = esc(bareLabel.split(/\s+/).at(-1) ?? bareLabel);
    const whole = p.name.trim(), first = whole.split(/\s+/)[0]!;
    // the name with an appositive of its own trade beside it is one person: "the moneylender Benjamund", "Benjamund, the
    // moneylender," — never "the moneylender the human moneylender"
    for (const n of [...new Set([whole, ...(first.length > 2 && /^\p{Lu}/u.test(first) ? [first] : [])])])
      t = t.replace(new RegExp(`(?:\\b[Tt]he\\s+(?:(?:[\\p{L}-]+\\s+){0,2}?${head}\\s+)?)?(?<![\\p{L}'])${esc(n)}(?![\\p{L}])(?:,\\s+(?:[Tt]he|[Aa]n?)\\s+(?:[\\p{L}-]+\\s+){0,2}?${head}\\b,?)?`, 'gu'), label);
  }
  return t.replace(/(^|[.!?:]["”]?\s+)the /g, (_m, a: string) => `${a}The `);
}

/** a tie as a plain noun, the same from either side (an edge's direction is not trusted: lore.ts renderDossier) */
const TIE: Record<string, string> = {
  'rival-of': 'a rival', 'scarred-by': 'a scar', 'bonded-by': 'a bond', owes: 'a debt between them', 'saved-by': 'a life saved',
  'kin-of': 'kin', 'betrayed-by': 'a betrayal', 'served-with': 'served together', 'born-in': 'home', 'member-of': 'one of theirs',
  'captive-of': 'a captivity', loves: 'love', fears: 'fear', defeated: 'a defeat', 'freed-by': 'a rescue', 'party-to': 'a shared matter',
};
export const tieWord = (type: string): string => TIE[type] ?? 'a shared matter';

/** who they are now: the change of their last personal saga, read without "After <title>: " (grownLine's frame) */
export function nowOf(grown: readonly GrownEntry[] | undefined, who: string | undefined): string | undefined {
  const last = grown?.at(-1);
  if (last) {
    const frame = last.title ? `After ${last.title}: ` : undefined;
    const change = frame && last.line.startsWith(frame) ? last.line.slice(frame.length) : last.line.replace(/^After [^:]{1,80}: /, '');
    return sentence(change);
  }
  return who?.trim() ? sentence(who) : undefined;
}

/** one mark as the sheet prints it */
export function markLine(m: LifeMark, name: string): string {
  const first = firstName(name);
  if (m.kind === 'own') return `${m.title}, ${first}'s own matter: ${sentence(m.text)}`;
  if (m.kind === 'about') return `${m.title}, the saga about ${first}: ${sentence(m.text)}`;
  if (m.kind === 'deed') return `${m.title}: ${bare(m.text)} — ${first} decided it.`;
  return `${m.title}: ${bare(m.text)} — ${first} was hurt${m.band ? ` (${m.band})` : ''}.`;
}

/** the dossier, bounded: "Now", the newest marks (the rest condensed to one "Earlier" line of titles), "People". `marks`
 *  newest first. Nothing to tell (no change, no card line, no mark, nobody): none */
export function composeLiving(a: { name: string; who?: string; grown?: readonly GrownEntry[]; marks: readonly LifeMark[]; people: readonly LifePerson[]; cycle: number }): LivingDossier | undefined {
  const now = nowOf(a.grown, a.who);
  if (!now && !a.marks.length && !a.people.length) return undefined;
  const people = a.people.slice(0, LIVING_PEOPLE);
  const room = LIVING_MAX_LINES - 1 - (people.length ? 1 : 0);
  const fits = a.marks.length <= room;
  const shown = fits ? a.marks : a.marks.slice(0, room - 1);
  const older = fits ? [] : a.marks.slice(room - 1);
  const titles = [...new Set(older.map(m => m.title))];
  return {
    ...(now ? { now } : {}),
    marks: shown.map(m => markLine(m, a.name)),
    ...((xs => xs.length ? { strangers: xs } : {})([...new Map(shown.flatMap(m => m.people ?? []).map(p => [p.name, { name: p.name, label: p.label }])).values()])),
    ...(titles.length ? { earlier: `${titles.join(', ')}.` } : {}),
    people: people.map(p => ({ ...p })),
    cycle: a.cycle,
  };
}

const personText = (p: LifePerson) => `${p.name}, ${p.label} — ${tieWord(p.tie)}`;
/** the dossier as both UIs print it (at most LIVING_MAX_LINES lines). `people`: only these named on the People line;
 *  `strangers`: those its marks call by label (the seed: livingSeed) */
export function livingLines(d: LivingDossier, people: readonly LifePerson[] = d.people, strangers: readonly Stranger[] = []): string[] {
  return [
    ...(d.now ? [`Now: ${d.now}`] : []),
    ...d.marks.map(m => `- ${strangers.length ? unnamed(m, strangers) : m}`),
    ...(d.earlier ? [`Earlier: ${d.earlier}`] : []),
    ...(people.length ? [`People: ${people.map(personText).join('; ')}.`] : []),
  ];
}

/** a NEXT personal saga's `now` (chain B, C…; the plan's and pick's, beside the dealt situation): who they became — the
 *  dossier's Now, and the People line naming only the person the saga seats (`seated`; a seed may only name people the saga
 *  can cast, so anyone else its sagas had is called by label). Never the marks: settled chapters, sent as material, were
 *  rebuilt (their people, things and outcome reopened) */
export function livingSeed(d: LivingDossier, seated?: string): string {
  const keep = d.people.filter(p => p.id === seated);
  const strangers = (d.strangers ?? []).filter(s => !keep.some(k => k.name === s.name));
  return [
    ...(d.now ? [strangers.length ? unnamed(d.now, strangers) : d.now] : []),
    ...(keep.length ? [`People: ${keep.map(personText).join('; ')}.`] : []),
  ].join('\n');
}

/** a NEXT personal saga's `history` (SagaWorld.history; the retelling lint's reference, never sent): the old wrong their last
 *  chapter settled — the past it told (else the seed it was told from). None before any personal saga changed them */
export function historyOf(grown: readonly GrownEntry[] | undefined): string | undefined {
  const last = grown?.at(-1);
  const h = last?.past?.trim() || last?.seed?.trim();
  return h || undefined;
}
